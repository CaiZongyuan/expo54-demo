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
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#191919" }}>
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
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 100,
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>

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
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 100,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 100,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity> */}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, paddingHorizontal: 8 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <View key={m.id} style={{ marginVertical: 4 }}>
                  {m.role === "user" ? (
                    // 用户消息 - 右对齐，有背景气泡
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
                        {m.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              return (
                                <Text
                                  key={`${m.id}-${i}`}
                                  style={{
                                    fontSize: 16,
                                    color: "white",
                                    lineHeight: 22,
                                  }}
                                >
                                  {part.text}
                                </Text>
                              );
                          }
                        })}
                      </View>
                    </View>
                  ) : (
                    // AI消息 - 透明背景，横向铺满，左对齐
                    <View style={{ width: "100%", paddingHorizontal: 16 }}>
                      {m.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Text
                                key={`${m.id}-${i}`}
                                style={{
                                  fontSize: 16,
                                  color: "white",
                                  lineHeight: 22,
                                  marginVertical: 4,
                                }}
                              >
                                {part.text}
                              </Text>
                            );
                          case "tool-weather":
                          case "tool-convertFahrenheitToCelsius":
                            return (
                              <View
                                key={`${m.id}-${i}`}
                                style={{
                                  backgroundColor: "rgba(255, 255, 255, 0.22)",
                                  borderRadius: 25,
                                  paddingHorizontal: 16,
                                  paddingVertical: 8,
                                  marginVertical: 4,
                                  alignSelf: "flex-start",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: "white",
                                  }}
                                >
                                  调用工具：
                                  {part.type === "tool-weather"
                                    ? "天气查询"
                                    : "温度转换"}
                                </Text>
                              </View>
                            );
                        }
                      })}
                    </View>
                  )}
                </View>
              ))}

              {/* 显示状态指示器 */}
              {(status === "submitted" || status === "streaming") && (
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
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(45, 46, 53, 0.8)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    minWidth: 80,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                  >
                    魔法日记
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(45, 46, 53, 0.8)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    minWidth: 80,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                  >
                    答疑解惑
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(45, 46, 53, 0.8)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    minWidth: 80,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                  >
                    新闻资讯
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(45, 46, 53, 0.8)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    minWidth: 80,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "white", fontWeight: "500" }}
                  >
                    待办任务
                  </Text>
                </TouchableOpacity>
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
                  <TouchableOpacity
                    style={{
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="mic"
                      size={18}
                      color="rgba(169, 169, 169, 0.7)"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSendMessage}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 25,
                      backgroundColor:
                        input.trim() && status === "ready"
                          ? "rgba(0, 0, 0, 0.8)"
                          : "rgba(0, 0, 0, 0.4)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    disabled={!input.trim() || status !== "ready"}
                  >
                    <Ionicons name="send" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
