import { Issue, Poll } from '@/types/domain';
export const mockIssues: Issue[] = [
  { id: 'issue-1', title: '청년 주거 지원 확대 법안', summary: '전월세 부담 완화를 위해 청년층 대상 보증금 지원과 공공임대 공급을 늘리는 안입니다.', progressive: '공공 지원 확대가 주거 불안을 줄이는 직접적인 해법입니다.', conservative: '시장 공급을 막는 규제를 먼저 완화해야 지속 가능한 주거 안정이 가능합니다.', committee: '국토교통위원회', proposer: '김민준 외 12인', vote_counts: { progressive: 128, conservative: 96, total: 224 }, user_vote: null },
  { id: 'issue-2', title: '플랫폼 노동자 보호 기준 신설', summary: '배달, 대리, 프리랜서 플랫폼 노동자의 산재와 계약 보호 기준을 정리하는 법안입니다.', progressive: '노동 형태가 바뀌어도 최소한의 안전망은 보장되어야 합니다.', conservative: '과도한 규제는 플랫폼 일자리의 유연성과 진입 장벽에 영향을 줄 수 있습니다.', committee: '환경노동위원회', proposer: '이서연 외 9인', vote_counts: { progressive: 172, conservative: 81, total: 253 }, user_vote: 'progressive' },
];
export const mockPolls: Poll[] = [{ id: 'poll-1', question: '지방선거에서 가장 중요하게 볼 기준은?', total_count: 432, expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), options: [{ id: 'policy', text: '공약 완성도' }, { id: 'record', text: '의정 활동 이력' }, { id: 'party', text: '정당' }] }];
