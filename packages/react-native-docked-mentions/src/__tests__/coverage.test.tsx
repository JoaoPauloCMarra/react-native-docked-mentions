import { useRef, useState, Fragment, RefObject } from "react";
import { TextInput } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { MentionProvider, useMentionInput, useMention } from "../main";

const TestInputWithRef = (props: {
  value: string;
  onChangeText: (text: string) => void;
  externalRef?: RefObject<TextInput | null>;
}) => {
  const { textInputProps, inputRef } = useMentionInput({
    value: props.value,
    onChangeText: props.onChangeText,
    inputRef: props.externalRef,
  });

  return (
    <TextInput
      ref={inputRef}
      testID="input"
      placeholder="Type here"
      {...textInputProps}
    />
  );
};

const TestFocusComponent = () => {
  const { insertMention } = useMention();
  const [value, setValue] = useState("");

  return (
    <Fragment>
      <TestInputWithRef value={value} onChangeText={setValue} />
      <TextInput
        testID="trigger-button"
        onFocus={() => insertMention({ id: "1", name: "Test", trigger: "@" })}
      />
    </Fragment>
  );
};

describe("useMentionInput", () => {
  it("uses external ref when provided", () => {
    const ExternalRefComponent = () => {
      const externalRef = useRef<TextInput>(null);
      const [value, setValue] = useState("");

      return (
        <MentionProvider triggers={[{ trigger: "@" }]}>
          <TestInputWithRef
            value={value}
            onChangeText={setValue}
            externalRef={externalRef}
          />
        </MentionProvider>
      );
    };

    const { getByTestId } = render(<ExternalRefComponent />);
    const input = getByTestId("input");

    expect(input).toBeDefined();
  });

  it("registers input with provider on mount", () => {
    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestFocusComponent />
      </MentionProvider>
    );

    const input = getByTestId("input");
    expect(input).toBeDefined();
  });
});

describe("MentionProvider - insertMention", () => {
  it("successfully inserts mention with valid state", async () => {
    const TestComponent = () => {
      const { insertMention } = useMention();
      const [value, setValue] = useState("");

      return (
        <Fragment>
          <TestInputWithRef value={value} onChangeText={setValue} />
          <TextInput
            testID="insert-trigger"
            onFocus={() =>
              insertMention({ id: "1", name: "John", trigger: "@" })
            }
          />
        </Fragment>
      );
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const input = getByTestId("input");

    fireEvent.changeText(input, "@j");
    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 2, end: 2 } },
    });

    const trigger = getByTestId("insert-trigger");
    fireEvent(trigger, "focus");

    await waitFor(() => {
      expect(input.props.value).toContain("@John");
    });
  });

  it("handles insertMention when input is not registered", () => {
    const TestComponent = () => {
      const { insertMention } = useMention();

      return (
        <TextInput
          testID="trigger"
          onFocus={() => insertMention({ id: "1", name: "Test", trigger: "@" })}
        />
      );
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const trigger = getByTestId("trigger");
    fireEvent(trigger, "focus");
  });

  it("handles insertMention without active trigger", () => {
    const TestComponent = () => {
      const { insertMention } = useMention();
      const [value, setValue] = useState("Hello");

      return (
        <Fragment>
          <TestInputWithRef value={value} onChangeText={setValue} />
          <TextInput
            testID="trigger"
            onFocus={() =>
              insertMention({ id: "1", name: "Test", trigger: "@" })
            }
          />
        </Fragment>
      );
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const trigger = getByTestId("trigger");
    fireEvent(trigger, "focus");
  });

  it("handles text selection (non-collapsed)", () => {
    const TestComponent = () => {
      const [value, setValue] = useState("Hello world");

      return <TestInputWithRef value={value} onChangeText={setValue} />;
    };

    const { getByTestId } = render(
      <MentionProvider triggers={[{ trigger: "@" }]}>
        <TestComponent />
      </MentionProvider>
    );

    const input = getByTestId("input");

    fireEvent(input, "selectionChange", {
      nativeEvent: { selection: { start: 0, end: 5 } },
    });
  });
});

describe("findMentionAtCursor", () => {
  it("finds mention at cursor position", () => {
    const { findMentionAtCursor } = require("../mention-utils");
    const mentions = [
      {
        start: 0,
        end: 5,
        data: { id: "1", name: "John", trigger: "@" },
      },
      {
        start: 10,
        end: 15,
        data: { id: "2", name: "Jane", trigger: "@" },
      },
    ];

    const result = findMentionAtCursor(3, mentions);
    expect(result).toBeDefined();
    expect(result?.data.name).toBe("John");
  });

  it("returns undefined when cursor is not in mention", () => {
    const { findMentionAtCursor } = require("../mention-utils");
    const mentions = [
      {
        start: 0,
        end: 5,
        data: { id: "1", name: "John", trigger: "@" },
      },
    ];

    const result = findMentionAtCursor(10, mentions);
    expect(result).toBeUndefined();
  });
});
