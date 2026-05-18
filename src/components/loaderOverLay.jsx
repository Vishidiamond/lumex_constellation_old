// components/LoadingOverlay.jsx  (NO R3F HOOKS HERE)
import { useMemo } from 'react'

export default function LoadingOverlay({
  loaderData = { active: false, progress: 0, loaded: 0, total: 0, item: null },
  title = 'Rendering 3D…'
}) {
  const { active, progress, loaded, total, item } = loaderData
  if (!active) return null

  const pct = useMemo(() => Math.min(100, Math.round(progress || 0)), [progress])
  const fileLabel = useMemo(
    () => (item ? item.replace(window.location.origin, '') : 'Initializing loaders…'),
    [item]
  )

  return (
    <div className="lx-screen">
      <div className="lx-card" role="status" aria-label={`${pct}%`}>
        <div className="lx-head">
          <div className="lx-ring" aria-hidden>
            <svg viewBox="0 0 44 44" className="lx-ring-svg">
              <circle className="track" cx="22" cy="22" r="19" />
              <circle className="arc" cx="22" cy="22" r="19" />
            </svg>
          </div>
          <div className="lx-titles">
            <div className="lx-title">{title}</div>
            <div className="lx-sub">{total ? `Preloading ${total} file${total > 1 ? 's' : ''}` : 'Preparing…'}</div>
          </div>
        </div>

        <div className="lx-rail" aria-label="Progress">
          <div className="lx-fill" style={{ transform: `scaleX(${pct / 100})` }}>
            <div className="lx-stripes" />
          </div>
        </div>

        <div className="lx-meta">
          <span className="lx-pct">{pct}%</span>
          <span className="lx-count">
            {loaded}
            {total ? ` / ${total}` : ''} {total ? 'files' : ''}
          </span>
        </div>

        {/* <div className="lx-file" title={fileLabel}>
          Loading: <span className="lx-file-name">{fileLabel}</span>
        </div> */}
      </div>

      <style>{`
        .lx-screen{
          position: fixed; inset: 0;
          display: grid; place-items: center;
          pointer-events: none; z-index: 1000;
          background: transparent; /* keep your black bg from App's container */
        }
        .lx-card{
          --bg: #141821; --fg: #e8edf3; --muted: rgba(232,237,243,.75);
          --tealA: #26c6a3; --tealB: #1fb291;
          width: clamp(320px, 46vw, 720px);
          color: var(--fg); pointer-events: none;
          background: radial-gradient(120% 200% at 50% 120%, rgba(38,198,163,.16), transparent 55%), var(--bg);
          padding: 22px 26px 18px; border-radius: 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,.55), 0 2px 0 rgba(255,255,255,.03) inset, 0 -1px 0 rgba(0,0,0,.35) inset;
          position: relative;
        }
        .lx-card::after{ content:""; position:absolute; left:6%; right:6%; bottom:-12px; height:28px;
          background: radial-gradient(80% 100% at 50% 0%, rgba(0,0,0,.45), transparent 70%); filter: blur(6px); z-index:-1; }

        .lx-head{ display:flex; align-items:center; gap:14px; margin-bottom:12px; }
        .lx-ring{ width:34px; height:34px; }
        .lx-ring-svg{ width:100%; height:100%; }
        .lx-ring-svg .track{ fill:none; stroke:rgba(255,255,255,.16); stroke-width:4; }
        .lx-ring-svg .arc{ fill:none; stroke:var(--tealA); stroke-width:4; stroke-linecap:round;
          stroke-dasharray:110 200; transform-origin:50% 50%; animation: lx-spin 1.1s linear infinite;
          filter: drop-shadow(0 0 6px rgba(38,198,163,.45)); }
        .lx-title{ font-weight:700; letter-spacing:.2px; font-size:18px; }
        .lx-sub{ font-size:13px; color:var(--muted); margin-top:2px; }

        .lx-rail{ height:12px; border-radius:999px; overflow:hidden;
          background: linear-gradient(180deg, #2f3541, #252a34);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), inset 0 6px 12px rgba(0,0,0,.35); position:relative; }
        .lx-fill{ position:absolute; inset:0; transform-origin:left;
          background: linear-gradient(90deg, var(--tealA), var(--tealB));
          transition: transform 420ms cubic-bezier(.22,.61,.36,1); box-shadow: 0 0 12px rgba(38,198,163,.35); }
        .lx-stripes{ position:absolute; inset:-30% -40%; background-image:
          linear-gradient(120deg, rgba(255,255,255,.25) 16%, rgba(255,255,255,0) 16% 32%);
          background-size: 24px 12px; opacity:.35; mix-blend-mode: soft-light; animation: lx-stripe 1.6s linear infinite; }

        .lx-meta{ display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
        .lx-pct{ font-weight:800; font-variant-numeric: tabular-nums; letter-spacing:.4px; }
        .lx-count{ color:var(--muted); font-size:13px; }
        .lx-file{ margin-top:8px; color:var(--muted); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .lx-file-name{ color:var(--fg); }

        @keyframes lx-spin{ to{ transform: rotate(1turn); } }
        @keyframes lx-stripe{ from{ transform: translateX(-20%);} to{ transform: translateX(20%);} }
        @media (prefers-reduced-motion: reduce){
          .lx-ring-svg .arc, .lx-stripes { animation:none !important; }
          .lx-fill{ transition:none; }
        }
      `}</style>
    </div>
  )
}
