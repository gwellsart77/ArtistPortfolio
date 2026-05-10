import { Helmet } from 'react-helmet';

interface ProductStructuredDataProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: string;
  brand?: string;
  sku?: string;
}

export const ProductStructuredData = ({
  name,
  description,
  image,
  price,
  currency = 'USD',
  availability = 'https://schema.org/InStock',
  brand = 'Gabe Wells Studio',
  sku
}: ProductStructuredDataProps) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: price,
      availability,
      ...(sku && { sku })
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};