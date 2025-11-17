const state = { lang: "zh", locale: null, investors: [], yearRange: { min: null, max: null, globalMin: null, globalMax: null }, tags: [], filterTags: new Set(), search: "", sort: "default", detailsOpen: {}, theme: "light", selectedGroups: new Set() };

function detectLang() {
  const map = { zh: "zh", "zh-CN": "zh", "zh-TW": "zh", en: "en", "en-US": "en", es: "es", "es-ES": "es", fr: "fr", "fr-FR": "fr" };
  const getCookie = name => {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  };
  const candidates = [getCookie("lang"), getCookie("locale"), getCookie("language"), getCookie("i18n_lang")].filter(Boolean);
  for (let i = 0; i < candidates.length; i++) {
    const v = candidates[i];
    const key = Object.keys(map).find(k => v.toLowerCase().startsWith(k.toLowerCase()));
    if (key) return map[key];
  }
  const nav = navigator.language || "zh";
  const key = Object.keys(map).find(k => nav.startsWith(k));
  return map[key] || "zh";
}

async function fetchLocale(lang) {
  const res = await fetch(`/api/locales/${lang}`);
  if (!res.ok) return null;
  return res.json();
}

const EMBED = [
  {
    id: "buffett",
    name: "Warren Buffett",
    summary: "Value investing icon, long-term owner of quality businesses.",
    theory: "Intrinsic value and margin of safety.",
    strategy: "Concentrate in high-certainty firms.",
    wins: "Berkshire’s long-term outperformance.",
    timeline: [ { year: 1965, text: "Took control of Berkshire" }, { year: 1988, text: "Coca-Cola investment" }, { year: 2016, text: "Apple core holding" } ],
    tags: ["value"]
  },
  {
    id: "soros",
    name: "George Soros",
    summary: "Macro hedge fund titan, originator of reflexivity theory.",
    theory: "Perception–reality co-influence; errors can self-reinforce.",
    strategy: "Macro themes; flexible sizing.",
    wins: "1992 GBP short earning ~$1B.",
    timeline: [ { year: 1973, text: "Founded Quantum" }, { year: 1992, text: "Black Wednesday short" } ],
    tags: ["macro", "discretionary"]
  },
  {
    id: "simons",
    name: "Jim Simons",
    summary: "Quant pioneer; founder of Renaissance Technologies.",
    theory: "Small inefficiencies capturable via models.",
    strategy: "Multi-factor, HF; rigorous execution.",
    wins: "Medallion’s extraordinary net returns.",
    timeline: [ { year: 1982, text: "Founded Renaissance" }, { year: 1994, text: "Medallion established" } ],
    tags: ["quant"]
  },
  {
    id: "lynch",
    name: "Peter Lynch",
    summary: "GARP philosophy; ordinary investors can beat the market.",
    theory: "Invest in what you know; hunt for tenbaggers.",
    strategy: "Bottom-up; dynamic fundamentals tracking.",
    wins: "~29% annual during Magellan tenure.",
    timeline: [ { year: 1977, text: "Took over Magellan" }, { year: 1990, text: "One Up on Wall Street" } ],
    tags: ["value", "growth"]
  }
];

async function fetchInvestors(lang) {
  const tryLangs = [lang, 'zh', 'en'];
  for (let i = 0; i < tryLangs.length; i++) {
    const l = tryLangs[i];
    try {
      const res = await fetch(`/api/investors?lang=${l}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
      }
    } catch {}
  }
  try {
    const resRaw = await fetch(`/api/investors?lang=${lang}&raw=1`);
    if (resRaw.ok) {
      const rawList = await resRaw.json();
      if (Array.isArray(rawList) && rawList.length) {
        const order = [lang, 'en', 'zh', 'es', 'fr'];
        const pick = obj => {
          if (!obj || typeof obj !== 'object') return obj || '';
          for (const k of order) { if (obj[k]) return obj[k]; }
          const ks = Object.keys(obj); return obj[ks[0]];
        };
        return rawList.map(i => ({
          id: i.id,
          name: pick(i.name),
          summary: pick(i.summary),
          theory: pick(i.theory),
          strategy: pick(i.strategy),
          wins: pick(i.wins),
          timeline: (i.timeline || []).map(ev => ({ year: ev.year, text: pick(ev.text) })),
          tags: i.tags || [],
          works: pick(i.works) || [],
          quotes: pick(i.quotes) || [],
          lessons: pick(i.lessons) || [],
          links: pick(i.links) || [],
          cases: pick(i.cases) || []
        }));
      }
    }
  } catch {}
  return EMBED;
}

function render() {
  const t = state.locale || {};
  try { document.documentElement.lang = state.lang || "zh"; } catch {}
  const title = document.getElementById("title");
  const label = document.getElementById("lang-label");
  title.textContent = t.title || "World-Famous Investors Timeline";
  label.textContent = t.language || "Language";
  if (t.title) { document.title = t.title; }
  const metaDesc = document.getElementById("meta-description");
  if (metaDesc) {
    const descMap = {
      zh: "世界知名投资人时间线，支持风格分组、多语言与年份范围筛选",
      en: "Global investors timeline with style groups, multilingual and year range filters",
      es: "Cronología de inversores con grupos de estilo, multilingüe y filtros de años",
      fr: "Chronologie des investisseurs avec groupes de style, multilingue et filtres d'années"
    };
    metaDesc.setAttribute("content", (t.seo_description || descMap[state.lang] || metaDesc.getAttribute("content") || ""));
  }
  const metaKw = document.getElementById("meta-keywords");
  if (metaKw) {
    const baseKw = {
      zh: [
        "投资人","世界知名","时间线","风格","价值投资","宏观","量化","CTA","趋势","风险平价","事件驱动","并购套利","债券","指数","成长","主题",
        "巴菲特","索罗斯","西蒙斯","林奇","格雷厄姆","芒格","博格尔","德鲁肯米勒","达利欧","格里芬","阿克曼","伯里","保尔森","马克思","格林布拉特","费雪","斯文森","罗杰斯","利弗莫尔","邓普顿","约翰·内夫","沃尔特·施洛斯","菲利普·卡雷特","李录","伊坎","泰珀","卡拉曼","比尔·格罗斯","埃德·塞科塔","理查德·丹尼斯","比尔·丹恩","大卫·哈丁","路易斯·培根","布鲁斯·科夫纳","杰弗里·冈拉克","AQR","Two Sigma","D. E. Shaw","Man AHL","文艺复兴科技","Winton","Dunn Capital"
      ],
      en: [
        "investors","world-famous","timeline","styles","value investing","macro","quant","CTA","trend","risk parity","event-driven","merger arbitrage","bonds","index","growth","thematic",
        "Warren Buffett","George Soros","Jim Simons","Peter Lynch","Benjamin Graham","Charlie Munger","John Bogle","Stanley Druckenmiller","Ray Dalio","Ken Griffin","Bill Ackman","Michael Burry","John Paulson","Howard Marks","Joel Greenblatt","Philip Fisher","David Swensen","Jim Rogers","Jesse Livermore","John Templeton","John Neff","Walter Schloss","Philip Carret","Li Lu","Carl Icahn","David Tepper","Seth Klarman","Bill Gross","Ed Seykota","Richard Dennis","Bill Dunn","David Harding","Louis Bacon","Bruce Kovner","Jeffrey Gundlach","AQR","Two Sigma","D. E. Shaw","Man AHL","Renaissance Technologies","Winton","Dunn Capital"
      ],
      es: ["inversores","cronología","estilos","inversión de valor","macro","cuantitativo","CTA","tendencia","paridad de riesgo","eventos","arbitraje de fusiones","bonos","índice","crecimiento","temático"],
      fr: ["investisseurs","chronologie","styles","investissement de valeur","macro","quant","CTA","tendance","parité de risque","événementiel","arbitrage de fusion","obligations","indice","croissance","thématique"]
    };
    const names = (state.investors || []).map(i => i.name).filter(Boolean);
    const tagSetAll = new Set();
    (state.investors || []).forEach(i => (i.tags || []).forEach(s => tagSetAll.add(s)));
    const tagLabels = Array.from(tagSetAll).map(k => (state.locale && state.locale.tags && state.locale.tags[k]) || k);
    const groupLabels = state.locale && state.locale.groups ? Object.keys(state.locale.groups).map(k => state.locale.groups[k]).filter(Boolean) : [];
    const kw = [].concat(baseKw[state.lang] || [], names, tagLabels, groupLabels).map(s => String(s)).filter(Boolean);
    const seen = new Set();
    const uniq = kw.filter(s => { const key = s.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 50);
    metaKw.setAttribute("content", uniq.join(", "));
  }
  const canonical = document.getElementById("canonical");
  const ogTitle = document.getElementById("og-title");
  const ogDesc = document.getElementById("og-description");
  const ogUrl = document.getElementById("og-url");
  const twTitle = document.getElementById("tw-title");
  const twDesc = document.getElementById("tw-description");
  const abs = (() => {
    try {
      const base = `${location.origin}${location.pathname}`;
      const url = new URL(base);
      url.search = state.lang ? `?lang=${state.lang}` : "";
      return url.toString();
    } catch { return "/"; }
  })();
  if (canonical) canonical.setAttribute("href", abs);
  if (ogUrl) ogUrl.setAttribute("content", abs);
  const ogLocaleEl = document.getElementById("og-locale");
  if (ogLocaleEl) {
    const locMap = { zh: "zh_CN", en: "en_US", es: "es_ES", fr: "fr_FR" };
    ogLocaleEl.setAttribute("content", locMap[state.lang] || "zh_CN");
  }
  const tt = t.title || document.title || "World-Famous Investors Timeline";
  const td = (t.seo_description || (metaDesc ? metaDesc.getAttribute("content") : "")) || "";
  if (ogTitle) ogTitle.setAttribute("content", tt);
  if (ogDesc) ogDesc.setAttribute("content", td);
  if (twTitle) twTitle.setAttribute("content", tt);
  if (twDesc) twDesc.setAttribute("content", td);
  const sd = document.getElementById("structured-data");
  if (sd) {
    try {
      const obj = JSON.parse(sd.textContent || "{}");
      obj.name = t.title || obj.name || "World-Famous Investors Timeline";
      obj.url = abs;
      obj.potentialAction = obj.potentialAction || { "@type": "SearchAction", target: "/?q={search_term_string}", "query-input": "required name=search_term_string" };
      sd.textContent = JSON.stringify(obj);
    } catch {}
  }
  const sdPage = document.getElementById("structured-page");
  if (sdPage) {
    try {
      const obj2 = JSON.parse(sdPage.textContent || "{}");
      obj2.name = t.title || obj2.name || "World-Famous Investors Timeline";
      obj2.url = abs;
      const kwNow = metaKw ? metaKw.getAttribute("content") || "" : "";
      obj2.keywords = kwNow;
      sdPage.textContent = JSON.stringify(obj2);
    } catch {}
  }
  const themeLabel = document.getElementById("theme-label");
  if (themeLabel) {
    const themeMap = { zh: "主题", en: "Theme", es: "Tema", fr: "Thème" };
    themeLabel.textContent = t.theme || themeMap[state.lang] || "Theme";
  }
  const yearsLabel = document.getElementById("years-label");
  if (yearsLabel) yearsLabel.textContent = t.filter_years || "Year Range";
  const stylesLabel = document.getElementById("styles-label");
  if (stylesLabel) stylesLabel.textContent = t.filter_styles || "Styles";
  const groupsLabel = document.getElementById("groups-label");
  if (groupsLabel) groupsLabel.textContent = t.filter_groups || "Style Groups";
  
  const searchLabel = document.getElementById("search-label");
  if (searchLabel) searchLabel.textContent = t.search || "Search";
  const sortLabel = document.getElementById("sort-label");
  if (sortLabel) sortLabel.textContent = t.sort || "Sort";
  const sortSel = document.getElementById("sort");
  const themeSel = document.getElementById("theme");
  const resetBtn = document.getElementById("reset-btn");
  if (sortSel) {
    const defaultMap = { zh: "默认", en: "Default", es: "Predeterminado", fr: "Par défaut" };
    const opts = {
      default: t.sort_default || t.default || defaultMap[state.lang] || "Default",
      name: t.sort_name || "By Name",
      year: t.sort_year || "By First Event Year"
    };
    Array.from(sortSel.options).forEach(o => { if (opts[o.value]) o.textContent = opts[o.value]; });
    sortSel.value = state.sort;
  }
  if (themeSel) {
    const map = { dark: (t.theme_dark || "Dark"), light: (t.theme_light || "Light") };
    Array.from(themeSel.options).forEach(o => { if (map[o.value]) o.textContent = map[o.value]; });
    themeSel.value = state.theme || "dark";
    document.body.dataset.theme = state.theme || "dark";
    try { document.cookie = `theme=${state.theme || "dark"}; path=/; max-age=${60*60*24*365}`; } catch {}
  }
  if (resetBtn) {
    resetBtn.textContent = (t.reset || "Reset Filters");
  }
  const searchInputTop = document.getElementById("search");
  if (searchInputTop) {
    const phMap = { zh: "搜索", en: "Search", es: "Buscar", fr: "Rechercher" };
    searchInputTop.placeholder = t.search_placeholder || t.search || phMap[state.lang] || "Search";
  }
  const minDisp = document.getElementById("year-min-display");
  const maxDisp = document.getElementById("year-max-display");
  if (state.yearRange.min != null && minDisp) minDisp.textContent = String(state.yearRange.min);
  if (state.yearRange.max != null && maxDisp) maxDisp.textContent = String(state.yearRange.max);
  const minInput = document.getElementById("year-min");
  const maxInput = document.getElementById("year-max");
  const baseMin = state.yearRange.globalMin ?? 1907;
  const baseMax = state.yearRange.globalMax ?? new Date().getFullYear();
  if (minInput && maxInput) {
    let minVal = parseInt(minInput.value || "", 10);
    let maxVal = parseInt(maxInput.value || "", 10);
    if (isNaN(minVal)) minVal = state.yearRange.min ?? baseMin;
    if (isNaN(maxVal)) maxVal = state.yearRange.max ?? baseMax;
    minVal = Math.max(baseMin, Math.min(minVal, baseMax));
    maxVal = Math.max(baseMin, Math.min(maxVal, baseMax));
    if (minVal > maxVal) { minVal = baseMin; maxVal = baseMax; }
    minInput.min = String(baseMin);
    minInput.max = String(baseMax);
    maxInput.min = String(baseMin);
    maxInput.max = String(baseMax);
    minInput.step = "1";
    maxInput.step = "1";
    minInput.value = String(minVal);
    maxInput.value = String(maxVal);
    if (minDisp) minDisp.textContent = String(minVal);
    if (maxDisp) maxDisp.textContent = String(maxVal);
    state.yearRange.min = minVal;
    state.yearRange.max = maxVal;
  }
  const content = document.getElementById("content");
  content.innerHTML = "";
  if (!state.investors.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = t.empty || "No data";
    content.appendChild(empty);
    return;
  }
  const list = document.createElement("div");
  list.className = "timeline";
  const span = (state.yearRange.max ?? 0) - (state.yearRange.min ?? 0);
  const passText = txt => {
    if (!state.search) return true;
    const q = state.search.toLowerCase();
    return (txt || "").toLowerCase().includes(q);
  };
  let filteredInvestors = state.investors.filter(inv => {
    const tagsOk = state.filterTags.size === 0 || (inv.tags || []).some(tag => state.filterTags.has(tag));
    const textOk = passText(inv.name) || passText(inv.summary) || passText(inv.theory) || passText(inv.strategy) || passText(inv.wins);
    return tagsOk && textOk;
  });
  const firstYear = inv => Math.min(...(inv.timeline || []).map(e => e.year).filter(n => typeof n === "number"));
  if (state.sort === "name") filteredInvestors.sort((a,b) => a.name.localeCompare(b.name));
  else if (state.sort === "year") filteredInvestors.sort((a,b) => (firstYear(a)||Infinity) - (firstYear(b)||Infinity));
  if (!filteredInvestors.length) filteredInvestors = state.investors.slice();
  filteredInvestors = filteredInvestors.filter(inv => {
    const allYears = (inv.timeline || []).map(ev => ev.year);
    const within = allYears.some(y => y >= state.yearRange.min && y <= state.yearRange.max);
    return within || allYears.length === 0;
  });
  if (!filteredInvestors.length) {
    filteredInvestors = state.investors.slice();
  }
  filteredInvestors.forEach(inv => {
    const card = document.createElement("section");
    card.className = "card";
    const h = document.createElement("h2");
    h.textContent = inv.name;
    const view = document.createElement("a");
    view.href = `/investors/${inv.id}?lang=${state.lang}&theme=${state.theme}`;
    view.className = "chip";
    view.textContent = (t.view_page || (state.lang === 'zh' ? '查看详情页' : 'View Page'));
    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = inv.summary;
    const meta = document.createElement("div");
    meta.className = "meta";
    const tagsBox = document.createElement("div");
    tagsBox.className = "tags";
    (inv.tags || []).forEach(tag => {
      const badge = document.createElement("span");
      badge.className = "tag";
      const label = (state.locale && state.locale.tags && state.locale.tags[tag]) || tag;
      badge.textContent = label;
      tagsBox.appendChild(badge);
    });
    const theory = document.createElement("div");
    theory.innerHTML = `<strong>${t.theory || "Investment Theory"}</strong>: ${inv.theory}`;
    const strategy = document.createElement("div");
    strategy.innerHTML = `<strong>${t.strategy || "Investment Strategy"}</strong>: ${inv.strategy}`;
    const wins = document.createElement("div");
    wins.innerHTML = `<strong>${t.wins || "Notable Wins"}</strong>: ${inv.wins}`;
    meta.appendChild(tagsBox);
    meta.appendChild(theory);
    meta.appendChild(strategy);
    meta.appendChild(wins);
    const all = (inv.timeline || []).slice().sort((a, b) => a.year - b.year);
    const filtered = (inv.timeline || []).filter(ev => {
      if (state.yearRange.min == null || state.yearRange.max == null) return true;
      return ev.year >= state.yearRange.min && ev.year <= state.yearRange.max;
    }).sort((a, b) => a.year - b.year);
    const axis = document.createElement("div");
    axis.className = "axis";
    const axisLine = document.createElement("div");
    axisLine.className = "axis-line";
    const axisTicks = document.createElement("div");
    axisTicks.className = "axis-ticks";
    const axisMarkers = document.createElement("div");
    axisMarkers.className = "axis-markers";
    const minY = state.yearRange.min ?? (filtered.length ? filtered[0].year : (all[0] ? all[0].year : 0));
    const maxY = state.yearRange.max ?? (filtered.length ? filtered[filtered.length - 1].year : (all.length ? all[all.length - 1].year : minY));
    const total = Math.max(1, (maxY - minY));
    const candidates = [1, 2, 5, 10, 20, 25, 50, 100];
    const maxLabels = 8;
    let interval = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const count = Math.floor(total / c) + 1;
      if (count <= maxLabels) { interval = c; break; }
    }
    const minorInterval = interval >= 50 ? 10 : interval >= 25 ? 5 : interval >= 10 ? 2 : interval >= 5 ? 1 : 0;
    for (let y = minY; y <= maxY; y += interval) {
      const pct = ((y - minY) / total) * 100;
      const tick = document.createElement("span");
      tick.className = "tick";
      tick.style.left = pct + "%";
      tick.textContent = String(y);
      axisTicks.appendChild(tick);
    }
    if (minorInterval) {
      for (let y = minY; y <= maxY; y += minorInterval) {
        if ((y - minY) % interval === 0) continue;
        const pct = ((y - minY) / total) * 100;
        const st = document.createElement("span");
        st.className = "subtick";
        st.style.left = pct + "%";
        axisTicks.appendChild(st);
      }
    }
    filtered.forEach(ev => {
      const pct = total === 0 ? 50 : ((ev.year - minY) / total) * 100;
      const mark = document.createElement("span");
      mark.className = "marker";
      mark.style.left = pct + "%";
      mark.title = String(ev.year);
      mark.setAttribute("role", "img");
      mark.setAttribute("aria-label", `${inv.name} ${ev.year}`);
      axisMarkers.appendChild(mark);
    });
    axis.appendChild(axisLine);
    axis.appendChild(axisTicks);
    axis.appendChild(axisMarkers);
    const tlTitle = document.createElement("h3");
    tlTitle.textContent = t.timeline || "Timeline";
    const tl = document.createElement("ul");
    tl.className = "events";
    const showEvents = (filtered.length ? filtered : all).slice(0, Math.min((filtered.length ? filtered : all).length, 3));
    showEvents.forEach(ev => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="year">${ev.year}</span><span class="text">${ev.text}</span>`;
      tl.appendChild(li);
    });
    card.appendChild(h);
    card.appendChild(view);
    card.appendChild(summary);
    card.appendChild(meta);
    card.appendChild(axis);
    card.appendChild(tlTitle);
    card.appendChild(tl);
    list.appendChild(card);
  });
  content.appendChild(list);
}

async function load(lang) {
  state.lang = lang;
  state.locale = await fetchLocale(lang);
  state.investors = await fetchInvestors(lang);
  const regionMap = {
    wyckoff: "us", livermore: "us", buffett: "us", lynch: "us", soros: "global", simons: "us", rogers: "global", ackman: "us", burry: "us", wood: "us",
    griffin: "us", dalio: "us", ptj: "us", druckenmiller: "us", graham: "us", templeton: "global", munger: "us", bogle: "us", tepper: "us", klarman: "us", icahn: "us", gross: "us"
  };
  state.investors.forEach(i => { if (!i.region) i.region = regionMap[i.id] || "global"; });
  const tagSet = new Set();
  state.investors.forEach(i => (i.tags || []).forEach(t => tagSet.add(t)));
  state.tags = Array.from(tagSet).sort();
  const stylesEl = document.getElementById("styles");
  if (stylesEl) {
    stylesEl.innerHTML = "";
    state.tags.forEach(tag => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      const label = (state.locale && state.locale.tags && state.locale.tags[tag]) || tag;
      chip.textContent = label;
      chip.dataset.tag = tag;
      if (state.filterTags.has(tag)) chip.classList.add("active");
      chip.addEventListener("click", () => {
        if (state.filterTags.has(tag)) state.filterTags.delete(tag);
        else state.filterTags.add(tag);
        chip.classList.toggle("active");
        render();
        updateQuery();
      });
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      stylesEl.appendChild(chip);
    });
  }
  const groupsEl = document.getElementById("groups");
  if (groupsEl) {
    groupsEl.innerHTML = "";
    const groups = {
      all: [],
      value: ["value"],
      macro: ["macro"],
      quant: ["quant"],
      activist: ["activist"],
      index: ["index", "passive"],
      theme: ["theme", "growth", "commodities"],
      bond: ["bond", "fixed-income"],
      commodities: ["commodities"],
      trend: ["trend"],
      event: ["event"],
      arb: ["arbitrage"],
      endowment: ["endowment"],
      special: ["special"],
      qualitative: ["discretionary"],
      cta: ["cta"],
      risk_parity: ["risk-parity"]
    };
    const recomputeFilterFromSelected = () => {
      if (!state.selectedGroups || state.selectedGroups.size === 0) { state.filterTags = new Set(); return; }
      const union = new Set();
      state.selectedGroups.forEach(k => {
        const arr = groups[k] || [];
        arr.forEach(t => union.add(t));
      });
      state.filterTags = union;
    };
    Object.keys(groups).forEach(key => {
      const chip = document.createElement("button"); chip.type = "button"; chip.className = "chip"; chip.dataset.group = key;
      const label = (state.locale && state.locale.groups && state.locale.groups[key]) || key;
      chip.textContent = label;
      if ((key === "all" && state.selectedGroups.size === 0 && state.filterTags.size === 0) || state.selectedGroups.has(key)) chip.classList.add("active");
      chip.addEventListener("click", () => {
        if (key === "all") {
          state.selectedGroups = new Set();
          state.filterTags = new Set();
          const allChip = groupsEl.querySelector('[data-group="all"]');
          groupsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          if (allChip) allChip.classList.add('active');
        } else {
          const has = state.selectedGroups.has(key);
          if (has) state.selectedGroups.delete(key); else state.selectedGroups.add(key);
          recomputeFilterFromSelected();
          chip.classList.toggle('active', state.selectedGroups.has(key));
          const allChip = groupsEl.querySelector('[data-group="all"]');
          if (allChip) {
            if (state.selectedGroups.size === 0 && state.filterTags.size === 0) allChip.classList.add('active');
            else allChip.classList.remove('active');
          }
        }
        render(); updateQuery();
      });
      chip.setAttribute("role", "button"); chip.setAttribute("tabindex", "0");
      groupsEl.appendChild(chip);
    });
  }
  
  const years = [];
  state.investors.forEach(i => (i.timeline || []).forEach(ev => years.push(ev.year)));
  if (years.length) {
    const gmin = 1907;
    const gmax = new Date().getFullYear();
    state.yearRange.globalMin = gmin;
    state.yearRange.globalMax = gmax;
    if (state.yearRange.min == null || state.yearRange.max == null) {
      state.yearRange.min = gmin;
      state.yearRange.max = gmax;
    } else {
      state.yearRange.min = Math.max(gmin, Math.min(state.yearRange.min, gmax));
      state.yearRange.max = Math.max(gmin, Math.min(state.yearRange.max, gmax));
      if (state.yearRange.min > state.yearRange.max) state.yearRange.min = gmin;
    }
    const minInput = document.getElementById("year-min");
    const maxInput = document.getElementById("year-max");
    if (minInput && maxInput) {
      minInput.min = String(gmin);
      minInput.max = String(gmax);
      maxInput.min = String(gmin);
      maxInput.max = String(gmax);
      minInput.value = String(state.yearRange.min);
      maxInput.value = String(state.yearRange.max);
      const minDisp = document.getElementById("year-min-display");
      const maxDisp = document.getElementById("year-max-display");
      if (minDisp) minDisp.textContent = String(state.yearRange.min);
      if (maxDisp) maxDisp.textContent = String(state.yearRange.max);
      const overlay = document.getElementById("year-ticks");
      if (overlay) { overlay.innerHTML = ""; overlay.classList.remove("visible"); }
      updateQuery();
    }
  }
  render();
}

window.addEventListener("DOMContentLoaded", async () => {
  parseQuery();
  const sel = document.getElementById("lang");
  const initLang = state.lang || detectLang();
  sel.value = initLang;
  await load(initLang);
  sel.addEventListener("change", async e => {
    await load(e.target.value);
    state.lang = e.target.value;
    updateQuery();
  });
  const minInput = document.getElementById("year-min");
  const maxInput = document.getElementById("year-max");
  const searchInput = document.getElementById("search");
  const sortSel = document.getElementById("sort");
  const themeSel2 = document.getElementById("theme");
  const resetBtn2 = document.getElementById("reset-btn");
  if (minInput && maxInput) {
    const renderOverlay = () => {
      const overlay = document.getElementById("year-ticks");
      if (!overlay) return;
      const gmin = state.yearRange.globalMin, gmax = state.yearRange.globalMax;
      if (gmin == null || gmax == null) return;
      overlay.innerHTML = "";
      const total = Math.max(1, gmax - gmin);
      const startLbl = document.createElement("span");
      startLbl.className = "tick-lbl";
      startLbl.style.left = "0%";
      startLbl.textContent = String(gmin);
      const endLbl = document.createElement("span");
      endLbl.className = "tick-lbl";
      endLbl.style.left = "100%";
      endLbl.textContent = String(gmax);
      overlay.appendChild(startLbl);
      overlay.appendChild(endLbl);
      overlay.classList.add("visible");
    };
    const hideOverlay = () => {
      const overlay = document.getElementById("year-ticks");
      if (!overlay) return;
      overlay.classList.remove("visible");
      overlay.innerHTML = "";
    };
    const update = () => {
      let min = parseInt(minInput.value, 10);
      let max = parseInt(maxInput.value, 10);
      const gmin = state.yearRange.globalMin ?? 1907;
      const gmax = state.yearRange.globalMax ?? new Date().getFullYear();
      if (isNaN(min)) min = gmin;
      if (isNaN(max)) max = gmax;
      min = Math.max(gmin, Math.min(min, gmax));
      max = Math.max(gmin, Math.min(max, gmax));
      if (min > max) {
        if (event && event.target === minInput) max = min;
        else min = max;
      }
      minInput.value = String(min);
      maxInput.value = String(max);
      state.yearRange.min = min;
      state.yearRange.max = max;
      const minDispNow = document.getElementById("year-min-display");
      const maxDispNow = document.getElementById("year-max-display");
      if (minDispNow) minDispNow.textContent = String(state.yearRange.min);
      if (maxDispNow) maxDispNow.textContent = String(state.yearRange.max);
      render();
      updateQuery();
      renderOverlay();
    };
    minInput.addEventListener("input", update);
    maxInput.addEventListener("input", update);
    [minInput, maxInput].forEach(el => {
      el.addEventListener("change", hideOverlay);
      el.addEventListener("mouseup", hideOverlay);
      el.addEventListener("touchend", hideOverlay);
      el.addEventListener("blur", hideOverlay);
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      state.search = e.target.value || "";
      render();
      updateQuery();
    });
    searchInput.value = state.search;
  }
  if (sortSel) {
    sortSel.addEventListener("change", e => {
      state.sort = e.target.value;
      render();
      updateQuery();
    });
    sortSel.value = state.sort;
  }
  if (themeSel2) {
    themeSel2.addEventListener("change", e => {
      state.theme = e.target.value;
      document.body.dataset.theme = state.theme || "dark";
      try { document.cookie = `theme=${state.theme}; path=/; max-age=${60*60*24*365}`; } catch {}
      render();
      updateQuery();
    });
    document.body.dataset.theme = state.theme || "dark";
  }
  if (resetBtn2) {
    resetBtn2.addEventListener("click", () => {
      state.filterTags = new Set();
      state.selectedGroups = new Set();
      state.filterRegions = new Set();
      state.search = "";
      state.sort = "default";
      const baseMin = state.yearRange.globalMin ?? 1907;
      const baseMax = state.yearRange.globalMax ?? new Date().getFullYear();
      state.yearRange.min = baseMin;
      state.yearRange.max = baseMax;
      const minInput = document.getElementById("year-min");
      const maxInput = document.getElementById("year-max");
      const minDisp = document.getElementById("year-min-display");
      const maxDisp = document.getElementById("year-max-display");
      if (minInput && maxInput) {
        minInput.value = String(baseMin);
        maxInput.value = String(baseMax);
      }
      if (minDisp) minDisp.textContent = String(baseMin);
      if (maxDisp) maxDisp.textContent = String(baseMax);
      render();
      updateQuery();
    });
  }
  const stylesEl = document.getElementById("styles");
  
  if (stylesEl) {
    stylesEl.addEventListener("keydown", e => {
      const btn = e.target;
      if (btn.classList && btn.classList.contains("chip") && (e.key === "Enter" || e.key === " ")) {
        btn.click();
      }
    });
  }
  
});
function parseQuery() {
  const p = new URLSearchParams(location.search);
  const lang = p.get("lang");
  const min = p.get("min");
  const max = p.get("max");
  const tags = p.get("tags");
  const groupsParam = p.get("groups");
  const q = p.get("q");
  const sort = p.get("sort");
  
  const theme = p.get("theme");
  if (lang) state.lang = lang;
  if (min) state.yearRange.min = parseInt(min, 10);
  if (max) state.yearRange.max = parseInt(max, 10);
  const baseMin = 1907;
  const baseMax = new Date().getFullYear();
  if (state.yearRange.min != null) state.yearRange.min = Math.max(baseMin, Math.min(state.yearRange.min, baseMax));
  if (state.yearRange.max != null) state.yearRange.max = Math.max(baseMin, Math.min(state.yearRange.max, baseMax));
  if (state.yearRange.min != null && state.yearRange.max != null && state.yearRange.min > state.yearRange.max) {
    state.yearRange.min = baseMin;
    state.yearRange.max = baseMax;
  }
  if (tags) tags.split(",").filter(Boolean).forEach(t => state.filterTags.add(t));
  if (groupsParam) {
    state.selectedGroups = new Set(groupsParam.split(",").filter(Boolean));
  }
  
  if (q) state.search = q;
  if (sort) state.sort = sort;
  if (theme) state.theme = theme;
  if (!state.theme) {
    try {
      const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
      if (m) state.theme = decodeURIComponent(m[1]);
    } catch {}
  }
}

function updateQuery() {
  const p = new URLSearchParams();
  p.set("lang", state.lang);
  if (state.yearRange.min != null) p.set("min", String(state.yearRange.min));
  if (state.yearRange.max != null) p.set("max", String(state.yearRange.max));
  if (state.filterTags.size) p.set("tags", Array.from(state.filterTags).join(","));
  if (state.selectedGroups && state.selectedGroups.size) p.set("groups", Array.from(state.selectedGroups).join(","));
  
  if (state.search) p.set("q", state.search);
  if (state.sort && state.sort !== "default") p.set("sort", state.sort);
  if (state.theme) p.set("theme", state.theme);
  history.replaceState(null, "", `?${p.toString()}`);
}
