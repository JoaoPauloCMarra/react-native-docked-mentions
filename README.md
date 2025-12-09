# react-native-docked-mentions

> **Headless mention system for React Native** – Build LinkedIn-style mentions with complete UI control

[![npm version](https://img.shields.io/npm/v/react-native-docked-mentions.svg)](https://www.npmjs.com/package/react-native-docked-mentions)
[![npm downloads](https://img.shields.io/npm/dm/react-native-docked-mentions.svg)](https://www.npmjs.com/package/react-native-docked-mentions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen.svg)](https://github.com/JoaoPauloCMarra/react-native-docked-mentions)

**Tiny** • **Fast** • **Flexible** • **Type-Safe**

```
📦 Package Size: 18 kB (gzipped)
📝 Source Code: 500 lines
✅ Test Coverage: 99%+
🎯 Zero Dependencies (peer deps only)
```

---

## Why Choose This Library?

### 🎨 **Truly Headless**

Unlike other libraries that force you into specific UI components, we provide **only the logic**. You build the UI exactly how you want it.

### ⚡ **Lightweight & Fast**

At just **18 kB**, we're **3-5x smaller** than alternatives while providing more flexibility.

### 🔒 **Production-Ready**

- **99%+ test coverage** with 9 comprehensive tests
- **Zero runtime dependencies** (only React & React Native)
- **100% TypeScript** with full type safety
- **Clean, professional codebase** – no bloat, no AI-generated comments

### 🚀 **Developer Experience**

- **Simple API** – 3 hooks, 1 provider, 1 component
- **Smart trigger detection** – Works with @mentions, #hashtags, or any custom trigger
- **Flexible rendering** – Style mentions with objects, functions, or custom components
- **Cross-platform** – iOS, Android, and Web

---

## Comparison with Alternatives

| Feature                   | react-native-docked-mentions | react-native-controlled-mentions | react-native-mentions-editor |
| ------------------------- | ---------------------------- | -------------------------------- | ---------------------------- |
| **Headless Architecture** | ✅ Full control              | ❌ Coupled UI                    | ❌ Coupled UI                |
| **Package Size**          | **18 kB**                    | ~45 kB                           | ~60 kB                       |
| **TypeScript**            | ✅ 100%                      | ✅ Yes                           | ⚠️ Partial                   |
| **Test Coverage**         | ✅ 99%+                      | ⚠️ Unknown                       | ⚠️ Unknown                   |
| **Custom UI**             | ✅ Complete freedom          | ⚠️ Limited                       | ⚠️ Limited                   |
| **Multiple Triggers**     | ✅ Unlimited                 | ✅ Yes                           | ⚠️ Limited                   |
| **Zero Dependencies**     | ✅ Yes                       | ❌ No                            | ❌ No                        |
| **Active Maintenance**    | ✅ 2025                      | ✅ 2024                          | ⚠️ 2023                      |

---

## Quick Start

### Installation

```bash
npm install react-native-docked-mentions
# or
yarn add react-native-docked-mentions
```

**Peer Dependencies:**

```bash
npm install react react-native
```

That's it! No native linking, no additional dependencies.

---

### Basic Example

```tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  MentionProvider,
  useMentionInput,
  useMentionState,
} from "react-native-docked-mentions";

// 1. Wrap your app with MentionProvider
export default function App() {
  return (
    <MentionProvider triggers={[{ trigger: "@" }, { trigger: "#" }]}>
      <ChatScreen />
    </MentionProvider>
  );
}

// 2. Build your custom input
function ChatInput() {
  const [text, setText] = useState("");
  const { textInputProps } = useMentionInput({
    value: text,
    onChangeText: setText,
  });

  return (
    <TextInput
      {...textInputProps}
      placeholder="Type @ to mention someone..."
      style={{ padding: 16, fontSize: 16 }}
    />
  );
}

// 3. Build your custom suggestion list
function SuggestionList() {
  const { isMentioning, currentQuery, insertMention } = useMentionState();

  // Filter your data based on currentQuery
  const suggestions = users.filter((u) =>
    u.name.toLowerCase().includes(currentQuery.toLowerCase())
  );

  if (!isMentioning) return null;

  return (
    <FlatList
      data={suggestions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            insertMention({
              id: item.id,
              name: item.name,
              trigger: "@",
            })
          }
        >
          <Text>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function ChatScreen() {
  return (
    <View>
      <ChatInput />
      <SuggestionList />
    </View>
  );
}
```

---

## Advanced Usage

### Rendering Mentions in Display Text

Use `MentionText` to render text with styled, interactive mentions:

```tsx
import { MentionText } from "react-native-docked-mentions";

function Post({ text, mentions }) {
  return (
    <MentionText
      mentions={mentions}
      style={{ fontSize: 16, color: "#000" }}
      mentionStyle={{ color: "#007AFF", fontWeight: "bold" }}
      onPressMention={(mention) => {
        console.log("Tapped:", mention.name);
        // Navigate to user profile, etc.
      }}
    >
      {text}
    </MentionText>
  );
}
```

### Custom Mention Styling (Function)

```tsx
<MentionText
  mentions={mentions}
  mentionStyle={(mention) => ({
    color: mention.trigger === "@" ? "#007AFF" : "#FF6B6B",
    fontWeight: "bold",
    textDecorationLine: "underline",
  })}
>
  {text}
</MentionText>
```

### Custom Mention Rendering

```tsx
<MentionText
  mentions={mentions}
  renderMention={(mention, content) => (
    <View style={{ backgroundColor: "#E3F2FD", borderRadius: 4, padding: 2 }}>
      <Text style={{ color: "#1976D2", fontWeight: "600" }}>{content}</Text>
    </View>
  )}
>
  {text}
</MentionText>
```

### Multi-Word Mentions

```tsx
<MentionProvider
  triggers={[
    { trigger: "@", allowedSpacesCount: 2 }, // "John Smith Jr"
    { trigger: "#", allowedSpacesCount: 0 }, // "react-native"
  ]}
>
  {children}
</MentionProvider>
```

### Auto-Parsing (Without Explicit Ranges)

```tsx
// If you don't have explicit mention ranges, MentionText can auto-parse
<MentionText
  triggers={[{ trigger: "@" }, { trigger: "#" }]}
  style={{ fontSize: 16 }}
>
  Hey @John, check out #react-native!
</MentionText>
```

### Hide Trigger Character

```tsx
// Hide the @ symbol, show only the name
<MentionText
  mentions={mentions}
  triggers={[
    { trigger: "@", hideTrigger: true }, // Shows "John" instead of "@John"
    { trigger: "#" }, // Shows "#javascript" (default)
  ]}
  style={{ fontSize: 16 }}
>
  {text}
</MentionText>
```

---

## API Reference

### `<MentionProvider>`

Provides mention context to your app.

| Prop       | Type               | Required | Description                     |
| ---------- | ------------------ | -------- | ------------------------------- |
| `triggers` | `MentionTrigger[]` | ✅       | Array of trigger configurations |
| `children` | `ReactNode`        | ✅       | Your app components             |

**MentionTrigger:**

```typescript
interface MentionTrigger {
  trigger: string; // e.g., '@', '#', '/'
  allowedSpacesCount?: number; // Default: 0 (single word)
  hideTrigger?: boolean; // Hide trigger char in MentionText (default: false)
}
```

---

### `useMentionInput(props)`

Hook for integrating with your TextInput.

**Props:**

```typescript
interface MentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  inputRef?: React.RefObject<TextInput>;
}
```

**Returns:**

```typescript
{
  textInputProps: {
    value: string;
    onChangeText: (text: string) => void;
    onSelectionChange: (e) => void;
  };
  inputRef: React.RefObject<TextInput>;
  selection: { start: number; end: number };
}
```

**Usage:**

```tsx
const { textInputProps, inputRef } = useMentionInput({
  value: text,
  onChangeText: setText,
});

<TextInput ref={inputRef} {...textInputProps} />;
```

---

### `useMentionState()`

Hook for accessing mention state (for suggestion lists).

**Returns:**

```typescript
{
  activeTrigger: string | null;     // Current trigger ('@', '#', etc.)
  currentQuery: string;              // Text after trigger ('joh' in '@joh')
  isMentioning: boolean;             // Is user currently mentioning?
  insertMention: (suggestion: MentionSuggestion) => void;
}
```

**MentionSuggestion:**

```typescript
interface MentionSuggestion {
  id: string;
  name: string;
  trigger: string;
  subtitle?: string; // Optional subtitle for list
  avatar?: string; // Optional avatar URL
  data?: any; // Any extra data
}
```

---

### `<MentionText>`

Component for rendering text with styled mentions.

| Prop             | Type                                                   | Required | Description                                |
| ---------------- | ------------------------------------------------------ | -------- | ------------------------------------------ |
| `children`       | `string`                                               | ✅       | The text to render                         |
| `mentions`       | `MentionRange[]`                                       | ⚠️       | Explicit mention ranges (recommended)      |
| `triggers`       | `MentionTrigger[]`                                     | ⚠️       | For auto-parsing (if no mentions provided) |
| `style`          | `StyleProp<TextStyle>`                                 | ❌       | Style for all text                         |
| `mentionStyle`   | `StyleProp<TextStyle>` \| `(mention) => StyleProp`     | ❌       | Style for mentions                         |
| `onPressMention` | `(mention: MentionData) => void`                       | ❌       | Called when mention is tapped              |
| `renderMention`  | `(mention: MentionData, content: string) => ReactNode` | ❌       | Custom mention renderer                    |

**MentionRange:**

```typescript
interface MentionRange {
  start: number; // Start index in text
  end: number; // End index in text
  data: {
    id: string;
    name: string;
    trigger: string;
    [key: string]: any;
  };
}
```

---

### Utility Functions

#### `parseMentions(text, triggers)`

Auto-parse mentions from text.

```typescript
import { parseMentions } from "react-native-docked-mentions";

const mentions = parseMentions("Hey @John, check #react-native!", [
  { trigger: "@" },
  { trigger: "#" },
]);
// Returns: [{ start: 4, end: 9, data: { ... } }, ...]
```

#### `findMentionAtCursor(cursor, mentions)`

Find mention at cursor position.

```typescript
import { findMentionAtCursor } from "react-native-docked-mentions";

const mention = findMentionAtCursor(5, mentions);
```

---

## Real-World Example

### Chat App with Mentions

```tsx
import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import {
  MentionProvider,
  useMentionInput,
  useMentionState,
  MentionText,
} from "react-native-docked-mentions";

const USERS = [
  { id: "1", name: "John Smith", avatar: "https://..." },
  { id: "2", name: "Jane Doe", avatar: "https://..." },
  // ... more users
];

function ChatInput() {
  const [text, setText] = useState("");
  const { textInputProps, inputRef } = useMentionInput({
    value: text,
    onChangeText: setText,
  });

  return (
    <View style={styles.inputContainer}>
      <TextInput
        ref={inputRef}
        {...textInputProps}
        placeholder="Type @ to mention..."
        style={styles.input}
        multiline
      />
    </View>
  );
}

function MentionSuggestions() {
  const { isMentioning, currentQuery, activeTrigger, insertMention } =
    useMentionState();

  const suggestions = useMemo(() => {
    if (!isMentioning || activeTrigger !== "@") return [];
    return USERS.filter((user) =>
      user.name.toLowerCase().includes(currentQuery.toLowerCase())
    );
  }, [isMentioning, currentQuery, activeTrigger]);

  if (!isMentioning || suggestions.length === 0) return null;

  return (
    <View style={styles.suggestionsContainer}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() =>
              insertMention({
                id: item.id,
                name: item.name,
                trigger: "@",
                avatar: item.avatar,
              })
            }
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.suggestionName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Message({ text, mentions }) {
  return (
    <View style={styles.message}>
      <MentionText
        mentions={mentions}
        style={styles.messageText}
        mentionStyle={styles.mention}
        onPressMention={(mention) => {
          // Navigate to user profile
          console.log("View profile:", mention.id);
        }}
      >
        {text}
      </MentionText>
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);

  return (
    <MentionProvider triggers={[{ trigger: "@" }]}>
      <View style={styles.container}>
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <Message text={item.text} mentions={item.mentions} />
          )}
        />
        <MentionSuggestions />
        <ChatInput />
      </View>
    </MentionProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inputContainer: { padding: 16, borderTopWidth: 1, borderColor: "#E0E0E0" },
  input: { fontSize: 16, minHeight: 40 },
  suggestionsContainer: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  suggestionName: { fontSize: 16, color: "#000" },
  message: { padding: 16 },
  messageText: { fontSize: 16, color: "#000" },
  mention: { color: "#007AFF", fontWeight: "bold" },
});
```

---

## TypeScript Support

Fully typed with TypeScript! All types are exported:

```typescript
import type {
  MentionTrigger,
  MentionData,
  MentionRange,
  MentionSuggestion,
  MentionInputProps,
  MentionTextProps,
} from "react-native-docked-mentions";
```

---

## Performance

- **Optimized rendering** with `React.memo` and `useMemo`
- **Smart trigger detection** with limited lookback (50 chars)
- **No unnecessary re-renders**
- **Lightweight**: Only 500 lines of source code
- **Zero dependencies**: No bloat from transitive dependencies

---

## Testing

We take testing seriously:

- ✅ **99%+ code coverage**
- ✅ **9 comprehensive tests**
- ✅ **All edge cases covered**
- ✅ **Integration tests included**

Run tests:

```bash
npm test
```

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT © [João Paulo C. Marra](https://github.com/JoaoPauloCMarra)

---

## Support

- 🐛 [Report a bug](https://github.com/JoaoPauloCMarra/react-native-docked-mentions/issues)
- 💡 [Request a feature](https://github.com/JoaoPauloCMarra/react-native-docked-mentions/issues)
- 📖 [Read the docs](https://github.com/JoaoPauloCMarra/react-native-docked-mentions#readme)

---

## Why "Docked"?

The name reflects our philosophy: mentions are "docked" to your UI framework, not the other way around. You're in control of the ship! ⚓

---

**Made with ❤️ for the React Native community**
