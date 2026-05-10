import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { ArtworkPurchaseOptions } from '@/components/artwork-purchase-options';
import { ArtworkCheckout } from '@/components/checkout-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Home, ArrowLeft } from 'lucide-react';
import { SimilarArtworks } from '@/components/art-recommendations';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

type PurchaseMode = 'browse' | 'original' | 'limited-edition' | 'digital';
type LicenseType = 'personal' | 'commercial';

export default function ArtworkDetailPage() {
  const [galleryMatch, galleryParams] = useRoute('/gallery/:id');
  const [artworkMatch, artworkParams] = useRoute('/artwork/:id');
  const [, navigate] = useLocation();
  
  // Use whichever route matched
  const params = galleryParams || artworkParams;
  
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('browse');
  const [licenseType, setLicenseType] = useState<LicenseType>('personal');
  
  // Fetch artwork details
  const { data: artwork, isLoading, error } = useQuery({
    queryKey: ['/api/artworks', params?.id],
    queryFn: () => fetch(`/api/artworks/${params?.id}`).then(res => res.json()),
    enabled: !!params?.id,
  });

  // Track artwork viewing for personalized recommendations
  useEffect(() => {
    if (artwork && params?.id) {
      const trackView = async () => {
        try {
          await apiRequest("POST", "/api/recommendations/track", {
            body: JSON.stringify({
              artworkId: parseInt(params.id),
              interactionType: 'view',
              timeSpent: 5 // Initial view tracking
            })
          });
        } catch (error) {
          console.error("Error tracking artwork view:", error);
        }
      };

      // Track initial view after a short delay
      const timer = setTimeout(trackView, 2000);
      return () => clearTimeout(timer);
    }
  }, [artwork, params?.id]);
  
  // Handle purchase option selection
  const handlePurchaseOriginal = () => {
    setPurchaseMode('original');
    window.scrollTo(0, 0);
  };
  
  const handlePurchaseLimitedEdition = () => {
    setPurchaseMode('limited-edition');
    window.scrollTo(0, 0);
  };
  
  const handlePurchaseDigital = (type: LicenseType) => {
    setLicenseType(type);
    setPurchaseMode('digital');
    window.scrollTo(0, 0);
  };
  
  const handleBackToBrowse = () => {
    setPurchaseMode('browse');
    window.scrollTo(0, 0);
  };
  
  if (!params?.id) {
    return <div>Artwork not found</div>;
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-square rounded-md" />
          
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !artwork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Artwork</h2>
          <p className="mb-6 text-muted-foreground">
            We couldn't load the artwork details. Please try again later.
          </p>
          <Button onClick={() => navigate('/gallery')}>
            Back to Gallery
          </Button>
        </Card>
      </div>
    );
  }
  
  // Purchase mode - show checkout form
  if (purchaseMode !== 'browse') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={handleBackToBrowse} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Artwork
        </Button>
        
        <div className="max-w-2xl mx-auto">
          <ArtworkCheckout 
            purchaseType={purchaseMode} 
            artwork={artwork} 
            licenseType={licenseType}
          />
        </div>
      </div>
    );
  }
  
  // Normal browsing mode
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/gallery">Gallery</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/gallery/${artwork.category}`}>{artwork.category}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{artwork.title}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Artwork Image */}
        <div>
          <div className="rounded-md overflow-hidden border shadow-sm">
            <img 
              src={artwork.imageUrl} 
              alt={artwork.title} 
              className="w-full h-auto object-cover aspect-square"
            />
          </div>
        </div>
        
        {/* Artwork Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{artwork.title}</h1>
            <div className="flex items-center space-x-2 mb-4">
              <p className="text-muted-foreground">{artwork.year}</p>
              {artwork.featured && (
                <Badge variant="secondary">Featured</Badge>
              )}
              {artwork.status === 'sold' && (
                <Badge variant="destructive">Sold</Badge>
              )}
              {artwork.status === 'unavailable' && (
                <Badge variant="outline" className="border-amber-500 text-amber-700">Not For Sale</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 mb-6">
              <div>
                <h3 className="text-sm text-muted-foreground">Medium</h3>
                <p>{artwork.medium}</p>
              </div>
              
              <div>
                <h3 className="text-sm text-muted-foreground">Dimensions</h3>
                <p>{artwork.dimensions}</p>
              </div>
              
              <div>
                <h3 className="text-sm text-muted-foreground">Category</h3>
                <p>{artwork.category}</p>
              </div>
              
              {artwork.isLimitedEdition && artwork.editionSize && (
                <div>
                  <h3 className="text-sm text-muted-foreground">Edition</h3>
                  <p>
                    {artwork.editionsSold} / {artwork.editionSize} sold
                  </p>
                </div>
              )}
            </div>
            
            <p className="mb-6">{artwork.description}</p>
            
            {artwork.available && (
              <div className="text-2xl font-semibold mb-4">
                {formatCurrency(artwork.price)}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Purchase Options Component */}
          <ArtworkPurchaseOptions
            artwork={artwork}
            onPurchaseOriginal={handlePurchaseOriginal}
            onPurchaseLimitedEdition={handlePurchaseLimitedEdition}
            onPurchaseDigital={handlePurchaseDigital}
          />
        </div>
      </div>
      
      {/* Personalized "Because you viewed" Recommendations */}
      {artwork && (
        <div className="mt-16 px-4">
          <SimilarArtworks 
            artworkId={artwork.id}
            artworkTitle={artwork.title}
            limit={4}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100"
          />
        </div>
      )}
    </div>
  );
}