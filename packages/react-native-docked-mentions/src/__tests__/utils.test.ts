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
});
