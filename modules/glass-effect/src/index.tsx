import { requireNativeView } from 'expo';
import { Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type NativeProps = {
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
};

type Props = NativeProps & { children?: React.ReactNode };

// Expo view manager name = "ModuleName_ViewClassName"
const NativeGlassView = Platform.OS === 'ios'
  ? requireNativeView<NativeProps>('GlassEffect')
  : null;

// UIGlassEffect를 배경 전용으로 absoluteFill 배치 — children은 일반 JS View에서 렌더링.
// 이렇게 해야 children 텍스트가 glass 위에 제대로 표시됨.
export function GlassView({ cornerRadius = 999, style, children }: Props) {
  if (NativeGlassView) {
    return (
      <View style={[{ borderRadius: cornerRadius, overflow: 'hidden' }, style]}>
        <NativeGlassView cornerRadius={cornerRadius} style={StyleSheet.absoluteFill} />
        {children}
      </View>
    );
  }
  return (
    <BlurView
      intensity={40}
      tint="systemUltraThinMaterial"
      style={[{ borderRadius: cornerRadius, overflow: 'hidden' }, style]}
    >
      {children}
    </BlurView>
  );
}
