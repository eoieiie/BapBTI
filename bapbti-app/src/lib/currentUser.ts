// 현재 익명 유저 id. AuthProvider 가 채우고 훅들이 읽는다.
// supabase.auth.getUser() 는 매번 네트워크로 토큰을 검증해서, 쿼리마다 부르면 화면당 몇 번씩 왕복한다.
// 화면 진입은 Gate 가 세션을 확보한 뒤에만 일어나므로 읽는 쪽에서는 항상 값이 있다.
let userId: string | null = null;

export function setCurrentUserId(id: string | null): void {
  userId = id;
}

export function currentUserId(): string | null {
  return userId;
}
