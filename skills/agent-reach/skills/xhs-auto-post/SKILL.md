# xhs-auto-post - 小红书图文笔记自动生成技能

## 功能概述

根据用户提供的主题，自动生成并发布小红书图文笔记，包括：
- 自动搜索扩展主题信息
- 拆分子观点/论点（每个论点对应一张图片）
- 生成精美图片（1080x1400）
- 编写小红书风格文案
- 自动发布到小红书

## 完整流程

```
用户主题 → 搜索扩展 → 拆分论点 → 生成图片 → 编写文案 → 用户确认 → 发布笔记
```

## 快速开始

### 方式一：使用脚本

```bash
cd /Users/zhaoshan/.openclaw/workspace/skills/agent-reach/skills/xhs-auto-post
./run.sh "AI 工具推荐"
```

### 方式二：直接对话

```
帮我发一篇关于"AI 工具推荐"的小红书笔记
```

### 方式三：使用 Skill

```
/xhs-auto-post AI 工具推荐
```

## 执行流程详解

### 步骤 1：搜索扩展核心信息

**目标**：收集主题相关的背景信息、数据、案例。

**操作**：
1. 询问用户确认主题（如果未明确）
2. 使用搜索工具收集信息：
   - `web_search` - 搜索主题相关内容
   - `xhs-search` - 搜索小红书上的相关笔记（了解热门内容）
3. 整理核心信息点（3-5 个关键点）

**输出示例**：
```
主题：AI 工具推荐

核心信息：
1. 2026 年最火的 5 个 AI 工具
2. 各工具的适用场景
3. 价格对比
4. 使用技巧
5. 避坑指南
```

### 步骤 2：拆分子观点/论点

**目标**：将主题拆解成逻辑清晰的几个子论点（每个论点对应一张图片）。

**操作**：
1. 根据核心信息设计笔记结构
2. 拆分成 3-5 个子论点（适合小红书碎片化阅读）
3. 每个论点配 1-2 句说明

**输出示例**：
```
子论点结构（5 张图）：
1. site-scraper - 网站爬取神器
2. agent-reach - 全网搜索工具
3. capability-evolver - 自我进化
4. nano-banana-pro - AI 绘图
5. healthcheck - 健康检查
```

### 步骤 3：生成图片

**目标**：为每个子论点生成一张精美的图片。

**操作**：
1. 调用图片生成脚本
2. 每个论点生成一张 1080x1400 的 PNG 图片
3. 使用渐变背景 + 白色卡片布局

**图片生成脚本**：
```bash
cd /Users/zhaoshan/.openclaw/workspace/skills/agent-reach/skills/xhs-auto-post
python3 generate_images.py skills
```

**输出**：5 张 PNG 图片（`xhs-skills-01.png` 到 `xhs-skills-05.png`）

**输出目录**：`~/xiaohongshu_post/`

### 步骤 4：编写文案

**目标**：编写小红书风格的笔记文案。

**操作**：
1. 编写标题（吸引眼球 + emoji，**不超过 20 个字符**）
2. 编写正文（分点说明 + emoji 点缀）
3. 添加互动引导
4. 添加话题标签（5-10 个）

**文案示例**：
```markdown
标题：OpenClaw 必装 5 个 Skills！效率翻倍

正文：
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

1️⃣ site-scraper 网站爬取神器
2️⃣ agent-reach 全网搜索
3️⃣ capability-evolver 自我进化
4️⃣ nano-banana-pro AI 绘图
5️⃣ healthcheck 系统检查

💡 安装方法超简单！

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具 #职场技能 #AI 技能
```

### 步骤 5：用户确认后发布

**目标**：发布前让用户确认内容。

**操作**：
1. 展示完整笔记内容给用户
2. 用户确认后调用发布工具
3. 处理发布结果

**发布命令**：
```bash
mcporter --config ~/.openclaw/workspace/config/mcporter.json call xiaohongshu.publish_content \
  title='OpenClaw 必装 5 个 Skills！效率翻倍' \
  content='AI 打工人必看！...' \
  images='["/Users/zhaoshan/xiaohongshu_post/xhs-skills-01.png",...]' \
  tags='["OpenClaw","AI 工具","效率工具"]'
```

## 完整示例对话

**用户**：帮我发一篇关于"AI 工具推荐"的小红书笔记

**助手**：
```
好的！我来帮你生成一篇 AI 工具推荐的小红书笔记。

【步骤 1/5】正在搜索 AI 工具相关信息...
✅ 已收集核心信息：
1. 2026 年主流 AI 工具盘点
2. 各工具适用场景
3. 价格对比
4. 使用技巧
5. 避坑指南

【步骤 2/5】正在拆分论点...
✅ 已设计 5 个子论点：
1. site-scraper - 网站爬取
2. agent-reach - 全网搜索
3. capability-evolver - 自我进化
4. nano-banana-pro - AI 绘图
5. healthcheck - 健康检查

【步骤 3/5】正在生成图片...
✅ 图片已生成：
- xhs-skills-01.png
- xhs-skills-02.png
- xhs-skills-03.png
- xhs-skills-04.png
- xhs-skills-05.png

【步骤 4/5】正在编写文案...
✅ 笔记内容已准备好

【步骤 5/5】请确认发布：

标题：OpenClaw 必装 5 个 Skills！效率翻倍

正文：
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～
...（完整正文）

图片：5 张（已生成）

话题：#OpenClaw #AI 工具 #效率工具 ...

确认发布吗？回复"确认"或"发布"即可。
```

**用户**：确认

**助手**：
```
✅ 笔记已发布成功！

标题：OpenClaw 必装 5 个 Skills！效率翻倍
图片：5 张
状态：发布完成

可以上小红书查看笔记了！
```

## 前置条件

### 1. Python3 已安装

```bash
python3 --version
```

### 2. PIL 已安装

```bash
pip3 install Pillow
```

### 3. 小红书 MCP 服务已安装并运行

**检查服务状态**：
```bash
curl http://localhost:18060/mcp
```

**如未运行，启动服务**：
```bash
cd ~/.agent-reach/tools/xiaohongshu-mcp
./xiaohongshu-mcp
```

### 4. 已登录小红书账号

**检查登录状态**：
```bash
mcporter --config ~/.openclaw/workspace/config/mcporter.json call xiaohongshu.check_login_status
```

**配置 Cookie**：
1. 浏览器打开 https://www.xiaohongshu.com
2. 登录账号
3. 控制台执行：
```javascript
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
  const [key, value] = cookie.split('=');
  acc[key] = decodeURIComponent(value);
  return acc;
}, {});
console.log(JSON.stringify(Object.entries(cookies).map(([name, value]) => ({
  name, value, domain: ".xiaohongshu.com", path: "/", httpOnly: false, secure: true
})), null, 2));
```
4. 保存输出到 `~/.agent-reach/tools/xiaohongshu-mcp/cookies.json`
5. 重启服务：`pkill -f xiaohongshu-mcp && ~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp &`

### 5. mcporter 已配置

**配置文件**：`~/.openclaw/workspace/config/mcporter.json`

```json
{
  "mcpServers": {
    "xiaohongshu": {
      "baseUrl": "http://localhost:18060/mcp"
    }
  }
}
```

## 踩过的坑与解决方案

### 坑 1：Cookie 格式错误

**问题**：Cookie 保存为对象格式，MCP 服务期望数组格式

**错误信息**：
```
failed to unmarshal cookies: json: cannot unmarshal object into Go value of type []*proto.NetworkCookie
```

**解决方案**：使用数组格式保存 Cookie
```json
[
  {"name": "web_session", "value": "...", "domain": ".xiaohongshu.com", "path": "/", "httpOnly": false, "secure": true},
  {"name": "a1", "value": "...", "domain": ".xiaohongshu.com", "path": "/", "httpOnly": false, "secure": true}
]
```

### 坑 2：Cookie 缺少关键字段

**问题**：Cookie 缺少 `web_session` 字段，导致登录失败

**解决方案**：确保从浏览器导出完整的 Cookie，必须包含：
- `web_session`（最关键）
- `a1`
- `webId`
- `gid`
- `xsecappid`
- `webBuild`
- `websectiga`
- `sec_poison_id`
- `loadts`
- `abRequestId`
- `unread`

### 坑 3：发布工具名称错误

**问题**：尝试 `publish_note`、`publish` 等工具名称都失败

**错误信息**：
```
MCP error -32602: unknown tool "publish_note"
```

**解决方案**：正确的工具名称是 `publish_content`

### 坑 4：标题长度超限

**问题**：标题超过 20 个字符导致发布失败

**错误信息**：
```
发布失败：标题长度超过限制
```

**解决方案**：标题控制在 20 个字符以内
- ❌ `🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨`（太长）
- ✅ `OpenClaw 必装 5 个 Skills！效率翻倍`（正确）

### 坑 5：图片参数格式错误

**问题**：使用 `images.0`、`images.1` 等格式传递参数失败

**错误信息**：
```
MCP error -32602: invalid params: validating "arguments": unexpected additional properties ["images.0" "images.1" ...]
```

**解决方案**：使用 JSON 数组格式传递
```bash
images='["/path/to/img1.png","/path/to/img2.png"]'
```

### 坑 6：内容中的 `\n` 转义问题

**问题**：发布时内容中的 `\n` 被当作字面字符，导致笔记显示大量 `\n`

**错误表现**：
```
正文显示为：AI 打工人必看！\n\n1️⃣ site-scraper...
```

**解决方案 1**：使用 heredoc 方式传递内容
```bash
CONTENT=$(cat << 'CONTENTEOF'
AI 打工人必看！

1️⃣ site-scraper
2️⃣ agent-reach
CONTENTEOF
)

mcporter call xiaohongshu.publish_content content="$CONTENT" ...
```

**解决方案 2**：使用 `$'...'` 语法解析转义符
```bash
content=$'AI 打工人必看！\n\n1️⃣ site-scraper'
```

**解决方案 3**：使用 printf 处理
```bash
content=$(printf 'AI 打工人必看！\n\n1️⃣ site-scraper')
```

### 坑 7：MCP 协议会话管理问题

**问题**：`tools/call` 返回 "invalid during session initialization"

**解决方案**：使用 mcporter 命令行工具，它自动处理 MCP 协议会话管理
```bash
mcporter --config ~/.openclaw/workspace/config/mcporter.json call xiaohongshu.publish_content ...
```

### 坑 8：mcporter 配置路径问题

**问题**：mcporter 默认不读取自定义配置文件

**解决方案**：始终使用 `--config` 参数指定配置文件
```bash
mcporter --config ~/.openclaw/workspace/config/mcporter.json call ...
```

## 注意事项

### 内容规范

⚠️ **标题限制**
- 不超过 20 个字符
- 避免过多 emoji（最多 2 个）
- 包含关键词吸引点击

⚠️ **内容规范**
- 避免敏感话题
- 确保图片无版权问题
- 遵守小红书社区规范

### 发布策略

⚠️ **发布频率**
- 避免短时间大量发布
- 建议间隔 1 小时以上

⚠️ **标签数量**
- 建议 5-10 个话题标签
- 包含热门话题和精准话题

### 账号安全

⚠️ **Cookie 安全**
- Cookie 定期更新（有效期约 7-30 天）
- 不要分享 Cookie 文件
- 使用专用账号进行自动化操作

⚠️ **操作限制**
- 避免频繁发布
- 模拟真实用户行为
- 注意平台风控

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| PIL 未安装 | `pip3 install Pillow` |
| MCP 服务未运行 | `~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp &` |
| 未登录 | 配置 Cookie 并重启服务 |
| 图片生成失败 | 检查字体文件是否存在 |
| 发布失败 - 标题长度 | 缩短标题到 20 字符以内 |
| 发布失败 - 参数格式 | 使用 JSON 数组格式传递 images 和 tags |
| 发布失败 - 未知工具 | 确认工具名称为 `publish_content` |
| 发布失败 - 内容含 `\n` | 使用 heredoc 或 `$'...'` 语法 |
| Cookie 格式错误 | 使用数组格式保存 Cookie |
| Cookie 缺少字段 | 确保包含 `web_session` 等关键字段 |
| mcporter 找不到服务器 | 使用 `--config` 参数指定配置文件 |

## 文件结构

```
xhs-auto-post/
├── SKILL.md                  # 技能配置（本文件）
├── README.md                 # 使用说明
├── run.sh                    # 快速启动脚本
├── generate_images.py        # 图片生成脚本（可配置）
└── config.example.json       # 配置示例
```

**输出目录**：`~/xiaohongshu_post/`
- 生成的图片
- 文案内容
- 发布记录

## 许可证

MIT
