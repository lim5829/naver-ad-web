// ─── Rank Page — 실시간 순위 모니터링 ───

function RankPage({ user, apiSettings, showToast }) {
  const [campaigns, setCampaigns] = useState([]);
  const [adGroups, setAdGroups] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [kwStats, setKwStats] = useState({});
  const [prevStats, setPrevStats] = useState({});

  const [selCampaign, setSelCampaign] = useState("");
  const [selAdGroup, setSelAdGroup] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingKw, setLoadingKw] = useState(false);
  const [loadingStat, setLoadingStat] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [interval, setIntervalVal] = useState(60);
  const [countdown, setCountdown] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("keyword");
  const [sortDir, setSortDir] = useState("asc");
  const [device, setDevice] = useState("all");
  const [error, setError] = useState("");

  const timerRef = React.useRef(null);
  const cdRef = React.useRef(null);

  // ── 캠페인 로드 ──
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const data = await naverApiFetch({ path: "/ncc/campaigns", ...apiSettings });
      const list = Array.isArray(data) ? data : [];
      setCampaigns(list);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [apiSettings]);

  // ── 광고그룹 로드 ──
  const loadAdGroups = useCallback(async (cmpId) => {
    try {
      setLoading(true); setError("");
      const data = await naverApiFetch({ path: `/ncc/adgroups?nccCampaignId=${cmpId}`, ...apiSettings });
      setAdGroups(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [apiSettings]);

  // ── 키워드 로드 ──
  const loadKeywords = useCallback(async (grpId) => {
    try {
      setLoadingKw(true); setError("");
      const data = await naverApiFetch({ path: `/ncc/adkeywords?nccAdgroupId=${grpId}`, ...apiSettings });
      const list = Array.isArray(data) ? data : [];
      setKeywords(list);
      return list;
    } catch (e) { setError(e.message); return []; }
    finally { setLoadingKw(false); }
  }, [apiSettings]);

  // ── 키워드 통계 로드 ──
  const loadStats = useCallback(async (kwList) => {
    if (!kwList || kwList.length === 0) return;
    const texts = kwList.map(k => k.keyword).filter(Boolean);
    if (texts.length === 0) return;

    setLoadingStat(true);
    setPrevStats({ ...kwStats });
    const all = {};

    // 5개씩 배치 호출
    for (let i = 0; i < texts.length; i += 5) {
      const batch = texts.slice(i, i + 5).join(",");
      try {
        const data = await naverApiFetch({
          path: `/keywordstool?hintKeywords=${encodeURIComponent(batch)}&showDetail=1`,
          ...apiSettings,
        });
        if (data && data.keywordList) {
          data.keywordList.forEach(item => { all[item.relKeyword] = item; });
        }
      } catch (e) { /* 배치 실패 무시 */ }
    }

    setKwStats(all);
    setLastRefresh(new Date());
    setLoadingStat(false);
  }, [apiSettings, kwStats]);

  // ── 전체 새로고침 ──
  const refreshAll = useCallback(async () => {
    if (!selAdGroup) return;
    const kws = await loadKeywords(selAdGroup);
    await loadStats(kws);
  }, [selAdGroup, loadKeywords, loadStats]);

  // ── 초기 로드 ──
  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // ── 캠페인 변경 ──
  useEffect(() => {
    if (selCampaign) {
      loadAdGroups(selCampaign);
      setSelAdGroup(""); setKeywords([]); setKwStats({});
    }
  }, [selCampaign]);

  // ── 광고그룹 변경 ──
  useEffect(() => { if (selAdGroup) refreshAll(); }, [selAdGroup]);

  // ── 자동 새로고침 ──
  useEffect(() => {
    if (autoRefresh && selAdGroup) {
      setCountdown(interval);
      cdRef.current = setInterval(() => setCountdown(c => c <= 1 ? interval : c - 1), 1000);
      timerRef.current = setInterval(refreshAll, interval * 1000);
      return () => { clearInterval(timerRef.current); clearInterval(cdRef.current); };
    }
    clearInterval(timerRef.current); clearInterval(cdRef.current); setCountdown(0);
  }, [autoRefresh, interval, selAdGroup, refreshAll]);

  // ── 필터 & 정렬 ──
  const filtered = React.useMemo(() => {
    let list = keywords.filter(k => !k.userLock);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(k => (k.keyword || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const sa = kwStats[a.keyword] || {};
      const sb = kwStats[b.keyword] || {};
      let va, vb;
      switch (sortKey) {
        case "keyword": va = a.keyword || ""; vb = b.keyword || ""; return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
        case "bid": va = a.bidAmt || 0; vb = b.bidAmt || 0; break;
        case "search":
          if (device === "pc") { va = sa.monthlyPcQcCnt || 0; vb = sb.monthlyPcQcCnt || 0; }
          else if (device === "mobile") { va = sa.monthlyMobileQcCnt || 0; vb = sb.monthlyMobileQcCnt || 0; }
          else { va = (sa.monthlyPcQcCnt || 0) + (sa.monthlyMobileQcCnt || 0); vb = (sb.monthlyPcQcCnt || 0) + (sb.monthlyMobileQcCnt || 0); }
          break;
        case "ctr":
          va = device === "mobile" ? (sa.monthlyAveMobileCtr || 0) : (sa.monthlyAvePcCtr || 0);
          vb = device === "mobile" ? (sb.monthlyAveMobileCtr || 0) : (sb.monthlyAvePcCtr || 0);
          break;
        case "comp":
          const o = { "높음": 3, "중간": 2, "낮음": 1 };
          va = o[sa.compIdx] || 0; vb = o[sb.compIdx] || 0; break;
        default: va = 0; vb = 0;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [keywords, search, sortKey, sortDir, kwStats, device]);

  // ── 유틸 ──
  const fmtSearch = (n) => (n == null || n === "< 10") ? "-" : Number(n).toLocaleString("ko-KR");
  const fmtCtr = (n) => n == null ? "-" : (Number(n) * 100).toFixed(2) + "%";
  const fmtTime = (d) => d ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-";

  const compColor = { "높음": theme.danger, "중간": theme.warning, "낮음": theme.accent };
  const compBg = { "높음": theme.dangerDim, "중간": theme.warningDim, "낮음": theme.accentDim };

  // ── 정렬 헤더 ──
  const SortHead = ({ label, field, align }) => (
    <div onClick={() => { if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(field); setSortDir("desc"); } }}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 2, justifyContent: align || "flex-start", fontSize: 10, fontWeight: 700, color: sortKey === field ? theme.accent : theme.textDim, userSelect: "none", whiteSpace: "nowrap" }}>
      {label}{sortKey === field && <span style={{ fontSize: 8 }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
    </div>
  );

  // ── 셀렉트 ──
  const Sel = ({ value, onChange, options, placeholder, disabled }) => (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ width: "100%", padding: "10px 32px 10px 12px", borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 14, fontFamily: "inherit", color: value ? theme.text : theme.textDim, background: disabled ? theme.surfaceLight : theme.surface, outline: "none", cursor: disabled ? "not-allowed" : "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238892A6' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "0 20px 80px" }}>
      {/* ── 헤더 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 12px", position: "sticky", top: 0, zIndex: 10, background: theme.bg + "ee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${theme.accentGlow}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>순위 모니터링</div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.name}</div>
          </div>
        </div>
        {lastRefresh && (
          <div style={{ textAlign: "right", fontSize: 10, color: theme.textDim }}>
            <div>마지막 갱신</div>
            <div style={{ fontWeight: 700, color: theme.accent }}>{fmtTime(lastRefresh)}</div>
          </div>
        )}
      </div>

      {/* ── 에러 ── */}
      {error && (
        <Card style={{ padding: 16, marginBottom: 12, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: theme.danger, fontWeight: 600, marginBottom: 6 }}>{error}</div>
          <Button variant="secondary" onClick={() => { setError(""); loadCampaigns(); }}>다시 시도</Button>
        </Card>
      )}

      {/* ── 캠페인/그룹 선택 ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <Sel value={selCampaign} onChange={v => { setSelCampaign(v); setSelAdGroup(""); }}
          placeholder="캠페인 선택" disabled={campaigns.length === 0}
          options={campaigns.map(c => ({ v: c.nccCampaignId, l: (c.userLock ? "⏸ " : "") + c.name }))} />
        <Sel value={selAdGroup} onChange={setSelAdGroup}
          placeholder="광고그룹 선택" disabled={!selCampaign || adGroups.length === 0}
          options={adGroups.map(g => ({ v: g.nccAdgroupId, l: (g.userLock ? "⏸ " : "") + g.name }))} />
      </div>

      {/* ── 자동 새로고침 ── */}
      <Card style={{ padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setAutoRefresh(!autoRefresh)} style={{ width: 44, height: 24, borderRadius: 12, background: autoRefresh ? theme.accent : "#D1D5DB", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, left: autoRefresh ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>자동 새로고침</div>
            {autoRefresh && countdown > 0 && <div style={{ fontSize: 10, color: theme.textDim }}>{countdown}초 후 갱신</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select value={interval} onChange={e => setIntervalVal(Number(e.target.value))}
            style={{ padding: "4px 8px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 11, color: theme.text, fontFamily: "inherit" }}>
            <option value={30}>30초</option><option value={60}>1분</option><option value={180}>3분</option><option value={300}>5분</option>
          </select>
          <button onClick={refreshAll} disabled={!selAdGroup || loadingKw || loadingStat}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: theme.accent, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: !selAdGroup ? "not-allowed" : "pointer", opacity: !selAdGroup ? 0.4 : 1, display: "flex", alignItems: "center", gap: 4 }}>
            {(loadingKw || loadingStat) ? <span style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : I.refresh}
            새로고침
          </button>
        </div>
      </Card>

      {/* ── 검색 + 기기 필터 ── */}
      {selAdGroup && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: theme.textDim }}>{I.search}</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="키워드 검색..."
              style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 10, border: `1.5px solid ${theme.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: theme.surface, color: theme.text }} />
          </div>
          <select value={device} onChange={e => setDevice(e.target.value)}
            style={{ padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${theme.border}`, fontSize: 12, fontFamily: "inherit", color: theme.text, background: theme.surface }}>
            <option value="all">전체</option><option value="pc">PC</option><option value="mobile">모바일</option>
          </select>
        </div>
      )}

      {/* ── 요약 카드 ── */}
      {selAdGroup && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <Card style={{ padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>키워드</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{filtered.length}</div>
          </Card>
          <Card style={{ padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>평균 입찰가</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.accent }}>
              {(() => { const bids = filtered.map(k => k.bidAmt).filter(Boolean); return bids.length > 0 ? fmtNum(Math.round(bids.reduce((a, b) => a + b, 0) / bids.length)) + "원" : "-"; })()}
            </div>
          </Card>
          <Card style={{ padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>높은 경쟁</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.danger }}>
              {filtered.filter(k => (kwStats[k.keyword] || {}).compIdx === "높음").length}
            </div>
          </Card>
        </div>
      )}

      {/* ── 키워드 리스트 ── */}
      {selAdGroup && (
        <>
          {/* 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 58px 58px 50px 44px", gap: 4, padding: "6px 14px", alignItems: "center" }}>
            <SortHead label="키워드" field="keyword" />
            <SortHead label="입찰가" field="bid" align="flex-end" />
            <SortHead label={device === "pc" ? "PC검색" : device === "mobile" ? "모바일" : "총검색"} field="search" align="flex-end" />
            <SortHead label="CTR" field="ctr" align="flex-end" />
            <SortHead label="경쟁" field="comp" align="center" />
          </div>

          {/* 로딩 */}
          {(loadingKw || loadingStat) && (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
              <div style={{ fontSize: 12, color: theme.textDim }}>{loadingKw ? "키워드 로딩..." : "통계 조회 중..."}</div>
            </div>
          )}

          {/* 빈 상태 */}
          {!loadingKw && !loadingStat && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "36px 20px", color: theme.textDim, fontSize: 13 }}>
              {keywords.length === 0 ? "키워드가 없습니다" : "검색 결과가 없습니다"}
            </div>
          )}

          {/* 키워드 카드 */}
          {!loadingKw && filtered.map((kw, idx) => {
            const s = kwStats[kw.keyword] || {};
            const pcS = s.monthlyPcQcCnt;
            const mbS = s.monthlyMobileQcCnt;
            const totalS = (typeof pcS === "number" && typeof mbS === "number") ? pcS + mbS : null;
            const dispSearch = device === "pc" ? pcS : device === "mobile" ? mbS : totalS;
            const dispCtr = device === "mobile" ? s.monthlyAveMobileCtr : s.monthlyAvePcCtr;
            const cc = compColor[s.compIdx] || theme.textDim;
            const cb = compBg[s.compIdx] || theme.surfaceLight;

            return (
              <Card key={kw.nccKeywordId || idx} style={{ padding: "10px 14px", marginBottom: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 58px 58px 50px 44px", gap: 4, alignItems: "center" }}>
                  {/* 키워드명 */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {kw.keyword}
                  </div>
                  {/* 입찰가 */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, textAlign: "right" }}>
                    {kw.bidAmt ? fmtNum(kw.bidAmt) : "-"}
                  </div>
                  {/* 검색량 */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, textAlign: "right" }}>
                    {fmtSearch(dispSearch)}
                  </div>
                  {/* CTR */}
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.blue, textAlign: "right" }}>
                    {fmtCtr(dispCtr)}
                  </div>
                  {/* 경쟁도 */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cc, background: cb, padding: "2px 7px", borderRadius: 10, display: "inline-block" }}>
                      {s.compIdx || "-"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {/* ── 미선택 안내 ── */}
      {!selAdGroup && !loading && !error && (
        <div style={{ textAlign: "center", padding: "50px 20px", color: theme.textDim }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>{I.rank}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 6 }}>캠페인과 광고그룹을 선택하세요</div>
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            키워드별 검색량, 경쟁도, CTR을<br />실시간으로 모니터링합니다
          </div>
        </div>
      )}

      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
