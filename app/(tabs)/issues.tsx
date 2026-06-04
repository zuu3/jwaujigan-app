import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useHome } from '@/api/home';
import { useAuth } from '@/auth/auth-context';
import { IssueCard } from '@/components/issue-card';
import { PageHeader, Screen } from '@/components/screen';
import { ErrorPanel, SkeletonList } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Sort = 'newest' | 'oldest';

export default function IssuesScreen() {
  const { token } = useAuth();
  const homeQuery = useHome(token);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');

  const issues = useMemo(() => {
    const all = homeQuery.data?.issues ?? [];
    const filtered = query.trim()
      ? all.filter((i) => i.title.includes(query) || i.summary.includes(query))
      : all;
    return sort === 'oldest' ? [...filtered].reverse() : filtered;
  }, [homeQuery.data, query, sort]);

  return (
    <Screen>
      <PageHeader title="이슈" description="국회에서 논의 중이거나 처리된 법안을 모아봤어요." />

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="이슈 검색"
        placeholderTextColor={colors.grey400}
        clearButtonMode="while-editing"
      />

      <View style={styles.sortRow}>
        {(['newest', 'oldest'] as Sort[]).map((s) => (
          <Pressable key={s} style={[styles.chip, sort === s && styles.chipActive]} onPress={() => setSort(s)}>
            <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
              {s === 'newest' ? '최신순' : '오래된 순'}
            </Text>
          </Pressable>
        ))}
      </View>

      {homeQuery.isLoading ? <SkeletonList count={4} lines={4} /> : null}
      {homeQuery.isError && !homeQuery.data ? (
        <ErrorPanel message="이슈를 불러오지 못했어요." onRetry={() => void homeQuery.refetch()} />
      ) : null}
      {!homeQuery.isLoading && issues.length === 0 && query ? (
        <Text style={styles.empty}>"{query}"에 해당하는 이슈가 없어요.</Text>
      ) : null}
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} onPress={() => router.push('/issues/' + issue.id)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 44, paddingHorizontal: spacing[3], borderRadius: 10, backgroundColor: colors.grey100, color: colors.grey900, ...typography.body },
  sortRow: { flexDirection: 'row', gap: spacing[2] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.grey200 },
  chipActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  chipText: { ...typography.bodySmall, color: colors.grey600, fontWeight: '600' },
  chipTextActive: { color: colors.blue500 },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[6] },
});
