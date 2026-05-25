const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const ROOT = process.cwd()
const PUBLIC_ICONS = path.join(ROOT, 'public', 'icons')

const WEB_SIZES = [192, 512]
const ANDROID_MIPMAPS = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
]

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function mix(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function blendPixel(data, index, color, alpha) {
  const inv = 1 - alpha
  data[index] = mix(data[index], color[0], alpha)
  data[index + 1] = mix(data[index + 1], color[1], alpha)
  data[index + 2] = mix(data[index + 2], color[2], alpha)
  data[index + 3] = Math.round(255 * (alpha + (data[index + 3] / 255) * inv))
}

function smoothstep(edge0, edge1, value) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

function roundedRectAlpha(x, y, w, h, r) {
  const qx = Math.abs(x - w / 2) - w / 2 + r
  const qy = Math.abs(y - h / 2) - h / 2 + r
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  const inside = Math.min(Math.max(qx, qy), 0)
  const dist = outside + inside - r
  return 1 - smoothstep(-1.5, 1.5, dist)
}

function lineDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)))
  const x = ax + abx * t
  const y = ay + aby * t
  return Math.hypot(px - x, py - y)
}

function arcAlpha(px, py, cx, cy, radius, width, start, end) {
  const angle = Math.atan2(py - cy, px - cx)
  const normalized = angle < 0 ? angle + Math.PI * 2 : angle
  const inArc = start < end ? normalized >= start && normalized <= end : normalized >= start || normalized <= end
  if (!inArc) return 0
  const dist = Math.abs(Math.hypot(px - cx, py - cy) - radius) - width / 2
  return 1 - smoothstep(-1.2, 1.2, dist)
}

function makeIcon(size, transparent = false) {
  const data = Buffer.alloc(size * size * 4)
  const pad = size * 0.05
  const inner = size - pad * 2
  const radius = size * 0.23

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4
      const nx = x / (size - 1)
      const ny = y / (size - 1)
      const a = transparent ? 0 : roundedRectAlpha(x - pad, y - pad, inner, inner, radius)
      const blue = [29, 78, 216]
      const violet = [99, 102, 241]
      const emerald = [16, 185, 129]
      const t = Math.min(1, Math.max(0, (nx * 0.7 + ny * 0.9)))
      const base = [
        mix(blue[0], violet[0], t),
        mix(blue[1], violet[1], t),
        mix(blue[2], violet[2], t),
      ]
      const glow = Math.max(0, 1 - Math.hypot(nx - 0.72, ny - 0.22) * 2.1)
      const color = [
        mix(base[0], emerald[0], glow * 0.55),
        mix(base[1], emerald[1], glow * 0.55),
        mix(base[2], emerald[2], glow * 0.55),
      ]
      data[i] = color[0]
      data[i + 1] = color[1]
      data[i + 2] = color[2]
      data[i + 3] = Math.round(a * 255)
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4
      const cx = size / 2
      const cy = size / 2
      const scale = size / 512
      const px = x
      const py = y
      const haloDist = Math.abs(Math.hypot(px - cx, py - cy) - size * 0.285)
      const haloA = (1 - smoothstep(0, size * 0.012, haloDist)) * 0.18
      blendPixel(data, i, [255, 255, 255], haloA)

      const top = arcAlpha(px, py, cx, cy - 44 * scale, 94 * scale, 52 * scale, Math.PI * 0.83, Math.PI * 2.04)
      const bottom = arcAlpha(px, py, cx, cy + 44 * scale, 94 * scale, 52 * scale, Math.PI * 1.83, Math.PI * 1.04)
      const bridge = 1 - smoothstep(-1.3, 1.3, lineDistance(px, py, cx + 66 * scale, cy - 58 * scale, cx - 66 * scale, cy + 58 * scale) - 27 * scale)
      const mark = Math.max(top, bottom, bridge)
      blendPixel(data, i, [255, 255, 255], mark * 0.96)

      const checkA = Math.max(
        1 - smoothstep(-1.2, 1.2, lineDistance(px, py, cx - 72 * scale, cy + 28 * scale, cx - 28 * scale, cy + 72 * scale) - 13 * scale),
        1 - smoothstep(-1.2, 1.2, lineDistance(px, py, cx - 28 * scale, cy + 72 * scale, cx + 82 * scale, cy - 46 * scale) - 13 * scale)
      )
      blendPixel(data, i, [16, 185, 129], checkA * 0.98)
    }
  }

  return encodePng(size, size, data)
}

function makeBackground(size) {
  const data = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4
      const t = (x / size) * 0.35 + (y / size) * 0.65
      data[i] = mix(29, 99, t)
      data[i + 1] = mix(78, 102, t)
      data[i + 2] = mix(216, 241, t)
      data[i + 3] = 255
    }
  }
  return encodePng(size, size, data)
}

function makeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="72" y1="32" x2="438" y2="480" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1d4ed8"/>
      <stop offset="0.55" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect x="24" y="24" width="464" height="464" rx="118" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="146" fill="none" stroke="white" stroke-opacity=".2" stroke-width="10"/>
  <path d="M174 184c31-43 128-45 161-2 23 30 6 74-44 85l-68 15c-48 10-65 55-37 84 34 36 134 31 165-13" fill="none" stroke="white" stroke-width="52" stroke-linecap="round"/>
  <path d="M184 284l44 44 108-116" fill="none" stroke="#10b981" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
}

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const name = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0)
  return Buffer.concat([len, name, data, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function writeIcons() {
  ensureDir(PUBLIC_ICONS)
  fs.writeFileSync(path.join(PUBLIC_ICONS, 'icon.svg'), makeSvg())
  for (const size of WEB_SIZES) {
    fs.writeFileSync(path.join(PUBLIC_ICONS, `icon-${size}.png`), makeIcon(size))
  }

  const resRoot = path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
  if (!fs.existsSync(resRoot)) return

  for (const [dir, size] of ANDROID_MIPMAPS) {
    const outDir = path.join(resRoot, dir)
    ensureDir(outDir)
    fs.writeFileSync(path.join(outDir, 'ic_launcher.png'), makeIcon(size))
    fs.writeFileSync(path.join(outDir, 'ic_launcher_round.png'), makeIcon(size))
    fs.writeFileSync(path.join(outDir, 'ic_launcher_foreground.png'), makeIcon(size, true))
  }

  const valuesDir = path.join(resRoot, 'values')
  ensureDir(valuesDir)
  const colorsPath = path.join(valuesDir, 'ic_launcher_background.xml')
  fs.writeFileSync(colorsPath, '<resources><color name="ic_launcher_background">#1D4ED8</color></resources>\n')

  const adaptiveDir = path.join(resRoot, 'mipmap-anydpi-v26')
  ensureDir(adaptiveDir)
  const adaptiveXml = `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`
  fs.writeFileSync(path.join(adaptiveDir, 'ic_launcher.xml'), adaptiveXml)
  fs.writeFileSync(path.join(adaptiveDir, 'ic_launcher_round.xml'), adaptiveXml)
}

writeIcons()
console.log('App icons generated.')
