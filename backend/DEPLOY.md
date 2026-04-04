# Felix Platform Backend Deployment

## Option 1: Render
1. Push the repository to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Set the **Root Directory** to `backend`.
4. Use:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables from `.env.example`:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `ALLOWED_ORIGINS`
   - `NODE_ENV=production`
6. Deploy and verify `/health`.

## Option 2: Railway
1. Create a new Railway project from the repo.
2. Point Railway to the `backend` folder.
3. Add the same environment variables.
4. Railway will use `railway.json` and `npm start` automatically.
5. Verify the deployed `/health` and `/products` endpoints.

## After deployment
Update mobile app env values to use the public backend URL:

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.up.railway.app
```

or

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.onrender.com
```
