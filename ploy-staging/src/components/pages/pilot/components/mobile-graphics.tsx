interface GraphicProps {
  className?: string;
}

const petalColors = [
  "text-purplelife-pink",
  "text-purplelife-coral",
  "text-purplelife-yellow",
  "text-purplelife-mint",
  "text-purplelife-blue",
  "text-purplelife-indigo",
  "text-purplelife-accent",
  "text-purplelife-orchid",
];

/**
 * @ployComponent
 * @ployComponentId purplelife-wellbeing-bloom
 * @ployComponentType component
 * @ployComponentDescription Original radial health summary graphic for PurpleLife mobile surfaces. Each petal represents one journal dimension.
 * @ployComponentTags purplelife mobile graphic health-summary
 * @ployComponentStatus experimental
 */
export function WellbeingBloom({ className = "", headline = "Ready", detail = "Add a detail" }: GraphicProps & { headline?: string; detail?: string }) {
  return (
    <svg viewBox="0 0 280 280" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="A colorful wellbeing bloom summarizing today's journal">
      <defs>
        <filter id="bloom-shadow" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#7f6ad8" floodOpacity="0.18" />
        </filter>
        <radialGradient id="bloom-center" cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor="white" />
          <stop offset="1" className="text-purplelife-tint" stopColor="currentColor" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="140" r="118" className="fill-purplelife-tint/50" />
      <g transform="translate(140 140)" filter="url(#bloom-shadow)">
        {petalColors.map((color, index) => (
          <g key={color} transform={`rotate(${index * 45})`} className={color}>
            <path d="M-25-29 C-47-53-42-88-22-107 C-11-118 11-118 22-107 C42-88 47-53 25-29 C12-15-12-15-25-29Z" fill="currentColor" />
            <circle cx="0" cy="-70" r="5" fill="white" fillOpacity="0.72" />
          </g>
        ))}
        <circle r="48" fill="url(#bloom-center)" stroke="white" strokeWidth="5" />
        <text x="0" y="-4" textAnchor="middle" className="fill-purplelife-ink text-[24px] font-semibold tracking-[-0.04em]">{headline}</text>
        <text x="0" y="18" textAnchor="middle" className="fill-purplelife-muted text-[10px] font-medium">{detail}</text>
      </g>
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-morning-rhythm-graphic
 * @ployComponentType component
 * @ployComponentDescription Soft editorial sunrise graphic used for journal insight stories.
 * @ployComponentTags purplelife mobile graphic editorial
 * @ployComponentStatus experimental
 */
export function MorningRhythmGraphic({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 210" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="An abstract sunrise with layered waves">
      <defs>
        <linearGradient id="morning-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="text-purplelife-peach" stopColor="currentColor" />
          <stop offset="1" className="text-purplelife-tint" stopColor="currentColor" />
        </linearGradient>
        <radialGradient id="morning-sun">
          <stop offset="0" stopColor="white" />
          <stop offset="0.52" className="text-purplelife-yellow" stopColor="currentColor" />
          <stop offset="1" className="text-purplelife-coral" stopColor="currentColor" />
        </radialGradient>
      </defs>
      <rect width="320" height="210" rx="30" fill="url(#morning-sky)" />
      <circle cx="238" cy="70" r="42" fill="url(#morning-sun)" opacity="0.9" />
      <path d="M0 132 C48 98 85 145 137 119 S237 82 320 129 V210 H0Z" className="fill-purplelife-orchid" opacity="0.82" />
      <path d="M0 155 C48 126 102 176 158 145 S250 118 320 151 V210 H0Z" className="fill-purplelife-indigo" opacity="0.72" />
      <path d="M0 178 C72 149 120 196 193 167 S271 151 320 173 V210 H0Z" className="fill-purplelife-blue" opacity="0.78" />
      <g fill="white" opacity="0.78">
        <circle cx="52" cy="48" r="4" /><circle cx="74" cy="33" r="2.5" /><circle cx="95" cy="52" r="3" />
      </g>
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-signal-orb
 * @ployComponentType component
 * @ployComponentDescription Soft dimensional orb graphic for focused PurpleLife trend details.
 * @ployComponentTags purplelife mobile graphic trends
 * @ployComponentStatus experimental
 */
export function SignalOrb({ className = "", value = "—", label = "no record yet" }: GraphicProps & { value?: string; label?: string }) {
  return (
    <svg viewBox="0 0 280 220" className={`purplelife-motion-graphic ${className}`} role="img" aria-label={`${label}: ${value}`}>
      <defs>
        <radialGradient id="orb-main" cx="35%" cy="25%" r="78%">
          <stop offset="0" stopColor="white" />
          <stop offset="0.18" className="text-purplelife-pink" stopColor="currentColor" />
          <stop offset="0.58" className="text-purplelife-accent" stopColor="currentColor" />
          <stop offset="1" className="text-purplelife-indigo" stopColor="currentColor" />
        </radialGradient>
        <filter id="orb-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#6f5bd2" floodOpacity="0.26" />
        </filter>
      </defs>
      <ellipse cx="140" cy="188" rx="88" ry="18" className="fill-purplelife-tint" />
      <g filter="url(#orb-shadow)">
        <path d="M140 23 C202 23 241 68 224 122 C211 165 176 194 140 194 C104 194 69 165 56 122 C39 68 78 23 140 23Z" fill="url(#orb-main)" />
        <path d="M91 64 C112 40 150 34 178 47" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" opacity="0.36" />
      </g>
      <text x="140" y="112" textAnchor="middle" fill="white" className="text-[42px] font-semibold tracking-[-0.05em]">{value}</text>
      <text x="140" y="134" textAnchor="middle" fill="white" opacity="0.85" className="text-[11px] font-medium">{label}</text>
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-journal-ribbon
 * @ployComponentType component
 * @ployComponentDescription Layered color ribbon that summarizes the mix of entry types in a PurpleLife week.
 * @ployComponentTags purplelife mobile graphic journal
 * @ployComponentStatus experimental
 */
export function JournalRibbon({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 190" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="A flowing ribbon made from journal colors">
      <rect width="320" height="190" rx="30" className="fill-purplelife-tint" />
      <path d="M-12 132 C56 42 91 168 155 82 S257 35 336 100" fill="none" className="stroke-purplelife-pink" strokeWidth="42" strokeLinecap="round" opacity="0.9" />
      <path d="M-8 145 C58 70 102 175 168 105 S264 58 332 112" fill="none" className="stroke-purplelife-accent" strokeWidth="30" strokeLinecap="round" opacity="0.92" />
      <path d="M-2 158 C64 100 116 180 182 130 S272 85 330 127" fill="none" className="stroke-purplelife-blue" strokeWidth="20" strokeLinecap="round" opacity="0.9" />
      <g fill="white" opacity="0.92">
        <circle cx="78" cy="79" r="6" /><circle cx="163" cy="91" r="5" /><circle cx="252" cy="72" r="7" />
      </g>
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-capture-halo
 * @ployComponentType component
 * @ployComponentDescription Layered halo that introduces PurpleLife's focused capture flow.
 * @ployComponentTags purplelife mobile graphic capture
 * @ployComponentStatus experimental
 */
export function CaptureHalo({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 240" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="Colorful rings surrounding a capture point">
      <defs>
        <filter id="capture-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#7761d7" floodOpacity="0.18" /></filter>
      </defs>
      <ellipse cx="160" cy="204" rx="92" ry="18" className="fill-purplelife-tint" />
      <g transform="translate(160 116)" fill="none" filter="url(#capture-shadow)">
        <circle r="83" className="stroke-purplelife-pink" strokeWidth="21" opacity="0.28" />
        <circle r="60" className="stroke-purplelife-blue" strokeWidth="18" opacity="0.48" />
        <circle r="38" className="stroke-purplelife-accent" strokeWidth="17" opacity="0.78" />
        <circle r="19" fill="white" stroke="currentColor" strokeWidth="4" className="text-purplelife-accent" />
        <path d="M-8 0h16M0-8v16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-purplelife-accent" />
      </g>
      <circle cx="83" cy="70" r="8" className="fill-purplelife-yellow" /><circle cx="235" cy="88" r="7" className="fill-purplelife-mint" /><circle cx="232" cy="166" r="6" className="fill-purplelife-coral" />
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-trend-constellation
 * @ployComponentType component
 * @ployComponentDescription Connected constellation that visualizes journal observations without implying diagnosis.
 * @ployComponentTags purplelife mobile graphic trends
 * @ployComponentStatus experimental
 */
export function TrendConstellation({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 230" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="A constellation of softly connected health journal signals">
      <rect width="320" height="230" rx="32" className="fill-purplelife-tint" />
      <path d="M36 158 C82 114 105 139 143 92 S212 54 282 76" fill="none" className="stroke-purplelife-accent" strokeWidth="3" strokeLinecap="round" opacity="0.38" />
      <path d="M36 158 C94 190 143 168 174 126 S236 104 282 76" fill="none" className="stroke-purplelife-blue" strokeWidth="2" strokeDasharray="5 9" opacity="0.45" />
      {[[36,158,"fill-purplelife-indigo",16],[97,132,"fill-purplelife-pink",21],[143,92,"fill-purplelife-yellow",14],[174,126,"fill-purplelife-mint",18],[230,73,"fill-purplelife-coral",23],[282,76,"fill-purplelife-accent",15]].map(([cx,cy,color,r]) => <circle key={`${cx}-${cy}`} cx={cx as number} cy={cy as number} r={r as number} className={color as string} opacity="0.9" />)}
      <g fill="white" opacity="0.82"><circle cx="91" cy="125" r="5" /><circle cx="223" cy="65" r="6" /><circle cx="171" cy="121" r="4" /></g>
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-sharing-rings
 * @ployComponentType component
 * @ployComponentDescription Two overlapping rings representing selective read-only sharing.
 * @ployComponentTags purplelife mobile graphic sharing privacy
 * @ployComponentStatus experimental
 */
export function SharingRings({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 230" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="Two overlapping rings showing selective sharing">
      <defs><filter id="sharing-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="16" stdDeviation="15" floodColor="#5e88dd" floodOpacity="0.2" /></filter></defs>
      <ellipse cx="160" cy="196" rx="98" ry="18" className="fill-purplelife-tint" />
      <g filter="url(#sharing-shadow)" fill="none" strokeWidth="34">
        <circle cx="126" cy="111" r="63" className="stroke-purplelife-accent" opacity="0.82" />
        <circle cx="194" cy="111" r="63" className="stroke-purplelife-blue" opacity="0.72" />
      </g>
      <path d="M150 111v-9c0-14 20-14 20 0v9" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <rect x="143" y="108" width="34" height="31" rx="8" fill="white" />
      <circle cx="160" cy="122" r="4" className="fill-purplelife-accent" /><path d="M160 125v6" className="stroke-purplelife-accent" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-medication-orbit
 * @ployComponentType component
 * @ployComponentDescription Calm medication schedule orbit showing recorded and upcoming doses.
 * @ployComponentTags purplelife mobile graphic medication
 * @ployComponentStatus experimental
 */
export function MedicationOrbit({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 240" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="Three medication markers moving around a daily orbit">
      <defs><radialGradient id="med-center" cx="36%" cy="27%"><stop offset="0" stopColor="white" /><stop offset="1" className="text-purplelife-mint" stopColor="currentColor" /></radialGradient></defs>
      <circle cx="160" cy="118" r="88" className="fill-purplelife-tint" />
      <circle cx="160" cy="118" r="70" fill="none" className="stroke-purplelife-accent" strokeWidth="2.5" strokeDasharray="4 9" opacity="0.42" />
      <circle cx="160" cy="118" r="42" fill="url(#med-center)" className="stroke-white" strokeWidth="5" />
      <rect x="145" y="106" width="30" height="24" rx="12" fill="white" transform="rotate(-35 160 118)" /><path d="M160 102v32" className="stroke-purplelife-accent" strokeWidth="2" transform="rotate(-35 160 118)" />
      <circle cx="160" cy="48" r="18" className="fill-purplelife-mint" /><circle cx="99" cy="153" r="18" className="fill-purplelife-blue" /><circle cx="221" cy="153" r="18" className="fill-purplelife-coral" />
      <path d="M153 48l5 5 9-10M92 153l5 5 9-10" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="221" cy="153" r="5" fill="white" />
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-privacy-shield
 * @ployComponentType component
 * @ployComponentDescription Soft privacy shield for account and sharing controls.
 * @ployComponentTags purplelife mobile graphic privacy settings
 * @ployComponentStatus experimental
 */
export function PrivacyShield({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 230" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="A soft layered shield representing privacy controls">
      <defs><linearGradient id="shield-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="text-purplelife-pink" stopColor="currentColor" /><stop offset="0.55" className="text-purplelife-accent" stopColor="currentColor" /><stop offset="1" className="text-purplelife-blue" stopColor="currentColor" /></linearGradient><filter id="shield-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#6c59d6" floodOpacity="0.24" /></filter></defs>
      <ellipse cx="160" cy="199" rx="84" ry="16" className="fill-purplelife-tint" />
      <path d="M160 25C195 46 226 48 246 49v59c0 56-32 91-86 112-54-21-86-56-86-112V49c20-1 51-3 86-24Z" fill="url(#shield-fill)" filter="url(#shield-shadow)" />
      <path d="M135 116l17 17 36-42" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M117 61c13-3 27-8 43-17" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.32" />
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-vital-wave
 * @ployComponentType component
 * @ployComponentDescription Layered vital signal wave for user-recorded measurements.
 * @ployComponentTags purplelife mobile graphic vitals
 * @ployComponentStatus experimental
 */
export function VitalWave({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 220" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="A colorful flowing line of recorded measurements">
      <rect width="320" height="220" rx="32" className="fill-purplelife-tint" />
      <path d="M20 132 C58 132 62 82 94 82s35 79 68 79 38-111 76-111 42 70 62 70" fill="none" className="stroke-purplelife-accent" strokeWidth="16" strokeLinecap="round" opacity="0.22" />
      <path d="M20 132 C58 132 62 82 94 82s35 79 68 79 38-111 76-111 42 70 62 70" fill="none" className="stroke-purplelife-blue" strokeWidth="6" strokeLinecap="round" />
      <g fill="white" className="stroke-purplelife-blue" strokeWidth="4"><circle cx="94" cy="82" r="10" /><circle cx="162" cy="161" r="10" /><circle cx="238" cy="50" r="10" /></g>
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-dna-ribbon
 * @ployComponentType component
 * @ployComponentDescription Abstract paired ribbon for connected genetic-data sources without implying interpretation.
 * @ployComponentTags purplelife mobile graphic dna privacy
 * @ployComponentStatus experimental
 */
export function DnaRibbon({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 230" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="Two colorful ribbons crossing through a series of connection points">
      <rect width="320" height="230" rx="32" className="fill-purplelife-tint" />
      <path d="M65 25C65 88 255 142 255 205" fill="none" className="stroke-purplelife-pink" strokeWidth="20" strokeLinecap="round" opacity="0.86" />
      <path d="M255 25C255 88 65 142 65 205" fill="none" className="stroke-purplelife-blue" strokeWidth="20" strokeLinecap="round" opacity="0.86" />
      {[48,82,116,150,184].map((y, index) => <line key={y} x1={index % 2 ? 101 : 82} y1={y} x2={index % 2 ? 219 : 238} y2={y} stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.85" />)}
    </svg>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-message-bubbles
 * @ployComponentType component
 * @ployComponentDescription Overlapping private message bubbles for caregiver conversations.
 * @ployComponentTags purplelife mobile graphic messages caregivers
 * @ployComponentStatus experimental
 */
export function MessageBubbles({ className = "" }: GraphicProps) {
  return (
    <svg viewBox="0 0 320 220" className={`purplelife-motion-graphic ${className}`} role="img" aria-label="Soft overlapping message bubbles">
      <ellipse cx="160" cy="194" rx="98" ry="16" className="fill-purplelife-tint" />
      <path d="M38 56c0-22 18-40 40-40h109c22 0 40 18 40 40v44c0 22-18 40-40 40h-62l-35 28 7-28H78c-22 0-40-18-40-40Z" className="fill-purplelife-accent" opacity="0.9" />
      <path d="M126 104c0-19 15-34 34-34h88c19 0 34 15 34 34v37c0 19-15 34-34 34h-19l5 24-30-24h-44c-19 0-34-15-34-34Z" className="fill-purplelife-blue" opacity="0.9" />
      <g fill="white" opacity="0.88"><circle cx="94" cy="81" r="7" /><circle cx="122" cy="81" r="7" /><circle cx="150" cy="81" r="7" /><circle cx="177" cy="123" r="6" /><circle cx="203" cy="123" r="6" /><circle cx="229" cy="123" r="6" /></g>
    </svg>
  );
}
