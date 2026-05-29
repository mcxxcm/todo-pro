import { BACKEND_URL } from "@/lib/backendConfig";

export interface BackendHealth {
  limits: {
    imageBase64: number;
    text: number;
  };
  ocrProvider: string;
  ok: boolean;
  provider: string;
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const response = await fetch(`${BACKEND_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status})`);
  }

  return response.json();
}
