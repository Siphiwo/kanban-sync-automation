# Smart Kanban Sync — Deployment Guide

## 1. Prerequisites

Install the required CLIs:

```bash
# Railway CLI
npm install -g @railway/cli
railway login

# Vercel CLI
npm install -g vercel
vercel login
```

Your GitHub repo must be pushed and accessible. All secrets in `.env.example` must be populated before deploying (see `ENV_SETUP.md`).

---

## 2. Create OAuth Apps

You need OAuth credentials from all 5 platforms. Use these exact developer portal URLs.

### Asana
- Portal: https://app.asana.com/0/my-apps
- Click **Create new app**
- Redirect URI (local): `http://localhost:8000/auth/asana/callback`
- Redirect URI (prod): `https://<your-railway-domain>/auth/asana/callback`
- Copy **Client ID** → `ASANA_CLIENT_ID`, **Client Secret** → `ASANA_CLIENT_SECRET`

### Trello
- Portal: https://trello.com/power-ups/admin
- Click **New** → fill in app name and iframe connector URL (can be your frontend URL)
- Go to **API Key** tab
- Copy **API Key** → `TRELLO_API_KEY`, **Secret** → `TRELLO_API_SECRET`
- Trello uses OAuth 1.0a — no redirect URI needed at creation time

### Monday.com
- Portal: https://monday.com/developers/apps
- Click **Create app** → go to **OAuth** section
- Redirect URI (local): `http://localhost:8000/auth/monday/callback`
- Redirect URI (prod): `https://<your-railway-domain>/auth/monday/callback`
- Copy **Client ID** → `MONDAY_CLIENT_ID`, **Client Secret** → `MONDAY_CLIENT_SECRET`

### Jira (Atlassian)
- Portal: https://developer.atlassian.com/console/myapps/
- Click **Create** → **OAuth 2.0 integration**
- Under **Authorization**, add callback URL:
  - Local: `http://localhost:8000/auth/jira/callback`
  - Prod: `https://<your-railway-domain>/auth/jira/callback`
- Under **Permissions**, add **Jira API** scopes as needed
- Copy **Client ID** → `JIRA_CLIENT_ID`, **Secret** → `JIRA_CLIENT_SECRET`

### Linear
- Portal: https://linear.app/settings/api (must be workspace admin)
- Scroll to **OAuth applications** → **Create new**
- Redirect URI (local): `http://localhost:8000/auth/linear/callback`
- Redirect URI (prod): `https://<your-railway-domain>/auth/linear/callback`
- Copy **Client ID** → `LINEAR_CLIENT_ID`, **Client Secret** → `LINEAR_CLIENT_SECRET`

---

## 3. Railway Setup (Backend + MongoDB)

```bash
# Create a new Railway project
railway init

# Add MongoDB plugin inside Railway dashboard:
# Dashboard → your project → + New → Database → MongoDB
# Railway will inject MONGO_URL automatically, but copy the connection string
# for MONGODB_URL in your backend service env vars.

# Link your GitHub repo
# Dashboard → your service → Settings → Source → Connect GitHub repo → select branch: main

# Set all environment variables
# Dashboard → your backend service → Variables → add each from .env.example:
railway variables set MONGODB_URL="<from Railway MongoDB plugin>"
railway variables set JWT_SECRET="<generated>"
railway variables set JWT_ALGORITHM="HS256"
railway variables set JWT_EXPIRE_MINUTES="10080"
railway variables set FERNET_KEY="<generated>"
railway variables set FRONTEND_URL="https://<your-vercel-domain>"
railway variables set ASANA_CLIENT_ID="..." ASANA_CLIENT_SECRET="..."
railway variables set TRELLO_API_KEY="..." TRELLO_API_SECRET="..."
railway variables set MONDAY_CLIENT_ID="..." MONDAY_CLIENT_SECRET="..."
railway variables set JIRA_CLIENT_ID="..." JIRA_CLIENT_SECRET="..."
railway variables set LINEAR_CLIENT_ID="..." LINEAR_CLIENT_SECRET="..."
railway variables set OPENAI_API_KEY="..."

# Deploy
railway up
```

After deploy, Railway will give you a public domain like `https://smart-kanban-sync-backend.up.railway.app`. Save this — you'll need it for Vercel and OAuth redirect URIs.

---

## 4. Vercel Setup (Frontend)

```bash
cd frontend

# Import project (first time)
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework: Vite (auto-detected)
# - Build command: npm run build
# - Output dir: dist

# Set the backend URL env var
vercel env add VITE_API_URL production
# Enter: https://<your-railway-domain>

# Deploy to production
vercel --prod
```

Or via the Vercel dashboard:
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL` = `https://<your-railway-domain>`
5. Click **Deploy**

---

## 5. Post-Deploy Checklist

- [ ] Hit `https://<railway-domain>/health` — expect `{"status": "ok"}`
- [ ] Open `https://<vercel-domain>` — frontend loads without console errors
- [ ] Test one OAuth flow end-to-end (e.g. connect Asana): click connect → authorize → redirected back with token
- [ ] Create a test sync rule between two connected boards and verify it saves
- [ ] Check Railway logs for any startup errors: `railway logs`
- [ ] Verify MongoDB connection: Railway dashboard → MongoDB plugin → Data tab

---

## 6. Environment Variables Reference

| Variable | Where to get it | Used by |
|---|---|---|
| `MONGODB_URL` | Railway MongoDB plugin → connection string | Backend |
| `JWT_SECRET` | Generate (see ENV_SETUP.md) | Backend |
| `JWT_ALGORITHM` | Hardcode: `HS256` | Backend |
| `JWT_EXPIRE_MINUTES` | Hardcode: `10080` (7 days) | Backend |
| `FERNET_KEY` | Generate (see ENV_SETUP.md) | Backend |
| `FRONTEND_URL` | Your Vercel deployment URL | Backend (CORS) |
| `ASANA_CLIENT_ID` | Asana developer portal | Backend |
| `ASANA_CLIENT_SECRET` | Asana developer portal | Backend |
| `TRELLO_API_KEY` | Trello Power-Up admin | Backend |
| `TRELLO_API_SECRET` | Trello Power-Up admin | Backend |
| `MONDAY_CLIENT_ID` | Monday.com developer portal | Backend |
| `MONDAY_CLIENT_SECRET` | Monday.com developer portal | Backend |
| `JIRA_CLIENT_ID` | Atlassian developer console | Backend |
| `JIRA_CLIENT_SECRET` | Atlassian developer console | Backend |
| `LINEAR_CLIENT_ID` | Linear workspace settings | Backend |
| `LINEAR_CLIENT_SECRET` | Linear workspace settings | Backend |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Backend |
| `VITE_API_URL` | Your Railway backend URL | Frontend (build time) |
| `RAILWAY_TOKEN` | Railway dashboard → Account → Tokens | GitHub Actions |
| `VERCEL_TOKEN` | Vercel dashboard → Account → Tokens | GitHub Actions |
| `VERCEL_ORG_ID` | `vercel whoami` or Vercel team settings | GitHub Actions |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after first `vercel` run | GitHub Actions |
