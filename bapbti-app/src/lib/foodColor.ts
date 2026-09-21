// 음식마다 고정색. 리스트 아이콘·룰렛 조각·결과 카드가 같은 색을 쓴다 — 음식 = 색 하나.
// 이모지는 촌스럽다는 병주 판단(2026-09-21)으로 화면에서 뺐다. 컬럼은 남겨둠(나중에 일러스트로).
// 전부 잉크(#1C1C1E) 글자가 읽히는 밝기.
const PALETTE = ['#FFB86B', '#F2B705', '#9BC53D', '#2EC4B6', '#8ED6FF', '#C9A7EB', '#FF8A80', '#FFD166'];

export function foodColor(foodId: string): string {
  let h = 0;
  for (let i = 0; i < foodId.length; i++) h = (h * 31 + foodId.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
