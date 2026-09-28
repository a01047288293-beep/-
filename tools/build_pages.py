# 하위 페이지 생성기: 공통 머리·바닥을 붙여 public/*.html 을 만든다
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent / "public"
MARK = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="46" cy="15" r="11" fill="#E0702F"/><path d="M22 8h18a4 4 0 0 1 4 4v46l-13-8-13 8V12a4 4 0 0 1 4-4z" fill="#34507A"/><rect x="18" y="18" width="26" height="2.2" fill="#F5F1E8"/></svg>'
KAKAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#000" d="M12 3.2c-5.1 0-9.2 3.2-9.2 7.2 0 2.6 1.7 4.8 4.3 6.1l-.9 3.3c-.1.3.3.5.5.3l3.9-2.6c.5.1.9.1 1.4.1 5.1 0 9.2-3.2 9.2-7.2S17.1 3.2 12 3.2z"/></svg>'
NAVER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M15.6 12.8 8.1 2H2v20h6.4V11.2L15.9 22H22V2h-6.4z"/></svg>'
GOOGLE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>'

def page(title, body, script="", wide=False, desc="나날서가 · 자서전 도서관"):
    return f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · 나날서가</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono&family=Nanum+Pen+Script&display=swap">
<link rel="stylesheet" href="site.css">
</head>
<body>
<header class="top"><div class="in"><a class="brand" href="./" aria-label="나날서가 처음으로">{MARK}<span><b>나날서가</b><small>자서전 도서관</small></span></a><a class="btn sm" href="./">홈으로</a></div></header>
<main{' class="wide"' if wide else ''}>
{body}
</main>
<footer><a href="terms.html">이용약관</a><a href="privacy.html"><b>개인정보 처리방침</b></a><br>© 2026 나날서가</footer>
{f"<script>{script}</script>" if script else ""}
</body>
</html>
'''

COMMON_JS = r'''
const PROV = {kakao:"카카오", naver:"네이버", google:"Google"};
async function api(path, opt){
  const r = await fetch(path, Object.assign({credentials:"same-origin", headers:{"content-type":"application/json"}}, opt || {}));
  let d = {}; try{ d = await r.json(); }catch(_){}
  if(!r.ok) throw Object.assign(new Error(d.message || "요청이 처리되지 않았어요"), {status:r.status, data:d});
  return d;
}
function lastProvider(){ try{ return localStorage.getItem("nanal-last-provider") || ""; }catch(_){ return ""; } }
function setLastProvider(p){ try{ localStorage.setItem("nanal-last-provider", p); }catch(_){} }
function fmtDate(iso){ if(!iso) return ""; const d = new Date(iso); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; }
'''

# ---------- 로그인 ----------
login_body = f'''
<section style="display:flex;flex-direction:column;gap:10px">
  <span class="hand">어서 오세요</span>
  <h1>나날서가에 로그인</h1>
  <p class="sub">쓰시던 계정 하나로 시작해요. 처음이시면 로그인 뒤 약관 동의 한 번으로 가입이 끝나요.</p>
</section>
<div id="msg" role="status" aria-live="polite" hidden></div>
<nav class="card" aria-label="로그인 방법" style="gap:12px">
  <a class="social kakao" href="auth/login/kakao" data-p="kakao"><span class="lg">{KAKAO}</span>카카오 로그인</a>
  <a class="social naver" href="auth/login/naver" data-p="naver"><span class="lg">{NAVER}</span>네이버 로그인</a>
  <a class="social google" href="auth/login/google" data-p="google"><span class="lg">{GOOGLE}</span>Google 계정으로 로그인</a>
</nav>
<p class="sub" style="text-align:center">나날서가는 비밀번호를 받거나 보관하지 않아요.<br>로그인하면 <a href="terms.html">이용약관</a>과 <a href="privacy.html">개인정보 처리방침</a>을 확인하게 돼요.</p>
'''
login_js = COMMON_JS + r'''
const MSG = {
  setup: p => `${PROV[p] || ""} 로그인은 아직 준비 중이에요. 다른 방법으로 로그인해 주세요.`,
  denied: () => "로그인을 취소하셨어요. 다시 시도하시려면 아래 버튼을 눌러 주세요.",
  state: () => "로그인 시간이 지났어요. 한 번 더 눌러 주세요.",
  failed: () => "로그인 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
  unknown: () => "알 수 없는 로그인 방법이에요."
};
const q = new URLSearchParams(location.search), err = q.get("error"), box = document.getElementById("msg");
if(err && MSG[err]){ box.className = "notice err"; box.textContent = MSG[err](q.get("p")); box.hidden = false; }
const last = lastProvider();
document.querySelectorAll(".social").forEach(a => {
  if(a.dataset.p === last){ const s = document.createElement("span"); s.className = "recent"; s.textContent = "최근 사용"; a.appendChild(s); }
  a.addEventListener("click", () => setLastProvider(a.dataset.p));
});
api("api/me").then(d => { if(d.user && !d.user.pending) location.replace("my.html"); else if(d.user && d.user.pending) location.replace("welcome.html"); }).catch(() => {});
'''

# ---------- 가입(약관 동의) ----------
welcome_body = '''
<section style="display:flex;flex-direction:column;gap:10px">
  <span class="hand">반가워요!</span>
  <h1>마지막 한 단계예요</h1>
  <p class="sub" id="lead">약속 몇 가지만 확인하면 가입이 끝나요.</p>
</section>
<div id="msg" role="status" aria-live="polite" hidden></div>
<form class="card" id="f" novalidate>
  <label class="field" for="w_name">책에 쓸 이름 (필명도 괜찮아요)<input id="w_name" name="name" type="text" maxlength="30" autocomplete="name" required></label>
  <div class="agree" role="group" aria-label="약관 동의">
    <label for="a_all"><input type="checkbox" id="a_all"><span class="t">모두 동의해요</span></label>
    <label for="a_terms"><input type="checkbox" id="a_terms" data-req="1"><span class="tag">필수</span><span class="t">나날서가 이용약관</span><a href="terms.html" target="_blank" rel="noopener">보기</a></label>
    <label for="a_privacy"><input type="checkbox" id="a_privacy" data-req="1"><span class="tag">필수</span><span class="t">개인정보 수집·이용 및 국외 이전</span><a href="privacy.html" target="_blank" rel="noopener">보기</a></label>
    <label for="a_age"><input type="checkbox" id="a_age" data-req="1"><span class="tag">필수</span><span class="t">만 14세 이상이에요</span></label>
    <label for="a_notice"><input type="checkbox" id="a_notice"><span class="tag opt">선택</span><span class="t">출시·새 소식 알림 받기</span></label>
  </div>
  <button class="btn pri" type="submit" id="go" disabled>필수 항목에 동의해 주세요</button>
  <p class="sub" style="font-size:.88rem">선택 항목은 동의하지 않아도 가입할 수 있고, 내 서재에서 언제든 바꿀 수 있어요.</p>
</form>
'''
welcome_js = COMMON_JS + r'''
const f = document.getElementById("f"), go = document.getElementById("go"), box = document.getElementById("msg");
const req = [...f.querySelectorAll("[data-req]")], all = document.getElementById("a_all"), boxes = [...f.querySelectorAll(".agree input:not(#a_all)")];
function sync(){ const ok = req.every(x => x.checked); all.checked = boxes.every(x => x.checked); go.disabled = !ok; go.textContent = ok ? "동의하고 가입하기" : "필수 항목에 동의해 주세요"; }
all.addEventListener("change", () => { boxes.forEach(x => x.checked = all.checked); sync(); });
boxes.forEach(x => x.addEventListener("change", sync));
function say(kind, text){ box.className = "notice " + kind; box.textContent = text; box.hidden = false; }
api("api/me").then(d => {
  if(!d.user){ location.replace("login.html"); return; }
  if(!d.user.pending){ location.replace("my.html"); return; }
  document.getElementById("w_name").value = d.user.name || "";
  document.getElementById("lead").textContent = `${PROV[d.user.provider] || ""} 계정으로 오셨어요. 약속 몇 가지만 확인하면 가입이 끝나요.`;
}).catch(() => say("err", "지금은 가입을 진행할 수 없어요. 잠시 뒤 다시 시도해 주세요."));
f.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("w_name").value.trim();
  if(!name){ say("err", "책에 쓸 이름을 적어 주세요."); document.getElementById("w_name").focus(); return; }
  go.disabled = true; go.textContent = "가입하는 중…";
  try{
    const ck = id => document.getElementById(id).checked;
    await api("api/signup", {method:"POST", body:JSON.stringify({name, terms:ck("a_terms"), privacy:ck("a_privacy"), age:ck("a_age"), notice:ck("a_notice")})});
    location.replace("my.html?welcome=1");
  }catch(err){
    if(err.status === 401){ say("err", "로그인 시간이 지났어요. 다시 로그인해 주세요."); setTimeout(() => location.replace("login.html?error=state"), 1600); return; }
    say("err", err.message); sync();
  }
});
'''

# ---------- 내 서재 ----------
my_body = f'''
<div id="msg" role="status" aria-live="polite" hidden></div>
<section style="display:flex;flex-direction:column;gap:8px">
  <span class="hand" id="hello">나의 서재</span>
  <h1 id="title">내 서재</h1>
  <p class="sub">나날서가 앱이 문을 열면 이 계정으로 바로 이어서 쓸 수 있어요.</p>
</section>
<section class="card" aria-label="내 계정">
  <div class="row" style="justify-content:space-between"><b style="font-family:var(--serif);font-size:1.1rem">내 계정</b><span id="prov"></span></div>
  <dl class="kv"><dt>이름</dt><dd id="v_name">–</dd><dt>이메일</dt><dd id="v_email">–</dd><dt>가입한 날</dt><dd id="v_join">–</dd><dt>최근 로그인</dt><dd id="v_last">–</dd></dl>
</section>
<section class="card" aria-label="알림">
  <label class="switch" for="s_notice"><span><b>출시·새 소식 알림</b><br><span class="sub">앱이 열리는 날과 새 기능 소식을 보내 드려요.</span></span><input type="checkbox" id="s_notice" role="switch"></label>
</section>
<section class="card" aria-label="로그아웃과 탈퇴">
  <div class="row"><a class="btn" href="auth/logout" style="flex:1">로그아웃</a><button class="btn danger" type="button" id="del1">회원 탈퇴</button></div>
  <div id="delbox" class="notice err" hidden>
    <p><b>정말 탈퇴하시겠어요?</b> 회원 정보가 바로 지워지고 되살릴 수 없어요.</p>
    <div class="row" style="margin-top:10px"><button class="btn sm danger" type="button" id="del2">탈퇴하기</button><button class="btn sm" type="button" id="delno">그만두기</button></div>
  </div>
</section>
'''
my_js = COMMON_JS + r'''
const box = document.getElementById("msg");
const PICON = {kakao:''' + repr(KAKAO) + r''', naver:''' + repr(NAVER) + r''', google:''' + repr(GOOGLE) + r'''};
function say(kind, text){ box.className = "notice " + kind; box.textContent = text; box.hidden = false; }
function show(u){
  document.getElementById("hello").textContent = `${u.name} 님, 반가워요`;
  document.getElementById("title").textContent = `${u.name} 님의 서재`;
  document.getElementById("prov").innerHTML = `<span class="prov ${u.provider}">${PICON[u.provider] || ""}${PROV[u.provider] || u.provider}</span>`;
  document.getElementById("v_name").textContent = u.name;
  document.getElementById("v_email").textContent = u.email || "받지 않음";
  document.getElementById("v_join").textContent = fmtDate(u.joinedAt);
  document.getElementById("v_last").textContent = fmtDate(u.lastLogin);
  document.getElementById("s_notice").checked = !!u.notice;
  setLastProvider(u.provider);
}
api("api/me").then(d => {
  if(!d.user){ location.replace("login.html"); return; }
  if(d.user.pending){ location.replace("welcome.html"); return; }
  show(d.user);
  if(new URLSearchParams(location.search).get("welcome")) say("ok", "가입을 마쳤어요. 나날서가 식구가 되신 걸 환영해요!");
}).catch(() => say("err", "내 정보를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요."));
document.getElementById("s_notice").addEventListener("change", async e => {
  const on = e.target.checked;
  try{ await api("api/account", {method:"PATCH", body:JSON.stringify({notice:on})}); say("ok", on ? "소식 알림을 켰어요." : "소식 알림을 껐어요."); }
  catch(err){ e.target.checked = !on; say("err", err.message); }
});
document.getElementById("del1").addEventListener("click", () => { document.getElementById("delbox").hidden = false; document.getElementById("del2").focus(); });
document.getElementById("delno").addEventListener("click", () => { document.getElementById("delbox").hidden = true; });
document.getElementById("del2").addEventListener("click", async () => {
  try{ await api("api/account", {method:"DELETE"}); location.replace("./?bye=deleted"); }
  catch(err){ say("err", err.message); }
});
'''

# ---------- 약관 ----------
terms_body = '''
<div class="draft">초안입니다. 법인 설립 후 회사 정보를 채우고 법률 검토를 받은 뒤 게시해 주세요.</div>
<article class="card doc">
<h1>나날서가 이용약관</h1>
<p class="sub">시행일 [2026년 ○월 ○일]</p>
<h2>제1조 목적</h2><p>이 약관은 [(주)아투아](이하 “회사”)가 운영하는 나날서가(이하 “서비스”)의 이용 조건과 절차, 회사와 회원의 권리·의무를 정합니다.</p>
<h2>제2조 회원 가입</h2><ol><li>회원은 카카오, 네이버, Google 계정으로 로그인한 뒤 이 약관과 개인정보 처리방침에 동의하여 가입합니다.</li><li>만 14세 미만은 가입할 수 없습니다.</li><li>가족이 본인을 대신해 이야기를 적을 때는 이야기의 주인공이 동의한 경우에만 이용해야 합니다.</li></ol>
<h2>제3조 서비스 내용</h2><p>서비스는 인터뷰 질문, AI를 이용한 자서전 원고 작성, 나날서가 도서관 등록, 구독에 따른 인쇄·정식 출판을 제공합니다. 정식 출시 전에는 회원 가입과 출시 소식 알림만 제공합니다.</p>
<h2>제4조 저작권</h2><p>회원이 작성하거나 회원의 이야기로 만든 원고의 저작권은 회원에게 있습니다. 회사는 회원이 고른 공개 범위 안에서만 원고를 보여 줍니다.</p>
<h2>제5조 회원의 의무</h2><p>회원은 다른 사람의 개인정보나 명예를 침해하는 내용을 공개해서는 안 되며, 다른 사람의 계정을 사용해서는 안 됩니다.</p>
<h2>제6조 탈퇴</h2><p>회원은 언제든 내 서재에서 탈퇴할 수 있고, 회사는 탈퇴 즉시 회원 정보를 지웁니다.</p>
<h2>제7조 약관의 변경</h2><p>약관을 바꿀 때는 시행 7일 전(회원에게 불리한 변경은 30일 전)부터 서비스 화면에 알립니다.</p>
<h2>제8조 문의</h2><p>[이메일 주소] · [전화번호]</p>
</article>
'''
privacy_body = '''
<div class="draft">초안입니다. 개인정보 보호책임자와 회사 정보를 채우고 법률 검토를 받은 뒤 게시해 주세요.</div>
<article class="card doc">
<h1>개인정보 처리방침</h1>
<p class="sub">시행일 [2026년 ○월 ○일]</p>
<p>[(주)아투아](이하 “회사”)는 나날서가 이용자의 개인정보를 「개인정보 보호법」에 따라 처리합니다.</p>
<h2>1. 처리하는 개인정보와 목적</h2>
<div class="tbl"><table><thead><tr><th>구분</th><th>항목</th><th>목적</th><th>보유 기간</th></tr></thead><tbody>
<tr><td>회원 가입·로그인 (필수)</td><td>로그인 제공자(카카오·네이버·Google)의 회원 식별번호, 이름 또는 별명, 가입·로그인 일시, 약관 동의 내역</td><td>회원 식별, 로그인 유지</td><td>탈퇴 시까지 (탈퇴 즉시 파기)</td></tr>
<tr><td>회원 가입 (선택)</td><td>이메일 주소 (로그인 제공자가 전달하는 경우)</td><td>계정 안내, 문의 응대</td><td>탈퇴 시까지</td></tr>
<tr><td>소식 알림 (선택)</td><td>알림 수신 동의 여부</td><td>출시·새 기능 소식 발송</td><td>동의 철회 또는 탈퇴 시까지</td></tr>
<tr><td>출시 알림 신청 (비회원)</td><td>이름, 휴대폰 번호 또는 이메일, 작성 유형</td><td>출시 알림 발송</td><td>출시 알림 발송 후 파기</td></tr>
</tbody></table></div>
<p>회사는 로그인 제공자의 비밀번호를 받거나 보관하지 않습니다.</p>
<h2>2. 제3자 제공</h2><p>회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따라 요구되는 경우는 예외로 합니다.</p>
<h2>3. 처리 위탁 및 국외 이전</h2>
<div class="tbl"><table><thead><tr><th>받는 자</th><th>국가</th><th>이전 항목</th><th>목적</th><th>보유 기간</th></tr></thead><tbody>
<tr><td>Netlify, Inc.</td><td>미국</td><td>위 1번의 모든 항목</td><td>웹사이트 호스팅, 회원 정보 저장</td><td>탈퇴 또는 위탁 계약 종료 시까지</td></tr>
</tbody></table></div>
<p>이전 일시와 방법: 서비스 이용 시 네트워크를 통해 전송됩니다. 국외 이전을 원하지 않으면 가입하지 않거나 탈퇴할 수 있으며, 이 경우 서비스를 이용할 수 없습니다.</p>
<h2>4. 쿠키</h2><p>로그인을 유지하기 위해 쿠키(nn_session)를 최대 30일 동안 씁니다. 광고나 추적용 쿠키는 쓰지 않습니다. 브라우저 설정에서 쿠키를 막으면 로그인할 수 없습니다.</p>
<h2>5. 이용자의 권리</h2><p>이용자는 언제든 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요구할 수 있습니다. 내 서재에서 알림 설정을 바꾸거나 탈퇴할 수 있고, 그 밖의 요청은 아래 연락처로 받습니다.</p>
<h2>6. 파기</h2><p>보유 기간이 끝나거나 탈퇴하면 지체 없이 복구할 수 없는 방법으로 지웁니다.</p>
<h2>7. 안전성 확보 조치</h2><p>로그인 정보는 서명된 쿠키로만 주고받고, 모든 연결은 암호화(HTTPS)합니다. 회원 정보에는 운영자만 접근할 수 있습니다.</p>
<h2>8. 개인정보 보호책임자</h2><p>성명 [ ] · 직책 [ ] · 연락처 [이메일, 전화번호]</p>
<h2>9. 변경</h2><p>이 방침을 바꿀 때는 시행 7일 전부터 홈페이지에 알립니다.</p>
</article>
'''

pages = {
  "login.html": page("로그인", login_body, login_js),
  "welcome.html": page("가입하기", welcome_body, welcome_js),
  "my.html": page("내 서재", my_body, my_js),
  "terms.html": page("이용약관", terms_body, wide=True),
  "privacy.html": page("개인정보 처리방침", privacy_body, wide=True),
}
for name, html in pages.items():
    (ROOT / name).write_text(html, encoding="utf-8")
    print("wrote", name, len(html))
