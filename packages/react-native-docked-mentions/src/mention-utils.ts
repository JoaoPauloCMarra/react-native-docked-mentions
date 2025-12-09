import { MentionTrigger, MentionRange } from "./types";

export function parseMentions(
  text: string,
  triggers: MentionTrigger[]
): MentionRange[] {
  const mentions: MentionRange[] = [];

  triggers.forEach((trigger) => {
    const escapedTrigger = trigger.trigger.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const maxSpaces = trigger.allowedSpacesCount ?? 0;
    const regex = new RegExp(
      `${escapedTrigger}([\\w-]+(?:\\s+[\\w-]+){0,${maxSpaces}})`,
      "g"
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const content = match[0];
      const name = match[1];
      const end = start + content.length;

      mentions.push({
        start,
        end,
        data: {
          id: content,
          name,
          trigger: trigger.trigger,
        },
      });
    }
  });

  return mentions.sort((a, b) => a.start - b.start);
}

export function findMentionAtCursor(
  cursor: number,
  mentions: MentionRange[]
): MentionRange | undefined {
  return mentions.find(
    (mention) => cursor >= mention.start && cursor <= mention.end
  );
}
