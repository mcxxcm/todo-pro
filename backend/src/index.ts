import express, { Request, Response } from "express";
import { mockExtract } from "./mock";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.use(express.json());

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Task extraction
app.post("/api/extract-tasks", (req: Request, res: Response) => {
  const { text } = req.body;

  // Validate: text must be a non-empty string
  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({
      error: "Bad Request",
      message: "text must be a non-empty string",
    });
    return;
  }

  try {
    const result = mockExtract(text);
    res.json(result);
  } catch (err) {
    console.error("[extract-tasks] unexpected error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred during extraction",
    });
  }
});

// 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Todo Pro Backend running at http://localhost:${PORT}`);
});
