import * as Sentry from "@sentry/react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

Sentry.init({
  dsn: "https://a826cc2ae2daed87f3bb7a5fec855f73@o4510278309576704.ingest.de.sentry.io/4510334685020240",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  return (
    <SafeAreaProvider style={{ height: "100%" }}>
      <Slot />
    </SafeAreaProvider>
  );
});
