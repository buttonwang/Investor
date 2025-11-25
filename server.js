import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { maxAge: "7d", etag: true }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/locales/:lang", async (req, res) => {
  const lang = req.params.lang;
  try {
    const p = path.join(__dirname, "locales", `${lang}.json`);
    const data = await readFile(p, "utf-8");
    res.type("application/json").send(data);
  } catch (e) {
    res.status(404).json({ error: "locale_not_found" });
  }
});

app.get("/api/investors", async (req, res) => {
  const lang = (req.query.lang || "zh").toString();
  try {
    const p = path.join(__dirname, "data", "investors.json");
    const raw = await readFile(p, "utf-8");
    let list;
    try {
      list = JSON.parse(raw);
    } catch (parseErr) {
      try {
        const cleaned = raw.replace(/,\s*([}\]])/g, "$1");
        list = JSON.parse(cleaned);
        console.warn("JSON cleaned due to trailing commas");
      } catch (e2) {
        console.error("JSON parse error", parseErr);
        res.type("application/json").send(raw);
        return;
      }
    }
    if (req.query.raw) {
      res.json(list);
      return;
    }
    const fallback = "en";
    const pick = (obj) => {
      if (!obj || typeof obj !== "object") return obj || "";
      const order = [lang, fallback, "zh", "en", "es", "fr"];
      for (const k of order) { if (obj[k]) return obj[k]; }
      const keys = Object.keys(obj);
      return obj[keys[0]];
    };
    const mapped = Array.isArray(list) ? list.map(i => ({
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
      links: pick(i.links) || []
    })) : [];
    console.log("/api/investors", { lang, count: Array.isArray(list) ? list.length : 0 });
    res.json(Array.isArray(list) ? mapped : []);
  } catch (e) {
    res.json([]);
  }
});

app.get("/robots.txt", (req, res) => {
  const host = `${req.protocol}://${req.get("host")}`;
  const body = `User-agent: *\nAllow: /\nSitemap: ${host}/sitemap.xml\n`;
  res.type("text/plain").send(body);
});

app.get("/sitemap.xml", (req, res) => {
  const host = `${req.protocol}://${req.get("host")}`;
  const urls = ["/", "/?lang=zh", "/?lang=en", "/?lang=es", "/?lang=fr"].map(u => `${host}${u}`);
  try {
    const p = path.join(__dirname, "data", "investors.json");
    const raw = require('fs').readFileSync(p, 'utf-8');
    let list = JSON.parse(raw);
    if (Array.isArray(list)) {
      list.forEach(i => {
        if (i && i.id) urls.push(`${host}/investors/${i.id}`);
      });
    }
  } catch {}
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `<url><loc>${u}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join("\n") +
    `\n</urlset>`;
  res.type("application/xml").send(xml);
});

app.get('/investors/:slug', async (req, res) => {
  const slug = req.params.slug;
  try {
    const p = path.join(__dirname, 'data', 'investors.json');
    const raw = await readFile(p, 'utf-8');
    let list = JSON.parse(raw);
    const item = Array.isArray(list) ? list.find(i => i.id === slug) : null;
    if (!item) { res.status(404).send('Not Found'); return; }
    const host = `${req.protocol}://${req.get('host')}`;
    const url = `${host}/investors/${slug}`;
    const pick = (obj, lang = 'zh') => {
      if (!obj || typeof obj !== 'object') return obj || '';
      const order = [lang, 'zh', 'en', 'es', 'fr'];
      for (const k of order) { if (obj[k]) return obj[k]; }
      const keys = Object.keys(obj); return obj[keys[0]];
    };
    const lang = (req.query.lang || 'zh').toString();
    let t = {};
    try {
      const lp = path.join(__dirname, 'locales', `${lang}.json`);
      const lraw = await readFile(lp, 'utf-8');
      t = JSON.parse(lraw);
    } catch {}
    let theme = (req.query.theme || '').toString();
    if (!theme && req.headers.cookie) {
      try {
        const m = req.headers.cookie.match(/(?:^|; )theme=([^;]+)/);
        if (m) theme = decodeURIComponent(m[1]);
      } catch {}
    }
    if (!theme) theme = 'light';
    const name = pick(item.name, lang);
    const summary = pick(item.summary, lang) || '';
    const theory = pick(item.theory, lang) || '';
    const strategy = pick(item.strategy, lang) || '';
    const wins = pick(item.wins, lang) || '';
    const works = pick(item.works, lang) || [];
    const quotes = pick(item.quotes, lang) || [];
    const lessons = pick(item.lessons, lang) || [];
    const links = pick(item.links, lang) || [];
    const cases = pick(item.cases, lang) || [];
    const tags = item.tags || [];
    const timeline = (item.timeline || []).map(ev => ({ year: ev.year, text: pick(ev.text, lang) }));
    const keywords = [name].concat(tags);
    const sameAs = Array.isArray(links) ? links.filter(x => x && x.url).map(x => x.url) : [];
    const ogLocale = lang === 'zh' ? 'zh_CN' : lang === 'en' ? 'en_US' : lang === 'es' ? 'es_ES' : lang === 'fr' ? 'fr_FR' : 'zh_CN';
    const orgIds = new Set(['man_ahl','renaissance','two_sigma','de_shaw']);
    const isOrg = orgIds.has(slug);
    const altLinks = [`<link rel="alternate" hreflang="zh" href="${url}?lang=zh" />`,`<link rel="alternate" hreflang="en" href="${url}?lang=en" />`,`<link rel="alternate" hreflang="es" href="${url}?lang=es" />`,`<link rel="alternate" hreflang="fr" href="${url}?lang=fr" />`,`<link rel="alternate" hreflang="x-default" href="${url}" />`].join('\n');
    const backLabel = lang==='zh' ? '返回首页' : lang==='es' ? 'Volver' : lang==='fr' ? 'Retour' : 'Back';
    const pageTitle = t.title || 'World-Famous Investors Timeline';
    const lblTheory = t.theory || (lang==='zh'?'投资理念':'Investment Theory');
    const lblStrategy = t.strategy || (lang==='zh'?'投资策略':'Investment Strategy');
    const lblWins = t.wins || (lang==='zh'?'代表性成绩':'Notable Wins');
    const lblTimeline = t.timeline || (lang==='zh'?'时间线':'Timeline');
    const lblCases = t.cases || (lang==='zh'?'代表案例': lang==='es'?'Casos' : lang==='fr'?'Cas' : 'Cases');
    const lblWorks = t.works || (lang==='zh'?'著作': lang==='es'?'Obras' : lang==='fr'?'Oeuvres' : 'Works');
    const lblQuotes = t.quotes || (lang==='zh'?'语录': lang==='es'?'Citas' : lang==='fr'?'Citations' : 'Quotes');
    const lblLessons = t.lessons || (lang==='zh'?'失败教训': lang==='es'?'Lecciones' : lang==='fr'?'Leçons' : 'Lessons');
    const lblLinks = t.links || (lang==='zh'?'链接': lang==='es'?'Enlaces' : lang==='fr'?'Liens' : 'Links');
    const cl = t.case_labels || {};
    const lblHedge = cl.hedge || (lang==='zh'?'对冲': lang==='es'?'Cobertura' : lang==='fr'?'Couverture' : 'Hedge');
    const lblResult = cl.result || (lang==='zh'?'结果': lang==='es'?'Resultado' : lang==='fr'?'Résultat' : 'Result');
    const lblSize = cl.size || (lang==='zh'?'仓位': lang==='es'?'Tamaño' : lang==='fr'?'Taille' : 'Size');
    const lblSizePct = cl.size_pct || (lang==='zh'?'仓位%': lang==='es'?'Tamaño%' : lang==='fr'?'Taille %' : 'Size%');
    const lblVol = cl.vol || (lang==='zh'?'波动': lang==='es'?'Volatilidad' : lang==='fr'?'Volatilité' : 'Vol');
    const lblRisk = cl.risk || (lang==='zh'?'风险': lang==='es'?'Riesgo' : lang==='fr'?'Risque' : 'Risk');
    const lblMaxDD = cl.max_dd || (lang==='zh'?'最大回撤': lang==='es'?'Drawdown máximo' : lang==='fr'?'Drawdown max' : 'MaxDD');
    const lblPnL = cl.pnl || (lang==='zh'?'收益': lang==='es'?'Ganancia/Pérdida' : lang==='fr'?'Profit/Perte' : 'PnL');
    const lblDuration = cl.duration || (lang==='zh'?'持有期': lang==='es'?'Duración' : lang==='fr'?'Durée' : 'Duration');
    const lblInst = cl.instruments || (lang==='zh'?'工具/品种': lang==='es'?'Instrumentos' : lang==='fr'?'Instruments' : 'Inst');
    const tagsLabel = (tag) => (t.tags && t.tags[tag]) || tag;
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${name} - ${pageTitle}</title>
<script>try{document.documentElement.setAttribute('data-theme','${theme}')}catch{}</script>
<link rel="stylesheet" href="/styles.css" />
<link rel="canonical" href="${url}${lang ? `?lang=${lang}` : ''}" />
${altLinks}
<meta name="description" content="${summary}" />
<meta name="keywords" content="${keywords.join(', ')}" />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="${isOrg ? 'organization' : 'profile'}" />
<meta property="og:title" content="${name}" />
<meta property="og:description" content="${summary}" />
<meta property="og:url" content="${url}" />
<meta property="og:locale" content="${ogLocale}" />
<script type="application/ld+json">${JSON.stringify(isOrg ? {
  '@context': 'https://schema.org', '@type': 'Organization', name, description: summary, url, sameAs
} : {
  '@context': 'https://schema.org', '@type': 'Person', name, description: summary, url, sameAs,
  knowsAbout: tags
})}</script>
<script>try{document.cookie='theme=${theme}; path=/; max-age=${60*60*24*365}';document.addEventListener('DOMContentLoaded',function(){document.body.dataset.theme='${theme}'})}catch{}</script>
</head>
<body data-theme="${theme}">
<header class="header"><h1>${name}</h1><a class="chip" href="#" onclick="try{if(history.length>1){history.back()}else{location.href='/?lang=${lang}'}}catch(e){location.href='/?lang=${lang}'}">${backLabel}</a></header>
<main id="content" style="max-width:960px;margin:24px auto;padding:0 16px;">
  <section class="card">
    <h2>${name}</h2>
    <p class="summary">${summary}</p>
    <div class="meta">
      <div class="tags">${tags.map(x => `<span class="tag">${tagsLabel(x)}</span>`).join('')}</div>
      <div><strong>${lblTheory}</strong>: ${theory}</div>
      <div><strong>${lblStrategy}</strong>: ${strategy}</div>
      <div><strong>${lblWins}</strong>: ${wins}</div>
    </div>
    <div class="axis">
      <div class="axis-line"></div>
      <div class="axis-ticks"></div>
      <div class="axis-markers"></div>
    </div>
    <h3>${lblTimeline}</h3>
    <ul class="events">
      ${timeline.map(ev => `<li><span class="year">${ev.year}</span><span class="text">${ev.text}</span></li>`).join('')}
    </ul>
    ${Array.isArray(cases) && cases.length ? `<div><h4>${lblCases}</h4><ul>${cases.map(x => {
      if (typeof x === 'string') return `<li>${x}</li>`;
      if (!x || typeof x !== 'object') return '';
      const year = x.year != null ? String(x.year) : '';
      const asset = x.asset ? String(x.asset) : '';
      const position = x.position ? String(x.position) : '';
      const hedge = x.hedge ? `${lblHedge}: ${x.hedge}` : '';
      const result = x.result ? `${lblResult}: ${x.result}` : '';
      const size = x.size ? `${lblSize}: ${x.size}` : '';
      const sizePct = x.size_pct ? `${lblSizePct}: ${x.size_pct}` : '';
      const volTarget = x.vol_target ? `${lblVol}: ${x.vol_target}` : '';
      const riskBudget = x.risk_budget ? `${lblRisk}: ${x.risk_budget}` : '';
      const maxDD = x.max_dd ? `${lblMaxDD}: ${x.max_dd}` : '';
      const pnl = x.pnl ? `${lblPnL}: ${x.pnl}` : '';
      const duration = x.duration ? `${lblDuration}: ${x.duration}` : '';
      const instruments = Array.isArray(x.instruments) && x.instruments.length ? `${lblInst}: ${x.instruments.join('/')}` : '';
      const notes = x.notes ? String(x.notes) : '';
      const parts = [year, asset, position, hedge, result, size, sizePct, volTarget, riskBudget, maxDD, pnl, duration, instruments].filter(Boolean);
      const head = parts.join(' · ');
      const txt = notes ? `${head}${head ? ' — ' : ''}${notes}` : head || notes;
      return `<li>${txt}</li>`;
    }).join('')}</ul></div>` : ''}
    ${Array.isArray(works) && works.length ? `<div><h4>${lblWorks}</h4><ul>${works.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
    ${Array.isArray(quotes) && quotes.length ? `<div><h4>${lblQuotes}</h4><ul>${quotes.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
    ${Array.isArray(lessons) && lessons.length ? `<div><h4>${lblLessons}</h4><ul>${lessons.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
    ${Array.isArray(links) && links.length ? `<div><h4>${lblLinks}</h4><ul>${links.map(x => `<li><a href="${x.url}" target="_blank" rel="noopener noreferrer">${x.label || x.url}</a></li>`).join('')}</ul></div>` : ''}
  </section>
</main>
</body>
</html>`;
    res.type('text/html').send(html);
  } catch (e) {
    res.status(500).send('Server Error');
  }
});

app.get("/api/investors_raw", async (req, res) => {
  try {
    const p = path.join(__dirname, "data", "investors.json");
    const raw = await readFile(p, "utf-8");
    res.type("application/json").send(raw);
  } catch (e) {
    res.status(500).json({ error: "read_error" });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
