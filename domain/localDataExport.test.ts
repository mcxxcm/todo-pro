import assert from "node:assert/strict";
import { buildLocalDataExportBundle } from "./localDataExport";

const bundle = buildLocalDataExportBundle(
  {
    drafts: [],
    sources: [
      {
        createdAt: "2026-05-28T03:00:00.000Z",
        id: "source-1",
        rawContent: "明天下午三点玩原神",
        type: "manual",
      },
    ],
    syncRecords: [],
    tasks: [
      {
        createdAt: "2026-05-28T03:01:00.000Z",
        id: "task-1",
        needsConfirmation: false,
        priority: "none",
        provider: "local",
        status: "todo",
        tags: [],
        timeConfidence: "none",
        title: "玩原神",
        updatedAt: "2026-05-28T03:01:00.000Z",
      },
    ],
  },
  "2026-05-28T03:02:00.000Z",
);

assert.equal(bundle.schemaVersion, 1);
assert.equal(bundle.exportedAt, "2026-05-28T03:02:00.000Z");
assert.deepEqual(bundle.counts, {
  drafts: 0,
  sources: 1,
  syncRecords: 0,
  tasks: 1,
});
assert.equal(bundle.data.sources[0].type, "manual");
assert.equal(bundle.data.tasks[0].title, "玩原神");

console.log("Local data export bundle checks passed: 5");

