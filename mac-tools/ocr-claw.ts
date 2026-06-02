import { execSync, execFileSync } from 'child_process';
import { readFileSync, unlinkSync, statSync, existsSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const USAGE = `
Usage: npx tsx mac-tools/ocr-claw.ts [options]

Options:
  -f, --full          Full-screen capture (no interaction, true one-key)
  -i, --interactive   Region selection (drag to select area)
  -w, --window        Window selection (click a window to capture)
  -p, --path <file>   Use existing image file instead of screenshot
  --no-sync           Dry-run: OCR only, print tasks locally (no Firebase)
  -h, --help          Show this help

Default: full-screen capture if no flags provided.

Exit codes:
  0 — Success (tasks extracted, synced or printed)
  1 — Error (missing env vars, backend unreachable, auth failed, empty image, etc.)
  2 — OCR returned no tasks (image may have no recognizable text)

Environment (set in project root .env):
  TODO_PRO_EMAIL          Firebase auth email (required for sync)
  TODO_PRO_PASSWORD       Firebase auth password (required for sync)
  TODO_PRO_BACKEND_URL    Backend URL (default: http://localhost:8787)
`.trim();

const firebaseConfig = {
  projectId: "todo-pro-3eab1",
  appId: "1:522771236124:web:eeeeeb45db7309cf9126d9",
  apiKey: "AIzaSyBeO0ZsHkFRs6Vs_yoXHyqNk4Gp98XhggA",
};

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function notify(title: string, body: string) {
  try {
    execFileSync('osascript', ['-e', `display notification "${body}" with title "${title}"`]);
  } catch { /* notification not critical */ }
}

function getBackendUrl(): string {
  return process.env.TODO_PRO_BACKEND_URL || 'http://localhost:8787';
}

function base64FromFile(filePath: string): string {
  const buffer = readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function ensureFirebaseAuth() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = process.env.TODO_PRO_EMAIL;
  const password = process.env.TODO_PRO_PASSWORD;

  if (!email || !password) {
    throw new Error("请在 .env 文件中配置 TODO_PRO_EMAIL 和 TODO_PRO_PASSWORD");
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return { db, uid: userCredential.user.uid };
}

async function captureScreenshot(mode: 'full' | 'interactive' | 'window'): Promise<string> {
  const tmpPath = '/tmp/todo-pro-screenshot.png';
  // Clean up previous temp file
  try { unlinkSync(tmpPath); } catch {}

  const flags: Record<string, string> = {
    full: '',
    interactive: '-i',
    window: '-i -w',
  };

  console.log(`📸 正在截图 (模式: ${mode})...`);
  try {
    execSync(`screencapture -x -T 0 ${flags[mode]} ${tmpPath}`);
  } catch (e: any) {
    if (e.message?.includes('could not create image')) {
      throw new Error(
        '截图权限不足。请到 系统设置 → 隐私与安全性 → 屏幕录制 → 开启 Shortcuts 和 Terminal 的权限'
      );
    }
    throw e;
  }

  if (!existsSync(tmpPath)) {
    throw new Error('截图未生成，可能被取消了');
  }

  const size = statSync(tmpPath).size;
  console.log(`   截图大小: ${formatBytes(size)}`);
  return tmpPath;
}

async function ocrAndExtract(imageBase64: string, backendUrl: string) {
  console.log('🧠 正在 OCR 识别 + AI 提取任务...');
  const startTime = Date.now();

  // If backend is localhost and not running, try to start it
  if (backendUrl.includes('localhost')) {
    try {
      await fetch(`${backendUrl}/api/v1/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    } catch {
      console.log('   ⚠️ 本地后端未启动，请先运行: cd backend && npm run dev');
      throw new Error('后端未启动');
    }
  }

  const response = await fetch(`${backendUrl}/api/v1/extract-tasks-from-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`后端返回错误 ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   耗时: ${elapsed}s`);
  return data;
}

async function syncToFirebase(
  db: ReturnType<typeof getFirestore>,
  uid: string,
  tasks: any[],
  ocrText: string | null,
) {
  console.log(`☁️ 正在同步 ${tasks.length} 个任务到 Firebase...`);
  const now = new Date().toISOString();

  for (const extracted of tasks) {
    const taskId = generateId();
    const taskDoc = {
      id: taskId,
      title: extracted.title,
      status: "todo",
      dueText: extracted.dueText || null,
      dueAt: extracted.dueAt || null,
      timeStatus: extracted.timeStatus || "needs_review",
      needsConfirmation: extracted.needsConfirmation ?? true,
      timeConfidence: extracted.timeConfidence || "none",
      tags: extracted.tags || [],
      priority: extracted.priority || "none",
      notes: extracted.notes || null,
      sourceType: "image",
      sourceText: ocrText || extracted.sourceText || null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, "users", uid, "tasks", taskId);
    await setDoc(docRef, taskDoc);
    const dueInfo = taskDoc.dueText ? ` ⏰ ${taskDoc.dueText}` : '';
    console.log(`   ✅ ${taskDoc.title}${dueInfo}`);
  }
}

function printTasksLocally(tasks: any[], ocrText: string | null) {
  console.log(`\n📋 识别结果 (${tasks.length} 个任务):`);
  if (ocrText) console.log(`   原文: ${ocrText}`);
  console.log('');
  for (const t of tasks) {
    const flags: string[] = [];
    if (t.priority === 'high') flags.push('🔴');
    if (t.dueText) flags.push(`⏰ ${t.dueText}`);
    console.log(`   ${flags.join(' ')} ${t.title}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    console.log(USAGE);
    process.exit(0);
  }

  const noSync = args.includes('--no-sync');
  const backendUrl = getBackendUrl();

  // Determine capture mode
  let mode: 'full' | 'interactive' | 'window' = 'full';
  if (args.includes('-i') || args.includes('--interactive')) mode = 'interactive';
  if (args.includes('-w') || args.includes('--window')) mode = 'window';

  // Use existing file?
  const pathIdx = args.indexOf('-p') !== -1 ? args.indexOf('-p') : args.indexOf('--path');
  let screenshotPath: string;
  let isTemp = false;

  if (pathIdx !== -1 && args[pathIdx + 1]) {
    screenshotPath = args[pathIdx + 1];
    if (!existsSync(screenshotPath)) {
      console.error(`❌ 文件不存在: ${screenshotPath}`);
      process.exit(1);
    }
    const fileSize = statSync(screenshotPath).size;
    if (fileSize === 0) {
      console.error(`❌ 图片文件为空 (0 字节): ${screenshotPath}`);
      process.exit(1);
    }
    console.log(`📂 使用已有图片: ${screenshotPath} (${formatBytes(fileSize)})`);
  } else {
    screenshotPath = await captureScreenshot(mode);
    isTemp = true;
  }

  // Read image
  const imageBase64 = base64FromFile(screenshotPath);

  // Clean up temp screenshot immediately
  if (isTemp) {
    try { unlinkSync(screenshotPath); } catch {}
  }

  // OCR + Extract
  let result;
  try {
    result = await ocrAndExtract(imageBase64, backendUrl);
  } catch (e: any) {
    console.error(`❌ 识别失败: ${e.message}`);
    process.exit(1);
  }

  const { tasks, ocrText } = result;

  if (!tasks || tasks.length === 0) {
    console.log('⚠️ 未能从截图中识别出任何任务。');
    if (ocrText) {
      console.log(`   OCR 识别到的文字: ${ocrText}`);
      console.log('   提示：图片可能不含可解析的任务文本。');
    } else {
      console.log('   提示：OCR 未返回任何文字，请检查图片是否清晰可读。');
    }
    process.exit(2);
  }

  if (noSync) {
    console.log('🔍 Dry-run 模式：仅本地识别，不同步到 Firebase');
    printTasksLocally(tasks, ocrText);
    process.exit(0);
  }

  // Sync to Firebase
  try {
    console.log('🔐 登录 Firebase...');
    const { db, uid } = await ensureFirebaseAuth();
    await syncToFirebase(db, uid, tasks, ocrText);
    notify('Todo Pro', `已从截图提取 ${tasks.length} 个任务`);
    console.log('🎉 完成！任务已同步到 Todo Pro');
  } catch (e: any) {
    console.error(`❌ 同步失败: ${e.message}`);
    console.log('   任务内容仍可查看（使用 --no-sync 仅本地识别）');
    printTasksLocally(tasks, ocrText);
    process.exit(1);
  }
}

main();
