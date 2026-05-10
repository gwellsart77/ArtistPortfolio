import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Cart from "@/components/cart";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalItems = useCart((state) => state.totalItems());
  
  // Query settings
  const { data: instagramLink } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/social_instagram"],
  });
  
  const { data: facebookLink } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/social_facebook"],
  });
  
  const { data: twitterLink } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/social_twitter"],
  });
  
  const { data: youtubeLink } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/social_youtube"],
  });
  
  const { data: footerTitle } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/footer_title"],
  });
  
  const { data: footerDescription } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/footer_description"],
  });

  // Page enable/disable settings
  const { data: shopPageEnabled } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_page_enabled"],
  });

  // Removed unused commissionPageEnabled query for type safety

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle cart toggle
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f5f2] text-primary font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-neutral-200 md:py-6 lg:px-12">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <Link href="/" className="text-3xl font-serif font-medium tracking-wide mb-4 md:mb-0 text-black">
              Gabe Wells
            </Link>

            <nav className="hidden md:block">
              <ul className="flex items-center space-x-8">
                <li>
                  <NavLink href="/" active={location === "/"}>
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/gallery" active={location === "/gallery"}>
                    Gallery
                  </NavLink>
                </li>
                {/* Show Shop link only if enabled */}
                {(!shopPageEnabled || shopPageEnabled.value === "true") && (
                  <li>
                    <NavLink href="/shop" active={location === "/shop"}>
                      Shop
                    </NavLink>
                  </li>
                )}

                <li>
                  <NavLink href="/about" active={location === "/about"}>
                    About
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/contact" active={location === "/contact"}>
                    Contact
                  </NavLink>
                </li>

                <li>
                  <Button 
                    variant="ghost" 
                    className="ml-4 px-3 py-2 text-black"
                    onClick={toggleCart}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="ml-1 text-[#b8860b]">{totalItems}</span>
                  </Button>
                </li>
              </ul>
            </nav>

            <div className="md:hidden flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="px-3 py-2 text-black"
                onClick={toggleCart}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="ml-1 text-[#b8860b]">{totalItems}</span>
              </Button>
              
              <Button
                variant="ghost"
                className="text-xl text-black"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>
              

            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <ul className="flex flex-col items-center space-y-4">
                <li>
                  <Link href="/" className="block w-full text-center py-2 text-sm uppercase tracking-wide text-black">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="block w-full text-center py-2 text-sm uppercase tracking-wide text-black">
                    Gallery
                  </Link>
                </li>
                {/* Show Shop link only if enabled */}
                {(!shopPageEnabled || shopPageEnabled.value === "true") && (
                  <li>
                    <Link href="/shop" className="block w-full text-center py-2 text-sm uppercase tracking-wide text-black">
                      Shop
                    </Link>
                  </li>
                )}

                <li>
                  <Link href="/about" className="block w-full text-center py-2 text-sm uppercase tracking-wide text-black">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="block w-full text-center py-2 text-sm uppercase tracking-wide text-black">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white pt-12 pb-8 border-t border-white border-opacity-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-serif mb-6">{footerTitle?.value || "Gabe Wells Fine Art"}</h3>
              <p className="text-neutral-200 mb-6 leading-relaxed">
                {footerDescription?.value || "Contemporary oil paintings that explore the boundaries between reality and abstraction."}
              </p>
              <div className="flex space-x-4">
                {/* Instagram */}
                {instagramLink?.value && (
                  <a
                    href={instagramLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="Instagram"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                
                {/* Facebook */}
                {facebookLink?.value && (
                  <a
                    href={facebookLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="Facebook"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </a>
                )}
                
                {/* Twitter */}
                {twitterLink?.value && (
                  <a
                    href={twitterLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="Twitter"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                )}
                
                {/* YouTube */}
                {youtubeLink?.value && (
                  <a
                    href={youtubeLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="YouTube"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-6">Shop Categories</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/shop" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Original Paintings
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Prints
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-neutral-200 hover:text-[#b8860b] transition duration-200">
                    Merchandise
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-6">Customer Service</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="/shipping-returns" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                  >
                    Shipping & Returns
                  </a>
                </li>
                <li>
                  <a 
                    href="/contact" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a 
                    href="/security-policy" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                  >
                    Security Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white border-opacity-10 text-center text-neutral-200 text-sm">
            <p>&copy; {new Date().getFullYear()} Gabe Wells Fine Art. All rights reserved.</p>
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
      className={`nav-link py-2 text-sm uppercase tracking-wide relative text-black ${
        active ? "after:w-full" : "after:w-0"
      } after:content-[''] after:absolute after:h-[1px] after:bottom-[-2px] after:left-0 after:bg-[#b8860b] after:transition-[width] after:duration-300 hover:after:w-full`}
    >
      {children}
    </Link>
  );
}