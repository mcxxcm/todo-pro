import { ExtractionResult } from "@/types/extraction";

export interface Extractor {
  readonly name: string;
  extract(text: string): Promise<ExtractionResult>;
}
