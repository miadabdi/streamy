import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { workerApiBase } from '../lib/env';
import type { Readiness } from '../types/api';

/** Worker readiness (queue, storage, dead letters, encoder, active job),
 *  polled every 30 s through the /worker-api proxy. */
export function useOpsHealth() {
	return useQuery({
		queryKey: ['opsHealth'],
		queryFn: () => api.get<Readiness>(`${workerApiBase()}/api/v1/health/readiness`),
		refetchInterval: 30_000,
	});
}
