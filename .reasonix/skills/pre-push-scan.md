---
name: pre-push-scan
description: 推送前安全扫描：检查 git 历史和当前文件中的 API key、密码、邮箱、私钥等敏感信息
---

# Pre-Push Security Scan

在 `git push` 之前执行，确保不推送敏感信息。

## 扫描步骤

### 1. 当前文件扫描

搜索以下模式（排除 node_modules / dist / .git）：

```
# API keys
sk-[a-zA-Z0-9]{20,}
AIzaSy[a-zA-Z0-9_-]{30,}   # Firebase public key — 标注但非阻断

# 密码和 token
TODO_PRO_PASSWORD\s*=\s*\S+
DEEPSEEK_API_KEY\s*=\s*[a-zA-Z0-9]
Bearer\s+[a-zA-Z0-9_-]{20,}

# 私钥
BEGIN (RSA|OPENSSH|EC) PRIVATE KEY

# 个人信息
@qq\.com|@gmail\.com.*[0-9]{5,}
```

### 2. Git 历史扫描

```bash
git log --all -p --full-history | grep -E "sk-[a-zA-Z0-9]{30,}|TODO_PRO_PASSWORD.*\S{4,}|BEGIN.*PRIVATE KEY"
```

### 3. 文件跟踪检查

确认敏感文件已被 `.gitignore` 排除：

```bash
git ls-files | grep -E "\.env$|\.pem$|\.key$|\.p12$"
```

### 4. 阻断条件

以下情况 **禁止推送**，必须先处理：

| 发现 | 处理方式 |
|------|---------|
| 真实 API key 在 git 历史中 | `git filter-branch` 或 `bfg` 清除 |
| `.env` 被 git 跟踪 | `git rm --cached` + 确认 `.gitignore` |
| 私钥文件被跟踪 | 立即删除 + 轮换密钥 |

### 5. 非阻断项（标注即可）

- Firebase `AIzaSy...` key — 公开客户端标识符，安全规则控制访问
- 测试中的假 token (`test-token-123`, `your_key` 等占位符)

## 常见陷阱

- 项目根 `.env` 和 `backend/.env` 是不同文件，需分别检查
- `.gitignore` 中的 `.env` 规则匹配所有目录下的 `.env` 文件
- Firebase config 硬编码在 `lib/firebase.ts` 中是正常模式（公开 key）
