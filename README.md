# Zetwa - WhatsApp API Gateway

A production-grade WhatsApp API gateway similar to WAHA, built with whatsapp-web.js. Supports multiple WhatsApp sessions per user, webhooks for n8n integration, and API key authentication.

## Features

- 🔐 **User Authentication** - Register/login with JWT tokens
- 📱 **Multi-Session** - Unlimited WhatsApp sessions per user
- 🔑 **API Keys** - External application authentication with granular permissions
- 🪝 **Webhooks** - Real-time event notifications (n8n compatible)
- 📨 **Messaging** - Send text, images, videos, documents
- 🔄 **Real-time Updates** - Socket.IO for live status updates
- 📊 **Dashboard** - Modern React dashboard for management

## Architecture

```
zetwa-be/          # Backend API (Express + TypeScript)
├── src/
│   ├── config/    # Configuration
│   ├── lib/       # Database & Redis clients
│   ├── middleware/# Auth, validation, rate limiting
│   ├── routes/    # API endpoints
│   ├── schemas/   # Zod validation schemas
│   ├── services/  # Business logic
│   ├── socket/    # Socket.IO handlers
│   └── utils/     # Helpers & errors
├── prisma/        # Database schema & migrations
└── package.json

zetwa-fe/          # Frontend Dashboard (React + Vite)
├── src/
│   ├── api/       # API client functions
│   ├── components/# UI components (shadcn)
│   ├── layouts/   # Page layouts
│   ├── lib/       # Utilities & clients
│   ├── pages/     # Route pages
│   └── stores/    # Zustand stores
└── package.json
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **WhatsApp**: whatsapp-web.js
- **Auth**: JWT (jose) + API Keys (argon2)
- **Real-time**: Socket.IO
- **Validation**: Zod

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL
- Redis
- Chrome/Chromium (for Puppeteer)

### Backend Setup

1. Navigate to backend folder:
```bash
cd zetwa-be
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Generate Prisma client & migrate:
```bash
npm run db:generate
npm run db:migrate
```

5. (Optional) Seed admin user:
```bash
npm run db:seed
```

6. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd zetwa-fe
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. Start development server:
```bash
npm run dev
```

## API Documentation

### Authentication

All API requests require authentication via:

1. **JWT Token** (Dashboard/User requests):
```
Authorization: Bearer <access_token>
```

2. **API Key** (External applications):
```
X-API-Key: zetwa_xxxxxxxxxxxxx
```

### Endpoints

#### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile
- `PATCH /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

#### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/status` - Get status
- `GET /api/sessions/:id/qr` - Get QR code
- `POST /api/sessions/:id/restart` - Restart session
- `POST /api/sessions/:id/logout` - Logout from WhatsApp

#### Messages
- `POST /api/sessions/:id/messages/send` - Send message
- `GET /api/sessions/:id/messages` - Get messages
- `GET /api/sessions/:id/check-number/:phone` - Check if registered

#### Webhooks
- `GET /api/sessions/:id/webhooks` - List webhooks
- `POST /api/sessions/:id/webhooks` - Create webhook
- `PATCH /api/sessions/:id/webhooks/:webhookId` - Update webhook
- `DELETE /api/sessions/:id/webhooks/:webhookId` - Delete webhook
- `POST /api/sessions/:id/webhooks/:webhookId/test` - Test webhook

#### API Keys
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create API key
- `DELETE /api/api-keys/:id` - Delete API key

### Send Message Example

```bash
curl -X POST https://api.example.com/api/sessions/my-session/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zetwa_xxxxxxxxxxxxx" \
  -d '{
    "to": "628123456789",
    "message": "Hello from Zetwa!"
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

## Deployment

### Backend (VPS)

1. Build:
```bash
npm run build
```

2. Run with PM2:
```bash
pm2 start dist/index.js --name zetwa-api
```

### Frontend (Netlify)

1. Build command:
```bash
npm run build
```

2. Publish directory: `dist`

3. Set environment variable:
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zetwa

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend URL (CORS)
FRONTEND_URL=https://app.yourdomain.com

# Session Storage
SESSION_DATA_PATH=./sessions
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

## License

MIT
