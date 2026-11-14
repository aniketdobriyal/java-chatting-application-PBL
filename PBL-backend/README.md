# Modern Chat Application Backend (Java + Spring Boot 3.x)

Production-ready REST API & Real-Time STOMP WebSocket backend built for the Modern Chatting Application.

## Technology Stack

- **Framework**: Spring Boot 3.2.4
- **Language**: Java 17 / 21
- **Security**: Spring Security 6, JJWT (v0.11.5), BCrypt Password Encoder
- **Persistence**: Spring Data JPA, Hibernate, MySQL 8
- **Real-Time Messaging**: Spring WebSocket, STOMP Broker
- **Validation & Helpers**: Jakarta Validation, Lombok
- **Build Tool**: Apache Maven

---

## Architecture & Package Structure

```text
com.saferoute.chat/
├── ChatApplication.java
├── config/
│   ├── CorsConfig.java           # Cross-Origin resource sharing (http://localhost:5173)
│   └── WebSocketConfig.java      # STOMP /ws endpoint and /topic message broker configuration
├── controller/
│   ├── AuthController.java        # POST /api/auth/register, POST /api/auth/login
│   ├── UserController.java        # GET /api/users, GET /api/users/search?q=
│   ├── ConversationController.java # GET /api/conversations, POST /api/conversations
│   ├── MessageController.java     # GET /api/conversations/{id}/messages, POST ..., PATCH .../read
│   └── WebSocketChatController.java# STOMP @MessageMapping handler
├── dto/
│   ├── auth/ (LoginRequest, RegisterRequest, AuthResponse)
│   ├── user/ (UserResponse)
│   ├── conversation/ (CreateConversationRequest, ConversationResponse)
│   └── message/ (SendMessageRequest, MessageResponse)
├── entity/
│   ├── User.java
│   ├── Conversation.java
│   ├── ConversationParticipant.java
│   └── Message.java
├── exception/
│   ├── GlobalExceptionHandler.java (Structured REST JSON errors)
│   ├── BadRequestException.java
│   ├── ResourceNotFoundException.java
│   └── UnauthorizedException.java
├── repository/
│   ├── UserRepository.java
│   ├── ConversationRepository.java
│   ├── ConversationParticipantRepository.java
│   └── MessageRepository.java
├── security/
│   ├── CustomUserDetailsService.java
│   ├── JwtAuthenticationFilter.java
│   ├── JwtService.java
│   └── SecurityConfig.java       # Stateless SessionCreationPolicy & SecurityFilterChain
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── ConversationService.java
│   └── MessageService.java       # Persists messages & broadcasts STOMP real-time payloads
└── util/
    └── DataInitializer.java     # Seeder populating default accounts (aniket@example.com)
```

---

## Environment Variables

Configured in `src/main/resources/application.yml` / `.env`:

```env
DB_URL=jdbc:mysql://localhost:3306/chat_app?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971
JWT_EXPIRATION=86400000
```

---

## How to Run

### 1. Run Backend
```powershell
cd C:\Users\aniket\Desktop\PBL-backend
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; & "C:\Users\aniket\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
```

### 2. Connect React Frontend
In `C:\Users\aniket\Desktop\PBL\.env`:
```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080/api
```

Default Dev Login:
- **Email**: `aniket@example.com`
- **Password**: `password123`
