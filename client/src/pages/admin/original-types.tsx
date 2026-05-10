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
import type { OriginalType } from "@shared/schema";

interface EditingType {
  id?: number;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

export default function OriginalTypes() {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newType, setNewType] = useState<EditingType>({
    name: "",
    description: "",
    displayOrder: 0,
    active: true,
  });

  // Fetch original types
  const { data: originalTypes, isLoading } = useQuery<OriginalType[]>({
    queryKey: ["/api/original-types"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<OriginalType>) =>
      apiRequest("POST", "/api/original-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/original-types"] });
      setIsAdding(false);
      setNewType({ name: "", description: "", displayOrder: 0, active: true });
      toast({
        title: "Success",
        description: "Original type created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create original type",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<OriginalType>) =>
      apiRequest("PUT", `/api/original-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/original-types"] });
      setEditingId(null);
      toast({
        title: "Success",
        description: "Original type updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update original type",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/original-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/original-types"] });
      toast({
        title: "Success",
        description: "Original type deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete original type",
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

    const maxOrder = Math.max(0, ...(originalTypes?.map(t => t.displayOrder || 0) || [0]));
    createMutation.mutate({
      ...newType,
      displayOrder: maxOrder + 1,
    });
  };

  const handleUpdate = (type: OriginalType) => {
    updateMutation.mutate(type);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this original type?")) {
      deleteMutation.mutate(id);
    }
  };

  const startEditing = (type: OriginalType) => {
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
          <h1 className="text-3xl font-bold">Original Types</h1>
          <p className="text-gray-600 mt-2">
            Manage subcategories for original artwork products. These will appear as filter options in the shop.
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
            <CardTitle>Add New Original Type</CardTitle>
            <CardDescription>
              Create a new subcategory for original artwork products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="e.g., Paintings, Sculptures, Drawings"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Optional description for this original type"
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
        {originalTypes?.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((type) => (
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

      {originalTypes?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No original types found. Add one to get started!</p>
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
  type: OriginalType; 
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
  type: OriginalType; 
  onSave: (type: OriginalType) => void; 
  onCancel: () => void;
  isUpdating: boolean;
}) {
  const [editData, setEditData] = useState<OriginalType>(type);

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