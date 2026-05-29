#!/bin/bash
# 方便通过快捷键或 Alfred/Raycast 调用的脚本
# 加载用户的环境变量，防止 AppleScript 调用时找不到 node/npx
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin"
source ~/.zshrc 2>/dev/null || true

cd "$(dirname "$0")/.."
npx tsx --env-file=.env mac-tools/ocr-claw.ts
