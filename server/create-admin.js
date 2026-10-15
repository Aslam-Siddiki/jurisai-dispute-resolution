/**
 * create-admin.js — One-time script to seed the first admin user.
 *
 * Usage:
 *   cd server
 *   node create-admin.js
 *   node create-admin.js admin@jurisai.com MyStr0ngPass!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurisai';

const email    = process.argv[2] || 'admin@jurisai.com';
const password = process.argv[3] || 'Admin@12345';
const name     = process.argv[4] || 'System Administrator';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('[DB] Connected to', MONGODB_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`[OK] Upgraded existing user "${existing.name}" to admin.`);
    } else {
      console.log(`[SKIP] Admin account already exists: ${email}`);
    }
    await mongoose.disconnect();
    return;
  }

  const admin = new User({ name, email: email.toLowerCase(), password, role: 'admin' });
  await admin.save();
  console.log(`\n✅  Admin account created successfully!`);
  console.log(`    Email    : ${email}`);
  console.log(`    Password : ${password}`);
  console.log(`    Role     : admin\n`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
