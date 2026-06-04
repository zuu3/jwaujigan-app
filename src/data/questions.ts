export type PoliticalAxis = 'economic' | 'security' | 'social';

export type Question = {
  id: string;
  axis: PoliticalAxis;
  reversed: boolean;
  text: string;
};

export const AXIS_LABELS: Record<PoliticalAxis, string> = {
  economic: '경제',
  security: '안보',
  social: '사회',
};

export const questions: Question[] = [
  { id: 'q1', axis: 'economic', reversed: false, text: '대기업 규제를 강화해 중소기업과의 격차를 줄여야 한다' },
  { id: 'q2', axis: 'economic', reversed: false, text: '부동산 세금을 높여 집값을 안정시키는 것이 맞다' },
  { id: 'q13', axis: 'social', reversed: false, text: '병역 의무는 성별 관계없이 동등하게 적용되어야 한다' },
  { id: 'q3', axis: 'economic', reversed: false, text: '최저임금을 빠르게 올리는 것이 경제 전체에 도움이 된다' },
  { id: 'q6', axis: 'security', reversed: true, text: '주한미군은 한국 안보에 반드시 필요하다' },
  { id: 'q4', axis: 'economic', reversed: false, text: '공공 의료·교육 서비스 확대를 위해 세금을 더 걷어도 괜찮다' },
  { id: 'q12', axis: 'social', reversed: false, text: '이민자·외국인 노동자 수용을 더 확대해야 한다' },
  { id: 'q7', axis: 'security', reversed: false, text: '대북 제재보다 교류·협력이 한반도 평화에 더 효과적이다' },
  { id: 'q5', axis: 'economic', reversed: true, text: '기업의 자유로운 경쟁이 보장될 때 경제가 더 잘 성장한다' },
  { id: 'q14', axis: 'social', reversed: true, text: '전통적인 가족 구조와 가치관은 사회 안정에 중요하다' },
  { id: 'q8', axis: 'security', reversed: true, text: '사드 배치는 국가 안보를 위해 필요한 결정이었다' },
  { id: 'q11', axis: 'social', reversed: false, text: '동성 결혼을 법적으로 인정해야 한다' },
  { id: 'q9', axis: 'security', reversed: false, text: '한미동맹보다 자주적 외교 노선을 강화해야 한다' },
  { id: 'q15', axis: 'social', reversed: false, text: '소수자 권리 보호를 위한 차별금지법이 필요하다' },
  { id: 'q10', axis: 'security', reversed: false, text: '북한과의 경제협력은 한국 경제에도 실질적인 이익이 된다' },
];

export const likertOptions = [
  { label: '매우 동의', value: 2 },
  { label: '동의', value: 1 },
  { label: '모르겠다', value: 0 },
  { label: '비동의', value: -1 },
  { label: '매우 비동의', value: -2 },
] as const;
