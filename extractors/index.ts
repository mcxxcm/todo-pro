import { EXTRACTOR_CONFIG } from "@/constants/extractorConfig";
import { MockExtractor } from "./mockExtractor";
import { BackendExtractor } from "./backendExtractor";
import type { Extractor } from "./types";

function createExtractor(): Extractor {
  switch (EXTRACTOR_CONFIG.ACTIVE_EXTRACTOR) {
    case "backend":
      return new BackendExtractor();
    case "mock":
    default:
      return new MockExtractor();
  }
}

export const activeExtractor = createExtractor();
