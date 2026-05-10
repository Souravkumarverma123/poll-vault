const { computeStatus, generateFingerprint } = require('../utils/helpers');
const crypto = require('crypto');

describe('Helper Utilities', () => {
  describe('computeStatus', () => {
    it('returns "published" if isPublished is true, ignoring other fields', () => {
      const poll = { isPublished: true, isClosed: false, expiresAt: new Date(Date.now() + 10000) };
      expect(computeStatus(poll)).toBe('published');
    });

    it('returns "closed" if isClosed is true and isPublished is false', () => {
      const poll = { isPublished: false, isClosed: true, expiresAt: new Date(Date.now() + 10000) };
      expect(computeStatus(poll)).toBe('closed');
    });

    it('returns "closed" if expiresAt is in the past, even if isClosed is false', () => {
      const pastDate = new Date(Date.now() - 10000);
      const poll = { isPublished: false, isClosed: false, expiresAt: pastDate };
      expect(computeStatus(poll)).toBe('closed');
    });

    it('returns "active" if not published, not closed, and expires in the future', () => {
      const futureDate = new Date(Date.now() + 10000);
      const poll = { isPublished: false, isClosed: false, expiresAt: futureDate };
      expect(computeStatus(poll)).toBe('active');
    });
  });

  describe('generateFingerprint', () => {
    it('generates a consistent sha256 hash for the same IP and UA', () => {
      const req = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
      };
      const expectedHash = crypto.createHash('sha256').update('192.168.1.1::Mozilla/5.0').digest('hex');
      expect(generateFingerprint(req)).toBe(expectedHash);
    });

    it('falls back to connection.remoteAddress if ip is undefined', () => {
      const req = {
        connection: { remoteAddress: '10.0.0.1' },
        headers: { 'user-agent': 'Safari' },
      };
      const expectedHash = crypto.createHash('sha256').update('10.0.0.1::Safari').digest('hex');
      expect(generateFingerprint(req)).toBe(expectedHash);
    });

    it('uses "unknown" if ip/remoteAddress and user-agent are missing', () => {
      const req = { headers: {} };
      const expectedHash = crypto.createHash('sha256').update('unknown::unknown').digest('hex');
      expect(generateFingerprint(req)).toBe(expectedHash);
    });
  });
});
