# 18: Expert console mock (shown, not built)

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app, static or seeded data
**Build Board:** new (supports T-13 video, T-14 slides) · **Cut candidate**

**What to build:** For the video and slides, a believable Seller side: the Buyer / Seller segmented control switches to an expert console with Agent version (sources, rules, test results, Authorise), Review queue (Approve / Edit & approve) and Orders (status, revenue, ratings). Nothing writes; buttons show a "demo" toast.

**Blocked by:** 14 (Browse + agent page)

**Status:** ready-for-agent

- [ ] Segmented control Buyer / Seller in the top bar
- [ ] Three console screens with realistic static content for the Lozenets expert
- [ ] Every action button shows "Demo only" and changes nothing
- [ ] Clearly reads as shown-not-built if a judge clicks around

**Starter prompt:**
> Add a Buyer / Seller segmented control in the top bar. Seller shows an Expert console for the demo expert with three tabs: "Agent version" (list of sources with as-of dates, rules like "ignore deals older than 6 months" and "adjust for floor and parking", test cases with pass/fail, an "Authorise v3" button), "Review queue" (two tier-2 tasks with the automated answer and "Approve" / "Edit & approve") and "Orders" (status, revenue in USDC, ratings). Use static data. Every button shows a toast "Demo only". Do not create or change any Supabase tables.
