/**
 * 네이버지도 키워드별 플레이스 순위 조회 (Cloudflare Pages Function)
 * GET /api/place-rank?q=양양카페&x=128.66&y=38.05&device=mobile
 *
 * 네이버 공식 API가 아니라 지도 목록 페이지(pcmap)의 초기 데이터를 읽는다.
 * 네이버가 구조를 바꾸면 깨질 수 있으므로, 실패하면 원인 파악용 debug 정보를 함께 돌려준다.
 */

const CACHE_SECONDS = 60; // 광고는 조회마다 돌아가므로 짧게 둔다
const USER_AGENTS = {
  pc: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
};
const HOSTS = { pc: "https://pcmap.place.naver.com", mobile: "https://m.place.naver.com" };
// 네이버지도는 카페·음식점을 restaurant 목록으로, 나머지를 place 목록으로 보여준다.
const FOOD_KEYWORD = /카페|커피|브런치|맛집|식당|음식|베이커리|빵집|디저트|술집|횟집|고기|국밥|분식|떡볶이/;

function sourcesFor(device, q) {
  const kinds = FOOD_KEYWORD.test(q) ? ["restaurant", "place"] : ["place", "restaurant"];
  const devices = device === "mobile" ? ["mobile", "pc"] : ["pc"];
  return devices.flatMap((d) => kinds.map((k) => [d, k]));
}

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });

/** window.__APOLLO_STATE__ = {...}; 에서 중괄호 짝을 맞춰 JSON 부분만 잘라 파싱 */
export function extractApolloState(html) {
  const marker = html.match(/window\.__APOLLO_STATE__\s*=\s*/);
  if (!marker) return null;
  const start = marker.index + marker[0].length;
  if (html[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const typeOf = (key, value) => value?.__typename || String(key).split(":")[0];
const isFilter = (type) => /Filter/i.test(type);
const isBusiness = (value) => !!value && typeof value === "object" && value.id != null && !!value.name;
const isAd = (type, value, path = "") =>
  /Ad(Summary|Item|Business)/.test(type) || !!value?.adId || /^ad/i.test(path);

function toPlace(value, type, ad) {
  return {
    id: String(value.id),
    name: value.name,
    category: value.category || value.businessCategory || "",
    address: value.roadAddress || value.commonAddress || value.address || value.fullAddress || "",
    visitorReviews: toNumber(value.visitorReviewCount),
    blogReviews: toNumber(value.blogCafeReviewCount ?? value.blogReviewCount),
    saves: toNumber(value.saveCount),
    score: toNumber(value.visitorReviewScore),
    image: value.imageUrl || null,
    ad,
    type,
  };
}

/** ROOT_QUERY 안의 목록(items 배열)을 네이버가 준 순서 그대로 찾는다 */
function findLists(node, state, path, found, depth = 0) {
  if (!node || typeof node !== "object" || depth > 6) return;
  if (Array.isArray(node)) {
    const rows = node
      .map((entry) => {
        const key = entry?.__ref;
        const value = key ? state[key] : entry;
        return isBusiness(value) ? { value, type: typeOf(key || "", value) } : null;
      })
      .filter(Boolean);
    if (rows.length && !rows.every((r) => isFilter(r.type))) found.push({ path, rows });
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    findLists(value, state, path ? `${path}.${key}` : key, found, depth + 1);
  }
}

/** 광고 목록이 응답에 들어 있었는지와, 네이버가 밝힌 광고 총수 */
function findAdInfo(root) {
  let hasAdList = false;
  let adTotal = null;
  for (const [key, value] of Object.entries(root)) {
    if (!/^ad/i.test(key)) continue;
    hasAdList = true;
    if (typeof value?.total === "number") adTotal = Math.max(adTotal ?? 0, value.total);
  }
  return { hasAdList, adTotal };
}

/** 네이버가 이 목록을 만들 때 실제로 적용한 입력값 (ROOT_QUERY 키의 인자) */
function findAppliedArgs(root) {
  const key = Object.keys(root).find((k) => /list\(|^places\(/i.test(k) && !/^ad/i.test(k));
  return key ? key.slice(key.indexOf("(") + 1, -1).slice(0, 600) : null;
}

function findTotal(root) {
  let best = null;
  for (const [key, value] of Object.entries(root)) {
    if (!/list|places/i.test(key) || /^ad/i.test(key) || !value || typeof value !== "object") continue;
    for (const [inner, innerValue] of Object.entries(value)) {
      const total = /^businesses/.test(inner) ? innerValue?.total : inner === "total" ? innerValue : null;
      if (typeof total === "number" && (best === null || total > best)) best = total;
    }
  }
  return best;
}

export function parseState(state) {
  const root = state?.ROOT_QUERY || {};
  const found = [];
  findLists(root, state, "", found);

  const organic = [];
  const ads = [];
  const seen = new Set();
  for (const list of found) {
    const adList = /(^|\.)ad/i.test(list.path);
    for (const { value, type } of list.rows) {
      if (isFilter(type)) continue;
      const ad = adList || isAd(type, value);
      const id = `${ad ? "ad" : "o"}:${value.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      (ad ? ads : organic).push(toPlace(value, type, ad));
    }
  }

  // ROOT_QUERY에서 목록을 못 찾으면 업체 항목을 저장 순서대로 읽는다 (순서 신뢰도 낮음)
  let usedFallback = false;
  if (!organic.length) {
    for (const [key, value] of Object.entries(state || {})) {
      const type = typeOf(key, value);
      if (!/(ListSummary|BusinessesItem|AdSummary)/.test(type) || !isBusiness(value)) continue;
      const ad = isAd(type, value);
      (ad ? ads : organic).push(toPlace(value, type, ad));
      usedFallback = !ad || usedFallback;
    }
  }

  return { organic, ads, total: findTotal(root), usedFallback, appliedArgs: findAppliedArgs(root), ...findAdInfo(root) };
}

function debugInfo(state, extra) {
  const counts = {};
  for (const [key, value] of Object.entries(state || {})) {
    const type = typeOf(key, value);
    counts[type] = (counts[type] || 0) + 1;
  }
  const rootKeys = Object.keys(state?.ROOT_QUERY || {}).map((k) => k.split("(")[0]);
  return { ...extra, rootKeys: [...new Set(rootKeys)], types: counts };
}

async function fetchList(device, kind, q, x, y) {
  const url = new URL(`${HOSTS[device]}/${kind}/list`);
  url.searchParams.set("query", q);
  url.searchParams.set("x", x);
  url.searchParams.set("y", y);
  url.searchParams.set("clientX", x);
  url.searchParams.set("clientY", y);
  const [cx, cy] = [Number(x), Number(y)];
  url.searchParams.set("bounds", `${cx - 0.04};${cy - 0.03};${cx + 0.04};${cy + 0.03}`);
  url.searchParams.set("display", "70");
  url.searchParams.set("ts", String(Date.now()));
  url.searchParams.set("additionalHeight", "76");
  url.searchParams.set("locale", "ko");
  url.searchParams.set("mapUrl", `https://map.naver.com/p/search/${encodeURIComponent(q)}`);

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENTS[device],
      "Accept-Language": "ko-KR,ko;q=0.9",
      Accept: "text/html,application/xhtml+xml",
      Referer: "https://map.naver.com/",
    },
  });
  return { kind, status: res.status, html: res.ok ? await res.text() : "" };
}

export async function onRequestGet({ request, waitUntil }) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").trim().slice(0, 60);
  const x = (params.get("x") || "128.66").slice(0, 20);
  const y = (params.get("y") || "38.05").slice(0, 20);
  const device = params.get("device") === "pc" ? "pc" : "mobile";
  if (!q) return json({ error: "키워드를 입력해 주세요." }, 400);
  if (!/^-?\d+(\.\d+)?$/.test(x) || !/^-?\d+(\.\d+)?$/.test(y)) {
    return json({ error: "위치 값이 올바르지 않습니다." }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(
    `https://place-rank.cache/${encodeURIComponent(q.replace(/\s+/g, " "))}?x=${x}&y=${y}&device=${device}`
  );
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const attempts = [];
  for (const [source, kind] of sourcesFor(device, q)) {
    let attempt;
    try {
      attempt = await fetchList(source, kind, q, x, y);
    } catch (e) {
      attempts.push({ source, kind, error: String(e.message || e) });
      continue;
    }
    const state = attempt.html ? extractApolloState(attempt.html) : null;
    const parsed = state ? parseState(state) : null;
    attempts.push(
      debugInfo(state, { source, kind, status: attempt.status, htmlLength: attempt.html.length, hasState: !!state })
    );
    if (parsed?.organic.length || parsed?.ads.length) {
      const res = json(
        { query: q, x, y, device, source, kind, checkedAt: new Date().toISOString(), ...parsed },
        200,
        { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}` }
      );
      waitUntil(cache.put(cacheKey, res.clone()));
      return res;
    }
    if (attempt.status === 429 || attempt.status === 403) break;
  }

  const blocked = attempts.some((a) => a.status === 429 || a.status === 403);
  return json(
    {
      error: blocked
        ? "네이버가 이 서버의 요청을 막았습니다. 잠시 후 다시 시도해 주세요."
        : "검색 결과를 읽지 못했습니다.",
      debug: attempts,
    },
    502
  );
}
