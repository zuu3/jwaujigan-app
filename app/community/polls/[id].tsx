import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePoll, useVotePoll } from '@/api/polls';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { ErrorPanel, SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const pollQuery = usePoll(id, token);
  const voteMutation = useVotePoll(id, token);
  const poll = pollQuery.data;
  const total = Math.max(1, poll?.total_count ?? 1);

  function vote(optionId: string) {
    if (!token || poll?.user_option_id) return;
    voteMutation.mutate(optionId);
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={16}>
        <Text style={styles.back}>← 이전</Text>
      </Pressable>

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
            <Text style={styles.meta}>{poll.total_count.toLocaleString()}명 참여</Text>
          </View>

          <View style={styles.options}>
            {poll.options.map((option) => {
              const count = poll.option_counts?.[option.id] ?? 0;
              const pct = Math.round((count / total) * 100);
              const selected = poll.user_option_id === option.id;
              const voted = Boolean(poll.user_option_id);
              return (
                <Pressable
                  key={option.id}
                  style={[styles.optionCard, selected && styles.selected]}
                  onPress={() => vote(option.id)}
                  disabled={voted || voteMutation.isPending}
                >
                  <View style={styles.optionTop}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    {voted ? <Text style={styles.percent}>{pct}%</Text> : null}
                  </View>
                  {voted ? (
                    <View style={styles.track}>
                      <View style={[styles.bar, { width: (String(pct) + '%') as `${number}%` }]} />
                    </View>
                  ) : null}
                  {voted ? <Text style={styles.meta}>{count.toLocaleString()}표</Text> : null}
                </Pressable>
              );
            })}
          </View>
          {voteMutation.isPending ? <Text style={styles.meta}>투표 저장 중...</Text> : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  header: { gap: spacing[2] },
  title: { ...typography.displayLarge, color: colors.grey900 },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  options: { gap: spacing[3] },
  optionCard: { gap: spacing[2], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  selected: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  optionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] },
  optionText: { ...typography.subtitle, color: colors.grey900, flex: 1 },
  percent: { ...typography.subtitle, color: colors.blue500 },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.grey100, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 999, backgroundColor: colors.blue500 },
});
