# 게임방 (1980 오락실 방명록 게임)

게임을 깨면 **이름 + 소감**을 남기고, 관리자는 표로 보고 엑셀/JSON으로 내려받아.

## 구조
```
index.html            손님용 (게임 선택 → 플레이 → 이름·소감 남기기)
admin/index.html      관리자 (표 / 검색 / 엑셀 .xlsx / JSON / CSV / 인쇄)
js/config.js          ✏️ 설정 (이름, Firebase, PIN, 난이도)
js/entry.js           기록 저장 (이름 12자, 소감 40자 제한)
js/games/*.js         게임 1개 = 파일 1개 / registry.js 가 목록
js/xlsx.js            엑셀(.xlsx) 생성기 (외부 라이브러리 없음)
fonts/                갈무리(Galmuri) 한글 픽셀 폰트 — OFL 라이선스(파일 포함)
```

## 실행
- `file://`로 열면 모듈이 막혀. 로컬은 `python3 -m http.server 8000` 후 `http://localhost:8000`
- Firebase 설정 전에는 **데모 모드**(브라우저 저장). 운영은 `js/config.js`에 firebaseConfig 넣기.
- 정적 호스팅(Firebase Hosting / Vercel / Netlify)에 폴더째 올리면 `/admin/` 으로 접속돼.

## 관리자
- 표: 이름 · 소감 · 게임 · 점수 · 시간 (최신순), 게임별 필터, 이름/소감 검색
- `엑셀(.xlsx) 저장`: '방명록' 시트 + '요약' 시트 (현재 필터 기준)
- `JSON 저장` / `JSON 복사`: 현재 필터 기준 `[{name, note, game, gameId, score, goal, createdAt(ISO)}]`
- `CSV`, `인쇄`도 가능

## 제한 없음
기기당 횟수 제한을 없앴어. 같은 기기에서 몇 번이든 기록을 남길 수 있어.

## 게임 10개
100m 달리기 · 카드 짝맞추기 · 동전 받기 · 숫자 야구 · 벽돌깨기 · 두더지 잡기 · 서부 결투 · 펀치 머신 · 우주 전쟁 · 스태커

## 게임 추가
1. `js/games/내게임.js` 작성 (`id, name, icon, unit, level, desc, goal, duration, mount(el, ctx)`)
2. `registry.js`에 import 후 배열에 추가
- 점수는 `ctx.add(n)`, 일찍 끝내려면 `ctx.finish()`, 정리 함수를 return.

## 난이도
`config.js`의 `gameOverrides: { tap: { goal: 40 } }` 처럼 게임별 목표/시간을 바꿔.

## Firestore 규칙 (컬렉션 이름: `entries`, 배포 전에 확인해줘)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /entries/{id} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 12
                    && request.resource.data.note is string
                    && request.resource.data.note.size() > 0 && request.resource.data.note.size() <= 40;
      allow update, delete: if false;
    }
  }
}
```
(예전 쿠폰 버전의 `coupons` 컬렉션 데이터는 이 버전에서 읽지 않아.)

## 한계 (알아둬)
- 관리자 PIN은 클라이언트 코드에 있어서 **가벼운 잠금**일 뿐이야. 위 규칙은 `read: if true`라서 이름·소감이 외부에 노출될 수 있어. 진짜 보호는 Firebase Auth가 필요해.
- 점수는 브라우저에서 계산돼서 개발자도구로 조작할 수 있어. 소규모 이벤트용.
- 기기 제한이 없어서 같은 사람이 여러 번 남길 수 있어.
- 소감/이름은 손님이 자유롭게 쓰는 글이라 내용 검열은 없어. (HTML은 안전하게 처리해.)
