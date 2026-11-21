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

init();
