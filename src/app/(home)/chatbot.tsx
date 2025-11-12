import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { generateAPIUrl } from "../../utils/fetch";

export default function App() {
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chat"),
    }),
    onError: (error) => console.error(error, "ERROR"),
  });

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (error) return <Text>{error.message}</Text>;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // 根据你的导航栏高度调整
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {messages.map((m) => (
              <View key={m.id} style={{ marginVertical: 8 }}>
                <View>
                  <Text style={{ fontWeight: "700" }}>{m.role}</Text>
                  {m.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return <Text key={`${m.id}-${i}`}>{part.text}</Text>;
                      case "tool-weather":
                      case "tool-convertFahrenheitToCelsius":
                        return (
                          <Text key={`${m.id}-${i}`}>
                            {JSON.stringify(part, null, 2)}
                          </Text>
                        );
                    }
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ paddingVertical: 8 }}>
            <TextInput
              style={{
                backgroundColor: "white",
                padding: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "#ddd",
              }}
              placeholder="Say something..."
              value={input}
              onChangeText={setInput} // 使用 onChangeText 更简洁
              onSubmitEditing={() => {
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              returnKeyType="send"
              blurOnSubmit={false}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
