// 카카오·네이버·구글 로그인(OAuth 2.0 인가 코드 방식)
import { siteUrl } from "./session.mjs";

const env = k => process.env[k] || "";
const callback = p => `${siteUrl()}/auth/callback/${p}`;

async function readJson(res, what) {
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`${what}: JSON이 아닌 응답 (${res.status})`); }
  if (!res.ok || data.error) throw new Error(`${what}: ${data.error_description || data.error || res.status}`);
  return data;
}

async function postForm(url, fields) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(fields).toString()
  });
  return readJson(res, url);
}

async function getWithToken(url, token) {
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  return readJson(res, url);
}

export const PROVIDERS = {
  kakao: {
    name: "카카오",
    required: ["KAKAO_REST_API_KEY"],
    authorizeUrl(state) {
      return "https://kauth.kakao.com/oauth/authorize?" + new URLSearchParams({
        client_id: env("KAKAO_REST_API_KEY"), redirect_uri: callback("kakao"), response_type: "code", state
      });
    },
    async profile(code) {
      const fields = { grant_type: "authorization_code", client_id: env("KAKAO_REST_API_KEY"), redirect_uri: callback("kakao"), code };
      if (env("KAKAO_CLIENT_SECRET")) fields.client_secret = env("KAKAO_CLIENT_SECRET");
      const tok = await postForm("https://kauth.kakao.com/oauth/token", fields);
      const me = await getWithToken("https://kapi.kakao.com/v2/user/me", tok.access_token);
      const acc = me.kakao_account || {};
      return {
        id: String(me.id),
        name: (acc.profile && acc.profile.nickname) || (me.properties && me.properties.nickname) || "",
        email: acc.email || ""
      };
    }
  },

  naver: {
    name: "네이버",
    required: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
    authorizeUrl(state) {
      return "https://nid.naver.com/oauth2.0/authorize?" + new URLSearchParams({
        response_type: "code", client_id: env("NAVER_CLIENT_ID"), redirect_uri: callback("naver"), state
      });
    },
    async profile(code, state) {
      const tok = await postForm("https://nid.naver.com/oauth2.0/token", {
        grant_type: "authorization_code", client_id: env("NAVER_CLIENT_ID"), client_secret: env("NAVER_CLIENT_SECRET"), code, state
      });
      const me = await getWithToken("https://openapi.naver.com/v1/nid/me", tok.access_token);
      const r = me.response || {};
      if (!r.id) throw new Error("네이버 회원 정보에 id가 없습니다");
      return { id: String(r.id), name: r.name || r.nickname || "", email: r.email || "" };
    }
  },

  google: {
    name: "Google",
    required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    authorizeUrl(state) {
      return "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
        client_id: env("GOOGLE_CLIENT_ID"), redirect_uri: callback("google"), response_type: "code",
        scope: "openid email profile", state, prompt: "select_account"
      });
    },
    async profile(code) {
      const tok = await postForm("https://oauth2.googleapis.com/token", {
        grant_type: "authorization_code", client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"),
        redirect_uri: callback("google"), code
      });
      const me = await getWithToken("https://openidconnect.googleapis.com/v1/userinfo", tok.access_token);
      if (!me.sub) throw new Error("Google 회원 정보에 sub가 없습니다");
      return { id: String(me.sub), name: me.name || "", email: me.email_verified === false ? "" : (me.email || "") };
    }
  }
};

export function missingEnv(p) {
  const P = PROVIDERS[p];
  const need = [...(P ? P.required : []), "SESSION_SECRET", "SITE_URL"];
  return need.filter(k => !env(k));
}
