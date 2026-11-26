/* ============================================================
   v83 — Procurement, end to end
   A request is approved (by the Super Admin; or by someone else who can open Procurement, within the approval limit
   and the month's budget — never by the person who asked), ordered, shipped and received. Receiving adds what came
   to stock (at the average cost) and makes the bill in Accounts Payable (due after the supplier's payment terms);
   paying the bill there shows here. A part delivery keeps the rest on order. Undoing a receipt takes it back out of
   stock and removes its unpaid bill. Low stock asks for its own reorder (Rules: on unless switched off). Stock taken
   out is logged per item. Suppliers are the CRM's one vendor list (shared with Accounts Payable). Assets are handed to
   real people with a date to come back; overdue or with someone who has left is flagged here and on the Dashboard.
   Everything from before stays: inventory, orders, low stock, issued items, suppliers, analytics, the CSV files.
   ============================================================ */
const LLQA_PROC_CATS = ["Stationery", "Books", "IT Equipment", "Furniture", "Software License", "Office Supplies", "Teaching Material", "Other"];
const LLQA_PROC_UNITS = ["pcs", "box", "pack", "ream", "license", "set", "kg"];
const LLQA_PROC_CURS = ["PKR", "USD", "GBP", "EUR", "AED"];
const LLQA_PROC_AUTH = ["Anyone", "Teachers", "Team Leads", "Managers", "Admin Only"];
const LLQA_PROC_CUSTODY = ["In Store", "Issued", "Returned", "Under Repair", "Lost"];
const LLQA_PROC_COND = ["New", "Good", "Fair", "Damaged"];
const LLQA_PO_STATES = {
  Requested: ["To approve", "warn"],
  Approved: ["Approved", "accent"],
  Rejected: ["Rejected", "danger"],
  Ordered: ["Ordered", "accent"],
  Shipped: ["Shipped", "accent"],
  Received: ["Received", "success"],
  Cancelled: ["Cancelled", "textMuted"],
};
const LLQA_PO_OPEN = ["Requested", "Approved", "Ordered", "Shipped"];
const LLQA_PO_SPENT = ["Approved", "Ordered", "Shipped", "Received"];
try {
  if (typeof LLQA_EMOJI_ICON === "object" && LLQA_EMOJI_ICON && !LLQA_EMOJI_ICON["📦"]) LLQA_EMOJI_ICON["📦"] = "package";
} catch (e) {}
const llqaPN = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};
const llqaProcNorm = (s) => String(s == null ? "" : s).trim().toLowerCase();
// an order's lines (an order from before v83 had one item: item, qty, unit cost)
const llqaPoLines = (p) => {
  if (!p) return [];
  if (Array.isArray(p.lines) && p.lines.length) return p.lines.filter(Boolean);
  if (!p.item && !llqaPN(p.qty)) return [];
  return [{ id: "l1", itemId: p.itemId != null && p.itemId !== "" ? p.itemId : null, item: p.item || "", unit: p.unit || "", qty: llqaPN(p.qty), unitCost: llqaPN(p.unitCost) }];
};
// what the order comes to (a received order: what came)
const llqaPoTotal = (p) => llqaR2(llqaPoLines(p).reduce((a, l) => a + (p.status === "Received" && l.got != null ? llqaPN(l.got) : llqaPN(l.qty)) * llqaPN(l.unitCost), 0));
const llqaPoPKR = (p, R) => {
  const x = llqaToPKR(llqaPoTotal(p), (p && p.currency) || "PKR", R || llqaFinRates());
  return x.how === "missing" ? null : x.pkr;
};
const llqaPoItems = (p) => llqaPoLines(p).map((l) => llqaPN(l.qty) + " × " + (l.item || "—")).join(", ");
const llqaPoMonth = (p) => String((p && p.date) || "").slice(0, 7);
let llqaPoLastNum = 0;
const llqaPoNext = (pos) => {
  const n = (pos || []).reduce((m, p) => {
    const x = /^PO-(\d+)$/.exec(String((p && p.poNum) || ""));
    return x ? Math.max(m, parseInt(x[1], 10)) : m;
  }, llqaPoLastNum);
  return "PO-" + String(n + 1).padStart(4, "0");
};
// the Super Admin's rules (kept with Finance's data: not on teachers' or families' computers)
const llqaProcRules = () => {
  const s = llqaFinDoc().procRules || {};
  return { limit: llqaPN(s.limit), budgets: s.budgets && typeof s.budgets === "object" ? s.budgets : {}, autoReorder: s.autoReorder !== false };
};
const llqaProcBoss = (u) => {
  const x = u || (LLQAApp.ctx || {}).user;
  return !!x && x.role === "superadmin";
};
// what a category has been given in a month (approved and further), in PKR — the order asked about not counted
const llqaProcSpent = (cat, ym, pos, skipId, R) =>
  (pos || (LLQAApp.ctx || {}).procPurchases || [])
    .filter((p) => p && p.id !== skipId && LLQA_PO_SPENT.includes(p.status) && (p.category || "Other") === cat && llqaPoMonth(p) === ym)
    .reduce((a, p) => a + (llqaPoPKR(p, R) || 0), 0);
// can this person approve this request? { ok, why, over }
const llqaProcCanApprove = (p, opt) => {
  const o = opt || {};
  const ctx = LLQAApp.ctx || {};
  const u = o.user || ctx.user;
  if (!u) return { ok: false, why: "Not signed in." };
  if (!p || p.status !== "Requested") return { ok: false, why: "Only a request waiting for approval." };
  const rules = o.rules || llqaProcRules();
  const amt = llqaPoPKR(p, o.rates);
  const cat = p.category || "Other";
  const budget = llqaPN(rules.budgets[cat]);
  const ym = o.ym || todayPK().slice(0, 7);
  const over = budget > 0 && amt != null && llqaProcSpent(cat, ym, o.pos, p.id, o.rates) + amt > budget;
  if (llqaProcBoss(u)) return { ok: true, over };
  if (!(o.canOpen != null ? o.canOpen : llqaCanOpen("procurement"))) return { ok: false, why: "Approved by people who can open Procurement." };
  if (p.requestedBy && p.requestedBy === (o.actor || llqaPayActor())) return { ok: false, why: "Your own request — someone else approves it." };
  if (amt == null) return { ok: false, why: "No rate for " + p.currency + " (Settings → Payment Gateways) — waits for the Super Admin." };
  if (!(rules.limit > 0)) return { ok: false, why: "Waits for the Super Admin (no approval limit is set in Rules)." };
  if (amt > rules.limit) return { ok: false, why: "Above the approval limit (" + llqaPKR(rules.limit) + ") — waits for the Super Admin." };
  if (over) return { ok: false, why: "Over this month's " + cat + " budget — waits for the Super Admin." };
  return { ok: true, over: false };
};
const llqaProcHash = (s) => {
  let h = 5381;
  const t = String(s);
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return h.toString(36);
};
const llqaProcIsFor = (l, it) => (l.itemId != null && l.itemId !== "" ? String(l.itemId) === String(it.id) : llqaProcNorm(l.item) === llqaProcNorm(it.name));
// items at or under their reorder point with no order open for them: what to ask for, how many, from whom, at what cost
const llqaProcReorders = (inv, pos) => {
  const all = (pos || []).filter(Boolean);
  const open = all.filter((p) => LLQA_PO_OPEN.includes(p.status));
  return (inv || [])
    .filter((it) => it && llqaPN(it.reorderPoint) > 0 && llqaPN(it.onHand) <= llqaPN(it.reorderPoint) && it.custodyStatus !== "Lost" && !open.some((p) => llqaPoLines(p).some((l) => llqaProcIsFor(l, it))))
    .map((it) => {
      const last = all
        .filter((p) => p.status === "Received" && llqaPoLines(p).some((l) => llqaProcIsFor(l, it)))
        .sort((a, b) => String(b.receivedDate || b.date || "").localeCompare(String(a.receivedDate || a.date || "")))[0];
      const ll = last ? llqaPoLines(last).find((l) => llqaProcIsFor(l, it)) : null;
      const qty = llqaPN(it.reorderQty) > 0 ? llqaPN(it.reorderQty) : Math.max(1, llqaPN(it.reorderPoint) * 2 - llqaPN(it.onHand));
      return { it, qty, vendor: String(it.vendor || (last && last.vendor) || "").trim(), unitCost: ll ? llqaPN(ll.unitCost) : llqaPN(it.unitValue), currency: ll ? last.currency || "PKR" : "PKR" };
    });
};
const llqaProcLog = (x, what, at, by) => [...(Array.isArray(x.log) ? x.log : []), { at: at || new Date().toISOString(), by: by || llqaPayActor(), what }].slice(-40);
const llqaProcMoves = (x, qty, what, at, by) => [...(Array.isArray(x.moves) ? x.moves : []), { at: at || new Date().toISOString(), by: by || llqaPayActor(), qty, what }].slice(-60);
// a new request (the Super Admin may order straight away)
const llqaProcRequest = (f) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setProcPurchases !== "function") return null;
  const lines = (f.lines || [])
    .filter((l) => l && String(l.item || "").trim() && llqaPN(l.qty) > 0)
    .map((l, i) => ({ id: "l" + (i + 1), itemId: l.itemId != null && l.itemId !== "" ? l.itemId : null, item: String(l.item).trim(), unit: l.unit || "", qty: llqaPN(l.qty), unitCost: llqaPN(l.unitCost) }));
  if (!lines.length) return null;
  const by = f.auto ? "Autopilot" : llqaPayActor();
  const now = new Date().toISOString();
  const st = f.status === "Ordered" && llqaProcBoss() ? "Ordered" : "Requested";
  const p = {
    id: f.id || llqaUid("po"),
    poNum: llqaPoNext(ctx.procPurchases),
    date: llqaIsDay(f.date) ? f.date : todayPK(),
    vendor: String(f.vendor || "").trim(),
    category: f.category || "Other",
    currency: f.currency || "PKR",
    status: st,
    lines,
    notes: String(f.notes || "").trim(),
    requestedBy: by,
    requestedAt: now,
    auto: !!f.auto,
    log: [{ at: now, by, what: f.auto ? "asked for by the Autopilot (low stock)" : st === "Requested" ? "asked for" : "ordered (approved by the Super Admin)" }],
  };
  if (st === "Ordered") Object.assign(p, { approvedBy: by, approvedAt: now, orderedAt: now });
  let added = false;
  ctx.setProcPurchases((prev) => {
    const list = prev || [];
    if (list.some((x) => x && x.id === p.id)) return list;
    p.poNum = llqaPoNext(list);
    added = true;
    return [...list, p];
  });
  llqaPoLastNum = Math.max(llqaPoLastNum, parseInt(String(p.poNum).slice(3), 10) || 0);
  return added ? p : null;
};
const llqaProcSet = (p, patch, what) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setProcPurchases !== "function" || !p) return false;
  ctx.setProcPurchases((prev) => (prev || []).map((x) => (x && x.id === p.id ? { ...x, ...patch, log: llqaProcLog(x, what) } : x)));
  return true;
};
const llqaProcApprove = (p) => {
  const ok = llqaProcCanApprove(p);
  if (!ok.ok) return ok;
  llqaProcSet(p, { status: "Approved", approvedBy: llqaPayActor(), approvedAt: new Date().toISOString() }, "approved" + (ok.over ? " (over the month's budget)" : ""));
  return ok;
};
const llqaProcApCat = (cat) => (cat === "IT Equipment" || cat === "Furniture" ? "Equipment" : cat === "Software License" ? "Software/SaaS" : "Supplies");
const llqaProcBill = (p) => (p && p.billId != null ? ((LLQAApp.ctx || {}).apLiabilities || []).find((x) => x && x.id === p.billId) || null : null);
// received: stock up (average cost), the bill in Accounts Payable, the rest kept on order — { ok, why, bill, rest }
const llqaProcReceive = (p, got, opt) => {
  const o = opt || {};
  const ctx = LLQAApp.ctx;
  if (!p || !["Approved", "Ordered", "Shipped"].includes(p.status)) return { ok: false, why: "Only an approved, ordered or shipped order is received." };
  if (typeof ctx.setProcInventory !== "function" || typeof ctx.setProcPurchases !== "function") return { ok: false, why: "Stock can't be changed from here." };
  const R = o.rates || llqaFinRates();
  const day = llqaIsDay(o.date) ? o.date : todayPK();
  const by = llqaPayActor();
  const at = new Date().toISOString();
  const lines = llqaPoLines(p).map((l) => {
    const g = got ? got[l.id] : null;
    return { ...l, got: Math.max(0, llqaPN(g != null && g !== "" ? g : l.qty)) };
  });
  if (!lines.some((l) => l.got > 0)) return { ok: false, why: "Nothing received — enter the quantities that came." };
  const stocked = [];
  ctx.setProcInventory((prev) => {
    let inv = (prev || []).slice();
    lines.forEach((l) => {
      if (!(l.got > 0)) return;
      const cost = llqaToPKR(l.unitCost, p.currency || "PKR", R);
      const cp = cost.how === "missing" ? null : cost.pkr;
      let it = l.itemId != null && l.itemId !== "" ? inv.find((x) => x && String(x.id) === String(l.itemId)) : null;
      if (!it) it = inv.find((x) => x && llqaProcNorm(x.name) === llqaProcNorm(l.item));
      let created = false;
      if (!it) {
        created = true;
        it = { id: llqaUid("it"), name: l.item, sku: "", category: p.category || "Other", unit: l.unit || "pcs", onHand: 0, reorderPoint: 0, unitValue: 0, location: "", authorizedFor: "Anyone", custodyStatus: "In Store", issuedTo: "", receiverRole: "", issuedBy: "", issueDate: "", returnDate: "", condition: "New", notes: "Added when " + p.poNum + " was received" };
        inv = [...inv, it];
      }
      const before = { onHand: llqaPN(it.onHand), unitValue: llqaPN(it.unitValue), restocks: llqaPN(it.restocks) };
      const onHand = llqaR2(before.onHand + l.got);
      const unitValue = cp == null ? before.unitValue : llqaR2((Math.max(0, before.onHand) * before.unitValue + l.got * cp) / (Math.max(0, before.onHand) + l.got));
      const id = it.id;
      inv = inv.map((x) => (x && x.id === id ? { ...x, onHand, unitValue, restocks: before.restocks + 1, vendor: x.vendor || p.vendor || "", updated: day, moves: llqaProcMoves(x, l.got, "received — " + p.poNum, at, by) } : x));
      l.itemId = id;
      stocked.push({ itemId: id, qty: l.got, cp, before, created });
    });
    return inv;
  });
  const amount = llqaR2(lines.reduce((a, l) => a + l.got * llqaPN(l.unitCost), 0));
  let bill = null;
  if (amount > 0 && typeof ctx.setApLiabilities === "function") {
    const vd = llqaApVendor(p.vendor) || {};
    bill = llqaApSave({
      vendor: p.vendor || "Supplier",
      category: llqaProcApCat(p.category),
      amount,
      currency: p.currency || "PKR",
      dueDate: llqaAddDays(day, Math.max(0, Math.round(llqaPN(vd.terms)))),
      estimate: false,
      reference: p.poNum,
      notes: "Purchase order " + p.poNum + ": " + lines.filter((l) => l.got > 0).map((l) => l.got + " × " + l.item).join(", "),
      source: { kind: "po", id: p.id, poNum: p.poNum },
      approvedBy: p.approvedBy || by,
      approvedAt: p.approvedAt || at,
    });
    if (bill && o.paidNow) llqaApPay(bill, { amount, date: day, method: o.method || "Cash", ref: p.poNum, note: "Paid when the order came" });
  }
  // a part delivery: the rest stays on order (its own number, the same approval)
  const short = lines.filter((l) => l.got < llqaPN(l.qty));
  let rest = null;
  if (short.length && o.keepRest !== false) {
    const root = p.restRoot || p.poNum;
    const n = 2 + (ctx.procPurchases || []).filter((x) => x && x.restRoot === root).length;
    rest = {
      id: llqaUid("po"),
      poNum: root + "-" + n,
      restRoot: root,
      restOf: p.id,
      date: p.date,
      vendor: p.vendor,
      category: p.category || "Other",
      currency: p.currency || "PKR",
      status: p.status === "Approved" ? "Approved" : "Ordered",
      lines: short.map((l, i) => ({ id: "l" + (i + 1), itemId: l.itemId, item: l.item, unit: l.unit || "", qty: llqaR2(llqaPN(l.qty) - l.got), unitCost: llqaPN(l.unitCost) })),
      notes: "The rest of " + p.poNum + (p.notes ? " — " + p.notes : ""),
      requestedBy: p.requestedBy || "",
      requestedAt: p.requestedAt || "",
      approvedBy: p.approvedBy || "",
      approvedAt: p.approvedAt || "",
      orderedAt: p.orderedAt || "",
      auto: !!p.auto,
      log: [{ at, by, what: "the rest of " + p.poNum + " still to come" }],
    };
  }
  const partWhat = short.length ? " (part of it" + (rest ? "; the rest stays on order as " + rest.poNum : "") + ")" : "";
  llqaProcSet(p, { status: "Received", receivedDate: day, receivedBy: by, receivedAt: at, lines, stocked, billId: bill ? bill.id : null, restId: rest ? rest.id : null }, "received" + partWhat + (bill ? "; bill " + llqaAmt(amount, p.currency || "PKR") + (o.paidNow ? " paid" : "") : ""));
  if (rest) ctx.setProcPurchases((prev) => [...(prev || []), rest]);
  return { ok: true, bill, rest };
};
// a receipt undone: back out of stock, the unpaid bill removed (kept in Finance's removed bills), the order back to Ordered
const llqaProcUnreceive = (p) => {
  const ctx = LLQAApp.ctx;
  if (!p || p.status !== "Received" || !Array.isArray(p.stocked)) return { ok: false, why: "Only an order received since v83 can be undone (an older one: correct the stock in Inventory)." };
  const bill = llqaProcBill(p);
  if (bill && llqaApPaid(bill) > 0) return { ok: false, why: "Its bill has payments — undo them in Accounts Payable first." };
  const rest = p.restId != null ? (ctx.procPurchases || []).find((x) => x && x.id === p.restId) : null;
  if (rest && rest.status === "Received") return { ok: false, why: "The rest of the order (" + rest.poNum + ") was received — undo that first." };
  if (typeof ctx.setProcInventory !== "function") return { ok: false, why: "Stock can't be changed from here." };
  if (bill && !llqaApRemove(bill, "Purchase order " + p.poNum + ": the receipt was undone")) return { ok: false, why: "The bill could not be removed — nothing was changed." };
  const by = llqaPayActor();
  const at = new Date().toISOString();
  ctx.setProcInventory((prev) => {
    let inv = (prev || []).slice();
    p.stocked.forEach((s) => {
      const x = inv.find((y) => y && String(y.id) === String(s.itemId));
      if (!x) return;
      const moves = Array.isArray(x.moves) ? x.moves : [];
      // an item this receipt created, untouched since: removed again
      if (s.created && moves.length <= 1 && llqaPN(x.onHand) === llqaPN(s.qty)) {
        inv = inv.filter((y) => y !== x);
        return;
      }
      const left = llqaR2(llqaPN(x.onHand) - llqaPN(s.qty));
      const cp = s.cp == null ? null : llqaPN(s.cp);
      // the average cost before it came (the exact reverse of the average taken when it came)
      const unitValue = cp == null ? llqaPN(x.unitValue) : left > 0 ? Math.max(0, llqaR2((llqaPN(x.onHand) * llqaPN(x.unitValue) - llqaPN(s.qty) * cp) / left)) : llqaPN(s.before && s.before.unitValue);
      inv = inv.map((y) => (y === x ? { ...y, onHand: Math.max(0, left), unitValue, restocks: Math.max(0, llqaPN(y.restocks) - 1), moves: llqaProcMoves(y, -llqaPN(s.qty), "receipt of " + p.poNum + " undone", at, by) } : y));
    });
    return inv;
  });
  if (rest) ctx.setProcPurchases((prev) => (prev || []).filter((x) => !(x && x.id === rest.id)));
  llqaProcSet(
    p,
    { status: "Ordered", receivedDate: "", receivedBy: "", receivedAt: "", stocked: null, billId: null, restId: null, lines: llqaPoLines(p).map((l) => ({ id: l.id, itemId: l.itemId != null ? l.itemId : null, item: l.item, unit: l.unit || "", qty: llqaPN(l.qty), unitCost: llqaPN(l.unitCost) })) },
    "receipt undone (stock taken back out" + (bill ? ", the bill removed" : "") + (rest ? ", " + rest.poNum + " removed" : "") + ")",
  );
  return { ok: true };
};
// stock taken out (used, given for a class): logged on the item
const llqaProcTakeOut = (it, f) => {
  const ctx = LLQAApp.ctx;
  const n = llqaPN(f && f.qty);
  if (!it || !(n > 0)) return { ok: false, why: "Enter how many." };
  if (typeof ctx.setProcInventory !== "function") return { ok: false, why: "Stock can't be changed from here." };
  const cur = (ctx.procInventory || []).find((x) => x && x.id === it.id) || it;
  if (n > llqaPN(cur.onHand)) return { ok: false, why: "Only " + llqaPN(cur.onHand) + " in stock." };
  const who = String(f.who || "").trim();
  const why = String(f.why || "").trim();
  if (!who && !why) return { ok: false, why: "Say who took it or what for." };
  const day = llqaIsDay(f.date) ? f.date : todayPK();
  ctx.setProcInventory((prev) => (prev || []).map((x) => (x && x.id === it.id ? { ...x, onHand: llqaR2(llqaPN(x.onHand) - n), updated: day, moves: llqaProcMoves(x, -n, "taken out" + (who ? " by " + who : "") + (why ? " — " + why : "") + (day !== todayPK() ? " (" + day + ")" : "")) } : x)));
  return { ok: true };
};
// requests for low items: one per supplier (and currency)
let llqaProcAskAt = 0;
const llqaProcAsk = (todo, auto) => {
  const ctx = LLQAApp.ctx;
  const groups = {};
  todo.forEach((x) => (groups[llqaProcNorm(x.vendor) + "|" + x.currency] = groups[llqaProcNorm(x.vendor) + "|" + x.currency] || []).push(x));
  const made = [];
  Object.keys(groups).forEach((k) => {
    const xs = groups[k];
    // the same id on every computer for the same items at the same restock: two screens asking at once save one
    // request; one that was rejected or cancelled is not asked again until the item is restocked
    const id = auto ? "poauto_" + llqaProcHash(k + "|" + xs.map((x) => x.it.id + "@" + llqaPN(x.it.restocks)).sort().join(",")) : null;
    if (id && (ctx.procPurchases || []).some((p) => p && p.id === id)) return;
    const byCat = {};
    xs.forEach((x) => (byCat[x.it.category || "Other"] = (byCat[x.it.category || "Other"] || 0) + x.qty * x.unitCost));
    const cat = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a])[0] || "Other";
    const p = llqaProcRequest({
      id,
      auto,
      vendor: xs[0].vendor,
      currency: xs[0].currency,
      category: cat,
      notes: "Low stock: " + xs.map((x) => x.it.name + " " + llqaPN(x.it.onHand) + " left (reorder at " + llqaPN(x.it.reorderPoint) + ")").join("; "),
      lines: xs.map((x) => ({ itemId: x.it.id, item: x.it.name, unit: x.it.unit || "", qty: x.qty, unitCost: x.unitCost })),
    });
    if (p) made.push(p);
  });
  return made;
};
// the Autopilot (every 5 minutes: on the 24/7 runner, or on a staff computer while the runner is down)
const llqaProcAutoRun = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || typeof ctx.setProcPurchases !== "function" || !llqaReadyFor(["procInventory", "procPurchases", "doc:data/finance"])) return false;
  if (!llqaProcRules().autoReorder) return false;
  return llqaProcAsk(llqaProcReorders(ctx.procInventory, ctx.procPurchases), true).length > 0;
};
// "Ask for all" on Low Stock
const llqaProcAutoRunNow = () => {
  const ctx = LLQAApp.ctx;
  if (Date.now() - llqaProcAskAt < 2000) return [];
  llqaProcAskAt = Date.now();
  const todo = llqaProcReorders(ctx.procInventory, ctx.procPurchases);
  const made = todo.length ? llqaProcAsk(todo, false) : [];
  if (made.length)
    llqaToast({ kind: "info", ttl: 6000, text: "✓ " + made.length + " request" + (made.length === 1 ? "" : "s") + " for " + todo.length + " low item" + (todo.length === 1 ? "" : "s") + " — waiting for approval.", actions: [{ label: "Requests", run: () => llqaGo("procurement", "orders") }] });
  return made;
};
// people an asset can be handed to: teachers, team leads, staff sign-ins
const llqaProcPeople = () => {
  const ctx = LLQAApp.ctx || {};
  const out = [];
  const has = (n) => out.some((x) => llqaProcNorm(x.name) === llqaProcNorm(n));
  (ctx.teachers || []).forEach((t) => {
    if (t && t.name && !llqaTeacherGone(t) && t.status !== "quit" && !has(t.name)) out.push({ id: "t:" + t.id, name: t.name, role: "Teacher" });
  });
  (ctx.teamLeads || []).forEach((l) => {
    const n = typeof l === "string" ? l : l && l.name;
    if (n && !has(n)) out.push({ id: "tl:" + n, name: n, role: "Team Lead" });
  });
  (ctx.accounts || []).forEach((a) => {
    if (!a || a.active === false || !a.name || !["superadmin", "staff", "teamlead"].includes(a.role) || has(a.name)) return;
    out.push({ id: "a:" + (a.uid || a.id || a.key), name: a.name, role: a.role === "superadmin" ? "Admin" : a.role === "teamlead" ? "Team Lead" : "Staff" });
  });
  return out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
};
// an asset's flags: back overdue; with someone who has left
const llqaProcFlags = (it, today) => {
  const ctx = LLQAApp.ctx || {};
  if (!it || it.custodyStatus !== "Issued") return { overdue: false, leaver: false };
  const overdue = llqaIsDay(it.dueBack) && it.dueBack < (today || todayPK());
  const id = String(it.issuedToId || "");
  let leaver = false;
  if (id.slice(0, 2) === "t:") leaver = llqaTeacherGone((ctx.teachers || []).find((x) => x && String(x.id) === id.slice(2)));
  else if (id.slice(0, 2) === "a:") {
    const a = (ctx.accounts || []).find((x) => x && String(x.uid || x.id || x.key) === id.slice(2));
    leaver = !!a && a.active === false;
  }
  return { overdue, leaver };
};
// the Dashboard card
const llqaProcDash = () => {
  const ctx = LLQAApp.ctx || {};
  const pos = (ctx.procPurchases || []).filter(Boolean);
  const inv = (ctx.procInventory || []).filter(Boolean);
  const today = todayPK();
  const flags = inv.map((it) => llqaProcFlags(it, today));
  return {
    toApprove: pos.filter((p) => p.status === "Requested" && llqaProcCanApprove(p).ok).length,
    waiting: pos.filter((p) => p.status === "Requested").length,
    open: pos.filter((p) => LLQA_PO_OPEN.includes(p.status) && p.status !== "Requested").length,
    low: inv.filter((it) => llqaPN(it.reorderPoint) > 0 && llqaPN(it.onHand) <= llqaPN(it.reorderPoint)).length,
    overdue: flags.filter((f) => f.overdue).length,
    leavers: flags.filter((f) => f.leaver).length,
  };
};
const llqaProcDashCard = () => {
  const d = llqaProcDash();
  const assets = d.overdue + d.leavers;
  const parts = [d.toApprove ? d.toApprove + " to approve" : d.waiting ? d.waiting + " waiting for approval" : "", d.low ? d.low + " low on stock" : "", assets ? assets + " asset" + (assets === 1 ? "" : "s") + " to get back" : "", d.open ? d.open + " on order" : ""].filter(Boolean);
  return llqaDashCard("proc", "📦", "Procurement", d.toApprove || d.waiting || d.low || assets || d.open, parts.join(" · ") || "nothing waiting", d.toApprove || assets ? c.warn : null, () => llqaGo("procurement", d.toApprove || d.waiting ? "orders" : assets ? "issued" : d.low ? "lowstock" : "overview"));
};
// notices: requests this person can approve (as they come); their own requests approved or rejected
const llqaProcNotices = (state) => {
  const ctx = LLQAApp.ctx;
  const pos = (ctx.procPurchases || []).filter(Boolean);
  const mine = pos.filter((p) => p.status === "Requested" && llqaProcCanApprove(p).ok);
  const sig = mine.map((p) => String(p.id)).sort().join(",");
  if (sig !== state.procAsk) {
    const was = new Set(String(state.procAsk || "").split(",").filter(Boolean));
    state.procAsk = sig;
    const fresh = mine.filter((p) => !was.has(String(p.id)));
    if (fresh.length)
      llqaToast({
        kind: "info",
        key: "proc-ask",
        text: "📦 " + mine.length + " purchase request" + (mine.length === 1 ? "" : "s") + " to approve — " + mine.slice(0, 3).map((p) => p.poNum + " " + (p.vendor || "") + " " + llqaAmt(llqaPoTotal(p), p.currency || "PKR")).join(", ") + (mine.length > 3 ? "…" : "") + ".",
        actions: [{ label: "Review", run: () => llqaGo("procurement", "orders") }],
      });
  }
  const me = llqaPayActor();
  const now = {};
  pos.forEach((p) => p.requestedBy === me && (now[p.id] = p.status));
  if (state.procMine)
    pos.forEach((p) => {
      if (p.requestedBy !== me || state.procMine[p.id] !== "Requested" || (p.status !== "Approved" && p.status !== "Rejected")) return;
      llqaToast({ kind: "info", key: "proc-" + p.id, ttl: 20000, text: (p.status === "Approved" ? "✓ " : "✕ ") + "Your request " + p.poNum + " (" + (p.vendor || "") + ") was " + p.status.toLowerCase() + (p.status === "Approved" && p.approvedBy ? " by " + p.approvedBy : p.rejectWhy ? ": " + p.rejectWhy : "") + ".", actions: [{ label: "Open", run: () => llqaGo("procurement", "orders") }] });
    });
  state.procMine = now;
};
// a printable purchase order
const llqaProcPrint = (p) => {
  const vd = llqaApVendor(p.vendor) || {};
  const rows = llqaPoLines(p)
    .map((l) => "<tr><td>" + escHTML(l.item) + "</td><td style='text-align:right'>" + llqaPN(l.qty) + " " + escHTML(l.unit || "") + "</td><td style='text-align:right'>" + escHTML(llqaAmt(l.unitCost, p.currency || "PKR")) + "</td><td style='text-align:right'>" + escHTML(llqaAmt(llqaPN(l.qty) * llqaPN(l.unitCost), p.currency || "PKR")) + "</td></tr>")
    .join("");
  const total = llqaR2(llqaPoLines(p).reduce((a, l) => a + llqaPN(l.qty) * llqaPN(l.unitCost), 0));
  return llqaPrintDoc(
    p.poNum,
    "<div class='muted'>" + escHTML(llqaAcademy()) + "</div><h1>Purchase Order " + escHTML(p.poNum) + "</h1>" +
      "<div class='muted'>" + escHTML(llqaDateLabel(p.date) || p.date || "") + " · " + escHTML((LLQA_PO_STATES[p.status] || [p.status || ""])[0]) + "</div>" +
      "<h2>Supplier</h2><div>" + escHTML(p.vendor || "—") + "</div>" +
      (vd.contact || vd.phone || vd.email ? "<div class='muted'>" + escHTML([vd.contact, vd.phone, vd.email].filter(Boolean).join(" · ")) + "</div>" : "") +
      (vd.address ? "<div class='muted'>" + escHTML(vd.address) + "</div>" : "") +
      "<table><thead><tr><th>Item</th><th style='text-align:right'>Quantity</th><th style='text-align:right'>Unit cost</th><th style='text-align:right'>Total</th></tr></thead><tbody>" + rows +
      "<tr><td colspan='3' style='text-align:right'><b>Total</b></td><td style='text-align:right'><b>" + escHTML(llqaAmt(total, p.currency || "PKR")) + "</b></td></tr></tbody></table>" +
      (llqaPN(vd.terms) > 0 ? "<p>Payment: " + llqaPN(vd.terms) + " days after delivery.</p>" : "") +
      (p.notes ? "<p>" + escHTML(p.notes) + "</p>" : "") +
      "<p class='muted' style='margin-top:28px'>Asked for by " + escHTML(p.requestedBy || "—") + (p.approvedBy ? " · approved by " + escHTML(p.approvedBy) : "") + "</p>",
  );
};
// days from order to delivery, on average (a supplier's received orders)
const llqaProcLead = (pos, vendor) => {
  const xs = (pos || []).filter((p) => p && p.status === "Received" && llqaProcNorm(p.vendor) === llqaProcNorm(vendor) && llqaIsDay(p.receivedDate)).map((p) => llqaDays(String(p.orderedAt || "").slice(0, 10) || p.date, p.receivedDate)).filter((d) => d != null && d >= 0);
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
};

const ProcurementMod = ({ procInventory, setProcInventory, procPurchases, setProcPurchases }) => {
  const ctx = LLQAApp.ctx || {};
  const fixTab = (t) => (t === "purchases" ? "orders" : t);
  const [tab, setTab] = useState(() => fixTab(llqaTakeTab("procurement", "overview")));
  React.useEffect(() => llqaOnTab("procurement", (t) => setTab(fixTab(t))), []);
  const [q, setQ] = useState("");
  const [fSt, setFSt] = useState("open");
  const [win, setWin] = useState(null);
  const [form, setForm] = useState({});
  const [rf, setRf] = useState(null);
  const [err, setErr] = useState("");
  const today = todayPK();
  const ym = today.slice(0, 7);
  const R = llqaFinRates();
  const inv = (procInventory || []).filter(Boolean);
  const pos = (procPurchases || []).filter(Boolean);
  const boss = llqaProcBoss();
  const rules = llqaProcRules();
  const ql = q.trim().toLowerCase();
  const hit = (...v) => !ql || v.some((x) => String(x == null ? "" : x).toLowerCase().includes(ql));
  const stock = (it) => (llqaPN(it.onHand) <= 0 ? "Out" : llqaPN(it.reorderPoint) > 0 && llqaPN(it.onHand) <= llqaPN(it.reorderPoint) ? "Low" : "OK");
  const stockCol = { Out: c.danger, Low: c.warn, OK: c.success };
  const custCol = { "In Store": c.success, Issued: c.accent, Returned: c.cyan, "Under Repair": c.warn, Lost: c.danger };
  const pill = (p) => {
    const d = LLQA_PO_STATES[p.status] || [p.status || "—", "textSec"];
    return llqaPill(d[0], c[d[1]] || c.textSec, null, "st");
  };
  const billPill = (p) => {
    const b = llqaProcBill(p);
    if (!b) return null;
    const d = LLQA_AP_STATES[llqaApState(b, today)] || ["—", "textSec"];
    return llqaPill("Bill " + d[0].toLowerCase(), c[d[1]] || c.textSec, null, "bill");
  };
  const close = () => {
    setWin(null);
    setErr("");
  };
  const open = (kind, f) => {
    setErr("");
    setForm(f || {});
    setWin(kind);
  };
  const vendors = (() => {
    const fin = llqaFinDoc().vendors || {};
    const m = new Map();
    Object.keys(fin).forEach((k) => fin[k] && m.set(k, { ...fin[k], name: fin[k].name || k }));
    [...pos.map((p) => p.vendor), ...inv.map((it) => it.vendor)].forEach((n) => {
      const k = llqaProcNorm(n);
      if (k && !m.has(k)) m.set(k, { name: String(n).trim(), unsaved: true });
    });
    return [...m.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  })();
  const people = llqaProcPeople();
  const stockValue = inv.reduce((a, it) => a + Math.max(0, llqaPN(it.onHand)) * llqaPN(it.unitValue), 0);
  const toApprove = pos.filter((p) => p.status === "Requested");
  const openPos = pos.filter((p) => LLQA_PO_OPEN.includes(p.status));
  const lowList = inv.filter((it) => it.custodyStatus !== "Issued" && (stock(it) === "Low" || (stock(it) === "Out" && (llqaPN(it.reorderPoint) > 0 || !it.custodyStatus || it.custodyStatus === "In Store"))));
  const reorders = llqaProcReorders(inv, pos);
  const spentMonth = pos.filter((p) => LLQA_PO_SPENT.includes(p.status) && llqaPoMonth(p) === ym).reduce((a, p) => a + (llqaPoPKR(p, R) || 0), 0);
  const issued = inv.filter((it) => it.custodyStatus && it.custodyStatus !== "In Store");
  const flagsOf = (it) => llqaProcFlags(it, today);
  const flagged = inv.filter((it) => {
    const f = flagsOf(it);
    return f.overdue || f.leaver;
  });
  const inStore = inv.filter((it) => !it.custodyStatus || it.custodyStatus === "In Store" || it.custodyStatus === "Returned");
  const btnRow = (kids) => React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" } }, kids);
  const note = (t, k) => React.createElement("div", { key: k || "note", style: { color: c.textSec, fontSize: 12 } }, t);
  const empty = (t) => llqaCard(note(t));
  const head = (t, k) => React.createElement("div", { key: k || "h", style: { fontWeight: 800, color: c.text, marginBottom: 8 } }, t);
  const rowTitle = (t, sub, k) => llqaTd([React.createElement("div", { key: "t", style: { fontWeight: 700, color: c.text } }, t), sub ? llqaSmall(sub, null, "s") : null], k);
  const run = (fn) => {
    const r = fn();
    if (r && r.ok === false) setErr(r.why || "That could not be done.");
    else close();
    return r;
  };
  const giveForm = (it) => ({ it, pick: it ? it.id : "", mode: "give", who: "", other: "", dueBack: "", condition: (it && it.condition) || "Good", date: today });
  const openReceive = (p) => open("receive", { p, got: Object.fromEntries(llqaPoLines(p).map((l) => [l.id, String(llqaPN(l.qty))])), date: today, paidNow: false, method: "Cash", keepRest: true });

  /* ---------- an order's buttons ---------- */
  const actions = (p) => {
    const b = [];
    if (p.status === "Requested") {
      const can = llqaProcCanApprove(p);
      if (can.ok) {
        b.push(llqaMini("✓ Approve", () => open("approve", { p, over: can.over }), { key: "ap", tone: "success" }));
        b.push(llqaMini("✕ Reject", () => open("reason", { p, kind: "reject", why: "" }), { key: "rj", tone: "danger" }));
      } else b.push(React.createElement("span", { key: "why", style: { color: c.textMuted, fontSize: 11, alignSelf: "center" } }, can.why));
    }
    if (p.status === "Approved") b.push(llqaMini("Ordered", () => llqaProcSet(p, { status: "Ordered", orderedAt: new Date().toISOString() }, "ordered"), { key: "or", tone: "accent", title: "The order was placed with the supplier" }));
    if (p.status === "Ordered") b.push(llqaMini("Shipped", () => llqaProcSet(p, { status: "Shipped", shippedAt: new Date().toISOString() }, "shipped"), { key: "sh", title: "The supplier sent it" }));
    if (["Approved", "Ordered", "Shipped"].includes(p.status)) b.push(llqaMini("📦 Receive", () => openReceive(p), { key: "rc", tone: "success", title: "It came: add it to stock and make the bill" }));
    if (p.status === "Received" && Array.isArray(p.stocked)) b.push(llqaMini("↩ Undo receipt", () => open("unreceive", { p }), { key: "ur" }));
    if (LLQA_PO_OPEN.includes(p.status)) b.push(llqaMini("Cancel order", () => open("reason", { p, kind: "cancel", why: "" }), { key: "cx" }));
    if (p.status === "Rejected" || p.status === "Cancelled") b.push(llqaMini("Ask again", () => llqaProcSet(p, { status: "Requested", requestedBy: llqaPayActor(), requestedAt: new Date().toISOString(), approvedBy: "", approvedAt: "", rejectWhy: "" }, "asked for again"), { key: "ag" }));
    b.push(llqaMini("🖨 Print", () => llqaProcPrint(p), { key: "pr", title: "A printable purchase order" }));
    if (p.status !== "Received") b.push(llqaMini("Edit", () => open("po", { ...p, lines: llqaPoLines(p).map((l) => ({ ...l, itemId: l.itemId != null ? String(l.itemId) : "", qty: String(l.qty), unitCost: String(l.unitCost) })) }), { key: "ed" }));
    if (p.status === "Requested" || p.status === "Rejected" || p.status === "Cancelled" || (boss && p.status !== "Received")) b.push(llqaMini("Delete", () => open("delPo", { p }), { key: "dl", tone: "danger" }));
    return btnRow(b);
  };
  const orderRow = (p) =>
    React.createElement(
      "tr",
      { key: p.id },
      rowTitle(p.poNum, [llqaDateLabel(p.date) || p.date, p.category, p.auto ? "asked for by the Autopilot" : p.requestedBy ? "by " + p.requestedBy : ""].filter(Boolean).join(" · "), "o"),
      rowTitle(p.vendor || "—", (llqaApVendor(p.vendor) || {}).phone || "", "v"),
      llqaTd(llqaPoItems(p) || "—", "i", { maxWidth: 260 }),
      llqaTd(React.createElement("span", { style: { fontWeight: 700, color: c.text, whiteSpace: "nowrap" } }, llqaAmt(llqaPoTotal(p), p.currency || "PKR")), "t"),
      llqaTd(
        [
          pill(p),
          billPill(p) ? React.createElement("span", { key: "sp" }, " ") : null,
          billPill(p),
          p.approvedBy && p.status !== "Requested" ? llqaSmall("approved by " + p.approvedBy, null, "ab") : null,
          p.receivedDate ? llqaSmall("received " + (llqaDateLabel(p.receivedDate) || p.receivedDate), null, "rd") : null,
          p.rejectWhy && (p.status === "Rejected" || p.status === "Cancelled") ? llqaSmall(p.rejectWhy, c.danger, "rw") : null,
        ],
        "s",
      ),
      llqaTd(actions(p), "a"),
    );
  const itemRow = (it) =>
    React.createElement(
      "tr",
      { key: it.id },
      rowTitle(it.name || "—", [it.sku, it.category].filter(Boolean).join(" · "), "n"),
      llqaTd([React.createElement("span", { key: "o", style: { fontWeight: 700, color: stockCol[stock(it)] } }, llqaPN(it.onHand) + " " + (it.unit || "")), stock(it) !== "OK" ? llqaSmall(stock(it) === "Out" ? "out of stock" : "low", stockCol[stock(it)], "l") : null], "o"),
      llqaTd(llqaPN(it.reorderPoint) > 0 ? "at " + llqaPN(it.reorderPoint) + (llqaPN(it.reorderQty) > 0 ? " · order " + llqaPN(it.reorderQty) : "") : "—", "r"),
      llqaTd(llqaPKR(Math.max(0, llqaPN(it.onHand)) * llqaPN(it.unitValue)), "v"),
      llqaTd([it.vendor || "—", it.location ? llqaSmall(it.location, null, "p") : null], "s"),
      llqaTd([llqaPill(it.custodyStatus || "In Store", custCol[it.custodyStatus || "In Store"] || c.success, null, "c"), it.issuedTo && it.custodyStatus === "Issued" ? llqaSmall(it.issuedTo, null, "w") : null], "c"),
      llqaTd(
        btnRow([
          llqaPN(it.onHand) > 0 && it.custodyStatus !== "Issued" ? llqaMini("Take out", () => open("take", { it, qty: "", who: "", why: "", date: today }), { key: "t", title: "Stock used or given out" }) : null,
          !it.custodyStatus || it.custodyStatus === "In Store" || it.custodyStatus === "Returned" ? llqaMini("Hand out", () => open("give", giveForm(it)), { key: "g", title: "Give this asset to someone" }) : null,
          llqaMini("Edit", () => open("item", { ...it, was: llqaPN(it.onHand) }), { key: "e" }),
          llqaMini("Delete", () => open("delItem", { it }), { key: "d", tone: "danger" }),
        ]),
        "a",
      ),
    );

  /* ---------- tabs ---------- */
  let content = null,
    csv = null;
  if (tab === "overview") {
    const cats = LLQA_PROC_CATS.filter((k) => llqaPN(rules.budgets[k]) > 0 || pos.some((p) => (p.category || "Other") === k && LLQA_PO_SPENT.includes(p.status) && llqaPoMonth(p) === ym));
    const waitRows = toApprove.slice(0, 6);
    content = React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 } },
        llqaStat("To approve", toApprove.length, toApprove.length ? (boss ? "waiting for you" : "waiting for approval") : "nothing waiting", toApprove.length ? c.warn : null, "a"),
        llqaStat("On order", openPos.length - toApprove.length, llqaPKR(openPos.filter((p) => p.status !== "Requested").reduce((a, p) => a + (llqaPoPKR(p, R) || 0), 0)), null, "o"),
        llqaStat("Spent this month", llqaPKR(spentMonth), "approved and further", null, "s"),
        llqaStat("Stock value", llqaPKR(stockValue), inv.length + " item" + (inv.length === 1 ? "" : "s"), null, "v"),
        llqaStat("Low / out of stock", lowList.length, reorders.length ? reorders.length + " with no order yet" : lowList.length ? "all on order" : "all stocked", lowList.length ? c.warn : null, "l"),
        llqaStat("Assets to get back", flagged.length, flagged.length ? "overdue or with someone who left" : "none", flagged.length ? c.danger : null, "f"),
      ),
      waitRows.length ? llqaCard([head("Waiting for approval", "h"), React.createElement("div", { key: "t" }, llqaTable(["Order", "Supplier", "Items", "Total", "Status", ""], waitRows.map(orderRow))), toApprove.length > waitRows.length ? React.createElement("div", { key: "m", style: { marginTop: 8 } }, llqaMini("All " + toApprove.length + " requests", () => (setFSt("approve"), setTab("orders")), { key: "all" })) : null], { key: "wait" }) : null,
      reorders.length
        ? llqaCard(
            [
              head(reorders.length + " item" + (reorders.length === 1 ? "" : "s") + " low with no order", "h"),
              note(reorders.slice(0, 8).map((x) => x.it.name + " (" + llqaPN(x.it.onHand) + " left)").join(", ") + (reorders.length > 8 ? "…" : ""), "l"),
              llqaSmall(rules.autoReorder ? "Automatic reorder is on: the Autopilot asks for these by itself within a few minutes." : "Automatic reorder is off (Rules).", null, "s"),
              React.createElement("div", { key: "b", style: { marginTop: 8 } }, llqaMini("＋ Ask for all " + reorders.length, () => llqaProcAutoRunNow(), { key: "all", solid: true, tone: "accent" })),
            ],
            { key: "low" },
          )
        : null,
      flagged.length
        ? llqaCard(
            [
              head("Assets to get back", "h"),
              ...flagged.slice(0, 6).map((it) => {
                const f = flagsOf(it);
                return React.createElement(
                  "div",
                  { key: it.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid " + c.border, fontSize: 12, color: c.text } },
                  React.createElement("span", null, it.name + " — " + (it.issuedTo || "—") + (f.leaver ? " (has left)" : "") + (it.dueBack ? ", back by " + (llqaDateLabel(it.dueBack) || it.dueBack) : "")),
                  llqaMini("↩ Returned", () => open("give", { it, mode: "return", condition: it.condition || "Good", date: today }), { key: "r", tone: "success" }),
                );
              }),
            ],
            { key: "assets" },
          )
        : null,
      cats.length
        ? llqaCard(
            [
              head("This month by category" + (Object.keys(rules.budgets).length ? " — against the budget" : ""), "h"),
              ...cats.map((k) => {
                const sp = llqaProcSpent(k, ym, pos, null, R);
                const bud = llqaPN(rules.budgets[k]);
                const pct = bud > 0 ? Math.min(100, Math.round((sp / bud) * 100)) : 0;
                return React.createElement(
                  "div",
                  { key: k, style: { marginBottom: 8 } },
                  React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: c.textSec } }, React.createElement("span", null, k), React.createElement("span", { style: { color: bud > 0 && sp > bud ? c.danger : c.text, fontWeight: 700 } }, llqaPKR(sp) + (bud > 0 ? " of " + llqaPKR(bud) : ""))),
                  bud > 0 ? React.createElement("div", { style: { height: 6, background: c.bgDeep, borderRadius: 3, marginTop: 4 } }, React.createElement("div", { style: { width: pct + "%", height: 6, borderRadius: 3, background: sp > bud ? c.danger : pct >= 80 ? c.warn : c.success } })) : null,
                );
              }),
            ],
            { key: "bud" },
          )
        : null,
      !pos.length && !inv.length ? empty("Nothing here yet. “＋ New request” asks for something to buy; “Inventory → ＋ Add item” starts the stock list; an item at its reorder point asks for its own reorder.") : null,
    );
  } else if (tab === "orders") {
    const groups = { open: LLQA_PO_OPEN, approve: ["Requested"], received: ["Received"], closed: ["Rejected", "Cancelled"], all: null };
    const list = pos
      .filter((p) => !groups[fSt] || groups[fSt].includes(p.status))
      .filter((p) => hit(p.poNum, p.vendor, llqaPoItems(p), p.status, p.category, p.notes, p.requestedBy))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.poNum || "").localeCompare(String(a.poNum || "")));
    csv = [
      ["PO #", "Date", "Supplier", "Category", "Items", "Total", "Currency", "Status", "Asked for by", "Approved by", "Received", "Bill"],
      ...list.map((p) => {
        const b = llqaProcBill(p);
        return [p.poNum, p.date, p.vendor, p.category || "", llqaPoItems(p), llqaPoTotal(p), p.currency || "PKR", p.status, p.requestedBy || "", p.approvedBy || "", p.receivedDate || "", b ? (LLQA_AP_STATES[llqaApState(b, today)] || [""])[0] : ""];
      }),
    ];
    content = React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } },
        [["open", "Open (" + openPos.length + ")"], ["approve", "To approve (" + toApprove.length + ")"], ["received", "Received"], ["closed", "Rejected / cancelled"], ["all", "All"]].map(([k, l]) => llqaMini(l, () => setFSt(k), { key: k, solid: fSt === k, tone: fSt === k ? "accent" : null })),
      ),
      list.length ? llqaTable(["Order", "Supplier", "Items", "Total", "Status", ""], list.map(orderRow)) : empty(pos.length ? "No orders here." : "No orders yet — “＋ New request” asks for one; low stock asks by itself."),
    );
  } else if (tab === "inventory" || tab === "lowstock") {
    const list = (tab === "lowstock" ? lowList : inv).filter((it) => hit(it.name, it.sku, it.category, it.location, it.vendor, it.issuedTo)).sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    csv = [
      ["Item", "SKU", "Category", "On hand", "Unit", "Reorder point", "Reorder quantity", "Unit value (PKR)", "Stock value (PKR)", "Location", "Supplier", "Stock", "Custody", "With"],
      ...list.map((it) => [it.name, it.sku || "", it.category || "", llqaPN(it.onHand), it.unit || "", llqaPN(it.reorderPoint), llqaPN(it.reorderQty), llqaPN(it.unitValue), llqaR2(Math.max(0, llqaPN(it.onHand)) * llqaPN(it.unitValue)), it.location || "", it.vendor || "", stock(it), it.custodyStatus || "In Store", it.custodyStatus === "Issued" ? it.issuedTo || "" : ""]),
    ];
    content = React.createElement(
      "div",
      null,
      tab === "lowstock" && reorders.length
        ? llqaCard(
            [
              head(reorders.length + " low with no order open", "t"),
              llqaSmall(rules.autoReorder ? "Automatic reorder is on: the Autopilot asks for these by itself within a few minutes (one request per supplier, waiting for approval)." : "Automatic reorder is off (Rules) — ask for them here.", null, "s"),
              React.createElement("div", { key: "b", style: { marginTop: 8 } }, llqaMini("＋ Ask for all " + reorders.length, () => llqaProcAutoRunNow(), { key: "all", solid: true, tone: "accent" })),
            ],
            { key: "re" },
          )
        : null,
      list.length ? llqaTable(["Item", "On hand", "Reorder", "Value", "Supplier / place", "Custody", ""], list.map(itemRow)) : empty(tab === "lowstock" ? "Nothing is low — every item is above its reorder point." : inv.length ? "No item matches." : "No items yet — “＋ Add item” starts the stock list (an order received adds its items by itself)."),
    );
  } else if (tab === "issued") {
    const list = issued.filter((it) => hit(it.name, it.issuedTo, it.receiverRole, it.custodyStatus)).sort((a, b) => Number(flagsOf(b).overdue || flagsOf(b).leaver) - Number(flagsOf(a).overdue || flagsOf(a).leaver) || String(a.name || "").localeCompare(String(b.name || "")));
    csv = [
      ["Item", "Status", "With", "Role", "Given", "Back by", "Returned", "Condition", "Given by", "Flag"],
      ...list.map((it) => {
        const f = flagsOf(it);
        return [it.name, it.custodyStatus, it.issuedTo || "", it.receiverRole || "", it.issueDate || "", it.dueBack || "", it.returnDate || "", it.condition || "", it.issuedBy || "", f.leaver ? "with someone who left" : f.overdue ? "overdue" : ""];
      }),
    ];
    content = React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
        llqaStat("With people", inv.filter((it) => it.custodyStatus === "Issued").length, null, null, "i"),
        llqaStat("Overdue back", inv.filter((it) => flagsOf(it).overdue).length, null, inv.some((it) => flagsOf(it).overdue) ? c.danger : null, "o"),
        llqaStat("With someone who left", inv.filter((it) => flagsOf(it).leaver).length, null, inv.some((it) => flagsOf(it).leaver) ? c.danger : null, "l"),
        llqaStat("Repair / lost", inv.filter((it) => it.custodyStatus === "Under Repair" || it.custodyStatus === "Lost").length, null, null, "r"),
      ),
      inStore.length ? React.createElement("div", { style: { marginBottom: 10 } }, llqaMini("Hand out an item", () => open("give", giveForm(null)), { key: "h", tone: "accent" })) : null,
      list.length
        ? llqaTable(
            ["Asset", "With", "Given / back by", "Status", ""],
            list.map((it) => {
              const f = flagsOf(it);
              return React.createElement(
                "tr",
                { key: it.id },
                rowTitle(it.name || "—", [it.sku, it.condition].filter(Boolean).join(" · "), "n"),
                rowTitle(it.issuedTo || "—", it.receiverRole || "", "w"),
                llqaTd([llqaDateLabel(it.issueDate) || it.issueDate || "—", it.dueBack ? llqaSmall("back by " + (llqaDateLabel(it.dueBack) || it.dueBack), f.overdue ? c.danger : null, "b") : null], "d"),
                llqaTd([llqaPill(it.custodyStatus, custCol[it.custodyStatus] || c.textSec, null, "c"), f.leaver ? llqaSmall("with someone who left — ask for it back", c.danger, "l") : f.overdue ? llqaSmall("overdue", c.danger, "o") : null], "s"),
                llqaTd(
                  btnRow([
                    it.custodyStatus === "Issued" ? llqaMini("↩ Returned", () => open("give", { it, mode: "return", condition: it.condition || "Good", date: today }), { key: "r", tone: "success" }) : llqaMini("Hand out", () => open("give", giveForm(it)), { key: "g" }),
                    llqaMini("Edit", () => open("item", { ...it, was: llqaPN(it.onHand) }), { key: "e" }),
                  ]),
                  "a",
                ),
              );
            }),
          )
        : empty("Nothing handed out. “Hand out an item” gives an asset to a teacher, team lead or staff member, with a date to come back."),
    );
  } else if (tab === "suppliers") {
    const stat = (v) => {
      const mine = pos.filter((p) => llqaProcNorm(p.vendor) === llqaProcNorm(v.name));
      const spend = mine.filter((p) => LLQA_PO_SPENT.includes(p.status)).reduce((a, p) => a + (llqaPoPKR(p, R) || 0), 0);
      const owed = (ctx.apLiabilities || []).filter((b) => b && llqaProcNorm(b.vendor) === llqaProcNorm(v.name)).reduce((a, b) => a + (llqaToPKR(llqaApLeft(b), b.currency || "PKR", R).pkr || 0), 0);
      return { n: mine.length, spend, open: mine.filter((p) => LLQA_PO_OPEN.includes(p.status)).length, owed, lead: llqaProcLead(pos, v.name) };
    };
    const list = vendors.filter((v) => hit(v.name, v.contact, v.phone, v.email, v.category));
    csv = [
      ["Supplier", "Contact", "Phone", "Email", "Address", "Supplies", "Payment terms (days)", "Orders", "Open", "Spend (PKR)", "Owed (PKR)", "Days to deliver (average)"],
      ...list.map((v) => {
        const s = stat(v);
        return [v.name, v.contact || "", v.phone || "", v.email || "", v.address || "", v.category || "", llqaPN(v.terms), s.n, s.open, Math.round(s.spend), Math.round(s.owed), s.lead == null ? "" : s.lead];
      }),
    ];
    content = list.length
      ? llqaTable(
          ["Supplier", "Contact", "Terms", "Orders", "Spend", "Owed", ""],
          list.map((v) => {
            const s = stat(v);
            return React.createElement(
              "tr",
              { key: v.name },
              rowTitle(v.name, v.unsaved ? "no details kept yet" : [v.category, s.lead != null ? "delivers in " + s.lead + " days on average" : ""].filter(Boolean).join(" · "), "n"),
              llqaTd([v.contact || "—", v.phone || v.email ? llqaSmall([v.phone, v.email].filter(Boolean).join(" · "), null, "p") : null], "c"),
              llqaTd(llqaPN(v.terms) > 0 ? llqaPN(v.terms) + " days" : "on delivery", "t"),
              llqaTd(s.n + (s.open ? " (" + s.open + " open)" : ""), "o"),
              llqaTd(llqaPKR(s.spend), "s"),
              llqaTd(React.createElement("span", { style: { color: s.owed > 0 ? c.warn : c.textSec, fontWeight: 700 } }, llqaPKR(s.owed)), "w"),
              llqaTd(btnRow([llqaMini(v.unsaved ? "Add details" : "Edit", () => open("vendor", { ...v, terms: llqaPN(v.terms) ? String(llqaPN(v.terms)) : "", was: v.name }), { key: "e" })]), "a"),
            );
          }),
        )
      : empty("No suppliers yet — “＋ Add supplier” keeps one (Accounts Payable uses the same list).");
  } else if (tab === "analytics") {
    const byCat = {};
    inv.forEach((it) => {
      const k = it.category || "Other";
      byCat[k] = byCat[k] || { n: 0, v: 0 };
      byCat[k].n++;
      byCat[k].v += Math.max(0, llqaPN(it.onHand)) * llqaPN(it.unitValue);
    });
    const bySt = {};
    pos.forEach((p) => (bySt[p.status || "—"] = (bySt[p.status || "—"] || 0) + 1));
    const months = [];
    for (let i = 5; i >= 0; i--) months.push(llqaMonthAdd(ym, -i));
    const byMonth = months.map((m) => ({ m, v: pos.filter((p) => LLQA_PO_SPENT.includes(p.status) && llqaPoMonth(p) === m).reduce((a, p) => a + (llqaPoPKR(p, R) || 0), 0) }));
    const maxM = Math.max(1, ...byMonth.map((x) => x.v));
    const bySup = {};
    pos.filter((p) => LLQA_PO_SPENT.includes(p.status)).forEach((p) => (bySup[p.vendor || "—"] = (bySup[p.vendor || "—"] || 0) + (llqaPoPKR(p, R) || 0)));
    const totalV = Object.values(byCat).reduce((a, x) => a + x.v, 0) || 1;
    csv = [["Month", "Spend (PKR)"], ...byMonth.map((x) => [x.m, Math.round(x.v)])];
    content = React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 } },
      llqaCard(
        [
          head("Spend by month (approved and further)", "h"),
          ...byMonth.map((x) =>
            React.createElement(
              "div",
              { key: x.m, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 } },
              React.createElement("span", { style: { width: 72, color: c.textSec } }, llqaMonthLabel(x.m)),
              React.createElement("div", { style: { flex: 1, height: 8, background: c.bgDeep, borderRadius: 4 } }, React.createElement("div", { style: { width: Math.round((x.v / maxM) * 100) + "%", height: 8, borderRadius: 4, background: c.accent } })),
              React.createElement("span", { style: { width: 96, textAlign: "right", color: c.text, fontWeight: 700 } }, llqaPKR(x.v)),
            ),
          ),
        ],
        { key: "m" },
      ),
      llqaCard([head("Stock value by category", "h"), Object.keys(byCat).length ? React.createElement("div", { key: "t" }, llqaTable(["Category", "Items", "Value", "Share"], Object.keys(byCat).sort((a, b) => byCat[b].v - byCat[a].v).map((k) => React.createElement("tr", { key: k }, llqaTd(k, "c"), llqaTd(byCat[k].n, "n"), llqaTd(llqaPKR(byCat[k].v), "v"), llqaTd(Math.round((byCat[k].v / totalV) * 100) + "%", "s"))))) : note("No items yet.", "e")], { key: "c" }),
      llqaCard([head("Orders by status", "h"), Object.keys(bySt).length ? React.createElement("div", { key: "t" }, llqaTable(["Status", "Orders"], Object.keys(bySt).map((k) => React.createElement("tr", { key: k }, llqaTd((LLQA_PO_STATES[k] || [k])[0], "s"), llqaTd(bySt[k], "n"))))) : note("No orders yet.", "e")], { key: "s" }),
      llqaCard(
        [
          head("Top suppliers", "h"),
          Object.keys(bySup).length
            ? React.createElement(
                "div",
                { key: "t" },
                llqaTable(
                  ["Supplier", "Spend", "Days to deliver"],
                  Object.keys(bySup)
                    .sort((a, b) => bySup[b] - bySup[a])
                    .slice(0, 8)
                    .map((k) => {
                      const ld = llqaProcLead(pos, k);
                      return React.createElement("tr", { key: k }, llqaTd(k, "v"), llqaTd(llqaPKR(bySup[k]), "s"), llqaTd(ld == null ? "—" : ld + " days", "d"));
                    }),
                ),
              )
            : note("No spend yet.", "e"),
        ],
        { key: "v" },
      ),
    );
  } else if (tab === "rules") {
    const f = rf || { limit: rules.limit ? String(rules.limit) : "", budgets: Object.fromEntries(LLQA_PROC_CATS.map((k) => [k, llqaPN(rules.budgets[k]) ? String(llqaPN(rules.budgets[k])) : ""])), autoReorder: rules.autoReorder };
    const set = (patch) => setRf({ ...f, ...patch });
    const save = () => {
      if (!boss) return;
      const ok = llqaSetFin((d) => ({ ...d, procRules: { limit: Math.max(0, llqaPN(f.limit)), budgets: Object.fromEntries(Object.entries(f.budgets).filter(([, v]) => llqaPN(v) > 0).map(([k, v]) => [k, llqaPN(v)])), autoReorder: !!f.autoReorder, by: llqaPayActor(), at: new Date().toISOString() } }));
      if (!ok) return setErr("The rules can't be saved from here.");
      setRf(null);
      setErr("");
      llqaToast({ kind: "info", ttl: 5000, text: "✓ Procurement rules saved." });
    };
    content = !boss
      ? empty("The Super Admin sets these. Now: approval limit " + (rules.limit > 0 ? llqaPKR(rules.limit) + " (above it, or over a category's monthly budget, the Super Admin approves)" : "none — the Super Admin approves every request") + "; automatic reorder " + (rules.autoReorder ? "on" : "off") + ".")
      : llqaCard(
          [
            head("Who approves, the monthly budgets, automatic reorder", "h"),
            llqaSmall("The Super Admin approves any request. Someone else who can open Procurement approves a request up to this limit and within its category's monthly budget — never their own. No limit: only the Super Admin approves.", null, "x"),
            React.createElement(
              "div",
              { key: "g", style: { marginTop: 10 } },
              llqaV77Grid([React.createElement(Inp, { key: "l", label: "Approval limit (PKR)", type: "number", value: f.limit, onChange: (v) => set({ limit: v }) }), ...LLQA_PROC_CATS.map((k) => React.createElement(Inp, { key: k, label: k + " — budget a month (PKR)", type: "number", value: f.budgets[k], onChange: (v) => set({ budgets: { ...f.budgets, [k]: v } }) }))]),
            ),
            React.createElement("label", { key: "a", style: { display: "flex", gap: 8, alignItems: "center", color: c.text, fontSize: 12, margin: "4px 0 12px" } }, React.createElement("input", { type: "checkbox", checked: !!f.autoReorder, onChange: (e) => set({ autoReorder: e.target.checked }) }), "Automatic reorder — an item at its reorder point asks for its own order (one request per supplier, waiting for approval)"),
            err && !win ? React.createElement("div", { key: "err", style: { color: c.danger, fontSize: 12, marginBottom: 8 } }, err) : null,
            React.createElement("div", { key: "b", style: { display: "flex", gap: 8 } }, llqaMini("✓ Save rules", save, { key: "s", big: true, solid: true, tone: "success" }), rf ? llqaMini("Cancel", () => setRf(null), { key: "x", big: true }) : null),
          ],
          { key: "r" },
        );
  }

  /* ---------- windows ---------- */
  let modal = null;
  const foot = (okLabel, ok, tone) => [llqaMini("Cancel", close, { key: "x", big: true }), llqaMini(okLabel, ok, { key: "ok", big: true, solid: true, tone: tone || "success" })];
  const errLine = err ? React.createElement("div", { key: "err", style: { color: c.danger, fontSize: 12, marginTop: 8 } }, err) : null;
  const check = (k, checked, onChange, label) => React.createElement("label", { key: k, style: { display: "flex", gap: 8, alignItems: "center", color: c.text, fontSize: 12, margin: "4px 0" } }, React.createElement("input", { type: "checkbox", checked: !!checked, onChange: (e) => onChange(e.target.checked) }), label);
  if (win === "po") {
    const f = form;
    const lines = f.lines && f.lines.length ? f.lines : [{ id: "l1", itemId: "", item: "", unit: "pcs", qty: "", unitCost: "" }];
    const setLine = (i, patch) => setForm({ ...f, lines: lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
    const pickItem = (i, v) => {
      const it = inv.find((x) => String(x.id) === String(v));
      setLine(i, it ? { itemId: String(it.id), item: it.name, unit: it.unit || "pcs", unitCost: lines[i].unitCost || (llqaPN(it.unitValue) ? String(llqaPN(it.unitValue)) : "") } : { itemId: "", item: "" });
    };
    const total = lines.reduce((a, l) => a + llqaPN(l.qty) * llqaPN(l.unitCost), 0);
    const save = (asOrder) => {
      const vendor = String(f.vendor || "").trim();
      if (!vendor) return setErr("Choose or type the supplier.");
      const ok = lines.filter((l) => String(l.item || "").trim() && llqaPN(l.qty) > 0);
      if (!ok.length) return setErr("Add at least one item with a quantity.");
      if (f.id) {
        const old = pos.find((x) => x.id === f.id) || f;
        const nl = ok.map((l, i) => ({ id: l.id || "l" + (i + 1) + "_" + Date.now().toString(36), itemId: l.itemId !== "" && l.itemId != null ? (inv.find((x) => String(x.id) === String(l.itemId)) || {}).id || l.itemId : null, item: String(l.item).trim(), unit: l.unit || "", qty: llqaPN(l.qty), unitCost: llqaPN(l.unitCost) }));
        const after = { ...old, lines: nl, currency: f.currency || "PKR" };
        // changed after approval by someone other than the Super Admin, for more: it waits for approval again
        const up = !boss && old.status !== "Requested" && old.status !== "Rejected" && old.status !== "Cancelled" && (llqaPoPKR(after, R) == null ? Infinity : llqaPoPKR(after, R)) > (llqaPoPKR(old, R) || 0);
        llqaProcSet(old, { vendor, category: f.category || "Other", currency: f.currency || "PKR", date: llqaIsDay(f.date) ? f.date : old.date, notes: String(f.notes || "").trim(), lines: nl, item: null, qty: null, unitCost: null, ...(up ? { status: "Requested", approvedBy: "", approvedAt: "" } : {}) }, up ? "changed for more — waits for approval again" : "changed");
        close();
        return llqaToast({ kind: "info", ttl: 5000, text: up ? "✓ Changed — the total went up, so it waits for approval again." : "✓ Order changed." });
      }
      const p = llqaProcRequest({ ...f, vendor, lines: ok, status: asOrder ? "Ordered" : "Requested" });
      if (!p) return setErr("The request could not be saved.");
      close();
      llqaToast({ kind: "info", ttl: 5000, text: p.status === "Ordered" ? "✓ " + p.poNum + " ordered." : "✓ " + p.poNum + " sent for approval." });
    };
    const vOpts = [...new Set([...vendors.map((v) => v.name), ...(f.vendor ? [String(f.vendor).trim()] : [])])].filter(Boolean);
    modal = llqaShell(
      f.id ? "Edit " + f.poNum : "＋ New request",
      f.id ? (boss || f.status === "Requested" ? "Change the order." : "A change for more after approval sends it back for approval.") : boss ? "As Super Admin you can order straight away, or save it as a request." : "Sent for approval — the Super Admin, or someone within the limit and the budget.",
      [
        llqaV77Grid([
          vOpts.length ? React.createElement(Inp, { key: "v", label: "Supplier", value: f.vendor || "", onChange: (v) => setForm({ ...f, vendor: v, newVendor: "" }), options: vOpts }) : null,
          React.createElement(Inp, { key: "vn", label: vOpts.length ? "…or a new supplier" : "Supplier", value: vOpts.length ? f.newVendor || "" : f.vendor || "", onChange: (v) => setForm({ ...f, newVendor: v, vendor: v }), placeholder: "Supplier name" }),
          React.createElement(Inp, { key: "c", label: "Category", value: f.category || "Other", onChange: (v) => setForm({ ...f, category: v }), options: LLQA_PROC_CATS }),
          React.createElement(Inp, { key: "cu", label: "Currency", value: f.currency || "PKR", onChange: (v) => setForm({ ...f, currency: v }), options: LLQA_PROC_CURS }),
          React.createElement(Inp, { key: "d", label: "Date", type: "date", value: f.date || today, onChange: (v) => setForm({ ...f, date: v }) }),
        ]),
        React.createElement("div", { key: "lh", style: { fontWeight: 700, color: c.text, fontSize: 12, margin: "4px 0 6px" } }, "Items"),
        ...lines.map((l, i) =>
          React.createElement(
            "div",
            { key: "ln" + i, style: { display: "grid", gridTemplateColumns: "minmax(140px, 2fr) minmax(110px, 1.4fr) minmax(80px, 1fr) minmax(80px, 1fr) auto", gap: "0 8px", alignItems: "end" } },
            React.createElement(Inp, { key: "it", label: "Item " + (i + 1), value: l.itemId ? String(l.itemId) : "", onChange: (v) => pickItem(i, v), options: [{ value: "", label: "— a new item —" }, ...inv.map((it) => ({ value: String(it.id), label: it.name || "—" }))] }),
            l.itemId ? React.createElement(Inp, { key: "u", label: "Unit", value: l.unit || "pcs", onChange: (v) => setLine(i, { unit: v }), options: LLQA_PROC_UNITS }) : React.createElement(Inp, { key: "nm", label: "New item's name", value: l.item || "", onChange: (v) => setLine(i, { item: v }) }),
            React.createElement(Inp, { key: "q", label: "Quantity", type: "number", value: l.qty, onChange: (v) => setLine(i, { qty: v }) }),
            React.createElement(Inp, { key: "c", label: "Unit cost", type: "number", value: l.unitCost, onChange: (v) => setLine(i, { unitCost: v }) }),
            React.createElement("div", { key: "x", style: { marginBottom: 12 } }, lines.length > 1 ? llqaMini("✕", () => setForm({ ...f, lines: lines.filter((_, j) => j !== i) }), { key: "x", title: "Remove this item" }) : null),
          ),
        ),
        React.createElement(
          "div",
          { key: "add", style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
          llqaMini("＋ Another item", () => setForm({ ...f, lines: [...lines, { id: "l" + (lines.length + 1) + "_" + Date.now().toString(36), itemId: "", item: "", unit: "pcs", qty: "", unitCost: "" }] }), { key: "a" }),
          React.createElement("span", { key: "t", style: { fontWeight: 800, color: c.text } }, "Total " + llqaAmt(total, f.currency || "PKR")),
        ),
        React.createElement(Inp, { key: "n", label: "Notes", value: f.notes || "", onChange: (v) => setForm({ ...f, notes: v }) }),
        errLine,
      ],
      [llqaMini("Cancel", close, { key: "x", big: true }), !f.id && boss ? llqaMini("Save as request", () => save(false), { key: "rq", big: true }) : null, llqaMini(f.id ? "✓ Save" : boss ? "✓ Order now" : "✓ Send for approval", () => save(!f.id && boss), { key: "ok", big: true, solid: true, tone: "success" })],
      { onClose: close, width: 820 },
    );
  } else if (win === "approve") {
    const p = form.p;
    const cat = p.category || "Other";
    const bud = llqaPN(rules.budgets[cat]);
    const sp = llqaProcSpent(cat, ym, pos, p.id, R);
    const amt = llqaPoPKR(p, R);
    modal = llqaShell(
      "✓ Approve " + p.poNum,
      (p.vendor || "—") + " · " + llqaAmt(llqaPoTotal(p), p.currency || "PKR") + (p.currency && p.currency !== "PKR" && amt != null ? " (" + llqaPKR(amt) + ")" : ""),
      [
        note(llqaPoItems(p), "i"),
        bud > 0 ? llqaSmall(cat + " this month: " + llqaPKR(sp) + " of " + llqaPKR(bud) + (amt != null ? " — " + llqaPKR(sp + amt) + " with this" : ""), form.over ? c.warn : null, "b") : null,
        form.over ? llqaSmall("Over this month's " + cat + " budget.", c.warn, "o") : null,
        p.notes ? llqaSmall(p.notes, null, "n") : null,
        errLine,
      ],
      foot("✓ Approve", () => run(() => llqaProcApprove(p))),
      { onClose: close, width: 560 },
    );
  } else if (win === "reason") {
    const p = form.p;
    const rej = form.kind === "reject";
    modal = llqaShell(
      (rej ? "✕ Reject " : "Cancel ") + p.poNum,
      rej ? "The person who asked sees the reason." : "The order stays in the list as cancelled.",
      [React.createElement(Inp, { key: "w", label: "Reason", value: form.why || "", onChange: (v) => setForm({ ...form, why: v }) }), errLine],
      foot(
        rej ? "✕ Reject" : "Cancel the order",
        () => {
          const w = String(form.why || "").trim();
          if (!w) return setErr("Give the reason.");
          llqaProcSet(p, rej ? { status: "Rejected", rejectedBy: llqaPayActor(), rejectedAt: new Date().toISOString(), rejectWhy: w } : { status: "Cancelled", cancelledBy: llqaPayActor(), cancelledAt: new Date().toISOString(), rejectWhy: w }, (rej ? "rejected: " : "cancelled: ") + w);
          close();
        },
        "danger",
      ),
      { onClose: close, width: 520 },
    );
  } else if (win === "receive") {
    const p = form.p;
    const ls = llqaPoLines(p);
    const amt = ls.reduce((a, l) => a + llqaPN(form.got[l.id]) * llqaPN(l.unitCost), 0);
    const vd = llqaApVendor(p.vendor) || {};
    const terms = Math.max(0, Math.round(llqaPN(vd.terms)));
    const part = ls.some((l) => llqaPN(form.got[l.id]) < llqaPN(l.qty));
    modal = llqaShell(
      "📦 Receive " + p.poNum,
      "What came is added to stock; its bill goes to Accounts Payable, due " + (terms ? "in " + terms + " days (" + (p.vendor || "the supplier") + "'s terms)" : "on the day (no payment terms kept for " + (p.vendor || "this supplier") + ")") + ".",
      [
        ...ls.map((l) => React.createElement(Inp, { key: l.id, label: (l.item || "Item") + " — ordered " + llqaPN(l.qty) + " (" + llqaAmt(l.unitCost, p.currency || "PKR") + " each): received", type: "number", value: form.got[l.id], onChange: (v) => setForm({ ...form, got: { ...form.got, [l.id]: v } }) })),
        llqaV77Grid([
          React.createElement(Inp, { key: "d", label: "Received on", type: "date", value: form.date, onChange: (v) => setForm({ ...form, date: v }) }),
          form.paidNow ? React.createElement(Inp, { key: "m", label: "Paid by", value: form.method, onChange: (v) => setForm({ ...form, method: v }), options: LLQA_AP_METHODS }) : null,
        ]),
        check("p", form.paidNow, (v) => setForm({ ...form, paidNow: v }), "Paid in full now (a cash purchase) — the bill is marked paid"),
        part ? check("k", form.keepRest, (v) => setForm({ ...form, keepRest: v }), "Keep the rest on order (as " + (p.restRoot || p.poNum) + "-" + (2 + pos.filter((x) => x.restRoot === (p.restRoot || p.poNum)).length) + ")") : null,
        React.createElement("div", { key: "t", style: { fontWeight: 800, color: c.text, marginTop: 8 } }, "Bill: " + llqaAmt(amt, p.currency || "PKR")),
        errLine,
      ],
      foot("📦 Receive", () => {
        const r = run(() => llqaProcReceive(p, form.got, { date: form.date, paidNow: form.paidNow, method: form.method, keepRest: form.keepRest }));
        if (r && r.ok)
          llqaToast({
            kind: "info",
            ttl: 8000,
            text: "✓ " + p.poNum + " received: stock updated" + (r.bill ? "; bill " + llqaAmt(r.bill.amount, r.bill.currency) + " in Accounts Payable" + (form.paidNow ? " (paid)" : ", due " + (llqaDateLabel(r.bill.dueDate) || r.bill.dueDate)) : "") + (r.rest ? "; the rest on order as " + r.rest.poNum : "") + ".",
            actions: r.bill && llqaCanOpen("ap") ? [{ label: "Accounts Payable", run: () => llqaGo("ap") }] : [],
          });
      }),
      { onClose: close, width: 640 },
    );
  } else if (win === "unreceive") {
    const p = form.p;
    modal = llqaShell("↩ Undo the receipt of " + p.poNum, "What it added goes back out of stock, its unpaid bill is removed (kept in Finance's removed bills)" + (p.restId != null ? ", and the rest still on order is removed" : "") + ". The order goes back to Ordered.", [errLine], foot("↩ Undo receipt", () => run(() => llqaProcUnreceive(p)), "danger"), { onClose: close, width: 540 });
  } else if (win === "delPo" || win === "delItem") {
    const isPo = win === "delPo";
    const x = isPo ? form.p : form.it;
    modal = llqaShell(
      "Delete " + (isPo ? x.poNum : x.name),
      isPo ? "The order is removed from the list." : "The item is removed from stock." + (x.custodyStatus === "Issued" ? " It is still with " + (x.issuedTo || "someone") + "." : ""),
      [errLine],
      foot(
        "Delete",
        () => {
          if (isPo) setProcPurchases((prev) => (prev || []).filter((p) => !(p && p.id === x.id)));
          else setProcInventory((prev) => (prev || []).filter((it) => !(it && it.id === x.id)));
          close();
        },
        "danger",
      ),
      { onClose: close, width: 480 },
    );
  } else if (win === "item") {
    const f = form;
    const save = () => {
      if (!String(f.name || "").trim()) return setErr("Give the item a name.");
      const isNew = !(f.id != null && inv.some((x) => x.id === f.id));
      const { was, ...rest } = f;
      const rec = { ...rest, name: String(f.name).trim(), onHand: llqaPN(f.onHand), reorderPoint: llqaPN(f.reorderPoint), reorderQty: llqaPN(f.reorderQty), unitValue: llqaPN(f.unitValue), updated: today };
      if (!isNew && llqaPN(was) !== rec.onHand) rec.moves = llqaProcMoves(rec, llqaR2(rec.onHand - llqaPN(was)), "count corrected from " + llqaPN(was) + " to " + rec.onHand);
      if (isNew) setProcInventory((prev) => [...(prev || []), { ...rec, id: llqaUid("it"), moves: rec.onHand ? llqaProcMoves({}, rec.onHand, "first count") : [] }]);
      else setProcInventory((prev) => (prev || []).map((x) => (x && x.id === f.id ? rec : x)));
      close();
    };
    const moves = Array.isArray(f.moves) ? f.moves.slice(-6).reverse() : [];
    modal = llqaShell(
      f.id != null ? "Edit " + (f.name || "item") : "＋ Add item",
      "Stock, where it is kept, when to reorder, and who has it.",
      [
        llqaV77Grid([
          React.createElement(Inp, { key: "n", label: "Item name", value: f.name || "", onChange: (v) => setForm({ ...f, name: v }) }),
          React.createElement(Inp, { key: "s", label: "SKU / code", value: f.sku || "", onChange: (v) => setForm({ ...f, sku: v }) }),
          React.createElement(Inp, { key: "c", label: "Category", value: f.category || "Office Supplies", onChange: (v) => setForm({ ...f, category: v }), options: LLQA_PROC_CATS }),
          React.createElement(Inp, { key: "u", label: "Unit", value: f.unit || "pcs", onChange: (v) => setForm({ ...f, unit: v }), options: LLQA_PROC_UNITS }),
          React.createElement(Inp, { key: "o", label: "On hand", type: "number", value: String(f.onHand == null ? "" : f.onHand), onChange: (v) => setForm({ ...f, onHand: v }) }),
          React.createElement(Inp, { key: "r", label: "Reorder at", type: "number", value: String(f.reorderPoint == null ? "" : f.reorderPoint), onChange: (v) => setForm({ ...f, reorderPoint: v }) }),
          React.createElement(Inp, { key: "rq", label: "Reorder quantity", type: "number", value: String(f.reorderQty == null || f.reorderQty === 0 ? "" : f.reorderQty), onChange: (v) => setForm({ ...f, reorderQty: v }), placeholder: "enough for twice the reorder point" }),
          React.createElement(Inp, { key: "v", label: "Unit value (PKR)", type: "number", value: String(f.unitValue == null ? "" : f.unitValue), onChange: (v) => setForm({ ...f, unitValue: v }) }),
          vendors.length ? React.createElement(Inp, { key: "sp", label: "Usual supplier", value: f.vendor || "", onChange: (v) => setForm({ ...f, vendor: v }), options: vendors.map((v) => v.name) }) : React.createElement(Inp, { key: "sp", label: "Usual supplier", value: f.vendor || "", onChange: (v) => setForm({ ...f, vendor: v }) }),
          React.createElement(Inp, { key: "l", label: "Location", value: f.location || "", onChange: (v) => setForm({ ...f, location: v }) }),
          React.createElement(Inp, { key: "a", label: "Authorized for", value: f.authorizedFor || "Anyone", onChange: (v) => setForm({ ...f, authorizedFor: v }), options: LLQA_PROC_AUTH }),
          React.createElement(Inp, { key: "cs", label: "Custody status", value: f.custodyStatus || "In Store", onChange: (v) => setForm({ ...f, custodyStatus: v }), options: LLQA_PROC_CUSTODY }),
          React.createElement(Inp, { key: "it", label: "Issued to", value: f.issuedTo || "", onChange: (v) => setForm({ ...f, issuedTo: v, issuedToId: "" }) }),
          React.createElement(Inp, { key: "rr", label: "Receiver role", value: f.receiverRole || "", onChange: (v) => setForm({ ...f, receiverRole: v }), options: ["Teacher", "Team Lead", "Manager", "Admin", "Staff", "Other"] }),
          React.createElement(Inp, { key: "ib", label: "Issued by", value: f.issuedBy || "", onChange: (v) => setForm({ ...f, issuedBy: v }) }),
          React.createElement(Inp, { key: "cd", label: "Condition", value: f.condition || "New", onChange: (v) => setForm({ ...f, condition: v }), options: LLQA_PROC_COND }),
          React.createElement(Inp, { key: "id", label: "Issue date", type: "date", value: f.issueDate || "", onChange: (v) => setForm({ ...f, issueDate: v }) }),
          React.createElement(Inp, { key: "db", label: "Back by", type: "date", value: f.dueBack || "", onChange: (v) => setForm({ ...f, dueBack: v }) }),
          React.createElement(Inp, { key: "rd", label: "Return date", type: "date", value: f.returnDate || "", onChange: (v) => setForm({ ...f, returnDate: v }) }),
        ]),
        React.createElement(Inp, { key: "no", label: "Notes", value: f.notes || "", onChange: (v) => setForm({ ...f, notes: v }) }),
        moves.length ? llqaSmall("Stock moves: " + moves.map((m) => (llqaDateLabel(String(m.at || "").slice(0, 10)) || "") + " " + (m.qty > 0 ? "+" : "") + m.qty + " " + m.what + (m.by ? " (" + m.by + ")" : "")).join(" · "), null, "mv") : null,
        errLine,
      ],
      foot("✓ Save", save),
      { onClose: close, width: 780 },
    );
  } else if (win === "take") {
    const it = form.it;
    modal = llqaShell(
      "Take out — " + (it.name || "item"),
      llqaPN(it.onHand) + " " + (it.unit || "") + " in stock. Logged on the item; at the reorder point it asks for its reorder.",
      [
        llqaV77Grid([
          React.createElement(Inp, { key: "q", label: "How many", type: "number", value: form.qty, onChange: (v) => setForm({ ...form, qty: v }) }),
          people.length ? React.createElement(Inp, { key: "w", label: "Who took it", value: form.who, onChange: (v) => setForm({ ...form, who: v }), options: people.map((p) => p.name) }) : React.createElement(Inp, { key: "w", label: "Who took it", value: form.who, onChange: (v) => setForm({ ...form, who: v }) }),
          React.createElement(Inp, { key: "y", label: "What for", value: form.why, onChange: (v) => setForm({ ...form, why: v }), placeholder: "e.g. the Hifz class" }),
          React.createElement(Inp, { key: "d", label: "Date", type: "date", value: form.date, onChange: (v) => setForm({ ...form, date: v }) }),
        ]),
        errLine,
      ],
      foot("✓ Take out", () => run(() => llqaProcTakeOut(it, form))),
      { onClose: close, width: 600 },
    );
  } else if (win === "give") {
    const back = form.mode === "return";
    const it = form.it || inv.find((x) => String(x.id) === String(form.pick)) || null;
    const save = () => {
      if (!it) return setErr("Choose the item.");
      const now = new Date().toISOString();
      const clog = (x, what) => [...(Array.isArray(x.custodyLog) ? x.custodyLog : []), { at: now, by: llqaPayActor(), what }].slice(-30);
      if (back) {
        setProcInventory((prev) => (prev || []).map((x) => (x && x.id === it.id ? { ...x, custodyStatus: form.lost ? "Lost" : form.repair ? "Under Repair" : "Returned", returnDate: form.date || today, condition: form.condition || x.condition, custodyLog: clog(x, (form.lost ? "lost by " : form.repair ? "back for repair from " : "returned by ") + (x.issuedTo || "—") + (form.condition ? " (" + form.condition + ")" : "")) } : x)));
        return close();
      }
      const person = people.find((p) => p.id === form.who);
      const name = person ? person.name : String(form.other || "").trim();
      if (!name) return setErr("Choose who gets it (or type a name).");
      setProcInventory((prev) => (prev || []).map((x) => (x && x.id === it.id ? { ...x, custodyStatus: "Issued", issuedTo: name, issuedToId: person ? person.id : "", receiverRole: person ? person.role : "Other", issuedBy: llqaPayActor(), issueDate: form.date || today, dueBack: form.dueBack || "", returnDate: "", condition: form.condition || x.condition, custodyLog: clog(x, "given to " + name + (form.dueBack ? ", back by " + form.dueBack : "")) } : x)));
      close();
    };
    modal = llqaShell(
      back ? "↩ " + it.name + " — back from " + (it.issuedTo || "—") : it ? "Hand out — " + it.name : "Hand out an item",
      back ? "Where it is now and its condition." : "To a teacher, team lead or staff member (or another name); a date to come back flags it when overdue, and an asset with someone who has left is flagged too.",
      [
        back
          ? llqaV77Grid([React.createElement(Inp, { key: "c", label: "Condition", value: form.condition, onChange: (v) => setForm({ ...form, condition: v }), options: LLQA_PROC_COND }), React.createElement(Inp, { key: "d", label: "Returned on", type: "date", value: form.date, onChange: (v) => setForm({ ...form, date: v }) })])
          : llqaV77Grid([
              !form.it ? React.createElement(Inp, { key: "i", label: "Item", value: form.pick ? String(form.pick) : "", onChange: (v) => setForm({ ...form, pick: v }), options: inStore.map((x) => ({ value: String(x.id), label: x.name || "—" })) }) : null,
              React.createElement(Inp, { key: "w", label: "Give to", value: form.who, onChange: (v) => setForm({ ...form, who: v }), options: [{ value: "", label: "— someone else —" }, ...people.map((p) => ({ value: p.id, label: p.name + " (" + p.role + ")" }))] }),
              !form.who ? React.createElement(Inp, { key: "o", label: "Name", value: form.other, onChange: (v) => setForm({ ...form, other: v }) }) : null,
              React.createElement(Inp, { key: "d", label: "Given on", type: "date", value: form.date, onChange: (v) => setForm({ ...form, date: v }) }),
              React.createElement(Inp, { key: "b", label: "Back by (optional)", type: "date", value: form.dueBack, onChange: (v) => setForm({ ...form, dueBack: v }) }),
              React.createElement(Inp, { key: "c", label: "Condition", value: form.condition, onChange: (v) => setForm({ ...form, condition: v }), options: LLQA_PROC_COND }),
            ]),
        back ? check("r", form.repair, (v) => setForm({ ...form, repair: v, lost: false }), "Needs repair") : null,
        back ? check("l", form.lost, (v) => setForm({ ...form, lost: v, repair: false }), "Lost (not returned)") : null,
        it && Array.isArray(it.custodyLog) && it.custodyLog.length ? llqaSmall("Before: " + it.custodyLog.slice(-3).map((x) => (llqaDateLabel(String(x.at || "").slice(0, 10)) || "") + " " + x.what).join(" · "), null, "h") : null,
        errLine,
      ],
      foot(back ? "✓ Save" : "✓ Hand out", save),
      { onClose: close, width: 640 },
    );
  } else if (win === "vendor") {
    const f = form;
    const save = () => {
      const name = String(f.name || "").trim();
      if (!name) return setErr("Give the supplier's name.");
      const info = { contact: String(f.contact || "").trim(), phone: String(f.phone || "").trim(), email: String(f.email || "").trim(), address: String(f.address || "").trim(), category: f.category || "", terms: Math.max(0, Math.round(llqaPN(f.terms))), bank: String(f.bank || "").trim(), title: String(f.title || "").trim(), account: String(f.account || "").trim(), notes: String(f.notes || "").trim() };
      if (!llqaApSetVendor(name, info)) return setErr("Supplier details can't be saved from here.");
      close();
      llqaToast({ kind: "info", ttl: 5000, text: "✓ " + name + " kept — Procurement and Accounts Payable use it." });
    };
    modal = llqaShell(
      f.was ? f.was : "＋ Add supplier",
      "One supplier list for the CRM — orders, bills and payments use it.",
      [
        llqaV77Grid([
          f.was ? null : React.createElement(Inp, { key: "n", label: "Name", value: f.name || "", onChange: (v) => setForm({ ...f, name: v }) }),
          React.createElement(Inp, { key: "c", label: "Contact person", value: f.contact || "", onChange: (v) => setForm({ ...f, contact: v }) }),
          React.createElement(Inp, { key: "p", label: "Phone", value: f.phone || "", onChange: (v) => setForm({ ...f, phone: v }) }),
          React.createElement(Inp, { key: "e", label: "Email", value: f.email || "", onChange: (v) => setForm({ ...f, email: v }) }),
          React.createElement(Inp, { key: "t", label: "Payment terms (days after delivery)", type: "number", value: f.terms || "", onChange: (v) => setForm({ ...f, terms: v }) }),
          React.createElement(Inp, { key: "k", label: "Supplies", value: f.category || "", onChange: (v) => setForm({ ...f, category: v }), options: LLQA_PROC_CATS }),
          React.createElement(Inp, { key: "b", label: "Bank", value: f.bank || "", onChange: (v) => setForm({ ...f, bank: v }) }),
          React.createElement(Inp, { key: "ti", label: "Account title", value: f.title || "", onChange: (v) => setForm({ ...f, title: v }) }),
          React.createElement(Inp, { key: "a", label: "Account no. / IBAN", value: f.account || "", onChange: (v) => setForm({ ...f, account: v }) }),
        ]),
        React.createElement(Inp, { key: "ad", label: "Address", value: f.address || "", onChange: (v) => setForm({ ...f, address: v }) }),
        React.createElement(Inp, { key: "no", label: "Notes", value: f.notes || "", onChange: (v) => setForm({ ...f, notes: v }) }),
        errLine,
      ],
      foot("✓ Save", save),
      { onClose: close, width: 720 },
    );
  }

  const TABS = [
    ["overview", "Overview"],
    ["orders", "Requests & Orders" + (toApprove.length ? " (" + toApprove.length + " to approve)" : "")],
    ["inventory", "Inventory"],
    ["lowstock", "Low Stock" + (lowList.length ? " (" + lowList.length + ")" : "")],
    ["issued", "Issued Items" + (flagged.length ? " (" + flagged.length + " to get back)" : "")],
    ["suppliers", "Suppliers"],
    ["analytics", "Analytics"],
    ["rules", "Rules"],
  ];
  const addBtn =
    tab === "overview" || tab === "orders"
      ? llqaMini("＋ New request", () => open("po", { vendor: "", category: "Office Supplies", currency: "PKR", date: today, lines: [{ id: "l1", itemId: "", item: "", unit: "pcs", qty: "", unitCost: "" }], notes: "" }), { key: "add", big: true, solid: true, tone: "success" })
      : tab === "inventory" || tab === "lowstock"
        ? llqaMini("＋ Add item", () => open("item", { name: "", sku: "", category: "Office Supplies", unit: "pcs", onHand: "", reorderPoint: "", reorderQty: "", unitValue: "", location: "", authorizedFor: "Anyone", custodyStatus: "In Store", condition: "New", notes: "" }), { key: "add", big: true, solid: true, tone: "success" })
        : tab === "suppliers"
          ? llqaMini("＋ Add supplier", () => open("vendor", { name: "", terms: "" }), { key: "add", big: true, solid: true, tone: "success" })
          : null;
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 } },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { style: { color: c.text, fontSize: 20, fontWeight: 800, margin: 0 } }, "Procurement"),
        React.createElement("div", { style: { color: c.textSec, fontSize: 12, marginTop: 3 } }, "Request → approve → order → receive: what comes in is added to stock and its bill goes to Accounts Payable."),
      ),
      React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, addBtn, csv ? llqaMini("⬇ Export", () => llqaCsv("Procurement-" + tab + "-" + today + ".csv", csv), { key: "ex", big: true }) : null),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 2, background: c.bgDeep, borderRadius: 8, padding: 3, marginBottom: 14, flexWrap: "wrap" } },
      TABS.map(([k, l]) =>
        React.createElement("button", { key: k, type: "button", onClick: () => (setTab(k), setErr("")), style: { padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === k ? c.accentFill : "transparent", color: tab === k ? c.accentText : c.textSec } }, l),
      ),
    ),
    ["orders", "inventory", "lowstock", "issued", "suppliers"].includes(tab) ? React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, llqaSearch(q, setQ, "Search order, supplier, item, person…")) : null,
    content,
    modal,
  );
};
