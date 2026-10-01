import { isValidHandle, sanitizeHandle, suggestHandle } from '../handle';

describe('sanitizeHandle', () => {
  it('대문자는 소문자로, 허용 안 되는 글자는 뺀다', () => {
    expect(sanitizeHandle('Byeong Joo!')).toBe('byeongjoo');
    expect(sanitizeHandle('한글이름')).toBe('');
    expect(sanitizeHandle('bap_bti.99')).toBe('bap_bti99');
  });
  it('16자에서 자른다', () => {
    expect(sanitizeHandle('a'.repeat(30))).toHaveLength(16);
  });
});

describe('isValidHandle', () => {
  it('3~16자 소문자·숫자·밑줄만', () => {
    expect(isValidHandle('abc')).toBe(true);
    expect(isValidHandle('ab')).toBe(false);
    expect(isValidHandle('a'.repeat(17))).toBe(false);
    expect(isValidHandle('Abc')).toBe(false);
    expect(isValidHandle('a b')).toBe(false);
  });
});

describe('suggestHandle', () => {
  it('영문 이름이면 그걸 쓴다', () => expect(suggestHandle('Byeongjoo')).toBe('byeongjoo'));
  it('한글 이름이면 비워서 직접 쓰게 한다', () => expect(suggestHandle('황병주')).toBe(''));
  it('너무 짧으면 비운다', () => expect(suggestHandle('ab')).toBe(''));
});
