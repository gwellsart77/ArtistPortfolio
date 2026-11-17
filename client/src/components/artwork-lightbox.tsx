import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { Artwork } from "@shared/schema";
import { fullUrl, thumbUrl } from "@/lib/cloudinary";

/**
 * Full-screen artwork viewer used by the gallery and the home page.
 *
 * One click on a painting opens it here, full screen. A "Details" text button
 * opens the painting's information (description, size, availability, shop link).
 * Arrows / keyboard / swipe move between paintings. Esc, the X, or the phone's
 * Back button close it.
 */

type LightboxArtwork = Pick<
  Artwork,
  "id" | "title" | "description" | "category" | "year" | "medium" | "dimensions" | "imageUrl" | "status"
> & { altText?: string | null };

interface ArtworkLightboxProps {
  artworks: LightboxArtwork[];
  /** Index of the open artwork, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

interface ProductData {
  id: number;
}

function ShopLink({ artwork }: { artwork: LightboxArtwork }) {
  const { data: products = [], isLoading } = useQuery<ProductData[]>({
    queryKey: [`/api/products/artwork/${artwork.id}`],
  });
  if (isLoading) return null;
  const href = products.length === 1 && products[0] ? `/shop/product/${products[0].id}` : `/shop?artwork=${artwork.id}`;
  const label = products.length === 1 ? "View Product" : products.length > 1 ? "View Products" : "View in Shop";
  return (
    <a
      href={href}
      className="inline-block mt-4 px-5 py-2 text-xs tracking-widest uppercase bg-[#b8860b] text-white hover:bg-[#9a7209] transition-colors"
      data-testid={`lightbox-shop-link-${artwork.id}`}
    >
      {label}
    </a>
  );
}

function statusLabel(status?: string | null) {
  if (status === "available") return { text: "Available", cls: "text-[#e8c46a]" };
  if (status === "sold") return { text: "Sold", cls: "text-red-300" };
  return { text: "Not for sale", cls: "text-white/60" };
}

export default function ArtworkLightbox({ artworks, index, onIndexChange }: ArtworkLightboxProps) {
  const isOpen = index !== null && index >= 0 && index < artworks.length;
  const artwork = isOpen ? artworks[index as number] : null;
  const count = artworks.length;

  const [showDetails, setShowDetails] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pushedHistory = useRef(false);

  const close = useCallback(() => {
    onIndexChange(null);
  }, [onIndexChange]);

  const go = useCallback(
    (delta: number) => {
      if (index === null || count < 2) return;
      onIndexChange((index + delta + count) % count);
    },
    [index, count, onIndexChange],
  );

  // Reset zoom + loading state whenever the painting changes
  useEffect(() => {
    setLoaded(false);
    setIsZoomed(false);
    transformRef.current?.resetTransform(0);
  }, [index]);

  // Details panel closes when the viewer closes
  useEffect(() => {
    if (!isOpen) setShowDetails(false);
  }, [isOpen]);

  // Phone/browser Back button closes the viewer instead of leaving the page
  useEffect(() => {
    if (!isOpen) return;
    if (!pushedHistory.current) {
      window.history.pushState({ ...(window.history.state || {}), artworkLightbox: true }, "");
      pushedHistory.current = true;
    }
    const onPop = () => {
      pushedHistory.current = false;
      onIndexChange(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isOpen, onIndexChange]);

  // When closed by the X / Esc, remove the history entry we added
  useEffect(() => {
    if (!isOpen && pushedHistory.current) {
      pushedHistory.current = false;
      if (window.history.state?.artworkLightbox) window.history.back();
    }
  }, [isOpen]);

  // Keyboard arrows
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, go]);

  // Preload the neighbouring paintings so arrows feel instant
  useEffect(() => {
    if (index === null || count < 2) return;
    [index + 1, index - 1].forEach((i) => {
      const a = artworks[(i + count) % count];
      if (a) {
        const img = new Image();
        img.src = fullUrl(a.imageUrl);
      }
    });
  }, [index, count, artworks]);

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    const t = e.touches[0];
    touchStart.current = t ? { x: t.clientX, y: t.clientY } : null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || isZoomed) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  if (!artwork) return null;

  const alt = artwork.altText || `${artwork.title} - ${artwork.medium}`;
  const status = statusLabel(artwork.status);
  const meta = [artwork.medium, artwork.year].filter(Boolean).join(", ");

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[#0d0d0d] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[60] flex flex-col text-white outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
          aria-describedby={undefined}
          data-testid="artwork-lightbox"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">{artwork.title}</DialogPrimitive.Title>

          {/* Top bar */}
          <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 h-14 shrink-0">
            <span className="text-xs tracking-widest text-white/50 tabular-nums" aria-live="polite">
              {count > 1 ? `${(index as number) + 1} / ${count}` : ""}
            </span>
            <DialogPrimitive.Close
              className="p-2 -mr-2 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8860b] rounded-full"
              aria-label="Close full screen view"
              data-testid="lightbox-close"
            >
              <X className="h-6 w-6" />
            </DialogPrimitive.Close>
          </div>

          {/* Painting */}
          <div
            className={`relative flex-1 min-h-0 flex items-center justify-center transition-[margin] duration-300 ${showDetails ? "sm:mr-[380px]" : ""}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {!loaded && (
              <img
                src={thumbUrl(artwork.imageUrl, 600)}
                alt=""
                aria-hidden="true"
                className="absolute max-h-full max-w-full object-contain blur-sm opacity-60 px-4 sm:px-20"
              />
            )}
            <TransformWrapper
              ref={transformRef}
              initialScale={1}
              minScale={1}
              maxScale={5}
              centerOnInit
              limitToBounds
              doubleClick={{ mode: "toggle", step: 1.5 }}
              wheel={{ step: 0.15 }}
              panning={{ disabled: !isZoomed }}
              onTransformed={(_ref, state) => setIsZoomed(state.scale > 1.01)}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <img
                  key={artwork.id}
                  src={fullUrl(artwork.imageUrl)}
                  alt={alt}
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = artwork.imageUrl;
                  }}
                  className={`max-h-[calc(100dvh-8.5rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100%-8rem)] object-contain select-none transition-opacity duration-300 ${
                    loaded ? "opacity-100" : "opacity-0"
                  }`}
                  data-testid="lightbox-image"
                />
              </TransformComponent>
            </TransformWrapper>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8860b]"
                  aria-label="Previous painting"
                  data-testid="lightbox-prev"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8860b]"
                  aria-label="Next painting"
                  data-testid="lightbox-next"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>

          {/* Caption bar with the Details button */}
          <div className={`relative z-20 shrink-0 px-4 sm:px-6 pt-3 transition-[margin] duration-300 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center ${showDetails ? "sm:mr-[380px]" : ""}`}>
            <h2 className="font-serif italic text-base sm:text-lg leading-snug">{artwork.title}</h2>
            <p className="text-xs text-white/60 mt-0.5">{meta}</p>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              aria-controls="lightbox-details"
              className="mt-2 text-xs tracking-widest uppercase text-white/80 hover:text-white underline underline-offset-4 decoration-[#b8860b] decoration-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8860b] rounded-sm px-1"
              data-testid="lightbox-details-toggle"
            >
              {showDetails ? "Hide details" : "Details"}
            </button>
          </div>

          {/* Details panel: bottom sheet on phones, side panel on larger screens */}
          <div
            id="lightbox-details"
            role="region"
            aria-label={`Details for ${artwork.title}`}
            className={`absolute z-30 bg-[#161616]/95 backdrop-blur-md border-white/10 transition-transform duration-300 ease-out overflow-y-auto overscroll-contain
              inset-x-0 bottom-0 max-h-[70dvh] rounded-t-xl border-t
              sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:max-h-none sm:w-[380px] sm:rounded-none sm:border-t-0 sm:border-l
              ${showDetails ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
            aria-hidden={!showDetails}
            data-testid="lightbox-details"
          >
            <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl leading-snug">{artwork.title}</h3>
                  <p className="text-sm text-white/60 mt-1">{meta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="p-1 -mr-1 text-white/50 hover:text-white"
                  aria-label="Hide details"
                  tabIndex={showDetails ? 0 : -1}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="w-12 h-px bg-[#b8860b] my-5" />

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {artwork.dimensions && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-widest text-white/40">Size</dt>
                    <dd className="mt-0.5">{artwork.dimensions}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-white/40">Status</dt>
                  <dd className={`mt-0.5 ${status.cls}`}>{status.text}</dd>
                </div>
              </dl>

              {artwork.description && (
                <p className="mt-5 text-sm leading-relaxed text-white/80 whitespace-pre-line">{artwork.description}</p>
              )}

              {artwork.status === "available" && showDetails && <ShopLink artwork={artwork} />}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
