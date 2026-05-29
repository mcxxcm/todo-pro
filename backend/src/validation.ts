export const MAX_TEXT_LENGTH = 20_000;
export const MAX_IMAGE_BASE64_LENGTH = 10_000_000;
const BASE64_PATTERN = /^[A-Za-z0-9+/=\s]+$/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function validateExtractionText(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, message: "text must be a string" };
  }

  const text = input.trim();
  if (!text) {
    return { ok: false, message: "text must be a non-empty string" };
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      ok: false,
      message: `text must be ${MAX_TEXT_LENGTH} characters or fewer`,
    };
  }

  return { ok: true, value: text };
}

export function validateOcrImage(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, message: "image must be a base64 string" };
  }

  const image = stripDataUrlPrefix(input.trim());
  if (!image) {
    return { ok: false, message: "image must be a non-empty base64 string" };
  }

  if (image.length > MAX_IMAGE_BASE64_LENGTH) {
    return {
      ok: false,
      message: `image must be ${MAX_IMAGE_BASE64_LENGTH} characters or fewer`,
    };
  }

  if (!BASE64_PATTERN.test(image)) {
    return { ok: false, message: "image must contain valid base64 characters" };
  }

  return { ok: true, value: image.replace(/\s/g, "") };
}

function stripDataUrlPrefix(input: string): string {
  return input.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}
