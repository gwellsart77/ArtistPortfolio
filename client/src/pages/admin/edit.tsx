import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertArtworkSchema, type InsertArtwork, type Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { cacheInvalidation } from "@/lib/cache-invalidation";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Save, Trash2, ShoppingCart, Image as ImageIcon, CircleDollarSign, FileDigit, FileImage, Paintbrush, BookCopy, Search, AlertCircle, CalculatorIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CardFooter } from "@/components/ui/card";
import { z } from "zod";

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
  available: boolean; // Keeping for backwards compatibility
  status: 'available' | 'sold' | 'unavailable'; // New status field
  imageUrl: string;
  // SEO fields
  seoTitle: string;
  seoDescription: string;
  altText: string;
  // E-commerce fields
  linkedProductId?: number; // ID of the linked shop product
  isLimitedEdition: boolean;
  editionSize: string;
  editionsSold: string;
  limitedEditionPrice: string;
  hasDigitalVersion: boolean;
  digitalFileUrl: string;
  digitalPrice: string;
  personalLicensePrice: string;
  commercialLicensePrice: string;
}

export default function ArtworkEdit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for height, width and price calculator
  const [height, setHeight] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  
  // Get price multiplier setting for calculator
  const { data: pricePerSquareInchSetting } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/price_per_square_inch"],
  });

  // Fetch gallery categories from settings
  const { data: galleryCategoriesSetting } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/gallery_categories"],
  });

  // Parse gallery categories from settings
  const galleryCategories = galleryCategoriesSetting?.value 
    ? JSON.parse(galleryCategoriesSetting.value)
    : ["imaginative-realism", "chinese-zodiac-series", "vinyl-record-art", "sculpture", "murals", "figurative"];
  
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
  
  // Fetch linked product if it exists
  const { data: linkedProduct, isLoading: isLoadingProduct, refetch: refetchLinkedProduct } = useQuery<{
    id: number;
    title: string;
    available: boolean;
    stock: number;
  }>({
    queryKey: [`/api/products/by-artwork/${id}`],
    enabled: !!id,
  });

  // Form setup with default values from existing artwork
  const form = useForm<EditFormData>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string(),
        category: z.string(),
        year: z.string(),
        medium: z.string(),
        dimensions: z.string(),
        price: z.string(),
        featured: z.boolean(),
        available: z.boolean(),
        status: z.enum(['available', 'sold', 'unavailable']),
        imageUrl: z.string().url("Must be a valid URL"),
        // SEO fields
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),

        altText: z.string().optional(),
        // E-commerce fields
        isLimitedEdition: z.boolean(),
        editionSize: z.string().transform(val => Number(val) || undefined),
        editionsSold: z.string().transform(val => Number(val) || 0),
        limitedEditionPrice: z.string().transform(val => Number(val) || undefined),
        hasDigitalVersion: z.boolean(),
        digitalFileUrl: z.string().url("Must be a valid URL").or(z.string().length(0)),
        digitalPrice: z.string().transform(val => Number(val) || undefined),
        personalLicensePrice: z.string().transform(val => Number(val) || undefined),
        commercialLicensePrice: z.string().transform(val => Number(val) || undefined),
      })
    ),
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
      status: 'available', // Add default status
      imageUrl: "",
      // SEO fields
      seoTitle: "",
      seoDescription: "",

      altText: "",
      // E-commerce fields
      isLimitedEdition: false,
      editionSize: "",
      editionsSold: "0",
      limitedEditionPrice: "",
      hasDigitalVersion: false,
      digitalFileUrl: "",
      digitalPrice: "",
      personalLicensePrice: "",
      commercialLicensePrice: "",
    },
  });

  // Get the form values that we need to watch for conditional rendering
  const isLimitedEdition = form.watch('isLimitedEdition');
  const hasDigitalVersion = form.watch('hasDigitalVersion');
  const artworkStatus = form.watch('status');

  // Add to shop mutation
  const addToShopMutation = useMutation({
    mutationFn: async () => {
      if (!artwork) return null;
      
      // Extract height and width from artwork dimensions
      let extractedHeight = null;
      let extractedWidth = null;
      
      if (artwork.dimensions) {
        // Parse dimensions like "16" × 20"" (art standard: height × width format)
        const dimensionMatch = artwork.dimensions.match(/(\d+\.?\d*)\s*[\"']?\s*[x×]\s*(\d+\.?\d*)/i);
        if (dimensionMatch && dimensionMatch.length >= 3) {
          extractedHeight = parseFloat(dimensionMatch[1]); // Height is first number (art standard)
          extractedWidth = parseFloat(dimensionMatch[2]);  // Width is second number
        }
      }
      
      // Create a new product from the artwork
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Original Painting: "${artwork.title}"`,
          description: artwork.description,
          price: artwork.price || 0,
          imageUrl: artwork.imageUrl,
          type: 'originals',
          available: artwork.status === 'available',
          stock: 1,
          artworkId: artwork.id,
          category: artwork.category,
          height: extractedHeight,
          width: extractedWidth,
          seoTitle: artwork.seoTitle,
          seoDescription: artwork.seoDescription,

          altText: artwork.altText
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add artwork to shop');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Artwork has been added to the shop",
      });
      // Use automatic cache invalidation
      cacheInvalidation.products();
      refetchLinkedProduct();
      queryClient.invalidateQueries({ queryKey: [`/api/products/by-artwork/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error adding to shop",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Update form values when artwork data is loaded
  useEffect(() => {
    if (artwork) {
      // Try to extract height and width from dimensions for the price calculator
      if (artwork.dimensions) {
        const dimensionMatch = artwork.dimensions.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i);
        if (dimensionMatch && dimensionMatch.length >= 3) {
          setHeight(dimensionMatch[1]);
          setWidth(dimensionMatch[2]);
        }
      }
      
      form.reset({
        title: artwork.title,
        description: artwork.description,
        category: artwork.category,
        year: artwork.year,
        medium: artwork.medium,
        dimensions: artwork.dimensions || "",
        price: String(artwork.price || ''),
        featured: artwork.featured === null ? false : artwork.featured,
        available: artwork.available === null ? true : artwork.available,
        status: artwork.status ? (artwork.status as 'available' | 'sold' | 'unavailable') : 'available',
        imageUrl: artwork.imageUrl,
        // SEO fields with fallbacks to empty strings if null
        seoTitle: artwork.seoTitle || "",
        seoDescription: artwork.seoDescription || "",

        altText: artwork.altText || "",
        // E-commerce fields with fallbacks
        isLimitedEdition: artwork.isLimitedEdition || false,
        editionSize: artwork.editionSize ? String(artwork.editionSize) : "",
        editionsSold: artwork.editionsSold ? String(artwork.editionsSold) : "0",
        limitedEditionPrice: artwork.limitedEditionPrice ? String(artwork.limitedEditionPrice) : "",
        hasDigitalVersion: artwork.hasDigitalVersion || false,
        digitalFileUrl: artwork.digitalFileUrl || "",
        digitalPrice: artwork.digitalPrice ? String(artwork.digitalPrice) : "",
        personalLicensePrice: artwork.personalLicensePrice ? String(artwork.personalLicensePrice) : "",
        commercialLicensePrice: artwork.commercialLicensePrice ? String(artwork.commercialLicensePrice) : "",
      });
    }
  }, [artwork, form]);

  // Mutation for updating artwork
  const updateMutation = useMutation({
    mutationFn: async (formData: EditFormData) => {
      console.log("Form data before submission:", formData);
      
      // Clean up the form data before submitting
      const dataToSubmit: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        year: formData.year,
        medium: formData.medium,
        dimensions: formData.dimensions,
        featured: formData.featured,
        available: formData.available,
        status: formData.status, // Status field is the source of truth
        imageUrl: formData.imageUrl,
        
        // Handle price field based on status
        price: formData.status === 'unavailable' && (!formData.price || formData.price === '') 
               ? null 
               : Number(formData.price) || 0,
        // SEO fields
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,

        altText: formData.altText,
        // E-commerce fields
        isLimitedEdition: formData.isLimitedEdition,
        editionSize: formData.editionSize ? Number(formData.editionSize) : null,
        editionsSold: formData.editionsSold ? Number(formData.editionsSold) : 0,
        limitedEditionPrice: formData.limitedEditionPrice ? Number(formData.limitedEditionPrice) : null,
        hasDigitalVersion: formData.hasDigitalVersion,
        digitalFileUrl: formData.digitalFileUrl || null,
        digitalPrice: formData.digitalPrice ? Number(formData.digitalPrice) : null,
        personalLicensePrice: formData.personalLicensePrice ? Number(formData.personalLicensePrice) : null,
        commercialLicensePrice: formData.commercialLicensePrice ? Number(formData.commercialLicensePrice) : null,
      };
      
      // Send update to the API
      const response = await fetch(`/api/admin/artworks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update artwork");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Use automatic cache invalidation
      cacheInvalidation.artworks();
      cacheInvalidation.products();
      queryClient.invalidateQueries({ queryKey: [`/api/artworks/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/by-artwork/${id}`] });
      refetchLinkedProduct(); // Force immediate refresh
      toast({
        title: "Artwork updated",
        description: "The artwork has been updated successfully",
      });
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
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete artwork");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artworks'] });
      toast({
        title: "Artwork deleted",
        description: "The artwork has been deleted successfully",
      });
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
              <TabsTrigger value="seo" className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                SEO & Optimization
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Artwork Information */}
            <TabsContent value="info">
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <h2 className="text-xl font-medium mb-2">Artwork Information</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          Basic information about the artwork. Fields marked with * are required.
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Artwork title" {...field} />
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
                              <Input placeholder="Year created (e.g., 2023)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Detailed description of the artwork..."
                                  className="min-h-[120px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {galleryCategories.map((category: string) => {
                                  // Format the category name for display (capitalize words, replace hyphens with spaces)
                                  const displayName = category.split('-')
                                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                                    
                                  return (
                                    <SelectItem key={category} value={category}>
                                      {displayName}
                                    </SelectItem>
                                  );
                                })}
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
                      
                      {/* Height and Width fields for better sync with products */}
                      <div>
                        <Label>Height (inches)</Label>
                        <Input
                          placeholder="Height in inches"
                          type="number"
                          min="1"
                          value={height}
                          onChange={(e) => {
                            setHeight(e.target.value);
                            // Auto-update dimensions field in standard format
                            if (e.target.value && width) {
                              form.setValue("dimensions", `${e.target.value}" × ${width}"`);
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Width (inches)</Label>
                        <Input
                          placeholder="Width in inches"
                          type="number"
                          min="1"
                          value={width}
                          onChange={(e) => {
                            setWidth(e.target.value);
                            // Auto-update dimensions field in standard format
                            if (height && e.target.value) {
                              form.setValue("dimensions", `${height}" × ${e.target.value}"`);
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                      
                      {/* Hidden dimensions field for compatibility */}
                      <FormField
                        control={form.control}
                        name="dimensions"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Price Calculator */}
                      <div className="col-span-2 mt-4">
                        <Card className="border-dashed border-yellow-400/70 bg-yellow-50/50">
                          <CardHeader className="pb-2">
                            <div className="flex items-center">
                              <CalculatorIcon className="h-5 w-5 mr-2 text-yellow-600" />
                              <CardTitle className="text-lg text-yellow-800">
                                Original Artwork Price Calculator
                              </CardTitle>
                            </div>
                            <CardDescription>
                              Calculate price based on dimensions using the price per square inch formula
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="height">Height (inches)</Label>
                                <Input
                                  id="height"
                                  placeholder="Height in inches"
                                  type="number"
                                  min="1"
                                  value={height}
                                  onChange={(e) => setHeight(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="width">Width (inches)</Label>
                                <Input
                                  id="width"
                                  placeholder="Width in inches"
                                  type="number"
                                  min="1"
                                  value={width}
                                  onChange={(e) => setWidth(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <Label className="font-medium">Price Multiplier:</Label>
                              <p className="text-sm text-muted-foreground">
                                ${pricePerSquareInchSetting?.value || "2.00"} per square inch
                                (can be changed in Shop Settings)
                              </p>
                            </div>
                            
                            {height && width && !isNaN(parseFloat(height)) && !isNaN(parseFloat(width)) && (
                              <div className="mt-4 p-3 bg-yellow-100/50 rounded-md border border-yellow-200">
                                <p className="font-medium">Calculated Price:</p>
                                <p className="text-xl font-bold">
                                  ${(parseFloat(height) * parseFloat(width) * 
                                    parseFloat(pricePerSquareInchSetting?.value || "2.00")).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {parseFloat(height)} × {parseFloat(width)} × 
                                  ${pricePerSquareInchSetting?.value || "2.00"} = 
                                  ${(parseFloat(height) * parseFloat(width) * 
                                    parseFloat(pricePerSquareInchSetting?.value || "2.00")).toFixed(2)}
                                </p>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    const calculatedPrice = (parseFloat(height) * parseFloat(width) * 
                                      parseFloat(pricePerSquareInchSetting?.value || "2.00")).toFixed(2);
                                    form.setValue("price", calculatedPrice);
                                    toast({
                                      title: "Price Updated",
                                      description: `Price set to $${calculatedPrice}`,
                                    });
                                  }}
                                >
                                  Use This Price
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Featured Artwork</FormLabel>
                              <FormDescription>
                                Display prominently on the home page and in featured collections
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
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
                              <Input placeholder="URL to the artwork image" {...field} />
                            </FormControl>
                            <FormDescription>
                              Direct URL to the high-quality image (from Cloudinary or another hosting service)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Artwork Status</FormLabel>
                            <FormControl>
                              {/* Wrap everything in a single div to satisfy React.Children.only requirement */}
                              <div>
                                <div className="space-y-3">
                                  <div 
                                    className={`border rounded-md p-4 cursor-pointer ${field.value === 'available' ? 'border-2 border-green-500 bg-green-50' : 'border-gray-200'}`}
                                    onClick={() => {
                                      field.onChange('available');
                                      form.setValue('available', true); // For backward compatibility
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium">Available for Purchase</h4>
                                        <p className="text-sm text-muted-foreground">Currently for sale</p>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full ${field.value === 'available' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                    </div>
                                  </div>
                                  
                                  <div 
                                    className={`border rounded-md p-4 cursor-pointer ${field.value === 'sold' ? 'border-2 border-red-500 bg-red-50' : 'border-gray-200'}`}
                                    onClick={() => {
                                      field.onChange('sold');
                                      form.setValue('available', false); // For backward compatibility
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium">SOLD</h4>
                                        <p className="text-sm text-muted-foreground">Mark as sold - shows red label</p>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full ${field.value === 'sold' ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                    </div>
                                  </div>

                                  <div 
                                    className={`border rounded-md p-4 cursor-pointer ${field.value === 'unavailable' ? 'border-2 border-amber-500 bg-amber-50' : 'border-gray-200'}`}
                                    onClick={() => {
                                      field.onChange('unavailable');
                                      form.setValue('available', false); // For backward compatibility

                                      // If price field is empty when selecting unavailable, that's ok
                                      const currentPrice = form.getValues('price');
                                      if (!currentPrice) {
                                        form.clearErrors('price');
                                      }
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium">Unavailable</h4>
                                        <p className="text-sm text-muted-foreground">Not for sale - can be displayed without price</p>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full ${field.value === 'unavailable' ? 'bg-amber-500' : 'bg-gray-200'}`}></div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Shop Integration Section */}
                                <div className={`mt-4 border rounded-md p-4 ${
                                  linkedProduct?.available === false 
                                    ? 'bg-red-50 border-red-200' 
                                    : 'bg-blue-50 border-blue-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className={`font-medium ${
                                        linkedProduct?.available === false 
                                          ? 'text-red-700' 
                                          : 'text-blue-700'
                                      }`}>
                                        <ShoppingCart className="h-4 w-4 inline mr-2" />
                                        {linkedProduct 
                                          ? (linkedProduct.available ? "Added to Shop" : "Shop Product Unavailable")
                                          : "Add to Shop"}
                                      </h4>
                                      <p className={`text-sm ${
                                        linkedProduct?.available === false 
                                          ? 'text-red-600' 
                                          : 'text-blue-600'
                                      }`}>
                                        {linkedProduct 
                                          ? (linkedProduct.available 
                                              ? "This artwork is available in your shop" 
                                              : "Product is unavailable (out of stock)")
                                          : "Make this artwork available for purchase"}
                                      </p>
                                    </div>
                                    {linkedProduct ? (
                                      <Button 
                                        variant={linkedProduct.available ? "outline" : "secondary"}
                                        size="sm"
                                        onClick={() => navigate(`/admin/edit-product/${linkedProduct.id}`)}
                                      >
                                        {linkedProduct.available 
                                          ? "View Product" 
                                          : (form.watch("status") === "sold" ? "SOLD" : "Unavailable")
                                        }
                                      </Button>
                                    ) : (
                                      <Button 
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                          console.log("Add to shop button clicked");
                                          addToShopMutation.mutate();
                                        }}
                                        disabled={addToShopMutation.isPending || artworkStatus !== 'available'}
                                      >
                                        {addToShopMutation.isPending ? "Adding..." : "Add to Shop"}
                                      </Button>
                                    )}
                                  </div>
                                  {!linkedProduct && artworkStatus !== 'available' && (
                                    <p className="text-sm text-amber-600 mt-2">
                                      ℹ️ Only available artwork can be added to the shop
                                    </p>
                                  )}
                                </div>
                              </div>
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
              </CardContent>
            </TabsContent>
            
            {/* E-commerce Settings Tab */}
            <TabsContent value="ecommerce">
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Original Artwork Section */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Original Artwork</h3>
                        <p className="text-sm text-muted-foreground">Manage sales settings for the original artwork</p>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <Label htmlFor="available" className="text-base">Availability</Label>
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
                                  id="available"
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
                            <FormLabel>
                              Original Artwork Price (USD)
                              {artworkStatus === 'unavailable' && 
                                <span className="ml-2 text-sm text-amber-500 font-normal">(Optional for unavailable artworks)</span>
                              }
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  className={`pl-10 ${artworkStatus === 'unavailable' ? 'border-amber-200' : ''}`}
                                  disabled={artworkStatus === 'unavailable' && !field.value}
                                  required={artworkStatus !== 'unavailable'}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              {artworkStatus === 'unavailable' 
                                ? 'Optional for unavailable artworks - can be displayed without price' 
                                : 'Set the price for the original, one-of-a-kind artwork'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    {/* Limited Edition Section */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Limited Edition</h3>
                        <p className="text-sm text-muted-foreground">Offer limited edition prints of this artwork</p>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <Label htmlFor="isLimitedEdition" className="text-base">Limited Edition Availability</Label>
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
                                  id="isLimitedEdition"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {isLimitedEdition && (
                        <div className="space-y-4 border rounded-md p-4 bg-muted/30">
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
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Digital Version Section */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Digital Version</h3>
                        <p className="text-sm text-muted-foreground">Offer digital downloads of this artwork</p>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <Label htmlFor="hasDigitalVersion" className="text-base">Digital Version Availability</Label>
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
                                  id="hasDigitalVersion"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {hasDigitalVersion && (
                        <div className="space-y-4 border rounded-md p-4 bg-muted/30">
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
                          
                          <FormField
                            control={form.control}
                            name="digitalPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Digital Download Price (USD)</FormLabel>
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
                                  Price for full digital download
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="personalLicensePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Personal License Price (USD)</FormLabel>
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
                                  Price for personal use license only
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
                                <FormLabel>Commercial License Price (USD)</FormLabel>
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
                                  Price for commercial use license
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={updateMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {updateMutation.isPending ? "Saving..." : "Save Purchase Options"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
            
            {/* SEO & Optimization Tab */}
            <TabsContent value="seo">
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Search Engine Optimization</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        These settings help search engines better understand and index your artwork, improving your website's visibility online.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Custom title for search engines (leave blank to use artwork title)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A custom title tag specifically optimized for search engines. Limit to 50-60 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Concise description for search result snippets"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A brief summary that appears in search results. Aim for 150-160 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      

                      <FormField
                        control={form.control}
                        name="altText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image Alt Text</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Descriptive text for the artwork image"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Describes the image for screen readers and search engines. Be descriptive but concise.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save SEO Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}