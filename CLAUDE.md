# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

GitHub Pages 静态网站，包含多个 HTML5 小游戏。

## 文件结构

- `index.html` - 答案之书（随机答案生成器）
- `snake.html` - 贪吃蛇游戏
- `skill-gomoku.html` - 技能五子棋（带技能系统的五子棋）
- `3d-solar.html` - 地球 - 太阳 - 月亮 3D 运动模拟（使用 Three.js）

## 技术栈

- 纯 HTML + CSS + JavaScript
- Three.js (CDN: unpkg.com) 用于 3D 模拟
- 无构建步骤，直接部署

## Git 操作

```bash
git pull          # 拉取远程更新
git add .         # 添加更改
git commit -m "..."
git push          # 推送到 GitHub Pages
```

## 开发说明

- 所有游戏为单文件实现
- 直接在浏览器打开 HTML 文件即可运行
- 部署通过 GitHub Pages 自动完成
