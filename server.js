const express  = require('express');
const Database = require('better-sqlite3');
const path     = require('path');

const app  = express();
const PORT = 3000;

// ── DATABASE SETUP ────────────────────────────────────────
const db = new Database('members.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    navn              TEXT    NOT NULL,
    telefon           TEXT    NOT NULL,
    e_post            TEXT    DEFAULT '',
    kommune           TEXT    NOT NULL,
    ønsker_medlemskap INTEGER NOT NULL DEFAULT 1,
    innmeldingsdato   TEXT    NOT NULL,
    opprettet_tid     TEXT    NOT NULL DEFAULT (datetime('now')),
    status            TEXT    NOT NULL DEFAULT 'active'
  )
`);

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));  // serve index.html + videos

// ── POST /api/members  —  register a new member ───────────
app.post('/api/members', (req, res) => {
  const { navn, telefon, e_post, kommune, ønsker_medlemskap } = req.body;

  // Validate required fields
  if (!navn || !navn.trim())       return res.status(400).json({ error: 'Navn mangler.' });
  if (!telefon || !telefon.trim()) return res.status(400).json({ error: 'Telefonnummer mangler.' });
  if (!kommune || !kommune.trim()) return res.status(400).json({ error: 'Kommune mangler.' });
  if (!ønsker_medlemskap)          return res.status(400).json({ error: 'Medlemsbekreftelse mangler.' });

  const innmeldingsdato = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const stmt = db.prepare(`
    INSERT INTO members (navn, telefon, e_post, kommune, ønsker_medlemskap, innmeldingsdato)
    VALUES (?, ?, ?, ?, 1, ?)
  `);

  try {
    const result = stmt.run(
      navn.trim(),
      telefon.trim(),
      (e_post || '').trim(),
      kommune.trim(),
      innmeldingsdato
    );

    const { antall } = db.prepare(
      `SELECT COUNT(*) AS antall FROM members WHERE status = 'active'`
    ).get();

    res.json({ success: true, id: result.lastInsertRowid, antall });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lagring feilet. Prøv igjen.' });
  }
});

// ── GET /api/members/count  —  return total member count ──
app.get('/api/members/count', (req, res) => {
  const { antall } = db.prepare(
    `SELECT COUNT(*) AS antall FROM members WHERE status = 'active'`
  ).get();
  res.json({ antall });
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Brim Community kjører på http://localhost:${PORT}`);
});
