// 못먹음 태그. DB 값은 영어 슬러그, 라벨은 i18n.
// 재료 태그 = "있으면 거부". 요구 태그 = 음식에 짝(*_ok)이 없으면 거부.
export const INGREDIENT_TAGS = ['spicy', 'seafood', 'pork', 'beef', 'chicken', 'gluten', 'dairy', 'nuts'] as const;
export const REQUIREMENT_TAGS = ['halal', 'vegetarian', 'vegan'] as const;

export type IngredientTag = (typeof INGREDIENT_TAGS)[number];
export type RequirementTag = (typeof REQUIREMENT_TAGS)[number];
export type RestrictionTag = IngredientTag | RequirementTag;

export const REQUIREMENT_OK: Record<RequirementTag, string> = {
  halal: 'halal_ok',
  vegetarian: 'veg_ok',
  vegan: 'vegan_ok',
};

export function isIngredientTag(t: string): t is IngredientTag {
  return (INGREDIENT_TAGS as readonly string[]).includes(t);
}
export function isRequirementTag(t: string): t is RequirementTag {
  return (REQUIREMENT_TAGS as readonly string[]).includes(t);
}
