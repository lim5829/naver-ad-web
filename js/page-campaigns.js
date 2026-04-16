// ─── Bid Presets ───
// DEFAULT_PRESETS는 theme.js에서 정의됨

function PresetManager({ presets, onChange }) {
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState("");

  const addPreset = () => {
    const val = parseInt(newValue);
    if (isNaN(val) || val < 70) return;
    if (presets.includes(val)) return;
    onChange([...presets, val].sort((a, b) => a - b));
    setNewValue("");
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {presets.map((p, i) => (
        <span key={i} style={{
          fontSize: 11, background: theme.surfaceLight, borderRadius: 8, padding: "5px 10px",
          display: "inline-flex", alignItems: "center", gap: 4, color: theme.text, fontWeight: 600,
          border: `1px solid ${theme.border}`,
        }}>
          {fmtNum(p)}
          {editing && <button onClick={() => onChange(presets.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: theme.danger, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 1 }}>×</button>}
        </span>
      ))}
      {editing ? (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="금액" type="number"
            onKeyDown={e => { if (e.key === "Enter") addPreset(); }}
            style={{ width: 64, background: theme.surfaceLight, border: `1.5px solid ${theme.accent}44`, borderRadius: 8, padding: "5px 8px", fontSize: 11, color: theme.text, outline: "none" }} />
          <button onClick={addPreset} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
          <button onClick={() => setEditing(false)} style={{ background: theme.surfaceLight, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: theme.textDim, cursor: "pointer", fontWeight: 600 }}>완료</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} style={{ background: "none", border: `1.5px dashed ${theme.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: theme.textDim, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>편집</button>
      )}
    </div>
  );
}

// ─── Inline Bid Editor ───
function BidEditor({ adgroup, apiSettings, presets, showToast }) {
  const currentBid = adgroup.bidAmt || adgroup.defaultBid || 0;
  const [bid, setBid] = useState(String(currentBid));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (newBid) => {
    const val = parseInt(newBid);
    if (isNaN(val) || val < 70) { showToast("최소 입찰가는 70원입니다", "error"); return; }
    if (val === currentBid) return;
    setSaving(true);
    try {
      await naverApiFetch({
        method: "PUT",
        path: `/api/adgroups/${adgroup.nccAdgroupId}/bid`,
        ...apiSettings,
        body: { bidAmt: val },
      });
      setBid(String(val));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      showToast(`입찰가 ${fmtNum(val)}원으로 변경`);
    } catch (e) {
      showToast(`변경 실패: ${e.message}`, "error");
    }
    setSaving(false);
  };

  const handlePreset = (value) => {
    setBid(String(value));
    handleSave(value);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="number" value={bid}
            onChange={e => { setBid(e.target.value); setSaved(false); }}
            onBlur={() => handleSave(bid)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(bid); }}
            style={{
              width: "100%", background: theme.surfaceLight,
              border: `1.5px solid ${saved ? theme.accent : "transparent"}`,
              borderRadius: 10, padding: "10px 42px 10px 12px",
              fontSize: 15, fontWeight: 700, color: theme.text, outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.2s",
              boxShadow: saved ? `0 0 0 3px ${theme.accentGlow}` : "none",
            }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: theme.textDim, fontWeight: 600, pointerEvents: "none" }}>원</span>
        </div>
        {saving && <span style={{ width: 20, height: 20, border: `2.5px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />}
        {saved && <span style={{ color: theme.accent, display: "flex", flexShrink: 0 }}>{I.check}</span>}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => handlePreset(p)} style={{
            background: parseInt(bid) === p ? theme.accentDim : theme.surfaceLight,
            border: `1.5px solid ${parseInt(bid) === p ? theme.accent + "55" : "transparent"}`,
            borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700,
            color: parseInt(bid) === p ? theme.accent : theme.textDim,
            cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
          }}>
            {fmtNum(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Budget Editor (하루예산) ───
function BudgetEditor({ adgroup, apiSettings, showToast }) {
  const [displayBudget, setDisplayBudget] = useState(adgroup.dailyBudget || 0);
  const [budget, setBudget] = useState(String(adgroup.dailyBudget || 0));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    const val = parseInt(budget);
    if (isNaN(val) || val < 0) { showToast("올바른 금액을 입력하세요", "error"); return; }
    if (val === displayBudget) { setEditing(false); return; }
    setSaving(true);
    try {
      const result = await naverApiFetch({
        method: "PUT",
        path: `/api/adgroups/${adgroup.nccAdgroupId}/budget`,
        ...apiSettings,
        body: { dailyBudget: val },
      });
      const newBudget = result && result.dailyBudget != null ? result.dailyBudget : val;
      setDisplayBudget(newBudget);
      setBudget(String(newBudget));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      showToast(`하루예산 ${newBudget === 0 ? "제한없음" : fmtNum(newBudget) + "원"}으로 변경`);
      setEditing(false);
    } catch (e) {
      showToast(`변경 실패: ${e.message}`, "error");
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} style={{
        display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
        padding: "6px 10px", background: theme.surfaceLight, borderRadius: 8,
        border: `1px solid ${saved ? theme.accent + "44" : "transparent"}`,
        transition: "all 0.2s",
      }}>
        <span style={{ fontSize: 10, color: theme.textDim, fontWeight: 600 }}>하루예산</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: displayBudget > 0 ? theme.text : theme.textDim }}>
          {displayBudget > 0 ? fmtNum(displayBudget) + "원" : "제한없음"}
        </span>
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={theme.textDim} strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        {saved && <span style={{ color: theme.accent }}>{I.check}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, animation: "fadeUp 0.2s ease" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          style={{
            width: "100%", background: theme.surfaceLight,
            border: `1.5px solid ${theme.accent}44`, borderRadius: 8,
            padding: "6px 32px 6px 8px", fontSize: 13, fontWeight: 700,
            color: theme.text, outline: "none",
            fontFamily: "'JetBrains Mono', monospace",
          }} />
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: theme.textDim, fontWeight: 600, pointerEvents: "none" }}>원</span>
      </div>
      <button onClick={handleSave} disabled={saving} style={{
        background: theme.accent, color: "#fff", border: "none", borderRadius: 8,
        padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
      }}>{saving ? "..." : "저장"}</button>
      <button onClick={() => { setEditing(false); setBudget(String(displayBudget)); }} style={{
        background: theme.surfaceLight, color: theme.textDim, border: `1px solid ${theme.border}`,
        borderRadius: 8, padding: "6px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer",
      }}>취소</button>
    </div>
  );
}

// ─── Adgroup Row ───
function AdgroupRow({ adgroup, apiSettings, presets, showToast }) {
  const status = adgroup.userStatus || adgroup.status;
  const isActive = status === "ELIGIBLE";

  return (
    <div style={{
      padding: "14px 16px", background: theme.surface, borderRadius: 14,
      border: `1px solid ${isActive ? theme.border : theme.border + "88"}`,
      marginBottom: 8, animation: "fadeUp 0.25s ease",
      opacity: isActive ? 1 : 0.7,
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, flex: 1, marginRight: 8, lineHeight: 1.4 }}>{adgroup.name}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 12, whiteSpace: "nowrap",
          color: isActive ? theme.accent : theme.textDim,
          background: isActive ? theme.accentDim : theme.surfaceLight,
          display: "inline-flex", alignItems: "center", gap: 3,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? theme.accent : theme.textDim, display: "inline-block" }} />
          {isActive ? "활성" : "비활성"}
        </span>
      </div>
      <BidEditor adgroup={adgroup} apiSettings={apiSettings} presets={presets} showToast={showToast} />
      <div style={{ marginTop: 8 }}>
        <BudgetEditor adgroup={adgroup} apiSettings={apiSettings} showToast={showToast} />
      </div>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ─── Campaign ON/OFF Toggle ───
function CampaignToggle({ campaign, apiSettings, showToast, onToggle }) {
  const [toggling, setToggling] = useState(false);
  const isActive = !campaign.userLock;

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await naverApiFetch({
        method: "PUT",
        path: `/api/campaigns/${campaign.nccCampaignId}/status`,
        ...apiSettings,
        body: { userLock: isActive },
      });
      showToast(isActive ? "캠페인을 일시중지했습니다" : "캠페인을 활성화했습니다");
      if (onToggle) onToggle();
    } catch (e) {
      showToast(`상태 변경 실패: ${e.message}`, "error");
    }
    setToggling(false);
  };

  return (
    <div onClick={handleToggle} style={{
      width: 40, height: 22, borderRadius: 11,
      background: toggling ? theme.textDim : (isActive ? theme.accent : "#D1D5DB"),
      position: "relative", cursor: toggling ? "wait" : "pointer",
      transition: "background 0.25s", flexShrink: 0,
      opacity: toggling ? 0.6 : 1,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 9,
        background: "#fff", position: "absolute", top: 2,
        left: isActive ? 20 : 2, transition: "left 0.25s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ─── Campaign Accordion ───
function CampaignAccordion({ campaign, apiSettings, presets, showToast, isFirst, showAll, onPresetsChange, onRefresh }) {
  const [open, setOpen] = useState(true);
  const [adgroups, setAdgroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAdgroups = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await naverApiFetch({
        path: `/api/adgroups?campaignId=${campaign.nccCampaignId}`,
        ...apiSettings,
      });
      setAdgroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMsg(e.message);
      showToast(`광고그룹 조회 실패: ${e.message}`, "error");
    }
    setLoaded(true); setLoading(false);
  };

  const toggle = async () => {
    if (!open && !loaded) {
      await fetchAdgroups();
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!loaded) {
      fetchAdgroups();
    }
  }, []);

  const activeAdgroups = adgroups.filter(a => (a.userStatus || a.status) === "ELIGIBLE");
  const displayAdgroups = showAll ? adgroups : activeAdgroups;
  const activeCount = activeAdgroups.length;

  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={toggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: theme.surface,
        border: `1.5px solid ${open ? theme.accent + "44" : theme.border}`,
        borderRadius: open ? "16px 16px 0 0" : 16, padding: "14px 16px",
        cursor: "pointer", transition: "all 0.25s",
        boxShadow: open ? `0 4px 16px ${theme.accentGlow}` : theme.cardShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={open ? theme.accent : theme.textDim} strokeWidth="2.5" style={{ transition: "transform 0.25s", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{campaign.name}</div>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <TypeBadge type={campaign.campaignTp} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loaded && <span style={{ fontSize: 11, color: theme.textDim, fontWeight: 600 }}>{activeCount}/{adgroups.length}</span>}
          {loading && <span style={{ width: 14, height: 14, border: `2px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          <CampaignToggle campaign={campaign} apiSettings={apiSettings} showToast={showToast} onToggle={onRefresh} />
        </div>
      </button>

      {open && (
        <div style={{
          background: theme.bg, border: `1.5px solid ${theme.accent}22`, borderTop: "none",
          borderRadius: "0 0 16px 16px", padding: 14,
        }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <span style={{ width: 24, height: 24, border: `3px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}
          {!loading && adgroups.length > 0 && displayAdgroups.length === 0 && !errorMsg && (
            <div style={{ textAlign: "center", padding: 24, color: theme.textDim, fontSize: 13, fontWeight: 500 }}>활성 광고그룹이 없습니다</div>
          )}
          {!loading && adgroups.length === 0 && !errorMsg && (
            <div style={{ textAlign: "center", padding: 24, color: theme.textDim, fontSize: 13, fontWeight: 500 }}>광고그룹이 없습니다</div>
          )}
          {!loading && errorMsg && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 13, color: theme.danger, fontWeight: 600, marginBottom: 10 }}>{errorMsg}</div>
              <button onClick={() => { setLoaded(false); setErrorMsg(""); fetchAdgroups(); }} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>다시 시도</button>
            </div>
          )}
          {!loading && displayAdgroups.map(ag => (
            <AdgroupRow key={ag.nccAdgroupId} adgroup={ag} apiSettings={apiSettings} presets={presets} showToast={showToast} />
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: theme.surface, borderRadius: 16, border: `1px solid ${theme.border}`, padding: "16px 18px", marginBottom: 10, boxShadow: theme.cardShadow }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 16, height: 16, background: theme.surfaceLight, borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 16, flex: 1, background: theme.surfaceLight, borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 40, height: 20, background: theme.surfaceLight, borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─── Campaigns Page ───
function CampaignsPage({ user, apiSettings, showToast }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem("naver-ad-bid-presets");
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });

  const savePresets = (p) => {
    setPresets(p);
    localStorage.setItem("naver-ad-bid-presets", JSON.stringify(p));
  };

  const fetchCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const data = await naverApiFetch({
        path: "/api/campaigns",
        customerId: apiSettings.customerId,
        apiKey: apiSettings.apiKey,
        secretKey: apiSettings.secretKey,
        managerLoginId: apiSettings.managerLoginId,
      });
      setCampaigns(Array.isArray(data) ? data : []);
      if (isRefresh) showToast("새로고침 완료");
    } catch (e) {
      setError(`캠페인을 불러올 수 없습니다: ${e.message}`);
    }
    setLoading(false); setRefreshing(false);
  }, [apiSettings, showToast]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const activeCampaigns = campaigns.filter(c => !c.userLock);
  const inactiveCampaigns = campaigns.filter(c => c.userLock);
  // 파워링크(WEB_SITE)를 마지막에 배치
  const sortByType = (arr) => [...arr].sort((a, b) => {
    const aPower = a.campaignTp === "WEB_SITE" ? 1 : 0;
    const bPower = b.campaignTp === "WEB_SITE" ? 1 : 0;
    return aPower - bPower;
  });
  const displayCampaigns = sortByType(showAll ? campaigns : activeCampaigns);

  // 오늘 총 비용
  const [todayCost, setTodayCost] = useState(null);
  useEffect(() => {
    if (campaigns.length === 0) return;
    const ids = campaigns.map(c => c.nccCampaignId).join(",");
    const fields = '["clkCnt","impCnt","salesAmt"]';
    naverApiFetch({
      path: `/api/stats-summary?ids=${encodeURIComponent(ids)}&fields=${encodeURIComponent(fields)}&datePreset=today`,
      ...apiSettings,
    }).then(data => {
      const arr = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      const total = { clkCnt: 0, impCnt: 0, salesAmt: 0 };
      arr.forEach(item => {
        total.clkCnt += Number(item.clkCnt) || 0;
        total.impCnt += Number(item.impCnt) || 0;
        total.salesAmt += Number(item.salesAmt) || 0;
      });
      setTodayCost(total);
    }).catch(() => {});
  }, [campaigns, apiSettings]);

  // 프리셋 패널 토글
  const [presetOpen, setPresetOpen] = useState(false);

  // 일괄 입찰가 변경
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBid, setBulkBid] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const handleBulkBid = async () => {
    const val = parseInt(bulkBid);
    if (isNaN(val) || val < 70) { showToast("최소 입찰가는 70원입니다", "error"); return; }
    setBulkLoading(true);

    try {
      // 모든 활성 캠페인의 광고그룹 로드
      const allAdgroups = [];
      for (const c of activeCampaigns) {
        try {
          const data = await naverApiFetch({ path: `/api/adgroups?campaignId=${c.nccCampaignId}`, ...apiSettings });
          const ags = Array.isArray(data) ? data : [];
          const activeAgs = ags.filter(a => (a.userStatus || a.status) === "ELIGIBLE");
          allAdgroups.push(...activeAgs);
        } catch (e) { /* 무시 */ }
      }

      if (allAdgroups.length === 0) { showToast("활성 광고그룹이 없습니다", "error"); setBulkLoading(false); return; }

      setBulkProgress({ done: 0, total: allAdgroups.length });
      let success = 0;
      for (let i = 0; i < allAdgroups.length; i++) {
        try {
          await naverApiFetch({
            method: "PUT",
            path: `/api/adgroups/${allAdgroups[i].nccAdgroupId}/bid`,
            ...apiSettings,
            body: { bidAmt: val },
          });
          success++;
        } catch (e) { /* 실패 무시 */ }
        setBulkProgress({ done: i + 1, total: allAdgroups.length });
      }

      showToast(`${success}/${allAdgroups.length}개 광고그룹 입찰가를 ${fmtNum(val)}원으로 변경`);
      setBulkOpen(false); setBulkBid("");
    } catch (e) {
      showToast(`일괄 변경 실패: ${e.message}`, "error");
    }
    setBulkLoading(false); setBulkProgress({ done: 0, total: 0 });
  };

  return (
    <div style={{ minHeight: "100vh", padding: "0 20px 80px" }}>
      {/* 일괄 변경 모달 */}
      {bulkOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => !bulkLoading && setBulkOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 360, background: theme.surface, borderRadius: 20, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, marginBottom: 4 }}>입찰가 일괄 변경</div>
            <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 16, lineHeight: 1.5 }}>
              모든 활성 캠페인의 활성 광고그룹 입찰가를 한번에 변경합니다
            </div>

            <div style={{ position: "relative", marginBottom: 12 }}>
              <input type="number" value={bulkBid} onChange={e => setBulkBid(e.target.value)}
                placeholder="입찰가 입력 (최소 70)" disabled={bulkLoading}
                onKeyDown={e => { if (e.key === "Enter") handleBulkBid(); }}
                style={{
                  width: "100%", padding: "14px 42px 14px 14px", borderRadius: 12,
                  border: `1.5px solid ${theme.border}`, fontSize: 16, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace", color: theme.text,
                  outline: "none", background: theme.surfaceLight,
                }} />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: theme.textDim, fontWeight: 600, pointerEvents: "none" }}>원</span>
            </div>

            {/* 프리셋 버튼 */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {presets.map((p, i) => (
                <button key={i} onClick={() => setBulkBid(String(p))} disabled={bulkLoading} style={{
                  background: parseInt(bulkBid) === p ? theme.accentDim : theme.surfaceLight,
                  border: `1.5px solid ${parseInt(bulkBid) === p ? theme.accent + "55" : "transparent"}`,
                  borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                  color: parseInt(bulkBid) === p ? theme.accent : theme.textDim,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{fmtNum(p)}</button>
              ))}
            </div>

            {/* 진행 상태 */}
            {bulkLoading && bulkProgress.total > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.textDim, fontWeight: 600, marginBottom: 4 }}>
                  <span>변경 중...</span>
                  <span>{bulkProgress.done}/{bulkProgress.total}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: theme.surfaceLight, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: theme.accent, width: ((bulkProgress.done / bulkProgress.total) * 100) + "%", transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setBulkOpen(false)} disabled={bulkLoading} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: `1.5px solid ${theme.border}`,
                background: theme.surface, fontSize: 14, fontWeight: 700, color: theme.textDim,
                cursor: bulkLoading ? "not-allowed" : "pointer",
              }}>취소</button>
              <button onClick={handleBulkBid} disabled={bulkLoading || !bulkBid || parseInt(bulkBid) < 70} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
                fontSize: 14, fontWeight: 700, color: "#fff",
                cursor: (bulkLoading || !bulkBid) ? "not-allowed" : "pointer",
                opacity: (bulkLoading || !bulkBid) ? 0.5 : 1,
                boxShadow: `0 4px 12px ${theme.accentGlow}`,
              }}>
                {bulkLoading ? "변경 중..." : "일괄 변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", position: "sticky", top: 0, zIndex: 10, background: theme.bg + "ee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${theme.accentGlow}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, letterSpacing: -0.3 }}>캠페인</div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setBulkOpen(true)} style={{
            background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 12,
            height: 40, padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            cursor: "pointer", color: theme.text, boxShadow: theme.cardShadow,
            fontSize: 11, fontWeight: 700,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={theme.accent} strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            일괄변경
          </button>
          <button onClick={() => fetchCampaigns(true)} disabled={refreshing} style={{
            background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 12,
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: theme.accent, boxShadow: theme.cardShadow,
            transition: "transform 0.5s", transform: refreshing ? "rotate(360deg)" : "none",
          }}>{I.refresh}</button>
        </div>
      </div>

      {/* Summary */}
      {!loading && !error && campaigns.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <Card style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 3 }}>전체</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>{campaigns.length}</div>
          </Card>
          <Card style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginBottom: 3 }}>활성</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>{activeCampaigns.length}</div>
          </Card>
          <Card style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 3 }}>비활성</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.textDim }}>{inactiveCampaigns.length}</div>
          </Card>
        </div>
      )}

      {/* 오늘 비용 */}
      {!loading && !error && todayCost && todayCost.salesAmt > 0 && (
        <Card style={{ padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>오늘 총 비용</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.danger }}>{fmtNum(todayCost.salesAmt)}원</div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: theme.textDim, fontWeight: 600 }}>클릭</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>{fmtNum(todayCost.clkCnt)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: theme.textDim, fontWeight: 600 }}>노출</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>{fmtNum(todayCost.impCnt)}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter + Preset */}
      {!loading && !error && campaigns.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: presetOpen ? 8 : 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: theme.accent }}>{showAll ? I.list : I.filter}</span>
              {showAll ? "전체" : "활성만"}
              <span style={{ fontSize: 12, color: theme.textDim, fontWeight: 600 }}>({displayCampaigns.length})</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPresetOpen(!presetOpen)} style={{
                background: presetOpen ? theme.blueDim : theme.surfaceLight,
                border: `1.5px solid ${presetOpen ? theme.blue + "33" : theme.border}`,
                borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                color: presetOpen ? theme.blue : theme.textDim,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                transition: "all 0.2s",
              }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                입찰가 프리셋
              </button>
              <button onClick={() => setShowAll(!showAll)} style={{
                background: showAll ? theme.accentDim : theme.surfaceLight,
                border: `1.5px solid ${showAll ? theme.accent + "33" : theme.border}`,
                borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                color: showAll ? theme.accent : theme.textDim,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                transition: "all 0.2s",
              }}>
                {showAll ? <>{I.filter} 활성만</> : <>{I.list} 전체</>}
              </button>
            </div>
          </div>
          {presetOpen && (
            <Card style={{ padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>입찰가 프리셋 관리</div>
              <PresetManager presets={presets} onChange={savePresets} />
            </Card>
          )}
        </>
      )}

      {loading && <div><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}

      {error && (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, color: theme.danger, fontWeight: 700, marginBottom: 6 }}>연결 오류</div>
          <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 18, lineHeight: 1.6 }}>{error}</div>
          <Button onClick={() => fetchCampaigns()} variant="secondary">다시 시도</Button>
        </Card>
      )}

      {!loading && !error && displayCampaigns.length === 0 && (
        <Card style={{ padding: 44, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{showAll ? "캠페인이 없습니다" : "활성 캠페인이 없습니다"}</div>
          {!showAll && inactiveCampaigns.length > 0 && (
            <Button onClick={() => setShowAll(true)} variant="secondary" style={{ width: "auto", padding: "10px 24px", margin: "14px auto 0" }}>{I.list} 전체 보기 ({inactiveCampaigns.length}개)</Button>
          )}
        </Card>
      )}

      {!loading && !error && displayCampaigns.map((c, i) => (
        <CampaignAccordion key={c.nccCampaignId || i} campaign={c} apiSettings={apiSettings} presets={presets} showToast={showToast} isFirst={i === 0} showAll={showAll} onPresetsChange={savePresets} onRefresh={() => fetchCampaigns(true)} />
      ))}
    </div>
  );
}
