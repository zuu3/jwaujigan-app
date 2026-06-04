import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/client';

export type PoliticianDetail = {
  id: string;
  name: string;
  party: string;
  district: string;
  committee: string | null;
  reelection: string | null;
  office: string | null;
  image: string | null;
  biography: string | null;
  phone: string | null;
  email: string | null;
  homepage: string | null;
  assistants: string | null;
  gender: string | null;
  birthDate: string | null;
};

export function usePoliticianDetail(id: string, token: string | null) {
  return useQuery({
    queryKey: ['politician', id, token ? 'authenticated' : 'anonymous'],
    queryFn: () => apiGet<PoliticianDetail>('/api/politicians/' + id, { token }),
    enabled: Boolean(id && token),
  });
}

export function useFollowPolitician(id: string, token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ following: boolean }>('/api/politicians/' + id + '/follow', {}, { token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me-follows'] });
    },
  });
}

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
