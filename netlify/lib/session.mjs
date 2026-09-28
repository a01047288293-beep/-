// 로그인 유지용 서명 쿠키. 비밀키(SESSION_SECRET)로 서명해 위조를 막는다.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION = "nn_session";
export const STATE = "nn_state";
const DAY = 86400;

function secret() {
  const s = process.env.SESSION_SECRET || "";
  if (s.length < 32) throw new Error("SESSION_SECRET 환경변수가 없거나 32자보다 짧습니다");
  return s;
}

export function sign(obj) {
  const body = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify(token) {
  if (!token || token.indexOf(".") < 1) return null;
  const [body, mac] = token.split(".");
  const expect = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac || ""), b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

export function readCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export function setCookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getSession(req) {
  return verify(readCookie(req, SESSION));
}

// 가입을 마친 회원은 30일, 약관 동의 전(pending)은 1시간만 유지
export function sessionCookie(user) {
  const sec = user.pending ? 3600 : 30 * DAY;
  return setCookie(SESSION, sign({ ...user, exp: Date.now() + sec * 1000 }), sec);
}

export function stateCookie(state, provider) {
  return setCookie(STATE, sign({ state, p: provider, exp: Date.now() + 600_000 }), 600);
}

export const newState = () => randomBytes(18).toString("base64url");

export function siteUrl() {
  return (process.env.SITE_URL || process.env.URL || "").replace(/\/+$/, "");
}

// 다른 사이트에서 몰래 보내는 요청(CSRF)을 막기 위해 출처 확인
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // 같은 출처의 일부 요청은 Origin이 없음 (SameSite=Lax 쿠키가 한 번 더 막아 줌)
  const allowed = [siteUrl(), process.env.URL, process.env.DEPLOY_PRIME_URL].filter(Boolean).map(u => u.replace(/\/+$/, ""));
  return allowed.includes(origin.replace(/\/+$/, ""));
}

export function json(data, status = 200, cookies = []) {
  const h = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  for (const c of cookies) h.append("set-cookie", c);
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function redirect(location, cookies = []) {
  const h = new Headers({ location, "cache-control": "no-store" });
  for (const c of cookies) h.append("set-cookie", c);
  return new Response(null, { status: 302, headers: h });
}
