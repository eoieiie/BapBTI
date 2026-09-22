import { roulettePool } from '../decision';

describe('roulettePool — 룰렛에 올라가는 후보', () => {
  const cands = [
    { food_id: 'a', vetoed_by: null },
    { food_id: 'b', vetoed_by: null },
    { food_id: 'c', vetoed_by: 'B' }, // 거부권
  ];
  it('1표 이상 & 거부권 없는 것만', () => {
    expect(roulettePool(cands, [{ food_id: 'a' }, { food_id: 'a' }, { food_id: 'c' }])).toEqual(['a']);
  });
  it('아무도 안 찍었으면 거부권 없는 전부', () => {
    expect(roulettePool(cands, [])).toEqual(['a', 'b']);
  });
  it('거부권 걸린 후보는 표가 있어도 안 올라간다', () => {
    expect(roulettePool(cands, [{ food_id: 'c' }])).toEqual(['a', 'b']);
  });
  it('후보가 없으면 빈 목록', () => {
    expect(roulettePool([], [])).toEqual([]);
  });
});
