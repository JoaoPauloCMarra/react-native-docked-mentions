import { createContext, useContext, useState, ReactNode } from "react";
import type { MentionRange } from "react-native-docked-mentions";

export interface Post {
  id: string;
  text: string;
  mentions?: MentionRange[];
  timestamp: Date | number;
  author: {
    name: string;
    avatar: string;
  };
}

interface PostsContextValue {
  posts: Post[];
  addPost: (post: Omit<Post, "id">) => void;
  updatePost: (id: string, post: Partial<Omit<Post, "id">>) => void;
}

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      text: "Welcome! Try mentioning @James Smith or using #javascript!",
      mentions: [
        {
          start: 24,
          end: 36,
          data: {
            id: "1",
            name: "James Smith",
            trigger: "@",
          },
        },
        {
          start: 46,
          end: 57,
          data: {
            id: "react",
            name: "javascript",
            trigger: "#",
          },
        },
      ],
      timestamp: new Date(Date.now() - 60000),
      author: {
        name: "Demo User",
        avatar: "https://i.pravatar.cc/150?img=1",
      },
    },
    {
      id: "2",
      text: "Big shoutout to @Jane Doe for her help!",
      mentions: [
        {
          start: 16,
          end: 25,
          data: { id: "2", name: "Jane Doe", trigger: "@" },
        },
      ],
      timestamp: new Date(Date.now() - 30000),
      author: {
        name: "Demo User",
        avatar: "https://i.pravatar.cc/150?img=1",
      },
    },
  ]);

  const addPost = (post: Omit<Post, "id">) => {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      timestamp: post.timestamp || new Date(),
    };
    setPosts([newPost, ...posts]);
  };

  const updatePost = (id: string, updatedFields: Partial<Omit<Post, "id">>) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, updatePost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePosts must be used within PostsProvider");
  }
  return context;
}
