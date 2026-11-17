import type { Product } from "@shared/schema";

/**
 * Display helpers for shop products.
 * Product titles are stored like `Original Painting: "Luminous"`. On the page we
 * show the artwork name on its own and the kind of piece as a small label.
 */
export function displayTitle(title: string): string {
  const m = title.match(/^\s*Original\s+(?:Painting|Sculpture|Drawing|Artwork)\s*:\s*["“]?(.+?)["”]?\s*$/i);
  return m && m[1] ? m[1] : title;
}

export function kindLabel(product: Pick<Product, "type" | "subtype">): string {
  if (product.type === "originals") {
    if (product.subtype === "sculptures") return "Original sculpture";
    if (product.subtype === "drawings") return "Original drawing";
    return "Original painting";
  }
  if (product.type === "prints") {
    if (product.subtype === "canvas") return "Canvas print";
    if (product.subtype === "framed") return "Framed print";
    if (product.subtype === "limited_edition") return "Limited edition print";
    return "Art print";
  }
  return "Merchandise";
}

/** Height × width, the usual way artwork sizes are written. */
export function sizeLabel(product: Pick<Product, "height" | "width">): string | null {
  if (!product.height || !product.width) return null;
  return `${product.height}" × ${product.width}"`;
}
