# EnerVue EMS

Energy Management System — **Next.js 14 (JavaScript, no TypeScript) + Tailwind CSS + PostgreSQL**.
Auth (register / login / forgot-reset), per-account deployment mode (local / cloud / hybrid),
dashboard with **donut (pie) charts** + graphs, devices (add / delete), alarms, reports.

> **Database:** sirf **PostgreSQL (cloud)**. SQLite hata diya gaya hai.

## 1) Pehle: ek Postgres database lo (free)

Koi ek:
- **Vercel Postgres** (Neon) — Vercel project → **Storage → Create Database → Postgres**. Free tier.
- **Neon** (neon.tech) — free project banao, connection string copy karo.
- **Supabase** (supabase.com) — free project, Settings → Database → connection string.

Aapko ek **connection string** milega, aise:
```
postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## 2) Vercel par deploy (recommended)

1. Code GitHub par push karo, Vercel par import karo.
2. Vercel project → **Storage → Create Database → Postgres** (free).
   Vercel khud **`POSTGRES_URL`** environment variable project mein jod deta hai — kuch copy-paste nahi.
3. (Recommended) **Settings → Environment Variables** → `SESSION_SECRET` = koi lamba random text.
4. **Deploy / Redeploy** → tables apne aap ban jaati hain, login/register chal jayega.

## 3) Local par chalana (apne PC par)

> Node.js **v18+**. Local ke liye bhi ek Postgres connection string chahiye (upar wala koi, ya local Postgres).

Project folder mein file **`.env.local`** banao:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
SESSION_SECRET=koi-lamba-random-text
```
Phir:
```bash
npm install
npm run dev
```
Browser: **http://localhost:3000** → `/register` se account banao.

## Folder structure

```
lib/
  crypto.js    scrypt password hash + HMAC session token (Node built-in crypto)
  db.js        PostgreSQL (pg) — companies, users, meters, alarms, password_resets
  session.js   cookie session (httpOnly) + getCurrentUser
app/
  login/ register/ forgot/ reset/   auth pages
  api/auth/*    register, login, logout, forgot, reset, me
  api/meters/   GET list · POST add device · DELETE device
  dashboard/    overview (+donut), energy (+donut, line), devices (+add/delete), alarms, reports
components/
  AuthShell, dashboard/{Sidebar, LogoutButton, AlarmsClient, DevicesClient, Donut}
```

## Charts
- **Donut (pie) chart** — "Where energy goes" (overview) aur "Load share by area" (energy). Pure SVG.
- **Bar chart** — 7-day consumption vs baseline (overview).
- **Line/area chart** — actual vs baseline (energy).

## Database notes
- `DATABASE_URL` / `POSTGRES_URL` zaroori hai — nahi to app clear error dega.
- Har company ka data `company_id` se alag (multi-tenant).
- Naya account banate hi demo meters (9) + alarms (4) seed (sample data).
- Tables pehli baar apne aap ban jaati hain (`CREATE TABLE IF NOT EXISTS`).

## Tested
30 logic assertions on the real Postgres code path (pool.query, BEGIN/COMMIT/ROLLBACK, `$1`
placeholders, `RETURNING id`): register, duplicate→rollback, login by username/email, mode-per-account,
forgot/reset, add/delete device, per-company isolation, plain-object rows — **all passing**.
