# Chaty Backend (BE)

Backend API for the **Chaty** real-time chat application.
This project provides authentication, user profile management, private conversations, message delivery (text/audio/file), push notifications (FCM), and private call signaling via WebSocket + WebRTC.

## Key Features

- Authentication: login, refresh token, logout.
- User profile management (`/me`), including avatar upload.
- User listing with search + cursor-based pagination.
- Private conversations (create, list, detail, messages).
- Private messages with audio and file attachments.
- Mark message/conversation as read.
- Real-time presence (online/offline + last seen).
- Private call signaling (`start`, `answer`, `end`) + WebRTC events (`offer`, `answer`, `ice-candidate`).
- Supabase Storage integration for media files.
- Redis integration for cache/TTL.
- Firebase Cloud Messaging (FCM) integration for push notifications.

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- HTTP: Express 5
- Realtime: Socket.IO
- Database ORM: Prisma + `@prisma/adapter-pg`
- Database: PostgreSQL (Supabase)
- Cache: Redis
- Validation: Zod
- Auth: JWT (`jsonwebtoken`) + `bcryptjs`
- File upload: Multer
- Storage: Supabase Storage
- Notification: Firebase Cloud Messaging (HTTP v1)
- Tooling: ESLint, Prettier, Nodemon, TSX

## Project Structure (Brief)

```txt
src/
  config/               # app, db, redis, jwt, env config
  lib/                  # helpers (socket, response, prisma, upload, errors, etc.)
  modules/
    auth/
    me/
    user/
    private-conversation/
    private-message/
    ...
prisma/
  schema.prisma
supabase/
  migrations/           # Supabase SQL migrations
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Redis server
- Supabase project (PostgreSQL + Storage buckets)

## Installation

```bash
pnpm install
pnpm prisma generate
```

## Environment Configuration

Create a `.env` file in the project root.

### Environment Variables Used by the App

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | Server port (default `3000`) | `3000` |
| `APP_ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `SUPABASE_DATABASE_URL` | Yes | Supabase PostgreSQL connection string | `postgresql://...` |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Key for backend Supabase Storage access | `eyJ...` |
| `SUPABASE_ANON_KEY` | Alternative | Used if `SUPABASE_SERVICE_ROLE_KEY` is not set | `eyJ...` |
| `SUPABASE_STORAGE_AVATAR_BUCKET` | Yes | Avatar bucket name | `avatars` |
| `SUPABASE_STORAGE_AUDIO_BUCKET` | Yes | Audio bucket name | `audios` |
| `SUPABASE_STORAGE_FILES_BUCKET` | Yes | Attachment file bucket name | `files` |
| `SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN` | Yes | Signed URL duration (seconds) | `3600` |
| `REDIS_URL` | Yes | Redis URL | `redis://127.0.0.1:6379` |
| `REDIS_DEFAULT_TTL_SECONDS` | No | Default cache TTL (seconds), fallback `3600` | `3600` |
| `REDIS_NAMESPACE` | No | Cache namespace prefix | `dev-chaty` |
| `JWT_ACCESS_TOKEN_SECRET` | Yes | JWT access token secret | `very-secret-string` |
| `JWT_REFRESH_TOKEN_SECRET` | Yes | JWT refresh token secret | `very-secret-string` |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Yes | Access token expiration | `60m` |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh token expiration | `1d` |
| `FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL` | Yes (for FCM) | Service account email | `firebase-adminsdk-...` |
| `FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` | Yes (for FCM) | Service account private key (escaped `\n`) | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_PROJECT_ID` | Yes (for FCM) | Firebase project ID | `chaty-xxxx` |

`*` At least one of `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` must be available.

## Running the App

Development:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
pnpm start
```

Lint and format:

```bash
pnpm lint
pnpm format
```

## API Base URL

- Base path: `/api/v1`
- Basic health check: `GET /api/v1/`

## Endpoint Summary

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/push-token`
- `GET /api/v1/me`
- `PATCH /api/v1/me`
- `GET /api/v1/users`
- `GET /api/v1/private-conversations`
- `GET /api/v1/private-conversations/:id`
- `GET /api/v1/private-conversations/:id/messages`
- `POST /api/v1/private-conversations`
- `POST /api/v1/private-conversations/:id/read`
- `POST /api/v1/private-messages`

## Socket.IO

Client must send `handshake.auth.userId` on connection.

Main events:

- Presence/room:
  - `private-conversation:join`
  - `private-conversation:leave`
  - `private-conversation:presence`
- Private call:
  - `private-call:start`
  - `private-call:incoming`
  - `private-call:answer`
  - `private-call:ongoing`
  - `private-call:end`
  - `private-call:ended`
- WebRTC signaling:
  - `private-call:webrtc-offer`
  - `private-call:webrtc-answer`
  - `private-call:webrtc-ice-candidate`

## Response Format

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

## Important Notes

- `.env` is already ignored by Git (`.gitignore`).
- Do not commit real credentials (Supabase keys, JWT secrets, Firebase private key).
- If credentials were exposed, rotate them immediately in each provider.
- A proper `test` script is not implemented yet.
