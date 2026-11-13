// v77: the Finance page, connected to the whole CRM — fees (the fee cycle, Accounts Receivable), other income, bills
// (Accounts Payable) and salaries (Payroll). Nothing here is a separate list: a payment, a bill paid or a salary paid
// anywhere shows here at once, and what is done here (a payment, an expense, a reminder) is saved where it belongs.
// All in PKR: the PKR received, else the rate of the payment's day, else your rate (Settings → Payment Gateways).
const FinanceMod = () => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const cur = today.slice(0, 7);
  const [tab, setTab] = useState("dashboard");
  const [month, setMonth] = useState(cur);
  const [q, setQ] = useState("");
  const [fs, setFs] = useState("all");
  const [course, setCourse] = useState("all");
  const [conv, setConv] = useState({ amount: "100", from: "USD" });
  const R = llqaRates(ctx.appSettings);
  const ML = llqaMonthLabel(month);
  const ql = q.trim().toLowerCase();
  const hit = (...v) => !ql || v.some((x) => String(x == null ? "" : x).toLowerCase().includes(ql));
  const all = llqaAllCycles(today);
  const live = all.filter((x) => !x.gone);
  const owed = llqaFinOwed(today);
  const months6 = llqaFinMonths(6, today);
  const pays = (ctx.arPayments || []).filter(Boolean);
  const pk = (p) => llqaPayPKR(p, R).pkr;
  const stat = llqaStat;
  const row = (kids, k) => React.createElement("div", { key: k, style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, kids);
  const empty = (t) => React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, t);
  const monthPick = () => React.createElement("input", { type: "month", "aria-label": "Month", value: month, onChange: (e) => /^\d{4}-\d{2}$/.test(e.target.value) && setMonth(e.target.value), style: { ...llqaSelectStyle, padding: "7px 9px" } });
  // simple bars: [label, value] pairs, one colour each
  const bars = (pairs, max, cols) =>
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 6 } },
      pairs.map(([label, vals], i) =>
        React.createElement(
          "div",
          { key: label + i, style: { display: "grid", gridTemplateColumns: "92px 1fr", gap: 8, alignItems: "center" } },
          React.createElement("div", { style: { fontSize: 11, color: c.textSec } }, label),
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: 2 } },
            vals.map((v, j) =>
              React.createElement(
                "div",
                { key: j, style: { display: "flex", alignItems: "center", gap: 6 } },
                React.createElement("div", { style: { height: 8, borderRadius: 4, width: max > 0 ? Math.max(2, Math.round((Math.abs(v) / max) * 100)) + "%" : 2, background: v < 0 ? c.danger : cols[j] } }),
                React.createElement("span", { style: { fontSize: 10, color: c.textMuted, whiteSpace: "nowrap" } }, llqaPKR(v)),
              ),
            ),
          ),
        ),
      ),
    );
  const legend = (items) => React.createElement("div", { style: { display: "flex", gap: 12, fontSize: 11, color: c.textSec, margin: "4px 0 8px" } }, items.map(([t, col]) => React.createElement("span", { key: t, style: { display: "flex", gap: 5, alignItems: "center" } }, React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: col, display: "inline-block" } }), t)));
  const go = (page) => llqaGo(page);
  const print = (title, lines) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (t) => String(t).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]);
    w.document.write("<html><head><title>" + esc(title) + "</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin:0}table{border-collapse:collapse;margin-top:16px;width:100%;max-width:640px}td{padding:6px 10px;border-bottom:1px solid #ddd;font-size:13px}td:last-child{text-align:right}tr.b td{font-weight:bold;border-top:2px solid #333}</style></head><body><h1>" + esc(llqaAcademy()) + "</h1><div>" + esc(title) + "</div><table>" + lines.map((r) => "<tr" + (r[2] ? ' class="b"' : "") + "><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table></body></html>");
    w.document.close();
    if (w.print) w.print();
  };
  const remindItems = (rows) => {
    const sent = llqaLogIndex(ctx.messageLog).keys;
    return rows
      .map((x) => {
        if (x.gone) {
          const lf = llqaLeftDue(x.s, x.cy, today);
          return lf ? { studentId: x.s.id, student: x.s, template: lf.tpl, extra: lf.extra, key: lf.key } : null;
        }
        const ch = llqaChaseNow(x.s, today);
        const st = llqaFeeStage(x.s, x.cy, today);
        if (ch.hold || !st || x.s.feeHold) return null;
        if (ch.promiseDue) return { studentId: x.s.id, student: x.s, template: "feePromise", extra: { fee: llqaOwedText(x.cy), promise: llqaDateLabel(ch.promise.date) }, key: ch.key };
        return { studentId: x.s.id, student: x.s, template: st.tpl, extra: { fee: llqaFeeText(st, x.cy), deadline: llqaDateLabel(llqaAddDays(today, 3)) }, key: st.key };
      })
      .filter((it) => it && !sent.has(it.key) && llqaPhone(it.student.phone, it.student.country));
  };
  let content = null;
  let csv = null;

  if (tab === "dashboard") {
    const now = llqaFinCash(cur);
    const pos = llqaFinPosition(today);
    const ahead = llqaFinAhead(30, today);
    const weOwe = llqaSumPKR(llqaApAll(today), R, (l) => ({ amount: llqaApLeft(l), currency: l.currency, fallback: "PKR" }));
    const series = months6.map((ym) => llqaFinCash(ym));
    const max = Math.max(1, ...series.map((x) => Math.max(x.inAll, x.outAll)));
    const pr = llqaApPayroll(today);
    const prDue = pr.filter((x) => x.toApprove || x.toPay);
    const apLate = ((ctx.apLiabilities || []).filter((l) => l && llqaApState(l, today) === "overdue"));
    const left = owed.rows.filter((r) => r.gone);
    const late = owed.rows.filter((r) => !r.gone && r.overdue);
    const alerts = [
      late.length ? ["💸 " + late.length + " famil" + (late.length === 1 ? "y owes" : "ies owe") + " overdue fees — " + llqaPKR(late.reduce((a, r) => a + r.pkr, 0)), "Defaulters", () => go("ar")] : null,
      left.length ? ["👤 " + left.length + " famil" + (left.length === 1 ? "y" : "ies") + " who left still owe " + llqaPKR(left.reduce((a, r) => a + r.pkr, 0)), "Recovery", () => go("ar")] : null,
      apLate.length ? ["🧾 " + apLate.length + " bill" + (apLate.length === 1 ? " is" : "s are") + " overdue", "Accounts Payable", () => go("ap")] : null,
      ...prDue.map((x) => ["👥 Salaries " + llqaMonthLabel(x.ym) + ": " + (x.toApprove ? x.toApprove + " to approve" : "") + (x.toApprove && x.toPay ? ", " : "") + (x.toPay ? x.toPay + " to pay" : "") + " (due " + llqaDateLabel(x.dueDate) + ")", "Payroll", () => (typeof llqaPayOpen === "function" ? llqaPayOpen(x.ym) : go("payroll"))]),
    ].filter(Boolean);
    const recent = pays.slice().sort((a, b) => String(b.paidDate).localeCompare(String(a.paidDate)) || String(b.postedAt || "").localeCompare(String(a.postedAt || ""))).slice(0, 8);
    content = [
      row([
        stat("Money in — " + llqaMonthLabel(cur), llqaPKR(now.inAll), now.inOther ? "fees " + llqaPKR(now.inFees) + " · other " + llqaPKR(now.inOther) : llqaSumSub(now.fees), c.success, "a"),
        stat("Money out — " + llqaMonthLabel(cur), llqaPKR(now.outAll), Object.keys(now.out).length ? Object.entries(now.out).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => k + " " + llqaPKR(v)).join(" · ") : "bills and salaries paid", c.warn, "b"),
        stat("Net — " + llqaMonthLabel(cur), llqaPKR(now.net), "money in − money out", now.net >= 0 ? c.success : c.danger, "c"),
        stat("Cash in hand", pos ? llqaPKR(pos.now) : "—", pos ? "from " + llqaPKR(pos.start) + " on " + llqaDateLabel(pos.from) : "set the starting amount in Settings → Finance", pos && pos.now < 0 ? c.danger : null, "d"),
      ], "r1"),
      row([
        stat("Families owe", llqaPKR(owed.total), owed.rows.length + " famil" + (owed.rows.length === 1 ? "y" : "ies") + (left.length ? " · " + left.length + " who left" : ""), owed.total > 0 ? c.warn : null, "e"),
        stat("The academy owes", llqaPKR(weOwe.pkr), "bills and salaries not paid yet", weOwe.pkr > 0 ? c.warn : null, "f"),
        stat("Next 30 days", llqaPKR(ahead.net), "in " + llqaPKR(ahead.inPKR) + " · out " + llqaPKR(ahead.outPKR), ahead.net >= 0 ? c.success : c.danger, "g"),
        stat("Paying families", live.filter((x) => x.s.status !== "quit").length, owed.rows.length ? Math.round((late.length / Math.max(1, live.length)) * 100) + "% overdue" : "none overdue", null, "h"),
      ], "r2"),
      alerts.length
        ? llqaCard([llqaH("⚠ Needs attention"), ...alerts.map(([t, b, run], i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "55"), fontSize: 12 } }, React.createElement("span", null, llqaIconize(t, { size: 12, keep: true, gap: 5 })), llqaMini(b, run, { key: "b" })))], { key: "al" })
        : null,
      llqaCard([llqaH("Money in vs money out — last 6 months", "By the day money moved (Cash Flow has the balance)."), legend([["In", c.success], ["Out", c.warn]]), bars(series.map((x) => [llqaMonthLabel(x.ym), [x.inAll, x.outAll]]), max, [c.success, c.warn])], { key: "ch" }),
      React.createElement(
        "div",
        { key: "two", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 } },
        llqaCard([llqaH("Recent payments received"), recent.length ? recent.map((p) => React.createElement("div", { key: p.id, style: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "4px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "44") } }, React.createElement("span", null, (p.studentName || p.payer || "—") + " · " + llqaDateLabel(p.paidDate)), React.createElement("span", { style: { fontWeight: 700 } }, llqaAmt(p.amount, p.currency)))) : empty("No payments yet.")], { key: "rp" }),
        llqaCard([llqaH("Top families owing"), owed.rows.length ? owed.rows.slice(0, 6).map((r) => React.createElement("div", { key: r.s.id, style: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "4px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "44") } }, React.createElement("span", null, r.s.name + (r.gone ? " (left)" : "") + " · " + r.days + " days"), React.createElement("span", { style: { fontWeight: 700 } }, llqaAmt(r.left, r.cur)))) : empty("Nobody owes anything.")], { key: "td" }),
      ),
    ];
  } else if (tab === "fees") {
    const courses = [...new Set(live.map((x) => x.s.course).filter(Boolean))].sort();
    const F = [
      ["all", "All", () => true],
      ["overdue", "Overdue", (x) => x.cy.status === "overdue"],
      ["due", "Due now", (x) => x.cy.status === "due" || x.cy.status === "partial"],
      ["paid", "Paid", (x) => x.cy.status === "paid"],
      ["upcoming", "Upcoming", (x) => x.cy.status === "upcoming"],
    ];
    const test = (F.find((x) => x[0] === fs) || F[0])[2];
    const rows = live.filter((x) => test(x) && (course === "all" || x.s.course === course) && hit(x.s.name, x.s.parent, x.s.code, x.s.phone)).sort((a, b) => b.cy.left - a.cy.left || String(a.s.name).localeCompare(String(b.s.name)));
    const lastPaid = (s) => pays.filter((p) => p.type !== "other" && String(p.studentId) === String(s.id)).map((p) => String(p.paidDate || "")).sort().pop() || "";
    const items = remindItems(rows);
    csv = [["Student", "Parent", "Course", "Fee", "Currency", "Due day", "Status", "Owed", "Months paid", "Last paid"], ...rows.map((x) => [x.s.name, x.s.parent || "", x.s.course || "", x.cy.amt, x.cy.cur, x.cy.day, x.cy.status, x.cy.left, x.cy.months.filter((m) => m.state === "paid").length, lastPaid(x.s)])];
    content = [
      row([
        stat("Paying families", live.length, llqaPKR(llqaSumPKR(live, R, (x) => ({ amount: x.cy.amt, currency: x.cy.cur, fallback: "USD" })).pkr) + " a month in fees", null, "a"),
        stat("Overdue", live.filter((x) => x.cy.status === "overdue").length, llqaPKR(owed.rows.filter((r) => !r.gone && r.overdue).reduce((a, r) => a + r.pkr, 0)), c.danger, "b"),
        stat("Due now", live.filter((x) => x.cy.status === "due" || x.cy.status === "partial").length, "within the grace days", c.warn, "c"),
        stat("Paid", live.filter((x) => x.cy.status === "paid").length, "nothing owed now", c.success, "d"),
      ], "st"),
      React.createElement(
        "div",
        { key: "ft", style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
        llqaChips(F.map(([k, l, t]) => [k, l, live.filter(t).length]), fs, setFs),
        courses.length ? llqaSel(course, setCourse, [["all", "All courses"], ...courses.map((x) => [x, x])], { key: "cr", title: "Course" }) : null,
        items.length ? llqaMini("💬 Bulk reminder " + items.length, () => llqaOpen("queue", { title: "Fee reminders", items }), { key: "bulk", big: true, tone: "success" }) : null,
      ),
      llqaCard(
        rows.length
          ? llqaTable(
              ["Student", "Monthly fee", "Status", "Owed", "Months paid", "Last paid", ""],
              rows.map((x) => {
                const d = LLQA_FEE_STATES[x.cy.status] || [x.cy.status, "textSec"];
                const lp = lastPaid(x.s);
                const one = remindItems([x])[0];
                return React.createElement(
                  "tr",
                  { key: x.s.id },
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, x.s.name), llqaSmall([x.s.parent, x.s.course].filter(Boolean).join(" · "), null, "s"), llqaChaseText(x.s, today) ? llqaSmall(llqaChaseText(x.s, today), c.accent, "c") : null], "n"),
                  llqaTd([llqaAmt(x.cy.amt, x.cy.cur), llqaSmall("due on day " + x.cy.day, null, "d")], "f", { whiteSpace: "nowrap" }),
                  llqaTd(llqaPill(d[0], c[d[1]] || c.textSec), "s"),
                  llqaTd(x.cy.left ? llqaAmt(x.cy.left, x.cy.cur) : "—", "o", { whiteSpace: "nowrap", fontWeight: x.cy.left ? 700 : 400 }),
                  llqaTd(x.cy.months.filter((m) => m.state === "paid").length, "m"),
                  llqaTd(lp ? llqaDateLabel(lp) : "—", "l", { whiteSpace: "nowrap" }),
                  llqaTd(
                    React.createElement(
                      "div",
                      { style: { display: "flex", gap: 4, flexWrap: "wrap" } },
                      llqaMini("💰 Record payment", () => llqaOpen("payment", { studentId: x.s.id }), { key: "p", tone: "success" }),
                      one ? llqaMini("💬 Send reminder", () => llqaOpen("queue", { title: "Fee reminder", items: [one] }), { key: "r" }) : null,
                      x.cy.current ? llqaMini("🧾", () => llqaOpen("invoice", { studentId: x.s.id, ym: x.cy.current.ym }), { key: "i", title: "Invoice" }) : null,
                    ),
                    "x",
                  ),
                );
              }),
            )
          : empty(live.length ? "No family in this filter." : "No paying families yet — a trial joins the fee cycle when it is enrolled as paid."),
      ),
    ];
  } else if (tab === "invoices") {
    const list = all
      .map((x) => ({ ...x, m: x.cy.months.find((m) => m.ym === month) }))
      .filter((x) => x.m && hit(x.s.name, x.s.parent, x.s.code, llqaInvNo(x.s, month)))
      .sort((a, b) => String(a.s.name).localeCompare(String(b.s.name)));
    const sum = (pick) => llqaSumPKR(list, R, (x) => ({ amount: pick(x), currency: x.cy.cur, fallback: "USD" })).pkr;
    csv = [["Invoice", "Bill to", "Student", "Month", "Due", "Fee", "Paid", "Balance", "Currency", "Status"], ...list.map((x) => [llqaInvNo(x.s, month), x.s.parent || x.s.name, x.s.name, month, x.m.due, x.m.fee, x.m.paid, x.m.left, x.cy.cur, x.m.state])];
    content = [
      row([stat("Invoices — " + ML, list.length, "one per family, made by the fee cycle", null, "a"), stat("Billed", llqaPKR(sum((x) => x.m.fee)), "", null, "b"), stat("Paid", llqaPKR(sum((x) => x.m.paid)), "", c.success, "c"), stat("Balance", llqaPKR(sum((x) => x.m.left)), "", c.warn, "d")], "st"),
      llqaCard(
        list.length
          ? llqaTable(
              ["Invoice", "Bill to", "Fee", "Paid", "Balance", "Status", ""],
              list.map((x) => {
                const d = x.m.left === 0 && x.m.wo > 0 && x.m.paid < x.m.fee ? ["Written off", "textSec"] : LLQA_FEE_STATES[x.m.state] || [x.m.state, "textSec"];
                return React.createElement(
                  "tr",
                  { key: x.s.id },
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700, fontSize: 11 } }, llqaInvNo(x.s, month)), llqaSmall("due " + llqaDateLabel(x.m.due), null, "d")], "i"),
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, x.s.parent || x.s.name), llqaSmall(x.s.name + (x.gone ? " · left" : ""), null, "s")], "b"),
                  llqaTd(llqaAmt(x.m.fee, x.cy.cur), "f", { whiteSpace: "nowrap" }),
                  llqaTd(llqaAmt(x.m.paid, x.cy.cur), "p", { whiteSpace: "nowrap" }),
                  llqaTd(llqaAmt(x.m.left, x.cy.cur), "l", { whiteSpace: "nowrap", fontWeight: x.m.left ? 700 : 400 }),
                  llqaTd(llqaPill(d[0], c[d[1]] || c.textSec), "s"),
                  llqaTd(llqaMini("View invoice", () => llqaOpen("invoice", { studentId: x.s.id, ym: month }), { key: "v" }), "x"),
                );
              }),
            )
          : empty("No invoices for " + ML + "."),
      ),
    ];
  } else if (tab === "income") {
    const cash = llqaFinCash(month);
    const mp = pays.filter((p) => String(p.paidDate || "").slice(0, 7) === month);
    const by = (key) => {
      const g = {};
      mp.forEach((p) => (g[key(p)] = (g[key(p)] || 0) + pk(p)));
      return Object.entries(g).sort((a, b) => b[1] - a[1]);
    };
    const country = (p) => {
      const s = p.studentId != null ? llqaFindStudent(p.studentId) : null;
      return (s && s.country) || "—";
    };
    const other = mp.filter((p) => p.type === "other" && hit(p.payer, p.studentName, p.category, p.receiptNo));
    const streams = [["Monthly fees", cash.inFees], ...Object.entries(cash.other).sort((a, b) => b[1] - a[1])];
    const max = Math.max(1, ...streams.map((x) => x[1]));
    csv = [["Receipt", "Type", "From", "Amount", "Currency", "PKR", "Date", "Paid by"], ...mp.map((p) => [p.receiptNo || "", p.type === "other" ? p.category : "Monthly fee", p.studentName || p.payer || "", p.amount, p.currency, Math.round(pk(p)), p.paidDate, p.gateway || ""])];
    content = [
      row([stat("Income — " + ML, llqaPKR(cash.inAll), mp.length + " payments", c.success, "a"), stat("Monthly fees", llqaPKR(cash.inFees), llqaSumSub(cash.fees), null, "b"), stat("Other income", llqaPKR(cash.inOther), Object.keys(cash.other).join(", ") || "registration, certificates…", null, "c"), stat("Families paid", new Set(mp.filter((p) => p.type !== "other").map((p) => String(p.studentId))).size, "", null, "d")], "st"),
      React.createElement(
        "div",
        { key: "g", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 } },
        llqaCard([llqaH("Income streams"), bars(streams.map(([k, v]) => [k, [v]]), max, [c.success])], { key: "s" }),
        llqaCard([llqaH("By way paid"), by((p) => p.gateway || "Other").map(([k, v]) => React.createElement("div", { key: k, style: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" } }, React.createElement("span", null, k), React.createElement("b", null, llqaPKR(v))))], { key: "g" }),
        llqaCard([llqaH("By country"), by(country).map(([k, v]) => React.createElement("div", { key: k, style: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" } }, React.createElement("span", null, k), React.createElement("b", null, llqaPKR(v))))], { key: "c" }),
      ),
      llqaCard(
        [
          React.createElement("div", { key: "h", style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } }, llqaH("Other income — " + ML, "Registration and certificate fees, books, donations."), llqaMini("＋ Other income", () => llqaOpen("income", {}), { key: "a", tone: "success" })),
          other.length
            ? llqaTable(
                ["Receipt", "Type", "From", "Amount", "Date", ""],
                other.map((p) =>
                  React.createElement(
                    "tr",
                    { key: p.id },
                    llqaTd(p.receiptNo || "—", "r", { fontSize: 11 }),
                    llqaTd(p.category || "Other", "t"),
                    llqaTd(p.payer || p.studentName || "—", "f"),
                    llqaTd(llqaAmt(p.amount, p.currency), "a", { fontWeight: 700 }),
                    llqaTd(llqaDateLabel(p.paidDate), "d"),
                    llqaTd(React.createElement("div", { style: { display: "flex", gap: 4 } }, llqaMini("✎", () => llqaOpen("payEdit", { payId: p.id }), { key: "e" }), llqaMini("🗑", () => llqaOpen("remove", { kind: "pay", id: p.id }), { key: "d", tone: "danger" })), "x"),
                  ),
                ),
              )
            : empty("None in " + ML + "."),
        ],
        { key: "o" },
      ),
    ];
  } else if (tab === "expenses") {
    const cash = llqaFinCash(month);
    const pnl = llqaFinPnl(month);
    const budgets = llqaOpt("budgets") || {};
    const out = [];
    llqaApAll(today).forEach((l) =>
      (l.pays || []).forEach((p) => {
        if (p && String(p.date || "").slice(0, 7) === month) out.push({ l, p, pkr: llqaToPKR(p.amount, l.currency || "PKR", R).pkr });
      }),
    );
    (ctx.apLiabilities || []).forEach((l) => {
      if (l && !(Array.isArray(l.pays) && l.pays.length) && String(l.paidDate || "").slice(0, 7) === month && llqaApPaid(l) > 0) out.push({ l, p: { id: "old" + l.id, date: l.paidDate, amount: llqaApPaid(l), method: "", by: "" }, pkr: llqaToPKR(llqaApPaid(l), l.currency || "PKR", R).pkr });
    });
    const rows = out.filter((x) => hit(x.l.vendor, x.l.category, x.p.ref, x.p.method)).sort((a, b) => String(b.p.date).localeCompare(String(a.p.date)));
    const cats = Object.entries(cash.out).sort((a, b) => b[1] - a[1]);
    const maxC = Math.max(1, ...cats.map((x) => x[1]));
    const bud = Object.keys(budgets).map((k) => [k, k === "Salaries" ? pnl.salaries + (pnl.cost[k] || 0) : pnl.cost[k] || 0, Number(budgets[k]) || 0]);
    csv = [["Date", "Paid to", "Category", "Amount", "Currency", "PKR", "Paid by", "Reference", "By"], ...rows.map((x) => [x.p.date, x.l.vendor, x.l.category, x.p.amount, x.l.currency || "PKR", Math.round(x.pkr), x.p.method || "", x.p.ref || "", x.p.by || ""])];
    content = [
      row([
        stat("Paid out — " + ML, llqaPKR(cash.outAll), rows.length + " payment" + (rows.length === 1 ? "" : "s"), c.warn, "a"),
        stat("Bills due in " + ML, llqaPKR(Object.values(pnl.cost).reduce((a, v) => a + v, 0)), "typed in Accounts Payable", null, "b"),
        stat("Salaries — " + ML, llqaPKR(pnl.salaries), pnl.salariesEst ? "estimate until approved (Payroll)" : "from Payroll", null, "c"),
        stat("Budget used", bud.length ? Math.round((bud.reduce((a, x) => a + x[1], 0) / Math.max(1, bud.reduce((a, x) => a + x[2], 0))) * 100) + "%" : "—", bud.length ? "of " + llqaPKR(bud.reduce((a, x) => a + x[2], 0)) : "set budgets in Settings → Finance", null, "d"),
      ], "st"),
      React.createElement(
        "div",
        { key: "g", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 } },
        llqaCard([llqaH("Expense breakdown — paid out"), cats.length ? bars(cats.map(([k, v]) => [k, [v]]), maxC, [c.warn]) : empty("Nothing paid out in " + ML + ".")], { key: "b" }),
        llqaCard([llqaH("Budget vs actual — " + ML, "Bills due in the month (and salaries) against your budgets."), bud.length ? bud.map(([k, a, b]) => React.createElement("div", { key: k, style: { marginBottom: 8 } }, React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11 } }, React.createElement("span", null, k), React.createElement("span", { style: { color: a > b ? c.danger : c.textSec } }, "Actual " + llqaPKR(a) + " · Budget " + llqaPKR(b))), React.createElement("div", { style: { height: 6, background: c.bgDeep, borderRadius: 3, marginTop: 3 } }, React.createElement("div", { style: { height: 6, width: Math.min(100, Math.round((a / Math.max(1, b)) * 100)) + "%", background: a > b ? c.danger : c.success, borderRadius: 3 } })))) : React.createElement("div", null, empty("No budgets yet."), llqaMini("Set budgets", () => llqaOpenSettings("finance"), { key: "sb" }))], { key: "v" }),
      ),
      llqaCard(
        [
          React.createElement("div", { key: "h", style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } }, llqaH("Money paid out — " + ML, "Bills paid in Accounts Payable and salaries paid in Payroll."), llqaMini("＋ Add expense", () => llqaOpen("apBill", { paid: true }), { key: "a", tone: "success" })),
          rows.length
            ? llqaTable(
                ["Date", "Paid to", "Amount", "Paid by", ""],
                rows.map((x) =>
                  React.createElement(
                    "tr",
                    { key: x.l.id + x.p.id },
                    llqaTd(llqaDateLabel(x.p.date), "d", { whiteSpace: "nowrap" }),
                    llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, x.l.vendor), llqaSmall([x.l.category, x.l.payroll ? x.p.ref : ""].filter(Boolean).join(" · "), null, "s")], "v"),
                    llqaTd([llqaAmt(x.p.amount, x.l.currency || "PKR"), x.l.currency && x.l.currency !== "PKR" ? llqaSmall(llqaPKR(x.pkr), null, "k") : null], "a", { whiteSpace: "nowrap", fontWeight: 700 }),
                    llqaTd([x.p.method || "—", x.p.by ? llqaSmall("by " + x.p.by, null, "b") : null], "m"),
                    llqaTd(x.l.payroll ? llqaMini("Payroll", () => (typeof llqaPayOpen === "function" ? llqaPayOpen(x.l.ym) : go("payroll")), { key: "pr" }) : React.createElement("div", { style: { display: "flex", gap: 4 } }, llqaMini("✎", () => llqaOpen("apBill", { billId: x.l.id }), { key: "e" }), !x.l.approvedBy && llqaCanManage() ? llqaMini("✓ Approve", () => llqaApApprove(x.l), { key: "ap" }) : x.l.approvedBy ? llqaSmall("approved by " + x.l.approvedBy, c.success, "ok") : null, llqaMini("🗑", () => llqaOpen("remove", { kind: "bill", id: x.l.id }), { key: "d", tone: "danger" })), "x"),
                  ),
                ),
              )
            : empty("Nothing paid out in " + ML + "."),
        ],
        { key: "o" },
      ),
    ];
  } else if (tab === "pnl") {
    const p = llqaFinPnl(month);
    const six = months6.map((ym) => llqaFinPnl(ym));
    const y0 = month.slice(0, 4) + "-01";
    const ytd = [];
    for (let ym = y0; ym <= month; ym = llqaMonthAdd(ym, 1)) ytd.push(llqaFinPnl(ym));
    const tot = (k) => ytd.reduce((a, x) => a + (x[k] || 0), 0);
    const lines = [
      ["REVENUE", "", true],
      ["Fees billed for " + ML, llqaPKR(p.fees)],
      ...Object.entries(p.other).map(([k, v]) => [k, llqaPKR(v)]),
      ["Total revenue", llqaPKR(p.revenue), true],
      ["EXPENSES", "", true],
      ["Teachers' salaries" + (p.salariesEst ? " (estimate until approved)" : ""), llqaPKR(p.salaries)],
      ...Object.entries(p.cost).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, llqaPKR(v)]),
      ...(p.wo ? [["Fees written off", llqaPKR(p.wo)]] : []),
      ["Total expenses", llqaPKR(p.costAll), true],
      [p.net >= 0 ? "NET PROFIT" : "NET LOSS", llqaPKR(p.net), true],
      ["Operating margin", p.margin == null ? "—" : p.margin + "%"],
    ];
    csv = [["Month", "Revenue PKR", "Expenses PKR", "Net PKR", "Margin %"], ...six.map((x) => [x.ym, Math.round(x.revenue), Math.round(x.costAll), Math.round(x.net), x.margin == null ? "" : x.margin])];
    const maxN = Math.max(1, ...six.map((x) => Math.abs(x.net)));
    content = [
      row([stat("Revenue — " + ML, llqaPKR(p.revenue), "fees billed + other income", c.success, "a"), stat("Expenses — " + ML, llqaPKR(p.costAll), "salaries, bills, write-offs", c.warn, "b"), stat(p.net >= 0 ? "Net profit" : "Net loss", llqaPKR(p.net), p.margin == null ? "" : "margin " + p.margin + "%", p.net >= 0 ? c.success : c.danger, "c"), stat("Year to date", llqaPKR(tot("net")), "revenue " + llqaPKR(tot("revenue")) + " · expenses " + llqaPKR(tot("costAll")), tot("net") >= 0 ? c.success : c.danger, "d")], "st"),
      React.createElement(
        "div",
        { key: "g", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 } },
        llqaCard(
          [
            React.createElement("div", { key: "h", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, llqaH("Profit & loss statement — " + ML, "What the month earned and cost (fees billed for it, salaries for it, bills due in it)."), llqaMini("⎙ Print / PDF", () => print("Profit & loss — " + ML, lines), { key: "p" })),
            llqaTable(["", ""], lines.map((r, i) => React.createElement("tr", { key: i }, llqaTd(r[0], "a", { fontWeight: r[2] ? 800 : 400, color: r[2] ? c.text : c.textSec }), llqaTd(r[1], "b", { textAlign: "right", fontWeight: r[2] ? 800 : 400, color: r[0].startsWith("NET") ? (p.net >= 0 ? c.success : c.danger) : c.text })))),
            p.missing ? llqaSmall(p.missing + " fee amount(s) have no rate and are left out — set the rates in Settings → Payment Gateways.", c.warn, "m") : null,
          ],
          { key: "s" },
        ),
        llqaCard([llqaH("Net profit trend — last 6 months"), legend([["Profit", c.success], ["Loss", c.danger]]), bars(six.map((x) => [llqaMonthLabel(x.ym), [x.net]]), maxN, [c.success]), llqaTable(["Month", "Revenue", "Expenses", "Net", "Margin"], six.slice().reverse().map((x) => React.createElement("tr", { key: x.ym }, llqaTd(llqaMonthLabel(x.ym), "m"), llqaTd(llqaPKR(x.revenue), "r"), llqaTd(llqaPKR(x.costAll), "e"), llqaTd(llqaPKR(x.net), "n", { color: x.net >= 0 ? c.success : c.danger, fontWeight: 700 }), llqaTd(x.margin == null ? "—" : x.margin + "%", "g"))))], { key: "t" }),
      ),
    ];
  } else if (tab === "cashflow") {
    const pos = llqaFinPosition(today);
    const cs = llqaOpt("cashStart");
    const six = months6.map((ym) => llqaFinCash(ym));
    // the balance at each month's end: the starting amount + in − out from its day
    const closing = (ym) => {
      if (!cs || !llqaIsDay(cs.date)) return null;
      const end = ym + "-" + String(llqaYmDays(ym)).padStart(2, "0");
      if (end < cs.date) return null;
      const p2 = llqaFinPosition(end > today ? today : end);
      return p2 ? p2.now : null;
    };
    const ahead = [30, 60, 90, 180].map((d) => llqaFinAhead(d, today)); // up to six months ahead
    const next = ahead[0];
    const flow = [
      ...next.fees.map((x) => ({ date: x.date, what: "Fee — " + x.s.name, inn: llqaToPKR(x.amount, x.cur, R).pkr, raw: llqaAmt(x.amount, x.cur) })),
      ...next.bills.map((x) => ({ date: x.date, what: x.what + (x.projected ? " (repeating)" : ""), out: llqaToPKR(x.amount, x.cur, R).pkr, raw: llqaAmt(x.amount, x.cur) })),
      ...next.salaries.map((x) => ({ date: x.date, what: x.what + (x.estimate ? " (estimate)" : ""), out: x.amount, raw: llqaPKR(x.amount) })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    csv = [["Month", "In PKR", "Out PKR", "Net PKR", "Closing PKR"], ...six.map((x) => [x.ym, Math.round(x.inAll), Math.round(x.outAll), Math.round(x.net), closing(x.ym) == null ? "" : Math.round(closing(x.ym))])];
    content = [
      row([
        stat("Opening balance", cs && llqaIsDay(cs.date) ? llqaPKR(cs.amount) : "—", cs && llqaIsDay(cs.date) ? "on " + llqaDateLabel(cs.date) : "set it in Settings → Finance", null, "a"),
        stat("Cash in hand now", pos ? llqaPKR(pos.now) : "—", pos ? "in " + llqaPKR(pos.inn) + " · out " + llqaPKR(pos.out) + " since" : "", pos && pos.now < 0 ? c.danger : c.success, "b"),
        stat("Next 30 days", llqaPKR(next.net), "in " + llqaPKR(next.inPKR) + " · out " + llqaPKR(next.outPKR), next.net >= 0 ? c.success : c.danger, "c"),
        stat("Closing in 30 days", pos ? llqaPKR(pos.now + next.net) : "—", pos ? "if everything comes in and goes out on time" : "", null, "d"),
      ], "st"),
      !cs ? llqaCard(React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", fontSize: 12 } }, "Enter the money in hand on a day once — the cash position and closing balances follow by themselves.", llqaMini("Settings → Finance", () => llqaOpenSettings("finance"), { key: "s", tone: "accent" })), { key: "set" }) : null,
      React.createElement(
        "div",
        { key: "g", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 } },
        llqaCard([llqaH("Monthly cash flow — last 6 months"), llqaTable(["Month", "In", "Out", "Net", "Closing"], six.slice().reverse().map((x) => React.createElement("tr", { key: x.ym }, llqaTd(llqaMonthLabel(x.ym), "m"), llqaTd(llqaPKR(x.inAll), "i", { color: c.success }), llqaTd(llqaPKR(x.outAll), "o", { color: c.warn }), llqaTd(llqaPKR(x.net), "n", { fontWeight: 700 }), llqaTd(closing(x.ym) == null ? "—" : llqaPKR(closing(x.ym)), "c"))))], { key: "m" }),
        llqaCard([llqaH("Cash flow forecast", "Fees falling due, bills due (repeating ones too) and salaries due."), llqaTable(["", "In", "Out", "Net"], ahead.map((a) => React.createElement("tr", { key: a.days }, llqaTd(a.days === 180 ? "Next 6 months" : "Next " + a.days + " days", "d"), llqaTd(llqaPKR(a.inPKR), "i", { color: c.success }), llqaTd(llqaPKR(a.outPKR), "o", { color: c.warn }), llqaTd(llqaPKR(a.net), "n", { fontWeight: 700, color: a.net >= 0 ? c.success : c.danger })))), owed.total ? llqaSmall("Not counted: " + llqaPKR(owed.total) + " families owe already (overdue) — Recovery may bring it in.", null, "o") : null], { key: "f" }),
      ),
      llqaCard([llqaH("The next 30 days, day by day"), flow.length ? llqaTable(["Date", "What", "In", "Out"], flow.slice(0, 120).map((x, i) => React.createElement("tr", { key: i }, llqaTd(llqaDateLabel(x.date), "d", { whiteSpace: "nowrap" }), llqaTd(x.what, "w"), llqaTd(x.inn ? llqaPKR(x.inn) : "", "i", { color: c.success }), llqaTd(x.out ? llqaPKR(x.out) : "", "o", { color: c.warn })))) : empty("Nothing due in the next 30 days.")], { key: "d" }),
    ];
  } else if (tab === "reports") {
    const p = llqaFinPnl(cur);
    const prev = llqaFinPnl(llqaMonthAdd(cur, -1));
    const late = owed.rows.filter((r) => !r.gone && r.overdue);
    const curBills = all.map((x) => x.cy.months.find((m) => m.ym === cur)).filter(Boolean);
    const billed = curBills.reduce((a, m) => a + m.fee, 0);
    const paidOn = curBills.reduce((a, m) => a + m.paid, 0);
    const ratio = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 10 + "%" : "—");
    const taxes = months6.map((ym) => [ym, llqaFinPnl(ym).cost.Taxes || 0, llqaFinCash(ym).out.Taxes || 0]);
    const toPKR = llqaToPKR(Number(conv.amount) || 0, conv.from, R);
    const exp = (name, rows) => llqaCsv(name, rows);
    const reports = [
      ["Fee collection", "Every payment received (receipts, families, months paid)", () => exp("Fee-Collection-" + today + ".csv", [["Receipt", "Family", "Type", "For", "Amount", "Currency", "PKR", "Date", "Paid by", "Reference", "Posted by"], ...pays.map((x) => [x.receiptNo || "", x.studentName || x.payer || "", x.type === "other" ? x.category : "Monthly fee", x.type === "other" ? "" : llqaPayFor(x, today), x.amount, x.currency, Math.round(pk(x)), x.paidDate, x.gateway || "", x.receipt || "", x.postedBy || ""])])],
      ["Expense report", "Every payment out (bills and salaries)", () => exp("Expense-Report-" + today + ".csv", [["Date", "Paid to", "Category", "Amount", "Currency", "Paid by", "Reference", "By"], ...llqaApAll(today).flatMap((l) => (l.pays || []).map((x) => [x.date, l.vendor, l.category, x.amount, l.currency || "PKR", x.method || "", x.ref || "", x.by || ""]))])],
      ["Profit & loss (6 months)", "Revenue, expenses and net by month", () => exp("PnL-" + today + ".csv", [["Month", "Fees billed", "Other income", "Salaries", "Bills", "Written off", "Net", "Margin %"], ...months6.map((ym) => { const x = llqaFinPnl(ym); return [ym, Math.round(x.fees), Math.round(x.revenue - x.fees), Math.round(x.salaries), Math.round(Object.values(x.cost).reduce((a, v) => a + v, 0)), Math.round(x.wo), Math.round(x.net), x.margin == null ? "" : x.margin]; })])],
      ["Cash flow (6 months)", "Money in and out by month", () => exp("Cash-Flow-" + today + ".csv", [["Month", "In", "Out", "Net"], ...months6.map((ym) => { const x = llqaFinCash(ym); return [ym, Math.round(x.inAll), Math.round(x.outAll), Math.round(x.net)]; })])],
      ["Families owing", "Who owes what and for how long (with families who left)", () => exp("Families-Owing-" + today + ".csv", [["Student", "Parent", "Phone", "Status", "Owed", "Currency", "PKR", "Oldest due", "Days late"], ...owed.rows.map((r) => [r.s.name, r.s.parent || "", r.s.phone || "", r.gone ? "Left" : "With the academy", r.left, r.cur, Math.round(r.pkr), r.oldest.due, r.days])])],
      ["Tax summary", "The Taxes category: due and paid by month", () => exp("Tax-Summary-" + today + ".csv", [["Month", "Due PKR", "Paid PKR"], ...taxes.map((t) => [t[0], Math.round(t[1]), Math.round(t[2])])])],
    ];
    content = [
      row([
        stat("Expense ratio", ratio(p.costAll, p.revenue), "expenses ÷ revenue, " + llqaMonthLabel(cur), null, "a"),
        stat("Defaulter rate", ratio(late.length, live.length), late.length + " of " + live.length + " paying families overdue", late.length ? c.warn : c.success, "b"),
        stat("Monthly growth", prev.revenue > 0 ? Math.round(((p.revenue - prev.revenue) / prev.revenue) * 1000) / 10 + "%" : "—", "revenue vs " + llqaMonthLabel(llqaMonthAdd(cur, -1)), null, "c"),
        stat("Revenue per family", llqaPKR(live.length ? p.fees / live.length : 0), "fees billed this month ÷ paying families", null, "d"),
        stat("Collection rate", ratio(paidOn, billed), "of this month's bills (in their currencies)", null, "e"),
      ], "st"),
      React.createElement(
        "div",
        { key: "g", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 } },
        llqaCard([llqaH("Export reports (CSV)"), ...reports.map(([n, sub, run]) => React.createElement("div", { key: n, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "44") } }, React.createElement("div", null, React.createElement("div", { style: { fontSize: 12, fontWeight: 700 } }, n), llqaSmall(sub, null, "s")), llqaMini("⬇ Export", run, { key: "x" })))], { key: "r" }),
        llqaCard(
          [
            llqaH("Currency converter", "At your rates (Settings → Payment Gateways)."),
            React.createElement(
              "div",
              { key: "c", style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } },
              React.createElement("input", { type: "number", "aria-label": "Amount to convert", value: conv.amount, onChange: (e) => setConv({ ...conv, amount: e.target.value }), style: { ...llqaSelectStyle, width: 110 } }),
              llqaSel(conv.from, (v) => setConv({ ...conv, from: v }), Object.keys(R).length ? Object.keys(R) : ["USD"], { key: "f", title: "Currency" }),
              React.createElement("span", { style: { fontSize: 13, fontWeight: 700 } }, "= " + (toPKR.how === "missing" ? "no rate set" : llqaPKR(toPKR.pkr))),
            ),
            Object.keys(R).length ? llqaSmall(Object.entries(R).map(([k, v]) => "1 " + k + " = Rs " + v).join(" · "), null, "r") : llqaMini("Set rates", () => llqaOpenSettings("payments"), { key: "sr" }),
          ],
          { key: "cv" },
        ),
      ),
    ];
  }
  const TABS = [
    ["dashboard", "Dashboard"],
    ["fees", "Student Fees"],
    ["invoices", "Invoices"],
    ["income", "Income"],
    ["expenses", "Expenses"],
    ["pnl", "P&L Statement"],
    ["cashflow", "Cash Flow"],
    ["reports", "Reports"],
  ];
  const monthly = ["invoices", "income", "expenses", "pnl"].includes(tab);
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 } },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { style: { color: c.text, fontSize: 20, fontWeight: 800, margin: 0 } }, "Finance"),
        React.createElement("div", { style: { color: c.textSec, fontSize: 12, marginTop: 3 } }, "Fees, other income, bills and salaries from Accounts Receivable, Accounts Payable and Payroll — one set of numbers, in PKR."),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } },
        monthly ? monthPick() : null,
        llqaMini("💰 Record payment", () => llqaOpen("payment", {}), { key: "rp", big: true, solid: true, tone: "success" }),
        llqaMini("＋ Add expense", () => llqaOpen("apBill", { paid: true }), { key: "ae", big: true }),
        csv ? llqaMini("⬇ Export", () => llqaCsv("Finance-" + tab + "-" + (monthly ? month : today) + ".csv", csv), { key: "ex", big: true }) : null,
      ),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 2, background: c.bgDeep, borderRadius: 8, padding: 3, marginBottom: 14, flexWrap: "wrap" } },
      TABS.map(([k, l]) => React.createElement("button", { key: k, type: "button", onClick: () => setTab(k), style: { padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === k ? c.accentFill : "transparent", color: tab === k ? c.accentText : c.textSec } }, l)),
    ),
    ["fees", "invoices", "income", "expenses"].includes(tab) ? React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, llqaSearch(q, setQ, "Search family, vendor, receipt…")) : null,
    llqaRatesNote([llqaSumPKR(pays, R, llqaPayPick), llqaSumPKR(live, R, (x) => ({ amount: x.cy.amt, currency: x.cy.cur, fallback: "USD" })), llqaSumPKR(llqaApAll(today), R, (l) => ({ amount: l.amount, currency: l.currency, fallback: "PKR" }))], R, "rates"), // v71
    content,
  );
};
