import { Stack, router, useLocalSearchParams } from 'expo-router';
import { GlassButton } from '../../modules/glass-effect/src';
import { useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
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
  const [methodologyOpen, setMethodologyOpen] = useState(false);

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

  async function shareIssue() {
    if (!issue) return;
    await Share.share({ title: issue.title, message: issue.title });
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ headerShown: true, title: '이슈', headerBackTitle: '' }} />

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
            <View style={styles.titleRow}>
              <Text style={styles.title}>{issue.title}</Text>
              <View style={styles.titleActions}>
                <GlassButton
                  systemImage="square.and.arrow.up"
                  onPress={() => void shareIssue()}
                  style={styles.iconBtn}
                />
                <GlassButton
                  systemImage="questionmark.circle"
                  onPress={() => setMethodologyOpen((v) => !v)}
                  style={styles.iconBtn}
                />
              </View>
            </View>
            <View style={styles.metaRow}>
              {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
              {issue.bill_status ? (
                <View style={[styles.statusChip, issue.bill_status === '통과' ? styles.statusPass : issue.bill_status === '폐기' ? styles.statusFail : styles.statusPending]}>
                  <Text style={styles.statusText}>{issue.bill_status}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.summary}>{issue.summary}</Text>
            <View style={styles.metaRow}>
              {issue.proposer ? <Text style={styles.meta}>{issue.proposer}</Text> : null}
              {issue.published_at ? <Text style={styles.meta}>{formatDate(issue.published_at)}</Text> : null}
            </View>
            {issue.source_url ? (
              <GlassButton
                label="국회 원문 보기 →"
                onPress={() => void Linking.openURL(issue.source_url!)}
                style={styles.sourceLinkBtn}
              />
            ) : null}
          </View>

          {methodologyOpen ? (
            <View style={styles.methodology}>
              <View style={styles.methodologyHead}>
                <Text style={styles.methodologyTitle}>이 콘텐츠는 어떻게 만들어지나요?</Text>
                <GlassButton
                  systemImage="xmark"
                  onPress={() => setMethodologyOpen(false)}
                  style={styles.methodologyClose}
                />
              </View>
              <View style={styles.methodologyBlock}>
                <Text style={styles.methodologyLabel}>데이터 출처</Text>
                <Text style={styles.methodologyText}>
                  법안의 제목·제안자·소관위원회·상태는 국회 의안정보 Open API에서 가져옵니다. 본문 설명과 진보·보수 관점은 뉴스·국회 자료를 바탕으로 AI가 작성해요.
                </Text>
              </View>
              <View style={styles.methodologyBlock}>
                <Text style={styles.methodologyLabel}>중립성 원칙</Text>
                <Text style={styles.methodologyText}>
                  좌우지간은 어느 진영도 대변하지 않습니다. 진보·보수 관점은 동일한 분량과 동일한 시각적 비중으로 제시됩니다.
                </Text>
              </View>
              <View style={styles.methodologyBlock}>
                <Text style={styles.methodologyLabel}>한계와 주의사항</Text>
                <Text style={styles.methodologyText}>
                  원문이 공개 API로 제공되지 않는 경우 AI 추론이 포함될 수 있습니다. 정확한 조항·표결·의결 내용은 국회 원문에서 확인해주세요.
                </Text>
              </View>
            </View>
          ) : null}

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

          {!isExpired ? (
            <View style={styles.battleSection}>
              <Text style={styles.battleTitle}>AI 토론 배틀</Text>
              <Text style={styles.battleDesc}>진보·보수 AI의 논쟁을 지켜보거나 직접 편을 골라 참여해보세요.</Text>
              <View style={styles.battleActions}>
                <GlassButton
                  label="진보 편으로 참여"
                  tintColor={colors.blue500}
                  onPress={() => router.push('/arena/' + id + '/battle?stance=progressive')}
                  style={styles.battleBtn}
                />
                <GlassButton
                  label="보수 편으로 참여"
                  tintColor={colors.politicalRed}
                  onPress={() => router.push('/arena/' + id + '/battle?stance=conservative')}
                  style={styles.battleBtn}
                />
              </View>
              <GlassButton
                label="구경만 할래요"
                onPress={() => router.push('/arena/' + id + '/battle?stance=watch')}
                style={styles.watchBtn}
              />
            </View>
          ) : null}

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
  expiredBanner: { padding: spacing[3], borderRadius: 8, backgroundColor: colors.grey100 },
  expiredText: { ...typography.bodySmall, color: colors.grey600 },
  header: { gap: spacing[3] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  titleActions: { flexDirection: 'row', gap: spacing[1], paddingTop: 2 },
  iconBtn: { width: 32, height: 32 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], alignItems: 'center' },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4 },
  statusPass: { backgroundColor: '#dcfce7' },
  statusFail: { backgroundColor: '#fef2f2' },
  statusPending: { backgroundColor: colors.grey100 },
  statusText: { ...typography.caption, fontWeight: '600', color: colors.grey700 },
  title: { ...typography.displayLarge, color: colors.grey900, flex: 1 },
  summary: { ...typography.bodyLarge, color: colors.grey600 },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  sourceLinkBtn: { alignSelf: 'flex-start', height: 32 },
  methodology: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, backgroundColor: colors.grey50 },
  methodologyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  methodologyTitle: { ...typography.subtitle, color: colors.grey900 },
  methodologyClose: { width: 28, height: 28 },
  methodologyBlock: { gap: 4 },
  methodologyLabel: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  methodologyText: { ...typography.bodySmall, color: colors.grey600, lineHeight: 20 },
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
  battleSection: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, backgroundColor: colors.grey50 },
  battleTitle: { ...typography.heading, color: colors.grey900 },
  battleDesc: { ...typography.body, color: colors.grey600 },
  battleActions: { flexDirection: 'row', gap: spacing[2] },
  battleBtn: { flex: 1, minHeight: 44 },
  watchBtn: { minHeight: 36 },
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
