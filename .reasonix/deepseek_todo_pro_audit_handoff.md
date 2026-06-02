# DeepSeek Handoff: Todo Pro Next Atomic Work

你在 `/Users/mcx/todo-pro` 中继续 Todo Pro 的下一批原子任务。不要重构无关文件，不要覆盖用户未要求的改动。

## 当前验证结果

2026-06-02 本轮 Codex 复核结果：

- `npm run test:all`: 通过
- `npm run test:ui`: 通过，7 suites / 31 tests
- `npx tsc --noEmit`: 通过
- `npx eslint . --no-cache`: 通过，0 errors / 0 warnings
- `cd backend && npm run test:all && npx tsc --noEmit && npm run build`: 通过
- `git status --short`: 本轮文档更新前为空；当前应只看到 `.reasonix/todo_pro_current_atomic_checklist.md` 与本 handoff 文档变更
- 安全扫描：`.env` 与 `backend/.env` 已被 ignore；未发现 DeepSeek/Todoist 真实 token 被 git 跟踪；Firebase `apiKey` 为公开客户端配置，发布前仍需 README 明确边界

## 已完成验收项

以下旧 handoff 问题已通过验证，不要重复返工：

1. React Native Testing Library / Jest 基础设施已可运行：`npm run test:ui` 通过。
2. AI 任务拆解编辑与接受流程已落地：`TaskDetailModal` UI 测试覆盖。
3. `actualMinutes` 记录和统计展示已落地：`TaskDetailModal` / `TaskItem` / `StatsPanel` 测试覆盖。
4. FocusSession 前台体验和统计已落地：`FocusTimerModal` / `StatsPanel` 测试覆盖；后台/锁屏通知仍 planned。
5. 前后端中文时间解析一致性测试已落地：`domain/timeConsistency.test.ts` 通过。
6. 关于卡片基础问题已修复，Lint 为 0 warnings。

## 必须修复

### 1. P1-4 通知系统用户反馈

现状：

- `providers/notificationProvider.ts` 会根据 `dueAt` 调度或取消本地通知。
- `providers/localProvider.ts`、`providers/firebaseProvider.ts` 已在创建、更新、完成、删除任务时调用通知同步。
- UI 还不能可靠告诉用户“提醒已安排 / 已更新 / 已取消 / 权限拒绝 / Web 不支持 / 通知关闭”。

目标：

- 任务保存永远不能被通知权限或平台限制阻断。
- 通知同步要返回结构化结果，UI 根据结果展示短反馈。
- 不要把一次性的通知反馈状态持久化到 `Task`。

建议文件：

- `providers/notificationProvider.ts`
- `providers/localProvider.ts`
- `providers/firebaseProvider.ts`
- `hooks/useLocalTasks.ts`
- `hooks/useTasks.ts`
- `app/(tabs)/index.tsx`
- `components/task/TaskDetailModal.tsx`
- `components/__tests__/*`

实现要求：

1. 将 `syncTaskNotification` 改为返回结构化结果，例如：

```ts
type TaskNotificationSyncResult =
  | { status: "scheduled"; notificationId: string }
  | { status: "updated"; notificationId: string }
  | { status: "cancelled"; reason: "completed" | "deleted" | "missing_dueAt" | "past_due" | "disabled" }
  | { status: "permission_denied" }
  | { status: "unsupported"; reason: "web" | "simulator" }
  | { status: "none"; reason: "no_dueAt" | "not_todo" };
```

2. `createLocalTask` / Firebase `addTask` 将通知结果随返回值带给调用方，但保存到 storage / Firestore 的仍是纯 `NormalizedTask`。
3. 手动创建带未来 `dueAt` 的任务后，Inbox 显示“提醒已安排”或“通知权限未开启”的短反馈。
4. 任务详情修改 `dueAt` 后显示“提醒已更新”；清空 `dueAt`、完成、删除任务后显示“提醒已取消”。
5. Web、模拟器、通知关闭、权限拒绝都要有可理解提示，不抛错、不阻断任务保存。
6. 增加测试覆盖通知结果分支和至少一个 UI 反馈文案。

验收标准：

- `npm run test:all` 通过
- `npm run test:ui` 通过
- `npx tsc --noEmit` 通过
- `npx eslint . --no-cache` 通过，0 warnings
- Web 环境不会因通知 API 报错
- Android 或 iOS 至少一个平台手动验证：创建带截止时间任务后能看到反馈

### 2. P4-3 README 密钥边界说明

现状：

- 安全扫描会命中 `lib/firebase.ts` 和 `mac-tools/ocr-claw.ts` 中的 Firebase `apiKey`。
- 这些是客户端 Firebase public config，不等同于服务端密钥，但 README 需要明确说明，避免误报。

建议文件：

- `README.md`
- `README_zh.md`

要求：

- 明确 DeepSeek API key 只能放在 backend `.env`。
- 明确 Todoist token 仅存本地 AsyncStorage，不提交 repo。
- 明确 Firebase client config 可公开，但 Firestore/Auth 权限必须由 Firebase rules 和 Auth 保护。
- 保持 `.env` / `backend/.env` / `backend/dist` ignore 说明。

验收标准：

- `rg -n "DEEPSEEK_API_KEY|TODO_PRO_PASSWORD|Bearer|apiKey" . -g '!node_modules/**' -g '!backend/dist/**'` 的命中均可解释，无真实 secret。
- README 与 README_zh 文案一致。

## 可选后续

### P3-2 无障碍回归

- 建立 accessibility checklist。
- 为关键 icon button 补 `accessibilityHint`。
- UI 测试检查新建任务、确认 AI 草稿、完成任务、记录实际耗时的 label/role/state。

### P2-1 Todoist OAuth

- 当前 Personal API Token 路径可用，OAuth 仍 planned。
- 若实施，优先使用 Expo AuthSession，不要把 client secret 放进移动端。

## 完成后必须运行

```bash
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
cd backend && npm run test:all && npx tsc --noEmit && npm run build
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
