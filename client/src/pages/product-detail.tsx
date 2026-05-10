import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { ProductStructuredData } from "@/components/product-structured-data";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ArrowLeft, Home, ShoppingCart, Plus, Minus, ChevronLeft, Clock, AlertTriangle, Maximize2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useArtworkTheme } from "@/hooks/use-artwork-theme";
import { ExpandableText } from "@/components/expandable-text";

// Helper function to extract dimensions from variant name
function extractDimensions(variantName: string): string {
  // Look for patterns like "20″×20″", "24″×30″", "16"×20"", etc.
  const dimensionMatch = variantName.match(/(\d+[″"]?\s*[×x]\s*\d+[″"]?)/i);
  return dimensionMatch ? dimensionMatch[1] : variantName;
}

// Helper function to extract dimensions from description
function extractDimensionsFromDescription(description: string): string | null {
  // Look for patterns like "16"x20"", "16″×20″", "24"×30"", etc. in description
  const dimensionMatch = description.match(/(\d+[″"]?\s*[×x]\s*\d+[″"]?)/i);
  return dimensionMatch ? dimensionMatch[1] : null;
}

export default function ProductDetail() {
  // ABSOLUTELY ALL HOOKS MUST BE CALLED FIRST - NO EXCEPTIONS
  const [location, navigate] = useLocation();
  const { toast: showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [showTimeLimitDialog, setShowTimeLimitDialog] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const addItemWithQuantity = useCart((state) => state.addItemWithQuantity);
  
  // Extract ID from URL - this must be consistent
  const id = parseInt(location.split("/").pop() || "0");
  
  // Data fetching - this hook must always be called
  const { data: productData, isLoading, error } = useQuery<Product & { variants?: any[] }>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });
  
  // Effects - these must always be called in the same order
  useEffect(() => {
    if (productData?.variants && productData.variants.length > 0 && !selectedVariant) {
      const defaultVariant = productData.variants.find(v => v.is_default) || productData.variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [productData?.variants, selectedVariant]);
  
  // REMOVED useArtworkTheme hook to eliminate potential source of hook ordering issues
  
  // All hooks are now complete - safe to use data
  const product = productData;
  
  // Handle adding to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    // If this is an original painting, show time limit dialog and reserve it
    if (product.type === 'Original Paintings') {
      // Make a reservation call to the server
      fetch('/api/cart/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product.id })
      })
      .then(response => response.json())
      .catch(error => {
        console.error('Error reserving painting:', error);
      });
      
      // Add to cart
      addItemWithQuantity(
        {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          type: product.type, 
        },
        quantity
      );
      
      // Show time limit dialog
      setShowTimeLimitDialog(true);
      
      // Show toast notification as well
      showToast({
        title: "⏱️ Time-Limited Addition!",
        description: `"${product.title}" added to your cart. You have 15 minutes to complete your purchase.`,
      });
    } else {
      // Regular products without time limit
      addItemWithQuantity(
        {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          type: product.type,
        },
        quantity
      );
      
      // Regular toast for non-original items
      showToast({
        title: "Added to cart",
        description: `${quantity} ${quantity === 1 ? 'item' : 'items'} of ${product.title} added to your cart.`,
      });
    }
    
    // Reset quantity to 1 after adding to cart
    setQuantity(1);
  };

  // Handle quantity changes
  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    // Don't let users select more than available stock
    if (product) {
      setQuantity((prev) => Math.min(product.stock || 99, prev + 1));
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate("/shop")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] w-full rounded-md" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
            <p className="text-neutral-600 mb-8">We couldn't find the product you're looking for.</p>
            <Button onClick={() => navigate("/shop")}>
              Back to Shop
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Theme functionality temporarily removed to fix critical purchase system error

  return (
    <div className="container mx-auto px-6 py-16 bg-[#f8f5f2] product-detail-section">
      <SEO
        title={`${product.title} | Art Shop`}
        description={product.description}
        ogType="product"
      />
      <ProductStructuredData
        name={product.title}
        description={product.description}
        image={product.imageUrl}
        price={product.price}
        sku={`prod-${product.id}`}
      />
      
      {/* Time Limit Dialog */}
      <Dialog open={showTimeLimitDialog} onOpenChange={setShowTimeLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-700 text-xl">
              <Clock className="h-6 w-6 mr-2 animate-pulse" />
              Original Painting Time Limit
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              <div className="space-y-4">
                <p><strong>Important:</strong> You've added an original painting to your cart!</p>
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <p className="font-semibold text-amber-800 mb-2">⏱️ 15-Minute Time Limit</p>
                  <p className="text-amber-700">
                    Original paintings are reserved for you for only <strong>15 minutes</strong>. 
                    If checkout is not completed in that time, the painting will be automatically 
                    removed from your cart and made available to other customers.
                  </p>
                </div>
                <p>
                  This prevents items from being locked indefinitely and gives everyone 
                  a fair chance to purchase one-of-a-kind artworks.
                </p>
                <p className="font-medium">
                  A countdown timer is visible in your cart to help you keep track of the remaining time.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-4">
            <Button 
              variant="secondary"
              className="sm:w-auto w-full"
              onClick={() => {
                setShowTimeLimitDialog(false);
                navigate("/shop");
              }}
            >
              Continue Shopping
            </Button>
            <Button 
              className="sm:w-auto w-full bg-amber-700 hover:bg-amber-800"
              onClick={() => {
                setShowTimeLimitDialog(false);
                navigate("/checkout");
              }}
            >
              Proceed to Checkout Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Zoom Modal */}
      <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
        <DialogContent className="sm:max-w-4xl max-h-screen overflow-y-auto">
          <div className="relative">
            <Button 
              className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
              variant="ghost"
              size="icon"
              onClick={() => setImageZoomOpen(false)}
            >
              <X className="h-5 w-5 text-white" />
            </Button>
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-auto object-contain max-h-[80vh]"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate("/shop")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-serif">Back to Shop</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative group">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-auto rounded-md shadow-md cursor-pointer"
              onClick={() => setImageZoomOpen(true)}
            />
            <Button 
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 hover:bg-black/70"
              variant="ghost"
              size="icon"
              onClick={() => setImageZoomOpen(true)}
            >
              <Maximize2 className="h-5 w-5 text-white" />
            </Button>

          </div>
          
          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif mb-4">{product.title}</h2>
              <ExpandableText 
                text={product.description || ""} 
                maxLength={150}
                className="text-neutral-700 mb-6"
              />
              <div className="text-2xl font-medium mb-8">
                {formatCurrency(selectedVariant ? selectedVariant.price : product.price)}
              </div>
              
              {/* Size Selection/Display */}
              {product.variants && product.variants.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Size:</label>
                  <Select
                    value={selectedVariant?.id.toString() || ""}
                    onValueChange={(value) => {
                      const variant = product.variants?.find(v => v.id.toString() === value);
                      setSelectedVariant(variant || null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a size">
                        {selectedVariant && extractDimensions(selectedVariant.variant_name)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id.toString()}>
                          <div className="flex justify-between items-center w-full">
                            <span>{extractDimensions(variant.variant_name)}</span>
                            <span className="ml-4 text-sm text-gray-600">
                              {formatCurrency(variant.price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Size Display for Single Variant or Prints */}
              {((product.variants && product.variants.length === 1) || 
                (product.type === 'prints' && (!product.variants || product.variants.length === 0))) && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Size:</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                    {product.variants && product.variants.length === 1 
                      ? extractDimensions(product.variants[0].variant_name)
                      : product.height && product.width 
                        ? `${product.height}" × ${product.width}"`
                        : extractDimensionsFromDescription(product.description || '') || "Standard Size"
                    }
                  </div>
                </div>
              )}
            </div>
            
            {product.stock > 0 ? (
              <div className="space-y-6">
                {/* Quantity Selector - Only show for prints and merchandise */}
                {product.type !== 'originals' ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center border border-neutral-300 rounded">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={increaseQuantity}
                        disabled={quantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Original Artwork Badge - Only shown for original paintings */}
                    <div className="text-sm font-medium text-emerald-700">
                      Original Artwork (One of a Kind)
                    </div>
                    
                    {/* Size Information for Original Artwork */}
                    {product.height && product.width && (
                      <div className="text-sm">
                        <span className="font-medium">Size: </span>
                        <span>{product.width}" × {product.height}"</span>
                      </div>
                    )}
                    
                    {/* Time Limit Warning Box - Only for original artwork */}
                    <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-md mt-4">
                      <div className="flex items-center gap-2 text-amber-800 font-bold">
                        <Clock className="h-5 w-5 animate-pulse" />
                        <span className="text-lg">15-MINUTE TIME LIMIT!</span>
                      </div>
                      <p className="mt-2 text-amber-700">
                        Original paintings have a <b>15-minute purchase window</b> once added to cart. 
                        After this time, the painting will be automatically removed from your cart and made 
                        available to other customers.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-12 bg-[#b8860b] hover:bg-opacity-90 text-white py-3 text-sm uppercase tracking-wide transition duration-200"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-red-600 font-medium">
                  This product is currently out of stock.
                </div>
                <Button
                  disabled
                  className="w-full h-12 bg-neutral-200 text-neutral-600 py-3 text-sm uppercase tracking-wide"
                >
                  Sold Out
                </Button>
              </div>
            )}
            
            {/* Product Category Label */}
            <div className="py-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Category:</span>
                <span className="text-sm font-medium">
                  {product.type === 'Original Paintings' ? 'Original Artwork (One of a Kind)' : 
                   product.type === 'Canvas Prints' ? 'Canvas Print' :
                   product.type === 'Prints' ? 'Art Print' :
                   product.type === 'Digital Downloads' ? 'Digital Download' :
                   product.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}