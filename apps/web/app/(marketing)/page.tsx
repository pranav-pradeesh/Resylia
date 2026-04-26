import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ fontFamily: "'DM Serif Display', 'Georgia', serif", background: '#0a0a0f', minHeight: '100vh', color: '#f1f0eb' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --amber: #f59e0b;
          --amber-dim: rgba(245,158,11,0.15);
          --text: #f1f0eb;
          --muted: #9ca3af;
          --surface: #111118;
          --border: rgba(255,255,255,0.08);
        }
        body { background: #0a0a0f; }
        .mono { font-family: 'DM Mono', monospace; }
        .nav { display:flex; justify-content:space-between; align-items:center; padding: 24px 48px; border-bottom: 1px solid var(--border); }
        .logo { font-size: 22px; letter-spacing: -0.5px; color: var(--text); }
        .logo span { color: var(--amber); }
        .nav-links { display:flex; gap:32px; }
        .nav-links a { color: var(--muted); text-decoration:none; font-family:'DM Mono',monospace; font-size:13px; transition:color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .cta-btn { background: var(--amber); color: #0a0a0f; padding: 10px 24px; border-radius: 6px; font-family:'DM Mono',monospace; font-size:13px; font-weight:500; text-decoration:none; transition: opacity 0.2s; }
        .cta-btn:hover { opacity: 0.85; }
        .hero { padding: 120px 48px 80px; max-width: 900px; margin: 0 auto; }
        .eyebrow { font-family:'DM Mono',monospace; font-size:12px; color:var(--amber); letter-spacing:3px; text-transform:uppercase; margin-bottom:24px; }
        h1 { font-size: clamp(48px,7vw,88px); line-height: 1.0; letter-spacing: -2px; color: var(--text); margin-bottom:32px; }
        h1 em { font-style:normal; color:var(--amber); }
        .subtitle { font-family:'DM Mono',monospace; font-size:16px; color:var(--muted); line-height:1.7; max-width:520px; margin-bottom:48px; }
        .hero-ctas { display:flex; gap:16px; flex-wrap:wrap; }
        .btn-primary { background:var(--amber); color:#0a0a0f; padding:16px 32px; border-radius:6px; font-family:'DM Mono',monospace; font-weight:500; text-decoration:none; font-size:14px; }
        .btn-ghost { border:1px solid var(--border); color:var(--text); padding:16px 32px; border-radius:6px; font-family:'DM Mono',monospace; font-size:14px; text-decoration:none; }
        .stats-bar { display:flex; gap:48px; padding: 48px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .stat { flex:1; min-width:160px; }
        .stat-num { font-size:40px; color:var(--amber); letter-spacing:-1px; margin-bottom:4px; }
        .stat-label { font-family:'DM Mono',monospace; font-size:12px; color:var(--muted); }
        .section { padding: 80px 48px; max-width: 1100px; margin: 0 auto; }
        .section-title { font-size: 40px; letter-spacing:-1px; margin-bottom:16px; }
        .section-sub { font-family:'DM Mono',monospace; font-size:14px; color:var(--muted); margin-bottom:56px; }
        .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
        .card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:32px; }
        .card-icon { width:40px; height:40px; background:var(--amber-dim); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:20px; }
        .card h3 { font-size:20px; margin-bottom:8px; }
        .card p { font-family:'DM Mono',monospace; font-size:13px; color:var(--muted); line-height:1.7; }
        .pricing { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; }
        .plan { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:32px; }
        .plan.featured { border-color:var(--amber); }
        .plan-badge { font-family:'DM Mono',monospace; font-size:11px; color:var(--amber); letter-spacing:2px; text-transform:uppercase; margin-bottom:16px; }
        .plan-price { font-size:48px; letter-spacing:-2px; margin-bottom:4px; }
        .plan-price span { font-family:'DM Mono',monospace; font-size:14px; color:var(--muted); }
        .plan-desc { font-family:'DM Mono',monospace; font-size:13px; color:var(--muted); margin-bottom:24px; }
        .plan ul { list-style:none; }
        .plan li { font-family:'DM Mono',monospace; font-size:13px; color:var(--muted); padding: 8px 0; border-bottom:1px solid var(--border); }
        .plan li::before { content:'→ '; color:var(--amber); }
        footer { padding:48px; border-top:1px solid var(--border); font-family:'DM Mono',monospace; font-size:12px; color:var(--muted); display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px; }
      `}</style>

      <nav className="nav">
        <div className="logo">Resylia<span>.</span></div>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="/login">Log in</a>
        </div>
        <Link href="/signup" className="cta-btn">Start free trial</Link>
      </nav>

      <section className="hero">
        <div className="eyebrow">Burnout Intelligence Platform</div>
        <h1>Predict burnout<br /><em>before it happens.</em></h1>
        <p className="subtitle">
          30-second daily check-ins. AI-powered risk scoring.
          Manager dashboards that show team health — not individual data.
          Built for employers who can't afford to lose their best people.
        </p>
        <div className="hero-ctas">
          <Link href="/signup" className="btn-primary">Start 14-day free trial</Link>
          <Link href="#how-it-works" className="btn-ghost">See how it works</Link>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat"><div className="stat-num">55%</div><div className="stat-label">of workers report burnout (2025)</div></div>
        <div className="stat"><div className="stat-num">$125K</div><div className="stat-label">avg cost to replace one employee</div></div>
        <div className="stat"><div className="stat-num">4–6wk</div><div className="stat-label">burnout predicted in advance</div></div>
        <div className="stat"><div className="stat-num">30sec</div><div className="stat-label">daily check-in time</div></div>
      </div>

      <section className="section" id="how-it-works">
        <div className="eyebrow">How it works</div>
        <h2 className="section-title">Three layers. One outcome.</h2>
        <p className="section-sub">Employees check in. Managers see trends. HR acts on data.</p>
        <div className="cards">
          <div className="card">
            <div className="card-icon">⚡</div>
            <h3>Daily check-in</h3>
            <p>Energy, stress, workload on a 1–5 scale. Optional free text for context. Available on web, Slack, and Teams. Takes 30 seconds.</p>
          </div>
          <div className="card">
            <div className="card-icon">🧠</div>
            <h3>AI coach</h3>
            <p>After each check-in, employees receive a personalized, science-backed recovery suggestion based on their last 14 days of data. Private — managers never see it.</p>
          </div>
          <div className="card">
            <div className="card-icon">📊</div>
            <h3>Manager heatmap</h3>
            <p>Anonymized team burnout trends. Risk spike alerts. Recommended interventions. Individual data is never exposed — only aggregated cohort data (minimum 5 members).</p>
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="eyebrow">Pricing</div>
        <h2 className="section-title">Simple per-seat pricing.</h2>
        <p className="section-sub">14-day free trial. No credit card required.</p>
        <div className="pricing">
          <div className="plan">
            <div className="plan-badge">Starter</div>
            <div className="plan-price">$6<span>/seat/month</span></div>
            <div className="plan-desc">10–50 employees</div>
            <ul>
              <li>Daily check-ins (web + Slack)</li>
              <li>AI coach for every employee</li>
              <li>Manager heatmap</li>
              <li>Risk alerts</li>
            </ul>
          </div>
          <div className="plan featured">
            <div className="plan-badge">Growth</div>
            <div className="plan-price">$8<span>/seat/month</span></div>
            <div className="plan-desc">50–500 employees</div>
            <ul>
              <li>Everything in Starter</li>
              <li>HR analytics dashboard</li>
              <li>Turnover cost modeling</li>
              <li>Department benchmarking</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="plan">
            <div className="plan-badge">Enterprise</div>
            <div className="plan-price" style={{ fontSize: 32, paddingTop: 8 }}>Custom</div>
            <div className="plan-desc">500+ employees</div>
            <ul>
              <li>Everything in Growth</li>
              <li>SSO (Okta, Azure AD)</li>
              <li>Microsoft Teams bot</li>
              <li>API access</li>
              <li>Dedicated SLA</li>
            </ul>
          </div>
        </div>
      </section>

      <footer>
        <span>© 2026 Resylia. All rights reserved.</span>
        <span>Burnout intelligence. Nothing else.</span>
      </footer>
    </main>
  )
}
