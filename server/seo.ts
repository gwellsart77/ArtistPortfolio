/**
 * Server-side SEO.
 *
 * The site is a React app: without this, every URL sends the same empty page
 * and Google only sees content after running the JavaScript. Here the server
 * writes the right title, description, canonical link, social-share tags,
 * structured data (JSON-LD) and readable page content into the HTML it sends.
 * React replaces the readable content as soon as it starts.
 *
 * Also serves /robots.txt and /sitemap.xml from the live database, and gives
 * unknown URLs a real 404 status.
 */
import type { Express, Request, Response } from "express";
import type { Artwork, Product } from "@shared/schema";
import { storage } from "./storage";
import {
  ARTIST_DESCRIPTION_THIRD_PERSON,
  ARTIST_NAME,
  ARTIST_SAME_AS,
  ARTIST_STATEMENT_FULL,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  STATIC_PAGES,
  absoluteUrl,
  artformFor,
  artworkPath,
  artworkTitle,
  categoryName,
  parseDimensions,
  productDisplayTitle,
  productPath,
  productTitle,
  snippet,
} from "@shared/seo";

// ---------------------------------------------------------------- data cache

interface SiteData {
  artworks: Artwork[];
  products: Product[];
  settings: Record<string, string>;
  loadedAt: number;
}

let cache: SiteData | null = null;
let loading: Promise<SiteData> | null = null;
const CACHE_MS = 60 * 1000;

export async function getSiteData(): Promise<SiteData> {
  if (cache && Date.now() - cache.loadedAt < CACHE_MS) return cache;
  if (loading) return loading;
  loading = (async () => {
    try {
      const [artworks, products, settingsRows] = await Promise.all([
        storage.getAllArtworks(),
        storage.getAllProducts(),
        storage.getAllSettings(),
      ]);
      const settings: Record<string, string> = {};
      for (const s of settingsRows) settings[s.key] = s.value ?? "";
      cache = { artworks, products, settings, loadedAt: Date.now() };
      return cache;
    } catch (err) {
      console.error("[seo] could not load site data:", err);
      // Serve stale data rather than nothing
      return cache ?? { artworks: [], products: [], settings: {}, loadedAt: 0 };
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Call after admin edits so new work shows in the sitemap right away. */
export function clearSeoCache() {
  cache = null;
}

// ---------------------------------------------------------------- helpers

const esc = (s: string | number | null | undefined) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Right-sized Cloudinary image (falls back to the original URL). */
function img(url: string, width: number): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  const [before, after = ""] = url.split("/image/upload/");
  if (/^[a-z]{1,3}_/.test(after.split("/")[0] ?? "")) return url;
  return `${before}/image/upload/f_auto,q_auto,c_limit,w_${width}/${after}`;
}

/** Social-share image: plain JPG Facebook/LinkedIn can read. */
function ogImg(url: string): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  const [before, after = ""] = url.split("/image/upload/");
  if (/^[a-z]{1,3}_/.test(after.split("/")[0] ?? "")) return url;
  return `${before}/image/upload/f_jpg,q_auto,c_limit,w_1200,h_1200/${after}`;
}

function paragraphs(text: string | null | undefined, max = 99): string {
  return (text || "")
    .replace(/<[^>]*>/g, " ")
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, max)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("\n");
}

function isVisible(a: Artwork): boolean {
  return !!a.title && !!a.imageUrl;
}

function artworkProduct(a: Artwork, products: Product[]): Product | undefined {
  return products.find((p) => p.artworkId === a.id && p.available !== false && (p.stock ?? 1) > 0);
}

function isOnSale(p: Product): boolean {
  return p.available !== false && (p.stock ?? 1) > 0 && p.price > 0;
}

// ---------------------------------------------------------------- JSON-LD

const PERSON_ID = `${SITE_URL}/#artist`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function personLd(settings: Record<string, string>) {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: ARTIST_NAME,
    alternateName: "Gabriel Wells",
    url: `${SITE_URL}/`,
    image: settings.about_profile_image || DEFAULT_OG_IMAGE,
    jobTitle: "Painter and sculptor",
    description: ARTIST_DESCRIPTION_THIRD_PERSON,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Denver",
      addressRegion: "CO",
      addressCountry: "US",
    },
    knowsAbout: [
      "Imaginative realism",
      "Contemporary oil painting",
      "Symbolism in art",
      "Sculpture",
      "Murals",
    ],
    award: [
      "Best in Show, Lone Tree Art Expo Juried Show",
      "Finalist, Beautiful Bizarre Magazine International Traditional Art Prize",
    ],
    sameAs: ARTIST_SAME_AS,
  };
}

function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: "Gabe Wells Art",
    publisher: { "@id": PERSON_ID },
    inLanguage: "en-US",
  };
}

function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** Return policy from the Shipping & Returns page (originals: 14 days, buyer pays return shipping). */
const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "US",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
};

function visualArtworkLd(a: Artwork, product?: Product) {
  const dims = parseDimensions(a.dimensions);
  const unitCode = dims?.unit === "ft" ? "FOT" : "INH";
  return {
    "@type": "VisualArtwork",
    "@id": `${absoluteUrl(artworkPath(a))}#artwork`,
    name: a.title,
    url: absoluteUrl(artworkPath(a)),
    image: a.imageUrl,
    description: snippet(a.description, 500),
    creator: { "@id": PERSON_ID },
    ...(a.year ? { dateCreated: a.year } : {}),
    ...(a.medium ? { artMedium: a.medium } : {}),
    artform: artformFor(a),
    ...(a.category ? { genre: categoryName(a.category) } : {}),
    ...(dims
      ? {
          height: { "@type": "QuantitativeValue", value: dims.height, unitCode },
          width: { "@type": "QuantitativeValue", value: dims.width, unitCode },
        }
      : {}),
    ...(product && isOnSale(product)
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(productPath(product)),
            price: product.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

function productLd(p: Product, a?: Artwork) {
  const name = productDisplayTitle(p.title);
  const images = [p.imageUrl, a?.imageUrl].filter((u, i, arr): u is string => !!u && arr.indexOf(u) === i);
  return {
    "@type": "Product",
    "@id": `${absoluteUrl(productPath(p))}#product`,
    name: `${name} — original ${a ? artformFor(a).toLowerCase() : "artwork"} by Gabe Wells`,
    url: absoluteUrl(productPath(p)),
    image: images,
    description: snippet(p.seoDescription || p.description, 500),
    sku: `GW-${p.id}`,
    brand: { "@type": "Brand", name: ARTIST_NAME },
    ...(a?.medium ? { material: a.medium } : {}),
    ...(a ? { subjectOf: { "@id": `${absoluteUrl(artworkPath(a))}#artwork` } } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productPath(p)),
      price: p.price,
      priceCurrency: "USD",
      itemCondition: "https://schema.org/NewCondition",
      availability: isOnSale(p) ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: { "@id": PERSON_ID },
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
  };
}

// ---------------------------------------------------------------- page model

export interface RenderedPage {
  status: number;
  title: string;
  description: string;
  canonicalPath: string | null;
  ogImage: string;
  ogType: string;
  robots: string;
  jsonLd: object[];
  body: string;
  /** False on admin pages so Gabe's own visits are not counted. */
  analytics: boolean;
}

const NAV = `<nav aria-label="Main"><a href="/">Home</a> · <a href="/gallery">Gallery</a> · <a href="/shop">Shop</a> · <a href="/about">About</a> · <a href="/contact">Contact</a></nav>`;

function shell(inner: string): string {
  return `<div class="seo-prerender" style="max-width:960px;margin:0 auto;padding:24px 20px;font-family:Inter,system-ui,sans-serif;color:#1b1a18;background:#f7f6f3;line-height:1.6">
<header style="text-align:center;margin-bottom:24px"><a href="/" style="font-family:'Cormorant Garamond',serif;font-size:28px;color:#1b1a18;text-decoration:none">Gabe Wells</a><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6e6a63;margin-top:8px">${NAV}</div></header>
<main>${inner}</main>
<footer style="margin-top:40px;font-size:13px;color:#6e6a63;text-align:center">Gabe Wells · Denver, Colorado · <a href="/shipping-returns">Shipping &amp; Returns</a></footer>
</div>`;
}

function workList(items: { href: string; title: string; image: string; alt: string; caption: string }[]): string {
  if (!items.length) return "";
  return `<ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px">${items
    .map(
      (it) =>
        `<li><a href="${esc(it.href)}" style="color:#1b1a18;text-decoration:none"><img src="${esc(img(it.image, 400))}" alt="${esc(it.alt)}" loading="lazy" width="400" style="width:100%;height:auto;display:block"><strong style="display:block;margin-top:6px;font-weight:500">${esc(it.title)}</strong><span style="font-size:13px;color:#6e6a63">${esc(it.caption)}</span></a></li>`,
    )
    .join("\n")}</ul>`;
}

function artworkItem(a: Artwork) {
  return {
    href: artworkPath(a),
    title: a.title,
    image: a.imageUrl,
    alt: a.altText || `${a.title}, ${a.medium} by Gabe Wells`,
    caption: [a.medium, a.year, a.status === "available" ? "Available" : a.status === "sold" ? "Sold" : ""]
      .filter(Boolean)
      .join(" · "),
  };
}

function productItem(p: Product, a?: Artwork) {
  return {
    href: productPath(p),
    title: productDisplayTitle(p.title),
    image: p.imageUrl,
    alt: p.altText || a?.altText || `${productDisplayTitle(p.title)}, original ${a?.medium || "artwork"} by Gabe Wells`,
    caption: [a?.medium, `$${p.price.toLocaleString("en-US")}`].filter(Boolean).join(" · "),
  };
}

function base(
  meta: { title: string; description: string; path: string | null },
  extra: Partial<RenderedPage> = {},
): RenderedPage {
  return {
    status: 200,
    title: meta.title,
    description: meta.description,
    canonicalPath: meta.path,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
    robots: "index, follow, max-image-preview:large",
    jsonLd: [],
    body: "",
    analytics: true,
    ...extra,
  };
}

function sortedArtworks(artworks: Artwork[]) {
  return [...artworks].filter(isVisible).sort((x, y) => (x.displayOrder || 0) - (y.displayOrder || 0));
}

const NOINDEX_PREFIXES = ["/admin", "/checkout", "/order-confirmation", "/cart"];

/** Build the page for a URL path. Never throws. */
export async function renderSeoPage(rawPath: string): Promise<RenderedPage> {
  const path = (rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  if (NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    const isAdmin = path === "/admin" || path.startsWith("/admin/");
    return base(
      { title: isAdmin ? "Admin | Gabe Wells" : "Checkout | Gabe Wells", description: STATIC_PAGES["/"].description, path: null },
      { robots: "noindex, nofollow", analytics: !isAdmin },
    );
  }
  if (path === "/security-policy" || path === "/autofill-test.html") {
    return base({ title: "Security Policy | Gabe Wells", description: STATIC_PAGES["/"].description, path: null }, { robots: "noindex, follow" });
  }

  const data = await getSiteData();
  const { artworks, products, settings } = data;
  const byId = new Map(artworks.map((a) => [a.id, a]));
  const site = [personLd(settings), websiteLd()];

  // ---- Home
  if (path === "/") {
    const meta = STATIC_PAGES["/"];
    const featured = sortedArtworks(artworks).filter((a) => a.featured);
    const list = (featured.length ? featured : sortedArtworks(artworks)).slice(0, 12);
    return base(meta, {
      ogImage: ogImg(settings.home_hero_image || DEFAULT_OG_IMAGE),
      jsonLd: [...site],
      body: shell(`<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:40px;text-align:center">Gabe Wells: Imaginative Realism Oil Paintings</h1>
<p>${esc(ARTIST_STATEMENT_FULL)}</p>
<h2 style="font-family:'Cormorant Garamond',serif;font-weight:500">Featured works</h2>
${workList(list.map(artworkItem))}
<p><a href="/gallery">See the full gallery</a> · <a href="/shop">Original paintings for sale</a></p>`),
    });
  }

  // ---- Gallery
  if (path === "/gallery") {
    const meta = STATIC_PAGES["/gallery"];
    const list = sortedArtworks(artworks);
    const cats = Array.from(new Set(list.map((a) => a.category)));
    return base(meta, {
      jsonLd: [
        ...site,
        {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/gallery#page`,
          url: `${SITE_URL}/gallery`,
          name: meta.title,
          about: { "@id": PERSON_ID },
          isPartOf: { "@id": WEBSITE_ID },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: list.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(artworkPath(a)), name: a.title })),
          },
        },
      ],
      body: shell(`<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;text-align:center">Gallery</h1>
<p>${esc(settings.gallery_description || meta.description)}</p>
${cats
  .map(
    (c) => `<section><h2 style="font-family:'Cormorant Garamond',serif;font-weight:500">${esc(categoryName(c))}</h2>${workList(
      list.filter((a) => a.category === c).map(artworkItem),
    )}</section>`,
  )
  .join("\n")}`),
    });
  }

  // ---- Shop
  if (path === "/shop") {
    const meta = STATIC_PAGES["/shop"];
    const forSale = products.filter(isOnSale).sort((x, y) => (x.displayOrder || 0) - (y.displayOrder || 0));
    return base(meta, {
      jsonLd: [
        ...site,
        {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/shop#page`,
          url: `${SITE_URL}/shop`,
          name: meta.title,
          isPartOf: { "@id": WEBSITE_ID },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: forSale.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(productPath(p)),
              name: productDisplayTitle(p.title),
            })),
          },
        },
      ],
      body: shell(`<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;text-align:center">Original Paintings for Sale</h1>
<p>${esc(settings.shop_description || "Original paintings and sculpture, available directly from the artist.")} Every piece is one of a kind and sold directly by the artist, Gabe Wells, from his Denver studio.</p>
${workList(forSale.map((p) => productItem(p, p.artworkId ? byId.get(p.artworkId) : undefined)))}`),
    });
  }

  // ---- About
  if (path === "/about") {
    const meta = STATIC_PAGES["/about"];
    return base(meta, {
      ogImage: ogImg(settings.about_profile_image || DEFAULT_OG_IMAGE),
      ogType: "profile",
      jsonLd: [
        ...site,
        {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/about#page`,
          url: `${SITE_URL}/about`,
          name: meta.title,
          mainEntity: { "@id": PERSON_ID },
          isPartOf: { "@id": WEBSITE_ID },
        },
      ],
      body: shell(`<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;text-align:center">About Gabe Wells</h1>
${paragraphs(settings.about_biography || ARTIST_STATEMENT_FULL, 3)}
${settings.about_artist_statement ? `<h2 style="font-family:'Cormorant Garamond',serif;font-weight:500">Artist Statement</h2>${paragraphs(settings.about_artist_statement, 4)}` : ""}
<p><a href="/gallery">View the gallery</a> · <a href="/contact">Contact Gabe</a></p>`),
    });
  }

  // ---- Contact / Shipping
  if (path === "/contact" || path === "/shipping-returns") {
    const meta = STATIC_PAGES[path as "/contact" | "/shipping-returns"];
    return base(meta, {
      jsonLd: [...site],
      body: shell(`<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500;text-align:center">${path === "/contact" ? "Contact" : "Shipping &amp; Returns"}</h1><p>${esc(meta.description)}</p>`),
    });
  }

  // ---- Artwork page: /artwork/:id(/:slug)
  let m = path.match(/^\/artwork\/(\d+)(?:\/[^/]*)?$/);
  if (m) {
    const a = byId.get(Number(m[1]));
    if (!a) return notFound(site);
    const product = artworkProduct(a, products);
    const canonical = artworkPath(a);
    const others = sortedArtworks(artworks).filter((x) => x.id !== a.id && x.category === a.category).slice(0, 6);
    const meta = {
      title: artworkTitle(a),
      description: snippet(a.seoDescription || `${a.title} (${[a.medium, a.dimensions, a.year].filter(Boolean).join(", ")}) by Denver artist Gabe Wells. ${a.description}`),
      path: canonical,
    };
    return base(meta, {
      ogImage: ogImg(a.imageUrl),
      ogType: "article",
      jsonLd: [
        ...site,
        visualArtworkLd(a, product),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
          { name: a.title, path: canonical },
        ]),
      ],
      body: shell(`<p style="font-size:13px"><a href="/gallery">Gallery</a> / ${esc(categoryName(a.category))}</p>
<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500">${esc(a.title)}</h1>
<img src="${esc(img(a.imageUrl, 1200))}" alt="${esc(a.altText || `${a.title}, ${a.medium} by Gabe Wells`)}" width="1200" style="width:100%;height:auto">
<p>${esc([a.medium, a.dimensions, a.year].filter(Boolean).join(" · "))}${a.status === "sold" ? " · Sold" : a.status === "available" ? " · Available" : ""}</p>
${paragraphs(a.description)}
${product ? `<p><a href="${esc(productPath(product))}">Buy the original: $${product.price.toLocaleString("en-US")}</a></p>` : `<p><a href="/contact">Ask about this piece</a></p>`}
${others.length ? `<h2 style="font-family:'Cormorant Garamond',serif;font-weight:500">More ${esc(categoryName(a.category))}</h2>${workList(others.map(artworkItem))}` : ""}`),
    });
  }

  // ---- Product page: /shop/product/:id(/:slug) or /product/:id
  m = path.match(/^\/(?:shop\/)?product\/(\d+)(?:\/[^/]*)?$/);
  if (m) {
    const p = products.find((x) => x.id === Number(m![1]));
    if (!p) return notFound(site);
    const a = p.artworkId ? byId.get(p.artworkId) : undefined;
    const canonical = productPath(p);
    const name = productDisplayTitle(p.title);
    const form = a ? artformFor(a) : "Painting";
    const meta = {
      title: productTitle(p, a?.medium, form),
      description: snippet(
        p.seoDescription?.trim() ||
          `${name}: original ${a?.medium ? a.medium.toLowerCase() : form.toLowerCase()}${a?.dimensions ? `, ${a.dimensions}` : ""}, by Denver artist Gabe Wells. $${p.price.toLocaleString("en-US")}, direct from the artist. ${p.description}`,
      ),
      path: canonical,
    };
    return base(meta, {
      ogImage: ogImg(p.imageUrl || a?.imageUrl || DEFAULT_OG_IMAGE),
      ogType: "product",
      jsonLd: [
        ...site,
        productLd(p, a),
        ...(a ? [visualArtworkLd(a, p)] : []),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name, path: canonical },
        ]),
      ],
      body: shell(`<p style="font-size:13px"><a href="/shop">Shop</a></p>
<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500">${esc(name)}</h1>
<img src="${esc(img(p.imageUrl, 1200))}" alt="${esc(p.altText || a?.altText || `${name}, original ${a?.medium || "artwork"} by Gabe Wells`)}" width="1200" style="width:100%;height:auto">
<p><strong>$${p.price.toLocaleString("en-US")}</strong> · Original ${esc(form.toLowerCase())}${a?.medium ? ` · ${esc(a.medium)}` : ""}${a?.dimensions ? ` · ${esc(a.dimensions)}` : ""}${isOnSale(p) ? " · Available" : " · Sold"}</p>
${paragraphs(p.description)}
${a ? `<p><a href="${esc(artworkPath(a))}">About this artwork</a></p>` : ""}
<p><a href="/shipping-returns">Shipping &amp; returns</a></p>`),
    });
  }

  return notFound(site);
}

function notFound(site: object[]): RenderedPage {
  return base(
    { title: "Page not found | Gabe Wells", description: STATIC_PAGES["/"].description, path: null },
    {
      status: 404,
      robots: "noindex, follow",
      jsonLd: site,
      body: shell(`<h1 style="font-family:'Cormorant Garamond',serif;font-weight:500">Page not found</h1><p><a href="/gallery">Visit the gallery</a></p>`),
    },
  );
}

// ---------------------------------------------------------------- HTML injection

function gaSnippet(settings: Record<string, string>): string {
  // Admin setting first; otherwise the VITE_GA_MEASUREMENT_ID secret the site has always used.
  const fromSettings = (settings.google_analytics_id || "").trim();
  const id = fromSettings || (process.env.VITE_GA_MEASUREMENT_ID || "").trim();
  const enabled = fromSettings
    ? settings.google_analytics_enabled === "true"
    : settings.google_analytics_enabled !== "false";
  if (!enabled || !/^G-[A-Z0-9]{4,20}$/.test(id)) return "";
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');window.__GA_ID__='${id}';</script>`;
}

function verificationTag(settings: Record<string, string>): string {
  const v = (settings.google_site_verification || "").trim();
  if (!v || !/^[A-Za-z0-9_\-]{10,100}$/.test(v)) return "";
  return `<meta name="google-site-verification" content="${esc(v)}" />`;
}

/** Put the page's tags and content into the built index.html. */
export function injectSeo(template: string, page: RenderedPage, settings: Record<string, string>): string {
  let html = template;
  // Remove the generic tags shipped in index.html; we write page-specific ones.
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<!--\s*Open Graph[^>]*-->/gi, "");

  const canonical = page.canonicalPath ? absoluteUrl(page.canonicalPath) : null;
  const ld = page.jsonLd.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": page.jsonLd }).replace(/</g, "\\u003c")}</script>`
    : "";

  const head = `<title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <meta name="robots" content="${esc(page.robots)}" />
    ${canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : ""}
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="${esc(page.ogType)}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    ${canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : ""}
    <meta property="og:image" content="${esc(page.ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(page.title)}" />
    <meta name="twitter:description" content="${esc(page.description)}" />
    <meta name="twitter:image" content="${esc(page.ogImage)}" />
    ${verificationTag(settings)}
    ${ld}
    ${page.analytics ? gaSnippet(settings) : ""}`;

  html = html.replace(/<head>/i, `<head>\n    ${head}`);
  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${page.body}</div>`);
  return html;
}

/** Full response for a page request (used by production and dev servers). */
export async function sendSeoPage(req: Request, res: Response, template: string): Promise<void> {
  let page: RenderedPage;
  try {
    page = await renderSeoPage(req.originalUrl || req.url || "/");
  } catch (err) {
    console.error("[seo] render failed, sending plain page:", err);
    res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(template);
    return;
  }
  const { settings } = await getSiteData();
  const html = injectSeo(template, page, settings);
  res
    .status(page.status)
    .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" })
    .end(html);
}

// ---------------------------------------------------------------- robots + sitemap

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /checkout",
        "Disallow: /order-confirmation",
        "Disallow: /autofill-test.html",
        "",
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        "",
      ].join("\n"),
    );
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const { artworks, products } = await getSiteData();
    const today = new Date().toISOString().slice(0, 10);
    const latest = (dates: (Date | null | undefined)[]) => {
      const t = dates.filter(Boolean).map((d) => new Date(d as Date).getTime()).filter((n) => !isNaN(n));
      return t.length ? new Date(Math.max(...t)).toISOString().slice(0, 10) : today;
    };
    type Entry = { loc: string; lastmod?: string | undefined; images?: { url: string; title: string }[] };
    const entries: Entry[] = [
      { loc: "/", lastmod: latest(artworks.map((a) => a.createdAt)) },
      { loc: "/gallery", lastmod: latest(artworks.map((a) => a.createdAt)) },
      { loc: "/shop", lastmod: latest(products.map((p) => p.createdAt)) },
      { loc: "/about" },
      { loc: "/contact" },
      { loc: "/shipping-returns" },
    ];
    for (const a of sortedArtworks(artworks)) {
      entries.push({
        loc: artworkPath(a),
        lastmod: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : undefined,
        images: [{ url: a.imageUrl, title: a.title }],
      });
    }
    for (const p of products.filter(isOnSale)) {
      entries.push({
        loc: productPath(p),
        lastmod: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : undefined,
        images: [{ url: p.imageUrl, title: productDisplayTitle(p.title) }],
      });
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (e) => `  <url>
    <loc>${esc(absoluteUrl(e.loc))}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}${(e.images || [])
      .filter((i) => i.url)
      .map((i) => `\n    <image:image><image:loc>${esc(i.url)}</image:loc></image:image>`)
      .join("")}
  </url>`,
  )
  .join("\n")}
</urlset>
`;
    res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(xml);
  });
}
