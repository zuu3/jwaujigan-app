import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Issue } from '@/types/domain';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `발의일 ${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function IssueCard({ issue, onPress }: { issue: Issue; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
          {issue.proposer ? <Text style={styles.meta}>{issue.proposer}</Text> : null}
        </View>
        {issue.vote_counts ? <Text style={styles.meta}>{issue.vote_counts.total.toLocaleString()}명 참여</Text> : null}
      </View>
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.summary}>{issue.summary}</Text>
      {issue.published_at ? <Text style={styles.date}>{formatDate(issue.published_at)}</Text> : null}
      <View style={styles.stanceGrid}>
        <View style={[styles.stance, styles.progressive]}>
          <Text style={[styles.stanceLabel, { color: colors.blue500 }]}>진보</Text>
          <Text style={styles.stanceText}>{issue.progressive}</Text>
        </View>
        <View style={[styles.stance, styles.conservative]}>
          <Text style={[styles.stanceLabel, { color: colors.politicalRed }]}>보수</Text>
          <Text style={styles.stanceText}>{issue.conservative}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3], padding: spacing[4], borderWidth: 1, borderColor: colors.grey200, borderRadius: 12, backgroundColor: colors.white },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[2] },
  topLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], alignItems: 'center', flex: 1 },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  meta: { ...typography.caption, color: colors.grey500 },
  date: { ...typography.caption, color: colors.grey400 },
  title: { ...typography.subtitle, color: colors.grey900 },
  summary: { ...typography.body, color: colors.grey600 },
  stanceGrid: { flexDirection: 'row', gap: spacing[2] },
  stance: { flex: 1, gap: spacing[1], padding: spacing[3], borderRadius: 8 },
  progressive: { backgroundColor: colors.blue50 },
  conservative: { backgroundColor: colors.politicalRedLight },
  stanceLabel: { ...typography.caption, fontWeight: '700' },
  stanceText: { ...typography.bodySmall, color: colors.grey900 },
});
