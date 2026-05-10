# Gabe Wells Art Platform

## Overview
This project is an advanced e-commerce and business management platform for an artist, Gabe Wells. It functions as both a public gallery and shop, and a comprehensive administration dashboard. The platform allows for managing artwork, processing orders, handling commissions, and overseeing general business operations. The vision is to provide a modern, robust online presence for artists to showcase and sell their work, streamlining their business processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform utilizes React 18 with TypeScript for the frontend, styled with Tailwind CSS and the shadcn/ui component library, focusing on a modern and responsive design. Routing is managed by React Router, including protected routes for the admin dashboard.

### Technical Implementations
-   **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query v5 for server state, React Hook Form with Zod for form validation.
-   **Backend**: Node.js with Express.js, TypeScript, PostgreSQL database with Drizzle ORM.
-   **Authentication**: Custom session-based authentication with multi-factor authentication (MFA).
-   **File Storage**: Cloudinary for image management.
-   **API Design**: RESTful endpoints with consistent error handling.
-   **Build System**: Vite for frontend, esbuild for backend, `tsx` for development, `cross-env` for cross-platform compatibility.

### Feature Specifications
-   **Public Website**: Dynamic gallery, e-commerce shop with Stripe integration, custom commission request system, SEO optimization, and analytics integration.
-   **Admin Dashboard**: Comprehensive content management (artworks, products, orders, commissions), website settings, analytics, and multi-factor authentication.
-   **Security**: PostgreSQL-backed session management, rate limiting, input sanitization (DOMPurify), CSRF protection, and security headers (Helmet).
-   **Data Flow**: PostgreSQL stores core data (artworks, products, orders, commissions, user sessions) and configuration. API architecture includes public, admin, and file upload endpoints. TanStack Query manages server state, React Hook Form handles form state, and React hooks manage client UI state.

## External Dependencies

### Third-Party Services
-   **Payment Processing**: Stripe
-   **Email Services**: SendGrid, Mailgun, Nodemailer (multiple providers integrated)
-   **Image Storage**: Cloudinary
-   **Print-on-Demand**: Printful, Gooten
-   **Analytics**: Google Analytics

### Key Libraries
-   **UI Components**: Radix UI (primitives), shadcn/ui
-   **Authentication**: speakeasy (for TOTP)
-   **Database**: Drizzle ORM
-   **Validation**: Zod
-   **Security**: bcryptjs, helmet, express-rate-limit

## Recent Changes

### November 17, 2025 - Admin Login Fix & Account Creation
**Issues**: 
1. Admin login and password reset crashing with "Cannot convert undefined or null to object" error
2. Empty users table preventing admin access
3. Corrupted username in settings table (gwellsart77$ instead of gwellsart@gmail.com)

**Root Cause**: 
1. Middleware ordering issue - `sanitizeInput`, `requestLogger`, and cookie debug middleware tried to access `req.body` and `req.cookies` before `express.json()` and `cookieParser()` were initialized
2. No admin user account existed in database
3. Email address corruption in settings table

**Solution**: 
1. Reordered middleware in server/index.ts to ensure body/cookie parsers run FIRST before dependent middleware
2. Created admin user account with secure random password
3. Fixed corrupted username in settings table

**Admin Credentials**:
- Username: gwellsart@gmail.com
- Password: zL/ItTKTPwn/FxcLF2fN (temporary - change after first login via dashboard settings)
- MFA: Disabled (can be enabled in dashboard)

**Verification**: End-to-end test confirmed successful login and dashboard access.

### November 17, 2025 - CV Section Complete Restoration
**Issue**: CV section on /about page was displaying placeholder text instead of real achievements.

**Root Cause**: The `about_cv` database field had been overwritten with test data ("First bullet point", "Second bullet point", etc.).

**Solution**: Restored complete CV content from `about_full_resume` backup field, properly formatted and organized.

**Restored Content** (24 total entries across 4 categories):
- **Awards and Honors** (3 entries): 2023 Best in Show at Lone Tree Art Expo, 2022 Beautiful Bizarre Art Prize Finalist, 2007 Second Place Regional Juried Show
- **Solo / Featured Exhibitions** (1 entry): 2020 Featured Artist Exhibition at Valkarie Gallery
- **Selected Group Exhibitions** (20 entries): Spanning 2010-2025 including exhibitions at Anthology Gallery, Deines Cultural Center, Las Laguna Art Gallery, BRDG Gallery, Art Students League of Denver, Helikon Gallery, Spectra Art Space, Red Wolf Gallery, The Vault Art Studio, House of Cannabis Art Space, Next Gallery, Spark Gallery, and Avondale Artworks
- **Education** (1 entry): 2009 Degree in Graphic Design / Digital Media from Florida State College at Jacksonville

**Verification**: End-to-end test confirmed all 24 CV entries display correctly with proper HTML formatting, category headings, and styling.