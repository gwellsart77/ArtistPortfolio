// Phase 3: Stripe Webhook Security Hardening
import type { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

// Stripe event deduplication table (in-memory for development)
const processedEvents = new Set<string>();

export interface StripeWebhookRequest extends Request {
  body: string; // Raw body for signature verification
}

export const handleStripeWebhook = async (req: StripeWebhookRequest, res: Response) => {
  const endpointSecret = await storage.getApiConfig('stripeWebhookSecret');
  
  if (!endpointSecret) {
    console.warn("Stripe webhook secret not configured");
    return res.status(400).send("Webhook secret not configured");
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.warn("Missing Stripe signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature  
    const stripeKey = await storage.getApiConfig('stripeSecretKey');
    if (!stripeKey) {
      return res.status(400).send("Stripe not configured");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-11-20.acacia" as any
    });
    
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    
    // Idempotency check - ignore duplicate events
    if (processedEvents.has(event.id)) {
      console.debug(`Ignoring duplicate Stripe event: ${event.id}`);
      return res.status(200).send("Event already processed");
    }
    
    // Mark event as processed
    processedEvents.add(event.id);
    
    // Log structured event info
    console.log(`Processing Stripe webhook: ${event.type} (${event.id})`);
    
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event);
      break;
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event);
      break;
    default:
      console.debug(`Unhandled Stripe event type: ${event.type}`);
  }

  res.status(200).send("Event processed");
};

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
  // Update order status logic would go here
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log(`Payment failed for intent: ${paymentIntent.id}`);
  // Update order status logic would go here
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  console.log(`Checkout completed for session: ${session.id}`);
  // Order fulfillment logic would go here
}