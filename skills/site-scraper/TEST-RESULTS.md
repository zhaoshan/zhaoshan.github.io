# Site Scraper 测试结果 - 東京スター銀行

## 测试信息

- **测试网站:** https://www.tokyostarbank.co.jp/
- **测试时间:** 2026-03-20 16:29:47 JST
- **爬取深度:** 1 层
- **最大页面:** 5 个

## 测试结果汇总

| 指标 | 数量 |
|------|------|
| **爬取页面** | 5 |
| **总链接数** | 989 |
| **下载图片** | 174 |
| **下载文档** | 83 |
| **输出大小** | 33 MB |

## 爬取的页面

| # | 页面标题 | URL | 深度 | 链接数 |
|---|---------|-----|------|--------|
| 1 | 東京スター銀行 | https://www.tokyostarbank.co.jp/ | 0 | 430 |
| 2 | 法人・個人事業主のお客さま | https://www.tokyostarbank.co.jp/hojin/ | 1 | 229 |
| 3 | 外国籍のお客さま | https://www.tokyostarbank.co.jp/foreign/ | 1 | 112 |
| 4 | Foreign Customers | https://www.tokyostarbank.co.jp/foreign/en/ | 1 | 109 |
| 5 | 外國籍客戶 | https://www.tokyostarbank.co.jp/foreign/cn/ | 1 | 109 |

## 输出结构

```
test-output/2026-03-20T08-29-47/
├── index.html                    # 主页面 HTML
├── index.md                      # 主页面 Markdown
├── links.json                    # 主页面链接数据
├── manifest.json                 # 爬取清单
├── images/                       # 图片目录 (174 个文件)
│   ├── image-1.jpg
│   ├── image-2.png
│   └── ...
├── attachments/                  # 文档目录 (83 个文件)
│   ├── 240509.pdf
│   ├── 260318.pdf
│   └── ...
└── pages/                        # 子页面目录
    ├── 法人・個人事業主のお客さま-【東京スター銀行】/
    │   ├── index.html
    │   ├── 法人・個人事業主のお客さま-【東京スター銀行】.md
    │   ├── 法人・個人事業主のお客さま-【東京スター銀行】.json
    │   ├── images/
    │   └── attachments/
    ├── 外国籍のお客さま【東京スター銀行】/
    ├── Foreign-Customers【Tokyo-Star-Bank】/
    └── 外國籍客戶【東京之星銀行】/
```

## 文档分类

下载的 83 个文档包括：

| 类型 | 数量 | 示例 |
|------|------|------|
| 重要通知 | 10+ | 【重要】東京スター銀行をかたる不審な SNS |
| 新闻发布 | 15+ | 2026 年 2 月 16 日 ORANGEPORT 支店開設 |
| 财报 | 3 | 2026 年 3 月期 第 3 四半期決算短信 |
| 手续费/利率 | 5 | enkatsu_USD.pdf, enkatsu_AUD.pdf |
| 系统维护 | 2 | システムメンテナンス情報 |
| 条款规定 | 10+ | 各種預金規定，個人情報のお取り扱い |
| 多语言文档 | 20+ | _en.pdf, _cn.pdf 版本 |

## 测试命令

```bash
cd skills/site-scraper
node site-scraper.js https://www.tokyostarbank.co.jp/ \
  --max-depth 1 \
  --max-pages 5 \
  --output ./test-output
```

## 功能验证

✅ **功能 1:** 接收 URL，获取完整页面内容  
✅ **功能 2:** 转换为 Markdown，保留所有图片  
✅ **功能 3:** 生成 JSON，包含所有链接（网页/PDF/Office）  
✅ **功能 4:** 下载文档到 attachments 目录  
✅ **功能 5:** 递归爬取所有普通网页链接  

## 注意事项

1. **递归深度限制:** 测试使用深度 1，避免爬取过多页面
2. **域名限制:** 默认仅爬取同域名 (tokyostarbank.co.jp)
3. **文件大小:** 完整测试输出约 33MB（含图片和 PDF）
4. **多语言支持:** 自动爬取日语/英语/中文三个版本页面

## 完整数据

完整测试数据位于：`test-output/2026-03-20T08-29-47/`

查看 manifest.json 获取完整爬取清单。

---

*测试日期：2026-03-20*
*Site Scraper v1.0*
