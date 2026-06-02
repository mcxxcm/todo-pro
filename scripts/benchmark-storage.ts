/**
 * AsyncStorage 存储性能基准测试 (Node mock)
 *
 * 用法: npx tsx scripts/benchmark-storage.ts [taskCount]
 * 默认: 依次测试 100, 500, 1000
 */
import type { NormalizedTask } from "../types/task";

// In-memory mock of AsyncStorage for Node.js benchmark
const store = new Map<string, string>();
const MockAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return store.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    store.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    store.delete(key);
  },
};

const BENCHMARK_KEY = "todo_pro_benchmark_tasks";

function generateTask(index: number): NormalizedTask {
  const now = new Date(Date.now() + index * 60000).toISOString();
  return {
    id: `bench-${String(index).padStart(6, "0")}`,
    title: `Benchmark Task ${index}`,
    notes: index % 3 === 0 ? `备注 ${index}` : undefined,
    sourceId: index % 5 === 0 ? `src-${index}` : undefined,
    sourceType: index % 5 === 0 ? "manual" : undefined,
    sourceText: index % 5 === 0 ? `原始文本 ${index}` : undefined,
    dueAt: index % 4 === 0 ? now : undefined,
    dueText: index % 4 === 0 ? `周${["一","二","三","四","五"][index%5]}` : undefined,
    timeConfidence: index % 4 === 0 ? "high" : "none",
    needsConfirmation: index % 4 === 0,
    priority: (["none", "low", "medium", "high"] as const)[index % 4],
    tags: index % 3 === 0 ? ["tag1", "tag2"] : [],
    status: (["todo", "done", "todo", "todo", "archived"] as const)[index % 5],
    createdAt: now,
    updatedAt: now,
    provider: "local",
    estimatedMinutes: index % 6 === 0 ? 30 : undefined,
    actualMinutes: index % 10 === 0 ? 25 : undefined,
  };
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function benchmark(count: number) {
  console.log(`\n--- Benchmark: ${count} tasks ---`);

  const genStart = performance.now();
  const tasks: NormalizedTask[] = [];
  for (let i = 0; i < count; i++) {
    tasks.push(generateTask(i));
  }
  const genMs = performance.now() - genStart;
  const json = JSON.stringify(tasks);
  const dataSize = json.length;
  console.log(`  生成: ${formatMs(genMs)} | JSON: ${(dataSize / 1024).toFixed(1)} KB`);

  const writeStart = performance.now();
  await MockAsyncStorage.setItem(BENCHMARK_KEY, json);
  const writeMs = performance.now() - writeStart;
  console.log(`  写入(stringify+set): ${formatMs(writeMs)}`);

  const readStart = performance.now();
  const raw = await MockAsyncStorage.getItem(BENCHMARK_KEY);
  const parsed = JSON.parse(raw || "[]") as NormalizedTask[];
  const readMs = performance.now() - readStart;
  console.log(`  读取(get+parse): ${formatMs(readMs)} | 解析: ${parsed.length}`);

  const filterStart = performance.now();
  const todoTasks = parsed.filter((t) => t.status === "todo");
  const filterMs = performance.now() - filterStart;
  console.log(`  筛选status=todo: ${formatMs(filterMs)} | 结果: ${todoTasks.length}`);

  const updateStart = performance.now();
  parsed[0] = { ...parsed[0], title: parsed[0].title + " (updated)", updatedAt: new Date().toISOString() };
  await MockAsyncStorage.setItem(BENCHMARK_KEY, JSON.stringify(parsed));
  const updateMs = performance.now() - updateStart;
  console.log(`  更新后全量写入: ${formatMs(updateMs)}`);

  await MockAsyncStorage.removeItem(BENCHMARK_KEY);

  return { count, dataSize, writeMs, readMs, filterMs, updateMs };
}

async function main() {
  const arg = process.argv[2];
  const counts = arg ? [parseInt(arg, 10)] : [100, 500, 1000];

  console.log("Todo Pro AsyncStorage Benchmark (Node mock)");
  console.log("=============================================");

  const results = [];
  for (const count of counts) {
    results.push(await benchmark(count));
  }

  console.log("\n--- Summary ---");
  console.log("| Count | Data Size | Write | Read+Parse | Filter | Update+Write |");
  console.log("|-------|-----------|-------|------------|--------|-------------|");
  for (const r of results) {
    console.log(
      `| ${r.count} | ${(r.dataSize / 1024).toFixed(1)} KB | ${formatMs(r.writeMs)} | ${formatMs(r.readMs)} | ${formatMs(r.filterMs)} | ${formatMs(r.updateMs)} |`,
    );
  }
}

main().catch(console.error);
