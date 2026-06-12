// claude.js
(function () {
  const MODEL_LIMITS = {
    "Claude Sonnet 4.6": 200000,
    "Claude Opus 4.6": 200000,
    "Default": 200000
  };

  let widget, fillEl, usedEl, limitEl, pctEl, msgCountEl;
  let collapsed = false;

  function createWidget() {
    if (document.getElementById("ai-token-tracker-widget")) return;

    widget = document.createElement("div");
    widget.id = "ai-token-tracker-widget";
    widget.innerHTML = `
      <div class="att-header">
        <div class="att-title">
          <span class="att-icon claude">C</span>
          <span>Claude Token Usage</span>
        </div>
        <span class="att-toggle">▾</span>
      </div>
      <div class="att-body">
        <div class="att-row"><span>Estimated tokens</span><span class="att-value" id="att-used">0</span></div>
        <div class="att-row"><span>Context limit</span><span class="att-value" id="att-limit">200,000</span></div>
        <div class="att-bar-container"><div class="att-bar-fill" id="att-fill" style="width:0%"></div></div>
        <div class="att-row"><span id="att-pct">0%</span><span id="att-msgcount">0 messages</span></div>
        <div class="att-footer">Estimates only, not exact</div>
      </div>
    `;
    document.body.appendChild(widget);

    fillEl = widget.querySelector("#att-fill");
    usedEl = widget.querySelector("#att-used");
    limitEl = widget.querySelector("#att-limit");
    pctEl = widget.querySelector("#att-pct");
    msgCountEl = widget.querySelector("#att-msgcount");

    widget.querySelector(".att-header").addEventListener("click", () => {
      collapsed = !collapsed;
      widget.classList.toggle("collapsed", collapsed);
      if (collapsed) {
        widget.innerHTML = '<span class="att-collapsed-icon">🟠</span>';
        widget.addEventListener("click", expandOnce, { once: true });
      }
    });
  }

  function expandOnce() {
    collapsed = false;
    widget.classList.remove("collapsed");
    widget.innerHTML = "";
    widget.remove();
    createWidget();
    updateUsage();
  }

  function getConversationText() {
    // Try multiple known/likely selectors for Claude.ai message turns,
    // since the DOM structure changes between releases.
    const selectors = [
      '[data-testid="user-message"]',
      '[data-testid="user-turn"]',
      '[data-testid="message-content"]',
      '.font-claude-message',
      '.font-user-message',
      'div[data-test-render-count]' // generic message wrapper seen in some builds
    ];

    let turns = [];
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) {
        turns = Array.from(found);
        break;
      }
    }

    let text = "";

    if (turns.length > 0) {
      turns.forEach((t) => (text += t.innerText + "\n"));
    }

    // Fallback / supplement: if nothing matched or text is suspiciously empty,
    // grab the main conversation column directly.
    if (text.trim().length === 0) {
      const main =
        document.querySelector('main [class*="conversation"]') ||
        document.querySelector("main") ||
        document.body;
      if (main) text = main.innerText;
      turns = []; // can't get a reliable count in fallback mode
    }

    return { text, count: turns.length };
  }

  function getModelLimit() {
    // Try multiple selectors to detect the model name from the UI
    const selectors = [
      '[data-testid="model-selector-dropdown"]',
      'button[data-testid*="model"]',
      '[aria-haspopup="menu"][class*="model"]'
    ];

    let modelName = "";
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        modelName = el.textContent.trim();
        break;
      }
    }

    for (const key of Object.keys(MODEL_LIMITS)) {
      if (key === "Default") continue;
      const shortName = key.split(" ").slice(1).join(" "); // e.g. "Sonnet 4.6"
      if (modelName.includes(shortName) || modelName.includes(shortName.split(" ")[0])) {
        return { limit: MODEL_LIMITS[key], name: key };
      }
    }
    return { limit: MODEL_LIMITS["Default"], name: modelName || "Claude" };
  }

  function updateUsage() {
    if (!widget || !document.body.contains(widget)) {
      createWidget();
    }
    const { text, count } = getConversationText();
    const tokens = window.__aiTokenEstimator.estimateTokens(text);
    const { limit } = getModelLimit();
    const pct = Math.min(100, (tokens / limit) * 100);

    usedEl.textContent = tokens.toLocaleString();
    limitEl.textContent = limit.toLocaleString();
    pctEl.textContent = pct.toFixed(1) + "%";
    msgCountEl.textContent = count > 0 ? `${count} messages` : "—";
    fillEl.style.width = pct + "%";

    fillEl.classList.remove("warn", "danger");
    if (pct > 85) fillEl.classList.add("danger");
    else if (pct > 60) fillEl.classList.add("warn");

    console.debug("[AI Token Meter] tokens:", tokens, "| chars:", text.length, "| turns:", count);
  }

  // Initial setup
  createWidget();
  updateUsage();

  // Observe DOM changes to update live
  const observer = new MutationObserver(() => {
    clearTimeout(window.__attDebounce);
    window.__attDebounce = setTimeout(updateUsage, 600);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Periodic refresh as fallback
  setInterval(updateUsage, 5000);
})();
