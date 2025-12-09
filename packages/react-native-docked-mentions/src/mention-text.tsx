import { memo, useMemo, ReactNode, Fragment } from "react";
import { Text, TextStyle, StyleProp } from "react-native";
import { MentionTextProps } from "./types";
import { parseMentions } from "./mention-utils";

export const MentionText = memo(
  ({
    children,
    mentions: providedMentions,
    triggers = [],
    style,
    mentionStyle,
    onPressMention,
    renderMention,
  }: MentionTextProps) => {
    const text = children || "";

    const mentions = useMemo(() => {
      if (providedMentions) return providedMentions;
      return parseMentions(text, triggers);
    }, [text, providedMentions, triggers]);

    const fragments = useMemo(() => {
      const parts: ReactNode[] = [];
      let lastIndex = 0;

      const validMentions = mentions
        .filter((m) => m.start >= 0 && m.end <= text.length && m.start < m.end)
        .sort((a, b) => a.start - b.start);

      validMentions.forEach((mention, index) => {
        if (mention.start > lastIndex) {
          parts.push(
            <Text key={`text-${index}`} style={style}>
              {text.slice(lastIndex, mention.start)}
            </Text>
          );
        }

        const mentionContent = text.slice(mention.start, mention.end);
        const triggerConfig = triggers.find(
          (t) => t.trigger === mention.data.trigger
        );
        const shouldHideTrigger = triggerConfig?.hideTrigger ?? false;
        const displayContent = shouldHideTrigger
          ? mentionContent.replace(mention.data.trigger, "")
          : mentionContent;

        const specificStyle =
          typeof mentionStyle === "function"
            ? mentionStyle(mention.data)
            : mentionStyle;

        const mergedStyle = [
          style,
          { fontWeight: "bold", color: "#007AFF" },
          specificStyle,
        ] as StyleProp<TextStyle>;

        if (renderMention) {
          parts.push(
            <Fragment key={`mention-${index}`}>
              {renderMention(mention.data, displayContent)}
            </Fragment>
          );
        } else {
          parts.push(
            <Text
              key={`mention-${index}`}
              style={mergedStyle}
              onPress={
                onPressMention ? () => onPressMention(mention.data) : undefined
              }
              accessible={!!onPressMention}
              accessibilityRole={onPressMention ? "button" : "text"}
            >
              {displayContent}
            </Text>
          );
        }

        lastIndex = mention.end;
      });

      if (lastIndex < text.length) {
        parts.push(
          <Text key="text-end" style={style}>
            {text.slice(lastIndex)}
          </Text>
        );
      }

      return parts;
    }, [text, mentions, style, mentionStyle, onPressMention, renderMention]);

    return <Text style={style}>{fragments}</Text>;
  }
);

MentionText.displayName = "MentionText";
