import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { colors } from '@/theme/colors';

export default function IndexRoute() {
  const { token, user, isBootstrapping } = useAuth();
  if (isBootstrapping) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}><ActivityIndicator color={colors.blue500} /></View>;
  }
  if (!token) return <Redirect href="/(auth)/login" />;
  if (!user?.district) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
