// ─── App ───
function App() {
  const [page, setPage] = useState("loading");
  const [tab, setTab] = useState("campaigns");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [apiSettings, setApiSettings] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // ─── 자동 로그인 ───
  useEffect(() => {
    const savedSession = localStorage.getItem("naver-ad-session");
    if (savedSession) {
      try {
        const sessionUser = JSON.parse(savedSession);
        const users = JSON.parse(localStorage.getItem("naver-ad-users") || "[]");
        const valid = users.find(u => u.id === sessionUser.id && u.email === sessionUser.email);
        if (valid) {
          setUser(valid);
          const apiData = localStorage.getItem(`naver-ad-api-settings-${valid.id}`);
          if (apiData) {
            setApiSettings(JSON.parse(apiData));
            setPage("main");
          } else {
            setPage("settings");
          }
          return;
        }
      } catch (e) {}
    }
    setPage("login");
  }, []);

  const handleLogin = useCallback((u) => {
    setUser(u);
    localStorage.setItem("naver-ad-session", JSON.stringify({ id: u.id, email: u.email }));
    const apiData = localStorage.getItem(`naver-ad-api-settings-${u.id}`);
    if (apiData) {
      setApiSettings(JSON.parse(apiData));
      setPage("main");
    } else {
      setPage("settings");
    }
    showToast(`${u.name}님 환영합니다!`);
  }, [showToast]);

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
        {page === "settings" && user && <ApiSettingsPage user={user} apiSettings={apiSettings} onLogout={handleLogout} onSave={handleApiSave} onGoCampaigns={() => setPage("main")} />}
        {page === "main" && user && apiSettings && tab === "campaigns" && <CampaignsPage user={user} apiSettings={apiSettings} onLogout={handleLogout} showToast={showToast} />}
        {page === "main" && user && apiSettings && tab === "rank" && <RankPage user={user} apiSettings={apiSettings} showToast={showToast} />}
        {page === "main" && user && apiSettings && tab === "cost" && <CostPage user={user} apiSettings={apiSettings} showToast={showToast} />}
        {page === "main" && user && apiSettings && tab === "settings" && <ApiSettingsPage user={user} apiSettings={apiSettings} onLogout={handleLogout} onSave={(s) => { setApiSettings(s); showToast("API 설정이 저장되었습니다!"); }} onGoCampaigns={() => setTab("campaigns")} />}
        {page === "main" && user && apiSettings && <TabBar active={tab} onChange={setTab} />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
