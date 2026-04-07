# Design Guidelines: A & F Laundry Service Scheduling App

## Design Approach: Design System Foundation
**Selected System:** Material Design 3 principles with service-oriented customization
**Rationale:** Utility-focused scheduling application requiring clear information hierarchy, intuitive forms, and reliable interaction patterns for local service business

## Core Design Principles
1. **Clarity First:** Every scheduling step should be immediately understandable
2. **Trust Building:** Professional, clean aesthetic that inspires confidence in service quality
3. **Efficiency:** Minimize steps from landing to confirmed appointment
4. **Local Character:** Warm, approachable design reflecting community-focused service

## Color Palette

**Light Mode:**
- Primary: 210 100% 45% (Trust-inspiring blue for CTAs and active states)
- Primary Hover: 210 100% 38%
- Background: 0 0% 98% (Soft white for clean appearance)
- Surface: 0 0% 100% (Card backgrounds)
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%
- Border: 220 15% 88%
- Success: 145 65% 42% (Confirmation states)

**Dark Mode:**
- Primary: 210 100% 60%
- Primary Hover: 210 100% 68%
- Background: 220 15% 12%
- Surface: 220 15% 16%
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 70%
- Border: 220 15% 25%

**Accent Colors:**
- Warning: 35 85% 55% (Heavy item surcharges, important notices)
- Info: 200 90% 50% (Pricing information, helpful tips)

## Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - Clean, professional sans-serif for UI
- Secondary: 'DM Sans' (Google Fonts) - Friendly headers and business name

**Scale:**
- Hero/H1: text-4xl md:text-5xl, font-bold (Business name, main headings)
- H2: text-2xl md:text-3xl, font-semibold (Section headers)
- H3: text-xl font-semibold (Card titles, step headers)
- Body: text-base, font-normal (Form labels, descriptions)
- Small: text-sm (Helper text, pricing details)
- Tiny: text-xs (Fine print, disclaimers)

## Layout System

**Spacing Units:** Consistent use of 4, 8, 12, 16, 24, 32 (Tailwind: p-4, p-8, p-12, etc.)
- Form sections: py-8 to py-12
- Component padding: p-6 to p-8
- Element gaps: gap-4 to gap-6
- Section margins: my-12 to my-16

**Containers:**
- Max width: max-w-6xl for main content
- Form containers: max-w-2xl (optimal form width)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

**Navigation:**
- Top navbar: Business logo left, "Book Now" CTA right
- Mobile: Hamburger menu with slide-in drawer
- Sticky on scroll with subtle shadow

**Booking Flow Components:**
- Multi-step form with progress indicator (Step 1: Drop-off, Step 2: Pickup, Step 3: Confirmation)
- Date picker: Calendar interface with disabled past dates and same-day bookings
- Time slot selector: Grid of available slots (9am-6pm), visual feedback for selection
- Service info cards: Pricing display, heavy item surcharges clearly marked

**Form Elements:**
- Input fields: Rounded-lg borders, focus ring in primary color
- Dropdowns: Custom styled select menus with chevron icons
- Checkboxes: Heavy items selection with per-item surcharge display
- Buttons: Rounded-lg, py-3 px-6, font-semibold transitions

**Information Display:**
- Pricing card: Prominent $1.50/lb display with heavy item breakdown
- Location card: Address with map icon, operating hours
- Confirmation card: Appointment details, reference number, calendar add option

**Overlays:**
- Modal dialogs: Centered, backdrop blur, slide-in animation
- Toast notifications: Top-right, auto-dismiss for confirmations

## Page Structure

**Landing/Home Page:**
- Hero section: Clean headline "Schedule Your Laundry Service" with primary CTA, business image showing clean, folded laundry
- How it works: 3-step visual guide (Schedule → Drop-off → Pickup)
- Pricing section: Clear pricing table with examples
- Location/contact: Map embed, address, hours of operation

**Booking Page:**
- Progress stepper at top
- Form sections with clear headers
- Sidebar summary (desktop) showing selected date/time and estimated pricing
- Mobile: Summary sticky footer

**Confirmation Page:**
- Success state with checkmark animation
- Appointment details card
- Next steps instructions
- Options: Add to calendar, view appointments, book another

## Images

**Hero Image:** High-quality photo of neatly folded, fresh laundry stacks or clean linens with soft natural lighting. Should convey professionalism and cleanliness. Positioned as background with gradient overlay for text readability.

**Service Images:** 
- "How it works" section: Icon-style illustrations or simple photos showing drop-off, washing, pickup process
- Optional: Photo of A & F Laundry Service location storefront for trust building

## Interactive States

**Buttons:**
- Primary: Background fill with scale on hover (scale-105)
- Secondary: Outline style with background fill on hover
- On images: Backdrop blur (backdrop-blur-md) with semi-transparent backgrounds

**Date/Time Slots:**
- Default: Border outline
- Hover: Background tint
- Selected: Primary background, white text
- Disabled: Reduced opacity, cursor-not-allowed

**Forms:**
- Focus: Primary color ring with slight scale
- Error: Red border with shake animation
- Success: Green border with checkmark

## Accessibility & Responsiveness

- Dark mode toggle in header (system preference default)
- All form inputs with proper labels and ARIA attributes
- Minimum tap targets: 44x44px on mobile
- High contrast ratios: 4.5:1 minimum for text
- Keyboard navigation support throughout booking flow
- Mobile-first responsive design with touch-friendly controls