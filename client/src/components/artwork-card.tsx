import { useState, type MouseEvent } from "react";
import { Artwork } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import FullscreenImageViewer from "./fullscreen-image-viewer";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

// Interface for product data
interface ProductData {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  type: string;
  available: boolean;
  stock: number;
  artworkId: number | null;
}

// Component for smart product linking
const ProductLinkButton = ({ artwork }: { artwork: Artwork }) => {
  const { data: relatedProducts = [], isLoading } = useQuery<ProductData[]>({
    queryKey: [`/api/products/artwork/${artwork.id}`],
    enabled: true,
  });
  
  if (isLoading) {
    return (
      <a className="bg-[#b8860b] hover:bg-opacity-90 text-white px-4 py-2 text-sm uppercase tracking-wider transition duration-200 rounded-sm inline-flex items-center justify-center">
        <Skeleton className="h-4 w-24" />
      </a>
    );
  }

  // If no related products, link to shop with artwork filter
  if (!relatedProducts || relatedProducts.length === 0) {
    return (
      <a
        href={`/shop?artwork=${artwork.id}`}
        className="bg-[#b8860b] hover:bg-opacity-90 text-white px-4 py-2 text-sm uppercase tracking-wider transition duration-200 rounded-sm"
        aria-label={`View ${artwork.title} in shop`}
      >
        View in Shop
      </a>
    );
  }
  
  // If only one related product, link directly to that product
  if (relatedProducts.length === 1) {
    return (
      <a
        href={`/shop/product/${relatedProducts[0]?.id}`}
        className="bg-[#b8860b] hover:bg-opacity-90 text-white px-4 py-2 text-sm uppercase tracking-wider transition duration-200 rounded-sm"
        aria-label={`View ${artwork.title} as product`}
      >
        View Product
      </a>
    );
  }
  
  // If multiple related products, link to shop with artwork filter
  return (
    <a
      href={`/shop?artwork=${artwork.id}`}
      className="bg-[#b8860b] hover:bg-opacity-90 text-white px-4 py-2 text-sm uppercase tracking-wider transition duration-200 rounded-sm"
      aria-label={`View ${artwork.title} products`}
    >
      View Products
    </a>
  );
}

interface ArtworkCardProps {
  artwork: Artwork;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Fetch products related to this artwork when the detail dialog is opened  
  const { data: _relatedProducts } = useQuery({
    queryKey: [`/api/products/artwork/${artwork.id}`],
    enabled: showDetails, // Only fetch when the dialog is open
  });

  const handleCardTap = () => {
    setIsSelected(!isSelected);
  };

  const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    // On mobile (when no hover is available), first tap shows info, second tap opens fullscreen
    // Check if info panel is already visible (isSelected on mobile, or always on desktop via hover)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    
    if (isMobile && !isSelected) {
      // First tap on mobile: show info panel
      setIsSelected(true);
    } else {
      // Second tap on mobile OR any click on desktop: open fullscreen
      setShowFullscreenImage(true);
    }
  };

  return (
    <>
      <div
        className={`gallery-item group relative cursor-pointer overflow-hidden rounded-sm ${isSelected ? 'shadow-lg' : ''}`}
        onClick={handleCardTap}
      >
        {/* Image */}
        <img
          src={artwork.imageUrl}
          alt={`${artwork.title} - ${artwork.medium}`}
          className={`w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02] ${
            artwork.status !== 'available' ? 'opacity-90' : ''
          } cursor-pointer`}
          onClick={handleImageClick}
          onError={(e) => {
            console.error("Image failed to load:", artwork.imageUrl);
            e.currentTarget.onerror = null;
            e.currentTarget.src = `/fallback-${artwork.category || 'default'}.svg`;
          }}
          data-testid={`artwork-image-${artwork.id}`}
        />

        {/* Hover overlay — fades in on hover or tap */}
        <div
          className={`info-panel absolute inset-0 flex flex-col items-center justify-end pb-5 px-4
            bg-gradient-to-t from-black/75 via-black/30 to-transparent
            transition-opacity duration-300
            md:opacity-0 md:group-hover:opacity-100
            ${isSelected ? 'opacity-100' : 'opacity-0'}
          `}
          data-testid={`artwork-info-panel-${artwork.id}`}
        >
          <h3 className="text-white text-base font-serif italic text-center leading-snug drop-shadow">
            {artwork.title}
          </h3>
          <p className="text-white/75 text-xs mt-1 text-center">
            {artwork.medium}{artwork.year ? `, ${artwork.year}` : ''}
          </p>
          {artwork.status === 'sold' && (
            <span className="mt-2 text-xs uppercase tracking-widest text-red-300">Sold</span>
          )}
          {artwork.status === 'available' && (
            <span className="mt-2 text-xs uppercase tracking-widest text-[#e8c46a]">Available</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}
            className="mt-3 px-4 py-1 text-xs tracking-widest uppercase border border-white/60 text-white hover:bg-white hover:text-neutral-900 transition-all duration-200 rounded-full"
            data-testid={`view-details-btn-${artwork.id}`}
          >
            View Details
          </button>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={(open) => {
        setShowDetails(open);
        if (!open) setIsDescriptionExpanded(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto touch-pan-y overscroll-contain">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4 flex items-center gap-2 text-neutral-600 hover:text-neutral-900 z-10"
              data-testid="back-to-gallery-btn"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Gallery</span>
            </Button>
          </DialogClose>
          <DialogHeader className="pt-8">
            <DialogTitle className="text-2xl font-serif">
              {artwork.title}
            </DialogTitle>
            <DialogDescription className="text-neutral-600">
              {artwork.medium}, {artwork.year}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={artwork.imageUrl}
                alt={`${artwork.title} - ${artwork.medium}`}
                className="w-full h-auto rounded-md cursor-pointer"
                onClick={() => setShowFullscreenImage(true)}
                onError={(e) => {
                  console.error("Dialog image failed to load:", artwork.imageUrl);
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `/fallback-${artwork.category || 'default'}.svg`;
                }}
              />
              <p className="text-xs text-center text-neutral-500 mt-2">Click image to view fullscreen</p>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">
                  Description
                </h4>
                {artwork.description && artwork.description.length > 150 ? (
                  <div className="mt-1">
                    <p>
                      {isDescriptionExpanded 
                        ? artwork.description 
                        : `${artwork.description.slice(0, 150)}...`}
                    </p>
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-[#b8860b] hover:text-[#9a7209] text-sm mt-1 inline-block transition duration-200"
                      data-testid="read-more-btn"
                    >
                      {isDescriptionExpanded ? 'Show less' : 'Read more...'}
                    </button>
                  </div>
                ) : (
                  <p className="mt-1">{artwork.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {artwork.dimensions && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">
                      Dimensions
                    </h4>
                    <p className="mt-1">{artwork.dimensions}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">
                    Category
                  </h4>
                  <p className="mt-1 capitalize">{artwork.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">
                    Medium
                  </h4>
                  <p className="mt-1">{artwork.medium}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Year</h4>
                  <p className="mt-1">{artwork.year}</p>
                </div>
              </div>
              {artwork.status === 'available' ? (
                <Card className="border-[#b8860b] bg-[#f8f5f2]">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium">
                          Available
                        </h4>
                        <p className="text-sm text-neutral-600">
                          This artwork is available for purchase
                        </p>
                      </div>
                      <ProductLinkButton artwork={artwork} />
                    </div>
                  </CardContent>
                </Card>
              ) : artwork.status === 'sold' ? (
                <Card className="border-red-500 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium">
                          Sold
                        </h4>
                        <p className="text-sm text-neutral-600">
                          This artwork is no longer available
                        </p>
                      </div>
                      <div className="bg-red-600 text-white px-4 py-2 text-sm uppercase font-bold rounded-sm">
                        Sold
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-500 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium">
                          Not For Sale
                        </h4>
                        <p className="text-sm text-neutral-600">
                          This artwork is displayed for viewing only
                        </p>
                      </div>
                      <div className="bg-amber-600 text-white px-4 py-2 text-sm uppercase font-bold rounded-sm">
                        Unavailable
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        imageUrl={artwork.imageUrl}
        altText={`${artwork.title} - ${artwork.medium}`}
        isOpen={showFullscreenImage}
        onClose={() => setShowFullscreenImage(false)}
        fallbackCategory={artwork.category || 'default'}
        title={artwork.title}
        year={artwork.year}
        medium={artwork.medium}
      />
    </>
  );
}
