import { useState } from 'react';
import { useLocation } from 'wouter';
import { Artwork } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Check, Image, Download, ShoppingCart } from 'lucide-react';

interface ArtworkPurchaseOptionsProps {
  artwork: Artwork;
  onPurchaseOriginal: () => void;
  onPurchaseLimitedEdition: () => void;
  onPurchaseDigital: (licenseType: 'personal' | 'commercial') => void;
}

export function ArtworkPurchaseOptions({
  artwork,
  onPurchaseOriginal,
  onPurchaseLimitedEdition,
  onPurchaseDigital
}: ArtworkPurchaseOptionsProps) {
  const [digitalLicenseType, setDigitalLicenseType] = useState<'personal' | 'commercial'>('personal');
  const [, navigate] = useLocation();
  
  // Check if editions are sold out
  const limitedEditionSoldOut = artwork.isLimitedEdition && 
    (artwork.limitedEditionAvailable === false || 
    (artwork.editionSize !== null && 
     artwork.editionsSold !== null && 
     artwork.editionsSold >= artwork.editionSize));
  
  // Calculate next edition number if limited edition
  const nextEditionNumber = artwork.editionsSold !== null ? artwork.editionsSold + 1 : 1;
  
  // Check if original is available
  const originalAvailable = artwork.available;
  
  // Get digital prices
  const personalLicensePrice = artwork.personalLicensePrice || artwork.digitalPrice;
  const commercialLicensePrice = artwork.commercialLicensePrice || 
    (artwork.digitalPrice ? artwork.digitalPrice * 3 : undefined);
  
  // Check if digital is available
  const digitalAvailable = artwork.hasDigitalVersion && 
    (personalLicensePrice !== null || commercialLicensePrice !== null);
  
  // Calculate selected digital price based on license type
  const selectedDigitalPrice = digitalLicenseType === 'personal' 
    ? personalLicensePrice 
    : commercialLicensePrice;
  
  if (!originalAvailable && !artwork.isLimitedEdition && !digitalAvailable) {
    return (
      <Card className="bg-gray-50 border">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This artwork is currently not available for purchase.</p>
          <Button variant="outline" onClick={() => navigate('/contact')}>
            Inquire About This Piece
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Purchase Options</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue={originalAvailable ? "original" : artwork.isLimitedEdition ? "limited" : "digital"}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="original" 
            disabled={!originalAvailable}
            className={!originalAvailable ? "opacity-50 cursor-not-allowed" : ""}
          >
            Original
          </TabsTrigger>
          <TabsTrigger 
            value="limited" 
            disabled={!Boolean(artwork.isLimitedEdition) || limitedEditionSoldOut}
            className={(!(artwork.isLimitedEdition ?? false) || Boolean(limitedEditionSoldOut)) ? "opacity-50 cursor-not-allowed" : ""}
          >
            Limited Edition
          </TabsTrigger>
          <TabsTrigger 
            value="digital" 
            disabled={!artwork.hasDigitalVersion}
            className={!digitalAvailable ? "opacity-50 cursor-not-allowed" : ""}
          >
            Digital
          </TabsTrigger>
        </TabsList>
        
        {/* Original Artwork Option */}
        <TabsContent value="original" className="pt-4">
          <CardContent className="px-4 pt-0 pb-3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-medium mb-1">Original Artwork</h4>
                <p className="text-sm text-muted-foreground">
                  {artwork.medium}, {artwork.dimensions}
                </p>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(artwork.price ?? 0)}</div>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Own the original, one-of-a-kind artwork</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Includes certificate of authenticity</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Professionally packed and shipped</span>
              </li>
            </ul>
          </CardContent>
          
          <CardFooter className="px-4 pt-0">
            <Button 
              className="w-full" 
              onClick={onPurchaseOriginal}
              disabled={!originalAvailable}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchase Original
            </Button>
          </CardFooter>
        </TabsContent>
        
        {/* Limited Edition Option */}
        <TabsContent value="limited" className="pt-4">
          <CardContent className="px-4 pt-0 pb-3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-medium mb-1">Limited Edition Print</h4>
                <div className="flex items-center gap-3">
                  {limitedEditionSoldOut ? (
                    <Badge variant="destructive" className="font-medium">
                      SOLD OUT
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className="font-mono">
                        {nextEditionNumber} of {artwork.editionSize}
                      </Badge>
                      {artwork.editionsSold !== null && artwork.editionSize !== null && (
                        <p className="text-xs text-muted-foreground">
                          {artwork.editionSize - artwork.editionsSold} remaining
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="text-xl font-semibold">{formatCurrency((artwork.price ?? 0) / 5)}</div>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Museum-quality limited edition print</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Numbered and signed by the artist</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Includes certificate of authenticity</span>
              </li>
            </ul>
          </CardContent>
          
          <CardFooter className="px-4 pt-0">
            <Button 
              className="w-full" 
              onClick={onPurchaseLimitedEdition}
              disabled={Boolean(limitedEditionSoldOut)}
            >
              <Image className="mr-2 h-4 w-4" />
              Purchase Limited Edition
            </Button>
          </CardFooter>
        </TabsContent>
        
        {/* Digital Option */}
        <TabsContent value="digital" className="pt-4">
          <CardContent className="px-4 pt-0 pb-3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-medium mb-1">Digital Download</h4>
                <p className="text-sm text-muted-foreground">
                  High-resolution digital file
                </p>
              </div>
              <div className="text-xl font-semibold">
                {selectedDigitalPrice !== null && selectedDigitalPrice !== undefined
                  ? formatCurrency(selectedDigitalPrice)
                  : "N/A"}
              </div>
            </div>
            
            <div className="mb-6">
              <RadioGroup 
                defaultValue="personal"
                value={digitalLicenseType}
                onValueChange={(value) => setDigitalLicenseType(value as 'personal' | 'commercial')}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="personal" id="personal" className="mt-1" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="personal" className="font-medium">
                      Personal License {personalLicensePrice !== null && personalLicensePrice !== undefined
                        ? `- ${formatCurrency(personalLicensePrice)}`
                        : ""}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      For personal use only. Not for commercial or promotional purposes.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="commercial" id="commercial" className="mt-1" disabled={!commercialLicensePrice} />
                  <div className="grid gap-1.5">
                    <Label htmlFor="commercial" className="font-medium">
                      Commercial License {commercialLicensePrice !== null && commercialLicensePrice !== undefined
                        ? `- ${formatCurrency(commercialLicensePrice)}`
                        : "- Not available"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      For business use including marketing, publications, and products.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Instant download after purchase</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">High-resolution file suitable for printing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {digitalLicenseType === 'personal' 
                    ? 'For personal enjoyment only' 
                    : 'Includes rights for commercial use'}
                </span>
              </li>
            </ul>
          </CardContent>
          
          <CardFooter className="px-4 pt-0">
            <Button 
              className="w-full" 
              onClick={() => onPurchaseDigital(digitalLicenseType)}
              disabled={selectedDigitalPrice === null || selectedDigitalPrice === undefined}
            >
              <Download className="mr-2 h-4 w-4" />
              Purchase Digital Download
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}