# Agent Instructions — Family Hub

## Project Layout

- **Backend:** `src/backend/` — .NET 10 solution (`FamilyHub.slnx`)
  - `src/FamilyHub.Domain` — entities only, no dependencies
  - `src/FamilyHub.Application` — services, contracts, abstractions
  - `src/FamilyHub.Infrastructure` — EF Core (PostgreSQL), JWT, bcrypt
  - `src/FamilyHub.Api` — ASP.NET Core API, Dockerized
  - `src/FamilyHub.AppHost` — Aspire orchestration
  - `tests/FamilyHub.Application.Tests` — unit tests
  - `tests/FamilyHub.Api.Tests` — integration tests
- **Frontend:** `src/frontend/` — Vue 3 + Pinia + Vite 8

## Commands

### Build & Test (Backend)
```bash
cd src/backend
dotnet build FamilyHub.slnx
dotnet test FamilyHub.slnx
```

### Build & Test (Frontend)
```bash
cd src/frontend
npm install
npm test -- --run
npm run build
```

### EF Migrations (from `src/backend/`)
```bash
dotnet ef migrations add <Name> \
  --project src/FamilyHub.Infrastructure \
  --startup-project src/FamilyHub.Api \
  --output-dir Persistence/Migrations
```

### Run via Aspire
```bash
dotnet run --project src/backend/src/FamilyHub.AppHost
```

## Coding Conventions

- Domain models: private constructors + static `Create()` factory; no setters
- All `DateTimeOffset` properties end with `Utc` suffix (e.g. `CreatedAtUtc`)
- Application layer has **no** reference to Infrastructure or EF Core
- Controllers return `200 OK` with data, `400 Bad Request`, `401 Unauthorized`, or `404 Not Found`
- JWT config keys: `Authentication:Jwt:Issuer/Audience/SigningKey/TokenLifetimeMinutes`
- Connection string key for Aspire: `familyhubdb`; fallback: `DefaultConnection`

## Frontend Conventions

- Types in `src/app/types/` match backend DTO field names exactly (including `Utc` suffix)
- Pinia stores in `src/app/stores/` — each domain has its own store
- API clients in `src/app/api/` use the typed `apiClient` from `client.ts`
- Token storage keys prefixed `familyhub:` (e.g. `familyhub:token`)

## Test Patterns

- **Unit tests:** inject in-memory fakes implementing application abstractions directly
- **Integration tests:** `CustomWebApplicationFactory` swaps EF provider to InMemory
- `public partial class Program;` in `Program.cs` enables test factory access
- Frontend tests use `vitest` + `@pinia/testing`; mock `src/app/api/` modules

## Known Gotchas

- Vite 8 uses OXC for TypeScript; the root `tsconfig.json` must have `extends` + `include` (not just project references)
- `FamilyMember.User` navigation property requires explicit `.Include(x => x.User)` in EF queries
- Todo done/pending endpoints use `PATCH`, not `PUT`
- Family calendar endpoint returns `FamilyCalendarEventDto` (includes `memberName` + `memberColor`), personal events return plain `CalendarEventDto`
