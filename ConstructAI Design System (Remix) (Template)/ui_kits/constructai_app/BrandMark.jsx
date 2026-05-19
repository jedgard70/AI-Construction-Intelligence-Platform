/* global React */
// BrandMark.jsx — ConstructAI / Construction Intelligence Platform AI mark
//
// A stacked chevron (apex / rooftop / blueprint) with an AI spark at the peak.
// Two color modes:
//   tone="amber" — for the dark login surface; amber tile, navy strokes, red spark
//   tone="blue"  — for the light app sidebar; brand-blue tile, white strokes, amber spark

function BrandMark({ size = 48, tone = 'amber' }) {
  const radius = Math.round(size * 0.23);
  const tile   = tone === 'amber' ? '#f0a500' : '#185FA5';
  const tile2  = tone === 'amber' ? '#cf8b00' : '#0C447C';
  const stroke = tone === 'amber' ? '#0a0d12' : '#ffffff';
  const spark  = tone === 'amber' ? '#A32D2D' : '#f0a500';
  const uid    = `bm-${tone}-${Math.round(size)}`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48"
      style={{ display:'block', borderRadius: radius,
        boxShadow: tone === 'amber'
          ? '0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 18px rgba(240,165,0,0.18)'
          : '0 1px 0 rgba(255,255,255,0.10) inset, 0 4px 12px rgba(24,95,165,0.30)' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={tile}/>
          <stop offset="100%" stopColor={tile2}/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill={`url(#${uid})`}/>

      {/* Baseline grid (blueprint ground) */}
      <g stroke={stroke} strokeOpacity="0.25" strokeWidth="1" strokeLinecap="square">
        <line x1="6"  y1="40" x2="42" y2="40"/>
        <line x1="12" y1="40" x2="12" y2="42"/>
        <line x1="24" y1="40" x2="24" y2="42"/>
        <line x1="36" y1="40" x2="36" y2="42"/>
      </g>

      {/* Stylized "A" / scaffolding */}
      <g fill="none" stroke={stroke} strokeLinejoin="miter" strokeLinecap="square" strokeMiterlimit="8">
        <path d="M 9 40 L 24 10"          strokeWidth="3.4"/>
        <path d="M 39 40 L 24 10"         strokeWidth="3.4"/>
        <path d="M 15.5 27 L 32.5 27"     strokeWidth="2.4"/>
        <path d="M 17 24 L 24 33 L 31 24" strokeWidth="1.6" strokeOpacity="0.55"/>
      </g>

      {/* AI spark at apex */}
      <circle cx="24" cy="10" r="5.2" fill={spark} fillOpacity="0.18"/>
      <circle cx="24" cy="10" r="3"   fill={spark}/>
      <circle cx="24" cy="10" r="1.2" fill={tone === 'amber' ? '#ffe6a8' : '#ffffff'}/>
      <g fill={spark} fillOpacity="0.55">
        <circle cx="14" cy="7" r="1"/>
        <circle cx="34" cy="7" r="1"/>
      </g>
    </svg>
  );
}

window.BrandMark = BrandMark;
