# Todo Pro 当前项目原子清单与验收标准

> 更新时间：2026-06-02 (final wrap-up)  
> 项目路径：`/Users/mcx/todo-pro`  
> 当前阶段：收口完成。P0–P4 除 P2-1 (Todoist OAuth Phase 3) 外全部验收通过。

## 当前验证基线

这些命令应作为每个原子项完成后的最低回归验证：

```bash
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
cd backend && npm run test:all && npx tsc --noEmit && npm run build
```

当前已知状态（2026-06-02 收口复核）：

- `npm run test:all`：通过（含 test:notification-message 12 checks）
- `npm run test:ui`：通过，7 suites / 31 tests
- `npx tsc --noEmit`：通过
- `npx eslint . --no-cache`：通过，0 errors / 0 warnings
- backend test/typecheck/build：通过
- `git status --short`：clean（4 commits ahead origin/main）
- 敏感信息扫描：`.env` 与 `backend/.env` 已被 ignore；README Security Boundaries 已说明三类凭证边界

---

## P0 提交前收口 ✅ 全部完成

### P0-1. 清理 ESLint 剩余 warning ✅

- [x] 全部 12 项 ESLint warning 已清理
- [x] `npx eslint . --no-cache` 输出 0 errors / 0 warnings
- [x] `npm run test:all` 通过
- [x] `npm run test:ui` 通过
- [x] `npx tsc --noEmit` 通过

### P0-2. 提交范围确认 ✅

- [x] 运行 `git status --short`，确认改动均属于审计修复范围
- [x] 检查无产物、临时文件、敏感信息
- [x] 确认 `.reasonix/` 作为项目内交接材料提交（`.reasonix/truncated-results/` 已 gitignore）
- [x] 确认 `backend/dist/` 未被纳入 git

### P0-3. 创建审计修复提交 ✅

- [x] `git add -A` + commit
- [x] Commits:
  - `ed87604` feat: P1-4 notification feedback + P4-3 README security boundaries
  - `24bf112` fix: P3-2 accessibility regression + P4-1/P4-2 README and OCR Claw updates
  - `b7c2a6a` fix: fine-tune Firebase conflict docs + OCR Claw exit codes
  - `90f6c4b` feat: P2-3 batch conflict detection + P3-3 i18n key expansion
- [x] `git status --short` 为空

---

## P1 核心体验打磨 ✅ 全部完成

### P1-1. AI 拆解结果编辑体验补强 ✅

- [x] 拆解结果编辑增加保存/取消视觉状态
- [x] 接受全部后显示"已保存到子任务"
- [x] 拆解为空时显示友好空状态
- [x] 拆解失败时提供重试按钮
- [x] `npm run test:ui` 包含 AI 拆解交互测试

### P1-2. 实际耗时记录流程完善 ✅

- [x] 完成任务后显示"记录实际耗时"提示
- [x] 实际耗时校验：1-1440 分钟
- [x] 保存后显示反馈
- [x] 支持修改已记录实际耗时

### P1-3. 专注模式前台体验完善 ✅

- [x] 暂停/继续番茄钟
- [x] 提前完成并记录
- [x] 跳过休息不丢失 session
- [x] 详情页展示专注 history

### P1-4. 通知系统用户反馈 ✅ 已完成

证据文件：
- `providers/notificationProvider.ts` — `syncTaskNotification` 返回 `TaskNotificationSyncResult`
- `lib/notificationTypes.ts` — 类型定义 + `notificationMessage()` 纯函数
- `domain/notificationMessage.test.ts` — 12 分支覆盖（`test:all` 中包含）
- `providers/localProvider.ts` / `providers/firebaseProvider.ts` — provider 层传递通知结果
- `hooks/useLocalTasks.ts` / `hooks/useTasks.ts` — 暴露 `notificationFeedback` + `clearNotificationFeedback`
- `app/(tabs)/index.tsx` — Inbox 通知反馈 banner（3 秒自动消失）

- [x] `syncTaskNotification` 返回结构化结果
- [x] provider 层将通知结果随返回值带给调用方，不持久化
- [x] Inbox 展示通知反馈 banner
- [x] 所有平台/状态有可理解提示，不阻断任务保存
- [x] 纯逻辑测试 12 分支覆盖
- [x] 自动化验证全部通过
- [ ] Android/iOS 真机手动验证（待真机）

---

## P2 数据与同步

### P2-1. Todoist OAuth 设计与实施 ⬜ 待实施 (Phase 3)

现状：Todoist 支持 Personal API Token；OAuth 标注为 Phase 3 planned。

原子任务：

- [ ] 编写 Todoist OAuth 技术方案（已有 `docs/todoist-oauth-design.md` 骨架）
- [ ] 增加 OAuth 回调路由或 Expo AuthSession 流程
- [ ] 安全保存 access token
- [ ] 保留 Personal API Token 作为开发者模式或迁移路径

验收标准：

- [ ] 用户无需手动粘贴 token 即可授权 Todoist
- [ ] 授权失败有明确错误提示
- [ ] 同步任务真实写入 Todoist
- [ ] README 删除或更新 OAuth planned 说明

### P2-2. Calendar / Reminders 真实授权写入 ✅ 已完成

经代码审计确认，Calendar 和 Reminders 均已真实写入：

- `providers/sync/calendarSyncProvider.ts` — `expo-calendar` 真实事件创建 + 权限请求
- `providers/sync/remindersSyncProvider.ts` — `expo-calendar` 真实提醒创建 + 权限请求
- 写入成功/失败均产生 SyncRecord
- 测试覆盖 preflight 与 payload

- [x] 梳理 Calendar/Reminders 当前 provider 是否真实写入 — 确认已真实写入
- [x] 权限请求、失败提示、同步记录完整
- [x] Web 平台正确 skip

### P2-3. Firebase 同步冲突策略升级 ✅ 已完成

- [x] `updatedAt` 冲突检测（`domain/firebaseConflict.ts`，7 场景覆盖）
- [x] `updateDoc` 操作（toggleDone、updateTask）前检查冲突
- [x] `mergeDuplicates` 和 `confirmAllTimeReviews` 批量操作前逐文档冲突检测
- [x] `addTask` 新建不检查（无冲突可能）
- [x] 冲突时抛出 `FirebaseConflictError`
- [x] README 更新冲突策略说明

### P2-4. AsyncStorage 到 SQLite 迁移预研 ✅ 已完成

- [x] SQLite schema 草案（`docs/sqlite-migration.md`）
- [x] 迁移触发条件（`docs/sqlite-migration.md`）
- [x] 存储性能 benchmark 脚本（`scripts/benchmark-storage.ts`，100/500/1000 任务）
- [x] 索引设计（`docs/sqlite-migration.md`）
- [ ] 真 SQLite 迁移实施 — 待 Phase 3

---

## P3 质量与可访问性

### P3-1. UI 测试扩展 ✅ 已完成

- [x] TaskDetailModal / FocusTimerModal / StatsPanel / SyncTargetRow 测试
- [x] 7 suites / 31 tests

### P3-2. 无障碍回归 ✅ 已完成

- [x] 为所有关键按钮补齐 `accessibilityRole`
- [x] 为 checkbox/switch 补齐 `accessibilityState`
- [x] 为图标按钮补齐 `accessibilityHint`
- [x] 修复 index.tsx 5 个按钮缺失 label/role
- [x] ReviewCard / FocusTimerModal / TimeReviewActionCard 补 role
- [ ] VoiceOver/TalkBack 真机验证（待真机）

### P3-3. i18n Phase 4 准备 ⚠️ 基础设施完成，页面迁移待后续

- [x] 抽样整理中文硬编码字符串清单（~140-150 个独立字符串）
- [x] 选择 i18n 方案（`expo-localization` + React Context，`lib/i18n/`）
- [x] 补齐 taskDetail/settings/stats 缺失键（90+ 键）
- [x] `I18nContext` + `useI18n` hook 已就绪，默认中文
- [x] `docs/i18n-strategy.md` 迁移策略文档
- [ ] 组件接入 — TaskDetailModal 可作为首个迁移目标
- [ ] 全页面 zh/en 切换 — 待 Phase 4b

---

## P4 发布与运维

### P4-1. README 与实际能力一致性审计 ✅ 已完成

- [x] README Current Completion Map 逐条核对（8 项全部准确）
- [x] Firebase 冲突检测措辞精确化（区分 updateDoc / setDoc / batch）
- [x] Verification 段包含完整命令
- [x] 新开发者可按 README 跑通本地 app/backend

### P4-2. macOS OCR Claw 稳定化 ✅ 已完成

- [x] `.env.example` 已有 `TODO_PRO_EMAIL` / `TODO_PRO_PASSWORD` / `TODO_PRO_BACKEND_URL`
- [x] Dry-run 模式（`--no-sync`）
- [x] 退出码完善（0 成功 / 1 错误 / 2 无任务）
- [x] 零字节文件检查
- [x] OCR 空结果友好提示
- [x] `mac-tools/README.md` 退出码文档

### P4-3. 发布前安全检查 ✅ 已完成

- [x] Firebase config 为可公开客户端配置
- [x] DeepSeek API key 只在 backend `.env`
- [x] Todoist token 仅存本地 AsyncStorage
- [x] 本地导出文件不自动上传
- [x] README + README_zh 增加 Security Boundaries 章节

---

## 推荐执行顺序（剩余项）

1. ~~P0 提交前收口~~ ✅
2. ~~P1 核心体验打磨~~ ✅
3. P2-1 Todoist OAuth（Phase 3 planned）
4. ~~P2-2/P2-3/P2-4 同步与数据~~ ✅
5. ~~P3 测试和无障碍~~ ✅
6. P3-3 i18n 页面迁移（Phase 4b）
7. ~~P4 发布与运维~~ ✅

## 每次交付格式

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
