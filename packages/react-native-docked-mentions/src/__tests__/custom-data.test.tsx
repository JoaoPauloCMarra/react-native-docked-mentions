import { parseMentions } from "../mention-utils";
import { MentionRange } from "../types";

describe("Custom Data Preservation - Integration", () => {
  it("parseMentions extracts basic mention data from text", () => {
    const text = "Hey @John, check out #react-native!";
    const mentions = parseMentions(text, [{ trigger: "@" }, { trigger: "#" }]);

    expect(mentions).toHaveLength(2);
    expect(mentions[0].data.name).toBe("John");
    expect(mentions[0].data.trigger).toBe("@");
    expect(mentions[1].data.name).toBe("react-native");
    expect(mentions[1].data.trigger).toBe("#");
  });

  it("custom data can be added to parsed mentions", () => {
    const text = "@John @Jane";
    const mentions = parseMentions(text, [{ trigger: "@" }]);

    const customDataStore = new Map<string, Record<string, unknown>>();
    customDataStore.set("@John", {
      profileId: "user_123",
      avatarUrl: "https://example.com/john.jpg",
    });
    customDataStore.set("@Jane", {
      profileId: "user_456",
      avatarUrl: "https://example.com/jane.jpg",
    });

    const enrichedMentions: MentionRange[] = mentions.map((mention) => {
      const key = `${mention.data.trigger}${mention.data.name}`;
      const customData = customDataStore.get(key);

      if (customData) {
        return {
          ...mention,
          data: {
            ...mention.data,
            ...customData,
          },
        };
      }

      return mention;
    });

    expect(enrichedMentions[0].data.profileId).toBe("user_123");
    expect(enrichedMentions[0].data.avatarUrl).toBe(
      "https://example.com/john.jpg"
    );
    expect(enrichedMentions[1].data.profileId).toBe("user_456");
    expect(enrichedMentions[1].data.avatarUrl).toBe(
      "https://example.com/jane.jpg"
    );
  });

  it("custom data persists through text changes", () => {
    const customDataStore = new Map<string, Record<string, unknown>>();
    customDataStore.set("@John", {
      profileId: "user_123",
      email: "john@example.com",
    });

    let text = "@John";
    let mentions = parseMentions(text, [{ trigger: "@" }]);
    let enrichedMentions = mentions.map((m) => ({
      ...m,
      data: {
        ...m.data,
        ...customDataStore.get(`${m.data.trigger}${m.data.name}`),
      },
    }));

    expect(enrichedMentions[0].data.profileId).toBe("user_123");

    text = "@John hello world";
    mentions = parseMentions(text, [{ trigger: "@" }]);
    enrichedMentions = mentions.map((m) => ({
      ...m,
      data: {
        ...m.data,
        ...customDataStore.get(`${m.data.trigger}${m.data.name}`),
      },
    }));

    expect(enrichedMentions[0].data.profileId).toBe("user_123");
    expect(enrichedMentions[0].data.email).toBe("john@example.com");
  });

  it("cleanup removes data for deleted mentions", () => {
    const customDataStore = new Map<string, Record<string, unknown>>();
    customDataStore.set("@John", { profileId: "user_123" });
    customDataStore.set("@Jane", { profileId: "user_456" });

    expect(customDataStore.size).toBe(2);

    const text = "@John";
    const mentions = parseMentions(text, [{ trigger: "@" }]);

    const currentKeys = new Set(
      mentions.map((m) => `${m.data.trigger}${m.data.name}`)
    );
    const keysToDelete: string[] = [];
    customDataStore.forEach((_, key) => {
      if (!currentKeys.has(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => customDataStore.delete(key));

    expect(customDataStore.size).toBe(1);
    expect(customDataStore.has("@John")).toBe(true);
    expect(customDataStore.has("@Jane")).toBe(false);
  });

  it("handles multiple mentions with same name sharing custom data", () => {
    const customDataStore = new Map<string, Record<string, unknown>>();
    customDataStore.set("@John", {
      profileId: "user_123",
      avatarUrl: "https://example.com/john.jpg",
    });

    const text = "@John and @John again";
    const mentions = parseMentions(text, [{ trigger: "@" }]);

    const enrichedMentions = mentions.map((m) => ({
      ...m,
      data: {
        ...m.data,
        ...customDataStore.get(`${m.data.trigger}${m.data.name}`),
      },
    }));

    expect(enrichedMentions).toHaveLength(2);
    expect(enrichedMentions[0].data.profileId).toBe("user_123");
    expect(enrichedMentions[1].data.profileId).toBe("user_123");
    expect(enrichedMentions[0].data.avatarUrl).toBe(
      "https://example.com/john.jpg"
    );
    expect(enrichedMentions[1].data.avatarUrl).toBe(
      "https://example.com/john.jpg"
    );
  });

  it("supports multi-word mentions with custom data", () => {
    const customDataStore = new Map<string, Record<string, unknown>>();
    customDataStore.set("@John Smith", {
      profileId: "user_123",
      fullName: "John Smith",
    });

    const text = "Hey @John Smith, how are you?";
    const mentions = parseMentions(text, [
      { trigger: "@", allowedSpacesCount: 1 },
    ]);

    const enrichedMentions = mentions.map((m) => ({
      ...m,
      data: {
        ...m.data,
        ...customDataStore.get(`${m.data.trigger}${m.data.name}`),
      },
    }));

    expect(enrichedMentions[0].data.name).toBe("John Smith");
    expect(enrichedMentions[0].data.profileId).toBe("user_123");
    expect(enrichedMentions[0].data.fullName).toBe("John Smith");
  });

  it("supports different custom data for different triggers", () => {
    const customDataStore = new Map<string, Record<string, unknown>>();
    customDataStore.set("@John", {
      type: "user",
      profileId: "user_123",
    });
    customDataStore.set("#react", {
      type: "topic",
      topicId: "topic_456",
      followerCount: 1234,
    });

    const text = "Hey @John, check #react";
    const mentions = parseMentions(text, [{ trigger: "@" }, { trigger: "#" }]);

    const enrichedMentions = mentions.map((m) => ({
      ...m,
      data: {
        ...m.data,
        ...customDataStore.get(`${m.data.trigger}${m.data.name}`),
      },
    }));

    expect(enrichedMentions[0].data.type).toBe("user");
    expect(enrichedMentions[0].data.profileId).toBe("user_123");
    expect(enrichedMentions[1].data.type).toBe("topic");
    expect(enrichedMentions[1].data.topicId).toBe("topic_456");
    expect(enrichedMentions[1].data.followerCount).toBe(1234);
  });
});
