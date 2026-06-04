import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LocalElectionResponse, ElectionType, ElectionPerson } from '@/api/local-election';
import { ELECTION_TYPE_LABELS } from '@/api/local-election';
import { SkeletonList, ErrorPanel } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ELECTION_TYPE_ORDER: ElectionType[] = [
  'governor', 'superintendent', 'mayor', 'provincial', 'provincialPr', 'local', 'localPr',
];

const COLLAPSE_AT = 4;

function partyLean(name: string): 'progressive' | 'conservative' | 'neutral' {
  if (name.includes('민주') || name.includes('조국')) return 'progressive';
  if (name.includes('국민의힘') || name.includes('국민의 힘')) return 'conservative';
  return 'neutral';
}

function partyStyle(lean: 'progressive' | 'conservative' | 'neutral') {
  if (lean === 'progressive') return { bg: colors.blue50, text: colors.blue500 };
  if (lean === 'conservative') return { bg: colors.politicalRedLight, text: colors.politicalRed };
  return { bg: colors.grey100, text: colors.grey600 };
}

function PersonCard({ person, tab }: { person: ElectionPerson; tab: 'candidates' | 'winners' }) {
  const lean = partyLean(person.jdName);
  const { bg, text } = partyStyle(lean);
  return (
    <Pressable
      style={card.wrap}
      onPress={() => router.push(`/local-politicians/${person.huboid}?type=${person.electionType}&tab=${tab}`)}
    >
      <View style={card.top}>
        {person.photoUrl ? (
          <Image source={{ uri: person.photoUrl }} style={card.photo} />
        ) : (
          <View style={card.photoFallback}>
            <Text style={card.initial}>{person.name[0]}</Text>
          </View>
        )}
        <View style={card.info}>
          {tab === 'candidates' ? (
            <View style={card.nameRow}>
              <Text style={card.giho}>기호 {person.giho}</Text>
              <Text style={card.name}>{person.name}</Text>
            </View>
          ) : (
            <Text style={card.name}>{person.name}</Text>
          )}
          {person.job ? <Text style={card.job}>{person.job}</Text> : null}
          <View style={[card.partyTag, { backgroundColor: bg }]}>
            <Text style={[card.partyText, { color: text }]}>{person.jdName}</Text>
          </View>
        </View>
      </View>
      {(person.career1 || person.career2) ? (
        <View style={card.careers}>
          {person.career1 ? <Text style={card.career}>{person.career1}</Text> : null}
          {person.career2 ? <Text style={card.career}>{person.career2}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function CollapsibleList({ items, tab }: { items: ElectionPerson[]; tab: 'candidates' | 'winners' }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, COLLAPSE_AT);
  const hidden = items.length - COLLAPSE_AT;
  return (
    <View style={{ gap: spacing[2] }}>
      {visible.map((p) => (
        <PersonCard key={p.huboid + p.giho} person={p} tab={tab} />
      ))}
      {items.length > COLLAPSE_AT ? (
        <Pressable style={list.expandBtn} onPress={() => setExpanded((v) => !v)}>
          <Text style={list.expandText}>{expanded ? '접기' : `나머지 ${hidden}명 보기`}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type Props = {
  isLoading: boolean;
  isError: boolean;
  data: LocalElectionResponse | undefined;
  onRetry: () => void;
  district: string;
};

export function LocalElectionSection({ isLoading, isError, data, onRetry, district }: Props) {
  const [tab, setTab] = useState<'candidates' | 'winners'>('candidates');
  const [typeIndex, setTypeIndex] = useState(0);

  const wiwLabel = data?.wiwNames?.join(' · ') ?? district;

  const activeTypes = data
    ? ELECTION_TYPE_ORDER.filter((t) => {
        const list = tab === 'candidates' ? data.candidates[t] : data.winners[t];
        return (list?.length ?? 0) > 0;
      })
    : [];

  const idx = Math.min(typeIndex, Math.max(0, activeTypes.length - 1));
  const currentType = activeTypes[idx] ?? null;
  const currentList = currentType
    ? (tab === 'candidates' ? data?.candidates[currentType] : data?.winners[currentType]) ?? []
    : [];

  function changeTab(t: 'candidates' | 'winners') {
    setTab(t);
    setTypeIndex(0);
  }

  const hasAny = data
    ? ELECTION_TYPE_ORDER.some((t) => (data.candidates[t]?.length ?? 0) + (data.winners[t]?.length ?? 0) > 0)
    : false;

  if (!isLoading && !isError && !hasAny) return null;

  return (
    <View style={styles.wrap}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>지방선거</Text>
          <Text style={styles.sub}>{wiwLabel}</Text>
        </View>
        <Pressable style={styles.ballotBtn} onPress={() => router.push('/ballot-preview')}>
          <Text style={styles.ballotBtnText}>투표용지 미리보기</Text>
        </Pressable>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(['candidates', 'winners'] as const).map((t) => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => changeTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'candidates' ? '이번 후보자' : '현직'}
            </Text>
            <Text style={[styles.tabSub, tab === t && styles.tabSubActive]}>
              {t === 'candidates' ? '9회 · 2026.6.3' : '8회 · 2022'}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? <SkeletonList count={2} lines={3} /> : null}
      {isError ? <ErrorPanel message="선거 정보를 불러오지 못했어요." onRetry={onRetry} /> : null}

      {!isLoading && !isError && activeTypes.length > 0 ? (
        <>
          {/* 선거 유형 네비 */}
          <View style={styles.typeNav}>
            <Pressable
              style={[styles.navArrow, idx === 0 && styles.navArrowDisabled]}
              onPress={() => setTypeIndex((i) => Math.max(i - 1, 0))}
              disabled={idx === 0}
            >
              <Text style={styles.navArrowText}>‹</Text>
            </Pressable>
            <View style={styles.typeLabel}>
              <Text style={styles.typeName}>{currentType ? ELECTION_TYPE_LABELS[currentType] : ''}</Text>
              <Text style={styles.typeCount}>{idx + 1} / {activeTypes.length}</Text>
            </View>
            <Pressable
              style={[styles.navArrow, idx === activeTypes.length - 1 && styles.navArrowDisabled]}
              onPress={() => setTypeIndex((i) => Math.min(i + 1, activeTypes.length - 1))}
              disabled={idx === activeTypes.length - 1}
            >
              <Text style={styles.navArrowText}>›</Text>
            </Pressable>
          </View>

          {/* 도트 */}
          {activeTypes.length > 1 ? (
            <View style={styles.dots}>
              {activeTypes.map((_, i) => (
                <Pressable key={i} onPress={() => setTypeIndex(i)}>
                  <View style={[styles.dot, i === idx && styles.dotActive]} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* 후보자 목록 */}
          <CollapsibleList key={`${tab}-${currentType}`} items={currentList} tab={tab} />
        </>
      ) : null}

      {!isLoading && !isError && activeTypes.length === 0 && hasAny ? (
        <Text style={styles.empty}>이 탭에 해당하는 정보가 없어요.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[3] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  title: { ...typography.heading, color: colors.grey900 },
  sub: { ...typography.bodySmall, color: colors.grey500 },
  ballotBtn: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.blue500, backgroundColor: colors.blue50 },
  ballotBtnText: { ...typography.caption, color: colors.blue500, fontWeight: '600' },
  tabRow: { flexDirection: 'row', gap: spacing[2] },
  tabBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 999, borderWidth: 1, borderColor: colors.grey200, flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  tabBtnActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  tabText: { ...typography.bodySmall, color: colors.grey600, fontWeight: '600' },
  tabTextActive: { color: colors.blue500 },
  tabSub: { ...typography.caption, color: colors.grey400 },
  tabSubActive: { color: colors.blue500, opacity: 0.8 },
  typeNav: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  navArrow: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.grey200, alignItems: 'center', justifyContent: 'center' },
  navArrowDisabled: { opacity: 0.3 },
  navArrowText: { fontSize: 20, color: colors.grey700, lineHeight: 24 },
  typeLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeName: { ...typography.subtitle, color: colors.grey900 },
  typeCount: { ...typography.caption, color: colors.grey500 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.grey200 },
  dotActive: { width: 16, backgroundColor: colors.blue500 },
  empty: { ...typography.body, color: colors.grey500 },
});

const card = StyleSheet.create({
  wrap: { padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, gap: spacing[2] },
  top: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  photo: { width: 44, height: 56, borderRadius: 6, flexShrink: 0 },
  photoFallback: { width: 44, height: 56, borderRadius: 6, backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initial: { ...typography.subtitle, color: colors.grey400 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  giho: { ...typography.caption, color: colors.grey400 },
  name: { ...typography.subtitle, color: colors.grey900 },
  job: { ...typography.caption, color: colors.grey500 },
  partyTag: { alignSelf: 'flex-start', paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  partyText: { ...typography.caption, fontWeight: '600' },
  careers: { gap: 2, paddingTop: 2 },
  career: { ...typography.caption, color: colors.grey600, lineHeight: 18 },
});

const list = StyleSheet.create({
  expandBtn: { padding: spacing[3], borderRadius: 10, borderWidth: 1, borderColor: colors.grey200, borderStyle: 'dashed', alignItems: 'center', backgroundColor: colors.grey50 },
  expandText: { ...typography.bodySmall, color: colors.blue500, fontWeight: '600' },
});
