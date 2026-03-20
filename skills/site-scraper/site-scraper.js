#!/usr/bin/env node
/**
 * Site Scraper - 网站内容完整爬取工具
 * 
 * 功能：
 * 1. 接收 URL，获取完整页面内容
 * 2. 转换为 Markdown，保留所有图片（下载到 images 目录）
 * 3. 生成 JSON，包含所有链接（网页/PDF/Office）
 * 4. 下载文档到 attachments 目录
 * 5. 递归爬取所有普通网页链接
 * 
 * 用法：node site-scraper.js <url> [options]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { program } = require('commander');

// 命令行参数
program
  .argument('<url>', '目标网站 URL')
  .option('--max-depth <number>', '最大递归深度', '2')
  .option('--max-pages <number>', '最大爬取页面数', '50')
  .option('--output <dir>', '输出目录', './scrape-output')
  .option('--domain-only', '仅爬取同域名', true)
  .option('--exclude <pattern>', '排除路径正则', '')
  .parse(process.argv);

const options = program.opts();
const config = {
  maxDepth: parseInt(options.maxDepth),
  maxPages: parseInt(options.maxPages),
  outputDir: options.output,
  domainOnly: options.domainOnly,
  excludePattern: options.exclude ? new RegExp(options.exclude) : null,
  timeout: 30000,
  allowedDocExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};

// 全局状态
const state = {
  visitedUrls: new Set(),
  pagesCrawled: 0,
  timestamp: new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5),
  outputDir: '',
  manifest: {
    startTime: new Date().toISOString(),
    url: program.args[0],
    pages: [],
    totalImages: 0,
    totalDocuments: 0,
    totalLinks: 0
  }
};

// 工具函数
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|？*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载文件
async function downloadFile(url, outputPath) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: config.timeout
    });
    
    fs.writeFileSync(outputPath, response.data);
    console.log(`  ⬇️ 已下载：${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.log(`  ⚠️ 下载失败：${error.message}`);
    return false;
  }
}

// HTML 转 Markdown
function htmlToMarkdown(html, baseUrl, imagesDir) {
  const $ = cheerio.load(html);
  
  // 移除不需要的元素
  $('script, style, nav, footer, header, .ads, .advertisement').remove();
  
  // 处理图片
  let imageIndex = 0;
  $('img').each((_, img) => {
    const imgEl = $(img);
    let src = imgEl.attr('src');
    
    if (!src) return;
    
    // 转换为绝对路径
    if (src.startsWith('//')) {
      src = 'https:' + src;
    } else if (!src.startsWith('http')) {
      src = new URL(src, baseUrl).href;
    }
    
    // 下载图片
    const ext = path.extname(new URL(src).pathname) || '.jpg';
    const imageFilename = `image-${++imageIndex}${ext}`;
    const imagePath = path.join(imagesDir, imageFilename);
    
    // 异步下载（不等待）
    downloadFile(src, imagePath).then(success => {
      if (success) state.manifest.totalImages++;
    });
    
    // 更新 src 为本地路径
    imgEl.attr('src', `images/${imageFilename}`);
    imgEl.attr('alt', imgEl.attr('alt') || '');
  });
  
  // 转换为 Markdown
  let markdown = '';
  
  // 提取标题
  const title = $('title').text().trim() || '无标题';
  markdown += `# ${title}\n\n`;
  
  // 提取正文内容
  const mainContent = $('article, main, .content, .post, body').first();
  
  // 转换链接
  mainContent.find('a').each((_, a) => {
    const href = $(a).attr('href');
    const text = $(a).text().trim();
    if (href && text) {
      $(a).replaceWith(`[${text}](${href})`);
    } else {
      $(a).replaceWith($(a).text());
    }
  });
  
  // 提取文本内容
  const content = mainContent.text()
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
  
  markdown += content;
  
  // 添加元数据
  markdown += `\n\n---\n\n`;
  markdown += `**来源:** ${baseUrl}\n`;
  markdown += `**爬取时间:** ${new Date().toISOString()}\n`;
  
  return { markdown, title };
}

// 提取链接
function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = {
    webpages: [],
    documents: [],
    images: [],
    all: []
  };
  
  const baseDomain = getDomain(baseUrl);
  
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    const text = $(a).text().trim();
    
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    
    // 转换为绝对路径
    let absoluteHref = href;
    if (href.startsWith('//')) {
      absoluteHref = 'https:' + href;
    } else if (!href.startsWith('http')) {
      absoluteHref = new URL(href, baseUrl).href;
    }
    
    const linkData = {
      text: text || '(无文本)',
      href: absoluteHref,
      type: 'unknown'
    };
    
    // 判断链接类型
    const ext = path.extname(new URL(absoluteHref).pathname).toLowerCase();
    
    if (config.allowedDocExtensions.includes(ext)) {
      linkData.type = 'document';
      links.documents.push(linkData);
    } else if (config.imageExtensions.includes(ext)) {
      linkData.type = 'image';
      links.images.push(linkData);
    } else {
      linkData.type = 'webpage';
      // 仅同域名或允许的链接
      if (!config.domainOnly || getDomain(absoluteHref) === baseDomain) {
        links.webpages.push(linkData);
      }
    }
    
    links.all.push(linkData);
  });
  
  return links;
}

// 下载文档
async function downloadDocuments(documents, attachmentsDir) {
  ensureDir(attachmentsDir);
  
  for (const doc of documents) {
    try {
      const urlPath = new URL(doc.href).pathname;
      const filename = path.basename(urlPath) || `document-${Date.now()}`;
      const outputPath = path.join(attachmentsDir, sanitizeFilename(filename));
      
      await downloadFile(doc.href, outputPath);
      state.manifest.totalDocuments++;
    } catch (error) {
      console.log(`  ⚠️ 文档下载失败：${doc.href}`);
    }
  }
}

// 爬取单个页面
async function scrapePage(url, outputDir, depth = 0) {
  if (state.pagesCrawled >= config.maxPages) {
    console.log(`⚠️ 已达到最大页面数限制 (${config.maxPages})`);
    return null;
  }
  
  if (state.visitedUrls.has(url)) {
    console.log(`⏭️ 跳过已访问：${url}`);
    return null;
  }
  
  // 检查排除规则
  if (config.excludePattern && config.excludePattern.test(url)) {
    console.log(`⏭️ 排除：${url}`);
    return null;
  }
  
  state.visitedUrls.add(url);
  state.pagesCrawled++;
  
  console.log(`\n📄 [深度 ${depth}] 爬取：${url}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: config.timeout,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(config.userAgent);
    
    // 获取页面内容
    console.log('  📥 加载页面...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.timeout });
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待动态内容
    
    const html = await page.content();
    const pageTitle = await page.title();
    const safeTitle = sanitizeFilename(pageTitle || 'untitled');
    
    // 创建页面输出目录
    const pageOutputDir = depth === 0 ? outputDir : path.join(outputDir, 'pages', safeTitle);
    const imagesDir = path.join(pageOutputDir, 'images');
    const attachmentsDir = path.join(pageOutputDir, 'attachments');
    
    ensureDir(pageOutputDir);
    ensureDir(imagesDir);
    ensureDir(attachmentsDir);
    
    // 保存原始 HTML
    fs.writeFileSync(path.join(pageOutputDir, 'index.html'), html);
    
    // 转换为 Markdown
    console.log('  📝 转换 Markdown...');
    const { markdown, title } = htmlToMarkdown(html, url, imagesDir);
    const mdFilename = depth === 0 ? 'index.md' : `${safeTitle}.md`;
    fs.writeFileSync(path.join(pageOutputDir, mdFilename), markdown);
    
    // 提取链接
    console.log('  🔗 提取链接...');
    const links = extractLinks(html, url);
    
    // 保存链接 JSON
    const linksData = {
      url,
      title,
      timestamp: new Date().toISOString(),
      depth,
      stats: {
        total: links.all.length,
        webpages: links.webpages.length,
        documents: links.documents.length,
        images: links.images.length
      },
      links
    };
    
    const jsonFilename = depth === 0 ? 'links.json' : `${safeTitle}.json`;
    fs.writeFileSync(
      path.join(pageOutputDir, jsonFilename),
      JSON.stringify(linksData, null, 2)
    );
    
    state.manifest.totalLinks += links.all.length;
    
    // 下载文档
    if (links.documents.length > 0) {
      console.log(`  📎 下载 ${links.documents.length} 个文档...`);
      await downloadDocuments(links.documents, attachmentsDir);
    }
    
    console.log(`  ✅ 完成：${title}`);
    console.log(`     链接：${links.all.length} | 文档：${links.documents.length} | 图片：${links.images.length}`);
    
    // 记录到 manifest
    state.manifest.pages.push({
      url,
      title,
      depth,
      path: pageOutputDir,
      links: links.all.length,
      timestamp: new Date().toISOString()
    });
    
    // 递归爬取网页链接
    if (depth < config.maxDepth && links.webpages.length > 0) {
      console.log(`  🔄 发现 ${links.webpages.length} 个网页链接，准备递归爬取...`);
      
      for (const link of links.webpages.slice(0, 20)) { // 限制每页递归数量
        if (state.pagesCrawled >= config.maxPages) break;
        await scrapePage(link.href, outputDir, depth + 1);
      }
    }
    
    return {
      url,
      title,
      path: pageOutputDir,
      links
    };
    
  } catch (error) {
    console.error(`  ❌ 错误：${error.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

// 保存 manifest
function saveManifest() {
  state.manifest.endTime = new Date().toISOString();
  state.manifest.stats = {
    pagesCrawled: state.pagesCrawled,
    visitedUrls: state.visitedUrls.size
  };
  
  fs.writeFileSync(
    path.join(state.outputDir, 'manifest.json'),
    JSON.stringify(state.manifest, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 爬取完成');
  console.log('='.repeat(60));
  console.log(` 页面数：${state.pagesCrawled}`);
  console.log(` 总链接：${state.manifest.totalLinks}`);
  console.log(` 图片数：${state.manifest.totalImages}`);
  console.log(` 文档数：${state.manifest.totalDocuments}`);
  console.log(` 输出目录：${state.outputDir}`);
}

// 主函数
async function main() {
  const url = program.args[0];
  
  console.log('🚀 Site Scraper 启动');
  console.log('='.repeat(60));
  console.log(`目标 URL: ${url}`);
  console.log(`最大深度：${config.maxDepth}`);
  console.log(`最大页面：${config.maxPages}`);
  console.log(`输出目录：${config.outputDir}`);
  console.log('='.repeat(60));
  
  // 创建输出目录
  state.outputDir = path.join(config.outputDir, state.timestamp);
  ensureDir(state.outputDir);
  
  console.log(`\n📁 输出目录：${state.outputDir}\n`);
  
  // 开始爬取
  await scrapePage(url, state.outputDir, 0);
  
  // 保存 manifest
  saveManifest();
  
  console.log('\n✅ 所有任务完成！\n');
}

// 运行
main().catch(error => {
  console.error('💥 致命错误:', error);
  process.exit(1);
});
