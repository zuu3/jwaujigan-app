import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
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
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={homeQuery.isFetching && !homeQuery.isLoading}
          onRefresh={() => void homeQuery.refetch()}
          tintColor={colors.blue500}
        />
      }
    >
      <PageHeader title="이슈" description="국회에서 논의 중이거나 처리된 법안을 모아봤어요." />

      {/* Liquid Glass 검색바 */}
      <BlurView intensity={60} tint="systemUltraThinMaterial" style={styles.searchBlur}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="이슈 검색"
          placeholderTextColor={colors.grey400}
          clearButtonMode="while-editing"
        />
      </BlurView>

      {/* Liquid Glass 정렬 칩 */}
      <View style={styles.sortRow}>
        {(['newest', 'oldest'] as Sort[]).map((s) => (
          <BlurView key={s} intensity={50} tint="systemUltraThinMaterial" style={[styles.chipBlur, sort === s && styles.chipBlurActive]}>
            <Pressable style={styles.chipInner} onPress={() => setSort(s)}>
              <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
                {s === 'newest' ? '최신순' : '오래된 순'}
              </Text>
            </Pressable>
          </BlurView>
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
  searchBlur: { borderRadius: 10, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)' },
  searchInput: { minHeight: 44, paddingHorizontal: spacing[3], color: colors.grey900, ...typography.body },
  sortRow: { flexDirection: 'row', gap: spacing[2] },
  chipBlur: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.grey200 },
  chipBlurActive: { borderColor: colors.blue500 },
  chipInner: { paddingHorizontal: spacing[3], paddingVertical: 8 },
  chipText: { ...typography.bodySmall, color: colors.grey600, fontWeight: '600' },
  chipTextActive: { color: colors.blue500 },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[6] },
});
