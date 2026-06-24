import { PropsWithChildren } from 'react';
import { ScrollViewProps, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type ScreenProps = PropsWithChildren<{
  refreshControl?: ScrollViewProps['refreshControl'];
  edges?: Edge[];
}>;

export function Screen({ children, refreshControl, edges = ['top'] }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing[5], paddingBottom: 120, gap: spacing[5] },
  header: { gap: spacing[2], paddingBottom: spacing[2] },
  title: { ...typography.headingLarge, color: colors.grey900 },
  description: { ...typography.body, color: colors.grey500 },
});
