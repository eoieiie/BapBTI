import { bapType, explorationRatio, topFood } from '../bapbti';

describe('explorationRatio — 축 1 재료', () => {
  it('3끼 미만이면 null (타입 못 뽑음)', () => {
    expect(explorationRatio(['a', 'b'])).toBeNull();
  });
  it('최근 10끼만 본다', () => {
    const ids = ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'z', 'y', 'x'];
    expect(explorationRatio(ids)).toBe(0.1);
  });
  it('전부 다르면 1', () => {
    expect(explorationRatio(['a', 'b', 'c'])).toBe(1);
  });
});

describe('bapType — 라벨', () => {
  it('null → unknown', () => expect(bapType(null)).toBe('unknown'));
  it('0.7 이상 탐험(도감형)', () => expect(bapType(0.7)).toBe('explorer'));
  it('0.4 이하 반복(권위자형)', () => expect(bapType(0.4)).toBe('authority'));
  it('사이는 균형', () => expect(bapType(0.55)).toBe('balanced'));
});

describe('topFood', () => {
  it('최다, 동률이면 앞의 것', () => {
    expect(topFood([{ food_id: 'a', n: 3 }, { food_id: 'b', n: 5 }, { food_id: 'c', n: 5 }])).toEqual({ food_id: 'b', n: 5 });
    expect(topFood([])).toBeNull();
  });
});
