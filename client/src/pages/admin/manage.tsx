import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cacheInvalidation } from "@/lib/cache-invalidation";
import { useToast } from "@/hooks/use-toast";
import { Artwork } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown, Edit, Trash2, Home, Loader2, Search } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function ManageGallery() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortMode, setSortMode] = useState<string>("default");
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [reorderMode, setReorderMode] = useState<boolean>(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

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

  // Fetch artworks
  const { data, isLoading, isError } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks"],
  });

  // Update artworks state when data changes
  useEffect(() => {
    if (data) {
      setArtworks([...data]);
    }
  }, [data]);

  // Delete artwork mutation
  const deleteArtworkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/artworks/${id}`);
      return response;
    },
    onSuccess: () => {
      // Use automatic cache invalidation
      cacheInvalidation.artworks();
      cacheInvalidation.products(); // Also invalidate products in case they were linked
      toast({
        title: "Artwork deleted",
        description: "The artwork has been successfully removed from your gallery.",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete artwork. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update artwork order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const response = await apiRequest("PATCH", "/api/admin/artworks/reorder", { orderedIds });
      return response;
    },
    onSuccess: () => {
      // Use automatic cache invalidation
      cacheInvalidation.artworks();
      toast({
        title: "Gallery order updated",
        description: "Your artwork display order has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update artwork order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteArtwork = () => {
    if (artworkToDelete) {
      deleteArtworkMutation.mutate(artworkToDelete.id);
    }
  };

  const moveArtwork = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!artworks || artworks.length === 0) return;
    
    // Create a copy of the artworks array
    const newArtworks = [...artworks];
    
    // Get the artwork to move
    const artworkToMove = newArtworks[index];
    if (!artworkToMove) return;
    
    // Handle different movement directions
    switch (direction) {
      case 'up':
        // Simple move up one position (swap with previous)
        if (index > 0 && newArtworks[index] && newArtworks[index - 1]) {
          [newArtworks[index], newArtworks[index - 1]] = [newArtworks[index - 1], newArtworks[index]];
        }
        break;
        
      case 'down':
        // Simple move down one position (swap with next)
        if (index < newArtworks.length - 1 && newArtworks[index] && newArtworks[index + 1]) {
          [newArtworks[index], newArtworks[index + 1]] = [newArtworks[index + 1], newArtworks[index]];
        }
        break;
        
      case 'top':
        // Move to top - remove from current position and insert at the top
        if (index > 0) {
          newArtworks.splice(index, 1); // Remove from current position
          newArtworks.unshift(artworkToMove); // Add to the beginning
        }
        break;
        
      case 'bottom':
        // Move to bottom - remove from current position and add to the end
        if (index < newArtworks.length - 1) {
          newArtworks.splice(index, 1); // Remove from current position
          newArtworks.push(artworkToMove); // Add to the end
        }
        break;
        
      default:
        return;
    }
    
    // Update the state
    setArtworks(newArtworks);
  };

  const saveOrder = () => {
    if (!artworks) return;
    
    // Extract the IDs in the new order
    const orderedIds = artworks.map(artwork => artwork.id);
    
    // Call the API to update the order
    updateOrderMutation.mutate(orderedIds);
    
    // Exit reorder mode
    setReorderMode(false);
  };

  const cancelReorder = () => {
    // Reset to original order from API data
    if (data && Array.isArray(data)) {
      setArtworks([...data]);
    }
    setReorderMode(false);
  };

  const filteredArtworks = artworks
    ?.filter(artwork => {
      const matchesFilter = (() => {
        if (currentFilter === "all") return true;
        if (currentFilter === "available") return artwork.status === 'available';
        if (currentFilter === "sold") return artwork.status === 'sold';
        if (currentFilter === "unavailable") return artwork.status === 'unavailable';
        if (currentFilter === "featured") return artwork.featured;
        return artwork.category === currentFilter;
      })();
      const matchesSearch = searchQuery === "" ||
        artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artwork.medium || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case "title-asc": return a.title.localeCompare(b.title);
        case "title-desc": return b.title.localeCompare(a.title);
        case "price-asc": return (Number(a.price) || 0) - (Number(b.price) || 0);
        case "price-desc": return (Number(b.price) || 0) - (Number(a.price) || 0);
        default: return 0;
      }
    });
  


  const categories = artworks?.reduce((acc: Set<string>, artwork) => {
    acc.add(artwork.category);
    return acc;
  }, new Set<string>());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#b8860b]" />
          <span className="text-lg">Loading gallery...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h1 className="text-xl text-red-700 mb-2">Error Loading Gallery</h1>
            <p className="text-red-600 mb-4">Could not load your artwork gallery. Please try again.</p>
            <Button onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const returnTab = urlParams.get('returnTab');
              if (returnTab) {
                navigate(`/admin/dashboard?tab=${returnTab}`);
              } else {
                navigate("/admin/dashboard");
              }
            }}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Manage Gallery" description="Edit, reorder, and remove artworks from your gallery">
      <div className="max-w-6xl">
        {/* Action toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
          {reorderMode ? (
            <>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={cancelReorder}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="bg-[#b8860b] hover:bg-opacity-90"
                onClick={saveOrder}
                disabled={updateOrderMutation.isPending}
              >
                {updateOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save New Order"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/upload")}
              >
                Upload New Artwork
              </Button>
              <Button
                variant="default"
                className="bg-[#b8860b] hover:bg-opacity-90"
                onClick={() => setReorderMode(true)}
              >
                Reorder Gallery
              </Button>
              <Button
                variant="ghost"
                className="flex items-center text-neutral-600 hover:text-[#b8860b]"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                View Website
              </Button>
            </>
          )}
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search artworks by title or medium..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortMode} onValueChange={setSortMode}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="title-asc">Title A → Z</SelectItem>
              <SelectItem value="title-desc">Title Z → A</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all" onValueChange={(value) => setCurrentFilter(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Artworks</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="sold">Sold</TabsTrigger>
              <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              {categories && Array.from(categories).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={currentFilter} className="mt-0 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtworks?.map((artwork, index) => (
                  <Card key={artwork.id} className="overflow-hidden">
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={artwork.imageUrl} 
                        alt={artwork.title} 
                        className="object-cover w-full h-full"
                      />
                      
                      {artwork.featured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-[#b8860b]">Featured</Badge>
                        </div>
                      )}

                      {!artwork.available && artwork.status === 'sold' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white py-1 text-center font-bold">
                          SOLD
                        </div>
                      )}
                      {artwork.status === 'unavailable' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-600 text-white py-1 text-center font-bold">
                          UNAVAILABLE
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium">{artwork.title}</h3>
                          <p className="text-sm text-neutral-600">{artwork.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                        </div>
                        <div className="text-xl font-medium">
                          ${artwork.price}
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        {reorderMode ? (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => moveArtwork(index, 'top')}
                              disabled={index === 0}
                              title="Move to top of list"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 11l-5-5-5 5"/><path d="M17 18l-5-5-5 5"/></svg>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => moveArtwork(index, 'up')}
                              disabled={index === 0}
                              title="Move up one position"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => moveArtwork(index, 'down')}
                              disabled={index === filteredArtworks.length - 1}
                              title="Move down one position"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => moveArtwork(index, 'bottom')}
                              disabled={index === filteredArtworks.length - 1}
                              title="Move to bottom of list"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7l-5 5-5-5"/><path d="M17 14l-5 5-5-5"/></svg>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label={`Edit ${artwork.title}`}
                              title={`Edit ${artwork.title}`}
                              onClick={() => navigate(`/admin/edit/${artwork.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600"
                              aria-label={`Delete ${artwork.title}`}
                              title={`Delete ${artwork.title}`}
                              onClick={() => {
                                setArtworkToDelete(artwork);
                                setDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredArtworks?.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                  <p className="text-neutral-600 mb-4">No artworks found matching the current filter.</p>
                  <Button onClick={() => setCurrentFilter('all')}>
                    View All Artworks
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{artworkToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteArtwork}
              disabled={deleteArtworkMutation.isPending}
            >
              {deleteArtworkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}