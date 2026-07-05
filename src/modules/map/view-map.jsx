// ecos — Ecosystem Map (network graph)
// Positions are precomputed via a small force-directed sim on first render.

function MapView({ onOpenCompany }) {
  const { COMPANIES, SECTORS, CONNECTIONS } = window;
  const [hover, setHover] = React.useState(null);
  const [pinned, setPinned] = React.useState(null);
  const [showLabels, setShowLabels] = React.useState(true);
  const [filterSector, setFilterSector] = React.useState(null);

  const W = 1080, H = 560;

  // Precomputed layout: clusters by primary sector with internal jitter.
  const positions = React.useMemo(() => {
    const sectorOrder = ["earth-obs","comms","defense","ai-data","propulsion","manufacturing","life-sci","energy","launchers","sar"];
    const ring = (i, n) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = 200;
      return [W / 2 + Math.cos(ang) * r, H / 2 + Math.sin(ang) * r];
    };
    const centers = {};
    sectorOrder.forEach((s, i) => {
      const [x, y] = ring(i, sectorOrder.length);
      centers[s] = { x, y };
    });

    const pos = {};
    COMPANIES.forEach((c, i) => {
      const sector = c.sectors[0];
      const cnt = centers[sector] || { x: W/2, y: H/2 };
      const ang = (i * 137.5) * Math.PI / 180;
      const rad = 30 + (i % 4) * 18 + (c.strategic ? -10 : 0);
      pos[c.id] = {
        x: cnt.x + Math.cos(ang) * rad,
        y: cnt.y + Math.sin(ang) * rad,
      };
    });

    // Run a tiny relaxation pass: push apart overlapping nodes
    for (let iter = 0; iter < 60; iter++) {
      for (let i = 0; i < COMPANIES.length; i++) {
        for (let j = i + 1; j < COMPANIES.length; j++) {
          const a = pos[COMPANIES[i].id]; const b = pos[COMPANIES[j].id];
          const dx = b.x - a.x; const dy = b.y - a.y;
          const d2 = dx*dx + dy*dy;
          const minD = 38;
          if (d2 < minD * minD && d2 > 0.001) {
            const d = Math.sqrt(d2);
            const push = (minD - d) / 2;
            const ux = dx / d, uy = dy / d;
            a.x -= ux * push; a.y -= uy * push;
            b.x += ux * push; b.y += uy * push;
          }
        }
      }
    }
    // Clamp to bounds
    Object.values(pos).forEach((p) => {
      p.x = Math.max(40, Math.min(W - 40, p.x));
      p.y = Math.max(50, Math.min(H - 30, p.y));
    });
    return pos;
  }, []);

  const isVisible = (c) => !filterSector || c.sectors.includes(filterSector);
  const focused = hover || pinned;
  const focusedCo = focused ? COMPANIES.find((x) => x.id === focused) : null;

  const linkedIds = new Set();
  if (focused) {
    CONNECTIONS.forEach((cn) => {
      if (cn.from === focused) linkedIds.add(cn.to);
      if (cn.to === focused) linkedIds.add(cn.from);
    });
    linkedIds.add(focused);
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>מפת אקוסיסטם</h2>
          <div className="sub">{COMPANIES.length} חברות, {CONNECTIONS.length} חיבורים — קיבוץ אוטומטי לפי תחום ראשי.</div>
        </div>
        <div className="ops">
          <div className="seg">
            <button className={showLabels ? "active" : ""} onClick={() => setShowLabels(true)}>שמות</button>
            <button className={!showLabels ? "active" : ""} onClick={() => setShowLabels(false)}>אנונימי</button>
          </div>
          <button className="btn" onClick={() => window.toast("ייצוא PNG — בקרוב")}><window.I.Upload size={13} /> ייצוא PNG</button>
        </div>
      </div>

      <div className="card flush" style={{ overflow: "hidden" }}>
        <div className="flex center gap-8 wrap" style={{ padding: 14, borderBottom: "1px solid var(--line-1)" }}>
          <span className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase", marginInlineEnd: 6 }}>סנן תחום</span>
          <span className={"chip" + (!filterSector ? " active" : "")} onClick={() => setFilterSector(null)}>הכל</span>
          {SECTORS.map((s) => (
            <span key={s.id} className={"chip" + (filterSector === s.id ? " active" : "")} onClick={() => setFilterSector(s.id)}>
              <span style={{ width: 7, height: 7, borderRadius: 50, background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
              {s.label}
            </span>
          ))}
        </div>

        <div className="graph-wrap" style={{ height: H + 20 }}>
          <div className="scan-line" />
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Connections */}
            {CONNECTIONS.map((cn, i) => {
              const a = positions[cn.from]; const b = positions[cn.to];
              if (!a || !b) return null;
              const aCo = COMPANIES.find((x) => x.id === cn.from);
              const bCo = COMPANIES.find((x) => x.id === cn.to);
              if (!isVisible(aCo) || !isVisible(bCo)) return null;
              const isLinked = focused && (cn.from === focused || cn.to === focused);
              const opacity = focused ? (isLinked ? 0.9 : 0.08) : 0.25;
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={isLinked ? "oklch(0.7 0.18 260)" : "var(--line-3)"}
                      strokeWidth={isLinked ? 1.4 : 0.6}
                      strokeOpacity={opacity}
                      style={{ transition: "all 0.2s ease" }} />
              );
            })}

            {/* Nodes */}
            {COMPANIES.map((c) => {
              const p = positions[c.id]; if (!p) return null;
              const visible = isVisible(c);
              const isFocus = focused === c.id;
              const isLinked = !focused || linkedIds.has(c.id);
              const sector = SECTORS.find((s) => s.id === c.sectors[0]);
              const sz = (c.strategic ? 9 : 6) + (c.score / 25);
              const op = visible ? (isLinked ? 1 : 0.18) : 0.08;
              return (
                <g key={c.id} transform={`translate(${p.x}, ${p.y})`}
                   style={{ cursor: "default", transition: "opacity 0.2s ease" }}
                   opacity={op}
                   onMouseEnter={() => setHover(c.id)}
                   onMouseLeave={() => setHover(null)}
                   onClick={() => { setPinned(c.id); onOpenCompany(c.id); }}>
                  {(isFocus || c.strategic) && (
                    <circle r={sz + 8} fill={sector.color} opacity="0.15">
                      <animate attributeName="r" values={`${sz+6};${sz+14};${sz+6}`} dur="2.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.25;0;0.25" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle r={sz + 2} fill={sector.color} opacity="0.25" />
                  <circle r={sz} fill={sector.color}
                          stroke={isFocus ? "white" : "oklch(0.95 0.005 270)"}
                          strokeOpacity={isFocus ? 0.9 : 0.25}
                          strokeWidth={isFocus ? 1.5 : 0.5} />
                  <circle r={sz - 2} fill="url(#node-glow)" />
                  {showLabels && (
                    <text x={0} y={sz + 12} textAnchor="middle"
                          fontFamily="var(--font-mono)"
                          fontSize={c.strategic || isFocus ? 10 : 9}
                          fontWeight={c.strategic || isFocus ? 600 : 400}
                          fill={isFocus ? "white" : "var(--text-2)"}
                          letterSpacing="0.04em">
                      {c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Sector labels (faded) */}
            {SECTORS.map((s, i) => {
              const ring_n = SECTORS.length;
              const ang = (i / ring_n) * Math.PI * 2 - Math.PI / 2;
              const r = 250;
              const x = W/2 + Math.cos(ang) * r;
              const y = H/2 + Math.sin(ang) * r;
              return (
                <text key={s.id} x={x} y={y} textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="9"
                      fill={s.color}
                      opacity="0.55"
                      letterSpacing="0.18em"
                      style={{ textTransform: "uppercase" }}>
                  {s.label}
                </text>
              );
            })}
          </svg>

          {/* Floating focused-node card */}
          {focusedCo && (
            <div style={{
              position: "absolute", bottom: 14, insetInlineStart: 14,
              padding: 14, width: 320,
              background: "oklch(0.13 0.018 270 / 0.95)",
              border: "1px solid var(--line-3)",
              borderRadius: 12,
              backdropFilter: "blur(12px)",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)",
            }}>
              <div className="flex center gap-10">
                <CoLogo company={focusedCo} size={32} />
                <div className="col" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{focusedCo.name}</div>
                  <div className="mono tiny" style={{ color: "var(--text-4)" }}>{focusedCo.flag} {focusedCo.hq.toUpperCase()}</div>
                </div>
                <ScoreRing value={focusedCo.score} size={36} stroke={3} />
              </div>
              <div className="flex wrap gap-4" style={{ marginTop: 10 }}>
                {focusedCo.sectors.slice(0,3).map((s) => <SectorPill key={s} id={s} />)}
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            position: "absolute", top: 14, insetInlineEnd: 14,
            padding: 12,
            background: "oklch(0.13 0.018 270 / 0.85)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            display: "flex", flexDirection: "column", gap: 8,
            fontSize: 11,
          }}>
            <div className="mono tiny" style={{ color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>LEGEND</div>
            <div className="flex center gap-6"><span style={{ width: 10, height: 10, borderRadius: 50, background: "oklch(0.72 0.18 295)" }} /> <span style={{ color: "var(--text-2)" }}>חברה</span></div>
            <div className="flex center gap-6"><span style={{ width: 14, height: 14, borderRadius: 50, background: "oklch(0.72 0.18 295)", opacity: 0.3 }} /> <span style={{ color: "var(--text-2)" }}>אסטרטגית · pulsing</span></div>
            <div className="flex center gap-6"><span style={{ width: 18, height: 1, background: "var(--line-3)" }} /> <span style={{ color: "var(--text-2)" }}>חיבור פעיל</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.MapView = MapView;
