import { useChat } from "@ai-sdk/react";
import { Ionicons } from "@expo/vector-icons";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
  Alert,
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  // 请求相机和媒体库权限
  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return (
      cameraPermission.status === 'granted' &&
      mediaLibraryPermission.status === 'granted'
    );
  };

  // 从图片库选择图片
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('权限不足', '需要相机和相册权限才能选择图片');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  };

  // 拍照
  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('权限不足', '需要相机权限才能拍照');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败，请重试');
    }
  };

  // 删除选中的图片
  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSendMessage = () => {
    if (!input.trim() && !selectedImage) return;

    const parts: any[] = [];

    // 添加文本内容
    if (input.trim()) {
      parts.push({ type: 'text', text: input.trim() });
    }

    // 添加图片内容
    if (selectedImage) {
      parts.push({
        type: 'image',
        image: selectedImage,
      });
    }

    if (parts.length > 0) {
      sendMessage({ parts });
      setInput("");
      setSelectedImage(null);
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

          {/* 图片预览区域 */}
          {selectedImage && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  position: "relative",
                }}
              >
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
                {/* 删除按钮 */}
                <Pressable
                  onPress={removeImage}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="close" size={16} color="white" />
                </Pressable>
              </View>
            </View>
          )}

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

              {/* 语音、图片和发送按钮 */}
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
                  onPress={() => {
                    Alert.alert(
                      '选择图片',
                      '你想从哪里选择图片？',
                      [
                        {
                          text: '拍照',
                          onPress: takePhoto,
                        },
                        {
                          text: '从相册选择',
                          onPress: pickImage,
                        },
                        {
                          text: '取消',
                          style: 'cancel',
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons
                    name="image"
                    size={18}
                    color="rgba(169, 169, 169, 0.7)"
                  />
                </Pressable>
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
                      (input.trim() || selectedImage) && status === "ready"
                        ? pressed
                          ? "rgba(0, 0, 0, 0.6)"
                          : "rgba(0, 0, 0, 0.8)"
                        : "rgba(0, 0, 0, 0.4)",
                    justifyContent: "center",
                    alignItems: "center",
                  })}
                  disabled={(!input.trim() && !selectedImage) || status !== "ready"}
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
