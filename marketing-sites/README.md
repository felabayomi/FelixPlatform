# Marketing Sites

This folder contains standalone static marketing sites for:

- `felix-platform/` → deploy to `https://felixplatforms.com`
- `felix-store/` → deploy to `https://felixstore.felixplatforms.com`
- `aflaundry/` → deploy to `https://aflaundry.felixplatforms.com`

## Recommended domain structure

Use your existing domain like this:

- `https://felixplatforms.com` → main brand / umbrella landing page
- `https://felixstore.felixplatforms.com` → Felix Store public site
- `https://aflaundry.felixplatforms.com` → A & F Laundry public site

## Suggested deployment

Use **one Vercel project** with the root directory set to:

```text
marketing-sites
```

The included `vercel.json` will route each hostname automatically:

- `felixplatforms.com` → `felix-platform/`
- `www.felixplatforms.com` → `felix-platform/`
- `felixstore.felixplatforms.com` → `felix-store/`
- `aflaundry.felixplatforms.com` → `aflaundry/`

After that, attach all of those domains to the same Vercel project and redeploy.

## App Store URLs to use

### Felix Store
- `https://felixstore.felixplatforms.com`
- `https://felixstore.felixplatforms.com/privacy/`
- `https://felixstore.felixplatforms.com/terms/`
- `https://felixstore.felixplatforms.com/support/`
- `https://felixstore.felixplatforms.com/about/`
- `https://felixstore.felixplatforms.com/how-it-works/`

### A & F Laundry
- `https://aflaundry.felixplatforms.com`
- `https://aflaundry.felixplatforms.com/privacy/`
- `https://aflaundry.felixplatforms.com/terms/`
- `https://aflaundry.felixplatforms.com/support/`
- `https://aflaundry.felixplatforms.com/about/`
- `https://aflaundry.felixplatforms.com/how-it-works/`
