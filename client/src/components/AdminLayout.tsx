import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Image, ShoppingCart, FileText, Globe, 
  Settings, Palette, Shield, KeyRound, HelpCircle, Package,
  Bell, Mail, BarChart, Calculator, LogOut, Eye,
  ChevronDown, ChevronRight, Upload, Edit,
  Plus, Archive, Truck, Printer, Zap, MessageSquare,
  Users, CreditCard, Plane, BarChart3, TrendingUp,
  Receipt, Home, User, Phone, Brush, Monitor,
  Server, Wrench, Send, Headphones, CheckCircle, XCircle, Layout
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

interface MenuItem {
  title: string;
  icon?: any;
  path?: string;
  children?: MenuItem[];
  isExpanded?: boolean;
  isGroupLabel?: boolean;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const menuItems: MenuItem[] = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },

    // ─── CONTENT ───────────────────────────────────────────────
    { title: "CONTENT", isGroupLabel: true },
    {
      title: "Artwork Gallery",
      icon: Image,
      children: [
        { title: "Upload New Artwork", icon: Upload, path: "/admin/upload" },
        { title: "Manage Gallery", icon: Edit, path: "/admin/manage" },
      ]
    },
    {
      title: "Shop",
      icon: ShoppingCart,
      children: [
        { title: "Add New Product", icon: Plus, path: "/admin/add-product" },
        { title: "Manage Products", icon: Archive, path: "/admin/manage-products" },
        { title: "Drop Shipping", icon: Truck, path: "/admin/dropshipping" },
        { title: "Printful Settings", icon: Zap, path: "/admin/printful-settings" },
        { title: "Shop Settings", icon: Settings, path: "/admin/shop-settings" },
      ]
    },
    { title: "Orders", icon: FileText, path: "/admin/orders" },
    {
      title: "Commission Requests",
      icon: MessageSquare,
      children: [
        { title: "All Requests", icon: FileText, path: "/admin/commission-requests" },
        { title: "Pending", icon: Bell, path: "/admin/commission-requests?status=pending" },
        { title: "Accepted", icon: CheckCircle, path: "/admin/commission-requests?status=accepted" },
        { title: "Completed", icon: CheckCircle, path: "/admin/commission-requests?status=completed" },
        { title: "Declined", icon: XCircle, path: "/admin/commission-requests?status=declined" },
      ]
    },
    { title: "Commission Settings", icon: Settings, path: "/admin/commission-settings" },
    { title: "Email Templates", icon: Mail, path: "/admin/email-templates" },

    // ─── WEBSITE ───────────────────────────────────────────────
    { title: "WEBSITE", isGroupLabel: true },
    {
      title: "Page Settings",
      icon: Globe,
      children: [
        { title: "Homepage", icon: Home, path: "/admin/settings/homepage" },
        { title: "Gallery", icon: Image, path: "/admin/settings/gallery" },
        { title: "Artist Bio", icon: User, path: "/admin/settings/about" },
        { title: "Contact", icon: Phone, path: "/admin/settings/contact" },
        { title: "Footer", icon: Layout, path: "/admin/settings/footer" },
        { title: "Shop", icon: ShoppingCart, path: "/admin/shop-settings" },
      ]
    },
    {
      title: "Website Colors",
      icon: Palette,
      children: [
        { title: "Color Schemes", icon: Palette, path: "/admin/settings?tab=colors" },
        { title: "Live Preview", icon: Monitor, path: "/admin/color-preview" },
        { title: "Reset Options", icon: Wrench, path: "/admin/color-reset" },
      ]
    },
    { title: "Analytics", icon: BarChart, path: "/admin/analytics-settings" },

    // ─── ACCOUNT & SECURITY ────────────────────────────────────
    { title: "ACCOUNT & SECURITY", isGroupLabel: true },
    { title: "MFA / 2FA", icon: Shield, path: "/admin/account-security" },
    {
      title: "API Configuration",
      icon: KeyRound,
      children: [
        {
          title: "Print Services",
          icon: Printer,
          children: [
            { title: "Products", icon: Package, path: "/admin/api/print-products" },
            { title: "Settings", icon: Settings, path: "/admin/api/print-settings" },
          ]
        },
        {
          title: "Payment Processing",
          icon: CreditCard,
          children: [
            { title: "Stripe Configuration", icon: CreditCard, path: "/admin/api/stripe" },
            { title: "Setup Instructions", icon: HelpCircle, path: "/admin/api/payment-setup" },
          ]
        },
        {
          title: "Email Services",
          icon: Mail,
          children: [
            { title: "SMTP Configuration", icon: Send, path: "/admin/api/smtp" },
            { title: "SMTP Providers", icon: Server, path: "/admin/api/smtp-providers" },
          ]
        },
        {
          title: "Shipping Services",
          icon: Plane,
          children: [
            { title: "UPS", icon: Plane, path: "/admin/api/ups" },
            { title: "FedEx", icon: Plane, path: "/admin/api/fedex" },
          ]
        },
        {
          title: "Analytics Services",
          icon: BarChart,
          children: [
            { title: "Google Analytics", icon: BarChart, path: "/admin/api/google-analytics" },
          ]
        },
      ]
    },

    // ─── SUPPORT ───────────────────────────────────────────────
    { title: "SUPPORT", isGroupLabel: true },
    { title: "Help & Support", icon: Headphones, path: "/admin/help-guides/getting-started" },
  ];

  const toggleMenu = (menuTitle: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuTitle)) {
      newExpanded.delete(menuTitle);
    } else {
      newExpanded.add(menuTitle);
    }
    setExpandedMenus(newExpanded);
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path) {
      return location === item.path || 
        (item.path.includes("?") && location.startsWith(item.path.split("?")[0] || ""));
    }
    if (item.children) {
      return item.children.some(child => isMenuActive(child));
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0): React.ReactNode => {
    if (item.isGroupLabel) {
      return (
        <p key={item.title} className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-1 px-3 first:mt-0">
          {item.title}
        </p>
      );
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.title);
    const isActive = isMenuActive(item);
    const paddingLeft = level > 0 ? `${level * 16}px` : '0px';

    if (hasChildren) {
      return (
        <div key={item.title}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-gray-700 hover:bg-gray-100 ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}
            style={{ paddingLeft }}
            onClick={() => toggleMenu(item.title)}
          >
            {item.icon && <item.icon className="h-4 w-4 mr-2" />}
            <span className="flex-1 text-left">{item.title}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map((child, index) => (
                <div key={`${child.title}-${index}`}>
                  {renderMenuItem(child, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.title}>
        <Button
          variant={isActive ? "default" : "ghost"}
          className={`w-full justify-start ${
            isActive 
              ? "bg-blue-600 text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
          style={{ paddingLeft }}
          onClick={() => item.path && navigate(item.path)}
        >
          {item.icon && <item.icon className="h-4 w-4 mr-2" />}
          {item.title}
        </Button>
      </div>
    );
  };

  const handleLogout = () => {
    // Clear authentication
    sessionStorage.removeItem("admin_authenticated");
    // Navigate to login
    navigate("/admin/login");
  };

  const handleViewSite = () => {
    window.open("/", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            className="text-left"
            onClick={() => navigate("/admin/dashboard")}
            aria-label="Go to dashboard"
          >
            <h1 className="text-2xl font-bold text-blue-600 hover:text-blue-500 transition-colors">Artist Admin</h1>
          </button>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewSite}
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Site
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {menuItems.map((item, index) => (
              <div key={`menu-${item.title}-${index}`}>
                {renderMenuItem(item)}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-gray-600 mt-2">{description}</p>
              )}
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}