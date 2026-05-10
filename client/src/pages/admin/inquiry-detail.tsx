import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  MessageSquare,
  Tag,
  Clock,
  CheckCircle,
  History,
  Send,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InquiryDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("message");
  const [status, setStatus] = useState("");
  const [response, setResponse] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  
  // This page will be updated to load real inquiry data from your database
  // For now, redirect back to contact management if no inquiry is found
  useEffect(() => {
    // In the future, this will load real inquiry data
    // If no inquiry found, redirect back
    navigate("/admin/contact-management");
  }, [navigate]);
  
  // Response templates
  const responseTemplates = [
    {
      id: "commission",
      name: "Commission Process",
      subject: "Re: Commission Request",
      content: "Dear {{name}},\n\nThank you for your interest in commissioning a custom artwork. I'm delighted to hear you're drawn to my piece 'Luminous' and would like something in a similar style with a blue palette.\n\nMy commission process generally works as follows:\n\n1. Initial Consultation: We'll discuss your vision, preferences, and requirements in detail.\n2. Proposal & Quote: I'll provide a detailed quote based on size, complexity, and materials.\n3. Deposit: A 50% non-refundable deposit secures your commission slot.\n4. Progress Updates: I'll share progress photos throughout the creation process.\n5. Completion & Delivery: Upon completion and final payment, your artwork will be carefully packaged and shipped.\n\nFor a 24x36 inch piece similar to 'Luminous' but with a blue palette, the price range would typically be $X-$Y. Regarding timeline, I'm currently booking commissions with a completion time of approximately 4-6 weeks.\n\nPlease let me know if you'd like to proceed or if you have any other questions.\n\nWarm regards,\n\nGabe Wells"
    },
    {
      id: "availability",
      name: "Artwork Availability",
      subject: "Re: Artwork Availability",
      content: "Dear {{name}},\n\nThank you for your interest in my artwork. I'm pleased to confirm that the piece you inquired about is currently available for purchase.\n\nIf you'd like to proceed with the purchase or have any additional questions about the artwork, please don't hesitate to let me know.\n\nBest regards,\n\nGabe Wells"
    },
    {
      id: "shipping",
      name: "Shipping Information",
      subject: "Re: Shipping Information",
      content: "Dear {{name}},\n\nThank you for your inquiry about shipping. I ship worldwide using insured, trackable services to ensure your artwork arrives safely.\n\nShipping costs vary based on size, weight, and destination. For your location, estimated shipping would be approximately $X. Delivery typically takes X-X business days once the artwork is shipped.\n\nAll artworks are carefully packaged using acid-free materials and sturdy containers to prevent any damage during transit.\n\nPlease let me know if you need any additional information.\n\nBest regards,\n\nGabe Wells"
    },
    {
      id: "general",
      name: "General Thank You",
      subject: "Thank You for Your Message",
      content: "Dear {{name}},\n\nThank you for reaching out. I appreciate your interest in my artwork.\n\nI've received your message and will respond with more detailed information shortly.\n\nThank you for your patience.\n\nBest regards,\n\nGabe Wells"
    }
  ];

  useEffect(() => {
    // Set initial status
    setStatus(mockInquiry.status);
  }, [mockInquiry.status]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    
    // In a real implementation, this would update the status in the database
    toast({
      title: "Status updated",
      description: `Inquiry status changed to ${newStatus}`,
    });
    
    // Add to history
    mockInquiry.history.push({
      date: new Date().toISOString(),
      action: "Status updated",
      details: `Status changed to ${newStatus}`
    });
  };
  
  const handleSelectTemplate = (templateId: string) => {
    const template = responseTemplates.find(t => t.id === templateId);
    if (template) {
      // Replace placeholders
      let content = template.content;
      content = content.replace(/{{name}}/g, mockInquiry.name);
      
      setResponse(content);
      setSelectedTemplate(templateId);
    }
  };
  
  const handleSendResponse = () => {
    if (!response.trim()) {
      toast({
        title: "Empty response",
        description: "Please write a response before sending",
        variant: "destructive",
      });
      return;
    }
    
    // In a real implementation, this would send the email
    toast({
      title: "Response sent",
      description: `Email sent to ${mockInquiry.email}`,
    });
    
    // Add to history
    mockInquiry.history.push({
      date: new Date().toISOString(),
      action: "Email sent",
      details: "Response to inquiry"
    });
    
    // Update status to responded
    setStatus("responded");
  };
  
  const handleSaveDraft = () => {
    if (!response.trim()) {
      toast({
        title: "Empty draft",
        description: "Please write something before saving as draft",
        variant: "destructive",
      });
      return;
    }
    
    // In a real implementation, this would save the draft
    toast({
      title: "Draft saved",
      description: "Your response has been saved as a draft",
    });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/admin/contact-management")}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contact Management
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{mockInquiry.subject}</CardTitle>
                <CardDescription>
                  Received on {format(new Date(mockInquiry.date), 'MMMM d, yyyy')} at {format(new Date(mockInquiry.date), 'h:mm a')}
                </CardDescription>
              </div>
              <div>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="message">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Activity History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {activeTab === "message" && (
                <div className="space-y-6">
                  <div className="border rounded-md p-4 bg-gray-50 whitespace-pre-line">
                    {mockInquiry.message}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Your Response</h3>
                      <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Select a response template" />
                        </SelectTrigger>
                        <SelectContent>
                          {responseTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Textarea 
                      value={response} 
                      onChange={(e) => setResponse(e.target.value)} 
                      placeholder="Type your response here..."
                      className="min-h-[200px]"
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleSaveDraft}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button 
                        onClick={handleSendResponse}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Response
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "history" && (
                <div className="space-y-4">
                  {mockInquiry.history.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="bg-gray-100 rounded-full p-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.date), 'MMM d, yyyy')} at {format(new Date(item.date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getInitials(mockInquiry.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{mockInquiry.name}</p>
                  <a href={`mailto:${mockInquiry.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {mockInquiry.email}
                  </a>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-start text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    First Contact
                  </div>
                  <div className="text-right">
                    {format(new Date(mockInquiry.date), 'MMM d, yyyy')}
                  </div>
                </div>
                
                <div className="flex justify-between items-start text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Source
                  </div>
                  <div className="text-right capitalize">
                    {mockInquiry.source.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Categorize this inquiry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockInquiry.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="capitalize">
                    {tag.replace('-', ' ')}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 rounded-full">
                  + Add Tag
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Private notes about this contact</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={mockInquiry.notes} 
                placeholder="Add private notes about this inquiry..." 
                className="resize-none min-h-[100px]"
              />
              <Button className="mt-2 w-full" variant="outline">Save Notes</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Related Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No previous inquiries from this contact.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}