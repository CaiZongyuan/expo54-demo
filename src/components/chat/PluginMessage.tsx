import React from "react";
import { Text, View } from "react-native";
import { PluginCard } from "./PluginCard";
import { parsePluginContent } from "../../utils/pluginParser";

interface PluginMessageProps {
  content: string;
  messageId: string;
  partIndex: number;
}

export function PluginMessage({ content, messageId, partIndex }: PluginMessageProps) {
  const { pluginCards, cleanText } = React.useMemo(
    () => parsePluginContent(content, messageId, partIndex),
    [content, messageId, partIndex]
  );

  return (
    <View>
      {/* 渲染插件卡片 */}
      {pluginCards.map((plugin) => (
        <PluginCard
          key={plugin.key}
          data={plugin.data}
          isCall={plugin.isCall}
        />
      ))}

      {/* 渲染清理后的文本 */}
      {cleanText && (
        <Text
          style={{
            fontSize: 16,
            color: "white",
            lineHeight: 22,
            marginVertical: 4,
          }}
        >
          {cleanText}
        </Text>
      )}
    </View>
  );
}