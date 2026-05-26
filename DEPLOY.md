# ServeUp — Deploy to Vercel

Follow these steps in order. Total time: ~10 minutes.

---

## Step 1 — Fix the git repo

A partially-created `.git` folder already exists. Delete it and start fresh.

Open **PowerShell** in the `serveup` folder (right-click the folder → "Open in Terminal"), then run:

```powershell
Remove-Item -Recurse -Force .git
git init -b main
git add -A
git commit -m "Initial ServeUp build"
```

---

## Step 2 — Push to GitHub

1. Go to [github.com/new](https://github.com/new)
2. Create a repo named **serveup** (private is fine)
3. **Don't** initialize with a README
4. Copy the repo URL (looks like `https://github.com/yourusername/serveup.git`)

Back in PowerShell:

```powershell
git remote add origin https://github.com/yourusername/serveup.git
git push -u origin main
```

---

## Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create a free account)
2. Click **"Add New Project"**
3. Import your **serveup** GitHub repo
4. Vercel auto-detects Next.js — leave all build settings as-is
5. Before clicking Deploy, click **"Environment Variables"** and add these two:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://smumawhuwsrcbmcvvbbg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdW1hd2h1d3NyY2JtY3Z2YmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTI2NTUsImV4cCI6MjA5NTI4ODY1NX0.DeUlcHRhB5f8C6c3PiL4_2B_KdBQpnLRl5txLEGzuAU` |

6. Click **Deploy** — Vercel builds and deploys automatically (~2 min)

---

## Step 4 — Update Supabase auth settings

Once Vercel gives you a URL (e.g. `https://serveup.vercel.app`):

1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Open your project → **Authentication → URL Configuration**
3. Set **Site URL** to your Vercel URL
4. Add your Vercel URL to **Redirect URLs**

This allows Supabase auth to work correctly in production.

---

## Step 5 — Set a custom domain (optional)

In Vercel → your project → **Settings → Domains**, add your custom domain.
Then in Supabase, update the Site URL and Redirect URLs to match.

---

## Future deploys

Every time you push to `main`, Vercel automatically rebuilds and redeploys. No manual steps needed.
