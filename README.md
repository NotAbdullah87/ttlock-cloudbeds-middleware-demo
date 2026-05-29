# LockFlow

A sleek middleware system that connects property management systems with smart lock infrastructure. Think Zapier meets hotel tech — events flow in, codes flow out.

## The Stack

```
Cloudbeds ──webhooks──► LockFlow ──API──► Smart Locks
                              │
                              └──► Dashboard
```

## Run It

```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis

# Terminal 2: Backend (port 3001)
cd backend && npm install && npm run dev

# Terminal 3: Dashboard (port 3002)
cd dashboard && npm install && npm start
```

## What It Does

| Webhook | Action |
|---------|--------|
| `reservation-created` | Generates a timed passcode |
| `check-in` | Activates the code |
| `check-out` | Revokes the code |
| `room-move` | Reassigns & regenerates |

## Tech

- **Backend**: Express + BullMQ + PostgreSQL
- **Queue**: Redis-backed job queue
- **Locks**: Simulated TTLock API (no real hardware needed)
- **Dashboard**: Vanilla JS SPA — fast and dependency-free

## Project Structure

```
lockflow/
├── backend/           # Express API + queue workers
├── dashboard/          # Admin dashboard (static)
├── docs/              # Architecture & API docs
└── architecture/      # Diagrams
```

## API

### Webhooks
- `POST /webhooks/reservation-created`
- `POST /webhooks/check-in`
- `POST /webhooks/check-out`
- `POST /webhooks/room-move`

### API
- `GET /api/stats` — Dashboard numbers
- `GET /api/reservations` — All bookings
- `GET /api/passcodes` — Active codes
- `GET /api/locks` — Lock status
- `GET /api/logs` — Audit trail

## Database

6 tables: `properties`, `rooms`, `locks`, `reservations`, `passcodes`, `audit_logs`

Run `npm run db:seed` to populate with demo data.
