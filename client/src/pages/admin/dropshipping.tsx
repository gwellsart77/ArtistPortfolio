import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { navigateBackToDashboard } from "@/lib/navigation-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Package, 
  Globe, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Info,
  AlertCircle,
  CheckCircle,
  Settings,
  Send,
  Clock,
  ShoppingCart
} from "lucide-react";
import { PrintfulOrderManager } from "@/components/PrintfulOrderManager";

// Import connection test components
const PrintfulConnectionTest = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/printful/test-connection');
      if (response.ok) {
        setConnectionStatus('connected');
        toast({
          title: "Printful Connected",
          description: "Successfully connected to Printful API",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: "Unable to connect to Printful API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Network error while testing Printful connection",
        variant: "destructive",
      });
    }
    setIsConnecting(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={testConnection}
      disabled={isConnecting}
      className="flex items-center"
    >
      {isConnecting ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : connectionStatus === 'connected' ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          Connected
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
          Test Connection
        </>
      ) : (
        <>
          <Globe className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
};

const GootenConnectionTest = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/gooten/test-connection');
      if (response.ok) {
        setConnectionStatus('connected');
        toast({
          title: "Gooten Connected",
          description: "Successfully connected to Gooten API",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: "Unable to connect to Gooten API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Network error while testing Gooten connection",
        variant: "destructive",
      });
    }
    setIsConnecting(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={testConnection}
      disabled={isConnecting}
      className="flex items-center"
    >
      {isConnecting ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : connectionStatus === 'connected' ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          Connected
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
          Test Connection
        </>
      ) : (
        <>
          <Package className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
};

export default function DropShipping() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isImportingProducts, setIsImportingProducts] = useState(false);

  // Check authentication
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

  const handleImportPrintfulProducts = async () => {
    if (isImportingProducts) return;
    
    setIsImportingProducts(true);
    try {
      const response = await fetch('/api/admin/printful/import-products', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Import Successful",
          description: data.message || `Successfully imported products from Printful`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Import Failed",
          description: errorData.message || "Unable to import products from Printful",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Network error while importing products",
        variant: "destructive",
      });
    } finally {
      setIsImportingProducts(false);
    }
  };

  const handleImportGootenProducts = async () => {
    setIsImportingProducts(true);
    try {
      const response = await fetch('/api/gooten/import-products', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Products Imported",
          description: `Successfully imported ${data.count || 0} products from Gooten`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Unable to import products from Gooten",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Network error while importing products",
        variant: "destructive",
      });
    }
    setIsImportingProducts(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigateBackToDashboard(navigate)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-serif">Fulfillment Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Print-on-Demand Services
            </CardTitle>
            <CardDescription>
              Manage your automated print-on-demand integrations for global fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Order Processing</TabsTrigger>
                <TabsTrigger value="printful">Printful</TabsTrigger>
                <TabsTrigger value="gooten">Gooten</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Drop shipping services automatically handle production and shipping for your artwork. Upload your designs once and sell prints, merchandise, and custom products worldwide without managing inventory.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Printful Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Globe className="mr-2 h-5 w-5" />
                          Printful
                        </span>
                        <Badge variant="outline">Premium Partner</Badge>
                      </CardTitle>
                      <CardDescription>
                        Industry-leading print-on-demand with premium products and global fulfillment
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Premium product quality</li>
                        <li>• Global fulfillment network</li>
                        <li>• White-label branding options</li>
                        <li>• Extensive integrations</li>
                      </ul>
                      <div className="flex gap-2">
                        <PrintfulConnectionTest />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('https://www.printful.com', '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gooten Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Package className="mr-2 h-5 w-5" />
                          Gooten
                        </span>
                        <Badge variant="outline">Fast Production</Badge>
                      </CardTitle>
                      <CardDescription>
                        Wide product selection with competitive pricing and fast production times
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Wide product selection</li>
                        <li>• Competitive pricing</li>
                        <li>• Fast production times</li>
                        <li>• Quality printing standards</li>
                      </ul>
                      <div className="flex gap-2">
                        <GootenConnectionTest />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('https://my.gooten.com', '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Service Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Service Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">When to Use Printful:</h5>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          <li>• Premium customer experience needed</li>
                          <li>• White-label branding required</li>
                          <li>• International shipping priority</li>
                          <li>• Higher price point products</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">When to Use Gooten:</h5>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          <li>• Cost-effective pricing needed</li>
                          <li>• Fast production times required</li>
                          <li>• Volume orders planned</li>
                          <li>• Wide product variety desired</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <div className="space-y-6">
                  <Alert>
                    <ShoppingCart className="h-4 w-4" />
                    <AlertDescription>
                      Monitor and manage print-on-demand orders from both Printful and Gooten. Orders are automatically processed after payment, but you can also manually send orders to fulfillment services when needed.
                    </AlertDescription>
                  </Alert>
                  
                  <PrintfulOrderManager />
                </div>
              </TabsContent>

              <TabsContent value="printful" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Globe className="mr-2 h-5 w-5" />
                        Printful Integration
                      </span>
                      <PrintfulConnectionTest />
                    </CardTitle>
                    <CardDescription>
                      Configure your Printful integration for premium print-on-demand fulfillment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Import your products from Printful to sell them on your website. Products will be automatically synchronized with Printful for fulfillment.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <h4 className="font-medium">Product Management</h4>
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('https://www.printful.com', '_blank')}
                          className="flex items-center"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Printful Dashboard
                        </Button>
                        
                        <Button 
                          onClick={handleImportPrintfulProducts}
                          disabled={isImportingProducts}
                          className="flex items-center"
                        >
                          {isImportingProducts ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync Products
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Import products from Printful to sell in your shop. Products will appear in your shop with the specified variants and pricing.
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Order Fulfillment</h4>
                      <p className="text-sm text-muted-foreground">
                        When customers place orders for Printful products, they will be automatically sent to Printful for fulfillment. You can track order status in your Printful dashboard.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gooten" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Package className="mr-2 h-5 w-5" />
                        Gooten Integration
                      </span>
                      <GootenConnectionTest />
                    </CardTitle>
                    <CardDescription>
                      Configure your Gooten integration for fast, cost-effective print-on-demand
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-yellow-700">
                        Gooten API integration is currently in development mode. Your credentials are stored securely, and the full Gooten connection will be available in the next update.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <h4 className="font-medium">Product Management</h4>
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('https://my.gooten.com', '_blank')}
                          className="flex items-center"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Gooten Dashboard
                        </Button>
                        
                        <Button 
                          variant="secondary"
                          onClick={() => navigate("/admin/import-gooten-product")}
                          className="flex items-center"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Gooten Product
                        </Button>
                        
                        <Button 
                          onClick={handleImportGootenProducts}
                          className="flex items-center"
                          disabled={isImportingProducts}
                        >
                          {isImportingProducts ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Package className="mr-2 h-4 w-4" />
                              Import Products
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Import products from Gooten to sell in your shop. Products will appear in your shop with the specified recipes and variants.
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Order Fulfillment</h4>
                      <p className="text-sm text-muted-foreground">
                        When customers place orders for Gooten products, they will be automatically sent to Gooten for fulfillment. Track order status through the Gooten dashboard.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      Drop Shipping Settings
                    </CardTitle>
                    <CardDescription>
                      Configure global settings for your drop shipping operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Drop shipping settings are automatically managed by each service provider. Use their respective dashboards to configure shipping rates, tax settings, and fulfillment preferences.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <h4 className="font-medium">Quick Links</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('https://www.printful.com', '_blank')}
                          className="flex items-center justify-center"
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          Printful Settings
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('https://my.gooten.com', '_blank')}
                          className="flex items-center justify-center"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Gooten Settings
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Integration Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Printful API</span>
                          <PrintfulConnectionTest />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Gooten API</span>
                          <GootenConnectionTest />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}