import { cn } from "@/lib/utils"

/*
 * Illustrated bouquet placeholders.
 * Drawn in SVG so the storefront has a coherent visual language before
 * real product photography exists. Each variant is a deterministic
 * composition (no randomness -> identical server and client output).
 */

type Point = { x: number; y: number }

type Bloom =
  | { kind: "peony"; x: number; y: number; r: number; color: string; inner: string }
  | { kind: "rose"; x: number; y: number; r: number; color: string; inner: string }
  | { kind: "aster"; x: number; y: number; r: number; color: string; center: string }
  | { kind: "hydrangea"; x: number; y: number; r: number; color: string; inner: string }
  | { kind: "berries"; x: number; y: number; r: number; color: string }
  | { kind: "tulip"; x: number; y: number; r: number; color: string; inner: string }

type Foliage =
  | { kind: "eucalyptus"; to: Point; color: string }
  | { kind: "lagurus"; to: Point; color: string }
  | { kind: "leaf"; at: Point; angle: number; size: number; color: string }

type Composition = {
  background: string
  wrap: string
  wrapShade: string
  ribbon: string
  foliage: Foliage[]
  blooms: Bloom[]
}

const STEM = "#6d7c5f"
const LEAF = "#7f8f6c"
const LEAF_DARK = "#5f6f57"
const EUCALYPTUS = "#9db1a3"
const LAGURUS = "#efe4cf"
const GATHER: Point = { x: 100, y: 204 }

const MONO_LAYOUT = [
  { x: 100, y: 90, r: 1.1 },
  { x: 68, y: 106, r: 1 },
  { x: 132, y: 104, r: 1 },
  { x: 84, y: 134, r: 1 },
  { x: 118, y: 136, r: 1 },
  { x: 54, y: 144, r: 0.85 },
  { x: 148, y: 142, r: 0.85 },
  { x: 100, y: 118, r: 0.95 },
]

/** Builds a single-variety bouquet on a shared, balanced layout */
function mono(
  kind: "rose" | "peony" | "tulip",
  size: number,
  colors: [string, string][],
  frame: Pick<Composition, "background" | "wrap" | "wrapShade" | "ribbon">,
  foliage: Foliage[] = []
): Composition {
  return {
    ...frame,
    foliage,
    blooms: MONO_LAYOUT.map((p, i) => {
      const [color, inner] = colors[i % colors.length]
      return { kind, x: p.x, y: p.y - (kind === "tulip" ? 8 : 0), r: size * p.r, color, inner }
    }),
  }
}

const TULIP_LEAVES: Foliage[] = [
  { kind: "leaf", at: { x: 70, y: 178 }, angle: -24, size: 30, color: LEAF },
  { kind: "leaf", at: { x: 132, y: 176 }, angle: 26, size: 30, color: LEAF_DARK },
  { kind: "leaf", at: { x: 100, y: 176 }, angle: 4, size: 26, color: LEAF },
]

const compositions = {
  blush: {
    background: "#f3e3de",
    wrap: "#e8dac8",
    wrapShade: "#d9c8b2",
    ribbon: "#a5605b",
    foliage: [
      { kind: "eucalyptus", to: { x: 42, y: 78 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 162, y: 70 }, color: EUCALYPTUS },
      { kind: "lagurus", to: { x: 112, y: 48 }, color: LAGURUS },
      { kind: "leaf", at: { x: 52, y: 160 }, angle: -40, size: 16, color: LEAF },
      { kind: "leaf", at: { x: 150, y: 158 }, angle: 35, size: 15, color: LEAF_DARK },
    ],
    blooms: [
      { kind: "rose", x: 140, y: 92, r: 16, color: "#e8b4aa", inner: "#c98479" },
      { kind: "peony", x: 84, y: 108, r: 34, color: "#f0c7be", inner: "#d99b92" },
      { kind: "peony", x: 130, y: 132, r: 27, color: "#f6dcd5", inner: "#e2aea5" },
      { kind: "rose", x: 60, y: 146, r: 17, color: "#e8b4aa", inner: "#c98479" },
    ],
  },
  autumn: {
    background: "#eee5d6",
    wrap: "#d6c6a9",
    wrapShade: "#c4b192",
    ribbon: "#5f6f57",
    foliage: [
      { kind: "lagurus", to: { x: 66, y: 54 }, color: LAGURUS },
      { kind: "lagurus", to: { x: 138, y: 50 }, color: LAGURUS },
      { kind: "eucalyptus", to: { x: 166, y: 104 }, color: EUCALYPTUS },
      { kind: "leaf", at: { x: 46, y: 118 }, angle: -60, size: 17, color: LEAF },
    ],
    blooms: [
      { kind: "hydrangea", x: 82, y: 106, r: 32, color: "#c9b4c8", inner: "#a98ea9" },
      { kind: "aster", x: 130, y: 94, r: 16, color: "#9d7bb0", center: "#d8b25a" },
      { kind: "aster", x: 142, y: 136, r: 15, color: "#b596c2", center: "#d8b25a" },
      { kind: "aster", x: 58, y: 146, r: 14, color: "#9d7bb0", center: "#d8b25a" },
      { kind: "aster", x: 108, y: 146, r: 11, color: "#c8c26a", center: "#8b8a3c" },
    ],
  },
  ivory: {
    background: "#e6eadf",
    wrap: "#fbf7f0",
    wrapShade: "#ebe3d6",
    ribbon: "#c9d1bf",
    foliage: [
      { kind: "eucalyptus", to: { x: 48, y: 82 }, color: "#8fa391" },
      { kind: "leaf", at: { x: 156, y: 92 }, angle: 50, size: 18, color: LEAF },
      { kind: "leaf", at: { x: 150, y: 70 }, angle: 20, size: 14, color: LEAF_DARK },
      { kind: "leaf", at: { x: 46, y: 150 }, angle: -55, size: 15, color: LEAF },
    ],
    blooms: [
      { kind: "berries", x: 136, y: 80, r: 16, color: "#f4efe4" },
      { kind: "rose", x: 94, y: 100, r: 27, color: "#fbf5ec", inner: "#e2d4bf" },
      { kind: "rose", x: 132, y: 130, r: 22, color: "#f6eee2", inner: "#dccbb2" },
      { kind: "rose", x: 64, y: 136, r: 20, color: "#fbf5ec", inner: "#e2d4bf" },
    ],
  },
  berry: {
    background: "#f3dcdb",
    wrap: "#f8efea",
    wrapShade: "#ead9d2",
    ribbon: "#8e2f3c",
    foliage: [
      { kind: "eucalyptus", to: { x: 160, y: 76 }, color: EUCALYPTUS },
      { kind: "leaf", at: { x: 44, y: 108 }, angle: -50, size: 17, color: LEAF },
      { kind: "leaf", at: { x: 154, y: 156 }, angle: 40, size: 14, color: LEAF_DARK },
    ],
    blooms: [
      { kind: "berries", x: 70, y: 76, r: 13, color: "#8e2f3c" },
      { kind: "rose", x: 94, y: 104, r: 23, color: "#dd8292", inner: "#b75567" },
      { kind: "rose", x: 130, y: 94, r: 17, color: "#e7a2ac", inner: "#c7707e" },
      { kind: "aster", x: 60, y: 130, r: 16, color: "#b84d66", center: "#7a2536" },
      { kind: "rose", x: 122, y: 138, r: 20, color: "#e7a2ac", inner: "#c7707e" },
      { kind: "berries", x: 150, y: 124, r: 12, color: "#8e2f3c" },
    ],
  },
  garden: {
    background: "#ecefe6",
    wrap: "#fffdf8",
    wrapShade: "#eee7db",
    ribbon: "#ebcfc9",
    foliage: [
      { kind: "eucalyptus", to: { x: 38, y: 92 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 166, y: 84 }, color: EUCALYPTUS },
      { kind: "lagurus", to: { x: 122, y: 46 }, color: LAGURUS },
      { kind: "leaf", at: { x: 60, y: 70 }, angle: -20, size: 15, color: LEAF },
    ],
    blooms: [
      { kind: "peony", x: 98, y: 98, r: 32, color: "#f8f0e6", inner: "#e8d6c1" },
      { kind: "rose", x: 64, y: 134, r: 19, color: "#f0c7be", inner: "#d99b92" },
      { kind: "rose", x: 136, y: 128, r: 20, color: "#f0c7be", inner: "#d99b92" },
      { kind: "berries", x: 102, y: 146, r: 11, color: "#f4efe4" },
    ],
  },
  meadow: {
    background: "#eef0e4",
    wrap: "#e9dfcc",
    wrapShade: "#d9ccb4",
    ribbon: "#a5605b",
    foliage: [
      { kind: "lagurus", to: { x: 60, y: 60 }, color: LAGURUS },
      { kind: "lagurus", to: { x: 104, y: 44 }, color: LAGURUS },
      { kind: "lagurus", to: { x: 150, y: 62 }, color: LAGURUS },
      { kind: "leaf", at: { x: 44, y: 130 }, angle: -55, size: 16, color: LEAF },
      { kind: "leaf", at: { x: 160, y: 120 }, angle: 50, size: 15, color: LEAF_DARK },
    ],
    blooms: [
      { kind: "aster", x: 80, y: 100, r: 17, color: "#f7f3ea", center: "#d8b25a" },
      { kind: "aster", x: 124, y: 92, r: 15, color: "#c7b3d6", center: "#d8b25a" },
      { kind: "aster", x: 104, y: 126, r: 16, color: "#f7f3ea", center: "#d8b25a" },
      { kind: "aster", x: 64, y: 140, r: 14, color: "#b596c2", center: "#d8b25a" },
      { kind: "aster", x: 142, y: 134, r: 14, color: "#f7f3ea", center: "#d8b25a" },
      { kind: "berries", x: 138, y: 110, r: 10, color: "#c8c26a" },
    ],
  },
  peach: {
    background: "#f6e6da",
    wrap: "#efe3d3",
    wrapShade: "#dfcfba",
    ribbon: "#5f6f57",
    foliage: [
      { kind: "eucalyptus", to: { x: 40, y: 86 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 164, y: 90 }, color: EUCALYPTUS },
      { kind: "lagurus", to: { x: 96, y: 46 }, color: LAGURUS },
    ],
    blooms: [
      { kind: "rose", x: 88, y: 100, r: 24, color: "#f3c3a6", inner: "#d9916c" },
      { kind: "aster", x: 130, y: 96, r: 16, color: "#e8a77e", center: "#8b5a3c" },
      { kind: "peony", x: 124, y: 134, r: 24, color: "#f7d7c3", inner: "#e2a88a" },
      { kind: "rose", x: 64, y: 140, r: 18, color: "#f0b99a", inner: "#cf8763" },
      { kind: "berries", x: 150, y: 120, r: 10, color: "#b86a4d" },
    ],
  },
  "rose-red": mono(
    "rose",
    19,
    [["#b3303f", "#7f1d2a"], ["#c23a4a", "#8a2331"]],
    { background: "#f1e3de", wrap: "#1f2a22", wrapShade: "#141c16", ribbon: "#ebcfc9" },
    [{ kind: "leaf", at: { x: 46, y: 162 }, angle: -50, size: 16, color: LEAF_DARK }]
  ),
  "rose-cream": mono(
    "rose",
    20,
    [["#f8ead3", "#dcc39c"], ["#f3dcc0", "#d4b48a"]],
    { background: "#eceee4", wrap: "#fffaf2", wrapShade: "#ece2d3", ribbon: "#5f6f57" },
    [
      { kind: "eucalyptus", to: { x: 38, y: 90 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 164, y: 84 }, color: EUCALYPTUS },
    ]
  ),
  "rose-spray": mono(
    "rose",
    14,
    [["#e7a2ac", "#c7707e"], ["#dd8292", "#b75567"], ["#f0c1c6", "#d38f99"]],
    { background: "#f5e3e1", wrap: "#fbf3ee", wrapShade: "#ecdcd3", ribbon: "#8e2f3c" },
    [{ kind: "leaf", at: { x: 150, y: 164 }, angle: 40, size: 15, color: LEAF }]
  ),
  "peony-pink": mono(
    "peony",
    24,
    [["#f0c7be", "#d99b92"], ["#f6dcd5", "#e2aea5"]],
    { background: "#f4e5e0", wrap: "#ebe0d0", wrapShade: "#dccdb7", ribbon: "#a5605b" }
  ),
  "peony-coral": mono(
    "peony",
    23,
    [["#f3a88f", "#d9745a"], ["#f7c2a8", "#e0927a"]],
    { background: "#f5e4d8", wrap: "#fbf5ec", wrapShade: "#ebdfcf", ribbon: "#5f6f57" },
    [{ kind: "eucalyptus", to: { x: 40, y: 84 }, color: EUCALYPTUS }]
  ),
  "peony-white": mono(
    "peony",
    24,
    [["#fbf6ee", "#e8dac6"], ["#f5eee2", "#e2d2bb"]],
    { background: "#e8ece2", wrap: "#e9dfcc", wrapShade: "#d9ccb4", ribbon: "#c9d1bf" },
    [
      { kind: "eucalyptus", to: { x: 38, y: 92 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 166, y: 86 }, color: EUCALYPTUS },
    ]
  ),
  "tulip-pink": mono(
    "tulip",
    15,
    [["#f0a8b6", "#d9788c"], ["#f6c5cf", "#e39aa8"]],
    { background: "#f4e4e2", wrap: "#f6ede4", wrapShade: "#e7d9c9", ribbon: "#5f6f57" },
    TULIP_LEAVES
  ),
  "tulip-white": mono(
    "tulip",
    15,
    [["#fbf7ef", "#e6dccb"], ["#f4efe4", "#ddd1bd"]],
    { background: "#e7ebe1", wrap: "#e9dfcc", wrapShade: "#d9ccb4", ribbon: "#a5605b" },
    [...TULIP_LEAVES, { kind: "eucalyptus", to: { x: 36, y: 96 }, color: EUCALYPTUS }]
  ),
  hydrangea: {
    background: "#e9ece4",
    wrap: "#d9d4c8",
    wrapShade: "#c7c1b3",
    ribbon: "#5f6f57",
    foliage: [
      { kind: "leaf", at: { x: 52, y: 150 }, angle: -60, size: 20, color: LEAF },
      { kind: "leaf", at: { x: 150, y: 150 }, angle: 60, size: 20, color: LEAF_DARK },
    ],
    blooms: [
      { kind: "hydrangea", x: 78, y: 116, r: 32, color: "#dfe3d3", inner: "#b8c2a6" },
      { kind: "hydrangea", x: 124, y: 110, r: 34, color: "#d6dfe8", inner: "#a9b8c8" },
      { kind: "hydrangea", x: 104, y: 146, r: 26, color: "#e9dfe6", inner: "#c7b4c2" },
    ],
  },
  hero: {
    background: "#f4e6e1",
    wrap: "#ebe0d0",
    wrapShade: "#dccdb7",
    ribbon: "#5f6f57",
    foliage: [
      { kind: "eucalyptus", to: { x: 30, y: 96 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 172, y: 70 }, color: EUCALYPTUS },
      { kind: "eucalyptus", to: { x: 60, y: 42 }, color: "#8fa391" },
      { kind: "lagurus", to: { x: 124, y: 34 }, color: LAGURUS },
      { kind: "lagurus", to: { x: 150, y: 48 }, color: LAGURUS },
      { kind: "leaf", at: { x: 40, y: 150 }, angle: -50, size: 18, color: LEAF },
      { kind: "leaf", at: { x: 164, y: 148 }, angle: 45, size: 17, color: LEAF_DARK },
    ],
    blooms: [
      { kind: "hydrangea", x: 136, y: 96, r: 26, color: "#dfe3d3", inner: "#b8c2a6" },
      { kind: "berries", x: 78, y: 70, r: 13, color: "#f4efe4" },
      { kind: "peony", x: 86, y: 108, r: 34, color: "#f0c7be", inner: "#d99b92" },
      { kind: "rose", x: 144, y: 136, r: 20, color: "#fbf5ec", inner: "#e2d4bf" },
      { kind: "peony", x: 110, y: 146, r: 22, color: "#f8f0e6", inner: "#e8d6c1" },
      { kind: "rose", x: 58, y: 148, r: 18, color: "#e8b4aa", inner: "#c98479" },
    ],
  },
} satisfies Record<string, Composition>

export type FlowerArtVariant = keyof typeof compositions

function polar(cx: number, cy: number, radius: number, angleDeg: number): Point {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

function stemPath(to: Point) {
  const cx = round((to.x + GATHER.x) / 2 + (to.x < GATHER.x ? 8 : -8))
  const cy = round((to.y + GATHER.y) / 2 + 10)
  return `M${GATHER.x} ${GATHER.y} Q${cx} ${cy} ${to.x} ${to.y}`
}

function Petals({
  cx,
  cy,
  count,
  distance,
  rx,
  ry,
  fill,
  offset = 0,
  opacity = 1,
}: {
  cx: number
  cy: number
  count: number
  distance: number
  rx: number
  ry: number
  fill: string
  offset?: number
  opacity?: number
}) {
  return (
    <g fill={fill} opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const angle = offset + (360 / count) * i
        const p = polar(cx, cy, distance, angle)
        return (
          <ellipse
            key={i}
            cx={round(p.x)}
            cy={round(p.y)}
            rx={round(rx)}
            ry={round(ry)}
            transform={`rotate(${round(angle + 90)} ${round(p.x)} ${round(p.y)})`}
          />
        )
      })}
    </g>
  )
}

function BloomShape({ bloom }: { bloom: Bloom }) {
  const { x, y, r } = bloom
  switch (bloom.kind) {
    case "peony":
      return (
        <g>
          <Petals cx={x} cy={y} count={9} distance={r * 0.5} rx={r * 0.46} ry={r * 0.56} fill={bloom.color} />
          <Petals cx={x} cy={y} count={7} distance={r * 0.28} rx={r * 0.34} ry={r * 0.42} fill={bloom.inner} offset={20} opacity={0.55} />
          <Petals cx={x} cy={y} count={5} distance={r * 0.12} rx={r * 0.24} ry={r * 0.3} fill={bloom.color} offset={8} />
          <circle cx={x} cy={y} r={r * 0.14} fill={bloom.inner} />
        </g>
      )
    case "rose":
      return (
        <g>
          <circle cx={x} cy={y} r={r} fill={bloom.color} />
          {[0.78, 0.56, 0.36, 0.18].map((k, i) => {
            const rr = r * k
            const circumference = 2 * Math.PI * rr
            return (
              <circle
                key={k}
                cx={x + (i % 2 ? 1 : -1) * r * 0.04}
                cy={y}
                r={round(rr)}
                fill="none"
                stroke={bloom.inner}
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeDasharray={`${round(circumference * 0.62)} ${round(circumference)}`}
                transform={`rotate(${i * 95} ${x} ${y})`}
                opacity={0.8}
              />
            )
          })}
        </g>
      )
    case "aster":
      return (
        <g>
          <Petals cx={x} cy={y} count={16} distance={r * 0.55} rx={r * 0.13} ry={r * 0.46} fill={bloom.color} />
          <circle cx={x} cy={y} r={r * 0.3} fill={bloom.center} />
        </g>
      )
    case "hydrangea":
      return (
        <g>
          <circle cx={x} cy={y} r={r} fill={bloom.inner} opacity={0.35} />
          {Array.from({ length: 16 }, (_, i) => {
            const angle = i * 137.5
            const p = polar(x, y, r * 0.78 * Math.sqrt((i + 0.5) / 16), angle)
            const s = r * 0.17
            return (
              <g key={i}>
                <Petals cx={p.x} cy={p.y} count={4} distance={s * 0.7} rx={s * 0.62} ry={s * 0.7} fill={bloom.color} offset={angle} />
                <circle cx={round(p.x)} cy={round(p.y)} r={round(s * 0.22)} fill={bloom.inner} />
              </g>
            )
          })}
        </g>
      )
    case "tulip":
      return (
        <g>
          <ellipse cx={x - r * 0.32} cy={y + r * 0.08} rx={r * 0.46} ry={r * 0.78} fill={bloom.inner} transform={`rotate(-14 ${x} ${y})`} />
          <ellipse cx={x + r * 0.32} cy={y + r * 0.08} rx={r * 0.46} ry={r * 0.78} fill={bloom.inner} transform={`rotate(14 ${x} ${y})`} />
          <ellipse cx={x} cy={y} rx={r * 0.46} ry={r * 0.86} fill={bloom.color} />
        </g>
      )
    case "berries":
      return (
        <g fill={bloom.color}>
          {Array.from({ length: 7 }, (_, i) => {
            const p = i === 0 ? { x, y } : polar(x, y, r * 0.62, i * 60 + 10)
            return <circle key={i} cx={round(p.x)} cy={round(p.y)} r={round(r * 0.3)} />
          })}
        </g>
      )
  }
}

function FoliageShape({ item }: { item: Foliage }) {
  switch (item.kind) {
    case "eucalyptus": {
      const leaves = [0.25, 0.4, 0.55, 0.7, 0.85, 1]
      return (
        <g>
          <path d={stemPath(item.to)} stroke={STEM} strokeWidth={1.4} fill="none" />
          {leaves.map((t, i) => {
            const px = GATHER.x + (item.to.x - GATHER.x) * t
            const py = GATHER.y + (item.to.y - GATHER.y) * t
            const side = i % 2 ? 1 : -1
            return (
              <circle
                key={t}
                cx={round(px + side * 6)}
                cy={round(py + 2)}
                r={round(4 + t * 3)}
                fill={item.color}
              />
            )
          })}
        </g>
      )
    }
    case "lagurus":
      return (
        <g>
          <path d={stemPath(item.to)} stroke={STEM} strokeWidth={1.1} fill="none" />
          <ellipse cx={item.to.x} cy={item.to.y} rx={5} ry={10} fill={item.color} />
        </g>
      )
    case "leaf": {
      const { at, size } = item
      return (
        <path
          d={`M${at.x} ${at.y} q${size * 0.5} ${-size * 0.55} 0 ${-size * 1.4} q${-size * 0.5} ${size * 0.85} 0 ${size * 1.4}z`}
          fill={item.color}
          transform={`rotate(${item.angle} ${at.x} ${at.y})`}
        />
      )
    }
  }
}

export type FlowerArtContainer = "wrap" | "box" | "vase"
export type ArtView = "full" | "close" | "base"

/** Crops of the 200x250 artboard used for gallery angles */
export const ART_VIEWBOX: Record<ArtView, string> = {
  full: "0 0 200 250",
  close: "30 40 140 175",
  base: "36 105 128 160",
}

/** Lifts the arrangement so it sits in a box or vase instead of paper */
const CONTAINER_TRANSFORM: Record<FlowerArtContainer, string | undefined> = {
  wrap: undefined,
  box: "translate(100 172) scale(1.12) translate(-100 -152)",
  vase: "translate(0 8)",
}

function Container({ type, c }: { type: FlowerArtContainer; c: Composition }) {
  switch (type) {
    case "wrap":
      return (
        <g>
          <path d="M54 166 L100 160 L146 166 L114 252 L86 252 Z" fill={c.wrap} />
          <path d="M100 160 L146 166 L114 252 L104 252 Z" fill={c.wrapShade} />
          <path d="M92 202 h16 v6 h-16z" fill={c.ribbon} />
        </g>
      )
    case "box":
      return (
        <g>
          <path d="M44 176 A56 11 0 0 0 156 176 L156 238 A56 11 0 0 1 44 238 Z" fill={c.wrap} />
          <path d="M122 185 A56 11 0 0 0 156 176 L156 238 A56 11 0 0 1 122 247 Z" fill={c.wrapShade} opacity={0.7} />
          <path d="M44 204 A56 11 0 0 0 156 204 L156 212 A56 11 0 0 1 44 212 Z" fill={c.ribbon} />
        </g>
      )
    case "vase":
      return (
        <g>
          <path
            d="M88 176 C88 190 60 198 60 222 C60 240 76 250 100 250 C124 250 140 240 140 222 C140 198 112 190 112 176 Z"
            fill={c.wrap}
          />
          <path d="M112 176 C112 190 140 198 140 222 C140 240 124 250 106 250 C122 240 126 214 112 190 Z" fill={c.wrapShade} />
          <ellipse cx={100} cy={176} rx={12} ry={3} fill={c.wrapShade} />
        </g>
      )
  }
}

type FlowerArtProps = {
  variant: FlowerArtVariant
  container?: FlowerArtContainer
  view?: ArtView
  className?: string
  /** Accessible description; omit for purely decorative usage */
  label?: string
}

export function FlowerArt({ variant, container = "wrap", view = "full", className, label }: FlowerArtProps) {
  const c: Composition = compositions[variant]

  return (
    <svg
      viewBox={ART_VIEWBOX[view]}
      preserveAspectRatio="xMidYMax slice"
      className={cn("block size-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect x="-20" y="-20" width="240" height="290" fill={c.background} />
      {container === "box" ? (
        <ellipse cx={100} cy={176} rx={56} ry={11} fill={c.wrapShade} />
      ) : null}
      <g transform={CONTAINER_TRANSFORM[container]}>
        {container !== "box"
          ? c.blooms.map((b, i) => (
              <path key={i} d={stemPath({ x: b.x, y: b.y })} stroke={STEM} strokeWidth={1.8} fill="none" />
            ))
          : null}
        {c.foliage.map((f, i) => (
          <FoliageShape key={i} item={f} />
        ))}
        {c.blooms.map((b, i) => (
          <BloomShape key={i} bloom={b} />
        ))}
      </g>
      <Container type={container} c={c} />
    </svg>
  )
}
