import React from "react";
import Markdown, { Renderer, useMarkdown } from "react-native-marked";
import { Text, View, ScrollView, useColorScheme } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

interface MarkdownRendererProps {
  content: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// 自定义渲染器，适配应用的暗色主题
class ChatRenderer extends Renderer {
  heading(text: string, level: number, styles?: TextStyle): React.ReactNode {
    const fontSize = level === 1 ? 24 : level === 2 ? 20 : level === 3 ? 18 : 16;
    const fontWeight = level === 1 ? "700" : level === 2 ? "600" : "500";
    const marginVertical = level === 1 ? 16 : level === 2 ? 12 : 8;

    return (
      <Text
        key={this.getKey()}
        style={[
          {
            fontSize,
            fontWeight,
            color: "#ffffff",
            marginVertical,
            lineHeight: fontSize * 1.4,
          },
          styles,
        ]}
      >
        {text}
      </Text>
    );
  }

  paragraph(text: string): React.ReactNode {
    return (
      <Text
        key={this.getKey()}
        style={{
          fontSize: 16,
          color: "#ffffff",
          lineHeight: 22,
          marginVertical: 4,
        }}
      >
        {text}
      </Text>
    );
  }

  listitem(text: string, ordered?: boolean): React.ReactNode {
    return (
      <Text
        key={this.getKey()}
        style={{
          fontSize: 16,
          color: "#ffffff",
          lineHeight: 22,
          marginVertical: 2,
          marginLeft: ordered ? 8 : 16,
        }}
      >
        {ordered ? `${ordered}. ` : "• "}{text}
      </Text>
    );
  }

  code(text: string, language?: string): React.ReactNode {
    return (
      <View
        key={this.getKey()}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 8,
          padding: 12,
          marginVertical: 8,
          borderLeftWidth: 3,
          borderLeftColor: "#4CAF50",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: "#ffffff",
            fontFamily: "monospace",
            lineHeight: 20,
          }}
        >
          {text}
        </Text>
      </View>
    );
  }

  codespan(text: string): React.ReactNode {
    return (
      <Text
        key={this.getKey()}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
          fontSize: 14,
          fontFamily: "monospace",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          marginHorizontal: 2,
        }}
      >
        {text}
      </Text>
    );
  }

  blockquote(text: string): React.ReactNode {
    return (
      <View
        key={this.getKey()}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderLeftWidth: 3,
          borderLeftColor: "#2196F3",
          padding: 12,
          marginVertical: 8,
          borderRadius: 4,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#e3f2fd",
            fontStyle: "italic",
            lineHeight: 22,
          }}
        >
          {text}
        </Text>
      </View>
    );
  }

  strong(text: string): React.ReactNode {
    return (
      <Text
        key={this.getKey()}
        style={{
          fontWeight: "700",
          color: "#ffffff",
        }}
      >
        {text}
      </Text>
    );
  }

  em(text: string): React.ReactNode {
    return (
      <Text
        key={this.getKey()}
        style={{
          fontStyle: "italic",
          color: "#ffffff",
        }}
      >
        {text}
      </Text>
    );
  }

  link(href: string, title: string, text: string): React.ReactNode {
    return (
      <Text
        key={this.getKey()}
        style={{
          color: "#64B5F6",
          textDecorationLine: "underline",
        }}
      >
        {text}
      </Text>
    );
  }
}

// 使用 FlatList 版本的 Markdown 组件（性能更好）
export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const renderer = new ChatRenderer();

  if (!content || content.trim() === "") {
    return null;
  }

  return (
    <Markdown
      value={content}
      renderer={renderer}
      flatListProps={{
        initialNumToRender: 10,
        maxToRenderPerBatch: 10,
        windowSize: 10,
        removeClippedSubviews: true,
      }}
      styles={{
        body: {
          backgroundColor: "transparent",
        },
      }}
      theme={{
        colors: {
          background: "transparent",
          text: "#ffffff",
          link: "#64B5F6",
          code: "rgba(255, 255, 255, 0.2)",
          blockquote: "rgba(255, 255, 255, 0.05)",
        },
        spacing: {
          paragraph: 4,
          heading1: 16,
          heading2: 12,
          heading3: 8,
          list: 2,
        },
      }}
    />
  );
}

// 使用 ScrollView 版本的 Markdown 组件（更灵活）
export function MarkdownRendererScroll({ content, style, textStyle }: MarkdownRendererProps) {
  const colorScheme = useColorScheme();
  const renderer = new ChatRenderer();

  if (!content || content.trim() === "") {
    return null;
  }

  const elements = useMarkdown(content, {
    colorScheme: colorScheme === "dark" ? "dark" : "light",
    renderer,
  });

  return (
    <ScrollView style={style} showsVerticalScrollIndicator={false}>
      {elements.map((element, index) => (
        <React.Fragment key={`markdown-${index}`}>{element}</React.Fragment>
      ))}
    </ScrollView>
  );
}

export default MarkdownRenderer;