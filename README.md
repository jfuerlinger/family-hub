# Family Hub

A family organisation app built with **Clean Architecture** (.NET 10 backend + Vue 3 frontend), orchestrated via .NET Aspire.

## Features

- 🔐 **User Registration & Login** — JWT-based authentication
- 👨‍👩‍👧 **Family Management** — Create families and invite members with color-coding
- ✅ **Todos** — Create tasks, assign to family members, mark done/pending, set due dates
- 📅 **Personal Calendar** — Create and manage your own events
- 🗓️ **Family Calendar** — View all family members' events with per-member show/hide toggles

## Architecture

```
src/
├── backend/
│   ├── src/
│   │   ├── FamilyHub.Domain          # Entities, business rules (no dependencies)
│   │   ├── FamilyHub.Application     # Use cases, abstractions, contracts
│   │   ├── FamilyHub.Infrastructure  # EF Core (PostgreSQL), JWT, bcrypt
│   │   ├── FamilyHub.Api             # ASP.NET Core Web API
│   │   ├── FamilyHub.AppHost         # .NET Aspire orchestration
│   │   └── FamilyHub.ServiceDefaults # Aspire telemetry defaults
│   └── tests/
│       ├── FamilyHub.Application.Tests  # Unit tests (in-memory fakes)
│       └── FamilyHub.Api.Tests          # Integration tests (InMemory EF)
└── frontend/                         # Vue 3 + Pinia + TypeScript
    └── src/
        ├── app/
        │   ├── api/        # Typed API clients
        │   ├── stores/     # Pinia stores (auth, family, todos, calendar, theme)
        │   ├── types/      # TypeScript interfaces
        │   └── router/     # Vue Router
        ├── components/layout/
        └── views/          # AuthView, Dashboard, Family, Todos, Calendar
```

## Running Locally (Aspire)

**Prerequisites:** .NET 10 SDK, Node.js 20+, Docker Desktop

```bash
cd src/backend
dotnet run --project src/FamilyHub.AppHost
```

The Aspire dashboard opens at https://localhost:15888. The API and frontend URLs are listed there.

## Running Tests

```bash
# Backend (from src/backend/)
dotnet test FamilyHub.slnx

# Frontend (from src/frontend/)
npm test -- --run
```

## Docker Compose (Development Build)

```bash
cd src
docker compose up --build
```

## Docker Compose (Production / DockerHub Images)

Copy `.env.deploy.example` to `.env.deploy` and fill in your values:

```bash
cp src/.env.deploy.example src/.env.deploy
# edit src/.env.deploy
cd src
docker compose -f docker-compose.deploy.yml up -d
```

### Push Images to Docker Hub

```bash
DOCKERHUB_USERNAME=yourusername IMAGE_TAG=latest docker compose -f src/docker-compose.deploy.yml build
docker push yourusername/familyhub-api:latest
docker push yourusername/familyhub-frontend:latest
```

## Demo Account

When the app first starts, a seed user is created:

| Field    | Value                |
|----------|----------------------|
| Email    | demo@familyhub.local |
| Password | Demo1234!            |

## Environment Variables

| Variable                              | Description                                    |
|---------------------------------------|------------------------------------------------|
| `ConnectionStrings__familyhubdb`      | PostgreSQL connection string                   |
| `ConnectionStrings__DefaultConnection`| Fallback connection string                     |
| `Authentication__Jwt__Issuer`         | JWT issuer                                     |
| `Authentication__Jwt__Audience`       | JWT audience                                   |
| `Authentication__Jwt__SigningKey`     | JWT signing key (min 32 chars)                 |
| `BACKEND_URL`                         | Backend URL for nginx reverse proxy (frontend) |
