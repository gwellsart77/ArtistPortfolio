import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Image, 
  Edit, 
  Eye, 
  Tag, 
  Star, 
  Plus,
  ImagePlus,
  Info,
  LayoutGrid,
  AlertCircle
} from "lucide-react";

export default function GallerySetupGuide() {
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => navigate("/admin/help-support")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Help Center
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Setting Up Your Artwork Gallery</h1>
        <p className="text-gray-500">
          Learn how to create, organize, and showcase your artwork portfolio
        </p>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="lead">
          Your artwork gallery is the heart of your website—it's where visitors come to experience your 
          creative vision. This guide will walk you through creating a professional and engaging gallery 
          that showcases your work effectively.
        </p>
        
        <h2>Understanding the Artwork Gallery</h2>
        <p>
          The gallery system is designed with artists in mind. It allows you to:
        </p>
        <ul>
          <li>Showcase your artwork with high-quality images</li>
          <li>Organize works into categories and collections</li>
          <li>Provide detailed information about each piece</li>
          <li>Feature selected works prominently on your website</li>
          <li>Connect artwork to products in your shop</li>
        </ul>
        
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-amber-800 font-medium text-sm">Important Gallery Concept</h3>
              <p className="text-amber-700 text-sm">
                In this system, <strong>Artwork</strong> and <strong>Products</strong> are separate 
                entities. Your artwork represents the creative piece itself, while products are what 
                you sell (prints, originals, merchandise). This separation allows you to maintain 
                a professional portfolio while still selling various formats of your work.
              </p>
            </div>
          </div>
        </div>
        
        <h2>Adding New Artwork</h2>
        <p>
          The first step in building your gallery is adding artwork. Here's how to do it effectively:
        </p>
        
        <h3>Step 1: Access the Upload Form</h3>
        <p>
          Navigate to <strong>Artwork Gallery</strong> from your dashboard and click 
          <strong>Add New Artwork</strong> to open the upload form.
        </p>
        
        <h3>Step 2: Upload High-Quality Images</h3>
        <p>
          For the best presentation of your work, follow these image guidelines:
        </p>
        <ul>
          <li><strong>Resolution:</strong> At least 2000px on the longest side (this allows for zoom functionality)</li>
          <li><strong>Format:</strong> JPG or PNG (JPG recommended for paintings and photos, PNG for digital artwork with transparency)</li>
          <li><strong>Color profile:</strong> sRGB for consistent colors across devices</li>
          <li><strong>File size:</strong> 5MB maximum (optimize your images if necessary)</li>
        </ul>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <ImagePlus className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Direct Upload</h4>
            </div>
            <p className="text-sm text-gray-600">
              Upload directly from your computer by clicking the upload area or dragging and dropping files.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Info className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Image Tips</h4>
            </div>
            <p className="text-sm text-gray-600">
              Photograph artwork in natural light without glare. Include a detail shot for paintings to show texture.
            </p>
          </div>
        </div>
        
        <h3>Step 3: Add Detailed Information</h3>
        <p>
          Complete the artwork details form with the following information:
        </p>
        
        <div className="space-y-4 my-6 ml-6">
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Title</h4>
            <p className="text-gray-600 text-sm">
              The name of your artwork. Be descriptive yet concise. This will display prominently in the gallery.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Description</h4>
            <p className="text-gray-600 text-sm">
              Explain your inspiration, techniques used, and the story behind the piece. 
              This helps viewers connect with your work on a deeper level.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Medium</h4>
            <p className="text-gray-600 text-sm">
              Specify the materials used (e.g., "Oil on canvas", "Digital illustration", "Watercolor on paper").
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Dimensions</h4>
            <p className="text-gray-600 text-sm">
              The physical size of the original artwork. Include both inches and centimeters if possible.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Year Created</h4>
            <p className="text-gray-600 text-sm">
              The year when the artwork was completed. This helps organize your work chronologically.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Categories</h4>
            <p className="text-gray-600 text-sm">
              Assign categories to organize your work (e.g., "Abstract", "Landscape", "Portrait").
              You can create custom categories in the gallery settings.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Tags</h4>
            <p className="text-gray-600 text-sm">
              Add descriptive tags to improve searchability (e.g., "blue", "nature", "figurative").
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Featured Status</h4>
            <p className="text-gray-600 text-sm">
              Toggle whether the artwork should be featured on your homepage or gallery landing page.
            </p>
          </div>
          
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium">Visibility</h4>
            <p className="text-gray-600 text-sm">
              Set to public or private. Private artworks won't show up in your gallery but can still be linked to products.
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 my-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-blue-800 font-medium text-sm">Best Practice</h3>
              <p className="text-blue-700 text-sm">
                Take time to write thoughtful descriptions for your artwork. Collectors appreciate understanding
                your creative process and the meaning behind each piece. This context can significantly
                increase interest in your work.
              </p>
            </div>
          </div>
        </div>
        
        <h2>Organizing Your Gallery</h2>
        <p>
          An organized gallery helps visitors navigate your work and find pieces that interest them.
        </p>
        
        <h3>Creating Categories</h3>
        <p>
          Categories allow you to group similar artwork together. To create and manage categories:
        </p>
        <ol>
          <li>Go to <strong>Artwork Gallery</strong> and click <strong>Manage Categories</strong></li>
          <li>Click <strong>Add New Category</strong> to create a category</li>
          <li>Provide a name and optional description for the category</li>
          <li>Arrange categories in your preferred display order</li>
        </ol>
        
        <h3>Curating Collections</h3>
        <p>
          Collections are thematic groupings of artwork that may span different categories. 
          They're perfect for exhibitions, series, or special showcases:
        </p>
        <ol>
          <li>Navigate to <strong>Collections</strong> within Artwork Gallery</li>
          <li>Click <strong>Create Collection</strong></li>
          <li>Add a title, description, and cover image</li>
          <li>Select artworks to include in this collection</li>
          <li>Arrange the artwork in your preferred display order</li>
        </ol>
        
        <h3>Setting Featured Artwork</h3>
        <p>
          Featured artwork appears prominently on your website. To feature artwork:
        </p>
        <ul>
          <li>When editing any artwork, check the "Feature this artwork" option</li>
          <li>Alternatively, use the bulk actions in the Manage Gallery view to feature multiple works at once</li>
          <li>In Website Settings, you can control how many featured works appear on your homepage</li>
        </ul>
        
        <h2>Gallery Display Settings</h2>
        <p>
          Customize how your gallery appears to visitors:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <LayoutGrid className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Layout Options</h4>
            </div>
            <p className="text-sm text-gray-600">
              Choose between grid, masonry, or list layouts for your gallery in Website Settings and Gallery Display.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              <Eye className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium">Artwork Detail View</h4>
            </div>
            <p className="text-sm text-gray-600">
              Customize what information appears on individual artwork pages and the viewer experience.
            </p>
          </div>
        </div>
        
        <h2>Managing Existing Artwork</h2>
        <p>
          Keep your gallery up-to-date by regularly reviewing and updating your artwork:
        </p>
        
        <h3>Editing Artwork</h3>
        <p>
          To edit an existing artwork:
        </p>
        <ol>
          <li>Go to <strong>Artwork Gallery</strong> and click <strong>Manage Gallery</strong></li>
          <li>Find the artwork you want to edit and click the Edit button</li>
          <li>Make your changes and click Save</li>
        </ol>
        
        <h3>Organizing and Reordering</h3>
        <p>
          In the Manage Gallery view, you can:
        </p>
        <ul>
          <li>Drag and drop artwork to change display order</li>
          <li>Filter by category, date, or featured status</li>
          <li>Perform bulk actions like changing categories or visibility</li>
        </ul>
        
        <h3>Linking to Products</h3>
        <p>
          You can see which products are linked to each artwork in the Manage Gallery view. 
          To create new products from an artwork:
        </p>
        <ol>
          <li>Click on the artwork in Manage Gallery</li>
          <li>Select "Create Product from Artwork" in the dropdown menu</li>
          <li>Choose the product type and follow the product creation process</li>
        </ol>
        
        <h2>Tips for an Effective Gallery</h2>
        <ul>
          <li><strong>Quality over quantity</strong> - Showcase your best work rather than everything you've created</li>
          <li><strong>Update regularly</strong> - Add new work to keep your gallery fresh and encourage return visits</li>
          <li><strong>Tell a story</strong> - Organize your work to show your artistic journey or thematic explorations</li>
          <li><strong>Optimize images</strong> - Ensure all images are sharp, well-lit, and show your work accurately</li>
          <li><strong>Use consistent formatting</strong> - Maintain a uniform style for titles, descriptions, and image ratios</li>
        </ul>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 my-8">
          <h3 className="text-blue-800 font-medium">Need Additional Help?</h3>
          <p className="text-blue-700 mb-4">
            If you need personalized assistance with your gallery setup, don't hesitate to contact our support team.
          </p>
          <Button 
            variant="outline" 
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => navigate("/admin/help-support")}
          >
            Return to Help Center
          </Button>
        </div>
      </div>
    </div>
  );
}