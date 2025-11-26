import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LBL = {
  book: { zh: '出版社页', en: 'publisher page', es: 'página del editor', fr: "page éditeur" },
  talk: { zh: '演讲页', en: 'talk page', es: 'página de charla', fr: 'page de conférence' },
  column: { zh: '专栏页', en: 'column page', es: 'página de columna', fr: 'page de chronique' },
  site: { zh: '官网页', en: 'official site', es: 'sitio oficial', fr: 'site officiel' }
}

const langs = ['zh','en','es','fr']

const labelFor = (lang, year, topic, kind) => {
  const tag = (LBL[kind] && LBL[kind][lang]) || (LBL.book[lang] || '')
  if (lang === 'zh') return `${year} ${topic}（${tag}）`
  if (lang === 'en') return `${year} ${topic} (${tag})`
  if (lang === 'es') return `${year} ${topic} (${tag})`
  if (lang === 'fr') return `${year} ${topic} (${tag})`
  return `${year} ${topic}`
}

const hasUrl = (arr, url) => Array.isArray(arr) && arr.some(x => x && x.url === url)

async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'investors.json')
  const cfgPath = path.join(__dirname, 'auto_links.config.json')
  const raw = await readFile(dataPath, 'utf-8')
  let list = JSON.parse(raw)
  const cfgRaw = await readFile(cfgPath, 'utf-8')
  const cfg = JSON.parse(cfgRaw)
  const entries = Array.isArray(cfg.entries) ? cfg.entries : []
  const byId = new Map(Array.isArray(list) ? list.map(i => [i.id, i]) : [])
  for (const e of entries) {
    const inv = byId.get(e.id)
    if (!inv) continue
    if (!inv.links || typeof inv.links !== 'object') inv.links = { zh: [], en: [], es: [], fr: [] }
    for (const item of e.items || []) {
      for (const lang of langs) {
        const arr = inv.links[lang] || []
        if (hasUrl(arr, item.url)) continue
        const label = labelFor(lang, item.year, item.topic, item.kind)
        arr.push({ label, url: item.url, type: item.type })
        inv.links[lang] = arr
      }
    }
  }
  const out = JSON.stringify(list, null, 2)
  await writeFile(dataPath, out, 'utf-8')
  console.log('links updated')
}

main().catch(err => { console.error(err); process.exit(1) })