# Site Scraper Skill

网站内容爬取工具 - 完整页面抓取、Markdown 转换、资源下载

## 功能

1. **页面抓取** - 接收 URL，获取完整页面内容
2. **Markdown 转换** - 页面转 Markdown，保留所有图片
3. **链接提取** - 生成 JSON，包含所有链接（网页/PDF/Office）
4. **文档下载** - 下载 PDF/Office 文档到 attachments 目录
5. **递归爬取** - 遍历所有普通网页链接，循环执行 1-4 步

## 使用方法

```bash
node site-scraper.js <url> [options]
```

### 参数

- `url` - 目标网站 URL（必需）
- `--max-depth` - 最大递归深度（默认：2）
- `--max-pages` - 最大爬取页面数（默认：50）
- `--output` - 输出目录（默认：./scrape-output）
- `--domain` - 限制域名内爬取（默认：true）
- `--exclude` - 排除路径正则（可选）

### 示例

```bash
# 基本用法
node site-scraper.js https://example.com

# 递归爬取，最大深度 3，最多 100 页
node site-scraper.js https://example.com --max-depth 3 --max-pages 100

# 指定输出目录
node site-scraper.js https://example.com --output ./my-output

# 仅爬取当前页面
node site-scraper.js https://example.com --max-depth 0
```

## 输出结构

```
scrape-output/
├── 2026-03-20_14-30-00/          # 时间戳目录
│   ├── index.html                # 原始 HTML
│   ├── 页面标题.md                # Markdown 文件
│   ├── 页面标题.json              # 链接数据
│   ├── images/                   # 图片目录
│   │   ├── image-1.png
│   │   └── image-2.jpg
│   ├── attachments/              # 文档目录
│   │   ├── document.pdf
│   │   └── report.docx
│   └── pages/                    # 子页面目录
│       ├── about/
│       │   ├── index.html
│       │   ├── about.md
│       │   ├── about.json
│       │   └── images/
│       └── products/
│           └── ...
└── manifest.json                  # 爬取清单
```

## 配置

编辑 `config.json` 自定义配置：

```json
{
  "maxDepth": 2,
  "maxPages": 50,
  "timeout": 30000,
  "downloadImages": true,
  "downloadDocuments": true,
  "allowedExtensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
  "blockedExtensions": [".zip", ".exe", ".dmg"],
  "userAgent": "Mozilla/5.0 (compatible; SiteScraper/1.0)"
}
```

## 依赖

```bash
npm install puppeteer html-to-markdown axios cheerio
```

## 许可证

MIT
