// 로그아웃: /auth/logout
import { SESSION, clearCookie, redirect } from "../lib/session.mjs";

export default async () => redirect("/?bye=1", [clearCookie(SESSION)]);

export const config = { path: "/auth/logout" };
