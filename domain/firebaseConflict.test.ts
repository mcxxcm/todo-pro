import assert from "node:assert/strict";
import { detectFirebaseConflict, FirebaseConflictError } from "./firebaseConflict";

const older = "2026-06-01T10:00:00.000Z";
const newer = "2026-06-01T11:00:00.000Z";
const same = "2026-06-01T10:00:00.000Z";

// No remote → no conflict
{
  const result = detectFirebaseConflict(older, null);
  assert.equal(result.hasConflict, false);
  assert.equal(result.remoteUpdatedAt, null);
}

// Remote newer → conflict
{
  const result = detectFirebaseConflict(older, newer);
  assert.equal(result.hasConflict, true);
  assert.equal(result.reason, "remote_newer");
}

// Local newer → no conflict
{
  const result = detectFirebaseConflict(newer, older);
  assert.equal(result.hasConflict, false);
}

// Same timestamp → no conflict
{
  const result = detectFirebaseConflict(same, same);
  assert.equal(result.hasConflict, false);
}

// Invalid timestamps → no conflict (graceful)
{
  const result = detectFirebaseConflict("not-a-date", "also-not-a-date");
  assert.equal(result.hasConflict, false);
}

// Partial invalid → no conflict
{
  const result = detectFirebaseConflict(older, "bad");
  assert.equal(result.hasConflict, false);
}

// FirebaseConflictError
{
  const err = new FirebaseConflictError("task-1", older, newer);
  assert.equal(err.name, "FirebaseConflictError");
  assert.equal(err.taskId, "task-1");
  assert.ok(err.message.includes("task-1"));
}

console.log("Firebase conflict checks passed: 7");
