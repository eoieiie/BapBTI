/** @type {import('tailwindcss').Config} */
// 볼트 실무.md "앱 UI 판단 기준"(2026-09-19): 토스식 — 회색 바닥 + 흰 면, 테두리 금지, 요소당 신호 하나.
// px·색은 브라키(gwc-app) 복제. 포인트색(accent)은 화면당 주행동 하나에만.
// 정체성 색(type.*)은 결과 카드 전용 — 병주가 카드를 그리면 바꾼다.
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class', // NativeWind 가 웹에서 'media' 면 크래시 (브라키와 동일)
  theme: {
    extend: {
      colors: {
        bg: '#F2F4F6', // 토스 톤 뉴트럴 바닥
        ink: '#1C1C1E', // 본문
        sub: '#8E8E93', // 보조
        accent: { DEFAULT: '#E4572E', soft: '#FBE4DC' },
        type: {
          authority: '#B23A2A',
          explorer: '#2A6FB2',
          balanced: '#6B7A3A',
        },
      },
    },
  },
  plugins: [],
};
