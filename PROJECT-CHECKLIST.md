# Felix Platform Project Checklist

Use this quick checklist whenever a new project is added to Felix Platform.

---

## 1. Project Setup

- [ ] Confirm project name
- [ ] Confirm if it is **mobile**, **web**, or **both**
- [ ] Create folder under `apps/<ProjectName>/`
- [ ] Decide the app subdomain

---

## 2. Shared Platform Integration

- [ ] Use the **shared backend**
- [ ] Use the **shared database**
- [ ] Use the **shared auth/login system**
- [ ] Use the **shared admin dashboard**
- [ ] Use the **shared Resend email setup**

---

## 3. Database

- [ ] Reuse existing tables where possible
- [ ] Create a new table only if required
- [ ] Add schema/sql file if needed
- [ ] Verify DB reads/writes work

---

## 4. Backend

- [ ] Add controller file in `backend/controllers/`
- [ ] Add route file in `backend/routes/`
- [ ] Mount route in `backend/server.js`
- [ ] Protect with auth middleware if needed
- [ ] Test endpoint response locally

---

## 5. Admin Dashboard

- [ ] Add sidebar entry if needed
- [ ] Add management/reporting page if needed
- [ ] Verify admin access works

---

## 6. Mobile App (if included)

- [ ] Create or update `mobile/` app
- [ ] Set `EXPO_PUBLIC_API_URL`
- [ ] Add icon, splash, scheme, bundle ID
- [ ] Add help / privacy / support pages
- [ ] Verify Expo Go works
- [ ] Verify EAS build config if releasing

---

## 7. Web App (if included)

- [ ] Add favicon
- [ ] Add `site.webmanifest`
- [ ] Add deploy config if needed (`vercel.json`)
- [ ] Set env vars for backend URL
- [ ] Verify web build succeeds

---

## 8. Domain / Deployment

- [ ] Assign production subdomain under `felixplatforms.com`
- [ ] Add domain to Vercel/hosting
- [ ] Update backend `ALLOWED_ORIGINS`
- [ ] Redeploy backend if CORS/env changed
- [ ] Deploy web app / marketing pages

---

## 9. Notifications / Email / Payments

- [ ] Confirm shared env vars exist if using platform-wide services
- [ ] Confirm app-prefixed env vars exist if using app-specific Resend or Stripe accounts
- [ ] Use unique prefixes like `FELIX_STORE_*`, `AF_LAUNDRY_*`, or `DOC_FORMATTER_*`
- [ ] Verify admin email sends
- [ ] Verify customer confirmation email sends
- [ ] Verify payment/webhook keys are using the correct app-specific or shared config

---

## 10. Final Verification

- [ ] App loads locally
- [ ] App loads on live subdomain
- [ ] API fetch works
- [ ] Auth works
- [ ] Images/icons/favicons appear correctly
- [ ] Reporting/admin pages work
- [ ] Mobile/web production behavior verified

---

## Reusable Start Prompt

Use this whenever starting a new app:

> Add this as a new Felix Platform project using the shared setup: one database, one backend, one admin dashboard, shared auth, shared email, own subdomain, and mobile/web if needed.
