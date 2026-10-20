# 게임방 (1980 오락실 쿠폰 게임)

## 구조
```
index.html            손님용 (게임 선택 → 플레이 → 소감 적고 커피쿠폰 받기)
admin/index.html      관리자 (티켓 목록 / 표 / 사용 처리 / 인쇄 / 엑셀 .xlsx / CSV)
js/config.js          ✏️ 설정 (이름, Firebase, PIN, 난이도)
js/games/*.js         게임 1개 = 파일 1개 / registry.js 가 목록
js/xlsx.js            엑셀(.xlsx) 생성기 (외부 라이브러리 없음)
fonts/                갈무리(Galmuri) 한글 픽셀 폰트 — OFL 라이선스(파일 포함)
```

## 실행
- `file://`로 열면 모듈이 막혀. 로컬은 `python3 -m http.server 8000` 후 `http://localhost:8000`
- Firebase 설정 전에는 **데모 모드**(브라우저 저장). 운영은 `js/config.js`에 firebaseConfig 넣기.
- 정적 호스팅(Firebase Hosting / Vercel / Netlify)에 폴더째 올리면 `/admin/` 으로 접속돼.

## 게임 10개 (추억의 오락실)
100m 달리기 · 카드 짝맞추기 · 동전 받기 · 숫자 야구 · 벽돌깨기 · 두더지 잡기 · 서부 결투 · 펀치 머신 · 우주 전쟁 · 스태커
(`level` 1~3 이 메뉴의 ★ 난이도, 내가 체감으로 정한 값이야.)

## 게임 추가
1. `js/games/내게임.js` 작성 (`id, name, icon, unit, level, desc, goal, duration, mount(el, ctx)`)
2. `registry.js`에 import 후 배열에 추가
- 점수는 `ctx.add(n)`, 일찍 끝내려면 `ctx.finish()`, 정리 함수를 return.

## 난이도
`config.js`의 `gameOverrides: { tap: { goal: 40 } }` 처럼 게임별 목표/시간을 바꿔.

## 소감
쿠폰을 받을 때 이름 대신 **소감 한마디(최대 40자)** 를 적어. 쿠폰과 admin 표/엑셀에는 "소감" 으로 나와.
(예전 `name` 필드로 저장된 쿠폰도 admin에서 그대로 보여.)

## 엑셀 저장
admin의 `엑셀(.xlsx) 저장`: 현재 필터 기준으로 '쿠폰' 시트 + '요약' 시트. 브라우저는 파일에 자동으로 계속 쓸 수 없어서 버튼으로 내려받는 방식이야. 실제 데이터는 Firebase에 쌓여.

## Firestore 규칙 (테스트 안 해봤으니 배포 전에 확인해줘)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /coupons/{code} {
      allow read: if true;
      allow create: if code.matches('^[01]{24}$') && request.resource.data.code == code && request.resource.data.used == false;
      allow update: if resource.data.used == false && request.resource.data.used == true
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['used','usedAt']);
      allow delete: if false;
    }
  }
}
```

## 한계 (알아둬)
- 관리자 PIN은 클라이언트 코드에 있어서 **가벼운 잠금**일 뿐이야. 진짜 보안은 Firebase Auth가 필요해.
- 점수는 브라우저에서 계산돼서 개발자도구로 조작할 수 있어. 소규모 이벤트용.
- `maxCouponsPerDevice`는 브라우저 저장소 기준이라 시크릿 모드로 우회 가능.
- 소감은 손님이 자유롭게 쓰는 글이라 admin/인쇄물에 그대로 나와. (HTML은 안전하게 처리하지만 내용 검열은 없어.)
