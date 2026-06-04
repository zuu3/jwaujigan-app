import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/auth-context';
import { API_BASE_URL } from '@/api/client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

WebBrowser.maybeCompleteAuthSession();

const MOBILE_LOGIN_URL = API_BASE_URL + '/mobile-login';

export default function LoginScreen() {
  const { signInWithDeepLink, setDevelopmentToken } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        MOBILE_LOGIN_URL,
        'jwaujigan://auth',
      );
      if (result.type !== 'success') return;
      const parsed = new URL(result.url);
      const token = parsed.searchParams.get('token');
      const userJson = parsed.searchParams.get('user');
      if (!token || !userJson) { setError('로그인 정보를 가져오지 못했어요.'); return; }
      const user = JSON.parse(decodeURIComponent(userJson));
      await signInWithDeepLink({ token, user });
      router.replace(user.district ? '/(tabs)/home' : '/onboarding');
    } catch {
      setError('로그인 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function continueAsDevelopment() {
    await setDevelopmentToken();
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.copy}>
          <Text style={styles.brand}>좌우지간</Text>
          <Text style={styles.title}>선동 없는 정치 정보를 모바일에서도 그대로.</Text>
          <Text style={styles.description}>Google 계정으로 로그인하면 이슈, 민심투표, AI 토론 기록을 앱에서 이어갈 수 있어요.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <View style={styles.actions}>
          <Pressable style={[styles.primaryButton, isSigningIn && styles.disabled]} disabled={isSigningIn} onPress={() => void handleGoogleLogin()}>
            <Text style={styles.primaryButtonText}>{isSigningIn ? '로그인 중...' : 'Google로 로그인'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={continueAsDevelopment}>
            <Text style={styles.secondaryButtonText}>개발용으로 둘러보기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, justifyContent: 'space-between', padding: spacing[5], paddingTop: spacing[12] },
  copy: { gap: spacing[3] },
  brand: { ...typography.subtitle, color: colors.blue500 },
  title: { ...typography.displayLarge, color: colors.grey900 },
  description: { ...typography.bodyLarge, color: colors.grey600 },
  error: { ...typography.bodySmall, color: colors.red500 },
  actions: { gap: spacing[3] },
  primaryButton: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blue500 },
  disabled: { opacity: 0.5 },
  primaryButtonText: { ...typography.subtitle, color: colors.white },
  secondaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.grey100 },
  secondaryButtonText: { ...typography.subtitle, color: colors.grey900 },
});
