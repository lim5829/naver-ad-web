// ─── Background ───
function SoftBG() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "-25%", right: "-20%", width: "65vw", height: "65vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(3,199,90,0.07) 0%, transparent 65%)", animation: "driftA 22s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-15%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(66,133,244,0.05) 0%, transparent 65%)", animation: "driftB 28s ease-in-out infinite" }} />
      <style>{`
        @keyframes driftA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
        @keyframes driftB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-25px)} }
      `}</style>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const c = type === "success" ? theme.accent : type === "error" ? theme.danger : theme.textDim;
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: theme.surface, color: c, border: `1.5px solid ${c}33`, borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, boxShadow: `0 8px 30px rgba(0,0,0,0.1)`, animation: "popIn 0.3s ease" }}>
      {message}
      <style>{`@keyframes popIn { from{opacity:0;transform:translateX(-50%) translateY(-16px) scale(0.95)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }`}</style>
    </div>
  );
}

function InputField({ icon, label, type = "text", value, onChange, placeholder, showToggle, mono }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const actualType = showToggle ? (showPw ? "text" : "password") : type;
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: theme.textDim, marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: theme.surfaceLight, border: `1.5px solid ${focused ? theme.accent : "transparent"}`, borderRadius: 12, padding: "0 14px", transition: "all 0.2s", boxShadow: focused ? `0 0 0 3px ${theme.accentGlow}` : "none" }}>
        <span style={{ color: focused ? theme.accent : theme.textDim, transition: "color 0.2s", flexShrink: 0 }}>{icon}</span>
        <input type={actualType} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: theme.text, fontSize: 15, padding: "14px 0", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", letterSpacing: mono ? "0.02em" : "normal" }} />
        {showToggle && <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}>{showPw ? I.eyeOff : I.eye}</button>}
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", loading, disabled, style: s }) {
  const base = { width: "100%", padding: "15px 24px", borderRadius: 14, border: "none", fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: disabled ? 0.45 : 1, fontWeight: 700 };
  const v = {
    primary: { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, color: "#fff", boxShadow: `0 4px 16px ${theme.accentGlow}` },
    secondary: { background: theme.surfaceLight, color: theme.text, border: `1.5px solid ${theme.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ ...base, ...v[variant], ...s }}>
      {loading ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  );
}

function Card({ children, style }) {
  return <div style={{ background: theme.surface, borderRadius: 18, border: `1px solid ${theme.border}`, padding: 24, boxShadow: theme.cardShadow, ...style }}>{children}</div>;
}

function StatusBadge({ status }) {
  const map = {
    ELIGIBLE: { label: "활성", color: theme.accent, bg: theme.accentDim },
    PAUSED: { label: "일시중지", color: theme.warning, bg: theme.warningDim },
    OFF: { label: "중지", color: theme.danger, bg: theme.dangerDim },
    PENDING: { label: "대기", color: theme.blue, bg: theme.blueDim },
    DELETED: { label: "삭제됨", color: theme.textDim, bg: theme.surfaceLight },
  };
  const s = map[status] || map.OFF;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const labels = { WEB_SITE: "파워링크", SHOPPING: "쇼핑검색", BRAND_SEARCH: "브랜드검색", POWER_CONTENTS: "파워컨텐츠", CATALOG: "카탈로그", PERFORMANCE_MAX: "퍼포먼스 맥스" };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: theme.textDim, background: theme.surfaceLight, padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {labels[type] || type}
    </span>
  );
}

