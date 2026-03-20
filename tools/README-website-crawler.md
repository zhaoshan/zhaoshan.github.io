# 网站链接爬取工具

自动模拟点击网站所有可交互组件，提取链接地址。

## 📦 工具列表

### 1. `crawl-links.js` - Puppeteer 版本（独立运行）
完整的网站爬虫，可递归遍历多层页面。

**安装依赖：**
```bash
npm install puppeteer
```

**使用：**
```bash
node tools/crawl-links.js https://example.com
```

**配置选项：**
- `maxDepth`: 最大递归深度（默认 2）
- `timeout`: 超时时间（默认 30000ms）
- `simulateClick`: 是否模拟点击（默认 true）

---

### 2. `extract-links-openclaw.js` - OpenClaw 版本
使用 OpenClaw 内置 browser 工具，无需额外依赖。

**使用：**
```bash
node tools/extract-links-openclaw.js https://example.com
```

---

### 3. 直接使用 OpenClaw browser 命令

**步骤 1：打开网站**
```bash
openclaw browser action=open targetUrl="https://example.com"
```

**步骤 2：获取元素快照**
```bash
openclaw browser action=snapshot refs="aria"
```

**步骤 3：点击元素**
```bash
openclaw browser action=act ref=<element_ref> kind=click
```

**步骤 4：获取新页面链接**
```bash
openclaw browser action=act kind=evaluate fn="() => document.querySelectorAll('a[href]').length"
```

---

##  完整自动化脚本

创建 `crawl-website.sh`：

```bash
#!/bin/bash
URL=$1
OUTPUT_DIR="./crawl-results-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$OUTPUT_DIR"

echo "🔍 开始爬取：$URL"
echo "📁 输出目录：$OUTPUT_DIR"

# 打开网站
openclaw browser action=open targetUrl="$URL"
sleep 3

# 获取快照
SNAPSHOT=$(openclaw browser action=snapshot refs="aria")
echo "$SNAPSHOT" > "$OUTPUT_DIR/snapshot.json"

# 提取所有链接
LINKS=$(openclaw browser action=act kind=evaluate fn="() => {
  const links = [];
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if(href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({
        text: (a.textContent||'').trim(),
        href: href.startsWith('http') ? href : new URL(href, window.location.href).href
      });
    }
  });
  return JSON.stringify(links, null, 2);
}")

echo "$LINKS" > "$OUTPUT_DIR/links.json"

echo ""
echo "✅ 爬取完成！"
echo "📊 链接数量：$(echo $LINKS | jq '.length')"
echo " 结果保存在：$OUTPUT_DIR"
```

**使用：**
```bash
chmod +x crawl-website.sh
./crawl-website.sh https://example.com
```

---

## 📋 输出示例

```json
{
  "url": "https://example.com",
  "timestamp": "2026-03-20T14:00:00Z",
  "totalLinks": 156,
  "visitedPages": 23,
  "interactiveElements": 89,
  "links": [
    {
      "text": "产品与服务",
      "href": "https://example.com/products"
    },
    {
      "text": "关于我们",
      "href": "https://example.com/about"
    }
  ]
}
```

---

## ⚠️ 注意事项

1. **礼貌爬取** - 添加延迟，避免频繁请求
2. **遵守 robots.txt** - 检查网站的爬虫规则
3. **登录限制** - 需要登录的页面无法访问
4. **JavaScript 渲染** - 动态加载的内容需要等待
5. **反爬虫机制** - 某些网站可能阻止自动化访问

---

## 🎯 针对银行网站的特殊处理

银行网站通常有：
- 复杂的导航菜单
- 弹出窗口
- 会话超时
- 安全验证

**建议配置：**
```javascript
{
  maxDepth: 3,           // 不要爬太深
  timeout: 60000,        // 更长超时
  waitForNetwork: true,  // 等待网络请求完成
  simulateClick: true    // 模拟真实点击
}
```

---

*最后更新：2026-03-20*
