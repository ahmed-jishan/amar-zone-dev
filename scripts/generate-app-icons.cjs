const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const ROOT = process.cwd()
const SOURCE_ICON = path.join(ROOT, 'public', 'icons', 'app-icon.png')
const PUBLIC_ICONS = path.join(ROOT, 'public', 'icons')
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res')

const WEB_SIZES = [192, 512]
const ANDROID_SIZES = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
]

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function loadSourcePng() {
  if (!fs.existsSync(SOURCE_ICON)) {
    throw new Error(`Missing required app icon source: ${SOURCE_ICON}`)
  }
  return PNG.sync.read(fs.readFileSync(SOURCE_ICON))
}

function cropSquareRegion(source) {
  const side = Math.min(source.width, source.height)
  const left = Math.floor((source.width - side) / 2)
  const top = Math.floor((source.height - side) / 2)
  return { left, top, side }
}

function sampleBilinear(source, x, y) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = clamp(x0 + 1, 0, source.width - 1)
  const y1 = clamp(y0 + 1, 0, source.height - 1)
  const fx = x - x0
  const fy = y - y0

  const i00 = (clamp(y0, 0, source.height - 1) * source.width + clamp(x0, 0, source.width - 1)) * 4
  const i10 = (clamp(y0, 0, source.height - 1) * source.width + x1) * 4
  const i01 = (y1 * source.width + clamp(x0, 0, source.width - 1)) * 4
  const i11 = (y1 * source.width + x1) * 4

  const out = [0, 0, 0, 0]
  for (let c = 0; c < 4; c += 1) {
    const top = source.data[i00 + c] * (1 - fx) + source.data[i10 + c] * fx
    const bottom = source.data[i01 + c] * (1 - fx) + source.data[i11 + c] * fx
    out[c] = Math.round(top * (1 - fy) + bottom * fy)
  }
  return out
}

function resizeSquare(source, targetSize) {
  const { left, top, side } = cropSquareRegion(source)
  const out = new PNG({ width: targetSize, height: targetSize })
  const scale = side / targetSize

  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      const srcX = left + (x + 0.5) * scale - 0.5
      const srcY = top + (y + 0.5) * scale - 0.5
      const [r, g, b, a] = sampleBilinear(source, srcX, srcY)
      const idx = (y * targetSize + x) * 4
      out.data[idx] = r
      out.data[idx + 1] = g
      out.data[idx + 2] = b
      out.data[idx + 3] = a
    }
  }

  return out
}

function writePng(filePath, png) {
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

function makeIconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536">
  <image href="app-icon.png" width="1024" height="1536" preserveAspectRatio="xMidYMid slice"/>
</svg>
`
}

function writeIcons() {
  const source = loadSourcePng()
  ensureDir(PUBLIC_ICONS)
  fs.writeFileSync(path.join(PUBLIC_ICONS, 'icon.svg'), makeIconSvg())

  for (const size of WEB_SIZES) {
    writePng(path.join(PUBLIC_ICONS, `icon-${size}.png`), resizeSquare(source, size))
  }

  if (!fs.existsSync(ANDROID_RES)) return

  for (const [dir, size] of ANDROID_SIZES) {
    const outDir = path.join(ANDROID_RES, dir)
    ensureDir(outDir)
    const icon = resizeSquare(source, size)
    writePng(path.join(outDir, 'ic_launcher.png'), icon)
    writePng(path.join(outDir, 'ic_launcher_round.png'), icon)
    writePng(path.join(outDir, 'ic_launcher_foreground.png'), icon)
  }

  const drawableV24 = path.join(ANDROID_RES, 'drawable-v24')
  if (fs.existsSync(drawableV24)) {
    const strayPng = path.join(drawableV24, 'ic_launcher_foreground.png')
    if (fs.existsSync(strayPng)) {
      fs.unlinkSync(strayPng)
    }
  }

  const valuesDir = path.join(ANDROID_RES, 'values')
  ensureDir(valuesDir)
  fs.writeFileSync(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    '<resources><color name="ic_launcher_background">#05080F</color></resources>\n'
  )

  const adaptiveDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26')
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
console.log('App icons generated from public/icons/app-icon.png.')
