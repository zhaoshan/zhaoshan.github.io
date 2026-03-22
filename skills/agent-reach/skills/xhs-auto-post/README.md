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

## 图片生成

### 脚本位置

```
skills/agent-reach/skills/xhs-auto-post/generate_images.py
```

### 使用方法

```bash
# 1. 使用默认配置（Skills 主题）
python3 generate_images.py skills

# 2. 使用其他预设主题（如 AI 工具推荐）
python3 generate_images.py tools

# 3. 使用自定义配置文件
python3 generate_images.py config.json

# 4. 查看可用主题
python3 generate_images.py unknown_theme
```

### 预设主题

| 主题 | 说明 | 命令 |
|------|------|------|
| `skills` | OpenClaw 必装 Skills | `python3 generate_images.py skills` |
| `tools` | AI 工具推荐 | `python3 generate_images.py tools` |

### 自定义配置

**方式 1：编辑配置文件**

复制示例配置并修改：
```bash
cp config.example.json my-config.json
# 编辑 my-config.json
python3 generate_images.py my-config.json
```

**方式 2：修改代码中的 THEMES 字典**

编辑 `generate_images.py`，在 `THEMES` 字典中添加新主题：
```python
THEMES = {
    "my_theme": {
        "title": "我的主题",
        "items": [
            {
                "num": "01",
                "name": "tool-1",
                "name_cn": "工具一",
                "func": "功能描述",
                "features": ["特点 1", "特点 2", "特点 3"],
                "scenes": ["场景 1", "场景 2", "场景 3"],
                "colors": ["#667eea", "#764ba2"]
            }
        ]
    }
}
```

**方式 3：命令行参数**
```bash
python3 generate_images.py "主题名称"
```

### 配置项说明

```json
{
  "output_dir": "/path/to/output",    // 输出目录
  "width": 1080,                       // 图片宽度
  "height": 1400,                      // 图片高度
  "card_margin": 40,                   // 卡片边距
  "card_radius": 30,                   // 卡片圆角
  "content_padding": 50,               // 内容内边距
  "fonts": {                           // 字体配置
    "size_120": "/path/to/font.ttf",
    "size_56": "/path/to/font.ttf",
    ...
  },
  "layout": {                          // 布局配置
    "num_y_offset": 0,                 // 序号 Y 偏移
    "title_y_offset": 140,             // 标题 Y 偏移
    "name_y_offset": 70,               // 技能名 Y 偏移
    "feature_spacing": 25,             // 功能块间距
    "line_height": 38                  // 行高
  },
  "style": {                           // 样式配置
    "bg_color": [243, 243, 243],       // 背景颜色 RGB
    "feature_bg": [248, 249, 250],     // 功能块背景
    "title_color": "#333333",          // 标题颜色
    "content_color": "#666666",        // 内容颜色
    "footer_color": "#999999",         // 底部颜色
    "divider_color": "#eeeeee"         // 分隔线颜色
  }
}
```

## 示例输出

### 生成的图片

5 张精美图片，每张对应一个子论点：
- `xhs-skills-01.png` - 论点 1
- `xhs-skills-02.png` - 论点 2
- `xhs-skills-03.png` - 论点 3
- `xhs-skills-04.png` - 论点 4
- `xhs-skills-05.png` - 论点 5

### 生成的文案

```markdown
标题：OpenClaw 必装 5 个 Skills！效率翻倍

正文：
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

1️⃣ site-scraper 网站爬取神器
2️⃣ agent-reach 全网搜索
3️⃣ capability-evolver 自我进化
4️⃣ nano-banana-pro AI 绘图
5️⃣ healthcheck 健康检查

💡 安装方法超简单！

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具 #职场技能
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
```bash
# 检查服务状态
curl http://localhost:18060/mcp

# 如未运行，启动服务
~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp
```

### 4. 已登录小红书账号
- 配置 Cookie 或扫码登录

### 5. mcporter 已配置
```bash
# 检查配置
cat ~/.openclaw/workspace/config/mcporter.json

# 测试连接
mcporter --config ~/.openclaw/workspace/config/mcporter.json list
```

## 自定义配置

### 修改图片样式

编辑 `generate_images.py`：
- 调整配色方案（colors 数组）
- 修改字体大小（fonts 配置）
- 调整布局间距（layout 配置）

### 添加新主题

在 `generate_images.py` 的 `THEMES` 字典中添加：
```python
THEMES = {
    "my_theme": {
        "title": "我的主题",
        "items": [...]
    }
}
```

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

### 内容规范

⚠️ **标题限制**
- 不超过 20 个字符
- 避免过多 emoji（最多 2 个）
- 包含关键词吸引点击

⚠️ **发布前必须确认**
- 笔记发布后无法删除
- 仔细检查文案和图片

⚠️ **内容合规**
- 避免敏感话题
- 确保图片无版权问题
- 遵守小红书社区规范

### 账号安全

⚠️ **Cookie 安全**
- Cookie 定期更新（有效期约 7-30 天）
- 不要分享 Cookie 文件
- 使用专用账号进行自动化操作

⚠️ **发布频率**
- 避免短时间大量发布
- 建议间隔 1 小时以上
- 模拟真实用户行为

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| PIL 未安装 | `pip3 install Pillow` |
| MCP 服务未运行 | 运行 `xiaohongshu-mcp` |
| 未登录 | 配置 Cookie 或重新扫码登录 |
| 图片生成失败 | 检查字体文件是否存在 |
| 发布失败 - 标题长度 | 缩短标题到 20 字符以内 |
| 发布失败 - 参数格式 | 使用 JSON 数组格式传递 images 和 tags |
| 发布失败 - 未知工具 | 确认工具名称为 `publish_content` |
| Cookie 格式错误 | 使用数组格式保存 Cookie |
| Cookie 缺少字段 | 确保包含 `web_session` 等关键字段 |
| mcporter 找不到服务器 | 使用 `--config` 参数指定配置文件 |

### 详细故障排查

#### Cookie 相关问题

**问题 1：Cookie 格式错误**
```
failed to unmarshal cookies: json: cannot unmarshal object into Go value of type []*proto.NetworkCookie
```

**解决方案**：使用数组格式
```json
[
  {"name": "web_session", "value": "...", "domain": ".xiaohongshu.com", "path": "/"}
]
```

**问题 2：Cookie 缺少 web_session**
```
❌ 未登录
```

**解决方案**：从浏览器重新导出完整 Cookie，确保包含 `web_session`

#### 发布相关问题

**问题 3：标题长度超限**
```
发布失败：标题长度超过限制
```

**解决方案**：标题控制在 20 字符以内

**问题 4：参数格式错误**
```
MCP error -32602: invalid params: unexpected additional properties ["images.0" ...]
```

**解决方案**：使用 JSON 数组格式
```bash
images='["/path/to/img1.png","/path/to/img2.png"]'
```

**问题 5：未知工具名称**
```
MCP error -32602: unknown tool "publish_note"
```

**解决方案**：正确的工具名称是 `publish_content`

## 文件结构

```
xhs-auto-post/
├── SKILL.md                  # 技能配置（完整流程说明）
├── README.md                 # 使用说明（本文件）
├── run.sh                    # 快速启动脚本
├── generate_images.py        # 图片生成脚本（可配置）
└── config.example.json       # 配置示例
```

**输出目录**：`~/xiaohongshu_post/`
- 生成的图片
- 文案内容
- 发布记录

## 最佳实践

### 标题优化

✅ **好的标题**：
- `OpenClaw 必装 5 个 Skills！效率翻倍`
- `AI 打工人必备！这 5 个技能太香了`
- `效率翻倍！OpenClaw Skills 推荐`

❌ **避免的标题**：
- `🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨`（太长，emoji 太多）
- `推荐几个很好用的 OpenClaw Skills 给大家`（太平淡）

### 文案优化

✅ **好的文案**：
- 分点说明，清晰易读
- 使用 emoji 点缀（每段 1-2 个）
- 包含互动引导（"评论区告诉我"）
- 标签精准（5-10 个）

❌ **避免的文案**：
- 大段文字，没有分段
- emoji 过多或过少
- 没有互动引导
- 标签太多或太少

### 图片优化

✅ **好的图片**：
- 1080x1400 比例（3:4）
- 渐变背景 + 白色卡片
- 文字清晰可读
- 配色协调

❌ **避免的图片**：
- 尺寸不对
- 文字太小
- 配色杂乱
- 内容过多

## 许可证

MIT
