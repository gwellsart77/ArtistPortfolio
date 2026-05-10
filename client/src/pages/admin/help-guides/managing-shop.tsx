import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  Palette, 
  Tag, 
  CreditCard, 
  Truck,
  Percent,
  DollarSign,
  Printer,
  Info,
  AlertCircle
} from "lucide-react";

export default function ShopManagementGuide() {
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
        <h1 className="text-3xl font-bold mb-2">Managing Your Shop</h1>
        <p className="text-gray-500">
          A complete guide to setting up and managing your online art store
        </p>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="lead">
          Your online shop allows you to sell your artwork in various formats to collectors worldwide. 
          This guide will help you set up a professional shop that effectively showcases and sells your work.
        </p>
        
        <h2>Understanding Product Types</h2>
        <p>
          Your shop supports several types of products, each with unique features:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Original Artwork</h4>
            </div>
            <p className="text-sm text-gray-600">
              One-of-a-kind pieces with limited availability. When sold, these products automatically become unavailable.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Printer className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Art Prints</h4>
            </div>
            <p className="text-sm text-gray-600">
              Reproductions of your artwork in various sizes and formats, either produced by you or via print-on-demand.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Tag className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Limited Edition Prints</h4>
            </div>
            <p className="text-sm text-gray-600">
              Numbered prints with limited quantity. The system tracks editions sold and remaining inventory.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <ShoppingCart className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Merchandise</h4>
            </div>
            <p className="text-sm text-gray-600">
              Products featuring your artwork such as t-shirts, mugs, phone cases, etc., typically fulfilled via print-on-demand.
            </p>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-amber-800 font-medium text-sm">Shop vs. Gallery Concept</h3>
              <p className="text-amber-700 text-sm">
                Remember that your <strong>Gallery</strong> showcases your artwork as creative pieces, while your 
                <strong>Shop</strong> sells products based on those artworks. A single artwork can be linked to 
                multiple products (e.g., different print sizes, merchandise items, etc.).
              </p>
            </div>
          </div>
        </div>
        
        <h2>Adding Products to Your Shop</h2>
        
        <h3>Creating a New Product</h3>
        <p>
          To add a product to your shop:
        </p>
        <ol>
          <li>Navigate to <strong>Shop Management</strong> and click <strong>Add New Product</strong></li>
          <li>Select the product type (Original Artwork, Print, Limited Edition, or Merchandise)</li>
          <li>Link the product to an existing artwork from your gallery</li>
          <li>Fill in the product details (specific fields will vary by product type)</li>
          <li>Set pricing and inventory information</li>
          <li>Add product-specific images or use the linked artwork images</li>
          <li>Click <strong>Save Product</strong> to publish</li>
        </ol>
        
        <h3>Product Information Guidelines</h3>
        <p>
          For each product, provide the following information:
        </p>
        
        <div className="space-y-4 my-6 ml-6">
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Title</h4>
            <p className="text-gray-600 text-sm">
              Clear and descriptive product name including details like size for prints 
              (e.g., "Sunset Dreams - 11×14 Canvas Print").
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Description</h4>
            <p className="text-gray-600 text-sm">
              Detailed product description including materials, finish, and any special features.
              For prints, include paper type, printing process, and whether it's signed.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Price</h4>
            <p className="text-gray-600 text-sm">
              Set your retail price. You can also add a compare-at price if the item is on sale.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Inventory</h4>
            <p className="text-gray-600 text-sm">
              For limited items, set the available quantity. Set to "unlimited" for print-on-demand items.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Dimensions</h4>
            <p className="text-gray-600 text-sm">
              Product dimensions in inches and/or centimeters. For originals, match the artwork dimensions.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Shipping Information</h4>
            <p className="text-gray-600 text-sm">
              Weight and special shipping requirements. This helps calculate accurate shipping costs.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Categories</h4>
            <p className="text-gray-600 text-sm">
              Assign product categories for organization (e.g., "Canvas Prints", "Original Paintings").
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-blue-800 font-medium text-sm">Product Pricing Strategy</h3>
              <p className="text-blue-700 text-sm">
                Price your products consistently based on size, medium, and production costs. For original artwork, 
                consider factors like time invested, materials, size, and your market position. For prints, 
                calculate your costs (printing, shipping, packaging) and add your desired profit margin.
              </p>
            </div>
          </div>
        </div>
        
        <h2>Print-on-Demand Integration</h2>
        <p>
          This platform integrates with popular print-on-demand services to handle production, 
          shipping, and fulfillment automatically.
        </p>
        
        <h3>Setting Up Printful Integration</h3>
        <p>
          To connect your Printful account:
        </p>
        <ol>
          <li>Go to <strong>Shop Management</strong> and click <strong>Printful Integration</strong></li>
          <li>Click <strong>Connect Printful Account</strong></li>
          <li>Enter your Printful API key (found in your Printful dashboard under Settings and API)</li>
          <li>Once connected, click <strong>Sync Products</strong> to import your Printful products</li>
          <li>Link each imported product to an artwork in your gallery</li>
          <li>Review and adjust pricing as needed</li>
        </ol>
        
        <h3>Managing Print-on-Demand Products</h3>
        <p>
          After connecting with Printful:
        </p>
        <ul>
          <li>Orders for print-on-demand products will automatically be sent to Printful for fulfillment</li>
          <li>Product inventory is managed by Printful and always shown as available</li>
          <li>You can create new Printful products directly from your artwork gallery</li>
          <li>Shipping and taxes are calculated based on Printful's rates</li>
        </ul>
        
        <h2>Managing Your Shop Settings</h2>
        
        <h3>Payment Methods</h3>
        <p>
          Set up payment processing to receive funds from purchases:
        </p>
        <ol>
          <li>Go to <strong>Shop Management</strong> and select <strong>Shop Settings</strong></li>
          <li>Click on the <strong>Payments</strong> tab</li>
          <li>Connect your Stripe account using your API keys</li>
          <li>Set your currency and payment options</li>
          <li>Configure any additional payment methods you wish to offer</li>
        </ol>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <CreditCard className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Payment Processors</h4>
            </div>
            <p className="text-sm text-gray-600">
              Stripe is the primary payment processor, handling credit cards, Apple Pay, and Google Pay automatically.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Currency Settings</h4>
            </div>
            <p className="text-sm text-gray-600">
              Set your primary currency and enable multi-currency display options if you sell internationally.
            </p>
          </div>
        </div>
        
        <h3>Shipping Configuration</h3>
        <p>
          Define your shipping options and rates:
        </p>
        <ol>
          <li>In Shop Settings, navigate to the <strong>Shipping</strong> tab</li>
          <li>Set your origin address (where you ship from)</li>
          <li>Create shipping zones (domestic, international, etc.)</li>
          <li>Define shipping methods and rates for each zone</li>
          <li>Configure special rules for oversized items if needed</li>
          <li>Save your shipping configuration</li>
        </ol>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Truck className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Shipping Methods</h4>
            </div>
            <p className="text-sm text-gray-600">
              Create different shipping options like Standard, Express, and Free Shipping with appropriate rates and delivery estimates.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Info className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Print-on-Demand Shipping</h4>
            </div>
            <p className="text-sm text-gray-600">
              For Printful products, shipping is calculated automatically based on Printful's rates.
            </p>
          </div>
        </div>
        
        <h3>Tax Settings</h3>
        <p>
          Configure tax collection for your products:
        </p>
        <ol>
          <li>In Shop Settings, click on the <strong>Taxes</strong> tab</li>
          <li>Set up tax regions where you need to collect taxes</li>
          <li>Define tax rates for each region</li>
          <li>Specify which products are taxable</li>
          <li>Save your tax configuration</li>
        </ol>
        
        <h3>Promotions and Discounts</h3>
        <p>
          Create special offers to drive sales:
        </p>
        <ol>
          <li>Go to <strong>Shop Management</strong> and select <strong>Promotions</strong></li>
          <li>Click <strong>Create Discount</strong></li>
          <li>Choose the discount type (percentage, fixed amount, free shipping)</li>
          <li>Set discount parameters (amount, eligible products, minimum purchase)</li>
          <li>Define the validity period</li>
          <li>Create a discount code for customers to use</li>
          <li>Save and activate the promotion</li>
        </ol>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Percent className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Discount Types</h4>
            </div>
            <p className="text-sm text-gray-600">
              Create percentage discounts (20% off), fixed amounts ($15 off), or free shipping offers.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Tag className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Limited-Time Offers</h4>
            </div>
            <p className="text-sm text-gray-600">
              Set start and end dates for seasonal promotions or special events.
            </p>
          </div>
        </div>
        
        <h2>Managing Products and Inventory</h2>
        
        <h3>Editing Products</h3>
        <p>
          To update existing products:
        </p>
        <ol>
          <li>Go to <strong>Shop Management</strong> and click <strong>Manage Products</strong></li>
          <li>Find the product you want to edit and click the Edit button</li>
          <li>Make your changes to any product details</li>
          <li>Click <strong>Save Changes</strong></li>
        </ol>
        
        <h3>Inventory Management</h3>
        <p>
          Keep track of available products:
        </p>
        <ul>
          <li>For original artwork, inventory is automatically set to 1 and reduced to 0 when sold</li>
          <li>For limited editions, track the edition numbers sold and remaining inventory</li>
          <li>For print-on-demand products, inventory is managed by your provider</li>
          <li>Receive low inventory notifications when stock is running low</li>
          <li>Set products to automatically hide when out of stock</li>
        </ul>
        
        <h3>Product Organization</h3>
        <p>
          Organize your shop for better customer navigation:
        </p>
        <ul>
          <li>Create product categories (e.g., "Canvas Prints", "Original Paintings", "Merchandise")</li>
          <li>Tag products with relevant keywords for improved searchability</li>
          <li>Feature special products on your shop homepage</li>
          <li>Create collections for thematic groupings or special promotions</li>
        </ul>
        
        <h2>Tips for a Successful Shop</h2>
        <ul>
          <li><strong>Clear product photography</strong> - Show accurate colors and details of physical products</li>
          <li><strong>Detailed descriptions</strong> - Include all relevant details about materials, size, and care instructions</li>
          <li><strong>Consistent pricing</strong> - Develop a pricing formula for each product type for consistency</li>
          <li><strong>Shipping transparency</strong> - Clearly communicate shipping costs and delivery timeframes</li>
          <li><strong>Regular updates</strong> - Keep your product catalog fresh with new offerings</li>
          <li><strong>Special promotions</strong> - Use limited-time offers to create urgency and drive sales</li>
        </ul>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 my-8">
          <h3 className="text-blue-800 font-medium">Need Additional Help?</h3>
          <p className="text-blue-700 mb-4">
            If you need personalized assistance with your shop setup, don't hesitate to contact our support team.
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