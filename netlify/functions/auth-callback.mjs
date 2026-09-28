// 로그인 후 돌아오는 곳: /auth/callback/kakao · naver · google
import { PROVIDERS } from "../lib/providers.mjs";
import { STATE, readCookie, verify, clearCookie, sessionCookie, redirect } from "../lib/session.mjs";
import { members, memberKey } from "../lib/members.mjs";

export default async (req, context) => {
  const p = context.params.provider;
  const P = PROVIDERS[p];
  if (!P) return redirect("/login.html?error=unknown");
  const url = new URL(req.url);
  const done = [clearCookie(STATE)];

  if (url.searchParams.get("error")) return redirect("/login.html?error=denied", done);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  const saved = verify(readCookie(req, STATE));
  if (!code || !saved || saved.state !== state || saved.p !== p) return redirect("/login.html?error=state", done);

  try {
    const prof = await P.profile(code, state);
    const uid = memberKey(p, prof.id);
    const store = members();
    const m = await store.get(uid, { type: "json" });
    if (m) {
      m.lastLogin = new Date().toISOString();
      await store.setJSON(uid, m);
      return redirect("/my.html", [...done, sessionCookie({ uid, provider: p, name: m.name, pending: false })]);
    }
    // 처음 오신 분: 약관 동의 화면으로
    return redirect("/welcome.html", [...done, sessionCookie({ uid, provider: p, name: prof.name, email: prof.email, pending: true })]);
  } catch (e) {
    console.error(`[auth] ${p} 로그인 실패:`, e.message);
    return redirect("/login.html?error=failed", done);
  }
};

export const config = { path: "/auth/callback/:provider" };
