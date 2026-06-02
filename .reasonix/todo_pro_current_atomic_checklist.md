# Todo Pro 当前项目原子清单与验收标准

> 更新时间：2026-06-02  
> 项目路径：`/Users/mcx/todo-pro`  
> 当前阶段：审计修复验证通过，进入提交前确认、通知反馈打磨、同步/无障碍/发布前安全收口阶段。

## 当前验证基线

这些命令应作为每个原子项完成后的最低回归验证：

```bash
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
cd backend && npm run test:all && npx tsc --noEmit && npm run build
```

当前已知状态（2026-06-02 本轮复核）：

- `npm run test:all`：通过
- `npm run test:ui`：通过，7 suites / 31 tests
- `npx tsc --noEmit`：通过
- `npx eslint . --no-cache`：通过，0 errors / 0 warnings
- backend test/typecheck/build：通过
- `git status --short`：本轮文档更新前为空
- 敏感信息扫描：`.env` 与 `backend/.env` 已被 ignore；未发现 DeepSeek/Todoist 真实 token 被 git 跟踪；Firebase `apiKey` 为公开客户端配置，仍需发布前复核规则说明

---

## P0 提交前收口

### P0-1. 清理 ESLint 剩余 warning

现状：`npx eslint . --no-cache` 已为 0 errors / 0 warnings。以下 warning 清理项已完成，本节保留为提交前回归检查。

原子任务：

- [x] 移除 `components/EmptyTaskState.tsx` 未使用的 `reduceMotion`
- [x] 移除 `components/TaskFilterRail.tsx` 未使用的 `Opacity`
- [x] 清理 `components/source/*` 未使用 import / 变量
- [x] 清理 `components/task/DatePickerModal.tsx` 未使用 import 和不必要 dependency
- [x] 清理 `components/ui/MotionListItem.tsx` 未使用 `ready`
- [x] 清理 `domain/productivityStats.ts` 未使用类型
- [x] 清理 `domain/timeConsistency.test.ts` 未使用类型
- [x] 清理 `domain/weeklyReport.ts` 未使用变量
- [x] 清理 `extractors/mockExtractor.ts` 未使用 import
- [x] 合并 `lib/firebase.ts` duplicate imports，并处理 unused catch 参数
- [x] 清理 `lib/migration.test.ts` 未使用变量
- [x] 调整 `components/__tests__/TaskItem.test.tsx` 中的 `require()` 和 unused React warning

验收标准：

- [x] `npx eslint . --no-cache` 输出 0 errors / 0 warnings
- [x] `npm run test:all` 通过
- [x] `npm run test:ui` 通过
- [x] `npx tsc --noEmit` 通过

### P0-2. 提交范围确认

现状：本轮复核开始时 `git status --short` 为空；当前只应出现本清单和 DeepSeek handoff 文档更新。

原子任务：

- [x] 运行 `git status --short`，确认改动均属于 Todo Pro 审计修复范围
- [x] 检查是否有不应提交的产物、临时文件、敏感信息
- [ ] 确认 `.reasonix/` 是否作为项目内交接材料提交
- [x] 确认 `backend/dist/` 未被纳入 git

验收标准：

- [x] `git status --short` 中无未知产物或密钥文件
- [x] `.env`、真实 token、截图临时文件未被 staged
- [x] commit 前完整验证命令全部通过

### P0-3. 创建审计修复提交

原子任务：

- [ ] `git add -A`
- [ ] `git commit -m "feat: complete Todo Pro audit checklist integrations"`
- [ ] 提交后记录 commit hash

验收标准：

- [ ] `git status --short` 为空，或只剩明确不提交的本地文件
- [ ] commit message 清楚表达审计修复范围
- [ ] commit hash 已记录在交付说明中

---

## P1 核心体验打磨

### P1-1. AI 拆解结果编辑体验补强

现状：`TaskDetailModal` 支持 AI 拆解、编辑拆解项、接受/拒绝并写入 `task.subtasks`。

原子任务：

- [x] 为拆解结果编辑输入增加明确保存/取消视觉状态
- [x] 接受全部后也显示“已保存到子任务”的反馈
- [x] 拆解结果为空时显示友好空状态
- [x] 拆解失败时提供重试按钮

验收标准：

- [x] 用户可以编辑拆解项标题和预计分钟后接受
- [x] 接受单条和全部接受都会持久化到 `task.subtasks`
- [x] 关闭再打开任务详情，子任务仍存在
- [x] `npm run test:ui` 包含至少 1 个 AI 拆解交互测试

### P1-2. 实际耗时记录流程完善

现状：已完成任务可在详情页快速记录 `actualMinutes`，统计面板消费 `totalActualMinutes`。

原子任务：

- [x] 完成任务后给出明显的“记录实际耗时”提示入口
- [x] 实际耗时输入校验：仅允许正整数，最大值合理限制（如 1440 分钟）
- [x] 保存成功后显示反馈，并刷新详情展示
- [x] 支持修改已记录实际耗时

验收标准：

- [x] 已完成任务可记录、修改实际耗时
- [x] 非法输入不会写入任务
- [x] `StatsPanel` 显示预估、实际、偏差
- [x] `TaskItem` 或 `TaskDetailModal` 有对应 UI 测试

### P1-3. 专注模式前台体验完善

现状：`FocusTimerModal` 可记录本地 `focusSessions`；后台/锁屏通知为 Phase 3 planned。

原子任务：

- [x] 支持暂停/继续番茄钟
- [x] 支持提前完成并记录实际专注分钟
- [x] 支持跳过休息但不丢失已完成 session
- [x] 详情页展示该任务的专注 session 历史

验收标准：

- [x] 完成一轮专注后追加写入 `task.focusSessions`
- [x] 多次专注不会覆盖历史 session
- [x] 统计面板展示专注次数和总分钟数
- [x] README 明确后台/锁屏通知仍为 planned

### P1-4. 通知系统用户反馈

现状：任务 `dueAt` 生命周期已接入通知调度，设置页有通知开关；但创建/修改/取消提醒时，任务界面还不能可靠展示“已安排/已更新/权限拒绝/已取消”的结果反馈。

原子任务：

- [ ] 将 `syncTaskNotification` 改为返回结构化结果：`scheduled` / `updated` / `cancelled` / `permission_denied` / `disabled` / `unsupported` / `past_due` / `none`
- [ ] `createLocalTask` / Firebase `addTask` 将通知结果随保存结果返回给调用方，但不把通知状态写入持久化 Task
- [ ] 创建带未来 `dueAt` 的任务后，在 Inbox 展示“提醒已安排”或“通知权限未开启”的短反馈
- [ ] 任务详情修改 `dueAt` 后展示“提醒已更新”；清空 `dueAt`、完成、删除任务后展示“提醒已取消”
- [ ] Web / 模拟器 / 通知关闭状态显示可理解提示，不能抛错或阻断任务保存
- [ ] 为通知 provider 增加纯逻辑测试，覆盖状态分支；UI 层至少覆盖手动创建带 `dueAt` 后的反馈文案

验收标准：

- [ ] 通知权限首次请求只在需要时发生
- [ ] 权限拒绝不会阻断任务创建
- [ ] Web 环境不报错
- [ ] Android/iOS 至少一个平台手动验证通过
- [ ] `npm run test:all`、`npm run test:ui`、`npx tsc --noEmit`、`npx eslint . --no-cache` 全部通过
- [ ] README 对 Web/模拟器/后台锁屏通知限制保持一致说明

---

## P2 数据与同步

### P2-1. Todoist OAuth 设计与实施

现状：Todoist 支持 Personal API Token；OAuth 标注为 Phase 3 planned。

原子任务：

- [ ] 编写 Todoist OAuth 技术方案
- [ ] 增加 OAuth 回调路由或 Expo AuthSession 流程
- [ ] 安全保存 access token
- [ ] 保留 Personal API Token 作为开发者模式或迁移路径

验收标准：

- [ ] 用户无需手动粘贴 token 即可授权 Todoist
- [ ] 授权失败有明确错误提示
- [ ] 同步任务真实写入 Todoist
- [ ] README 删除或更新 OAuth planned 说明

### P2-2. Calendar / Reminders 真实授权写入

现状：Calendar、Reminders 有 payload/format 层和部分 active UI 文案，但 README 仍强调真实外部写入需授权和冲突处理。

原子任务：

- [ ] 梳理 Calendar/Reminders 当前 provider 是否真实写入
- [ ] 若未真实写入，将 UI 状态统一标为 planned
- [ ] 若真实写入，补齐权限请求、失败提示、同步记录
- [ ] 增加平台差异说明

验收标准：

- [ ] UI 文案与实际能力一致
- [ ] 无授权时不会误导用户“已启用”
- [ ] 写入成功/失败都产生 SyncRecord
- [ ] 测试覆盖 preflight 与 payload

### P2-3. Firebase 同步冲突策略升级

现状：Firebase Sync 采用 last-write-wins，并在 README 标注。

原子任务：

- [ ] 增加 `updatedAt` 冲突检测
- [ ] 检测云端较新时阻止静默覆盖
- [ ] 提供 manual merge 或至少冲突提示
- [ ] 为冲突策略增加 domain 测试

验收标准：

- [ ] 多设备编辑同一任务不会无提示覆盖
- [ ] 冲突记录可追踪
- [ ] README 更新冲突策略说明
- [ ] 相关测试通过

### P2-4. AsyncStorage 到 SQLite 迁移预研

现状：README 和设置页提示任务超过 500 建议 SQLite。

原子任务：

- [ ] 编写 SQLite schema 草案
- [ ] 定义迁移触发条件
- [ ] 增加存储性能 benchmark 脚本
- [ ] 设计任务/草稿/来源/同步记录索引

验收标准：

- [ ] `docs/` 中有迁移设计文档
- [ ] benchmark 可生成 100/500/1000 任务读写耗时
- [ ] SQLite schema 覆盖现有 Task / Draft / Source / SyncRecord

---

## P3 质量与可访问性

### P3-1. UI 测试扩展

现状：`npm run test:ui` 覆盖 TaskItem、TaskComposer、ReviewCard，14 个测试。

原子任务：

- [x] 增加 TaskDetailModal 测试
- [x] 增加 FocusTimerModal 测试
- [x] 增加 StatsPanel 渲染测试
- [x] 增加 SyncTargetRow token 输入测试

验收标准：

- [x] `npm run test:ui` 至少覆盖 6 个组件
- [x] AI 拆解、实际耗时、专注记录都有交互测试
- [x] Jest 不扫描 backend/dist 或 domain/lib 脚本测试

### P3-2. 无障碍回归

现状：主要 Touchable/Pressable 已加 accessibilityLabel/Role/State，但仍需系统化验证。

原子任务：

- [ ] 建立 accessibility checklist
- [ ] 为所有关键按钮补齐 `accessibilityRole`
- [ ] 为 checkbox/switch 补齐 `accessibilityState`
- [ ] 为图标按钮补齐 `accessibilityHint`

验收标准：

- [ ] VoiceOver/TalkBack 可完成：新建任务、确认 AI 草稿、完成任务、记录实际耗时
- [ ] UI 测试检查关键 accessibility label
- [ ] 无纯图标按钮缺 label

### P3-3. i18n Phase 4 准备

现状：README 明确当前仅支持中文，i18n Phase 4。

原子任务：

- [ ] 抽样整理中文硬编码字符串清单
- [ ] 选择 i18n 方案
- [ ] 先迁移设置页和任务详情页字符串
- [ ] 保持默认中文

验收标准：

- [ ] 文档说明 i18n 迁移策略
- [ ] 至少一个页面支持 zh/en 切换
- [ ] 未迁移页面不受影响

---

## P4 发布与运维

### P4-1. README 与实际能力一致性审计

原子任务：

- [ ] 对 README Current Completion Map 做逐条核对
- [ ] 将 planned / active 文案与 UI 同步
- [ ] 添加 `npm run test:ui` 到 Verification
- [ ] 补充 mac-tools 环境变量说明

验收标准：

- [ ] README 不再出现与实际 UI 相冲突的同步能力描述
- [ ] 所有验证命令完整列出
- [ ] 新开发者能按 README 跑通本地 app/backend

### P4-2. macOS OCR Claw 稳定化

现状：`mac-tools/ocr-claw.ts` 和 README 存在，依赖后端、Firebase 凭证和环境变量。

原子任务：

- [ ] 增加 `.env.example` 中的 `TODO_PRO_EMAIL` / `TODO_PRO_PASSWORD` / `TODO_PRO_BACKEND_URL`
- [ ] 增加 dry-run 模式
- [ ] 增加失败日志和退出码
- [ ] 校验截图文件存在和 OCR 返回为空的情况

验收标准：

- [ ] `mac-tools/ocr-claw.sh --no-sync` 可本地跑通
- [ ] 后端不可达时错误清晰
- [ ] OCR 空结果不会创建空草稿
- [ ] Raycast/Hammerspoon 文档可执行

### P4-3. 发布前安全检查

原子任务：

- [x] 检查 Firebase config 是否只包含可公开客户端配置
- [x] 确认 DeepSeek API key 只在 backend `.env`
- [x] 检查 Todoist token 仅存本地 AsyncStorage
- [x] 检查本地导出文件不自动上传
- [ ] 在 README 增加“Firebase client config is public by design”的说明，避免安全扫描误报

验收标准：

- [x] repo 中无私钥、真实 token、用户数据
- [ ] README 明确密钥边界
- [x] `rg -n "DEEPSEEK_API_KEY|TODO_PRO_PASSWORD|Bearer|apiKey" .` 无敏感泄漏，Firebase public config 除外

---

## 推荐执行顺序

1. P0-1 清理 warning
2. P0-2 提交范围确认
3. P0-3 创建审计修复提交
4. P1-1 / P1-2 / P1-3 核心体验打磨
5. P2 同步能力真实化或文案降级
6. P3 测试和无障碍扩展
7. P4 发布与运维

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
