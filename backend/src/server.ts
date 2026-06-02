import express, { Request, Response } from "express";
import cors from "cors";
import { createTaskExtractionProvider } from "./providers";
import { decomposeWithDeepSeek, type DecomposeInput } from "./providers/deepseekProvider";
import { createOcrProvider } from "./providers/ocrProvider";
import {
  MAX_IMAGE_BASE64_LENGTH,
  MAX_TEXT_LENGTH,
  validateExtractionText,
  validateOcrImage,
} from "./validation";

const app = express();
const PORT = parseInt(process.env.PORT ?? "8787", 10);
const taskExtractionProvider = createTaskExtractionProvider();
const ocrProvider = createOcrProvider();

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : undefined; // undefined = allow all origins in development
const API_KEY = process.env.API_KEY;

app.use(
  cors(
    ALLOWED_ORIGINS ? { origin: ALLOWED_ORIGINS } : undefined,
  ),
);
app.use(express.json({ limit: "10mb" }));

// ---------- Structured request logging ----------

let requestCounter = 0;

app.use((req: Request, res: Response, next) => {
  const requestId = `req-${Date.now()}-${++requestCounter}`;
  const start = Date.now();

  // Attach request ID for downstream use
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logEntry = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    };
    if (res.statusCode >= 400) {
      console.error("[request]", JSON.stringify(logEntry));
    } else {
      console.log("[request]", JSON.stringify(logEntry));
    }
  });

  next();
});

// ---------- API Key authentication ----------

if (API_KEY) {
  app.use((req: Request, res: Response, next) => {
    if (req.path === "/health") return next();
    const provided = req.headers["x-api-key"];
    if (provided !== API_KEY) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });
}

// ---------- Routes ----------

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    apiVersion: "v1",
    limits: {
      imageBase64: MAX_IMAGE_BASE64_LENGTH,
      text: MAX_TEXT_LENGTH,
    },
    ocrProvider: ocrProvider.name,
    ok: true,
    provider: taskExtractionProvider.name,
  });
});

// --- v1 API routes ---

app.post(
  "/api/v1/extract-tasks",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateExtractionText(req.body?.text);

      if (!validation.ok) {
        res.status(400).json({
          error: "Bad Request",
          message: validation.message,
        });
        return;
      }

      const result = await taskExtractionProvider.extractTasks(validation.value);
      res.json(result);
    } catch (err) {
      console.error("[extract-tasks] error:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.post(
  "/api/v1/decompose-task",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, notes, dueAt } = req.body ?? {};
      if (!title || typeof title !== "string" || !title.trim()) {
        res.status(400).json({ error: "Bad Request", message: "title is required" });
        return;
      }

      const input: DecomposeInput = { title: title.trim() };
      if (typeof notes === "string" && notes.trim()) input.notes = notes.trim();
      if (typeof dueAt === "string" && dueAt.trim()) input.dueAt = dueAt.trim();

      const result = await decomposeWithDeepSeek(input);
      res.json(result);
    } catch (err) {
      console.error("[decompose-task] error:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.post(
  "/api/v1/ocr",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateOcrImage(req.body?.image);

      if (!validation.ok) {
        res.status(400).json({
          error: "Bad Request",
          message: validation.message,
        });
        return;
      }

      const result = await ocrProvider.extractText(validation.value);
      res.json(result);
    } catch (err) {
      console.error("[ocr] error:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.post(
  "/api/v1/extract-tasks-from-image",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateOcrImage(req.body?.image);

      if (!validation.ok) {
        res.status(400).json({
          error: "Bad Request",
          message: validation.message,
        });
        return;
      }

      // 预留多模态大模型的未来扩展点
      // 如果环境变量配置了多模态视觉模型，则走分支 A
      if (process.env.VISION_PROVIDER === "deepseek_vision") {
        console.log("Future Multimodal API logic will be inserted here.");
        res.status(501).json({ error: "Not Implemented", message: "DeepSeek Vision model integration is reserved for future use." });
        return;
      }

      // 分支 B：当前的 Plan B
      // 1. 调用 OCR 提取文本
      const ocrResult = await ocrProvider.extractText(validation.value);
      if (!ocrResult.text.trim()) {
        res.json({ ocrText: "", tasks: [] });
        return;
      }

      // 2. 调用文本大模型提取任务
      const extractResult = await taskExtractionProvider.extractTasks(ocrResult.text);

      // 返回任务列表的同时附带 OCR 的原文，供前端存入本地数据库
      res.json({
        ocrText: ocrResult.text,
        tasks: extractResult.tasks,
      });
    } catch (err) {
      console.error("[extract-tasks-from-image] error:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// --- Legacy unversioned routes (redirect to v1) ---

app.post("/api/extract-tasks", (req: Request, res: Response) => {
  res.redirect(307, "/api/v1/extract-tasks");
});

app.post("/api/ocr", (req: Request, res: Response) => {
  res.redirect(307, "/api/v1/ocr");
});

// ---------- 404 handler ----------

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    availableEndpoints: [
      "GET  /health",
      "POST /api/v1/extract-tasks",
      "POST /api/v1/ocr",
      "POST /api/v1/extract-tasks-from-image",
    ],
  });
});

export { app };

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `Todo Pro Backend v1 running at http://localhost:${PORT} with ${taskExtractionProvider.name} provider`,
    );
  });
}
