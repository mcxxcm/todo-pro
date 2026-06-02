# mac-tools

macOS 本地工具集，用于快捷截图 -> OCR -> 任务草稿流程。

## ocr-claw

一键截图 OCR，可选同步到 Firebase。

```bash
# 全屏截图 + OCR + 同步到 Firebase
npx tsx mac-tools/ocr-claw.ts

# 区域选择截图
npx tsx mac-tools/ocr-claw.ts -i

# 窗口选择截图
npx tsx mac-tools/ocr-claw.ts -w

# OCR 结果仅本地输出，不同步
npx tsx mac-tools/ocr-claw.ts --no-sync

# 使用已有图片文件
npx tsx mac-tools/ocr-claw.ts -p screenshot.png
```

**前置条件：**
- macOS 15+ (使用 `screencapture` 命令行工具)
- 后端 OCR 服务运行中 (默认端口 localhost:3000)
- Firebase 配置有效 (如需同步)

## Hammerspoon 一键截图工作流

通过 Hammerspoon 绑定快捷键触发截图 -> OCR -> 任务草稿：

```lua
-- ~/.hammerspoon/init.lua
hs.hotkey.bind({"cmd", "shift"}, "T", function()
  hs.task.new("/usr/bin/osascript", nil, function(exitCode, stdOut, stdErr)
    -- 全屏截图
    hs.execute("screencapture /tmp/todo-capture.png")
    -- 调用 ocr-claw (需要先安装 tsx)
    hs.execute("cd ~/Projects/todo-pro && npx tsx mac-tools/ocr-claw.ts -p /tmp/todo-capture.png")
    -- 清理
    hs.execute("rm /tmp/todo-capture.png")
    -- 通知
    hs.notify.new({title="Todo Pro", informativeText="截图已解析为任务草稿"}):send()
  end):start()
end)
```

## Raycast 脚本集成

通过 Raycast Script Command 添加截图入口：

```bash
#!/bin/bash
# ~/Raycast/scripts/todo-screenshot.sh
# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Todo Pro 截图转任务
# @raycast.mode compact
# @raycast.icon 🗂️

cd ~/Projects/todo-pro
screencapture -i /tmp/todo-raycast.png
npx tsx mac-tools/ocr-claw.ts -p /tmp/todo-raycast.png
rm /tmp/todo-raycast.png
```

## 全流程概览

```
用户截图 (Hammerspoon/Raycast/手动)
  → PNG 保存到 /tmp
  → ocr-claw 读取 PNG
  → POST /api/ocr (Apple Vision OCR)
  → POST /api/extract-tasks (DeepSeek/Mock 提取)
  → 生成 TaskDraft 存入 Firebase/本地
  → Todo Pro 客户端显示待审核卡片
```

## 已知限制

- Apple Vision OCR 仅支持 macOS 15+ (本地 Vision 框架)
- OCR 质量依赖截图分辨率（建议 Retina 全屏）
- 无法识别手写体（仅印刷文本）
