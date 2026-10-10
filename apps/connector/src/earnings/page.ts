// Live earnings pages (Brand: Paper, Ink, one Seal accent): one expert's payouts, or Citable's fees.
// Rendered client-side from the feed, so buyer text only ever reaches the DOM through textContent.
import type { CitableEarnings, Earnings } from "./store.js";

const POLL_MS = 2000;

/** JSON safe to drop inside a <script> element. */
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

/** Maps a feed to what the shared renderer shows: { title, sub, big, stats, rows, toast, wallet? }. */
const EXPERT_VIEW = `(e) => ({
  title: e.agent.expert,
  sub: e.agent.name,
  bigLabel: "Payout wallet",
  big: e.balance === null ? null : Number(e.balance),
  stats: [["Earned on Citable", e.total + " USDC"], ["Answers sold", e.count]],
  rows: e.payments.map((p) => ({ id: p.orderId, text: p.question, amount: p.amount, meta: [] , txHash: p.txHash, at: p.at })),
  toast: (p) => "+" + p.amount + " USDC · answer sold",
  wallet: e.agent.payoutAddress,
})`;

const CITABLE_VIEW = `(e) => ({
  title: "Citable revenue",
  sub: "All expert agents",
  bigLabel: "Fees earned",
  big: Number(e.fees),
  stats: [["Paid to experts", e.paidToExperts + " USDC"], ["Answers sold", e.count], ["Experts earning", e.experts]],
  rows: e.payments.map((p) => ({ id: p.orderId, text: p.question, amount: p.fee, meta: [p.expert, p.amount + " paid · " + p.expertShare + " to expert"], txHash: p.txHash, at: p.at })),
  toast: (p) => "+" + p.amount + " USDC · Citable fee",
})`;

export const earningsPage = (initial: Earnings) => page({ console: "Expert console", listTitle: "Incoming payments", view: EXPERT_VIEW, initial });
export const citableEarningsPage = (initial: CitableEarnings) => page({ console: "Marketplace", listTitle: "Incoming fees", view: CITABLE_VIEW, initial });

function page(opts: { console: string; listTitle: string; view: string; initial: unknown }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Earnings · Citable</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #1B2A41; --paper: #F7F5F0; --card: #FFFFFF; --sep: #D9D4C7;
    --seal: #B4532A; --verified: #2E7D4F; --muted: #5E6673;
  }
  @media (prefers-color-scheme: dark) {
    :root { --ink: #ECE8DF; --paper: #141C2B; --card: #1B2537; --sep: #2C3850; --muted: #9AA3B2; }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font: 16px/1.4 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  }
  main { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
  .brand { font: 600 20px "Source Serif 4", Georgia, serif; display: flex; gap: 8px; align-items: baseline; }
  .brand .check { color: var(--seal); }
  .brand small { font: 500 13px -apple-system, BlinkMacSystemFont, "Inter", sans-serif; color: var(--muted); letter-spacing: .04em; text-transform: uppercase; }
  h1 { font: 600 32px/1.15 "Source Serif 4", Georgia, serif; margin: 20px 0 2px; }
  .sub { color: var(--muted); margin: 0 0 20px; }
  .card { background: var(--card); border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; }
  .label { color: var(--muted); font-size: 13px; letter-spacing: .04em; text-transform: uppercase; }
  .balance { font: 600 56px/1.1 "Source Serif 4", Georgia, serif; margin: 6px 0; font-variant-numeric: tabular-nums; transition: color .6s; }
  .balance.bump { color: var(--seal); }
  .balance span { font-size: 22px; color: var(--muted); }
  .stats { display: flex; gap: 24px; color: var(--muted); font-size: 15px; }
  .stats b { color: var(--ink); font-variant-numeric: tabular-nums; }
  .live { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); float: right; }
  .live::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--verified); animation: pulse 2s infinite; }
  @keyframes pulse { 50% { opacity: .3; } }
  h2 { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); margin: 28px 4px 8px; font-weight: 500; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 14px 20px; border-top: 1px solid var(--sep); }
  li:first-child { border-top: 0; }
  li.new { animation: land 1.6s ease-out; }
  @keyframes land { 0% { background: color-mix(in srgb, var(--verified) 22%, transparent); transform: translateY(-8px); opacity: 0; } 20% { opacity: 1; transform: none; } }
  .q { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { color: var(--verified); font-weight: 600; font-variant-numeric: tabular-nums; }
  .meta { grid-column: 1 / -1; font-size: 13px; color: var(--muted); }
  .meta a { color: var(--muted); font: 12px "JetBrains Mono", ui-monospace, monospace; }
  .empty { padding: 20px; color: var(--muted); }
  .toast {
    position: fixed; left: 50%; top: 20px; transform: translate(-50%, calc(-100% - 40px)); transition: transform .35s cubic-bezier(.2,1.4,.4,1);
    background: var(--verified); color: #fff; padding: 12px 20px; border-radius: 999px; font-weight: 600; box-shadow: 0 6px 20px rgba(0,0,0,.18);
  }
  .toast.show { transform: translate(-50%, 0); }
  footer { margin-top: 24px; font-size: 13px; color: var(--muted); }
  footer a { color: var(--muted); }
</style>
</head>
<body>
<div class="toast" id="toast"></div>
<main>
  <div class="brand"><span>[<span class="check">✓</span>] Citable</span><small>${opts.console}</small></div>
  <h1 id="title"></h1>
  <p class="sub" id="sub"></p>

  <section class="card">
    <span class="live">Live</span>
    <div class="label" id="bigLabel"></div>
    <div class="balance" id="balance"></div>
    <div class="stats" id="stats"></div>
  </section>

  <h2>${opts.listTitle}</h2>
  <section class="card" style="padding:0"><ul id="payments"></ul></section>

  <footer>Base Sepolia testnet · paid per answer over x402<span id="walletLine"> · wallet <a id="wallet" target="_blank" rel="noopener"></a></span></footer>
</main>
<script>
const FEED = location.pathname.replace(/\\/$/, "") + "/feed";
const TX = "https://sepolia.basescan.org/tx/";
const ADDR = "https://sepolia.basescan.org/address/";
const view = ${opts.view};
const $ = (id) => document.getElementById(id);
let seen = null;
let shownBalance = null;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function animateBalance(to) {
  const from = shownBalance ?? to;
  shownBalance = to;
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, Math.max(0, (t - start) / 900));
    const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
    $("balance").firstChild.textContent = v.toFixed(2) + " ";
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function toast(text) {
  const t = $("toast");
  t.textContent = text;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

function render(feed) {
  const v = view(feed);
  $("title").textContent = v.title;
  $("sub").textContent = v.sub;
  $("bigLabel").textContent = v.bigLabel;
  $("stats").replaceChildren(...v.stats.map(([label, value]) => {
    const d = el("div", "", label + " ");
    d.append(el("b", "", String(value)));
    return d;
  }));
  if (v.wallet) {
    $("wallet").textContent = v.wallet.slice(0, 6) + "…" + v.wallet.slice(-4);
    $("wallet").href = ADDR + v.wallet;
  } else $("walletLine")?.remove();

  if (!$("balance").firstChild) $("balance").append(document.createTextNode(""), el("span", "", "USDC"));
  if (v.big === null) $("balance").firstChild.textContent = "— ";
  else animateBalance(v.big);

  const fresh = seen === null ? [] : v.rows.filter((r) => !seen.has(r.id));
  seen = new Set(v.rows.map((r) => r.id));

  const list = $("payments");
  list.replaceChildren();
  if (v.rows.length === 0) list.append(el("li", "empty", "No answers sold yet. Ask Claude a price question."));
  for (const r of v.rows) {
    const li = el("li", fresh.includes(r) ? "new" : "");
    li.append(el("div", "q", r.text), el("div", "amt", "+" + r.amount + " USDC"));
    const time = new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const meta = el("div", "meta", [time, ...r.meta, ""].join(" · "));
    const a = el("a", "", r.txHash.slice(0, 10) + "…" + r.txHash.slice(-6));
    a.href = TX + r.txHash; a.target = "_blank"; a.rel = "noopener";
    meta.append(a);
    li.append(meta);
    list.append(li);
  }

  if (fresh.length) {
    $("balance").classList.add("bump");
    setTimeout(() => $("balance").classList.remove("bump"), 1500);
    toast(v.toast(fresh[0]));
  }
}

async function poll() {
  try {
    const res = await fetch(FEED, { cache: "no-store" });
    if (res.ok) render(await res.json());
  } catch {}
  setTimeout(poll, ${POLL_MS});
}

render(${scriptJson(opts.initial)});
setTimeout(poll, ${POLL_MS});
</script>
</body>
</html>`;
}
