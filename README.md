# Smart Kanban Sync

A public SaaS platform for syncing tasks between the top 5 kanban tools — powered by an LLM-guided setup flow.

## What it does

Connect any two of the supported platforms and describe your sync in plain language. The LLM configures the automation for you — no manual field mapping required.

**Supported platforms:** Asana · Trello · Monday.com · Jira · Linear

## Features

- OAuth login for all 5 platforms
- LLM-guided sync setup via natural language
- Bi-directional, real-time sync via webhooks
- Duplicate prevention and field mapping
- Dashboard with sync status and activity logs
- Multi-workspace/project support

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python), Motor |
| Database | MongoDB |
| Auth | OAuth 2.0 per platform + JWT |
| LLM | Guided onboarding and sync rule generation |

## Infrastructure

- **Backend + DB**: Railway
- **Frontend**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB instance (or use Railway)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your credentials
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # fill in your credentials
npm run dev
```

## Environment Variables

See `.env.example` in each of the `backend/` and `frontend/` directories for required variables (OAuth client IDs/secrets, MongoDB URI, JWT secret, etc.).

## License

MIT
