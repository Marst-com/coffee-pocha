# 커피포차 게임 쿠폰

## 구조
```
index.html            손님용 (게임 → 쿠폰 발급)
admin/index.html      관리자 (티켓 목록 / 표 / 사용 처리 / 인쇄 / 엑셀 .xlsx / CSV)
js/config.js          ✏️ 설정 (카페 이름, Firebase, PIN, 난이도)
js/games/*.js         게임 1개 = 파일 1개
js/games/registry.js  게임 목록 (현재 10개)
js/xlsx.js            엑셀(.xlsx) 생성기 (외부 라이브러리 없음)
```

## 실행
- `file://`로 열면 모듈이 막혀. 로컬은 `python3 -m http.server 8000` 후 `http://localhost:8000`
- Firebase 설정 전에는 **데모 모드**(브라우저 저장)로 돌아가. 실제 운영은 `js/config.js`에 firebaseConfig 넣기.
- 배포: Firebase Hosting / Vercel / Netlify 등 정적 호스팅에 폴더째 올리면 `/admin/` 으로 접속돼.

## 게임 10개
연타 왕 · 짝 맞추기 · 원두 받기 · 번개 계산 · 숫자 순서대로 · 두더지 잡기 · 번개 반응 · 타이밍 샷 · 색깔 헷갈려 · 탑 쌓기
(각 게임 파일의 `level`(1~3)이 메뉴판의 ★ 난이도로 표시돼. 체감 기준으로 정한 값이야.)

## 게임 추가
1. `js/games/내게임.js` 작성 (`id, name, icon, unit, desc, goal, duration, mount(el, ctx)`)
2. `registry.js`에 import 후 배열에 추가
- `level: 1~3`도 넣어줘. 점수는 `ctx.add(n)`, 일찍 끝내려면 `ctx.finish()`, 정리 함수를 return.

## 난이도
`config.js`의 `gameOverrides: { tap: { goal: 40 } }` 처럼 게임별 목표/시간을 바꿔.

## Firestore 규칙 (콘솔 > Firestore > 규칙) — 테스트 안 해봤으니 배포 전에 확인해줘
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
- 관리자 PIN은 클라이언트 코드에 있어서 **가벼운 잠금**일 뿐이야. 진짜 보안이 필요하면 Firebase Auth로 admin만 쓰기/읽기 허용해야 해.
- 점수는 브라우저에서 계산돼서 개발자도구로 조작하면 쿠폰을 받을 수 있어. 소규모 이벤트용 수준.
- `maxCouponsPerDevice`도 브라우저 저장소 기준이라 시크릿 모드로 우회 가능.

## 엑셀 저장
admin의 `엑셀(.xlsx) 저장` 버튼: 현재 필터 기준으로 '쿠폰' 시트(발급시간은 실제 날짜 값) + '요약' 시트(사용/미사용, 게임별 건수)가 생겨. 브라우저가 파일을 자동으로 계속 쓸 수는 없어서, 필요할 때 버튼으로 내려받는 방식이야. 실제 데이터는 Firebase에 계속 쌓여.
