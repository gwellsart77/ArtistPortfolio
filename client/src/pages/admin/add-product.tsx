import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Package, Calculator, Award, Upload } from "lucide-react";
import { navigateBackToDashboard } from "@/lib/navigation-utils";

export default function AddProduct() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useImageUrl, setUseImageUrl] = useState<boolean>(true);
  const [, setUploading] = useState<boolean>(false);
  const [productType, setProductType] = useState<string>("originals");
  const [printSubtype, setPrintSubtype] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  
  // Fetch price per square inch setting for automatic price calculation
  const { data: pricePerSquareInchSetting } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/price_per_square_inch"],
  });

  // Note: Gallery categories available but currently unused

  // Check if user is authenticated
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const form = useForm({
    resolver: zodResolver(insertProductSchema.extend({
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      seoKeywords: z.string().optional(),
      altText: z.string().optional(),
      height: z.number().optional(),
      width: z.number().optional(),
      subtype: z.string().optional(),
      isLimitedEdition: z.boolean().optional(),
      editionSize: z.number().optional(),
      editionNumber: z.number().optional(),
    })),
    defaultValues: {
      title: "",
      description: "",
      type: "originals",
      subtype: "",
      price: 0,
      imageUrl: "",
      available: true,
      height: undefined,
      width: undefined,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      altText: "",
    },
  });
  
  // Calculate price based on dimensions for original artwork
  const calculatePriceFromDimensions = () => {
    if (height && width && pricePerSquareInchSetting?.value) {
      const heightVal = parseFloat(height);
      const widthVal = parseFloat(width);
      const pricePerSquareInch = parseFloat(pricePerSquareInchSetting.value);
      
      if (!isNaN(heightVal) && !isNaN(widthVal) && !isNaN(pricePerSquareInch)) {
        const squareInches = heightVal * widthVal;
        const calculatedPrice = Math.round(squareInches * pricePerSquareInch);
        form.setValue("price", calculatedPrice);
      }
    }
  };
  
  // Handle manual image URL entry
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    form.setValue("imageUrl", e.target.value);
  };
  
  // Handle product type change
  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    form.setValue("type", value);
    
    // Clear subtype if switching away from prints
    if (value !== "prints") {
      setPrintSubtype("");
      form.setValue("subtype", "");
    }
  };
  
  // Handle print subtype change
  const handlePrintSubtypeChange = (value: string) => {
    setPrintSubtype(value);
    form.setValue("subtype", value);
  };
  
  // Handle height change and recalculate price
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    const heightNum = parseFloat(newHeight);
    if (!isNaN(heightNum)) {
      form.setValue("height", heightNum as any);
      calculatePriceFromDimensions();
    }
  };
  
  // Handle width change and recalculate price
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    const widthNum = parseFloat(newWidth);
    if (!isNaN(widthNum)) {
      form.setValue("width", widthNum as any);
      calculatePriceFromDimensions();
    }
  };
  
  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      navigate("/admin/products");
    },
    onError: (error: any) => {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });
  
  // Upload image to Cloudinary first if using file upload
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Form submission handler
  async function onSubmit(data: any) {
    try {
      // First check if we have an image (either URL or file)
      if (!imageUrl && !imageFile) {
        toast({
          title: "Missing Image",
          description: "Please provide an image URL or upload an image file for the product.",
          variant: "destructive",
        });
        return;
      }
      
      // Check print subtype requirement
      if (productType === "prints" && !printSubtype) {
        toast({
          title: "Missing Print Type",
          description: "Please select a print type for this print product.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle file upload if needed
      if (!useImageUrl && imageFile) {
        setUploading(true);
        try {
          const uploadedUrl = await uploadImageToCloudinary(imageFile);
          data.imageUrl = uploadedUrl;
        } catch (error) {
          toast({
            title: "Upload Failed",
            description: "Failed to upload the image. Please try again or use an image URL instead.",
            variant: "destructive",
          });
          return;
        } finally {
          setUploading(false);
        }
      }
      
      // Remove null or undefined values
      Object.keys(data).forEach(key => {
        if (data[key] === null || data[key] === undefined || data[key] === "") {
          delete data[key];
        }
      });
      
      // Set the print subtype if applicable
      if (productType === "prints") {
        data.subtype = printSubtype;
      }
      
      // Submit the product data
      addProductMutation.mutate(data);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigateBackToDashboard(navigate)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Add New Product</h1>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Enter the details for the new product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleProductTypeChange(value);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="originals">Original Artwork</SelectItem>
                            <SelectItem value="prints">Prints</SelectItem>
                            <SelectItem value="merchandise">Merchandise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Print Subtype Selection - Only visible when "prints" is selected */}
                  {productType === "prints" && (
                    <FormField
                      control={form.control}
                      name="subtype"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Print Type *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handlePrintSubtypeChange(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select print type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="paper">Print on Paper</SelectItem>
                              <SelectItem value="canvas">Print on Stretched Canvas</SelectItem>
                              <SelectItem value="framed">Framed Print</SelectItem>
                              <SelectItem value="limited_edition">Limited Edition Prints</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This determines how the print will be categorized in the shop.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Limited Edition Fields (only for limited edition prints) */}
                  {productType === "limited_edition" && (
                    <div className="border p-4 rounded-md bg-gray-50 space-y-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Limited Edition Details</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="editionSize" as any
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Edition Size *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Total number in edition (e.g. 50)" 
                                  {...field}
                                  value={String(field.value || '')}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      field.onChange(val);
                                    } else {
                                      field.onChange('');
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                The total number of prints in this limited edition.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="editionNumber" as any
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Edition Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Number of this specific print (e.g. 1)" 
                                  {...field}
                                  value={String(field.value || '')}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      field.onChange(val);
                                    } else {
                                      field.onChange('');
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                The number of this specific print in the series (e.g. 1 of 50).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Dimensions fields for all product types except merchandise */}
                  {productType !== "merchandise" && (
                    <div className={`border p-4 rounded-md ${productType === "originals" ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"} space-y-4`}>
                      <div className="flex items-center mb-2">
                        <Calculator className={`h-5 w-5 mr-2 ${productType === "originals" ? "text-yellow-700" : "text-gray-700"}`} />
                        <h3 className={`text-base font-medium ${productType === "originals" ? "text-yellow-800" : "text-gray-800"}`}>
                          {productType === "originals" ? "Original Artwork Price Calculator" : "Artwork Dimensions"}
                        </h3>
                      </div>
                      
                      {productType === "originals" && (
                        <p className="text-sm text-yellow-700 mb-3">
                          Calculate price based on dimensions using the price per square inch formula
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <FormLabel htmlFor="height-calc">Height (inches)</FormLabel>
                          <Input 
                            id="height-calc"
                            type="number" 
                            step="0.01" 
                            value={height} 
                            onChange={handleHeightChange}
                            placeholder="Height in inches"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <FormLabel htmlFor="width-calc">Width (inches)</FormLabel>
                          <Input 
                            id="width-calc"
                            type="number" 
                            step="0.01" 
                            value={width} 
                            onChange={handleWidthChange}
                            placeholder="Width in inches"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {/* Price calculator only for original artwork */}
                      {productType === "originals" && (
                        <>
                          <div className="text-sm text-yellow-700 mb-2">
                            <span className="font-medium">Price Multiplier: </span>
                            ${pricePerSquareInchSetting ? pricePerSquareInchSetting.value : "4.00"} per square inch
                            {pricePerSquareInchSetting ? "" : " (default)"}
                            <span className="text-xs ml-1">(can be changed in Shop Settings)</span>
                          </div>
                          
                          {height && width && !isNaN(parseFloat(height)) && !isNaN(parseFloat(width)) && (
                            <div className="text-sm text-yellow-700 mb-3">
                              <p>Dimensions: {height}" × {width}" = {(parseFloat(height) * parseFloat(width)).toFixed(2)} sq. inches</p>
                              {form.getValues("price") > 0 && (
                                <p className="font-medium mt-1">Calculated Price: ${form.getValues("price")}</p>
                              )}
                            </div>
                          )}
                          
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
                            onClick={calculatePriceFromDimensions}
                          >
                            Calculate Price
                          </Button>
                        </>
                      )}
                      
                      {/* For non-original artwork, just show dimensions in standard format */}
                      {productType !== "originals" && height && width && !isNaN(parseFloat(height)) && !isNaN(parseFloat(width)) && (
                        <div className="text-sm text-gray-700">
                          <p>Dimensions: {height}" × {width}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Limited Edition Checkbox */}
                  {productType === "limited_edition" && (
                    <FormField
                      control={form.control}
                      name="isLimitedEdition"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                          <FormControl>
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              This is a limited edition print
                            </FormLabel>
                            <FormDescription>
                              Check this box to configure edition size and number
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
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
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Stock quantity" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={productType !== "originals"} 
                          />
                        </FormControl>
                        <FormDescription>
                          {productType !== "originals" ? "Stock tracking is only used for original artwork" : ""}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Image Upload Options */}
                  <div className="border p-4 rounded-md bg-gray-50 space-y-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-medium">Product Image</h3>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <FormLabel htmlFor="upload-option-file" className="cursor-pointer">File Upload</FormLabel>
                          <Switch
                            id="upload-option"
                            checked={!useImageUrl}
                            onCheckedChange={(checked) => {
                              setUseImageUrl(!checked);
                              if (checked) {
                                // Reset image URL when switching to file upload
                                setImageUrl("");
                                form.setValue("imageUrl", "");
                              }
                            }}
                          />
                          <FormLabel htmlFor="upload-option-url" className="cursor-pointer">Image URL</FormLabel>
                        </div>
                      </div>
                    </div>
                    
                    {useImageUrl ? (
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ }) => (
                          <FormItem>
                            <FormLabel>Image URL *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter image URL" 
                                value={imageUrl} 
                                onChange={handleImageUrlChange} 
                              />
                            </FormControl>
                            <FormDescription>
                              Provide a direct link to your product image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                        {imageFile ? (
                          <div className="space-y-4">
                            <img 
                              src={URL.createObjectURL(imageFile)} 
                              alt="Product preview" 
                              className="mx-auto max-h-[200px] object-contain"
                            />
                            <p className="text-sm text-gray-500">
                              Selected image: {imageFile.name}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2"
                              onClick={() => {
                                setImageFile(null);
                                const input = document.getElementById('image-upload') as HTMLInputElement;
                                if (input) input.value = '';
                              }}
                            >
                              Remove image
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <label className="flex flex-col items-center cursor-pointer py-4">
                              <Upload className="h-12 w-12 text-gray-400 mb-2" />
                              <span className="text-lg font-medium mb-1">
                                Click to upload product image
                              </span>
                              <span className="text-sm text-gray-500">
                                JPG, PNG or GIF, up to 10MB
                              </span>
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setImageFile(e.target.files[0] || null);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">SEO Metadata (Optional)</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Custom title for search engines" {...field} />
                            </FormControl>
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
                                placeholder="Meta description for search engines" 
                                {...field} 
                              />
                            </FormControl>
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
                              <Input placeholder="Alternative text for the image" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => window.history.back()}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addProductMutation.isPending}
                    >
                      {addProductMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Product
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="aspect-square w-full rounded-md overflow-hidden mb-4">
                  <img 
                    src={imageUrl} 
                    alt="Product Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-image.jpg";
                    }} 
                  />
                </div>
              ) : (
                <div className="aspect-square w-full rounded-md bg-gray-100 flex items-center justify-center mb-4">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <div className="text-sm">
                <p className="font-medium">{form.watch("title") || "Product Title"}</p>
                <p className="text-green-600 font-medium mt-1">
                  ${form.watch("price") ? form.watch("price").toFixed(2) : "0.00"}
                </p>
                <div className="mt-2 text-gray-500">
                  {form.watch("description") || "Product description will appear here..."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}