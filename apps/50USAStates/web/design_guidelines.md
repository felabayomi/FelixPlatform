# Design Guidelines: Political Polling & Research Services Platform

## Design Approach

**System-Based Approach**: Professional consulting platform inspired by data-driven services like Stripe, Tableau, and enterprise consulting firms. This is a B2B professional service requiring trust, credibility, and clarity above all else.

**Core Principles**:
- Non-partisan neutrality through balanced, professional aesthetics
- Data visualization excellence demonstrating analytical capabilities
- Clear service differentiation and expertise communication
- Trust-building through polish and attention to detail

## Typography

**Font Families** (Google Fonts):
- Primary: Inter (headings, UI) - professional, neutral, excellent readability
- Secondary: IBM Plex Sans (body text) - data-friendly, technical credibility
- Monospace: JetBrains Mono (data tables, numbers) - analytical precision

**Type Scale**:
- Hero headline: text-5xl lg:text-7xl, font-bold
- Section headlines: text-3xl lg:text-4xl, font-semibold
- Service titles: text-2xl, font-semibold
- Body text: text-lg, font-normal
- Captions/metadata: text-sm, font-medium

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 lg:py-24
- Card gaps: gap-6 to gap-8
- Container max-width: max-w-7xl

**Grid Strategy**:
- Services: 3-column grid (lg:grid-cols-3) for service offerings
- Case studies: 2-column layout (lg:grid-cols-2)
- Stats/metrics: 4-column grid (lg:grid-cols-4) for impact numbers
- Mobile: Always single column stacking

## Component Library

### Navigation
- Sticky header with logo, main nav links (Services, Case Studies, Insights, Contact)
- CTA button: "Request Consultation" with subtle emphasis
- Clean, minimal design with transparency/blur on scroll

### Hero Section
- Large, impactful image showing professional political campaign setting or data visualization dashboard
- Headline: "Data-Driven Intelligence for Political Campaigns"
- Subheadline explaining non-partisan approach
- Dual CTAs: Primary "Schedule Consultation", Secondary "View Services"
- Trust indicator: "Serving campaigns across all parties since 2024" or client logos

### Services Section
- 4 service cards in grid:
  1. Voter Modeling & Analytics
  2. Focus Group Coordination
  3. Polling Firm Partnership
  4. Voter File Analysis
- Each card: Icon, title, 2-3 sentence description, "Learn More" link
- Clean card design with subtle borders

### Capabilities Dashboard Preview
- Sample data visualization showing polling trends, demographic breakdowns
- Chart library integration (Chart.js or similar)
- Shows analytical sophistication without revealing real client data
- Title: "Sample Insights Dashboard" with disclaimer

### Case Studies/Portfolio
- 2-column grid of anonymized case studies
- Each: Challenge, Approach, Results (with metrics)
- Use charts/graphs where appropriate
- "Results vary by campaign" disclaimer

### Contact/Inquiry Form
- Clean, professional form layout
- Fields: Name, Organization, Campaign Type, Services Needed, Timeline, Message
- Clear privacy statement about non-partisan confidentiality
- Side panel with: Response time, consultation process, contact alternatives

### Footer
- Comprehensive: Quick links, service categories, contact info
- Professional credentials/certifications if applicable
- Newsletter signup: "Campaign Intelligence Insights"
- Social proof: "Trusted by X campaigns nationwide"
- Legal: Privacy Policy, Terms of Service

## Images

**Hero Image**: Professional political campaign war room or modern data visualization dashboard on large screens. Should convey sophistication, strategy, and analytical rigor. Alternative: Abstract data visualization patterns.

**Service Icons**: Use Heroicons (outline style) via CDN for service representations - chart-bar, users, document-magnifying-glass, database.

**Case Study Visuals**: Abstract charts, graphs, demographic maps (generated via Chart.js, not static images) to demonstrate analytical outputs.

## Design Distinctions

**Avoid Generic Patterns**: Instead of standard consultant layout, use asymmetric hero with data visualization preview alongside headline. Mix card-based services with inline chart demonstrations.

**Professional Polish**:
- Subtle shadows and borders (not heavy drop-shadows)
- Ample whitespace for breathing room
- Data-forward design showcasing analytical capabilities
- Clean, uncluttered layouts emphasizing clarity

**Trust Signals Throughout**:
- Client count or campaign metrics
- Bipartisan language and imagery
- Professional photography quality
- Clear, jargon-free explanations

## Accessibility

- WCAG 2.1 AA compliance for government/political work
- High contrast text on all backgrounds
- Clear focus states for keyboard navigation
- Semantic HTML for screen readers