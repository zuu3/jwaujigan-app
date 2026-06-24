import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  fetchPollComments,
  postPollComment,
  editPollComment,
  deletePollComment,
  type CommentItem,
} from '@/api/comments';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function getInitial(name: string | null): string {
  return (name?.trim()?.[0] ?? '?').toUpperCase();
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

type Props = { pollId: string; token: string | null };

export function CommentSection({ pollId, token }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replyRoot, setReplyRoot] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetchPollComments(pollId, null, token)
      .then((res) => {
        setComments(res.comments);
        setNextCursor(res.nextCursor);
      })
      .catch(() => setFetchError('댓글을 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, [pollId, token]);

  useEffect(() => { load(); }, [load]);

  async function loadMore() {
    if (!nextCursor || moreLoading) return;
    setMoreLoading(true);
    try {
      const res = await fetchPollComments(pollId, nextCursor, token);
      setComments((prev) => [...prev, ...res.comments]);
      setNextCursor(res.nextCursor);
    } catch {
      /* noop */
    } finally {
      setMoreLoading(false);
    }
  }

  async function submitTop() {
    const content = draft.trim();
    if (!content || submitting) return;
    if (!token) { Alert.alert('로그인이 필요해요.'); return; }
    setSubmitting(true);
    try {
      const { comment } = await postPollComment(pollId, { content }, token);
      setComments((prev) => [{ ...comment, replies: [] }, ...prev]);
      setDraft('');
    } catch (e) {
      Alert.alert(e instanceof Error ? e.message : '댓글을 달지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  function openReply(rootId: string) {
    if (!token) { Alert.alert('로그인이 필요해요.'); return; }
    setReplyRoot(rootId);
    setReplyDraft('');
  }

  async function submitReply() {
    const content = replyDraft.trim();
    if (!content || !replyRoot || replySubmitting) return;
    setReplySubmitting(true);
    try {
      const { comment } = await postPollComment(pollId, { content, parent_id: replyRoot }, token);
      setComments((prev) =>
        prev.map((c) => (c.id === replyRoot ? { ...c, replies: [...c.replies, comment] } : c)),
      );
      setReplyRoot(null);
      setReplyDraft('');
    } catch (e) {
      Alert.alert(e instanceof Error ? e.message : '답글을 달지 못했어요.');
    } finally {
      setReplySubmitting(false);
    }
  }

  function openEdit(c: CommentItem) {
    setEditingId(c.id);
    setEditDraft(c.content);
  }

  async function saveEdit(id: string) {
    const content = editDraft.trim();
    if (!content || editSaving) return;
    setEditSaving(true);
    try {
      await editPollComment(pollId, id, content, token);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === id) return { ...c, content };
          return { ...c, replies: c.replies.map((r) => (r.id === id ? { ...r, content } : r)) };
        }),
      );
      setEditingId(null);
    } catch (e) {
      Alert.alert(e instanceof Error ? e.message : '수정하지 못했어요.');
    } finally {
      setEditSaving(false);
    }
  }

  function confirmDelete(id: string, parentId: string | null) {
    Alert.alert('댓글을 삭제할까요?', '삭제한 댓글은 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePollComment(pollId, id, token);
            if (parentId) {
              setComments((prev) =>
                prev.map((c) =>
                  c.id === parentId ? { ...c, replies: c.replies.filter((r) => r.id !== id) } : c,
                ),
              );
            } else {
              setComments((prev) => prev.filter((c) => c.id !== id));
            }
          } catch (e) {
            Alert.alert(e instanceof Error ? e.message : '삭제하지 못했어요.');
          }
        },
      },
    ]);
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  function renderRow(c: CommentItem, isReply: boolean) {
    const isEditing = editingId === c.id;
    return (
      <View key={c.id} style={[styles.row, isReply && styles.rowReply]}>
        {c.author_image ? (
          <Image source={{ uri: c.author_image }} style={[styles.avatar, isReply && styles.avatarSmall]} />
        ) : (
          <View style={[styles.avatar, isReply && styles.avatarSmall, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{getInitial(c.author_name)}</Text>
          </View>
        )}
        <View style={styles.rowBody}>
          <View style={styles.meta}>
            <Text style={styles.author}>{c.author_name ?? '사용자'}</Text>
            {c.author_political_type ? (
              <Text style={styles.politicalTag}>{c.author_political_type}</Text>
            ) : null}
            <Text style={styles.time}>{formatRelative(c.created_at)}</Text>
          </View>

          {isEditing ? (
            <View style={styles.editBox}>
              <TextInput
                style={styles.input}
                value={editDraft}
                onChangeText={setEditDraft}
                maxLength={500}
                multiline
                editable={!editSaving}
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditingId(null)} disabled={editSaving} hitSlop={8}>
                  <Text style={styles.actionBtn}>취소</Text>
                </Pressable>
                <Pressable onPress={() => void saveEdit(c.id)} disabled={editSaving || !editDraft.trim()} hitSlop={8}>
                  <Text style={[styles.actionBtn, styles.actionPrimary]}>{editSaving ? '저장 중…' : '저장'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.content}>{c.content}</Text>
          )}

          {!isEditing ? (
            <View style={styles.actions}>
              {!isReply ? (
                <Pressable onPress={() => openReply(c.id)} hitSlop={8}>
                  <Text style={styles.actionBtn}>답글</Text>
                </Pressable>
              ) : null}
              {c.is_mine ? (
                <>
                  <Pressable onPress={() => openEdit(c)} hitSlop={8}>
                    <Text style={styles.actionBtn}>수정</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(c.id, c.parent_id)} hitSlop={8}>
                    <Text style={[styles.actionBtn, styles.actionDanger]}>삭제</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>토론 {loading ? '' : `(${totalCount})`}</Text>

      {/* 새 댓글 */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={token ? '이 투표에 대한 의견을 남겨보세요. (최대 500자)' : '로그인하면 의견을 남길 수 있어요.'}
          placeholderTextColor={colors.grey400}
          value={draft}
          onChangeText={setDraft}
          maxLength={500}
          multiline
          editable={!submitting && Boolean(token)}
        />
        <View style={styles.composerFooter}>
          <Text style={styles.charCount}>{draft.length}/500</Text>
          <Pressable
            style={[styles.postBtn, (submitting || !draft.trim()) && styles.postBtnDisabled]}
            onPress={() => void submitTop()}
            disabled={submitting || !draft.trim()}
          >
            <Text style={styles.postBtnText}>{submitting ? '게시 중…' : '의견 남기기'}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.blue500} style={{ marginTop: spacing[4] }} />
      ) : fetchError ? (
        <Text style={styles.errorText}>{fetchError}</Text>
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>첫 번째 의견을 남겨보세요.</Text>
      ) : (
        <View>
          {comments.map((c) => (
            <View key={c.id} style={styles.thread}>
              {renderRow(c, false)}
              {c.replies.length > 0 ? (
                <View style={styles.replyList}>{c.replies.map((r) => renderRow(r, true))}</View>
              ) : null}
              {replyRoot === c.id ? (
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="답글을 입력해주세요."
                    placeholderTextColor={colors.grey400}
                    value={replyDraft}
                    onChangeText={setReplyDraft}
                    maxLength={500}
                    multiline
                    editable={!replySubmitting}
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <Pressable onPress={() => setReplyRoot(null)} disabled={replySubmitting} hitSlop={8}>
                      <Text style={styles.actionBtn}>취소</Text>
                    </Pressable>
                    <Pressable onPress={() => void submitReply()} disabled={replySubmitting || !replyDraft.trim()} hitSlop={8}>
                      <Text style={[styles.actionBtn, styles.actionPrimary]}>{replySubmitting ? '게시 중…' : '답글 달기'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          ))}

          {nextCursor ? (
            <Pressable style={styles.loadMore} onPress={() => void loadMore()} disabled={moreLoading}>
              <Text style={styles.loadMoreText}>{moreLoading ? '불러오는 중…' : '더 보기'}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3], paddingTop: spacing[5], marginTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.grey200 },
  title: { ...typography.heading, color: colors.grey900 },
  composer: { gap: spacing[2] },
  input: {
    ...typography.body,
    minHeight: 64,
    padding: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: colors.grey50,
    color: colors.grey900,
    textAlignVertical: 'top',
  },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing[3] },
  charCount: { ...typography.caption, color: colors.grey400 },
  postBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: 8, backgroundColor: colors.grey900 },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { ...typography.bodySmall, color: '#ffffff', fontWeight: '600' },
  thread: { borderBottomWidth: 1, borderBottomColor: colors.grey100, paddingVertical: spacing[1] },
  row: { flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[3] },
  rowReply: { paddingVertical: spacing[2] },
  replyList: { paddingLeft: spacing[5], marginLeft: spacing[4], borderLeftWidth: 2, borderLeftColor: colors.grey100, marginBottom: spacing[1] },
  avatar: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
  avatarSmall: { width: 28, height: 28, borderRadius: 14 },
  avatarFallback: { backgroundColor: colors.grey900, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.caption, color: '#ffffff', fontWeight: '700' },
  rowBody: { flex: 1, gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  author: { ...typography.bodySmall, color: colors.grey900, fontWeight: '600' },
  politicalTag: { ...typography.caption, color: colors.blue500, backgroundColor: colors.blue50, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, fontWeight: '600', overflow: 'hidden' },
  time: { ...typography.caption, color: colors.grey500 },
  content: { ...typography.body, color: colors.grey900 },
  actions: { flexDirection: 'row', gap: spacing[3], marginTop: 2 },
  actionBtn: { ...typography.caption, color: colors.grey500, fontWeight: '600' },
  actionPrimary: { color: colors.blue500 },
  actionDanger: { color: colors.red500 },
  editBox: { gap: spacing[2] },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[4] },
  replyBox: { gap: spacing[2], paddingLeft: spacing[5], marginLeft: spacing[4], paddingBottom: spacing[3] },
  loadMore: { marginTop: spacing[3], paddingVertical: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: colors.grey200, alignItems: 'center' },
  loadMoreText: { ...typography.body, color: colors.grey700, fontWeight: '600' },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[6] },
  errorText: { ...typography.bodySmall, color: colors.red500, textAlign: 'center', paddingVertical: spacing[4] },
});
