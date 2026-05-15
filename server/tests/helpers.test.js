import { computeStatus } from '../utils/helpers.js';

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
});
