import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Save, Eye, RotateCcw, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface EmailTemplate {
  id: number;
  templateKey: string;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultTemplates = {
  order_confirmation: {
    subject: 'Thank you for your order from Gabe Wells Fine Art!',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333; text-align: center;">Thank you for your order!</h1>
  
  <p>Hello \{\{customerName\}\},</p>
  
  <p>Thank you for your order from Gabe Wells Fine Art! We're excited to create something beautiful for you.</p>
  
  <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
    <h2 style="color: #333; margin-top: 0;">Order Details</h2>
    <p><strong>Order Number:</strong> \{\{orderNumber\}\}</p>
    <p><strong>Order Date:</strong> \{\{orderDate\}\}</p>
    <p><strong>Total Amount:</strong> $\{\{totalAmount\}\}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #333;">Items Ordered</h3>
    \{\{#orderItems\}\}
    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
      <p><strong>\{\{itemName\}\}</strong> (Quantity: \{\{quantity\}\}) - $\{\{unitPrice\}\}</p>
    </div>
    \{\{/orderItems\}\}
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #333;">Shipping Address</h3>
    <p>\{\{shippingName\}\}<br>
    \{\{shippingAddress\}\}<br>
    \{\{shippingCity\}\}, \{\{shippingState\}\} \{\{shippingZip\}\}<br>
    \{\{shippingCountry\}\}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #333;">What Happens Next</h3>
    <ol>
      <li>Order Processing: We'll begin preparing your order immediately</li>
      <li>Quality Check: Each piece is carefully inspected before shipping</li>
      <li>Secure Packaging: Your artwork will be professionally packaged</li>
      <li>Shipping Notification: You'll receive tracking information when shipped</li>
    </ol>
  </div>
  
  <p>If you have any questions, please don't hesitate to contact us.</p>
  
  <p>Best regards,<br>
  Gabe Wells Fine Art Team</p>
</div>`,
    textContent: `Hello \{\{customerName\}\},

Thank you for your order from Gabe Wells Fine Art! We're excited to create something beautiful for you.

ORDER DETAILS:
Order Number: \{\{orderNumber\}\}
Order Date: \{\{orderDate\}\}
Total Amount: $\{\{totalAmount\}\}

ITEMS ORDERED:
\{\{#orderItems\}\}
- \{\{itemName\}\} (Quantity: \{\{quantity\}\}) - $\{\{unitPrice\}\}
\{\{/orderItems\}\}

SHIPPING ADDRESS:
\{\{shippingName\}\}
\{\{shippingAddress\}\}
\{\{shippingCity\}\}, \{\{shippingState\}\} \{\{shippingZip\}\}
\{\{shippingCountry\}\}

WHAT HAPPENS NEXT:
1. Order Processing: We'll begin preparing your order immediately
2. Quality Check: Each piece is carefully inspected before shipping
3. Secure Packaging: Your artwork will be professionally packaged
4. Shipping Notification: You'll receive tracking information when shipped

If you have any questions, please don't hesitate to contact us.

Best regards,
Gabe Wells Fine Art Team`
  },
  commission_confirmation: {
    subject: 'Commission Request Received - Gabe Wells Fine Art',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333; text-align: center;">Commission Request Received</h1>
  
  <p>Hello {{customerName}},</p>
  
  <p>Thank you for your commission request! We're excited about the possibility of creating a custom piece for you.</p>
  
  <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
    <h2 style="color: #333; margin-top: 0;">Commission Details</h2>
    <p><strong>Project Type:</strong> {{projectType}}</p>
    <p><strong>Budget Range:</strong> {{budgetRange}}</p>
    <p><strong>Timeline:</strong> {{timeline}}</p>
    <p><strong>Description:</strong> {{projectDescription}}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #333;">What Happens Next</h3>
    <ol>
      <li>Review: We'll carefully review your commission request within 2-3 business days</li>
      <li>Consultation: If it's a good fit, we'll schedule a consultation to discuss details</li>
      <li>Proposal: You'll receive a detailed proposal with timeline and pricing</li>
      <li>Creation: Once approved, we'll begin creating your custom artwork</li>
    </ol>
  </div>
  
  <p>We appreciate your interest in commissioning a custom piece and look forward to potentially working with you!</p>
  
  <p>Best regards,<br>
  Gabe Wells Fine Art Team</p>
</div>`
  }
};

export default function EmailTemplates() {
  // DIAGNOSTIC: Step 1A - Component mounting check
  console.count('EmailTemplates render');
  
  const [activeTab, setActiveTab] = useState('order_confirmation');
  const [editedTemplates, setEditedTemplates] = useState<{[key: string]: EmailTemplate}>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // DIAGNOSTIC: Step 3 - React hydration check
  useEffect(() => {
    console.log('✅ React hydrated - EmailTemplates component mounted');
  }, []);
  const queryClient = useQueryClient();

  // Fetch existing templates
  const { data: existingTemplates = [], isLoading } = useQuery({
    queryKey: ['/api/admin/email-templates'],
    retry: false,
  });

  // Create a mutation for saving templates
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: { templateKey: string; subject: string; htmlContent: string; textContent?: string }) => {
      return await apiRequest('POST', '/api/admin/email-templates', template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save email template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get template data (either edited version or default)
  const getTemplateData = (templateKey: string): EmailTemplate => {
    // Check if we have an edited version
    if (editedTemplates[templateKey]) {
      return editedTemplates[templateKey];
    }
    
    // Check if we have an existing template from database
    const existingTemplate = existingTemplates.find((t: EmailTemplate) => t.templateKey === templateKey);
    if (existingTemplate) {
      return existingTemplate;
    }
    
    // Return default template
    const defaultTemplate = defaultTemplates[templateKey as keyof typeof defaultTemplates];
    return {
      id: 0,
      templateKey,
      name: templateKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      subject: defaultTemplate?.subject || '',
      content: defaultTemplate?.content || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  // Update template in state
  const updateTemplate = (templateKey: string, field: string, value: string) => {
    const currentTemplate = getTemplateData(templateKey);
    setEditedTemplates(prev => ({
      ...prev,
      [templateKey]: {
        ...currentTemplate,
        [field]: value
      }
    }));
  };

  // Save template to database
  const saveTemplate = async (templateKey: string) => {
    setIsSaving(true);
    try {
      const templateData = getTemplateData(templateKey);
      console.log('FRONTEND: Sending to API:', JSON.stringify({
        templateKey,
        subject: templateData.subject,
        content: templateData.content,
        name: templateData.name || templateKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        isActive: templateData.isActive ?? true
      }, null, 2));
      
      await saveTemplateMutation.mutateAsync({
        templateKey,
        subject: templateData.subject,
        content: templateData.content,
        name: templateData.name || templateKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        isActive: templateData.isActive ?? true
      });
      
      // Remove from edited templates since it's now saved
      setEditedTemplates(prev => {
        const newState = { ...prev };
        delete newState[templateKey];
        return newState;
      });
      
      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully.",
      });
    } catch (error: any) {
      console.error('FRONTEND: Error saving template:', error);
      toast({
        title: "Save Failed",
        description: error.response?.data?.message || error.message || "Failed to save template.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset template to default
  const resetTemplate = (templateKey: string) => {
    setEditedTemplates(prev => {
      const newState = { ...prev };
      delete newState[templateKey];
      return newState;
    });
    toast({
      title: "Template Reset",
      description: "Template has been reset to default values.",
    });
  };

  // Check if template has unsaved changes
  const hasUnsavedChanges = (templateKey: string): boolean => {
    return templateKey in editedTemplates;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/admin/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Page
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Customize email templates for order confirmations and commission requests</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="order_confirmation" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Order Confirmation
            {hasUnsavedChanges('order_confirmation') && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="commission_confirmation" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Commission Confirmation
            {hasUnsavedChanges('commission_confirmation') && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>

        {['order_confirmation', 'commission_confirmation'].map((templateKey) => {
          const templateData = getTemplateData(templateKey);
          const templateName = templateKey === 'order_confirmation' ? 'Order Confirmation' : 'Commission Confirmation';
          
          return (
            <TabsContent key={templateKey} value={templateKey} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {templateName} Email Template
                        {hasUnsavedChanges(templateKey) && (
                          <span className="text-sm font-normal text-orange-600">(Unsaved changes)</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Customize the email template for {templateName.toLowerCase()} emails
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetTemplate(templateKey)}
                        disabled={!hasUnsavedChanges(templateKey)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      
                      {/* DIAGNOSTIC: Step 2 - Raw button click test */}
                      <button
                        style={{ padding: 8, background: 'tomato', color: '#fff', marginRight: '8px' }}
                        onClick={() => {
                          console.log('🔴 RAW CLICK FIRED! templateKey:', templateKey, 'isSaving:', isSaving, 'hasUnsavedChanges:', hasUnsavedChanges(templateKey));
                          console.trace('SAVE TRACE');
                        }}
                      >
                        TEST SAVE
                      </button>
                      
                      <Button
                        onClick={() => {
                          console.log('🔵 SHADCN BUTTON CLICKED! templateKey:', templateKey, 'isSaving:', isSaving);
                          saveTemplate(templateKey);
                        }}
                        disabled={isSaving || !hasUnsavedChanges(templateKey)}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor={`subject-${templateKey}`}>Email Subject</Label>
                    <Input
                      id={`subject-${templateKey}`}
                      value={templateData.subject}
                      onChange={(e) => updateTemplate(templateKey, 'subject', e.target.value)}
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`content-${templateKey}`}>Email Content (HTML)</Label>
                    <Textarea
                      id={`content-${templateKey}`}
                      value={templateData.content}
                      onChange={(e) => updateTemplate(templateKey, 'content', e.target.value)}
                      placeholder="Enter HTML email content..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Available Variables</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {templateKey === 'order_confirmation' ? (
                        <>
                          <p><code>{"{{customerName}}"}</code> - Customer's name</p>
                          <p><code>{"{{orderNumber}}"}</code> - Order ID</p>
                          <p><code>{"{{orderDate}}"}</code> - Order date</p>
                          <p><code>{"{{totalAmount}}"}</code> - Total order amount</p>
                          <p><code>{"{{#orderItems}}...{{/orderItems}}"}</code> - Loop through order items</p>
                          <p><code>{"{{itemName}}"}</code> - Item name (within orderItems loop)</p>
                          <p><code>{"{{quantity}}"}</code> - Item quantity (within orderItems loop)</p>
                          <p><code>{"{{unitPrice}}"}</code> - Item price (within orderItems loop)</p>
                          <p><code>{"{{shippingName}}"}</code> - Shipping recipient name</p>
                          <p><code>{"{{shippingAddress}}"}</code> - Shipping address</p>
                        </>
                      ) : (
                        <>
                          <p><code>{"{{customerName}}"}</code> - Customer's name</p>
                          <p><code>{"{{projectType}}"}</code> - Type of commission project</p>
                          <p><code>{"{{budgetRange}}"}</code> - Budget range for the project</p>
                          <p><code>{"{{timeline}}"}</code> - Desired timeline</p>
                          <p><code>{"{{projectDescription}}"}</code> - Project description</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}