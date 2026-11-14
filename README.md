# SafeRoute Chat — End-to-End Encrypted Messaging App

A full-stack real-time chat application with **genuine client-side End-to-End Encryption (E2EE)**, built with React + Vite (frontend) and Spring Boot 3 + MongoDB Atlas (backend).

> **What "genuine E2EE" means here:** Messages are encrypted inside the sender's browser before leaving the device. The Spring Boot server and MongoDB Atlas database only ever see ciphertext, nonces, and metadata. No server-side decryption key exists.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [E2EE Architecture](#e2ee-architecture)
4. [Key Management Design](#key-management-design)
5. [Security Properties & Limitations](#security-properties--limitations)
6. [Setup — Prerequisites](#setup--prerequisites)
7. [Setup — MongoDB Atlas](#setup--mongodb-atlas)
8. [Setup — Backend](#setup--backend)
9. [Setup — Frontend](#setup--frontend)
10. [Environment Variables Reference](#environment-variables-reference)
11. [Running the Application](#running-the-application)
12. [Running Tests](#running-tests)
13. [API Reference](#api-reference)
14. [MongoDB Document Schemas](#mongodb-document-schemas)
15. [WebSocket / STOMP Events](#websocket--stomp-events)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 8, Tailwind CSS, React Router, Context API, Axios |
| **Encryption** | Web Crypto API (ECDH P-256, AES-256-GCM), IndexedDB |
| **Real-time** | STOMP over WebSocket (`@stomp/stompjs`) |
| **Backend** | Java 17+, Spring Boot 3.2, Spring Security, Spring WebSocket |
| **Auth** | JWT (HS256), BCrypt password hashing, in-memory rate limiter |
| **Database** | MongoDB Atlas (Spring Data MongoDB) |

---

## Project Structure

```
PBL/
├── src/                          # React frontend
│   ├── components/
│   │   └── chat/
│   │       ├── ChatHeader.jsx    # E2EE badge (shown only when active)
│   │       ├── ConversationItem.jsx  # "🔐 Encrypted message" preview
│   │       ├── MessageBubble.jsx # 🔒 lock icon on decrypted messages
│   │       └── MessageInput.jsx  # Blocks send if recipient has no public key
│   ├── context/
│   │   └── ChatContext.jsx       # Encrypt-before-send, decrypt-on-receive
│   ├── services/
│   │   ├── authService.js        # Generates ECDH keypair on login/register
│   │   └── chatService.js        # Sends encrypted payload, paginates history
│   └── utils/
│       ├── crypto.js             # Core E2EE module (Web Crypto API)
│       └── crypto.test.js        # Vitest unit tests (10/10 passing)
├── .env                          # Frontend env (VITE_API_BASE_URL only — no secrets)
├── .env.example                  # Frontend env template
├── vite.config.js
├── package.json
│
└── PBL-backend/                  # Spring Boot backend
    ├── src/main/java/com/saferoute/chat/
    │   ├── config/
    │   │   ├── SecurityConfig.java
    │   │   └── WebSocketConfig.java   # STOMP JWT auth + membership check
    │   ├── controller/
    │   │   ├── AuthController.java
    │   │   ├── ConversationController.java
    │   │   ├── MessageController.java
    │   │   ├── UserController.java
    │   │   └── WebSocketChatController.java
    │   ├── dto/
    │   │   ├── auth/              # AuthResponse, LoginRequest, RegisterRequest
    │   │   ├── conversation/      # ConversationResponse, CreateConversationRequest
    │   │   ├── message/           # MessageResponse, SendMessageRequest
    │   │   └── user/              # UserResponse, UpdatePublicKeyRequest
    │   ├── entity/
    │   │   ├── User.java          # publicKey field for ECDH SPKI
    │   │   ├── Conversation.java  # participantIds: List<String>
    │   │   ├── ConversationParticipant.java
    │   │   └── Message.java       # ciphertext, nonce, algorithm — NO plaintext
    │   ├── repository/            # MongoRepository interfaces
    │   ├── security/
    │   │   ├── JwtAuthenticationFilter.java
    │   │   ├── JwtService.java
    │   │   ├── CustomUserDetailsService.java
    │   │   └── LoginRateLimiter.java   # 5 attempts / 60-second window
    │   └── service/               # AuthService, UserService, MessageService, ...
    ├── src/test/java/com/saferoute/chat/
    │   └── SecurityTests.java     # 15 security-focused integration tests
    ├── .env.example               # Backend env template (no real secrets)
    ├── pom.xml
    └── src/main/resources/
        └── application.yml        # Reads from env vars — no hardcoded credentials
```

---

## E2EE Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SENDER'S BROWSER                                │
│                                                                         │
│  1. User types plaintext message                                        │
│  2. crypto.js: getConversationKey()                                     │
│     ├── Load sender's ECDH private key  ◄── IndexedDB only             │
│     ├── Load recipient's ECDH public key ◄── from /api/users/{id}      │
│     └── ECDH deriveKey → AES-256-GCM key (cached in memory Map)        │
│  3. crypto.js: encryptMessage(plaintext, aesKey)                        │
│     ├── Generate random 12-byte nonce (window.crypto.getRandomValues)   │
│     └── AES-256-GCM encrypt → { ciphertext, nonce, algorithm, version } │
│  4. Axios POST /api/messages  ──────────────────────────────────────►  │
│     Body: { ciphertext, nonce, algorithm, encryptionVersion,            │
│             conversationId, receiverId }         (NO plaintext)          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SPRING BOOT BACKEND (relay only)                    │
│                                                                         │
│  5. JwtAuthenticationFilter validates Bearer token                      │
│  6. MessageController checks conversation membership                    │
│  7. MessageService.saveMessage() persists ciphertext to MongoDB         │
│  8. WebSocketChatController broadcasts encrypted payload to subscribers │
│                                                                         │
│  ⚠  The server NEVER decrypts. It has no AES key. It sees only:        │
│     conversationId, senderId, ciphertext, nonce, algorithm, timestamp   │
└─────────────────────────────────────────────────────────────────────────┘
                    │                         │
            MongoDB Atlas                  STOMP
          (stores ciphertext)           (relays ciphertext)
                    │                         │
                    └──────────┬──────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       RECIPIENT'S BROWSER                               │
│                                                                         │
│  9.  Receives encrypted payload via STOMP subscription                  │
│  10. crypto.js: getConversationKey()                                    │
│      ├── Load recipient's ECDH private key  ◄── IndexedDB only         │
│      └── ECDH deriveKey → same AES-256-GCM key (ECDH property)         │
│  11. crypto.js: decryptMessage(ciphertext, nonce, aesKey)               │
│      ├── AES-256-GCM decrypt + authenticate GCM tag                    │
│      └── Throws error on tag mismatch (tamper detection)               │
│  12. Plaintext rendered in MessageBubble with 🔒 icon                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cryptographic Primitives

| Operation | Algorithm | Standard |
|---|---|---|
| Key exchange | ECDH on NIST P-256 | RFC 6090 |
| Symmetric encryption | AES-256-GCM | NIST SP 800-38D |
| Nonce generation | `crypto.getRandomValues`, 12 bytes / 96 bits | NIST recommended |
| Password hashing | BCrypt (Spring Security) | |
| JWT signing | HMAC-SHA256 (HS256) | RFC 7519 |

---

## Key Management Design

### Key Generation
On first login or registration, the frontend calls `getOrGenerateUserKeypair(userId)`:
1. Checks IndexedDB for an existing ECDH P-256 keypair for this user.
2. If none exists, generates a new keypair: `crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'])`.
3. Exports the keypair as JWK and persists it in **IndexedDB** under key `key_{userId}`.
4. Exports the **public key only** as SPKI (Base64) and POSTs it to `PUT /api/users/me/public-key`.

### Key Exchange
When Alice sends a message to Bob:
- Alice's browser fetches Bob's SPKI public key from `GET /api/users/{bobId}`.
- Alice derives a shared AES-256-GCM key: `ECDH(Alice_private, Bob_public)`.
- Bob, when receiving, derives the same key: `ECDH(Bob_private, Alice_public)`.
- Both keys are **identical** (ECDH property) — no key ever leaves either browser.

### Key Caching
Derived AES conversation keys are cached in a JavaScript `Map` in memory (keyed by `conversationId`). The cache is cleared on logout via `clearKeyCache()`.

### Key Persistence Storage: IndexedDB
- Private keys are stored **only in IndexedDB**, never in `localStorage`, never on the server.
- IndexedDB is isolated per origin and is not directly accessible to server-side code.

### ⚠ Key Recovery Limitation
This is a **prototype-grade key management design**. If a user clears browser storage:
- Their private key is **permanently lost**.
- Old messages encrypted with the old key pair **cannot be decrypted**.
- The app will generate a new keypair on next login, but old messages will show a decryption error.
- **The server cannot help** — it never had a copy of the private key.

For a production system, consider a **vetted protocol** such as Signal Protocol (Double Ratchet + X3DH) which provides forward secrecy, break-in recovery, and multi-device support. This implementation does **not** provide forward secrecy.

---

## Security Properties & Limitations

### ✅ What this implementation provides
- **Confidentiality from server:** The backend and MongoDB see only ciphertext. A database breach exposes no plaintext messages.
- **Authenticated encryption:** AES-GCM's authentication tag detects ciphertext tampering. `decryptMessage()` throws on any modification.
- **Unique nonces:** Each message uses a fresh 12-byte nonce from `crypto.getRandomValues`, eliminating nonce reuse within a key.
- **Password security:** Passwords are BCrypt-hashed server-side and never returned in API responses or written to logs.
- **Rate limiting:** Failed logins are throttled (5 attempts / 60 seconds) to prevent brute-force.
- **Authorization:** Every API endpoint and WebSocket subscription validates JWT and conversation membership.

### ⚠ Known Limitations (prototype trade-offs)
| Limitation | Explanation |
|---|---|
| **No forward secrecy** | A single static ECDH key pair per user. Compromise of the private key decrypts all past messages for that conversation. |
| **No multi-device support** | Private keys in IndexedDB are device-specific. |
| **Metadata visibility** | The server can see: sender ID, recipient ID, conversation ID, message timestamps, and approximate message sizes. |
| **Key storage risk (XSS)** | If the app is compromised by XSS, IndexedDB keys may be accessible to injected scripts. A CSP header mitigates this. |
| **No key verification** | There is no out-of-band fingerprint verification, so a compromised server could substitute a different public key (MITM). |
| **No key rotation** | Keys are not rotated; re-establishing security after key compromise requires clearing storage and losing old messages. |

---

## Setup — Prerequisites

- **Node.js** v18+ (v22 recommended)
- **Java** 17+ (tested on Java 17 and Java 25)
- **Apache Maven** 3.8+ (project uses `C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd`)
- **MongoDB Atlas** account (free tier works) — or a local `mongod` instance for development
- **Git**

---

## Setup — MongoDB Atlas

1. **Create a free cluster** at [https://cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access:** Create a database user with `readWrite` on your database (e.g., `chat_app`). Copy the username and password.
3. **Network Access:** Add your current IP (or `0.0.0.0/0` for development only — never in production).
4. **Get connection string:** Click **Connect → Drivers**, select Java, and copy the URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chat_app?retryWrites=true&w=majority
   ```
5. Paste this into `PBL-backend/.env` as shown in the next section.

---

## Setup — Backend

### 1. Create the environment file

Copy the example and fill in real values — **never commit `.env`**:

```powershell
Copy-Item PBL-backend\.env.example PBL-backend\.env
```

Edit `PBL-backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chat_app?retryWrites=true&w=majority
MONGODB_DATABASE=chat_app

# Generate a 256-bit hex secret: openssl rand -hex 32
JWT_SECRET=your_256_bit_hex_secret_here
JWT_EXPIRATION=86400000
```

### 2. Build and run

```powershell
cd PBL-backend

# Compile only
& "C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd" clean compile

# Run tests (15 security tests)
& "C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd" test

# Start the server (reads .env automatically via application.yml)
& "C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
```

The backend starts on **http://localhost:8080**.

> **Note on Lombok + Java 25:** Lombok annotation processing (TypeTag::UNKNOWN) is broken on Java 25. All entity and DTO classes in this project use **plain Java** (manual getters/setters/builders). Do not add `@Data`, `@Builder`, or `@RequiredArgsConstructor` to any class.

---

## Setup — Frontend

### 1. Check the env file

`PBL/.env` should already contain (no secrets here):

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

### 2. Install dependencies and run

```powershell
cd PBL       # project root (where package.json is)
npm install
npm run dev  # development server on http://localhost:5173
```

---

## Environment Variables Reference

### Backend (`PBL-backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | Full MongoDB Atlas (or local) connection URI |
| `MONGODB_DATABASE` | ❌ | Database name (default: `chat_app`) |
| `JWT_SECRET` | ✅ | HS256 signing key — 256-bit hex string |
| `JWT_EXPIRATION` | ❌ | Token TTL in milliseconds (default: 86400000 = 24h) |

### Frontend (`PBL/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Base URL of the Spring Boot API |
| `VITE_USE_MOCK` | ❌ | `true` to use mock data (default: `false`) |

> ⚠ **Never put MongoDB URIs, JWT secrets, or encryption keys in frontend `.env` files.** Vite bundles all `VITE_*` variables into the client-side JavaScript bundle, making them publicly visible.

---

## Running the Application

1. Start MongoDB Atlas (or local `mongod`).
2. Start the backend:
   ```powershell
   cd PBL-backend
   & "C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
   ```
3. Start the frontend:
   ```powershell
   cd PBL
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173).
5. Register two accounts in separate browser tabs (or profiles).
6. Start a conversation — the **🔒 E2EE** badge in the chat header confirms encryption is active.

---

## Running Tests

### Frontend (Vitest — crypto unit tests)

```powershell
cd PBL
npm test          # run once
npm run test:watch  # watch mode
```

**Expected output: 10/10 passing**

Tests cover:
- ECDH keypair generation and public key export
- Symmetric key derivation from ECDH
- `encryptMessage` produces non-empty ciphertext with unique nonces
- `decryptMessage` recovers original plaintext
- Nonce uniqueness across multiple encryptions
- Tampered ciphertext causes authenticated decryption failure
- Empty string encryption/decryption round-trip
- Unicode (emoji) round-trip
- Key cache `clearKeyCache()` behavior

### Backend (JUnit — security integration tests)

```powershell
cd PBL-backend
& "C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd" test
```

**Expected output: 15/15 passing** (`SecurityTests.java`)

Tests cover:
1. Passwords are BCrypt-hashed (never stored as plaintext)
2. Correct passwords verify against BCrypt hash
3. Wrong passwords are rejected
4. Email addresses are normalized (trimmed, lowercased)
5. Duplicate email registration is rejected
6. Generic error messages (no account enumeration)
7. Rate limiter blocks after 5 failed attempts
8. Rate limiter allows login after window resets
9. Rate limiter resets on successful login
10. `Message` entity has no `content`/`plaintext` field
11. `Message` entity has `ciphertext`, `nonce`, `algorithm`, `encryptionVersion` fields
12. Nonce values must be distinct across messages (enforced by test)
13. `MessageResponse` DTO does not expose plaintext
14. `UserResponse` DTO does not expose `passwordHash`
15. `RegisterRequest` includes `publicKey` field

---

## API Reference

All protected endpoints require: `Authorization: Bearer <jwt_token>`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register new user. Body: `{username, email, password, publicKey}` |
| `POST` | `/api/auth/login` | None | Login. Body: `{email, password}`. Returns JWT. |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✅ | Get current user profile (includes `publicKey`) |
| `GET` | `/api/users/search?q={query}` | ✅ | Search users by name/email |
| `GET` | `/api/users/{id}` | ✅ | Get user by ID (includes `publicKey` for encryption) |
| `PUT` | `/api/users/me/public-key` | ✅ | Upload ECDH public key (SPKI Base64) |

### Conversations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/conversations` | ✅ | List all conversations for current user |
| `POST` | `/api/conversations` | ✅ | Create or retrieve direct conversation. Body: `{participantId}` |
| `GET` | `/api/conversations/{id}` | ✅ | Get conversation details |

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/{conversationId}?page=0&size=20` | ✅ | Get paginated message history (ciphertext only) |
| `POST` | `/api/messages` | ✅ | Send encrypted message |

**Send Message Body:**
```json
{
  "conversationId": "conv_id",
  "receiverId": "user_id",
  "ciphertext": "BASE64_CIPHERTEXT",
  "nonce": "BASE64_NONCE",
  "algorithm": "AES-256-GCM",
  "encryptionVersion": 1
}
```

---

## MongoDB Document Schemas

### `users`
```json
{
  "_id": "ObjectId",
  "username": "alice",
  "email": "alice@example.com",
  "passwordHash": "$2a$10$...",
  "publicKey": "BASE64_SPKI_ECDH_PUBLIC_KEY",
  "createdAt": "2024-01-01T00:00:00Z"
}
```
> `passwordHash` is never returned by any API endpoint. `publicKey` is the ECDH SPKI public key only — the private key never leaves the browser.

### `messages`
```json
{
  "_id": "ObjectId",
  "conversationId": "conv_id",
  "senderId": "user_id",
  "receiverId": "user_id",
  "ciphertext": "BASE64_CIPHERTEXT",
  "nonce": "BASE64_12_BYTE_NONCE",
  "algorithm": "AES-256-GCM",
  "encryptionVersion": 1,
  "timestamp": "2024-01-01T00:00:00Z",
  "read": false
}
```
> No `content`, `body`, `text`, or plaintext field exists in this schema.

### `conversations`
```json
{
  "_id": "ObjectId",
  "participantIds": ["userId1", "userId2"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## WebSocket / STOMP Events

**Connection endpoint:** `ws://localhost:8080/ws`

**Authentication:** Pass the JWT as a STOMP connect header:
```javascript
client.connectHeaders = { Authorization: `Bearer ${token}` };
```

| Direction | Destination | Description |
|---|---|---|
| Subscribe | `/user/queue/messages` | Receive encrypted messages for current user |
| Subscribe | `/topic/conversation/{id}` | Receive messages for a conversation (membership verified server-side) |
| Send | `/app/chat.send` | Send encrypted message payload |

**Message payload (ciphertext only — never plaintext):**
```json
{
  "conversationId": "conv_id",
  "senderId": "user_id",
  "ciphertext": "BASE64_CIPHERTEXT",
  "nonce": "BASE64_NONCE",
  "algorithm": "AES-256-GCM",
  "encryptionVersion": 1,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Security Checklist

- [x] Passwords BCrypt-hashed, never stored or logged as plaintext
- [x] Messages AES-256-GCM encrypted client-side before transmission
- [x] Backend stores and relays only ciphertext — no plaintext messages
- [x] MongoDB documents contain no plaintext message field
- [x] ECDH private keys stored only in browser IndexedDB, never transmitted
- [x] Unique random nonce per message
- [x] GCM authentication tag detects tampered ciphertext
- [x] JWT-authenticated REST endpoints and WebSocket connections
- [x] Conversation membership enforced on every message API call and STOMP subscription
- [x] Login rate limiting (5 attempts / 60s window)
- [x] Generic auth error messages (no account enumeration)
- [x] No credentials in source code or frontend `.env`
- [x] `.env` files in `.gitignore`
- [x] No password hashes or decryption keys in API responses
- [ ] Content Security Policy header (recommended for production)
- [ ] HTTPS / TLS in production (required — do not deploy over HTTP)
- [ ] Key fingerprint verification (Signal Safety Numbers equivalent)
- [ ] Forward secrecy (Signal Protocol / Double Ratchet for production)
