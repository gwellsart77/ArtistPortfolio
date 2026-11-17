import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { STATIC_PAGES } from "@shared/seo";
import { Testimonials } from "@/components/testimonials";
import { SocialProof } from "@/components/social-proof";
import { ArtRecommendations } from "@/components/art-recommendations";
import { cloudinaryTransform } from "@/lib/cloudinary";

export default function Home() {
  // Structured data available for future SEO enhancement
  /*
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Gabe Wells",
    "url": "https://gabewells.com",
    "sameAs": [
      "https://www.instagram.com/gabewellsart",
      "https://www.facebook.com/gabewellsart"
    ],
    "jobTitle": "Fine Artist",
    "description": "Contemporary oil painter creating original artworks and limited edition prints",
    "offers": {
      "@type": "Offer",
      "description": "Original oil paintings, limited edition prints, and art merchandise"
    }
  };
  */
  // Get homepage settings
  const { data: heroImage, isLoading: heroImageLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/home_hero_image"],
  });
  
  const { data: heroHeading, isLoading: headingLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/home_hero_heading"],
  });
  
  const { data: heroSubheading, isLoading: subheadingLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/home_hero_subheading"],
  });


  // AI recommendation settings
  const { data: aiArtTitleData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/home_ai_art_title"],
  });
  
  const { data: aiArtSubtitleData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/home_ai_art_subtitle"],
  });
  

  // Customer engagement settings
  const { data: testimonialsEnabledData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/testimonials_enabled"],
  });

  // Social proof settings
  const { data: socialProofEnabledData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/social_proof_enabled"],
  });

  // Shop page enabled setting - controls Featured Products visibility
  const { data: shopPageEnabledData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_page_enabled"],
  });
  
  // Check if testimonials and social proof are enabled
  const testimonialsEnabled = testimonialsEnabledData?.value === "true";
  const socialProofEnabled = socialProofEnabledData?.value === "true";
  
  // Automatic logic: Hide Featured Products when Shop Page is disabled
  const shopPageEnabled = shopPageEnabledData?.value === "true";
  const showFeaturedProducts = shopPageEnabled; // Featured Products only show when shop is enabled

  return (
    <div className="fade-in">
      <SEO
        title={STATIC_PAGES["/"].title}
        description={STATIC_PAGES["/"].description}
        canonicalUrl="/"
        ogImage={heroImage?.value || "https://res.cloudinary.com/da3hhngye/image/upload/v1747259587/Lumious_m0wilx.jpg"}
      />
      {/* Hero Banner — dark backdrop while the image loads, then a soft fade-in */}
      <div className="relative h-screen max-h-[600px] overflow-hidden bg-neutral-900">
        {!heroImageLoading && heroImage?.value && (
          <img
            src={cloudinaryTransform(heroImage.value, "f_auto,q_auto,c_limit,w_2000")}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
            style={{ filter: "brightness(0.9)" }}
          />
        )}
        {/* Left-side shade so the white heading stays readable over any painting */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 md:bg-gradient-to-r md:from-black/55 md:via-black/20 md:to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl">
              {headingLoading ? (
                <div className="mb-6">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <h1 className="text-white drop-shadow font-serif text-5xl md:text-6xl leading-[1.05] mb-5">
                  {heroHeading?.value || "Gabe Wells"}
                </h1>
              )}
              {subheadingLoading ? (
                <div className="mb-8">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <p className="text-white/90 drop-shadow text-sm md:text-base mb-8 font-light leading-relaxed">
                  {heroSubheading?.value || ""}
                </p>
              )}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/gallery"
                  className="inline-flex items-center justify-center bg-white hover:bg-[#d8c3a0] text-[#1b1a18] px-8 py-3 tracking-widest text-xs uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  View Gallery
                </Link>
                {/* Shop Now button - Only show when Shop Page is enabled */}
                {showFeaturedProducts && (
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center border border-white/80 text-white hover:bg-white hover:text-neutral-900 px-8 py-3 uppercase tracking-widest text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Shop Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Art Recommendations */}
      <div className="bg-[#f7f6f3]">
      <div className="container mx-auto px-5 lg:px-12 py-14 md:py-20">
        <ArtRecommendations 
          title={aiArtTitleData?.value || "Discover Art You'll Love"}
          subtitle={aiArtSubtitleData?.value || "Our AI curator has selected these masterpieces based on your unique taste and browsing patterns"}
          limit={6}
          className=""
        />
      </div>
      </div>


      {/* Customer Testimonials - only show if enabled */}
      {testimonialsEnabled && <Testimonials />}
      
      {/* Social Proof - only show if enabled */}
      {socialProofEnabled && <SocialProof />}
    </div>
  );
}
