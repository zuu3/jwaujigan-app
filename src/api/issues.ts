import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/client';
import { Issue, IssueVoteStance } from '@/types/domain';

export function useIssue(issueId: string, token: string | null) {
  return useQuery({
    queryKey: ['issue', issueId, token ? 'authenticated' : 'anonymous'],
    queryFn: async () => {
      const response = await apiGet<{ issue: Issue }>('/api/issues/' + issueId, { token });
      return response.issue;
    },
    enabled: Boolean(issueId && token),
  });
}

export function useVoteIssue(issueId: string, token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stance: IssueVoteStance) => apiPost('/api/issues/' + issueId + '/vote', { stance }, { token }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ]);
    },
  });
}
