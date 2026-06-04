import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';

export type ElectionType =
  | 'governor' | 'mayor' | 'provincial' | 'provincialPr'
  | 'local' | 'localPr' | 'superintendent';

export const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  governor: '시·도지사',
  mayor: '시장·군수·구청장',
  provincial: '시·도의원 (지역구)',
  provincialPr: '시·도의원 (비례)',
  local: '구·시·군의원 (지역구)',
  localPr: '구·시·군의원 (비례)',
  superintendent: '교육감',
};

export type ElectionPerson = {
  huboid: string;
  giho: string;
  electionType: ElectionType;
  name: string;
  jdName: string;
  job: string;
  career1: string;
  career2: string;
  dugyul?: string;
  status?: string;
  photoUrl: string | null;
  wiwName: string;
};

export type LocalElectionResponse = {
  district: string;
  wiwNames: string[];
  winners: Partial<Record<ElectionType, ElectionPerson[]>>;
  candidates: Partial<Record<ElectionType, ElectionPerson[]>>;
};

export function useLocalElection(token: string | null) {
  return useQuery({
    queryKey: ['local-election', token ? 'authenticated' : 'anonymous'],
    queryFn: () => apiGet<LocalElectionResponse>('/api/local-election', { token }),
    enabled: Boolean(token),
  });
}
