export interface PluginCallData {
  type: 'plugin_call';
  pluginName: string;
  pluginStatus: 'created' | 'in_progress' | 'completed' | 'error';
  pluginData: any;
  pluginId: string;
  timestamp: number;
}

export interface PluginResultData {
  type: 'plugin_result';
  pluginName: string;
  result: any;
  status: 'success' | 'error';
  pluginId: string;
  timestamp: number;
}

export type PluginData = PluginCallData | PluginResultData;

export interface ParsedPluginContent {
  pluginCards: Array<{
    key: string;
    data: PluginData;
    isCall: boolean;
  }>;
  cleanText: string;
}

/**
 * 解析文本中的插件内容
 */
export function parsePluginContent(text: string, messageId: string, partIndex: number): ParsedPluginContent {
  const pluginCards: ParsedPluginContent["pluginCards"] = [];
  let cleanText = text;

  // 检查特殊标记的插件内容
  const pluginCallMatch = text.match(/\u0001PLUGIN_CALL_START\u0001([\s\S]*?)\u0001PLUGIN_CALL_END\u0001/);
  const pluginResultMatch = text.match(/\u0001PLUGIN_RESULT_START\u0001([\s\S]*?)\u0001PLUGIN_RESULT_END\u0001/);

  if (pluginCallMatch && pluginCallMatch[1]) {
    try {
      const parsedContent = JSON.parse(pluginCallMatch[1]);
      pluginCards.push({
        key: `${messageId}-${partIndex}-plugin-call-${parsedContent.pluginId || Math.random()}`,
        data: parsedContent,
        isCall: true,
      });
    } catch (e) {
      console.error("Failed to parse plugin call JSON:", e);
    }
  }

  if (pluginResultMatch && pluginResultMatch[1]) {
    try {
      const parsedContent = JSON.parse(pluginResultMatch[1]);
      pluginCards.push({
        key: `${messageId}-${partIndex}-plugin-result-${parsedContent.pluginId || Math.random()}`,
        data: parsedContent,
        isCall: false,
      });
    } catch (e) {
      console.error("Failed to parse plugin result JSON:", e);
    }
  }

  // 如果没有找到标记的内容，尝试解析连接的 JSON 对象
  if (pluginCards.length === 0) {
    const extractedJsonObjects = extractPluginJsonObjects(text);

    for (const jsonStr of extractedJsonObjects) {
      try {
        const parsedContent = JSON.parse(jsonStr);
        if (parsedContent.type === "plugin_call") {
          pluginCards.push({
            key: `${messageId}-${partIndex}-plugin-call-${parsedContent.pluginId || Math.random()}`,
            data: parsedContent,
            isCall: true,
          });
        } else if (parsedContent.type === "plugin_result") {
          pluginCards.push({
            key: `${messageId}-${partIndex}-plugin-result-${parsedContent.pluginId || Math.random()}`,
            data: parsedContent,
            isCall: false,
          });
        }
      } catch (e) {
        console.warn("Failed to parse extracted JSON:", jsonStr.substring(0, 100) + "...", e);
      }
    }
  }

  // 清理文本，移除所有特殊标记和 JSON 内容
  cleanText = cleanText.replace(/\u0001PLUGIN_CALL_START\u0001[\s\S]*?\u0001PLUGIN_CALL_END\u0001/g, "");
  cleanText = cleanText.replace(/\u0001PLUGIN_RESULT_START\u0001[\s\S]*?\u0001PLUGIN_RESULT_END\u0001/g, "");
  cleanText = cleanText.replace(/\{"type":"plugin_(call|result)"[\s\S]*?(?=\{"type":"plugin_(call|result)"|$)/g, "");
  cleanText = cleanText.trim();

  return {
    pluginCards,
    cleanText,
  };
}

/**
 * 从文本中提取插件 JSON 对象
 */
function extractPluginJsonObjects(text: string): string[] {
  const jsonStartRegex = /\{"type":"plugin_(call|result)"/g;
  const matches: string[] = [];
  let match;

  while ((match = jsonStartRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = findJsonEndIndex(text, startIndex);

    if (endIndex > startIndex) {
      const jsonStr = text.substring(startIndex, endIndex);
      matches.push(jsonStr);
      jsonStartRegex.lastIndex = endIndex;
    }
  }

  return matches;
}

/**
 * 找到 JSON 对象的结束位置
 */
function findJsonEndIndex(text: string, startIndex: number): number {
  let braceCount = 0;
  let inString = false;
  let escapeChar = false;

  for (let j = startIndex; j < text.length; j++) {
    const char = text[j];

    if (escapeChar) {
      escapeChar = false;
      continue;
    }

    if (char === "\\") {
      escapeChar = true;
      continue;
    }

    if (char === '"' && !escapeChar) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          return j + 1;
        }
      }
    }
  }

  return -1;
}