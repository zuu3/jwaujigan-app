import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIssue } from '@/api/issues';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { ErrorPanel, SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ArenaIssueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const issueQuery = useIssue(id, token);
  const issue = issueQuery.data;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={16}>
        <Text style={styles.back}>← 이전</Text>
      </Pressable>

      {issueQuery.isLoading ? (
        <>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </>
      ) : null}

      {issueQuery.isError ? (
        <ErrorPanel message="이슈를 불러오지 못했어요." onRetry={() => void issueQuery.refetch()} />
      ) : null}

      {issue ? (
        <>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>AI 토론 배틀</Text>
            <Text style={styles.title}>{issue.title}</Text>
            <Text style={styles.summary}>{issue.summary}</Text>
            {issue.committee || issue.proposer ? (
              <View style={styles.metaRow}>
                {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
                {issue.proposer ? <Text style={styles.metaText}>{issue.proposer}</Text> : null}
              </View>
            ) : null}
          </View>

          <View style={styles.split}>
            <View style={[styles.side, { backgroundColor: colors.blue50 }]}>
              <Text style={[styles.sideLabel, { color: colors.blue500 }]}>진보</Text>
              <Text style={styles.sideText}>{issue.progressive}</Text>
            </View>
            <View style={[styles.side, { backgroundColor: colors.politicalRedLight }]}>
              <Text style={[styles.sideLabel, { color: colors.politicalRed }]}>보수</Text>
              <Text style={styles.sideText}>{issue.conservative}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.action, { backgroundColor: colors.blue500 }]} onPress={() => router.push('/arena/' + id + '/battle?stance=progressive')}>
              <Text style={styles.actionText}>진보 편으로 참여</Text>
            </Pressable>
            <Pressable style={[styles.action, { backgroundColor: colors.politicalRed }]} onPress={() => router.push('/arena/' + id + '/battle?stance=conservative')}>
              <Text style={styles.actionText}>보수 편으로 참여</Text>
            </Pressable>
            <Pressable style={[styles.action, { backgroundColor: colors.grey900 }]} onPress={() => router.push('/arena/' + id + '/battle?stance=watch')}>
              <Text style={styles.actionText}>구경하기</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  header: { gap: spacing[2] },
  eyebrow: { ...typography.bodySmall, color: colors.grey600, fontWeight: '700' },
  title: { ...typography.displayLarge, color: colors.grey900 },
  summary: { ...typography.bodyLarge, color: colors.grey600 },
  metaRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  metaText: { ...typography.caption, color: colors.grey500 },
  split: { gap: spacing[3] },
  side: { gap: spacing[2], padding: spacing[4], borderRadius: 12 },
  sideLabel: { ...typography.subtitle },
  sideText: { ...typography.body, color: colors.grey900 },
  actions: { gap: spacing[3] },
  action: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  actionText: { ...typography.subtitle, color: colors.white },
});
