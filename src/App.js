import { useState, useEffect, useRef, useCallback } from "react";

// ── API base URL
const API = "http://localhost:5000/api";

// ── Token helpers
const getToken  = () => localStorage.getItem("edupath_token");
const setToken  = (t) => localStorage.setItem("edupath_token", t);
const clearToken = () => { localStorage.removeItem("edupath_token"); localStorage.removeItem("edupath_user"); };
const getUser   = () => { try { return JSON.parse(localStorage.getItem("edupath_user")); } catch { return null; } };
const setUser   = (u) => localStorage.setItem("edupath_user", JSON.stringify(u));

// ── Auth fetch helper
const authFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
  });
  return res.json();
};

// ── CSS Variables & Global Styles
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
    :root {
      --blue: #1a73e8; --blue-dark: #1558b0; --blue-light: #e8f0fe;
      --blue-mid: #4a90d9; --sidebar-bg: #ffffff; --main-bg: #f0f4f9;
      --card-bg: #ffffff; --text: #202124; --muted: #5f6368;
      --border: #e0e0e0; --green: #34a853; --orange: #ea8600; --red: #d93025;
    }
    body.dark {
      --sidebar-bg: #1e2027; --main-bg: #13151a; --card-bg: #1e2027;
      --text: #e8eaed; --muted: #9aa0a6; --border: #3c4043; --blue-light: #1a2a4a;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Nunito',sans-serif; background:var(--main-bg); color:var(--text); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    .fadeUp { animation: fadeUp 0.4s ease both; }
    .fadeIn { animation: fadeIn 0.3s ease both; }
    .typing-dot { display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--muted);margin:0 2px;animation:bounce 1s infinite; }
    .typing-dot:nth-child(2){animation-delay:0.15s}
    .typing-dot:nth-child(3){animation-delay:0.3s}
    code { background:rgba(26,115,232,0.12);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.78rem; }
    input:focus { outline:none; border-color:var(--blue) !important; box-shadow:0 0 0 3px rgba(26,115,232,0.12); }
    .skeleton { background:linear-gradient(90deg,var(--border) 25%,var(--main-bg) 50%,var(--border) 75%);background-size:400px 100%;animation:shimmer 1.4s infinite linear;border-radius:8px; }
    ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
  `}</style>
);

// ══════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", domain: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const domains = ["Web Dev", "AI / ML", "DSA", "Data Science", "DevOps", "Android"];

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required."); return; }
    if (mode === "register" && !form.name) { setError("Name is required."); return; }
    if (mode === "register" && form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "register" && !/\d/.test(form.password)) { setError("Password must contain a number."); return; }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, domain: form.domain };
      const res = await fetch(`${API}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.error || data.errors?.[0]?.message || "Something went wrong."); }
      else { setToken(data.token); setUser(data.user); onAuth(data.user); }
    } catch { setError("Cannot connect to server. Make sure backend is running on port 5000."); }
    setLoading(false);
  };

  const inp = (field, placeholder, type = "text") => (
    <input type={type} placeholder={placeholder} value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      onKeyPress={e => e.key === "Enter" && handleSubmit()}
      style={{ width:"100%", padding:"13px 16px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.88rem", background:"var(--main-bg)", color:"var(--text)", transition:"all 0.2s" }} />
  );

  return (
    <div className="fadeIn" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4f9 0%,#e8f0fe 100%)" }}>
      <GlobalStyles />
      <div style={{ width:"100%", maxWidth:420, padding:"0 20px" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:60, height:60, background:"var(--blue)", borderRadius:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", boxShadow:"0 8px 24px rgba(26,115,232,0.3)", marginBottom:16 }}>🎓</div>
          <div style={{ fontSize:"1.8rem", fontWeight:800, color:"var(--blue)", letterSpacing:"-0.5px" }}>EduPath</div>
          <div style={{ fontSize:"0.82rem", color:"var(--muted)", marginTop:4, fontWeight:600 }}>Your personalized learning dashboard</div>
        </div>
        <div style={{ background:"white", borderRadius:18, padding:"32px 28px", boxShadow:"0 8px 32px rgba(0,0,0,0.08)", border:"1px solid var(--border)" }}>
          <div style={{ display:"flex", background:"var(--main-bg)", borderRadius:10, padding:4, marginBottom:24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex:1, padding:"10px", border:"none", borderRadius:8, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", transition:"all 0.2s", background:mode===m?"white":"transparent", color:mode===m?"var(--blue)":"var(--muted)", boxShadow:mode===m?"0 2px 8px rgba(0,0,0,0.08)":"none" }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          {error && <div style={{ background:"#fce8e6", border:"1px solid #f5c6c3", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:"0.8rem", color:"#d93025", fontWeight:600 }}>⚠️ {error}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode === "register" && inp("name", "Your full name")}
            {inp("email", "Email address", "email")}
            {inp("password", "Password (min 6 chars, include a number)", "password")}
            {mode === "register" && (
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                style={{ width:"100%", padding:"13px 16px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.88rem", background:"var(--main-bg)", color:form.domain?"var(--text)":"var(--muted)", cursor:"pointer" }}>
                <option value="">Select your learning domain (optional)</option>
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginTop:20, padding:"14px", background:loading?"var(--muted)":"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.95rem", cursor:loading?"not-allowed":"pointer", boxShadow:loading?"none":"0 4px 16px rgba(26,115,232,0.3)", transition:"all 0.2s" }}>
            {loading ? "⏳ Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
          {mode === "login" && (
            <div style={{ textAlign:"center", marginTop:16, fontSize:"0.75rem", color:"var(--muted)", fontWeight:600 }}>
              Don't have an account?{" "}
              <span onClick={() => { setMode("register"); setError(""); }} style={{ color:"var(--blue)", cursor:"pointer", fontWeight:700 }}>Sign up free</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ONBOARDING FLOW — shown once after register
// Steps: Welcome → Domain → Goals → First Task → Done
// ══════════════════════════════════════════
function OnboardingPage({ user, onComplete }) {
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    domain:   user?.domain || "",
    goals:    [],
    taskTitle:"",
    taskPriority:"medium",
  });

  const TOTAL_STEPS = 4;

  const DOMAINS = [
    { value:"Web Dev",      icon:"🌐", desc:"HTML, CSS, JS, React, Node" },
    { value:"AI / ML",      icon:"🤖", desc:"Python, TensorFlow, ML models" },
    { value:"DSA",          icon:"🧮", desc:"Algorithms, Data Structures" },
    { value:"Data Science", icon:"📊", desc:"Pandas, NumPy, Visualization" },
    { value:"DevOps",       icon:"⚙️", desc:"Docker, CI/CD, Cloud" },
    { value:"Android",      icon:"📱", desc:"Kotlin, Jetpack, Android SDK" },
  ];

  const GOAL_OPTIONS = [
    { value:"get_job",      icon:"💼", label:"Land a tech job" },
    { value:"freelance",    icon:"💰", label:"Start freelancing" },
    { value:"upskill",      icon:"📈", label:"Upskill at current job" },
    { value:"switch",       icon:"🔄", label:"Switch to tech" },
    { value:"college",      icon:"🎓", label:"Ace college exams" },
    { value:"hobby",        icon:"🎮", label:"Learn as a hobby" },
  ];

  const TASK_SUGGESTIONS = {
    "Web Dev":      ["Complete HTML & CSS basics", "Build a personal portfolio page", "Watch JavaScript crash course"],
    "AI / ML":      ["Set up Python environment", "Complete NumPy tutorial", "Run first ML model"],
    "DSA":          ["Solve 2 easy LeetCode problems", "Study arrays & strings", "Read Big-O notation guide"],
    "Data Science": ["Install Jupyter Notebook", "Load first dataset with Pandas", "Complete data visualization tutorial"],
    "DevOps":       ["Install Docker Desktop", "Follow Linux basics tutorial", "Set up a Git repository"],
    "Android":      ["Set up Android Studio", "Build Hello World app", "Learn Kotlin basics"],
  };

  const toggleGoal = (v) => setForm(f => ({
    ...f,
    goals: f.goals.includes(v) ? f.goals.filter(g => g !== v) : [...f.goals, v],
  }));

  const saveAndFinish = async () => {
    setSaving(true);
    // Save profile (domain + goals as avatar string hack — goals stored client-side)
    await authFetch("/users/profile", {
      method: "PUT",
      body: JSON.stringify({ domain: form.domain }),
    }).catch(() => {});

    // Save first task if provided
    if (form.taskTitle.trim()) {
      await authFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title: form.taskTitle.trim(), priority: form.taskPriority, category:"study" }),
      }).catch(() => {});
    }

    // Update streak on first day
    await authFetch("/users/streak/update", { method:"POST" }).catch(() => {});

    setSaving(false);
    onComplete({ ...user, domain: form.domain });
  };

  // Progress bar width
  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  // Shared card wrapper
  const Card = ({ children }) => (
    <div className="fadeIn" style={{
      background:"white", borderRadius:20, padding:"36px 32px",
      boxShadow:"0 12px 40px rgba(0,0,0,0.10)", border:"1px solid var(--border)",
      width:"100%", maxWidth:520,
    }}>
      {/* Progress bar */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontSize:"0.68rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px" }}>
            STEP {step + 1} OF {TOTAL_STEPS}
          </div>
          <div style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--blue)" }}>{Math.round(progress)}% complete</div>
        </div>
        <div style={{ height:6, background:"var(--blue-light)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,var(--blue),var(--blue-mid))", borderRadius:99, transition:"width 0.5s ease" }} />
        </div>
        {/* Step dots */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          {Array.from({ length:TOTAL_STEPS }).map((_,i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:i<=step?"var(--blue)":"var(--border)", transition:"background 0.3s" }} />
          ))}
        </div>
      </div>
      {children}
    </div>
  );

  // ── STEP 0: Welcome
  if (step === 0) return (
    <div className="fadeIn" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4f9 0%,#e8f0fe 100%)", padding:"20px" }}>
      <GlobalStyles />
      <Card>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:"3.5rem", marginBottom:12, animation:"fadeUp 0.5s ease both" }}>🎉</div>
          <div style={{ fontSize:"1.6rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.5px", marginBottom:8 }}>
            Welcome to EduPath, {user?.name?.split(" ")[0]}!
          </div>
          <div style={{ fontSize:"0.85rem", color:"var(--muted)", lineHeight:1.7 }}>
            Your account is ready. Let's take 60 seconds to personalise your learning experience so we can give you the best roadmap.
          </div>
        </div>
        {/* What you'll get */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
          {[
            { icon:"🗺️", text:"A personalised roadmap for your domain" },
            { icon:"✅", text:"Your first learning task, ready to go" },
            { icon:"🔥", text:"Day 1 of your study streak starts now" },
            { icon:"🤖", text:"AI Tutor available 24/7 for doubts" },
          ].map(item => (
            <div key={item.text} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"var(--blue-light)", borderRadius:10 }}>
              <span style={{ fontSize:"1.1rem" }}>{item.icon}</span>
              <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--blue)" }}>{item.text}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(1)} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.95rem", cursor:"pointer", boxShadow:"0 4px 16px rgba(26,115,232,0.3)", transition:"all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.transform="translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform=""}>
          Let's get started →
        </button>
      </Card>
    </div>
  );

  // ── STEP 1: Pick Domain
  if (step === 1) return (
    <div className="fadeIn" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4f9 0%,#e8f0fe 100%)", padding:"20px" }}>
      <GlobalStyles />
      <Card>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:6 }}>🗺️ What are you learning?</div>
          <div style={{ fontSize:"0.82rem", color:"var(--muted)" }}>Pick your primary learning domain. You can change this later in Settings.</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
          {DOMAINS.map(d => (
            <div key={d.value} onClick={() => setForm(f => ({ ...f, domain:d.value }))}
              style={{ padding:"14px 16px", borderRadius:12, border:`2px solid ${form.domain===d.value?"var(--blue)":"var(--border)"}`, background:form.domain===d.value?"var(--blue-light)":"white", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:10 }}
              onMouseEnter={e => { if(form.domain!==d.value) e.currentTarget.style.borderColor="var(--blue-mid)"; }}
              onMouseLeave={e => { if(form.domain!==d.value) e.currentTarget.style.borderColor="var(--border)"; }}>
              <span style={{ fontSize:"1.4rem" }}>{d.icon}</span>
              <div>
                <div style={{ fontSize:"0.8rem", fontWeight:800, color:form.domain===d.value?"var(--blue)":"var(--text)" }}>{d.value}</div>
                <div style={{ fontSize:"0.62rem", color:"var(--muted)", marginTop:1 }}>{d.desc}</div>
              </div>
              {form.domain === d.value && (
                <div style={{ marginLeft:"auto", width:18, height:18, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.6rem", flexShrink:0 }}>✓</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setStep(0)} style={{ flex:1, padding:"13px", background:"var(--main-bg)", color:"var(--muted)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>← Back</button>
          <button onClick={() => setStep(2)} disabled={!form.domain}
            style={{ flex:2, padding:"13px", background:form.domain?"linear-gradient(135deg,var(--blue),var(--blue-dark))":"var(--border)", color:"white", border:"none", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:form.domain?"pointer":"not-allowed", boxShadow:form.domain?"0 4px 16px rgba(26,115,232,0.3)":"none", transition:"all 0.2s" }}>
            Continue →
          </button>
        </div>
      </Card>
    </div>
  );

  // ── STEP 2: Goals
  if (step === 2) return (
    <div className="fadeIn" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4f9 0%,#e8f0fe 100%)", padding:"20px" }}>
      <GlobalStyles />
      <Card>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:6 }}>🎯 What's your goal?</div>
          <div style={{ fontSize:"0.82rem", color:"var(--muted)" }}>Select all that apply — this helps us tailor your content.</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
          {GOAL_OPTIONS.map(g => {
            const selected = form.goals.includes(g.value);
            return (
              <div key={g.value} onClick={() => toggleGoal(g.value)}
                style={{ padding:"14px 16px", borderRadius:12, border:`2px solid ${selected?"var(--blue)":"var(--border)"}`, background:selected?"var(--blue-light)":"white", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:10 }}
                onMouseEnter={e => { if(!selected) e.currentTarget.style.borderColor="var(--blue-mid)"; }}
                onMouseLeave={e => { if(!selected) e.currentTarget.style.borderColor="var(--border)"; }}>
                <span style={{ fontSize:"1.2rem" }}>{g.icon}</span>
                <span style={{ fontSize:"0.78rem", fontWeight:700, color:selected?"var(--blue)":"var(--text)" }}>{g.label}</span>
                {selected && (
                  <div style={{ marginLeft:"auto", width:16, height:16, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.58rem", flexShrink:0 }}>✓</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setStep(1)} style={{ flex:1, padding:"13px", background:"var(--main-bg)", color:"var(--muted)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>← Back</button>
          <button onClick={() => setStep(3)}
            style={{ flex:2, padding:"13px", background:"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:"pointer", boxShadow:"0 4px 16px rgba(26,115,232,0.3)" }}>
            {form.goals.length === 0 ? "Skip →" : "Continue →"}
          </button>
        </div>
      </Card>
    </div>
  );

  // ── STEP 3: First Task
  if (step === 3) return (
    <div className="fadeIn" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4f9 0%,#e8f0fe 100%)", padding:"20px" }}>
      <GlobalStyles />
      <Card>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:6 }}>✅ Add your first task</div>
          <div style={{ fontSize:"0.82rem", color:"var(--muted)" }}>Start your learning journey with one concrete action. Pick a suggestion or write your own.</div>
        </div>
        {/* Suggestions */}
        {form.domain && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:"0.7rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>SUGGESTIONS FOR {form.domain.toUpperCase()}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {(TASK_SUGGESTIONS[form.domain] || []).map(s => (
                <div key={s} onClick={() => setForm(f => ({ ...f, taskTitle:s }))}
                  style={{ padding:"10px 14px", borderRadius:10, border:`1.5px solid ${form.taskTitle===s?"var(--blue)":"var(--border)"}`, background:form.taskTitle===s?"var(--blue-light)":"var(--main-bg)", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, color:form.taskTitle===s?"var(--blue)":"var(--text)", transition:"all 0.15s", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:"0.7rem" }}>💡</span> {s}
                  {form.taskTitle===s && <span style={{ marginLeft:"auto", fontSize:"0.8rem" }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Custom task input */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:"0.7rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>OR WRITE YOUR OWN</div>
          <input value={form.taskTitle} onChange={e => setForm(f => ({ ...f, taskTitle:e.target.value }))}
            placeholder="e.g. Complete React tutorial chapter 1"
            style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.83rem", background:"var(--main-bg)", color:"var(--text)" }} />
        </div>
        {/* Priority */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"0.7rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>PRIORITY</div>
          <div style={{ display:"flex", gap:8 }}>
            {[{ v:"low", label:"🟢 Low" },{ v:"medium", label:"🟡 Medium" },{ v:"high", label:"🔴 High" }].map(p => (
              <button key={p.v} onClick={() => setForm(f => ({ ...f, taskPriority:p.v }))}
                style={{ flex:1, padding:"9px", border:`1.5px solid ${form.taskPriority===p.v?"var(--blue)":"var(--border)"}`, borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.75rem", cursor:"pointer", background:form.taskPriority===p.v?"var(--blue-light)":"white", color:form.taskPriority===p.v?"var(--blue)":"var(--muted)", transition:"all 0.15s" }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setStep(2)} style={{ flex:1, padding:"13px", background:"var(--main-bg)", color:"var(--muted)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>← Back</button>
          <button onClick={saveAndFinish} disabled={saving}
            style={{ flex:2, padding:"13px", background:saving?"var(--muted)":"linear-gradient(135deg,var(--green),#2d9248)", color:"white", border:"none", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:saving?"not-allowed":"pointer", boxShadow:saving?"none":"0 4px 16px rgba(52,168,83,0.35)", transition:"all 0.2s" }}>
            {saving ? "Setting up…" : form.taskTitle.trim() ? "🚀 Launch EduPath!" : "Skip & Launch →"}
          </button>
        </div>
      </Card>
    </div>
  );

  return null;
}

// ── Static data (fallbacks / non-API pages)
const NAV_ITEMS = [
  { icon:"🏠", label:"Dashboard",      page:"dashboard" },
  { icon:"🗺️", label:"Roadmap Finder",  page:"roadmap" },
  { icon:"📚", label:"Resources",      page:"resources" },
  { icon:"💼", label:"Placement Prep", page:"placement" },
  { icon:"🤔", label:"Approach Q's",   page:"approach" },
  { icon:"🛠️", label:"Projects",       page:"projects" },
  null,
  { icon:"👥", label:"Community",      page:"community" },
  { icon:"📊", label:"My Progress",    page:"myprogress" },
  { icon:"✅", label:"Tasks",          page:"tasks" },
  { icon:"🤖", label:"AI Tutor",       page:"aitutor" },
  null,
  { icon:"⚙️", label:"Settings",       page:"settings" },
  { icon:"👤", label:"My Profile",     page:"profile" },
  { icon:"❓", label:"Help Center",    page:"help" },
  { icon:"🚪", label:"Log Out",        page:"logout" },
];

const FEATURES = [
  { icon:"🗺️", name:"Roadmap Finder",   desc:"Find your personalized learning path by domain",     count:"8 Domains",      blue:true, goto:"roadmap" },
  { icon:"📚", name:"Resources",         desc:"Videos, articles, books & courses curated for you", count:"200+ Resources",  goto:"resources" },
  { icon:"💼", name:"Placement Prep",    desc:"DSA, System Design, HR & Mock Interviews",           count:"500+ Questions",  goto:"placement" },
  { icon:"🤔", name:"Approach Q's",      desc:"Learn HOW to think and solve any problem",           count:"12 Approaches",   goto:"approach" },
  { icon:"🛠️", name:"Project Hub",       desc:"Build real projects step-by-step with guidance",     count:"50+ Projects",    goto:"projects" },
  { icon:"🤖", name:"AI Tutor",          desc:"24/7 doubt solver — ask anything, anytime",          count:"Always On",       goto:"aitutor" },
];

const APPROACHES = [
  { icon:"🔁", name:"Two Pointers",       desc:"Array problems with O(n)",        count:"12 Problems" },
  { icon:"🪟", name:"Sliding Window",     desc:"Subarray/substring problems",     count:"10 Problems" },
  { icon:"💰", name:"Greedy",             desc:"Optimal local choices",           count:"15 Problems" },
  { icon:"📐", name:"Divide & Conquer",   desc:"Split and solve recursively",     count:"8 Problems" },
  { icon:"🧮", name:"Dynamic Programming",desc:"Overlapping subproblems",         count:"20 Problems" },
  { icon:"🌲", name:"Backtracking",       desc:"Explore all possibilities",       count:"14 Problems" },
  { icon:"📊", name:"Binary Search",      desc:"Search in sorted space",          count:"11 Problems" },
  { icon:"🔗", name:"Graph BFS/DFS",      desc:"Traversal problems",              count:"16 Problems" },
  { icon:"📚", name:"Stack & Queue",      desc:"LIFO/FIFO patterns",             count:"9 Problems" },
];

const PROJECTS = [
  { icon:"🌐", name:"Portfolio Website", tech:"HTML / CSS / JS",   level:"Beginner",     diff:"Easy" },
  { icon:"📝", name:"Todo App with React",tech:"React.js",          level:"Beginner",     diff:"Easy" },
  { icon:"🌦️", name:"Weather App",       tech:"API + JS",           level:"Intermediate", diff:"Medium" },
  { icon:"💬", name:"Chat Application",  tech:"Node + Socket.io",  level:"Intermediate", diff:"Medium" },
  { icon:"🛒", name:"E-Commerce Site",   tech:"MERN Stack",        level:"Advanced",     diff:"Hard" },
  { icon:"🤖", name:"AI Chatbot",        tech:"Python + OpenAI",   level:"Advanced",     diff:"Hard" },
];

const PRESETS = [
  { label:"🍅 Pomodoro — 25 min",   min:25, preset:"pomodoro" },
  { label:"🔥 Deep Work — 50 min",  min:50, preset:"deep_work" },
  { label:"⚡ Quick Focus — 15 min", min:15, preset:"quick_focus" },
  { label:"☕ Short Break — 5 min",  min:5,  preset:"short_break" },
  { label:"🧘 Long Break — 10 min", min:10, preset:"long_break" },
];

// ══════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════
function Sidebar({ activePage, setPage, darkMode, setDarkMode, user, onLogout }) {
  // auto-expand parent if a child is active
  const [expanded, setExpanded] = useState(() => {
    const open = {};
    NAV_ITEMS.forEach(item => {
      if (item && item.children) {
        if (item.children.some(c => c.page === activePage) || item.page === activePage) open[item.page] = true;
      }
    });
    return open;
  });

  // keep expanded in sync when page changes externally
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item && item.children) {
        if (item.children.some(c => c.page === activePage)) {
          setExpanded(e => ({ ...e, [item.page]: true }));
        }
      }
    });
  }, [activePage]);

  const toggle = (page) => setExpanded(e => ({ ...e, [page]: !e[page] }));

  return (
    <div style={{ width:210, minHeight:"100vh", background:"var(--sidebar-bg)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"fixed", left:0, top:0, zIndex:100, boxShadow:"2px 0 8px rgba(0,0,0,0.06)" }}>
      <div style={{ padding:"20px 18px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid var(--border)" }}>
        <div style={{ width:36, height:36, background:"var(--blue)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", color:"white" }}>🎓</div>
        <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--blue)", letterSpacing:"-0.3px" }}>EduPath</div>
      </div>

      <div style={{ padding:"10px 0", flex:1, overflowY:"auto" }}>
        {NAV_ITEMS.map((item, i) => {
          if (item === null) return <div key={i} style={{ height:1, background:"var(--border)", margin:"8px 18px" }} />;
          const isParentActive = activePage === item.page || (item.children && item.children.some(c => c.page === activePage));
          const isOpen = expanded[item.page];
          if (item.children) {
            return (
              <div key={item.page}>
                <NavItem
                  item={item}
                  active={isParentActive}
                  hasChildren
                  isOpen={isOpen}
                  onClick={() => toggle(item.page)}
                />
                {isOpen && (
                  <div style={{ marginLeft:0, paddingBottom:4 }}>
                    {item.children.map(child => (
                      <NavItem
                        key={child.page}
                        item={child}
                        active={activePage === child.page}
                        isChild
                        onClick={() => setPage(child.page)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavItem key={item.page} item={item} active={activePage===item.page}
              onClick={() => { if (item.page==="logout") { onLogout(); return; } setPage(item.page); }} />
          );
        })}
      </div>
      <div style={{ padding:"12px 10px", borderTop:"1px solid var(--border)" }}>
        <button style={{ width:"100%", background:"linear-gradient(135deg,#1a73e8,#4a90d9)", color:"white", border:"none", borderRadius:10, padding:"10px 14px", fontSize:"0.8rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8, fontFamily:"Nunito,sans-serif", boxShadow:"0 4px 12px rgba(26,115,232,0.3)" }}>
          ⚡ Try Premium Free
        </button>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:8, fontSize:"0.8rem", color:"var(--muted)", fontWeight:600 }}>
          <span>🌙 Dark Mode</span>
          <div onClick={() => setDarkMode(!darkMode)} style={{ width:38, height:20, background:darkMode?"var(--blue)":"var(--border)", borderRadius:50, position:"relative", cursor:"pointer", transition:"background 0.2s" }}>
            <div style={{ position:"absolute", width:16, height:16, background:"white", borderRadius:"50%", top:2, left:darkMode?20:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, active, onClick, hasChildren, isOpen, isChild }) {
  const [hover, setHover] = useState(false);
  const base = {
    display:"flex", alignItems:"center", gap:10, cursor:"pointer",
    fontSize: isChild ? "0.8rem" : "0.875rem",
    fontWeight: isChild ? 600 : 600,
    color:"var(--muted)", transition:"all 0.15s", userSelect:"none",
    padding: isChild ? "8px 18px 8px 42px" : "11px 18px",
  };
  const activeStyle = isChild
    ? { ...base, color:"var(--blue)", fontWeight:700, background:"var(--blue-light)", borderLeft:"3px solid var(--blue)", paddingLeft:39 }
    : { ...base, background:"var(--blue)", color:"white", borderRadius:10, margin:"0 10px", padding:"11px 12px" };
  const hoverStyle = isChild
    ? { ...base, color:"var(--blue)", background:"var(--blue-light)" }
    : { ...base, background:"var(--blue-light)", color:"var(--blue)" };

  return (
    <div style={active ? activeStyle : hover ? hoverStyle : base}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <span style={{ fontSize: isChild ? "0.85rem" : "1.1rem", width:isChild?16:22, textAlign:"center", flexShrink:0 }}>{item.icon}</span>
      <span style={{ flex:1 }}>{item.label}</span>
      {hasChildren && (
        <span style={{ fontSize:"0.65rem", opacity:0.6, transition:"transform 0.2s", display:"inline-block", transform:isOpen?"rotate(90deg)":"rotate(0deg)" }}>▶</span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// TOPBAR
// ══════════════════════════════════════════
function Topbar({ user, setPage }) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      let h = now.getHours(), m = now.getMinutes(), ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m.toString().padStart(2,"0")} ${ampm}`);
      const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ height:58, background:"white", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", padding:"0 28px", gap:16, position:"sticky", top:0, zIndex:50 }}>
      <div style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--text)" }}>{time}</div>
      <div style={{ fontSize:"0.85rem", color:"var(--muted)", fontWeight:600 }}>{date}</div>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:14 }}>
        <div onClick={() => setPage("profile")} style={{ width:36, height:36, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:"0.9rem", cursor:"pointer", transition:"opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity="1"}>
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ fontSize:"0.75rem", color:"var(--muted)", fontWeight:600 }}>{user?.email || ""}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FOCUS TIMER  — now saves sessions to backend
// ══════════════════════════════════════════
function FocusTimer() {
  const [timeLeft, setTimeLeft]     = useState(25 * 60);
  const [totalTime, setTotalTime]   = useState(25 * 60);
  const [running, setRunning]       = useState(false);
  const [showPreset, setShowPreset] = useState(false);
  const [currentPreset, setCurrentPreset] = useState("pomodoro");
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (running) {
      startTimeRef.current = startTimeRef.current || Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false);
            clearInterval(intervalRef.current);
            // ── Save completed session to backend
            const mins = Math.round(totalTime / 60);
            authFetch("/timer/session", {
              method: "POST",
              body: JSON.stringify({ preset: currentPreset, durationMinutes: mins, minutesActual: mins, completedFull: true, topic: "" }),
            }).catch(() => {});
            startTimeRef.current = null;
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      // ── Save partial session if some time elapsed
      if (startTimeRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000);
        if (elapsed >= 1) {
          authFetch("/timer/session", {
            method: "POST",
            body: JSON.stringify({ preset: currentPreset, durationMinutes: Math.round(totalTime/60), minutesActual: elapsed, completedFull: false }),
          }).catch(() => {});
        }
        startTimeRef.current = null;
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const m = Math.floor(timeLeft / 60), sec = timeLeft % 60;
  const pct = 1 - timeLeft / totalTime;
  const deg = Math.round(360 * pct);

  const applyPreset = (p) => {
    const t = p.min * 60;
    setTotalTime(t); setTimeLeft(t); setRunning(false); setShowPreset(false);
    setCurrentPreset(p.preset); startTimeRef.current = null;
  };

  return (
    <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", borderRadius:14, padding:"20px 24px", display:"flex", alignItems:"center", gap:20, border:"1px solid rgba(255,255,255,0.2)", position:"relative", zIndex:1 }}>
      <div style={{ width:90, height:90, borderRadius:"50%", background:`conic-gradient(rgba(255,255,255,0.9) ${deg}deg, rgba(255,255,255,0.15) ${deg}deg)`, border:"5px solid rgba(255,255,255,0.3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:"0.55rem", color:"rgba(255,255,255,0.8)", fontWeight:700, letterSpacing:1 }}>FOCUS</div>
        <div style={{ fontSize:"1.1rem", fontWeight:800, color:"white" }}>{`${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
        <button onClick={() => setRunning(r => !r)} style={{ width:40, height:40, borderRadius:"50%", background:"white", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", color:"var(--blue)", boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>
          {running ? "⏸" : "▶"}
        </button>
        <button onClick={() => { setRunning(false); setTimeLeft(totalTime); startTimeRef.current=null; }} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:"white" }}>🔁</button>
        <div style={{ position:"relative" }}>
          <button onClick={() => setShowPreset(s => !s)} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:"white" }}>⚙</button>
          {showPreset && (
            <div style={{ position:"absolute", right:0, top:34, background:"white", borderRadius:12, padding:8, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:200, border:"1px solid var(--border)", minWidth:160 }}>
              <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", padding:"4px 8px 8px", letterSpacing:1 }}>PRESET TIMERS</div>
              {PRESETS.map(p => (
                <div key={p.min} onClick={() => applyPreset(p)} style={{ padding:"9px 12px", borderRadius:8, fontSize:"0.75rem", fontWeight:700, cursor:"pointer", color:"var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--blue-light)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  {p.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// HERO BANNER
// ══════════════════════════════════════════
function HeroBanner({ user, stats }) {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const hr = new Date().getHours();
    setGreeting(hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening");
  }, []);
  return (
    <div className="fadeUp" style={{ background:"linear-gradient(135deg,#1a73e8 0%,#1558b0 60%,#0d3c7a 100%)", borderRadius:16, padding:"28px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden", minHeight:160, boxShadow:"0 8px 24px rgba(26,115,232,0.25)" }}>
      <div style={{ position:"absolute", right:-40, top:-40, width:200, height:200, background:"rgba(255,255,255,0.06)", borderRadius:"50%" }} />
      <div style={{ color:"white" }}>
        <div style={{ fontSize:"0.85rem", opacity:0.85, marginBottom:6, fontWeight:600 }}>{stats?.pendingTasks ?? 0} tasks due today.</div>
        <div style={{ fontSize:"1.9rem", fontWeight:800, letterSpacing:"-0.5px" }}>{greeting}, {user?.name?.split(" ")[0] || ""}! 👋</div>
        <div style={{ fontSize:"0.8rem", opacity:0.75, marginTop:6 }}>Ready to continue your learning journey?</div>
        {stats?.hoursThisWeek > 0 && (
          <div style={{ fontSize:"0.75rem", opacity:0.85, marginTop:8, background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"4px 10px", display:"inline-block" }}>
            📖 {stats.hoursThisWeek}h studied this week
          </div>
        )}
      </div>
      <FocusTimer />
    </div>
  );
}

// ══════════════════════════════════════════
// STATS ROW — live from /api/users/stats
// ══════════════════════════════════════════
function StatsRow({ stats, loading, setPage, onRefresh }) {
  const items = [
    { icon:"👀", label:"Pending Tasks",   value:stats?.pendingTasks   ?? "—", color:"var(--blue)",   period:"Right now",      goto:"tasks" },
    { icon:"⚠️", label:"Overdue Tasks",   value:stats?.overdueTasks   ?? "—", color:"#d93025",       period:"Need attention", goto:"tasks" },
    { icon:"👍", label:"Tasks Completed", value:stats?.completedTasks ?? "—", color:"#34a853",       period:"All time",       goto:"tasks" },
    { icon:"🔥", label:"Your Streak",     value:stats?.streak         ?? "—", color:"#ea8600",       period:"Days in a row",  goto:"profile" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
      {items.map(st => (
        <div key={st.label} className="fadeUp"
          onClick={() => setPage(st.goto)}
          style={{ background:"white", borderRadius:14, padding:"18px 20px", border:"1px solid var(--border)", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", cursor:"pointer", transition:"all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor="var(--blue)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="var(--border)"; }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:"1.1rem" }}>{st.icon}</span>
              <span style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text)" }}>{st.label}</span>
            </div>
            <span style={{ fontSize:"0.6rem", color:"var(--blue)", fontWeight:700 }}>→</span>
          </div>
          {loading
            ? <div className="skeleton" style={{ height:32, width:60, marginBottom:6 }} />
            : <div style={{ fontSize:"2rem", fontWeight:800, color:st.color, lineHeight:1 }}>{st.value}</div>
          }
          <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginTop:4, fontWeight:600 }}>{st.period}</div>
        </div>
      ))}
    </div>
  );
}

function FeaturesGrid({ setPage }) {
  return (
    <div>
      <div style={{ fontSize:"0.8rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:12 }}>Quick Access</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {FEATURES.map(f => (
          <div key={f.name} onClick={() => setPage(f.goto)} className="fadeUp"
            style={{ background:f.blue?"linear-gradient(135deg,#1a73e8,#1558b0)":"white", borderRadius:14, padding:"18px 16px", border:f.blue?"none":"1px solid var(--border)", cursor:"pointer", display:"flex", flexDirection:"column", gap:8, boxShadow:"0 2px 6px rgba(0,0,0,0.04)", transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; if(!f.blue) e.currentTarget.style.borderColor="var(--blue)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; if(!f.blue) e.currentTarget.style.borderColor="var(--border)"; }}>
            <div style={{ width:42, height:42, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", background:f.blue?"rgba(255,255,255,0.2)":"var(--blue-light)" }}>{f.icon}</div>
            <div style={{ fontSize:"0.82rem", fontWeight:800, color:f.blue?"white":"var(--text)" }}>{f.name}</div>
            <div style={{ fontSize:"0.7rem", color:f.blue?"rgba(255,255,255,0.75)":"var(--muted)", fontWeight:600, lineHeight:1.4 }}>{f.desc}</div>
            <div style={{ fontSize:"0.65rem", fontWeight:700, color:f.blue?"white":"var(--blue)", background:f.blue?"rgba(255,255,255,0.2)":"var(--blue-light)", padding:"3px 8px", borderRadius:50, width:"fit-content" }}>{f.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomTabs({ tasks, progress, setPage, onRefresh }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["🗺️ Roadmap", "✅ Tasks", "📊 Progress"];

  const statusColor = { pending:"var(--blue)", in_progress:"var(--orange)", completed:"var(--green)", overdue:"var(--red)" };
  const statusBg    = { pending:"var(--blue-light)", in_progress:"#fff3e0", completed:"#e6f4ea", overdue:"#fce8e6" };
  const priorityIcon = { high:"🔴", medium:"🟡", low:"🟢" };

  // Real tasks — pending + overdue first
  const displayTasks = [...tasks]
    .sort((a,b) => (a.status==="overdue" ? -1 : b.status==="overdue" ? 1 : 0))
    .slice(0, 5);

  // Real roadmap progress — in-progress first, then not started
  const displayProgress = [...progress]
    .sort((a,b) => b.percent - a.percent)
    .slice(0, 4);

  // Overall stats from progress
  const avgProgress = progress.length > 0
    ? Math.round(progress.reduce((s,p) => s + p.percent, 0) / progress.length)
    : 0;
  const completedCount = progress.filter(p => p.percent === 100).length;

  const completeTask = async (id) => {
    await authFetch(`/tasks/${id}/complete`, { method:"PATCH" }).catch(() => {});
    onRefresh();
  };

  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* Tab header */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
        {tabs.map((t,i) => (
          <div key={t} onClick={() => setActiveTab(i)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"14px 22px", fontSize:"0.8rem", fontWeight:700, color:activeTab===i?"var(--blue)":"var(--muted)", cursor:"pointer", borderBottom:activeTab===i?"2px solid var(--blue)":"2px solid transparent", transition:"color 0.15s" }}>
            {t}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 16px", gap:8 }}>
          <button onClick={onRefresh} title="Refresh"
            style={{ width:28, height:28, border:"1px solid var(--border)", borderRadius:"50%", background:"white", cursor:"pointer", fontSize:"0.8rem", display:"flex", alignItems:"center", justifyContent:"center" }}>↻</button>
        </div>
      </div>

      <div style={{ padding:20 }}>

        {/* ── Roadmap tab */}
        {activeTab === 0 && (
          <div>
            {displayProgress.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--muted)" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🗺️</div>
                <div style={{ fontSize:"0.82rem", fontWeight:600, marginBottom:12 }}>No roadmap progress yet</div>
                <button onClick={() => setPage("roadmap")} style={{ fontSize:"0.78rem", background:"var(--blue)", color:"white", border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700 }}>
                  Start your roadmap →
                </button>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                  {[
                    { v:`${avgProgress}%`, l:"Avg Progress",   c:"var(--blue)" },
                    { v:completedCount,    l:"Completed",       c:"var(--green)" },
                    { v:progress.filter(p=>p.percent>0&&p.percent<100).length, l:"In Progress", c:"var(--orange)" },
                  ].map(s => (
                    <div key={s.l} style={{ flex:1, textAlign:"center", padding:"8px", background:"var(--main-bg)", borderRadius:10, border:"1px solid var(--border)" }}>
                      <div style={{ fontSize:"1.1rem", fontWeight:800, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:"0.6rem", color:"var(--muted)", fontWeight:700 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {displayProgress.map(p => (
                  <div key={p._id} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <div style={{ fontSize:"0.8rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"75%" }}>{p.course}</div>
                      <span style={{ fontSize:"0.68rem", fontWeight:800, color:p.percent===100?"var(--green)":"var(--blue)", flexShrink:0 }}>{p.percent}%</span>
                    </div>
                    <div style={{ height:8, background:"var(--blue-light)", borderRadius:50, overflow:"hidden" }}>
                      <div style={{ width:`${p.percent}%`, height:"100%", background:p.percent===100?"var(--green)":"linear-gradient(90deg,var(--blue),#4a90d9)", borderRadius:50, transition:"width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
                <button onClick={() => setPage("roadmap")} style={{ width:"100%", padding:"9px", background:"var(--blue-light)", color:"var(--blue)", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", marginTop:4 }}>
                  View full roadmap →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Tasks tab */}
        {activeTab === 1 && (
          <div>
            {displayTasks.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--muted)" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:8 }}>✅</div>
                <div style={{ fontSize:"0.82rem", fontWeight:600, marginBottom:12 }}>No pending tasks</div>
                <button onClick={() => setPage("tasks")} style={{ fontSize:"0.78rem", background:"var(--blue)", color:"white", border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700 }}>
                  Add a task →
                </button>
              </div>
            ) : (
              <>
                {displayTasks.map(t => (
                  <div key={t._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, border:"1px solid var(--border)", marginBottom:8, background:"var(--main-bg)", transition:"all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="var(--blue)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                    {/* Complete btn */}
                    <button onClick={() => completeTask(t._id)}
                      style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${statusColor[t.status]||"var(--border)"}`, background:"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.6rem" }} />
                    <span style={{ fontSize:"0.85rem" }}>{priorityIcon[t.priority]||"🟡"}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.8rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                      {t.dueDate && <div style={{ fontSize:"0.62rem", color:"var(--muted)", marginTop:1 }}>📅 Due {new Date(t.dueDate).toLocaleDateString()}</div>}
                    </div>
                    <span style={{ fontSize:"0.6rem", fontWeight:700, padding:"2px 8px", borderRadius:50, background:statusBg[t.status]||"var(--blue-light)", color:statusColor[t.status]||"var(--blue)", textTransform:"capitalize", flexShrink:0 }}>
                      {t.status.replace("_"," ")}
                    </span>
                  </div>
                ))}
                <button onClick={() => setPage("tasks")} style={{ width:"100%", padding:"9px", background:"var(--blue-light)", color:"var(--blue)", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", marginTop:4 }}>
                  View all tasks →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Progress tab */}
        {activeTab === 2 && (
          <div>
            {progress.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--muted)" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:8 }}>📊</div>
                <div style={{ fontSize:"0.82rem", fontWeight:600, marginBottom:12 }}>No progress tracked yet</div>
                <button onClick={() => setPage("myprogress")} style={{ fontSize:"0.78rem", background:"var(--blue)", color:"white", border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700 }}>
                  Track progress →
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                  {[
                    { icon:"📚", v:progress.length,       l:"Courses Tracked",  c:"var(--blue)" },
                    { icon:"✅", v:completedCount,         l:"Completed",         c:"var(--green)" },
                    { icon:"📈", v:`${avgProgress}%`,     l:"Average Progress",  c:"var(--orange)" },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign:"center", padding:"12px 8px", background:"var(--main-bg)", borderRadius:10, border:"1px solid var(--border)" }}>
                      <div style={{ fontSize:"1.1rem", marginBottom:2 }}>{s.icon}</div>
                      <div style={{ fontSize:"1rem", fontWeight:800, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:"0.58rem", color:"var(--muted)", fontWeight:700 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {progress.slice(0,4).map(p => (
                  <div key={p._id} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", fontWeight:700, marginBottom:4 }}>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"75%" }}>{p.course}</span>
                      <span style={{ color:p.percent===100?"var(--green)":"var(--blue)", flexShrink:0 }}>{p.percent}%</span>
                    </div>
                    <div style={{ height:6, background:"var(--blue-light)", borderRadius:50, overflow:"hidden" }}>
                      <div style={{ width:`${p.percent}%`, height:"100%", background:p.percent===100?"var(--green)":"linear-gradient(90deg,var(--blue),#4a90d9)", borderRadius:50, transition:"width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
                <button onClick={() => setPage("myprogress")} style={{ width:"100%", padding:"9px", background:"var(--blue-light)", color:"var(--blue)", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", marginTop:4 }}>
                  View full progress →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PillTabs({ pills, active, setActive }) {
  return (
    <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
      {pills.map((p, i) => (
        <button key={p} onClick={() => setActive(i)} style={{ padding:"6px 16px", borderRadius:50, fontSize:"0.75rem", fontWeight:700, background:active===i?"var(--blue)":"var(--blue-light)", color:active===i?"white":"var(--blue)", cursor:"pointer", border:"none", fontFamily:"Nunito,sans-serif", transition:"all 0.15s" }}>{p}</button>
      ))}
    </div>
  );
}

function PageCard({ title, sub, children, action }) {
  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ fontSize:"1.2rem", fontWeight:800 }}>{title}</div>
        {action}
      </div>
      <div style={{ fontSize:"0.8rem", color:"var(--muted)", marginBottom:20 }}>{sub}</div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════
function DashboardPage({ setPage, user }) {
  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tasks, setTasks]             = useState([]);
  const [progress, setProgress]       = useState([]);
  const [refreshKey, setRefreshKey]   = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setStatsLoading(true);
    Promise.all([
      authFetch("/users/stats").catch(() => ({})),
      authFetch("/tasks?status=pending&sort=due").catch(() => ({})),
      authFetch("/progress").catch(() => ({})),
    ]).then(([sData, tData, pData]) => {
      if (sData.success) setStats(sData.stats);
      if (tData.success) setTasks(tData.tasks || []);
      if (pData.success) setProgress(pData.progress || []);
      setStatsLoading(false);
    });
  }, [refreshKey]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <HeroBanner user={user} stats={stats} />
      <StatsRow stats={stats} loading={statsLoading} setPage={setPage} onRefresh={refresh} />
      <FeaturesGrid setPage={setPage} />
      <BottomTabs tasks={tasks} progress={progress} setPage={setPage} onRefresh={refresh} />
    </div>
  );
}

// ══════════════════════════════════════════
// TASKS PAGE — full CRUD via /api/tasks
// ══════════════════════════════════════════
function TasksPage() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [filter, setFilter]   = useState("all");
  const [adding, setAdding]   = useState(false);
  const [err, setErr]         = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", priority:"medium", category:"study", dueDate:"" });

  const load = useCallback(async () => {
    setLoading(true);
    const status = filter === "all" ? "" : `?status=${filter}`;
    try {
      const data = await authFetch(`/tasks${status}`);
      if (data.success) { setTasks(data.tasks || []); setSummary(data.summary || {}); }
      else setErr(data.error || "Failed to load tasks.");
    } catch (e) { setErr("Cannot connect to backend. Is the server running?"); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const addTask = async () => {
    if (!form.title.trim()) { setErr("Task title cannot be empty."); return; }
    setAdding(true); setErr("");
    try {
      const payload = {
        title:    form.title.trim(),
        priority: form.priority,
        category: form.category,
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      };
      const data = await authFetch("/tasks", { method:"POST", body: JSON.stringify(payload) });
      if (data.success) {
        setForm({ title:"", priority:"medium", category:"study", dueDate:"" });
        setShowForm(false);
        load();
      } else {
        // Show exact backend validation error
        const msg = data.errors?.[0]?.msg || data.error || "Failed to add task.";
        setErr(msg);
      }
    } catch (e) { setErr("Network error — is the backend running on port 5000?"); }
    setAdding(false);
  };

  const completeTask = async (id) => {
    try {
      await authFetch(`/tasks/${id}/complete`, { method:"PATCH" });
      load();
    } catch { setErr("Failed to complete task."); }
  };

  const deleteTask = async (id) => {
    try {
      await authFetch(`/tasks/${id}`, { method:"DELETE" });
      load();
    } catch { setErr("Failed to delete task."); }
  };

  const clearCompleted = async () => {
    await authFetch("/tasks/completed/all", { method:"DELETE" }).catch(() => {});
    load();
  };

  const statusColor = { pending:"var(--blue)", in_progress:"var(--orange)", completed:"var(--green)", overdue:"var(--red)" };
  const filters     = ["all","pending","in_progress","completed","overdue"];
  const priorities  = ["low","medium","high"];
  const categories  = ["study","practice","project","revision","other"];
  const priorityColor = { low:"var(--green)", medium:"var(--orange)", high:"var(--red)" };

  return (
    <PageCard title="✅ Tasks"
      sub={`${summary.pending||0} pending · ${summary.overdue||0} overdue · ${summary.completed||0} completed`}
      action={
        <div style={{ display:"flex", gap:8 }}>
          {summary.completed > 0 && (
            <button onClick={clearCompleted} style={{ fontSize:"0.72rem", color:"var(--red)", background:"#fce8e6", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700 }}>
              Clear done
            </button>
          )}
          <button onClick={() => { setShowForm(!showForm); setErr(""); }}
            style={{ fontSize:"0.75rem", background:"var(--blue)", color:"white", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:800 }}>
            {showForm ? "✕ Cancel" : "+ New Task"}
          </button>
        </div>
      }>

      {/* Error banner */}
      {err && (
        <div style={{ padding:"10px 14px", background:"#fce8e6", border:"1px solid #f5c6c3", borderRadius:10, fontSize:"0.78rem", color:"#d93025", fontWeight:700, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          ⚠️ {err}
          <span onClick={() => setErr("")} style={{ cursor:"pointer", fontWeight:800, fontSize:"1rem" }}>×</span>
        </div>
      )}

      {/* Add task form */}
      {showForm && (
        <div style={{ background:"var(--blue-light)", borderRadius:12, padding:16, marginBottom:20, border:"1.5px solid var(--blue)" }}>
          <div style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--blue)", marginBottom:12, letterSpacing:"0.5px" }}>NEW TASK</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Title */}
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
              onKeyPress={e => e.key==="Enter" && addTask()}
              placeholder="Task title (required)…"
              autoFocus
              style={{ padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.85rem", background:"white", color:"var(--text)", outline:"none" }} />
            {/* Row 2: priority + category + due date */}
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", marginBottom:4 }}>PRIORITY</div>
                <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}
                  style={{ width:"100%", padding:"9px 10px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"Nunito,sans-serif", fontSize:"0.78rem", background:"white", color:"var(--text)", cursor:"pointer" }}>
                  {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", marginBottom:4 }}>CATEGORY</div>
                <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}
                  style={{ width:"100%", padding:"9px 10px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"Nunito,sans-serif", fontSize:"0.78rem", background:"white", color:"var(--text)", cursor:"pointer" }}>
                  {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", marginBottom:4 }}>DUE DATE</div>
                <input type="date" value={form.dueDate} onChange={e => setForm(f=>({...f,dueDate:e.target.value}))}
                  style={{ width:"100%", padding:"9px 10px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"Nunito,sans-serif", fontSize:"0.78rem", background:"white", color:"var(--text)", cursor:"pointer" }} />
              </div>
            </div>
            <button onClick={addTask} disabled={adding || !form.title.trim()}
              style={{ padding:"12px", background:form.title.trim()?"linear-gradient(135deg,var(--blue),var(--blue-dark))":"var(--border)", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:form.title.trim()?"pointer":"not-allowed", boxShadow:form.title.trim()?"0 4px 12px rgba(26,115,232,0.3)":"none" }}>
              {adding ? "Adding…" : "✅ Add Task"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"5px 14px", borderRadius:50, fontSize:"0.72rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"Nunito,sans-serif", background:filter===f?"var(--blue)":"var(--blue-light)", color:filter===f?"white":"var(--blue)", textTransform:"capitalize" }}>
            {f.replace("_"," ")}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:56, marginBottom:10 }} />)
      ) : tasks.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:"2rem", marginBottom:8 }}>🎯</div>
          <div style={{ fontSize:"0.85rem", fontWeight:600 }}>
            {filter === "all" ? "No tasks yet — add your first one!" : `No ${filter.replace("_"," ")} tasks.`}
          </div>
        </div>
      ) : tasks.map(t => (
        <div key={t._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, border:"1px solid var(--border)", marginBottom:10, background:"var(--main-bg)", transition:"all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor="var(--blue)"}
          onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
          {/* Complete circle */}
          <button onClick={() => t.status !== "completed" && completeTask(t._id)}
            style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${statusColor[t.status]||"var(--border)"}`, background:t.status==="completed"?"var(--green)":"transparent", cursor:t.status==="completed"?"default":"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"0.65rem" }}>
            {t.status === "completed" ? "✓" : ""}
          </button>
          {/* Title + meta */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"0.82rem", fontWeight:700, textDecoration:t.status==="completed"?"line-through":"none", opacity:t.status==="completed"?0.5:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
            <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap" }}>
              <span style={{ fontSize:"0.6rem", fontWeight:700, color:priorityColor[t.priority]||"var(--muted)", textTransform:"capitalize" }}>● {t.priority}</span>
              <span style={{ fontSize:"0.6rem", color:"var(--muted)", textTransform:"capitalize" }}>{t.category}</span>
              {t.dueDate && <span style={{ fontSize:"0.6rem", color:"var(--muted)" }}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
            </div>
          </div>
          {/* Status badge */}
          <span style={{ fontSize:"0.6rem", fontWeight:700, padding:"3px 9px", borderRadius:50, background:t.status==="completed"?"#e6f4ea":t.status==="overdue"?"#fce8e6":"var(--blue-light)", color:statusColor[t.status]||"var(--blue)", textTransform:"capitalize", flexShrink:0 }}>
            {t.status.replace("_"," ")}
          </span>
          {/* Delete */}
          <button onClick={() => deleteTask(t._id)} style={{ width:24, height:24, borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", color:"var(--muted)", fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>×</button>
        </div>
      ))}
    </PageCard>
  );
}

// ══════════════════════════════════════════
// ROADMAP PAGE — live from /api/progress
// ══════════════════════════════════════════
// ── Roadmap data helpers (localStorage-backed)
const ROADMAP_STORAGE_KEY = "edupath_roadmaps";

const DEFAULT_ROADMAPS = [
  // ── Role-based
  { id:"frontend",          domain:"Frontend",            icon:"🌐", steps:["HTML Basics","CSS & Layouts","JavaScript Fundamentals","Package Managers","CSS Frameworks","Build Tools","React / Vue / Angular","Testing","Web Security Basics","Performance & SEO","Deployment"] },
  { id:"backend",           domain:"Backend",             icon:"🖥️", steps:["Internet & HTTP","OS & Linux Basics","Language (Node/Python/Java)","Version Control (Git)","Databases","APIs & REST","Authentication","Caching","Web Security","Testing","Deployment & DevOps"] },
  { id:"fullstack",         domain:"Full Stack",          icon:"🔀", steps:["HTML & CSS","JavaScript","Frontend Framework","Node.js","Databases","REST APIs","Authentication","DevOps Basics","Cloud Deployment","Testing","System Design"] },
  { id:"devops",            domain:"DevOps",              icon:"⚙️", steps:["Linux & Shell Scripting","Version Control (Git)","Networking Basics","Docker","CI/CD Pipelines","Kubernetes","Cloud Platforms (AWS/GCP)","Infrastructure as Code","Monitoring & Logging","Security","Site Reliability"] },
  { id:"devsecops",         domain:"DevSecOps",           icon:"🔒", steps:["DevOps Fundamentals","Security Basics","SAST & DAST Tools","Container Security","CI/CD Security","Secrets Management","Threat Modelling","Compliance & Governance","Incident Response","Security Automation"] },
  { id:"data-analyst",      domain:"Data Analyst",        icon:"📈", steps:["Excel & Spreadsheets","SQL Fundamentals","Python for Data","Data Visualisation","Statistics","Business Intelligence (BI)","Tableau / Power BI","Data Cleaning","Reporting","A/B Testing","Communication"] },
  { id:"ai-engineer",       domain:"AI Engineer",         icon:"🤖", steps:["Python Basics","Math & Statistics","Machine Learning","Deep Learning","LLMs & Transformers","Prompt Engineering","LangChain / LlamaIndex","Vector Databases","MLOps","AI APIs & SDKs","Deployment"] },
  { id:"ai-data-scientist", domain:"AI & Data Science",   icon:"🧬", steps:["Python & Libraries","Math & Statistics","Data Wrangling","EDA","Machine Learning","Deep Learning","NLP","Computer Vision","Model Evaluation","MLOps","Research Skills"] },
  { id:"data-engineer",     domain:"Data Engineering",    icon:"🗄️", steps:["SQL & Databases","Python","ETL Pipelines","Data Warehousing","Apache Spark","Kafka","Airflow","Cloud Data Platforms","Data Modelling","Data Governance","Streaming"] },
  { id:"android",           domain:"Android",             icon:"📱", steps:["Kotlin Basics","Android Studio","UI & Layouts","Activities & Fragments","Jetpack Compose","Networking","Room Database","MVVM Architecture","Testing","Publishing to Play Store"] },
  { id:"machine-learning",  domain:"Machine Learning",    icon:"🧠", steps:["Python","Math: Linear Algebra & Calculus","Statistics & Probability","Data Preprocessing","Regression & Classification","Clustering","Feature Engineering","Model Evaluation","Neural Networks","Deep Learning","MLOps"] },
  { id:"ios",               domain:"iOS",                 icon:"🍎", steps:["Swift Basics","SwiftUI","UIKit","Auto Layout","Networking & APIs","Core Data","Combine / async-await","App Architecture","Testing","App Store Publishing"] },
  { id:"blockchain",        domain:"Blockchain",          icon:"⛓️", steps:["Cryptography Basics","Blockchain Fundamentals","Ethereum & EVM","Solidity Smart Contracts","Web3.js / ethers.js","DeFi Protocols","NFTs","Layer 2 Solutions","Security & Auditing","dApp Development"] },
  { id:"qa",                domain:"QA Engineering",      icon:"🧪", steps:["Software Testing Basics","Test Planning","Manual Testing","API Testing","Selenium / Cypress","Performance Testing","Security Testing","CI/CD Integration","Test Management","Automation Frameworks"] },
  { id:"cyber-security",    domain:"Cyber Security",      icon:"🛡️", steps:["Networking Basics","OS & Linux","Cryptography","Web Security","Ethical Hacking","Penetration Testing","Vulnerability Assessment","SIEM & SOC","Incident Response","Compliance & Frameworks"] },
  { id:"ux-design",         domain:"UX Design",           icon:"🎨", steps:["Design Thinking","User Research","Wireframing","Prototyping","Figma / Sketch","Usability Testing","Information Architecture","Visual Design","Accessibility","Design Systems","Portfolio"] },
  { id:"game-dev",          domain:"Game Development",    icon:"🎮", steps:["Programming Basics (C#/C++)","Game Engine (Unity/Unreal)","2D/3D Graphics","Physics & Collision","Audio Systems","Game AI","Multiplayer Networking","Monetisation","Publishing","Performance Optimisation"] },
  { id:"mlops",             domain:"MLOps",               icon:"🔧", steps:["ML Basics","Python & Docker","Data Versioning (DVC)","Model Registry","CI/CD for ML","Feature Stores","Model Serving","Monitoring & Drift Detection","Cloud ML Platforms","Kubernetes for ML"] },
  { id:"software-arch",     domain:"Software Architecture",icon:"🏛️", steps:["Design Patterns","SOLID Principles","Microservices","Event-Driven Architecture","API Design","Distributed Systems","Database Design","Security Architecture","Scalability","Documentation"] },
  { id:"product-manager",   domain:"Product Management",  icon:"📋", steps:["Product Thinking","Market Research","User Story Mapping","Roadmap Planning","Agile & Scrum","Metrics & KPIs","Stakeholder Management","A/B Testing","Go-To-Market Strategy","Leadership"] },

  // ── Skill-based
  { id:"dsa",               domain:"DSA",                 icon:"🧮", steps:["Arrays & Strings","Linked Lists","Stacks & Queues","Trees & Binary Search Trees","Graphs & BFS/DFS","Sorting Algorithms","Searching Algorithms","Dynamic Programming","Greedy Algorithms","Backtracking","System Design Patterns"] },
  { id:"ai-ml",             domain:"AI / ML",             icon:"✨", steps:["Python Basics","NumPy & Pandas","Data Visualization","Machine Learning Fundamentals","Deep Learning","NLP","Computer Vision","MLOps","LLMs","Model Deployment"] },
  { id:"data-science",      domain:"Data Science",        icon:"📊", steps:["Python & Stats","Data Wrangling","Exploratory Analysis","ML Fundamentals","Big Data Tools","Visualization","SQL","Communication","Capstone Project"] },
  { id:"react",             domain:"React",               icon:"⚛️", steps:["JavaScript ES6+","React Basics & JSX","Components & Props","State & Lifecycle","Hooks (useState, useEffect)","Context API","React Router","State Management (Redux/Zustand)","Testing (Jest/RTL)","Performance","Next.js"] },
  { id:"vue",               domain:"Vue.js",              icon:"💚", steps:["HTML/CSS/JS Basics","Vue 3 Fundamentals","Templates & Directives","Components & Props","Composition API","Vue Router","Pinia (State)","Vuex","Testing","Nuxt.js","Deployment"] },
  { id:"angular",           domain:"Angular",             icon:"🔺", steps:["TypeScript Basics","Angular CLI","Components","Data Binding","Directives & Pipes","Services & DI","Routing","Forms","HTTP Client","RxJS","Testing","NgRx"] },
  { id:"javascript",        domain:"JavaScript",          icon:"🟨", steps:["Variables & Data Types","Functions & Scope","DOM Manipulation","Events","Async JS (Promises/async-await)","ES6+ Features","Modules","Error Handling","Browser APIs","Testing","TypeScript"] },
  { id:"typescript",        domain:"TypeScript",          icon:"🔷", steps:["JS Fundamentals","TypeScript Basics","Types & Interfaces","Generics","Decorators","Utility Types","tsconfig","Type Narrowing","Advanced Types","Testing","Integration with Frameworks"] },
  { id:"nodejs",            domain:"Node.js",             icon:"🟩", steps:["JavaScript Basics","Node.js Core Modules","npm & Package Management","Express.js","REST APIs","Authentication (JWT)","Databases","File System & Streams","Testing","Deployment","Microservices"] },
  { id:"python",            domain:"Python",              icon:"🐍", steps:["Python Syntax Basics","Data Types & Structures","Functions & Modules","OOP","File I/O","Exception Handling","Libraries (NumPy, Pandas)","Web (Flask/Django)","Testing","Async Python","Deployment"] },
  { id:"java",              domain:"Java",                icon:"☕", steps:["Java Syntax & OOP","Data Structures","Collections Framework","Multithreading","JVM & Memory","Spring Framework","Spring Boot","Databases & JPA","Testing (JUnit)","Microservices","Deployment"] },
  { id:"system-design",     domain:"System Design",       icon:"📐", steps:["Scalability Concepts","Load Balancing","Caching","Database Design & Sharding","SQL vs NoSQL","Message Queues","Microservices vs Monolith","API Design","CDN","Distributed Systems","Real-World Designs"] },
  { id:"sql",               domain:"SQL",                 icon:"🗃️", steps:["Database Basics","SELECT Queries","Filtering & Sorting","JOINs","Aggregations","Subqueries","Indexes","Transactions","Stored Procedures","Query Optimisation","PostgreSQL / MySQL"] },
  { id:"computer-science",  domain:"Computer Science",    icon:"🖥️", steps:["Discrete Mathematics","Data Structures","Algorithms","Computer Architecture","Operating Systems","Networking","Databases","Compilers","Distributed Systems","Theory of Computation"] },
  { id:"docker",            domain:"Docker",              icon:"🐳", steps:["Containers vs VMs","Docker Installation","Dockerfile","Images & Containers","Docker Compose","Networking","Volumes","Docker Hub","Multi-Stage Builds","Security","Kubernetes Intro"] },
  { id:"kubernetes",        domain:"Kubernetes",          icon:"☸️", steps:["Container Basics","K8s Architecture","Pods & Nodes","Deployments & ReplicaSets","Services & Networking","ConfigMaps & Secrets","Storage","Helm Charts","Monitoring","Security","CI/CD Integration"] },
  { id:"aws",               domain:"AWS",                 icon:"☁️", steps:["Cloud Fundamentals","IAM & Security","EC2 & VPC","S3 Storage","RDS & DynamoDB","Lambda & Serverless","ECS & EKS","CloudFormation","Monitoring (CloudWatch)","Cost Optimisation","Certifications"] },
  { id:"git",               domain:"Git & GitHub",        icon:"🔀", steps:["Git Basics","Staging & Committing","Branching & Merging","Remote Repositories","GitHub Workflow","Pull Requests","Rebasing","Git Tags","GitHub Actions","Git Hooks","Monorepos"] },
  { id:"linux",             domain:"Linux",               icon:"🐧", steps:["Linux Basics & Shell","File System","User & Permissions","Process Management","Package Managers","Networking","Shell Scripting","Cron Jobs","SSH","Security Hardening","Systemd"] },
  { id:"go",                domain:"Go",                  icon:"🐹", steps:["Go Syntax & Types","Functions & Closures","Structs & Interfaces","Error Handling","Goroutines & Channels","Standard Library","REST APIs (Gin/Echo)","Database","Testing","Microservices","Deployment"] },
  { id:"rust",              domain:"Rust",                icon:"🦀", steps:["Rust Syntax Basics","Ownership & Borrowing","Structs & Enums","Error Handling","Collections","Traits","Generics","Async Rust","Cargo & Crates","Systems Programming","WebAssembly"] },
  { id:"flutter",           domain:"Flutter",             icon:"💙", steps:["Dart Language Basics","Flutter Setup","Widgets (Stateless & Stateful)","Layouts","Navigation & Routing","State Management (Provider/Bloc)","Networking & APIs","Local Storage","Animations","Testing","Publishing"] },
  { id:"kotlin",            domain:"Kotlin",              icon:"🟣", steps:["Kotlin Syntax Basics","OOP in Kotlin","Functional Programming","Coroutines","Android with Kotlin","Jetpack Compose","Spring Boot with Kotlin","Testing","Multiplatform (KMM)","Deployment"] },
  { id:"swift",             domain:"Swift / SwiftUI",     icon:"🍊", steps:["Swift Basics","Optionals & Error Handling","Collections","OOP & Protocols","SwiftUI Fundamentals","State Management","Navigation","Networking","Core Data","Testing","App Store"] },
  { id:"graphql",           domain:"GraphQL",             icon:"🔗", steps:["REST vs GraphQL","Schema & Types","Queries & Mutations","Subscriptions","Resolvers","Apollo Server","Apollo Client","Authentication","Pagination","Caching","Federation"] },
  { id:"react-native",      domain:"React Native",        icon:"📲", steps:["React Basics","RN Setup & CLI","Core Components","Navigation","Styling","State Management","Networking","Device APIs","Animations","Testing","Publishing (iOS & Android)"] },
  { id:"mongodb",           domain:"MongoDB",             icon:"🍃", steps:["NoSQL Concepts","MongoDB Setup","CRUD Operations","Query Operators","Indexes","Aggregation Pipeline","Schema Design","Transactions","Security","Replication & Sharding","Atlas Cloud"] },
  { id:"nextjs",            domain:"Next.js",             icon:"▲",  steps:["React Fundamentals","Next.js Pages & Routing","App Router","Server & Client Components","Data Fetching","API Routes","Authentication","Deployment (Vercel)","Performance","Testing","Full Stack with Next.js"] },
  { id:"django",            domain:"Django",              icon:"🎸", steps:["Python Basics","Django Setup","Models & ORM","Views & URLs","Templates","Forms","Authentication","REST API (DRF)","Testing","Admin Panel","Deployment"] },
  { id:"spring-boot",       domain:"Spring Boot",         icon:"🌱", steps:["Java Basics","Spring Core & DI","Spring Boot Setup","REST APIs","Spring Data JPA","Security (JWT)","Testing","Microservices","Docker","Deployment","Spring Cloud"] },
  { id:"php",               domain:"PHP",                 icon:"🐘", steps:["PHP Syntax Basics","Arrays & Functions","OOP in PHP","MySQL & PDO","Forms & Validation","Sessions & Cookies","Laravel Framework","REST APIs","Testing","Security","Deployment"] },
  { id:"prompt-eng",        domain:"Prompt Engineering",  icon:"💬", steps:["LLM Basics","Prompt Anatomy","Zero-Shot & Few-Shot","Chain of Thought","Role Prompting","RAG (Retrieval Augmented)","Prompt Templates","Evaluation","Fine-Tuning","AI Agents","Production Prompts"] },
  { id:"terraform",         domain:"Terraform",           icon:"🏗️", steps:["IaC Concepts","Terraform Setup","Providers & Resources","Variables & Outputs","State Management","Modules","Remote State","Workspaces","Testing","Terraform Cloud","Best Practices"] },
];

const getRoadmaps = () => {
  try {
    const stored = localStorage.getItem(ROADMAP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ROADMAPS;
  } catch { return DEFAULT_ROADMAPS; }
};

const saveRoadmaps = (roadmaps) => {
  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(roadmaps));
};

// Domain icons map for auto-created roadmaps
const DOMAIN_ICONS = {
  "Web Dev":"🌐","AI / ML":"🤖","DSA":"🧮","Data Science":"📊",
  "DevOps":"⚙️","Android":"📱","General / Other":"📁",
};

// Returns all known domains from roadmaps (existing + custom)
const getAllDomains = () => {
  const roadmaps = getRoadmaps();
  return roadmaps.map(r => r.domain);
};

// If a topic/domain doesn't exist in roadmaps, auto-create a blank roadmap for it
const ensureDomainExists = (topic) => {
  if (!topic || topic === "All") return;
  const roadmaps = getRoadmaps();
  const exists = roadmaps.some(r => r.domain === topic);
  if (!exists) {
    const newRoadmap = {
      id:     topic.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      domain: topic,
      icon:   DOMAIN_ICONS[topic] || "📁",
      steps:  [],
    };
    const updated = [...roadmaps, newRoadmap];
    saveRoadmaps(updated);
    // dispatch event so RoadmapPage reloads if open
    window.dispatchEvent(new CustomEvent("roadmap-updated"));
  }
};

// ══════════════════════════════════════════
// ADMIN PANEL — roadmap manager
// ══════════════════════════════════════════
function AdminPanel({ onClose }) {
  const [roadmaps, setRoadmaps]   = useState(getRoadmaps());
  const [selected, setSelected]   = useState(null); // roadmap id being edited
  const [view, setView]           = useState("list"); // "list" | "edit" | "new"
  const [saved, setSaved]         = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ domain:"", icon:"🗺️", steps:[] });
  const [newStep, setNewStep]   = useState("");

  const ICONS = ["🌐","🤖","🧮","📊","⚙️","📱","🎯","📚","💻","🔬","🎮","🌍"];

  const openEdit = (rm) => {
    setEditForm({ domain: rm.domain, icon: rm.icon, steps: [...rm.steps] });
    setSelected(rm.id);
    setView("edit");
  };

  const openNew = () => {
    setEditForm({ domain:"", icon:"🎯", steps:[] });
    setSelected(null);
    setView("new");
  };

  const saveEdit = () => {
    if (!editForm.domain.trim() || editForm.steps.length === 0) return;
    let updated;
    if (view === "new") {
      const newRm = { id: Date.now().toString(), domain: editForm.domain.trim(), icon: editForm.icon, steps: editForm.steps };
      updated = [...roadmaps, newRm];
    } else {
      updated = roadmaps.map(r => r.id === selected ? { ...r, domain: editForm.domain.trim(), icon: editForm.icon, steps: editForm.steps } : r);
    }
    setRoadmaps(updated);
    saveRoadmaps(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setView("list");
  };

  const deleteRoadmap = (id) => {
    const updated = roadmaps.filter(r => r.id !== id);
    setRoadmaps(updated);
    saveRoadmaps(updated);
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setEditForm(f => ({ ...f, steps: [...f.steps, newStep.trim()] }));
    setNewStep("");
  };

  const removeStep = (idx) => setEditForm(f => ({ ...f, steps: f.steps.filter((_,i) => i !== idx) }));

  const moveStep = (idx, dir) => {
    const steps = [...editForm.steps];
    const swap = idx + dir;
    if (swap < 0 || swap >= steps.length) return;
    [steps[idx], steps[swap]] = [steps[swap], steps[idx]];
    setEditForm(f => ({ ...f, steps }));
  };

  const resetDefaults = () => {
    saveRoadmaps(DEFAULT_ROADMAPS);
    setRoadmaps(DEFAULT_ROADMAPS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div className="fadeIn" style={{ background:"white", borderRadius:18, width:"100%", maxWidth:640, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(135deg,#1a73e8,#1558b0)", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:"white" }}>
              {view === "list" ? "🛠️ Roadmap Admin Panel" : view === "new" ? "➕ New Roadmap" : "✏️ Edit Roadmap"}
            </div>
            <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.75)", marginTop:2 }}>
              {view === "list" ? `${roadmaps.length} roadmaps · Admin only` : editForm.domain || "Untitled roadmap"}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {saved && <span style={{ fontSize:"0.72rem", background:"rgba(52,168,83,0.3)", color:"#a8f0b5", padding:"4px 10px", borderRadius:50, fontWeight:700, alignSelf:"center" }}>✓ Saved</span>}
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"none", color:"white", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* ── LIST VIEW */}
          {view === "list" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:"0.75rem", color:"var(--muted)", fontWeight:700 }}>Drag steps to reorder inside each roadmap</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={resetDefaults} style={{ fontSize:"0.72rem", padding:"6px 12px", background:"#fce8e6", color:"var(--red)", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700 }}>↺ Reset defaults</button>
                  <button onClick={openNew} style={{ fontSize:"0.75rem", padding:"8px 14px", background:"var(--blue)", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:800 }}>+ New Roadmap</button>
                </div>
              </div>
              {roadmaps.map(rm => (
                <div key={rm.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, border:"1px solid var(--border)", marginBottom:10, background:"var(--main-bg)", transition:"all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="var(--blue)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                  <div style={{ fontSize:"1.5rem", width:36, textAlign:"center" }}>{rm.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.88rem", fontWeight:800 }}>{rm.domain}</div>
                    <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginTop:2 }}>{rm.steps.length} steps: {rm.steps.slice(0,3).join(", ")}{rm.steps.length > 3 ? "…" : ""}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => openEdit(rm)} style={{ padding:"6px 12px", background:"var(--blue-light)", color:"var(--blue)", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.72rem" }}>✏️ Edit</button>
                    <button onClick={() => deleteRoadmap(rm.id)} style={{ padding:"6px 10px", background:"#fce8e6", color:"var(--red)", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.72rem" }}>🗑️</button>
                  </div>
                </div>
              ))}
              {roadmaps.length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>
                  <div style={{ fontSize:"2rem", marginBottom:8 }}>📭</div>
                  <div style={{ fontSize:"0.85rem" }}>No roadmaps yet. Create your first one!</div>
                </div>
              )}
            </div>
          )}

          {/* ── EDIT / NEW VIEW */}
          {(view === "edit" || view === "new") && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Domain name */}
              <div>
                <label style={{ fontSize:"0.72rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", display:"block", marginBottom:6 }}>DOMAIN NAME</label>
                <input value={editForm.domain} onChange={e => setEditForm(f=>({...f,domain:e.target.value}))}
                  placeholder="e.g. Web Dev, AI / ML, Blockchain…"
                  style={{ width:"100%", padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.85rem", background:"var(--main-bg)", color:"var(--text)" }} />
              </div>
              {/* Icon picker */}
              <div>
                <label style={{ fontSize:"0.72rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", display:"block", marginBottom:6 }}>ICON</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {ICONS.map(ic => (
                    <div key={ic} onClick={() => setEditForm(f=>({...f,icon:ic}))}
                      style={{ width:36, height:36, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", cursor:"pointer", border:`2px solid ${editForm.icon===ic?"var(--blue)":"var(--border)"}`, background:editForm.icon===ic?"var(--blue-light)":"white", transition:"all 0.15s" }}>
                      {ic}
                    </div>
                  ))}
                </div>
              </div>
              {/* Steps */}
              <div>
                <label style={{ fontSize:"0.72rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", display:"block", marginBottom:8 }}>STEPS ({editForm.steps.length})</label>
                {editForm.steps.length === 0 && (
                  <div style={{ padding:12, background:"var(--main-bg)", borderRadius:10, fontSize:"0.78rem", color:"var(--muted)", textAlign:"center", marginBottom:10 }}>No steps yet. Add your first step below.</div>
                )}
                {editForm.steps.map((step, idx) => (
                  <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, border:"1px solid var(--border)", marginBottom:8, background:"var(--main-bg)" }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:"var(--blue)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.65rem", fontWeight:800, flexShrink:0 }}>{idx+1}</div>
                    <div style={{ flex:1, fontSize:"0.82rem", fontWeight:600 }}>{step}</div>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => moveStep(idx,-1)} disabled={idx===0} style={{ width:24, height:24, border:"1px solid var(--border)", borderRadius:6, background:"white", cursor:idx===0?"not-allowed":"pointer", fontSize:"0.7rem", opacity:idx===0?0.4:1 }}>↑</button>
                      <button onClick={() => moveStep(idx,1)} disabled={idx===editForm.steps.length-1} style={{ width:24, height:24, border:"1px solid var(--border)", borderRadius:6, background:"white", cursor:idx===editForm.steps.length-1?"not-allowed":"pointer", fontSize:"0.7rem", opacity:idx===editForm.steps.length-1?0.4:1 }}>↓</button>
                      <button onClick={() => removeStep(idx)} style={{ width:24, height:24, border:"none", borderRadius:6, background:"#fce8e6", color:"var(--red)", cursor:"pointer", fontSize:"0.75rem" }}>×</button>
                    </div>
                  </div>
                ))}
                {/* Add step */}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <input value={newStep} onChange={e => setNewStep(e.target.value)}
                    onKeyPress={e => e.key==="Enter" && addStep()}
                    placeholder="Add a step (e.g. Learn React Hooks)…"
                    style={{ flex:1, padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"var(--main-bg)", color:"var(--text)" }} />
                  <button onClick={addStep} disabled={!newStep.trim()} style={{ padding:"10px 16px", background:newStep.trim()?"var(--blue)":"var(--border)", color:"white", border:"none", borderRadius:10, cursor:newStep.trim()?"pointer":"not-allowed", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem" }}>+ Add</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:10, flexShrink:0 }}>
          {view === "list" ? (
            <button onClick={onClose} style={{ flex:1, padding:"12px", background:"var(--main-bg)", color:"var(--muted)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, cursor:"pointer" }}>Close</button>
          ) : (
            <>
              <button onClick={() => setView("list")} style={{ flex:1, padding:"12px", background:"var(--main-bg)", color:"var(--muted)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, cursor:"pointer" }}>← Back</button>
              <button onClick={saveEdit} disabled={!editForm.domain.trim() || editForm.steps.length===0}
                style={{ flex:2, padding:"12px", background:editForm.domain.trim()&&editForm.steps.length>0?"linear-gradient(135deg,var(--blue),var(--blue-dark))":"var(--border)", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, cursor:editForm.domain.trim()&&editForm.steps.length>0?"pointer":"not-allowed", fontSize:"0.88rem" }}>
                {view === "new" ? "🚀 Create Roadmap" : "💾 Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ROADMAP PAGE — dynamic, admin-editable
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// EXPLORE ROADMAPS PAGE — roadmap.sh style
// ══════════════════════════════════════════
const EXPLORE_ROADMAPS = [
  // ── ROLE-BASED ──────────────────────────────────────────────────────────────
  {
    id:"frontend", icon:"🖥️", name:"Frontend Development", tag:"Role-based",
    desc:"HTML, CSS, JavaScript, React — build everything users see and interact with.",
    color:"#e8f0fe", accent:"#1a73e8",
    tree:[
      { label:"Internet Basics", children:["How does the internet work?","HTTP / HTTPS","DNS & Domain Names","Browsers & how they work"] },
      { label:"HTML", children:["Semantic HTML","Forms & Validations","Accessibility (a11y)","SEO Basics"] },
      { label:"CSS", children:["Box Model","Flexbox","CSS Grid","Responsive Design","Animations & Transitions"] },
      { label:"JavaScript", children:["DOM Manipulation","Fetch API / AJAX","ES6+ Features","TypeScript Basics"] },
      { label:"Version Control", children:["Git Basics","GitHub / GitLab","Branching & Merging"] },
      { label:"Package Managers", children:["npm","yarn","pnpm"] },
      { label:"Frameworks", children:["React.js","Vue.js","Angular","Svelte"] },
      { label:"Build Tools", children:["Vite","Webpack","Babel","ESLint + Prettier"] },
      { label:"Testing", children:["Jest","React Testing Library","Cypress (E2E)"] },
      { label:"Deployment", children:["Vercel","Netlify","GitHub Pages","CI/CD Basics"] },
    ],
  },
  {
    id:"backend", icon:"⚙️", name:"Backend Development", tag:"Role-based",
    desc:"APIs, databases, servers — power the logic and data behind every application.",
    color:"#e6f4ea", accent:"#34a853",
    tree:[
      { label:"Internet & OS Basics", children:["HTTP Methods","REST principles","Terminal / CLI","OS Concepts"] },
      { label:"Programming Language", children:["Node.js","Python","Java","Go","Rust"] },
      { label:"Version Control", children:["Git","GitHub / GitLab"] },
      { label:"Databases", children:["PostgreSQL","MySQL","MongoDB","Redis (Caching)"] },
      { label:"APIs", children:["REST APIs","GraphQL","gRPC","OpenAPI / Swagger"] },
      { label:"Authentication", children:["JWT","OAuth 2.0","Session-based Auth","bcrypt / Hashing"] },
      { label:"Caching", children:["Redis","Memcached","CDN Caching"] },
      { label:"Message Brokers", children:["RabbitMQ","Kafka","Redis Pub/Sub"] },
      { label:"Containerization", children:["Docker","Docker Compose","Kubernetes basics"] },
      { label:"Deployment & CI/CD", children:["Linux servers","Nginx / Apache","GitHub Actions","AWS / GCP / Azure"] },
    ],
  },
  {
    id:"fullstack", icon:"🔀", name:"Full Stack", tag:"Role-based",
    desc:"Master both frontend and backend — build complete web applications end to end.",
    color:"#e8f5e9", accent:"#2e7d32",
    tree:[
      { label:"Web Fundamentals", children:["HTML5 & Semantic Markup","CSS3 & Responsive Design","JavaScript ES6+","How the Web Works"] },
      { label:"Frontend", children:["React.js / Vue.js","State Management","TypeScript","Component Architecture","Performance Optimization"] },
      { label:"Backend", children:["Node.js / Express","RESTful APIs","GraphQL","Authentication & Authorization","WebSockets"] },
      { label:"Databases", children:["SQL (PostgreSQL / MySQL)","NoSQL (MongoDB)","ORM / ODM (Prisma, Mongoose)","Database Design","Migrations"] },
      { label:"DevOps Basics", children:["Git & GitHub","Docker","CI/CD Pipelines","Linux & CLI","Environment Variables"] },
      { label:"Cloud & Hosting", children:["AWS / GCP / Azure Basics","Vercel / Netlify / Heroku","CDN & Edge","Domain & SSL","Serverless Functions"] },
      { label:"Testing", children:["Unit Testing (Jest)","Integration Testing","E2E (Playwright / Cypress)","API Testing (Postman)"] },
      { label:"Security", children:["OWASP Top 10","HTTPS & TLS","CORS","Rate Limiting","Input Validation"] },
      { label:"System Design Basics", children:["Monolith vs Microservices","Load Balancing","Caching Strategies","Message Queues","Scalability Principles"] },
      { label:"Soft Skills & Career", children:["Code Reviews","Agile / Scrum","Technical Writing","Portfolio Building","Open Source Contributions"] },
    ],
  },
  {
    id:"devops", icon:"🔧", name:"DevOps", tag:"Role-based",
    desc:"Automate, deploy, and scale — bridge the gap between development and operations.",
    color:"#fff3e0", accent:"#ea8600",
    tree:[
      { label:"OS & Linux Basics", children:["Shell scripting","File system","Process management","SSH"] },
      { label:"Version Control", children:["Git advanced","Git workflows","Monorepos"] },
      { label:"Networking", children:["DNS","Load Balancing","Firewalls","HTTP/HTTPS","TCP/IP"] },
      { label:"Containers", children:["Docker","Docker Compose","Container registries"] },
      { label:"CI/CD", children:["GitHub Actions","Jenkins","GitLab CI","CircleCI"] },
      { label:"Configuration Mgmt", children:["Ansible","Puppet","Chef"] },
      { label:"Container Orchestration", children:["Kubernetes","Helm","Service Mesh"] },
      { label:"Infrastructure as Code", children:["Terraform","Pulumi","CloudFormation"] },
      { label:"Cloud Providers", children:["AWS","Google Cloud","Azure"] },
      { label:"Monitoring", children:["Prometheus","Grafana","ELK Stack","Datadog"] },
    ],
  },
  {
    id:"devsecops", icon:"🔒", name:"DevSecOps", tag:"Role-based",
    desc:"Integrate security into every stage of the DevOps pipeline — shift left on security.",
    color:"#fce8e6", accent:"#c62828",
    tree:[
      { label:"DevOps Foundations", children:["CI/CD Pipelines","Docker & Kubernetes","Infrastructure as Code","Git Workflows"] },
      { label:"Security Fundamentals", children:["OWASP Top 10","Threat Modeling","Zero Trust Architecture","Defense in Depth"] },
      { label:"SAST & DAST", children:["Static Analysis (SonarQube, Semgrep)","Dynamic Analysis (OWASP ZAP, Burp Suite)","Code Review Security","Dependency Scanning"] },
      { label:"Container Security", children:["Image Scanning (Trivy, Snyk)","Runtime Security (Falco)","Kubernetes RBAC","Secrets in Containers"] },
      { label:"CI/CD Security", children:["Pipeline Hardening","Signed Commits","Branch Protection","Supply Chain Security (SLSA)"] },
      { label:"Secrets Management", children:["HashiCorp Vault","AWS Secrets Manager","Environment Variables Best Practices","Rotation Policies"] },
      { label:"Cloud Security", children:["IAM & Least Privilege","Security Groups & VPC","Cloud SIEM","Compliance Automation (AWS Config)"] },
      { label:"Compliance & Governance", children:["SOC 2","ISO 27001","GDPR","PCI DSS","Policy as Code (OPA)"] },
      { label:"Incident Response", children:["Detection & Alerting","Runbooks & Playbooks","Forensics Basics","Post-Mortem Culture"] },
      { label:"Security Automation", children:["SOAR Platforms","ChatOps for Security","Automated Remediation","Security Dashboards"] },
    ],
  },
  {
    id:"data-analyst", icon:"📈", name:"Data Analyst", tag:"Role-based",
    desc:"Turn raw data into business insights — master SQL, Excel, Python and visualization tools.",
    color:"#e8f5e9", accent:"#388e3c",
    tree:[
      { label:"Excel & Spreadsheets", children:["Formulas & Functions","Pivot Tables","VLOOKUP / XLOOKUP","Charts & Dashboards","Power Query"] },
      { label:"SQL Fundamentals", children:["SELECT, WHERE, GROUP BY","JOINs (Inner, Left, Right)","Subqueries & CTEs","Window Functions","Query Optimization"] },
      { label:"Python for Data", children:["Pandas","NumPy","Jupyter Notebooks","Data Cleaning","Automation Scripts"] },
      { label:"Statistics", children:["Descriptive Statistics","Probability Basics","Hypothesis Testing","Confidence Intervals","Correlation vs Causation"] },
      { label:"Data Visualization", children:["Matplotlib & Seaborn","Plotly","Tableau","Power BI","Storytelling with Data"] },
      { label:"Business Intelligence", children:["KPIs & Metrics","Dashboard Design","Looker / Metabase","Data Warehousing Concepts","ETL Basics"] },
      { label:"Data Cleaning & Wrangling", children:["Handling Missing Values","Outlier Detection","Data Transformation","Merging Datasets","Data Quality"] },
      { label:"A/B Testing & Experimentation", children:["Experiment Design","Statistical Significance","Sample Size Calculation","Interpreting Results"] },
      { label:"Databases & Big Data", children:["PostgreSQL","BigQuery","Snowflake","Spark Basics","Data Lakes vs Data Warehouses"] },
      { label:"Communication & Soft Skills", children:["Report Writing","Presenting to Stakeholders","Translating Data to Business","Excel Storytelling"] },
    ],
  },
  {
    id:"ai-engineer", icon:"🧠", name:"AI Engineer", tag:"Role-based",
    desc:"Build and deploy AI-powered applications — from prompt engineering to production LLM systems.",
    color:"#f3e8fd", accent:"#6a1b9a",
    tree:[
      { label:"Programming Foundations", children:["Python (advanced)","APIs & REST","Async Programming","Docker Basics","Git & Version Control"] },
      { label:"Machine Learning Basics", children:["Supervised vs Unsupervised","Model Training & Evaluation","Scikit-learn","Feature Engineering","Data Pipelines"] },
      { label:"Deep Learning", children:["Neural Networks","CNNs","RNNs / LSTMs","Transformers Architecture","Attention Mechanism"] },
      { label:"LLMs & Generative AI", children:["How LLMs Work","Prompt Engineering","Fine-tuning LLMs","LoRA / QLoRA","OpenAI API / Anthropic API"] },
      { label:"AI Frameworks & Tools", children:["LangChain","LlamaIndex","Hugging Face","LangGraph","Ollama (local models)"] },
      { label:"RAG & Vector Databases", children:["Retrieval-Augmented Generation","Embeddings","Pinecone / Weaviate / Chroma","Semantic Search","Chunking Strategies"] },
      { label:"AI Application Development", children:["Building AI Chatbots","AI Agents & Tool Use","Multi-modal AI","Streaming Responses","Context Management"] },
      { label:"MLOps for AI", children:["Model Serving (FastAPI, TorchServe)","Monitoring LLMs","Evaluation Frameworks","A/B Testing Models","Cost Optimization"] },
      { label:"Cloud AI Services", children:["AWS Bedrock","Azure OpenAI","Google Vertex AI","Managed Endpoints","Serverless Inference"] },
      { label:"Ethics & Safety", children:["Bias & Fairness","Hallucination Mitigation","Red Teaming","AI Safety Principles","GDPR & AI Regulations"] },
    ],
  },
  {
    id:"ai-data-scientist", icon:"🔬", name:"AI and Data Scientist", tag:"Role-based",
    desc:"Combine data science and AI — build, train and deploy intelligent models at scale.",
    color:"#e8eaf6", accent:"#3949ab",
    tree:[
      { label:"Mathematics & Statistics", children:["Linear Algebra","Calculus & Optimization","Probability Theory","Statistical Inference","Bayesian Methods"] },
      { label:"Programming", children:["Python (NumPy, Pandas, SciPy)","R Basics","SQL for Data Science","Jupyter / Colab","Version Control (Git)"] },
      { label:"Data Wrangling & EDA", children:["Data Cleaning","Exploratory Data Analysis","Feature Engineering","Handling Imbalanced Data","Outlier Detection"] },
      { label:"Classical Machine Learning", children:["Regression Models","Classification (SVM, Trees, KNN)","Clustering (K-Means, DBSCAN)","Ensemble Methods (XGBoost, RF)","Model Selection & Tuning"] },
      { label:"Deep Learning", children:["Neural Networks (MLP)","CNNs for Vision","RNNs / LSTMs for Sequences","Transformers","Transfer Learning"] },
      { label:"Generative AI", children:["GANs","VAEs","Diffusion Models","LLMs Fine-tuning","Prompt Engineering"] },
      { label:"NLP", children:["Text Preprocessing","TF-IDF & Word Embeddings","BERT / GPT","Named Entity Recognition","Sentiment Analysis"] },
      { label:"Computer Vision", children:["Image Classification","Object Detection (YOLO)","Segmentation","OpenCV","Medical Imaging"] },
      { label:"MLOps & Deployment", children:["ML Pipelines","Model Monitoring","MLflow / W&B","FastAPI for ML","Kubernetes for ML"] },
      { label:"Research & Communication", children:["Reading Papers (arXiv)","Writing Research Reports","A/B Testing","Experiment Tracking","Stakeholder Communication"] },
    ],
  },
  {
    id:"data-engineer", icon:"🗄️", name:"Data Engineer", tag:"Role-based",
    desc:"Build robust data pipelines and infrastructure — move, transform and serve data at scale.",
    color:"#e0f7fa", accent:"#00838f",
    tree:[
      { label:"Programming Foundations", children:["Python (advanced)","SQL (advanced)","Bash / Shell Scripting","Java / Scala Basics","Git & Version Control"] },
      { label:"Data Warehousing", children:["Data Warehouse Concepts","Star & Snowflake Schema","Dimensional Modeling","Slowly Changing Dimensions","Data Vault"] },
      { label:"ETL / ELT Pipelines", children:["Apache Airflow","dbt (Data Build Tool)","Prefect / Dagster","Pipeline Orchestration","Data Lineage"] },
      { label:"Batch & Stream Processing", children:["Apache Spark","Apache Kafka","Flink","Spark Streaming","Event-driven Architecture"] },
      { label:"Databases", children:["PostgreSQL (advanced)","MySQL","Cassandra","MongoDB","Redis"] },
      { label:"Cloud Data Platforms", children:["AWS (S3, Redshift, Glue)","GCP (BigQuery, Dataflow, Pub/Sub)","Azure (Synapse, Data Factory)","Snowflake","Databricks"] },
      { label:"Data Lakes & Lakehouses", children:["Data Lake Architecture","Delta Lake / Apache Iceberg","Parquet & ORC Formats","Hive Metastore","Unity Catalog"] },
      { label:"Data Quality & Governance", children:["Data Quality Checks (Great Expectations)","Data Cataloging (Amundsen, DataHub)","Data Contracts","GDPR Compliance","PII Handling"] },
      { label:"Infrastructure & DevOps", children:["Docker & Kubernetes","Terraform","CI/CD for Data","Monitoring (Grafana, Prometheus)","Cost Optimization"] },
      { label:"Analytics Engineering", children:["dbt Models","Metrics Layer","Semantic Layer","BI Integration","Self-Serve Analytics"] },
    ],
  },
  {
    id:"android", icon:"📱", name:"Android Development", tag:"Role-based",
    desc:"Build native Android apps with Kotlin — from layouts to Play Store deployment.",
    color:"#e8fdf5", accent:"#00897b",
    tree:[
      { label:"Kotlin Basics", children:["Syntax & Types","Functions","OOP in Kotlin","Coroutines"] },
      { label:"Android Core", children:["Activities","Fragments","Intents","Lifecycle"] },
      { label:"UI Development", children:["XML Layouts","Jetpack Compose","Material Design","RecyclerView"] },
      { label:"Architecture", children:["MVVM","LiveData","ViewModel","Clean Architecture"] },
      { label:"Networking", children:["Retrofit","OkHttp","REST APIs","Coroutines + Flow"] },
      { label:"Local Storage", children:["Room Database","SharedPreferences","DataStore"] },
      { label:"Dependency Injection", children:["Hilt","Dagger"] },
      { label:"Testing", children:["JUnit","Espresso","Mockito"] },
      { label:"Publishing", children:["Signing APK","Play Store listing","In-app purchases"] },
      { label:"Advanced Topics", children:["WorkManager","Push Notifications","Firebase","Maps SDK"] },
    ],
  },
  {
    id:"ios", icon:"🍎", name:"iOS Development", tag:"Role-based",
    desc:"Build native iOS apps with Swift and SwiftUI — from Xcode setup to App Store launch.",
    color:"#fce4ec", accent:"#c2185b",
    tree:[
      { label:"Swift Basics", children:["Syntax & Types","Optionals","Closures","Protocols & Extensions","Error Handling"] },
      { label:"Xcode & Tooling", children:["Xcode IDE","Simulators","Interface Builder","Instruments (Profiling)","Swift Package Manager"] },
      { label:"UIKit Fundamentals", children:["UIViewController","UITableView / UICollectionView","Auto Layout","Navigation Controllers","Storyboards vs Code"] },
      { label:"SwiftUI", children:["Views & Modifiers","State & Binding","Navigation","Lists & Forms","Animations"] },
      { label:"Architecture", children:["MVC","MVVM","Clean Architecture","Combine Framework","Async / Await"] },
      { label:"Networking", children:["URLSession","Codable & JSON","REST APIs","GraphQL with Apollo","WebSockets"] },
      { label:"Data Persistence", children:["UserDefaults","Core Data","SwiftData","Keychain","File Manager"] },
      { label:"Testing", children:["XCTest","UI Testing","Mocking","TDD Practices","Snapshot Testing"] },
      { label:"Advanced Topics", children:["Push Notifications (APNs)","ARKit","CoreML on-device","WidgetKit","App Clips"] },
      { label:"App Store Publishing", children:["Certificates & Provisioning","TestFlight","App Review Guidelines","ASO Basics","Analytics (Firebase / Mixpanel)"] },
    ],
  },
  {
    id:"ml", icon:"🤖", name:"Machine Learning", tag:"Role-based",
    desc:"Build intelligent systems that learn from data — from fundamentals to production AI.",
    color:"#f3e8fd", accent:"#8430ce",
    tree:[
      { label:"Math Foundations", children:["Linear Algebra","Calculus","Probability","Statistics"] },
      { label:"Python for ML", children:["NumPy","Pandas","Matplotlib","Scikit-learn"] },
      { label:"Core ML Algorithms", children:["Linear Regression","Logistic Regression","Decision Trees","SVM","K-Means","KNN"] },
      { label:"Model Evaluation", children:["Train/Test Split","Cross Validation","Metrics (F1, AUC)","Bias-Variance Tradeoff"] },
      { label:"Feature Engineering", children:["Feature Selection","Encoding","Scaling","PCA"] },
      { label:"Deep Learning", children:["Neural Networks","CNNs","RNNs / LSTMs","Transformers"] },
      { label:"Frameworks", children:["TensorFlow / Keras","PyTorch","Hugging Face"] },
      { label:"NLP", children:["Text Preprocessing","Word Embeddings","BERT / GPT","Fine-tuning LLMs"] },
      { label:"Computer Vision", children:["Image Classification","Object Detection","YOLO","OpenCV"] },
      { label:"MLOps", children:["Model Serving","Docker for ML","MLflow","CI/CD for ML"] },
    ],
  },
  {
    id:"blockchain", icon:"⛓️", name:"Blockchain", tag:"Role-based",
    desc:"Build decentralized applications — smart contracts, DeFi, NFTs and Web3 development.",
    color:"#fff8e1", accent:"#f57f17",
    tree:[
      { label:"Cryptography Basics", children:["Hash Functions (SHA-256)","Public/Private Keys","Digital Signatures","Merkle Trees","Elliptic Curve Cryptography"] },
      { label:"Blockchain Fundamentals", children:["Distributed Ledger Technology","Consensus Mechanisms (PoW, PoS)","Blocks & Chains","Nodes & Mining","Forks (Hard/Soft)"] },
      { label:"Ethereum & EVM", children:["Ethereum Architecture","Gas & Fees","Accounts (EOA vs Contract)","Transactions","EVM Internals"] },
      { label:"Solidity Smart Contracts", children:["Syntax & Data Types","Functions & Modifiers","Events & Errors","Inheritance","Security Patterns"] },
      { label:"Web3 Development", children:["ethers.js / web3.js","Connecting Wallets (MetaMask)","Reading Contract State","Sending Transactions","IPFS Integration"] },
      { label:"DeFi Protocols", children:["AMMs (Uniswap)","Lending (Aave, Compound)","Yield Farming","Liquidity Pools","Flash Loans"] },
      { label:"NFTs & Token Standards", children:["ERC-20","ERC-721 (NFTs)","ERC-1155","Metadata & IPFS","Marketplaces (OpenSea)"] },
      { label:"Layer 2 Solutions", children:["Optimistic Rollups (Optimism, Arbitrum)","ZK Rollups (zkSync, StarkNet)","Polygon","State Channels","Bridges"] },
      { label:"Security & Auditing", children:["Reentrancy Attacks","Integer Overflow","Access Control Issues","Slither & MythX","Smart Contract Audits"] },
      { label:"dApp Development", children:["Next.js + Web3","Hardhat / Foundry","Testing Smart Contracts","The Graph (Indexing)","Deployment to Mainnet"] },
    ],
  },
  {
    id:"postgresql", icon:"🐘", name:"PostgreSQL", tag:"Role-based",
    desc:"Master the world's most advanced open-source relational database — from queries to production.",
    color:"#e8eaf6", accent:"#3949ab",
    tree:[
      { label:"SQL Fundamentals", children:["SELECT, INSERT, UPDATE, DELETE","Filtering with WHERE","Sorting & Limiting","Aliases & Expressions","NULL Handling"] },
      { label:"Joins & Relationships", children:["INNER JOIN","LEFT / RIGHT JOIN","FULL OUTER JOIN","Self Joins","Cross Joins"] },
      { label:"Advanced Queries", children:["Subqueries","CTEs (WITH clause)","Window Functions","CASE Expressions","Lateral Joins"] },
      { label:"Indexes & Performance", children:["B-Tree Indexes","Partial & Composite Indexes","EXPLAIN & EXPLAIN ANALYZE","Vacuum & Autovacuum","Query Planning"] },
      { label:"Data Types", children:["Numeric & Text Types","Date & Time","JSONB","Arrays","UUID & Serial"] },
      { label:"Constraints & Integrity", children:["Primary & Foreign Keys","UNIQUE & NOT NULL","CHECK Constraints","Triggers","Cascade Rules"] },
      { label:"Stored Procedures & Functions", children:["PL/pgSQL Basics","Functions vs Procedures","Exception Handling","Cursors","Row-level Security"] },
      { label:"Transactions & Concurrency", children:["ACID Properties","BEGIN / COMMIT / ROLLBACK","Isolation Levels","Deadlocks","MVCC"] },
      { label:"Administration", children:["Roles & Permissions","Backup & Restore (pg_dump)","Replication","Connection Pooling (PgBouncer)","Monitoring"] },
      { label:"Advanced Features", children:["Full-Text Search","PostGIS (Geospatial)","Partitioning","Foreign Data Wrappers","Logical Replication"] },
    ],
  },
  {
    id:"qa", icon:"🧪", name:"QA Engineer", tag:"Role-based",
    desc:"Ensure software quality — master manual testing, automation, and CI/CD quality gates.",
    color:"#e0f2f1", accent:"#00695c",
    tree:[
      { label:"Testing Fundamentals", children:["SDLC & STLC","Types of Testing (Unit, Integration, E2E)","Black-box vs White-box","Test Case Design","Bug Lifecycle"] },
      { label:"Manual Testing", children:["Test Planning","Writing Test Cases","Exploratory Testing","Regression Testing","UAT (User Acceptance Testing)"] },
      { label:"Test Management", children:["JIRA / Zephyr","TestRail","Defect Reporting","Traceability Matrix","Test Metrics & Reporting"] },
      { label:"API Testing", children:["Postman","REST Assured","API Contract Testing","GraphQL Testing","Authentication Testing"] },
      { label:"Test Automation — Web", children:["Selenium WebDriver","Playwright","Cypress","Page Object Model","Locator Strategies (XPath, CSS)"] },
      { label:"Test Automation — Mobile", children:["Appium","Espresso (Android)","XCUITest (iOS)","Mobile Test Strategies","Device Farms (BrowserStack)"] },
      { label:"Performance Testing", children:["JMeter","k6","Load vs Stress vs Spike Testing","Performance Bottlenecks","Reporting"] },
      { label:"CI/CD & DevOps for QA", children:["GitHub Actions for Tests","Docker in Testing","Parallel Test Execution","Test Reporting (Allure)","Shift-Left Testing"] },
      { label:"Security Testing Basics", children:["OWASP Testing Guide","SQL Injection Testing","XSS Testing","Burp Suite Basics","Penetration Testing Fundamentals"] },
      { label:"AI in Testing", children:["AI Test Generation (Copilot, TestIM)","Visual Testing (Percy, Applitools)","Self-Healing Tests","Test Data Generation"] },
    ],
  },
  {
    id:"software-architect", icon:"🏗️", name:"Software Architect", tag:"Role-based",
    desc:"Design scalable, maintainable systems — from architecture patterns to technical leadership.",
    color:"#eceff1", accent:"#546e7a",
    tree:[
      { label:"Programming Mastery", children:["OOP Principles (SOLID)","Functional Programming Concepts","Design Patterns (GoF)","Clean Code","Code Smells & Refactoring"] },
      { label:"System Design Fundamentals", children:["Scalability & Availability","CAP Theorem","Load Balancing","Caching Strategies","CDN"] },
      { label:"Architecture Patterns", children:["Monolith","Microservices","Event-Driven Architecture","CQRS & Event Sourcing","Hexagonal Architecture"] },
      { label:"API Design", children:["REST Best Practices","GraphQL","gRPC","API Versioning","Rate Limiting & Throttling"] },
      { label:"Data Architecture", children:["Relational vs NoSQL","Data Modeling","Sharding & Partitioning","Data Warehouse vs Data Lake","Polyglot Persistence"] },
      { label:"Distributed Systems", children:["Consistency Models","Distributed Transactions (Saga)","Service Discovery","Circuit Breaker","Observability"] },
      { label:"Security Architecture", children:["Zero Trust Model","OAuth 2.0 / OIDC","Secrets Management","Threat Modeling","Secure SDLC"] },
      { label:"Cloud Architecture", children:["Well-Architected Framework (AWS)","Multi-region Design","Serverless Architecture","IaC (Terraform)","Cost Optimization"] },
      { label:"DevOps & Platform Engineering", children:["CI/CD Design","Container Orchestration (Kubernetes)","GitOps","Internal Developer Platforms","SLOs & SLAs"] },
      { label:"Technical Leadership", children:["Architecture Decision Records (ADR)","Tech Debt Management","Team Enablement","RFC Process","Mentoring Engineers"] },
    ],
  },
  {
    id:"cyber", icon:"🔐", name:"Cyber Security", tag:"Role-based",
    desc:"Protect systems and data — learn ethical hacking, defense, and security engineering.",
    color:"#e0f7fa", accent:"#00897b",
    tree:[
      { label:"Networking Basics", children:["TCP/IP","DNS","HTTP/HTTPS","Firewalls","VPN"] },
      { label:"OS & Linux", children:["Linux CLI","File Permissions","Process Management","Log Analysis"] },
      { label:"Programming", children:["Python scripting","Bash scripting","PowerShell"] },
      { label:"Cryptography", children:["Symmetric/Asymmetric","Hashing (SHA, MD5)","PKI & Certificates","TLS/SSL"] },
      { label:"Web Security", children:["OWASP Top 10","SQL Injection","XSS","CSRF","Security Headers"] },
      { label:"Ethical Hacking", children:["Reconnaissance","Scanning (Nmap)","Exploitation","Metasploit","Burp Suite"] },
      { label:"Defense", children:["SIEM","IDS/IPS","Incident Response","Threat Hunting"] },
      { label:"Cloud Security", children:["AWS IAM","Zero Trust","Cloud SIEM"] },
      { label:"Compliance", children:["GDPR","ISO 27001","SOC 2","NIST Framework"] },
      { label:"Certifications", children:["CompTIA Security+","CEH","OSCP","CISSP"] },
    ],
  },
  {
    id:"ux-design", icon:"🎨", name:"UX Design", tag:"Role-based",
    desc:"Design intuitive user experiences — from user research and wireframes to polished UI.",
    color:"#fce4ec", accent:"#e91e63",
    tree:[
      { label:"UX Fundamentals", children:["What is UX Design?","UX vs UI","Design Thinking Process","Human-Centered Design","Accessibility (WCAG)"] },
      { label:"User Research", children:["User Interviews","Surveys & Questionnaires","Usability Testing","Contextual Inquiry","Affinity Mapping"] },
      { label:"Information Architecture", children:["Card Sorting","Site Maps","Navigation Design","Content Strategy","Mental Models"] },
      { label:"Wireframing & Prototyping", children:["Low-fidelity Wireframes","High-fidelity Mockups","Interactive Prototypes","Figma / Sketch / Adobe XD","Rapid Prototyping"] },
      { label:"Visual Design", children:["Typography","Color Theory","Grid Systems","Iconography","Design Systems (Atomic Design)"] },
      { label:"Interaction Design", children:["Microinteractions","Animation Principles","Gesture-based Design","Voice UI Basics","Error States & Empty States"] },
      { label:"Design Tools", children:["Figma (master)","Protopie","Maze (testing)","Zeplin / Avocode","Miro / FigJam"] },
      { label:"Design Systems", children:["Component Libraries","Design Tokens","Documentation","Storybook","Handoff to Developers"] },
      { label:"Metrics & Analytics", children:["Heuristic Evaluation","A/B Testing","User Metrics (NPS, CSAT)","Analytics (Mixpanel, Hotjar)","Accessibility Audits"] },
      { label:"Career & Portfolio", children:["Case Study Writing","Portfolio (Behance / Dribbble)","UX Writing Basics","Working with Agile Teams","UX Leadership"] },
    ],
  },
  {
    id:"technical-writer", icon:"✍️", name:"Technical Writer", tag:"Role-based",
    desc:"Create clear, accurate technical documentation — API docs, guides, tutorials and more.",
    color:"#f3e8fd", accent:"#7b1fa2",
    tree:[
      { label:"Writing Fundamentals", children:["Plain Language Principles","Technical Grammar & Style","Audience Analysis","Active vs Passive Voice","Structuring Content"] },
      { label:"Types of Documentation", children:["API Documentation","User Guides & Manuals","Tutorials & How-tos","Release Notes","Runbooks & SOPs"] },
      { label:"Docs-as-Code", children:["Markdown & MDX","Git for Writers","Static Site Generators (Docusaurus, MkDocs)","CI/CD for Docs","Pull Request Reviews"] },
      { label:"API Documentation", children:["OpenAPI / Swagger","Postman Documentation","REST API Docs","GraphQL Schema Docs","Code Samples"] },
      { label:"Tools & Platforms", children:["Confluence / Notion","GitBook","Readme.io","Zendesk / Intercom","Figma for Diagrams"] },
      { label:"Diagrams & Visual Content", children:["Flowcharts (Mermaid, Lucidchart)","Architecture Diagrams","Screenshots & Annotations","Video Screencasts","Infographics"] },
      { label:"Information Architecture", children:["Content Strategy","Navigation Design","Search Optimization (Docs SEO)","Content Auditing","Taxonomy"] },
      { label:"Working with Developers", children:["Reading Code (Python, JS basics)","Testing APIs (Postman)","Attending Sprint Reviews","Interviewing SMEs","Dev Workflows (Jira, GitHub)"] },
      { label:"Localization & Accessibility", children:["Writing for Translation","RTL Languages","Alt Text & Captions","WCAG for Docs","Content Style Guides"] },
      { label:"Metrics & Improvement", children:["Docs Analytics (Google Analytics)","Feedback Collection","Content Freshness Reviews","NPS for Documentation","Continuous Improvement"] },
    ],
  },
  {
    id:"game-developer", icon:"🎮", name:"Game Developer", tag:"Role-based",
    desc:"Build interactive games — from game loop fundamentals to publishing on major platforms.",
    color:"#e8f5e9", accent:"#2e7d32",
    tree:[
      { label:"Programming Fundamentals", children:["C# (for Unity)","C++ (for Unreal)","Object-Oriented Programming","Data Structures for Games","Memory Management"] },
      { label:"Game Engine — Unity", children:["Unity Editor Overview","GameObjects & Components","MonoBehaviour Lifecycle","Physics (Rigidbody, Colliders)","Animation System"] },
      { label:"Game Engine — Unreal", children:["Unreal Editor Overview","Blueprints Visual Scripting","C++ in Unreal","Nanite & Lumen","Level Streaming"] },
      { label:"2D Game Development", children:["Sprites & Tilemaps","2D Physics","Camera Systems","Particle Effects","2D Animation"] },
      { label:"3D Game Development", children:["3D Modeling Basics (Blender)","Lighting & Shaders","LOD (Level of Detail)","Navmesh & Pathfinding","3D Animation & Rigging"] },
      { label:"Game AI", children:["Finite State Machines","Behaviour Trees","A* Pathfinding","Enemy AI Patterns","Procedural Generation"] },
      { label:"Multiplayer & Networking", children:["Client-Server Architecture","UDP vs TCP for Games","Mirror / Photon (Unity)","Lag Compensation","Leaderboards & Matchmaking"] },
      { label:"Audio & VFX", children:["Sound Design Basics","Unity Audio System","Shader Graph","Visual Effects Graph","Post-Processing"] },
      { label:"Monetisation & Business", children:["Free-to-Play Models","In-app Purchases","Ad Integration","Analytics (GameAnalytics)","A/B Testing"] },
      { label:"Publishing", children:["Steam Publishing","App Store / Google Play","Console Certification (Xbox, PlayStation)","Performance Profiling","Marketing Basics"] },
    ],
  },
  {
    id:"server-side-game-developer", icon:"🖥️", name:"Server Side Game Developer", tag:"Role-based",
    desc:"Build game backends — matchmaking, real-time networking, game servers and cloud infrastructure.",
    color:"#e8f0fe", accent:"#1565c0",
    tree:[
      { label:"Backend Fundamentals", children:["Node.js / Go / C++","REST & WebSocket APIs","HTTP vs UDP","Concurrency & Threading","Memory & Performance"] },
      { label:"Real-time Networking", children:["WebSockets","UDP Networking","Netcode Fundamentals","Client Prediction","Server Reconciliation & Lag Compensation"] },
      { label:"Game Server Architecture", children:["Dedicated vs Peer-to-Peer","Session-based Servers","Authoritative Server Model","Headless Game Servers","Zoning & Instancing"] },
      { label:"Matchmaking & Lobbies", children:["Skill-based Matchmaking (ELO / Glicko)","Lobby Systems","Queue Management","Party Systems","Regional Matching"] },
      { label:"Databases for Games", children:["Player Profiles (PostgreSQL / MongoDB)","Redis for Sessions & Leaderboards","Time-series Data (InfluxDB)","Save State Management","ACID vs Eventually Consistent"] },
      { label:"Game Economy & Live Ops", children:["Virtual Currency Systems","Inventory Management","Event Systems (Battle Pass)","Configuration Management","A/B Testing Live Features"] },
      { label:"Anti-cheat & Security", children:["Server-side Validation","Speed Hack Detection","Replay System","Ban Systems","DDoS Mitigation"] },
      { label:"Cloud & Scaling", children:["AWS GameLift / PlayFab / Nakama","Auto-scaling Game Servers","CDN for Game Assets","Global Region Routing","Cost Optimization"] },
      { label:"Observability", children:["Logging (ELK Stack)","Metrics (Prometheus / Grafana)","Distributed Tracing","Alerting & On-call","Performance Benchmarking"] },
      { label:"DevOps for Game Servers", children:["Docker & Kubernetes","CI/CD for Game Builds","Blue-Green Deployments","Configuration as Code","Chaos Engineering"] },
    ],
  },
  {
    id:"mlops", icon:"⚙️", name:"MLOps", tag:"Role-based",
    desc:"Productionize machine learning — automate training, deployment and monitoring of ML models.",
    color:"#fff3e0", accent:"#e65100",
    tree:[
      { label:"ML Fundamentals for MLOps", children:["ML Workflow Overview","Model Training & Evaluation","Overfitting & Underfitting","Feature Engineering","Model Versioning"] },
      { label:"Data Engineering for ML", children:["Data Pipelines (Airflow, Prefect)","Feature Stores (Feast, Tecton)","Data Versioning (DVC)","Data Validation (Great Expectations)","Data Lineage"] },
      { label:"Experiment Tracking", children:["MLflow","Weights & Biases","Neptune.ai","Experiment Metadata","Comparing Runs & Artifacts"] },
      { label:"Model Packaging & Serving", children:["Docker for ML","FastAPI / Flask Model APIs","TorchServe / TF Serving","ONNX Runtime","BentoML / Seldon Core"] },
      { label:"CI/CD for ML", children:["ML Pipelines (Kubeflow, Vertex AI)","Automated Retraining","Model Registry","Canary & Shadow Deployments","GitHub Actions for ML"] },
      { label:"Kubernetes for ML", children:["Kubernetes Basics","Helm Charts","KServe","GPU Scheduling","Resource Quotas & Limits"] },
      { label:"Model Monitoring", children:["Data Drift Detection (Evidently)","Concept Drift","Model Performance Monitoring","Alerting & Dashboards","Feedback Loops"] },
      { label:"Cloud ML Platforms", children:["AWS SageMaker","Google Vertex AI","Azure ML Studio","Managed Endpoints","Spot Instance Training"] },
      { label:"LLMOps", children:["LLM Fine-tuning Pipelines","Prompt Versioning","RAG System Monitoring","Evaluation Frameworks (RAGAS)","Cost Tracking"] },
      { label:"Governance & Compliance", children:["Model Cards","Responsible AI","Audit Trails","GDPR for ML","Bias Detection"] },
    ],
  },
  {
    id:"product-manager", icon:"📋", name:"Product Manager", tag:"Role-based",
    desc:"Define what to build and why — strategy, roadmaps, user research and cross-team execution.",
    color:"#e8f5e9", accent:"#1b5e20",
    tree:[
      { label:"PM Fundamentals", children:["What is Product Management?","PM vs PO vs PMM","Product Lifecycle","Agile & Scrum for PMs","Working with Engineering Teams"] },
      { label:"User Research", children:["User Interviews","Jobs-to-be-Done Framework","Personas & User Journeys","Usability Testing","Quantitative vs Qualitative Research"] },
      { label:"Product Strategy", children:["Vision & Mission","Market Research & Competitive Analysis","Business Models","OKRs & Goal Setting","North Star Metric"] },
      { label:"Roadmapping & Prioritization", children:["Product Roadmaps","RICE / ICE Scoring","MoSCoW Framework","Opportunity Solution Tree","Now / Next / Later"] },
      { label:"Data & Analytics", children:["Product Metrics (DAU, MAU, Retention)","Funnel Analysis","Cohort Analysis","A/B Testing","SQL for PMs"] },
      { label:"Writing & Communication", children:["PRDs (Product Requirements Docs)","User Stories","Acceptance Criteria","Stakeholder Management","Exec Presentations"] },
      { label:"Design Collaboration", children:["UX Basics for PMs","Wireframe Reviews","Design Sprints","Prototyping Tools (Figma)","Accessibility Awareness"] },
      { label:"Go-to-Market", children:["Launch Planning","Pricing Strategy","Feature Flagging","Beta Programs","Customer Success Collaboration"] },
      { label:"Tools", children:["Jira / Linear","Productboard / Amplitude","Notion / Confluence","Mixpanel / Heap","Miro / FigJam"] },
      { label:"Career Growth", children:["PM Interview Prep","Case Studies","PM Frameworks (Marty Cagan)","Building a PM Portfolio","Leadership & Influence"] },
    ],
  },
  {
    id:"engineering-manager", icon:"👔", name:"Engineering Manager", tag:"Role-based",
    desc:"Lead engineering teams — hiring, delivery, culture and technical strategy at scale.",
    color:"#eceff1", accent:"#37474f",
    tree:[
      { label:"Transition to Management", children:["IC to EM Transition","Manager vs Tech Lead","First 90 Days","Letting Go of Coding","Building Trust Quickly"] },
      { label:"People Management", children:["1:1 Meetings","Performance Reviews","Career Development Plans","Giving & Receiving Feedback","Managing Underperformance"] },
      { label:"Hiring & Team Building", children:["Writing Job Descriptions","Technical Interview Design","Diverse Hiring Practices","Onboarding Engineers","Team Composition"] },
      { label:"Delivery & Execution", children:["Agile / Scrum / Kanban","Sprint Planning & Retrospectives","Removing Blockers","Managing Dependencies","Estimation & Deadlines"] },
      { label:"Technical Strategy", children:["Tech Debt Prioritization","Architecture Reviews","Build vs Buy Decisions","Engineering Principles","Roadmap Input"] },
      { label:"Cross-functional Collaboration", children:["Working with Product Managers","Stakeholder Communication","Engineering <> Design","Company-wide OKRs","Escalation Paths"] },
      { label:"Engineering Culture", children:["Psychological Safety","Blameless Post-mortems","Recognition & Motivation","Remote Team Culture","Diversity, Equity & Inclusion"] },
      { label:"Metrics & Reporting", children:["DORA Metrics","Velocity & Throughput","Headcount Planning","Engineering KPIs","Executive Reporting"] },
      { label:"Incident & Crisis Management", children:["On-call Rotations","Incident Commander Role","Communication During Outages","Post-Mortems","Reducing MTTR"] },
      { label:"Leadership Development", children:["Coaching & Mentoring","Senior EM / Director Path","Influencing without Authority","Managing Managers","Personal Leadership Style"] },
    ],
  },
  {
    id:"developer-relations", icon:"🤝", name:"Developer Relations", tag:"Role-based",
    desc:"Build developer communities, create technical content and advocate for developers at tech companies.",
    color:"#e8f0fe", accent:"#1a237e",
    tree:[
      { label:"DevRel Fundamentals", children:["What is Developer Relations?","DevRel vs Developer Marketing vs Developer Experience","DevRel Pillars (Community, Content, Product)","Measuring DevRel Success","DevRel Team Structures"] },
      { label:"Technical Skills", children:["Coding in Multiple Languages","API & SDK Usage","Building Demos & Samples","Reading & Contributing to Docs","Understanding Developer Pain Points"] },
      { label:"Content Creation", children:["Technical Blog Posts","Video Tutorials (YouTube)","Live Coding Streams (Twitch)","Podcasts","Open Source Examples & Repos"] },
      { label:"Public Speaking", children:["Conference Talks","Workshop Facilitation","Webinars","Demo Presentations","Talk Proposal (CFP) Writing"] },
      { label:"Community Building", children:["Discord / Slack Communities","Forums & GitHub Discussions","Ambassador Programs","Hackathon Organizing","Developer Events"] },
      { label:"Developer Experience (DX)", children:["API Design Review","Documentation Feedback","SDK Developer Ergonomics","Onboarding Flow Audits","DX Metrics"] },
      { label:"Social Media & Outreach", children:["Twitter / X for Developers","LinkedIn Thought Leadership","Dev.to & Hashnode","Newsletter Building","Open Source Contributions"] },
      { label:"Product Feedback Loop", children:["Capturing Developer Feedback","Feature Request Triage","Working with Product Teams","Beta Programs","Developer Surveys"] },
      { label:"Analytics & Metrics", children:["Community Growth Metrics","Content Reach & Engagement","SDK / API Adoption","Event ROI","Developer NPS"] },
      { label:"Career in DevRel", children:["Building a DevRel Portfolio","Technical Writing for DevRel","Speaking Portfolio","Networking in the Community","DevRel Interview Prep"] },
    ],
  },
  {
    id:"bi-analyst", icon:"📊", name:"BI Analyst", tag:"Role-based",
    desc:"Transform data into business intelligence — dashboards, reports and data-driven decisions.",
    color:"#fff8e1", accent:"#f9a825",
    tree:[
      { label:"BI Fundamentals", children:["What is Business Intelligence?","OLTP vs OLAP","Data Warehouse Concepts","Dimensional Modeling (Star Schema)","ETL vs ELT"] },
      { label:"SQL for BI", children:["Advanced SELECT Queries","Window Functions","CTEs & Subqueries","Query Optimization","Date & Time Manipulation"] },
      { label:"Data Visualization Principles", children:["Choosing the Right Chart","Visual Hierarchy","Color Theory for Data","Decluttering (Edward Tufte)","Dashboard Layout Best Practices"] },
      { label:"Tableau", children:["Connecting to Data Sources","Calculated Fields","Filters & Parameters","Level of Detail (LOD) Expressions","Publishing to Tableau Server / Cloud"] },
      { label:"Power BI", children:["Power Query (ETL)","DAX (Data Analysis Expressions)","Data Modeling in Power BI","Interactive Reports","Power BI Service & Workspace"] },
      { label:"Looker & Other BI Tools", children:["LookML Basics","Metabase","Superset","Redash","Embedded Analytics"] },
      { label:"Data Warehouses", children:["Snowflake","BigQuery","Amazon Redshift","Azure Synapse","dbt for Transformation"] },
      { label:"Data Storytelling", children:["Narrative Frameworks","Executive Dashboards","KPI Definition","Ad-hoc Analysis","Presenting Insights to Stakeholders"] },
      { label:"Advanced Analytics", children:["Statistical Analysis in BI","Predictive Analytics Basics","Python / R in BI Tools","Anomaly Detection","Trend Analysis"] },
      { label:"Governance & Best Practices", children:["Data Catalog & Lineage","Row-Level Security","Certified Datasets","Version Control for Reports","Documentation"] },
    ],
  },
  {
    id:"data-science", icon:"📉", name:"Data Science", tag:"Role-based",
    desc:"Extract insights from data using statistics, visualization, and machine learning.",
    color:"#fce8e6", accent:"#d93025",
    tree:[
      { label:"Programming", children:["Python","R basics","Jupyter Notebooks"] },
      { label:"Mathematics", children:["Linear Algebra","Statistics & Probability","Calculus basics"] },
      { label:"Data Wrangling", children:["NumPy","Pandas","Data Cleaning"] },
      { label:"Visualization", children:["Matplotlib","Seaborn","Plotly","Tableau"] },
      { label:"Machine Learning", children:["Scikit-learn","Supervised Learning","Unsupervised Learning","Model Evaluation"] },
      { label:"SQL & Databases", children:["SQL Queries","PostgreSQL","BigQuery"] },
      { label:"Big Data", children:["Spark","Hadoop","Hive"] },
      { label:"Deep Learning", children:["TensorFlow","PyTorch","Neural Networks"] },
      { label:"MLOps", children:["Model Deployment","MLflow","Feature Stores"] },
      { label:"Capstone Projects", children:["End-to-end project","Kaggle competitions","Portfolio building"] },
    ],
  },
  // ── SKILL-BASED ─────────────────────────────────────────────────────────────
  {
    id:"dsa", icon:"🧮", name:"Data Structures & Algorithms", tag:"Skill-based",
    desc:"Master the core CS fundamentals needed for technical interviews and efficient coding.",
    color:"#fff8e1", accent:"#f9a825",
    tree:[
      { label:"Complexity Analysis", children:["Big O Notation","Time Complexity","Space Complexity","Amortized Analysis"] },
      { label:"Arrays & Strings", children:["Two Pointers","Sliding Window","Prefix Sum","Kadane's Algorithm"] },
      { label:"Linked Lists", children:["Singly / Doubly","Fast & Slow Pointers","Reversal","Merge"] },
      { label:"Stacks & Queues", children:["Monotonic Stack","Deque","Priority Queue"] },
      { label:"Hash Maps & Sets", children:["Hash Functions","Collision Handling","LRU Cache"] },
      { label:"Trees", children:["Binary Trees","BST","AVL / Red-Black","Segment Trees","Tries"] },
      { label:"Graphs", children:["BFS","DFS","Dijkstra","Bellman-Ford","Topological Sort","Union Find"] },
      { label:"Sorting", children:["Merge Sort","Quick Sort","Heap Sort","Counting Sort"] },
      { label:"Dynamic Programming", children:["Memoization","Tabulation","Knapsack","LCS","LIS"] },
      { label:"Advanced Topics", children:["Backtracking","Greedy","Divide & Conquer","Bit Manipulation"] },
    ],
  },
  {
    id:"sql", icon:"🗃️", name:"SQL", tag:"Skill-based",
    desc:"Master structured query language — from basic queries to advanced database design.",
    color:"#e8f0fe", accent:"#1a73e8",
    tree:[
      { label:"SQL Basics", children:["SELECT & FROM","WHERE Clauses","ORDER BY & LIMIT","INSERT, UPDATE, DELETE","NULL Handling"] },
      { label:"Filtering & Aggregation", children:["AND / OR / NOT","BETWEEN & IN","LIKE & Wildcards","GROUP BY","HAVING","COUNT, SUM, AVG, MIN, MAX"] },
      { label:"Joins", children:["INNER JOIN","LEFT / RIGHT JOIN","FULL OUTER JOIN","Self Join","Cross Join","Multiple Table Joins"] },
      { label:"Subqueries & CTEs", children:["Scalar Subqueries","Correlated Subqueries","WITH (CTE)","Recursive CTEs","EXISTS & NOT EXISTS"] },
      { label:"Window Functions", children:["ROW_NUMBER()","RANK() & DENSE_RANK()","LAG() & LEAD()","SUM() OVER","PARTITION BY"] },
      { label:"Indexes & Performance", children:["What are Indexes?","B-Tree Index","Composite Index","EXPLAIN / Query Plan","Index Best Practices"] },
      { label:"Database Design", children:["Normalization (1NF, 2NF, 3NF)","Primary & Foreign Keys","Entity-Relationship Diagrams","Constraints","Transactions & ACID"] },
      { label:"Advanced SQL", children:["PIVOT / UNPIVOT","Dynamic SQL","Stored Procedures","Triggers","Views & Materialized Views"] },
      { label:"SQL in Practice", children:["PostgreSQL","MySQL","SQLite","BigQuery Dialect","Interview Query Patterns"] },
      { label:"Project", children:["E-commerce Database Design","Analytics Query Set","Data Cleaning with SQL","Reporting Dashboard Queries"] },
    ],
  },
  {
    id:"computer-science", icon:"🖥️", name:"Computer Science", tag:"Skill-based",
    desc:"Core CS theory and fundamentals — the knowledge behind every great software engineer.",
    color:"#eceff1", accent:"#546e7a",
    tree:[
      { label:"Computational Thinking", children:["Abstraction","Decomposition","Pattern Recognition","Algorithms & Problem Solving"] },
      { label:"Data Structures", children:["Arrays","Linked Lists","Stacks & Queues","Trees","Graphs","Hash Tables","Heaps"] },
      { label:"Algorithms", children:["Sorting (Merge, Quick, Heap)","Searching (Binary, BFS, DFS)","Greedy Algorithms","Dynamic Programming","Divide & Conquer"] },
      { label:"Computer Architecture", children:["Binary & Number Systems","CPU & Memory","Instruction Sets","Cache & Pipelining","I/O Systems"] },
      { label:"Operating Systems", children:["Processes & Threads","Memory Management","File Systems","Scheduling Algorithms","Deadlocks & Concurrency"] },
      { label:"Networking", children:["OSI Model","TCP/IP","DNS & HTTP","Sockets","Network Security Basics"] },
      { label:"Databases", children:["Relational Model","SQL Fundamentals","ACID Properties","Indexing","NoSQL Basics"] },
      { label:"Programming Paradigms", children:["Procedural","Object-Oriented (OOP)","Functional","Declarative","Event-Driven"] },
      { label:"Theory of Computation", children:["Automata Theory","Turing Machines","P vs NP","Complexity Classes","Formal Languages"] },
      { label:"Software Engineering", children:["SDLC","Design Patterns","Version Control","Testing Principles","Clean Code"] },
    ],
  },
  {
    id:"react", icon:"⚛️", name:"React", tag:"Skill-based",
    desc:"Build dynamic UIs with the world's most popular frontend library — from basics to advanced patterns.",
    color:"#e8f0fe", accent:"#0288d1",
    tree:[
      { label:"React Fundamentals", children:["What is React?","JSX Syntax","Components (Function vs Class)","Props","Rendering & Virtual DOM"] },
      { label:"State & Lifecycle", children:["useState Hook","useEffect Hook","Component Lifecycle","Controlled vs Uncontrolled Components","Event Handling"] },
      { label:"Hooks (Deep Dive)", children:["useContext","useReducer","useRef","useMemo & useCallback","Custom Hooks"] },
      { label:"Component Patterns", children:["Composition","Render Props","Higher-Order Components (HOC)","Compound Components","Portals"] },
      { label:"Routing", children:["React Router v6","Nested Routes","Dynamic Routes","Protected Routes","useNavigate & useParams"] },
      { label:"State Management", children:["Context API","Redux Toolkit","Zustand","Jotai / Recoil","React Query (Server State)"] },
      { label:"Styling", children:["CSS Modules","Styled Components","Tailwind CSS with React","Emotion","Shadcn / Radix UI"] },
      { label:"Performance", children:["React.memo","Code Splitting (lazy + Suspense)","useTransition","Profiler","Bundle Optimization"] },
      { label:"Testing", children:["Jest + React Testing Library","Unit Testing Components","Mocking","Integration Tests","Snapshot Testing"] },
      { label:"Ecosystem & Meta-Frameworks", children:["Next.js","Remix","Vite","Storybook","React Native (intro)"] },
    ],
  },
  {
    id:"vue", icon:"💚", name:"Vue", tag:"Skill-based",
    desc:"Build elegant progressive web apps with Vue.js — from Options API to Composition API.",
    color:"#e6f4ea", accent:"#2e7d32",
    tree:[
      { label:"Vue Basics", children:["Vue Instance","Template Syntax","Directives (v-if, v-for, v-bind)","Data & Methods","Computed Properties & Watchers"] },
      { label:"Components", children:["Single File Components (.vue)","Props & Emits","Slots","Dynamic Components","Component Lifecycle"] },
      { label:"Composition API", children:["setup()","ref & reactive","computed & watch","Composables","defineProps & defineEmits"] },
      { label:"Vue Router", children:["Route Configuration","Dynamic Routes","Navigation Guards","Nested Routes","Route Meta"] },
      { label:"State Management", children:["Pinia (recommended)","Vuex Basics","Store Modules","Actions & Getters","DevTools"] },
      { label:"Forms & Validation", children:["v-model (deep)","Form Handling","VeeValidate","Zod with Vue","Custom Form Components"] },
      { label:"HTTP & API", children:["Axios","Fetch API","useFetch Composable","Error Handling","Loading States"] },
      { label:"Performance", children:["v-memo","KeepAlive","Lazy Loading Components","Virtual Scrolling","Bundle Splitting"] },
      { label:"Testing", children:["Vue Test Utils","Vitest","Component Testing","Mocking Pinia","E2E with Cypress"] },
      { label:"Ecosystem", children:["Nuxt.js","Vite Plugin Vue","Quasar Framework","Vuetify","VueUse (composable library)"] },
    ],
  },
  {
    id:"angular", icon:"🔺", name:"Angular", tag:"Skill-based",
    desc:"Build enterprise-scale applications with Angular — TypeScript-first, full framework.",
    color:"#fce8e6", accent:"#c62828",
    tree:[
      { label:"Angular Basics", children:["Angular CLI","Modules & NgModule","Components","Templates & Data Binding","Directives (Built-in & Custom)"] },
      { label:"TypeScript in Angular", children:["Decorators","Interfaces & Types","Generics","Enums","Strict Mode"] },
      { label:"Services & DI", children:["Dependency Injection","Singleton Services","Providers","HTTP Client","Interceptors"] },
      { label:"Routing", children:["RouterModule","Route Guards","Lazy Loading Modules","Route Resolvers","Router Events"] },
      { label:"Forms", children:["Template-driven Forms","Reactive Forms","FormBuilder","Validators","Custom Validators","FormArray"] },
      { label:"RxJS & Observables", children:["Observables & Observers","Operators (map, filter, switchMap)","Subjects","AsyncPipe","Error Handling"] },
      { label:"State Management", children:["NgRx Store","Actions & Reducers","Selectors","NgRx Effects","Signal Store (Angular 17+)"] },
      { label:"Angular Signals (v17+)", children:["signal()","computed()","effect()","Signal-based Components","Interop with RxJS"] },
      { label:"Testing", children:["TestBed","ComponentFixture","Jasmine & Karma","Spectator","E2E with Playwright"] },
      { label:"Performance & Deployment", children:["Change Detection Strategy","OnPush","Track By","SSR with Angular Universal","Build Optimization"] },
    ],
  },
  {
    id:"javascript", icon:"🟨", name:"JavaScript", tag:"Skill-based",
    desc:"Master the language of the web — from fundamentals to advanced JS patterns and the ecosystem.",
    color:"#fff8e1", accent:"#f57f17",
    tree:[
      { label:"Fundamentals", children:["Variables (var, let, const)","Data Types","Operators","Control Flow (if, switch, loops)","Functions"] },
      { label:"Arrays & Objects", children:["Array Methods (map, filter, reduce)","Object Methods","Destructuring","Spread & Rest","Optional Chaining & Nullish Coalescing"] },
      { label:"Functions (Deep Dive)", children:["First-class Functions","Closures","IIFE","Arrow Functions","Higher-Order Functions","Currying"] },
      { label:"Asynchronous JS", children:["Callbacks","Promises (.then, .catch, .finally)","async / await","Event Loop & Call Stack","Microtasks vs Macrotasks"] },
      { label:"DOM & Browser APIs", children:["DOM Selection & Manipulation","Events & Event Delegation","Fetch API","Local Storage / Session Storage","Web APIs (Geolocation, Notifications)"] },
      { label:"ES6+ Features", children:["Modules (import / export)","Classes & Inheritance","Symbols","Iterators & Generators","Proxy & Reflect"] },
      { label:"Error Handling & Debugging", children:["try / catch / finally","Custom Error Classes","Stack Traces","Chrome DevTools","Debugging Async Code"] },
      { label:"OOP in JavaScript", children:["Prototype Chain","Constructor Functions","ES6 Classes","Encapsulation & Polymorphism","Design Patterns (Singleton, Observer, Factory)"] },
      { label:"Functional Programming", children:["Pure Functions","Immutability","Function Composition","Functors & Monads","Ramda / fp-ts intro"] },
      { label:"Tooling & Ecosystem", children:["npm / yarn","Babel","Webpack / Vite / Rollup","ESLint & Prettier","TypeScript intro"] },
    ],
  },
  {
    id:"typescript", icon:"🔷", name:"TypeScript", tag:"Skill-based",
    desc:"Add static typing to JavaScript — write safer, more maintainable code at scale.",
    color:"#e8f0fe", accent:"#1565c0",
    tree:[
      { label:"TypeScript Basics", children:["What is TypeScript?","tsconfig.json","Basic Types (string, number, boolean, null, undefined)","Type Annotations","Type Inference"] },
      { label:"Interfaces & Types", children:["interface vs type","Optional & Readonly Properties","Extending Interfaces","Intersection Types","Union Types"] },
      { label:"Functions", children:["Function Type Signatures","Optional & Default Parameters","Rest Parameters","Overloads","void & never"] },
      { label:"Generics", children:["Generic Functions","Generic Interfaces","Generic Constraints","Utility Types (Partial, Required, Pick, Omit)","Mapped Types"] },
      { label:"Classes", children:["Class Syntax","Access Modifiers (public, private, protected)","Abstract Classes","Implements Interface","Decorators (experimental)"] },
      { label:"Advanced Types", children:["Conditional Types","Template Literal Types","Infer keyword","Discriminated Unions","Type Guards"] },
      { label:"Modules & Namespaces", children:["ES Modules in TS","Declaration Files (.d.ts)","DefinitelyTyped (@types/...)","Ambient Declarations","Module Augmentation"] },
      { label:"TypeScript with Frameworks", children:["React + TypeScript","Node.js + TypeScript","Next.js + TypeScript","Express + TypeScript","Zod for Runtime Validation"] },
      { label:"Strict Mode & Best Practices", children:["strict: true","noImplicitAny","strictNullChecks","Type-safe APIs","Avoiding any"] },
      { label:"Tooling", children:["tsc Compiler","ts-node","ESLint + TypeScript","Prettier","Path Aliases"] },
    ],
  },
  {
    id:"nodejs", icon:"🟩", name:"Node.js", tag:"Skill-based",
    desc:"Build fast, scalable server-side applications with JavaScript on the backend.",
    color:"#e6f4ea", accent:"#2e7d32",
    tree:[
      { label:"Node.js Fundamentals", children:["What is Node.js?","Event Loop","Non-blocking I/O","CommonJS vs ES Modules","Global Objects (process, __dirname)"] },
      { label:"Core Modules", children:["fs (File System)","path","http / https","os","events","stream","Buffer"] },
      { label:"npm & Package Management", children:["npm init","Installing Packages","package.json & lock files","Scripts","Publishing to npm"] },
      { label:"Express.js", children:["Setting up Express","Routing","Middleware","Error Handling Middleware","Static Files"] },
      { label:"REST API Development", children:["CRUD Operations","Request & Response Objects","Query Params & Route Params","JSON APIs","Postman Testing"] },
      { label:"Authentication", children:["JWT (JSON Web Tokens)","bcrypt Password Hashing","Sessions & Cookies","OAuth with Passport.js","Refresh Tokens"] },
      { label:"Databases with Node", children:["PostgreSQL (pg / Prisma)","MongoDB (Mongoose)","Redis (ioredis)","Connection Pooling","ORM vs Query Builder"] },
      { label:"Real-time & Advanced", children:["WebSockets (socket.io)","Server-Sent Events","Streams (Readable, Writable)","Worker Threads","Cluster Module"] },
      { label:"Testing", children:["Jest","Supertest (API Testing)","Mocking Modules","Integration Tests","Code Coverage"] },
      { label:"Production & Deployment", children:["Environment Variables (.env)","PM2 Process Manager","Docker for Node","CI/CD","Logging (Winston, Pino)"] },
    ],
  },
  {
    id:"python", icon:"🐍", name:"Python", tag:"Skill-based",
    desc:"One of the most versatile languages — from scripting and web to data science and AI.",
    color:"#e8f5e9", accent:"#2e7d32",
    tree:[
      { label:"Python Basics", children:["Variables & Data Types","Control Flow (if, for, while)","Functions","List, Tuple, Dict, Set","String Manipulation"] },
      { label:"OOP in Python", children:["Classes & Objects","Inheritance & Polymorphism","Dunder Methods","Dataclasses","Abstract Base Classes"] },
      { label:"Functional Python", children:["Lambda Functions","map, filter, reduce","List Comprehensions","Generator Expressions","Decorators"] },
      { label:"Modules & Packages", children:["Importing Modules","Creating Packages","pip & virtual environments","Poetry","PyPI Publishing"] },
      { label:"File I/O & OS", children:["Reading & Writing Files","pathlib","os & sys modules","JSON & CSV Handling","Environment Variables"] },
      { label:"Error Handling & Testing", children:["try / except / finally","Custom Exceptions","unittest","pytest","Mocking with unittest.mock"] },
      { label:"Concurrency", children:["Threading","Multiprocessing","asyncio & async/await","aiohttp","concurrent.futures"] },
      { label:"Python for Web", children:["FastAPI","Django","Flask","REST APIs","Authentication with JWT"] },
      { label:"Python for Data", children:["NumPy","Pandas","Matplotlib","Scikit-learn","Jupyter Notebooks"] },
      { label:"Advanced Python", children:["Metaclasses","Descriptors","Context Managers","Memory Management","C Extensions with Cython"] },
    ],
  },
  {
    id:"java", icon:"☕", name:"Java", tag:"Skill-based",
    desc:"Enterprise-grade, strongly typed OOP language — power backend systems and Android apps.",
    color:"#fff3e0", accent:"#e65100",
    tree:[
      { label:"Java Basics", children:["JDK Setup & IDEs","Variables & Data Types","Control Flow","Methods","Arrays"] },
      { label:"OOP", children:["Classes & Objects","Inheritance","Polymorphism","Abstraction & Interfaces","Encapsulation"] },
      { label:"Collections Framework", children:["List (ArrayList, LinkedList)","Set (HashSet, TreeSet)","Map (HashMap, TreeMap)","Queue & Deque","Iterators & Comparators"] },
      { label:"Generics & Lambdas", children:["Generic Classes & Methods","Bounded Type Parameters","Lambda Expressions","Method References","Functional Interfaces"] },
      { label:"Stream API & Optionals", children:["Stream Pipeline","filter, map, collect","flatMap","Optional Usage","Collectors"] },
      { label:"Exception Handling & I/O", children:["Checked vs Unchecked Exceptions","try-with-resources","NIO (Files, Paths)","Serialization","Logging (SLF4J, Log4j)"] },
      { label:"Concurrency", children:["Threads & Runnable","ExecutorService","CompletableFuture","Synchronized & volatile","java.util.concurrent"] },
      { label:"Spring Boot", children:["Spring Core & IoC","REST Controllers","Spring Data JPA","Spring Security","Testing with MockMvc"] },
      { label:"Build Tools & Testing", children:["Maven","Gradle","JUnit 5","Mockito","Integration Testing"] },
      { label:"JVM & Performance", children:["JVM Architecture","Garbage Collection","JIT Compilation","Profiling (JProfiler, VisualVM)","Memory Tuning"] },
    ],
  },
  {
    id:"system-design", icon:"🏗️", name:"System Design", tag:"Skill-based",
    desc:"Design scalable, reliable systems — ace system design interviews and build production architecture.",
    color:"#eceff1", accent:"#37474f",
    tree:[
      { label:"Basics & Fundamentals", children:["Client-Server Architecture","Horizontal vs Vertical Scaling","Latency & Throughput","Availability & Reliability","CAP Theorem"] },
      { label:"Load Balancing", children:["Round Robin","Least Connections","Consistent Hashing","L4 vs L7 Load Balancers","Health Checks & Failover"] },
      { label:"Caching", children:["Cache Aside","Read-through / Write-through","Redis","Memcached","CDN Caching & Edge"] },
      { label:"Databases", children:["SQL vs NoSQL","Database Sharding","Replication (Primary-Replica)","Indexing Strategies","ACID vs BASE"] },
      { label:"Message Queues & Streaming", children:["Kafka","RabbitMQ","Pub/Sub Pattern","Event-Driven Architecture","Idempotency"] },
      { label:"API Design", children:["REST Best Practices","GraphQL","gRPC","WebSockets","Rate Limiting & Throttling"] },
      { label:"Microservices", children:["Service Decomposition","API Gateway","Service Discovery","Circuit Breaker (Resilience4j)","Saga Pattern"] },
      { label:"Storage Systems", children:["Object Storage (S3)","Block vs File Storage","Blob Storage","Data Lakes","Distributed File Systems (HDFS)"] },
      { label:"Reliability & Observability", children:["SLAs / SLOs / SLIs","Distributed Tracing","Centralized Logging","Metrics & Alerting","Chaos Engineering"] },
      { label:"Real System Examples", children:["Design URL Shortener","Design Twitter Feed","Design Netflix","Design WhatsApp","Design Google Search"] },
    ],
  },
  {
    id:"api-design", icon:"🔌", name:"API Design", tag:"Skill-based",
    desc:"Design clean, consistent and developer-friendly APIs — REST, GraphQL, gRPC and beyond.",
    color:"#e8f0fe", accent:"#1a73e8",
    tree:[
      { label:"API Fundamentals", children:["What is an API?","Client-Server Model","HTTP Methods (GET, POST, PUT, PATCH, DELETE)","Status Codes","Headers & Authentication"] },
      { label:"REST API Design", children:["Resource Naming Conventions","HATEOAS","Statelessness","Versioning (URI, Header, Query Param)","Idempotency"] },
      { label:"Request & Response Design", children:["JSON Structure Best Practices","Pagination (Cursor, Offset)","Filtering & Sorting","Field Selection (Sparse Fieldsets)","Error Response Format"] },
      { label:"Authentication & Security", children:["API Keys","JWT Tokens","OAuth 2.0 Flows","Rate Limiting","CORS & CSRF Protection"] },
      { label:"GraphQL", children:["Schema Definition Language","Queries & Mutations","Resolvers","DataLoader (N+1 Problem)","Subscriptions"] },
      { label:"gRPC", children:["Protocol Buffers (Protobuf)","Service Definition","Unary & Streaming RPCs","gRPC-Web","Comparison with REST"] },
      { label:"WebSockets & Real-time", children:["WebSocket Protocol","Socket.io","Server-Sent Events","Long Polling","Choosing Real-time Strategy"] },
      { label:"API Documentation", children:["OpenAPI / Swagger","Postman Collections","Redoc","API Changelog","Developer Experience (DX)"] },
      { label:"Testing APIs", children:["Postman Testing","Contract Testing (Pact)","Load Testing (k6)","Mocking APIs (MSW)","API Monitoring"] },
      { label:"API Gateway & Management", children:["Kong / AWS API Gateway","Request Transformation","Circuit Breaker","Analytics","Developer Portal"] },
    ],
  },
  {
    id:"spring-boot", icon:"🍃", name:"Spring Boot", tag:"Skill-based",
    desc:"Build production-ready Java applications fast with the most popular Java framework.",
    color:"#e6f4ea", accent:"#2e7d32",
    tree:[
      { label:"Spring Core", children:["IoC Container","Dependency Injection","Beans & ApplicationContext","Annotations (@Component, @Service, @Repository)","Bean Scopes"] },
      { label:"Spring Boot Setup", children:["Spring Initializr","Auto-configuration","application.properties / yml","Profiles","Actuator"] },
      { label:"REST APIs with Spring", children:["@RestController","@GetMapping / @PostMapping etc.","@RequestBody & @PathVariable","Exception Handling (@ControllerAdvice)","ResponseEntity"] },
      { label:"Spring Data JPA", children:["Entity & @Table","Repository Interfaces","JPQL & Native Queries","Pagination & Sorting","Relationships (OneToMany, ManyToMany)"] },
      { label:"Spring Security", children:["Authentication & Authorization","JWT with Spring Security","Role-based Access Control","CSRF Protection","OAuth2 Resource Server"] },
      { label:"Database Integration", children:["H2 (Dev)","PostgreSQL & MySQL","Flyway / Liquibase Migrations","Connection Pooling (HikariCP)","Multiple DataSources"] },
      { label:"Messaging", children:["Spring Kafka","RabbitMQ with Spring","@KafkaListener","@RabbitListener","Event-Driven Architecture"] },
      { label:"Testing", children:["@SpringBootTest","MockMvc","@DataJpaTest","@WebMvcTest","Testcontainers"] },
      { label:"Caching & Performance", children:["@Cacheable (Redis / Caffeine)","Async Methods (@Async)","Scheduling (@Scheduled)","Virtual Threads (Java 21)","Performance Profiling"] },
      { label:"Deployment", children:["Dockerizing Spring Boot","Kubernetes Deployment","CI/CD with GitHub Actions","Observability (Micrometer, Prometheus)","GraalVM Native Image"] },
    ],
  },
  {
    id:"flutter", icon:"💙", name:"Flutter", tag:"Skill-based",
    desc:"Build beautiful native apps for mobile, web and desktop from a single Dart codebase.",
    color:"#e8f0fe", accent:"#0277bd",
    tree:[
      { label:"Dart Basics", children:["Variables & Types","Control Flow","Functions & Closures","OOP (Classes, Mixins, Extensions)","async / await & Futures"] },
      { label:"Flutter Fundamentals", children:["Flutter Architecture","Widget Tree","Stateless vs Stateful Widgets","Hot Reload / Hot Restart","pubspec.yaml"] },
      { label:"UI Building Blocks", children:["Layout Widgets (Column, Row, Stack, Container)","Text, Image, Icon","Scaffold & AppBar","ListView & GridView","CustomScrollView & Slivers"] },
      { label:"State Management", children:["setState","Provider","Riverpod","BLoC Pattern","GetX"] },
      { label:"Navigation", children:["Navigator 1.0","Navigator 2.0 / GoRouter","Named Routes","Deep Linking","Tab & Drawer Navigation"] },
      { label:"Networking & APIs", children:["http package","Dio","JSON Parsing (json_serializable)","REST APIs","WebSockets"] },
      { label:"Local Storage", children:["SharedPreferences","SQLite (sqflite)","Hive","Secure Storage","File System (path_provider)"] },
      { label:"Animations", children:["Implicit Animations","AnimatedContainer","AnimationController","Hero Animations","Lottie"] },
      { label:"Testing", children:["Widget Tests","Unit Tests","Integration Tests","Golden Tests","Mocktail / Mockito"] },
      { label:"Publishing", children:["App Signing","Play Store / App Store Upload","Flutter Web Deployment","CI/CD (Codemagic, GitHub Actions)","Performance Profiling"] },
    ],
  },
  {
    id:"cpp", icon:"⚙️", name:"C++", tag:"Skill-based",
    desc:"High-performance systems programming — game engines, OS, embedded and competitive programming.",
    color:"#e8eaf6", accent:"#283593",
    tree:[
      { label:"C++ Basics", children:["Variables & Data Types","Control Flow","Functions","Arrays & Pointers","References"] },
      { label:"OOP", children:["Classes & Objects","Constructors & Destructors","Inheritance","Polymorphism (Virtual Functions)","Operator Overloading"] },
      { label:"Memory Management", children:["Stack vs Heap","new & delete","Smart Pointers (unique_ptr, shared_ptr, weak_ptr)","RAII Pattern","Memory Leaks & Valgrind"] },
      { label:"STL (Standard Template Library)", children:["vector, list, deque","map, set, unordered_map","stack, queue, priority_queue","Algorithms (sort, find, transform)","Iterators"] },
      { label:"Templates & Generics", children:["Function Templates","Class Templates","Template Specialization","Variadic Templates","SFINAE & Concepts (C++20)"] },
      { label:"Modern C++ (11/14/17/20)", children:["auto & decltype","Range-based for loops","Lambda Expressions","Move Semantics & rvalue References","Structured Bindings"] },
      { label:"Concurrency", children:["std::thread","Mutexes & Locks","Condition Variables","std::async & futures","Atomic Operations"] },
      { label:"File I/O & Streams", children:["ifstream / ofstream","String Streams","Formatted I/O","Binary Files","Error Handling with Streams"] },
      { label:"Build & Tooling", children:["g++ / clang++","CMake","Make","Debugging with GDB","AddressSanitizer"] },
      { label:"Applications", children:["Competitive Programming Patterns","Game Development (basics)","Systems Programming","Embedded C++","Performance Optimization"] },
    ],
  },
  {
    id:"rust", icon:"🦀", name:"Rust", tag:"Skill-based",
    desc:"Memory-safe systems programming without garbage collection — fast, reliable, modern.",
    color:"#fff3e0", accent:"#bf360c",
    tree:[
      { label:"Rust Basics", children:["Installation & Cargo","Variables & Mutability","Data Types","Control Flow","Functions & Closures"] },
      { label:"Ownership & Borrowing", children:["Ownership Rules","Move vs Copy","References & Borrowing","Lifetimes","The Borrow Checker"] },
      { label:"Structs & Enums", children:["Defining Structs","Methods (impl)","Enums & Pattern Matching","Option<T>","Result<T, E>"] },
      { label:"Traits & Generics", children:["Defining Traits","Trait Bounds","Default Implementations","Generics","Trait Objects (dyn Trait)"] },
      { label:"Collections & Iterators", children:["Vec<T>","HashMap","Slices","Iterator Trait","Chaining Iterators (map, filter, collect)"] },
      { label:"Error Handling", children:["Result & Option","? Operator","Custom Error Types","thiserror & anyhow","Panic vs Recoverable Errors"] },
      { label:"Concurrency", children:["Threads (std::thread)","Channels (mpsc)","Mutex & Arc","async / await","Tokio Runtime"] },
      { label:"Modules & Crates", children:["Module System","use & pub","Cargo.toml","Publishing Crates","Workspaces"] },
      { label:"Async Rust", children:["async / await Basics","Futures","Tokio","reqwest & axum","Async Streams"] },
      { label:"Systems & Web with Rust", children:["WebAssembly (wasm-pack)","Axum / Actix-web","CLI Tools (clap)","Embedded Rust","Unsafe Rust"] },
    ],
  },
  {
    id:"go", icon:"🐹", name:"Go Roadmap", tag:"Skill-based",
    desc:"Simple, fast and efficient — Go is the language of cloud infrastructure and microservices.",
    color:"#e0f7fa", accent:"#00838f",
    tree:[
      { label:"Go Basics", children:["Installation & go mod","Variables & Types","Control Flow","Functions & Multiple Return Values","Pointers"] },
      { label:"Data Structures", children:["Arrays & Slices","Maps","Structs","Methods on Structs","Interfaces"] },
      { label:"Concurrency", children:["Goroutines","Channels","Select Statement","WaitGroups","Mutexes"] },
      { label:"Error Handling", children:["error Interface","Custom Errors","errors.Is & errors.As","Wrapping Errors","panic & recover"] },
      { label:"Packages & Modules", children:["Package System","go.mod & go.sum","Standard Library Tour","Third-party Packages","Workspace Mode"] },
      { label:"File I/O & OS", children:["os Package","bufio","ioutil","JSON Encoding (encoding/json)","Environment Variables"] },
      { label:"HTTP & Web", children:["net/http Package","HTTP Handlers & Mux","Gin / Echo / Fiber","REST API with Go","Middleware"] },
      { label:"Databases", children:["database/sql","GORM","PostgreSQL & MySQL","Redis (go-redis)","Migrations (golang-migrate)"] },
      { label:"Testing", children:["testing Package","Table-driven Tests","Benchmarks","Mocking (testify/mock)","Integration Tests"] },
      { label:"Production & Cloud", children:["Docker with Go","gRPC (google.golang.org/grpc)","Kubernetes Operators","Observability (OpenTelemetry)","CLI Tools (cobra)"] },
    ],
  },
  {
    id:"design-architecture", icon:"📐", name:"Design and Architecture", tag:"Skill-based",
    desc:"Software design principles and architecture patterns for building maintainable systems.",
    color:"#eceff1", accent:"#455a64",
    tree:[
      { label:"Design Principles", children:["SOLID Principles","DRY, KISS, YAGNI","Separation of Concerns","Law of Demeter","Principle of Least Astonishment"] },
      { label:"Design Patterns — Creational", children:["Singleton","Factory Method","Abstract Factory","Builder","Prototype"] },
      { label:"Design Patterns — Structural", children:["Adapter","Bridge","Composite","Decorator","Facade","Proxy"] },
      { label:"Design Patterns — Behavioral", children:["Observer","Strategy","Command","Chain of Responsibility","State","Template Method","Iterator"] },
      { label:"Architecture Patterns", children:["MVC / MVP / MVVM","Layered Architecture","Hexagonal (Ports & Adapters)","Clean Architecture","Onion Architecture"] },
      { label:"Domain-Driven Design", children:["Ubiquitous Language","Bounded Contexts","Entities & Value Objects","Aggregates","Domain Events"] },
      { label:"Microservices Patterns", children:["API Gateway","Service Mesh","Saga Pattern","Strangler Fig","Backends for Frontends (BFF)"] },
      { label:"Event-Driven Architecture", children:["Event Sourcing","CQRS","Message Brokers","Eventual Consistency","Outbox Pattern"] },
      { label:"Refactoring", children:["Code Smells","Refactoring Techniques (Fowler)","Boy Scout Rule","Strangler Fig for Refactoring","Testing while Refactoring"] },
      { label:"Architecture Documentation", children:["Architecture Decision Records (ADR)","C4 Model (Diagrams)","arc42 Template","OpenAPI for Contracts","RFC Process"] },
    ],
  },
  {
    id:"graphql", icon:"🔷", name:"GraphQL", tag:"Skill-based",
    desc:"Query your APIs efficiently — fetch exactly what you need with this powerful query language.",
    color:"#f3e8fd", accent:"#6a1b9a",
    tree:[
      { label:"GraphQL Basics", children:["What is GraphQL?","Queries & Fields","Arguments","Aliases & Fragments","Variables & Directives"] },
      { label:"Schema Definition Language", children:["Types (Scalar, Object, Enum, Interface, Union)","Queries, Mutations, Subscriptions","Non-null & Lists","Input Types","Deprecation"] },
      { label:"Resolvers", children:["Resolver Functions","Context Object","Resolver Chain","Default Resolvers","Error Handling in Resolvers"] },
      { label:"N+1 Problem & DataLoader", children:["Understanding N+1","DataLoader Pattern","Batching & Caching","Per-request DataLoaders","Performance Monitoring"] },
      { label:"Authentication & Authorization", children:["JWT in GraphQL","Context-based Auth","Field-level Authorization","Directives for Auth","Schema Stitching Security"] },
      { label:"Subscriptions & Real-time", children:["WebSocket-based Subscriptions","graphql-ws","PubSub Pattern","Subscription Filtering","Real-time Use Cases"] },
      { label:"Apollo Stack", children:["Apollo Server","Apollo Client","Apollo Cache","Reactive Variables","Apollo Studio"] },
      { label:"Federation & Schema Stitching", children:["Apollo Federation","Subgraph Services","Gateway","Schema Stitching (legacy)","Supergraph Concepts"] },
      { label:"Testing", children:["Unit Testing Resolvers","Integration Testing","GraphQL Inspector","Mocking Schemas","Apollo Server Testing"] },
      { label:"Production Best Practices", children:["Query Depth & Complexity Limits","Persisted Queries","Caching Strategies","Rate Limiting","Observability"] },
    ],
  },
  {
    id:"prompt-engineering", icon:"🤖", name:"Prompt Engineering", tag:"Skill-based",
    desc:"Master the art of communicating with AI models — craft effective prompts for any use case.",
    color:"#f3e8fd", accent:"#7b1fa2",
    tree:[
      { label:"LLM Fundamentals", children:["How LLMs Work","Tokens & Context Window","Temperature & Top-p","Model Differences (GPT-4, Claude, Gemini)","API Basics"] },
      { label:"Prompt Basics", children:["Zero-shot Prompting","Few-shot Prompting","Role Prompting","Instruction Clarity","Output Formatting Instructions"] },
      { label:"Advanced Techniques", children:["Chain-of-Thought (CoT)","Tree of Thoughts","Self-consistency","Step-back Prompting","ReAct Prompting"] },
      { label:"System Prompts & Context", children:["System vs User Prompts","Persona Design","Context Management","Memory Strategies","Multi-turn Conversations"] },
      { label:"RAG & Knowledge Injection", children:["Retrieval-Augmented Generation","Embedding Search","Context Stuffing","Chunking Strategies","Citation & Grounding"] },
      { label:"AI Agents", children:["Tool Use / Function Calling","ReAct Agent Pattern","Planning Agents","Multi-agent Systems","LangChain / LlamaIndex"] },
      { label:"Prompt Evaluation", children:["Evaluation Metrics","LLM-as-Judge","RAGAS Framework","A/B Testing Prompts","Red Teaming"] },
      { label:"Image & Multimodal Prompting", children:["Vision Model Prompting","DALL-E / Midjourney / Stable Diffusion","Prompt Modifiers","Negative Prompts","Consistent Characters"] },
      { label:"Safety & Ethics", children:["Jailbreak & Injection Attacks","Prompt Leaking","Bias in Outputs","Responsible AI Usage","Content Policy Compliance"] },
      { label:"Production Prompt Engineering", children:["Prompt Versioning","Prompt Templates (Jinja2)","Prompt Monitoring","Cost Optimization","LangSmith / PromptLayer"] },
    ],
  },
  {
    id:"design-system", icon:"🎨", name:"Design System", tag:"Skill-based",
    desc:"Build consistent, scalable UI — create and maintain component libraries and design tokens.",
    color:"#fce4ec", accent:"#c2185b",
    tree:[
      { label:"Design System Fundamentals", children:["What is a Design System?","Atomic Design Methodology","Design System vs Component Library","Team Structure","Governance Model"] },
      { label:"Design Tokens", children:["Color Tokens","Typography Tokens","Spacing & Sizing Tokens","Border & Shadow Tokens","Token Naming Conventions","Style Dictionary"] },
      { label:"Typography", children:["Type Scale","Font Families & Weights","Line Height & Letter Spacing","Responsive Typography","Accessibility (WCAG contrast)"] },
      { label:"Color System", children:["Color Palette Design","Semantic Colors (Primary, Success, Error)","Dark Mode Tokens","Color Contrast Ratios","Brand Color Application"] },
      { label:"Component Library", children:["Button System","Form Components","Navigation Patterns","Data Display Components","Overlay & Modal Patterns"] },
      { label:"Documentation", children:["Storybook Setup","MDX Documentation","Component API Docs","Usage Guidelines","Do's & Don'ts"] },
      { label:"Figma for Design Systems", children:["Component Architecture in Figma","Variables & Modes","Auto Layout","Component Properties","Design Token Plugins"] },
      { label:"Development Integration", children:["CSS Custom Properties","Tailwind Config as Design Tokens","React Component Development","Accessibility in Components","Theming with CSS-in-JS"] },
      { label:"Versioning & Distribution", children:["npm Package Publishing","Semantic Versioning","Changelog Automation","Monorepo Setup (Turborepo)","CDN Distribution"] },
      { label:"Adoption & Maintenance", children:["Migration Strategy","Contribution Guidelines","Breaking Change Management","Usage Analytics","Community of Practice"] },
    ],
  },
  {
    id:"linux", icon:"🐧", name:"Linux", tag:"Skill-based",
    desc:"Master the Linux operating system — essential for every developer, DevOps and sysadmin.",
    color:"#eceff1", accent:"#37474f",
    tree:[
      { label:"Linux Basics", children:["What is Linux?","Distributions (Ubuntu, CentOS, Arch)","Linux File System Hierarchy","Terminal & Shell Basics","Getting Help (man, --help)"] },
      { label:"File & Directory Operations", children:["ls, cd, pwd, mkdir, rm","cp, mv, ln (symlinks)","find & locate","File Permissions (chmod, chown)","Wildcards & Globbing"] },
      { label:"Text Processing", children:["cat, less, more, head, tail","grep & Regular Expressions","sed (Stream Editor)","awk","sort, uniq, wc, cut"] },
      { label:"Shell Scripting (Bash)", children:["Variables & Quoting","Conditionals (if, case)","Loops (for, while)","Functions","Script Best Practices"] },
      { label:"Processes & Jobs", children:["ps, top, htop","kill & signals","Jobs (bg, fg, &)","nohup & screen / tmux","systemd & Service Management"] },
      { label:"Networking", children:["ip, ifconfig, netstat","ping, traceroute, curl, wget","SSH (key-based auth, tunneling)","ufw / iptables Basics","DNS Tools (dig, nslookup)"] },
      { label:"Users & Permissions", children:["useradd, usermod, passwd","Groups & sudo","File Permission Octal","ACLs","PAM Basics"] },
      { label:"Package Management", children:["apt (Debian/Ubuntu)","yum / dnf (RHEL/CentOS)","pacman (Arch)","Snap & Flatpak","Building from Source"] },
      { label:"Storage & File Systems", children:["df, du, lsblk","Partitioning (fdisk, parted)","ext4, xfs, btrfs","Mount & /etc/fstab","LVM Basics"] },
      { label:"Security & Hardening", children:["fail2ban","SSH Hardening","SELinux / AppArmor Basics","Log Analysis (/var/log)","Auditing with auditd"] },
    ],
  },
  {
    id:"mongodb", icon:"🍃", name:"MongoDB", tag:"Skill-based",
    desc:"Master the leading NoSQL document database — flexible schema, powerful queries, massive scale.",
    color:"#e6f4ea", accent:"#2e7d32",
    tree:[
      { label:"MongoDB Basics", children:["Document Model & BSON","Collections & Databases","CRUD Operations","Data Types","MongoDB Atlas Setup"] },
      { label:"Querying", children:["find() & findOne()","Comparison Operators ($eq, $gt, $in)","Logical Operators ($and, $or, $not)","Element Operators ($exists, $type)","Projection"] },
      { label:"Aggregation Framework", children:["Pipeline Stages ($match, $group, $sort)","$project & $addFields","$lookup (Joins)","$unwind","$facet & $bucket"] },
      { label:"Indexes", children:["Single Field Index","Compound Index","Multikey Index","Text Index","Index Strategies & EXPLAIN()"] },
      { label:"Data Modeling", children:["Embedding vs Referencing","One-to-Many Patterns","Schema Design Principles","Polymorphic Pattern","Bucket Pattern"] },
      { label:"Schema Validation", children:["JSON Schema Validation","$jsonSchema","Required Fields","Data Type Enforcement","Validation Levels & Actions"] },
      { label:"Transactions & Concurrency", children:["ACID Multi-document Transactions","Sessions","Read & Write Concerns","Optimistic Concurrency","Change Streams"] },
      { label:"Performance & Scaling", children:["Query Performance Analysis","Index Optimization","Sharding (Horizontal Scaling)","Replica Sets","Read Preference"] },
      { label:"Security", children:["Authentication (SCRAM, x.509)","Role-based Access Control","Field-Level Encryption","Auditing","Network Security"] },
      { label:"MongoDB with Apps", children:["Mongoose (Node.js)","PyMongo (Python)","MongoDB Driver (Java)","Atlas Search","Atlas Vector Search"] },
    ],
  },
  {
    id:"kubernetes", icon:"☸️", name:"Kubernetes", tag:"Skill-based",
    desc:"Orchestrate containers at scale — deploy, manage and auto-scale applications in production.",
    color:"#e8f0fe", accent:"#1565c0",
    tree:[
      { label:"Kubernetes Basics", children:["What is Kubernetes?","Architecture (Control Plane & Nodes)","kubectl CLI","kubeconfig","Namespaces"] },
      { label:"Core Objects", children:["Pods","ReplicaSets","Deployments","Services (ClusterIP, NodePort, LoadBalancer)","Ingress"] },
      { label:"Configuration", children:["ConfigMaps","Secrets","Environment Variables","Resource Requests & Limits","LimitRange & ResourceQuota"] },
      { label:"Storage", children:["Volumes","PersistentVolumes (PV)","PersistentVolumeClaims (PVC)","StorageClasses","StatefulSets"] },
      { label:"Networking", children:["Pod Networking Model","DNS in Kubernetes","Network Policies","Service Mesh (Istio intro)","Ingress Controllers (Nginx, Traefik)"] },
      { label:"Workloads", children:["DaemonSets","Jobs & CronJobs","StatefulSets","Horizontal Pod Autoscaler (HPA)","Vertical Pod Autoscaler (VPA)"] },
      { label:"Helm", children:["What is Helm?","Charts & Templates","Values.yaml","Installing & Upgrading Releases","Creating Custom Charts"] },
      { label:"Security", children:["RBAC (Roles & ClusterRoles)","ServiceAccounts","Pod Security Standards","Network Policies","Secrets Management (Vault, Sealed Secrets)"] },
      { label:"Observability", children:["Metrics (Prometheus + Grafana)","Logging (ELK / Loki)","Distributed Tracing (Jaeger)","k9s & Lens","kubectl debug"] },
      { label:"Production & GitOps", children:["Cluster Setup (EKS, GKE, AKS)","GitOps (ArgoCD, Flux)","Blue-Green & Canary Deployments","Cost Optimization","Multi-cluster Management"] },
    ],
  },
  {
    id:"docker", icon:"🐳", name:"Docker", tag:"Skill-based",
    desc:"Containerize applications for consistent development and deployment across any environment.",
    color:"#e8f0fe", accent:"#0277bd",
    tree:[
      { label:"Docker Basics", children:["What are Containers?","Docker Architecture (Engine, Daemon, CLI)","Images vs Containers","Docker Hub","docker run, pull, ps, stop"] },
      { label:"Dockerfile", children:["FROM, RUN, COPY, ADD","CMD vs ENTRYPOINT","ENV & ARG","WORKDIR & EXPOSE","Multi-stage Builds"] },
      { label:"Images", children:["Building Images (docker build)","Tagging & Versioning","Layer Caching","Slim Base Images (Alpine)","Pushing to Registry"] },
      { label:"Networking", children:["Bridge Networks","Host & None Mode","User-defined Networks","DNS between Containers","Exposing Ports"] },
      { label:"Volumes & Storage", children:["Bind Mounts","Named Volumes","tmpfs","Volume Management","Backup & Restore"] },
      { label:"Docker Compose", children:["docker-compose.yml Structure","Services, Networks, Volumes","Depends On","Environment Variables","Override Files"] },
      { label:"Docker Registry", children:["Docker Hub","Private Registries (ECR, GCR, GHCR)","Image Scanning (Trivy)","Tagging Strategy","Registry Mirrors"] },
      { label:"Security", children:["Running as Non-root User","Read-only File Systems","Secrets Management","Image Signing (Cosign)","Docker Bench Security"] },
      { label:"Performance & Optimization", children:[".dockerignore","Layer Optimization","BuildKit","Build Caching Strategies","Image Size Reduction"] },
      { label:"Docker in CI/CD", children:["Docker in GitHub Actions","Docker-in-Docker (DinD)","Kaniko","Docker Compose for Testing","Docker Scout"] },
    ],
  },
  {
    id:"aws", icon:"☁️", name:"AWS", tag:"Skill-based",
    desc:"Master Amazon Web Services — the world's leading cloud platform for building and deploying apps.",
    color:"#fff3e0", accent:"#e65100",
    tree:[
      { label:"AWS Fundamentals", children:["Global Infrastructure (Regions, AZs, Edge)","IAM (Users, Roles, Policies)","AWS CLI & SDK Setup","Shared Responsibility Model","Billing & Cost Explorer"] },
      { label:"Compute", children:["EC2 (Instances, AMIs, Types)","Auto Scaling Groups","Elastic Load Balancing","Lambda (Serverless)","ECS & EKS (Containers)"] },
      { label:"Storage", children:["S3 (Buckets, Policies, Versioning, Lifecycle)","EBS (Block Storage)","EFS (File System)","Glacier (Archiving)","AWS Backup"] },
      { label:"Databases", children:["RDS (PostgreSQL, MySQL, Aurora)","DynamoDB","ElastiCache (Redis / Memcached)","Redshift","DocumentDB"] },
      { label:"Networking", children:["VPC (Subnets, Route Tables, IGW)","Security Groups & NACLs","Route 53 (DNS)","CloudFront (CDN)","VPN & Direct Connect"] },
      { label:"Messaging & Integration", children:["SQS (Queues)","SNS (Pub/Sub)","EventBridge","Step Functions","API Gateway"] },
      { label:"DevOps & CI/CD", children:["CodePipeline","CodeBuild","CodeDeploy","CloudFormation","CDK (Cloud Development Kit)"] },
      { label:"Security & Compliance", children:["KMS (Key Management)","Secrets Manager","WAF & Shield","CloudTrail (Auditing)","AWS Config"] },
      { label:"Monitoring & Observability", children:["CloudWatch (Metrics, Logs, Alarms)","X-Ray (Tracing)","AWS Health Dashboard","Trusted Advisor","Cost Anomaly Detection"] },
      { label:"Certification Path", children:["AWS Cloud Practitioner","AWS Solutions Architect Associate","AWS Developer Associate","AWS DevOps Engineer","AWS Specialty Certs"] },
    ],
  },
  {
    id:"terraform", icon:"🏔️", name:"Terraform", tag:"Skill-based",
    desc:"Infrastructure as Code with Terraform — provision and manage cloud resources declaratively.",
    color:"#f3e8fd", accent:"#7b1fa2",
    tree:[
      { label:"Terraform Basics", children:["What is IaC?","Terraform Architecture","Installation & Setup","HCL Syntax","Terraform CLI Commands (init, plan, apply, destroy)"] },
      { label:"Providers & Resources", children:["Provider Configuration","AWS / Azure / GCP Providers","Resource Blocks","Data Sources","Terraform Registry"] },
      { label:"Variables & Outputs", children:["Input Variables (var)","Variable Types & Validation","Output Values","Local Values (locals)","terraform.tfvars"] },
      { label:"State Management", children:["terraform.tfstate","Remote State (S3 + DynamoDB)","State Locking","terraform state commands","Importing Existing Resources"] },
      { label:"Modules", children:["Creating Modules","Module Sources (Registry, Git, Local)","Module Inputs & Outputs","Nested Modules","Module Versioning"] },
      { label:"Functions & Expressions", children:["Built-in Functions (concat, merge, lookup)","Count & For Each","Dynamic Blocks","Conditional Expressions","Templatefile"] },
      { label:"Workspaces & Environments", children:["Terraform Workspaces","Environment Separation Strategies","Variable per Environment","Terragrunt Intro","Multi-region Deployments"] },
      { label:"CI/CD with Terraform", children:["GitHub Actions + Terraform","Atlantis (GitOps for Terraform)","Terraform Cloud","Plan in PR, Apply on Merge","Drift Detection"] },
      { label:"Security Best Practices", children:["Least Privilege IAM","Sensitive Variables","tfsec & Checkov (Security Scanning)","SOPS for Secrets","Vault Integration"] },
      { label:"Advanced Terraform", children:["Custom Providers","CDK for Terraform","Policy as Code (Sentinel / OPA)","Terraformer (Import existing)","Performance at Scale"] },
    ],
  },
  {
    id:"redis", icon:"🔴", name:"Redis", tag:"Skill-based",
    desc:"In-memory data store for caching, sessions, queues, pub/sub and real-time applications.",
    color:"#fce8e6", accent:"#c62828",
    tree:[
      { label:"Redis Basics", children:["What is Redis?","Installation & redis-cli","Key-Value Store Concepts","Key Naming Conventions","TTL & Expiry (EXPIRE, TTL)"] },
      { label:"Core Data Structures", children:["Strings (GET, SET, INCR, APPEND)","Lists (LPUSH, RPUSH, LRANGE)","Sets (SADD, SMEMBERS, SINTER)","Sorted Sets (ZADD, ZRANGE, ZRANK)","Hashes (HSET, HGETALL)"] },
      { label:"Advanced Data Types", children:["Bitmaps","HyperLogLog","Geospatial (GEOADD, GEODIST)","Streams (XADD, XREAD)","Modules (RedisJSON, RedisSearch)"] },
      { label:"Caching Patterns", children:["Cache-aside Pattern","Read-through / Write-through","Cache Invalidation Strategies","Cache Stampede Prevention","LRU / LFU Eviction Policies"] },
      { label:"Pub/Sub & Messaging", children:["PUBLISH / SUBSCRIBE","Pattern Subscriptions","Redis Streams as Message Queue","Consumer Groups","Dead Letter Queue Pattern"] },
      { label:"Transactions & Scripting", children:["MULTI / EXEC (Transactions)","WATCH (Optimistic Locking)","Lua Scripting (EVAL)","Atomic Operations","Pipelining"] },
      { label:"Persistence", children:["RDB Snapshots","AOF (Append Only File)","RDB + AOF Hybrid","Persistence Trade-offs","Backup & Restore"] },
      { label:"High Availability", children:["Redis Replication","Redis Sentinel","Redis Cluster","Consistent Hashing","Failover & Auto-Restart"] },
      { label:"Security", children:["Authentication (AUTH, ACL)","TLS/SSL","Network Security","Command Disabling","Redis Security Best Practices"] },
      { label:"Redis with Applications", children:["Redis with Node.js (ioredis)","Redis with Python (redis-py)","Redis with Java (Lettuce, Jedis)","Session Management","Rate Limiting Implementation"] },
    ],
  },
  {
    id:"git-github", icon:"🐙", name:"Git and GitHub", tag:"Skill-based",
    desc:"Master version control and collaboration — essential skills for every developer.",
    color:"#eceff1", accent:"#37474f",
    tree:[
      { label:"Git Basics", children:["What is Version Control?","Installing Git & config","git init, add, commit","git status & log",".gitignore"] },
      { label:"Branching & Merging", children:["Creating Branches (git branch, checkout, switch)","Merging (Fast-forward & 3-way)","Rebasing","Cherry-picking","Resolving Merge Conflicts"] },
      { label:"Remote Repositories", children:["git remote add","git push, pull, fetch","Upstream & Origin","Tracking Branches","git clone"] },
      { label:"GitHub Fundamentals", children:["Repositories & Forks","Pull Requests (PRs)","Issues & Labels","GitHub Projects (Kanban)","GitHub Wiki & Pages"] },
      { label:"Collaboration Workflows", children:["GitHub Flow","Git Flow","Trunk-based Development","Feature Branch Workflow","Forking Workflow"] },
      { label:"Code Review", children:["Reviewing PRs","Review Comments & Suggestions","Approvals & Merge Strategies","Code Owners","Review Checklist"] },
      { label:"GitHub Actions (CI/CD)", children:["Workflows & Triggers","Jobs & Steps","Using Actions from Marketplace","Secrets & Environment Variables","Matrix Builds"] },
      { label:"Advanced Git", children:["git stash","Interactive Rebase (git rebase -i)","git bisect","git reflog","Hooks (pre-commit, pre-push)"] },
      { label:"GitHub Advanced Features", children:["GitHub Copilot","GitHub Packages","GitHub Security (Dependabot, Code Scanning)","GitHub Codespaces","GitHub CLI (gh)"] },
      { label:"Best Practices", children:["Conventional Commits","Semantic Versioning","Monorepo Strategies","Protected Branches","Git Large File Storage (LFS)"] },
    ],
  },
  {
    id:"php", icon:"🐘", name:"PHP", tag:"Skill-based",
    desc:"Server-side scripting language powering millions of websites — from WordPress to Laravel.",
    color:"#e8eaf6", accent:"#4527a0",
    tree:[
      { label:"PHP Basics", children:["PHP Syntax & Tags","Variables & Data Types","Control Flow","Functions","Arrays & String Functions"] },
      { label:"OOP in PHP", children:["Classes & Objects","Constructors & Destructors","Inheritance & Interfaces","Traits","Static Methods & Properties"] },
      { label:"Error Handling", children:["try / catch / finally","Custom Exceptions","Error Levels","Logging (Monolog)","Debugging (Xdebug)"] },
      { label:"File & Database", children:["File I/O","PDO (Database Abstraction)","MySQL with PHP","Prepared Statements","Migrations"] },
      { label:"PHP & Web", children:["Superglobals ($_GET, $_POST, $_SESSION)","Forms & Validation","Sessions & Cookies","CSRF Protection","File Uploads"] },
      { label:"Composer & Packages", children:["Composer Setup","autoload","packagist.org","Semantic Versioning","Creating Your Own Package"] },
      { label:"Laravel", children:["Artisan CLI","MVC in Laravel","Eloquent ORM","Blade Templates","Laravel Middleware & Routes"] },
      { label:"APIs with PHP", children:["Building REST APIs","JSON Responses","API Authentication (Sanctum, Passport)","Rate Limiting","Testing APIs (PHPUnit)"] },
      { label:"Testing", children:["PHPUnit","Feature vs Unit Tests","Laravel Dusk (E2E)","Pest PHP","Code Coverage"] },
      { label:"Performance & Deployment", children:["PHP-FPM","OpCache","Nginx + PHP","Docker for PHP","CI/CD with GitHub Actions"] },
    ],
  },
  {
    id:"cloudflare", icon:"🌐", name:"Cloudflare", tag:"Skill-based",
    desc:"Leverage Cloudflare's global network — CDN, security, serverless and developer platform.",
    color:"#fff3e0", accent:"#e65100",
    tree:[
      { label:"Cloudflare Basics", children:["How Cloudflare Works","DNS Management","Adding a Site to Cloudflare","Cloudflare Dashboard","Proxy Status (Orange / Grey Cloud)"] },
      { label:"CDN & Performance", children:["Caching Rules","Cache-Control Headers","Browser Cache TTL","Polish (Image Optimization)","Minification & Rocket Loader"] },
      { label:"Security", children:["WAF (Web Application Firewall)","DDoS Protection","Bot Management","SSL/TLS Modes","HSTS & Security Headers"] },
      { label:"DNS", children:["DNS Record Types (A, CNAME, MX, TXT)","DNS Propagation","DNSSEC","DNS Load Balancing","Cloudflare for SaaS"] },
      { label:"Cloudflare Workers", children:["What are Workers?","JavaScript in the Edge","Request / Response API","KV Storage","D1 (SQLite at Edge)"] },
      { label:"Pages & Deployment", children:["Cloudflare Pages","Git Integration","Build Configurations","Preview Deployments","Custom Domains"] },
      { label:"R2 Object Storage", children:["R2 vs S3","Buckets & Objects","S3 API Compatibility","Workers + R2","Zero Egress Costs"] },
      { label:"Durable Objects & Queues", children:["Durable Objects Concept","Real-time Coordination","Cloudflare Queues","Workflows","AI Gateway"] },
      { label:"Zero Trust & Access", children:["Cloudflare Access","Identity Providers","Tunnel (cloudflared)","Gateway (DNS Filtering)","CASB"] },
      { label:"Analytics & Observability", children:["Web Analytics","Logpush","GraphQL Analytics API","Workers Analytics Engine","Real User Monitoring (RUM)"] },
    ],
  },
  {
    id:"ai-red-teaming", icon:"🛡️", name:"AI Red Teaming", tag:"Skill-based",
    desc:"Test and break AI systems — find vulnerabilities, jailbreaks and safety failures in LLMs.",
    color:"#fce8e6", accent:"#b71c1c",
    tree:[
      { label:"AI Red Teaming Fundamentals", children:["What is AI Red Teaming?","Red Team vs Blue Team","Threat Modeling for AI","AI Risk Categories","Red Teaming Frameworks (MITRE ATLAS)"] },
      { label:"LLM Vulnerabilities", children:["Prompt Injection","Jailbreaking Techniques","Goal Hijacking","Data Extraction","Model Inversion"] },
      { label:"Attack Techniques", children:["Direct Prompt Injection","Indirect Prompt Injection","Adversarial Examples","Token Smuggling","Multi-turn Manipulation"] },
      { label:"Jailbreak Methods", children:["Role-play / Persona Attacks","DAN (Do Anything Now) Style","Obfuscation & Encoding","Many-shot Jailbreaking","Automated Jailbreak Search"] },
      { label:"Bias & Fairness Testing", children:["Demographic Bias Testing","Stereotype Elicitation","Counterfactual Testing","Representation Audits","Benchmark Datasets"] },
      { label:"Safety & Alignment Testing", children:["RLHF Failure Modes","Reward Hacking","Specification Gaming","Constitutional AI Testing","Value Alignment Probes"] },
      { label:"RAG & Agentic Systems", children:["RAG Poisoning","Tool Misuse Testing","Agent Hijacking","Supply Chain Attacks","Indirect Injection in Agents"] },
      { label:"Evaluation & Reporting", children:["Red Team Report Writing","Risk Scoring","Severity Classification","Reproduction Steps","Responsible Disclosure"] },
      { label:"Tools & Frameworks", children:["PyRIT (Microsoft)","Garak (LLM Vulnerabilities)","Promptfoo","HarmBench","AI Village CTF"] },
      { label:"Defenses & Mitigations", children:["Input / Output Filtering","Constitutional AI","Prompt Hardening","Monitoring & Alerting","Red Team → Blue Team Handoff"] },
    ],
  },
  {
    id:"ai-agents", icon:"🤖", name:"AI Agents", tag:"Skill-based",
    desc:"Build autonomous AI systems that plan, use tools and complete multi-step tasks independently.",
    color:"#f3e8fd", accent:"#6a1b9a",
    tree:[
      { label:"Agent Fundamentals", children:["What are AI Agents?","Perception, Reasoning, Action Loop","Agent vs Chatbot","Types (Reactive, Planning, Learning)","Agent Evaluation"] },
      { label:"LLM as a Reasoning Engine", children:["ReAct Pattern","Chain-of-Thought","Scratchpad Reasoning","Self-reflection","Plan-and-Execute"] },
      { label:"Tool Use & Function Calling", children:["Function Calling (OpenAI, Anthropic)","Tool Definition & Schemas","Parallel Tool Calls","Tool Selection Strategy","Error Handling in Tools"] },
      { label:"Memory Systems", children:["In-context Memory","External Memory (Vector DBs)","Episodic vs Semantic Memory","Conversation History Management","Summarization Memory"] },
      { label:"Planning & Orchestration", children:["Task Decomposition","DAG-based Planning","Hierarchical Planning","LangGraph State Machines","Dynamic Replanning"] },
      { label:"Multi-agent Systems", children:["Agent Roles & Teams","Communication Protocols","Supervisor Pattern","Debate & Verification Agents","AutoGen / CrewAI"] },
      { label:"Frameworks", children:["LangChain Agents","LlamaIndex Agents","LangGraph","AutoGen","Smolagents (HuggingFace)"] },
      { label:"Tools & Integrations", children:["Web Search (Tavily, Serper)","Code Execution Sandbox","Browser Automation (Playwright)","Email & Calendar APIs","Database Querying"] },
      { label:"Reliability & Safety", children:["Output Validation","Guardrails","Human-in-the-Loop","Cost & Token Budget Control","Logging & Observability (LangSmith)"] },
      { label:"Production Agents", children:["Async Agent Execution","Persistent Agent State","Agent Evaluation Frameworks","Deployment Patterns","Real-world Use Cases"] },
    ],
  },
  {
    id:"nextjs", icon:"▲", name:"Next.js", tag:"Skill-based",
    desc:"The React framework for production — server rendering, routing, APIs and full-stack React apps.",
    color:"#eceff1", accent:"#212121",
    tree:[
      { label:"Next.js Fundamentals", children:["What is Next.js?","Pages vs App Router","File-based Routing","Layouts & Templates","Loading & Error States"] },
      { label:"App Router (Next.js 13+)", children:["Server vs Client Components","React Server Components (RSC)","Nested Layouts","Route Groups","Parallel & Intercepting Routes"] },
      { label:"Data Fetching", children:["fetch() with caching","Server Component Data Fetching","React Query / SWR (Client)","Streaming with Suspense","Incremental Static Regeneration (ISR)"] },
      { label:"Rendering Strategies", children:["Static Site Generation (SSG)","Server-side Rendering (SSR)","Partial Prerendering (PPR)","Edge Runtime","Static Exports"] },
      { label:"Routing & Navigation", children:["Link Component","useRouter & usePathname","Dynamic Routes ([slug])","Catch-all Routes","Redirect & notFound()"] },
      { label:"API Routes", children:["Route Handlers (app/api)","GET, POST, PUT, DELETE","Middleware","Edge API Routes","Streaming Responses"] },
      { label:"Styling", children:["CSS Modules","Tailwind CSS","Styled Components","Sass","shadcn/ui Integration"] },
      { label:"Authentication", children:["NextAuth.js (Auth.js)","Middleware Protection","Session Management","OAuth Providers","JWT vs Database Sessions"] },
      { label:"Performance", children:["Image Optimization (next/image)","Font Optimization (next/font)","Script Optimization","Bundle Analysis","Core Web Vitals"] },
      { label:"Deployment", children:["Vercel Deployment","Docker Deployment","Environment Variables","Edge Config","Monitoring & Analytics"] },
    ],
  },
  {
    id:"code-review", icon:"👁️", name:"Code Review", tag:"Skill-based",
    desc:"Master the art of giving and receiving code reviews — improve code quality and team culture.",
    color:"#e8f5e9", accent:"#2e7d32",
    tree:[
      { label:"Code Review Fundamentals", children:["Why Code Reviews Matter","Review Goals (Quality, Knowledge Sharing, Standards)","Author vs Reviewer Mindset","When to Approve vs Request Changes","Review Culture"] },
      { label:"What to Look For", children:["Correctness & Logic","Edge Cases & Error Handling","Security Vulnerabilities","Performance Considerations","Readability & Maintainability"] },
      { label:"Code Quality Checks", children:["Naming Conventions","Function & Class Size","DRY Principle","SOLID Principles","Code Smells"] },
      { label:"Giving Good Feedback", children:["Constructive vs Critical Tone","Prefixes (nit:, blocking:, suggestion:)","Asking Questions Instead of Dictating","Praising Good Code","Explaining the Why"] },
      { label:"Receiving Feedback", children:["Separating Code from Identity","Responding to Comments","When to Push Back","Implementing Suggestions","Learning from Reviews"] },
      { label:"Testing in Reviews", children:["Checking Test Coverage","Reviewing Test Quality","TDD in PRs","Regression Test Additions","Test Readability"] },
      { label:"Security Review", children:["Input Validation","Authentication & Authorization","SQL Injection & XSS","Secrets in Code","Dependency Vulnerabilities"] },
      { label:"Tooling & Automation", children:["GitHub / GitLab PR Workflows","LGTM & Code Owners","Automated Linting (ESLint, Prettier)","Static Analysis (SonarQube)","AI Code Review (Copilot, CodeRabbit)"] },
      { label:"Review Metrics & Process", children:["Review Turnaround Time","PR Size Best Practices","Stacked PRs","Draft PRs","Merge Strategies (Squash, Rebase, Merge)"] },
      { label:"Building a Review Culture", children:["Team Review Guidelines","Review Checklist Templates","Pairing Instead of Reviewing","Async Review Best Practices","Psychological Safety"] },
    ],
  },
  {
    id:"kotlin", icon:"🟣", name:"Kotlin", tag:"Skill-based",
    desc:"Modern JVM language for Android and backend — concise, safe and fully interoperable with Java.",
    color:"#f3e8fd", accent:"#7b1fa2",
    tree:[
      { label:"Kotlin Basics", children:["Variables (val vs var)","Data Types & Type Inference","Control Flow (if, when, for, while)","Functions & Named Parameters","Null Safety"] },
      { label:"OOP in Kotlin", children:["Classes & Objects","Data Classes","Sealed Classes","Companion Objects","Inheritance & Interfaces"] },
      { label:"Functional Kotlin", children:["Lambda Expressions","Higher-order Functions","Extension Functions","Operator Overloading","Infix Functions"] },
      { label:"Collections", children:["List, Set, Map (Mutable vs Immutable)","Collection Operators (map, filter, reduce)","Sequences","Destructuring Declarations","Pair & Triple"] },
      { label:"Coroutines", children:["What are Coroutines?","suspend Functions","CoroutineScope & Builders (launch, async)","Flow (Cold Streams)","StateFlow & SharedFlow"] },
      { label:"Kotlin for Android", children:["Android with Kotlin","Jetpack Compose with Kotlin","ViewModel & LiveData","Room with Kotlin","Hilt DI"] },
      { label:"Kotlin for Backend", children:["Ktor Framework","Spring Boot with Kotlin","Exposed (ORM)","REST APIs with Ktor","Testing with Kotest"] },
      { label:"Generics & Delegation", children:["Generic Functions & Classes","Variance (in / out)","Reified Type Parameters","Property Delegation (by lazy, by observable)","Class Delegation"] },
      { label:"Interoperability", children:["Calling Java from Kotlin","Calling Kotlin from Java","@JvmOverloads & @JvmStatic","Annotation Processing (KSP)","Kotlin Multiplatform (KMP)"] },
      { label:"Testing", children:["JUnit 5 with Kotlin","Kotest","MockK","Coroutine Testing","Property-based Testing"] },
    ],
  },
  {
    id:"swift", icon:"🍎", name:"Swift & Swift UI", tag:"Skill-based",
    desc:"Apple's modern language for iOS, macOS and beyond — safe, fast and expressive.",
    color:"#fce8e6", accent:"#c62828",
    tree:[
      { label:"Swift Basics", children:["Variables & Constants (var / let)","Data Types & Type Inference","Optionals & Unwrapping","Control Flow","Functions & Closures"] },
      { label:"OOP & POP", children:["Classes vs Structs","Protocols","Protocol Extensions","Generics","Enums with Associated Values"] },
      { label:"Memory & Safety", children:["ARC (Automatic Reference Counting)","Strong, Weak, Unowned References","Value vs Reference Types","Memory Leaks","Thread Safety"] },
      { label:"Concurrency", children:["async / await","actors","Task & TaskGroup","Structured Concurrency","Sendable Protocol"] },
      { label:"SwiftUI Basics", children:["View Protocol","State & Binding","VStack, HStack, ZStack","List & ForEach","NavigationStack"] },
      { label:"SwiftUI Advanced", children:["Custom ViewModifiers","GeometryReader","PreferenceKey","Environment Values","@Observable (Swift 5.9+)"] },
      { label:"Data & Persistence", children:["@AppStorage","Core Data","SwiftData (iOS 17+)","Keychain","FileManager"] },
      { label:"Networking", children:["URLSession","async/await for Networking","Codable (JSON Parsing)","Combine + Networking","WebSockets"] },
      { label:"Testing", children:["XCTest","Unit Testing Swift Code","UI Testing","Snapshot Testing","Testing Async Code"] },
      { label:"Ecosystem & Tools", children:["Xcode","Swift Package Manager","Instruments (Profiling)","Fastlane","TestFlight & App Store Connect"] },
    ],
  },
  {
    id:"shell-bash", icon:"🐚", name:"Shell / Bash", tag:"Skill-based",
    desc:"Automate tasks, manage systems and work efficiently in the terminal with shell scripting.",
    color:"#eceff1", accent:"#37474f",
    tree:[
      { label:"Shell Basics", children:["What is a Shell?","bash vs zsh vs sh","Terminal Navigation","Commands & Arguments","stdin, stdout, stderr"] },
      { label:"File Operations", children:["ls, cd, mkdir, rm, cp, mv","find & locate","Wildcards & Globbing","Permissions (chmod, chown)","Links (ln)"] },
      { label:"Text Processing", children:["cat, head, tail, less","grep (Pattern Matching)","sed (Stream Editing)","awk (Text Processing)","sort, uniq, cut, wc"] },
      { label:"Pipes & Redirection", children:["> (Redirect Output)",">> (Append Output)","< (Redirect Input)","| (Pipe)","tee","Process Substitution"] },
      { label:"Variables & Environment", children:["Variable Assignment & Usage","Environment Variables","export & unset","$PATH","Quoting (Single vs Double)"] },
      { label:"Bash Scripting", children:["Shebang (#!/bin/bash)","Conditionals (if, case)","Loops (for, while, until)","Functions","Script Arguments ($1, $@, $#)"] },
      { label:"Process Management", children:["ps, kill, top","Background Jobs (&, nohup)","Job Control (fg, bg, jobs)","Signals (SIGTERM, SIGKILL)","Cron Jobs"] },
      { label:"String & Array Operations", children:["String Manipulation","Substring Extraction","Arrays in Bash","Associative Arrays","String Comparisons"] },
      { label:"Error Handling & Debugging", children:["Exit Codes ($?)","set -e, set -u, set -x","trap Command","Debugging Scripts","Error Logging"] },
      { label:"Advanced Bash", children:["Here Documents","Process Substitution","Named Pipes (mkfifo)","Regular Expressions in Bash","xargs"] },
    ],
  },
  {
    id:"laravel", icon:"🔴", name:"Laravel", tag:"Skill-based",
    desc:"The PHP framework for web artisans — elegant syntax, powerful features, rapid development.",
    color:"#fce8e6", accent:"#c0392b",
    tree:[
      { label:"Laravel Basics", children:["Installation & Artisan CLI","MVC Architecture","Routes (web.php, api.php)","Controllers","Blade Templating"] },
      { label:"Routing", children:["Route Parameters","Named Routes","Route Groups & Middleware","Route Model Binding","API Resource Routes"] },
      { label:"Eloquent ORM", children:["Models & Database Tables","CRUD with Eloquent","Relationships (hasMany, belongsTo, etc.)","Eager Loading (with())","Scopes & Accessors / Mutators"] },
      { label:"Database & Migrations", children:["Migrations & Schema Builder","Seeders & Factories","Query Builder","Database Transactions","Multiple Database Connections"] },
      { label:"Authentication & Authorization", children:["Laravel Breeze / Fortify / Jetstream","Gates & Policies","Roles & Permissions","API Authentication (Sanctum, Passport)","Social Login (Socialite)"] },
      { label:"Middleware & Requests", children:["Creating Middleware","Form Requests & Validation","File Uploads","Custom Validation Rules","Request Lifecycle"] },
      { label:"APIs with Laravel", children:["API Resources & Collections","Fractal Transformers","Rate Limiting","API Versioning","Testing APIs (PHPUnit, Pest)"] },
      { label:"Queues & Events", children:["Jobs & Queues (Redis, SQS)","Events & Listeners","Broadcasting (Pusher, Soketi)","Task Scheduling","Horizon (Queue Dashboard)"] },
      { label:"Testing", children:["PHPUnit & Pest","Feature vs Unit Tests","Database Testing","HTTP Testing","Mocking & Fakes"] },
      { label:"Performance & Deployment", children:["Caching (Redis, Memcached)","Octane (RoadRunner, Swoole)","Docker with Laravel","Forge / Vapor","CI/CD & Deployment"] },
    ],
  },
  {
    id:"elasticsearch", icon:"🔍", name:"Elasticsearch", tag:"Skill-based",
    desc:"Distributed search and analytics engine — power full-text search and real-time analytics at scale.",
    color:"#fff8e1", accent:"#f57f17",
    tree:[
      { label:"Elasticsearch Basics", children:["What is Elasticsearch?","Elastic Stack (ELK)","Indexes, Documents & Fields","Nodes & Clusters","Kibana Setup"] },
      { label:"CRUD Operations", children:["Indexing Documents","Retrieving Documents (GET)","Updating Documents","Deleting Documents","Bulk API"] },
      { label:"Search Queries", children:["Match Query","Term & Terms Query","Range Query","Bool Query (must, should, must_not)","Multi-match Query"] },
      { label:"Full-text Search", children:["Analyzers & Tokenizers","Inverted Index","Relevance Scoring (BM25)","Highlighting","Fuzzy Search & Typo Tolerance"] },
      { label:"Aggregations", children:["Metric Aggregations (avg, sum, min, max)","Bucket Aggregations (terms, date_histogram)","Pipeline Aggregations","Nested Aggregations","Composite Aggregations"] },
      { label:"Mappings & Index Settings", children:["Dynamic vs Explicit Mappings","Field Data Types","Index Templates","Component Templates","Alias Management"] },
      { label:"Performance & Tuning", children:["Shard Design","Indexing Performance","Search Performance","Caching (Query, Request, Shard)","JVM Tuning"] },
      { label:"Data Ingestion", children:["Logstash Pipelines","Beats (Filebeat, Metricbeat)","Ingest Pipelines","Elasticsearch API Ingestion","Kafka to Elasticsearch"] },
      { label:"Scaling & HA", children:["Replication","Shard Allocation","Cross-cluster Replication","Snapshot & Restore","Hot-Warm-Cold Architecture"] },
      { label:"Security & Observability", children:["X-Pack Security (TLS, Authentication)","Role-based Access Control","Kibana Dashboards","Alerting (Watcher / Kibana)","Index Lifecycle Management (ILM)"] },
    ],
  },
  {
    id:"wordpress", icon:"🌐", name:"WordPress", tag:"Skill-based",
    desc:"Build websites and web applications on the world's most popular CMS platform.",
    color:"#e8f0fe", accent:"#1565c0",
    tree:[
      { label:"WordPress Basics", children:["WordPress.org vs WordPress.com","Installation (Local & Hosting)","Dashboard Overview","Posts vs Pages","Categories & Tags"] },
      { label:"Themes", children:["Installing & Activating Themes","Child Themes","Full Site Editing (FSE) & Block Themes","Classic Theme Customizer","Theme Development Basics"] },
      { label:"Plugins", children:["Installing & Managing Plugins","Must-have Plugins (Yoast, Elementor, WooCommerce)","Plugin Settings & Configuration","Plugin Conflicts","Creating a Simple Plugin"] },
      { label:"WordPress Editor (Gutenberg)", children:["Block Editor Basics","Core Blocks","Reusable Blocks","Patterns","Full Site Editing (FSE)"] },
      { label:"WordPress Development", children:["WordPress File Structure","functions.php","hooks (add_action, add_filter)","Shortcodes","WordPress Coding Standards"] },
      { label:"Custom Post Types & Fields", children:["register_post_type()","Custom Taxonomies","ACF (Advanced Custom Fields)","Meta Boxes","Custom Fields in Queries"] },
      { label:"WooCommerce", children:["Setting Up a Store","Products & Variations","Payment Gateways","Shipping & Taxes","WooCommerce Hooks & Customization"] },
      { label:"REST API", children:["WordPress REST API Basics","Authentication (JWT, Application Passwords)","Custom Endpoints","Headless WordPress","WPGraphQL"] },
      { label:"Performance & SEO", children:["Caching (WP Rocket, W3 Total Cache)","Image Optimization","CDN Integration","Yoast SEO / RankMath","Core Web Vitals"] },
      { label:"Security & Maintenance", children:["Hardening WordPress","Backups (UpdraftPlus)","Security Plugins (Wordfence)","SSL & HTTPS","Updates & Maintenance"] },
    ],
  },
  {
    id:"django", icon:"🐍", name:"Django", tag:"Skill-based",
    desc:"The batteries-included Python web framework — build secure, scalable web apps rapidly.",
    color:"#e6f4ea", accent:"#1b5e20",
    tree:[
      { label:"Django Basics", children:["Django Project vs App","settings.py","urls.py (URL Configuration)","Views (FBV & CBV)","Templates & Template Language"] },
      { label:"Models & ORM", children:["Defining Models","Field Types","Migrations (makemigrations, migrate)","ORM Queries (filter, get, exclude)","Model Relationships"] },
      { label:"Django Admin", children:["Registering Models","ModelAdmin Customization","List Display & Filters","Inline Models","Custom Admin Actions"] },
      { label:"Forms & Validation", children:["Django Forms","ModelForms","Form Validation","Widgets","CSRF Protection"] },
      { label:"Authentication & Authorization", children:["Django's Built-in Auth","User Model","Login / Logout / Registration","Permissions & Groups","Django Allauth (Social Login)"] },
      { label:"Django REST Framework (DRF)", children:["Serializers","APIView & ViewSets","Routers","Authentication (JWT, Token)","Pagination & Filtering"] },
      { label:"Middleware & Request Lifecycle", children:["Django Middleware","Custom Middleware","Request/Response Objects","Session & Cookie Management","Security Middleware"] },
      { label:"Celery & Async Tasks", children:["Setting up Celery","Task Definition","Periodic Tasks (Celery Beat)","Result Backend (Redis)","Monitoring (Flower)"] },
      { label:"Testing", children:["TestCase & Client","Factory Boy","Fixtures","APIClient Testing","Coverage.py"] },
      { label:"Performance & Deployment", children:["Query Optimization (select_related, prefetch_related)","Caching (Redis, Memcached)","Django Channels (WebSockets)","Docker + Gunicorn + Nginx","CI/CD Deployment"] },
    ],
  },
  {
    id:"ruby", icon:"💎", name:"Ruby", tag:"Skill-based",
    desc:"An elegant, expressive programming language optimized for developer happiness.",
    color:"#fce8e6", accent:"#b71c1c",
    tree:[
      { label:"Ruby Basics", children:["Variables & Data Types","String Methods","Control Flow (if, unless, case)","Loops (each, times, while)","Methods & Blocks"] },
      { label:"OOP in Ruby", children:["Classes & Objects","Instance vs Class Methods","Inheritance","Mixins & Modules","attr_accessor / attr_reader"] },
      { label:"Collections", children:["Arrays & Array Methods","Hashes","Ranges","Enumerables (map, select, reduce)","Lazy Enumerators"] },
      { label:"Blocks, Procs & Lambdas", children:["Blocks & yield","Proc vs Lambda","Closures","Method Objects","Callable Objects"] },
      { label:"File I/O & Exceptions", children:["File Reading & Writing","begin / rescue / ensure","Custom Exceptions","Retry","Logging"] },
      { label:"Ruby Gems", children:["Bundler & Gemfile","Installing Gems","Creating a Gem","RubyGems.org","Version Constraints"] },
      { label:"Metaprogramming", children:["method_missing","define_method","open classes (Monkey Patching)","DSL Building","respond_to?"] },
      { label:"Testing", children:["RSpec (describe, it, expect)","FactoryBot","VCR / WebMock","Minitest","Test Coverage (SimpleCov)"] },
      { label:"Concurrency", children:["Threads & Fibers","Ractors (Ruby 3)","Async Gem","GIL & MRI","Sidekiq Background Jobs"] },
      { label:"Ruby Ecosystem", children:["Ruby on Rails intro","Sinatra","Rake Tasks","rbenv / RVM","Ruby 3.x Features"] },
    ],
  },
  {
    id:"ruby-on-rails", icon:"🚂", name:"Ruby on Rails", tag:"Skill-based",
    desc:"Convention over configuration — the full-stack Ruby framework for rapid web development.",
    color:"#fce8e6", accent:"#c62828",
    tree:[
      { label:"Rails Basics", children:["MVC Architecture","rails new & Directory Structure","Rails Console","Generators","Convention over Configuration"] },
      { label:"Routing", children:["config/routes.rb","RESTful Routes (resources)","Named Routes","Nested Routes","Custom Route Constraints"] },
      { label:"Models & ActiveRecord", children:["Migrations","Validations","Associations (has_many, belongs_to, etc.)","Scopes","Callbacks"] },
      { label:"Controllers", children:["CRUD Actions","Strong Parameters","Before Actions (Filters)","Respond To (HTML, JSON)","Flash Messages"] },
      { label:"Views & Asset Pipeline", children:["ERB Templates","Partials & Layouts","Form Helpers","Asset Pipeline / Propshaft","Hotwire (Turbo + Stimulus)"] },
      { label:"Authentication & Authorization", children:["Devise","JWT APIs","CanCanCan / Pundit","OAuth (OmniAuth)","Two-factor Authentication"] },
      { label:"API Mode", children:["Rails API Only Mode","Serializers (fast_jsonapi, active_model_serializers)","Versioned APIs","Pagination","API Documentation (Rswag)"] },
      { label:"Background Jobs", children:["Active Job","Sidekiq","Delayed Job","Cron Jobs (whenever)","Queue Adapters"] },
      { label:"Testing", children:["RSpec with Rails","Factory Bot","Request Specs","System Tests (Capybara)","Test Coverage"] },
      { label:"Performance & Deployment", children:["N+1 Query Detection (Bullet)","Caching (Redis, Fragment)","Puma Server","Docker + Rails","Heroku / Render / Fly.io"] },
    ],
  },
  {
    id:"claude-code", icon:"🤖", name:"Claude Code", tag:"Skill-based",
    desc:"Master Anthropic's agentic coding tool — AI-powered development in your terminal.",
    color:"#f3e8fd", accent:"#7b1fa2",
    tree:[
      { label:"Getting Started", children:["What is Claude Code?","Installation (npm install -g @anthropic-ai/claude-code)","Authentication (Anthropic API Key)","claude Command Basics","Slash Commands Overview"] },
      { label:"Core Workflows", children:["Asking Questions about Codebases","Making Code Changes","Running Tests & Fixing Failures","Debugging with Claude Code","Git Integration (commit, PR creation)"] },
      { label:"File & Codebase Navigation", children:["Codebase Exploration","Reading & Editing Files","Multi-file Refactors","Search & Replace","Understanding Large Codebases"] },
      { label:"Agentic Capabilities", children:["Multi-step Task Execution","Tool Use (Bash, Edit, Read)","Extended Thinking","Autonomous Bug Fixes","Feature Implementation"] },
      { label:"Custom Slash Commands", children:["Creating /commands","Markdown-based Commands","Project-specific Workflows","Team Shared Commands","CLAUDE.md Configuration"] },
      { label:"CLAUDE.md & Context", children:["Project Instructions in CLAUDE.md","Codebase Context Setup","Onboarding Teams to Claude Code","Memory & Context Management","Best Practices for Instructions"] },
      { label:"CI/CD & Automation", children:["Claude Code in GitHub Actions","Automated PR Reviews","Test Generation Pipelines","Automated Documentation","Headless Mode (--print flag)"] },
      { label:"SDK & Programmatic Use", children:["Claude Code SDK","Building Agents with Claude Code","Tool Definitions","Streaming Responses","Error Handling"] },
      { label:"Security & Permissions", children:["Permission System","Allowed Tools Configuration","Sensitive File Handling","Network Access Control","Audit Logging"] },
      { label:"Productivity Tips", children:["Effective Prompting for Code","Iterative Development","Code Review with Claude","Architecture Discussions","Combining with Other AI Tools"] },
    ],
  },
  {
    id:"vibe-coding", icon:"✨", name:"Vibe Coding", tag:"Skill-based",
    desc:"AI-assisted development — build apps rapidly by collaborating with AI at every step.",
    color:"#f3e8fd", accent:"#e91e63",
    tree:[
      { label:"What is Vibe Coding?", children:["AI-first Development Philosophy","Vibe Coding vs Traditional Coding","When to Vibe Code","Choosing Your AI Stack","Setting Expectations"] },
      { label:"AI Coding Assistants", children:["GitHub Copilot","Cursor IDE","Claude Code","Windsurf","Aider (Terminal)"] },
      { label:"Prompting for Code", children:["Writing Clear Code Prompts","Iterative Refinement","Providing Context","Specifying Tech Stack","Error-driven Development"] },
      { label:"Building with AI", children:["Starting a Project from a Prompt","Feature Addition Workflow","Debugging with AI","AI-assisted Refactoring","Documentation Generation"] },
      { label:"Frontend Vibe Coding", children:["v0 by Vercel (UI Generation)","Generating React Components","Styling with AI (Tailwind)","Bolt.new & Lovable.dev","Prototyping UIs Rapidly"] },
      { label:"Backend & Full-stack", children:["Scaffold APIs with AI","Database Schema Design","Environment Setup","Deploying AI-generated Apps","Replit AI Agent"] },
      { label:"Quality & Review", children:["Reviewing AI-generated Code","Testing AI Code","Security Review","Performance Check","Iterating on AI Output"] },
      { label:"Workflow & Productivity", children:["Cursor Rules & .cursorrules","AI Memory & Project Context","Multi-file Edits","Context Window Management","Pair Programming with AI"] },
      { label:"Limitations & Best Practices", children:["When AI Gets it Wrong","Hallucinations in Code","Over-relying on AI","Maintaining Understanding","Blending Manual + AI Code"] },
      { label:"Future of Vibe Coding", children:["Agentic Coding Trends","AI Pair Programmer Evolution","Natural Language Programming","Code Generation Models","Career Impact of AI Coding"] },
    ],
  },
  {
    id:"html", icon:"🌐", name:"HTML", tag:"Skill-based",
    desc:"The backbone of the web — master HTML5 markup, semantics, forms and accessibility.",
    color:"#fff3e0", accent:"#e65100",
    tree:[
      { label:"HTML Basics", children:["Document Structure (DOCTYPE, html, head, body)","Elements & Tags","Attributes","Comments","Character Entities"] },
      { label:"Text & Content", children:["Headings (h1-h6)","Paragraphs & Line Breaks","Strong, Em, Mark, Small","Blockquote & Cite","Pre & Code"] },
      { label:"Links & Media", children:["Anchor Tags & href","Relative vs Absolute URLs","Images (img, alt, srcset)","Video & Audio Elements","iframe"] },
      { label:"Lists & Tables", children:["Ordered & Unordered Lists","Definition Lists","Table Structure (table, tr, th, td)","Colspan & Rowspan","Caption & Scope"] },
      { label:"Forms", children:["Form Element & Action/Method","Input Types (text, email, password, checkbox, radio)","Textarea & Select","Labels & Fieldsets","Form Validation (required, pattern)"] },
      { label:"Semantic HTML", children:["header, nav, main, footer","article, section, aside","figure & figcaption","time, address, mark","Why Semantics Matter"] },
      { label:"HTML5 APIs", children:["Canvas Element","SVG in HTML","Drag & Drop API","Geolocation API","Web Storage (localStorage, sessionStorage)"] },
      { label:"Accessibility (a11y)", children:["ARIA Roles & Attributes","alt Text Best Practices","Keyboard Navigation","Screen Reader Compatibility","WCAG Guidelines"] },
      { label:"SEO with HTML", children:["Title & Meta Description","Open Graph Tags","Structured Data (Schema.org)","Canonical URLs","Sitemap & robots.txt"] },
      { label:"HTML Best Practices", children:["Valid HTML (W3C Validator)","Document Outline","Performance (defer, async scripts)","Security (noopener, noreferrer)","Progressive Enhancement"] },
    ],
  },
  {
    id:"css", icon:"🎨", name:"CSS", tag:"Skill-based",
    desc:"Style the web — master CSS layouts, animations, responsive design and modern techniques.",
    color:"#e8f0fe", accent:"#1565c0",
    tree:[
      { label:"CSS Basics", children:["Selectors (element, class, id, attribute)","Specificity & Cascade","Inheritance","Color Values","Units (px, em, rem, %, vw, vh)"] },
      { label:"Box Model", children:["Content, Padding, Border, Margin","box-sizing: border-box","Collapsing Margins","Outline vs Border","Display Property"] },
      { label:"Typography", children:["font-family, font-size, font-weight","line-height & letter-spacing","text-transform & text-decoration","Web Fonts (@font-face, Google Fonts)","Responsive Typography (clamp)"] },
      { label:"Flexbox", children:["flex container vs flex items","justify-content & align-items","flex-direction & flex-wrap","flex-grow, flex-shrink, flex-basis","align-self & order"] },
      { label:"CSS Grid", children:["grid-template-columns & rows","grid-gap / gap","grid-area & Named Lines","auto-fill vs auto-fit","Subgrid"] },
      { label:"Responsive Design", children:["Media Queries","Mobile-first Approach","Fluid Layouts","Responsive Images (srcset)","Container Queries"] },
      { label:"Positioning & Z-index", children:["static, relative, absolute, fixed, sticky","z-index & Stacking Context","top, right, bottom, left","Overflow (hidden, scroll, clip)","clip-path"] },
      { label:"Animations & Transitions", children:["transition Property","@keyframes","animation Shorthand","transform (rotate, scale, translate)","will-change & Performance"] },
      { label:"Modern CSS", children:["CSS Custom Properties (Variables)",":is(), :where(), :has()","CSS Layers (@layer)","color-mix() & oklch","@container Queries"] },
      { label:"Tooling & Frameworks", children:["Tailwind CSS","CSS Modules","Sass / SCSS","PostCSS","CSS-in-JS (Styled Components, Emotion)"] },
    ],
  },
  {
    id:"asp-net-core", icon:"🔵", name:"ASP.NET Core", tag:"Skill-based",
    desc:"Build high-performance web apps and APIs with Microsoft's cross-platform .NET framework.",
    color:"#e8f0fe", accent:"#1565c0",
    tree:[
      { label:"ASP.NET Core Basics", children:["What is ASP.NET Core?",".NET SDK & CLI","Project Structure","Program.cs & Minimal APIs","Middleware Pipeline"] },
      { label:"Controllers & Routing", children:["MVC Controllers","Attribute Routing","Route Constraints","Model Binding","Action Filters"] },
      { label:"REST APIs", children:["ApiController Attribute","HTTP Methods & Status Codes","IActionResult & Results","Content Negotiation","Versioning APIs"] },
      { label:"Dependency Injection", children:["Built-in DI Container","Service Lifetimes (Singleton, Scoped, Transient)","Registering Services","Constructor Injection","Options Pattern"] },
      { label:"Entity Framework Core", children:["Code-First Approach","DbContext & DbSet","Migrations","LINQ Queries","Relationships & Navigation Properties"] },
      { label:"Authentication & Authorization", children:["JWT Bearer Authentication","ASP.NET Core Identity","Policies & Claims","OAuth2 / OpenID Connect","Role-based Authorization"] },
      { label:"Blazor", children:["What is Blazor?","Blazor Server vs WebAssembly","Components & Data Binding","Event Handling","Forms & Validation in Blazor"] },
      { label:"SignalR (Real-time)", children:["What is SignalR?","Hubs","Client-Server Communication","Groups & Users","SignalR with JavaScript Client"] },
      { label:"Testing", children:["xUnit & NUnit","WebApplicationFactory","Moq (Mocking)","Integration Testing","Testcontainers for .NET"] },
      { label:"Performance & Deployment", children:["Minimal APIs Performance","Response Caching & Output Caching","Health Checks","Docker + .NET","Azure App Service / AWS ECS"] },
    ],
  },
  {
    id:"react-native", icon:"📱", name:"React Native", tag:"Skill-based",
    desc:"Build native mobile apps for iOS and Android using React and JavaScript.",
    color:"#e8f0fe", accent:"#0288d1",
    tree:[
      { label:"React Native Basics", children:["React Native vs Expo","Core Components (View, Text, Image, ScrollView)","Styling with StyleSheet","Flexbox in React Native","Platform-specific Code"] },
      { label:"State & Hooks", children:["useState & useEffect","useRef & useMemo","Context API","Custom Hooks","Zustand / Redux Toolkit"] },
      { label:"Navigation", children:["React Navigation Setup","Stack Navigator","Tab Navigator (Bottom & Top)","Drawer Navigator","Deep Linking"] },
      { label:"UI Components & Libraries", children:["TouchableOpacity & Pressable","FlatList & SectionList","TextInput & Forms","React Native Paper","NativeWind (Tailwind)"] },
      { label:"APIs & Networking", children:["Fetch & Axios","REST APIs","GraphQL with Apollo","WebSockets","Offline Support (NetInfo)"] },
      { label:"Native Modules & Device APIs", children:["Camera (react-native-vision-camera)","Location (react-native-maps)","Push Notifications (FCM / APNs)","AsyncStorage","Biometrics"] },
      { label:"Animations", children:["Animated API","React Native Reanimated 3","Gesture Handler","Layout Animations","Lottie Animations"] },
      { label:"Testing", children:["Jest + React Native Testing Library","Detox (E2E)","Mocking Native Modules","Snapshot Testing","Performance Testing"] },
      { label:"Performance", children:["Hermes JS Engine","Flipper Debugging","FlatList Optimization","Memo & Callback","Native Module Bridging"] },
      { label:"Build & Publishing", children:["Expo EAS Build","Android APK / AAB","iOS IPA","Over-the-Air Updates (EAS Update)","App Store & Play Store Submission"] },
    ],
  },
];

// ── localStorage helpers for admin-added roadmaps
const CUSTOM_ROADMAPS_KEY = "edupath_custom_roadmaps";
const getCustomRoadmaps   = () => { try { return JSON.parse(localStorage.getItem(CUSTOM_ROADMAPS_KEY)) || []; } catch { return []; } };
const saveCustomRoadmaps  = (list) => localStorage.setItem(CUSTOM_ROADMAPS_KEY, JSON.stringify(list));

// ── Add Roadmap Modal (admin only)
function AddRoadmapModal({ onClose, onSave }) {
  const ACCENT_PRESETS = ["#1a73e8","#34a853","#ea8600","#d93025","#8430ce","#00897b","#e91e63","#f9a825","#0097a7","#546e7a"];
  const COLOR_MAP      = { "#1a73e8":"#e8f0fe","#34a853":"#e6f4ea","#ea8600":"#fff3e0","#d93025":"#fce8e6","#8430ce":"#f3e8fd","#00897b":"#e0f7fa","#e91e63":"#fce4ec","#f9a825":"#fff8e1","#0097a7":"#e0f7fa","#546e7a":"#eceff1" };
  const ICON_OPTIONS   = ["🖥️","⚙️","🔧","📊","🤖","🔐","📱","🧮","☁️","🌐","📡","🎯","🧪","🔬","💡","🚀","🎓","📐","🗄️","🔗"];

  const [form, setForm]   = useState({ name:"", icon:"🚀", tag:"Role-based", desc:"", accent:"#1a73e8" });
  const [topics, setTopics] = useState([{ label:"", children:[""] }]);
  const [error, setError]   = useState("");
  const [step, setStep]     = useState(1);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTopic      = () => setTopics(t => [...t, { label:"", children:[""] }]);
  const removeTopic   = (ti) => setTopics(t => t.filter((_,i) => i!==ti));
  const setTopicLabel = (ti, v) => setTopics(t => t.map((tp,i) => i===ti ? { ...tp, label:v } : tp));
  const addChild      = (ti) => setTopics(t => t.map((tp,i) => i===ti ? { ...tp, children:[...tp.children,""] } : tp));
  const removeChild   = (ti, ci) => setTopics(t => t.map((tp,i) => i===ti ? { ...tp, children:tp.children.filter((_,j) => j!==ci) } : tp));
  const setChild      = (ti, ci, v) => setTopics(t => t.map((tp,i) => i===ti ? { ...tp, children:tp.children.map((c,j) => j===ci ? v : c) } : tp));

  const handleSave = () => {
    const clean = topics.filter(t => t.label.trim()).map(t => ({ label:t.label.trim(), children:t.children.map(c=>c.trim()).filter(Boolean) }));
    if (!form.name.trim() || !form.desc.trim()) { setError("Name and description are required."); return; }
    if (clean.length === 0) { setError("Add at least one topic with a label."); return; }
    const r = { id:"custom-"+Date.now(), icon:form.icon, name:form.name.trim(), tag:form.tag, desc:form.desc.trim(), accent:form.accent, color:COLOR_MAP[form.accent]||"#f0f4f9", tree:clean, isCustom:true };
    const updated = [...getCustomRoadmaps(), r];
    saveCustomRoadmaps(updated);
    onSave(updated);
    onClose();
  };

  const inpStyle = { width:"100%", padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.85rem", background:"var(--main-bg)", color:"var(--text)" };
  const labelStyle = { fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:6 };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="fadeUp" style={{ background:"var(--card-bg)", borderRadius:20, padding:"30px 28px", width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.22)", border:"1px solid var(--border)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:"1.05rem", fontWeight:900 }}>➕ Add New Roadmap</div>
            <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginTop:2 }}>Step {step} of 2 — {step===1?"Basic Info":"Topics & Subtopics"}</div>
          </div>
          <button onClick={onClose} style={{ background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, color:"var(--muted)", fontFamily:"Nunito,sans-serif" }}>✕</button>
        </div>
        {/* Step bar */}
        <div style={{ display:"flex", gap:8, marginBottom:22 }}>
          {[1,2].map(s => <div key={s} style={{ flex:1, height:4, borderRadius:99, background:step>=s?"var(--blue)":"var(--border)", transition:"background 0.3s" }} />)}
        </div>

        {error && <div style={{ background:"#fce8e6", border:"1px solid #f5c6c3", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:"0.77rem", color:"#d93025", fontWeight:700 }}>⚠️ {error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>ICON</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {ICON_OPTIONS.map(ic => (
                  <div key={ic} onClick={() => setF("icon", ic)}
                    style={{ width:36, height:36, borderRadius:9, border:`2px solid ${form.icon===ic?"var(--blue)":"var(--border)"}`, background:form.icon===ic?"var(--blue-light)":"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", cursor:"pointer", transition:"all 0.12s" }}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={labelStyle}>ROADMAP NAME</div>
              <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="e.g. Cloud Computing, iOS Development…" style={inpStyle} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={labelStyle}>DESCRIPTION</div>
              <input value={form.desc} onChange={e => setF("desc", e.target.value)} placeholder="Short description of what this roadmap covers…" style={inpStyle} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>CATEGORY</div>
              <div style={{ display:"flex", gap:10 }}>
                {["Role-based","Skill-based"].map(t => (
                  <button key={t} onClick={() => setF("tag", t)}
                    style={{ flex:1, padding:"10px", border:`2px solid ${form.tag===t?"var(--blue)":"var(--border)"}`, borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer", background:form.tag===t?"var(--blue-light)":"white", color:form.tag===t?"var(--blue)":"var(--muted)", transition:"all 0.15s" }}>
                    {t==="Role-based"?"👤 Role-based":"🛠️ Skill-based"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>ACCENT COLOUR</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ACCENT_PRESETS.map(ac => (
                  <div key={ac} onClick={() => setF("accent", ac)}
                    style={{ width:30, height:30, borderRadius:"50%", background:ac, cursor:"pointer", border:`3px solid ${form.accent===ac?"var(--text)":"transparent"}`, boxShadow:form.accent===ac?`0 0 0 2px white, 0 0 0 4px ${ac}`:"none", transition:"all 0.15s" }} />
                ))}
              </div>
              {/* Preview */}
              <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, background:COLOR_MAP[form.accent]||"#f0f4f9", border:`1.5px solid ${form.accent}40` }}>
                <div style={{ width:34, height:34, borderRadius:10, background:COLOR_MAP[form.accent]||"#f0f4f9", border:`2px solid ${form.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>{form.icon}</div>
                <div>
                  <div style={{ fontSize:"0.85rem", fontWeight:800, color:"var(--text)" }}>{form.name||"Roadmap Name"}</div>
                  <span style={{ fontSize:"0.58rem", fontWeight:700, padding:"2px 8px", borderRadius:50, background:form.accent, color:"white" }}>{form.tag}</span>
                </div>
              </div>
            </div>
            <button onClick={() => { setError(""); if(!form.name.trim()||!form.desc.trim()){setError("Name and description required.");return;} setStep(2); }}
              style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.9rem", cursor:"pointer" }}>
              Next: Add Topics →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:"0.77rem", color:"var(--muted)", marginBottom:14, lineHeight:1.6 }}>Add topics and their subtopics. Blank entries will be ignored.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:360, overflowY:"auto", paddingRight:2 }}>
              {topics.map((topic, ti) => (
                <div key={ti} style={{ background:"var(--main-bg)", borderRadius:12, padding:"13px 14px", border:"1.5px solid var(--border)" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:form.accent, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.62rem", fontWeight:800, flexShrink:0 }}>{ti+1}</div>
                    <input value={topic.label} onChange={e => setTopicLabel(ti, e.target.value)} placeholder={`Topic — e.g. HTML Basics`}
                      style={{ flex:1, padding:"7px 11px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", fontWeight:700, background:"white", color:"var(--text)" }} />
                    {topics.length > 1 && (
                      <button onClick={() => removeTopic(ti)} style={{ background:"#fce8e6", border:"none", borderRadius:7, padding:"5px 9px", cursor:"pointer", color:"#d93025", fontSize:"0.72rem", fontWeight:800, fontFamily:"Nunito,sans-serif" }}>✕</button>
                    )}
                  </div>
                  <div style={{ marginLeft:32, display:"flex", flexDirection:"column", gap:5 }}>
                    {topic.children.map((child, ci) => (
                      <div key={ci} style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:form.accent, flexShrink:0 }} />
                        <input value={child} onChange={e => setChild(ti, ci, e.target.value)} placeholder="Subtopic — e.g. Semantic HTML"
                          style={{ flex:1, padding:"6px 10px", border:"1px solid var(--border)", borderRadius:7, fontFamily:"Nunito,sans-serif", fontSize:"0.77rem", background:"white", color:"var(--text)" }} />
                        {topic.children.length > 1 && (
                          <button onClick={() => removeChild(ti, ci)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:"0.85rem", padding:"0 3px" }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addChild(ti)} style={{ alignSelf:"flex-start", marginTop:3, padding:"4px 12px", borderRadius:20, border:"1.5px dashed var(--blue)", background:"white", color:"var(--blue)", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.68rem", cursor:"pointer" }}>+ Add Subtopic</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addTopic} style={{ width:"100%", marginTop:10, padding:"9px", border:"1.5px dashed var(--border)", borderRadius:12, background:"white", color:"var(--muted)", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", cursor:"pointer" }}>＋ Add Topic</button>
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              <button onClick={() => { setError(""); setStep(1); }} style={{ flex:1, padding:"12px", background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", color:"var(--text)" }}>← Back</button>
              <button onClick={handleSave} style={{ flex:2, padding:"12px", background:"linear-gradient(135deg,var(--green),#2d9248)", color:"white", border:"none", borderRadius:12, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.88rem", cursor:"pointer" }}>✓ Save Roadmap</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Delete confirmation modal
function DeleteRoadmapConfirm({ roadmap, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:3100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div className="fadeUp" style={{ background:"var(--card-bg)", borderRadius:18, padding:"28px 24px", maxWidth:360, width:"100%", boxShadow:"0 16px 48px rgba(0,0,0,0.2)", border:"1px solid var(--border)", textAlign:"center" }}>
        <div style={{ fontSize:"2.2rem", marginBottom:10 }}>🗑️</div>
        <div style={{ fontSize:"1rem", fontWeight:800, marginBottom:8 }}>Delete "{roadmap.name}"?</div>
        <div style={{ fontSize:"0.77rem", color:"var(--muted)", marginBottom:22, lineHeight:1.6 }}>This roadmap will be permanently removed and cannot be recovered.</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer", color:"var(--text)" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"11px", background:"#d93025", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.82rem", cursor:"pointer" }}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
}

function ExploreRoadmapsPage({ isAdmin }) {
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [openNodes, setOpenNodes]   = useState({});
  const [customRoadmaps, setCustom] = useState(getCustomRoadmaps);
  const [showAddModal, setShowAdd]  = useState(false);
  const [deleteTarget, setDel]      = useState(null);

  const allRoadmaps = [...EXPLORE_ROADMAPS, ...customRoadmaps];
  const filtered    = allRoadmaps.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.desc.toLowerCase().includes(search.toLowerCase()) ||
    r.tag.toLowerCase().includes(search.toLowerCase())
  );

  const toggleNode  = (id) => setOpenNodes(p => ({ ...p, [id]: !p[id] }));
  const handleDelete = (r) => {
    const updated = customRoadmaps.filter(x => x.id !== r.id);
    saveCustomRoadmaps(updated);
    setCustom(updated);
    setDel(null);
    if (selected?.id === r.id) setSelected(null);
  };

  const tagCount = (tag) => tag==="All" ? allRoadmaps.length : allRoadmaps.filter(r=>r.tag===tag).length;

  if (selected) return (
    <>
      {deleteTarget && <DeleteRoadmapConfirm roadmap={deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDel(null)} />}
      <RoadmapTreeView roadmap={selected} isAdmin={isAdmin}
        onBack={() => { setSelected(null); setOpenNodes({}); }}
        onDelete={isAdmin && selected.isCustom ? () => setDel(selected) : null}
        openNodes={openNodes} toggleNode={toggleNode} />
    </>
  );

  return (
    <div>
      {showAddModal && <AddRoadmapModal onClose={() => setShowAdd(false)} onSave={setCustom} />}
      {deleteTarget && <DeleteRoadmapConfirm roadmap={deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDel(null)} />}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a73e8 0%,#1558b0 100%)", borderRadius:16, padding:"32px 28px", marginBottom:24, color:"white", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ position:"absolute", right:60, bottom:-40, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:8 }}>
          <div style={{ fontSize:"1.7rem", fontWeight:900, lineHeight:1.2 }}>Roadmap Finder</div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)}
              style={{ padding:"10px 18px", background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)", border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:12, color:"white", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.82rem", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.3)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}>
              ➕ Add Roadmap
            </button>
          )}
        </div>
        <div style={{ fontSize:"0.88rem", opacity:0.85, maxWidth:480, marginBottom:20, lineHeight:1.6 }}>
          Curated step-by-step paths for every role and skill — from beginner to production-ready.
        </div>
        <div style={{ position:"relative", maxWidth:440 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:"1rem" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roadmaps — Frontend, Python, DevOps…"
            style={{ width:"100%", padding:"12px 16px 12px 40px", borderRadius:12, border:"none", fontFamily:"Nunito,sans-serif", fontSize:"0.85rem", background:"rgba(255,255,255,0.15)", color:"white", outline:"none", backdropFilter:"blur(4px)" }} />
        </div>
      </div>

      {/* Tag filters */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        {["All","Role-based","Skill-based"].map(tag => (
          <button key={tag} onClick={() => setSearch(tag==="All"?"":tag)}
            style={{ padding:"6px 16px", borderRadius:50, border:"1.5px solid var(--border)", background:"white", color:"var(--text)", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.75rem", cursor:"pointer" }}>
            {tag} <span style={{ fontSize:"0.65rem", color:"var(--muted)", marginLeft:4 }}>({tagCount(tag)})</span>
          </button>
        ))}
        <span style={{ fontSize:"0.75rem", color:"var(--muted)", marginLeft:4 }}>{filtered.length} roadmap{filtered.length!==1?"s":""}</span>
        {customRoadmaps.length > 0 && (
          <span style={{ fontSize:"0.68rem", padding:"3px 10px", borderRadius:50, background:"#e6f4ea", color:"#34a853", fontWeight:700 }}>✦ {customRoadmaps.length} custom</span>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:10 }}>🔍</div>
          <div style={{ fontWeight:700 }}>No roadmaps found for "{search}"</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ background:"white", borderRadius:18, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 4px 12px rgba(0,0,0,0.06)", transition:"all 0.2s", cursor:"pointer", position:"relative", display:"flex", flexDirection:"column" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.12)"; e.currentTarget.style.borderColor=r.accent; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor="var(--border)"; }}>
              {r.isCustom && <div style={{ position:"absolute", top:14, right:14, fontSize:"0.6rem", fontWeight:800, padding:"4px 10px", borderRadius:50, background:"#e6f4ea", color:"#34a853", zIndex:1 }}>✦ Custom</div>}
              <div style={{ height:8, background:r.accent }} />
              <div style={{ padding:"24px 26px", flex:1, display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:16 }}>
                  <div style={{ width:58, height:58, borderRadius:16, background:r.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0 }}>{r.icon}</div>
                  <div style={{ flex:1, paddingRight: r.isCustom ? 52 : 0 }}>
                    <div style={{ fontSize:"1.05rem", fontWeight:800, color:"var(--text)", marginBottom:6 }}>{r.name}</div>
                    <span style={{ fontSize:"0.65rem", fontWeight:700, padding:"3px 10px", borderRadius:50, background:r.color, color:r.accent }}>{r.tag}</span>
                  </div>
                </div>
                <div style={{ fontSize:"0.82rem", color:"var(--muted)", lineHeight:1.7, marginBottom:20, flex:1 }}>{r.desc}</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                  <span style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600 }}>📋 {r.tree.length} topics</span>
                  <div style={{ display:"flex", gap:8 }}>
                    {isAdmin && r.isCustom && (
                      <button onClick={e => { e.stopPropagation(); setDel(r); }}
                        style={{ padding:"9px 14px", background:"#fce8e6", color:"#d93025", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.75rem", cursor:"pointer" }}>🗑️</button>
                    )}
                    <button onClick={() => { setSelected(r); setOpenNodes({}); }}
                      style={{ padding:"10px 22px", background:r.accent, color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.82rem", cursor:"pointer" }}>
                      View Roadmap →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Add Roadmap card — always last */}
          {isAdmin && (
            <div onClick={() => setShowAdd(true)}
              style={{ background:"white", borderRadius:18, border:"2px dashed var(--border)", overflow:"hidden", boxShadow:"none", transition:"all 0.2s", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:220, gap:12 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="var(--blue)"; e.currentTarget.style.background="var(--blue-light)"; e.currentTarget.style.transform="translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="white"; e.currentTarget.style.transform=""; }}>
              <div style={{ width:58, height:58, borderRadius:16, background:"var(--blue-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem" }}>➕</div>
              <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--blue)" }}>Add Roadmap</div>
              <div style={{ fontSize:"0.75rem", color:"var(--muted)", textAlign:"center", maxWidth:180 }}>Create a custom roadmap for your domain</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Resource data per subtopic (description + free + paid resources)
const SUBTOPIC_RESOURCES = {};

function getSubtopicKey(roadmapId, topicLabel, child) {
  return `${roadmapId}||${topicLabel}||${child}`;
}

// ── localStorage persistence for admin-edited subtopic data
const SUBTOPIC_STORAGE_KEY = "edupath_subtopic_overrides";
function loadSubtopicOverrides() { try { return JSON.parse(localStorage.getItem(SUBTOPIC_STORAGE_KEY)) || {}; } catch { return {}; } }
function saveSubtopicOverrides(obj) { localStorage.setItem(SUBTOPIC_STORAGE_KEY, JSON.stringify(obj)); }

const RESOURCE_TYPES = ["Article","Video","Course","Book","Docs","Tutorial","Podcast","Tool"];

// ── API Key helpers (stored in localStorage)
const ANTHROPIC_KEY_STORAGE = "edupath_anthropic_key";
const getApiKey   = ()    => { try { return localStorage.getItem(ANTHROPIC_KEY_STORAGE) || ""; } catch { return ""; } };
const saveApiKey  = (key) => localStorage.setItem(ANTHROPIC_KEY_STORAGE, key.trim());
const clearApiKey = ()    => localStorage.removeItem(ANTHROPIC_KEY_STORAGE);

// ── Shared AI call helper
async function callAI(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  const raw = data.content?.map(b => b.text || "").join("").trim();
  const clean = raw.replace(/```json[\s\S]*?```|```/g, "").trim();
  return JSON.parse(clean);
}


// ── Inline API key setup (shown inside SubtopicPanel when no key set)
function ApiKeyInlineSetup({ onSaved, accent }) {
  const [key, setKey]     = useState("");
  const [show, setShow]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState("");

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-ant-")) { setErr("Key should start with sk-ant-…"); return; }
    setSaving(true); setErr("");
    // Quick validation call
    try {
      saveApiKey(trimmed);
      await callAI("Say OK");
      onSaved();
    } catch(e) {
      clearApiKey();
      setErr(e.message || "Invalid key — please check and try again.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth:380, margin:"0 auto" }}>
      <div style={{ display:"flex", gap:8 }}>
        <input
          type={show ? "text" : "password"}
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-api03-…"
          style={{ flex:1, padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.8rem", background:"var(--main-bg)", color:"var(--text)", outline:"none" }}
        />
        <button onClick={() => setShow(s => !s)}
          style={{ padding:"10px 12px", border:"1px solid var(--border)", borderRadius:10, background:"var(--main-bg)", cursor:"pointer", fontSize:"0.8rem" }}>
          {show ? "🙈" : "👁️"}
        </button>
        <button onClick={handleSave} disabled={saving || !key.trim()}
          style={{ padding:"10px 18px", background: accent || "#1a73e8", color:"white", border:"none", borderRadius:10, cursor:"pointer", fontWeight:800, fontSize:"0.8rem", fontFamily:"Nunito,sans-serif", opacity: saving || !key.trim() ? 0.6 : 1 }}>
          {saving ? "…" : "Save"}
        </button>
      </div>
      {err && <div style={{ fontSize:"0.72rem", color:"#d93025", marginTop:6, fontWeight:600 }}>{err}</div>}
      <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginTop:8, lineHeight:1.6 }}>
        🔒 Key is stored in your browser only. Get yours at{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color:"#1a73e8" }}>console.anthropic.com</a>
      </div>
    </div>
  );
}

function SubtopicPanel({ roadmap, topic, child, onClose, isAdmin }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]       = useState(null);
  const [saved, setSaved]       = useState(false);
  const cacheKey = getSubtopicKey(roadmap.id, topic.label, child);

  // Load: check localStorage override first, then in-memory cache, then fetch AI
  useEffect(() => {
    const overrides = loadSubtopicOverrides();
    if (overrides[cacheKey]) {
      const d = overrides[cacheKey];
      SUBTOPIC_RESOURCES[cacheKey] = d;
      setData(d);
      setLoading(false);
      return;
    }
    if (SUBTOPIC_RESOURCES[cacheKey]) {
      setData(SUBTOPIC_RESOURCES[cacheKey]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const prompt = `You are a world-class educator building a roadmap.sh-style learning platform. For the subtopic "${child}" (inside "${topic.label}" of the "${roadmap.name}" roadmap), return ONLY a valid JSON object — no markdown, no code fences, no extra text.

JSON structure (follow exactly):
{
  "description": "Write 3-5 clear, engaging sentences. Explain: what this topic IS, WHY it matters for developers, and what the learner will be able to DO after mastering it.",
  "freeResources": [
    {"type": "Article", "title": "Exact article title", "url": "https://exact-real-url.com/path"},
    {"type": "Video",   "title": "Exact YouTube video title", "url": "https://www.youtube.com/watch?v=REAL_ID"},
    {"type": "Video",   "title": "Exact YouTube video title", "url": "https://www.youtube.com/watch?v=REAL_ID"},
    {"type": "Article", "title": "Exact article title", "url": "https://exact-real-url.com/path"}
  ],
  "paidResources": [
    {"type": "Course", "title": "Exact course name on platform", "url": "https://udemy.com/or/coursera.org/real-url"},
    {"type": "Book",   "title": "Book title by Author", "url": "https://amazon.com/or/oreilly.com/real-url"}
  ]
}

CRITICAL RULES — violating these makes the response useless:
1. freeResources: exactly 4 items — 2 YouTube videos (youtube.com/watch?v=) + 2 Articles from MDN/freeCodeCamp/GeeksforGeeks/official docs/W3Schools/dev.to
2. YouTube video IDs must be REAL 11-character IDs for actual existing videos about this topic
3. paidResources: exactly 2 items — 1 Udemy/Coursera course + 1 Book with real ISBN/Amazon link
4. ALL urls must be real, working https:// links — do NOT invent fake URLs
5. Return ONLY the JSON. No explanation, no markdown, no extra text.`;

    callAI(prompt)
    .then(parsed => {
      SUBTOPIC_RESOURCES[cacheKey] = parsed;
      setData(parsed);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message || "Could not load resources. Please try again.");
      setLoading(false);
    });
  }, [cacheKey]);

  // Enter edit mode — deep clone data into draft
  const enterEdit = () => {
    setDraft(JSON.parse(JSON.stringify(data)));
    setEditMode(true);
    setSaved(false);
  };

  // Save draft → persist to localStorage + cache
  const saveDraft = () => {
    const overrides = loadSubtopicOverrides();
    overrides[cacheKey] = draft;
    saveSubtopicOverrides(overrides);
    SUBTOPIC_RESOURCES[cacheKey] = draft;
    setData(draft);
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Reset to AI-generated (remove override)
  const resetToAI = () => {
    const overrides = loadSubtopicOverrides();
    delete overrides[cacheKey];
    saveSubtopicOverrides(overrides);
    delete SUBTOPIC_RESOURCES[cacheKey];
    setData(null);
    setEditMode(false);
    setLoading(true);
    setError("");
    // re-trigger fetch by toggling a key — easiest: just reload data
    const prompt = `You are a world-class educator building a roadmap.sh-style learning platform. For the subtopic "${child}" (inside "${topic.label}" of the "${roadmap.name}" roadmap), return ONLY a valid JSON object — no markdown, no code fences, no extra text.

JSON structure (follow exactly):
{
  "description": "Write 3-5 clear, engaging sentences. Explain: what this topic IS, WHY it matters for developers, and what the learner will be able to DO after mastering it.",
  "freeResources": [
    {"type": "Article", "title": "Exact article title", "url": "https://exact-real-url.com/path"},
    {"type": "Video",   "title": "Exact YouTube video title", "url": "https://www.youtube.com/watch?v=REAL_ID"},
    {"type": "Video",   "title": "Exact YouTube video title", "url": "https://www.youtube.com/watch?v=REAL_ID"},
    {"type": "Article", "title": "Exact article title", "url": "https://exact-real-url.com/path"}
  ],
  "paidResources": [
    {"type": "Course", "title": "Exact course name on platform", "url": "https://udemy.com/or/coursera.org/real-url"},
    {"type": "Book",   "title": "Book title by Author", "url": "https://amazon.com/or/oreilly.com/real-url"}
  ]
}

CRITICAL RULES — violating these makes the response useless:
1. freeResources: exactly 4 items — 2 YouTube videos (youtube.com/watch?v=) + 2 Articles from MDN/freeCodeCamp/GeeksforGeeks/official docs/W3Schools/dev.to
2. YouTube video IDs must be REAL 11-character IDs for actual existing videos about this topic
3. paidResources: exactly 2 items — 1 Udemy/Coursera course + 1 Book with real ISBN/Amazon link
4. ALL urls must be real, working https:// links — do NOT invent fake URLs
5. Return ONLY the JSON. No explanation, no markdown, no extra text.`;
    callAI(prompt)
    .then(parsed => {
      SUBTOPIC_RESOURCES[cacheKey] = parsed;
      setData(parsed);
      setLoading(false);
    })
    .catch(err => { setError(err.message || "Could not reload."); setLoading(false); });
  };

  // Draft helpers
  const setDesc = (v) => setDraft(d => ({ ...d, description: v }));
  const setResource = (section, idx, field, val) => setDraft(d => {
    const copy = JSON.parse(JSON.stringify(d));
    copy[section][idx][field] = val;
    return copy;
  });
  const addResource = (section) => setDraft(d => ({
    ...d,
    [section]: [...(d[section]||[]), { type: section==="freeResources"?"Article":"Course", title:"", url:"" }]
  }));
  const removeResource = (section, idx) => setDraft(d => {
    const copy = JSON.parse(JSON.stringify(d));
    copy[section].splice(idx, 1);
    return copy;
  });

  const typeBadge = (type) => {
    const colors = {
      Article:  { bg:"#fff8e1", color:"#f57f17" },
      Video:    { bg:"#fce8e6", color:"#d93025" },
      Course:   { bg:"#f3e8fd", color:"#7b1fa2" },
      Book:     { bg:"#e8f5e9", color:"#2e7d32" },
      Docs:     { bg:"#e8f0fe", color:"#1565c0" },
      Tutorial: { bg:"#e0f7fa", color:"#00838f" },
      Podcast:  { bg:"#fce4ec", color:"#c2185b" },
      Tool:     { bg:"#eceff1", color:"#455a64" },
    };
    const c = colors[type] || { bg:"#eceff1", color:"#546e7a" };
    return <span style={{ fontSize:"0.6rem", fontWeight:800, padding:"3px 8px", borderRadius:50, background:c.bg, color:c.color, flexShrink:0 }}>{type}</span>;
  };

  const inpStyle = { width:"100%", padding:"8px 12px", borderRadius:8, border:"1.5px solid var(--border)", background:"var(--main-bg)", color:"var(--text)", fontFamily:"Nunito,sans-serif", fontSize:"0.8rem", fontWeight:600, outline:"none", boxSizing:"border-box" };
  const sectionLabel = (icon, label, color, bg, border) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
      <div style={{ height:1, flex:1, background:"var(--border)" }} />
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 14px", borderRadius:50, border:`1.5px solid ${border}`, background:bg }}>
        <span style={{ fontSize:"0.75rem" }}>{icon}</span>
        <span style={{ fontSize:"0.72rem", fontWeight:800, color }}>{label}</span>
      </div>
      <div style={{ height:1, flex:1, background:"var(--border)" }} />
    </div>
  );

  // ── Edit mode resource row
  const EditResourceRow = ({ section, r, i }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"12px 14px", borderRadius:10, border:"1.5px solid var(--border)", background:"var(--main-bg)", position:"relative" }}>
      <div style={{ display:"flex", gap:8 }}>
        <select value={r.type} onChange={e => setResource(section, i, "type", e.target.value)}
          style={{ ...inpStyle, width:110, flexShrink:0, cursor:"pointer" }}>
          {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input value={r.title} onChange={e => setResource(section, i, "title", e.target.value)}
          placeholder="Resource title…" style={{ ...inpStyle, flex:1 }} />
        <button onClick={() => removeResource(section, i)}
          style={{ padding:"6px 10px", background:"#fce8e6", border:"none", borderRadius:8, cursor:"pointer", color:"#d93025", fontWeight:800, fontSize:"0.75rem", flexShrink:0 }}>✕</button>
      </div>
      <input value={r.url} onChange={e => setResource(section, i, "url", e.target.value)}
        placeholder="https://…" style={{ ...inpStyle, fontSize:"0.72rem", color:"#1a73e8" }} />
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && !editMode && onClose()}>
      <div className="fadeUp" style={{ background:"var(--card-bg)", borderRadius:20, width:"100%", maxWidth:640, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.3)", border:`2px solid ${editMode ? "#ea8600" : "var(--border)"}`, display:"flex", flexDirection:"column", transition:"border-color 0.2s" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", gap:14, position:"sticky", top:0, background:"var(--card-bg)", zIndex:10, borderRadius:"20px 20px 0 0" }}>
          <div style={{ width:42, height:42, borderRadius:12, background:roadmap.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>
            {roadmap.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"0.62rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:3 }}>{roadmap.name} › {topic.label}</div>
            <div style={{ fontSize:"1.18rem", fontWeight:900, color:"var(--text)", lineHeight:1.2 }}>{child}</div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
            {/* Admin edit controls */}
            {isAdmin && data && !loading && !editMode && (
              <>
                {saved && <span style={{ fontSize:"0.7rem", color:"#34a853", fontWeight:800 }}>✓ Saved!</span>}
                <button onClick={enterEdit}
                  style={{ padding:"6px 14px", background:"#fff8e1", border:"1.5px solid #ea8600", borderRadius:8, cursor:"pointer", fontSize:"0.75rem", fontWeight:800, color:"#ea8600", fontFamily:"Nunito,sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                  ✏️ Edit
                </button>
              </>
            )}
            {isAdmin && editMode && (
              <>
                <button onClick={resetToAI}
                  style={{ padding:"6px 12px", background:"#fce8e6", border:"1.5px solid #d93025", borderRadius:8, cursor:"pointer", fontSize:"0.72rem", fontWeight:800, color:"#d93025", fontFamily:"Nunito,sans-serif" }}>
                  🔄 Reset AI
                </button>
                <button onClick={() => setEditMode(false)}
                  style={{ padding:"6px 12px", background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer", fontSize:"0.72rem", fontWeight:700, color:"var(--muted)", fontFamily:"Nunito,sans-serif" }}>
                  Cancel
                </button>
                <button onClick={saveDraft}
                  style={{ padding:"6px 16px", background:"#ea8600", border:"none", borderRadius:8, cursor:"pointer", fontSize:"0.75rem", fontWeight:800, color:"white", fontFamily:"Nunito,sans-serif" }}>
                  💾 Save
                </button>
              </>
            )}
            <button onClick={onClose}
              style={{ background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, color:"var(--muted)", fontFamily:"Nunito,sans-serif" }}>✕</button>
          </div>
        </div>

        {/* Admin edit banner */}
        {editMode && (
          <div style={{ padding:"10px 24px", background:"#fff8e1", borderBottom:"1px solid #ea860030", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:"0.85rem" }}>✏️</span>
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#ea8600" }}>Admin Edit Mode — changes are saved to localStorage and persist for all users on this device.</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding:"22px 24px", flex:1 }}>
          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:14 }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
              <div style={{ fontSize:"0.82rem", color:"var(--muted)", fontWeight:600 }}>Loading description & resources…</div>
            </div>
          )}
          {error && error === "NO_API_KEY" && (
            <div style={{ textAlign:"center", padding:"30px 20px" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:12 }}>🔑</div>
              <div style={{ fontSize:"1rem", fontWeight:900, color:"var(--text)", marginBottom:8 }}>API Key Required</div>
              <div style={{ fontSize:"0.8rem", color:"var(--muted)", lineHeight:1.7, marginBottom:20, maxWidth:340, margin:"0 auto 20px" }}>
                To load AI-generated descriptions and resources, an Anthropic API key is required.
                {isAdmin
                  ? " Go to Settings → API Key to add yours."
                  : " Please ask your admin to configure the API key in Settings."}
              </div>
              {isAdmin && (
                <ApiKeyInlineSetup onSaved={() => { setError(""); setLoading(true); }} accent={roadmap.accent} />
              )}
            </div>
          )}
          {error && error !== "NO_API_KEY" && (
            <div style={{ textAlign:"center", padding:"30px 0", color:"var(--muted)" }}>
              <div style={{ fontSize:"1.8rem", marginBottom:8 }}>⚠️</div>
              <div style={{ fontSize:"0.82rem", fontWeight:600, marginBottom:14 }}>{error}</div>
              <button onClick={() => { setError(""); setLoading(true); callAI(
                `You are a world-class educator. For "${child}" in "${topic.label}" (${roadmap.name} roadmap), return ONLY valid JSON: {"description":"3-5 sentence explanation","freeResources":[{"type":"Video","title":"Real YouTube title","url":"https://www.youtube.com/watch?v=REAL_ID"},{"type":"Video","title":"Real YouTube title","url":"https://www.youtube.com/watch?v=REAL_ID"},{"type":"Article","title":"Real article title","url":"https://real-url.com"},{"type":"Article","title":"Real article title","url":"https://real-url.com"}],"paidResources":[{"type":"Course","title":"Course name","url":"https://udemy.com/real"},{"type":"Book","title":"Book by Author","url":"https://amazon.com/real"}]}. Use REAL YouTube video IDs and real URLs only.`
              ).then(parsed => { SUBTOPIC_RESOURCES[cacheKey]=parsed; setData(parsed); setLoading(false); }).catch(e => { setError(e.message||"Failed"); setLoading(false); }); }}
                style={{ padding:"8px 20px", background:roadmap.accent, color:"white", border:"none", borderRadius:8, cursor:"pointer", fontSize:"0.78rem", fontWeight:800, fontFamily:"Nunito,sans-serif" }}>
                🔄 Try Again
              </button>
            </div>
          )}

          {/* ── VIEW MODE — roadmap.sh style ── */}
          {data && !loading && !editMode && (
            <>
              {/* Big topic title */}
              <h2 style={{ fontSize:"1.6rem", fontWeight:900, color:"var(--text)", marginBottom:16, lineHeight:1.2 }}>{child}</h2>

              {/* Description paragraph */}
              <p style={{ fontSize:"0.88rem", lineHeight:1.85, color:"var(--text)", marginBottom:32, borderBottom:"1px solid var(--border)", paddingBottom:24 }}>
                {data.description}
              </p>

              {/* Free Resources */}
              <div style={{ marginBottom:28 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 16px 5px 10px", borderRadius:50,
                    border:"1.5px solid #34a853", background:"#e6f4ea", width:"fit-content" }}>
                    <span style={{ fontSize:"0.85rem" }}>💚</span>
                    <span style={{ fontSize:"0.75rem", fontWeight:800, color:"#34a853", letterSpacing:"0.3px" }}>Free Resources</span>
                  </div>
                  <div style={{ flex:1, height:1, background:"var(--border)" }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {(data.freeResources||[]).map((r,i) => {
                    const isYT = r.url && (r.url.includes("youtube.com") || r.url.includes("youtu.be"));
                    const isDocs = r.type === "Docs" || (!isYT && r.type === "Article");
                    const typeColors = {
                      Video:    { bg:"#fef2f2", border:"#fecaca", badge:"#dc2626", icon:"▶" },
                      Article:  { bg:"#fffbeb", border:"#fde68a", badge:"#d97706", icon:"📄" },
                      Docs:     { bg:"#eff6ff", border:"#bfdbfe", badge:"#2563eb", icon:"📖" },
                      Tutorial: { bg:"#f0fdf4", border:"#bbf7d0", badge:"#16a34a", icon:"🎓" },
                    };
                    const tc = isYT ? typeColors.Video : (typeColors[r.type] || typeColors.Article);
                    return (
                      <a key={i} href={r.url} target="_blank" rel="noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                          borderRadius:10, border:`1px solid ${tc.border}`, background:tc.bg,
                          textDecoration:"none", transition:"all 0.15s", color:"inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.transform="translateX(3px)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
                        {/* Icon */}
                        <div style={{ width:36, height:36, borderRadius:8, background:"white", border:`1px solid ${tc.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:isYT?"1rem":"0.9rem" }}>
                          {isYT ? "▶️" : r.type==="Article" ? "📄" : r.type==="Docs" ? "📖" : "🎓"}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:"0.83rem", fontWeight:700, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title}</div>
                          <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginTop:2 }}>
                            {isYT ? "YouTube" : r.url ? new URL(r.url).hostname.replace("www.","") : ""}
                          </div>
                        </div>
                        <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"3px 9px", borderRadius:50,
                          background:"white", color:tc.badge, border:`1px solid ${tc.border}`, flexShrink:0 }}>
                          {isYT ? "Video" : r.type}
                        </span>
                        <span style={{ fontSize:"0.8rem", color:"var(--muted)", flexShrink:0 }}>↗</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Premium Resources */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 16px 5px 10px", borderRadius:50,
                    border:"1.5px solid #7b1fa2", background:"#f3e8fd", width:"fit-content" }}>
                    <span style={{ fontSize:"0.85rem" }}>⭐</span>
                    <span style={{ fontSize:"0.75rem", fontWeight:800, color:"#7b1fa2", letterSpacing:"0.3px" }}>Premium Resources</span>
                  </div>
                  <div style={{ flex:1, height:1, background:"var(--border)" }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {(data.paidResources||[]).map((r,i) => {
                    const isCourse = r.type==="Course";
                    return (
                      <a key={i} href={r.url} target="_blank" rel="noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                          borderRadius:10, border:`1px solid ${isCourse?"#e9d5ff":"#d1fae5"}`,
                          background: isCourse?"#faf5ff":"#f0fdf4",
                          textDecoration:"none", transition:"all 0.15s", color:"inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.transform="translateX(3px)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:"white",
                          border:`1px solid ${isCourse?"#e9d5ff":"#d1fae5"}`,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"1rem" }}>
                          {isCourse ? "🎓" : "📚"}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:"0.83rem", fontWeight:700, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title}</div>
                          <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginTop:2 }}>
                            {r.url ? (() => { try { return new URL(r.url).hostname.replace("www.",""); } catch { return ""; } })() : ""}
                          </div>
                        </div>
                        <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"3px 9px", borderRadius:50,
                          background:"white", color:isCourse?"#7b1fa2":"#16a34a",
                          border:`1px solid ${isCourse?"#e9d5ff":"#d1fae5"}`, flexShrink:0 }}>
                          {r.type}
                        </span>
                        <span style={{ fontSize:"0.8rem", color:"var(--muted)", flexShrink:0 }}>↗</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Note */}
              <div style={{ marginTop:8, padding:"10px 14px", background:"var(--main-bg)", borderRadius:10,
                fontSize:"0.7rem", color:"var(--muted)", fontWeight:600, lineHeight:1.6,
                border:"1px solid var(--border)", display:"flex", alignItems:"flex-start", gap:8 }}>
                <span>📝</span>
                <span><strong>Note on Premium Resources:</strong> These are paid courses or books. EduPath is not affiliated with these platforms. Links are for reference only.</span>
              </div>
            </>
          )}

          {/* ── EDIT MODE ── */}
          {draft && editMode && (
            <>
              {/* Edit Description */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>DESCRIPTION</div>
                <textarea value={draft.description} onChange={e => setDesc(e.target.value)}
                  rows={5}
                  style={{ ...inpStyle, resize:"vertical", lineHeight:1.7, padding:"10px 12px" }} />
              </div>

              {/* Edit Free Resources */}
              <div style={{ marginBottom:22 }}>
                {sectionLabel("💚","Free Resources","#34a853","#e6f4ea","#34a853")}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {(draft.freeResources||[]).map((r,i) => (
                    <EditResourceRow key={i} section="freeResources" r={r} i={i} />
                  ))}
                  <button onClick={() => addResource("freeResources")}
                    style={{ padding:"9px", border:"2px dashed #34a85360", borderRadius:10, background:"transparent", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, color:"#34a853", fontFamily:"Nunito,sans-serif" }}>
                    + Add Free Resource
                  </button>
                </div>
              </div>

              {/* Edit Paid Resources */}
              <div>
                {sectionLabel("⭐","Premium Resources","#7b1fa2","#f3e8fd","#7b1fa2")}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {(draft.paidResources||[]).map((r,i) => (
                    <EditResourceRow key={i} section="paidResources" r={r} i={i} />
                  ))}
                  <button onClick={() => addResource("paidResources")}
                    style={{ padding:"9px", border:"2px dashed #7b1fa260", borderRadius:10, background:"transparent", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, color:"#7b1fa2", fontFamily:"Nunito,sans-serif" }}>
                    + Add Premium Resource
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RoadmapTreeView({ roadmap, onBack, openNodes, toggleNode, isAdmin, onDelete }) {
  const totalSteps = roadmap.tree.reduce((s,n) => s + 1 + n.children.length, 0);
  const [activeTopic, setActiveTopic]     = useState(null); // index of open topic
  const [activeSubtopic, setActiveSubtopic] = useState(null); // { topic, child }

  const toggleTopic = (idx) => setActiveTopic(prev => prev === idx ? null : idx);

  return (
    <div>
      {/* Subtopic panel modal */}
      {activeSubtopic && (
        <SubtopicPanel
          roadmap={roadmap}
          topic={activeSubtopic.topic}
          child={activeSubtopic.child}
          onClose={() => setActiveSubtopic(null)}
          isAdmin={isAdmin}
        />
      )}

      {/* Back + header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack}
          style={{ padding:"8px 16px", background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", cursor:"pointer", color:"var(--text)" }}>
          ← Back
        </button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:roadmap.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>{roadmap.icon}</div>
            <div>
              <div style={{ fontSize:"1.1rem", fontWeight:900 }}>{roadmap.name}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{roadmap.tree.length} topics · {totalSteps} total steps</div>
            </div>
          </div>
        </div>
        {onDelete && (
          <button onClick={onDelete}
            style={{ padding:"8px 14px", background:"#fce8e6", color:"#d93025", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.75rem", cursor:"pointer" }}>
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Description banner */}
      <div style={{ background:`linear-gradient(135deg,${roadmap.accent}15,${roadmap.accent}08)`, border:`1px solid ${roadmap.accent}30`, borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
        <span style={{ fontSize:"1.4rem" }}>{roadmap.icon}</span>
        <div style={{ fontSize:"0.82rem", color:"var(--text)", lineHeight:1.6 }}>{roadmap.desc}</div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
        <span>💡</span> Click a topic to expand, then click any subtopic for description & resources
      </div>

      {/* Tree — all collapsed by default, one open at a time */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {roadmap.tree.map((node, idx) => {
          const isOpen = activeTopic === idx;
          return (
            <div key={idx}>
              {/* Topic row */}
              <div onClick={() => toggleTopic(idx)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderRadius:12, background: isOpen ? roadmap.accent : roadmap.color, border:`1.5px solid ${isOpen ? roadmap.accent : roadmap.accent+"30"}`, cursor:"pointer", transition:"all 0.18s", userSelect:"none" }}
                onMouseEnter={e => { if(!isOpen){ e.currentTarget.style.borderColor=roadmap.accent; e.currentTarget.style.background=roadmap.color; } }}
                onMouseLeave={e => { if(!isOpen){ e.currentTarget.style.borderColor=roadmap.accent+"30"; } }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background: isOpen ? "rgba(255,255,255,0.25)" : roadmap.accent, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:800, flexShrink:0, border: isOpen ? "2px solid rgba(255,255,255,0.5)" : "none" }}>
                  {idx+1}
                </div>
                <div style={{ flex:1, fontSize:"0.9rem", fontWeight:800, color: isOpen ? "white" : "var(--text)" }}>{node.label}</div>
                <div style={{ fontSize:"0.65rem", fontWeight:700, color: isOpen ? "rgba(255,255,255,0.8)" : "var(--muted)", marginRight:8 }}>{node.children.length} subtopics</div>
                <span style={{ fontSize:"0.7rem", color: isOpen ? "white" : roadmap.accent, transition:"transform 0.2s", display:"inline-block", transform:isOpen?"rotate(90deg)":"rotate(0deg)" }}>▶</span>
              </div>

              {/* Subtopics */}
              {isOpen && (
                <div style={{ marginLeft:20, marginTop:6, marginBottom:6, display:"flex", flexDirection:"column", gap:5, position:"relative" }}>
                  <div style={{ position:"absolute", left:14, top:0, bottom:0, width:2, background:`${roadmap.accent}25`, borderRadius:2 }} />
                  {node.children.map((child, ci) => (
                    <div key={ci}
                      onClick={() => setActiveSubtopic({ topic: node, child })}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", borderRadius:10, background:"var(--card-bg)", border:"1px solid var(--border)", marginLeft:14, transition:"all 0.15s", position:"relative", cursor:"pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=roadmap.accent; e.currentTarget.style.background=roadmap.color; e.currentTarget.style.transform="translateX(3px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--card-bg)"; e.currentTarget.style.transform=""; }}>
                      <div style={{ position:"absolute", left:-14, top:"50%", width:14, height:2, background:`${roadmap.accent}25` }} />
                      <div style={{ width:7, height:7, borderRadius:"50%", background:roadmap.accent, flexShrink:0 }} />
                      <div style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--text)", flex:1 }}>{child}</div>
                      <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:16, height:16, borderRadius:"50%", background:`${roadmap.accent}15`, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.55rem" }}>📖</span>
                        Learn
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoadmapDomainTabs({ roadmaps, active, setActive, onAdd }) {
  const [showInput, setShowInput] = useState(false);
  const [input, setInput]         = useState("");
  const [search, setSearch]       = useState("");

  const handleAdd = () => {
    const v = input.trim();
    if (!v) return;
    onAdd(v);
    setInput(""); setShowInput(false);
  };

  const filtered = search
    ? roadmaps.filter(r => r.domain.toLowerCase().includes(search.toLowerCase()))
    : roadmaps;

  return (
    <div style={{ marginBottom:20 }}>
      {/* Search */}
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search roadmaps…"
          style={{ flex:1, padding:"7px 14px", border:"1.5px solid var(--border)", borderRadius:50, fontFamily:"Nunito,sans-serif", fontSize:"0.78rem", background:"var(--main-bg)", color:"var(--text)", outline:"none" }} />
        {search && <button onClick={() => setSearch("")} style={{ padding:"6px 12px", borderRadius:50, border:"1px solid var(--border)", background:"white", color:"var(--muted)", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.72rem", cursor:"pointer" }}>✕ Clear</button>}
      </div>
      {/* Pills */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, alignItems:"center" }}>
        {filtered.map((r) => {
          const i = roadmaps.indexOf(r);
          return (
            <button key={r.id} onClick={() => setActive(i)}
              style={{ padding:"6px 14px", borderRadius:50, border:"none", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.75rem", cursor:"pointer", background:active===i?"var(--blue)":"var(--blue-light)", color:active===i?"white":"var(--blue)", transition:"all 0.15s", whiteSpace:"nowrap" }}>
              {r.domain}
            </button>
          );
        })}
        {!search && (showInput ? (
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <input autoFocus value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter") handleAdd(); if (e.key==="Escape") { setShowInput(false); setInput(""); }}}
              placeholder="New domain…"
              style={{ padding:"6px 12px", border:"1.5px solid var(--blue)", borderRadius:50, fontFamily:"Nunito,sans-serif", fontSize:"0.75rem", width:140, outline:"none", color:"var(--text)", background:"white" }} />
            <button onClick={handleAdd} style={{ padding:"6px 12px", borderRadius:50, border:"none", background:"var(--blue)", color:"white", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.72rem", cursor:"pointer" }}>✓ Add</button>
            <button onClick={() => { setShowInput(false); setInput(""); }} style={{ padding:"6px 10px", borderRadius:50, border:"1px solid var(--border)", background:"white", color:"var(--muted)", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.72rem", cursor:"pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowInput(true)}
            style={{ padding:"6px 14px", borderRadius:50, border:"1.5px dashed var(--blue)", background:"white", color:"var(--blue)", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.75rem", cursor:"pointer" }}>
            + Add Domain
          </button>
        ))}
      </div>
      {search && filtered.length === 0 && (
        <div style={{ fontSize:"0.78rem", color:"var(--muted)", marginTop:10 }}>No roadmaps match "{search}"</div>
      )}
    </div>
  );
}

function RoadmapPage({ user, isAdmin }) {
  return <ExploreRoadmapsPage isAdmin={isAdmin} />;
}


// ── Empty roadmap state — shown for new auto-created domains
function EmptyRoadmap({ domain, roadmaps, setRoadmaps }) {
  const [stepInput, setStepInput] = useState("");
  const [steps, setSteps]         = useState([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSavedState]    = useState(false);

  const addStep = () => {
    const v = stepInput.trim();
    if (!v) return;
    setSteps(prev => [...prev, v]);
    setStepInput("");
  };

  const removeStep = (i) => setSteps(prev => prev.filter((_,idx) => idx !== i));

  const saveSteps = () => {
    if (steps.length === 0) return;
    setSaving(true);
    const updated = roadmaps.map(r =>
      r.domain === domain ? { ...r, steps } : r
    );
    saveRoadmaps(updated);
    setRoadmaps(updated);
    setSaving(false);
    setSavedState(true);
    window.dispatchEvent(new CustomEvent("roadmap-updated"));
  };

  return (
    <div style={{ textAlign:"center", padding:"20px 0 10px" }}>
      <div style={{ fontSize:"2.5rem", marginBottom:10 }}>🗺️</div>
      <div style={{ fontSize:"0.95rem", fontWeight:800, marginBottom:6 }}>
        No steps yet for <span style={{ color:"var(--blue)" }}>{domain}</span>
      </div>
      <div style={{ fontSize:"0.78rem", color:"var(--muted)", marginBottom:20 }}>
        This domain was auto-created. Add your learning steps below to build your roadmap.
      </div>

      {/* Added steps preview */}
      {steps.length > 0 && (
        <div style={{ textAlign:"left", marginBottom:16 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:"1px solid var(--blue)", background:"var(--blue-light)", marginBottom:8 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--blue)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:800, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, fontSize:"0.82rem", fontWeight:700, textAlign:"left" }}>{s}</div>
              <button onClick={() => removeStep(i)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:"0.9rem", padding:0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Step input */}
      {!saved && (
        <>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input
              value={stepInput}
              onChange={e => setStepInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addStep()}
              placeholder={`e.g. ${domain} Basics, Projects, Advanced Topics…`}
              style={{ flex:1, padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"white", color:"var(--text)" }}
            />
            <button onClick={addStep}
              style={{ padding:"10px 16px", background:"var(--blue-light)", color:"var(--blue)", border:"1.5px solid var(--blue)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.78rem", cursor:"pointer" }}>
              + Add Step
            </button>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={saveSteps} disabled={steps.length === 0 || saving}
              style={{ padding:"11px 28px", background:steps.length===0?"var(--border)":"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:steps.length===0?"not-allowed":"pointer", boxShadow:steps.length>0?"0 4px 12px rgba(26,115,232,0.3)":"none" }}>
              {saving ? "⏳ Saving…" : `✓ Save ${steps.length} Step${steps.length!==1?"s":""}`}
            </button>
          </div>
          <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginTop:10 }}>
            💡 Press Enter or click + Add Step after each one. You can also edit anytime via 🛠️ Manage Roadmaps.
          </div>
        </>
      )}

      {saved && (
        <div style={{ padding:"12px 20px", background:"#e6f4ea", borderRadius:10, display:"inline-block", color:"#34a853", fontWeight:700, fontSize:"0.82rem" }}>
          ✅ Roadmap saved! Refresh to see your steps.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// RESOURCES PAGE
// ══════════════════════════════════════════
function ResourcesPage() {
  // Main pill: 0=All 1=Videos 2=Articles 3=Books 4=Courses 5=Practice 6=Documents
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved]         = useState(new Set());

  // Documents state
  const [docs, setDocs]             = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docTopic, setDocTopic]     = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showForm, setShowForm]     = useState(false);
  const [addMode, setAddMode]       = useState("upload");
  const [form, setForm]             = useState({ title:"", topic:"Web Dev", url:"", description:"" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [formErr, setFormErr]       = useState("");
  const [viewDoc, setViewDoc]       = useState(null);
  const [blobUrl, setBlobUrl]       = useState(null);
  const [docViewLoading, setDocViewLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);

  const TABS = ["All","Videos","📄 Documents","Articles","Books","Courses","Practice"];
  // Dynamic topics — pulled from roadmaps + always include General/Other
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [showCustomInput, setShowCustomInput]   = useState(false);
  const DOC_TOPICS = ["All", ...getAllDomains().filter(d => d !== "General / Other"), "General / Other"];
  const FILE_TYPES = ["All","PDF","DOCX","TXT","PPT","Image","Other"];

  const TOPIC_COLORS = {
    "Web Dev":         { bg:"#e8f0fe", color:"#1a73e8" },
    "DSA":             { bg:"#e6f4ea", color:"#34a853" },
    "AI / ML":         { bg:"#fff3e0", color:"#ea8600" },
    "Data Science":    { bg:"#fce8e6", color:"#d93025" },
    "DevOps":          { bg:"#f3e8fd", color:"#8430ce" },
    "Android":         { bg:"#e0f7fa", color:"#00897b" },
    "General / Other": { bg:"var(--main-bg)", color:"var(--muted)" },
  };

  const FILE_ICONS = {
    "application/pdf": "📄",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
    "application/msword": "📝",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "📊",
    "application/vnd.ms-powerpoint": "📊",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
    "text/plain": "📃",
    "image/jpeg": "🖼️", "image/png": "🖼️", "image/gif": "🖼️", "image/webp": "🖼️",
  };

  const getIcon  = (mime) => FILE_ICONS[mime] || "📁";
  const getLabel = (mime) => {
    if (!mime) return "Link";
    if (mime.includes("pdf"))          return "PDF";
    if (mime.includes("word"))         return "DOCX";
    if (mime.includes("presentation")) return "PPT";
    if (mime.includes("sheet"))        return "XLSX";
    if (mime.includes("text"))         return "TXT";
    if (mime.includes("image"))        return "Image";
    return "File";
  };
  const canPreview = (mime) => mime && (mime.includes("pdf") || mime.includes("image") || mime.includes("text"));
  const formatSize = (b) => !b ? "" : b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;

  const RESOURCES = [
    { icon:"▶️", name:"React Complete Guide",  sub:"Udemy • 40hrs • ⭐4.8",        badge:"Free", badgeType:"free", tags:["Videos","Courses"] },
    { icon:"📝", name:"MDN Web Docs",           sub:"Documentation • Always updated", badge:"Free", badgeType:"free", tags:["Articles"] },
    { icon:"🎥", name:"Traversy Media",         sub:"YouTube • 200+ videos",         badge:"Free", badgeType:"free", tags:["Videos"] },
    { icon:"📗", name:"You Don\'t Know JS",    sub:"Advanced JavaScript Book",       badge:"Pro",  badgeType:"pro",  tags:["Books"] },
    { icon:"💻", name:"Frontend Mentor",        sub:"Project Practice",               badge:"Free", badgeType:"free", tags:["Practice"] },
    { icon:"🎓", name:"CS50 Harvard",           sub:"Full CS Course",                 badge:"Free", badgeType:"free", tags:["Courses"] },
    { icon:"🐍", name:"Python.org Docs",        sub:"Official Python docs",           badge:"Free", badgeType:"free", tags:["Articles"] },
    { icon:"📊", name:"Kaggle Learn",           sub:"Data Science courses",           badge:"Free", badgeType:"free", tags:["Courses","Practice"] },
  ];

  const isDocTab  = activeTab === 2;
  const resTagMap = ["All","Videos",null,"Articles","Books","Courses","Practice"];
  const filteredRes = activeTab === 0
    ? RESOURCES
    : RESOURCES.filter(r => resTagMap[activeTab] && r.tags.includes(resTagMap[activeTab]));

  // Load docs when switching to Documents tab or changing topic
  useEffect(() => {
    if (!isDocTab) return;
    setDocsLoading(true);
    const q = docTopic !== "All" ? `?topic=${encodeURIComponent(docTopic)}` : "";
    authFetch(`/pdfs${q}`).catch(() => ({})).then(data => {
      if (data.success) setDocs(data.pdfs || []);
      setDocsLoading(false);
    });
  }, [activeTab, docTopic]);

  const filteredDocs = typeFilter === "All"
    ? docs
    : docs.filter(d => getLabel(d.mimeType) === typeFilter || (typeFilter === "Other" && !["PDF","DOCX","PPT","XLSX","TXT","Image"].includes(getLabel(d.mimeType))));

  const saveProgress = async (name) => {
    const ns = new Set(saved);
    if (ns.has(name)) { ns.delete(name); }
    else {
      ns.add(name);
      await authFetch("/progress", { method:"POST", body: JSON.stringify({ course:name, domain:"Web Dev", percent:50 }) }).catch(() => {});
    }
    setSaved(ns);
  };

  const submitDoc = async () => {
    setFormErr("");
    if (!form.title.trim()) { setFormErr("Title is required."); return; }
    if (addMode === "upload" && !selectedFile) { setFormErr("Please select a file."); return; }
    if (addMode === "link" && !form.url.trim()) { setFormErr("URL is required."); return; }
    setUploading(true);
    try {
      // Auto-add domain to roadmap if it's new
      ensureDomainExists(form.topic);

      let data;
      if (addMode === "upload") {
        const fd = new FormData();
        fd.append("pdf", selectedFile);
        fd.append("title", form.title.trim());
        fd.append("topic", form.topic);
        fd.append("description", form.description.trim());
        const res = await fetch(`${API}/pdfs/upload`, { method:"POST", headers:{ Authorization:`Bearer ${getToken()}` }, body:fd });
        data = await res.json();
      } else {
        data = await authFetch("/pdfs/link", { method:"POST", body: JSON.stringify({ title:form.title.trim(), topic:form.topic, url:form.url.trim(), description:form.description.trim() }) });
      }
      if (data.success) {
        setForm({ title:"", topic:"Web Dev", url:"", description:"" });
        setSelectedFile(null); setShowForm(false);
        setShowCustomInput(false); setCustomTopicInput("");
        // reload
        const q = docTopic !== "All" ? `?topic=${encodeURIComponent(docTopic)}` : "";
        authFetch(`/pdfs${q}`).catch(() => ({})).then(d => { if (d.success) setDocs(d.pdfs||[]); });
      } else { setFormErr(data.error || "Failed to save."); }
    } catch { setFormErr("Network error — is the backend running?"); }
    setUploading(false);
  };

  const deleteDoc = async (id) => {
    const data = await authFetch(`/pdfs/${id}`, { method:"DELETE" }).catch(() => ({}));
    if (data.success) {
      setDeleteConfirm(null);
      setDocs(prev => prev.filter(d => d._id !== id));
    }
  };

  const openDoc = async (doc) => {
    if (doc.type === "link") { window.open(doc.url, "_blank"); return; }
    if (!canPreview(doc.mimeType)) { downloadDoc(doc); return; }
    setViewDoc(doc); setDocViewLoading(true); setBlobUrl(null);
    try {
      const res  = await fetch(`${API}/pdfs/${doc._id}/download`, { headers:{ Authorization:`Bearer ${getToken()}` }});
      const blob = await res.blob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch { setBlobUrl(null); }
    setDocViewLoading(false);
  };

  const closeDoc = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); setBlobUrl(null); setViewDoc(null); };

  const downloadDoc = async (doc) => {
    const res  = await fetch(`${API}/pdfs/${doc._id}/download`, { headers:{ Authorization:`Bearer ${getToken()}` }});
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = doc.title; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageCard title="📚 Resource Library" sub="Curated resources, documents & files — all in one place">

      {/* Viewer Modal */}
      {viewDoc && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", flexDirection:"column" }}>
          <div style={{ background:"white", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <div>
              <div style={{ fontSize:"0.9rem", fontWeight:800 }}>{getIcon(viewDoc.mimeType)} {viewDoc.title}</div>
              <div style={{ fontSize:"0.7rem", color:"var(--muted)" }}>{viewDoc.topic} · {getLabel(viewDoc.mimeType)} · {formatSize(viewDoc.fileSize)}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => downloadDoc(viewDoc)} style={{ padding:"7px 14px", background:"var(--blue)", color:"white", border:"none", borderRadius:8, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif" }}>⬇️ Download</button>
              <button onClick={closeDoc} style={{ padding:"7px 14px", background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:8, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif" }}>✕ Close</button>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#2a2a2a" }}>
            {docViewLoading ? (
              <div style={{ color:"white", fontWeight:600 }}>⏳ Loading…</div>
            ) : blobUrl && viewDoc.mimeType?.includes("image") ? (
              <img src={blobUrl} alt={viewDoc.title} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
            ) : blobUrl ? (
              <iframe src={blobUrl} style={{ width:"100%", height:"100%", border:"none" }} title={viewDoc.title} />
            ) : (
              <div style={{ color:"white", textAlign:"center" }}>
                <div style={{ fontSize:"2rem", marginBottom:12 }}>⚠️</div>
                <div style={{ marginBottom:16, fontSize:"0.9rem" }}>Preview not available</div>
                <button onClick={() => downloadDoc(viewDoc)} style={{ padding:"10px 20px", background:"var(--blue)", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, cursor:"pointer" }}>⬇️ Download instead</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"white", borderRadius:16, padding:28, maxWidth:360, width:"90%", boxShadow:"0 16px 48px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize:"1.5rem", marginBottom:8 }}>🗑️</div>
            <div style={{ fontSize:"0.95rem", fontWeight:800, marginBottom:8 }}>Delete this document?</div>
            <div style={{ fontSize:"0.8rem", color:"var(--muted)", marginBottom:20 }}>"{deleteConfirm.title}" will be permanently deleted.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => deleteDoc(deleteConfirm._id)} style={{ flex:1, padding:"11px", background:"var(--red)", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, cursor:"pointer" }}>Delete</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, padding:"11px", background:"var(--main-bg)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Single pill tab row */}
      <PillTabs pills={TABS} active={activeTab} setActive={setActiveTab} />

      {/* ── Resources tabs (0-5) */}
      {!isDocTab && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {filteredRes.map(r => (
              <div key={r.name} onClick={() => saveProgress(r.name)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:14, borderRadius:12, border:`1px solid ${saved.has(r.name)?"var(--blue)":"var(--border)"}`, background:saved.has(r.name)?"var(--blue-light)":"var(--main-bg)", transition:"all 0.2s", cursor:"pointer" }}
                onMouseEnter={e => !saved.has(r.name) && (e.currentTarget.style.borderColor="var(--blue)")}
                onMouseLeave={e => !saved.has(r.name) && (e.currentTarget.style.borderColor="var(--border)")}>
                <div style={{ fontSize:"1.8rem" }}>{r.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.82rem", fontWeight:700 }}>{r.name}</div>
                  <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginTop:2 }}>{r.sub}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <span style={{ fontSize:"0.6rem", fontWeight:800, padding:"4px 10px", borderRadius:50, background:r.badgeType==="free"?"#e6f4ea":"#fff3e0", color:r.badgeType==="free"?"#34a853":"#ea8600" }}>{r.badge}</span>
                  {saved.has(r.name) && <span style={{ fontSize:"0.58rem", color:"var(--blue)", fontWeight:700 }}>✓ Saved</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, fontSize:"0.72rem", color:"var(--muted)", textAlign:"center" }}>💡 Click any resource to save it to your progress tracker</div>
        </>
      )}

      {/* ── Documents tab (6) */}
      {isDocTab && (
        <div>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontSize:"0.8rem", color:"var(--muted)" }}>{docs.length} document{docs.length!==1?"s":""} saved</div>
            <button onClick={() => { setShowForm(!showForm); setFormErr(""); }}
              style={{ padding:"8px 16px", background:showForm?"var(--main-bg)":"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:showForm?"var(--muted)":"white", border:showForm?"1px solid var(--border)":"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.78rem", cursor:"pointer" }}>
              {showForm ? "✕ Cancel" : "+ Upload"}
            </button>
          </div>

          {/* Upload form */}
          {showForm && (
            <div style={{ background:"var(--blue-light)", borderRadius:14, padding:20, marginBottom:20, border:"1.5px solid var(--blue)" }}>
              <div style={{ fontSize:"0.78rem", fontWeight:800, color:"var(--blue)", marginBottom:12 }}>ADD DOCUMENT</div>
              <div style={{ display:"flex", gap:0, marginBottom:14, background:"white", borderRadius:10, padding:3, border:"1px solid var(--border)", width:"fit-content" }}>
                {[["upload","⬆️ Upload"],["link","🔗 Link"]].map(([m,l]) => (
                  <button key={m} onClick={() => setAddMode(m)}
                    style={{ padding:"7px 16px", borderRadius:8, border:"none", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.75rem", cursor:"pointer", background:addMode===m?"var(--blue)":"transparent", color:addMode===m?"white":"var(--muted)" }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title *"
                  style={{ padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"white", color:"var(--text)" }} />
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                  {DOC_TOPICS.filter(t=>t!=="All").map(t => {
                    const tc = TOPIC_COLORS[t]||{bg:"#f0f0f0",color:"#666"};
                    return (
                      <button key={t} onClick={() => { setForm(f=>({...f,topic:t})); setShowCustomInput(false); }}
                        style={{ padding:"5px 11px", borderRadius:50, border:`1.5px solid ${form.topic===t?tc.color:"var(--border)"}`, background:form.topic===t?tc.bg:"white", color:form.topic===t?tc.color:"var(--muted)", fontSize:"0.7rem", fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif" }}>
                        {t}
                      </button>
                    );
                  })}
                  {/* Add new domain button */}
                  <button onClick={() => setShowCustomInput(!showCustomInput)}
                    style={{ padding:"5px 11px", borderRadius:50, border:"1.5px dashed var(--blue)", background:"white", color:"var(--blue)", fontSize:"0.7rem", fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif" }}>
                    + New Domain
                  </button>
                </div>
                {/* Custom domain input */}
                {showCustomInput && (
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input value={customTopicInput} onChange={e=>setCustomTopicInput(e.target.value)}
                      placeholder="e.g. Cybersecurity, Flutter, Blockchain…"
                      style={{ flex:1, padding:"8px 12px", border:"1.5px solid var(--blue)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.8rem", background:"white", color:"var(--text)" }}
                      onKeyDown={e => {
                        if (e.key === "Enter" && customTopicInput.trim()) {
                          const t = customTopicInput.trim();
                          ensureDomainExists(t);
                          setForm(f=>({...f,topic:t}));
                          setShowCustomInput(false); setCustomTopicInput("");
                        }
                      }}
                    />
                    <button onClick={() => {
                        if (!customTopicInput.trim()) return;
                        const t = customTopicInput.trim();
                        ensureDomainExists(t);
                        setForm(f=>({...f,topic:t}));
                        setShowCustomInput(false); setCustomTopicInput("");
                      }}
                      style={{ padding:"8px 14px", background:"var(--blue)", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.75rem", cursor:"pointer" }}>
                      ✓ Add
                    </button>
                  </div>
                )}
                {form.topic && !DOC_TOPICS.includes(form.topic) && (
                  <div style={{ fontSize:"0.68rem", color:"var(--blue)", fontWeight:700 }}>
                    ✨ New domain "<b>{form.topic}</b>" will be added to your Roadmap automatically
                  </div>
                )}
                {addMode === "upload" ? (
                  <label style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", border:`2px dashed ${selectedFile?"var(--blue)":"var(--border)"}`, borderRadius:12, cursor:"pointer", background:selectedFile?"var(--blue-light)":"white" }}>
                    <input type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,image/*"
                      onChange={e=>setSelectedFile(e.target.files[0]||null)} style={{ display:"none" }} />
                    <span style={{ fontSize:"1.4rem" }}>{selectedFile ? getIcon(selectedFile?.type) : "📂"}</span>
                    <div>
                      <div style={{ fontSize:"0.8rem", fontWeight:700, color:selectedFile?"var(--blue)":"var(--text)" }}>{selectedFile ? selectedFile.name : "Click to choose — PDF, DOCX, TXT, PPT, image…"}</div>
                      {selectedFile && <div style={{ fontSize:"0.65rem", color:"var(--muted)", marginTop:1 }}>{getLabel(selectedFile?.type)} · {formatSize(selectedFile?.size)}</div>}
                    </div>
                  </label>
                ) : (
                  <input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="URL * — Google Drive, Dropbox, any link…"
                    style={{ padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"white", color:"var(--text)" }} />
                )}
                <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description (optional)"
                  style={{ padding:"10px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"white", color:"var(--text)" }} />
                {formErr && <div style={{ padding:"8px 12px", background:"#fce8e6", borderRadius:8, fontSize:"0.75rem", color:"#d93025", fontWeight:700 }}>⚠️ {formErr}</div>}
                <button onClick={submitDoc} disabled={uploading}
                  style={{ padding:"12px", background:uploading?"var(--muted)":"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:uploading?"not-allowed":"pointer" }}>
                  {uploading ? "⏳ Uploading…" : addMode==="upload" ? "⬆️ Upload" : "🔗 Save Link"}
                </button>
              </div>
            </div>
          )}

          {/* Topic + type filters */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {DOC_TOPICS.map(t => (
              <button key={t} onClick={() => setDocTopic(t)}
                style={{ padding:"4px 11px", borderRadius:50, border:"none", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.68rem", cursor:"pointer", background:docTopic===t?"var(--blue)":"var(--blue-light)", color:docTopic===t?"white":"var(--blue)" }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {FILE_TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{ padding:"4px 11px", borderRadius:50, border:`1px solid ${typeFilter===t?"#333":"var(--border)"}`, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.68rem", cursor:"pointer", background:typeFilter===t?"#333":"white", color:typeFilter===t?"white":"var(--muted)" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Doc list */}
          {docsLoading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:68, marginBottom:10, borderRadius:12 }} />)
          ) : filteredDocs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:10 }}>📂</div>
              <div style={{ fontSize:"0.85rem", fontWeight:700, marginBottom:12 }}>No documents yet</div>
              <button onClick={() => setShowForm(true)} style={{ padding:"8px 18px", background:"var(--blue)", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, cursor:"pointer", fontSize:"0.78rem" }}>+ Upload first document</button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {filteredDocs.map(doc => {
                const tc = TOPIC_COLORS[doc.topic]||{bg:"var(--main-bg)",color:"var(--muted)"};
                return (
                  <div key={doc._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, border:"1px solid var(--border)", background:"var(--main-bg)", transition:"all 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--blue)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                    <div style={{ width:40, height:40, borderRadius:9, background:tc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>
                      {doc.type==="link"?"🔗":getIcon(doc.mimeType)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.82rem", fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.title}</div>
                      <div style={{ display:"flex", gap:7, marginTop:3, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:"0.6rem", fontWeight:700, padding:"2px 7px", borderRadius:50, background:tc.bg, color:tc.color }}>{doc.topic}</span>
                        <span style={{ fontSize:"0.6rem", fontWeight:700, padding:"2px 7px", borderRadius:50, background:"var(--main-bg)", border:"1px solid var(--border)", color:"var(--muted)" }}>{doc.type==="link"?"Link":getLabel(doc.mimeType)}</span>
                        {doc.fileSize && <span style={{ fontSize:"0.6rem", color:"var(--muted)" }}>{formatSize(doc.fileSize)}</span>}
                        {doc.description && <span style={{ fontSize:"0.6rem", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>{doc.description}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                      <button onClick={() => openDoc(doc)}
                        style={{ padding:"6px 12px", background:"var(--blue)", color:"white", border:"none", borderRadius:8, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.7rem", cursor:"pointer" }}>
                        {doc.type==="link"?"🔗 Open":canPreview(doc.mimeType)?"👁️ View":"⬇️ Download"}
                      </button>
                      {doc.type==="file" && (
                        <button onClick={() => downloadDoc(doc)}
                          style={{ padding:"6px 9px", background:"var(--blue-light)", color:"var(--blue)", border:"none", borderRadius:8, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.7rem", cursor:"pointer" }}>⬇️</button>
                      )}
                      <button onClick={() => setDeleteConfirm(doc)}
                        style={{ padding:"6px 9px", background:"#fce8e6", color:"var(--red)", border:"none", borderRadius:8, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.7rem", cursor:"pointer" }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageCard>
  );
}

// ══════════════════════════════════════════
// PLACEMENT PAGE — static questions
// ══════════════════════════════════════════
function PlacementPage() {
  const [active, setActive] = useState(0);
  const [solved, setSolved] = useState(new Set());

  const QUESTIONS = [
    { company:"🏢 Google",    text:"Two Sum — Find two indices that add up to target",   diff:"Easy",   diffTag:"easy",   tags:["Array","HashMap"] },
    { company:"🏢 Amazon",    text:"Validate Binary Search Tree structure",               diff:"Medium", diffTag:"medium", tags:["Tree","DFS"] },
    { company:"🏢 Microsoft", text:"Longest Common Subsequence",                          diff:"Hard",   diffTag:"hard",   tags:["DP","String"] },
    { company:"🏢 Flipkart",  text:"Merge K Sorted Linked Lists",                         diff:"Hard",   diffTag:"hard",   tags:["LinkedList","Heap"] },
    { company:"🏢 Infosys",   text:"Find duplicate in array of N+1 integers",            diff:"Easy",   diffTag:"easy",   tags:["Array","Math"] },
    { company:"🏢 Uber",      text:"LRU Cache Implementation",                            diff:"Medium", diffTag:"medium", tags:["Design","HashMap"] },
    { company:"🏢 Meta",      text:"Clone Graph with adjacency list",                     diff:"Medium", diffTag:"medium", tags:["Graph","BFS"] },
    { company:"🏢 Apple",     text:"Serialize and Deserialize Binary Tree",               diff:"Hard",   diffTag:"hard",   tags:["Tree","DFS"] },
  ];

  const diffColors = { Easy:{bg:"#e6f4ea",color:"#34a853"}, Medium:{bg:"#fff3e0",color:"#ea8600"}, Hard:{bg:"#fce8e6",color:"#d93025"} };

  const markSolved = async (text) => {
    const newSet = new Set(solved);
    if (newSet.has(text)) { newSet.delete(text); }
    else {
      newSet.add(text);
      // Save progress to backend as a "course"
      await authFetch("/progress", {
        method:"POST",
        body: JSON.stringify({ course:`DSA: ${text.slice(0,40)}`, domain:"DSA", percent:100 }),
      }).catch(() => {});
    }
    setSolved(newSet);
  };

  return (
    <PageCard title="💼 Placement Preparation"
      sub={`${solved.size} solved · ${QUESTIONS.length - solved.size} remaining`}>
      <PillTabs pills={["DSA","System Design","HR Interview","Aptitude","Mock Test","Resume"]} active={active} setActive={setActive} />
      {QUESTIONS.map(q => (
        <div key={q.text} style={{ padding:16, borderRadius:12, border:`1px solid ${solved.has(q.text)?"var(--green)":"var(--border)"}`, background:solved.has(q.text)?"#f6fef9":"var(--main-bg)", marginBottom:10, transition:"all 0.2s", cursor:"pointer" }}
          onClick={() => markSolved(q.text)}
          onMouseEnter={e => !solved.has(q.text) && (e.currentTarget.style.borderColor="var(--blue)")}
          onMouseLeave={e => !solved.has(q.text) && (e.currentTarget.style.borderColor="var(--border)")}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
            <div>
              <div style={{ fontSize:"0.72rem", color:"var(--blue)", fontWeight:700, marginBottom:4 }}>{q.company}</div>
              <div style={{ fontSize:"0.85rem", fontWeight:700, marginBottom:8, textDecoration:solved.has(q.text)?"line-through":"none", opacity:solved.has(q.text)?0.6:1 }}>{q.text}</div>
              <span style={{ display:"inline-block", fontSize:"0.62rem", fontWeight:700, padding:"3px 9px", borderRadius:50, marginRight:6, background:diffColors[q.diff].bg, color:diffColors[q.diff].color }}>{q.diff}</span>
              {q.tags.map(tag => (
                <span key={tag} style={{ display:"inline-block", fontSize:"0.62rem", fontWeight:700, padding:"3px 9px", borderRadius:50, marginRight:6, background:"var(--blue-light)", color:"var(--blue)" }}>{tag}</span>
              ))}
            </div>
            {solved.has(q.text) && <span style={{ fontSize:"1.2rem", flexShrink:0 }}>✅</span>}
          </div>
        </div>
      ))}
      <div style={{ marginTop:12, fontSize:"0.72rem", color:"var(--muted)", textAlign:"center" }}>
        💡 Click any question to mark as solved — progress is saved automatically
      </div>
    </PageCard>
  );
}

function ApproachPage() {
  return (
    <PageCard title="🤔 Approach-Based Questions" sub="Learn the thinking pattern behind every problem type">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {APPROACHES.map(a => (
          <div key={a.name} style={{ padding:16, borderRadius:12, border:"1px solid var(--border)", background:"var(--main-bg)", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--blue)"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}>
            <div style={{ fontSize:"1.5rem", marginBottom:6 }}>{a.icon}</div>
            <div style={{ fontSize:"0.82rem", fontWeight:800, marginBottom:4 }}>{a.name}</div>
            <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:8 }}>{a.desc}</div>
            <span style={{ display:"inline-block", fontSize:"0.62rem", fontWeight:700, padding:"3px 9px", borderRadius:50, background:"var(--blue-light)", color:"var(--blue)" }}>{a.count}</span>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

function ProjectsPage() {
  const [active, setActive] = useState(0);
  const diffColors = { Easy:{bg:"#e6f4ea",color:"#34a853"}, Medium:{bg:"#fff3e0",color:"#ea8600"}, Hard:{bg:"#fce8e6",color:"#d93025"} };
  return (
    <PageCard title="🛠️ Project Hub" sub="Build real projects to strengthen your skills">
      <PillTabs pills={["All","Beginner","Intermediate","Advanced"]} active={active} setActive={setActive} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {PROJECTS.map(p => (
          <div key={p.name} style={{ padding:18, borderRadius:12, border:"1px solid var(--border)", background:"var(--main-bg)", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--blue)"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}>
            <div style={{ fontSize:"1.8rem", marginBottom:8 }}>{p.icon}</div>
            <div style={{ fontSize:"0.88rem", fontWeight:800, marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginBottom:10 }}>{p.tech}</div>
            <span style={{ display:"inline-block", fontSize:"0.62rem", fontWeight:700, padding:"3px 9px", borderRadius:50, marginRight:6, background:"var(--blue-light)", color:"var(--blue)" }}>{p.level}</span>
            <span style={{ display:"inline-block", fontSize:"0.62rem", fontWeight:700, padding:"3px 9px", borderRadius:50, background:diffColors[p.diff].bg, color:diffColors[p.diff].color }}>{p.diff}</span>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

// ══════════════════════════════════════════
// MY PROGRESS PAGE — live from /api/progress
// ══════════════════════════════════════════
function MyProgressPage() {
  const [progress, setProgress] = useState([]);
  const [weekly, setWeekly]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [pData, wData] = await Promise.all([
        authFetch("/progress").catch(() => ({})),
        authFetch("/progress/summary/weekly").catch(() => ({})),
      ]);
      if (pData.success) setProgress(pData.progress || []);
      if (wData.success) setWeekly(wData.weekly || []);
      setLoading(false);
    };
    load();
  }, []);

  const deleteProgress = async (course) => {
    await authFetch(`/progress/${encodeURIComponent(course)}`, { method:"DELETE" }).catch(() => {});
    const data = await authFetch("/progress").catch(() => ({}));
    if (data.success) setProgress(data.progress || []);
  };

  const maxSessions = Math.max(...weekly.map(w => w.sessions), 1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Weekly activity chart */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize:"1rem", fontWeight:800, marginBottom:16 }}>📅 Weekly Activity</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80 }}>
          {weekly.map(w => (
            <div key={w.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:w.sessions>0?"var(--blue)":"var(--border)", height:`${Math.max(8,(w.sessions/maxSessions)*60)}px`, transition:"height 0.4s ease" }} />
              <div style={{ fontSize:"0.6rem", fontWeight:700, color:"var(--muted)" }}>{w.day}</div>
            </div>
          ))}
          {weekly.length === 0 && [1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div className="skeleton" style={{ width:"100%", height:32 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Course progress list */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize:"1rem", fontWeight:800, marginBottom:4 }}>📊 Course Progress</div>
        <div style={{ fontSize:"0.8rem", color:"var(--muted)", marginBottom:20 }}>{progress.length} course{progress.length!==1?"s":""} tracked</div>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:48, marginBottom:12 }} />)
        ) : progress.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:"var(--muted)", fontSize:"0.85rem" }}>
            No progress tracked yet. Start the Roadmap or save Resources! 🚀
          </div>
        ) : progress.map(item => (
          <div key={item._id} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:"0.8rem", fontWeight:700, marginBottom:6 }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"70%" }}>{item.course}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:"var(--blue)" }}>{item.percent}%</span>
                <button onClick={() => deleteProgress(item.course)} style={{ fontSize:"0.7rem", color:"var(--muted)", background:"none", border:"none", cursor:"pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ height:8, background:"var(--blue-light)", borderRadius:50, overflow:"hidden" }}>
              <div style={{ width:`${item.percent}%`, height:"100%", background:item.percent===100?"var(--green)":"linear-gradient(90deg,var(--blue),#4a90d9)", borderRadius:50, transition:"width 0.6s ease" }} />
            </div>
            <div style={{ fontSize:"0.62rem", color:"var(--muted)", marginTop:3 }}>{item.domain} · {item.status?.replace("_"," ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SETTINGS PAGE — wired to /api/users/profile,
//   /api/users/preferences, /api/auth/change-password
//   /api/users/account (delete)
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════
function ProfilePage({ user, setUser, setPage }) {
  const [stats, setStats]       = useState(null);
  const [progress, setProgress] = useState([]);
  const [timerStats, setTimerStats] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ name: user?.name || "", domain: user?.domain || "" });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const domains = ["Web Dev","AI / ML","DSA","Data Science","DevOps","Android"];

  const DOMAIN_ICONS = {
    "Web Dev":"🌐", "AI / ML":"🤖", "DSA":"🧮",
    "Data Science":"📊", "DevOps":"⚙️", "Android":"📱",
  };

  const BADGES = [
    { id:"first_login",  icon:"🎉", label:"Welcome!",       desc:"Joined EduPath",          earned: true },
    { id:"streak_3",     icon:"🔥", label:"On Fire",        desc:"3-day streak",             earned: (stats?.streak||0) >= 3 },
    { id:"streak_7",     icon:"⚡", label:"Week Warrior",   desc:"7-day streak",             earned: (stats?.streak||0) >= 7 },
    { id:"streak_30",    icon:"🏆", label:"Monthly Master", desc:"30-day streak",            earned: (stats?.longestStreak||0) >= 30 },
    { id:"tasks_10",     icon:"✅", label:"Task Crusher",   desc:"Completed 10 tasks",       earned: (stats?.completedTasks||0) >= 10 },
    { id:"tasks_50",     icon:"💪", label:"Powerhouse",     desc:"Completed 50 tasks",       earned: (stats?.completedTasks||0) >= 50 },
    { id:"hours_5",      icon:"📖", label:"Dedicated",      desc:"5 hours studied",          earned: (stats?.totalHours||0) >= 5 },
    { id:"hours_20",     icon:"🎓", label:"Scholar",        desc:"20 hours studied",         earned: (stats?.totalHours||0) >= 20 },
    { id:"progress_1",   icon:"🗺️", label:"Explorer",       desc:"Started first course",     earned: progress.length >= 1 },
    { id:"progress_5",   icon:"🌟", label:"Achiever",       desc:"Tracking 5+ courses",      earned: progress.length >= 5 },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [sData, pData, tData] = await Promise.all([
        authFetch("/users/stats").catch(() => ({})),
        authFetch("/progress").catch(() => ({})),
        authFetch("/timer/stats").catch(() => ({})),
      ]);
      if (sData.success) setStats(sData.stats);
      if (pData.success) setProgress(pData.progress || []);
      if (tData.success) setTimerStats(tData.stats);
      setLoading(false);
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const data = await authFetch("/users/profile", {
      method:"PUT",
      body: JSON.stringify({ name: form.name, domain: form.domain }),
    }).catch(() => ({}));
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("edupath_user", JSON.stringify(data.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setEditing(false);
    }
    setSaving(false);
  };

  const completedCourses  = progress.filter(p => p.percent === 100).length;
  const inProgressCourses = progress.filter(p => p.percent > 0 && p.percent < 100).length;
  const avgProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.percent, 0) / progress.length)
    : 0;

  const earnedBadges  = BADGES.filter(b => b.earned);
  const lockedBadges  = BADGES.filter(b => !b.earned);

  // Membership duration
  const joinedDaysAgo = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt)) / (1000*60*60*24))
    : null;

  const Stat = ({ icon, value, label, color="var(--blue)" }) => (
    <div style={{ textAlign:"center", padding:"16px 12px", background:"var(--main-bg)", borderRadius:12, border:"1px solid var(--border)", flex:1 }}>
      <div style={{ fontSize:"1.2rem", marginBottom:4 }}>{icon}</div>
      {loading
        ? <div className="skeleton" style={{ height:28, width:40, margin:"0 auto 4px" }} />
        : <div style={{ fontSize:"1.5rem", fontWeight:800, color, lineHeight:1 }}>{value ?? "—"}</div>
      }
      <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:700, marginTop:4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* ── Hero card */}
      <div style={{ background:"linear-gradient(135deg,#1a73e8 0%,#1558b0 60%,#0d3c7a 100%)", borderRadius:16, padding:"28px 32px", position:"relative", overflow:"hidden", boxShadow:"0 8px 24px rgba(26,115,232,0.25)" }}>
        {/* Background orb */}
        <div style={{ position:"absolute", right:-40, top:-40, width:220, height:220, background:"rgba(255,255,255,0.05)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", right:60, bottom:-60, width:160, height:160, background:"rgba(255,255,255,0.04)", borderRadius:"50%" }} />

        <div style={{ display:"flex", alignItems:"center", gap:20, position:"relative", zIndex:1 }}>
          {/* Avatar */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"3px solid rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", fontWeight:800, color:"white", backdropFilter:"blur(4px)" }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {/* Domain badge */}
            {user?.domain && (
              <div style={{ position:"absolute", bottom:-4, right:-4, background:"white", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
                {DOMAIN_ICONS[user.domain] || "🎓"}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            {editing ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.15)", color:"white", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.95rem", outline:"none" }}
                  placeholder="Your name" />
                <select value={form.domain} onChange={e => setForm(f=>({...f,domain:e.target.value}))}
                  style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.15)", color:"white", fontFamily:"Nunito,sans-serif", fontWeight:600, fontSize:"0.82rem", cursor:"pointer", outline:"none" }}>
                  <option value="" style={{color:"#333"}}>Select domain</option>
                  {domains.map(d => <option key={d} value={d} style={{color:"#333"}}>{d}</option>)}
                </select>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveProfile} disabled={saving}
                    style={{ padding:"7px 16px", background:"white", color:"var(--blue)", border:"none", borderRadius:8, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.78rem", cursor:"pointer" }}>
                    {saving ? "Saving…" : "Save ✓"}
                  </button>
                  <button onClick={() => { setEditing(false); setForm({ name:user?.name||"", domain:user?.domain||"" }); }}
                    style={{ padding:"7px 16px", background:"transparent", color:"rgba(255,255,255,0.8)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <div style={{ fontSize:"1.4rem", fontWeight:800, color:"white", letterSpacing:"-0.3px" }}>{user?.name}</div>
                  {saved && <span style={{ fontSize:"0.65rem", background:"rgba(52,168,83,0.3)", color:"#a8f0b5", padding:"2px 8px", borderRadius:50, fontWeight:700 }}>✓ Saved</span>}
                </div>
                <div style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.75)", marginBottom:4 }}>{user?.email}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  {user?.domain && (
                    <span style={{ fontSize:"0.7rem", background:"rgba(255,255,255,0.2)", color:"white", padding:"3px 10px", borderRadius:50, fontWeight:700 }}>
                      {DOMAIN_ICONS[user.domain]} {user.domain}
                    </span>
                  )}
                  {joinedDaysAgo !== null && (
                    <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.65)", fontWeight:600 }}>
                      📅 Member for {joinedDaysAgo === 0 ? "today" : `${joinedDaysAgo}d`}
                    </span>
                  )}
                  {earnedBadges.length > 0 && (
                    <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.65)", fontWeight:600 }}>
                      🏅 {earnedBadges.length} badge{earnedBadges.length !== 1 ? "s" : ""} earned
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Edit button */}
          {!editing && (
            <button onClick={() => setEditing(true)}
              style={{ padding:"9px 18px", background:"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", cursor:"pointer", backdropFilter:"blur(4px)", transition:"all 0.2s", flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row */}
      <div style={{ display:"flex", gap:10 }}>
        <Stat icon="🔥" value={stats?.streak ?? 0}          label="Day Streak"       color="#ea8600" />
        <Stat icon="🏆" value={stats?.longestStreak ?? 0}   label="Best Streak"      color="#ea8600" />
        <Stat icon="✅" value={stats?.completedTasks ?? 0}  label="Tasks Done"       color="var(--green)" />
        <Stat icon="📖" value={stats?.totalHours ?? 0}      label="Hours Studied"    color="var(--blue)" />
        <Stat icon="🗺️" value={completedCourses}            label="Courses Done"     color="var(--green)" />
        <Stat icon="⏱️" value={timerStats?.totalSessionsThisWeek ?? 0} label="Sessions/Week" color="var(--blue)" />
      </div>

      {/* ── Two-column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        {/* Learning Progress */}
        <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontSize:"0.9rem", fontWeight:800 }}>📊 Learning Progress</div>
            <button onClick={() => setPage("myprogress")}
              style={{ fontSize:"0.68rem", color:"var(--blue)", background:"var(--blue-light)", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontFamily:"Nunito,sans-serif", fontWeight:700 }}>
              View all →
            </button>
          </div>
          {/* Summary pills */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[
              { v:completedCourses,  l:"Completed", bg:"#e6f4ea", c:"var(--green)" },
              { v:inProgressCourses, l:"In Progress",bg:"var(--blue-light)", c:"var(--blue)" },
              { v:avgProgress+"%",   l:"Avg Progress",bg:"#fff3e0", c:"var(--orange)" },
            ].map(s => (
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"8px 4px", background:s.bg, borderRadius:10 }}>
                <div style={{ fontSize:"1rem", fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:"0.58rem", fontWeight:700, color:s.c, opacity:0.8 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:36, marginBottom:10 }} />)
          ) : progress.length === 0 ? (
            <div style={{ textAlign:"center", padding:"20px 0", color:"var(--muted)", fontSize:"0.8rem" }}>
              No courses tracked yet.<br/>
              <span onClick={() => setPage("roadmap")} style={{ color:"var(--blue)", cursor:"pointer", fontWeight:700 }}>Start your roadmap →</span>
            </div>
          ) : progress.slice(0,5).map(p => (
            <div key={p._id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", fontWeight:700, marginBottom:5 }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"72%" }}>{p.course}</span>
                <span style={{ color: p.percent===100?"var(--green)":"var(--blue)", flexShrink:0 }}>{p.percent}%</span>
              </div>
              <div style={{ height:7, background:"var(--blue-light)", borderRadius:50, overflow:"hidden" }}>
                <div style={{ width:`${p.percent}%`, height:"100%", background:p.percent===100?"var(--green)":"linear-gradient(90deg,var(--blue),#4a90d9)", borderRadius:50, transition:"width 0.6s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Weekly focus chart */}
        <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize:"0.9rem", fontWeight:800, marginBottom:6 }}>⏱️ Focus Time This Week</div>
          <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:16 }}>
            {timerStats ? `${timerStats.totalHoursThisWeek}h total · ${timerStats.completionRate}% completion rate` : "Loading…"}
          </div>
          {loading ? (
            <div className="skeleton" style={{ height:80 }} />
          ) : (
            <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80, marginBottom:10 }}>
              {(timerStats?.weekly || [{ day:"Mon",minutes:0 },{ day:"Tue",minutes:0 },{ day:"Wed",minutes:0 },{ day:"Thu",minutes:0 },{ day:"Fri",minutes:0 },{ day:"Sat",minutes:0 },{ day:"Sun",minutes:0 }]).map(d => {
                const maxMins = Math.max(...(timerStats?.weekly||[]).map(w=>w.minutes), 1);
                return (
                  <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ fontSize:"0.55rem", color:"var(--blue)", fontWeight:700 }}>{d.minutes>0?d.minutes+"m":""}</div>
                    <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:d.minutes>0?"linear-gradient(180deg,var(--blue),var(--blue-dark))":"var(--border)", height:`${Math.max(6,(d.minutes/maxMins)*56)}px`, transition:"height 0.5s ease" }} />
                    <div style={{ fontSize:"0.58rem", fontWeight:700, color:"var(--muted)" }}>{d.day}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Today summary */}
          <div style={{ display:"flex", gap:8 }}>
            {[
              { icon:"🍅", label:"Sessions", value:timerStats?.totalSessionsThisWeek ?? "—" },
              { icon:"✅", label:"Completed", value:timerStats ? `${timerStats.completionRate}%` : "—" },
              { icon:"📅", label:"Today", value:timerStats ? `${timerStats.todayMinutes}m` : "—" },
            ].map(s => (
              <div key={s.label} style={{ flex:1, textAlign:"center", padding:"8px 4px", background:"var(--main-bg)", borderRadius:8, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:"0.9rem" }}>{s.icon}</div>
                <div style={{ fontSize:"0.8rem", fontWeight:800, color:"var(--blue)" }}>{s.value}</div>
                <div style={{ fontSize:"0.58rem", color:"var(--muted)", fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Badges */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize:"0.9rem", fontWeight:800, marginBottom:4 }}>🏅 Badges & Achievements</div>
        <div style={{ fontSize:"0.75rem", color:"var(--muted)", marginBottom:16 }}>{earnedBadges.length} of {BADGES.length} earned</div>

        {/* Earned */}
        {earnedBadges.length > 0 && (
          <>
            <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:10 }}>EARNED</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
              {earnedBadges.map(b => (
                <div key={b.id} style={{ textAlign:"center", padding:"12px 8px", background:"linear-gradient(135deg,var(--blue-light),#dce8fd)", borderRadius:12, border:"1.5px solid var(--blue)" }}>
                  <div style={{ fontSize:"1.6rem", marginBottom:4 }}>{b.icon}</div>
                  <div style={{ fontSize:"0.68rem", fontWeight:800, color:"var(--blue)" }}>{b.label}</div>
                  <div style={{ fontSize:"0.58rem", color:"var(--muted)", marginTop:2 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Locked */}
        {lockedBadges.length > 0 && (
          <>
            <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:10 }}>LOCKED</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
              {lockedBadges.map(b => (
                <div key={b.id} style={{ textAlign:"center", padding:"12px 8px", background:"var(--main-bg)", borderRadius:12, border:"1px solid var(--border)", opacity:0.55 }}>
                  <div style={{ fontSize:"1.6rem", marginBottom:4, filter:"grayscale(1)" }}>{b.icon}</div>
                  <div style={{ fontSize:"0.68rem", fontWeight:800, color:"var(--muted)" }}>{b.label}</div>
                  <div style={{ fontSize:"0.58rem", color:"var(--muted)", marginTop:2 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { icon:"🗺️", label:"My Roadmap",     sub:"Continue learning",    goto:"roadmap",    color:"var(--blue)" },
          { icon:"✅", label:"My Tasks",        sub:"View & manage tasks",  goto:"tasks",      color:"var(--green)" },
          { icon:"⚙️", label:"Edit Settings",  sub:"Account preferences",  goto:"settings",   color:"var(--orange)" },
        ].map(a => (
          <div key={a.label} onClick={() => setPage(a.goto)}
            style={{ padding:"16px", background:"white", borderRadius:12, border:"1px solid var(--border)", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:12 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=a.color; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"var(--blue-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{a.icon}</div>
            <div>
              <div style={{ fontSize:"0.8rem", fontWeight:800 }}>{a.label}</div>
              <div style={{ fontSize:"0.65rem", color:"var(--muted)", marginTop:1 }}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

function SettingsPage({ user, setUser, darkMode, setDarkMode }) {
  const [profile, setProfile]   = useState({ name: user?.name || "", domain: user?.domain || "" });
  const [pwForm, setPwForm]     = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [prefs, setPrefs]       = useState({ notifications: true, timerPreset:"pomodoro" });
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ text:"", type:"" }); // type: success | error
  const [showDelete, setShowDelete] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey);
  const [apiKeyShow, setApiKeyShow] = useState(false);
  const [apiKeyMsg, setApiKeyMsg]   = useState({ text:"", type:"" });
  const [apiKeyTesting, setApiKeyTesting] = useState(false);
  const domains = ["Web Dev","AI / ML","DSA","Data Science","DevOps","Android"];
  const timerPresets = [
    { value:"pomodoro", label:"🍅 Pomodoro (25 min)" },
    { value:"deep_work", label:"🔥 Deep Work (50 min)" },
    { value:"quick_focus", label:"⚡ Quick Focus (15 min)" },
  ];

  const flash = (text, type="success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text:"", type:"" }), 3500); };

  // Load preferences on mount
  useEffect(() => {
    authFetch("/users/profile").then(data => {
      if (data.success) {
        setProfile({ name: data.user.name || "", domain: data.user.domain || "" });
        setPrefs({
          notifications: data.user.preferences?.notifications ?? true,
          timerPreset:   data.user.preferences?.timerPreset   || "pomodoro",
        });
      }
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const data = await authFetch("/users/profile", {
      method:"PUT",
      body: JSON.stringify({ name: profile.name, domain: profile.domain }),
    }).catch(() => ({}));
    if (data.success) {
      setUser(data.user);
      const stored = JSON.parse(localStorage.getItem("edupath_user") || "{}");
      localStorage.setItem("edupath_user", JSON.stringify({ ...stored, ...data.user }));
      flash("Profile saved! ✅");
    } else { flash(data.error || "Failed to save.", "error"); }
    setSaving(false);
  };

  const savePrefs = async () => {
    setSaving(true);
    const data = await authFetch("/users/preferences", {
      method:"PUT",
      body: JSON.stringify({ darkMode, notifications: prefs.notifications, timerPreset: prefs.timerPreset }),
    }).catch(() => ({}));
    if (data.success) { flash("Preferences saved! ✅"); }
    else { flash("Failed to save preferences.", "error"); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { flash("Passwords don't match.", "error"); return; }
    if (pwForm.newPassword.length < 6) { flash("New password must be at least 6 chars.", "error"); return; }
    setSaving(true);
    const data = await authFetch("/auth/change-password", {
      method:"POST",
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    }).catch(() => ({}));
    if (data.success) { flash("Password changed! ✅"); setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" }); }
    else { flash(data.error || data.errors?.[0]?.message || "Failed to change password.", "error"); }
    setSaving(false);
  };

  const deleteAccount = async () => {
    await authFetch("/users/account", { method:"DELETE" }).catch(() => {});
    clearToken(); window.location.reload();
  };

  const inp = (val, onChange, placeholder, type="text") => (
    <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10,
        fontFamily:"Nunito,sans-serif", fontSize:"0.83rem", background:"var(--main-bg)", color:"var(--text)" }} />
  );

  const tabs = ["👤 Profile","🔒 Password","⚙️ Preferences","🔑 API Key","🗑️ Danger Zone"];

  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:"1.2rem", fontWeight:800, marginBottom:4 }}>⚙️ Settings</div>
      <div style={{ fontSize:"0.8rem", color:"var(--muted)", marginBottom:20 }}>Manage your account, preferences and security</div>

      {/* Flash message */}
      {msg.text && (
        <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:16, fontSize:"0.8rem", fontWeight:700,
          background: msg.type==="error" ? "#fce8e6" : "#e6f4ea",
          color:      msg.type==="error" ? "#d93025"  : "#34a853",
          border:     `1px solid ${msg.type==="error" ? "#f5c6c3" : "#b7dfb9"}` }}>
          {msg.text}
        </div>
      )}

      {/* Tab nav */}
      <div style={{ display:"flex", gap:4, marginBottom:24, background:"var(--main-bg)", borderRadius:10, padding:4 }}>
        {tabs.map((t,i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            flex:1, padding:"9px 6px", border:"none", borderRadius:8, fontFamily:"Nunito,sans-serif",
            fontWeight:700, fontSize:"0.72rem", cursor:"pointer", transition:"all 0.2s",
            background: activeTab===i ? "white" : "transparent",
            color:      activeTab===i ? (i===3?"var(--red)":"var(--blue)") : "var(--muted)",
            boxShadow:  activeTab===i ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}>{t}</button>
        ))}
      </div>

      {/* ── Profile tab */}
      {activeTab === 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, padding:16, background:"var(--blue-light)", borderRadius:12 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"1.4rem", fontWeight:800, flexShrink:0 }}>
              {profile.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize:"0.95rem", fontWeight:800 }}>{profile.name}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginTop:2 }}>{user?.email}</div>
              <div style={{ fontSize:"0.68rem", color:"var(--blue)", fontWeight:700, marginTop:2 }}>{profile.domain || "No domain set"}</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>FULL NAME</label>
            {inp(profile.name, v => setProfile(p=>({...p,name:v})), "Your full name")}
          </div>
          <div>
            <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>LEARNING DOMAIN</label>
            <select value={profile.domain} onChange={e => setProfile(p=>({...p,domain:e.target.value}))}
              style={{ width:"100%", padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10,
                fontFamily:"Nunito,sans-serif", fontSize:"0.83rem", background:"var(--main-bg)", color:"var(--text)", cursor:"pointer" }}>
              <option value="">Select domain</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600, padding:"8px 0" }}>📧 {user?.email} (email cannot be changed)</div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            style={{ background:"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:10, padding:"13px", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1, boxShadow:"0 4px 16px rgba(26,115,232,0.3)" }}>
            {saving ? "Saving…" : "Save Profile →"}
          </button>
        </div>
      )}

      {/* ── Password tab */}
      {activeTab === 1 && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ padding:14, background:"var(--blue-light)", borderRadius:10, fontSize:"0.78rem", color:"var(--blue)", fontWeight:600 }}>
            🔒 Choose a strong password with at least 6 characters and one number.
          </div>
          <div>
            <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>CURRENT PASSWORD</label>
            {inp(pwForm.currentPassword, v => setPwForm(p=>({...p,currentPassword:v})), "Enter current password", "password")}
          </div>
          <div>
            <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>NEW PASSWORD</label>
            {inp(pwForm.newPassword, v => setPwForm(p=>({...p,newPassword:v})), "Min 6 chars, include a number", "password")}
          </div>
          <div>
            <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>CONFIRM NEW PASSWORD</label>
            {inp(pwForm.confirmPassword, v => setPwForm(p=>({...p,confirmPassword:v})), "Repeat new password", "password")}
          </div>
          <button onClick={changePassword} disabled={saving || !pwForm.currentPassword || !pwForm.newPassword}
            style={{ background:saving||!pwForm.currentPassword||!pwForm.newPassword?"var(--muted)":"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:10, padding:"13px", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:"pointer", opacity:saving?0.7:1 }}>
            {saving ? "Changing…" : "Change Password 🔒"}
          </button>
        </div>
      )}

      {/* ── Preferences tab */}
      {activeTab === 2 && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {/* Dark mode */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"var(--main-bg)", borderRadius:12, border:"1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize:"0.85rem", fontWeight:700 }}>🌙 Dark Mode</div>
              <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginTop:2 }}>Switch to a darker interface</div>
            </div>
            <div onClick={() => { setDarkMode(!darkMode); }} style={{ width:42, height:22, background:darkMode?"var(--blue)":"var(--border)", borderRadius:50, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", width:18, height:18, background:"white", borderRadius:"50%", top:2, left:darkMode?22:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
          {/* Notifications */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"var(--main-bg)", borderRadius:12, border:"1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize:"0.85rem", fontWeight:700 }}>🔔 Notifications</div>
              <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginTop:2 }}>Get alerts for tasks and streaks</div>
            </div>
            <div onClick={() => setPrefs(p=>({...p,notifications:!p.notifications}))} style={{ width:42, height:22, background:prefs.notifications?"var(--blue)":"var(--border)", borderRadius:50, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", width:18, height:18, background:"white", borderRadius:"50%", top:2, left:prefs.notifications?22:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
          {/* Default timer preset */}
          <div style={{ padding:"14px 16px", background:"var(--main-bg)", borderRadius:12, border:"1px solid var(--border)" }}>
            <div style={{ fontSize:"0.85rem", fontWeight:700, marginBottom:4 }}>⏱️ Default Timer Preset</div>
            <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginBottom:12 }}>Sets your default Focus Timer when the app loads</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {timerPresets.map(p => (
                <div key={p.value} onClick={() => setPrefs(pr=>({...pr,timerPreset:p.value}))}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                    background: prefs.timerPreset===p.value ? "var(--blue-light)" : "white",
                    border: `1.5px solid ${prefs.timerPreset===p.value ? "var(--blue)" : "var(--border)"}`,
                    transition:"all 0.15s" }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${prefs.timerPreset===p.value?"var(--blue)":"var(--border)"}`, background:prefs.timerPreset===p.value?"var(--blue)":"transparent", flexShrink:0 }} />
                  <span style={{ fontSize:"0.8rem", fontWeight:700, color:prefs.timerPreset===p.value?"var(--blue)":"var(--text)" }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={savePrefs} disabled={saving}
            style={{ background:"linear-gradient(135deg,var(--blue),var(--blue-dark))", color:"white", border:"none", borderRadius:10, padding:"13px", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1, boxShadow:"0 4px 16px rgba(26,115,232,0.3)" }}>
            {saving ? "Saving…" : "Save Preferences →"}
          </button>
        </div>
      )}

      {/* ── API Key tab */}
      {activeTab === 3 && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div style={{ padding:16, background:"#e8f0fe", borderRadius:12, border:"1px solid #c5d7f5" }}>
            <div style={{ fontSize:"0.85rem", fontWeight:800, color:"#1a73e8", marginBottom:6 }}>🔑 Anthropic API Key</div>
            <div style={{ fontSize:"0.75rem", color:"#1565c0", lineHeight:1.7 }}>
              This key powers AI-generated descriptions and resource recommendations in the Roadmap Finder. It is stored only in your browser and never sent to EduPath servers.
            </div>
          </div>

          {/* Current key status */}
          <div style={{ padding:14, borderRadius:12, border:"1px solid var(--border)", background:"var(--main-bg)", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:"1.4rem" }}>{apiKeyInput ? "✅" : "❌"}</span>
            <div>
              <div style={{ fontSize:"0.78rem", fontWeight:800, color:"var(--text)" }}>{apiKeyInput ? "API key is configured" : "No API key set"}</div>
              {apiKeyInput && <div style={{ fontSize:"0.68rem", color:"var(--muted)", fontFamily:"monospace", marginTop:2 }}>{apiKeyInput.slice(0,14)}…{apiKeyInput.slice(-4)}</div>}
            </div>
          </div>

          {/* Key input */}
          <div>
            <div style={{ fontSize:"0.65rem", fontWeight:800, color:"var(--muted)", letterSpacing:"1px", marginBottom:8 }}>
              {apiKeyInput ? "UPDATE API KEY" : "ENTER API KEY"}
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <input
                type={apiKeyShow ? "text" : "password"}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-api03-…"
                style={{ flex:1, padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"var(--card-bg)", color:"var(--text)", outline:"none" }}
              />
              <button onClick={() => setApiKeyShow(s => !s)}
                style={{ padding:"11px 14px", border:"1px solid var(--border)", borderRadius:10, background:"var(--main-bg)", cursor:"pointer", fontSize:"0.9rem" }}>
                {apiKeyShow ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={async () => {
                const trimmed = apiKeyInput.trim();
                if (!trimmed) { setApiKeyMsg({ text:"Please enter a key.", type:"error" }); return; }
                if (!trimmed.startsWith("sk-ant-")) { setApiKeyMsg({ text:"Key should start with sk-ant-…", type:"error" }); return; }
                setApiKeyTesting(true); setApiKeyMsg({ text:"", type:"" });
                try {
                  saveApiKey(trimmed);
                  await callAI("Say OK in one word.");
                  setApiKeyMsg({ text:"✅ Key saved and verified successfully!", type:"success" });
                } catch(e) {
                  clearApiKey();
                  setApiKeyMsg({ text:"❌ " + (e.message || "Invalid key. Please check and try again."), type:"error" });
                }
                setApiKeyTesting(false);
              }} disabled={apiKeyTesting || !apiKeyInput.trim()}
                style={{ flex:1, padding:"11px", background:"#1a73e8", color:"white", border:"none", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.82rem", cursor:"pointer", opacity: apiKeyTesting || !apiKeyInput.trim() ? 0.6 : 1 }}>
                {apiKeyTesting ? "⏳ Verifying…" : "💾 Save & Verify"}
              </button>
              {apiKeyInput && (
                <button onClick={() => { clearApiKey(); setApiKeyInput(""); setApiKeyMsg({ text:"API key removed.", type:"success" }); }}
                  style={{ padding:"11px 16px", background:"#fce8e6", color:"#d93025", border:"1px solid #f5c6c3", borderRadius:10, fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.82rem", cursor:"pointer" }}>
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>

          {/* Flash msg */}
          {apiKeyMsg.text && (
            <div style={{ padding:"10px 14px", borderRadius:10, fontSize:"0.8rem", fontWeight:700,
              background: apiKeyMsg.type==="error" ? "#fce8e6" : "#e6f4ea",
              color:      apiKeyMsg.type==="error" ? "#d93025"  : "#34a853",
              border:     `1px solid ${apiKeyMsg.type==="error" ? "#f5c6c3" : "#b7dfb9"}` }}>
              {apiKeyMsg.text}
            </div>
          )}

          {/* Help */}
          <div style={{ padding:14, background:"var(--main-bg)", borderRadius:12, fontSize:"0.72rem", color:"var(--muted)", lineHeight:1.8 }}>
            <strong>How to get your API key:</strong><br/>
            1. Visit <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color:"#1a73e8" }}>console.anthropic.com/settings/keys</a><br/>
            2. Click <strong>"Create Key"</strong> and copy it<br/>
            3. Paste it above and click <strong>Save & Verify</strong><br/>
            <br/>
            🔒 The key is stored only in this browser (localStorage) and is never sent to EduPath servers.
          </div>
        </div>
      )}

      {/* ── Danger Zone tab */}
      {activeTab === 4 && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:16, background:"#fce8e6", borderRadius:12, border:"1px solid #f5c6c3" }}>
            <div style={{ fontSize:"0.85rem", fontWeight:800, color:"#d93025", marginBottom:6 }}>⚠️ Danger Zone</div>
            <div style={{ fontSize:"0.75rem", color:"#c62828", lineHeight:1.6 }}>
              Actions here are permanent and cannot be undone. Your tasks, progress, timer sessions and all data will be deleted forever.
            </div>
          </div>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              style={{ background:"white", color:"var(--red)", border:"2px solid var(--red)", borderRadius:10, padding:"13px", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:"pointer" }}>
              🗑️ Delete My Account
            </button>
          ) : (
            <div style={{ padding:16, background:"#fce8e6", borderRadius:12, border:"1px solid #f5c6c3" }}>
              <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#c62828", marginBottom:14 }}>
                Are you absolutely sure? This will delete <strong>all your data</strong> permanently.
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={deleteAccount}
                  style={{ flex:1, background:"var(--red)", color:"white", border:"none", borderRadius:10, padding:"12px", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.82rem", cursor:"pointer" }}>
                  Yes, delete everything
                </button>
                <button onClick={() => setShowDelete(false)}
                  style={{ flex:1, background:"white", color:"var(--text)", border:"1px solid var(--border)", borderRadius:10, padding:"12px", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// COMMUNITY PAGE
// ══════════════════════════════════════════
function CommunityPage({ user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [postText, setPostText]   = useState("");
  const [posts, setPosts]         = useState([
    { id:1, author:"Priya S.", avatar:"P", domain:"Web Dev", time:"2h ago", text:"Just finished the React roadmap! 🎉 The FocusTimer really helped me stay on track. Highly recommend the Pomodoro preset for long study sessions.", likes:12, liked:false, comments:3, tag:"Achievement" },
    { id:2, author:"Arjun K.", avatar:"A", domain:"DSA",     time:"5h ago", text:"Struggling with Dynamic Programming problems. Any tips on how to approach memoization vs tabulation? The DP section feels overwhelming.", likes:8,  liked:false, comments:7, tag:"Help" },
    { id:3, author:"Meera R.", avatar:"M", domain:"AI / ML", time:"1d ago", text:"Resource recommendation: Fast.ai's practical deep learning course is 🔥 for anyone in the AI/ML path. Free and very hands-on.", likes:24, liked:false, comments:5, tag:"Resource" },
    { id:4, author:"Rahul T.", avatar:"R", domain:"DevOps",  time:"1d ago", text:"Pro tip: Set up a 3-day streak reminder on your phone. Once you hit day 7, you don't want to break it. Currently on a 21-day streak! 🔥", likes:31, liked:false, comments:9, tag:"Tip" },
    { id:5, author:"Sneha P.", avatar:"S", domain:"Data Science", time:"2d ago", text:"The Placement Prep section has amazing company-wise questions. Got my Amazon interview scheduled next week. Fingers crossed! 🤞", likes:18, liked:false, comments:4, tag:"Achievement" },
  ]);

  const tagColors = {
    Achievement: { bg:"#e6f4ea", color:"#34a853" },
    Help:        { bg:"#fce8e6", color:"#d93025" },
    Resource:    { bg:"#e8f0fe", color:"#1a73e8" },
    Tip:         { bg:"#fff3e0", color:"#ea8600" },
  };

  const tabs = ["🔥 Feed","❓ Q&A","📣 Announcements","🏆 Leaderboard"];

  const LEADERBOARD = [
    { rank:1, name:"Rahul T.",  domain:"DevOps",      streak:21, points:840, badge:"🥇" },
    { rank:2, name:"Meera R.",  domain:"AI / ML",     streak:14, points:720, badge:"🥈" },
    { rank:3, name:"Sneha P.",  domain:"Data Science",streak:12, points:690, badge:"🥉" },
    { rank:4, name:"Arjun K.",  domain:"DSA",         streak:9,  points:540, badge:"4️⃣" },
    { rank:5, name:"Priya S.",  domain:"Web Dev",     streak:7,  points:410, badge:"5️⃣" },
    { rank:6, name:user?.name?.split(" ")[0]||"You", domain:user?.domain||"—", streak:0, points:120, badge:"6️⃣", isMe:true },
  ];

  const toggleLike = (id) => setPosts(ps => ps.map(p => p.id===id ? { ...p, liked:!p.liked, likes:p.likes+(p.liked?-1:1) } : p));

  const submitPost = () => {
    if (!postText.trim()) return;
    setPosts(ps => [{
      id: Date.now(), author: user?.name||"You", avatar: user?.name?.[0]?.toUpperCase()||"U",
      domain: user?.domain||"Learner", time:"just now", text:postText.trim(),
      likes:0, liked:false, comments:0, tag:"Tip",
    }, ...ps]);
    setPostText("");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a73e8,#1558b0)", borderRadius:14, padding:"20px 24px", color:"white" }}>
        <div style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:4 }}>👥 Community</div>
        <div style={{ fontSize:"0.8rem", opacity:0.85 }}>Connect with fellow learners · Share progress · Help each other grow</div>
        <div style={{ display:"flex", gap:16, marginTop:14 }}>
          {[{ v:"2.4k", l:"Members" },{ v:"340", l:"Posts this week" },{ v:"89%", l:"Questions answered" }].map(s => (
            <div key={s.l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"1.1rem", fontWeight:800 }}>{s.v}</div>
              <div style={{ fontSize:"0.65rem", opacity:0.8 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
          {tabs.map((t,i) => (
            <div key={t} onClick={() => setActiveTab(i)} style={{ padding:"13px 16px", fontSize:"0.78rem", fontWeight:700, cursor:"pointer",
              color:activeTab===i?"var(--blue)":"var(--muted)", borderBottom:activeTab===i?"2px solid var(--blue)":"2px solid transparent", whiteSpace:"nowrap" }}>
              {t}
            </div>
          ))}
        </div>

        <div style={{ padding:20 }}>

          {/* Feed tab */}
          {activeTab === 0 && (
            <div>
              {/* Post composer */}
              <div style={{ background:"var(--main-bg)", borderRadius:12, padding:14, marginBottom:20, border:"1px solid var(--border)" }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:"0.85rem", flexShrink:0 }}>
                    {user?.name?.[0]?.toUpperCase()||"U"}
                  </div>
                  <textarea value={postText} onChange={e => setPostText(e.target.value)}
                    placeholder="Share your progress, a tip, or ask the community…"
                    rows={2}
                    style={{ flex:1, border:"1.5px solid var(--border)", borderRadius:10, padding:"10px 12px", fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", background:"white", color:"var(--text)", resize:"none", lineHeight:1.5 }} />
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
                  <button onClick={submitPost} disabled={!postText.trim()}
                    style={{ background:postText.trim()?"var(--blue)":"var(--border)", color:"white", border:"none", borderRadius:8, padding:"8px 18px", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.78rem", cursor:postText.trim()?"pointer":"not-allowed" }}>
                    Post →
                  </button>
                </div>
              </div>
              {/* Posts */}
              {posts.map(p => (
                <div key={p.id} style={{ padding:16, borderRadius:12, border:"1px solid var(--border)", marginBottom:12, background:"var(--main-bg)", transition:"border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="var(--blue)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"var(--blue)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:"0.85rem", flexShrink:0 }}>{p.avatar}</div>
                      <div>
                        <div style={{ fontSize:"0.8rem", fontWeight:800 }}>{p.author}</div>
                        <div style={{ fontSize:"0.65rem", color:"var(--muted)" }}>{p.domain} · {p.time}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:"0.6rem", fontWeight:800, padding:"3px 9px", borderRadius:50, background:tagColors[p.tag]?.bg||"var(--blue-light)", color:tagColors[p.tag]?.color||"var(--blue)" }}>{p.tag}</span>
                  </div>
                  <div style={{ fontSize:"0.82rem", lineHeight:1.65, color:"var(--text)", marginBottom:12 }}>{p.text}</div>
                  <div style={{ display:"flex", gap:16 }}>
                    <button onClick={() => toggleLike(p.id)} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontSize:"0.75rem", fontWeight:700, color:p.liked?"var(--red)":"var(--muted)", fontFamily:"Nunito,sans-serif" }}>
                      {p.liked?"❤️":"🤍"} {p.likes}
                    </button>
                    <button style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontSize:"0.75rem", fontWeight:700, color:"var(--muted)", fontFamily:"Nunito,sans-serif" }}>
                      💬 {p.comments}
                    </button>
                    <button style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontSize:"0.75rem", fontWeight:700, color:"var(--muted)", fontFamily:"Nunito,sans-serif", marginLeft:"auto" }}>
                      ↗ Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Q&A tab */}
          {activeTab === 1 && (
            <div>
              {[
                { q:"How do I stay consistent with DSA practice?",       ans:7,  votes:23, solved:true,  time:"3h ago",  author:"Karan M." },
                { q:"Best resources for System Design interview prep?",   ans:12, votes:41, solved:true,  time:"1d ago",  author:"Divya R." },
                { q:"React vs Vue — which to learn first in 2025?",       ans:5,  votes:18, solved:false, time:"2d ago",  author:"Amit S." },
                { q:"How long does it take to get job-ready from scratch?",ans:15, votes:67, solved:true,  time:"4d ago",  author:"Neha T." },
                { q:"Is it worth learning TypeScript before getting a job?",ans:9,  votes:29, solved:false, time:"5d ago",  author:"Raj P." },
              ].map((q,i) => (
                <div key={i} style={{ display:"flex", gap:14, padding:14, borderRadius:12, border:"1px solid var(--border)", marginBottom:10, background:"var(--main-bg)", cursor:"pointer", transition:"all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="var(--blue)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:40 }}>
                    <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--blue)" }}>{q.votes}</div>
                    <div style={{ fontSize:"0.58rem", color:"var(--muted)", fontWeight:700 }}>votes</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      {q.solved && <span style={{ fontSize:"0.6rem", fontWeight:800, padding:"2px 7px", borderRadius:50, background:"#e6f4ea", color:"#34a853" }}>✓ Solved</span>}
                      <span style={{ fontSize:"0.65rem", color:"var(--muted)" }}>{q.author} · {q.time}</span>
                    </div>
                    <div style={{ fontSize:"0.82rem", fontWeight:700, marginBottom:4 }}>{q.q}</div>
                    <div style={{ fontSize:"0.7rem", color:"var(--blue)", fontWeight:600 }}>{q.ans} answers</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Announcements tab */}
          {activeTab === 2 && (
            <div>
              {[
                { icon:"🚀", title:"New Feature: AI Code Review",          body:"You can now get instant AI feedback on your code from the AI Tutor page. Just paste your code and ask for a review!",  time:"Today",    type:"feature" },
                { icon:"🏆", title:"Monthly Challenge: November",           body:"Complete 20 DSA problems this month to earn the November Champion badge. 847 students are already participating!",       time:"2 days ago",type:"challenge" },
                { icon:"🛠️", title:"Maintenance: Nov 18, 2–3 AM IST",      body:"Brief scheduled maintenance. The app may be unavailable for ~30 mins. Timer sessions will be saved before downtime.",   time:"3 days ago",type:"maintenance" },
                { icon:"📚", title:"50 New Resources Added",                body:"We've added 50 curated resources across Web Dev, DSA, and AI/ML tracks. Check the Resources page to explore them.",      time:"1 week ago", type:"content" },
              ].map((a,i) => {
                const typeColor = { feature:{bg:"#e8f0fe",color:"var(--blue)"}, challenge:{bg:"#fff3e0",color:"var(--orange)"}, maintenance:{bg:"#fce8e6",color:"var(--red)"}, content:{bg:"#e6f4ea",color:"var(--green)"} };
                return (
                  <div key={i} style={{ padding:16, borderRadius:12, border:"1px solid var(--border)", marginBottom:12, background:typeColor[a.type].bg }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:"1.3rem" }}>{a.icon}</span>
                      <div>
                        <div style={{ fontSize:"0.85rem", fontWeight:800, color:typeColor[a.type].color }}>{a.title}</div>
                        <div style={{ fontSize:"0.65rem", color:"var(--muted)" }}>{a.time}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:"0.78rem", color:"var(--text)", lineHeight:1.6 }}>{a.body}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard tab */}
          {activeTab === 3 && (
            <div>
              <div style={{ fontSize:"0.72rem", fontWeight:800, color:"var(--muted)", marginBottom:14, letterSpacing:"1px", textTransform:"uppercase" }}>November 2025 — Streak Leaderboard</div>
              {LEADERBOARD.map(l => (
                <div key={l.rank} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, marginBottom:8,
                  background: l.isMe ? "var(--blue-light)" : "var(--main-bg)",
                  border: `1px solid ${l.isMe ? "var(--blue)" : "var(--border)"}` }}>
                  <div style={{ fontSize:l.rank<=3?"1.3rem":"0.85rem", fontWeight:800, width:28, textAlign:"center" }}>{l.badge}</div>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:l.isMe?"var(--blue)":"var(--border)", display:"flex", alignItems:"center", justifyContent:"center", color:l.isMe?"white":"var(--muted)", fontWeight:800, fontSize:"0.85rem", flexShrink:0 }}>
                    {l.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:800, color:l.isMe?"var(--blue)":"var(--text)" }}>{l.name} {l.isMe&&"(You)"}</div>
                    <div style={{ fontSize:"0.65rem", color:"var(--muted)" }}>{l.domain}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"0.78rem", fontWeight:800, color:"#ea8600" }}>🔥 {l.streak} days</div>
                    <div style={{ fontSize:"0.65rem", color:"var(--muted)" }}>{l.points} pts</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14, padding:12, background:"var(--blue-light)", borderRadius:10, fontSize:"0.75rem", color:"var(--blue)", fontWeight:600, textAlign:"center" }}>
                💡 Maintain your streak daily to climb the leaderboard!
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// HELP PAGE
// ══════════════════════════════════════════
function HelpPage() {
  const [openFaq, setOpenFaq]   = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [ticketText, setTicketText] = useState("");
  const [submitted, setSubmitted]   = useState(false);

  const FAQS = [
    { q:"How do I reset my streak if I missed a day?",           a:"Streaks reset automatically if you miss a day. The best way to maintain it is to log even a short 5-minute study session each day using the Focus Timer on your dashboard." },
    { q:"Why aren't my tasks showing on the dashboard?",          a:"Make sure your backend server is running on port 5000. Open your terminal and run `cd backend && npm run dev`. Then refresh the page." },
    { q:"How does the AI Tutor work?",                            a:"The AI Tutor is powered by Claude (Anthropic) through your own backend proxy. It has a rate limit of 30 messages per 10 minutes to prevent abuse." },
    { q:"Can I change my learning domain after registering?",     a:"Yes! Go to Settings → Profile tab, select a new domain from the dropdown, and click Save Profile. Your roadmap will update immediately." },
    { q:"How is my progress percentage calculated?",              a:"Progress is saved manually when you click '+10%' on the Roadmap page, or automatically when you mark resources and questions as complete." },
    { q:"How do I save a Focus Timer session?",                   a:"Timer sessions are saved automatically to your backend. Completed sessions (timer reaches 0) count as full sessions. Pausing early saves a partial session." },
    { q:"What does 'Overdue' mean for tasks?",                    a:"Tasks with a due date in the past that haven't been completed are automatically marked as Overdue by the backend every time you fetch your task list." },
    { q:"Is my data safe? Who can see it?",                       a:"All data is stored in your own MongoDB database. Only you can access your data via your JWT token. No third parties have access to your information." },
  ];

  const GUIDES = [
    { icon:"🎯", title:"Getting Started in 5 Minutes",   steps:["Register your account","Select your learning domain","Open the Roadmap and pick your first step","Add your first task","Start a Focus Timer session"] },
    { icon:"🗺️", title:"Using the Roadmap Effectively",  steps:["Choose your domain from the pill tabs","Click 'Start' on your first topic","Use '+10%' after each study session","Track completion in My Progress","Aim to complete one topic per week"] },
    { icon:"✅", title:"Task Management Best Practices",  steps:["Break big goals into small daily tasks","Set due dates for accountability","Use the 'High' priority flag for urgent tasks","Review overdue tasks every morning","Clear completed tasks weekly to stay tidy"] },
    { icon:"🔥", title:"Building a Study Streak",         steps:["Use the Pomodoro timer (25 min) daily","Even 1 session per day counts for streak","Check your streak on the dashboard every morning","Set a phone reminder for your study time","Aim for the 7-day streak badge first"] },
  ];

  const tabs = ["❓ FAQs","📖 Guides","📮 Contact"];
  const filteredFaqs = FAQS.filter(f =>
    !searchText || f.q.toLowerCase().includes(searchText.toLowerCase()) || f.a.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a73e8,#4a90d9)", borderRadius:14, padding:"24px 28px", color:"white" }}>
        <div style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:6 }}>❓ Help Center</div>
        <div style={{ fontSize:"0.8rem", opacity:0.85, marginBottom:16 }}>Find answers, guides, and support for EduPath</div>
        <input value={searchText} onChange={e => setSearchText(e.target.value)}
          placeholder="🔍  Search FAQs…"
          style={{ width:"100%", padding:"11px 16px", borderRadius:10, border:"none", fontFamily:"Nunito,sans-serif", fontSize:"0.83rem", background:"rgba(255,255,255,0.92)", color:"#202124", outline:"none" }} />
      </div>

      {/* Quick links */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { icon:"💬", label:"AI Tutor",      sub:"Ask anything",           goto:0 },
          { icon:"📖", label:"Guides",         sub:"Step-by-step help",      goto:1 },
          { icon:"📮", label:"Contact Us",     sub:"Submit a ticket",        goto:2 },
        ].map(l => (
          <div key={l.label} onClick={() => setActiveTab(l.goto)}
            style={{ background:"white", borderRadius:12, padding:"14px 16px", border:"1px solid var(--border)", cursor:"pointer", textAlign:"center", transition:"all 0.2s", boxShadow:"0 2px 6px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--blue)"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}>
            <div style={{ fontSize:"1.4rem", marginBottom:6 }}>{l.icon}</div>
            <div style={{ fontSize:"0.8rem", fontWeight:800 }}>{l.label}</div>
            <div style={{ fontSize:"0.65rem", color:"var(--muted)", marginTop:2 }}>{l.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
          {tabs.map((t,i) => (
            <div key={t} onClick={() => setActiveTab(i)} style={{ padding:"13px 20px", fontSize:"0.8rem", fontWeight:700, cursor:"pointer",
              color:activeTab===i?"var(--blue)":"var(--muted)", borderBottom:activeTab===i?"2px solid var(--blue)":"2px solid transparent" }}>
              {t}
            </div>
          ))}
        </div>

        <div style={{ padding:20 }}>
          {/* FAQs tab */}
          {activeTab === 0 && (
            <div>
              {filteredFaqs.length === 0 && (
                <div style={{ textAlign:"center", padding:"24px 0", color:"var(--muted)", fontSize:"0.85rem" }}>No FAQs match your search.</div>
              )}
              {filteredFaqs.map((f,i) => (
                <div key={i} style={{ borderRadius:12, border:"1px solid var(--border)", marginBottom:10, overflow:"hidden" }}>
                  <div onClick={() => setOpenFaq(openFaq===i?null:i)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", cursor:"pointer", background:openFaq===i?"var(--blue-light)":"var(--main-bg)", transition:"background 0.15s" }}>
                    <span style={{ fontSize:"0.83rem", fontWeight:700, color:openFaq===i?"var(--blue)":"var(--text)" }}>{f.q}</span>
                    <span style={{ fontSize:"1rem", color:"var(--muted)", transition:"transform 0.2s", transform:openFaq===i?"rotate(180deg)":"rotate(0)" }}>▾</span>
                  </div>
                  {openFaq === i && (
                    <div style={{ padding:"12px 16px 16px", fontSize:"0.8rem", color:"var(--muted)", lineHeight:1.7, borderTop:"1px solid var(--border)", background:"white" }}>
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Guides tab */}
          {activeTab === 1 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {GUIDES.map((g,i) => (
                <div key={i} style={{ padding:16, borderRadius:12, border:"1px solid var(--border)", background:"var(--main-bg)" }}>
                  <div style={{ fontSize:"1.5rem", marginBottom:8 }}>{g.icon}</div>
                  <div style={{ fontSize:"0.85rem", fontWeight:800, marginBottom:12 }}>{g.title}</div>
                  {g.steps.map((s,j) => (
                    <div key={j} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:"var(--blue)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:800, flexShrink:0, marginTop:1 }}>{j+1}</div>
                      <span style={{ fontSize:"0.75rem", color:"var(--text)", lineHeight:1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Contact tab */}
          {activeTab === 2 && (
            <div>
              {submitted ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:"2.5rem", marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:"1rem", fontWeight:800, marginBottom:8 }}>Message Sent!</div>
                  <div style={{ fontSize:"0.82rem", color:"var(--muted)", marginBottom:20 }}>We'll get back to you within 24 hours.</div>
                  <button onClick={() => { setSubmitted(false); setTicketText(""); }}
                    style={{ background:"var(--blue)", color:"white", border:"none", borderRadius:10, padding:"10px 24px", fontFamily:"Nunito,sans-serif", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
                    Send another
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ padding:14, background:"var(--blue-light)", borderRadius:10, fontSize:"0.78rem", color:"var(--blue)", fontWeight:600 }}>
                    📮 Describe your issue and we'll respond within 24 hours. For urgent bugs, include your browser and OS.
                  </div>
                  <div>
                    <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>CATEGORY</label>
                    <select style={{ width:"100%", padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.83rem", background:"var(--main-bg)", color:"var(--text)", cursor:"pointer" }}>
                      <option>🐛 Bug Report</option>
                      <option>💡 Feature Request</option>
                      <option>❓ General Question</option>
                      <option>🔒 Account / Login Issue</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--muted)", display:"block", marginBottom:6 }}>YOUR MESSAGE</label>
                    <textarea value={ticketText} onChange={e => setTicketText(e.target.value)}
                      placeholder="Describe your issue in detail…" rows={5}
                      style={{ width:"100%", padding:"11px 14px", border:"1.5px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.83rem", background:"var(--main-bg)", color:"var(--text)", resize:"vertical", lineHeight:1.6 }} />
                  </div>
                  <button onClick={() => ticketText.trim() && setSubmitted(true)} disabled={!ticketText.trim()}
                    style={{ background:ticketText.trim()?"linear-gradient(135deg,var(--blue),var(--blue-dark))":"var(--border)", color:"white", border:"none", borderRadius:10, padding:"13px", fontFamily:"Nunito,sans-serif", fontWeight:800, fontSize:"0.85rem", cursor:ticketText.trim()?"pointer":"not-allowed", boxShadow:ticketText.trim()?"0 4px 16px rgba(26,115,232,0.3)":"none" }}>
                    Send Message →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// AI TUTOR PAGE — via /api/ai/chat
// ══════════════════════════════════════════
function AITutorPage() {
  const [messages, setMessages] = useState([
    { role:"ai", text:"Hi! I'm your 24/7 AI Tutor. Ask me anything about coding, concepts, or your roadmap. I'll explain in simple language! 😊" }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const sendChat = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role:"user", text:q }]);
    setLoading(true);
    try {
      const data = await authFetch("/ai/chat", {
        method:"POST",
        body: JSON.stringify({ message:q, history:messages.slice(-10).map(m => ({ role:m.role==="ai"?"assistant":"user", content:m.text })) }),
      });
      setMessages(m => [...m, { role:"ai", text:data.reply || "Sorry, couldn't get a response. Try again! 🔄" }]);
    } catch {
      setMessages(m => [...m, { role:"ai", text:"⚠️ Connection error. Please try again.", error:true }]);
    }
    setLoading(false);
  };

  const formatText = (text) => text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column", gap:16, minHeight:500 }}>
      <div style={{ fontSize:"1.2rem", fontWeight:800 }}>🤖 AI Tutor — Ask Anything</div>
      <div ref={chatRef} style={{ flex:1, display:"flex", flexDirection:"column", gap:10, minHeight:300, overflowY:"auto" }}>
        {messages.map((msg, i) => msg.role === "user"
          ? <div key={i} style={{ display:"flex", justifyContent:"flex-end" }}>
              <div style={{ background:"var(--blue)", color:"white", borderRadius:"12px 12px 4px 12px", padding:"12px 16px", maxWidth:"75%", fontSize:"0.82rem", lineHeight:1.5 }}>{msg.text}</div>
            </div>
          : <div key={i} style={{ display:"flex" }}>
              <div style={{ background:msg.error?"#fce8e6":"var(--blue-light)", borderRadius:"12px 12px 12px 4px", padding:"14px 16px", maxWidth:"85%" }}>
                {!msg.error && <div style={{ fontSize:"0.68rem", fontWeight:800, color:"var(--blue)", marginBottom:6, letterSpacing:"0.5px" }}>🤖 AI TUTOR</div>}
                <div style={{ fontSize:"0.82rem", lineHeight:1.6, color:msg.error?"#d93025":"var(--text)" }} dangerouslySetInnerHTML={{ __html:formatText(msg.text) }} />
              </div>
            </div>
        )}
        {loading && (
          <div style={{ display:"flex" }}>
            <div style={{ background:"var(--blue-light)", borderRadius:"12px 12px 12px 4px", padding:"14px 16px" }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key==="Enter" && sendChat()}
          placeholder="Ask your doubt here..."
          style={{ flex:1, padding:"12px 16px", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Nunito,sans-serif", fontSize:"0.82rem", outline:"none", background:"transparent", color:"var(--text)" }} />
        <button onClick={sendChat} disabled={loading}
          style={{ background:"var(--blue)", color:"white", border:"none", borderRadius:10, padding:"12px 20px", fontFamily:"Nunito,sans-serif", fontWeight:700, cursor:"pointer", fontSize:"0.82rem" }}>
          Send →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// CALENDAR WIDGET
// ══════════════════════════════════════════
function Calendar() {
  const now = new Date();
  const [selected, setSelected] = useState(now.getDate());
  const year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dayNamesLong = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const cells = [];
  for (let i=startOffset-1; i>=0; i--) cells.push({ day:daysInPrev-i, other:true });
  for (let d=1; d<=daysInMonth; d++) cells.push({ day:d });
  const total = Math.ceil((startOffset+daysInMonth)/7)*7;
  let next=1; for (let i=startOffset+daysInMonth; i<total; i++) cells.push({ day:next++, other:true });
  const selDate = new Date(year, month, selected);
  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:18, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:"0.9rem", fontWeight:800 }}>{monthNames[month]} {year}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:6 }}>
        {dayNames.map(d => <div key={d} style={{ textAlign:"center", fontSize:"0.6rem", fontWeight:800, color:"var(--muted)", padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((c, i) => {
          const isToday = !c.other && c.day===today;
          const isSel   = !c.other && c.day===selected;
          return (
            <div key={i} onClick={() => !c.other && setSelected(c.day)}
              style={{ textAlign:"center", fontSize:"0.72rem", fontWeight:700, padding:"6px 2px", borderRadius:8, cursor:c.other?"default":"pointer", opacity:c.other?0.35:1, background:isToday?"var(--blue)":isSel?"var(--blue-light)":"transparent", color:isToday?"white":isSel?"var(--blue)":"var(--muted)", transition:"background 0.15s" }}>
              {c.day}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--blue)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem", fontWeight:800 }}>{selected}</div>
          <div style={{ fontSize:"0.7rem", color:"var(--muted)", fontWeight:700 }}>{dayNamesLong[selDate.getDay()]}{selected===today?" — Today":""}</div>
        </div>
        {["9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM"].map(t => (
          <div key={t} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ fontSize:"0.65rem", color:"var(--muted)", fontWeight:700, width:36, flexShrink:0 }}>{t}</div>
            <div style={{ flex:1, borderTop:"1px solid var(--border)", marginTop:6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// PROGRESS WIDGET — live from /api/progress
// ══════════════════════════════════════════
function ProgressWidget({ stats }) {
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    authFetch("/progress").then(data => {
      if (data.success && data.progress.length > 0) setProgress(data.progress.slice(0,4));
    }).catch(() => {});
  }, []);

  const items = progress.length > 0
    ? progress.map(p => ({ l:p.course.length>14?p.course.slice(0,14)+"…":p.course, p:p.percent }))
    : [{ l:"Web Dev", p:65 },{ l:"DSA", p:80 },{ l:"ML", p:30 },{ l:"System Design", p:45 }];

  return (
    <div style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", padding:18, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:"0.82rem", fontWeight:800, marginBottom:12 }}>📈 Weekly Progress</div>
      {items.map(it => (
        <div key={it.l} style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.7rem", fontWeight:700, marginBottom:5 }}>
            <span>{it.l}</span><span style={{ color:"var(--blue)" }}>{it.p}%</span>
          </div>
          <div style={{ height:7, background:"var(--blue-light)", borderRadius:50, overflow:"hidden" }}>
            <div style={{ width:`${it.p}%`, height:"100%", background:it.p===100?"var(--green)":"linear-gradient(90deg,var(--blue),#4a90d9)", borderRadius:50, transition:"width 0.6s ease" }} />
          </div>
        </div>
      ))}
      <div style={{ background:"linear-gradient(135deg,#fff3e0,#ffe0b2)", border:"1px solid #ffcc80", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:"#e65100" }}>🔥 {stats?.streak ?? 0}</div>
        <div>
          <div style={{ fontSize:"0.7rem", fontWeight:700, color:"#bf360c" }}>Day Streak!</div>
          <div style={{ fontSize:"0.62rem", color:"#bf360c" }}>{stats?.longestStreak > 0 ? `Best: ${stats.longestStreak} days` : "Keep studying today"}</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [page, setPage]                   = useState("dashboard");
  const [darkMode, setDarkMode]           = useState(false);
  const [user, setUser]                   = useState(null);
  const [authChecked, setAuthChecked]     = useState(false);
  const [stats, setStats]                 = useState(null);
  const [statsLoading, setStatsLoading]   = useState(false);
  const [tasks, setTasks]                 = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ── On mount: restore session
  useEffect(() => {
    const savedUser = getUser();
    const token     = getToken();
    if (savedUser && token) {
      setUser(savedUser);
      authFetch("/auth/me").then(data => {
        if (data.success) { setUser(data.user); }
        else { clearToken(); setUser(null); }
        setAuthChecked(true);
      }).catch(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // ── Load stats + tasks when user is set
  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    authFetch("/users/stats").then(data => {
      if (data.success) setStats(data.stats);
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
    authFetch("/tasks?status=pending&sort=due").then(data => {
      if (data.success) setTasks(data.tasks || []);
    }).catch(() => {});
    // Streak update once per session
    authFetch("/users/streak/update", { method:"POST" }).catch(() => {});
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.body.style.background = "var(--main-bg)";
    document.body.style.color      = "var(--text)";
  }, [darkMode]);

  const handleLogout = () => {
    authFetch("/auth/logout", { method:"POST" }).catch(() => {});
    clearToken(); setUser(null); setStats(null); setTasks([]);
    setShowOnboarding(false); setPage("dashboard");
  };

  // ── Loading splash
  if (!authChecked) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f4f9" }}>
        <GlobalStyles />
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:12, animation:"fadeUp 0.5s ease both" }}>🎓</div>
          <div style={{ fontSize:"0.85rem", color:"var(--muted)", fontWeight:600 }}>Loading EduPath...</div>
        </div>
      </div>
    );
  }

  // ── Not logged in → Auth
  if (!user) return (
    <AuthPage onAuth={(u) => {
      setUser(u);
      setAuthChecked(true);
      // New user = no domain set → show onboarding
      if (!u.domain) setShowOnboarding(true);
    }} />
  );

  // ── New user → Onboarding flow
  if (showOnboarding) return (
    <OnboardingPage
      user={user}
      onComplete={(updatedUser) => {
        setUser(updatedUser);
        setUser(u => ({ ...u, ...updatedUser }));
        const stored = JSON.parse(localStorage.getItem("edupath_user") || "{}");
        localStorage.setItem("edupath_user", JSON.stringify({ ...stored, ...updatedUser }));
        setShowOnboarding(false);
        // Reload stats after onboarding sets up first task
        authFetch("/users/stats").then(data => { if (data.success) setStats(data.stats); }).catch(() => {});
        authFetch("/tasks?status=pending").then(data => { if (data.success) setTasks(data.tasks || []); }).catch(() => {});
      }}
    />
  );

  // ── Admin check — set YOUR email here
  const ADMIN_EMAIL = "admin@edupath.com"; // ← change this to your registered email
  const isAdmin = user?.email === ADMIN_EMAIL;

  // ── Pages map
  const pages = {
    dashboard: <DashboardPage setPage={setPage} user={user} />,
    profile:   <ProfilePage user={user} setUser={setUser} setPage={setPage} />,
    roadmap:   <RoadmapPage user={user} isAdmin={isAdmin} />,
    resources: <ResourcesPage />,
    placement: <PlacementPage />,
    approach:  <ApproachPage />,
    projects:  <ProjectsPage />,
    tasks:     <TasksPage />,
    community: <CommunityPage user={user} />,
    myprogress:<MyProgressPage />,
    aitutor:   <AITutorPage />,
    settings:  <SettingsPage user={user} setUser={setUser} darkMode={darkMode} setDarkMode={setDarkMode} />,
    help:      <HelpPage />,
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display:"flex", minHeight:"100vh", background:"var(--main-bg)", fontFamily:"Nunito,sans-serif", color:"var(--text)" }}>
        <Sidebar activePage={page} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout} />
        <div style={{ marginLeft:210, flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
          <Topbar user={user} setPage={setPage} />
          <div style={{ padding:"24px 28px", display:"flex", gap:24, flex:1 }}>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:20, minWidth:0 }}>
              {pages[page] || pages.dashboard}
            </div>
            {page === "dashboard" && (
              <div style={{ width:260, flexShrink:0, display:"flex", flexDirection:"column", gap:16 }}>
                <Calendar />
                <ProgressWidget stats={stats} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}