import { requireNativeView } from 'expo';
import { Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type NativeGlassViewProps = {
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
};

type GlassViewProps = NativeGlassViewProps & { children?: React.ReactNode };

const NativeGlassView = Platform.OS === 'ios'
  ? requireNativeView<NativeGlassViewProps>('GlassEffect')
  : null;

export function GlassView({ cornerRadius = 999, style, children }: GlassViewProps) {
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

// ── GlassButton ──────────────────────────────────────────────────
// iOS 26: UIButton.Configuration.glass() — real specular liquid glass + morphing touch
// iOS <26: tinted capsule fallback

type NativeGlassButtonProps = {
  label?: string;
  systemImage?: string;
  tintHex?: string;
  onGlassPress?: (e: { nativeEvent: object }) => void;
  style?: StyleProp<ViewStyle>;
};

export type GlassButtonProps = {
  label?: string;
  systemImage?: string;
  tintColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const NativeGlassButton = Platform.OS === 'ios'
  ? requireNativeView<NativeGlassButtonProps>('GlassButton')
  : null;

export function GlassButton({ label, systemImage, tintColor, onPress, style }: GlassButtonProps) {
  if (NativeGlassButton) {
    return (
      <NativeGlassButton
        label={label ?? ''}
        systemImage={systemImage ?? ''}
        tintHex={tintColor ?? ''}
        onGlassPress={onPress ? () => onPress() : undefined}
        style={style}
      />
    );
  }
  // Android / web fallback — basic capsule button (no glass material)
  const { Pressable, Text } = require('react-native') as typeof import('react-native');
  return (
    <Pressable
      onPress={onPress}
      style={[{ borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(200,200,200,0.3)' }, style]}
    >
      {label ? <Text style={{ fontWeight: '600', color: tintColor ?? '#374151' }}>{label}</Text> : null}
    </Pressable>
  );
}
