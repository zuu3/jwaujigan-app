import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/client';
import type { Poll, PollDetail } from '@/types/domain';

export function usePolls(sort: 'hot' | 'latest', token: string | null) {
  return useQuery({
    queryKey: ['polls', sort, token ? 'authenticated' : 'anonymous'],
    queryFn: async () => {
      const res = await apiGet<{ polls: Poll[] }>(`/api/polls?sort=${sort}`, { token });
      return res.polls;
    },
    enabled: Boolean(token),
  });
}

export function usePoll(pollId: string, token: string | null) {
  return useQuery({
    queryKey: ['poll', pollId, token ? 'authenticated' : 'anonymous'],
    queryFn: async () => {
      const response = await apiGet<{ poll: PollDetail }>('/api/polls/' + pollId, { token });
      return response.poll;
    },
    enabled: Boolean(pollId && token),
  });
}

export function useVotePoll(pollId: string, token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionId: string) => apiPost('/api/polls/' + pollId + '/vote', { option_id: optionId }, { token }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['poll', pollId] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ]);
    },
  });
}
