# TTLock-Cloudbeds Middleware Demo

A production-grade middleware system that integrates Cloudbeds PMS with TTLock smart locks via webhooks, queues, and a real-time admin dashboard.

## Architecture
<img width="400" height="auto" alt="mermaid-diagram-2026-05-30-043411" src="https://github.com/user-attachments/assets/f5c19115-653d-454b-b815-5774e175074d" />

## Quick Start

### Prerequisites
- Node.js 18+
- Redis (for BullMQ)
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Dashboard Setup

```bash
cd dashboard
npm install
npm run dev
```

### Start Redis (required for queues)

```bash
docker run -d -p 6379:6379 redis
```

## Features

- **Webhook Integration**: Receives events from Cloudbeds PMS
- **Queue Processing**: BullMQ-based reliable job processing
- **TTLock Simulation**: Fake TTLock OpenAPI for testing
- **Admin Dashboard**: Real-time monitoring and management
- **Audit Logging**: Complete activity tracking

## Project Structure

```
ttlock-cloudbeds-middleware-demo/
├── architecture/
│   ├── architecture.png
│   └── architecture.drawio
├── backend/
│   ├── src/
│   │   ├── webhooks/       # Cloudbeds webhook handlers
│   │   ├── services/       # Business logic
│   │   ├── queues/         # BullMQ queue workers
│   │   ├── database/       # PostgreSQL models & migrations
│   │   └── routes/         # API routes
│   └── package.json
├── dashboard/
│   ├── src/
│   │   ├── pages/          # Dashboard pages
│   │   └── components/     # UI components
│   └── package.json
├── docs/
│   ├── api-flow.md
│   └── database-design.md
└── screenshots/
```

## API Endpoints

### Webhooks (Cloudbeds -> Middleware)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhooks/reservation-created` | POST | New reservation created |
| `/webhooks/check-in` | POST | Guest checked in |
| `/webhooks/check-out` | POST | Guest checked out |
| `/webhooks/room-move` | POST | Guest moved to different room |

### Internal API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | List all properties |
| `/api/rooms` | GET | List all rooms |
| `/api/locks` | GET | List all locks |
| `/api/reservations` | GET | List all reservations |
| `/api/passcodes` | GET | List all passcodes |
| `/api/logs` | GET | List audit logs |
| `/api/stats` | GET | Dashboard statistics |

## Database Schema

### Properties
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Property name |
| address | TEXT | Property address |
| created_at | TIMESTAMP | Creation timestamp |

### Rooms
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| property_id | UUID | Foreign key to properties |
| room_number | VARCHAR | Room number |
| cloudbeds_room_id | VARCHAR | Cloudbeds room ID |

### Locks
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| room_id | UUID | Foreign key to rooms |
| ttlock_lock_id | VARCHAR | TTLock lock ID |
| battery_level | INTEGER | Battery percentage |
| status | VARCHAR | online/offline/low_battery |

### Reservations
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| reservation_id | VARCHAR | Cloudbeds reservation ID |
| guest_name | VARCHAR | Guest name |
| check_in | TIMESTAMP | Check-in time |
| check_out | TIMESTAMP | Check-out time |
| room_id | UUID | Foreign key to rooms |

### Passcodes
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| reservation_id | UUID | Foreign key to reservations |
| code | VARCHAR | 6-digit passcode |
| valid_from | TIMESTAMP | Start of validity |
| valid_until | TIMESTAMP | End of validity |
| status | VARCHAR | active/revoked/expired |

### Audit Logs
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| action | VARCHAR | Action type |
| lock_id | UUID | Foreign key to locks |
| reservation_id | UUID | Foreign key to reservations |
| created_at | TIMESTAMP | Timestamp |

## License

MIT
