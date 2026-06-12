# AI Token Meter

A Chrome extension that displays an estimated real-time token usage overlay directly on the **Claude.ai** and **ChatGPT** web interfaces — so you always know how close you are to hitting the context limit.

![badge](https://img.shields.io/badge/manifest-v3-blue) ![badge](https://img.shields.io/badge/platforms-Claude%20%7C%20ChatGPT-orange)

## ✨ Features

- 📊 Floating, collapsible widget showing estimated token usage
- 🟢🟡🔴 Color-coded progress bar (green → yellow → red as you approach the limit)
- 🔄 Live updates as the conversation grows (via DOM observation)
- 🧩 Works on both **claude.ai** and **chatgpt.com / chat.openai.com**
- 🪶 Lightweight — no external API calls, no data leaves your browser

## ⚠️ Important Note on Accuracy

This extension estimates token counts using a heuristic (~4 characters per token, blended with word-count analysis). It does **not** call the actual tokenizers used by Anthropic or OpenAI, since those aren't exposed to the page. Counts will be **close but not exact** — treat them as a guide, not a precise measurement.

## 📦 Installation

1. Clone or download this repository
   ```bash
   git clone https://github.com/<your-username>/ai-token-meter.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the project folder

## 🚀 Usage

1. Navigate to [claude.ai](https://claude.ai) or [chatgpt.com](https://chatgpt.com)
2. A floating widget appears in the bottom-right corner showing:
   - Estimated tokens used
   - Context window limit for the detected model
   - Percentage of context used
   - Number of messages/elements in the conversation
3. Click the widget header to collapse/expand it

## 🗂️ Project Structure

```
ai-token-meter/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Background service worker
├── tokenizer.js         # Lightweight token estimation logic
├── claude.js            # Content script for Claude.ai
├── chatgpt.js           # Content script for ChatGPT
├── overlay.css          # Styling for the floating widget
├── popup.html           # Toolbar popup
└── icons/                # Extension icons
```

## 🛣️ Roadmap

- [ ] Integrate exact tokenizers (tiktoken / Claude tokenizer) for precise counts
- [ ] Support additional models (Gemini, Mistral, etc.)
- [ ] Per-message token breakdown
- [ ] Customizable widget position and theme
- [ ] Usage history and session statistics

## 🤝 Contributing

Pull requests are welcome! Feel free to open an issue for bugs, feature requests, or improvements.

## 📄 License

[MIT](LICENSE)