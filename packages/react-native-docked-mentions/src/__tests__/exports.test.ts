import * as exports from "../main";

describe("main.ts exports", () => {
  it("exports all required modules", () => {
    expect(typeof exports.MentionProvider).toBe("function");
    expect(typeof exports.useMention).toBe("function");
    expect(typeof exports.useMentionInput).toBe("function");
    expect(typeof exports.useMentionState).toBe("function");
    expect(typeof exports.MentionText).toBe("object");
    expect(typeof exports.parseMentions).toBe("function");
    expect(typeof exports.findMentionAtCursor).toBe("function");
  });
});
