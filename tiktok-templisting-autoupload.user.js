// ==UserScript==
// @name         TikTok Live小助手 / TikTok Live Helper
// @namespace    lok.laliquidation
// @version      7.0
// @description  TikTok LIVE Manager：商品庫 + 一鍵自動上架 temporary listing（繁/简/EN）
// @match        https://shop.tiktok.com/streamer/live/*
// @updateURL    https://raw.githubusercontent.com/bunnyle/tiktok-templisting-autoupload/main/tiktok-templisting-autoupload.user.js
// @downloadURL  https://raw.githubusercontent.com/bunnyle/tiktok-templisting-autoupload/main/tiktok-templisting-autoupload.user.js
// @homepageURL  https://github.com/bunnyle/tiktok-templisting-autoupload
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ---------------- 基本工具 ---------------- */
  const KEY = 'ttfill_queue_v1';
  const LOG = (...a) => console.log('[TT填表]', ...a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => (s || '').replace(/[*＊]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const visible = (el) => {
    if (!el || !el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  };
  async function waitFor(fn, timeout = 5000, step = 100) {
    const t = Date.now();
    while (Date.now() - t < timeout) {
      try { const r = fn(); if (r) return r; } catch (e) { /* 繼續等 */ }
      await sleep(step);
    }
    return null;
  }

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { rows: [], idx: 0, auto: false }; }
    catch (e) { return { rows: [], idx: 0, auto: false }; }
  }
  function saveState() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 無所謂 */ } }
  let state = loadState();
  let busy = false;

  /* ---------------- 語言 / Language ----------------
     L('繁體', 'English')：简体由繁體自動轉換 */
  const T2S = {"並": "并", "併": "并", "來": "来", "個": "个", "備": "备", "傳": "传", "價": "价", "儲": "储", "內": "内", "兩": "两", "別": "别", "刪": "删", "剛": "刚", "動": "动", "匯": "汇", "區": "区", "問": "问", "啟": "启", "單": "单", "嗎": "吗", "嚴": "严", "圖": "图", "場": "场", "夠": "够", "實": "实", "寫": "写", "寬": "宽", "尋": "寻", "對": "对", "層": "层", "帳": "帐", "帶": "带", "幟": "帜", "幾": "几", "庫": "库", "張": "张", "彈": "弹", "後": "后", "徑": "径", "從": "从", "態": "态", "應": "应", "換": "换", "擇": "择", "擊": "击", "擋": "挡", "據": "据", "擠": "挤", "擬": "拟", "敗": "败", "數": "数", "斷": "断", "於": "于", "時": "时", "暫": "暂", "會": "会", "東": "东", "桿": "杆", "條": "条", "構": "构", "標": "标", "樣": "样", "機": "机", "橫": "横", "檔": "档", "檢": "检", "欄": "栏", "歷": "历", "殘": "残", "殼": "壳", "沒": "没", "淺": "浅", "測": "测", "準": "准", "濾": "滤", "瀏": "浏", "為": "为", "無": "无", "狀": "状", "獨": "独", "現": "现", "產": "产", "畫": "画", "當": "当", "發": "发", "監": "监", "盤": "盘", "確": "确", "碼": "码", "種": "种", "稱": "称", "穩": "稳", "簡": "简", "籤": "签", "約": "约", "紅": "红", "級": "级", "結": "结", "絕": "绝", "給": "给", "統": "统", "經": "经", "網": "网", "緊": "紧", "編": "编", "縮": "缩", "繼": "继", "續": "续", "腦": "脑", "舊": "旧", "蓋": "盖", "處": "处", "號": "号", "螢": "萤", "補": "补", "裝": "装", "裡": "里", "製": "制", "複": "复", "見": "见", "覽": "览", "訂": "订", "訊": "讯", "記": "记", "設": "设", "許": "许", "診": "诊", "評": "评", "試": "试", "話": "话", "該": "该", "認": "认", "語": "语", "誤": "误", "調": "调", "請": "请", "論": "论", "謂": "谓", "譯": "译", "議": "议", "讀": "读", "變": "变", "貼": "贴", "資": "资", "賣": "卖", "載": "载", "輪": "轮", "輯": "辑", "輸": "输", "轉": "转", "這": "这", "連": "连", "進": "进", "過": "过", "遠": "远", "遲": "迟", "選": "选", "還": "还", "邊": "边", "鈕": "钮", "鋰": "锂", "錄": "录", "錨": "锚", "錯": "错", "鍵": "键", "鎖": "锁", "鐘": "钟", "長": "长", "閃": "闪", "閉": "闭", "開": "开", "間": "间", "關": "关", "隨": "随", "雙": "双", "電": "电", "響": "响", "頁": "页", "頂": "顶", "項": "项", "預": "预", "領": "领", "頭": "头", "頻": "频", "題": "题", "顏": "颜", "類": "类", "顯": "显", "飾": "饰", "餘": "余", "體": "体", "麵": "面", "點": "点", "齊": "齐"};
  const T2S_PHRASES = [['搜尋', '搜索'], ['滑鼠', '鼠标'], ['資料', '数据'], ['點選', '点击'], ['全螢幕', '全屏'], ['螢幕', '屏幕']];
  const toHans = (t) => { let r = String(t); for (const [a, b] of T2S_PHRASES) r = r.split(a).join(b); return r.replace(/[\u3400-\u9fff]/g, (c) => T2S[c] || c); };
  let langOverride = null; // 評論窗可以用自己的語言
  const lang = () => langOverride || state.lang || 'hant';
  const L = (hant, en) => (lang() === 'en' ? en : lang() === 'hans' ? toHans(hant) : hant);
  const E = (hant, en, retry) => Object.assign(new Error(L(hant, en)), { retry: !!retry });

  /* ---------------- 解析 Excel 貼上內容 ----------------
     每行（Tab 分隔）: 名字 | 重量 | Height | Width | Length | Category
     即 Excel 的 E:J 欄。若整行 A:J 一起複製（>=10 欄），自動取 E:J。 */
  function parse(text) {
    const rows = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let c = line.split('\t').map((s) => s.trim());
      if (c.length >= 10) c = c.slice(4, 10);
      if (c.length < 5) continue;
      const [name, weight, h, w, l, cat = ''] = c;
      if (!name || isNaN(parseFloat(weight))) continue; // 表頭或空行
      rows.push({ name, weight, h, w, l, cat, status: '待填' });
    }
    return rows;
  }

  /* ---------------- 頁面操作 ---------------- */
  function setVal(input, val, { blur = true } = {}) {
    input.focus();
    const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(input, String(val));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (blur) {
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      input.blur();
    }
  }

  // 模擬真實鍵盤輸入（某些數字輸入框只認這種）
  function typeVal(input, val) {
    input.focus();
    input.select();
    if (!document.execCommand('insertText', false, String(val))) setVal(input, val, { blur: false });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    input.blur();
  }

  function realClick(el) {
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    for (const t of ['pointerover', 'mouseover', 'mouseenter', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const Ev = t.startsWith('pointer') && window.PointerEvent ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ev(t, o));
    }
  }

  // 找「最深一層」文字剛好等於 text 的元素
  function findByText(root, text, { exact = true } = {}) {
    const T = norm(text);
    const out = [];
    for (const e of root.querySelectorAll('*')) {
      if (e.closest('#ttfill-panel')) continue;
      if (!visible(e)) continue;
      const t = norm(e.innerText || e.textContent);
      const ok = exact ? t === T : t.includes(T);
      if (!ok) continue;
      const childHas = [...e.children].some((c) => {
        const ct = norm(c.innerText || c.textContent);
        return exact ? ct === T : ct.includes(T);
      });
      if (!childHas) out.push(e);
    }
    return out;
  }

  // 彈窗裡的 Submit（可能是 <button>，也可能是 div/span）
  function findSubmit(root) {
    const t = findByText(root, 'Submit')[0];
    if (!t) return null;
    return t.closest('button, [role="button"]') || t;
  }

  // 標題可能帶「Auction guide」等字，所以用「包含」來找；再往上找同時有 Submit 和輸入框的容器
  function getDialog() {
    const heads = findByText(document.body, 'Create temporary listing', { exact: false });
    for (const h of heads) {
      let el = h;
      while (el && el !== document.body && el !== document.documentElement) {
        if (findSubmit(el) && el.querySelector('input, textarea')) return el;
        el = el.parentElement;
      }
    }
    return null;
  }

  // 診斷：把頁面結構摘要複製到剪貼板，方便發給 Claude
  function diagnose() {
    const d = [];
    const brief = (e) => e ? `${e.tagName.toLowerCase()}.${String(e.className || '').slice(0, 60)} [${norm(e.innerText).slice(0, 60)}]` : 'null';
    d.push('url: ' + location.href + (window.top === window ? '' : ' (在 iframe 內)'));
    d.push('iframes: ' + [...document.querySelectorAll('iframe')].map((f) => f.src || '(無src)').join(' | '));
    d.push('shadow hosts: ' + [...document.querySelectorAll('*')].filter((e) => e.shadowRoot).map((e) => e.tagName).join(','));
    const heads = findByText(document.body, 'Create temporary listing', { exact: false });
    d.push('標題元素: ' + heads.length + ' → ' + heads.slice(0, 3).map(brief).join(' || '));
    const subs = findByText(document.body, 'Submit');
    d.push('Submit 元素: ' + subs.length + ' → ' + subs.slice(0, 3).map((s) => brief(s) + ' closest=' + brief(s.closest('button,[role=button]'))).join(' || '));
    if (heads[0]) {
      const chain = []; let el = heads[0];
      for (let i = 0; i < 12 && el; i++, el = el.parentElement) chain.push(`${i}:${el.tagName.toLowerCase()}.${String(el.className || '').slice(0, 40)} inputs=${el.querySelectorAll('input,textarea').length} submit=${!!findSubmit(el)}`);
      d.push('標題往上:\n  ' + chain.join('\n  '));
    }
    const dlg = getDialog();
    d.push('getDialog: ' + brief(dlg));
    const root = dlg || document.body;
    for (const lab of ['Product name', 'Category', 'Package weight', 'Package dimensions']) {
      const labs = findByText(root, lab);
      const box = fieldBox(root, lab);
      d.push(`欄位 ${lab}: 標籤=${labs.length} ${labs[0] ? brief(labs[0]) : ''} 容器輸入框=${box ? textInputs(box).length : '無'}`);
    }
    const ins = [...document.querySelectorAll('input,textarea')].filter(visible);
    d.push('可見輸入框 ' + ins.length + ': ' + ins.slice(0, 25).map((i) => `${i.tagName.toLowerCase()}[${i.type}|ph=${i.placeholder || ''}|v=${String(i.value).slice(0, 25)}${i.readOnly ? '|ro' : ''}]`).join(' '));
    return d.join('\n');
  }

  // 由欄位標題往上找，第一個包含輸入框的容器
  function fieldBox(root, label) {
    const has = (el) => el.querySelector('input, textarea, [role="combobox"], [class*="select"], [class*="cascader"]');
    for (const lab of findByText(root, label)) {
      // TikTok 用的是 Arco Design 表單：每個欄位包在 .arco-form-item 裡
      const item = lab.closest('.arco-form-item, [class*="form-item"]');
      if (item && root.contains(item) && has(item)) return item;
      let el = lab.parentElement;
      for (let i = 0; i < 12 && el && el !== root; i++, el = el.parentElement) {
        if (has(el)) return el;
      }
    }
    return null;
  }

  function textInputs(box) {
    return [...box.querySelectorAll('input, textarea')].filter((i) =>
      visible(i) && !i.readOnly && !i.disabled && !['hidden', 'radio', 'checkbox'].includes(i.type));
  }

  const clickable = (e) => e.closest('button, [role="button"], [role="menuitem"], li, a, [class*="card"], [class*="item"]') || e;

  // 彈窗打開後表單要等一下才出現：等到 Product name 輸入框真的可以用
  const formReady = () => {
    const d = getDialog(); if (!d) return null;
    const b = fieldBox(d, 'Product name');
    return b && textInputs(b)[0] ? d : null;
  };

  // 點了「Temporary listing / product」之後：舊版直接打開彈窗；新版會彈出子選單「Create new / Choose from LIVE history」
  async function clickTempItem(item) {
    const before = new Set(findByText(document.body, 'Create new'));
    const inMenu = (e) => !!e.closest('[role="menu"], [role="menuitem"], [class*="dropdown"], [class*="Dropdown"], [class*="menu"], [class*="popover"], [class*="popup"], [class*="trigger"]');
    const createNew = () => {
      const all = findByText(document.body, 'Create new');
      return all.find((e) => !before.has(e)) || all.find(inMenu) || null;
    };
    const state = () => (formReady() ? 'dlg' : createNew() ? 'sub' : null);
    realClick(clickable(item));
    let r = await waitFor(state, 4000);
    if (!r) { // 子選單可能要滑鼠移上去才出現
      for (const t of ['pointerover', 'mouseover', 'mouseenter', 'mousemove']) item.dispatchEvent(new MouseEvent(t, { bubbles: true }));
      r = await waitFor(state, 3000);
    }
    if (r === 'sub') {
      const c = createNew();
      realClick(clickable(c));
    }
    return await waitFor(formReady, 12000);
  }

  async function openDialog() {
    if (getDialog()) {
      const r = await waitFor(formReady, 10000);
      if (r) return r;
    }
    let d;
    setMsg(L('正在打開 Create temporary listing…', 'Opening Create temporary listing…'));
    // A) 列表是空的時候，頁面中間有「Temporary auction」卡片
    const card = findByText(document.body, 'Temporary auction')[0] || findByText(document.body, 'Temporary listing')[0];
    if (card) {
      d = await clickTempItem(card);
      if (d) return d;
    }
    // B) 點右上角「+ Add」→ 下拉菜單「Temporary product / Temporary auction」
    const add = ([...findByText(document.body, 'Add'), ...findByText(document.body, '+ Add'), ...findByText(document.body, '+Add')])
      .map((e) => e.closest('button, [role="button"]') || e).find(visible);
    if (!add) throw E('找不到「+ Add」按鈕，請手動打開彈窗', 'Can\'t find the “+ Add” button — please open the listing window manually', true);
    realClick(add);
    const findItem = () => findByText(document.body, 'Temporary product')[0] ||
      findByText(document.body, 'Temporary auction')[0] || findByText(document.body, 'Temporary listing')[0];
    let item = await waitFor(findItem, 2500);
    if (!item) { // 有些下拉是滑鼠移上去才出現
      add.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      add.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      item = await waitFor(findItem, 2500);
    }
    if (!item) throw E('點了 + Add 但沒看到 Temporary listing，請手動打開彈窗', 'Clicked + Add but “Temporary listing” didn\'t appear — please open the window manually', true);
    d = await clickTempItem(item);
    if (!d) throw E('彈窗沒有打開，請手動打開後再按 ⌥F', 'The listing window didn\'t open — open it manually, then press ⌥F', true);
    return d;
  }

  async function setCategory(dlg, cat) {
    const parts = cat.split(/\s+[-–>]\s+/).map((s) => s.trim()).filter(Boolean);
    const lastRaw = parts[parts.length - 1];
    const last = norm(lastRaw);
    const full = parts.length > 1 ? norm(parts.join(' - ')) : null;
    const box = () => fieldBox(getDialog() || dlg, 'Category');
    // 只鎖定「顯示目前類目的那一行」：矮（<60px）、有文字、裡面沒有搜索框；取最深一層
    const getTrigger = (b) => cascaderView(b);
    // 只看選擇框本身顯示的文字（下拉列表可能也在同一容器裡）
    const isSet = () => {
      const b = box(); if (!b) return false;
      const cur = norm(getTrigger(b).innerText);
      return full ? cur === full || cur.endsWith(full) : cur === last || cur.endsWith(' - ' + last);
    };
    if (isSet()) return true;

    // 1) Recent categories 快捷標籤（只寫了最後一段時）
    if (!full) {
      const recentLab = findByText(dlg, 'Recent categories')[0];
      if (recentLab) {
        const chip = findByText(recentLab.parentElement, lastRaw)[0];
        if (chip) {
          realClick(chip);
          if (await waitFor(isSet, 1500)) return true;
        }
      }
    }

    // 2) 打開下拉 → 搜索 → 點結果
    const b = box();
    if (!b) throw E('找不到 Category 欄位', 'Can\'t find the Category field');
    const trigger = getTrigger(b);
    realClick(trigger);
    const search = await waitFor(() => {
      const all = [...document.querySelectorAll('input')].filter((i) =>
        visible(i) && /search/i.test(i.placeholder || '') && !/product/i.test(i.placeholder || ''));
      return all.find((i) => b.contains(i)) || all[0];
    }, 3000);
    if (!search) throw E('打不開 Category 搜索框', 'Couldn\'t open the Category search box');
    setVal(search, lastRaw, { blur: false });

    // 收集搜索結果（每行都是「A - B - C」這種路徑），取最深一層
    const singular = (x) => x.replace(/(es|s)$/, '');
    const key = singular(last);
    const pick = () => {
      const rows = [];
      for (const e of document.querySelectorAll('li, [role="option"], [class*="option"], [class*="item"], div, span')) {
        if (!visible(e) || trigger.contains(e) || e.contains(search) || e.closest('#ttfill-panel')) continue;
        const t = norm(e.innerText);
        if (!t || t.length > 300 || !t.includes(' - ')) continue;
        if (!t.includes(key) && !(full && t === full)) continue;
        rows.push(e);
      }
      const deep = rows.filter((e) => !rows.some((o) => o !== e && e.contains(o)));
      if (!deep.length) return null;
      const seg = (e) => { const p = norm(e.innerText).split(' - '); return p[p.length - 1]; };
      // 排序：完整路徑一樣 > 最後一段一樣 > 單複數差別 > 最後一段開頭一樣 > 第一個結果
      const tiers = [
        (e) => full && norm(e.innerText) === full,
        (e) => seg(e) === last,
        (e) => singular(seg(e)) === key,
        (e) => seg(e).startsWith(key) || key.startsWith(singular(seg(e))),
        (e) => seg(e).includes(key),
        () => true,
      ];
      for (let i = 0; i < tiers.length; i++) {
        const hit = deep.find(tiers[i]);
        if (hit) return { el: hit, exact: i <= 1 || (!full && i === 2) };
      }
      return null;
    };
    // 等搜索結果穩定一點再選
    let res = await waitFor(pick, 4000);
    if (res && !res.exact) { await sleep(600); res = pick() || res; }
    if (!res) throw E('Category 搜索沒有找到: ' + cat, 'Category not found in search: ' + cat);
    const option = res.el;
    const chosen = norm(option.innerText);
    const isChosen = () => {
      const bx = box(); if (!bx) return false;
      const cur = norm(getTrigger(bx).innerText);
      return cur === chosen || chosen.startsWith(cur.replace(/\.{3}$|…$/, '')) && cur.length > 10;
    };
    realClick(option);
    if (!(await waitFor(isChosen, 1500))) {
      realClick(option.closest('li, [role="option"], [class*="option"]') || option.parentElement);
      if (!(await waitFor(isChosen, 2000))) throw E('Category 沒有選上: ' + cat, 'Category didn\'t get selected: ' + cat);
    }
    await sleep(600);
    if (!isChosen()) throw E('Category 選上後又被清空: ' + cat, 'Category got cleared right after selecting: ' + cat);
    return res.exact ? true : option.innerText.trim();
  }

  async function fillRow(row) {
    const dlg = await openDialog();

    // 1. 名字
    const nameInput = await waitFor(() => { const b = fieldBox(getDialog() || dlg, 'Product name'); return b && textInputs(b)[0]; }, 8000);
    if (!nameInput) throw E('找不到 Product name 輸入框', 'Can\'t find the Product name field', true);
    setVal(nameInput, row.name);
    await sleep(1000); // 等 TikTok 根據名稱算完類目建議，避免選好的類目被蓋掉

    // 填完後再確認類目還在；被清空或改掉就從類目開始重來（最多 3 輪）
    const catBox = () => fieldBox(getDialog() || dlg, 'Category');
    const catNow = () => { const b = catBox(); return b ? norm(cascaderView(b).innerText) : ''; };
    const catOk = (want) => { const c = catNow(); return !!c && (c === want || (want.startsWith(c.replace(/(\.\.\.|…)$/, '')) && c.length > 10)); };
    for (let pass = 0; pass < 3; pass++) {
      // 2. 類目（選完類目 TikTok 會自動改重量/尺寸，所以放在重量前面）
      if (row.cat) {
        let r;
        try { r = await setCategory(getDialog() || dlg, resolveCat(row.cat)); }
        catch (e) { if (pass < 2 && /清空|cleared|沒有選上|didn't get selected/.test(e.message)) { LOG('類目重試', e.message); await sleep(800); continue; } throw e; }
        row.catNote = typeof r === 'string' ? r : '';
        row.catMissing = false;
        await sleep(900);
        row._catView = catNow();
        if (!row._catView) { if (pass < 2) { await sleep(800); continue; } throw E('類目選了但沒有顯示（被清空）', 'Category was selected but the box is empty (cleared)'); }
      } else {
        row.catNote = L('這個商品沒有設定類目', 'This product has no category set');
        row.catMissing = true;
      }

      // 數量：用商品庫和「預設數量」現在的設定（生成清單後才改的也會生效）
      { const lq = state.lib.find((x) => x.id === row.libId) || state.lib.find((x) => row.tpl && norm(x.name) === norm(row.tpl));
        row.qty = String((lq && lq.qty) || state.qty || row.qty || '').trim(); }
      // 3+4. 重量和尺寸：TikTok 選完類目後會延遲寫入「建議尺寸」，
      //       所以反覆核對，被蓋掉就重填，直到連續兩輪都正確
      const d2 = getDialog() || dlg;
      const hasDims = await waitFor(() => {
        const bx = fieldBox(getDialog() || d2, 'Package dimensions');
        return bx && textInputs(bx).length >= 3;
      }, 3000);
      if (!hasDims && !row.cat) {
        // 沒有類目、尺寸欄也還沒出現：只填重量，等你手動選類目
        const wb = fieldBox(getDialog() || d2, 'Package weight');
        const wi = wb && textInputs(wb).pop();
        if (wi) setVal(wi, row.weight);
        row.catNote = L(`沒有設定類目：請手動選類目，再填尺寸 H${row.h} × W${row.w} × L${row.l}`, `No category set: pick the category manually, then enter H${row.h} × W${row.w} × L${row.l}`);
        row.catMissing = true;
        return getDialog() || d2;
      }
      await sleep(800);

      const getFields = () => {
        const dd = getDialog() || d2;
        const wBox = fieldBox(dd, 'Package weight');
        const dimBox = fieldBox(dd, 'Package dimensions');
        const f = {};
        if (wBox) f.weight = textInputs(wBox).pop();
        const qBox = fieldBox(dd, 'Quantity');
        if (qBox && row.qty) f.qty = textInputs(qBox)[0];
        if (dimBox) {
          const ins = textInputs(dimBox).slice(-3);
          const byPh = (re) => ins.find((i) => re.test(i.placeholder || '') || re.test(i.getAttribute('aria-label') || ''));
          f.l = byPh(/length|長|长/i) || ins[0];
          f.w = byPh(/width|寬|宽/i) || ins[1];
          f.h = byPh(/height|高/i) || ins[2];
        }
        return f;
      };
      const same = (inp, v) => inp && Math.abs(parseFloat(inp.value) - parseFloat(v)) < 1e-6;
      let okRounds = 0;
      for (let round = 0; round < 12 && okRounds < 2; round++) {
        const f = getFields();
        if (!f.weight) throw E('找不到 Package weight 輸入框', 'Can\'t find the Package weight field');
        if (row.qty && !f.qty) throw E('找不到 Quantity 欄位', 'Can\'t find the Quantity field');
        if (!f.l || !f.w || !f.h) throw E('找不到 Package dimensions（Category 選了嗎？）', 'Can\'t find Package dimensions (is a Category selected?)');
        let allOk = true;
        for (const k of ['weight', 'l', 'w', 'h', ...(row.qty ? ['qty'] : [])]) {
          if (same(f[k], row[k])) continue;
          allOk = false;
          if (round < 3) setVal(f[k], row[k]);
          else typeVal(f[k], row[k]); // 備用方法：模擬鍵盤輸入
          await sleep(150);
        }
        okRounds = allOk ? okRounds + 1 : 0;
        await sleep(500);
      }
      if (okRounds < 2) {
        const f = getFields();
        throw E(`重量/尺寸填不進去（現在是 ${f.weight && f.weight.value} / ${f.h && f.h.value}×${f.w && f.w.value}×${f.l && f.l.value}）`, `Weight/dimensions won't stick (now ${f.weight && f.weight.value} / ${f.h && f.h.value}×${f.w && f.w.value}×${f.l && f.l.value})`);
      }

      // 5. Product compliance：含電池 → 選鋰電池選項；不含 → None of the above
      { const li0 = state.lib.find((x) => x.id === row.libId); if (li0) row.battery = !!li0.battery; }
      await setCompliance(getDialog() || d2, row.battery ? BATTERY_OPT : 'None of the above');
      // 6. 圖片（用商品庫裡「現在」的設定，生成清單後才改的圖片也會生效）
      const li = state.lib.find((x) => x.id === row.libId) || state.lib.find((x) => row.tpl && norm(x.name) === norm(row.tpl));
      if (li) row.img = li.img || '';
      await setImage(getDialog() || d2, row);
      if (!row.cat) return getDialog() || d2;
      // 連續確認約 1 秒：類目沒有被清空才算成功
      const want = row._catView;
      let stable = true;
      for (let k = 0; k < 4 && stable; k++) { if (!catOk(want)) stable = false; else await sleep(250); }
      if (stable) return getDialog() || d2;
      LOG('類目被清空或改掉了，重新選擇', { want, now: catNow(), pass });
      setMsg(L(`類目被清空了，重新選擇（第 ${pass + 2} 次）…`, `Category was cleared — selecting again (try ${pass + 2})…`), 'warn');
      await sleep(800);
    }
    throw E('類目選了但一直被 TikTok 清空（已重試 3 次）', 'The category kept getting cleared by TikTok (tried 3 times)');
  }

  /* ---------------- TikTok 類目庫：讀取、儲存、搜尋 ---------------- */
  const CAT_KEY = 'ttfill_cats_v1';
  function loadCats() {
    try { const c = JSON.parse(localStorage.getItem(CAT_KEY)); if (c && Array.isArray(c.paths)) return c; } catch (e) { /* 空 */ }
    return { paths: [], done: {}, updated: 0 };
  }
  let cats = loadCats();
  let catSet = new Set(cats.paths.map(norm));
  function saveCats() {
    try { localStorage.setItem(CAT_KEY, JSON.stringify(cats)); return true; }
    catch (e) { LOG('類目庫保存失敗', e); return false; }
  }
  function addCatPath(path) {
    const k = norm(path);
    if (catSet.has(k)) return false;
    catSet.add(k); cats.paths.push(path); return true;
  }

  // 搜尋類目：每個關鍵字都要出現；最後一段吻合的排前面
  function searchCats(q, limit = 30) {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length) return [];
    const res = [];
    for (const p of cats.paths) {
      const n = norm(p);
      if (!toks.every((t) => n.includes(t))) continue;
      const last = norm(lastSegOf(p));
      const k = toks.join(' ');
      const score = last === k ? 0 : last.startsWith(k) ? 1 : last.includes(k) ? 2 : toks.every((t) => last.includes(t)) ? 3 : 4;
      res.push([score, p.length, p]);
    }
    res.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return res.slice(0, limit).map((x) => x[2]);
  }
  const lastSegOf = (c) => (c || '').split(/\s+-\s+/).pop();

  // 簡寫類目（例如 "Patio Heater"）→ 類目庫裡唯一對得上的完整路徑
  function resolveCat(cat) {
    if (!cat || / - /.test(cat) || !cats.paths.length) return cat;
    const k = norm(cat), ks = k.replace(/(es|s)$/, '');
    const hits = cats.paths.filter((p) => { const l = norm(lastSegOf(p)); return l === k || l.replace(/(es|s)$/, '') === ks; });
    return hits.length === 1 ? hits[0] : cat;
  }

  /* ---- 備份檔：下載 / 讀取 ---- */
  const stamp = () => { const d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); };
  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  // 合併類目：已有的跳過；回傳新增數
  function mergeCats(c) {
    if (!c || !Array.isArray(c.paths)) return -1;
    let n = 0;
    for (const p of c.paths) if (typeof p === 'string' && addCatPath(p)) n++;
    Object.assign(cats.done, c.done || {});
    cats.updated = Math.max(cats.updated || 0, c.updated || 0) || Date.now();
    saveCats();
    return n;
  }
  // 合併商品庫：同名的更新，沒有的新增
  function mergeLib(lib) {
    if (!Array.isArray(lib)) return { added: 0, updated: 0 };
    let added = 0, updated = 0;
    for (const it of lib) {
      if (!it || !it.name) continue;
      const ex = state.lib.find((x) => norm(x.name) === norm(it.name));
      if (ex) { Object.assign(ex, { ...it, id: ex.id }); updated++; } else { state.lib.push({ ...it, id: uid() }); added++; }
    }
    saveState();
    return { added, updated };
  }

  /* ---- 讀取 TikTok 類目下拉（逐層展開） ---- */
  const catView = (b) => cascaderView(b);
  const catSearchInput = (b) => {
    const all = [...document.querySelectorAll('input')].filter((i) => visible(i) && /search/i.test(i.placeholder || '') && !/product/i.test(i.placeholder || ''));
    return all.find((i) => b.contains(i)) || all[0];
  };
  // 下拉面板 = 搜尋框往上、夠高、裡面有清單的那一層
  function catPopup(search) {
    let el = search && search.parentElement;
    while (el && el !== document.body) {
      if (el.getBoundingClientRect().height > 150 && catColumns(el).length) return el;
      el = el.parentElement;
    }
    return null;
  }
  // 一個「欄」：所有子元素都是一行一行的選項（高 18~70px、有文字、垂直排列）
  const isItem = (e) => {
    if (!visible(e) || e.querySelector('input')) return false;
    const r = e.getBoundingClientRect();
    return r.height >= 18 && r.height <= 70 && r.width > 60 && !!(e.innerText || '').trim();
  };
  const isDisabled = (el) => /disabled/i.test(el.className || '') || el.getAttribute('aria-disabled') === 'true';
  function catColumns(popup) {
    // TikTok 真實結構：每一層是 ul.core-cascader-list（或 arco-cascader-list），選項是 li
    const real = [...popup.querySelectorAll('ul[class*="cascader-list"]')].filter((u) => visible(u) && u.querySelector('li'));
    if (real.length) return real.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    const cols = [];
    for (const el of popup.querySelectorAll('*')) {
      const kids = [...el.children].filter(visible);
      if (!kids.length || !kids.every(isItem)) continue;
      if (kids.length >= 2) {
        const l0 = kids[0].getBoundingClientRect().left;
        if (!kids.every((k) => Math.abs(k.getBoundingClientRect().left - l0) < 3)) continue; // 橫排（例如麵包屑）不算
      } else if (el.getBoundingClientRect().width < 120) continue;
      if (/all categories/i.test(el.innerText) && kids.length < 8 && kids.some((k) => /all categories/i.test(k.innerText))) continue;
      cols.push(el);
    }
    // 去掉包在別的欄裡面的
    const out = cols.filter((c) => !cols.some((o) => o !== c && o.contains(c)));
    return out.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  }
  const colItems = (col) => {
    const lis = [...col.children].filter((e) => e.tagName === 'LI' && /cascader-list-item/.test(e.className || ''));
    const els = lis.length ? lis : [...col.children].filter(isItem);
    return els.map((el) => ({
      el,
      label: (el.innerText || el.textContent || '').split('\n')[0].trim(),
      kids: !!el.querySelector('.arco-icon-right, svg[class*="icon-right"], [class*="arrow"], [class*="expand"]') || (!lis.length && !!el.querySelector('svg')),
      disabled: isDisabled(el),
    })).filter((x) => x.label);
  };
  const colSig = (col) => colItems(col).map((x) => x.label).join('|');

  let catStop = false;
  async function crawlCats(full, progress) {
    catStop = false;
    if (full) cats.done = {};
    const dlg = await openDialog();
    const box = fieldBox(dlg, 'Category');
    if (!box) throw E('找不到 Category 欄位', 'Can\'t find the Category field');
    realClick(catView(box));
    const search = await waitFor(() => catSearchInput(box), 4000);
    if (!search) throw E('打不開 Category 下拉', 'Couldn\'t open the Category dropdown');
    if (search.value) { setVal(search, '', { blur: false }); await sleep(500); }
    const pop = () => catPopup(catSearchInput(box) || search);
    if (!(await waitFor(pop, 4000))) throw E('找不到類目清單（請按「類目診斷」並把結果發給 Claude）', 'Can\'t find the category list (press “Category diagnostics” and send the result to Claude)');
    // 回到最上層
    const goRoot = async () => {
      const p = pop(); if (!p) return;
      const a = findByText(p, 'All categories')[0] ||
        [...p.querySelectorAll('*')].find((e) => visible(e) && /^all categories\b/.test(norm(e.textContent)) && norm(e.textContent).length < 22);
      if (a) { realClick(a); await sleep(700); }
    };
    await goRoot();

    let found = 0, visitedParents = 0, expandFails = 0, anyExpanded = false;
    const findCol = (labels) => (pop() ? catColumns(pop()) : []).find((c) => { const s = new Set(colItems(c).map((x) => x.label)); return labels.every((l) => s.has(l)); });

    // 確保「這一層」的欄位在畫面上（欄位被擠掉時，用麵包屑回去）
    async function ensureCol(prefix, labels) {
      let col = findCol(labels);
      if (col) return col;
      // 從最上層一路點回來
      await goRoot();
      for (let d = 0; d < prefix.length; d++) {
        const c = (pop() ? catColumns(pop()) : []).find((cc) => colItems(cc).some((x) => x.label === prefix[d]));
        const it = c && colItems(c).find((x) => x.label === prefix[d]);
        if (!it) break;
        realClick(it.el);
        await waitFor(() => (pop() ? catColumns(pop()) : []).some((cc) => colItems(cc).length && !colItems(cc).some((x) => x.label === prefix[d]) && cc.getBoundingClientRect().left > c.getBoundingClientRect().left), 3000);
        await sleep(250);
      }
      return await waitFor(() => findCol(labels), 2000);
    }

    let where = '';
    async function dfs(prefix, labelsHint) {
      where = prefix.join(' › ') || 'All categories';
      const col = labelsHint ? await ensureCol(prefix, labelsHint) : (pop() ? catColumns(pop())[0] : null);
      if (!col) throw E(`讀到「${where}」時找不到這一層的清單`, `Lost the category list at “${where}”`);
      const list = colItems(col).map((x) => ({ label: x.label, kids: x.kids, disabled: x.disabled }));
      const labels = list.map((x) => x.label);
      for (const it of list) {
        if (catStop) return;
        const path = [...prefix, it.label];
        const key = path.join(' - ');
        if (it.disabled) continue; // 灰色不可選的類目（例如 Pre-Owned）跳過
        if (!it.kids) { if (addCatPath(key)) found++; continue; }
        if (cats.done[key]) continue; // 已讀過的整個分支跳過
        const c = await ensureCol(prefix, labels);
        const el = c && colItems(c).find((x) => x.label === it.label);
        if (!el) continue;
        const before = new Set((pop() ? catColumns(pop()) : []).map(colSig));
        const parentSig = colSig(c);
        visitedParents++;
        progress(found, cats.paths.length, path.join(' › '));
        // 子欄 = 父欄右邊緊接的那一欄；被點的項目會亮起（class 含 active）
        const colsNow = () => (pop() ? catColumns(pop()) : []);
        const parentCol = () => colsNow().find((cc) => colSig(cc) === parentSig);
        const rightOf = () => { const cs = colsNow(); const i = cs.findIndex((cc) => colSig(cc) === parentSig); return i >= 0 ? cs[i + 1] : null; };
        const myLi = () => { const pc = parentCol(); const x = pc && colItems(pc).find((y) => y.label === it.label); return x && x.el; };
        const isActive = () => { const li = myLi(); return !!li && /active/i.test(li.className || ''); };
        const prevRight = rightOf();
        const prevSig = prevRight ? colSig(prevRight) : '';
        const waitStable = async (ms) => {
          let last = '', stable = 0;
          return (await waitFor(() => {
            const r = rightOf(); const g = r ? colSig(r) : '';
            const ok = g && (g !== prevSig || isActive());
            if (ok && g === last) stable++; else { last = ok ? g : ''; stable = 0; }
            return ok && stable >= 2 ? g : null;
          }, ms, 120)) || '';
        };
        let sig = '';
        if (isActive() && prevRight) sig = prevSig; // 打開時已經展開的那一路
        else {
          const tries = [
            (li) => realClick(li.querySelector('[class*="list-item-label"] > div') || li),
            (li) => (li.querySelector('[class*="list-item-label"]') || li).click(),
            (li) => realClick(li),
            (li) => li.click(),
          ];
          for (const t of tries) {
            const li = myLi() || el.el;
            t(li);
            sig = await waitStable(2500);
            if (sig) break;
          }
        }
        if (!sig) {
          expandFails++;
          LOG('點不開：', key);
          if (expandFails >= 3 && !anyExpanded) throw E('TikTok 的類目點不開（請按「類目診斷」並把結果發給 Claude）', 'Couldn\'t expand TikTok categories (press “Category diagnostics” and send the result to Claude)');
          continue; // 不當成末級類目保存，下次更新會再試
        }
        anyExpanded = true;
        await dfs(path, sig.split('|'));
        if (catStop) return;
        cats.done[key] = true;
        if (visitedParents % 5 === 0) { cats.updated = Date.now(); saveCats(); }
      }
    }
    let failed = null;
    try {
      await dfs([], null);
    } catch (e) {
      failed = e;
    }
    cats.updated = Date.now();
    const saved = saveCats();
    if (failed) { // 出錯時不關彈窗，方便看停在哪裡；已讀到的都保存了
      failed.message += L(`（已保存 ${cats.paths.length} 個，下次會接著讀）`, ` (${cats.paths.length} saved; the next run continues from here)`);
      throw failed;
    }
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(300);
    await closeDialog();
    if (!saved) throw E('類目太多，瀏覽器存不下', 'Too many categories to store in the browser');
    return { found, total: cats.paths.length, stopped: catStop };
  }

  // 類目診斷：把下拉的結構摘要複製給 Claude
  async function catDiagnose() {
    const out = [];
    const dlg = getDialog();
    if (!dlg) return 'Open “Create temporary listing” first.';
    const box = fieldBox(dlg, 'Category');
    out.push('box: ' + !!box);
    if (!box) return out.join('\n');
    const v = catView(box);
    out.push('view: ' + v.tagName + '.' + String(v.className).slice(0, 80) + ' [' + norm(v.innerText).slice(0, 60) + ']');
    realClick(v);
    const s = await waitFor(() => catSearchInput(box), 3000);
    out.push('search: ' + !!s + (s ? ' ph=' + s.placeholder : ''));
    await sleep(800);
    const p = s && catPopup(s);
    out.push('popup: ' + (p ? p.tagName + '.' + String(p.className).slice(0, 80) + ' h=' + Math.round(p.getBoundingClientRect().height) : 'null'));
    let el = s && s.parentElement;
    for (let i = 0; i < 8 && el; i++, el = el.parentElement) out.push(`  up${i}: ${el.tagName}.${String(el.className).slice(0, 60)} h=${Math.round(el.getBoundingClientRect().height)} kids=${el.children.length}`);
    if (p) {
      const cols = catColumns(p);
      out.push('columns: ' + cols.length);
      cols.forEach((c, i) => {
        const it = colItems(c);
        out.push(`  col${i}: ${c.tagName}.${String(c.className).slice(0, 60)} items=${it.length} left=${Math.round(c.getBoundingClientRect().left)}`);
        it.slice(0, 4).forEach((x) => out.push(`    - ${x.label} kids=${x.kids} <${x.el.tagName}.${String(x.el.className).slice(0, 50)}> html=${x.el.innerHTML.replace(/\s+/g, ' ').slice(0, 160)}`));
      });
    }
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return out.join('\n');
  }

  // 類目選擇框：按 TikTok / Arco 的元件名稱找，框是空白的也找得到
  function cascaderView(b) {
    const pref = [...b.querySelectorAll('[class*="cascader-view"], [class*="select-view"]')].filter((e) => {
      if (!visible(e) || [...e.querySelectorAll('input')].some((i) => /search/i.test(i.placeholder || ''))) return false;
      const h = e.getBoundingClientRect().height;
      return h <= 64;
    });
    if (pref.length) return pref.find((e) => !pref.some((o) => o !== e && o.contains(e))); // 最外層那個
    const ok = (e) => {
      if (!visible(e)) return false;
      const r = e.getBoundingClientRect();
      if (r.height > 60 || r.height < 10) return false;
      return ![...e.querySelectorAll('input')].some((i) => /search/i.test(i.placeholder || ''));
    };
    const c = [...b.querySelectorAll('[class*="select"], [class*="cascader"], [role="combobox"]')].filter(ok);
    return c.find((e) => !c.some((o) => o !== e && e.contains(o))) || b;
  }

  /* ---------------- 圖片庫：圖片存在瀏覽器的 IndexedDB ---------------- */
  state.imgs = state.imgs || []; // [{ id, name, w, h }]
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('ttfill_images', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbDo(mode, fn) {
    const db = await idb();
    return new Promise((res, rej) => {
      const t = db.transaction('img', mode);
      const out = fn(t.objectStore('img'));
      t.oncomplete = () => res(out && out.result);
      t.onerror = () => rej(t.error);
    });
  }
  const imgPut = (id, blob) => idbDo('readwrite', (st) => st.put(blob, id));
  const imgGet = (id) => idbDo('readonly', (st) => st.get(id));
  const imgDel = (id) => idbDo('readwrite', (st) => st.delete(id));
  const imgURLs = {};
  async function imgURL(id) {
    if (imgURLs[id]) return imgURLs[id];
    const b = await imgGet(id).catch(() => null);
    return b ? (imgURLs[id] = URL.createObjectURL(b)) : '';
  }
  // 大圖縮到最長邊 1600px（JPEG），省空間；小圖保留原檔
  async function prepImage(file) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 1.5e6 && /jpe?g|png|webp/.test(file.type)) return { blob: file, w: bmp.width, h: bmp.height };
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
    return { blob, w: c.width, h: c.height };
  }
  async function addImages(files, crop = true) {
    const ids = [];
    for (let f of files) {
      if (!/^image\//.test(f.type)) continue;
      if (crop) {
        const c = await cropDialog(f);
        if (c === null) continue; // 取消
        if (c !== 'orig') f = new File([c], f.name, { type: 'image/jpeg' });
      }
      const { blob, w, h } = await prepImage(f);
      const id = 'img' + uid();
      await imgPut(id, blob);
      state.imgs.push({ id, name: f.name.replace(/\.[^.]+$/, '') + '.jpg', w, h });
      ids.push(id);
    }
    saveState();
    return ids;
  }
  async function removeImage(id) {
    await imgDel(id).catch(() => {});
    state.imgs = state.imgs.filter((x) => x.id !== id);
    for (const it of state.lib) if (it.img === id) delete it.img;
    if (state.defImg === id) delete state.defImg;
    if (imgURLs[id]) { URL.revokeObjectURL(imgURLs[id]); delete imgURLs[id]; }
    saveState();
  }
  // 正方形裁剪框：拖動移位、滑桿放大；回傳 Blob / 'orig'（不裁剪）/ null（取消）
  function cropDialog(file) {
    return new Promise(async (resolve) => {
      const card = $('card');
      if (!card) return resolve('orig');
      if (card.classList.contains('min')) setMin(false);
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((r) => { img.onload = r; img.onerror = r; img.src = url; });
      const W = img.naturalWidth, H = img.naturalHeight;
      if (!W || !H) { URL.revokeObjectURL(url); return resolve('orig'); }
      const V = 280, minS = V / Math.min(W, H);
      let s = minS, x = (V - W * s) / 2, y = (V - H * s) / 2;
      const ov = document.createElement('div');
      ov.className = 'cropov';
      ov.innerHTML = `
        <div class="cropbox">
          <div class="nm">${L('裁剪圖片（正方形）', 'Crop image (square)')}</div>
          <div class="meta">${escapeHtml(file.name)} · ${W}×${H}</div>
          <div class="vp"><img draggable="false"><div class="grid"></div></div>
          <input type="range" class="zoom" min="1" max="4" step="0.01" value="1">
          <div class="hint" style="margin:2px 0 8px">${L('拖動圖片調整位置，滑桿放大縮小', 'Drag to move, use the slider to zoom')}</div>
          <div class="btnrow" style="justify-content:flex-end">
            <button class="btn ghost" data-a="cancel">${L('取消', 'Cancel')}</button>
            <button class="btn ghost" data-a="orig">${L('不裁剪', 'Keep original')}</button>
            <button class="btn primary" data-a="ok">${L('確定', 'Done')}</button>
          </div>
        </div>`;
      card.appendChild(ov);
      const im = ov.querySelector('img'); im.src = url;
      const vp = ov.querySelector('.vp');
      const clamp = () => { x = Math.min(0, Math.max(V - W * s, x)); y = Math.min(0, Math.max(V - H * s, y)); };
      const draw = () => { clamp(); im.style.width = W * s + 'px'; im.style.height = H * s + 'px'; im.style.transform = `translate(${x}px,${y}px)`; };
      draw();
      ov.querySelector('.zoom').oninput = (e) => {
        const ns = minS * +e.target.value, cx = V / 2, cy = V / 2;
        x = cx - (cx - x) * (ns / s); y = cy - (cy - y) * (ns / s); s = ns; draw();
      };
      vp.addEventListener('pointerdown', (e) => {
        vp.setPointerCapture(e.pointerId);
        const sx = e.clientX - x, sy = e.clientY - y;
        const mv = (ev) => { x = ev.clientX - sx; y = ev.clientY - sy; draw(); };
        const up = () => { vp.removeEventListener('pointermove', mv); vp.removeEventListener('pointerup', up); };
        vp.addEventListener('pointermove', mv); vp.addEventListener('pointerup', up);
      });
      const finish = (v) => { ov.remove(); URL.revokeObjectURL(url); resolve(v); };
      ov.querySelector('[data-a=cancel]').onclick = () => finish(null);
      ov.querySelector('[data-a=orig]').onclick = () => finish('orig');
      ov.querySelector('[data-a=ok]').onclick = () => {
        const side = V / s, N = Math.min(1600, Math.round(side));
        const c = document.createElement('canvas'); c.width = N; c.height = N;
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, N, N);
        g.drawImage(img, -x / s, -y / s, side, side, 0, 0, N, N);
        c.toBlob((b) => finish(b || 'orig'), 'image/jpeg', 0.9);
      };
    });
  }
  async function recropImage(id) {
    const b = await imgGet(id).catch(() => null);
    if (!b) return false;
    const m = state.imgs.find((x) => x.id === id) || {};
    const c = await cropDialog(new File([b], m.name || 'image.jpg', { type: b.type || 'image/jpeg' }));
    if (!c || c === 'orig') return false;
    const { blob, w, h } = await prepImage(new File([c], m.name || 'image.jpg', { type: 'image/jpeg' }));
    await imgPut(id, blob);
    Object.assign(m, { w, h });
    if (imgURLs[id]) { URL.revokeObjectURL(imgURLs[id]); delete imgURLs[id]; }
    saveState();
    return true;
  }
  const blobToDataURL = (b) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  const dataURLToBlob = async (u) => (await fetch(u)).blob();

  // 上架時：類目要求圖片（或商品有指定圖片）就自動上傳
  async function setImage(dlg, row) {
    const box = fieldBox(dlg, 'Images');
    if (!box) return; // 這個表單沒有圖片欄
    const done = () => !!box.querySelector('img[src]') || /\(\s*1\s*\/\s*1\s*\)/.test(box.innerText);
    if (done()) return;
    const lab = findByText(box, 'Images')[0];
    const near = lab ? [lab, lab.parentElement, lab.parentElement && lab.parentElement.parentElement].filter(Boolean).flatMap((e) => [e, ...e.children]) : [];
    const pseudoStar = near.some((e) => /\*/.test(getComputedStyle(e, '::before').content || '') || /\*/.test(getComputedStyle(e, '::after').content || ''));
    const required = pseudoStar || !!box.querySelector('[class*="symbol"], [class*="required"], [class*="asterisk"]') ||
      /^\s*\*/.test(box.textContent || '') || /at least 1 product image/i.test(box.innerText);
    const id = row.img && state.imgs.some((x) => x.id === row.img) ? row.img : (required ? state.defImg : null);
    if (!id) {
      if (required) throw E('這個類目需要上傳圖片，但商品沒有指定圖片，也沒有設定預設圖片', 'This category needs an image, but the product has no image and no default image is set');
      return;
    }
    const blob = await imgGet(id).catch(() => null);
    if (!blob) throw E('圖片庫裡找不到這張圖片', 'Image not found in the image library');
    const input = box.querySelector('input[type="file"]') || dlg.querySelector('input[type="file"][accept*="image"]') || dlg.querySelector('input[type="file"]');
    if (!input) throw E('找不到 TikTok 的圖片上傳欄', 'Can\'t find TikTok\'s image upload field');
    const meta = state.imgs.find((x) => x.id === id) || {};
    const dt = new DataTransfer();
    dt.items.add(new File([blob], meta.name || 'image.jpg', { type: blob.type || 'image/jpeg' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    // TikTok 可能彈出「Edit image」裁剪框 → 自動按 Done
    const editDone = () => {
      const t = findByText(document.body, 'Edit image')[0];
      if (!t) return null;
      let m = t;
      for (let i = 0; i < 10 && m; i++) {
        m = m.parentElement;
        const b = m && findByText(m, 'Done')[0];
        if (b) return b.closest('button, [role="button"]') || b;
      }
      return null;
    };
    for (let k = 0; k < 3; k++) {
      const r = await waitFor(() => (done() ? 'done' : editDone() ? 'edit' : /fail|error|失敗/i.test(box.innerText) ? 'err' : null), 30000, 250);
      if (r !== 'edit') break;
      await sleep(400);
      const b = editDone(); if (b) realClick(b);
      await waitFor(() => !editDone(), 4000);
    }
    if (!done()) throw E('圖片上傳失敗（TikTok 沒有接受這張圖片）', 'Image upload failed (TikTok didn\'t accept the image)');
    await sleep(400);
  }

  const BATTERY_OPT = 'Rechargeable (lithium ion) batteries installed in or packed with equipment';
  async function setCompliance(dlg, target) {
    const box = fieldBox(dlg, 'Does your product contain the following?');
    if (!box) { if (target === 'None of the above') return; throw E('找不到 Product compliance（電池）欄位', 'Can\'t find the Product compliance (battery) field'); }
    const T = norm(target);
    const view = () => {
      const c = [...box.querySelectorAll('[class*="select"], [role="combobox"]')].filter((e) => {
        if (!visible(e)) return false;
        const r = e.getBoundingClientRect();
        return r.height >= 10 && r.height <= 80;
      });
      return c.find((e) => !c.some((o) => o !== e && e.contains(o) && norm(o.innerText))) || c[0] || box;
    };
    const isSet = () => {
      const t = norm(view().innerText);
      if (!t.includes(T.slice(0, 40))) return false;
      // 選電池時，None of the above 不應同時存在
      return target === 'None of the above' || !t.includes('none of the above');
    };
    if (isSet()) return;
    for (let attempt = 0; attempt < 2 && !isSet(); attempt++) {
      realClick(view());
      const opt = await waitFor(() => {
        const c = [];
        for (const e of document.querySelectorAll('li, [role="option"], [class*="option"], div, span, label')) {
          if (!visible(e) || box.contains(e) && view().contains(e) || e.closest('#ttfill-panel')) continue;
          if (norm(e.innerText) === T) c.push(e);
        }
        return c.find((e) => !c.some((o) => o !== e && e.contains(o)));
      }, 3000);
      if (!opt) continue;
      realClick(opt.closest('li, [role="option"], [class*="option"], label') || opt);
      await sleep(400);
      // 如果是多選，而且「None of the above」還在，就把它取消
      if (target !== 'None of the above' && norm(view().innerText).includes('none of the above')) {
        const none = [...document.querySelectorAll('li, [role="option"], [class*="option"], label')]
          .find((e) => visible(e) && norm(e.innerText) === 'none of the above');
        if (none) { realClick(none); await sleep(300); }
      }
      // 關掉下拉
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(300);
    }
    if (!isSet()) throw (target === 'None of the above' ? E('電池欄沒能改回 None of the above', 'Couldn\'t reset the battery field to None of the above') : E('電池選項沒有選上（Product compliance）', 'Battery option didn\'t get selected (Product compliance)'));
  }

  /* ---------------- 提交判斷 ---------------- */
  // 先等彈窗關閉，再看有沒有「Product submitted」提示（避免把上一次殘留的提示當成這次的）
  // 監看某一行的提交結果。用「行物件」而不是序號，重新生成清單後舊的監看不會寫錯行。
  // 回傳 'ok' | 'cancel' | 'timeout' | 'stale'
  async function watchSubmit(row, timeout) {
    const token = (row._w = (row._w || 0) + 1);
    const toastSeen = () => findByText(document.body, 'product submitted', { exact: false }).length > 0;
    const res = await waitFor(() => (!getDialog() ? 'closed' : null), timeout, 300);
    if (row._w !== token || !state.rows.includes(row)) return 'stale';
    const i = state.rows.indexOf(row);
    let out;
    if (res === 'closed' && (await waitFor(toastSeen, 3000))) {
      row.status = '✅ 已提交';
      if (state.idx === i) state.idx = nextPending(i + 1);
      out = 'ok';
    } else if (res === 'closed') {
      row.status = '已取消';
      out = 'cancel';
    } else {
      out = 'timeout';
    }
    saveState(); render();
    return out;
  }
  // 背景監看：你手動按 Submit 後，自動標記成功並跳到下一個
  function watchLater(row, okMsg) {
    watchSubmit(row, 15 * 60 * 1000).then((r) => { if (r === 'ok') setMsg(okMsg || L('已提交', 'Submitted'), 'ok'); });
  }

  // 下一個還沒提交的行（從 from 開始找，找不到就從頭找）
  function nextPending(from) {
    const n = state.rows.length;
    for (let k = 0; k < n; k++) { const j = (from + k) % n; if (!state.rows[j].status.startsWith('✅')) return j; }
    return n;
  }

  // 關掉 TikTok 的彈窗（自動上架時跳過有問題的商品用）
  async function closeDialog() {
    const d = getDialog();
    if (!d) return true;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); // 先收起打開的下拉
    await sleep(200);
    const c = findByText(d, 'Cancel')[0];
    const btn = c && (c.closest('button, [role="button"]') || c);
    if (btn) realClick(btn);
    else { const x = d.querySelector('.arco-drawer-close-icon, [class*="close-icon"], [aria-label="Close"]'); if (x) realClick(x); }
    // TikTok 會問「Discard your changes?」→ 按 Discard
    const confirmBtn = () => {
      for (const t of ['Discard', 'Leave', 'Confirm', 'OK', 'Yes', 'Exit']) {
        const cands = findByText(document.body, t).map((e) => e.closest('button, [role="button"]') || e).filter(visible);
        const inModal = cands.find((e) => e.closest('[class*="modal"], [class*="Modal"], [role="dialog"], [class*="popconfirm"]'));
        if (inModal || cands.length) return inModal || cands[cands.length - 1];
      }
      return null;
    };
    const r = await waitFor(() => (!getDialog() ? 'closed' : confirmBtn()), 3000);
    if (r === 'closed') return true;
    if (r) { realClick(r); }
    return !!(await waitFor(() => !getDialog(), 4000));
  }

  // 填一行。submit=true 自動按 Submit；defer=true（全部自動上架）時，有問題的先關掉彈窗跳過。
  // 回傳 'ok' 已提交 | 'defer' 已跳過、稍後手動處理 | 'wait' 等你手動 | 'fail' 卡住了
  async function fillOne(i, submit, defer) {
    const row = state.rows[i];
    if (!row) return 'fail';
    if (row.status.startsWith('✅')) return 'ok'; // 已提交過的不重複上
    const CONT = () => L('已提交，按「上架剩下的」繼續', 'Submitted — press “Upload remaining” to continue');
    const skip = async (status, msg, type) => {
      row.status = status; saveState(); render();
      if (!defer) { setMsg(msg, type || 'warn'); if (getDialog()) watchLater(row, CONT()); return 'wait'; }
      setMsg(L('跳過：', 'Skipped: ') + baseName(row.name) + ' (' + status.replace(/^❌\s*|^待確認：/, '') + ')', 'warn');
      if (await closeDialog()) return 'defer';
      setMsg(L('出錯：TikTok 彈窗關不掉，自動上架停在這裡。請手動處理這一個再按「上架剩下的」', 'Error: couldn\'t close the TikTok window, so auto-upload stopped here. Handle this one manually, then press “Upload remaining”'), 'err');
      if (getDialog()) watchLater(row, CONT());
      return 'fail';
    };
    setMsg(L('填寫中：', 'Filling: ') + row.name);
    row.status = '填寫中';
    render();
    let dlg;
    try {
      try {
        dlg = await fillRow(row);
      } catch (e) {
        // 只有「彈窗還沒準備好」這類問題才重試；類目找不到之類的重試也沒用
        if (!e.retry) throw e;
        LOG('第一次失敗，重試', e);
        await sleep(1000);
        dlg = await fillRow(row);
      }
    } catch (e) {
      LOG(e);
      return skip('❌ ' + e.message, L('出錯：', 'Error: ') + e.message + (getDialog() ? L('（可以手動改好後按 Submit，會自動記錄）', ' (fix it in TikTok and press Submit — it will be recorded automatically)') : ''), 'err');
    }
    if (row.catNote) {
      return skip(row.catMissing ? '待確認：' + L('沒有設定類目', 'no category set') : '待確認：' + L('類目選了最接近的「' + lastSeg(row.catNote) + '」', 'closest category picked: “' + lastSeg(row.catNote) + '”'),
        row.catMissing ? L(`⚠️ ${row.catNote}，請手動選類目後按 Submit。之後在商品庫補上類目就不用每次手動選。`, `⚠️ ${row.catNote} — pick the category manually, then press Submit. Add the category in the Library to skip this next time.`)
                       : L(`⚠️ 類目沒有完全對上，選了最接近的「${row.catNote}」，請確認後手動按 Submit`, `⚠️ No exact category match — picked the closest: “${row.catNote}”. Check it, then press Submit manually.`));
    }
    row.status = '已填好'; saveState(); render();
    if (!submit) {
      setMsg(L('已填好，請檢查後按 Submit', 'Filled — check it, then press Submit'));
      watchLater(row, L('已提交', 'Submitted'));
      return 'wait';
    }
    // TikTok 標紅的錯誤文字
    const isRed = (e) => { const c = (getComputedStyle(e).color.match(/\d+/g) || []).map(Number); return c.length >= 3 && c[0] > 170 && c[1] < 120 && c[2] < 120; };
    const errNow = () => {
      const d = getDialog(); if (!d) return null;
      const t = [...new Set([...d.querySelectorAll('[class*="error"], [class*="explain"], [role="alert"]')]
        .filter((e) => visible(e) && isRed(e)).map((e) => (e.innerText || '').trim()).filter((x) => x && x.length < 200 && !x.includes('\n')))];
      return t.length ? t : null;
    };
    let r = '', errs = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const d = getDialog() || dlg;
      const btn = findSubmit(d);
      if (!btn) return skip('❌ ' + L('找不到 Submit 按鈕', 'Can\'t find the Submit button'), L('出錯：找不到 Submit 按鈕', 'Error: can\'t find the Submit button'), 'err');
      const errBefore = (errNow() || []).join('|');
      await sleep(400);
      realClick(btn);
      setMsg(L('已按 Submit，等待結果…', 'Submit pressed, waiting for the result…'));
      const early = await waitFor(() => (!getDialog() ? 'closed' : ((errNow() || []).join('|') !== errBefore && errNow()) ? 'invalid' : null), 45000, 300);
      if (early === 'closed') { r = await watchSubmit(row, 3000); break; }
      await sleep(700);
      errs = errNow();
      if (!errs) { r = 'timeout'; break; }
      // 缺圖片 → 補上圖片再提交一次
      const imgId = row.img || state.defImg;
      if (attempt === 0 && errs.some((t) => /image|圖片|图片/i.test(t)) && imgId && state.imgs.some((x) => x.id === imgId)) {
        setMsg(L('TikTok 要求圖片，正在補上傳…', 'TikTok requires an image — uploading it…'));
        try { await setImage(getDialog() || d, { ...row, img: imgId }); continue; } catch (e) { errs.push(e.message); }
      }
      r = 'invalid'; break;
    }
    if (r === 'ok') { setMsg(L('已提交', 'Submitted'), 'ok'); return 'ok'; }
    if (r === 'invalid') {
      const why = errs.join('；');
      const needImg = errs.some((t) => /image|圖片|图片/i.test(t)) && !(row.img || state.defImg);
      return skip('❌ ' + L('TikTok 不接受：', 'TikTok rejected: ') + why + (needImg ? L('（到圖片庫上傳圖片並設 ★ 預設）', ' (upload an image and set a ★ default in the image library)') : ''),
        L('⚠️ TikTok 不接受：', '⚠️ TikTok rejected: ') + why + L('。改好後手動按 Submit', '. Fix it, then press Submit manually'));
    }
    if (r === 'timeout') return skip('❌ ' + L('按了 Submit 但彈窗沒關（可能有欄位標紅）', 'Submit pressed but the window stayed open (a field may be flagged red)'),
      L('⚠️ 按了 Submit 但彈窗沒關：請看 TikTok 彈窗裡哪一欄標紅，改好後手動按 Submit', '⚠️ Submit pressed but the window stayed open: check which field is flagged red in TikTok, fix it, then press Submit'));
    if (r === 'stale') return 'ok';
    // 彈窗關了但沒看到成功提示：不要自動重試，避免重複上架
    row.status = '待確認：' + L('沒看到「提交成功」，請在 TikTok 列表確認', 'no “submitted” confirmation — check the TikTok list');
    saveState(); render();
    setMsg(L('⚠️ 彈窗關了但沒看到「提交成功」，請在 TikTok 列表確認這一個有沒有上去', '⚠️ The window closed but no “submitted” confirmation appeared — check the TikTok list to see if it went up'), 'warn');
    return defer ? 'defer' : 'wait';
  }

  async function fillNext() {
    if (busy) return;
    if (!state.rows[state.idx]) { setMsg(L('全部完成 🎉（或先生成今天的清單）', 'All done 🎉 (or generate today\'s list first)'), 'ok'); return; }
    busy = true; setRunning(true, false);
    try { await fillOne(state.idx, !!state.auto, false); } finally { busy = false; setRunning(false); }
  }

  let stopFlag = false;
  // 全部自動上架：依序上所有還沒提交的；有問題的先跳過，最後集中提示
  async function runAll() {
    if (busy) return;
    const todo = state.rows.filter((r) => !r.status.startsWith('✅'));
    if (!todo.length) { setMsg(L('全部完成 🎉', 'All done 🎉'), 'ok'); return; }
    busy = true; stopFlag = false; setRunning(true, true);
    let n = 0, failed = false;
    const deferred = [];
    try {
      for (const row of todo) {
        if (stopFlag || !state.rows.includes(row)) break;
        state.idx = state.rows.indexOf(row); saveState(); render();
        const r = await fillOne(state.idx, true, true);
        if (r === 'ok') n++;
        else if (r === 'defer') deferred.push(row);
        else { failed = true; break; }
        await sleep(1200);
      }
    } finally {
      busy = false; setRunning(false);
    }
    if (failed) return; // fillOne 已經寫了提示
    const left = state.rows.filter((r) => !r.status.startsWith('✅'));
    if (left.length) { state.idx = state.rows.indexOf(left[0]); saveState(); render(); }
    if (stopFlag) setMsg(L(`已停止（這次上了 ${n} 個，還剩 ${left.length} 個）`, `Stopped (uploaded ${n} this run, ${left.length} left)`), 'warn');
    else if (!left.length) setMsg(L(`全部完成 🎉 這次上了 ${n} 個`, `All done 🎉 Uploaded ${n} this run`), 'ok');
    else setMsg(L(`⚠️ 自動上架完成 ${n} 個。還有 ${left.length} 個需要你手動處理（橙色＝待確認，紅色＝出錯）：點那一行 → 按「填這個」，檢查後在 TikTok 按 Submit。`,
      `⚠️ Auto-uploaded ${n}. ${left.length} need your attention (orange = check, red = error): click the row → press “Fill this”, check it, then press Submit in TikTok.`), 'warn');
  }

  /* ---------------- 商品庫 ----------------
     每個商品存一個名字模板：{PT} 和 {DATE} 會在生成清單時換成當天的值 */
  // 預設商品庫：公開版是空的，每個人自己新增或從 Excel 匯入。{PT} = 場次，{DATE} = 日期
  const DEFAULT_LIB = [];
  const OLD_DEFAULTS = [];
  const uid = () => Math.random().toString(36).slice(2, 9);
  function mergeDefaults() {
    let added = 0;
    for (const d of DEFAULT_LIB) {
      if (state.lib.some((x) => norm(x.name) === norm(d.name))) continue;
      state.lib.push({ id: uid(), ...d });
      added++;
    }
    saveState();
    return added;
  }
  state.lib = (state.lib || []).map((x) => ({ ...x, name: x.name.replace(/PT\{PT\}/g, '{PT}') })); // 舊版格式升級
  if (!state.seeded) { mergeDefaults(); state.seeded = 2; saveState(); }
  else if (state.seeded === 1) {
    const old = new Set(OLD_DEFAULTS.map(norm));
    state.lib = state.lib.filter((x) => !old.has(norm(x.name)));
    state.seeded = 2; saveState();
  }
  if (state.batMig !== 2) { state.batMig = 2; saveState(); }
  state.pt = state.pt || 'PT1';
  if (state.qty == null || state.qty === '') state.qty = '500'; // 預設數量真的存起來（以前只是顯示）
  const today = () => { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); };
  const ptLabel = () => { const v = String(state.pt || '').trim(); return /^\d+$/.test(v) ? 'PT' + v : v.toUpperCase(); };
  // 去掉名稱結尾的場次和日期（例如「 - PT1 - 1027」「 -  - 1022」「 - PT2」），再統一接上 {PT} 和 {DATE}
  const stripPtDate = (name) => {
    let n = String(name).trim();
    n = n.replace(/\s*-\s*\{PT\}\s*(-\s*\{DATE\})?\s*$/i, '');
    n = n.replace(/\s*-\s*(PT\s*\d+)?\s*-\s*(\d{3,4})?\s*$/i, '');
    n = n.replace(/\s*-\s*PT\s*\d+\s*$/i, '');
    return n.trim();
  };
  const toTemplate = (name) => stripPtDate(name) + '  - {PT} - {DATE}';
  const applyTpl = (tpl) => tpl.trim().replace(/\{PT\}/g, ptLabel()).replace(/\{DATE\}/g, $('ttf-date').value.trim() || today());
  function importToLib(text) {
    const rows = parse(text);
    let added = 0, updated = 0;
    for (const r of rows) {
      const tpl = toTemplate(r.name);
      const ex = state.lib.find((x) => norm(x.name) === norm(tpl));
      const item = { name: tpl, cat: r.cat, weight: r.weight, h: r.h, w: r.w, l: r.l };
      if (ex) { Object.assign(ex, item); updated++; } else { state.lib.push({ id: uid(), sel: true, ...item }); added++; }
      if (ex) ex.sel = true;
    }
    saveState(); renderLib();
    return { added, updated };
  }

  /* ================= 直播檢測：得標 + 客人回覆 ================= */
  const LIVE_KEY = 'ttfill_live_v1';
  function loadLive() {
    try { const v = JSON.parse(localStorage.getItem(LIVE_KEY)); if (v && Array.isArray(v.orders)) return v; } catch (e) { /* 空 */ }
    return { orders: [], on: false, mins: 3 };
  }
  const live = loadLive();
  for (const o of live.orders) { // 修正舊版記錄裡的「Bids: $2.00 名字」
    if (/bids?\s*:/i.test(o.winner)) o.winner = String(o.winner).replace(/^[\s\S]*bids?\s*:\s*[$\s\u00a0]*[\d.,]+/i, '').replace(/\s+/g, ' ').trim();
  }
  const saveLive = () => { try { localStorage.setItem(LIVE_KEY, JSON.stringify(live)); } catch (e) { LOG('live save fail', e); } };
  const xp = (expr, ctx) => { const r = document.evaluate(expr, ctx || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); const a = []; for (let i = 0; i < r.snapshotLength; i++) a.push(r.snapshotItem(i)); return a; };
  const inPanel = (e) => !!(e && e.closest && e.closest('#ttfill-panel'));
  const cleanName = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  // 去掉卡片上混進名字的「Bids: $2.00」「1 bid」「won!」
  const winnerOnly = (t) => cleanName(String(t || '')
    .replace(/^[\s\S]*bids?\s*:\s*[$\s\u00a0]*[\d.,]+/i, '')
    .replace(/^\s*\d+\s+bids?\b/i, '')
    .replace(/\s*(won!|is winning!)\s*$/i, ''));
  // 比對名字時去掉裝飾：表情、旗幟、✨♥💜、「No. 1 customer」這類標籤
  const nameKey = (t) => norm(String(t || '')
    .replace(/No\.\s*\d+\s*customer/gi, ' ').replace(/\b(top fan|moderator|host)\b/gi, ' ')
    .replace(/(\.\.\.|…)\s*$/, '')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}‍️⃣]/gu, ' ')
    .replace(/[^\p{L}\p{N}_.\-' ]/gu, ' '));
  // 嚴格比對：連表情符號一起比（只去掉「No. 1 customer」這類標籤和多餘空白）
  const strictKey = (t) => String(t || '').replace(/No\.\s*\d+\s*customer/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const sameName = (a, b) => {
    const x = nameKey(a), y = nameKey(b);
    if (!x || !y) return false;
    return x === y || x.startsWith(y + ' ') || y.startsWith(x + ' ') ||
      (/(\.\.\.|…)\s*$/.test(a) && y.startsWith(x)) || (/(\.\.\.|…)\s*$/.test(b) && x.startsWith(y));
  };
  // listing 名稱可能被截斷：用今天上架清單 / 左邊 listing 卡片補全
  function fullListing(name) {
    const n = String(name || '').trim();
    if (!/(\.\.\.|…)$/.test(n)) return n;
    const head = norm(n.replace(/(\.\.\.|…)$/, ''));
    const pool = [...state.rows.map((r) => r.name), ...xp("//*[starts-with(normalize-space(text()),'#')]").filter((e) => !inPanel(e)).map((e) => (e.textContent || '').replace(/^#\d+\s*/, '').trim())];
    const hit = pool.find((p) => norm(p).startsWith(head) && !/(\.\.\.|…)$/.test(p));
    return hit || n;
  }

  // 1) 畫面下方的拍賣卡片：「#49 (Shoes) item … / Bids: $19.00 / Brittany Lynne won!」
  function readWonCard() {
    const wons = xp("//*[contains(normalize-space(text()),'won!')]").filter((e) => !inPanel(e) && visible(e));
    for (const w of wons) {
      let card = w;
      for (let i = 0; i < 8 && card; i++) {
        card = card.parentElement;
        const t = card && card.innerText || '';
        if (/#\d+/.test(t) && /bids?:/i.test(t)) break;
      }
      if (!card) continue;
      const t = card.innerText || '';
      const m = t.match(/#(\d+)\s+([^\n]+)/);
      if (!m) continue;
      const line = t.split('\n').map((x) => x.trim()).find((x) => /won!\s*$/i.test(x)) || '';
      let winner = winnerOnly(line);
      if (!winner) { // 名字和 won! 分在不同元素
        const p = w.parentElement; winner = winnerOnly(p ? p.innerText : '');
      }
      const price = (t.match(/bids?:\s*\$?\s*([\d.,]+)/i) || [])[1] || '';
      if (!winner || /no bids|is winning/i.test(winner)) continue;
      return { no: m[1], listing: fullListing(m[2].trim()), winner: cleanName(winner), price };
    }
    return null;
  }

  // 2) 聊天區
  // 聊天區有兩種版面：
  //  舊版：上面系統訊息（won auction item）、「All comments」下面是留言
  //  Quick LIVE：中間「Chat」（All / Product related / All viewers）是留言，右邊「Activity」是訂單動態
  const scrollBoxes = (root) => [...root.querySelectorAll('*')].filter((e) => {
    if (!visible(e) || inPanel(e)) return false;
    if (/\barco-list\b|\bcore-list\b|virtual-list/.test(e.className || '')) return true;
    const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.clientHeight > 40;
  });
  const outerOnly = (arr) => arr.filter((e) => !arr.some((o) => o !== e && o.contains(e)));
  const biggest = (arr) => arr.sort((x, y) => y.getBoundingClientRect().height - x.getBoundingClientRect().height)[0] || null;
  const leafText = (root, re) => xp('.//*[normalize-space(text())]', root).filter((e) => !inPanel(e) && visible(e) && re.test((e.textContent || '').trim()));
  function chatLists() {
    const input = [...document.querySelectorAll('input, textarea')].find((i) => /type something/i.test(i.placeholder || '') && !inPanel(i));
    if (!input) return {};
    const ir = input.getBoundingClientRect();
    // 只看和輸入框同一欄的東西（不然會抓到左邊的 listing 清單）
    const sameCol = (e) => { const r = e.getBoundingClientRect(); return r.left < ir.right - 20 && r.right > ir.left + 20; };
    const quickTab = leafText(document.body, /^activity$/i).find((e) => { let b = e; for (let i = 0; i < 6 && b; i++) { b = b.parentElement; if (b && /top customers/i.test(b.innerText || '')) return true; } return false; });
    const filt0 = quickTab ? null : xp("//*[normalize-space(text())='All comments']").find((e) => !inPanel(e) && visible(e) && sameCol(e) && e.getBoundingClientRect().bottom <= ir.top);
    let panel = null;
    if (filt0) { panel = input; for (let i = 0; i < 12 && panel && !panel.contains(filt0); i++) panel = panel.parentElement; }
    if (panel) { // 舊版
      const filt = filt0;
      const fr = filt ? filt.getBoundingClientRect() : null;
      const scrolls = scrollBoxes(panel).filter(sameCol);
      const comments = outerOnly(scrolls.filter((e) => { const r = e.getBoundingClientRect(); return r.bottom <= ir.top + 8 && (!fr || r.top >= fr.bottom - 8); }))[0];
      const system = fr ? outerOnly(scrolls.filter((e) => e.getBoundingClientRect().bottom <= fr.top + 8))[0] : null;
      return { comments, system, mode: 'classic' };
    }
    // Quick LIVE
    panel = input;
    for (let i = 0; i < 12 && panel; i++) {
      panel = panel.parentElement;
      const t = panel && panel.innerText || '';
      if (panel && /\bchat\b/i.test(t) && /all viewers|product related|viewer comments/i.test(t)) break;
    }
    let comments = null;
    if (panel) {
      const tops = leafText(panel, /^(all viewers|product related|all|chat)$/i).filter(sameCol).map((e) => e.getBoundingClientRect().bottom).filter((y) => y < ir.top);
      const fb = tops.length ? Math.max(...tops) : -1e9;
      comments = biggest(outerOnly(scrollBoxes(panel).filter((e) => { const r = e.getBoundingClientRect(); return sameCol(e) && r.bottom <= ir.top + 8 && r.top >= fb - 8 && !e.contains(input); })));
    }
    let system = null;
    const tab = leafText(document.body, /^activity$/i)[0];
    if (tab) {
      let box = tab;
      for (let i = 0; i < 10 && box; i++) { box = box.parentElement; if (box && /top customers/i.test(box.innerText || '') && box.getBoundingClientRect().height > 200) break; }
      if (box) {
        const tb = tab.getBoundingClientRect().bottom;
        const drag = leafText(box, /^(drag to resize|ask to show)$/i).map((e) => e.getBoundingClientRect().top).filter((y) => y > tb);
        const lim = drag.length ? Math.min(...drag) : 1e9;
        system = biggest(outerOnly(scrollBoxes(box).filter((e) => { const r = e.getBoundingClientRect(); return r.top >= tb - 8 && r.bottom <= lim + 8 && (!comments || !comments.contains(e)) && !e.contains(input); })));
      }
    }
    if (!system) system = biggest(outerOnly(scrollBoxes(document.body).filter((e) => /won auction item/i.test(e.innerText || '') && (!comments || (!comments.contains(e) && !e.contains(comments))))));
    return { comments, system, mode: 'quick' };
  }
  // 系統行：「X won auction item 47 (Shoes)… $13.00」
  const SYS_RE = /^(.*?)\s+won auction item\s+(\d+)\s+(.*?)(?:\s+\$\s*([\d.,]+))?\s*$/i;
  const sysMatch = (t) => String(t || '').replace(/\n/g, ' ').replace(/\s*\|\s*/g, ' ').trim().match(SYS_RE);
  // 左邊 listing 卡片上的「#3 winner 名字」（Quick LIVE 版面沒有下方 won! 卡片時用）
  function cardWinners() {
    const out = [];
    for (const e of xp("//*[starts-with(normalize-space(text()),'#') and contains(normalize-space(.),'winner')]")) {
      if (inPanel(e) || !visible(e)) continue;
      let row = e; for (let i = 0; i < 3 && row && !/#\d+\s+winner\s+\S/i.test((row.innerText || '').replace(/\n/g, ' ')); i++) row = row.parentElement;
      const m = (row && row.innerText || '').replace(/\n/g, ' ').match(/#(\d+)\s+winner\s+(.+?)(?:\s+items sold.*)?$/i);
      if (!m || /^[-–—\s]*$/.test(m[2])) continue;
      let card = row; let title = '';
      for (let i = 0; i < 8 && card; i++) { card = card.parentElement; const tt = (card && card.innerText || '').split('\n').map((x) => x.trim()).find((x) => /^#\d+\s+/.test(x) && !/winner/i.test(x)); if (tt) { title = tt.replace(/^#\d+\s+/, ''); break; } }
      if (title) out.push({ no: m[1], winner: winnerOnly(m[2]), listing: fullListing(title) });
    }
    return out;
  }
  // 把一個清單拆成一條條訊息（往下找到真正有多個子元素的那層）
  function listItems(box, byAvatar) {
    if (!box) return [];
    let el = box;
    // 只穿過「清單外殼」那幾層（list / content / wrapper…），到訊息那一層就停，清單只有一條訊息時也不會拆錯
    const isShell = (c) => /list|content|wrapper|virtual|scroll|holder|inner|body/i.test(c.className || '') || c.children.length >= 3 || c.getBoundingClientRect().height > 150;
    for (let i = 0; i < 6 && el && el.children.length === 1 && isShell(el.children[0]); i++) el = el.children[0];
    const base = [...(el ? el.children : [])].filter((c) => visible(c) && (c.innerText || '').trim());
    // 用頭像切開每一條留言：不論 TikTok 把幾條留言包在同一層，每個頭像 = 一條
    const avs = byAvatar ? avatarsIn(box) : [];
    if (!avs.length) return base;
    const rows = avs.map((a) => { let r = a; while (r.parentElement && r.parentElement !== box && avatarsIn(r.parentElement).length === 1) r = r.parentElement; return r; })
      .filter((r, i, arr) => arr.indexOf(r) === i && visible(r) && (r.innerText || '').trim());
    const extra = base.filter((b) => !avatarsIn(b).length && !rows.some((r) => r.contains(b) || b.contains(r)));
    return [...rows, ...extra].sort((x, y) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }
  function avatarsIn(root) {
    if (!root || !root.querySelectorAll) return [];
    let av = [...root.querySelectorAll('[class*="avatar"]')];
    if (!av.length) { // 沒有 avatar class：用左邊對齊、方形的小圖
      const imgs = [...root.querySelectorAll('img')].filter((i) => { const r = i.getBoundingClientRect(); return r.width >= 16 && r.width <= 64 && Math.abs(r.width - r.height) < 6; });
      const minL = Math.min(...imgs.map((i) => i.getBoundingClientRect().left));
      av = imgs.filter((i) => i.getBoundingClientRect().left - minL < 30);
    }
    return av.filter((a) => !av.some((o) => o !== a && o.contains(a)));
  }
  const seen = new WeakMap();
  let primedEls = new WeakSet(); // 按「開始」時畫面上已有的元素：永遠不算新訊息
  function primeList(box) { if (box) for (const e of box.querySelectorAll('*')) primedEls.add(e); }
  function newItems(box, byAvatar) {
    const out = [];
    for (const it of listItems(box, byAvatar)) {
      if (primedEls.has(it)) continue;
      const t = (it.innerText || '').trim();
      if (seen.get(it) === t) continue;
      seen.set(it, t);
      out.push({ el: it, text: t });
    }
    return out;
  }
  // 一條留言：第一行是「頭像 + 名字 + 徽章（No. 3 customer、等級數字）」，下面才是留言
  // 像 innerText，但把表情圖片（<img alt="🐼">）換回文字；TikTok 的單獨表情是圖片
  function richText(el) {
    let out = '';
    const walk = (n) => {
      if (n.nodeType === 3) { out += n.nodeValue.replace(/\s+/g, ' '); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === 'IMG') {
        const alt = n.getAttribute('alt') || '', r = n.getBoundingClientRect();
        if (alt && r.width <= 36 && !n.closest('[class*="avatar"]')) out += alt;
        return;
      }
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'svg' || tag === 'SVG') return;
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const block = /^(block|flex|grid|list-item|table)/.test(cs.display);
      if (block) out += '\n';
      if (tag === 'BR') out += '\n';
      for (const c of n.childNodes) walk(c);
      if (block) out += '\n';
    };
    walk(el);
    return out.split('\n').map((x) => x.trim()).filter(Boolean).join('\n');
  }
  function parseComment(t, el) {
    if (el) t = richText(el) || t;
    if (el) {
      const header = [...el.children].find((c) => c.querySelector && (c.querySelector('[class*="avatar"], img'))) || el.firstElementChild;
      if (header) {
        const rest = [...el.children].filter((c) => c !== header && !c.contains(header));
        let msg = rest.map((c) => richText(c)).filter(Boolean).join(' ');
        // 名字 = 標題列裡第一段文字（徽章在後面）
        const name = (richText(header).split('\n')[0]) || '';
        if (!msg) { // 留言也在同一層：去掉標題列的文字
          const full = t, head = richText(header);
          if (full.startsWith(head)) msg = full.slice(head.length).trim();
        }
        if (name && msg) return { name: cleanName(name), msg: msg.replace(/\s*\n\s*/g, ' ') };
      }
    }
    const BADGE = /^(\d{1,3}|no\.?\s*\d+\s*customer|top\s*\d+|host|moderator|mod|creator|new|lv\.?\s*\d+|fan club.*)$/i;
    const lines = t.split('\n').map((x) => x.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    const msg = lines.slice(1).filter((x) => !BADGE.test(x)).join(' ');
    return msg ? { name: cleanName(lines[0]), msg } : null;
  }

  let liveTimer = null, liveObs = null, primed = false, wonSeen = null;
  const cwSeen = new Map();
  // 每個 listing 開始檢測時已經到第幾號；聊天區比這更早的編號都是舊單，不補成新單
  // listing 比對用完整名稱（被截斷的用「開頭相同」比對），不同場次的同類 listing 不會混在一起
  const listingKey = (t) => norm(String(t || '').replace(/(\.\.\.|…)\s*$/, ''));
  function baseFor(listing) {
    const k = listingKey(listing); let b = -1;
    for (const [kk, n] of Object.entries(live.base || {})) if (kk && k && (kk.startsWith(k) || k.startsWith(kk))) b = Math.max(b, n);
    return b;
  }
  function scanBase(system, comments) {
    const base = { ...(live.base || {}) };
    const put = (listing, n) => { const k = listingKey(listing); if (k && n >= 0) base[k] = Math.max(base[k] ?? -1, n); };
    // 左邊 listing 卡片「#147 (Shoes) …」= 下一輪的編號
    for (const e of xp("//*[starts-with(normalize-space(text()),'#')]")) {
      if (inPanel(e)) continue;
      const m = (e.textContent || '').trim().match(/^#(\d+)\s+(.+)/);
      if (m && !/winner/i.test(m[2])) put(m[2], +m[1] - 1);
    }
    for (const it of [...listItems(system), ...listItems(comments, true)]) {
      const m = sysMatch(it.innerText);
      if (m) put(m[3], +m[2]);
    }
    live.base = base;
  }
  function liveTick() {
    if (!live.on) return;
    const now = Date.now();
    let changed = false;
    // 得標：同一個結果要隔 1.2 秒以上連續讀到兩次才算（避開換場時一閃而過的畫面）
    const w = readWonCard();
    const sig = w ? [w.no, w.winner, w.price, listingKey(w.listing)].join('|') : '';
    if (!w) wonSeen = null;
    else if (!wonSeen || wonSeen.sig !== sig) wonSeen = { sig, t: now };
    else if (now - wonSeen.t >= 1200) {
      // 同一個 listing 的同一個編號只能有一個得標者
      const dup = live.orders.find((o) => o.no === w.no && listingKey(o.listing) && (listingKey(o.listing).startsWith(listingKey(w.listing)) || listingKey(w.listing).startsWith(listingKey(o.listing))));
      if (!dup) {
        live.orders.push({ no: w.no, listing: w.listing, winner: w.winner, price: w.price, at: wonSeen.t, paid: false, replies: [] });
        changed = true;
        LOG('得標', w);
      } else if (!sameName(dup.winner, w.winner)) LOG('忽略：同一編號已有得標者', w, dup.winner);
    }
    // Quick LIVE 版面：左邊 listing 卡片的「#3 winner 名字」（開始時已經有的不算）
    const cws = cardWinners(), cwNow = new Set();
    for (const c of cws) {
      const k = [c.no, strictKey(c.winner), listingKey(c.listing)].join('|'); cwNow.add(k);
      if (!primed) { cwSeen.set(k, -1); continue; }
      if (!cwSeen.has(k)) { cwSeen.set(k, now); continue; }
      const t0 = cwSeen.get(k); if (t0 < 0 || now - t0 < 1200) continue;
      cwSeen.set(k, -1);
      const dup = live.orders.find((o) => o.no === c.no && listingKey(o.listing) && (listingKey(o.listing).startsWith(listingKey(c.listing)) || listingKey(c.listing).startsWith(listingKey(o.listing))));
      if (!dup && +c.no > baseFor(c.listing)) { live.orders.push({ no: c.no, listing: c.listing, winner: c.winner, price: '', at: t0, paid: false, replies: [] }); changed = true; LOG('得標（listing 卡片）', c); }
    }
    for (const [k, v] of cwSeen) if (v >= 0 && !cwNow.has(k)) cwSeen.delete(k);
    const { comments, system } = chatLists();
    if (!primed) { primedEls = new WeakSet(); primeList(comments); primeList(system); scanBase(system, comments); saveLive(); }
    const cNew = newItems(comments, true);
    // 付款確認：「X won auction item 47 (Shoes)… $13.00」（Quick LIVE 可能混在留言裡）
    for (const s of [...newItems(system), ...cNew.filter((c) => sysMatch(c.text))]) {
      const m = sysMatch(s.text);
      if (!m || !primed) continue;
      const name = cleanName(m[1]), no = m[2];
      let o = live.orders.find((x) => x.no === no && sameName(x.winner, name));
      if (!o && live.orders.some((x) => x.no === no && (listingKey(x.listing).startsWith(listingKey(m[3])) || listingKey(m[3]).startsWith(listingKey(x.listing))))) {
        // 付款訊息的得標者和記錄不同：以付款訊息為準，修正那一單
        const wrong = live.orders.find((x) => x.no === no && !x.paid && (listingKey(x.listing).startsWith(listingKey(m[3])) || listingKey(m[3]).startsWith(listingKey(x.listing))));
        if (wrong) { LOG('以付款訊息修正得標者', wrong.winner, '→', name); wrong.winner = name; wrong.replies = []; o = wrong; }
      }
      if (!o && +no <= baseFor(m[3])) continue; // 開始檢測之前的舊單（聊天清單重新顯示舊訊息時會出現）
      if (!o) { // 開始檢測前沒看到 won! 卡片：用聊天記錄補上
        o = { no, listing: fullListing(m[3]), winner: name, price: m[4] || '', at: now, paid: false, replies: [], fromChat: true };
        live.orders.push(o);
      }
      if (!o.price && m[4]) o.price = m[4];
      if (!o.paid) { o.paid = true; o.paidAt = now; changed = true; }
    }
    // 留言 → 放進該客人得標後 N 分鐘內的每一單
    const win = Math.max(0.5, +live.mins || 3) * 60000;
    for (const c of cNew) {
      if (!primed || sysMatch(c.text)) continue; // 開始之前的舊留言不算
      const pc = parseComment(c.text, c.el);
      if (!pc || isMuted(pc.msg)) continue; // 過濾掉的留言（例如 giveaway 指定句）不記
      // 先找名字完全一樣（含表情）的單；沒有才用「忽略表情」的近似比對，並標 ≈ 提醒核對
      const open = live.orders.filter((o) => now >= o.at && now - o.at <= win);
      const exact = open.filter((o) => strictKey(o.winner) === strictKey(pc.name));
      const hits = exact.length ? exact : open.filter((o) => sameName(o.winner, pc.name));
      for (const o of hits) {
        if (o.replies.some((r) => r.msg === pc.msg && strictKey(r.from || o.winner) === strictKey(pc.name))) continue; // 同一句不重複記
        o.replies.push({ t: now, msg: pc.msg, loose: !exact.length, from: pc.name }); changed = true;
      }
    }
    if (!primed) { primed = true; } // 第一次只把畫面上已有的訊息標記為「看過」
    if (changed) { saveLive(); renderLive(); } else updLiveTimers();
  }
  function startLive(fresh) {
    if (fresh) live.base = {};
    live.on = true; primed = false; saveLive();
    liveTick();
    liveObs = new MutationObserver(() => { if (!liveTimer) liveTimer = setTimeout(() => { liveTimer = null; liveTick(); }, 250); });
    liveObs.observe(document.body, { childList: true, subtree: true, characterData: true });
    live._iv = setInterval(liveTick, 1000);
    renderLive();
  }
  function stopLive() {
    live.on = false; saveLive();
    if (liveObs) liveObs.disconnect(); liveObs = null;
    clearInterval(live._iv);
    renderLive();
  }
  const hhmmss = (t) => new Date(t).toLocaleTimeString([], { hour12: false });
  function liveCSV() {
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['No', 'Listing', 'Customer', 'Price', 'Won time', 'Paid', 'Replies'];
    const rows = live.orders.map((o) => [o.no, o.listing, o.winner, o.price, new Date(o.at).toLocaleString(), o.paid ? 'Y' : '', o.replies.map((r) => `[${hhmmss(r.t)}]${r.loose ? ' (≈' + (r.from || '') + ')' : ''} ${r.msg}`).join(' | ')]);
    return '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  }
  function liveDiagnose() {
    const out = [];
    const wons = xp("//*[contains(normalize-space(text()),'won!')]").filter((e) => !inPanel(e));
    out.push('version: ' + ((typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '?'));
    out.push('won! nodes: ' + wons.length);
    wons.slice(0, 2).forEach((w) => { let c = w; for (let i = 0; i < 5 && c.parentElement; i++) c = c.parentElement; out.push('  card: ' + c.tagName + '.' + String(c.className).slice(0, 60) + ' text=' + JSON.stringify((c.innerText || '').slice(0, 200))); });
    out.push('parsed card: ' + JSON.stringify(readWonCard()));
    const cl = chatLists(); const { comments, system } = cl;
    out.push('layout: ' + (cl.mode || 'no chat input') + ' · Quick LIVE text: ' + /quick live/i.test(document.body.innerText || ''));
    out.push('card winners: ' + JSON.stringify(cardWinners().slice(0, 4)));
    xp("//*[starts-with(normalize-space(text()),'#') and contains(normalize-space(.),'winner')]").filter((e) => !inPanel(e)).slice(0, 3).forEach((e) => { let c = e; const ch = []; for (let i = 0; i < 4 && c; i++, c = c.parentElement) ch.push(c.tagName + '.' + String(c.className).slice(0, 30)); out.push('  winner node: ' + JSON.stringify((e.parentElement && e.parentElement.innerText || '').slice(0, 80)) + ' chain: ' + ch.join(' < ')); });
    const act = leafText(document.body, /^activity$/i)[0];
    if (act) { let c = act; for (let i = 0; i < 6 && c.parentElement; i++) c = c.parentElement; out.push('activity box text: ' + JSON.stringify((c.innerText || '').slice(0, 400))); }
    const d = (n, b) => { out.push(n + ': ' + (b ? b.tagName + '.' + String(b.className).slice(0, 60) : 'null')); listItems(b).slice(-3).forEach((it) => out.push('    item <' + it.tagName + '.' + String(it.className).slice(0, 40) + '> ' + JSON.stringify((it.innerText || '').slice(0, 120)) + ' html=' + it.innerHTML.replace(/\s+/g, ' ').slice(0, 200))); };
    d('comments list', comments); d('system list', system);
    listItems(comments, true).slice(-3).forEach((it) => out.push('  parsed: ' + JSON.stringify(parseComment((it.innerText || '').trim(), it))));
    const sysTxt = xp("//*[contains(normalize-space(.),'won auction item') and not(.//*[contains(normalize-space(.),'won auction item')])]").filter((e) => !inPanel(e) && e.tagName !== 'SCRIPT').slice(-2);
    sysTxt.forEach((e) => { let c = e; const chain = []; for (let i = 0; i < 7 && c; i++, c = c.parentElement) chain.push(c.tagName + '.' + String(c.className).slice(0, 40)); out.push('  sys line: ' + JSON.stringify((e.innerText || '').slice(0, 100)) + ' chain: ' + chain.join(' < ')); });
    return out.join('\n');
  }
  let renderLive = () => {}; let updLiveTimers = () => {};

  /* ================= 自動公告：定時在聊天區發送 ================= */
  state.ann = state.ann || { items: [], mins: 5, jitter: true, on: false, vary: true, hist: [], order: [], lastId: '' };
  const ann = state.ann;
  const chatInput = () => [...document.querySelectorAll('input, textarea')].find((i) => /type something/i.test(i.placeholder || '') && !inPanel(i) && visible(i));
  // 變體：句尾加 . / .. / ...、改空格，用來避開「重複評論」
  function variants(t) {
    const base = t.trim();
    const end = (base.match(/[.!?。！？~]+$/) || [''])[0];
    const out = [base];
    if (end) out.push(base + end.slice(-1), base.slice(0, -end.length), base + ' .', base + end.slice(-1).repeat(2));
    else out.push(base + '.', base + '..', base + ' .', base + '...');
    const sp = base.indexOf(' ');
    if (sp > 0) out.push(base.slice(0, sp) + '  ' + base.slice(sp + 1)); // 兩個空格
    if (/\s{2,}/.test(base)) out.push(base.replace(/\s{2,}/, ' '));
    if (/[.!?。！]$/.test(base)) out.push(base.slice(0, -1));
    return [...new Set(out)].filter((x) => x.length <= 100);
  }
  // 下一條：隨機輪流，一輪內不重複，也不和上一條相同
  function pickNext(avoid) {
    let on = ann.items.filter((x) => x.on && x.text.trim());
    if (avoid && on.length > 1) on = on.filter((x) => x.id !== avoid);
    if (!on.length) return null;
    ann.order = (ann.order || []).filter((id) => on.some((x) => x.id === id));
    if (!ann.order.length) {
      const ids = on.map((x) => x.id).sort(() => Math.random() - 0.5);
      if (ids.length > 1 && ids[0] === ann.lastId) ids.push(ids.shift());
      ann.order = ids;
    }
    const id = ann.order.shift();
    return on.find((x) => x.id === id);
  }
  // 發送後 TikTok 頂部出現的錯誤提示（例如「rpc call error」）
  const SEND_ERR = /rpc call error|too frequent|too fast|try again later|failed to send|send failed|sending failed/i;
  const errToasts = () => xp("//*[not(*) and string-length(normalize-space(.))>3]").filter((e) => !inPanel(e) && visible(e) && SEND_ERR.test(e.textContent || ''));
  async function sendChat(text) {
    const before = new Set(errToasts());
    const sent = await sendChatRaw(text);
    if (!sent) return false;
    const err = await waitFor(() => errToasts().find((e) => !before.has(e)), 2500, 150);
    return err ? 'rpcerr' : true;
  }
  async function sendChatRaw(text) {
    const input = chatInput();
    if (!input) throw E('找不到聊天輸入框（Type something...）', 'Can\'t find the chat box (Type something...)');
    setVal(input, text, { blur: false });
    await sleep(250);
    if (input.value !== text) { typeVal(input, text); input.focus(); await sleep(250); }
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    if (await waitFor(() => !chatInput() || chatInput().value === '', 1500)) return true;
    // Enter 沒送出：點右邊的送出圖示
    let w = input; for (let i = 0; i < 4 && w; i++) { w = w.parentElement; if (w && w.querySelector('svg')) break; }
    const icons = w ? [...w.querySelectorAll('button, [role="button"], svg')].filter((e) => visible(e) && !e.contains(input)) : [];
    const btn = icons.length ? (icons[icons.length - 1].closest('button, [role="button"]') || icons[icons.length - 1]) : null;
    if (btn) { realClick(btn); if (await waitFor(() => !chatInput() || chatInput().value === '', 2000)) return true; }
    return false;
  }
  let annBusy = false;
  async function sendAnnouncement(item, manual) {
    if (annBusy) return false;
    const input = chatInput();
    if (input && document.activeElement === input && input.value && !manual) return 'typing'; // 你正在打字，晚點再發
    annBusy = true;
    try {
      const recent = (ann.hist || []).filter((h) => Date.now() - h.t < 30 * 60000).map((h) => h.text);
      const vs = ann.vary ? variants(item.text) : [item.text.trim()];
      const cands = vs.filter((v) => !recent.includes(v)).concat(vs.filter((v) => recent.includes(v)));
      for (const v of cands.slice(0, ann.vary ? 4 : 1)) {
        let ok = false;
        try { ok = await sendChat(v); } catch (e) { annLog(L('出錯：', 'Error: ') + e.message, 'err'); return false; }
        if (ok === 'rpcerr') { // TikTok 拒絕：記下這句（下次一定換變體），交給排程換另一條、拉長間隔
          ann.hist = [...(ann.hist || []), { t: Date.now(), text: v, id: item.id, err: 1 }].slice(-50);
          item.fail = (item.fail || 0) + 1; saveState();
          annLog(L('TikTok 顯示「rpc call error」：這次沒發出去，稍後換另一條並拉長間隔', 'TikTok showed “rpc call error”: not sent — will switch to another announcement and wait longer'), 'warn');
          return 'rpcerr';
        }
        if (ok) {
          ann.hist = [...(ann.hist || []), { t: Date.now(), text: v, id: item.id }].slice(-50);
          ann.lastId = item.id; item.sent = (item.sent || 0) + 1; item.lastAt = Date.now();
          saveState(); annLog(L('已發送：', 'Sent: ') + v, 'ok');
          return true;
        }
        const i2 = chatInput(); if (i2) setVal(i2, '', { blur: false }); // 沒被接受：清掉，換下一個變體
        await sleep(800);
      }
      annLog(L('TikTok 沒有接受這條公告（可能被判定重複或發言太頻繁）：', 'TikTok didn’t accept this announcement (duplicate or too frequent): ') + item.text, 'warn');
      return false;
    } finally { annBusy = false; }
  }
  let annNext = 0;
  const annInterval = () => Math.max(1, +ann.mins || 5) * 60000 * (ann.backoff || 1) * (ann.jitter ? 0.85 + Math.random() * 0.3 : 1);
  function annStart() { ann.on = true; ann.backoff = 1; ann.okStreak = 0; annNext = Date.now() + 3000; saveState(); renderAnn(); }
  function annStop() { ann.on = false; saveState(); renderAnn(); }
  async function annTick() {
    if (!ann.on || annBusy || Date.now() < annNext) return;
    const it = pickNext();
    if (!it) { annLog(L('沒有開啟的公告', 'No announcements switched on'), 'warn'); annNext = Date.now() + 30000; return; }
    const r = await sendAnnouncement(it, false);
    if (r === 'rpcerr') {
      // 被拒：間隔拉長 1.5 倍（最多 3 倍），20~40 秒後換另一條
      ann.backoff = Math.min(3, (ann.backoff || 1) * 1.5); ann.okStreak = 0;
      const nx = pickNext(it.id); if (nx) ann.order.unshift(nx.id);
      annNext = Date.now() + 20000 + Math.random() * 20000;
    } else {
      if (r === true && (ann.backoff || 1) > 1 && ++ann.okStreak >= 3) { ann.backoff = Math.max(1, ann.backoff / 1.5); ann.okStreak = 0; }
      annNext = Date.now() + (r === 'typing' ? 10000 : annInterval());
    }
    if (r === 'typing') ann.order.unshift(it.id);
    saveState(); renderAnn();
  }
  let renderAnn = () => {}, annLog = () => {}, updAnnSub = () => {}, annEditing = null;

  /* ---------------- 浮動面板（Shadow DOM，不受 TikTok 頁面樣式影響） ---------------- */
  const host = document.createElement('div');
  host.id = 'ttfill-panel';
  host.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  document.body.appendChild(host);
  const $ = (id) => root.getElementById(id);
  const CSS = `
    :host{all:initial}
    *{box-sizing:border-box}
    .card{--ink:#161823;--muted:#8a8b91;--line:#ececee;--soft:#f6f6f8;--accent:#fe2c55;--accent-soft:#fff0f3;
      --ok:#12a150;--ok-soft:#e9f7ef;--warn:#b26a00;--warn-soft:#fff6e5;--err:#e5322d;--err-soft:#fdeceb;--info:#3b6bdc;--info-soft:#eef3fe;
      width:372px;max-height:min(86vh,760px);display:flex;flex-direction:column;background:#fff;color:var(--ink);
      font:13px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang TC","Helvetica Neue",sans-serif;
      border-radius:14px;box-shadow:0 12px 40px rgba(22,24,35,.18),0 0 0 1px rgba(22,24,35,.06);overflow:hidden}
    button{font:inherit;cursor:pointer;border:0;background:none;color:inherit}
    button:disabled{opacity:.35;cursor:default}
    input,textarea{font:inherit;color:var(--ink)}

    .hd{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--ink);color:#fff;cursor:grab;user-select:none;flex:none}
    .hd:active{cursor:grabbing}
    .logo{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#25f4ee 0 45%,#fe2c55 55%);flex:none}
    .ttl{font-weight:650;font-size:14px;letter-spacing:.2px}
    .sub{font-size:11px;color:#a9aab0}
    .grow{flex:1;min-width:0}
    .pill{font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,.14)}
    .pill:empty{display:none}
    .iconbtn{width:26px;height:26px;border-radius:7px;color:#fff;display:grid;place-items:center;font-size:14px}
    .iconbtn:hover{background:rgba(255,255,255,.12)}
    .bar{height:3px;background:#2a2c38;flex:none}
    .bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .3s}

    .tabs{display:flex;gap:4px;margin:10px 14px 0;padding:3px;background:var(--soft);border-radius:9px;flex:none}
    .tabs button{flex:1;padding:6px 0;border-radius:7px;color:var(--muted);font-weight:600;font-size:12.5px}
    .tabs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}

    .bd{padding:10px 14px 14px;overflow:auto;flex:1}
    .hide{display:none!important}

    .sec{display:flex;align-items:center;gap:8px;margin:14px 0 6px;font-size:11.5px;font-weight:650;color:var(--muted);text-transform:uppercase;letter-spacing:.4px}
    .sec:first-child{margin-top:4px}
    .sec .grow{font-weight:500;text-transform:none;letter-spacing:0}
    .link{color:var(--info);font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;padding:0 2px}
    .link:hover{text-decoration:underline}

    .fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .field{display:flex;flex-direction:column;gap:3px}
    .field span{font-size:11px;color:var(--muted)}
    .inp{width:100%;height:32px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s}
    .inp:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    textarea{width:100%;height:72px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;resize:vertical;outline:none;font:11.5px/1.4 ui-monospace,Menlo,monospace}

    .list{border:1px solid var(--line);border-radius:10px;max-height:210px;overflow:auto}
    .row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-top:1px solid var(--line)}
    .row:first-child{border-top:0}
    label.row{cursor:pointer}
    label.row:hover{background:var(--soft)}
    .row .txt{flex:1;min-width:0}
    .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:550}
    .meta{font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .chk{appearance:none;width:17px;height:17px;border:1.5px solid #c9cad0;border-radius:5px;flex:none;display:grid;place-items:center;margin:0;cursor:pointer}
    .chk:checked{background:var(--accent);border-color:var(--accent)}
    .chk:checked::after{content:"";width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
    .tag{font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:99px;white-space:nowrap;flex:none}
    .t-muted{background:var(--soft);color:var(--muted)} .t-ok{background:var(--ok-soft);color:var(--ok)}
    .t-warn{background:var(--warn-soft);color:var(--warn)} .t-err{background:var(--err-soft);color:var(--err)}
    .t-info{background:var(--info-soft);color:var(--info)}
    .empty{padding:18px;text-align:center;color:var(--muted);font-size:12px}

    .btn{height:34px;padding:0 14px;border-radius:9px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:background .15s,transform .05s}
    .btn:active:not(:disabled){transform:translateY(1px)}
    .primary{background:var(--accent);color:#fff} .primary:hover:not(:disabled){background:#e9254b}
    .dark{background:var(--ink);color:#fff} .dark:hover:not(:disabled){background:#2b2d3a}
    .ghost{background:var(--soft);color:var(--ink)} .ghost:hover:not(:disabled){background:#ececf0}
    .block{width:100%;margin-top:8px}
    .big{height:40px;font-size:14px}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}
    .grid4 .btn{height:30px;padding:0 4px;font-size:12px;font-weight:550}
    kbd{font:10px ui-monospace,Menlo,monospace;color:var(--muted);margin-left:2px}

    .switch{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:var(--muted);cursor:pointer;user-select:none}
    .switch input{appearance:none;width:30px;height:18px;border-radius:99px;background:#d6d7dc;position:relative;margin:0;cursor:pointer;transition:background .2s;flex:none}
    .switch input::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.2)}
    .switch input:checked{background:var(--accent)} .switch input:checked::after{left:14px}

    .msg{white-space:pre-line;margin-top:10px;padding:8px 10px;border-radius:8px;font-size:12px;line-height:1.45;background:var(--info-soft);color:var(--info)}
    .msg:empty{display:none}
    .msg.ok{background:var(--ok-soft);color:var(--ok)} .msg.warn{background:var(--warn-soft);color:var(--warn)} .msg.err{background:var(--err-soft);color:var(--err)}

    .q .idx{width:20px;text-align:right;color:var(--muted);font-size:11px;flex:none}
    .q.cur{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--accent)}
    .q{cursor:pointer}

    .tools{margin-top:10px;border:1px solid var(--line);border-radius:10px}
    .tools summary{padding:8px 10px;cursor:pointer;font-size:12px;font-weight:600;color:var(--muted);list-style:none}
    .tools summary::-webkit-details-marker{display:none}
    .tools summary::before{content:"▸ ";} .tools[open] summary::before{content:"▾ ";}
    .tools .in{padding:0 10px 10px}
    .btnrow{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
    .btnrow .btn{height:28px;padding:0 10px;font-size:12px;font-weight:550}
    .hint{font-size:11px;color:var(--muted);margin-top:6px}

    .item{border:1px solid var(--line);border-radius:10px;padding:9px 10px;margin-top:8px}
    .item.edit{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    .item .top{display:flex;align-items:center;gap:6px}
    .acts{display:flex;gap:2px;flex:none}
    .acts button{height:24px;min-width:24px;padding:0 6px;border-radius:6px;font-size:12px;color:var(--muted)}
    .acts button:hover{background:var(--soft);color:var(--ink)}
    .acts .del.confirm{background:var(--err);color:#fff}
    .form{display:grid;grid-template-columns:64px 1fr;gap:6px 8px;align-items:center;margin-top:4px}
    .form label{font-size:11.5px;color:var(--muted)}
    .form .inp{height:30px}
    .dims{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    .err{color:var(--err);font-size:12px;margin-left:6px}
    .fields.f3{grid-template-columns:1fr 1fr 1fr}
    .gallery{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
    .gallery:empty{display:none}
    .th{position:relative;width:58px;height:58px;border-radius:8px;overflow:hidden;border:1px solid var(--line);background:var(--soft) center/cover no-repeat;cursor:pointer;flex:none}
    .th.sel{outline:2px solid var(--accent);outline-offset:1px}
    .th .star,.th .x{position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:rgba(22,24,35,.6);color:#fff;font-size:11px;line-height:18px;text-align:center;border:0;padding:0;cursor:pointer}
    .th .star{left:2px;color:#ffd24a;opacity:.35} .th .star.on{opacity:1}
    .th .x{right:2px;opacity:0} .th:hover .x{opacity:1}
    .th .cut{position:absolute;bottom:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(22,24,35,.6);color:#fff;font-size:10px;line-height:18px;text-align:center;border:0;padding:0;cursor:pointer;opacity:0}
    .th:hover .cut{opacity:1}
    .card{position:relative}
    .cropov{position:absolute;inset:0;z-index:20;background:rgba(22,24,35,.55);display:grid;place-items:center;padding:12px}
    .cropbox{background:#fff;border-radius:12px;padding:12px;width:308px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
    .vp{position:relative;width:280px;height:280px;margin:8px 0;overflow:hidden;border-radius:8px;background:#eee;cursor:grab;touch-action:none}
    .vp:active{cursor:grabbing}
    .vp img{position:absolute;left:0;top:0;max-width:none;user-select:none;pointer-events:none}
    .vp .grid{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 2px rgba(255,255,255,.9);
      background:linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)) 33.33% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)) 66.66% 0/1px 100% no-repeat,
      linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)) 0 33.33%/100% 1px no-repeat,linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)) 0 66.66%/100% 1px no-repeat}
    .zoom{width:100%;accent-color:var(--accent)}
    .th.none{display:grid;place-items:center;font-size:11px;color:var(--muted);background:#fff}
    .th.add{display:grid;place-items:center;font-size:20px;color:var(--muted);background:#fff;border-style:dashed}
    .mini{width:32px;height:32px;border-radius:6px;background:var(--soft) center/cover no-repeat;flex:none;border:1px solid var(--line)}
    .tabs .dot{display:none;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-left:5px;vertical-align:middle;animation:pulse 1.2s infinite}
    .tabs .dot.on{display:inline-block}
    .tabs button{font-size:12px}
    .an{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:8px;background:#fff}
    .an-top{display:flex;gap:10px;align-items:flex-start}
    .an-top .switch{margin:1px 0 0}
    .an-text{flex:1;min-width:0;font-size:13px;line-height:1.45;font-weight:550;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
    .an-text.empty{color:var(--muted);font-weight:400}
    .an-meta{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 0 40px}
    .an-btns{display:flex;gap:6px;margin:8px 0 0 40px}
    .an.editing{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    .an.editing .an-btns,.an.editing .an-meta{margin-left:0}
    .btn.sm{height:28px;padding:0 12px;font-size:12px;font-weight:600}
    .btn.danger{color:var(--err)}
    .btn.danger.confirm{background:var(--err);color:#fff}
    .opts{display:flex;flex-direction:column;gap:6px;margin-top:10px;padding:8px 10px;background:var(--soft);border-radius:10px}
    .opts .switch{margin:0}
    .an.off{opacity:.55}
    .an textarea{height:54px;font:13px/1.4 -apple-system,BlinkMacSystemFont,sans-serif}
    .an .row2{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:11.5px;color:var(--muted)}
    .an .cnt.over{color:var(--err);font-weight:700}
    .lo{border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin-top:8px}
    .lo .h{display:flex;align-items:center;gap:6px}
    .lo .no{flex:none;font-size:16px;font-weight:800;line-height:1;color:#fff;background:#e5132f;padding:5px 9px;border-radius:7px;letter-spacing:.3px;box-shadow:0 1px 0 rgba(0,0,0,.15)}
    .lo .rp .rm{font-weight:700;font-size:13px;color:var(--ink)}
    .lo .who{font-weight:650;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lo .rp{margin-top:4px;padding:5px 8px;background:var(--soft);border-radius:8px;font-size:12px}
    .lo .rp div{padding:1px 0}
    .lo .rp b{color:var(--muted);font-weight:500;margin-right:6px;font-variant-numeric:tabular-nums}
    .catcard{margin-top:10px;border:1px solid var(--line);border-radius:10px;padding:9px 10px}
    .acwrap{position:relative}
    .ac{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:5;background:#fff;border:1px solid var(--line);border-radius:10px;
      box-shadow:0 10px 30px rgba(22,24,35,.16);max-height:240px;overflow:auto;display:none}
    .ac.on{display:block}
    .ac div{padding:7px 10px;font-size:12px;cursor:pointer;border-top:1px solid var(--line);line-height:1.35}
    .ac div:first-child{border-top:0}
    .ac div:hover,.ac div.hl{background:var(--accent-soft)}
    .ac b{color:var(--accent);font-weight:650}
    .ac .path{color:var(--muted)}
    .ac .none{color:var(--muted);cursor:default}
    .list.tall{max-height:300px}
    .search{height:30px;margin-bottom:6px;background:var(--soft);border-color:transparent}
    .search:focus{background:#fff}
    .grid3{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:6px;margin-top:6px}
    .grid3 .btn{height:30px;padding:0 4px;font-size:12px;font-weight:550}
    .summary{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;margin:4px 0 10px;background:var(--soft);border-radius:10px}
    .sum-t{font-weight:650;font-size:13.5px}
    .stats{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
    .btn.stop{background:var(--ink);color:#fff}
    .q.busy .tag{animation:pulse 1s infinite}
    @keyframes pulse{50%{opacity:.4}}

    .bodywrap{display:grid;grid-template-rows:1fr;min-height:0;transition:grid-template-rows .38s cubic-bezier(.4,0,.2,1)}
    .min .bodywrap{grid-template-rows:0fr}
    .body{display:flex;flex-direction:column;min-height:0;max-height:calc(min(86vh,760px) - 70px);overflow:hidden;transition:opacity .3s ease}
    .min .body{opacity:0}
    .min .bar{opacity:.6}
    .langsel{appearance:none;-webkit-appearance:none;height:24px;padding:0 8px;border-radius:7px;border:0;background:rgba(255,255,255,.12);color:#fff;
      font:600 11px/24px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;outline:none}
    .langsel:hover{background:rgba(255,255,255,.2)}
    .langsel option{color:#161823}
    .langsel:disabled{opacity:.4}
`;

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function setMsg(m, type) { const el = $('ttf-msg'); if (!el) return; el.textContent = m; el.className = 'msg ' + (type || ''); }
  function alertMsg(m, type) { const el = $('ttf-libmsg'); if (!el) return; el.textContent = m; el.className = 'msg ' + (type || 'ok'); }
  const lastSeg = (c) => (c || '').split(/\s+-\s+/).pop();

  // 狀態在資料裡用固定的中文代碼，顯示時才翻譯
  function chip(st) {
    if (st.startsWith('✅')) return ['t-ok', L('已提交', 'Submitted')];
    if (st.startsWith('❌')) return ['t-err', L('出錯', 'Error')];
    if (st.startsWith('待確認') || st === '等你手動選類目' || st === '已填好（類目請確認）') return ['t-warn', L('待確認', 'Check')];
    if (st === '已填好') return ['t-info', L('已填好', 'Filled')];
    if (st === '填寫中') return ['t-info', L('填寫中', 'Filling')];
    if (st === '已取消') return ['t-muted', L('已取消', 'Cancelled')];
    return ['t-muted', L('待上架', 'To do')];
  }

  const SUFFIX = '  - {PT} - {DATE}';
  const baseName = (tpl) => tpl.replace(/\s*-\s*\{PT\}\s*-\s*\{DATE\}\s*$/, '').trim();
  const toTpl = (base) => toTemplate(base);
  let editing = null; // 正在編輯的商品 id，或 'new'
  let showSetup = false;
  let curTab = 'go';
  let dateVal = today();

  function html() {
    return `<style>${CSS}</style>
  <div class="card" id="card">
    <div class="hd" id="hd">
      <div class="logo"></div>
      <div class="grow"><div class="ttl">${L('TikTok Live小助手', 'TikTok Live Helper')}</div><div class="sub">${L('一鍵上架 · Temporary listing', 'Quick upload · Temporary listing')}</div></div>
      <span class="pill" id="ttf-count"></span>
      <select class="langsel" id="ttf-lang" title="Language">
        <option value="hant">繁</option><option value="hans">简</option><option value="en">EN</option>
      </select>
      <button class="iconbtn" id="ttf-min" title="${L('收起 / 展開（也可以雙擊標題列）', 'Collapse / expand (or double-click the title bar)')}">–</button>
    </div>
    <div class="bar"><i id="ttf-bar"></i></div>
    <div class="bodywrap"><div class="body" id="body">
    <div class="tabs"><button data-t="go">${L('今天上架', 'Today')}</button><button data-t="lib">${L('商品庫', 'Library')}</button><button data-t="live">${L('直播檢測', 'Live')}<span class="dot" id="ttf-livedot"></span></button><button data-t="ann">${L('自動公告', 'Notices')}<span class="dot" id="ttf-anndot"></span></button></div>

    <div class="bd" id="tab-go">
      <div id="view-setup">
        <div class="fields f3" style="margin-top:4px">
          <label class="field"><span>${L('場次', 'Session (PT)')}</span><input class="inp" type="text" id="ttf-pt" placeholder="PT1"></label>
          <label class="field"><span>${L('日期 (MMDD)', 'Date (MMDD)')}</span><input class="inp" type="text" id="ttf-date" placeholder="1027"></label>
          <label class="field"><span>${L('預設數量', 'Default qty')}</span><input class="inp" type="text" inputmode="numeric" id="ttf-qty" placeholder="500"></label>
        </div>
        <div class="sec">${L('商品', 'Products')} <span class="grow" id="ttf-selcount"></span><button class="link" id="ttf-all">${L('全選', 'All')}</button><button class="link" id="ttf-none">${L('清空', 'None')}</button></div>
        <input class="inp search" type="text" id="ttf-q" placeholder="${L('搜尋商品…', 'Search products…')}">
        <div class="list tall" id="ttf-pick"></div>
        <button class="btn primary block big" id="ttf-gen">${L('生成上架清單 →', 'Create upload list →')}</button>
      </div>

      <div id="view-run" class="hide">
        <div class="summary">
          <div class="grow">
            <div class="sum-t" id="ttf-sumt"></div>
            <div class="stats" id="ttf-stats"></div>
          </div>
          <button class="link" id="ttf-edit">${L('← 重新選商品', '← Change products')}</button>
        </div>
        <button class="btn primary block big" id="ttf-run"></button>
        <div class="grid3">
          <button class="btn ghost" id="ttf-back" title="${L('回到上一個', 'Go to previous')}">${L('‹ 上一個', '‹ Prev')}</button>
          <button class="btn ghost" id="ttf-go" title="${L('只填目前這一個', 'Fill only the current one')}">${L('填這個', 'Fill this')}<kbd>⌥F</kbd></button>
          <button class="btn ghost" id="ttf-skip" title="${L('跳過目前這一個', 'Skip the current one')}">${L('跳過 ›', 'Skip ›')}<kbd>⌥N</kbd></button>
        </div>
        <label class="switch"><input type="checkbox" id="ttf-auto">${L('「填這個」也自動按 Submit', 'Auto-Submit after “Fill this”')}</label>
        <div class="msg" id="ttf-msg"></div>
        <div class="list tall" id="ttf-list" style="margin-top:10px"></div>
        <div class="hint">${L('點清單裡任何一行，可以從那一行開始。', 'Click any row to start from it.')}</div>
      </div>
    </div>

    <div class="bd hide" id="tab-live">
      <div class="summary" style="align-items:center">
        <div class="grow"><div class="sum-t" id="ttf-livestat"></div><div class="meta" id="ttf-livesub"></div></div>
        <label class="field" style="width:86px"><span>${L('回覆時間(分)', 'Reply window (min)')}</span><input class="inp" type="text" inputmode="decimal" id="ttf-livemins"></label>
      </div>
      <button class="btn primary block big" id="ttf-livego"></button>
      <div class="btnrow">
        <button class="btn ghost" id="ttf-livecsv">${L('⬇ 匯出並清空', '⬇ Export & clear')}</button>
        <button class="btn ghost" id="ttf-liveclr">${L('清空記錄', 'Clear records')}</button>
        <button class="btn ghost" id="ttf-livediag">${L('直播診斷', 'Live diagnostics')}</button>
      </div>
      <div class="sec">${L('評論大窗（給主播看）', 'Big comment window (for the host)')}</div>
      <div class="btnrow">
        <button class="btn dark" id="ttf-feedwin">${L('⧉ 彈出評論窗', '⧉ Pop out comments')}</button>
        <button class="btn ghost" id="ttf-feedpip">${L('📌 置頂小窗', '📌 Always-on-top')}</button>
      </div>
      <label class="field" style="margin-top:6px"><span>${L('主播帳號名稱（發公告時自動辨認，也可自己填）', 'Host account name (auto-detected from notices, or type it)')}</span><input class="inp" type="text" id="ttf-feedhost"></label>
      <div class="hint">${L('評論窗可以拖到第二個螢幕或按「全螢幕」；字體大小、只看得標客人都在窗口上方調整。每個客人固定一個顏色，得標的客人前面有紅色 #編號。', 'Drag the window to a second screen or press “Full screen”; font size and “Winners only” are at the top of the window. Each customer keeps one colour, and winners get a red #number.')}</div>
      <input class="inp search" type="text" id="ttf-liveq" placeholder="${L('搜尋編號 / 客人 / listing…', 'Search no. / customer / listing…')}" style="margin-top:10px">
      <div class="msg" id="ttf-livemsg"></div>
      <div id="ttf-livelist"></div>
    </div>

    <div class="bd hide" id="tab-ann">
      <div class="summary" style="align-items:center;margin-bottom:8px">
        <div class="grow"><div class="sum-t" id="ttf-annstat"></div><div class="meta" id="ttf-annsub"></div></div>
        <label class="field" style="width:78px"><span>${L('間隔(分)', 'Every (min)')}</span><input class="inp" type="text" inputmode="decimal" id="ttf-annmins"></label>
      </div>
      <button class="btn primary block big" id="ttf-anngo"></button>
      <div class="opts">
        <label class="switch"><input type="checkbox" id="ttf-annjit">${L('間隔隨機浮動 ±15%', 'Randomize interval ±15%')}</label>
        <label class="switch"><input type="checkbox" id="ttf-annvary">${L('避開重複（自動加 . / .. 或改空格）', 'Avoid duplicates (add . / .. or tweak spaces)')}</label>
      </div>
      <div class="msg" id="ttf-annmsg"></div>
      <div class="sec">${L('公告內容', 'Announcements')} <span class="grow" id="ttf-anncount"></span><button class="btn dark sm" id="ttf-annadd">${L('＋ 新增', '＋ Add')}</button></div>
      <div id="ttf-annlist"></div>
      <div class="hint">${L('開啟的公告隨機輪流發送，一輪內不重複。出現「rpc call error」時會換另一條並自動拉長間隔。', 'Enabled announcements rotate randomly without repeats. On “rpc call error” it switches announcement and waits longer.')}</div>
    </div>

    <div class="bd hide" id="tab-lib">
      <button class="btn primary block" id="ttf-add" style="margin-top:4px">${L('＋ 新增商品', '＋ Add product')}</button>
      <div class="catcard">
        <div class="top"><div class="grow"><div class="nm">${L('TikTok 類目庫', 'TikTok category list')}</div><div class="meta" id="ttf-catinfo"></div></div></div>
        <div class="btnrow">
          <button class="btn dark" id="ttf-catup">${L('讀取 / 更新', 'Read / update')}</button>
          <button class="btn ghost" id="ttf-catfull">${L('全部重新讀取', 'Full re-read')}</button>
          <button class="btn ghost" id="ttf-catdiag">${L('類目診斷', 'Category diagnostics')}</button>
        </div>
        <div class="btnrow">
          <button class="btn ghost" id="ttf-catexp">${L('⬇ 匯出類目庫', '⬇ Export categories')}</button>
          <button class="btn ghost" id="ttf-catimp">${L('⬆ 匯入類目庫', '⬆ Import categories')}</button>
        </div>
        <div class="msg" id="ttf-catmsg"></div>
      </div>
      <div class="catcard">
        <div class="top"><div class="grow"><div class="nm">${L('圖片庫', 'Image library')}</div>
          <div class="meta">${L('類目要求圖片、商品又沒指定圖片時，會用 ★ 預設圖片。', 'When a category requires an image and the product has none, the ★ default image is used.')}</div></div></div>
        <div class="gallery" id="ttf-gal"></div>
        <div class="btnrow"><button class="btn dark" id="ttf-imgadd">${L('＋ 上傳圖片', '＋ Upload images')}</button></div>
        <input type="file" id="ttf-imgfile" accept="image/*" multiple style="display:none">
        <div class="msg" id="ttf-imgmsg"></div>
      </div>
      <details class="tools">
        <summary>${L('匯入 · 備份 · 工具', 'Import · Backup · Tools')}</summary>
        <div class="in">
          <textarea id="ttf-in" placeholder="${L('Excel 選 E:J 複製後貼上（名稱、重量、H、W、L、類目）&#10;舊的 PT 和日期會自動換成今天的', 'Copy columns E:J in Excel and paste here (name, weight, H, W, L, category)&#10;Old PT and dates are replaced with today’s')}"></textarea>
          <div class="btnrow">
            <button class="btn dark" id="ttf-imp">${L('匯入', 'Import')}</button>
            ${DEFAULT_LIB.length ? `<button class="btn ghost" id="ttf-def">${L('補回預設', 'Restore defaults')}</button>` : ''}
            <button class="btn ghost" id="ttf-fullexp">${L('⬇ 下載完整備份', '⬇ Download full backup')}</button>
            <button class="btn ghost" id="ttf-fullimp">${L('⬆ 匯入備份檔', '⬆ Import backup file')}</button>
            <button class="btn ghost" id="ttf-exp">${L('複製備份', 'Copy backup')}</button>
            <button class="btn ghost" id="ttf-restore">${L('從備份還原', 'Restore backup')}</button>
            <button class="btn ghost" id="ttf-diag">${L('診斷', 'Diagnose')}</button>
          </div>
          <div class="hint">${L('資料存在這台電腦的 Chrome 裡。「下載完整備份」會把商品庫、類目庫和設定存成一個檔案，在別的電腦按「匯入備份檔」就能搬過去。', 'Data is stored in this computer’s Chrome. “Download full backup” saves products, categories and settings in one file — use “Import backup file” on another computer to move everything.')}</div>
        </div>
      </details>
      <div class="msg" id="ttf-libmsg"></div>
      <input type="file" id="ttf-file" accept=".json,application/json" style="display:none">
      <input class="inp search" type="text" id="ttf-lq" placeholder="${L('搜尋商品庫…', 'Search library…')}" style="margin-top:10px">
      <div id="ttf-lib"></div>
    </div>
    </div></div>
  </div>`;
  }

  function render() {
    const list = $('ttf-list');
    if (!list) return;
    list.innerHTML = '';
    list.classList.toggle('hide', !state.rows.length);
    state.rows.forEach((r, i) => {
      const [cls, label] = chip(r.status);
      const d = document.createElement('div');
      d.className = 'row q' + (i === state.idx ? ' cur' : '') + (r.status === '填寫中' ? ' busy' : '');
      const detail = r.status.startsWith('❌') ? r.status.slice(2) : r.status.startsWith('待確認：') ? r.status.slice(4)
        : `${lastSeg(r.cat) || L('沒有類目', 'no category')} · ${r.weight} lb · H${r.h} W${r.w} L${r.l}${r.qty ? ' · ×' + r.qty : ''}${r.battery ? ' · 🔋' : ''}`;
      d.innerHTML = `<span class="idx">${i + 1}</span><div class="txt"><div class="nm" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</div><div class="meta" title="${escapeHtml(detail)}">${escapeHtml(detail)}</div></div><span class="tag ${cls}">${label}</span>`;
      d.onclick = () => { if (busy) return; state.idx = i; saveState(); render(); };
      list.appendChild(d);
    });
    const done = state.rows.filter((r) => r.status.startsWith('✅')).length;
    const warn = state.rows.filter((r) => chip(r.status)[0] === 't-warn').length;
    const err = state.rows.filter((r) => r.status.startsWith('❌')).length;
    const left = state.rows.length - done;
    $('ttf-sumt').textContent = state.rows.length ? [state.runPt, state.runDate, L(`共 ${state.rows.length} 個`, `${state.rows.length} items`)].filter(Boolean).join(' · ') : '';
    $('ttf-stats').innerHTML = `<span class="tag t-ok">${L('已提交', 'Submitted')} ${done}</span><span class="tag t-muted">${L('剩', 'Left')} ${left}</span>` +
      (warn ? `<span class="tag t-warn">${L('待確認', 'Check')} ${warn}</span>` : '') + (err ? `<span class="tag t-err">${L('出錯', 'Error')} ${err}</span>` : '');
    if (!busy) {
      const rb = $('ttf-run');
      rb.className = 'btn primary block big';
      rb.disabled = !left;
      rb.textContent = !left ? L('✓ 全部完成', '✓ All done') : done || warn || err ? L(`▶ 上架剩下的 ${left} 個`, `▶ Upload remaining ${left}`) : L(`▶ 全部自動上架（${left} 個）`, `▶ Auto-upload all (${left})`);
    }
    showView();
    $('ttf-count').textContent = state.rows.length ? `${done} / ${state.rows.length}` : '';
    $('ttf-bar').style.width = state.rows.length ? (done / state.rows.length * 100) + '%' : '0';
    $('ttf-auto').checked = !!state.auto;
    const cur = list.querySelector('.cur');
    if (cur && !$('card').classList.contains('min')) cur.scrollIntoView({ block: 'nearest' });
  }

  // 縮圖：先放占位，再非同步填圖
  function thumb(id, cls) {
    const el = document.createElement('div');
    el.className = cls || 'th';
    imgURL(id).then((u) => { if (u) el.style.backgroundImage = `url("${u}")`; });
    return el;
  }
  function renderGallery() {
    const g = $('ttf-gal');
    if (!g) return;
    g.innerHTML = '';
    for (const m of state.imgs) {
      const t = thumb(m.id);
      t.title = m.name + (m.w ? ` (${m.w}×${m.h})` : '');
      const used = state.lib.filter((x) => x.img === m.id).length;
      t.innerHTML = `<button class="star ${state.defImg === m.id ? 'on' : ''}" title="${L('設為預設圖片', 'Set as default image')}">★</button><button class="x" title="${L('刪除', 'Delete')}">×</button><button class="cut" title="${L('重新裁剪', 'Re-crop')}">✂</button>`;
      t.querySelector('.cut').onclick = async (e) => { e.stopPropagation(); if (await recropImage(m.id)) renderLib(); };
      t.querySelector('.star').onclick = (e) => { e.stopPropagation(); state.defImg = state.defImg === m.id ? '' : m.id; saveState(); renderGallery(); };
      t.querySelector('.x').onclick = async (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        if (!btn.dataset.c) { btn.dataset.c = '1'; btn.style.opacity = 1; btn.style.background = 'var(--err)'; btn.title = L(`再按一次刪除${used ? `（${used} 個商品在用）` : ''}`, `Press again to delete${used ? ` (used by ${used})` : ''}`); setTimeout(() => { delete btn.dataset.c; btn.style.cssText = ''; }, 3000); return; }
        await removeImage(m.id); renderLib();
      };
      g.appendChild(t);
    }
  }
  function renderFormPicker(d) {
    const fp = d.querySelector('.fpick');
    if (!fp) return;
    const draw = () => {
      fp.innerHTML = '';
      const none = document.createElement('div');
      none.className = 'th none' + (fp.dataset.img ? '' : ' sel');
      none.textContent = L('不用', 'None');
      none.onclick = () => { fp.dataset.img = ''; draw(); };
      fp.appendChild(none);
      for (const m of state.imgs) {
        const t = thumb(m.id, 'th' + (fp.dataset.img === m.id ? ' sel' : ''));
        t.title = m.name;
        t.onclick = () => { fp.dataset.img = m.id; draw(); };
        fp.appendChild(t);
      }
      const add = document.createElement('label');
      add.className = 'th add'; add.title = L('上傳新圖片', 'Upload a new image');
      add.innerHTML = '＋<input type="file" accept="image/*" style="display:none">';
      add.querySelector('input').onchange = async (e) => {
        const ids = await addImages([...e.target.files]);
        if (ids[0]) fp.dataset.img = ids[0];
        renderGallery(); draw();
      };
      fp.appendChild(add);
    };
    draw();
  }

  function renderPick() {
    const box = $('ttf-pick');
    if (!box) return;
    box.innerHTML = state.lib.length ? '' : `<div class="empty">${L('商品庫是空的，到「商品庫」新增或匯入', 'The library is empty — add or import products in “Library”')}</div>`;
    const q = norm($('ttf-q').value);
    state.lib.forEach((it) => {
      if (q && !norm(it.name + ' ' + it.cat).includes(q)) return;
      const lab = document.createElement('label');
      lab.className = 'row';
      lab.innerHTML = `<input class="chk" type="checkbox" ${it.sel ? 'checked' : ''}><div class="txt"><div class="nm" title="${escapeHtml(baseName(it.name))}">${escapeHtml(baseName(it.name))}</div><div class="meta">${it.cat ? escapeHtml(lastSeg(it.cat)) + ' · ' : ''}${escapeHtml(it.weight)} lb${it.qty ? ' · ×' + escapeHtml(it.qty) : ''}</div></div>${it.img ? '<span class="tag t-muted">🖼</span>' : ''}${it.battery ? '<span class="tag t-info">🔋</span>' : ''}${it.cat ? '' : `<span class="tag t-warn">${L('沒類目', 'No cat.')}</span>`}`;
      lab.querySelector('input').onchange = (e) => { it.sel = e.target.checked; saveState(); updSel(); };
      box.appendChild(lab);
    });
    updSel();
  }
  function updSel() {
    $('ttf-selcount').textContent = state.lib.length ? L(`已選 ${state.lib.filter((x) => x.sel).length} / ${state.lib.length}`, `${state.lib.filter((x) => x.sel).length} / ${state.lib.length} selected`) : '';
  }

  function formHtml(it) {
    return `
      <div class="form">
        <label>${L('名稱', 'Name')}</label><input class="inp" type="text" data-f="name" value="${escapeHtml(baseName(it.name || ''))}" placeholder="(Heater) item Shown on Screen - No Cancellation">
        <span></span><span class="hint" style="margin:0">${L('場次和日期會自動加在後面，例如 … - PT1 - 1027', 'Session and date are added automatically, e.g. … - PT1 - 1027')}</span>
        <label>${L('類目', 'Category')}</label><div class="acwrap"><input class="inp" type="text" data-f="cat" autocomplete="off" value="${escapeHtml(it.cat || '')}" placeholder="${cats.paths.length ? L('輸入關鍵字，從清單選', 'Type a keyword, pick from the list') : L('完整路徑最準（可先讀取類目庫）', 'Full path is best (read the category list first)')}"><div class="ac"></div></div>
        <label>${L('數量', 'Quantity')}</label><input class="inp" type="text" inputmode="numeric" data-f="qty" value="${escapeHtml(it.qty || '')}" placeholder="${L('留空＝用「今天上架」的預設數量', 'Blank = use the default qty on “Today”')}">
        <label>${L('重量 lb', 'Weight lb')}</label><input class="inp" type="text" data-f="weight" value="${escapeHtml(it.weight || '')}" placeholder="1.5">
        <label>${L('圖片', 'Image')}</label><div><div class="gallery fpick" data-img="${escapeHtml(it.img || '')}"></div></div>
        <label>${L('電池', 'Battery')}</label><label class="switch" style="margin:0;color:var(--ink)"><input type="checkbox" data-b="battery" ${it.battery ? 'checked' : ''}>${L('含鋰電池（裝在產品內）', 'Contains lithium-ion battery (installed)')}</label>
        <label>H · W · L</label><div class="dims"><input class="inp" type="text" data-f="h" placeholder="H" value="${escapeHtml(it.h || '')}"><input class="inp" type="text" data-f="w" placeholder="W" value="${escapeHtml(it.w || '')}"><input class="inp" type="text" data-f="l" placeholder="L" value="${escapeHtml(it.l || '')}"></div>
      </div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:6px">
        <button class="btn primary" data-a="save" style="height:30px">${L('保存', 'Save')}</button>
        <button class="btn ghost" data-a="cancel" style="height:30px">${L('取消', 'Cancel')}</button>
        <span class="err"></span>
      </div>`;
  }

  // 類目輸入框的自動完成
  function attachCatAC(d) {
    const inp = d.querySelector('input[data-f=cat]');
    const ac = d.querySelector('.ac');
    if (!inp || !ac) return;
    let hl = -1, items = [];
    const hi = (p, q) => {
      const segs = p.split(' - ');
      const last = segs.pop();
      const mark = (t) => { let r = escapeHtml(t); for (const w of norm(q).split(' ').filter(Boolean)) r = r.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<b>$1</b>'); return r; };
      return `${mark(last)}<div class="path" style="padding:0;border:0">${mark(segs.join(' › '))}</div>`;
    };
    const show = () => {
      const q = inp.value;
      if (!cats.paths.length) { ac.classList.remove('on'); return; }
      items = q.trim().length >= 2 ? searchCats(q) : [];
      hl = -1;
      if (!q.trim() || q.includes(' - ') && catSet.has(norm(q))) { ac.classList.remove('on'); return; }
      ac.innerHTML = items.length ? items.map((p, i) => `<div data-i="${i}">${hi(p, q)}</div>`).join('') : `<div class="none">${L('沒有符合的類目', 'No matching category')}</div>`;
      ac.classList.add('on');
      ac.querySelectorAll('[data-i]').forEach((el) => el.addEventListener('mousedown', (e) => { e.preventDefault(); pick(+el.dataset.i); }));
    };
    const pick = (i) => { if (!items[i]) return; inp.value = items[i]; ac.classList.remove('on'); };
    const mark = () => ac.querySelectorAll('[data-i]').forEach((el, i) => { el.classList.toggle('hl', i === hl); if (i === hl) el.scrollIntoView({ block: 'nearest' }); });
    inp.addEventListener('input', show);
    inp.addEventListener('focus', show);
    inp.addEventListener('blur', () => setTimeout(() => ac.classList.remove('on'), 120));
    inp.addEventListener('keydown', (e) => {
      if (!ac.classList.contains('on') || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); hl = Math.min(items.length - 1, hl + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hl = Math.max(0, hl - 1); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(hl < 0 ? 0 : hl); }
      else if (e.key === 'Escape') ac.classList.remove('on');
    });
  }

  function readForm(d) {
    const v = {};
    d.querySelectorAll('input[data-f]').forEach((i) => (v[i.dataset.f] = i.value.trim()));
    const b = d.querySelector('input[data-b=battery]'); v.battery = !!(b && b.checked);
    const fp = d.querySelector('.fpick'); v.img = fp ? fp.dataset.img || '' : '';
    if (!v.name) return L('請填名稱', 'Please enter a name');
    for (const k of ['weight', 'h', 'w', 'l']) if (!(parseFloat(v[k]) > 0)) return L('重量和長寬高要填正數', 'Weight and dimensions must be positive numbers');
    if (v.qty && !/^\d+$/.test(v.qty)) return L('數量要填整數，或留空', 'Quantity must be a whole number, or blank');
    if (v.qty && +v.qty < 1) return L('數量至少 1', 'Quantity must be at least 1');
    v.name = toTpl(v.name);
    return v;
  }

  function renderLib() {
    renderPick();
    renderGallery();
    const box = $('ttf-lib');
    if (!box) return;
    box.innerHTML = '';
    if (editing === 'new') {
      const d = document.createElement('div');
      d.className = 'item edit';
      d.innerHTML = `<div class="nm" style="margin-bottom:4px">${L('新增商品', 'New product')}</div>` + formHtml({});
      attachCatAC(d); renderFormPicker(d);
      d.querySelector('[data-a=save]').onclick = () => {
        const v = readForm(d);
        if (typeof v === 'string') { d.querySelector('.err').textContent = v; return; }
        if (state.lib.some((x) => norm(x.name) === norm(v.name))) { d.querySelector('.err').textContent = L('已有同名商品', 'A product with this name already exists'); return; }
        state.lib.unshift({ id: uid(), sel: true, ...v });
        editing = null; saveState(); renderLib();
        alertMsg(L('已保存，並在「今天上架」裡勾選了', 'Saved and selected in “Today”'));
      };
      d.querySelector('[data-a=cancel]').onclick = () => { editing = null; renderLib(); };
      box.appendChild(d);
      setTimeout(() => d.querySelector('input').focus(), 0);
    }
    if (!state.lib.length && editing !== 'new') box.innerHTML = `<div class="empty">${L('還沒有商品，按上面「新增商品」', 'No products yet — press “Add product” above')}</div>`;
    const lq = norm($('ttf-lq').value);
    state.lib.forEach((it, k) => {
      if (!it.id) it.id = uid();
      if (lq && editing !== it.id && !norm(it.name + ' ' + it.cat).includes(lq)) return;
      const d = document.createElement('div');
      d.className = 'item';
      if (editing === it.id) {
        d.classList.add('edit');
        d.innerHTML = formHtml(it);
        attachCatAC(d); renderFormPicker(d);
        d.querySelector('[data-a=save]').onclick = () => {
          const v = readForm(d);
          if (typeof v === 'string') { d.querySelector('.err').textContent = v; return; }
          Object.assign(it, v);
          editing = null; saveState(); renderLib();
          alertMsg(L('已保存', 'Saved'));
        };
        d.querySelector('[data-a=cancel]').onclick = () => { editing = null; renderLib(); };
      } else {
        d.innerHTML = `
          <div class="top">
            ${it.img && state.imgs.some((x) => x.id === it.img) ? '<span class="mini" data-thumb="' + it.img + '"></span>' : ''}
            <div class="txt grow"><div class="nm" title="${escapeHtml(baseName(it.name))}">${escapeHtml(baseName(it.name))}</div></div>
            <div class="acts">
              <button data-a="up" title="${L('上移', 'Move up')}">↑</button><button data-a="down" title="${L('下移', 'Move down')}">↓</button>
              <button data-a="edit">${L('編輯', 'Edit')}</button><button data-a="del" class="del">${L('刪除', 'Delete')}</button>
            </div>
          </div>
          <div class="meta" title="${escapeHtml(it.cat || '')}">${it.cat ? escapeHtml(it.cat) + (cats.paths.length && !catSet.has(norm(resolveCat(it.cat))) ? ` <span class="tag t-warn">${L('不在類目庫', 'Not in list')}</span>` : '') : `<span class="tag t-warn">${L('沒有類目', 'No category')}</span>`}</div>
          <div class="meta">${escapeHtml(it.weight)} lb · H${escapeHtml(it.h)} × W${escapeHtml(it.w)} × L${escapeHtml(it.l)}${it.qty ? ' · ' + L('數量', 'Qty') + ' ' + escapeHtml(it.qty) : ''}${it.battery ? ` · <span class="tag t-info">🔋 ${L('含電池', 'Battery')}</span>` : ''}</div>`;
        const mt = d.querySelector('[data-thumb]');
        if (mt) imgURL(mt.dataset.thumb).then((u) => { if (u) mt.style.backgroundImage = `url("${u}")`; });
        d.querySelector('[data-a=edit]').onclick = () => { editing = it.id; renderLib(); };
        const del = d.querySelector('[data-a=del]');
        del.onclick = () => {
          if (del.classList.contains('confirm')) { state.lib.splice(k, 1); saveState(); renderLib(); }
          else { del.classList.add('confirm'); del.textContent = L('確認刪除', 'Confirm'); setTimeout(() => { del.classList.remove('confirm'); del.textContent = L('刪除', 'Delete'); }, 3000); }
        };
        d.querySelector('[data-a=up]').onclick = () => { if (k > 0) { [state.lib[k - 1], state.lib[k]] = [state.lib[k], state.lib[k - 1]]; saveState(); renderLib(); } };
        d.querySelector('[data-a=down]').onclick = () => { if (k < state.lib.length - 1) { [state.lib[k + 1], state.lib[k]] = [state.lib[k], state.lib[k + 1]]; saveState(); renderLib(); } };
      }
      box.appendChild(d);
    });
  }

  function showView() {
    const setup = !state.rows.length || showSetup;
    $('view-setup').classList.toggle('hide', !setup);
    $('view-run').classList.toggle('hide', setup);
  }
  function setRunning(on, isAll) {
    const rb = $('ttf-run');
    ['ttf-go', 'ttf-skip', 'ttf-back', 'ttf-edit', 'ttf-lang'].forEach((id) => ($(id).disabled = on));
    if (on && isAll) { rb.disabled = false; rb.className = 'btn stop block big'; rb.textContent = L('■ 停止（做完這一個就停）', '■ Stop (after the current one)'); }
    else if (on) { rb.disabled = true; }
    else render();
  }

  /* ---- 位置：以「左下角」為錨點，展開時向上長 ---- */
  function place(x, b) {
    const w = host.offsetWidth || 372, h = host.offsetHeight || 60;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    b = Math.max(8, Math.min(window.innerHeight - 56, b));
    host.style.left = x + 'px'; host.style.bottom = b + 'px'; host.style.top = 'auto';
    return { x, b };
  }
  function keepInView() { // 展開後如果頂部超出螢幕，往下挪
    const r = host.getBoundingClientRect();
    if (r.top < 8 && state.pos) { state.pos = place(state.pos.x, Math.max(8, state.pos.b - (8 - r.top))); saveState(); }
  }
  function setMin(v) {
    $('card').classList.toggle('min', v);
    $('ttf-min').textContent = v ? '+' : '–';
    state.min = v; saveState();
    if (!v) setTimeout(keepInView, 380);
  }

  /* ================= 評論大窗：把聊天區搬到另一個窗口（大字、分顏色） ================= */
  state.feed = Object.assign({ fs: 26, onlyWin: false, sys: true, host: '', theme: 'dark', mute: '' }, state.feed || {});
  const fset = state.feed;
  const feed = { win: null, items: [], seen: new WeakMap(), iv: null, obs: null, timer: null, kind: '', stick: true };
  // 過濾留言：每行一句，留言包含這句就不顯示（不分大小寫、忽略標點和空格）
  const muteNorm = (t) => String(t || '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  const muteList = () => String(fset.mute || '').split('\n').map(muteNorm).filter((x) => x.length >= 2);
  function isMuted(msg) { const m = muteNorm(msg); return !!m && muteList().some((k) => m.includes(k)); }
  const FEED_MAX = 400; // 畫面上最多幾條
  const FEED_KEEP = 3000; // 記住幾條（給點名字看歷史）
  // 同一個客人永遠同一個顏色
  function nameHue(n) { const s = strictKey(n); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 360; }
  const nameColor = (n) => (fset.theme === 'light' ? `hsl(${nameHue(n)},75%,36%)` : `hsl(${nameHue(n)},85%,68%)`);
  // 畫面下方的拍賣卡片（進行中 / 已得標 / 無人出價）
  function readAuctionCard() {
    const keys = xp("//*[contains(normalize-space(text()),'won!') or contains(normalize-space(text()),'is winning!') or contains(normalize-space(text()),'No bids')]").filter((e) => !inPanel(e) && visible(e));
    for (const w of keys) {
      let card = w;
      for (let i = 0; i < 8 && card; i++) { card = card.parentElement; const t = card && card.innerText || ''; if (/#\d+/.test(t) && /bids?:|no bids/i.test(t)) break; }
      if (!card) continue;
      const t = card.innerText || '';
      const m = t.match(/#(\d+)\s+([^\n]+)/); if (!m) continue;
      const price = (t.match(/bids?:\s*\$?\s*([\d.,]+)/i) || [])[1] || '';
      const line = t.split('\n').map((x) => x.trim()).find((x) => /(won!|is winning!)\s*$/i.test(x)) || '';
      const status = /won!\s*$/i.test(line) ? 'won' : /is winning!\s*$/i.test(line) ? 'winning' : 'none';
      let who = winnerOnly(line);
      if (!who && status !== 'none') { const pe = w.parentElement; who = winnerOnly(pe ? pe.innerText : ''); }
      if (/no bids/i.test(who)) who = '';
      return { no: m[1], listing: fullListing(m[2].trim()), price, who: cleanName(who), status };
    }
    return null;
  }
  // 這個客人最近得標的編號（直播檢測的記錄 + 評論窗自己看到的 won! 卡片）
  const feedWins = [];
  function winsOf(name) {
    const k = strictKey(name), out = [];
    const recent = Date.now() - 30 * 60000;
    for (const o of [...live.orders, ...feedWins]) if (o.at >= recent && (strictKey(o.winner) === k || sameName(o.winner, name)) && !out.includes(o.no)) out.push(o.no);
    return out.slice(-3);
  }
  const isHostName = (n) => !!fset.host && strictKey(n) === strictKey(fset.host);
  function feedPush(it) {
    const sig = it.kind + '|' + strictKey(it.name) + '|' + it.msg;
    const tail = feed.items.slice(-150);
    if (tail.some((x) => x.sig === sig && it.t - x.t < 10 * 60000)) return false; // 清單重新顯示舊留言：不重複
    it.sig = sig; feed.items.push(it);
    if (feed.items.length > FEED_KEEP) feed.items.splice(0, feed.items.length - FEED_KEEP);
    return true;
  }
  function feedTick() {
    if (!feed.win || feed.win.closed) { feedStop(); return; }
    const now = Date.now();
    const card = readAuctionCard();
    if (card && card.status === 'won' && card.who && !feedWins.some((o) => o.no === card.no && strictKey(o.winner) === strictKey(card.who))) feedWins.push({ no: card.no, winner: card.who, at: now });
    for (const c of cardWinners()) if (!feedWins.some((o) => o.no === c.no && strictKey(o.winner) === strictKey(c.winner))) feedWins.push({ no: c.no, winner: c.winner, at: now });
    const { comments, system } = chatLists();
    let added = 0;
    const annTexts = (ann.hist || []).filter((h) => now - h.t < 10 * 60000).map((h) => h.text.trim());
    for (const it of listItems(comments, true)) {
      const t = (it.innerText || '').trim();
      if (feed.seen.get(it) === t) continue;
      feed.seen.set(it, t);
      if (sysMatch(t)) { const m = sysMatch(t); if (fset.sys && feedPush({ kind: 's', name: cleanName(m[1]), msg: '#' + m[2] + (m[4] ? '  $' + m[4] : ''), no: m[2], t: now, old: feed.first })) added++; continue; }
      const pc = parseComment(t, it); if (!pc) continue;
      const head = (it.firstElementChild && it.firstElementChild.innerText) || '';
      let host = isHostName(pc.name) || /\b(host|creator)\b/i.test(head.replace(pc.name, ''));
      if (!host && annTexts.includes(pc.msg.trim())) { host = true; if (!fset.host) { fset.host = pc.name; saveState(); } } // 自動公告的那條 = 主播自己
      if (feedPush({ kind: 'c', name: pc.name, msg: pc.msg, t: now, host, old: feed.first })) added++;
    }
    if (fset.sys) for (const it of listItems(system)) {
      const t = (it.innerText || '').trim();
      if (feed.seen.get(it) === t) continue;
      feed.seen.set(it, t);
      const m = sysMatch(t);
      if (m && feedPush({ kind: 's', name: cleanName(m[1]), msg: '#' + m[2] + (m[4] ? '  $' + m[4] : ''), no: m[2], t: now, old: feed.first })) added++;
    }
    feed.first = false;
    feedRender(card || undefined, added);
  }
  function feedHTML() {
    return `<!doctype html><html><head><meta charset="utf-8"><title>TikTok Live ${L('評論', 'Comments')}</title></head><body></body></html>`;
  }
  const feedCSS = () => `
    *{box-sizing:border-box} html,body{margin:0;height:100%}
    body{--bg:#0e0f13;--fg:#f3f4f6;--mute:#9aa0aa;--line:#262a33;--card:#171a21;--host:#1d2a44;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei","Segoe UI",sans-serif;background:var(--bg);color:var(--fg);display:flex;flex-direction:column;overflow:hidden}
    body.light{--bg:#ffffff;--fg:#111317;--mute:#636a75;--line:#e4e6ea;--card:#f5f6f8;--host:#e6efff}
    .bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 12px;border-bottom:1px solid var(--line);font-size:13px;color:var(--mute)}
    .bar label{display:flex;align-items:center;gap:5px;white-space:nowrap;cursor:pointer}
    .bar input[type=range]{width:120px}
    .bar button{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;padding:3px 9px;cursor:pointer}
    .bar .grow{flex:1}
    .bar select{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;padding:3px 6px;cursor:pointer}
    .auc{padding:10px 14px;border-bottom:1px solid var(--line);background:var(--card);display:flex;align-items:center;gap:12px;font-size:calc(var(--fs) * .8)}
    .auc .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mute)}
    .auc .w{font-weight:800;white-space:nowrap}
    .auc .st{font-weight:800;color:#ff4d6a}
    .auc.won .st{color:#22c55e}
    .no{display:inline-block;font-weight:800;color:#fff;background:#e5132f;border-radius:.3em;padding:.08em .35em;line-height:1.25;margin-right:.3em;font-size:.85em;vertical-align:.06em}
    #list{flex:1;overflow-y:auto;padding:6px 0 10px;font-size:var(--fs);line-height:1.3}
    .c{padding:.3em 14px .35em;border-left:4px solid transparent;word-wrap:break-word;overflow-wrap:anywhere;border-bottom:1px solid var(--line)}
    .c .hd{display:flex;align-items:center;flex-wrap:wrap;gap:4px;font-size:max(13px,calc(var(--fs) * .55));line-height:1.35}
    .c .hd .no{font-size:1em;margin-right:0}
    .c .n{font-weight:800}
    .c .m{display:block;font-weight:600;margin-top:.05em}
    .c .tm{font-size:max(11px,calc(var(--fs) * .4));color:var(--mute);margin-left:auto;font-weight:400}
    .c.sys .tm{margin-left:.5em}
    .c.win{background:rgba(229,19,47,.12);border-left-color:#e5132f}
    .c.host{background:var(--host);border-left-color:#4f8cff}
    .c.host .n::after{content:" ${L('主播', 'Host')}";font-size:.8em;font-weight:700;color:#fff;background:#4f8cff;border-radius:4px;padding:1px 5px;margin-left:4px;vertical-align:.2em}
    .c.sys{font-size:.62em;color:var(--mute)} .c.sys .ok{color:#22c55e;font-weight:800}
    .empty{color:var(--mute);text-align:center;padding:40px 10px;font-size:16px}
    #more{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;background:#e5132f;color:#fff;border:0;border-radius:20px;padding:8px 16px;font-size:15px;font-weight:700;cursor:pointer;display:none;box-shadow:0 4px 14px rgba(0,0,0,.35)}
    .bar input[type=search]{font:inherit;font-size:14px;flex:1 1 160px;min-width:120px;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;padding:4px 9px}
    mark{background:#facc15;color:#111;border-radius:3px;padding:0 1px}
    .c .n{cursor:pointer} .c .n:hover{text-decoration:underline}
    .qinfo{padding:4px 14px;font-size:13px;color:var(--mute);border-bottom:1px solid var(--line);display:none}
    .hist{flex:none;max-height:55%;display:flex;flex-direction:column;background:var(--card);border-top:3px solid #4f8cff;box-shadow:0 -8px 24px rgba(0,0,0,.4);font-size:var(--fs);z-index:5}
    .hist.hide{display:none}
    .hist .hh{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);font-size:max(14px,calc(var(--fs) * .6))}
    .hist .hh .hn{font-weight:800}
    .hist .hh .cnt{color:var(--mute);font-size:.8em}
    .hist .hh button,.hist .older{font:inherit;font-size:13px;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:6px;padding:3px 9px;cursor:pointer}
    .hist .hh .x{margin-left:auto;font-size:18px;line-height:1;padding:2px 9px}
    .hist #hb{overflow-y:auto;padding:4px 0 10px}
    .hist .older{display:block;margin:6px auto;font-size:14px}
    .mutep{display:none;padding:8px 12px;border-bottom:1px solid var(--line);font-size:13px;color:var(--mute);background:var(--card)}
    .mutep.on{display:block}
    .mutep textarea{width:100%;min-height:70px;font:inherit;font-size:14px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:6px 8px;margin-top:4px;resize:vertical}
    .c .mu{font-size:max(11px,calc(var(--fs) * .4));border:1px solid var(--line);background:transparent;color:var(--mute);border-radius:5px;padding:0 6px;cursor:pointer;margin-left:6px;opacity:0;font-family:inherit}
    .c:hover .mu{opacity:1}
    .off{position:fixed;inset:0;background:rgba(0,0,0,.75);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;text-align:center;padding:20px}`;
  const inFeedLang = (fn) => function (...a) { const o = langOverride; langOverride = fset.lang || null; try { return fn.apply(this, a); } finally { langOverride = o; } };
  const feedSetup = inFeedLang(function (w) {
    const d = w.document;
    if (!d.body) { d.open(); d.write(feedHTML()); d.close(); }
    d.title = 'TikTok Live ' + L('評論', 'Comments');
    d.head.querySelectorAll('style[data-tt]').forEach((x) => x.remove());
    const st = d.createElement('style'); st.dataset.tt = '1'; st.textContent = feedCSS(); d.head.appendChild(st);
    d.body.innerHTML = `
      <div class="bar">
        <label>A<input type="range" id="fs" min="14" max="64" step="1"><b id="fsv"></b></label>
        <label><input type="checkbox" id="ow">${L('只看得標客人', 'Winners only')}</label>
        <label><input type="checkbox" id="sy">${L('付款通知', 'Payments')}</label>
        <input type="search" id="q" placeholder="${L('🔍 搜尋客人 / 留言 / #編號', '🔍 Search customer / comment / #no.')}">
        <select id="lg" title="Language"><option value="hant">繁體</option><option value="hans">简体</option><option value="en">English</option></select>
        <button id="mb">🚫 ${L('過濾', 'Filter')} <span id="mc"></span></button>
        <button id="th">${L('深色 / 淺色', 'Dark / Light')}</button>
        <button id="fsc">${L('全螢幕', 'Full screen')}</button>
      </div>
      <div class="mutep" id="mp">${L('包含以下句子的留言不顯示（每行一句，例如 giveaway 指定要留的話）。也可以把滑鼠移到留言上按「🚫」加入。', 'Comments containing any of these lines are hidden (one per line, e.g. the giveaway entry phrase). You can also hover a comment and press “🚫”.')}<textarea id="mt" placeholder="Final Sale! Bid responsible! Bundle Ship"></textarea></div>
      <div class="auc" id="auc"></div>
      <div class="qinfo" id="qinfo"></div>
      <div id="list"></div>
      <div class="hist hide" id="hist"><div class="hh"><span class="hn" id="hn"></span><span id="hw"></span><span class="cnt" id="hc"></span><button id="hq">${L('🔍 搜尋這位', '🔍 Filter')}</button><button class="x" id="hx">×</button></div><div id="hb"></div></div>
      <button id="more">↓ ${L('新留言', 'New comments')}</button>`;
    const $$ = (id) => d.getElementById(id);
    const applyFs = () => { d.body.style.setProperty('--fs', fset.fs + 'px'); $$('fsv').textContent = fset.fs; };
    const applyTheme = () => d.body.classList.toggle('light', fset.theme === 'light');
    $$('fs').value = fset.fs; applyFs(); applyTheme();
    $$('fs').oninput = (e) => { fset.fs = +e.target.value; applyFs(); saveState(); if (feed.stick) scrollEnd(); };
    $$('ow').checked = !!fset.onlyWin; $$('ow').onchange = (e) => { fset.onlyWin = e.target.checked; saveState(); feedRender(null, 0, true); };
    $$('sy').checked = !!fset.sys; $$('sy').onchange = (e) => { fset.sys = e.target.checked; saveState(); feedRender(null, 0, true); };
    $$('th').onclick = () => { fset.theme = fset.theme === 'light' ? 'dark' : 'light'; saveState(); applyTheme(); feedRender(null, 0, true); };
    $$('fsc').onclick = () => { try { if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen(); } catch (e) { /* 小窗不支援全螢幕 */ } };
    if (feed.kind === 'pip') $$('fsc').style.display = 'none';
    const list = $$('list');
    const scrollEnd = () => { list.scrollTop = list.scrollHeight; };
    feed.scrollEnd = scrollEnd;
    list.addEventListener('scroll', () => {
      feed.stick = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
      if (feed.stick) $$('more').style.display = 'none';
    });
    $$('more').onclick = () => { feed.stick = true; scrollEnd(); $$('more').style.display = 'none'; };
    // 過濾
    $$('mb').onclick = () => $$('mp').classList.toggle('on');
    $$('mt').value = fset.mute || '';
    let mtT = null;
    $$('mt').oninput = (e) => { clearTimeout(mtT); mtT = setTimeout(() => { fset.mute = e.target.value; saveState(); feedRender(null, 0, true); if (feed.hist != null) histRender(); }, 300); };
    list.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.mu'); if (!b) return;
      e.stopPropagation();
      const t = b.dataset.m || ''; if (!t) return;
      fset.mute = (String(fset.mute || '').trim() ? String(fset.mute).trim() + '\n' : '') + t; saveState();
      $$('mt').value = fset.mute; feedRender(null, 0, true);
    }, true);
    // 搜尋
    let qt = null;
    $$('q').value = feed.q || '';
    $$('q').oninput = (e) => { clearTimeout(qt); qt = setTimeout(() => { feed.q = e.target.value.trim(); feed.stick = true; feedRender(null, 0, true); }, 150); };
    // 點客人名字 → 看這位客人之前所有發言
    list.addEventListener('click', (e) => { const n = e.target.closest && e.target.closest('.n'); if (n && n.dataset.n != null) histOpen(n.dataset.n); });
    $$('hb').addEventListener('click', (e) => { if (!e.target.closest) return; if (e.target.closest('.older')) { feed.histAll = true; histRender(); } });
    $$('hx').onclick = () => histClose();
    $$('hq').onclick = () => { $$('q').value = feed.hist || ''; feed.q = feed.hist || ''; histClose(); feed.stick = true; feedRender(null, 0, true); };
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (feed.hist != null) histClose(); else if ($$('q').value) { $$('q').value = ''; feed.q = ''; feedRender(null, 0, true); } } });
    if (!feed.hideBound) { feed.hideBound = true; w.addEventListener('pagehide', () => setTimeout(() => { if (feed.win && feed.win.closed) feedStop(); }, 300)); }
    // 評論窗語言（和面板分開設定）
    $$('lg').value = fset.lang || lang();
    $$('lg').onchange = (e) => { fset.lang = e.target.value; saveState(); lastAucSig = null; feedSetup(w); feedRender(undefined, 0, true); if (feed.hist != null) histRender(true); };
  });
  let lastAucSig = null;
  const feedRender = inFeedLang(function (card, added, full) {
    const w = feed.win; if (!w || w.closed) return;
    const d = w.document, list = d.getElementById('list'), auc = d.getElementById('auc');
    if (!list) return;
    if (card !== null) {
      let c = card || readAuctionCard();
      if (!c) { // Quick LIVE 版面沒有下方拍賣卡片：顯示最近一個得標
        const lw = [...live.orders, ...feedWins].sort((x, y) => x.at - y.at).pop();
        if (lw) c = { no: lw.no, listing: lw.listing || '', price: lw.price || '', who: lw.winner, status: 'won' };
      }
      const sig = c ? [c.no, c.price, c.who, c.status, c.listing].join('|') : '';
      if (sig !== lastAucSig) {
        lastAucSig = sig;
        auc.className = 'auc' + (c && c.status === 'won' ? ' won' : '');
        auc.innerHTML = c ? `<span class="no">#${escapeHtml(c.no)}</span><span class="t" title="${escapeHtml(c.listing)}">${escapeHtml(c.listing)}</span>
            ${c.price ? `<span class="w">$${escapeHtml(c.price)}</span>` : ''}
            ${c.who ? `<span class="w" style="color:${nameColor(c.who)}">${escapeHtml(c.who)}</span>` : ''}
            <span class="st">${c.status === 'won' ? L('得標 won!', 'won!') : c.status === 'winning' ? L('領先中', 'winning') : L('未有出價', 'No bids')}</span>`
          : `<span class="t">${L('（下方拍賣卡片還沒出現）', '(No auction card on screen yet)')}</span>`;
      }
    }
    if (!added && !full) return;
    const q = (feed.q || '').toLowerCase();
    const show = (x) => (x.kind === 's' ? fset.sys : true) && (x.kind !== 'c' || x.host || !isMuted(x.msg)) && (!q || feedMatch(x, q));
    const mc = d.getElementById('mc');
    if (mc && (full || added)) { const n = feed.items.filter((x) => x.kind === 'c' && !x.host && isMuted(x.msg)).length; mc.textContent = n ? `(${n})` : ''; }
    const rows = feed.items.filter(show);
    const html = (x) => feedRow(x, q, fset.onlyWin);
    if (full) {
      const out = []; for (let i = rows.length - 1; i >= 0 && out.length < FEED_MAX; i--) { const h = html(rows[i]); if (h) out.push(h); }
      list.innerHTML = out.reverse().join('') || `<div class="empty">${q ? L('沒有符合的留言', 'No matching comments') : L('等待新留言…', 'Waiting for comments…')}</div>`;
    } else {
      const add = feed.items.slice(-added).filter(show).map(html).join('');
      if (add) { const em = list.querySelector('.empty'); if (em) em.remove(); list.insertAdjacentHTML('beforeend', add); }
      while (list.children.length > FEED_MAX) list.firstElementChild.remove();
    }
    const qi = d.getElementById('qinfo');
    if (qi) { qi.style.display = q ? 'block' : 'none'; qi.textContent = q ? L(`搜尋「${feed.q}」：${rows.length} 條（按 Esc 清除）`, `Search “${feed.q}”: ${rows.length} (Esc to clear)`) : ''; }
    if (feed.stick) feed.scrollEnd(); else if (added) d.getElementById('more').style.display = 'block';
    if (added && feed.hist != null && feed.items.slice(-added).some((x) => strictKey(x.name) === strictKey(feed.hist))) histRender();
  });
  // 搜尋：名字、留言、#編號
  function feedMatch(x, q) {
    if ((x.name + ' ' + x.msg).toLowerCase().includes(q)) return true;
    const m = q.match(/^#?(\d+)$/); if (!m) return false;
    return x.no === m[1] || (x.kind === 'c' && winsOf(x.name).includes(m[1]));
  }
  function hl(text, q) {
    const t = String(text || ''); if (!q) return escapeHtml(t);
    const low = t.toLowerCase(); let out = '', i = 0, j;
    while ((j = low.indexOf(q, i)) >= 0 && q) { out += escapeHtml(t.slice(i, j)) + '<mark>' + escapeHtml(t.slice(j, j + q.length)) + '</mark>'; i = j + q.length; }
    return out + escapeHtml(t.slice(i));
  }
  function feedRow(x, q, onlyWin) {
    const nos = x.kind === 'c' && !x.host ? winsOf(x.name) : [];
    if (onlyWin && x.kind === 'c' && !x.host && !nos.length) return '';
    const tm = x.old ? '' : `<span class="tm">${hhmmss(x.t)}</span>`;
    const nm = `<span class="n" data-n="${escapeHtml(x.name)}" style="color:${nameColor(x.name)}">${hl(x.name, q)}</span>`;
    if (x.kind === 's') return `<div class="c sys"><span class="ok">✓ ${L('已付款', 'Paid')}</span> <span class="no">${escapeHtml(x.msg.split(' ')[0])}</span>${nm} ${escapeHtml(x.msg.split(' ').slice(1).join(' '))}${tm}</div>`;
    const mu = x.host ? '' : `<button class="mu" data-m="${escapeHtml(x.msg)}" title="${L('不再顯示包含這句的留言', 'Hide comments with this text')}">🚫</button>`;
    return `<div class="c${x.host ? ' host' : ''}${nos.length ? ' win' : ''}"><div class="hd">${nos.map((n) => `<span class="no">#${escapeHtml(n)}</span>`).join('')}${nm}${mu}${tm}</div><span class="m">${hl(x.msg, q)}</span></div>`;
  }
  // 客人歷史發言：先看最近 5 條，按「更早的」看全部
  function histOpen(name) { feed.hist = name; feed.histAll = false; histRender(true); }
  function histClose() { feed.hist = null; const d = feed.win && !feed.win.closed && feed.win.document; if (d) d.getElementById('hist').classList.add('hide'); }
  const histRender = inFeedLang(function (scroll) {
    const w = feed.win; if (!w || w.closed || feed.hist == null) return;
    const d = w.document, name = feed.hist, k = strictKey(name);
    const mine = feed.items.filter((x) => strictKey(x.name) === k && (x.kind !== 'c' || x.host || !isMuted(x.msg)));
    const nos = winsOf(name);
    d.getElementById('hn').textContent = name; d.getElementById('hn').style.color = nameColor(name);
    d.getElementById('hw').innerHTML = nos.map((n) => `<span class="no">#${escapeHtml(n)}</span>`).join('');
    d.getElementById('hc').textContent = L(`共 ${mine.filter((x) => x.kind === 'c').length} 條發言`, `${mine.filter((x) => x.kind === 'c').length} comments`);
    const shown = feed.histAll ? mine : mine.slice(-5);
    const more = mine.length - shown.length;
    const hb = d.getElementById('hb');
    hb.innerHTML = (more > 0 ? `<button class="older">${L(`▲ 顯示更早的 ${more} 條`, `▲ Show ${more} earlier`)}</button>` : '') +
      (shown.map((x) => feedRow(x, '', false)).join('') || `<div class="empty">${L('還沒有發言', 'No comments yet')}</div>`);
    d.getElementById('hist').classList.remove('hide');
    if (feed.stick) feed.scrollEnd();
    if (scroll || !feed.histAll) hb.scrollTop = hb.scrollHeight;
  });
  async function feedOpen(kind) {
    if (feed.win && !feed.win.closed) { try { feed.win.focus(); } catch (e) { /* 空 */ } return true; }
    let w = null;
    if (kind === 'pip') {
      if (!window.documentPictureInPicture) return 'nopip';
      try { w = await window.documentPictureInPicture.requestWindow({ width: 460, height: 640 }); } catch (e) { LOG('pip fail', e); return 'nopip'; }
    } else {
      w = window.open('', 'ttlive_comments', 'popup=yes,width=560,height=860');
      if (!w) return 'blocked';
    }
    feed.win = w; feed.kind = kind; feed.stick = true; feed.first = true; feed.hideBound = false; feed.seen = new WeakMap(); lastAucSig = null;
    try { feedSetup(w); } catch (e) { LOG('feed setup fail', e); feed.win = null; try { w.close(); } catch (er) { /* 空 */ } return 'blocked'; }
    feedTick();
    feedRender(null, 0, true);
    feed.obs = new MutationObserver(() => { if (!feed.timer) feed.timer = setTimeout(() => { feed.timer = null; feedTick(); }, 200); });
    feed.obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    feed.iv = setInterval(feedTick, 1000);
    updFeedBtns();
    return true;
  }
  function feedStop() {
    if (feed.obs) feed.obs.disconnect(); feed.obs = null;
    clearInterval(feed.iv); feed.iv = null;
    feed.win = null;
    updFeedBtns();
  }
  function feedClose() { const w = feed.win; feedStop(); try { if (w && !w.closed) w.close(); } catch (e) { /* 空 */ } }
  // TikTok 頁面重新整理 / 關掉時，提示評論窗已經斷開
  window.addEventListener('pagehide', () => {
    const w = feed.win; if (!w || w.closed || feed.kind === 'pip') return;
    try { const o = w.document.createElement('div'); o.className = 'off'; langOverride = fset.lang || null; o.textContent = L('TikTok 頁面已重新整理或關閉 — 請回到面板再按一次「彈出評論窗」', 'The TikTok page reloaded or closed — press “Pop out comments” in the panel again'); w.document.body.appendChild(o); } catch (e) { /* 空 */ }
    langOverride = null;
  });
  let updFeedBtns = () => {};

  /* ---- 建立整個面板（切換語言時重建） ---- */
  function buildUI() {
    root.innerHTML = html();
    $('ttf-lang').value = lang();
    $('card').classList.toggle('min', !!state.min);
    $('ttf-min').textContent = state.min ? '+' : '–';

    // 分頁
    const tabs = root.querySelectorAll('.tabs button');
    const selTab = (t) => {
      curTab = t;
      tabs.forEach((x) => x.classList.toggle('on', x.dataset.t === t));
      $('tab-go').classList.toggle('hide', t !== 'go');
      $('tab-lib').classList.toggle('hide', t !== 'lib');
      $('tab-live').classList.toggle('hide', t !== 'live');
      $('tab-ann').classList.toggle('hide', t !== 'ann');
    };
    tabs.forEach((t) => (t.onclick = () => selTab(t.dataset.t)));
    selTab(curTab);

    // 收起 / 展開、語言
    $('ttf-min').onclick = (e) => { e.stopPropagation(); setMin(!state.min); };
    $('ttf-lang').onchange = (e) => { if (busy) return; state.lang = e.target.value; saveState(); buildUI(); };

    // 拖動標題列移動面板；雙擊收起 / 展開
    const hd = $('hd');
    hd.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, select')) return;
      const r = host.getBoundingClientRect(), ox = e.clientX - r.left, ob = r.bottom - e.clientY;
      hd.setPointerCapture(e.pointerId);
      const move = (ev) => { state.pos = place(ev.clientX - ox, window.innerHeight - ev.clientY - ob); };
      const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); saveState(); };
      hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up);
    });
    hd.addEventListener('dblclick', (e) => { if (!e.target.closest('button, select')) setMin(!state.min); });

    // 今天上架
    $('ttf-pt').value = state.pt;
    $('ttf-pt').onchange = (e) => { state.pt = e.target.value.trim() || 'PT1'; e.target.value = ptLabel(); saveState(); };
    $('ttf-date').value = dateVal;
    $('ttf-qty').value = state.qty;
    $('ttf-qty').onchange = (e) => {
      const v = e.target.value.trim();
      if (!/^\d+$/.test(v) || +v < 1) { e.target.value = state.qty; return; }
      state.qty = v; saveState();
    };
    $('ttf-date').oninput = (e) => { dateVal = e.target.value; };
    const inFilter = (x) => { const q = norm($('ttf-q').value); return !q || norm(x.name + ' ' + x.cat).includes(q); };
    $('ttf-all').onclick = () => { state.lib.filter(inFilter).forEach((x) => (x.sel = true)); saveState(); renderPick(); };
    $('ttf-none').onclick = () => { state.lib.filter(inFilter).forEach((x) => (x.sel = false)); saveState(); renderPick(); };
    $('ttf-q').oninput = renderPick;
    $('ttf-lq').oninput = renderLib;
    $('ttf-edit').onclick = () => { showSetup = true; showView(); };
    $('ttf-gen').onclick = () => {
      const sel = state.lib.filter((x) => x.sel);
      if (!sel.length) { $('ttf-selcount').textContent = L('⚠️ 先勾選要上的商品', '⚠️ Select products first'); return; }
      if (busy) return;
      state.runPt = ptLabel(); state.runDate = $('ttf-date').value.trim() || today();
      showSetup = false;
      const dq = String(state.qty || '').trim();
      state.rows = sel.map((x) => ({ name: applyTpl(x.name), cat: x.cat, weight: x.weight, h: x.h, w: x.w, l: x.l, battery: !!x.battery, qty: x.qty || dq, img: x.img || '', libId: x.id, tpl: x.name, status: '待填' }));
      state.idx = 0; saveState(); render();
      setMsg(L(`已生成 ${sel.length} 個，按「全部自動上架」開始`, `${sel.length} items ready — press “Auto-upload all” to start`));
    };
    $('ttf-run').onclick = () => {
      if (busy) { stopFlag = true; const rb = $('ttf-run'); rb.disabled = true; rb.textContent = L('停止中…做完這一個就停', 'Stopping after the current one…'); return; }
      runAll();
    };
    $('ttf-go').onclick = fillNext;
    $('ttf-skip').onclick = () => { if (busy) return; if (state.idx < state.rows.length) state.idx = Math.min(state.idx + 1, state.rows.length); saveState(); render(); };
    $('ttf-back').onclick = () => { if (busy) return; if (state.idx > 0) state.idx--; saveState(); render(); };
    $('ttf-auto').onchange = (e) => { state.auto = e.target.checked; saveState(); };

    // 商品庫
    $('ttf-imp').onclick = () => {
      const r = importToLib($('ttf-in').value);
      if (!r.added && !r.updated) { alertMsg(L('⚠️ 沒讀到內容：請在 Excel 選 E:J 這 6 欄複製', '⚠️ Nothing read: copy columns E:J (6 columns) in Excel'), 'warn'); return; }
      $('ttf-in').value = '';
      alertMsg(L(`匯入完成：新增 ${r.added} 個，更新 ${r.updated} 個`, `Imported: ${r.added} added, ${r.updated} updated`));
    };
    $('ttf-add').onclick = () => { editing = 'new'; renderLib(); };
    if ($('ttf-def')) $('ttf-def').onclick = () => { const n = mergeDefaults(); renderLib(); alertMsg(n ? L(`補回了 ${n} 個預設商品`, `Restored ${n} default products`) : L('預設商品都在，沒有缺少的', 'All default products are already there')); };
    $('ttf-exp').onclick = async () => {
      const txt = JSON.stringify(state.lib);
      try { await navigator.clipboard.writeText(txt); alertMsg(L('備份已複製，可以貼到備忘錄保存', 'Backup copied — paste it into Notes to keep it')); }
      catch (e) { $('ttf-in').value = txt; alertMsg(L('備份在上面輸入框裡，全選複製保存', 'The backup is in the box above — select all and copy it'), 'warn'); }
    };
    $('ttf-restore').onclick = () => {
      try {
        const lib = JSON.parse($('ttf-in').value);
        if (!Array.isArray(lib)) throw new Error();
        state.lib = lib; saveState(); renderLib(); $('ttf-in').value = '';
        alertMsg(L(`已還原 ${lib.length} 個商品`, `Restored ${lib.length} products`));
      } catch (e) { alertMsg(L('還原失敗：請把備份內容貼到上面輸入框再按', 'Restore failed: paste the backup into the box above first'), 'err'); }
    };
    $('ttf-diag').onclick = async () => {
      const txt = diagnose();
      LOG(txt);
      $('ttf-in').value = txt;
      try { await navigator.clipboard.writeText(txt); alertMsg(L('診斷結果已複製，直接貼給 Claude', 'Diagnostics copied — paste them to Claude')); }
      catch (e) { alertMsg(L('診斷結果在上面輸入框裡，全選複製後貼給 Claude', 'Diagnostics are in the box above — copy and paste them to Claude'), 'warn'); }
    };

    // 自動公告
    annLog = (m, t) => { const el = $('ttf-annmsg'); if (!el) return; el.textContent = `${hhmmss(Date.now())}  ${m}`; el.className = 'msg ' + (t || ''); };
    renderAnn = () => {
      if (!$('ttf-annlist')) return;
      $('ttf-anngo').textContent = ann.on ? L('■ 停止自動公告', '■ Stop announcements') : L('▶ 開始自動公告', '▶ Start announcements');
      $('ttf-anngo').className = 'btn block big ' + (ann.on ? 'stop' : 'primary');
      $('ttf-anndot').classList.toggle('on', !!ann.on);
      const onN = ann.items.filter((x) => x.on && x.text.trim()).length;
      $('ttf-annstat').textContent = ann.on ? L('自動公告中…', 'Announcing…') : L('未開始', 'Stopped');
      updAnnSub();
      $('ttf-annjit').checked = !!ann.jitter; $('ttf-annvary').checked = !!ann.vary;
      const box = $('ttf-annlist'); box.innerHTML = '';
      if (!ann.items.length) box.innerHTML = `<div class="empty">${L('按「＋ 新增」加入公告內容', 'Press “＋ Add” to write an announcement')}</div>`;
      $('ttf-anncount').textContent = ann.items.length ? `${ann.items.filter((x) => x.on && x.text.trim()).length} / ${ann.items.length}` : '';
      ann.items.forEach((it, k) => {
        const d = document.createElement('div');
        const isEdit = annEditing === it.id;
        d.className = 'an' + (it.on ? '' : ' off') + (isEdit ? ' editing' : '');
        if (isEdit) {
          d.innerHTML = `<textarea maxlength="100" placeholder="${L('公告內容（最多 100 字）', 'Announcement (max 100 characters)')}">${escapeHtml(it.text)}</textarea>
            <div class="an-btns"><span class="tag t-muted cnt">${it.text.length}/100</span><span class="grow"></span>
              <button class="btn ghost sm" data-a="cancel">${L('取消', 'Cancel')}</button><button class="btn primary sm" data-a="save">${L('保存', 'Save')}</button></div>`;
          const ta = d.querySelector('textarea'), cnt = d.querySelector('.cnt');
          ta.oninput = () => { cnt.textContent = ta.value.length + '/100'; cnt.className = 'tag cnt ' + (ta.value.length >= 100 ? 't-err' : 't-muted'); };
          d.querySelector('[data-a=save]').onclick = () => { it.text = ta.value.slice(0, 100).trim(); annEditing = null; if (!it.text) ann.items.splice(k, 1); saveState(); renderAnn(); };
          d.querySelector('[data-a=cancel]').onclick = () => { annEditing = null; if (!it.text) ann.items.splice(k, 1); saveState(); renderAnn(); };
          setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 0);
        } else {
          d.innerHTML = `<div class="an-top"><label class="switch" title="${L('開啟 / 關閉', 'On / off')}"><input type="checkbox" ${it.on ? 'checked' : ''}></label>
              <div class="an-text ${it.text ? '' : 'empty'}" title="${escapeHtml(it.text)}">${escapeHtml(it.text) || L('（空白）', '(empty)')}</div></div>
            <div class="an-meta"><span class="tag t-muted">${it.text.length}/100</span>
              ${it.sent ? `<span class="tag t-ok">${L('已發', 'Sent')} ${it.sent} · ${hhmmss(it.lastAt)}</span>` : ''}
              ${it.fail ? `<span class="tag t-warn">${L('被拒', 'Rejected')} ${it.fail}</span>` : ''}</div>
            <div class="an-btns"><button class="btn ghost sm" data-a="send">${L('發送', 'Send')}</button><button class="btn ghost sm" data-a="edit">${L('編輯', 'Edit')}</button><button class="btn ghost sm danger" data-a="del">${L('刪除', 'Delete')}</button></div>`;
          d.querySelector('input[type=checkbox]').onchange = (e) => { it.on = e.target.checked; d.classList.toggle('off', !it.on); saveState(); updAnnSub(); $('ttf-anncount').textContent = `${ann.items.filter((x) => x.on && x.text.trim()).length} / ${ann.items.length}`; };
          const sb = d.querySelector('[data-a=send]');
          sb.onclick = async () => { if (!it.text.trim() || annBusy) return; sb.disabled = true; sb.textContent = L('發送中…', 'Sending…'); await sendAnnouncement(it, true); renderAnn(); };
          d.querySelector('[data-a=edit]').onclick = () => { annEditing = it.id; renderAnn(); };
          const del = d.querySelector('[data-a=del]');
          del.onclick = () => { if (!del.dataset.c) { del.dataset.c = 1; del.classList.add('confirm'); del.textContent = L('確認刪除', 'Confirm'); setTimeout(() => { delete del.dataset.c; del.classList.remove('confirm'); del.textContent = L('刪除', 'Delete'); }, 3000); return; } ann.items.splice(k, 1); saveState(); renderAnn(); };
        }
        box.appendChild(d);
      });
    };
    updAnnSub = () => {
      const onN = ann.items.filter((x) => x.on && x.text.trim()).length;
      const left = ann.on ? Math.max(0, Math.ceil((annNext - Date.now()) / 1000)) : 0;
      $('ttf-annsub').textContent = L(`${onN} 條開啟`, `${onN} on`) + (ann.on ? L(` · 下一條約 ${left} 秒後`, ` · next in ~${left}s`) : '') +
        ((ann.backoff || 1) > 1 ? L(` · 間隔暫時 ×${(+ann.backoff).toFixed(1)}`, ` · interval ×${(+ann.backoff).toFixed(1)} for now`) : '');
    };
    $('ttf-annmins').value = ann.mins;
    $('ttf-annmins').onchange = (e) => { const v = parseFloat(e.target.value); if (v >= 1) { ann.mins = v; saveState(); } else e.target.value = ann.mins; };
    $('ttf-annjit').onchange = (e) => { ann.jitter = e.target.checked; saveState(); };
    $('ttf-annvary').onchange = (e) => { ann.vary = e.target.checked; saveState(); };
    $('ttf-anngo').onclick = () => { if (ann.on) annStop(); else { if (!ann.items.some((x) => x.on && x.text.trim())) { annLog(L('先新增並開啟至少一條公告', 'Add and switch on at least one announcement first'), 'warn'); return; } annStart(); } };
    $('ttf-annadd').onclick = () => { const it = { id: uid(), text: '', on: true }; ann.items.push(it); annEditing = it.id; saveState(); renderAnn(); };
    renderAnn();

    // 直播檢測
    renderLive = () => {
      const box = $('ttf-livelist'); if (!box) return;
      const q = norm($('ttf-liveq').value);
      $('ttf-livego').textContent = live.on ? L('■ 停止檢測', '■ Stop detecting') : L('▶ 開始檢測', '▶ Start detecting');
      $('ttf-livego').className = 'btn block big ' + (live.on ? 'stop' : 'primary');
      $('ttf-livedot').classList.toggle('on', !!live.on);
      const n = live.orders.length, paid = live.orders.filter((o) => o.paid).length, rep = live.orders.filter((o) => o.replies.length).length;
      $('ttf-livestat').textContent = live.on ? L('檢測中…', 'Detecting…') : L('未開始', 'Stopped');
      $('ttf-livesub').textContent = L(`${n} 單 · 已付款 ${paid} · 有回覆 ${rep}`, `${n} orders · ${paid} paid · ${rep} with replies`);
      box.innerHTML = '';
      const win = Math.max(0.5, +live.mins || 3) * 60000;
      [...live.orders].reverse().forEach((o) => {
        if (q && !norm(`#${o.no} ${o.winner} ${o.listing}`).includes(q)) return;
        const d = document.createElement('div');
        d.className = 'lo';
        const left = o.at + win - Date.now();
        d.innerHTML = `<div class="h"><span class="no">#${escapeHtml(o.no)}</span><span class="who" title="${escapeHtml(o.winner)}">${escapeHtml(o.winner)}</span>
            ${o.price ? `<span class="tag t-muted">$${escapeHtml(o.price)}</span>` : ''}
            ${o.paid ? `<span class="tag t-ok">${L('已付款', 'Paid')}</span>` : ''}
            <span class="tag ${left > 0 ? 't-info' : 't-muted'}" data-left="${o.at + win}">${left > 0 ? Math.ceil(left / 1000) + 's' : L('已結束', 'Closed')}</span>
            <button class="link odel" title="${L('刪除這一單', 'Delete this order')}" style="color:var(--muted);padding:0 2px">×</button></div>
          <div class="meta" title="${escapeHtml(o.listing)}">${escapeHtml(o.listing)}</div>
          <div class="meta">${L('得標', 'Won')} ${hhmmss(o.at)}${o.fromChat ? ' · ' + L('（從聊天記錄補上）', '(from chat)') : ''}</div>
          ${o.replies.length ? `<div class="rp">${o.replies.map((r) => `<div><b>${hhmmss(r.t)}</b>${r.loose ? `<span class="tag t-warn" title="${escapeHtml(L('名字近似（表情不同）：', 'Similar name (different emoji): ') + (r.from || ''))}">≈ ${escapeHtml(r.from || '')}</span> ` : ''}<span class="rm">${escapeHtml(r.msg)}</span></div>`).join('')}</div>` : ''}`;
        const od = d.querySelector('.odel');
        od.onclick = () => {
          if (!od.dataset.c) { od.dataset.c = 1; od.textContent = L('確認刪除', 'Delete?'); od.style.color = 'var(--err)'; setTimeout(() => { delete od.dataset.c; od.textContent = '×'; od.style.color = 'var(--muted)'; }, 3000); return; }
          live.orders = live.orders.filter((x) => x !== o); saveLive(); renderLive();
        };
        box.appendChild(d);
      });
      if (!box.children.length) box.innerHTML = `<div class="empty">${live.on ? L('等待得標…（畫面下方出現「won!」就會記錄）', 'Waiting for a win… (recorded when “won!” appears)') : L('按「開始檢測」後，得標和客人回覆會記錄在這裡', 'Press “Start detecting” — wins and customer replies will show here')}</div>`;
    };
    updLiveTimers = () => {
      root.querySelectorAll('#ttf-livelist [data-left]').forEach((el) => {
        const left = +el.dataset.left - Date.now();
        el.textContent = left > 0 ? Math.ceil(left / 1000) + 's' : L('已結束', 'Closed');
        el.className = 'tag ' + (left > 0 ? 't-info' : 't-muted');
      });
    };
    $('ttf-livemins').value = live.mins;
    $('ttf-livemins').onchange = (e) => { const v = parseFloat(e.target.value); if (v > 0) { live.mins = v; saveLive(); } else e.target.value = live.mins; renderLive(); };
    $('ttf-livego').onclick = () => { if (live.on) stopLive(); else startLive(true); };
    $('ttf-liveq').oninput = () => renderLive();
    $('ttf-livecsv').onclick = () => {
      const el = $('ttf-livemsg');
      if (!live.orders.length) { el.textContent = L('沒有記錄可以匯出', 'No records to export'); el.className = 'msg warn'; return; }
      // 文件名 = 場次 + 日期（從 listing 名稱結尾「- PT1 - 1110」讀，讀不到就用今天的設定）
      const ses = [];
      for (const o of live.orders) {
        const m = String(o.listing || '').match(/-\s*(PT\s*\d+)\s*-\s*(\d{3,4})\s*$/i);
        const k = m ? m[1].replace(/\s+/g, '').toUpperCase() + '_' + m[2] : '';
        if (k && !ses.includes(k)) ses.push(k);
      }
      const name = `TikTokLive_${(ses.length ? ses : [ptLabel() + '_' + today()]).join('+')}_${new Date().getFullYear()}.csv`;
      const blob = new Blob([liveCSV()], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      try { localStorage.setItem('ttfill_live_last', JSON.stringify({ at: Date.now(), name, orders: live.orders })); } catch (e) { /* 空 */ } // 留一份備份
      const n = live.orders.length;
      live.orders = []; saveLive(); renderLive();
      el.textContent = L(`已匯出 ${n} 單到「${name}」，記錄已清空`, `Exported ${n} orders to “${name}” and cleared the records`); el.className = 'msg ok';
    };
    $('ttf-liveclr').onclick = (e) => {
      const b = e.currentTarget;
      if (!b.dataset.c) { b.dataset.c = '1'; b.textContent = L('再按一次確認清空', 'Press again to clear'); setTimeout(() => { delete b.dataset.c; b.textContent = L('清空記錄', 'Clear records'); }, 3000); return; }
      live.orders = []; saveLive(); renderLive();
    };
    $('ttf-livediag').onclick = async () => {
      const txt = liveDiagnose(); LOG(txt);
      const el = $('ttf-livemsg');
      try { await navigator.clipboard.writeText(txt); el.textContent = L('直播診斷已複製，直接貼給 Claude', 'Live diagnostics copied — paste them to Claude'); el.className = 'msg ok'; }
      catch (err) { el.textContent = txt; el.className = 'msg'; }
    };
    renderLive();
    updFeedBtns = () => {
      const a = $('ttf-feedwin'), b = $('ttf-feedpip'); if (!a) return;
      const open = feed.win && !feed.win.closed;
      a.textContent = open && feed.kind === 'win' ? L('✕ 關閉評論窗', '✕ Close comments window') : L('⧉ 彈出評論窗', '⧉ Pop out comments');
      b.textContent = open && feed.kind === 'pip' ? L('✕ 關閉置頂小窗', '✕ Close on-top window') : L('📌 置頂小窗', '📌 Always-on-top');
      a.disabled = !!(open && feed.kind === 'pip'); b.disabled = !!(open && feed.kind === 'win');
    };
    const feedBtn = async (kind) => {
      if (feed.win && !feed.win.closed && feed.kind === kind) { feedClose(); return; }
      const r = await feedOpen(kind);
      const el = $('ttf-livemsg');
      if (r === 'blocked') { el.textContent = L('瀏覽器擋住了彈出窗口：請在網址列右邊允許 shop.tiktok.com 彈出窗口，再按一次', 'The browser blocked the pop-up — allow pop-ups for shop.tiktok.com (right side of the address bar) and press again'); el.className = 'msg warn'; }
      else if (r === 'nopip') { el.textContent = L('這個 Chrome 版本不支援置頂小窗，請用「彈出評論窗」或更新 Chrome', 'This Chrome version can’t do an always-on-top window — use “Pop out comments” or update Chrome'); el.className = 'msg warn'; }
      else { el.textContent = ''; el.className = 'msg'; }
    };
    $('ttf-feedwin').onclick = () => feedBtn('win');
    $('ttf-feedpip').onclick = () => feedBtn('pip');
    if (!window.documentPictureInPicture) $('ttf-feedpip').title = L('需要 Chrome 116 或以上', 'Needs Chrome 116+');
    $('ttf-feedhost').value = fset.host || '';
    $('ttf-feedhost').onchange = (e) => { fset.host = e.target.value.trim(); saveState(); if (feed.win) feedRender(null, 0, true); };
    updFeedBtns();

    // 類目庫
    const catInfo = () => {
      $('ttf-catinfo').textContent = cats.paths.length
        ? L(`已存 ${cats.paths.length} 個類目 · 更新於 ${new Date(cats.updated).toLocaleDateString()}`, `${cats.paths.length} categories saved · updated ${new Date(cats.updated).toLocaleDateString()}`)
        : L('還沒讀取。讀取一次之後，新增商品時輸入關鍵字就能選到最準的類目。', 'Not read yet. After one read, you can pick exact categories by keyword when adding products.');
    };
    catInfo();
    const catMsg = (m, t) => { const el = $('ttf-catmsg'); el.textContent = m; el.className = 'msg ' + (t || ''); };
    let catBusy = false;
    const runCrawl = async (full) => {
      if (catBusy) { catStop = true; catMsg(L('停止中…', 'Stopping…'), 'warn'); return; }
      if (busy) { catMsg(L('正在上架，請等上架完成再讀取類目', 'Uploading in progress — read categories after it finishes'), 'warn'); return; }
      catBusy = true; busy = true;
      const btn = full ? $('ttf-catfull') : $('ttf-catup');
      const other = full ? $('ttf-catup') : $('ttf-catfull');
      const oldTxt = btn.textContent;
      btn.textContent = L('■ 停止', '■ Stop'); other.disabled = true;
      const t0 = Date.now();
      catMsg(L('正在打開 TikTok 類目清單…（讀取期間請不要操作 TikTok 頁面）', 'Opening the TikTok category list… (don’t use the TikTok page while reading)'));
      try {
        const r = await crawlCats(full, (found, total, where) => {
          const min = Math.round((Date.now() - t0) / 60000);
          catMsg(L(`讀取中… 新增 ${found} 個 · 共 ${total} 個 · ${min} 分鐘\n${where}`, `Reading… ${found} new · ${total} total · ${min} min\n${where}`));
        });
        catMsg(r.stopped ? L(`已停止：新增 ${r.found} 個，共 ${r.total} 個。下次按「讀取 / 更新」會從沒讀完的地方繼續。`, `Stopped: ${r.found} new, ${r.total} total. “Read / update” will continue where it left off.`)
                         : L(`完成 🎉 新增 ${r.found} 個，共 ${r.total} 個類目`, `Done 🎉 ${r.found} new, ${r.total} categories in total`), r.stopped ? 'warn' : 'ok');
      } catch (e) {
        LOG(e);
        catMsg(L('出錯：', 'Error: ') + e.message, 'err');
      } finally {
        catBusy = false; busy = false;
        btn.textContent = oldTxt; other.disabled = false;
        catInfo(); renderLib();
      }
    };
    // 匯出 / 匯入
    let fileMode = '';
    const pickFile = (mode) => { fileMode = mode; $('ttf-file').value = ''; $('ttf-file').click(); };
    $('ttf-catexp').onclick = () => {
      if (!cats.paths.length) { catMsg(L('類目庫是空的，先讀取一次', 'The category list is empty — read it first'), 'warn'); return; }
      downloadJSON({ type: 'ttfill-categories', version: 1, ...cats }, `tiktok-categories-${stamp()}.json`);
      catMsg(L(`已下載 ${cats.paths.length} 個類目。在別的電腦按「匯入類目庫」選這個檔案。`, `Downloaded ${cats.paths.length} categories. On another computer, press “Import categories” and pick this file.`), 'ok');
    };
    $('ttf-catimp').onclick = () => { if (!busy) pickFile('cats'); };
    $('ttf-fullexp').onclick = async () => {
      const images = [];
      for (const m of state.imgs) { const b = await imgGet(m.id).catch(() => null); if (b) images.push({ ...m, data: await blobToDataURL(b) }); }
      downloadJSON({ type: 'ttfill-backup', version: 2, lib: state.lib, cats, images, settings: { pt: state.pt, qty: state.qty, lang: state.lang, auto: state.auto, defImg: state.defImg } }, `tiktok-upload-backup-${stamp()}.json`);
      alertMsg(L(`已下載完整備份：${state.lib.length} 個商品、${cats.paths.length} 個類目、${images.length} 張圖片`, `Full backup downloaded: ${state.lib.length} products, ${cats.paths.length} categories, ${images.length} images`));
    };
    $('ttf-fullimp').onclick = () => { if (!busy) pickFile('full'); };
    $('ttf-file').onchange = async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      let data;
      try { data = JSON.parse(await f.text()); } catch (err) { (fileMode === 'cats' ? catMsg : alertMsg)(L('這個檔案讀不了（不是備份檔）', 'Can’t read this file (not a backup file)'), 'err'); return; }
      const c = data.type === 'ttfill-categories' ? data : data.cats;
      const lib = data.type === 'ttfill-backup' ? data.lib : Array.isArray(data) ? data : null;
      if (fileMode === 'cats') {
        const n = mergeCats(c);
        if (n < 0) { catMsg(L('這個檔案裡沒有類目庫', 'This file has no category list'), 'err'); return; }
        catMsg(L(`匯入完成：新增 ${n} 個類目，已有的跳過，共 ${cats.paths.length} 個`, `Imported: ${n} new categories (existing ones skipped), ${cats.paths.length} total`), 'ok');
      } else {
        if (!lib && !c) { alertMsg(L('這個檔案裡沒有可匯入的資料', 'Nothing to import in this file'), 'err'); return; }
        let ni = 0;
        for (const m of data.images || []) {
          if (!m || !m.id || !m.data || state.imgs.some((x) => x.id === m.id)) continue;
          await imgPut(m.id, await dataURLToBlob(m.data));
          state.imgs.push({ id: m.id, name: m.name, w: m.w, h: m.h }); ni++;
        }
        const r = mergeLib(lib);
        const n = c ? mergeCats(c) : 0;
        if (data.settings) { for (const k of ['pt', 'qty', 'lang', 'auto', 'defImg']) if (data.settings[k] !== undefined && (k !== 'defImg' || !state.defImg)) state[k] = data.settings[k]; saveState(); }
        curTab = 'lib'; buildUI();
        alertMsg(L(`匯入完成：商品新增 ${r.added} 個、更新 ${r.updated} 個；類目新增 ${Math.max(n, 0)} 個；圖片新增 ${ni} 張`, `Imported: ${r.added} products added, ${r.updated} updated; ${Math.max(n, 0)} categories, ${ni} images added`));
        return;
      }
      catInfo(); renderLib();
    };

    $('ttf-imgadd').onclick = () => { $('ttf-imgfile').value = ''; $('ttf-imgfile').click(); };
    $('ttf-imgfile').onchange = async (e) => {
      const el = $('ttf-imgmsg');
      try {
        const ids = await addImages([...e.target.files]);
        if (ids.length && !state.defImg) { state.defImg = ids[0]; saveState(); }
        el.textContent = L(`已加入 ${ids.length} 張圖片。點 ★ 設定預設圖片；在商品「編輯」裡可以指定每個商品用哪一張。`, `Added ${ids.length} image(s). Tap ★ to set the default; choose a product’s image in its “Edit” form.`);
        el.className = 'msg ok';
      } catch (err) { LOG(err); el.textContent = L('圖片加入失敗：', 'Couldn’t add the image: ') + err.message; el.className = 'msg err'; }
      renderLib();
    };

    $('ttf-catup').onclick = () => runCrawl(false);
    $('ttf-catfull').onclick = () => runCrawl(true);
    $('ttf-catdiag').onclick = async () => {
      if (!getDialog()) { catMsg(L('請先手動打開 Create temporary listing 彈窗，再按「類目診斷」', 'Open “Create temporary listing” manually first, then press “Category diagnostics”'), 'warn'); return; }
      const txt = await catDiagnose();
      LOG(txt);
      try { await navigator.clipboard.writeText(txt); catMsg(L('類目診斷已複製，直接貼給 Claude', 'Category diagnostics copied — paste them to Claude'), 'ok'); }
      catch (e) { $('ttf-in').value = txt; root.querySelector('details.tools').open = true; catMsg(L('診斷結果在「匯入 · 備份 · 工具」的輸入框裡，複製後貼給 Claude', 'Diagnostics are in the box under “Import · Backup · Tools” — copy and paste them to Claude'), 'warn'); }
    };

    render();
    renderLib();
  }

  // 位置（舊版存的是 top，換算成 bottom）
  if (state.pos && state.pos.b === undefined && state.pos.y !== undefined) state.pos = { x: state.pos.x, b: Math.max(8, window.innerHeight - state.pos.y - 500) };
  buildUI();
  if (live.on) startLive();
  setInterval(() => { if (live.on) updLiveTimers(); if (ann.on) { annTick(); try { updAnnSub(); } catch (e) { /* 面板重建中 */ } } }, 1000);
  if (ann.on) annNext = Date.now() + 5000;
  if (state.pos) requestAnimationFrame(() => { state.pos = place(state.pos.x, state.pos.b); });
  window.addEventListener('resize', () => { if (state.pos) place(state.pos.x, state.pos.b); });

  document.addEventListener('keydown', (e) => {
    if (!e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.code === 'KeyF') { e.preventDefault(); fillNext(); }
    if (e.code === 'KeyN') { e.preventDefault(); $('ttf-skip').click(); }
  }, true);

  LOG('已載入');
})();
