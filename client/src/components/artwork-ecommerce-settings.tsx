import { useState } from 'react';
import { Artwork } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// UI Components
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CircleDollarSign, FileImage, Save } from 'lucide-react';

// Schema for Artwork E-commerce settings form
const artworkEcommerceSchema = z.object({
  // Original artwork
  available: z.boolean().default(true),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  
  // Limited edition settings
  isLimitedEdition: z.boolean().default(false),
  editionSize: z.coerce.number().min(1, "Edition size must be at least 1").optional(),
  editionsSold: z.coerce.number().min(0, "Editions sold must be a positive number").optional(),
  limitedEditionPrice: z.coerce.number().min(0, "Limited edition price must be a positive number").optional(),
  
  // Digital version settings
  hasDigitalVersion: z.boolean().default(false),
  digitalFileUrl: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  digitalPrice: z.coerce.number().min(0, "Digital price must be a positive number").optional(),
  personalLicensePrice: z.coerce.number().min(0, "Personal license price must be a positive number").optional(),
  commercialLicensePrice: z.coerce.number().min(0, "Commercial license price must be a positive number").optional(),
});

type ArtworkEcommerceFormData = z.infer<typeof artworkEcommerceSchema>;

interface ArtworkEcommerceSettingsProps {
  artwork: Artwork;
  onSaved?: (updatedArtwork: Artwork) => void;
}

export function ArtworkEcommerceSettings({ artwork, onSaved }: ArtworkEcommerceSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Set up form with default values from the artwork
  const form = useForm<ArtworkEcommerceFormData>({
    resolver: zodResolver(artworkEcommerceSchema),
    defaultValues: {
      available: artwork.available ?? true,
      price: artwork.price ?? 0,
      
      isLimitedEdition: artwork.isLimitedEdition ?? false,
      editionSize: artwork.editionSize ?? undefined,
      editionsSold: artwork.editionsSold ?? 0,
      limitedEditionPrice: artwork.limitedEditionPrice ?? Math.round((artwork.price ?? 0) * 0.2),
      
      hasDigitalVersion: artwork.hasDigitalVersion ?? false,
      digitalFileUrl: artwork.digitalFileUrl ?? '',
      digitalPrice: artwork.digitalPrice ?? Math.round((artwork.price ?? 0) * 0.1),
      personalLicensePrice: artwork.personalLicensePrice ?? Math.round((artwork.price ?? 0) * 0.1),
      commercialLicensePrice: artwork.commercialLicensePrice ?? Math.round((artwork.price ?? 0) * 0.3),
    },
  });
  
  // Watch form values to dynamically update UI
  const isLimitedEdition = form.watch('isLimitedEdition');
  const hasDigitalVersion = form.watch('hasDigitalVersion');
  
  // Handle form submission
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('PATCH', `/api/artworks/${artwork.id}`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update artwork e-commerce settings');
      }
      
      const updatedArtwork = await response.json();
      
      toast({
        title: "E-commerce settings updated",
        description: "Your artwork purchase options have been saved successfully.",
        variant: "default",
      });
      
      if (onSaved) onSaved(updatedArtwork);
    } catch (error) {
      console.error('Error updating e-commerce settings:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred while saving settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Original Artwork Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Original Artwork</h3>
                <p className="text-sm text-muted-foreground">Manage sales settings for the original artwork</p>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="available" className="text-base">Availability</Label>
                  <p className="text-sm text-muted-foreground">
                    Is this original artwork available for purchase?
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="available"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Artwork Price (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          className="pl-10" 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set the price for the original, one-of-a-kind artwork
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            {/* Limited Edition Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Limited Edition</h3>
                <p className="text-sm text-muted-foreground">Offer limited edition prints of this artwork</p>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="isLimitedEdition" className="text-base">Limited Edition Availability</Label>
                  <p className="text-sm text-muted-foreground">
                    Offer this artwork as a limited edition print?
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="isLimitedEdition"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="isLimitedEdition"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {isLimitedEdition && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                  <FormField
                    control={form.control}
                    name="editionSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edition Size</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            step="1" 
                          />
                        </FormControl>
                        <FormDescription>
                          The total number of prints in this limited edition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="editionsSold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Editions Sold</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            step="1" 
                          />
                        </FormControl>
                        <FormDescription>
                          How many limited edition prints have been sold so far
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="limitedEditionPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limited Edition Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price for each limited edition print
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Digital Version Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Digital Version</h3>
                <p className="text-sm text-muted-foreground">Offer digital downloads of this artwork</p>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="hasDigitalVersion" className="text-base">Digital Version Availability</Label>
                  <p className="text-sm text-muted-foreground">
                    Offer this artwork as a digital download?
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="hasDigitalVersion"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="hasDigitalVersion"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {hasDigitalVersion && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                  <FormField
                    control={form.control}
                    name="digitalFileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Digital File URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileImage className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              placeholder="https://example.com/artwork.jpg" 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          URL to the high-resolution digital file (from Cloudinary or other storage)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="digitalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Digital Download Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price for full digital download
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="personalLicensePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal License Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price for personal use license only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="commercialLicensePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commercial License Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price for commercial use license
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Purchase Options
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}