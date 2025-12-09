import { useRef, useEffect, useState, useCallback, RefObject } from "react";
import { TextInput, TextInputSelectionChangeEvent } from "react-native";
import { useMention } from "./mention-provider";
import { MentionInputProps } from "./types";

export function useMentionInput({
  value,
  onChangeText,
  onSelectionChange,
  onChangeMentions,
  inputRef,
}: MentionInputProps & { inputRef?: RefObject<TextInput | null> }) {
  const { onInputStateChange, registerInput, mentions } = useMention();

  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const latestTextRef = useRef(value);
  const latestSelectionRef = useRef({ start: 0, end: 0 });

  const internalRef = useRef<TextInput>(null);
  const resolvedRef = inputRef || internalRef;

  useEffect(() => {
    latestTextRef.current = value;
    onInputStateChange(value, latestSelectionRef.current);
  }, [value, onInputStateChange]);

  useEffect(() => {
    if (resolvedRef.current) {
      registerInput({
        value,
        onChange: onChangeText,
        focus: () => resolvedRef.current?.focus(),
      });
    }
  }, [value, onChangeText, registerInput, resolvedRef]);

  useEffect(() => {
    onChangeMentions?.(mentions);
  }, [mentions, onChangeMentions]);

  const handleSelectionChange = useCallback(
    (e: TextInputSelectionChangeEvent) => {
      const newSelection = e.nativeEvent.selection;

      setSelection(newSelection);
      latestSelectionRef.current = newSelection;

      onSelectionChange?.(newSelection);

      onInputStateChange(latestTextRef.current, newSelection);
    },
    [onInputStateChange, onSelectionChange]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      latestTextRef.current = text;
      onChangeText(text);
    },
    [onChangeText]
  );

  return {
    inputRef: resolvedRef,
    textInputProps: {
      value,
      onChangeText: handleChangeText,
      onSelectionChange: handleSelectionChange,
    },
    selection,
  };
}
