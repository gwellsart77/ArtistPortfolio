import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheInvalidation } from "@/lib/cache-invalidation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, Truck, MapPin, Globe, ExternalLink, RefreshCw, AlertCircle, Check, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Package, X, Info } from "lucide-react";
import { navigateBackToDashboard } from "@/lib/navigation-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Drop Shipping Provider Connection Tests
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
          title: "Printful Connection Successful",
          description: "Successfully connected to Printful API",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Printful Connection Failed",
          description: data.message || "Failed to connect to Printful API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Printful Connection Error",
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
          <Check className="mr-2 h-4 w-4" />
          Connected
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Failed
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
}

function GootenConnectionTest() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('testing');
    
    try {
      const response = await apiRequest('GET', '/api/admin/gooten/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Gooten Connection Successful",
          description: "Successfully connected to Gooten API",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Gooten Connection Failed",
          description: data.message || "Failed to connect to Gooten API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Gooten Connection Error",
        description: "Error connecting to Gooten API",
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
          <Check className="mr-2 h-4 w-4" />
          Connected
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Failed
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
}

function ShipstationConnectionTest() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('testing');
    
    try {
      const response = await apiRequest('GET', '/api/admin/shipstation/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Shipstation Connection Successful",
          description: "Successfully connected to Shipstation API",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Shipstation Connection Failed",
          description: data.message || "Failed to connect to Shipstation API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Shipstation Connection Error",
        description: "Error connecting to Shipstation API",
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
          <Check className="mr-2 h-4 w-4" />
          Connected
        </>
      ) : connectionStatus === 'error' ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Failed
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
}

export default function ShopSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Shop settings
  const [studioAddress, setStudioAddress] = useState("");
  const [useDropShipping, setUseDropShipping] = useState(false);
  const [dropShippingAddress, setDropShippingAddress] = useState("");
  const [shippingOrigin, setShippingOrigin] = useState("studio");
  const [shippingName, setShippingName] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  
  // Shop category management state
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const [newShopCategory, setNewShopCategory] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [pricePerSquareInch, setPricePerSquareInch] = useState("2.50");
  

  
  // Track changes for save button
  const [isChanged, setIsChanged] = useState(false);
  
  // State for Gooten product import
  const [isImportingProducts, setIsImportingProducts] = useState(false);
  
  // State for Shipstation integration
  const [shipstationApiKey, setShipstationApiKey] = useState("");
  const [shipstationApiSecret, setShipstationApiSecret] = useState("");
  const [shipstationStoreId, setShipstationStoreId] = useState("");
  const [shipstationWebhook, setShipstationWebhook] = useState("");
  const [isSyncingShipstation, setIsSyncingShipstation] = useState(false);
  const [isSavingShipstation, setIsSavingShipstation] = useState(false);
  
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
  
  // Get shop page settings
  const { data: shopPageData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_page_enabled"],
    queryFn: () => apiRequest("GET", "/api/settings/shop_page_enabled").then(res => res.json()),
  });

  const { data: shopPageNameData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_page_name"],
    queryFn: () => apiRequest("GET", "/api/settings/shop_page_name").then(res => res.json()),
  });

  const { data: shopDescriptionData } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_description"],
    queryFn: () => apiRequest("GET", "/api/settings/shop_description").then(res => res.json()),
  });

  // Get shipping settings
  const { data: studioAddressSetting, isLoading: studioAddressLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_studio_address"],
  });
  
  const { data: dropShippingSetting, isLoading: dropShippingLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_use_drop_shipping"],
  });
  
  const { data: dropShippingAddressSetting, isLoading: dropShippingAddressLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_drop_address"],
  });
  
  const { data: shippingOriginSetting, isLoading: shippingOriginLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_origin"],
  });
  
  const { data: shippingNameSetting, isLoading: shippingNameLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_contact_name"],
  });
  
  const { data: shippingEmailSetting, isLoading: shippingEmailLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_contact_email"],
  });
  
  const { data: shippingPhoneSetting, isLoading: shippingPhoneLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shipping_contact_phone"],
  });
  
  const { data: pricePerSquareInchSetting, isLoading: pricePerSquareInchLoading } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/price_per_square_inch"],
  });
  
  // Fetch shop categories from settings
  const { data: shopCategoriesSetting } = useQuery<{ key: string, value: string }>({
    queryKey: ["/api/settings/shop_categories"],
  });
  
  // Set shipping settings when data is loaded
  useEffect(() => {
    if (studioAddressSetting?.value) {
      setStudioAddress(studioAddressSetting.value);
    }
    
    if (dropShippingSetting?.value) {
      setUseDropShipping(dropShippingSetting.value === "true");
    }
    
    if (dropShippingAddressSetting?.value) {
      setDropShippingAddress(dropShippingAddressSetting.value);
    }
    
    if (shippingOriginSetting?.value) {
      setShippingOrigin(shippingOriginSetting.value);
    }
    
    if (shippingNameSetting?.value) {
      setShippingName(shippingNameSetting.value);
    }
    
    if (shippingEmailSetting?.value) {
      setShippingEmail(shippingEmailSetting.value);
    }
    
    if (shippingPhoneSetting?.value) {
      setShippingPhone(shippingPhoneSetting.value);
    }
    
    if (pricePerSquareInchSetting?.value) {
      setPricePerSquareInch(pricePerSquareInchSetting.value);
    }
    
    // Load shop categories
    if (shopCategoriesSetting?.value) {
      try {
        const categories = JSON.parse(shopCategoriesSetting.value);
        setShopCategories(categories);
      } catch (error) {
        console.error("Error parsing shop categories:", error);
        setShopCategories(["originals", "prints", "limited-edition", "merchandise"]);
      }
    } else {
      setShopCategories(["originals", "prints", "limited-edition", "merchandise"]);
    }
  }, [
    studioAddressSetting,
    dropShippingSetting,
    dropShippingAddressSetting,
    shippingOriginSetting,
    shippingNameSetting,
    shippingEmailSetting,
    shippingPhoneSetting,
    pricePerSquareInchSetting,
    shopCategoriesSetting
  ]);
  
  // Shop category management functions
  const addShopCategory = async () => {
    if (!newShopCategory.trim()) return;
    
    const categorySlug = newShopCategory.toLowerCase().replace(/\s+/g, '-');
    if (shopCategories.includes(categorySlug)) {
      toast({
        title: "Category exists",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = [...shopCategories, categorySlug];
    setShopCategories(updatedCategories);
    setNewShopCategory("");

    try {
      await saveMutation.mutateAsync({
        key: "shop_categories",
        value: JSON.stringify(updatedCategories)
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shop_categories"] });
    } catch (error) {
      toast({
        title: "Error saving category",
        description: "Failed to save the new category",
        variant: "destructive",
      });
    }
  };

  const removeShopCategory = async (categoryToRemove: string) => {
    const updatedCategories = shopCategories.filter(cat => cat !== categoryToRemove);
    setShopCategories(updatedCategories);

    try {
      await saveMutation.mutateAsync({
        key: "shop_categories",
        value: JSON.stringify(updatedCategories)
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shop_categories"] });
      toast({
        title: "Category removed",
        description: "Shop category has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error removing category",
        description: "Failed to remove the category",
        variant: "destructive",
      });
    }
  };

  const moveShopCategory = async (fromIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && fromIndex === 0) ||
      (direction === 'down' && fromIndex === shopCategories.length - 1)
    ) {
      return;
    }

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    const newCategories = [...shopCategories];
    [newCategories[fromIndex], newCategories[toIndex]] = [newCategories[toIndex], newCategories[fromIndex]];
    
    setShopCategories(newCategories);

    try {
      await saveMutation.mutateAsync({
        key: "shop_categories",
        value: JSON.stringify(newCategories)
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shop_categories"] });
    } catch (error) {
      toast({
        title: "Error reordering categories",
        description: "Failed to save category order",
        variant: "destructive",
      });
    }
  };



  // Shop settings change handlers
  const handleStudioAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStudioAddress(e.target.value);
    setIsChanged(true);
  };
  
  const handleDropShippingToggle = (value: boolean) => {
    setUseDropShipping(value);
    setIsChanged(true);
  };
  
  const handleDropShippingAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDropShippingAddress(e.target.value);
    setIsChanged(true);
  };
  
  const handleShippingOriginChange = (value: string) => {
    setShippingOrigin(value);
    setIsChanged(true);
  };
  
  const handleShippingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingName(e.target.value);
    setIsChanged(true);
  };
  
  const handleShippingEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingEmail(e.target.value);
    setIsChanged(true);
  };
  
  const handleShippingPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingPhone(e.target.value);
    setIsChanged(true);
  };
  
  const handlePricePerSquareInchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPricePerSquareInch(e.target.value);
    setIsChanged(true);
  };

  // Handle importing products from Gooten (placeholder for now)
  const handleImportGootenProducts = async () => {
    if (isImportingProducts) return;
    
    setIsImportingProducts(true);
    try {
      // Show a message about future functionality
      setTimeout(() => {
        toast({
          title: "Coming Soon",
          description: "Automatic Gooten product import will be available in the next update. For now, you can manually add products from your Gooten account.",
        });
        setIsImportingProducts(false);
      }, 1500);
      
      // In the future, this will call the actual import API
      // const response = await apiRequest('POST', '/api/admin/gooten/import-products');
      // const data = await response.json();
    } catch (error) {
      console.error("Error importing Gooten products:", error);
      toast({
        title: "Operation Unavailable",
        description: "Gooten integration is currently in setup mode. Please check back in the next update.",
        variant: "destructive",
      });
      setIsImportingProducts(false);
    }
  };

  // Shipstation handler functions
  const handleAddShipstationProduct = async () => {
    toast({
      title: "Feature coming soon",
      description: "Shipstation product addition will be available soon",
    });
  };

  const handleSyncShipstationStores = async () => {
    setIsSyncingShipstation(true);
    
    try {
      const response = await apiRequest('POST', '/api/admin/shipstation/sync-stores');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Stores synced successfully",
          description: `Synced ${data.count || 0} stores from Shipstation`,
        });
      } else {
        toast({
          title: "Sync failed",
          description: data.message || "Failed to sync stores from Shipstation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing Shipstation stores:", error);
      toast({
        title: "Sync error",
        description: "An error occurred while syncing stores",
        variant: "destructive",
      });
    } finally {
      setIsSyncingShipstation(false);
    }
  };

  const handleSaveShipstationSettings = async () => {
    setIsSavingShipstation(true);
    
    try {
      const settings = [
        { key: "shipstation_api_key", value: shipstationApiKey },
        { key: "shipstation_api_secret", value: shipstationApiSecret },
        { key: "shipstation_store_id", value: shipstationStoreId },
        { key: "shipstation_webhook", value: shipstationWebhook }
      ];
      
      for (const setting of settings) {
        await saveMutation.mutateAsync(setting);
      }
      
      toast({
        title: "Shipstation settings saved",
        description: "Your Shipstation integration settings have been saved successfully",
      });
    } catch (error) {
      console.error("Error saving Shipstation settings:", error);
      toast({
        title: "Save error",
        description: "Failed to save Shipstation settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingShipstation(false);
    }
  };
  
  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_studio_address"] });
      toast({
        title: "Settings saved",
        description: "Your shipping settings have been updated successfully",
      });
      setIsChanged(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: "An error occurred while saving your settings",
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
    }
  });
  
  const handleSave = async () => {
    const settingsToSave = [
      { key: "shipping_studio_address", value: studioAddress },
      { key: "shipping_use_drop_shipping", value: useDropShipping.toString() },
      { key: "shipping_drop_address", value: dropShippingAddress },
      { key: "shipping_origin", value: shippingOrigin },
      { key: "shipping_contact_name", value: shippingName },
      { key: "shipping_contact_email", value: shippingEmail },
      { key: "shipping_contact_phone", value: shippingPhone },
      { key: "price_per_square_inch", value: pricePerSquareInch },
      // Include shop page settings
      { key: "shop_page_enabled", value: shopPageData?.value || "false" },
      { key: "shop_page_name", value: shopPageNameData?.value || "Shop" },
      { key: "shop_description", value: shopDescriptionData?.value || "" }
    ];
    
    try {
      for (const setting of settingsToSave) {
        await saveMutation.mutateAsync(setting);
      }
      
      // Invalidate all setting queries
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_studio_address"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_use_drop_shipping"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_drop_address"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_origin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_contact_name"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_contact_email"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shipping_contact_phone"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/price_per_square_inch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shop_page_enabled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shop_page_name"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shop_description"] });
      
      toast({
        title: "Settings saved",
        description: "Your shipping settings have been updated successfully",
      });
      setIsChanged(false);
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "An error occurred while saving your settings",
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
    }
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
          <h1 className="text-3xl font-serif">Shop Settings</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Shop & Shipping Settings
            </CardTitle>
            <CardDescription>
              Configure your shipping information and product fulfillment options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Settings</TabsTrigger>
                <TabsTrigger value="categories">Shop Categories</TabsTrigger>
                <TabsTrigger value="shipstation">Shipstation Integration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                {/* Shop Enable/Disable Toggle */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Shop Page Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="shop-enabled" className="text-base font-medium">Enable Shop Page</Label>
                      <p className="text-sm text-muted-foreground">
                        Control whether the Shop page appears in your website navigation menu.
                      </p>
                    </div>
                    <Switch
                      id="shop-enabled"
                      checked={shopPageData?.value === "true"}
                      onCheckedChange={(checked) => {
                        setIsChanged(true);
                        queryClient.setQueryData(
                          ["/api/settings/shop_page_enabled"], 
                          { value: checked ? "true" : "false" }
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Shop Page Name */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Page Configuration</h3>
                  
                  <div>
                    <Label htmlFor="shop-page-name">Navigation Menu Name</Label>
                    <Input 
                      id="shop-page-name"
                      placeholder="Shop"
                      value={shopPageNameData?.value || ""}
                      onChange={(e) => {
                        setIsChanged(true);
                        queryClient.setQueryData(
                          ["/api/settings/shop_page_name"], 
                          { value: e.target.value }
                        );
                      }}
                      className="mt-1.5"
                    />
                    <p className="text-sm text-muted-foreground mt-1.5">
                      This is what visitors will see in the navigation menu.
                    </p>
                  </div>
                </div>

                {/* Shop Description */}
                <div>
                  <h3 className="text-lg font-medium">Shop Description</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    The description text that appears at the top of your shop page
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="shop-description">Description</Label>
                    <Textarea 
                      id="shop-description" 
                      value={shopDescriptionData?.value || ""}
                      onChange={(e) => {
                        setIsChanged(true);
                        queryClient.setQueryData(
                          ["/api/settings/shop_description"], 
                          { value: e.target.value }
                        );
                      }}
                      placeholder="Enter a description for your shop page"
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="shipping" className="space-y-6">


                {/* Studio Address */}
                <div>
                  <Label htmlFor="studio-address">Studio Address</Label>
                  <div className="mt-1.5">
                    <Textarea 
                      id="studio-address"
                      placeholder="602 W 2nd Ave, Denver, CO 80223"
                      value={studioAddress}
                      onChange={handleStudioAddressChange}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1.5">
                      This is your primary shipping address. It will be used for shipping calculations.
                    </p>
                  </div>
                </div>
                
                {/* Shipping Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Shipping Contact Information</h3>
                  
                  <div>
                    <Label htmlFor="shipping-name">Contact Name</Label>
                    <Input 
                      id="shipping-name"
                      placeholder="Gabe Wells"
                      value={shippingName}
                      onChange={handleShippingNameChange}
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping-email">Contact Email</Label>
                    <Input 
                      id="shipping-email"
                      type="email"
                      placeholder="your@email.com"
                      value={shippingEmail}
                      onChange={handleShippingEmailChange}
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping-phone">Contact Phone</Label>
                    <Input 
                      id="shipping-phone"
                      placeholder="(555) 123-4567"
                      value={shippingPhone}
                      onChange={handleShippingPhoneChange}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                
                {/* Drop Shipping Options */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-medium">Drop Shipping Options</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="drop-shipping" 
                      checked={useDropShipping}
                      onCheckedChange={handleDropShippingToggle}
                    />
                    <Label htmlFor="drop-shipping" className="font-normal">Enable drop shipping option</Label>
                  </div>
                  
                  {useDropShipping && (
                    <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                      <div>
                        <Label htmlFor="drop-shipping-address">Drop Shipping Address</Label>
                        <div className="mt-1.5">
                          <Textarea 
                            id="drop-shipping-address"
                            placeholder="Your drop shipping partner's address"
                            value={dropShippingAddress}
                            onChange={handleDropShippingAddressChange}
                            rows={3}
                          />
                          <p className="text-sm text-muted-foreground mt-1.5">
                            This address will be used when drop shipping is active.
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Select Active Shipping Origin</Label>
                        <RadioGroup 
                          className="mt-2"
                          value={shippingOrigin} 
                          onValueChange={handleShippingOriginChange}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="studio" id="origin-studio" />
                            <Label htmlFor="origin-studio" className="font-normal">Ship from Studio</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="drop_shipping" id="origin-drop" />
                            <Label htmlFor="origin-drop" className="font-normal">Ship from Drop Shipping Address</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                    <h4 className="text-sm font-semibold text-green-800 flex items-center">
                      <Check className="h-4 w-4 mr-2" /> Gooten Integration Active
                    </h4>
                    <p className="mt-2 text-sm text-green-700">
                      Your Gooten account is connected. Use the Gooten tab to import products and manage your integration.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="categories" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Shop Categories</h3>
                    <div className="text-sm text-muted-foreground">
                      Manage how your products are organized in the shop
                    </div>
                  </div>
                  
                  {/* Add New Category */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <Label htmlFor="new-shop-category" className="text-sm font-medium">
                      Add New Category
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="new-shop-category"
                        placeholder="Category name (e.g., Canvas Prints)"
                        value={newShopCategory}
                        onChange={(e) => setNewShopCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addShopCategory()}
                      />
                      <Button 
                        onClick={addShopCategory}
                        disabled={!newShopCategory.trim()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Current Categories */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Current Categories</Label>
                    {shopCategories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No categories yet. Add your first category above.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {shopCategories.map((category, index) => {
                          const displayName = category.split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                            
                          return (
                            <div
                              key={category}
                              className="flex items-center justify-between p-3 bg-background border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{displayName}</span>
                                  <span className="text-xs text-muted-foreground">Slug: {category}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveShopCategory(index, 'up')}
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveShopCategory(index, 'down')}
                                  disabled={index === shopCategories.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeShopCategory(category)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                      <Info className="h-4 w-4 mr-2" /> Category Organization Tips
                    </h4>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• Categories help customers find products easily</li>
                      <li>• Use descriptive names like "Canvas Prints" or "Limited Editions"</li>
                      <li>• Categories are automatically synced across the shop interface</li>
                      <li>• Drag to reorder categories by importance</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              

              
              <TabsContent value="shipstation" className="space-y-6">
                {/* Shipstation Integration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Truck className="mr-2 h-5 w-5" />
                        Shipstation Integration
                        <Badge variant="secondary" className="ml-2">Shipping Platform</Badge>
                      </span>
                      <ShipstationConnectionTest />
                    </CardTitle>
                    <CardDescription>
                      Professional shipping management platform for automated order processing and multi-carrier shipping.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Shipstation is a comprehensive shipping platform that automates order fulfillment with multiple carriers (UPS, FedEx, USPS, DHL). Perfect for professional shipping management and tracking.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shipstation-api-key">Shipstation API Key</Label>
                        <Input 
                          id="shipstation-api-key"
                          type="password"
                          placeholder="Enter your Shipstation API Key"
                          value={shipstationApiKey}
                          onChange={(e) => setShipstationApiKey(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          API Key from your Shipstation account
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="shipstation-api-secret">Shipstation API Secret</Label>
                        <Input 
                          id="shipstation-api-secret"
                          type="password"
                          placeholder="Enter your Shipstation API Secret"
                          value={shipstationApiSecret}
                          onChange={(e) => setShipstationApiSecret(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          API Secret from your Shipstation account
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="shipstation-store-id">Default Store ID</Label>
                        <Input 
                          id="shipstation-store-id"
                          placeholder="Enter your Store ID"
                          value={shipstationStoreId}
                          onChange={(e) => setShipstationStoreId(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Your default Store ID in Shipstation
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="shipstation-webhook">Webhook URL</Label>
                        <Input 
                          id="shipstation-webhook"
                          placeholder="Enter webhook URL"
                          value={shipstationWebhook}
                          onChange={(e) => setShipstationWebhook(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Webhook URL for order status updates
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="secondary"
                        onClick={handleAddShipstationProduct}
                        className="flex items-center"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                      
                      <Button 
                        onClick={handleSyncShipstationStores}
                        className="flex items-center"
                        disabled={isSyncingShipstation}
                      >
                        {isSyncingShipstation ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Truck className="mr-2 h-4 w-4" />
                            Sync Stores
                          </>
                        )}
                      </Button>
                      
                      <Button onClick={handleSaveShipstationSettings} disabled={isSavingShipstation} variant="outline">
                        <Save className="mr-2 h-4 w-4" />
                        {isSavingShipstation ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Shipping Solutions Overview */}
                <div className="border p-4 rounded-lg bg-card shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Complete Shipping Solutions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your shop integrates with professional fulfillment services to handle different types of products and shipping needs.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        Drop Shipping
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Automated print-on-demand (Printful & Gooten)</li>
                        <li>• No inventory management needed</li>
                        <li>• Global fulfillment networks</li>
                        <li>• Custom artwork printing</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => navigate("/admin/dropshipping")}
                      >
                        Manage Drop Shipping
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <Truck className="mr-2 h-4 w-4" />
                        Shipstation (Professional Shipping)
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Multi-carrier shipping (UPS, FedEx, USPS, DHL)</li>
                        <li>• Original artwork shipments</li>
                        <li>• Professional order management</li>
                        <li>• Advanced tracking & automation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigateBackToDashboard(navigate)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending || !isChanged}
            >
              {saveMutation.isPending ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}