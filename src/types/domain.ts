export type IssueVoteStance = 'progressive' | 'conservative' | 'neutral';

export type Issue = {
  id: string;
  title: string;
  summary: string;
  body?: string | null;
  progressive?: string;
  conservative?: string;
  scenario?: string | null;
  source_url?: string | null;
  bill_id?: string | null;
  committee?: string | null;
  proposer?: string | null;
  bill_status?: string | null;
  published_at?: string | null;
  created_at?: string;
  expires_at?: string | null;
  vote_counts?: { progressive: number; conservative: number; neutral?: number; total: number };
  user_vote?: IssueVoteStance | null;
};

export type Poll = {
  id: string;
  user_id?: string;
  question: string;
  total_count: number;
  expires_at: string;
  created_at?: string;
  options: { id: string; text: string }[];
  user_option_id?: string | null;
  creator?: { id: string; name: string | null; image: string | null } | null;
};

export type PollDetail = Poll & {
  option_counts: Record<string, number>;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district: string | null;
  hasPoliticalProfile: boolean;
  points: number;
  level?: { title: string; next: number | null; progress: number };
  is_public: boolean;
  streak: number;
  today_active: boolean;
};
