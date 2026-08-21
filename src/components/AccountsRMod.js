const AccountsRMod = ({
  students,
  arPayments,
  setArPayments
}) => {
  const [tab, setTab] = useState("paying");
  const [month, setMonth] = useState(todayPK().slice(0, 7));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const GATEWAYS = ["Bank Transfer", "Credit/Debit Card", "PayPal", "Stripe", "Wise", "Zelle", "Cash", "Western Union", "Other"];
  const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AED", "PKR"];
  const pays = arPayments || [];
  const roster = (students || []).filter(s => s.status !== "quit");
  const monthPays = pays.filter(p => String(p.paidDate || "").slice(0, 7) === month);
  const num = n => Number(n || 0);
  const fmt = n => num(n).toLocaleString(void 0, {
    maximumFractionDigits: 2
  });
  const monthLabel = (() => {
    const d = new Date(month + "-01T00:00:00");
    return isNaN(d) ? month : d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  })();
  const expected = s => num(s.fee_amount);
  const paidByStudent = sid => monthPays.filter(p => String(p.studentId) === String(sid)).reduce((a, p) => a + num(p.amount), 0);
  const oPost = () => {
    setForm({
      studentId: "",
      studentName: "",
      parent: "",
      course: "",
      amount: "",
      currency: "USD",
      paidDate: todayPK(),
      gateway: "Bank Transfer",
      receipt: "",
      type: "regular",
      notes: ""
    });
    setModal({
      type: "post"
    });
  };
  const oEdit = p => {
    setForm({
      ...p
    });
    setModal({
      type: "edit",
      data: p
    });
  };
  const onPickStudent = sid => {
    const s = roster.find(x => String(x.id) === String(sid));
    if (!s) {
      setForm({
        ...form,
        studentId: sid
      });
      return;
    }
    setForm({
      ...form,
      studentId: sid,
      studentName: s.name,
      parent: s.parent || "",
      course: s.course || "",
      currency: s.currency || form.currency || "USD",
      amount: form.amount || (expected(s) ? String(expected(s)) : "")
    });
  };
  const savePay = () => {
    if (!form.studentId) {
      alert("Please select a student.");
      return;
    }
    if (!form.amount || num(form.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const rec = {
      ...form,
      amount: num(form.amount)
    };
    if (modal.type === "edit") setArPayments(pays.map(p => p.id === form.id ? rec : p));else setArPayments([...pays, {
      ...rec,
      id: Date.now()
    }]);
    setModal(null);
  };
  const oDel = p => setModal({
    type: "del",
    data: p
  });
  const doDel = () => {
    setArPayments(pays.filter(p => p.id !== modal.data.id));
    setModal(null);
  };
  const feeRows = roster.filter(s => s.status === "active").map(s => {
    const exp = expected(s);
    const paid = paidByStudent(s.id);
    return {
      s,
      exp,
      paid,
      bal: Math.max(0, exp - paid),
      cur: s.currency || "USD",
      st: exp > 0 && paid >= exp ? "Paid" : paid > 0 ? "Partial" : "Unpaid"
    };
  });
  const defaulters = feeRows.filter(r => r.st !== "Paid");
  const recoveryPays = monthPays.filter(p => p.type === "recovery");
  const totalCollected = monthPays.reduce((a, p) => a + num(p.amount), 0);
  const expectedTotal = feeRows.reduce((a, r) => a + r.exp, 0);
  const outstanding = feeRows.reduce((a, r) => a + r.bal, 0);
  const collRate = expectedTotal > 0 ? Math.round(Math.min(totalCollected, expectedTotal) / expectedTotal * 100) : 0;
  const gatewayTally = (() => {
    const t = {};
    monthPays.forEach(p => {
      t[p.gateway || "Other"] = (t[p.gateway || "Other"] || 0) + num(p.amount);
    });
    const top = Object.keys(t).sort((a, b) => t[b] - t[a])[0];
    return {
      t,
      top: top || "\u2014"
    };
  })();
  const dayRows = (() => {
    const g = {};
    monthPays.forEach(p => {
      const d = p.paidDate || "\u2014";
      if (!g[d]) g[d] = {
        date: d,
        n: 0,
        sum: 0
      };
      g[d].n++;
      g[d].sum += num(p.amount);
    });
    return Object.values(g).sort((a, b) => a.date < b.date ? 1 : -1);
  })();
  const bestDay = dayRows.reduce((m, d) => d.sum > (m ? m.sum : -1) ? d : m, null);
  const matchS = vals => {
    if (!search) return true;
    const q = search.toLowerCase();
    return vals.some(v => String(v || "").toLowerCase().includes(q));
  };
  const thS = {
    padding: "9px 10px",
    textAlign: "left",
    color: c.textSec,
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    borderBottom: "1px solid " + c.border,
    background: c.bgDeep,
    whiteSpace: "nowrap"
  };
  const tdS = {
    padding: "8px 10px",
    color: c.textSec
  };
  const Table = (rows, cols, empty) => React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: 10,
      border: "1px solid " + c.border
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 11
    }
  }, React.createElement("thead", null, React.createElement("tr", null, cols.map((col, ci) => React.createElement("th", {
    key: ci,
    style: thS
  }, col.h)))), React.createElement("tbody", null, rows.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: cols.length,
    style: {
      padding: 32,
      textAlign: "center",
      color: c.textMuted,
      fontSize: 12
    }
  }, empty)) : rows.map((r, ri) => React.createElement("tr", {
    key: ri,
    style: {
      borderBottom: "1px solid " + c.border,
      background: ri % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, cols.map((col, ci) => React.createElement("td", {
    key: ci,
    style: {
      ...tdS,
      ...(col.tdStyle || {})
    }
  }, col.render(r))))))));
  const money = (n, cur) => React.createElement("span", {
    style: {
      fontWeight: 600,
      color: c.text
    }
  }, fmt(n), " ", React.createElement("span", {
    style: {
      fontSize: 9,
      color: c.textMuted
    }
  }, cur || "USD"));
  const nameCell = (name, sub) => React.createElement("div", null, React.createElement("div", {
    style: {
      fontWeight: 600,
      color: c.text
    }
  }, name || "\u2014"), sub && React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textMuted
    }
  }, sub));
  const stStatusColor = {
    Paid: "success",
    Partial: "warn",
    Unpaid: "danger"
  };
  const tabs = [["paying", "Monthly Paying Students"], ["feerec", "Monthly Fee Record"], ["recovery", "Monthly Recovery Record"], ["daily", "Daily Recovery Sheet"], ["posting", "Payment Posting Sheet"], ["defaulter", "Monthly Defaulter List"]];
  const exportCSV = () => {
    let cols, rows, name;
    if (tab === "paying") {
      cols = ["Student", "Parent", "Course", "Amount", "Currency", "Paid Date", "Gateway", "Receipt"];
      rows = monthPays.filter(p => matchS([p.studentName, p.parent, p.course, p.gateway, p.receipt])).map(p => [p.studentName, p.parent, p.course, num(p.amount), p.currency, p.paidDate, p.gateway, p.receipt]);
      name = "Monthly-Paying-" + month;
    } else if (tab === "feerec") {
      cols = ["Student", "Parent", "Course", "Expected", "Paid", "Balance", "Currency", "Status"];
      rows = feeRows.filter(r => matchS([r.s.name, r.s.parent, r.s.course])).map(r => [r.s.name, r.s.parent, r.s.course, r.exp, r.paid, r.bal, r.cur, r.st]);
      name = "Monthly-Fee-Record-" + month;
    } else if (tab === "recovery") {
      cols = ["Student", "Parent", "Amount", "Currency", "Paid Date", "Gateway", "Receipt", "Notes"];
      rows = recoveryPays.filter(p => matchS([p.studentName, p.parent, p.gateway])).map(p => [p.studentName, p.parent, num(p.amount), p.currency, p.paidDate, p.gateway, p.receipt, p.notes]);
      name = "Monthly-Recovery-" + month;
    } else if (tab === "daily") {
      cols = ["Date", "Transactions", "Total Collected"];
      rows = dayRows.map(d => [d.date, d.n, d.sum]);
      name = "Daily-Recovery-" + month;
    } else if (tab === "defaulter") {
      cols = ["Student", "Parent", "Course", "Expected", "Paid", "Balance", "Currency", "Phone"];
      rows = defaulters.filter(r => matchS([r.s.name, r.s.parent, r.s.course])).map(r => [r.s.name, r.s.parent, r.s.course, r.exp, r.paid, r.bal, r.cur, r.s.phone]);
      name = "Monthly-Defaulters-" + month;
    } else {
      cols = ["Student", "Parent", "Course", "Amount", "Currency", "Paid Date", "Gateway", "Receipt", "Type"];
      rows = pays.filter(p => matchS([p.studentName, p.parent, p.course, p.gateway, p.receipt])).map(p => [p.studentName, p.parent, p.course, num(p.amount), p.currency, p.paidDate, p.gateway, p.receipt, p.type]);
      name = "Payment-Posting-" + month;
    }
    const safe = v => '"' + String(v == null ? "" : v).split('"').join('""') + '"';
    let csv = cols.join(",") + "\n";
    rows.forEach(r => {
      csv += r.map(safe).join(",") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  let content;
  if (tab === "paying") {
    const rows = monthPays.filter(p => matchS([p.studentName, p.parent, p.course, p.gateway, p.receipt]));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: DollarSign,
      label: "Collected (" + monthLabel + ")",
      value: fmt(totalCollected),
      color: c.success
    }), React.createElement(SC, {
      icon: Users,
      label: "Paying Students",
      value: new Set(monthPays.map(p => String(p.studentId))).size,
      color: c.accent
    }), React.createElement(SC, {
      icon: Receipt,
      label: "Transactions",
      value: monthPays.length,
      color: c.cyan
    }), React.createElement(SC, {
      icon: CreditCard,
      label: "Top Gateway",
      value: gatewayTally.top,
      color: c.purple
    })), Table(rows, [{
      h: "Student",
      render: p => nameCell(p.studentName, p.parent)
    }, {
      h: "Course",
      render: p => React.createElement("span", {
        style: {
          color: c.cyan
        }
      }, p.course || "\u2014")
    }, {
      h: "Amount",
      render: p => money(p.amount, p.currency)
    }, {
      h: "Paid Date",
      render: p => p.paidDate || "\u2014"
    }, {
      h: "Gateway",
      render: p => React.createElement(Badge, {
        text: p.gateway || "\u2014",
        color: "accent"
      })
    }, {
      h: "Receipt #",
      render: p => React.createElement("span", {
        style: {
          fontFamily: "monospace",
          color: c.text
        }
      }, p.receipt || "\u2014")
    }], "No payments recorded for " + monthLabel + ". Post payments from the Payment Posting Sheet tab."));
  } else if (tab === "feerec") {
    const rows = feeRows.filter(r => matchS([r.s.name, r.s.parent, r.s.course]));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: TrendingUp,
      label: "Expected (" + monthLabel + ")",
      value: fmt(expectedTotal),
      color: c.accent
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Collected",
      value: fmt(totalCollected),
      color: c.success
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Outstanding",
      value: fmt(outstanding),
      color: c.danger
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Collection Rate",
      value: collRate + "%",
      color: collRate >= 80 ? c.success : collRate >= 50 ? c.warn : c.danger
    })), Table(rows, [{
      h: "Student",
      render: r => nameCell(r.s.name, r.s.parent)
    }, {
      h: "Course",
      render: r => React.createElement("span", {
        style: {
          color: c.cyan
        }
      }, r.s.course || "\u2014")
    }, {
      h: "Expected",
      render: r => r.exp > 0 ? money(r.exp, r.cur) : React.createElement("span", {
        style: {
          color: c.textMuted,
          fontSize: 10
        }
      }, "not set")
    }, {
      h: "Paid",
      render: r => money(r.paid, r.cur)
    }, {
      h: "Balance",
      render: r => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: r.bal > 0 ? c.danger : c.success
        }
      }, fmt(r.bal), " ", React.createElement("span", {
        style: {
          fontSize: 9,
          color: c.textMuted
        }
      }, r.cur))
    }, {
      h: "Status",
      render: r => React.createElement(Badge, {
        text: r.st,
        color: stStatusColor[r.st]
      })
    }], "No active students to reconcile."));
  } else if (tab === "recovery") {
    const rows = recoveryPays.filter(p => matchS([p.studentName, p.parent, p.gateway]));
    const recTotal = recoveryPays.reduce((a, p) => a + num(p.amount), 0);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: TrendingUp,
      label: "Recovered (" + monthLabel + ")",
      value: fmt(recTotal),
      color: c.success
    }), React.createElement(SC, {
      icon: Receipt,
      label: "Recovery Payments",
      value: recoveryPays.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Users,
      label: "Students Recovered",
      value: new Set(recoveryPays.map(p => String(p.studentId))).size,
      color: c.cyan
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: c.successBg,
        border: "1px solid " + c.success + "33",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        color: c.textSec
      }
    }, React.createElement(TrendingUp, {
      size: 14,
      color: c.success
    }), React.createElement("span", null, "Recovery payments are collections against past dues. When posting a payment, tick ", React.createElement("strong", {
      style: {
        color: c.success
      }
    }, "Recovery payment"), " to record it here.")), Table(rows, [{
      h: "Student",
      render: p => nameCell(p.studentName, p.parent)
    }, {
      h: "Amount",
      render: p => money(p.amount, p.currency)
    }, {
      h: "Paid Date",
      render: p => p.paidDate || "\u2014"
    }, {
      h: "Gateway",
      render: p => React.createElement(Badge, {
        text: p.gateway || "\u2014",
        color: "accent"
      })
    }, {
      h: "Receipt #",
      render: p => React.createElement("span", {
        style: {
          fontFamily: "monospace",
          color: c.text
        }
      }, p.receipt || "\u2014")
    }, {
      h: "Notes",
      render: p => p.notes || "\u2014"
    }], "No recovery payments for " + monthLabel + "."));
  } else if (tab === "daily") {
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Calendar,
      label: "Active Days",
      value: dayRows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Month Total",
      value: fmt(totalCollected),
      color: c.success
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Best Day",
      value: bestDay ? fmt(bestDay.sum) : "\u2014",
      sub: bestDay ? bestDay.date : "",
      color: c.purple
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Daily Avg",
      value: dayRows.length ? fmt(totalCollected / dayRows.length) : "0",
      color: c.cyan
    })), Table(dayRows, [{
      h: "Date",
      render: d => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, d.date)
    }, {
      h: "Transactions",
      render: d => d.n
    }, {
      h: "Total Collected",
      render: d => money(d.sum, "")
    }, {
      h: "Share",
      render: d => React.createElement("div", {
        style: {
          width: 120,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (totalCollected ? Math.round(d.sum / totalCollected * 100) : 0) + "%",
          height: "100%",
          background: c.success
        }
      }))
    }], "No collections recorded for " + monthLabel + "."));
  } else if (tab === "defaulter") {
    const rows = defaulters.filter(r => matchS([r.s.name, r.s.parent, r.s.course]));
    const defOut = defaulters.reduce((a, r) => a + r.bal, 0);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: AlertTriangle,
      label: "Defaulters (" + monthLabel + ")",
      value: defaulters.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Outstanding",
      value: fmt(defOut),
      color: c.warn
    }), React.createElement(SC, {
      icon: Users,
      label: "Active Students",
      value: roster.filter(s => s.status === "active").length,
      color: c.accent
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Avg Outstanding",
      value: defaulters.length ? fmt(defOut / defaulters.length) : "0",
      color: c.cyan
    })), Table(rows, [{
      h: "Student",
      render: r => nameCell(r.s.name, r.s.parent)
    }, {
      h: "Course",
      render: r => React.createElement("span", {
        style: {
          color: c.cyan
        }
      }, r.s.course || "\u2014")
    }, {
      h: "Expected",
      render: r => r.exp > 0 ? money(r.exp, r.cur) : React.createElement("span", {
        style: {
          color: c.textMuted,
          fontSize: 10
        }
      }, "not set")
    }, {
      h: "Paid",
      render: r => money(r.paid, r.cur)
    }, {
      h: "Balance Due",
      render: r => React.createElement("span", {
        style: {
          fontWeight: 700,
          color: c.danger
        }
      }, fmt(r.bal), " ", React.createElement("span", {
        style: {
          fontSize: 9,
          color: c.textMuted
        }
      }, r.cur))
    }, {
      h: "Status",
      render: r => React.createElement(Badge, {
        text: r.st,
        color: stStatusColor[r.st]
      })
    }, {
      h: "Contact",
      render: r => React.createElement("span", {
        style: {
          fontFamily: "monospace",
          fontSize: 10
        }
      }, r.s.phone || "\u2014")
    }], "No defaulters \u2014 everyone with a set fee has paid for " + monthLabel + ". \u{1F389}"));
  } else {
    const rows = pays.filter(p => matchS([p.studentName, p.parent, p.course, p.gateway, p.receipt])).sort((a, b) => String(a.paidDate) < String(b.paidDate) ? 1 : -1);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Receipt,
      label: "Total Posted",
      value: pays.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Calendar,
      label: "This Month",
      value: monthPays.length,
      color: c.cyan
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Month Value",
      value: fmt(totalCollected),
      color: c.success
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: c.accentBg,
        border: "1px solid " + c.accent + "33",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        color: c.textSec
      }
    }, React.createElement(Receipt, {
      size: 14,
      color: c.accent
    }), React.createElement("span", null, React.createElement("strong", {
      style: {
        color: c.accent
      }
    }, "Posting hub: "), "record every fee payment here. Posted payments flow into Monthly Paying Students, Fee Record, Recovery, Daily Sheet and clear students off the Defaulter List automatically.")), Table(rows, [{
      h: "Student",
      render: p => nameCell(p.studentName, p.parent)
    }, {
      h: "Amount",
      render: p => money(p.amount, p.currency)
    }, {
      h: "Paid Date",
      render: p => p.paidDate || "\u2014"
    }, {
      h: "Gateway",
      render: p => React.createElement(Badge, {
        text: p.gateway || "\u2014",
        color: "accent"
      })
    }, {
      h: "Receipt #",
      render: p => React.createElement("span", {
        style: {
          fontFamily: "monospace",
          color: c.text
        }
      }, p.receipt || "\u2014")
    }, {
      h: "Type",
      render: p => React.createElement(Badge, {
        text: p.type === "recovery" ? "Recovery" : "Regular",
        color: p.type === "recovery" ? "purple" : "cyan"
      })
    }, {
      h: "",
      tdStyle: {
        whiteSpace: "nowrap"
      },
      render: p => React.createElement("span", null, React.createElement("button", {
        onClick: () => oEdit(p),
        title: "Edit",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.warn
        }
      }, React.createElement(Edit2, {
        size: 14
      })), React.createElement("button", {
        onClick: () => oDel(p),
        title: "Delete",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.danger
        }
      }, React.createElement(Trash2, {
        size: 14
      })))
    }], "No payments posted yet. Click \u201CPost Payment\u201D to record the first one."));
  }
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: c.success + "22",
      border: "1px solid " + c.success + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(TrendingUp, {
    size: 24,
    color: c.success
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 200
    }
  }, React.createElement("h1", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 22,
      fontWeight: 700
    }
  }, "Accounts Receivable"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Fee collection, reconciliation, recovery & defaulters")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("input", {
    type: "month",
    value: month,
    onChange: e => setMonth(e.target.value),
    style: {
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12,
      colorScheme: "dark"
    }
  }), React.createElement(Btn, {
    icon: Receipt,
    onClick: oPost
  }, "Post Payment"), React.createElement(Btn, {
    variant: "outline",
    icon: Download,
    onClick: exportCSV
  }, "Export"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
      flexWrap: "wrap"
    }
  }, tabs.map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      padding: "8px 14px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 600,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 14,
      maxWidth: 420
    }
  }, React.createElement(Search, {
    size: 14,
    style: {
      position: "absolute",
      left: 10,
      top: 9,
      color: c.textMuted
    }
  }), React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search student, parent, course, gateway, receipt...",
    style: {
      width: "100%",
      padding: "8px 12px 8px 30px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  })), content, modal && (modal.type === "post" || modal.type === "edit") && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)",
      padding: 20,
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 540,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement(Receipt, {
    size: 18,
    color: c.success
  }), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, modal.type === "edit" ? "Edit Payment" : "Post Payment")), React.createElement("button", {
    onClick: () => setModal(null),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("label", {
    style: {
      display: "block",
      color: c.textSec,
      fontSize: 10,
      marginBottom: 4,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Student *"), React.createElement("select", {
    value: form.studentId || "",
    onChange: e => onPickStudent(e.target.value),
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", {
    value: ""
  }, "-- Select student --"), roster.map(s => React.createElement("option", {
    key: s.id,
    value: s.id
  }, s.name + (s.parent ? " (" + s.parent + ")" : "")))), form.studentId && form.course && React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textMuted,
      marginTop: 4
    }
  }, "Course: " + form.course + (expected(roster.find(x => String(x.id) === String(form.studentId)) || {}) ? " \xB7 Expected fee: " + fmt(expected(roster.find(x => String(x.id) === String(form.studentId)) || {})) + " " + (form.currency || "USD") : ""))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Amount *",
    value: form.amount || "",
    onChange: v => setForm({
      ...form,
      amount: v
    }),
    type: "number",
    placeholder: "0.00"
  }), React.createElement(Inp, {
    label: "Currency",
    value: form.currency || "USD",
    onChange: v => setForm({
      ...form,
      currency: v
    }),
    options: CURRENCIES
  }), React.createElement(Inp, {
    label: "Paid Date",
    value: form.paidDate || "",
    onChange: v => setForm({
      ...form,
      paidDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Gateway",
    value: form.gateway || "Bank Transfer",
    onChange: v => setForm({
      ...form,
      gateway: v
    }),
    options: GATEWAYS
  }), React.createElement(Inp, {
    label: "Receipt #",
    value: form.receipt || "",
    onChange: v => setForm({
      ...form,
      receipt: v
    }),
    placeholder: "Transaction / receipt no."
  })), React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "6px 0 10px",
      cursor: "pointer",
      color: c.textSec,
      fontSize: 12
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: form.type === "recovery",
    onChange: e => setForm({
      ...form,
      type: e.target.checked ? "recovery" : "regular"
    })
  }), "Recovery payment (collection against a past due)"), React.createElement(Inp, {
    label: "Notes",
    value: form.notes || "",
    onChange: v => setForm({
      ...form,
      notes: v
    }),
    placeholder: "Optional notes"
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: savePay
  }, modal.type === "edit" ? "Save Changes" : "Post Payment")))), modal && modal.type === "del" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 400,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: c.dangerBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 12px"
    }
  }, React.createElement(Trash2, {
    size: 22,
    color: c.danger
  })), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: "0 0 6px"
    }
  }, "Delete this payment?"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 16px",
      lineHeight: 1.5
    }
  }, "Remove the ", fmt(modal.data.amount), " ", modal.data.currency || "USD", " payment from ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.data.studentName), "? This cannot be undone."), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 10
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    variant: "danger",
    icon: Trash2,
    onClick: doDel
  }, "Delete")))));
};

