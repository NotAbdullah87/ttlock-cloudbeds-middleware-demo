# LockFlow Database Schema

## Entity Relationship

```
properties ──1:N──► rooms ──1:N──► locks
                       │
                       └───1:N──► reservations ──1:N──► passcodes
                                   │
                                   └───1:N──► audit_logs
```

## Tables

### properties
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | Hotel/property name |
| address | TEXT | Full address |
| created_at | TIMESTAMP | Created |

### rooms
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| property_id | UUID | FK → properties |
| room_number | VARCHAR(50) | e.g. "101" |
| cloudbeds_room_id | VARCHAR(100) | External PMS ID |
| created_at | TIMESTAMP | Created |

### locks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| room_id | UUID | FK → rooms |
| ttlock_lock_id | VARCHAR(100) | Hardware ID (unique) |
| battery_level | INTEGER | 0-100 |
| status | VARCHAR(50) | online/offline/low_battery |
| last_seen | TIMESTAMP | Last heartbeat |
| created_at | TIMESTAMP | Created |

**Status values:** `online` | `offline` | `low_battery`

### reservations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| reservation_id | VARCHAR(100) | External ID (unique) |
| guest_name | VARCHAR(255) | Full name |
| check_in | TIMESTAMP | Arrival |
| check_out | TIMESTAMP | Departure |
| room_id | UUID | FK → rooms |
| status | VARCHAR(50) | pending/confirmed/checked_in/checked_out |
| created_at | TIMESTAMP | Created |

### passcodes
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| reservation_id | UUID | FK → reservations |
| code | VARCHAR(20) | 6-digit code |
| valid_from | TIMESTAMP | Start of validity |
| valid_until | TIMESTAMP | End of validity |
| status | VARCHAR(50) | active/revoked/expired |
| created_at | TIMESTAMP | Created |

### audit_logs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| action | VARCHAR(100) | Action type |
| lock_id | UUID | FK → locks |
| reservation_id | UUID | FK → reservations |
| details | JSONB | Extra context |
| created_at | TIMESTAMP | Timestamp |

**Action types:** `passcode_generated` | `passcode_revoked` | `guest_checked_in` | `guest_checked_out` | `room_reassigned`
