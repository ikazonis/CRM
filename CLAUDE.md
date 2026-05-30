# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A multi-tenant WhatsApp CRM. Companies register, manage contacts and segments, create message campaigns, and dispatch them via Z-API (WhatsApp). Each company's data is strictly isolated by `company_id`.

## Commands

### Backend (Go)
```powershell
# Run the API server
go run ./cmd/api

# Build binary
go build -o crm.exe ./cmd/api

# Tidy dependencies
go mod tidy
```

### Frontend (React + Vite)
```powershell
cd frontend

npm run dev       # dev server (hot reload)
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # serve the production build locally
```

### Database migrations
Migrations are plain SQL files in `internal/db/migrations/` and are applied manually against PostgreSQL — there is no migration runner. Apply in numeric order.

## Required environment variables

The backend reads from `.env` at startup (via `godotenv`). Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | HMAC secret for JWT signing |
| `ZAPI_INSTANCE_ID` | Z-API WhatsApp instance |
| `ZAPI_TOKEN` | Z-API token |
| `ZAPI_CLIENT_TOKEN` | Z-API client token |
| `WEBHOOK_VERIFY_TOKEN` | Token for Z-API webhook handshake |

Optional: `PORT` (default `8080`), `JWT_EXPIRY_HOURS` (default `24`).

The frontend API base URL is hardcoded in `frontend/src/services/api.ts` to the Railway production URL. For local development, create `frontend/.env.local` with `VITE_API_URL=http://localhost:8080` and update `api.ts` to use `import.meta.env.VITE_API_URL`.

## Architecture

### Backend
Uses Go's stdlib `net/http` with Go 1.22+ method+path routing syntax (`"GET /contacts"`). No external router framework. All routes are registered in `cmd/api/main.go`.

Route structure:
- **Public**: `POST /register`, `POST /login`, `/webhook/whatsapp`
- **Protected** (JWT required): everything else — wrapped by `authSvc.Middleware`

Each domain (`auth`, `contact`, `segment`, `campaign`, `message`, `dashboard`, `webhook`) follows the same three-layer pattern:
- `repository.go` — SQL queries against `*pgxpool.Pool`
- `service.go` — business logic, calls repository
- `handler.go` — HTTP parsing, calls service, writes JSON via `pkg/httputil`

The auth middleware (`internal/auth/middleware.go`) validates the JWT and injects `company_id` and `user_id` into the request context. Every handler reads `company_id` from `r.Context().Value(auth.ContextCompanyID)` — this is the multi-tenancy boundary; all DB queries include `WHERE company_id = $1`.

### WhatsApp messaging flow
1. `POST /campaigns/{id}/send` calls `messageHandler.Send`
2. It resolves the campaign's segment → fetches contacts by inactivity days
3. `message.Service.SendCampaign` iterates contacts, renders `{{nome}}` in the message template, calls Z-API's REST API (`/send-messages`), and sleeps 1 second between each send
4. Incoming Z-API webhooks (`/webhook/whatsapp`) increment `delivered_count` or `response_count` on the most recent `sent` campaign

### Frontend
React 19 + TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Axios, TanStack Query (installed but not yet used broadly — most pages use `useState`/`useEffect` with direct `api.*` calls).

- `src/services/api.ts` — Axios instance; attaches `Authorization: Bearer <token>` from `localStorage` on every request
- `src/App.tsx` — route definitions; `PrivateRoute` redirects to `/login` if no token in localStorage
- Pages make API calls directly and redirect to `/login` on 401

### Database schema
Two migrations define the full schema:
- `companies` + `users` (one company per registration, one user per company currently)
- `contacts` (unique on `(company_id, phone)`)
- `segments` (filter contacts by `inactive_days` — days since `last_msg_at`)
- `campaigns` (status: `draft` → `sent`; tracks `delivered_count`, `response_count`)

### Shared packages
- `pkg/httputil` — `JSON(w, status, data)` and `Error(w, status, msg)` helpers used by all handlers
- `pkg/validate` — `NormalizePhone` strips formatting and validates E.164-like format
