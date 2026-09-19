/**
 * Simplified byline helpers.
 *
 * Site-owned posts show "Published by PromptSoul Editorial Team".
 * User-submitted posts show "Submitted by @username" linking to /user/[id].
 */

export const EDITORIAL_TEAM_ID = 'editorial-team';
export const EDITORIAL_TEAM_NAME = 'PromptSoul Editorial Team';

/** True if the post was submitted by a real user (not an editorial post). */
export function isUserOwnedPost(authorId?: string | null): boolean {
  if (!authorId) return false;
  return authorId !== EDITORIAL_TEAM_ID;
}
