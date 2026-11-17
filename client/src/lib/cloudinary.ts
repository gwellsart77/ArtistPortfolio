/**
 * Cloudinary image helpers.
 *
 * Artwork images are stored on Cloudinary at full size. Sending the full file to
 * every gallery thumbnail made the gallery page download ~9.5 MB of images.
 * These helpers ask Cloudinary for a right-sized, auto-format (WebP/AVIF) copy
 * instead. Non-Cloudinary URLs are returned unchanged, so this is always safe.
 */

const UPLOAD_SEGMENT = "/image/upload/";

export function isCloudinaryUrl(url?: string | null): url is string {
  return !!url && url.includes("res.cloudinary.com") && url.includes(UPLOAD_SEGMENT);
}

/** Insert a Cloudinary transformation string (e.g. "f_auto,q_auto,w_800") into a URL. */
export function cloudinaryTransform(url: string, transformation: string): string {
  if (!isCloudinaryUrl(url)) return url;
  const idx = url.indexOf(UPLOAD_SEGMENT);
  const before = url.slice(0, idx);
  const after = url.slice(idx + UPLOAD_SEGMENT.length);
  // Skip if the URL already carries a transformation (first path part has an underscore-style param list)
  const firstPart = after.split("/")[0] ?? "";
  if (/^[a-z]{1,3}_[^/]+(,[a-z]{1,3}_[^/]+)*$/.test(firstPart) && !/^v\d+$/.test(firstPart)) {
    return url;
  }
  return `${before}${UPLOAD_SEGMENT}${transformation}/${after}`;
}

/** Thumbnail-sized image (never upscaled). */
export function thumbUrl(url: string, width = 800): string {
  return cloudinaryTransform(url, `f_auto,q_auto,c_limit,w_${width}`);
}

/** srcset string for responsive thumbnails. Empty string when not a Cloudinary image. */
export function thumbSrcSet(url: string, widths: number[] = [400, 600, 800, 1200]): string {
  if (!isCloudinaryUrl(url)) return "";
  return widths.map((w) => `${thumbUrl(url, w)} ${w}w`).join(", ");
}

/** Best-quality image for the full-screen viewer (original size, modern format). */
export function fullUrl(url: string): string {
  return cloudinaryTransform(url, "f_auto,q_auto:best");
}
