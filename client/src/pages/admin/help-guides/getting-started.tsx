import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ChevronRight, 
  Layers, 
  Image, 
  ShoppingCart, 
  Settings, 
  CheckCircle 
} from "lucide-react";

export default function GettingStartedGuide() {
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
        <h1 className="text-3xl font-bold mb-2">Getting Started with Your Artist Website</h1>
        <p className="text-gray-500">
          A comprehensive guide to setting up and managing your online art portfolio and shop
        </p>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="lead">
          Welcome to your new artist website! This platform is designed specifically for visual artists 
          to showcase and sell their work. This guide will walk you through the essential steps to get 
          your website up and running.
        </p>
        
        <h2>Setting Up Your Admin Account</h2>
        <p>
          Your admin account gives you access to manage all aspects of your website. You've already taken
          the first step by logging in. Here are a few security best practices to keep in mind:
        </p>
        <ul>
          <li>Use a strong, unique password for your admin account</li>
          <li>Enable multi-factor authentication in the Security settings</li>
          <li>Regularly update your login credentials</li>
          <li>Never share your admin login information</li>
        </ul>
        
        <h2>The Admin Dashboard</h2>
        <p>
          The dashboard is your command center for managing your website. From here, you can access all 
          the tools and features needed to manage your art, products, orders, and website settings.
        </p>
        
        <h3>Main Dashboard Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <div className="bg-primary/10 p-2 rounded-md mr-3">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-medium">Artwork Gallery</h4>
            </div>
            <p className="text-sm text-gray-600">Upload and manage your artwork portfolio. This is where you showcase your creative work.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <div className="bg-primary/10 p-2 rounded-md mr-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-medium">Shop Management</h4>
            </div>
            <p className="text-sm text-gray-600">Create products, manage inventory, and connect with print-on-demand services.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <div className="bg-primary/10 p-2 rounded-md mr-3">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-medium">Orders</h4>
            </div>
            <p className="text-sm text-gray-600">Track, manage, and fulfill customer orders. View sales analytics and process payments.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <div className="bg-primary/10 p-2 rounded-md mr-3">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-medium">Website Settings</h4>
            </div>
            <p className="text-sm text-gray-600">Customize your website's appearance, content, and functionality.</p>
          </div>
        </div>
        
        <h2>Essential First Steps</h2>
        <p>
          Now that you're familiar with the dashboard, here are the key tasks to complete 
          when setting up your website:
        </p>
        
        <div className="space-y-4 my-6">
          <div className="flex items-start">
            <div className="bg-green-50 p-1 rounded-full mr-3 mt-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Upload Your Artwork</h4>
              <p className="text-gray-600">
                Start by adding your artwork to the gallery. Go to <strong>Artwork Gallery</strong> and 
                click <strong>Add New Artwork</strong>. Upload high-quality images and add detailed descriptions.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-green-50 p-1 rounded-full mr-3 mt-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Create Products to Sell</h4>
              <p className="text-gray-600">
                Set up products in your shop based on your artwork. Go to <strong>Shop Management</strong> and 
                click <strong>Add New Product</strong>. You can create different types of products including prints, 
                originals, and merchandise.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-green-50 p-1 rounded-full mr-3 mt-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Configure Your Website Settings</h4>
              <p className="text-gray-600">
                Customize your website to reflect your brand. Go to <strong>Website Settings</strong> to update 
                your homepage, about page, and contact information. Add your logo and adjust the color scheme.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-green-50 p-1 rounded-full mr-3 mt-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Set Up Your Payment Methods</h4>
              <p className="text-gray-600">
                Connect your payment providers to start accepting payments. Go to <strong>Shop Management</strong> then 
                <strong>Shop Settings</strong> to configure Stripe or other payment gateways.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-green-50 p-1 rounded-full mr-3 mt-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Complete Your Artist Profile</h4>
              <p className="text-gray-600">
                Update your artist profile with a bio, photo, and professional details. This builds credibility with potential buyers.
                Go to <strong>Your Profile</strong> under the Account section.
              </p>
            </div>
          </div>
        </div>
        
        <h2>Understanding the Workflow</h2>
        <p>
          Here's how the typical workflow operates on your website:
        </p>
        
        <ol>
          <li><strong>Create artwork in the Gallery</strong> - This becomes part of your portfolio</li>
          <li><strong>Create products based on artwork</strong> - Link products to your artwork</li>
          <li><strong>Customers place orders</strong> - You receive order notifications</li>
          <li><strong>Process and fulfill orders</strong> - Either manually or through print-on-demand</li>
          <li><strong>Track sales and analytics</strong> - Monitor performance and adjust strategy</li>
        </ol>
        
        <p>
          This integrated approach ensures your artwork is showcased professionally while enabling seamless e-commerce functionality.
        </p>
        
        <h2>Next Steps</h2>
        <p>
          Now that you understand the basics, explore these more detailed guides:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <Button variant="outline" className="justify-between p-4 h-auto" onClick={() => navigate("/admin/help-support")}>
            <span>Setting Up Your Artwork Gallery</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="justify-between p-4 h-auto" onClick={() => navigate("/admin/help-support")}>
            <span>Managing Your Shop</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="justify-between p-4 h-auto" onClick={() => navigate("/admin/help-support")}>
            <span>Order Processing Workflow</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="justify-between p-4 h-auto" onClick={() => navigate("/admin/help-support")}>
            <span>Customizing Your Website</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 my-8">
          <h3 className="text-blue-800 font-medium">Need Additional Help?</h3>
          <p className="text-blue-700 mb-4">
            If you need personalized assistance, don't hesitate to contact our support team.
          </p>
          <Button 
            variant="outline" 
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => navigate("/admin/help-support")}
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}