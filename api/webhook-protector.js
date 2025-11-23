// api/webhook-protector.js

module.exports = async (req, res) => {
  // Chỉ cho phép POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check API key (bảo vệ không cho người lạ spam vào Protector)
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Lấy body (script Luau gửi JSON)
  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (e) {
      body = {};
    }
  }

  // Lấy các trường mà script đang gửi
  const {
    content,
    embeds,
    everyone,
    public_embeds,
    top_embeds,
  } = body;

  // Hàm gửi lên Discord
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

  // 1) Webhook THƯỜNG (main): cho phép content + ping (tùy `everyone`)
  if (process.env.MAIN_WEBHOOK) {
    const allowed_mentions = everyone
      ? { parse: ["everyone"] }   // cho @everyone
      : { parse: [] };            // không ping ai

    await postToDiscord(process.env.MAIN_WEBHOOK, {
      content: typeof content === "string" ? content : "",
      embeds: Array.isArray(embeds) ? embeds : [],
      allowed_mentions,
    });
  }

  // 2) Webhook PUBLIC: CHỈ EMBED, KHÔNG CONTENT, KHÔNG PING
  if (process.env.PUBLIC_WEBHOOK) {
    await postToDiscord(process.env.PUBLIC_WEBHOOK, {
      content: "",
      embeds: Array.isArray(public_embeds) ? public_embeds : [],
      allowed_mentions: { parse: [] }, // tuyệt đối không ping
    });
  }

  // 3) Webhook TOP HIT: CHỈ EMBED, KHÔNG CONTENT, KHÔNG PING
  if (process.env.TOP_HIT_WEBHOOK) {
    await postToDiscord(process.env.TOP_HIT_WEBHOOK, {
      content: "",
      embeds: Array.isArray(top_embeds) ? top_embeds : [],
      allowed_mentions: { parse: [] },
    });
  }

  return res.status(200).json({ ok: true });
};
