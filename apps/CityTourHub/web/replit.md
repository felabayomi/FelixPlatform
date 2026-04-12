# City Discoverer Group Tours

## Overview

City Discoverer is a tour booking platform that enables travelers to discover and book curated group tours across American cities. The application allows users to browse available tours, view detailed tour information, and register for tours through a streamlined booking process. The platform emphasizes visual storytelling and ease of use, drawing inspiration from leading travel platforms like Airbnb, Viator, and Atlas Obscura.

## Recent Changes

**November 7, 2024 (Latest Update)**: 
- ✅ **Migrated to PostgreSQL Database**: Signups are now permanently stored in a PostgreSQL database instead of memory
  - Created database connection using Neon serverless driver
  - Implemented DbStorage class with automatic tour initialization
  - Database tables: `tours` and `signups` with proper relationships
  - Data persists across server restarts
- ✅ **Email Notifications via Resend**: Integrated email notification system
  - Sends confirmation emails to customers when they sign up
  - Sends admin notifications for each new signup
  - Beautiful HTML email templates with tour details
  - Ready to use once Resend integration is completed
- ✅ **Image Serving System**: Created image mapping system with 7 generated images
  - Intelligent fallback for states without specific images
  - `/api/images/:imageName` endpoint for serving tour images
  - Maps state names to appropriate city images

**November 7, 2024 (Initial)**: 
- Implemented complete group tour signup platform with all 51 state tours
- Loaded tour data from user's Excel file with dates ranging from April 27, 2026 to July 4, 2027
- Created custom descriptions and highlights for each state tour
- Tours are automatically sorted by date from earliest to latest
- Built fully functional signup system with form validation and capacity tracking
- Integrated frontend with backend API for real-time tour data and bookings

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router. Routes include:
- `/` - Home page with hero section and featured tours
- `/tours` - Complete tour listing showing all 51 state tours
- `/tour/:id` - Individual tour details and booking form
- `/confirmation` - Post-booking confirmation page

**State Management**: TanStack Query (React Query) for server state management with infinite stale time, focusing on simple data fetching without automatic refetching.

**UI Components**: Shadcn UI component library with Radix UI primitives, providing accessible, customizable components. Tailwind CSS handles styling with a custom design system defined in index.css.

**Form Handling**: React Hook Form with Zod validation for type-safe form management in the signup form.

**Design System**: Custom Tailwind configuration with CSS variables for theming, supporting hover and active state elevation effects. Typography uses Inter font family exclusively. The design follows a card-based layout with travel-focused imagery.

### Backend Architecture

**Runtime**: Node.js with Express.js handling HTTP requests.

**API Design**: RESTful API with the following endpoints:
- `GET /api/tours` - Retrieve all tours (51 state tours) from database
- `GET /api/tours/:id` - Retrieve specific tour details from database
- `POST /api/signups` - Create tour signup/registration with validation, save to database, and send email notifications
- `GET /api/images/:imageName` - Serve tour images with intelligent fallback system

**Data Validation**: Zod schemas for request validation with user-friendly error messages via zod-validation-error. Validates participant counts, email format, phone numbers, and tour capacity limits.

**Development Server**: Custom Vite middleware integration for hot module replacement during development.

**Storage Layer**: Abstracted storage interface (`IStorage`) implemented with PostgreSQL database storage (`DbStorage`). Tours are automatically initialized from `server/tourData.ts` on first run, containing all 51 state tours with descriptions, highlights, dates, and capacity information. A legacy `MemStorage` implementation is available for testing purposes.

**Email Service**: Email notification system (`server/email.ts`) sends confirmation emails to customers and admin notifications using Resend API. Emails include tour details, participant information, and next steps.

### Data Storage Solutions

**Current Implementation**: PostgreSQL database storage (DbStorage) using Drizzle ORM with Neon serverless driver. Tours are automatically seeded from Excel data on first run, and all signups are permanently stored in the database. Participant counts are automatically updated in real-time using SQL transactions.

**Database Connection**: Configured in `server/db.ts` using `@neondatabase/serverless` Pool with WebSocket support for serverless environments.

**Schema Design**: Two primary tables defined in `shared/schema.ts`:

1. **tours** table:
   - UUID primary key
   - City and state information
   - Description and highlights (text array)
   - Start and end date strings
   - Participant tracking (max and current counts)
   - Image URL for tour representation

2. **signups** table:
   - UUID primary key
   - Foreign key reference to tour
   - User contact information (name, email, phone)
   - Participant count
   - Marketing opt-in flag
   - Timestamp for registration tracking

**Migration Strategy**: Ready to migrate to PostgreSQL database using Drizzle Kit when needed.

### Tour Data Management

**Source**: Tours loaded from user-provided Excel file containing all 50+ states with cities and dates
**Tour Data File**: `server/tourData.ts` - Contains complete tour information including:
- 51 tours covering all U.S. states
- Dates from April 27, 2026 to July 4, 2027
- Custom descriptions highlighting each destination's unique attractions
- 6 curated highlights per tour
- Participant capacity (16-24 people per tour)
- Placeholder image URLs

**Data Features**:
- Tours sorted chronologically by start date
- Multiple cities per tour where applicable (e.g., "Philadelphia & Pittsburgh")
- Capacity tracking with real-time spot availability
- Low inventory warnings when 5 or fewer spots remain

### Authentication and Authorization

Currently not implemented. The application operates as an open booking system without user authentication. All signup data is collected but not tied to user accounts.

### External Dependencies

**Database**: PostgreSQL via Neon serverless (@neondatabase/serverless) with WebSocket support. All tours and signups are permanently stored in the database with automatic initialization on first run.

**Email Service**: Resend API for transactional emails. Sends HTML email confirmations to customers and admin notifications for new signups.

**UI Library**: Radix UI primitives for accessible component foundations with extensive component coverage (accordion, dialog, dropdown-menu, select, tabs, toast, etc.).

**Form Validation**: Zod for runtime type validation integrated with React Hook Form via @hookform/resolvers.

**Excel Processing**: XLSX library for reading tour data from Excel files.

**Styling**: Tailwind CSS with PostCSS processing, using class-variance-authority for component variants.

**Development Tools**: 
- Replit-specific plugins for error overlay, cartographer, and dev banner
- ESBuild for production server bundling
- TSX for TypeScript execution in development

**Asset Management**: Generated AI images for tour destinations stored in `/attached_assets/generated_images/` with imports via Vite alias `@assets`.

## Key Features

- **51 State Tours**: Complete coverage of all U.S. states with detailed tour information
- **Date-Sorted Display**: Tours automatically displayed from earliest to latest dates
- **Real-time Availability**: Live participant count tracking and capacity management stored in database
- **Persistent Storage**: PostgreSQL database ensures no data is lost across server restarts
- **Email Notifications**: Automatic confirmation emails sent to customers and admin notifications for new signups
- **Responsive Design**: Mobile-first design that works beautifully on all devices
- **Form Validation**: Robust client and server-side validation for signup forms
- **Visual Storytelling**: AI-generated destination images with intelligent fallback system
- **User-Friendly Navigation**: Intuitive routing between home, tour listings, and detail pages
- **Confirmation Flow**: Post-booking confirmation page with next steps information

## Future Enhancements

- Admin dashboard to manage tours and view all registrations
- Payment processing integration for tour deposits or full payment
- User accounts to track registration history and manage bookings
- Tour capacity limits with waitlist functionality
- Image optimization and CDN integration
- SEO enhancements for tour discovery
- Advanced analytics and reporting for tour performance
