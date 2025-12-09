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

describe("onChangeMentions Integration", () => {
  it("calls onChangeMentions with enriched mentions containing custom data", async () => {
    const onChangeMentions = jest.fn();
    const onChangeText = jest.fn();

    const TestComponent = () => {
      const { textInputProps } = useMentionInput({
        value: "",
        onChangeText,
        onChangeMentions,
      });
      const { insertMention } = useMentionState();

      return (
        <>
          <TextInput testID="input" {...textInputProps} />
          <Text
            testID="insert-btn"
            onPress={() =>
              insertMention({
                id: "user_123",
                name: "John Doe",
                trigger: "@",
                data: {
                  profileId: "user_123",
                  avatarUrl: "https://example.com/avatar.jpg",
                  role: "admin",
                },
              })
            }
          >
            Insert
          </Text>
        </>
      );
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const input = getByTestId("input");
    fireEvent.changeText(input, "@");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 1, end: 1 } },
    });

    const insertBtn = getByTestId("insert-btn");
    fireEvent.press(insertBtn);

    await waitFor(() => {
      expect(onChangeMentions).toHaveBeenCalled();
      const mentions =
        onChangeMentions.mock.calls[onChangeMentions.mock.calls.length - 1][0];
      expect(mentions).toHaveLength(1);
      expect(mentions[0].data.name).toBe("John Doe");
      expect(mentions[0].data.profileId).toBe("user_123");
      expect(mentions[0].data.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(mentions[0].data.role).toBe("admin");
    });
  });

  it("preserves custom data through text changes", async () => {
    const onChangeMentions = jest.fn();
    let textValue = "";

    const TestComponent = () => {
      const { textInputProps } = useMentionInput({
        value: textValue,
        onChangeText: (text) => {
          textValue = text;
        },
        onChangeMentions,
      });
      const { insertMention } = useMentionState();

      return (
        <>
          <TextInput testID="input" {...textInputProps} />
          <Text
            testID="insert-btn"
            onPress={() =>
              insertMention({
                id: "user_123",
                name: "John",
                trigger: "@",
                data: { profileId: "user_123", email: "john@example.com" },
              })
            }
          >
            Insert
          </Text>
        </>
      );
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const input = getByTestId("input");
    fireEvent.changeText(input, "@");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 1, end: 1 } },
    });

    fireEvent.press(getByTestId("insert-btn"));

    await waitFor(() => {
      const mentions =
        onChangeMentions.mock.calls[onChangeMentions.mock.calls.length - 1][0];
      expect(mentions[0].data.profileId).toBe("user_123");
    });

    fireEvent.changeText(input, "@John hello world");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 17, end: 17 } },
    });

    await waitFor(() => {
      const mentions =
        onChangeMentions.mock.calls[onChangeMentions.mock.calls.length - 1][0];
      expect(mentions).toHaveLength(1);
      expect(mentions[0].data.profileId).toBe("user_123");
      expect(mentions[0].data.email).toBe("john@example.com");
    });
  });

  it("handles multiple mentions with different custom data", async () => {
    const onChangeMentions = jest.fn();
    let textValue = "";

    const TestComponent = () => {
      const { textInputProps } = useMentionInput({
        value: textValue,
        onChangeText: (text) => {
          textValue = text;
        },
        onChangeMentions,
      });
      const { insertMention } = useMentionState();

      return (
        <>
          <TextInput testID="input" {...textInputProps} />
          <Text
            testID="insert-user"
            onPress={() =>
              insertMention({
                id: "user_123",
                name: "John",
                trigger: "@",
                data: { type: "user", profileId: "user_123" },
              })
            }
          >
            Insert User
          </Text>
          <Text
            testID="insert-topic"
            onPress={() =>
              insertMention({
                id: "topic_456",
                name: "react",
                trigger: "#",
                data: { type: "topic", topicId: "topic_456", followers: 1234 },
              })
            }
          >
            Insert Topic
          </Text>
        </>
      );
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }, { trigger: "#" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const input = getByTestId("input");

    fireEvent.changeText(input, "@");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 1, end: 1 } },
    });
    fireEvent.press(getByTestId("insert-user"));

    await waitFor(() => {
      expect(onChangeMentions).toHaveBeenCalled();
    });

    fireEvent.changeText(input, "@John #");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 7, end: 7 } },
    });
    fireEvent.press(getByTestId("insert-topic"));

    await waitFor(() => {
      const mentions =
        onChangeMentions.mock.calls[onChangeMentions.mock.calls.length - 1][0];
      expect(mentions).toHaveLength(2);

      const userMention = mentions.find((m: any) => m.data.trigger === "@");
      const topicMention = mentions.find((m: any) => m.data.trigger === "#");

      expect(userMention?.data.type).toBe("user");
      expect(userMention?.data.profileId).toBe("user_123");

      expect(topicMention?.data.type).toBe("topic");
      expect(topicMention?.data.topicId).toBe("topic_456");
      expect(topicMention?.data.followers).toBe(1234);
    });
  });
});
