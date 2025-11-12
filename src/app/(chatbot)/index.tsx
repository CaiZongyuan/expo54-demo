import { useChat } from "@ai-sdk/react";
import { Ionicons } from "@expo/vector-icons";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AIMessage, UserMessage } from "../../components/chat";
import { generateAPIUrl } from "../../utils/fetch";

const { width: screenWidth } = Dimensions.get("window");

export default function ChatBotScreen() {
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { messages, error, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chat"),
    }),
    onError: (error) => console.error(error, "ERROR"),
  });

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });

    // 如果有AI消息，显示反馈组件
    const hasAIMessage = messages.some((m) => m.role === "assistant");
    if (hasAIMessage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [messages, fadeAnim]);

  const handleSendMessage = () => {
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  if (error)
    return <Text style={{ color: "red", padding: 20 }}>{error.message}</Text>;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#191919" }}
        edges={["top", "left", "right"]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#191919" />

        {/* 顶部导航栏 */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "rgba(25, 25, 25, 1)",
          }}
        >
          {/* 菜单按钮 */}
          <Pressable
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 100,
              backgroundColor: pressed
                ? "rgba(255, 255, 255, 0.35)"
                : "rgba(255, 255, 255, 0.25)",
              justifyContent: "center",
              alignItems: "center",
            })}
            onPress={() => console.log("Menu pressed")}
          >
            <Ionicons name="menu" size={24} color="white" />
          </Pressable>

          {/* 标题 */}
          <Text
            style={{
              fontSize: 24,
              fontFamily: "Alibaba PuHuiTi",
              fontWeight: "400",
              color: "white",
            }}
          >
            星绪
          </Text>

          {/* 右侧按钮组 */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 100,
                backgroundColor: pressed
                  ? "rgba(255, 255, 255, 0.35)"
                  : "rgba(255, 255, 255, 0.25)",
                justifyContent: "center",
                alignItems: "center",
              })}
              onPress={() => console.log("Add pressed")}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, paddingHorizontal: 8 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              bounces={true}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <View key={m.id} style={{ marginVertical: 4 }}>
                  {m.role === "user" ? (
                    <UserMessage parts={m.parts} messageId={m.id} />
                  ) : (
                    <AIMessage parts={m.parts} messageId={m.id} />
                  )}
                </View>
              ))}

              {/* 显示状态指示器 */}
              {status === "submitted" && (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                    borderRadius: 25,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginVertical: 4,
                    alignSelf: "flex-start",
                    marginLeft: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "white",
                    }}
                  >
                    正在思考...
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>

          {/* 底部输入区域 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: 20,
              gap: 16,
            }}
          >
            {/* 功能标签 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1, maxHeight: 40 }}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
              nestedScrollEnabled={true}
            >
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? "rgba(45, 46, 53, 0.9)"
                    : "rgba(45, 46, 53, 0.8)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  minWidth: 80,
                  alignItems: "center",
                })}
                onPress={() => console.log("魔法日记")}
              >
                <Text
                  style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                >
                  魔法日记
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? "rgba(45, 46, 53, 0.9)"
                    : "rgba(45, 46, 53, 0.8)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  minWidth: 80,
                  alignItems: "center",
                })}
                onPress={() => console.log("答疑解惑")}
              >
                <Text
                  style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                >
                  答疑解惑
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? "rgba(45, 46, 53, 0.9)"
                    : "rgba(45, 46, 53, 0.8)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  minWidth: 80,
                  alignItems: "center",
                })}
                onPress={() => console.log("新闻资讯")}
              >
                <Text
                  style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                >
                  新闻资讯
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? "rgba(45, 46, 53, 0.9)"
                    : "rgba(45, 46, 53, 0.8)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  minWidth: 80,
                  alignItems: "center",
                })}
                onPress={() => console.log("待办任务")}
              >
                <Text
                  style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                >
                  待办任务
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* 输入框区域 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingBottom: 20,
              gap: 12,
            }}
          >
            {/* 头像 */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 25,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="sparkles" size={20} color="white" />
            </View>

            {/* 输入框 */}
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(217, 217, 217, 1)",
                borderRadius: 50,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 50,
                maxHeight: 100,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: "#333",
                  maxHeight: 80,
                  paddingRight: 8,
                }}
                placeholder="请输入消息..."
                placeholderTextColor="rgba(169, 169, 169, 0.7)"
                value={input}
                onChangeText={setInput}
                multiline
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
                textAlignVertical="center"
              />

              {/* 语音和发送按钮 */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Pressable
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.6 : 1,
                  })}
                  onPress={() => console.log("Voice input")}
                >
                  <Ionicons
                    name="mic"
                    size={18}
                    color="rgba(169, 169, 169, 0.7)"
                  />
                </Pressable>
                <Pressable
                  onPress={handleSendMessage}
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 25,
                    backgroundColor:
                      input.trim() && status === "ready"
                        ? pressed
                          ? "rgba(0, 0, 0, 0.6)"
                          : "rgba(0, 0, 0, 0.8)"
                        : "rgba(0, 0, 0, 0.4)",
                    justifyContent: "center",
                    alignItems: "center",
                  })}
                  disabled={!input.trim() || status !== "ready"}
                >
                  <Ionicons name="send" size={16} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
