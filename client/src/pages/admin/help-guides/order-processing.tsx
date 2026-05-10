import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Package, 
  TruckIcon,
  Clipboard, 
  Check,
  Bell,
  DollarSign,
  AlertCircle,
  ClipboardCheck
} from "lucide-react";

export default function OrderProcessingGuide() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => navigate("/admin/help-support")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Help Center
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order Processing Workflow</h1>
        <p className="text-gray-500">
          Learn how to process, fulfill, and track customer orders effectively
        </p>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="lead">
          Efficiently managing orders is critical to running your art business. This guide walks you through 
          the complete order management process from receiving a new order to fulfillment and follow-up.
        </p>
        
        <h2>Understanding the Order Dashboard</h2>
        <p>
          The Orders section in your admin dashboard provides a comprehensive view of all customer orders. 
          Here you can track, process, and update orders throughout their lifecycle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Order Management</h4>
            </div>
            <p className="text-sm text-gray-600">
              View all orders, filter by status, search by customer name or order number, and perform bulk actions.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Sales Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">
              View sales trends, revenue reports, and popular products to make data-driven business decisions.
            </p>
          </div>
        </div>
        
        <h2>Order Processing Workflow</h2>
        
        <h3>Step 1: Receiving New Orders</h3>
        <p>
          When a customer places an order, you'll receive a notification and the order will appear in your dashboard.
        </p>
        <ul>
          <li>New orders are marked with "New Order" status</li>
          <li>You'll receive an email notification (if enabled in your settings)</li>
          <li>The dashboard shows a count of new unprocessed orders</li>
        </ul>
        
        <h3>Step 2: Reviewing Order Details</h3>
        <p>
          Click on an order to view all its details:
        </p>
        <ul>
          <li>Customer information (name, email, shipping address)</li>
          <li>Purchased products and quantities</li>
          <li>Payment information and status</li>
          <li>Shipping method selected</li>
          <li>Special instructions from the customer (if any)</li>
        </ul>
        
        <h3>Step 3: Processing Payment</h3>
        <p>
          Verify the payment status for the order:
        </p>
        <ul>
          <li>Most payments through Stripe are processed automatically</li>
          <li>Check for payment confirmation in the order details</li>
          <li>For manual payment methods, mark as "Paid" once payment is received</li>
        </ul>
        
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-amber-800 font-medium text-sm">Payment Verification</h3>
              <p className="text-amber-700 text-sm">
                Always verify that payment is complete before fulfilling an order. You can check payment status 
                in your Stripe dashboard or in the payment details section of the order.
              </p>
            </div>
          </div>
        </div>
        
        <h3>Step 4: Order Fulfillment</h3>
        <p>
          The fulfillment process varies depending on the product type:
        </p>
        
        <div className="space-y-4 my-6">
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Original Artwork</h4>
            <p className="text-gray-600 text-sm">
              Prepare the artwork for shipping, ensuring proper packaging to protect it during transit. 
              Update the order status to "Processing" while preparing the shipment.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Print-on-Demand Products</h4>
            <p className="text-gray-600 text-sm">
              Orders for Printful products are automatically sent to Printful for fulfillment. 
              You can track the production and shipping status in both your dashboard and your Printful account.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Limited Edition Prints</h4>
            <p className="text-gray-600 text-sm">
              For prints you fulfill yourself, prepare the print, sign if applicable, and package securely.
              The system will automatically update inventory to reflect the sold edition number.
            </p>
          </div>
        </div>
        
        <h3>Step 5: Shipping and Tracking</h3>
        <p>
          Once the order is ready to ship:
        </p>
        <ol>
          <li>Generate a shipping label through your preferred carrier</li>
          <li>Enter the tracking number in the order details page</li>
          <li>Update the order status to "Shipped"</li>
          <li>The customer will automatically receive a shipping notification with tracking information</li>
        </ol>
        
        <div className="bg-gray-50 p-4 rounded-lg border my-6">
          <div className="flex items-center mb-2">
            <ClipboardCheck className="h-5 w-5 text-primary mr-2" />
            <h4 className="font-medium">Shipping Tips</h4>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>Take photos of packed artwork before shipping as documentation</li>
            <li>Always use tracking for all shipments</li>
            <li>Consider shipping insurance for high-value original artwork</li>
            <li>Use appropriate packaging materials for different product types</li>
          </ul>
        </div>
        
        <h3>Step 6: Order Completion</h3>
        <p>
          After the order has been delivered:
        </p>
        <ul>
          <li>The system will automatically update the order to "Delivered" based on tracking information</li>
          <li>You can manually mark an order as "Completed" once you confirm delivery</li>
          <li>Send a follow-up email thanking the customer for their purchase (automated or manual)</li>
          <li>Request a review or feedback if appropriate</li>
        </ul>
        
        <h2>Managing Special Scenarios</h2>
        
        <h3>Handling Order Modifications</h3>
        <p>
          If a customer requests changes to their order:
        </p>
        <ol>
          <li>Navigate to the order in your dashboard</li>
          <li>Click "Edit Order" to modify products, quantities, or shipping details</li>
          <li>If the price changes, you can issue a partial refund or send a payment link for additional charges</li>
          <li>Add notes to the order documenting the changes requested</li>
        </ol>
        
        <h3>Processing Refunds</h3>
        <p>
          To issue a refund:
        </p>
        <ol>
          <li>Open the order details</li>
          <li>Click the "Refund" button</li>
          <li>Enter the refund amount (full or partial)</li>
          <li>Provide a reason for the refund</li>
          <li>The system will process the refund through the original payment method</li>
          <li>Update the order status accordingly (e.g., "Refunded" or "Partially Refunded")</li>
        </ol>
        
        <h3>Managing Inventory Updates</h3>
        <p>
          Inventory is managed automatically:
        </p>
        <ul>
          <li>Original artwork is marked as sold once purchased</li>
          <li>Limited editions track available numbers</li>
          <li>Print-on-demand products don't require inventory management</li>
        </ul>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 my-8">
          <h3 className="text-blue-800 font-medium">Need Additional Help?</h3>
          <p className="text-blue-700 mb-4">
            If you need personalized assistance with order processing, don't hesitate to contact our support team.
          </p>
          <Button 
            variant="outline" 
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => navigate("/admin/help-support")}
          >
            Return to Help Center
          </Button>
        </div>
      </div>
    </div>
  );
}