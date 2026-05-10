import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Textarea import removed as unused
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Eye, Calendar, User, DollarSign, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { navigateBackToDashboard } from "@/lib/navigation-utils";
import { format } from "date-fns";

export default function CommissionRequests() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch commission requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/commission/requests'],
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await apiRequest('PUT', `/api/admin/commission/requests/${id}/status`, { status, notes });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Commission request status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission/requests'] });
      setIsDetailDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      reviewed: { variant: "outline" as const, label: "Reviewed" },
      accepted: { variant: "default" as const, label: "Accepted" },
      declined: { variant: "destructive" as const, label: "Declined" },
      completed: { variant: "default" as const, label: "Completed" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const filteredRequests = Array.isArray(requests) 
    ? requests.filter((request: any) => 
        statusFilter === 'all' || request.status === statusFilter
      ) 
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigateBackToDashboard(navigate)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-serif">Commission Requests</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-600">Loading commission requests...</p>
            </CardContent>
          </Card>
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
            onClick={() => navigateBackToDashboard(navigate)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-serif">Commission Requests</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Commission Requests</CardTitle>
            <CardDescription>
              Manage incoming commission inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'reviewed', 'accepted', 'declined', 'completed'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Requests Grid */}
              <div className="space-y-4">
                {filteredRequests.map((request: any) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-semibold">{request.customerName}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{request.customerEmail}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(request.createdAt), 'PPP')}</span>
                            </div>
                            
                            {request.estimatedPrice && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span>Estimated: ${request.estimatedPrice.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-gray-700 line-clamp-2">
                              {request.message}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredRequests.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {statusFilter === 'all' ? 'No commission requests yet' : `No ${statusFilter} requests`}
                      </h3>
                      <p className="text-gray-500">
                        {statusFilter === 'all' 
                          ? 'Commission requests will appear here when customers submit them'
                          : `No requests with ${statusFilter} status found`
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Commission Request Details</DialogTitle>
              <DialogDescription>
                Review and manage this commission request
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Customer</Label>
                    <p className="mt-1">{selectedRequest.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="mt-1">{selectedRequest.customerEmail}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Type</Label>
                    <p className="mt-1 capitalize">{selectedRequest.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Dimensions</Label>
                    <p className="mt-1">{selectedRequest.width}" × {selectedRequest.height}"</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estimated Price</Label>
                    <p className="mt-1">
                      {selectedRequest.estimatedPrice ? `$${selectedRequest.estimatedPrice.toFixed(2)}` : 'Not calculated'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Message</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedRequest.message}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: selectedRequest.id, status: 'reviewed' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Reviewed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: selectedRequest.id, status: 'accepted' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: selectedRequest.id, status: 'declined' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: selectedRequest.id, status: 'completed' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Mark Completed
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}