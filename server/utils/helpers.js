/**
 * Pure helper: compute poll status from raw document fields.
 * @param {{ isPublished: boolean, isClosed: boolean, expiresAt: Date | string }} poll
 * @returns {'published' | 'closed' | 'active'}
 */
export const computeStatus = (poll) => {
  if (poll.isPublished) return 'published';
  if (poll.isClosed || new Date(poll.expiresAt) <= new Date()) return 'closed';
  return 'active';
};
