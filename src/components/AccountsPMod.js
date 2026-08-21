const AccountsPMod = ({
  apLiabilities,
  setApLiabilities
}) => {
  const [tab, setTab] = useState("ledger");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const CATEGORIES = ["Salaries", "Rent", "Utilities", "Software/SaaS", "Marketing", "Equipment", "Internet/Telecom", "Bank/Fees", "Taxes", "Vendor Services", "Other"];
  const CURRENCIES = ["PKR", "USD", "CAD", "GBP", "EUR", "AED"];
  const STATUSES = ["unpaid", "partial", "paid"];
  const today = todayPK();
  const liabs = apLiabilities || [];
  const num = n => Number(n || 0);
  const fmt = n => num(n).toLocaleString(void 0, {
    maximumFractionDigits: 2
  });
  const isOverdue = l => l.status !== "paid" && l.dueDate && String(l.dueDate) < today;
  const paidOf = l => l.status === "paid" ? num(l.amount) : l.status === "partial" ? num(l.paidAmount) : 0;
  const owedOf = l => Math.max(0, num(l.amount) - paidOf(l));
  const daysDiff = d => {
    if (!d) return null;
    const a = new Date(d + "T00:00:00"),
      b = new Date(today + "T00:00:00");
    return Math.round((a - b) / 864e5);
  };
  const oAdd = () => {
    setForm({
      vendor: "",
      category: "Vendor Services",
      amount: "",
      currency: "PKR",
      paidAmount: "",
      status: "unpaid",
      dueDate: "",
      paidDate: "",
      reference: "",
      notes: ""
    });
    setModal({
      type: "add"
    });
  };
  const oEdit = l => {
    setForm({
      ...l
    });
    setModal({
      type: "edit",
      data: l
    });
  };
  const save = () => {
    if (!form.vendor || !form.vendor.trim()) {
      alert("Please enter a vendor / payee name.");
      return;
    }
    if (!form.amount || num(form.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const rec = {
      ...form,
      amount: num(form.amount),
      paidAmount: num(form.paidAmount)
    };
    if (modal.type === "edit") setApLiabilities(liabs.map(l => l.id === form.id ? rec : l));else setApLiabilities([...liabs, {
      ...rec,
      id: Date.now()
    }]);
    setModal(null);
  };
  const oDel = l => setModal({
    type: "del",
    data: l
  });
  const doDel = () => {
    setApLiabilities(liabs.filter(l => l.id !== modal.data.id));
    setModal(null);
  };
  const totalOwed = liabs.reduce((a, l) => a + owedOf(l), 0);
  const totalPaid = liabs.reduce((a, l) => a + paidOf(l), 0);
  const overdueList = liabs.filter(isOverdue);
  const outstanding = liabs.filter(l => l.status !== "paid");
  const matchS = vals => {
    if (!search) return true;
    const q = search.toLowerCase();
    return vals.some(v => String(v || "").toLowerCase().includes(q));
  };
  const stColor = {
    unpaid: "danger",
    partial: "warn",
    paid: "success"
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
  }, cur || "PKR"));
  const stBadge = l => React.createElement("span", null, React.createElement(Badge, {
    text: l.status,
    color: stColor[l.status]
  }), isOverdue(l) && React.createElement("span", {
    style: {
      marginLeft: 5,
      fontSize: 8,
      fontWeight: 700,
      color: c.danger,
      background: c.dangerBg,
      padding: "1px 5px",
      borderRadius: 4,
      textTransform: "uppercase"
    }
  }, "overdue"));
  const tabs = [["ledger", "Liabilities Ledger"], ["due", "Due & Overdue"], ["vendors", "Vendors"], ["category", "By Category"], ["schedule", "Payment Schedule"]];
  const exportCSV = () => {
    const safe = v => '"' + String(v == null ? "" : v).split('"').join('""') + '"';
    let cols, rows, name;
    if (tab === "vendors") {
      cols = ["Vendor", "Liabilities", "Total Owed", "Total Paid"];
      const g = {};
      liabs.forEach(l => {
        const k = l.vendor || "\u2014";
        if (!g[k]) g[k] = {
          n: 0,
          owed: 0,
          paid: 0
        };
        g[k].n++;
        g[k].owed += owedOf(l);
        g[k].paid += paidOf(l);
      });
      rows = Object.keys(g).map(k => [k, g[k].n, g[k].owed, g[k].paid]);
      name = "AP-Vendors";
    } else if (tab === "category") {
      cols = ["Category", "Items", "Total", "Owed", "Paid"];
      const g = {};
      liabs.forEach(l => {
        const k = l.category || "Other";
        if (!g[k]) g[k] = {
          n: 0,
          t: 0,
          owed: 0,
          paid: 0
        };
        g[k].n++;
        g[k].t += num(l.amount);
        g[k].owed += owedOf(l);
        g[k].paid += paidOf(l);
      });
      rows = Object.keys(g).map(k => [k, g[k].n, g[k].t, g[k].owed, g[k].paid]);
      name = "AP-Categories";
    } else {
      cols = ["Vendor", "Category", "Amount", "Currency", "Paid Amount", "Due Date", "Paid Date", "Status", "Reference", "Notes"];
      rows = liabs.filter(l => matchS([l.vendor, l.category, l.reference])).map(l => [l.vendor, l.category, num(l.amount), l.currency, paidOf(l), l.dueDate, l.paidDate, isOverdue(l) ? "overdue" : l.status, l.reference, l.notes]);
      name = "AP-Liabilities";
    }
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
  if (tab === "ledger") {
    let rows = liabs;
    if (fStatus !== "all") rows = fStatus === "overdue" ? rows.filter(isOverdue) : rows.filter(l => l.status === fStatus);
    rows = rows.filter(l => matchS([l.vendor, l.category, l.reference]));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Receipt,
      label: "Total Payables",
      value: liabs.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Outstanding (owed)",
      value: fmt(totalOwed),
      color: c.danger
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Total Paid",
      value: fmt(totalPaid),
      color: c.success
    }), React.createElement(SC, {
      icon: Clock,
      label: "Overdue Items",
      value: overdueList.length,
      color: overdueList.length ? c.danger : c.textMuted
    })), Table(rows, [{
      h: "Vendor",
      render: l => React.createElement("div", null, React.createElement("div", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, l.vendor || "\u2014"), l.reference && React.createElement("div", {
        style: {
          fontSize: 10,
          color: c.textMuted,
          fontFamily: "monospace"
        }
      }, l.reference))
    }, {
      h: "Category",
      render: l => React.createElement(Badge, {
        text: l.category || "Other",
        color: "purple"
      })
    }, {
      h: "Amount",
      render: l => money(l.amount, l.currency)
    }, {
      h: "Paid",
      render: l => money(paidOf(l), l.currency)
    }, {
      h: "Balance",
      render: l => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: owedOf(l) > 0 ? c.danger : c.success
        }
      }, fmt(owedOf(l)), " ", React.createElement("span", {
        style: {
          fontSize: 9,
          color: c.textMuted
        }
      }, l.currency))
    }, {
      h: "Due Date",
      render: l => React.createElement("span", {
        style: {
          color: isOverdue(l) ? c.danger : c.textSec
        }
      }, l.dueDate || "\u2014")
    }, {
      h: "Status",
      render: l => stBadge(l)
    }, {
      h: "",
      tdStyle: {
        whiteSpace: "nowrap"
      },
      render: l => React.createElement("span", null, React.createElement("button", {
        onClick: () => oEdit(l),
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
        onClick: () => oDel(l),
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
    }], "No payables yet. Click \u201CAdd Liability\u201D to record what the academy owes."));
  } else if (tab === "due") {
    const rows = outstanding.filter(l => matchS([l.vendor, l.category])).sort((a, b) => String(a.dueDate || "9999") < String(b.dueDate || "9999") ? -1 : 1);
    const dueWeek = outstanding.filter(l => {
      const d = daysDiff(l.dueDate);
      return d !== null && d >= 0 && d <= 7;
    });
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: AlertTriangle,
      label: "Outstanding Items",
      value: outstanding.length,
      color: c.warn
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Owed",
      value: fmt(totalOwed),
      color: c.danger
    }), React.createElement(SC, {
      icon: Clock,
      label: "Overdue",
      value: overdueList.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: Calendar,
      label: "Due in 7 Days",
      value: dueWeek.length,
      color: c.cyan
    })), Table(rows, [{
      h: "Vendor",
      render: l => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, l.vendor || "\u2014")
    }, {
      h: "Category",
      render: l => React.createElement(Badge, {
        text: l.category || "Other",
        color: "purple"
      })
    }, {
      h: "Balance Due",
      render: l => React.createElement("span", {
        style: {
          fontWeight: 700,
          color: c.danger
        }
      }, fmt(owedOf(l)), " ", React.createElement("span", {
        style: {
          fontSize: 9,
          color: c.textMuted
        }
      }, l.currency))
    }, {
      h: "Due Date",
      render: l => l.dueDate || "\u2014"
    }, {
      h: "Timing",
      render: l => {
        const d = daysDiff(l.dueDate);
        if (d === null) return React.createElement("span", {
          style: {
            color: c.textMuted
          }
        }, "no date");
        if (d < 0) return React.createElement("span", {
          style: {
            color: c.danger,
            fontWeight: 600
          }
        }, Math.abs(d) + "d overdue");
        if (d === 0) return React.createElement("span", {
          style: {
            color: c.warn,
            fontWeight: 600
          }
        }, "due today");
        return React.createElement("span", {
          style: {
            color: c.textSec
          }
        }, "in " + d + "d");
      }
    }, {
      h: "Status",
      render: l => stBadge(l)
    }], "Nothing outstanding \u2014 all payables are settled. \u{1F389}"));
  } else if (tab === "vendors") {
    const g = {};
    liabs.forEach(l => {
      const k = l.vendor || "\u2014";
      if (!g[k]) g[k] = {
        vendor: k,
        n: 0,
        owed: 0,
        paid: 0
      };
      g[k].n++;
      g[k].owed += owedOf(l);
      g[k].paid += paidOf(l);
    });
    const rows = Object.values(g).filter(v => matchS([v.vendor])).sort((a, b) => b.owed - a.owed);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Users,
      label: "Vendors / Payees",
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Total Owed",
      value: fmt(totalOwed),
      color: c.danger
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Total Paid",
      value: fmt(totalPaid),
      color: c.success
    })), Table(rows, [{
      h: "Vendor / Payee",
      render: v => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, v.vendor)
    }, {
      h: "Liabilities",
      render: v => v.n
    }, {
      h: "Owed",
      render: v => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: v.owed > 0 ? c.danger : c.success
        }
      }, fmt(v.owed))
    }, {
      h: "Paid",
      render: v => React.createElement("span", {
        style: {
          color: c.success
        }
      }, fmt(v.paid))
    }], "No vendor data yet."));
  } else if (tab === "category") {
    const g = {};
    liabs.forEach(l => {
      const k = l.category || "Other";
      if (!g[k]) g[k] = {
        cat: k,
        n: 0,
        t: 0,
        owed: 0,
        paid: 0
      };
      g[k].n++;
      g[k].t += num(l.amount);
      g[k].owed += owedOf(l);
      g[k].paid += paidOf(l);
    });
    const grand = Object.values(g).reduce((a, x) => a + x.t, 0);
    const rows = Object.values(g).sort((a, b) => b.t - a.t);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: BarChart3,
      label: "Categories",
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Committed",
      value: fmt(grand),
      color: c.cyan
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Still Owed",
      value: fmt(totalOwed),
      color: c.danger
    })), Table(rows, [{
      h: "Category",
      render: x => React.createElement(Badge, {
        text: x.cat,
        color: "purple"
      })
    }, {
      h: "Items",
      render: x => x.n
    }, {
      h: "Total",
      render: x => money(x.t, "")
    }, {
      h: "Owed",
      render: x => React.createElement("span", {
        style: {
          color: x.owed > 0 ? c.danger : c.textMuted
        }
      }, fmt(x.owed))
    }, {
      h: "Paid",
      render: x => React.createElement("span", {
        style: {
          color: c.success
        }
      }, fmt(x.paid))
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 110,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (grand ? Math.round(x.t / grand * 100) : 0) + "%",
          height: "100%",
          background: c.warn
        }
      }))
    }], "No categories yet."));
  } else {
    const g = {};
    outstanding.forEach(l => {
      const k = String(l.dueDate || "").slice(0, 7) || "No date";
      if (!g[k]) g[k] = {
        month: k,
        n: 0,
        owed: 0
      };
      g[k].n++;
      g[k].owed += owedOf(l);
    });
    const rows = Object.values(g).sort((a, b) => a.month < b.month ? -1 : 1);
    const mLabel = m => {
      const d = new Date(m + "-01T00:00:00");
      return isNaN(d) ? m : d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });
    };
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Calendar,
      label: "Months with Dues",
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Scheduled",
      value: fmt(totalOwed),
      color: c.warn
    }), React.createElement(SC, {
      icon: Clock,
      label: "Overdue Items",
      value: overdueList.length,
      color: c.danger
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: c.warnBg,
        border: "1px solid " + c.warn + "33",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        color: c.textSec
      }
    }, React.createElement(Calendar, {
      size: 14,
      color: c.warn
    }), React.createElement("span", null, "Upcoming payment obligations grouped by the month they're due \u2014 plan cash-flow ahead.")), Table(rows, [{
      h: "Due Month",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, mLabel(x.month))
    }, {
      h: "Items Due",
      render: x => x.n
    }, {
      h: "Amount Owed",
      render: x => money(x.owed, "")
    }], "Nothing scheduled \u2014 no outstanding payables with due dates."));
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
      background: c.warn + "22",
      border: "1px solid " + c.warn + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(Receipt, {
    size: 24,
    color: c.warn
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
  }, "Accounts Payable"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Liabilities ledger, vendor dues, aging & payment schedule")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(Btn, {
    icon: Plus,
    onClick: oAdd
  }, "Add Liability"), React.createElement(Btn, {
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
      display: "flex",
      gap: 8,
      marginBottom: 14,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 200
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
    placeholder: "Search vendor, category, reference...",
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
  })), tab === "ledger" && React.createElement("select", {
    value: fStatus,
    onChange: e => setFStatus(e.target.value),
    style: {
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 11
    }
  }, React.createElement("option", {
    value: "all"
  }, "All Statuses"), React.createElement("option", {
    value: "unpaid"
  }, "Unpaid"), React.createElement("option", {
    value: "partial"
  }, "Partial"), React.createElement("option", {
    value: "paid"
  }, "Paid"), React.createElement("option", {
    value: "overdue"
  }, "Overdue"))), content, modal && (modal.type === "add" || modal.type === "edit") && React.createElement("div", {
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
    color: c.warn
  }), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, modal.type === "edit" ? "Edit Liability" : "Add Liability")), React.createElement("button", {
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
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Vendor / Payee *",
    value: form.vendor || "",
    onChange: v => setForm({
      ...form,
      vendor: v
    }),
    placeholder: "e.g. PTCL, AWS, Landlord"
  }), React.createElement(Inp, {
    label: "Category",
    value: form.category || "",
    onChange: v => setForm({
      ...form,
      category: v
    }),
    options: CATEGORIES
  }), React.createElement(Inp, {
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
    value: form.currency || "PKR",
    onChange: v => setForm({
      ...form,
      currency: v
    }),
    options: CURRENCIES
  }), React.createElement(Inp, {
    label: "Paid Amount (if partial)",
    value: form.paidAmount || "",
    onChange: v => setForm({
      ...form,
      paidAmount: v
    }),
    type: "number",
    placeholder: "0.00"
  }), React.createElement(Inp, {
    label: "Status",
    value: form.status || "unpaid",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: STATUSES
  }), React.createElement(Inp, {
    label: "Due Date",
    value: form.dueDate || "",
    onChange: v => setForm({
      ...form,
      dueDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Paid Date",
    value: form.paidDate || "",
    onChange: v => setForm({
      ...form,
      paidDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Reference / Invoice #",
    value: form.reference || "",
    onChange: v => setForm({
      ...form,
      reference: v
    })
  })), React.createElement(Inp, {
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
    onClick: save
  }, modal.type === "edit" ? "Save Changes" : "Add Liability")))), modal && modal.type === "del" && React.createElement("div", {
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
  }, "Delete this liability?"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 16px",
      lineHeight: 1.5
    }
  }, "Remove the ", fmt(modal.data.amount), " ", modal.data.currency || "PKR", " payable to ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.data.vendor), "? This cannot be undone."), React.createElement("div", {
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

