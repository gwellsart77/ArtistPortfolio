import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
// apiRequest imported but not used in this component
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  onRequireMfa: (credentials: { username: string; password: string }) => void;
}

export default function LoginForm({ onRequireMfa }: LoginFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      try {
        console.log("Attempting login with:", data);
        
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        });

        console.log("Login response status:", response.status);
        const result = await response.json();
        console.log("Login response data:", result);

        if (!response.ok) {
          throw new Error(result.message || "Login failed");
        }

        return result;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Login success:", data);
      
      if (data.requireMfa) {
        // Pass credentials to parent for MFA flow
        onRequireMfa({
          username: form.getValues().username,
          password: form.getValues().password
        });
        return;
      }
      
      // Complete login success - set auth state immediately
      sessionStorage.setItem("admin_authenticated", "true");
      
      toast({
        title: "Login successful",
        description: "You are now logged in as an administrator",
      });
      
      // Navigate after a slight delay to ensure storage is set
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-center">
          Admin Login
        </CardTitle>
        <CardDescription className="text-center">
          Log in to access the artwork management area
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter your username" 
                      autoComplete="username"
                      required 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      placeholder="Enter your password" 
                      autoComplete="current-password"
                      required 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-[#b8860b] hover:bg-opacity-90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            
            <div className="text-sm text-neutral-500 mt-4 text-center">
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm text-[#b8860b] hover:text-opacity-80"
                onClick={() => navigate("/admin/forgot-password")}
              >
                Forgot password?
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