# 나날서가 홈페이지 · 카카오/네이버/구글 로그인 설정 안내

주소: https://www.나날서가.com  (개발자 센터에는 한글 대신 **xn--o39a30gya499n.com** 으로 적습니다)

## 들어 있는 것
- `public/` 홈페이지 화면 (index, login, welcome, my, terms, privacy …)
- `netlify/functions/` 로그인 서버 기능
  - `/auth/login/:provider` 로그인 시작 · `/auth/callback/:provider` 로그인 후 돌아오는 곳
  - `/api/me` 내 정보 · `/api/signup` 가입 완료 · `/api/account` 알림 설정·탈퇴 · `/auth/logout`
- `netlify/lib/` 공통 코드 (서명 쿠키, 제공자별 로그인, 회원 명부)
- `netlify.toml` Netlify 설정 · `package.json` 회원 명부 저장용 라이브러리(@netlify/blobs)
- `tools/build_pages.py` 로그인·약관 화면 다시 만들기용 (배포에는 쓰이지 않음)

회원 정보는 Netlify Blobs의 **members** 저장소에 `kakao-회원번호` 같은 이름으로 저장됩니다.
비밀번호와 로그인 토큰은 저장하지 않습니다.

## 1. 개발자 센터에 앱 등록 (돌아올 주소를 정확히!)

| 제공자 | 등록할 돌아올 주소 (Redirect / Callback URI) |
|---|---|
| 카카오 | https://xn--o39a30gya499n.com/auth/callback/kakao |
| 네이버 | https://xn--o39a30gya499n.com/auth/callback/naver |
| Google | https://xn--o39a30gya499n.com/auth/callback/google |

### 카카오 (developers.kakao.com)
1. 내 애플리케이션 → 애플리케이션 추가 (앱 이름: 나날서가)
2. 앱 키의 **REST API 키** 복사 → `KAKAO_REST_API_KEY`
3. 플랫폼 → Web → 사이트 도메인 `https://xn--o39a30gya499n.com`
4. 카카오 로그인 → **활성화 ON**, Redirect URI 위 주소 등록
5. 동의항목 → 닉네임을 "필수 동의"로 (이메일은 비즈 앱 전환 후 선택 가능)
6. 보안 → Client Secret을 켰다면 그 값 → `KAKAO_CLIENT_SECRET` (끄면 비워 둠)

### 네이버 (developers.naver.com)
1. Application → 애플리케이션 등록, 사용 API: **네이버 로그인**
2. 제공 정보: 회원이름(필수), 이메일(선택)
3. 서비스 환경 **PC 웹**: 서비스 URL `https://xn--o39a30gya499n.com`, Callback URL 위 주소
4. Client ID → `NAVER_CLIENT_ID`, Client Secret → `NAVER_CLIENT_SECRET`
5. 처음엔 '개발 중' 상태라 **멤버관리에 넣은 아이디만** 로그인됩니다. 누구나 쓰게 하려면 **검수 요청**
   (서비스 설명, 로고, 개인정보 처리방침 주소 `https://xn--o39a30gya499n.com/privacy.html` 필요)

### Google (console.cloud.google.com)
1. 새 프로젝트(나날서가) → Google 인증 플랫폼(OAuth 동의 화면) → 대상 **외부**
2. 앱 이름 나날서가, 홈페이지 `https://xn--o39a30gya499n.com`,
   개인정보처리방침 `/privacy.html`, 서비스 약관 `/terms.html`, 승인된 도메인 `xn--o39a30gya499n.com`
3. 범위는 기본(openid, email, profile)만 → 별도 검증 없이 게시 가능
4. **앱 게시**를 눌러야 테스트 사용자 외에도 로그인됩니다
5. 클라이언트 만들기 → 웹 애플리케이션 → 승인된 리디렉션 URI 위 주소
6. 클라이언트 ID → `GOOGLE_CLIENT_ID`, 보안 비밀번호 → `GOOGLE_CLIENT_SECRET`

## 2. Netlify 환경변수
Netlify → 사이트 → Site configuration → **Environment variables** → Add a variable

| 이름 | 값 |
|---|---|
| SITE_URL | https://xn--o39a30gya499n.com |
| SESSION_SECRET | 40자 이상 아무렇게나 섞은 글자 (비밀번호 생성기로 만들기, 남에게 알리지 않기) |
| KAKAO_REST_API_KEY | 카카오 REST API 키 |
| KAKAO_CLIENT_SECRET | (켰을 때만) |
| NAVER_CLIENT_ID / NAVER_CLIENT_SECRET | 네이버 값 |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google 값 |

설정이 빠진 로그인 버튼은 누르면 "아직 준비 중이에요"라고 안내하니, 하나씩 켜도 됩니다.
환경변수를 바꾼 뒤에는 **다시 배포**해야 적용됩니다 (Deploys → Trigger deploy).

## 3. 배포 — 이번부터는 끌어다 놓기로는 안 됩니다
로그인 서버 기능(Functions)은 폴더 끌어다 놓기(Drop) 배포에서 동작하지 않습니다. 아래 둘 중 하나로 올리세요.

**A. GitHub 연결 (권장)**
1. github.com에서 새 저장소(예: nanalseoga-site, Private) 만들기
2. "uploading an existing file"을 눌러 이 폴더 안의 파일·폴더를 모두 끌어다 올리기
3. Netlify → 지금 사이트 → Site configuration → Build & deploy → **Link repository** → 위 저장소 선택
   (도메인 연결은 그대로 유지됩니다) → 이후 GitHub에 올릴 때마다 자동 배포

**B. Netlify CLI** (컴퓨터에 Node.js가 있을 때)
```
cd 이_폴더
npx netlify-cli login
npx netlify-cli link        # 지금 사이트 선택
npx netlify-cli deploy --prod
```

## 4. 사이트 보호 끄기
Site configuration → Access & security → Visitor access(Site protection)를 **없음**으로.
켜져 있으면 방문자에게 Netlify 로그인 화면만 보입니다.

## 5. 확인
1. https://www.나날서가.com/login.html → 카카오/네이버/Google 버튼으로 로그인
2. 처음이면 약관 동의 화면 → 가입 → "내 서재"
3. Netlify → 사이트 → **Blobs** → members 에서 가입한 회원 확인
4. 문제가 있으면 Netlify → Logs → Functions 에서 `[auth]`로 시작하는 줄을 확인
