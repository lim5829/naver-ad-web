// ─── Login (KV 서버 인증) ───
function LoginPage({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력하세요"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${PROXY_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || "로그인 실패");
      }
    } catch (e) {
      setError("서버 연결 실패: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{ width: 76, height: 76, borderRadius: 22, margin: "0 auto 20px", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px ${theme.accentGlow}` }}>{I.naver}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: theme.text, margin: 0 }}>네이버 광고 관리</h1>
        <p style={{ color: theme.textDim, fontSize: 14, marginTop: 8, fontWeight: 500 }}>Naver Search Ad Manager</p>
      </div>
      <Card>
        <InputField icon={I.mail} label="이메일" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
        <InputField icon={I.lock} label="비밀번호" value={password} onChange={setPassword} placeholder="••••••••" showToggle />
        {error && <p style={{ color: theme.danger, fontSize: 13, margin: "0 0 14px", padding: "10px 14px", background: theme.dangerDim, borderRadius: 10, fontWeight: 600 }}>{error}</p>}
        <Button onClick={handleLogin} loading={loading}>로그인</Button>
      </Card>
      <p style={{ textAlign: "center", marginTop: 28, color: theme.textDim, fontSize: 14 }}>계정이 없으신가요? <span onClick={onGoSignup} style={{ color: theme.accent, cursor: "pointer", fontWeight: 700 }}>회원가입</span></p>
    </div>
  );
}

// ─── Signup (KV 서버 인증) ───
function SignupPage({ onSignup, onGoLogin }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  const validate = () => {
    if (!name.trim()) return "이름을 입력하세요";
    if (!email.includes("@")) return "올바른 이메일 형식이 아닙니다";
    if (password.length < 6) return "비밀번호는 6자 이상이어야 합니다";
    if (password !== confirmPw) return "비밀번호가 일치하지 않습니다";
    return null;
  };

  const handleSignup = async () => {
    const err = validate(); if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${PROXY_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onSignup(data.user);
      } else {
        setError(data.error || "가입 실패");
      }
    } catch (e) {
      setError("서버 연결 실패: " + e.message);
    }
    setLoading(false);
  };

  const pwS = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const sC = ["transparent", theme.danger, theme.warning, theme.accent];
  const sL = ["", "약함", "보통", "강함"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 76, height: 76, borderRadius: 22, margin: "0 auto 20px", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px ${theme.accentGlow}` }}>{I.naver}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0 }}>회원가입</h1>
        <p style={{ color: theme.textDim, fontSize: 14, marginTop: 8, fontWeight: 500 }}>새로운 계정을 만들어 보세요</p>
      </div>
      <Card>
        <InputField icon={I.user} label="이름" value={name} onChange={setName} placeholder="홍길동" />
        <InputField icon={I.mail} label="이메일" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
        <InputField icon={I.lock} label="비밀번호" value={password} onChange={setPassword} placeholder="6자 이상 입력" showToggle />
        {password && (
          <div style={{ marginTop: -10, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>{[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwS ? sC[pwS] : theme.border, transition: "all 0.3s" }} />)}</div>
            <span style={{ fontSize: 11, color: sC[pwS], fontWeight: 700 }}>{sL[pwS]}</span>
          </div>
        )}
        <InputField icon={I.lock} label="비밀번호 확인" value={confirmPw} onChange={setConfirmPw} placeholder="비밀번호를 다시 입력" showToggle />
        {error && <p style={{ color: theme.danger, fontSize: 13, margin: "0 0 14px", padding: "10px 14px", background: theme.dangerDim, borderRadius: 10, fontWeight: 600 }}>{error}</p>}
        <Button onClick={handleSignup} loading={loading}>계정 만들기</Button>
      </Card>
      <p style={{ textAlign: "center", marginTop: 28, color: theme.textDim, fontSize: 14 }}>이미 계정이 있으신가요? <span onClick={onGoLogin} style={{ color: theme.accent, cursor: "pointer", fontWeight: 700 }}>로그인</span></p>
    </div>
  );
}
