// ═══════════════════════════════════════════════════════════
// UAN — Shared client, auth helpers, utilities
// Include AFTER the Supabase CDN script
// ═══════════════════════════════════════════════════════════

// ── SERVICE WORKER (PWA) ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

const SUPABASE_URL = 'https://ytwicopssgskffjmolmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ONwJ-AHc8RGSvphR-9GaEA_AMQONxAC';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── AUTH ─────────────────────────────────────────────────────

// Race any promise against a timeout; resolves to null on timeout/error
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

async function getSession() {
  try {
    const result = await withTimeout(db.auth.getSession());
    return result?.data?.session ?? null;
  } catch {
    return null;
  }
}

async function requireAuth(redirect = 'index.html') {
  const s = await getSession();
  if (!s) { window.location.href = redirect; return null; }
  return s;
}

async function getMember(userId) {
  try {
    const result = await withTimeout(
      db.from('members').select('*').eq('user_id', userId).single()
    );
    return result?.data ?? null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;
  const member = await getMember(session.user.id);
  if (!member || member.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return null;
  }
  return { session, member };
}

// ── PHONE FORMAT ─────────────────────────────────────────────
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('47') && digits.length === 10) return '+' + digits;
  if (digits.length === 8)                              return '+47' + digits;
  if (digits.startsWith('00'))                          return '+' + digits.slice(2);
  return raw.startsWith('+') ? raw : '+' + digits;
}

// ── TIME ─────────────────────────────────────────────────────
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return 'akkurat nå';
  if (s < 3600)  return `${Math.floor(s / 60)} min siden`;
  if (s < 86400) return `${Math.floor(s / 3600)} t siden`;
  return `${Math.floor(s / 86400)} d siden`;
}

// ── COMMUNITY HELPER ─────────────────────────────────────────
async function postSystemMessage(content) {
  await db.from('community_posts').insert({
    author_id:   null,
    author_name: 'UAN',
    content,
    type:        'system',
  });
}
