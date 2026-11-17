import { Artwork } from "@shared/schema";
import { thumbUrl, thumbSrcSet } from "@/lib/cloudinary";
import { artworkPath } from "@shared/seo";

interface ArtworkCardProps {
  artwork: Artwork;
  /** Opens the full-screen viewer for this artwork (one click / one tap). */
  onOpen: () => void;
  /** First few cards load eagerly so the top of the page appears fast. */
  eager?: boolean;
}

/**
 * Gallery thumbnail. One click or tap opens the painting full screen. The card
 * is a real link to the work's own page (/artwork/:id/:name) so search engines
 * can find every piece; a normal click is caught and opens the viewer instead.
 * Ctrl/Cmd-click or middle-click still opens the page. Title and medium appear
 * on hover (desktop) and never block the click.
 */
export default function ArtworkCard({ artwork, onOpen, eager = false }: ArtworkCardProps) {
  const alt = artwork.altText || `${artwork.title} - ${artwork.medium}`;
  const srcSet = thumbSrcSet(artwork.imageUrl);

  return (
    <a
      href={artworkPath(artwork)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onOpen();
      }}
      className="gallery-item group relative block w-full overflow-hidden rounded-sm text-left cursor-zoom-in bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]"
      aria-label={`View ${artwork.title} full screen`}
      data-testid={`artwork-card-${artwork.id}`}
    >
      <img
        src={thumbUrl(artwork.imageUrl, 800)}
        srcSet={srcSet || undefined}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02] ${
          artwork.status !== "available" ? "opacity-95" : ""
        }`}
        onError={(e) => {
          // Fall back to the original file, then to the category placeholder
          const img = e.currentTarget;
          if (img.dataset.fallback !== "1") {
            img.dataset.fallback = "1";
            img.srcset = "";
            img.src = artwork.imageUrl;
          } else {
            img.onerror = null;
            img.src = `/fallback-${artwork.category || "default"}.svg`;
          }
        }}
        data-testid={`artwork-image-${artwork.id}`}
      />

      {/* Caption on hover — purely visual, clicks pass through to the button */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-end px-4 pb-4 pt-16
          bg-gradient-to-t from-black/70 via-black/25 to-transparent
          opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        <span className="text-white text-base font-serif italic text-center leading-snug drop-shadow">{artwork.title}</span>
        <span className="text-white/75 text-xs mt-1 text-center">
          {artwork.medium}
          {artwork.year ? `, ${artwork.year}` : ""}
        </span>
        {artwork.status === "sold" && <span className="mt-2 text-[11px] uppercase tracking-widest text-red-300">Sold</span>}
        {artwork.status === "available" && (
          <span className="mt-2 text-[11px] uppercase tracking-widest text-[#d8c3a0]">Available</span>
        )}
      </div>
    </a>
  );
}
