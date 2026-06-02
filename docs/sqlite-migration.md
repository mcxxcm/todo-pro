# AsyncStorage → SQLite 迁移方案

## 背景

当前 Todo Pro 使用 AsyncStorage (key-value) 存储所有数据，全量 JSON 序列化/反序列化。当任务数超过 500 时，全量读写性能显著下降。SQLite 支持索引查询、分页和增量更新，适合更大规模数据集。

## 迁移触发条件

1. **自动触发**：任务数 > 500（可配置阈值 `SQLITE_MIGRATION_THRESHOLD`）
2. **手动触发**：设置 > 数据 > "迁移到 SQLite"
3. **首次启动**：若无 AsyncStorage 数据但 SQLite 中有数据（换设备恢复场景）

## SQLite Schema 草案

```sql
-- 核心任务表
CREATE TABLE tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  notes         TEXT,
  source_id     TEXT,
  source_type   TEXT,
  source_text   TEXT,
  due_at        TEXT,
  due_text      TEXT,
  all_day       INTEGER DEFAULT 0,
  time_text     TEXT,
  time_confidence TEXT NOT NULL DEFAULT 'none',
  time_status   TEXT,
  needs_confirmation INTEGER NOT NULL DEFAULT 0,
  priority      TEXT NOT NULL DEFAULT 'none',
  tags          TEXT NOT NULL DEFAULT '[]',       -- JSON array
  status        TEXT NOT NULL DEFAULT 'todo',
  provider      TEXT NOT NULL DEFAULT 'local',
  external_id   TEXT,
  estimated_minutes INTEGER,
  actual_minutes    INTEGER,
  completed_at  TEXT,
  xp            INTEGER DEFAULT 0,
  recurrence    TEXT,                              -- JSON: RecurrenceRule
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX idx_tasks_source_id ON tasks(source_id);
CREATE INDEX idx_tasks_provider ON tasks(provider);

-- 子任务表
CREATE TABLE subtasks (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'todo',
  estimated_minutes INTEGER,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);

-- 专注记录表
CREATE TABLE focus_sessions (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  duration_minutes INTEGER NOT NULL
);

CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);

-- 草稿表
CREATE TABLE drafts (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  source_text   TEXT,
  source_id     TEXT,
  source_type   TEXT,
  due_text      TEXT,
  due_at        TEXT,
  priority      TEXT NOT NULL DEFAULT 'none',
  tags          TEXT NOT NULL DEFAULT '[]',
  notes         TEXT,
  time_confidence TEXT NOT NULL DEFAULT 'none',
  time_status   TEXT,
  confidence    REAL,
  status        TEXT NOT NULL DEFAULT 'pending',
  accepted_task_id TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_drafts_source_id ON drafts(source_id);

-- 来源表
CREATE TABLE sources (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  title         TEXT,
  raw_content   TEXT,
  origin        TEXT,
  metadata      TEXT,                              -- JSON
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_sources_type ON sources(type);

-- 同步记录表
CREATE TABLE sync_records (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL,
  provider      TEXT NOT NULL,
  operation     TEXT NOT NULL DEFAULT 'export_task',
  status        TEXT NOT NULL DEFAULT 'pending',
  external_id   TEXT,
  error         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX idx_sync_records_task_id ON sync_records(task_id);
CREATE INDEX idx_sync_records_provider ON sync_records(provider);
CREATE INDEX idx_sync_records_status ON sync_records(status);
```

## 索引策略

| 查询场景 | 使用索引 |
|---------|---------|
| 首页按状态分组 | `idx_tasks_status` |
| 按到期日排序 | `idx_tasks_due_at` |
| 冲突检测 | `idx_tasks_updated_at` |
| 来源追溯 | `idx_tasks_source_id`, `idx_drafts_source_id` |
| 同步筛选 | `idx_tasks_provider`, `idx_sync_records_task_id` |

## 迁移流程

```
1. 检查当前任务数是否 > 阈值（或手动触发）
2. 创建 SQLite 数据库和表结构
3. 事务中逐表迁移数据：
   a. sources → sources
   b. drafts → drafts
   c. tasks → tasks + subtasks + focus_sessions
   d. sync_records → sync_records
4. 验证迁移行数一致
5. 标记迁移完成（设置 schema_version）
6. 后续读写全部走 SQLite
7. 保留 AsyncStorage 数据 7 天作为回滚备份
```

## 读写模式变更

| 操作 | AsyncStorage (当前) | SQLite (迁移后) |
|------|---------------------|-----------------|
| 加载全部任务 | `getItem` → `JSON.parse` → 全量 | `SELECT * FROM tasks` + 分页 |
| 按状态筛选 | 内存 filter | `WHERE status = ?` 索引查询 |
| 添加任务 | 全量读 → push → 全量写 | `INSERT INTO tasks` |
| 更新任务 | 全量读 → find → splice → 全量写 | `UPDATE tasks WHERE id = ?` |
| 删除任务 | 全量读 → filter → 全量写 | `DELETE FROM tasks WHERE id = ?` |

## 实施依赖

- `expo-sqlite` (Expo SDK 55 内置 `expo-sqlite/next` 支持同步 API)
- 无需额外安装运行依赖
