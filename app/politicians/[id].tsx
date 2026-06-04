import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePoliticianDetail, useFollowPolitician } from '@/api/politicians';
import { useMyFollows } from '@/api/mypage';
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/screen';
import { ErrorPanel, SkeletonCard } from '@/components/state-panels';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function partyColor(party: string) {
  if (party.includes('민주') || party.includes('조국')) return colors.blue500;
  if (party.includes('국민의힘') || party.includes('국민의 힘')) return colors.politicalRed;
  return colors.grey500;
}

function parseBio(bio: string | null) {
  if (!bio) return [];
  return bio.split(/\r?\n+/).map((l) => l.replace(/&[a-z#\d]+;/gi, (e) => {
    const map: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&middot;': '·', '&nbsp;': ' ' };
    return map[e] ?? e;
  }).trim()).filter(Boolean);
}

export default function PoliticianDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const detailQuery = usePoliticianDetail(id, token);
  const followsQuery = useMyFollows(token);
  const followMutation = useFollowPolitician(id, token);

  const pol = detailQuery.data;
  const isFollowing = (followsQuery.data ?? []).some((f) => f.id === id);
  const partyC = pol ? partyColor(pol.party) : colors.grey500;
  const bioLines = parseBio(pol?.biography ?? null);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={16}>
        <Text style={styles.back}>← 이전</Text>
      </Pressable>

      {detailQuery.isLoading ? <><SkeletonCard lines={3} /><SkeletonCard lines={4} /></> : null}
      {detailQuery.isError ? (
        <ErrorPanel message="의원 정보를 불러오지 못했어요." onRetry={() => void detailQuery.refetch()} />
      ) : null}

      {pol ? (
        <>
          {/* 프로필 헤더 */}
          <View style={styles.profile}>
            <View style={styles.avatar}>
              {pol.image ? (
                <Image source={{ uri: pol.image }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{pol.name[0]}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{pol.name}</Text>
              <View style={[styles.partyBadge, { borderColor: partyC }]}>
                <Text style={[styles.partyText, { color: partyC }]}>{pol.party}</Text>
              </View>
              <Text style={styles.district}>{pol.district}</Text>
              {pol.committee ? <Text style={styles.meta}>{pol.committee}</Text> : null}
              {pol.reelection ? <Text style={styles.meta}>{pol.reelection}</Text> : null}
            </View>
          </View>

          {/* 팔로우 버튼 */}
          <Pressable
            style={[styles.followBtn, isFollowing && styles.followBtnActive, followMutation.isPending && styles.followBtnDisabled]}
            onPress={() => followMutation.mutate(undefined, {
              onError: () => Alert.alert('오류', '팔로우 처리에 실패했어요. 다시 시도해 주세요.'),
            })}
            disabled={followMutation.isPending}
          >
            <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
              {followMutation.isPending ? '처리 중...' : isFollowing ? '팔로잉 ✓' : '+ 팔로우'}
            </Text>
          </Pressable>

          {/* 연락처 */}
          {(pol.phone || pol.email || pol.homepage) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>연락처</Text>
              {pol.phone ? (
                <Pressable onPress={() => void Linking.openURL(`tel:${pol.phone}`)}>
                  <Text style={styles.contactLink}>📞 {pol.phone}</Text>
                </Pressable>
              ) : null}
              {pol.email ? (
                <Pressable onPress={() => void Linking.openURL(`mailto:${pol.email}`)}>
                  <Text style={styles.contactLink}>✉️ {pol.email}</Text>
                </Pressable>
              ) : null}
              {pol.homepage ? (
                <Pressable onPress={() => void Linking.openURL(pol.homepage!)}>
                  <Text style={styles.contactLink}>🌐 홈페이지 바로가기</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* 약력 */}
          {bioLines.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>약력</Text>
              {bioLines.map((line, i) => (
                <Text key={i} style={styles.bioLine}>• {line}</Text>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.body, color: colors.grey600, fontWeight: '600' },
  profile: { flexDirection: 'row', gap: spacing[4], alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarImg: { width: 72, height: 72 },
  avatarInitial: { ...typography.headingLarge, color: colors.grey500 },
  profileInfo: { flex: 1, gap: spacing[1] },
  name: { ...typography.headingLarge, color: colors.grey900 },
  partyBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  partyText: { ...typography.caption, fontWeight: '600' },
  district: { ...typography.body, color: colors.grey600 },
  meta: { ...typography.bodySmall, color: colors.grey500 },
  followBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.grey200 },
  followBtnDisabled: { opacity: 0.5 },
  followBtnActive: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  followText: { ...typography.body, color: colors.grey700, fontWeight: '600' },
  followTextActive: { color: colors.blue500 },
  section: { gap: spacing[2] },
  sectionTitle: { ...typography.heading, color: colors.grey900 },
  contactLink: { ...typography.body, color: colors.blue500 },
  bioLine: { ...typography.body, color: colors.grey700, lineHeight: 22 },
});
