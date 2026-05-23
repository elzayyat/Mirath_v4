# Mirath backend unification notes

Implemented in this rebuild:

- Removed duplicate roots: `mirath-frontend/` and `src/`.
- Removed frontend Supabase dependency, imports, env vars, and package references.
- Kept one source of truth: React frontend calls ASP.NET Core API; ASP.NET Core owns auth, cases, assets, heirs, documents, admin, lawyers, and calculation persistence.
- Added dual API routing compatibility: `/api/...` and `/api/v1/...`.
- Completed direct EF Core controllers for:
  - Auth: register, login, refresh, logout, me.
  - Cases: paginated list, create, get, update, delete, full case graph.
  - Assets: add under case, update, delete.
  - Heirs: add under case, update, delete.
  - Calculation: `POST /api/cases/{id}/calculate` with madhab and debt inclusion.
  - Documents: upload/list/delete with local `/storage` path support.
  - Admin: users CRUD, stats, audit logs.
  - Lawyers: my cases, my clients, invite client stub/queue.
  - Market: cached gold USD/gram endpoint using goldapi.io when `GOLD_API_KEY` is configured.
- PostgreSQL remains the only configured EF provider; startup uses `Database.MigrateAsync()` only.
- Initial admin seeding remains environment driven through `MIRATH_ADMIN_EMAIL` and `MIRATH_ADMIN_PASSWORD`.

Important local follow-up:

```bash
dotnet restore
dotnet ef migrations add BackendUnification -p Mirath.Infrastructure -s Mirath.API
dotnet build
npm --prefix frontend install
npm --prefix frontend run build
```

This environment does not include the .NET SDK, so build and EF migration generation must be run locally or in CI.
