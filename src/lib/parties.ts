import { API_BASE_URL } from '@/api/client';

// 웹과 동일한 로고. RN은 /public 경로 직접 못 읽으므로 배포 서버의 절대 URL로 로드.
// bg: 로고를 감싸는 칩 배경. 로고 글자색에 맞춰 대비 확보.
//   - 국민의힘: 진한 글자 → 옅은 빨강
//   - 더불어민주당: 파란 글자 → 옅은 파랑
//   - 조국혁신당: 불투명 컬러 로고 → 옅은 회색
//   - 개혁신당: 흰 "개혁" + 주황 "신당" → 어두운 배경이라야 둘 다 보임
const PARTY_STYLE: Record<string, { logo: string; bg: string }> = {
  국민의힘: { logo: '/assets/parties/ppp.png', bg: '#fef2f2' },
  더불어민주당: { logo: '/assets/parties/dpp.png', bg: '#e8f3ff' },
  조국혁신당: { logo: '/assets/parties/rpp.png', bg: '#f2f4f6' },
  개혁신당: { logo: '/assets/parties/rp.png', bg: '#191f28' },
};

export function getPartyPresentation(party: string) {
  const label = party.split('/')[0]?.trim() ?? party.trim();
  const style = PARTY_STYLE[label] ?? null;

  return {
    label,
    src: style ? `${API_BASE_URL}${style.logo}` : null,
    bg: style?.bg ?? null,
  };
}
