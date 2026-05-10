import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FaInstagram } from "react-icons/fa";

export default function Footer() {
  // Get social media links from settings
  const { data: instagramLink } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/social_instagram"],
  });
  
  // Current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 pt-16 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-serif mb-4">Gabe Wells</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contemporary artist specializing in oil paintings featuring magical realism and figurative works.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4 mt-6">
              {instagramLink?.value && (
                <a 
                  href={instagramLink.value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#b8860b] transition"
                  aria-label="Instagram"
                >
                  <FaInstagram size={22} />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-serif mb-4">Navigation</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-600 hover:text-[#b8860b] transition">
                Home
              </Link>
              <Link href="/gallery" className="text-gray-600 hover:text-[#b8860b] transition">
                Gallery
              </Link>
              <Link href="/shop" className="text-gray-600 hover:text-[#b8860b] transition">
                Shop
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-[#b8860b] transition">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-[#b8860b] transition">
                Contact
              </Link>
            </nav>
          </div>
          
          <div>
            <h3 className="text-lg font-serif mb-4">Contact</h3>
            <p className="text-sm text-gray-600 mb-2">
              For inquiries about commissions or available artwork, please get in touch.
            </p>
            <Link 
              href="/contact" 
              className="inline-block border-b border-[#b8860b] text-gray-600 hover:text-[#b8860b] transition mt-2"
            >
              Contact Form
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 mt-8 text-center text-sm text-gray-500">
          <p>© {currentYear} Gabe Wells. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}