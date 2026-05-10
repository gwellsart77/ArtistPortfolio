import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
// Removed unused apiRequest import for type safety
import { cacheInvalidation } from "@/lib/cache-invalidation";
import { Mail, Settings, Save, ArrowLeft } from "lucide-react";
import { navigateBackToDashboard } from "@/lib/navigation-utils";

// TypeScript interface for commission settings API response
interface CommissionSettingsData {
  id: number;
  paintingMultiplier: number;
  muralMultiplier: number;
  artistEmail: string;
  autoReplySubject: string;
  autoReplyContent: string;
  updatedAt: string;
}

// Function to fetch commission settings
const fetchCommissionSettings = async (): Promise<CommissionSettingsData> => {
  const response = await fetch('/api/commission/settings', {
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Network response was not ok');
  }
  return response.json();
};

export default function CommissionSettings() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    paintingMultiplier: 0, // Will be loaded from database
    muralMultiplier: 0, // Will be loaded from database
    artistEmail: "", // Will be loaded from database
    autoReplySubject: "",
    autoReplyContent: "",
  });

  // Separate state for input values to prevent cursor jumping
  const [paintingInput, setPaintingInput] = useState("");
  const [muralInput, setMuralInput] = useState("");

  // Fetch current settings using public endpoint with proper TypeScript typing
  const { data: settings, isLoading, error } = useQuery<CommissionSettingsData, Error>({
    queryKey: ['publicCommissionSettings'],
    queryFn: fetchCommissionSettings,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Debug the API call
  console.log('🔍 Commission settings query state:', { settings, isLoading, error });

  // Fetch commission page enabled setting with aggressive fresh data fetching
  const { data: commissionPageSetting, isLoading: isLoadingPageSetting, refetch } = useQuery({
    queryKey: ['/api/settings/commission_page_enabled'],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache this critical setting
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Get toggle state directly from database with explicit string comparison
  const commissionPageEnabled = commissionPageSetting?.value === "true" ? true : false;

  // Force refetch on component mount to ensure we have latest data
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Update form data when settings are loaded from database
  useEffect(() => {
    if (settings) {
      console.log('✅ Loading actual database settings:', settings);
      console.log('🔄 Updating form data with database values...');
      setFormData({
        paintingMultiplier: settings.paintingMultiplier,
        muralMultiplier: settings.muralMultiplier,
        artistEmail: settings.artistEmail,
        autoReplySubject: settings.autoReplySubject,
        autoReplyContent: settings.autoReplyContent,
      });
      // Set input values to match database values
      setPaintingInput(settings.paintingMultiplier.toString());
      setMuralInput(settings.muralMultiplier.toString());
      console.log('✅ Form data updated!');
    }
  }, [settings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔄 Starting commission settings save with data:', data);
      try {
        const response = await fetch('/api/admin/commission/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update settings: ${response.status} ${errorText}`);
        }
        return response.json();
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Settings Updated",
        description: "Commission settings updated successfully!",
      });
      // Update the form data with the saved values
      setFormData({
        paintingMultiplier: data.paintingMultiplier,
        muralMultiplier: data.muralMultiplier,
        artistEmail: data.artistEmail,
        autoReplySubject: data.autoReplySubject,
        autoReplyContent: data.autoReplyContent,
      });
      // Use automatic cache invalidation
      cacheInvalidation.commissions();
      cacheInvalidation.settings();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission/settings'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/commission/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update page toggle mutation
  const updatePageToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: 'commission_page_enabled',
          value: enabled ? 'true' : 'false'
        })
      });
      if (!response.ok) throw new Error('Failed to update page setting');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Commission page visibility updated successfully!",
      });
      // Use automatic cache invalidation
      cacheInvalidation.settings();
      queryClient.invalidateQueries({ queryKey: ['/api/settings/commission_page_enabled'] });
      queryClient.refetchQueries({ queryKey: ['/api/settings/commission_page_enabled'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update page setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    // Validate required fields
    if (!formData.artistEmail || formData.artistEmail.trim() === "" || formData.artistEmail === "artist@example.com") {
      toast({
        title: "Missing Information",
        description: "Please enter a valid artist email address.",
        variant: "destructive",
      });
      return;
    }

    const paintingValue = parseFloat(formData.paintingMultiplier.toString());
    const muralValue = parseFloat(formData.muralMultiplier.toString());
    
    if (paintingValue <= 0 || muralValue <= 0) {
      toast({
        title: "Invalid Values",
        description: "Price multipliers must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      paintingMultiplier: paintingValue,
      muralMultiplier: muralValue
    };
    
    console.log('Submitting commission settings:', submitData);
    updateSettingsMutation.mutate(submitData);
  };

  const handlePageToggleChange = (checked: boolean) => {
    updatePageToggleMutation.mutate(checked);
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-serif">Commission Settings</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-serif">Commission Settings</h1>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            {/* Page Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="commission-page-toggle" className="text-base font-medium">
                  Enable Commission Requests
                </Label>
                <p className="text-sm text-gray-600">
                  When enabled, visitors can submit commission requests through the Contact page
                </p>
              </div>
              <Switch
                id="commission-page-toggle"
                checked={commissionPageEnabled}
                onCheckedChange={handlePageToggleChange}
                disabled={isLoadingPageSetting}
              />
            </div>

      {/* Commission Request Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <CardTitle>Commission Request Management</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/admin/contact-management'}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Requests
              </Button>
            </div>
          </div>
          <CardDescription>
            Control whether commission request options appear in the Contact page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="commission-page-toggle" className="text-base font-medium">
                Enable Commission Requests
              </Label>
              <p className="text-sm text-gray-600">
                When enabled, visitors can submit commission requests through the Contact page
              </p>
            </div>
            <Switch
              id="commission-page-toggle"
              checked={commissionPageEnabled}
              onCheckedChange={handlePageToggleChange}
              disabled={isLoadingPageSetting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Form - Separate from toggle */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Price Calculator Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Price Calculator Settings
            </CardTitle>
            <CardDescription>
              Configure the multipliers used in your price estimators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="painting-multiplier">
                  Painting Multiplier (per square inch)
                </Label>
                <Input
                  id="painting-multiplier"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={paintingInput}
                  onChange={(e) => {
                    setPaintingInput(e.target.value);
                    setFormData({ 
                      ...formData, 
                      paintingMultiplier: parseFloat(e.target.value) || 0
                    });
                  }}
                  required
                  className="w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Price = Height × Width × {formData.paintingMultiplier}
                </p>
              </div>
              
              <div>
                <Label htmlFor="mural-multiplier">
                  Mural Multiplier (per square foot)
                </Label>
                <Input
                  id="mural-multiplier"
                  type="number"
                  step="1"
                  min="1"
                  value={muralInput}
                  onChange={(e) => {
                    setMuralInput(e.target.value);
                    setFormData({ 
                      ...formData, 
                      muralMultiplier: parseFloat(e.target.value) || 0
                    });
                  }}
                  required
                  className="w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Price = Height × Width × {formData.muralMultiplier}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Live Price Preview:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• 24" × 18" painting = ${(24 * 18 * parseFloat(formData.paintingMultiplier.toString())).toFixed(2)}</p>
                <p>• 8' × 12' mural = ${(8 * 12 * parseFloat(formData.muralMultiplier.toString())).toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-2">Prices update automatically as you adjust the multipliers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email & Response Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <CardTitle>Email & Response Management</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/admin/contact-management'}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Manage Inquiries
              </Button>
            </div>
            <CardDescription>
              Configure email notifications and automated customer responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Artist Email Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="artist-email" className="text-base font-medium">Artist Email Address</Label>
              <Input
                id="artist-email"
                type="email"
                value={formData.artistEmail}
                onChange={(e) => setFormData({ ...formData, artistEmail: e.target.value })}
                placeholder="contact@yourdomain.com"
                required
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-2">
                All commission requests and general inquiries will be sent to this email address
              </p>
            </div>
            
            {/* Auto-Reply Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="font-medium">Automated Customer Response</h4>
              </div>
              
              <div>
                <Label htmlFor="auto-reply-subject">Email Subject Line</Label>
                <Input
                  id="auto-reply-subject"
                  value={formData.autoReplySubject}
                  onChange={(e) => setFormData({ ...formData, autoReplySubject: e.target.value })}
                  placeholder="Thank you for your commission inquiry!"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="auto-reply-content">Response Message</Label>
                <Textarea
                  id="auto-reply-content"
                  rows={5}
                  value={formData.autoReplyContent}
                  onChange={(e) => setFormData({ ...formData, autoReplyContent: e.target.value })}
                  placeholder="Thank you for your interest in commissioning custom artwork! I have received your request and will get back to you within 24-48 hours to discuss your project in detail."
                  required
                  className="mt-1"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-600">
                    This message is automatically sent to customers when they submit any inquiry
                  </p>
                  <span className="text-xs text-gray-500">
                    {formData.autoReplyContent.length} characters
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateSettingsMutation.isPending}
            className="min-w-[120px]"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}