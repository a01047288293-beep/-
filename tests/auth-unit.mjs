process.env.SESSION_SECRET = "x".repeat(40); process.env.SITE_URL = "http://localhost:8899";
process.env.KAKAO_REST_API_KEY = "kkey"; process.env.NAVER_CLIENT_ID = "nid"; process.env.NAVER_CLIENT_SECRET = "nsec"; process.env.GOOGLE_CLIENT_ID = "gid"; process.env.GOOGLE_CLIENT_SECRET = "gsec";
const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opt = {}) => {
  url = String(url); calls.push({url, body: opt.body});
  const J = o => new Response(JSON.stringify(o), {status:200, headers:{"content-type":"application/json"}});
  if (url.startsWith("https://kauth.kakao.com/oauth/token")) return new URLSearchParams(opt.body).get("code") === "bad" ? new Response(JSON.stringify({error:"invalid_grant"}), {status:400}) : J({access_token:"KT"});
  if (url.startsWith("https://kapi.kakao.com/v2/user/me")) return J({id: 3141592, kakao_account:{profile:{nickname:"영자"}}});
  if (url.startsWith("https://nid.naver.com/oauth2.0/token")) return J({access_token:"NT"});
  if (url.startsWith("https://openapi.naver.com/v1/nid/me")) return J({resultcode:"00", response:{id:"nv-abc", name:"이말자", email:"mal@naver.com"}});
  if (url.startsWith("https://oauth2.googleapis.com/token")) return J({access_token:"GT"});
  if (url.startsWith("https://openidconnect.googleapis.com/v1/userinfo")) return J({sub:"1099", name:"Gil Soon", email:"gs@gmail.com", email_verified:true});
  throw new Error("unexpected fetch " + url);
};
const F = {};
for (const n of ["auth-login","auth-callback","auth-logout","me","signup","account"]) F[n] = (await import(`./netlify/functions/${n}.mjs`)).default;
const B = "http://localhost:8899";
const jar = new Map();
function cookieHeader(){ return [...jar].map(([k,v]) => `${k}=${v}`).join("; "); }
function absorb(res){ for (const c of res.headers.getSetCookie()) { const [kv, ...attrs] = c.split("; "); const [k, ...v] = kv.split("="); const val = v.join("="); if (attrs.includes("Max-Age=0")) jar.delete(k); else jar.set(k, val); } return res; }
async function call(fn, path, {method="GET", body, params={}, origin, cookie} = {}){
  const h = {cookie: cookie ?? cookieHeader()}; if (body) h["content-type"] = "application/json"; if (origin) h.origin = origin;
  return absorb(await F[fn](new Request(B + path, {method, headers:h, body: body ? JSON.stringify(body) : undefined}), {params}));
}
let ok = 0, bad = 0; const t = (name, cond, extra="") => { if (cond) { ok++; console.log("  ✓", name); } else { bad++; console.log("  ✗", name, extra); } };

for (const p of ["kakao","naver","google"]) {
  console.log(`\n[${p}] 처음 가입`);
  jar.clear();
  let r = await call("auth-login", `/auth/login/${p}`, {params:{provider:p}});
  const loc = new URL(r.headers.get("location")); const state = loc.searchParams.get("state");
  t("제공자 로그인 화면으로 보냄", r.status === 302 && /kakao|naver|google/.test(loc.host) && !!state);
  t("돌아올 주소가 정확함", loc.searchParams.get("redirect_uri") === `${B}/auth/callback/${p}`);
  r = await call("auth-callback", `/auth/callback/${p}?code=abc&state=${state}`, {params:{provider:p}});
  t("처음 온 사람은 약관 동의 화면으로", r.headers.get("location") === "/welcome.html", r.headers.get("location"));
  t("로그인 확인용 쿠키는 지움", !jar.has("nn_state"));
  let me = await (await call("me", "/api/me")).json();
  t("가입 전 상태로 이름이 넘어옴", me.user && me.user.pending && me.user.name.length > 0, JSON.stringify(me));
  r = await call("signup", "/api/signup", {method:"POST", body:{name:"테스트", terms:true, privacy:false, age:true}, origin:B});
  t("필수 동의 빠지면 거절", r.status === 400);
  r = await call("signup", "/api/signup", {method:"POST", body:{name:"테스트", terms:true, privacy:true, age:true}, origin:"https://evil.example"});
  t("다른 사이트에서 보낸 가입 요청 거절", r.status === 403);
  r = await call("signup", "/api/signup", {method:"POST", body:{name:"김테스트", terms:true, privacy:true, age:true, notice:true}, origin:B});
  t("가입 완료", r.status === 200);
  me = await (await call("me", "/api/me")).json();
  t("회원 정보 조회", me.user && !me.user.pending && me.user.name === "김테스트" && me.user.notice === true && me.user.provider === p, JSON.stringify(me));
  console.log(`[${p}] 다시 로그인`);
  jar.clear();
  r = await call("auth-login", `/auth/login/${p}`, {params:{provider:p}});
  const st2 = new URL(r.headers.get("location")).searchParams.get("state");
  r = await call("auth-callback", `/auth/callback/${p}?code=abc&state=${st2}`, {params:{provider:p}});
  t("기존 회원은 내 서재로 바로", r.headers.get("location") === "/my.html", r.headers.get("location"));
  r = await call("account", "/api/account", {method:"PATCH", body:{notice:false}, origin:B});
  me = await (await call("me", "/api/me")).json();
  t("알림 끄기 저장", me.user.notice === false);
}
console.log("\n[보안]");
jar.clear();
let r = await call("auth-login", "/auth/login/kakao", {params:{provider:"kakao"}});
r = await call("auth-callback", "/auth/callback/kakao?code=abc&state=WRONG", {params:{provider:"kakao"}});
t("state가 다르면 거절", r.headers.get("location") === "/login.html?error=state");
jar.clear();
r = await call("auth-callback", "/auth/callback/kakao?code=abc&state=x", {params:{provider:"kakao"}});
t("로그인 시작 없이 온 콜백 거절", r.headers.get("location") === "/login.html?error=state");
r = await call("auth-callback", "/auth/callback/kakao?error=access_denied", {params:{provider:"kakao"}});
t("사용자가 취소하면 안내", r.headers.get("location") === "/login.html?error=denied");
r = await call("auth-login", "/auth/login/kakao", {params:{provider:"kakao"}});
const st3 = new URL(r.headers.get("location")).searchParams.get("state");
r = await call("auth-callback", `/auth/callback/kakao?code=bad&state=${st3}`, {params:{provider:"kakao"}});
t("토큰 교환 실패하면 안내", r.headers.get("location") === "/login.html?error=failed");
// 위조 쿠키
const forged = Buffer.from(JSON.stringify({uid:"kakao-3141592", provider:"kakao", pending:false, exp:Date.now()+1e7})).toString("base64url") + ".AAAA";
let me = await (await call("me", "/api/me", {cookie:`nn_session=${forged}`})).json();
t("서명 위조 쿠키는 무시", me.user === null);
r = await call("auth-login", "/auth/login/facebook", {params:{provider:"facebook"}});
t("없는 로그인 방법 거절", r.headers.get("location") === "/login.html?error=unknown");
const saveKey = process.env.KAKAO_REST_API_KEY; delete process.env.KAKAO_REST_API_KEY;
r = await call("auth-login", "/auth/login/kakao", {params:{provider:"kakao"}});
t("설정이 비었으면 준비 중 안내", r.headers.get("location") === "/login.html?error=setup&p=kakao");
process.env.KAKAO_REST_API_KEY = saveKey;
console.log("\n[탈퇴]");
jar.clear();
r = await call("auth-login", "/auth/login/google", {params:{provider:"google"}});
const st4 = new URL(r.headers.get("location")).searchParams.get("state");
await call("auth-callback", `/auth/callback/google?code=abc&state=${st4}`, {params:{provider:"google"}});
r = await call("account", "/api/account", {method:"DELETE", origin:B});
t("탈퇴 처리", r.status === 200 && !jar.has("nn_session"));
t("명부에서 지워짐", !globalThis.__stores.get("members").has("google-1099"));
r = await call("logout" in F ? "logout" : "auth-logout", "/auth/logout");
t("로그아웃은 홈으로", r.headers.get("location") === "/?bye=1");
console.log("\n저장된 회원:", [...globalThis.__stores.get("members").keys()].join(", "));
console.log(`\n결과: 통과 ${ok} · 실패 ${bad}`);
process.exit(bad ? 1 : 0);
