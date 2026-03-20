#!/usr/bin/env node
/**
 * 网站链接爬取工具
 * 模拟点击所有可交互组件，提取链接地址
 * 
 * 用法：node crawl-links.js <url>
 */

const puppeteer = require('puppeteer');

async function crawlLinks(url, options = {}) {
  const {
    maxDepth = 2,
    timeout = 30000,
    waitForNetwork = true,
    simulateClick = true,
    outputFormat = 'text'
  } = options;

  const visited = new Set();
  const links = new Set();
  const interactiveElements = [];

  console.log(`🔍 开始爬取：${url}`);
  console.log(` 配置：最大深度=${maxDepth}, 超时=${timeout}ms\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // 收集所有链接的函数
    async function collectLinks(page, depth = 0) {
      if (depth > maxDepth) return;

      console.log(`\n📄 深度 ${depth}: ${page.url()}`);

      // 等待页面加载
      if (waitForNetwork) {
        try {
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
        } catch (e) {
          console.log(`  ️ 网络等待超时，继续...`);
        }
      }

      // 提取所有链接和可交互元素
      const elements = await page.evaluate(() => {
        const results = {
          links: [],
          buttons: [],
          interactiveElements: []
        };

        // 所有链接
        document.querySelectorAll('a[href]').forEach(el => {
          const href = el.getAttribute('href');
          const text = el.textContent?.trim() || '';
          const id = el.id || '';
          const className = el.className || '';
          
          if (href && href !== '#' && !href.startsWith('javascript:')) {
            results.links.push({
              href,
              text: text.substring(0, 100),
              id,
              className,
              tagName: 'A'
            });
          }
        });

        // 所有按钮
        document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(el => {
          results.buttons.push({
            text: el.textContent?.trim() || el.value || '',
            id: el.id || '',
            className: el.className || '',
            tagName: el.tagName
          });
        });

        // 所有可交互元素（有 onclick 或 role="button"）
        document.querySelectorAll('[onclick], [role="button"], [tabindex="0"]').forEach(el => {
          results.interactiveElements.push({
            tagName: el.tagName,
            id: el.id || '',
            className: el.className || '',
            text: el.textContent?.trim().substring(0, 50) || '',
            onclick: el.getAttribute('onclick') || ''
          });
        });

        return results;
      });

      // 去重并存储
      elements.links.forEach(link => {
        const fullUrl = link.href.startsWith('http') 
          ? link.href 
          : new URL(link.href, page.url()).href;
        links.add(fullUrl);
      });

      // 模拟点击所有可交互元素（可选）
      if (simulateClick && depth < maxDepth) {
        const clickableSelectors = await page.evaluate(() => {
          const selectors = [];
          document.querySelectorAll('a[href]').forEach((el, index) => {
            const href = el.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
              // 生成唯一选择器
              const path = [];
              let current = el;
              while (current && current.nodeType === Node.ELEMENT_NODE) {
                let selector = current.nodeName.toLowerCase();
                if (current.id) {
                  selector += `#${current.id}`;
                  path.unshift(selector);
                  break;
                } else {
                  let sibling = current;
                  let nth = 1;
                  while (sibling.previousElementSibling) {
                    sibling = sibling.previousElementSibling;
                    if (sibling.nodeName === current.nodeName) nth++;
                  }
                  selector += `:nth-of-type(${nth})`;
                }
                path.unshift(selector);
                current = current.parentElement;
              }
              selectors.push(path.join(' > '));
            }
          });
          return selectors.slice(0, 50); // 限制数量
        });

        // 尝试点击每个链接（在新标签页中打开）
        for (const selector of clickableSelectors) {
          try {
            const newPage = await browser.newPage();
            await newPage.setViewport({ width: 1920, height: 1080 });
            
            // 获取点击前的 URL
            const targetUrl = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (el && el.href) return el.href;
              return null;
            }, selector);

            if (targetUrl && !visited.has(targetUrl)) {
              visited.add(targetUrl);
              console.log(`  🔗 发现：${targetUrl}`);
              await collectLinks(newPage, depth + 1);
            }
            
            await newPage.close();
          } catch (e) {
            // 忽略点击错误
          }
        }
      }

      interactiveElements.push(...elements.buttons, ...elements.interactiveElements);
    }

    // 开始爬取
    await page.goto(url, { waitUntil: 'networkidle2', timeout });
    await collectLinks(page, 0);

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 爬取结果汇总');
    console.log('='.repeat(60));
    console.log(`\n✅ 共发现 ${links.size} 个唯一链接`);
    console.log(` 访问了 ${visited.size} 个页面`);
    console.log(`🔘 发现 ${interactiveElements.length} 个交互元素\n`);

    // 输出所有链接
    console.log('📋 链接列表:');
    console.log('-'.repeat(60));
    
    const sortedLinks = Array.from(links).sort();
    sortedLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link}`);
    });

    // 保存为 JSON（可选）
    const output = {
      url,
      timestamp: new Date().toISOString(),
      totalLinks: links.size,
      visitedPages: visited.size,
      interactiveElements: interactiveElements.length,
      links: sortedLinks
    };

    console.log('\n' + '='.repeat(60));
    console.log('💡 提示：结果已输出，可修改脚本保存为 JSON 文件');
    
    return output;

  } catch (error) {
    console.error(`❌ 错误：${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// 命令行执行
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.log('用法：node crawl-links.js <url>');
    console.log('示例：node crawl-links.js https://example.com');
    process.exit(1);
  }

  crawlLinks(url)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { crawlLinks };
