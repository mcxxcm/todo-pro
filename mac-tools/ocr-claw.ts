import { execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import path from 'path';

const firebaseConfig = {
  projectId: "todo-pro-3eab1",
  appId: "1:522771236124:web:eeeeeb45db7309cf9126d9",
  apiKey: "AIzaSyBeO0ZsHkFRs6Vs_yoXHyqNk4Gp98XhggA",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to generate IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function run() {
  const email = process.env.TODO_PRO_EMAIL;
  const password = process.env.TODO_PRO_PASSWORD;
  const backendUrl = process.env.TODO_PRO_BACKEND_URL || 'http://localhost:8787';

  if (!email || !password) {
    console.error("❌ 请在根目录 .env 文件中配置 TODO_PRO_EMAIL 和 TODO_PRO_PASSWORD");
    process.exit(1);
  }

  console.log("🚀 [1/4] 登录 Firebase...");
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ 登录成功! (UID: ${userCredential.user.uid})`);
  } catch (e: any) {
    console.error("❌ 登录失败:", e.message);
    process.exit(1);
  }

  const tmpPath = '/tmp/todo-pro-screenshot.png';
  console.log("📸 [2/4] 请在屏幕上框选需要识别的区域...");
  
  try {
    // -i for interactive (selection), -s for silent
    execSync(`screencapture -i ${tmpPath}`);
  } catch (e) {
    console.log("⚠️ 截图被取消");
    process.exit(0);
  }

  let base64Image = "";
  try {
    const imageBuffer = readFileSync(tmpPath);
    base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    unlinkSync(tmpPath); // Cleanup
  } catch (e) {
    console.error("❌ 读取截图失败, 可能未框选任何区域");
    process.exit(1);
  }

  console.log("🧠 [3/4] 正在调用本地大模型后端进行 OCR 与任务抽取...");
  try {
    const response = await fetch(`${backendUrl}/api/v1/extract-tasks-from-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      throw new Error(`后端返回错误: ${response.statusText}`);
    }

    const data = await response.json();
    const tasks = data.tasks;

    if (!tasks || tasks.length === 0) {
      console.log("⚠️ 未能从截图中识别出任何任务。");
      process.exit(0);
    }

    console.log(`✨ 成功抽取到 ${tasks.length} 个任务！`);
    
    console.log("☁️ [4/4] 正在同步到 Firebase 云端...");
    const now = new Date();
    const nowIso = now.toISOString();

    for (const extracted of tasks) {
      const taskId = generateId();
      const taskDoc = {
        id: taskId,
        title: extracted.title,
        status: "todo",
        dueText: extracted.dueText || null,
        dueAt: extracted.dueAt || null,
        timeStatus: extracted.timeStatus || "none",
        needsConfirmation: extracted.needsConfirmation || false,
        timeConfidence: extracted.timeConfidence || "none",
        tags: extracted.tags || [],
        priority: extracted.priority || "none",
        notes: extracted.notes || null,
        sourceType: "image",
        sourceText: data.ocrText || null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const docRef = doc(db, "users", userCredential.user.uid, "tasks", taskId);
      await setDoc(docRef, taskDoc);
      console.log(`   👉 同步成功: [${taskDoc.title}] (预计时间: ${taskDoc.dueText || '无'})`);
    }

    console.log("🎉 全部完成！请查看手机端 App，任务应该已经秒级同步并设置好了闹钟！");
    process.exit(0);

  } catch (e: any) {
    console.error("❌ 发生错误:", e.message);
    process.exit(1);
  }
}

run();
