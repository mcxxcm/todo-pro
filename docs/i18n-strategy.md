# i18n 国际化迁移策略 (Phase 4)

## 当前状态

Todo Pro 当前仅支持中文（zh-CN）。所有 UI 文本、日期格式、错误消息均为中文硬编码。

## 技术方案

选择 `expo-localization` + React Context 方案，理由：

- Expo SDK 内置 `expo-localization`，零额外依赖
- 轻量 Context 方案，不引入 `react-i18next` 等重型库
- 与现有 `useColorScheme` 模式一致（theme 本身也是 Context）
- 默认中文，回退安全

**依赖：**
- `expo-localization`（已随 Expo SDK 安装，无需新增）

## 架构

```
lib/i18n/
  index.ts          — I18nContext + useI18n hook
  locales/
    zh.ts           — 中文翻译
    en.ts           — 英文翻译
  types.ts          — TranslationKeys 类型
```

## 中文硬编码字符串抽样清单

### 通用 UI
| 位置 | 字符串 | 迁移优先级 |
|------|--------|-----------|
| `TaskComposer.tsx` | "输入任务或随意的一段话..." | P0 |
| `TaskComposer.tsx` | "添加" / "AI 提取" | P0 |
| `TaskItem.tsx` | "查看任务:" / "标记为完成" / "删除任务" | P0 |
| `ReviewCard.tsx` | "确认保存" / "忽略候选任务" / "添加截止日期..." | P0 |
| `EmptyTaskState.tsx` | "暂无任务" / "点击下方 + 添加任务" | P1 |

### 设置页
| 位置 | 字符串 | 迁移优先级 |
|------|--------|-----------|
| `explore.tsx` | 全部设置面板标题 | P1 |
| `LocalDataPanel.tsx` | "任务" / "草稿" / "来源" / "同步" | P1 |
| `SyncTargetRow.tsx` | "已启用" / "请输入您的 Todoist Token" | P1 |

### 任务详情
| 位置 | 字符串 | 迁移优先级 |
|------|--------|-----------|
| `TaskDetailModal.tsx` | "编辑" / "优先级" / "截止日期" / "备注" / "子任务" / "预估时间" / "实际耗时" / "重复" / "AI 拆解" / "开始专注" | P1 |
| `FocusTimerModal.tsx` | "专注中" / "已暂停" / "休息一下" / "番茄钟" / "暂停" / "继续" / "完成" / "放弃" | P2 |

### 统计面板
| 位置 | 字符串 | 迁移优先级 |
|------|--------|-----------|
| `StatsPanel.tsx` | "统计" / "完成任务" / "专注次数" 等 | P2 |

### 领域/错误消息
| 位置 | 字符串 | 迁移优先级 |
|------|--------|-----------|
| `domain/*` | 各类校验错误消息 | P3 |

## 迁移策略

### Phase 4a: 基础设施（当前）
1. 创建 `lib/i18n/` 目录结构
2. 定义 `TranslationKeys` 类型
3. 创建 `zh.ts`（从当前硬编码字符串收集）和 `en.ts`（英文翻译）
4. 创建 `I18nContext` + `useI18n` hook，默认中文
5. 先迁移一个页面验证（建议 `explore.tsx` 设置页）

### Phase 4b: 逐步迁移
- 按优先级表逐组件替换硬编码字符串
- 每个组件迁移后跑 UI 测试确认
- 未迁移组件不受影响

### Phase 4c: 收尾
- 补充最后的领域错误消息
- 完整英文翻译校对
- README 更新 i18n 状态

## 使用示例

```tsx
// lib/i18n/index.ts
const I18nContext = createContext<Translations>(zh);

export function useI18n() {
  return useContext(I18nContext);
}

// 组件中
const { t } = useI18n();
<Text>{t("taskDetail.estimatedTime")}</Text>
```

## 验收标准

- [ ] 至少一个页面支持 zh/en 切换
- [ ] 未迁移页面不受影响（仍显示中文）
- [ ] `npm run test:ui` 通过
- [ ] README 更新 i18n 状态说明
