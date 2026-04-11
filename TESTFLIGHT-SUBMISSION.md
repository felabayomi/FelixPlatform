# TestFlight Submission Guide – Felix Store & A & F Laundry

Both apps are configured to fetch all product/service data from the backend API. **No rebuild needed for content changes.** Only resubmit when modifying app code.

---

## App Configuration Status

### Felix Store
- **Bundle ID**: `com.felixstore.us`
- **App Store Connect ID**: `1567050617`
- **EAS Project ID**: `a88d01ae-efc7-4d14-9fd6-d9567a1a0a7a`
- **Current Version**: `3.0.0` (build `3.0.0`)
- **API Endpoint**: `https://felix-platform-backend.onrender.com`
- **API Param**: Fetches `/products?app_name=Felix Store`

### A & F Laundry
- **Bundle ID**: `com.afwebtech.aflaundry`
- **App Store Connect ID**: `1596646806`
- **EAS Project ID**: `c21a332e-4ae3-4ea5-ad2a-b0dca90adf4e`
- **Current Version**: `2.0.2` (build `2.0.2`)
- **API Endpoint**: `https://felix-platform-backend.onrender.com`
- **API Param**: Fetches `/products?app_name=A%26F%20Laundry`

---

## Step 1: Build for TestFlight

### Prerequisites
- EAS CLI installed: `npm install -g eas-cli`
- Apple Developer cert + auth key already configured ✅
- Git on `main` branch, no uncommitted changes

### Build Felix Store

```bash
cd apps/FelixStore/mobile
eas build --platform ios --profile production
```

- EAS will build and upload directly to App Store Connect
- Takes ~10–15 minutes
- You'll get a link to check build status: https://expo.dev/builds

### Build A & F Laundry

```bash
cd apps/AFLaundry/mobile
eas build --platform ios --profile production
```

Same as above.

---

## Step 2: Submit to TestFlight

Once the build completes, **both** apps are automatically submitted to TestFlight. You can:
- Manually submit via App Store Connect, or
- Use EAS to auto-submit:

```bash
eas submit --platform ios --latest
```

---

## Step 3: Release to TestFlight Testers

1. Go to **App Store Connect** → **TestFlight** tab
2. Select the app (Felix Store or A & F Laundry)
3. Under **Builds**, select the new build
4. Click **Submit for Review** → choose your internal/external testers
5. Once approved (~1 hour), send testers the TestFlight link

---

## Content Updates (No Rebuild Needed)

### To update products, prices, images, or descriptions:

1. Go to https://admin.felixplatforms.com/products
2. Add/edit products, upload images, change prices
3. Click **Save**
4. Changes live immediately – users see them next time they launch the app

### For app-level changes (UI, navigation, code):

1. Update app code locally
2. Commit to `main`
3. Follow Steps 1–3 above to rebuild + resubmit to TestFlight

---

## Monitoring & Rollback

### Check API health
```bash
curl https://felix-platform-backend.onrender.com/health
curl https://felix-platform-backend.onrender.com/products?app_name=Felix%20Store
```

### If products not loading in app
- Check admin dashboard: https://admin.felixplatforms.com/products
- Verify backend is running: Render console
- Check app logs in Xcode (if testing locally)

---

## Quick Checklist Before Submission

- [ ] Code changes are on `main` branch
- [ ] No tracked changes in git (`git status` is clean)
- [ ] Backend is healthy (`/health` returns 200)
- [ ] Products are visible in admin dashboard
- [ ] EAS auth keys are valid in `eas.json`
- [ ] App version is incremented in `app.json` (if resubmitting same build, skip increment)

---

## Future: Automated Release Pipeline

The `scripts/release-main.ps1` can be extended to include EAS builds. For now, manual builds via EAS keep you in control of what goes to TestFlight.
