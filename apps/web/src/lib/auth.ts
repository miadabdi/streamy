import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Me } from '../types/api';
import { ApiError, api } from './api';

async function fetchMe(): Promise<Me | null> {
	try {
		return await api.get<Me>('/api/v1/user/me');
	} catch (error) {
		// 401 = anonymous, the probe's own anonymous state (other 401s flip [me]
		// in api.ts); anything else is a real failure and should surface.
		if (error instanceof ApiError && error.status === 401) return null;
		throw error;
	}
}

export function useMe() {
	return useQuery({ queryKey: ['me'], queryFn: fetchMe });
}

/**
 * The channel the viewer acts as (engagement DTOs are channel-addressed:
 * likerChannelId, watcherChannelId, comment ownerId, followerId).
 */
export function myChannelId(me: Me): number | undefined {
	return me.currentChannelId ?? me.channels[0]?.id;
}

export function useSignIn() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { email: string; password: string }) =>
			api.post<void>('/api/v1/auth/signin', input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
	});
}

export type SignUpInput = {
	email: string;
	password: string;
	channel: { username: string; name: string; description: string };
};

export function useSignUp() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SignUpInput) => api.post<Me>('/api/v1/auth/signup', input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
	});
}

export function useSignOut() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => api.post<void>('/api/v1/auth/signout'),
		onSuccess: () => queryClient.clear(),
	});
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: (input: { email: string }) =>
			api.post<{ message: string }>('/api/v1/auth/forgot-password', input),
	});
}

export function useResetPassword() {
	return useMutation({
		mutationFn: (input: { email: string; password: string; token: string }) =>
			api.post<{ message: string }>('/api/v1/auth/reset-password', input),
	});
}
