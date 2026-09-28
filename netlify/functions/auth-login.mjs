// 로그인 시작: /auth/login/kakao · naver · google
import { PROVIDERS, missingEnv } from "../lib/providers.mjs";
import { newState, stateCookie, redirect } from "../lib/session.mjs";

export default async (req, context) => {
  const p = context.params.provider;
  if (!PROVIDERS[p]) return redirect("/login.html?error=unknown");
  const missing = missingEnv(p);
  if (missing.length) {
    console.error(`[auth] ${p} 설정 누락: ${missing.join(", ")}`);
    return redirect(`/login.html?error=setup&p=${p}`);
  }
  const state = newState();
  return redirect(PROVIDERS[p].authorizeUrl(state), [stateCookie(state, p)]);
};

export const config = { path: "/auth/login/:provider" };
