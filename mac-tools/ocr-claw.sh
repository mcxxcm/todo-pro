#!/bin/bash
# ocr-claw — 一键截图 → OCR 识别 → 同步到 Todo Pro
#
# 用法:
#   ./mac-tools/ocr-claw.sh             全屏截图（一键）
#   ./mac-tools/ocr-claw.sh -i          区域选择截图
#   ./mac-tools/ocr-claw.sh -w          窗口选择截图
#   ./mac-tools/ocr-claw.sh -p file.png  使用已有图片
#   ./mac-tools/ocr-claw.sh --no-sync    仅本地识别，不同步
#
# 设置全局快捷键 (Raycast / Alfred / Shortcuts):
#   1. 打开 Raycast → Extensions → 搜索 "Script Command"
#   2. 创建一个新 Script，命令填: /Users/mcx/todo-pro/mac-tools/ocr-claw.sh
#   3. 绑定快捷键如 Cmd+Shift+O
#
#   或者用 macOS 原生 Shortcuts App:
#   1. 打开 Shortcuts → 新建 → 添加 "Run Shell Script"
#   2. 输入: /Users/mcx/todo-pro/mac-tools/ocr-claw.sh
#   3. 设置键盘快捷键

export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin"
source ~/.zshrc 2>/dev/null || true

cd "$(dirname "$0")/.."
npx tsx --env-file=.env mac-tools/ocr-claw.ts "$@"
