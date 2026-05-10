import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Artwork } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';

import { CreditCard, ArrowLeft, Package } from 'lucide-react';

// Make sure to call loadStripe outside of a component's render
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  throw new Error('Missing required environment variable: VITE_STRIPE_PUBLIC_KEY');
}

if (stripePublicKey && !stripePublicKey.startsWith('pk_')) {
  throw new Error(`CRITICAL: VITE_STRIPE_PUBLIC_KEY must be a publishable key (starts with pk_), but got: ${stripePublicKey?.substring(0, 7)}`);
}

const stripePromise = loadStripe(stripePublicKey);

// Form schema for checkout with conditional validation
const createCheckoutFormSchema = (deliveryMethod: string, billingSameAsShipping: boolean) => z.object({
  customerName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  customerEmail: z.string().email({ message: "Please enter a valid email address" }),
  deliveryMethod: z.enum(['ship', 'pickup'], { message: "Please select a delivery method" }),
  
  // Shipping address fields - required only if delivery method is 'ship'
  shippingStreetAddress: deliveryMethod === 'ship' 
    ? z.string().min(3, { message: "Street address is required" })
    : z.string().optional(),
  shippingApartment: z.string().optional(),
  shippingCity: deliveryMethod === 'ship'
    ? z.string().min(2, { message: "City is required" })
    : z.string().optional(),
  shippingState: deliveryMethod === 'ship'
    ? z.string().min(1, { message: "State is required" })
    : z.string().optional(),
  shippingZipCode: deliveryMethod === 'ship'
    ? z.string().min(5, { message: "ZIP code is required" })
    : z.string().optional(),
  shippingCountry: deliveryMethod === 'ship'
    ? z.string().min(2, { message: "Country is required" })
    : z.string().optional(),
  phone: z.string().optional(),
  
  // Billing same as shipping checkbox
  billingSameAsShipping: z.boolean().default(true),
  
  // Billing address fields - required only if delivery method is 'ship' AND billing is different from shipping
  billingStreetAddress: (deliveryMethod === 'ship' && !billingSameAsShipping)
    ? z.string().min(3, { message: "Billing street address is required" })
    : z.string().optional(),
  billingApartment: z.string().optional(),
  billingCity: (deliveryMethod === 'ship' && !billingSameAsShipping)
    ? z.string().min(2, { message: "Billing city is required" })
    : z.string().optional(),
  billingState: (deliveryMethod === 'ship' && !billingSameAsShipping)
    ? z.string().min(1, { message: "Billing state is required" })
    : z.string().optional(),
  billingZipCode: (deliveryMethod === 'ship' && !billingSameAsShipping)
    ? z.string().min(5, { message: "Billing ZIP code is required" })
    : z.string().optional(),
  billingCountry: (deliveryMethod === 'ship' && !billingSameAsShipping)
    ? z.string().min(2, { message: "Billing country is required" })
    : z.string().optional(),
  
  // Local pickup arrangement message
  pickupMessage: deliveryMethod === 'pickup'
    ? z.string().min(10, { message: "Please provide pickup arrangement details (at least 10 characters)" })
    : z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutFormSchema>>;

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

// Stripe Payment Form
const PaymentForm = ({ 
  processingOrder, 
  onPaymentSuccess,
  onBackToForm 
}: { 
  clientSecret: string; 
  processingOrder: any;
  onPaymentSuccess: () => void;
  onBackToForm: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        toast({
          title: "Payment Successful",
          description: "Thank you for your order!",
        });
        onPaymentSuccess();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          Complete your order by providing payment details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBackToForm}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <Button 
              type="submit" 
              disabled={!stripe || !elements || isLoading}
              className="flex-1"
            >
              {isLoading ? "Processing..." : `Complete Payment ${formatCurrency(processingOrder?.total || 0)}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Main checkout form component
interface CheckoutFormProps {
  purchaseType: 'original' | 'print' | 'digital';
  artwork?: Artwork;
  items?: Array<{ id: number; title: string; price: number; quantity: number; type: string; }>;
  onSuccess: () => void;
}

export default function CheckoutForm({ purchaseType, artwork, items, onSuccess }: CheckoutFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment'>('form');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [processingOrder, setProcessingOrder] = useState<any>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(createCheckoutFormSchema('ship', true)),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      deliveryMethod: 'ship',
      shippingStreetAddress: '',
      shippingApartment: '',
      shippingCity: '',
      shippingState: '',
      shippingZipCode: '',
      shippingCountry: 'US',
      phone: '',
      billingSameAsShipping: true,
      billingStreetAddress: '',
      billingApartment: '',
      billingCity: '',
      billingState: '',
      billingZipCode: '',
      billingCountry: 'US',
      pickupMessage: '',
      notes: '',
    },
  });

  const deliveryMethod = form.watch("deliveryMethod");
  const billingSameAsShipping = form.watch("billingSameAsShipping");

  // Update schema when delivery method or billing preference changes
  useEffect(() => {
    form.clearErrors();
  }, [deliveryMethod, billingSameAsShipping, form]);

  // Auto-fill billing address when "billing same as shipping" is checked
  useEffect(() => {
    if (billingSameAsShipping && deliveryMethod === 'ship') {
      const shippingValues = form.getValues();
      form.setValue('billingStreetAddress', shippingValues.shippingStreetAddress || '');
      form.setValue('billingApartment', shippingValues.shippingApartment || '');
      form.setValue('billingCity', shippingValues.shippingCity || '');
      form.setValue('billingState', shippingValues.shippingState || '');
      form.setValue('billingZipCode', shippingValues.shippingZipCode || '');
      form.setValue('billingCountry', shippingValues.shippingCountry || '');
    }
  }, [billingSameAsShipping, form, deliveryMethod]);

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);
    
    try {
      // Automatically detect shipping zone from address (no user input needed)
      let shippingZoneId = '1'; // Default zone
      if (data.deliveryMethod === 'ship') {
        try {
          const zoneResponse = await apiRequest('POST', '/api/shipping-zones/detect', {
            address: {
              line1: data.shippingStreetAddress,
              line2: data.shippingApartment,
              city: data.shippingCity,
              state: data.shippingState,
              postalCode: data.shippingZipCode,
              country: data.shippingCountry
            }
          });
          if (zoneResponse.ok) {
            const zoneData = await zoneResponse.json();
            shippingZoneId = zoneData.zoneId.toString();
          }
        } catch (error) {
          console.warn('Could not detect shipping zone, using default');
        }
      }

      // Create order
      let orderResponse;
      
      if (purchaseType === 'original' && artwork) {
        // Original artwork purchase
        orderResponse = await apiRequest('POST', '/api/checkout/artwork', {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          artworkId: artwork.id,
          shippingZoneId: data.deliveryMethod === 'ship' ? shippingZoneId : undefined,
          address: data.deliveryMethod === 'ship' ? {
            line1: data.shippingStreetAddress,
            line2: data.shippingApartment,
            city: data.shippingCity,
            state: data.shippingState,
            postalCode: data.shippingZipCode,
            country: data.shippingCountry
          } : undefined,
          billingAddress: (!billingSameAsShipping && data.deliveryMethod === 'ship') ? {
            line1: data.billingStreetAddress,
            line2: data.billingApartment,
            city: data.billingCity,
            state: data.billingState,
            postalCode: data.billingZipCode,
            country: data.billingCountry
          } : undefined,
          deliveryMethod: data.deliveryMethod,
          pickupMessage: data.pickupMessage,
          notes: data.notes
        });
      } else {
        // Print/merchandise purchase
        orderResponse = await apiRequest('POST', '/api/checkout/products', {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          items: items || [],
          shippingZoneId: data.deliveryMethod === 'ship' ? shippingZoneId : undefined,
          address: data.deliveryMethod === 'ship' ? {
            line1: data.shippingStreetAddress,
            line2: data.shippingApartment,
            city: data.shippingCity,
            state: data.shippingState,
            postalCode: data.shippingZipCode,
            country: data.shippingCountry
          } : undefined,
          billingAddress: (!billingSameAsShipping && data.deliveryMethod === 'ship') ? {
            line1: data.billingStreetAddress,
            line2: data.billingApartment,
            city: data.billingCity,
            state: data.billingState,
            postalCode: data.billingZipCode,
            country: data.billingCountry
          } : undefined,
          deliveryMethod: data.deliveryMethod,
          pickupMessage: data.pickupMessage,
          notes: data.notes
        });
      }

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();
      setProcessingOrder(orderData);
      setClientSecret(orderData.clientSecret);
      setPaymentStep('payment');

    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Creation Failed",
        description: "There was a problem creating your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    onSuccess();
    navigate('/order-confirmation');
  };

  if (paymentStep === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm 
          clientSecret={clientSecret} 
          processingOrder={processingOrder} 
          onPaymentSuccess={handlePaymentSuccess}
          onBackToForm={() => setPaymentStep('form')}
        />
      </Elements>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Checkout Details
        </CardTitle>
        <CardDescription>
          Please provide your information to complete your order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Delivery Method Selection */}
            {purchaseType !== 'digital' && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4">Delivery Method</h3>
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id="ship"
                                value="ship"
                                checked={field.value === 'ship'}
                                onChange={() => field.onChange('ship')}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                              />
                              <label htmlFor="ship" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Ship to my address
                              </label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id="pickup"
                                value="pickup"
                                checked={field.value === 'pickup'}
                                onChange={() => field.onChange('pickup')}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                              />
                              <label htmlFor="pickup" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Local pickup (San Francisco Bay Area)
                              </label>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
              </>
            )}

            {/* Shipping Information */}
            {deliveryMethod === 'ship' && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4">Shipping Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shippingStreetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shippingApartment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apartment, suite, unit, etc. (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="shippingCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="shippingState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="shippingZipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />

                {/* Billing Same as Shipping */}
                <div>
                  <FormField
                    control={form.control}
                    name="billingSameAsShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
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
                </div>

                {/* Billing Information */}
                {!billingSameAsShipping && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-4">Billing Information</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="billingStreetAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Street Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
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
                                  <Input {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {US_STATES.map((state) => (
                                      <SelectItem key={state.value} value={state.value}>
                                        {state.label}
                                      </SelectItem>
                                    ))}
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
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <Separator />
              </>
            )}

            {/* Local Pickup Information */}
            {deliveryMethod === 'pickup' && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4">Pickup Arrangements</h3>
                  <FormField
                    control={form.control}
                    name="pickupMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide your preferred pickup time, location preferences, and any special instructions..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
              </>
            )}

            {/* Order Notes */}
            <div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special instructions or notes for your order..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/shop")}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Processing..." : "Continue to Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}