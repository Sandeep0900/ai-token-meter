// chatgpt.js
(function () {
  const MODEL_LIMITS = {
    "gpt-4o": 128000,
    "gpt-4": 128000,
    "gpt-3.5": 16000,
    "o1": 200000,
    "Default": 128000
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
          <span class="att-icon chatgpt">G</span>
          <span>ChatGPT Token Usage</span>
        </div>
        <span class="att-toggle">▾</span>
      </div>
      <div class="att-body">
        <div class="att-row"><span>Estimated tokens</span><span class="att-value" id="att-used">0</span></div>
        <div class="att-row"><span>Context limit</span><span class="att-value" id="att-limit">128,000</span></div>
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
        widget.innerHTML = '<span class="att-collapsed-icon">🟢</span>';
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
    // ChatGPT messages use [data-message-author-role]
    const turns = document.querySelectorAll("[data-message-author-role]");
    let text = "";
    if (turns.length > 0) {
      turns.forEach((t) => (text += t.innerText + "\n"));
    } else {
      const main = document.querySelector("main");
      if (main) text = main.innerText;
    }
    return { text, count: turns.length };
  }

  function getModelLimit() {
    let modelName = "Default";
    const modelEl = document.querySelector('[data-testid="model-switcher-dropdown-button"]');
    if (modelEl) modelName = modelEl.textContent.trim().toLowerCase();

    for (const key of Object.keys(MODEL_LIMITS)) {
      if (modelName.includes(key.toLowerCase())) {
        return { limit: MODEL_LIMITS[key], name: key };
      }
    }
    return { limit: MODEL_LIMITS["Default"], name: modelName || "ChatGPT" };
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
    msgCountEl.textContent = `${count} messages`;
    fillEl.style.width = pct + "%";

    fillEl.classList.remove("warn", "danger");
    if (pct > 85) fillEl.classList.add("danger");
    else if (pct > 60) fillEl.classList.add("warn");
  }

  createWidget();
  updateUsage();

  const observer = new MutationObserver(() => {
    clearTimeout(window.__attDebounce);
    window.__attDebounce = setTimeout(updateUsage, 600);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(updateUsage, 5000);
})();
