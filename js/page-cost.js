// ─── Tab Bar ───
function TabBar({ active, onChange }) {
  const tabs = [
    { id: "campaigns", label: "캠페인", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { id: "cost", label: "광고비", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id: "settings", label: "설정", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 640, minWidth: 0, background: theme.surface, borderTop: `1px solid ${theme.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          padding: "12px 0 10px", background: "none", border: "none", cursor: "pointer",
          color: active === t.id ? theme.accent : theme.textDim, transition: "color 0.2s",
        }}>
          {t.icon}
          <span style={{ fontSize: 11, fontWeight: 700 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Mini Bar Chart ───
function MiniChart({ data, color, height = 60 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(Math.floor((100 / data.length) - 1), 12);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height, padding: "4px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{
            width: "100%", maxWidth: barW, minWidth: 4,
            height: Math.max((d.value / max) * (height - 16), 2),
            background: color || theme.accent, borderRadius: 2,
            opacity: 0.4 + (d.value / max) * 0.6,
            transition: "height 0.3s",
          }} />
          {data.length <= 15 && (
            <span style={{ fontSize: 8, color: theme.textDim, fontWeight: 500 }}>{d.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}


// ─── Cost Page ───
function CostPage({ user, apiSettings, showToast }) {
  const [activePeriod, setActivePeriod] = useState("today");
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [campaignStats, setCampaignStats] = useState({});
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campsLoaded, setCampsLoaded] = useState(false);

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

  const loadPeriod = useCallback(async (periodKey) => {
    setLoading(true); setError(""); setStats(null); setCampaignStats({}); setDailyData([]);
    const p = periods.find(x => x.key === periodKey);
    try {
      const camps = await loadCampaigns();
      if (camps.length === 0) { setLoading(false); return; }
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
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [apiSettings, loadCampaigns]);

  useEffect(() => { loadPeriod(activePeriod); }, [activePeriod]);

  const StatGrid = ({ s, compact }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
      {[
        { label: "노출수", value: typeof s.impCnt === "number" ? fmtNum(s.impCnt) : s.impCnt, color: theme.text },
        { label: "클릭수", value: typeof s.clkCnt === "number" ? fmtNum(s.clkCnt) : s.clkCnt, color: theme.accent, big: true },
        { label: "평균CPC", value: typeof s.cpc === "number" ? fmtNum(s.cpc) + "원" : s.cpc, color: theme.text },
        { label: "총비용", value: typeof s.salesAmt === "number" ? fmtNum(s.salesAmt) + "원" : s.salesAmt, color: theme.danger },
      ].map((x, i) => (
        <div key={i} style={{ background: theme.surfaceLight, borderRadius: 10, padding: compact ? "8px 6px" : "12px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: theme.textDim, fontWeight: 600, marginBottom: 3 }}>{x.label}</div>
          <div style={{ fontSize: compact ? (x.big ? 14 : 11) : (x.big ? 20 : 14), fontWeight: 800, color: x.color }}>{x.value}</div>
        </div>
      ))}
    </div>
  );

  const sortedCamps = campaigns
    .filter(c => campaignStats[c.nccCampaignId])
    .sort((a, b) => (campaignStats[b.nccCampaignId]?.salesAmt || 0) - (campaignStats[a.nccCampaignId]?.salesAmt || 0));

  return (
    <div style={{ width: "100%", minHeight: "100vh", padding: "0 20px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 12px", position: "sticky", top: 0, zIndex: 10, background: theme.bg + "ee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg," + theme.accent + "," + theme.accentDark + ")", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px " + theme.accentGlow }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>광고비</div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.name}</div>
          </div>
        </div>
        <button onClick={() => loadPeriod(activePeriod)} style={{ background: theme.surface, border: "1.5px solid " + theme.border, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.accent, boxShadow: theme.cardShadow }}>{I.refresh}</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: theme.surface, borderRadius: 12, padding: 4, border: "1px solid " + theme.border }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setActivePeriod(p.key)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
            background: activePeriod === p.key ? theme.accent : "transparent",
            color: activePeriod === p.key ? "#fff" : theme.textDim,
            boxShadow: activePeriod === p.key ? "0 2px 8px " + theme.accentGlow : "none",
          }}>{p.label}</button>
        ))}
      </div>

      {loading && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {[1,2,3,4].map(j => <div key={j} style={{ height: 56, background: theme.surfaceLight, borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />)}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </Card>
      )}

      {error && !loading && (
        <Card style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: theme.danger, fontWeight: 600, marginBottom: 6 }}>조회 실패</div>
          <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 12, lineHeight: 1.5 }}>{error}</div>
          <Button onClick={() => loadPeriod(activePeriod)} variant="secondary">다시 시도</Button>
        </Card>
      )}

      {!loading && !error && stats && (
        <>
          <Card style={{ marginBottom: 12, padding: 16 }}><StatGrid s={stats} /></Card>

          {dailyData.length > 1 && (
            <Card style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, marginBottom: 4 }}>일별 비용</div>
              <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 8 }}>총 {fmtNum(dailyData.reduce((s,d) => s+d.salesAmt,0))}원</div>
              <MiniChart data={dailyData.map(d => ({ value: d.salesAmt, label: d.label }))} color={theme.danger} height={50} />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 4 }}>일별 클릭수</div>
                <MiniChart data={dailyData.map(d => ({ value: d.clkCnt, label: d.label }))} color={theme.accent} height={40} />
              </div>
            </Card>
          )}

          {sortedCamps.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>캠페인별 상세</span>
                <span style={{ fontSize: 12, color: theme.textDim, fontWeight: 600 }}>{sortedCamps.length}개</span>
              </div>
              {sortedCamps.map(c => {
                const cs = campaignStats[c.nccCampaignId];
                const isZero = !cs || cs.salesAmt === 0;
                return (
                  <Card key={c.nccCampaignId} style={{ padding: 12, marginBottom: 8, opacity: isZero ? 0.5 : 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: isZero ? theme.textDim : theme.accent, display: "inline-block" }} />
                      {c.name}
                    </div>
                    {cs && <StatGrid s={cs} compact />}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

