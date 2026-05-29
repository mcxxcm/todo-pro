export type ClockInput = Date | string;

export function toIsoString(input: ClockInput): string {
  return input instanceof Date ? input.toISOString() : new Date(input).toISOString();
}

export function getCurrentIsoString(): string {
  return new Date().toISOString();
}
