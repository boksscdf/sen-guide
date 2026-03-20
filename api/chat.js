// api/chat.js  — Vercel Serverless Function
// The ANTHROPIC_API_KEY lives only in Vercel environment variables.
// The browser never sees it.

export default async function handler(req, res) {
  // ── Only allow POST ──────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Basic rate-limit hint via Vercel Edge headers (optional) ─────────────────
  res.setHeader("X-Content-Type-Options", "nosniff");

  const { userText, systemText } = req.body;

  if (!userText || typeof userText !== "string") {
    return res.status(400).json({ error: "Missing userText" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemText || "You are a helpful assistant.",
        messages: [{ role: "user", content: userText }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Anthropic API error" });
    }

    const text = data.content?.find(b => b.type === "text")?.text || "";
    return res.status(200).json({ text });

  } catch (err) {
    console.error("API proxy error:", err);
    return res.status(500).json({ error: "Server error, please try again" });
  }
}
