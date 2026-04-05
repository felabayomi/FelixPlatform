# Felix Platform Standard Operating Procedure (SOP)

This document defines the standard way to add any new project into the Felix Platform ecosystem so development, deployment, and long-term maintenance stay fast and consistent.

---

## 1. Core Platform Rule

Every new project must plug into the existing shared platform wherever possible:

- **one database**
- **one backend**
- **one admin dashboard**
- **one auth system**
- **shared domain strategy**
- **shared notification/email setup**

### Platform model

| Layer | Standard |
|---|---|
| Database | One shared PostgreSQL database |
| Backend | One shared backend/API |
| Admin | One shared admin dashboard |
| Auth | One shared login/JWT/user system |
| Domain | Each product gets its own subdomain |
| Email | Shared Resend notification setup |
| Reporting | Add project-specific tables only when needed |

---

## 2. Folder Placement Rule

All new products should live under:

```txt
apps/<ProjectName>/
```

### Recommended structure

```txt
apps/<ProjectName>/
  mobile/        # Expo app if mobile exists
  web/           # optional standalone web app
  README.md
```

### Examples

- `apps/FelixStore/mobile`
- `apps/AFLaundry/mobile`
- `apps/Document-Formatter/`

---

## 3. New Project Intake Checklist

Before implementation, answer these:

1. Project name
2. Is it **mobile**, **web**, or **both**?
3. Does it require login?
4. Does it need admin reporting or management?
5. Does it need email notifications?
6. Does it need its own database table(s)?
7. What subdomain should it use?
8. Does it need App Store / Play Store release?

---

## 4. Database SOP

### Rule

Always use the **existing shared database first**.

### Reuse existing tables when possible

- `users`
- `subscriptions`
- `products`
- `categories`
- `quote_requests`
- `support_requests`

### Create a new table only when:

- the feature needs unique reporting/history
- the data does not fit existing shared tables cleanly

### Examples of valid project-specific tables

- `document_formatter_jobs`
- `document_formatter_access_requests`

---

## 5. Auth SOP

### Rule

Do **not** create a separate auth system unless absolutely necessary.

Use the shared:

- `/auth/login`
- JWT token flow
- `users` table
- role-based access checks

### Supported access model

- `admin`
- `superadmin`
- paid/approved user access when needed

### Security rule

Public bootstrap/setup flows must always be hidden or protected by an access code.

---

## 6. Admin Dashboard SOP

### Rule

Every new project must be managed inside the **existing admin dashboard**, not by creating a second admin app.

### Add to admin when needed

- a sidebar item
- a reporting page
- CRUD management page
- access request or usage history page

### Examples

- product/category management
- formatter usage history
- access requests
- bookings/orders/reporting

---

## 7. Backend SOP

### Rule

Add new features to the shared backend.

### Standard backend structure

```txt
backend/controllers/<feature>Controller.js
backend/routes/<feature>.js
backend/server.js
```

### Required steps

1. create controller
2. create route file
3. mount route in `backend/server.js`
4. connect to shared DB
5. protect with auth middleware if required

---

## 8. Mobile App SOP

If the project includes a mobile app:

### Use Expo

Keep it under:

```txt
apps/<ProjectName>/mobile
```

### Required env

```txt
EXPO_PUBLIC_API_URL=https://felix-platform-backend.onrender.com
```

### Mobile app must include

- app icon
- splash screen
- scheme
- bundle IDs/package IDs
- help/privacy/terms/support pages
- API service file

### Typical service file

```txt
services/<app>-api.ts
```

---

## 9. Web App SOP

If the project includes a web app:

### Rule

Use the same platform patterns:

- shared backend
- shared auth
- shared DB
- own subdomain

### Web app must include

- favicon
- `site.webmanifest`
- Vercel config if needed
- environment variable pointing to the shared backend

---

## 10. Domain / Subdomain SOP

Each project gets a dedicated subdomain under `felixplatforms.com`.

### Standard pattern

| Type | Example |
|---|---|
| Platform home | `felixplatforms.com` |
| Admin | `admin.felixplatforms.com` |
| Store app web version | `storeapp.felixplatforms.com` |
| Laundry app web version | `laundryapp.felixplatforms.com` |
| Store marketing/support site | `felixstore.felixplatforms.com` |
| Laundry marketing/support site | `aflaundry.felixplatforms.com` |
| Formatter | its own formatter subdomain |

### Rule

- Marketing/support pages can live on one subdomain
- The actual interactive app can have a dedicated app subdomain

---

## 11. Email / Notification SOP

Use the shared **Resend** setup by default, while still allowing app-specific keys when a product needs its own brand or account.

### Shared platform env values

```txt
RESEND_API_KEY=
RESEND_FROM_EMAIL=
QUOTE_NOTIFICATION_EMAIL=
SUPPORT_NOTIFICATION_EMAIL=
STRIPE_SECRET_KEY=
```

### App-specific env rule

If a project needs its own third-party account, keep the variables unique by prefixing them with the app name.

### Examples

```txt
FELIX_STORE_RESEND_API_KEY=
FELIX_STORE_STRIPE_SECRET_KEY=
AF_LAUNDRY_RESEND_API_KEY=
AF_LAUNDRY_STRIPE_SECRET_KEY=
DOC_FORMATTER_RESEND_API_KEY=
DOC_FORMATTER_STRIPE_SECRET_KEY=
```

### Standard policy

- shared platform credentials stay **unprefixed**
- app-specific credentials must be **prefixed by app name**
- code should try the app-specific variable first, then fall back to the shared platform variable if appropriate

### Example fallback pattern

```js
const resendApiKey = process.env.FELIX_STORE_RESEND_API_KEY || process.env.RESEND_API_KEY;
const stripeSecretKey = process.env.FELIX_STORE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
```

### Use for

- support requests
- quote requests
- access requests
- confirmations
- admin alerts
- app-specific billing or branded notifications

---

## 12. CORS / Environment SOP

Whenever a new app or web preview is added, update backend allowed origins.

### Example

```txt
ALLOWED_ORIGINS=https://admin.felixplatforms.com,https://storeapp.felixplatforms.com,https://laundryapp.felixplatforms.com,http://localhost:8081,http://localhost:8084,http://localhost:19006
```

### Rule

Always include:

- production subdomain
- preview domain if needed
- localhost dev ports in use

---

## 13. Build & Deployment SOP

### Backend

- Deploy on **Render**

### Web apps / marketing / admin

- Deploy on **Vercel**

### Mobile apps

- Build using **Expo / EAS**

---

## 14. Release Workflow SOP

For a new project, always follow this order:

1. define app type (mobile, web, or both)
2. assign subdomain
3. connect to shared backend
4. reuse shared auth
5. reuse shared DB
6. add a project-specific table only if needed
7. add admin dashboard page/reporting if needed
8. set favicon/app icon
9. configure env + CORS
10. build locally
11. deploy
12. verify live

---

## 15. Verification Checklist Before Completion

Never call a project complete until the relevant checks are verified.

---

## 16. Backup & Recovery SOP

### Non-negotiable rule

If the shared product database is unavailable, do **not** replace the live catalog with unrelated placeholder products.

Instead:

- return a maintenance/unavailable response
- preserve the last known real catalog only if it came from the real DB
- pause risky catalog edits until database access is stable again

### Required backup safeguards

Before major product imports, edits, or image work:

1. run a catalog backup
2. confirm Neon restore access is available
3. confirm Cloudinary image URLs are still resolving

### Standard backup command

```bash
npm --prefix backend run backup:catalog
```

This writes a timestamped JSON snapshot under:

```txt
database/backups/
```

### Minimum recovery checklist during an outage

- verify whether the real data is still present in Neon SQL
- create a restore branch before overwriting anything
- never assume missing UI data means deleted DB records
- confirm `products`, `categories`, `product_categories`, and `product_images`
- restore the shared backend connection before re-enabling edits

### Provider safety rules

- monitor Neon usage and restore window regularly
- upgrade or clear provider limits before they block production reads
- keep at least one current export snapshot of the catalog outside the database
- prefer maintenance messaging over fake replacement content during incidents

### Backend

- endpoint returns expected status
- DB writes/reads work
- auth works

### Web

- build succeeds
- subdomain loads
- favicon/icon appears
- API fetch succeeds

### Mobile

- Expo Go works
- production API URL works
- images load
- auth works
- EAS build succeeds if releasing

---

## 16. Standard Reusable Prompt for Future Projects

Use this instruction when starting any new project:

> Add this as a new Felix Platform project using the standard setup: one database, one backend, one admin dashboard, shared auth, shared email, own subdomain, and mobile/web if needed.

---

## 17. Default Rule Going Forward

Unless there is a strong technical reason not to:

- do **not** create a separate backend
- do **not** create a separate database
- do **not** create a separate admin dashboard
- do **not** create a separate auth system

The default assumption is always:

**one Felix Platform, many products.**
