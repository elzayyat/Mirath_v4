# Mirath v2 — Islamic Inheritance Calculator

> **ميراث** — Sharia-compliant inheritance distribution system
> Accurate Faraidh calculations based on the Holy Quran (An-Nisa 4:11-12, 4:176) and authenticated Sunnah
> Supporting all four Sunni madhabs: Hanafi · Maliki · Shafii · Hanbali

---

## Architecture

```
Mirath_v2/
├── frontend/           React 18 + Vite + TypeScript + TailwindCSS
├── Mirath.API/         ASP.NET Core 8 Web API
├── Mirath.Application/ CQRS / MediatR + FarayidCalculationService
├── Mirath.Domain/      Entities, Enums, Farayid engine calculators
├── Mirath.Infrastructure/ EF Core + JWT + Identity
└── tests/              Unit + Integration test projects
```

## Quick Start — Frontend (no backend needed)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## Full Stack with Docker

```bash
cp .env.example .env
# Edit .env: set DB connection string, JWT secret, optional OpenAI key
docker compose up
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | Yes (frontend) | e.g. http://localhost:8080/api |
| ConnectionStrings__DefaultConnection | Yes (API) | SQL Server string |
| JwtSettings__Secret | Yes (API) | 256-bit+ random secret |
| OpenAI__ApiKey | Optional | AI assistant feature |

## Running Tests

```bash
# Frontend
cd frontend && npm test

# Backend unit tests
cd tests/Mirath.UnitTests && dotnet test
```

## Legal Notice

For educational purposes. Outputs should be reviewed by a qualified Islamic scholar before legal use.
