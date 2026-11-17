import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import ArtworkCard from "@/components/artwork-card";
import ArtworkLightbox from "@/components/artwork-lightbox";
import type { Artwork as SchemaArtwork } from "@shared/schema";

interface Artwork {
  id: number;
  title: string;
  description: string;
  category: string;
  year: string;
  medium: string;
  dimensions?: string;
  price?: number;
  imageUrl: string;
  featured: boolean;
  available: boolean;
  status: 'available' | 'sold' | 'unavailable';
  artistName: string;
}

interface ArtRecommendationsProps {
  title?: string;
  limit?: number;
  /** Kept for compatibility with the home page; not displayed. */
  subtitle?: string;
  showReason?: boolean;
  className?: string;
}

export function ArtRecommendations({ 
  title = "Recommended For You", 
  limit = 6,
  className = ""
}: ArtRecommendationsProps) {
  // Index of the painting open in the full-screen viewer, or null
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: recommendations = [], isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks/featured", limit],
    queryFn: () => fetch(`/api/artworks/featured?limit=${limit}`).then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show every artwork Gabe marked as featured (the API returns all of them)
  const items = recommendations;

  const trackInteraction = async (artworkId: number, type: string, timeSpent?: number) => {
    try {
      await apiRequest("POST", "/api/recommendations/track", {
        artworkId,
        interactionType: type,
        timeSpent
      });
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="h-8 bg-neutral-200 w-56 mx-auto animate-pulse" />
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4 h-[320px] bg-neutral-200 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className={`space-y-10 ${className}`} aria-labelledby="featured-artwork-heading">
      <div className="text-center">
        <h2 id="featured-artwork-heading" className="font-serif text-4xl md:text-5xl text-[#1b1a18]">{title}</h2>
        <div className="w-16 h-px bg-[#8b6b3e] mx-auto mt-5" />
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 md:gap-6">
        {items.map((artwork, i) => (
          <div key={artwork.id} className="break-inside-avoid mb-5 md:mb-6">
            <ArtworkCard
              artwork={artwork as unknown as SchemaArtwork}
              onOpen={() => {
                setLightboxIndex(i);
                trackInteraction(artwork.id, 'click');
              }}
            />
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/gallery"
          className="inline-block text-xs tracking-[0.14em] uppercase text-[#1b1a18] hover:text-[#8b6b3e] border-b border-[#8b6b3e] pb-1.5 transition-colors"
        >
          View the full gallery
        </Link>
      </div>

      <ArtworkLightbox
        artworks={items as unknown as SchemaArtwork[]}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}

// Component for "Because you viewed X" recommendations
interface SimilarArtworksProps {
  artworkId: number;
  artworkTitle: string;
  limit?: number;
  className?: string;
}

export function SimilarArtworks({ 
  artworkId, 
  artworkTitle, 
  limit = 4, 
  className = "" 
}: SimilarArtworksProps) {
  const { data: similar = [], isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/recommendations/similar", artworkId, limit],
    queryFn: () => apiRequest("GET", `/api/recommendations/similar/${artworkId}?limit=${limit}`).then(res => res.json()),
    enabled: !!artworkId,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (similar.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-blue-500" />
        <h3 className="text-xl font-semibold text-gray-800">
          Because you viewed "{artworkTitle}"
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {similar.map((artwork, index) => (
          <Card 
            key={artwork.id} 
            className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <Link href={`/gallery/${artwork.id}`}>
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                

              </div>

              <CardContent className="p-4 space-y-2">
                <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm">
                  {artwork.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{artwork.medium}</span>
                  {artwork.price && (
                    <span className="font-semibold text-gray-700">
                      ${artwork.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}