import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
// Note: apiRequest import available if needed
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Password update form schema
const passwordFormSchema = z.object({
  currentUsername: z.string().min(1, "Current username is required"),
  currentPassword: z.string().min(1, "Current password is required"),
  newUsername: z.string().min(3, "Username must be at least 3 characters"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// MFA setup schema
const mfaSetupSchema = z.object({
  enableMfa: z.boolean(),
  verificationCode: z.string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers")
    .optional(),
});

export default function AccountSecurity() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("password");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupComplete, setMfaSetupComplete] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  
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
  
  // Get MFA status
  const { data: mfaStatus } = useQuery({
    queryKey: ["/api/admin/mfa-status"],
  });
  
  // Update MFA status when data is available
  useEffect(() => {
    if (mfaStatus && typeof mfaStatus === 'object' && 'enabled' in mfaStatus && mfaStatus.enabled) {
      setMfaEnabled(true);
      setMfaSetupComplete(true);
    }
  }, [mfaStatus]);
  
  // Password update form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentUsername: "",
      currentPassword: "",
      newUsername: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // MFA toggle form
  const mfaForm = useForm<z.infer<typeof mfaSetupSchema>>({
    resolver: zodResolver(mfaSetupSchema),
    defaultValues: {
      enableMfa: mfaEnabled,
      verificationCode: "",
    },
  });
  
  // Update credentials mutation
  const updateCredentialsMutation = useMutation<any, Error, z.infer<typeof passwordFormSchema>>({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      try {
        const response = await fetch("/api/admin/update-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentUsername: data.currentUsername,
            currentPassword: data.currentPassword,
            newUsername: data.newUsername,
            newPassword: data.newPassword
          }),
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update credentials");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Credentials update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Credentials updated",
        description: "Your administrator credentials have been updated successfully. Please use your new login credentials next time you log in.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update credentials. Please check your current username and password.",
        variant: "destructive",
      });
    }
  });
  
  // Setup MFA mutation
  const setupMfaMutation = useMutation<{qrCode: string, secret: string}, Error>({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/admin/setup-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to setup MFA");
        }
        
        const data = await response.json();
        return data as {qrCode: string, secret: string};
      } catch (error) {
        console.error("MFA setup error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data && data.qrCode && data.secret) {
        setMfaQrCode(data.qrCode);
        setMfaSecret(data.secret);
        setShowMfaSetup(true);
      }
    },
    onError: (error) => {
      toast({
        title: "MFA setup failed",
        description: error instanceof Error ? error.message : "Failed to setup multifactor authentication.",
        variant: "destructive",
      });
    }
  });
  
  // Verify and enable MFA mutation
  const verifyMfaMutation = useMutation<any, Error, { verificationCode: string, secret: string }>({
    mutationFn: async (data: { verificationCode: string, secret: string }) => {
      try {
        const response = await fetch("/api/admin/verify-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Verification failed");
        }
        
        return await response.json();
      } catch (error) {
        console.error("MFA verification error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setMfaEnabled(true);
      setMfaSetupComplete(true);
      setShowMfaSetup(false);
      toast({
        title: "MFA enabled",
        description: "Multifactor authentication has been successfully enabled for your account.",
      });
      mfaForm.reset({ enableMfa: true });
    },
    onError: (error) => {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Disable MFA mutation
  const disableMfaMutation = useMutation<unknown, Error>({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/admin/disable-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to disable MFA");
        }
        
        return await response.json();
      } catch (error) {
        console.error("MFA disable error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setMfaEnabled(false);
      setMfaSetupComplete(false);
      toast({
        title: "MFA disabled",
        description: "Multifactor authentication has been disabled for your account.",
      });
      mfaForm.reset({ enableMfa: false });
    },
    onError: (error) => {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "Failed to disable MFA.",
        variant: "destructive",
      });
      // Reset the switch to enabled since the operation failed
      mfaForm.reset({ enableMfa: true });
    }
  });
  
  // Password update form submission
  function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    updateCredentialsMutation.mutate(data);
  }
  
  // Handle MFA toggle
  function handleMfaToggle(checked: boolean) {
    if (checked && !mfaSetupComplete) {
      // User is enabling MFA and hasn't set it up yet
      setupMfaMutation.mutate();
    } else if (!checked && mfaSetupComplete) {
      // User is disabling MFA
      disableMfaMutation.mutate();
    }
  }
  
  // Verify and complete MFA setup
  function onMfaVerifySubmit(data: z.infer<typeof mfaSetupSchema>) {
    if (data.verificationCode && mfaSecret) {
      verifyMfaMutation.mutate({
        verificationCode: data.verificationCode,
        secret: mfaSecret
      });
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-serif">Account Security</h1>
        </div>
        
        <Tabs 
          defaultValue="password" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Password
            </TabsTrigger>
            <TabsTrigger value="mfa" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Multifactor Authentication
            </TabsTrigger>
          </TabsList>
          
          {/* Password Management Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Update Login Credentials
                </CardTitle>
                <CardDescription>
                  Change your administrator username and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                      <p className="text-sm text-amber-800">
                        You'll need to enter your current login details to verify your identity before making changes.
                      </p>
                    </div>
                  </div>
                  
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your current username" 
                                  {...field}
                                  type="text"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your current password" 
                                  {...field}
                                  type="password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="py-2">
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">New Credentials</h4>
                          <div className="h-px bg-neutral-200 w-full" />
                        </div>
                        
                        <FormField
                          control={passwordForm.control}
                          name="newUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter new username" 
                                  {...field}
                                  type="text"
                                />
                              </FormControl>
                              <FormDescription>
                                Choose a username that's easy for you to remember but difficult for others to guess.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter new password" 
                                  {...field}
                                  type="password"
                                />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters with uppercase, lowercase, and numbers.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Confirm new password" 
                                  {...field}
                                  type="password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={updateCredentialsMutation.isPending}
                      >
                        {updateCredentialsMutation.isPending ? (
                          <>
                            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Update Credentials
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* MFA Tab */}
          <TabsContent value="mfa">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Multifactor Authentication
                </CardTitle>
                <CardDescription>
                  Add an additional layer of security to your admin account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <div className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">
                          Enhanced Security with Two-Factor Authentication
                        </p>
                        <p>
                          With MFA enabled, you'll need both your password and a verification code from your authenticator app to sign in.
                          This adds a crucial layer of security to protect your admin account.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-lg font-medium">Enable Multifactor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Require a verification code from your authenticator app when signing in
                      </p>
                    </div>
                    <Form {...mfaForm}>
                      <FormField
                        control={mfaForm.control}
                        name="enableMfa"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleMfaToggle(checked);
                                }}
                                disabled={
                                  setupMfaMutation.isPending || 
                                  verifyMfaMutation.isPending || 
                                  disableMfaMutation.isPending
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </Form>
                  </div>
                  
                  {/* MFA Setup */}
                  {showMfaSetup && mfaQrCode && (
                    <div className="space-y-6 py-4 border-t border-gray-100">
                      <h3 className="text-lg font-medium">Set up Authenticator App</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="text-sm space-y-2">
                            <p className="font-medium">Step 1: Scan QR Code</p>
                            <p className="text-muted-foreground">
                              Use your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator) to scan the QR code.
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-md border">
                            {/* Display QR code */}
                            <div className="flex justify-center">
                              <img 
                                src={mfaQrCode} 
                                alt="QR Code for authenticator app" 
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <p className="font-medium">Secret Key (if QR code doesn't work):</p>
                            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                              {mfaSecret}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="text-sm space-y-2">
                            <p className="font-medium">Step 2: Verify Code</p>
                            <p className="text-muted-foreground">
                              Enter the 6-digit verification code from your authenticator app to confirm setup.
                            </p>
                          </div>
                          
                          <Form {...mfaForm}>
                            <form onSubmit={mfaForm.handleSubmit(onMfaVerifySubmit)} className="space-y-4">
                              <FormField
                                control={mfaForm.control}
                                name="verificationCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter 6-digit code" 
                                        {...field}
                                        maxLength={6}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <Button 
                                type="submit" 
                                className="w-full"
                                disabled={verifyMfaMutation.isPending}
                              >
                                {verifyMfaMutation.isPending ? (
                                  <>
                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                    Verifying...
                                  </>
                                ) : (
                                  "Verify and Enable"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  {(!showMfaSetup || mfaSetupComplete) && (
                    <div className="py-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${mfaEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <p className="text-sm font-medium">
                          {mfaEnabled 
                            ? "Multifactor authentication is enabled" 
                            : "Multifactor authentication is disabled"}
                        </p>
                      </div>
                      {mfaEnabled && (
                        <p className="text-sm text-muted-foreground mt-2">
                          You will be required to enter a verification code from your authenticator app when signing in.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}