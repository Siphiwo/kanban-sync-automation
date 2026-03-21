# Environment Variable Setup

How to generate or obtain every secret in `.env.example`.

---

## FERNET_KEY

Used to encrypt stored OAuth tokens at rest.

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste the output directly into `FERNET_KEY`. It will look like: `abc123...=`

---

## JWT_SECRET

Used to sign JWT access tokens.

```bash
openssl rand -hex 32
```

Paste the output into `JWT_SECRET`.

---

## MONGODB_URL

1. In your Railway project dashboard, click the **MongoDB** plugin service
2. Go to **Connect** tab
3. Copy the **MongoDB Connection URL** — it looks like:
   `mongodb://mongo:<password>@<host>:<port>`
4. Paste into `MONGODB_URL`

For local dev, the default `mongodb://localhost:27017/smart_kanban_sync` works if you have MongoDB running locally.

---

## OPENAI_API_KEY

1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Copy the key (shown only once) → paste into `OPENAI_API_KEY`

Make sure your OpenAI account has billing enabled or free credits remaining.

---

## Asana OAuth (ASANA_CLIENT_ID, ASANA_CLIENT_SECRET)

1. Go to https://app.asana.com/0/my-apps
2. Click **Create new app**
3. Fill in app name (e.g. "Smart Kanban Sync") and your company name
4. Under **OAuth** → **Redirect URIs**, add:
   - `http://localhost:8000/auth/asana/callback` (local)
   - `https://<your-railway-domain>/auth/asana/callback` (prod)
5. Go to **Basic information** tab
6. Copy **Client ID** → `ASANA_CLIENT_ID`
7. Click **Show client secret** → copy → `ASANA_CLIENT_SECRET`

---

## Trello OAuth (TRELLO_API_KEY, TRELLO_API_SECRET)

1. Go to https://trello.com/power-ups/admin
2. Click **New** at the top right
3. Fill in name, workspace, and iframe connector URL (use your frontend URL or any placeholder)
4. Click **Create**
5. On the app page, click **API Key** in the left sidebar
6. Copy **API Key** → `TRELLO_API_KEY`
7. Click **Generate a new Secret** if needed → copy → `TRELLO_API_SECRET`

Note: Trello uses OAuth 1.0a. The redirect URI is passed at runtime, not configured here.

---

## Monday.com OAuth (MONDAY_CLIENT_ID, MONDAY_CLIENT_SECRET)

1. Go to https://monday.com/developers/apps
2. Click **Create app**
3. Give it a name, then go to the **OAuth** section in the left sidebar
4. Under **Redirect URIs**, add:
   - `http://localhost:8000/auth/monday/callback`
   - `https://<your-railway-domain>/auth/monday/callback`
5. Go to **Basic Information**
6. Copy **Client ID** → `MONDAY_CLIENT_ID`
7. Copy **Client Secret** → `MONDAY_CLIENT_SECRET`

---

## Jira OAuth (JIRA_CLIENT_ID, JIRA_CLIENT_SECRET)

1. Go to https://developer.atlassian.com/console/myapps/
2. Click **Create** → select **OAuth 2.0 integration**
3. Give it a name and accept the terms
4. Go to **Authorization** in the left sidebar
5. Under **Callback URL**, add:
   - `http://localhost:8000/auth/jira/callback`
   - `https://<your-railway-domain>/auth/jira/callback`
6. Go to **Permissions** → add **Jira API** → configure scopes (at minimum: `read:jira-work`, `write:jira-work`)
7. Go to **Settings**
8. Copy **Client ID** → `JIRA_CLIENT_ID`
9. Copy **Secret** → `JIRA_CLIENT_SECRET`

---

## Linear OAuth (LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET)

1. Go to https://linear.app/settings/api (you must be a workspace admin)
2. Scroll down to **OAuth applications**
3. Click **Create new application**
4. Fill in name and description
5. Under **Callback URLs**, add:
   - `http://localhost:8000/auth/linear/callback`
   - `https://<your-railway-domain>/auth/linear/callback`
6. Click **Create**
7. Copy **Client ID** → `LINEAR_CLIENT_ID`
8. Copy **Client Secret** → `LINEAR_CLIENT_SECRET`

---

## GitHub Actions Secrets

Add these in your GitHub repo under **Settings → Secrets and variables → Actions**:

| Secret | How to get it |
|---|---|
| `RAILWAY_TOKEN` | Railway dashboard → top-right avatar → **Account Settings** → **Tokens** → **Create token** |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens → **Create** |
| `VERCEL_ORG_ID` | Run `vercel whoami` — shown as team ID, or find in Vercel team **Settings → General** |
| `VERCEL_PROJECT_ID` | After running `vercel` once in the `frontend/` dir, check `frontend/.vercel/project.json` |
| `VITE_API_URL` | Your Railway backend public URL |
