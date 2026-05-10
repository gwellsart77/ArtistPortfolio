import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Smartphone, Home, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MfaFormData {
  mfaCode: string;
  rememberDevice: boolean;
}

interface MfaFormProps {
  savedCredentials: { username: string; password: string };
  onBack: () => void;
}

export default function MfaForm({ savedCredentials, onBack }: MfaFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fresh useForm instance - completely isolated from login form
  const mfaForm = useForm<MfaFormData>({
    defaultValues: {
      mfaCode: "",
      rememberDevice: false,
    },
  });

  const mfaVerifyMutation = useMutation({
    mutationFn: async (data: MfaFormData) => {
      try {
        console.log("Attempting MFA verification with code:", data.mfaCode);
        
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: savedCredentials.username,
            password: savedCredentials.password,
            mfaCode: data.mfaCode,
            rememberDevice: data.rememberDevice,
          }),
          credentials: "include",
        });

        console.log("MFA verification response status:", response.status);
        const result = await response.json();
        console.log("MFA verification response data:", result);

        if (!response.ok) {
          throw new Error(result.message || "MFA verification failed");
        }

        return result;
      } catch (error) {
        console.error("MFA verification error:", error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log("MFA verification success:", data);
      
      if (!data.success) {
        toast({
          title: "Verification failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
        return;
      }
      
      // Show success notification
      toast({
        title: "Login successful",
        description: "You are now logged in as an administrator",
      });
      
      // Reset form
      mfaForm.reset();
      
      // AI CONSULTANT FIX: Set sessionStorage before navigation
      sessionStorage.setItem("admin_authenticated", "true");
      navigate("/admin/dashboard");
    },
    onError: (error: any) => {
      console.error("MFA verification mutation error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Please check your verification code and try again",
        variant: "destructive",
      });
    },
  });

  function onMfaSubmit(data: MfaFormData) {
    console.log("[MFA FORM] Submitting MFA code:", data.mfaCode);
    mfaVerifyMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-center">
          Verification Required
        </CardTitle>
        <CardDescription className="text-center">
          Enter the verification code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...mfaForm}>
          <form onSubmit={mfaForm.handleSubmit(onMfaSubmit)} className="space-y-6">
            <Alert className="bg-blue-50 border-blue-100">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                A verification code has been sent to your authenticator app. Please enter it below to complete login.
              </AlertDescription>
            </Alert>
            
            <FormField
              control={mfaForm.control}
              name="mfaCode"
              render={({ field }) => {
                // Debug logging to confirm fresh form state
                console.log("[MFA FORM DEBUG] Field value:", field.value);
                console.log("[MFA FORM DEBUG] Form values:", mfaForm.getValues());
                
                return (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      {/* Plain HTML input - proven to work with RHF field registration */}
                      <input 
                        {...field}
                        id="mfaCodeInput"
                        autoComplete="one-time-code"
                        type="text"
                        maxLength={6}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center tracking-wider text-lg"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        onChange={(e) => {
                          console.log("[MFA FORM DEBUG] Input changed to:", e.target.value);
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            
            {/* Remember Device Checkbox */}
            <FormField
              control={mfaForm.control}
              name="rememberDevice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Remember this device for 30 days
                    </FormLabel>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>Skip MFA on this trusted device</span>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={onBack}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="bg-[#b8860b] hover:bg-opacity-90"
                disabled={mfaVerifyMutation.isPending}
              >
                {mfaVerifyMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
          <Button 
            variant="ghost" 
            className="text-sm text-neutral-500 hover:text-neutral-700"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Website
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}