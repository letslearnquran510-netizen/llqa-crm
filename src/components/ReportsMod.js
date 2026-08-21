const ReportsMod = ({
  students,
  teachers,
  arPayments,
  apLiabilities,
  salesReferrals,
  leaves,
  qcViolations,
  trainingPrograms
}) => {
  const [tab, setTab] = useState("overview");
  const [month, setMonth] = useState(todayPK().slice(0, 7));
  const S = students || [],
    T = teachers || [],
    PAY = arPayments || [],
    LIA = apLiabilities || [],
    REF = salesReferrals || [],
    LV = leaves || [],
    QC = qcViolations || [],
    TR = trainingPrograms || [];
  const num = n => Number(n || 0);
  const fmt = n => num(n).toLocaleString(void 0, {
    maximumFractionDigits: 0
  });
  const mLabel = m => {
    const d = new Date(m + "-01T00:00:00");
    return isNaN(d) ? m : d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  };
  const inMonth = d => String(d || "").slice(0, 7) === month;
  const activeT = T.filter(t => t.status !== "resigned" && t.status !== "terminated");
  const activeS = S.filter(s => s.status === "active");
  const quitS = S.filter(s => s.status === "quit");
  const leaveS = S.filter(s => s.status === "leave");
  const monthRevenue = PAY.filter(p => inMonth(p.paidDate)).reduce((a, p) => a + num(p.amount), 0);
  const monthlySalaries = activeT.reduce((a, t) => a + num(t.salary), 0);
  const monthAPpaid = LIA.filter(l => l.status !== "unpaid" && inMonth(l.paidDate)).reduce((a, l) => a + (l.status === "paid" ? num(l.amount) : num(l.paidAmount)), 0);
  const monthExpenses = monthlySalaries + monthAPpaid;
  const monthNet = monthRevenue - monthExpenses;
  const apOutstanding = LIA.reduce((a, l) => a + (l.status === "paid" ? 0 : Math.max(0, num(l.amount) - (l.status === "partial" ? num(l.paidAmount) : 0))), 0);
  const newAdmitsMonth = S.filter(s => inMonth(s.dor)).length;
  const qcOpen = QC.filter(v => v.status === "Open" || v.status === "Under Review");
  const finesPending = qcOpen.reduce((a, v) => a + num(v.fine), 0);
  const leadsMonth = REF.filter(r => inMonth(r.date)).length;
  const conversions = REF.filter(r => r.status === "Enrolled").length;
  const certs = TR.flatMap(p => p.attendees || []).filter(a => a.status === "Completed").length;
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
  const money = n => React.createElement("span", {
    style: {
      fontWeight: 600,
      color: c.text
    }
  }, fmt(n));
  const monthsSeries = () => {
    const set = {};
    PAY.forEach(p => {
      const m = String(p.paidDate || "").slice(0, 7);
      if (m) set[m] = 1;
    });
    LIA.forEach(l => {
      const m = String(l.paidDate || "").slice(0, 7);
      if (m) set[m] = 1;
    });
    return Object.keys(set).sort((a, b) => a < b ? 1 : -1).map(m => {
      const rev = PAY.filter(p => String(p.paidDate || "").slice(0, 7) === m).reduce((a, p) => a + num(p.amount), 0);
      const ap = LIA.filter(l => l.status !== "unpaid" && String(l.paidDate || "").slice(0, 7) === m).reduce((a, l) => a + (l.status === "paid" ? num(l.amount) : num(l.paidAmount)), 0);
      const exp = ap + monthlySalaries;
      return {
        m,
        rev,
        exp,
        net: rev - exp,
        margin: rev > 0 ? Math.round((rev - exp) / rev * 100) : 0
      };
    });
  };
  const admitsByMonth = () => {
    const g = {};
    S.forEach(s => {
      const m = String(s.dor || "").slice(0, 7);
      if (!m) return;
      g[m] = (g[m] || 0) + 1;
    });
    let run = 0;
    return Object.keys(g).sort().map(m => {
      run += g[m];
      return {
        m,
        n: g[m],
        run
      };
    }).reverse();
  };
  const tabs = [["overview", "Executive Overview"], ["strength", "Student Strength"], ["sales", "Sales Report"], ["profit", "Net Profit (P&L)"], ["recovery", "Daily Recovery"], ["quits", "Quits Report"], ["leave", "Leave Report"]];
  const lf = (l, keys) => {
    for (const k of keys) if (l[k] != null && l[k] !== "") return l[k];
    return "";
  };
  let content;
  if (tab === "overview") {
    const card = (icon, label, value, color, sub) => React.createElement(SC, {
      icon,
      label,
      value,
      color,
      sub
    });
    content = React.createElement("div", null, React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 10px"
      }
    }, "Students & Growth"), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16
      }
    }, card(Users, "Active Students", activeS.length, c.success), card(GraduationCap, "New Admits (" + mLabel(month) + ")", newAdmitsMonth, c.accent), card(Coffee, "On Leave", leaveS.length, c.warn), card(UserX, "Quit (total)", quitS.length, c.danger)), React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 10px"
      }
    }, "Finance (" + mLabel(month) + ")"), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16
      }
    }, card(DollarSign, "Revenue Collected", "Rs " + fmt(monthRevenue), c.success), card(Receipt, "Expenses", "Rs " + fmt(monthExpenses), c.warn), card(TrendingUp, "Net Profit", "Rs " + fmt(monthNet), monthNet >= 0 ? c.success : c.danger), card(AlertTriangle, "Payables Outstanding", "Rs " + fmt(apOutstanding), c.danger)), React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 10px"
      }
    }, "Team, Sales & Quality"), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap"
      }
    }, card(Users, "Active Teachers", activeT.length, c.accent), card(Target, "Sales Leads (" + mLabel(month) + ")", leadsMonth, c.cyan), card(Award, "Conversions", conversions, c.success), card(Shield, "Open QC Cases", qcOpen.length, qcOpen.length ? c.danger : c.textMuted)));
  } else if (tab === "strength") {
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Users,
      label: "Active Now",
      value: activeS.length,
      color: c.success
    }), React.createElement(SC, {
      icon: GraduationCap,
      label: "New This Month",
      value: newAdmitsMonth,
      color: c.accent
    }), React.createElement(SC, {
      icon: UserX,
      label: "Quit (total)",
      value: quitS.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Net Roster",
      value: S.length,
      color: c.cyan
    })), React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "4px 0 8px"
      }
    }, "New Admissions by Month"), Table(admitsByMonth(), [{
      h: "Month",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, mLabel(x.m))
    }, {
      h: "New Admits",
      render: x => React.createElement("span", {
        style: {
          color: c.success,
          fontWeight: 600
        }
      }, "+" + x.n)
    }, {
      h: "Cumulative",
      render: x => x.run
    }], "No registration dates on student records yet."));
  } else if (tab === "sales") {
    const funnel = [["New", REF.filter(r => r.status === "New").length], ["Contacted", REF.filter(r => r.status === "Contacted").length], ["Trial Scheduled", REF.filter(r => r.status === "Trial Scheduled").length], ["Enrolled", REF.filter(r => r.status === "Enrolled").length], ["Declined", REF.filter(r => r.status === "Declined").length]];
    const convRate = REF.length ? Math.round(conversions / REF.length * 100) : 0;
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Target,
      label: "Leads (" + mLabel(month) + ")",
      value: leadsMonth,
      color: c.accent
    }), React.createElement(SC, {
      icon: Award,
      label: "Conversions (total)",
      value: conversions,
      color: c.success
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Conversion Rate",
      value: convRate + "%",
      color: convRate >= 30 ? c.success : c.warn
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Revenue (" + mLabel(month) + ")",
      value: "Rs " + fmt(monthRevenue),
      color: c.cyan
    })), React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "4px 0 8px"
      }
    }, "Referral Pipeline (all-time)"), Table(funnel.map(([s, n]) => ({
      s,
      n
    })), [{
      h: "Stage",
      render: x => React.createElement(Badge, {
        text: x.s,
        color: x.s === "Enrolled" ? "success" : x.s === "Declined" ? "danger" : "accent"
      })
    }, {
      h: "Count",
      render: x => x.n
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
          width: (REF.length ? Math.round(x.n / REF.length * 100) : 0) + "%",
          height: "100%",
          background: c.accent
        }
      }))
    }], "No sales referrals logged yet."));
  } else if (tab === "profit") {
    const series = monthsSeries();
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: DollarSign,
      label: "Revenue (" + mLabel(month) + ")",
      value: "Rs " + fmt(monthRevenue),
      color: c.success
    }), React.createElement(SC, {
      icon: Receipt,
      label: "Expenses",
      value: "Rs " + fmt(monthExpenses),
      color: c.warn
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Net Profit",
      value: "Rs " + fmt(monthNet),
      color: monthNet >= 0 ? c.success : c.danger
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Margin",
      value: (monthRevenue > 0 ? Math.round(monthNet / monthRevenue * 100) : 0) + "%",
      color: monthNet >= 0 ? c.success : c.danger
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
    }, React.createElement(TrendingUp, {
      size: 14,
      color: c.accent
    }), React.createElement("span", null, "Revenue from fee collections, expenses = staff salaries (Rs ", fmt(monthlySalaries), "/mo) + paid liabilities. Auto-built from live data.")), Table(series, [{
      h: "Month",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, mLabel(x.m))
    }, {
      h: "Revenue",
      render: x => React.createElement("span", {
        style: {
          color: c.success
        }
      }, "Rs " + fmt(x.rev))
    }, {
      h: "Expenses",
      render: x => React.createElement("span", {
        style: {
          color: c.warn
        }
      }, "Rs " + fmt(x.exp))
    }, {
      h: "Net Profit",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 700,
          color: x.net >= 0 ? c.success : c.danger
        }
      }, "Rs " + fmt(x.net))
    }, {
      h: "Margin",
      render: x => x.margin + "%"
    }], "No revenue or expense records yet \u2014 post payments and liabilities to build the P&L."));
  } else if (tab === "recovery") {
    const mp = PAY.filter(p => inMonth(p.paidDate));
    const g = {};
    mp.forEach(p => {
      const d = p.paidDate || "\u2014";
      if (!g[d]) g[d] = {
        date: d,
        n: 0,
        sum: 0
      };
      g[d].n++;
      g[d].sum += num(p.amount);
    });
    const rows = Object.values(g).sort((a, b) => a.date < b.date ? 1 : -1);
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
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Collected (" + mLabel(month) + ")",
      value: "Rs " + fmt(monthRevenue),
      color: c.success
    }), React.createElement(SC, {
      icon: Receipt,
      label: "Transactions",
      value: mp.length,
      color: c.cyan
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Daily Avg",
      value: rows.length ? "Rs " + fmt(monthRevenue / rows.length) : "0",
      color: c.purple
    })), Table(rows, [{
      h: "Date",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, x.date)
    }, {
      h: "Transactions",
      render: x => x.n
    }, {
      h: "Collected",
      render: x => money(x.sum)
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
          width: (monthRevenue ? Math.round(x.sum / monthRevenue * 100) : 0) + "%",
          height: "100%",
          background: c.success
        }
      }))
    }], "No collections recorded for " + mLabel(month) + "."));
  } else if (tab === "quits") {
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: UserX,
      label: "Total Quits",
      value: quitS.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: Users,
      label: "Active Students",
      value: activeS.length,
      color: c.success
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Quit Rate",
      value: S.length ? Math.round(quitS.length / S.length * 100) + "%" : "0%",
      color: c.warn
    })), Table(quitS, [{
      h: "Student",
      render: s => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, s.name || "\u2014")
    }, {
      h: "Parent",
      render: s => s.parent || "\u2014"
    }, {
      h: "Course",
      render: s => React.createElement("span", {
        style: {
          color: c.cyan
        }
      }, s.course || "\u2014")
    }, {
      h: "Teacher",
      render: s => s.teacher || "\u2014"
    }, {
      h: "Country",
      render: s => React.createElement(Badge, {
        text: s.country || "\u2014",
        color: "purple"
      })
    }], "No quits recorded \u2014 great retention! \u{1F389}"));
  } else {
    const rows = LV.slice().sort((a, b) => String(lf(a, ["from", "lvFrom", "startDate", "date"])) < String(lf(b, ["from", "lvFrom", "startDate", "date"])) ? 1 : -1);
    const pending = LV.filter(l => String(lf(l, ["status"])).toLowerCase() === "pending").length;
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Coffee,
      label: "Leave Records",
      value: LV.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Clock,
      label: "Pending",
      value: pending,
      color: pending ? c.warn : c.textMuted
    }), React.createElement(SC, {
      icon: Users,
      label: "On Leave (students)",
      value: leaveS.length,
      color: c.cyan
    })), Table(rows, [{
      h: "Name",
      render: l => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, lf(l, ["teacher", "name", "teacherName", "staff"]) || "\u2014")
    }, {
      h: "Type",
      render: l => React.createElement(Badge, {
        text: lf(l, ["type", "lvType", "leaveType"]) || "Leave",
        color: "accent"
      })
    }, {
      h: "From",
      render: l => lf(l, ["from", "lvFrom", "startDate", "date"]) || "\u2014"
    }, {
      h: "To",
      render: l => lf(l, ["to", "lvTo", "endDate"]) || "\u2014"
    }, {
      h: "Status",
      render: l => {
        const st = lf(l, ["status"]) || "\u2014";
        return React.createElement(Badge, {
          text: st,
          color: st.toLowerCase() === "approved" ? "success" : st.toLowerCase() === "pending" ? "warn" : st.toLowerCase() === "rejected" ? "danger" : "accent"
        });
      }
    }], "No leave records logged yet."));
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
      background: c.accent + "22",
      border: "1px solid " + c.accent + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(BarChart3, {
    size: 24,
    color: c.accent
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
  }, "Monthly Reports"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Executive command center \u2014 live KPIs across every module")), React.createElement("input", {
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
  })), React.createElement("div", {
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
      padding: "8px 13px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 600,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), content);
};

