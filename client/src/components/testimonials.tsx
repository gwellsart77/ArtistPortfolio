import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  purchaseType: string;
  date: string;
}

// Sample testimonials - in a real app, these would come from your database
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    location: "New York, NY",
    rating: 5,
    text: "Gabe's artwork brought such life to our living room. The colors and emotion in 'Urban Dreams' are absolutely stunning. The painting arrived perfectly packaged and looks even better in person.",
    purchaseType: "Original Painting",
    date: "2024-11-15"
  },
  {
    id: 2,
    name: "Michael Chen",
    location: "San Francisco, CA",
    rating: 5,
    text: "I've been collecting contemporary art for years, and Gabe's work stands out. The limited edition print I purchased has incredible detail and the quality is museum-grade.",
    purchaseType: "Limited Edition Print",
    date: "2024-10-28"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    location: "Austin, TX",
    rating: 5,
    text: "Working with Gabe on a commission piece was amazing. He really listened to what I wanted and created something that exceeded my expectations. Highly recommend!",
    purchaseType: "Commission",
    date: "2024-09-12"
  },
  {
    id: 4,
    name: "David Thompson",
    location: "Seattle, WA",
    rating: 5,
    text: "The customer service was outstanding, and the artwork arrived quickly and securely. The piece I bought is the centerpiece of my home office now.",
    purchaseType: "Original Painting",
    date: "2024-08-20"
  }
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Collectors Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read what art enthusiasts and collectors have to say about their experience with Gabe Wells Fine Art
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < currentTestimonial.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {currentTestimonial.rating}/5 stars
                </span>
              </div>
              
              <blockquote className="text-lg text-gray-800 mb-6 leading-relaxed">
                "{currentTestimonial.text}"
              </blockquote>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {currentTestimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentTestimonial.location}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    {currentTestimonial.purchaseType}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {new Date(currentTestimonial.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevTestimonial}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextTestimonial}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}