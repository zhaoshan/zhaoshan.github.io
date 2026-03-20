#!/usr/bin/env node
/**
 * 提取链接 + 对应文本
 * 支持：<a>内嵌套<span>、纯文本、图标等复杂结构
 * 
 * 用法：node extract-links-with-text.js <url>
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function extractLinksWithText(url) {
  console.log(`🔍 提取链接和文本：${url}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    console.log('📄 加载页面...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 提取所有链接及其文本
    console.log('🔗 提取链接和文本...\n');
    
    const linkData = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        
        // 过滤无效链接
        if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:')) {
          return;
        }

        // 转换为绝对路径
        let absoluteHref = href;
        if (!href.startsWith('http')) {
          absoluteHref = new URL(href, window.location.href).href;
        }

        // 避免重复
        const key = absoluteHref;
        if (seen.has(key)) return;
        seen.add(key);

        // 提取文本的多种方式
        let text = '';
        
        // 1. 直接文本内容
        text = a.textContent || '';
        
        // 2. 如果为空，尝试查找子元素
        if (!text.trim()) {
          // 查找 span, div, p 等
          const childText = a.querySelector('span, div, p, strong, em, b, i, label');
          if (childText) {
            text = childText.textContent || '';
          }
        }

        // 3. 查找 aria-label
        if (!text.trim()) {
          text = a.getAttribute('aria-label') || '';
        }

        // 4. 查找 title 属性
        if (!text.trim()) {
          text = a.getAttribute('title') || '';
        }

        // 5. 查找 img 的 alt
        if (!text.trim()) {
          const img = a.querySelector('img');
          if (img) {
            text = img.getAttribute('alt') || '';
          }
        }

        // 6. 查找 data- 属性
        if (!text.trim()) {
          text = a.getAttribute('data-text') || 
                 a.getAttribute('data-label') || 
                 a.getAttribute('data-title') || '';
        }

        // 清理文本
        text = text.trim()
          .replace(/\s+/g, ' ')           // 多个空格合并
          .replace(/\n/g, ' ')            // 换行符替换为空格
          .substring(0, 300);             // 限制长度

        // 获取其他信息
        const rect = a.getBoundingClientRect();
        
        results.push({
          href: absoluteHref,
          text: text || '(无文本)',
          textLength: text.length,
          id: a.id || null,
          class: a.className || null,
          target: a.target || null,
          title: a.getAttribute('title') || null,
          ariaLabel: a.getAttribute('aria-label') || null,
          hasIcon: a.querySelector('svg, i[class*="icon"], i[class*="fa"]') !== null,
          isVisible: rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight,
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top)
          }
        });
      });

      // 按位置排序（从上到下）
      results.sort((a, b) => a.position.y - b.position.y);

      return results;
    });

    // 输出结果
    console.log('='.repeat(80));
    console.log(`📊 提取完成：共 ${linkData.length} 个链接\n`);
    
    // 统计
    const withText = linkData.filter(l => l.text !== '(无文本)').length;
    const withoutText = linkData.length - withText;
    const visible = linkData.filter(l => l.isVisible).length;
    
    console.log(`统计:`);
    console.log(`  总链接数：${linkData.length}`);
    console.log(`  有文本：${withText}`);
    console.log(`  无文本：${withoutText}`);
    console.log(`  可见链接：${visible}\n`);

    // 详细输出
    console.log('📋 链接列表:\n');
    console.log('-'.repeat(80));
    
    linkData.forEach((link, i) => {
      const icon = link.isVisible ? '✅' : '⚠️';
      const textPreview = link.text.substring(0, 50) + (link.text.length > 50 ? '...' : '');
      
      console.log(`${i + 1}. ${icon} ${textPreview}`);
      console.log(`   ${link.href}`);
      if (link.class) console.log(`   class: ${link.class}`);
      if (link.target) console.log(`   target: ${link.target}`);
      console.log('');
    });

    // 保存结果
    const output = {
      url,
      timestamp: new Date().toISOString(),
      stats: {
        total: linkData.length,
        withText,
        withoutText,
        visible
      },
      links: linkData
    };

    return output;

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

  if (!url) {
    console.log('用法：node extract-links-with-text.js <url>');
    console.log('示例：node extract-links-with-text.js https://example.com');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'crawl-output', Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });

  extractLinksWithText(url)
    .then(results => {
      // 保存完整 JSON
      fs.writeFileSync(
        path.join(outputDir, 'links-with-text.json'), 
        JSON.stringify(results, null, 2)
      );
      
      // 保存简化版（只含 href 和 text）
      const simpleLinks = results.links.map(l => ({
        href: l.href,
        text: l.text
      }));
      fs.writeFileSync(
        path.join(outputDir, 'links-simple.json'), 
        JSON.stringify(simpleLinks, null, 2)
      );
      
      // 保存 Markdown 格式
      const mdContent = `# 链接提取结果

**URL:** ${url}
**时间:** ${results.timestamp}

## 统计
- 总链接数：${results.stats.total}
- 有文本：${results.stats.withText}
- 无文本：${results.stats.withoutText}
- 可见链接：${results.stats.visible}

## 链接列表

| # | 文本 | 链接 |
|---|------|------|
${results.links.map((l, i) => `| ${i + 1} | ${l.text} | ${l.href} |`).join('\n')}
`;
      fs.writeFileSync(path.join(outputDir, 'links.md'), mdContent);
      
      // 保存 CSV 格式
      const csvContent = `#,文本，链接，class,target,可见\n` + 
        results.links.map((l, i) => 
          `${i + 1},"${l.text.replace(/"/g, '""')}",${l.href},${l.class || ''},${l.target || ''},${l.isVisible}`
        ).join('\n');
      fs.writeFileSync(path.join(outputDir, 'links.csv'), csvContent);

      console.log('\n💾 结果已保存:');
      console.log(`   ${outputDir}/links-with-text.json  (完整数据)`);
      console.log(`   ${outputDir}/links-simple.json     (简化版)`);
      console.log(`   ${outputDir}/links.md              (Markdown)`);
      console.log(`   ${outputDir}/links.csv             (Excel 可用)\n`);
      
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { extractLinksWithText };
