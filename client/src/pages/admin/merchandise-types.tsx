import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MerchandiseType } from "@shared/schema";

interface EditingType {
  id?: number;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

export default function MerchandiseTypes() {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newType, setNewType] = useState<EditingType>({
    name: "",
    description: "",
    displayOrder: 0,
    active: true,
  });

  // Fetch merchandise types
  const { data: merchandiseTypes, isLoading } = useQuery<MerchandiseType[]>({
    queryKey: ["/api/merchandise-types"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<MerchandiseType>) =>
      apiRequest("POST", "/api/merchandise-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchandise-types"] });
      setIsAdding(false);
      setNewType({ name: "", description: "", displayOrder: 0, active: true });
      toast({
        title: "Success",
        description: "Merchandise type created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create merchandise type",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<MerchandiseType>) =>
      apiRequest("PUT", `/api/merchandise-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchandise-types"] });
      setEditingId(null);
      toast({
        title: "Success",
        description: "Merchandise type updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update merchandise type",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/merchandise-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchandise-types"] });
      toast({
        title: "Success",
        description: "Merchandise type deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete merchandise type",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newType.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    const maxOrder = Math.max(0, ...(merchandiseTypes?.map(t => t.displayOrder) || [0]));
    createMutation.mutate({
      ...newType,
      displayOrder: maxOrder + 1,
    });
  };

  const handleUpdate = (type: MerchandiseType) => {
    updateMutation.mutate(type);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this merchandise type?")) {
      deleteMutation.mutate(id);
    }
  };

  const startEditing = (type: MerchandiseType) => {
    setEditingId(type.id);
    setIsAdding(false);
  };

  const stopEditing = () => {
    setEditingId(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Merchandise Types</h1>
          <p className="text-gray-600 mt-2">
            Manage subcategories for merchandise products. These will appear as filter options in the shop.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Add New Type Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Merchandise Type</CardTitle>
            <CardDescription>
              Create a new subcategory for merchandise products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="e.g., Stickers, Hats, Buttons"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Optional description for this merchandise type"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Types */}
      <div className="space-y-4">
        {merchandiseTypes?.sort((a, b) => a.displayOrder - b.displayOrder).map((type) => (
          <Card key={type.id}>
            <CardContent className="p-4">
              {editingId === type.id ? (
                <EditTypeForm
                  type={type}
                  onSave={handleUpdate}
                  onCancel={stopEditing}
                  isUpdating={updateMutation.isPending}
                />
              ) : (
                <ViewTypeCard
                  type={type}
                  onEdit={() => startEditing(type)}
                  onDelete={() => handleDelete(type.id)}
                  isDeleting={deleteMutation.isPending}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {merchandiseTypes?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No merchandise types found. Add one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ViewTypeCard({ 
  type, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  type: MerchandiseType; 
  onEdit: () => void; 
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{type.name}</h3>
            <Badge variant={type.active ? "default" : "secondary"}>
              {type.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {type.description && (
            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function EditTypeForm({ 
  type, 
  onSave, 
  onCancel, 
  isUpdating 
}: { 
  type: MerchandiseType; 
  onSave: (type: MerchandiseType) => void; 
  onCancel: () => void;
  isUpdating: boolean;
}) {
  const [editData, setEditData] = useState<MerchandiseType>(type);

  const handleSave = () => {
    if (!editData.name.trim()) {
      return;
    }
    onSave(editData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Name *</Label>
        <Input
          id="edit-name"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={editData.description || ""}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="edit-active"
          checked={editData.active}
          onChange={(e) => setEditData({ ...editData, active: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="edit-active">Active</Label>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isUpdating}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}