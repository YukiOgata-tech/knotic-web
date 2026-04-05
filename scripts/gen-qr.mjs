/**
 * knotic QRコード生成スクリプト
 * - URL: https://knotic.make-it-tech.com
 * - カラー: サイトカラー（cyan #0891b2 × dark navy #0f172a）
 * - 中央: knotic-square-logo.png
 * - 出力: public/images/qr-knotic.png
 */
import QRCode from "qrcode"
import sharp from "sharp"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const URL_TARGET = "https://knotic.make-it-tech.com"
const OUTPUT_PATH = path.join(ROOT, "public/images/qr-knotic.png")
const LOGO_PATH = path.join(ROOT, "public/images/knotic-square-logo.png")

// QRコードサイズ設定
const QR_SIZE = 600       // 最終画像サイズ (px)
const MARGIN = 32         // 余白 (px)
const LOGO_RATIO = 0.22   // ロゴがQR全体に占める割合

// サイトカラー
const COLOR_DARK = "#0f172a"   // navy (背景)
const COLOR_CYAN = "#0891b2"   // cyan (モジュール)
const COLOR_LIGHT = "#e0f9ff"  // 明るい cyan tint (明るいモジュール)

async function generateQR() {
  console.log("Generating QR code SVG...")

  // QRコードをSVGとして生成（高品質・ベクター）
  const svgString = await QRCode.toString(URL_TARGET, {
    type: "svg",
    width: QR_SIZE,
    margin: 0,
    errorCorrectionLevel: "H", // 高エラー訂正（ロゴで一部隠れてもOK）
    color: {
      dark: COLOR_CYAN,
      light: "#00000000", // 透明
    },
  })

  // SVGを暗い背景にレンダリング
  // SVG → PNG (sharp)
  const qrBuffer = Buffer.from(svgString)

  console.log("Rendering QR to PNG with dark background...")

  // QRコード本体（丸みをつけた背景付き）
  const innerSize = QR_SIZE - MARGIN * 2
  const qrPng = await sharp(qrBuffer)
    .resize(innerSize, innerSize)
    .toBuffer()

  // 背景: 角丸の dark navy カード
  const borderRadius = 40
  const bgSvg = `
    <svg width="${QR_SIZE}" height="${QR_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="60%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#164e63"/>
        </linearGradient>
        <!-- 外枠グロー -->
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- 背景 -->
      <rect width="${QR_SIZE}" height="${QR_SIZE}" rx="${borderRadius}" ry="${borderRadius}" fill="url(#bg)"/>
      <!-- 外枠 cyan ライン -->
      <rect
        x="6" y="6"
        width="${QR_SIZE - 12}" height="${QR_SIZE - 12}"
        rx="${borderRadius - 4}" ry="${borderRadius - 4}"
        fill="none"
        stroke="#0891b2"
        stroke-width="3"
        opacity="0.6"
      />
      <!-- 内側サブライン -->
      <rect
        x="14" y="14"
        width="${QR_SIZE - 28}" height="${QR_SIZE - 28}"
        rx="${borderRadius - 8}" ry="${borderRadius - 8}"
        fill="none"
        stroke="#22d3ee"
        stroke-width="1"
        opacity="0.3"
      />
    </svg>
  `

  const bgBuffer = await sharp(Buffer.from(bgSvg))
    .png()
    .toBuffer()

  console.log("Compositing QR onto background...")

  // QRコードを背景に重ねる
  const withQR = await sharp(bgBuffer)
    .composite([
      {
        input: qrPng,
        left: MARGIN,
        top: MARGIN,
        blend: "over",
      },
    ])
    .toBuffer()

  // ロゴサイズ計算
  const logoSize = Math.round(QR_SIZE * LOGO_RATIO)
  const logoOffset = Math.round((QR_SIZE - logoSize) / 2)

  console.log(`Processing logo (${logoSize}x${logoSize})...`)

  // ロゴ処理: 角丸マスク + cyan ボーダー + 白背景
  const logoPadding = 10
  const logoInner = logoSize - logoPadding * 2
  const logoRadius = Math.round(logoSize * 0.22)

  // ロゴ周囲のフレーム SVG（白い背景 + cyan ボーダー）
  const logoFrameSvg = `
    <svg width="${logoSize}" height="${logoSize}" xmlns="http://www.w3.org/2000/svg">
      <!-- 外側グロー -->
      <rect
        x="2" y="2"
        width="${logoSize - 4}" height="${logoSize - 4}"
        rx="${logoRadius + 3}" ry="${logoRadius + 3}"
        fill="#0891b2"
        opacity="0.5"
      />
      <!-- 白背景 -->
      <rect
        x="5" y="5"
        width="${logoSize - 10}" height="${logoSize - 10}"
        rx="${logoRadius}" ry="${logoRadius}"
        fill="white"
      />
    </svg>
  `

  const logoFrame = await sharp(Buffer.from(logoFrameSvg)).png().toBuffer()

  // ロゴ画像を角丸マスクで切り抜いてリサイズ
  const maskSvg = `
    <svg width="${logoInner}" height="${logoInner}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${logoInner}" height="${logoInner}" rx="${logoRadius - 4}" ry="${logoRadius - 4}" fill="white"/>
    </svg>
  `

  const logoResized = await sharp(readFileSync(LOGO_PATH))
    .resize(logoInner, logoInner, { fit: "cover" })
    .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
    .png()
    .toBuffer()

  // フレームにロゴを合成
  const logoComposite = await sharp(logoFrame)
    .composite([
      {
        input: logoResized,
        left: logoPadding,
        top: logoPadding,
      },
    ])
    .toBuffer()

  console.log("Compositing logo onto QR...")

  // 最終合成
  const finalBuffer = await sharp(withQR)
    .composite([
      {
        input: logoComposite,
        left: logoOffset,
        top: logoOffset,
        blend: "over",
      },
    ])
    .png({ compressionLevel: 8, quality: 95 })
    .toBuffer()

  // ファイル保存
  const { writeFileSync } = await import("fs")
  writeFileSync(OUTPUT_PATH, finalBuffer)

  console.log(`✅ QR code saved to: ${OUTPUT_PATH}`)
  console.log(`   Size: ${finalBuffer.length} bytes`)
}

generateQR().catch((err) => {
  console.error("❌ Failed:", err)
  process.exit(1)
})
