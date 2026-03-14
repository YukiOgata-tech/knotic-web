(() => {
  function resolveWidgetErrorMessage(status, reason) {
    const code = typeof reason === "string" ? reason : "";

    if (code.includes("botPublicId and widgetToken are required")) {
      return "Bot ID または Widgetトークンが未設定です。埋め込みコードを確認してください。";
    }
    if (code.includes("bot not found")) {
      return "指定した Bot ID が見つかりません。Bot設定の公開IDを確認してください。";
    }
    if (code.includes("invalid widget token")) {
      return "Widgetトークンが無効です。トークンを再発行して貼り直してください。";
    }
    if (code.includes("origin not allowed")) {
      return "このサイトのドメインが許可オリジンに未登録です。コンソールで追加してください。";
    }
    if (code.includes("widget is disabled")) {
      return "このBotではWidgetが無効です。Bot設定でWidgetを有効化してください。";
    }
    if (code.includes("widget unavailable for internal mode")) {
      return "現在のモード設定ではWidgetを利用できません。公開モードを確認してください。";
    }
    if (code.includes("bot is not public")) {
      return "このBotは公開停止中です。Bot状態を有効にしてください。";
    }
    if (code.includes("bot is not ready")) {
      return "Botの準備が完了していません。インデックス処理完了後に再試行してください。";
    }
    if (code.includes("force-stopped")) {
      return "運営側設定で現在このBotは停止中です。管理者に確認してください。";
    }

    if (status === 401) return "認証情報が無効です。Widgetトークンを確認してください。";
    if (status === 403) return "現在の公開設定ではWidgetを利用できません。";
    if (status === 404) return "Widget設定が見つかりません。Bot ID を確認してください。";
    if (status === 409) return "Botの準備が完了していないため、利用できません。";
    if (status === 423) return "Botまたはテナントが停止状態のため利用できません。";
    if (status >= 500) return "サーバー側でエラーが発生しました。時間をおいて再試行してください。";
    return "Widgetの読み込みに失敗しました。設定内容をご確認ください。";
  }

  function toErrorMessage(error) {
    if (error instanceof Error) return error.message;
    return String(error ?? "unknown error");
  }

  const script = document.currentScript;
  if (!script) return;

  const botPublicId = script.getAttribute("data-bot-id");
  const widgetToken = script.getAttribute("data-widget-token");
  const dataMode = script.getAttribute("data-mode");
  const dataPosition = script.getAttribute("data-position");

  if (!botPublicId || !widgetToken) {
    console.warn("[knotic-widget] Bot ID または Widgetトークンが未設定です。埋め込みコードを確認してください。");
    return;
  }

  let baseOrigin;
  try {
    baseOrigin = new URL(script.src).origin;
  } catch {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .knotic-widget-launcher {
      position: fixed;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      gap: 8px;
      border-style: inset;
      border-radius: 999px;
      background: #0f172a;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 16px;
      box-shadow: 0 12px 30px rgba(2, 6, 23, 0.35);
      cursor: pointer;
    }
    .knotic-widget-launcher.knotic-icon-only {
      padding: 10px;
    }
    .knotic-widget-launcher.knotic-right-bottom { right: 30px; bottom: 30px; }
    .knotic-widget-launcher.knotic-right-top { right: 30px; top: 30px; }

    .knotic-widget-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483001;
      background: rgba(2, 6, 23, 0.45);
      display: none;
      align-items: stretch;
      justify-content: flex-end;
    }
    .knotic-widget-overlay.knotic-open { display: flex; }

    .knotic-widget-panel {
      width: min(50vw, 760px);
      min-width: 420px;
      height: 100%;
      background: #fff;
      display: flex;
      flex-direction: column;
      box-shadow: -24px 0 50px rgba(2, 6, 23, 0.2);
    }

    .knotic-widget-iframe {
      flex: 1;
      width: 100%;
      border: none;
      background: #fff;
    }

    .knotic-widget-body {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .knotic-widget-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fff;
      gap: 12px;
      z-index: 2;
      transition: opacity 0.35s ease;
      pointer-events: none;
    }
    .knotic-widget-loading.knotic-loaded {
      opacity: 0;
    }
    @keyframes knotic-spin { to { transform: rotate(360deg); } }
    .knotic-widget-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: knotic-spin 0.75s linear infinite;
    }
    .knotic-widget-loading-text {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 0.02em;
    }

    @media (max-width: 768px) {
      .knotic-widget-panel {
        width: 100vw;
        min-width: 100vw;
      }
    }
  `;
  document.head.appendChild(style);

  const configUrl = `${baseOrigin}/api/widget/config?botPublicId=${encodeURIComponent(
    botPublicId
  )}&widgetToken=${encodeURIComponent(widgetToken)}`;

  fetch(configUrl, { method: "GET", mode: "cors" })
    .then(async (res) => {
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const reason = payload && typeof payload.error === "string" ? payload.error : "";
        const userMessage = resolveWidgetErrorMessage(res.status, reason);
        const detail = reason ? ` / detail=${reason}` : "";
        throw new Error(`${userMessage} (status=${res.status}${detail})`);
      }
      if (!payload || typeof payload !== "object") {
        throw new Error("Widget設定の取得に失敗しました。時間をおいて再試行してください。");
      }
      return payload;
    })
    .then((config) => {
      const mode = dataMode || config.mode || "overlay";
      const position = dataPosition || config.position || "right-bottom";

      const launcher = document.createElement("button");
      launcher.type = "button";
      const showLabel = config.launcherShowLabel !== false;
      launcher.className = `knotic-widget-launcher knotic-${position}${showLabel ? "" : " knotic-icon-only"}`;

      const effectiveLogoUrl = config.logoUrl || `${baseOrigin}/images/knotic-square-logo.png`;
      const logoImg = document.createElement("img");
      logoImg.src = effectiveLogoUrl;
      logoImg.alt = "";
      logoImg.style.cssText = "width:24px;height:24px;object-fit:contain;border-radius:3px;flex-shrink:0;";
      launcher.appendChild(logoImg);

      if (showLabel) {
        const labelSpan = document.createElement("span");
        labelSpan.textContent = config.launcherLabel || "チャット";
        launcher.appendChild(labelSpan);
      }
      document.body.appendChild(launcher);

      const overlay = document.createElement("div");
      overlay.className = "knotic-widget-overlay";

      const panel = document.createElement("div");
      panel.className = "knotic-widget-panel";

      const body = document.createElement("div");
      body.className = "knotic-widget-body";

      const loading = document.createElement("div");
      loading.className = "knotic-widget-loading";

      const spinner = document.createElement("div");
      spinner.className = "knotic-widget-spinner";

      const loadingText = document.createElement("div");
      loadingText.className = "knotic-widget-loading-text";
      loadingText.textContent = "読み込み中...";

      loading.appendChild(spinner);
      loading.appendChild(loadingText);

      const iframe = document.createElement("iframe");
      iframe.className = "knotic-widget-iframe";
      iframe.src = config.embedUrl;
      iframe.title = "Knotic Widget Chat";

      iframe.addEventListener("load", () => {
        loading.classList.add("knotic-loaded");
        setTimeout(() => { if (loading.parentNode) loading.parentNode.removeChild(loading); }, 400);
      });

      body.appendChild(loading);
      body.appendChild(iframe);
      panel.appendChild(body);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      const openOverlay = () => overlay.classList.add("knotic-open");
      const closeOverlay = () => overlay.classList.remove("knotic-open");
      const onFrameMessage = (event) => {
        if (event.source !== iframe.contentWindow) return;
        const payload = event.data;
        if (!payload || typeof payload !== "object") return;
        if (payload.type === "knotic-widget-close") {
          closeOverlay();
        }
      };
      window.addEventListener("message", onFrameMessage);

      launcher.addEventListener("click", () => {
        if (mode === "redirect") {
          if (config.redirectNewTab) {
            window.open(config.hostedUrl, "_blank", "noopener,noreferrer");
          } else {
            window.location.href = config.hostedUrl;
          }
          return;
        }
        openOverlay();
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeOverlay();
      });
    })
    .catch((err) => {
      console.warn("[knotic-widget]", toErrorMessage(err));
    });
})();
