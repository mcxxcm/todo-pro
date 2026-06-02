export const TODOIST_OAUTH = {
  clientId: "todo-pro-app",
  authorizationEndpoint: "https://todoist.com/oauth/authorize",
  tokenEndpoint: "https://todoist.com/oauth/access_token",
  revocationEndpoint: "https://todoist.com/api/access_tokens/revoke",
  redirectUri: "todopro://oauth/todoist",
  scopes: ["data:read_write"],
} as const;
