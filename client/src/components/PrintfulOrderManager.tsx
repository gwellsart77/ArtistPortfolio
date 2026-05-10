import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, AlertCircle, CheckCircle, Send, Truck } from "lucide-react";

export function PrintfulOrderManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get pending orders count for the indicator (both services)
  const { data: pendingCount } = useQuery<{count: number; printful: number; gooten: number}>({
    queryKey: ['/api/admin/pending-orders-count'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get detailed pending orders when needed
  const { data: pendingOrders, refetch } = useQuery({
    queryKey: ['/api/admin/pending-orders'],
    enabled: false, // Only fetch when manually triggered
  });

  const sendToPrintfulMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest('POST', '/api/admin/send-to-printful', { orderId });
    },
    onSuccess: () => {
      toast({
        title: "Order Sent Successfully",
        description: "The order has been sent to Printful for fulfillment.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-orders-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Order",
        description: error.message || "Failed to send order to Printful.",
        variant: "destructive",
      });
    },
  });

  const sendToGootenMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest('POST', '/api/admin/send-to-gooten', { orderId });
    },
    onSuccess: () => {
      toast({
        title: "Order Sent Successfully",
        description: "The order has been sent to Gooten for fulfillment.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-orders-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Order",
        description: error.message || "Failed to send order to Gooten.",
        variant: "destructive",
      });
    },
  });

  const handleViewPendingOrders = () => {
    refetch();
  };

  const handleSendToPrintful = (orderId: number) => {
    sendToPrintfulMutation.mutate(orderId);
  };

  const handleSendToGooten = (orderId: number) => {
    sendToGootenMutation.mutate(orderId);
  };

  const hasPendingOrders = pendingCount && pendingCount.count > 0;
  const hasPrintfulOrders = pendingCount && pendingCount.printful > 0;
  const hasGootenOrders = pendingCount && pendingCount.gooten > 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Print-on-Demand Order Processing
        </CardTitle>
        <CardDescription>
          Monitor and manually process orders for Printful and Gooten services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={handleViewPendingOrders}
            variant={hasPendingOrders ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {hasPendingOrders ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {hasPendingOrders ? 
              `${pendingCount?.count || 0} Order${(pendingCount?.count || 0) !== 1 ? 's' : ''} Pending` : 
              'No Pending Orders'
            }
          </Button>

          {hasPendingOrders && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Requires Attention
              </Badge>
              {hasPrintfulOrders && (
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  Printful: {pendingCount?.printful || 0}
                </Badge>
              )}
              {hasGootenOrders && (
                <Badge variant="outline" className="border-green-300 text-green-800">
                  Gooten: {pendingCount?.gooten || 0}
                </Badge>
              )}
            </div>
          )}
        </div>

        {pendingOrders && (hasPrintfulOrders || hasGootenOrders) && (
          <div>
          <Tabs defaultValue="printful" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="printful" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Printful ({(pendingOrders as any).printful?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="gooten" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Gooten ({(pendingOrders as any).gooten?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="printful" className="space-y-3">
              {(pendingOrders as any).printful?.length > 0 ? (
                (pendingOrders as any).printful.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customerName} - ${(order.totalAmount / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSendToPrintful(order.id)}
                      disabled={sendToPrintfulMutation.isPending}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Send className="h-3 w-3" />
                      Send to Printful
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No pending Printful orders</p>
              )}
            </TabsContent>
            
            <TabsContent value="gooten" className="space-y-3">
              {(pendingOrders as any).gooten?.length > 0 ? (
                (pendingOrders as any).gooten.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customerName} - ${(order.totalAmount / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSendToGooten(order.id)}
                      disabled={sendToGootenMutation.isPending}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Send className="h-3 w-3" />
                      Send to Gooten
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No pending Gooten orders</p>
              )}
            </TabsContent>
          </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}