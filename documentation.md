# Zetwa WhatsApp API Documentation

Zetwa adalah WhatsApp API Gateway yang memungkinkan Anda mengirim dan menerima pesan WhatsApp melalui REST API.

---

## Table of Contents

### User Documentation
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Sessions](#sessions)
- [Sending Messages](#sending-messages)
- [Webhooks](#webhooks)
- [API Reference](#api-reference)

### Developer Documentation
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

# User Documentation

## Getting Started

### Step 1: Create an Account
Daftar di dashboard Zetwa untuk mendapatkan akses ke API.

### Step 2: Create an API Key
1. Login ke dashboard
2. Navigasi ke menu "API Keys"
3. Klik "Create API Key"
4. Pilih permissions yang diperlukan
5. Simpan API key dengan aman (hanya ditampilkan sekali)

### Step 3: Create a WhatsApp Session
1. Navigasi ke menu "Sessions"
2. Klik "Create New Session"
3. Masukkan nama session
4. Scan QR code dengan WhatsApp di ponsel Anda
5. Tunggu hingga status berubah menjadi "Connected"

### Step 4: Start Sending Messages
Gunakan API key dan session ID untuk mengirim pesan.

```bash
curl -X POST http://localhost:3222/api/sessions/{sessionId}/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "628123456789",
    "message": "Hello from Zetwa!"
  }'
```

---

## Authentication

### API Key Authentication
Semua API request harus menyertakan API key di header `X-API-Key`:

```
X-API-Key: zetwa_xxxxxxxxxxxxxxxxxxxx
```

### API Key Scopes
| Scope | Description |
|-------|-------------|
| `sessions:read` | View session information and status |
| `sessions:write` | Create, update, and delete sessions |
| `messages:send` | Send messages through connected sessions |
| `messages:read` | View message history |
| `webhooks:manage` | Create and manage webhooks |
| `contacts:read` | View contact information |

### Security Best Practices
- Jangan expose API key di client-side code
- Selalu gunakan HTTPS di production
- Rotate API key secara berkala
- Gunakan scope minimal yang diperlukan

---

## Sessions

### Session Status
| Status | Description |
|--------|-------------|
| `INITIALIZING` | Session sedang diinisialisasi |
| `QR_READY` | QR code siap untuk di-scan |
| `AUTHENTICATING` | Proses autentikasi WhatsApp |
| `CONNECTED` | Session terhubung dan siap digunakan |
| `DISCONNECTED` | Session terputus |
| `FAILED` | Session gagal |
| `LOGGED_OUT` | Session logout |

### QR Code Scanning
Setelah membuat session, QR code akan ditampilkan. Scan dengan aplikasi WhatsApp:
1. Buka WhatsApp di ponsel
2. Tap Menu (⋮) > Linked Devices
3. Tap "Link a Device"
4. Scan QR code yang ditampilkan

---

## Sending Messages

### Text Message
```bash
curl -X POST http://localhost:3222/api/sessions/{sessionId}/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "628123456789",
    "message": "Hello World!"
  }'
```

### Image Message
```bash
curl -X POST http://localhost:3222/api/sessions/{sessionId}/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "628123456789",
    "media": {
      "type": "image",
      "url": "https://example.com/image.jpg",
      "caption": "Check this out!"
    }
  }'
```

### Document Message
```bash
curl -X POST http://localhost:3222/api/sessions/{sessionId}/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "628123456789",
    "media": {
      "type": "document",
      "url": "https://example.com/file.pdf",
      "filename": "document.pdf"
    }
  }'
```

### Phone Number Format
Nomor telepon harus menyertakan kode negara tanpa simbol `+`:
- Indonesia: `628123456789`
- USA: `14155551234`
- UK: `447911123456`

---

## Webhooks

### Webhook Events
| Event | Description |
|-------|-------------|
| `message` | Pesan masuk diterima |
| `message_ack` | Status pesan berubah (sent, delivered, read) |
| `message_create` | Pesan baru dibuat |
| `message_revoke` | Pesan dihapus |
| `qr` | QR code baru tersedia |
| `ready` | Session siap digunakan |
| `disconnected` | Session terputus |
| `group_join` | Anggota bergabung ke grup |
| `group_leave` | Anggota keluar dari grup |

### Create Webhook
```bash
curl -X POST http://localhost:3222/api/sessions/{sessionId}/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["message", "message_ack"],
    "secret": "optional_secret_for_signing"
  }'
```

### Webhook Payload Example
```json
{
  "event": "message",
  "sessionId": "my-session",
  "timestamp": 1699123456789,
  "data": {
    "message": {
      "id": "true_628xxx@c.us_ABCD1234",
      "from": "628123456789@c.us",
      "to": "628987654321@c.us",
      "body": "Hello!",
      "type": "TEXT",
      "timestamp": 1699123456,
      "fromMe": false
    },
    "chat": {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "isGroup": false
    }
  }
}
```

### Webhook Signature Verification
Jika webhook memiliki secret, payload akan di-sign dengan HMAC-SHA256. Verifikasi menggunakan header `X-Webhook-Signature`:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## API Reference

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions` | Create a new session |
| GET | `/api/sessions/{id}` | Get session details |
| GET | `/api/sessions/{id}/status` | Get session status and QR code |
| POST | `/api/sessions/{id}/restart` | Restart session |
| POST | `/api/sessions/{id}/logout` | Logout from WhatsApp |
| DELETE | `/api/sessions/{id}` | Delete session |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/{id}/messages/send` | Send a message |
| GET | `/api/sessions/{id}/messages` | Get message history |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/{id}/contacts` | Get all contacts |
| GET | `/api/sessions/{id}/contacts/{phone}/check` | Check if number is on WhatsApp |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/{id}/webhooks` | List webhooks |
| POST | `/api/sessions/{id}/webhooks` | Create webhook |
| PUT | `/api/sessions/{id}/webhooks/{webhookId}` | Update webhook |
| DELETE | `/api/sessions/{id}/webhooks/{webhookId}` | Delete webhook |
| POST | `/api/sessions/{id}/webhooks/{webhookId}/test` | Test webhook |

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-keys` | List API keys |
| POST | `/api/api-keys` | Create API key |
| DELETE | `/api/api-keys/{id}` | Delete API key |

---

# Developer Documentation

## Project Structure

```
zetwav2/
├── zetwa-be/                 # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Request handlers
│   │   ├── lib/              # Database, Redis clients
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── socket/           # Socket.IO handlers
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── index.ts          # Entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── wa-sessions/          # WhatsApp session data
│
├── zetwa-fe/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── layouts/          # Page layouts
│   │   ├── lib/              # Utilities
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   └── App.tsx           # Main app component
│   └── index.html
│
└── documentation.md          # This file
```

## Backend Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

```bash
cd zetwa-be

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

### Key Libraries
- **Express** - Web framework
- **Prisma** - ORM for PostgreSQL
- **whatsapp-web.js** - WhatsApp Web client
- **Socket.IO** - Real-time communication
- **ioredis** - Redis client (optional)
- **Zod** - Schema validation
- **Pino** - Logging

## Frontend Setup

### Prerequisites
- Node.js 18+

### Installation

```bash
cd zetwa-fe

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Key Libraries
- **React 18** - UI framework
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Socket.IO Client** - Real-time updates

## Database Schema

### Users
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String
  name         String?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]
  apiKeys      ApiKey[]
}
```

### Sessions
```prisma
model Session {
  id          String    @id @default(cuid())
  name        String
  description String?
  status      SessionStatus @default(INITIALIZING)
  phone       String?
  isOnline    Boolean   @default(false)
  lastSeen    DateTime?
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  messages    Message[]
  webhooks    Webhook[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum SessionStatus {
  INITIALIZING
  QR_READY
  AUTHENTICATING
  CONNECTED
  DISCONNECTED
  FAILED
  LOGGED_OUT
}
```

### Messages
```prisma
model Message {
  id         String   @id @default(cuid())
  messageId  String
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id])
  from       String
  to         String
  body       String?
  type       MessageType
  mediaUrl   String?
  status     MessageStatus @default(PENDING)
  fromMe     Boolean  @default(false)
  timestamp  DateTime
  createdAt  DateTime @default(now())
}
```

### Webhooks
```prisma
model Webhook {
  id        String   @id @default(cuid())
  name      String
  url       String
  events    String[] 
  secret    String?
  isActive  Boolean  @default(true)
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Keys
```prisma
model ApiKey {
  id        String   @id @default(cuid())
  name      String
  keyHash   String
  keyPreview String
  scopes    String[]
  isActive  Boolean  @default(true)
  lastUsed  DateTime?
  expiresAt DateTime?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3222
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3223

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zetwa

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_KEY_PREFIX=zetwa_

# WhatsApp
WA_SESSION_PATH=./wa-sessions
PUPPETEER_EXECUTABLE_PATH=
WA_HEADLESS=true

# Webhook
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3222
VITE_WS_URL=ws://localhost:3222
```

## Deployment

### Using Docker

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3222
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: zetwa
      POSTGRES_PASSWORD: zetwa123
      POSTGRES_DB: zetwa
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: ./zetwa-be
    environment:
      DATABASE_URL: postgresql://zetwa:zetwa123@postgres:5432/zetwa
      REDIS_URL: redis://redis:6379
    ports:
      - "3222:3222"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./zetwa-fe
    ports:
      - "3223:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring (PM2, Docker health checks)
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Use Redis for session caching
- [ ] Configure CORS properly

---

## Troubleshooting

### Common Issues

**QR Code not appearing**
- Pastikan session dalam status `QR_READY`
- Refresh halaman atau restart session

**Message not sending**
- Pastikan session status `CONNECTED`
- Periksa format nomor telepon
- Periksa API key scope `messages:send`

**Webhook not receiving events**
- Pastikan URL webhook dapat diakses dari server
- Test webhook dengan endpoint `/test`
- Periksa logs untuk error delivery

**Redis connection failed**
- Redis adalah optional, aplikasi berjalan tanpa Redis
- Jika ingin menggunakan Redis, pastikan Redis server berjalan

---

## Support

- GitHub Issues: [Report bugs](https://github.com/your-repo/issues)
- Documentation: This file
- API Status: Check `/api/health` endpoint
