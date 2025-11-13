import React from "react";
import { Image, Text, View } from "react-native";
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
          case "file":
          case "image":
            if (
              part.type === "file" &&
              part.mediaType &&
              !part.mediaType.startsWith("image/")
            ) {
              return null;
            }
            return (
              <Image
                key={`${messageId}-${i}`}
                source={{ uri: part.image || part.url }}
                style={{
                  width: 250,
                  height: 250,
                  borderRadius: 12,
                  marginVertical: 8,
                }}
                resizeMode="cover"
              />
            );
          default:
            return null;
        }
      })}
    </View>
  );
}
