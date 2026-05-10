import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Truck, MapPin, Globe, ExternalLink, RefreshCw, AlertCircle, Check, Plus, Package } from "lucide-react";

// Printful Connection Test Component
function PrintfulConnectionTest() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('testing');
    
    try {
      const response = await apiRequest('GET', '/api/admin/printful/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Printful API",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to Printful API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Error connecting to Printful API",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Button 
      variant={connectionStatus === 'success' ? "outline" : (connectionStatus === 'error' ? "destructive" : "outline")}
      size="sm"
      onClick={testConnection}
      disabled={testing}
    >
      {testing ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : connectionStatus === 'success' ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          Connected
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Connection Failed
        </>
      ) : (
        <>
          <Globe className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
}

export default function PrintfulSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImportingProducts, setIsImportingProducts] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);
  
  // Handle importing products from Printful
  const handleImportPrintfulProducts = async () => {
    if (isImportingProducts) return;
    
    setIsImportingProducts(true);
    try {
      const response = await apiRequest('POST', '/api/admin/printful/import-products');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Import Successful",
          description: data.message,
        });
        // Invalidate products query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      } else {
        toast({
          title: "Import Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing Printful products:", error);
      toast({
        title: "Import Error",
        description: "An error occurred while importing products",
        variant: "destructive",
      });
    } finally {
      setIsImportingProducts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-serif">Printful Integration</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Printful Print-on-Demand
            </CardTitle>
            <CardDescription>
              Configure your Printful integration for print-on-demand product fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Printful Products</h3>
                  <PrintfulConnectionTest />
                </div>
                
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-blue-700">
                    Import your products from Printful to sell them on your website. Products will be automatically synchronized with Printful for fulfillment.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Product Management</h4>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => window.open('https://www.printful.com/dashboard', '_blank')}
                        className="flex items-center"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Printful Dashboard
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Access your Printful account directly at <a href="https://www.printful.com/dashboard" target="_blank" className="text-blue-600 hover:text-blue-800 underline">printful.com</a>
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleImportPrintfulProducts}
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
                          <Globe className="mr-2 h-4 w-4" />
                          Import Products
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Import products from Printful to sell in your shop. Products will appear in your shop with the specified variants and pricing.
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <h4 className="font-medium flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Order Fulfillment
                  </h4>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  When customers place orders for Printful products, they will be automatically sent to Printful for fulfillment. You can track order status in your Printful dashboard.
                </p>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6">
                <h3 className="text-lg font-medium">API Connection</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your Printful API key is securely stored in your environment variables. You can test the connection to ensure it's working properly.
                    </p>
                  </div>
                  
                  <PrintfulConnectionTest />
                </div>
                
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-700">
                    If you need to update your Printful API key, please contact the website administrator. For security, API keys are stored in environment variables.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 p-4 rounded-md border mt-4">
                  <h4 className="font-medium mb-2">Integration Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Printful integration is ready for use. You can import products and process orders automatically.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => navigate("/admin/manage-products")}
            >
              Manage Products
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}