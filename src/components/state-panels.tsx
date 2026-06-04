import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function LoadingPanel({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <View style={styles.panel}>
      <ActivityIndicator color={colors.blue500} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>데이터를 불러오지 못했어요</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>다시 시도</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View style={skeleton.card}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={[skeleton.line, i === 0 && skeleton.lineShort]}
        />
      ))}
    </View>
  );
}

export function SkeletonList({ count = 3, lines }: { count?: number; lines?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[2], alignItems: 'flex-start', padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, backgroundColor: colors.grey50 },
  title: { ...typography.subtitle, color: colors.grey900 },
  text: { ...typography.body, color: colors.grey600 },
  button: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing[3], borderRadius: 8, backgroundColor: colors.grey900 },
  buttonText: { ...typography.bodySmall, color: colors.white, fontWeight: '600' },
});

const skeleton = StyleSheet.create({
  card: { gap: spacing[3], padding: spacing[4], borderWidth: 1, borderColor: colors.grey200, borderRadius: 12, backgroundColor: colors.white },
  line: { height: 14, borderRadius: 6, backgroundColor: colors.grey100 },
  lineShort: { width: '40%', height: 12 },
});
