#!/bin/bash
# 网站链接自动爬取脚本
# 用法：./crawl-website.sh <url> [output_dir]

set -e

URL="${1:-}"
OUTPUT_DIR="${2:-./crawl-results-$(date +%Y%m%d-%H%M%S)}"

if [ -z "$URL" ]; then
  echo "用法：$0 <url> [output_dir]"
  echo "示例：$0 https://www.tokyostarbank.co.jp/"
  exit 1
fi

echo "🔍 开始爬取网站：$URL"
echo "📁 输出目录：$OUTPUT_DIR"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 记录开始时间
START_TIME=$(date +%s)

# 1. 打开网站
echo " 步骤 1/5: 打开网站..."
openclaw browser action=open targetUrl="$URL" profile="openclaw"
sleep 5

# 2. 获取页面快照
echo "📸 步骤 2/5: 获取页面元素快照..."
openclaw browser action=snapshot refs="aria" 2>&1 | tee "$OUTPUT_DIR/snapshot.txt"
sleep 2

# 3. 提取所有链接
echo "🔗 步骤 3/5: 提取所有链接..."
LINKS_JSON=$(openclaw browser action=act kind=evaluate 'fn' '() => {
  const links = [];
  document.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if(href && href !== "#" && !href.startsWith("javascript:") && !href.startsWith("mailto:")) {
      let abs = href.startsWith("http") ? href : new URL(href, window.location.href).href;
      links.push({
        text: (a.textContent || "").trim().substring(0, 200),
        href: abs,
        target: a.target || "_self"
      });
    }
  });
  return JSON.stringify({
    url: window.location.href,
    timestamp: new Date().toISOString(),
    total: links.length,
    links: links
  }, null, 2);
}' 2>/dev/null || echo '{"error": "failed to evaluate"}')

echo "$LINKS_JSON" > "$OUTPUT_DIR/links.json"

# 4. 提取所有按钮和交互元素
echo "🔘 步骤 4/5: 提取按钮和交互元素..."
INTERACTIVE_JSON=$(openclaw browser action=act kind=evaluate 'fn' '() => {
  const buttons = [];
  document.querySelectorAll("button, input[type=button], input[type=submit], [role=button]").forEach(el => {
    buttons.push({
      tag: el.tagName,
      text: (el.textContent || el.value || "").trim().substring(0, 200),
      id: el.id || null,
      class: el.className || null
    });
  });
  
  const forms = [];
  document.querySelectorAll("form").forEach((form, i) => {
    forms.push({
      id: form.id || "form-" + i,
      action: form.action,
      method: form.method || "GET",
      inputs: form.querySelectorAll("input, select, textarea").length
    });
  });
  
  return JSON.stringify({
    buttons: buttons,
    forms: forms,
    totalInteractive: buttons.length + forms.length
  }, null, 2);
}' 2>/dev/null || echo '{"error": "failed to evaluate"}')

echo "$INTERACTIVE_JSON" > "$OUTPUT_DIR/interactive.json"

# 5. 生成汇总报告
echo " 步骤 5/5: 生成汇总报告..."

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 统计链接数量
TOTAL_LINKS=$(echo "$LINKS_JSON" | grep -o '"total":' | head -1 | cut -d':' -f2 | tr -d ' ,' || echo "0")

cat > "$OUTPUT_DIR/README.md" << EOF
# 网站爬取结果

**URL:** $URL
**时间:** $(date '+%Y-%m-%d %H:%M:%S')
**耗时:** ${DURATION}秒

## 统计

- 总链接数：$TOTAL_LINKS
- 快照文件：snapshot.txt
- 链接详情：links.json
- 交互元素：interactive.json

## 文件说明

| 文件 | 说明 |
|------|------|
| snapshot.txt | 页面元素快照（ARIA refs） |
| links.json | 所有链接的详细信息 |
| interactive.json | 按钮、表单等交互元素 |
| README.md | 本说明文件 |

## 下一步

1. 查看 links.json 获取所有链接地址
2. 使用 snapshot.txt 中的 ref 进行点击测试
3. 需要深度爬取可修改 crawl-links.js

EOF

echo ""
echo "=============================================="
echo "✅ 爬取完成！"
echo "=============================================="
echo ""
echo " 统计信息:"
echo "   总链接数：$TOTAL_LINKS"
echo "   耗时：${DURATION}秒"
echo ""
echo "📁 输出文件:"
echo "   $OUTPUT_DIR/snapshot.txt"
echo "   $OUTPUT_DIR/links.json"
echo "   $OUTPUT_DIR/interactive.json"
echo "   $OUTPUT_DIR/README.md"
echo ""
echo "💡 提示:"
echo "   - 查看链接：cat $OUTPUT_DIR/links.json | jq '.links[]'"
echo "   - 点击元素：openclaw browser action=act ref=<ref> kind=click"
echo ""
