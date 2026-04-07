import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
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
  const defaultBio = `Gabe Wells is a contemporary oil painter based in Denver,
    Colorado. With over 15 years of experience, he has developed a
    distinctive style that bridges the gap between traditional
    landscapes and contemporary abstraction.
    
    His work explores the emotional connection between humans and
    their environment, using color and texture to evoke memories and
    feelings rather than simply depicting scenes.
    
    Gabe holds an MFA from the Rhode Island School of Design and has
    exhibited his work in galleries across North America and Europe.
    His paintings are held in numerous private and public collections.`;

  const defaultStudio = `Located in Denver, Colorado, Gabe's
    studio is a converted industrial space filled with natural
    light. This is where all his works come to life, from initial
    sketches to completed canvases.
    
    The studio is also where Gabe hosts occasional workshops and
    open studio events, allowing visitors to see his process and
    learn about oil painting techniques.
    
    Studio visits are available by appointment for collectors and
    art enthusiasts.`;

  const defaultCV = `2023 - Solo Exhibition, "Landscapes of Memory," Portland Art Gallery
    2021 - Artist Residency, Vermont Studio Center
    2020 - Group Exhibition, "Contemporary Landscapes," Seattle Art Museum
    2018 - Featured Artist, American Oil Painters Society
    2016 - MFA, Rhode Island School of Design`;
    
  const defaultStatement = `My artwork explores the intersection of memory, emotion, and place. I am fascinated by how landscapes can serve as containers for human experience, holding our stories and reflecting our inner worlds.
    
    Through my oil paintings, I seek to create spaces that exist somewhere between reality and imagination. The landscapes I paint are not direct representations of physical places, but rather emotional environments that invite viewers to project their own memories and feelings.
    
    Color plays a crucial role in my process. I use vibrant, sometimes unexpected palettes to evoke particular emotional responses and to challenge conventional ways of seeing. The texture of paint—its physicality and presence—is equally important, reminding us that these images are not just visual experiences but material objects that exist in space.
    
    Ultimately, my work is an invitation to slow down, to contemplate, and to reconnect with both the natural world and our own interior landscapes.`;

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
    <section className="min-h-screen bg-[#f5f3ef]">
      <SEO
        title="About Gabe Wells | Contemporary Fine Artist"
        description="Discover the artistic vision of Gabe Wells, a contemporary painter specializing in magical realism oil paintings and fine art."
        canonicalUrl="https://gabewells.com/about"
        ogImage={profileImage?.value || "https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&h=900"}
      />
      <PersonStructuredData
        name="Gabe Wells"
        jobTitle="Contemporary Oil Painter"
        description="Gabe Wells is a contemporary oil painter based in Denver, Colorado, known for vibrant landscapes that bridge traditional and abstract styles."
        image={profileImage?.value || "https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&h=900"}
        sameAs={[
          "https://instagram.com/gabewellsart"
        ]}
      />
      <div className="container mx-auto px-6 lg:px-12">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-serif text-neutral-800 tracking-wide">About</h1>
          <p className="text-sm text-neutral-500 mt-1">Contemporary fine artist — imaginative realism, sculpture, and mixed media</p>
          <div className="w-full h-px bg-neutral-200 mt-4"></div>
        </div>

        <div className="mb-8">
          <div className="mx-auto max-w-lg mb-6">
            {imageLoading ? (
              <Skeleton className="w-full h-[300px] rounded-lg" />
            ) : (
              <img
                src={profileImage?.value || "https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&h=900"}
                alt="Gabe Wells in his studio"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            )}
          </div>
          
          <h3 className="text-2xl font-serif mb-3 text-center">Artist Statement</h3>
          <div className="w-16 h-px bg-[#b8860b] mx-auto mb-3"></div>
          
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
                <p key={index} className="mb-4 text-neutral-700 leading-relaxed italic text-center">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className="text-2xl font-serif mb-3">Gabe Wells</h3>
          <div className="w-16 h-px bg-[#b8860b] mb-3"></div>
          
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
                <p key={index} className={`mb-${index === bioParagraphs.length - 1 ? '6' : '4'} text-neutral-700 leading-relaxed`}>
                  {paragraph}
                </p>
              ))}
            </>
          )}

          <div className="border-t border-neutral pt-4 mt-4">
            <h4 className="text-xl font-serif mb-3">CV Highlights</h4>
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
                    className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_li]:mb-2 [&_strong]:font-semibold [&_strong]:text-[#b8860b]"
                    dangerouslySetInnerHTML={{ __html: cvContent?.value || '' }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {cvItems && cvItems.map((item, index) => (
                      <div key={index} className="mb-2">
                        <div className="font-medium text-[#b8860b]">{item.year}</div>
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
        {studioVisitData?.value === "true" && (
          <Card className="mt-20 bg-white rounded-lg border-none shadow-sm">
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
                        <p key={index} className={`mb-${index === studioParagraphs.length - 1 ? '0' : '4'} text-neutral-700 leading-relaxed`}>
                          {paragraph}
                        </p>
                      ))}
                    </>
                  )}

                  <Link
                    href="/contact"
                    className={buttonVariants({
                      className: "mt-6 bg-[#b8860b] hover:bg-opacity-90 text-white px-6 py-3 uppercase tracking-wider text-sm",
                    })}
                  >
                    Book a Studio Visit
                  </Link>
                </div>

                <div className="order-1 lg:order-2">
                  {studioImageLoading ? (
                    <Skeleton className="w-full h-[300px] rounded-lg" />
                  ) : (
                    <img
                      src={studioImage?.value || "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&h=500"}
                      alt="Gabe Wells' art studio in Portland"
                      className="w-full h-auto rounded-lg shadow-lg"
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
