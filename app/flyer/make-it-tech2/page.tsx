import type { Metadata } from "next"
import {
  CheckCircle2,
  ClipboardList,
  Cpu,
  FileText,
  Globe2,
  Handshake,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Wrench,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Make It Tech — DX・IT支援チラシ 2",
  robots: { index: false, follow: false },
}

const problems = [
  "ホームページを作ったまま、問い合わせや採用につながっていない",
  "手入力・転記・確認作業が多く、本来の業務に時間を使えない",
  "DXやAI活用を進めたいが、何を頼めばいいか分からない",
]

const services = [
  {
    icon: <Globe2 size={18} />,
    title: "Web制作",
    body: "店舗サイト、採用ページ、LP、コーポレートサイト。導線設計から改善まで。",
  },
  {
    icon: <ClipboardList size={18} />,
    title: "業務整理",
    body: "業務フロー、入力ルール、マニュアル書類などを整理し、生産性向上を目指します。",
  },
  {
    icon: <Wrench size={18} />,
    title: "自動化",
    body: "フォーム、LINE、通知、シート連携などを最小コストで仕組み化。",
  },
  {
    icon: <Cpu size={18} />,
    title: "DX",
    body: "AI活用、簡易管理画面、計算システムなど必要な範囲だけ開発。",
  },
]

const process = [
  ["01", "整理", "現状・理想・制約を聞き、必要な範囲を見極めます。"],
  ["02", "設計", "作る前に、運用できる形と優先順位を決めます。"],
  ["03", "実装", "まず動く最小構成を作り、効果を見て拡張します。"],
  ["04", "改善", "導入後も数字と現場の声で調整します。"],
]

const records = [
  "福祉系企業の業務支援",
  "教育系事業所のDX支援",
  "飲食店のWeb活用",
  "公式LINEの構築・運用補助",
]

export default function MakeItTechFlyer2Page() {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          header,
          footer,
          nav[aria-label="パンくず"],
          [data-route-loader],
          button[class*="fixed"],
          .print-hide { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          main { padding: 0 !important; margin: 0 !important; }
          #flyer-root { box-shadow: none !important; border: none !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        @media screen {
          body { background: #d1d5db; }
        }
      `}</style>

      <div className="print-hide py-8 text-center text-sm text-slate-500 space-y-1">
        <p>印刷するには ブラウザメニュー → 印刷（Ctrl+P / ⌘P）を使用してください</p>
        <p className="text-xs text-slate-400">背景色を印刷するには、印刷ダイアログの「詳細設定」→「背景のグラフィックス」をONにしてください（Chrome / Edge）</p>
      </div>

      <div
        id="flyer-root"
        className="mx-auto shadow-2xl"
        style={{
          width: "210mm",
          minHeight: "267mm",
          fontFamily: "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif",
          color: "#0f172a",
          overflow: "hidden",
          background: "#f8fafc",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(15,23,42,0.045) 1px, transparent 1px)",
            backgroundSize: "14mm 14mm",
            pointerEvents: "none",
          }}
        />

        <section
          style={{
            position: "relative",
            minHeight: "50mm",
            background: "linear-gradient(135deg, #052e16 0%, #064e3b 45%, #0f172a 100%)",
            color: "white",
            padding: "6mm 10mm 4mm",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-24mm",
              top: "-18mm",
              width: "70mm",
              height: "70mm",
              borderRadius: "999px",
              background: "rgba(250,204,21,0.22)",
              border: "2mm solid rgba(250,204,21,0.16)",
            }}
          />
          {/* <div
            style={{
              position: "absolute",
              right: "-18mm",
              bottom: "4mm",
              transform: "rotate(-10deg)",
              background: "#facc15",
              color: "#111827",
              padding: "3mm 20mm",
              fontSize: "10pt",
              fontWeight: 900,
              letterSpacing: "0.08em",
              boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
            }}
          >
            新潟の中小事業者・個人事業主向け
          </div> */}

          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 42mm", gap: "7mm" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "3mm", marginBottom: "3mm" }}>
                <div
                  style={{
                    width: "12mm",
                    height: "12mm",
                    borderRadius: "4mm",
                    background: "#facc15",
                    color: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "15pt",
                  }}
                >
                  M
                </div>
                <div>
                  <p style={{ fontSize: "22pt", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em" }}>
                    Make It Tech
                  </p>
                  <p style={{ marginTop: "1.5mm", fontSize: "7.5pt", fontWeight: 800, color: "#bbf7d0", letterSpacing: "0.18em" }}>
                    WEB / DX / AUTOMATION
                  </p>
                </div>
              </div>

              {/* <p style={{ display: "inline-block", background: "#facc15", color: "#111827", padding: "1.2mm 3mm", borderRadius: "999px", fontSize: "8pt", fontWeight: 900 }}>
                作るより先に、まず整理。
              </p> */}
              <h1 style={{ marginTop: "4mm", fontSize: "27pt", fontWeight: 900, lineHeight: 1.18, letterSpacing: "-0.05em" }}>
                現場で回る
                <span style={{ color: "#86efac" }}>ITの仕組み</span>を
                <br />
                いっしょに作ります。
              </h1>
              <p style={{ marginTop: "1mm", maxWidth: "116mm", fontSize: "9.2pt", lineHeight: 1.75, color: "#e2e8f0", fontWeight: 500 }}>
                Web制作、AI導入、ツール導入、自動化、専用システム構築まで。
                既存ツールで済むなら作らず、必要なところだけ低コストで実装します。
              </p>
            </div>

            <div
              style={{
                alignSelf: "end",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "8mm",
                padding: "4mm",
                backdropFilter: "blur(6px)",
              }}
            >
              <p style={{ fontSize: "7pt", color: "#bbf7d0", fontWeight: 900, letterSpacing: "0.18em" }}>POINT</p>
              <div style={{ marginTop: "2.5mm", display: "grid", gap: "2mm" }}>
                {["低コスト", "丁寧", "信頼重視", "運用まで伴走"].map((point) => (
                  <div key={point} style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
                    <CheckCircle2 size={13} color="#facc15" />
                    <span style={{ fontSize: "8pt", fontWeight: 800 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ position: "relative", padding: "4mm 10mm 2mm" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3mm" }}>
            <div>
              <h2 style={{ fontSize: "15pt", fontWeight: 900, letterSpacing: "-0.03em" }}>
                こんな状態なら相談できます
              </h2>
            </div>
            <p style={{ fontSize: "7.5pt", color: "#475569", fontWeight: 700, textAlign: "right" }}>
              要件が固まっていなくてもOK
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3mm" }}>
            {problems.map((problem, index) => (
              <div
                key={problem}
                style={{
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  borderRadius: "5mm",
                  padding: "3.4mm",
                  minHeight: "25mm",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span style={{ position: "absolute", right: "3mm", top: "1.5mm", fontSize: "22pt", color: "#ffedd5", fontWeight: 900 }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <MessageSquare size={17} color="#ea580c" />
                <p style={{ marginTop: "2mm", fontSize: "8.1pt", lineHeight: 1.55, fontWeight: 800, color: "#7c2d12" }}>
                  {problem}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ position: "relative", padding: "3mm 10mm 4mm" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "34mm 1fr",
              gap: "4mm",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                background: "#111827",
                color: "white",
                borderRadius: "6mm",
                padding: "4mm",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: "7pt", color: "#86efac", fontWeight: 900, letterSpacing: "0.18em" }}>MENU</p>
                <p style={{ marginTop: "2mm", fontSize: "16pt", fontWeight: 900, lineHeight: 1.22, letterSpacing: "-0.04em" }}>
                  対応
                  <br />
                  メニュー
                </p>
              </div>
              <Sparkles size={30} color="#facc15" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3mm" }}>
              {services.map((service) => (
                <div
                  key={service.title}
                  style={{
                    background: "white",
                    border: "1.5px solid #d1fae5",
                    borderRadius: "4mm",
                    padding: "3.4mm",
                    boxShadow: "0 2px 0 #bbf7d0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        width: "8mm",
                        height: "8mm",
                        borderRadius: "2.5mm",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        background: "#16a34a",
                        flexShrink: 0,
                      }}
                    >
                      {service.icon}
                    </span>
                    <p style={{ fontSize: "9.5pt", fontWeight: 900, color: "#052e16" }}>{service.title}</p>
                  </div>
                  <p style={{ marginTop: "2mm", fontSize: "7.6pt", lineHeight: 1.58, color: "#334155", fontWeight: 600 }}>
                    {service.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            position: "relative",
            margin: "2mm 10mm 0",
            background: "#ecfccb",
            border: "1.5px solid #bef264",
            borderRadius: "7mm",
            padding: "4mm",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: "-8mm", top: "-10mm", width: "34mm", height: "34mm", borderRadius: "999px", background: "#facc15" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "2mm" }}>
            {process.map(([num, title, body], index) => (
              <div key={num} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "1mm" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      width: "8mm",
                      height: "8mm",
                      borderRadius: "999px",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#111827",
                      color: "white",
                      fontSize: "7pt",
                      fontWeight: 900,
                    }}
                  >
                    {num}
                  </span>
                  <p style={{ fontSize: "9.5pt", fontWeight: 900 }}>{title}</p>
                </div>
                <p style={{ fontSize: "7.3pt", lineHeight: 1.55, color: "#365314", fontWeight: 700 }}>{body}</p>
                {index < process.length - 1 ? (
                  <div style={{ position: "absolute", right: "-2mm", top: "3.2mm", color: "#65a30d", fontSize: "10pt", fontWeight: 900 }}>
                    →
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section style={{ position: "relative", padding: "4mm 10mm" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 54mm", gap: "4mm" }}>
            <div
              style={{
                background: "white",
                border: "1.5px solid #e2e8f0",
                borderRadius: "6mm",
                padding: "3mm",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "2mm" }}>
                <FileText size={18} color="#16a34a" />
                <p style={{ fontSize: "12pt", fontWeight: 900 }}>対応実績</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2mm" }}>
                {records.map((record) => (
                  <div key={record} style={{ display: "flex", alignItems: "center", gap: "1.7mm", fontSize: "8pt", fontWeight: 700, color: "#334155" }}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    {record}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "4mm", borderTop: "1px dashed #cbd5e1", paddingTop: "3mm", display: "flex", gap: "3mm", alignItems: "center" }}>
                <div style={{ width: "11mm", height: "11mm", borderRadius: "999px", background: "#111827", color: "#facc15", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                  尾
                </div>
                <div>
                  <p style={{ fontSize: "9pt", fontWeight: 900 }}>代表 / 尾形友輝</p>
                  <p style={{ marginTop: "1mm", fontSize: "7.2pt", color: "#64748b", fontWeight: 700 }}>
                    新潟大学 工学部 情報電子分野 在学中。Web・システム開発、業務AI化支援を実施。Youtube出演 など
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#111827",
                color: "white",
                borderRadius: "6mm",
                padding: "4mm",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", right: "-8mm", top: "-8mm", width: "24mm", height: "24mm", borderRadius: "999px", background: "rgba(250,204,21,0.24)" }} />
              <p style={{ position: "relative", fontSize: "7pt", color: "#86efac", fontWeight: 900, letterSpacing: "0.18em" }}>POLICY</p>
              <div style={{ position: "relative", marginTop: "3mm", display: "grid", gap: "2mm" }}>
                {[
                  ["作るより先に整理", ClipboardList],
                  ["最小構成で早く動かす", Sparkles],
                  ["既存ツールで済むなら作らない", Wrench],
                  ["現場で運用できる形を優先", RefreshCw],
                ].map(([text, Icon]) => (
                  <div key={String(text)} style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
                    <Icon size={13} color="#facc15" />
                    <span style={{ fontSize: "7.6pt", fontWeight: 800 }}>{text as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: "1mm",
            background: "linear-gradient(135deg, #111827 0%, #052e16 100%)",
            color: "white",
            padding: "4mm 10mm 3mm",
            display: "grid",
            gridTemplateColumns: "1fr 30mm",
            gap: "6mm",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "2mm" }}>
              <Handshake size={18} color="#facc15" />
              <p style={{ fontSize: "7.5pt", color: "#86efac", fontWeight: 900, letterSpacing: "0.18em" }}>FREE CONSULTATION</p>
            </div>
            <p style={{ fontSize: "16pt", fontWeight: 900, lineHeight: 1.25, letterSpacing: "-0.03em" }}>
              まずは「今困っていること」を相談してください。
            </p>
            <p style={{ marginTop: "2mm", fontSize: "8.2pt", lineHeight: 1.6, color: "#cbd5e1", fontWeight: 600 }}>
              無料相談・実績詳細はWebサイトへ。補助金活用や段階的なDX導入もご相談いただけます。
            </p>
            {/* <div
              style={{
                marginTop: "3mm",
                display: "inline-flex",
                alignItems: "center",
                gap: "2mm",
                background: "#facc15",
                color: "#111827",
                borderRadius: "999px",
                padding: "2mm 5mm",
                fontSize: "9pt",
                fontWeight: 900,
              }}
            >
              make-it-tech.com
            </div> */}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", background: "white", padding: "1mm", borderRadius: "4mm" }}>
              <img
                src="/images/qr-make-it-tech.png"
                alt="Make It Tech QRコード"
                style={{ width: "25mm", height: "25mm", borderRadius: "2mm", display: "block" }}
              />
            </div>
            {/* <p style={{ marginTop: "1mm", fontSize: "6.5pt", color: "#94a3b8", fontWeight: 700 }}>カメラで読み取り</p> */}
          </div>
        </section>

        <div
          style={{
            background: "#020617",
            color: "#64748b",
            padding: "2mm 8mm",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "7pt",
            fontWeight: 700,
          }}
        >
          <p>© Make It Tech - IT/DX支援</p>
          <p>Web制作 / 自動化 / DX支援 / マーケティング支援</p>
        </div>
      </div>

      <div className="print-hide py-8" />
    </>
  )
}
