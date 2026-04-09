# WACI Build Definition

## App
- Framework: Next.js 16
- Location: `apps/WACI/web`
- Frontend domain: `wildlifeafrica.org`
- API domain: `api.felixplatforms.com`
- Admin domain: `admin.felixplatforms.com`

## Environment
- `NEXT_PUBLIC_API_URL=https://api.felixplatforms.com`

## Commands
```bash
npm install
npm run build
npm run start
```

## Shared Felix integration
- Public content: `/api/storefront/content`
- Featured items: `/api/storefront/products`
- Support/contact form: `/support-requests`
- Admin content route: `/api/admin/storefront/content`
