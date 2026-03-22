---
name: xhs-auto-post
description: |
  小红书图文笔记自动生成与发布。根据用户提供的主题，自动搜索信息、拆分论点、生成图片、编写文案并发布到小红书。
  当用户要求发小红书笔记、生成图文内容、根据主题写笔记、自动化发布小红书时使用。
---

你是小红书图文笔记自动生成助手。根据用户提供的主题，按以下流程生成并发布笔记。

## 完整流程

```
用户主题 → 搜索扩展 → 拆分论点 → 生成图片 → 编写文案 → 用户确认 → 发布笔记
```

---

## 步骤 1：搜索扩展核心信息

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

---

## 步骤 2：拆分子观点/论点

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

---

## 步骤 3：生成图片

**目标**：为每个子论点生成一张精美的图片。

**操作**：
1. 调用图片生成脚本
2. 每个论点生成一张 1080x1400 的 PNG 图片
3. 使用渐变背景 + 白色卡片布局

**图片生成代码**：
```python
#!/usr/bin/env python3
"""小红书图片生成器"""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = "/Users/zhaoshan/.openclaw/workspace"
WIDTH, HEIGHT = 1080, 1400

# 字体配置
try:
    FONT_120 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 120)
    FONT_56 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 56)
    FONT_48 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 48)
    FONT_BOLD_48 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 48)
    FONT_36 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 36)
    FONT_32 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 32)
    FONT_28 = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 28)
except:
    FONT_120 = FONT_56 = FONT_48 = FONT_BOLD_48 = FONT_36 = FONT_32 = FONT_28 = ImageFont.load_default()

# Skills 数据
skills_data = [
    {"id": "01", "num": "01", "name": "site-scraper", "name_cn": "网站爬取", "func": "网站内容爬取", "features": ["自动抓取整个网站", "下载所有图片和 PDF", "支持递归爬取"], "scenes": ["竞品分析", "资料收集", "市场调研"], "colors": ["#667eea", "#764ba2"]},
    {"id": "02", "num": "02", "name": "agent-reach", "name_cn": "全网搜索", "func": "全网内容搜索", "features": ["搜索小红书/抖音/微博", "无需手动翻 App", "AI 帮你找内容"], "scenes": ["市场调研", "竞品分析", "热点追踪"], "colors": ["#f093fb", "#f5576c"]},
    {"id": "03", "num": "03", "name": "capability-evolver", "name_cn": "自我进化", "func": "Agent 自我进化", "features": ["AI 自动学习改进", "越用越聪明", "无需手动调教"], "scenes": ["长期任务优化", "个性化适配", "持续提升"], "colors": ["#11998e", "#38ef7d"]},
    {"id": "04", "num": "04", "name": "nano-banana-pro", "name_cn": "AI 绘图", "func": "AI 图片生成", "features": ["Gemini 图像生成", "文生图/图生图", "高质量输出"], "scenes": ["封面制作", "配图生成", "素材创作"], "colors": ["#f7971e", "#ffd200"]},
    {"id": "05", "num": "05", "name": "healthcheck", "name_cn": "健康检查", "func": "系统健康检查", "features": ["定期安全检查", "自动审计配置", "风险预警"], "scenes": ["系统安全审计", "配置优化建议", "避免踩坑"], "colors": ["#4facfe", "#00f2fe"]}
]

def draw_gradient(draw, colors):
    for y in range(HEIGHT):
        r = int(colors[0][1:3], 16) + (int(colors[1][1:3], 16) - int(colors[0][1:3], 16)) * y // HEIGHT
        g = int(colors[0][3:5], 16) + (int(colors[1][3:5], 16) - int(colors[0][3:5], 16)) * y // HEIGHT
        b = int(colors[0][5:7], 16) + (int(colors[1][5:7], 16) - int(colors[0][5:7], 16)) * y // HEIGHT
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

def draw_text_centered(draw, text, y, font, color):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (WIDTH - text_width) // 2
    draw.text((x, y), text, fill=color, font=font)
    return text_height

def generate_skill_card(data):
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)
    
    # 渐变背景
    draw_gradient(draw, data["colors"])
    
    # 白色卡片背景
    card_margin = 40
    card_radius = 30
    draw.rounded_rectangle([(card_margin, card_margin), (WIDTH - card_margin, HEIGHT - card_margin)], radius=card_radius, fill=(243, 243, 243))
    
    # 内容区域
    content_padding = 50
    content_left = card_margin + content_padding
    content_right = WIDTH - card_margin - content_padding
    content_top = card_margin + content_padding
    
    # 序号
    num_y = content_top
    draw_text_centered(draw, data["num"], num_y, FONT_120, data["colors"][0])
    
    # 标题
    h1_y = num_y + 140
    draw_text_centered(draw, "必装 Skills", h1_y, FONT_56, "#333333")
    
    # 技能名（背景色块）
    skill_name_y = h1_y + 70
    name_text = f"{data['name_cn']} {data['name']}"
    bbox = draw.textbbox((0, 0), name_text, font=FONT_BOLD_48)
    skill_name_width = bbox[2] - bbox[0]
    skill_name_height = bbox[3] - bbox[1]
    skill_name_x = (WIDTH - skill_name_width) // 2
    
    draw.rounded_rectangle(
        [(skill_name_x - 40, skill_name_y), (skill_name_x + skill_name_width + 40, skill_name_y + skill_name_height + 40)],
        radius=15,
        fill=data["colors"][0]
    )
    draw_text_centered(draw, name_text, skill_name_y + 20, FONT_BOLD_48, "white")
    
    # 功能块
    feature_y = skill_name_y + skill_name_height + 40 + 50
    feature_y = draw_feature_block(draw, content_left, feature_y, "功能", data["func"], data["colors"][0])
    
    # 特点块
    features_y = feature_y + 25
    features_y = draw_feature_block(draw, content_left, features_y, "特点", data["features"], data["colors"][0], is_list=True)
    
    # 场景块
    scenes_y = features_y + 25
    scenes_y = draw_feature_block(draw, content_left, scenes_y, "场景", data["scenes"], data["colors"][0], is_list=True)
    
    # 底部
    footer_y = HEIGHT - card_margin - 60
    draw.line([(content_left, footer_y - 15), (content_right, footer_y - 15)], fill="#eeeeee", width=2)
    draw_text_centered(draw, "OpenClaw Skills 系列 · 效率翻倍", footer_y, FONT_28, "#999999")
    
    return img

def draw_feature_block(draw, x, y, title, content, color, is_list=False):
    """绘制功能块 - 返回底部 Y 坐标"""
    if is_list:
        num_lines = len(content)
        block_height = 50 + 36 + 10 + num_lines * 38
    else:
        block_height = 50 + 36 + 10 + 38
    
    block_width = WIDTH - 2 * (x + 30)
    draw.rounded_rectangle([(x, y), (x + block_width, y + block_height)], radius=15, fill=(248, 249, 250))
    draw.rectangle([(x, y), (x + 5, y + block_height)], fill=color)
    
    draw.text((x + 30, y + 25), title, fill="#333333", font=FONT_BOLD_48)
    
    content_y = y + 25 + 48 + 15
    if is_list:
        for i, line in enumerate(content):
            draw.text((x + 30, content_y + i * 38), line, fill="#666666", font=FONT_32)
    else:
        draw.text((x + 30, content_y), content, fill="#666666", font=FONT_32)
    
    return y + block_height

def main():
    for data in skills_data:
        skill_id = data["id"]
        output_path = os.path.join(OUTPUT_DIR, f"xhs-skill-{skill_id}-final.png")
        img = generate_skill_card(data)
        img.save(output_path, "PNG", quality=95)
        print(f"✅ 已生成：{output_path}")

if __name__ == "__main__":
    main()
```

**执行命令**：
```bash
cd /Users/zhaoshan/.openclaw/workspace
python3 generate-xhs-images-final.py
```

**输出**：5 张 PNG 图片（`xhs-skill-01-final.png` 到 `xhs-skill-05-final.png`）

---

## 步骤 4：编写文案

**目标**：编写小红书风格的笔记文案。

**操作**：
1. 编写标题（吸引眼球 + emoji）
2. 编写正文（分点说明 + emoji 点缀）
3. 添加互动引导
4. 添加话题标签（5-10 个）

**文案示例**：
```
标题：🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨

正文：
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

用了 3 个月 OpenClaw，这 5 个 Skills 真的离不开！
安装后 AI 能力直接翻倍，强烈建议收藏～

1️⃣ site-scraper 网站爬取神器
一键抓取整个网站内容
自动下载所有图片和 PDF
做竞品分析、资料收集超方便

2️⃣ agent-reach 全网搜索
直接搜小红书、抖音、微博
不用手动翻 App 了
AI 直接帮你找内容

3️⃣ capability-evolver 自我进化
AI 会自动学习改进
越用越聪明
不用手动调教

4️⃣ nano-banana-pro AI 绘图
Gemini 图像生成
做封面、配图超好用

5️⃣ healthcheck 系统检查
定期检查安全
自动审计配置
避免踩坑

💡 安装方法超简单：
1. 下载 Skills 文件
2. 复制到 ~/.openclaw/workspace/skills/
3. 重启会话
5 分钟搞定！

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具 #职场技能 #AI 技能 #自动化 #打工人 #技能推荐 #AI 助手 #2026 推荐
```

---

## 步骤 5：用户确认后发布

**目标**：发布前让用户确认内容。

**操作**：
1. 展示完整笔记内容给用户：
   - 标题
   - 正文
   - 图片列表（5 张）
   - 话题标签
2. 询问用户是否确认发布
3. 用户确认后调用发布工具

**确认话术**：
```
📝 笔记内容已准备好，请确认：

标题：🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨

正文：
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～
...（完整正文）

图片：
- xhs-skill-01-final.png
- xhs-skill-02-final.png
- xhs-skill-03-final.png
- xhs-skill-04-final.png
- xhs-skill-05-final.png

话题：#OpenClaw #AI 工具 #效率工具 ...

确认发布吗？回复"确认"或"发布"即可。
```

**发布命令**：
```bash
# 使用小红书 MCP 发布
mcporter call 'xiaohongshu.publish_note' '{
  "title": "🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨",
  "content": "正文内容...",
  "images": [
    "/Users/zhaoshan/.openclaw/workspace/xhs-skill-01-final.png",
    "/Users/zhaoshan/.openclaw/workspace/xhs-skill-02-final.png",
    "/Users/zhaoshan/.openclaw/workspace/xhs-skill-03-final.png",
    "/Users/zhaoshan/.openclaw/workspace/xhs-skill-04-final.png",
    "/Users/zhaoshan/.openclaw/workspace/xhs-skill-05-final.png"
  ],
  "topics": ["OpenClaw", "AI 工具", "效率工具", "职场技能", "AI 技能"]
}'
```

---

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
- xhs-skill-01-final.png
- xhs-skill-02-final.png
- xhs-skill-03-final.png
- xhs-skill-04-final.png
- xhs-skill-05-final.png

【步骤 4/5】正在编写文案...
✅ 笔记内容已准备好

【步骤 5/5】请确认发布：

标题：🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨

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

笔记链接：https://www.xiaohongshu.com/explore/xxx
发布时间：2026-03-22 19:50

需要我帮你查看发布效果或继续发布其他内容吗？
```

---

## 前置检查

执行前先检查：
1. **小红书 MCP 服务是否运行** - `curl http://localhost:18060/mcp`
2. **是否已登录** - `mcporter call 'xiaohongshu.check_login_status'`
3. **Python 图片库是否安装** - `python3 -c "from PIL import Image"`

如未就绪，引导用户先完成配置。

---

## 工具依赖

| 功能 | 工具 |
|------|------|
| 信息搜索 | `web_search`, `xhs-search` |
| 图片生成 | Python PIL + 生成脚本 |
| 发布笔记 | `mcporter call 'xiaohongshu.publish_note'` |
| 登录检查 | `mcporter call 'xiaohongshu.check_login_status'` |

---

## 注意事项

1. **发布前必须用户确认** - 笔记发布后无法删除
2. **图片合规** - 确保图片无版权问题
3. **文案风格** - 符合小红书调性（emoji、口语化、互动引导）
4. **标签数量** - 5-10 个话题标签为宜
5. **发布频率** - 避免短时间内大量发布

---

## 失败处理

| 场景 | 处理 |
|------|------|
| MCP 服务未运行 | 引导运行 `~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp` |
| 未登录 | 引导配置 Cookie 或重新扫码登录 |
| 图片生成失败 | 检查 Python PIL 是否安装 |
| 发布失败 | 检查 Cookie 是否过期 |
