const PayrollMod = ({
  user,
  teachers: propTeachers,
  qcViolations,
  appSettings,
  payHistory: savedPay, // v71: data/payrollHistory (cloud)
  setPayHistory: setSavedPay,
  attendanceHistory, // v72: attendance fines are deducted (only Quality Control fines were)
}) => {
  // v68: salaries typed in forms are text; as numbers the pay and totals add up (was "36000" + 0 = "360000")
  const teachers = useMemo(() => (propTeachers || initPayrollTeachers).map((t) => ({ ...t, salary: Number(t.salary) || 0 })), [propTeachers]);
  // v71: the history lives in the cloud (approvals, payments, advances, bonuses); it was a local list lost on reload
  const [localPay, setLocalPay] = useState({});
  const payHistory = savedPay && typeof savedPay === "object" && !Array.isArray(savedPay) ? savedPay : localPay;
  const setPayHistory = typeof setSavedPay === "function" ? setSavedPay : setLocalPay;
  const actor = (user && (user.name || user.username || (user.role === "superadmin" ? "Super Admin" : user.role))) || "Admin";
  const [tab, setTab] = useState("current");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fShift, setFShift] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => llqaPayStartYm()); // v75: Pakistan time; last month while its salaries aren't all paid
  const [selected, setSelected] = useState([]);
  // v72: a month's attendance comes from the cloud when its payroll is looked at
  React.useEffect(() => {
    const need = LLQAApp.ctx && LLQAApp.ctx.attNeed;
    if (typeof need === "function") need(String(selectedMonth || "").slice(0, 7));
  }, [selectedMonth]);
  const [modal, setModal] = useState(null);
  const [payForm, setPayForm] = useState({});
  const currentRecs = useMemo(() => {
    // v75: the month's pay from the rules — the days with the academy, the salary changes, the bonuses, the fines (v72)
    // and the advance installments; approved and paid months keep their numbers
    const o = { hist: payHistory, qc: qcViolations, att: attendanceHistory, counts: llqaPayCounts(teachers), today: todayPK() };
    return teachers.map((t) => ({ ...t, pay: llqaPayRec(t, selectedMonth, o) }));
  }, [teachers, payHistory, selectedMonth, qcViolations, attendanceHistory]); // v72, v75
  const stats = useMemo(() => {
    const recs = currentRecs.filter((t) => t.pay);
    const totalGross = recs.reduce((s, t) => s + t.pay.gross, 0);
    const totalNet = recs.reduce((s, t) => s + t.pay.net, 0);
    const totalFines = recs.reduce((s, t) => s + t.pay.fine, 0);
    const totalBonuses = recs.reduce((s, t) => s + t.pay.bonuses, 0);
    const totalAdvances = recs.reduce((s, t) => s + t.pay.advance, 0);
    const totalTax = recs.reduce((s, t) => s + t.pay.tax, 0);
    const paid = recs.filter((t) => t.pay.status === "paid").length;
    const pending = recs.filter((t) => t.pay.status === "pending").length;
    const approved = recs.filter((t) => t.pay.status === "approved").length;
    return {
      totalGross,
      totalNet,
      totalFines,
      totalBonuses,
      totalAdvances,
      totalTax,
      paid,
      pending,
      approved,
      paidAmount: recs
        .filter((t) => t.pay.status === "paid")
        .reduce((s, t) => s + t.pay.net, 0),
      pendingAmount: recs
        .filter(
          (t) => t.pay.status === "pending" || t.pay.status === "approved",
        )
        .reduce((s, t) => s + t.pay.net, 0),
    };
  }, [currentRecs]);
  const filtered = useMemo(() => {
    let d = currentRecs.filter((t) => t.pay);
    if (search)
      d = d.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.includes(search),
      );
    if (fStatus !== "all") d = d.filter((t) => t.pay.status === fStatus);
    if (fShift !== "all") d = d.filter((t) => (t.shift || "").includes(fShift));
    return d;
  }, [currentRecs, search, fStatus, fShift]);
  const ytd = useMemo(() => {
    const y = {};
    teachers.forEach((t) => {
      const recs = payHistory[t.id] || [];
      const totalEarned = recs
        .filter((r) => r.status === "paid")
        .reduce((s, r) => s + r.net, 0);
      const totalFines = recs
        .filter((r) => r.status === "paid")
        .reduce((s, r) => s + r.fine, 0);
      const totalBonuses = recs
        .filter((r) => r.status === "paid")
        .reduce((s, r) => s + r.bonuses, 0);
      const totalTax = recs
        .filter((r) => r.status === "paid")
        .reduce((s, r) => s + r.tax, 0);
      y[t.id] = {
        totalEarned,
        totalFines,
        totalBonuses,
        totalTax,
        months: recs.filter((r) => r.status === "paid").length,
      };
    });
    return y;
  }, [teachers, payHistory]);
  const trendData = useMemo(() => {
    const months = {};
    teachers.forEach((t) => {
      (payHistory[t.id] || []).forEach((r) => {
        if (!months[r.month])
          months[r.month] = {
            month: r.month.substring(5),
            gross: 0,
            net: 0,
            fines: 0,
            bonuses: 0,
          };
        months[r.month].gross += r.gross;
        months[r.month].net += r.net;
        months[r.month].fines += r.fine;
        months[r.month].bonuses += r.bonuses;
      });
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [teachers, payHistory]);
  const methodDist = useMemo(() => {
    const m = {};
    teachers.forEach((t) => {
      const method = t.bank ? String(t.bank).split(" - ")[0] : "Unspecified";
      m[method] = (m[method] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({
      name,
      value,
    }));
  }, [teachers]);
  const updateRec = (id, updater) => {
    setPayHistory((prev) => {
      const arr = prev[id] || [];
      const idx = arr.findIndex((r) => r.month === selectedMonth);
      if (idx >= 0) {
        const next = [...arr];
        next[idx] = updater(next[idx]);
        return { ...prev, [id]: next };
      } else {
        const teacher = currentRecs.find((t) => t.id === id);
        if (teacher && teacher.pay) {
          return { ...prev, [id]: [...arr, updater(teacher.pay)] };
        }
        return prev;
      }
    });
  };

  const approvePayment = (id) =>
    updateRec(id, (r) => ({
      ...r,
      status: "approved",
      approvedBy: actor, approvedAt: new Date().toISOString() /* v71: who approved, and when */,
    }));

  const markAsPaid = (id) =>
    updateRec(id, (r) => ({
      ...r,
      status: "paid",
      paidDate: todayPK(),
      paymentMethod: String((teachers.find((t) => t.id === id) || {}).bank || "").split(" - ")[0] || "Not set", // v71: a teacher with no bank set made this throw
      paidBy: actor, // v71
      paidAt: new Date().toISOString(),
    }));

  // v75: an approved month back to pending (worked out again: fines, advance installments)
  const reopenPay = (id) =>
    updateRec(id, (r) => {
      const { approvedBy, approvedAt, fineNow, ...x } = r;
      return { ...x, status: "pending", reopenedBy: actor, reopenedAt: new Date().toISOString() };
    });
  const bulkApprove = () => {
    selected.forEach((id) =>
      updateRec(id, (r) =>
        r.status === "pending"
          ? { ...r, status: "approved", approvedBy: actor, approvedAt: new Date().toISOString() /* v71: who approved, and when */ }
          : r,
      ),
    );
    setSelected([]);
  };

  const bulkPay = () => {
    selected.forEach((id) => {
      const t = teachers.find((x) => x.id === id);
      updateRec(id, (r) =>
        r.status === "approved"
          ? {
              ...r,
              status: "paid",
              paidDate: todayPK(),
              paymentMethod: String((t && t.bank) || "").split(" - ")[0] || "Not set", // v71
              paidBy: actor,
              paidAt: new Date().toISOString(),
            }
          : r,
      );
    });
    setSelected([]);
  };
  const openPayslip = (t) =>
    setModal({
      type: "payslip",
      data: t,
    });
  const openAdvance = (t) => {
    setPayForm({
      id: t ? t.id : "", // v75: + New advance chooses the teacher in the window
      amount: "",
      reason: "",
      installments: 1,
    });
    setModal({
      type: "advance",
      data: t,
    });
  };
  const openRevision = (t) => {
    setPayForm({
      id: t.id,
      newSalary: t.salary,
      reason: "",
      effective: todayPK().slice(0, 7) + "-01", // v75: from the 1st of this month unless another day is chosen
    });
    setModal({
      type: "revision",
      data: t,
    });
  };
  const statusColor = (s) =>
    s === "paid"
      ? "success"
      : s === "approved"
        ? "accent"
        : s === "pending"
          ? "warn"
          : "danger";
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        },
      },
      React.createElement(
        "div",
        null,
        React.createElement(
          "p",
          {
            style: {
              margin: 0,
              color: c.text,
              fontSize: 14,
              fontWeight: 600,
            },
          },
          "Payroll \u2014 ",
          llqaLocalDay(selectedMonth + "-01").toLocaleDateString("en-US", { // v70
            month: "long",
            year: "numeric",
          }),
        ),
        React.createElement(
          "p",
          {
            style: {
              margin: "2px 0 0",
              color: c.textSec,
              fontSize: 11,
            },
          },
          "Total payable Rs ",
          stats.totalNet.toLocaleString(),
          " \xB7 Rs ",
          stats.paidAmount.toLocaleString(),
          " paid \xB7 Rs ",
          stats.pendingAmount.toLocaleString(),
          " pending",
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          },
        },
        React.createElement("input", {
          type: "month",
          value: selectedMonth,
          onChange: (e) => setSelectedMonth(e.target.value),
          style: {
            padding: "8px 12px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 7,
            color: c.text,
            fontSize: 12,
          },
        }),
        React.createElement(
          Btn,
          {
            icon: Download,
            variant: "outline",
            onClick: () => {
              const headers = [
                "S/No",
                "Teacher Name",
                "Account Title",
                "Bank",
                "Account No",
                "Net Salary (Rs)",
                "Month",
              ];
              const rows = teachers.map((t, i) => [
                i + 1,
                t.name || "",
                t.name || "",
                t.bank || "",
                t.cnic || "-",
                t.salary || 0,
                selectedMonth || "Current",
              ]);
              const csv = [headers, ...rows]
                .map((r) =>
                  r
                    .map((v) => {
                      const s = String(v ?? "");
                      return s.includes(",") ||
                        s.includes('"') ||
                        s.includes("\n")
                        ? '"' + s.replace(/"/g, '""') + '"'
                        : s;
                    })
                    .join(","),
                )
                .join("\n");
              const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "LLQA-Bank-Disbursement-" + todayPK() + ".csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              alert(
                "Bank disbursement file downloaded. Upload to your bank portal.",
              );
            },
          },
          "Bank File",
        ),
        React.createElement(
          Btn,
          {
            icon: CreditCard,
            onClick: () => {
              const total = teachers.reduce(
                (sum, t) => sum + (t.salary || 0),
                0,
              );
              if (
                confirm(
                  "Process payroll for " +
                    teachers.length +
                    " teachers?\nTotal payout: Rs " +
                    total.toLocaleString() +
                    "\n\nThis will mark all salaries as paid for " +
                    (selectedMonth || "the current month") +
                    ".",
                )
              )
                alert(
                  "Payroll processed successfully for " +
                    teachers.length +
                    " teachers.\nTotal disbursed: Rs " +
                    total.toLocaleString(),
                );
            },
          },
          "Process Payroll",
        ),
      ),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        },
      },
      React.createElement(SC, {
        icon: CreditCard,
        label: "Gross Payable",
        value: "Rs " + stats.totalGross.toLocaleString(),
        sub: teachers.length + " teachers",
        color: c.accent,
      }),
      React.createElement(SC, {
        icon: DollarSign,
        label: "Net Payable",
        value: "Rs " + stats.totalNet.toLocaleString(),
        color: c.success,
      }),
      React.createElement(SC, {
        icon: Award,
        label: "Total Bonuses",
        value: "Rs " + stats.totalBonuses.toLocaleString(),
        color: c.purple,
      }),
      React.createElement(SC, {
        icon: AlertTriangle,
        label: "Total Fines",
        value: "Rs " + stats.totalFines.toLocaleString(),
        color: c.danger,
      }),
      React.createElement(SC, {
        icon: CheckCircle,
        label: "Paid",
        value: stats.paid,
        sub: "Rs " + stats.paidAmount.toLocaleString(),
        color: c.success,
      }),
      React.createElement(SC, {
        icon: Clock,
        label: "Pending",
        value: stats.pending + stats.approved,
        sub: "Rs " + stats.pendingAmount.toLocaleString(),
        color: c.warn,
      }),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 2,
          background: c.bgDeep,
          borderRadius: 8,
          padding: 3,
          marginBottom: 14,
          flexWrap: "wrap",
        },
      },
      [
        ["current", "Current Month"],
        ["history", "Payment History"],
        ["bonuses", "Bonuses"],
        ["advances", "Advances & Loans"],
        ["analytics", "Analytics"],
        ["ytd", "Year-to-Date"],
      ].map(([k, l]) =>
        React.createElement(
          "button",
          {
            key: k,
            onClick: () => setTab(k),
            style: {
              padding: "7px 14px",
              borderRadius: 6,
              border:
                tab === k ? "1px solid transparent" : "1px solid " + c.border,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              background: tab === k ? c.accentFill : "transparent",
              color: tab === k ? c.accentText : c.textSec,
            },
          },
          l,
        ),
      ),
    ),
    tab === "current" && React.createElement(LLQAPayChecks, { ym: selectedMonth, recs: currentRecs, appSettings }), // v75: where the month stands, what to check
    tab === "current" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
              alignItems: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                position: "relative",
                flex: 1,
                minWidth: 200,
              },
            },
            React.createElement(Search, {
              size: 14,
              style: {
                position: "absolute",
                left: 10,
                top: 9,
                color: c.textMuted,
              },
            }),
            React.createElement("input", {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search teacher...",
              style: {
                width: "100%",
                padding: "8px 12px 8px 30px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
              },
            }),
          ),
          React.createElement(
            LLQASelect, // v70: the CRM's own list
            {
              value: fStatus,
              onChange: (e) => setFStatus(e.target.value),
              style: {
                padding: "8px 10px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 11,
              },
            },
            React.createElement(
              "option",
              {
                value: "all",
              },
              "All Status",
            ),
            React.createElement(
              "option",
              {
                value: "pending",
              },
              "Pending",
            ),
            React.createElement(
              "option",
              {
                value: "approved",
              },
              "Approved",
            ),
            React.createElement(
              "option",
              {
                value: "paid",
              },
              "Paid",
            ),
          ),
          React.createElement(
            LLQASelect, // v70: the CRM's own list
            {
              value: fShift,
              onChange: (e) => setFShift(e.target.value),
              style: {
                padding: "8px 10px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 11,
              },
            },
            React.createElement(
              "option",
              {
                value: "all",
              },
              "All Shifts",
            ),
            React.createElement(
              "option",
              {
                value: "Morning",
              },
              "Morning",
            ),
            React.createElement(
              "option",
              {
                value: "Evening",
              },
              "Evening",
            ),
            React.createElement(
              "option",
              {
                value: "Night",
              },
              "Night",
            ),
            React.createElement(
              "option",
              {
                value: "Subject",
              },
              "Subject",
            ),
          ),
          selected.length > 0 &&
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  gap: 6,
                },
              },
              React.createElement(
                "span",
                {
                  style: {
                    color: c.accent,
                    fontSize: 11,
                    padding: "8px 12px",
                    background: c.accentBg,
                    borderRadius: 7,
                    fontWeight: 600,
                  },
                },
                selected.length,
                " selected",
              ),
              React.createElement(
                "button",
                {
                  onClick: bulkApprove,
                  style: {
                    padding: "8px 12px",
                    background: c.accentBg,
                    border: "1px solid " + llqaAlpha(c.accent, "44"),
                    borderRadius: 7,
                    cursor: "pointer",
                    color: c.accent,
                    fontSize: 11,
                    fontWeight: 600,
                  },
                },
                "Approve",
              ),
              React.createElement(
                "button",
                {
                  onClick: bulkPay,
                  style: {
                    padding: "8px 12px",
                    background: c.successBg,
                    border: "1px solid " + llqaAlpha(c.success, "44"),
                    borderRadius: 7,
                    cursor: "pointer",
                    color: c.success,
                    fontSize: 11,
                    fontWeight: 600,
                  },
                },
                "Mark Paid",
              ),
              React.createElement(
                "button",
                {
                  onClick: () => setSelected([]),
                  style: {
                    padding: "8px 12px",
                    background: c.bgDeep,
                    border: "1px solid " + c.border,
                    borderRadius: 7,
                    cursor: "pointer",
                    color: c.textSec,
                    fontSize: 11,
                  },
                },
                "Clear",
              ),
            ),
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                React.createElement(
                  "th",
                  {
                    style: {
                      padding: "9px 6px",
                      textAlign: "center",
                      background: c.bgDeep,
                      borderBottom: "1px solid " + c.border,
                      width: 30,
                    },
                  },
                  React.createElement("input", {
                    type: "checkbox",
                    checked:
                      selected.length === filtered.length &&
                      filtered.length > 0,
                    onChange: (e) =>
                      setSelected(
                        e.target.checked ? filtered.map((t) => t.id) : [],
                      ),
                  }),
                ),
                [
                  "Teacher",
                  "Shift",
                  "Base",
                  "Bonus",
                  "Gross",
                  "Fine",
                  "Advance",
                  "Tax",
                  "Deductions",
                  "Net Pay",
                  "Payment",
                  "Status",
                  "Actions",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 8px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 9,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                        whiteSpace: "nowrap",
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              !filtered.length && llqaEmptyRow(teachers.length ? "No teacher matches this search or filter" : "No teachers on the payroll", teachers.length ? "Clear the search or pick another status or shift." : "Teachers added in HR \u2192 Teachers (with a salary) show here each month."), // v70
              filtered.map((t, i) =>
                React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        textAlign: "center",
                      },
                    },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: selected.includes(t.id),
                      onChange: (e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, t.id]
                            : selected.filter((x) => x !== t.id),
                        ),
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        fontWeight: 600,
                      },
                    },
                    t.name,
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 9,
                          color: c.textSec,
                        },
                      },
                      t.code,
                      " \xB7 ",
                      t.bank ? String(t.bank).split(" - ")[0] : "Unspecified",
                    ),
                    llqaPayRowNote(t), // v75: part of a month, an installment, fines changed since approval
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.shift,
                      color: (t.shift || "").includes("Morning")
                        ? "warn"
                        : (t.shift || "").includes("Evening")
                          ? "cyan"
                          : (t.shift || "").includes("Night")
                            ? "purple"
                            : "accent",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.text,
                        fontWeight: 600,
                      },
                    },
                    "Rs ",
                    t.pay.baseSalary.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.purple,
                        fontWeight: 600,
                      },
                    },
                    "+Rs ",
                    t.pay.bonuses.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.accent,
                        fontWeight: 700,
                      },
                    },
                    "Rs ",
                    t.pay.gross.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.danger,
                      },
                    },
                    "-Rs ",
                    Number(t.pay.fine || 0).toLocaleString("en-US"), // v72
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.warn,
                      },
                    },
                    "-Rs ",
                    Number(t.pay.advance || 0).toLocaleString("en-US"), // v72
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.textSec,
                      },
                    },
                    "-Rs ",
                    Number(t.pay.tax || 0).toLocaleString("en-US"), // v72
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.danger,
                        fontWeight: 600,
                      },
                    },
                    "-Rs ",
                    t.pay.deductions.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.success,
                        fontWeight: 700,
                        fontSize: 12,
                      },
                    },
                    "Rs ",
                    t.pay.net.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        color: c.textSec,
                        fontSize: 9,
                      },
                    },
                    t.pay.paymentMethod ||
                      (t.bank ? String(t.bank).split(" - ")[0] : "Unspecified"),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.pay.status,
                      color: statusColor(t.pay.status),
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 8px",
                        whiteSpace: "nowrap",
                      },
                    },
                    React.createElement(
                      "button",
                      {
                        onClick: () => openPayslip(t),
                        title: "View Payslip",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.accent,
                        },
                      },
                      React.createElement(Eye, {
                        size: 13,
                      }),
                    ),
                    t.pay.status === "pending" &&
                      React.createElement(
                        "button",
                        {
                          onClick: () => approvePayment(t.id),
                          title: "Approve",
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 3,
                            color: c.accent,
                          },
                        },
                        React.createElement(CheckCircle, {
                          size: 13,
                        }),
                      ),
                    t.pay.status === "approved" &&
                      React.createElement(
                        "button",
                        {
                          onClick: () => markAsPaid(t.id),
                          title: "Mark Paid",
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 3,
                            color: c.success,
                          },
                        },
                        React.createElement(DollarSign, {
                          size: 13,
                        }),
                      ),
                    t.pay.status === "approved" &&
                      React.createElement(
                        "button",
                        {
                          onClick: () => reopenPay(t.id),
                          title: "Back to pending",
                          style: { background: "none", border: "none", cursor: "pointer", padding: 3, color: t.pay.fineNow != null ? c.danger : c.textSec },
                        },
                        React.createElement(llqaIcon("undo-2"), { size: 13 }),
                      ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => openAdvance(t),
                        title: "Give Advance",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.warn,
                        },
                      },
                      React.createElement(Plus, {
                        size: 13,
                      }),
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => openRevision(t),
                        title: "Revise Salary",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.purple,
                        },
                      },
                      React.createElement(Edit2, {
                        size: 13,
                      }),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    tab === "history" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              marginBottom: 10,
              color: c.textSec,
              fontSize: 11,
            },
          },
          "Complete payment history across all months",
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Month",
                  "Teacher",
                  "Base",
                  "Bonuses",
                  "Deductions",
                  "Net",
                  "Status",
                  "Method",
                  "Paid Date",
                  "Approved By",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 8px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 9,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              llqaEmptyRow("No salary payments recorded yet", "Salaries marked as paid show here, month by month."), // v70: shows only when the table is empty
              teachers
                .flatMap((t) =>
                  (payHistory[t.id] || []).map((r) => ({
                    ...r,
                    teacherName: t.name,
                    code: t.code,
                  })),
                )
                .sort(
                  (a, b) =>
                    b.month.localeCompare(a.month) ||
                    a.teacherName.localeCompare(b.teacherName),
                )
                .slice(0, 100)
                .map((r, i) =>
                  React.createElement(
                    "tr",
                    {
                      key: i,
                      style: {
                        borderBottom: "1px solid " + c.border,
                        background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                      },
                    },
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.accent,
                          fontSize: 10,
                          fontWeight: 600,
                        },
                      },
                      r.month,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          fontWeight: 600,
                          fontSize: 10,
                        },
                      },
                      r.teacherName,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.text,
                        },
                      },
                      "Rs ",
                      r.baseSalary.toLocaleString(),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.purple,
                          fontWeight: 600,
                        },
                      },
                      "+Rs ",
                      r.bonuses.toLocaleString(),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.danger,
                        },
                      },
                      "-Rs ",
                      r.deductions.toLocaleString(),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.success,
                          fontWeight: 700,
                        },
                      },
                      "Rs ",
                      r.net.toLocaleString(),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                        },
                      },
                      React.createElement(Badge, {
                        text: r.status,
                        color: statusColor(r.status),
                      }),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.textSec,
                          fontSize: 10,
                        },
                      },
                      r.paymentMethod || "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.textMuted,
                          fontFamily: "monospace",
                          fontSize: 9,
                        },
                      },
                      r.paidDate || "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.textSec,
                          fontSize: 10,
                        },
                      },
                      r.approvedBy ? r.approvedBy + (r.approvedAt ? " · " + llqaLocalDay(String(r.approvedAt).slice(0, 10)).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "") : "—", // v71: and when
                    ),
                  ),
                ),
            ),
          ),
        ),
      ),
    tab === "bonuses" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
            },
          },
          React.createElement(
            "h4",
            {
              style: {
                color: c.text,
                margin: "0 0 10px",
                fontSize: 13,
                fontWeight: 600,
              },
            },
            "Bonus Structure",
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 8,
              },
            },
            [
              ["Tenure 3+ years", "Rs 3,000", c.success],
              ["Tenure 2 years", "Rs 2,000", c.success],
              ["Tenure 1 year", "Rs 1,000", c.success],
              ["Rating 4.5+", "Rs 3,000", c.purple],
              ["Rating 4.2-4.4", "Rs 2,000", c.purple],
              ["Rating 4.0-4.1", "Rs 1,000", c.purple],
              ["12+ Students", "Rs 2,000", c.accent],
              ["8+ Students", "Rs 1,000", c.accent],
            ].map(([l, v, col]) =>
              React.createElement(
                "div",
                {
                  key: l,
                  style: {
                    background: c.bgDeep,
                    border: "1px solid " + llqaAlpha(col, "44"),
                    borderRadius: 6,
                    padding: "8px 10px",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 9,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    },
                  },
                  l,
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: col,
                      fontSize: 13,
                      fontWeight: 700,
                    },
                  },
                  v,
                ),
              ),
            ),
          ),
        ),
        React.createElement(
          "h4",
          {
            style: {
              color: c.text,
              fontSize: 13,
              margin: "0 0 10px",
              fontWeight: 600,
            },
          },
          "Bonus Breakdown by Teacher (",
          selectedMonth,
          ")",
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Tenure",
                  "Years",
                  "Tenure Bonus",
                  "Rating",
                  "Perf Bonus",
                  "Students",
                  "Student Bonus",
                  "Total Bonus",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 8px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 9,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              llqaEmptyRow("No teachers yet", "Tenure and performance bonuses for each teacher show here."), // v70: shows only when the table is empty
              teachers.filter((t) => !llqaTeacherGone(t)).map((t, i) => {
                const b = llqaPayBonusNow(t, selectedMonth); // v75: HR's rating, the students booked, tenure at the month's end
                const yrs = tenureYears(t.joinDate);
                return React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        fontWeight: 600,
                      },
                    },
                    t.name,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.textSec,
                        fontSize: 10,
                      },
                    },
                    t.joinDate,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.success,
                        fontWeight: 600,
                      },
                    },
                    yrs,
                    "y",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: b.tenure > 0 ? c.success : c.textMuted,
                        fontWeight: 600,
                      },
                    },
                    b.tenure > 0 ? "Rs " + b.tenure : "—",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    React.createElement(
                      "span",
                      {
                        style: {
                          color:
                            t.rating >= 4.5
                              ? c.success
                              : t.rating >= 4.0
                                ? c.accent
                                : c.warn,
                          fontWeight: 600,
                        },
                      },
                      t.rating,
                      "\u2605",
                    ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: b.performance > 0 ? c.purple : c.textMuted,
                        fontWeight: 600,
                      },
                    },
                    b.performance > 0 ? "Rs " + b.performance : "—",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.accent,
                        fontWeight: 600,
                      },
                    },
                    b.count, // v75: booked in the Timetable now
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: b.students > 0 ? c.accent : c.textMuted,
                        fontWeight: 600,
                      },
                    },
                    b.students > 0 ? "Rs " + b.students : "—",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.success,
                        fontWeight: 700,
                        fontSize: 12,
                      },
                    },
                    "Rs ",
                    b.total.toLocaleString(),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    tab === "advances" &&
      React.createElement(LLQAPayLoans, { teachers, payHistory, setPayHistory, onNew: (t) => openAdvance(t || null) }), // v75: each advance with its installments
    tab === "analytics" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 14,
              marginBottom: 14,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Payroll Trend (Last 6 Months)",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 220,
              },
              React.createElement(
                AreaChart,
                {
                  data: trendData,
                },
                React.createElement(CartesianGrid, {
                  strokeDasharray: "3 3",
                  stroke: c.border,
                }),
                React.createElement(XAxis, {
                  dataKey: "month",
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(YAxis, {
                  stroke: c.textMuted,
                  fontSize: 10,
                  tickFormatter: (v) => v / 1000 + "K",
                }),
                React.createElement(Tooltip, {
                  contentStyle: {
                    background: c.bgCard,
                    backdropFilter: "blur(16px)",
                    boxShadow: c.shadow3d,
                    border: "1px solid " + c.border,
                    borderRadius: 8,
                    fontSize: 11,
                    color: c.text,
                  },
                  formatter: (v) => "Rs " + v.toLocaleString(),
                }),
                React.createElement(Area, {
                  type: "monotone",
                  dataKey: "gross",
                  stroke: c.accent,
                  fill: c.accentBg,
                  strokeWidth: 2,
                  name: "Gross",
                }),
                React.createElement(Area, {
                  type: "monotone",
                  dataKey: "net",
                  stroke: c.success,
                  fill: c.successBg,
                  strokeWidth: 2,
                  name: "Net",
                }),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Payment Methods",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 220,
              },
              React.createElement(
                PieChart,
                null,
                React.createElement(
                  Pie,
                  {
                    data: methodDist,
                    cx: "50%",
                    cy: "50%",
                    outerRadius: 70,
                    innerRadius: 38,
                    dataKey: "value",
                    label: ({ name, percent }) =>
                      name + " " + (percent * 100).toFixed(0) + "%",
                    fontSize: 9,
                  },
                  methodDist.map((_, i) =>
                    React.createElement(Cell, {
                      key: i,
                      fill: CC[i % CC.length],
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Bonuses vs Fines (6 months)",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 200,
              },
              React.createElement(
                BarChart,
                {
                  data: trendData,
                },
                React.createElement(CartesianGrid, {
                  strokeDasharray: "3 3",
                  stroke: c.border,
                }),
                React.createElement(XAxis, {
                  dataKey: "month",
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(YAxis, {
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(Tooltip, {
                  contentStyle: {
                    background: c.bgCard,
                    backdropFilter: "blur(16px)",
                    boxShadow: c.shadow3d,
                    border: "1px solid " + c.border,
                    borderRadius: 8,
                    fontSize: 11,
                    color: c.text,
                  },
                }),
                React.createElement(Bar, {
                  dataKey: "bonuses",
                  fill: c.purple,
                  name: "Bonuses",
                  radius: [4, 4, 0, 0],
                }),
                React.createElement(Bar, {
                  dataKey: "fines",
                  fill: c.danger,
                  name: "Fines",
                  radius: [4, 4, 0, 0],
                }),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Top Earners (This Month)",
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                },
              },
              [...currentRecs]
                .filter((t) => t.pay)
                .sort((a, b) => b.pay.net - a.pay.net)
                .slice(0, 8)
                .map((t, i) =>
                  React.createElement(
                    "div",
                    {
                      key: t.id,
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: c.bgDeep,
                        borderRadius: 6,
                        padding: "6px 10px",
                      },
                    },
                    React.createElement(
                      "span",
                      {
                        style: {
                          color: c.textMuted,
                          fontSize: 10,
                          fontWeight: 700,
                          width: 18,
                        },
                      },
                      "#",
                      i + 1,
                    ),
                    React.createElement(
                      "span",
                      {
                        style: {
                          color: c.text,
                          fontSize: 11,
                          flex: 1,
                        },
                      },
                      t.name,
                    ),
                    React.createElement(
                      "span",
                      {
                        style: {
                          color: c.success,
                          fontSize: 12,
                          fontWeight: 700,
                        },
                      },
                      "Rs ",
                      t.pay.net.toLocaleString(),
                    ),
                  ),
                ),
            ),
          ),
        ),
      ),
    tab === "ytd" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              marginBottom: 10,
              color: c.textSec,
              fontSize: 11,
            },
          },
          "Year-to-date earnings, bonuses, taxes, and fines per teacher",
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Months Paid",
                  "Total Earned",
                  "Total Bonuses",
                  "Total Fines",
                  "Total Tax",
                  "Avg Per Month",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 8px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 9,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              llqaEmptyRow("No teachers yet", "Each teacher\u2019s pay for the year so far shows here."), // v70: shows only when the table is empty
              teachers.map((t, i) => {
                const y = ytd[t.id];
                return React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        fontWeight: 600,
                      },
                    },
                    t.name,
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 9,
                          color: c.textSec,
                        },
                      },
                      t.code,
                    ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.textSec,
                      },
                    },
                    y.months,
                    " months",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.success,
                        fontWeight: 700,
                      },
                    },
                    "Rs ",
                    y.totalEarned.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.purple,
                        fontWeight: 600,
                      },
                    },
                    "+Rs ",
                    y.totalBonuses.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.danger,
                        fontWeight: 600,
                      },
                    },
                    "-Rs ",
                    y.totalFines.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.warn,
                        fontWeight: 600,
                      },
                    },
                    "-Rs ",
                    y.totalTax.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.accent,
                        fontWeight: 600,
                      },
                    },
                    "Rs ",
                    y.months > 0
                      ? Math.round(y.totalEarned / y.months).toLocaleString()
                      : "0",
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "payslip" &&
      React.createElement(PayslipModal, {
        appSettings: appSettings,
        t: modal.data,
        onClose: () => setModal(null),
        selectedMonth: selectedMonth,
      }),
    modal &&
      modal.type === "advance" &&
      React.createElement(LLQAPayAdvanceWin, {
        teachers,
        t: modal.data,
        onClose: () => setModal(null),
        onSave: (loan) => {
          // v75: an advance is kept with its installments and taken back from the pay by itself
          setPayHistory((prev) => ({ ...(prev || {}), _loans: [...(Array.isArray((prev || {})._loans) ? prev._loans : []), loan] }));
          setModal(null);
        },
      }),
    modal &&
      modal.type === "revision" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
            backdropFilter: "blur(4px)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 440,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              },
            },
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 16,
                  margin: 0,
                },
              },
              "Revise Salary",
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(X, {
                size: 18,
              }),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.purpleBg,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                color: c.purple,
                fontSize: 11,
              },
            },
            "Teacher: ",
            modal.data.name,
            " \xB7 Current Rs ",
            modal.data.salary.toLocaleString(),
          ),
          React.createElement(Inp, {
            label: "New Salary (PKR) *",
            value: payForm.newSalary || "",
            onChange: (v) =>
              setPayForm({
                ...payForm,
                newSalary: v,
              }),
            type: "number",
          }),
          React.createElement(Inp, {
            label: "Effective From",
            value: payForm.effective || "",
            onChange: (v) =>
              setPayForm({
                ...payForm,
                effective: v,
              }),
            type: "date",
          }),
          React.createElement(Inp, {
            label: "Reason *",
            value: payForm.reason || "",
            onChange: (v) =>
              setPayForm({
                ...payForm,
                reason: v,
              }),
            placeholder: "Annual increment / Promotion / Performance...",
          }),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgDeep,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 10,
                fontSize: 10,
                color: c.textSec,
              },
            },
            "Change: ",
            React.createElement(
              "span",
              {
                style: {
                  color:
                    Number(payForm.newSalary) > modal.data.salary
                      ? c.success
                      : c.danger,
                  fontWeight: 700,
                },
              },
              Number(payForm.newSalary) > modal.data.salary ? "+" : "",
              "Rs ",
              (Number(payForm.newSalary) - modal.data.salary).toLocaleString(),
            ),
            " (",
            Math.round(
              ((Number(payForm.newSalary) - modal.data.salary) /
                (modal.data.salary || Number(payForm.newSalary) || 1)) *
                100,
            ),
            "%)",
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                onClick: () => {
                  const err = llqaSalaryRevise(modal.data, payForm); // v75: kept on the teacher, from its day (it did nothing)
                  if (err) return alert(err);
                  setModal(null);
                },
                icon: Award,
              },
              "Approve Revision",
            ),
          ),
        ),
      ),
  );
};
