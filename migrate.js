import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, User, Script, Ticket, Notification, Log, Transcript, Visitor } from './src/db.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  await connectDB();
  console.log('Starting migration from JSON to MongoDB...');

  const DB_DIR = path.join(__dirname, 'data');
  const collections = [
    { name: 'users', model: User, file: 'users.json' },
    { name: 'scripts', model: Script, file: 'scripts.json' },
    { name: 'tickets', model: Ticket, file: 'tickets.json' },
    { name: 'notifications', model: Notification, file: 'notifications.json' },
    { name: 'logs', model: Log, file: 'logs.json' },
    { name: 'transcripts', model: Transcript, file: 'transcripts.json' }
  ];

  for (const col of collections) {
    const filePath = path.join(DB_DIR, col.file);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.length > 0) {
          await col.model.deleteMany({});
          // Ensure IDs are strings
          const safeData = data.map(item => ({ ...item, id: String(item.id) }));
          await col.model.insertMany(safeData);
          console.log(`✅ Migrated ${data.length} records to ${col.name}`);
        } else {
          console.log(`⏭️  Skipped ${col.name} (empty file)`);
        }
      } catch (err) {
        console.error(`❌ Error migrating ${col.name}:`, err.message);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }

  // Migrate visitors
  try {
    const vPath = path.join(DB_DIR, 'visitors.json');
    if (fs.existsSync(vPath)) {
      const vData = JSON.parse(fs.readFileSync(vPath, 'utf8'));
      await Visitor.deleteMany({});
      await Visitor.create({ id: 'visitor_count', count: vData.count || 0 });
      console.log(`✅ Migrated visitors: ${vData.count}`);
    }
  } catch (err) {
    console.error('❌ Error migrating visitors:', err.message);
  }

  console.log('Migration complete. You can press Ctrl+C to exit.');
  process.exit(0);
}

migrate();
