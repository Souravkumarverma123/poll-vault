const crypto = require('crypto');

/**
 * Helper: server-side fingerprint (IP + UA hash)
 * Used to prevent duplicate anonymous poll submissions.
 */
/**
 * Server-side fingerprint combining IP, User-Agent, and an optional
 * client-generated persistent token (UUID stored in localStorage).
 *
 * The clientToken is NOT trusted for security — it is used only to
 * improve deduplication accuracy for anonymous respondents who share
 * the same IP/UA (e.g., home network, corporate proxy).
 *
 * @param {import('express').Request} req
 * @param {string} [clientToken=''] - UUID from respondent's localStorage
 */
const generateFingerprint = (req, clientToken = '') => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const ua = req.headers?.['user-agent'] || 'unknown';
  const token = typeof clientToken === 'string' ? clientToken.slice(0, 64) : '';
  return crypto.createHash('sha256').update(`${ip}::${ua}::${token}`).digest('hex');
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
