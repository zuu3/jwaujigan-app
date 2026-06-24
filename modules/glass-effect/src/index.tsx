import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type Props = {
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const NativeGlassView = Platform.OS === 'ios'
  ? requireNativeView<Props>('GlassEffect')
  : null;

// iOS 26+: UIGlassEffect (native). iOS <26 or non-iOS: expo-blur systemUltraThinMaterial fallback.
export function GlassView({ cornerRadius = 999, style, children }: Props) {
  if (NativeGlassView) {
    return (
      <NativeGlassView cornerRadius={cornerRadius} style={style}>
        {children}
      </NativeGlassView>
    );
  }
  // Android / web fallback
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
