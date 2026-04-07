import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { contactFormSchema, newsletterFormSchema, type InsertContactMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import NewsletterSignup from "@/components/newsletter-signup";
import { MapPin, Mail, Phone, Palette, Home } from "lucide-react";
import { FaInstagram, FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";
import { SEO } from "@/components/seo";

export default function Contact() {
  const { toast } = useToast();
  const [requestType, setRequestType] = useState<'general' | 'commission'>('general');
  const [commissionType, setCommissionType] = useState<'paintings' | 'murals'>('paintings');
  
  // Price calculator state
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  
  // Check if contact page is enabled
  const { data: contactPageEnabledData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/contact_page_enabled"],
  });
  
  // Fetch contact page settings
  const { data: contactHeading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/contact_heading"],
  });
  
  const { data: contactSubheading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/contact_subheading"],
  });
  
  const { data: contactEmail } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/contact_email"],
  });
  
  const { data: contactFormText } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/contact_form_text"],
  });
  
  const { data: followMeText } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/follow_me_text"],
  });
  
  const { data: newsletterHeading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/newsletter_heading"],
  });
  
  const { data: newsletterText } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/newsletter_text"],
  });
  
  const { data: subscribeText } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/subscribe_text"],
  });
  
  // Fetch social media links
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
  
  // Check if commission requests are enabled
  const { data: commissionEnabledData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/commission_page_enabled"],
  });
  
  // Fetch commission settings for price calculator
  const { data: commissionSettings } = useQuery<{
    paintingMultiplier: number;
    muralMultiplier: number;
    artistEmail: string;
  }>({
    queryKey: ["/api/commission/settings"],
  });
  
  const commissionEnabled = commissionEnabledData?.value === "true";

  // Price calculator with proper debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const h = parseFloat(height);
      const w = parseFloat(width);
      
      if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
        setEstimatedPrice(null);
        return;
      }
      
      // Calculate final price: (height × width) × multiplier
      const area = h * w;
      let finalPrice = 0;
      
      if (commissionType === 'paintings') {
        const multiplier = commissionSettings?.paintingMultiplier || 5;
        finalPrice = area * multiplier;
      } else {
        const multiplier = commissionSettings?.muralMultiplier || 10;
        finalPrice = area * multiplier;
      }
      
      setEstimatedPrice(finalPrice);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [height, width, commissionType, commissionSettings]);
  
  const form = useForm<InsertContactMessage>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      subscribeToNewsletter: false,
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (formData: InsertContactMessage) => {
      const response = await apiRequest("POST", "/api/contact", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Thank you for your message! We will get back to you soon.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const commissionMutation = useMutation({
    mutationFn: async (commissionData: any) => {
      const response = await apiRequest("POST", "/api/commission/requests", commissionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commission Request Submitted!",
        description: "Thank you for your commission request! We will review it and get back to you soon.",
      });
      form.reset();
      setHeight("");
      setWidth("");
      setEstimatedPrice(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit commission request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertContactMessage) {
    console.log("🚀 Contact form onSubmit function CALLED!");
    console.log("📝 Form data received:", data);
    console.log("🔍 Request type:", requestType);
    
    if (commissionEnabled && requestType === 'commission') {
      // For commission requests, use the commission API and include additional data
      const commissionData = {
        customerName: data.name,
        customerEmail: data.email,
        subject: data.subject,
        message: data.message,
        location: '', // Will get from location field when we connect it
        dimensions: `${height}" × ${width}"`,
        estimatedPrice: estimatedPrice,
        categoryId: 1, // Default to paintings category
        subscribeToNewsletter: data.subscribeToNewsletter
      };
      
      console.log("🎨 Submitting commission request:", commissionData);
      
      // Use commission-specific mutation
      commissionMutation.mutate(commissionData);
    } else {
      // For general inquiries, use the regular contact API
      contactMutation.mutate(data);
    }
  }

  // If contact page is disabled, show not found message
  if (contactPageEnabledData?.value === 'false') {
    return (
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-serif text-white mb-4">Contact Not Available</h1>
          <p className="text-lg text-neutral-200 mb-8">
            The contact page is currently unavailable. Please check back later or visit our other pages.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-primary text-white">
      <SEO
        title="Contact Gabe Wells | Fine Art Inquiries"
        description="Contact Gabe Wells for art inquiries, commissions, and fine art purchases. Get in touch with the artist directly."
        canonicalUrl="https://gabewells.com/contact"
      />
      <div className="container mx-auto px-6 lg:px-12">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-serif text-white tracking-wide">
            {contactHeading?.value || "Get In Touch"}
          </h1>
          <p className="text-sm text-white/60 mt-1">
            {contactSubheading?.value || "Contact me about commissions, purchases, or to schedule a studio visit"}
          </p>
          <div className="w-full h-px bg-white/20 mt-4"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Request Type Selector - only show if commission is enabled */}
                {commissionEnabled && (
                  <div className="mb-6">
                    <label className="text-neutral-200 text-sm font-medium mb-3 block">What can I help you with?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          requestType === 'general' 
                            ? 'border-[#b8860b] bg-[#b8860b] bg-opacity-20' 
                            : 'border-neutral-600 bg-white bg-opacity-5 hover:bg-opacity-10'
                        }`}
                        onClick={() => setRequestType('general')}
                      >
                        <CardContent className="p-4 text-center">
                          <Mail className="h-6 w-6 mx-auto mb-2 text-white" />
                          <h3 className="text-white font-medium">General Inquiry</h3>
                          <p className="text-neutral-300 text-sm">Questions, purchases, studio visits</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          requestType === 'commission' 
                            ? 'border-[#b8860b] bg-[#b8860b] bg-opacity-20' 
                            : 'border-neutral-600 bg-white bg-opacity-5 hover:bg-opacity-10'
                        }`}
                        onClick={() => setRequestType('commission')}
                      >
                        <CardContent className="p-4 text-center">
                          <Palette className="h-6 w-6 mx-auto mb-2 text-white" />
                          <h3 className="text-white font-medium">Commission Request</h3>
                          <p className="text-neutral-300 text-sm">Custom artwork created just for you</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Commission Type Selector - only show if commission request is selected */}
                {commissionEnabled && requestType === 'commission' && (
                  <div className="mb-6">
                    <label className="text-neutral-200 text-sm font-medium mb-3 block">Commission Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          commissionType === 'paintings' 
                            ? 'border-blue-400 bg-blue-500 bg-opacity-20' 
                            : 'border-neutral-600 bg-white bg-opacity-5 hover:bg-opacity-10'
                        }`}
                        onClick={() => setCommissionType('paintings')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-center">
                            <div className="text-2xl mb-2">🎨</div>
                            <h3 className="text-white font-medium">Paintings</h3>
                            <p className="text-neutral-300 text-sm">Custom paintings on canvas</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">Available</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          commissionType === 'murals' 
                            ? 'border-blue-400 bg-blue-500 bg-opacity-20' 
                            : 'border-neutral-600 bg-white bg-opacity-5 hover:bg-opacity-10'
                        }`}
                        onClick={() => setCommissionType('murals')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-center">
                            <Home className="h-6 w-6 mx-auto mb-2 text-white" />
                            <h3 className="text-white font-medium">Murals</h3>
                            <p className="text-neutral-300 text-sm">Large-scale wall art</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">Available</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Price Calculator - show immediately after commission type selection */}
                {commissionEnabled && requestType === 'commission' && (
                  <div className="bg-white bg-opacity-5 p-4 rounded-lg mb-6">
                    <h4 className="font-medium text-white mb-3">Price Estimate Calculator</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-neutral-200 text-sm font-medium mb-1 block">
                          Height ({commissionType === 'paintings' ? 'inches' : 'feet'})
                        </label>
                        <Input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Enter height"
                          className="px-3 py-2 bg-white bg-opacity-10 border border-neutral-600 rounded focus:border-blue-400 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-200 text-sm font-medium mb-1 block">
                          Width ({commissionType === 'paintings' ? 'inches' : 'feet'})
                        </label>
                        <Input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="Enter width"
                          className="px-3 py-2 bg-white bg-opacity-10 border border-neutral-600 rounded focus:border-blue-400 text-white"
                        />
                      </div>
                    </div>
                    
                    {estimatedPrice && (
                      <div className="bg-blue-600 bg-opacity-30 p-3 rounded border border-blue-400">
                        <div className="text-white text-sm">
                          <strong>Estimated Price: ${estimatedPrice.toLocaleString()}</strong>
                        </div>
                        <div className="text-blue-200 text-xs mt-1">
                          {commissionType === 'paintings' 
                            ? `${height}" × ${width}" = ${(parseFloat(height) * parseFloat(width)).toFixed(1)} sq inches × $${commissionSettings?.paintingMultiplier || 5}/sq inch`
                            : `${height}' × ${width}' = ${(parseFloat(height) * parseFloat(width)).toFixed(1)} sq feet × $${commissionSettings?.muralMultiplier || 10}/sq foot`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Commission-specific fields - only show if commission request is selected */}
                {commissionEnabled && requestType === 'commission' && (
                  <div className="space-y-6 p-6 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-400">
                    <h3 className="text-lg font-medium text-white mb-4">Commission Request Details</h3>
                    
                    {/* Name and Email fields inside Commission Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-200">Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-blue-400 text-white"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-200">Email *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-blue-400 text-white"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <label className="text-neutral-200 text-sm font-medium mb-2 block">Location</label>
                      <Input
                        placeholder="City, State or Country"
                        className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-blue-400 text-white"
                      />
                    </div>
                    
                    {/* Subject field between Location and Commission Description */}
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-200">Subject *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-blue-400 text-white"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-200">
                            Describe your commission idea *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="I'd love a portrait of my family for our living room. We're looking for something warm and inviting in a realistic style..."
                              rows={6}
                              className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-blue-400 text-white"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-neutral-300 text-xs mt-2">
                            Please include details about subject matter, style preferences, timeline, and any other important information.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Name, Email, Subject fields for General Inquiry only */}
                {(!commissionEnabled || requestType === 'general') && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-200">Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-[#b8860b] text-white"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-200">Email *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-[#b8860b] text-white"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-200">Subject *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-[#b8860b] text-white"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}



                {/* Message field - only show for General Inquiry */}
                {(!commissionEnabled || requestType === 'general') && (
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-200">Message *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={5}
                            placeholder="Your message..."
                            className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm focus:border-[#b8860b] text-white"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="subscribeToNewsletter"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          className="mr-2 h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-neutral-200">
                        {subscribeText?.value || "Subscribe to my newsletter for exhibition updates and new work announcements"}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className={`rounded-full ${
                    commissionEnabled && requestType === 'commission'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-[#b8860b] hover:bg-opacity-90'
                  } text-white px-8 py-2 uppercase tracking-wider text-xs transition duration-200`}
                  disabled={contactMutation.isPending || commissionMutation.isPending}
                >
                  {(contactMutation.isPending || commissionMutation.isPending)
                    ? "Sending..." 
                    : commissionEnabled && requestType === 'commission' 
                      ? "Send Commission Request" 
                      : "Send Message"
                  }
                </Button>
              </form>
            </Form>
          </div>

          <div className="bg-white bg-opacity-10 p-8 rounded-sm h-full">
            <h3 className="text-xl font-serif mb-6 text-white">
              {contactHeading?.value || "Get In Touch"}
            </h3>

            <div className="mb-6">
              <p className="text-neutral-200">
                {contactFormText?.value || "Please use the contact form to get in touch about commissions, purchases, or any inquiries. I'll get back to you as soon as possible."}
              </p>
            </div>

            <div className="pt-6 border-t border-white border-opacity-20">
              <h3 className="text-xl font-serif mb-3 text-white">{followMeText?.value || "Follow me"}</h3>
              <div className="flex space-x-4">
                {instagramLink?.value && (
                  <a
                    href={instagramLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="text-2xl" />
                  </a>
                )}
                
                {facebookLink?.value && (
                  <a
                    href={facebookLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="Facebook"
                  >
                    <FaFacebookF className="text-2xl" />
                  </a>
                )}
                
                {twitterLink?.value && (
                  <a
                    href={twitterLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="Twitter"
                  >
                    <FaTwitter className="text-2xl" />
                  </a>
                )}
                
                {youtubeLink?.value && (
                  <a
                    href={youtubeLink.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-[#b8860b] transition duration-200"
                    aria-label="YouTube"
                  >
                    <FaYoutube className="text-2xl" />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white border-opacity-20">
              <h3 className="text-xl font-serif mb-4 text-white">{newsletterHeading?.value || "Newsletter"}</h3>
              <p className="text-neutral-200 mb-4">
                {newsletterText?.value || "Sign up to receive updates on new works, exhibitions, and studio events."}
              </p>

              <NewsletterSignup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
