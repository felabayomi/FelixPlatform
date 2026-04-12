# City Discoverer Group Tours - Design Guidelines

## Design Approach
**Reference-Based Approach** drawing from leading travel platforms:
- Airbnb's card-based tour browsing and visual storytelling
- Viator's clear tour information hierarchy and booking flow
- Atlas Obscura's sense of discovery and local authenticity

**Core Principle**: Inspire wanderlust while making signup effortless.

---

## Typography System
**Fonts**: 
- Headings: Inter (600, 700) - modern, clean, professional
- Body: Inter (400, 500) - excellent readability

**Hierarchy**:
- Hero Headlines: text-5xl lg:text-6xl font-bold
- Section Titles: text-3xl lg:text-4xl font-semibold
- Tour Titles: text-2xl font-semibold
- City Names: text-xl font-semibold
- Body Text: text-base lg:text-lg
- Metadata (dates, locations): text-sm font-medium

---

## Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16
- Component padding: p-6 to p-8
- Section spacing: py-12 lg:py-20
- Card gaps: gap-6 lg:gap-8
- Form fields: space-y-4

**Container Strategy**:
- Full-width hero: w-full
- Content sections: max-w-7xl mx-auto px-4 lg:px-8
- Tour cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

---

## Component Library

### Navigation
Fixed header with logo left, navigation links center, "Browse Tours" CTA right. Transparent over hero, solid on scroll. Mobile: hamburger menu.

### Hero Section
Full-width image showcase (h-[600px]) featuring iconic U.S. city landmark. Centered overlay with:
- Primary headline: "Discover America's Hidden Gems"
- Subheadline: "Join curated group tours to explore cities with local experts"
- Blurred-background CTA button
- Trust indicator: "500+ travelers joined in 2024"

### Tour Card Grid
3-column desktop, 2-column tablet, 1-column mobile. Each card:
- City image (aspect-video, rounded-lg)
- City name and state (prominent)
- Descriptive paragraph (3-4 lines, text-gray-600)
- Tour dates badge (top-right overlay)
- "Sign Up" button (full-width within card)
- Hover: subtle lift effect (transform scale-105)

### Tour Detail Page
Two-column layout (lg:grid-cols-2):
- Left: Large hero image, image gallery (3-4 additional photos in grid)
- Right: Sticky signup form

Content sections:
- Tour Overview (dates, duration, group size)
- City Highlights (bulleted list with icons)
- Detailed Itinerary (day-by-day breakdown)
- What's Included/Excluded
- Meet Your Guide (photo + bio)

### Signup Form
Clean, conversion-focused form with:
- Section header: "Reserve Your Spot"
- Input fields: Full Name, Email, Phone, Number of Participants (dropdown)
- Checkbox: "Receive updates about future tours"
- Large submit button: "Complete Registration"
- Trust elements: "Secure booking" + "Cancel anytime"
- Form validation with inline error states

### Footer
Four-column layout:
- About City Discoverer + logo
- Quick Links (All Tours, Destinations, FAQ, Contact)
- Contact Info (email, phone, office hours)
- Newsletter signup with description
- Bottom bar: Copyright, Privacy Policy, Terms, Social icons

---

## Page Layouts

### Homepage
1. Hero section (full-width image)
2. Featured Tours (3 cards, "Browse All Tours" link)
3. How It Works (3-step process with icons)
4. Testimonials (2-column grid, 4 testimonials)
5. Newsletter CTA (centered, generous padding)
6. Footer

### Tours Listing Page
1. Page header with filter/sort options
2. Tour cards grid (responsive, 6-9 tours visible)
3. Load more pagination
4. Footer

### Individual Tour Page
1. Hero image gallery
2. Two-column: Details + Signup form
3. Expandable sections for more info
4. Related tours carousel
5. Footer

---

## Images
**Hero Section**: Wide-angle shot of iconic U.S. cityscape (Baltimore Inner Harbor, Wheeling Suspension Bridge, etc.) - high-quality, vibrant, welcoming

**Tour Cards**: Signature city landmark or neighborhood scene for each destination

**Tour Detail Pages**: 4-5 images showing diverse city attractions, local culture, food scenes

**Meet Your Guide**: Professional headshot, friendly and approachable

**Testimonials**: Customer photos (optional but recommended for trust)

---

## Interactive Elements
- Smooth scroll to signup form from CTAs
- Image galleries: lightbox on click
- Form validation: Real-time feedback
- Mobile menu: Slide-in from right
- Sticky tour details sidebar on scroll

**Animation Philosophy**: Minimal, purposeful. Card hover effects, smooth transitions (duration-300), form focus states only.