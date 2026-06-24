import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Issue } from '@/types/domain';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `발의일 ${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function IssueCard({ issue, onPress }: { issue: Issue; onPress?: () => void }) {
  const totalVotes = issue.vote_counts?.total ?? 0;
  const navigate = onPress ?? (() => router.push('/issues/' + issue.id));

  return (
    <Pressable style={styles.card} onPress={navigate}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
          {issue.proposer ? <Text style={styles.meta}>{issue.proposer}</Text> : null}
        </View>
        {totalVotes > 0 ? <Text style={styles.meta}>{totalVotes.toLocaleString()}명 참여</Text> : null}
      </View>
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.summary}>{issue.summary}</Text>
      {issue.published_at ? <Text style={styles.date}>{formatDate(issue.published_at)}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[2], padding: spacing[4], borderWidth: 1, borderColor: colors.grey200, borderRadius: 12, backgroundColor: colors.white },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[2] },
  topLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], alignItems: 'center', flex: 1 },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  meta: { ...typography.caption, color: colors.grey500 },
  date: { ...typography.caption, color: colors.grey400 },
  title: { ...typography.subtitle, color: colors.grey900 },
  summary: { ...typography.body, color: colors.grey600 },
});
