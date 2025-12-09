import { ReactNode, Fragment } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from "react-native";
import { MentionSuggestion, useMention } from "react-native-docked-mentions";

interface SuggestionListProps {
  suggestions: MentionSuggestion[];
  onSuggestionPress?: (suggestion: MentionSuggestion) => void;
  renderItem?: (result: MentionSuggestion, onPress: () => void) => ReactNode;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SuggestionList({
  suggestions,
  onSuggestionPress,
  renderItem,
  isLoading,
  style,
}: SuggestionListProps) {
  const { isMentioning, insertMention } = useMention();

  if (!isMentioning) return null;

  const handlePress = (item: MentionSuggestion) => {
    insertMention(item);
    onSuggestionPress?.(item);
  };

  return (
    <View style={[styles.container, style]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#22c55e" />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          {suggestions.map((item) => (
            <Fragment key={item.id}>
              {renderItem ? renderItem(item, () => handlePress(item)) : null}
            </Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#333",
    maxHeight: 250,
    zIndex: 9999,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
});
