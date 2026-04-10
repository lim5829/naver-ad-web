// ─── api.js ───
// 네이버 검색광고 API 프록시 호출

async function naverApiFetch({ method = "GET", path, customerId, apiKey, secretKey, managerLoginId, body }) {
  const headers = {
    "Content-Type": "application/json",
    "X-Customer-Id": customerId,
    "X-Api-Key": apiKey,
    "X-Secret-Key": secretKey,
  };
  if (managerLoginId) headers["X-Manager-Login-Id"] = managerLoginId;

  const res = await fetch(`${PROXY_BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

// 응답에서 data 배열 추출 (네이버 API는 { data: [...] } 래퍼를 씀)
function extractDataArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && typeof data === "object") return [data];
  return [];
}

// 통계 합산
function aggregateStats(arr) {
  const totals = { clkCnt: 0, impCnt: 0, salesAmt: 0, cpc: 0, ctr: 0 };
  arr.forEach(item => {
    totals.clkCnt += Number(item.clkCnt) || 0;
    totals.impCnt += Number(item.impCnt) || 0;
    totals.salesAmt += Number(item.salesAmt) || 0;
  });
  totals.cpc = totals.clkCnt > 0 ? Math.round(totals.salesAmt / totals.clkCnt) : 0;
  totals.ctr = totals.impCnt > 0 ? ((totals.clkCnt / totals.impCnt) * 100).toFixed(2) : "0.00";
  return totals;
}

function fmtNum(n) {
  if (n == null) return "-";
  return Number(n).toLocaleString("ko-KR");
}
