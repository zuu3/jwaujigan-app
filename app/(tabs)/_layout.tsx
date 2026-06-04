import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';


const TAB_CONFIG = {
  home:      { label: '홈',      icon: 'home-outline',           iconFocused: 'home' },
  issues:    { label: '이슈',    icon: 'document-text-outline',  iconFocused: 'document-text' },
  arena:     { label: '아레나',  icon: 'flash-outline',          iconFocused: 'flash' },
  community: { label: '커뮤니티', icon: 'chatbubbles-outline',   iconFocused: 'chatbubbles' },
  mypage:    { label: '마이',    icon: 'person-outline',         iconFocused: 'person' },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlassTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 100}
        tint={Platform.OS === 'ios' ? 'systemChromeMaterial' : 'light'}
        style={styles.pill}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {state.routes.map((route: any, i: number) => {
          const focused = state.index === i;
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
          const iconName = focused ? config?.iconFocused : config?.icon;
          const label = config?.label ?? route.name;

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            >
              <Ionicons
                name={(iconName ?? 'ellipse-outline') as never}
                size={22}
                color={focused ? colors.grey900 : colors.grey400}
              />
              <Text style={[styles.label, focused && styles.labelFocused]}>
                {label}
              </Text>
              {focused ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 9999,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    minHeight: 48,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.grey400,
    letterSpacing: -0.2,
  },
  labelFocused: {
    color: colors.grey900,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.blue500,
    marginTop: 1,
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="issues" />
      <Tabs.Screen name="arena" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="mypage" />
    </Tabs>
  );
}
