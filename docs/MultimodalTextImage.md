# Expo Chatbot 文字 + 图片发送改造指南

## 背景

在使用 Vercel AI SDK (`useChat` + `convertToModelMessages`) 时，消息需要遵循 SDK 规定的 `UIMessage` 结构。之前客户端自定义了 `parts: [{ type: 'text' }, { type: 'image' }]`，但 SDK 只识别少数固定的 `type`（`text`、`file`、工具、数据等）。因此 `convertToModelMessages` 在把 UIMessage 转换为 OpenAI 格式时，会直接丢弃未知的 `image` 部分，导致后端收到的请求只包含文字。

另外，代理层在把 OpenAI 兼容格式转成自建 Agent API 时，并没有处理 SDK 生成的 `type: 'file'` 或 `type: 'image_url'` 部分，从而触发了 `"expected_tags ... got 'image_url'"` 的异常。

## 客户端改动

文件：`src/app/(chatbot)/index.tsx`

1. `useChat` 已提供 `sendMessage({ text, files })` 能力，会自动把参数整理成合法的 UIMessage。
2. 发送消息时：
   - 文本继续使用 `text = input.trim()`。
   - 图片通过 `convertImageToBase64` 得到 data URL，并包装成 `FileUIPart`：
     ```ts
     import { DefaultChatTransport, type FileUIPart } from 'ai';

     const files: FileUIPart[] = [{
       type: 'file',
       mediaType: `image/${format}`,
       filename: `upload-${Date.now()}.${format}`,
       url: base64Result.base64, // data:image/...;base64,xxxx
     }];
     ```
   - 调用 `await sendMessage({ text, files })`。SDK 会将 `text` 与 `files` 合并进 `messages[n].parts`，再交由 `/api/chat`。

3. UI 渲染兼容 `FileUIPart`：
   - `src/components/chat/UserMessage.tsx` 与 `AIMessage.tsx` 新增 `case 'file'`，仅在 `mediaType` 以 `image/` 开头时展示图片：`source={{ uri: part.url ?? part.image }}`。

## 代理层改动

文件：`src/providers/custom-agent-provid.ts`

1. 新增 `normalizeContentItem`，在请求转发前把 SDK 产出的 `type: 'file'`/`type: 'image_url'` 统一转换成后端兼容的 `{ type: 'image', image_url: dataUrl }`：
   - `FileUIPart` → 读取 `item.data` 或 `item.url`（data URL）。
   - OpenAI `image_url` 结构 → 读取 `image_url` 字段里的 `url` 或原字符串。
   - 其余未知结构统一降级为文本，避免 API 报错。
2. 添加 `sanitizeRequestBodyForLog`、`truncateForLog`，只打印短预览（默认 60 个字符），防止 console 输出完整 Base64 数据。
3. 所有 `logDebug`/`logInfo` 都使用清洗后的对象，确保日志可读又不会泄漏大 payload。

## 验证步骤

1. 在 Expo 客户端选择一张图片并输入文字，点击发送：
   - Metro 日志会显示 `"发送内容"` 但只有前 50 个字符的预览。
2. 打开 `/api/chat` 的服务器日志（或 `custom-agent-provid` 内的调试输出）：
   - `Request body parsed successfully` 中的 `input[*].content` 包含 `type: 'image'`，`image_url` 为 data URL 预览。
3. 后端收到的请求体 `messages[n].content` 同时包含 `TextPart` 与 `FilePart`，`convertToModelMessages` 不再丢失图片，SSE 流可正常关闭，`TypeError: The stream is not in a state that permits close` 也会消失。

通过以上改造，应用即可稳定地向自建后端发送文字 + 图像消息，并保持日志简洁安全。
