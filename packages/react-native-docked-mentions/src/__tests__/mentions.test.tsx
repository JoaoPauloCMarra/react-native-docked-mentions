import { Fragment } from "react";
import { Text, TextInput } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import {
  MentionProvider,
  useMentionInput,
  useMentionState,
  useMention,
} from "../main";
import type { MentionSuggestion } from "../types";

const TestInput = (props: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => {
  const { textInputProps } = useMentionInput({
    value: props.value,
    onChangeText: props.onChangeText,
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

const TestList = ({ suggestions }: { suggestions: MentionSuggestion[] }) => {
  const { isMentioning } = useMention();

  if (!isMentioning) return null;

  return (
    <Fragment>
      {suggestions.map((s) => (
        <Text key={s.id}>{s.name}</Text>
      ))}
    </Fragment>
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

describe("Headless Mention System", () => {
  it("updates query state when typing trigger", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestInput value="" onChangeText={() => {}} />
        <StateViewer />
      </MentionProvider>
    );

    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "@john");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 5, end: 5 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("john");
    });
  });

  it("handles multiple triggers", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }, { trigger: "#" }]}>
        <TestInput value="" onChangeText={() => {}} />
        <StateViewer />
      </MentionProvider>
    );

    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "Hello #world");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 12, end: 12 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("#");
      expect(state.currentQuery).toBe("world");
    });
  });

  it("clears state when trigger condition is lost", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestInput value="" onChangeText={() => {}} />
        <StateViewer />
      </MentionProvider>
    );

    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "@u");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 2, end: 2 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
    });

    fireEvent.changeText(input, "u");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 1, end: 1 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBeNull();
    });
  });

  it("handles hashtag followed by mention (Edge Case)", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }, { trigger: "#" }]}>
        <TestInput value="" onChangeText={() => {}} />
        <StateViewer />
      </MentionProvider>
    );

    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "test #typescript ");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 17, end: 17 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBeNull();
    });

    fireEvent.changeText(input, "test #typescript @");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 18, end: 18 } },
    });

    await waitFor(() => {
      const state = JSON.parse(
        getByTestId("state-viewer").props.children.toString()
      );
      expect(state.activeTrigger).toBe("@");
      expect(state.currentQuery).toBe("");
    });
  });
});

describe("Headless List Integration", () => {
  const suggestions: MentionSuggestion[] = [
    { id: "1", name: "John Doe", trigger: "@" },
    { id: "2", name: "Jane Doe", trigger: "@" },
  ];

  it("shows suggestions when mentioning", async () => {
    const { getByText, getByPlaceholderText } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestInput value="" onChangeText={() => {}} />
        <TestList suggestions={suggestions} />
      </MentionProvider>
    );

    const input = getByPlaceholderText("Type here");

    fireEvent.changeText(input, "@J");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 2, end: 2 } },
    });

    await waitFor(() => {
      expect(getByText("John Doe")).toBeDefined();
    });
  });

  it("hides suggestions when not mentioning", () => {
    const { queryByText } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestInput value="" onChangeText={() => {}} />
        <TestList suggestions={suggestions} />
      </MentionProvider>
    );

    expect(queryByText("John Doe")).toBeNull();
  });
});
