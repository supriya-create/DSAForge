/**
 * Migration: unify LeetCode username fields.
 *
 * Before: the canonical value could live in either `leetcode` or
 * `leetcodeUsername`. This copies `leetcode` -> `leetcodeUsername` when the
 * latter is empty, then removes the now-redundant `leetcode` field from each
 * document so there is a single source of truth.
 *
 * Run:  node scripts/migrate-unify-username.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    const users = await db.collection('users').find({}).toArray();
    let updated = 0;
    let removed = 0;

    for (const u of users) {
      const hasLegacy = u.leetcode && typeof u.leetcode === 'string';
      const hasCanonical = u.leetcodeUsername && typeof u.leetcodeUsername === 'string';

      if (hasLegacy && !hasCanonical) {
        await db.collection('users').updateOne(
          { _id: u._id },
          { $set: { leetcodeUsername: u.leetcode.trim().toLowerCase() }, $unset: { leetcode: '' } }
        );
        updated += 1;
      } else if (hasLegacy) {
        // Both set — keep canonical, drop legacy.
        await db.collection('users').updateOne(
          { _id: u._id },
          { $unset: { leetcode: '' } }
        );
        removed += 1;
      }
    }

    console.log(`Migration complete. Copied legacy->canonical: ${updated}; dropped redundant field: ${removed}.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
