import { Tabs } from "expo-router";

const Layout = () => {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Chatbot" }} />
    </Tabs>
  );
};

export default Layout;
