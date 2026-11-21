// 技術スタック — /api/tools から取得し、失敗時は Supabase REST へ直接フォールバック

const VERDICT_LABELS = {
  ok: "商用OK",
  caution: "要確認",
  excluded: "対象外",
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

function initPalette() {
  const select = document.getElementById("palette-select");
  PALETTES.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  // アクセスごとにランダムで1つ選ぶ（前回の選択は保存・復元しない）
  const initial = Math.floor(Math.random() * PALETTES.length);
  select.value = String(initial);
  applyPalette(PALETTES[initial]);
  // プルダウンで選んだ場合はその訪問中だけ即時反映する
  select.addEventListener("change", () => {
    applyPalette(PALETTES[Number(select.value)]);
  });
}

let allTools = [];

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

function render() {
  const f = currentFilters();
  const shown = allTools.filter((t) => matches(t, f));

  document.getElementById("count-shown").textContent = shown.length;

  const groups = document.getElementById("groups");
  groups.innerHTML = "";

  const byCategory = new Map();
  for (const t of shown) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category).push(t);
  }

  for (const [category, tools] of byCategory) {
    const section = el("section");
    const title = el("h2", "category-title", category);
    title.appendChild(el("span", "cat-count", tools.length + "件"));
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
}

function initSummary() {
  document.getElementById("count-total").textContent = allTools.length;
  document.getElementById("count-ok").textContent = allTools.filter(
    (t) => t.verdict === "ok"
  ).length;
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

  document.getElementById("search").addEventListener("input", render);
  document.getElementById("filter-category").addEventListener("change", render);
  document.getElementById("filter-verdict").addEventListener("change", render);
}

initPalette();
init();
