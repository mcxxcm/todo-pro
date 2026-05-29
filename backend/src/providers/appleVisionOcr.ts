import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 30_000;

export async function extractTextWithAppleVision(
  imageBase64: string,
): Promise<string> {
  if (process.platform !== "darwin") {
    throw new Error("Apple Vision OCR is only available on macOS.");
  }

  const workDir = path.join(tmpdir(), "todo-pro-ocr");
  const imagePath = path.join(workDir, `${randomUUID()}.png`);
  const scriptPath = path.resolve(__dirname, "../../scripts/apple_vision_ocr.swift");
  const timeout = Number(process.env.OCR_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  await mkdir(workDir, { recursive: true });
  await writeFile(imagePath, Buffer.from(imageBase64, "base64"));

  try {
    const { stdout } = await execFileAsync("swift", [scriptPath, imagePath], {
      maxBuffer: 1024 * 1024,
      timeout,
    });
    return stdout;
  } catch (err) {
    if (err instanceof Error && /ENOENT/.test(err.message)) {
      throw new Error(
        "Apple Vision OCR requires the macOS Swift toolchain. Install Xcode Command Line Tools and retry.",
      );
    }
    throw err;
  } finally {
    await rm(imagePath, { force: true });
  }
}
