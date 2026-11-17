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

  // Only offer tabs that actually have something in them
  const typeHasProducts = (t: ProductType) => !!products?.some((p) => p.type === t);
  const availableTypes = (["originals", "prints", "merchandise"] as ProductType[]).filter(typeHasProducts);
  const subtypeHasProducts = (t: ProductType, sub: string) => !!products?.some((p) => p.type === t && p.subtype === sub);
  const originalSubtypes = ((originalTypes as any[]) || [])
    .map((o) => ({ key: String(o.name).toLowerCase(), label: String(o.name) }))
    .filter((o) => subtypeHasProducts("originals", o.key));
  const printSubtypes = (["paper", "canvas", "framed", "limited_edition"] as PrintSubtype[])
    .map((k) => ({ key: k, label: k === "paper" ? "Paper Prints" : k === "canvas" ? "Canvas Prints" : k === "framed" ? "Framed Prints" : "Limited Edition" }))
    .filter((o) => subtypeHasProducts("prints", o.key));
  const merchSubtypes = merchandiseCategories
    .map((k: string) => ({ key: k, label: k.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") }))
    .filter((o: { key: string }) => subtypeHasProducts("merchandise", o.key));

  // If the chosen tab is empty but another has products, switch to one that has them
  useEffect(() => {
    if (products && availableTypes.length > 0 && !availableTypes.includes(activeType)) {
      setActiveType(availableTypes[0] as ProductType);
    }
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeType === "originals" && originalSubtypes.length > 0 && !originalSubtypes.some((o) => o.key === activeOriginalSubtype)) {
      setActiveOriginalSubtype(originalSubtypes[0]!.key);
    }
    if (activeType === "prints" && printSubtypes.length > 0 && !printSubtypes.some((o) => o.key === activePrintSubtype)) {
      setActivePrintSubtype(printSubtypes[0]!.key as PrintSubtype);
    }
    if (activeType === "merchandise" && merchSubtypes.length > 0 && !merchSubtypes.some((o: { key: string }) => o.key === activeMerchandiseSubtype)) {
      setActiveMerchandiseSubtype(merchSubtypes[0]!.key);
    }
  }, [products, originalTypes, activeType]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtabs =
    activeType === "originals" ? { items: originalSubtypes, active: activeOriginalSubtype, set: (k: string) => setActiveOriginalSubtype(k) } :
    activeType === "prints" ? { items: printSubtypes, active: activePrintSubtype as string, set: (k: string) => setActivePrintSubtype(k as PrintSubtype) } :
    { items: merchSubtypes, active: activeMerchandiseSubtype, set: (k: string) => setActiveMerchandiseSubtype(k) };

  const tabClass = (active: boolean) =>
    `text-xs tracking-[0.14em] uppercase pb-1.5 border-b whitespace-nowrap transition-colors ${
      active ? "text-[#1b1a18] border-[#8b6b3e]" : "text-[#6e6a63] border-transparent hover:text-[#1b1a18]"
    }`;

  return (
    <section className="min-h-screen bg-[#f7f6f3]">
      <SEO
        title="Buy Original Paintings & Prints | Gabe Wells Shop"
        description="Buy original paintings and prints by Gabe Wells. Imaginative realism oil paintings, available directly from the artist."
        canonicalUrl="https://gabewells.com/shop"
        ogType="website"
      />
      {renderProductStructuredData()}

      {/* Page header */}
      <div className="container mx-auto px-5 lg:px-12 pt-12 md:pt-16 pb-8 text-center">
        <h1 className="font-serif text-4xl md:text-5xl text-[#1b1a18]">Shop</h1>
        <div className="w-16 h-px bg-[#8b6b3e] mx-auto mt-5 mb-5" />
        <p className="text-sm text-[#6e6a63] max-w-xl mx-auto leading-relaxed">
          {shopDescriptionData?.value || "Original paintings and prints, available directly from the artist."}
        </p>

        {(availableTypes.length > 1 || subtabs.items.length > 1) && (
          <div className="mt-8 flex flex-col items-center gap-4">
            {availableTypes.length > 1 && (
              <div className="flex flex-wrap justify-center gap-7" role="tablist" aria-label="Shop sections">
                {availableTypes.map((type) => (
                  <button key={type} role="tab" aria-selected={activeType === type} onClick={() => setActiveType(type)} className={tabClass(activeType === type)}>
                    {type === "originals" ? "Originals" : type === "prints" ? "Prints" : "Merchandise"}
                  </button>
                ))}
              </div>
            )}
            {subtabs.items.length > 1 && (
              <div className="flex flex-wrap justify-center gap-6" role="tablist" aria-label="Filter">
                {subtabs.items.map((o: { key: string; label: string }) => (
                  <button key={o.key} role="tab" aria-selected={subtabs.active === o.key} onClick={() => subtabs.set(o.key)} className={tabClass(subtabs.active === o.key)}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="container mx-auto px-5 lg:px-12 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
          {productsLoading
            ? Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[4/5] w-full rounded-none" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))
            : displayProducts?.map((product, index) => (
                <ProductCard key={product.id} product={product} eager={index < 4} />
              ))}
        </div>

        {displayProducts?.length === 0 && !productsLoading && (
          <div className="text-center py-20">
            <p className="text-[#6e6a63] text-sm">Nothing in this section right now.</p>
          </div>
        )}
      </div>
    </section>
  );
}
