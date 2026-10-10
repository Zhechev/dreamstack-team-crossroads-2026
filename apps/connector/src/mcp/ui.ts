// Inline cards for find_expert, rendered in the chat by hosts that support MCP Apps (ticket 23, spec 2026-01-26).
// Self-contained HTML (no external fonts or scripts), so the host's default CSP applies. Hosts without MCP Apps
// ignore the _meta link and show the tool's text result as before.
import type { McpServer } from "@modelcontextprotocol/server";

export const EXPERT_CARDS_URI = "ui://citable/find-expert.html";
export const MCP_APP_MIME = "text/html;profile=mcp-app";

/** Tool _meta that links a tool to a view; the flat key is the deprecated pre-GA spelling, kept for older hosts. */
export const uiMeta = (resourceUri: string) => ({ ui: { resourceUri }, "ui/resourceUri": resourceUri });

export function registerUi(server: McpServer): void {
  server.registerResource(
    "find-expert-cards",
    EXPERT_CARDS_URI,
    { title: "Expert cards", description: "The top expert agents as cards", mimeType: MCP_APP_MIME },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: MCP_APP_MIME, text: EXPERT_CARDS_HTML, _meta: { ui: { prefersBorder: false } } }],
    }),
  );
}

// Brand tokens from docs/01 Product/Brand.md (ink/paper/seal, iOS-style grouped cards).
// The script avoids backticks and ${} so it can live in this template literal.
export const EXPERT_CARDS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Citable experts</title>
<style>
  :root {
    --ink: #1B2A41; --paper: #F7F5F0; --card: #FFFFFF; --sep: #D9D4C7;
    --seal: #B4532A; --verified: #2E7D4F; --muted: #5E6673; --on-ink: #FFFFFF;
    --shadow: 0 1px 2px rgba(27, 42, 65, .06), 0 4px 14px rgba(27, 42, 65, .06);
  }
  :root[data-theme="dark"] {
    --ink: #ECE8DF; --paper: #141C2B; --card: #1C2638; --sep: #2C3850;
    --verified: #5FBF86; --muted: #A3ABB8; --on-ink: #141C2B; --shadow: none;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: transparent; }
  body {
    font: 15px/1.4 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    color: var(--ink); padding: 4px 2px 8px;
  }
  header { display: flex; align-items: baseline; gap: 8px; padding: 0 4px 10px; }
  .mark { font-family: "Source Serif 4", Georgia, serif; font-weight: 600; font-size: 16px; }
  .mark b { color: var(--seal); font-weight: 600; }
  header .sub { color: var(--muted); font-size: 13px; }
  .list { display: grid; gap: 10px; }
  .card {
    background: var(--card); border: 1px solid var(--sep); border-radius: 16px;
    box-shadow: var(--shadow); padding: 14px 16px; display: grid; gap: 10px;
  }
  .card.best { border-color: var(--seal); }
  .top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
  .name { font-weight: 600; font-size: 16px; }
  .who { color: var(--muted); font-size: 13px; margin-top: 2px; }
  .price { text-align: right; white-space: nowrap; }
  .price strong { color: var(--seal); font-size: 17px; }
  .price span { display: block; color: var(--muted); font-size: 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; font-size: 13px; color: var(--muted); }
  .pill {
    display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--sep);
    border-radius: 999px; padding: 2px 9px; color: var(--verified); font-weight: 500;
  }
  .best-tag { color: var(--seal); font-weight: 600; }
  .off { color: var(--muted); }
  button {
    min-height: 44px; border: 0; border-radius: 999px; padding: 0 18px; width: 100%;
    font: inherit; font-weight: 600; cursor: pointer; background: var(--ink); color: var(--on-ink);
    transition: transform .25s cubic-bezier(.2, .9, .3, 1.2), opacity .2s;
  }
  button.secondary { background: transparent; color: var(--ink); border: 1px solid var(--sep); }
  button:active { transform: scale(.97); }
  button:disabled { opacity: .55; cursor: default; }
  .empty, .wait { color: var(--muted); padding: 14px 4px; }
</style>
</head>
<body>
<header><span class="mark">Citable <b>[&#10003;]</b></span><span class="sub" id="sub">Finding expert agents&hellip;</span></header>
<main id="root"><div class="wait">Waiting for results&hellip;</div></main>
<script>
(function () {
  var nextId = 1, pending = {}, question = "";
  var root = document.getElementById("root"), sub = document.getElementById("sub");

  function send(msg) { window.parent.postMessage(Object.assign({ jsonrpc: "2.0" }, msg), "*"); }
  function request(method, params) {
    var id = nextId++;
    send({ id: id, method: method, params: params });
    return new Promise(function (resolve, reject) { pending[id] = { resolve: resolve, reject: reject }; });
  }
  function notify(method, params) { send({ method: method, params: params || {} }); }

  function applyContext(ctx) {
    if (ctx && ctx.theme) document.documentElement.setAttribute("data-theme", ctx.theme);
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  var lastHeight = 0;
  function reportSize() {
    var height = Math.ceil(document.body.getBoundingClientRect().height);
    if (height === lastHeight) return;
    lastHeight = height;
    notify("ui/notifications/size-changed", { height: height });
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function priceOf(agent) {
    var caps = (agent.capabilities || []).filter(function (c) { return c.available_now; });
    var cap = caps[0] || (agent.capabilities || [])[0];
    return cap ? { text: (cap.price_is_minimum ? "from " : "") + cap.price + " USDC", name: cap.name, live: cap.available_now } : null;
  }

  function card(agent, best) {
    var c = el("article", "card" + (best ? " best" : ""));
    var top = el("div", "top"), left = el("div");
    left.appendChild(el("div", "name", agent.name));
    left.appendChild(el("div", "who", agent.expert + " \\u00b7 " + agent.area));
    top.appendChild(left);
    var p = priceOf(agent);
    if (p) {
      var price = el("div", "price");
      price.appendChild(el("strong", "", p.text));
      price.appendChild(el("span", "", p.name));
      top.appendChild(price);
    }
    c.appendChild(top);

    var meta = el("div", "meta");
    if (best) meta.appendChild(el("span", "best-tag", "Best match"));
    meta.appendChild(el("span", "pill", "[\\u2713] " + agent.badge));
    meta.appendChild(el("span", "", agent.rating === null ? "No ratings yet" : "\\u2605 " + agent.rating.toFixed(1) + " (" + agent.rating_count + ")"));
    if (p && !p.live) meta.appendChild(el("span", "off", "Not available now"));
    c.appendChild(meta);

    var btn = el("button", best ? "" : "secondary", "Check with this expert");
    btn.addEventListener("click", function () {
      btn.disabled = true;
      btn.textContent = "Asking Claude\\u2026";
      var text = "Check with " + agent.name + " (agent_id " + agent.agent_id + "). Run the free evaluation first." +
        (question ? "\\nMy question: " + question : "");
      request("ui/message", { role: "user", content: [{ type: "text", text: text }] }).then(
        function () { btn.textContent = "Sent to Claude"; },
        function () { btn.disabled = false; btn.textContent = "Check with this expert"; }
      );
    });
    c.appendChild(btn);
    return c;
  }

  function render(result) {
    var data = result && result.structuredContent;
    if (!data && result && result.content && result.content[0] && result.content[0].type === "text") {
      try { data = JSON.parse(result.content[0].text); } catch (e) { data = null; }
    }
    root.textContent = "";
    if (!data || result.isError) {
      sub.textContent = "";
      root.appendChild(el("div", "empty", "Couldn't load expert agents."));
      reportSize();
      return;
    }
    var agents = data.agents || [];
    sub.textContent = agents.length ? "Top " + agents.length + " expert-verified agents" : "";
    if (!agents.length) {
      root.appendChild(el("div", "empty", data.note || "No verified agent covers this yet."));
      reportSize();
      return;
    }
    var list = el("div", "list");
    agents.forEach(function (a, i) { list.appendChild(card(a, i === 0)); });
    root.appendChild(list);
    reportSize();
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var msg = event.data;
    if (!msg || msg.jsonrpc !== "2.0") return;
    if (msg.id !== undefined && pending[msg.id] && !msg.method) {
      var p = pending[msg.id];
      delete pending[msg.id];
      if (msg.error) p.reject(msg.error); else p.resolve(msg.result);
      return;
    }
    if (msg.method === "ui/notifications/tool-input") {
      question = (msg.params && msg.params.arguments && msg.params.arguments.question) || "";
    } else if (msg.method === "ui/notifications/tool-result") {
      render(msg.params);
    } else if (msg.method === "ui/notifications/host-context-changed") {
      applyContext(msg.params);
    } else if (msg.id !== undefined && msg.method) {
      send({ id: msg.id, result: {} });
    }
  });

  // Report height after each render too: some hosts throttle ResizeObserver in hidden or sandboxed frames.
  if (window.ResizeObserver) new ResizeObserver(reportSize).observe(document.body);

  request("ui/initialize", {
    appInfo: { name: "citable-expert-cards", version: "1.0.0" },
    appCapabilities: {},
    protocolVersion: "2026-01-26"
  }).then(function (res) {
    applyContext(res && res.hostContext);
    notify("ui/notifications/initialized");
  });
})();
</script>
</body>
</html>
`;
