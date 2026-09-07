/**
 * This is jwt payload interface, to allow certain fields onto jwt
 */
export interface Payload {
	email: string;
	userId: number;
	/** issued-at, decoded automatically by passport-jwt */
	iat?: number;
}
