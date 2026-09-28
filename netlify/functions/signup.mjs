// 약관 동의 후 가입 완료: POST /api/signup
import { getSession, sessionCookie, sameOrigin, json } from "../lib/session.mjs";
import { members, publicView } from "../lib/members.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  const s = getSession(req);
  if (!s || !s.pending) return json({ error: "no-pending", message: "로그인부터 다시 해 주세요." }, 401);
  let body = {};
  try { body = await req.json(); } catch { return json({ error: "body" }, 400); }
  if (!(body.terms && body.privacy && body.age)) return json({ error: "agree", message: "필수 항목에 동의해 주세요." }, 400);
  const name = String(body.name || s.name || "").trim().slice(0, 30);
  if (!name) return json({ error: "name", message: "이름(또는 필명)을 적어 주세요." }, 400);

  const now = new Date().toISOString();
  const store = members();
  const existing = await store.get(s.uid, { type: "json" });
  const m = existing || {
    uid: s.uid, provider: s.provider, name, email: s.email || "",
    joinedAt: now, lastLogin: now,
    agree: { terms: true, privacy: true, age: true, notice: !!body.notice, at: now }
  };
  if (!existing) await store.setJSON(s.uid, m);
  return json({ ok: true, user: publicView(m) }, 200, [sessionCookie({ uid: m.uid, provider: m.provider, name: m.name, pending: false })]);
};

export const config = { path: "/api/signup" };
