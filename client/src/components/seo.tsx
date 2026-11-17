import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@shared/seo";

interface SEOProps {
  /** Full page title, written out in full (nothing is added to it). */
  title: string;
  description: string;
  /** Path like "/gallery" or a full URL. */
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
}

/**
 * Keeps the page's title and search/social tags in step when people move
 * between pages in the app.
 *
 * The server already writes these tags (plus structured data) into the HTML for
 * the first page load (server/seo.ts). This component updates those same tags
 * in place instead of adding a second copy, so there is never more than one
 * title, description or canonical link on the page.
 */
export const SEO = ({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  twitterCard = "summary_large_image",
  noindex = false,
}: SEOProps) => {
  useEffect(() => {
    const clean = (description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    const canonical = canonicalUrl
      ? canonicalUrl.startsWith("http")
        ? canonicalUrl
        : absoluteUrl(canonicalUrl)
      : null;

    document.title = title;
    setMeta("name", "description", clean);
    setMeta("name", "robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", clean);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:url", canonical);
    setMeta("name", "twitter:card", twitterCard);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", clean);
    setMeta("name", "twitter:image", ogImage);
    setCanonical(canonical);
  }, [title, description, canonicalUrl, ogImage, ogType, twitterCard, noindex]);

  return null;
};

function setMeta(attr: "name" | "property", key: string, value: string | null) {
  const nodes = document.head.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  // Never leave duplicates behind
  nodes.forEach((n, i) => i > 0 && n.remove());
  let el = nodes[0] ?? null;
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(href: string | null) {
  const nodes = document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]');
  nodes.forEach((n, i) => i > 0 && n.remove());
  let el = nodes[0] ?? null;
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}
