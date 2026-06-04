import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { judgeDebate, requestDebateTurn, saveBattleLog, DebateMessage, DebateResult } from '@/api/arena';
import { useIssue } from '@/api/issues';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Phase = 'ai-turn' | 'between-turns' | 'intervention' | 'result';

const MAX_ARG = 200;

function roleLabel(role: DebateMessage['role'], userStance: string) {
  if (role === 'progressive') return '진보 AI';
  if (role === 'conservative') return '보수 AI';
  return '내 의견';
}
function roleColor(role: DebateMessage['role']) {
  if (role === 'progressive') return colors.blue500;
  if (role === 'conservative') return colors.politicalRed;
  return colors.grey700;
}
function roleBg(role: DebateMessage['role']) {
  if (role === 'progressive') return colors.blue50;
  if (role === 'conservative') return colors.politicalRedLight;
  return colors.grey100;
}
function winnerLabel(winner: DebateResult['winner']) {
  if (winner === 'progressive') return '진보 승리';
  if (winner === 'conservative') return '보수 승리';
  return '무승부';
}
function winnerColor(winner: DebateResult['winner']) {
  if (winner === 'progressive') return colors.blue500;
  if (winner === 'conservative') return colors.politicalRed;
  return colors.grey700;
}

export default function ArenaBattleScreen() {
  const { id, stance } = useLocalSearchParams<{ id: string; stance?: 'progressive' | 'conservative' | 'watch' }>();
  const { token } = useAuth();
  const issueQuery = useIssue(id, token);
  const issue = issueQuery.data;

  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ai-turn');
  const [streamingText, setStreamingText] = useState('');
  const [streamingRole, setStreamingRole] = useState<'progressive' | 'conservative'>('progressive');
  const [argument, setArgument] = useState('');
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startedRef = useRef(false);
  const runningTurnRef = useRef<number | null>(null);
  const messagesRef = useRef<DebateMessage[]>([]);
  const logSavedRef = useRef(false);

  const userStance = stance === 'progressive' || stance === 'conservative' || stance === 'watch' ? stance : 'watch';
  const round = Math.min(Math.floor(turnIndex / 2) + 1, 3);
  const canSubmit = phase === 'intervention' && argument.trim().length > 0 && argument.length <= MAX_ARG;

  useEffect(() => {
    if (phase !== 'ai-turn' || runningTurnRef.current === turnIndex || !issue || issueQuery.isLoading) return;
    runningTurnRef.current = turnIndex;
    void runTurn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnIndex, issue, issueQuery.isLoading]);

  async function runTurn() {
    if (!issue) return;
    const speakerStance = turnIndex % 2 === 0 ? 'progressive' : 'conservative';
    const currentRound = Math.min(Math.floor(turnIndex / 2) + 1, 3);
    setStreamingRole(speakerStance);
    setStreamingText('');
    setError(null);

    try {
      const response = await requestDebateTurn(token, {
        issueId: issue.id,
        issueTitle: issue.title,
        issueBody: issue.body,
        progressiveContext: issue.progressive,
        conservativeContext: issue.conservative,
        speakerStance,
        round: currentRound,
        history: messagesRef.current,
      });
      const nextMessages: DebateMessage[] = [...messagesRef.current, { role: speakerStance as DebateMessage['role'], content: response.text }];
      messagesRef.current = nextMessages;
      setMessages([...nextMessages]);
      setStreamingText('');

      if (turnIndex >= 5) {
        setPhase('result');
        const judged = await judgeDebate(token, { issueTitle: issue.title, issueBody: issue.body, history: nextMessages });
        setResult(judged);
        if (!logSavedRef.current) {
          logSavedRef.current = true;
          await saveBattleLog(token, { topic: issue.title, messages: nextMessages, winner: judged.winner, userStance });
        }
      } else {
        setPhase('between-turns');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '토론을 이어가지 못했어요.');
      setPhase('between-turns');
    } finally {
      runningTurnRef.current = null;
    }
  }

  function handleContinue() {
    setArgument('');
    setTurnIndex((i) => i + 1);
    setPhase('ai-turn');
  }

  function handleOpenIntervention() {
    setPhase('intervention');
  }

  function handleSubmitArgument() {
    if (!canSubmit) return;
    const userMessage: DebateMessage = { role: 'user', content: argument.trim() };
    const next = [...messagesRef.current, userMessage];
    messagesRef.current = next;
    setMessages([...next]);
    setArgument('');
    setTurnIndex((i) => i + 1);
    setPhase('ai-turn');
  }

  function restart() {
    startedRef.current = false;
    runningTurnRef.current = null;
    messagesRef.current = [];
    logSavedRef.current = false;
    setMessages([]);
    setTurnIndex(0);
    setPhase('ai-turn');
    setResult(null);
    setError(null);
    setArgument('');
    setStreamingText('');
  }

  const stanceLabel = userStance === 'watch' ? 'AI 배틀 구경 중' : userStance === 'progressive' ? '진보 AI 응원 중' : '보수 AI 응원 중';

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.back}>← 이전</Text>
        </Pressable>
        {phase !== 'result' ? (
          <View style={styles.roundBadge}>
            <Text style={styles.roundText}>Round {round} / 3</Text>
          </View>
        ) : null}
      </View>

      {issueQuery.isLoading ? <SkeletonCard lines={2} /> : null}

      {issue ? (
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{stanceLabel}</Text>
          <Text style={styles.title} numberOfLines={3}>{issue.title}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleContinue}>
            <Text style={styles.retryText}>계속하기</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.messages}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.message, { backgroundColor: roleBg(msg.role) }]}>
            <Text style={[styles.messageRole, { color: roleColor(msg.role) }]}>{roleLabel(msg.role, userStance)}</Text>
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
        {streamingText ? (
          <View style={[styles.message, { backgroundColor: roleBg(streamingRole) }]}>
            <Text style={[styles.messageRole, { color: roleColor(streamingRole) }]}>
              {streamingRole === 'progressive' ? '진보 AI' : '보수 AI'}
            </Text>
            <Text style={styles.messageText}>{streamingText}▌</Text>
          </View>
        ) : null}
      </View>

      {phase === 'between-turns' && !error && turnIndex < 5 ? (
        <View style={styles.interventionPanel}>
          <Text style={styles.interventionHint}>내 의견을 AI 토론에 반영할 수 있어요.</Text>
          <View style={styles.interventionActions}>
            <Pressable style={styles.interventionButton} onPress={handleOpenIntervention}>
              <Text style={styles.interventionButtonText}>의견 입력</Text>
            </Pressable>
            <Pressable style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>그냥 계속</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'intervention' ? (
        <View style={styles.interventionInput}>
          <Text style={styles.interventionTitle}>내 의견 ({argument.length}/{MAX_ARG})</Text>
          <TextInput
            style={styles.textarea}
            value={argument}
            onChangeText={setArgument}
            multiline
            maxLength={MAX_ARG}
            placeholder="AI 토론에 반영할 내 입장을 입력해요..."
            placeholderTextColor={colors.grey400}
          />
          <View style={styles.interventionActions}>
            <Pressable style={[styles.submitButton, !canSubmit && styles.submitDisabled]} disabled={!canSubmit} onPress={handleSubmitArgument}>
              <Text style={styles.submitText}>의견 제출</Text>
            </Pressable>
            <Pressable style={styles.skipButton} onPress={handleContinue}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {result ? (
        <View style={styles.result}>
          <Text style={[styles.resultTitle, { color: winnerColor(result.winner) }]}>{winnerLabel(result.winner)}</Text>
          <Text style={styles.resultReason}>{result.reason}</Text>
          <Pressable style={styles.restart} onPress={restart}>
            <Text style={styles.restartText}>다시 실행</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  roundBadge: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.grey200 },
  roundText: { ...typography.caption, color: colors.grey600, fontWeight: '700' },
  header: { gap: spacing[2] },
  eyebrow: { ...typography.bodySmall, color: colors.blue500, fontWeight: '700' },
  title: { ...typography.displayLarge, color: colors.grey900 },
  errorBox: { gap: spacing[2], padding: spacing[4], borderRadius: 12, backgroundColor: '#fef2f2' },
  errorText: { ...typography.body, color: colors.red500 },
  retryButton: { alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 8, backgroundColor: colors.grey900 },
  retryText: { ...typography.bodySmall, color: colors.white, fontWeight: '600' },
  messages: { gap: spacing[3] },
  message: { gap: spacing[2], padding: spacing[4], borderRadius: 12 },
  messageRole: { ...typography.caption, fontWeight: '700' },
  messageText: { ...typography.body, color: colors.grey900 },
  interventionPanel: { gap: spacing[2], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  interventionHint: { ...typography.bodySmall, color: colors.grey600 },
  interventionActions: { flexDirection: 'row', gap: spacing[2] },
  interventionButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.blue500 },
  interventionButtonText: { ...typography.body, color: colors.white, fontWeight: '600' },
  continueButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.grey100 },
  continueButtonText: { ...typography.body, color: colors.grey900, fontWeight: '600' },
  interventionInput: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.blue500 },
  interventionTitle: { ...typography.bodySmall, color: colors.grey700, fontWeight: '700' },
  textarea: { minHeight: 100, padding: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: colors.grey200, ...typography.body, color: colors.grey900, textAlignVertical: 'top' },
  submitButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.blue500 },
  submitDisabled: { opacity: 0.45 },
  submitText: { ...typography.body, color: colors.white, fontWeight: '600' },
  skipButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.grey100 },
  skipText: { ...typography.body, color: colors.grey700, fontWeight: '600' },
  result: { gap: spacing[3], padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: colors.grey200 },
  resultTitle: { ...typography.headingLarge },
  resultReason: { ...typography.body, color: colors.grey600 },
  restart: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.grey900 },
  restartText: { ...typography.body, color: colors.white, fontWeight: '700' },
});
