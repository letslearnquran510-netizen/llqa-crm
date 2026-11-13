// v77: Accounts Receivable on the fee cycle — the same months, amounts and statuses as Sales → Fee Cycle, Fee Status
// and the Parent Portal. Families who left owing stay owed (Monthly Recovery Record) until they pay, an admin stops
// the reminders, or writes the fees off. Every payment has a receipt number, who posted it and when; a removed one is
// kept with the reason and can be put back. Totals in PKR: the PKR that reached you, else the rate of the payment's
// day, else your rate (Settings → Payment Gateways).
const AccountsRMod = ({ arPayments, appSettings }) => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const [tab, setTab] = useState("paying");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [q, setQ] = useState("");
  const [rf, setRf] = useState("all");
  const [showGone, setShowGone] = useState(false);
  const R = llqaRates(appSettings);
  const pays = (arPayments || []).filter(Boolean);
  const all = llqaAllCycles(today);
  const recIds = llqaRecoveryIds(today);
  const ql = q.trim().toLowerCase();
  const hit = (...v) => !ql || v.some((x) => String(x == null ? "" : x).toLowerCase().includes(ql));
  const inM = (d) => String(d || "").slice(0, 7) === month;
  const mPays = pays.filter((p) => inM(p.paidDate)).sort((a, b) => String(b.paidDate).localeCompare(String(a.paidDate)) || String(b.id).localeCompare(String(a.id)));
  const sumP = (list) => llqaSumPKR(list, R, llqaPayPick);
  const pk = (p) => llqaPayPKR(p, R).pkr;
  const canChase = llqaCanChase();
  const ML = llqaMonthLabel(month);
  const stuOf = (p) => (p && p.studentId != null ? llqaFindStudent(p.studentId) : null);
  const who = (p) => p.studentName || p.payer || (stuOf(p) || {}).name || "—";
  const bills = all.map((x) => ({ ...x, m: x.cy.months.find((m) => m.ym === month) })).filter((x) => x.m);
  const stLabel = (m) => (m.left === 0 && m.wo > 0 && m.paid < m.fee - 0.005 ? ["Written off", "textSec"] : LLQA_FEE_STATES[m.state] || [m.state, "textSec"]);
  const pill = (d) => llqaPill(d[0], c[d[1]] || c.textSec);
  const owed = llqaFinOwed(today);
  const nameCell = (s, sub, k) => llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, s ? s.name : "—"), sub ? llqaSmall(sub, null, "s") : null], k || "n");
  const actions = (kids) => React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, kids.filter(Boolean));
  const payBtn = (s, ym) => llqaMini("💰 Record", () => llqaOpen("payment", { studentId: s.id, month: ym }), { key: "pay", tone: "success", title: "Record a payment" });
  const chaseBtn = (s) => llqaMini("💸 Fees owed…", () => llqaOpen("chase", { studentId: s.id }), { key: "ch", title: "Date the family will pay, stop or resume reminders, write off" });
  const remindItem = (x) => {
    const fs = !x.gone ? llqaFeeStage(x.s, x.cy, today) : null;
    const lf = x.gone ? llqaLeftDue(x.s, x.cy, today) : null;
    const ch = llqaChaseNow(x.s, today);
    if (lf) return { studentId: x.s.id, student: x.s, template: lf.tpl, extra: lf.extra, key: lf.key };
    if (ch.hold || !fs) return null;
    if (ch.promiseDue) return { studentId: x.s.id, student: x.s, template: "feePromise", extra: { fee: llqaOwedText(x.cy), promise: llqaDateLabel(ch.promise.date) }, key: ch.key };
    return { studentId: x.s.id, student: x.s, template: fs.tpl, extra: { fee: llqaFeeText(fs, x.cy), deadline: llqaDateLabel(llqaAddDays(today, 3)) }, key: fs.key };
  };
  const sentKeys = llqaLogIndex(ctx.messageLog).keys;
  const remindOf = (rows) => rows.map(remindItem).filter((it) => it && !sentKeys.has(it.key) && llqaPhone(it.student.phone, it.student.country) && !it.student.feeHold);
  const remindBtn = (rows, label) => {
    const items = remindOf(rows);
    return items.length ? llqaMini("💬 " + (label || "Remind") + " " + items.length, () => llqaOpen("queue", { title: "Fee reminders", items }), { key: "rem", big: true, tone: "success" }) : null;
  };
  const chaseNote = (s) => {
    const t = llqaChaseText(s, today);
    return t ? llqaSmall(t, c.accent, "ch") : null;
  };
  const stageNote = (x) => {
    if (x.gone) {
      const lf = llqaLeftDue(x.s, x.cy, today);
      return llqaOpt("leftChase") === false ? "Reminders off (Settings → Finance)" : lf ? "Reminder " + (lf.n || "") + " due" : "";
    }
    const fs = llqaFeeStage(x.s, x.cy, today);
    if (!fs) return "";
    const sent = llqaFeeStageSent(x.s, fs.oldest.ym);
    return "Reminder " + fs.n + " of 4 · " + fs.name + (sent ? " · #" + sent + " sent" : " · not sent yet"); // the same words as Sales → Fee Cycle
  };

  /* ---------- the tabs ---------- */
  let content = null;
  let csv = null;
  if (tab === "paying") {
    const fees = mPays.filter((p) => p.type !== "other");
    const sum = sumP(mPays);
    const fam = new Set(fees.map((p) => String(p.studentId)));
    const gw = {};
    mPays.forEach((p) => (gw[p.gateway || "Other"] = (gw[p.gateway || "Other"] || 0) + pk(p)));
    const top = Object.keys(gw).sort((a, b) => gw[b] - gw[a])[0];
    const rows = mPays.filter((p) => hit(who(p), p.parent, p.receiptNo, p.receipt, p.gateway, p.category));
    csv = [["Receipt", "Paid by", "For", "Amount", "Currency", "PKR", "Date", "Gateway", "Reference", "Posted by"], ...rows.map((p) => [p.receiptNo || "", who(p), p.type === "other" ? p.category : llqaPayFor(p, today), p.amount, p.currency, Math.round(pk(p)), p.paidDate, p.gateway, p.receipt || "", p.postedBy || ""])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Collected — " + ML, llqaPKR(sum.pkr), llqaSumSub(sum), c.success, "a"),
        llqaStat("Families who paid", fam.size, fees.length + " fee payment" + (fees.length === 1 ? "" : "s"), null, "b"),
        llqaStat("Payments", mPays.length, mPays.length - fees.length ? mPays.length - fees.length + " other income" : "", null, "c"),
        llqaStat("Top way paid", top || "—", top ? llqaPKR(gw[top]) : "", null, "d"),
      ]),
      llqaCard(
        rows.length
          ? llqaTable(
              ["Receipt", "Paid by", "For", "Amount", "In PKR", "Date", "Paid via", ""],
              rows.map((p) =>
                React.createElement(
                  "tr",
                  { key: p.id },
                  llqaTd(p.receiptNo || "—", "r", { whiteSpace: "nowrap", fontSize: 11 }),
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, who(p)), llqaSmall([p.parent, p.postedBy ? "posted by " + p.postedBy : ""].filter(Boolean).join(" · "), null, "s")], "w"),
                  llqaTd(p.type === "other" ? llqaPill(p.category || "Other", c.accent) : [llqaPayFor(p, today) || "—", recIds.has(p.id) ? llqaPill("Recovery", c.warn, null, "rc") : null], "f"),
                  llqaTd(llqaAmt(p.amount, p.currency), "a", { whiteSpace: "nowrap", fontWeight: 700 }),
                  llqaTd(llqaPKR(pk(p)), "k", { whiteSpace: "nowrap" }),
                  llqaTd(llqaDateLabel(p.paidDate), "d", { whiteSpace: "nowrap" }),
                  llqaTd([p.gateway || "—", p.receipt ? llqaSmall(p.receipt, null, "r") : null], "g"),
                  llqaTd(llqaMini("✎", () => llqaOpen("payEdit", { payId: p.id }), { key: "e", title: "Correct this payment" }), "x"),
                ),
              ),
            )
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No payments received in " + ML + (ql ? " match the search" : "") + "."),
      ),
    ];
  } else if (tab === "feerec") {
    const rows = bills.filter((x) => hit(x.s.name, x.s.parent, x.s.code, x.s.course)).sort((a, b) => String(a.s.name).localeCompare(String(b.s.name)));
    const sumOf = (pick) => llqaSumPKR(bills, R, (x) => ({ amount: pick(x), currency: x.cy.cur, fallback: "USD" }));
    const billed = sumOf((x) => x.m.fee);
    const paid = sumOf((x) => x.m.paid);
    const left = sumOf((x) => x.m.left);
    const rate = billed.pkr > 0 ? Math.round((Math.min(paid.pkr, billed.pkr) / billed.pkr) * 100) : 0;
    csv = [["Student", "Parent", "Fee", "Paid", "Left", "Currency", "Status", "Due"], ...rows.map((x) => [x.s.name, x.s.parent || "", x.m.fee, x.m.paid, x.m.left, x.cy.cur, stLabel(x.m)[0], x.m.due])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Billed for " + ML, llqaPKR(billed.pkr), llqaSumSub(billed) || bills.length + " famil" + (bills.length === 1 ? "y" : "ies"), null, "a"),
        llqaStat("Paid on these bills", llqaPKR(paid.pkr), llqaSumSub(paid), c.success, "b"),
        llqaStat("Still to pay", llqaPKR(left.pkr), llqaSumSub(left), left.pkr > 0 ? c.warn : c.text, "c"),
        llqaStat("Collection rate", rate + "%", "of the month's bills", rate >= 90 ? c.success : rate >= 60 ? c.warn : c.danger, "d"),
      ]),
      llqaCard(
        rows.length
          ? llqaTable(
              ["Student", "Fee", "Paid", "Left", "Status", "Due", ""],
              rows.map((x) =>
                React.createElement(
                  "tr",
                  { key: x.s.id },
                  nameCell(x.s, [x.s.parent, x.gone ? "left " + llqaDateLabel(String(x.s.qDate).slice(0, 10)) : "", x.m.off ? "reward " + x.m.off + " " + x.cy.cur + " off" : ""].filter(Boolean).join(" · ")),
                  llqaTd(llqaAmt(x.m.fee, x.cy.cur), "f", { whiteSpace: "nowrap" }),
                  llqaTd(llqaAmt(x.m.paid, x.cy.cur), "p", { whiteSpace: "nowrap", color: x.m.paid > 0 ? c.success : c.textSec }),
                  llqaTd(llqaAmt(x.m.left, x.cy.cur), "l", { whiteSpace: "nowrap", fontWeight: x.m.left > 0 ? 700 : 400 }),
                  llqaTd(pill(stLabel(x.m)), "s"),
                  llqaTd(llqaDateLabel(x.m.due), "d", { whiteSpace: "nowrap" }),
                  llqaTd(actions([x.m.left > 0 ? payBtn(x.s, month) : null, llqaMini("🧾", () => llqaOpen("invoice", { studentId: x.s.id, ym: month }), { key: "inv", title: "Invoice" })]), "x"),
                ),
              ),
            )
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, all.length ? "No bills for " + ML + (ql ? " match the search" : "") + "." : "No paying students with a fee amount yet. Trials join the fee cycle when they're enrolled as paid."),
      ),
    ];
  } else if (tab === "recovery") {
    const rp = mPays.filter((p) => recIds.has(p.id));
    const rsum = sumP(rp);
    const due = owed.rows.filter((r) => r.overdue || r.gone);
    const woFams = all.filter((x) => Array.isArray(x.s.feeWo) && x.s.feeWo.length);
    const F = [
      ["all", "All", (r) => true],
      ["with", "With the academy", (r) => !r.gone],
      ["gone", "Left the academy", (r) => r.gone],
      ["promise", "Will pay by a date", (r) => !!llqaChase(r.s).promise],
      ["stop", "Reminders stopped", (r) => !!llqaChase(r.s).stop],
    ];
    const test = (F.find((x) => x[0] === rf) || F[0])[2];
    const rows = rf === "wo" ? [] : due.filter((r) => test(r) && hit(r.s.name, r.s.parent, r.s.code, r.s.phone));
    const total = due.reduce((a, r) => a + r.pkr, 0);
    csv = [["Student", "Parent", "Status", "Owed", "Currency", "PKR", "Oldest due", "Days late", "Reminders"], ...due.map((r) => [r.s.name, r.s.parent || "", r.gone ? "Left " + String(r.s.qDate).slice(0, 10) : "With the academy", r.left, r.cur, Math.round(r.pkr), r.oldest.due, r.days, llqaChaseText(r.s, today) || stageNote(r)])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Recovered — " + ML, llqaPKR(rsum.pkr), "fees paid after they were overdue", c.success, "a"),
        llqaStat("Recovery payments", rp.length, new Set(rp.map((p) => String(p.studentId))).size + " famil" + (new Set(rp.map((p) => String(p.studentId))).size === 1 ? "y" : "ies"), null, "b"),
        llqaStat("Still to recover", llqaPKR(total), due.length + " famil" + (due.length === 1 ? "y" : "ies") + (due.some((r) => r.gone) ? " · " + due.filter((r) => r.gone).length + " who left" : ""), total > 0 ? c.danger : c.text, "c"),
        llqaStat("Written off", woFams.length, "famil" + (woFams.length === 1 ? "y" : "ies"), null, "d"),
      ]),
      React.createElement(
        "div",
        { key: "ft", style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
        llqaChips([...F.map(([k, l, t]) => [k, l, due.filter(t).length]), ["wo", "Written off", woFams.length]], rf, setRf),
        remindBtn(rows, "Remind"),
      ),
      llqaCard(
        rf === "wo"
          ? woFams.length
            ? llqaTable(
                ["Student", "Written off", "By", ""],
                woFams.map((x) =>
                  React.createElement(
                    "tr",
                    { key: x.s.id },
                    nameCell(x.s, x.s.parent),
                    llqaTd(x.s.feeWo.map((w) => llqaMonthLabel(w.ym) + " " + w.amt + " " + (w.cur || x.cy.cur)).join(", "), "w"),
                    llqaTd(x.s.feeWo.map((w) => (w.by || "") + (w.why ? " — " + w.why : "")).filter((v, i, a) => a.indexOf(v) === i).join("; "), "b"),
                    llqaTd(actions([chaseBtn(x.s)]), "x"),
                  ),
                ),
              )
            : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Nothing written off.")
          : rows.length
            ? llqaTable(
                ["Family", "Owed", "Late", "Reminders", ""],
                rows.map((r) =>
                  React.createElement(
                    "tr",
                    { key: r.s.id },
                    llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, r.s.name), llqaSmall([r.s.parent, r.gone ? "left " + llqaDateLabel(String(r.s.qDate).slice(0, 10)) : "with the academy", r.s.phone].filter(Boolean).join(" · "), r.gone ? c.warn : null, "s")], "n"),
                    llqaTd([React.createElement("div", { key: "a", style: { fontWeight: 700 } }, llqaAmt(r.left, r.cur)), llqaSmall(r.open.map((m) => llqaMonthLabel(m.ym)).reverse().join(", ") + " · " + llqaPKR(r.pkr), null, "m")], "o"),
                    llqaTd(r.days + " days", "d", { whiteSpace: "nowrap", color: r.days > 60 ? c.danger : c.warn }),
                    llqaTd([chaseNote(r.s), llqaSmall(stageNote(r), null, "st")], "r"),
                    llqaTd(actions([payBtn(r.s, r.oldest.ym), chaseBtn(r.s)]), "x"),
                  ),
                ),
              )
            : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Nothing to recover" + (rf !== "all" ? " in this filter" : "") + "."),
        { key: "c1" },
      ),
      rp.length
        ? llqaCard(
            [
              llqaH("Recovery payments — " + ML, "Paid after the fee was overdue (found from the fee cycle by itself)."),
              llqaTable(
                ["Receipt", "Family", "For", "Amount", "In PKR", "Date"],
                rp.map((p) => React.createElement("tr", { key: p.id }, llqaTd(p.receiptNo || "—", "r"), llqaTd(who(p), "w"), llqaTd(llqaPayFor(p, today), "f"), llqaTd(llqaAmt(p.amount, p.currency), "a"), llqaTd(llqaPKR(pk(p)), "k"), llqaTd(llqaDateLabel(p.paidDate), "d"))),
              ),
            ],
            { key: "c2" },
          )
        : null,
    ];
  } else if (tab === "daily") {
    const g = {};
    mPays.forEach((p) => {
      const d = p.paidDate || "—";
      if (!g[d]) g[d] = { date: d, n: 0, sum: 0 };
      g[d].n++;
      g[d].sum += pk(p);
    });
    const days = Object.values(g).sort((a, b) => (a.date < b.date ? 1 : -1));
    const tot = days.reduce((a, d) => a + d.sum, 0);
    const best = days.reduce((m, d) => (!m || d.sum > m.sum ? d : m), null);
    csv = [["Date", "Payments", "PKR"], ...days.map((d) => [d.date, d.n, Math.round(d.sum)])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Days with payments", days.length, ML, null, "a"),
        llqaStat("Month total", llqaPKR(tot), mPays.length + " payments", c.success, "b"),
        llqaStat("Best day", best ? llqaDateLabel(best.date) : "—", best ? llqaPKR(best.sum) : "", null, "c"),
        llqaStat("Daily average", llqaPKR(days.length ? tot / days.length : 0), "on days with payments", null, "d"),
      ]),
      llqaCard(
        days.length
          ? llqaTable(
              ["Date", "Payments", "Collected", "Share"],
              days.map((d) =>
                React.createElement(
                  "tr",
                  { key: d.date },
                  llqaTd(llqaDateLabel(d.date), "d"),
                  llqaTd(d.n, "n"),
                  llqaTd(llqaPKR(d.sum), "s", { fontWeight: 700 }),
                  llqaTd(React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, React.createElement("div", { style: { height: 6, width: Math.max(4, Math.round((tot ? d.sum / tot : 0) * 140)), background: c.success, borderRadius: 3 } }), (tot ? Math.round((d.sum / tot) * 100) : 0) + "%"), "p"),
                ),
              ),
            )
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No collections in " + ML + "."),
      ),
    ];
  } else if (tab === "posting") {
    const gone = (llqaFinDoc().arRemoved || []).slice().reverse();
    const list = (showGone ? gone : pays.slice().sort((a, b) => String(b.postedAt || b.paidDate || "").localeCompare(String(a.postedAt || a.paidDate || "")))).filter((p) => hit(who(p), p.parent, p.receiptNo, p.receipt, p.gateway, p.category, p.notes));
    csv = [["Receipt", "Paid by", "For", "Amount", "Currency", "Date", "Gateway", "Reference", "Posted by", "Posted at", showGone ? "Removed because" : "Edited by"], ...list.map((p) => [p.receiptNo || "", who(p), p.type === "other" ? p.category : llqaPayFor(p, today), p.amount, p.currency, p.paidDate, p.gateway, p.receipt || "", p.postedBy || "", p.postedAt || "", showGone ? p.removedWhy : p.editedBy || ""])];
    content = [
      React.createElement(
        "div",
        { key: "tg", style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" } },
        llqaChips([["live", "Payments", pays.length], ["gone", "Removed", gone.length]], showGone ? "gone" : "live", (k) => setShowGone(k === "gone")),
        llqaSmall("Every payment keeps who posted it and when, and each correction. A removed payment is kept here with the reason.", null, "h"),
      ),
      llqaCard(
        list.length
          ? llqaTable(
              ["Receipt", "Paid by", "For", "Amount", "Date", "Posted", ""],
              list.slice(0, 400).map((p) =>
                React.createElement(
                  "tr",
                  { key: p.id + (p.removedAt || "") },
                  llqaTd(p.receiptNo || "—", "r", { whiteSpace: "nowrap", fontSize: 11 }),
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, who(p)), llqaSmall([p.gateway, p.receipt].filter(Boolean).join(" · "), null, "s")], "w"),
                  llqaTd(p.type === "other" ? p.category || "Other" : llqaPayFor(p, today) || "—", "f"),
                  llqaTd(llqaAmt(p.amount, p.currency), "a", { whiteSpace: "nowrap", fontWeight: 700 }),
                  llqaTd(llqaDateLabel(p.paidDate), "d", { whiteSpace: "nowrap" }),
                  llqaTd(
                    showGone
                      ? [llqaSmall("Removed by " + (p.removedBy || "?") + " " + llqaDateLabel(String(p.removedAt || "").slice(0, 10)), c.danger, "a"), llqaSmall(p.removedWhy || "", null, "b")]
                      : [llqaSmall((p.postedBy ? "by " + p.postedBy : p.source === "fee-cycle" ? "Fee Cycle" : "—") + (p.postedAt ? " · " + llqaDateLabel(String(p.postedAt).slice(0, 10)) : ""), null, "a"), p.editedBy ? llqaSmall("corrected by " + p.editedBy, c.warn, "b") : null],
                    "p",
                  ),
                  llqaTd(
                    showGone
                      ? canChase
                        ? llqaMini("↺ Put back", () => llqaPayRestore(p) && llqaToast({ kind: "info", ttl: 5000, text: "✓ Payment " + (p.receiptNo || "") + " put back." }), { key: "rs", tone: "success" })
                        : null
                      : actions([llqaMini("✎", () => llqaOpen("payEdit", { payId: p.id }), { key: "e", title: "Correct this payment" }), llqaMini("🗑", () => llqaOpen("remove", { kind: "pay", id: p.id }), { key: "d", tone: "danger", title: "Remove (with the reason)" })]),
                    "x",
                  ),
                ),
              ),
            )
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, showGone ? "Nothing removed." : "No payments yet."),
      ),
    ];
  } else if (tab === "defaulter") {
    const late = bills.filter((x) => x.m.left > 0 && x.m.due <= today);
    const rows = late.filter((x) => hit(x.s.name, x.s.parent, x.s.code, x.s.phone)).sort((a, b) => (b.m.state === "overdue") - (a.m.state === "overdue") || String(a.s.name).localeCompare(String(b.s.name)));
    const lsum = llqaSumPKR(late, R, (x) => ({ amount: x.m.left, currency: x.cy.cur, fallback: "USD" }));
    csv = [["Student", "Parent", "Phone", "Left for " + month, "Currency", "All owed", "Days late", "Status", "Reminders"], ...rows.map((x) => [x.s.name, x.s.parent || "", x.s.phone || "", x.m.left, x.cy.cur, x.cy.left, llqaDays(x.m.due, today), stLabel(x.m)[0], llqaChaseText(x.s, today) || stageNote(x)])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Not paid — " + ML, late.length, late.filter((x) => x.m.state === "overdue").length + " overdue · " + llqaPKR(lsum.pkr), late.length ? c.danger : c.success, "a"),
        ...LLQA_AGE_NAMES.map((n, i) => llqaStat(n + " late", llqaPKR(owed.buckets[i]), owed.rows.filter((r) => r.bucket === i).length + " famil" + (owed.rows.filter((r) => r.bucket === i).length === 1 ? "y" : "ies") + " (all months)", i >= 2 && owed.buckets[i] > 0 ? c.danger : null, "g" + i)),
      ]),
      React.createElement("div", { key: "ft", style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } }, remindBtn(rows, "Remind"), llqaSmall("Each family gets the message of its stage once (Settings → Fees & Pricing); a family with a pay-by date or stopped reminders is left out.", null, "h")),
      llqaCard(
        rows.length
          ? llqaTable(
              ["Student", "Left for " + ML, "All owed", "Late", "Status", "Reminders", "Contact", ""],
              rows.map((x) =>
                React.createElement(
                  "tr",
                  { key: x.s.id },
                  nameCell(x.s, [x.s.parent, x.gone ? "left " + llqaDateLabel(String(x.s.qDate).slice(0, 10)) : ""].filter(Boolean).join(" · ")),
                  llqaTd(llqaAmt(x.m.left, x.cy.cur), "l", { whiteSpace: "nowrap", fontWeight: 700 }),
                  llqaTd(llqaAmt(x.cy.left, x.cy.cur), "o", { whiteSpace: "nowrap" }),
                  llqaTd((llqaDays(x.m.due, today) || 0) + " days", "d", { whiteSpace: "nowrap" }),
                  llqaTd(pill(stLabel(x.m)), "s"),
                  llqaTd([chaseNote(x.s), llqaSmall(stageNote(x), null, "sn")], "r"),
                  llqaTd(x.s.phone || "—", "c", { whiteSpace: "nowrap", fontSize: 11 }),
                  llqaTd(actions([payBtn(x.s, month), chaseBtn(x.s)]), "x"),
                ),
              ),
            )
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No defaulters — every bill for " + ML + " that has fallen due is paid" + (ql ? " (in this search)" : "") + "."),
      ),
    ];
  }
  const TABS = [
    ["paying", "Monthly Paying Students"],
    ["feerec", "Monthly Fee Record"],
    ["recovery", "Monthly Recovery Record"],
    ["daily", "Daily Recovery Sheet"],
    ["posting", "Payment Posting Sheet"],
    ["defaulter", "Monthly Defaulter List"],
  ];
  const nameOf = { paying: "Monthly-Paying-", feerec: "Monthly-Fee-Record-", recovery: "Monthly-Recovery-", daily: "Daily-Recovery-", posting: "Payment-Posting-", defaulter: "Monthly-Defaulters-" };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 } },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { style: { color: c.text, fontSize: 20, fontWeight: 800, margin: 0 } }, "Accounts Receivable"),
        React.createElement("div", { style: { color: c.textSec, fontSize: 12, marginTop: 3 } }, "Fees from families — the same fee cycle as Sales, Fee Status and the Parent Portal. In PKR at the PKR received, else the rate of the day, else your rate."),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } },
        React.createElement("input", { type: "month", "aria-label": "Month", value: month, onChange: (e) => /^\d{4}-\d{2}$/.test(e.target.value) && setMonth(e.target.value), style: { ...llqaSelectStyle, padding: "7px 9px" } }),
        llqaMini("＋ Record payment", () => llqaOpen("payment", {}), { key: "rp", big: true, solid: true, tone: "success" }),
        llqaMini("＋ Other income", () => llqaOpen("income", {}), { key: "oi", big: true }),
        llqaMini("⬇ Export", () => csv && llqaCsv(nameOf[tab] + month + ".csv", csv), { key: "ex", big: true }),
      ),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 2, background: c.bgDeep, borderRadius: 8, padding: 3, marginBottom: 14, flexWrap: "wrap" } },
      TABS.map(([k, l]) =>
        React.createElement(
          "button",
          { key: k, type: "button", onClick: () => setTab(k), style: { padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === k ? c.accentFill : "transparent", color: tab === k ? c.accentText : c.textSec } },
          l + (k === "recovery" && owed.rows.some((r) => r.gone || r.overdue) ? " (" + owed.rows.filter((r) => r.gone || r.overdue).length + ")" : ""),
        ),
      ),
    ),
    React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, llqaSearch(q, setQ, "Search family, parent, receipt, reference…")),
    // v71: a currency without a rate is named (and left out of the PKR totals)
    llqaRatesNote([sumP(pays), llqaSumPKR(all, R, (x) => ({ amount: x.cy.amt, currency: x.cy.cur, fallback: "USD" }))], R, "rates"),
    content,
  );
};
