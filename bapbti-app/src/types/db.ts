// DB 행과 1:1. supabase/migrations 가 원천.
export type Uuid = string;

export interface GroupRow {
  id: Uuid;
  name: string;
  invite_code: string;
  created_by: Uuid | null;
  created_at: string;
}
export interface MemberRow {
  id: Uuid;
  group_id: Uuid;
  display_name: string;
  user_id: Uuid | null;
  created_at: string;
}
export interface FoodRow {
  id: Uuid;
  name: string;
  name_en: string;
  emoji: string;
  tags: string[];
  spice: number;
  description_en: string | null;
  group_id: Uuid | null;
}
export type RestrictionKind = 'allergy' | 'dislike' | 'belief';
export interface RestrictionRow {
  id: Uuid;
  member_id: Uuid;
  food_id: Uuid | null;
  tag: string | null;
  kind: RestrictionKind;
}
export type SessionStatus = 'open' | 'voting' | 'done';
export interface SessionRow {
  id: Uuid;
  group_id: Uuid;
  started_by: Uuid;
  status: SessionStatus;
  decided_food_id: Uuid | null;
  decided_at: string | null;
  created_at: string;
}
export interface ParticipantRow {
  session_id: Uuid;
  member_id: Uuid;
  joined_at: string;
  /** 투표를 했는가(무엇을 찍었는지가 아니라). 진행률용, 0010 */
  voted: boolean;
}
export interface CandidateRow {
  id: Uuid;
  session_id: Uuid;
  food_id: Uuid;
  proposed_by: Uuid;
  vetoed_by: Uuid | null;
  pitch: string | null;
  created_at: string;
}
export interface VoteRow {
  id: Uuid;
  session_id: Uuid;
  member_id: Uuid;
  food_id: Uuid;
  created_at: string;
}
export interface MealRow {
  id: Uuid;
  group_id: Uuid;
  session_id: Uuid | null;
  food_id: Uuid;
  eaten_at: string;
  place_name: string | null;
  note: string | null;
}

/** get_group_by_code 응답 */
export interface GroupByCode {
  id: Uuid;
  name: string;
  members: { id: Uuid; display_name: string; claimed: boolean; mine: boolean }[];
  active_session_id: Uuid | null;
}
