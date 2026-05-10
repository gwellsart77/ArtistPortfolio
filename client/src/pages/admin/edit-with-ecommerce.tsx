import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertArtworkSchema, type InsertArtwork, type Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Save, Trash2, ShoppingCart, ImageIcon } from "lucide-react";
import { ArtworkEcommerceSettings } from "@/components/artwork-ecommerce-settings-fixed";

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