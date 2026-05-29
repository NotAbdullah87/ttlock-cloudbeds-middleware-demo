# Architecture Diagrams

The system architecture is available in two formats:

1. **Excalidraw** (`architecture.excalidraw`) — open at [excalidraw.com](https://excalidraw.com)
2. **Draw.io** (`architecture.drawio`) — open at [app.diagrams.net](https://app.diagrams.net)

## Export as PNG

### Excalidraw
1. Open `architecture.excalidraw`
2. Share → Export → PNG → Download

### Draw.io
1. Open `architecture.drawio`
2. File → Export as → PNG

## Architecture

```
┌────────────┐
│ Cloudbeds  │
└─────┬──────┘
      │ webhook
      ▼
┌──────────────────┐
│  LockFlow API    │   Port 3001
│  (Express.js)    │
└─────┬────────────┘
      │ queue job
      ▼
┌──────────────────┐
│  BullMQ          │
│  (Redis)         │
└─────┬────────────┘
      │ process
      ▼
┌──────────────────┐
│ Business Logic   │
│ Engine           │
└─────┬────────────┘
      │
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ TTLock  │  │ Postgres │  │  Audit   │
│  (fake) │  │  DB      │  │   Logs   │
└────┬────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     └─────────────┴──────────────┘
                    │
                    ▼
           ┌──────────────────┐
           │  LockFlow        │
           │  Dashboard       │   Port 3002
           └──────────────────┘
```
