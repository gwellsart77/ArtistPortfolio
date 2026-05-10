import { Helmet } from 'react-helmet';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

export const SEO = ({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://res.cloudinary.com/da3hhngye/image/upload/v1747259587/Lumious_m0wilx.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image'
}: SEOProps) => {
  // Removed unused siteUrl variable for type safety
  const fullTitle = `${title} | Gabe Wells Studio`;

  return (
    <Helmet>
      {/* Basic SEO Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Tags for Social Media */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Gabe Wells" />
    </Helmet>
  );
};