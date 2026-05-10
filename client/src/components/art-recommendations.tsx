import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState, type MouseEvent } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FullscreenImageViewer from "@/components/fullscreen-image-viewer";

// ProductLinkButton component for consistent navigation
const ProductLinkButton = ({ artwork, onNavigate }: { artwork: Artwork; onNavigate?: () => void }) => {
  const { data: relatedProducts = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/products/artwork/${artwork.id}`],
    enabled: true,
  });
  
  if (isLoading) {
    return (
      <Button 
        variant="default"
        className="bg-amber-600 hover:bg-amber-700 text-white"
        disabled
      >
        Loading...
      </Button>
    );
  }

  // If we have exactly one related product, link directly to it
  if (relatedProducts.length === 1) {
    return (
      <Link href={`/shop/product/${relatedProducts[0].id}`}>
        <Button 
          variant="default"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={onNavigate}
        >
          VIEW PRODUCT
        </Button>
      </Link>
    );
  }

  // If multiple products, go to shop with artwork filter
  return (
    <Link href={`/shop?artwork=${artwork.id}`}>
      <Button 
        variant="default"
        className="bg-amber-600 hover:bg-amber-700 text-white"
        onClick={onNavigate}
      >
        VIEW PRODUCT
      </Button>
    </Link>
  );
};

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
  showReason?: boolean;
  className?: string;
}

export function ArtRecommendations({ 
  title = "Recommended For You", 
  limit = 6,
  showReason = false,
  className = ""
}: ArtRecommendationsProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  
  const { data: recommendations = [], isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks/featured", limit],
    queryFn: () => fetch(`/api/artworks/featured?limit=${limit}`).then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track viewing the recommendations section
  useEffect(() => {
    if (recommendations.length > 0) {
      recommendations.forEach(artwork => {
        trackInteraction(artwork.id, 'view', 2);
      });
    }
  }, [recommendations]);

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
      <div className={`space-y-6 ${className}`}>
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-96 mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <CardContent className="p-4 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Discovering Your Taste</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Browse some artworks to help us learn your preferences and provide personalized recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-800 text-center">{title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {recommendations.map((artwork, index) => {
          const isCardSelected = selectedCardId === artwork.id;
          
          const handleCardTap = () => {
            setSelectedCardId(isCardSelected ? null : artwork.id);
          };
          
          const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
            e.stopPropagation();
            const isMobile = window.matchMedia('(max-width: 767px)').matches;
            
            if (isMobile && !isCardSelected) {
              setSelectedCardId(artwork.id);
            } else {
              setSelectedArtwork(artwork);
            }
          };
          
          return (
            <Card 
              key={artwork.id} 
              className={`group overflow-hidden border-0 shadow-lg transition-all duration-500 transform bg-white relative md:hover:-translate-y-2 md:hover:shadow-xl ${isCardSelected ? 'shadow-xl' : ''}`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
              onMouseEnter={() => {
                trackInteraction(artwork.id, 'view', 3);
                setHoveredCardId(artwork.id);
              }}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={handleCardTap}
            >
              <div className="relative overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full cursor-pointer transition-all duration-500 ease-out"
                  style={{
                    aspectRatio: (hoveredCardId === artwork.id || isCardSelected) ? 'auto' : '1 / 1',
                    objectFit: (hoveredCardId === artwork.id || isCardSelected) ? 'contain' : 'cover',
                  }}
                  onClick={handleImageClick}
                  data-testid={`featured-artwork-image-${artwork.id}`}
                />
              </div>

              <div 
                className={`info-panel bg-white overflow-hidden transition-all duration-300 ease-out md:max-h-0 md:group-hover:max-h-48 border-t md:border-transparent md:group-hover:border-gray-100 ${isCardSelected ? 'max-h-48 border-gray-100' : 'max-h-0 border-transparent'}`}
                data-testid={`featured-info-panel-${artwork.id}`}
              >
                <div className="p-4 text-center">
                  <h3 className="text-gray-900 text-lg font-serif italic">{artwork.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {artwork.medium}, {artwork.year}
                  </p>
                  {artwork.dimensions && (
                    <p className="text-gray-500 text-xs mt-1">{artwork.dimensions}</p>
                  )}
                  <p className="text-gray-800 text-sm font-medium mt-2">
                    {artwork.status === 'available' && "Available"}
                    {artwork.status === 'sold' && "SOLD"}
                    {artwork.status === 'unavailable' && "Not For Sale"}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArtwork(artwork);
                    }}
                    className="text-[#b8860b] hover:text-[#9a7209] text-sm uppercase tracking-wide mt-3 inline-block transition duration-200"
                    data-testid={`featured-view-details-btn-${artwork.id}`}
                  >
                    View Details
                  </button>
                  {showReason && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                      <Eye className="h-3 w-3" />
                      <span>Matches your browsing preferences</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Link href="/gallery">
          <Button className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Explore More Art
          </Button>
        </Link>
      </div>

      {/* Artwork Detail Modal */}
      {selectedArtwork && (
        <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">{selectedArtwork.title}</DialogTitle>
              <p className="text-muted-foreground">{selectedArtwork.medium}, {selectedArtwork.year}</p>
            </DialogHeader>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedArtwork.imageUrl}
                  alt={selectedArtwork.title}
                  className="w-full h-auto rounded-md cursor-pointer"
                  onClick={() => setShowFullscreenImage(true)}
                  data-testid="featured-detail-image"
                />
                <p className="text-xs text-center text-neutral-500 mt-2">Click image to view fullscreen</p>
              </div>
              
              <div className="space-y-6">
                {selectedArtwork.description && (
                  <div>
                    <h3 className="font-medium text-lg mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{selectedArtwork.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <h3 className="text-sm text-muted-foreground">Dimensions</h3>
                    <p>{selectedArtwork.dimensions}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-muted-foreground">Category</h3>
                    <p className="capitalize">{selectedArtwork.category}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-muted-foreground">Medium</h3>
                    <p>{selectedArtwork.medium}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-muted-foreground">Year</h3>
                    <p>{selectedArtwork.year}</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-amber-900">Available</h4>
                      <p className="text-sm text-amber-700">This artwork is available for purchase</p>
                    </div>
                    <ProductLinkButton 
                      artwork={selectedArtwork} 
                      onNavigate={() => setSelectedArtwork(null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen Image Viewer */}
      {selectedArtwork && (
        <FullscreenImageViewer
          imageUrl={selectedArtwork.imageUrl}
          altText={`${selectedArtwork.title} - ${selectedArtwork.medium}`}
          isOpen={showFullscreenImage}
          onClose={() => setShowFullscreenImage(false)}
          fallbackCategory={selectedArtwork.category || 'default'}
          title={selectedArtwork.title}
          year={selectedArtwork.year}
          medium={selectedArtwork.medium}
        />
      )}
    </div>
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