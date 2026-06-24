import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { getPartyPresentation } from '@/lib/parties';

type Props = {
  party: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// 정당 로고(원격 이미지) + 라벨. 로고 없거나 로드 실패 시 라벨만.
const LOGO_HEIGHT = 16;

export function PartyBadge({ party, containerStyle, textStyle }: Props) {
  const { label, src, bg, aspectRatio } = getPartyPresentation(party);
  const [failed, setFailed] = useState(false);

  // src 있고 로드 성공이면 로고 칩. width는 실제 비율로 계산해 contain squish 방지.
  const showLogo = Boolean(src) && !failed;
  const logoWidth = aspectRatio ? Math.round(LOGO_HEIGHT * aspectRatio) : 60;

  if (showLogo) {
    return (
      <View style={[styles.logoChip, bg ? { backgroundColor: bg } : null]}>
        <Image
          source={{ uri: src as string }}
          style={{ width: logoWidth, height: LOGO_HEIGHT }}
          resizeMode="contain"
          accessibilityLabel={label}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  // 로고 없으면 텍스트 배지. bg 있으면 당색 칩 배경 적용(개혁신당 등).
  return (
    <View style={[styles.badge, bg ? { backgroundColor: bg } : null, containerStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#4e5968' },
  logoChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
