import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminNavigationGuard } from "@/lib/admin-navigation-guard";
import { Artwork } from "@shared/schema";
import ArtworkCard from "@/components/artwork-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo";
import { ArtworkStructuredData } from "@/components/structured-data";


type Category = string;

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState<Category>("imaginative-realism");

  // Check for pending admin changes on component mount and force refresh if needed
  useEffect(() => {
    if (adminNavigationGuard.hasPendingChanges()) {
      console.log('🔄 Gallery detected pending admin changes, refreshing data...');
      adminNavigationGuard.handleNavigation('/admin/', '/gallery');
    }
  }, []);

  // Check if gallery page is enabled - default to enabled if setting doesn't exist
  const { data: galleryPageEnabledData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/gallery_page_enabled"],
    retry: false, // Don't retry if setting doesn't exist
  });

  const { data: artworks, isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks"],
  });
  
  const { data: galleryDescription } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/gallery_description"],
  });
  
  const { data: galleryCategoriesData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/gallery_categories"],
  });
  
  const { data: galleriesDisplayCountData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/galleries_display_count"],
  });
  
  const { data: galleryLayoutData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/gallery_layout"],
  });
  
  // Parse the gallery categories from settings
  const galleryCategories = React.useMemo(() => {
    if (galleryCategoriesData?.value) {
      try {
        const categories = JSON.parse(galleryCategoriesData.value);
        if (Array.isArray(categories) && categories.length > 0) {
          return categories;
        }
      } catch (e) {
        console.error("Error parsing gallery categories:", e);
      }
    }
    // Default categories if none found
    return ["featured", "imaginative-realism", "sculpture", "murals", "figurative", "chinese-zodiac-series", "vinyl-record-art"];
  }, [galleryCategoriesData]);
  
  // Get the display count from settings
  const displayCount = React.useMemo(() => {
    if (galleriesDisplayCountData?.value) {
      const count = parseInt(galleriesDisplayCountData.value);
      if (!isNaN(count) && count > 0) {
        return count;
      }
    }
    return 5; // Default to showing 5 categories
  }, [galleriesDisplayCountData]);
  
  // Get the layout preference from settings
  const layoutPreference = React.useMemo(() => {
    return galleryLayoutData?.value || "grid"; // Default to grid layout
  }, [galleryLayoutData]);



  const filteredArtworks = React.useMemo(() => {
    if (!artworks) return undefined;
    
    const filtered = artworks.filter((artwork) => 
      activeCategory === "featured" ? artwork.featured === true : artwork.category === activeCategory
    );
    
    // Sort by displayOrder to ensure proper ordering
    return filtered.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [artworks, activeCategory]);

  // Create a collection of structured data for artworks
  const renderArtworkStructuredData = () => {
    if (!artworks || artworks.length === 0) return null;
    
    // Only include up to 5 artworks for structured data to avoid bloating the page
    return artworks.slice(0, 5).map((artwork, index) => (
      <ArtworkStructuredData
        key={index}
        name={artwork.title}
        description={artwork.description}
        image={artwork.imageUrl}
        creator="Gabe Wells"
        dateCreated={artwork.year}
        artMedium={artwork.medium}
        width={artwork.dimensions ? artwork.dimensions.split('x')[0]?.trim() || "Unknown" : "Unknown"}
        height={artwork.dimensions && artwork.dimensions.split('x')[1] ? artwork.dimensions.split('x')[1]?.trim() || "Unknown" : "Unknown"}
      />
    ));
  };

  // If gallery page is explicitly disabled, show not found message
  // Default to enabled (true) if setting doesn't exist
  const isGalleryEnabled = galleryPageEnabledData?.value !== 'false';
  
  if (!isGalleryEnabled) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-serif text-neutral-800 mb-4">Gallery Not Available</h1>
          <p className="text-lg text-neutral-600 mb-8">
            The gallery is currently unavailable. Please check back later or visit our other pages.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f5f3ef]">
      <SEO
        title="Gallery of Original Oil Paintings | Gabe Wells Fine Art"
        description="Browse Gabe Wells' complete gallery of original oil paintings and acrylic artworks. Contemporary magical imaginary realism fine art."
        canonicalUrl="https://gabewells.com/gallery"
      />
      {renderArtworkStructuredData()}

      {/* Minimal page header */}
      <div className="container mx-auto px-6 lg:px-12 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif text-neutral-800 tracking-wide">Gallery</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {galleryDescription?.value || "Original works — oil on canvas, acrylic, and mixed media"}
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            {galleryCategories.slice(0, displayCount).map((category) => {
              const displayName = category.split('-')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-xs tracking-widest uppercase transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? "text-[#b8860b] font-medium"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thin divider */}
        <div className="w-full h-px bg-neutral-200 mt-4"></div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-6 lg:px-12 pb-16">
        <div className={
          layoutPreference === "masonry"
            ? "columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4"
            : "columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4"
        }>
          {isLoading
            ? Array(9)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="break-inside-avoid mb-4">
                    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-sm shadow-sm">
                      <Skeleton className="h-[320px] w-full" />
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  </div>
                ))
            : filteredArtworks && filteredArtworks.length > 0 ? (
                filteredArtworks.map((artwork) => (
                  <div key={artwork.id} className="break-inside-avoid mb-4">
                    <ArtworkCard artwork={artwork} />
                  </div>
                ))
              ) : (
                !isLoading && (
                  <div className="col-span-full text-center py-20">
                    <p className="text-neutral-400 text-sm tracking-wide uppercase">
                      No works found in this collection
                    </p>
                  </div>
                )
              )}
        </div>
      </div>
    </section>
  );
}
