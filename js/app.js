// ─── App ───
function App() {
  const [page, setPage] = useState("loading");
  const [tab, setTab] = useState("campaigns");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [apiSettings, setApiSettings] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // ─── KV에서 API 설정 로드 ───
  const loadApiSettings = useCallback(async (sessionUser) => {
    // 1. localStorage 먼저 확인
    const localData = localStorage.getItem(`naver-ad-api-settings-${sessionUser.id}`);
    if (localData) {
      setApiSettings(JSON.parse(localData));
      setPage("main");
      return;
    }
    // 2. KV에서 로드
    try {
      const res = await fetch(`${PROXY_BASE}/api/auth/api-settings?email=${encodeURIComponent(sessionUser.email)}`);
      const data = await res.json();
      if (data && data.customerId) {
        localStorage.setItem(`naver-ad-api-settings-${sessionUser.id}`, JSON.stringify(data));
        setApiSettings(data);
        setPage("main");
        return;
      }
    } catch (e) { /* KV 로드 실패 */ }
    // 3. 둘 다 없으면 설정 페이지
    setPage("settings");
  }, []);

  // ─── 자동 로그인 (세션 복원) ───
  useEffect(() => {
    const savedSession = localStorage.getItem("naver-ad-session");
    if (savedSession) {
      try {
        const sessionUser = JSON.parse(savedSession);
        if (sessionUser && sessionUser.email) {
          setUser(sessionUser);
          loadApiSettings(sessionUser);
          return;
        }
      } catch (e) {}
    }
    setPage("login");
  }, []);

  const handleLogin = useCallback((u) => {
    setUser(u);
    localStorage.setItem("naver-ad-session", JSON.stringify(u));
    loadApiSettings(u);
    showToast(`${u.name}님 환영합니다!`);
  }, [showToast, loadApiSettings]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setApiSettings(null);
    localStorage.removeItem("naver-ad-session");
    setPage("login");
    showToast("로그아웃 되었습니다", "info");
  }, [showToast]);

  const handleApiSave = useCallback((s) => {
    setApiSettings(s);
    showToast("API 설정 저장 완료!");
    setTimeout(() => setPage("main"), 600);
  }, [showToast]);

  if (page === "loading") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px ${theme.accentGlow}` }}>{I.naver}</div>
        <div style={{ width: 24, height: 24, border: `3px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: theme.bg, color: theme.text, position: "relative" }}>
      <SoftBG />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ position: "relative", zIndex: 1 }}>
        {page === "login" && <LoginPage onLogin={handleLogin} onGoSignup={() => setPage("signup")} />}
        {page === "signup" && <SignupPage onSignup={handleLogin} onGoLogin={() => setPage("login")} />}
        {page === "settings" && user && <ApiSettingsPage user={user} apiSettings={apiSettings} onLogout={handleLogout} onSave={handleApiSave} onGoCampaigns={() => setPage("main")} showToast={showToast} />}
        {page === "main" && user && apiSettings && tab === "campaigns" && <CampaignsPage user={user} apiSettings={apiSettings} onLogout={handleLogout} showToast={showToast} />}
        {page === "main" && user && apiSettings && tab === "cost" && <CostPage user={user} apiSettings={apiSettings} showToast={showToast} />}
        {page === "main" && user && apiSettings && tab === "settings" && <ApiSettingsPage user={user} apiSettings={apiSettings} onLogout={handleLogout} onSave={(s) => { setApiSettings(s); showToast("API 설정이 저장되었습니다!"); }} onGoCampaigns={() => setTab("campaigns")} showToast={showToast} />}
        {page === "main" && user && apiSettings && <TabBar active={tab} onChange={setTab} />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
