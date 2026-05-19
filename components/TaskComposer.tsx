import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskComposerProps {
  onAdd: (title: string) => void;
  onExtract?: (text: string) => void;
  extracting?: boolean;
}

export function TaskComposer({
  onAdd,
  onExtract,
  extracting,
}: TaskComposerProps) {
  const [inputText, setInputText] = useState("");
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const handleAdd = () => {
    onAdd(inputText);
    setInputText("");
  };

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={[
          styles.textInput,
          {
            color: colors.text,
            borderColor: colors.icon,
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
          },
        ]}
        placeholder="输入任务..."
        placeholderTextColor={colors.icon}
        value={inputText}
        onChangeText={setInputText}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
      />
      <View style={styles.buttonGroup}>
        {onExtract && (
          <TouchableOpacity
            style={[
              styles.extractButton,
              {
                borderColor: colors.tint,
                opacity: extracting || !inputText.trim() ? 0.5 : 1,
              },
            ]}
            onPress={() => onExtract(inputText)}
            disabled={extracting || !inputText.trim()}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.extractButtonText, { color: colors.tint }]}
            >
              {extracting ? "提取中..." : "提取任务"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleAdd}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>添加任务</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  extractButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  extractButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
