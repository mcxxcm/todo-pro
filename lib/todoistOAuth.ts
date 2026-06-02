import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { TODOIST_OAUTH } from "@/constants/todoistOAuth";
import { getTodoistOAuthToken, setTodoistOAuthToken, removeTodoistOAuthToken } from "@/lib/todoistStorage";

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateCodeVerifier(): Promise<string> {
  const randomBytes = new Uint8Array(32);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    Crypto.getRandomValues(randomBytes);
  }
  return arrayBufferToBase64Url(randomBytes.buffer);
}

async function computeCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return arrayBufferToBase64Url(hash);
}

export async function startTodoistOAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_id: TODOIST_OAUTH.clientId,
      scope: TODOIST_OAUTH.scopes.join(","),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: TODOIST_OAUTH.redirectUri,
      response_type: "code",
    });

    const authUrl = `${TODOIST_OAUTH.authorizationEndpoint}?${params.toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, TODOIST_OAUTH.redirectUri);

    if (result.type !== "success") {
      return { success: false, error: "用户取消了授权" };
    }

    const redirectUrl = result.url;
    const parsed = Linking.parse(redirectUrl);
    const code = parsed.queryParams?.code as string | undefined;

    if (!code) {
      return { success: false, error: "未收到授权码" };
    }

    const tokenResponse = await fetch(TODOIST_OAUTH.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: TODOIST_OAUTH.clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: TODOIST_OAUTH.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text().catch(() => "");
      return { success: false, error: `Token 交换失败 (${tokenResponse.status}): ${errorBody.slice(0, 200)}` };
    }

    const tokenData = await tokenResponse.json() as { access_token: string; token_type: string };

    if (!tokenData.access_token) {
      return { success: false, error: "Token 响应缺少 access_token" };
    }

    await setTodoistOAuthToken(tokenData.access_token);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "OAuth 流程异常" };
  }
}

export async function revokeTodoistOAuth(): Promise<boolean> {
  try {
    const token = await getTodoistOAuthToken();
    if (!token) return true;

    await fetch(TODOIST_OAUTH.revocationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    await removeTodoistOAuthToken();
    return true;
  } catch {
    await removeTodoistOAuthToken();
    return false;
  }
}

export async function getTodoistAccessToken(): Promise<string | null> {
  return getTodoistOAuthToken();
}
