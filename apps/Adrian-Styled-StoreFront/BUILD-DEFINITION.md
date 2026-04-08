# Adrian Styled StoreFront — Build Definition

## Official naming

- **Internal name:** `Adrian-Styled-StoreFront`
- **Public name:** `Adrian’s Styled Collection`
- **Admin label:** `Adrian Store`

---

## Platform position

`Adrian-Styled-StoreFront` is a **dedicated Felix web app** with its own URL and brand identity, but it must remain connected to the shared Felix platform stack:

- **shared backend** → `backend/`
- **shared Neon/Postgres database**
- **shared admin dashboard** → `admin-dashboard/frontend`
- **shared auth/JWT user system**
- **shared email/notification stack** via Resend

This means the app is **not** a separate platform. It is a new branded customer-facing experience inside the Felix ecosystem.

---

## Recommended launch definition

### Project type
- **Primary surface:** Web app
- **Phase 1:** Public storefront + quote/order/request flow
- **Phase 2:** Optional mobile app only if needed later

### Recommended production URL
- **Primary app URL:** `https://adrianstore.felixplatforms.com`

### Recommended repo location
```txt
apps/Adrian-Styled-StoreFront/
  web/
  README.md
  BUILD-DEFINITION.md
```

---

## Shared system rules

### Backend
Use the shared backend and add Adrian-specific routes only when needed.

Recommended label conventions:
- `app_name = 'Adrian Store'`
- email subjects prefixed with `Adrian Store`
- admin filtering should group Adrian Store separately from Felix Store and A & F Laundry

### Database
Reuse shared tables first:
- `products`
- `categories`
- `product_categories`
- `product_images`
- `quote_requests`
- `orders`
- `users`
- `support_requests`

Create a new Adrian-specific table **only** if the storefront later needs unique tracking that cannot fit shared tables cleanly.

### Admin dashboard
Use the existing shared admin dashboard.

Expected admin support:
- Adrian product/category management
- Adrian quote request filtering
- Adrian order filtering
- Adrian content/branding controls if needed later

---

## Brand definition

### Public brand voice
`Adrian’s Styled Collection` should feel like a distinct branded storefront, not a generic marketplace page.

### Brand separation rules
- Customer-facing title uses **Adrian’s Styled Collection**
- Admin/reporting label uses **Adrian Store**
- Technical/internal references use **Adrian-Styled-StoreFront**

### UI direction
- boutique / curated storefront feel
- clean premium layout
- product storytelling and visual presentation first
- still powered by shared Felix commerce and quote flows underneath

---

## Step-by-step implementation plan

### Step 1 — Foundation
- create `apps/Adrian-Styled-StoreFront/`
- define naming, URL, and platform role
- keep it tied to the shared Felix architecture

### Step 2 — Web storefront shell
- create the dedicated web frontend in `apps/Adrian-Styled-StoreFront/web`
- connect frontend to the shared Felix backend
- brand the UI as `Adrian’s Styled Collection`

### Step 3 — Shared catalog integration
- use shared `products` and `categories`
- tag Adrian items with `app_name = 'Adrian Store'`
- expose only Adrian inventory on the Adrian storefront

### Step 4 — Admin integration
- add Adrian filtering/views in the shared admin dashboard
- allow management of Adrian products, quotes, and orders from the same admin login

### Step 5 — Deployment
- deploy the web app to its own URL
- add the domain to allowed origins if needed
- verify product fetch, quote flow, admin visibility, and email notifications

---

## Definition of done

The build definition is complete when:

1. Adrian is treated as a **new Felix web app**, not a separate platform
2. The public brand name is **Adrian’s Styled Collection**
3. The admin label is **Adrian Store**
4. The app uses the **shared backend, shared DB, shared admin, shared auth, and shared email stack**
5. The storefront can later be deployed under its own branded URL
