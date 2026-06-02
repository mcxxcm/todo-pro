export interface ConflictCheck {
  hasConflict: boolean;
  reason?: "remote_newer" | "same_timestamp" | "no_remote";
  localUpdatedAt: string;
  remoteUpdatedAt: string | null;
}

export function detectFirebaseConflict(
  localUpdatedAt: string,
  remoteUpdatedAt: string | null,
): ConflictCheck {
  if (!remoteUpdatedAt) {
    return {
      hasConflict: false,
      localUpdatedAt,
      remoteUpdatedAt: null,
    };
  }

  const localMs = Date.parse(localUpdatedAt);
  const remoteMs = Date.parse(remoteUpdatedAt);

  if (isNaN(localMs) || isNaN(remoteMs)) {
    return {
      hasConflict: false,
      localUpdatedAt,
      remoteUpdatedAt,
    };
  }

  if (remoteMs > localMs) {
    return {
      hasConflict: true,
      reason: "remote_newer",
      localUpdatedAt,
      remoteUpdatedAt,
    };
  }

  return {
    hasConflict: false,
    localUpdatedAt,
    remoteUpdatedAt,
  };
}

export class FirebaseConflictError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly localUpdatedAt: string,
    public readonly remoteUpdatedAt: string,
  ) {
    super(
      `Conflict on task ${taskId}: remote was updated at ${remoteUpdatedAt}, local expected ${localUpdatedAt}. Reload and retry.`,
    );
    this.name = "FirebaseConflictError";
  }
}
