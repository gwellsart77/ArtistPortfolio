import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  Send,
  Truck,
  User,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetails() {
  const [, params] = useRoute("/admin/orders/:id");
  const [location, navigate] = useLocation();
  const orderId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/admin/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Fetch order items
  const { data: orderItems, isLoading: itemsLoading } = useQuery({
    queryKey: [`/api/admin/orders/${orderId}/items`],
    enabled: !!orderId,
  });

  // Update order status mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return await apiRequest("PUT", `/api/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Status updated",
        description: "Order status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: "There was an error updating the order status",
        variant: "destructive",
      });
    },
  });

  // Update order notes mutation
  const notesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/admin/orders/${orderId}/notes`, {
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
      toast({
        title: "Notes updated",
        description: "Order notes have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating notes",
        description: "There was an error updating the order notes",
        variant: "destructive",
      });
    },
  });

  // Update tracking number mutation
  const trackingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/admin/orders/${orderId}/tracking`, {
        trackingNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      toast({
        title: "Tracking updated",
        description: "Tracking number has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating tracking",
        description: "There was an error updating the tracking number",
        variant: "destructive",
      });
    },
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/admin/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      // Force refetch the order data to show updated status
      queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.refetchQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      toast({
        title: "Order cancelled",
        description: "Order has been cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error cancelling order",
        description: error?.message || "There was an error cancelling the order",
        variant: "destructive",
      });
    },
  });

  // Refund order mutation
  const refundMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount?: number; reason?: string }) => {
      return await apiRequest("POST", `/api/admin/orders/${orderId}/refund`, {
        amount,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Refund processed",
        description: "Refund has been processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error processing refund",
        description: error?.message || "There was an error processing the refund",
        variant: "destructive",
      });
    },
  });

  // Send order confirmation email mutation
  const emailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/orders/${orderId}/send-email`, {
        type: "status_update",
      });
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Status update email has been sent to the customer",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending email",
        description: "There was an error sending the email",
        variant: "destructive",
      });
    },
  });

  // Initialize state with order data when it loads
  useState(() => {
    if (order) {
      setNotes(order.notes || "");
      setTrackingNumber(order.trackingNumber || "");
      setOrderStatus(order.status || "");
    }
  });

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setOrderStatus(newStatus);
    statusMutation.mutate(newStatus);
  };

  // Get status badge variant based on order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Shipped</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Generate invoice
  const generateInvoice = async () => {
    if (!order || !orderItems) {
      toast({
        title: "Error",
        description: "Order data not available",
        variant: "destructive",
      });
      return;
    }

    // Fetch invoice settings
    let invoiceSettings;
    try {
      const response = await fetch("/api/admin/invoice-settings");
      invoiceSettings = await response.json();
    } catch (error) {
      // Use default settings if fetch fails
      invoiceSettings = {
        companyName: "Gabe Wells Art",
        companyTagline: "Artist & Creative Professional",
        companyEmail: "gwellsart@gmail.com",
        companyAddress: "",
        companyPhone: "",
        footerMessage: "Thank you for your business!",
        invoiceTitle: "Invoice Details",
        itemsTitle: "Order Items",
      };
    }

    // Create invoice HTML content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-title { font-size: 28px; font-weight: bold; color: #333; }
          .invoice-number { font-size: 16px; color: #666; margin-top: 5px; }
          .company-info { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .customer-info { display: flex; justify-content: space-between; }
          .info-block { width: 45%; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; }
          .total-section { text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">Invoice #${order.id}</div>
        </div>

        <div class="company-info">
          <strong>${invoiceSettings.companyName}</strong><br>
          ${invoiceSettings.companyTagline ? `${invoiceSettings.companyTagline}<br>` : ''}
          ${invoiceSettings.companyEmail}<br>
          ${invoiceSettings.companyPhone ? `${invoiceSettings.companyPhone}<br>` : ''}
          ${invoiceSettings.companyAddress ? `<div style="margin-top: 10px; white-space: pre-line;">${invoiceSettings.companyAddress}</div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">${invoiceSettings.invoiceTitle}</div>
          <div class="customer-info">
            <div class="info-block">
              <strong>Bill To:</strong><br>
              ${order.customerName}<br>
              ${order.customerEmail}<br>
              ${order.phone || ''}<br>
              ${order.billingAddress}
            </div>
            <div class="info-block">
              <strong>Invoice Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
              <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
              <strong>Status:</strong> ${order.status}<br>
              ${order.shippingAddress ? `<strong>Ship To:</strong><br>${order.shippingAddress}` : ''}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${invoiceSettings.itemsTitle}</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.itemType}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${(item.unitPrice * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Shipping:</span>
            <span>$${((order.shippingAmount || 0) / 100).toFixed(2)}</span>
          </div>
          <div class="total-row final-total">
            <span>Total:</span>
            <span>$${(orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) + ((order.shippingAmount || 0) / 100)).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          ${invoiceSettings.footerMessage}<br>
          This invoice was generated on ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    // Create and download the invoice
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Invoice Generated",
      description: `Invoice #${order.id} has been downloaded to your computer`,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/orders")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => navigate("/admin/dashboard")}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif">
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <>Order #{orderId}</>
            )}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-5 w-60 mt-1" />
            ) : (
              <>Created on {formatDate(order?.createdAt)}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={generateInvoice}
            disabled={isLoading}
          >
            <FileText className="mr-2 h-4 w-4" />
            Invoice
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{order?.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order?.customerEmail}</p>
                </div>
              </div>
              
              {order?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm">{order?.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Shipping Address</p>
                  <p className="text-sm whitespace-pre-line">{order?.shippingAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Billing Address</p>
                  <p className="text-sm whitespace-pre-line">{order?.billingAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Current Status:</p>
                {order?.status ? getStatusBadge(order.status) : (
                  <Badge variant="outline">Unknown</Badge>
                )}
              </div>
              
              <div>
                <p className="font-medium mb-2">Tracking Number:</p>
                <div className="flex gap-2">
                  <Input 
                    value={trackingNumber} 
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => trackingMutation.mutate()}
                    disabled={trackingMutation.isPending}
                  >
                    {trackingMutation.isPending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {order?.orderType === "digital" && (
                <div>
                  <p className="font-medium mb-2">Download Code:</p>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <code className="text-sm">{order?.downloadCode}</code>
                    <Badge variant="outline" className="ml-auto">
                      {order?.downloadCount || 0} downloads
                    </Badge>
                  </div>
                </div>
              )}
              
              <div>
                <p className="font-medium mb-2">Order Type:</p>
                <div className="flex items-center gap-2">
                  {order?.orderType === "digital" ? (
                    <Download className="h-4 w-4 text-purple-500" />
                  ) : order?.orderType === "print-on-demand" ? (
                    <Truck className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Package className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="capitalize">{order?.orderType}</span>
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Order Timeline:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(order?.createdAt)}</span>
                  </div>
                  {order?.updatedAt !== order?.createdAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Updated:</span>
                      <span>{formatDate(order?.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Actions */}
              <div className="pt-4 border-t">
                <p className="font-medium mb-3">Order Actions:</p>
                <div className="space-y-2">
                  {/* Cancel Order Button */}
                  {order?.status !== 'cancelled' && order?.status !== 'completed' && order?.status !== 'refunded' && (
                    <Button 
                      variant="outline" 
                      className="w-full border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel order #${order?.id}? This action cannot be undone.`)) {
                          cancelMutation.mutate();
                        }
                      }}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Cancelling...
                        </div>
                      ) : (
                        'Cancel Order'
                      )}
                    </Button>
                  )}

                  {/* Refund Order Button */}
                  {(order?.status === 'completed' || order?.status === 'shipped' || order?.paymentIntentId) && order?.status !== 'refunded' && (
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        const reason = prompt('Enter refund reason (optional):') || 'Admin refund';
                        if (confirm(`Are you sure you want to refund order #${order?.id}? Amount: ${formatCurrency(order?.totalAmount || 0, true)}`)) {
                          refundMutation.mutate({ reason });
                        }
                      }}
                      disabled={refundMutation.isPending}
                    >
                      {refundMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Processing Refund...
                        </div>
                      ) : (
                        `Refund ${formatCurrency(order?.totalAmount || 0, true)}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
              <CardDescription>
                Internal notes about this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order..."
                rows={8}
              />
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto" 
                onClick={() => notesMutation.mutate()}
                disabled={notesMutation.isPending}
              >
                {notesMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Order Items */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Products included in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orderItems && orderItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.title} 
                                className="h-12 w-12 object-cover rounded"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{item.title}</p>
                              {item.editionNumber && (
                                <p className="text-sm text-muted-foreground">
                                  Edition {item.editionNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.itemType ? item.itemType.replace("_", " ") : "Physical"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No items found for this order.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex-col items-end">
              <Separator className="mb-4" />
              <div className="space-y-1.5 w-full max-w-[200px]">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(
                    orderItems?.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0) || 0
                  )}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order?.shippingAmount / 100)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(
                    (orderItems?.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0) || 0) + 
                    (order?.shippingAmount / 100 || 0)
                  )}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}