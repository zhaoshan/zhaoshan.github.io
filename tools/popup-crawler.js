#!/usr/bin/env node
/**
 * 弹窗/动态交互专用爬虫
 * 专门处理：点击→弹窗→再提取链接 的场景
 * 
 * 用法：node popup-crawler.js <url> [config.json]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PopupCrawler {
  constructor(options = {}) {
    this.config = {
      url: options.url || '',
      maxDepth: options.maxDepth || 3,
      clicksPerLevel: options.clicksPerLevel || 50,
      popupTimeout: options.popupTimeout || 3000,
      screenshotDir: options.screenshotDir || null,
      verbose: options.verbose !== false,
      // 弹窗选择器配置
      popupSelectors: options.popupSelectors || [
        '[class*="modal"]',
        '[class*="popup"]',
        '[class*="dialog"]',
        '[role="dialog"]',
        '[role="alertdialog"]',
        '.mfp-wrap',
        '.fancybox-wrap',
        '[class*="overlay"]'
      ],
      // 关闭按钮选择器
      closeSelectors: options.closeSelectors || [
        '[class*="close"]',
        '[class*="dismiss"]',
        '[aria-label*="Close"]',
        '[aria-label*="关闭"]',
        'button[type="button"]'
      ],
      // 要点击的元素选择器
      clickSelectors: options.clickSelectors || [
        'a[href]:not([href^="#"]):not([href^="javascript:"]):not([href^="mailto:"])',
        'button:not([disabled])',
        '[onclick]',
        '[role="button"]',
        '[tabindex="0"]',
        'input[type="button"]:not([disabled])',
        'input[type="submit"]:not([disabled])'
      ]
    };

    this.results = {
      url: this.config.url,
      timestamp: new Date().toISOString(),
      pages: [],
      popups: [],
      allLinks: new Set(),
      clickLog: [],
      stats: {
        pagesVisited: 0,
        popupsOpened: 0,
        totalClicks: 0,
        linksFound: 0,
        maxDepthReached: 0
      }
    };

    this.visitedUrls = new Set();
    this.clickedElements = new Set();
  }

  log(...args) {
    if (this.config.verbose) {
      console.log(...args);
    }
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      protocolTimeout: 120000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // 监听所有新页面/弹窗
    this.popupPages = new Map();
    
    this.browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        try {
          const newPage = await target.page();
          if (newPage) {
            const popupUrl = await newPage.url();
            if (popupUrl && !popupUrl.startsWith('about:blank')) {
              this.popupPages.set(popupUrl, newPage);
              this.results.popups.push({
                url: popupUrl,
                timestamp: new Date().toISOString(),
                detected: true
              });
              this.log(`  🪟 检测到弹窗：${popupUrl}`);
            }
          }
        } catch (e) {}
      }
    });

    // 页面导航监听
    this.page.on('framenavigated', (frame) => {
      const url = frame.url();
      if (url && !url.startsWith('about:blank') && !this.visitedUrls.has(url)) {
        this.log(`  🔄 页面导航：${url}`);
      }
    });
  }

  async extractLinks(page) {
    return await page.evaluate(() => {
      const links = [];
      
      // 提取所有链接
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
          let abs = href.startsWith('http') ? href : new URL(href, window.location.href).href;
          links.push({
            type: 'link',
            href: abs,
            text: (a.textContent || '').trim().substring(0, 200),
            id: a.id || null,
            class: a.className || null,
            target: a.target || null
          });
        }
      });

      return links;
    });
  }

  async getClickableElements(page) {
    return await page.evaluate((selectors) => {
      const elements = [];
      const seen = new Set();

      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach((el, idx) => {
            if (idx > 100) return; // 限制每个选择器的数量

            // 生成唯一标识
            const id = el.id || `${el.tagName}-${idx}`;
            if (seen.has(id)) return;
            seen.add(id);

            // 检查元素是否可见
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;

            if (isVisible) {
              elements.push({
                selector: el.id ? `#${el.id}` : el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : '') + `:nth-of-type(${idx + 1})`,
                tagName: el.tagName,
                text: (el.textContent || '').trim().substring(0, 100),
                href: el.href || null,
                onclick: el.getAttribute('onclick') || null,
                role: el.getAttribute('role') || null,
                rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
              });
            }
          });
        } catch (e) {}
      });

      return elements.slice(0, 100); // 限制总数
    }, this.config.clickSelectors);
  }

  async waitForPopup() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (Date.now() - startTime > this.config.popupTimeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);

      // 如果已经有新弹窗，立即返回
      const checkPopup = setInterval(() => {
        if (this.popupPages.size > 0) {
          clearInterval(checkInterval);
          clearInterval(checkPopup);
          resolve(true);
        }
      }, 50);
    });
  }

  async closePopups() {
    // 关闭所有弹窗页面
    for (const [url, popupPage] of this.popupPages) {
      try {
        await popupPage.close();
        this.popupPages.delete(url);
      } catch (e) {}
    }

    // 尝试关闭当前页面的弹窗
    try {
      await this.page.evaluate((closeSelectors) => {
        closeSelectors.forEach(sel => {
          try {
            document.querySelectorAll(sel).forEach(el => el.click());
          } catch (e) {}
        });
      }, this.config.closeSelectors);

      await this.page.keyboard.press('Escape');
    } catch (e) {}
  }

  async crawlPage(page, depth = 0, clickPath = []) {
    if (depth > this.config.maxDepth) {
      this.log(`  ⚠️ 达到最大深度 ${depth}`);
      return;
    }

    const currentUrl = page.url();
    this.results.stats.maxDepthReached = Math.max(this.results.stats.maxDepthReached, depth);

    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 避免重复访问
    if (this.visitedUrls.has(currentUrl) && depth > 0) {
      this.log(`  ⏭️ 跳过已访问：${currentUrl}`);
      return;
    }
    this.visitedUrls.add(currentUrl);
    this.results.stats.pagesVisited++;

    this.log(`\n📄 深度 ${depth}: ${currentUrl}`);
    this.log(`  路径：${clickPath.join(' → ') || '(根页面)'}`);

    // 提取链接
    const links = await this.extractLinks(page);
    links.forEach(link => {
      this.results.allLinks.add(link.href);
    });
    this.results.stats.linksFound = this.results.allLinks.size;

    // 保存页面信息
    this.results.pages.push({
      url: currentUrl,
      depth,
      clickPath: [...clickPath],
      linkCount: links.length,
      timestamp: new Date().toISOString()
    });

    this.log(`  🔗 发现链接：${links.length}`);

    // 获取可点击元素
    const elements = await this.getClickableElements(page);
    this.log(`  🔘 可点击元素：${elements.length}`);

    // 点击元素
    const elementsToClick = elements.slice(0, this.config.clicksPerLevel);
    const initialPopupCount = this.popupPages.size;

    for (let i = 0; i < elementsToClick.length; i++) {
      const el = elementsToClick[i];
      const elementKey = `${currentUrl}-${el.selector}`;

      // 避免重复点击同一元素
      if (this.clickedElements.has(elementKey)) {
        continue;
      }

      try {
        // 滚动并点击
        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ block: 'center', behavior: 'smooth' });
            element.click();
          }
        }, el.selector);

        this.clickedElements.add(elementKey);
        this.results.stats.totalClicks++;
        this.results.clickLog.push({
          depth,
          selector: el.selector,
          text: el.text,
          href: el.href,
          timestamp: new Date().toISOString()
        });

        this.log(`  ✅ 点击 #${i + 1}: ${el.text || el.selector}`);

        // 等待弹窗
        const hasPopup = await this.waitForPopup();

        if (hasPopup || this.popupPages.size > initialPopupCount) {
          this.results.stats.popupsOpened += (this.popupPages.size - initialPopupCount);
          this.log(`  🪟 触发弹窗！`);

          // 处理每个弹窗
          for (const [popupUrl, popupPage] of this.popupPages) {
            try {
              await popupPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
              
              // 递归爬取弹窗内容
              await this.crawlPage(popupPage, depth + 1, [...clickPath, el.text || `element-${i}`]);
              
              // 关闭弹窗
              await popupPage.close();
              this.popupPages.delete(popupUrl);
            } catch (e) {
              this.log(`  ⚠️ 弹窗处理失败：${e.message}`);
            }
          }
        }

        // 检查页面导航
        const newUrl = page.url();
        if (newUrl !== currentUrl && !newUrl.startsWith('about:blank')) {
          this.log(`  🔄 页面导航到：${newUrl}`);
          await this.crawlPage(page, depth + 1, [...clickPath, el.text || `element-${i}`]);
          
          // 返回
          await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 关闭弹窗，恢复状态
        await this.closePopups();
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        this.log(`  ⚠️ 点击失败：${error.message}`);
        try {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch (e) {}
      }
    }
  }

  async run() {
    this.log(`🔍 开始弹窗爬取：${this.config.url}`);
    this.log(` 配置：最大深度=${this.config.maxDepth}, 每层点击=${this.config.clicksPerLevel}\n`);

    await this.init();

    try {
      await this.page.goto(this.config.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await this.crawlPage(this.page, 0, []);

      // 输出结果
      this.log('\n' + '='.repeat(60));
      this.log('📊 爬取结果汇总');
      this.log('='.repeat(60));
      this.log(` 访问页面：${this.results.stats.pagesVisited}`);
      this.log(` 触发弹窗：${this.results.stats.popupsOpened}`);
      this.log(` 总点击数：${this.results.stats.totalClicks}`);
      this.log(` 发现链接：${this.results.stats.linksFound}`);
      this.log(` 最大深度：${this.results.stats.maxDepthReached}`);

      const sortedLinks = Array.from(this.results.allLinks).sort();
      this.log(`\n📋 链接列表 (${sortedLinks.length} 个):\n`);
      sortedLinks.forEach((link, i) => this.log(`${i + 1}. ${link}`));

      return {
        ...this.results,
        allLinks: sortedLinks
      };

    } finally {
      await this.browser.close();
    }
  }
}

// CLI
if (require.main === module) {
  const url = process.argv[2];
  const configFile = process.argv[3];

  if (!url) {
    console.log('用法：node popup-crawler.js <url> [config.json]');
    console.log('示例：node popup-crawler.js https://example.com');
    console.log('       node popup-crawler.js https://example.com config.json');
    process.exit(1);
  }

  let options = { url, verbose: true };

  if (configFile && fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    options = { ...options, ...config };
  }

  const crawler = new PopupCrawler(options);
  const outputDir = path.join(process.cwd(), 'crawl-output', Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });

  crawler.run()
    .then(results => {
      fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
      fs.writeFileSync(path.join(outputDir, 'links.txt'), results.allLinks.join('\n'));
      fs.writeFileSync(path.join(outputDir, 'click-log.json'), JSON.stringify(results.clickLog, null, 2));
      console.log(`\n💾 结果保存至：${outputDir}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('爬取失败:', err.message);
      process.exit(1);
    });
}

module.exports = { PopupCrawler };
