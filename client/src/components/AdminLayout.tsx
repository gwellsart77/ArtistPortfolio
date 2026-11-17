import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { adminLogout } from "@/lib/admin-auth";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Image, Upload, Package, Plus, FileText, Settings,
  Inbox, MessageSquare, SlidersHorizontal, Mail, Home, User, Phone,
  PanelBottom, BarChart3, CreditCard, Send, KeyRound, Printer, Truck,
  Shield, HelpCircle, ExternalLink, LogOut, Menu, X,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Page title shown above the content. Leave empty for pages that draw their own header. */
  title?: string;
  description?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * One menu for the whole admin. Every link here goes to a page that exists.
 * (The old menu had links to pages that were never built, and three different
 * admin layouts depending on the page.)
 */
export const ADMIN_NAV: NavGroup[] = [
  { items: [{ label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard }] },
  {
    label: "Artwork",
    items: [
      { label: "Gallery", href: "/admin/manage", icon: Image },
      { label: "Upload artwork", href: "/admin/upload", icon: Upload },
    ],
  },
  {
    label: "Shop",
    items: [
      { label: "Products", href: "/admin/manage-products", icon: Package },
      { label: "Add product", href: "/admin/add-product", icon: Plus },
      { label: "Orders", href: "/admin/orders", icon: FileText },
      { label: "Shop settings", href: "/admin/shop-settings", icon: Settings },
    ],
  },
  {
    label: "Messages",
    items: [
      { label: "Inbox", href: "/admin/messages", icon: Inbox },
      { label: "Commission requests", href: "/admin/commission-requests", icon: MessageSquare },
      { label: "Commission settings", href: "/admin/commission-settings", icon: SlidersHorizontal },
      { label: "Email templates", href: "/admin/email-templates", icon: Mail },
    ],
  },
  {
    label: "Website",
    items: [
      { label: "Homepage", href: "/admin/settings/homepage", icon: Home },
      { label: "Gallery page", href: "/admin/settings/gallery", icon: Image },
      { label: "About page", href: "/admin/settings/about", icon: User },
      { label: "Contact page", href: "/admin/settings/contact", icon: Phone },
      { label: "Footer", href: "/admin/settings/footer", icon: PanelBottom },
      { label: "Visitor analytics", href: "/admin/analytics-settings", icon: BarChart3 },
    ],
  },
  {
    label: "Connections",
    items: [
      { label: "Payments (Stripe)", href: "/admin/dashboard?tab=stripe-config", icon: CreditCard },
      { label: "Email sending", href: "/admin/dashboard?tab=email-config", icon: Send },
      { label: "API keys", href: "/admin/dashboard?tab=api-configuration", icon: KeyRound },
      { label: "Printful", href: "/admin/printful-settings", icon: Printer },
      { label: "Drop shipping", href: "/admin/dropshipping", icon: Truck },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Password & 2-step", href: "/admin/account-security", icon: Shield },
      { label: "Help", href: "/admin/help-guides/getting-started", icon: HelpCircle },
    ],
  },
];

function isItemActive(href: string, path: string, search: string): boolean {
  const [hrefPath = "", hrefQuery = ""] = href.split("?");
  const hrefTab = new URLSearchParams(hrefQuery).get("tab");
  const currentTab = new URLSearchParams(search).get("tab");
  if (hrefPath === "/admin/dashboard") {
    if (path !== "/admin/dashboard" && path !== "/admin") return false;
    return (hrefTab || null) === (currentTab || null);
  }
  if (path === hrefPath) return true;
  // Sub-pages: /admin/edit/12 belongs to Gallery, /admin/edit-product/3 to Products, /admin/orders/5 to Orders
  if (hrefPath === "/admin/manage" && path.startsWith("/admin/edit/")) return true;
  if (hrefPath === "/admin/manage-products" && path.startsWith("/admin/edit-product/")) return true;
  if (hrefPath === "/admin/orders" && path.startsWith("/admin/orders/")) return true;
  if (hrefPath.startsWith("/admin/help-guides") && path.startsWith("/admin/help-guides")) return true;
  return false;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location, search]);

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login");
  };

  const nav = (
    <nav className="px-3 py-4 space-y-5" aria-label="Admin">
      {ADMIN_NAV.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="px-3 mb-1.5 text-[11px] uppercase tracking-[0.14em] text-[#6e6a63]">{group.label}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isItemActive(item.href, location, search);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-[#1b1a18] text-white"
                        : "text-[#3d3a35] hover:bg-[#efede8] hover:text-[#1b1a18]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#1b1a18]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur border-b border-[#e3e0da]">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#efede8]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/admin/dashboard" className="flex items-baseline gap-2">
              <span className="font-serif text-2xl leading-none">Gabe Wells</span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#6e6a63]">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[#3d3a35] hover:bg-[#efede8]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">View site</span>
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[#3d3a35] hover:bg-[#efede8]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-[#e3e0da] bg-white sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {nav}
        </aside>

        {/* Sidebar (phone/tablet drawer) */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 top-14 z-30">
            <button className="absolute inset-0 bg-black/30" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <aside className="relative w-72 max-w-[85vw] h-full bg-white border-r border-[#e3e0da] overflow-y-auto">{nav}</aside>
          </div>
        )}

        {/* Content */}
        <main id="main-content" className="admin-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {title && (
              <div className="mb-6">
                <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
                {description && <p className="text-sm text-[#6e6a63] mt-1">{description}</p>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
