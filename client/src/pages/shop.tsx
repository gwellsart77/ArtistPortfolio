import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminNavigationGuard } from "@/lib/admin-navigation-guard";
import { useLocation } from "wouter";
import { Product } from "@shared/schema";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { ProductStructuredData } from "@/components/product-structured-data";

type ProductType = "originals" | "prints" | "merchandise";
type PrintSubtype = "paper" | "canvas" | "framed" | "limited_edition";

export default function Shop() {
  const [activeType, setActiveType] = useState<ProductType>("originals");
  const [activePrintSubtype, setActivePrintSubtype] = useState<PrintSubtype>("paper");
  const [activeOriginalSubtype, setActiveOriginalSubtype] = useState<string>("paintings");
  const [activeMerchandiseSubtype, setActiveMerchandiseSubtype] = useState<string>("prints");
  const [, navigate] = useLocation();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const artworkId = searchParams ? searchParams.get("artwork") : null;

  // Check for pending admin changes on component mount and force refresh if needed
  useEffect(() => {
    if (adminNavigationGuard.hasPendingChanges()) {
      console.log('🔄 Shop detected pending admin changes, refreshing data...');
      adminNavigationGuard.handleNavigation('/admin/', '/shop');
    }
  }, []);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [maxPrice, setMaxPrice] = useState(1000);

  // Shop description from settings
  const { data: shopDescriptionData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_description"],
  });

  // Query for products, potentially filtered by artwork
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: artworkId ? ["/api/products", { artworkId }] : ["/api/products"],
  });

  // Calculate max price and available sizes from products
  useEffect(() => {
    if (products && products.length > 0) {
      const prices = products.map(p => p.price || 0);
      const calculatedMaxPrice = Math.max(...prices);
      setMaxPrice(calculatedMaxPrice);
      if (priceRange[1] === 1000) {
        setPriceRange([0, calculatedMaxPrice]);
      }
    }
  }, [products]);

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    if (!products) return undefined;

    return products.filter(product => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = product.title?.toLowerCase().includes(searchLower);
        const matchesDescription = product.description?.toLowerCase().includes(searchLower);
        const matchesKeywords = product.seoKeywords?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription && !matchesKeywords) {
          return false;
        }
      }

      // Price filter
      const price = product.price || 0;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      // Size filter (if any sizes selected)
      if (selectedSizes.length > 0) {
        const productSize = product.height && product.width
          ? `${product.height}"×${product.width}"`
          : null;
        if (!productSize || !selectedSizes.includes(productSize)) {
          return false;
        }
      }

      // Type filtering logic
      if (activeType === "originals") {
        return product.type === "originals" && product.subtype === activeOriginalSubtype;
      } else if (activeType === "prints") {
        return product.type === "prints" && product.subtype === activePrintSubtype;
      } else if (activeType === "merchandise") {
        return product.type === "merchandise" && product.subtype === activeMerchandiseSubtype;
      }

      return true;
    });
  }, [products, activeType, activePrintSubtype, activeOriginalSubtype, activeMerchandiseSubtype, searchTerm, priceRange, selectedSizes]);

  const sortedProducts = React.useMemo(() => {
    if (!filteredProducts) return undefined;

    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "newest":
        default:
          return (b.id || 0) - (a.id || 0);
      }
    });
  }, [filteredProducts, sortBy]);

  // Query for original types for subcategories
  const { data: originalTypes } = useQuery({
    queryKey: ["/api/original-types"],
    enabled: activeType === "originals",
  });

  // Query for shop categories for merchandise subcategories
  const { data: shopCategoriesData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/shop_categories"],
    enabled: activeType === "merchandise",
  });

  // Parse shop categories for merchandise subcategories
  const merchandiseCategories = shopCategoriesData?.value ? (() => {
    try {
      const categories = JSON.parse(shopCategoriesData.value);
      return Array.isArray(categories) ? categories : ["prints", "original-paintings", "merchandise"];
    } catch (e) {
      return ["prints", "original-paintings", "merchandise"];
    }
  })() : ["prints", "original-paintings", "merchandise"];

  // Effect to handle if we only have one product related to an artwork
  useEffect(() => {
    if (artworkId && products?.length === 1) {
      navigate(`/shop/product/${products[0].id}`);
    }
  }, [artworkId, products, navigate]);

  // Reset subtypes when changing main category
  useEffect(() => {
    if (activeType !== "prints") {
      setActivePrintSubtype("paper");
    }
    if (activeType !== "originals") {
      setActiveOriginalSubtype("paintings");
    }
    if (activeType !== "merchandise") {
      setActiveMerchandiseSubtype("prints");
    }
  }, [activeType]);

  // Use the filtered and sorted products for display
  const displayProducts = sortedProducts;

  // Create a collection of structured data for products
  const renderProductStructuredData = () => {
    if (!products || products.length === 0) return null;

    return products.slice(0, 5).map((product, index) => (
      <ProductStructuredData
        key={index}
        name={product.title}
        description={product.description}
        image={product.imageUrl}
        price={product.price}
        sku={`prod-${product.id}`}
      />
    ));
  };

  return (
    <section className="min-h-screen bg-[#f5f3ef]">
      <SEO
        title="Buy Original Paintings & Prints | Gabe Wells Shop"
        description="Buy original paintings, prints, and merchandise from Gabe Wells Fine Art. Contemporary oil paintings and limited edition products."
        canonicalUrl="https://gabewells.com/shop"
        ogType="website"
      />
      {renderProductStructuredData()}

      {/* Page header with category filter pills */}
      <div className="container mx-auto px-6 lg:px-12 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif text-neutral-800 tracking-wide">Shop</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {shopDescriptionData?.value || "Original paintings, limited edition prints, and exclusive merchandise"}
            </p>
          </div>

          {/* Main category pills */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            {(["originals", "prints", "merchandise"] as ProductType[]).map((type) => {
              const label = type === "originals" ? "Original Artwork" : type === "prints" ? "Prints" : "Merchandise";
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`text-xs tracking-widest uppercase transition-all duration-200 pb-1.5 border-b-2 whitespace-nowrap ${
                    activeType === type
                      ? "text-neutral-800 border-[#b8860b] font-medium"
                      : "text-neutral-400 border-transparent hover:text-neutral-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thin divider */}
        <div className="w-full h-px bg-neutral-200 mt-4"></div>

        {/* Subcategory pills — shown below divider when applicable */}
        {activeType === "prints" && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(["paper", "canvas", "framed", "limited_edition"] as PrintSubtype[]).map((subtype) => {
              const label = subtype === "paper" ? "Paper Prints" : subtype === "canvas" ? "Canvas Prints" : subtype === "framed" ? "Framed Prints" : "Limited Edition";
              return (
                <button
                  key={subtype}
                  onClick={() => setActivePrintSubtype(subtype)}
                  className={`text-xs tracking-widest uppercase transition-all duration-200 pb-1.5 border-b-2 whitespace-nowrap ${
                    activePrintSubtype === subtype
                      ? "text-neutral-800 border-[#b8860b] font-medium"
                      : "text-neutral-400 border-transparent hover:text-neutral-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {activeType === "originals" && originalTypes && (originalTypes as any[]).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(originalTypes as any[]).map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveOriginalSubtype(type.name.toLowerCase())}
                className={`text-xs tracking-widest uppercase transition-all duration-200 pb-1.5 border-b-2 whitespace-nowrap ${
                  activeOriginalSubtype === type.name.toLowerCase()
                    ? "text-neutral-800 border-[#b8860b] font-medium"
                    : "text-neutral-400 border-transparent hover:text-neutral-600"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        )}

        {activeType === "merchandise" && (
          <div className="flex flex-wrap gap-2 mt-3">
            {merchandiseCategories.map((category: string) => (
              <button
                key={category}
                onClick={() => setActiveMerchandiseSubtype(category)}
                className={`text-xs tracking-widest uppercase transition-all duration-200 pb-1.5 border-b-2 whitespace-nowrap ${
                  activeMerchandiseSubtype === category
                    ? "text-neutral-800 border-[#b8860b] font-medium"
                    : "text-neutral-400 border-transparent hover:text-neutral-600"
                }`}
              >
                {category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="container mx-auto px-6 lg:px-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsLoading
            ? Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col space-y-3 animate-pulse"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '1s'
                    }}
                  >
                    <Skeleton className="h-[300px] w-full rounded-sm" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                ))
            : displayProducts?.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up opacity-0"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animationDuration: '600ms',
                    animationFillMode: 'forwards'
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        {displayProducts?.length === 0 && !productsLoading && (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-sm tracking-wide uppercase">
              No products found in this category
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
