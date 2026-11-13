// v77: Accounts Payable — each bill keeps its payments (part payments too) and its status follows them; a repeating
// bill brings the next one by itself; teachers' salaries come from Payroll (one line a month, paid as Payroll pays);
// the office is told before a bill is due and when it is overdue; vendor details kept once; a removed bill is kept
// with the reason. Totals in PKR at your rates.
const AccountsPMod = ({ apLiabilities, appSettings }) => {
  const today = todayPK();
  const [tab, setTab] = useState("ledger");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [showGone, setShowGone] = useState(false);
  const R = llqaRates(appSettings);
  const typed = (apLiabilities || []).filter(Boolean);
  const payroll = llqaApPayroll(today);
  const allBills = [...typed, ...payroll];
  const ql = q.trim().toLowerCase();
  const hit = (...v) => !ql || v.some((x) => String(x == null ? "" : x).toLowerCase().includes(ql));
  const pk = (l, n) => llqaToPKR(n, l.currency || "PKR", R).pkr;
  const sumOf = (list, pick) => llqaSumPKR(list, R, (l) => ({ amount: pick(l), currency: l.currency, fallback: "PKR" }));
  const owedS = sumOf(allBills, llqaApLeft);
  const paidS = sumOf(allBills, llqaApPaid);
  const late = allBills.filter((l) => llqaApState(l, today) === "overdue");
  const days = (d) => (llqaIsDay(d) ? llqaDays(today, d) : null);
  const can = llqaCanManage();
  const series = llqaApSeries(typed);
  const pill = (l) => {
    const d = LLQA_AP_STATES[llqaApState(l, today)] || ["—", "textSec"];
    return llqaPill(d[0], c[d[1]] || c.textSec);
  };
  const vendorCell = (l, k) =>
    llqaTd(
      [
        React.createElement("div", { key: "v", style: { fontWeight: 700 } }, l.vendor || "—"),
        llqaSmall(
          [l.category, l.payroll ? l.notes : "", l.repeat && LLQA_AP_REPEAT[l.repeat.every] ? "repeats " + LLQA_AP_REPEAT_NAME[l.repeat.every].toLowerCase() : "", l.estimate ? (l.payroll ? "estimate until approved" : "amount to confirm") : "", l.approvedBy ? "approved by " + l.approvedBy : "", l.reference].filter(Boolean).join(" · "),
          l.estimate ? c.warn : null,
          "s",
        ),
      ],
      k || "v",
    );
  const dueCell = (l) => {
    const d = days(l.dueDate);
    const st = llqaApState(l, today);
    return llqaTd([llqaDateLabel(l.dueDate) || "—", d != null && st !== "paid" ? llqaSmall(d < 0 ? -d + " days overdue" : d === 0 ? "due today" : "in " + d + " days", d < 0 ? c.danger : d <= 3 ? c.warn : null, "d") : null], "d", { whiteSpace: "nowrap" });
  };
  const acts = (l) =>
    l.payroll
      ? llqaMini("Open Payroll", () => (typeof llqaPayOpen === "function" ? llqaPayOpen(l.ym) : llqaGo("payroll")), { key: "pr", title: "Payroll approves and pays salaries" })
      : React.createElement(
          "div",
          { style: { display: "flex", gap: 4, flexWrap: "wrap" } },
          llqaApLeft(l) > 0 ? llqaMini("💳 Pay", () => llqaOpen("apPay", { billId: l.id }), { key: "p", tone: "success" }) : llqaMini("Payments", () => llqaOpen("apPay", { billId: l.id }), { key: "p" }),
          llqaMini("✎", () => llqaOpen("apBill", { billId: l.id }), { key: "e", title: "Edit" }),
          can && !l.approvedBy && llqaApLeft(l) > 0 ? llqaMini("✓ Approve", () => llqaApApprove(l), { key: "a", title: "Approve this bill" }) : null,
          llqaMini("🗑", () => llqaOpen("remove", { kind: "bill", id: l.id }), { key: "d", tone: "danger", title: "Remove (with the reason)" }),
        );
  const paidCell = (l) => {
    const ps = Array.isArray(l.pays) ? l.pays : [];
    const last = ps.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).pop();
    return llqaTd([llqaAmt(llqaApPaid(l), l.currency || "PKR"), ps.length ? llqaSmall(ps.length + " payment" + (ps.length === 1 ? "" : "s") + (last ? " · last " + llqaDateLabel(last.date) + (last.method ? " (" + last.method + ")" : "") : ""), null, "p") : null], "p", { whiteSpace: "nowrap" });
  };
  let content = null;
  let csv = null;
  if (tab === "ledger") {
    const gone = (llqaFinDoc().apRemoved || []).slice().reverse();
    const F = [
      ["all", "All", () => true],
      ["unpaid", "Unpaid", (l) => llqaApState(l, today) === "unpaid"],
      ["partial", "Part paid", (l) => llqaApState(l, today) === "partial"],
      ["overdue", "Overdue", (l) => llqaApState(l, today) === "overdue"],
      ["paid", "Paid", (l) => llqaApState(l, today) === "paid"],
    ];
    const test = (F.find((x) => x[0] === fStatus) || F[0])[2];
    const rows = (showGone ? gone : allBills.filter(test)).filter((l) => hit(l.vendor, l.category, l.reference, l.notes)).sort((a, b) => String(b.dueDate || "").localeCompare(String(a.dueDate || "")));
    csv = [["Vendor", "Category", "Due", "Amount", "Currency", "Paid", "Left", "Status", "Repeats", "Reference"], ...rows.map((l) => [l.vendor, l.category, l.dueDate || "", l.amount, l.currency || "PKR", llqaApPaid(l), llqaApLeft(l), showGone ? "Removed: " + (l.removedWhy || "") : (LLQA_AP_STATES[llqaApState(l, today)] || [""])[0], l.repeat && l.repeat.every ? LLQA_AP_REPEAT_NAME[l.repeat.every] : "", l.reference || ""])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Outstanding (owed)", llqaPKR(owedS.pkr), llqaSumSub(owedS) || allBills.filter((l) => llqaApLeft(l) > 0).length + " bills", owedS.pkr > 0 ? c.warn : c.text, "a"),
        llqaStat("Paid", llqaPKR(paidS.pkr), llqaSumSub(paidS), c.success, "b"),
        llqaStat("Overdue", late.length, llqaPKR(late.reduce((a, l) => a + pk(l, llqaApLeft(l)), 0)), late.length ? c.danger : c.text, "c"),
        llqaStat("Repeating", [...series.values()].filter((l) => l.repeat && LLQA_AP_REPEAT[l.repeat.every]).length, "the next one appears " + (parseInt(llqaOpt("billAhead"), 10) || 0) + " days before it is due", null, "d"),
      ]),
      React.createElement("div", { key: "ft", style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } }, llqaChips([...F.map(([k, l, t]) => [k, l, allBills.filter(t).length]), ["gone", "Removed", gone.length]], showGone ? "gone" : fStatus, (k) => (k === "gone" ? setShowGone(true) : (setShowGone(false), setFStatus(k))))),
      llqaCard(
        rows.length
          ? llqaTable(
              ["Vendor / payee", "Due", "Amount", "Paid", "Left", "Status", ""],
              rows.map((l) =>
                React.createElement(
                  "tr",
                  { key: l.id + (l.removedAt || "") },
                  vendorCell(l),
                  dueCell(l),
                  llqaTd(llqaAmt(l.amount, l.currency || "PKR"), "a", { whiteSpace: "nowrap", fontWeight: 700 }),
                  paidCell(l),
                  llqaTd(llqaAmt(llqaApLeft(l), l.currency || "PKR"), "l", { whiteSpace: "nowrap" }),
                  llqaTd(showGone ? llqaSmall("Removed by " + (l.removedBy || "?") + " — " + (l.removedWhy || ""), c.danger, "r") : pill(l), "s"),
                  llqaTd(showGone ? (can ? llqaMini("↺ Put back", () => llqaApRestore(l), { key: "rs", tone: "success" }) : null) : acts(l), "x"),
                ),
              ),
            )
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, showGone ? "Nothing removed." : typed.length || payroll.length ? "No bill in this filter." : "No bills yet. Add rent, internet, software… — a repeating bill brings the next one by itself. Teachers' salaries come from Payroll."),
      ),
    ];
  } else if (tab === "due") {
    const open = allBills.filter((l) => llqaApLeft(l) > 0 && hit(l.vendor, l.category)).sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")));
    const week = open.filter((l) => {
      const d = days(l.dueDate);
      return d != null && d >= 0 && d <= 7;
    });
    const month = open.filter((l) => {
      const d = days(l.dueDate);
      return d != null && d >= 0 && d <= 30;
    });
    csv = [["Vendor", "Category", "Due", "Left", "Currency", "Days"], ...open.map((l) => [l.vendor, l.category, l.dueDate || "", llqaApLeft(l), l.currency || "PKR", days(l.dueDate)])];
    content = [
      React.createElement("div", { key: "st", style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, [
        llqaStat("Overdue", late.length, llqaPKR(late.reduce((a, l) => a + pk(l, llqaApLeft(l)), 0)), late.length ? c.danger : c.success, "a"),
        llqaStat("Due in 7 days", week.length, llqaPKR(week.reduce((a, l) => a + pk(l, llqaApLeft(l)), 0)), week.length ? c.warn : c.text, "b"),
        llqaStat("Due in 30 days", month.length, llqaPKR(month.reduce((a, l) => a + pk(l, llqaApLeft(l)), 0)), null, "c"),
        llqaStat("All still to pay", open.length, llqaPKR(owedS.pkr), null, "d"),
      ]),
      llqaCard(
        open.length
          ? llqaTable(["Vendor / payee", "Due", "Left", "Status", ""], open.map((l) => React.createElement("tr", { key: l.id }, vendorCell(l), dueCell(l), llqaTd(llqaAmt(llqaApLeft(l), l.currency || "PKR"), "l", { whiteSpace: "nowrap", fontWeight: 700 }), llqaTd(pill(l), "s"), llqaTd(acts(l), "x"))))
          : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Nothing to pay."),
      ),
    ];
  } else if (tab === "vendors") {
    const g = {};
    allBills.forEach((l) => {
      const k = String(l.vendor || "—").trim();
      if (!g[k]) g[k] = { name: k, n: 0, total: 0, paid: 0, left: 0, last: "", cats: new Set(), payroll: !!l.payroll };
      const x = g[k];
      x.n++;
      x.total += pk(l, l.amount);
      x.paid += pk(l, llqaApPaid(l));
      x.left += pk(l, llqaApLeft(l));
      (l.pays || []).forEach((p) => p && String(p.date) > x.last && (x.last = String(p.date)));
      x.cats.add(l.category || "Other");
    });
    const rows = Object.values(g).filter((x) => hit(x.name, [...x.cats].join(" "))).sort((a, b) => b.total - a.total);
    csv = [["Vendor", "Bills", "Total PKR", "Paid PKR", "Left PKR", "Last paid", "Phone", "Bank", "Account"], ...rows.map((x) => { const vd = llqaApVendor(x.name) || {}; return [x.name, x.n, Math.round(x.total), Math.round(x.paid), Math.round(x.left), x.last, vd.phone || "", vd.bank || "", vd.account || ""]; })];
    content = llqaCard(
      rows.length
        ? llqaTable(
            ["Vendor / payee", "Bills", "Total", "Paid", "Still to pay", "Details", ""],
            rows.map((x) => {
              const vd = llqaApVendor(x.name);
              return React.createElement(
                "tr",
                { key: x.name },
                llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, x.name), llqaSmall([...x.cats].join(", ") + (x.last ? " · last paid " + llqaDateLabel(x.last) : ""), null, "s")], "n"),
                llqaTd(x.n, "c"),
                llqaTd(llqaPKR(x.total), "t", { whiteSpace: "nowrap" }),
                llqaTd(llqaPKR(x.paid), "p", { whiteSpace: "nowrap", color: c.success }),
                llqaTd(llqaPKR(x.left), "l", { whiteSpace: "nowrap", fontWeight: x.left > 0 ? 700 : 400 }),
                llqaTd(vd ? llqaSmall([vd.bank, vd.account, vd.phone].filter(Boolean).join(" · ") || "—", null, "d") : llqaSmall("—", null, "d"), "d"),
                llqaTd(x.payroll ? null : llqaMini("📋 Details", () => llqaOpen("apVendor", { name: x.name }), { key: "v", title: "Phone, bank, account" }), "x"),
              );
            }),
          )
        : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No vendors yet."),
    );
  } else if (tab === "category") {
    const ym = today.slice(0, 7);
    const budgets = llqaOpt("budgets") || {};
    const g = {};
    allBills.forEach((l) => {
      const k = l.category || "Other";
      if (!g[k]) g[k] = { k, n: 0, total: 0, paid: 0, left: 0, month: 0 };
      g[k].n++;
      g[k].total += pk(l, l.amount);
      g[k].paid += pk(l, llqaApPaid(l));
      g[k].left += pk(l, llqaApLeft(l));
      if (String(l.dueDate || "").slice(0, 7) === ym) g[k].month += pk(l, l.amount);
    });
    Object.keys(budgets).forEach((k) => g[k] || (g[k] = { k, n: 0, total: 0, paid: 0, left: 0, month: 0 }));
    const rows = Object.values(g).sort((a, b) => b.total - a.total);
    csv = [["Category", "Bills", "Total PKR", "Paid PKR", "Left PKR", "This month PKR", "Budget PKR"], ...rows.map((x) => [x.k, x.n, Math.round(x.total), Math.round(x.paid), Math.round(x.left), Math.round(x.month), budgets[x.k] || ""])];
    content = llqaCard(
      rows.length
        ? llqaTable(
            ["Category", "Bills", "Total", "Paid", "Still to pay", "This month / budget"],
            rows.map((x) => {
              const b = Number(budgets[x.k]) || 0;
              const over = b > 0 && x.month > b;
              return React.createElement(
                "tr",
                { key: x.k },
                llqaTd(x.k, "k", { fontWeight: 700 }),
                llqaTd(x.n, "n"),
                llqaTd(llqaPKR(x.total), "t"),
                llqaTd(llqaPKR(x.paid), "p", { color: c.success }),
                llqaTd(llqaPKR(x.left), "l"),
                llqaTd([llqaPKR(x.month) + (b ? " / " + llqaPKR(b) : ""), b ? llqaSmall(over ? "over the budget by " + llqaPKR(x.month - b) : Math.round((x.month / b) * 100) + "% of the budget", over ? c.danger : c.success, "b") : null], "m"),
              );
            }),
          )
        : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No bills yet."),
    );
  } else if (tab === "schedule") {
    const end = llqaAddDays(today, 92);
    const items = [
      ...allBills.filter((l) => llqaApLeft(l) > 0 && llqaIsDay(l.dueDate) && l.dueDate <= end).map((l) => ({ l, date: l.dueDate, amount: llqaApLeft(l), late: l.dueDate < today })),
      ...llqaApUpcoming(typed, end)
        .filter((x) => !typed.some((b) => String(b.seriesId != null ? b.seriesId : b.id) === x.k && b.dueDate === x.dueDate))
        .map((x) => ({ l: x.from, date: x.dueDate, amount: Number(x.from.amount) || 0, projected: true })),
    ].filter((x) => hit(x.l.vendor, x.l.category));
    const months = {};
    items.forEach((x) => {
      const k = x.late ? "late" : x.date.slice(0, 7);
      if (!months[k]) months[k] = [];
      months[k].push(x);
    });
    const keys = Object.keys(months).sort((a, b) => (a === "late" ? -1 : b === "late" ? 1 : a.localeCompare(b)));
    csv = [["Month", "Vendor", "Category", "Due", "Amount", "Currency", "Note"], ...items.map((x) => [x.late ? "Overdue" : x.date.slice(0, 7), x.l.vendor, x.l.category, x.date, x.amount, x.l.currency || "PKR", x.projected ? "repeating — not created yet" : ""])];
    content = keys.length
      ? keys.map((k) => {
          const list = months[k].sort((a, b) => a.date.localeCompare(b.date));
          const tot = list.reduce((a, x) => a + pk(x.l, x.amount), 0);
          return llqaCard(
            [
              llqaH((k === "late" ? "Overdue" : llqaMonthLabel(k)) + " — " + llqaPKR(tot), list.length + " bill" + (list.length === 1 ? "" : "s") + (list.some((x) => x.projected) ? " · repeating bills not created yet are included" : "")),
              llqaTable(
                ["Due", "Vendor / payee", "Amount", ""],
                list.map((x, i) => React.createElement("tr", { key: (x.l.id || "") + x.date + i }, llqaTd(llqaDateLabel(x.date), "d", { whiteSpace: "nowrap" }), vendorCell(x.l), llqaTd(llqaAmt(x.amount, x.l.currency || "PKR"), "a", { whiteSpace: "nowrap", fontWeight: 700 }), llqaTd(x.projected ? llqaPill("🔁 will appear " + llqaDateLabel(llqaAddDays(x.date, -(parseInt(llqaOpt("billAhead"), 10) || 0))), c.textSec) : acts(x.l), "x"))),
              ),
            ],
            { key: k },
          );
        })
      : llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Nothing to pay in the next three months."));
  }
  const TABS = [
    ["ledger", "Liabilities Ledger"],
    ["due", "Due & Overdue"],
    ["vendors", "Vendors"],
    ["category", "By Category"],
    ["schedule", "Payment Schedule"],
  ];
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 } },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { style: { color: c.text, fontSize: 20, fontWeight: 800, margin: 0 } }, "Accounts Payable"),
        React.createElement("div", { style: { color: c.textSec, fontSize: 12, marginTop: 3 } }, "Bills to pay, repeating bills and teachers' salaries from Payroll — in PKR at your rates."),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        llqaMini("＋ Add bill", () => llqaOpen("apBill", {}), { key: "add", big: true, solid: true, tone: "success" }),
        llqaMini("⬇ Export", () => csv && llqaCsv("Accounts-Payable-" + tab + "-" + today + ".csv", csv), { key: "ex", big: true }),
      ),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 2, background: c.bgDeep, borderRadius: 8, padding: 3, marginBottom: 14, flexWrap: "wrap" } },
      TABS.map(([k, l]) =>
        React.createElement(
          "button",
          { key: k, type: "button", onClick: () => setTab(k), style: { padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === k ? c.accentFill : "transparent", color: tab === k ? c.accentText : c.textSec } },
          l + (k === "due" && late.length ? " (" + late.length + " overdue)" : ""),
        ),
      ),
    ),
    React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, llqaSearch(q, setQ, "Search vendor, category, reference…")),
    llqaRatesNote([owedS, paidS], R, "rates"), // v71
    content,
  );
};
