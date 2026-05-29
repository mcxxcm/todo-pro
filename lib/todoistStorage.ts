import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@todoist_api_token";

export async function getTodoistToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setTodoistToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeTodoistToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
