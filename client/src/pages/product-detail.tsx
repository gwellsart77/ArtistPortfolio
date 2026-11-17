import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { ProductStructuredData } from "@/components/product-structured-data";
import { Link } from "wouter";
import { Plus, Minus, ChevronLeft } from "lucide-react";
import ArtworkLightbox from "@/components/artwork-lightbox";
import { thumbUrl } from "@/lib/cloudinary";
import { displayTitle, kindLabel, sizeLabel } from "@/lib/product-display";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function to extract dimensions from variant name
function extractDimensions(variantName: string): string {
  // Look for patterns like "20″×20″", "24″×30″", "16"×20"", etc.
  const dimensionMatch = variantName.match(/(\d+[″"]?\s*[×x]\s*\d+[″"]?)/i);
  return dimensionMatch?.[1] ?? variantName;
}

// Helper function to extract dimensions from description
function extractDimensionsFromDescription(description: string): string | null {
  // Look for patterns like "16"x20"", "16″×20″", "24"×30"", etc. in description
  const dimensionMatch = description.match(/(\d+[″"]?\s*[×x]\s*\d+[″"]?)/i);
  return dimensionMatch?.[1] ?? null;
}

export default function ProductDetail() {
  // ABSOLUTELY ALL HOOKS MUST BE CALLED FIRST - NO EXCEPTIONS
  const [location] = useLocation();
  const { toast: showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState(false);
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
    const price = selectedVariant ? selectedVariant.price : product.price;
    addItemWithQuantity(
      {
        id: product.id,
        title: product.title,
        description: product.description,
        price,
        imageUrl: product.imageUrl,
        type: product.type,
      },
      product.type === "originals" ? 1 : quantity
    );
    showToast({
      title: "Added to your cart",
      description:
        product.type === "originals"
          ? `${displayTitle(product.title)} is held in your cart for 15 minutes.`
          : `${displayTitle(product.title)} was added to your cart.`,
    });
    setJustAdded(true);
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
      <div className="container mx-auto px-5 lg:px-12 py-10 md:py-16">
        <Skeleton className="h-4 w-24 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          <Skeleton className="md:col-span-7 aspect-[4/5] w-full rounded-none" />
          <div className="md:col-span-5 space-y-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="container mx-auto px-5 py-24 text-center">
        <h1 className="font-serif text-3xl mb-3">This piece isn't available</h1>
        <p className="text-[#6e6a63] mb-8">It may have sold or been moved.</p>
        <Link href="/shop" className="inline-block border-b border-[#8b6b3e] pb-1 text-xs uppercase tracking-[0.14em]">
          Back to the shop
        </Link>
      </div>
    );
  }

  const title = displayTitle(product.title);
  const size = selectedVariant ? extractDimensions(selectedVariant.variant_name) : sizeLabel(product) || (product.type === "prints" ? extractDimensionsFromDescription(product.description || "") : null);
  const isOriginal = product.type === "originals";
  const inStock = (product.stock || 0) > 0;

  return (
    <div className="bg-[#f7f6f3]">
      <SEO
        title={`${title} | Gabe Wells`}
        description={product.description}
        ogType="product"
        ogImage={product.imageUrl}
      />
      <ProductStructuredData
        name={product.title}
        description={product.description}
        image={product.imageUrl}
        price={product.price}
        sku={`prod-${product.id}`}
      />

      <ArtworkLightbox
        artworks={[{
          id: product.id,
          title,
          description: product.description || "",
          category: product.type,
          year: "",
          medium: kindLabel(product),
          dimensions: size,
          imageUrl: product.imageUrl,
          status: inStock ? "available" : "sold",
          altText: title,
        }]}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        showDetailsButton={false}
      />

      <div className="container mx-auto px-5 lg:px-12 py-8 md:py-14">
        <Link href="/shop" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[#6e6a63] hover:text-[#1b1a18] transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Shop
        </Link>

        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Artwork */}
          <div className="md:col-span-7">
            <button
              type="button"
              onClick={() => setViewerIndex(0)}
              className="group block w-full bg-[#efede8] p-[6%] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e]"
              aria-label={`View ${title} full screen`}
            >
              <img
                src={thumbUrl(product.imageUrl, 1400)}
                alt={title}
                className="mx-auto max-h-[75vh] w-auto max-w-full object-contain shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                {...({ fetchpriority: "high" } as Record<string, string>)}
              />
            </button>
            <button
              type="button"
              onClick={() => setViewerIndex(0)}
              className="mt-3 text-xs uppercase tracking-[0.14em] text-[#6e6a63] hover:text-[#1b1a18] transition-colors"
            >
              View full screen
            </button>
          </div>

          {/* Details */}
          <div className="md:col-span-5 md:sticky md:top-28">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6e6a63]">{kindLabel(product)}</p>
            <h1 className="mt-2 font-serif text-4xl lg:text-5xl leading-tight text-[#1b1a18]">{title}</h1>
            {size && <p className="mt-3 text-sm text-[#6e6a63]">{size}</p>}
            <p className="mt-6 text-2xl text-[#1b1a18] tabular-nums">
              {formatCurrency(selectedVariant ? selectedVariant.price : product.price)}
            </p>

            {/* Size choice for prints with several sizes */}
            {product.variants && product.variants.length > 1 && (
              <div className="mt-6">
                <label className="block text-xs uppercase tracking-[0.14em] text-[#6e6a63] mb-2">Size</label>
                <Select
                  value={selectedVariant?.id.toString() || ""}
                  onValueChange={(value) => {
                    const variant = product.variants?.find((v) => v.id.toString() === value);
                    setSelectedVariant(variant || null);
                  }}
                >
                  <SelectTrigger className="w-full rounded-none bg-white">
                    <SelectValue placeholder="Select a size">
                      {selectedVariant && extractDimensions(selectedVariant.variant_name)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{extractDimensions(variant.variant_name)}</span>
                          <span className="ml-4 text-sm text-[#6e6a63]">{formatCurrency(variant.price)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {inStock ? (
              <div className="mt-8 space-y-4">
                {!isOriginal && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs uppercase tracking-[0.14em] text-[#6e6a63]">Quantity</span>
                    <div className="flex items-center border border-[#e3e0da] bg-white">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none" onClick={decreaseQuantity} disabled={quantity <= 1} aria-label="Fewer">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center tabular-nums">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none" onClick={increaseQuantity} disabled={quantity >= product.stock} aria-label="More">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full h-12 bg-[#1b1a18] hover:bg-black text-white text-xs uppercase tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e] focus-visible:ring-offset-2"
                  data-testid="add-to-cart"
                >
                  Add to cart
                </button>
                {justAdded && (
                  <p className="text-sm text-[#1b1a18]" role="status">
                    Added to your cart.{" "}
                    <Link href="/checkout" className="border-b border-[#8b6b3e] hover:text-[#8b6b3e]">Go to checkout</Link>
                  </p>
                )}
                {isOriginal && (
                  <p className="text-xs leading-relaxed text-[#6e6a63]">
                    One of a kind. Once added, it is held in your cart for 15 minutes.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-8 text-sm text-[#6e6a63]">{isOriginal ? "This piece has sold." : "Currently sold out."}</p>
            )}

            {product.description && (
              <div className="mt-10 pt-8 border-t border-[#e3e0da]">
                <p className="text-[15px] leading-relaxed text-[#3d3a35] whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#e3e0da] flex flex-col gap-3 text-sm">
              <Link href={`/contact?artwork=${encodeURIComponent(title)}`} className="text-[#1b1a18] hover:text-[#8b6b3e] transition-colors">
                Questions about this piece? Get in touch &rarr;
              </Link>
              <Link href="/shipping-returns" className="text-[#6e6a63] hover:text-[#1b1a18] transition-colors">
                Shipping &amp; returns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
