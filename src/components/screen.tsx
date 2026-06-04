import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
export function Screen({ children }: PropsWithChildren) { return <SafeAreaView style={styles.safeArea} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView></SafeAreaView>; }
export function PageHeader({ title, description }: { title: string; description?: string }) { return <View style={styles.header}><Text style={styles.title}>{title}</Text>{description ? <Text style={styles.description}>{description}</Text> : null}</View>; }
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.white }, content: { padding: spacing[5], paddingBottom: 120, gap: spacing[5] }, header: { gap: spacing[2], paddingBottom: spacing[2] }, title: { ...typography.headingLarge, color: colors.grey900 }, description: { ...typography.body, color: colors.grey500 } });
