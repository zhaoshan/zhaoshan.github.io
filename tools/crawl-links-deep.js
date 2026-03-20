#!/usr/bin/env node
/**
 * 网站深度交互爬取工具 v2
 * 支持：点击→弹窗→再点击→提取深层链接
 * 
 * 用法：node crawl-links-deep.js <url> [maxDepth] [maxClicks]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function deepCrawl(url, options = {}) {
  const {
    maxDepth = 2,
    maxClicksPerLevel = 25,
    timeout = 90000,
    waitForPopup = 2000,
    verbose = true
  } = options;

  const results = {
    url,
    timestamp: new Date().toISOString(),
    pages: [],
    allLinks: new Set(),
    interactiveElements: [],
    stats: {
      totalClicks: 0,
      totalPopups: 0,
      totalLinks: 0,
      maxDepthReached: 0
    }
  };

  console.log(`🔍 开始深度爬取：${url}`);
  console.log(` 配置：最大深度=${maxDepth}, 每层最多点击=${maxClicksPerLevel}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const popupLinks = new Set();
    
    // 监听新页面/弹窗
    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        try {
          const newPage = await target.page();
          if (newPage) {
            await newPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
            const popupUrl = newPage.url();
            if (popupUrl && !popupUrl.startsWith('about:blank')) {
              popupLinks.add(popupUrl);
              results.allLinks.add(popupUrl);
              if (verbose) console.log(`  🪟 弹窗：${popupUrl}`);
            }
          }
        } catch (e) {}
      }
    });

    async function crawlPage(page, depth = 0, clickPath = []) {
      if (depth > maxDepth) return;

      const currentUrl = page.url();
      results.stats.maxDepthReached = Math.max(results.stats.maxDepthReached, depth);

      if (verbose) {
        console.log(`\n📄 深度 ${depth}: ${currentUrl}`);
        console.log(`  路径：${clickPath.join(' → ') || '(根页面)'}`);
      }

      // 等待页面稳定
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 提取链接和可交互元素
      const data = await page.evaluate(() => {
        const generateSelector = (el) => {
          const path = [];
          let current = el;
          while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 3) {
            let selector = current.nodeName.toLowerCase();
            if (current.id) {
              path.unshift(`#${current.id}`);
              break;
            }
            path.unshift(selector);
            current = current.parentElement;
          }
          return path.join(' > ');
        };

        const links = [];
        const interactive = [];

        // 提取所有链接
        document.querySelectorAll('a[href]').forEach(a => {
          const href = a.getAttribute('href');
          if (href && href !== '#' && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
            let abs = href.startsWith('http') ? href : new URL(href, window.location.href).href;
            links.push(abs);
          }
        });

        // 提取可交互元素
        document.querySelectorAll('button, [onclick], [role="button"], input[type="button"], input[type="submit"]').forEach((el, idx) => {
          if (idx < 100) {
            interactive.push({
              selector: generateSelector(el),
              text: (el.textContent || '').trim().substring(0, 100),
              id: el.id || null,
              tagName: el.tagName
            });
          }
        });

        return { links, interactive };
      });

      // 保存链接
      data.links.forEach(link => results.allLinks.add(link));
      
      results.pages.push({
        url: currentUrl,
        depth,
        clickPath: [...clickPath],
        linkCount: data.links.length,
        interactiveCount: data.interactive.length
      });

      results.interactiveElements.push(...data.interactive);

      if (verbose) {
        console.log(`  🔗 链接：${data.links.length} | 🔘 可交互：${data.interactive.length}`);
      }

      // 点击交互元素
      const elementsToClick = data.interactive.slice(0, maxClicksPerLevel);
      const initialPopupCount = popupLinks.size;

      for (let i = 0; i < elementsToClick.length; i++) {
        const el = elementsToClick[i];
        
        try {
          await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollIntoView({ block: 'center' });
              element.click();
            }
          }, el.selector);

          results.stats.totalClicks++;
          
          if (verbose) {
            console.log(`  ✅ 点击：${el.text || el.selector}`);
          }

          // 等待弹窗
          await new Promise(resolve => setTimeout(resolve, waitForPopup));

          // 检查新弹窗
          const newPopups = popupLinks.size - initialPopupCount;
          if (newPopups > 0) {
            results.stats.totalPopups += newPopups;
            if (verbose) console.log(`  🪟 触发 ${newPopups} 个弹窗`);
          }

          // 检查页面导航
          const newUrl = page.url();
          if (newUrl !== currentUrl && !newUrl.startsWith('about:blank')) {
            if (verbose) console.log(`  🔄 导航到：${newUrl}`);
            await crawlPage(page, depth + 1, [...clickPath, el.text || `element-${i}`]);
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // 尝试关闭弹窗
          await page.evaluate(() => {
            document.querySelectorAll('[class*="close"], [class*="dismiss"], [aria-label*="Close"]').forEach(btn => btn.click());
            document.querySelectorAll('[class*="overlay"]').forEach(ov => ov.click());
          });
          await page.keyboard.press('Escape');
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          if (verbose) console.log(`  ⚠️ 点击失败：${error.message}`);
          try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }); } catch (e) {}
        }
      }

      results.stats.totalLinks = results.allLinks.size;
    }

    // 开始
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await crawlPage(page, 0, []);

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 深度爬取结果');
    console.log('='.repeat(60));
    console.log(` 总链接：${results.stats.totalLinks}`);
    console.log(` 访问页面：${results.pages.length}`);
    console.log(` 总点击：${results.stats.totalClicks}`);
    console.log(` 触发弹窗：${results.stats.totalPopups}`);
    console.log(` 最大深度：${results.stats.maxDepthReached}`);

    const sortedLinks = Array.from(results.allLinks).sort();
    console.log(`\n📋 链接列表 (${sortedLinks.length} 个):\n`);
    sortedLinks.forEach((link, i) => console.log(`${i + 1}. ${link}`));

    return {
      ...results,
      allLinks: sortedLinks
    };

  } catch (error) {
    console.error(`❌ 错误：${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// CLI
if (require.main === module) {
  const url = process.argv[2];
  const maxDepth = parseInt(process.argv[3]) || 2;
  const maxClicks = parseInt(process.argv[4]) || 25;

  if (!url) {
    console.log('用法：node crawl-links-deep.js <url> [maxDepth] [maxClicks]');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'crawl-output', Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });

  deepCrawl(url, { maxDepth, maxClicksPerLevel: maxClicks, verbose: true })
    .then(results => {
      fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
      fs.writeFileSync(path.join(outputDir, 'links.txt'), results.allLinks.join('\n'));
      console.log(`\n💾 保存至：${outputDir}`);
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { deepCrawl };
