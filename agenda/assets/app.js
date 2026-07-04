/**
 * 议程分享平台 · 静态版核心数据层
 * 数据存储于 localStorage，支持导入/导出 JSON，兼容 Vercel/Cloudflare Pages/GitHub Pages
 */
(function (global) {
  'use strict';
  const STORAGE_KEY = 'agenda_share_data_v1';

  // ===== 主题字段定义（与 Flask 版 THEME_FIELDS 一致，34 项） =====
  const THEME_FIELDS = [
    {group:'页面底色',key:'page_bg',label:'页面背景',desc:'整页底色',def:'#f5f0e8',type:'fill'},
    {group:'页面底色',key:'card_bg',label:'卡片背景',desc:'日程卡/图例卡底色',def:'#ffffff',type:'fill'},
    {group:'页面底色',key:'border',label:'分隔线/边框',desc:'卡片与导航边线',def:'#e0d8c8',type:'fill'},
    {group:'页面底色',key:'text_body',label:'正文文字',desc:'页面正文',def:'#1a1a2e',type:'text'},
    {group:'页面底色',key:'text_muted',label:'次要文字',desc:'副标题/说明',def:'#666666',type:'text'},
    {group:'头图封面区',key:'hero_primary',label:'主色（深）',desc:'头图渐变起色',def:'#0a1628',type:'fill'},
    {group:'头图封面区',key:'hero_primary_light',label:'主色浅',desc:'头图渐变中色',def:'#1a2744',type:'fill'},
    {group:'头图封面区',key:'hero_primary_lighter',label:'主色更浅',desc:'头图渐变止色',def:'#2a3a5c',type:'fill'},
    {group:'头图封面区',key:'hero_accent_bg',label:'强调色背景',desc:'角标/徽章背景（统一）',def:'#c9a96e',type:'fill'},
    {group:'头图封面区',key:'hero_title_text',label:'标题文字',desc:'头图大标题',def:'#ffffff',type:'text'},
    {group:'头图封面区',key:'hero_sub_text',label:'副标题文字',desc:'头图副标题',def:'#9aa3b8',type:'text'},
    {group:'头图封面区',key:'hero_accent_text',label:'强调色文字',desc:'角标/信息值文字（统一）',def:'#c9a96e',type:'text'},
    {group:'日程时间轴',key:'tl_accent',label:'强调色',desc:'圆点/左边框/时间标签背景（统一）',def:'#c9a96e',type:'fill'},
    {group:'日程时间轴',key:'tl_gold',label:'茶歇金色',desc:'茶歇/用餐高亮',def:'#d4af37',type:'fill'},
    {group:'日程时间轴',key:'tl_day_num_bg',label:'日期序号背景',desc:'日程编号圆背景',def:'#0a1628',type:'fill'},
    {group:'日程时间轴',key:'tl_day_title_text',label:'日程标题文字',desc:'第N天标题',def:'#0a1628',type:'text'},
    {group:'日程时间轴',key:'tl_time_text',label:'时间标签文字',desc:'时间徽章文字',def:'#c9a96e',type:'text'},
    {group:'日程时间轴',key:'tl_title_text',label:'事项标题文字',desc:'议程事项标题',def:'#0a1628',type:'text'},
    {group:'日程时间轴',key:'tl_pres_text',label:'主讲/要点文字',desc:'主讲人与要点列表',def:'#666666',type:'text'},
    {group:'日程时间轴',key:'tl_day_num_text',label:'日期序号文字',desc:'日程编号文字',def:'#ffffff',type:'text'},
    {group:'参会人员区',key:'att_section_bg',label:'区块背景',desc:'参会区整体背景',def:'#0a1628',type:'fill'},
    {group:'参会人员区',key:'att_accent_bg',label:'强调色背景',desc:'分组边框/徽章/部门标签（统一）',def:'#c9a96e',type:'fill'},
    {group:'参会人员区',key:'att_section_title',label:'区块标题文字',desc:'参会人员大标题',def:'#ffffff',type:'text'},
    {group:'参会人员区',key:'att_name_text',label:'姓名文字',desc:'参会人姓名',def:'#ffffff',type:'text'},
    {group:'参会人员区',key:'att_role_text',label:'职责文字',desc:'人员职责描述',def:'#9aa3b8',type:'text'},
    {group:'参会人员区',key:'att_accent_text',label:'强调色文字',desc:'徽章/部门标签文字（统一）',def:'#c9a96e',type:'text'},
    {group:'导航与强调',key:'nav_bg',label:'导航栏背景',desc:'吸顶日程导航',def:'#ffffff',type:'fill'},
    {group:'导航与强调',key:'nav_chip_bg',label:'导航项背景',desc:'未选中导航项',def:'#f5f0e8',type:'fill'},
    {group:'导航与强调',key:'nav_chip_active_bg',label:'选中项背景',desc:'当前选中导航项',def:'#0a1628',type:'fill'},
    {group:'导航与强调',key:'fab_start',label:'悬浮按钮起色',desc:'分享按钮渐变起',def:'#c9a96e',type:'fill'},
    {group:'导航与强调',key:'fab_end',label:'悬浮按钮止色',desc:'分享按钮渐变止',def:'#d4af37',type:'fill'},
    {group:'导航与强调',key:'nav_chip_text',label:'导航项文字',desc:'未选中导航项文字',def:'#666666',type:'text'},
    {group:'导航与强调',key:'nav_chip_active_text',label:'选中项文字',desc:'选中导航项文字',def:'#ffffff',type:'text'},
    {group:'导航与强调',key:'fab_text',label:'悬浮按钮图标',desc:'分享按钮图标色',def:'#0a1628',type:'text'},
  ];

  // ===== 工具函数 =====
  function hexToRgb(hex) {
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    try {
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      return r + ',' + g + ',' + b;
    } catch (e) { return '201,169,110'; }
  }
  function lighten(hex, amount) {
    amount = amount || 0.25;
    let h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    try {
      let r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      r = Math.round(r + (255 - r) * amount); g = Math.round(g + (255 - g) * amount); b = Math.round(b + (255 - b) * amount);
      return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    } catch (e) { return hex; }
  }

  // ===== 根据自定义颜色派生 CSS 变量集（同版面同类元素合并） =====
  function deriveCustomTheme(ct) {
    ct = ct || {};
    const defaults = {};
    THEME_FIELDS.forEach(f => { defaults[f.key] = f.def; });
    const g = k => ct[k] || defaults[k] || '#000000';
    const accent = g('tl_accent');
    const attAccentBg = g('att_accent_bg');
    const attAccentText = g('att_accent_text');
    const heroAccentBg = g('hero_accent_bg');
    const heroAccentText = g('hero_accent_text');
    return {
      '--primary': g('hero_primary'), '--primary-light': g('hero_primary_light'), '--primary-lighter': g('hero_primary_lighter'),
      '--accent': accent, '--accent-light': lighten(accent, 0.4), '--accent-rgb': hexToRgb(accent), '--gold': g('tl_gold'),
      '--bg': g('page_bg'), '--card-bg': g('card_bg'), '--text': g('text_body'), '--text-light': g('text_muted'), '--border': g('border'),
      '--hero-title-text': g('hero_title_text'), '--hero-sub-text': g('hero_sub_text'),
      '--hero-accent-bg': heroAccentBg, '--hero-accent-text': heroAccentText,
      '--tl-accent': accent, '--tl-time-bg': accent, '--tl-time-text': g('tl_time_text'), '--tl-title-text': g('tl_title_text'),
      '--tl-pres-text': g('tl_pres_text'), '--tl-gold': g('tl_gold'),
      '--tl-day-num-bg': g('tl_day_num_bg'), '--tl-day-num-text': g('tl_day_num_text'), '--tl-day-title-text': g('tl_day_title_text'),
      '--att-section-bg': g('att_section_bg'), '--att-section-title': g('att_section_title'),
      '--att-accent-bg': attAccentBg, '--att-party-border': attAccentBg, '--att-badge-bg': attAccentBg, '--att-dept-bg': attAccentBg,
      '--att-accent-text': attAccentText, '--att-badge-text': attAccentText, '--att-dept-text': attAccentText,
      '--att-name-text': g('att_name_text'), '--att-role-text': g('att_role_text'),
      '--nav-bg': g('nav_bg'), '--nav-chip-bg': g('nav_chip_bg'), '--nav-chip-text': g('nav_chip_text'),
      '--nav-chip-active-bg': g('nav_chip_active_bg'), '--nav-chip-active-text': g('nav_chip_active_text'),
      '--fab-start': g('fab_start'), '--fab-end': g('fab_end'), '--fab-text': g('fab_text'),
    };
  }

  // ===== 数据管理 =====
  let _defaultData = null;
  async function loadDefaultData() {
    if (_defaultData) return _defaultData;
    try {
      const resp = await fetch('default-data.json');
      _defaultData = await resp.json();
    } catch (e) {
      console.error('加载默认数据失败', e);
      _defaultData = { settings: {}, hero: {}, days: [], parties: [], legends: [], footer: '' };
    }
    return _defaultData;
  }
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  async function getData() {
    return loadData() || await loadDefaultData();
  }
  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ===== 应用主题到页面 =====
  function applyTheme(settings) {
    const html = document.documentElement;
    const theme = (settings && settings.theme) || 'gold';
    html.setAttribute('data-theme', theme);
    if (theme === 'custom' && settings.custom_theme) {
      const vars = deriveCustomTheme(settings.custom_theme);
      const styleId = 'custom-theme-vars';
      let el = document.getElementById(styleId);
      if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el); }
      const css = '[data-theme="custom"]{' + Object.entries(vars).map(([k, v]) => k + ':' + v).join(';') + '}';
      el.textContent = css;
    } else {
      const el = document.getElementById('custom-theme-vars');
      if (el) el.remove();
    }
  }

  // ===== 导出 / 导入 =====
  function exportData() {
    return JSON.stringify(loadData() || _defaultData, null, 2);
  }
  function importData(jsonStr) {
    const data = JSON.parse(jsonStr);
    saveData(data);
    return data;
  }

  // ===== 分享 URL =====
  function getShareUrl() {
    // 优先使用后台配置的 public_base_url
    const data = loadData() || _defaultData;
    const base = (data.settings || {}).public_base_url || '';
    if (base) {
      const b = base.trim().replace(/\/+$/, '');
      return b + '/index.html';
    }
    // 自动推断：当前地址
    return window.location.origin + window.location.pathname.replace(/\/admin\.html$/, '/') + 'index.html';
  }

  function getAppUrl() {
    // 自包含应用页地址（用于二维码）
    const data = loadData() || _defaultData;
    const base = (data.settings || {}).public_base_url || '';
    if (base) {
      return base.trim().replace(/\/+$/, '') + '/app';
    }
    return window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'app';
  }

  global.AgendaApp = {
    THEME_FIELDS,
    hexToRgb, lighten, deriveCustomTheme,
    loadData, saveData, getData, resetData, loadDefaultData,
    applyTheme, exportData, importData, getShareUrl, getAppUrl,
    STORAGE_KEY,
  };
})(window);
