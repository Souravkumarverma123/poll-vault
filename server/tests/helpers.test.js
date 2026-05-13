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
    // Helper mirrors the implementation: ip::ua::token (token defaults to '')
    const makeHash = (ip, ua, token = '') =>
      crypto.createHash('sha256').update(`${ip}::${ua}::${token}`).digest('hex');

    it('generates a consistent sha256 hash for the same IP and UA (no token)', () => {
      const req = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
      };
      expect(generateFingerprint(req)).toBe(makeHash('192.168.1.1', 'Mozilla/5.0'));
    });

    it('falls back to connection.remoteAddress if ip is undefined', () => {
      const req = {
        connection: { remoteAddress: '10.0.0.1' },
        headers: { 'user-agent': 'Safari' },
      };
      expect(generateFingerprint(req)).toBe(makeHash('10.0.0.1', 'Safari'));
    });

    it('uses "unknown" if ip/remoteAddress and user-agent are missing', () => {
      const req = { headers: {} };
      expect(generateFingerprint(req)).toBe(makeHash('unknown', 'unknown'));
    });

    it('produces a different hash when a clientToken is supplied', () => {
      const req = { ip: '1.2.3.4', headers: { 'user-agent': 'Chrome' } };
      const withoutToken = generateFingerprint(req);
      const withToken    = generateFingerprint(req, 'my-uuid-token');
      expect(withToken).not.toBe(withoutToken);
      expect(withToken).toBe(makeHash('1.2.3.4', 'Chrome', 'my-uuid-token'));
    });

    it('clamps clientToken to 64 characters before hashing', () => {
      const req = { ip: '1.2.3.4', headers: { 'user-agent': 'Chrome' } };
      const longToken  = 'a'.repeat(200);
      const shortToken = 'a'.repeat(64);
      expect(generateFingerprint(req, longToken)).toBe(
        generateFingerprint(req, shortToken)
      );
    });
  });
});
