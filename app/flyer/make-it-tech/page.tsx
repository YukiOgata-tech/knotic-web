import type { Metadata } from "next"
import {
  CheckCircle2,
  ClipboardList,
  Code2,
  FileText,
  Globe,
  MessageSquare,
  RefreshCw,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Make It Tech — DX・IT支援チラシ",
  robots: { index: false, follow: false },
}

export default function MakeItTechFlyerPage() {
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
          body { background: #e5e7eb; }
        }
      `}</style>

      <div className="print-hide py-8 text-center text-sm text-slate-500 space-y-1">
        <p>印刷するには ブラウザメニュー → 印刷（Ctrl+P / ⌘P）を使用してください</p>
        <p className="text-xs text-slate-400">背景色を印刷するには、印刷ダイアログの「詳細設定」→「背景のグラフィックス」をONにしてください（Chrome / Edge）</p>
      </div>

      <div
        id="flyer-root"
        className="mx-auto bg-white shadow-2xl"
        style={{
          width: "210mm",
          minHeight: "267mm",
          fontFamily: "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif",
          fontSize: "10pt",
          color: "#0f172a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #07111f 0%, #0f172a 42%, #14532d 100%)",
            padding: "4mm 10mm 4mm",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: "-40px", right: "-10px",
            width: "170px", height: "170px",
            background: "radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-35px", left: "34%",
            width: "150px", height: "150px",
            background: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 68%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", position: "relative" }}>
            <div>
              <p style={{
                fontSize: "22pt",
                fontWeight: "900",
                lineHeight: 1,
                color: "#ffffff",
                letterSpacing: "-0.04em",
              }}>
                Make It Tech
              </p>
              <p style={{
                marginTop: "4px",
                fontSize: "7pt",
                fontWeight: "700",
                color: "#bbf7d0",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}>
                Niigata IT / DX Support
              </p>
            </div>
            <span style={{
              fontSize: "7.5pt",
              background: "linear-gradient(90deg, #16a34a, #0ea5e9)",
              color: "white",
              borderRadius: "999px",
              padding: "3px 11px 1px",
              fontWeight: "700",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(22,163,74,0.45)",
            }}>
              新潟のDX・IT支援
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <p style={{
              fontSize: "7.5pt",
              fontWeight: "700",
              color: "#86efac",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "5px",
            }}>
              ── 中小事業者・個人事業主向け ──
            </p>
            <p style={{
              fontSize: "19.5pt",
              fontWeight: "900",
              lineHeight: "1.32",
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}>
              Web制作からDXまで。
            </p>
            <p style={{
              fontSize: "19.5pt",
              fontWeight: "900",
              lineHeight: "1.32",
              color: "#86efac",
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}>
              “現場で回る仕組み”を提供します。
            </p>
          </div>

          <div style={{ marginTop: "6px", display: "flex", gap: "7px", flexWrap: "wrap", position: "relative" }}>
            {[
              { label: "Web制作", accent: true },
              { label: "業務改善", accent: false },
              { label: "自動化・小規模システム", accent: false },
              { label: "補助金相談も対応", accent: false },
            ].map((tag) => (
              <span
                key={tag.label}
                style={{
                  background: tag.accent ? "rgba(34,197,94,0.22)" : "rgba(255,255,255,0.10)",
                  border: `1px solid ${tag.accent ? "rgba(134,239,172,0.5)" : "rgba(255,255,255,0.2)"}`,
                  color: tag.accent ? "#bbf7d0" : "#e2e8f0",
                  borderRadius: "999px",
                  padding: "3px 12px",
                  fontSize: "8pt",
                  fontWeight: "600",
                  letterSpacing: "0.03em",
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ padding: "4mm 14mm", background: "#fafafa", borderBottom: "3px solid #f1f5f9", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "4px", height: "20px", background: "#ef4444", borderRadius: "2px" }} />
            <p style={{
              fontSize: "13pt",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "-0.01em",
            }}>
              こんな<span style={{ color: "#ef4444" }}>課題</span>はありませんか？
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }}>
            {[
              { icon: <Globe size={14} />, num: "01", text: "問い合わせやメニュー更新など、機能性の高いWebページが欲しい" },
              { icon: <FileText size={14} />, num: "02", text: "手入力作業やデータ管理が大変で、引き継ぎも不安" },
              { icon: <MessageSquare size={14} />, num: "03", text: "IT導入やDXを進めたいが、何から始めればよいか分からない" },
            ].map((item) => (
              <div
                key={item.num}
                style={{
                  background: "white",
                  border: "1.5px solid #fecaca",
                  borderTop: "3px solid #ef4444",
                  borderRadius: "8px",
                  padding: "9px 11px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span style={{
                  position: "absolute", top: "4px", right: "8px",
                  fontSize: "20pt", fontWeight: "900", color: "#fee2e2",
                  lineHeight: 1, userSelect: "none",
                }}>
                  {item.num}
                </span>
                <span style={{ color: "#ef4444", display: "block", marginBottom: "5px" }}>{item.icon}</span>
                <span style={{
                  fontSize: "8pt",
                  color: "#1e293b",
                  lineHeight: "1.5",
                  fontWeight: "600",
                  whiteSpace: "pre-line",
                  display: "block",
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "4mm 12mm" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "4px", height: "20px", background: "#16a34a", borderRadius: "2px" }} />
            <p style={{ fontSize: "12pt", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.01em" }}>
              対応できる<span style={{ color: "#16a34a" }}>こと</span>
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
            {[
              {
                icon: <Code2 size={15} />,
                title: "Web制作・導線設計",
                body: "店舗サイト、採用ページ、LP、コーポレートサイトなど。構成設計・CTA改善・更新しやすい設計まで対応します。",
              },
              {
                icon: <ClipboardList size={15} />,
                title: "業務改善・見える化",
                body: "業務フロー、入力ルール、担当者ごとの作業を整理。属人化や二重入力を減らし、引き継げる運用を作ります。",
              },
              {
                icon: <Settings size={15} />,
                title: "ツール導入・自動化",
                body: "LINE公式、フォーム、管理シート、通知連携など。既存ツールで済むなら作らず、最小コストで仕組み化します。",
              },
              {
                icon: <Wrench size={15} />,
                title: "小規模システム・DX開発",
                body: "AIや計算システムを組み込んだ業務支援ツール、簡易管理画面、自動化システムまで柔軟に対応します。",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  borderLeft: "3px solid #16a34a",
                  borderRadius: "0 8px 8px 0",
                  padding: "9px 12px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  gap: "9px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{
                  background: "#16a34a",
                  borderRadius: "7px",
                  padding: "6px",
                  flexShrink: 0,
                  color: "white",
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{
                    fontWeight: "800",
                    fontSize: "9.2pt",
                    color: "#0f172a",
                    marginBottom: "3px",
                    letterSpacing: "-0.01em",
                  }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: "7.6pt", color: "#101010", lineHeight: "1.62", fontWeight: "500" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: "4mm 14mm",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 52%, #14532d 100%)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg, #16a34a, #86efac, #0ea5e9)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "20px", background: "#86efac", borderRadius: "2px" }} />
            <p style={{
              fontSize: "12pt",
              fontWeight: "900",
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}>
              まず<span style={{ color: "#86efac", fontSize: "15pt", fontStyle: "italic" }}>整理</span>して、必要なら実装へ
            </p>
          </div>

          <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
            {[
              {
                step: "01",
                icon: <ClipboardList size={17} />,
                title: "まず整理",
                body: "現状と理想、制約を整理し、必要な範囲と優先順位を見極めます。",
              },
              {
                step: "02",
                icon: <Sparkles size={17} />,
                title: "最小構成で実装",
                body: "まず動く状態を作り、効果が見えたら段階的に拡張します。",
              },
              {
                step: "03",
                icon: <RefreshCw size={17} />,
                title: "運用まで伴走",
                body: "導入して終わりにせず、数字と現場の声で改善を続けます。",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  position: "relative",
                  borderRight: i < 2 ? "1px dashed rgba(134,239,172,0.32)" : "none",
                  overflow: "hidden",
                }}
              >
                <span style={{
                  position: "absolute",
                  bottom: "-8px",
                  right: "6px",
                  fontSize: "48pt",
                  fontWeight: "900",
                  color: "rgba(255,255,255,0.05)",
                  lineHeight: 1,
                  userSelect: "none",
                  letterSpacing: "-0.05em",
                }}>
                  {item.step}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{
                    background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
                    color: "white",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "7.5pt",
                    fontWeight: "900",
                    letterSpacing: "0.05em",
                  }}>
                    STEP {item.step}
                  </span>
                  <span style={{ color: "#86efac" }}>{item.icon}</span>
                </div>
                <p style={{
                  fontWeight: "800",
                  fontSize: "9pt",
                  color: "#f1f5f9",
                  marginBottom: "5px",
                  lineHeight: "1.3",
                }}>
                  {item.title}
                </p>
                <p style={{ fontSize: "7.5pt", color: "#cbd5e1", lineHeight: "1.65" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "4mm 14mm" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "20px", background: "#0ea5e9", borderRadius: "2px" }} />
              <p style={{ fontSize: "12pt", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.01em" }}>
                相談から見積まで
              </p>
            </div>
            <p style={{ fontSize: "7.5pt", fontWeight: "700", color: "#475569", textAlign: "right", lineHeight: "1.45" }}>
              ※ 料金は内容・範囲・納期を事前合意して個別見積
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              {
                name: "無料相談",
                sub: "まず方向性を整理",
                points: ["困りごとの共有", "目的・制約の整理", "次の進め方を提案"],
                accentColor: "#64748b",
              },
              {
                name: "業務診断",
                sub: "条件により無料",
                points: ["現状を深く把握", "改善余地を可視化", "推奨ITと概算見積"],
                accentColor: "#16a34a",
              },
              {
                name: "実装支援",
                sub: "Web/DXを形にする",
                points: ["Web制作・修正", "自動化・管理シート", "小規模システム開発"],
                accentColor: "#0ea5e9",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderTop: `4px solid ${plan.accentColor}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  background: "white",
                  position: "relative",
                }}
              >
                <p style={{
                  fontWeight: "900",
                  fontSize: "11pt",
                  color: plan.accentColor,
                  letterSpacing: "0.02em",
                }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: "7.5pt", color: "#101010", fontWeight: "600", marginBottom: "5px" }}>
                  {plan.sub}
                </p>
                <div style={{
                  borderTop: "1.5px solid #e2e8f0",
                  paddingTop: "6px",
                  marginTop: "5px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}>
                  {plan.points.map((pt) => (
                    <div key={pt} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <CheckCircle2 size={10} color={plan.accentColor} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "7.5pt", color: "#202020", fontWeight: "500" }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #07111f 0%, #0f172a 50%, #14532d 100%)",
            padding: "4mm 14mm 2mm",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: "-40px", left: "30%",
            width: "200px", height: "200px",
            background: "radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 65%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <p style={{
              fontSize: "7.5pt",
              fontWeight: "700",
              color: "#86efac",
              letterSpacing: "0.18em",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}>
              ── First, talk about your current situation ──
            </p>
            <p style={{
              fontSize: "15pt",
              fontWeight: "900",
              color: "#ffffff",
              marginBottom: "4px",
              letterSpacing: "-0.02em",
              lineHeight: "1.2",
            }}>
              要件が固まっていなくても
              <span style={{ color: "#86efac" }}>相談OK</span>
            </p>
            <p style={{ fontSize: "8.5pt", color: "#cbd5e1", marginBottom: "6px", fontWeight: "400" }}>
              現状の困りごと・理想・制約を整理し、最短の改善案をご提案します。
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(134,239,172,0.4)",
              borderRadius: "8px",
              padding: "4px 14px",
            }}>
              <span style={{ fontSize: "7pt", color: "#94a3b8", fontWeight: "500" }}>アクセス</span>
              <span style={{
                color: "#86efac",
                fontWeight: "800",
                fontSize: "9pt",
                letterSpacing: "0.01em",
              }}>
                https://make-it-tech.com
              </span>
            </div>
          </div>

          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{
              padding: "4px",
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(134,239,172,0.3)",
              borderRadius: "12px",
              display: "inline-block",
            }}>
              <img
                src="/images/qr-make-it-tech.png"
                alt="Make It Tech QRコード"
                style={{ width: "88px", height: "88px", borderRadius: "8px", display: "block" }}
              />
            </div>
            <p style={{
              fontSize: "6.5pt",
              color: "#64748b",
              marginTop: "2px",
              lineHeight: "1.4",
              fontWeight: "500",
            }}>
              カメラで読み取り
            </p>
          </div>
        </div>

        <div style={{
          background: "#020617",
          padding: "2mm 8mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(134,239,172,0.15)",
        }}>
          <p style={{ fontSize: "7pt", color: "#475569", fontWeight: "500" }}>
            © Make It Tech — 新潟のIT/DX支援
          </p>
          <p style={{ fontSize: "7pt", color: "#475569", fontWeight: "500" }}>
            Web制作 / 業務改善 / 自動化 / DX支援 / マーケティング支援
          </p>
        </div>
      </div>

      <div className="print-hide py-8" />
    </>
  )
}
