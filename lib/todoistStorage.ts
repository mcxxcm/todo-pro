import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@todoist_api_token";
const OAUTH_TOKEN_KEY = "@todoist_oauth_token";

export async function getTodoistToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setTodoistToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeTodoistToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getTodoistOAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(OAUTH_TOKEN_KEY);
}

export async function setTodoistOAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(OAUTH_TOKEN_KEY, token);
}

export async function removeTodoistOAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(OAUTH_TOKEN_KEY);
}

export async function getEffectiveTodoistToken(): Promise<string | null> {
  const oauthToken = await getTodoistOAuthToken();
  if (oauthToken) return oauthToken;
  return getTodoistToken();
}
