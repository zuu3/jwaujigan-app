import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/client';

export type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author_name: string | null;
  author_image: string | null;
  author_political_type: string | null;
  is_mine: boolean;
  mentions: Record<string, string>;
  replies: CommentItem[];
};

export type CommentsResponse = { comments: CommentItem[]; nextCursor: string | null };

export function fetchPollComments(pollId: string, cursor: string | null, token: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiGet<CommentsResponse>(`/api/polls/${pollId}/comments${qs}`, { token });
}

export function postPollComment(
  pollId: string,
  body: { content: string; parent_id?: string | null },
  token: string | null,
) {
  return apiPost<{ comment: CommentItem }>(`/api/polls/${pollId}/comments`, body, { token });
}

export function editPollComment(
  pollId: string,
  commentId: string,
  content: string,
  token: string | null,
) {
  return apiPatch<unknown>(`/api/polls/${pollId}/comments/${commentId}`, { content }, { token });
}

export function deletePollComment(pollId: string, commentId: string, token: string | null) {
  return apiDelete<unknown>(`/api/polls/${pollId}/comments/${commentId}`, { token });
}
