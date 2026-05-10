import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart, TrendingUp, Users, ShoppingCart } from "lucide-react";

export default function UnderstandingAnalyticsGuide() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate("/admin/help-support")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Help
          </Button>
          <h1 className="text-2xl font-bold">Understanding Analytics</h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Complete Analytics Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Data-driven decisions help grow your art business effectively. This guide explains how to read, interpret, and act on your website analytics.</p>
            
            <h2>Analytics Dashboard Overview</h2>

            <h3>Accessing Your Analytics</h3>
            <ul>
              <li>Navigate to Admin Panel → "Analytics"</li>
              <li>Data updates in real-time</li>
              <li>View trends over different time periods</li>
              <li>Export data for deeper analysis</li>
            </ul>

            <h3>Key Performance Indicators (KPIs)</h3>

            <p><strong>Revenue Metrics:</strong></p>
            <ul>
              <li><strong>Total Revenue:</strong> Overall sales performance</li>
              <li><strong>Average Order Value:</strong> Revenue per transaction</li>
              <li><strong>Revenue per Visitor:</strong> Conversion efficiency</li>
              <li><strong>Monthly Recurring Revenue:</strong> Subscription or repeat sales</li>
            </ul>

            <p><strong>Traffic Metrics:</strong></p>
            <ul>
              <li><strong>Unique Visitors:</strong> Individual people visiting your site</li>
              <li><strong>Page Views:</strong> Total pages viewed</li>
              <li><strong>Session Duration:</strong> Time spent on your site</li>
              <li><strong>Bounce Rate:</strong> Visitors who leave quickly</li>
            </ul>

            <p><strong>Conversion Metrics:</strong></p>
            <ul>
              <li><strong>Conversion Rate:</strong> Percentage of visitors who buy</li>
              <li><strong>Cart Abandonment Rate:</strong> Shoppers who don't complete purchase</li>
              <li><strong>Email Signup Rate:</strong> Visitors joining your mailing list</li>
            </ul>

            <h2>Understanding Your Audience</h2>

            <h3>Visitor Demographics</h3>

            <p><strong>Geographic Data:</strong></p>
            <ul>
              <li><strong>Top Cities/Countries:</strong> Where your collectors live</li>
              <li><strong>Local vs. Remote:</strong> Balance of nearby vs. distant buyers</li>
              <li><strong>International Sales:</strong> Global reach of your art</li>
            </ul>

            <p><strong>Behavioral Patterns:</strong></p>
            <ul>
              <li><strong>Peak Visit Times:</strong> When people browse your site</li>
              <li><strong>Device Usage:</strong> Mobile vs. desktop preferences</li>
              <li><strong>Referral Sources:</strong> How visitors find you</li>
            </ul>

            <h3>Traffic Sources</h3>

            <p><strong>Direct Traffic (30-40% typical):</strong></p>
            <ul>
              <li>Visitors typing your URL directly</li>
              <li>Indicates strong brand recognition</li>
              <li>Often your most engaged audience</li>
            </ul>

            <p><strong>Search Engines (20-30%):</strong></p>
            <ul>
              <li>Google, Bing organic search results</li>
              <li>Shows SEO effectiveness</li>
              <li>Target: Art-related keywords</li>
            </ul>

            <p><strong>Social Media (15-25%):</strong></p>
            <ul>
              <li>Instagram, Facebook, Pinterest traffic</li>
              <li>Indicates social media success</li>
              <li>Track which platforms work best</li>
            </ul>

            <h2>Sales Analytics Deep Dive</h2>

            <h3>Product Performance</h3>

            <p><strong>Best Sellers Analysis:</strong></p>
            <ul>
              <li>Which artworks sell most frequently</li>
              <li>Price points that convert well</li>
              <li>Seasonal trends in purchases</li>
              <li>Popular sizes and formats</li>
            </ul>

            <p><strong>Category Performance:</strong></p>
            <ul>
              <li>Original art vs. prints vs. merchandise</li>
              <li>Landscapes vs. portraits vs. abstracts</li>
              <li>Digital downloads vs. physical products</li>
            </ul>

            <h3>Customer Lifetime Value</h3>

            <p><strong>Calculating CLV:</strong><br/>
            Average Order Value × Purchase Frequency × Customer Lifespan</p>

            <p><strong>Example:</strong><br/>
            $150 average order × 2.5 purchases/year × 3 years = $1,125 CLV</p>

            <p><strong>Improving CLV:</strong></p>
            <ul>
              <li><strong>Increase Order Value:</strong> Bundle deals, premium options</li>
              <li><strong>Increase Frequency:</strong> Email marketing, new collections</li>
              <li><strong>Extend Lifespan:</strong> Excellent service, relationship building</li>
            </ul>

            <h2>Website Performance Analytics</h2>

            <h3>User Experience Metrics</h3>

            <p><strong>Page Load Speed:</strong></p>
            <ul>
              <li>Target: Under 3 seconds load time</li>
              <li>Affects both SEO and conversions</li>
              <li>Monitor especially on mobile devices</li>
            </ul>

            <p><strong>Navigation Patterns:</strong></p>
            <ul>
              <li><strong>Most Viewed Pages:</strong> Popular content</li>
              <li><strong>Exit Pages:</strong> Where people leave your site</li>
              <li><strong>User Flow:</strong> How visitors navigate your site</li>
            </ul>

            <h3>SEO Performance</h3>

            <p><strong>Organic Search Metrics:</strong></p>
            <ul>
              <li><strong>Keyword Rankings:</strong> Your position in search results</li>
              <li><strong>Click-Through Rates:</strong> Percentage who click your listings</li>
              <li><strong>Impressions:</strong> How often you appear in search</li>
            </ul>

            <h2>Marketing Analytics</h2>

            <h3>Email Marketing Performance</h3>

            <p><strong>List Growth:</strong></p>
            <ul>
              <li><strong>Signup Rate:</strong> Website visitors joining your list</li>
              <li><strong>List Size:</strong> Total subscribers</li>
              <li><strong>Engagement Rate:</strong> Active vs. inactive subscribers</li>
            </ul>

            <p><strong>Campaign Metrics:</strong></p>
            <ul>
              <li><strong>Open Rate:</strong> Industry average 20-25%</li>
              <li><strong>Click Rate:</strong> Target 2-5%</li>
              <li><strong>Conversion Rate:</strong> Purchases from email campaigns</li>
            </ul>

            <h3>Social Media ROI</h3>

            <p><strong>Platform Performance:</strong></p>
            <ul>
              <li><strong>Instagram:</strong> Visual art showcase, younger audience</li>
              <li><strong>Facebook:</strong> Community building, local collectors</li>
              <li><strong>Pinterest:</strong> Long-term discovery, home decorators</li>
            </ul>

            <h2>Setting Up Goals and Benchmarks</h2>

            <h3>Monthly Targets</h3>

            <p><strong>Revenue Goals:</strong></p>
            <ul>
              <li>Set realistic monthly sales targets</li>
              <li>Plan for seasonal variations</li>
              <li>Track progress weekly</li>
            </ul>

            <p><strong>Traffic Goals:</strong></p>
            <ul>
              <li><strong>Unique Visitors:</strong> Steady growth month-over-month</li>
              <li><strong>Email Subscribers:</strong> Target 5-10% of visitors</li>
              <li><strong>Social Followers:</strong> Consistent audience building</li>
            </ul>

            <h3>Industry Benchmarks</h3>

            <p><strong>E-commerce Averages:</strong></p>
            <ul>
              <li><strong>Conversion Rate:</strong> 2-3% (art sites often lower)</li>
              <li><strong>Average Order Value:</strong> Varies widely by price point</li>
              <li><strong>Customer Return Rate:</strong> 20-30% for successful businesses</li>
            </ul>

            <h2>Using Analytics for Business Decisions</h2>

            <h3>Pricing Optimization</h3>
            <ul>
              <li><strong>A/B Test Prices:</strong> Try different price points</li>
              <li><strong>Conversion Rate by Price:</strong> Find optimal pricing</li>
              <li><strong>Bundle Performance:</strong> Package deals effectiveness</li>
            </ul>

            <h3>Content Strategy</h3>
            <ul>
              <li><strong>Popular Blog Topics:</strong> What resonates with your audience</li>
              <li><strong>High-Performing Artworks:</strong> Styles that sell well</li>
              <li><strong>SEO Opportunities:</strong> Keywords to target</li>
            </ul>

            <h3>Marketing Budget Allocation</h3>
            <ul>
              <li><strong>Channel Performance:</strong> Which marketing efforts work</li>
              <li><strong>Cost per Acquisition:</strong> How much to spend per customer</li>
              <li><strong>Return on Investment:</strong> Marketing spend effectiveness</li>
            </ul>

            <h2>Monthly Analytics Review Checklist</h2>

            <h3>Revenue Analysis</h3>
            <ul>
              <li>☐ Total revenue vs. target</li>
              <li>☐ Average order value trends</li>
              <li>☐ Top-selling products</li>
              <li>☐ Conversion rate changes</li>
            </ul>

            <h3>Traffic Review</h3>
            <ul>
              <li>☐ Unique visitor growth</li>
              <li>☐ Top traffic sources</li>
              <li>☐ Mobile vs. desktop performance</li>
              <li>☐ Page load speed check</li>
            </ul>

            <h3>Customer Insights</h3>
            <ul>
              <li>☐ New vs. returning customers</li>
              <li>☐ Geographic distribution</li>
              <li>☐ Customer lifetime value</li>
              <li>☐ Email list growth</li>
            </ul>

            <h3>Action Items</h3>
            <ul>
              <li>☐ Identify top 3 opportunities</li>
              <li>☐ Set specific improvement goals</li>
              <li>☐ Plan marketing adjustments</li>
              <li>☐ Schedule follow-up review</li>
            </ul>

            <p><em>Remember: Analytics tell the story of your business. Regular review and action on this data will help you grow your art business strategically and sustainably.</em></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}