// ============================================================
//  SERVER-SYNCED DATABASE LAYER
//  All auth happens on the server (passwords never touch client).
//  Scripts/logs sync between server JSON files and localStorage cache.
// ============================================================

const DB_KEYS = ['users', 'scripts', 'logs'];

// --- Obfuscation layer (cache only, prevents casual DevTools editing) ---
const _set = localStorage.setItem.bind(localStorage);
const _get = localStorage.getItem.bind(localStorage);

localStorage.setItem = function(key, value) {
  if (DB_KEYS.includes(key)) {
    try { _set(key, btoa(encodeURIComponent(value))); } catch(e) { _set(key, value); }
  } else { _set(key, value); }
};

localStorage.getItem = function(key) {
  const val = _get(key);
  if (!val) return val;
  if (DB_KEYS.includes(key)) {
    try { return decodeURIComponent(atob(val)); } catch(e) { return val; }
  }
  return val;
};

// --- Server sync helpers ---
const matchId = (a, b) => String(a) === String(b);

async function loadFromServer(collection) {
  try {
    const res = await fetch(`/api/db/${collection}`);
    if (res.ok) {
      const data = await res.json();
      try {
        localStorage.setItem(collection, JSON.stringify(data));
      } catch (e) {
        console.warn(`[DB] LocalStorage full, clearing scripts and logs...`);
        localStorage.removeItem('scripts');
        localStorage.removeItem('logs');
        try { localStorage.setItem(collection, JSON.stringify(data)); } catch {}
      }
      return data;
    }
  } catch (e) { /* server offline, use cache */ }
  try { return JSON.parse(localStorage.getItem(collection)) || []; } catch { return []; }
}

async function saveToServer(collection, data) {
  localStorage.setItem(collection, JSON.stringify(data));
  try {
    await fetch(`/api/db/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) { console.warn(`[DB] Server sync failed for ${collection}`); }
}

function getCollection(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

// --- Initialize: pull from server on first load ---
let _initPromise = null;
async function ensureInit() {
  if (!_initPromise) {
    _initPromise = Promise.all([
      loadFromServer('users'),
      loadFromServer('scripts'),
      loadFromServer('logs')
    ]);
  }
  return _initPromise;
}
ensureInit();

function addLog(action, actor, details) {
  const logs = getCollection('logs');
  logs.unshift({ id: Date.now(), action, actor: actor || 'system', details, date: new Date().toISOString() });
  if (logs.length > 500) logs.length = 500;
  saveToServer('logs', logs).catch(() => {});
}

// ============================================================
//  PUBLIC API
// ============================================================
export const api = {
  refresh: async () => { _initPromise = null; await ensureInit(); },

  // =================== AUTH (SERVER-SIDE) ===================
  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    addLog('Login', data.username, `User ${data.username} logged in`);
    return data;
  },

  register: async (username, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    // Refresh local user cache
    await loadFromServer('users');
    addLog('Registration', 'system', `New user registered: ${data.username}`);
    return data;
  },

  updateUserCreds: async (userId, newUsername, newEmail, newPassword) => {
    const res = await fetch('/api/auth/update-creds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newUsername, newEmail, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    await loadFromServer('users');
    if (newUsername) addLog('Username Changed', data.username, `Changed username`);
    return data;
  },

  adminResetPassword: async (adminUserId, targetUserId, newPassword) => {
    const res = await fetch('/api/auth/admin-reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId, targetUserId, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    addLog('Password Reset', 'admin', `Reset password for user #${targetUserId}`);
  },

  // =================== SCRIPTS ===================
  getScripts: async () => {
    await ensureInit();
    return getCollection('scripts').filter(s => s.verified).sort((a, b) => (b.views || 0) - (a.views || 0));
  },

  getAllScripts: async () => {
    await ensureInit();
    return getCollection('scripts');
  },

  getScriptById: async (id) => {
    await ensureInit();
    return getCollection('scripts').find(s => matchId(s.id, id)) || null;
  },

  getUserByUsername: async (username) => {
    await ensureInit();
    const users = getCollection('users');
    // Case-insensitive search
    const user = users.find(u => u.username?.toLowerCase() === username?.toLowerCase());
    if (user) {
      const { password, ...safe } = user;
      return safe;
    }

    // Try fetching from server profile endpoint if local cache fails
    try {
      const res = await fetch(`/api/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {}

    return null;
  },

  incrementViews: async (id) => {
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, id));
    if (idx !== -1) {
      scripts[idx].views = (scripts[idx].views || 0) + 1;
      await saveToServer('scripts', scripts);
      return scripts[idx].views;
    }
    return 0;
  },

  getScriptsByUser: async (userId) => {
    await ensureInit();
    return getCollection('scripts').filter(s => matchId(s.authorId, userId));
  },

  getScriptsByUsername: async (username) => {
    await ensureInit();
    const target = username?.toLowerCase();
    // Try local filter first
    const scripts = getCollection('scripts').filter(s => 
      s.author?.toLowerCase() === target && s.verified
    );
    
    if (scripts.length > 0) return scripts;

    // Try server profile endpoint
    try {
      const res = await fetch(`/api/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        return data.scripts || [];
      }
    } catch (e) {}

    return [];
  },

  addScript: async (scriptData, user) => {
    if (!user) throw new Error('Must be logged in');
    const scripts = getCollection('scripts');
    const newScript = {
      id: Date.now(), ...scriptData,
      authorId: user.id, author: user.username,
      views: 0, likes: 0, likedBy: [], status: 'working', verified: false,
      date: new Date().toISOString().split('T')[0],
      ratings: [], comments: []
    };
    scripts.push(newScript);
    await saveToServer('scripts', scripts);
    addLog('Script Submitted', user.username, `New script "${newScript.title}" submitted`);
    // Notify followers
    try {
      fetch('/api/notify/followers', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username: user.username, scriptTitle: newScript.title, scriptId: newScript.id }) }).catch(() => {});
    } catch {}
    return newScript;
  },

  // =================== COMMENTS & RATINGS ===================
  addComment: async (scriptId, text, user) => {
    if (!user) throw new Error('Must be logged in');
    if (!text?.trim()) throw new Error('Comment cannot be empty');
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, scriptId));
    if (idx === -1) throw new Error('Script not found');
    const comment = { id: Date.now(), userId: user.id, username: user.username, text: text.trim(), date: new Date().toISOString().split('T')[0] };
    if (!scripts[idx].comments) scripts[idx].comments = [];
    scripts[idx].comments.push(comment);
    await saveToServer('scripts', scripts);
    return comment;
  },

  rateScript: async (scriptId, rating, user) => {
    if (!user) throw new Error('Must be logged in');
    if (rating < 1 || rating > 5) throw new Error('Rating must be 1-5');
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, scriptId));
    if (idx === -1) throw new Error('Script not found');
    if (matchId(scripts[idx].authorId, user.id)) throw new Error('Cannot rate your own script');
    if (!scripts[idx].ratings) scripts[idx].ratings = [];
    const existing = scripts[idx].ratings.findIndex(r => matchId(r.userId, user.id));
    if (existing >= 0) scripts[idx].ratings[existing].rating = rating;
    else scripts[idx].ratings.push({ userId: user.id, rating });
    await saveToServer('scripts', scripts);
    return scripts[idx];
  },

  likeScript: async (scriptId, user) => {
    if (!user) throw new Error('Must be logged in');
    try {
      const res = await fetch(`/api/scripts/${scriptId}/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Like failed');
      await loadFromServer('scripts');
      return data;
    } catch (e) {
      throw new Error(e.message || 'Cannot like this script');
    }
  },

  deleteComment: async (scriptId, commentId, user) => {
    if (!user) throw new Error('Must be logged in');
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, scriptId));
    if (idx === -1) throw new Error('Script not found');
    const comment = scripts[idx].comments?.find(c => matchId(c.id, commentId));
    if (!comment) throw new Error('Comment not found');
    const canDel = matchId(comment.userId, user.id) || user.role === 'admin' || user.role === 'owner';
    if (!canDel) throw new Error('Unauthorized');
    scripts[idx].comments = scripts[idx].comments.filter(c => !matchId(c.id, commentId));
    await saveToServer('scripts', scripts);
  },

  // =================== ADMIN ===================
  updateScript: async (scriptId, updatedData, adminUser) => {
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'owner')) throw new Error('Unauthorized');
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, scriptId));
    if (idx === -1) throw new Error('Script not found');
    const allowed = ['title', 'game', 'description', 'code', 'status', 'executors', 'gameLink'];
    const safe = {};
    for (const k of allowed) { if (updatedData[k] !== undefined) safe[k] = updatedData[k]; }
    scripts[idx] = { ...scripts[idx], ...safe };
    await saveToServer('scripts', scripts);
    addLog('Script Edited', adminUser.username, `Script "${scripts[idx].title}" (#${scriptId}) edited`);
    return scripts[idx];
  },

  verifyScript: async (scriptId, adminUser) => {
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'owner')) throw new Error('Unauthorized');
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, scriptId));
    if (idx !== -1) {
      scripts[idx].verified = true;
      await saveToServer('scripts', scripts);
      addLog('Script Verified', adminUser.username, `"${scripts[idx].title}" verified`);
      try {
        fetch('/api/notify/script-status', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorId: scripts[idx].authorId, scriptTitle: scripts[idx].title, scriptId: scripts[idx].id, status: 'verified' }) }).catch(() => {});
      } catch {}
    }
  },

  unverifyScript: async (scriptId, adminUser) => {
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'owner')) throw new Error('Unauthorized');
    const scripts = getCollection('scripts');
    const idx = scripts.findIndex(s => matchId(s.id, scriptId));
    if (idx !== -1) {
      scripts[idx].verified = false;
      await saveToServer('scripts', scripts);
      addLog('Script Unverified', adminUser.username, `"${scripts[idx].title}" unverified`);
      try {
        fetch('/api/notify/script-status', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorId: scripts[idx].authorId, scriptTitle: scripts[idx].title, scriptId: scripts[idx].id, status: 'denied' }) }).catch(() => {});
      } catch {}
    }
  },

  deleteScript: async (scriptId, adminUser) => {
    const scripts = getCollection('scripts');
    const script = scripts.find(s => matchId(s.id, scriptId));
    if (script) {
      const filtered = scripts.filter(s => !matchId(s.id, scriptId));
      await saveToServer('scripts', filtered);
      if (adminUser) addLog('Script Deleted', adminUser.username, `"${script.title}" deleted`);
    }
  },

  deleteAllUserScripts: async (adminId, targetUserId) => {
    const res = await fetch('/api/admin/delete-all-scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete scripts');
    await loadFromServer('scripts');
    return data.deletedCount;
  },

  // =================== OWNER ===================
  getAllUsers: async () => {
    await ensureInit();
    return getCollection('users');
  },

  updateUserRole: async (userId, role, actor) => {
    const valid = ['user', 'admin', 'support'];
    if (!valid.includes(role)) throw new Error('Invalid role');
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    if (users[idx].role === 'owner') throw new Error('Cannot change owner role');
    users[idx].role = role;
    await saveToServer('users', users);
    addLog('Role Updated', actor || 'system', `${users[idx].username} → ${role}`);
  },

  warnUser: async (userId, actor, reason) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    users[idx].warnings = (users[idx].warnings || 0) + 1;
    users[idx].warningReasons = users[idx].warningReasons || [];
    users[idx].warningReasons.push({ reason: reason || 'No reason provided', date: new Date().toISOString(), by: actor || 'system', id: Date.now() });
    await saveToServer('users', users);
    addLog('User Warned', actor || 'system', `${users[idx].username} warning #${users[idx].warnings}: ${reason || 'No reason'}`);
  },

  removeWarning: async (userId, actor, warningId) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    if (users[idx].warnings > 0) {
      users[idx].warnings--;
      if (users[idx].warningReasons) {
        if (warningId) {
          users[idx].warningReasons = users[idx].warningReasons.filter(w => w.id !== warningId);
        } else {
          users[idx].warningReasons.pop();
        }
      }
      await saveToServer('users', users);
      addLog('Warning Removed', actor || 'system', `Removed warning from ${users[idx].username}`);
    }
  },

  wipeAllWarnings: async (userId, actor) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    users[idx].warnings = 0;
    users[idx].warningReasons = [];
    await saveToServer('users', users);
    addLog('Warnings Wiped', actor || 'system', `Wiped all warnings from ${users[idx].username}`);
  },

  resetProfilePictures: async (userId, actor) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    users[idx].avatar = '';
    users[idx].banner = '';
    await saveToServer('users', users);
    addLog('Profile Reset', actor || 'system', `Reset avatar and banner for ${users[idx].username}`);
  },

  timeoutUser: async (userId, actor, reason, days = 1) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    if (users[idx].role === 'owner') throw new Error('Cannot timeout owner');
    users[idx].timeoutUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
    users[idx].timeoutReason = reason || 'No reason provided';
    await saveToServer('users', users);
    addLog('User Timeout', actor || 'system', `Timed out ${users[idx].username} for ${days} days. Reason: ${reason}`);
  },

  updateReputation: async (userId, actor, amount, reason) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    users[idx].reputation = (users[idx].reputation || 0) + amount;
    users[idx].repLog = users[idx].repLog || [];
    users[idx].repLog.unshift({ amount, reason, date: new Date().toISOString(), by: actor });
    await saveToServer('users', users);
    addLog('Reputation Updated', actor || 'system', `Changed ${users[idx].username}'s reputation by ${amount}. Reason: ${reason}`);
  },

  banUser: async (userId, actor, reason) => {
    const users = getCollection('users');
    const idx = users.findIndex(u => matchId(u.id, userId));
    if (idx === -1) throw new Error('User not found');
    if (users[idx].role === 'owner') throw new Error('Cannot ban owner');
    users[idx].banned = !users[idx].banned;
    if (users[idx].banned) {
      users[idx].banReason = reason || 'No reason provided';
    } else {
      users[idx].banReason = null;
    }
    await saveToServer('users', users);
    addLog(users[idx].banned ? 'User Banned' : 'User Unbanned', actor || 'system', users[idx].username + (users[idx].banned ? ` (${reason || 'No reason'})` : ''));
  },

  grantBadge: async (adminId, targetUserId, badge) => {
    const res = await fetch('/api/badges/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId, badge })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to grant badge');
    await loadFromServer('users');
    return data;
  },

  revokeBadge: async (adminId, targetUserId, badge) => {
    const res = await fetch('/api/badges/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId, badge })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke badge');
    await loadFromServer('users');
    return data;
  },

  // =================== LOGGING ===================
  getLogs: async () => { await ensureInit(); return getCollection('logs'); },

  // =================== STATS ===================
  getStats: async () => {
    const users = getCollection('users');
    const scripts = getCollection('scripts');
    const logs = getCollection('logs');
    let online = 0, totalVisitors = 0;
    try { const r = await fetch('/api/stats'); const d = await r.json(); online = d.onlineUsers || 0; totalVisitors = d.totalVisitors || 0; } catch {}
    return {
      totalUsers: users.length,
      totalScripts: scripts.length,
      verifiedScripts: scripts.filter(s => s.verified).length,
      pendingScripts: scripts.filter(s => !s.verified).length,
      totalViews: scripts.reduce((s, sc) => s + (sc.views || 0), 0),
      totalLikes: scripts.reduce((s, sc) => s + (sc.likes || 0), 0),
      totalLogs: logs.length,
      bannedUsers: users.filter(u => u.banned).length,
      adminCount: users.filter(u => u.role === 'admin').length,
      onlineUsers: online,
      totalVisitors
    };
  },

  getPublicStats: async () => {
    try {
      const r = await fetch('/api/stats');
      if (r.ok) return await r.json();
    } catch {}
    const scripts = getCollection('scripts');
    return {
      totalScripts: scripts.length,
      verifiedScripts: scripts.filter(s => s.verified).length,
      totalViews: scripts.reduce((s, sc) => s + (sc.views || 0), 0),
      totalLikes: scripts.reduce((s, sc) => s + (sc.likes || 0), 0),
      onlineUsers: 1
    };
  },

  heartbeat: async (uid) => {
    try {
      const r = await fetch('/api/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid }) });
      if (r.ok) { const d = await r.json(); return d.online; }
    } catch {} return 0;
  },

  updateProfileAvatar: async (userId, avatarBase64) => {
    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, avatar: avatarBase64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Avatar update failed');
    await loadFromServer('users');
    return data;
  },

  updateProfileBio: async (userId, bio) => {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, bio })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Bio update failed');
    await loadFromServer('users');
    return data;
  },

  updateProfileBanner: async (userId, bannerBase64) => {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, banner: bannerBase64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Banner update failed');
    await loadFromServer('users');
    return data;
  },

  getMaintenance: async () => {
    const res = await fetch('/api/admin/maintenance');
    return await res.json();
  },

  updateMaintenance: async (adminId, settings) => {
    const res = await fetch('/api/admin/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...settings })
    });
    return await res.json();
  },

  purgeAssets: async (adminId, type) => {
    const res = await fetch('/api/admin/purge-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, type })
    });
    const data = await res.json();
    await loadFromServer('users');
    return data;
  },

  // =================== KEY SYSTEM ===================
  getApps: async (ownerId) => {
    const res = await fetch('/api/apps', {
      headers: { 'x-user-id': ownerId }
    });
    if (!res.ok) throw new Error('Failed to fetch apps');
    return await res.json();
  },

  createApp: async (ownerId, name) => {
    const res = await fetch('/api/apps/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create app');
    addLog('App Created', 'owner', `Created new app: ${name}`);
    return data;
  },

  rotateAppSecret: async (ownerId, appId) => {
    const res = await fetch('/api/apps/rotate-secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, appId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to rotate secret');
    addLog('App Secret Rotated', 'owner', `Rotated secret for app #${appId}`);
    return data;
  },

  deleteApp: async (ownerId, appId) => {
    const res = await fetch('/api/apps/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, appId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete app');
    addLog('App Deleted', 'owner', `Deleted app #${appId}`);
    return data;
  },

  getKeys: async (ownerId) => {
    const res = await fetch('/api/keys', {
      headers: { 'x-user-id': ownerId }
    });
    if (!res.ok) throw new Error('Failed to fetch keys');
    return await res.json();
  },

  createKey: async (ownerId, appId, note, expiresAt, duration, count, level, isOneTime) => {
    const res = await fetch('/api/keys/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, appId, note, expiresAt, duration, count, level, isOneTime })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create keys');
    addLog('Keys Generated', 'owner', `Generated ${data.count} keys (${level}) for app #${appId}`);
    return data;
  },

  resetKeyHWID: async (ownerId, key) => {
    const res = await fetch('/api/keys/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, key })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset HWID');
    addLog('Key HWID Reset', 'owner', `Reset HWID for key ${key}`);
    return data;
  },

  revokeKey: async (ownerId, key, status) => {
    const res = await fetch('/api/keys/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, key, status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update key status');
    addLog('Key Status Updated', 'owner', `Updated status for key ${key} to ${status}`);
    return data;
  },

  deleteKey: async (ownerId, key) => {
    const res = await fetch('/api/keys/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, key })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete key');
    addLog('Key Deleted', 'owner', `Deleted key ${key}`);
    return data;
  }
};
