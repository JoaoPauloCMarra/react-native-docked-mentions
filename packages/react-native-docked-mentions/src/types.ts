import { ReactNode } from "react";
import { StyleProp, TextStyle } from "react-native";

export interface MentionTrigger {
  allowedSpacesCount?: number;
  hideTrigger?: boolean;
  trigger: string;
}

export interface MentionData {
  id: string;
  name: string;
  trigger: string;
  [key: string]: unknown;
}

export interface MentionRange {
  data: MentionData;
  end: number;
  start: number;
}

export interface MentionSuggestion {
  avatar?: string;
  data?: unknown;
  id: string;
  name: string;
  subtitle?: string;
  trigger: string;
}

export interface MentionInputProps {
  onChangeText: (text: string) => void;
  value: string;
  mentionStyle?:
    | StyleProp<TextStyle>
    | ((data: MentionData) => StyleProp<TextStyle>);
  multiline?: boolean;
  onBlur?: () => void;
  onChangeMentions?: (mentions: MentionRange[]) => void;
  onFocus?: () => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  selection?: { start: number; end: number };
  style?: StyleProp<TextStyle>;
  triggers?: MentionTrigger[];
}

export interface MentionTextProps {
  children?: string;
  mentions?: MentionRange[];
  triggers?: MentionTrigger[];
  style?: StyleProp<TextStyle>;
  mentionStyle?:
    | StyleProp<TextStyle>
    | ((data: MentionData) => StyleProp<TextStyle>);
  onPressMention?: (data: MentionData) => void;
  renderMention?: (data: MentionData, content: string) => ReactNode;
}
