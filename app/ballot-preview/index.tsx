import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalElection, ELECTION_TYPE_LABELS } from '@/api/local-election';
import type { ElectionType, ElectionPerson } from '@/api/local-election';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { SkeletonList, ErrorPanel } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const BALLOT_ORDER: ElectionType[] = [
  'governor', 'mayor', 'provincial', 'provincialPr', 'local', 'localPr', 'superintendent',
];

const BALLOT_THEME: Record<ElectionType, { bg: string; header: string; border: string; accent: string }> = {
  governor:       { bg: '#fce4ec', header: '#f8bbd9', border: '#f5c6d0', accent: '#c62828' },
  mayor:          { bg: '#fce4ec', header: '#f8bbd9', border: '#f5c6d0', accent: '#880e4f' },
  provincial:     { bg: '#fff3e0', header: '#ffe0b2', border: '#ffd180', accent: '#e65100' },
  provincialPr:   { bg: '#e3f2fd', header: '#bbdefb', border: '#90caf9', accent: '#1565c0' },
  local:          { bg: '#f9fbe7', header: '#f0f4c3', border: '#dce775', accent: '#558b2f' },
  localPr:        { bg: '#e0f2f1', header: '#b2dfdb', border: '#80cbc4', accent: '#00695c' },
  superintendent: { bg: '#e8f5e9', header: '#c8e6c9', border: '#a5d6a7', accent: '#2e7d32' },
};

function sortByGiho(list: ElectionPerson[]) {
  return [...list].sort((a, b) => (parseInt(a.giho) || 999) - (parseInt(b.giho) || 999));
}

function getPrParties(list: ElectionPerson[]) {
  const seen = new Set<string>();
  const res: { giho: string; jdName: string }[] = [];
  for (const c of sortByGiho(list)) {
    const p = c.jdName?.trim() || '무소속';
    if (!seen.has(p)) { seen.add(p); res.push({ giho: String(res.length + 1), jdName: p }); }
  }
  return res;
}

function getBallotTitle(type: ElectionType, sdName: string, wiwLabel: string) {
  if (type === 'governor') return sdName.endsWith('도') ? `${sdName}지사 선거` : `${sdName}장 선거`;
  if (type === 'superintendent') return `${sdName} 교육감 선거`;
  return `${wiwLabel} ${ELECTION_TYPE_LABELS[type]} 선거`;
}

function BallotCard({ type, candidates, sdName, wiwLabel }: {
  type: ElectionType;
  candidates: ElectionPerson[];
  sdName: string;
  wiwLabel: string;
}) {
  const theme = BALLOT_THEME[type];
  const isPr = type === 'provincialPr' || type === 'localPr';
  const sorted = isPr ? getPrParties(candidates) : sortByGiho(candidates);
  const title = getBallotTitle(type, sdName, wiwLabel);

  return (
    <View style={[b.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      {/* 투표용지 상단 */}
      <View style={[b.header, { backgroundColor: theme.header }]}>
        <Text style={b.headerTitle}>{title}</Text>
        <Text style={b.headerSub}>제9회 전국동시지방선거 투표용지</Text>
      </View>

      {/* 컬럼 헤더 */}
      <View style={[b.colHeader, { backgroundColor: theme.header, borderColor: theme.border }]}>
        <Text style={[b.colGiho, { color: theme.accent }]}>기호</Text>
        <Text style={b.colName}>{isPr ? '정당명' : '후보자명'}</Text>
        {!isPr ? <Text style={b.colParty}>정당명</Text> : null}
        <Text style={b.colStamp}>기표란</Text>
      </View>

      {/* 후보자/정당 행 */}
      {(isPr ? sorted as { giho: string; jdName: string }[] : sorted as ElectionPerson[]).map((item, i) => {
        const isPersonList = !isPr;
        const person = isPersonList ? (item as ElectionPerson) : null;
        const party = !isPersonList ? (item as { giho: string; jdName: string }) : null;
        return (
          <View key={i} style={[b.row, { borderColor: theme.border }]}>
            <Text style={[b.giho, { color: theme.accent }]}>
              {isPersonList ? person!.giho : party!.giho}
            </Text>
            <Text style={b.candidateName}>
              {isPersonList ? person!.name : party!.jdName}
            </Text>
            {isPersonList ? <Text style={b.partyName}>{person!.jdName}</Text> : null}
            <View style={b.stampBox}>
              <Text style={b.stampLabel}>인</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function BallotPreviewScreen() {
  const { token } = useAuth();
  const electionQuery = useLocalElection(token);
  const data = electionQuery.data;

  const sdName = data?.district?.split(' ')?.[0] ?? '';
  const wiwLabel = data?.wiwNames?.join(' · ') ?? '';

  const ballots = BALLOT_ORDER.filter((t) => (data?.candidates[t]?.length ?? 0) > 0);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={16}>
        <Text style={styles.back}>← 이전</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.title}>내 투표용지 미리보기</Text>
        <Text style={styles.sub}>2026. 6. 3. 제9회 전국동시지방선거</Text>
      </View>

      {electionQuery.isLoading ? <SkeletonList count={3} lines={4} /> : null}
      {electionQuery.isError ? (
        <ErrorPanel message="선거 정보를 불러오지 못했어요." onRetry={() => void electionQuery.refetch()} />
      ) : null}

      {data && ballots.length === 0 ? (
        <Text style={styles.empty}>이 지역 투표용지 정보가 없어요.</Text>
      ) : null}

      {data ? ballots.map((type) => (
        <BallotCard
          key={type}
          type={type}
          candidates={data.candidates[type] ?? []}
          sdName={sdName}
          wiwLabel={wiwLabel}
        />
      )) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  headerRow: { gap: spacing[1] },
  title: { ...typography.headingLarge, color: colors.grey900 },
  sub: { ...typography.body, color: colors.grey500 },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[6] },
});

const b = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  header: { padding: spacing[3], gap: 2 },
  headerTitle: { ...typography.subtitle, color: colors.grey900 },
  headerSub: { ...typography.caption, color: colors.grey600 },
  colHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  colGiho: { width: 36, ...typography.caption, fontWeight: '700' },
  colName: { flex: 1, ...typography.caption, color: colors.grey700, fontWeight: '700' },
  colParty: { flex: 1, ...typography.caption, color: colors.grey700, fontWeight: '700' },
  colStamp: { width: 44, ...typography.caption, color: colors.grey700, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: spacing[3], paddingVertical: spacing[3], backgroundColor: '#fff' },
  giho: { width: 36, ...typography.body, fontWeight: '700' },
  candidateName: { flex: 1, ...typography.body, color: colors.grey900 },
  partyName: { flex: 1, ...typography.bodySmall, color: colors.grey500 },
  stampBox: { width: 44, height: 36, borderRadius: 6, borderWidth: 1, borderColor: colors.grey300, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  stampLabel: { ...typography.caption, color: colors.grey300 },
});
