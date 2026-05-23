# Mirath Local Run Notes

## Backend

The API now builds. It requires PostgreSQL before `dotnet run` because startup applies EF Core migrations.

Start PostgreSQL with Docker:

```powershell
docker compose up -d postgres
```

Then run the API:

```powershell
dotnet run --project Mirath.API
```

Development defaults are included in `Mirath.API/Properties/launchSettings.json` and `Mirath.API/appsettings.Development.json`:

- `DATABASE_URL=postgresql://postgres:changeme@localhost:5432/mirath`
- `JWT_SECRET=<development-only 64+ character secret>`
- `FRONTEND_ORIGIN=http://localhost:5173`

For production, override these with real environment variables.

## Frontend

```powershell
npm run dev
```

If dependencies were not installed yet, the root `predev` script installs `frontend` dependencies automatically.

The frontend API URL for local development is:

```env
VITE_API_URL=http://localhost:5169
```

