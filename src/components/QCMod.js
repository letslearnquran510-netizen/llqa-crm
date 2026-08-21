const QCMod = ({
  teachers,
  qcViolations,
  setQcViolations
}) => {
  const [tab, setTab] = useState("log");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const VTYPES = ["Missed Curriculum", "Missed Daily Report", "Late to Class", "Class No-Show", "Poor Lesson Quality", "Behavior/Conduct", "Attendance Marking Error", "Parent Complaint", "Policy Breach", "Other"];
  const SEVERITY = ["Low", "Medium", "High", "Critical"];
  const STATUSES = ["Open", "Under Review", "Resolved", "Waived"];
  const tList = (teachers || []).filter(t => t.status !== "resigned" && t.status !== "terminated");
  const viols = qcViolations || [];
  const num = n => Number(n || 0);
  const fmt = n => num(n).toLocaleString(void 0, {
    maximumFractionDigits: 0
  });
  const today = todayPK();
  const oAdd = () => {
    setForm({
      date: todayPK(),
      teacher: "",
      vtype: "Missed Curriculum",
      severity: "Medium",
      description: "",
      fine: "",
      evidence: "",
      officer: "",
      status: "Open",
      notes: ""
    });
    setModal({
      type: "add"
    });
  };
  const oEdit = v => {
    setForm({
      ...v
    });
    setModal({
      type: "edit",
      data: v
    });
  };
  const save = () => {
    if (!form.teacher) {
      alert("Please select the teacher this violation applies to.");
      return;
    }
    if (!form.vtype) {
      alert("Please select a violation type.");
      return;
    }
    const rec = {
      ...form,
      fine: num(form.fine)
    };
    if (modal.type === "edit") setQcViolations(viols.map(v => v.id === form.id ? rec : v));else setQcViolations([...viols, {
      ...rec,
      id: Date.now()
    }]);
    setModal(null);
  };
  const oDel = v => setModal({
    type: "del",
    data: v
  });
  const doDel = () => {
    setQcViolations(viols.filter(v => v.id !== modal.data.id));
    setModal(null);
  };
  const openCases = viols.filter(v => v.status === "Open" || v.status === "Under Review");
  const finesIssued = viols.reduce((a, v) => a + num(v.fine), 0);
  const finesCollected = viols.filter(v => v.status === "Resolved").reduce((a, v) => a + num(v.fine), 0);
  const finesPending = openCases.reduce((a, v) => a + num(v.fine), 0);
  const finesWaived = viols.filter(v => v.status === "Waived").reduce((a, v) => a + num(v.fine), 0);
  const matchS = vals => {
    if (!search) return true;
    const q = search.toLowerCase();
    return vals.some(x => String(x || "").toLowerCase().includes(q));
  };
  const sevColor = {
    Low: "cyan",
    Medium: "warn",
    High: "danger",
    Critical: "danger"
  };
  const stColor = {
    Open: "danger",
    "Under Review": "warn",
    Resolved: "success",
    Waived: "purple"
  };
  const sevRank = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1
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
  const rs = n => React.createElement("span", {
    style: {
      fontWeight: 600,
      color: c.text
    }
  }, "Rs ", fmt(n));
  const tName = v => React.createElement("div", null, React.createElement("div", {
    style: {
      fontWeight: 600,
      color: c.text
    }
  }, v.teacher || "\u2014"), v.officer && React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textMuted
    }
  }, "by " + v.officer));
  const tabs = [["log", "Violations & Fines"], ["open", "Open Cases"], ["byteacher", "By Teacher"], ["fines", "Fines Summary"], ["types", "Violation Types"]];
  const exportCSV = () => {
    const safe = v => '"' + String(v == null ? "" : v).split('"').join('""') + '"';
    let cols, rows, name;
    if (tab === "byteacher") {
      cols = ["Teacher", "Violations", "Open", "Total Fines Rs", "Pending Rs"];
      const g = {};
      viols.forEach(v => {
        const k = v.teacher || "\u2014";
        if (!g[k]) g[k] = {
          n: 0,
          open: 0,
          fine: 0,
          pend: 0
        };
        g[k].n++;
        if (v.status === "Open" || v.status === "Under Review") {
          g[k].open++;
          g[k].pend += num(v.fine);
        }
        g[k].fine += num(v.fine);
      });
      rows = Object.keys(g).map(k => [k, g[k].n, g[k].open, g[k].fine, g[k].pend]);
      name = "QC-By-Teacher";
    } else if (tab === "types") {
      cols = ["Violation Type", "Count", "Total Fines Rs"];
      const g = {};
      viols.forEach(v => {
        const k = v.vtype || "Other";
        if (!g[k]) g[k] = {
          n: 0,
          fine: 0
        };
        g[k].n++;
        g[k].fine += num(v.fine);
      });
      rows = Object.keys(g).map(k => [k, g[k].n, g[k].fine]);
      name = "QC-Types";
    } else {
      cols = ["Date", "Teacher", "Violation Type", "Severity", "Description", "Fine Rs", "Evidence", "QC Officer", "Status"];
      rows = viols.filter(v => matchS([v.teacher, v.vtype, v.description, v.officer])).map(v => [v.date, v.teacher, v.vtype, v.severity, v.description, num(v.fine), v.evidence, v.officer, v.status]);
      name = "QC-Violations";
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
  const logCols = withActions => [{
    h: "Date",
    render: v => React.createElement("span", {
      style: {
        color: c.textSec
      }
    }, v.date || "\u2014")
  }, {
    h: "Teacher",
    render: v => tName(v)
  }, {
    h: "Type",
    render: v => React.createElement("span", {
      style: {
        color: c.text
      }
    }, v.vtype || "\u2014")
  }, {
    h: "Severity",
    render: v => React.createElement(Badge, {
      text: v.severity || "\u2014",
      color: sevColor[v.severity]
    })
  }, {
    h: "Fine",
    render: v => num(v.fine) > 0 ? rs(v.fine) : React.createElement("span", {
      style: {
        color: c.textMuted
      }
    }, "\u2014")
  }, {
    h: "Status",
    render: v => React.createElement(Badge, {
      text: v.status || "Open",
      color: stColor[v.status]
    })
  }].concat(withActions ? [{
    h: "",
    tdStyle: {
      whiteSpace: "nowrap"
    },
    render: v => React.createElement("span", null, React.createElement("button", {
      onClick: () => oEdit(v),
      title: "Edit / resolve",
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
      onClick: () => oDel(v),
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
  }] : []);
  let content;
  if (tab === "log") {
    let rows = viols;
    if (fStatus !== "all") rows = rows.filter(v => v.status === fStatus);
    rows = rows.filter(v => matchS([v.teacher, v.vtype, v.description, v.officer])).sort((a, b) => String(a.date) < String(b.date) ? 1 : -1);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Shield,
      label: "Total Violations",
      value: viols.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Open Cases",
      value: openCases.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Fines Issued",
      value: "Rs " + fmt(finesIssued),
      color: c.warn
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Resolved",
      value: viols.filter(v => v.status === "Resolved").length,
      color: c.success
    })), Table(rows, logCols(true), "No violations logged. Click \u201CLog Violation\u201D to record a QC issue."));
  } else if (tab === "open") {
    const rows = openCases.filter(v => matchS([v.teacher, v.vtype, v.description])).sort((a, b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: AlertTriangle,
      label: "Open Cases",
      value: openCases.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: Clock,
      label: "Pending Fines",
      value: "Rs " + fmt(finesPending),
      color: c.warn
    }), React.createElement(SC, {
      icon: Shield,
      label: "Critical/High",
      value: openCases.filter(v => v.severity === "Critical" || v.severity === "High").length,
      color: c.danger
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: c.dangerBg,
        border: "1px solid " + c.danger + "33",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        color: c.textSec
      }
    }, React.createElement(AlertTriangle, {
      size: 14,
      color: c.danger
    }), React.createElement("span", null, "Unresolved violations sorted by severity. Open the editor to mark a case ", React.createElement("strong", {
      style: {
        color: c.success
      }
    }, "Resolved"), " or ", React.createElement("strong", {
      style: {
        color: c.purple
      }
    }, "Waived"), ".")), Table(rows, logCols(true), "No open cases \u2014 all violations are resolved. \u{1F389}"));
  } else if (tab === "byteacher") {
    const g = {};
    viols.forEach(v => {
      const k = v.teacher || "\u2014";
      if (!g[k]) g[k] = {
        teacher: k,
        n: 0,
        open: 0,
        fine: 0,
        pend: 0,
        maxSev: 0
      };
      g[k].n++;
      g[k].fine += num(v.fine);
      if (v.status === "Open" || v.status === "Under Review") {
        g[k].open++;
        g[k].pend += num(v.fine);
      }
      g[k].maxSev = Math.max(g[k].maxSev, sevRank[v.severity] || 0);
    });
    const rows = Object.values(g).filter(x => matchS([x.teacher])).sort((a, b) => b.n - a.n);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Users,
      label: "Teachers Flagged",
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Shield,
      label: "Total Violations",
      value: viols.length,
      color: c.warn
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Fines",
      value: "Rs " + fmt(finesIssued),
      color: c.danger
    })), Table(rows, [{
      h: "Teacher",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, x.teacher)
    }, {
      h: "Violations",
      render: x => x.n
    }, {
      h: "Open",
      render: x => React.createElement("span", {
        style: {
          color: x.open > 0 ? c.danger : c.success,
          fontWeight: 600
        }
      }, x.open)
    }, {
      h: "Total Fines",
      render: x => rs(x.fine)
    }, {
      h: "Pending",
      render: x => React.createElement("span", {
        style: {
          color: x.pend > 0 ? c.warn : c.textMuted
        }
      }, "Rs " + fmt(x.pend))
    }], "No teacher violations recorded."));
  } else if (tab === "fines") {
    const bySev = SEVERITY.map(s => ({
      sev: s,
      n: viols.filter(v => v.severity === s).length,
      fine: viols.filter(v => v.severity === s).reduce((a, v) => a + num(v.fine), 0)
    }));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: DollarSign,
      label: "Fines Issued",
      value: "Rs " + fmt(finesIssued),
      color: c.accent
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Collected (resolved)",
      value: "Rs " + fmt(finesCollected),
      color: c.success
    }), React.createElement(SC, {
      icon: Clock,
      label: "Pending",
      value: "Rs " + fmt(finesPending),
      color: c.warn
    }), React.createElement(SC, {
      icon: XCircle,
      label: "Waived",
      value: "Rs " + fmt(finesWaived),
      color: c.purple
    })), React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "4px 0 10px"
      }
    }, "Breakdown by Severity"), Table(bySev, [{
      h: "Severity",
      render: x => React.createElement(Badge, {
        text: x.sev,
        color: sevColor[x.sev]
      })
    }, {
      h: "Violations",
      render: x => x.n
    }, {
      h: "Total Fines",
      render: x => rs(x.fine)
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 120,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (finesIssued ? Math.round(x.fine / finesIssued * 100) : 0) + "%",
          height: "100%",
          background: c.danger
        }
      }))
    }], "No fines data."));
  } else {
    const g = {};
    viols.forEach(v => {
      const k = v.vtype || "Other";
      if (!g[k]) g[k] = {
        type: k,
        n: 0,
        fine: 0
      };
      g[k].n++;
      g[k].fine += num(v.fine);
    });
    const total = viols.length;
    const rows = Object.values(g).sort((a, b) => b.n - a.n);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: BarChart3,
      label: "Distinct Types",
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Shield,
      label: "Total Violations",
      value: total,
      color: c.warn
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Most Common",
      value: rows.length ? rows[0].type : "\u2014",
      color: c.purple
    })), Table(rows, [{
      h: "Violation Type",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, x.type)
    }, {
      h: "Count",
      render: x => x.n
    }, {
      h: "Total Fines",
      render: x => rs(x.fine)
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 120,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (total ? Math.round(x.n / total * 100) : 0) + "%",
          height: "100%",
          background: c.warn
        }
      }))
    }], "No violation types yet."));
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
      background: c.danger + "22",
      border: "1px solid " + c.danger + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(Shield, {
    size: 24,
    color: c.danger
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
  }, "Quality Control"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Teacher violations, fines, case tracking & analytics")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(Btn, {
    icon: Plus,
    onClick: oAdd
  }, "Log Violation"), React.createElement(Btn, {
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
    placeholder: "Search teacher, type, description, officer...",
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
  })), tab === "log" && React.createElement("select", {
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
  }, [React.createElement("option", {
    key: "all",
    value: "all"
  }, "All Statuses"), ...STATUSES.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))])), content, modal && (modal.type === "add" || modal.type === "edit") && React.createElement("div", {
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
      width: 560,
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
  }, React.createElement(Shield, {
    size: 18,
    color: c.danger
  }), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, modal.type === "edit" ? "Edit / Resolve Violation" : "Log Violation")), React.createElement("button", {
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
  }, "Teacher *"), React.createElement("select", {
    value: form.teacher || "",
    onChange: e => setForm({
      ...form,
      teacher: e.target.value
    }),
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
  }, "-- Select teacher --"), tList.map(t => React.createElement("option", {
    key: t.id,
    value: t.name
  }, t.name + (t.code ? " (" + t.code + ")" : ""))))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Violation Type",
    value: form.vtype || "",
    onChange: v => setForm({
      ...form,
      vtype: v
    }),
    options: VTYPES
  }), React.createElement(Inp, {
    label: "Severity",
    value: form.severity || "Medium",
    onChange: v => setForm({
      ...form,
      severity: v
    }),
    options: SEVERITY
  }), React.createElement(Inp, {
    label: "Date",
    value: form.date || "",
    onChange: v => setForm({
      ...form,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Fine (Rs)",
    value: form.fine || "",
    onChange: v => setForm({
      ...form,
      fine: v
    }),
    type: "number",
    placeholder: "0"
  }), React.createElement(Inp, {
    label: "QC Officer",
    value: form.officer || "",
    onChange: v => setForm({
      ...form,
      officer: v
    }),
    placeholder: "Who logged this"
  }), React.createElement(Inp, {
    label: "Status",
    value: form.status || "Open",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: STATUSES
  })), React.createElement(Inp, {
    label: "Description",
    value: form.description || "",
    onChange: v => setForm({
      ...form,
      description: v
    }),
    placeholder: "What happened"
  }), React.createElement(Inp, {
    label: "Evidence (link / note)",
    value: form.evidence || "",
    onChange: v => setForm({
      ...form,
      evidence: v
    }),
    placeholder: "Recording link, screenshot ref, etc."
  }), React.createElement(Inp, {
    label: "Notes",
    value: form.notes || "",
    onChange: v => setForm({
      ...form,
      notes: v
    }),
    placeholder: "Optional resolution notes"
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
  }, modal.type === "edit" ? "Save Changes" : "Log Violation")))), modal && modal.type === "del" && React.createElement("div", {
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
  }, "Delete this violation?"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 16px",
      lineHeight: 1.5
    }
  }, "Remove the ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.data.vtype), " record for ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.data.teacher), "? This cannot be undone."), React.createElement("div", {
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

