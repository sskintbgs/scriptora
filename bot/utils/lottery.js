import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOTTERY_PATH = path.join(__dirname, '..', 'lottery.json');

function getPool() {
  if (!existsSync(LOTTERY_PATH)) writeFileSync(LOTTERY_PATH, JSON.stringify({ tickets: [], nextDraw: Date.now() + 86400000 }));
  try { return JSON.parse(readFileSync(LOTTERY_PATH, 'utf8')); } catch { return { tickets: [], nextDraw: Date.now() + 86400000 }; }
}

function savePool(data) { writeFileSync(LOTTERY_PATH, JSON.stringify(data, null, 2)); }

export { getPool, savePool, LOTTERY_PATH };
