import { API_BASE_URL, apiPost } from '@/api/client';

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

export class StreamingUnsupportedError extends Error {
  constructor() {
    super('Streaming is not available in this runtime.');
    this.name = 'StreamingUnsupportedError';
  }
}

function authHeaders(token: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : null),
  };
}

function parseSseEvent(raw: string) {
  const lines = raw.split('\n');
  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s?/, '').trim());
  return dataLines.join('\n');
}

export async function streamDebateTurn(
  token: string | null,
  payload: DebatePayload,
  onToken: (token: string) => void,
) {
  const res = await fetch(API_BASE_URL + '/api/arena/debate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = '토론을 이어가지 못했어요.';
    try {
      const data = text ? JSON.parse(text) : null;
      message = data?.message ?? data?.error ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  const body = res.body as unknown as { getReader?: () => any } | null;
  if (!body?.getReader || typeof TextDecoder === 'undefined') {
    throw new StreamingUnsupportedError();
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const isErrorEvent = event
        .split('\n')
        .some((line) => line.trim() === 'event: error');
      const data = parseSseEvent(event);
      if (!data || data === '[DONE]') continue;
      let parsed: { message?: string; text?: string } | null = null;
      try {
        parsed = JSON.parse(data);
      } catch {
        if (isErrorEvent) throw new Error('토론을 이어가지 못했어요.');
        fullText += data;
        onToken(data);
        continue;
      }

      if (isErrorEvent) {
        throw new Error(parsed?.message ?? '토론을 이어가지 못했어요.');
      }

      const chunk = typeof parsed?.text === 'string' ? parsed.text : '';
      if (chunk) {
        fullText += chunk;
        onToken(chunk);
      }
    }
  }

  return fullText.trim();
}

export function judgeDebate(token: string | null, payload: { issueTitle: string; issueBody?: string | null; history: DebateMessage[] }) {
  return apiPost<DebateResult>('/api/arena/judge', payload, { token });
}

export function saveBattleLog(token: string | null, payload: { topic: string; messages: DebateMessage[]; winner: DebateResult['winner']; userStance: 'progressive' | 'conservative' | 'watch' }) {
  return apiPost('/api/arena/battle-log', payload, { token });
}
