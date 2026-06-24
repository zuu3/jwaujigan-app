import { API_BASE_URL } from '@/api/client';

// 웹과 동일한 로고. RN은 /public 경로 직접 못 읽으므로 배포 서버의 절대 URL로 로드.
const PARTY_LOGO_PATHS: Record<string, string> = {
  국민의힘: '/assets/parties/ppp.png',
  더불어민주당: '/assets/parties/dpp.png',
  조국혁신당: '/assets/parties/rpp.png',
  개혁신당: '/assets/parties/rp.png',
};

export function getPartyPresentation(party: string) {
  const label = party.split('/')[0]?.trim() ?? party.trim();
  const path = PARTY_LOGO_PATHS[label] ?? null;

  return {
    label,
    src: path ? `${API_BASE_URL}${path}` : null,
  };
}
