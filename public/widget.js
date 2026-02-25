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
      border: none;
      border-radius: 999px;
      background: #0f172a;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 16px;
      box-shadow: 0 12px 30px rgba(2, 6, 23, 0.35);
      cursor: pointer;
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
      launcher.className = `knotic-widget-launcher knotic-${position}`;
      launcher.textContent = config.launcherLabel || "チャット";
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

      const iframe = document.createElement("iframe");
      iframe.className = "knotic-widget-iframe";
      iframe.src = config.embedUrl;
      iframe.loading = "lazy";
      iframe.title = "Knotic Widget Chat";

      const policy = document.createElement("div");
      policy.className = "knotic-widget-policy";
      policy.textContent = policyText;

      header.appendChild(title);
      header.appendChild(actions);
      panel.appendChild(header);
      panel.appendChild(iframe);
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
