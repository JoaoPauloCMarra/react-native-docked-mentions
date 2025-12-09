import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MentionText } from "react-native-docked-mentions";
import { usePosts } from "../contexts/posts-context";
import { router } from "expo-router";

export default function FeedDemo() {
  const { posts } = usePosts();

  // debugging result object
  console.log(JSON.stringify(posts, null, 2));

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.subtitle}>@ for People • # for Topics</Text>
        </View>

        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
        >
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptyHint}>
                Create your first post using the Create Post tab
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <Pressable
                key={post.id}
                style={styles.postCard}
                onPress={() => {
                  router.push({ pathname: "/post", params: { id: post.id } });
                }}
              >
                <View style={styles.postHeader}>
                  <Image
                    source={{ uri: post.author.avatar }}
                    style={styles.authorAvatar}
                  />
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{post.author.name}</Text>
                    <Text style={styles.postTime}>
                      {new Date(post.timestamp).toLocaleTimeString([], {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                <MentionText
                  mentions={post.mentions?.length ? post.mentions : undefined}
                  triggers={[
                    { trigger: "@", allowedSpacesCount: 2, hideTrigger: true },
                    { trigger: "#" },
                  ]}
                  style={styles.postText}
                  onPressMention={() => {}}
                  mentionStyle={(data) => {
                    if (data.trigger === "@") return styles.personMention;
                    if (data.trigger === "#") return styles.topicMention;
                    return {};
                  }}
                >
                  {post.text}
                </MentionText>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
    backgroundColor: "#0f0f0f",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: "#444444",
    textAlign: "center",
  },
  postCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: "#666666",
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#ffffff",
  },
  personMention: {
    color: "#22c55e",
    fontWeight: "700",
  },
  topicMention: {
    color: "#3b82f6",
    fontWeight: "700",
  },
});
