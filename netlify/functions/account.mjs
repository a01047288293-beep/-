// 내 계정: PATCH /api/account (알림 설정, 이름) · DELETE /api/account (탈퇴)
import { SESSION, getSession, sessionCookie, clearCookie, sameOrigin, json } from "../lib/session.mjs";
import { members, publicView } from "../lib/members.mjs";

export default async (req) => {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  const s = getSession(req);
  if (!s || s.pending) return json({ error: "login", message: "다시 로그인해 주세요." }, 401);
  const store = members();
  const m = await store.get(s.uid, { type: "json" });
  if (!m) return json({ error: "gone" }, 404, [clearCookie(SESSION)]);

  if (req.method === "PATCH") {
    let body = {};
    try { body = await req.json(); } catch { return json({ error: "body" }, 400); }
    if (typeof body.notice === "boolean") { m.agree = { ...(m.agree || {}), notice: body.notice, noticeAt: new Date().toISOString() }; }
    if (typeof body.name === "string" && body.name.trim()) m.name = body.name.trim().slice(0, 30);
    await store.setJSON(s.uid, m);
    return json({ ok: true, user: publicView(m) }, 200, [sessionCookie({ uid: m.uid, provider: m.provider, name: m.name, pending: false })]);
  }
  if (req.method === "DELETE") {
    await store.delete(s.uid); // 탈퇴하면 회원 정보를 바로 지움
    return json({ ok: true }, 200, [clearCookie(SESSION)]);
  }
  return json({ error: "method" }, 405);
};

export const config = { path: "/api/account" };
