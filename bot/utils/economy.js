import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECO_PATH = path.join(__dirname, '..', 'economy.json');

function getEconomy() {
  if (!existsSync(ECO_PATH)) return {};
  try { return JSON.parse(readFileSync(ECO_PATH, 'utf8')); } catch { return {}; }
}

function saveEconomy(data) {
  writeFileSync(ECO_PATH, JSON.stringify(data, null, 2));
}

export function getBalance(userId) {
  const eco = getEconomy();
  if (!eco[userId]) eco[userId] = { balance: 0, bank: 0, lastDaily: null, lastWork: null, totalEarned: 0 };
  return eco[userId];
}

export function setBalance(userId, data) {
  const eco = getEconomy();
  eco[userId] = { ...getBalance(userId), ...data };
  saveEconomy(eco);
  return eco[userId];
}

export function addMoney(userId, amount) {
  const user = getBalance(userId);
  user.balance += amount;
  user.totalEarned += amount;
  setBalance(userId, user);
  return user;
}

export function removeMoney(userId, amount) {
  const user = getBalance(userId);
  user.balance = Math.max(0, user.balance - amount);
  setBalance(userId, user);
  return user;
}

export function transferMoney(fromId, toId, amount) {
  const from = getBalance(fromId);
  const to = getBalance(toId);
  if (from.balance < amount) return null;
  from.balance -= amount;
  to.balance += amount;
  to.totalEarned += amount;
  setBalance(fromId, from);
  setBalance(toId, to);
  return { from, to };
}

export function depositToBank(userId, amount) {
  const user = getBalance(userId);
  if (user.balance < amount) return null;
  user.balance -= amount;
  user.bank += amount;
  setBalance(userId, user);
  return user;
}

export function withdrawFromBank(userId, amount) {
  const user = getBalance(userId);
  if (user.bank < amount) return null;
  user.bank -= amount;
  user.balance += amount;
  setBalance(userId, user);
  return user;
}

export function getLeaderboard(limit = 10) {
  const eco = getEconomy();
  return Object.entries(eco)
    .map(([id, data]) => ({ id, total: (data.balance || 0) + (data.bank || 0), ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function canClaim(userId, type) {
  const user = getBalance(userId);
  const now = Date.now();
  const cooldowns = { daily: 86400000, work: 3600000 }; // 24h, 1h
  const lastKey = type === 'daily' ? 'lastDaily' : 'lastWork';
  if (!user[lastKey]) return true;
  return now - user[lastKey] >= cooldowns[type];
}

export function setClaimed(userId, type) {
  const user = getBalance(userId);
  const lastKey = type === 'daily' ? 'lastDaily' : 'lastWork';
  user[lastKey] = Date.now();
  setBalance(userId, user);
}

export function getTimeUntilClaim(userId, type) {
  const user = getBalance(userId);
  const cooldowns = { daily: 86400000, work: 3600000 };
  const lastKey = type === 'daily' ? 'lastDaily' : 'lastWork';
  if (!user[lastKey]) return 0;
  const remaining = cooldowns[type] - (Date.now() - user[lastKey]);
  return Math.max(0, remaining);
}
