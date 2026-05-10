import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cacheInvalidation } from "@/lib/cache-invalidation";
import { adminNavigationGuard } from "@/lib/admin-navigation-guard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, User, Upload, Plus, Trash2, Grid3X3, Columns3, Palette } from "lucide-react";
// Removed unused navigateBackToDashboard import for type safety
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CVEditor } from "@/components/cv-editor";
export default function WebsiteSettings() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // List of valid tabs for validation
  const validTabs = ["homepage", "gallery", "shop", "about", "contact", "footer", "commission", "seo", "colors", "email"];
  
  // Extract tab from URL path (either from path parameter or query string)
  const getTabFromUrl = () => {
    // First check if we have a path parameter (from path like /admin/settings/about)
    const pathParts = location.split('/');
    const lastPathPart = pathParts[pathParts.length - 1];
    
    if (validTabs.includes(lastPathPart)) {
      return lastPathPart;
    }
    
    // Fallback to query parameter (from older links like ?tab=about)
    const params = new URLSearchParams(location.split('?')[1] || '');
    const tab = params.get('tab');
    
    return tab && validTabs.includes(tab) ? tab : "homepage";
  };
  
  // State for active tab - initialized from URL
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  
  // Update the active tab whenever the location changes
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location]);
  
  // Sync URL with tab state when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL to the new path-based format
    navigate(`/admin/settings/${value}`, { replace: true });
  };

  // Homepage settings
  const [heroImage, setHeroImage] = useState("");
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [featuredHeading, setFeaturedHeading] = useState("");
  const [featuredDescription, setFeaturedDescription] = useState("");
  const [featuredCount, setFeaturedCount] = useState("3");
  const [shopHeading, setShopHeading] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopCount, setShopCount] = useState("3");
  const [useImageUpload, setUseImageUpload] = useState(false);
  const [isHeroImageUploading, setIsHeroImageUploading] = useState(false);
  
  // Gallery settings
  const [galleryDescription, setGalleryDescription] = useState("");
  const [galleryCategories, setGalleryCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [galleriesDisplayCount, setGalleriesDisplayCount] = useState<string>("5");
  const [galleryLayout, setGalleryLayout] = useState<string>("grid");
  
  // Shop settings (Note: shopDescription is defined above in homepage settings)
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const [newShopCategory, setNewShopCategory] = useState<string>("");
  
  // Page name settings
  const [menuBarTitle, setMenuBarTitle] = useState("Gabe Wells");
  const [menuBarSubtitle, setMenuBarSubtitle] = useState("FINE ART");
  const [galleryPageName, setGalleryPageName] = useState("Gallery");
  const [shopPageName, setShopPageName] = useState("Shop");
  const [aboutPageName, setAboutPageName] = useState("Artist Bio");
  const [contactPageName, setContactPageName] = useState("Contact");
  
  // About page settings
  const [biographyText, setBiographyText] = useState("");
  const [artistStatement, setArtistStatement] = useState("");
  const [studioText, setStudioText] = useState("");
  const [cvText, setCvText] = useState("");

  const [profileImage, setProfileImage] = useState("");
  const [studioImage, setStudioImage] = useState("");
  const [studioVisitEnabled, setStudioVisitEnabled] = useState(true);
  const [galleryPageEnabled, setGalleryPageEnabled] = useState(true);
  const [contactPageEnabled, setContactPageEnabled] = useState(true);
  
  // Contact page settings
  const [contactHeading, setContactHeading] = useState("Get in Touch");
  const [contactSubheading, setContactSubheading] = useState("Contact me about commissions, purchases, or to schedule a studio visit");
  const [contactEmail, setContactEmail] = useState("contact@gabewells.com");
  const [contactFormText, setContactFormText] = useState("Please use the contact form to get in touch about commissions, purchases, or any inquiries. I'll get back to you as soon as possible.");
  const [newsletterHeading, setNewsletterHeading] = useState("Newsletter");
  const [newsletterText, setNewsletterText] = useState("Sign up to receive updates on new works, exhibitions, and studio events.");
  const [followMeText, setFollowMeText] = useState("Follow me");
  const [subscribeText, setSubscribeText] = useState("Subscribe to my newsletter for exhibition updates and new work announcements");
  
  // Footer settings
  const [footerTitle, setFooterTitle] = useState("Gabe Wells Fine Art");
  const [footerDescription, setFooterDescription] = useState("");
  
  // Social settings
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [website, setWebsite] = useState("");
  
  // Customer engagement state
  const [testimonialsEnabled, setTestimonialsEnabled] = useState("true");
  
  // Social proof state
  const [socialProofEnabled, setSocialProofEnabled] = useState("true");
  
  // Commission Art settings state
  const [commissionPaintingMultiplier, setCommissionPaintingMultiplier] = useState<number>(0);
  const [commissionMuralMultiplier, setCommissionMuralMultiplier] = useState<number>(0);
  const [commissionArtistEmail, setCommissionArtistEmail] = useState<string>("");
  
  // AI Recommendation settings
  const [aiArtTitle, setAiArtTitle] = useState<string>("Discover Art You'll Love");
  const [aiArtSubtitle, setAiArtSubtitle] = useState<string>("Our AI curator has selected these masterpieces based on your unique taste and browsing patterns");
  const [aiShopTitle, setAiShopTitle] = useState<string>("Products Perfect for You");
  const [aiShopSubtitle, setAiShopSubtitle] = useState("Smart recommendations based on your art preferences and browsing history");

  // Color scheme settings
  const [primaryBackgroundColor, setPrimaryBackgroundColor] = useState("#ffffff");
  const [primaryTextColor, setPrimaryTextColor] = useState("#1a1a1a");
  const [navigationTextColor, setNavigationTextColor] = useState("#374151");

  const [accentColor, setAccentColor] = useState("#3b82f6");

  // Email Services settings
  const [emailProvider, setEmailProvider] = useState("mailchimp");
  const [mailchimpApiKey, setMailchimpApiKey] = useState("");
  const [mailchimpListId, setMailchimpListId] = useState("");
  const [mailchimpServerPrefix, setMailchimpServerPrefix] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("contact@gabewells.com");
  const [fromName, setFromName] = useState("Gabe Wells Fine Art");
  
  // Main shop category names
  const [featuredCategoryName, setFeaturedCategoryName] = useState("Featured");
  const [originalsCategoryName, setOriginalsCategoryName] = useState("Originals");
  const [printsCategoryName, setPrintsCategoryName] = useState("Prints");
  const [merchandiseCategoryName, setMerchandiseCategoryName] = useState("Merchandise");
  
  // Additional Email Services settings complete

  // Track changes
  const [isChanged, setIsChanged] = useState(false);
  const [settingsToSave, setSettingsToSave] = useState<Array<{ key: string, value: string }>>([]);
  
  // Check if user is authenticated
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin/login");
      toast({
        title: "Authentication required",
        description: "You must log in to access this page",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  // Fetch commission page setting
  const { data: commissionPageData } = useQuery({
    queryKey: ["/api/settings/commission_page_enabled"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache this critical setting
  });

  // Fetch shop page setting
  const { data: shopPageData } = useQuery({
    queryKey: ["/api/settings/shop_page_enabled"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache this critical setting
  });

  // Fetch commission settings from database (same as standalone page)
  const { data: commissionSettings } = useQuery({
    queryKey: ["/api/commission/settings"],
    staleTime: 0,
    gcTime: 0,
  });

  // Update commission state when database values load
  useEffect(() => {
    if (commissionSettings) {
      setCommissionPaintingMultiplier(commissionSettings.paintingMultiplier);
      setCommissionMuralMultiplier(commissionSettings.muralMultiplier);
      setCommissionArtistEmail(commissionSettings.artistEmail);
    }
  }, [commissionSettings]);


  
  // Fetch homepage settings
  const { data: heroImageData } = useQuery({
    queryKey: ["/api/settings/home_hero_image"],
  });
  
  const { data: heroHeadingData } = useQuery({
    queryKey: ["/api/settings/home_hero_heading"],
  });
  
  const { data: heroSubheadingData } = useQuery({
    queryKey: ["/api/settings/home_hero_subheading"],
  });
  
  const { data: featuredHeadingData } = useQuery({
    queryKey: ["/api/settings/home_featured_heading"],
  });
  
  const { data: featuredDescriptionData } = useQuery({
    queryKey: ["/api/settings/home_featured_description"],
  });
  
  const { data: featuredCountData } = useQuery({
    queryKey: ["/api/settings/home_featured_count"],
  });
  
  // Fetch featured shop settings
  const { data: shopHeadingData } = useQuery({
    queryKey: ["/api/settings/shop_featured_heading"],
  });
  
  const { data: shopDescriptionDataQuery } = useQuery({
    queryKey: ["/api/settings/shop_featured_description"],
  });
  
  const { data: shopCountData } = useQuery({
    queryKey: ["/api/settings/shop_featured_count"],
  });

  // Fetch AI recommendation settings
  const { data: aiArtTitleData } = useQuery({
    queryKey: ["/api/settings/home_ai_art_title"],
  });
  
  const { data: aiArtSubtitleData } = useQuery({
    queryKey: ["/api/settings/home_ai_art_subtitle"],
  });
  
  const { data: aiShopTitleData } = useQuery({
    queryKey: ["/api/settings/home_ai_shop_title"],
  });
  
  const { data: aiShopSubtitleData } = useQuery({
    queryKey: ["/api/settings/home_ai_shop_subtitle"],
  });

  // Fetch customer engagement settings
  const { data: testimonialsEnabledData } = useQuery({
    queryKey: ["/api/settings/testimonials_enabled"],
  });

  // Fetch social proof settings  
  const { data: socialProofEnabledData } = useQuery({
    queryKey: ["/api/settings/social_proof_enabled"],
  });
  
  // Fetch gallery settings
  const { data: galleryDescriptionData } = useQuery({
    queryKey: ["/api/settings/gallery_description"],
  });
  
  const { data: galleryCategoriesData } = useQuery({
    queryKey: ["/api/settings/gallery_categories"],
  });
  
  const { data: galleriesDisplayCountData } = useQuery({
    queryKey: ["/api/settings/galleries_display_count"],
  });
  
  const { data: galleryLayoutData } = useQuery({
    queryKey: ["/api/settings/gallery_layout"],
  });
  
  // Fetch shop categories
  const { data: shopCategoriesData } = useQuery({
    queryKey: ["/api/settings/shop_categories"],
  });
  
  // Fetch main shop category names
  const { data: featuredCategoryNameData } = useQuery({
    queryKey: ["/api/settings/shop_featured_name"],
  });
  
  const { data: originalsCategoryNameData } = useQuery({
    queryKey: ["/api/settings/shop_originals_name"],
  });
  
  const { data: printsCategoryNameData } = useQuery({
    queryKey: ["/api/settings/shop_prints_name"],
  });
  
  const { data: merchandiseCategoryNameData } = useQuery({
    queryKey: ["/api/settings/shop_merchandise_name"],
  });
  
  // Fetch about page settings
  const { data: biographyData } = useQuery({
    queryKey: ["/api/settings/about_biography"],
  });
  
  const { data: artistStatementData } = useQuery({
    queryKey: ["/api/settings/about_artist_statement"],
  });
  
  const { data: studioTextData } = useQuery({
    queryKey: ["/api/settings/about_studio"],
  });
  
  const { data: cvTextData } = useQuery({
    queryKey: ["/api/settings/about_cv"],
  });
  

  
  const { data: profileImageData } = useQuery({
    queryKey: ["/api/settings/about_profile_image"],
  });
  
  const { data: studioImageData } = useQuery({
    queryKey: ["/api/settings/about_studio_image"],
  });

  // Fetch studio visit toggle setting
  const { data: studioVisitEnabledData } = useQuery({
    queryKey: ["/api/settings/studio_visit_enabled"],
  });

  // Fetch gallery page toggle setting
  const { data: galleryPageEnabledData } = useQuery({
    queryKey: ["/api/settings/gallery_page_enabled"],
  });

  // Fetch contact page toggle setting
  const { data: contactPageEnabledData } = useQuery({
    queryKey: ["/api/settings/contact_page_enabled"],
  });
  
  // Fetch page name settings
  const { data: galleryPageNameData } = useQuery({
    queryKey: ["/api/settings/gallery_page_name"],
  });
  
  const { data: shopPageNameData } = useQuery({
    queryKey: ["/api/settings/shop_page_name"],
  });
  
  const { data: aboutPageNameData } = useQuery({
    queryKey: ["/api/settings/about_page_name"],
  });
  
  const { data: contactPageNameData } = useQuery({
    queryKey: ["/api/settings/contact_page_name"],
  });
  
  // Fetch contact page settings
  const { data: contactHeadingData } = useQuery({
    queryKey: ["/api/settings/contact_heading"],
  });
  
  const { data: contactSubheadingData } = useQuery({
    queryKey: ["/api/settings/contact_subheading"],
  });
  
  const { data: contactEmailData } = useQuery({
    queryKey: ["/api/settings/contact_email"],
  });
  
  const { data: contactFormTextData } = useQuery({
    queryKey: ["/api/settings/contact_form_text"],
  });
  
  const { data: newsletterHeadingData } = useQuery({
    queryKey: ["/api/settings/newsletter_heading"],
  });
  
  const { data: newsletterTextData } = useQuery({
    queryKey: ["/api/settings/newsletter_text"],
  });
  
  const { data: followMeTextData } = useQuery({
    queryKey: ["/api/settings/follow_me_text"],
  });
  
  const { data: subscribeTextData } = useQuery({
    queryKey: ["/api/settings/subscribe_text"],
  });
  
  // Fetch footer settings
  const { data: footerTitleData } = useQuery({
    queryKey: ["/api/settings/footer_title"],
  });
  
  const { data: footerDescriptionData } = useQuery({
    queryKey: ["/api/settings/footer_description"],
  });

  // Fetch social settings
  const { data: instagramData } = useQuery({
    queryKey: ["/api/settings/social_instagram"],
  });
  
  const { data: facebookData } = useQuery({
    queryKey: ["/api/settings/social_facebook"],
  });
  
  const { data: twitterData } = useQuery({
    queryKey: ["/api/settings/social_twitter"],
  });
  
  const { data: youtubeData } = useQuery({
    queryKey: ["/api/settings/social_youtube"],
  });

  // Fetch email configuration settings
  const { data: mailchimpApiKeyData } = useQuery({
    queryKey: ["/api/settings/mailchimp_api_key"],
  });
  
  const { data: mailchimpListIdData } = useQuery({
    queryKey: ["/api/settings/mailchimp_list_id"],
  });
  
  const { data: mailchimpServerPrefixData } = useQuery({
    queryKey: ["/api/settings/mailchimp_server_prefix"],
  });
  
  const { data: emailProviderData } = useQuery({
    queryKey: ["/api/settings/email_provider"],
  });
  
  const { data: smtpHostData } = useQuery({
    queryKey: ["/api/settings/smtp_host"],
  });
  
  const { data: smtpPortData } = useQuery({
    queryKey: ["/api/settings/smtp_port"],
  });
  
  const { data: smtpUserData } = useQuery({
    queryKey: ["/api/settings/smtp_user"],
  });
  
  const { data: smtpPasswordData } = useQuery({
    queryKey: ["/api/settings/smtp_password"],
  });
  
  const { data: fromEmailData } = useQuery({
    queryKey: ["/api/settings/from_email"],
  });
  
  const { data: fromNameData } = useQuery({
    queryKey: ["/api/settings/from_name"],
  });

  // Fetch SEO settings for each page
  const { data: seoHomeTitleData } = useQuery({
    queryKey: ["/api/settings/seo_home_title"],
  });
  
  const { data: seoHomeDescriptionData } = useQuery({
    queryKey: ["/api/settings/seo_home_description"],
  });
  
  const { data: seoHomeKeywordsData } = useQuery({
    queryKey: ["/api/settings/seo_home_keywords"],
  });
  
  const { data: seoGalleryTitleData } = useQuery({
    queryKey: ["/api/settings/seo_gallery_title"],
  });
  
  const { data: seoGalleryDescriptionData } = useQuery({
    queryKey: ["/api/settings/seo_gallery_description"],
  });
  
  const { data: seoGalleryKeywordsData } = useQuery({
    queryKey: ["/api/settings/seo_gallery_keywords"],
  });
  
  const { data: seoShopTitleData } = useQuery({
    queryKey: ["/api/settings/seo_shop_title"],
  });
  
  const { data: seoShopDescriptionData } = useQuery({
    queryKey: ["/api/settings/seo_shop_description"],
  });
  
  const { data: seoShopKeywordsData } = useQuery({
    queryKey: ["/api/settings/seo_shop_keywords"],
  });
  
  const { data: seoAboutTitleData } = useQuery({
    queryKey: ["/api/settings/seo_about_title"],
  });
  
  const { data: seoAboutDescriptionData } = useQuery({
    queryKey: ["/api/settings/seo_about_description"],
  });
  
  const { data: seoAboutKeywordsData } = useQuery({
    queryKey: ["/api/settings/seo_about_keywords"],
  });
  
  const { data: seoContactTitleData } = useQuery({
    queryKey: ["/api/settings/seo_contact_title"],
  });
  
  const { data: seoContactDescriptionData } = useQuery({
    queryKey: ["/api/settings/seo_contact_description"],
  });
  
  const { data: seoContactKeywordsData } = useQuery({
    queryKey: ["/api/settings/seo_contact_keywords"],
  });
  
  const { data: seoCommissionTitleData } = useQuery({
    queryKey: ["/api/settings/seo_commission_title"],
  });
  
  const { data: seoCommissionDescriptionData } = useQuery({
    queryKey: ["/api/settings/seo_commission_description"],
  });
  
  const { data: seoCommissionKeywordsData } = useQuery({
    queryKey: ["/api/settings/seo_commission_keywords"],
  });
  
  const { data: linkedinData } = useQuery({
    queryKey: ["/api/settings/social_linkedin"],
  });
  
  const { data: tiktokData } = useQuery({
    queryKey: ["/api/settings/social_tiktok"],
  });
  
  const { data: pinterestData } = useQuery({
    queryKey: ["/api/settings/social_pinterest"],
  });
  
  const { data: websiteData } = useQuery({
    queryKey: ["/api/settings/social_website"],
  });
  
  // Fetch shop description
  const { data: shopDescriptionData } = useQuery({
    queryKey: ["/api/settings/shop_description"],
  });

  // Fetch color settings
  const { data: primaryBackgroundColorData } = useQuery({
    queryKey: ["/api/settings/color_primary_background"],
  });
  
  const { data: primaryTextColorData } = useQuery({
    queryKey: ["/api/settings/color_primary_text"],
  });
  
  const { data: navigationTextColorData } = useQuery({
    queryKey: ["/api/settings/color_navigation_text"],
  });
  
  const { data: accentColorData } = useQuery({
    queryKey: ["/api/settings/color_accent"],
  });
  
  // Update state when data is loaded
  useEffect(() => {
    if (heroImageData && typeof heroImageData === 'object' && 'value' in heroImageData) {
      setHeroImage(heroImageData.value as string);
    }
    
    if (heroHeadingData && typeof heroHeadingData === 'object' && 'value' in heroHeadingData) {
      setHeroHeading(heroHeadingData.value as string);
    }
    
    if (heroSubheadingData && typeof heroSubheadingData === 'object' && 'value' in heroSubheadingData) {
      setHeroSubheading(heroSubheadingData.value as string);
    }
    
    if (featuredHeadingData && typeof featuredHeadingData === 'object' && 'value' in featuredHeadingData) {
      setFeaturedHeading(featuredHeadingData.value as string);
    }
    
    if (featuredDescriptionData && typeof featuredDescriptionData === 'object' && 'value' in featuredDescriptionData) {
      setFeaturedDescription(featuredDescriptionData.value as string);
    }
    
    if (featuredCountData && typeof featuredCountData === 'object' && 'value' in featuredCountData) {
      setFeaturedCount(featuredCountData.value as string);
    }
    
    // Load featured shop settings
    if (shopHeadingData && typeof shopHeadingData === 'object' && 'value' in shopHeadingData) {
      setShopHeading(shopHeadingData.value as string);
    }
    
    if (shopDescriptionDataQuery && typeof shopDescriptionDataQuery === 'object' && 'value' in shopDescriptionDataQuery) {
      setShopDescription(shopDescriptionDataQuery.value as string);
    }
    
    if (shopCountData && typeof shopCountData === 'object' && 'value' in shopCountData) {
      setShopCount(shopCountData.value as string);
    }

    // Load customer engagement settings
    if (testimonialsEnabledData && typeof testimonialsEnabledData === 'object' && 'value' in testimonialsEnabledData) {
      setTestimonialsEnabled(testimonialsEnabledData.value as string);
    }

    // Load social proof settings
    if (socialProofEnabledData && typeof socialProofEnabledData === 'object' && 'value' in socialProofEnabledData) {
      setSocialProofEnabled(socialProofEnabledData.value as string);
    }

    // Load AI recommendation settings
    if (aiArtTitleData && typeof aiArtTitleData === 'object' && 'value' in aiArtTitleData) {
      setAiArtTitle(aiArtTitleData.value as string);
    }
    
    if (aiArtSubtitleData && typeof aiArtSubtitleData === 'object' && 'value' in aiArtSubtitleData) {
      setAiArtSubtitle(aiArtSubtitleData.value as string);
    }
    
    if (aiShopTitleData && typeof aiShopTitleData === 'object' && 'value' in aiShopTitleData) {
      setAiShopTitle(aiShopTitleData.value as string);
    }
    
    if (aiShopSubtitleData && typeof aiShopSubtitleData === 'object' && 'value' in aiShopSubtitleData) {
      setAiShopSubtitle(aiShopSubtitleData.value as string);
    }
    
    if (galleryDescriptionData && typeof galleryDescriptionData === 'object' && 'value' in galleryDescriptionData) {
      setGalleryDescription(galleryDescriptionData.value as string);
    }
    
    if (galleryCategoriesData && typeof galleryCategoriesData === 'object' && 'value' in galleryCategoriesData) {
      try {
        const categories = JSON.parse(galleryCategoriesData.value as string);
        if (Array.isArray(categories)) {
          setGalleryCategories(categories);
        }
      } catch (e) {
        console.error("Error parsing gallery categories:", e);
        setGalleryCategories(["featured", "imaginative-realism", "sculpture", "murals", "figurative", "chinese-zodiac-series", "vinyl-record-art"]);
      }
    } else {
      // Default categories if none found
      setGalleryCategories(["featured", "imaginative-realism", "sculpture", "murals", "figurative", "chinese-zodiac-series", "vinyl-record-art"]);
    }
    
    // Handle shop categories
    if (shopCategoriesData && typeof shopCategoriesData === 'object' && 'value' in shopCategoriesData) {
      try {
        const categories = JSON.parse(shopCategoriesData.value as string);
        if (Array.isArray(categories)) {
          setShopCategories(categories);
        }
      } catch (e) {
        console.error("Error parsing shop categories:", e);
        setShopCategories(["prints", "original-paintings", "merchandise"]);
      }
    } else {
      // Default categories if none found
      setShopCategories(["prints", "original-paintings", "merchandise"]);
    }
    
    // Load the galleries display count setting
    if (galleriesDisplayCountData && typeof galleriesDisplayCountData === 'object' && 'value' in galleriesDisplayCountData) {
      setGalleriesDisplayCount(galleriesDisplayCountData.value as string);
    } else {
      // Default to showing 5 galleries if setting not found
      setGalleriesDisplayCount("5");
    }
    
    // Load the gallery layout setting
    if (galleryLayoutData && typeof galleryLayoutData === 'object' && 'value' in galleryLayoutData) {
      setGalleryLayout(galleryLayoutData.value as string);
    } else {
      // Default to grid layout
      setGalleryLayout("grid");
    }
    
    if (biographyData && typeof biographyData === 'object' && 'value' in biographyData) {
      setBiographyText(biographyData.value as string);
    }
    
    if (artistStatementData && typeof artistStatementData === 'object' && 'value' in artistStatementData) {
      setArtistStatement(artistStatementData.value as string);
    }
    
    if (studioTextData && typeof studioTextData === 'object' && 'value' in studioTextData) {
      setStudioText(studioTextData.value as string);
    }
    
    if (cvTextData && typeof cvTextData === 'object' && 'value' in cvTextData) {
      setCvText(cvTextData.value as string);
    }
    

    
    if (profileImageData && typeof profileImageData === 'object' && 'value' in profileImageData) {
      setProfileImage(profileImageData.value as string);
    }
    
    if (studioImageData && typeof studioImageData === 'object' && 'value' in studioImageData) {
      setStudioImage(studioImageData.value as string);
    }

    if (studioVisitEnabledData && typeof studioVisitEnabledData === 'object' && 'value' in studioVisitEnabledData) {
      setStudioVisitEnabled(studioVisitEnabledData.value === 'true');
    }
    
    if (galleryPageEnabledData && typeof galleryPageEnabledData === 'object' && 'value' in galleryPageEnabledData) {
      setGalleryPageEnabled(galleryPageEnabledData.value === 'true');
    }
    
    if (contactPageEnabledData && typeof contactPageEnabledData === 'object' && 'value' in contactPageEnabledData) {
      setContactPageEnabled(contactPageEnabledData.value === 'true');
    }
    
    if (instagramData && typeof instagramData === 'object' && 'value' in instagramData) {
      setInstagram(instagramData.value as string);
    }
    
    if (facebookData && typeof facebookData === 'object' && 'value' in facebookData) {
      setFacebook(facebookData.value as string);
    }
    
    if (twitterData && typeof twitterData === 'object' && 'value' in twitterData) {
      setTwitter(twitterData.value as string);
    }
    
    if (youtubeData && typeof youtubeData === 'object' && 'value' in youtubeData) {
      setYoutube(youtubeData.value as string);
    }
    
    if (linkedinData && typeof linkedinData === 'object' && 'value' in linkedinData) {
      setLinkedin(linkedinData.value as string);
    }
    
    if (tiktokData && typeof tiktokData === 'object' && 'value' in tiktokData) {
      setTiktok(tiktokData.value as string);
    }
    
    if (pinterestData && typeof pinterestData === 'object' && 'value' in pinterestData) {
      setPinterest(pinterestData.value as string);
    }
    
    if (websiteData && typeof websiteData === 'object' && 'value' in websiteData) {
      setWebsite(websiteData.value as string);
    }
    
    if (footerTitleData && typeof footerTitleData === 'object' && 'value' in footerTitleData) {
      setFooterTitle(footerTitleData.value as string);
    }
    
    if (footerDescriptionData && typeof footerDescriptionData === 'object' && 'value' in footerDescriptionData) {
      setFooterDescription(footerDescriptionData.value as string);
    }
    
    if (shopDescriptionData && typeof shopDescriptionData === 'object' && 'value' in shopDescriptionData) {
      setShopDescription(shopDescriptionData.value as string);
    }

    // Load color settings
    if (primaryBackgroundColorData && typeof primaryBackgroundColorData === 'object' && 'value' in primaryBackgroundColorData) {
      setPrimaryBackgroundColor(primaryBackgroundColorData.value as string);
    }
    
    if (primaryTextColorData && typeof primaryTextColorData === 'object' && 'value' in primaryTextColorData) {
      setPrimaryTextColor(primaryTextColorData.value as string);
    }
    
    if (navigationTextColorData && typeof navigationTextColorData === 'object' && 'value' in navigationTextColorData) {
      setNavigationTextColor(navigationTextColorData.value as string);
    }
    
    if (accentColorData && typeof accentColorData === 'object' && 'value' in accentColorData) {
      setAccentColor(accentColorData.value as string);
    }
    
    // Handle testimonials and social proof settings
    if (testimonialsEnabledData && typeof testimonialsEnabledData === 'object' && 'value' in testimonialsEnabledData) {
      setTestimonialsEnabled(testimonialsEnabledData.value as string);
    }
    
    if (socialProofEnabledData && typeof socialProofEnabledData === 'object' && 'value' in socialProofEnabledData) {
      setSocialProofEnabled(socialProofEnabledData.value as string);
    }
    
    // Handle page name settings
    if (galleryPageNameData && typeof galleryPageNameData === 'object' && 'value' in galleryPageNameData) {
      setGalleryPageName(galleryPageNameData.value as string);
    }
    
    if (shopPageNameData && typeof shopPageNameData === 'object' && 'value' in shopPageNameData) {
      setShopPageName(shopPageNameData.value as string);
    }
    
    if (aboutPageNameData && typeof aboutPageNameData === 'object' && 'value' in aboutPageNameData) {
      setAboutPageName(aboutPageNameData.value as string);
    }
    
    if (contactPageNameData && typeof contactPageNameData === 'object' && 'value' in contactPageNameData) {
      setContactPageName(contactPageNameData.value as string);
    }
    
    if (featuredCategoryNameData && typeof featuredCategoryNameData === 'object' && 'value' in featuredCategoryNameData) {
      setFeaturedCategoryName(featuredCategoryNameData.value as string);
    }
    
    if (originalsCategoryNameData && typeof originalsCategoryNameData === 'object' && 'value' in originalsCategoryNameData) {
      setOriginalsCategoryName(originalsCategoryNameData.value as string);
    }
    
    if (printsCategoryNameData && typeof printsCategoryNameData === 'object' && 'value' in printsCategoryNameData) {
      setPrintsCategoryName(printsCategoryNameData.value as string);
    }
    
    if (merchandiseCategoryNameData && typeof merchandiseCategoryNameData === 'object' && 'value' in merchandiseCategoryNameData) {
      setMerchandiseCategoryName(merchandiseCategoryNameData.value as string);
    }
    
    // Load email configuration settings
    if (mailchimpApiKeyData && typeof mailchimpApiKeyData === 'object' && 'value' in mailchimpApiKeyData) {
      setMailchimpApiKey(mailchimpApiKeyData.value as string);
    }
    
    if (mailchimpListIdData && typeof mailchimpListIdData === 'object' && 'value' in mailchimpListIdData) {
      setMailchimpListId(mailchimpListIdData.value as string);
    }
    
    if (mailchimpServerPrefixData && typeof mailchimpServerPrefixData === 'object' && 'value' in mailchimpServerPrefixData) {
      setMailchimpServerPrefix(mailchimpServerPrefixData.value as string);
    }
    
    if (emailProviderData && typeof emailProviderData === 'object' && 'value' in emailProviderData) {
      setEmailProvider(emailProviderData.value as string);
    }
    
    if (smtpHostData && typeof smtpHostData === 'object' && 'value' in smtpHostData) {
      setSmtpHost(smtpHostData.value as string);
    }
    
    if (smtpPortData && typeof smtpPortData === 'object' && 'value' in smtpPortData) {
      setSmtpPort(smtpPortData.value as string);
    }
    
    if (smtpUserData && typeof smtpUserData === 'object' && 'value' in smtpUserData) {
      setSmtpUser(smtpUserData.value as string);
    }
    
    if (smtpPasswordData && typeof smtpPasswordData === 'object' && 'value' in smtpPasswordData) {
      setSmtpPassword(smtpPasswordData.value as string);
    }
    
    if (fromEmailData && typeof fromEmailData === 'object' && 'value' in fromEmailData) {
      setFromEmail(fromEmailData.value as string);
    }
    
    if (fromNameData && typeof fromNameData === 'object' && 'value' in fromNameData) {
      setFromName(fromNameData.value as string);
    }
  }, [
    heroImageData, 
    heroHeadingData, 
    heroSubheadingData, 
    featuredHeadingData, 
    featuredDescriptionData,
    featuredCountData,
    galleryDescriptionData,
    galleryCategoriesData,
    galleriesDisplayCountData,
    galleryLayoutData,
    biographyData,
    artistStatementData,
    studioTextData,
    cvTextData,

    profileImageData,
    studioImageData,
    instagramData,
    facebookData,
    twitterData,
    youtubeData,
    linkedinData,
    tiktokData,
    pinterestData,
    websiteData,
    footerTitleData,
    footerDescriptionData,
    shopDescriptionData,
    testimonialsEnabledData,
    socialProofEnabledData,
    galleryPageNameData,
    shopPageNameData,
    aboutPageNameData,
    contactPageNameData,
    shopCategoriesData,
    featuredCategoryNameData,
    originalsCategoryNameData,
    printsCategoryNameData,
    merchandiseCategoryNameData
  ]);
  
  // Save mutation
  const saveMutation = useMutation<any, Error, { key: string, value: string }>({
    mutationFn: (data) => apiRequest("PUT", "/api/admin/settings", data),
    onSuccess: () => {
      setIsChanged(false);
      setSettingsToSave([]);
      toast({
        title: "Settings updated",
        description: "Your website settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Batch save mutation to avoid rate limiting
  const batchSaveMutation = useMutation<any, Error, { settings: Array<{ key: string, value: string }> }>({
    mutationFn: (data) => apiRequest("PUT", "/api/admin/settings/batch", data),
    onSuccess: () => {
      setIsChanged(false);
      setSettingsToSave([]);
      
      // Force comprehensive cache invalidation after successful save
      cacheInvalidation.settings();
      cacheInvalidation.galleryAndShop();
      
      // Mark changes as saved
      adminNavigationGuard.markChanges();
      
      toast({
        title: "Settings updated",
        description: "Your website settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    },
  });
  
  // Event handlers
  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroImage(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("home_hero_image", e.target.value);
  };
  
  // Handle file upload for hero image
  const handleHeroImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsHeroImageUploading(true);
    
    try {
      // Create a FormData object for the file upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('settingKey', 'home_hero_image');
      
      // Upload the file
      const response = await fetch('/api/admin/settings/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Don't set Content-Type when using FormData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the hero image with the new Cloudinary URL
        setHeroImage(data.imageUrl);
        setIsChanged(true);
        
        // Update the query cache
        queryClient.invalidateQueries({ queryKey: ["/api/settings/home_hero_image"] });
        
        toast({
          title: "Image uploaded successfully",
          description: "Your hero image has been updated.",
        });
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading hero image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsHeroImageUploading(false);
    }
  };
  
  const handleHeroHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroHeading(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("home_hero_heading", e.target.value);
  };
  
  const handleHeroSubheadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroSubheading(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("home_hero_subheading", e.target.value);
  };
  
  const handleFeaturedHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeaturedHeading(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("home_featured_heading", e.target.value);
  };
  
  const handleFeaturedDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeaturedDescription(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("home_featured_description", e.target.value);
  };
  
  const handleFeaturedCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeaturedCount(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("home_featured_count", e.target.value);
  };
  
  // Featured shop handlers
  const handleShopHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShopHeading(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("shop_featured_heading", e.target.value);
  };
  
  const handleShopDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setShopDescription(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("shop_featured_description", e.target.value);
  };
  
  const handleShopCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShopCount(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("shop_featured_count", e.target.value);
  };

  // Customer engagement handlers
  const handleTestimonialsEnabledChange = (checked: boolean) => {
    const value = checked ? "true" : "false";
    setTestimonialsEnabled(value);
    setIsChanged(true);
    updateSettingsToSave("testimonials_enabled", value);
  };

  // Social proof handlers
  const handleSocialProofEnabledChange = (checked: boolean) => {
    const value = checked ? "true" : "false";
    setSocialProofEnabled(value);
    setIsChanged(true);
    updateSettingsToSave("social_proof_enabled", value);
  };
  
  const handleFooterTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFooterTitle(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("footer_title", e.target.value);
  };
  
  const handleFooterDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFooterDescription(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("footer_description", e.target.value);
  };
  
  const handleSocialMediaChange = (key: string, value: string) => {
    // Update the appropriate state based on the key
    if (key === "social_instagram") {
      setInstagram(value);
    } else if (key === "social_facebook") {
      setFacebook(value);
    } else if (key === "social_twitter") {
      setTwitter(value);
    } else if (key === "social_youtube") {
      setYoutube(value);
    } else if (key === "social_linkedin") {
      setLinkedin(value);
    } else if (key === "social_tiktok") {
      setTiktok(value);
    } else if (key === "social_pinterest") {
      setPinterest(value);
    } else if (key === "social_website") {
      setWebsite(value);
    }
    setIsChanged(true);
    updateSettingsToSave(key, value);
  };
  
  const handleBiographyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBiographyText(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("about_biography", e.target.value);
    // Mark that admin changes have been made
    adminNavigationGuard.markChanges();
  };
  
  const handleArtistStatementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setArtistStatement(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("about_artist_statement", e.target.value);
  };
  
  const handleStudioTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStudioText(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("about_studio", e.target.value);
  };
  
  const handleCvTextChange = (value: string) => {
    setCvText(value);
    setIsChanged(true);
    updateSettingsToSave("about_cv", value);
  };
  

  
  const handleGalleryDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGalleryDescription(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("gallery_description", e.target.value);
  };
  
  // Function to handle galleries display count change
  const handleGalleriesDisplayCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalleriesDisplayCount(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("galleries_display_count", e.target.value);
  };
  
  // Function to handle gallery layout change
  const handleGalleryLayoutChange = (value: string) => {
    setGalleryLayout(value);
    setIsChanged(true);
    updateSettingsToSave("gallery_layout", value);
  };
  
  // Function to update a category name
  const handleUpdateCategoryName = (index: number, newName: string) => {
    const updatedCategories = [...galleryCategories];
    updatedCategories[index] = newName;
    setGalleryCategories(updatedCategories);
    setIsChanged(true);
    updateSettingsToSave("gallery_categories", JSON.stringify(updatedCategories));
  };
  
  // Function to move a category up or down in the list
  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === galleryCategories.length - 1)
    ) {
      return; // Can't move further up/down
    }
    
    const updatedCategories = [...galleryCategories];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap the categories
    [updatedCategories[index], updatedCategories[newIndex]] = 
    [updatedCategories[newIndex], updatedCategories[index]];
    
    setGalleryCategories(updatedCategories);
    setIsChanged(true);
    updateSettingsToSave("gallery_categories", JSON.stringify(updatedCategories));
  };
  
  // Function to remove a category
  const handleRemoveCategory = (index: number) => {
    if (galleryCategories.length <= 1) {
      toast({
        title: "Cannot remove last category",
        description: "You must have at least one gallery category",
        variant: "destructive",
      });
      return;
    }
    
    const updatedCategories = [...galleryCategories];
    updatedCategories.splice(index, 1);
    
    setGalleryCategories(updatedCategories);
    setIsChanged(true);
    updateSettingsToSave("gallery_categories", JSON.stringify(updatedCategories));
  };
  
  // Function to add a new category
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const updatedCategories = [...galleryCategories, newCategory.trim()];
    setGalleryCategories(updatedCategories);
    setNewCategory(""); // Clear the input
    setIsChanged(true);
    updateSettingsToSave("gallery_categories", JSON.stringify(updatedCategories));
  };

  // Shop Categories handler functions
  const handleUpdateShopCategoryName = (index: number, newName: string) => {
    const updatedCategories = [...shopCategories];
    updatedCategories[index] = newName;
    setShopCategories(updatedCategories);
    setIsChanged(true);
    updateSettingsToSave("shop_categories", JSON.stringify(updatedCategories));
  };

  const handleMoveShopCategory = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === shopCategories.length - 1)
    ) {
      return;
    }
    
    const updatedCategories = [...shopCategories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [updatedCategories[index], updatedCategories[targetIndex]] = [updatedCategories[targetIndex], updatedCategories[index]];
    setShopCategories(updatedCategories);
    setIsChanged(true);
    updateSettingsToSave("shop_categories", JSON.stringify(updatedCategories));
  };

  const handleAddShopCategory = () => {
    if (!newShopCategory.trim()) return;
    
    const updatedCategories = [...shopCategories, newShopCategory.trim()];
    setShopCategories(updatedCategories);
    setNewShopCategory("");
    setIsChanged(true);
    updateSettingsToSave("shop_categories", JSON.stringify(updatedCategories));
  };

  const handleRemoveShopCategory = (index: number) => {
    if (shopCategories.length === 1) {
      toast({
        title: "Cannot remove last category",
        description: "You must have at least one shop category",
        variant: "destructive",
      });
      return;
    }
    
    const updatedCategories = [...shopCategories];
    updatedCategories.splice(index, 1);
    
    setShopCategories(updatedCategories);
    setIsChanged(true);
    updateSettingsToSave("shop_categories", JSON.stringify(updatedCategories));
  };
  
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileImage(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("about_profile_image", e.target.value);
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProfileImage(data.url);
      setIsChanged(true);
      updateSettingsToSave("about_profile_image", data.url);

      toast({
        title: "Image uploaded successfully",
        description: "Your profile image has been updated",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleStudioImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudioImage(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("about_studio_image", e.target.value);
  };

  const handleStudioVisitToggle = (checked: boolean) => {
    setStudioVisitEnabled(checked);
    setIsChanged(true);
    updateSettingsToSave("studio_visit_enabled", checked.toString());
  };

  const handleGalleryPageToggle = (checked: boolean) => {
    setGalleryPageEnabled(checked);
    setIsChanged(true);
    updateSettingsToSave("gallery_page_enabled", checked.toString());
  };

  const handleContactPageToggle = (checked: boolean) => {
    setContactPageEnabled(checked);
    setIsChanged(true);
    updateSettingsToSave("contact_page_enabled", checked.toString());
  };
  
  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstagram(e.target.value);
    setIsChanged(true);
    updateSettingsToSave("social_instagram", e.target.value);
  };
  
  // Save all settings using batch endpoint to avoid rate limiting
  const saveSettings = async () => {
    try {
      // Use batch endpoint to save all settings at once
      if (settingsToSave.length > 0) {
        await batchSaveMutation.mutateAsync({ settings: settingsToSave });
      }
      
      // Force comprehensive cache invalidation after saving
      cacheInvalidation.settings();
      cacheInvalidation.galleryAndShop();
      
      // Also clear any cached images/media
      queryClient.removeQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          (query.queryKey[0].includes('image') || query.queryKey[0].includes('media'))
      });
      
      // After all settings are saved
      // Home page settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/home_hero_image"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/home_hero_heading"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/home_hero_subheading"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/home_featured_heading"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/home_featured_description"]
      });
      
      // Gallery settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/gallery_description"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/gallery_categories"]
      });
      
      // Shop settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/shop_categories"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/galleries_display_count"]
      });
      
      // About page settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_biography"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_artist_statement"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_studio"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_cv"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_full_resume"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_profile_image"]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/about_studio_image"]
      });
      
      // Social settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/social_instagram"]
      });

      // Customer engagement settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/testimonials_enabled"]
      });

      // Social proof settings
      queryClient.invalidateQueries({ 
        queryKey: ["/api/settings/social_proof_enabled"]
      });
      
      setIsChanged(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An unexpected error occurred while saving settings",
        variant: "destructive",
      });
    }
  };
  
  const handleSave = () => {
    saveSettings();
  };
  
  // Helper function to update settings to save
  const updateSettingsToSave = (key: string, value: string) => {
    setSettingsToSave(prev => {
      const existingIndex = prev.findIndex(item => item.key === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { key, value };
        return updated;
      } else {
        return [...prev, { key, value }];
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex h-16 items-center px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Page Settings</h1>
            <p className="text-sm text-gray-500">Configure how your website pages appear to visitors</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        
        <Tabs 
          defaultValue="homepage" 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="mb-8"
        >

          
          {/* Homepage Settings Tab */}
          <TabsContent value="homepage">
            <Card>
              <CardHeader>
                <CardTitle>Homepage Settings</CardTitle>
                <CardDescription>
                  Configure how your homepage appears to visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Menu Bar Text */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Menu Bar Text</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure the main title and subtitle that appear in your website header.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="menu-bar-title">Main Title</Label>
                        <Input 
                          id="menu-bar-title"
                          placeholder="Gabe Wells"
                          value={menuBarTitle}
                          onChange={(e) => {
                            setMenuBarTitle(e.target.value);
                            updateSettingsToSave("menu_bar_title", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          The main title that appears at the top of your website.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="menu-bar-subtitle">Subtitle</Label>
                        <Input 
                          id="menu-bar-subtitle"
                          placeholder="FINE ART"
                          value={menuBarSubtitle}
                          onChange={(e) => {
                            setMenuBarSubtitle(e.target.value);
                            updateSettingsToSave("menu_bar_subtitle", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          The subtitle that appears below your main title.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="mb-3" />
                  
                  {/* Hero Section */}
                  <div>
                    <h3 className="text-lg font-medium">Hero Section</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure the main hero section that appears at the top of your homepage.
                    </p>
                  </div>
                  
                  {/* Hero Image */}
                  <div>
                    <Label htmlFor="hero-image" className="text-base font-medium">Hero Image</Label>
                    <div className="mt-2 space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setUseImageUpload(!useImageUpload)}
                            className="text-sm h-9"
                          >
                            {useImageUpload ? "Enter URL Instead" : "Upload Image Instead"}
                          </Button>
                          {isHeroImageUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                        </div>
                        
                        {!useImageUpload ? (
                          <>
                            <Input 
                              id="hero-image"
                              placeholder="https://example.com/your-hero-image.jpg"
                              value={heroImage}
                              onChange={handleHeroImageChange}
                            />
                            <p className="text-sm text-muted-foreground">
                              Enter the URL of the main background image for your homepage. 
                              For best results, use a high-quality landscape image (recommended size: 1920 x 1080 pixels).
                            </p>
                          </>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                            <label className="flex flex-col items-center cursor-pointer py-4">
                              <Upload className="h-12 w-12 text-gray-400 mb-2" />
                              <span className="text-lg font-medium mb-1">
                                Click to upload image
                              </span>
                              <span className="text-sm text-gray-500">
                                JPG, PNG or GIF, up to 10MB
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleHeroImageFileChange}
                                disabled={isHeroImageUploading}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {heroImage && (
                      <div className="mt-4">
                        <div className="w-full h-40 rounded-md overflow-hidden relative">
                          <img 
                            src={heroImage} 
                            alt="Hero image preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Hero Heading */}
                  <div>
                    <Label htmlFor="hero-heading" className="text-base font-medium">Hero Heading</Label>
                    <div className="mt-2">
                      <Input 
                        id="hero-heading"
                        placeholder="Artist Name or Main Headline"
                        value={heroHeading}
                        onChange={handleHeroHeadingChange}
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        The main headline that appears in your hero section.
                      </p>
                    </div>
                  </div>
                  
                  {/* Hero Subheading */}
                  <div>
                    <Label htmlFor="hero-subheading" className="text-base font-medium">Hero Subheading</Label>
                    <div className="mt-2">
                      <Input 
                        id="hero-subheading"
                        placeholder="Brief description or tagline"
                        value={heroSubheading}
                        onChange={handleHeroSubheadingChange}
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        A brief description or tagline that appears below the main headline.
                      </p>
                    </div>
                  </div>
                  

                  
                  {/* AI Recommendations Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium">AI Recommendations</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize the text for your AI-powered art and product recommendation sections.
                    </p>
                  </div>
                  
                  {/* AI Art Recommendations Title */}
                  <div>
                    <Label htmlFor="ai-art-title" className="text-base font-medium">Art Recommendations Title</Label>
                    <div className="mt-2">
                      <Input 
                        id="ai-art-title"
                        placeholder="Discover Art You'll Love"
                        value={aiArtTitle}
                        onChange={(e) => {
                          setAiArtTitle(e.target.value);
                          updateSettingsToSave("home_ai_art_title", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        The heading for your AI art recommendations section.
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Art Recommendations Subtitle */}
                  <div>
                    <Label htmlFor="ai-art-subtitle" className="text-base font-medium">Art Recommendations Subtitle</Label>
                    <div className="mt-2">
                      <Textarea 
                        id="ai-art-subtitle"
                        placeholder="Our AI curator has selected these masterpieces based on your unique taste and browsing patterns"
                        value={aiArtSubtitle}
                        onChange={(e) => {
                          setAiArtSubtitle(e.target.value);
                          updateSettingsToSave("home_ai_art_subtitle", e.target.value);
                          setIsChanged(true);
                        }}
                        className="h-20"
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        The description text that appears below your art recommendations title.
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Shop Recommendations Title */}
                  <div>
                    <Label htmlFor="ai-shop-title" className="text-base font-medium">Shop Recommendations Title</Label>
                    <div className="mt-2">
                      <Input 
                        id="ai-shop-title"
                        placeholder="Products Perfect for You"
                        value={aiShopTitle}
                        onChange={(e) => {
                          setAiShopTitle(e.target.value);
                          updateSettingsToSave("home_ai_shop_title", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        The heading for your AI shop recommendations section.
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Shop Recommendations Subtitle */}
                  <div>
                    <Label htmlFor="ai-shop-subtitle" className="text-base font-medium">Shop Recommendations Subtitle</Label>
                    <div className="mt-2">
                      <Textarea 
                        id="ai-shop-subtitle"
                        placeholder="Smart recommendations based on your art preferences and browsing history"
                        value={aiShopSubtitle}
                        onChange={(e) => {
                          setAiShopSubtitle(e.target.value);
                          updateSettingsToSave("home_ai_shop_subtitle", e.target.value);
                          setIsChanged(true);
                        }}
                        className="h-20"
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        The description text that appears below your shop recommendations title.
                      </p>
                    </div>
                  </div>

                  {/* Customer Engagement Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium">Customer Engagement</h3>
                    <p className="text-sm text-muted-foreground">
                      Control customer testimonials and reviews displayed on your homepage.
                    </p>
                  </div>
                  
                  {/* Testimonials Toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="testimonials-enabled" className="text-base font-medium">Enable Testimonials</Label>
                        <p className="text-sm text-muted-foreground">
                          Display customer testimonials and reviews on your homepage.
                        </p>
                      </div>
                      <Switch
                        id="testimonials-enabled"
                        checked={testimonialsEnabled === "true"}
                        onCheckedChange={handleTestimonialsEnabledChange}
                      />
                    </div>
                  </div>
                  
                  {/* Social Proof Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium">Social Proof</h3>
                    <p className="text-sm text-muted-foreground">
                      Show social proof elements to build customer confidence.
                    </p>
                  </div>
                  
                  {/* Social Proof Toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="social-proof-enabled" className="text-base font-medium">Enable Social Proof</Label>
                        <p className="text-sm text-muted-foreground">
                          Display recent purchases and visitor counters on your homepage.
                        </p>
                      </div>
                      <Switch
                        id="social-proof-enabled"
                        checked={socialProofEnabled === "true"}
                        onCheckedChange={handleSocialProofEnabledChange}
                      />
                    </div>
                  </div>

                  {/* Social Media Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium">Social Media</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your social media links to display in the footer.
                    </p>
                  </div>
                  
                  {/* Instagram */}
                  <div>
                    <Label htmlFor="instagram" className="text-base font-medium">Instagram Profile</Label>
                    <div className="mt-2">
                      <Input 
                        id="instagram"
                        placeholder="https://instagram.com/yourusername"
                        value={instagram}
                        onChange={handleInstagramChange}
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Your Instagram profile URL.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {isChanged && activeTab === "homepage" && "You have unsaved changes."}
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={!isChanged || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Shop Settings Tab */}
          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>Shop Settings</CardTitle>
                <CardDescription>
                  Configure how your art shop page appears to visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Shop Page Enable/Disable */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Shop Page Settings</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Control your shop page visibility and content
                    </p>
                    
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="shop-enabled" className="text-base font-medium">Enable Shop Page</Label>
                          <p className="text-sm text-muted-foreground">
                            Control whether the Shop page appears in your website navigation menu.
                          </p>
                        </div>
                        <Switch
                          id="shop-enabled"
                          checked={shopPageData?.value === "true"}
                          onCheckedChange={(checked) => {
                            updateSettingsToSave("shop_page_enabled", checked ? "true" : "false");
                            setIsChanged(true);
                            queryClient.setQueryData(
                              ["/api/settings/shop_page_enabled"], 
                              { value: checked ? "true" : "false" }
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Page Name */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Page Name</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The name that appears in your website navigation menu for this page.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="shop-page-name">Navigation Menu Name</Label>
                      <Input 
                        id="shop-page-name"
                        placeholder="Shop"
                        value={shopPageName}
                        onChange={(e) => {
                          setShopPageName(e.target.value);
                          updateSettingsToSave("shop_page_name", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        This is what visitors will see in the navigation menu.
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="mb-3" />
                  
                  {/* Shop Description */}
                  <div>
                    <h3 className="text-lg font-medium">Shop Description</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The description text that appears at the top of your shop page
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="shop-description">Description</Label>
                      <Textarea 
                        id="shop-description" 
                        value={shopDescription}
                        onChange={handleShopDescriptionChange}
                        placeholder="Enter a description for your shop page"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Main Category Names */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">Main Category Names</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Customize the names of your main shop categories that appear in the navigation
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="featured-category-name">Featured Category Name</Label>
                        <Input
                          id="featured-category-name"
                          value={featuredCategoryName}
                          onChange={(e) => {
                            setFeaturedCategoryName(e.target.value);
                            updateSettingsToSave("shop_featured_name", e.target.value);
                            setIsChanged(true);
                          }}
                          placeholder="Featured"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="originals-category-name">Originals Category Name</Label>
                        <Input
                          id="originals-category-name"
                          value={originalsCategoryName}
                          onChange={(e) => {
                            setOriginalsCategoryName(e.target.value);
                            updateSettingsToSave("shop_originals_name", e.target.value);
                            setIsChanged(true);
                          }}
                          placeholder="Originals"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="prints-category-name">Prints Category Name</Label>
                        <Input
                          id="prints-category-name"
                          value={printsCategoryName}
                          onChange={(e) => {
                            setPrintsCategoryName(e.target.value);
                            updateSettingsToSave("shop_prints_name", e.target.value);
                            setIsChanged(true);
                          }}
                          placeholder="Prints"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="merchandise-category-name">Merchandise Category Name</Label>
                        <Input
                          id="merchandise-category-name"
                          value={merchandiseCategoryName}
                          onChange={(e) => {
                            setMerchandiseCategoryName(e.target.value);
                            updateSettingsToSave("shop_merchandise_name", e.target.value);
                            setIsChanged(true);
                          }}
                          placeholder="Merchandise"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shop Categories */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">Shop Categories</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Edit, reorder, or add new categories for your shop products
                    </p>
                    
                    <div className="space-y-4">
                      {/* Current Categories */}
                      <div className="space-y-2">
                        <Label>Current Categories</Label>
                        <div className="border rounded-md divide-y">
                          {shopCategories.map((category, index) => (
                            <div key={index} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm font-mono">{index + 1}</span>
                                <Input 
                                  value={category} 
                                  onChange={(e) => handleUpdateShopCategoryName(index, e.target.value)}
                                  className="w-48 md:w-64" 
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={index === 0}
                                  onClick={() => handleMoveShopCategory(index, "up")}
                                >
                                  <ArrowLeft className="h-4 w-4 rotate-90" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={index === shopCategories.length - 1}
                                  onClick={() => handleMoveShopCategory(index, "down")}
                                >
                                  <ArrowLeft className="h-4 w-4 -rotate-90" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveShopCategory(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Add New Category */}
                      <div className="space-y-2">
                        <Label htmlFor="new-shop-category">Add New Category</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="new-shop-category"
                            value={newShopCategory}
                            onChange={(e) => setNewShopCategory(e.target.value)}
                            placeholder="Enter new category name (use hyphens instead of spaces)"
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleAddShopCategory}
                            disabled={!newShopCategory.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Note: Category names should be lowercase with hyphens instead of spaces (e.g., "new-category").
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSave}
                  disabled={!isChanged}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Gallery Settings Tab */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Settings</CardTitle>
                <CardDescription>
                  Configure how your gallery page appears to visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Gallery Page Enable/Disable */}
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="gallery-enabled" className="text-base font-medium">Enable Gallery Page</Label>
                        <p className="text-sm text-muted-foreground">
                          Control whether the Gallery page appears in your website navigation menu.
                        </p>
                      </div>
                      <Switch
                        id="gallery-enabled"
                        checked={galleryPageEnabled}
                        onCheckedChange={handleGalleryPageToggle}
                      />
                    </div>
                  </div>
                  
                  {/* Page Name */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Page Name</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The name that appears in your website navigation menu for this page.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="gallery-page-name">Navigation Menu Name</Label>
                      <Input 
                        id="gallery-page-name"
                        placeholder="Gallery"
                        value={galleryPageName}
                        onChange={(e) => {
                          setGalleryPageName(e.target.value);
                          updateSettingsToSave("gallery_page_name", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        This is what visitors will see in the navigation menu.
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="mb-3" />
                  
                  {/* Gallery Description */}
                  <div>
                    <h3 className="text-lg font-medium">Gallery Description</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The description text that appears at the top of your gallery page
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="gallery-description">Description</Label>
                      <Textarea 
                        id="gallery-description" 
                        value={galleryDescription}
                        onChange={handleGalleryDescriptionChange}
                        placeholder="Enter a description for your gallery page"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Gallery Display Count */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium">Galleries Display</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Control how many gallery categories are displayed on your website
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="gallery-count">Number of Galleries to Display</Label>
                      <Input 
                        id="gallery-count" 
                        type="number"
                        min="1"
                        max={galleryCategories.length}
                        value={galleriesDisplayCount}
                        onChange={handleGalleriesDisplayCountChange}
                        className="w-24"
                      />
                      <p className="text-sm text-muted-foreground">
                        Choose how many gallery categories to show on your website. Categories are displayed in the order listed below.
                      </p>
                    </div>
                  </div>
                  
                  {/* Gallery Layout */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium">Gallery Layout</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose between grid layout (maintains order) or masonry layout (aesthetic appeal)
                    </p>
                    <div className="space-y-4">
                      <RadioGroup 
                        value={galleryLayout} 
                        onValueChange={handleGalleryLayoutChange}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="grid" id="grid-layout" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Grid3X3 className="h-4 w-4 text-primary" />
                              <Label htmlFor="grid-layout" className="font-medium cursor-pointer">
                                Grid Layout
                              </Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Maintains artwork order from admin settings. Perfect for when order matters.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="masonry" id="masonry-layout" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Columns3 className="h-4 w-4 text-primary" />
                              <Label htmlFor="masonry-layout" className="font-medium cursor-pointer">
                                Masonry Layout
                              </Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Pinterest-style layout that flows naturally. Best for visual appeal.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  {/* Gallery Categories */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium">Gallery Categories</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Edit, reorder, or add new categories for your artwork gallery
                    </p>
                    
                    <div className="space-y-4">
                      {/* Categories List */}
                      <div className="space-y-2">
                        <Label>Current Categories</Label>
                        <div className="border rounded-md divide-y">
                          {galleryCategories.map((category, index) => (
                            <div key={index} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm font-mono">{index + 1}</span>
                                <Input 
                                  value={category} 
                                  onChange={(e) => handleUpdateCategoryName(index, e.target.value)}
                                  className="w-48 md:w-64" 
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={index === 0}
                                  onClick={() => handleMoveCategory(index, "up")}
                                >
                                  <ArrowLeft className="h-4 w-4 rotate-90" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={index === galleryCategories.length - 1}
                                  onClick={() => handleMoveCategory(index, "down")}
                                >
                                  <ArrowLeft className="h-4 w-4 -rotate-90" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveCategory(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Add New Category */}
                      <div className="space-y-2">
                        <Label htmlFor="new-category">Add New Category</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="new-category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter new category name (use hyphens instead of spaces)"
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleAddCategory}
                            disabled={!newCategory.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Note: Category names should be lowercase with hyphens instead of spaces (e.g., "new-category").
                        </p>
                      </div>
                    </div>
                  </div>
                  

                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSave}
                  disabled={!isChanged}
                  className="ml-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          

          {/* Contact Settings Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Page Settings</CardTitle>
                <CardDescription>
                  Edit text that appears on your contact page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Contact Page Enable/Disable */}
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="contact-enabled" className="text-base font-medium">Enable Contact Page</Label>
                        <p className="text-sm text-muted-foreground">
                          Control whether the Contact page appears in your website navigation menu.
                        </p>
                      </div>
                      <Switch
                        id="contact-enabled"
                        checked={contactPageEnabled}
                        onCheckedChange={handleContactPageToggle}
                      />
                    </div>
                  </div>
                  
                  {/* Page Name */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Page Name</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The name that appears in your website navigation menu for this page.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="contact-page-name">Navigation Menu Name</Label>
                      <Input 
                        id="contact-page-name"
                        placeholder="Contact"
                        value={contactPageName}
                        onChange={(e) => {
                          setContactPageName(e.target.value);
                          updateSettingsToSave("contact_page_name", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        This is what visitors will see in the navigation menu.
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="mb-3" />
                  
                  {/* Contact Page Heading */}
                  <div>
                    <h3 className="text-lg font-medium">Page Heading</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The main heading at the top of your contact page
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="contact-heading">Heading</Label>
                      <Input 
                        id="contact-heading" 
                        value={contactHeading} 
                        onChange={(e) => {
                          setContactHeading(e.target.value);
                          updateSettingsToSave("contact_heading", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Contact Subheading */}
                  <div>
                    <h3 className="text-lg font-medium">Contact Subheading</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The text that appears below the main heading
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subheading">Subheading</Label>
                      <Input 
                        id="contact-subheading" 
                        value={contactSubheading} 
                        onChange={(e) => {
                          setContactSubheading(e.target.value);
                          updateSettingsToSave("contact_subheading", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Contact Form Text */}
                  <div>
                    <h3 className="text-lg font-medium">Contact Form Text</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The description text that appears next to the contact form
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="contact-form-text">Form Description</Label>
                      <Textarea 
                        id="contact-form-text" 
                        value={contactFormText} 
                        onChange={(e) => {
                          setContactFormText(e.target.value);
                          updateSettingsToSave("contact_form_text", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Contact Email */}
                  <div>
                    <h3 className="text-lg font-medium">Contact Email</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The email address displayed on the contact page
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input 
                        id="contact-email" 
                        value={contactEmail} 
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          updateSettingsToSave("contact_email", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Follow Me Text */}
                  <div>
                    <h3 className="text-lg font-medium">Follow Me Text</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The heading for the social media section
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="follow-me-text">Heading</Label>
                      <Input 
                        id="follow-me-text" 
                        value={followMeText} 
                        onChange={(e) => {
                          setFollowMeText(e.target.value);
                          updateSettingsToSave("follow_me_text", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Newsletter Heading */}
                  <div>
                    <h3 className="text-lg font-medium">Newsletter Heading</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The heading for the newsletter section
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="newsletter-heading">Heading</Label>
                      <Input 
                        id="newsletter-heading" 
                        value={newsletterHeading} 
                        onChange={(e) => {
                          setNewsletterHeading(e.target.value);
                          updateSettingsToSave("newsletter_heading", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Newsletter Text */}
                  <div>
                    <h3 className="text-lg font-medium">Newsletter Text</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The description text for the newsletter section
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="newsletter-text">Description</Label>
                      <Textarea 
                        id="newsletter-text" 
                        value={newsletterText} 
                        onChange={(e) => {
                          setNewsletterText(e.target.value);
                          updateSettingsToSave("newsletter_text", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Subscribe Text */}
                  <div>
                    <h3 className="text-lg font-medium">Subscribe Text</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The text for the newsletter subscription checkbox
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="subscribe-text">Text</Label>
                      <Input 
                        id="subscribe-text" 
                        value={subscribeText} 
                        onChange={(e) => {
                          setSubscribeText(e.target.value);
                          updateSettingsToSave("subscribe_text", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  

                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  disabled={!isChanged} 
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Footer Settings Tab */}
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>
                  Configure your website's footer and social media links
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <div className="space-y-4">
                  {/* Footer Title */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Footer Title</h3>
                    <div className="space-y-2">
                      <Label htmlFor="footer-title">Title</Label>
                      <Input 
                        id="footer-title" 
                        value={footerTitle} 
                        onChange={(e) => {
                          setFooterTitle(e.target.value);
                          updateSettingsToSave("footer_title", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">Footer Description</h3>
                    <div className="space-y-2">
                      <Label htmlFor="footer-description">Description</Label>
                      <Textarea 
                        id="footer-description" 
                        value={footerDescription} 
                        onChange={(e) => {
                          setFooterDescription(e.target.value);
                          updateSettingsToSave("footer_description", e.target.value);
                          setIsChanged(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Social Media Links */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">Social Media Links</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Instagram */}
                      <div className="space-y-2">
                        <Label htmlFor="social-instagram">Instagram</Label>
                        <Input 
                          id="social-instagram" 
                          placeholder="https://instagram.com/yourusername" 
                          value={instagram} 
                          onChange={(e) => {
                            setInstagram(e.target.value);
                            updateSettingsToSave("social_instagram", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* Facebook */}
                      <div className="space-y-2">
                        <Label htmlFor="social-facebook">Facebook</Label>
                        <Input 
                          id="social-facebook" 
                          placeholder="https://facebook.com/yourpage" 
                          value={facebook} 
                          onChange={(e) => {
                            setFacebook(e.target.value);
                            updateSettingsToSave("social_facebook", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* Twitter */}
                      <div className="space-y-2">
                        <Label htmlFor="social-twitter">Twitter</Label>
                        <Input 
                          id="social-twitter" 
                          placeholder="https://twitter.com/yourusername" 
                          value={twitter} 
                          onChange={(e) => {
                            setTwitter(e.target.value);
                            updateSettingsToSave("social_twitter", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* YouTube */}
                      <div className="space-y-2">
                        <Label htmlFor="social-youtube">YouTube</Label>
                        <Input 
                          id="social-youtube" 
                          placeholder="https://youtube.com/c/yourchannel" 
                          value={youtube} 
                          onChange={(e) => {
                            setYoutube(e.target.value);
                            updateSettingsToSave("social_youtube", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <Label htmlFor="social-linkedin">LinkedIn</Label>
                        <Input 
                          id="social-linkedin" 
                          placeholder="https://linkedin.com/in/yourprofile" 
                          value={linkedin} 
                          onChange={(e) => {
                            setLinkedin(e.target.value);
                            updateSettingsToSave("social_linkedin", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* TikTok */}
                      <div className="space-y-2">
                        <Label htmlFor="social-tiktok">TikTok</Label>
                        <Input 
                          id="social-tiktok" 
                          placeholder="https://tiktok.com/@yourusername" 
                          value={tiktok} 
                          onChange={(e) => {
                            setTiktok(e.target.value);
                            updateSettingsToSave("social_tiktok", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* Pinterest */}
                      <div className="space-y-2">
                        <Label htmlFor="social-pinterest">Pinterest</Label>
                        <Input 
                          id="social-pinterest" 
                          placeholder="https://pinterest.com/yourusername" 
                          value={pinterest} 
                          onChange={(e) => {
                            setPinterest(e.target.value);
                            updateSettingsToSave("social_pinterest", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* Website */}
                      <div className="space-y-2">
                        <Label htmlFor="social-website">Personal Website</Label>
                        <Input 
                          id="social-website" 
                          placeholder="https://yourwebsite.com" 
                          value={website} 
                          onChange={(e) => {
                            setWebsite(e.target.value);
                            updateSettingsToSave("social_website", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  disabled={!isChanged} 
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          


          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Tasks</CardTitle>
                <CardDescription>
                  Perform maintenance tasks and updates to your website content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Category Updates</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Update artwork categories across your entire gallery.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Painting Multiplier */}
                      <div className="space-y-2">
                        <Label htmlFor="painting-multiplier">Painting Multiplier (per square inch)</Label>
                        <Input 
                          id="painting-multiplier" 
                          type="number"
                          step="0.01"
                          value={commissionPaintingMultiplier || ""}
                          onChange={(e) => {
                            setCommissionPaintingMultiplier(parseFloat(e.target.value) || 0);
                            updateSettingsToSave("commission_painting_multiplier", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Price = Height × Width × This Multiplier
                        </p>
                      </div>
                      
                      {/* Mural Multiplier */}
                      <div className="space-y-2">
                        <Label htmlFor="mural-multiplier">Mural Multiplier (per square foot)</Label>
                        <Input 
                          id="mural-multiplier" 
                          type="number"
                          step="0.01"
                          value={commissionMuralMultiplier || ""}
                          onChange={(e) => {
                            setCommissionMuralMultiplier(parseFloat(e.target.value) || 0);
                            updateSettingsToSave("commission_mural_multiplier", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Price = Height × Width × This Multiplier
                        </p>
                      </div>
                    </div>
                    
                    {/* Example Calculations */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Example Calculations:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 24" × 18" painting = $6,480.00 USD (current: $15/sq inch)</li>
                        <li>• 8' × 12' mural = $2,400.00 USD (current: $25/sq foot)</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Email Configuration */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium">Email Configuration</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set up email notifications and automated responses
                    </p>
                    
                    <div className="space-y-4">
                      {/* Artist Email */}
                      <div className="space-y-2">
                        <Label htmlFor="commission-email">Artist Email Address</Label>
                        <Input 
                          id="commission-email" 
                          type="email"
                          value={commissionArtistEmail}
                          onChange={(e) => {
                            setCommissionArtistEmail(e.target.value);
                            updateSettingsToSave("commission_artist_email", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Commission requests will be sent to this email address
                        </p>
                      </div>
                      
                      {/* Auto-Reply Subject */}
                      <div className="space-y-2">
                        <Label htmlFor="auto-reply-subject">Auto-Reply Subject</Label>
                        <Input 
                          id="auto-reply-subject" 
                          placeholder="Thank you for your commission request"
                          onChange={(e) => {
                            updateSettingsToSave("commission_auto_reply_subject", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                      </div>
                      
                      {/* Auto-Reply Message */}
                      <div className="space-y-2">
                        <Label htmlFor="auto-reply-message">Auto-Reply Message</Label>
                        <Textarea 
                          id="auto-reply-message" 
                          rows={4}
                          placeholder="Thank you for your commission request! I will review your message and get back to you within 2-3 business days."
                          onChange={(e) => {
                            updateSettingsToSave("commission_auto_reply_message", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          This message will be automatically sent to customers when they submit a commission request
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {isChanged && activeTab === "commission" && "You have unsaved changes."}
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      const commissionData = {
                        paintingMultiplier: commissionPaintingMultiplier,
                        muralMultiplier: commissionMuralMultiplier,
                        artistEmail: commissionArtistEmail,
                        autoReplySubject: commissionSettings?.autoReplySubject || "Thank you for your commission inquiry!",
                        autoReplyContent: commissionSettings?.autoReplyContent || "Thank you for your interest in commissioning custom artwork! I have received your request and will get back to you within 24-48 hours to discuss your project in detail. - Gabe Wells"
                      };

                      console.log('[WebsiteSettings Tab] Attempting to save. Data:', commissionData);
                      console.log('[WebsiteSettings Tab] Target Endpoint: /api/admin/commission/settings');

                      const response = await apiRequest('PUT', '/api/admin/commission/settings', commissionData);
                      console.log('[WebsiteSettings Tab] API Response:', response);

                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('[WebsiteSettings Tab] API error response:', errorText);
                        throw new Error(`Failed to save commission settings: ${response.status} ${errorText}`);
                      }

                      console.log('[WebsiteSettings Tab] Save successful!');
                      queryClient.invalidateQueries({ queryKey: ['/api/commission/settings'] });
                      setIsChanged(false);
                      
                      toast({
                        title: "Settings Updated",
                        description: "Your commission art settings have been saved successfully.",
                      });
                    } catch (error: any) {
                      console.error('[WebsiteSettings Tab] Error during save:', error);
                      toast({
                        title: "Error",
                        description: error.message || "Failed to save commission settings.",
                        variant: "destructive",
                      });
                    }
                  }} 
                  disabled={!isChanged || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Tasks</CardTitle>
                <CardDescription>
                  Perform maintenance tasks and updates to your website content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Category Updates</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Update artwork categories across your entire gallery.
                    </p>
                    
                    <div className="p-4 border rounded-md bg-gray-50">
                      <h4 className="font-medium mb-2">Update "Magical Realism" to "Imaginative Realism"</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        This will update all artworks currently categorized as "Magical Realism" to the new "Imaginative Realism" category.
                      </p>
                      <Button 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/admin/update-categories', {
                              method: 'POST',
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                              queryClient.invalidateQueries({ queryKey: ['/api/artworks'] });
                              toast({
                                title: "Categories Updated",
                                description: data.message,
                              });
                            } else {
                              throw new Error(data.message || "Failed to update categories");
                            }
                          } catch (error) {
                            toast({
                              title: "Error Updating Categories",
                              description: error instanceof Error ? error.message : "An unexpected error occurred",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Update Categories
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* About Page Settings Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Page Settings</CardTitle>
                <CardDescription>
                  Configure the content that appears on your About page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Profile Image */}
                  <div>
                    <Label className="text-base font-medium">Artist Profile Image</Label>
                    <div className="mt-2 space-y-3">
                      {/* Upload Option */}
                      <div>
                        <Label htmlFor="profile-image-upload" className="text-sm font-medium text-gray-700">Upload Image</Label>
                        <input
                          id="profile-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload an image file (max 5MB). Recommended size: 700 x 900 pixels.
                        </p>
                      </div>
                      
                      {/* URL Option */}
                      <div>
                        <Label htmlFor="profile-image-url" className="text-sm font-medium text-gray-700">Or Enter Image URL</Label>
                        <Input 
                          id="profile-image-url"
                          placeholder="https://example.com/artist-profile.jpg"
                          value={profileImage}
                          onChange={handleProfileImageChange}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the URL of an existing image online.
                        </p>
                      </div>
                    </div>
                    
                    {profileImage && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-700">Preview</Label>
                        <div className="mt-2 w-40 h-40 rounded-md overflow-hidden relative border">
                          <img 
                            src={profileImage} 
                            alt="Artist profile preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Artist Statement */}
                  <div>
                    <Label htmlFor="statement" className="text-base font-medium">Artist Statement</Label>
                    <div className="mt-2">
                      <Textarea 
                        id="statement"
                        placeholder="Your artist statement here..."
                        value={artistStatement}
                        onChange={handleArtistStatementChange}
                        className="h-36"
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Your artist statement that explains your artistic vision and approach.
                      </p>
                    </div>
                  </div>
                  
                  {/* Biography */}
                  <div>
                    <Label htmlFor="biography" className="text-base font-medium">Artist Biography</Label>
                    <div className="mt-2">
                      <Textarea 
                        id="biography"
                        placeholder="Your biography text here..."
                        value={biographyText}
                        onChange={handleBiographyChange}
                        className="h-36"
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Your main biography text that appears at the top of the About page.
                      </p>
                    </div>
                  </div>
                  
                  {/* Studio Text */}
                  <div>
                    <Label htmlFor="studio-text" className="text-base font-medium">Studio Information</Label>
                    <div className="mt-2">
                      <Textarea 
                        id="studio-text"
                        placeholder="Information about your studio..."
                        value={studioText}
                        onChange={handleStudioTextChange}
                        className="h-36"
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Information about your studio, workspace, or creative process.
                      </p>
                    </div>
                  </div>
                  
                  {/* CV/Exhibition History */}
                  <div>
                    <CVEditor value={cvText} onChange={handleCvTextChange} />
                  </div>
                  


                  
                  {/* Studio Image */}
                  <div>
                    <Label htmlFor="studio-image" className="text-base font-medium">Studio Image URL</Label>
                    <div className="mt-2">
                      <Input 
                        id="studio-image"
                        placeholder="https://example.com/studio-image.jpg"
                        value={studioImage}
                        onChange={handleStudioImageChange}
                      />
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Enter the URL of an image to use as the studio photo.
                        For best results, use a landscape image (recommended size: 700 x 500 pixels).
                      </p>
                    </div>
                    
                    {studioImage && (
                      <div className="mt-4">
                        <div className="w-60 h-40 rounded-md overflow-hidden relative">
                          <img 
                            src={studioImage} 
                            alt="Studio image preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Studio Visit Toggle */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Enable "Book A Studio Visit" Section</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Show or hide the studio visit booking section on the About page
                        </p>
                      </div>
                      <Switch
                        checked={studioVisitEnabled}
                        onCheckedChange={handleStudioVisitToggle}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {isChanged && activeTab === "about" && "You have unsaved changes."}
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={!isChanged || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Search Engine Optimization (SEO)
                </CardTitle>
                <CardDescription>
                  Customize how each page appears in search results. This helps potential customers find your art business online.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Homepage SEO */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">Homepage SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-home-title" className="text-sm font-medium">Meta Title</Label>
                      <Input 
                        id="seo-home-title"
                        placeholder="e.g., Gabe Wells - Original Art & Custom Paintings | Professional Artist"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        50-60 characters ideal. This appears as the clickable headline in search results.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="seo-home-description" className="text-sm font-medium">Meta Description</Label>
                      <Textarea 
                        id="seo-home-description"
                        placeholder="e.g., Discover original paintings and custom artwork by professional artist Gabe Wells. Commission unique pieces or browse gallery of available paintings and prints."
                        className="mt-1 h-20"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        150-160 characters ideal. This appears below the title in search results.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Gallery SEO */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">Gallery SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-gallery-title" className="text-sm font-medium">Meta Title</Label>
                      <Input 
                        id="seo-gallery-title"
                        placeholder="e.g., Art Gallery - Gabe Wells Original Paintings & Artwork Collection"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-gallery-description" className="text-sm font-medium">Meta Description</Label>
                      <Textarea 
                        id="seo-gallery-description"
                        placeholder="e.g., Browse the complete gallery of original paintings and artwork by Gabe Wells. View paintings by category including portraits, landscapes, and imaginative realism."
                        className="mt-1 h-20"
                      />
                    </div>

                  </div>
                </div>

                {/* Shop SEO */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">Shop SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-shop-title" className="text-sm font-medium">Meta Title</Label>
                      <Input 
                        id="seo-shop-title"
                        placeholder="e.g., Art Shop - Buy Original Paintings & Prints by Gabe Wells"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-shop-description" className="text-sm font-medium">Meta Description</Label>
                      <Textarea 
                        id="seo-shop-description"
                        placeholder="e.g., Purchase original artwork and high-quality prints by professional artist Gabe Wells. Available paintings, prints, and merchandise with secure checkout."
                        className="mt-1 h-20"
                      />
                    </div>

                  </div>
                </div>

                {/* About SEO */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">About Page SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-about-title" className="text-sm font-medium">Meta Title</Label>
                      <Input 
                        id="seo-about-title"
                        placeholder="e.g., About Gabe Wells - Professional Artist Biography & Studio"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-about-description" className="text-sm font-medium">Meta Description</Label>
                      <Textarea 
                        id="seo-about-description"
                        placeholder="e.g., Learn about professional artist Gabe Wells - biography, artistic journey, studio information, and exhibition history. Discover the story behind the artwork."
                        className="mt-1 h-20"
                      />
                    </div>

                  </div>
                </div>

                {/* Contact SEO */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">Contact Page SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-contact-title" className="text-sm font-medium">Meta Title</Label>
                      <Input 
                        id="seo-contact-title"
                        placeholder="e.g., Contact Gabe Wells - Art Inquiries & Commission Requests"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-contact-description" className="text-sm font-medium">Meta Description</Label>
                      <Textarea 
                        id="seo-contact-description"
                        placeholder="e.g., Get in touch with artist Gabe Wells for commission inquiries, artwork questions, or collaboration opportunities. Professional art services available."
                        className="mt-1 h-20"
                      />
                    </div>

                  </div>
                </div>

                {/* Commission Art SEO */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Commission Art SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-commission-title" className="text-sm font-medium">Meta Title</Label>
                      <Input 
                        id="seo-commission-title"
                        placeholder="e.g., Commission Custom Artwork - Personalized Paintings by Gabe Wells"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-commission-description" className="text-sm font-medium">Meta Description</Label>
                      <Textarea 
                        id="seo-commission-description"
                        placeholder="e.g., Commission custom paintings and personalized artwork from professional artist Gabe Wells. Get a quote for portraits, murals, and unique artistic creations."
                        className="mt-1 h-20"
                      />
                    </div>

                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Modern SEO Best Practices</h4>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• <strong>Meta titles are critical</strong> - They're a major ranking factor for search engines</li>
                    <li>• <strong>Meta descriptions drive clicks</strong> - Well-written descriptions improve click-through rates</li>
                    <li>• <strong>Keywords go in your content</strong> - Use them naturally in page text, titles, headings, and image alt text</li>
                    <li>• <strong>Focus on user intent</strong> - Create content that answers what visitors are actually looking for</li>
                    <li>• <strong>Image alt text is crucial</strong> - Essential for art websites to rank in Google Images</li>
                    <li>• <strong>Local SEO matters</strong> - Include your location (e.g., "Denver artist")</li>
                  </ul>
                  <p className="text-xs text-gray-700 mt-3 italic">
                    Note: Meta keyword tags are no longer used by Google and have been removed from this system.
                  </p>
                </div>

              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {isChanged && activeTab === "seo" && "You have unsaved changes."}
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={!isChanged || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save SEO Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Website Color Scheme
                </CardTitle>
                <CardDescription>
                  Customize your website's color scheme to match your brand. Changes will apply across all pages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Primary Background Color */}
                <div className="space-y-2">
                  <Label htmlFor="primary-bg-color" className="text-sm font-medium">Primary Background Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primary-bg-color"
                      type="color"
                      value={primaryBackgroundColor}
                      onChange={(e) => {
                        setPrimaryBackgroundColor(e.target.value);
                        updateSettingsToSave("color_primary_background", e.target.value);
                        setIsChanged(true);
                      }}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      value={primaryBackgroundColor}
                      onChange={(e) => {
                        setPrimaryBackgroundColor(e.target.value);
                        updateSettingsToSave("color_primary_background", e.target.value);
                        setIsChanged(true);
                      }}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main background color for pages and content areas
                  </p>
                </div>

                {/* Primary Text Color */}
                <div className="space-y-2">
                  <Label htmlFor="primary-text-color" className="text-sm font-medium">Primary Text Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primary-text-color"
                      type="color"
                      value={primaryTextColor}
                      onChange={(e) => {
                        setPrimaryTextColor(e.target.value);
                        updateSettingsToSave("color_primary_text", e.target.value);
                        setIsChanged(true);
                      }}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      value={primaryTextColor}
                      onChange={(e) => {
                        setPrimaryTextColor(e.target.value);
                        updateSettingsToSave("color_primary_text", e.target.value);
                        setIsChanged(true);
                      }}
                      placeholder="#1a1a1a"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main text color for headings and body content
                  </p>
                </div>

                {/* Navigation Text Color */}
                <div className="space-y-2">
                  <Label htmlFor="nav-text-color" className="text-sm font-medium">Navigation Text Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="nav-text-color"
                      type="color"
                      value={navigationTextColor}
                      onChange={(e) => {
                        setNavigationTextColor(e.target.value);
                        updateSettingsToSave("color_navigation_text", e.target.value);
                        setIsChanged(true);
                      }}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      value={navigationTextColor}
                      onChange={(e) => {
                        setNavigationTextColor(e.target.value);
                        updateSettingsToSave("color_navigation_text", e.target.value);
                        setIsChanged(true);
                      }}
                      placeholder="#374151"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Color for menu items and navigation text
                  </p>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label htmlFor="accent-color" className="text-sm font-medium">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        updateSettingsToSave("color_accent", e.target.value);
                        setIsChanged(true);
                      }}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        updateSettingsToSave("color_accent", e.target.value);
                        setIsChanged(true);
                      }}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Color for buttons, links, and interactive elements
                  </p>
                </div>

                {/* Color Preview Section */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Color Preview</h4>
                  <div 
                    className="border rounded p-4 space-y-3"
                    style={{ 
                      backgroundColor: primaryBackgroundColor,
                      color: primaryTextColor 
                    }}
                  >
                    {/* Navigation Preview */}
                    <div className="border-b pb-2">
                      <div className="flex gap-4 text-sm">
                        <span style={{ color: navigationTextColor }}>Home</span>
                        <span style={{ color: navigationTextColor }}>Gallery</span>
                        <span style={{ color: navigationTextColor }}>Shop</span>
                        <span style={{ color: navigationTextColor }}>About</span>
                        <span style={{ color: navigationTextColor }}>Contact</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Navigation menu preview</p>
                    </div>
                    
                    {/* Content Preview */}
                    <div>
                      <h5 className="font-semibold">Sample Heading</h5>
                      <p className="text-sm">This is how your text will appear on the background.</p>
                      <button 
                        className="px-3 py-1 rounded text-white text-sm mt-2"
                        style={{ backgroundColor: accentColor }}
                      >
                        Sample Button
                      </button>
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {isChanged && activeTab === "colors" && "You have unsaved changes."}
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={!isChanged || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Color Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Email Services Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Services Configuration</CardTitle>
                <CardDescription>
                  Configure email providers for customer communications, order confirmations, and marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Email Provider Selection */}
                  <div>
                    <Label className="text-base font-medium">Email Provider</Label>
                    <RadioGroup 
                      value={emailProvider} 
                      onValueChange={(value) => {
                        setEmailProvider(value);
                        updateSettingsToSave("email_provider", value);
                        setIsChanged(true);
                      }}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mailchimp" id="mailchimp" />
                        <Label htmlFor="mailchimp">Mailchimp (Recommended for Artists)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="smtp" id="smtp" />
                        <Label htmlFor="smtp">SMTP (Custom Email Server)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Mailchimp Configuration */}
                  {emailProvider === "mailchimp" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Mailchimp Configuration</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Mailchimp is perfect for artists because it offers beautiful email templates, 
                          customer segmentation, and powerful marketing tools to promote your artwork.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mailchimp-api-key">Mailchimp API Key</Label>
                          <Input 
                            id="mailchimp-api-key"
                            type="password"
                            placeholder="Enter your Mailchimp API key"
                            value={mailchimpApiKey}
                            onChange={(e) => {
                              setMailchimpApiKey(e.target.value);
                              updateSettingsToSave("mailchimp_api_key", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Get your API key from Account → Extras → API keys in your Mailchimp dashboard
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mailchimp-list-id">Audience List ID</Label>
                          <Input 
                            id="mailchimp-list-id"
                            placeholder="Enter your Mailchimp audience list ID"
                            value={mailchimpListId}
                            onChange={(e) => {
                              setMailchimpListId(e.target.value);
                              updateSettingsToSave("mailchimp_list_id", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Find this in Audience → Settings → Audience name and defaults
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mailchimp-server-prefix">Server Prefix</Label>
                          <Input 
                            id="mailchimp-server-prefix"
                            placeholder="us1, us2, etc."
                            value={mailchimpServerPrefix}
                            onChange={(e) => {
                              setMailchimpServerPrefix(e.target.value);
                              updateSettingsToSave("mailchimp_server_prefix", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            The server prefix from your API key (e.g., if your API key ends with -us1, enter "us1")
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMTP Configuration */}
                  {emailProvider === "smtp" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-3">SMTP Configuration</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure a custom SMTP server for email delivery.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-host">SMTP Host</Label>
                          <Input 
                            id="smtp-host"
                            placeholder="smtp.gmail.com"
                            value={smtpHost}
                            onChange={(e) => {
                              setSmtpHost(e.target.value);
                              updateSettingsToSave("smtp_host", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-port">SMTP Port</Label>
                          <Input 
                            id="smtp-port"
                            placeholder="587"
                            value={smtpPort}
                            onChange={(e) => {
                              setSmtpPort(e.target.value);
                              updateSettingsToSave("smtp_port", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-user">SMTP Username</Label>
                          <Input 
                            id="smtp-user"
                            placeholder="your-email@example.com"
                            value={smtpUser}
                            onChange={(e) => {
                              setSmtpUser(e.target.value);
                              updateSettingsToSave("smtp_user", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-password">SMTP Password</Label>
                          <Input 
                            id="smtp-password"
                            type="password"
                            placeholder="Your SMTP password"
                            value={smtpPassword}
                            onChange={(e) => {
                              setSmtpPassword(e.target.value);
                              updateSettingsToSave("smtp_password", e.target.value);
                              setIsChanged(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Common Email Settings */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Email Display Settings</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure how your emails appear to customers.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-email">From Email Address</Label>
                        <Input 
                          id="from-email"
                          placeholder="contact@gabewells.com"
                          value={fromEmail}
                          onChange={(e) => {
                            setFromEmail(e.target.value);
                            updateSettingsToSave("from_email", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          The email address that appears as the sender
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="from-name">From Name</Label>
                        <Input 
                          id="from-name"
                          placeholder="Gabe Wells Fine Art"
                          value={fromName}
                          onChange={(e) => {
                            setFromName(e.target.value);
                            updateSettingsToSave("from_name", e.target.value);
                            setIsChanged(true);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          The name that appears as the sender
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Why Mailchimp for Artists?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Beautiful email templates perfect for showcasing artwork</li>
                      <li>• Customer segmentation (collectors, commission clients, newsletter subscribers)</li>
                      <li>• Automated email sequences for new artwork releases</li>
                      <li>• Analytics to track email engagement and art sales</li>
                      <li>• Easy integration with your e-commerce platform</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={saveSettings} 
                  disabled={!isChanged || saveMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Email Configuration"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}