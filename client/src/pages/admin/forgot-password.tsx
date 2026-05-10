import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Home, ArrowLeft, Mail, KeyRound, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Email request form schema
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Reset form schema
const resetFormSchema = z.object({
  resetCode: z.string().min(6, "Please enter the 6-digit code"),
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

type EmailFormData = z.infer<typeof emailFormSchema>;
type ResetFormData = z.infer<typeof resetFormSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [stage, setStage] = useState<'email' | 'resetCode' | 'success'>('email');
  
  // Email request form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Reset password form
  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      resetCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Request reset code
  async function onEmailSubmit(data: EmailFormData) {
    try {
      console.log("Password reset requested for:", data.email);
      
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: data.email }),
        credentials: "include"
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: "Reset code sent to your email",
          description: "Please check your email for the reset code",
        });
        
        // Always advance to the reset code stage regardless of whether a code is returned
        // The code will now only be sent via email, not displayed in the UI
        setStage('resetCode');
      } else {
        toast({
          title: "Request failed",
          description: responseData.message || "There was a problem processing your request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast({
        title: "Request failed",
        description: "There was a problem processing your request. Please try again later.",
        variant: "destructive",
      });
    }
  }
  
  // Apply reset with code and new password
  async function onResetSubmit(data: ResetFormData) {
    try {
      const response = await fetch("/api/admin/apply-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resetCode: data.resetCode,
          newPassword: data.newPassword,
        }),
        credentials: "include"
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now log in with your new password.",
        });
        setStage('success');
      } else {
        toast({
          title: "Reset failed",
          description: responseData.message || "There was a problem resetting your password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error applying password reset:", error);
      toast({
        title: "Reset failed",
        description: "There was a problem processing your request. Please try again later.",
        variant: "destructive",
      });
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin/login")}
              className="mr-2 p-0 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-serif">Reset Password</CardTitle>
          </div>
          <CardDescription>
            {stage === 'email' && "Enter your email address to receive a reset code"}
            {stage === 'resetCode' && "Enter the reset code and your new password"}
            {stage === 'success' && "Your password has been reset successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === 'email' && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#b8860b] hover:bg-opacity-90 mt-2"
                  disabled={emailForm.formState.isSubmitting}
                >
                  {emailForm.formState.isSubmitting ? "Sending..." : "Get Reset Code"}
                </Button>
              </form>
            </Form>
          )}
          
          {stage === 'resetCode' && (
            <>
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Check Your Email</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      A reset code has been sent to your email address. Please check your inbox and enter the 6-digit code below.
                    </p>
                  </div>
                </div>
              </div>
              
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="resetCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reset Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter 6-digit code" 
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Enter new password" 
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Confirm new password" 
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#b8860b] hover:bg-opacity-90 mt-2"
                    disabled={resetForm.formState.isSubmitting}
                  >
                    {resetForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            </>
          )}
          
          {stage === 'success' && (
            <div className="text-center p-6">
              <KeyRound className="h-12 w-12 mx-auto text-[#b8860b] mb-4" />
              <h3 className="text-lg font-medium mb-2">Password Reset Successful</h3>
              <p className="text-neutral-600 mb-4">
                Your password has been updated successfully. You can now log in with your new password.
              </p>
              <Button
                className="mt-2"
                onClick={() => navigate("/admin/login")}
              >
                Return to login
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            className="flex items-center text-neutral-600 hover:text-[#b8860b]"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Website
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}