/**
 * SEO building blocks shared by the server (which writes them into the HTML it
 * sends, so Google sees them on the first fetch) and the browser app (which
 * keeps the same title/description when people move between pages).
 *
 * The artist text comes from Gabe's own words (2026-11-17). Keep it in his voice.
 */

export const SITE_URL = "https://gabewells.com";
export const SITE_NAME = "Gabe Wells";
export const ARTIST_NAME = "Gabe Wells";
export const DEFAULT_OG_IMAGE =
  "https://res.cloudinary.com/da3hhngye/image/upload/v1747259587/Lumious_m0wilx.jpg";

/** Gabe's artist description, in full (his words). */
export const ARTIST_STATEMENT_FULL =
  "I am a self-taught painter and sculptor based in Denver, working in the tradition of contemporary imaginative realism oil paintings exploring emotional metaphors through images mixing reality and the metaphysical. My paintings combine classical oil techniques with archetypes, and symbolic visual elements, into a vivid realism with dreamlike imagery. I like to think of paintings as portals on a wall, like a window to a space that ignites thoughts, interpretation, and a goal of that recognition of something in another person's inner world that connects with your own.";

/** Condensed version for Google's search snippet (≤160 characters). */
export const ARTIST_SNIPPET =
  "Self-taught Denver painter and sculptor. Imaginative realism oil paintings mixing reality and the metaphysical. Original art direct from the artist.";

/** Third-person version for structured data about the artist. */
export const ARTIST_DESCRIPTION_THIRD_PERSON =
  "Gabe Wells is a self-taught painter and sculptor based in Denver, Colorado, working in contemporary imaginative realism: oil paintings that explore emotional metaphors through images mixing reality and the metaphysical, combining classical oil techniques with archetypes and symbolic visual elements.";

export const ARTIST_SAME_AS = [
  "https://instagram.com/gabewellsart",
  "https://www.facebook.com/gabewells77",
];

export interface PageMeta {
  title: string;
  description: string;
  path: string;
}

/** Fixed pages. Titles are written in full (no suffix is added later). */
export const STATIC_PAGES = {
  "/": {
    path: "/",
    title: "Gabe Wells | Imaginative Realism Oil Paintings, Denver Artist",
    description: ARTIST_SNIPPET,
  },
  "/gallery": {
    path: "/gallery",
    title: "Gallery: Imaginative Realism Oil Paintings & Sculpture | Gabe Wells",
    description:
      "Original oil paintings, sculpture and murals by Denver artist Gabe Wells. Imaginative realism: dreamlike, symbolic images mixing reality and the metaphysical.",
  },
  "/shop": {
    path: "/shop",
    title: "Original Oil Paintings for Sale, Direct from the Artist | Gabe Wells",
    description:
      "Buy original imaginative realism oil paintings and sculpture directly from Denver artist Gabe Wells. One-of-a-kind works, carefully packed and shipped.",
  },
  "/about": {
    path: "/about",
    title: "About Gabe Wells | Denver Painter & Sculptor",
    description:
      "Gabe Wells is a self-taught Denver painter and sculptor working in contemporary imaginative realism. Symbolic, dreamlike oil paintings as portals.",
  },
  "/contact": {
    path: "/contact",
    title: "Contact Gabe Wells | Art Inquiries, Studio Visits & Commissions",
    description:
      "Get in touch with Denver artist Gabe Wells about an original painting, a studio visit, or a commission.",
  },
  "/shipping-returns": {
    path: "/shipping-returns",
    title: "Shipping & Returns | Gabe Wells",
    description:
      "How original paintings and prints from Gabe Wells are packed, shipped and returned.",
  },
} satisfies Record<string, PageMeta>;

export type StaticPath = keyof typeof STATIC_PAGES;

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** `Original Painting: "Luminous"` → `Luminous` */
export function productDisplayTitle(title: string): string {
  const m = title.match(/^\s*Original\s+(?:Painting|Sculpture|Drawing|Artwork)\s*:\s*["“]?(.+?)["”]?\s*$/i);
  return m && m[1] ? m[1] : title;
}

export function artworkPath(a: { id: number; title: string }): string {
  const slug = slugify(a.title);
  return slug ? `/artwork/${a.id}/${slug}` : `/artwork/${a.id}`;
}

export function productPath(p: { id: number; title: string }): string {
  const slug = slugify(productDisplayTitle(p.title));
  return slug ? `/shop/product/${p.id}/${slug}` : `/shop/product/${p.id}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}

/** Plain text, one line, cut on a word boundary. */
export function snippet(text: string | null | undefined, max = 155): string {
  const plain = (text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s]+$/, "")}…`;
}

export function categoryName(slug: string | null | undefined): string {
  return (slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** "Painting", "Sculpture", "Mural" — for structured data and titles. */
export function artformFor(a: { category?: string | null; medium?: string | null }): string {
  const c = (a.category || "").toLowerCase();
  const m = (a.medium || "").toLowerCase();
  if (c.includes("sculpture") || m.includes("clay") || m.includes("resin") || m.includes("bronze")) return "Sculpture";
  if (c.includes("mural") || m.includes("mural")) return "Mural";
  return "Painting";
}

/** "Oil on Canvas Painting", "Air Dry Clay and Wood Sculpture", "Mural". */
export function kindOf(medium: string | null | undefined, form: string): string {
  const m = (medium || "").trim();
  if (!m) return form;
  const hasForm = new RegExp(form === "Sculpture" ? "sculpt" : form.toLowerCase(), "i").test(m);
  return `${titleCaseMedium(m)}${hasForm ? "" : ` ${form}`}`;
}

/** Artwork page: about the work itself (the shop page carries "for sale"). */
export function artworkTitle(a: { title: string; medium?: string | null; status?: string | null; category?: string | null }): string {
  return `${a.title}, ${kindOf(a.medium, artformFor(a))} by Gabe Wells`;
}

/** Shop page for an original. */
export function productTitle(p: { title: string }, medium?: string | null, form = "Painting"): string {
  return `${productDisplayTitle(p.title)}: Original ${kindOf(medium, form)} for Sale | Gabe Wells`;
}

function titleCaseMedium(m: string): string {
  return m
    .split(/\s+/)
    .map((w) => (/^(on|and|with|of|the|a)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** "24\" × 16\"" → { height: 24, width: 16, unit: "in" } (first number = height). */
export function parseDimensions(d: string | null | undefined): { height: number; width: number; unit: "in" | "ft" } | null {
  if (!d) return null;
  const nums = d.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  const unit = /['’]/.test(d) && !/["”]/.test(d) ? "ft" : "in";
  return { height: Number(nums[0]), width: Number(nums[1]), unit };
}
