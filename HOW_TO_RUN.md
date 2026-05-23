# How to Run Mirath

## Step 1 — Install Node.js (if not installed)
Download from: https://nodejs.org  (version 18 or higher)
Check: `node --version`

## Step 2 — Start the app

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## ⚠️ If you ran it before and don't see new features

**You MUST clear your browser's localStorage** before logging in again.

### Option A — Browser console (fastest)
Open http://localhost:5173, press F12, go to Console tab, paste:
```js
localStorage.clear(); location.reload();
```

### Option B — Browser settings
Chrome/Edge: F12 → Application → Storage → LocalStorage → Right-click → Clear

### Option C — Private/Incognito window
Open a new private window and go to http://localhost:5173

---

## Login credentials

| Role  | Email                | Password          |
|-------|----------------------|-------------------|
| Admin | admin@mirath.app     | Mirath@Admin2026! |
| User  | Register any email   | Min 8 characters  |

---

## What's included

- ✅ Full Islamic inheritance engine (Awl, Radd, Hajb, Asaba)
- ✅ 5 Madhabs: رأي الجمهور · Hanafi · Maliki · Shafi'i · Hanbali
- ✅ 12 asset types (Gold, Silver, Real Estate, Vehicles, etc.)
- ✅ Admin panel with Users / Cases / Logs management
- ✅ Works 100% offline — no backend needed
