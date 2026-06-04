import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIssue, useVoteIssue } from '@/api/issues';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { ErrorPanel, SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Issue, IssueVoteStance } from '@/types/domain';

const stanceOptions: Array<{ value: IssueVoteStance; label: string; color: string; bg: string }> = [
  { value: 'progressive', label: '진보 지지', color: colors.blue500, bg: colors.blue50 },
  { value: 'neutral', label: '모르겠음', color: colors.grey500, bg: colors.grey100 },
  { value: 'conservative', label: '보수 지지', color: colors.politicalRed, bg: colors.politicalRedLight },
];

function pct(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `발의일 ${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function VoteBar({ label, color, bg, count, total }: { label: string; color: string; bg: string; count: number; total: number }) {
  const p = pct(count, total);
  return (
    <View style={vb.row}>
      <Text style={[vb.label, { color }]}>{label}</Text>
      <View style={[vb.track, { backgroundColor: bg }]}>
        <View style={[vb.fill, { backgroundColor: color, width: (String(p) + '%') as `${number}%` }]} />
      </View>
      <Text style={[vb.pct, { color }]}>{p}%</Text>
    </View>
  );
}

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const issueQuery = useIssue(id, token);
  const voteMutation = useVoteIssue(id, token);
  const [optimisticIssue, setOptimisticIssue] = useState<Issue | null>(null);

  const issue = optimisticIssue ?? issueQuery.data;

  function vote(stance: IssueVoteStance) {
    if (!token || !issueQuery.data) return;
    const base = issueQuery.data;
    const isToggle = base.user_vote === stance;
    const newVote = isToggle ? null : stance;
    // Optimistic update
    const counts = { ...(base.vote_counts ?? { progressive: 0, conservative: 0, neutral: 0, total: 0 }) };
    if (base.user_vote && counts[base.user_vote] !== undefined) counts[base.user_vote] = Math.max(0, (counts[base.user_vote] ?? 0) - 1);
    if (newVote) counts[newVote] = (counts[newVote] ?? 0) + 1;
    counts.total = counts.progressive + counts.conservative + (counts.neutral ?? 0);
    setOptimisticIssue({ ...base, user_vote: newVote, vote_counts: counts });
    voteMutation.mutate(stance, {
      onSuccess: () => setOptimisticIssue(null),
      onError: () => setOptimisticIssue(null),
    });
  }

  const counts = issue?.vote_counts;
  const isExpired = issue?.expires_at ? new Date(issue.expires_at) < new Date() : false;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={16}>
        <Text style={styles.back}>← 이전</Text>
      </Pressable>

      {issueQuery.isLoading ? (
        <>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </>
      ) : null}

      {issueQuery.isError ? (
        <ErrorPanel message="이슈를 불러오지 못했어요." onRetry={() => void issueQuery.refetch()} />
      ) : null}

      {issue ? (
        <>
          {isExpired ? (
            <View style={styles.expiredBanner}>
              <Text style={styles.expiredText}>
                투표가 종료됐습니다. 내용은 참고용으로 확인할 수 있습니다.
                {issue.bill_status ? ` 최종 법안 상태: ${issue.bill_status}` : ''}
              </Text>
            </View>
          ) : null}

          <View style={styles.header}>
            <View style={styles.metaRow}>
              {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
              {issue.bill_status ? (
                <View style={[styles.statusChip, issue.bill_status === '통과' ? styles.statusPass : issue.bill_status === '폐기' ? styles.statusFail : styles.statusPending]}>
                  <Text style={styles.statusText}>{issue.bill_status}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.title}>{issue.title}</Text>
            <Text style={styles.summary}>{issue.summary}</Text>
            <View style={styles.metaRow}>
              {issue.proposer ? <Text style={styles.meta}>{issue.proposer}</Text> : null}
              {issue.published_at ? <Text style={styles.meta}>{formatDate(issue.published_at)}</Text> : null}
            </View>
            {issue.source_url ? (
              <Pressable onPress={() => void Linking.openURL(issue.source_url!)}>
                <Text style={styles.sourceLink}>국회 원문 보기 →</Text>
              </Pressable>
            ) : null}
          </View>

          {issue.body ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>법안 상세 내용</Text>
              {issue.body.split('\n\n').map((para, i) => (
                <Text key={i} style={styles.bodyText}>{para}</Text>
              ))}
            </View>
          ) : null}

          {issue.scenario ? (
            <View style={styles.scenarioSection}>
              <View style={styles.scenarioHeader}>
                <Text style={styles.scenarioBadge}>가상 상황</Text>
                <Text style={styles.scenarioTitle}>만약 이 법이 통과된다면</Text>
              </View>
              {issue.scenario.split('\n\n').filter(Boolean).map((item, i) => (
                <Text key={i} style={styles.scenarioItem}>• {item.replace(/^•\s*/, '')}</Text>
              ))}
              <Text style={styles.scenarioFootnote}>법안 통과를 가정한 AI 생성 시나리오입니다.</Text>
            </View>
          ) : null}

          <View style={styles.split}>
            <View style={[styles.side, { backgroundColor: colors.blue50 }]}>
              <Text style={[styles.sideLabel, { color: colors.blue500 }]}>진보 관점</Text>
              <Text style={styles.sideText}>{issue.progressive}</Text>
            </View>
            <View style={[styles.side, { backgroundColor: colors.politicalRedLight }]}>
              <Text style={[styles.sideLabel, { color: colors.politicalRed }]}>보수 관점</Text>
              <Text style={styles.sideText}>{issue.conservative}</Text>
            </View>
          </View>

          <View style={styles.votePanel}>
            <View style={styles.votePanelHeader}>
              <Text style={styles.sectionTitle}>사용자 의견</Text>
              {counts && counts.total > 0 ? (
                <Text style={styles.meta}>{counts.total.toLocaleString()}명 참여</Text>
              ) : null}
            </View>

            {counts && counts.total > 0 ? (
              <View style={styles.voteBars}>
                <VoteBar label="진보 지지" color={colors.blue500} bg={colors.blue50} count={counts.progressive} total={counts.total} />
                <VoteBar label="모르겠음" color={colors.grey500} bg={colors.grey100} count={counts.neutral ?? 0} total={counts.total} />
                <VoteBar label="보수 지지" color={colors.politicalRed} bg={colors.politicalRedLight} count={counts.conservative} total={counts.total} />
              </View>
            ) : !isExpired ? (
              <Text style={styles.meta}>아직 의견을 남긴 사용자가 없어요. 첫 번째로 의견을 남겨보세요.</Text>
            ) : (
              <Text style={styles.meta}>투표 기간 중 참여한 사용자가 없어요.</Text>
            )}

            {!isExpired ? (
              <View style={styles.voteRow}>
                {stanceOptions.map((option) => {
                  const selected = issue.user_vote === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.voteButton, selected && { backgroundColor: option.bg, borderColor: option.color }]}
                      onPress={() => vote(option.value)}
                      disabled={voteMutation.isPending}
                    >
                      <Text style={[styles.voteText, { color: selected ? option.color : colors.grey700 }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  expiredBanner: { padding: spacing[3], borderRadius: 8, backgroundColor: colors.grey100 },
  expiredText: { ...typography.bodySmall, color: colors.grey600 },
  header: { gap: spacing[3] },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], alignItems: 'center' },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4 },
  statusPass: { backgroundColor: '#dcfce7' },
  statusFail: { backgroundColor: '#fef2f2' },
  statusPending: { backgroundColor: colors.grey100 },
  statusText: { ...typography.caption, fontWeight: '600', color: colors.grey700 },
  title: { ...typography.displayLarge, color: colors.grey900 },
  summary: { ...typography.bodyLarge, color: colors.grey600 },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  sourceLink: { ...typography.bodySmall, color: colors.blue500, fontWeight: '600' },
  section: { gap: spacing[2] },
  sectionTitle: { ...typography.heading, color: colors.grey900 },
  bodyText: { ...typography.body, color: colors.grey700 },
  scenarioSection: { gap: spacing[3], padding: spacing[4], borderRadius: 12, backgroundColor: colors.grey50, borderWidth: 1, borderColor: colors.grey200 },
  scenarioHeader: { gap: spacing[1] },
  scenarioBadge: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  scenarioTitle: { ...typography.subtitle, color: colors.grey900 },
  scenarioItem: { ...typography.body, color: colors.grey700 },
  scenarioFootnote: { ...typography.caption, color: colors.grey400 },
  split: { gap: spacing[3] },
  side: { gap: spacing[2], padding: spacing[4], borderRadius: 12 },
  sideLabel: { ...typography.subtitle },
  sideText: { ...typography.body, color: colors.grey900 },
  votePanel: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  votePanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voteBars: { gap: spacing[2] },
  voteRow: { flexDirection: 'row', gap: spacing[2] },
  voteButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.grey200, borderRadius: 8, backgroundColor: colors.white },
  voteText: { ...typography.bodySmall, fontWeight: '700' },
});

const vb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  label: { ...typography.bodySmall, fontWeight: '600', width: 56 },
  track: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999 },
  pct: { ...typography.bodySmall, fontWeight: '600', width: 36, textAlign: 'right' },
});
