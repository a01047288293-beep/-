// 지금 로그인한 사람: GET /api/me
import { SESSION, getSession, clearCookie, json } from "../lib/session.mjs";
import { members, publicView } from "../lib/members.mjs";

export default async (req) => {
  const s = getSession(req);
  if (!s) return json({ user: null });
  if (s.pending) return json({ user: { pending: true, name: s.name || "", provider: s.provider, email: s.email || "" } });
  const m = await members().get(s.uid, { type: "json" });
  if (!m) return json({ user: null }, 200, [clearCookie(SESSION)]); // 탈퇴했거나 지워진 회원
  return json({ user: publicView(m) });
};

export const config = { path: "/api/me" };
