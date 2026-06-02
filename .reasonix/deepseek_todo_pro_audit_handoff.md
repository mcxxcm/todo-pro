# DeepSeek Handoff: Todo Pro Next Atomic Work

你在 `/Users/mcx/todo-pro` 中继续 Todo Pro 的下一批原子任务。不要重构无关文件，不要覆盖用户未要求的改动。

## 当前验证结果

2026-06-02 收口复核结果：

- `npm run test:all`: 通过（含 test:notification-message 12 checks）
- `npm run test:ui`: 通过，7 suites / 31 tests
- `npx tsc --noEmit`: 通过
- `npx eslint . --no-cache`: 通过，0 errors / 0 warnings
- backend test/typecheck/build: 通过
- `git status --short`: clean（4 commits ahead origin/main）
- 安全扫描：`.env` 与 `backend/.env` 已被 ignore；README Security Boundaries 已说明三类凭证边界

## 已完成验收项（本轮 Codex 会话）

不要重复返工：

1. **P1-4 通知系统用户反馈** — `syncTaskNotification` 返回结构化 `TaskNotificationSyncResult`，provider → hook → UI 全链路。`app/(tabs)/index.tsx` 展示 3 秒通知反馈 banner。`domain/notificationMessage.test.ts` 12 分支覆盖。
2. **P4-3 README 密钥边界说明** — `README.md` 和 `README_zh.md` 增加 Security Boundaries 章节，区分客户端公开配置、后端密钥、本地设备密钥。
3. **P3-2 无障碍回归** — 为 index.tsx（5 按钮）、TaskDetailModal（status/subtask toggle + 全部接受）、FocusTimerModal（6 按钮）、TaskItem（编辑/删除）、ReviewCard（3 按钮）补齐 accessibilityRole/State/Hint。
4. **P4-1 README 一致性审计** — 8 项 Completion Map 声明逐条验证，Firebase 冲突检测措辞精确化。
5. **P4-2 OCR Claw 稳定化** — 零字节文件检查、退出码 0/1/2、OCR 空结果友好提示。
6. **P2-3 Firebase 批量冲突检测** — `mergeDuplicates` 和 `confirmAllTimeReviews` 增加批量前逐文档 `getDoc` 冲突检查。
7. **P3-3 i18n 键扩展** — 补齐 taskDetail (+25)、settings (+8)、stats (+7) 键，zh/en locale 完整。`I18nContext` + `useI18n` 就绪。
8. **P2-2 Calendar/Reminders** — 代码审计确认已真实写入 `expo-calendar`，权限/失败/SyncRecord 完整。
9. **P2-4 SQLite 预研** — `docs/sqlite-migration.md` + `scripts/benchmark-storage.ts` 已完成。
10. **P0-1~P0-3** — ESLint 0/0、git clean、4 commits 已提交。

## 下一批必修项

按优先级排序：

### A. 推送前确认

运行以下命令确认当前 4 commits 可安全推送：

```bash
git status
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
npm --prefix backend run test:all
npx tsc --noEmit --project backend/tsconfig.json
npm --prefix backend run build
```

检查点：
- 所有命令通过
- `git log --oneline -5` 确认 4 个 commit message 清晰
- 决定是否 `git push origin main`

### B. Todoist OAuth 真实端到端验证或文案降级

现状：
- Personal API Token 路径可用，`providers/sync/todoistSyncProvider.ts` 真实 REST API 写入
- `docs/todoist-oauth-design.md` 存在 OAuth 设计骨架
- `lib/todoistOAuth.ts` / `constants/todoistOAuth.ts` 存在 token 存储函数
- OAuth 授权流程未接入 UI、未端到端验证

建议：
- 选项 1：实施 Expo AuthSession OAuth 流程，端到端验证（推荐长期）
- 选项 2：将 README/UI 中 OAuth planned 文案降级为"Personal API Token only, OAuth not implemented"

### C. SQLite 迁移从设计文档进入最小实现 spike

现状：
- `docs/sqlite-migration.md` 有完整 schema 和迁移策略
- `scripts/benchmark-storage.ts` 覆盖 100/500/1000 任务 benchmark
- 设置页 `LocalDataPanel.tsx` 在 >500 任务时显示性能警告

建议：
- 创建 `lib/sqliteStorage.ts`，使用 `expo-sqlite` 实现最小读写
- 先迁移 `taskStorage` 的读路径（`loadTasks`），其余保持 AsyncStorage
- 用 benchmark 脚本对比 AsyncStorage vs SQLite 实际耗时

### D. i18n 页面迁移（优先级：Settings -> TaskDetail -> Inbox）

现状：
- `lib/i18n/` 基础设施完整：Types、zh/en locales（90+ 键）、`I18nContext` + `useI18n` hook
- `docs/i18n-strategy.md` 有迁移策略文档
- 所有 UI 仍直接硬编码中文，`useI18n()` 从未被调用

建议：
- 先在 TaskDetailModal 接入 `useI18n()` 作为首个迁移目标（验证模式）
- 再迁移 Settings 面板（StatsPanel / LocalDataPanel / SyncTargetsPanel）
- 最后迁移 Inbox 主页面

## 可选后续

- **P3-2 无障碍真机验证** — VoiceOver/TalkBack 验证新建任务、确认 AI 草稿、完成任务、记录实际耗时流程
- **P1-4 通知真机验证** — Android/iOS 真机验证创建带 dueAt 任务后的通知反馈

## 完成后必须运行

```bash
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
npm --prefix backend run test:all
npx tsc --noEmit --project backend/tsconfig.json
npm --prefix backend run build
```

## 最终回复格式

```text
改动文件：
- ...

完成原子项：
- [Px-y] ...

验证：
- npm run test:all: pass/fail
- npm run test:ui: pass/fail
- npx tsc --noEmit: pass/fail
- npx eslint . --no-cache: pass/fail
- backend test/typecheck/build: pass/fail

剩余风险：
- ...
```
