import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { useCart } from '@/lib/cart';
import { apiRequest } from '@/lib/queryClient';
import { checkoutFormSchema, type ShippingZone } from '@shared/schema';
import { Clock } from 'lucide-react';

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

if (stripePublicKey && !stripePublicKey.startsWith('pk_')) {
  console.error('CRITICAL: VITE_STRIPE_PUBLIC_KEY must be a publishable key (starts with pk_), but got:', stripePublicKey?.substring(0, 7));
}

const stripePromise = stripePublicKey && stripePublicKey.startsWith('pk_')
  ? loadStripe(stripePublicKey) 
  : null;

// The main checkout form using Stripe Elements
function CheckoutForm({ clientSecret, orderId }: { clientSecret: string, orderId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { clearCart, subtotal } = useCart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-confirmation',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update the order with payment intent ID
        await apiRequest('PATCH', `/api/orders/${orderId}/payment`, {
          paymentIntentId: paymentIntent.id
        });
        
        // Clear the cart and redirect to confirmation page
        clearCart();
        toast({
          title: "Payment Successful",
          description: "Thank you for your order!",
        });
        navigate('/order-confirmation');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      toast({
        title: "Payment Error",
        description: "There was a problem processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const orderTotal = subtotal();
  const isUnderKlarnaMinimum = orderTotal < 35;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PaymentElement />
      
      {/* Klarna Requirements Notice */}
      {isUnderKlarnaMinimum && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Klarna Payment Requirements
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Klarna requires a minimum order of $35.00 for buy-now-pay-later options. 
                  Your current order total is ${orderTotal.toFixed(2)}.
                </p>
                <p className="mt-1">
                  You can still use credit/debit cards or other payment methods for any amount.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
}

// Initial customer information form before payment
function CustomerInfoForm({ onFormSubmit }: { onFormSubmit: (formData: any) => void }) {
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [isDetectingZone, setIsDetectingZone] = useState(false);
  const { toast } = useToast();
  const { items, subtotal, getTimeRemaining } = useCart();
  
  // Check if any items are original paintings with time limits
  const originalItems = items.filter(item => item.type === 'originals');
  
  const form = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      shippingStreetAddress: "",
      shippingApartment: "",
      shippingCity: "",
      shippingState: "",
      shippingZipCode: "",
      billingSameAsShipping: true,
      billingStreetAddress: "",
      billingApartment: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      phone: "",
      shippingZoneId: 0,
      notes: ""
    }
  });

  // Fetch shipping zones
  useEffect(() => {
    const fetchShippingZones = async () => {
      try {
        const response = await apiRequest('GET', '/api/shipping-zones/active');
        const data = await response.json();
        setShippingZones(data);
      } catch (error) {
        console.error('Error fetching shipping zones:', error);
        toast({
          title: "Error",
          description: "Could not load shipping options. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchShippingZones();
  }, [toast]);

  // Detect shipping zone based on address
  const detectShippingZone = async (address: string) => {
    if (!address || address.length < 10 || isDetectingZone) return;
    
    try {
      setIsDetectingZone(true);
      
      const response = await apiRequest('POST', '/api/shipping-zones/detect', { address });
      const data = await response.json();
      
      if (data.zoneId) {
        // Update form with detected zone
        form.setValue('shippingZoneId', data.zoneId);
        
        // Calculate shipping with detected zone
        calculateShipping(data.zoneId);
        
        // Show confirmation toast
        toast({
          title: "Shipping Zone Detected",
          description: `${data.zone.name} - ${data.zone.description}`,
        });
      }
    } catch (error) {
      console.error('Error detecting shipping zone:', error);
      // Silently fail - we don't want to bother the user if zone detection fails
    } finally {
      setIsDetectingZone(false);
    }
  };

  // Calculate shipping when zone changes or cart updates
  const calculateShipping = async (zoneId: number) => {
    if (!zoneId || items.length === 0) return;
    
    try {
      const response = await apiRequest('POST', '/api/shipping/estimate', {
        items: items.map(item => ({ id: item.id, quantity: item.quantity })),
        zoneId
      });
      
      const data = await response.json();
      setShippingCost(data.shippingCost);
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast({
        title: "Shipping Error",
        description: "Could not calculate shipping cost. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      // Create the order
      const orderResponse = await apiRequest('POST', '/api/orders', {
        ...formData,
        cartItems: items,
        subtotal: subtotal(),
        shippingCost
      });
      
      const orderData = await orderResponse.json();
      
      // Create a payment intent with Stripe
      const paymentResponse = await apiRequest('POST', '/api/create-payment-intent', {
        amount: subtotal() + shippingCost,
        metadata: {
          orderId: orderData.order.id
        }
      });
      
      const paymentData = await paymentResponse.json();
      
      // Pass the data to the parent component
      onFormSubmit({
        formData,
        clientSecret: paymentData.clientSecret,
        orderId: orderData.order.id
      });
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Order Error",
        description: "There was a problem creating your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="on">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Customer Information</h2>
          
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold">Shipping Address</legend>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="street-address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Street Address
              </label>
              <input
                id="street-address"
                name="street-address"
                type="text"
                autoComplete="street-address"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                defaultValue=""
              />
            </div>
            
            <div>
              <label htmlFor="address-line2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Apartment, suite, unit, etc. (optional)
              </label>
              <input
                id="address-line2"
                name="address-line2"
                type="text"
                autoComplete="address-line2"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                defaultValue=""
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address-level2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  City
                </label>
                <input
                  id="address-level2"
                  name="address-level2"
                  type="text"
                  autoComplete="address-level2"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  defaultValue=""
                />
              </div>
              
              <div>
                <label htmlFor="address-level1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  State
                </label>
                <input
                  id="address-level1"
                  name="address-level1"
                  type="text"
                  autoComplete="address-level1"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  defaultValue=""
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postal-code" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  ZIP Code
                </label>
                <input
                  id="postal-code"
                  name="postal-code"
                  type="text"
                  autoComplete="postal-code"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  defaultValue=""
                />
              </div>
              
              <div>
                <label htmlFor="country" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  autoComplete="country"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  defaultValue="United States"
                />
              </div>
            </div>
          </div>
        </fieldset>
        
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Billing Information</h2>
          
          <FormField
            control={form.control}
            name="billingSameAsShipping"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    My billing information is the same as my shipping information
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {!form.watch("billingSameAsShipping") && (
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="billingStreetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="address-line1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="billingApartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apartment, suite, unit, etc. (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="address-line2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="billingCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="address-level2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="billingState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger ref={field.ref} tabIndex={0}>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AL">Alabama</SelectItem>
                          <SelectItem value="AK">Alaska</SelectItem>
                          <SelectItem value="AZ">Arizona</SelectItem>
                          <SelectItem value="AR">Arkansas</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="CO">Colorado</SelectItem>
                          <SelectItem value="CT">Connecticut</SelectItem>
                          <SelectItem value="DE">Delaware</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="HI">Hawaii</SelectItem>
                          <SelectItem value="ID">Idaho</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="IA">Iowa</SelectItem>
                          <SelectItem value="KS">Kansas</SelectItem>
                          <SelectItem value="KY">Kentucky</SelectItem>
                          <SelectItem value="LA">Louisiana</SelectItem>
                          <SelectItem value="ME">Maine</SelectItem>
                          <SelectItem value="MD">Maryland</SelectItem>
                          <SelectItem value="MA">Massachusetts</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                          <SelectItem value="MN">Minnesota</SelectItem>
                          <SelectItem value="MS">Mississippi</SelectItem>
                          <SelectItem value="MO">Missouri</SelectItem>
                          <SelectItem value="MT">Montana</SelectItem>
                          <SelectItem value="NE">Nebraska</SelectItem>
                          <SelectItem value="NV">Nevada</SelectItem>
                          <SelectItem value="NH">New Hampshire</SelectItem>
                          <SelectItem value="NJ">New Jersey</SelectItem>
                          <SelectItem value="NM">New Mexico</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="ND">North Dakota</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="OK">Oklahoma</SelectItem>
                          <SelectItem value="OR">Oregon</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="RI">Rhode Island</SelectItem>
                          <SelectItem value="SC">South Carolina</SelectItem>
                          <SelectItem value="SD">South Dakota</SelectItem>
                          <SelectItem value="TN">Tennessee</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="UT">Utah</SelectItem>
                          <SelectItem value="VT">Vermont</SelectItem>
                          <SelectItem value="VA">Virginia</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                          <SelectItem value="WV">West Virginia</SelectItem>
                          <SelectItem value="WI">Wisconsin</SelectItem>
                          <SelectItem value="WY">Wyoming</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="billingZipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="postal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg bg-gray-50 p-3 shadow-sm">
          <h3 className="text-base font-medium">Order Summary</h3>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2">
              <span>Total:</span>
              <span>${(subtotal() + shippingCost).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Continue to Payment"}
        </Button>
      </form>
    </Form>
  );
}

// Empty cart notification
function EmptyCartNotice() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
      <p className="text-gray-600 mb-6">Add some items to your cart before proceeding to checkout.</p>
      <Button asChild>
        <a href="/shop">Continue Shopping</a>
      </Button>
    </div>
  );
}

// Main checkout page component
export default function Checkout() {
  const [step, setStep] = useState<'customerInfo' | 'payment'>('customerInfo');
  const [paymentInfo, setPaymentInfo] = useState<{
    clientSecret: string;
    orderId: number;
  } | null>(null);
  const { items, getTimeRemaining } = useCart();
  
  // Check if any items are original paintings with time limits
  const originalItems = items.filter(item => item.type === 'originals');
  
  // Function to handle form submission and move to payment step
  const handleCustomerInfoSubmit = (data: any) => {
    setPaymentInfo({
      clientSecret: data.clientSecret,
      orderId: data.orderId
    });
    setStep('payment');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {items.length === 0 ? (
        <EmptyCartNotice />
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
          {originalItems.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-md mb-8">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <Clock className="h-5 w-5 animate-pulse" />
                <span className="text-lg uppercase">Time Limited Purchase!</span>
              </div>
              <p className="mt-2 text-amber-700">
                Your cart contains original paintings with a <b>15-minute time limit</b>. Please complete your purchase 
                before the timer expires or the paintings will be removed from your cart.
              </p>
              
              <div className="mt-4 space-y-2">
                {originalItems.map(item => {
                  const timeRemaining = getTimeRemaining(item.id);
                  return timeRemaining !== null ? (
                    <div key={item.id} className="flex items-center justify-between bg-white px-4 py-2 rounded-md border border-amber-300">
                      <div className="font-medium">{item.title}</div>
                      <div className={`font-mono font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-amber-700'}`}>
                        {timeRemaining < 60 
                          ? <span className="animate-pulse">⚠️ {timeRemaining}s left!</span>
                          : <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
          
          <div className="flex justify-center mb-8">
            <div className="steps-container flex items-center w-full max-w-md">
              <div className={cn(
                "step-item flex-1 text-center",
                step === 'customerInfo' ? "font-bold" : ""
              )}>
                <div className={cn(
                  "step-circle mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300",
                  step === 'customerInfo' ? "bg-primary text-white" : "bg-white"
                )}>
                  1
                </div>
                <div className="step-title">Information</div>
              </div>
              
              <div className="step-divider flex-1 border-t border-gray-300 mx-4"></div>
              
              <div className={cn(
                "step-item flex-1 text-center",
                step === 'payment' ? "font-bold" : ""
              )}>
                <div className={cn(
                  "step-circle mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300",
                  step === 'payment' ? "bg-primary text-white" : "bg-white"
                )}>
                  2
                </div>
                <div className="step-title">Payment</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 max-w-3xl mx-auto">
            {step === 'customerInfo' && (
              <CustomerInfoForm onFormSubmit={handleCustomerInfoSubmit} />
            )}
            
            {step === 'payment' && paymentInfo?.clientSecret && stripePromise && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
                <Elements 
                  stripe={stripePromise} 
                  options={{ clientSecret: paymentInfo.clientSecret }}
                >
                  <CheckoutForm 
                    clientSecret={paymentInfo.clientSecret} 
                    orderId={paymentInfo.orderId} 
                  />
                </Elements>
                
                {/* Security information for checkout */}
                <div className="mt-8 border-t pt-6">
                  <div className="bg-gray-50 p-4 rounded-md text-sm">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h5 className="font-medium text-emerald-700">Secure Checkout Guaranteed</h5>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Your payment information is always protected. We use Stripe's secure payment processing with 256-bit SSL encryption and comply with PCI DSS standards to ensure your data is never compromised.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}