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

The sync layer currently supports a real local provider that writes sync audit records. Calendar has a tested ICS export format layer, Todoist has a tested REST payload format layer, and Apple Reminders has a tested reminder payload format layer. Actual external writes remain skipped until explicit authorization and conflict handling are implemented.

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

The current app keeps external sync in a safe planned state: local storage is active, while Apple Reminders, Calendar, and Todoist are shown as future authorization-backed targets. No external service is written to without a later explicit integration.

## Verification

Run these checks before handing off changes:

```bash
npm run test:all
npx tsc --noEmit
npx eslint . --no-cache
cd backend && npm run test:all && npx tsc --noEmit && npm run build
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
- Calendar/Reminders/Todoist: payload/format layers are tested, but real external writes are intentionally skipped until user authorization and conflict handling are implemented.
- Privacy controls: active. Settings can count, clear, and create an export snapshot for local data.
