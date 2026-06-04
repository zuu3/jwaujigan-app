// @ts-ignore - unstable-native-tabs not yet in public type exports
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

const TABS = [
  { name: 'home',      label: '홈',       sf: 'house',                          sfSelected: 'house.fill' },
  { name: 'issues',   label: '이슈',      sf: 'doc.text',                       sfSelected: 'doc.text.fill' },
  { name: 'arena',    label: '아레나',    sf: 'bolt',                           sfSelected: 'bolt.fill' },
  { name: 'community',label: '커뮤니티',  sf: 'bubble.left.and.bubble.right',   sfSelected: 'bubble.left.and.bubble.right.fill' },
  { name: 'mypage',   label: '마이',      sf: 'person',                         sfSelected: 'person.fill' },
] as const;

export default function TabsLayout() {
  return (
    <NativeTabs>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <Icon sf={{ default: tab.sf, selected: tab.sfSelected }} />
          <Label>{tab.label}</Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
