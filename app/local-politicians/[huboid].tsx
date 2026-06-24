import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalElection, ELECTION_TYPE_LABELS } from '@/api/local-election';
import type { ElectionType, ElectionPerson } from '@/api/local-election';
import { useAuth } from '@/auth/auth-context';
import { API_BASE_URL } from '@/api/client';
import { PartyBadge } from '@/components/party-badge';
import { Screen } from '@/components/screen';
import { SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const PLEDGE_SG_TYPES: Partial<Record<ElectionType, number>> = {
  governor: 3,
  mayor: 4,
  superintendent: 11,
};

type PledgeItem = { content: string; sgTypecode: number };

function partyLean(name: string) {
  if (name.includes('민주') || name.includes('조국')) return 'progressive';
  if (name.includes('국민의힘') || name.includes('국민의 힘')) return 'conservative';
  return 'neutral';
}

function partyStyle(lean: 'progressive' | 'conservative' | 'neutral') {
  if (lean === 'progressive') return { bg: colors.blue50, text: colors.blue500 };
  if (lean === 'conservative') return { bg: colors.politicalRedLight, text: colors.politicalRed };
  return { bg: colors.grey100, text: colors.grey600 };
}

export default function LocalPoliticianDetailScreen() {
  const { huboid, type, tab } = useLocalSearchParams<{ huboid: string; type?: ElectionType; tab?: string }>();
  const { token } = useAuth();
  const electionQuery = useLocalElection(token);
  const [pledges, setPledges] = useState<PledgeItem[] | null>(null);

  // 선거 데이터에서 후보자 찾기
  const person: ElectionPerson | null = (() => {
    if (!electionQuery.data) return null;
    const data = electionQuery.data;
    const allTypes = Object.keys({ ...data.candidates, ...data.winners }) as ElectionType[];
    for (const t of allTypes) {
      const inCandidates = data.candidates[t]?.find((p) => p.huboid === huboid);
      if (inCandidates) return inCandidates;
      const inWinners = data.winners[t]?.find((p) => p.huboid === huboid);
      if (inWinners) return inWinners;
    }
    return null;
  })();

  const electionType = type ?? (person?.electionType);
  const isWinner = tab === 'winners';
  const lean = person ? partyLean(person.jdName) : 'neutral';
  const { bg, text } = partyStyle(lean);

  // 공약 불러오기
  useEffect(() => {
    if (!electionType) return;
    const sgTypecode = PLEDGE_SG_TYPES[electionType];
    if (!sgTypecode) { setPledges([]); return; }
    fetch(`${API_BASE_URL}/api/election-pledge?huboid=${huboid}&sgTypecode=${sgTypecode}`)
      .then((r) => r.json())
      .then((d) => setPledges((d.pledges ?? []) as PledgeItem[]))
      .catch(() => setPledges([]));
  }, [huboid, electionType]);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ headerShown: true, title: person?.name ?? '', headerBackTitle: '' }} />

      {electionQuery.isLoading ? <><SkeletonCard lines={3} /><SkeletonCard lines={2} /></> : null}

      {person ? (
        <>
          {/* 프로필 */}
          <View style={styles.profile}>
            {person.photoUrl ? (
              <Image source={{ uri: person.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoInitial}>{person.name[0]}</Text>
              </View>
            )}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                {!isWinner ? <Text style={styles.giho}>기호 {person.giho}</Text> : null}
                <Text style={styles.name}>{person.name}</Text>
              </View>
              {person.job ? <Text style={styles.job}>{person.job}</Text> : null}
              <PartyBadge
                party={person.jdName}
                containerStyle={[styles.partyTag, { backgroundColor: bg }]}
                textStyle={[styles.partyText, { color: text }]}
              />
              {electionType ? (
                <Text style={styles.electionType}>{ELECTION_TYPE_LABELS[electionType]}</Text>
              ) : null}
              {person.wiwName ? <Text style={styles.meta}>{person.wiwName}</Text> : null}
              {isWinner && person.dugyul ? (
                <View style={styles.dugyulBadge}>
                  <Text style={styles.dugyulText}>득표율 {parseFloat(person.dugyul).toFixed(1)}%</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* 경력 */}
          {(person.career1 || person.career2) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>경력</Text>
              {person.career1 ? <Text style={styles.career}>• {person.career1}</Text> : null}
              {person.career2 ? <Text style={styles.career}>• {person.career2}</Text> : null}
            </View>
          ) : null}

          {/* 공약 */}
          {pledges === null ? (
            <SkeletonCard lines={4} />
          ) : pledges.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>선거 공약</Text>
              {pledges.slice(0, 3).map((p, i) => (
                <View key={i} style={styles.pledgeCard}>
                  <Text style={styles.pledgeText}>{p.content.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim().slice(0, 300)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : !electionQuery.isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>후보자 정보를 찾을 수 없어요.</Text>
          <Text style={styles.emptyDesc}>선거 데이터가 아직 로드되지 않았을 수 있어요.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', gap: spacing[4], alignItems: 'flex-start' },
  photo: { width: 72, height: 90, borderRadius: 8, flexShrink: 0 },
  photoFallback: { width: 72, height: 90, borderRadius: 8, backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  photoInitial: { ...typography.headingLarge, color: colors.grey400 },
  info: { flex: 1, gap: spacing[1] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  giho: { ...typography.caption, color: colors.grey400 },
  name: { ...typography.headingLarge, color: colors.grey900 },
  job: { ...typography.body, color: colors.grey500 },
  partyTag: { alignSelf: 'flex-start', paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4 },
  partyText: { ...typography.caption, fontWeight: '600' },
  electionType: { ...typography.bodySmall, color: colors.grey600 },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  dugyulBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, backgroundColor: colors.grey100 },
  dugyulText: { ...typography.caption, color: colors.grey700, fontWeight: '600' },
  section: { gap: spacing[2] },
  sectionTitle: { ...typography.heading, color: colors.grey900 },
  career: { ...typography.body, color: colors.grey700, lineHeight: 22 },
  pledgeCard: { padding: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: colors.grey200 },
  pledgeText: { ...typography.bodySmall, color: colors.grey700, lineHeight: 20 },
  empty: { gap: spacing[2], padding: spacing[4], borderRadius: 12, backgroundColor: colors.grey50 },
  emptyText: { ...typography.subtitle, color: colors.grey700 },
  emptyDesc: { ...typography.body, color: colors.grey500 },
});
