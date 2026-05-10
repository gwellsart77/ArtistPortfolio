import { useState } from "react";
import { useLocation } from "wouter";
import { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShoppingCart, Eye, X } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [, navigate] = useLocation();
  const addItemWithQuantity = useCart((state) => state.addItemWithQuantity);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to product detail page when clicking add to cart
    
    // Add the selected quantity of items all at once
    addItemWithQuantity(
      {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      quantity
    );

    toast({
      title: "Added to cart",
      description: `${quantity} ${quantity === 1 ? 'item' : 'items'} of ${product.title} added to your cart.`,
    });
    
    // Reset quantity to 1 after adding to cart
    setQuantity(1);
  };

  const handleViewDetails = () => {
    navigate(`/shop/product/${product.id}`);
  };

  // Removed unused handlers: decreaseQuantity, increaseQuantity, handleImageClick for type safety
  
  return (
    <>
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
      
      <Card 
        className="art-card bg-white group overflow-hidden shadow-md cursor-pointer transform transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
        onClick={handleViewDetails}
      >
        <div className="overflow-hidden relative">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-auto transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
          />
          {/* Featured Products-style hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="text-center text-white p-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-2 mb-2 inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">View Details</span>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-2 inline-flex items-center gap-2">
                <span className="text-sm">🔍 Zoom</span>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          {/* Product Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
            {product.title}
          </h3>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">
              {formatCurrency(product.price)}
            </span>
            {product.stock > 0 && (
              <span className={`text-xs ${product.type === 'originals' ? 'text-emerald-600' : 'text-neutral-500'} font-medium`}>
                {product.type === 'originals' ? 'Original Artwork' : 
                 product.type === 'prints' ? (product.subtype === 'canvas' ? 'Canvas Print' : 'Art Print') : 
                 product.type === 'merchandise' ? 'Merchandise' : 
                 product.type.charAt(0).toUpperCase() + product.type.slice(1)}
              </span>
            )}
          </div>
          
          {/* Show dimensions for Original Artwork */}
          {product.type === 'originals' && product.height && product.width && (
            <div className="mb-3">
              <span className="text-sm text-neutral-600">
                {product.height}" × {product.width}"
              </span>
            </div>
          )}
          

          
          {/* Quantity selector and add to cart */}
          {product.stock > 0 ? (
            <div className="flex flex-col space-y-3">
              {/* Quantity selector removed */}
              
              <Button
                onClick={handleAddToCart}
                className="w-full bg-primary hover:bg-[#b8860b] text-white py-2 text-xs uppercase tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <ShoppingCart className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                Add to Cart
              </Button>
            </div>
          ) : (
            <Button
              disabled
              className="w-full bg-neutral-200 text-neutral-600 py-2 text-xs uppercase tracking-wide"
            >
              Sold Out
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}