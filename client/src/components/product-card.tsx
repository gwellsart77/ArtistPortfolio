import { Link } from "wouter";
import { productPath } from "@shared/seo";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { thumbUrl, thumbSrcSet } from "@/lib/cloudinary";
import { displayTitle, kindLabel, sizeLabel } from "@/lib/product-display";

interface ProductCardProps {
  product: Product;
  /** First row loads eagerly so the page appears fast. */
  eager?: boolean;
}

/**
 * Shop grid item. The whole card links to the product page, where the
 * visitor sees the full piece, details and the Add to cart button.
 * Paintings sit on a neutral mat so every row lines up without cropping the art.
 */
export default function ProductCard({ product, eager = false }: ProductCardProps) {
  const title = displayTitle(product.title);
  const size = sizeLabel(product);
  const soldOut = !product.stock || product.stock <= 0;

  return (
    <Link
      href={productPath(product)}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f7f6f3]"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-[4/5] bg-[#efede8] flex items-center justify-center overflow-hidden p-[7%]">
        <img
          src={thumbUrl(product.imageUrl, 700)}
          srcSet={thumbSrcSet(product.imageUrl, [400, 700, 1000]) || undefined}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
          alt={title}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="max-h-full max-w-full object-contain shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-[1.02]"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallback !== "1") {
              img.dataset.fallback = "1";
              img.srcset = "";
              img.src = product.imageUrl;
            }
          }}
        />
        {soldOut && (
          <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#1b1a18]">
            Sold
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-serif text-lg md:text-xl leading-snug text-[#1b1a18] group-hover:text-[#8b6b3e] transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[#6e6a63]">
          {kindLabel(product)}
          {size ? ` · ${size}` : ""}
        </p>
        <p className="mt-2 text-sm text-[#1b1a18] tabular-nums">{soldOut ? "Sold" : formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}
