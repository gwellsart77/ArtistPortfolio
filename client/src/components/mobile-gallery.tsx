import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, Share2, ArrowLeft, ArrowRight } from "lucide-react";
import { LazyImage } from "@/components/lazy-image";
import type { Artwork } from "@shared/schema";

interface MobileGalleryProps {
  artworks: Artwork[];
  selectedIndex?: number;
  onClose?: () => void;
}

export function MobileGallery({ artworks, selectedIndex = 0 }: MobileGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const currentArtwork = artworks[currentIndex];

  useEffect(() => {
    // Enable touch gestures
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging || !e.changedTouches[0]) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Check if it's a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        } else if (deltaX < 0 && currentIndex < artworks.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }
      
      isDragging = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, artworks.length]);

  const nextArtwork = () => {
    setCurrentIndex(prev => (prev + 1) % artworks.length);
  };

  const prevArtwork = () => {
    setCurrentIndex(prev => (prev - 1 + artworks.length) % artworks.length);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!currentArtwork) return null;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <div className="relative">
        {/* Image Container */}
        <div 
          className={`relative ${isFullscreen ? 'h-screen' : 'h-[60vh]'} touch-pan-x`}
          onClick={toggleFullscreen}
        >
          <LazyImage
            src={currentArtwork.imageUrl}
            alt={currentArtwork.altText || currentArtwork.title}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation Overlay */}
          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                prevArtwork();
              }}
              disabled={currentIndex === 0}
              className="pointer-events-auto bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                nextArtwork();
              }}
              disabled={currentIndex === artworks.length - 1}
              className="pointer-events-auto bg-white/80 backdrop-blur-sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Top Overlay - Close and Info */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
                className="pointer-events-auto bg-white/80 backdrop-blur-sm"
              >
                Exit
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="pointer-events-auto bg-white/80 backdrop-blur-sm"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="pointer-events-auto bg-white/80 backdrop-blur-sm"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 pointer-events-none">
            {artworks.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Artwork Info */}
        {!isFullscreen && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{currentArtwork.title}</h3>
                  <p className="text-sm text-gray-600">
                    {currentArtwork.dimensions || 'Dimensions available on request'}
                  </p>
                </div>
                <Badge variant="secondary">
                  {currentIndex + 1} of {artworks.length}
                </Badge>
              </div>
              
              {currentArtwork.description && (
                <p className="text-sm text-gray-700 mb-3">
                  {currentArtwork.description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}