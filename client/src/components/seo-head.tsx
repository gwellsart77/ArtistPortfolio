import { Helmet } from "react-helmet";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  structuredData?: object;
}

export function SEOHead({
  title = "Gabe Wells Fine Art",
  description = "Contemporary oil paintings and fine art by Gabe Wells. Explore original artworks, limited edition prints, and merchandise.",
  keywords = "fine art, oil paintings, contemporary art, original artwork, limited edition prints, Gabe Wells",
  image = "/default-og-image.jpg",
  url = window.location.href,
  type = "website",
  structuredData
}: SEOHeadProps) {
  const fullTitle = title === "Gabe Wells Fine Art" ? title : `${title} | Gabe Wells Fine Art`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Gabe Wells Fine Art" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Gabe Wells" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#1f2937" />
      <link rel="canonical" href={url} />
      
      {/* Performance and Core Web Vitals */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://api.stripe.com" />
      
      {/* Accessibility */}
      <meta name="color-scheme" content="light dark" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}