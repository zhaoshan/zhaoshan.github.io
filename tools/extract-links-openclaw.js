#!/usr/bin/env node
/**
 * 网站链接提取工具 - OpenClaw Browser 版本
 * 使用 OpenClaw 内置 browser 工具模拟点击并获取链接
 * 
 * 用法：node extract-links-openclaw.js <url>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function extractLinks(url) {
  console.log(`🔍 开始分析：${url}\n`);
  
  const results = {
    url,
    timestamp: new Date().toISOString(),
    links: [],
    buttons: [],
    interactiveElements: []
  };

  try {
    // 使用 browser 工具的 evaluate 功能执行 JavaScript
    const script = `
      () => {
        const data = {
          links: [],
          buttons: [],
          interactiveElements: [],
          allTexts: []
        };

        // 1. 提取所有链接
        document.querySelectorAll('a[href]').forEach(el => {
          const href = el.getAttribute('href');
          const text = (el.textContent || '').trim();
          
          if (href && href !== '#' && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
            // 转换为绝对路径
            let absoluteHref = href;
            if (!href.startsWith('http')) {
              absoluteHref = new URL(href, window.location.href).href;
            }
            
            data.links.push({
              href: absoluteHref,
              text: text.substring(0, 200),
              id: el.id || null,
              class: el.className || null,
              target: el.target || null
            });
          }
        });

        // 2. 提取所有按钮
        document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]').forEach(el => {
          data.buttons.push({
            text: (el.textContent || el.value || '').trim().substring(0, 200),
            id: el.id || null,
            class: el.className || null,
            tagName: el.tagName,
            type: el.type || null
          });
        });

        // 3. 提取所有可交互元素
        document.querySelectorAll('[onclick], [tabindex="0"], [role="link"], [role="menuitem"], [role="tab"]').forEach(el => {
          data.interactiveElements.push({
            tagName: el.tagName,
            id: el.id || null,
            class: el.className || null,
            text: (el.textContent || '').trim().substring(0, 100),
            onclick: el.getAttribute('onclick') || null,
            tabindex: el.getAttribute('tabindex') || null,
            role: el.getAttribute('role') || null
          });
        });

        // 4. 提取所有表单
        document.querySelectorAll('form').forEach((form, i) => {
          const formInputs = [];
          form.querySelectorAll('input, select, textarea').forEach(input => {
            formInputs.push({
              type: input.type || input.tagName,
              name: input.name || null,
              id: input.id || null,
              placeholder: input.placeholder || null
            });
          });
          
          data.interactiveElements.push({
            tagName: 'FORM',
            id: form.id || \`form-\${i}\`,
            class: form.className || null,
            action: form.action || null,
            method: form.method || 'GET',
            inputs: formInputs.length
          });
        });

        // 5. 提取导航菜单
        document.querySelectorAll('nav, [role="navigation"], .nav, .menu').forEach(nav => {
          const navLinks = [];
          nav.querySelectorAll('a[href]').forEach(a => {
            navLinks.push({
              href: a.getAttribute('href'),
              text: (a.textContent || '').trim()
            });
          });
          
          if (navLinks.length > 0) {
            data.interactiveElements.push({
              tagName: 'NAV',
              id: nav.id || null,
              class: nav.className || null,
              linkCount: navLinks.length,
              links: navLinks
            });
          }
        });

        // 6. 提取所有可见文本（用于分析）
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div').forEach(el => {
          const text = (el.textContent || '').trim();
          if (text.length > 0 && text.length < 500) {
            data.allTexts.push({
              tag: el.tagName,
              text: text.substring(0, 200),
              class: el.className || null
            });
          }
        });

        return data;
      }
    `;

    // 这里需要通过 OpenClaw 的 browser 工具执行
    // 由于这是在脚本中，我们输出指令让用户执行
    console.log('📋 请执行以下 OpenClaw browser 命令:\n');
    console.log(`browser action=snapshot targetUrl="${url}" refs="aria"`);
    console.log('\n然后执行:\n');
    console.log(`browser action=act ref=<element_ref> kind=click`);
    console.log('\n或者使用以下完整脚本...\n');

    // 生成一个可直接运行的 shell 脚本
    const shellScript = `#!/bin/bash
# 网站链接提取脚本

URL="${url}"

echo "🔍 打开网站并获取快照..."
openclaw browser action=open targetUrl="\$URL"

echo "⏳ 等待页面加载..."
sleep 3

echo "📸 获取页面元素快照..."
openclaw browser action=snapshot refs="aria"

echo ""
echo "✅ 快照已获取，查看上面的元素列表"
echo "💡 使用 'openclaw browser action=act ref=<ref> kind=click' 点击元素"
`;

    const shellPath = path.join(process.env.HOME || '', '.openclaw/workspace/tools/extract-links.sh');
    fs.writeFileSync(shellPath, shellScript);
    fs.chmodSync(shellPath, '755');
    
    console.log(`\n📁 已生成可执行脚本：${shellPath}`);
    console.log(`运行：bash ${shellPath}\n`);

    return results;

  } catch (error) {
    console.error(` 错误：${error.message}`);
    throw error;
  }
}

// 命令行执行
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.log('用法：node extract-links-openclaw.js <url>');
    console.log('示例：node extract-links-openclaw.js https://example.com');
    process.exit(1);
  }

  extractLinks(url)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { extractLinks };
