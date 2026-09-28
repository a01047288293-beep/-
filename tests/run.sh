#!/usr/bin/env bash
# 로그인 서버 기능 점검: 가짜 카카오·네이버·구글과 가짜 회원 저장소로 가입~탈퇴 흐름을 확인
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
cp -r "$ROOT/netlify" "$ROOT/package.json" "$TMP/"
mkdir -p "$TMP/node_modules/@netlify/blobs"
cp "$ROOT/tests/mock-blobs.js" "$TMP/node_modules/@netlify/blobs/index.js"
printf '{"name":"@netlify/blobs","type":"module","main":"index.js","exports":"./index.js"}' > "$TMP/node_modules/@netlify/blobs/package.json"
cp "$ROOT/tests/auth-unit.mjs" "$TMP/unit.mjs"
cd "$TMP" && node unit.mjs
