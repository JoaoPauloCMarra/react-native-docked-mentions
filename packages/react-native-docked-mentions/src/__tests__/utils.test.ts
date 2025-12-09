import { parseMentions } from "../mention-utils";

describe("parseMentions", () => {
  it("matches simple mentions", () => {
    const text = "Hello @John, how are you?";
    const triggers = [{ trigger: "@" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("John");
    expect(mentions[0].start).toBe(6);
  });

  it("supports hyphenated names", () => {
    const text = "Hey @Jean-Pierre";
    const triggers = [{ trigger: "@" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("Jean-Pierre");
  });

  it("handles spaces when allowedSpacesCount is set", () => {
    const text = "Welcome @Mary Smith Jones to the team";
    const triggers = [{ trigger: "@", allowedSpacesCount: 2 }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("Mary Smith Jones");
  });

  it("respects allowedSpacesCount limit", () => {
    const text = "Hello @Mary Smith Jones Williams";
    const triggers = [{ trigger: "@", allowedSpacesCount: 1 }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("Mary Smith");
  });

  it("handles multiple mentions on same line", () => {
    const text = "@User1 and @User2";
    const triggers = [{ trigger: "@" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(2);
    expect(mentions[0].data.name).toBe("User1");
    expect(mentions[1].data.name).toBe("User2");
  });

  it("handles mixed triggers", () => {
    const text = "@User check #topic";
    const triggers = [{ trigger: "@" }, { trigger: "#" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(2);
    expect(mentions[0].data.trigger).toBe("@");
    expect(mentions[1].data.trigger).toBe("#");
  });

  it("handles extra whitespace if allowed", () => {
    const text = "@Mary    Smith";
    const triggers = [{ trigger: "@", allowedSpacesCount: 1 }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("Mary    Smith");
  });

  it("supports hashtags with hyphens", () => {
    const text = "Check #react-native";
    const triggers = [{ trigger: "#" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("react-native");
  });

  it("handles mentions separated by 'and' correctly", () => {
    const text = "@James Smith and @John Johnson";
    const triggers = [{ trigger: "@", allowedSpacesCount: 1 }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(2);
    expect(mentions[0].data.name).toBe("James Smith");
    expect(mentions[0].start).toBe(0);
    expect(mentions[0].end).toBe(12);
    expect(mentions[1].data.name).toBe("John Johnson");
    expect(mentions[1].start).toBe(17);
    expect(mentions[1].end).toBe(30);
  });

  it("stops at punctuation marks", () => {
    const text = "@John, @Jane. @Bob! @Alice?";
    const triggers = [{ trigger: "@" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(4);
    expect(mentions[0].data.name).toBe("John");
    expect(mentions[1].data.name).toBe("Jane");
    expect(mentions[2].data.name).toBe("Bob");
    expect(mentions[3].data.name).toBe("Alice");
  });

  it("does not match across newlines", () => {
    const text = "@James Smith \n\nIt was great";
    const triggers = [{ trigger: "@", allowedSpacesCount: 2 }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("James Smith");
  });

  it("handles mentions inside brackets and parentheses", () => {
    const text = "(@John) [@Jane] {@Bob}";
    const triggers = [{ trigger: "@" }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(3);
    expect(mentions[0].data.name).toBe("John");
    expect(mentions[1].data.name).toBe("Jane");
    expect(mentions[2].data.name).toBe("Bob");
  });

  it("handles mentions with emojis in surrounding text", () => {
    const text = "👋 @Hello World 🌍";
    const triggers = [{ trigger: "@", allowedSpacesCount: 1 }];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].data.name).toBe("Hello World");
  });

  it("handles complex sentence with multiple types of mentions", () => {
    const text =
      "Hey @Alice, did you see #project-x? It's similar to @Bob Smith's work.";
    const triggers = [
      { trigger: "@", allowedSpacesCount: 1 },
      { trigger: "#" },
    ];
    const mentions = parseMentions(text, triggers);

    expect(mentions).toHaveLength(3);
    expect(mentions[0].data.name).toBe("Alice");
    expect(mentions[1].data.name).toBe("project-x");
    expect(mentions[1].data.trigger).toBe("#");
    expect(mentions[2].data.name).toBe("Bob Smith");
  });

  it("handles long text performance (basic check)", () => {
    const text =
      "Lorem ipsum @user1 dolor sit amet @user2 consectetur adipiscing elit. " +
      "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(
        100
      ) +
      " @user3 ending.";
    const triggers = [{ trigger: "@" }];
    const start = performance.now();
    const mentions = parseMentions(text, triggers);
    const end = performance.now();

    expect(mentions.length).toBeGreaterThanOrEqual(3);
    expect(end - start).toBeLessThan(50); // Should be very fast
  });
});
