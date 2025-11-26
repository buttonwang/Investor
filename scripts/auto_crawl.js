import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const langs = ['zh','en','es','fr']

const LBL = {
  book: { zh: '出版社页', en: 'publisher page', es: 'página del editor', fr: 'page éditeur' },
  talk: { zh: '演讲页', en: 'talk page', es: 'página de charla', fr: 'page de conférence' },
  column: { zh: '专栏页', en: 'column page', es: 'página de columna', fr: 'page de chronique' },
  site: { zh: '官网页', en: 'official site', es: 'sitio oficial', fr: 'site officiel' }
}

const labelFor = (lang, year, topic, kind) => {
  const tag = (LBL[kind] && LBL[kind][lang]) || ''
  if (lang === 'zh') return `${year} ${topic}（${tag}）`.trim()
  return `${year} ${topic} (${tag})`.trim()
}

const hasUrl = (arr, url) => Array.isArray(arr) && arr.some(x => x && x.url === url)

const textFromHtml = html => html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()

const anchors = html => {
  const out = []
  const re = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html))){
    const href = m[1]
    const txt = m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
    out.push({ href, txt })
  }
  return out
}

const yearFrom = s => {
  const m = String(s).match(/\b(19|20)\d{2}\b/)
  return m ? m[0] : ''
}

const domainOf = u => {
  try { const url = new URL(u); return url.hostname.replace(/^www\./,'') } catch { return '' }
}

async function main(){
  const dataPath = path.join(__dirname,'..','data','investors.json')
  const cfgPath = path.join(__dirname,'auto_crawl.config.json')
  const raw = await readFile(dataPath,'utf-8')
  let list = JSON.parse(raw)
  const cfgRaw = await readFile(cfgPath,'utf-8')
  const cfg = JSON.parse(cfgRaw)
  const wl = new Set(cfg.whitelist || [])
  const byId = new Map(Array.isArray(list) ? list.map(i => [i.id, i]) : [])
  for (const invCfg of cfg.investors || []){
    const inv = byId.get(invCfg.id)
    if (!inv) continue
    if (!inv.links || typeof inv.links !== 'object') inv.links = { zh: [], en: [], es: [], fr: [] }
    for (const src of invCfg.sources || []){
      let html = ''
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 10000)
        const res = await fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal })
        clearTimeout(t)
        if (!res.ok) continue
        html = await res.text()
      } catch { continue }
      const pageText = textFromHtml(html)
      const hitPage = (src.keywords || []).some(k => pageText.toLowerCase().includes(String(k).toLowerCase()))
      const srcDomain = domainOf(src.url)
      if (hitPage && srcDomain && wl.has(srcDomain)) {
        const y0 = yearFrom(pageText) || (src.keywords || []).find(x => /^\d{4}$/.test(String(x))) || ''
        const topic0 = src.topic || ((src.keywords || []).join(' / ').slice(0, 120)) || srcDomain
        for (const lang of langs) {
          const arr0 = inv.links[lang] || []
          if (!hasUrl(arr0, src.url)) {
            const label0 = labelFor(lang, y0 || '', topic0, src.kind || 'research')
            arr0.push({ label: label0, url: src.url, type: src.type || 'research' })
            inv.links[lang] = arr0
          }
        }
      }
      const a = anchors(html)
      for (const it of a){
        const d = domainOf(it.href || src.url)
        if (d && !wl.has(d)) continue
        const text = it.txt || textFromHtml(html)
        const hit = (src.keywords || []).some(k => (text.toLowerCase().includes(String(k).toLowerCase())) || (String(it.href).toLowerCase().includes(String(k).toLowerCase())))
        if (!hit) continue
        const y = yearFrom(text) || yearFrom(src.url) || (src.keywords || []).find(x => /^\d{4}$/.test(String(x))) || ''
        const topic = text.slice(0,120)
        for (const lang of langs){
          const arr = inv.links[lang] || []
          if (hasUrl(arr, it.href)) continue
          const label = labelFor(lang, y || '', topic, src.kind || 'research')
          arr.push({ label, url: it.href, type: src.type || 'research' })
          inv.links[lang] = arr
        }
      }
    }
  }
  await writeFile(dataPath, JSON.stringify(list, null, 2), 'utf-8')
  console.log('crawl updated')
}

main().catch(e => { console.error(e); process.exit(1) })