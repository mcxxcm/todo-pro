export function createLocalId(prefix?: string, randomLength = 9): string {
  const randomPart = Math.random().toString(36).slice(2, 2 + randomLength);
  const baseId = `${Date.now()}-${randomPart}`;
  return prefix ? `${prefix}-${baseId}` : baseId;
}
