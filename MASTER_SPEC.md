# Smart Kanban Sync - Master Spec

## Project Overview
A public SaaS platform that allows anyone to sync tasks between the top 5 kanban platforms using an LLM-guided setup flow. Users authenticate via OAuth, describe what they want to sync in plain language, and the LLM configures the automation.

## Supported Platforms
1. Asana
2. Trello
3. Monday.com
4. Jira (Atlassian)
5. Linear

## Core Features
- OAuth login for all 5 platforms
- LLM-guided sync setup (user describes sync in plain language)
- Bi-directional sync between any two platforms
- Webhook-based real-time sync
- Duplicate prevention
- Field mapping between platforms
- Dashboard with sync status and logs
- Multi-workspace/project support per user

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, shadcn/ui, Framer Motion — deployed on Vercel
- **Backend**: FastAPI (Python), Motor (async MongoDB) — deployed on Railway
- **Database**: MongoDB (Railway)
- **LLM**: Used for guided onboarding and sync rule generation
- **Auth**: OAuth 2.0 per platform + JWT for app sessions

## Infrastructure
- Railway: backend + MongoDB
- Vercel: frontend
- Accounts: already created and configured

---

## Master Checklist

### Auth Agent
- [ ] Asana OAuth 2.0 flow
- [ ] Trello OAuth flow
- [ ] Monday.com OAuth flow
- [ ] Jira OAuth 2.0 flow
- [ ] Linear OAuth flow
- [ ] JWT session management
- [ ] Token refresh logic for all platforms
- [ ] Secure token storage in MongoDB

### Backend Agent
- [ ] FastAPI project scaffold
- [ ] MongoDB connection (Motor)
- [ ] User model and auth endpoints
- [ ] Platform connection endpoints (connect/disconnect per platform)
- [ ] Sync rule CRUD endpoints
- [ ] Webhook receiver endpoints for all 5 platforms
- [ ] Sync engine (task event → apply rules → push to target platform)
- [ ] Duplicate prevention logic
- [ ] Field mapping engine
- [ ] Sync history logging
- [ ] Rate limiting and error handling

### LLM Integration Agent
- [ ] Onboarding conversation flow ("I want to sync X from Asana to Trello when...")
- [ ] LLM parses intent → generates structured sync rule
- [ ] Rule confirmation UI before saving
- [ ] LLM suggests field mappings based on connected platforms
- [ ] Natural language sync status summaries

### Frontend Agent
- [ ] Landing page with platform logos and OAuth login buttons
- [ ] OAuth callback handling
- [ ] LLM-guided sync setup wizard
- [ ] Dashboard: active syncs, recent activity, platform connection status
- [ ] Sync rule management (view, edit, pause, delete)
- [ ] Field mapping UI
- [ ] Sync history and logs view
- [ ] Settings: connected accounts, notifications

### UI Architect Agent
- [ ] Define component specs for each page before Frontend Agent builds
- [ ] Ensure consistent shadcn/ui component usage
- [ ] Responsive layout constraints

### DevOps Agent
- [ ] Railway project setup (backend service + MongoDB)
- [ ] Vercel project setup (frontend)
- [ ] Environment variables configured on both platforms
- [ ] Custom domain setup (if applicable)
- [ ] CI/CD pipeline configured
- [ ] Health check endpoints verified post-deploy

### QA Agent
- [ ] Backend: unit tests for sync engine and field mapping
- [ ] Backend: integration tests for all webhook endpoints
- [ ] Backend: OAuth flow tests for all 5 platforms
- [ ] Frontend: smoke tests for critical user flows
- [ ] End-to-end: create sync rule → trigger webhook → verify card created
- [ ] Load test: concurrent webhook events

### Reporter Agent
- [ ] Track checklist completion % per agent
- [ ] Surface blockers to PM Agent
- [ ] Generate deploy readiness report

---

## PM Agent Rules
- Work from this checklist as the single source of truth
- Update checklist status after each agent completes a task
- Do not invoke an agent unless its dependencies are met
- Shut down (stop invoking) an agent when its section is fully checked
- Wake a completed agent only if QA or another agent surfaces a bug in its domain
- Never ask the user for input unless a business decision is required (pricing, branding, etc.)
- Definition of Done: all checklist items checked + app publicly accessible on Vercel + Railway

---

## Agent Dependency Order
```
1. Auth Agent          (no dependencies)
2. Backend Agent       (depends on: Auth Agent)
3. LLM Integration     (depends on: Backend Agent)
4. UI Architect Agent  (depends on: nothing — runs in parallel with Backend)
5. Frontend Agent      (depends on: UI Architect Agent + Backend Agent)
6. DevOps Agent        (depends on: Backend Agent + Frontend Agent)
7. QA Agent            (runs after each agent completes, gates final deploy)
8. Reporter Agent      (runs continuously)
```
