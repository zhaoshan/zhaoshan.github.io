# xhs-auto-post - 小红书图文笔记自动生成

## 功能

根据一个主题，自动生成并发布小红书图文笔记，包括：
- 自动搜索扩展主题信息
- 拆分子观点/论点
- 生成精美图片（1080x1400）
- 编写小红书风格文案
- 发布前用户确认
- 自动发布到小红书

## 快速开始

### 方式一：使用脚本

```bash
cd /Users/zhaoshan/.openclaw/workspace/skills/agent-reach/skills/xhs-auto-post
./run.sh "AI 工具推荐"
```

### 方式二：直接对话

直接告诉 AI 助手：
```
帮我发一篇关于"AI 工具推荐"的小红书笔记
```

AI 会自动执行完整流程。

### 方式三：使用 Skill

```
/xhs-auto-post AI 工具推荐
```

## 执行流程

```
1. 搜索扩展 → 2. 拆分论点 → 3. 生成图片 → 4. 编写文案 → 5. 确认发布
```

### 步骤说明

| 步骤 | 操作 | 输出 |
|------|------|------|
| 1. 搜索扩展 | 搜索主题相关信息 | 3-5 个核心信息点 |
| 2. 拆分论点 | 设计笔记结构 | 3-5 个子论点 |
| 3. 生成图片 | Python PIL 生成 PNG | 5 张图片（1080x1400） |
| 4. 编写文案 | 小红书风格文案 | 标题 + 正文 + 标签 |
| 5. 确认发布 | 用户确认后发布 | 笔记链接 |

## 示例输出

### 生成的图片

5 张精美图片，每张对应一个子论点：
- `xhs-skill-01-final.png` - 论点 1
- `xhs-skill-02-final.png` - 论点 2
- `xhs-skill-03-final.png` - 论点 3
- `xhs-skill-04-final.png` - 论点 4
- `xhs-skill-05-final.png` - 论点 5

### 生成的文案

```markdown
标题：🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨

正文：
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

1️⃣ site-scraper 网站爬取神器
2️⃣ agent-reach 全网搜索
3️⃣ capability-evolver 自我进化
4️⃣ nano-banana-pro AI 绘图
5️⃣ healthcheck 系统检查

💡 安装方法超简单！

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具 #职场技能
```

## 前置条件

1. **Python3 已安装**
   ```bash
   python3 --version
   ```

2. **PIL 已安装**
   ```bash
   pip3 install Pillow
   ```

3. **小红书 MCP 服务已安装并运行**
   ```bash
   # 检查服务状态
   curl http://localhost:18060/mcp
   
   # 如未运行，启动服务
   ~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp
   ```

4. **已登录小红书账号**
   - 配置 Cookie 或扫码登录

## 自定义配置

### 修改图片样式

编辑 `generate-xhs-images-final.py`：
- 调整配色方案（colors 数组）
- 修改字体大小（FONT_XXX）
- 调整布局间距（card_margin, content_padding 等）

### 修改文案风格

在 SKILL.md 中调整文案模板：
- 调整 emoji 使用频率
- 修改开头吸引语
- 调整互动引导方式

### 调整发布策略

- 标签数量（建议 5-10 个）
- 发布时间（建议晚上 7-9 点）
- 发布频率（避免短时间大量发布）

## 注意事项

⚠️ **发布前必须确认**
- 笔记发布后无法删除
- 仔细检查文案和图片

⚠️ **内容合规**
- 避免敏感话题
- 确保图片无版权问题
- 遵守小红书社区规范

⚠️ **账号安全**
- 避免短时间大量发布
- 使用真实账号
- 注意 Cookie 安全

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| PIL 未安装 | `pip3 install Pillow` |
| MCP 服务未运行 | 运行 `xiaohongshu-mcp` |
| 未登录 | 配置 Cookie 或重新扫码登录 |
| 图片生成失败 | 检查字体文件是否存在 |
| 发布失败 | 检查 Cookie 是否过期 |

## 文件结构

```
xhs-auto-post/
├── SKILL.md          # 技能配置（完整流程说明）
├── README.md         # 使用说明（本文件）
├── run.sh            # 快速启动脚本
└── generate-xhs-images-final.py  # 图片生成脚本（在工作区根目录）
```

## 许可证

MIT
