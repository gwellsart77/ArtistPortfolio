import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { ChevronLeft } from "lucide-react";
import type { Artwork, Product } from "@shared/schema";
import { SEO } from "@/components/seo";
import ArtworkLightbox from "@/components/artwork-lightbox";
import ArtworkCard from "@/components/artwork-card";
import { Skeleton } from "@/components/ui/skeleton";
import { thumbUrl } from "@/lib/cloudinary";
import { formatCurrency } from "@/lib/utils";
import { artworkPath, artworkTitle, categoryName, productPath, snippet } from "@shared/seo";

/**
 * One page per artwork: /artwork/:id/:name
 *
 * Gives every painting its own address so it can be found on Google (and in
 * Google Images) by its title, medium and subject. The gallery still opens
 * paintings in the full-screen viewer; this page is where search and shared
 * links land.
 */
export default function ArtworkPage() {
  const [, params] = useRoute("/artwork/:id/:slug?");
  const id = Number(params?.id || 0);
  const [viewer, setViewer] = useState<number | null>(null);
  const [moreIndex, setMoreIndex] = useState<number | null>(null);

  const { data: artwork, isLoading, error } = useQuery<Artwork>({
    queryKey: [`/api/artworks/${id}`],
    enabled: id > 0,
  });
  const { data: allArtworks = [] } = useQuery<Artwork[]>({ queryKey: ["/api/artworks"] });
  const { data: listings = [] } = useQuery<Product[]>({
    queryKey: [`/api/products/artwork/${id}`],
    enabled: id > 0,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-5 lg:px-12 py-10 md:py-16">
        <Skeleton className="h-4 w-24 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          <Skeleton className="md:col-span-7 aspect-[4/5] w-full rounded-none" />
          <div className="md:col-span-5 space-y-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !artwork || !(artwork as Artwork).id) {
    return (
      <div className="container mx-auto px-5 py-24 text-center">
        <SEO title="Page not found | Gabe Wells" description="This artwork could not be found." noindex />
        <h1 className="font-serif text-3xl mb-3">This work isn't here</h1>
        <p className="text-[#6e6a63] mb-8">It may have been moved.</p>
        <Link href="/gallery" className="inline-block border-b border-[#8b6b3e] pb-1 text-xs uppercase tracking-[0.14em]">
          Back to the gallery
        </Link>
      </div>
    );
  }

  const listing = listings.find((p) => p.available !== false && (p.stock ?? 1) > 0);
  const alt = artwork.altText || `${artwork.title}, ${artwork.medium} by Gabe Wells`;
  const facts = [
    { label: "Medium", value: artwork.medium },
    { label: "Size", value: artwork.dimensions },
    { label: "Year", value: artwork.year },
    { label: "Collection", value: categoryName(artwork.category) },
  ].filter((f) => f.value);
  const status =
    artwork.status === "available" ? "Available" : artwork.status === "sold" ? "Sold" : "Not for sale";
  const more = allArtworks
    .filter((a) => a.id !== artwork.id && a.category === artwork.category)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .slice(0, 6);

  return (
    <div className="bg-[#f7f6f3]">
      <SEO
        title={artworkTitle(artwork)}
        description={
          artwork.seoDescription ||
          snippet(
            `${artwork.title} (${[artwork.medium, artwork.dimensions, artwork.year].filter(Boolean).join(", ")}) by Denver artist Gabe Wells. ${artwork.description}`,
          )
        }
        canonicalUrl={artworkPath(artwork)}
        ogType="article"
        ogImage={artwork.imageUrl}
      />

      <ArtworkLightbox artworks={[artwork]} index={viewer} onIndexChange={setViewer} showDetailsButton={false} />

      <div className="container mx-auto px-5 lg:px-12 py-8 md:py-14">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[#6e6a63] hover:text-[#1b1a18] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Gallery
        </Link>

        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="md:col-span-7">
            <button
              type="button"
              onClick={() => setViewer(0)}
              className="group block w-full bg-[#efede8] p-[6%] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e]"
              aria-label={`View ${artwork.title} full screen`}
            >
              <img
                src={thumbUrl(artwork.imageUrl, 1400)}
                alt={alt}
                className="mx-auto max-h-[75vh] w-auto max-w-full object-contain shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                {...({ fetchpriority: "high" } as Record<string, string>)}
              />
            </button>
            <button
              type="button"
              onClick={() => setViewer(0)}
              className="mt-3 text-xs uppercase tracking-[0.14em] text-[#6e6a63] hover:text-[#1b1a18] transition-colors"
            >
              View full screen
            </button>
          </div>

          <div className="md:col-span-5 md:sticky md:top-28">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6e6a63]">Original work by Gabe Wells</p>
            <h1 className="mt-2 font-serif text-4xl lg:text-5xl leading-tight text-[#1b1a18]">{artwork.title}</h1>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[11px] uppercase tracking-widest text-[#6e6a63]">{f.label}</dt>
                  <dd className="mt-0.5 text-[#1b1a18]">{f.value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[#6e6a63]">Status</dt>
                <dd className={`mt-0.5 ${artwork.status === "available" ? "text-[#8b6b3e]" : "text-[#1b1a18]"}`}>{status}</dd>
              </div>
            </dl>

            <div className="mt-8">
              {listing ? (
                <Link
                  href={productPath(listing)}
                  className="inline-flex items-center justify-center w-full bg-[#1b1a18] hover:bg-black text-white h-12 text-xs uppercase tracking-[0.16em]"
                  data-testid="artwork-buy-link"
                >
                  Buy the original · {formatCurrency(listing.price)}
                </Link>
              ) : (
                <Link
                  href={`/contact?artwork=${encodeURIComponent(artwork.title)}`}
                  className="inline-block border-b border-[#8b6b3e] pb-1 text-xs uppercase tracking-[0.14em] text-[#1b1a18]"
                  data-testid="artwork-inquire-link"
                >
                  {artwork.status === "sold" ? "Ask about similar work or a commission" : "Ask about this piece"}
                </Link>
              )}
            </div>
            {artwork.description && (
              <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-[#1b1a18]">
                {artwork.description
                  .split(/\n\s*\n|\n/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
            )}

          </div>
        </div>

        {more.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-3xl text-center text-[#1b1a18]">More {categoryName(artwork.category)}</h2>
            <div className="w-16 h-px bg-[#8b6b3e] mx-auto mt-4 mb-10"></div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 md:gap-6">
              {more.map((a, i) => (
                <div key={a.id} className="break-inside-avoid mb-5 md:mb-6">
                  <ArtworkCard artwork={a} onOpen={() => setMoreIndex(i)} />
                </div>
              ))}
            </div>
            <ArtworkLightbox artworks={more} index={moreIndex} onIndexChange={setMoreIndex} />
          </section>
        )}
      </div>
    </div>
  );
}
