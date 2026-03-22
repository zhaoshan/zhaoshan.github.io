#!/bin/bash
# 小红书图文笔记自动生成脚本
# 用法：./run.sh "主题"

THEME="${1:-AI 工具推荐}"

echo "🎨 开始生成小红书笔记：$THEME"
echo ""

# 1. 检查环境
echo "【步骤 1/5】检查环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

if ! python3 -c "from PIL import Image" 2>/dev/null; then
    echo "❌ PIL 未安装，运行：pip3 install Pillow"
    exit 1
fi

if ! curl -s http://localhost:18060/mcp > /dev/null 2>&1; then
    echo "⚠️  小红书 MCP 服务未运行"
    echo "   运行：~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp"
fi

echo "✅ 环境检查完成"
echo ""

# 2. 生成图片
echo "【步骤 2/5】生成图片..."
cd /Users/zhaoshan/.openclaw/workspace
python3 generate-xhs-images-final.py

if [ $? -ne 0 ]; then
    echo "❌ 图片生成失败"
    exit 1
fi

echo ""
echo "✅ 图片已生成："
ls -lh xhs-skill-*-final.png
echo ""

# 3. 显示文案
echo "【步骤 3/5】笔记文案："
echo ""
echo "标题：🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨"
echo ""
echo "正文："
cat << 'EOF'
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

用了 3 个月 OpenClaw，这 5 个 Skills 真的离不开！
安装后 AI 能力直接翻倍，强烈建议收藏～

1️⃣ site-scraper 网站爬取神器
一键抓取整个网站内容
自动下载所有图片和 PDF

2️⃣ agent-reach 全网搜索
直接搜小红书、抖音、微博
不用手动翻 App 了

3️⃣ capability-evolver 自我进化
AI 会自动学习改进
越用越聪明

4️⃣ nano-banana-pro AI 绘图
Gemini 图像生成
做封面、配图超好用

5️⃣ healthcheck 系统检查
定期检查安全
自动审计配置

💡 安装方法：
1. 下载 Skills 文件
2. 复制到 ~/.openclaw/workspace/skills/
3. 重启会话

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具 #职场技能 #AI 技能 #自动化 #打工人 #技能推荐 #AI 助手 #2026 推荐
EOF
echo ""

# 4. 提示发布
echo "【步骤 4/5】准备发布..."
echo ""
echo "图片文件："
for i in 01 02 03 04 05; do
    echo "  - xhs-skill-${i}-final.png"
done
echo ""

# 5. 等待确认
echo "【步骤 5/5】请确认发布"
echo ""
read -p "确认发布吗？(y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📤 正在发布..."
    
    # 调用 MCP 发布（需要配置好小红书 MCP）
    # mcporter call 'xiaohongshu.publish_note' '{...}'
    
    echo "✅ 发布命令已准备，请手动执行或使用 MCP 工具发布"
    echo ""
    echo "发布命令："
    echo "mcporter call 'xiaohongshu.publish_note' '{"
    echo "  \"title\": \"🚀OpenClaw 必装的 5 个 Skills！效率翻倍✨\","
    echo "  \"content\": \"AI 打工人必看！...（完整正文）\","
    echo "  \"images\": ["
    echo "    \"/Users/zhaoshan/.openclaw/workspace/xhs-skill-01-final.png\","
    echo "    \"/Users/zhaoshan/.openclaw/workspace/xhs-skill-02-final.png\","
    echo "    \"/Users/zhaoshan/.openclaw/workspace/xhs-skill-03-final.png\","
    echo "    \"/Users/zhaoshan/.openclaw/workspace/xhs-skill-04-final.png\","
    echo "    \"/Users/zhaoshan/.openclaw/workspace/xhs-skill-05-final.png\""
    echo "  ],"
    echo "  \"topics\": [\"OpenClaw\", \"AI 工具\", \"效率工具\", \"职场技能\", \"AI 技能\"]"
    echo "}'"
else
    echo "❌ 已取消发布"
fi

echo ""
echo "================================"
echo "✅ 流程完成！"
echo "================================"
