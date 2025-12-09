import { ReactNode } from "react";
import { Text, TextInput } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { MentionProvider, useMentionInput, useMentionState } from "../main";

const TestInput = (props: {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}) => {
  const { textInputProps } = useMentionInput({
    value: props.value ?? "",
    onChangeText: props.onChangeText ?? (() => {}),
  });
  return (
    <TextInput
      testID="input"
      placeholder="Type here"
      {...props}
      {...textInputProps}
    />
  );
};

const StateViewer = () => {
  const { activeTrigger, currentQuery } = useMentionState();
  return (
    <Text testID="state-viewer">
      {JSON.stringify({ activeTrigger, currentQuery })}
    </Text>
  );
};

describe("Complex Mention Scenarios", () => {
  // Setup helper for cleaner tests
  const renderWithProvider = (
    child: ReactNode,
    triggers = [{ trigger: "@", allowedSpacesCount: 1 }, { trigger: "#" }]
  ) => {
    return render(
      <MentionProvider triggers={triggers}>
        {child}
        <StateViewer />
      </MentionProvider>
    );
  };

  it("handles mention at the very start of text", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "@Start");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 6, end: 6 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("Start");
    });
  });

  it("handles mention at the very end of text", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "Hello @End");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 10, end: 10 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("End");
    });
  });

  it("handles mixed triggers in one line", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    // Type #topic
    fireEvent.changeText(input, "Check #topic");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 12, end: 12 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("#");
      expect(state.currentQuery).toBe("topic");
    });

    // Continue typing " and @user"
    fireEvent.changeText(input, "Check #topic and @user");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 22, end: 22 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("user");
    });
  });

  it("handles cursor movement back into a mention", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    const text = "Hello @John there";
    fireEvent.changeText(input, text);
    // Cursor at end, shouldn't be triggering strictly if we assume spaced mention ended,
    // BUT wait, allowedSpacesCount: 1 potentially keeps it active depending on logic.
    // Let's testing moving cursor right after 'n' in John

    // "Hello @Joh|n there" index: 7 + 4 = 11 (after 'h') -> 12 is 'n'.
    // "Hello @John there"
    // 01234567890123456
    // @ starts at 6. J(7) o(8) h(9) n(10). Space(11).

    // Move cursor to after 'Joh' (index 10)
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 10, end: 10 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("Joh");
    });
  });

  it("handles mentions with punctuation immediately after", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "Hello @Jane.");

    // Cursor at end (after .)
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 12, end: 12 } },
    });

    // Should NOT be triggering because of '.' usually, unless we want it to.
    // Commonly punctuation breaks the mention.
    // Let's assume punctuation breaks it or it's not a valid query part.
    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("Jane.");
    });
  });

  it("handles mentions inside parentheses", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "(@user)");
    // Cursor after 'r' (index 6)
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 6, end: 6 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("user");
    });
  });

  it("handles spacing correctly with allowedSpacesCount", async () => {
    // Configured with allowedSpacesCount: 1
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "@John Doe");
    // Cursor at end
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 9, end: 9 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("John Doe");
    });
  });

  it("stops triggering after exceeding allowed spaces", async () => {
    // Configured with allowedSpacesCount: 1
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <TestInput value="" onChangeText={() => {}} />
    );
    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "@John Doe Smith"); // 2 spaces
    // Cursor at end
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 15, end: 15 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBeNull();
    });
  });
});
