/* ================= 创作工作台 =================
   点能力卡 → 卡片 3D 翻转并放大成全屏工作台；关闭时原路翻回。
   纯前端演示：不调用真实 API，生成结果取自本地示例素材。
   依赖 index.html 暴露的 window.OneAPIData（模型与价格）。 */
(function () {
  const data = window.OneAPIData;
  if (!data) return;

  const SHOW = 'assets/showcase/';
  const FLIP_MS = 720;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ===== 图标 =====
  const svg = function (d, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + d + '</svg>';
  };
  const ICON = {
    image: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/>'),
    video: svg('<rect x="2.5" y="5" width="14" height="14" rx="2.5"/><path d="M16.5 10l5-3v10l-5-3"/>'),
    code: svg('<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    home: svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    box: svg('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>'),
    bolt: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    folder: svg('<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    chevR: svg('<path d="M9 6l6 6-6 6"/>'),
    caret: svg('<path d="M6 9l6 6 6-6"/>', ' class="st-caret"'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    send: svg('<path d="M12 19V5M5 12l7-7 7 7"/>', ' stroke-width="2.4"'),
    upload: svg('<path d="M12 5v14M5 12h14"/>'),
    palette: svg('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M12 21a3 3 0 0 1 0-6h1.5"/>'),
    bulb: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>'),
    ratio: svg('<rect x="3" y="6" width="18" height="12" rx="2"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'),
    repo: svg('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>'),
    check: svg('<path d="M5 12l5 5 9-10"/>', ' class="st-check" stroke-width="2.4"'),
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    page: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h8M8 16h5"/>'),
    game: svg('<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 13.5h.01"/>'),
    chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    phone: svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/>'),
    bug: svg('<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 8V5M9 5l1.5 2M15 5l-1.5 2M3 13h4M17 13h4M4 19l3-2M20 19l-3-2"/>'),
    test: svg('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>'),
  };

  // ===== 每个类型的工具区与素材配置 =====
  // 瀑布流素材：[标题, 分类, 展示比例]。分类按图片实际内容逐张标注；
  // 原图都是 16:9，图片类按内容裁成不同比例，形成高低错落
  const IMAGE_ITEMS = [
    ['呱呱与辣条的奇妙冒险', '动漫', '4/5'], ['听见你的心声', '动漫', '3/4'], ['宠物重生计', '萌宠', '1/1'],
    ['上岸', '人像', '4/5'], ['裤头与二胆：进城篇', '人像', '4/3'], ['别闹了法姥', '人像', '1/1'],
    ['广阔的土地生不出狭隘的心', '人像', '16/10'], ['校霸竟是我自己', '人像', '4/5'], ['中秋在哪都要好好过', '人像', '3/4'],
    ['口袋与金扣', '萌宠', '4/3'], ['山门外', '人像', '4/5'], ['同锅', '场景', '16/10'],
    ['我的前半生之默片版', '人像', '1/1'], ['打工人公司逃亡', '场景', '4/3'], ['龟仙', '萌宠', '4/5'],
    ['1994 圣诞节', '场景', '3/4'],
  ];
  // 视频封面标题多贴在画面两侧，只对标题居中的几张用 4:3，避免裁掉字
  const VIDEO_ITEMS = [
    ['咕咕嘎嘎吃火锅', '动画', '16/9'], ['阿拉丁', '动画', '16/9'], ['归墟行动：巨鳌负山', '奇幻', '16/9'],
    ['普度众生', '奇幻', '4/3'], ['流水线如何颠覆世界', '纪实', '16/9'], ['崂山道士', '国风', '16/9'],
    ['木木的小事', '动画', '4/3'], ['荷间入梦｜江南夏日', '国风', '16/9'], ['拜月', '剧情', '16/9'],
    ['晚开的花', '剧情', '16/9'], ['甄海传', '国风', '16/9'], ['霸王', '国风', '4/3'],
    ['丑妻', '国风', '16/9'], ['灰小子', '剧情', '16/9'], ['妙脆角猫的生存日记', '动画', '16/9'],
    ['预言中的恋人', '剧情', '4/3'],
  ];
  // Coding 截图按 SVG 原始尺寸（宽 480）给比例，保证图片加载前就占好位置
  const CODE_ITEMS = [
    ['SaaS 产品落地页', '网页', '480/340'], ['运营数据看板', '工具', '480/360'], ['贪吃蛇小游戏', '游戏', '480/400'],
    ['看板式任务管理', '工具', '480/320'], ['天气预报卡片', '应用', '480/420'], ['AI 聊天界面', '应用', '480/380'],
    ['音乐播放器', '应用', '480/300'], ['三档定价页', '网页', '480/340'], ['今日待办清单', '工具', '480/330'],
    ['计算器', '工具', '480/420'], ['设计师作品集', '网页', '480/380'], ['路线导航', '应用', '480/340'],
  ];

  const pad = function (n) { return (n < 10 ? '0' : '') + n; };

  const TYPES = {
    image: {
      label: '图片', title: 'OneAPI 图片工作台', icon: 'image',
      placeholder: '描述你想要的画面，例如：赛博朋克风格的猫咪侦探，霓虹雨夜，电影感光影…',
      options: [
        { key: 'ratio', icon: 'ratio', values: ['1:1', '3:4', '16:9', '9:16'] },
        { key: 'count', icon: 'layers', values: ['1 张', '2 张', '4 张'] },
      ],
      extra: [{ icon: 'palette', label: '风格' }, { icon: 'bulb', label: '模板' }],
      skills: [
        { name: '角色设计', thumb: 'image-02', tag: '最新', prompt: '设计一个原创动漫角色，三视图，干净白底，标注配色与服饰细节' },
        { name: '电商主图', thumb: 'image-09', prompt: '为一款手工月饼礼盒生成电商主图，暖色调，中秋氛围，留出文案位置' },
        { name: '海报设计', thumb: 'image-04', prompt: '电影感竖版海报，主角背影站在考场门口，标题「上岸」，胶片质感' },
        { name: '场景设计', thumb: 'image-11', prompt: '东方奇幻山门场景，云雾缭绕，黄昏光线，概念设计稿风格' },
        { name: '头像写真', thumb: 'image-13', prompt: '把上传的照片转成复古黑白默片风格头像，保留人物五官特征' },
        { name: '局部重绘', icon: 'palette', prompt: '把图中人物的衣服换成红色汉服，其余保持不变' },
      ],
      cats: ['人像', '萌宠', '动漫', '场景'],
      thumb: SHOW + 'image-02.webp',
      feed: IMAGE_ITEMS.map(function (x, i) {
        return { title: x[0], tag: x[1], ratio: x[2], src: SHOW + 'image-' + pad(i + 1) + '.webp' };
      }),
    },
    video: {
      label: '视频', title: 'OneAPI 视频工作台', icon: 'video',
      placeholder: '描述镜头和动作，例如：一只柴犬在樱花雨中奔跑，慢镜头，镜头缓慢推近…',
      options: [
        { key: 'dur', icon: 'clock', values: ['5 秒', '8 秒', '10 秒'] },
        { key: 'ratio', icon: 'ratio', values: ['16:9', '9:16', '1:1'] },
      ],
      extra: [{ icon: 'palette', label: '风格' }, { icon: 'bulb', label: '模板' }],
      skills: [
        { name: '图生视频', thumb: 'video-08', tag: '最新', prompt: '让上传的图片动起来：人物轻摇团扇，荷叶随风摆动，镜头缓慢横移' },
        { name: '首尾帧', thumb: 'video-02', prompt: '以第一张图为首帧、第二张图为尾帧，生成平滑的过渡动画' },
        { name: '剧情短片', thumb: 'video-03', prompt: '神话题材短片开场：巨鳌负山从深海升起，史诗配乐，航拍视角' },
        { name: '产品展示', thumb: 'video-05', prompt: '复古汽车 360 度旋转展示，影棚灯光，黑色背景，质感特写' },
        { name: '运镜模板', thumb: 'video-10', prompt: '希区柯克变焦运镜：人物不动，背景快速拉远' },
        { name: '口型同步', thumb: 'video-13', prompt: '让人物按上传的音频说话，口型自然同步，表情生动' },
      ],
      cats: ['剧情', '国风', '动画', '奇幻'],
      thumb: SHOW + 'video-08.webp',
      feed: VIDEO_ITEMS.map(function (x, i) {
        return { title: x[0], tag: x[1], ratio: x[2], src: SHOW + 'video-' + pad(i + 1) + '.webp',
          dur: '0:' + pad(8 + (i * 7) % 50) };
      }),
    },
    code: {
      label: 'Coding', title: 'OneAPI Coding 工作台', icon: 'code',
      placeholder: '描述你想做的东西，例如：做一个带登录和图表的 SaaS 运营后台，深色主题…',
      options: [
        { key: 'lang', icon: 'code', values: ['HTML', 'React', 'Vue', 'Python'] },
        { key: 'mode', icon: 'bolt', values: ['Agent 模式', '对话模式'] },
      ],
      extra: [{ icon: 'repo', label: '仓库' }, { icon: 'bulb', label: '模板' }],
      skills: [
        { name: '落地页', icon: 'page', tag: '最新', prompt: '做一个 AI 写作工具的落地页：Hero、功能三栏、定价、FAQ，响应式' },
        { name: '小游戏', icon: 'game', prompt: '用 HTML Canvas 做一个贪吃蛇小游戏，带计分和速度递增' },
        { name: '数据看板', icon: 'chart', prompt: '做一个运营数据看板：KPI 卡片、折线趋势图、渠道占比环形图' },
        { name: '小程序', icon: 'phone', prompt: '做一个待办清单小程序页面，支持新增、勾选完成和本地存储' },
        { name: '修 Bug', icon: 'bug', prompt: '帮我排查这段代码为什么在 Safari 下报错，并给出修复方案：' },
        { name: '写单测', icon: 'test', prompt: '为下面这个函数补齐单元测试，覆盖边界情况：' },
      ],
      cats: ['网页', '应用', '工具', '游戏'],
      thumb: SHOW + 'code-02.svg',
      feed: CODE_ITEMS.map(function (x, i) {
        return { title: x[0], tag: x[1], ratio: x[2], src: SHOW + 'code-' + pad(i + 1) + '.svg' };
      }),
    },
  };

  // ===== 工具函数 =====
  const $ = function (sel, root) { return (root || document).querySelector(sel); };

  function modelsOf(type) {
    // 折扣高的排前面，默认选中第一个
    return data.models[type].slice().sort(function (a, b) { return b.off - a.off; });
  }

  function logoSrc(m) {
    return data.LOGO_DIR + (data.logoFile[m.logo] || data.logoFile.openai) + '.svg';
  }

  function likes(i) { return (((i + 3) * 7919) % 900 + 60) / 10 + 'k'; }

  // ===== 状态 =====
  const state = { type: 'image', model: {}, opt: {}, cat: {}, sort: 'hot', cols: 0, busy: false };
  let root = null;
  let openedFrom = null;
  let lastFocus = null;
  let toastTimer = null;
  let animating = false;      // 翻转动画进行中，忽略重复的打开/关闭
  let historyPushed = false;  // 打开时是否压入了历史记录
  let pendingClose = false;   // 打开动画期间收到了后退

  // ===== 构建 DOM（只建一次）=====
  function build() {
    root = document.createElement('div');
    root.className = 'studio';
    root.id = 'studio';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '创作工作台');
    root.innerHTML =
      '<aside class="st-side">' +
        '<button class="st-logo" data-act="close" title="返回首页"><img src="assets/logo.svg" alt="" /><span>OneAPI Studio</span></button>' +
        '<button class="st-new" data-act="new">' + ICON.plus + '<span>新建项目</span></button>' +
        '<button class="st-nav on">' + ICON.home + '<span>工作室</span></button>' +
        '<button class="st-nav" data-act="soon">' + ICON.grid + '<span>作品广场</span></button>' +
        '<button class="st-nav" data-act="soon">' + ICON.box + '<span>资产</span></button>' +
        '<button class="st-nav" data-act="soon">' + ICON.bolt + '<span>技能</span></button>' +
        '<div class="st-sep"></div>' +
        '<button class="st-nav" data-act="soon">' + ICON.folder + '<span>我的项目</span><i class="st-more">' + ICON.chevR + '</i></button>' +
        '<div class="st-side-foot">' +
          '<div class="st-credit">演示额度<b>$5.00</b></div>' +
        '</div>' +
      '</aside>' +
      '<main class="st-main" tabindex="-1">' +
        '<header class="st-top">' +
          '<button class="st-back" data-act="close" aria-label="返回首页">' + ICON.back + '<span>返回首页</span></button>' +
          '<nav class="st-tabs" role="tablist" aria-label="能力类型">' +
            ['image', 'video', 'code'].map(function (t) {
              return '<button class="st-tab" role="tab" data-tab="' + t + '">' +
                '<img class="st-tab-thumb" src="' + TYPES[t].thumb + '" alt="" />' + ICON[t] + TYPES[t].label + '</button>';
            }).join('') +
          '</nav>' +
          '<div class="st-top-right">' +
            '<button class="st-pill" data-act="docs">API 文档</button>' +
            '<button class="st-pill st-pill-acc" data-act="key">创建 API Key</button>' +
            '<button class="st-close" data-act="close" aria-label="关闭工作台，返回首页">' + ICON.close + '</button>' +
          '</div>' +
        '</header>' +
        '<section class="st-hero">' +
          '<h2 class="st-title"><i data-ref="titleIcon"></i><span data-ref="title"></span></h2>' +
          '<div class="st-composer" data-ref="composer">' +
            '<button class="st-upload" data-act="soon" aria-label="上传参考素材">' + ICON.upload + '</button>' +
            '<textarea class="st-prompt" data-ref="prompt" rows="3" aria-label="创作需求"></textarea>' +
            '<div class="st-toolbar" data-ref="toolbar"></div>' +
            '<div class="st-menu" data-ref="menu" role="listbox" hidden></div>' +
          '</div>' +
          '<div class="st-skills" data-ref="skills"></div>' +
        '</section>' +
        '<section class="st-results" data-ref="results" hidden>' +
          '<div class="st-sec-head"><h3>本次生成</h3><span>演示，未调用真实 API</span></div>' +
          '<div class="st-result-row" data-ref="resultRow"></div>' +
        '</section>' +
        '<section class="st-feed">' +
          '<div class="st-feed-head">' +
            '<div class="st-cats" data-ref="cats" role="tablist" aria-label="作品分类"></div>' +
            '<div class="st-filters">' +
              '<button class="st-filter on" data-sort="hot">热门</button>' +
              '<button class="st-filter" data-sort="new">最新</button>' +
            '</div>' +
          '</div>' +
          '<div class="st-masonry" data-ref="feed"></div>' +
        '</section>' +
      '</main>' +
      '<div class="st-toast" data-ref="toast" role="status"></div>';

    document.body.appendChild(root);
    bindEvents();
  }

  function ref(name) { return root.querySelector('[data-ref="' + name + '"]'); }

  // ===== 渲染 =====
  function render() {
    const cfg = TYPES[state.type];
    root.dataset.type = state.type;

    root.querySelectorAll('.st-tab').forEach(function (b) {
      const on = b.dataset.tab === state.type;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    ref('titleIcon').innerHTML = ICON[cfg.icon];
    ref('title').textContent = cfg.title;
    ref('prompt').placeholder = cfg.placeholder;

    if (!state.model[state.type]) state.model[state.type] = modelsOf(state.type)[0];
    if (!state.opt[state.type]) state.opt[state.type] = cfg.options.map(function () { return 0; });

    renderToolbar();
    renderMenu();
    renderSkills();
    renderCats();
    renderFeed();
    closeMenu();
  }

  function renderToolbar() {
    const cfg = TYPES[state.type];
    const m = state.model[state.type];
    const picks = state.opt[state.type];
    ref('toolbar').innerHTML =
      '<button class="st-tool st-tool-model" data-act="menu" aria-haspopup="listbox" aria-expanded="false">' +
        '<img src="' + logoSrc(m) + '" alt="" />' + m.name +
        ' <span class="st-off">-' + m.off + '%</span>' + ICON.caret +
      '</button>' +
      cfg.options.map(function (o, i) {
        return '<button class="st-tool" data-opt="' + i + '" title="点击切换">' + ICON[o.icon] + o.values[picks[i]] + '</button>';
      }).join('') +
      cfg.extra.map(function (e) {
        return '<button class="st-tool" data-act="soon">' + ICON[e.icon] + e.label + '</button>';
      }).join('') +
      '<button class="st-tool st-tool-api" data-act="api" title="按当前设置生成 API 请求代码">' + ICON.code + '用 API 调用</button>' +
      '<button class="st-send" data-act="send" aria-label="开始生成">' + ICON.send + '</button>';
  }

  // 模型下拉：原卡片背面的价格表
  function renderMenu() {
    const list = modelsOf(state.type);
    const cur = state.model[state.type];
    ref('menu').innerHTML =
      '<div class="st-menu-head"><b>选择模型</b><span>' + list.length + ' 个模型 · 售价 / 官方价</span></div>' +
      list.map(function (m, i) {
        return '<button class="st-opt' + (m === cur ? ' on' : '') + '" role="option" data-model="' + i + '"' +
          ' aria-selected="' + (m === cur) + '">' +
          '<span class="st-opt-logo"><img src="' + logoSrc(m) + '" alt="" /></span>' +
          '<span class="st-opt-info"><span class="st-opt-name">' + m.name + '</span>' +
            '<span class="st-opt-vendor">' + m.vendor + '</span></span>' +
          '<span class="st-opt-price"><b>-' + m.off + '%</b>' +
            '<span>' + data.fmt(data.priceOf(m), m.unit) + '</span>' +
            '<s>' + data.fmt(m.official, m.unit) + '</s></span>' +
          ICON.check +
        '</button>';
      }).join('');
  }

  function renderSkills() {
    ref('skills').innerHTML = TYPES[state.type].skills.map(function (s, i) {
      const pic = s.thumb
        ? '<img class="st-skill-thumb" src="' + SHOW + s.thumb + '.webp" alt="" loading="lazy" />'
        : '<span class="st-skill-ico">' + ICON[s.icon] + '</span>';
      return '<button class="st-skill" data-skill="' + i + '">' + pic + s.name +
        (s.tag ? '<em>' + s.tag + '</em>' : '') + '</button>';
    }).join('');
  }

  function renderCats() {
    const cfg = TYPES[state.type];
    const cur = state.cat[state.type] || 'all';
    const count = function (c) {
      return c === 'all' ? cfg.feed.length : cfg.feed.filter(function (it) { return it.tag === c; }).length;
    };
    ref('cats').innerHTML = ['all'].concat(cfg.cats).map(function (c) {
      return '<button class="st-cat' + (c === cur ? ' on' : '') + '" role="tab" aria-selected="' + (c === cur) + '" data-cat="' + c + '">' +
        (c === 'all' ? '全部' : c) + '<span>' + count(c) + '</span></button>';
    }).join('');
  }

  // 列数按窗口宽度算（工作台隐藏时容器宽度为 0，不能用容器量）
  function columnCount() {
    const w = window.innerWidth;
    const side = w > 1100 ? 232 : w > 720 ? 76 : 0;
    const avail = Math.min(1480, w - side) - (w > 720 ? 56 : 32);
    return Math.max(2, Math.min(5, Math.floor((avail + 8) / (236 + 8))));
  }

  // 高宽比，用于估算每列高度
  function heightOf(it) {
    const r = it.ratio.split('/');
    return +r[1] / +r[0];
  }

  // 瀑布流：每张卡放进当前最矮的一列（同高取最左），视觉上从左到右按排名排列。
  // 用 CSS Grid 显式定位：行单位 = 列宽的 1%（见 studio.css 的 grid-auto-rows），
  // 卡片占的行数 = 高宽比 × 100，所以高度严格等于原始比例；DOM 保持排名顺序，键盘和读屏也按这个顺序走
  const ROW_GAP = 3;   // 同列卡片之间留 3 个行单位（约 8px）
  function renderFeed() {
    const type = state.type;
    const models = modelsOf(type);
    const cat = state.cat[type] || 'all';
    let items = TYPES[type].feed.map(function (it, i) { return { it: it, i: i }; })
      .filter(function (x) { return cat === 'all' || x.it.tag === cat; });
    if (state.sort === 'new') items = items.reverse();

    state.cols = columnCount();
    const ends = [];
    for (let c = 0; c < state.cols; c++) ends.push(0);

    const html = items.map(function (x, n) {
      const it = x.it;
      const m = models[x.i % models.length];
      let c = 0;
      for (let k = 1; k < ends.length; k++) if (ends[k] < ends[c]) c = k;
      const span = Math.round(heightOf(it) * 100);
      const start = ends[c] + 1;
      ends[c] += span + ROW_GAP;
      return (
        '<article class="st-item" data-remix="' + x.i + '" tabindex="0" role="button" aria-label="' + it.title + '，做同款"' +
          ' style="grid-column:' + (c + 1) + ';grid-row:' + start + ' / span ' + span +
          ';animation-delay:' + Math.min(n * 40, 480) + 'ms">' +
          '<img src="' + it.src + '" alt="" loading="lazy" decoding="async" />' +
          (it.dur ? '<span class="st-vid" aria-hidden="true">' + ICON.play + '</span><span class="st-dur">' + it.dur + '</span>' : '') +
          '<div class="st-hover">' +
            '<div class="st-hover-title">' + it.title + '</div>' +
            '<div class="st-hover-meta"><img src="' + logoSrc(m) + '" alt="" /><span class="st-item-model">' + m.name + '</span>' +
              '<span class="st-like">' + ICON.heart + likes(x.i) + '</span></div>' +
            '<span class="st-remix">做同款</span>' +
          '</div>' +
        '</article>');
    });

    ref('feed').style.setProperty('--cols', state.cols);
    ref('feed').innerHTML = html.join('');
    // 已在缓存里的图片不会再触发 load，直接标记为已加载
    ref('feed').querySelectorAll('img').forEach(function (img) {
      if (img.complete && img.naturalWidth) img.closest('.st-item').classList.add('is-loaded');
    });
  }

  // ===== 交互 =====
  function setPrompt(text) {
    const box = ref('prompt');
    box.value = text;
    box.focus();
    box.setSelectionRange(text.length, text.length);
  }

  function toast(msg) {
    const el = ref('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  function openMenu() {
    ref('menu').hidden = false;
    const btn = root.querySelector('[data-act="menu"]');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    const on = ref('menu').querySelector('.st-opt.on');
    if (on) on.focus();
  }

  function closeMenu() {
    if (!root) return;
    ref('menu').hidden = true;
    const btn = root.querySelector('[data-act="menu"]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function switchType(type) {
    if (!TYPES[type] || type === state.type) return;
    state.type = type;
    render();
  }

  // 模拟生成：进度条走完后从示例素材里取结果
  function generate() {
    if (state.busy) return;
    const text = ref('prompt').value.trim();
    if (!text) {
      const c = ref('composer');
      c.classList.remove('shake');
      void c.offsetWidth;
      c.classList.add('shake');
      ref('prompt').focus();
      return;
    }

    const cfg = TYPES[state.type];
    const type = state.type;
    const count = type === 'image' ? [1, 2, 4][state.opt.image[1]] : 1;
    const row = ref('resultRow');
    const send = root.querySelector('[data-act="send"]');

    state.busy = true;
    send.disabled = true;
    ref('results').hidden = false;

    const slots = [];
    for (let i = 0; i < count; i++) {
      const slot = document.createElement('div');
      slot.className = 'st-result loading';
      slot.innerHTML = '<div class="st-progress"><b>0%</b>' + state.model[type].name + ' 生成中</div>';
      row.insertBefore(slot, row.firstChild);
      slots.push(slot);
    }
    ref('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const start = performance.now();
    const total = type === 'video' ? 3200 : 2200;
    (function tick(now) {
      const p = Math.min(1, (now - start) / total);
      slots.forEach(function (s) { const b = s.querySelector('b'); if (b) b.textContent = Math.round(p * 100) + '%'; });
      if (p < 1) { requestAnimationFrame(tick); return; }

      slots.forEach(function (s) {
        const pick = cfg.feed[Math.floor(Math.random() * cfg.feed.length)];
        s.className = 'st-result';
        s.innerHTML = '';
        const img = document.createElement('img');
        img.src = pick.src;
        img.alt = '生成结果';
        const cap = document.createElement('div');
        cap.className = 'st-result-cap';
        cap.textContent = text;                 // 用户输入只走 textContent，避免注入
        s.appendChild(img);
        if (type === 'video') s.insertAdjacentHTML('beforeend', '<span class="st-play" style="opacity:1;transform:none">' + ICON.play + '</span>');
        s.appendChild(cap);
      });
      state.busy = false;
      send.disabled = false;
      toast('生成完成（演示）');
    })(start);
  }

  function bindEvents() {
    root.addEventListener('click', function (e) {
      const t = e.target;
      const tab = t.closest('[data-tab]');
      if (tab) { switchType(tab.dataset.tab); return; }

      const remix = t.closest('[data-remix]');
      if (remix) {
        const it = TYPES[state.type].feed[+remix.dataset.remix];
        setPrompt('参考《' + it.title + '》的风格，帮我做一个同款：');
        ref('composer').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const skill = t.closest('[data-skill]');
      if (skill) {
        root.querySelectorAll('.st-skill').forEach(function (b) { b.classList.toggle('on', b === skill); });
        setPrompt(TYPES[state.type].skills[+skill.dataset.skill].prompt);
        return;
      }

      const opt = t.closest('[data-opt]');
      if (opt) {
        const i = +opt.dataset.opt;
        const picks = state.opt[state.type];
        picks[i] = (picks[i] + 1) % TYPES[state.type].options[i].values.length;
        renderToolbar();
        return;
      }

      const model = t.closest('[data-model]');
      if (model) {
        state.model[state.type] = modelsOf(state.type)[+model.dataset.model];
        renderToolbar();
        renderMenu();
        closeMenu();
        root.querySelector('[data-act="menu"]').focus();
        return;
      }

      const cat = t.closest('[data-cat]');
      if (cat) {
        state.cat[state.type] = cat.dataset.cat;
        renderCats();
        renderFeed();
        return;
      }

      const sort = t.closest('[data-sort]');
      if (sort) {
        state.sort = sort.dataset.sort;
        root.querySelectorAll('.st-filter').forEach(function (b) { b.classList.toggle('on', b === sort); });
        renderFeed();
        return;
      }

      const act = t.closest('[data-act]');
      if (act) {
        const a = act.dataset.act;
        if (a === 'menu') { ref('menu').hidden ? openMenu() : closeMenu(); return; }
        if (a === 'send') { generate(); return; }
        if (a === 'close') { close(); return; }
        if (a === 'new') { ref('prompt').value = ''; ref('results').hidden = true; ref('resultRow').innerHTML = ''; ref('prompt').focus(); return; }
        if (a === 'api') { openApi(); return; }
        if (a === 'key') { if (window.OneAPIAccess) window.OneAPIAccess.open(); return; }
        if (a === 'docs') {
          close(function () {
            const el = document.getElementById('access');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          return;
        }
        if (a === 'soon') { toast('演示版：该功能即将上线'); return; }
      }

      if (!t.closest('.st-menu')) closeMenu();
    });

    // 卡片是整块可点的按钮：键盘 Enter / 空格同样触发「做同款」
    ref('feed').addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('st-item')) {
        e.preventDefault();
        e.target.click();
      }
    });

    // 图片加载完再淡入，加载前显示占位底色（高度已由 aspect-ratio 撑好，不会跳动）
    ref('feed').addEventListener('load', function (e) {
      if (e.target.tagName === 'IMG' && e.target.parentElement.classList.contains('st-item')) {
        e.target.parentElement.classList.add('is-loaded');
      }
    }, true);

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (root.classList.contains('is-open') && columnCount() !== state.cols) renderFeed();
      }, 120);
    });

    ref('prompt').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); generate(); }
    });

    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('is-open') || e.key !== 'Escape') return;
      // 有弹窗（API 调用 / API Key）开着时，Esc 只关弹窗，由 <dialog> 自己处理
      if (document.querySelector('dialog[open]')) return;
      if (!ref('menu').hidden) { closeMenu(); root.querySelector('[data-act="menu"]').focus(); return; }
      close();
    });
  }

  // ===== 翻转放大动画 =====
  // 用一个与卡片同位置的过渡层：正面是卡片克隆，背面是工作台底色；
  // 过渡层一边绕 Y 轴翻转一边放大到全屏，结束后再淡入真正的工作台。
  function makeFlipper(card) {
    const front = card.querySelector('.face-front');
    const cs = getComputedStyle(card);
    const el = document.createElement('div');
    el.className = 'st-flipper';
    el.innerHTML =
      '<div class="st-flipper-inner">' +
        '<div class="st-flipper-face st-flipper-front"></div>' +
        '<div class="st-flipper-face st-flipper-back"><span>' + TYPES[card.dataset.card].title + '</span></div>' +
      '</div>';
    const clone = front.cloneNode(true);
    clone.style.transform = 'none';
    el.querySelector('.st-flipper-front').appendChild(clone);
    el.style.setProperty('--cat', cs.getPropertyValue('--cat'));
    el.style.setProperty('--cat-deep', cs.getPropertyValue('--cat-deep'));
    document.body.appendChild(el);
    return el;
  }

  function frames(rect) {
    return [
      { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' },
      { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px' },
    ];
  }

  function runFlip(card, forward) {
    const rect = card.getBoundingClientRect();
    const el = makeFlipper(card);
    const box = frames(rect);
    const spin = [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }];
    const round = [{ borderRadius: '24px' }, { borderRadius: '0px' }];
    const opts = { duration: FLIP_MS, easing: EASE, fill: 'forwards' };
    if (!forward) { box.reverse(); spin.reverse(); round.reverse(); }

    const anims = [
      el.animate(box, opts),
      el.firstChild.animate(spin, opts),
    ].concat(Array.prototype.map.call(el.querySelectorAll('.st-flipper-face'), function (f) {
      return f.animate(round, opts);
    }));
    const finished = Promise.all(anims.map(function (a) { return a.finished; })).catch(function () {});
    // 兜底：标签页切到后台或动画被取消时 finished 可能迟迟不 resolve，超时后强制收尾，避免卡死在工作台
    const timeout = new Promise(function (resolve) { setTimeout(resolve, FLIP_MS + 400); });
    return Promise.race([finished, timeout]).then(function () { return el; });
  }

  function syncTopHeight() {
    const top = root.querySelector('.st-top');
    root.style.setProperty('--st-top-h', top.offsetHeight + 'px');
    if (!topObserver && window.ResizeObserver) {
      topObserver = new ResizeObserver(function () { root.style.setProperty('--st-top-h', top.offsetHeight + 'px'); });
      topObserver.observe(top);
    }
  }
  let topObserver = null;

  // ===== 打开 / 关闭 =====
  function open(type, card) {
    if (!root) build();
    if (animating || root.classList.contains('is-open')) return;
    if (TYPES[type]) state.type = type;
    lastFocus = document.activeElement;
    openedFrom = card || null;
    render();

    // 压一条历史记录，让浏览器「后退」关闭工作台而不是离开页面
    history.pushState({ oneapiStudio: true }, '');
    historyPushed = true;

    const show = function () {
      animating = false;
      root.hidden = false;
      document.body.classList.add('studio-lock');
      syncTopHeight();   // 一显示就量顶栏高度，分类条吸顶位置不必等动画结束
      requestAnimationFrame(function () {
        root.classList.add('is-open');
        // 焦点放进工作台（键盘和读屏可用），但不自动进输入框，避免一打开就亮起聚焦边框
        root.querySelector('.st-main').focus({ preventScroll: true });
        // 打开动画期间按了后退：动画结束后立即关闭
        if (pendingClose) { pendingClose = false; close(); }
      });
    };

    if (!card || reduceMotion.matches || !Element.prototype.animate) { show(); return; }

    animating = true;
    card.style.visibility = 'hidden';
    runFlip(card, true).then(function (el) {
      show();
      setTimeout(function () { el.remove(); }, 260);
    });
  }

  // onDone：关闭动画结束、页面恢复滚动后执行（例如跳到文档区）
  function close(onDone) {
    if (!root || animating || !root.classList.contains('is-open')) return;
    closeMenu();
    if (apiDlg && apiDlg.open) apiDlg.close();
    root.classList.remove('is-open');
    const card = openedFrom;

    // 从按钮 / Esc 关闭时，撤掉打开时压入的历史记录
    if (historyPushed) { historyPushed = false; history.back(); }

    const done = function () {
      animating = false;
      root.hidden = true;
      document.body.classList.remove('studio-lock');
      if (card) card.style.visibility = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      if (typeof onDone === 'function') onDone();
    };

    if (!card || reduceMotion.matches || !Element.prototype.animate) { done(); return; }

    // 先让工作台淡出，再把过渡层从全屏翻回卡片位置
    animating = true;
    setTimeout(function () {
      root.hidden = true;
      runFlip(card, false).then(function (el) { el.remove(); done(); });
    }, 200);
  }

  // 浏览器后退（含手机侧滑返回）关闭工作台
  window.addEventListener('popstate', function () {
    if (!historyPushed) return;               // 不是工作台压入的记录（或是 close 自己触发的后退）
    historyPushed = false;
    if (animating) { pendingClose = true; return; }
    close();
  });

  // ===== 用 API 调用：按当前模型和参数生成可直接运行的请求 =====
  const IMAGE_SIZE = { '1:1': '1024x1024', '3:4': '768x1024', '16:9': '1344x768', '9:16': '768x1344' };
  let apiDlg = null;
  let apiLang = 'curl';

  function currentRequest() {
    const type = state.type;
    const cfg = TYPES[type];
    const m = state.model[type];
    const picks = state.opt[type];
    const opt = function (i) { return cfg.options[i].values[picks[i]]; };
    // 没写需求时用第一个技能的示例，保证生成的请求能直接跑
    const prompt = ref('prompt').value.trim() || cfg.skills[0].prompt;

    if (type === 'image') {
      return { path: '/images/generations',
        body: { model: m.id, prompt: prompt, size: IMAGE_SIZE[opt(0)], n: parseInt(opt(1), 10) } };
    }
    if (type === 'video') {
      return { path: '/videos/generations',
        body: { model: m.id, prompt: prompt, duration: parseInt(opt(0), 10), aspect_ratio: opt(1) } };
    }
    return { path: '/chat/completions',
      body: { model: m.id, messages: [{ role: 'user', content: prompt }], stream: true } };
  }

  function apiSnippet(req) {
    const key = window.OneAPIAccess && window.OneAPIAccess.getKey();
    const exportLine = 'export ONEAPI_KEY="' + (key || '你的 API Key') + '"';
    const url = data.API_BASE + req.path;
    const b = req.body;

    if (apiLang === 'curl') {
      // 单引号包裹 JSON，正文里的单引号按 shell 规则转义
      const json = JSON.stringify(b, null, 2).replace(/'/g, "'\\''");
      return exportLine + '\n\n' +
        'curl ' + url + ' \\\n' +
        '  -H "Authorization: Bearer $ONEAPI_KEY" \\\n' +
        '  -H "Content-Type: application/json" \\\n' +
        '  -d \'' + json + '\'';
    }

    const head = '# 先在终端执行：' + exportLine + '\n';
    const q = JSON.stringify;  // JSON 字符串字面量同时是合法的 Python 字符串
    if (state.type === 'video') {
      const dict = JSON.stringify(b, null, 4).replace(/\n/g, '\n    ');
      return head + 'import os\nimport requests\n\n' +
        'r = requests.post(\n' +
        '    ' + q(url) + ',\n' +
        '    headers={"Authorization": f"Bearer {os.environ[\'ONEAPI_KEY\']}"},\n' +
        '    json=' + dict + ',\n' +
        ')\n' +
        'task = r.json()\n' +
        '# 视频是异步任务：拿任务 ID 轮询结果，或在请求里加 webhook 接收回调\n' +
        'print(task["id"])';
    }
    const client = head + 'import os\nfrom openai import OpenAI\n\n' +
      'client = OpenAI(\n' +
      '    base_url=' + q(data.API_BASE) + ',\n' +
      '    api_key=os.environ["ONEAPI_KEY"],\n' +
      ')\n\n';
    if (state.type === 'image') {
      return client + 'img = client.images.generate(\n' +
        '    model=' + q(b.model) + ',\n' +
        '    prompt=' + q(b.prompt) + ',\n' +
        '    size=' + q(b.size) + ',\n' +
        '    n=' + b.n + ',\n' +
        ')\n' +
        'print(img.data[0].url)';
    }
    return client + 'stream = client.chat.completions.create(\n' +
      '    model=' + q(b.model) + ',\n' +
      '    messages=[{"role": "user", "content": ' + q(b.messages[0].content) + '}],\n' +
      '    stream=True,\n' +
      ')\n' +
      'for chunk in stream:\n' +
      '    print(chunk.choices[0].delta.content or "", end="")';
  }

  function buildApiDlg() {
    apiDlg = document.createElement('dialog');
    apiDlg.className = 'st-api';
    apiDlg.setAttribute('aria-labelledby', 'stApiTitle');
    apiDlg.innerHTML =
      '<div class="st-api-head">' +
        '<div><h3 id="stApiTitle">用 API 调用</h3></div>' +
        '<button class="st-api-x" data-api-act="close" aria-label="关闭">' + ICON.close + '</button>' +
      '</div>' +
      '<div class="st-api-meta" data-api-meta></div>' +
      '<div class="st-api-code">' +
        '<div class="st-api-bar">' +
          '<button class="st-api-tab on" data-api-lang="curl">cURL</button>' +
          '<button class="st-api-tab" data-api-lang="py">Python</button>' +
          '<button class="st-api-copy copy-ico" data-api-act="copy" aria-label="复制代码">复制代码</button>' +
        '</div>' +
        '<pre data-api-code></pre>' +
      '</div>' +
      '<div class="st-api-foot">' +
        '<span data-api-note></span>' +
        '<button class="st-api-key" data-api-act="key"></button>' +
      '</div>';
    root.appendChild(apiDlg);

    apiDlg.addEventListener('click', function (e) {
      if (e.target === apiDlg) { apiDlg.close(); return; }
      const tab = e.target.closest('[data-api-lang]');
      if (tab) {
        apiLang = tab.dataset.apiLang;
        apiDlg.querySelectorAll('.st-api-tab').forEach(function (b) { b.classList.toggle('on', b === tab); });
        renderApi();
        return;
      }
      const act = e.target.closest('[data-api-act]');
      if (!act) return;
      const a = act.dataset.apiAct;
      if (a === 'close') apiDlg.close();
      if (a === 'copy' && window.OneAPIAccess) window.OneAPIAccess.copy(apiSnippet(currentRequest()), act);
      if (a === 'key' && window.OneAPIAccess) window.OneAPIAccess.open();
    });

    // 在 Key 弹窗里创建或重新生成 Key 后，示例代码跟着更新
    document.addEventListener('oneapi:keychange', function () { if (apiDlg.open) renderApi(); });
  }

  function renderApi() {
    const req = currentRequest();
    const hasKey = !!(window.OneAPIAccess && window.OneAPIAccess.getKey());
    const meta = apiDlg.querySelector('[data-api-meta]');
    meta.innerHTML = '<span class="st-api-chip"><b>POST</b></span><span class="st-api-chip"></span><span class="st-api-chip"></span>';
    meta.children[1].textContent = '/v1' + req.path;
    meta.children[2].textContent = 'model: ' + req.body.model;
    apiDlg.querySelector('[data-api-code]').textContent = apiSnippet(req);
    apiDlg.querySelector('[data-api-note]').textContent = hasKey
      ? '已填入你的演示 Key（不能真实调用）。'
      : '还没有 API Key？先创建一个，再填进 ONEAPI_KEY。';
    apiDlg.querySelector('[data-api-act="key"]').textContent = hasKey ? '查看 Key' : '创建 API Key';
  }

  function openApi() {
    closeMenu();
    if (!apiDlg) buildApiDlg();
    renderApi();
    apiDlg.showModal();
  }

  window.OneAPIStudio = { open: open, close: close };
})();
