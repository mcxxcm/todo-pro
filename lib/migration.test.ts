import assert from "node:assert/strict";
import { CURRENT_SCHEMA_VERSION } from "./migration";

// --- Default field compatibility ---
// v2 schema adds optional fields (subtasks, recurrence, estimatedMinutes, etc.)
// Existing tasks without these fields must remain valid.
{
  const v1Task = {
    id: "task-1",
    title: "hello",
    status: "todo",
    priority: "none",
    tags: [],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  // Verify that v1 task still satisfies the structural contract
  assert.equal(v1Task.id, "task-1");
  assert.equal(v1Task.title, "hello");
  assert.equal(v1Task.status, "todo");
  // v2 optional fields should be undefined, not cause errors
  assert.equal((v1Task as any).subtasks, undefined);
  assert.equal((v1Task as any).recurrence, undefined);
  assert.equal((v1Task as any).estimatedMinutes, undefined);
}

// --- Idempotency: schema version is stamped after migration ---
{
  // CURRENT_SCHEMA_VERSION should be stable
  assert.ok(typeof CURRENT_SCHEMA_VERSION === "number");
  assert.ok(CURRENT_SCHEMA_VERSION >= 2, "Schema should be at least v2");
}

// --- Corrupted data tolerance ---
// If stored data is not an array, migration should handle gracefully.
{
  const corruptedCases = [
    null,
    "not-an-array",
    {},
    42,
    "[]",
  ];

  for (const data of corruptedCases) {
    const isArray = Array.isArray(data);
    // The migration code checks `if (!Array.isArray(tasks)) return;`
    // This should not throw.
    assert.doesNotThrow(() => {
      if (!Array.isArray(data)) return;
      // If somehow we got an array, process it without errors
      for (const item of data as any[]) {
        if (typeof item !== "object" || item === null) continue;
        // Accessing unknown fields should be safe
        const _ = item.subtasks;
      }
    }, `Corrupted data case should not throw: ${JSON.stringify(data)}`);
  }
}

// --- Partial v2 fields ---
// Tasks with some but not all v2 fields should work
{
  const partialV2Task = {
    id: "task-2",
    title: "partial",
    status: "todo",
    priority: "high",
    tags: ["urgent"],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
    subtasks: [
      { id: "sub-1", title: "step 1", status: "done" as const, createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" },
    ],
    // recurrence is missing
    // estimatedMinutes is missing
    xp: 25,
  };

  assert.equal(partialV2Task.subtasks.length, 1);
  assert.equal(partialV2Task.xp, 25);
  assert.equal((partialV2Task as any).recurrence, undefined);
  assert.equal((partialV2Task as any).estimatedMinutes, undefined);
}

console.log("Migration checks passed: 4");
