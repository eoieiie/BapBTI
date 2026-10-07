// 온보딩 테스트 — 네 축 × 2문항. 결과는 네 글자 코드가 된다.
// 근거: Food Neophobia Scale (Pliner & Hobden, 1992)의 탐험↔반복 축 + 식행동 차이가 큰 축 셋.
// 문항 원칙: ① 성향을 묻지 말고 상황을 준다 ② 두 답이 다 괜찮아 보여야 한다 ③ 추상어 대신 음식 이름.

export const AXES = ['explore', 'spice', 'korean', 'lead'] as const;
export type Axis = (typeof AXES)[number];

/** 각 축의 양끝 글자. 네 글자를 이어 붙인 것이 그 사람의 코드 (예: 탐매한주) */
export const AXIS_LETTERS: Record<Axis, { pos: string; neg: string }> = {
  explore: { pos: '탐', neg: '반' }, // 탐험 / 반복
  spice: { pos: '매', neg: '순' }, // 매운맛 / 순한맛
  korean: { pos: '한', neg: '외' }, // 한식 / 외국음식
  lead: { pos: '주', neg: '수' }, // 주도 / 수용
};

export interface Question {
  id: string;
  axis: Axis;
  /** 상황 */
  situation: string;
  /** A 를 고르면 +1, B 를 고르면 -1 */
  a: string;
  b: string;
}

export const QUESTIONS: Question[] = [
  { id: 'q1', axis: 'explore', situation: '학교 앞에 새 가게가 생겼다', a: '오늘 저기 가보자', b: '늘 가던 데 가자' },
  { id: 'q2', axis: 'explore', situation: '메뉴판에 처음 보는 이름이 있다', a: '뭔지 모르겠는데 시켜본다', b: '아는 거 시킨다' },
  { id: 'q3', axis: 'spice', situation: '오늘 좀 스트레스받았다', a: '마라탕', b: '설렁탕' },
  { id: 'q4', axis: 'spice', situation: '땀 뻘뻘 흘리면서 먹는 밥', a: '그게 제맛이지', b: '밥 먹고 왜 고생을 해' },
  { id: 'q5', axis: 'korean', situation: '아무거나 골라도 되는 점심', a: '김치찌개', b: '파스타' },
  { id: 'q6', axis: 'korean', situation: '해외여행 첫 끼', a: '일단 한식당 찾는다', b: '현지 음식부터' },
  { id: 'q7', axis: 'lead', situation: '단톡방에 "뭐 먹지?"가 떴다', a: '바로 메뉴를 던진다', b: '누가 말하길 기다린다' },
  { id: 'q8', axis: 'lead', situation: '다 정해졌는데 나만 별로다', a: '한마디 한다', b: '그냥 먹는다, 다음에 말하지' },
];

export type Answers = Record<string, 'A' | 'B'>;
export type Axes = Record<Axis, number>;

/** 답을 축 값으로. 각 축은 문항 2개의 평균이라 -1, 0, 1 셋 중 하나가 된다. */
export function scoreAxes(answers: Answers): Axes {
  const out = { explore: 0, spice: 0, korean: 0, lead: 0 } as Axes;
  for (const axis of AXES) {
    const qs = QUESTIONS.filter((q) => q.axis === axis);
    const sum = qs.reduce((acc, q) => acc + (answers[q.id] === 'A' ? 1 : answers[q.id] === 'B' ? -1 : 0), 0);
    out[axis] = qs.length ? sum / qs.length : 0;
  }
  return out;
}

/** 테스트를 했는가. 링크로 들어온 사람은 이름만 있고 축이 없다. */
export function hasTakenQuiz(axes: Partial<Axes> | null | undefined): boolean {
  return !!axes && AXES.every((a) => typeof axes[a] === 'number');
}

/** 네 글자 코드. 0(동점)이면 축의 앞글자를 쓴다. 테스트 전이면 부르지 말 것 — hasTakenQuiz 로 먼저 거른다. */
export function typeCode(axes: Partial<Axes> | null | undefined): string {
  return AXES.map((a) => {
    const v = axes?.[a] ?? 0;
    const { pos, neg } = AXIS_LETTERS[a];
    return v >= 0 ? pos : neg;
  }).join('');
}
