import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import "@/lib/emergency-cache-reset"; // Initialize emergency cache reset utilities
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { useGoogleAnalytics } from "./hooks/use-google-analytics";
// Removed unused import: initPageTracking
import { useCacheInvalidation } from "./hooks/use-cache-invalidation";
import { AccessibilityEnhancer } from "@/components/accessibility-enhancer";
import { CoreWebVitalsMonitor, AccessibilityStyles } from "@/components/core-web-vitals-monitor";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Home from "@/pages/home";
import Gallery from "@/pages/gallery";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/product-detail";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import ShippingReturns from "@/pages/shipping-returns";
// Removed unused import: ArtworkDetail
import SecurityPolicy from "@/pages/security-policy";
// Lazy load heavy admin components for better performance
import { lazy, Suspense } from "react";
// Removed unused imports: ErrorBoundary, AdminErrorBoundary
import AdminLogin from "@/pages/admin/login";
import ForgotPassword from "@/pages/admin/forgot-password";

// Performance Optimization: Lazy load ALL heavy admin components for ~110kB bundle reduction
const ArtworkUpload = lazy(() => import("@/pages/admin/upload"));
const ManageArtworks = lazy(() => import("@/pages/admin/manage"));
const ArtworkEdit = lazy(() => import("@/pages/admin/edit"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AddProduct = lazy(() => import("@/pages/admin/add-product"));
const ManageProducts = lazy(() => import("@/pages/admin/manage-products"));
const EditProduct = lazy(() => import("@/pages/admin/edit-product"));
const WebsiteSettings = lazy(() => import("@/pages/admin/settings"));
const ShopSettings = lazy(() => import("@/pages/admin/shop-settings"));
const AccountSecurity = lazy(() => import("@/pages/admin/account-security"));
const ImportGootenProduct = lazy(() => import("@/pages/admin/import-gooten-product"));
const PrintfulSettings = lazy(() => import("@/pages/admin/printful-settings"));
const OrdersManagement = lazy(() => import("@/pages/admin/orders"));
const OrderDetails = lazy(() => import("@/pages/admin/order-details"));
const InquiryDetail = lazy(() => import("@/pages/admin/inquiry-detail"));
const GettingStartedGuide = lazy(() => import("@/pages/admin/help-guides/getting-started"));
const GallerySetupGuide = lazy(() => import("@/pages/admin/help-guides/setting-up-gallery"));
const ShopManagementGuide = lazy(() => import("@/pages/admin/help-guides/managing-shop"));
const OrderProcessingGuide = lazy(() => import("@/pages/admin/help-guides/order-processing"));
const DropShipping = lazy(() => import("@/pages/admin/dropshipping"));
const CommissionCategories = lazy(() => import("@/pages/admin/commission-categories"));
const CommissionSettings = lazy(() => import("@/pages/admin/commission-settings"));
const CommissionRequests = lazy(() => import("@/pages/admin/commission-requests"));
const EmailTemplates = lazy(() => import("@/pages/admin/email-templates"));
const AnalyticsSettings = lazy(() => import("@/pages/admin/analytics-settings"));

function Router() {
  // Performance-optimized loading spinner for admin components
  const AdminLoadingSpinner = () => (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );
  // Track page views when routes change
  useAnalytics();
  
  // Initialize and track with Google Analytics if enabled
  useGoogleAnalytics();
  
  // Set up automatic cache invalidation from server events
  useCacheInvalidation();
  
  return (
    <AccessibilityEnhancer>
      <CoreWebVitalsMonitor />
      <AccessibilityStyles />
      <Switch>
      <Route path="/admin/login">
        <AdminLogin />
      </Route>
      <Route path="/admin/forgot-password">
        <ForgotPassword />
      </Route>
      <Route path="/admin/dashboard">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/upload">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <ArtworkUpload />
        </Suspense>
      </Route>
      <Route path="/admin/manage">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <ManageArtworks />
        </Suspense>
      </Route>
      <Route path="/admin/edit/:id">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <ArtworkEdit />
        </Suspense>
      </Route>
      <Route path="/admin/add-product">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AddProduct />
        </Suspense>
      </Route>
      <Route path="/admin/manage-products">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <ManageProducts />
        </Suspense>
      </Route>
      <Route path="/admin/edit-product/:id">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <EditProduct />
        </Suspense>
      </Route>
      <Route path="/admin/settings/homepage">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <WebsiteSettings />
        </Suspense>
      </Route>
      <Route path="/admin/settings/gallery">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <WebsiteSettings />
        </Suspense>
      </Route>
      <Route path="/admin/settings/about">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <WebsiteSettings />
        </Suspense>
      </Route>
      <Route path="/admin/settings/contact">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <WebsiteSettings />
        </Suspense>
      </Route>
      <Route path="/admin/settings/footer">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <WebsiteSettings />
        </Suspense>
      </Route>
      <Route path="/admin/settings">
        {() => {
          window.location.href = "/admin/dashboard";
          return null;
        }}
      </Route>
      <Route path="/admin/settings/:tab">
        {() => {
          window.location.href = "/admin/dashboard";
          return null;
        }}
      </Route>
      <Route path="/admin/shop-settings">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <ShopSettings />
        </Suspense>
      </Route>
      <Route path="/admin/account-security">
        <AccountSecurity />
      </Route>
      <Route path="/admin/analytics-settings">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AnalyticsSettings />
        </Suspense>
      </Route>
      <Route path="/admin/import-gooten-product">
        <ImportGootenProduct />
      </Route>
      <Route path="/admin/printful-settings">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <PrintfulSettings />
        </Suspense>
      </Route>
      <Route path="/admin/api/print-products">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <PrintfulSettings />
        </Suspense>
      </Route>
      <Route path="/admin/api/print-settings">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <PrintfulSettings />
        </Suspense>
      </Route>
      <Route path="/admin/api/stripe">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/api/payment-setup">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/api/smtp">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/api/smtp-providers">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/api/ups">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/api/fedex">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      </Route>
      <Route path="/admin/orders">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <OrdersManagement />
        </Suspense>
      </Route>
      <Route path="/admin/orders/:id">
        <OrderDetails />
      </Route>
      <Route path="/admin/inquiry/:id">
        <InquiryDetail />
      </Route>
      <Route path="/admin/help-guides/getting-started">
        <GettingStartedGuide />
      </Route>
      <Route path="/admin/help-guides/setting-up-gallery">
        <GallerySetupGuide />
      </Route>
      <Route path="/admin/help-guides/managing-shop">
        <ShopManagementGuide />
      </Route>
      <Route path="/admin/help-guides/order-processing">
        <OrderProcessingGuide />
      </Route>
      <Route path="/admin/dropshipping">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <DropShipping />
        </Suspense>
      </Route>

      <Route path="/admin/commission-categories">
        <CommissionCategories />
      </Route>
      <Route path="/admin/commission-settings">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <CommissionSettings />
        </Suspense>
      </Route>
      <Route path="/admin/commission-requests">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <CommissionRequests />
        </Suspense>
      </Route>
      <Route path="/admin/email-templates">
        <Suspense fallback={<AdminLoadingSpinner />}>
          <EmailTemplates />
        </Suspense>
      </Route>

      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/gallery" component={Gallery} />

            <Route path="/shop" component={Shop} />
            <Route path="/shop/product/:id" component={ProductDetail} />
            <Route path="/product/:id" component={ProductDetail} />

            <Route path="/order-confirmation" component={OrderConfirmation} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/shipping-returns" component={ShippingReturns} />
            <Route path="/security-policy" component={SecurityPolicy} />
            <Route path="/checkout" component={Checkout} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
    </AccessibilityEnhancer>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
