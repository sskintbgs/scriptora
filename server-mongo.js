import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
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

// --- MONGODB IMPORTS ---
import { connectDB, User, Script, Ticket, Notification, Log, Transcript, Visitor, Maintenance } from './src/db.js';

// --- DISCORD BOT ---
import { startBot } from './bot/bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;

// Connect to MongoDB
await connectDB();

// ============================================================
//  SECURITY CONFIG
// ============================================================
const SERVER_SECRET = crypto.randomBytes(64).toString('hex');
const ipTracker = new Map();
const challengeStore = new Map();
const clearanceTokens = new Set();
let onlineUsers = new Set(); 

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser(SERVER_SECRET));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.disable('x-powered-by');

const blockedPatterns = [/\.map$/i, /\.jsx$/i, /\/src\//i, /\/data\//i, /\/server\.js$/i, /\/\.env/i, /\/node_modules\//i, /\/\.git\//i, /\/package\.json$/i, /\/package-lock\.json$/i, /\/vite\.config/i, /\/tsconfig/i, /\/\.npmrc/i, /\/\.gitignore$/i, /\/\.eslint/i, /\/dist\//i];
app.use((req, res, next) => {
  if (blockedPatterns.some(p => p.test(req.path))) return res.status(404).json({ error: 'Not found' });
  next();
});

const globalLimiter = rateLimit({ windowMs: 60000, max: 200, standardHeaders: true, legacyHeaders: false, message: { error: 'Rate limited.', blocked: true } });
app.use(globalLimiter);

// Banned User Middleware
async function checkBanned(req, res, next) {
  const { userId } = req.body;
  if (userId) {
    const user = await User.findOne({ id: userId });
    if (user && user.banned) {
      return res.status(403).json({ error: 'This account has been banned.', banned: true });
    }
  }
  next();
}

const challengeLimiter = rateLimit({ windowMs: 60000, max: 10, message: { error: 'Too many challenge requests.', blocked: true } });
const loginLimiter = rateLimit({ windowMs: 15 * 60000, max: 5, message: { error: 'Too many login attempts. Try again later.', blocked: true } });
const writeLimiter = rateLimit({ windowMs: 60000, max: 30, message: { error: 'Rate limit exceeded.', blocked: true } });
const ticketLimiter = rateLimit({ windowMs: 300000, max: 5, message: { error: 'Too many tickets. Wait 5 minutes.', blocked: true } });

function trackIP(ip) {
  const now = Date.now();
  if (!ipTracker.has(ip)) ipTracker.set(ip, { requests: [], banned_until: 0, warnings: 0 });
  const tracker = ipTracker.get(ip);
  tracker.requests = tracker.requests.filter(t => now - t < 300000);
  tracker.requests.push(now);

  if (tracker.banned_until > now) return { allowed: false, reason: 'IP temporarily banned', ban_remaining: Math.ceil((tracker.banned_until - now) / 1000) };
  if (tracker.requests.length > 500) { tracker.banned_until = now + 600000; tracker.warnings++; return { allowed: false, reason: 'DDoS protection triggered', ban_remaining: 600 }; }
  const recent = tracker.requests.filter(t => now - t < 60000);
  if (recent.length > 150) { tracker.banned_until = now + 120000; tracker.warnings++; return { allowed: false, reason: 'Rate limit exceeded', ban_remaining: 120 }; }
  const burst = tracker.requests.filter(t => now - t < 3000);
  if (burst.length > 40) { tracker.banned_until = now + 30000; tracker.warnings++; return { allowed: false, reason: 'Burst rate exceeded', ban_remaining: 30 }; }
  return { allowed: true };
}

function signToken(data) { return crypto.createHmac('sha256', SERVER_SECRET).update(data).digest('hex'); }

const modelsMap = { users: User, scripts: Script, logs: Log, tickets: Ticket, transcripts: Transcript, notifications: Notification };

// ============================================================
//  HEALTH CHECK  (keep-alive ping target)
// ============================================================
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  res.json({
    status:  'ok',
    uptime:  `${d}d ${h}h ${m}m ${s}s`,
    memory:  `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    time:    new Date().toISOString(),
  });
});

// ============================================================
//  DATABASE API ENDPOINTS (MONGODB)
// ============================================================

app.get('/api/db/:collection', async (req, res) => {
  const Model = modelsMap[req.params.collection];
  if (!Model) return res.status(400).json({ error: 'Invalid collection' });
  const data = await Model.find({}, { _id: 0, __v: 0 }).lean();
  if (req.params.collection === 'users') return res.json(data.map(({ password, ...u }) => u));
  res.json(data);
});

app.post('/api/db/:collection', writeLimiter, checkBanned, async (req, res) => {
  const m = await Maintenance.findOne({ id: 'global' });
  if (m?.maintenanceMode) return res.status(503).json({ error: 'Maintenance mode' });
  const { collection } = req.params;
  const Model = modelsMap[collection];
  if (!Model) return res.status(400).json({ error: 'Invalid collection' });
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: 'Data must be an array' });

  if (collection === 'users') {
    const existing = await User.find({}).lean();
    const merged = data.map(u => {
      const existingUser = existing.find(e => String(e.id) === String(u.id));
      return { ...u, password: u.password || existingUser?.password || '' };
    });
    await User.deleteMany({});
    await User.insertMany(merged);
  } else {
    await Model.deleteMany({});
    await Model.insertMany(data);
  }
  res.json({ success: true });
});

app.get('/api/stats', async (req, res) => {
  const totalUsers = await User.countDocuments();
  const scripts = await Script.find({}).lean();
  const vDoc = await Visitor.findOne({ id: 'visitor_count' });
  
  res.json({
    totalUsers,
    totalScripts: scripts.length,
    verifiedScripts: scripts.filter(s => s.verified).length,
    pendingScripts: scripts.filter(s => !s.verified).length,
    totalViews: scripts.reduce((sum, s) => sum + (s.views || 0), 0),
    totalLikes: scripts.reduce((sum, s) => sum + (s.likes || 0), 0),
    onlineUsers: onlineUsers.size,
    totalVisitors: vDoc ? vDoc.count : 0
  });
});

const visitedIPs = new Set();
app.post('/api/heartbeat', async (req, res) => {
  const id = req.ip + ':' + (req.body.uid || 'anon');
  onlineUsers.add(id);
  setTimeout(() => onlineUsers.delete(id), 60000);
  if (!visitedIPs.has(req.ip)) {
    visitedIPs.add(req.ip);
    await Visitor.findOneAndUpdate({ id: 'visitor_count' }, { $inc: { count: 1 } }, { upsert: true });
  }
  res.json({ online: onlineUsers.size });
});

app.post('/api/scripts/:id/like', writeLimiter, checkBanned, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  const script = await Script.findOne({ id: req.params.id });
  if (!script) return res.status(404).json({ error: 'Script not found' });
  if (String(script.authorId) === String(userId)) return res.status(403).json({ error: 'Cannot like your own script' });
  
  const alreadyLiked = script.likedBy.includes(String(userId));
  if (alreadyLiked) {
    script.likedBy = script.likedBy.filter(id => id !== String(userId));
    script.likes = Math.max(0, (script.likes || 1) - 1);
  } else {
    script.likedBy.push(String(userId));
    script.likes = (script.likes || 0) + 1;
  }
  await script.save();
  res.json({ likes: script.likes, liked: !alreadyLiked });
});

app.get('/api/profile/:username', async (req, res) => {
  const username = req.params.username;
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }, { password: 0, _id: 0, __v: 0 }).lean();
  
  if (user) {
    const scripts = await Script.find({ $or: [{ authorId: user.id }, { author: { $regex: new RegExp(`^${username}$`, 'i') } }] }).lean();
    return res.json({ user, scripts });
  }
  
  const authorScripts = await Script.find({ author: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
  if (authorScripts.length > 0) {
    const virtualUser = { id: '0', username: authorScripts[0].author, role: 'user', banned: false, bio: '', avatar: '', badges: [], createdAt: authorScripts[0].date };
    return res.json({ user: virtualUser, scripts: authorScripts });
  }
  return res.status(404).json({ error: 'User not found' });
});

// --- Delete all scripts by user (admin/owner only) ---
app.post('/api/admin/delete-all-scripts', writeLimiter, async (req, res) => {
  const { adminId, targetUserId } = req.body;
  if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
  
  const admin = await User.findOne({ id: adminId });
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) return res.status(403).json({ error: 'Unauthorized' });
  
  const result = await Script.deleteMany({ authorId: targetUserId });
  console.log(`[ADMIN] ${admin.username} deleted all ${result.deletedCount} scripts by user #${targetUserId}`);
  res.json({ success: true, deletedCount: result.deletedCount });
});

// --- Maintenance & Storage Management ---
app.get('/api/admin/maintenance', async (req, res) => {
  let m = await Maintenance.findOne({ id: 'global' });
  if (!m) { m = new Maintenance({ id: 'global' }); await m.save(); }
  res.json(m);
});

app.post('/api/admin/maintenance', writeLimiter, async (req, res) => {
  const { adminId, assetUploadsBlocked, maintenanceMode } = req.body;
  const admin = await User.findOne({ id: adminId });
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) return res.status(403).json({ error: 'Unauthorized' });
  
  let m = await Maintenance.findOne({ id: 'global' });
  if (!m) m = new Maintenance({ id: 'global' });
  if (assetUploadsBlocked !== undefined) m.assetUploadsBlocked = assetUploadsBlocked;
  if (maintenanceMode !== undefined) m.maintenanceMode = maintenanceMode;
  await m.save();
  res.json(m);
});

app.post('/api/admin/purge-assets', writeLimiter, async (req, res) => {
  const { adminId, type } = req.body; // type: 'banners' | 'avatars' | 'all'
  const admin = await User.findOne({ id: adminId });
  if (!admin || admin.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const update = {};
  if (type === 'banners' || type === 'all') update.banner = '';
  if (type === 'avatars' || type === 'all') update.avatar = '';
  
  const result = await User.updateMany({}, { $set: update });
  res.json({ success: true, count: result.modifiedCount });
});

app.post('/api/profile/update', writeLimiter, checkBanned, async (req, res) => {
  const m = await Maintenance.findOne({ id: 'global' });
  if (m?.maintenanceMode) return res.status(503).json({ error: 'Platform is in maintenance mode' });
  const { userId, bio, avatar, banner } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  const user = await User.findOne({ id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (banner !== undefined || avatar !== undefined) {
    if (m?.assetUploadsBlocked) return res.status(503).json({ error: 'Asset uploads are currently disabled' });
  }
  if (bio !== undefined) user.bio = String(bio).substring(0, 500);
  if (avatar !== undefined) user.avatar = String(avatar);
  if (banner !== undefined) user.banner = String(banner);
  await user.save();
  const safe = user.toObject(); delete safe.password;
  res.json(safe);
});

app.post('/api/profile/avatar', writeLimiter, checkBanned, async (req, res) => {
  const { userId, avatar } = req.body;
  if (!userId || !avatar) return res.status(400).json({ error: 'Missing fields' });
  const user = await User.findOne({ id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.avatar = avatar;
  await user.save();
  const safe = user.toObject(); delete safe.password;
  res.json(safe);
});

const VALID_BADGES = ['trusted', 'friend', 'og', 'vip', 'contributor', 'staff', 'verified', 'developer', 'supporter'];
app.post('/api/badges/grant', writeLimiter, async (req, res) => {
  const { adminId, targetUserId, badge } = req.body;
  if (!adminId || !targetUserId || !badge) return res.status(400).json({ error: 'Missing fields' });
  if (!VALID_BADGES.includes(badge)) return res.status(400).json({ error: 'Invalid badge', validBadges: VALID_BADGES });
  const admin = await User.findOne({ id: adminId });
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) return res.status(403).json({ error: 'Admin only' });
  const user = await User.findOne({ id: targetUserId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.badges.includes(badge)) { user.badges.push(badge); await user.save(); }
  const safe = user.toObject(); delete safe.password;
  res.json(safe);
});

app.post('/api/badges/revoke', writeLimiter, async (req, res) => {
  const { adminId, targetUserId, badge } = req.body;
  const admin = await User.findOne({ id: adminId });
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) return res.status(403).json({ error: 'Admin only' });
  const user = await User.findOne({ id: targetUserId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.badges = user.badges.filter(b => b !== badge);
  await user.save();
  const safe = user.toObject(); delete safe.password;
  res.json(safe);
});

app.post('/api/follow', writeLimiter, async (req, res) => {
  const { userId, targetUserId } = req.body;
  if (!userId || !targetUserId || userId === targetUserId) return res.status(400).json({ error: 'Invalid operation' });
  const user = await User.findOne({ id: userId });
  const target = await User.findOne({ id: targetUserId });
  if (!user || !target) return res.status(404).json({ error: 'User not found' });
  
  const isFollowing = user.following.includes(String(targetUserId));
  if (isFollowing) {
    user.following = user.following.filter(id => id !== String(targetUserId));
    target.followers = target.followers.filter(id => id !== String(userId));
  } else {
    user.following.push(String(targetUserId));
    target.followers.push(String(userId));
    await Notification.create({ id: Date.now().toString(), userId: targetUserId, type: 'follow', fromUser: user.username, fromId: userId, read: false, date: new Date().toISOString() });
  }
  await user.save();
  await target.save();
  res.json({ following: !isFollowing, followerCount: target.followers.length });
});

app.get('/api/followers/:userId', async (req, res) => {
  const user = await User.findOne({ id: req.params.userId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ followers: user.followers || [], following: user.following || [] });
});

app.get('/api/notifications/:userId', async (req, res) => {
  const notifs = await Notification.find({ userId: req.params.userId }).sort({ date: -1 }).limit(50).lean();
  res.json(notifs);
});

app.post('/api/notifications/read', writeLimiter, async (req, res) => {
  const { userId, notifId } = req.body;
  if (notifId === 'all') {
    await Notification.updateMany({ userId }, { $set: { read: true } });
  } else {
    await Notification.updateOne({ id: notifId, userId }, { $set: { read: true } });
  }
  res.json({ ok: true });
});

app.post('/api/notify/script-status', async (req, res) => {
  const { authorId, scriptTitle, scriptId, status } = req.body;
  await Notification.create({ id: Date.now().toString(), userId: authorId, type: status === 'verified' ? 'script_verified' : 'script_denied', scriptTitle, scriptId, read: false, date: new Date().toISOString() });
  res.json({ ok: true });
});

app.post('/api/notify/followers', async (req, res) => {
  const { userId, username, scriptTitle, scriptId } = req.body;
  const author = await User.findOne({ id: userId });
  if (author && author.followers?.length > 0) {
    const now = new Date().toISOString();
    const notifs = author.followers.map(fId => ({ id: Date.now().toString() + Math.random(), userId: fId, type: 'new_script', fromUser: username, fromId: userId, scriptTitle, scriptId, read: false, date: now }));
    await Notification.insertMany(notifs);
  }
  res.json({ ok: true });
});

app.post('/api/reputation', writeLimiter, async (req, res) => {
  const { userId, targetUserId, type } = req.body;
  if (!userId || !targetUserId || userId === targetUserId) return res.status(400).json({ error: 'Invalid' });
  const target = await User.findOne({ id: targetUserId });
  if (!target) return res.status(404).json({ error: 'User not found' });
  
  const existing = target.repLog.findIndex(r => String(r.fromId) === String(userId));
  if (existing >= 0) target.repLog[existing] = { fromId: userId, type, date: new Date().toISOString() };
  else target.repLog.push({ fromId: userId, type, date: new Date().toISOString() });
  
  target.reputation = target.repLog.reduce((sum, r) => sum + (r.type === 'up' ? 1 : -1), 0);
  await target.save();
  res.json({ reputation: target.reputation });
});

app.post('/api/tickets', ticketLimiter, async (req, res) => {
  const { userId, username, subject, message, category, priority } = req.body;
  const ticket = new Ticket({ id: Date.now().toString(), userId, username, subject: subject?.trim(), category: category || 'general', priority: priority || 'medium', status: 'open', messages: [{ id: 1, userId, username, text: message?.trim(), date: new Date().toISOString(), isStaff: false }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await ticket.save();
  res.json(ticket);
});

app.get('/api/tickets/user/:userId', async (req, res) => {
  const tickets = await Ticket.find({ userId: req.params.userId }).lean();
  res.json(tickets);
});

app.get('/api/tickets', async (req, res) => {
  const { userId } = req.query;
  const user = await User.findOne({ id: userId });
  if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'support')) return res.status(403).json({ error: 'Staff only' });
  const tickets = await Ticket.find({}).lean();
  res.json(tickets);
});

app.post('/api/tickets/:id/reply', writeLimiter, async (req, res) => {
  const { userId, username, message, isStaff } = req.body;
  const ticket = await Ticket.findOne({ id: req.params.id });
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  ticket.messages.push({ id: ticket.messages.length + 1, userId, username: username || 'Staff', text: message.trim(), date: new Date().toISOString(), isStaff: !!isStaff });
  ticket.updatedAt = new Date().toISOString();
  if (isStaff && ticket.status === 'open') ticket.status = 'replied';
  if (!isStaff && ticket.status === 'replied') ticket.status = 'open';
  await ticket.save();
  res.json(ticket);
});

app.post('/api/tickets/:id/claim', writeLimiter, async (req, res) => {
  const { userId, username } = req.body;
  const user = await User.findOne({ id: userId });
  if (!user || !['admin','owner','support'].includes(user.role)) return res.status(403).json({ error: 'Staff only' });
  const ticket = await Ticket.findOne({ id: req.params.id });
  ticket.claimedBy = username; ticket.claimedById = userId; ticket.updatedAt = new Date().toISOString();
  await ticket.save();
  res.json(ticket);
});

app.patch('/api/tickets/:id', writeLimiter, async (req, res) => {
  const { userId, status, priority } = req.body;
  const user = await User.findOne({ id: userId });
  if (!user || !['admin','owner','support'].includes(user.role)) return res.status(403).json({ error: 'Staff only' });
  const ticket = await Ticket.findOne({ id: req.params.id });
  if (status) {
    ticket.status = status;
    if (status === 'closed') {
      ticket.closedBy = user.username; ticket.closedAt = new Date().toISOString();
      await Transcript.create({ ticketId: ticket.id, subject: ticket.subject, category: ticket.category, username: ticket.username, claimedBy: ticket.claimedBy, closedBy: user.username, messages: ticket.messages, closedAt: ticket.closedAt, createdAt: ticket.createdAt });
    }
  }
  if (priority) ticket.priority = priority;
  ticket.updatedAt = new Date().toISOString();
  await ticket.save();
  res.json(ticket);
});

// Proxies
app.get('/api/executors', async (req, res) => {
  try {
    const response = await fetch('https://weao.xyz/api/status/exploits', { headers: { 'User-Agent': 'WEAO-3PService' }});
    res.json(await response.json());
  } catch (err) { res.status(502).json({ error: 'Data unavailable' }); }
});
app.get('/api/roblox-versions/:type', async (req, res) => {
  try {
    const response = await fetch(`https://weao.xyz/api/versions/${req.params.type}`, { headers: { 'User-Agent': 'WEAO-3PService' }});
    res.json(await response.json());
  } catch (err) { res.status(502).json({ error: 'Data unavailable' }); }
});

// Challenge / Auth Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() }));
app.post('/api/challenge/request', challengeLimiter, (req, res) => {
  const ipCheck = trackIP(req.ip);
  if (!ipCheck.allowed) return res.status(429).json({ error: ipCheck.reason, blocked: true, ban_remaining: ipCheck.ban_remaining });
  const a = Math.floor(Math.random() * 90000) + 10000; const b = Math.floor(Math.random() * 90000) + 10000;
  const challengeId = uuidv4(); const rayId = crypto.randomBytes(8).toString('hex').toUpperCase();
  challengeStore.set(challengeId, { answer: a + b, ip: req.ip, created: Date.now(), attempts: 0, maxAttempts: 3, rayId });
  setTimeout(() => challengeStore.delete(challengeId), 30000);
  res.json({ challengeId, rayId, operands: { a, b }, operation: 'add', expiresIn: 30 });
});

app.post('/api/challenge/verify', challengeLimiter, (req, res) => {
  const { challengeId, answer } = req.body;
  const challenge = challengeStore.get(challengeId);
  if (!challenge) return res.status(410).json({ error: 'Expired' });
  if (challenge.ip !== req.ip || parseInt(answer) !== challenge.answer) return res.status(401).json({ error: 'Wrong' });
  challengeStore.delete(challengeId);
  const tokenData = `${req.ip}:${Date.now()}:${uuidv4()}`;
  const clearanceToken = `${tokenData}|${signToken(tokenData)}`;
  clearanceTokens.add(clearanceToken); setTimeout(() => clearanceTokens.delete(clearanceToken), 3600000);
  res.cookie('xeno_clearance', clearanceToken, { httpOnly: true, sameSite: 'lax', maxAge: 3600000, signed: true });
  res.cookie('xeno_cleared', '1', { httpOnly: false, sameSite: 'lax', maxAge: 3600000 });
  res.json({ success: true, rayId: challenge.rayId });
});
app.get('/api/challenge/status', (req, res) => {
  const clearanceCookie = req.signedCookies?.xeno_clearance;
  if (!clearanceCookie || !clearanceTokens.has(clearanceCookie)) return res.json({ cleared: false });
  res.json({ cleared: true });
});
app.post('/api/auth/login-check', loginLimiter, (req, res) => res.json({ allowed: trackIP(req.ip).allowed }));

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
  if (!user || !bcrypt.compareSync(password, user.password || '')) return res.status(401).json({ error: 'Invalid password' });
  if (user.banned) return res.status(403).json({ error: 'This account has been banned.' });
  const safe = user.toObject(); delete safe.password;
  res.json(safe);
});

app.post('/api/auth/register', writeLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  if (await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })) return res.status(409).json({ error: 'Username taken' });
  if (await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })) return res.status(409).json({ error: 'Email taken' });
  const newUser = await User.create({ id: Date.now().toString(), username, email, password: bcrypt.hashSync(password, 10), role: 'user', createdAt: new Date().toISOString() });
  const safe = newUser.toObject(); delete safe.password;
  res.json(safe);
});

app.post('/api/auth/update-creds', writeLimiter, async (req, res) => {
  const { userId, newUsername, newEmail, newPassword } = req.body;
  const user = await User.findOne({ id: userId });
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (newUsername) user.username = newUsername;
  if (newEmail) user.email = newEmail;
  if (newPassword) user.password = bcrypt.hashSync(newPassword, 10);
  await user.save();
  const safe = user.toObject(); delete safe.password;
  res.json(safe);
});

app.post('/api/auth/admin-reset-password', writeLimiter, async (req, res) => {
  const { adminUserId, targetUserId, newPassword } = req.body;
  const admin = await User.findOne({ id: adminUserId });
  if (!admin || !['admin','owner'].includes(admin.role)) return res.status(403).json({ error: 'Unauthorized' });
  const target = await User.findOne({ id: targetUserId });
  target.password = bcrypt.hashSync(newPassword, 10);
  await target.save();
  res.json({ success: true });
});

app.get('/api/admin/ip-stats', (req, res) => res.json({ totalTrackedIPs: ipTracker.size, activeClearances: clearanceTokens.size, pendingChallenges: challengeStore.size, ips: [] }));

setInterval(() => {
  const now = Date.now();
  ipTracker.forEach((data, ip) => {
    data.requests = data.requests.filter(t => now - t < 300000);
    if (data.requests.length === 0 && data.banned_until < now) ipTracker.delete(ip);
  });
}, 300000);

// ============================================================
//  BOT DASHBOARD API
// ============================================================
import { readFileSync as _rfs, writeFileSync as _wfs, existsSync as _exi } from 'fs';
import { getBotClient } from './bot/bot.js';

const BOT_CONFIG_PATH = path.join(__dirname, 'bot', 'config.json');
const BOT_ECO_PATH    = path.join(__dirname, 'bot', 'economy.json');

function readBotConfig() {
  try { return JSON.parse(_rfs(BOT_CONFIG_PATH, 'utf8')); } catch { return {}; }
}
function writeBotConfig(data) {
  _wfs(BOT_CONFIG_PATH, JSON.stringify(data, null, 2));
}
function deepMergeCfg(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMergeCfg(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

app.get('/api/bot/config', (req, res) => {
  res.json(readBotConfig());
});

app.post('/api/bot/config', writeLimiter, async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findOne({ id: userId });
  if (!user || !['admin', 'owner'].includes(user.role)) return res.status(403).json({ error: 'Admin only' });
  const current = readBotConfig();
  const updated = deepMergeCfg(current, req.body);
  writeBotConfig(updated);
  res.json(updated);
});

app.get('/api/bot/status', (req, res) => {
  const botClient = getBotClient();
  if (!botClient || !botClient.isReady()) return res.json({ online: false });
  const guild = botClient.guilds.cache.first();
  res.json({
    online:   true,
    tag:      botClient.user.tag,
    guilds:   botClient.guilds.cache.size,
    commands: botClient.commands?.size ?? 0,
    members:  guild?.memberCount ?? 0,
    uptime:   formatUptime(process.uptime()),
  });
});

app.get('/api/bot/economy', (req, res) => {
  try {
    const data = _exi(BOT_ECO_PATH) ? JSON.parse(_rfs(BOT_ECO_PATH, 'utf8')) : {};
    res.json(data);
  } catch { res.json({}); }
});

function formatUptime(secs) {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Serve frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint not found' });
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🛡️  Scriptora Server (MongoDB) running on port ${PORT}`);

  // Start Discord bot alongside the server
  try {
    console.log('[Server] Calling startBot()...');
    await startBot();
    console.log('🤖 Discord bot started successfully alongside the server.');
  } catch (err) {
    console.error('⚠️  Discord bot failed to start:', err.message);
    console.log('   Server will continue running without the bot.');
  }

  // ── Render Keep-Alive Self-Ping ──────────────────────────────
  // Render free tier spins down after 15 min of inactivity.
  // This pings our own /api/health every 14 min to stay awake.
  const SELF_URL = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
    : `http://localhost:${PORT}/api/health`;

  const keepAlive = () => {
    fetch(SELF_URL)
      .then(r => console.log(`💓 Keep-alive ping → ${r.status} ${new Date().toISOString()}`))
      .catch(e => console.warn(`💔 Keep-alive failed: ${e.message}`));
  };

  // Start pinging after 1 min, then every 14 min
  setTimeout(() => {
    keepAlive();
    setInterval(keepAlive, 14 * 60 * 1000);
  }, 60_000);

  console.log(`🔁 Keep-alive self-ping enabled → ${SELF_URL} (every 14 min)`);
});

