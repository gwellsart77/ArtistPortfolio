/**
 * Test Stripe integration with provided API credentials
 */

import Stripe from 'stripe';

async function testStripeConnection() {
  console.log('🔄 Testing Stripe connection with your API credentials...');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment');
    return;
  }

  if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
    console.error('❌ VITE_STRIPE_PUBLIC_KEY not found in environment');
    return;
  }

  try {
    // Initialize Stripe with your secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    console.log('✅ Stripe SDK initialized successfully');
    console.log('🔑 Using secret key:', process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...');
    console.log('🔑 Using public key:', process.env.VITE_STRIPE_PUBLIC_KEY.substring(0, 12) + '...');

    // Test API connection by retrieving account information
    console.log('🔄 Testing API connection...');
    const account = await stripe.accounts.retrieve();
    
    console.log('✅ Stripe API connection successful!');
    console.log('📊 Account Info:');
    console.log('  - Account ID:', account.id);
    console.log('  - Country:', account.country);
    console.log('  - Currency:', account.default_currency);
    console.log('  - Email:', account.email || 'Not provided');
    console.log('  - Type:', account.type);

    // Test creating a payment intent (small amount for testing)
    console.log('🔄 Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: 'usd',
      description: 'Test payment intent for API validation',
    });

    console.log('✅ Payment intent created successfully!');
    console.log('  - Payment Intent ID:', paymentIntent.id);
    console.log('  - Status:', paymentIntent.status);
    console.log('  - Amount:', paymentIntent.amount / 100, 'USD');

    console.log('🎉 Stripe integration test completed successfully!');
    console.log('🚀 Your Stripe API credentials are working perfectly!');

  } catch (error: any) {
    console.error('❌ Stripe API test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('🔐 Authentication failed - please verify your secret key');
    } else if (error.type === 'StripeAPIError') {
      console.error('🌐 Stripe API error:', error.code);
    } else {
      console.error('🔧 Technical error:', error.type);
    }
  }
}

// Run the test
testStripeConnection();