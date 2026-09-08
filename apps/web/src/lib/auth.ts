import { makeUser, type User } from '../test/fixtures';

// Stub until Task 6 swaps the internals for a real useQuery on GET /user/me —
// callers only destructure { data, isLoading }, so nothing else changes.
const fixtureUser = makeUser();

export function useMe(): { data: User; isLoading: boolean } {
	return { data: fixtureUser, isLoading: false };
}
