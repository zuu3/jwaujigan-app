import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '../../modules/glass-effect/src';
import { usePolls, useCreatePoll } from '@/api/polls';
import { useAuth } from '@/auth/auth-context';
import { PollCard } from '@/components/poll-card';
import { PageHeader, Screen } from '@/components/screen';
import { ErrorPanel, SkeletonList } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Sort = 'latest' | 'hot';

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function CreatePollModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const createMutation = useCreatePoll(token);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { id: randomId(), text: '' },
    { id: randomId(), text: '' },
  ]);
  const [days, setDays] = useState<1 | 3 | 7>(7);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setQuestion('');
    setOptions([{ id: randomId(), text: '' }, { id: randomId(), text: '' }]);
    setDays(7);
    setError(null);
  }

  function close() { reset(); onClose(); }

  async function handleSubmit() {
    setError(null);
    if (!question.trim()) { setError('질문을 입력해주세요.'); return; }
    for (const o of options) {
      if (!o.text.trim()) { setError('선택지를 모두 입력해주세요.'); return; }
    }
    try {
      await createMutation.mutateAsync({ question: question.trim(), options, expires_in_days: days });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : '투표 생성에 실패했어요.');
    }
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={modal.backdrop} onPress={() => { Keyboard.dismiss(); close(); }} />
      </Modal>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={modal.slideContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[modal.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          <View style={modal.header}>
            <View style={modal.handle} />
            <View style={modal.titleRow}>
              <Text style={modal.title}>투표 만들기</Text>
              <GlassButton
                systemImage="xmark"
                onPress={() => { Keyboard.dismiss(); close(); }}
                style={modal.closeBtn}
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={modal.scrollContent}
          >
            <Text style={modal.label}>질문</Text>
            <TextInput
              style={modal.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="어떤 주제로 투표할까요?"
              placeholderTextColor={colors.grey400}
              multiline
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <Text style={[modal.label, modal.sectionGap]}>선택지 (2~4개)</Text>
            <View style={{ gap: spacing[2] }}>
              {options.map((opt, i) => (
                <View key={opt.id} style={modal.optionRow}>
                  <TextInput
                    style={[modal.input, { flex: 1 }]}
                    value={opt.text}
                    onChangeText={(t) => setOptions((prev) => prev.map((o) => o.id === opt.id ? { ...o, text: t } : o))}
                    placeholder={`선택지 ${i + 1}`}
                    placeholderTextColor={colors.grey400}
                    returnKeyType={i < options.length - 1 ? 'next' : 'done'}
                  />
                  {options.length > 2 ? (
                    <Pressable onPress={() => setOptions((prev) => prev.filter((o) => o.id !== opt.id))} style={modal.removeBtn}>
                      <Text style={modal.removeBtnText}>✕</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
            {options.length < 4 ? (
              <Pressable style={{ marginTop: spacing[2] }} onPress={() => setOptions((prev) => [...prev, { id: randomId(), text: '' }])}>
                <Text style={modal.addBtnText}>+ 선택지 추가</Text>
              </Pressable>
            ) : null}

            <Text style={[modal.label, modal.sectionGap]}>마감 기간</Text>
            <View style={modal.daysRow}>
              {([1, 3, 7] as const).map((d) => (
                <Pressable key={d} style={[modal.dayChip, days === d && modal.dayChipActive]} onPress={() => setDays(d)}>
                  <Text style={[modal.dayText, days === d && modal.dayTextActive]}>{d}일</Text>
                </Pressable>
              ))}
            </View>

            {error ? <Text style={modal.error}>{error}</Text> : null}

            <Pressable
              style={[modal.submitBtn, createMutation.isPending && modal.submitDisabled]}
              onPress={() => { Keyboard.dismiss(); void handleSubmit(); }}
              disabled={createMutation.isPending}
            >
              <Text style={modal.submitText}>{createMutation.isPending ? '등록 중...' : '투표 등록하기'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      </Modal>
    </>
  );

}

export default function CommunityScreen() {
  const { token } = useAuth();
  const [sort, setSort] = useState<Sort>('latest');
  const [showCreate, setShowCreate] = useState(false);
  const pollsQuery = usePolls(sort, token);
  const polls = pollsQuery.data ?? [];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={pollsQuery.isFetching && !pollsQuery.isLoading}
          onRefresh={() => void pollsQuery.refetch()}
          tintColor={colors.blue500}
        />
      }
    >
      <View style={styles.headerRow}>
        <PageHeader title="민심투표" description="짧은 투표로 의견을 모아보세요." />
        {/* Liquid Glass 만들기 버튼 — 스크롤 콘텐츠 위 플로팅 */}
        <GlassButton
          systemImage="plus"
          onPress={() => setShowCreate(true)}
          style={styles.createBtn}
        />
      </View>

      {/* 정렬 탭 — 원래 깔끔한 스타일 유지 */}
      <View style={styles.tabRow}>
        {(['latest', 'hot'] as Sort[]).map((s) => (
          <Pressable key={s} style={[styles.tab, sort === s && styles.tabActive]} onPress={() => setSort(s)}>
            <Text style={[styles.tabText, sort === s && styles.tabTextActive]}>
              {s === 'latest' ? '최신' : '핫'}
            </Text>
          </Pressable>
        ))}
      </View>

      {pollsQuery.isLoading ? <SkeletonList count={3} lines={3} /> : null}
      {pollsQuery.isError ? (
        <ErrorPanel message="투표를 불러오지 못했어요." onRetry={() => void pollsQuery.refetch()} />
      ) : null}
      {!pollsQuery.isLoading && polls.length === 0 && !pollsQuery.isError ? (
        <Text style={styles.empty}>아직 진행 중인 투표가 없어요.</Text>
      ) : null}
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} onPress={() => router.push('/community/polls/' + poll.id)} />
      ))}

      <CreatePollModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  createBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)', marginTop: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.grey200 },
  tab: { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.blue500 },
  tabText: { ...typography.subtitle, color: colors.grey500 },
  tabTextActive: { color: colors.blue500 },
  empty: { ...typography.body, color: colors.grey500, textAlign: 'center', paddingVertical: spacing[6] },
});

const modal = StyleSheet.create({
  slideContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,9,19,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[3] },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.grey300, alignSelf: 'center', marginBottom: spacing[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing[2] },
  title: { ...typography.headingLarge, color: colors.grey900 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)' },
  scrollContent: { padding: spacing[5], paddingTop: spacing[3] },
  label: { ...typography.bodySmall, color: colors.grey700, fontWeight: '600', marginBottom: spacing[2] },
  sectionGap: { marginTop: spacing[4] },
  input: { minHeight: 44, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 8, borderWidth: 1, borderColor: colors.grey200, ...typography.body, color: colors.grey900 },
  optionRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { ...typography.body, color: colors.grey400 },
  addBtnText: { ...typography.body, color: colors.blue500, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: spacing[2] },
  dayChip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: 20, borderWidth: 1, borderColor: colors.grey200 },
  dayChipActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  dayText: { ...typography.body, color: colors.grey600 },
  dayTextActive: { color: colors.blue500, fontWeight: '600' },
  error: { ...typography.bodySmall, color: colors.red500, marginTop: spacing[2] },
  submitBtn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blue500, marginTop: spacing[4] },
  submitDisabled: { opacity: 0.5 },
  submitText: { ...typography.subtitle, color: colors.white },
});
