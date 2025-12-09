import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { MentionText } from "../mention-text";
import type { MentionRange, MentionTrigger } from "../types";

describe("MentionText", () => {
  const triggers: MentionTrigger[] = [{ trigger: "@" }, { trigger: "#" }];

  describe("with explicit mentions", () => {
    it("renders plain text without mentions", () => {
      const { getByText } = render(
        <MentionText mentions={[]}>Hello world</MentionText>
      );

      expect(getByText("Hello world")).toBeDefined();
    });

    it("renders text with a single mention", () => {
      const mentions: MentionRange[] = [
        {
          start: 6,
          end: 11,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText mentions={mentions}>Hello @John!</MentionText>
      );

      expect(getByText("Hello ")).toBeDefined();
      expect(getByText("@John")).toBeDefined();
      expect(getByText("!")).toBeDefined();
    });

    it("renders text with multiple mentions", () => {
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
        {
          start: 11,
          end: 16,
          data: { id: "2", name: "Jane", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText mentions={mentions}>@John and @Jane</MentionText>
      );

      expect(getByText("@John")).toBeDefined();
      expect(getByText(" and @Jane")).toBeDefined();
    });

    it("filters out invalid mention ranges", () => {
      const mentions: MentionRange[] = [
        {
          start: -1,
          end: 5,
          data: { id: "1", name: "Invalid", trigger: "@" },
        },
        {
          start: 0,
          end: 100,
          data: { id: "2", name: "OutOfBounds", trigger: "@" },
        },
        {
          start: 6,
          end: 12,
          data: { id: "3", name: "Valid", trigger: "@" },
        },
      ];

      const { getByText, queryByText } = render(
        <MentionText mentions={mentions}>Hello @Valid</MentionText>
      );

      expect(getByText("@Valid")).toBeDefined();
      expect(queryByText("Invalid")).toBeNull();
      expect(queryByText("OutOfBounds")).toBeNull();
    });
  });

  describe("with auto-parsing", () => {
    it("auto-parses mentions from text", () => {
      const { getByText } = render(
        <MentionText triggers={triggers}>Hello @John</MentionText>
      );

      expect(getByText("@John")).toBeDefined();
    });

    it("auto-parses multiple triggers", () => {
      const { getByText } = render(
        <MentionText triggers={triggers}>@User check #topic</MentionText>
      );

      expect(getByText("@User")).toBeDefined();
      expect(getByText("#topic")).toBeDefined();
    });
  });

  describe("styling", () => {
    it("applies custom style to text", () => {
      const { getByText } = render(
        <MentionText mentions={[]} style={{ fontSize: 20 }}>
          Hello
        </MentionText>
      );

      const textElement = getByText("Hello");
      expect(textElement.props.style).toEqual({ fontSize: 20 });
    });

    it("applies custom mention style as object", () => {
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText
          mentions={mentions}
          mentionStyle={{ color: "red", fontSize: 18 }}
        >
          @John
        </MentionText>
      );

      const mentionElement = getByText("@John");
      expect(mentionElement.props.style).toBeDefined();
      expect(Array.isArray(mentionElement.props.style)).toBe(true);
    });

    it("applies custom mention style as function", () => {
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const mentionStyleFn = jest.fn((mention) => ({
        color: mention.trigger === "@" ? "blue" : "green",
      }));

      const { getByText } = render(
        <MentionText mentions={mentions} mentionStyle={mentionStyleFn}>
          @John
        </MentionText>
      );

      expect(mentionStyleFn).toHaveBeenCalled();
      expect(getByText("@John")).toBeDefined();
    });
  });

  describe("interactions", () => {
    it("calls onPressMention when mention is pressed", () => {
      const onPressMention = jest.fn();
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText mentions={mentions} onPressMention={onPressMention}>
          @John
        </MentionText>
      );

      const mentionElement = getByText("@John");
      fireEvent.press(mentionElement);

      expect(onPressMention).toHaveBeenCalledWith({
        id: "1",
        name: "John",
        trigger: "@",
      });
    });

    it("does not call onPressMention for regular text", () => {
      const onPressMention = jest.fn();
      const mentions: MentionRange[] = [
        {
          start: 6,
          end: 11,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText mentions={mentions} onPressMention={onPressMention}>
          Hello @John
        </MentionText>
      );

      const textElement = getByText("Hello ");
      fireEvent.press(textElement);

      expect(onPressMention).not.toHaveBeenCalled();
    });
  });

  describe("custom rendering", () => {
    it("uses custom renderMention function", () => {
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const renderMention = (_data: { id: string; name: string; trigger: string }, content: string) => (
        <Text testID="custom-mention" style={{ color: "purple" }}>
          {content.toUpperCase()}
        </Text>
      );

      const { getByTestId, getByText } = render(
        <MentionText mentions={mentions} renderMention={renderMention}>
          @John
        </MentionText>
      );

      expect(getByTestId("custom-mention")).toBeDefined();
      expect(getByText("@JOHN")).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles empty text", () => {
      const { root } = render(<MentionText mentions={[]}>{""}</MentionText>);
      expect(root).toBeDefined();
    });

    it("handles text with only mentions", () => {
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText mentions={mentions}>@John</MentionText>
      );

      expect(getByText("@John")).toBeDefined();
    });

    it("handles consecutive mentions", () => {
      const mentions: MentionRange[] = [
        {
          start: 0,
          end: 5,
          data: { id: "1", name: "John", trigger: "@" },
        },
        {
          start: 5,
          end: 10,
          data: { id: "2", name: "Jane", trigger: "@" },
        },
      ];

      const { getByText } = render(
        <MentionText mentions={mentions}>@John@Jane</MentionText>
      );

      expect(getByText("@John")).toBeDefined();
      expect(getByText("@Jane")).toBeDefined();
    });
  });
});
