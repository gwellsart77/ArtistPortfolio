import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { SEO } from "@/components/seo";

export default function ShippingReturns() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <SEO 
        title="Shipping & Returns Policy"
        description="Learn about our shipping methods, delivery times, and our customer-friendly return policy for artwork and merchandise."
      />
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif mb-4">Shipping & Returns Policy</h1>
          <div className="w-24 h-px bg-[#b8860b] mx-auto mb-6"></div>
          <p className="text-neutral-700 max-w-2xl mx-auto">
            Our commitment to customer satisfaction extends to our shipping and return policies
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Shipping Policy Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-serif mb-4 text-primary">Shipping Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Processing Time</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Original artworks are carefully packaged and typically ship within 3-5 business days after payment is confirmed. 
                  Prints and merchandise generally ship within 2-3 business days.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Shipping Methods & Timeframes</h3>
                <p className="text-neutral-700 leading-relaxed mb-4">
                  We offer the following shipping options:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                  <li><span className="font-medium">Standard Shipping:</span> 5-7 business days (domestic)</li>
                  <li><span className="font-medium">Expedited Shipping:</span> 2-3 business days (domestic)</li>
                  <li><span className="font-medium">International Shipping:</span> 10-21 business days (varies by destination)</li>
                </ul>
                <p className="text-neutral-700 leading-relaxed mt-4">
                  Shipping timeframes are estimates and not guarantees. Delivery times may be affected by customs processing for international orders.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Shipping Carriers</h3>
                <p className="text-neutral-700 leading-relaxed">
                  We primarily ship via FedEx, UPS, and USPS. For large original artworks, we may use specialized art shipping services to ensure safe delivery.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">International Shipping</h3>
                <p className="text-neutral-700 leading-relaxed">
                  We ship worldwide. International customers are responsible for any customs fees, duties, or taxes imposed by their country. These fees are not included in the shipping cost and are collected by the delivery carrier.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Tracking Information</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Tracking information will be provided via email once your order ships. You can also view tracking information in your order confirmation email.
                </p>
              </div>
            </div>
          </div>
          
          {/* Returns Policy Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-serif mb-4 text-primary">Returns & Exchanges</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Original Artwork</h3>
                <p className="text-neutral-700 leading-relaxed">
                  If you're not completely satisfied with your original artwork purchase, you may return it within 14 days of delivery. The artwork must be in its original condition and packaging. Customer is responsible for return shipping costs and insurance during transit. A 15% restocking fee may apply.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Prints & Merchandise</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Prints and merchandise may be returned within 30 days of delivery if they are in original condition. Return shipping is the responsibility of the customer. Refunds will be issued to the original payment method once the returned item is received and inspected.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Damaged Items</h3>
                <p className="text-neutral-700 leading-relaxed">
                  If your item arrives damaged, please contact us within 48 hours of delivery with photos of the damage and packaging. We'll arrange a replacement or refund at no additional cost to you.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Custom & Commissioned Work</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Due to their custom nature, commissioned artworks are non-returnable. We work closely with clients throughout the commission process to ensure satisfaction.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">How to Initiate a Return</h3>
                <p className="text-neutral-700 leading-relaxed">
                  To initiate a return, please contact us at contact@gabewells.com with your order number and reason for return. We'll provide return instructions and address information.
                </p>
              </div>
            </div>
          </div>
          
          {/* Customer Service Section */}
          <div>
            <h2 className="text-2xl font-serif mb-4 text-primary">Customer Service</h2>
            <p className="text-neutral-700 leading-relaxed mb-6">
              If you have any questions about our shipping or return policies, please don't hesitate to contact us:
            </p>
            
            <div className="border border-neutral-200 rounded-md p-6 bg-neutral-50">
              <p className="text-neutral-700 mb-1"><span className="font-medium">Email:</span> contact@gabewells.com</p>
              <p className="text-neutral-700"><span className="font-medium">Response Time:</span> Within 24-48 business hours</p>
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                href="/contact" 
                className={buttonVariants({
                  className: "bg-[#b8860b] hover:bg-opacity-90 text-white px-6 py-2"
                })}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}