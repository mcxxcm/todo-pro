# DeepSeek Handoff: Todo Pro Audit Completion

你在 `/Users/mcx/todo-pro` 中继续修复 Todo Pro 审批剩余问题。不要重构无关文件，不要覆盖用户未要求的改动。

## 当前验证结果

- `npm run test:all`: 通过
- `npx tsc --noEmit`: 通过
- `npx eslint . --no-cache`: 0 errors，45 warnings
- `cd backend && npm run test:all && npx tsc --noEmit && npm run build`: 通过
- `npx jest --runInBand`: 失败

Jest 失败要点：

- `jest.config.js` 使用了错误字段 `setupFilesAfterSetup`，应为 `setupFilesAfterEnv`。
- Jest 运行时出现 `this._moduleMocker.clearMocksOnScope is not a function`。
- Jest 扫描到了 `backend/dist` 和非 React Native Testing Library 的脚本测试。

## 必须修复

### 1. 修复 React Native Testing Library / Jest 基础设施

目标：新增的 UI 组件测试必须能被独立命令稳定运行，不能只通过 `tsconfig` 排除来假装通过。

建议文件：

- `jest.config.js`
- `package.json`
- `components/__tests__/TaskItem.test.tsx`
- `components/__tests__/ReviewCard.test.tsx`
- `components/__tests__/TaskComposer.test.tsx`

要求：

- 把 `setupFilesAfterSetup` 改为 `setupFilesAfterEnv`。
- 增加明确脚本，例如：

```json
{
  "scripts": {
    "test:ui": "jest components/__tests__ --runInBand"
  }
}
```

- 配置 `testPathIgnorePatterns` 或 `testMatch`，避免扫到：
  - `backend/dist`
  - `backend/src`
  - `domain/*.test.ts`
  - `lib/*.test.ts`
  - `extractors/*.test.ts`
- 若 `jest@30` 与 `jest-expo` 不兼容，调整到 Expo/Jest preset 可工作的版本组合。
- 运行并通过 `npm run test:ui`。

### 2. 补强 A4 AI 任务拆解

当前状态：`TaskDetailModal` 接受 AI 拆解时已经调用 `onUpdate(task.id, { subtasks })`，但用户不能编辑拆解结果后再接受。

建议文件：

- `components/task/TaskDetailModal.tsx`

要求：

- 每条 `decompositionResult` 提供可编辑标题输入。
- 每条 `decompositionResult` 提供可编辑预计分钟输入。
- 支持接受单条、拒绝单条、全部接受。
- 接受后立即持久化到 `task.subtasks`，并在当前详情 UI 中看到新增子任务。

### 3. 补强 B3 actualMinutes

当前状态：详情页有 `actualMinutes` 字段编辑，但完成任务时没有明显记录实际耗时入口。

建议文件：

- `components/task/TaskDetailModal.tsx`
- `components/TaskItem.tsx` 或完成流程相关组件
- `components/settings/StatsPanel.tsx`

要求：

- 在任务完成后提供明显的“记录实际耗时”动作，或完成任务时弹出/进入记录入口。
- `actualMinutes` 写入 `TaskUpdateInput`。
- `StatsPanel` 展示预估 vs 实际偏差时能消费该字段。

### 4. 补强 B6 FocusSession

当前状态：`FocusTimerModal` 可以写入 `focusSessions`，但没有后台/锁屏通知，也没有统计展示。

建议文件：

- `components/task/FocusTimerModal.tsx`
- `components/settings/StatsPanel.tsx`
- `README.md`

要求：

- 在统计面板展示专注次数、总专注分钟数。
- 如暂不做后台/锁屏通知，在 UI 或 README 明确标注后台/锁屏通知为 planned。
- 保证 `focusSessions` 追加写入不会覆盖已有 session。

### 5. 补强 E1 时间解析一致性测试

当前状态：`domain/timeConsistency.test.ts` 只测了 frontend parser，没有真正比较 backend parser。

建议文件：

- `domain/timeConsistency.test.ts`
- `lib/clientTimeParser.ts`
- `backend/src/time/parseChineseTime.ts`

要求：

- 同一组样例同时调用：
  - `parseClientDateInfo`
  - `parseChineseDateInfo`
- 对常见表达比较解析能力和日期粒度是否一致。
- 样例至少包含：
  - `明天下午3点`
  - `今晚八点前`
  - `下周五`
  - `下个月3号`
  - `月底前`
  - `半小时后`

### 6. 修复 G2 关于卡片

当前状态：设置页“隐私政策”按钮没有 `onPress`；反馈邮件用 `router.push("mailto:...")` 不合适。

建议文件：

- `app/(tabs)/explore.tsx`

要求：

- 使用 `Linking.openURL("mailto:feedback@todopro.app")` 打开反馈邮件。
- 给“隐私政策”按钮加真实链接或本地文档入口。
- 版本号/构建号优先从 `package.json`、`app.json` 或 `expo-constants` 读取，不要硬编码漂移。

### 7. 清理明显 lint warning 和小瑕疵

按 `npx eslint . --no-cache` 输出清理：

- `app/(tabs)/index.tsx`: 未使用 `ocrError` / `clearOcrError`
- `components/task/TaskDetailModal.tsx`: 未使用 `display*` / `editingDoneCount`
- `components/settings/AchievementGallery.tsx`: hook dependency warning
- `components/settings/WeeklyReportPanel.tsx`: hook dependency warning
- `components/task/FocusTimerModal.tsx`: hook dependency warning
- `components/__tests__/*`: `import/first`
- `providers/firebaseProvider.ts`: 未使用 `getDocs` / `where`
- 其他 unused import 按 eslint 输出清理

## 完成后必须运行

```bash
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
cd backend && npm run test:all && npx tsc --noEmit && npm run build
```

## 最终回复格式

请输出：

- 改动文件列表
- 每个修复项的验收状态
- 所有验证命令结果
- 仍未完成或明确 planned 的项目
