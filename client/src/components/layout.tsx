import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Cart from "@/components/cart";
import { useCart } from "@/lib/cart";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

const IG_PATH = "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z";
const FB_PATH = "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z";

/**
 * Public site frame: a single-row sticky header (logo left, menu right, cart),
 * and a quiet light footer. Gallery-style: lots of white, near-black type,
 * bronze used only as a small accent.
 */
export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalItems = useCart((state) => state.totalItems());

  const { data: instagramLink } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/settings/social_instagram"],
  });
  const { data: facebookLink } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/settings/social_facebook"],
  });
  const { data: footerDescription } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/settings/footer_description"],
  });
  const { data: shopPageEnabled } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/settings/shop_page_enabled"],
  });

  const showShop = !shopPageEnabled || shopPageEnabled.value === "true";
  const links = [
    { href: "/gallery", label: "Gallery" },
    ...(showShop ? [{ href: "/shop", label: "Shop" }] : []),
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];
  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  // Close mobile menu when the page changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const cartButton = (
    <button
      type="button"
      onClick={() => setIsCartOpen(true)}
      className="relative inline-flex h-10 w-10 items-center justify-center text-[#1b1a18] hover:text-[#8b6b3e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e] rounded-full"
      aria-label={`Cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`}
      data-testid="header-cart"
    >
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
      {totalItems > 0 && (
        <span className="absolute top-1 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#1b1a18] text-white text-[10px] leading-4 text-center tabular-nums">
          {totalItems}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f6f3] text-[#1b1a18] font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#f7f6f3]/95 backdrop-blur supports-[backdrop-filter]:bg-[#f7f6f3]/85 border-b border-[#e3e0da]">
        <div className="container mx-auto px-5 lg:px-12">
          <div className="flex h-16 md:h-20 items-center justify-between">
            <Link href="/" className="font-serif text-[26px] md:text-[30px] leading-none tracking-wide text-[#1b1a18]" data-testid="header-logo">
              Gabe Wells
            </Link>

            <nav className="hidden md:flex items-center gap-9" aria-label="Main">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href} active={isActive(l.href)}>
                  {l.label}
                </NavLink>
              ))}
              {cartButton}
            </nav>

            <div className="flex md:hidden items-center gap-1">
              {cartButton}
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center text-[#1b1a18] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6b3e] rounded-full"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                data-testid="header-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" className="md:hidden border-t border-[#e3e0da] bg-[#f7f6f3]" aria-label="Main">
            <ul className="container mx-auto px-5 py-2">
              {[{ href: "/", label: "Home" }, ...links].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`block py-3.5 font-serif text-2xl border-b border-[#e3e0da] last:border-0 ${
                      (l.href === "/" ? location === "/" : isActive(l.href)) ? "text-[#8b6b3e]" : "text-[#1b1a18]"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e3e0da] bg-[#f7f6f3]">
        <div className="container mx-auto px-5 lg:px-12 py-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-sm">
              <Link href="/" className="font-serif text-2xl text-[#1b1a18]">Gabe Wells</Link>
              {footerDescription?.value && (
                <p className="mt-3 text-sm leading-relaxed text-[#6e6a63]">{footerDescription.value}</p>
              )}
              <div className="mt-5 flex items-center gap-4">
                {instagramLink?.value && (
                  <a href={instagramLink.value} target="_blank" rel="noopener noreferrer" className="text-[#6e6a63] hover:text-[#1b1a18] transition-colors" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d={IG_PATH} /></svg>
                  </a>
                )}
                {facebookLink?.value && (
                  <a href={facebookLink.value} target="_blank" rel="noopener noreferrer" className="text-[#6e6a63] hover:text-[#1b1a18] transition-colors" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d={FB_PATH} /></svg>
                  </a>
                )}
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm" aria-label="Footer">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-[#6e6a63] hover:text-[#1b1a18] transition-colors">
                  {l.label}
                </Link>
              ))}
              {showShop && (
                <Link href="/shipping-returns" className="text-[#6e6a63] hover:text-[#1b1a18] transition-colors">
                  Shipping &amp; Returns
                </Link>
              )}
            </nav>
          </div>

          <div className="mt-12 pt-6 border-t border-[#e3e0da] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-[#6e6a63]">
            <p>&copy; {new Date().getFullYear()} Gabe Wells. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/security-policy" className="hover:text-[#1b1a18] transition-colors">Privacy &amp; Security</Link>
              <Link href="/admin/login" className="hover:text-[#1b1a18] transition-colors">Admin</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Cart */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-2 text-[13px] uppercase tracking-[0.14em] transition-colors ${
        active ? "text-[#1b1a18]" : "text-[#6e6a63] hover:text-[#1b1a18]"
      } after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-px after:bg-[#8b6b3e] after:transition-[width] after:duration-300 ${
        active ? "after:w-full" : "after:w-0 hover:after:w-full"
      }`}
    >
      {children}
    </Link>
  );
}
