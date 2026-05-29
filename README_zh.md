# Todo Pro (开发中)

[English](./README.md) | 简体中文

Todo Pro 是一个支持识图的 AI 任务收件箱与待办事项应用。当前的 MVP (最小可行性产品) 支持本地手动添加任务，或从文本、系统分享、图片 OCR 中提取候选任务。应用内实现了完整的追踪溯源：`Source (来源) -> Draft (草稿) -> Review (审核) -> Task (任务)`。用户可以在审核确认卡片中修改或拒绝草稿，只有被接受的草稿才会转化为本地待办任务。

后端原生包含基础中文时间解析，目前覆盖了常见的相对日期、周几、月日、月份边界以及相对时长表达，例如「明天下午3点」、「今晚八点前」、「下周五」、「下个月3号」、「月底前」和「半小时后」。

## 技术栈 (Tech Stack)

- Expo + React Native + TypeScript
- Expo Router (路由)
- AsyncStorage (本地数据持久化)
- Express (后端服务引擎)
- 默认使用 Mock 本地提取器，通过配置可随时切换为 **DeepSeek 大语言模型** 提取。
- **云端 OCR (OCR.Space)** 支持，配合后端无缝工作，并**预留了多模态视觉大模型**接入端点。
- 本地同步审计框架，并为日历、Apple Reminders 和 Todoist 预留了数据结构。

## 数据流转 (Data Loop)

```text
User text / share / OCR
  -> 将来源内容 (SourceItem) 存在本地
  -> 基于该来源的 ID 和类型，在本地生成 AI 草稿 (TaskDraft)
  -> 弹出审核卡片，用户确认、编辑或拒绝
  -> 接受后转化为真正的待办任务 (Task)，且保留完整的溯源追踪
  -> (规划中) 通过同步层生成具有审计记录的外部云同步 (SyncRecord)
```

用户粘贴或分享的 URL 将被归类为 `link` 类型。应用仅保存提供的 URL 和文本，不会在后台爬取或阅读网页，注重隐私保护。

## 快速启动 (App)

安装前端依赖:

```bash
npm install
```

启动 Expo 客户端:

```bash
npm run start
```

## 后端环境 (Backend)

Todo Pro 包含一个用于提取任务和识别图像的 Node.js/Express 后端。

安装依赖:

```bash
cd backend
npm install
```

创建环境变量文件:

```bash
cp .env.example .env
```

环境变量说明：
```bash
TASK_EXTRACTOR=deepseek        # 提取器 (可选: deepseek, mock)
DEEPSEEK_API_KEY=your_key      # 若使用 DeepSeek 则需填写 API Key
OCR_PROVIDER=ocr_space         # 默认使用 OCR.Space 进行图像文字识别
OCR_SPACE_API_KEY=helloworld   # 默认免费测试 Key
# VISION_PROVIDER=deepseek_vision # 预留：未来多模态模型一键开启
```

启动后端开发服务器:

```bash
npm run dev
```

### OCR 与多模态架构 (Plan B)
目前由于 Vercel 的 Linux 运行环境限制，我们默认使用了 **Plan B 架构**：
1. App 拍摄或选取图片后，发往后端的统一接口 `/api/v1/extract-tasks-from-image`。
2. 后端自动请求 `OCR.Space` 将图片转化为文字。
3. 后端再将文字发送给 `DeepSeek` 解析为任务结构，最终连同原文一并返回给前端存储。

**多模态升级**：未来仅需在环境变量中配置 `VISION_PROVIDER` 等少量参数，后端即可直接把图片喂给原生的多模态大模型，App 前端代码**无需任何修改**即可零成本自动升级。

## 产品护栏与理念 (Product Guardrails)

- **用户确认第一**：AI 或 OCR 输出的内容必须作为“草稿”状态保留，直到用户确认无误。
- **强制溯源**：每一条从 AI 提取出来的任务，都会保存原始来源文本，保证可追溯。
- **时间复核**：对于模糊的中文时间表达，即使后端已经精准解析（并填入了 `dueAt`），App 依然会在 UI 上高亮标记它，强制要求用户进行肉眼复核。
- **安全与隐私**：大语言模型（如 DeepSeek）和第三方接口的 API Key 永远只放在您自己控制的后端环境变量中，绝不会打包到客户端 App 中。

## 功能完成度 (Completion Map)

- [x] 本地任务闭环：手动添加、列表、编辑、完成、删除等均通过本地存储完成。
- [x] 手动时间解析：能够把“明天下午”等词汇解析并剥离出任务标题。
- [x] 多来源接入：手动输入、文本分享、链接分享、图片、OCR 等均可产生源数据。
- [x] 审核闭环：AI 解析的任务在确认前一直是草稿。
- [x] 智能分组：根据任务时间自动将它们分组为“已逾期”、“今天”、“计划内”、“收件箱”、“已完成”。
- [x] 后端 AI 接入：完成 DeepSeek 文本提取功能。
- [x] 生产可用 OCR：已脱离本地 Mac 引擎限制，接入云端生产 OCR 环境。
- [x] 外部同步（筹备）：提供同步框架并完成对 Todoist、Calendar 负载数据结构的测试验证。
