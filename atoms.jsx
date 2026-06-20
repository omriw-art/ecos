// ecos — small reusable atoms: ScoreRing, Sparkline, Logo, etc.

function ScoreRing({ value = 80, size = 44, stroke = 3.5, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const hue = value >= 85 ? "var(--green)" : value >= 70 ? "var(--blue)" : value >= 50 ? "var(--amber)" : "var(--rose)";
  const stroke_color = color || hue;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="var(--line-1)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={stroke_color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
                 filter: `drop-shadow(0 0 4px ${stroke_color})` }} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-mono)" fontSize={size * 0.30} fontWeight="600"
            fill="var(--text-1)">{value}</text>
    </svg>
  );
}

function Sparkline({ data = [], width = 100, height = 30, color = "var(--blue)" }) {
  if (!data.length) return null;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const dArea = d + ` L ${width},${height} L 0,${height} Z`;
  const grad = "spark-" + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={grad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill={`url(#${grad})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2" fill={color} />
    </svg>
  );
}

// Company logo block — initials inside a stylized chip
function CoLogo({ company, size = 40 }) {
  const initials = (company.name || "")
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase() || "•";
  const sector = window.SECTORS.find((s) => s.id === company.sectors[0]);
  return (
    <div className="co-logo" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${sector ? sector.color : "oklch(0.3 0.06 270)"} -20%, oklch(0.18 0.04 270) 80%)`,
      borderColor: "var(--line-2)",
      fontSize: size * 0.32,
    }}>
      <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{initials}</span>
    </div>
  );
}

function SectorPill({ id }) {
  const s = window.SECTORS.find((x) => x.id === id);
  if (!s) return null;
  return (
    <span className="pill">
      <span className="swatch" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {s.label}
    </span>
  );
}

function Donut({ data, size = 160, thickness = 18 }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const seg = (d.count / total) * c;
        const el = (
          <circle key={d.id || i} cx={size/2} cy={size/2} r={r}
            fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${seg} ${c}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: "all 0.5s ease" }}
          />
        );
        offset += seg;
        return el;
      })}
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-display)" fontSize="22" fontWeight="600" fill="var(--text-1)">
        {total}
      </text>
      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-mono)" fontSize="9" fill="var(--text-3)"
            letterSpacing="0.15em">COMPANIES</text>
    </svg>
  );
}

// Bar across full width
function MiniBar({ value = 50, max = 100, color = "var(--blue)" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{
      height: 6, background: "var(--bg-2)", borderRadius: 3, position: "relative", overflow: "hidden",
      border: "1px solid var(--line-1)",
    }}>
      <div style={{
        width: pct + "%", height: "100%",
        background: `linear-gradient(90deg, ${color}, oklch(from ${color} l c h / 0.7))`,
        boxShadow: `0 0 8px ${color}`,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

// Funnel renderer
function Funnel({ data }) {
  const max = Math.max(...data.map((d) => d.n));
  return (
    <div className="col gap-8">
      {data.map((d, i) => {
        const pct = (d.n / max) * 100;
        const hue = 240 + i * 12;
        return (
          <div key={d.stage} className="flex center gap-12" style={{ alignItems: "center" }}>
            <div style={{ width: 100, fontSize: 12, color: "var(--text-2)" }}>{d.stage}</div>
            <div className="grow" style={{ position: "relative" }}>
              <div style={{
                width: pct + "%", height: 22,
                background: `linear-gradient(90deg, oklch(0.65 0.18 ${hue}) , oklch(0.5 0.20 ${hue}))`,
                borderRadius: 4,
                boxShadow: `0 0 12px -2px oklch(0.6 0.2 ${hue} / 0.6)`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div className="mono tabnum" style={{ width: 50, textAlign: "end", fontSize: 12, color: "var(--text-1)" }}>{d.n}</div>
          </div>
        );
      })}
    </div>
  );
}

// Compatibility bar with label
function FitBar({ label, score, color = "var(--blue)" }) {
  return (
    <div className="col gap-4">
      <div className="flex between" style={{ fontSize: 11.5, color: "var(--text-2)" }}>
        <span>{label}</span>
        <span className="mono tabnum">{score}%</span>
      </div>
      <MiniBar value={score} color={color} />
    </div>
  );
}

/* ────────────────────────── Toast system ────────────────────────── */

(function() {
  const container = document.createElement("div");
  container.id = "toast-root";
  Object.assign(container.style, {
    position: "fixed", bottom: "24px", insetInlineStart: "50%",
    transform: "translateX(50%)", zIndex: "9999",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    pointerEvents: "none",
  });
  document.body.appendChild(container);

  window.toast = function(msg, type) {
    if (!msg) msg = "בקרוב — פיצ׳ר זה יהיה זמין בגרסה הבאה.";
    const el = document.createElement("div");
    const bg = type === "ok" ? "oklch(0.22 0.08 150)" : type === "err" ? "oklch(0.20 0.08 20)" : "oklch(0.20 0.05 270)";
    const border = type === "ok" ? "oklch(0.40 0.15 150)" : type === "err" ? "oklch(0.40 0.15 20)" : "oklch(0.35 0.06 270)";
    Object.assign(el.style, {
      background: bg, border: `1px solid ${border}`, borderRadius: "10px",
      padding: "10px 16px", color: "oklch(0.92 0.01 270)",
      fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: "500",
      boxShadow: "0 8px 24px -4px rgba(0,0,0,0.6)",
      opacity: "0", transform: "translateY(10px)",
      transition: "all 0.22s ease", pointerEvents: "none",
      whiteSpace: "nowrap", direction: "rtl",
    });
    el.textContent = msg;
    container.prepend(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1"; el.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0"; el.style.transform = "translateY(-8px)";
      setTimeout(() => el.remove(), 300);
    }, 2800);
  };
})();

Object.assign(window, { ScoreRing, Sparkline, CoLogo, SectorPill, Donut, MiniBar, Funnel, FitBar });
