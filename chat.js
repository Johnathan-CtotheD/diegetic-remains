// Netlify serverless proxy for the railway-station PoC.
// Purpose: keep your Anthropic API key on the server. It is NEVER sent to the browser.
//
// Setup (once):
//  1. Put this file at:  netlify/functions/chat.js  in your site repo (Netlify's default functions folder).
//  2. Get an API key from https://console.anthropic.com  (Settings -> API keys). The API is paid, usage-based.
//  3. In Netlify:  Site settings -> Environment variables -> add  ANTHROPIC_API_KEY = sk-ant-...
//  4. In the PoC's HTML, change the one fetch URL inside the claude() function from
//        https://api.anthropic.com/v1/messages
//     to
//        /.netlify/functions/chat
//     (the body it already sends — system + messages + max_tokens — is forwarded as-is).
//
// The front-end no longer sends a model; this file picks it, so there's one place to change it.

const MODEL = "claude-sonnet-5"; // a current public model. Confirm the latest IDs in the docs:
                                 // https://docs.claude.com/en/api/overview  (the preview's "claude-sonnet-4-6"
                                 // is an in-app alias and will NOT work against your own key).

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST only" };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set in Netlify env vars" }) };
  }
  try {
    const inb = JSON.parse(event.body || "{}");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: inb.max_tokens || 1000,
        system: inb.system,
        messages: inb.messages
      })
    });
    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
