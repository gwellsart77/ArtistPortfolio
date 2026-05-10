import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BarChart, Eye, Globe, Shield, RefreshCcw } from "lucide-react";
import { navigateBackToDashboard } from "@/lib/navigation-utils";

export default function AnalyticsSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current analytics settings
  const { data: builtInAnalyticsEnabled } = useQuery({
    queryKey: ["/api/settings/built_in_analytics_enabled"],
  });

  const { data: googleAnalyticsEnabled } = useQuery({
    queryKey: ["/api/settings/google_analytics_enabled"],
  });

  const { data: googleAnalyticsId } = useQuery({
    queryKey: ["/api/settings/google_analytics_id"],
  });

  const [gaTrackingId, setGaTrackingId] = useState("");
  const [builtInEnabled, setBuiltInEnabled] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Update state when data loads
  useEffect(() => {
    if ((builtInAnalyticsEnabled as any)?.value !== undefined) {
      setBuiltInEnabled((builtInAnalyticsEnabled as any).value === "true");
    }
    if ((googleAnalyticsEnabled as any)?.value !== undefined) {
      setGoogleEnabled((googleAnalyticsEnabled as any).value === "true");
    }
    if ((googleAnalyticsId as any)?.value) {
      setGaTrackingId((googleAnalyticsId as any).value);
    }
  }, [builtInAnalyticsEnabled, googleAnalyticsEnabled, googleAnalyticsId]);

  // Mutation to update analytics settings
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("POST", "/api/admin/settings", { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Analytics settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update analytics settings.",
        variant: "destructive",
      });
    },
  });

  // Clear analytics data mutation
  const clearAnalyticsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/analytics/clear");
    },
    onSuccess: () => {
      toast({
        title: "Analytics Cleared",
        description: "All analytics data has been cleared successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear analytics data.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = async () => {
    try {
      // Save all settings
      await updateSettingMutation.mutateAsync({
        key: "built_in_analytics_enabled",
        value: builtInEnabled.toString(),
      });
      
      await updateSettingMutation.mutateAsync({
        key: "google_analytics_enabled",
        value: googleEnabled.toString(),
      });
      
      if (gaTrackingId) {
        await updateSettingMutation.mutateAsync({
          key: "google_analytics_id",
          value: gaTrackingId,
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateBackToDashboard(navigate)}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <span className="font-serif text-2xl text-primary font-bold">Analytics Settings</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure how you want to track visitor behavior and site performance. You can use built-in analytics, Google Analytics, or both.
          </p>
        </div>

        {/* Built-in Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Built-in Website Analytics
            </CardTitle>
            <CardDescription>
              Simple analytics tracking built into your website. Tracks page views, unique visitors, and basic metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Built-in Analytics</Label>
                <div className="text-sm text-gray-500">
                  Track visitors using the built-in analytics system
                </div>
              </div>
              <Switch
                checked={builtInEnabled}
                onCheckedChange={setBuiltInEnabled}
              />
            </div>

            {builtInEnabled && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Built-in Analytics Features:</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Page view tracking</li>
                  <li>• Unique visitor counting by IP address</li>
                  <li>• Session duration tracking</li>
                  <li>• Popular pages analysis</li>
                  <li>• Device type detection</li>
                </ul>
              </div>
            )}

            {builtInEnabled && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearAnalyticsMutation.mutate()}
                  disabled={clearAnalyticsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Clear Analytics Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Google Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Google Analytics Integration
            </CardTitle>
            <CardDescription>
              Use Google Analytics for advanced tracking and detailed insights. Provides comprehensive analytics with Google's powerful platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Google Analytics</Label>
                <div className="text-sm text-gray-500">
                  Track visitors using Google Analytics 4
                </div>
              </div>
              <Switch
                checked={googleEnabled}
                onCheckedChange={setGoogleEnabled}
              />
            </div>

            {googleEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ga-tracking-id">Google Analytics Measurement ID</Label>
                  <Input
                    id="ga-tracking-id"
                    placeholder="G-XXXXXXXXXX"
                    value={gaTrackingId}
                    onChange={(e) => setGaTrackingId(e.target.value)}
                  />
                  <div className="text-sm text-gray-500">
                    Find your Measurement ID in Google Analytics → Admin → Property → Data Streams
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Google Analytics Features:</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Advanced audience insights</li>
                    <li>• Real-time visitor tracking</li>
                    <li>• Conversion and goal tracking</li>
                    <li>• Geographic and demographic data</li>
                    <li>• Custom reports and dashboards</li>
                    <li>• Integration with other Google services</li>
                  </ul>
                </div>

                {!gaTrackingId && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Setup Required:</span>
                    </div>
                    <p className="text-sm text-amber-700">
                      To use Google Analytics, you need to provide your Measurement ID from your Google Analytics account.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <strong>For Basic Tracking:</strong> Use built-in analytics for simple visitor metrics and privacy-focused tracking.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <strong>For Advanced Insights:</strong> Enable Google Analytics for comprehensive data and professional reporting.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div>
                  <strong>For Best Coverage:</strong> Use both systems - built-in analytics as backup and Google Analytics for detailed insights.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingMutation.isPending}
            className="px-8"
          >
            {updateSettingMutation.isPending ? "Saving..." : "Save Analytics Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}