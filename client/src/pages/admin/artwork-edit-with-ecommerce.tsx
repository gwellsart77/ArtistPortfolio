import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertArtworkSchema, type Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Save, Trash2, ShoppingCart, Image as ImageIcon, CircleDollarSign, FileDigit, FileImage, Paintbrush, BookCopy } from "lucide-react";

// Custom edit form data interface
interface EditFormData {
  title: string;
  description: string;
  category: string;
  year: string;
  medium: string;
  dimensions: string;
  price: string; // Use string for form input then convert to number
  featured: boolean;
  available: boolean;
  imageUrl: string;
}

import { z } from "zod";

// E-commerce settings form schema
const artworkEcommerceSchema = z.object({
  // Original artwork
  available: z.boolean().default(true),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  
  // Limited edition settings
  isLimitedEdition: z.boolean().default(false),
  editionSize: z.coerce.number().min(1, "Edition size must be at least 1").optional(),
  editionsSold: z.coerce.number().min(0, "Editions sold must be a positive number").optional(),
  limitedEditionPrice: z.coerce.number().min(0, "Limited edition price must be a positive number").optional(),
  
  // Digital version settings
  hasDigitalVersion: z.boolean().default(false),
  digitalFileUrl: z.string().url("Must be a valid URL").optional(),
  digitalPrice: z.coerce.number().min(0, "Digital price must be a positive number").optional(),
  personalLicensePrice: z.coerce.number().min(0, "Personal license price must be a positive number").optional(),
  commercialLicensePrice: z.coerce.number().min(0, "Commercial license price must be a positive number").optional(),
});

// Note: z already imported above

// Type definition for the form data
type ArtworkEcommerceFormData = z.infer<typeof artworkEcommerceSchema>;

// E-commerce settings component
function ArtworkEcommerceSettings({ artwork, onSaved }: { artwork: Artwork, onSaved: (artwork: Artwork) => void }) {
  const [isSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Set up form with default values from the artwork
  const form = useForm<ArtworkEcommerceFormData>({
    resolver: zodResolver(artworkEcommerceSchema),
    defaultValues: {
      available: artwork.available ?? true,
      price: artwork.price ?? 0,
      
      isLimitedEdition: artwork.isLimitedEdition ?? false,
      editionSize: artwork.editionSize ?? undefined,
      editionsSold: artwork.editionsSold ?? 0,
      limitedEditionPrice: artwork.limitedEditionPrice ?? Math.round((artwork.price ?? 0) * 0.2),
      
      hasDigitalVersion: artwork.hasDigitalVersion ?? false,
      digitalFileUrl: artwork.digitalFileUrl ?? '',
      digitalPrice: artwork.digitalPrice ?? Math.round((artwork.price ?? 0) * 0.1),
      personalLicensePrice: artwork.personalLicensePrice ?? Math.round((artwork.price ?? 0) * 0.1),
      commercialLicensePrice: artwork.commercialLicensePrice ?? Math.round((artwork.price ?? 0) * 0.3),
    },
  });
  
  // Watch form values to dynamically update UI
  const isLimitedEdition = form.watch('isLimitedEdition');
  const hasDigitalVersion = form.watch('hasDigitalVersion');
  
  // Handle form submission
  const onSubmit = async (data: ArtworkEcommerceFormData) => {
    // Submit e-commerce settings
    
    try {
      const response = await fetch(`/api/admin/artworks/${artwork.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update artwork e-commerce settings');
      }
      
      const updatedArtwork = await response.json();
      
      toast({
        title: "E-commerce settings updated",
        description: "Your artwork purchase options have been saved successfully.",
        variant: "default",
      });
      
      onSaved(updatedArtwork);
    } catch (error) {
      console.error('Error updating e-commerce settings:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred while saving settings",
        variant: "destructive",
      });
    } finally {
      // Update completed
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Artwork E-commerce Settings
        </CardTitle>
        <CardDescription>
          Configure purchase options for original artwork, limited edition prints, and digital downloads
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="original" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="original" className="flex items-center">
                <Paintbrush className="mr-2 h-4 w-4" />
                Original
              </TabsTrigger>
              <TabsTrigger value="limited" className="flex items-center">
                <BookCopy className="mr-2 h-4 w-4" />
                Limited Edition
              </TabsTrigger>
              <TabsTrigger value="digital" className="flex items-center">
                <FileDigit className="mr-2 h-4 w-4" />
                Digital
              </TabsTrigger>
            </TabsList>
            
            {/* Original Artwork Settings */}
            <TabsContent value="original">
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label className="text-base font-medium">Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      Is this original artwork available for purchase?
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Artwork Price (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            className="pl-10" 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Set the price for the original, one-of-a-kind artwork
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </TabsContent>
            
            {/* Limited Edition Settings */}
            <TabsContent value="limited">
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label className="text-base font-medium">Limited Edition Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      Offer this artwork as a limited edition print?
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isLimitedEdition"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {isLimitedEdition && (
                  <>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="editionSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Edition Size</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              step="1" 
                            />
                          </FormControl>
                          <FormDescription>
                            The total number of prints in this limited edition
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="editionsSold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Editions Sold</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="1" 
                            />
                          </FormControl>
                          <FormDescription>
                            How many limited edition prints have been sold so far
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="limitedEditionPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limited Edition Price (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Price for each limited edition print
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </TabsContent>
            
            {/* Digital Version Settings */}
            <TabsContent value="digital">
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label className="text-base font-medium">Digital Version Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      Offer this artwork as a digital download?
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="hasDigitalVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {hasDigitalVersion && (
                  <>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="digitalFileUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Digital File URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileImage className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                placeholder="https://example.com/artwork.jpg" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            URL to the high-resolution digital file (from Cloudinary or other storage)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Digital Pricing Options</h3>
                      
                      <FormField
                        control={form.control}
                        name="digitalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Single Digital Price (USD)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  className="pl-10" 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Use this single price for both personal and commercial licenses (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <p className="text-sm text-muted-foreground">- OR -</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="personalLicensePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal License (USD)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    className="pl-10" 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                For personal, non-commercial use only
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="commercialLicensePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Commercial License (USD)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    className="pl-10" 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                For business and commercial use
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline" type="button" onClick={() => form.reset()}>
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default function ArtworkEdit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Fetch artwork data by ID
  const { data: artwork, isLoading: isLoadingArtwork } = useQuery<Artwork>({
    queryKey: [`/api/artworks/${id}`],
    enabled: !!id,
  });

  // Form setup with default values from existing artwork
  const form = useForm<EditFormData>({
    resolver: zodResolver(insertArtworkSchema.omit({ imageUrl: true }).extend({ 
      imageUrl: insertArtworkSchema.shape.imageUrl,
      price: insertArtworkSchema.shape.price.transform(value => String(value))
    })),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      year: "",
      medium: "",
      dimensions: "",
      price: "",
      featured: false,
      available: true,
      imageUrl: "",
    },
  });

  // Update form values when artwork data is loaded
  useEffect(() => {
    if (artwork) {
      form.reset({
        title: artwork.title,
        description: artwork.description,
        category: artwork.category,
        year: artwork.year,
        medium: artwork.medium,
        dimensions: artwork.dimensions || "",
        price: String(artwork.price),
        featured: artwork.featured === null ? false : artwork.featured,
        available: artwork.available === null ? true : artwork.available,
        imageUrl: artwork.imageUrl,
      });
    }
  }, [artwork, form]);

  // Mutation for updating artwork
  const updateMutation = useMutation({
    mutationFn: async (formData: EditFormData) => {
      const response = await fetch(`/api/admin/artworks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update artwork");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch artwork data
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/artworks/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/artworks/featured"] });
      
      toast({
        title: "Artwork updated",
        description: "The artwork information has been updated successfully.",
      });
      
      // Navigate back to manage page
      navigate("/admin/manage");
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the artwork",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting artwork
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/artworks/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete artwork");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch artwork data
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artworks/featured"] });
      
      toast({
        title: "Artwork deleted",
        description: "The artwork has been permanently deleted.",
      });
      
      // Navigate back to manage page
      navigate("/admin/manage");
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the artwork",
        variant: "destructive",
      });
    },
  });
  
  // Handle delete button click with confirmation
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this artwork? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  function onSubmit(data: EditFormData) {
    updateMutation.mutate(data);
  }

  if (isLoadingArtwork) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p>Loading artwork information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-serif mb-4">Artwork Not Found</h1>
            <p className="mb-6">The artwork you're trying to edit could not be found.</p>
            <Button onClick={() => navigate("/admin/manage")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Manage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => navigate("/admin/manage")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Manage
          </Button>
          <h1 className="text-3xl font-serif">Edit Artwork</h1>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Update "{artwork.title}"</CardTitle>
            <CardDescription>
              Update information and configure purchase options for this artwork
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="px-6 pt-2">
              <TabsTrigger value="info" className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4" />
                Artwork Details
              </TabsTrigger>
              <TabsTrigger value="ecommerce" className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase Options
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Artwork Information */}
            <TabsContent value="info">
              <CardContent>
                <div className="flex mb-6">
                  <div className="mr-6 w-1/3">
                    <img 
                      src={artwork.imageUrl} 
                      alt={artwork.title} 
                      className="rounded-md shadow-sm w-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `/fallback-${artwork.category || 'default'}.svg`;
                      }}
                    />
                  </div>
                  
                  <div className="w-2/3">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Artwork title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="magical-realism">Magical Realism</SelectItem>
                                    <SelectItem value="sculpture">Sculpture</SelectItem>
                                    <SelectItem value="still-life">Still Life</SelectItem>
                                    <SelectItem value="figurative">Figurative</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="medium"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medium</FormLabel>
                                <FormControl>
                                  <Input placeholder="Medium (e.g., Oil on Canvas)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                  <Input placeholder="Year created" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="dimensions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dimensions</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dimensions (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Price" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="Image URL" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Detailed description of the artwork"
                                  className="min-h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Featured</FormLabel>
                                  <FormDescription>
                                    Show on homepage featured section
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="available"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Available</FormLabel>
                                  <FormDescription>
                                    Artwork is available for purchase
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-between pt-4">
                          <Button 
                            type="button" 
                            variant="destructive"
                            onClick={handleDelete}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                          
                          <Button type="submit" disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            {/* E-commerce Settings Tab */}
            <TabsContent value="ecommerce">
              <CardContent>
                {artwork && (
                  <ArtworkEcommerceSettings 
                    artwork={artwork} 
                    onSaved={(updatedArtwork) => {
                      // Update the artwork in cache when e-commerce settings are saved
                      queryClient.setQueryData([`/api/artworks/${id}`], updatedArtwork);
                      toast({
                        title: "Purchase options updated",
                        description: "The artwork purchase options have been updated successfully",
                      });
                    }} 
                  />
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}