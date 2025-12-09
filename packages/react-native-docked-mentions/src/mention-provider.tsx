import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  PropsWithChildren,
} from "react";
import { MentionTrigger, MentionSuggestion, MentionRange } from "./types";
import { parseMentions } from "./mention-utils";

const TRIGGER_LOOKBACK_LIMIT = 50;

interface MentionContextValue {
  activeTrigger: string | null;
  currentQuery: string;
  insertMention: (suggestion: MentionSuggestion) => void;
  isMentioning: boolean;
  mentions: MentionRange[];
  onInputStateChange: (
    text: string,
    selection: { start: number; end: number }
  ) => void;
  registerInput: (input: {
    value: string;
    onChange: (t: string) => void;
    focus: () => void;
  }) => void;
}

const MentionContext = createContext<MentionContextValue | null>(null);

interface MentionProviderProps {
  triggers: MentionTrigger[];
}

export function MentionProvider({
  children,
  triggers,
}: PropsWithChildren<MentionProviderProps>) {
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [targetRange, setTargetRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [mentions, setMentions] = useState<MentionRange[]>([]);

  const inputRef = useRef<{
    value: string;
    onChange: (t: string) => void;
    focus: () => void;
  } | null>(null);

  const insertingRef = useRef(false);

  const mentionDataStore = useRef<Map<string, Record<string, unknown>>>(
    new Map()
  );

  const getMentionKey = useCallback(
    (trigger: string, name: string) => `${trigger}${name}`,
    []
  );

  const updateMentions = useCallback(
    (text: string) => {
      const parsedMentions = parseMentions(text, triggers);

      const enrichedMentions = parsedMentions.map((mention) => {
        const key = getMentionKey(mention.data.trigger, mention.data.name);
        const customData = mentionDataStore.current.get(key);

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

      const currentKeys = new Set(
        enrichedMentions.map((m) => getMentionKey(m.data.trigger, m.data.name))
      );
      const keysToDelete: string[] = [];
      mentionDataStore.current.forEach((_, key) => {
        if (!currentKeys.has(key)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => mentionDataStore.current.delete(key));

      setMentions(enrichedMentions);
      return enrichedMentions;
    },
    [triggers, getMentionKey]
  );

  const registerInput = useCallback(
    (input: {
      value: string;
      onChange: (t: string) => void;
      focus: () => void;
    }) => {
      inputRef.current = input;
      updateMentions(input.value);
    },
    [updateMentions]
  );

  const onInputStateChange = useCallback(
    (text: string, selection: { start: number; end: number }) => {
      if (insertingRef.current) {
        return;
      }

      updateMentions(text);

      if (selection.start !== selection.end) {
        setActiveTrigger(null);
        return;
      }

      const cursor = selection.start;
      const lookback = text.slice(
        Math.max(0, cursor - TRIGGER_LOOKBACK_LIMIT),
        cursor
      );

      let bestMatch: {
        trigger: string;
        index: number;
        query: string;
      } | null = null;

      for (const t of triggers) {
        const lastIdx = lookback.lastIndexOf(t.trigger);
        if (lastIdx !== -1) {
          const realIdx = Math.max(0, cursor - 50) + lastIdx;
          const prevChar = text[realIdx - 1];
          const isStart = realIdx === 0;
          const isPrecededBySpace = !prevChar || /[\s(]/.test(prevChar);

          if (isStart || isPrecededBySpace) {
            const query = lookback.slice(lastIdx + t.trigger.length);
            const allowedSpaces = t.allowedSpacesCount ?? 0;
            const wordGroups = query
              .trim()
              .split(/\s+/)
              .filter((w) => w.length > 0);
            const additionalWordGroups = Math.max(0, wordGroups.length - 1);

            if (
              additionalWordGroups <= allowedSpaces &&
              !query.includes("\n")
            ) {
              if (!bestMatch || lastIdx > bestMatch.index) {
                bestMatch = { trigger: t.trigger, index: lastIdx, query };
              }
            }
          }
        }
      }

      if (bestMatch) {
        setActiveTrigger(bestMatch.trigger);
        setCurrentQuery(bestMatch.query);
        const realIdx =
          Math.max(0, cursor - TRIGGER_LOOKBACK_LIMIT) + bestMatch.index;
        setTargetRange({ start: realIdx, end: cursor });
      } else {
        setActiveTrigger(null);
        setTargetRange(null);
      }
    },
    [triggers, updateMentions]
  );

  const insertMention = useCallback(
    (suggestion: MentionSuggestion) => {
      const input = inputRef.current;
      if (!input || !targetRange || !activeTrigger) return;

      const { start, end } = targetRange;
      const { value, onChange, focus } = input;

      const before = value.slice(0, start);
      const after = value.slice(end);
      const inserted = `${activeTrigger}${suggestion.name} `;
      const newValue = before + inserted + after;

      if (suggestion.data && typeof suggestion.data === "object") {
        const key = getMentionKey(activeTrigger, suggestion.name);
        mentionDataStore.current.set(
          key,
          suggestion.data as Record<string, unknown>
        );
      }

      insertingRef.current = true;
      setActiveTrigger(null);
      setTargetRange(null);
      setCurrentQuery("");

      onChange(newValue);

      requestAnimationFrame(() => {
        insertingRef.current = false;
        updateMentions(newValue);
      });

      focus();
    },
    [targetRange, activeTrigger, getMentionKey, updateMentions]
  );

  const contextValue = useMemo(
    () => ({
      activeTrigger,
      currentQuery,
      isMentioning: !!activeTrigger,
      mentions,
      onInputStateChange,
      insertMention,
      registerInput,
    }),
    [
      activeTrigger,
      currentQuery,
      mentions,
      onInputStateChange,
      insertMention,
      registerInput,
    ]
  );

  return (
    <MentionContext.Provider value={contextValue}>
      {children}
    </MentionContext.Provider>
  );
}

export function useMention() {
  const context = useContext(MentionContext);
  if (!context) {
    throw new Error("useMention must be used within MentionProvider");
  }
  return context;
}
