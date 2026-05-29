# API Flow Documentation

## Overview

LockFlow handles the event-driven communication between Cloudbeds PMS and TTLock smart locks.

## Flow

```
Cloudbeds ──webhook──► LockFlow API ──queue──► Worker
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
                   TTLock API          PostgreSQL           Audit Log
                   (passcodes)         (records)            (history)
                          │                    │                    │
                          └────────────────────┼────────────────────┘
                                               │
                                               ▼
                                    Admin Dashboard (real-time)
```

## Webhook Endpoints

### POST /webhooks/reservation-created

Triggered when a new booking is made in Cloudbeds.

```json
{
  "reservationId": "RES123",
  "roomId": "101",
  "guest": "John Doe",
  "checkIn": "2026-01-01T15:00:00Z",
  "checkOut": "2026-01-05T11:00:00Z"
}
```

**Processing:**
1. Create reservation record
2. Find associated lock
3. Call TTLock API → generate passcode
4. Store passcode + create audit log

### POST /webhooks/check-in

```json
{ "reservationId": "RES123" }
```

**Processing:**
1. Update reservation status to `checked_in`
2. Create audit log

### POST /webhooks/check-out

```json
{ "reservationId": "RES123" }
```

**Processing:**
1. Revoke active passcode
2. Update reservation to `checked_out`
3. Create audit log

### POST /webhooks/room-move

```json
{
  "reservationId": "RES123",
  "oldRoom": "101",
  "newRoom": "202"
}
```

**Processing:**
1. Revoke old passcode
2. Update room assignment
3. Generate new passcode
4. Create audit log

## Queue System

| Queue | Job | Description |
|-------|-----|-------------|
| `reservation-created` | Full passcode flow | Creates reservation + generates code |
| `check-in` | Status update | Marks guest as checked in |
| `check-out` | Revoke flow | Revokes code + marks checked out |
| `room-move` | Reassignment | Revokes old + generates new code |

## Internal API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Dashboard numbers |
| `/api/properties` | GET | Property list |
| `/api/rooms` | GET | Room list |
| `/api/locks` | GET | Lock status |
| `/api/reservations` | GET | All reservations |
| `/api/passcodes` | GET | All passcodes |
| `/api/logs` | GET | Audit logs (limit param) |

## TTLock Simulation

Fake endpoints for testing without hardware:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ttlock/generate-passcode` | POST | Simulate code generation |
| `/api/ttlock/revoke-passcode` | POST | Simulate code revocation |
| `/api/ttlock/lock/:lockId` | GET | Lock info + battery |
| `/api/ttlock/unlock/:lockId` | POST | Remote unlock (simulated) |
