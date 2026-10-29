// PostgreSQL data layer (cloud: Vercel / Neon / Supabase).
// Reads the connection string from DATABASE_URL (or POSTGRES_URL, which Vercel
// Postgres sets automatically). All functions are async.
import { hashPassword, randomToken } from "./crypto";

const PG_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  null;

// ---------- connection pool (lazy; pg imported only when first used) ----------
let _pool = null;
async function getPool() {
  if (_pool) return _pool;
  if (!PG_URL) {
    throw new Error(
      "DATABASE_URL (ya POSTGRES_URL) set nahi hai. Vercel: Storage → Postgres banao. Local: .env.local mein DATABASE_URL daalo."
    );
  }
  const pg = (await import("pg")).default;
  _pool = new pg.Pool({
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
  return _pool;
}

// ---------- query helpers ----------
async function q(text, params = []) {
  await ensure();
  const pool = await getPool();
  const r = await pool.query(text, params);
  return r.rows;
}

// transaction: fn receives a query function bound to the same connection
async function withTx(fn) {
  await ensure();
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cq = async (t, p = []) => (await client.query(t, p)).rows;
    const out = await fn(cq);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (e2) {}
    throw e;
  } finally {
    client.release();
  }
}

// ---------- schema (runs once per process) ----------
let _init = null;
function ensure() {
  if (_init) return _init;
  _init = (async () => {
    const pool = await getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'hybrid',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at BIGINT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS meters (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        name TEXT, tag TEXT, measures TEXT, live TEXT, address TEXT,
        status TEXT, lvl INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS alarms (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        severity TEXT, sev_class TEXT, location TEXT, area TEXT,
        condition TEXT, value TEXT, lim TEXT, raised_at TEXT, status TEXT DEFAULT 'open'
      );
    `);
  })();
  return _init;
}

// ================= auth =================
export async function createAccount({ companyName, mode, username, email, password }) {
  const now = new Date().toISOString();
  return withTx(async (cq) => {
    const c = await cq(
      "INSERT INTO companies (name, mode, created_at) VALUES ($1,$2,$3) RETURNING id",
      [companyName, mode, now]
    );
    const companyId = c[0].id;
    const u = await cq(
      "INSERT INTO users (company_id, username, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [companyId, username, email, hashPassword(password), "admin", now]
    );
    const userId = u[0].id;
    await seedDemo(cq, companyId);
    return { userId, companyId };
  });
}

export async function findUserByLogin(login) {
  const rows = await q(
    `SELECT u.*, c.mode AS company_mode, c.name AS company_name
     FROM users u JOIN companies c ON c.id = u.company_id
     WHERE u.username = $1 OR u.email = $2`,
    [login, login]
  );
  return rows[0] || null;
}

export async function getUserById(id) {
  const rows = await q(
    `SELECT u.*, c.mode AS company_mode, c.name AS company_name
     FROM users u JOIN companies c ON c.id = u.company_id WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function emailOrUsernameExists(username, email) {
  const rows = await q("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
  return rows[0] || null;
}

// ================= password reset =================
export async function createReset(userId) {
  const token = randomToken();
  const expires = Date.now() + 1000 * 60 * 30; // 30 min
  await q(
    "INSERT INTO password_resets (user_id, token, expires_at, used) VALUES ($1,$2,$3,0)",
    [userId, token, expires]
  );
  return token;
}

export async function consumeReset(token, newPassword) {
  const rows = await q("SELECT * FROM password_resets WHERE token = $1", [token]);
  const row = rows[0];
  if (!row) return { ok: false, error: "Invalid reset link." };
  if (row.used) return { ok: false, error: "This reset link was already used." };
  if (Date.now() > Number(row.expires_at)) return { ok: false, error: "This reset link has expired." };
  await withTx(async (cq) => {
    await cq("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(newPassword), row.user_id]);
    await cq("UPDATE password_resets SET used = 1 WHERE id = $1", [row.id]);
  });
  return { ok: true };
}

// ================= dashboard data =================
export async function getMeters(companyId) {
  return q("SELECT * FROM meters WHERE company_id = $1 ORDER BY id", [companyId]);
}
export async function getAlarms(companyId) {
  return q("SELECT * FROM alarms WHERE company_id = $1 ORDER BY id", [companyId]);
}

// ================= add / delete device =================
export async function addMeter(companyId, d) {
  const rows = await q(
    `INSERT INTO meters (company_id,name,tag,measures,live,address,status,lvl)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      companyId,
      d.name || "",
      d.tag || "",
      d.measures || "",
      d.live || "—",
      d.address || "",
      d.status === "warn" ? "warn" : "ok",
      d.lvl ? 1 : 0,
    ]
  );
  return rows[0].id;
}

export async function deleteMeter(companyId, id) {
  await q("DELETE FROM meters WHERE id = $1 AND company_id = $2", [Number(id), companyId]);
}

// ================= demo seed (per new company) =================
async function seedDemo(cq, companyId) {
  const meters = [
    ["Main incomer", "EM-00", "kVA · PF · kWh", "1,940 kVA", "1 · 40001", "ok", 0],
    ["Chiller CH-01", "EM-01", "kW + BTU (TR)", "182 kW", "2 · 40001", "ok", 1],
    ["Chiller CH-02", "EM-02", "kW + BTU (TR)", "206 kW", "3 · 40001", "warn", 1],
    ["Air compressor", "EM-03", "kW + air flow", "96 kW", "4 · 40001", "ok", 1],
    ["Boiler", "EM-04", "kW + steam", "3.2 TPH", "5 · 40001", "ok", 1],
    ["Production line 1", "EM-05", "kWh", "214 kW", "6 · 40001", "ok", 1],
    ["Production line 2", "EM-06", "kWh", "198 kW", "7 · 40001", "ok", 1],
    ["HVAC / AHUs", "EM-07", "kW", "340 kW", "8 · 40001", "ok", 1],
    ["Lighting + admin", "EM-08", "group kWh", "48 kW", "9 · 40001", "ok", 1],
  ];
  for (const m of meters) {
    await cq(
      "INSERT INTO meters (company_id,name,tag,measures,live,address,status,lvl) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [companyId, ...m]
    );
  }
  const alarms = [
    ["Action", "crit", "Chiller CH-02", "Utility", "Efficiency drift", "0.79 kW/TR", "≤ 0.70", "10:41:12", "open"],
    ["Alert", "warn", "Main incomer", "Demand", "Demand near contract", "1,940 kVA", "≤ 2,000", "09:12:40", "open"],
    ["Alert", "warn", "Compressor room", "Compressed air", "Night flow high (leak)", "38%", "≤ 15%", "06:52:31", "open"],
    ["System", "info", "Gateway GW-01", "Edge", "Net lost — data buffered", "312 rec", "—", "08:14:05", "closed"],
  ];
  for (const a of alarms) {
    await cq(
      "INSERT INTO alarms (company_id,severity,sev_class,location,area,condition,value,lim,raised_at,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [companyId, ...a]
    );
  }
}
