import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Shield, QrCode, CheckCircle, AlertCircle, Copy, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

const mfaSetupSchema = z.object({
  verificationCode: z.string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

type MfaSetupForm = z.infer<typeof mfaSetupSchema>;

export default function MultiFactorAuthentication() {
  const { toast } = useToast();
  const [setupStep, setSetupStep] = useState<'info' | 'setup' | 'verify' | 'complete'>('info');
  const [secretKey, setSecretKey] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const form = useForm<MfaSetupForm>({
    resolver: zodResolver(mfaSetupSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  // Check current MFA status
  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: ['/api/admin/mfa/status'],
    retry: false,
  });

  // Generate MFA secret
  const generateSecretMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/mfa/generate');
      return response.json();
    },
    onSuccess: (data) => {
      setSecretKey(data.secret);
      setQrCodeUrl(data.qrCode);
      setSetupStep('setup');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate MFA secret. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify and enable MFA
  const verifyMfaMutation = useMutation({
    mutationFn: async (data: MfaSetupForm) => {
      const response = await apiRequest('POST', '/api/admin/mfa/verify', {
        secret: secretKey,
        token: data.verificationCode,
      });
      return response.json();
    },
    onSuccess: () => {
      setSetupStep('complete');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mfa/status'] });
      toast({
        title: "MFA Enabled",
        description: "Multi-factor authentication has been successfully enabled for your account.",
      });
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disable MFA
  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/mfa/disable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mfa/status'] });
      setSetupStep('info');
      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled for your account.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disable MFA. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard",
    });
  };

  const onSubmit = (data: MfaSetupForm) => {
    verifyMfaMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Multi-Factor Authentication</h1>
          <p className="text-muted-foreground">Loading MFA status...</p>
        </div>
      </div>
    );
  }

  const isMfaEnabled = mfaStatus?.enabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Multi-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Enhance your account security with two-factor authentication
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Current Security Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isMfaEnabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {isMfaEnabled ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <p className={`font-semibold ${isMfaEnabled ? 'text-green-900' : 'text-yellow-900'}`}>
                {isMfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}
              </p>
              <p className={`text-sm ${isMfaEnabled ? 'text-green-700' : 'text-yellow-700'}`}>
                {isMfaEnabled 
                  ? 'Your account is protected with two-factor authentication.'
                  : 'Your account is not protected with two-factor authentication.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup/Management */}
      {!isMfaEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Enable Two-Factor Authentication</span>
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your admin account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {setupStep === 'info' && (
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-blue-900">How it works</h3>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>• Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</p>
                        <p>• Scan the QR code or enter the setup key manually</p>
                        <p>• Enter the 6-digit code from your app to complete setup</p>
                        <p>• You'll need your phone to log in from now on</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => generateSecretMutation.mutate()}
                  disabled={generateSecretMutation.isPending}
                  className="w-full"
                >
                  {generateSecretMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Start MFA Setup
                    </>
                  )}
                </Button>
              </div>
            )}

            {setupStep === 'setup' && (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <h3 className="font-semibold">Step 1: Scan QR Code</h3>
                  <div className="flex justify-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="MFA QR Code" className="border rounded-lg" />
                    ) : (
                      <div className="w-64 h-64 bg-gray-100 border rounded-lg flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Can't scan? Enter this key manually:
                    </p>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <code className="flex-1 text-sm font-mono">{secretKey}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(secretKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setSetupStep('verify')}
                  className="w-full"
                >
                  Continue to Verification
                </Button>
              </div>
            )}

            {setupStep === 'verify' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-center">Step 2: Enter Verification Code</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="verificationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>6-digit code from your authenticator app</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="123456"
                              className="text-center text-lg tracking-widest"
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
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify and Enable MFA'
                      )}
                    </Button>
                  </form>
                </Form>
                
                <Button 
                  variant="outline"
                  onClick={() => setSetupStep('setup')}
                  className="w-full"
                >
                  Back to QR Code
                </Button>
              </div>
            )}

            {setupStep === 'complete' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-900">MFA Successfully Enabled!</h3>
                <p className="text-sm text-green-700">
                  Your account is now protected with two-factor authentication. 
                  You'll need your authenticator app to log in from now on.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Manage Two-Factor Authentication</span>
            </CardTitle>
            <CardDescription>
              MFA is currently enabled for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  Two-Factor Authentication is Active
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your account is protected. You'll be prompted for a verification code when logging in.
              </p>
            </div>
            
            <Button 
              variant="destructive"
              onClick={() => disableMfaMutation.mutate()}
              disabled={disableMfaMutation.isPending}
              className="w-full"
            >
              {disableMfaMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable MFA'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}