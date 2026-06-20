// ecos — Lightweight icon set (Lucide-style inline SVGs)
// All icons use currentColor + stroke-width 1.6 for a precise mission-control feel.

const Icon = ({ d, size = 16, sw = 1.6, fill = false, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Globe:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></Icon>,
  Grid:    (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Icon>,
  Network: (p) => <Icon {...p}><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M7.5 7.5l3 8M16.5 7.5l-3 8M8 6h8" /></Icon>,
  Sparkles:(p) => <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" /></Icon>,
  Compass: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M16 8l-2 6-6 2 2-6 6-2z" /></Icon>,
  Users:   (p) => <Icon {...p}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0111 0M15 6.5a3 3 0 010 5.5M20.5 19a5 5 0 00-3-4.5" /></Icon>,
  User:    (p) => <Icon {...p}><circle cx="12" cy="9" r="3.4" /><path d="M5 20a7 7 0 0114 0" /></Icon>,
  Building:(p) => <Icon {...p}><path d="M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M14 9h4a2 2 0 012 2v10M8 7h2M8 11h2M8 15h2" /></Icon>,
  Search:  (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></Icon>,
  Bell:    (p) => <Icon {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0" /></Icon>,
  Plus:    (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Check:   (p) => <Icon {...p}><path d="M4 12l5 5 11-12" /></Icon>,
  X:       (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>,
  ArrowLeft:  (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>,
  Cpu:     (p) => <Icon {...p}><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></Icon>,
  Satellite:(p) => <Icon {...p}><path d="M5 12L12 5l3 3-7 7-3-3zM12.5 11.5l4 4M3 21a6 6 0 016-6M3 15a10 10 0 0110 10" /></Icon>,
  Rocket:  (p) => <Icon {...p}><path d="M14 4c4 0 6 2 6 6 0 4-7 11-7 11s-3-1-4-2-2-4-2-4 7-7 11-7 6 2 6 6" /><path d="M9 15l-3 3-2-2 3-3M14 9a2 2 0 11-2.83 2.83A2 2 0 0114 9z" /></Icon>,
  Map:     (p) => <Icon {...p}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z M9 3v15 M15 6v15" /></Icon>,
  Filter:  (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" /></Icon>,
  Star:    (p) => <Icon {...p}><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 16.6 6.8 19.2l1-5.9L3.5 9.2l5.9-.9L12 3z" /></Icon>,
  Flag:    (p) => <Icon {...p}><path d="M4 21V4M4 4h12l-2 4 2 4H4" /></Icon>,
  Bolt:    (p) => <Icon {...p}><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" /></Icon>,
  Trend:   (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-9M14 6h7v7" /></Icon>,
  Pin:     (p) => <Icon {...p}><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></Icon>,
  Link:    (p) => <Icon {...p}><path d="M10 14l4-4M9 7l3-3a4 4 0 016 6l-3 3M15 17l-3 3a4 4 0 01-6-6l3-3" /></Icon>,
  Settings:(p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2L5.1 5.8 3.1 9.3l2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z" /></Icon>,
  Mail:    (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>,
  Linkedin:(p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7" /></Icon>,
  Upload:  (p) => <Icon {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></Icon>,
  Activity:(p) => <Icon {...p}><path d="M3 12h4l3-8 4 16 3-8h4" /></Icon>,
  Layers:  (p) => <Icon {...p}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5" /></Icon>,
  Eye:     (p) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>,
  Briefcase:(p)=> <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 014 0v2M3 13h18" /></Icon>,
  Send:    (p) => <Icon {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></Icon>,
  Logo:          (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M3 12s5-9 14-3M21 12s-5 9-14 3" /></Icon>,
  AlertTriangle: (p) => <Icon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>,
  Shield:        (p) => <Icon {...p}><path d="M12 2l9 4v6c0 5-4 9-9 10C3 21 3 17 3 12V6l9-4z" /></Icon>,
  BarChart:      (p) => <Icon {...p}><path d="M3 20V10M8 20V4M13 20v-8M18 20v-5" /></Icon>,
};

window.I = I;
