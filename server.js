import express from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
//  FILE-BASED DATABASE
// ============================================================
const DB_DIR = path.join(__dirname, 'data');
const DB_FILES = {
  users: path.join(DB_DIR, 'users.json'),
  scripts: path.join(DB_DIR, 'scripts.json'),
  logs: path.join(DB_DIR, 'logs.json'),
  tickets: path.join(DB_DIR, 'tickets.json'),
  transcripts: path.join(DB_DIR, 'transcripts.json'),
  notifications: path.join(DB_DIR, 'notifications.json'),
};

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function readDB(key) {
  try {
    if (fs.existsSync(DB_FILES[key])) {
      return JSON.parse(fs.readFileSync(DB_FILES[key], 'utf8'));
    }
  } catch (e) {
    console.error(`[DB] Error reading ${key}:`, e.message);
  }
  return null;
}

function writeDB(key, data) {
  try {
    fs.writeFileSync(DB_FILES[key], JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`[DB] Error writing ${key}:`, e.message);
    return false;
  }
}

// Initialize default data if files don't exist
function initializeDB() {
  if (!readDB('users')) {
    writeDB('users', [
      { id: 1, username: 'admin', email: 'admin@xenonet.dev', password: '$2b$10$fSVPk/Z9g.bLC.m0Usf1MuG.zLifHU9IJTMQ39FAEHrL7vLfTwmiO', role: 'admin', warnings: 0, banned: false, createdAt: new Date().toISOString() },
      { id: 2, username: 'XenoDev', email: 'xeno@xenonet.dev', password: '$2b$10$tyll3Kiyi/dN6JI7YVzSMuHbqKdbW7vK7BdPtPBURWLLjzXQoMey.', role: 'user', warnings: 0, banned: false, createdAt: new Date().toISOString() },
      { id: 3, username: 'owner', email: 'owner@xenonet.dev', password: '$2b$10$.EjKekOuYLFhg4KYNb4NOu1HV5IVJmvaCQq0kPl1t1T25fsRbJIC6', role: 'owner', warnings: 0, banned: false, createdAt: new Date().toISOString() }
    ]);
    console.log('[DB] Initialized users.json');
  }
  if (!readDB('scripts')) {
    writeDB('scripts', []);
    console.log('[DB] Initialized empty scripts.json');
  } else {
    const scripts = readDB('scripts');
    console.log(`[DB] Loaded ${scripts.length} scripts from scripts.json`);
  }
  if (!readDB('logs')) {
    writeDB('logs', [{ id: 1, action: 'System Initialized', actor: 'system', details: 'Database created', date: new Date().toISOString() }]);
    console.log('[DB] Initialized logs.json');
  }
  if (!readDB('tickets')) {
    writeDB('tickets', []);
    console.log('[DB] Initialized tickets.json');
  }
}
initializeDB();

// ============================================================
//  SECURITY CONFIG
// ============================================================
const SERVER_SECRET = crypto.randomBytes(64).toString('hex');
const ipTracker = new Map();
const challengeStore = new Map();
const clearanceTokens = new Set();
let onlineUsers = new Set(); // Track online connections

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser(SERVER_SECRET));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Disable X-Powered-By
app.disable('x-powered-by');

// Block direct access to source files, data directory, and sensitive paths
app.use((req, res, next) => {
  const blockedPatterns = [
    /\.map$/i,                    // Source maps
    /\.jsx$/i,                    // JSX source files
    /\/src\//i,                   // Source directory
    /\/data\//i,                  // Database files
    /\/server\.js$/i,             // Server source
    /\/\.env/i,                   // Environment files
    /\/node_modules\//i,          // Dependencies
    /\/\.git\//i,                 // Git history
    /\/package\.json$/i,          // Package manifest
    /\/package-lock\.json$/i,     // Lock file
    /\/vite\.config/i,            // Vite config
    /\/tsconfig/i,                // TS config
    /\/\.npmrc/i,                 // npm config
    /\/\.gitignore$/i,            // gitignore
    /\/\.eslint/i,                // ESLint config
    /\/dist\//i,                  // Build output
  ];
  
  if (blockedPatterns.some(p => p.test(req.path))) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// --- Rate Limiters (lenient, VPN-friendly) ---
const globalLimiter = rateLimit({ windowMs: 60000, max: 200, standardHeaders: true, legacyHeaders: false, message: { error: 'Rate limited.', blocked: true } });
app.use(globalLimiter);

const challengeLimiter = rateLimit({ windowMs: 60000, max: 10, message: { error: 'Too many challenge requests.', blocked: true } });
const loginLimiter = rateLimit({ windowMs: 15 * 60000, max: 5, message: { error: 'Too many login attempts. Try again later.', blocked: true } });
const writeLimiter = rateLimit({ windowMs: 60000, max: 30, message: { error: 'Rate limit exceeded.', blocked: true } });
const ticketLimiter = rateLimit({ windowMs: 300000, max: 5, message: { error: 'Too many tickets. Wait 5 minutes.', blocked: true } });

// --- IP Tracking ---
function trackIP(ip) {
  const now = Date.now();
  if (!ipTracker.has(ip)) ipTracker.set(ip, { requests: [], banned_until: 0, warnings: 0 });
  const tracker = ipTracker.get(ip);
  tracker.requests = tracker.requests.filter(t => now - t < 300000);
  tracker.requests.push(now);

  if (tracker.banned_until > now) {
    return { allowed: false, reason: 'IP temporarily banned', ban_remaining: Math.ceil((tracker.banned_until - now) / 1000) };
  }
  if (tracker.requests.length > 500) {
    tracker.banned_until = now + 600000;
    tracker.warnings++;
    console.log(`[SECURITY] IP ${ip} banned 10min — DDoS detected (${tracker.requests.length} req/5min)`);
    return { allowed: false, reason: 'DDoS protection triggered', ban_remaining: 600 };
  }
  const recent = tracker.requests.filter(t => now - t < 60000);
  if (recent.length > 150) {
    tracker.banned_until = now + 120000;
    tracker.warnings++;
    console.log(`[SECURITY] IP ${ip} soft-banned 2min (${recent.length} req/min)`);
    return { allowed: false, reason: 'Rate limit exceeded', ban_remaining: 120 };
  }
  const burst = tracker.requests.filter(t => now - t < 3000);
  if (burst.length > 40) {
    tracker.banned_until = now + 30000;
    tracker.warnings++;
    console.log(`[SECURITY] IP ${ip} burst-banned 30s (${burst.length} req/3s)`);
    return { allowed: false, reason: 'Burst rate exceeded', ban_remaining: 30 };
  }
  return { allowed: true };
}

function signToken(data) {
  return crypto.createHmac('sha256', SERVER_SECRET).update(data).digest('hex');
}

// ============================================================
//  DATABASE API ENDPOINTS
// ============================================================

// --- Sync: GET full database ---
app.get('/api/db/:collection', (req, res) => {
  const { collection } = req.params;
  if (!DB_FILES[collection]) return res.status(400).json({ error: 'Invalid collection' });
  const data = readDB(collection);
  if (collection === 'users') {
    // Never send passwords to client
    return res.json((data || []).map(({ password, ...u }) => u));
  }
  res.json(data || []);
});

// --- Sync: POST save full collection ---
app.post('/api/db/:collection', writeLimiter, (req, res) => {
  const { collection } = req.params;
  if (!DB_FILES[collection]) return res.status(400).json({ error: 'Invalid collection' });
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: 'Data must be an array' });

  // For users, merge passwords from existing file (client never has them)
  if (collection === 'users') {
    const existing = readDB('users') || [];
    const merged = data.map(u => {
      const existingUser = existing.find(e => String(e.id) === String(u.id));
      return { ...u, password: u.password || existingUser?.password || '' };
    });
    writeDB('users', merged);
  } else {
    writeDB(collection, data);
  }

  res.json({ success: true });
});

// --- Get public stats ---
app.get('/api/stats', (req, res) => {
  const users = readDB('users') || [];
  const scripts = readDB('scripts') || [];

  res.json({
    totalUsers: users.length,
    totalScripts: scripts.length,
    verifiedScripts: scripts.filter(s => s.verified).length,
    pendingScripts: scripts.filter(s => !s.verified).length,
    totalViews: scripts.reduce((sum, s) => sum + (s.views || 0), 0),
    totalLikes: scripts.reduce((sum, s) => sum + (s.likes || 0), 0),
    onlineUsers: onlineUsers.size,
    totalVisitors: totalVisitors
  });
});

// --- Total visitor tracking (persistent) ---
const VISITORS_FILE = path.join(DB_DIR, 'visitors.json');
let totalVisitors = 0;
const visitedIPs = new Set();
try { const v = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8')); totalVisitors = v.count || 0; } catch { totalVisitors = 0; }
function saveVisitors() { try { fs.writeFileSync(VISITORS_FILE, JSON.stringify({ count: totalVisitors })); } catch {} }

// --- Online heartbeat ---
app.post('/api/heartbeat', (req, res) => {
  const id = req.ip + ':' + (req.body.uid || 'anon');
  onlineUsers.add(id);
  setTimeout(() => onlineUsers.delete(id), 60000);
  // Track unique visitors
  if (!visitedIPs.has(req.ip)) {
    visitedIPs.add(req.ip);
    totalVisitors++;
  }
  saveVisitors();
  res.json({ online: onlineUsers.size });
});

// --- Like with self-like prevention ---
app.post('/api/scripts/:id/like', writeLimiter, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  const scripts = readDB('scripts') || [];
  const idx = scripts.findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Script not found' });
  if (String(scripts[idx].authorId) === String(userId)) return res.status(403).json({ error: 'Cannot like your own script' });
  if (!scripts[idx].likedBy) scripts[idx].likedBy = [];
  if (!scripts[idx].likes) scripts[idx].likes = 0;
  const already = scripts[idx].likedBy.some(id => String(id) === String(userId));
  if (already) { scripts[idx].likedBy = scripts[idx].likedBy.filter(id => String(id) !== String(userId)); scripts[idx].likes = Math.max(0, scripts[idx].likes - 1); }
  else { scripts[idx].likedBy.push(userId); scripts[idx].likes++; }
  writeDB('scripts', scripts);
  res.json({ likes: scripts[idx].likes, liked: !already });
});

// --- User profile by username ---
app.get('/api/profile/:username', (req, res) => {
  const users = readDB('users') || [];
  const scripts = readDB('scripts') || [];
  const username = req.params.username;
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (user) {
    const { password, ...safeUser } = user;
    const userScripts = scripts.filter(s => 
      (String(s.authorId) === String(user.id) || s.author?.toLowerCase() === username.toLowerCase())
    );
    return res.json({ user: safeUser, scripts: userScripts });
  }
  
  // If no registered user, check if any scripts have this author name
  const authorScripts = scripts.filter(s => s.author?.toLowerCase() === username.toLowerCase());
  if (authorScripts.length > 0) {
    const virtualUser = { id: 0, username: authorScripts[0].author, role: 'user', banned: false, bio: '', avatar: '', badges: [], createdAt: authorScripts[0].date };
    return res.json({ user: virtualUser, scripts: authorScripts });
  }
  
  return res.status(404).json({ error: 'User not found' });
});

// --- Update user profile (bio, avatar) ---
app.post('/api/profile/update', writeLimiter, (req, res) => {
  const { userId, bio, avatar } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  const users = readDB('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (bio !== undefined) users[idx].bio = String(bio).substring(0, 500);
  // Remove the 500 char limit on avatar from this endpoint just in case it's used
  if (avatar !== undefined) users[idx].avatar = String(avatar);
  writeDB('users', users);
  const { password, ...safe } = users[idx];
  res.json(safe);
});

// --- Update user avatar (base64) ---
app.post('/api/profile/avatar', writeLimiter, (req, res) => {
  const { userId, avatar } = req.body;
  if (!userId || !avatar) return res.status(400).json({ error: 'Missing fields' });
  const users = readDB('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  
  users[idx].avatar = avatar;
  writeDB('users', users);
  
  const { password, ...safe } = users[idx];
  res.json(safe);
});

// --- Badge management (admin/owner only) ---
const VALID_BADGES = ['trusted', 'friend', 'og', 'vip', 'contributor', 'staff', 'verified', 'developer', 'supporter'];

app.post('/api/badges/grant', writeLimiter, (req, res) => {
  const { adminId, targetUserId, badge } = req.body;
  if (!adminId || !targetUserId || !badge) return res.status(400).json({ error: 'Missing fields' });
  if (!VALID_BADGES.includes(badge)) return res.status(400).json({ error: 'Invalid badge', validBadges: VALID_BADGES });
  const users = readDB('users') || [];
  const admin = users.find(u => String(u.id) === String(adminId));
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) return res.status(403).json({ error: 'Admin only' });
  const idx = users.findIndex(u => String(u.id) === String(targetUserId));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (!users[idx].badges) users[idx].badges = [];
  if (users[idx].badges.includes(badge)) return res.status(409).json({ error: 'Badge already granted' });
  users[idx].badges.push(badge);
  writeDB('users', users);
  const { password, ...safe } = users[idx];
  console.log(`[BADGE] ${admin.username} granted '${badge}' to ${users[idx].username}`);
  res.json(safe);
});

app.post('/api/badges/revoke', writeLimiter, (req, res) => {
  const { adminId, targetUserId, badge } = req.body;
  if (!adminId || !targetUserId || !badge) return res.status(400).json({ error: 'Missing fields' });
  const users = readDB('users') || [];
  const admin = users.find(u => String(u.id) === String(adminId));
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) return res.status(403).json({ error: 'Admin only' });
  const idx = users.findIndex(u => String(u.id) === String(targetUserId));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (!users[idx].badges) users[idx].badges = [];
  users[idx].badges = users[idx].badges.filter(b => b !== badge);
  writeDB('users', users);
  const { password, ...safe } = users[idx];
  console.log(`[BADGE] ${admin.username} revoked '${badge}' from ${users[idx].username}`);
  res.json(safe);
});

// ============================================================
//  FOLLOW SYSTEM
// ============================================================
app.post('/api/follow', writeLimiter, (req, res) => {
  const { userId, targetUserId } = req.body;
  if (!userId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
  if (String(userId) === String(targetUserId)) return res.status(400).json({ error: 'Cannot follow yourself' });
  const users = readDB('users') || [];
  const userIdx = users.findIndex(u => String(u.id) === String(userId));
  const targetIdx = users.findIndex(u => String(u.id) === String(targetUserId));
  if (userIdx === -1 || targetIdx === -1) return res.status(404).json({ error: 'User not found' });
  if (!users[userIdx].following) users[userIdx].following = [];
  if (!users[targetIdx].followers) users[targetIdx].followers = [];
  const isFollowing = users[userIdx].following.some(id => String(id) === String(targetUserId));
  if (isFollowing) {
    users[userIdx].following = users[userIdx].following.filter(id => String(id) !== String(targetUserId));
    users[targetIdx].followers = users[targetIdx].followers.filter(id => String(id) !== String(userId));
  } else {
    users[userIdx].following.push(targetUserId);
    users[targetIdx].followers.push(userId);
    // Notify
    const notifs = readDB('notifications') || [];
    notifs.push({ id: Date.now(), userId: targetUserId, type: 'follow', fromUser: users[userIdx].username, fromId: userId, read: false, date: new Date().toISOString() });
    writeDB('notifications', notifs);
  }
  writeDB('users', users);
  res.json({ following: !isFollowing, followerCount: users[targetIdx].followers.length });
});

app.get('/api/followers/:userId', (req, res) => {
  const users = readDB('users') || [];
  const user = users.find(u => String(u.id) === String(req.params.userId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ followers: user.followers || [], following: user.following || [] });
});

// ============================================================
//  NOTIFICATIONS
// ============================================================
app.get('/api/notifications/:userId', (req, res) => {
  const notifs = readDB('notifications') || [];
  const userNotifs = notifs.filter(n => String(n.userId) === String(req.params.userId)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
  res.json(userNotifs);
});

app.post('/api/notifications/read', writeLimiter, (req, res) => {
  const { userId, notifId } = req.body;
  const notifs = readDB('notifications') || [];
  if (notifId === 'all') {
    notifs.forEach(n => { if (String(n.userId) === String(userId)) n.read = true; });
  } else {
    const n = notifs.find(n => String(n.id) === String(notifId) && String(n.userId) === String(userId));
    if (n) n.read = true;
  }
  writeDB('notifications', notifs);
  res.json({ ok: true });
});

// Notify script author about verify/deny
app.post('/api/notify/script-status', (req, res) => {
  const { authorId, scriptTitle, scriptId, status } = req.body;
  if (!authorId) return res.status(400).json({ error: 'Missing' });
  const notifs = readDB('notifications') || [];
  notifs.push({
    id: Date.now(), userId: authorId, type: status === 'verified' ? 'script_verified' : 'script_denied',
    scriptTitle, scriptId, read: false, date: new Date().toISOString()
  });
  writeDB('notifications', notifs);
  res.json({ ok: true });
});

// Notify followers when user posts a script
app.post('/api/notify/followers', (req, res) => {
  const { userId, username, scriptTitle, scriptId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing' });
  const users = readDB('users') || [];
  const author = users.find(u => String(u.id) === String(userId));
  const followers = author?.followers || [];
  if (followers.length > 0) {
    const notifs = readDB('notifications') || [];
    const now = new Date().toISOString();
    followers.forEach(fId => {
      notifs.push({ id: Date.now() + Math.random(), userId: fId, type: 'new_script', fromUser: username, fromId: userId, scriptTitle, scriptId, read: false, date: now });
    });
    writeDB('notifications', notifs);
  }
  res.json({ ok: true });
});

// ============================================================
//  REPUTATION
// ============================================================
app.post('/api/reputation', writeLimiter, (req, res) => {
  const { userId, targetUserId, type } = req.body;
  if (!userId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
  if (String(userId) === String(targetUserId)) return res.status(400).json({ error: 'Cannot rep yourself' });
  if (!['up', 'down'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  const users = readDB('users') || [];
  const targetIdx = users.findIndex(u => String(u.id) === String(targetUserId));
  if (targetIdx === -1) return res.status(404).json({ error: 'User not found' });
  if (!users[targetIdx].repLog) users[targetIdx].repLog = [];
  const existing = users[targetIdx].repLog.findIndex(r => String(r.fromId) === String(userId));
  if (existing >= 0) { users[targetIdx].repLog[existing] = { fromId: userId, type, date: new Date().toISOString() }; }
  else { users[targetIdx].repLog.push({ fromId: userId, type, date: new Date().toISOString() }); }
  users[targetIdx].reputation = users[targetIdx].repLog.reduce((sum, r) => sum + (r.type === 'up' ? 1 : -1), 0);
  writeDB('users', users);
  res.json({ reputation: users[targetIdx].reputation });
});

// ============================================================
//  TICKET / CONTACT SYSTEM
// ============================================================

// Create ticket
app.post('/api/tickets', ticketLimiter, (req, res) => {
  const { userId, username, subject, message, category } = req.body;
  if (!userId || !username || !subject?.trim() || !message?.trim()) return res.status(400).json({ error: 'All fields required' });
  if (subject.length > 100) return res.status(400).json({ error: 'Subject too long (max 100 chars)' });
  if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
  const tickets = readDB('tickets') || [];
  const ticket = {
    id: Date.now(),
    userId, username,
    subject: subject.trim(),
    category: category || 'general',
    priority: req.body.priority || 'medium',
    status: 'open',
    messages: [{ id: 1, userId, username, text: message.trim(), date: new Date().toISOString(), isStaff: false }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tickets.push(ticket);
  writeDB('tickets', tickets);
  console.log(`[TICKET] New ticket by ${username}: ${subject.trim()} (${ticket.category}/${ticket.priority})`);
  res.json(ticket);
});

// Get user's tickets
app.get('/api/tickets/user/:userId', (req, res) => {
  const tickets = readDB('tickets') || [];
  const userTickets = tickets.filter(t => String(t.userId) === String(req.params.userId));
  res.json(userTickets);
});

// Get all tickets (admin/owner only)
app.get('/api/tickets', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: 'Auth required' });
  const users = readDB('users') || [];
  const user = users.find(u => String(u.id) === String(userId));
  if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'support')) return res.status(403).json({ error: 'Staff only' });
  const tickets = readDB('tickets') || [];
  res.json(tickets);
});

// Reply to ticket
app.post('/api/tickets/:id/reply', writeLimiter, (req, res) => {
  const { userId, username, message, isStaff } = req.body;
  if (!userId || !message?.trim()) return res.status(400).json({ error: 'Message required' });
  if (message.length > 2000) return res.status(400).json({ error: 'Message too long' });
  const tickets = readDB('tickets') || [];
  const ticket = tickets.find(t => String(t.id) === String(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (String(ticket.userId) !== String(userId) && !isStaff) return res.status(403).json({ error: 'Not your ticket' });
  ticket.messages.push({
    id: ticket.messages.length + 1,
    userId, username: username || 'Staff',
    text: message.trim(),
    date: new Date().toISOString(),
    isStaff: !!isStaff
  });
  ticket.updatedAt = new Date().toISOString();
  if (isStaff && ticket.status === 'open') ticket.status = 'replied';
  if (!isStaff && ticket.status === 'replied') ticket.status = 'open';
  writeDB('tickets', tickets);
  // Notify the other party
  const notifs = readDB('notifications') || [];
  const notifyUserId = isStaff ? ticket.userId : (ticket.claimedById || null);
  if (notifyUserId && String(notifyUserId) !== String(userId)) {
    notifs.push({ id: Date.now(), userId: notifyUserId, type: 'ticket_reply', fromUser: username || 'Staff', ticketId: ticket.id, subject: ticket.subject, read: false, date: new Date().toISOString() });
    writeDB('notifications', notifs);
  }
  res.json(ticket);
});

// Claim ticket (support/admin/owner)
app.post('/api/tickets/:id/claim', writeLimiter, (req, res) => {
  const { userId, username } = req.body;
  const users = readDB('users') || [];
  const user = users.find(u => String(u.id) === String(userId));
  if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'support')) return res.status(403).json({ error: 'Staff only' });
  const tickets = readDB('tickets') || [];
  const ticket = tickets.find(t => String(t.id) === String(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.claimedBy = username;
  ticket.claimedById = userId;
  ticket.updatedAt = new Date().toISOString();
  writeDB('tickets', tickets);
  console.log(`[TICKET] ${username} claimed ticket #${ticket.id}`);
  res.json(ticket);
});

// Update ticket status/priority (staff)
app.patch('/api/tickets/:id', writeLimiter, (req, res) => {
  const { userId, status, priority } = req.body;
  const users = readDB('users') || [];
  const user = users.find(u => String(u.id) === String(userId));
  if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'support')) return res.status(403).json({ error: 'Staff only' });
  const tickets = readDB('tickets') || [];
  const ticket = tickets.find(t => String(t.id) === String(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (status) {
    ticket.status = status;
    if (status === 'closed') {
      ticket.closedBy = user.username;
      ticket.closedAt = new Date().toISOString();
      // Save transcript
      const transcripts = readDB('transcripts') || [];
      transcripts.push({ ticketId: ticket.id, subject: ticket.subject, category: ticket.category, username: ticket.username, claimedBy: ticket.claimedBy, closedBy: user.username, messages: ticket.messages, closedAt: ticket.closedAt, createdAt: ticket.createdAt });
      writeDB('transcripts', transcripts);
      console.log(`[TICKET] #${ticket.id} closed by ${user.username}, transcript saved`);
    }
  }
  if (priority) ticket.priority = priority;
  ticket.updatedAt = new Date().toISOString();
  writeDB('tickets', tickets);
  res.json(ticket);
});

// --- WEAO Executor Status Proxy (cached 5min) ---
let weaoCache = { data: null, timestamp: 0 };
const WEAO_CACHE_TTL = 300000; // 5 minutes

app.get('/api/executors', async (req, res) => {
  const now = Date.now();

  // Serve from cache if fresh
  if (weaoCache.data && (now - weaoCache.timestamp) < WEAO_CACHE_TTL) {
    return res.json(weaoCache.data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://weao.xyz/api/status/exploits', {
      headers: { 'User-Agent': 'WEAO-3PService' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`WEAO API error: ${response.status}`);

    const data = await response.json();
    weaoCache = { data, timestamp: now };
    console.log(`[WEAO] Fetched ${Array.isArray(data) ? data.length : '?'} executors`);
    res.json(data);
  } catch (err) {
    console.error('[WEAO] Fetch failed:', err.message);
    // Return stale cache if available
    if (weaoCache.data) return res.json(weaoCache.data);
    res.status(502).json({ error: 'Executor data unavailable' });
  }
});

// --- WEAO Roblox Version Proxy (cached 5min per endpoint) ---
const versionCache = {};

app.get('/api/roblox-versions/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = ['current', 'future', 'past'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type. Use: current, future, past' });

  const now = Date.now();
  if (versionCache[type] && (now - versionCache[type].timestamp) < WEAO_CACHE_TTL) {
    return res.json(versionCache[type].data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://weao.xyz/api/versions/${type}`, {
      headers: { 'User-Agent': 'WEAO-3PService' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`WEAO version API error: ${response.status}`);
    const data = await response.json();
    versionCache[type] = { data, timestamp: now };
    console.log(`[WEAO] Fetched ${type} Roblox versions`);
    res.json(data);
  } catch (err) {
    console.error(`[WEAO] Version fetch failed (${type}):`, err.message);
    if (versionCache[type]) return res.json(versionCache[type].data);
    res.status(502).json({ error: 'Version data unavailable' });
  }
});
// ============================================================
//  DDOS / CHALLENGE ENDPOINTS (same as before, improved)
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.post('/api/challenge/request', challengeLimiter, (req, res) => {
  const ip = req.ip;
  const ipCheck = trackIP(ip);
  if (!ipCheck.allowed) return res.status(429).json({ error: ipCheck.reason, blocked: true, ban_remaining: ipCheck.ban_remaining });

  const a = Math.floor(Math.random() * 900000) + 100000;
  const b = Math.floor(Math.random() * 900000) + 100000;
  const challengeId = uuidv4();
  const rayId = crypto.randomBytes(8).toString('hex').toUpperCase();

  challengeStore.set(challengeId, { answer: a + b, ip, created: Date.now(), attempts: 0, maxAttempts: 3, rayId });
  setTimeout(() => challengeStore.delete(challengeId), 30000);

  console.log(`[CHALLENGE] Issued ${challengeId} to ${ip} (Ray: ${rayId})`);
  res.json({ challengeId, rayId, operands: { a, b }, operation: 'add', expiresIn: 30 });
});

app.post('/api/challenge/verify', challengeLimiter, (req, res) => {
  const { challengeId, answer } = req.body;
  const ip = req.ip;
  const ipCheck = trackIP(ip);
  if (!ipCheck.allowed) return res.status(429).json({ error: ipCheck.reason, blocked: true });
  if (!challengeId || answer === undefined) return res.status(400).json({ error: 'Missing fields' });

  const challenge = challengeStore.get(challengeId);
  if (!challenge) return res.status(410).json({ error: 'Challenge expired' });
  if (challenge.ip !== ip) { challengeStore.delete(challengeId); return res.status(403).json({ error: 'IP mismatch' }); }

  challenge.attempts++;
  if (challenge.attempts > challenge.maxAttempts) { challengeStore.delete(challengeId); return res.status(429).json({ error: 'Too many attempts' }); }
  if (parseInt(answer) !== challenge.answer) return res.status(401).json({ error: 'Wrong answer', attemptsRemaining: challenge.maxAttempts - challenge.attempts });

  challengeStore.delete(challengeId);
  const tokenData = `${ip}:${Date.now()}:${uuidv4()}`;
  const signature = signToken(tokenData);
  const clearanceToken = `${tokenData}|${signature}`;
  clearanceTokens.add(clearanceToken);
  setTimeout(() => clearanceTokens.delete(clearanceToken), 3600000);

  res.cookie('xeno_clearance', clearanceToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000, signed: true });
  res.cookie('xeno_cleared', '1', { httpOnly: false, sameSite: 'lax', maxAge: 3600000 });

  console.log(`[CLEARANCE] Solved by ${ip} (Ray: ${challenge.rayId})`);
  res.json({ success: true, message: 'Clearance granted', rayId: challenge.rayId });
});

app.get('/api/challenge/status', (req, res) => {
  const ip = req.ip;
  const ipCheck = trackIP(ip);
  if (!ipCheck.allowed) return res.status(429).json({ cleared: false, blocked: true, reason: ipCheck.reason });

  const clearanceCookie = req.signedCookies?.xeno_clearance;
  if (!clearanceCookie) return res.json({ cleared: false });
  if (!clearanceTokens.has(clearanceCookie)) {
    res.clearCookie('xeno_clearance');
    res.clearCookie('xeno_cleared');
    return res.json({ cleared: false, reason: 'Token expired' });
  }
  const tokenIP = clearanceCookie.split(':')[0];
  if (tokenIP !== ip) {
    res.clearCookie('xeno_clearance'); res.clearCookie('xeno_cleared');
    clearanceTokens.delete(clearanceCookie);
    return res.json({ cleared: false, reason: 'IP changed' });
  }
  return res.json({ cleared: true });
});

app.post('/api/auth/login-check', loginLimiter, (req, res) => {
  const ipCheck = trackIP(req.ip);
  if (!ipCheck.allowed) return res.status(429).json({ allowed: false, reason: ipCheck.reason });
  res.json({ allowed: true });
});

// --- Server-side Login (passwords verified HERE, never sent to client) ---
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const ipCheck = trackIP(req.ip);
  if (!ipCheck.allowed) return res.status(429).json({ error: ipCheck.reason });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const users = readDB('users') || [];
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.banned) return res.status(403).json({ error: 'This account has been banned.' });
  if (!user.password) return res.status(500).json({ error: 'Auth error: no password hash' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const { password: _, ...safe } = user;
  console.log(`[AUTH] Login: ${user.username} (${user.role})`);
  res.json(safe);
});

// --- Server-side Register ---
app.post('/api/auth/register', writeLimiter, (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const users = readDB('users') || [];
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: 'Username already exists' });
  if (users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const newUser = { id: Date.now(), username, email, password: hash, role: 'user', warnings: 0, banned: false, createdAt: new Date().toISOString() };
  users.push(newUser);
  writeDB('users', users);

  const { password: _, ...safe } = newUser;
  console.log(`[AUTH] Register: ${username}`);
  res.json(safe);
});

// --- Server-side Update Credentials ---
app.post('/api/auth/update-creds', writeLimiter, (req, res) => {
  const { userId, newUsername, newEmail, newPassword } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const users = readDB('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  if (newUsername && newUsername !== users[idx].username) {
    if (newUsername.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (users.find(u => u.username.toLowerCase() === newUsername.toLowerCase() && String(u.id) !== String(userId))) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    users[idx].username = newUsername;
  }
  if (newEmail && newEmail !== users[idx].email) users[idx].email = newEmail;
  if (newPassword) {
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    users[idx].password = bcrypt.hashSync(newPassword, 10);
  }

  writeDB('users', users);
  const { password: _, ...safe } = users[idx];
  console.log(`[AUTH] Creds updated: ${safe.username}`);
  res.json(safe);
});

// --- Server-side Admin Password Reset ---
app.post('/api/auth/admin-reset-password', writeLimiter, (req, res) => {
  const { adminUserId, targetUserId, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const users = readDB('users') || [];
  const admin = users.find(u => String(u.id) === String(adminUserId));
  if (!admin || (admin.role !== 'owner' && admin.role !== 'admin')) return res.status(403).json({ error: 'Unauthorized' });
  const target = users.find(u => String(u.id) === String(targetUserId));
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'owner' && admin.role !== 'owner') return res.status(403).json({ error: 'Cannot reset owner password' });

  target.password = bcrypt.hashSync(newPassword, 10);
  writeDB('users', users);
  console.log(`[AUTH] Password reset by ${admin.username} for ${target.username}`);
  res.json({ success: true });
});

app.get('/api/admin/ip-stats', (req, res) => {
  const stats = [];
  ipTracker.forEach((data, ip) => {
    stats.push({ ip, requestCount: data.requests.length, warnings: data.warnings, banned: data.banned_until > Date.now(), banRemaining: Math.max(0, Math.ceil((data.banned_until - Date.now()) / 1000)) });
  });
  res.json({ totalTrackedIPs: ipTracker.size, activeClearances: clearanceTokens.size, pendingChallenges: challengeStore.size, ips: stats.sort((a, b) => b.requestCount - a.requestCount) });
});

// Cleanup stale data every 5 minutes
setInterval(() => {
  const now = Date.now();
  ipTracker.forEach((data, ip) => {
    data.requests = data.requests.filter(t => now - t < 300000);
    if (data.requests.length === 0 && data.banned_until < now) ipTracker.delete(ip);
  });
  console.log(`[CLEANUP] IPs: ${ipTracker.size}, Clearances: ${clearanceTokens.size}, Online: ${onlineUsers.size}`);
}, 300000);

// Serve React Frontend (dist folder built by Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: Send non-API requests to React app, but return 404 for missing API routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============================================================
//  START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🛡️  Scriptora Server running on port ${PORT}`);
  console.log(`   Database: ${DB_DIR}`);
  console.log(`   Rate limits: 200 req/min global, 10 challenge/min, 5 login/15min, 30 write/min`);
  console.log(`   IP bans: 40req/3s burst=30s, 150req/min=2min, 500req/5min=10min (DDoS)`);
  console.log(`   Security: helmet, X-Frame DENY, XSS, nosniff, CORS, signed cookies`);
  console.log(`   Tickets: 3/5min rate limit`);
  console.log(`   Blocked paths: src, data, .env, .map, .jsx, server.js, configs\n`);
});
