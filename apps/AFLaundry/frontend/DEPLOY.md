# A&F Laundry Web App Deployment

## Service
- **App path:** `apps/AFLaundry/frontend`
- **Production domain:** `https://aflaundry.com`
- **Suggested host:** Render web service

## Render settings
- **Root Directory:** `apps/AFLaundry/frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/health`

## Production environment variables
Set these in the Render dashboard:

```env
NODE_ENV=production
AFLAUNDRY_APP_BASE_URL=https://aflaundry.com
AFLAUNDRY_RESEND_API_KEY=
AFLAUNDRY_RESEND_FROM_EMAIL="A & F Laundry <bookings@aflaundry.com>"
AFLAUNDRY_NOTIFICATION_EMAIL=aflaundryservice@gmail.com
```

## Custom domain
Attach these in Render after the service is live:
- `aflaundry.com`
- `www.aflaundry.com` (optional)

Then update your DNS records to point the domain to Render.

## Important note
The current scheduler stores appointments in `server/storage.ts` using in-memory storage. That means appointments will reset on redeploy or restart.

For live customer bookings, the next hardening step is to move appointment storage to Postgres before taking production traffic.
