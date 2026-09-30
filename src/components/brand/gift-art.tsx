import { ART_VIEWBOX, type ArtView } from "@/components/brand/flower-art"
import { cn } from "@/lib/utils"

/* Illustrated placeholders for non-floral gifts, on the same 200x250 artboard */

export type GiftArtVariant = "candle" | "vase" | "chocolate"

const backgrounds: Record<GiftArtVariant, string> = {
  candle: "#efe6da",
  vase: "#e8ece2",
  chocolate: "#f3e3de",
}

function Candle() {
  return (
    <g>
      <ellipse cx={100} cy={228} rx={52} ry={8} fill="#000" opacity={0.06} />
      <path d="M62 128 h76 v92 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8z" fill="#c9b8a4" opacity={0.55} />
      <path d="M66 140 h68 v76 a6 6 0 0 1 -6 6 h-56 a6 6 0 0 1 -6 -6z" fill="#f7efe3" />
      <rect x={74} y={162} width={52} height={34} rx={2} fill="#2e3b2b" />
      <path d="M86 176 h28 M90 184 h20" stroke="#ebcfc9" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M100 140 v-10" stroke="#3a332c" strokeWidth={1.6} />
      <path d="M100 104 C92 116 94 126 100 130 C106 126 108 116 100 104z" fill="#e9b872" />
      <path d="M100 114 C97 120 98 125 100 127 C102 125 103 120 100 114z" fill="#fbf1d8" />
    </g>
  )
}

function Vase() {
  return (
    <g>
      <ellipse cx={100} cy={232} rx={50} ry={8} fill="#000" opacity={0.06} />
      <path d="M100 150 C96 110 80 80 66 58" stroke="#8a7b62" strokeWidth={1.4} fill="none" />
      <path d="M102 150 C106 104 124 74 142 52" stroke="#8a7b62" strokeWidth={1.4} fill="none" />
      <ellipse cx={66} cy={56} rx={6} ry={12} fill="#efe4cf" transform="rotate(-30 66 56)" />
      <ellipse cx={142} cy={50} rx={6} ry={12} fill="#efe4cf" transform="rotate(35 142 50)" />
      <circle cx={112} cy={86} r={7} fill="#e6dcc8" />
      <path d="M112 93 C108 120 104 136 101 150" stroke="#8a7b62" strokeWidth={1.2} fill="none" />
      <path
        d="M86 142 C86 158 58 170 58 198 C58 220 76 232 100 232 C124 232 142 220 142 198 C142 170 114 158 114 142 Z"
        fill="#d9d2c3"
      />
      <path d="M114 142 C114 158 142 170 142 198 C142 220 124 232 106 232 C124 220 130 186 114 160 Z" fill="#c6bda9" />
      <path d="M68 196 C84 204 116 204 132 196" stroke="#a5605b" strokeWidth={1.2} fill="none" opacity={0.6} />
      <ellipse cx={100} cy={142} rx={14} ry={3.5} fill="#bfb49e" />
    </g>
  )
}

function Chocolate() {
  const cells = Array.from({ length: 9 }, (_, i) => ({ x: 70 + (i % 3) * 30, y: 132 + Math.floor(i / 3) * 30 }))
  const fills = ["#5a3a2e", "#7a4e3a", "#e9d9c4"]
  return (
    <g>
      <ellipse cx={100} cy={226} rx={64} ry={8} fill="#000" opacity={0.06} />
      <rect x={46} y={108} width={108} height={112} rx={6} fill="#2e3b2b" />
      <rect x={52} y={114} width={96} height={100} rx={3} fill="#f6ede4" />
      {cells.map((cell, i) => (
        <g key={i}>
          <rect x={cell.x - 12} y={cell.y - 12} width={24} height={24} rx={4} fill="#eadccd" />
          <circle cx={cell.x} cy={cell.y} r={9} fill={fills[i % 3]} />
          <path d={`M${cell.x - 4} ${cell.y - 3} q4 -3 8 0`} stroke="#ebcfc9" strokeWidth={1} fill="none" opacity={0.8} />
        </g>
      ))}
      <path d="M148 108 L162 96 L162 206 L154 220" fill="#243022" />
    </g>
  )
}

type GiftArtProps = {
  variant: GiftArtVariant
  view?: ArtView
  className?: string
  label?: string
}

export function GiftArt({ variant, view = "full", className, label }: GiftArtProps) {
  return (
    <svg
      viewBox={ART_VIEWBOX[view]}
      preserveAspectRatio="xMidYMax slice"
      className={cn("block size-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect x="-20" y="-20" width="240" height="290" fill={backgrounds[variant]} />
      {variant === "candle" ? <Candle /> : null}
      {variant === "vase" ? <Vase /> : null}
      {variant === "chocolate" ? <Chocolate /> : null}
    </svg>
  )
}
