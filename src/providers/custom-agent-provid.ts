import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { fetch as expoFetch } from 'expo/fetch';

// 流式响应转换函数
async function transformStreamingResponse(response: Response, debugLog: (message: string, data?: any) => void): Promise<Response> {
    try {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let currentEventType = '';

        // 创建一个新的可读流
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // 保留最后一个不完整的行

                        for (const line of lines) {
                            if (line.trim() === '') continue;

                            // 解析 SSE 格式
                            if (line.startsWith('event:')) {
                                currentEventType = line.slice(6).trim();
                                debugLog('SSE Event:', currentEventType);
                                // 不直接发送事件类型，而是在处理数据时使用
                            } else if (line.startsWith('data:')) {
                                const dataStr = line.slice(5).trim();
                                debugLog('SSE Data:', dataStr);
                                debugLog('Current Event Type:', currentEventType);

                                try {
                                    const data = JSON.parse(dataStr);

                                    // 转换你的自定义 SSE 格式到 OpenAI 格式
                                    const openAIFormat = transformStreamingDataToOpenAIFormat(data, currentEventType, debugLog);

                                    if (openAIFormat) {
                                        // 发送转换后的数据
                                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
                                    }
                                } catch (parseError) {
                                    debugLog('Failed to parse SSE data:', parseError);
                                    // 如果解析失败，发送原始数据
                                    controller.enqueue(new TextEncoder().encode(`data: ${dataStr}\n\n`));
                                }

                                // 重置当前事件类型
                                currentEventType = '';
                            }
                        }
                    }

                    // 处理剩余的 buffer
                    if (buffer.trim()) {
                        controller.enqueue(new TextEncoder().encode(buffer));
                    }

                    // 发送流结束标记
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    debugLog('Stream processing error:', error);
                    controller.error(error);
                } finally {
                    reader.releaseLock();
                }
            }
        });

        return new Response(stream, {
            status: response.status,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        debugLog('Failed to transform streaming response:', error);
        throw new Error(`Failed to transform streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// 流式数据格式转换函数
function transformStreamingDataToOpenAIFormat(
    data: CustomAgentResponse | CustomMessageResponse | CustomPluginCallResponse | TextContentEvent,
    eventType: string = '',
    debugLog?: (message: string, data?: any) => void
): OpenAIStreamingChunk | null {
    // 如果数据已经是 OpenAI 格式，直接返回
    if ('choices' in data && Array.isArray(data.choices)) {
        return data as unknown as OpenAIStreamingChunk;
    }

    try {
        let delta = { content: '' };
        let finishReason = null;

        // 处理文本内容事件（event: text）
        if (eventType === 'text' && data.object === 'content' && (data as TextContentEvent).type === 'text') {
            const textEvent = data as TextContentEvent;
            debugLog?.('Processing text content event:', { text: textEvent.text, delta: textEvent.delta });

            if (textEvent.delta && textEvent.text) {
                delta.content = textEvent.text;
            }

            return {
                id: textEvent.msg_id || `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: 'custom-agent',
                choices: [{
                    index: textEvent.index || 0,
                    delta: delta,
                    finish_reason: null,
                }],
            };
        }

        // 处理你的自定义响应格式
        if (data.object === 'response') {
            // 处理响应状态消息
            if (data.status === 'created') {
                // 开始响应，返回初始消息
                return {
                    id: data.id || `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: data.created_at || Math.floor(Date.now() / 1000),
                    model: 'custom-agent',
                    choices: [{
                        index: 0,
                        delta: { role: 'assistant', content: '' },
                        finish_reason: null,
                    }],
                };
            } else if (data.status === 'in_progress') {
                // 响应进行中，可能包含内容
                return {
                    id: data.id || `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: data.created_at || Math.floor(Date.now() / 1000),
                    model: 'custom-agent',
                    choices: [{
                        index: 0,
                        delta: { content: '' }, // 空内容，等待实际内容
                        finish_reason: null,
                    }],
                };
            } else if (data.status === 'completed') {
                // 响应完成
                return {
                    id: data.id || `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: data.created_at || Math.floor(Date.now() / 1000),
                    model: 'custom-agent',
                    choices: [{
                        index: 0,
                        delta: {},
                        finish_reason: 'stop',
                    }],
                };
            }
        } else if (data.object === 'message' && data.role === 'assistant') {
            // 处理实际的消息内容，但避免重复输出已流式显示的文本
            if (data.content && Array.isArray(data.content)) {
                const textContent = data.content.find((item: any) => item.type === 'text' && item.text);
                if (textContent) {
                    // 检查是否是已完成的消息，如果是，则不输出内容（避免与流式文本重复）
                    if (data.status === 'completed') {
                        // 对于已完成的消息，只发送结束标记，不重复内容
                        finishReason = 'stop';
                        delta = {}; // 空内容，避免重复
                    } else {
                        // 对于进行中的消息，正常输出内容
                        delta.content = textContent.text;
                    }
                }
            }

            return {
                id: data.id || `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: data.created_at || Math.floor(Date.now() / 1000),
                model: 'custom-agent',
                choices: [{
                    index: 0,
                    delta: delta,
                    finish_reason: finishReason,
                }],
            };
        } else if (data.object === 'plugin_call') {
            // 处理插件调用，保留完整的插件信息结构
            const pluginData = data.content?.find((item: any) => item.type === 'data')?.data;
            if (pluginData) {
                // 创建一个特殊的插件调用标记，包含完整的插件信息
                const pluginContent = {
                    type: 'plugin_call',
                    pluginName: pluginData.name || 'unknown',
                    pluginStatus: data.status || 'created',
                    pluginData: pluginData,
                    pluginId: data.id,
                    timestamp: data.created_at || Math.floor(Date.now() / 1000)
                };

                // 使用特殊的标记来包围插件 JSON，便于前端识别
                const jsonContent = JSON.stringify(pluginContent);
                const markedContent = `\u0001PLUGIN_CALL_START\u0001${jsonContent}\u0001PLUGIN_CALL_END\u0001`;

                return {
                    id: data.id || `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: data.created_at || Math.floor(Date.now() / 1000),
                    model: 'custom-agent',
                    choices: [{
                        index: 0,
                        delta: {
                            content: markedContent
                        },
                        finish_reason: null,
                    }],
                };
            }
        }

        // 对于不识别的事件类型，返回null以过滤掉
        if (eventType && eventType !== 'text') {
            debugLog?.('Ignoring non-text event:', { eventType, data });
            return null;
        }

        // 如果无法识别格式，返回一个基本的 chunk
        return {
            id: (data as any).id || `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: (data as any).created_at || Math.floor(Date.now() / 1000),
            model: 'custom-agent',
            choices: [{
                index: 0,
                delta: { content: '' },
                finish_reason: null,
            }],
        };
    } catch (error) {
        debugLog?.('Error transforming streaming data to OpenAI format:', error);

        // 返回错误 chunk
        return {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'custom-agent',
            choices: [{
                index: 0,
                delta: { content: '[Error processing chunk]' },
                finish_reason: 'stop',
            }],
        };
    }
}

// 响应格式转换函数
function transformResponseToOpenAIFormat(responseData: CustomAgentResponse): OpenAICompatibleResponse {
    // 如果响应已经是 OpenAI 格式，直接返回
    if ('choices' in responseData && Array.isArray(responseData.choices)) {
        return responseData as unknown as OpenAICompatibleResponse;
    }

    // 处理你的自定义响应格式
    try {
        let content = '';
        let role = 'assistant';
        let finishReason = 'stop';

        // 从 output 数组中提取消息内容
        if (responseData.output && Array.isArray(responseData.output)) {
            const assistantMessage = responseData.output.find((msg: any) => msg.role === 'assistant');
            if (assistantMessage && assistantMessage.content && Array.isArray(assistantMessage.content)) {
                const textContent = assistantMessage.content.find((item: any) => item.type === 'text' && item.text);
                if (textContent && textContent.text) {
                    content = textContent.text;
                }
            }
        }

        // 如果没有找到内容，尝试其他可能的字段
        if (!content) {
            content = (responseData as any).response || (responseData as any).message || (responseData as any).content || JSON.stringify(responseData);
        }

        // 根据 status 设置 finish_reason
        if (responseData.status === 'in_progress') {
            finishReason = 'length';
        } else if (responseData.status === 'error') {
            finishReason = 'stop';
        } else {
            finishReason = 'stop';
        }

        // 构建 OpenAI 兼容的响应格式
        return {
            id: responseData.id || `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: responseData.created_at || Math.floor(Date.now() / 1000),
            model: 'custom-agent',
            choices: [
                {
                    index: 0,
                    message: {
                        role: role as 'assistant',
                        content: content,
                    },
                    finish_reason: finishReason as 'stop' | 'length' | 'content_filter',
                }
            ],
            usage: responseData.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
            // 如果有错误信息，包含错误字段
            ...(responseData.status === 'error' && {
                error: {
                    message: (responseData as any).error || (responseData as any).message || 'Unknown error',
                    type: 'invalid_request_error',
                    code: (responseData as any).error_code || 'unknown_error',
                }
            }),
        };
    } catch (error) {
        console.error('Error transforming response to OpenAI format:', error);

        // 如果转换失败，返回一个基本的错误响应
        return {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'custom-agent',
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: 'Error processing response',
                    },
                    finish_reason: 'stop',
                }
            ],
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
            error: {
                message: 'Failed to transform response format',
                type: 'invalid_request_error',
                code: 'transformation_error',
            }
        };
    }
}

// 响应数据验证函数
function validateResponseData(responseData: any, debugLog: (message: string, data?: any) => void): void {
    if (!responseData || typeof responseData !== 'object') {
        debugLog('Invalid response data: not an object', responseData);
        throw new Error('Invalid response format: expected an object');
    }

    // 检查必需的字段
    const requiredFields = ['id', 'object', 'status', 'created_at'];
    for (const field of requiredFields) {
        if (!(field in responseData)) {
            debugLog(`Missing required field: ${field}`, responseData);
            // 对于缺失字段，给出警告而不是抛出错误
            console.warn(`Warning: Response missing required field '${field}', but continuing processing`);
        }
    }

    // 验证状态字段
    if (responseData.status && typeof responseData.status !== 'string') {
        debugLog('Invalid status field:', responseData.status);
        console.warn('Warning: Response status field is not a string');
    }

    // 验证 created_at 字段
    if (responseData.created_at && typeof responseData.created_at !== 'number') {
        debugLog('Invalid created_at field:', responseData.created_at);
        console.warn('Warning: Response created_at field is not a number');
    }

    // 如果有 output 字段，验证其结构
    if (responseData.output && !Array.isArray(responseData.output)) {
        debugLog('Invalid output field: not an array', responseData.output);
        console.warn('Warning: Response output field is not an array');
    }

    debugLog('Response data validation completed', {
        hasRequiredFields: requiredFields.every(field => field in responseData),
        hasOutput: Array.isArray(responseData.output),
        status: responseData.status
    });
}

// OpenAI 响应验证函数
function validateOpenAIResponse(response: OpenAICompatibleResponse, debugLog: (message: string, data?: any) => void): void {
    if (!response || typeof response !== 'object') {
        debugLog('Invalid OpenAI response: not an object', response);
        throw new Error('Invalid OpenAI response format: expected an object');
    }

    const requiredFields = ['id', 'object', 'created', 'model', 'choices', 'usage'];
    for (const field of requiredFields) {
        if (!(field in response)) {
            debugLog(`Missing OpenAI response field: ${field}`, response);
            throw new Error(`Invalid OpenAI response: missing required field '${field}'`);
        }
    }

    // 验证 choices 数组
    if (!Array.isArray(response.choices) || response.choices.length === 0) {
        debugLog('Invalid choices field:', response.choices);
        throw new Error('Invalid OpenAI response: choices must be a non-empty array');
    }

    // 验证第一个 choice 的结构
    const firstChoice = response.choices[0];
    if (!firstChoice.message || typeof firstChoice.message.content !== 'string') {
        debugLog('Invalid choice structure:', firstChoice);
        throw new Error('Invalid OpenAI response: choice must have a message with string content');
    }

    // 验证 usage 对象
    if (!response.usage || typeof response.usage !== 'object') {
        debugLog('Invalid usage field:', response.usage);
        throw new Error('Invalid OpenAI response: usage must be an object');
    }

    debugLog('OpenAI response validation completed', {
        id: response.id,
        object: response.object,
        choicesCount: response.choices.length,
        hasContent: !!response.choices[0].message.content,
        usage: response.usage
    });
}

// 更严格的类型定义
interface MessageContent {
    type: 'text' | 'image' | 'file' | 'data';
    text?: string;
    data?: any;
    [key: string]: any;
}

interface CustomMessage {
    role: 'user' | 'assistant' | 'system';
    content: MessageContent[] | string;
}

interface CustomRequestBody {
    messages?: CustomMessage[];
    user_id?: string;
    session_id?: string;
    temperature?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    stream?: boolean;
    model?: string;
    n?: number;
    [key: string]: any;
}

// 你的 agent server 响应类型定义
interface CustomAgentResponse {
    sequence_number?: number | null;
    object: 'response' | 'message' | 'plugin_call';
    status: 'created' | 'in_progress' | 'completed' | 'error';
    error?: any;
    id: string;
    created_at: number;
    session_id?: string;
    output?: CustomMessageResponse[];
    [key: string]: any;
}

interface CustomMessageResponse {
    sequence_number?: number | null;
    object: 'message';
    status?: 'created' | 'in_progress' | 'completed' | null;
    error?: any;
    id: string;
    type: 'message';
    role: 'user' | 'assistant' | 'system';
    content: MessageContent[];
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    } | null;
    [key: string]: any;
}

interface CustomPluginCallResponse {
    sequence_number?: number | null;
    object: 'plugin_call';
    status: 'created' | 'in_progress' | 'completed' | 'error';
    error?: any;
    id: string;
    type: 'plugin_call';
    role: 'assistant';
    content: MessageContent[];
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    } | null;
    [key: string]: any;
}

// 文本内容事件类型（用于流式响应）
interface TextContentEvent {
    sequence_number: number;
    object: 'content';
    status: 'in_progress';
    type: 'text';
    index: number;
    delta: boolean;
    msg_id: string;
    text: string;
}

// OpenAI 兼容响应类型定义
interface OpenAICompatibleResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: 'assistant';
            content: string;
        };
        finish_reason: 'stop' | 'length' | 'content_filter';
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    error?: {
        message: string;
        type: string;
        code: string;
    };
}

interface OpenAIStreamingChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: 'assistant';
            content?: string;
        };
        finish_reason: 'stop' | 'length' | 'content_filter' | null;
    }>;
}

// 自定义 Provider 设置接口
interface CustomAgentSettings {
    baseURL?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    // 是否启用详细日志
    debug?: boolean;
    // 日志级别
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    // 自定义 fetch 实现（支持 Expo/React Native 环境）
    customFetch?: typeof globalThis.fetch;
    // 请求超时时间（毫秒）
    timeout?: number;
    // 是否启用响应验证
    enableValidation?: boolean;
}

// 创建自定义 provider
export function createCustomAgent(settings: CustomAgentSettings = {}) {
    // 获取日志级别
    const logLevel = settings.logLevel || (settings.debug ? 'debug' : 'error');

    // 创建调试日志函数
    const debugLog = (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) => {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(logLevel);
        const messageLevelIndex = levels.indexOf(level);

        if (messageLevelIndex <= currentLevelIndex) {
            const timestamp = new Date().toISOString();
            const prefix = `[CustomAgent ${timestamp}] [${level.toUpperCase()}]`;

            switch (level) {
                case 'error':
                    console.error(prefix, message, data);
                    break;
                case 'warn':
                    console.warn(prefix, message, data);
                    break;
                case 'info':
                    console.info(prefix, message, data);
                    break;
                case 'debug':
                default:
                    console.log(prefix, message, data);
                    break;
            }
        }
    };

    // 便捷的日志函数
    const logError = (message: string, data?: any) => debugLog('error', message, data);
    const logWarn = (message: string, data?: any) => debugLog('warn', message, data);
    const logInfo = (message: string, data?: any) => debugLog('info', message, data);
    const logDebug = (message: string, data?: any) => debugLog('debug', message, data);

    const LOG_PREVIEW_LENGTH = 60;

    const truncateForLog = (value?: string, maxLength = LOG_PREVIEW_LENGTH) => {
        if (typeof value !== 'string') {
            return value;
        }
        if (value.length <= maxLength) {
            return value;
        }
        return `${value.slice(0, maxLength)}... (truncated, ${value.length} chars)`;
    };

    const sanitizeContentForLog = (content?: MessageContent[]) => {
        if (!Array.isArray(content)) {
            return content;
        }
        return content.map(part => {
            const sanitizedPart: MessageContent = { ...part };
            if (typeof sanitizedPart.text === 'string' && sanitizedPart.text.length > 200) {
                sanitizedPart.text = truncateForLog(sanitizedPart.text, 200);
            }
            if (typeof sanitizedPart.data === 'string' && sanitizedPart.data.startsWith('data:')) {
                sanitizedPart.data = truncateForLog(sanitizedPart.data);
            }
            if (typeof (sanitizedPart as any).image_url === 'string') {
                (sanitizedPart as any).image_url = truncateForLog((sanitizedPart as any).image_url);
            } else if ((sanitizedPart as any).image_url && typeof (sanitizedPart as any).image_url.url === 'string') {
                (sanitizedPart as any).image_url = {
                    ...(sanitizedPart as any).image_url,
                    url: truncateForLog((sanitizedPart as any).image_url.url),
                };
            }
            if (typeof (sanitizedPart as any).url === 'string' && (sanitizedPart as any).url.startsWith('data:')) {
                (sanitizedPart as any).url = truncateForLog((sanitizedPart as any).url);
            }
            return sanitizedPart;
        });
    };

    const sanitizeRequestBodyForLog = (body: any) => {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sanitized = { ...body };
        if (Array.isArray(body.input)) {
            sanitized.input = body.input.map((message: any) => ({
                ...message,
                content: sanitizeContentForLog(message.content),
            }));
        }
        return sanitized;
    };

    const normalizeContentItem = (
        item: any,
        context: { messageIndex: number; itemIndex: number },
    ): MessageContent => {
        if (!item || typeof item !== 'object') {
            logWarn('Encountered invalid content item, coercing to text', { context });
            return {
                type: 'text',
                text: String(item ?? ''),
            };
        }

        if (!item.type) {
            logWarn('Content item missing type, coercing to text', { context, itemPreview: truncateForLog(JSON.stringify(item)) });
            return {
                type: 'text',
                text: typeof item.text === 'string' ? item.text : JSON.stringify(item),
            };
        }

        if (item.type === 'file') {
            const dataUrl = typeof item.data === 'string'
                ? item.data
                : typeof item.url === 'string'
                    ? item.url
                    : undefined;
            if (!dataUrl) {
                logWarn('File content missing data/url payload; skipping image data', { context });
                return {
                    type: 'text',
                    text: '[image attachment unavailable]',
                };
            }

            return {
                type: 'image',
                image_url: dataUrl,
                mediaType: item.mediaType,
                filename: item.filename,
            };
        }

        if (item.type === 'image_url') {
            const imagePayload = typeof item.image_url === 'string'
                ? item.image_url
                : item.image_url?.url;
            if (!imagePayload) {
                logWarn('image_url content missing url payload; skipping image data', { context });
                return {
                    type: 'text',
                    text: '[image attachment unavailable]',
                };
            }

            return {
                type: 'image',
                image_url: imagePayload,
                mediaType: item.image_url?.media_type || item.mediaType,
                filename: item.image_url?.filename || item.filename,
                detail: item.image_url?.detail,
            };
        }

        return item;
    };

    // 根据环境选择合适的 fetch 实现
    const fetchImplementation = settings.customFetch || expoFetch;
    const provider = createOpenAICompatible({
        name: 'custom-agent',
        baseURL: settings.baseURL || 'http://localhost:8000',
        apiKey: settings.apiKey || 'dummy-key', // 如果你的服务不需要 API key
        headers: {
            'Content-Type': 'application/json',
            ...settings.headers,
        },
        queryParams: {
            ...settings.queryParams,
        },
        // 自定义 fetch 以适配你的 API 格式
        fetch: async (url, options) => {
            try {
                logInfo('Starting custom agent request', { url });

                // 安全地解析请求体
                let requestBody: CustomRequestBody;
                try {
                    requestBody = JSON.parse(options?.body as string || '{}');
                    logDebug('Request body parsed successfully', sanitizeRequestBodyForLog(requestBody));
                } catch (parseError) {
                    logError('Failed to parse request body', parseError);
                    throw new Error('Invalid JSON in request body');
                }
                logDebug('Received request', { url, requestBody: sanitizeRequestBodyForLog(requestBody) });

                // 转换 OpenAI 格式到你的 agent server API 格式
                const customBody = {
                    user_id: requestBody.user_id || 'default',
                    session_id: requestBody.session_id || generateSessionId(),
                    input: (requestBody.messages || []).map((msg: any, index: number) => {
                        try {
                            // 验证消息结构
                            if (!msg.role || !msg.content) {
                                logError(`Invalid message at index ${index}`, msg);
                                throw new Error(`Message at index ${index} is missing required fields (role or content)`);
                            }

                            // 处理消息内容格式
                            let content;
                            if (Array.isArray(msg.content)) {
                                // 如果已经是数组格式，验证每个内容项
                        content = msg.content.map((item: any, itemIndex: number) =>
                            normalizeContentItem(item, { messageIndex: index, itemIndex })
                        );
                            } else if (typeof msg.content === 'string') {
                                // 如果是字符串，转换为标准格式
                                content = [{ type: 'text', text: msg.content }];
                            } else {
                                // 其他情况，保持原样或转换为字符串
                                content = [{ type: 'text', text: String(msg.content) }];
                            }

                            return {
                                role: msg.role,
                                content: content
                            };
                        } catch (msgError) {
                            logError(`Error processing message at index ${index}`, msgError);
                            throw new Error(`Failed to process message at index ${index}: ${msgError instanceof Error ? msgError.message : 'Unknown error'}`);
                        }
                    }),
                    // 可选的其他参数，进行验证
                    ...(requestBody.temperature !== undefined &&
                        typeof requestBody.temperature === 'number' &&
                        requestBody.temperature >= 0 &&
                        requestBody.temperature <= 2 &&
                        { temperature: requestBody.temperature }),
                    ...(requestBody.max_tokens &&
                        typeof requestBody.max_tokens === 'number' &&
                        requestBody.max_tokens > 0 &&
                        { max_tokens: requestBody.max_tokens }),
                    ...(requestBody.max_completion_tokens &&
                        typeof requestBody.max_completion_tokens === 'number' &&
                        requestBody.max_completion_tokens > 0 &&
                        { max_completion_tokens: requestBody.max_completion_tokens }),
                    ...(requestBody.stream !== undefined && { stream: requestBody.stream }),
                };

                // 根据是否是流式请求选择不同的端点
                const isStreaming = requestBody.stream === true ||
                    (typeof url === 'string' && url.includes('stream'));
                const endpoint = isStreaming ? '/stream' : '/process';

                // 验证必要的配置
                const baseURL = settings.baseURL || 'http://localhost:8000';
                if (!baseURL) {
                    throw new Error('Base URL is required');
                }

                logInfo('Sending request to agent server', {
                    endpoint: `${baseURL}${endpoint}`,
                    isStreaming,
                    messageCount: customBody.input?.length || 0,
                    hasTemperature: customBody.temperature !== undefined,
                    hasMaxTokens: customBody.max_tokens !== undefined
                });

                logDebug('Request body details', sanitizeRequestBodyForLog(customBody));

                // 设置请求超时
                const timeoutMs = settings.timeout || 60000; // 默认 60 秒
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    logWarn('Request timeout reached', { timeoutMs });
                    controller.abort();
                }, timeoutMs);

                let response: Response;
                try {
                    response = await fetchImplementation(`${baseURL}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...settings.headers,
                        },
                        body: JSON.stringify(customBody),
                        signal: controller.signal,
                    });
                } catch (fetchError) {
                    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                        logError('Request timeout', { timeoutMs });
                        throw new Error(`Request timeout - your agent server did not respond within ${timeoutMs}ms`);
                    }
                    logError('Network error during fetch', fetchError);
                    throw fetchError;
                } finally {
                    clearTimeout(timeoutId);
                }

                logInfo('Response received from agent server', {
                    status: response.status,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries())
                });

                // 检查响应状态
                if (!response.ok) {
                    const errorText = await response.text();
                    logError('Agent server returned error', { status: response.status, errorText });
                    throw new Error(`Agent server error: ${response.status} - ${errorText}`);
                }

                // 对于流式响应，需要转换 SSE 格式
                if (isStreaming) {
                    logInfo('Processing streaming response');
                    return transformStreamingResponse(response, (message, data) => {
                        logDebug(message, data);
                    });
                }

                // 对于非流式响应，需要转换格式
                logInfo('Processing non-streaming response');
                let responseData;
                try {
                    const responseText = await response.text();
                    logDebug('Raw response text received', { length: responseText.length, preview: responseText.substring(0, 200) });
                    responseData = JSON.parse(responseText);
                    logDebug('Response JSON parsed successfully');
                } catch (parseError) {
                    logError('Failed to parse response JSON', parseError);
                    throw new Error(`Invalid JSON response from agent server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                }

                logDebug('Original response data', responseData);

                // 验证响应数据结构（如果启用了验证）
                if (settings.enableValidation !== false) {
                    try {
                        validateResponseData(responseData, logDebug);
                    } catch (validationError) {
                        logWarn('Response validation failed, but continuing processing', validationError);
                    }
                }

                // 将你的自定义响应格式转换为 OpenAI 兼容格式
                const openAICompatibleResponse = transformResponseToOpenAIFormat(responseData);
                logDebug('Transformed to OpenAI format', {
                    hasChoices: openAICompatibleResponse.choices && openAICompatibleResponse.choices.length > 0,
                    hasContent: !!openAICompatibleResponse.choices[0]?.message?.content,
                    contentPreview: openAICompatibleResponse.choices[0]?.message?.content?.substring(0, 100)
                });

                // 验证转换后的响应（如果启用了验证）
                if (settings.enableValidation !== false) {
                    try {
                        validateOpenAIResponse(openAICompatibleResponse, logDebug);
                    } catch (validationError) {
                        logWarn('OpenAI response validation failed', validationError);
                    }
                }

                return new Response(JSON.stringify(openAICompatibleResponse), {
                    status: response.status,
                    headers: {
                        'Content-Type': 'application/json',
                        ...response.headers,
                    },
                });
            } catch (error) {
                logError('Custom agent fetch error', {
                    error: error instanceof Error ? error.message : error,
                    stack: error instanceof Error ? error.stack : undefined
                });
                throw new Error(`Failed to fetch from custom agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
    });

    return provider;
}

// 默认的 custom agent 实例（启用调试和验证）
export const customAgent = createCustomAgent({
    debug: true,
    logLevel: 'info',
    enableValidation: true,
    timeout: 60000,
});


// 生成唯一的会话 ID
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// 使用示例：获取特定模型
export function getModel(modelName: string = 'default') {
    return customAgent(modelName);
}
