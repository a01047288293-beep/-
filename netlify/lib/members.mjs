// 회원 명부: Netlify Blobs의 "members" 저장소. 열쇠는 "제공자-회원번호" (예: kakao-123456)
import { getStore } from "@netlify/blobs";

export const members = () => getStore({ name: "members", consistency: "strong" });

export const memberKey = (provider, id) => `${provider}-${String(id).replace(/[^A-Za-z0-9_-]/g, "_")}`;

// 화면에 보여 줄 만큼만 꺼냄
export function publicView(m) {
  return {
    name: m.name,
    provider: m.provider,
    email: m.email ? m.email.replace(/^(.).*(@.*)$/, "$1***$2") : "",
    joinedAt: m.joinedAt,
    lastLogin: m.lastLogin,
    notice: !!(m.agree && m.agree.notice)
  };
}
