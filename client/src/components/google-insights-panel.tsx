import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, TrendingUp, RefreshCcw, Link2 } from "lucide-react";

/**
 * Admin → Analytics: Google numbers in one place.
 *  - Google Search (Search Console): how often Google showed the site, clicks, the searches people used.
 *  - Google Analytics 4: visitors, where they came from, which pages they looked at.
 * Plus the connection settings (read-only Google robot account, property numbers, verification code).
 */

interface Status {
  serviceAccountEmail: string | null;
  propertyId: string;
  searchConsoleSite: string;
  measurementId: string;
  trackingEnabled: boolean;
}

interface Totals { [k: string]: number }

interface Report {
  days: number;
  fetchedAt: string;
  ga: null | {
    current: Totals;
    previous: Totals;
    channels: { name: string; sessions: number }[];
    topPages: { path: string; views: number; users: number }[];
    byDay: { date: string; users: number; sessions: number }[];
    cities: { name: string; users: number }[];
  };
  gaError: string | null;
  gsc: null | {
    range: { start: string; end: string };
    current: Totals;
    previous: Totals;
    topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    topPages: { page: string; clicks: number; impressions: number; position: number }[];
    byDay: { date: string; clicks: number; impressions: number }[];
  };
  gscError: string | null;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Change({ now, before, lowerIsBetter = false }: { now: number; before: number; lowerIsBetter?: boolean }) {
  if (!before) return <span className="text-xs text-gray-400">new</span>;
  const diff = (now - before) / before;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  if (Math.abs(diff) < 0.005) return <span className="text-xs text-gray-400">no change</span>;
  return (
    <span className={`text-xs ${good ? "text-green-700" : "text-red-700"}`}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff * 100).toFixed(0)}%
    </span>
  );
}

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {children}
    </div>
  );
}

/** Tiny line chart, no chart library needed. */
function Spark({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 600;
  const h = 80;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 6) - 3}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" role="img" aria-label={label}>
      <polyline points={pts} fill="none" stroke="#8b6b3e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function GoogleInsightsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [days, setDays] = useState(28);
  const [refresh, setRefresh] = useState(0);

  const { data: status } = useQuery<Status>({ queryKey: ["/api/admin/google-insights/status"] });
  const { data: verification } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/google_site_verification"],
    retry: false,
  });

  const { data: report, isFetching } = useQuery<Report>({
    queryKey: ["/api/admin/google-insights", days, refresh],
    queryFn: async () => {
      const r = await fetch(`/api/admin/google-insights?days=${days}${refresh ? "&refresh=1" : ""}`, { credentials: "include" });
      return r.json();
    },
    enabled: !!status,
  });

  const [propertyId, setPropertyId] = useState("");
  const [site, setSite] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [keyJson, setKeyJson] = useState("");

  useEffect(() => {
    if (status) {
      setPropertyId(status.propertyId || "");
      setSite(status.searchConsoleSite || "");
    }
  }, [status]);
  useEffect(() => {
    if (verification?.value) setVerifyCode(verification.value);
  }, [verification]);

  const saveSetting = (key: string, value: string) => apiRequest("POST", "/api/admin/settings", { key, value });

  const saveConnection = useMutation({
    mutationFn: async () => {
      // Accept the whole <meta ...> tag or just the code
      const code = (verifyCode.match(/content="([^"]+)"/)?.[1] || verifyCode).trim();
      await saveSetting("google_analytics_property_id", propertyId.replace(/\D/g, ""));
      await saveSetting("google_search_console_site", site.trim());
      await saveSetting("google_site_verification", code);
      if (keyJson.trim()) {
        const res = await apiRequest("POST", "/api/admin/google-insights/credentials", { json: keyJson.trim() });
        if (!res.ok) throw new Error((await res.json()).message || "Key file not accepted");
      }
    },
    onSuccess: () => {
      setKeyJson("");
      qc.invalidateQueries({ queryKey: ["/api/admin/google-insights/status"] });
      qc.invalidateQueries({ queryKey: ["/api/settings/google_site_verification"] });
      setRefresh((n) => n + 1);
      toast({ title: "Saved", description: "Google connection settings saved." });
    },
    onError: (e: any) => toast({ title: "Not saved", description: String(e?.message || e), variant: "destructive" }),
  });

  const onKeyFile = (file?: File) => {
    if (!file) return;
    file.text().then(setKeyJson);
  };

  const ga = report?.ga;
  const gsc = report?.gsc;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Google Search &amp; Analytics Report
        </CardTitle>
        <CardDescription>
          How people find the site on Google and what they do once they arrive. Updated from Google every 10 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-wrap items-center gap-2">
          {[7, 28, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              Last {d} days
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setRefresh((n) => n + 1)} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* ---------------- Google Search */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Search className="h-4 w-4" /> Google Search (Search Console)
          </h3>
          {report?.gscError && <p className="text-sm text-amber-700 bg-amber-50 rounded p-3">{report.gscError}</p>}
          {gsc && (
            <>
              <p className="text-xs text-gray-500">
                {gsc.range.start} to {gsc.range.end} (Google's search numbers run about 2 days behind). Arrows compare with the {days} days before.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Times shown on Google" value={fmt(gsc.current.impressions ?? 0)}>
                  <Change now={gsc.current.impressions ?? 0} before={gsc.previous.impressions ?? 0} />
                </Stat>
                <Stat label="Clicks to the site" value={fmt(gsc.current.clicks ?? 0)}>
                  <Change now={gsc.current.clicks ?? 0} before={gsc.previous.clicks ?? 0} />
                </Stat>
                <Stat label="Click rate" value={pct(gsc.current.ctr ?? 0)}>
                  <Change now={gsc.current.ctr ?? 0} before={gsc.previous.ctr ?? 0} />
                </Stat>
                <Stat label="Average position (1 = top)" value={(gsc.current.position ?? 0).toFixed(1)}>
                  <Change now={gsc.current.position ?? 0} before={gsc.previous.position ?? 0} lowerIsBetter />
                </Stat>
              </div>
              <Spark values={gsc.byDay.map((d) => d.impressions)} label="Times shown on Google per day" />
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">What people searched</h4>
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 text-left">
                      <tr><th className="py-1">Search</th><th className="text-right">Shown</th><th className="text-right">Clicks</th><th className="text-right">Position</th></tr>
                    </thead>
                    <tbody>
                      {gsc.topQueries.length === 0 && <tr><td colSpan={4} className="py-2 text-gray-400">No searches yet. New sites take a few weeks.</td></tr>}
                      {gsc.topQueries.map((q) => (
                        <tr key={q.query} className="border-t">
                          <td className="py-1 pr-2">{q.query}</td>
                          <td className="text-right tabular-nums">{fmt(q.impressions)}</td>
                          <td className="text-right tabular-nums">{fmt(q.clicks)}</td>
                          <td className="text-right tabular-nums">{q.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Pages Google sends people to</h4>
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 text-left">
                      <tr><th className="py-1">Page</th><th className="text-right">Shown</th><th className="text-right">Clicks</th></tr>
                    </thead>
                    <tbody>
                      {gsc.topPages.map((p) => (
                        <tr key={p.page} className="border-t">
                          <td className="py-1 pr-2 break-all">{p.page.replace(/^https?:\/\/[^/]+/, "") || "/"}</td>
                          <td className="text-right tabular-nums">{fmt(p.impressions)}</td>
                          <td className="text-right tabular-nums">{fmt(p.clicks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ---------------- GA4 */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4" /> Visitors (Google Analytics 4)
          </h3>
          {report?.gaError && <p className="text-sm text-amber-700 bg-amber-50 rounded p-3">{report.gaError}</p>}
          {ga && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Visitors" value={fmt(ga.current.users ?? 0)}>
                  <Change now={ga.current.users ?? 0} before={ga.previous.users ?? 0} />
                </Stat>
                <Stat label="Visits" value={fmt(ga.current.sessions ?? 0)}>
                  <Change now={ga.current.sessions ?? 0} before={ga.previous.sessions ?? 0} />
                </Stat>
                <Stat label="Pages viewed" value={fmt(ga.current.pageViews ?? 0)}>
                  <Change now={ga.current.pageViews ?? 0} before={ga.previous.pageViews ?? 0} />
                </Stat>
                <Stat label="Engaged visits" value={pct(ga.current.engagementRate ?? 0)}>
                  <Change now={ga.current.engagementRate ?? 0} before={ga.previous.engagementRate ?? 0} />
                </Stat>
              </div>
              <Spark values={ga.byDay.map((d) => d.users)} label="Visitors per day" />
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Where visits came from</h4>
                  <ul className="text-sm space-y-1">
                    {ga.channels.map((c) => (
                      <li key={c.name} className="flex justify-between border-t pt-1"><span>{c.name}</span><span className="tabular-nums">{fmt(c.sessions)}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Most viewed pages</h4>
                  <ul className="text-sm space-y-1">
                    {ga.topPages.map((p) => (
                      <li key={p.path} className="flex justify-between gap-2 border-t pt-1"><span className="break-all">{p.path}</span><span className="tabular-nums">{fmt(p.views)}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Visitor cities</h4>
                  <ul className="text-sm space-y-1">
                    {ga.cities.map((c) => (
                      <li key={c.name} className="flex justify-between border-t pt-1"><span>{c.name}</span><span className="tabular-nums">{fmt(c.users)}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ---------------- Connection */}
        <section className="space-y-4 border-t pt-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Link2 className="h-4 w-4" /> Connection to Google
          </h3>
          <p className="text-sm text-gray-600">
            Read-only robot account:{" "}
            {status?.serviceAccountEmail ? (
              <code className="bg-gray-100 px-1 rounded break-all">{status.serviceAccountEmail}</code>
            ) : (
              <span className="text-amber-700">not added yet</span>
            )}
            . It must be added as a <strong>Viewer</strong> in Google Analytics and as a <strong>user</strong> in Search Console.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ga-property">GA4 property number</Label>
              <Input id="ga-property" placeholder="123456789" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
              <p className="text-xs text-gray-500">Google Analytics → Admin → Property details (numbers only, not the G- code).</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="gsc-site">Search Console property</Label>
              <Input id="gsc-site" placeholder="sc-domain:gabewells.com" value={site} onChange={(e) => setSite(e.target.value)} />
              <p className="text-xs text-gray-500">"sc-domain:gabewells.com" or "https://gabewells.com/", exactly as Search Console shows it.</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="gsc-verify">Search Console verification code (HTML tag method)</Label>
              <Input id="gsc-verify" placeholder='Paste the <meta name="google-site-verification" ...> tag or just its code' value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="sa-key">Robot account key file (.json)</Label>
              <Input id="sa-key" type="file" accept="application/json,.json" onChange={(e) => onKeyFile(e.target.files?.[0])} />
              <Textarea
                placeholder="…or paste the key file's contents here. It is stored encrypted and never shown again."
                value={keyJson}
                onChange={(e) => setKeyJson(e.target.value)}
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <Button onClick={() => saveConnection.mutate()} disabled={saveConnection.isPending}>
            {saveConnection.isPending ? "Saving…" : "Save Google connection"}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
