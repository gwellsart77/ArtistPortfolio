import { Helmet } from "react-helmet";

export default function SecurityPolicy() {
  return (
    <>
      <Helmet>
        <title>Security Policy | Gabe Wells Fine Art</title>
        <meta name="description" content="Learn about our security measures to protect your personal and payment information when shopping with Gabe Wells Fine Art." />
      </Helmet>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-serif mb-6">Security Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>Secure Checkout</h2>
          <p>
            At Gabe Wells Fine Art, we take the security of your personal and payment information very seriously. 
            We've implemented robust security measures to ensure your data is always protected when you shop with us.
          </p>

          <h2>Payment Processing</h2>
          <p>
            We use Stripe as our payment processor, one of the most trusted and secure payment platforms available. 
            When you make a purchase:
          </p>
          <ul>
            <li>Your payment information is encrypted with 256-bit SSL technology, the same level of encryption used by leading banks</li>
            <li>Your credit card information never touches our servers - it's sent directly to Stripe through a secure connection</li>
            <li>All payment processing complies with PCI DSS (Payment Card Industry Data Security Standard) requirements</li>
            <li>Your sensitive payment details are never stored on our systems</li>
          </ul>

          <h2>Personal Information Protection</h2>
          <p>
            We are committed to protecting your personal information:
          </p>
          <ul>
            <li>All personal data is stored securely and only accessed when necessary for order fulfillment</li>
            <li>We use secure connections for all data transmissions between your browser and our website</li>
            <li>We will never sell or share your personal information with third parties except as required to fulfill your orders</li>
            <li>Our website is regularly monitored for potential security vulnerabilities</li>
          </ul>

          <h2>Secure Browsing</h2>
          <p>
            Our website uses HTTPS protocol, which means:
          </p>
          <ul>
            <li>All data transmitted between your browser and our website is encrypted</li>
            <li>You can verify the security of your connection by looking for the padlock icon in your browser's address bar</li>
            <li>Our security certificates are regularly updated to maintain the highest level of protection</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have any questions or concerns about our security practices, please don't hesitate to 
            <a href="/contact" className="text-primary hover:text-[#b8860b] transition ml-1">contact us</a>.
          </p>
        </div>
      </div>
    </>
  );
}