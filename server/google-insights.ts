/**
 * Google Analytics 4 + Google Search Console numbers for the admin Analytics page.
 *
 * Read-only. Signs in to Google with a "service account" (a robot Google account
 * that Gabe adds as a viewer in GA4 and Search Console). Its key file is stored
 * encrypted in api_configurations under GOOGLE_SERVICE_ACCOUNT_KEY. The GA4
 * property number and the Search Console site are ordinary settings.
 *
 * No extra npm packages: the sign-in token is made with Node's crypto module.
 */
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { storage } from "./storage";

const KEY_NAME = "GOOGLE_SERVICE_ACCOUNT_KEY";
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

let tokenCache: { token: string; expires: number; email: string } | null = null;
const reportCache = new Map<string, { at: number; data: unknown }>();
const REPORT_CACHE_MS = 10 * 60 * 1000;

async function loadServiceAccount(): Promise<ServiceAccount | null> {
  const row = await storage.getApiConfig(KEY_NAME);
  if (!row?.value) return null;
  try {
    const sa = JSON.parse(row.value);
    if (sa.client_email && sa.private_key) return sa;
  } catch {
    /* fall through */
  }
  return null;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.email === sa.client_email && tokenCache.expires - 60 > now) return tokenCache.token;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = b64url(signer.sign(sa.private_key));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  const json: any = await res.json();
  if (!res.ok || !json.access_token) throw new Error(`Google sign-in failed: ${json.error_description || json.error || res.status}`);
  tokenCache = { token: json.access_token, expires: now + (json.expires_in || 3600), email: sa.client_email };
  return json.access_token;
}

async function googlePost(url: string, token: string, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Google returned ${res.status}`);
  return json;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

// ------------------------------------------------------------------ GA4

async function gaReport(token: string, propertyId: string, days: number) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`;
  const dateRanges = [
    { startDate: `${days}daysAgo`, endDate: "yesterday", name: "current" },
    { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo`, name: "previous" },
  ];
  const result = await googlePost(url, token, {
    requests: [
      {
        dateRanges,
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
        ],
      },
      {
        dateRanges: [dateRanges[0]],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      },
      {
        dateRanges: [dateRanges[0]],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      },
      {
        dateRanges: [dateRanges[0]],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: 400,
      },
      {
        dateRanges: [dateRanges[0]],
        dimensions: [{ name: "city" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: 8,
      },
    ],
  });
  const [totals, channels, pages, byDay, cities] = result.reports || [];
  const num = (v: any) => Number(v?.value ?? 0);
  const totalsFor = (name: string) => {
    const row = (totals?.rows || []).find((r: any) => r.dimensionValues?.some((d: any) => d.value === name)) || (name === "current" ? totals?.rows?.[0] : totals?.rows?.[1]);
    const m = row?.metricValues || [];
    return {
      users: num(m[0]),
      sessions: num(m[1]),
      pageViews: num(m[2]),
      engagementRate: num(m[3]),
      avgSessionSeconds: num(m[4]),
    };
  };
  return {
    current: totalsFor("current"),
    previous: totalsFor("previous"),
    channels: (channels?.rows || []).map((r: any) => ({ name: r.dimensionValues[0].value, sessions: num(r.metricValues[0]) })),
    topPages: (pages?.rows || []).map((r: any) => ({ path: r.dimensionValues[0].value, views: num(r.metricValues[0]), users: num(r.metricValues[1]) })),
    byDay: (byDay?.rows || []).map((r: any) => ({
      date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      users: num(r.metricValues[0]),
      sessions: num(r.metricValues[1]),
    })),
    cities: (cities?.rows || []).map((r: any) => ({ name: r.dimensionValues[0].value, users: num(r.metricValues[0]) })),
  };
}

// ------------------------------------------------------------------ Search Console

async function gscReport(token: string, site: string, days: number) {
  // Search Console data runs ~2-3 days behind
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const q = (body: object) => googlePost(url, token, { dataState: "all", ...body });
  const [cur, prev, queries, pages, daily] = await Promise.all([
    q({ startDate: ymd(start), endDate: ymd(end) }),
    q({ startDate: ymd(prevStart), endDate: ymd(prevEnd) }),
    q({ startDate: ymd(start), endDate: ymd(end), dimensions: ["query"], rowLimit: 25 }),
    q({ startDate: ymd(start), endDate: ymd(end), dimensions: ["page"], rowLimit: 10 }),
    q({ startDate: ymd(start), endDate: ymd(end), dimensions: ["date"], rowLimit: 400 }),
  ]);
  const tot = (r: any) => {
    const row = r?.rows?.[0];
    return { clicks: row?.clicks ?? 0, impressions: row?.impressions ?? 0, ctr: row?.ctr ?? 0, position: row?.position ?? 0 };
  };
  return {
    range: { start: ymd(start), end: ymd(end) },
    current: tot(cur),
    previous: tot(prev),
    topQueries: (queries.rows || []).map((r: any) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    topPages: (pages.rows || []).map((r: any) => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
    byDay: (daily.rows || []).map((r: any) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
  };
}

// ------------------------------------------------------------------ routes

async function settingValue(key: string): Promise<string> {
  return ((await storage.getSetting(key))?.value || "").trim();
}

export function registerGoogleInsightsRoutes(app: Express) {
  // What is connected (never returns the key itself)
  app.get("/api/admin/google-insights/status", async (_req: Request, res: Response) => {
    const sa = await loadServiceAccount();
    res.json({
      serviceAccountEmail: sa?.client_email || null,
      propertyId: await settingValue("google_analytics_property_id"),
      searchConsoleSite: await settingValue("google_search_console_site"),
      measurementId: await settingValue("google_analytics_id"),
      trackingEnabled: (await settingValue("google_analytics_enabled")) === "true",
    });
  });

  // Save the service account key file (JSON). Admin-only (all /api/admin/* need sign-in).
  app.post("/api/admin/google-insights/credentials", async (req: Request, res: Response) => {
    try {
      const raw = typeof req.body?.json === "string" ? req.body.json : JSON.stringify(req.body?.json ?? "");
      const sa = JSON.parse(raw);
      if (sa.type !== "service_account" || !sa.client_email || !sa.private_key) {
        res.status(400).json({ message: "That is not a Google service account key file (.json)." });
        return;
      }
      crypto.createPrivateKey(sa.private_key); // throws if the key is damaged
      await storage.setApiConfig(
        KEY_NAME,
        JSON.stringify({ type: sa.type, client_email: sa.client_email, private_key: sa.private_key, project_id: sa.project_id }),
        "google",
        "Read-only Google Analytics + Search Console access for the admin report",
      );
      tokenCache = null;
      reportCache.clear();
      res.json({ success: true, serviceAccountEmail: sa.client_email });
    } catch (err: any) {
      res.status(400).json({ message: `Could not read that key file: ${err?.message || err}` });
    }
  });

  app.delete("/api/admin/google-insights/credentials", async (_req: Request, res: Response) => {
    await storage.deleteApiConfig(KEY_NAME);
    tokenCache = null;
    reportCache.clear();
    res.json({ success: true });
  });

  // The numbers. ?days=7|28|90  &refresh=1 skips the 10-minute cache
  app.get("/api/admin/google-insights", async (req: Request, res: Response) => {
    const days = [7, 28, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 28;
    const sa = await loadServiceAccount();
    const propertyId = (await settingValue("google_analytics_property_id")).replace(/^properties\//, "");
    const site = await settingValue("google_search_console_site");
    const cacheKey = `${days}|${propertyId}|${site}|${sa?.client_email}`;
    const cached = reportCache.get(cacheKey);
    if (!req.query.refresh && cached && Date.now() - cached.at < REPORT_CACHE_MS) {
      res.json(cached.data);
      return;
    }

    const out: any = { days, fetchedAt: new Date().toISOString(), ga: null, gaError: null, gsc: null, gscError: null };
    if (!sa) {
      out.gaError = out.gscError = "Not connected yet: add the Google service account key below.";
      res.json(out);
      return;
    }
    let token: string;
    try {
      token = await getAccessToken(sa);
    } catch (err: any) {
      out.gaError = out.gscError = err.message;
      res.json(out);
      return;
    }
    await Promise.all([
      (async () => {
        if (!/^\d{5,15}$/.test(propertyId)) {
          out.gaError = "Add your GA4 property number (Admin → Property details) below.";
          return;
        }
        try {
          out.ga = await gaReport(token, propertyId, days);
        } catch (err: any) {
          out.gaError = err.message;
        }
      })(),
      (async () => {
        if (!site) {
          out.gscError = "Add your Search Console property below (for example sc-domain:gabewells.com).";
          return;
        }
        try {
          out.gsc = await gscReport(token, site, days);
        } catch (err: any) {
          out.gscError = err.message;
        }
      })(),
    ]);
    if (!out.gaError || !out.gscError) reportCache.set(cacheKey, { at: Date.now(), data: out });
    res.json(out);
  });
}
