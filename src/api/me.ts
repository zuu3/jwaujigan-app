import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { UserProfile } from '@/types/domain';

export function useMe(token: string | null) {
  return useQuery({
    queryKey: ['me', token ? 'authenticated' : 'anonymous'],
    queryFn: () => apiGet<UserProfile>('/api/user/profile', { token }),
    enabled: Boolean(token),
  });
}
