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
app.use(express.static(path.join(__dirname, "public")));

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
