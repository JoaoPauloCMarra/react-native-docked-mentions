import { forwardRef, RefObject } from "react";
import { TextInput, TextInputProps, StyleSheet, ViewStyle } from "react-native";
import { useMentionInput, MentionRange } from "react-native-docked-mentions";

interface PostInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeMentions?: (mentions: MentionRange[]) => void;
  style?: ViewStyle;
}

export const PostInput = forwardRef<TextInput, PostInputProps>(
  ({ value, onChangeText, onChangeMentions, style, ...props }, ref) => {
    const { textInputProps, inputRef } = useMentionInput({
      value,
      onChangeText,
      onChangeMentions,
      inputRef: ref as RefObject<TextInput | null>,
    });

    return (
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        {...props}
        {...textInputProps}
      />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    fontSize: 18,
    color: "white",
    textAlignVertical: "top",
  },
});
