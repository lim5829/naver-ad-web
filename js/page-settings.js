// ─── API Settings ───
function ApiSettingsPage({ user, onLogout, onSave, onGoCampaigns, apiSettings }) {
  const [customerId, setCustomerId] = useState(apiSettings?.customerId || "");
  const [apiKey, setApiKey] = useState(apiSettings?.apiKey || "");
  const [secretKey, setSecretKey] = useState(apiSettings?.secretKey || "");
  const [managerLoginId, setManagerLoginId] = useState(apiSettings?.managerLoginId || "");
  const [saved, setSaved] = useState(!!apiSettings?.customerId);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = async () => {
    if (!customerId || !apiKey || !secretKey) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const settings = { customerId, apiKey, secretKey, managerLoginId, savedAt: new Date().toISOString() };
    localStorage.setItem(`naver-ad-api-settings-${user.id}`, JSON.stringify(settings));
    setSaved(true); setLoading(false); onSave?.(settings);
  };

  const handleTest = async () => {
    setTestResult(null); setLoading(true);
    try {
      const result = await naverApiFetch({ method: "POST", path: "/api/test-connection", customerId, apiKey, secretKey, managerLoginId });
      setTestResult({ success: true, message: `API 연결 성공! 캠페인 ${result.campaignCount || 0}개 확인` });
    } catch (e) {
      setTestResult({ success: false, message: `연결 실패: ${e.message}` });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "0 20px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", position: "sticky", top: 0, zIndex: 10, background: `linear-gradient(${theme.bg}, ${theme.bg}ee)`, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 12px ${theme.accentGlow}` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{user.name}</div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 12, padding: "8px 16px", color: theme.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, boxShadow: theme.cardShadow }}>{I.logout} <span>로그아웃</span></button>
      </div>

      <div style={{ margin: "8px 0 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0, display: "flex", alignItems: "center", gap: 10 }}><span style={{ color: theme.accent }}>{I.settings}</span><span>API 설정</span></h1>
        <p style={{ color: theme.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.5, fontWeight: 500 }}>네이버 검색광고 API 인증 정보를 설정하세요</p>
      </div>

      <Card style={{ marginBottom: 20, padding: 16, background: `linear-gradient(135deg, ${theme.accentDim}, rgba(3,199,90,0.03))`, border: `1px solid ${theme.accent}18` }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {I.shield}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.accentDark, marginBottom: 4 }}>보안 안내</div>
            <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.6, fontWeight: 500 }}>API 키는 프록시 서버를 통해 안전하게 전송됩니다.</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: theme.accent }}>{I.server}</span><span>인증 정보</span>
          {saved && <span style={{ marginLeft: "auto", fontSize: 11, color: theme.accent, fontWeight: 700, background: theme.accentDim, padding: "4px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>{I.check} 저장됨</span>}
        </div>
        <InputField icon={I.user} label="CUSTOMER ID" value={customerId} onChange={v => { setCustomerId(v); setSaved(false); }} placeholder="네이버 광고 고객 ID" mono />
        <InputField icon={I.key} label="API KEY" value={apiKey} onChange={v => { setApiKey(v); setSaved(false); }} placeholder="API 액세스 키" mono />
        <InputField icon={I.lock} label="SECRET KEY" value={secretKey} onChange={v => { setSecretKey(v); setSaved(false); }} placeholder="API 시크릿 키" showToggle mono />
        <InputField icon={I.mail} label="MANAGER LOGIN ID (선택)" value={managerLoginId} onChange={v => { setManagerLoginId(v); setSaved(false); }} placeholder="위탁 관리 시 입력" mono />
      </Card>

      {testResult && (
        <Card style={{ marginBottom: 16, padding: 16, background: testResult.success ? theme.accentDim : theme.dangerDim, border: `1.5px solid ${testResult.success ? theme.accent : theme.danger}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: testResult.success ? theme.accent : theme.danger }}>{testResult.success ? I.check : "⚠️"}</span>
            <span style={{ fontSize: 13, color: testResult.success ? theme.accentDark : theme.danger, fontWeight: 700 }}>{testResult.message}</span>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button onClick={handleSave} loading={loading} disabled={!customerId || !apiKey || !secretKey}>{I.check} 설정 저장</Button>
        <Button onClick={handleTest} variant="secondary" loading={loading} disabled={!customerId || !apiKey || !secretKey}>{I.server} API 연결 테스트</Button>
        {saved && <Button onClick={onGoCampaigns} variant="secondary">{I.campaign} 캠페인 관리</Button>}
      </div>
    </div>
  );
}
