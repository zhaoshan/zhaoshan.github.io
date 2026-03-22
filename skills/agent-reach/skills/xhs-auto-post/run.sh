#!/bin/bash
# 小红书图文笔记自动生成脚本
# 用法：./run.sh "主题"

set -e

THEME="${1:-AI 工具推荐}"
OUTPUT_DIR=~/xiaohongshu_post
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
    echo "   运行：~/.agent-reach/tools/xiaohongshu-mcp/xiaohongshu-mcp &"
fi

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "✅ 环境检查完成"
echo ""

# 2. 生成图片
echo "【步骤 2/5】生成图片..."
cd "$SCRIPT_DIR"
python3 generate_images.py skills

if [ $? -ne 0 ]; then
    echo "❌ 图片生成失败"
    exit 1
fi

echo ""
echo "✅ 图片已生成："
ls -lh $OUTPUT_DIR/xhs-skills-*.png 2>/dev/null || echo "   （图片在 $OUTPUT_DIR 目录）"
echo ""

# 3. 显示文案
echo "【步骤 3/5】笔记文案："
echo ""
echo "标题：OpenClaw 必装 5 个 Skills！效率翻倍"
echo ""
echo "正文："
cat << 'EOF'
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

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

#OpenClaw #AI 工具 #效率工具 #职场技能 #AI 技能
EOF
echo ""

# 4. 提示发布
echo "【步骤 4/5】准备发布..."
echo ""
echo "图片文件："
for i in 01 02 03 04 05; do
    echo "  - $OUTPUT_DIR/xhs-skills-${i}.png"
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
    
    # 检查 mcporter 配置
    if [ ! -f ~/.openclaw/workspace/config/mcporter.json ]; then
        echo "❌ mcporter 配置文件不存在"
        echo "   请先配置：~/.openclaw/workspace/config/mcporter.json"
        exit 1
    fi
    
    # 检查登录状态
    LOGIN_STATUS=$(mcporter --config ~/.openclaw/workspace/config/mcporter.json call xiaohongshu.check_login_status 2>&1)
    if echo "$LOGIN_STATUS" | grep -q "未登录"; then
        echo "❌ 小红书未登录"
        echo "   请先配置 Cookie 或扫码登录"
        exit 1
    fi
    
    # 发布笔记
    echo "📤 调用发布接口..."
    
    # 处理换行符（将 \n 转换为实际换行）
    CONTENT=$(cat << 'CONTENTEOF'
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

1️⃣ site-scraper 网站爬取神器
2️⃣ agent-reach 全网搜索
3️⃣ capability-evolver 自我进化
4️⃣ nano-banana-pro AI 绘图
5️⃣ healthcheck 系统检查

💡 安装方法简单！

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具
CONTENTEOF
)
    
    RESULT=$(mcporter --config ~/.openclaw/workspace/config/mcporter.json call xiaohongshu.publish_content \
      title='OpenClaw 必装 5 个 Skills！效率翻倍' \
      content="$CONTENT" \
      images='["'"$OUTPUT_DIR"'/xhs-skills-01.png","'"$OUTPUT_DIR"'/xhs-skills-02.png","'"$OUTPUT_DIR"'/xhs-skills-03.png","'"$OUTPUT_DIR"'/xhs-skills-04.png","'"$OUTPUT_DIR"'/xhs-skills-05.png"]' \
      tags='["OpenClaw","AI 工具","效率工具","职场技能","AI 技能"]' \
      2>&1)
    
    if echo "$RESULT" | grep -q "发布成功"; then
        echo ""
        echo "✅ 发布成功！"
        echo ""
        echo "$RESULT"
        echo ""
        echo "📱 可以上小红书查看笔记了！"
    else
        echo ""
        echo "❌ 发布失败"
        echo "$RESULT"
        echo ""
        echo "💡 常见问题："
        echo "   1. 标题长度超过限制（需≤20 字符）"
        echo "   2. Cookie 过期（需重新配置）"
        echo "   3. 图片路径错误（检查文件是否存在）"
        exit 1
    fi
else
    echo "❌ 已取消发布"
    echo ""
    echo "💡 你可以稍后手动发布："
    echo "   1. 打开小红书 App 或官网"
    echo "   2. 上传 $OUTPUT_DIR 中的 5 张图片"
    echo "   3. 复制上面的文案"
    echo "   4. 发布"
fi

echo ""
echo "================================"
echo "✅ 流程完成！"
echo "================================"
echo ""
echo "📁 输出目录：$OUTPUT_DIR"
echo "📝 文案已保存在：$OUTPUT_DIR/post-content.md"
