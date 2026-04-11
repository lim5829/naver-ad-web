// ─── 관리자 ID (하드코딩 또는 첫 가입자) ───
const ADMIN_ID = "lim5829";

function isAdmin(user) {
  return user && (user.email === ADMIN_ID || user.email === ADMIN_ID + "@naver.com" || user.id === 1 || user.isAdmin);
}

// ─── 회원 관리 ───
function UserManagementPanel({ showToast }) {
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${PROXY_BASE}/api/auth/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { setUsers([]); }
    setLoadingUsers(false);
  };

  useEffect(() => { if (expanded) loadUsers(); }, [expanded]);

  const deleteUser = async (email) => {
    if (!confirm("이 회원을 삭제하시겠습니까?")) return;
    try {
      await fetch(`${PROXY_BASE}/api/auth/user/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setUsers(users.filter(u => u.email !== email));
      showToast("회원이 삭제되었습니다");
    } catch (e) { showToast("삭제 실패", "error"); }
  };

  const resetPassword = async (email) => {
    const newPw = prompt("새 비밀번호를 입력하세요 (6자 이상):");
    if (!newPw || newPw.length < 6) { showToast("비밀번호는 6자 이상이어야 합니다", "error"); return; }
    try {
      await fetch(`${PROXY_BASE}/api/auth/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPw }),
      });
      showToast("비밀번호가 변경되었습니다");
    } catch (e) { showToast("변경 실패", "error"); }
  };

  const toggleAdmin = async (email, currentAdmin) => {
    try {
      await fetch(`${PROXY_BASE}/api/auth/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isAdmin: !currentAdmin }),
      });
      setUsers(users.map(u => u.email === email ? { ...u, isAdmin: !currentAdmin } : u));
      showToast("권한이 변경되었습니다");
    } catch (e) { showToast("변경 실패", "error"); }
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,"0")}.${String(dt.getDate()).padStart(2,"0")}`;
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "none", border: "none", cursor: "pointer", padding: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: theme.accent }}>{I.user}</span>
          회원 관리
          <span style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{users.length}명</span>
        </div>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={theme.textDim} strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          {loadingUsers && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <span style={{ width: 20, height: 20, border: `2.5px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}
          {!loadingUsers && users.length === 0 && (
            <div style={{ textAlign: "center", padding: 16, color: theme.textDim, fontSize: 13 }}>등록된 회원이 없습니다</div>
          )}
          {!loadingUsers && users.map((u, idx) => {
            return (
              <div key={u.email} style={{
                padding: "12px 14px", background: theme.surfaceLight, borderRadius: 12,
                marginBottom: idx < users.length - 1 ? 8 : 0,
                border: `1px solid ${theme.border}`,
              }}>
                {/* 유저 정보 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                      {u.name}
                      {isAdmin(u) && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: theme.accent, background: theme.accentDim, padding: "1px 6px", borderRadius: 6 }}>관리자</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textDim, marginTop: 2 }}>{u.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: theme.textDim }}>{fmtDate(u.createdAt)}</span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => resetPassword(u.email)} style={{
                    flex: 1, padding: "6px 0", borderRadius: 8, border: `1px solid ${theme.border}`,
                    background: theme.surface, fontSize: 11, fontWeight: 600, color: theme.text,
                    cursor: "pointer",
                  }}>비밀번호 변경</button>
                  <button onClick={() => toggleAdmin(u.email, u.isAdmin)} style={{
                    flex: 1, padding: "6px 0", borderRadius: 8, border: `1px solid ${theme.border}`,
                    background: u.isAdmin ? theme.accentDim : theme.surface,
                    fontSize: 11, fontWeight: 600, color: u.isAdmin ? theme.accent : theme.text,
                    cursor: "pointer",
                  }}>{u.isAdmin ? "관리자 해제" : "관리자 지정"}</button>
                  <button onClick={() => deleteUser(u.email)} style={{
                    padding: "6px 10px", borderRadius: 8, border: `1px solid ${theme.danger}22`,
                    background: theme.dangerDim, fontSize: 11, fontWeight: 600, color: theme.danger,
                    cursor: "pointer",
                  }}>삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── API Settings ───
function ApiSettingsPage({ user, onLogout, onSave, onGoCampaigns, apiSettings, showToast }) {
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
    const settings = { customerId, apiKey, secretKey, managerLoginId, savedAt: new Date().toISOString() };
    // localStorage + KV 동시 저장
    localStorage.setItem(`naver-ad-api-settings-${user.id}`, JSON.stringify(settings));
    try {
      await fetch(`${PROXY_BASE}/api/auth/api-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, settings }),
      });
    } catch (e) { /* KV 저장 실패해도 localStorage는 저장됨 */ }
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

  const admin = isAdmin(user);

  return (
    <div style={{ minHeight: "100vh", padding: "0 20px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", position: "sticky", top: 0, zIndex: 10, background: theme.bg + "ee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 12px ${theme.accentGlow}` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M16.27 3H7.73A4.73 4.73 0 0 0 3 7.73v8.54A4.73 4.73 0 0 0 7.73 21h8.54A4.73 4.73 0 0 0 21 16.27V7.73A4.73 4.73 0 0 0 16.27 3zm-2.1 12.27h-2.4l-2.6-3.6v3.6H6.97V8.73h2.4l2.6 3.56V8.73h2.2v6.54z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
              {user.name}
              {admin && <span style={{ fontSize: 9, fontWeight: 700, color: theme.accent, background: theme.accentDim, padding: "2px 8px", borderRadius: 8 }}>관리자</span>}
            </div>
            <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 500 }}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: 12, padding: "8px 16px", color: theme.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, boxShadow: theme.cardShadow }}>{I.logout} <span>로그아웃</span></button>
      </div>

      <div style={{ margin: "8px 0 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0, display: "flex", alignItems: "center", gap: 10 }}><span style={{ color: theme.accent }}>{I.settings}</span><span>설정</span></h1>
        <p style={{ color: theme.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.5, fontWeight: 500 }}>API 인증 정보 및 계정 관리</p>
      </div>

      {/* 보안 안내 */}
      <Card style={{ marginBottom: 20, padding: 16, background: `linear-gradient(135deg, ${theme.accentDim}, rgba(3,199,90,0.03))`, border: `1px solid ${theme.accent}18` }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {I.shield}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.accentDark, marginBottom: 4 }}>보안 안내</div>
            <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.6, fontWeight: 500 }}>API 키는 프록시 서버를 통해 안전하게 전송됩니다.</div>
          </div>
        </div>
      </Card>

      {/* API 인증 정보 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: theme.accent }}>{I.server}</span><span>인증 정보</span>
          {saved && <span style={{ marginLeft: "auto", fontSize: 11, color: theme.accent, fontWeight: 700, background: theme.accentDim, padding: "4px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>{I.check} 저장됨</span>}
        </div>
        <InputField icon={I.user} label="CUSTOMER ID" value={customerId} onChange={v => { setCustomerId(v); setSaved(false); }} placeholder="네이버 광고 고객 ID" mono />
        <InputField icon={I.key} label="API KEY" value={apiKey} onChange={v => { setApiKey(v); setSaved(false); }} placeholder="API 액세스 키" mono />
        <InputField icon={I.lock} label="SECRET KEY" value={secretKey} onChange={v => { setSecretKey(v); setSaved(false); }} placeholder="API 시크릿 키" showToggle mono />
      </Card>

      {/* 테스트 결과 */}
      {testResult && (
        <Card style={{ marginBottom: 16, padding: 16, background: testResult.success ? theme.accentDim : theme.dangerDim, border: `1.5px solid ${testResult.success ? theme.accent : theme.danger}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: testResult.success ? theme.accent : theme.danger }}>{testResult.success ? I.check : "⚠️"}</span>
            <span style={{ fontSize: 13, color: testResult.success ? theme.accentDark : theme.danger, fontWeight: 700 }}>{testResult.message}</span>
          </div>
        </Card>
      )}

      {/* 버튼 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <Button onClick={handleSave} loading={loading} disabled={!customerId || !apiKey || !secretKey}>{I.check} 설정 저장</Button>
        <Button onClick={handleTest} variant="secondary" loading={loading} disabled={!customerId || !apiKey || !secretKey}>{I.server} API 연결 테스트</Button>
      </div>

      {/* 관리자 전용: 회원 관리 */}
      {admin && <UserManagementPanel showToast={showToast} />}

      {/* 앱 정보 */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: theme.accent }}>ℹ️</span> 앱 정보
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: theme.textDim }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600 }}>버전</span><span>1.2.0</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600 }}>계정</span><span>{user.email}</span>
          </div>
          {admin && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>프록시</span><span style={{ fontSize: 10, fontFamily: "monospace" }}>{PROXY_BASE}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
