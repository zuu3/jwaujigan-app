import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useHome } from '@/api/home';
import { useAuth } from '@/auth/auth-context';
import { PageHeader, Screen } from '@/components/screen';
import { ErrorPanel, SkeletonList } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Sort = 'newest' | 'popular';
type Status = 'all' | 'active';

export default function ArenaScreen() {
  const { token } = useAuth();
  const homeQuery = useHome(token);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [status, setStatus] = useState<Status>('all');

  const issues = useMemo(() => {
    const all = homeQuery.data?.issues ?? [];
    const now = new Date().toISOString();
    let filtered = status === 'active' ? all.filter((i) => !i.expires_at || i.expires_at > now) : all;
    if (query.trim()) filtered = filtered.filter((i) => i.title.includes(query) || i.summary.includes(query));
    if (sort === 'popular') return [...filtered].sort((a, b) => (b.vote_counts?.total ?? 0) - (a.vote_counts?.total ?? 0));
    return filtered;
  }, [homeQuery.data, query, sort, status]);

  return (
    <Screen>
      <PageHeader title="AI 토론 배틀" description="이슈를 고르고 AI 토론을 지켜보거나 직접 참여하세요." />

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="이슈 검색"
        placeholderTextColor={colors.grey400}
        clearButtonMode="while-editing"
      />

      <View style={styles.filterRow}>
        {(['all', 'active'] as Status[]).map((s) => (
          <Pressable key={s} style={[styles.chip, status === s && styles.chipActive]} onPress={() => setStatus(s)}>
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
              {s === 'all' ? '전체' : '진행중'}
            </Text>
          </Pressable>
        ))}
        <View style={styles.divider} />
        {(['newest', 'popular'] as Sort[]).map((s) => (
          <Pressable key={s} style={[styles.chip, sort === s && styles.chipActive]} onPress={() => setSort(s)}>
            <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
              {s === 'newest' ? '최신순' : '참여자 많은 순'}
            </Text>
          </Pressable>
        ))}
      </View>

      {homeQuery.isLoading ? <SkeletonList count={3} lines={3} /> : null}
      {homeQuery.isError && !homeQuery.data ? (
        <ErrorPanel message="이슈를 불러오지 못했어요." onRetry={() => void homeQuery.refetch()} />
      ) : null}
      {!homeQuery.isLoading && issues.length === 0 ? (
        <Text style={styles.empty}>{query ? `"${query}"에 해당하는 이슈가 없어요.` : '표시할 이슈가 없어요.'}</Text>
      ) : null}
      {issues.map((issue) => (
        <Pressable key={issue.id} style={styles.card} onPress={() => router.push('/arena/' + issue.id)}>
          <View style={styles.cardTop}>
            <Text style={styles.title} numberOfLines={2}>{issue.title}</Text>
            {issue.vote_counts ? (
              <Text style={styles.meta}>{issue.vote_counts.total.toLocaleString()}명</Text>
            ) : null}
          </View>
          {issue.committee || issue.proposer ? (
            <View style={styles.metaRow}>
              {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
              {issue.proposer ? <Text style={styles.metaText}>{issue.proposer}</Text> : null}
            </View>
          ) : null}
          <Text style={styles.summary} numberOfLines={2}>{issue.summary}</Text>
          <View style={styles.stanceRow}>
            <View style={styles.progressivePill}><Text style={styles.progressiveText}>진보</Text></View>
            <View style={styles.conservativePill}><Text style={styles.conservativeText}>보수</Text></View>
          </View>
          <Text style={styles.action}>배틀 참여하기 →</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 44, paddingHorizontal: spacing[3], borderRadius: 10, backgroundColor: colors.grey100, color: colors.grey900, ...typography.body },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], alignItems: 'center' },
  chip: { paddingHorizontal: spacing[3], paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.grey200 },
  chipActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  chipText: { ...typography.bodySmall, color: colors.grey600, fontWeight: '600' },
  chipTextActive: { color: colors.blue500 },
  divider: { width: 1, height: 20, backgroundColor: colors.grey200 },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[6] },
  card: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, backgroundColor: colors.white },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[2] },
  title: { ...typography.subtitle, color: colors.grey900, flex: 1 },
  metaRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  metaText: { ...typography.caption, color: colors.grey500 },
  meta: { ...typography.caption, color: colors.grey500 },
  summary: { ...typography.body, color: colors.grey600 },
  stanceRow: { flexDirection: 'row', gap: spacing[2] },
  progressivePill: { paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: 6, backgroundColor: colors.blue50 },
  progressiveText: { ...typography.caption, color: colors.blue500, fontWeight: '600' },
  conservativePill: { paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: 6, backgroundColor: colors.politicalRedLight },
  conservativeText: { ...typography.caption, color: colors.politicalRed, fontWeight: '600' },
  action: { ...typography.bodySmall, color: colors.blue500, fontWeight: '600' },
});
