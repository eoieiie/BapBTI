// 핸들 — 프로필의 주소. 소문자·숫자·밑줄 3~16자 (0009 의 check 제약과 같은 규칙).
export const HANDLE_RE = /^[a-z0-9_]{3,16}$/;
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 16;

/** 입력 중 걸러내기 — 허용 문자만 남기고 길이를 자른다. */
export function sanitizeHandle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, HANDLE_MAX);
}

export function isValidHandle(h: string): boolean {
  return HANDLE_RE.test(h);
}

/**
 * 이름에서 핸들 후보. 한글 이름이면 쓸 글자가 없으므로 빈 문자열을 돌려주고 직접 입력하게 한다.
 * (로마자 변환을 넣으면 사람마다 표기가 갈려서 오히려 헷갈린다)
 */
export function suggestHandle(displayName: string): string {
  const base = sanitizeHandle(displayName);
  return base.length >= HANDLE_MIN ? base : '';
}
