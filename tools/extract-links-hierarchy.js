#!/usr/bin/env node
/**
 * 提取链接 + 文本 + DOM 层级路径
 * 支持：向上回溯父元素、获取完整层级结构、筛选特定类型链接
 * 
 * 用法：node extract-links-hierarchy.js <url> [options]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function extractLinksHierarchy(url, options = {}) {
  const {
    includePDF = true,
    maxDepth = 10,
    outputDir = null
  } = options;

  console.log(`🔍 提取链接 + 层级结构：${url}`);
  console.log(` 配置：includePDF=${includePDF}, maxDepth=${maxDepth}\n`);

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

    // 提取链接和层级
    console.log('🔗 提取链接和 DOM 层级...\n');
    
    const linkData = await page.evaluate((maxDepthVal, includePDFVal) => {
      const results = [];
      const seen = new Set();

      // 生成层级路径
      function getHierarchyPath(element, maxDepth) {
        const path = [];
        let current = element;
        let depth = 0;

        while (current && current.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
          const tag = current.tagName.toLowerCase();
          const id = current.id;
          const className = current.className;
          const role = current.getAttribute?.('role');
          
          // 构建节点信息
          const nodeInfo = {
            tag,
            id: id || null,
            class: typeof className === 'string' ? className.split(' ').filter(c => c) : [],
            role: role || null,
            'data-section': current.getAttribute?.('data-section') || null,
            'data-category': current.getAttribute?.('data-category') || null,
            'aria-label': current.getAttribute?.('aria-label') || null
          };

          path.unshift(nodeInfo);

          // 如果找到有意义的容器，停止
          if (['nav', 'main', 'header', 'footer', 'section', 'article', 'aside'].includes(tag)) {
            if (path.length > 1) break;
          }

          current = current.parentElement;
          depth++;
        }

        return path;
      }

      // 获取语义化路径（只包含有意义的容器）
      function getSemanticPath(hierarchy) {
        return hierarchy
          .filter(node => 
            ['nav', 'main', 'header', 'footer', 'section', 'article', 'aside', 'form'].includes(node.tag) ||
            node.role ||
            node['aria-label'] ||
            node['data-section'] ||
            node.id
          )
          .map(node => {
            if (node.id) return `${node.tag}#${node.id}`;
            if (node['aria-label']) return `${node.tag}[aria-label="${node['aria-label']}"]`;
            if (node.role) return `${node.tag}[role="${node.role}"]`;
            if (node['data-section']) return `${node.tag}[data-section="${node['data-section']}"]`;
            return node.tag;
          });
      }

      // 获取文本内容
      function getTextContent(a) {
        let text = a.textContent || '';
        
        if (!text.trim()) {
          const childText = a.querySelector('span, div, p, strong, em, b, i, label, svg title');
          if (childText) text = childText.textContent || '';
        }
        
        if (!text.trim()) {
          text = a.getAttribute('aria-label') || 
                 a.getAttribute('title') || 
                 a.getAttribute('data-text') || 
                 a.getAttribute('data-label') || '';
        }
        
        if (!text.trim()) {
          const img = a.querySelector('img');
          if (img) text = img.getAttribute('alt') || '';
        }

        return text.trim().replace(/\s+/g, ' ').substring(0, 300);
      }

      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        
        // 过滤
        if (!href || href === '#') return;
        if (href.startsWith('javascript:') || href.startsWith('mailto:')) return;
        if (!includePDFVal && href.endsWith('.pdf')) return;

        // 绝对路径
        let absoluteHref = href.startsWith('http') ? href : new URL(href, window.location.href).href;
        
        // 去重
        if (seen.has(absoluteHref)) return;
        seen.add(absoluteHref);

        // 获取层级
        const hierarchy = getHierarchyPath(a, maxDepthVal);
        const semanticPath = getSemanticPath(hierarchy);

        // 判断链接类型
        const isPDF = href.endsWith('.pdf');
        const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
        const isAnchor = href.startsWith('#');
        const isTel = href.startsWith('tel:');
        const isSms = href.startsWith('sms:');

        // 获取位置
        const rect = a.getBoundingClientRect();

        results.push({
          // 基本信息
          href: absoluteHref,
          text: getTextContent(a) || '(无文本)',
          
          // 链接类型
          type: isPDF ? 'pdf' : 
                isExternal ? 'external' : 
                isAnchor ? 'anchor' : 
                isTel ? 'tel' : 
                isSms ? 'sms' : 'internal',
          
          // 层级信息
          hierarchy: {
            fullPath: hierarchy,
            semanticPath: semanticPath,
            depth: hierarchy.length,
            rootTag: hierarchy[0]?.tag || 'html',
            containerId: hierarchy.find(h => h.id)?.id || null,
            containerClass: hierarchy.find(h => h.class?.length > 0)?.class || null,
            containerRole: hierarchy.find(h => h.role)?.role || null,
            section: hierarchy.find(h => h['data-section'])?.['data-section'] || null,
            category: hierarchy.find(h => h['data-category'])?.['data-category'] || null
          },
          
          // 链接属性
          attributes: {
            id: a.id || null,
            class: a.className || null,
            target: a.target || null,
            title: a.getAttribute('title') || null,
            ariaLabel: a.getAttribute('aria-label') || null,
            rel: a.getAttribute('rel') || null
          },
          
          // 位置信息
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isVisible: rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight
          }
        });
      });

      // 按垂直位置排序
      results.sort((a, b) => a.position.y - b.position.y);

      return results;
    }, maxDepth, includePDF);

    // 统计
    const stats = {
      total: linkData.length,
      byType: {
        internal: linkData.filter(l => l.type === 'internal').length,
        external: linkData.filter(l => l.type === 'external').length,
        pdf: linkData.filter(l => l.type === 'pdf').length,
        anchor: linkData.filter(l => l.type === 'anchor').length,
        tel: linkData.filter(l => l.type === 'tel').length
      },
      withText: linkData.filter(l => l.text !== '(无文本)').length,
      visible: linkData.filter(l => l.position.isVisible).length
    };

    // 输出结果
    console.log('='.repeat(80));
    console.log('📊 提取完成\n');
    
    console.log('统计:');
    console.log(`  总链接数：${stats.total}`);
    console.log(`  内部链接：${stats.byType.internal}`);
    console.log(`  外部链接：${stats.byType.external}`);
    console.log(`  PDF 链接：${stats.byType.pdf}`);
    console.log(`  锚点链接：${stats.byType.anchor}`);
    console.log(`  有文本：${stats.withText}`);
    console.log(`  可见链接：${stats.visible}\n`);

    // 显示 PDF 链接
    const pdfLinks = linkData.filter(l => l.type === 'pdf');
    if (pdfLinks.length > 0) {
      console.log(`📄 PDF 链接 (${pdfLinks.length} 个):\n`);
      pdfLinks.forEach((l, i) => {
        console.log(`${i + 1}. ${l.text}`);
        console.log(`   ${l.href}`);
        console.log(`   层级：${l.hierarchy.semanticPath.join(' > ')}\n`);
      });
    }

    // 显示层级示例
    console.log('\n📋 链接层级示例:\n');
    console.log('-'.repeat(80));
    
    linkData.slice(0, 20).forEach((link, i) => {
      console.log(`${i + 1}. ${link.text.substring(0, 50)}${link.text.length > 50 ? '...' : ''}`);
      console.log(`   类型：${link.type}`);
      console.log(`   层级深度：${link.hierarchy.depth}`);
      console.log(`   语义路径：${link.hierarchy.semanticPath.join(' > ')}`);
      console.log(`   容器 ID: ${link.hierarchy.containerId || '-'}`);
      console.log(`   容器 Class: ${link.hierarchy.containerClass?.join('.') || '-'}`);
      console.log(`   Section: ${link.hierarchy.section || '-'}`);
      console.log('');
    });

    // 保存结果
    const output = {
      url,
      timestamp: new Date().toISOString(),
      stats,
      links: linkData,
      pdfLinks: pdfLinks
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
  const includePDF = process.argv[3] !== 'false';

  if (!url) {
    console.log('用法：node extract-links-hierarchy.js <url> [includePDF=true]');
    console.log('示例：node extract-links-hierarchy.js https://example.com');
    console.log('       node extract-links-hierarchy.js https://example.com false');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'crawl-output', Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });

  extractLinksHierarchy(url, { includePDF, outputDir })
    .then(results => {
      // 完整 JSON
      fs.writeFileSync(
        path.join(outputDir, 'links-hierarchy.json'), 
        JSON.stringify(results, null, 2)
      );
      
      // 简化版（只含关键信息）
      const simpleLinks = results.links.map(l => ({
        href: l.href,
        text: l.text,
        type: l.type,
        semanticPath: l.hierarchy.semanticPath.join(' > '),
        depth: l.hierarchy.depth,
        section: l.hierarchy.section,
        containerId: l.hierarchy.containerId
      }));
      fs.writeFileSync(
        path.join(outputDir, 'links-simple.json'), 
        JSON.stringify(simpleLinks, null, 2)
      );
      
      // Markdown 报告
      const mdContent = `# 链接层级提取报告

**URL:** ${url}
**时间:** ${results.timestamp}

## 统计

| 类型 | 数量 |
|------|------|
| 总链接 | ${results.stats.total} |
| 内部链接 | ${results.stats.byType.internal} |
| 外部链接 | ${results.stats.byType.external} |
| PDF 链接 | ${results.stats.byType.pdf} |
| 锚点链接 | ${results.stats.byType.anchor} |

## PDF 链接

${results.pdfLinks.map(l => `- [${l.text}](${l.href})`).join('\n') || '无'}

## 链接列表

| # | 文本 | 类型 | 层级路径 | 深度 |
|---|------|------|----------|------|
${results.links.map((l, i) => `| ${i + 1} | ${l.text} | ${l.type} | ${l.hierarchy.semanticPath.join(' > ')} | ${l.hierarchy.depth} |`).join('\n')}
`;
      fs.writeFileSync(path.join(outputDir, 'report.md'), mdContent);
      
      // CSV
      const csvContent = `#,文本，链接，类型，语义路径，深度，Section，容器 ID\n` + 
        results.links.map((l, i) => 
          `${i + 1},"${l.text.replace(/"/g, '""')}",${l.href},${l.type},"${l.hierarchy.semanticPath.join(' > ')}",${l.hierarchy.depth},${l.hierarchy.section || ''},${l.hierarchy.containerId || ''}`
        ).join('\n');
      fs.writeFileSync(path.join(outputDir, 'links.csv'), csvContent);

      console.log('\n💾 结果已保存:');
      console.log(`   ${outputDir}/links-hierarchy.json  (完整数据)`);
      console.log(`   ${outputDir}/links-simple.json     (简化版)`);
      console.log(`   ${outputDir}/report.md             (Markdown 报告)`);
      console.log(`   ${outputDir}/links.csv             (Excel 可用)\n`);
      
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { extractLinksHierarchy };
