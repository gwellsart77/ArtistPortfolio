// Removed unused useState import for type safety
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { newsletterFormSchema, type InsertSubscriber } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewsletterSignup() {
  const { toast } = useToast();
  
  const form = useForm<InsertSubscriber>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (formData: InsertSubscriber) => {
      const response = await apiRequest("POST", "/api/newsletter", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message || "Thank you for subscribing to our newsletter!",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to subscribe: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertSubscriber) {
    newsletterMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="Your Email"
                  className="px-4 py-3 bg-white bg-opacity-10 border border-neutral-700 rounded-sm rounded-r-none focus:border-[#b8860b] text-white"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-[#b8860b] px-4 py-3 text-white uppercase tracking-wider text-sm rounded-sm rounded-l-none hover:bg-opacity-90 transition duration-200"
          disabled={newsletterMutation.isPending}
        >
          {newsletterMutation.isPending ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    </Form>
  );
}
