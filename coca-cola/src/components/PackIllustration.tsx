import { useId } from 'react'
import Can from './Can'
import type { Brand } from '../data/brands'

export type PackIllustrationProps = {
  pack: Brand['pack']
  /** Pack color */
  color: string
  /** Text color drawn on the pack */
  onColor: string
  /** Plain-text name printed on the pack */
  label: string
  className?: string
  /** CSS width. Height follows the 120:220 aspect ratio. */
  width?: number | string
}

/**
 * Generic, decorative pack silhouette (can, bottle or cup) with a brand name as plain text.
 * No logos: just a shape, a color and a word. Always aria-hidden; the card carries the name.
 */
export default function PackIllustration({ pack, color, onColor, label, className, width = 120 }: PackIllustrationProps) {
  const id = useId().replace(/:/g, '')

  if (pack === 'can') {
    return <Can bodyColor={color} accentColor={onColor} textColor={onColor} label={label} className={className} width={width} />
  }

  const shade = `pack-shade-${id}`
  // split multi-word names onto lines and size the text to fit the pack's label area
  const lines = label.split(' ')
  const longest = Math.max(...lines.map((l) => l.length))
  const fitText = (maxWidth: number, max: number) => Math.min(max, maxWidth / (0.62 * longest))
  const shading = (
    <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity="0.3" />
      <stop offset="0.2" stopColor="#fff" stopOpacity="0.3" />
      <stop offset="0.35" stopColor="#fff" stopOpacity="0.05" />
      <stop offset="0.75" stopColor="#000" stopOpacity="0.05" />
      <stop offset="1" stopColor="#000" stopOpacity="0.35" />
    </linearGradient>
  )
  const svgProps = {
    viewBox: '0 0 120 220',
    width,
    className,
    style: { height: 'auto', overflow: 'visible' as const },
    'aria-hidden': true as const,
    focusable: 'false' as const,
  }
  // thin outline keeps light packs visible on a same-colored panel
  const outline = { stroke: '#000', strokeOpacity: 0.25, strokeWidth: 1.5 }

  if (pack === 'cup') {
    const body = 'M20 58 H100 L90 204 Q60 210 30 204 Z'
    return (
      <svg {...svgProps}>
        <defs>{shading}</defs>
        <ellipse cx="60" cy="212" rx="38" ry="5" fill="#000" opacity="0.18" />
        <path d={body} fill={color} {...outline} />
        {/* sleeve */}
        <path d="M24 100 H96 L91 164 H29 Z" fill={onColor} opacity="0.18" />
        <path d={body} fill={`url(#${shade})`} />
        {/* lid */}
        <path d="M14 58 Q14 48 24 46 H96 Q106 48 106 58 Z" fill="#f4f1ec" {...outline} />
        <path d="M26 46 Q30 30 60 30 Q90 30 94 46 Z" fill="#e7e2da" {...outline} />
        <rect x="70" y="33" width="12" height="5" rx="2.5" fill="#bdb6ab" />
        <PackText lines={lines} cx={60} cy={132} fontSize={fitText(62, 17)} fill={onColor} />
      </svg>
    )
  }

  // bottle: long single words run up the bottle so they stay readable
  const vertical = lines.length === 1 && longest > 6
  const body =
    'M50 10 H70 V26 Q70 34 74 42 Q96 66 96 96 V198 Q96 208 86 208 H34 Q24 208 24 198 V96 Q24 66 46 42 Q50 34 50 26 Z'
  return (
    <svg {...svgProps}>
      <defs>{shading}</defs>
      <ellipse cx="60" cy="214" rx="38" ry="5" fill="#000" opacity="0.18" />
      <path d={body} fill={color} {...outline} />
      {/* label band */}
      {vertical ? (
        <rect x="46" y="88" width="28" height="116" rx="4" fill={onColor} opacity="0.16" />
      ) : (
        <rect x="24" y="112" width="72" height="54" fill={onColor} opacity="0.16" />
      )}
      <path d={body} fill={`url(#${shade})`} />
      {/* cap */}
      <rect x="47" y="2" width="26" height="14" rx="3" fill="#e9e9e9" {...outline} />
      {vertical ? (
        <g transform="rotate(-90 60 146)">
          <PackText lines={lines} cx={60} cy={146} fontSize={fitText(108, 20)} fill={onColor} />
        </g>
      ) : (
        <PackText lines={lines} cx={60} cy={139} fontSize={fitText(64, 17)} fill={onColor} />
      )}
    </svg>
  )
}

type PackTextProps = { lines: string[]; cx: number; cy: number; fontSize: number; fill: string }

/** Plain-text name, vertically centred on (cx, cy), one line per word. */
function PackText({ lines, cx, cy, fontSize, fill }: PackTextProps) {
  const lineH = fontSize * 1.1
  const top = cy - ((lines.length - 1) * lineH) / 2 + fontSize * 0.35
  return (
    <text
      textAnchor="middle" fill={fill}
      fontFamily="'Archivo', 'Inter', sans-serif" fontWeight="800" fontSize={fontSize}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={cx} y={top + i * lineH}>{line}</tspan>
      ))}
    </text>
  )
}
