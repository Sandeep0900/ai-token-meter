// tokenizer.js
// Lightweight approximate tokenizer (GPT/Claude-style ~4 chars per token,
// adjusted slightly for whitespace and punctuation density).
// This is an ESTIMATE only — not a byte-exact BPE tokenizer.

function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;

  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;

  // Base estimate: ~4 characters per token
  const charBased = trimmed.length / 4;

  // Word-based estimate: ~0.75 tokens per word (English average)
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const wordBased = words / 0.75;

  // Average the two heuristics for a more stable estimate
  const estimate = (charBased + wordBased) / 2;

  return Math.max(1, Math.round(estimate));
}

// Expose globally for content scripts
window.__aiTokenEstimator = { estimateTokens };
