import { useId } from 'react'

export type CanProps = {
  /** Main can color */
  bodyColor: string
  /** Ribbon wave color */
  accentColor?: string
  /** Wordmark color */
  textColor?: string
  /** Script wordmark on the can */
  label?: string
  /** Small caps line under the wordmark, e.g. "ZERO SUGAR" */
  sublabel?: string
  /** Accessible name. If omitted, the can is decorative (aria-hidden). */
  title?: string
  className?: string
  /** CSS width. Height follows the 120:220 aspect ratio. */
  width?: number | string
}

/**
 * Parametric, generic drink-can illustration (viewBox 120×220).
 * It is used everywhere a can appears (wheel, flavor hero, making animation), so keep the API stable.
 */
export default function Can({
  bodyColor,
  accentColor = '#FFFFFF',
  textColor = '#FFFFFF',
  label = 'Coca-Cola',
  sublabel,
  title,
  className,
  width = 120,
}: CanProps) {
  const id = useId().replace(/:/g, '')
  const shade = `can-shade-${id}`
  const metal = `can-metal-${id}`
  const clip = `can-clip-${id}`

  return (
    <svg
      viewBox="0 0 120 220"
      width={width}
      className={className}
      style={{ height: 'auto', overflow: 'visible' }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* horizontal light → dark shading makes the flat body read as a cylinder */}
        <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.32" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={metal} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7d838b" />
          <stop offset="0.25" stopColor="#eef0f2" />
          <stop offset="0.55" stopColor="#b9bec5" />
          <stop offset="1" stopColor="#6f757d" />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M14 26 Q14 18 22 16 H98 Q106 18 106 26 V194 Q106 202 98 204 H22 Q14 202 14 194 Z" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="60" cy="214" rx="44" ry="5" fill="#000" opacity="0.18" />

      {/* bottom rim */}
      <path d="M18 196 H102 L98 208 Q60 214 22 208 Z" fill={`url(#${metal})`} />

      {/* body */}
      <g clipPath={`url(#${clip})`}>
        <rect x="10" y="10" width="100" height="200" fill={bodyColor} />
        {/* ribbon wave */}
        <path d="M10 138 C40 112 70 162 110 128 V144 C70 178 40 128 10 154 Z" fill={accentColor} opacity="0.95" />
        <path d="M10 160 C40 136 72 182 110 150 V154 C72 186 40 140 10 164 Z" fill={accentColor} opacity="0.55" />
        <rect x="10" y="10" width="100" height="200" fill={`url(#${shade})`} />
      </g>

      {/* wordmark */}
      <text
        x="60"
        y="92"
        textAnchor="middle"
        fontFamily="'Leckerli One', 'Brush Script MT', cursive"
        fontSize={Math.min(22, 190 / Math.max(label.length, 1))}
        fill={textColor}
        transform="rotate(-8 60 92)"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x="60"
          y="114"
          textAnchor="middle"
          fontFamily="'Archivo', 'Inter', sans-serif"
          fontWeight="800"
          fontSize="9"
          letterSpacing="1.5"
          fill={textColor}
        >
          {sublabel.toUpperCase()}
        </text>
      )}

      {/* top: shoulder, lid and tab */}
      <path d="M22 16 L26 6 H94 L98 16 Z" fill={`url(#${metal})`} />
      <ellipse cx="60" cy="6" rx="34" ry="4" fill="#d7dade" stroke="#8b9097" strokeWidth="1" />
      <ellipse cx="60" cy="6" rx="28" ry="2.6" fill="#c3c7cc" />
      <rect x="52" y="3.4" width="16" height="4.6" rx="2.3" fill="#9aa0a7" />
      <circle cx="56" cy="5.7" r="1.3" fill="#6f757d" />
    </svg>
  )
}
