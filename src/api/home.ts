import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { mockIssues, mockPolls } from '@/data/mock';
import { Issue, Poll } from '@/types/domain';

export type HomeResponse = { issues: Issue[]; polls: Poll[] };

type IssuesResponse = { issues?: Issue[] };
type PollsResponse = { polls?: Poll[] };

export async function fetchHome(token: string | null): Promise<HomeResponse> {
  const [issuesResult, pollsResult] = await Promise.allSettled([
    apiGet<IssuesResponse>('/api/issues', { token }),
    apiGet<PollsResponse>('/api/polls?sort=hot', { token }),
  ]);
  return {
    issues: issuesResult.status === 'fulfilled' ? issuesResult.value.issues ?? [] : [],
    polls: pollsResult.status === 'fulfilled' ? pollsResult.value.polls ?? [] : [],
  };
}

export function useHome(token: string | null) {
  return useQuery({ queryKey: ['home', token ?? 'anonymous'], queryFn: () => fetchHome(token), retry: 1 });
}
