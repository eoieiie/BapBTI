import { roulettePool, tally, vetoedBy } from '../decision';

const 마라탕 = { id: 'f-mala', tags: ['spicy'] };
const 초밥 = { id: 'f-sushi', tags: ['seafood', 'halal_ok'] };
const 삼겹살 = { id: 'f-pork', tags: ['pork'] };
const 콩국수 = { id: 'f-kong', tags: ['gluten', 'veg_ok', 'vegan_ok', 'halal_ok'] };

describe('vetoedBy — 거부권', () => {
  it('음식 직접 지정이면 그 사람', () => {
    expect(vetoedBy(초밥, [{ member_id: 'B', food_id: 'f-sushi', tag: null }])).toBe('B');
  });
  it('재료 태그는 "있으면 거부"', () => {
    expect(vetoedBy(마라탕, [{ member_id: 'A', food_id: null, tag: 'spicy' }])).toBe('A');
    expect(vetoedBy(초밥, [{ member_id: 'A', food_id: null, tag: 'spicy' }])).toBeNull();
  });
  it('요구 태그(할랄·채식)는 "짝이 없으면 거부" — 방향이 반대', () => {
    const halal = [{ member_id: 'H', food_id: null, tag: 'halal' }];
    expect(vetoedBy(삼겹살, halal)).toBe('H');
    expect(vetoedBy(초밥, halal)).toBeNull();
    const vegan = [{ member_id: 'V', food_id: null, tag: 'vegan' }];
    expect(vetoedBy(콩국수, vegan)).toBeNull();
    expect(vetoedBy(초밥, vegan)).toBe('V');
  });
  it('제약 없으면 null', () => {
    expect(vetoedBy(삼겹살, [])).toBeNull();
  });
});

describe('tally / roulettePool — 룰렛 풀', () => {
  const cands = [
    { food_id: 'a', vetoed_by: null },
    { food_id: 'b', vetoed_by: null },
    { food_id: 'c', vetoed_by: 'B' }, // 거부권
  ];
  it('1표 이상 & 거부권 없는 것만', () => {
    const votes = [{ food_id: 'a' }, { food_id: 'a' }, { food_id: 'c' }];
    expect(tally(votes)).toEqual({ a: 2, c: 1 });
    expect(roulettePool(cands, votes)).toEqual(['a']);
  });
  it('아무도 안 찍었으면 거부권 없는 전부 (0표 후보로만 이뤄진 판)', () => {
    expect(roulettePool(cands, [])).toEqual(['a', 'b']);
  });
  it('거부권 걸린 후보는 표가 있어도 안 올라간다', () => {
    expect(roulettePool(cands, [{ food_id: 'c' }])).toEqual(['a', 'b']);
  });
});
