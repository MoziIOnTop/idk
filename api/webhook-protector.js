// api/webhook-protector.js

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (e) {
      body = {};
    }
  }

  // Chỉ cần mấy field này cho public/top
  const { public_embeds, top_embeds } = body;

  async function postToDiscord(url, payload) {
    if (!url) return;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Error sending to Discord:", err);
    }
  }

  // 1) PUBLIC: CHỈ EMBED, KHÔNG CONTENT, KHÔNG PING
  if (process.env.PUBLIC_WEBHOOK) {
    await postToDiscord(process.env.PUBLIC_WEBHOOK, {
      content: "",
      embeds: Array.isArray(public_embeds) ? public_embeds : [],
      allowed_mentions: { parse: [] },
    });
  }

  // 2) TOP HIT: CHỈ EMBED, KHÔNG CONTENT, KHÔNG PING
  if (process.env.TOP_HIT_WEBHOOK) {
    await postToDiscord(process.env.TOP_HIT_WEBHOOK, {
      content: "",
      embeds: Array.isArray(top_embeds) ? top_embeds : [],
      allowed_mentions: { parse: [] },
    });
  }

  return res.status(200).json({ ok: true });
};
