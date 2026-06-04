import { apiPost } from '@/api/client';

export function saveDistrict(token: string | null, district: string) {
  return apiPost<{ district: string }>('/api/district', { district }, { token });
}

export type PoliticalProfileResult = {
  political_type: string;
  economic_score: number;
  security_score: number;
  social_score: number;
};

export function savePoliticalProfile(token: string | null, answers: Record<string, number>) {
  return apiPost<PoliticalProfileResult>('/api/political-profile', { answers }, { token });
}
