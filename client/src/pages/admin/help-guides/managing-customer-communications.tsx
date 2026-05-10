import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Mail, Phone, Users } from "lucide-react";

export default function ManagingCustomerCommunicationsGuide() {
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
          <h1 className="text-2xl font-bold">Managing Customer Communications</h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Complete Customer Communications Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Excellent communication builds lasting relationships with collectors and turns customers into advocates for your art. This guide covers all aspects of customer interaction.</p>
            
            <h2>Communication Channels Overview</h2>

            <h3>Primary Communication Methods</h3>

            <p><strong>Email (Primary Channel):</strong></p>
            <ul>
              <li>Order confirmations and updates</li>
              <li>Customer service inquiries</li>
              <li>Newsletter and announcements</li>
              <li>Personal collector communications</li>
            </ul>

            <p><strong>Website Contact Forms:</strong></p>
            <ul>
              <li>General inquiries and questions</li>
              <li>Commission requests</li>
              <li>Media and press inquiries</li>
              <li>Technical support issues</li>
            </ul>

            <p><strong>Social Media:</strong></p>
            <ul>
              <li>Instagram: Visual engagement, behind-the-scenes</li>
              <li>Facebook: Community building, event announcements</li>
              <li>Pinterest: Art inspiration, home decor ideas</li>
            </ul>

            <h2>Email Communication Best Practices</h2>

            <h3>Professional Email Setup</h3>

            <p><strong>Email Address:</strong></p>
            <ul>
              <li>Use professional domain: hello@gabewells.com</li>
              <li>Avoid generic addresses like gmail or yahoo</li>
              <li>Set up auto-signature with contact information</li>
            </ul>

            <p><strong>Email Signature Example:</strong></p>
            <div className="bg-gray-50 p-4 rounded-lg border my-4">
              <p className="text-sm mb-0">
                Gabe Wells<br/>
                Contemporary Artist<br/>
                Website: gabewells.com<br/>
                Instagram: @gabewellsart<br/>
                Phone: [Your number]<br/>
                "Creating moments of beauty, one brushstroke at a time"
              </p>
            </div>

            <h3>Response Time Standards</h3>

            <p><strong>Customer Service Emails:</strong></p>
            <ul>
              <li><strong>Target:</strong> Within 4 hours during business days</li>
              <li><strong>Maximum:</strong> 24 hours</li>
              <li><strong>Weekend/Holiday:</strong> Set auto-responder with expected response time</li>
            </ul>

            <p><strong>Order-Related Inquiries:</strong></p>
            <ul>
              <li><strong>Immediate:</strong> Automated confirmations</li>
              <li><strong>Within 2 hours:</strong> Address concerns or questions</li>
              <li><strong>Proactive:</strong> Send updates before customers ask</li>
            </ul>

            <h3>Email Tone and Style</h3>

            <p><strong>Professional yet Personal:</strong></p>
            <ul>
              <li>Warm and approachable</li>
              <li>Reflect your artistic personality</li>
              <li>Avoid overly formal business language</li>
              <li>Show genuine enthusiasm for your art</li>
            </ul>

            <h2>Customer Service Scenarios</h2>

            <h3>Order Inquiries</h3>

            <p><strong>"When will my order ship?"</strong></p>
            <ul>
              <li>Check current order status</li>
              <li>Provide specific timeline</li>
              <li>Explain any delays honestly</li>
              <li>Offer tracking information if available</li>
            </ul>

            <p><strong>"Can I change my shipping address?"</strong></p>
            <ul>
              <li>If not yet shipped: Update immediately</li>
              <li>If already shipped: Contact carrier for rerouting</li>
              <li>Prevent future issues: Confirm addresses at checkout</li>
            </ul>

            <h3>Product Questions</h3>

            <p><strong>"What are the exact dimensions?"</strong></p>
            <ul>
              <li>Provide precise measurements</li>
              <li>Clarify if dimensions include frame</li>
              <li>Offer scale reference photos if helpful</li>
              <li>Suggest framing options</li>
            </ul>

            <p><strong>"What type of paper/canvas is used?"</strong></p>
            <ul>
              <li>Describe materials specifically</li>
              <li>Mention archival quality for prints</li>
              <li>Explain care and longevity</li>
              <li>Compare options if multiple available</li>
            </ul>

            <h2>Commission Communication Process</h2>

            <h3>Initial Inquiry Response</h3>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 my-4">
              <p><strong>First Contact Template:</strong></p>
              <p className="text-sm">"Thank you for your interest in commissioning a piece! I'd love to learn more about your vision. To provide you with the best service, could you share:</p>
              <ul className="text-sm">
                <li>What style or subject matter interests you?</li>
                <li>What size are you considering?</li>
                <li>What's your timeline for completion?</li>
                <li>What's your budget range?</li>
                <li>Where will the piece be displayed?</li>
              </ul>
              <p className="text-sm">I typically schedule a brief consultation call to discuss details and ensure we're a great fit. My commission process usually takes 4-6 weeks from approval to completion.</p>
              <p className="text-sm">Looking forward to creating something beautiful for you!"</p>
            </div>

            <h3>Commission Process Communication</h3>

            <p><strong>Proposal Stage:</strong></p>
            <ul>
              <li>Detailed written proposal</li>
              <li>Reference images and sketches</li>
              <li>Clear timeline and milestones</li>
              <li>Payment schedule (typically 50% deposit)</li>
              <li>Terms and conditions</li>
            </ul>

            <p><strong>Progress Updates:</strong></p>
            <ul>
              <li>Initial sketch approval</li>
              <li>Color study or underpainting</li>
              <li>Midpoint progress photo</li>
              <li>Near completion preview</li>
              <li>Final completion and delivery</li>
            </ul>

            <h2>Newsletter and Marketing Communications</h2>

            <h3>Email Newsletter Best Practices</h3>

            <p><strong>Content Mix (Monthly Newsletter):</strong></p>
            <ul>
              <li><strong>40%:</strong> New artwork and availability</li>
              <li><strong>20%:</strong> Behind-the-scenes studio content</li>
              <li><strong>20%:</strong> Art education and inspiration</li>
              <li><strong>10%:</strong> Personal updates and shows</li>
              <li><strong>10%:</strong> Special offers and events</li>
            </ul>

            <p><strong>Subject Line Examples:</strong></p>
            <ul>
              <li>"New Ocean Series: Three Paintings Available"</li>
              <li>"Behind the Easel: Creating 'Storm's End'"</li>
              <li>"Studio Sale: 20% Off Select Prints This Weekend"</li>
            </ul>

            <h3>Segmented Communication</h3>

            <p><strong>New Subscribers:</strong></p>
            <ul>
              <li>Welcome series (3-5 emails)</li>
              <li>Introduction to your art and story</li>
              <li>Best-selling pieces showcase</li>
              <li>Commission process explanation</li>
            </ul>

            <p><strong>VIP Customers (Repeat Buyers):</strong></p>
            <ul>
              <li>Early access to new works</li>
              <li>Exclusive commission opportunities</li>
              <li>Personal studio visit invitations</li>
              <li>Special collector pricing</li>
            </ul>

            <h2>Handling Difficult Situations</h2>

            <h3>Unhappy Customers</h3>

            <p><strong>Listen First:</strong></p>
            <ul>
              <li>Let customer explain their concern fully</li>
              <li>Ask clarifying questions</li>
              <li>Acknowledge their feelings</li>
              <li>Avoid defensive responses</li>
            </ul>

            <p><strong>Find Solutions:</strong></p>
            <ul>
              <li>Offer multiple resolution options</li>
              <li>Be generous with service recovery</li>
              <li>Follow up to ensure satisfaction</li>
              <li>Learn from the experience</li>
            </ul>

            <h3>Price Negotiations</h3>

            <p><strong>For Original Artworks:</strong></p>
            <ul>
              <li>Explain pricing methodology</li>
              <li>Highlight unique value proposition</li>
              <li>Consider payment plans for serious buyers</li>
              <li>Stand firm on fair pricing</li>
            </ul>

            <h2>Building Long-term Relationships</h2>

            <h3>Personal Touch Strategies</h3>

            <p><strong>Remember Customer Preferences:</strong></p>
            <ul>
              <li>Note favorite styles or colors</li>
              <li>Track purchase history</li>
              <li>Remember personal details shared</li>
              <li>Reference previous conversations</li>
            </ul>

            <p><strong>Special Occasions:</strong></p>
            <ul>
              <li>Birthday greetings to VIP customers</li>
              <li>Anniversary of first purchase</li>
              <li>Holiday cards to top collectors</li>
              <li>Personal invitations to events</li>
            </ul>

            <h3>Customer Appreciation</h3>

            <p><strong>Thank You Notes:</strong></p>
            <ul>
              <li>Handwritten notes with shipments</li>
              <li>Digital thank you for small purchases</li>
              <li>Anniversary acknowledgments</li>
              <li>Social media appreciation posts</li>
            </ul>

            <p><strong>Loyalty Rewards:</strong></p>
            <ul>
              <li>Repeat customer discounts</li>
              <li>Referral bonuses</li>
              <li>Free shipping for return customers</li>
              <li>Exclusive print series access</li>
            </ul>

            <h2>Communication Metrics to Monitor</h2>

            <h3>Response Time Analysis</h3>
            <ul>
              <li><strong>Average Response Time:</strong> Target under 4 hours</li>
              <li><strong>Resolution Time:</strong> How quickly issues are solved</li>
              <li><strong>Customer Satisfaction:</strong> Follow-up survey results</li>
            </ul>

            <h3>Email Performance</h3>
            <ul>
              <li><strong>Open Rates:</strong> Newsletter engagement</li>
              <li><strong>Click Rates:</strong> Interest in specific content</li>
              <li><strong>Unsubscribe Rates:</strong> Keep under 2%</li>
              <li><strong>Spam Complaints:</strong> Keep under 0.1%</li>
            </ul>

            <h3>Customer Retention</h3>
            <ul>
              <li><strong>Repeat Purchase Rate:</strong> Percentage of customers who buy again</li>
              <li><strong>Customer Lifetime Value:</strong> Total value of customer relationship</li>
              <li><strong>Referral Rate:</strong> Customers who recommend you to others</li>
            </ul>

            <p><em>Remember: Every communication is an opportunity to strengthen relationships and build your reputation as a professional artist who cares about their collectors' experience.</em></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}