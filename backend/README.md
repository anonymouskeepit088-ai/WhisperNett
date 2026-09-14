# WhisperNet - Spring Boot Backend

Production-ready Java Spring Boot service providing AES-256-GCM authenticated encryption and Scrypt key derivation for WhisperNet secret sharing.

---

## Features
- **AES-256-GCM Encryption**: 256-bit encryption with 128-bit authentication tag.
- **Scrypt Key Derivation**: $N=16384, r=8, p=1$ matching RFC 7914 and Node.js `crypto.scrypt`.
- **Automatic Expiration Cleanup**: Background `@Scheduled` job continuously prunes expired secrets.
- **Burn-on-Read**: Secrets marked with `burnOnRead` are immediately permanently deleted upon successful decryption.
- **Pause & Resume Controls**: Secret creators can pause/resume/delete using their secret's `adminToken`.
- **H2 & PostgreSQL Ready**: Uses Spring Data JPA. Comes with zero-config in-memory H2, seamlessly switchable to PostgreSQL/MySQL via `application.yml`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/secrets` | Create and encrypt a new secret |
| `GET` | `/api/secrets/{id}` | Check secret existence and expiration |
| `POST` | `/api/secrets/{id}/decrypt` | Decrypt secret with token and optional passphrase |
| `POST` | `/api/secrets/{id}/manage` | Pause, resume, or delete a secret with `adminToken` |

---

## Prerequisites

1. **Java 17 or 21**
   - On Windows, install via winget:
     ```powershell
     winget install Microsoft.OpenJDK.21
     ```
2. **Maven 3.8+** (or use Docker below)

---

## Running Locally

### Option 1: Using Maven
```bash
mvn spring-boot:run
```
The server will start at `http://localhost:8080`.
You can access the H2 database console at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:whispernetdb`, username: `sa`, no password).

### Option 2: Using Docker
If you don't have Java or Maven installed locally:
```bash
docker compose up --build
```

---

## Running Tests

Execute the automated crypto and integration test suite:
```bash
mvn test
```
