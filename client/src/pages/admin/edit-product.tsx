import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Home, Package, Calculator, Award } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditProduct() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [productType, setProductType] = useState<string>("originals");
  const [printSubtype, setPrintSubtype] = useState<string>("");
  const [originalSubtype, setOriginalSubtype] = useState<string>("");
  const [merchandiseSubtype, setMerchandiseSubtype] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  
  // Get price multiplier setting
  const { data: pricePerSquareInchSetting } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/price_per_square_inch"],
    enabled: productType === "originals",
  });
  
  // Get original types for subcategories
  const { data: originalTypes } = useQuery({
    queryKey: ["/api/original-types"],
    enabled: productType === "originals",
  });

  // Get shop categories for merchandise subcategories
  const { data: shopCategoriesData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/shop_categories"],
    enabled: productType === "merchandise",
  });

  // Parse shop categories for merchandise subcategories
  const merchandiseCategories = shopCategoriesData?.value ? (() => {
    try {
      const categories = JSON.parse(shopCategoriesData.value);
      return Array.isArray(categories) ? categories : ["prints", "original-paintings", "merchandise"];
    } catch (e) {
      return ["prints", "original-paintings", "merchandise"];
    }
  })() : ["prints", "original-paintings", "merchandise"];
  
  // Extract product ID from URL
  const productId = parseInt(location.split("/").pop() || "0");
  
  // Check if user is authenticated
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

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
      featured: z.boolean().optional(),
    })),
    defaultValues: {
      title: "",
      description: "",
      type: "originals",
      price: 0,
      imageUrl: "",
      available: true,
      stock: 1,
      height: undefined,
      width: undefined,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      altText: "",
      featured: false,
    },
  });
  
  // Calculate price based on dimensions for original artwork
  const calculatePriceFromDimensions = () => {
    if (productType === "originals" && height && width) {
      // Get the price multiplier from settings, default to 2.50 if not set
      const multiplier = pricePerSquareInchSetting?.value ? parseFloat(pricePerSquareInchSetting.value) : 2.50;
      const heightVal = parseFloat(height);
      const widthVal = parseFloat(width);
      
      if (!isNaN(heightVal) && !isNaN(widthVal) && heightVal > 0 && widthVal > 0) {
        // Calculate price based on area and multiplier
        const area = heightVal * widthVal;
        const calculatedPrice = Math.round(area * multiplier);
        
        // Update the price field
        form.setValue("price", calculatedPrice);
        return calculatedPrice;
      }
    }
    return null;
  };

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description,
        type: product.type,
        subtype: product.subtype || "",
        price: product.price,
        imageUrl: product.imageUrl,
        available: product.available,
        stock: product.stock || 1,
        // Include dimension fields for original artwork
        height: product.height || undefined,
        width: product.width || undefined,
        // Include SEO fields if they exist
        seoTitle: product.seoTitle || "",
        seoDescription: product.seoDescription || "",
        seoKeywords: product.seoKeywords || "",
        altText: product.altText || "",
        featured: product.featured || false,
      });
      setImageUrl(product.imageUrl);
      setProductType(product.type);
      
      // Set print subtype if it exists
      if (product.subtype) {
        setPrintSubtype(product.subtype);
      }
      
      // Set dimension state variables for the calculator
      if (product.height) setHeight(product.height.toString());
      if (product.width) setWidth(product.width.toString());
    }
  }, [product, form]);
  
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
  
  // Handle original subtype change
  const handleOriginalSubtypeChange = (value: string) => {
    setOriginalSubtype(value);
    form.setValue("subtype", value);
  };
  
  // Handle height change and recalculate price
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    
    if (newHeight && !isNaN(parseFloat(newHeight))) {
      form.setValue("height", parseFloat(newHeight));
    } else {
      form.setValue("height", undefined);
    }
    
    // Calculate price if this is an original artwork
    if (productType === "originals") {
      calculatePriceFromDimensions();
    }
  };
  
  // Handle width change and recalculate price
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    
    if (newWidth && !isNaN(parseFloat(newWidth))) {
      form.setValue("width", parseFloat(newWidth));
    } else {
      form.setValue("width", undefined);
    }
    
    // Calculate price if this is an original artwork
    if (productType === "originals") {
      calculatePriceFromDimensions();
    }
  };

  const updateProductMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("PUT", `/api/products/${productId}`, formData);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Product Updated",
        description: "Your product has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating product:", error);
    },
  });

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setImageUrl(data.url);
        form.setValue("imageUrl", data.url);
        toast({
          title: "Image Uploaded",
          description: "Your image has been successfully uploaded",
        });
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDirectImageUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    form.setValue("imageUrl", e.target.value);
  };

  function onSubmit(data: any) {
    if (!data.imageUrl) {
      toast({
        title: "Image Required",
        description: "Please upload or provide an image URL for the product",
        variant: "destructive",
      });
      return;
    }
    
    updateProductMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h1 className="text-xl text-red-700 mb-2">Product Not Found</h1>
            <p className="text-red-600 mb-4">The product you're trying to edit could not be found.</p>
            <Button onClick={() => navigate("/admin/manage-products")}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif">Edit Product</h1>
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

        <Card>
          <CardHeader>
            <CardTitle>Edit Product Details</CardTitle>
            <CardDescription>
              Update the details for "{product.title}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
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
                          value={field.value}
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
                            value={field.value}
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
                  
                  {/* Original Artwork Subtype Selection - Only visible when "originals" is selected */}
                  {productType === "originals" && (
                    <FormField
                      control={form.control}
                      name="subtype"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Original Artwork Type *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleOriginalSubtypeChange(value);
                            }}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select original artwork type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {originalTypes?.map((type: any) => (
                                <SelectItem key={type.id} value={type.name.toLowerCase()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This determines how the original artwork will be categorized in the shop.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Merchandise Subtype Selection - Only visible when "merchandise" is selected */}
                  {productType === "merchandise" && (
                    <FormField
                      control={form.control}
                      name="subtype"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merchandise Category *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setMerchandiseSubtype(value);
                            }}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select merchandise category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {merchandiseCategories.map((category: string) => (
                                <SelectItem key={category} value={category}>
                                  {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This determines how the merchandise will be categorized in the shop.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Limited Edition Fields */}
                  {productType === "limited_edition" && (
                    <div className="border p-4 rounded-md bg-gray-50 space-y-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Limited Edition Details</h3>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="isLimitedEdition"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="editionSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Edition Size *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Total number in edition (e.g. 50)" 
                                  {...field}
                                  value={field.value || ''}
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
                          name="editionNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Edition Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Number of this specific print (e.g. 1)" 
                                  {...field}
                                  value={field.value || ''}
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
                      
                      <FormField
                        control={form.control}
                        name="isLimitedEdition"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                This is a Limited Edition Print
                              </FormLabel>
                              <FormDescription>
                                Check this box to confirm this is a limited edition print.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Show dimensions fields only for original artwork */}
                  {productType === "originals" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Height Input */}
                      <FormItem>
                        <FormLabel>Height (inches)</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              placeholder="Enter height"
                              value={height}
                              onChange={handleHeightChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>

                      {/* Width Input */}
                      <FormItem>
                        <FormLabel>Width (inches)</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              placeholder="Enter width"
                              value={width}
                              onChange={handleWidthChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </div>
                  )}

                  {/* Price Calculator Button for Original Artwork */}
                  {productType === "originals" && height && width && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                      <div className="flex items-center mb-2">
                        <Calculator className="h-4 w-4 mr-2 text-[#b8860b]" />
                        <h3 className="text-sm font-medium">Price Calculator</h3>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        Dimensions: {height}" × {width}" = {parseFloat(height) * parseFloat(width)} sq. inches
                      </p>
                      <p className="text-sm text-slate-600">
                        Price: ${Math.round(parseFloat(height) * parseFloat(width) * (pricePerSquareInchSetting?.value ? parseFloat(pricePerSquareInchSetting.value) : 2.50))}
                        {pricePerSquareInchSetting?.value ? ` (${pricePerSquareInchSetting.value} per sq. inch)` : " (default $2.50 per sq. inch)"}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={calculatePriceFromDimensions}
                      >
                        Update Price
                      </Button>
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
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
                        <FormLabel>Inventory Count *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            placeholder="1" 
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10) || 0;
                              field.onChange(value);
                              // Automatically set availability based on inventory count
                              if (value === 0) {
                                form.setValue("available", false);
                              } else {
                                form.setValue("available", true);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-neutral-500 mt-1">
                          {form.watch("type") === "originals" 
                            ? "For original artwork, typically set to 1" 
                            : "Set to the actual inventory quantity"}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          When set to 0, product will automatically display as "SOLD OUT"
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability Status</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value ? "true" : "false"}
                          value={field.value ? "true" : "false"}
                          disabled={form.watch("stock") === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">In Stock</SelectItem>
                            <SelectItem value="false">Sold Out</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {form.watch("stock") === 0 
                            ? "Automatically set to 'Sold Out' when inventory is 0" 
                            : "Can be manually set to 'Sold Out' even with inventory > 0"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4 border rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Featured Product
                          </FormLabel>
                          <FormDescription>
                            Mark this product as featured to display it in the Featured Shop section on the homepage
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
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
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Product Image *</h3>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Upload a New Image</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        disabled={uploading}
                        className="mb-2"
                      />
                      {uploading && (
                        <div className="flex items-center mt-2 text-sm text-neutral-600">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Or Provide Image URL</p>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={handleDirectImageUrl}
                      />
                      <input type="hidden" {...form.register("imageUrl")} />
                    </div>
                  </div>
                  
                  {imageUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Preview</p>
                      <div className="border rounded-md p-2 w-full max-w-xs">
                        <img 
                          src={imageUrl} 
                          alt="Product preview" 
                          className="w-full h-auto max-h-[200px] object-contain rounded" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400?text=Image+Not+Found";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* SEO & Optimization Section */}
                <div className="space-y-4 mt-8 pt-4 border-t">
                  <h3 className="text-lg font-medium">SEO & Optimization</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Optimize your product for search engines and accessibility
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Custom title for search engines"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A custom title tag for SEO. If left blank, the product title will be used.
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
                            placeholder="Brief description for search results (150-160 characters recommended)"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description that appears in search engine results. Keep it under 160 characters for best results.
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
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Keywords separated by commas"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Keywords related to this product, separated by commas.
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
                          <Textarea
                            placeholder="Descriptive text for the product image"
                            className="min-h-[80px]"
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
                
                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-[#b8860b] hover:bg-opacity-90"
                    disabled={updateProductMutation.isPending}
                  >
                    {updateProductMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Product...
                      </>
                    ) : (
                      "Update Product"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}