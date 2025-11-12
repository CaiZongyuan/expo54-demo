# Agent Server API 文档

## 概述

Agent Server 提供了一个基于 Server-Sent Events (SSE) 的流式对话 API，支持实时响应和工具调用功能。

**基础信息：**
- **基础URL**: `http://localhost:8000`
- **流式接口**: `POST /stream`
- **协议**: Server-Sent Events (SSE)
- **数据格式**: JSON

## API 接口

### 流式对话接口

**请求信息：**
- **URL**: `POST http://localhost:8000/stream`
- **Content-Type**: `application/json`
- **响应类型**: `text/event-stream`

#### 请求格式

```json
{
    "user_id": "string",
    "session_id": "string",
    "input": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "string"
                }
            ]
        }
    ]
}
```

**请求参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户唯一标识 |
| session_id | string | 是 | 会话唯一标识 |
| input | array | 是 | 对话输入内容数组 |
| input[].role | string | 是 | 角色类型，通常为 "user" |
| input[].content | array | 是 | 内容数组 |
| input[].content[].type | string | 是 | 内容类型，当前支持 "text" |
| input[].content[].text | string | 是 | 文本内容 |

#### 请求示例

```json
{
    "user_id": "wk",
    "session_id": "002",
    "input": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "现在几点了"
                }
            ]
        }
    ]
}
```

## 响应格式

### Server-Sent Events (SSE) 格式

API 返回 SSE 格式的数据流，每个事件包含以下结构：

```
event: {event_type}
data: {json_data}
```

### 事件类型 (Event Types)

#### 1. response - 响应状态事件

**事件类型**: `response`

**数据格式**:
```json
{
    "sequence_number": 0,
    "object": "response",
    "status": "created|in_progress|completed",
    "id": "response_{uuid}",
    "created_at": 1762941912
}
```

**状态说明**：
- `created`: 响应已创建
- `in_progress`: 响应处理中
- `completed`: 响应已完成

**完整响应示例**：
```json
{
    "sequence_number": 18,
    "object": "response",
    "status": "completed",
    "id": "response_6e39e4fb-f7b5-421c-95a8-2695a61797ea",
    "created_at": 1762941912,
    "output": [...]
}
```

#### 2. message - 消息状态事件

**事件类型**: `message`

**数据格式**:
```json
{
    "sequence_number": 8,
    "object": "message",
    "status": "in_progress|completed",
    "id": "msg_{uuid}",
    "type": "message",
    "role": "assistant"
}
```

**完整消息示例**：
```json
{
    "sequence_number": 17,
    "object": "message",
    "status": "completed",
    "id": "msg_6312880c-2860-441d-b896-e218e6e43868",
    "type": "message",
    "role": "assistant",
    "content": [
        {
            "object": "content",
            "type": "text",
            "text": "现在是北京时间 2025 年 11 月 13 日 凌晨 2:05。"
        }
    ]
}
```

#### 3. text - 文本增量事件

**事件类型**: `text`

**数据格式**:
```json
{
    "sequence_number": 9,
    "object": "content",
    "status": "in_progress",
    "type": "text",
    "index": 0,
    "delta": true,
    "msg_id": "msg_{uuid}",
    "text": "现在"
}
```

**字段说明**：
- `delta`: 表示这是增量文本
- `index`: 文本块索引
- `msg_id`: 关联的消息ID
- `text`: 增量文本内容

#### 4. plugin_call - 工具调用事件

**事件类型**: `plugin_call`

**数据格式**:
```json
{
    "sequence_number": 5,
    "object": "plugin_call",
    "status": "completed",
    "id": "msg_{uuid}",
    "type": "plugin_call",
    "role": "assistant",
    "content": [
        {
            "object": "content",
            "type": "data",
            "delta": false,
            "data": {
                "type": "tool_use",
                "id": "call_{uuid}",
                "name": "tool_name",
                "input": {...}
            }
        }
    ]
}
```

#### 5. plugin_call_output - 工具调用输出事件

**事件类型**: `plugin_call_output`

**数据格式**:
```json
{
    "sequence_number": 7,
    "object": "plugin_call_output",
    "status": "completed",
    "id": "msg_{uuid}",
    "type": "plugin_call_output",
    "role": "assistant",
    "content": [
        {
            "object": "content",
            "type": "data",
            "delta": false,
            "data": {
                "type": "tool_result",
                "id": "call_{uuid}",
                "name": "tool_name",
                "output": [...]
            }
        }
    ]
}
```

## 通用字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| sequence_number | number | 事件序列号，从0开始递增 |
| object | string | 事件对象类型 |
| status | string | 事件状态：created/in_progress/completed |
| id | string | 事件唯一标识符 |
| type | string | 具体类型标识 |
| role | string | 角色类型：user/assistant |

## 完整流程示例

### 完整事件序列示例

```
event: message
data: {"sequence_number": 0, "object": "response", "status": "created", "id": "response_6e39e4fb-f7b5-421c-95a8-2695a61797ea", "created_at": 1762941912}

event: message
data: {"sequence_number": 1, "object": "response", "status": "in_progress", "id": "response_6e39e4fb-f7b5-421c-95a8-2695a61797ea", "created_at": 1762941912}

event: plugin_call
data: {"sequence_number": 2, "object": "plugin_call", "status": "completed", "id": "msg_a775048a-4818-4a8d-aef2-5ea2ac5dc709", "type": "plugin_call", "role": "assistant", "content": [{"object": "content", "type": "data", "delta": false, "data": {"type": "tool_use", "id": "call_dc5249a5328f40c0b92eb8b1", "name": "tool_now", "input": {}}}]}

event: plugin_call_output
data: {"sequence_number": 7, "object": "plugin_call_output", "status": "completed", "id": "msg_9748f05c-c350-4efd-8332-8858811ad302", "type": "plugin_call_output", "role": "assistant", "content": [{"object": "content", "type": "data", "delta": false, "data": {"type": "tool_result", "id": "call_c1c00f7bbd1d4ea68440a958", "name": "tool_now", "output": [{"type": "text", "text": "2025-11-12T18:05:28.058211+00:00"}]}}]}

event: message
data: {"sequence_number": 8, "object": "message", "status": "in_progress", "id": "msg_6312880c-2860-441d-b896-e218e6e43868", "type": "message", "role": "assistant"}

event: text
data: {"sequence_number": 9, "object": "content", "status": "in_progress", "type": "text", "index": 0, "delta": true, "msg_id": "msg_6312880c-2860-441d-b896-e218e6e43868", "text": "现在"}

event: message
data: {"sequence_number": 17, "object": "message", "status": "completed", "id": "msg_6312880c-2860-441d-b896-e218e6e43868", "type": "message", "role": "assistant", "content": [{"object": "content", "type": "text", "text": "现在是北京时间 2025 年 11 月 13 日 凌晨 2:05。"}]}

event: message
data: {"sequence_number": 18, "object": "response", "status": "completed", "id": "response_6e39e4fb-f7b5-421c-95a8-2695a61797ea", "created_at": 1762941912, "output": [{"sequence_number": 17, "object": "message", "status": "completed", "id": "msg_6312880c-2860-441d-b896-e218e6e43868", "type": "message", "role": "assistant", "content": [{"object": "content", "type": "text", "text": "现在是北京时间 2025 年 11 月 13 日 凌晨 2:05。"}]}]}
```

## 客户端集成指南

### JavaScript/TypeScript 客户端示例

```javascript
class AgentClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async sendMessage(userId, sessionId, message) {
        const response = await fetch(`${this.baseUrl}/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                user_id: userId,
                session_id: sessionId,
                input: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: message
                            }
                        ]
                    }
                ]
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    const eventType = line.substring(7);
                    continue;
                }

                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));
                    this.handleEvent(eventType, data);
                }
            }
        }
    }

    handleEvent(eventType, data) {
        switch (eventType) {
            case 'response':
                this.handleResponse(data);
                break;
            case 'message':
                this.handleMessage(data);
                break;
            case 'text':
                this.handleText(data);
                break;
            case 'plugin_call':
                this.handlePluginCall(data);
                break;
            case 'plugin_call_output':
                this.handlePluginCallOutput(data);
                break;
        }
    }

    // 实现各种事件处理方法...
}
```

### React Native 集成注意事项

1. **SSE 支持**: 使用 `EventSource` 或 `fetch` + `ReadableStream`
2. **网络配置**: 确保支持 HTTP 流式传输
3. **错误处理**: 实现重连机制和错误处理
4. **状态管理**: 管理对话状态和消息历史

## 错误处理

### 常见错误状态

- **连接错误**: 网络连接失败
- **格式错误**: 请求格式不正确
- **认证错误**: 用户身份验证失败
- **服务器错误**: 内部处理错误

### 重连策略

建议实现指数退避重连机制，在连接失败时自动重试。

## 版本信息

- **API 版本**: v1.0
- **最后更新**: 2025-11-12
- **维护者**: Agent Server Team