export const ko = {
  common: { back: '뒤로', save: '저장', cancel: '취소', add: '추가', share: '공유', loading: '불러오는 중', error: '문제가 생겼어', retry: '다시 시도', people: '%{n}명', nth: '%{n}번째', nthSuffix: '번째' },
  tabs: { groups: '모임', me: '내 밥비티아이' },
  home: { title: '내 모임', create: '모임 만들기', empty: '아직 모임이 없어', createTitle: '새 모임', groupName: '모임 이름', yourName: '내 이름', recent: '최근' },
  group: { members: '멤버 %{n}', start: '오늘 뭐먹지', recent: '최근 기록', restrictions: '못 먹는 거 설정', copyLink: '초대 링크 복사', copied: '복사됐어. 카톡에 붙여넣어', rename: '이름 바꾸기', yourName: '내 이름' },
  invite: { title: '%{name}에 초대됐어', who: '너 누구야?', orNew: '또는', namePlaceholder: '이름 입력', join: '참여하기', noLogin: '로그인 없음. 이 기기에 기억돼', notFound: '초대 링크가 잘못됐어', taken: '이미 누가 잡은 이름이야' },
  session: {
    title: '오늘 뭐먹지',
    status: { open: '후보 모으는 중', voting: '투표 중', done: '결정됨' },
    participants: '참여 %{n}', candidates: '후보', addCandidate: '후보 추가', search: '음식 검색',
    proposedBy: '제안 %{name}', pitchPlaceholder: '한 줄 어필 (선택)', writePitch: '어필 쓰기', remove: '빼기', vetoed: '%{name} 못 먹어서 빠짐', startVoting: '투표 시작', hostOnly: '호스트만 보임',
    pickUpTo: '땡기는 거 최대 2개', voted: '%{done} / %{total} 투표함', spin: '룰렛 돌리기', spinHint: '호스트만 · 다 안 찍어도 돌릴 수 있음',
    spinning: '돌리는 중…', pool: '1표 이상 받은 후보만 올라감', result: '결과', toCard: '카드 보기', maxVotes: '2개까지만',
  },
  card: { title: '결과', heroPair: '%{name}랑 같이 먹은 밥', heroGroup: '이 모임의 %{food}', heroMine: '내 %{food}', heroFirst: '첫 %{food}', with: '%{names}와 함께', pairNth: '%{name}랑 %{n}번째 밥', groupNth: '이 모임 %{food} %{n}번째', myNth: '내 %{food} %{n}번째', first: '첫 %{food}!', saved: '기록됐어', saveImage: '이미지 저장', share: '공유' },
  me: {
    title: '내 밥비티아이', typeLabel: '타입 · 라벨은 임시',
    types: { authority: '권위자형', explorer: '도감형', balanced: '균형형', unknown: '아직 몰라' },
    typeHint: { authority: '먹던 거 또 먹는 사람', explorer: '새 거 먼저 먹어보는 사람', balanced: '그때그때', unknown: '3끼만 더 먹으면 나와' },
    axisRepeat: '반복', axisExplore: '탐험', total: '총 끼니', top: '최다', distinct: '고유 음식', dogam: '도감 %{n} / %{total}', people: '같이 먹은 사람', times: '%{n}번',
    noMeals: '아직 기록이 없어. 모임에서 오늘 뭐먹지 눌러봐',
  },
  restrictions: {
    title: '못 먹는 거', hint: '한 번만 설정하면 돼. 후보에서 자동으로 빠져', tags: '태그', foods: '음식 직접 추가', kind: '종류',
    kinds: { allergy: '알러지', dislike: '싫어함', belief: '신념' },
    tag: { spicy: '매운', seafood: '해산물', pork: '돼지고기', beef: '소고기', chicken: '닭고기', gluten: '밀가루', dairy: '유제품', nuts: '견과', halal: '할랄', vegetarian: '채식', vegan: '비건' },
  },
};
export type Messages = typeof ko;
