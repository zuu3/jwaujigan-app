import { API_BASE_URL } from '@/api/client';

// 웹과 동일한 로고. RN은 /public 경로 직접 못 읽으므로 배포 서버의 절대 URL로 로드.
// aspectRatio: 실제 PNG 크기(모두 841px 너비)에서 계산 — height 고정 시 width 결정에 사용.
// logo=null: 대비 문제 등으로 로고 미사용 → 텍스트 배지 폴백.
const PARTY_STYLE: Record<string, { logo: string | null; bg: string; aspectRatio: number | null }> = {
  국민의힘: { logo: '/assets/parties/ppp.png', bg: '#fef2f2', aspectRatio: 841 / 199 },  // ~4.22
  더불어민주당: { logo: '/assets/parties/dpp.png', bg: '#e8f3ff', aspectRatio: 841 / 425 },  // ~1.98
  조국혁신당: { logo: '/assets/parties/rpp.png', bg: '#f2f4f6', aspectRatio: 841 / 377 },  // ~2.23
  // 개혁신당 로고: 흰+주황 글자 → 밝은 bg엔 흰글자 안 보임, 어두운 bg는 이질적.
  // 텍스트 배지로 대체.
  개혁신당: { logo: null, bg: '#fff2e5', aspectRatio: null },
};

export function getPartyPresentation(party: string) {
  const label = party.split('/')[0]?.trim() ?? party.trim();
  const style = PARTY_STYLE[label] ?? null;

  return {
    label,
    src: style?.logo ? `${API_BASE_URL}${style.logo}` : null,
    bg: style?.bg ?? null,
    aspectRatio: style?.aspectRatio ?? null,
  };
}
