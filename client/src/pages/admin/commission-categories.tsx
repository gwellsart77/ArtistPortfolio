import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, FolderPlus, Palette } from "lucide-react";

export default function CommissionCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    isMainCategory: true,
    parentCategoryId: null as number | null,
    acceptingCommissions: true,
    displayOrder: 0,
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/commission/categories'],
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/admin/commission/categories', data);
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Created",
        description: "Commission category created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission/categories'] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await apiRequest('PUT', `/api/admin/commission/categories/${id}`, data);
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "Commission category updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission/categories'] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/commission/categories/${id}`);
      if (!response.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "Commission category deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission/categories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      isMainCategory: true,
      parentCategoryId: null,
      acceptingCommissions: true,
      displayOrder: 0,
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      isMainCategory: category.isMainCategory,
      parentCategoryId: category.parentCategoryId,
      acceptingCommissions: category.acceptingCommissions,
      displayOrder: category.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const mainCategories = (categories as any[]).filter((cat: any) => cat.isMainCategory);
  const subcategories = (categories as any[]).filter((cat: any) => !cat.isMainCategory);

  const getSubcategoriesForCategory = (categoryId: number) => {
    return subcategories.filter((sub: any) => sub.parentCategoryId === categoryId);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commission Categories</h1>
          <p className="text-gray-600">Manage commission types and availability</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                Create or modify commission categories and subcategories
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Painting, Murals, Portraits"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-main-category"
                  checked={formData.isMainCategory}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isMainCategory: checked,
                    parentCategoryId: checked ? null : formData.parentCategoryId
                  })}
                />
                <Label htmlFor="is-main-category">Main Category</Label>
              </div>

              {!formData.isMainCategory && (
                <div>
                  <Label htmlFor="parent-category">Parent Category</Label>
                  <select
                    id="parent-category"
                    className="w-full p-2 border rounded-md"
                    value={formData.parentCategoryId || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      parentCategoryId: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    required={!formData.isMainCategory}
                  >
                    <option value="">Select parent category</option>
                    {mainCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="accepting-commissions"
                  checked={formData.acceptingCommissions}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptingCommissions: checked })}
                />
                <Label htmlFor="accepting-commissions">Accepting Commissions</Label>
              </div>

              <div>
                <Label htmlFor="display-order">Display Order</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {mainCategories.map((category: any) => {
          const subs = getSubcategoriesForCategory(category.id);
          
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {category.name}
                        {!category.acceptingCommissions && (
                          <Badge variant="secondary">Not accepting</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Main category • {subs.length} subcategories
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {subs.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">Subcategories:</h4>
                    <div className="grid gap-2">
                      {subs.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <FolderPlus className="w-4 h-4 text-gray-500" />
                            <span>{sub.name}</span>
                            {!sub.acceptingCommissions && (
                              <Badge variant="outline" className="text-xs">
                                Not accepting
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(sub)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCategoryMutation.mutate(sub.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
        
        {mainCategories.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first commission category to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}