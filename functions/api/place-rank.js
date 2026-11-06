/**
 * 네이버지도 키워드별 플레이스 순위 조회 (Cloudflare Pages Function)
 * GET /api/place-rank?q=양양카페&x=128.66&y=38.05&device=mobile
 *
 * 네이버 공식 API가 아니라 지도 목록 페이지(pcmap)의 초기 데이터를 읽는다.
 * 네이버가 구조를 바꾸면 깨질 수 있으므로, 실패하면 원인 파악용 debug 정보를 함께 돌려준다.
 */

// 네이버지도 페이지가 뜬 뒤 실제로 호출하는 광고 목록 요청과 같은 쿼리 (2026-02 기록본)
const AD_GRAPHQL_URL = "https://pcmap-api.place.naver.com/graphql";
const AD_QUERY = "query getAdBusinessList($input: AdBusinessesInput, $isNmap: Boolean!) {\n  adBusinesses(input: $input) {\n    total\n    bucket\n    bucketTest\n    ... on RestaurantAdsResult {\n      items {\n        ...RestaurantAdItemFields\n        __typename\n      }\n      __typename\n    }\n    ... on HospitalAdsResult {\n      items {\n        ...HospitalAdItemFields\n        __typename\n      }\n      __typename\n    }\n    ... on PlaceAdsResult {\n      items {\n        ...PlaceAdItemFields\n        __typename\n      }\n      __typename\n    }\n    ... on AttractionAdsResult {\n      items {\n        ...AttractionAdItemFields\n        __typename\n      }\n      __typename\n    }\n    ... on AccommodationAdsResult {\n      items {\n        ...AccommodationAdItemFields\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment RestaurantAdItemFields on RestaurantAdSummary {\n  adId\n  adClickLog {\n    clickUrl\n    smartOrderClickUrl\n    trackingParameters {\n      n_ad_group_type\n      n_query\n      __typename\n    }\n    __typename\n  }\n  impressionEventUrl\n  effectiveImpressionEventUrl\n  adDescription\n  id\n  dbType\n  name\n  businessCategory\n  category\n  categoryCodeList\n  description\n  hasBooking\n  hasNPay\n  x\n  y\n  distance\n  imageUrl\n  imageCount\n  phone\n  virtualPhone\n  routeUrl\n  streetPanorama {\n    id\n    pan\n    tilt\n    lat\n    lon\n    __typename\n  }\n  roadAddress\n  address\n  commonAddress\n  blogCafeReviewCount\n  bookingReviewCount\n  totalReviewCount\n  bookingUrl\n  bookingBusinessId\n  talktalkUrl\n  detailCid {\n    c0\n    c1\n    c2\n    c3\n    __typename\n  }\n  options\n  promotionTitle\n  agencyId\n  businessHours\n  markerId @include(if: $isNmap)\n  markerLabel @include(if: $isNmap) {\n    text\n    style\n    __typename\n  }\n  imageMarker @include(if: $isNmap) {\n    marker\n    markerSelected\n    __typename\n  }\n  newBusinessHours {\n    status\n    description\n    dayOff\n    dayOffDescription\n    __typename\n  }\n  coupon {\n    total\n    promotions {\n      promotionSeq\n      couponSeq\n      conditionType\n      image {\n        url\n        __typename\n      }\n      title\n      description\n      type\n      couponUseType\n      __typename\n    }\n    __typename\n  }\n  hasMobilePhoneNumber\n  imageUrls\n  bookingReviewScore\n  bookingHubUrl\n  bookingHubButtonName\n  microReview\n  tags\n  priceCategory\n  broadcastInfo {\n    program\n    date\n    menu\n    __typename\n  }\n  michelinGuide {\n    year\n    star\n    comment\n    url\n    hasGrade\n    isBib\n    alternateText\n    __typename\n  }\n  broadcasts {\n    program\n    menu\n    episode\n    broadcast_date\n    __typename\n  }\n  tvcastId\n  naverBookingCategory\n  saveCount\n  uniqueBroadcasts\n  isDelivery\n  isCvsDelivery\n  isTableOrder\n  isPreOrder\n  isTakeOut\n  bookingDisplayName\n  bookingVisitId\n  bookingPickupId\n  popularMenuImages {\n    name\n    price\n    bookingCount\n    menuUrl\n    menuListUrl\n    imageUrl\n    isPopular\n    usePanoramaImage\n    __typename\n  }\n  visitorReviewCount\n  visitorReviewScore\n  newOpening\n  __typename\n}\n\nfragment HospitalAdItemFields on HospitalAdSummary {\n  adId\n  adClickLog {\n    clickUrl\n    smartOrderClickUrl\n    trackingParameters {\n      n_ad_group_type\n      n_query\n      __typename\n    }\n    __typename\n  }\n  impressionEventUrl\n  effectiveImpressionEventUrl\n  adDescription\n  id\n  dbType\n  name\n  businessCategory\n  category\n  categoryCodeList\n  description\n  hasBooking\n  hasNPay\n  x\n  y\n  distance\n  imageUrl\n  imageCount\n  phone\n  virtualPhone\n  routeUrl\n  streetPanorama {\n    id\n    pan\n    tilt\n    lat\n    lon\n    __typename\n  }\n  roadAddress\n  address\n  commonAddress\n  blogCafeReviewCount\n  bookingReviewCount\n  totalReviewCount\n  bookingUrl\n  bookingBusinessId\n  talktalkUrl\n  detailCid {\n    c0\n    c1\n    c2\n    c3\n    __typename\n  }\n  options\n  promotionTitle\n  agencyId\n  businessHours\n  markerId @include(if: $isNmap)\n  markerLabel @include(if: $isNmap) {\n    text\n    style\n    __typename\n  }\n  imageMarker @include(if: $isNmap) {\n    marker\n    markerSelected\n    __typename\n  }\n  newBusinessHours {\n    status\n    description\n    dayOff\n    dayOffDescription\n    __typename\n  }\n  coupon {\n    total\n    promotions {\n      promotionSeq\n      couponSeq\n      conditionType\n      image {\n        url\n        __typename\n      }\n      title\n      description\n      type\n      couponUseType\n      __typename\n    }\n    __typename\n  }\n  hasMobilePhoneNumber\n  medicalNo\n  visitorReviewCount\n  visitorReviewScore\n  talktalkUrl\n  fullAddress\n  apolloCacheId\n  hiraSpecialists {\n    name\n    count\n    __typename\n  }\n  __typename\n}\n\nfragment PlaceAdItemFields on PlaceAdSummary {\n  adId\n  adClickLog {\n    clickUrl\n    smartOrderClickUrl\n    trackingParameters {\n      n_ad_group_type\n      n_query\n      __typename\n    }\n    __typename\n  }\n  impressionEventUrl\n  effectiveImpressionEventUrl\n  adDescription\n  id\n  dbType\n  name\n  businessCategory\n  category\n  categoryCodeList\n  description\n  hasBooking\n  hasNPay\n  x\n  y\n  distance\n  imageUrl\n  imageCount\n  phone\n  virtualPhone\n  routeUrl\n  streetPanorama {\n    id\n    pan\n    tilt\n    lat\n    lon\n    __typename\n  }\n  roadAddress\n  address\n  commonAddress\n  blogCafeReviewCount\n  bookingReviewCount\n  totalReviewCount\n  bookingUrl\n  bookingBusinessId\n  talktalkUrl\n  detailCid {\n    c0\n    c1\n    c2\n    c3\n    __typename\n  }\n  options\n  promotionTitle\n  agencyId\n  businessHours\n  markerId @include(if: $isNmap)\n  markerLabel @include(if: $isNmap) {\n    text\n    style\n    __typename\n  }\n  imageMarker @include(if: $isNmap) {\n    marker\n    markerSelected\n    __typename\n  }\n  newBusinessHours {\n    status\n    description\n    dayOff\n    dayOffDescription\n    __typename\n  }\n  coupon {\n    total\n    promotions {\n      promotionSeq\n      couponSeq\n      conditionType\n      image {\n        url\n        __typename\n      }\n      title\n      description\n      type\n      couponUseType\n      __typename\n    }\n    __typename\n  }\n  hasMobilePhoneNumber\n  medicalNo\n  normalizedName\n  categoryCodeList\n  daysOff\n  poiInfo {\n    polyline {\n      shapeKey {\n        id\n        name\n        version\n        __typename\n      }\n      boundary {\n        minX\n        minY\n        maxX\n        maxY\n        __typename\n      }\n      details {\n        totalDistance\n        arrivalAddress\n        departureAddress\n        __typename\n      }\n      __typename\n    }\n    polygon {\n      shapeKey {\n        id\n        name\n        version\n        __typename\n      }\n      boundary {\n        minX\n        minY\n        maxX\n        maxY\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  subwayId\n  oilPrice @include(if: $isNmap) {\n    gasoline\n    diesel\n    lpg\n    __typename\n  }\n  isPublicGas\n  isDelivery\n  isTableOrder\n  isPreOrder\n  isTakeOut\n  isCvsDelivery\n  naverBookingCategory\n  bookingDisplayName\n  bookingVisitId\n  bookingPickupId\n  baemin {\n    businessHours {\n      deliveryTime {\n        start\n        end\n        __typename\n      }\n      closeDate {\n        start\n        end\n        __typename\n      }\n      temporaryCloseDate {\n        start\n        end\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  yogiyo {\n    businessHours {\n      actualDeliveryTime {\n        start\n        end\n        __typename\n      }\n      bizHours {\n        start\n        end\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  isPollingStation\n  visitorReviewCount\n  visitorReviewScore\n  naverBookingHubId\n  bookingHubUrl\n  bookingHubButtonName\n  newOpening\n  fullAddress\n  __typename\n}\n\nfragment AttractionAdItemFields on AttractionAdSummary {\n  adId\n  adClickLog {\n    clickUrl\n    smartOrderClickUrl\n    trackingParameters {\n      n_ad_group_type\n      n_query\n      __typename\n    }\n    __typename\n  }\n  impressionEventUrl\n  effectiveImpressionEventUrl\n  adDescription\n  id\n  dbType\n  name\n  businessCategory\n  category\n  categoryCodeList\n  description\n  hasBooking\n  hasNPay\n  x\n  y\n  distance\n  imageUrl\n  imageCount\n  phone\n  virtualPhone\n  routeUrl\n  streetPanorama {\n    id\n    pan\n    tilt\n    lat\n    lon\n    __typename\n  }\n  roadAddress\n  address\n  commonAddress\n  blogCafeReviewCount\n  bookingReviewCount\n  totalReviewCount\n  bookingUrl\n  bookingBusinessId\n  talktalkUrl\n  detailCid {\n    c0\n    c1\n    c2\n    c3\n    __typename\n  }\n  options\n  promotionTitle\n  agencyId\n  businessHours\n  markerId @include(if: $isNmap)\n  markerLabel @include(if: $isNmap) {\n    text\n    style\n    __typename\n  }\n  imageMarker @include(if: $isNmap) {\n    marker\n    markerSelected\n    __typename\n  }\n  newBusinessHours {\n    status\n    description\n    dayOff\n    dayOffDescription\n    __typename\n  }\n  coupon {\n    total\n    promotions {\n      promotionSeq\n      couponSeq\n      conditionType\n      image {\n        url\n        __typename\n      }\n      title\n      description\n      type\n      couponUseType\n      __typename\n    }\n    __typename\n  }\n  hasMobilePhoneNumber\n  imageUrls\n  cid\n  tags\n  visitorReviewCount\n  poiInfo {\n    polyline {\n      shapeKey {\n        id\n        __typename\n      }\n      __typename\n    }\n    polygon {\n      shapeKey {\n        id\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  isDelivery\n  isTakeOut\n  isPreOrder\n  isTableOrder\n  newOpening\n  __typename\n}\n\nfragment AccommodationAdItemFields on AccommodationAdSummary {\n  adId\n  adClickLog {\n    clickUrl\n    smartOrderClickUrl\n    trackingParameters {\n      n_ad_group_type\n      n_query\n      __typename\n    }\n    __typename\n  }\n  impressionEventUrl\n  effectiveImpressionEventUrl\n  adDescription\n  id\n  apolloCacheId\n  dbType\n  name\n  businessCategory\n  category\n  description\n  hasBooking\n  hasNPay\n  x\n  y\n  distance\n  imageUrl\n  imageCount\n  phone\n  virtualPhone\n  routeUrl\n  streetPanorama {\n    id\n    pan\n    tilt\n    lat\n    lon\n    __typename\n  }\n  roadAddress\n  address\n  commonAddress\n  blogCafeReviewCount\n  bookingReviewCount\n  totalReviewCount\n  bookingUrl\n  bookingBusinessId\n  talktalkUrl\n  detailCid {\n    c0\n    c1\n    c2\n    c3\n    __typename\n  }\n  options\n  promotionTitle\n  agencyId\n  businessHours\n  newOpening\n  markerId @include(if: $isNmap)\n  markerLabel @include(if: $isNmap) {\n    text\n    style\n    __typename\n  }\n  imageMarker @include(if: $isNmap) {\n    marker\n    markerSelected\n    __typename\n  }\n  imageUrls\n  adImageUrls\n  microReview\n  placeReviewCount\n  placeReviewScore\n  roomImages {\n    id\n    name\n    imageUrl\n    minPrice\n    maxPrice\n    avgPrice\n    __typename\n  }\n  visitorImages {\n    id\n    reviewId\n    imageUrl\n    profileImageUrl\n    nickname\n    __typename\n  }\n  visitorReviews {\n    id\n    reviewId\n    review\n    __typename\n  }\n  matchRoomMinPrice\n  avgPrice\n  interiorPanorama\n  matchSidRoomIds\n  bookingUserCount\n  facility\n  coupon {\n    total\n    promotions {\n      promotionSeq\n      couponSeq\n      conditionType\n      image {\n        url\n        __typename\n      }\n      title\n      description\n      type\n      couponUseType\n      __typename\n    }\n    __typename\n  }\n  categoryCode\n  categoryCodeList\n  bookingReviewScore\n  __typename\n}";
const USER_AGENTS = {
  pc: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
};
const HOSTS = { pc: "https://pcmap.place.naver.com", mobile: "https://m.place.naver.com" };
// place 목록이 네이버지도 실제 순서와 맞는 것을 사용자가 확인했다. restaurant는 place가 비었을 때만 쓴다.
function sourcesFor(device) {
  const devices = device === "mobile" ? ["mobile", "pc"] : ["pc"];
  return devices.flatMap((d) => [[d, "place"], [d, "restaurant"]]);
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
    x: value.x ?? null,
    y: value.y ?? null,
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
  if (x && y) {
    url.searchParams.set("x", x);
    url.searchParams.set("y", y);
    url.searchParams.set("clientX", x);
    url.searchParams.set("clientY", y);
  }
  url.searchParams.set("display", "70");
  url.searchParams.set("locale", "ko");

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

function base64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, "");
}

/** 네이버지도와 같은 요청으로 지금 이 위치·키워드의 광고 목록을 받는다. 광고 클릭/노출 URL은 호출하지 않는다. */
async function fetchLiveAds(q, x, y, device) {
  const log = [];
  let best = null; // 화면에는 첫 번째 결과를 쓰고, 나머지 조합은 원인 확인용으로 기록한다
  const deviceTypes = device === "mobile" ? ["mobile", "pcmap"] : ["pcmap"];
  // 앞 네 조합은 1페이지, 뒤 두 조합은 다음 광고 페이지가 있는지 확인용
  const combos = deviceTypes.flatMap((deviceType) => ["place", "restaurant"].map((businessType) => ({ deviceType, businessType, start: 1 })));
  combos.push({ deviceType: deviceTypes[0], businessType: "place", start: 6 }, { deviceType: deviceTypes[0], businessType: "restaurant", start: 6 });
  {
    for (const { deviceType, businessType, start } of combos) {
      const located = x && y;
      const center = located ? `&q_center_coordinate=${encodeURIComponent(`${x};${y}`)}` : "";
      const coordRule = located ? ".force_use_center_coord" : "";
      const localQueryString =
        `pr=place_pcmap&version=2.0.0&st=poi&q_enc=utf-8&r_enc=utf-8&sm=all.basic.trade_query.deepmatch.use_quasar_cid.force_match_keyword${coordRule}` +
        `&r_format=json&r_psglen=title.140&so=rel.dsc&hl=none&ic=basic&rp=none&r_query_info=1&start=${start}&display=70` +
        `&q=${encodeURIComponent(q)}${center}&r_query_select=1&eq_property=adult`;
      const body = [{
        operationName: "getAdBusinessList",
        variables: {
          input: { query: q, start, localQueryString, deviceType, businessType, ...(located ? { x, y } : {}) },
          isNmap: true,
        },
        query: AD_QUERY,
      }];
      try {
        const res = await fetch(AD_GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": USER_AGENTS.pc,
            "Accept-Language": "ko",
            Origin: "https://pcmap.place.naver.com",
            Referer: `https://pcmap.place.naver.com/${businessType}/list?query=${encodeURIComponent(q)}${located ? `&x=${x}&y=${y}` : ""}`,
            "x-wtm-graphql": base64Utf8(JSON.stringify({ arg: q, type: businessType, source: "place" })),
          },
          body: JSON.stringify(body),
        });
        const data = res.ok ? await res.json() : null;
        const result = Array.isArray(data) ? data[0] : data;
        const items = result?.data?.adBusinesses?.items || [];
        const ads = items.filter(isBusiness).map((item) => toPlace(item, item.__typename || "", true));
        log.push({ deviceType, businessType, start, total: result?.data?.adBusinesses?.total, status: res.status, items: items.length, names: ads.map((a) => a.name), error: result?.errors?.[0]?.message });
        if (ads.length && !best && start === 1) best = { ads, adTotal: result.data.adBusinesses.total ?? ads.length, deviceType };
        if (res.status === 429 || res.status === 403) return { ads: null, ...best, log };
      } catch (e) {
        log.push({ deviceType, businessType, start, error: String(e.message || e) });
      }
    }
  }
  return { ads: null, ...best, log };
}

export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").trim().slice(0, 60);
  const noLocation = params.get("loc") === "none";
  const x = noLocation ? "" : (params.get("x") || "128.669").slice(0, 20);
  const y = noLocation ? "" : (params.get("y") || "38.061").slice(0, 20);
  const device = params.get("device") === "pc" ? "pc" : "mobile";
  if (!q) return json({ error: "키워드를 입력해 주세요." }, 400);
  if (!noLocation && (!/^-?\d+(\.\d+)?$/.test(x) || !/^-?\d+(\.\d+)?$/.test(y))) {
    return json({ error: "위치 값이 올바르지 않습니다." }, 400);
  }

  const attempts = [];
  for (const [source, kind] of sourcesFor(device)) {
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
      const live = await fetchLiveAds(q, x, y, device);
      const adInfo = live.ads
        ? { ads: live.ads, adTotal: live.adTotal, hasAdList: true, adSource: "live", adDeviceType: live.deviceType }
        : { adSource: "initial" };
      return json(
        { query: q, x, y, device, source, kind, colo: request.cf?.colo ?? null, checkedAt: new Date().toISOString(), ...parsed, initialAds: parsed.ads.map((a) => a.name), ...adInfo, adLog: live.log },
        200,
        { "Cache-Control": "no-store" }
      );
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
