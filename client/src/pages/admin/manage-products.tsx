import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Home, Loader2, ChevronUp, ChevronDown, ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function ManageProducts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [reorderMode, setReorderMode] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Verify session against server on mount
  useEffect(() => {
    fetch("/api/admin/verify-session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem("admin_authenticated");
          navigate("/admin/login");
        }
      })
      .catch(() => {
        if (sessionStorage.getItem("admin_authenticated") !== "true") {
          navigate("/admin/login");
        }
      });
  }, [navigate]);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["/api/products"],
    retry: 1,
  });
  
  // Set local products state when data is loaded
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      setProductsList(products);
    }
  }, [products]);

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted from your shop",
      });
      // Comprehensive cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
      queryClient.removeQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting product:", error);
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, available }: { id: number; available: boolean }) => {
      const response = await apiRequest("PATCH", `/api/products/${id}/availability`, { available });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data.available ? "Product Available" : "Product Marked as Sold Out",
        description: `The product has been marked as ${data.available ? "available" : "sold out"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product availability. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating product:", error);
    },
  });

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  const handleToggleAvailability = (product: Product) => {
    toggleAvailabilityMutation.mutate({ 
      id: product.id, 
      available: !product.available 
    });
  };

  // Add mutation for reordering products
  const updateOrderMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await apiRequest("POST", "/api/admin/products/reorder", { productIds });
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Product Order Updated",
        description: "The product display order has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product order. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating product order:", error);
    },
  });

  // Functions for reordering
  const moveProductUp = (index: number) => {
    if (index === 0) return;
    
    const newProducts = [...productsList];
    const temp = newProducts[index];
    newProducts[index] = newProducts[index - 1];
    newProducts[index - 1] = temp;
    
    setProductsList(newProducts);
  };
  
  const moveProductDown = (index: number) => {
    if (index === productsList.length - 1) return;
    
    const newProducts = [...productsList];
    const temp = newProducts[index];
    newProducts[index] = newProducts[index + 1];
    newProducts[index + 1] = temp;
    
    setProductsList(newProducts);
  };
  
  const moveProductToTop = (index: number) => {
    if (index === 0) return;
    
    const newProducts = [...productsList];
    const [product] = newProducts.splice(index, 1);
    newProducts.unshift(product);
    
    setProductsList(newProducts);
  };
  
  const moveProductToBottom = (index: number) => {
    if (index === productsList.length - 1) return;
    
    const newProducts = [...productsList];
    const [product] = newProducts.splice(index, 1);
    newProducts.push(product);
    
    setProductsList(newProducts);
  };
  
  const saveOrder = () => {
    // Extract the IDs in the new order
    const orderedIds = productsList.map(product => product.id);
    
    // Call the API to update the order
    updateOrderMutation.mutate(orderedIds);
    
    // Exit reorder mode
    setReorderMode(false);
  };
  
  const cancelReorder = () => {
    // Reset to original order from API data
    if (Array.isArray(products)) {
      setProductsList([...products]);
    }
    setReorderMode(false);
  };

  const filteredProducts = currentFilter === "all" 
    ? productsList 
    : productsList.filter((product: Product) => product.type === currentFilter);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif">Manage Shop Products</h1>
          </div>
          <Button 
            variant="ghost" 
            className="flex items-center text-neutral-600 hover:text-[#b8860b]"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4 mr-2" />
            View Website
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Shop Products</CardTitle>
              {reorderMode ? (
                <div className="flex space-x-2">
                  <Button 
                    onClick={saveOrder}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={updateOrderMutation.isPending}
                  >
                    {updateOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Order'
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={cancelReorder}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => navigate("/admin/add-product")}
                    className="bg-[#b8860b] hover:bg-opacity-90"
                  >
                    Add New Product
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center"
                    onClick={() => setReorderMode(true)}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Reorder Products
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mb-6" onValueChange={setCurrentFilter}>
              <TabsList>
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="originals">Originals</TabsTrigger>
                <TabsTrigger value="prints">Prints</TabsTrigger>
                <TabsTrigger value="merchandise">Merchandise</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            ) : isError ? (
              <div className="bg-red-50 p-4 rounded-md text-red-700 text-center">
                Failed to load products. Please try again.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No products found in this category.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: Product, index: number) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-16 h-16 relative rounded-md overflow-hidden border">
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/80?text=Image+Error";
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {product.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.available ? "default" : "secondary"}
                            className={product.available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {product.available ? "Available" : "Sold Out"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {reorderMode ? (
                            <div className="flex justify-end space-x-2">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === 0}
                                  onClick={() => moveProductToTop(index)}
                                  className="h-8 w-8"
                                >
                                  <ArrowUpCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === 0}
                                  onClick={() => moveProductUp(index)}
                                  className="h-8 w-8"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === filteredProducts.length - 1}
                                  onClick={() => moveProductDown(index)}
                                  className="h-8 w-8"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === filteredProducts.length - 1}
                                  onClick={() => moveProductToBottom(index)}
                                  className="h-8 w-8"
                                >
                                  <ArrowDownCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAvailability(product)}
                                disabled={toggleAvailabilityMutation.isPending}
                              >
                                {product.available ? "Mark Sold Out" : "Mark Available"}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate(`/admin/edit-product/${product.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteProduct(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.title}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}