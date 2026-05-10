const crypto = require('crypto');

/**
 * Helper: server-side fingerprint (IP + UA hash)
 * Used to prevent duplicate anonymous poll submissions.
 */
const generateFingerprint = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const ua = req.headers?.['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex');
};

/**
 * Pure helper: compute poll status from raw document fields.
 * Mirrors the logic in Poll.methods.getStatus().
 * @param {{ isPublished: boolean, isClosed: boolean, expiresAt: Date | string }} poll
 * @returns {'published' | 'closed' | 'active'}
 */
const computeStatus = (poll) => {
  if (poll.isPublished) return 'published';
  if (poll.isClosed || new Date(poll.expiresAt) <= new Date()) return 'closed';
  return 'active';
};

module.exports = {
  generateFingerprint,
  computeStatus,
};
