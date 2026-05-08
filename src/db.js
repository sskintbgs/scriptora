import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI is not defined in .env! Cannot connect to database.');
      return;
    }
    console.log('📡 Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Stop trying after 5 seconds
    });
    console.log('✅ MongoDB Connected successfully.');
  } catch (error) {
    console.error('*****************************************');
    console.error('❌ DATABASE CONNECTION ERROR!');
    console.error('Reason:', error.message);
    console.error('*****************************************');
    process.exit(1);
  }
};

// --- SCHEMAS ---

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Keeping their string/number IDs for compatibility
  username: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  role: { type: String, default: 'user' },
  warnings: { type: Number, default: 0 },
  banned: { type: Boolean, default: false },
  createdAt: { type: String },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  badges: { type: Array, default: [] },
  following: { type: Array, default: [] },
  followers: { type: Array, default: [] },
  repLog: { type: Array, default: [] },
  reputation: { type: Number, default: 0 }
}, { strict: false }); // strict: false allows dynamic fields from their old JSON

const scriptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  authorId: { type: String },
  author: { type: String },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  likedBy: { type: Array, default: [] },
  date: { type: String }
}, { strict: false });

const ticketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  username: { type: String },
  subject: { type: String },
  category: { type: String },
  priority: { type: String },
  status: { type: String },
  messages: { type: Array, default: [] },
  createdAt: { type: String },
  updatedAt: { type: String }
}, { strict: false });

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  type: { type: String },
  read: { type: Boolean, default: false },
  date: { type: String }
}, { strict: false });

const logSchema = new mongoose.Schema({
  id: { type: String },
  action: { type: String },
  date: { type: String }
}, { strict: false });

const transcriptSchema = new mongoose.Schema({
  ticketId: { type: String },
  createdAt: { type: String }
}, { strict: false });

const visitorSchema = new mongoose.Schema({
  id: { type: String, default: 'visitor_count' },
  count: { type: Number, default: 0 }
});

const maintenanceSchema = new mongoose.Schema({
  id: { type: String, default: 'global' },
  maintenanceMode: { type: Boolean, default: false },
  assetUploadsBlocked: { type: Boolean, default: false }
});

const User = mongoose.model('users', userSchema);
const Script = mongoose.model('scripts', scriptSchema);
const Ticket = mongoose.model('tickets', ticketSchema);
const Notification = mongoose.model('notifications', notificationSchema);
const Log = mongoose.model('logs', logSchema);
const Transcript = mongoose.model('transcripts', transcriptSchema);
const Visitor = mongoose.model('visitors', visitorSchema);
const Maintenance = mongoose.model('maintenance', maintenanceSchema);

export { connectDB, User, Script, Ticket, Notification, Log, Transcript, Visitor, Maintenance };
