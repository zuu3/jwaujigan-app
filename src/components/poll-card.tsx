import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Poll } from '@/types/domain';

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '마감';
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return String(days) + '일 남음';
  if (hours > 0) return String(hours) + '시간 남음';
  return String(Math.max(1, Math.floor(diff / 60_000))) + '분 남음';
}

export function PollCard({ poll, onPress }: { poll: Poll; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{poll.question}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{poll.total_count.toLocaleString()}명 참여</Text>
        <View style={styles.dot} />
        <Text style={styles.meta}>{getTimeLeft(poll.expires_at)}</Text>
      </View>
      <View style={styles.options}>
        {poll.options.slice(0, 4).map((option) => (
          <Text key={option.id} style={[styles.option, poll.user_option_id === option.id && styles.mine]}>{option.text}</Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, backgroundColor: colors.white },
  title: { ...typography.subtitle, color: colors.grey900 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.grey400 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  option: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 5, borderRadius: 999, overflow: 'hidden', color: colors.grey700, backgroundColor: colors.grey100 },
  mine: { color: colors.blue500, backgroundColor: colors.blue50 },
});
