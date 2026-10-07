import { QUESTIONS, scoreAxes, typeCode, AXES, hasTakenQuiz } from '../quiz';

describe('문항 구성', () => {
  it('축마다 2문항', () => {
    for (const axis of AXES) expect(QUESTIONS.filter((q) => q.axis === axis)).toHaveLength(2);
  });
  it('id 가 겹치지 않는다', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
});

describe('scoreAxes / typeCode', () => {
  const allA = Object.fromEntries(QUESTIONS.map((q) => [q.id, 'A' as const]));
  const allB = Object.fromEntries(QUESTIONS.map((q) => [q.id, 'B' as const]));

  it('전부 A 면 네 축이 모두 +1', () => {
    expect(scoreAxes(allA)).toEqual({ explore: 1, spice: 1, korean: 1, lead: 1 });
    expect(typeCode(scoreAxes(allA))).toBe('탐매한주');
  });
  it('전부 B 면 네 축이 모두 -1', () => {
    expect(typeCode(scoreAxes(allB))).toBe('반순외수');
  });
  it('한 축에서 갈리면 0 이 되고, 0 은 앞글자', () => {
    const mixed = { ...allA, q2: 'B' as const };
    expect(scoreAxes(mixed).explore).toBe(0);
    expect(typeCode(scoreAxes(mixed))).toBe('탐매한주');
  });
  it('답이 없어도 네 글자가 나온다', () => {
    expect(typeCode(null)).toHaveLength(4);
    expect(typeCode({})).toBe('탐매한주');
  });
});

describe('hasTakenQuiz', () => {
  it('축 네 개가 다 있어야 테스트한 것', () => {
    expect(hasTakenQuiz(null)).toBe(false);
    expect(hasTakenQuiz({})).toBe(false);
    expect(hasTakenQuiz({ explore: 1, spice: 0, korean: -1 })).toBe(false);
    expect(hasTakenQuiz({ explore: 1, spice: 0, korean: -1, lead: 0 })).toBe(true);
  });
});
