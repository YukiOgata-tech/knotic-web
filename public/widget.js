(() => {
  const script = document.currentScript;
  if (!script) return;

  const botPublicId = script.getAttribute("data-bot-id");
  const widgetToken = script.getAttribute("data-widget-token");
  const dataMode = script.getAttribute("data-mode");
  const dataPosition = script.getAttribute("data-position");

  if (!botPublicId || !widgetToken) {
    console.warn("[knotic-widget] data-bot-id and data-widget-token are required.");
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
      border: none;
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
    .knotic-widget-launcher.knotic-right-bottom { right: 20px; bottom: 20px; }
    .knotic-widget-launcher.knotic-right-top { right: 20px; top: 20px; }

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

    .knotic-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .knotic-widget-title { font-size: 13px; font-weight: 600; color: #0f172a; }
    .knotic-widget-actions { display: flex; align-items: center; gap: 8px; }
    .knotic-widget-link,
    .knotic-widget-close {
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      color: #0f172a;
      cursor: pointer;
      text-decoration: none;
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

    .knotic-widget-policy {
      border-top: 1px solid #e2e8f0;
      padding: 8px 12px;
      font-size: 11px;
      color: #475569;
      background: #f8fafc;
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
    .then((res) => {
      if (!res.ok) throw new Error("failed to load widget config");
      return res.json();
    })
    .then((config) => {
      const mode = dataMode || config.mode || "overlay";
      const position = dataPosition || config.position || "right-bottom";
      const policyText =
        config.policyText ||
        "このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。";

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

      const header = document.createElement("div");
      header.className = "knotic-widget-header";

      const title = document.createElement("div");
      title.className = "knotic-widget-title";
      title.textContent = config.launcherLabel || "チャット";

      const actions = document.createElement("div");
      actions.className = "knotic-widget-actions";

      if (mode === "both") {
        const link = document.createElement("a");
        link.className = "knotic-widget-link";
        link.href = config.hostedUrl;
        link.target = config.redirectNewTab ? "_blank" : "_self";
        link.rel = "noreferrer";
        link.textContent = "別ページで開く";
        actions.appendChild(link);
      }

      const close = document.createElement("button");
      close.type = "button";
      close.className = "knotic-widget-close";
      close.textContent = "閉じる";
      actions.appendChild(close);

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

      const policy = document.createElement("div");
      policy.className = "knotic-widget-policy";
      policy.textContent = policyText;

      header.appendChild(title);
      header.appendChild(actions);
      body.appendChild(loading);
      body.appendChild(iframe);
      panel.appendChild(header);
      panel.appendChild(body);
      panel.appendChild(policy);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      const openOverlay = () => overlay.classList.add("knotic-open");
      const closeOverlay = () => overlay.classList.remove("knotic-open");

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

      close.addEventListener("click", closeOverlay);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeOverlay();
      });
    })
    .catch((err) => {
      console.warn("[knotic-widget]", err.message || err);
    });
})();
