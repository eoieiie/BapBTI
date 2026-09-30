-- 음식 분류. 한식 ↔ 외국음식 축 계산용 (0009).
-- 기준: 그 음식이 한국에서 '한식'으로 인식되는가. 치킨은 한국식이지만 분류상 other 로 둔다.
update public.foods set cuisine = 'korean' where name in ('김치찌개', '된장찌개', '순두부찌개', '부대찌개', '감자탕', '비빔밥', '김밥', '떡볶이', '닭갈비', '찜닭', '삼계탕', '삼겹살', '보쌈', '제육볶음', '불고기', '갈비탕', '설렁탕', '냉면', '칼국수', '콩국수', '순대국', '돼지국밥', '해물파전', '잡채');
update public.foods set cuisine = 'chinese' where name in ('마라탕', '마라샹궈', '짜장면', '짬뽕', '탕수육', '양꼬치');
update public.foods set cuisine = 'japanese' where name in ('돈까스', '초밥', '라멘', '카레');
update public.foods set cuisine = 'western' where name in ('파스타', '피자', '햄버거', '샐러드');
update public.foods set cuisine = 'other' where name in ('치킨', '쌀국수');
