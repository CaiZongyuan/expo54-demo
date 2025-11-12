import React from "react";
import { Image, Text, View } from "react-native";

interface UserMessageProps {
  parts: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  messageId: string;
}

export function UserMessage({ parts, messageId }: UserMessageProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 8,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          maxWidth: "80%",
          backgroundColor: "rgba(45, 46, 53, 1)",
          borderRadius: 16,
          borderBottomRightRadius: 0,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        {parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return (
                <Text
                  key={`${messageId}-${i}`}
                  style={{
                    fontSize: 16,
                    color: "white",
                    lineHeight: 22,
                  }}
                >
                  {part.text}
                </Text>
              );
            case "image":
              return (
                <Image
                  key={`${messageId}-${i}`}
                  source={{ uri: part.local_uri || part.image_url }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                  resizeMode="cover"
                />
              );
            default:
              return null;
          }
        })}
      </View>
    </View>
  );
}