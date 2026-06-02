# Todo Pro

Todo Pro 是一个多来源 AI 任务收件箱。当前 MVP 支持本地添加任务、从文本/分享/OCR 中提取候选任务、按 `Source -> Draft -> Review -> Task` 保存来源链路，并在确认卡片中审核/编辑/拒绝后落成本地任务。

后端包含基础中文时间解析，当前覆盖常见相对日期、周几、月日、月份边界和相对时长表达，例如「明天下午3点」「今晚八点前」「下周五」「下个月3号」「月底前」「半小时后」。

## Tech Stack

- Expo + React Native + TypeScript
- Expo Router
- AsyncStorage local persistence
- Express backend provider layer
- Mock extractor by default, DeepSeek provider when explicitly enabled
- OCR provider route with a mock implementation by default
- Sync provider skeleton with local sync records and planned external providers

## Current Data Loop

```text
User text / share / OCR
  -> SourceItem stored locally
  -> TaskDraft stored locally with sourceId/sourceType
  -> Review card confirms, edits, or rejects draft
  -> accepted draft creates a local Task with source traceability
  -> optional sync layer creates auditable SyncRecord entries
```

User-provided URLs are classified as `link` sources when pasted or shared. The app only stores the provided URL/text; it does not crawl or read pages in the background.

The sync layer supports real external writes to Calendar, Apple Reminders, and Todoist:

- **Calendar** — real writes via `expo-calendar`. Requests `Calendar` permission on first sync; creates a "Todo Pro" calendar if none exists; writes events with title, date, and notes. Skipped on web and when permission is denied.
- **Apple Reminders** — real writes via `expo-calendar` (iOS only). Requests `Reminders` permission; creates a "Todo Pro" reminder list; writes reminders with title, due date, and notes.
- **Todoist** — real REST API writes when a Personal API Token is configured in Settings > Integrations. Falls back to a simulated sync when no token is present. OAuth 2.0 authorization is planned for Phase 3.

All sync operations produce auditable `SyncRecord` entries with status (`synced` / `failed` / `skipped`), visible in the Settings data panel.

## App

Install dependencies:

```bash
npm install
```

Run Expo:

```bash
npm run start
```

Run web locally:

```bash
npx expo start --web --port 8081
```

By default the app uses the local mock extractor. To call the backend extractor from the app:

```bash
cp .env.example .env
EXPO_PUBLIC_TASK_EXTRACTOR=backend EXPO_PUBLIC_BACKEND_URL=http://localhost:8787 npm run start
```

For Android emulator local backend/OCR testing, keep the backend running on the Mac and use the Android-only backend URL:

```bash
EXPO_PUBLIC_TASK_EXTRACTOR=backend EXPO_PUBLIC_ANDROID_BACKEND_URL=http://10.0.2.2:8787 npm run android
```

For a physical Android device, replace `10.0.2.2` with the Mac's LAN IP, for example `http://192.168.1.23:8787`. The Android dev build allows cleartext HTTP for this local backend path; production should point to HTTPS.

Text can be handed into the review flow with a URL parameter:

```text
http://localhost:8081/?text=明天下午3点联系老师
http://localhost:8081/share?text=明天下午3点联系老师
http://localhost:8081/share?title=课程通知&url=https://example.com/course.pdf&text=下周五提交报告
todopro://share?text=明天下午3点联系老师
```

## Backend

Install backend dependencies:

```bash
cd backend
npm install
```

Create an env file:

```bash
cp .env.example .env
```

Run with the mock provider:

```bash
TASK_EXTRACTOR=mock npm run dev
```

Run with DeepSeek:

```bash
TASK_EXTRACTOR=deepseek DEEPSEEK_API_KEY=your_key npm run dev
```

Run OCR with the local macOS OCR provider, then pass the recognized text to the configured task extractor:

```bash
OCR_PROVIDER=apple_vision TASK_EXTRACTOR=deepseek DEEPSEEK_API_KEY=your_key npm run dev
```

`apple_vision` uses the macOS Vision framework for ordinary OCR. DeepSeek is only used after OCR, when `/api/extract-tasks` receives recognized text.

Android OCR flow:

```text
Android screenshot/photo -> /api/ocr -> Apple Vision text -> /api/extract-tasks -> DeepSeek task drafts
```

The backend exposes:

- `GET /health`
- `POST /api/extract-tasks` with `{ "text": "..." }`
- `POST /api/ocr` with `{ "image": "<base64>" }`

The app supports real external sync to Calendar, Apple Reminders (iOS), and Todoist (with token). Each external write produces a SyncRecord audit entry. No external service is written to without explicit user authorization (permission grant or token entry).

## macOS OCR Claw

One-key screenshot → OCR → AI extract → Firebase sync. Located in `mac-tools/ocr-claw.ts`.

```bash
# Set required env vars (add to project root .env):
# TODO_PRO_EMAIL=your_firebase_email
# TODO_PRO_PASSWORD=your_firebase_password
# TODO_PRO_BACKEND_URL=http://localhost:8787

# Full-screen capture and sync
npx tsx mac-tools/ocr-claw.ts

# Region selection
npx tsx mac-tools/ocr-claw.ts -i

# OCR only, no Firebase sync
npx tsx mac-tools/ocr-claw.ts --no-sync

# Use existing image file
npx tsx mac-tools/ocr-claw.ts -p /path/to/screenshot.png

# Bash wrapper for Raycast/Hammerspoon
mac-tools/ocr-claw.sh
```

## Internationalization

当前默认中文（zh-CN）。i18n 基础设施已就绪（`lib/i18n/`），支持 zh/en 翻译键和 `I18nContext`。英文翻译已编写，组件迁移进行中。详见 `docs/i18n-strategy.md`。

## Time Parser Architecture

中文时间解析采用前后端双解析器架构：

| 解析器 | 位置 | 用途 |
|--------|------|------|
| `parseClientDateInfo` | `lib/clientTimeParser.ts` | 手动任务输入时在客户端解析 |
| `parseChineseDateInfo` | `backend/src/time/parseChineseTime.ts` | AI 提取结果在后端解析 |

**设计原则：**
- 两套解析器覆盖相同的常见中文时间表达（相对日期、周几、月日、月份边界、相对时长）。
- 客户端解析器侧重交互即时性，后端解析器侧重正则覆盖广度。
- 新增时间表达式时，必须在两套解析器中同时更新，并通过 `test:time-consistency` 验证不出现分叉。

**常见测试样例：** 明天下午3点、今晚八点前、下周五、下个月3号、月底前、半小时后。

## Verification

Run these checks before handing off changes:

```bash
npm run test:all
npm run test:ui
npx tsc --noEmit
npx eslint . --no-cache
npm --prefix backend run test:all
npm --prefix backend run build
```

## Product Guardrails

- AI/OCR output must stay as task drafts until the user confirms it.
- Source text is preserved for traceability.
- Fuzzy Chinese time expressions are shown for review instead of silently trusted.
- Backend regex parsing may provide a `dueAt` for common Chinese time expressions, but the app still marks extracted times for user review.
- Model API keys belong only in the backend environment, never in the mobile app.

## Current Completion Map

- Local task loop: active. Manual add/list/edit/complete/delete persists in AsyncStorage.
- Manual time parsing: active. Common Chinese times are parsed into `dueAt`, stripped from the manual task title, and marked for review.
- Source chain: active. Manual/text/share/link/PDF/email/OCR inputs create local source records.
- Draft review loop: active. AI/OCR output becomes local drafts before accepted tasks.
- Task organization: active. Tasks are grouped into overdue, today, planned, inbox, and completed using a shared domain grouping rule.
- Backend provider layer: active. Mock and DeepSeek providers share validation/normalization boundaries.
- OCR route: active with mock and macOS Apple Vision providers. Image understanding is not sent to DeepSeek; OCR produces text first, then DeepSeek extracts tasks from that text.
- Share URL route: active for `text`, `title`, and `url` params.
- Mock extraction hygiene: active. Source headers, standalone URLs, and non-actionable titles are filtered from task candidates.
- Sync audit layer: active. Local provider writes records; repeated sync is skipped instead of duplicated.
- Storage engine: currently AsyncStorage (key-value). SQLite migration is recommended when task count exceeds 500; AsyncStorage loads all tasks into memory on each read, while SQLite supports indexed queries and pagination for better performance at scale.
- Calendar: real event creation via `expo-calendar` with permission flow. Sync records are generated per write. Skipped on web or when permission denied.
- Apple Reminders: real reminder creation via `expo-calendar` (iOS only) with permission flow. Sync records are generated per write.
- Todoist: real REST API writes when Personal API Token is configured; mock otherwise. OAuth 2.0 授权集成计划在 Phase 3。
- Privacy controls: active. Settings can count, clear, and create an export snapshot for local data.
- Focus Mode / Pomodoro: active with local focus sessions, total statistics. Background and lock screen notifications are planned for Phase 3.


## Firebase Sync (Conflict Detection)

Firebase Firestore 实时同步采用 `updatedAt` 冲突检测策略：

- 每个任务作为一个 Firestore document 存储在 `users/{uid}/tasks/{taskId}`。
- 读操作通过 `onSnapshot` 实时监听变更，本地状态即时同步。
- 写入操作（`updateDoc` / `setDoc`）前会通过 `getDoc` 读取服务端当前 `updatedAt`，与本地预期值比较。
- 若服务端 `updatedAt` 严格晚于本地，抛出 `FirebaseConflictError`，阻止静默覆盖。
- 无冲突时执行正常写入，覆盖对应 document。

**使用建议：**
- 冲突时重新加载任务数据后重试编辑。
- 离线修改在网络恢复后自动同步到 Firestore，以设备最后写入时间为准。
- 冲突检测记录可追踪，详见 `domain/firebaseConflict.ts`。
