import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHome } from '@/api/home';
import { useAuth } from '@/auth/auth-context';
import { PollCard } from '@/components/poll-card';
import { PageHeader, Screen } from '@/components/screen';
import { ErrorPanel, SkeletonList } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Sort = 'newest' | 'hot';

export default function CommunityScreen() {
  const { token } = useAuth();
  const homeQuery = useHome(token);
  const [sort, setSort] = useState<Sort>('newest');

  const polls = useMemo(() => {
    const all = homeQuery.data?.polls ?? [];
    if (sort === 'hot') return [...all].sort((a, b) => b.total_count - a.total_count);
    return all;
  }, [homeQuery.data, sort]);

  return (
    <Screen>
      <PageHeader title="민심투표" description="짧은 투표로 의견을 모아보세요." />

      <View style={styles.tabRow}>
        {(['newest', 'hot'] as Sort[]).map((s) => (
          <Pressable key={s} style={[styles.tab, sort === s && styles.tabActive]} onPress={() => setSort(s)}>
            <Text style={[styles.tabText, sort === s && styles.tabTextActive]}>
              {s === 'newest' ? '최신' : '핫'}
            </Text>
          </Pressable>
        ))}
      </View>

      {homeQuery.isLoading ? <SkeletonList count={3} lines={3} /> : null}
      {homeQuery.isError && !homeQuery.data ? (
        <ErrorPanel message="투표를 불러오지 못했어요." onRetry={() => void homeQuery.refetch()} />
      ) : null}
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} onPress={() => router.push('/community/polls/' + poll.id)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.grey200 },
  tab: { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.blue500 },
  tabText: { ...typography.subtitle, color: colors.grey500 },
  tabTextActive: { color: colors.blue500 },
});
