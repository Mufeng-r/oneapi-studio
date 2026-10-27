/* ================= 接入信息 / 创建 API Key =================
   - 页面上所有 [data-open-key] 按钮打开「创建 API Key」弹窗
   - [data-copy-text] 按钮复制属性里的文字；[data-copy-from] 复制指定元素的文字
   - 演示阶段没有后端：Key 在浏览器本地生成，明确标注「演示 Key，不能真实调用」
   依赖 index.html 暴露的 window.OneAPIData.API_BASE。 */
(function () {
  const data = window.OneAPIData;
  if (!data) return;

  const BASE = data.API_BASE;
  const STORE = 'oneapi-demo-key';
  const PLACEHOLDER = 'sk-oneapi-...';

  // ===== Key：本地生成并记住，刷新后仍是同一个 =====
  let key = null;
  try { key = localStorage.getItem(STORE); } catch (e) { key = null; }

  function makeKey() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return 'sk-oneapi-demo-' + Array.prototype.map.call(bytes, function (b) {
      return (b < 16 ? '0' : '') + b.toString(16);
    }).join('');
  }

  function saveKey(next) {
    key = next;
    try { localStorage.setItem(STORE, key); } catch (e) { /* 隐私模式下存不了，本次会话仍可用 */ }
    applyKey();
    // 通知工作台等其他模块刷新示例代码
    document.dispatchEvent(new CustomEvent('oneapi:keychange'));
  }

  // ===== 复制 =====
  function copyText(text, btn) {
    // 图标按钮（.copy-ico / data-keep-text）只靠图标形变反馈，读屏名称同步改为「已复制」；
    // 文字按钮仍临时把文字换成结果
    const done = function (ok) {
      if (!btn) return;
      const iconOnly = btn.classList.contains('copy-ico') || btn.hasAttribute('data-keep-text');
      const attr = iconOnly ? 'aria-label' : null;
      // 记住原始状态（含「原本没有 aria-label」），复原时不改变按钮原来的读屏名称
      if (!('label' in btn.dataset)) btn.dataset.label = attr ? (btn.getAttribute(attr) || '') : btn.textContent;
      const label = btn.dataset.label;
      const result = ok ? '已复制' : '复制失败';
      if (attr) btn.setAttribute(attr, result); else btn.textContent = result;
      btn.classList.toggle('is-done', ok);
      btn.classList.toggle('is-fail', !ok);   // 图标按钮没有文字，失败也要有视觉反馈
      clearTimeout(btn._t);
      btn._t = setTimeout(function () {
        if (!attr) btn.textContent = label;
        else if (label) btn.setAttribute(attr, label);
        else btn.removeAttribute(attr);
        btn.classList.remove('is-done', 'is-fail');
      }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }

  // 非 https 环境下 clipboard API 不可用时的兜底
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  // ===== 弹窗 =====
  let dlg = null;
  let lang = 'py';

  // 示例代码从环境变量读 Key，和弹窗里的安全提示保持一致
  function snippet() {
    const exportLine = 'export ONEAPI_KEY="' + (key || PLACEHOLDER) + '"';
    if (lang === 'curl') {
      return exportLine + '\n\n' +
        'curl ' + BASE + '/chat/completions \\\n' +
        '  -H "Authorization: Bearer $ONEAPI_KEY" \\\n' +
        '  -H "Content-Type: application/json" \\\n' +
        '  -d \'{"model": "deepseek-v3.2", "messages": [{"role": "user", "content": "你好"}]}\'';
    }
    return '# 先在终端执行：' + exportLine + '\n' +
      'import os\n' +
      'from openai import OpenAI\n\n' +
      'client = OpenAI(\n' +
      '    base_url="' + BASE + '",\n' +
      '    api_key=os.environ["ONEAPI_KEY"],\n' +
      ')\n\n' +
      'r = client.chat.completions.create(\n' +
      '    model="deepseek-v3.2",\n' +
      '    messages=[{"role": "user", "content": "你好"}],\n' +
      ')\n' +
      'print(r.choices[0].message.content)';
  }

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'key-dlg';
    dlg.setAttribute('aria-labelledby', 'keyDlgTitle');
    dlg.innerHTML =
      '<div class="key-head">' +
        '<div><h3 id="keyDlgTitle">你的 API Key <span class="key-badge">演示</span></h3></div>' +
        '<button class="key-x" data-key-act="close" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="key-field">' +
        '<label>API Key</label>' +
        '<div class="key-value"><code data-key-dlg></code>' +
          '<button class="copy-btn copy-ico" data-key-act="copy-key" aria-label="复制 API Key">复制</button>' +
          '<button class="copy-btn ghost" data-key-act="regen" title="作废当前 Key 并生成新的">重新生成</button>' +
        '</div>' +
      '</div>' +
      '<div class="key-field">' +
        '<label>接口地址</label>' +
        '<div class="key-value"><code>' + BASE + '</code>' +
          '<button class="copy-btn copy-ico" data-copy-text="' + BASE + '" aria-label="复制接口地址">复制</button>' +
        '</div>' +
      '</div>' +
      '<div class="key-warn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>' +
        '<span><b>演示 Key，不能真实调用。</b>正式 Key 等同账户密码，只放在服务端或环境变量里。</span>' +
      '</div>' +
      '<div class="key-code">' +
        '<div class="key-code-bar">' +
          '<button class="key-tab on" data-key-lang="py">Python</button>' +
          '<button class="key-tab" data-key-lang="curl">cURL</button>' +
          '<button class="copy-btn copy-ico" data-key-act="copy-code" aria-label="复制代码">复制代码</button>' +
        '</div>' +
        '<pre data-key-code></pre>' +
      '</div>' +
      '<div class="key-foot">' +
        '<a class="btn btn-line btn-sm" href="#access" data-key-act="docs">查看接入文档</a>' +
        '<button class="btn btn-dark btn-sm" data-key-act="close">完成</button>' +
      '</div>';
    document.body.appendChild(dlg);

    dlg.addEventListener('click', function (e) {
      // 点遮罩关闭
      if (e.target === dlg) { dlg.close(); return; }
      const t = e.target;
      const tab = t.closest('[data-key-lang]');
      if (tab) {
        lang = tab.dataset.keyLang;
        dlg.querySelectorAll('.key-tab').forEach(function (b) { b.classList.toggle('on', b === tab); });
        renderCode();
        return;
      }
      const act = t.closest('[data-key-act]');
      if (!act) return;
      const a = act.dataset.keyAct;
      if (a === 'close') dlg.close();
      if (a === 'copy-key') copyText(key, act);
      if (a === 'copy-code') copyText(snippet(), act);
      if (a === 'regen') saveKey(makeKey());
      if (a === 'docs') {
        e.preventDefault();
        dlg.close();
        // 从工作台里打开时，先关掉工作台再跳到文档
        if (window.OneAPIStudio && document.body.classList.contains('studio-lock')) {
          window.OneAPIStudio.close(goDocs);
        } else {
          goDocs();
        }
      }
    });
  }

  function goDocs() {
    const el = document.getElementById('access');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCode() {
    if (!dlg) return;
    dlg.querySelector('[data-key-code]').textContent = snippet();
  }

  function open() {
    if (!dlg) build();
    if (!key) saveKey(makeKey());
    applyKey();
    if (!dlg.open) dlg.showModal();
  }

  // ===== 把 Key 同步到页面各处 =====
  function applyKey() {
    if (dlg) {
      dlg.querySelector('[data-key-dlg]').textContent = key || '';
      renderCode();
    }
    // 接入信息卡的 API Key 行
    document.querySelectorAll('[data-key-row]').forEach(function (row) {
      row.classList.toggle('has-key', !!key);
      const view = row.querySelector('[data-key-view]');
      if (view) view.textContent = key || '还没有创建';
      const create = row.querySelector('.access-create');
      if (create) create.textContent = key ? '查看' : '创建 API Key';
    });
    // 代码示例里的 api_key
    document.querySelectorAll('[data-key-slot]').forEach(function (el) { el.textContent = key || PLACEHOLDER; });
  }

  // ===== 全局点击代理 =====
  document.addEventListener('click', function (e) {
    const t = e.target;
    const opener = t.closest('[data-open-key]');
    if (opener) { e.preventDefault(); open(); return; }

    const direct = t.closest('[data-copy-text]');
    if (direct) { copyText(direct.dataset.copyText, direct); return; }
    const from = t.closest('[data-copy-from]');
    if (from) {
      const src = document.querySelector(from.dataset.copyFrom);
      if (src) copyText(src.textContent.trim(), from);
    }
  });

  applyKey();

  window.OneAPIAccess = {
    open: open,
    getKey: function () { return key; },
    copy: copyText,
  };
})();
