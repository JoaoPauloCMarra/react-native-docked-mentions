import { StatusBar } from "expo-status-bar";
import { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router, useLocalSearchParams } from "expo-router";
import {
  MentionProvider,
  MentionSuggestion,
  MentionRange,
  useMentionState,
} from "react-native-docked-mentions";
import { usePeopleSearch, useTopicSearch } from "../services/people-service";
import { usePosts } from "../contexts/posts-context";
import { PostInput } from "../components/post-input";
import { SuggestionList } from "../components/suggestion-list";

function useDebounce<T>(value: T, delay: number, dependency?: unknown): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    setDebouncedValue(value);
  }, [dependency]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function PostInterface() {
  const params = useLocalSearchParams();
  const postId = params.id as string | undefined;

  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<MentionRange[]>([]);
  const { currentQuery, activeTrigger, isMentioning } = useMentionState();
  const debouncedQuery = useDebounce(currentQuery, 300, activeTrigger);
  const { addPost, updatePost, posts } = usePosts();

  useEffect(() => {
    if (postId) {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        setText(post.text);
      }
    } else {
      setText("");
    }
  }, [postId, posts]);

  const { data: peopleData = [], isLoading: loadingPeople } = usePeopleSearch(
    isMentioning && activeTrigger === "@" ? debouncedQuery : ""
  );
  const { data: topicData = [], isLoading: loadingTopics } = useTopicSearch(
    isMentioning && activeTrigger === "#" ? debouncedQuery : ""
  );

  const { data: preloadPeople = [] } = usePeopleSearch("");
  const { data: preloadTopics = [] } = useTopicSearch("");

  const suggestions: MentionSuggestion[] = useMemo(() => {
    if (activeTrigger === "@") {
      const source = debouncedQuery ? peopleData : preloadPeople.slice(0, 5);
      return source.map(
        (p: {
          id: string;
          data?: { name?: string; image?: string; jobTitle?: string };
          display: string;
        }) => ({
          id: p.id,
          name: p.data?.name || p.display,
          trigger: "@",
          avatar: p.data?.image,
          subtitle: p.data?.jobTitle,
          data: p,
        })
      );
    }
    if (activeTrigger === "#") {
      const source = debouncedQuery ? topicData : preloadTopics.slice(0, 5);
      return source.map(
        (t: { id: string; data?: { name?: string }; display: string }) => ({
          id: t.id,
          name: t.data?.name || t.display,
          trigger: "#",
          data: t,
        })
      );
    }
    return [];
  }, [
    activeTrigger,
    debouncedQuery,
    peopleData,
    preloadPeople,
    topicData,
    preloadTopics,
  ]);

  const handleClose = () => {
    Keyboard.dismiss();
    setText("");
    router.replace("/");
  };

  const handlePost = () => {
    if (!text.trim()) return;

    if (postId) {
      updatePost(postId, {
        text: text,
        mentions: mentions,
        timestamp: Date.now(),
      });
      setText("");
      router.setParams({ id: undefined });
      Keyboard.dismiss();
      router.replace("/");
    } else {
      addPost({
        text: text,
        mentions: mentions,
        author: {
          name: "Demo User",
          avatar: "https://i.pravatar.cc/150?img=1",
        },
        timestamp: Date.now(),
      });
      handleClose();
    }
  };

  const renderSuggestionItem = (
    item: MentionSuggestion,
    onSelect: () => void
  ) => {
    if (item.trigger === "@") {
      return (
        <Pressable style={styles.personItem} onPress={onSelect}>
          <Image source={{ uri: item.avatar }} style={styles.personAvatar} />
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personTitle}>{item.subtitle}</Text>
          </View>
        </Pressable>
      );
    }
    return (
      <Pressable style={styles.topicItem} onPress={onSelect}>
        <Text style={styles.topicName}>{item.name}</Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <Pressable
            style={[
              styles.postButton,
              !text.trim() && styles.postButtonDisabled,
            ]}
            disabled={!text.trim()}
            onPress={handlePost}
          >
            <Text style={styles.postButtonText}>
              {postId ? "Update" : "Post"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.inputContainer}>
          <PostInput
            value={text}
            onChangeText={setText}
            onChangeMentions={setMentions}
            placeholder="What do you want to talk about?"
            placeholderTextColor="#666"
            multiline
            style={styles.postInput}
            autoFocus
          />
        </View>

        <SuggestionList
          suggestions={suggestions}
          renderItem={renderSuggestionItem}
          isLoading={
            isMentioning &&
            suggestions.length === 0 &&
            ((activeTrigger === "@" && loadingPeople) ||
              (activeTrigger === "#" && loadingTopics))
          }
          style={styles.suggestionList}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

export default function PostDemo() {
  const triggers = useMemo(
    () => [{ trigger: "@", allowedSpacesCount: 2 }, { trigger: "#" }],
    []
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <MentionProvider triggers={triggers}>
          <PostInterface />
        </MentionProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  closeText: { color: "white", fontSize: 16 },
  postButton: {
    backgroundColor: "#0a66c2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: { backgroundColor: "#444" },
  postButtonText: { color: "white", fontWeight: "600" },
  inputContainer: { flex: 1, padding: 16 },
  postInput: {
    flex: 1,
    fontSize: 18,
    color: "white",
    textAlignVertical: "top",
  },
  suggestionList: {
    backgroundColor: "#111",
    borderTopColor: "#333",
  },
  personItem: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  personInfo: { flex: 1 },
  personName: { color: "white", fontWeight: "bold", fontSize: 16 },
  personTitle: { color: "#aaa", fontSize: 13 },
  topicItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  topicName: { color: "white", fontWeight: "bold", fontSize: 16 },
});
