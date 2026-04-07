# A&F Laundry Web App Deployment

## Service
- **App path:** `apps/AFLaundry/frontend`
- **Production domain:** `https://aflaundry.com`
- **Suggested host:** Render web service

## Render settings
- **Root Directory:** `apps/AFLaundry/frontend`
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/health`

> If Render shows `sh: 1: vite: not found`, it means the service is skipping build-time packages. Keep `NPM_CONFIG_PRODUCTION=false`, and if the service was created manually, update the Render dashboard settings directly before redeploying.

## Production environment variables
Set these in the Render dashboard:

```env
DATABASE_URL=
AFLAUNDRY_APP_BASE_URL=https://aflaundry.com
AFLAUNDRY_RESEND_API_KEY=
AFLAUNDRY_RESEND_FROM_EMAIL="A & F Laundry <hello@aflaundry.com>"
AFLAUNDRY_NOTIFICATION_EMAIL=aflaundryservice@gmail.com
```

> Add these in the **Render service for `apps/AFLaundry/frontend`**. The values in `backend/.env` do not automatically carry over to this separate web app.

## Custom domain
Attach these in Render after the service is live:
- `aflaundry.com`
- `www.aflaundry.com` (optional)

Then update your DNS records to point the domain to Render.

## Database
This app now supports persistent Neon/Postgres storage through `DATABASE_URL`.

- In **production**, `DATABASE_URL` is required.
- On startup, the app will automatically create the `appointments` table if it does not exist yet.
- If you want to pre-create it manually in Neon, use `database/aflaundry_appointments.sql` from the repo root.
- For local development without a database, it can still fall back to in-memory storage.

That means real customer bookings can now persist properly once the Render service has the Neon connection string.
