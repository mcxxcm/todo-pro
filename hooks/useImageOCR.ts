import { useState, useCallback } from "react";
import { extractTextFromImage } from "@/lib/ocrApi";

interface UseImageOcrOptions {
  onTextExtracted: (text: string) => void;
}

export function useImageOCR({ onTextExtracted }: UseImageOcrOptions) {
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const processImage = useCallback(
    async (imageBase64: string) => {
      setOcrScanning(true);
      setOcrError(null);
      try {
        const { text } = await extractTextFromImage(imageBase64);
        if (!text.trim()) {
          setOcrError("图片中未识别到文字");
          return;
        }
        onTextExtracted(text);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "OCR recognition failed";
        setOcrError(message);
        console.error("ocr failed", e);
      } finally {
        setOcrScanning(false);
      }
    },
    [onTextExtracted],
  );

  const clearOcrError = useCallback(() => setOcrError(null), []);

  return {
    ocrScanning,
    ocrError,
    processImage,
    clearOcrError,
  };
}
