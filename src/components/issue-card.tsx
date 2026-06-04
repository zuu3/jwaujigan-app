import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVoteIssue } from '@/api/issues';
import { useAuth } from '@/auth/auth-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Issue, IssueVoteStance } from '@/types/domain';

const VOTE_OPTIONS: { stance: IssueVoteStance; label: string; barLabel: string; color: string; tint: string }[] = [
  { stance: 'progressive', label: '진보 지지', barLabel: '진보', color: colors.blue500, tint: colors.blue50 },
  { stance: 'neutral', label: '모르겠음', barLabel: '모름', color: colors.grey500, tint: colors.grey100 },
  { stance: 'conservative', label: '보수 지지', barLabel: '보수', color: colors.politicalRed, tint: colors.politicalRedLight },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `발의일 ${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function pct(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function IssueCard({ issue, onPress }: { issue: Issue; onPress?: () => void }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const voteMutation = useVoteIssue(issue.id, token);

  const totalVotes = issue.vote_counts?.total ?? 0;
  const navigate = onPress ?? (() => router.push('/issues/' + issue.id));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {issue.committee ? <Text style={styles.badge}>{issue.committee}</Text> : null}
          {issue.proposer ? <Text style={styles.meta}>{issue.proposer}</Text> : null}
        </View>
        {totalVotes > 0 ? <Text style={styles.meta}>{totalVotes.toLocaleString()}명 참여</Text> : null}
      </View>

      <Pressable onPress={navigate}>
        <Text style={styles.title}>{issue.title}</Text>
        <Text style={styles.summary}>{issue.summary}</Text>
      </Pressable>

      {issue.published_at ? <Text style={styles.date}>{formatDate(issue.published_at)}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.toggleBtn} onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.toggleText}>입장 비교</Text>
          <Text style={[styles.chevron, expanded && styles.chevronUp]}>▾</Text>
        </Pressable>
        <Pressable onPress={navigate}>
          <Text style={styles.battleLink}>AI 배틀 →</Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.expanded}>
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

          <View style={styles.voteSection}>
            <Text style={styles.voteLabel}>이 이슈에 대한 입장은?</Text>
            <View style={styles.voteBtns}>
              {VOTE_OPTIONS.map(({ stance, label, color, tint }) => {
                const selected = issue.user_vote === stance;
                return (
                  <Pressable
                    key={stance}
                    style={[
                      styles.voteBtn,
                      { borderColor: color, backgroundColor: selected ? color : 'transparent' },
                      voteMutation.isPending && styles.voteBtnLoading,
                    ]}
                    onPress={() => { if (!voteMutation.isPending) voteMutation.mutate(stance); }}
                    disabled={voteMutation.isPending}
                  >
                    <Text style={[styles.voteBtnText, { color: selected ? colors.white : color }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {totalVotes > 0 ? (
              <View style={styles.voteBars}>
                {VOTE_OPTIONS.map(({ stance, barLabel, color, tint }) => {
                  const p = pct(issue.vote_counts?.[stance] ?? 0, totalVotes);
                  const mine = issue.user_vote === stance;
                  return (
                    <View key={stance} style={styles.voteBarRow}>
                      <Text style={[styles.voteBarLabel, { color: mine ? color : colors.grey400 }]}>{barLabel}</Text>
                      <View style={[styles.voteBarTrack, { backgroundColor: tint }]}>
                        <View style={[styles.voteBarFill, { width: `${p}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={[styles.voteBarPct, mine && styles.voteBarPctActive]}>{p}%</Text>
                    </View>
                  );
                })}
                <Text style={styles.voteTotal}>총 {totalVotes.toLocaleString()}명 참여</Text>
              </View>
            ) : null}

            {issue.user_vote ? (
              <Pressable style={styles.battleCta} onPress={navigate}>
                <Text style={styles.battleCtaText}>⚔ AI 배틀로 더 깊이 파고들기</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3], padding: spacing[4], borderWidth: 1, borderColor: colors.grey200, borderRadius: 12, backgroundColor: colors.white },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[2] },
  topLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], alignItems: 'center', flex: 1 },
  badge: { ...typography.caption, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, overflow: 'hidden', color: colors.grey600, backgroundColor: colors.grey100 },
  meta: { ...typography.caption, color: colors.grey500 },
  date: { ...typography.caption, color: colors.grey400 },
  title: { ...typography.subtitle, color: colors.grey900, marginBottom: spacing[1] },
  summary: { ...typography.body, color: colors.grey600 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toggleText: { ...typography.bodySmall, color: colors.grey700, fontWeight: '500' },
  chevron: { fontSize: 14, color: colors.grey500 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  battleLink: { ...typography.bodySmall, color: colors.grey900, fontWeight: '600' },
  expanded: { gap: spacing[3], paddingTop: spacing[1] },
  stanceGrid: { flexDirection: 'row', gap: spacing[2] },
  stance: { flex: 1, gap: spacing[1], padding: spacing[3], borderRadius: 8 },
  progressive: { backgroundColor: colors.blue50 },
  conservative: { backgroundColor: colors.politicalRedLight },
  stanceLabel: { ...typography.caption, fontWeight: '700' },
  stanceText: { ...typography.bodySmall, color: colors.grey900 },
  voteSection: { gap: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.grey100 },
  voteLabel: { ...typography.caption, color: colors.grey500, fontWeight: '500' },
  voteBtns: { flexDirection: 'row', gap: spacing[2] },
  voteBtn: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1.5 },
  voteBtnLoading: { opacity: 0.55 },
  voteBtnText: { ...typography.bodySmall, fontWeight: '600' },
  voteBars: { gap: spacing[2] },
  voteBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  voteBarLabel: { ...typography.caption, fontWeight: '600', width: 28 },
  voteBarTrack: { flex: 1, height: 6, borderRadius: 99, overflow: 'hidden' },
  voteBarFill: { height: 6, borderRadius: 99 },
  voteBarPct: { ...typography.caption, color: colors.grey500, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'] },
  voteBarPctActive: { color: colors.grey900, fontWeight: '700' },
  voteTotal: { ...typography.caption, color: colors.grey500, textAlign: 'right', fontVariant: ['tabular-nums'] },
  battleCta: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: 8, backgroundColor: colors.grey900 },
  battleCtaText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
