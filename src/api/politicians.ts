import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';

export type LocalPolitician = {
  id: string;
  name: string;
  party: string;
  district: string;
  committee: string | null;
  reelection: string | null;
  office: string | null;
  image: string | null;
};

type LocalPoliticiansResponse = {
  district: string | null;
  politicians: LocalPolitician[];
};

export function useLocalPoliticians(token: string | null) {
  return useQuery({
    queryKey: ['local-politicians', token ? 'authenticated' : 'anonymous'],
    queryFn: () => apiGet<LocalPoliticiansResponse>('/api/politicians/local', { token }),
    enabled: Boolean(token),
  });
}
