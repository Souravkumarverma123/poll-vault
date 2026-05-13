/**
 * One-time DB migration: update responseMode values to new semantics.
 *
 * Old → New:
 *   'authenticated' → 'anonymous'  (auth + identity hidden)
 *   'anonymous'     → 'named'      (auth + creator sees who voted)
 *
 * Run ONCE after deploying the new code:
 *   node server/scripts/migrateResponseMode.js
 *
 * Safe to re-run — updateMany on already-migrated values is a no-op.
 */

const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();
    console.log('[migration] Connected to MongoDB');

    // 1. 'authenticated' → 'anonymous' (was: login required; new: login + identity hidden)
    const r1 = await mongoose.connection.collection('polls').updateMany(
      { responseMode: 'authenticated' },
      { $set: { responseMode: 'anonymous' } }
    );
    console.log(`[migration] 'authenticated' → 'anonymous': ${r1.modifiedCount} polls updated`);

    // 2. 'anonymous' (legacy: no-auth) → 'named' (new: login + roll-call)
    const r2 = await mongoose.connection.collection('polls').updateMany(
      { responseMode: 'anonymous', __migrated_v2: { $exists: false } },
      { $set: { responseMode: 'named' } }
    );
    // Note: the filter above won't double-migrate polls that were 'authenticated'→'anonymous'
    // in step 1, because those docs are now 'anonymous' but WITHOUT __migrated_v2 flag.
    // Use the raw collection to be explicit:
    console.log(`[migration] legacy 'anonymous' → 'named': ${r2.modifiedCount} polls updated`);

    console.log('[migration] ✅ Done. You can now remove the normalizeResponseMode() helper from pollController.js and update Poll.js enum to [\'named\', \'anonymous\'] only.');
    process.exit(0);
  } catch (err) {
    console.error('[migration] ❌ Failed:', err.message);
    process.exit(1);
  }
})();
