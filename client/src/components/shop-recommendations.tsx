import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, TrendingUp, Eye, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  type: string;
  subtype: string | null;
  featured: boolean;
  available: boolean;
}

interface ShopRecommendationsProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showReason?: boolean;
  className?: string;
}

export function ShopRecommendations({ 
  title = "Recommended Products",
  subtitle = "Handpicked items based on your browsing preferences",
  limit = 6,
  showReason = false,
  className = ""
}: ShopRecommendationsProps) {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured", limit],
    queryFn: () => fetch(`/api/products/featured?limit=${limit}`).then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            {title}
          </h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">No products available at the moment.</p>
        </div>
      </div>
    );
  }

  const getRecommendationReason = (product: Product) => {
    const reasons = [
      "Trending in your style",
      "Perfect for your budget", 
      "Popular this week",
      "Based on your views",
      "Recommended for you"
    ];
    return reasons[product.id % reasons.length];
  };

  const getRecommendationIcon = (product: Product) => {
    const icons = [TrendingUp, Heart, ShoppingBag, Eye, Sparkles];
    const IconComponent = icons[product.id % icons.length];
    return <IconComponent className="h-3 w-3" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-center">
          {title}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.slice(0, limit).map((product) => (
          <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <Link href={`/product/${product.id}`}>
              <div className="relative overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Art Shop-style hover overlay with product details */}
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
              
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg group-hover:text-gray-900 transition-colors line-clamp-2">
                  {product.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                  {product.available && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Available
                    </Badge>
                  )}
                </div>

                {showReason && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      {getRecommendationIcon(product)}
                      <span>{getRecommendationReason(product)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link href="/shop">
          <Button className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Explore Our Shop
          </Button>
        </Link>
      </div>
    </div>
  );
}