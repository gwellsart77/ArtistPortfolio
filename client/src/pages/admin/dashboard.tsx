import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cacheInvalidation } from "@/lib/cache-invalidation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Removed unused Tabs imports for type safety
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Import MFA component
import MultiFactorAuthentication from "./mfa";
import { 
  UploadCloud, Edit, Palette, LogOut, 
  Package, Settings, Shield, LayoutDashboard, 
  Bell, FileText, Globe, Mail, HelpCircle,
  BarChart, Key, DollarSign, MessageSquare,
  Users, Eye, Clock, TrendingUp, Calculator, User,
  RefreshCcw, Monitor, Smartphone, Tablet, ShoppingCart, ShoppingBag,
  Home, Download, CreditCard, MapPin, Calendar, Image, AlignJustify
} from "lucide-react";
// Removed unused SecurityPageFixed and PrintfulOrderManager imports for type safety
// Integrated components will be loaded dynamically

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pricePerSquareInch, setPricePerSquareInch] = useState("");
  
  // Dashboard loads with default tab - no URL parameters needed
  useEffect(() => {
    // Ensure clean canonical URL
    if (location.search) {
      window.history.replaceState({}, '', '/admin/dashboard');
    }
  }, [location.search]);
  
  // Verify session against server on mount
  useEffect(() => {
    fetch("/api/admin/verify-session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem("admin_authenticated");
          setLocation("/admin/login");
          toast({
            title: "Authentication required",
            description: "You must log in to access this page",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        // Network error — fall back to sessionStorage check
        if (sessionStorage.getItem("admin_authenticated") !== "true") {
          setLocation("/admin/login");
        }
      });
  }, [setLocation, toast]);
  
  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setLocation("/admin/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/overview"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch device analytics data
  const { data: deviceAnalyticsData, isLoading: deviceAnalyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/devices"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch price per square inch setting
  const { data: pricePerSquareInchSetting } = useQuery({
    queryKey: ["/api/settings/price_per_square_inch"],
  });

  // Fetch recent orders data
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
  });

  // Calculate recent orders (last 30 days)
  const recentOrdersCount = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= thirtyDaysAgo;
    }).length;
  }, [orders]);

  // Initialize price per square inch value
  useEffect(() => {
    if (pricePerSquareInchSetting?.value) {
      setPricePerSquareInch(pricePerSquareInchSetting.value);
    }
  }, [pricePerSquareInchSetting]);

  // Handle price per square inch changes
  const handlePricePerSquareInchChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const value = e.target.value;
    setPricePerSquareInch(value);

    // Auto-save after typing stops
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      try {
        await apiRequest("PUT", "/api/admin/settings", {
          key: "price_per_square_inch",
          value: value
        });
        
        // Use automatic cache invalidation system
        cacheInvalidation.settings();
        queryClient.invalidateQueries({ queryKey: ["/api/settings/price_per_square_inch"] });
        
        toast({
          title: "Price Updated",
          description: `Price per square inch set to $${value}`,
        });
      } catch (error) {
        console.error("Error updating price setting:", error);
        toast({
          title: "Error",
          description: "Failed to update price setting",
          variant: "destructive",
        });
      }
    }
  };

  // Recent activity placeholder data
  const recentActivity = [
    { id: 1, action: "Added new artwork", item: "Rising Dawn", time: "2 hours ago" },
    { id: 2, action: "Updated product price", item: "Luminous Print (11x14)", time: "Yesterday" },
    { id: 3, action: "Changed website settings", item: "Footer text updated", time: "2 days ago" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-serif text-2xl text-primary font-bold">Artist Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setLocation("/")}
              >
                <Globe className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 pt-3 pb-3 flex flex-col overflow-y-auto">
          <div className="flex flex-col flex-grow px-4 space-y-1">
            <Button 
              variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
              className="justify-start mb-2"
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-3">
              Content
            </p>
            <Button 
              variant={activeTab === "artwork" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("artwork")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Artwork Gallery
            </Button>
            <Button 
              variant={activeTab === "shop-management" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("shop-management")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shop Management
            </Button>
            <Button 
              variant={activeTab === "orders" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </Button>
            
            <Button 
              variant={activeTab === "contact-management" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("contact-management")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Management
            </Button>
            
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-3">
              Website
            </p>
            <Button 
              variant={activeTab === "settings" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Page Settings
            </Button>
            
            <Button 
              variant={activeTab === "colors" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("colors")}
            >
              <Palette className="h-4 w-4 mr-2" />
              Website Colors
            </Button>
            
            <Button 
              variant={activeTab === "analytics" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            
            <Button 
              variant={activeTab === "mfa" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("mfa")}
            >
              <Shield className="h-4 w-4 mr-2" />
              MFA
            </Button>
            

            <Button 
              variant={activeTab === "api-configuration" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("api-configuration")}
            >
              <Key className="h-4 w-4 mr-2" />
              API Configuration
            </Button>
            
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-3">
              Support
            </p>
            <Button 
              variant={activeTab === "help-support" ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => setActiveTab("help-support")}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              <h1 className="text-3xl font-serif font-bold mb-6">Welcome to Your Dashboard</h1>
              

              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card
                  className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200"
                  onClick={() => setActiveTab("artwork")}
                  role="link"
                  aria-label="Go to Artwork Gallery management"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Artwork Gallery</CardTitle>
                    <CardDescription>Manage your gallery →</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">32</p>
                  </CardContent>
                </Card>

                <Card
                  className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200"
                  onClick={() => setActiveTab("shop-management")}
                  role="link"
                  aria-label="Go to Shop Management"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Shop Products</CardTitle>
                    <CardDescription>Manage your shop →</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">18</p>
                  </CardContent>
                </Card>

                <Card
                  className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200"
                  onClick={() => setActiveTab("orders")}
                  role="link"
                  aria-label="Go to Orders management"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                    <CardDescription>Last 30 days → view all</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{recentOrdersCount}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map(activity => (
                          <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-gray-500">{activity.item}</p>
                              <p className="text-xs text-gray-400">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start" 
                        onClick={() => setLocation("/admin/upload")}
                      >
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Add New Artwork
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        onClick={() => setLocation(`/admin/add-product?returnTab=${activeTab}`)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Add New Product
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        onClick={() => setLocation(`/admin/settings?returnTab=${activeTab}`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Page Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Artwork Gallery Management Tab */}
          {activeTab === "artwork" && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold">Artwork Gallery Management</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Upload New Artwork</CardTitle>
                    <CardDescription>Add to your gallery</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <UploadCloud className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Add new artworks to your gallery with images, descriptions, and pricing information.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={() => setLocation("/admin/upload")}
                    >
                      Add New Artwork
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Manage Existing Art</CardTitle>
                    <CardDescription>Edit your gallery</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Edit className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Edit, update, or remove existing artworks from your gallery. Manage visibility and featured works.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation(`/admin/manage?returnTab=${activeTab}`)}
                    >
                      Manage Gallery
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Price Calculator</CardTitle>
                    <CardDescription>Configure artwork pricing</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Calculator className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Set and adjust the price per square inch multiplier for automatic artwork pricing calculations.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setActiveTab("artwork-pricing")}
                    >
                      Configure Pricing
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Shop Management Tab */}
          {activeTab === "shop" && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold">Shop Management</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Add New Product</CardTitle>
                    <CardDescription>Expand your product catalog</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Package className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Add new products to your shop including prints, originals, and merchandise with images and pricing.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={() => setLocation("/admin/add-product")}
                    >
                      Add New Product
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Manage Products</CardTitle>
                    <CardDescription>Edit your shop inventory</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <ShoppingBag className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Edit, update, or remove existing products from your shop. Manage inventory and visibility.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/manage-products")}
                    >
                      Manage Products
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Drop Shipping</CardTitle>
                    <CardDescription>Print-on-demand integrations</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Package className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Manage Printful and Gooten integrations for automated print-on-demand fulfillment worldwide.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/dropshipping")}
                    >
                      Manage Drop Shipping
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Shop Settings</CardTitle>
                    <CardDescription>Configure your shop</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Settings className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure shipping options including studio address and drop shipping alternatives.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/shop-settings")}
                    >
                      Configure Shop
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Website Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Page Settings</h1>
                <p className="text-gray-600">Manage how your website appears to visitors</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Home className="mr-2 h-5 w-5" />
                      Homepage Settings
                    </CardTitle>
                    <CardDescription>Edit hero section, featured works</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Home className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Edit hero section, featured works, and more.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/settings/homepage")}
                    >
                      Configure Homepage
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Image className="mr-2 h-5 w-5" />
                      Gallery Settings
                    </CardTitle>
                    <CardDescription>Configure gallery layout and categories</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Image className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure gallery layout and categories.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/settings/gallery")}
                    >
                      Configure Gallery
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <User className="mr-2 h-5 w-5" />
                      Artist Bio
                    </CardTitle>
                    <CardDescription>Update artist statement and biography</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <User className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Update your artist statement and biography.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/settings/about")}
                    >
                      Configure Artist Bio
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Settings
                    </CardTitle>
                    <CardDescription>Edit contact page text and display options</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Mail className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Edit contact page text and display options.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/settings/contact")}
                    >
                      Configure Contact
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <AlignJustify className="mr-2 h-5 w-5" />
                      Footer Settings
                    </CardTitle>
                    <CardDescription>Edit footer content and social media links</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <AlignJustify className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Edit footer content and social media links.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/settings/footer")}
                    >
                      Configure Footer
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Shop Settings
                    </CardTitle>
                    <CardDescription>Configure your shop display and description</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <ShoppingCart className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure your shop display and description.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        const targetUrl = `/admin/shop-settings?returnTab=${activeTab}`;
                        console.log("🔍 [MAIN DASHBOARD 'Configure Shop' BUTTON CLICKED]");
                        console.log("🔍 Current activeTab:", activeTab);
                        console.log("🔍 Target URL:", targetUrl);
                        navigate(targetUrl);
                      }}
                    >
                      Configure Shop
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <FileText className="mr-2 h-5 w-5" />
                      Commission Art Settings
                    </CardTitle>
                    <CardDescription>Configure pricing calculators and email notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <FileText className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure pricing calculators and email notifications.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/commission-settings")}
                    >
                      Configure Commission Art
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Multi-Factor Authentication Tab */}
          {activeTab === "mfa" && <MultiFactorAuthentication />}

          {/* Orders Management Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold">Orders Management</h1>
                <p className="text-muted-foreground">Track and manage your customer orders</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Order Dashboard</CardTitle>
                    <CardDescription>Track all customer orders</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <ShoppingBag className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      View all orders, track their status, manage shipping information, and communicate with customers.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={() => setLocation("/admin/orders")}
                    >
                      Go to Orders
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Pending Orders</CardTitle>
                    <CardDescription>Orders that need your attention</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Bell className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Quickly access orders that are pending and need to be processed or shipped to customers.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation(`/admin/orders?status=pending&returnTab=${activeTab}`)}
                    >
                      View Pending Orders
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <FileText className="mr-2 h-5 w-5" />
                      Invoice Settings
                    </CardTitle>
                    <CardDescription>Customize invoice text and branding</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <FileText className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Customize your invoice template, company information, and footer text for professional invoices.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setActiveTab("invoice-settings")}
                    >
                      Edit Invoice Settings
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Invoice Settings Tab */}
          {activeTab === "invoice-settings" && (
            <InvoiceSettingsSection />
          )}

          {/* Artwork Pricing Tab */}
          {activeTab === "artwork-pricing" && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold">Artwork Price Calculator</h1>
                <p className="text-neutral-600 mt-2">Configure the price per square inch multiplier for automatic artwork pricing calculations.</p>
              </div>
              
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Price Configuration
                  </CardTitle>
                  <CardDescription>
                    Set the multiplier used to calculate prices for original artwork based on dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="price-multiplier">Price Per Square Inch ($)</Label>
                    <div className="flex items-center mt-1.5">
                      <Input 
                        id="price-multiplier"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="4.00"
                        value={pricePerSquareInch}
                        onChange={handlePricePerSquareInchChange}
                        className="w-32"
                      />
                      <span className="ml-2 text-sm text-muted-foreground">per square inch</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Pricing Formula</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Price = Height × Width × ${pricePerSquareInch || "4.00"}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This multiplier is automatically applied when adding original artwork to calculate the final price based on the artwork's dimensions.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Example Calculation</h4>
                    <p className="text-sm text-blue-800">
                      A 16" × 20" canvas would be: 16 × 20 × ${pricePerSquareInch || "4.00"} = ${((16 * 20 * (parseFloat(pricePerSquareInch) || 4.00)).toFixed(2))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Shop Management Tab */}
          {activeTab === "shop-management" && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold">Shop Management</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Add New Product</CardTitle>
                    <CardDescription>Expand your product catalog</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Package className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Add new products to your shop including prints, originals, and merchandise with images and pricing.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={() => setLocation(`/admin/add-product?returnTab=${activeTab}`)}
                    >
                      Add New Product
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Manage Products</CardTitle>
                    <CardDescription>Edit your shop inventory</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <ShoppingBag className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Edit, update, or remove existing products from your shop. Manage inventory and visibility.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/manage-products")}
                    >
                      Manage Products
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Drop Shipping</CardTitle>
                    <CardDescription>Print-on-demand integrations</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Package className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Manage Printful and Gooten integrations for automated print-on-demand fulfillment worldwide.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/dropshipping")}
                    >
                      Manage Drop Shipping
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Shop Settings</CardTitle>
                    <CardDescription>Configure your shop</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Settings className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure shipping options including studio address and drop shipping alternatives.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/shop-settings")}
                    >
                      Configure Shop
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Contact Management Tab */}
          {activeTab === "contact-management" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Contact Management</h1>
                  <p className="text-gray-600">Manage customer inquiries and commission requests</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Commission Requests
                    </CardTitle>
                    <CardDescription>View and manage commission inquiries</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Palette className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Review and respond to commission requests from potential clients.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/commission-requests")}
                    >
                      View Requests
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Settings className="mr-2 h-5 w-5" />
                      Commission Settings
                    </CardTitle>
                    <CardDescription>Configure commission options</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <DollarSign className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Set pricing, categories, and commission request settings.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/commission-settings")}
                    >
                      Configure Settings
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Mail className="mr-2 h-5 w-5" />
                      Email Templates
                    </CardTitle>
                    <CardDescription>Manage email responses</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <FileText className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Create and edit automated email response templates.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/email-templates")}
                    >
                      Edit Templates
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Website Colors Tab */}
          {activeTab === "colors" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Website Colors</h1>
                  <p className="text-gray-600">Customize your website's color scheme and branding</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/admin/settings/colors")}
                  className="flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  Customize Colors
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Palette className="mr-2 h-5 w-5" />
                      Color Scheme
                    </CardTitle>
                    <CardDescription>Manage your website's visual identity</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Palette className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Set primary background, text, and accent colors to match your brand.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/settings/colors")}
                    >
                      Customize Colors
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Live Preview</CardTitle>
                    <CardDescription>See changes in real-time</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg"></div>
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Preview your color changes before applying them to your live website.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open("/", "_blank")}
                    >
                      View Live Site
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Reset Options</CardTitle>
                    <CardDescription>Restore default colors</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Default</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Quickly restore your website to the original color scheme.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                    >
                      Reset to Default
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Under Construction Notice */}
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Under construction. Coming with future updates.
                </p>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Website Analytics</h1>
                  <p className="text-gray-600">Track visitor behavior and site performance</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/admin/analytics-settings")}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Analytics Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Data
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsLoading ? "--" : (analyticsData?.totalPageViews || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsLoading ? "Loading analytics..." : "All time"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsLoading ? "--" : (analyticsData?.uniqueVisitors || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsLoading ? "Loading analytics..." : "All time"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsLoading ? "--" : "2m 34s"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsLoading ? "Loading analytics..." : "Average"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsLoading ? "--" : "32%"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsLoading ? "Loading analytics..." : "This month"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsLoading ? (
                        <div className="text-sm text-gray-600">Loading popular pages...</div>
                      ) : !analyticsData?.popularPages?.length ? (
                        <div className="text-sm text-gray-600">No page data available yet</div>
                      ) : (
                        analyticsData.popularPages.map((page: any, index: number) => (
                          <div key={page.path} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <span className="text-sm font-medium truncate">
                                {page.path === '/' ? 'Homepage' : page.path}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {page.views} views
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deviceAnalyticsLoading ? (
                        <div className="text-sm text-gray-600">Loading device analytics...</div>
                      ) : deviceAnalyticsData?.total === 0 ? (
                        <div className="text-sm text-gray-600">No device data available yet</div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              <span>Desktop</span>
                            </div>
                            <span className="text-sm font-medium">
                              {deviceAnalyticsData?.devices?.find(d => d.device === 'desktop')?.count || 0} visits 
                              ({deviceAnalyticsData?.devices?.find(d => d.device === 'desktop')?.percentage || 0}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <span>Mobile</span>
                            </div>
                            <span className="text-sm font-medium">
                              {deviceAnalyticsData?.devices?.find(d => d.device === 'mobile')?.count || 0} visits 
                              ({deviceAnalyticsData?.devices?.find(d => d.device === 'mobile')?.percentage || 0}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tablet className="h-4 w-4" />
                              <span>Tablet</span>
                            </div>
                            <span className="text-sm font-medium">
                              {deviceAnalyticsData?.devices?.find(d => d.device === 'tablet')?.count || 0} visits 
                              ({deviceAnalyticsData?.devices?.find(d => d.device === 'tablet')?.percentage || 0}%)
                            </span>
                          </div>
                          {deviceAnalyticsData?.total && (
                            <div className="pt-2 border-t text-xs text-gray-500">
                              Total tracked visits: {deviceAnalyticsData.total}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}



          {/* API Configuration Tab */}
          {activeTab === "api-configuration" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">API Configuration</h1>
                <p className="text-gray-600">Manage integrations and API settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Package className="mr-2 h-5 w-5" />
                      Print Services
                    </CardTitle>
                    <CardDescription>Printful & Gooten configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Settings className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure API keys for print-on-demand services.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/printful-settings")}
                    >
                      Configure APIs
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Payment Processing
                    </CardTitle>
                    <CardDescription>Stripe payment configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Key className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Set up payment processing for your online store.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setActiveTab("stripe-config")}
                    >
                      Configure Payments
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Mail className="mr-2 h-5 w-5" />
                      Email Services
                    </CardTitle>
                    <CardDescription>SMTP and email configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Globe className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure email delivery for notifications and responses.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setActiveTab("email-config")}
                    >
                      Configure Email
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Package className="mr-2 h-5 w-5" />
                      Shipping Services
                    </CardTitle>
                    <CardDescription>USPS, FedEx, UPS configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <ShoppingCart className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure shipping APIs for real-time rates and tracking.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/shop-settings")}
                    >
                      Configure Shipping
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <BarChart className="mr-2 h-5 w-5" />
                      Analytics Services
                    </CardTitle>
                    <CardDescription>Google Analytics & tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <TrendingUp className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Configure Google Analytics and other tracking services.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/analytics-settings")}
                    >
                      Configure Analytics
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Help & Support Tab */}
          {activeTab === "help-support" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Help & Support</h1>
                <p className="text-gray-600">Resources and guides for managing your artist website</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <FileText className="mr-2 h-5 w-5" />
                      Getting Started
                    </CardTitle>
                    <CardDescription>Basic setup and configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <HelpCircle className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Learn how to set up your artist website and upload your first artwork.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/admin/help/getting-started")}
                    >
                      View Guide
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Shop Management
                    </CardTitle>
                    <CardDescription>Managing products and orders</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Package className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Comprehensive guide to managing your online shop and processing orders.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/help/managing-shop")}
                    >
                      View Guide
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <Image className="mr-2 h-5 w-5" />
                      Gallery Setup
                    </CardTitle>
                    <CardDescription>Organizing your artwork gallery</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-center">
                      <Palette className="h-16 w-16 text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-600 mt-4">
                      Best practices for organizing and displaying your artwork portfolio.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/admin/help/setting-up-gallery")}
                    >
                      View Guide
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Stripe Configuration Tab */}
          {activeTab === "stripe-config" && (
            <StripeConfigSection />
          )}

          {/* Email Configuration Tab */}
          {activeTab === "email-config" && (
            <EmailConfigSection />
          )}


        </main>
      </div>
    </div>
  );
}

// Stripe Configuration Component
const stripeSchema = z.object({
  stripePublicKey: z.string().min(1, "Stripe public key is required"),
  stripeSecretKey: z.string().min(1, "Stripe secret key is required"),
});

function StripeConfigSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("stripe-config");

  const { data: stripeConfig, isLoading } = useQuery({
    queryKey: ["/api/admin/stripe-config"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(stripeSchema),
    defaultValues: {
      stripePublicKey: "",
      stripeSecretKey: "",
    },
  });

  useEffect(() => {
    if (stripeConfig) {
      form.reset({
        stripePublicKey: (stripeConfig as any).stripePublicKey || "",
        stripeSecretKey: (stripeConfig as any).stripeSecretKey || "",
      });
    }
  }, [stripeConfig, form]);

  const saveStripeConfig = useMutation({
    mutationFn: async (data: z.infer<typeof stripeSchema>) => {
      return apiRequest("POST", "/api/admin/stripe-config", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stripe configuration saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Stripe configuration",
        variant: "destructive",
      });
    },
  });

  const testStripeConnection = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/stripe-test", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stripe connection test successful!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Stripe",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof stripeSchema>) => {
    saveStripeConfig.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Processing Configuration</h1>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("api-configuration")}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            ← Back to API Configuration
          </Button>
          <h1 className="text-3xl font-bold">Payment Processing Configuration</h1>
          <p className="text-gray-600">Configure Stripe for payment processing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe API Configuration</CardTitle>
          <CardDescription>
            Configure your Stripe API keys to enable payment processing for your online store.
            You can find your API keys in your Stripe Dashboard under Developers → API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="stripePublicKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Publishable Key</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="pk_test_..."
                        type="text"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-500">
                      Your publishable key (starts with pk_). This is safe to use in frontend code.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stripeSecretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Secret Key</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="sk_test_..."
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-500">
                      Your secret key (starts with sk_). Keep this secure and never share it publicly.
                    </p>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={saveStripeConfig.isPending}
                  className="flex items-center gap-2"
                >
                  {saveStripeConfig.isPending ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testStripeConnection.mutate()}
                  disabled={testStripeConnection.isPending || !(stripeConfig as any)?.stripeSecretKey}
                  className="flex items-center gap-2"
                >
                  {testStripeConnection.isPending ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p><strong>1. Get your Stripe API keys:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dashboard.stripe.com/apikeys</a></li>
              <li>Copy your "Publishable key" (starts with pk_)</li>
              <li>Copy your "Secret key" (starts with sk_)</li>
            </ul>
            
            <p className="mt-4"><strong>2. Configure webhooks (optional):</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Go to Webhooks in your Stripe Dashboard</li>
              <li>Add endpoint: your-domain.com/api/stripe/webhook</li>
              <li>Select events: payment_intent.succeeded, payment_intent.payment_failed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Email Configuration Component
const emailSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1, "SMTP port is required"),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  fromEmail: z.string().email("Valid email address is required"),
  fromName: z.string().min(1, "From name is required"),
});

function EmailConfigSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: emailConfig, isLoading } = useQuery({
    queryKey: ["/api/admin/email-config"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "",
    },
  });

  useEffect(() => {
    if (emailConfig) {
      form.reset({
        smtpHost: emailConfig.smtpHost || "",
        smtpPort: emailConfig.smtpPort || 587,
        smtpUser: emailConfig.smtpUser || "",
        smtpPassword: emailConfig.smtpPassword || "",
        fromEmail: emailConfig.fromEmail || "",
        fromName: emailConfig.fromName || "",
      });
    }
  }, [emailConfig, form]);

  const saveEmailConfig = useMutation({
    mutationFn: async (data: z.infer<typeof emailSchema>) => {
      return apiRequest("POST", "/api/admin/email-config", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email configuration saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save email configuration",
        variant: "destructive",
      });
    },
  });

  const testEmailConnection = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/email-test", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email connection test successful!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to email server",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof emailSchema>) => {
    saveEmailConfig.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("api-configuration")}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            ← Back to API Configuration
          </Button>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-gray-600">Configure SMTP settings for email delivery</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Configure your SMTP settings to enable email notifications and responses.
            You can use services like Gmail, SendGrid, Mailgun, or your hosting provider's SMTP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="smtp.gmail.com"
                          type="text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="587"
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="smtpUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="your-email@gmail.com"
                          type="text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtpPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your password or app password"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="noreply@yourdomain.com"
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your Artist Name"
                          type="text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={saveEmailConfig.isPending}
                  className="flex items-center gap-2"
                >
                  {saveEmailConfig.isPending ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testEmailConnection.mutate()}
                  disabled={testEmailConnection.isPending || !emailConfig?.smtpHost}
                  className="flex items-center gap-2"
                >
                  {testEmailConnection.isPending ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popular SMTP Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-4">
            <div>
              <p><strong>Gmail:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Host: smtp.gmail.com, Port: 587</li>
                <li>Enable 2-factor auth and use an App Password</li>
              </ul>
            </div>
            
            <div>
              <p><strong>SendGrid:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Host: smtp.sendgrid.net, Port: 587</li>
                <li>Username: apikey, Password: Your SendGrid API Key</li>
              </ul>
            </div>

            <div>
              <p><strong>Mailgun:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Host: smtp.mailgun.org, Port: 587</li>
                <li>Use your Mailgun domain credentials</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Invoice Settings Schema
const invoiceSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyTagline: z.string().optional(),
  companyEmail: z.string().email("Valid email is required"),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  footerMessage: z.string().optional(),
  invoiceTitle: z.string().min(1, "Invoice title is required"),
  itemsTitle: z.string().min(1, "Items section title is required"),
});

function InvoiceSettingsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoiceSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/invoice-settings"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      companyName: "Gabe Wells Art",
      companyTagline: "Artist & Creative Professional",
      companyEmail: "gwellsart@gmail.com",
      companyAddress: "",
      companyPhone: "",
      footerMessage: "Thank you for your business!",
      invoiceTitle: "Invoice Details",
      itemsTitle: "Order Items",
    },
  });

  useEffect(() => {
    if (invoiceSettings) {
      form.reset({
        companyName: (invoiceSettings as any).companyName || "Gabe Wells Art",
        companyTagline: (invoiceSettings as any).companyTagline || "Artist & Creative Professional", 
        companyEmail: (invoiceSettings as any).companyEmail || "gwellsart@gmail.com",
        companyAddress: (invoiceSettings as any).companyAddress || "",
        companyPhone: (invoiceSettings as any).companyPhone || "",
        footerMessage: (invoiceSettings as any).footerMessage || "Thank you for your business!",
        invoiceTitle: (invoiceSettings as any).invoiceTitle || "Invoice Details",
        itemsTitle: (invoiceSettings as any).itemsTitle || "Order Items",
      });
    }
  }, [invoiceSettings, form]);

  const saveInvoiceSettings = useMutation({
    mutationFn: async (data: z.infer<typeof invoiceSettingsSchema>) => {
      return apiRequest("POST", "/api/admin/invoice-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice settings saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof invoiceSettingsSchema>) => {
    saveInvoiceSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoice Settings</h1>
        <p className="text-gray-600">Customize your invoice template and branding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Template Customization</CardTitle>
          <CardDescription>
            Customize the text and information that appears on your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your business name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyTagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Tagline</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Artist & Creative Professional" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your@email.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(555) 123-4567" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Main St, City, State 12345" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Section Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Invoice Details" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemsTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Items Section Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Order Items" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="footerMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Thank you for your business!" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={saveInvoiceSettings.isPending}
                >
                  {saveInvoiceSettings.isPending ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Invoice Settings"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            This is how your company information will appear on invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="space-y-2">
              <div className="text-lg font-bold">{form.watch("companyName")}</div>
              {form.watch("companyTagline") && (
                <div className="text-sm text-gray-600">{form.watch("companyTagline")}</div>
              )}
              <div className="text-sm">{form.watch("companyEmail")}</div>
              {form.watch("companyPhone") && (
                <div className="text-sm">{form.watch("companyPhone")}</div>
              )}
              {form.watch("companyAddress") && (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {form.watch("companyAddress")}
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="text-base font-semibold">{form.watch("invoiceTitle")}</div>
              <div className="mt-2 text-base font-semibold">{form.watch("itemsTitle")}</div>
            </div>
            {form.watch("footerMessage") && (
              <div className="mt-6 pt-4 border-t text-sm text-gray-600">
                {form.watch("footerMessage")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}