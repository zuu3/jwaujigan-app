import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useMe } from '@/api/me';
import { useMyActivity, useMyFollows, useMyPoliticalProfile, useMyPolls, useReferralInfo } from '@/api/mypage';
import { apiDelete, apiPatch } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { PageHeader, Screen } from '@/components/screen';
import { SkeletonCard } from '@/components/state-panels';
import { AXIS_LABELS } from '@/data/questions';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useQueryClient } from '@tanstack/react-query';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function getInitial(name: string | null | undefined, email: string | null | undefined) {
  return (name?.trim()?.[0] ?? email?.trim()?.[0] ?? 'U').toUpperCase();
}

function AxisBar({ label, score }: { label: string; score: number }) {
  const p = Math.round(((score + 100) / 200) * 100);
  const isProgressive = score >= 30;
  const isConservative = score <= -30;
  const barColor = isProgressive ? colors.blue500 : isConservative ? colors.politicalRed : colors.grey400;
  const leanLabel = isProgressive ? '진보' : isConservative ? '보수' : '중도';
  return (
    <View style={ax.row}>
      <View style={ax.labelRow}>
        <Text style={ax.label}>{label}</Text>
        <Text style={[ax.lean, { color: barColor }]}>{leanLabel}</Text>
      </View>
      <View style={ax.trackWrap}>
        <Text style={ax.end}>보수</Text>
        <View style={ax.track}>
          <View style={ax.center} />
          <View style={[ax.fill, { width: `${p}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={ax.end}>진보</Text>
      </View>
    </View>
  );
}

function SectionBox({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <View style={sec.header}>
        <Text style={sec.title}>{title}</Text>
        {subtitle ? <Text style={sec.sub}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function StreakCalendar({ activeDates, streak, todayActive }: { activeDates: string[]; streak: number; todayActive: boolean }) {
  const activeSet = new Set(activeDates);
  const WEEKS = 14;
  const CELL = 11;
  const GAP = 3;

  const kstNow = new Date(Date.now() + 9 * 3_600_000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayStr = kstNow.toISOString().slice(0, 10);
  const start = new Date(kstNow.getTime() - (WEEKS * 7 - 1) * 86_400_000);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const cursor = new Date(start);
  const weeks: string[][] = [];
  while (cursor <= kstNow) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      week.push(iso <= todayStr ? iso : 'future');
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  const pillLabel = streak > 0
    ? (todayActive ? `${streak}일 연속` : `${streak}일 — 오늘 참여하면 ${streak + 1}일`)
    : '아직 연속 기록이 없어요';

  return (
    <SectionBox title="참여 기록" subtitle="최근 14주">
      <View style={cal.pillRow}>
        <View style={[cal.pill, streak > 0 && cal.pillActive]}>
          <Text style={[cal.pillText, streak > 0 && cal.pillTextActive]}>{pillLabel}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={cal.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: GAP }}>
              {week.map((date, di) => (
                <View
                  key={di}
                  style={[
                    cal.cell,
                    { width: CELL, height: CELL },
                    date === 'future' ? { backgroundColor: 'transparent' }
                    : activeSet.has(date) ? { backgroundColor: colors.blue500 }
                    : { backgroundColor: colors.grey100 },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SectionBox>
  );
}

export default function MyPageScreen() {
  const { token, user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const meQuery = useMe(token);
  const profileQuery = useMyPoliticalProfile(token);
  const activityQuery = useMyActivity(token);
  const followsQuery = useMyFollows(token);
  const referralQuery = useReferralInfo(token);
  const pollsQuery = useMyPolls(token);

  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'loading'>('idle');

  const profile = meQuery.data;
  const politicalProfile = profileQuery.data?.politicalProfile;
  const battleLogs = profileQuery.data?.battleLogs ?? [];
  const activity = activityQuery.data;
  const follows = followsQuery.data ?? [];
  const referral = referralQuery.data;
  const myPolls = pollsQuery.data ?? [];

  const displayName = profile?.name ?? user?.name ?? '사용자';
  const email = profile?.email ?? user?.email ?? '';
  const district = profile?.district ?? user?.district ?? null;
  const points = profile?.points ?? 0;
  const streak = activity?.streak ?? profile?.streak ?? 0;
  const isPublic = profile?.is_public ?? true;
  const level = profile?.level;

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  async function handleInvite() {
    if (!referral) return;
    try {
      await Share.share({ title: '좌우지간 — 선동 없는 정치 정보', url: referral.referralUrl });
    } catch { /* cancelled */ }
  }

  async function handleVisibilityToggle() {
    if (visibilityLoading || !token) return;
    setVisibilityLoading(true);
    try {
      await apiPatch('/api/me/visibility', { is_public: !isPublic }, { token });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch {
      Alert.alert('오류', '프로필 공개 설정 변경에 실패했어요.');
    }
    setVisibilityLoading(false);
  }

  async function handleDeleteAccount() {
    if (!token) return;
    setDeleteStep('loading');
    try {
      await apiDelete('/api/me', { token });
      await signOut();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('오류', '탈퇴에 실패했습니다. 다시 시도해주세요.');
      setDeleteStep('idle');
    }
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={meQuery.isFetching && !meQuery.isLoading}
          onRefresh={() => { void meQuery.refetch(); void profileQuery.refetch(); void activityQuery.refetch(); }}
          tintColor={colors.blue500}
        />
      }
    >
      <PageHeader title="마이페이지" />

      {/* 프로필 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(displayName, email)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {district ? <Text style={styles.district}>📍 {district}</Text> : null}
          {level ? (
            <View style={styles.levelRow}>
              <Text style={styles.levelTitle}>{level.title}</Text>
              <Text style={styles.levelSep}>•</Text>
              <Text style={styles.levelPoints}>{(points ?? 0).toLocaleString()}점</Text>
            </View>
          ) : (
            <Text style={styles.levelPoints}>{(points ?? 0).toLocaleString()}P</Text>
          )}
          {level ? (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${level.progress ?? 0}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                {level.next != null ? `다음 등급까지 ${((level.next - (points ?? 0)) ?? 0).toLocaleString()}점` : '최고 등급'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 통계 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}일</Text>
          <Text style={styles.statLabel}>연속 참여</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{battleLogs.length}전</Text>
          <Text style={styles.statLabel}>배틀 기록</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activity?.summary.total_issues ?? 0}</Text>
          <Text style={styles.statLabel}>이슈 참여</Text>
        </View>
      </View>

      {/* 액션 바 */}
      <View style={styles.actionBar}>
        <Pressable style={styles.actionChip} onPress={() => router.push('/onboarding')}>
          <Text style={styles.actionChipText}>성향 재검사</Text>
        </Pressable>
        {referral ? (
          <Pressable
            style={[styles.actionChip, referral.todayCount >= 3 && styles.actionChipDisabled]}
            disabled={referral.todayCount >= 3}
            onPress={handleInvite}
          >
            <Text style={styles.actionChipText}>
              친구 초대{referral.count > 0 ? ` · ${referral.count}명` : ''}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* 공개 여부 */}
      <View style={styles.visibilityRow}>
        <Text style={styles.visibilityLabel}>{isPublic ? '🌐 공개' : '🔒 비공개'}</Text>
        <Switch
          value={isPublic}
          onValueChange={() => void handleVisibilityToggle()}
          disabled={visibilityLoading}
          trackColor={{ false: colors.grey200, true: colors.blue500 }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.grey200}
        />
      </View>

      {/* 정치 성향 */}
      <SectionBox
        title="정치 성향"
        subtitle={politicalProfile?.completed_at ? `${formatDate(politicalProfile.completed_at)} 완료` : undefined}
      >
        {profileQuery.isLoading ? <SkeletonCard lines={3} /> : null}
        {politicalProfile ? (
          <View style={styles.card}>
            <View style={styles.politicalTypeRow}>
              <Text style={styles.politicalTypeBadge}>나의 정치 성향</Text>
              <Text style={styles.politicalType}>{politicalProfile.political_type}</Text>
            </View>
            <AxisBar label={AXIS_LABELS.economic} score={politicalProfile.economic_score} />
            <AxisBar label={AXIS_LABELS.security} score={politicalProfile.security_score} />
            <AxisBar label={AXIS_LABELS.social} score={politicalProfile.social_score} />
          </View>
        ) : !profileQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 성향 분석을 하지 않았어요</Text>
            <Text style={styles.emptyDesc}>15문항으로 경제·안보·사회 3축 성향을 분석해 드려요.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/onboarding')}>
              <Text style={styles.emptyBtnText}>3분 성향 테스트 시작하기 →</Text>
            </Pressable>
          </View>
        ) : null}
      </SectionBox>

      {/* 내 활동 */}
      <SectionBox
        title="내 활동"
        subtitle={activity ? `총 ${activity.summary.total_issues}개 이슈 참여` : undefined}
      >
        {activityQuery.isLoading ? <SkeletonCard lines={2} /> : null}
        {activity && activity.summary.total_issues > 0 ? (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryValue}>{activity.summary.total_issues}</Text>
                <Text style={styles.summaryLabel}>이슈 참여</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBlock}>
                <View style={styles.voteRatioBar}>
                  <View style={[styles.voteRatioFill, { flex: activity.summary.vote_ratio.progressive, backgroundColor: colors.blue500 }]} />
                  <View style={[styles.voteRatioFill, { flex: activity.summary.vote_ratio.neutral, backgroundColor: colors.grey300 }]} />
                  <View style={[styles.voteRatioFill, { flex: activity.summary.vote_ratio.conservative, backgroundColor: colors.politicalRed }]} />
                </View>
                <Text style={styles.summaryLabel}>투표 성향</Text>
              </View>
            </View>
            {activity.activities.slice(0, 5).map((a, i) => (
              <View key={i} style={styles.activityItem}>
                <Text style={styles.activityLabel}>{a.label}</Text>
                <Text style={styles.activityDate}>{formatDate(a.created_at)}</Text>
              </View>
            ))}
          </>
        ) : !activityQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 참여한 이슈가 없어요</Text>
            <Text style={styles.emptyDesc}>이슈에 투표하거나 배틀을 완료하면 활동 기록이 쌓여요.</Text>
          </View>
        ) : null}
      </SectionBox>

      {/* 참여 캘린더 */}
      {activity ? (
        <StreakCalendar
          activeDates={activity.active_dates}
          streak={activity.streak}
          todayActive={activity.today_active}
        />
      ) : null}

      {/* 뱃지 */}
      {activity?.badges && activity.badges.length > 0 ? (
        <SectionBox title="뱃지">
          <View style={styles.badgeGrid}>
            {activity.badges.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardDim]}>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
                {badge.earned ? <Text style={styles.badgeEarned}>획득 완료</Text> : null}
              </View>
            ))}
          </View>
        </SectionBox>
      ) : null}

      {/* 배틀 전적 */}
      <SectionBox title="배틀 전적" subtitle={`전체 ${battleLogs.length}전`}>
        {profileQuery.isLoading ? <SkeletonCard lines={3} /> : null}
        {battleLogs.length > 0 ? (
          battleLogs.slice(0, 5).map((log) => (
            <View key={log.id} style={styles.battleItem}>
              <Text style={styles.battleTopic} numberOfLines={2}>{log.topic}</Text>
              <Text style={styles.battleDate}>{formatDate(log.created_at)}</Text>
            </View>
          ))
        ) : !profileQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 배틀 기록이 없어요</Text>
            <Text style={styles.emptyDesc}>이슈에서 진보·보수 AI의 논쟁을 직접 판정해 보세요.</Text>
          </View>
        ) : null}
      </SectionBox>

      {/* 내 투표 */}
      {myPolls.length > 0 ? (
        <SectionBox title="내가 만든 투표">
          {myPolls.map((poll) => {
            const diff = new Date(poll.expires_at).getTime() - Date.now();
            const expired = diff <= 0;
            const days = Math.floor(diff / 86_400_000);
            const timeLabel = expired ? '마감' : days >= 1 ? `${days}일 남음` : `${Math.floor(diff / 3_600_000)}시간 남음`;
            return (
              <View key={poll.id} style={styles.pollItem}>
                <Text style={styles.pollQuestion} numberOfLines={2}>{poll.question}</Text>
                <View style={styles.pollMeta}>
                  <Text style={styles.pollMetaText}>{(poll.total_count ?? 0).toLocaleString()}명 참여</Text>
                  <Text style={[styles.pollMetaText, expired && styles.pollExpired]}>{timeLabel}</Text>
                </View>
              </View>
            );
          })}
        </SectionBox>
      ) : null}

      {/* 팔로잉 의원 */}
      {follows.length > 0 ? (
        <SectionBox title="팔로잉 의원">
          {follows.map((pol) => (
            <View key={pol.id} style={styles.followItem}>
              <View style={styles.followAvatar}>
                {pol.image ? (
                  <Image source={{ uri: pol.image }} style={styles.followImg} />
                ) : (
                  <Text style={styles.followInitial}>{pol.name[0]}</Text>
                )}
              </View>
              <Text style={styles.followName}>{pol.name}</Text>
              <Text style={styles.followDate}>{formatDate(pol.followed_at)}</Text>
            </View>
          ))}
        </SectionBox>
      ) : null}

      {/* 로그아웃 */}
      <Pressable style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </Pressable>

      {/* 회원 탈퇴 */}
      <View style={styles.deleteRow}>
        <Pressable onPress={() => setDeleteStep('confirm')}>
          <Text style={styles.deleteLink}>회원 탈퇴</Text>
        </Pressable>
      </View>

      {/* 탈퇴 확인 모달 */}
      <Modal visible={deleteStep !== 'idle'} transparent animationType="fade" onRequestClose={() => { if (deleteStep !== 'loading') setDeleteStep('idle'); }}>
        <View style={del.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (deleteStep !== 'loading') setDeleteStep('idle'); }} />
          <View style={del.modal}>
            <Text style={del.title}>정말 탈퇴하시겠어요?</Text>
            <Text style={del.body}>탈퇴하면 투표 기록, 팔로우, 댓글 등 모든 데이터가 삭제되며 복구할 수 없습니다.</Text>
            <View style={del.actions}>
              <Pressable style={del.cancelBtn} onPress={() => setDeleteStep('idle')} disabled={deleteStep === 'loading'}>
                <Text style={del.cancelText}>취소</Text>
              </Pressable>
              <Pressable style={[del.confirmBtn, deleteStep === 'loading' && del.disabledBtn]} onPress={() => void handleDeleteAccount()} disabled={deleteStep === 'loading'}>
                <Text style={del.confirmText}>{deleteStep === 'loading' ? '처리 중…' : '탈퇴하기'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.grey900, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { ...typography.heading, color: colors.white },
  profileInfo: { flex: 1, gap: 3 },
  name: { ...typography.subtitle, color: colors.grey900 },
  email: { ...typography.bodySmall, color: colors.grey500 },
  district: { ...typography.bodySmall, color: colors.grey600 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  levelTitle: { ...typography.bodySmall, color: colors.blue500, fontWeight: '700' },
  levelSep: { ...typography.bodySmall, color: colors.grey400 },
  levelPoints: { ...typography.bodySmall, color: colors.blue500, fontWeight: '600', marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 2 },
  progressTrack: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.grey200, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.blue500 },
  progressLabel: { ...typography.caption, color: colors.grey500 },
  statsRow: { flexDirection: 'row', gap: spacing[3] },
  statCard: { flex: 1, padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, gap: 4 },
  statValue: { ...typography.heading, color: colors.grey900 },
  statLabel: { ...typography.caption, color: colors.grey500 },
  actionBar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  actionChip: { paddingHorizontal: spacing[3], paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.grey200 },
  actionChipDisabled: { opacity: 0.4 },
  actionChipText: { ...typography.bodySmall, color: colors.grey700, fontWeight: '600' },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[2], borderTopWidth: 1, borderTopColor: colors.grey100, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  visibilityLabel: { ...typography.body, color: colors.grey700 },
  card: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  politicalTypeRow: { gap: 4 },
  politicalTypeBadge: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  politicalType: { ...typography.headingLarge, color: colors.grey900 },
  emptyCard: { gap: spacing[2], padding: spacing[4], borderRadius: 12, backgroundColor: colors.grey50 },
  emptyTitle: { ...typography.subtitle, color: colors.grey700 },
  emptyDesc: { ...typography.body, color: colors.grey500 },
  emptyBtn: { alignSelf: 'flex-start', marginTop: spacing[1] },
  emptyBtnText: { ...typography.bodySmall, color: colors.blue500, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, gap: spacing[4] },
  summaryBlock: { flex: 1, gap: 6 },
  summaryValue: { ...typography.heading, color: colors.grey900 },
  summaryLabel: { ...typography.caption, color: colors.grey500 },
  summaryDivider: { width: 1, backgroundColor: colors.grey200 },
  voteRatioBar: { flexDirection: 'row', height: 8, borderRadius: 999, overflow: 'hidden' },
  voteRatioFill: { height: 8 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  activityLabel: { ...typography.body, color: colors.grey800, flex: 1 },
  activityDate: { ...typography.caption, color: colors.grey500 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  badgeCard: { width: '47%', padding: spacing[3], borderRadius: 10, borderWidth: 1, borderColor: colors.grey200, gap: 4 },
  badgeCardDim: { opacity: 0.4 },
  badgeTitle: { ...typography.bodySmall, color: colors.grey900, fontWeight: '700' },
  badgeDesc: { ...typography.caption, color: colors.grey500 },
  badgeEarned: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  battleItem: { paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.grey100, gap: 3 },
  battleTopic: { ...typography.body, color: colors.grey800 },
  battleDate: { ...typography.caption, color: colors.grey500 },
  pollItem: { paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.grey100, gap: spacing[1] },
  pollQuestion: { ...typography.body, color: colors.grey900 },
  pollMeta: { flexDirection: 'row', gap: spacing[3] },
  pollMetaText: { ...typography.caption, color: colors.grey500 },
  pollExpired: { color: colors.grey400 },
  followItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  followAvatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center' },
  followImg: { width: 36, height: 36 },
  followInitial: { ...typography.body, color: colors.grey600 },
  followName: { ...typography.body, color: colors.grey900, flex: 1 },
  followDate: { ...typography.caption, color: colors.grey500 },
  signOut: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.grey200 },
  signOutText: { ...typography.body, color: colors.grey700, fontWeight: '600' },
  deleteRow: { alignItems: 'center', paddingVertical: spacing[2] },
  deleteLink: { ...typography.caption, color: colors.grey400, textDecorationLine: 'underline' },
});

const sec = StyleSheet.create({
  wrap: { gap: spacing[3] },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  title: { ...typography.heading, color: colors.grey900 },
  sub: { ...typography.caption, color: colors.grey500 },
});

const ax = StyleSheet.create({
  row: { gap: spacing[1] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...typography.bodySmall, color: colors.grey700, fontWeight: '600' },
  lean: { ...typography.caption, fontWeight: '700' },
  trackWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  end: { ...typography.caption, color: colors.grey400, width: 24 },
  track: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.grey100, overflow: 'hidden' },
  center: { position: 'absolute', left: '50%', top: 0, width: 1, height: 10, backgroundColor: colors.grey300, zIndex: 1 },
  fill: { height: 10, borderRadius: 999 },
});

const cal = StyleSheet.create({
  pillRow: { marginBottom: spacing[2] },
  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: 3, borderRadius: 999, backgroundColor: colors.grey100 },
  pillActive: { backgroundColor: colors.blue50 },
  pillText: { ...typography.caption, color: colors.grey500, fontWeight: '600' },
  pillTextActive: { color: colors.blue500 },
  grid: { flexDirection: 'row', gap: 3 },
  cell: { borderRadius: 3 },
});

const del = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2,9,19,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing[5] },
  modal: { width: '100%', maxWidth: 340, backgroundColor: colors.white, borderRadius: 16, padding: spacing[5], gap: spacing[3] },
  title: { ...typography.subtitle, color: colors.grey900 },
  body: { ...typography.body, color: colors.grey600, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing[2] },
  cancelBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.grey200 },
  cancelText: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  confirmBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.red500 },
  disabledBtn: { opacity: 0.5 },
  confirmText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
