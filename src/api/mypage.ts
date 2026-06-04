import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/client';

export type PoliticalProfile = {
  economic_score: number;
  social_score: number;
  security_score: number;
  political_type: string;
  completed_at: string | null;
};

export type BattleLogItem = {
  id: string;
  topic: string;
  result: string | null;
  created_at: string;
};

export type BadgeStatus = {
  id: string;
  title: string;
  desc: string;
  earned: boolean;
};

export type ActivitySummary = {
  total_issues: number;
  vote_ratio: { progressive: number; conservative: number; neutral: number };
  last_orientation: { type: string; date: string } | null;
};

export type ActivityItem = {
  type: 'issue_vote' | 'battle_vote' | 'orientation_test';
  label: string;
  created_at: string;
};

export type ActivityResponse = {
  summary: ActivitySummary;
  activities: ActivityItem[];
  streak: number;
  today_active: boolean;
  active_dates: string[];
  badges: BadgeStatus[];
  battle_insights?: { wins: number; losses: number; draws: number; total: number; win_rate: number | null };
};

export type FollowedPolitician = {
  id: string;
  name: string;
  image: string | null;
  followed_at: string;
};

export type ReferralInfo = {
  code: string;
  referralUrl: string;
  count: number;
  todayCount: number;
};

export function useMyPoliticalProfile(token: string | null) {
  return useQuery({
    queryKey: ['me-political-profile', token ? 'authenticated' : 'anon'],
    queryFn: () => apiGet<{ politicalProfile: PoliticalProfile | null; battleLogs: BattleLogItem[] }>('/api/me/political-profile', { token }),
    enabled: Boolean(token),
  });
}

export function useMyActivity(token: string | null) {
  return useQuery({
    queryKey: ['me-activity', token ? 'authenticated' : 'anon'],
    queryFn: () => apiGet<ActivityResponse>('/api/me/activity', { token }),
    enabled: Boolean(token),
  });
}

export function useMyFollows(token: string | null) {
  return useQuery({
    queryKey: ['me-follows', token ? 'authenticated' : 'anon'],
    queryFn: async () => {
      const res = await apiGet<{ follows: FollowedPolitician[] }>('/api/politicians/follows', { token });
      return res.follows;
    },
    enabled: Boolean(token),
  });
}

export function useReferralInfo(token: string | null) {
  return useQuery({
    queryKey: ['me-referral', token ? 'authenticated' : 'anon'],
    queryFn: () => apiGet<ReferralInfo>('/api/me/referral', { token }),
    enabled: Boolean(token),
  });
}
