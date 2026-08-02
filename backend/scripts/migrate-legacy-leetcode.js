/**
 * Migration: move LeetCode data from the legacy `leetcodestats_legacy`
 * collection into the canonical `leetcodestats` collection (LeetcodeStats).
 *
 * Run:  node scripts/migrate-legacy-leetcode.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    const legacy = db.collection('leetcodestats_legacy');
    const target = db.collection('leetcodestats');

    const docs = await legacy.find({}).toArray();
    let migrated = 0;
    let skipped = 0;

    for (const doc of docs) {
      if (!doc.user) {
        skipped += 1;
        continue;
      }
      const raw = doc.rawProfile || {};
      await target.updateOne(
        { userId: doc.user },
        {
          $set: {
            userId: doc.user,
            username: raw.username || 'legacy',
            totalSolved: doc.totalSolved || 0,
            easySolved: doc.easySolved || 0,
            mediumSolved: doc.mediumSolved || 0,
            hardSolved: doc.hardSolved || 0,
            acceptanceRate: doc.acceptanceRate ?? null,
            ranking: doc.ranking ?? null,
            contestRating: raw.contestRating || 0,
            contestHistory: Array.isArray(raw.contestHistory) ? raw.contestHistory : [],
            recentSubmissions: Array.isArray(raw.recentSubmissions) ? raw.recentSubmissions : [],
            badges: raw.badges ?? null,
            languageStats: raw.languageStats ?? null,
            lastSynced: doc.lastSyncedAt || new Date(),
          },
        },
        { upsert: true }
      );
      migrated += 1;
    }

    console.log(`Migration complete. Migrated: ${migrated}; skipped (no userId): ${skipped}.`);
    console.log('Optionally drop the legacy collection after verifying: db.leetcodestats_legacy.drop()');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
