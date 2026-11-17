import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { thumbUrl } from "@/lib/cloudinary";
import { PersonStructuredData } from "@/components/structured-data";

export default function About() {

  // Fetch bio from settings
  const { data: bioContent, isLoading: bioLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/about_biography"],
  });

  // Fetch studio info from settings
  const { data: studioContent, isLoading: studioLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/about_studio"],
  });
  
  // Fetch artist statement from settings
  const { data: statementContent, isLoading: statementLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/about_artist_statement"],
  });
  
  // Fetch CV items from settings
  const { data: cvContent, isLoading: cvLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/about_cv"],
  });
  


  // Fetch profile image from settings
  const { data: profileImage, isLoading: imageLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/about_profile_image"],
  });

  // Fetch studio image from settings
  const { data: studioImage, isLoading: studioImageLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/about_studio_image"],
  });

  // Fetch studio visit toggle setting
  const { data: studioVisitData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/studio_visit_enabled"],
  });

  // Note: isLoading variable available but currently unused

  // Default content if settings not available yet
  // No placeholder text: only Gabe's real content (from site settings) is ever shown
  const defaultBio = ``;

  // No placeholder text: only Gabe's real content (from site settings) is ever shown
  const defaultStudio = ``;

  // No placeholder text: only Gabe's real content (from site settings) is ever shown
  const defaultCV = ``;
    
  // No placeholder text: only Gabe's real content (from site settings) is ever shown
  const defaultStatement = ``;

  // Format paragraphs for display
  const formatParagraphs = (text: string) => {
    return text.split('\n\n').filter(para => para.trim() !== '');
  };
  
  // Format CV items for display - handle HTML content
  const formatCVItems = (text: string) => {
    // If the text contains HTML tags, return it as-is for HTML rendering
    if (text.includes('<') && text.includes('>')) {
      return null; // Signal to use HTML rendering
    }
    // Otherwise, parse as plain text
    return text.split('\n').filter(item => item.trim() !== '').map(item => {
      const parts = item.split(' - ');
      return {
        year: parts[0],
        description: parts[1] || ''
      };
    });
  };
  
  const bioParagraphs = formatParagraphs(bioContent?.value || defaultBio);
  const studioParagraphs = formatParagraphs(studioContent?.value || defaultStudio);
  const statementParagraphs = formatParagraphs(statementContent?.value || defaultStatement);
  const cvItems = formatCVItems(cvContent?.value || defaultCV);
  const shouldRenderCVAsHTML = cvContent?.value && cvContent.value.includes('<') && cvContent.value.includes('>');
  
  return (
    <section className="min-h-screen bg-[#f7f6f3]">
      <SEO
        title="About Gabe Wells | Contemporary Fine Artist"
        description="Discover the artistic vision of Gabe Wells, a contemporary painter specializing in magical realism oil paintings and fine art."
        canonicalUrl="https://gabewells.com/about"
        ogImage={profileImage?.value || "https://res.cloudinary.com/da3hhngye/image/upload/v1747259587/Lumious_m0wilx.jpg"}
      />
      <PersonStructuredData
        name="Gabe Wells"
        jobTitle="Contemporary Oil Painter"
        description="Gabe Wells is a contemporary oil painter based in Denver, Colorado, known for vibrant landscapes that bridge traditional and abstract styles."
        image={profileImage?.value || "https://res.cloudinary.com/da3hhngye/image/upload/v1747259587/Lumious_m0wilx.jpg"}
        sameAs={[
          "https://instagram.com/gabewellsart"
        ]}
      />
      <div className="container mx-auto px-5 lg:px-12 max-w-3xl pb-20">
        <div className="pt-12 md:pt-16 pb-10 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-[#1b1a18]">About</h1>
          <div className="w-16 h-px bg-[#8b6b3e] mx-auto mt-5 mb-5"></div>
          <p className="text-sm text-[#6e6a63]">Contemporary fine artist — imaginative realism, sculpture, and mixed media</p>
        </div>

        <div className="mb-8">
          <div className="mx-auto max-w-lg mb-6">
            {imageLoading ? (
              <Skeleton className="w-full h-[300px] rounded-lg" />
            ) : (
              profileImage?.value && <img
                src={thumbUrl(profileImage.value, 1200)}
                alt="Gabe Wells in his studio"
                className="w-full h-auto rounded-sm"
              />
            )}
          </div>
          
          <h2 className="text-3xl font-serif mb-3 text-center">Artist Statement</h2>
          <div className="w-16 h-px bg-[#8b6b3e] mx-auto mb-3"></div>
          
          {statementLoading ? (
            <div className="max-w-3xl mx-auto">
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-[75%] mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-[85%] mb-4" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {statementParagraphs.map((paragraph, index) => (
                <p key={index} className="mb-4 font-serif text-xl leading-relaxed italic text-center text-[#3d3a35]">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-16">
          <h2 className="text-3xl font-serif mb-3">Gabe Wells</h2>
          <div className="w-16 h-px bg-[#8b6b3e] mb-3"></div>
          
          {bioLoading ? (
            <>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-[80%] mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-[70%] mb-6" />
            </>
          ) : (
            <>
              {bioParagraphs.map((paragraph, index) => (
                <p key={index} className={`mb-${index === bioParagraphs.length - 1 ? '6' : '4'} text-[15px] text-[#3d3a35] leading-[1.8]`}>
                  {paragraph}
                </p>
              ))}
            </>
          )}

          <div className="border-t border-[#e3e0da] pt-10 mt-12">
            <h2 className="text-3xl font-serif mb-6">CV Highlights</h2>
            {cvLoading ? (
              <>
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-[90%] mb-3" />
                <Skeleton className="h-4 w-[85%] mb-3" />
                <Skeleton className="h-4 w-[95%] mb-3" />
                <Skeleton className="h-4 w-[80%] mb-3" />
              </>
            ) : (
              <>
                {shouldRenderCVAsHTML ? (
                  <div 
                    className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_li]:mb-2 [&_strong]:font-semibold [&_strong]:text-[#8b6b3e]"
                    dangerouslySetInnerHTML={{ __html: cvContent?.value || '' }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {cvItems && cvItems.map((item, index) => (
                      <div key={index} className="mb-2">
                        <div className="font-medium text-[#8b6b3e]">{item.year}</div>
                        <div className="text-neutral-800">{item.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}


          </div>
        </div>

        {/* Studio Section - conditionally displayed based on toggle */}
        {studioVisitData?.value === "true" && !!studioContent?.value && (
          <Card className="mt-20 bg-white rounded-none border border-[#e3e0da] shadow-none">
            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-serif mb-6">The Studio</h3>
                  {studioLoading ? (
                    <>
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-[75%] mb-4" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-[85%] mb-4" />
                    </>
                  ) : (
                    <>
                      {studioParagraphs.map((paragraph, index) => (
                        <p key={index} className={`mb-${index === studioParagraphs.length - 1 ? '0' : '4'} text-[15px] text-[#3d3a35] leading-[1.8]`}>
                          {paragraph}
                        </p>
                      ))}
                    </>
                  )}

                  <Link
                    href="/contact"
                    className={buttonVariants({
                      className: "mt-6 bg-[#1b1a18] hover:bg-black text-white px-6 py-3 uppercase tracking-wider text-sm",
                    })}
                  >
                    Book a Studio Visit
                  </Link>
                </div>

                <div className="order-1 lg:order-2">
                  {studioImageLoading ? (
                    <Skeleton className="w-full h-[300px] rounded-lg" />
                  ) : (
                    studioImage?.value && <img
                      src={thumbUrl(studioImage.value, 1000)}
                      alt="Gabe Wells' art studio"
                      loading="lazy"
                      className="w-full h-auto rounded-sm"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    </section>
  );
}
