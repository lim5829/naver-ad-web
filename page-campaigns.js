// ─── Bid Presets ───
// DEFAULT_PRESETS는 theme.js에 정의됨

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
        <span key={i} style={{ fontSize: 11, background: theme.surfaceLight, borderRadius: 6, padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 3, color: theme.text, fontWeight: 600 }}>
          {fmtNum(p)}
          {editing && <button onClick={() => onChange(presets.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: theme.danger, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 1 }}>×</button>}
        </span>
      ))}
      {editing ? (
        <>
          <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="금액" type="number"
            onKeyDown={e => { if (e.key === "Enter") addPreset(); }}
            style={{ width: 64, background: theme.surfaceLight, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: theme.text, outline: "none" }} />
          <button onClick={addPreset} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
          <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>완료</button>
        </>
      ) : (
        <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px dashed ${theme.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: theme.textDim, cursor: "pointer", fontWeight: 600 }}>편집</button>
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
      {/* Bid Input Row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="number" value={bid}
            onChange={e => { setBid(e.target.value); setSaved(false); }}
            onBlur={() => handleSave(bid)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(bid); }}
            style={{
              width: "100%", background: theme.surfaceLight,
              border: `1.5px solid ${saved ? theme.accent : "transparent"}`,
              borderRadius: 8, padding: "8px 40px 8px 10px",
              fontSize: 14, fontWeight: 700, color: theme.text, outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "border-color 0.2s",
            }}
          />
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: theme.textDim, fontWeight: 600, pointerEvents: "none" }}>원</span>
        </div>
        {saving && <span style={{ width: 18, height: 18, border: `2px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
        {saved && <span style={{ color: theme.accent, display: "flex" }}>{I.check}</span>}
      </div>
      {/* Preset Buttons */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => handlePreset(p)} style={{
            background: parseInt(bid) === p ? theme.accentDim : theme.surfaceLight,
            border: `1px solid ${parseInt(bid) === p ? theme.accent + "44" : "transparent"}`,
            borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700,
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

// ─── Adgroup Row ───
function AdgroupRow({ adgroup, apiSettings, presets, showToast }) {
  const status = adgroup.userStatus || adgroup.status;
  const isActive = status === "ELIGIBLE";
  return (
    <div style={{
      padding: "12px 14px", background: theme.surface, borderRadius: 12,
      border: `1px solid ${theme.border}`, marginBottom: 8,
      animation: "fadeUp 0.25s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, flex: 1, marginRight: 8, lineHeight: 1.3 }}>{adgroup.name}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap",
          color: isActive ? theme.accent : theme.textDim,
          background: isActive ? theme.accentDim : theme.surfaceLight,
        }}>
          {isActive ? "활성" : "비활성"}
        </span>
      </div>
      <BidEditor adgroup={adgroup} apiSettings={apiSettings} presets={presets} showToast={showToast} />
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ─── Campaign Accordion ───
function CampaignAccordion({ campaign, apiSettings, presets, showToast, isFirst, showAll, onPresetsChange }) {
  const [open, setOpen] = useState(false);
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

  // 첫 번째 캠페인 자동 펼침
  useEffect(() => {
    if (isFirst && !loaded) {
      fetchAdgroups().then(() => setOpen(true));
    }
  }, [isFirst]);

  const activeAdgroups = adgroups.filter(a => (a.userStatus || a.status) === "ELIGIBLE");
  const displayAdgroups = showAll ? adgroups : activeAdgroups;
  const activeCount = activeAdgroups.length;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Campaign Header — name only */}
      <button onClick={toggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: theme.surface, border: `1px solid ${open ? theme.accent + "33" : theme.border}`,
        borderRadius: open ? "14px 14px 0 0" : 14, padding: "14px 16px",
        cursor: "pointer", transition: "all 0.2s",
        boxShadow: open ? `0 2px 12px ${theme.accentGlow}` : theme.cardShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={open ? theme.accent : theme.textDim} strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.text, textAlign: "left" }}>{campaign.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {loaded && <span style={{ fontSize: 11, color: theme.textDim, fontWeight: 600 }}>{activeCount}/{adgroups.length}</span>}
          {loading && <span style={{ width: 14, height: 14, border: `2px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
        </div>
      </button>

      {/* Adgroups Panel */}
      {open && (
        <div style={{
          background: theme.bg, border: `1px solid ${theme.accent}22`, borderTop: "none",
          borderRadius: "0 0 14px 14px", padding: 12,
        }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <span style={{ width: 20, height: 20, border: `2.5px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}
          {!loading && displayAdgroups.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <PresetManager presets={presets} onChange={onPresetsChange} />
            </div>
          )}
          {!loading && adgroups.length > 0 && displayAdgroups.length === 0 && !errorMsg && (
            <div style={{ textAlign: "center", padding: 20, color: theme.textDim, fontSize: 13 }}>활성 광고그룹이 없습니다</div>
          )}
          {!loading && adgroups.length === 0 && !errorMsg && (
            <div style={{ textAlign: "center", padding: 20, color: theme.textDim, fontSize: 13 }}>광고그룹이 없습니다</div>
          )}
          {!loading && errorMsg && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 13, color: theme.danger, fontWeight: 600, marginBottom: 8 }}>{errorMsg}</div>
              <button onClick={() => { setLoaded(false); setErrorMsg(""); fetchAdgroups(); }} style={{ background: theme.surfaceLight, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: theme.text, cursor: "pointer" }}>다시 시도</button>
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
    <div style={{ background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, padding: "14px 16px", marginBottom: 10, boxShadow: theme.cardShadow }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 16, height: 16, background: theme.surfaceLight, borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 16, flex: 1, background: theme.surfaceLight, borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
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

  const activeCampaigns = campaigns.filter(c => (c.userStatus || c.status) === "ELIGIBLE");
  const inactiveCampaigns = campaigns.filter(c => (c.userStatus || c.status) !== "ELIGIBLE");
  const displayCampaigns = showAll ? campaigns : activeCampaigns;

  return (
    <div style={{ width: "100%", minHeight: "100vh", padding: "0 20px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", position: "sticky", top: 0, zIndex: 10, background: `linear-gradient(${theme.bg}, ${theme.bg}ee)`, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${theme.accentGlow}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>캠페인</div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fetchCampaigns(true)} disabled={refreshing} style={{ background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.accent, boxShadow: theme.cardShadow, transition: "transform 0.3s", transform: refreshing ? "rotate(360deg)" : "none" }}>{I.refresh}</button>
        </div>
      </div>

      {/* Summary */}
      {!loading && !error && campaigns.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Card style={{ padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>전체</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{campaigns.length}</div>
          </Card>
          <Card style={{ padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginBottom: 2 }}>활성</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.accent }}>{activeCampaigns.length}</div>
          </Card>
          <Card style={{ padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textDim, fontWeight: 600, marginBottom: 2 }}>비활성</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.textDim }}>{inactiveCampaigns.length}</div>
          </Card>
        </div>
      )}

      {/* Filter */}
      {!loading && !error && campaigns.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: theme.accent }}>{showAll ? I.list : I.filter}</span>
            {showAll ? "전체" : "활성만"}
            <span style={{ fontSize: 12, color: theme.textDim, fontWeight: 600 }}>({displayCampaigns.length})</span>
          </div>
          <button onClick={() => setShowAll(!showAll)} style={{ background: showAll ? theme.accentDim : theme.surfaceLight, border: `1.5px solid ${showAll ? theme.accent + "33" : theme.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: showAll ? theme.accent : theme.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            {showAll ? <>{I.filter} 활성만</> : <>{I.list} 전체</>}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}

      {/* Error */}
      {error && (
        <Card style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, color: theme.danger, fontWeight: 600, marginBottom: 6 }}>연결 오류</div>
          <div style={{ fontSize: 12, color: theme.textDim, marginBottom: 16, lineHeight: 1.5 }}>{error}</div>
          <Button onClick={() => fetchCampaigns()} variant="secondary">다시 시도</Button>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && displayCampaigns.length === 0 && (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 6 }}>{showAll ? "캠페인이 없습니다" : "활성 캠페인이 없습니다"}</div>
          {!showAll && inactiveCampaigns.length > 0 && (
            <Button onClick={() => setShowAll(true)} variant="secondary" style={{ width: "auto", padding: "10px 20px", margin: "12px auto 0" }}>{I.list} 전체 보기 ({inactiveCampaigns.length}개)</Button>
          )}
        </Card>
      )}

      {/* Campaign List — Accordion */}
      {!loading && !error && displayCampaigns.map((c, i) => (
        <CampaignAccordion key={c.nccCampaignId || i} campaign={c} apiSettings={apiSettings} presets={presets} showToast={showToast} isFirst={i === 0} showAll={showAll} onPresetsChange={savePresets} />
      ))}
    </div>
  );
}
