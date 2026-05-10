import nodemailer from 'nodemailer';
import { type InsertContactMessage } from '@shared/schema';

// Create a development transporter that logs emails instead of sending them
const devTransporter = {
  sendMail: async (mailOptions: any) => {
    console.log('\n==== EMAIL WOULD BE SENT ====');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('Text:', mailOptions.text?.substring(0, 100) + '...');
    console.log('==== END OF EMAIL ====\n');
    
    // Always succeed in development mode
    return { accepted: [mailOptions.to] };
  },
  verify: async () => true
};

// Create a transporter that either uses SMTP if configured, or the development version
const transporter = process.env.TITAN_SMTP_HOST ? 
  nodemailer.createTransport({
    host: process.env.TITAN_SMTP_HOST,
    port: Number(process.env.TITAN_SMTP_PORT),
    secure: Number(process.env.TITAN_SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.TITAN_SMTP_USERNAME,
      pass: process.env.TITAN_SMTP_PASSWORD,
    },
  }) : 
  devTransporter;

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Always redirect all emails to contact@gabewells.com in development
    const mailOptions = {
      from: process.env.TITAN_SMTP_USERNAME || 'noreply@example.com', // sender address
      ...options,
      to: 'contact@gabewells.com' // Override the recipient to always send to contact@gabewells.com
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Commission notification emails
async function sendCommissionNotifications(commissionData: {
  customerName: string;
  customerEmail: string;
  projectDescription: string;
  estimatedPrice: number;
  dimensions: string;
  location: string;
  submissionDate: string;
  commissionId: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📧 Starting commission email notifications...");

    // 1. Send admin notification email
    const adminEmailSuccess = await sendEmail({
      to: 'contact@gabewells.com', // Admin email
      subject: `New Commission Request Received - ${commissionData.customerName}`,
      html: `
        <h2>New Commission Request #${commissionData.commissionId}</h2>
        
        <h3>Customer Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${commissionData.customerName}</li>
          <li><strong>Email:</strong> ${commissionData.customerEmail}</li>
          <li><strong>Location:</strong> ${commissionData.location || 'Not specified'}</li>
        </ul>
        
        <h3>Commission Details:</h3>
        <ul>
          <li><strong>Dimensions:</strong> ${commissionData.dimensions}</li>
          <li><strong>Estimated Price:</strong> $${commissionData.estimatedPrice}</li>
          <li><strong>Submitted:</strong> ${commissionData.submissionDate}</li>
        </ul>
        
        <h3>Project Description:</h3>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${commissionData.projectDescription}
        </p>
        
        <p><em>Please log into your admin dashboard to review and respond to this commission request.</em></p>
      `
    });

    // 2. Send customer confirmation email using template
    // For now, use a basic template - this will be customizable via admin dashboard
    const customerEmailSuccess = await sendEmail({
      to: commissionData.customerEmail,
      subject: 'Your Commission Request Has Been Received!',
      html: `
        <h2>Thank you for your commission inquiry!</h2>
        
        <p>Dear ${commissionData.customerName},</p>
        
        <p>We've received your commission request and are excited about the possibility of creating something special for you.</p>
        
        <h3>Commission Details:</h3>
        <ul>
          <li><strong>Submitted:</strong> ${commissionData.submissionDate}</li>
          <li><strong>Estimated Price:</strong> $${commissionData.estimatedPrice}</li>
          <li><strong>Dimensions:</strong> ${commissionData.dimensions}</li>
          ${commissionData.location ? `<li><strong>Location:</strong> ${commissionData.location}</li>` : ''}
        </ul>
        
        <h3>Your Message:</h3>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${commissionData.projectDescription}
        </p>
        
        <h3>What Happens Next:</h3>
        <ol>
          <li><strong>Review:</strong> We'll carefully review your commission request within 2-3 business days</li>
          <li><strong>Response:</strong> You'll receive a personalized response with next steps</li>
          <li><strong>Collaboration:</strong> If accepted, we'll work closely with you to bring your vision to life</li>
          <li><strong>Creation:</strong> Your custom artwork will be created with attention to every detail</li>
        </ol>
        
        <p>Questions? Feel free to reply to this email or contact us directly.</p>
        
        <p>Best regards,<br>
        Gabe Wells Fine Art</p>
        
        <hr>
        <p><small>This is an automated confirmation. Please do not reply to this email address.</small></p>
      `
    });

    console.log("📧 Admin email result:", adminEmailSuccess);
    console.log("📧 Customer email result:", customerEmailSuccess);

    if (adminEmailSuccess && customerEmailSuccess) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to send one or more notification emails" };
    }

  } catch (error) {
    console.error("❌ Commission email notification error:", error);
    return { success: false, error: String(error) };
  }
}

export { sendCommissionNotifications };

export async function sendContactFormEmail(formData: InsertContactMessage): Promise<boolean> {
  const subject = `New Contact Form Submission: ${formData.subject}`;
  
  // Create text version of the email
  const text = `
New message from your website contact form:

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

${formData.subscribeToNewsletter ? 'Note: This person has subscribed to the newsletter.' : ''}
`;

  // Create HTML version of the email
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #b8860b; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Contact Form Submission</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; width: 100px;"><strong>Name:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.name}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <a href="mailto:${formData.email}" style="color: #0066cc;">${formData.email}</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${formData.subject}</td>
    </tr>
  </table>
  
  <div style="margin-bottom: 20px;">
    <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-line;">
      ${formData.message}
    </div>
  </div>
  
  ${formData.subscribeToNewsletter ? '<p style="padding: 10px; background-color: #fffde7; border-left: 4px solid #fbc02d; margin-top: 20px;"><strong>Note:</strong> This person has subscribed to the newsletter.</p>' : ''}
  
  <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
    <p>This email was automatically sent from your website's contact form.</p>
  </div>
</div>
`;

  return sendEmail({
    to: 'contact@gabewells.com',
    subject,
    text,
    html
  });
}

// Verify SMTP connection on startup
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection error:', error);
    return false;
  }
}