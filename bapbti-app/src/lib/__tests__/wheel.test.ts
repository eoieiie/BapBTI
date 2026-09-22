// buildWheel 이 아니라 그 안의 규칙(roulettePool)만 테스트한다. 당첨 보정은 useLiveSession 안에 있어서
// 여기서는 "풀에 없는 당첨 후보"가 생길 수 있는 조건만 못박아 둔다.
import { roulettePool } from '../decision';

describe('룰렛 풀과 서버 결과의 어긋남', () => {
  it('서버가 0표 후보를 골랐다면 클라이언트 풀에는 없다 — 화면에서 끼워 넣어야 한다', () => {
    const candidates = [
      { food_id: 'a', vetoed_by: null },
      { food_id: 'b', vetoed_by: null },
    ];
    const pool = roulettePool(candidates, [{ food_id: 'a' }]);
    expect(pool).toEqual(['a']);
    expect(pool.includes('b')).toBe(false);
  });
});
