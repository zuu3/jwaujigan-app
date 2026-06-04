import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHome } from '@/api/home';
import { useLocalElection, ELECTION_TYPE_LABELS, ElectionType } from '@/api/local-election';
import { useMe } from '@/api/me';
import { useMyFollows } from '@/api/mypage';
import { useLocalPoliticians } from '@/api/politicians';
import { useAuth } from '@/auth/auth-context';
import { IssueCard } from '@/components/issue-card';
import { LocalElectionSection } from '@/components/local-election-section';
import { PollCard } from '@/components/poll-card';
import { Screen } from '@/components/screen';
import { ErrorPanel, SkeletonList } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ELECTION_TYPE_ORDER: ElectionType[] = [
  'governor', 'superintendent', 'mayor', 'provincial', 'provincialPr', 'local', 'localPr',
];

function partyColor(jdName: string) {
  if (jdName.includes('민주') || jdName.includes('조국')) return colors.blue500;
  if (jdName.includes('국민의힘') || jdName.includes('국민의 힘')) return colors.politicalRed;
  return colors.grey500;
}

function timeLabel(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return '마감';
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  return d >= 1 ? `${d}일 남음` : `${h}시간 남음`;
}

function GuideSheet({ onClose }: { onClose: () => void }) {
  const steps = [
    { n: '1', label: '이슈 카드에서 입장 비교를 눌러요', desc: '진보와 보수의 입장을 나란히 확인할 수 있어요' },
    { n: '2', label: '마음에 드는 입장에 투표해요', desc: '진보·보수·모르겠음 중 한 가지를 선택해요' },
    { n: '3', label: 'AI 배틀로 더 깊이 파고들어요', desc: '투표 후 AI가 두 입장을 직접 토론해요' },
  ];
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={guide.overlay} onPress={onClose} />
      <View style={guide.sheet}>
        <View style={guide.handle} />
        <Text style={guide.title}>좌우지간 사용법</Text>
        {steps.map((s) => (
          <View key={s.n} style={guide.step}>
            <View style={guide.num}><Text style={guide.numText}>{s.n}</Text></View>
            <View style={guide.stepContent}>
              <Text style={guide.stepLabel}>{s.label}</Text>
              <Text style={guide.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
        <Pressable style={guide.startBtn} onPress={onClose}>
          <Text style={guide.startText}>시작하기</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const homeQuery = useHome(token);
  const meQuery = useMe(token);
  const politiciansQuery = useLocalPoliticians(token);
  const electionQuery = useLocalElection(token);
  const followsQuery = useMyFollows(token);
  const [showGuide, setShowGuide] = useState(false);
  const [balanceMode, setBalanceMode] = useState(false);

  const streak = meQuery.data?.streak ?? 0;
  const todayActive = meQuery.data?.today_active ?? false;
  const displayName = meQuery.data?.name ?? user?.name ?? null;
  const district = meQuery.data?.district ?? user?.district ?? null;
  const hasPoliticalProfile = meQuery.data?.hasPoliticalProfile ?? false;
  const needsOnboarding = !district || !hasPoliticalProfile;

  const streakLabel = streak >= 2 && todayActive
    ? `${streak}일 연속 참여 중`
    : streak >= 1 && !todayActive
    ? `오늘 참여하면 ${streak + 1}일 연속이에요`
    : null;

  const introTitle = needsOnboarding
    ? (!district ? '내 지역구를 먼저 설정해 볼까요?' : '정치 성향 분석을 마무리해 볼까요?')
    : '진보·보수 두 입장을 직접 비교하고 AI 토론을 판정해보세요.';

  const politicians = politiciansQuery.data?.politicians ?? [];
  const issues = homeQuery.data?.issues ?? [];
  const followedNames = new Set((followsQuery.data ?? []).map((f) => f.name));
  const followingIssues = issues.filter(
    (i) => i.proposer && [...followedNames].some((name) => i.proposer!.includes(name))
  );

  const userLean = (() => {
    const p = issues.filter((i) => i.user_vote === 'progressive').length;
    const c = issues.filter((i) => i.user_vote === 'conservative').length;
    if (p > c) return 'progressive';
    if (c > p) return 'conservative';
    return null;
  })();

  const displayedIssues = balanceMode && userLean === 'progressive'
    ? [...issues].sort((a) => a.user_vote === 'conservative' ? -1 : 1)
    : issues;

  useEffect(() => {
    if (!needsOnboarding && !homeQuery.isLoading && issues.length > 0) {
      void AsyncStorage.getItem('home_guide_seen').then((v) => {
        if (!v) setShowGuide(true);
      });
    }
  }, [needsOnboarding, homeQuery.isLoading, issues.length]);

  function closeGuide() {
    void AsyncStorage.setItem('home_guide_seen', '1');
    setShowGuide(false);
  }

  const hasElectionData = electionQuery.data && ELECTION_TYPE_ORDER.some(
    (t) => (electionQuery.data!.candidates[t]?.length ?? 0) > 0
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={(homeQuery.isFetching || meQuery.isFetching) && !homeQuery.isLoading}
          onRefresh={() => { void homeQuery.refetch(); void meQuery.refetch(); void politiciansQuery.refetch(); void electionQuery.refetch(); }}
          tintColor={colors.blue500}
        />
      }
    >
      {showGuide ? <GuideSheet onClose={closeGuide} /> : null}

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.eyebrow}>{displayName ? `오늘, ${displayName}님` : '오늘'}</Text>
          {streakLabel ? (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>{streakLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>{introTitle}</Text>
        <Pressable
          style={styles.cta}
          onPress={() => needsOnboarding ? router.push('/onboarding') : router.push('/(tabs)/issues')}
        >
          <Text style={styles.ctaText}>
            {needsOnboarding ? (!district ? '지역구 설정' : '성향 분석 이어가기') : '이슈 바로 보기'}
          </Text>
        </Pressable>
      </View>

      {/* 지역구 의원 */}
      {district ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 지역구 의원</Text>
            <Text style={styles.sectionSub}>{district}</Text>
          </View>
          {politiciansQuery.isLoading ? <SkeletonList count={2} lines={2} /> : null}
          {politiciansQuery.isError ? (
            <ErrorPanel message="의원 정보를 불러오지 못했어요." onRetry={() => void politiciansQuery.refetch()} />
          ) : null}
          {politicians.length === 0 && !politiciansQuery.isLoading ? (
            <Text style={styles.emptyText}>이 지역구로 등록된 의원이 없어요.</Text>
          ) : null}
          {politicians.map((pol) => (
            <Pressable key={pol.id} style={styles.politicianCard} onPress={() => router.push('/politicians/' + pol.id)}>
              <View style={styles.politicianAvatar}>
                {pol.image ? (
                  <Image source={{ uri: pol.image }} style={styles.politicianImg} />
                ) : (
                  <Text style={styles.politicianInitial}>{pol.name[0]}</Text>
                )}
              </View>
              <View style={styles.politicianInfo}>
                <View style={styles.politicianNameRow}>
                  <Text style={styles.politicianName}>{pol.name}</Text>
                  <View style={[styles.partyBadge, { borderColor: partyColor(pol.party) }]}>
                    <Text style={[styles.partyText, { color: partyColor(pol.party) }]}>{pol.party}</Text>
                  </View>
                </View>
                {pol.committee ? <Text style={styles.politicianMeta}>{pol.committee}</Text> : null}
                {pol.reelection ? <Text style={styles.politicianMeta}>{pol.reelection}</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* 지방선거 */}
      {district ? (
        <View style={styles.section}>
          <LocalElectionSection
            isLoading={electionQuery.isLoading}
            isError={electionQuery.isError}
            data={electionQuery.data}
            onRetry={() => void electionQuery.refetch()}
            district={district}
          />
        </View>
      ) : null}

      {/* 팔로잉 이슈 */}
      {followingIssues.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>팔로잉 이슈</Text>
            <Text style={styles.sectionSub}>{followingIssues.length}건</Text>
          </View>
          {followingIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onPress={() => router.push('/issues/' + issue.id)} />
          ))}
        </View>
      ) : null}

      {/* 핫이슈 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>핫이슈</Text>
          {issues.length > 0 ? <Text style={styles.sectionSub}>{issues.length}건</Text> : null}
          <View style={styles.sectionActions}>
            {issues.length > 0 ? (
              <Pressable
                style={[styles.balanceChip, balanceMode && styles.balanceChipActive]}
                onPress={() => setBalanceMode((v) => !v)}
              >
                <Text style={[styles.balanceText, balanceMode && styles.balanceTextActive]}>
                  균형 모드{balanceMode && userLean ? (userLean === 'progressive' ? ' · 보수↑' : ' · 진보↑') : ''}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push('/(tabs)/issues')}>
              <Text style={styles.moreLink}>전체 보기 →</Text>
            </Pressable>
          </View>
        </View>
        {homeQuery.isLoading ? <SkeletonList count={3} lines={4} /> : null}
        {homeQuery.isError && !homeQuery.data ? (
          <ErrorPanel message="이슈를 불러오지 못했어요." onRetry={() => void homeQuery.refetch()} />
        ) : null}
        {displayedIssues.slice(0, 5).map((issue) => (
          <IssueCard key={issue.id} issue={issue} onPress={() => router.push('/issues/' + issue.id)} />
        ))}
      </View>

      {/* 민심투표 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>민심투표</Text>
          <Pressable onPress={() => router.push('/(tabs)/community')}>
            <Text style={styles.moreLink}>더 보기 →</Text>
          </Pressable>
        </View>
        {homeQuery.isLoading ? <SkeletonList count={2} lines={3} /> : null}
        {homeQuery.isError && !homeQuery.data ? (
          <ErrorPanel message="투표를 불러오지 못했어요." onRetry={() => void homeQuery.refetch()} />
        ) : null}
        {homeQuery.data?.polls.slice(0, 3).map((poll) => (
          <PollCard key={poll.id} poll={poll} onPress={() => router.push('/community/polls/' + poll.id)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing[3], paddingVertical: spacing[4] },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...typography.bodySmall, color: colors.grey600, fontWeight: '600' },
  streakBadge: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 20, backgroundColor: colors.blue50 },
  streakText: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  title: { ...typography.displayLarge, color: colors.grey900 },
  cta: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing[4], borderRadius: 8, backgroundColor: colors.grey900 },
  ctaText: { ...typography.body, color: colors.white, fontWeight: '600' },
  section: { gap: spacing[3] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  sectionTitle: { ...typography.heading, color: colors.grey900 },
  sectionSub: { ...typography.bodySmall, color: colors.grey500 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginLeft: 'auto' },
  balanceChip: { paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  balanceChipActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  balanceText: { ...typography.caption, color: colors.grey600, fontWeight: '600' },
  balanceTextActive: { color: colors.blue500 },
  moreLink: { ...typography.bodySmall, color: colors.blue500, fontWeight: '600' },
  emptyText: { ...typography.body, color: colors.grey500 },
  politicianCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  politicianAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.blue50, alignItems: 'center', justifyContent: 'center' },
  politicianImg: { width: 40, height: 40, borderRadius: 20 },
  politicianInitial: { ...typography.subtitle, color: colors.blue500 },
  politicianInfo: { flex: 1, gap: 4 },
  politicianNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  politicianName: { ...typography.subtitle, color: colors.grey900 },
  politicianMeta: { ...typography.caption, color: colors.grey500 },
  partyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  partyText: { ...typography.caption, fontWeight: '600' },
  electionGroup: { gap: spacing[2] },
  electionTypeLabel: { ...typography.bodySmall, color: colors.grey500, fontWeight: '700' },
  electionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: 10, borderWidth: 1, borderColor: colors.grey200 },
  electionLeft: { alignItems: 'center', justifyContent: 'center' },
  electionPhoto: { width: 40, height: 50, borderRadius: 6 },
  electionPhotoFallback: { width: 40, height: 50, borderRadius: 6, backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center' },
  electionInitial: { ...typography.subtitle, color: colors.grey500 },
  electionInfo: { flex: 1, gap: 4 },
  electionName: { ...typography.subtitle, color: colors.grey900 },
  electionMeta: { ...typography.caption, color: colors.grey500 },
});

const guide = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing[6], gap: spacing[4] },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.grey300, alignSelf: 'center', marginBottom: spacing[2] },
  title: { ...typography.headingLarge, color: colors.grey900 },
  step: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center' },
  numText: { ...typography.body, color: colors.white, fontWeight: '700' },
  stepContent: { flex: 1, gap: 3 },
  stepLabel: { ...typography.subtitle, color: colors.grey900 },
  stepDesc: { ...typography.body, color: colors.grey600 },
  startBtn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blue500, marginTop: spacing[2] },
  startText: { ...typography.subtitle, color: colors.white },
});
