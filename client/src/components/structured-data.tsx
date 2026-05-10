import { Helmet } from 'react-helmet';

interface PersonStructuredDataProps {
  name: string;
  jobTitle: string;
  description: string;
  image: string;
  sameAs?: string[];
}

export const PersonStructuredData = ({
  name,
  jobTitle,
  description,
  image,
  sameAs = []
}: PersonStructuredDataProps) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle,
    description,
    image,
    sameAs
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface ArtworkStructuredDataProps {
  name: string;
  description: string;
  image: string;
  creator: string;
  dateCreated: string;
  artMedium: string;
  artworkSurface?: string;
  width?: string;
  height?: string;
  artform?: string;
}

export const ArtworkStructuredData = ({
  name,
  description,
  image,
  creator,
  dateCreated,
  artMedium,
  artworkSurface,
  width,
  height,
  artform = "Visual Art"
}: ArtworkStructuredDataProps) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name,
    description,
    image,
    creator: {
      '@type': 'Person',
      name: creator
    },
    dateCreated,
    artMedium,
    artform,
    ...(artworkSurface && { artworkSurface }),
    ...(width && height && {
      width: {
        '@type': 'Distance',
        name: width
      },
      height: {
        '@type': 'Distance',
        name: height
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};