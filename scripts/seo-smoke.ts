// Smoke test for server/seo.ts using saved copies of the live data.
// Usage: DATABASE_URL=postgres://x npx tsx scripts/seo-smoke.ts <dataDir> <outDir>
import fs from "fs";
import path from "path";
import express from "express";
const [dataDir, outDir] = process.argv.slice(2);
const { storage } = await import("../server/storage");
const rd = (f: string) => JSON.parse(fs.readFileSync(path.join(dataDir!, f), "utf8"));
const settingsRaw = rd("settings.json");
const settings = Array.isArray(settingsRaw) ? settingsRaw : Object.entries(settingsRaw).map(([key, value]) => ({ key, value }));
(storage as any).getAllArtworks = async () => rd("artworks.json");
(storage as any).getAllProducts = async () => rd("products.json");
(storage as any).getAllSettings = async () => [...settings, { key: "google_analytics_enabled", value: "true" }, { key: "google_analytics_id", value: "G-TEST12345" }];
const { registerSeoRoutes, sendSeoPage } = await import("../server/seo");
const template = fs.readFileSync(path.join(process.cwd(), "client/index.html"), "utf8");
const app = express();
registerSeoRoutes(app);
app.use("*", (req, res) => void sendSeoPage(req, res, template));
const server = app.listen(5055, async () => {
  const paths = ["/", "/gallery", "/shop", "/about", "/contact", "/artwork/1/luminous", "/artwork/1", "/artwork/8/vicecream", "/shop/product/60", "/shop/product/8/luminous", "/artwork/9999", "/nope", "/admin/dashboard", "/sitemap.xml", "/robots.txt"];
  fs.mkdirSync(outDir!, { recursive: true });
  for (const p of paths) {
    const r = await fetch(`http://localhost:5055${p}`);
    const t = await r.text();
    fs.writeFileSync(path.join(outDir!, (p.replace(/\//g, "_") || "_") + ".html"), t);
    const title = t.match(/<title>(.*?)<\/title>/)?.[1];
    const canon = t.match(/rel="canonical" href="(.*?)"/)?.[1];
    const desc = t.match(/name="description" content="(.*?)"/)?.[1];
    console.log(r.status, p, "|", title, "|", canon, "|", desc?.length, "| titles:", (t.match(/<title>/g) || []).length, "descs:", (t.match(/name="description"/g) || []).length, "ga:", t.includes("G-TEST12345"));
  }
  server.close();
  process.exit(0);
});
