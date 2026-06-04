import { apiPost } from '@/api/client';

export type DebateMessage = { role: 'progressive' | 'conservative' | 'user'; content: string };
export type DebateResult = { winner: 'progressive' | 'conservative' | 'draw'; reason: string };

export type DebatePayload = {
  issueId: string;
  issueTitle: string;
  issueBody?: string | null;
  progressiveContext?: string;
  conservativeContext?: string;
  speakerStance: 'progressive' | 'conservative';
  round: number;
  history: DebateMessage[];
};

export function requestDebateTurn(token: string | null, payload: DebatePayload) {
  return apiPost<{ text: string }>('/api/arena/debate', { ...payload, responseMode: 'json' }, { token });
}

export function judgeDebate(token: string | null, payload: { issueTitle: string; issueBody?: string | null; history: DebateMessage[] }) {
  return apiPost<DebateResult>('/api/arena/judge', payload, { token });
}

export function saveBattleLog(token: string | null, payload: { topic: string; messages: DebateMessage[]; winner: DebateResult['winner']; userStance: 'progressive' | 'conservative' | 'watch' }) {
  return apiPost('/api/arena/battle-log', payload, { token });
}
