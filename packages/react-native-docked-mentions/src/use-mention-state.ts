import { useMention } from "./mention-provider";

export function useMentionState() {
  const { activeTrigger, currentQuery, isMentioning, insertMention } =
    useMention();

  return {
    activeTrigger,
    currentQuery,
    isMentioning,
    insertMention,
  };
}
