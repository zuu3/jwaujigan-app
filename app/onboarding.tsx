import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { saveDistrict, savePoliticalProfile, PoliticalProfileResult } from '@/api/onboarding';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { AXIS_LABELS, likertOptions, questions } from '@/data/questions';
import { DISTRICT_OPTIONS, PROVINCES, searchDistricts, type DistrictOption } from '@/data/districts';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Step = 'district' | 'questions' | 'result';

function AxisBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(((score + 100) / 200) * 100);
  const isProgressive = score >= 30;
  const isConservative = score <= -30;
  const barColor = isProgressive ? colors.blue500 : isConservative ? colors.politicalRed : colors.grey400;
  return (
    <View style={bar.row}>
      <View style={bar.labelRow}>
        <Text style={bar.label}>{label}</Text>
        <Text style={[bar.lean, { color: barColor }]}>
          {isProgressive ? '진보' : isConservative ? '보수' : '중도'}
        </Text>
      </View>
      <View style={bar.trackWrap}>
        <Text style={bar.end}>보수</Text>
        <View style={bar.track}>
          <View style={bar.center} />
          <View style={[bar.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={bar.end}>진보</Text>
      </View>
    </View>
  );
}

function shortProvince(p: string) {
  return p.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace(/도$/, '').trim();
}

export default function OnboardingScreen() {
  const { token, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('district');

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOption | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [savingDistrict, setSavingDistrict] = useState(false);
  const [districtError, setDistrictError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [result, setResult] = useState<PoliticalProfileResult | null>(null);

  const matches = useMemo(() => {
    if (query.trim().length >= 1) return searchDistricts(query, null);
    if (province) return DISTRICT_OPTIONS.filter((o) => o.province === province);
    return [];
  }, [query, province]);

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;

  async function handleDistrictConfirm() {
    if (!selectedDistrict || !token) return;
    setSavingDistrict(true);
    setDistrictError(null);
    try {
      const saved = await saveDistrict(token, selectedDistrict.district, selectedDistrict.area);
      await updateUser({ district: saved.district, area: saved.matchedArea });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['local-election'] });
      setStep('questions');
    } catch (e) {
      setDistrictError(e instanceof Error ? e.message : '저장에 실패했어요.');
    } finally {
      setSavingDistrict(false);
    }
  }

  function handleAnswer(value: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (index < questions.length - 1) setIndex((i) => i + 1);
  }

  async function handleSubmit() {
    if (!token || answeredCount < questions.length) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const r = await savePoliticalProfile(token, answers);
      setResult(r);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['me-political-profile'] });
      setStep('result');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '저장에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Result ──────────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <Screen>
        <View style={styles.resultHero}>
          <Text style={styles.eyebrow}>성향 검사 완료</Text>
          <Text style={styles.resultType}>{result.political_type}</Text>
          <Text style={styles.resultDesc}>3가지 정치 축으로 분석한 나의 성향이에요.</Text>
        </View>
        <View style={styles.card}>
          <AxisBar label={AXIS_LABELS.economic} score={result.economic_score} />
          <AxisBar label={AXIS_LABELS.security} score={result.security_score} />
          <AxisBar label={AXIS_LABELS.social} score={result.social_score} />
        </View>
        <Pressable style={styles.submitBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.submitText}>시작하기</Text>
        </Pressable>
      </Screen>
    );
  }

  // ── Questions ────────────────────────────────────────────────────────────
  if (step === 'questions') {
    const progress = Math.round(((index + 1) / questions.length) * 100);
    const allAnswered = answeredCount === questions.length;
    return (
      <SafeAreaView style={q.safe} edges={['top', 'bottom']}>
        {/* 상단 고정: 프로그레스 */}
        <View style={q.header}>
          <Text style={q.eyebrow}>성향 검사</Text>
          <View style={q.progressRow}>
            <Text style={q.progressLabel}>질문 {index + 1} / {questions.length}</Text>
            <View style={q.progressTrack}>
              <View style={[q.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {/* 가운데: 질문 + 옵션 */}
        <View style={q.body}>
          <Text style={q.axisTag}>{AXIS_LABELS[question.axis]}</Text>
          <Text style={q.questionText}>{question.text}</Text>
          <Text style={q.hint}>가장 가까운 입장을 고르세요</Text>
          <View style={q.options}>
            {likertOptions.map((opt) => {
              const selected = answers[question.id] === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[q.option, selected && q.optionSelected]}
                  onPress={() => handleAnswer(opt.value)}
                >
                  <Text style={[q.optionText, selected && q.optionTextSelected]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 하단 고정: 네비 + 완료 */}
        <View style={q.footer}>
          <View style={q.navRow}>
            <Pressable
              style={q.navBtn}
              disabled={index === 0}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <Text style={[q.navText, index === 0 && q.navDisabled]}>← 이전</Text>
            </Pressable>
            <Pressable
              style={q.navBtn}
              disabled={index === questions.length - 1}
              onPress={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              <Text style={[q.navText, index === questions.length - 1 && q.navDisabled]}>다음 →</Text>
            </Pressable>
          </View>
          {submitError ? <Text style={q.error}>{submitError}</Text> : null}
          <Pressable
            style={[q.submitBtn, (!allAnswered || isSubmitting) && q.submitDisabled]}
            disabled={!allAnswered || isSubmitting}
            onPress={handleSubmit}
          >
            <Text style={q.submitText}>{isSubmitting ? '저장 중...' : `완료하기 (${answeredCount}/${questions.length})`}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── District ─────────────────────────────────────────────────────────────
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>온보딩 1/2</Text>
        <Text style={styles.title}>내 지역구를 선택해요</Text>
        <Text style={styles.desc}>지역구를 저장하면 내 지역 의원과 이슈를 바로 볼 수 있어요.</Text>
      </View>

      {selectedDistrict ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>{selectedDistrict.displayLabel}</Text>
            {selectedDistrict.province ? <Text style={styles.selectedSub}>{selectedDistrict.province}</Text> : null}
          </View>
          <Pressable onPress={() => { setSelectedDistrict(null); setQuery(''); }}>
            <Text style={styles.changeBtn}>변경</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={(t) => { setQuery(t); setProvince(null); }}
            placeholder="지역구 검색 (예: 종로, 해운대)"
            placeholderTextColor={colors.grey400}
            clearButtonMode="while-editing"
            autoCorrect={false}
            returnKeyType="search"
          />

          {/* 시도 필터 */}
          {!query ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.provinceScroll}>
              {PROVINCES.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.provinceChip, province === p && styles.provinceChipActive]}
                  onPress={() => setProvince(province === p ? null : p)}
                >
                  <Text style={[styles.provinceText, province === p && styles.provinceTextActive]}>
                    {shortProvince(p)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {/* 결과 리스트 */}
          {matches.length > 0 ? (
            <View style={styles.resultList}>
              {matches.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={styles.resultItem}
                  onPress={() => { setSelectedDistrict(opt); setQuery(''); setProvince(null); }}
                >
                  <Text style={styles.resultMain}>{opt.districtLabel}</Text>
                  <Text style={styles.resultSub}>{opt.areaLabel}{opt.province ? ` · ${shortProvince(opt.province)}` : ''}</Text>
                </Pressable>
              ))}
            </View>
          ) : query.trim().length >= 1 ? (
            <Text style={styles.empty}>"{query}"에 해당하는 지역구가 없어요.</Text>
          ) : !province ? (
            <Text style={styles.hint2}>시도를 선택하거나 지역구 이름을 검색하세요.</Text>
          ) : null}
        </>
      )}

      {districtError ? <Text style={styles.error}>{districtError}</Text> : null}
      <Pressable
        style={[styles.submitBtn, (!selectedDistrict || savingDistrict) && styles.submitDisabled]}
        disabled={!selectedDistrict || savingDistrict}
        onPress={handleDistrictConfirm}
      >
        <Text style={styles.submitText}>{savingDistrict ? '저장 중...' : '다음 — 성향 검사'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[2] },
  eyebrow: { ...typography.bodySmall, color: colors.blue500, fontWeight: '700' },
  title: { ...typography.displayLarge, color: colors.grey900 },
  desc: { ...typography.body, color: colors.grey600 },
  searchInput: { minHeight: 48, paddingHorizontal: spacing[3], borderRadius: 10, backgroundColor: colors.grey100, ...typography.body, color: colors.grey900 },
  provinceScroll: { flexDirection: 'row', gap: spacing[2], paddingVertical: 2 },
  provinceChip: { paddingHorizontal: spacing[3], paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.grey200 },
  provinceChipActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  provinceText: { ...typography.bodySmall, color: colors.grey600, fontWeight: '600' },
  provinceTextActive: { color: colors.blue500 },
  resultList: { borderRadius: 12, borderWidth: 1, borderColor: colors.grey200, overflow: 'hidden' },
  resultItem: { padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  resultMain: { ...typography.subtitle, color: colors.grey900 },
  resultSub: { ...typography.caption, color: colors.grey500, marginTop: 2 },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[4] },
  hint2: { ...typography.body, color: colors.grey400, textAlign: 'center', paddingVertical: spacing[2] },
  selectedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4], borderRadius: 12, borderWidth: 2, borderColor: colors.blue500, backgroundColor: colors.blue50 },
  selectedInfo: { gap: 2 },
  selectedLabel: { ...typography.subtitle, color: colors.grey900 },
  selectedSub: { ...typography.caption, color: colors.grey500 },
  changeBtn: { ...typography.bodySmall, color: colors.blue500, fontWeight: '700' },
  card: { gap: spacing[4], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  progressRow: { gap: spacing[2] },
  progressLabel: { ...typography.bodySmall, color: colors.grey500, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 999, backgroundColor: colors.grey100, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 999, backgroundColor: colors.blue500 },
  axisTag: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  questionText: { ...typography.heading, color: colors.grey900 },
  hint: { ...typography.bodySmall, color: colors.grey500 },
  options: { gap: spacing[2] },
  option: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: colors.grey200 },
  optionSelected: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  optionText: { ...typography.body, color: colors.grey700 },
  optionTextSelected: { color: colors.blue500, fontWeight: '700' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between' },
  navText: { ...typography.body, color: colors.grey900, fontWeight: '700' },
  navDisabled: { color: colors.grey300 },
  error: { ...typography.bodySmall, color: colors.red500 },
  submitBtn: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blue500 },
  submitDisabled: { opacity: 0.4 },
  submitText: { ...typography.subtitle, color: colors.white },
  resultHero: { gap: spacing[3], alignItems: 'center', paddingVertical: spacing[6] },
  resultType: { ...typography.displayLarge, color: colors.grey900, textAlign: 'center', fontWeight: '800' },
  resultDesc: { ...typography.body, color: colors.grey600, textAlign: 'center' },
});

const q = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[4], gap: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  eyebrow: { ...typography.bodySmall, color: colors.blue500, fontWeight: '700' },
  progressRow: { gap: spacing[2] },
  progressLabel: { ...typography.bodySmall, color: colors.grey500, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 999, backgroundColor: colors.grey100, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 999, backgroundColor: colors.blue500 },
  body: { flex: 1, paddingHorizontal: spacing[5], paddingTop: spacing[5], gap: spacing[4], justifyContent: 'center' },
  axisTag: { ...typography.caption, color: colors.blue500, fontWeight: '700' },
  questionText: { ...typography.heading, color: colors.grey900 },
  hint: { ...typography.bodySmall, color: colors.grey500 },
  options: { gap: spacing[2] },
  option: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: colors.grey200 },
  optionSelected: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  optionText: { ...typography.body, color: colors.grey700 },
  optionTextSelected: { color: colors.blue500, fontWeight: '700' },
  footer: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], paddingTop: spacing[3], gap: spacing[3], borderTopWidth: 1, borderTopColor: colors.grey100 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between' },
  navBtn: { minHeight: 44, justifyContent: 'center' },
  navText: { ...typography.body, color: colors.grey900, fontWeight: '700' },
  navDisabled: { color: colors.grey300 },
  error: { ...typography.bodySmall, color: colors.red500 },
  submitBtn: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blue500 },
  submitDisabled: { opacity: 0.4 },
  submitText: { ...typography.subtitle, color: colors.white },
});

const bar = StyleSheet.create({
  row: { gap: spacing[2] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.bodySmall, color: colors.grey700, fontWeight: '600' },
  lean: { ...typography.caption, fontWeight: '700' },
  trackWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  end: { ...typography.caption, color: colors.grey400, width: 24 },
  track: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.grey100, overflow: 'hidden' },
  center: { position: 'absolute', left: '50%', top: 0, width: 1, height: 10, backgroundColor: colors.grey300, zIndex: 1 },
  fill: { height: 10, borderRadius: 999 },
});
