// 技術スタック — /api/tools から取得し、失敗時は Supabase REST へ直接フォールバック

const VERDICT_LABELS = {
  ok: "商用OK",
  caution: "要確認",
};

const STATUS_LABELS = {
  undecided: "未判定",
  want: "試したい",
  testing: "検証中",
  adopted: "採用",
  rejected: "見送り",
};

// カラーパレット（Color Hunt の人気パレットから選定、現行・他サイト使用分は除外）
// colors: パレット本来の4色（ストライプ表示用、比重 41/26/18/15）
// vars:   役割（メイン/サブ/ライト/アクセント）と、パレットから導出した
//         背景・面・文字色。暗いパレットは暗背景＋明文字、明るいパレットは
//         明背景＋暗文字になるよう各パレットごとに定義する。
//         端末のダーク/ライトモードでは切り替えず、常にパレットどおり
//         表示する（2026-11-23 Gomi指示）。
const PALETTES = [
  {
    name: "Forest Teal",
    colors: ["#557B83", "#39AEA9", "#A2D5AB", "#E5EFC1"],
    vars: {
      main: "#557B83", sub: "#39AEA9", light: "#A2D5AB", accent: "#E5EFC1",
      accentText: "#2F7D5B",
      bg: "#F4F8EC", surface: "#FFFFFF", surfaceMuted: "#E9F2DC",
      text: "#2E4A4F", muted: "#5F7A72", border: "#D5E2C4",
      onMain: "#FFFFFF", headerSub: "#DDEEDD",
    
    },
  },
  {
    name: "Vivid Pop",
    colors: ["#3EC1D3", "#F6F7D7", "#FF9A00", "#FF165D"],
    vars: {
      main: "#FF165D", sub: "#3EC1D3", light: "#F6F7D7", accent: "#FF9A00",
      accentText: "#B96A00",
      bg: "#FDFBEF", surface: "#FFFFFF", surfaceMuted: "#F6F7D7",
      text: "#3D3138", muted: "#7A6F72", border: "#EDE8C8",
      onMain: "#FFFFFF", headerSub: "#FFD9E4",
    
    },
  },
  {
    name: "Navy Sailor",
    colors: ["#01204E", "#028391", "#F6DCAC", "#FF7B25"],
    vars: {
      main: "#01204E", sub: "#028391", light: "#F6DCAC", accent: "#FF7B25",
      accentText: "#C75B12",
      bg: "#FBF3E2", surface: "#FFFFFF", surfaceMuted: "#F6E7CB",
      text: "#01204E", muted: "#5A6B84", border: "#EAD9B8",
      onMain: "#FFFFFF", headerSub: "#C9D6E8",
    
    },
  },
  {
    name: "Neon Night",
    colors: ["#252A34", "#08D9D6", "#FF2E63", "#EAEAEA"],
    vars: {
      main: "#252A34", sub: "#08D9D6", light: "#EAEAEA", accent: "#FF2E63",
      accentText: "#FF5C86",
      bg: "#171A21", surface: "#232830", surfaceMuted: "#2C313B",
      text: "#EAEAEA", muted: "#9AA3B2", border: "#3A4150",
      onMain: "#EAEAEA", headerSub: "#B8C4CE",
    },
  },
  {
    name: "Sunset Dusk",
    colors: ["#355C7D", "#6C5B7B", "#C06C84", "#F67280"],
    vars: {
      main: "#355C7D", sub: "#6C5B7B", light: "#C06C84", accent: "#F67280",
      accentText: "#C24356",
      bg: "#FBF1F2", surface: "#FFFFFF", surfaceMuted: "#F6E3E7",
      text: "#2E4258", muted: "#77687E", border: "#EBCFD6",
      onMain: "#FFFFFF", headerSub: "#D8C9D9",
    
    },
  },
  {
    name: "Crimson Dark",
    colors: ["#2B2E4A", "#E84545", "#903749", "#53354A"],
    vars: {
      main: "#2B2E4A", sub: "#E84545", light: "#53354A", accent: "#903749",
      accentText: "#E87A90",
      bg: "#1D1F30", surface: "#2B2E4A", surfaceMuted: "#353A5C",
      text: "#EDEDF2", muted: "#A3A7C0", border: "#454A6E",
      onMain: "#FFFFFF", headerSub: "#B9BCD6",
    },
  },
  {
    name: "Coffee Roast",
    colors: ["#EAC696", "#C8AE7D", "#765827", "#65451F"],
    vars: {
      main: "#65451F", sub: "#765827", light: "#EAC696", accent: "#C8AE7D",
      accentText: "#8A5A1E",
      bg: "#FAF3E7", surface: "#FFFFFF", surfaceMuted: "#F1E4CC",
      text: "#3E2C14", muted: "#7A6748", border: "#E4D3B0",
      onMain: "#FFFFFF", headerSub: "#E3D3B8",
    
    },
  },
  {
    name: "Pastel Dream",
    colors: ["#FFD5E5", "#FFFFDD", "#A0FFE6", "#81F5FF"],
    vars: {
      main: "#FFD5E5", sub: "#2E9E8B", light: "#FFFFDD", accent: "#81F5FF",
      accentText: "#C2437E",
      bg: "#FFFDF5", surface: "#FFFFFF", surfaceMuted: "#FDF6E3",
      text: "#4A3540", muted: "#8A7280", border: "#F3DCE6",
      onMain: "#5B3A4A", headerSub: "#7A5568",
    
    },
  },
  {
    name: "Earthy Olive",
    colors: ["#606C38", "#283618", "#DDA15E", "#BC6C25"],
    vars: {
      main: "#283618", sub: "#606C38", light: "#DDA15E", accent: "#BC6C25",
      accentText: "#A55A1D",
      bg: "#FAF4E6", surface: "#FFFFFF", surfaceMuted: "#F1E5CB",
      text: "#283618", muted: "#6B7256", border: "#E3D3AC",
      onMain: "#FFFFFF", headerSub: "#D8DCC3",
    
    },
  },
  {
    name: "Slate Ember",
    colors: ["#25343F", "#BFC9D1", "#EAEFEF", "#FF9B51"],
    vars: {
      main: "#25343F", sub: "#4E6E7E", light: "#EAEFEF", accent: "#FF9B51",
      accentText: "#C96A1E",
      bg: "#F4F7F7", surface: "#FFFFFF", surfaceMuted: "#E4EBEC",
      text: "#25343F", muted: "#66727B", border: "#D3DCDE",
      onMain: "#FFFFFF", headerSub: "#C3CED4",
    
    },
  },
];

const PALETTE_VAR_KEYS = {
  main: "--main",
  sub: "--sub",
  light: "--light",
  accent: "--accent",
  accentText: "--accent-text",
  bg: "--bg",
  surface: "--surface",
  surfaceMuted: "--surface-muted",
  text: "--text",
  muted: "--muted",
  border: "--border",
  onMain: "--on-main",
  headerSub: "--header-sub",
};


function applyPalette(palette) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(PALETTE_VAR_KEYS)) {
    root.style.setProperty(cssVar, palette.vars[key]);
  }
  // ストライプはパレット本来の4色をそのまま使う
  const stripe = document.querySelectorAll(".palette-stripe > span");
  stripe.forEach((span, i) => {
    if (palette.colors[i]) span.style.background = palette.colors[i];
  });
}

// パレットの4色を 41/26/18/15 の比率で並べたバー（ヘッダーのストライプと同じ形式）を作る
function buildBar(palette) {
  const bar = el("span", "palette-bar");
  bar.setAttribute("aria-hidden", "true");
  for (const color of palette.colors) {
    const seg = document.createElement("span");
    seg.style.background = color;
    bar.appendChild(seg);
  }
  return bar;
}

function initPalette() {
  const button = document.getElementById("palette-button");
  const buttonSwatch = document.getElementById("palette-button-swatch");
  const buttonName = document.getElementById("palette-button-name");
  const menu = document.getElementById("palette-menu");

  function closeMenu() {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }
  function openMenu() {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
  }

  // 選択は sessionStorage に保存し、その訪問中（アプリ内移動）は引き継ぐ
  function selectPalette(index) {
    try { sessionStorage.setItem('appPaletteIndex', String(index)); } catch (e) {}
    const palette = PALETTES[index];
    applyPalette(palette);
    [...buttonSwatch.children].forEach((seg, i) => {
      if (palette.colors[i]) seg.style.background = palette.colors[i];
    });
    buttonName.textContent = palette.name;
    [...menu.children].forEach((item, i) => {
      const selected = i === index;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-selected", String(selected));
    });
  }

  PALETTES.forEach((palette, i) => {
    const item = el("li", "palette-item");
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");
    item.tabIndex = -1;
    const head = el("span", "palette-item-head");
    head.appendChild(el("span", "palette-item-name", palette.name));
    head.appendChild(el("span", "palette-check", "✓"));
    item.appendChild(head);
    item.appendChild(buildBar(palette));
    item.addEventListener("click", () => {
      selectPalette(i);
      closeMenu();
      button.focus();
    });
    menu.appendChild(item);
  });

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });
  // メニュー内のクリックで外側クリック判定にならないようにする
  menu.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      closeMenu();
      button.focus();
    }
  });

  // ランダムに選び直すのはTOP画面のリロードと新規アクセスのときだけ。
  // アプリ内移動では sessionStorage の選択を引き継ぐ（このサイトは単一ページ＝常にTOP画面扱い）
  const navEntry = performance.getEntriesByType('navigation')[0];
  const navType = navEntry ? navEntry.type : 'navigate';
  const fromSameApp = !!document.referrer && document.referrer.startsWith(location.origin);
  let savedPalette = null;
  try { savedPalette = sessionStorage.getItem('appPaletteIndex'); } catch (e) {}
  if (navType === 'reload' || !fromSameApp) savedPalette = null;
  const savedIndex = savedPalette === null ? NaN : parseInt(savedPalette, 10);
  if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < PALETTES.length) {
    selectPalette(savedIndex);
  } else {
    selectPalette(Math.floor(Math.random() * PALETTES.length));
  }
}

let allTools = [];
const collapsedCategories = new Set();

async function fetchTools() {
  try {
    const res = await fetch("/api/tools");
    if (!res.ok) throw new Error("api " + res.status);
    return await res.json();
  } catch (e) {
    // フォールバック: config.json の Supabase REST を直接読む
    const cfgRes = await fetch("config.json");
    const cfg = await cfgRes.json();
    const url =
      cfg.supabase.url +
      "/rest/v1/tech_stack_tools?select=*&order=category.asc,id.asc";
    const res = await fetch(url, {
      headers: {
        apikey: cfg.supabase.key,
        authorization: "Bearer " + cfg.supabase.key,
        accept: "application/json",
      },
    });
    if (!res.ok) throw new Error("supabase " + res.status);
    return await res.json();
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function buildCard(tool) {
  const card = el("article", "card verdict-" + (tool.verdict || "ok"));
  card.dataset.tool = tool.name;

  const head = el("div", "card-head");
  head.appendChild(el("h3", "card-name", tool.name));
  const badge = el(
    "span",
    "badge badge-" + (tool.verdict || "ok"),
    VERDICT_LABELS[tool.verdict] || tool.verdict || ""
  );
  head.appendChild(badge);
  card.appendChild(head);

  const meta = el("div", "card-meta");
  if (tool.license) meta.appendChild(el("span", null, "ライセンス: " + tool.license));
  meta.appendChild(
    el("span", null, "状態: " + (STATUS_LABELS[tool.status] || tool.status || "未判定"))
  );
  card.appendChild(meta);

  if (tool.summary) card.appendChild(el("p", "card-summary", tool.summary));
  if (tool.notes) card.appendChild(el("p", "card-notes", tool.notes));

  if (tool.url) {
    const a = el("a", "card-link", tool.url);
    a.href = tool.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    card.appendChild(a);
  }
  return card;
}

function currentFilters() {
  return {
    q: document.getElementById("search").value.trim().toLowerCase(),
    category: document.getElementById("filter-category").value,
    verdict: document.getElementById("filter-verdict").value,
  };
}

function matches(tool, f) {
  if (f.category && tool.category !== f.category) return false;
  if (f.verdict && tool.verdict !== f.verdict) return false;
  if (f.q) {
    const hay = [tool.name, tool.category, tool.license, tool.summary, tool.notes]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

/* 地方（クラスタ）定義：似た技術の「街」（カテゴリ）を地方ごとにまとめ、
   探検マップでも本文でもこの順に並べる。未分類のカテゴリは最後の地方へ。 */
const CLUSTERS = [
  {
    name: "3D・ビジョン地方",
    categories: [
      "3D再構成・点群",
      "3D生成AI",
      "メッシュ修復・最適化",
      "モデリング・編集",
      "リギング・アニメーション",
      "シーン基盤・デジタルツイン",
      "画像認識・セグメンテーション",
    ],
  },
  {
    name: "ロボット・物理地方",
    categories: [
      "ロボットシミュレーション",
      "ロボット制御・ヒューマノイド",
      "物理エンジン",
      "SLAM・自己位置推定",
      "最適化・経路計画",
      "CAE（流体・熱・構造）",
    ],
  },
  {
    name: "AI・データ地方",
    categories: [
      "ローカルLLM・AI基盤",
      "世界モデル・動画生成",
      "強化学習",
      "アノテーション・推論基盤",
      "OCR・文書AI",
      "音声AI",
    ],
  },
  {
    name: "自動化・開発地方",
    categories: ["RPA・業務自動化", "自動テスト"],
  },
];
const OTHER_CLUSTER = "その他の地方";

function orderedCategories(byCategory) {
  const out = [];
  const used = new Set();
  for (const cluster of CLUSTERS) {
    for (const category of cluster.categories) {
      if (byCategory.has(category)) {
        out.push({ cluster: cluster.name, category, tools: byCategory.get(category) });
        used.add(category);
      }
    }
  }
  for (const [category, tools] of byCategory) {
    if (!used.has(category)) out.push({ cluster: OTHER_CLUSTER, category, tools });
  }
  return out;
}

function render() {
  const f = currentFilters();
  const shown = allTools.filter((t) => matches(t, f));

  const groups = document.getElementById("groups");
  groups.innerHTML = "";

  const byCategory = new Map();
  for (const t of shown) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category).push(t);
  }

  let lastCluster = null;
  for (const { cluster, category, tools } of orderedCategories(byCategory)) {
    if (cluster !== lastCluster) {
      lastCluster = cluster;
      const heading = el("div", "region-heading");
      heading.appendChild(el("span", "region-plate", cluster));
      heading.appendChild(el("span", "region-road"));
      groups.appendChild(heading);
    }
    const section = el("section", "cat-section");
    section.dataset.category = category;
    if (collapsedCategories.has(category)) section.classList.add("collapsed");
    const title = el("h2", "category-title");
    title.appendChild(el("span", "cat-chevron", "▾"));
    title.appendChild(document.createTextNode(category));
    title.appendChild(el("span", "cat-count", tools.length + "件"));
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute(
      "aria-expanded",
      collapsedCategories.has(category) ? "false" : "true"
    );
    const toggle = () => {
      const nowCollapsed = section.classList.toggle("collapsed");
      if (nowCollapsed) collapsedCategories.add(category);
      else collapsedCategories.delete(category);
      title.setAttribute("aria-expanded", nowCollapsed ? "false" : "true");
    };
    title.addEventListener("click", toggle);
    title.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        toggle();
      }
    });
    section.appendChild(title);
    const grid = el("div", "cards");
    for (const t of tools) grid.appendChild(buildCard(t));
    section.appendChild(grid);
    groups.appendChild(section);
  }

  const msg = document.getElementById("status-msg");
  if (shown.length === 0) {
    msg.textContent = "該当するツールがありません。";
    msg.hidden = false;
  } else {
    msg.hidden = true;
  }

  buildToc(byCategory, shown);
}

/* ===== 探検マップ（遊び心のある目次） =====
   カテゴリを「エリア」として並べ、タップでそのエリアへジャンプ。
   スクロールに合わせて現在地のエリアが光る（スクロールスパイ）。
   「おまかせジャンプ」は表示中のツールから1件をランダムに選び、
   コンパスを回しながらそのカードへ飛んで点滅させる。 */
let lastShown = [];
let tocObserver = null;
let compassDeg = 0;

function findSection(category) {
  return document.querySelector(
    '.cat-section[data-category="' + CSS.escape(category) + '"]'
  );
}

function expandCategory(category) {
  if (!collapsedCategories.has(category)) return;
  collapsedCategories.delete(category);
  const section = findSection(category);
  if (section) {
    section.classList.remove("collapsed");
    const title = section.querySelector(".category-title");
    if (title) title.setAttribute("aria-expanded", "true");
  }
}

function jumpToCategory(category) {
  expandCategory(category);
  const section = findSection(category);
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildToc(byCategory, shown) {
  lastShown = shown;
  const nav = document.getElementById("toc");
  const chips = document.getElementById("toc-chips");
  const sub = document.getElementById("toc-sub");
  if (!nav || !chips) return;
  nav.hidden = shown.length === 0;
  chips.innerHTML = "";

  const ordered = orderedCategories(byCategory);
  const clusterCount = new Set(ordered.map((o) => o.cluster)).size;
  sub.textContent =
    "全" + clusterCount + "地方・" + ordered.length + "の街・" + shown.length + "ツール";

  const chipByCategory = new Map();
  let lastCluster = null;
  let stop = 0;
  for (const { cluster, category, tools } of ordered) {
    if (cluster !== lastCluster) {
      lastCluster = cluster;
      const label = el("div", "toc-region-label");
      if (chipByCategory.size === 0 && stop === 0) label.classList.add("is-first");
      label.appendChild(el("span", "toc-region-label-text", cluster));
      chips.appendChild(label);
    }
    stop += 1;
    const chip = el("button", "toc-chip");
    chip.type = "button";
    chip.appendChild(el("span", "toc-stop", String(stop)));
    chip.appendChild(el("span", "toc-chip-name", category));
    chip.appendChild(el("span", "toc-chip-count", String(tools.length)));
    chip.addEventListener("click", () => jumpToCategory(category));
    chips.appendChild(chip);
    chipByCategory.set(category, chip);
  }

  // 街と街を結ぶ道（SVG）をチップの背後に敷く
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "toc-road";
  svg.setAttribute("aria-hidden", "true");
  chips.prepend(svg);
  requestAnimationFrame(drawRoad);

  if (tocObserver) tocObserver.disconnect();
  tocObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const cat = entry.target.dataset.category;
        for (const [c, chip] of chipByCategory) {
          chip.classList.toggle("is-here", c === cat);
        }
      }
    },
    { rootMargin: "-15% 0px -70% 0px" }
  );
  document
    .querySelectorAll(".cat-section[data-category]")
    .forEach((s) => tocObserver.observe(s));
}

/* 街（チップ）の中心を順番に結んで、道を描く */
function drawRoad() {
  const wrap = document.getElementById("toc-chips");
  const svg = document.getElementById("toc-road");
  if (!wrap || !svg) return;
  const chipEls = [...wrap.querySelectorAll(".toc-chip")];
  if (chipEls.length < 2) {
    svg.innerHTML = "";
    return;
  }
  const wr = wrap.getBoundingClientRect();
  const pts = chipEls.map((ch) => {
    const r = ch.getBoundingClientRect();
    return [r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2];
  });
  const d = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  svg.setAttribute("viewBox", "0 0 " + wrap.offsetWidth + " " + wrap.offsetHeight);
  svg.innerHTML =
    '<path class="road-base" d="' + d + '"/><path class="road-line" d="' + d + '"/>';
}

function initToc() {
  const dice = document.getElementById("toc-dice");
  const hit = document.getElementById("toc-hit");
  const compass = document.getElementById("toc-compass");
  if (!dice) return;
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawRoad, 150);
  });
  dice.addEventListener("click", () => {
    if (lastShown.length === 0) return;
    const tool = lastShown[Math.floor(Math.random() * lastShown.length)];
    compassDeg += 360 + Math.floor(Math.random() * 360);
    if (compass) compass.style.transform = "rotate(" + compassDeg + "deg)";
    expandCategory(tool.category);
    const card = document.querySelector(
      '.card[data-tool="' + CSS.escape(tool.name) + '"]'
    );
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.remove("toc-flash");
      void card.offsetWidth;
      card.classList.add("toc-flash");
      setTimeout(() => card.classList.remove("toc-flash"), 2000);
    }
    if (hit) {
      hit.textContent =
        "「" + tool.name + "」（" + tool.category + "）に着陸！";
      hit.hidden = false;
    }
  });
}

function initSummary() {
  document.getElementById("count-total").textContent = allTools.length;
  document.getElementById("count-categories").textContent = new Set(
    allTools.map((t) => t.category)
  ).size;

  const catSelect = document.getElementById("filter-category");
  const categories = [...new Set(allTools.map((t) => t.category))];
  for (const c of categories) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  }
}

async function init() {
  const msg = document.getElementById("status-msg");
  try {
    allTools = await fetchTools();
  } catch (e) {
    msg.textContent = "データの取得に失敗しました。";
    msg.hidden = false;
    return;
  }
  initSummary();
  render();
  initToc();

  document.getElementById("search").addEventListener("input", render);
  document.getElementById("filter-category").addEventListener("change", render);
  document.getElementById("filter-verdict").addEventListener("change", render);
}

initPalette();
init();
