import type { Metadata } from "next"
import {
  CheckCircle2,
  FileText,
  Globe,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "knotic — AIチャットボット作成サービス",
  robots: { index: false, follow: false },
}

export default function FlyerPage() {
  return (
    <>
      {/* ── 印刷時にヘッダー・フッター・固定要素を非表示 ── */}
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

          /* 背景色・グラデーションを印刷時に強制出力 */
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

      {/* ── 画面表示時のラッパー ── */}
      <div className="print-hide py-8 text-center text-sm text-slate-500 space-y-1">
        <p>印刷するには ブラウザメニュー → 印刷（Ctrl+P / ⌘P）を使用してください</p>
        <p className="text-xs text-slate-400">背景色を印刷するには、印刷ダイアログの「詳細設定」→「<strong>背景のグラフィックス</strong>」をONにしてください（Chrome / Edge）</p>
      </div>

      {/* ── A4 フライヤー本体 ── */}
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
        {/* ━━ ① ヘッダー帯 ━━ */}
        <div
          style={{
            background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 40%, #0c2340 70%, #164e63 100%)",
            padding: "4mm 10mm 4mm",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 装飾: 右奥の光彩 */}
          <div style={{
            position: "absolute", top: "-30px", right: "-20px",
            width: "160px", height: "160px",
            background: "radial-gradient(circle, rgba(8,145,178,0.35) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-20px", left: "40%",
            width: "100px", height: "100px",
            background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />

          {/* サービス名 + バッジ */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", position: "relative" }}>
            <img
              src="/images/knotic-title-whitetext.png"
              alt="knotic"
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
            />
            <span style={{
              fontSize: "7.5pt",
              background: "linear-gradient(90deg, #0891b2, #06b6d4)",
              color: "white",
              borderRadius: "999px",
              padding: "3px 11px 1px",
              fontWeight: "700",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(8,145,178,0.5)",
            }}>
              AIチャットボット作成
            </span>
          </div>

          {/* キャッチコピー */}
          <div style={{ position: "relative" }}>
            <p style={{
              fontSize: "7.5pt",
              fontWeight: "700",
              color: "#38bdf8",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "5px",
            }}>
              ── 経営者のための AI 活用ツール ──
            </p>
            <p style={{
              fontSize: "20pt",
              fontWeight: "900",
              lineHeight: "1.3",
              color: "#ffffff",
              letterSpacing: "-0.01em",
              marginBottom: "4px",
            }}>
              自社URLやファイルを登録するだけで、
            </p>
            <p style={{
              fontSize: "20pt",
              fontWeight: "900",
              lineHeight: "1.3",
              color: "#22d3ee",
              letterSpacing: "-0.01em",
              marginBottom: "4px",
            }}>
              <span style={{ fontStyle: "italic" }}>AI</span>アシスタントが今日から使えます。
            </p>
          </div>

          {/* タグ */}
          <div style={{ marginTop: "6px", display: "flex", gap: "7px", flexWrap: "wrap", position: "relative" }}>
            {[
              { label: "導入1日〜", accent: true },
              { label: "コード不要", accent: false },
              { label: "引用付き回答", accent: false },
              { label: "月額¥10,000〜", accent: false },
            ].map((tag) => (
              <span
                key={tag.label}
                style={{
                  background: tag.accent ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.10)",
                  border: `1px solid ${tag.accent ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.2)"}`,
                  color: tag.accent ? "#22d3ee" : "#e2e8f0",
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

        {/* ━━ ② 課題 ━━ */}
        <div style={{ padding: "4mm 14mm", background: "#fafafa", borderBottom: "3px solid #f1f5f9", position: "relative" }}>
          {/* セクションラベル */}
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
              { icon: <MessageSquare size={14} />, num: "01", text: "同じ問い合わせ対応に時間がかかる" },
              { icon: <FileText size={14} />, num: "02", text: "マニュアルを毎回探して確認している" },
              { icon: <Users size={14} />, num: "03", text: "24時間対応できる窓口が欲しい" },
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
                  fontSize: "8.5pt",
                  color: "#1e293b",
                  lineHeight: "1.55",
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

        {/* ━━ ③ 活用シーン ━━ */}
        <div style={{ padding: "4mm 12mm" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "4px", height: "20px", background: "#0891b2", borderRadius: "2px" }} />
            <p style={{ fontSize: "12pt", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.01em" }}>
              主な<span style={{ color: "#0891b2" }}>活用シーン</span>
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
            {[
              {
                icon: <Globe size={15} />,
                title: "Webサイト問い合わせ対応",
                body: "ページにそのまま公開してAIが自動回答。問い合わせへの流入を削減し、対応コストや時間を大幅に下げます。",
              },
              {
                icon: <FileText size={15} />,
                title: "マニュアル・規程の照会",
                body: "PDFや社内文書を登録するだけ。スタッフが「あの手順どこ？」をチャットで即解決できます。",
              },
              {
                icon: <MessageSquare size={15} />,
                title: "商品・サービス案内",
                body: "展示会・営業時にタブレットで活用。商品仕様・価格・事例をAIが即座に案内し、商談をサポートします。",
              },
              {
                icon: <Users size={15} />,
                title: "新入社員のオンボーディング",
                body: "入社時のよくある質問をFAQ化しAI対応。担当者への質問集中を緩和し、早期定着を支援します。",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  borderLeft: "3px solid #0891b2",
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
                  background: "#0891b2",
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
                    fontSize: "9.5pt",
                    color: "#0f172a",
                    marginBottom: "3px",
                    letterSpacing: "-0.01em",
                  }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: "8pt", color: "#101010", lineHeight: "1.65", fontWeight: "500" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ━━ ④ 使い方 3ステップ ━━ */}
        <div style={{
          padding: "4mm 14mm",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* 装飾ライン */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg, #0891b2, #22d3ee, #0891b2)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "20px", background: "#22d3ee", borderRadius: "2px" }} />
            <p style={{
              fontSize: "12pt",
              fontWeight: "900",
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}>
              たった<span style={{ color: "#22d3ee", fontSize: "15pt", fontStyle: "italic" }}>3</span>ステップで導入完了
            </p>
          </div>

          <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
            {[
              {
                step: "01",
                icon: <Globe size={17} />,
                title: "URLまたはファイルを登録",
                body: "管理画面からURLかファイルをそのまま貼り付けるだけ。専門知識は一切不要です。",
              },
              {
                step: "02",
                icon: <Zap size={17} />,
                title: "AIがナレッジを自動構築",
                body: "登録データをAIが自動解析・インデックス。最短数分で回答できる状態になります。",
              },
              {
                step: "03",
                icon: <Zap size={17} />,
                title: "Webサイトに公開",
                body: "scriptタグを貼るか、専用URLを共有するだけ。即日で運用開始できます。",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  position: "relative",
                  borderRight: i < 2 ? "1px dashed rgba(34,211,238,0.3)" : "none",
                  overflow: "hidden",
                }}
              >
                {/* 大きな背景ステップ番号 */}
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
                    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
                    color: "white",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "7.5pt",
                    fontWeight: "900",
                    letterSpacing: "0.05em",
                  }}>
                    STEP {item.step}
                  </span>
                  <span style={{ color: "#22d3ee" }}>{item.icon}</span>
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
                <p style={{ fontSize: "7.5pt", color: "#94a3b8", lineHeight: "1.65" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ━━ ⑤ 料金プラン ━━ */}
        <div style={{ padding: "4mm 14mm" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ width: "4px", height: "20px", background: "#7c3aed", borderRadius: "2px" }} />
            <div>
              <p style={{ fontSize: "12pt", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.01em" }}>
                料金プラン
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              {
                name: "Lite",
                sub: "まず小さく始める",
                price: "¥10,000",
                points: ["Bot 1体", "月間1,000メッセージ", "データ100MB", "Widget埋め込み対応"],
                highlight: false,
                accentColor: "#64748b",
              },
              {
                name: "Standard",
                sub: "本格導入･公開URL付き",
                price: "¥24,800",
                points: ["Bot 2体", "月間5,000メッセージ", "データ1GB", "公開URL / Widget / API"],
                highlight: true,
                accentColor: "#0891b2",
              },
              {
                name: "Pro",
                sub: "複数部門･大規模展開",
                price: "¥100,000",
                points: ["Bot 無制限", "月間20,000メッセージ", "データ10GB", "全機能利用可"],
                highlight: false,
                accentColor: "#7c3aed",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  border: plan.highlight ? `2px solid ${plan.accentColor}` : "1.5px solid #e2e8f0",
                  borderTop: `4px solid ${plan.accentColor}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  background: plan.highlight ? "#ecfeff" : "white",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: "absolute",
                    top: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: plan.accentColor,
                    color: "white",
                    borderRadius: "999px",
                    padding: "2px 12px",
                    fontSize: "7pt",
                    fontWeight: "800",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.05em",
                  }}>
                    ★ おすすめ
                  </div>
                )}
                <p style={{
                  fontWeight: "900",
                  fontSize: "11pt",
                  color: plan.accentColor,
                  letterSpacing: "0.02em",
                }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: "7.5pt", color: "#101010", fontWeight: "600", marginBottom: "3px" }}>
                  {plan.sub}
                </p>
                <p style={{
                  fontSize: "17pt",
                  fontWeight: "900",
                  color: "#0f172a",
                  lineHeight: "1.1",
                  margin: "3px 0",
                  letterSpacing: "-0.02em",
                }}>
                  {plan.price}
                  <span style={{ fontSize: "8pt", fontWeight: "600", color: "#64748b" }}> /月</span>
                </p>
                <div style={{
                  borderTop: "1.5px solid #e2e8f0",
                  paddingTop: "4px",
                  marginTop: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
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

        {/* ━━ ⑥ CTA フッター帯 ━━ */}
        <div
          style={{
            background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #164e63 100%)",
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
          {/* 装飾グロー */}
          <div style={{
            position: "absolute", top: "-40px", left: "30%",
            width: "200px", height: "200px",
            background: "radial-gradient(circle, rgba(8,145,178,0.2) 0%, transparent 65%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <p style={{
              fontSize: "7.5pt",
              fontWeight: "700",
              color: "#38bdf8",
              letterSpacing: "0.18em",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}>
              ── Let's try it! ──
            </p>
            <p style={{
              fontSize: "15pt",
              fontWeight: "900",
              color: "#ffffff",
              marginBottom: "4px",
              letterSpacing: "-0.02em",
              lineHeight: "1.2",
            }}>
              まずは無料で
              <span style={{ color: "#22d3ee" }}>お試しください</span>
            </p>
            <p style={{ fontSize: "8.5pt", color: "#94a3b8", marginBottom: "6px", fontWeight: "400" }}>
              一部機能を無料でお試しいただけます。導入相談もお気軽にどうぞ。
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(8,145,178,0.15)",
              border: "1px solid rgba(34,211,238,0.4)",
              borderRadius: "8px",
              padding: "4px 14px",
            }}>
              <span style={{ fontSize: "7pt", color: "#94a3b8", fontWeight: "500" }}>アクセス</span>
              <span style={{
                color: "#22d3ee",
                fontWeight: "800",
                fontSize: "9pt",
                letterSpacing: "0.01em",
              }}>
                https://knotic.make-it-tech.com
              </span>
            </div>
          </div>

          {/* QRコード */}
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{
              padding: "4px",
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(34,211,238,0.3)",
              borderRadius: "12px",
              display: "inline-block",
            }}>
              <img
                src="/images/qr-knotic.png"
                alt="knotic QRコード"
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

        {/* ━━ ⑦ 最下部キャプション ━━ */}
        <div style={{
          background: "#020617",
          padding: "2mm 8mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(34,211,238,0.15)",
        }}>
          <p style={{ fontSize: "7pt", color: "#475569", fontWeight: "500" }}>
            © knotic — make-it-tech.com
          </p>
          <p style={{ fontSize: "7pt", color: "#475569", fontWeight: "500" }}>
            お問い合わせ: https://knotic.make-it-tech.com/contact
          </p>
        </div>
      </div>

      <div className="print-hide py-8" />
    </>
  )
}
