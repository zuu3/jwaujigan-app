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
export function PartyBadge({ party, containerStyle, textStyle }: Props) {
  const { label, src, bg } = getPartyPresentation(party);
  const [failed, setFailed] = useState(false);

  // 로고 있으면 당색 칩 안에 로고만(원본이 가로로 긴 비율 → 와이드 박스 + contain).
  // 칩 배경은 로고 글자색에 맞춰 대비 확보(개혁신당 흰글자 = 어두운 배경).
  // 로고 없으면(무소속 등) 텍스트 라벨 pill로 폴백.
  const showLogo = Boolean(src) && !failed;

  if (showLogo) {
    return (
      <View style={[styles.logoChip, bg ? { backgroundColor: bg } : null]}>
        <Image
          source={{ uri: src as string }}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel={label}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.badge, containerStyle]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  logoChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  // 로고 원본 ~841×(199~425), 가로로 긴 형태. 높이 고정·가로 여유 + contain → 비율 유지
  logo: { width: 60, height: 16 },
});
