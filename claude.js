// claude.js
(function () {
  const MODEL_LIMITS = {
    "Claude Sonnet 4.6": 200000,
    "Claude Opus 4.6": 200000,
    "Default": 200000
  };

  let widget, fillEl, usedEl, limitEl, pctEl, msgCountEl;
  let collapsed = false;

  // Track the highest token count seen across scroll positions,
  // and accumulate per-message token counts so scrolling away
  // doesn't make the total drop.
  let seenMessageTokens = new Map(); // key: message text hash -> token count
  let runningTotal = 0;

  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return hash;
  }

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
        <div class="att-row"><span>Total estimated tokens</span><span class="att-value" id="att-used">0</span></div>
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

  function getVisibleMessages() {
    const selectors = [
      '[data-testid="user-message"]',
      '[data-testid="user-turn"]',
      '[data-testid="message-content"]',
      '.font-claude-message',
      '.font-user-message',
      'div[data-test-render-count]'
    ];

    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) return Array.from(found);
    }
    return [];
  }

  function getModelLimit() {
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
      const shortName = key.split(" ").slice(1).join(" ");
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

    const messages = getVisibleMessages();

    // Add any newly-seen messages to the running total.
    // Each unique message (by content hash) is only counted once,
    // so re-scrolling past it doesn't double-count, and scrolling
    // away doesn't remove it from the total.
    messages.forEach((el) => {
      const text = el.innerText || "";
      if (!text.trim()) return;
      const key = hashText(text);
      if (!seenMessageTokens.has(key)) {
        const tokens = window.__aiTokenEstimator.estimateTokens(text);
        seenMessageTokens.set(key, tokens);
        runningTotal += tokens;
      }
    });

    const { limit } = getModelLimit();
    const pct = Math.min(100, (runningTotal / limit) * 100);

    usedEl.textContent = runningTotal.toLocaleString();
    limitEl.textContent = limit.toLocaleString();
    pctEl.textContent = pct.toFixed(1) + "%";
    msgCountEl.textContent = `${seenMessageTokens.size} messages seen`;
    fillEl.style.width = pct + "%";

    fillEl.classList.remove("warn", "danger");
    if (pct > 85) fillEl.classList.add("danger");
    else if (pct > 60) fillEl.classList.add("warn");

    console.debug("[AI Token Meter] running total:", runningTotal, "| unique messages:", seenMessageTokens.size);
  }

  // Reset the running total when navigating to a different conversation
  function resetIfNewConversation() {
    const currentUrl = location.href;
    if (window.__attLastUrl && window.__attLastUrl !== currentUrl) {
      seenMessageTokens = new Map();
      runningTotal = 0;
    }
    window.__attLastUrl = currentUrl;
  }

  createWidget();
  resetIfNewConversation();
  updateUsage();

  const observer = new MutationObserver(() => {
    resetIfNewConversation();
    clearTimeout(window.__attDebounce);
    window.__attDebounce = setTimeout(updateUsage, 600);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(() => {
    resetIfNewConversation();
    updateUsage();
  }, 5000);
})();