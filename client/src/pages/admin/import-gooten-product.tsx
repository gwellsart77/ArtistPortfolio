import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ArrowLeft, Home, Upload, Package, Image } from 'lucide-react';
import { insertProductSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Create a Gooten product schema
const gootenProductSchema = insertProductSchema.extend({
  gootenProductId: z.string().optional(),
  gootenRecipeId: z.string().optional(),
  gootenSku: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  altText: z.string().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  stock: z.number().optional(),
});

export default function ImportGootenProduct() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const queryClient = useQueryClient();
  
  // Check if user is authenticated
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);

  // Form setup
  const form = useForm({
    resolver: zodResolver(gootenProductSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "merchandise", // Default to merchandise for Gooten products
      price: 0,
      imageUrl: "",
      available: true,
      stock: 999, // Using a high fixed value for print-on-demand products
      height: undefined,
      width: undefined,
      gootenProductId: "",
      gootenRecipeId: "",
      gootenSku: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      altText: "",
    },
  });
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setImageUrl(data.imageUrl);
      form.setValue('imageUrl', data.imageUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      console.error('Image upload error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  // Form submission handler
  const onSubmit = async (data: z.infer<typeof gootenProductSchema>) => {
    // Verify image is included
    if (!data.imageUrl) {
      toast({
        title: "Image Required",
        description: "Please upload or provide an image URL for the product",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set the product type to merchandise for Gooten products
      data.type = "merchandise";
      
      // Create the product
      const response = await apiRequest("POST", "/api/products", data);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Gooten Product Added",
          description: "Your Gooten product has been successfully added to your shop",
        });
        
        // Invalidate the products query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        
        // Navigate back to the products page
        navigate("/admin/manage-products");
      } else {
        throw new Error(result.message || "Failed to add product");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      });
    }
  };

  // Watch for image URL changes to update preview
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'imageUrl') {
        setImageUrl(value.imageUrl as string);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate("/admin/shop-settings")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif">Manually Add Gooten Product</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center text-neutral-600 hover:text-[#b8860b]"
              onClick={() => navigate("/admin/manage-products")}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Shop
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center text-neutral-600 hover:text-[#b8860b]"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              View Website
            </Button>
          </div>
        </div>
        
        <Card className="p-6 shadow-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="gooten">Gooten Details</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
                </TabsList>
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter product description" 
                                className="min-h-[120px]" 
                                {...field} 
                              />
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
                            <FormLabel>Price (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Stock is automatically set to a high value for print-on-demand products */}
                      
                      <FormField
                        control={form.control}
                        name="available"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Available for Purchase
                              </FormLabel>
                              <FormDescription>
                                Toggle this setting to make the product available or unavailable
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
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="image-upload">Product Image</Label>
                        <div className="mt-2 flex flex-col gap-4">
                          <div className="relative flex items-center gap-4">
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              className="w-full"
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </>
                              )}
                            </Button>
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input
                                      placeholder="Or paste image URL"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {imageUrl && (
                            <div className="aspect-square w-full overflow-hidden rounded-md border border-gray-200">
                              <img
                                src={imageUrl}
                                alt="Product preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          
                          {!imageUrl && (
                            <div className="aspect-square w-full overflow-hidden rounded-md border border-gray-200 flex items-center justify-center bg-gray-50">
                              <Image className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Gooten Details Tab */}
                <TabsContent value="gooten" className="space-y-6">
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                    <p className="text-amber-800 text-sm">
                      Add Gooten product details here to help with tracking and future integration. These fields are optional.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="gootenProductId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gooten Product ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Gooten Product ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            The ID of the product from your Gooten catalog
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gootenRecipeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gooten Recipe ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Gooten Recipe ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            Recipe ID for customization options
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gootenSku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gooten SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Gooten SKU" {...field} />
                          </FormControl>
                          <FormDescription>
                            The SKU identifier for this product in Gooten
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (inches)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Height"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width (inches)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Width"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* SEO & Metadata Tab */}
                <TabsContent value="seo" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Title</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO optimized title (optional)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave blank to use product title
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
                        <FormLabel>SEO Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="SEO optimized description (optional)" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to use product description
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seoKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="Keywords separated by commas" {...field} />
                        </FormControl>
                        <FormDescription>
                          Example: canvas print, wall art, home decor
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
                          <Input placeholder="Descriptive alt text for the image" {...field} />
                        </FormControl>
                        <FormDescription>
                          Important for accessibility and SEO
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/shop-settings")}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Gooten Product
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}