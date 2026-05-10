import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { type InsertArtwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Search, Calculator, CircleDollarSign, FileText, Settings, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/AdminLayout";

// Define a custom schema for the upload form
const uploadFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  year: z.string().min(1, "Year is required"),
  medium: z.string().min(1, "Medium is required"),
  dimensions: z.string().optional(),
  price: z.string().optional(), // Allow empty string for price
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  altText: z.string().optional(),
  // Image sources
  image: z.any().optional(), // FileList or null
  cloudinaryUrl: z.string()
    .optional()
    .refine(
      (url) => !url || url.trim() === '' || url.startsWith('https://res.cloudinary.com/'),
      "Please enter a valid Cloudinary URL (must start with https://res.cloudinary.com/)"
    ),
  useCloudinaryUrl: z.boolean().default(false)
});

// Custom upload form data interface
type UploadFormData = z.infer<typeof uploadFormSchema>;

export default function ArtworkUpload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [height, setHeight] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');

  interface SettingValue {
    id: number;
    key: string;
    value: string;
  }

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      year: new Date().getFullYear().toString(),
      medium: "",
      dimensions: "",
      price: "",
      featured: false,
      available: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      altText: "",
      useCloudinaryUrl: false
    }
  });

  const watchImageFiles = form.watch("image");
  const useCloudinaryUrl = form.watch("useCloudinaryUrl");
  const imageFile = watchImageFiles as FileList | null;

  // Load categories and price per square inch setting
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/settings/gallery_categories"]
  });

  const { data: pricePerSquareInchData } = useQuery({
    queryKey: ["/api/settings/price_per_square_inch"]
  });

  // Handle file selection and preview generation
  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const urls: string[] = [];
      
      for (let i = 0; i < imageFile.length; i++) {
        const file = imageFile[i];
        if (file && file.type.startsWith('image/')) {
          urls.push(URL.createObjectURL(file));
        }
      }
      
      setPreviewUrls(urls);
      
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    } else {
      setPreviewUrls([]);
    }
  }, [imageFile]);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/artworks", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Artwork uploaded successfully!",
      });
      
      // Reset form and navigate back
      form.reset();
      setPreviewUrls([]);
      setHeight("");
      setWidth("");
      setCalculatedPrice(null);
      
      // Invalidate queries to refetch artwork data
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artworks/featured"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calculate price based on dimensions
  const calculatePrice = () => {
    const heightNum = parseFloat(height);
    const widthNum = parseFloat(width);
    
    if (!isNaN(heightNum) && !isNaN(widthNum) && heightNum > 0 && widthNum > 0) {
      const squareInches = heightNum * widthNum;
      
      if (pricePerSquareInchData) {
        let pricePerInch = 4; // default
        const pricePerSquareInchSetting = pricePerSquareInchData as SettingValue;
        if (pricePerSquareInchSetting) {
          pricePerInch = parseFloat(pricePerSquareInchSetting.value) || 4;
        }
        
        const price = Math.round(squareInches * pricePerInch);
        setCalculatedPrice(price);
        form.setValue("price", price.toString());
        
        // Update dimensions field with formatted dimensions
        form.setValue("dimensions", `${height}" × ${width}"`);
        
        return price;
      }
    }
    setCalculatedPrice(null);
    return null;
  };

  // Update dimensions in standard format when height or width changes
  useEffect(() => {
    if (height && width) {
      const heightNum = parseFloat(height);
      const widthNum = parseFloat(width);
      
      if (!isNaN(heightNum) && !isNaN(widthNum) && heightNum > 0 && widthNum > 0) {
        form.setValue("dimensions", `${height}" × ${width}"`);
      }
    }
  }, [height, width, form]);

  function onSubmit(data: UploadFormData) {
    console.log("Form submitted with data:", data);
    
    // Validate that we have an image source
    if (data.useCloudinaryUrl) {
      // Validate Cloudinary URL is provided and valid
      if (!data.cloudinaryUrl || data.cloudinaryUrl.trim() === '') {
        toast({
          title: "Image Required",
          description: "Please enter a Cloudinary URL for the artwork image.",
          variant: "destructive",
        });
        return;
      }
      // Validate URL format
      if (!data.cloudinaryUrl.startsWith('https://res.cloudinary.com/')) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid Cloudinary URL (must start with https://res.cloudinary.com/)",
          variant: "destructive",
        });
        return;
      }
    } else if (!data.image || data.image.length === 0) {
      toast({
        title: "Image Required",
        description: "Please upload an image file or switch to URL mode and provide a Cloudinary URL.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if we're doing a batch upload or single upload
    if (uploadMode === 'multiple' && !data.useCloudinaryUrl && data.image && data.image.length > 0) {
      // Batch upload mode
      const fileCount = data.image.length;
      let successCount = 0;
      let failCount = 0;
      
      // Show a toast to indicate batch upload is starting
      toast({
        title: "Batch Upload Started",
        description: `Uploading ${fileCount} artwork images...`,
      });
      
      // Create a progress helper
      const updateProgress = (success: boolean) => {
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
        
        // If all files have been processed
        if (successCount + failCount === fileCount) {
          toast({
            title: "Batch Upload Complete",
            description: `Successfully uploaded ${successCount} of ${fileCount} artworks.`,
            variant: successCount === fileCount ? "default" : "destructive",
          });
          
          // Reset form
          if (successCount > 0) {
            form.reset();
            setPreviewUrls([]);
            
            // Invalidate queries to refetch artwork data
            queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/artworks/featured"] });
          }
        }
      };
      
      // Process each file
      Array.from(data.image).forEach((file: File, index) => {
        const formData = new FormData();
        
        // Create a unique title for each artwork in the batch
        const fileNumber = index + 1;
        const batchTitle = fileCount > 1 ? `${data.title} (${fileNumber})` : data.title;
        
        // Add all text fields to the FormData
        formData.append('title', batchTitle);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('year', data.year);
        formData.append('medium', data.medium);
        if (data.dimensions) {
          formData.append('dimensions', data.dimensions);
        }
        formData.append('price', data.price || '0');
        formData.append('featured', String(data.featured));
        formData.append('available', String(data.available));
        
        // Add SEO fields - always send them, even if empty
        formData.append('seoTitle', data.seoTitle || batchTitle);
        formData.append('seoDescription', data.seoDescription || '');
        formData.append('seoKeywords', data.seoKeywords || '');
        formData.append('altText', data.altText || batchTitle);
        
        // Add the specific file for this iteration
        formData.append('image', file);
        formData.append('useCloudinaryUrl', 'false');
        
        // Make individual upload request
        fetch("/api/admin/artworks", {
          method: "POST",
          body: formData,
        })
        .then(response => {
          if (response.ok) {
            updateProgress(true);
          } else {
            updateProgress(false);
          }
        })
        .catch(() => {
          updateProgress(false);
        });
      });
      
      return; // Don't proceed with single upload logic
    }
    
    // Single upload mode (existing logic)
    const formData = new FormData();
    
    // Add all text fields to the FormData
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('year', data.year);
    formData.append('medium', data.medium);
    if (data.dimensions) {
      formData.append('dimensions', data.dimensions);
    }
    formData.append('price', data.price || '0');
    formData.append('featured', String(data.featured));
    formData.append('available', String(data.available));
    
    // Add SEO fields - always send them, even if empty
    formData.append('seoTitle', data.seoTitle || '');
    formData.append('seoDescription', data.seoDescription || '');
    formData.append('seoKeywords', data.seoKeywords || '');
    formData.append('altText', data.altText || '');
    
    // Handle different image sources
    if (data.useCloudinaryUrl && data.cloudinaryUrl) {
      // If using Cloudinary URL directly
      formData.append('cloudinaryUrl', data.cloudinaryUrl);
      formData.append('useCloudinaryUrl', 'true');
      console.log("Using Cloudinary URL:", data.cloudinaryUrl);
    } else if (data.image && data.image.length > 0) {
      // If uploading a file
      formData.append('image', data.image[0]);
      formData.append('useCloudinaryUrl', 'false');
      console.log("Adding image to form data:", data.image[0].name);
    } else {
      toast({
        title: "No image provided",
        description: "Please select an image to upload or provide a Cloudinary URL.",
        variant: "destructive",
      });
      return; // Don't proceed if no image
    }
    
    // Submit the form
    uploadMutation.mutate(formData as any);
  }
  
  return (
    <AdminLayout title="Upload New Artwork" description="Add artwork to your gallery and store">
      <div className="max-w-7xl">
        {/* Page action shortcuts */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/manage")}
            className="text-[#b8860b] border-[#b8860b] hover:bg-[#b8860b] hover:text-white"
          >
            Manage Gallery
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Column - Image Upload & Preview */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Upload className="h-5 w-5 mr-2 text-[#b8860b]" />
                      Image Upload
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload Method Toggle */}
                    <FormField
                      control={form.control}
                      name="useCloudinaryUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Upload Method</FormLabel>
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <span className="text-sm">File Upload</span>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("image", null);
                                    setPreviewUrls([]);
                                  } else {
                                    form.setValue("cloudinaryUrl", "");
                                  }
                                }}
                              />
                            </FormControl>
                            <span className="text-sm">Cloudinary URL</span>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {!useCloudinaryUrl && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <span className="text-sm">Single Upload</span>
                        <Switch
                          checked={uploadMode === 'multiple'}
                          onCheckedChange={(checked) => {
                            setUploadMode(checked ? 'multiple' : 'single');
                            form.setValue("image", null);
                            setPreviewUrls([]);
                          }}
                        />
                        <span className="text-sm">Batch Upload</span>
                      </div>
                    )}

                    {!useCloudinaryUrl ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                        {previewUrls.length > 0 ? (
                          <div className="space-y-3">
                            {uploadMode === 'single' ? (
                              <div>
                                <img 
                                  src={previewUrls[0]} 
                                  alt="Artwork preview" 
                                  className="mx-auto max-h-48 object-contain rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {imageFile && imageFile[0]?.name}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  {previewUrls.slice(0, 4).map((url, index) => (
                                    <img 
                                      key={index}
                                      src={url} 
                                      alt={`Preview ${index + 1}`} 
                                      className="w-full h-20 object-cover rounded"
                                    />
                                  ))}
                                </div>
                                {previewUrls.length > 4 && (
                                  <p className="text-xs text-gray-500">
                                    +{previewUrls.length - 4} more images
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">
                              {uploadMode === 'single' ? 'Drop image or click to browse' : 'Drop multiple images or click to browse'}
                            </p>
                          </div>
                        )}
                        
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field: { onChange, ...field } }) => (
                            <FormItem className="mt-3">
                              <FormControl>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  multiple={uploadMode === 'multiple'}
                                  onChange={(e) => onChange(e.target.files)}
                                  className="text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="cloudinaryUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cloudinary URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://res.cloudinary.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Price Calculator */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-[#b8860b]" />
                      Price Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="height" className="text-sm">Height (in)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="0"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="width" className="text-sm">Width (in)</Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="0"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      onClick={calculatePrice}
                      className="w-full h-8 text-sm"
                      variant="outline"
                    >
                      Calculate Price
                    </Button>
                    
                    {calculatedPrice && (
                      <div className="text-center p-2 bg-green-50 rounded border">
                        <p className="text-sm font-medium text-green-800">
                          Calculated: ${calculatedPrice}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column - Basic Information */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-[#b8860b]" />
                      Artwork Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                      
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input placeholder="2024" {...field} />
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
                              placeholder="Describe the artwork..." 
                              className="h-20"
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
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categoriesData && JSON.parse((categoriesData as SettingValue).value || "[]").map((category: string) => (
                                  <SelectItem key={category} value={category}>
                                    {category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </SelectItem>
                                ))}
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
                              <Input placeholder="Oil on canvas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dimensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dimensions</FormLabel>
                            <FormControl>
                              <Input placeholder="24 x 36 inches" {...field} />
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
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex space-x-6">
                      <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Featured Artwork</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="available"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Available for Sale</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - SEO & Metadata */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Search className="h-5 w-5 mr-2 text-[#b8860b]" />
                      SEO Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">SEO Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-generated" className="h-8" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Meta Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description for search engines" 
                              className="h-16 text-sm"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />



                    <FormField
                      control={form.control}
                      name="altText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Alt Text</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Image description" 
                              className="h-8 text-sm"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-[#b8860b] hover:bg-[#9a7209] text-white"
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Artwork
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}