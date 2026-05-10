import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Mail, Package, CreditCard, MapPin } from 'lucide-react';

export default function OrderConfirmation() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Extract order ID and payment intent from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const paymentIntentId = params.get('payment_intent');
    const orderId = params.get('order_id');
    
    if (paymentStatus === 'succeeded') {
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully!",
      });
      
      // Fetch order details if we have an order ID
      if (orderId) {
        fetchOrderDetails(orderId);
      }
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: "There was an issue with your payment. Please try again.",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const order = await response.json();
        setOrderDetails(order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 text-green-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Thank You For Your Order!</h1>
            <p className="text-gray-600 mb-6">
              We've received your order and are processing it now. You'll receive a confirmation email shortly.
            </p>
            
            {orderDetails && (
              <div className="inline-flex items-center bg-gray-50 px-4 py-2 rounded-lg">
                <Package className="h-5 w-5 mr-2 text-gray-600" />
                <span className="font-medium">Order #{orderDetails.id}</span>
              </div>
            )}
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Order Summary
                </h2>
                
                <div className="space-y-4">
                  {orderDetails.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.productTitle || item.artworkTitle}</p>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                        {item.editionNumber && (
                          <p className="text-gray-600 text-sm">Edition #{item.editionNumber}</p>
                        )}
                      </div>
                      <p className="font-medium">${item.unitPrice}</p>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total</span>
                    <span>${orderDetails.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Information
                </h2>
                
                <div className="space-y-2">
                  <p className="font-medium">{orderDetails.shippingName}</p>
                  <p className="text-gray-600">{orderDetails.shippingStreet}</p>
                  <p className="text-gray-600">
                    {orderDetails.shippingCity}, {orderDetails.shippingState} {orderDetails.shippingZip}
                  </p>
                  <p className="text-gray-600">{orderDetails.shippingCountry}</p>
                </div>
                
                {orderDetails.email && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{orderDetails.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* What Happens Next */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">What happens next?</h2>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3">1</span>
                <div>
                  <p className="font-medium">Order Processing</p>
                  <p className="text-gray-600">We'll begin processing your order immediately and send you a confirmation email.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3">2</span>
                <div>
                  <p className="font-medium">Order Shipped</p>
                  <p className="text-gray-600">You'll receive a notification with tracking information when your order ships.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3">3</span>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-gray-600">Your items will be carefully packaged and delivered to your door.</p>
                </div>
              </li>
            </ol>
          </div>
          
          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
              <Button asChild variant="outline" className="md:flex-1">
                <a href="/shop">Continue Shopping</a>
              </Button>
              <Button asChild className="md:flex-1">
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}