// ─── Tab Bar ───
function TabBar({ active, onChange }) {
  const tabs = [
    { id: "campaigns", label: "캠페인", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { id: "rank", label: "순위", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: "cost", label: "광고비", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id: "settings", label: "설정", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: theme.surface, borderTop: `1px solid ${theme.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer",
          color: active === t.id ? theme.accent : theme.textDim, transition: "color 0.2s",
        }}>
          {t.icon}
          <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Mini Bar Chart (개선) ───
function MiniChart({ data, color, height = 60, showTooltip }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(Math.floor((100 / data.length) - 1), 14);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height, padding: "4px 0" }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * (height - 16), 2);
        const isMax = d.value === max && d.value > 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
            {isMax && showTooltip && (
              <div style={{ fontSize: 8, fontWeight: 700, color, position: "absolute", top: -12, whiteSpace: "nowrap" }}>
                {typeof d.value === "number" ? fmtNum(d.value) : d.value}
              </div>
            )}
            <div style={{
              width: "100%", maxWidth: barW, minWidth: 4,
              height: barH,
              background: isMax ? color : (color || theme.accent),
              borderRadius: 3,
              opacity: isMax ? 1 : 0.35 + (d.value / max) * 0.55,
              transition: "height 0.4s ease",
            }} />
            {data.length <= 15 && (
              <span style={{ fontSize: 8, color: theme.textDim, fontWeight: 500 }}>{d.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ─── Campaign Cost Card (광고그룹 하위 표시) ───
function CostCampaignCard({ campaign, cs, totalSales, apiSettings, activePeriod, periods, getMonthRange }) {
  const [open, setOpen] = useState(false);
  const [adgroupStats, setAdgroupStats] = useState([]);
  const [loadingAg, setLoadingAg] = useState(false);
  const [loadedAg, setLoadedAg] = useState(false);

  const pct = totalSales > 0 ? ((cs.salesAmt / totalSales) * 100).toFixed(1) : "0";

  const extractArr = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && typeof data === "object") return [data];
    return [];
  };

  const loadAdgroupCost = async () => {
    if (loadedAg) return;
    setLoadingAg(true);
    try {
      // 광고그룹 목록 로드
      const agData = await naverApiFetch({ path: `/api/adgroups?campaignId=${campaign.nccCampaignId}`, ...apiSettings });
      const adgroups = Array.isArray(agData) ? agData : [];
      if (adgroups.length === 0) { setLoadingAg(false); setLoadedAg(true); return; }

      // 광고그룹별 통계 로드
      const agIds = adgroups.map(a => a.nccAdgroupId).join(",");
      const fields = '["clkCnt","impCnt","salesAmt","cpc","ctr"]';
      const p = periods.find(x => x.key === activePeriod);

      let statsData;
      if (p.useRange || p.key === "lastMonth") {
        const r = p.key === "lastMonth" ? getMonthRange(-1) : getMonthRange(0);
        statsData = await naverApiFetch({ path: `/api/stats-range?ids=${encodeURIComponent(agIds)}&fields=${encodeURIComponent(fields)}&since=${r.since}&until=${r.until}`, ...apiSettings });
      } else {
        statsData = await naverApiFetch({ path: `/api/stats-summary?ids=${encodeURIComponent(agIds)}&fields=${encodeURIComponent(fields)}&datePreset=${p.preset}`, ...apiSettings });
      }

      const arr = extractArr(statsData);
      const byAg = {};
      arr.forEach(item => {
        const id = item.id || item.nccAdgroupId;
        if (!byAg[id]) byAg[id] = { clkCnt: 0, impCnt: 0, salesAmt: 0 };
        byAg[id].clkCnt += Number(item.clkCnt) || 0;
        byAg[id].impCnt += Number(item.impCnt) || 0;
        byAg[id].salesAmt += Number(item.salesAmt) || 0;
      });

      const result = adgroups.map(ag => {
        const s = byAg[ag.nccAdgroupId] || { clkCnt: 0, impCnt: 0, salesAmt: 0 };
        s.cpc = s.clkCnt > 0 ? Math.round(s.salesAmt / s.clkCnt) : 0;
        s.ctr = s.impCnt > 0 ? ((s.clkCnt / s.impCnt) * 100).toFixed(2) : "0.00";
        return { ...ag, stats: s };
      }).filter(ag => ag.stats.salesAmt > 0).sort((a, b) => b.stats.salesAmt - a.stats.salesAmt);

      setAdgroupStats(result);
    } catch (e) { /* 무시 */ }
    setLoadingAg(false); setLoadedAg(true);
  };

  const handleToggle = () => {
    if (!open && !loadedAg) loadAdgroupCost();
    setOpen(!open);
  };

  return (
    <Card style={{ padding: 0, marginBottom: 8, animation: "fadeUp 0.25s ease", overflow: "hidden" }}>
      {/* 캠페인 헤더 — 클릭하면 광고그룹 펼침 */}
      <div onClick={handleToggle} style={{ padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={open ? theme.accent : theme.textDim} strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{campaign.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.danger, marginLeft: 8, whiteSpace: "nowrap" }}>
            {fmtNum(cs.salesAmt)}원
            <span style={{ fontSize: 10, color: theme.textDim, fontWeight: 500, marginLeft: 3 }}>({pct}%)</span>
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: theme.surfaceLight, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: theme.accent, width: pct + "%", transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "노출", value: fmtNum(cs.impCnt), color: theme.text },
            { label: "클릭", value: fmtNum(cs.clkCnt), color: theme.accent },
            { label: "CPC", value: fmtNum(cs.cpc) + "원", color: theme.text },
            { label: "CTR", value: cs.ctr + "%", color: theme.blue },
          ].map((x, i) => (
            <div key={i} style={{ background: theme.surfaceLight, borderRadius: 8, padding: "6px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 8, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>{x.label}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: x.color }}>{x.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 광고그룹 하위 */}
      {open && (
        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "10px 14px", background: theme.bg }}>
          {loadingAg && (
            <div style={{ textAlign: "center", padding: 14 }}>
              <span style={{ width: 18, height: 18, border: `2px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}
          {!loadingAg && adgroupStats.length === 0 && (
            <div style={{ textAlign: "center", padding: 10, fontSize: 12, color: theme.textDim }}>비용이 발생한 광고그룹이 없습니다</div>
          )}
          {!loadingAg && adgroupStats.map((ag, i) => {
            const agPct = cs.salesAmt > 0 ? ((ag.stats.salesAmt / cs.salesAmt) * 100).toFixed(1) : "0";
            return (
              <div key={ag.nccAdgroupId} style={{ padding: "10px 0", borderBottom: i < adgroupStats.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: theme.blue, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ag.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme.danger, whiteSpace: "nowrap", marginLeft: 6 }}>
                    {fmtNum(ag.stats.salesAmt)}원
                    <span style={{ fontSize: 9, color: theme.textDim, fontWeight: 500, marginLeft: 2 }}>({agPct}%)</span>
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                  {[
                    { label: "노출", value: fmtNum(ag.stats.impCnt), color: theme.text },
                    { label: "클릭", value: fmtNum(ag.stats.clkCnt), color: theme.accent },
                    { label: "CPC", value: fmtNum(ag.stats.cpc) + "원", color: theme.text },
                    { label: "CTR", value: ag.stats.ctr + "%", color: theme.blue },
                  ].map((x, j) => (
                    <div key={j} style={{ background: theme.surface, borderRadius: 6, padding: "4px 3px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: 7, color: theme.textDim, fontWeight: 600, marginBottom: 1 }}>{x.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: x.color }}>{x.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Cost Page (폴리싱) ───
function CostPage({ user, apiSettings, showToast }) {
  const [activePeriod, setActivePeriod] = useState("today");
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [campaignStats, setCampaignStats] = useState({});
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [campsLoaded, setCampsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const periods = [
    { key: "today", label: "오늘", preset: "today" },
    { key: "yesterday", label: "어제", preset: "yesterday" },
    { key: "thisMonth", label: "이번달", useRange: true },
    { key: "lastMonth", label: "지난달", preset: "lastmonth" },
  ];

  const getMonthRange = (offset) => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = offset === 0 ? now : new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    const fmt = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
    return { since: fmt(first), until: fmt(last) };
  };

  const extractDataArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && typeof data === "object") return [data];
    return [];
  };

  const aggregateStats = (arr) => {
    const totals = { clkCnt: 0, impCnt: 0, salesAmt: 0, cpc: 0, ctr: 0 };
    arr.forEach(item => {
      totals.clkCnt += Number(item.clkCnt) || 0;
      totals.impCnt += Number(item.impCnt) || 0;
      totals.salesAmt += Number(item.salesAmt) || 0;
    });
    totals.cpc = totals.clkCnt > 0 ? Math.round(totals.salesAmt / totals.clkCnt) : 0;
    totals.ctr = totals.impCnt > 0 ? ((totals.clkCnt / totals.impCnt) * 100).toFixed(2) : "0.00";
    return totals;
  };

  const loadCampaigns = useCallback(async () => {
    if (campsLoaded) return campaigns;
    const d = await naverApiFetch({ path: "/api/campaigns", ...apiSettings });
    const c = Array.isArray(d) ? d : [];
    setCampaigns(c); setCampsLoaded(true);
    return c;
  }, [apiSettings, campsLoaded, campaigns]);

  const loadPeriod = useCallback(async (periodKey, isRefresh) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(""); setStats(null); setCampaignStats({}); setDailyData([]); setExpanded(false);
    const p = periods.find(x => x.key === periodKey);
    try {
      const camps = await loadCampaigns();
      if (camps.length === 0) { setLoading(false); setRefreshing(false); return; }
      const idsStr = camps.map(c => c.nccCampaignId).join(",");
      const fields = '["clkCnt","impCnt","salesAmt","cpc","ctr"]';

      let data;
      if (p.useRange) {
        const r = getMonthRange(0);
        data = await naverApiFetch({ path: "/api/stats-range?ids=" + encodeURIComponent(idsStr) + "&fields=" + encodeURIComponent(fields) + "&since=" + r.since + "&until=" + r.until, ...apiSettings });
      } else if (p.key === "lastMonth") {
        const r = getMonthRange(-1);
        data = await naverApiFetch({ path: "/api/stats-range?ids=" + encodeURIComponent(idsStr) + "&fields=" + encodeURIComponent(fields) + "&since=" + r.since + "&until=" + r.until, ...apiSettings });
      } else {
        data = await naverApiFetch({ path: "/api/stats-summary?ids=" + encodeURIComponent(idsStr) + "&fields=" + encodeURIComponent(fields) + "&datePreset=" + p.preset, ...apiSettings });
      }

      const arr = extractDataArray(data);
      setStats(aggregateStats(arr));

      const byCampaign = {};
      arr.forEach(item => { const id = item.id || item.nccCampaignId; if (!byCampaign[id]) byCampaign[id] = []; byCampaign[id].push(item); });
      const cr = {};
      camps.forEach(c => { const items = byCampaign[c.nccCampaignId] || []; cr[c.nccCampaignId] = items.length > 0 ? aggregateStats(items) : { clkCnt:0, impCnt:0, salesAmt:0, cpc:0, ctr:"0.00" }; });
      setCampaignStats(cr);

      if (p.key === "thisMonth" || p.key === "lastMonth") {
        try {
          const r = p.key === "thisMonth" ? getMonthRange(0) : getMonthRange(-1);
          const df = '["clkCnt","impCnt","salesAmt"]';
          const dr = await naverApiFetch({ path: "/api/stats-range?ids=" + encodeURIComponent(idsStr) + "&fields=" + encodeURIComponent(df) + "&since=" + r.since + "&until=" + r.until, ...apiSettings });
          const darr = extractDataArray(dr);
          const byDate = {};
          darr.forEach(item => { const dt = item.statDt || item.date; if (dt) { if (!byDate[dt]) byDate[dt] = { clkCnt:0, salesAmt:0, impCnt:0 }; byDate[dt].clkCnt += Number(item.clkCnt)||0; byDate[dt].salesAmt += Number(item.salesAmt)||0; byDate[dt].impCnt += Number(item.impCnt)||0; }});
          const sorted = Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b));
          setDailyData(sorted.map(([dt, v]) => ({ date: dt, label: dt.slice(8), ...v })));
        } catch(e) { setDailyData([]); }
      }
      if (isRefresh) showToast("새로고침 완료");
    } catch (e) { setError(e.message); }
    setLoading(false); setRefreshing(false);
  }, [apiSettings, loadCampaigns]);

  useEffect(() => { loadPeriod(activePeriod); }, [activePeriod]);

  // 캠페인별 비용 내림차순 정렬
  const activeCamps = campaigns
    .filter(c => { const cs = campaignStats[c.nccCampaignId]; return cs && cs.salesAmt > 0; })
    .sort((a, b) => (campaignStats[b.nccCampaignId]?.salesAmt || 0) - (campaignStats[a.nccCampaignId]?.salesAmt || 0));

  // 총 비용에서 각 캠페인 비율
  const totalSales = stats ? stats.salesAmt : 0;

  return (
    <div style={{ minHeight: "100vh", padding: "0 20px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 14px", position: "sticky", top: 0, zIndex: 10, background: theme.bg + "ee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${theme.accentGlow}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, letterSpacing: -0.3 }}>광고비</div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.name}</div>
          </div>
        </div>
        <button onClick={() => loadPeriod(activePeriod, true)} disabled={refreshing} style={{
          background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 12,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: theme.accent, boxShadow: theme.cardShadow,
          transition: "transform 0.5s", transform: refreshing ? "rotate(360deg)" : "none",
        }}>{I.refresh}</button>
      </div>

      {/* Period Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: theme.surface, borderRadius: 14, padding: 4, border: `1.5px solid ${theme.border}` }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setActivePeriod(p.key)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.25s",
            background: activePeriod === p.key ? theme.accent : "transparent",
            color: activePeriod === p.key ? "#fff" : theme.textDim,
            boxShadow: activePeriod === p.key ? `0 2px 10px ${theme.accentGlow}` : "none",
          }}>{p.label}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <Card style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[1,2,3,4].map(j => <div key={j} style={{ height: 60, background: theme.surfaceLight, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 15, color: theme.danger, fontWeight: 700, marginBottom: 6 }}>조회 실패</div>
          <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 16, lineHeight: 1.6 }}>{error}</div>
          <Button onClick={() => loadPeriod(activePeriod)} variant="secondary">다시 시도</Button>
        </Card>
      )}

      {/* Stats */}
      {!loading && !error && stats && (
        <>
          {/* 총 비용 히어로 카드 */}
          <Card style={{ marginBottom: 12, padding: "20px 18px", background: `linear-gradient(135deg, ${theme.surface}, ${theme.surfaceLight})` }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 600, marginBottom: 4 }}>
                {periods.find(p => p.key === activePeriod)?.label} 총 비용
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: theme.danger, letterSpacing: -1 }}>
                {fmtNum(stats.salesAmt)}<span style={{ fontSize: 16, fontWeight: 600, marginLeft: 2 }}>원</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {[
                { label: "노출", value: fmtNum(stats.impCnt), color: theme.text },
                { label: "클릭", value: fmtNum(stats.clkCnt), color: theme.accent },
                { label: "CPC", value: fmtNum(stats.cpc) + "원", color: theme.text },
                { label: "CTR", value: stats.ctr + "%", color: theme.blue },
              ].map((x, i) => (
                <div key={i} style={{ background: theme.surface, borderRadius: 10, padding: "10px 6px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: 9, color: theme.textDim, fontWeight: 600, marginBottom: 3 }}>{x.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: x.color }}>{x.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 일별 차트 */}
          {dailyData.length > 1 && (
            <Card style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>일별 비용</div>
                  <div style={{ fontSize: 11, color: theme.textDim, marginTop: 2 }}>총 {fmtNum(dailyData.reduce((s,d) => s+d.salesAmt,0))}원</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: theme.textDim, fontWeight: 600 }}>일 평균</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: theme.danger }}>
                    {fmtNum(Math.round(dailyData.reduce((s,d) => s+d.salesAmt,0) / dailyData.length))}원
                  </div>
                </div>
              </div>
              <MiniChart data={dailyData.map(d => ({ value: d.salesAmt, label: d.label }))} color={theme.danger} height={55} showTooltip />
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 6 }}>일별 클릭수</div>
                <MiniChart data={dailyData.map(d => ({ value: d.clkCnt, label: d.label }))} color={theme.accent} height={40} />
              </div>
            </Card>
          )}

          {/* 캠페인별 상세 — 바로 표시 + 광고그룹 하위 */}
          {activeCamps.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                캠페인별 상세
                <span style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{activeCamps.length}개</span>
              </div>
              {activeCamps.map((c, idx) => (
                <CostCampaignCard key={c.nccCampaignId} campaign={c} cs={campaignStats[c.nccCampaignId]} totalSales={totalSales} apiSettings={apiSettings} activePeriod={activePeriod} periods={periods} getMonthRange={getMonthRange} />
              ))}
            </div>
          )}

          {/* 비용 없을 때 */}
          {stats.salesAmt === 0 && (
            <Card style={{ padding: 36, textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💰</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>비용이 없습니다</div>
              <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.5 }}>
                {activePeriod === "today" ? "오늘은 아직 광고 비용이 발생하지 않았습니다" : "해당 기간에 광고 비용이 없습니다"}
              </div>
            </Card>
          )}
        </>
      )}

      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
