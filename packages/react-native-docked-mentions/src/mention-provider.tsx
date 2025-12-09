import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  PropsWithChildren,
} from "react";
import { MentionTrigger, MentionSuggestion } from "./types";

const TRIGGER_LOOKBACK_LIMIT = 50;

interface MentionContextValue {
  activeTrigger: string | null;
  currentQuery: string;
  insertMention: (suggestion: MentionSuggestion) => void;
  isMentioning: boolean;
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

  const inputRef = useRef<{
    value: string;
    onChange: (t: string) => void;
    focus: () => void;
  } | null>(null);

  const insertingRef = useRef(false);

  const registerInput = useCallback(
    (input: {
      value: string;
      onChange: (t: string) => void;
      focus: () => void;
    }) => {
      inputRef.current = input;
    },
    []
  );

  const onInputStateChange = useCallback(
    (text: string, selection: { start: number; end: number }) => {
      if (insertingRef.current) {
        return;
      }

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
    [triggers]
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

      insertingRef.current = true;
      setActiveTrigger(null);
      setTargetRange(null);
      setCurrentQuery("");

      onChange(newValue);

      requestAnimationFrame(() => {
        insertingRef.current = false;
      });

      focus();
    },
    [targetRange, activeTrigger]
  );

  const contextValue = useMemo(
    () => ({
      activeTrigger,
      currentQuery,
      isMentioning: !!activeTrigger,
      onInputStateChange,
      insertMention,
      registerInput,
    }),
    [
      activeTrigger,
      currentQuery,
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
