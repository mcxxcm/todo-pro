# Todoist OAuth 2.0 技术方案

## 概述

当前 Todo Pro 仅支持 Personal API Token 方式授权 Todoist。本方案增加 OAuth 2.0 Authorization Code + PKCE 流程，允许用户通过浏览器授权，无需手动粘贴 Token。

## OAuth 端点

| 端点 | URL |
|------|-----|
| Authorization | `https://todoist.com/oauth/authorize` |
| Token Exchange | `https://todoist.com/oauth/access_token` |
| Token Revocation | `https://todoist.com/api/access_tokens/revoke` |

## 授权流程

```
用户点击"连接 Todoist"
  → 生成 PKCE code_verifier (SHA-256 → code_challenge)
  → 打开 expo-web-browser 跳转 https://todoist.com/oauth/authorize?
      client_id={CLIENT_ID}&
      scope=data:read_write&
      code_challenge={challenge}&
      code_challenge_method=S256&
      redirect_uri=todopro://oauth/todoist
  → 用户在浏览器中授权
  → Todoist 重定向到 todopro://oauth/todoist?code={code}
  → expo-linking 拦截 deep link
  → POST https://todoist.com/oauth/access_token
      { client_id, client_secret, code, code_verifier }
  → 获取 { access_token, token_type }
  → 安全存储 access_token 到 AsyncStorage / SecureStore
  → 更新 UI 授权状态
```

## 技术选型

- **PKCE**: 使用 `expo-crypto` (SHA-256 digest) 生成 code_challenge，无需 client_secret 即可安全交换
- **浏览器**: `expo-web-browser.openAuthSessionAsync()` 自动处理回调关闭
- **Deep Link**: `expo-linking` 已配置 `todopro://` scheme，添加 `oauth/todoist` 路径
- **Token 存储**: AsyncStorage（当前一致方案），后续可升级为 `expo-secure-store`

## 与 Personal API Token 共存

- OAuth token 和 Personal API Token 分开存储（不同 key）
- OAuth 优先级高于 Personal API Token
- 设置页保留 Personal API Token 入口作为开发者/高级模式
- 如果两种 token 都存在，sync 时优先使用 OAuth token

## 安全考量

- PKCE code_verifier 仅内存保存，不持久化
- access_token 存储在 AsyncStorage 中（与现有 token 存储一致）
- Token revocation 在断开连接时调用
- Client ID 硬编码在 app 中（公开信息，非机密）
- 不使用 client_secret（PKCE 模式下不需要，且客户端不可安全保存）

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `lib/todoistOAuth.ts` | 新增 | OAuth 流程核心：PKCE 生成、授权、token 交换、revoke |
| `lib/todoistStorage.ts` | 修改 | 新增 OAuth token 存取方法，保持向后兼容 |
| `constants/todoistOAuth.ts` | 新增 | OAuth 配置常量（client_id, endpoints） |
| `providers/sync/todoistSyncProvider.ts` | 修改 | 优先使用 OAuth token |

## Todoist Developer App 注册

需在 https://developer.todoist.com/appconsole.html 注册 OAuth App：

- **App Name**: Todo Pro
- **OAuth Redirect URI**: `todopro://oauth/todoist`
- **Scopes**: `data:read_write`

注册后获取 `client_id`，填入 `constants/todoistOAuth.ts`。
