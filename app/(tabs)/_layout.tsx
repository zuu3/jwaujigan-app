import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme/colors';

const tabs = {
  home: ['홈', 'home-outline', 'home'],
  issues: ['이슈', 'document-text-outline', 'document-text'],
  arena: ['아레나', 'flash-outline', 'flash'],
  community: ['커뮤니티', 'chatbubbles-outline', 'chatbubbles'],
  mypage: ['마이', 'person-outline', 'person'],
} as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.blue500,
      tabBarInactiveTintColor: colors.grey400,
      tabBarStyle: { height: 64, paddingTop: 6, borderTopColor: colors.grey200, backgroundColor: colors.white },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ color, focused, size }) => {
        const config = tabs[route.name as keyof typeof tabs];
        const iconName = focused ? config?.[2] : config?.[1];
        return <Ionicons name={(iconName ?? 'ellipse-outline') as never} size={size} color={color} />;
      },
    })}>
      <Tabs.Screen name="home" options={{ title: tabs.home[0] }} />
      <Tabs.Screen name="issues" options={{ title: tabs.issues[0] }} />
      <Tabs.Screen name="arena" options={{ title: tabs.arena[0] }} />
      <Tabs.Screen name="community" options={{ title: tabs.community[0] }} />
      <Tabs.Screen name="mypage" options={{ title: tabs.mypage[0] }} />
    </Tabs>
  );
}
