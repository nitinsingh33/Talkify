# Talkify — MERN Real-Time Chat Application

<div align="center ">

![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248.svg?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-%23000000.svg?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React%2019-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/Node.js-%23339933.svg?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-%23000000.svg?style=flat&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-%2306B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)
![Amazon S3](https://img.shields.io/badge/Amazon%20S3-FF9900?style=flat&logo=amazons3&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)

A full-stack, production-grade real-time chat application built with the MERN stack and Socket.IO. Features include one-on-one messaging, a personalised AI chatbot powered by Google Gemini, image sharing via AWS S3, email verification, email notifications, and a fully responsive dark/light UI built with React 19, TypeScript, Tailwind CSS v4, and shadcn/ui components.

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Data Models](#data-models)
- [REST API Reference](#rest-api-reference)
- [Socket.IO Events](#socketio-events)
- [Environment Variables](#environment-variables)
- [Error Tracking](#error-tracking)
- [Getting Started](#getting-started)
  - [Docker (recommended)](#docker-recommended)
  - [Manual (local development)](#manual-local-development)
- [Scripts](#scripts)
- [Security Design](#security-design)
- [Production Readiness](#production-readiness)
- [Background Jobs](#background-jobs)
- [License](#license)

---

## ✨ Latest Updates

- **Group chats** — create groups, add/remove members, promote/demote admins, group info panel
- **Automated tests + CI** — Jest/Supertest on the backend (39 tests), Vitest/RTL on the frontend (9 tests), both run in GitHub Actions on every push/PR
- **Input validation + error tracking** — Zod validates every route's input; Sentry is wired in on both sides (opt-in via `SENTRY_DSN`/`VITE_SENTRY_DSN`)
- **Backend hardening** — `helmet` security headers, request rate limiting, a centralized error handler + `/health` endpoint, fail-fast environment validation, graceful shutdown on `SIGTERM`/`SIGINT`, structured `pino` logging replacing scattered `console.*` calls
- **Email verification is now optional** — new users get full access immediately; a dismissible banner nudges them to verify later instead of a hard redirect gate

---

## Features

### Authentication & Email Verification
- **Register / Login** with email and password (bcrypt hashed, JWT issued with 7-day expiry) — registration never sends an email, so it works immediately with any unique address
- **OTP Login** — request a one-time password sent via Resend (falls back to Nodemailer / Gmail SMTP); time-limited (5 min), bcrypt-stored
- **Email verification (optional)** — users can verify their email with a 6-digit OTP from a dismissible banner; verification is a nudge, not a gate — the dashboard is fully usable either way
- **Persistent sessions** — JWT stored in `localStorage`; `auth-token` header used on every API call
- **Account deletion** — soft-anonymises the account (clears name, email, bio, credentials) while preserving conversation history for other participants

### Profile Management
- Update name, about text, and profile picture
- Change password (old password verification required)
- Profile pictures uploaded directly from the browser to AWS S3 via pre-signed POST URLs (max 5 MB, images only); removal resets to a generated ui-avatars.com URL

### Messaging
- **Real-time one-on-one chat** over Socket.IO
- **Text and image messages** — images uploaded to S3 with optional caption text
- **Reply to message** — `replyTo` reference stored per message; displayed as quoted context in the UI
- **Delete for me** — hard-removes a message from your view only (appended to `hiddenFrom`)
- **Delete for everyone** — soft-delete sets `softDeleted: true`; message shows as *"This message was deleted"* tombstone for all members
- **Bulk hide** — hide multiple selected messages at once for yourself
- **Clear chat** — hide the entire conversation history from your view with a single action
- **Star / unstar messages** — bookmark individual messages; view all starred messages in a dedicated page
- **Seen receipts** — `seenBy` array tracks who read each message and when
- **Unread counts** — per-user counters maintained on the `Conversation` document, reset on room join
- **Latest message preview** — `latestmessage` field keeps the chat list up to date in real time

### AI Chatbot
- Every user gets a **personal AI Chatbot** conversation created automatically at registration
- Powered by **Google Gemini** (via `@google/genai`) with configurable model
- **Streaming responses** — bot replies are streamed chunk-by-chunk over Socket.IO (`bot-chunk`, `bot-done`) so text appears progressively
- **Context-aware** — last 19 text messages sent as chat history on every request, giving the bot memory of the conversation
- **Typing indicator** — bot emits `typing` / `stop-typing` while generating
- **Rollback on error** — if the Gemini stream fails, the user message is deleted and `bot-error` is emitted

### Email Notifications
- When a message is received and the recipient is **completely offline** (no open sockets), a branded HTML email is sent with a message preview and a deep-link back to the conversation
- **Fire-and-forget** — the email is never awaited in the socket path, adding zero latency to message delivery
- Users can **toggle email notifications** on/off from the Settings page (`/user/profile`); preference is persisted to the database

### Real-Time Presence & Notifications
- **Online / Offline status** — `isOnline` flag updated on socket connect/disconnect; broadcast to all conversation partners
- **Last seen** — timestamp recorded on disconnect, served via API
- **Multi-device / multi-tab aware** — `Map<userId, Set<socketId>>` tracks all open sockets; user is only marked offline when their *last* socket closes
- **Stale online cleanup** — background cron job runs every hour to force-offline users whose socket disconnect was missed (e.g. server crash)
- **Typing indicators** — `typing` / `stop-typing` events broadcast to the conversation room *and* to the receiver's personal room if they are online but not viewing that chat
- **In-app push notification** — `new-message-notification` event sent to the receiver's personal room when they are not inside the active conversation

### Conversation Management
- **Start a conversation** — search for any registered user; reuses an existing conversation if one already exists
- **Conversations list** — sorted by `updatedAt` descending; pinned conversations always appear at the top
- **Pin / unpin conversations** — per-user; stored as `pinnedConversations` array on the User document
- **Block / unblock users** — `blockedUsers` array on the User document (1:1 chats only — blocking is not enforced inside groups)
  - Blocked users cannot send messages (checked server-side before every `send-message` socket event)
  - Blocked users see sanitised profile information (generic name, avatar, and offline status)
- **User discovery** — paginated, searchable, and sortable list of users with whom you have no existing conversation

### Group Chats
- **Create a group** — pick 2+ members and a name; the creator becomes the first admin
- **Real-time fan-out** — messages, typing indicators, unread counts, and read receipts ("seen by all members") all generalize from 1:1 chat to N members
- **Group info panel** — view members, rename the group (admin), change the group avatar (admin)
- **Membership management** — add members (admin), remove a member (admin, not the creator), leave the group (anyone); the group auto-promotes a new admin if the last one leaves
- **Admin roles** — promote / demote other members; the creator can't be removed or demoted
- **Live sync** — a `group-updated` socket event refreshes every member's client the moment membership or info changes, including bouncing a removed member out of the conversation view

### UI & UX
- **React 19** with full **TypeScript** type safety
- **Tailwind CSS v4** with **shadcn/ui** component library
- **Dark / Light / System** theme toggle powered by `next-themes`
- Fully **responsive** — optimised for both desktop and mobile
- **React Router v7** nested route layout system (`DashboardLayout` → `ConversationLayout`)
- **Sonner** toast notifications
- **Markdown rendering** in bot messages via `react-markdown` + `remark-gfm`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui, React Router v7 |
| **Backend** | Node.js, Express.js 4 |
| **Database** | MongoDB (Mongoose 8) |
| **Real-time** | Socket.IO 4 (server + client) |
| **Authentication** | JSON Web Tokens (jsonwebtoken), bcryptjs |
| **AI** | Google Gemini via `@google/genai` |
| **File Storage** | AWS S3 (pre-signed POST uploads) |
| **Email** | Resend (primary), Nodemailer/Gmail SMTP (fallback) — OTP login, email verification, message notifications |
| **Hardening** | `helmet`, `express-rate-limit`, centralized error handler, `/health` endpoint, fail-fast env validation, Zod request validation |
| **Logging & errors** | `pino` + `pino-http` for structured logs; `@sentry/node` + `@sentry/react` for error tracking (both optional, DSN-gated) |
| **Testing** | Jest + Supertest + `mongodb-memory-server` (backend), Vitest + React Testing Library (frontend), GitHub Actions CI |
| **Containerisation** | Docker, Docker Compose |

---

## Project Structure

```
Talkify/
├── docker-compose.yml                 # Orchestrates mongo + server + client
├── .env.example                       # Template for all environment variables (repo root)
│
├── server/                            # Express + Socket.IO backend
│   ├── Dockerfile
│   ├── app.js                         # Pure Express app (middleware + routes only, no side
│   │                                  #   effects) — required by both index.js and the tests
│   ├── index.js                       # Bootstraps app.js: env validation, DB connect,
│   │                                  #   Socket.IO init, graceful shutdown, process listen
│   ├── jest.config.js
│   ├── tests/                         # Jest + Supertest, in-memory MongoDB (mongodb-memory-server)
│   │   ├── env.setup.js               # Test env vars, loaded before any app module
│   │   ├── testDb.js                  # connect/disconnect/clearDatabase helpers
│   │   ├── auth.test.js
│   │   ├── conversation.test.js
│   │   ├── message.test.js
│   │   ├── user.test.js
│   │   └── health.test.js
│   ├── db.js                          # MongoDB connection
│   ├── secrets.js                     # Environment variable exports (single source of truth)
│   ├── Controllers/
│   │   ├── auth-controller.js         # register, login, OTP login, authUser,
│   │   │                              #   sendVerificationOtp, verifyEmail
│   │   ├── conversation-controller.js # 1:1: create/list/get/togglePin
│   │   │                              # groups: createGroup, updateGroupInfo, addMembers,
│   │   │                              #   removeMember, leaveGroup, promote/demoteAdmin
│   │   ├── message-controller.js      # allMessage, delete, bulkHide, star, clear,
│   │   │                              #   AI streaming, 1:1 + group send handlers
│   │   └── user-controller.js         # updateProfile, block, S3 presign, user search
│   │                                  #   (non-friends + all-users for group picker),
│   │                                  #   deleteAccount, getBlockStatus
│   ├── Models/
│   │   ├── User.js                    # Full user schema (see Data Models)
│   │   ├── Conversation.js            # members, latestmessage, unreadCounts,
│   │   │                              #   isGroup/groupName/groupPic/groupAdmins/createdBy
│   │   └── Message.js                 # seenBy, hiddenFrom, softDeleted, starredBy, replyTo
│   ├── Routes/
│   │   ├── auth-routes.js
│   │   ├── conversation-routes.js
│   │   ├── message-routes.js
│   │   ├── user-routes.js
│   │   └── health-routes.js           # GET /health — liveness/readiness probe
│   ├── socket/
│   │   ├── index.js                   # Socket.IO setup, JWT auth middleware, userSocketMap,
│   │   │                              #   getIO() so REST controllers can push realtime events
│   │   └── handlers.js                # All socket event handlers (1:1, group, typing,
│   │                                  #   presence) + email notification trigger
│   ├── middleware/
│   │   ├── fetchUser.js               # JWT verification middleware for REST routes
│   │   ├── errorHandler.js            # notFound (404 JSON) + centralized error handler
│   │   ├── rateLimiter.js             # authLimiter (auth routes) + apiLimiter (global)
│   │   └── validate.js                # Zod request validation middleware (body/params/query)
│   ├── validators/                    # Zod schemas, one file per resource
│   │   ├── common.js                  # objectId, email
│   │   ├── auth.schema.js
│   │   ├── conversation.schema.js
│   │   ├── message.schema.js
│   │   └── user.schema.js
│   ├── utils/
│   │   ├── logger.js                  # pino structured logger (pretty in dev, JSON in prod);
│   │   │                              #   forwards every logger.error() to Sentry when enabled
│   │   ├── sentry.js                  # Sentry.init() — no-op unless SENTRY_DSN is set
│   │   ├── sendEmail.js               # Resend client with Nodemailer/Gmail SMTP fallback
│   │   └── sendMessageEmail.js        # Fire-and-forget offline message email helper
│   ├── jobs/
│   │   └── staleOnlineUsers.js        # Hourly cleanup of stale isOnline flags
│   └── scripts/
│       ├── seed-test-users.js         # Creates 20 pre-verified test accounts
│       └── delete-test-users.js
│
└── client/                            # React + TypeScript frontend
    ├── Dockerfile
    ├── nginx.conf                     # SPA fallback + asset caching config
    ├── vitest.config.ts               # Vitest + jsdom + React Testing Library
    └── src/
        ├── App.tsx                    # Route definitions
        ├── MainLayout.tsx             # Root layout (toaster, outlet)
        ├── test/setup.ts              # jest-dom matchers, loaded before every test file
        ├── components/ErrorFallback.tsx  # Shown by the Sentry error boundary in main.tsx
        ├── lib/sentry.ts              # Sentry.init() — no-op unless VITE_SENTRY_DSN is set
        ├── pages/
        │   ├── Home.tsx
        │   ├── Login.tsx              # Password + OTP login tabs
        │   ├── SignUp.tsx
        │   ├── VerifyEmail.tsx        # Optional email verification (skippable)
        │   ├── Conversations.tsx
        │   ├── ConversationDetail.tsx # Chat view — 1:1, group, and streaming bot support
        │   ├── StarredMessages.tsx
        │   ├── User.tsx               # Redirect helper
        │   └── UserProfile.tsx        # Profile, password, appearance, notification settings
        ├── components/
        │   ├── layout/
        │   │   ├── DashboardLayout.tsx  # Auth guard (verification is a banner, not a gate)
        │   │   ├── ConversationLayout.tsx
        │   │   └── DashboardSidebar.tsx
        │   ├── dashboard/              # Chat-specific components
        │   │   ├── ConversationsList.tsx, ConversationDetailHeader.tsx
        │   │   ├── MessageInput.tsx, SingleMessage.tsx
        │   │   ├── NewChatDialog.tsx    # Start a 1:1 chat
        │   │   ├── NewGroupDialog.tsx   # Create a group (multi-select + name)
        │   │   └── GroupInfoDialog.tsx  # Members, admin actions, rename, add/remove, leave
        │   ├── EmailVerifyBanner.tsx    # Dismissible verification nudge
        │   ├── NotificationListener.tsx # In-app toast + sound on new-message-notification
        │   └── ui/                      # shadcn/ui component library
        ├── context/                   # AuthProvider, ChatProvider, ConversationsProvider
        ├── hooks/                     # use-auth, use-chat, use-conversations, use-socket
        └── lib/
            ├── api.ts                 # Centralised HTTP client
            └── socket.ts              # Socket.IO client setup
```

---

## Architecture Overview

```
Browser ──HTTP──▶  Express REST API  ──▶  MongoDB
        ──WS────▶  Socket.IO Server  ──▶  MongoDB
                                     ──▶  Resend / Gmail SMTP (offline email notifications)

Request pipeline (server/index.js)
  env validation (fail fast) ─▶ CORS ─▶ JSON body parsing (2mb limit) ─▶ apiLimiter
    ─▶ routes (authLimiter on /auth) ─▶ 404 handler ─▶ centralized error handler

Socket.IO authentication
  Every socket connection presents a JWT in handshake.auth.token.
  The middleware verifies the token and attaches socket.userId.
  Handlers never trust any client-supplied user ID.

Per-user socket tracking
  userSocketMap: Map<userId, Set<socketId>>
  Tracks all open connections across multiple tabs and devices.
  A user is marked offline only when their last socket disconnects.

Message fan-out (1:1 vs. group)
  1:1 chats have a single receiver — unread count, seenBy, and the
  in-app/email notification target all resolve to that one user.
  Groups fan the same send-message event out to every other member:
  seenBy is populated per member currently in the room, unread counts
  increment for everyone else, and each offline/away member gets their
  own new-message-notification + (if fully offline) notification email.
  REST-triggered group changes (rename, add/remove member, promote admin)
  push a group-updated event to every member via getIO() from the
  socket layer, so open clients refetch without a manual reload.

Email notification pipeline
  send-message event ──▶ receiver(s) with no open sockets?
                      ──▶ emailNotificationsEnabled?
                      ──▶ sendMessageEmail() (fire-and-forget, no await)

AI streaming pipeline
  Browser ──send-message──▶  Server detects isBot member
          ◀──bot-chunk───── streams Gemini chunks via Socket.IO
          ◀──bot-done──────  final saved Message document
```

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `name` | String | 3–50 chars, required |
| `email` | String | unique, lowercase |
| `password` | String | bcrypt hashed |
| `about` | String | bio / status text |
| `profilePic` | String | URL; defaults to ui-avatars.com |
| `isOnline` | Boolean | updated on socket connect / disconnect |
| `lastSeen` | Date | set on disconnect |
| `isEmailVerified` | Boolean | `false` until OTP verification is completed |
| `emailNotificationsEnabled` | Boolean | controls offline email notifications; default `true` |
| `isBot` | Boolean | `true` for AI bot accounts |
| `otp` | String | bcrypt-hashed OTP (shared for login OTP and email verification) |
| `otpExpiry` | Date | OTP expiry timestamp |
| `blockedUsers` | [ObjectId → User] | users this user has blocked |
| `pinnedConversations` | [ObjectId → Conversation] | pinned conversation IDs |
| `isDeleted` | Boolean | soft-delete flag for anonymised accounts |

### Conversation

| Field | Type | Notes |
|---|---|---|
| `members` | [ObjectId → User] | participants — exactly 2 for 1:1 chats, 3+ for groups |
| `latestmessage` | String | preview text for chat list |
| `unreadCounts` | [{userId, count}] | per-member unread counter |
| `isGroup` | Boolean | `false` for 1:1 chats (default) |
| `groupName` | String | group display name (groups only) |
| `groupPic` | String | group avatar URL; defaults to a generated placeholder |
| `groupAdmins` | [ObjectId → User] | members with admin rights (groups only) |
| `createdBy` | ObjectId → User | group creator — can't be removed or demoted (groups only) |
| `timestamps` | auto | `createdAt`, `updatedAt` |

### Message

| Field | Type | Notes |
|---|---|---|
| `conversationId` | ObjectId → Conversation | required |
| `senderId` | ObjectId → User | required |
| `text` | String | required if no `imageUrl` |
| `imageUrl` | String | required if no `text`; S3 URL |
| `seenBy` | [{user, seenAt}] | read receipts |
| `hiddenFrom` | [ObjectId → User] | hard-deleted for these users |
| `softDeleted` | Boolean | `true` = "deleted" tombstone shown to all |
| `starredBy` | [ObjectId → User] | users who starred this message |
| `replyTo` | ObjectId → Message | quoted reply reference |
| `timestamps` | auto | `createdAt`, `updatedAt` |

---

## REST API Reference

All protected routes require the header `auth-token: <JWT>`. Auth routes are rate-limited
(`authLimiter`); every route is additionally covered by a global `apiLimiter`.

### Health — `/health`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | `{ status, uptimeSeconds, timestamp, db }` — 503 if MongoDB isn't connected |

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account + personal bot + initial conversation |
| `POST` | `/auth/login` | — | Login with password or OTP (`{ email, password }` or `{ email, otp }`) |
| `POST` | `/auth/getotp` | — | Send OTP to email for OTP-based login |
| `GET` | `/auth/me` | ✅ | Get authenticated user profile |
| `POST` | `/auth/send-verification-otp` | ✅ | Send a 10-min verification OTP to the logged-in user's email |
| `POST` | `/auth/verify-email` | ✅ | Verify email with OTP; sets `isEmailVerified: true` |

### Conversations — `/conversation`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/conversation` | ✅ | Create or retrieve a 1:1 conversation |
| `GET` | `/conversation` | ✅ | List all conversations (pinned first, then by `updatedAt`) |
| `POST` | `/conversation/group` | ✅ | Create a group (`{ name, members, groupPic? }`) — creator becomes the first admin |
| `GET` | `/conversation/:id` | ✅ | Get a single conversation |
| `POST` | `/conversation/:id/pin` | ✅ | Toggle pin on a conversation |
| `PUT` | `/conversation/:id/group` | ✅ Admin | Rename group / change avatar (`{ name?, groupPic? }`) |
| `POST` | `/conversation/:id/members` | ✅ Admin | Add members (`{ members: string[] }`) |
| `DELETE` | `/conversation/:id/members/:userId` | ✅ Admin | Remove a member (not the creator) |
| `POST` | `/conversation/:id/leave` | ✅ | Leave a group; auto-promotes a new admin if the last one leaves |
| `POST` | `/conversation/:id/admins/:userId` | ✅ Admin | Promote a member to admin |
| `DELETE` | `/conversation/:id/admins/:userId` | ✅ Admin | Demote an admin (not the creator) |

### Messages — `/message`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/message/starred` | ✅ | Get all messages starred by the current user |
| `GET` | `/message/:id` | ✅ | Get all messages in a conversation (marks as seen) |
| `DELETE` | `/message/bulk/hide` | ✅ | Hide multiple messages for self (`body: { messageIds }`) |
| `DELETE` | `/message/:id` | ✅ | Delete a message (`body: { scope: "me" \| "everyone" }`) |
| `POST` | `/message/clear/:conversationId` | ✅ | Clear entire chat history for self |
| `POST` | `/message/:id/star` | ✅ | Toggle star on a message |

### Users — `/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| `PUT` | `/user/update` | ✅ | Update profile (name, about, profilePic, password, emailNotificationsEnabled) |
| `GET` | `/user/online-status/:id` | ✅ | Get online status of a user |
| `GET` | `/user/non-friends` | ✅ | Paginated, searchable, sortable discovery of users you have no conversation with — powers "New chat" |
| `GET` | `/user/all` | ✅ | Paginated, searchable list of every user (including existing contacts) — powers the group-member picker |
| `GET` | `/user/presigned-url` | ✅ | Get S3 pre-signed POST URL for image upload |
| `POST` | `/user/block/:id` | ✅ | Block a user |
| `DELETE` | `/user/block/:id` | ✅ | Unblock a user |
| `GET` | `/user/block-status/:id` | ✅ | Get mutual block status between current user and target |
| `DELETE` | `/user/delete` | ✅ | Soft-delete / anonymise the authenticated user's account |

#### `GET /user/non-friends` and `GET /user/all` Query Parameters

| Param | Default | Options |
|---|---|---|
| `search` | `""` | name or email substring |
| `sort` | `name_asc` | `non-friends` only: `name_asc`, `name_desc`, `last_seen_recent`, `last_seen_oldest` |
| `page` | `1` | integer ≥ 1 |
| `limit` | `20` | 1–50 |

---

## Socket.IO Events

The socket server requires a valid JWT passed in `handshake.auth.token`.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `setup` | — | Join personal room; mark user online; notify friends |
| `join-chat` | `{ roomId }` | Join a conversation room; reset unread count; mark all messages seen |
| `leave-chat` | `roomId` | Leave a conversation room |
| `send-message` | `{ conversationId, text?, imageUrl?, replyTo? }` | Send a message — fans out to every member for groups, or triggers the AI bot response for the personal bot chat |
| `delete-message` | `{ messageId, conversationId, scope }` | Delete a message (`scope: "me" \| "everyone"`) |
| `typing` | `{ conversationId, typer, receiverId? \| memberIds? }` | Broadcast typing indicator — `receiverId` for 1:1, `memberIds` (every other member) for groups |
| `stop-typing` | `{ conversationId, typer, receiverId? \| memberIds? }` | Broadcast stop-typing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `user setup` | `userId` | Confirms setup complete |
| `user-joined-room` | `userId` | Another user entered the conversation room |
| `receive-message` | `Message` | New message delivered to room |
| `new-message-notification` | `{ message, sender, conversation }` | In-app push to receiver's personal room when not in the chat |
| `messages-seen` | `{ conversationId, seenBy, seenAt }` | Notifies sender their messages were read |
| `message-deleted` | `{ messageId, conversationId, softDeleted, latestmessage }` | Tombstone broadcast for scope="everyone"; sidebar preview updated |
| `message-blocked` | `{ conversationId }` | Message rejected due to a block |
| `typing` | `{ conversationId, typer, receiverId? }` | Forwarded typing indicator |
| `stop-typing` | `{ conversationId, typer, receiverId? }` | Forwarded stop-typing indicator |
| `user-online` | `{ userId }` | A contact came online |
| `user-offline` | `{ userId }` | A contact went offline |
| `bot-chunk` | `{ conversationId, tempId, chunk }` | Streamed AI response text chunk |
| `bot-done` | `{ conversationId, tempId, message }` | AI response complete; `message` is the saved document |
| `bot-error` | `{ conversationId, userMessageId? }` | AI response failed; provides rolled-back message ID |
| `group-updated` | `{ conversationId, removed? }` | Group info/membership changed — clients refetch; `removed: true` bounces a removed member out of the conversation view |

---

## Environment Variables

A single `.env` file at the **project root** is used for both Docker Compose and local development. Copy `.env.example` to `.env` and fill in your values.

```env
# ── Database ──────────────────────────────────────────────────────────────────
# Overridden automatically by docker-compose to point at the mongo service.
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=talkify

# ── Runtime ───────────────────────────────────────────────────────────────────
NODE_ENV=development                # "production" hides stack traces + switches logs to plain JSON
PORT=5500
LOG_LEVEL=info                      # optional — trace|debug|info|warn|error|fatal

# ── Auth ──────────────────────────────────────────────────────────────────────
JWT_SECRET=change_me_to_a_long_random_secret   # required — server refuses to start without it

# ── Google Gemini (AI bot) ────────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash

# ── Email ─────────────────────────────────────────────────────────────────────
# Used for: OTP login, email verification, offline message notifications.
# Resend is tried first; Nodemailer/Gmail SMTP is used as a fallback if
# RESEND_API_KEY is not set.
RESEND_API_KEY=your_resend_api_key
EMAIL=your_gmail@gmail.com
PASSWORD=your_gmail_app_password   # use a Gmail App Password, not your account password

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGIN=*                      # restrict to your frontend origin in production

# ── AWS S3 (profile picture uploads) ─────────────────────────────────────────
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET=your_aws_secret_key

# ── App URL (used in email notification deep-links) ───────────────────────────
FRONTEND_URL=http://localhost:5173

# ── Error tracking (optional) ─────────────────────────────────────────────────
# Leave unset to disable — see "Error Tracking" below.
SENTRY_DSN=

# ── Frontend (Vite — baked into the JS bundle at build time) ─────────────────
# Must be the public URL where the backend is reachable FROM THE BROWSER.
VITE_API_URL=http://localhost:5500
VITE_SENTRY_DSN=                    # optional — leave unset to disable
```

---

## Error Tracking

Both apps ship with Sentry wired in (`@sentry/node`, `@sentry/react`), but it's **disabled by
default** — no account, no cost, no data sent anywhere until you opt in.

To enable it:
1. Create a free project at [sentry.io](https://sentry.io) (one for the backend, one for the frontend, or share one — your call).
2. Set `SENTRY_DSN` in the server's `.env` to the backend project's DSN.
3. Set `VITE_SENTRY_DSN` in the client's `.env` to the frontend project's DSN (baked in at build time).

Once set:
- **Backend** — every `logger.error(...)` call (already used consistently across the whole app) is also reported to Sentry, plus Express request-cycle errors via `Sentry.setupExpressErrorHandler`.
- **Frontend** — a `Sentry.ErrorBoundary` wraps the whole app in `main.tsx`; an uncaught render error shows a friendly "Something went wrong" screen (`ErrorFallback.tsx`) instead of a blank page, and reports the error.

Leave either DSN unset and that side's Sentry calls are simply no-ops — nothing breaks, nothing is sent.

---

## Getting Started

### Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin).

```bash
# 1. Clone the repo
git clone https://github.com/your-username/talkify.git
cd talkify

# 2. Create your .env from the template
cp .env.example .env
# Edit .env — set JWT_SECRET, GEMINI_API_KEY, RESEND_API_KEY (or EMAIL/PASSWORD), AWS_*, etc.

# 3. Build and start all three services (mongo + server + client)
docker compose up --build -d

# Frontend  →  http://localhost
# Backend   →  http://localhost:5500
# MongoDB   →  localhost:27019 (mapped away from the default 27017)
```

> **`VITE_API_URL`** must be the URL where the backend is reachable **from the user's browser**.  
> For local Docker this is `http://localhost:5500`. For production, use your public API domain.

### Manual (local development)

Requires Node.js ≥ 20 and a running MongoDB instance.

```bash
# Backend
cd server
cp ../.env.example .env   # or edit server/.env directly
npm install
npm run dev                # nodemon — listens on :5500

# Frontend (separate terminal)
cd client
# create client/.env with:  VITE_API_URL=http://localhost:5500
npm install
npm run dev                # Vite dev server — listens on :5173
```

---

## Scripts

### Backend (`server/`)

| Script | Command | Description |
|---|---|---|
| `start` | `node index.js` | Start production server |
| `dev` | `nodemon index.js` | Start dev server with hot-reload |
| `test` | `jest --runInBand` | Run the backend test suite (spins up an in-memory MongoDB per test file) |
| `seed:users` | `node scripts/seed-test-users.js` | Seed 20 pre-verified test accounts (shared password `Test@1234`, `*@talkify-test.dev`) |
| `delete:users` | `node scripts/delete-test-users.js` | Remove seeded test users |

### Frontend (`client/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server |
| `build` | `tsc -b && vite build` | Type-check + production build |
| `preview` | `vite preview` | Preview the production build locally |
| `test` | `vitest run` | Run the frontend test suite once (CI mode) |
| `test:watch` | `vitest` | Run the frontend test suite in watch mode |
| `lint` | `eslint .` | Run ESLint |
| `format` | `prettier --write` | Format all TS/TSX files |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |

---

## Security Design

- **JWT** — tokens are signed with `JWT_SECRET`, expire after 7 days, and are verified on every protected REST route and every socket connection
- **No trusted client IDs** — `senderId` is always taken from the verified JWT (`socket.userId`), never from the client payload
- **bcrypt** — passwords and OTPs are hashed with bcrypt before storage
- **Rate limiting** — `authLimiter` caps auth endpoints (login, register, OTP request/verify) at 20 requests / 15 min per IP; `apiLimiter` caps the whole API at 500 / 15 min per IP as a baseline abuse guard
- **`helmet`** — sets standard HTTP security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options, etc.) on every response
- **Input validation** — Zod schemas validate every route's body/params/query before the controller runs; invalid Mongo ObjectIds and malformed payloads are rejected with a 400 instead of reaching a database query
- **Block enforcement** — the server checks block status before processing every 1:1 `send-message` event; a blocked sender receives `message-blocked` instead (blocking is not enforced inside groups)
- **Conversation / group membership** — every `join-chat`, `send-message`, and group-management handler verifies the authenticated user is a member (or admin, where required) of the target conversation
- **Email verification is optional** — unverified users get full access; verification is a dismissible nudge, not a gate. Bot accounts are pre-verified at creation
- **S3 pre-signed uploads** — the client never receives AWS credentials; uploads go directly to S3 through a short-lived pre-signed POST URL generated server-side
- **Non-root Docker user** — the backend container runs as an unprivileged `appuser`
- **Account anonymisation** — deleted accounts have credentials wiped and PII replaced with generic values; the document is retained (flagged `isDeleted: true`) to preserve conversation context for other participants

---

## Production Readiness

What's covered, and what's intentionally still open — kept honest so it doesn't drift from reality.

**In place**
- Fail-fast environment validation (`MONGO_URI`, `JWT_SECRET`) — the server refuses to boot rather than fail confusingly later
- Centralized Express error handler + JSON 404 handler (`server/middleware/errorHandler.js`)
- `/health` endpoint reporting DB connection state, for use as a Docker/load-balancer health check
- Rate limiting on auth endpoints and the API as a whole
- `helmet` — standard HTTP security headers (CSP, X-Frame-Options, HSTS, etc.) on every response
- Structured logging via `pino` (`server/utils/logger.js`) — pretty-printed in development, single-line JSON in production, ready for any log aggregator; `pino-http` logs every request/response automatically. All `console.log`/`console.error` calls in the running server were replaced with it (one-off admin scripts in `server/scripts/` intentionally keep `console.log` — they're CLI tools, not server code)
- Graceful shutdown on `SIGTERM`/`SIGINT` (drains in-flight requests before exit) + `uncaughtException`/`unhandledRejection` handlers so the process never dies silently
- Reduced JSON body limit (2mb, down from 50mb — images go through S3, never through JSON bodies)
- **Automated tests + CI** — the Express app was split into `app.js` (pure app, no boot side effects) and `index.js` (bootstrapping), specifically so it can be driven by Supertest without a real DB/socket/port. Backend: Jest + Supertest + an in-memory MongoDB (`mongodb-memory-server`) per test file — 39 tests covering auth, groups, message CRUD (star/delete/clear/bulk-hide), and blocking. Frontend: Vitest + React Testing Library — 9 tests covering `cn()` class merging, `EmailVerifyBanner`, and `ErrorFallback`. `.github/workflows/ci.yml` runs both suites (plus typecheck/lint/build for the client) on every push and PR to `main`; neither suite needs any secrets configured to run
- **Input validation** — every route now validates its body/params/query with a Zod schema (`server/validators/`) before it reaches a controller: malformed emails, invalid Mongo ObjectIds, missing/oversized fields, and bad enum values all get a consistent 400 with a field-level message instead of an inconsistent hand-rolled check (or worse, an uncaught Mongoose `CastError`)
- **Error tracking** — `@sentry/node` and `@sentry/react` are wired in on both sides (see [Error Tracking](#error-tracking)), completely inert until you set `SENTRY_DSN`/`VITE_SENTRY_DSN`

**Still open**
- Test coverage is solid for the REST API but doesn't yet reach Socket.IO events (typing, real-time send/receive/presence) or the frontend's chat pages/hooks
- No dedicated uptime/synthetic monitoring — `/health` exists but nothing external is polling it yet

---

## Background Jobs

### `staleOnlineUsers` (hourly cron)

Runs every hour and sets `isOnline: false` + updates `lastSeen` for any user whose `isOnline` flag is still `true` but has no active sockets in `userSocketMap`. This recovers from crash scenarios where the `disconnect` event was never fired.

---

## Contributing
Contributions are welcome! Please open an issue or submit a pull request with any improvements or bug fixes.

**Steps to contribute:**
1. Fork the repository and create a new branch for your feature or bug fix.
2. Make your changes with clear commit messages.
3. Ensure all tests pass and the application runs correctly.
4. Submit a pull request describing your changes and why they should be merged.

## License

MIT — see the [LICENSE](LICENSE) file for details.

---

## About the Author


- Email: nitinsingh.iitp@gmail.com
- LinkedIn: [Nitin Singh](https://www.linkedin.com/in/nitinsingh33/)
