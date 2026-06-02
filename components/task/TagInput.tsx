import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [inputText, setInputText] = useState("");
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const inputBackground = Glass.inputBackground[colorScheme];

  const filteredSuggestions = useMemo(() => {
    if (!inputText.trim()) return [];
    const q = inputText.trim().toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && !tags.includes(s))
      .slice(0, 5);
  }, [inputText, suggestions, tags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInputText("");
      return;
    }
    onChange([...tags, trimmed]);
    setInputText("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    addTag(inputText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {tags.map((tag, i) => (
          <View
            key={`${tag}-${i}`}
            style={[styles.chip, { backgroundColor: colors.tint + "18", borderColor: colors.tint + "40" }]}
          >
            <Text style={[styles.chipText, { color: colors.tint }]}>{tag}</Text>
            <TouchableOpacity
              onPress={() => removeTag(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`删除标签 ${tag}`}
            >
              <MaterialIcons name="close" size={12} color={colors.tint} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="添加标签..."
          placeholderTextColor={colors.icon}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          accessibilityLabel="标签输入"
          style={[
            styles.input,
            {
              backgroundColor: inputBackground,
              borderColor: colors.icon,
              color: colors.text,
            },
          ]}
        />
      </View>

      {filteredSuggestions.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: inputBackground, borderColor: Glass.border[colorScheme] }]}>
          {filteredSuggestions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => addTag(s)}
              style={styles.suggestionItem}
              accessibilityLabel={`选择标签 ${s}`}
            >
              <MaterialIcons name="local-offer" size={12} color={colors.icon} />
              <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
  },
  input: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    minHeight: 32,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  suggestions: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
