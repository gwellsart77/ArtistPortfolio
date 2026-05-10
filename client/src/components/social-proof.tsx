import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Eye, Users, TrendingUp } from "lucide-react";

interface SocialProofStats {
  recentPurchases: Array<{
    id: number;
    productTitle: string;
    customerLocation: string;
    timeAgo: string;
    type: string;
  }>;
  stats: {
    totalSales: number;
    uniqueVisitors: number;
    satisfiedCustomers: number;
    activeCollectors: number;
  };
}

// Mock data - in production, this would come from your analytics/database
const mockSocialProofData: SocialProofStats = {
  recentPurchases: [
    {
      id: 1,
      productTitle: "Urban Dreams",
      customerLocation: "New York, NY",
      timeAgo: "2 hours ago",
      type: "Original Painting"
    },
    {
      id: 2,
      productTitle: "Ocean Whispers Print",
      customerLocation: "Los Angeles, CA",
      timeAgo: "5 hours ago",
      type: "Limited Edition"
    },
    {
      id: 3,
      productTitle: "Abstract Thoughts",
      customerLocation: "Chicago, IL",
      timeAgo: "1 day ago",
      type: "Commission"
    }
  ],
  stats: {
    totalSales: 247,
    uniqueVisitors: 12400,
    satisfiedCustomers: 98,
    activeCollectors: 156
  }
};

export function SocialProof() {
  const { data: socialProofData } = useQuery({
    queryKey: ["/api/social-proof"],
    // For now, return mock data. In production, this would fetch real data
    queryFn: () => Promise.resolve(mockSocialProofData),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (!socialProofData) {
    return null;
  }

  return (
    <section className="py-12 bg-white border-t">
      <div className="container mx-auto px-4">
        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
            Recent Activity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {socialProofData.recentPurchases.map((purchase) => (
              <Card key={purchase.id} className="border border-green-100 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        "{purchase.productTitle}"
                      </p>
                      <p className="text-xs text-gray-600">
                        {purchase.customerLocation}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {purchase.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {purchase.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {socialProofData.stats.totalSales}+
            </div>
            <div className="text-sm text-gray-600">Artworks Sold</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(socialProofData.stats.uniqueVisitors / 1000).toFixed(1)}k+
            </div>
            <div className="text-sm text-gray-600">Gallery Views</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {socialProofData.stats.satisfiedCustomers}%
            </div>
            <div className="text-sm text-gray-600">Satisfaction</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {socialProofData.stats.activeCollectors}+
            </div>
            <div className="text-sm text-gray-600">Active Collectors</div>
          </div>
        </div>
      </div>
    </section>
  );
}