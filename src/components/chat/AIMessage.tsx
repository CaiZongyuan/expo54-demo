import React from "react";
import { Text, View } from "react-native";
import { PluginMessage } from "./PluginMessage";

interface AIMessageProps {
  parts: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  messageId: string;
}

export function AIMessage({ parts, messageId }: AIMessageProps) {
  return (
    <View style={{ width: "100%", paddingHorizontal: 16 }}>
      {parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return (
              <PluginMessage
                key={`${messageId}-${i}`}
                content={part.text || ""}
                messageId={messageId}
                partIndex={i}
              />
            );
          default:
            return null;
        }
      })}
    </View>
  );
}