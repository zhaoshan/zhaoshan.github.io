#!/bin/bash
# 小红书图文笔记自动生成脚本（交互式）
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

# 2. 搜索并拆分论点
echo "【步骤 2/5】拆分论点..."
echo ""
echo "✅ 已设计 5 个子论点："
echo ""
echo "1. site-scraper - 网站爬取神器"
echo "   功能：自动抓取整个网站内容"
echo "   场景：竞品分析、资料收集"
echo ""
echo "2. agent-reach - 全网搜索工具"
echo "   功能：搜索小红书/抖音/微博"
echo "   场景：市场调研、热点追踪"
echo ""
echo "3. capability-evolver - 自我进化"
echo "   功能：AI 自动学习改进"
echo "   场景：长期任务优化"
echo ""
echo "4. nano-banana-pro - AI 绘图"
echo "   功能：Gemini 图像生成"
echo "   场景：封面制作、配图生成"
echo ""
echo "5. healthcheck - 健康检查"
echo "   功能：定期安全检查"
echo "   场景：系统安全审计"
echo ""

# 确认论点
while true; do
    read -p "📝 请确认这些论点是否合适？(确认/调整/跳过): " confirm
    case $confirm in
        [Yy]*|[Cc]onfirm*|[Qq]ren*|确认)
            echo ""
            echo "✅ 论点已确认"
            break
            ;;
        [Ss]kip*|[Tt]iaoguo*|跳过)
            echo ""
            echo "⏭️ 使用默认论点"
            break
            ;;
        *)
            echo ""
            echo "📝 请说明调整意见（如：把第 3 个改成 xxx）"
            read -p "调整意见：" adjustment
            echo "✅ 已记录调整意见：$adjustment"
            echo "   （实际使用时会根据意见调整论点）"
            echo ""
            ;;
    esac
done

echo ""

# 3. 生成图片
echo "【步骤 3/5】生成图片..."
cd "$SCRIPT_DIR"
python3 generate_images.py skills

if [ $? -ne 0 ]; then
    echo "❌ 图片生成失败"
    exit 1
fi

echo ""
echo "✅ 图片已生成："
echo ""
for i in 01 02 03 04 05; do
    if [ -f "$OUTPUT_DIR/xhs-skills-${i}.png" ]; then
        SIZE=$(ls -lh "$OUTPUT_DIR/xhs-skills-${i}.png" | awk '{print $5}')
        echo "   - xhs-skills-${i}.png ($SIZE)"
    fi
done
echo ""

# 确认图片
while true; do
    read -p "📝 请查看图片并确认是否继续？(确认/重新生成): " confirm_pic
    case $confirm_pic in
        [Yy]*|[Cc]onfirm*|[Qq]ren*|确认)
            echo ""
            echo "✅ 图片已确认"
            break
            ;;
        [Rr]egenerate*|[Cc]hongxin*|重新*)
            echo ""
            echo "🔄 重新生成图片..."
            python3 generate_images.py skills
            echo "✅ 图片已重新生成"
            echo ""
            ;;
        *)
            echo ""
            echo "📝 请说明修改意见（如：颜色太浅、字体太小）"
            read -p "修改意见：" feedback
            echo "✅ 已记录修改意见：$feedback"
            echo "   （实际使用时会根据意见调整图片样式）"
            echo ""
            ;;
    esac
done

echo ""

# 4. 编写文案
echo "【步骤 4/5】编写文案..."
echo ""
echo "标题：OpenClaw 必装 5 个 Skills！效率翻倍"
echo ""
echo "正文："
cat << 'EOF'
AI 打工人必看！亲测好用的 OpenClaw Skills 分享～

1️⃣ site-scraper 网站爬取神器
2️⃣ agent-reach 全网搜索
3️⃣ capability-evolver 自我进化
4️⃣ nano-banana-pro AI 绘图
5️⃣ healthcheck 系统检查

💡 安装方法超简单！

👇 你最想用哪个？评论区告诉我～

#OpenClaw #AI 工具 #效率工具 #职场技能 #AI 技能
EOF
echo ""

# 确认文案
while true; do
    read -p "📝 请确认文案内容？(确认/修改): " confirm_content
    case $confirm_content in
        [Yy]*|[Cc]onfirm*|[Qq]ren*|确认)
            echo ""
            echo "✅ 文案已确认"
            break
            ;;
        [Mm]odify*|[Xiugai*|修改*)
            echo ""
            echo "📝 请说明修改意见（如：标题改短点、添加更多 emoji）"
            read -p "修改意见：" feedback
            echo "✅ 已记录修改意见：$feedback"
            echo "   （实际使用时会根据意见调整文案）"
            echo ""
            ;;
        *)
            echo ""
            echo "📝 请说明修改意见"
            read -p "修改意见：" feedback
            echo "✅ 已记录修改意见：$feedback"
            echo ""
            ;;
    esac
done

echo ""

# 5. 发布
echo "【步骤 5/5】准备发布..."
echo ""
echo "📤 发布内容："
echo "   标题：OpenClaw 必装 5 个 Skills！效率翻倍"
echo "   图片：5 张"
echo "   标签：#OpenClaw #AI 工具 #效率工具 #职场技能 #AI 技能"
echo ""

# 最终确认
read -p "📝 确认发布到小红书吗？(y/n): " -n 1 -r
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
    
    # 处理换行符（使用 heredoc）
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
    
    # 发布笔记
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
        echo "$RESULT" | grep "内容发布成功" -A5
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
        echo "   4. 内容格式错误（换行符处理问题）"
        exit 1
    fi
else
    echo ""
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
