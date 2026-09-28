# 나날서가 홈페이지 (www.나날서가.com = xn--o39a30gya499n.com)

김민웅 대표의 AI 자서전 서비스 '나날서가' 공식 홈페이지. 대표와는 한국어로, 쉬운 말로 소통한다.

## 배포
- 이 저장소의 `main`에 푸시하면 Netlify가 자동 배포한다 (1~2분). 수정 요청을 받으면 고치고 → 확인하고 → 커밋·푸시까지 한다.
- 되돌리기: Netlify → Deploys에서 이전 배포 선택.
- 비밀 값(카카오·네이버·구글 키, SESSION_SECRET)은 절대 커밋하지 않는다. Netlify 환경변수에만 있다 (README-설정안내.md 참고).

## 구조
- `public/` 정적 화면. `index.html`은 직접 편집. `login/welcome/my/terms/privacy.html`은 `tools/build_pages.py`로 생성하므로 그 파일을 고친 뒤 `python3 tools/build_pages.py` 실행.
- `public/site.css` 하위 페이지 공통 스타일. `index.html`은 자체 `<style>`을 가짐.
- `netlify/functions/` 로그인 서버 (Netlify Functions v2, 경로는 각 파일의 `config.path`).
- `netlify/lib/` 서명 쿠키(session), 제공자별 OAuth(providers), 회원 명부(members, Netlify Blobs "members").
- 출시 알림 신청서는 Netlify Forms (`name="waitlist"`).

## 브랜드
- 색: 종이 #F5F1E8, 먹 #2A2F3A, 남색 #34507A, 해 #E0702F, 도장 #B5523B, 선 #E2D9C6
- 글꼴: Gowun Batang(제목), IBM Plex Sans KR(본문), Nanum Pen Script(손글씨), IBM Plex Mono(숫자·청구기호)
- 로고: 남색 책갈피 + 주황 해 + 종이색 띠 (SVG는 index.html 헤더 참고)
- 예시는 특정 지역에 치우치지 않게 전국 곳곳의 이야기로 쓴다.

## 확인
- 로그인 기능을 고치면 `bash tests/run.sh` (가짜 제공자로 가입·재로그인·탈퇴·위조 방지 점검).
- 화면을 고치면 휴대폰 폭(390px)에서 가로 스크롤이 생기지 않는지 확인.

## 커밋 메시지 끝에 붙일 것
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
