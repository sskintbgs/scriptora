import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

export function getConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function saveConfig(data) {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

export function updateConfig(updates) {
  const cfg = getConfig();
  const merged = deepMerge(cfg, updates);
  saveConfig(merged);
  return merged;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
