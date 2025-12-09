import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostsProvider } from "../contexts/posts-context";

import "../web-styles.css";

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PostsProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#0a0a0a",
              borderTopColor: "#1f1f1f",
              borderTopWidth: 1,
              height: Platform.OS === "ios" ? 88 : 60,
              paddingBottom: Platform.OS === "ios" ? 24 : 8,
            },
            tabBarActiveTintColor: "#22c55e",
            tabBarInactiveTintColor: "#666666",
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Feed",
              tabBarIcon: ({ color }) => <TabIcon icon="📰" color={color} />,
            }}
          />
          <Tabs.Screen
            name="post"
            options={{
              title: "Create Post",
              tabBarIcon: ({ color }) => <TabIcon icon="✍️" color={color} />,
            }}
          />
        </Tabs>
      </PostsProvider>
    </QueryClientProvider>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <Text style={{ fontSize: 24, opacity: color === "#22c55e" ? 1 : 0.6 }}>
      {icon}
    </Text>
  );
}
