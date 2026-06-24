import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePoll, useVotePoll } from '@/api/polls';
import { useAuth } from '@/auth/auth-context';
import { CommentSection } from '@/components/comment-section';
import { Screen } from '@/components/screen';
import { ErrorPanel, SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '마감';
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  return d >= 1 ? `${d}일 남음` : `${h}시간 남음`;
}

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const pollQuery = usePoll(id, token);
  const voteMutation = useVotePoll(id, token);
  const poll = pollQuery.data;
  const total = Math.max(1, poll?.total_count ?? 1);
  const voted = Boolean(poll?.user_option_id);
  const expired = poll ? new Date(poll.expires_at).getTime() <= Date.now() : false;

  function vote(optionId: string) {
    if (!token || voted || expired || voteMutation.isPending) return;
    voteMutation.mutate(optionId);
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ headerShown: true, title: '투표', headerBackTitle: '' }} />

      {pollQuery.isLoading ? (
        <>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
        </>
      ) : null}

      {pollQuery.isError ? (
        <ErrorPanel message="투표를 불러오지 못했어요." onRetry={() => void pollQuery.refetch()} />
      ) : null}

      {poll ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>{poll.question}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{poll.total_count.toLocaleString()}명 참여</Text>
              <Text style={[styles.meta, expired && styles.metaExpired]}>· {timeLeft(poll.expires_at)}</Text>
            </View>
            {voted ? (
              <View style={styles.votedBadge}>
                <Text style={styles.votedText}>투표 완료</Text>
              </View>
            ) : expired ? (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredText}>마감된 투표</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.options}>
            {poll.options.map((option) => {
              const count = poll.option_counts?.[option.id] ?? 0;
              const pct = voted || expired ? Math.round((count / total) * 100) : null;
              const selected = poll.user_option_id === option.id;

              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionCard,
                    selected && styles.optionSelected,
                    !voted && !expired && styles.optionVotable,
                  ]}
                  onPress={() => vote(option.id)}
                  disabled={voted || expired || voteMutation.isPending}
                >
                  <View style={styles.optionTop}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option.text}
                    </Text>
                    {pct !== null ? (
                      <Text style={[styles.pct, selected && styles.pctSelected]}>{pct}%</Text>
                    ) : null}
                  </View>
                  {pct !== null ? (
                    <View style={styles.track}>
                      <View style={[styles.bar, selected && styles.barSelected, { width: `${pct}%` }]} />
                    </View>
                  ) : null}
                  {pct !== null ? (
                    <Text style={styles.voteCount}>{count.toLocaleString()}표</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {voteMutation.isPending ? (
            <Text style={styles.savingText}>저장 중...</Text>
          ) : voteMutation.isError ? (
            <Text style={styles.errorText}>
              {voteMutation.error instanceof Error ? voteMutation.error.message : '투표에 실패했어요. 다시 시도해 주세요.'}
            </Text>
          ) : null}

          <CommentSection pollId={id} token={token} expired={expired} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[2] },
  title: { ...typography.displayLarge, color: colors.grey900 },
  metaRow: { flexDirection: 'row', gap: spacing[2] },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  metaExpired: { color: colors.grey400 },
  votedBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 999, backgroundColor: colors.blue50 },
  votedText: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  expiredBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 999, backgroundColor: colors.grey100 },
  expiredText: { ...typography.caption, color: colors.grey500, fontWeight: '700' },
  options: { gap: spacing[3] },
  optionCard: { gap: spacing[2], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  optionVotable: { borderColor: colors.grey200 },
  optionSelected: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  optionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] },
  optionText: { ...typography.subtitle, color: colors.grey900, flex: 1 },
  optionTextSelected: { color: colors.blue500 },
  pct: { ...typography.subtitle, color: colors.grey500, minWidth: 36, textAlign: 'right' },
  pctSelected: { color: colors.blue500, fontWeight: '700' },
  track: { height: 6, borderRadius: 999, backgroundColor: colors.grey100, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 999, backgroundColor: colors.grey300 },
  barSelected: { backgroundColor: colors.blue500 },
  voteCount: { ...typography.caption, color: colors.grey400 },
  savingText: { ...typography.bodySmall, color: colors.grey500, textAlign: 'center' },
  errorText: { ...typography.bodySmall, color: colors.red500, textAlign: 'center' },
});
