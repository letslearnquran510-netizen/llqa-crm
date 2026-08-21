const FinanceMod = () => {
  const [feeStudents, setFeeStudents] = useState(initFeeStudents);
  const [expenses, setExpenses] = useState(initExpenses);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fCourse, setFCourse] = useState("all");
  const [fCat, setFCat] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [displayCur, setDisplayCur] = useState("USD");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const toCur = (amount, fromCur) => {
    const inPKR = amount * EXCHANGE_RATE[fromCur];
    return Math.round(inPKR / EXCHANGE_RATE[displayCur]);
  };
  const feeStats = useMemo(() => {
    let totalPaidUSD = 0,
      totalDueUSD = 0,
      paidCount = 0,
      overdueCount = 0,
      partialCount = 0;
    feeStudents.forEach(s => {
      totalPaidUSD += s.totalPaid * (EXCHANGE_RATE[s.currency] / EXCHANGE_RATE.USD);
      totalDueUSD += s.dueAmount * (EXCHANGE_RATE[s.currency] / EXCHANGE_RATE.USD);
      if (s.status === "paid") paidCount++;else if (s.status === "overdue") overdueCount++;else if (s.status === "partial") partialCount++;
    });
    const monthlyRev = feeStudents.reduce((sum, s) => sum + s.fee * (EXCHANGE_RATE[s.currency] / EXCHANGE_RATE.USD), 0);
    const collRate = feeStudents.length > 0 ? Math.round((paidCount + partialCount * 0.5) / feeStudents.length * 100) : 0;
    return {
      totalPaidUSD: Math.round(totalPaidUSD),
      totalDueUSD: Math.round(totalDueUSD),
      paidCount,
      overdueCount,
      partialCount,
      monthlyRev: Math.round(monthlyRev),
      collRate,
      arps: Math.round(monthlyRev / (feeStudents.length || 1))
    };
  }, [feeStudents]);
  const expStats = useMemo(() => {
    let totalPKR = 0,
      paidPKR = 0,
      pendingPKR = 0,
      byCat = {};
    expenses.forEach(e => {
      const pkr = e.amount * EXCHANGE_RATE[e.currency];
      totalPKR += pkr;
      if (e.status === "paid") paidPKR += pkr;else pendingPKR += pkr;
      byCat[e.category] = (byCat[e.category] || 0) + pkr;
    });
    return {
      totalPKR,
      paidPKR,
      pendingPKR,
      byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1])
    };
  }, [expenses]);
  const trendData = useMemo(() => {
    const months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.toISOString().substring(0, 7);
      months[m] = {
        month: m.substring(5),
        income: 0,
        expense: 0
      };
    }
    Object.keys(months).forEach(m => {
      months[m].income = feeStats.monthlyRev * (0.85 + Math.random() * 0.15);
    });
    expenses.forEach(e => {
      const m = e.date.substring(0, 7);
      if (months[m]) months[m].expense += e.amount * EXCHANGE_RATE[e.currency] / EXCHANGE_RATE.USD;
    });
    Object.keys(months).forEach((m, i) => {
      if (months[m].expense === 0) months[m].expense = 5500 + Math.random() * 500;
      months[m].profit = Math.round(months[m].income - months[m].expense);
      months[m].income = Math.round(months[m].income);
      months[m].expense = Math.round(months[m].expense);
    });
    return Object.values(months);
  }, [feeStats.monthlyRev, expenses]);
  const filteredFees = useMemo(() => {
    let d = feeStudents;
    if (search) d = d.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.parent.toLowerCase().includes(search.toLowerCase()));
    if (fStatus !== "all") d = d.filter(s => s.status === fStatus);
    if (fCourse !== "all") d = d.filter(s => s.course === fCourse);
    return d;
  }, [feeStudents, search, fStatus, fCourse]);
  const filteredExp = useMemo(() => {
    let d = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (fCat !== "all") d = d.filter(e => e.category === fCat);
    if (search) d = d.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [expenses, search, fCat]);
  const recordPayment = (id, amount) => setFeeStudents(feeStudents.map(s => s.id === id ? {
    ...s,
    status: "paid",
    lastPaid: todayPK(),
    monthsPaid: s.monthsPaid + 1,
    totalPaid: s.totalPaid + (amount || s.fee),
    dueAmount: 0
  } : s));
  const markOverdue = id => setFeeStudents(feeStudents.map(s => s.id === id ? {
    ...s,
    status: "overdue",
    dueAmount: s.dueAmount + s.fee
  } : s));
  const sendReminder = id => alert("Reminder sent to " + feeStudents.find(s => s.id === id)?.parent);
  const openInvoice = s => setModal({
    type: "invoice",
    data: s
  });
  const openAddExpense = () => {
    setForm({
      date: todayPK(),
      category: "",
      description: "",
      amount: "",
      currency: "PKR",
      vendor: "",
      paymentMethod: "Bank Transfer",
      status: "pending"
    });
    setModal({
      type: "addExpense"
    });
  };
  const openPaymentRecord = s => {
    setForm({
      studentId: s.id,
      amount: s.fee,
      date: todayPK(),
      gateway: s.gateway
    });
    setModal({
      type: "recordPay",
      data: s
    });
  };
  const savePayment = () => {
    recordPayment(form.studentId, Number(form.amount));
    setModal(null);
  };
  const saveExpense = () => {
    if (!form.category || !form.amount) return;
    if (form.editingExpId) {
      setExpenses(expenses.map(e => e.id === form.editingExpId ? {
        ...e,
        date: form.date,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        currency: form.currency,
        vendor: form.vendor,
        paymentMethod: form.paymentMethod,
        status: form.status,
        approvedBy: form.status === "paid" ? "Super Admin" : e.approvedBy
      } : e));
      setModal(null);
      return;
    }
    setExpenses([{
      id: Date.now(),
      ...form,
      amount: Number(form.amount),
      approvedBy: form.status === "paid" ? "Super Admin" : "Pending"
    }, ...expenses]);
    setModal(null);
  };
  const approveExpense = id => setExpenses(expenses.map(e => e.id === id ? {
    ...e,
    status: "paid",
    approvedBy: "Super Admin"
  } : e));
  const oEditExp = e => {
    setForm({
      editingExpId: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      vendor: e.vendor,
      paymentMethod: e.paymentMethod,
      status: e.status
    });
    setModal({
      type: "addExpense"
    });
  };
  const delExp = id => {
    if (confirm("Delete this expense permanently?")) setExpenses(expenses.filter(e => e.id !== id));
  };
  const sc3 = s => s === "paid" ? "success" : s === "overdue" ? "danger" : s === "partial" ? "warn" : "accent";
  const curSym = cur => cur === "USD" ? "$" : cur === "CAD" ? "C$" : cur === "GBP" ? "£" : cur === "PKR" ? "Rs" : "";
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
      flexWrap: "wrap",
      gap: 8
    }
  }, React.createElement("div", null, React.createElement("p", {
    style: {
      margin: 0,
      color: c.text,
      fontSize: 14,
      fontWeight: 600
    }
  }, "Finance & Accounting \u2014 ", new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  })), React.createElement("p", {
    style: {
      margin: "2px 0 0",
      color: c.textSec,
      fontSize: 11
    }
  }, "Monthly Revenue $", feeStats.monthlyRev.toLocaleString(), " \xB7 Collection ", feeStats.collRate, "% \xB7 ", feeStats.overdueCount, " overdue students")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("select", {
    value: displayCur,
    onChange: e => setDisplayCur(e.target.value),
    style: {
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 11
    }
  }, CURRENCIES.map(cr => React.createElement("option", {
    key: cr
  }, cr))), React.createElement("input", {
    type: "month",
    value: selectedMonth,
    onChange: e => setSelectedMonth(e.target.value),
    style: {
      padding: "8px 12px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12
    }
  }), React.createElement(Btn, {
    icon: Plus,
    onClick: openAddExpense
  }, "Add Expense"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(SC, {
    icon: TrendingUp,
    label: "Monthly Revenue",
    value: "$" + feeStats.monthlyRev.toLocaleString(),
    sub: feeStudents.length + " students",
    color: c.success
  }), React.createElement(SC, {
    icon: DollarSign,
    label: "Collected",
    value: "$" + feeStats.totalPaidUSD.toLocaleString(),
    sub: "This period",
    color: c.accent
  }), React.createElement(SC, {
    icon: AlertTriangle,
    label: "Outstanding",
    value: "$" + feeStats.totalDueUSD.toLocaleString(),
    sub: feeStats.overdueCount + " overdue",
    color: c.danger
  }), React.createElement(SC, {
    icon: CreditCard,
    label: "Expenses",
    value: "Rs " + (expStats.totalPKR / 1000).toFixed(0) + "K",
    sub: "Total this month",
    color: c.warn
  }), React.createElement(SC, {
    icon: Award,
    label: "Net Profit",
    value: "$" + (feeStats.monthlyRev - Math.round(expStats.totalPKR / EXCHANGE_RATE.USD)).toLocaleString(),
    color: c.purple
  }), React.createElement(SC, {
    icon: Check,
    label: "Collection Rate",
    value: feeStats.collRate + "%",
    sub: "ARPS $" + feeStats.arps,
    color: feeStats.collRate >= 85 ? c.success : c.warn
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 14,
      flexWrap: "wrap"
    }
  }, [["dashboard", "Dashboard"], ["fees", "Student Fees"], ["invoices", "Invoices"], ["income", "Income"], ["expenses", "Expenses"], ["pnl", "P&L Statement"], ["cashflow", "Cash Flow"], ["reports", "Reports"]].map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      padding: "7px 12px",
      borderRadius: 6,
      border: tab === k ? "1px solid transparent" : "1px solid " + c.border,
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 500,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), tab === "dashboard" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Revenue vs Expenses (Last 6 Months)"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 240
  }, React.createElement(AreaChart, {
    data: trendData
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    dataKey: "month",
    stroke: c.textMuted,
    fontSize: 10
  }), React.createElement(YAxis, {
    stroke: c.textMuted,
    fontSize: 10,
    tickFormatter: v => "$" + (v / 1000).toFixed(0) + "K"
  }), React.createElement(Tooltip, {
    contentStyle: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 8,
      fontSize: 11,
      color: c.text
    },
    formatter: v => "$" + v.toLocaleString()
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "income",
    stroke: c.success,
    fill: c.successBg,
    strokeWidth: 2,
    name: "Income"
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "expense",
    stroke: c.danger,
    fill: c.dangerBg,
    strokeWidth: 2,
    name: "Expenses"
  })))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Expense Breakdown"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 240
  }, React.createElement(PieChart, null, React.createElement(Pie, {
    data: expStats.byCat.map(([k, v]) => ({
      name: k,
      value: Math.round(v / 1000)
    })),
    cx: "50%",
    cy: "50%",
    outerRadius: 75,
    innerRadius: 40,
    dataKey: "value",
    label: ({
      name,
      percent
    }) => name.substring(0, 10) + " " + (percent * 100).toFixed(0) + "%",
    fontSize: 8
  }, expStats.byCat.map((_, i) => React.createElement(Cell, {
    key: i,
    fill: CC[i % CC.length]
  }))))))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Net Profit Trend"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200
  }, React.createElement(BarChart, {
    data: trendData
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    dataKey: "month",
    stroke: c.textMuted,
    fontSize: 10
  }), React.createElement(YAxis, {
    stroke: c.textMuted,
    fontSize: 10
  }), React.createElement(Tooltip, {
    contentStyle: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 8,
      fontSize: 11,
      color: c.text
    },
    formatter: v => "$" + v.toLocaleString()
  }), React.createElement(Bar, {
    dataKey: "profit",
    radius: [4, 4, 0, 0]
  }, trendData.map((d, i) => React.createElement(Cell, {
    key: i,
    fill: d.profit >= 0 ? c.success : c.danger
  })))))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Top Defaulters"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, feeStudents.filter(s => s.dueAmount > 0).sort((a, b) => b.dueAmount - a.dueAmount).slice(0, 6).map((s, i) => React.createElement("div", {
    key: s.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: 700,
      width: 18
    }
  }, "#", i + 1), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, s.name), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, s.parent, " \xB7 Last paid ", s.lastPaid)), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 12,
      fontWeight: 700
    }
  }, curSym(s.currency), s.dueAmount)))))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10
    }
  }, [["Avg Revenue/Student", "$" + feeStats.arps, c.success], ["Active Students", feeStudents.length, c.accent], ["Overdue", feeStats.overdueCount, c.danger], ["Partial Payments", feeStats.partialCount, c.warn], ["Countries", [...new Set(feeStudents.map(s => s.country))].length, c.purple], ["Gateways", PAY_GATEWAYS.length - 1, c.cyan]].map(([l, v, col]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 8,
      padding: "10px 14px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase"
    }
  }, l), React.createElement("div", {
    style: {
      color: col,
      fontSize: 18,
      fontWeight: 700
    }
  }, v))))), tab === "fees" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
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
    placeholder: "Search student or parent...",
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
  })), React.createElement("select", {
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
  }, "All Status"), React.createElement("option", {
    value: "paid"
  }, "Paid"), React.createElement("option", {
    value: "overdue"
  }, "Overdue"), React.createElement("option", {
    value: "partial"
  }, "Partial")), React.createElement("select", {
    value: fCourse,
    onChange: e => setFCourse(e.target.value),
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
  }, "All Courses"), Object.keys(FEE_PLANS).map(fp => React.createElement("option", {
    key: fp,
    value: fp
  }, fp))), React.createElement(Btn, {
    icon: AlertTriangle,
    variant: "outline",
    onClick: () => {
      const overdue = feeStudents.filter(s => s.feeStatus === "overdue").length;
      if (overdue === 0) {
        alert("No students with overdue fees right now.");
        return;
      }
      if (confirm("Send fee reminder to " + overdue + " student(s) with overdue fees?\n\nReminders will be sent via email and SMS.")) alert(overdue + " reminder(s) sent successfully.");
    }
  }, "Bulk Reminder")), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Student", "Parent", "Course", "Fee", "Currency", "Months Paid", "Total Paid", "Due", "Last Paid", "Gateway", "Status", "Actions"].map(h => React.createElement("th", {
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
      whiteSpace: "nowrap"
    }
  }, h)))), React.createElement("tbody", null, filteredFees.map((s, i) => React.createElement("tr", {
    key: s.id,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "8px",
      fontWeight: 600
    }
  }, React.createElement("div", null, s.name), s.family ? React.createElement("div", {
    style: {
      display: "inline-block",
      fontSize: 8,
      padding: "1px 6px",
      borderRadius: 8,
      background: c.accentBg,
      color: c.accent,
      marginTop: 3,
      fontWeight: 500
    }
  }, "\uD83D\uDC65 " + s.family) : null), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.parent), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: s.course.length > 12 ? s.course.substring(0, 10) + ".." : s.course,
    color: "accent"
  })), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.accent,
      fontWeight: 700
    }
  }, curSym(s.currency), s.fee), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.currency), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.text
    }
  }, s.monthsPaid), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.success,
      fontWeight: 600
    }
  }, curSym(s.currency), s.totalPaid), React.createElement("td", {
    style: {
      padding: "8px",
      color: s.dueAmount > 0 ? c.danger : c.textMuted,
      fontWeight: 700
    }
  }, s.dueAmount > 0 ? curSym(s.currency) + s.dueAmount : "—"), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.lastPaid), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.gateway), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: s.status,
    color: sc3(s.status)
  })), React.createElement("td", {
    style: {
      padding: "8px",
      whiteSpace: "nowrap"
    }
  }, React.createElement("button", {
    onClick: () => openPaymentRecord(s),
    title: "Record Payment",
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.success
    }
  }, React.createElement(DollarSign, {
    size: 13
  })), React.createElement("button", {
    onClick: () => openInvoice(s),
    title: "View Invoice",
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.accent
    }
  }, React.createElement(Eye, {
    size: 13
  })), React.createElement("button", {
    onClick: () => sendReminder(s.id),
    title: "Send Reminder",
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.warn
    }
  }, React.createElement(AlertTriangle, {
    size: 13
  }))))))))), tab === "invoices" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
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
    placeholder: "Search invoice...",
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
  })), React.createElement(Btn, {
    icon: Plus,
    onClick: () => {
      const num = "INV-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000);
      alert("Invoice " + num + " generated.\nCustomize via Invoice Templates in Settings.");
    }
  }, "Generate Invoice")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
      gap: 10
    }
  }, feeStudents.slice(0, 12).map(s => React.createElement("div", {
    key: s.id,
    onClick: () => openInvoice(s),
    style: {
      background: c.bgCard,
      border: "1px solid " + (s.status === "overdue" ? c.danger + "44" : s.status === "paid" ? c.success + "44" : c.warn + "44"),
      borderRadius: 10,
      padding: "12px 14px",
      cursor: "pointer"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      fontFamily: "monospace"
    }
  }, "INV-", String(s.id).padStart(4, "0")), React.createElement(Badge, {
    text: s.status,
    color: sc3(s.status)
  })), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 2
    }
  }, s.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginBottom: 8
    }
  }, s.parent, " \xB7 ", s.course), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, "Amount"), React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 16,
      fontWeight: 700
    }
  }, curSym(s.currency), s.fee)), React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, "Due"), React.createElement("div", {
    style: {
      color: s.dueAmount > 0 ? c.danger : c.textMuted,
      fontSize: 13,
      fontWeight: 700
    }
  }, s.dueAmount > 0 ? curSym(s.currency) + s.dueAmount : "—"))), React.createElement("div", {
    style: {
      marginTop: 8,
      paddingTop: 8,
      borderTop: "1px solid " + c.border,
      color: c.textMuted,
      fontSize: 9
    }
  }, "Last paid: ", s.lastPaid, " via ", s.gateway))))), tab === "income" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Income Streams"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
      gap: 8
    }
  }, [["Monthly Fees", "$" + feeStats.monthlyRev.toLocaleString(), c.success, feeStudents.length + " students"], ["Registration", "$0", c.accent, "0 new this month"], ["Certificates", "$0", c.purple, "0 issued"], ["Donations", "$0", c.cyan, "0 received"]].map(([l, v, col, sub]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgDeep,
      border: "1px solid " + col + "44",
      borderRadius: 8,
      padding: "10px 12px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, l), React.createElement("div", {
    style: {
      color: col,
      fontSize: 16,
      fontWeight: 700
    }
  }, v), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2
    }
  }, sub))))), React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Recent Payments Received"), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Date", "Student", "Parent", "Course", "Amount", "Currency", "Gateway", "Status"].map(h => React.createElement("th", {
    key: h,
    style: {
      padding: "9px 8px",
      textAlign: "left",
      color: c.textSec,
      fontWeight: 600,
      fontSize: 9,
      textTransform: "uppercase",
      borderBottom: "1px solid " + c.border,
      background: c.bgDeep
    }
  }, h)))), React.createElement("tbody", null, feeStudents.filter(s => s.status === "paid" || s.status === "partial").sort((a, b) => new Date(b.lastPaid) - new Date(a.lastPaid)).slice(0, 15).map((s, i) => React.createElement("tr", {
    key: s.id,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "8px",
      color: c.accent,
      fontSize: 10
    }
  }, s.lastPaid), React.createElement("td", {
    style: {
      padding: "8px",
      fontWeight: 600
    }
  }, React.createElement("div", null, s.name), s.family ? React.createElement("div", {
    style: {
      display: "inline-block",
      fontSize: 8,
      padding: "1px 6px",
      borderRadius: 8,
      background: c.accentBg,
      color: c.accent,
      marginTop: 3,
      fontWeight: 500
    }
  }, "\uD83D\uDC65 " + s.family) : null), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.parent), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.course), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.success,
      fontWeight: 700
    }
  }, curSym(s.currency), s.fee), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.currency), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.gateway), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: s.status,
    color: sc3(s.status)
  })))))))), tab === "expenses" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
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
    placeholder: "Search expense...",
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
  })), React.createElement("select", {
    value: fCat,
    onChange: e => setFCat(e.target.value),
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
  }, "All Categories"), EXPENSE_CATS.map(ec => React.createElement("option", {
    key: ec,
    value: ec
  }, ec))), React.createElement(Btn, {
    icon: Plus,
    onClick: openAddExpense
  }, "Add Expense")), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Date", "Category", "Description", "Vendor", "Amount", "Currency", "In PKR", "Method", "Status", "Approved By", "Actions"].map(h => React.createElement("th", {
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
      whiteSpace: "nowrap"
    }
  }, h)))), React.createElement("tbody", null, filteredExp.map((e, i) => React.createElement("tr", {
    key: e.id,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "8px",
      color: c.accent,
      fontSize: 10
    }
  }, e.date), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: e.category,
    color: e.category.includes("Salaries") ? "danger" : e.category.includes("Rent") ? "warn" : e.category.includes("Marketing") ? "purple" : "accent"
  })), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.text,
      fontSize: 10
    }
  }, e.description), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, e.vendor), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.text,
      fontWeight: 700
    }
  }, curSym(e.currency), e.amount.toLocaleString()), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, e.currency), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.danger,
      fontWeight: 600
    }
  }, "Rs ", (e.amount * EXCHANGE_RATE[e.currency]).toLocaleString()), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, e.paymentMethod), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: e.status,
    color: e.status === "paid" ? "success" : "warn"
  })), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, e.approvedBy), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, e.status === "pending" && React.createElement("button", {
    onClick: () => approveExpense(e.id),
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 4,
      cursor: "pointer",
      padding: "3px 8px",
      color: c.success,
      fontSize: 9,
      fontWeight: 600
    }
  }, "Approve"), React.createElement("button", {
    onClick: () => oEditExp(e),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.purple
    },
    title: "Edit Expense"
  }, React.createElement(Edit2, {
    size: 13
  })), React.createElement("button", {
    onClick: () => delExp(e.id),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.danger
    },
    title: "Delete Expense"
  }, React.createElement(Trash2, {
    size: 13
  })))))))))), tab === "pnl" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 24
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      margin: "0 0 4px",
      fontSize: 18,
      fontWeight: 700,
      textAlign: "center"
    }
  }, "PROFIT & LOSS STATEMENT"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      textAlign: "center",
      margin: "0 0 20px"
    }
  }, "LLQA Academy \xB7 For the month of ", new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  })), React.createElement("div", {
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.success,
      margin: "0 0 10px",
      fontSize: 14,
      fontWeight: 700
    }
  }, "REVENUE"), [["Monthly Student Fees", feeStats.monthlyRev, "USD"], ["Registration Fees", 0, "USD"], ["Certificate Fees", 0, "USD"], ["Donations", 0, "USD"]].map(([l, v]) => React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 12
    }
  }, l), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, "$", v.toLocaleString()))), React.createElement("div", {
    style: {
      borderTop: "1px solid " + c.success + "44",
      marginTop: 10,
      paddingTop: 10,
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 700
    }
  }, "Total Revenue"), React.createElement("span", {
    style: {
      color: c.success,
      fontSize: 16,
      fontWeight: 700
    }
  }, "$", feeStats.monthlyRev.toLocaleString()))), React.createElement("div", {
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.danger,
      margin: "0 0 10px",
      fontSize: 14,
      fontWeight: 700
    }
  }, "EXPENSES"), expStats.byCat.map(([cat, amt]) => React.createElement("div", {
    key: cat,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 12
    }
  }, cat), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, "Rs ", amt.toLocaleString(), " ($", Math.round(amt / EXCHANGE_RATE.USD).toLocaleString(), ")"))), React.createElement("div", {
    style: {
      borderTop: "1px solid " + c.danger + "44",
      marginTop: 10,
      paddingTop: 10,
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 700
    }
  }, "Total Expenses"), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 16,
      fontWeight: 700
    }
  }, "$", Math.round(expStats.totalPKR / EXCHANGE_RATE.USD).toLocaleString()))), React.createElement("div", {
    style: {
      background: "linear-gradient(135deg," + c.accent + "22," + c.purple + "22)",
      border: "2px solid " + c.accent,
      borderRadius: 10,
      padding: "16px 20px",
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6
    }
  }, "NET PROFIT / LOSS"), React.createElement("div", {
    style: {
      color: feeStats.monthlyRev - Math.round(expStats.totalPKR / EXCHANGE_RATE.USD) >= 0 ? c.success : c.danger,
      fontSize: 32,
      fontWeight: 800
    }
  }, "$", (feeStats.monthlyRev - Math.round(expStats.totalPKR / EXCHANGE_RATE.USD)).toLocaleString()), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 4
    }
  }, "Operating Margin: ", Math.round((feeStats.monthlyRev - Math.round(expStats.totalPKR / EXCHANGE_RATE.USD)) / feeStats.monthlyRev * 100), "%")), React.createElement("div", {
    style: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 9,
      marginTop: 12,
      paddingTop: 10,
      borderTop: "1px solid " + c.border
    }
  }, "LLQA Academy \xB7 Generated on ", new Date().toLocaleDateString(), " \xB7 Exchange rate: 1 USD = Rs ", EXCHANGE_RATE.USD))), tab === "cashflow" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Monthly Cash Flow Forecast (6 Months)"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 280
  }, React.createElement(AreaChart, {
    data: trendData
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    dataKey: "month",
    stroke: c.textMuted,
    fontSize: 10
  }), React.createElement(YAxis, {
    stroke: c.textMuted,
    fontSize: 10,
    tickFormatter: v => "$" + (v / 1000).toFixed(0) + "K"
  }), React.createElement(Tooltip, {
    contentStyle: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 8,
      fontSize: 11,
      color: c.text
    },
    formatter: v => "$" + v.toLocaleString()
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "income",
    stroke: c.success,
    fill: c.successBg,
    strokeWidth: 2,
    name: "Income"
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "expense",
    stroke: c.danger,
    fill: c.dangerBg,
    strokeWidth: 2,
    name: "Expenses"
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "profit",
    stroke: c.accent,
    fill: c.accentBg,
    strokeWidth: 2,
    name: "Net"
  })))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Budget vs Actual (This Month)"), [["Teacher Salaries", 1320000, 1300000], ["Rent & Utilities", 65000, 65000], ["Marketing", 80000, 42000], ["Software", 30000, 23800], ["Admin Staff", 180000, 180000], ["Equipment", 50000, 18000]].map(([l, b, a]) => {
    const pct = Math.round(a / b * 100);
    return React.createElement("div", {
      key: l,
      style: {
        marginBottom: 8
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 3,
        fontSize: 10
      }
    }, React.createElement("span", {
      style: {
        color: c.textSec
      }
    }, l), React.createElement("span", {
      style: {
        color: pct > 100 ? c.danger : pct >= 90 ? c.warn : c.success,
        fontWeight: 600
      }
    }, pct, "%")), React.createElement("div", {
      style: {
        display: "flex",
        gap: 2
      }
    }, React.createElement("div", {
      style: {
        flex: Math.min(pct, 100),
        height: 6,
        background: pct > 100 ? c.danger : pct >= 90 ? c.warn : c.success,
        borderRadius: "3px 0 0 3px"
      }
    }), pct < 100 && React.createElement("div", {
      style: {
        flex: 100 - pct,
        height: 6,
        background: c.border,
        borderRadius: "0 3px 3px 0"
      }
    })), React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: 2,
        fontSize: 9,
        color: c.textMuted
      }
    }, React.createElement("span", null, "Actual Rs ", a.toLocaleString()), React.createElement("span", null, "Budget Rs ", b.toLocaleString())));
  })), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Cash Position"), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "12px 14px",
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "Opening Balance (April)"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 20,
      fontWeight: 700
    }
  }, "Rs 485,000")), React.createElement("div", {
    style: {
      background: c.successBg,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 6
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "+ Cash Inflow"), React.createElement("span", {
    style: {
      color: c.success,
      fontSize: 13,
      fontWeight: 700
    }
  }, "Rs ", (feeStats.monthlyRev * EXCHANGE_RATE.USD).toLocaleString()))), React.createElement("div", {
    style: {
      background: c.dangerBg,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "\u2212 Cash Outflow"), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 13,
      fontWeight: 700
    }
  }, "Rs ", expStats.totalPKR.toLocaleString()))), React.createElement("div", {
    style: {
      background: c.accentBg,
      border: "2px solid " + c.accent,
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "Closing Balance"), React.createElement("div", {
    style: {
      color: c.accent,
      fontSize: 22,
      fontWeight: 800
    }
  }, "Rs ", (485000 + feeStats.monthlyRev * EXCHANGE_RATE.USD - expStats.totalPKR).toLocaleString()))))), tab === "reports" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Currency Converter"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginBottom: 10
    }
  }, "Live rates (updated: Today)"), [["USD → PKR", EXCHANGE_RATE.USD], ["CAD → PKR", EXCHANGE_RATE.CAD], ["GBP → PKR", EXCHANGE_RATE.GBP]].map(([l, r]) => React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 12px",
      marginBottom: 5
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, l), React.createElement("span", {
    style: {
      color: c.accent,
      fontSize: 13,
      fontWeight: 700
    }
  }, r))), React.createElement("div", {
    style: {
      marginTop: 10,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 10
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginBottom: 4
    }
  }, "Quick Convert"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11
    }
  }, "$1,000 = Rs ", (1000 * EXCHANGE_RATE.USD).toLocaleString()), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11
    }
  }, "$5,000 = Rs ", (5000 * EXCHANGE_RATE.USD).toLocaleString()), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11
    }
  }, "$10,000 = Rs ", (10000 * EXCHANGE_RATE.USD).toLocaleString()))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Key Financial Ratios"), [["Revenue per Student", "$" + feeStats.arps, c.success], ["Expense Ratio", Math.round(expStats.totalPKR / EXCHANGE_RATE.USD / feeStats.monthlyRev * 100) + "%", c.warn], ["Operating Margin", Math.round((feeStats.monthlyRev - Math.round(expStats.totalPKR / EXCHANGE_RATE.USD)) / feeStats.monthlyRev * 100) + "%", c.purple], ["Collection Rate", feeStats.collRate + "%", feeStats.collRate >= 85 ? c.success : c.warn], ["Defaulter Rate", Math.round(feeStats.overdueCount / feeStudents.length * 100) + "%", c.danger], ["Monthly Growth", "+8.5%", c.cyan]].map(([l, v, col]) => React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 12px",
      marginBottom: 5
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, l), React.createElement("span", {
    style: {
      color: col,
      fontSize: 13,
      fontWeight: 700
    }
  }, v))))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Export Reports"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: 10
    }
  }, [["Monthly P&L", "pdf"], ["Fee Collection", "excel"], ["Expense Report", "pdf"], ["Income Statement", "pdf"], ["Tax Summary", "pdf"], ["Student Invoices", "zip"], ["Vendor Payments", "excel"], ["Year-to-Date Summary", "pdf"]].map(([name, fmt]) => React.createElement("button", {
    key: name,
    onClick: () => {
      alert("Filtered by category: " + name);
    },
    style: {
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 8,
      cursor: "pointer",
      padding: "12px 14px",
      color: c.text,
      textAlign: "left"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 2
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600
    }
  }, name), React.createElement(Badge, {
    text: fmt.toUpperCase(),
    color: "accent"
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9
    }
  }, "Click to download")))))), modal && modal.type === "invoice" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
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
      marginBottom: 16,
      paddingBottom: 14,
      borderBottom: "2px solid " + c.accent
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    }
  }, React.createElement(BookOpen, {
    size: 20,
    color: c.accent
  }), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 18,
      fontWeight: 700
    }
  }, "LLQA Academy")), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Invoice INV-", String(modal.data.id).padStart(4, "0"))), React.createElement("button", {
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
      gap: 14,
      marginBottom: 16
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Bill To"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 700
    }
  }, modal.data.parent), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Student: ", modal.data.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, modal.data.country, " \xB7 ", modal.data.state)), React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Invoice Date"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 600
    }
  }, new Date().toLocaleDateString()), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 4
    }
  }, "Due: Monthly Recurring"))), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: 14,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      borderBottom: "1px solid " + c.border,
      paddingBottom: 8,
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase"
    }
  }, "Description"), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase"
    }
  }, "Amount")), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, modal.data.course), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "Monthly tuition")), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 600
    }
  }, curSym(modal.data.currency), modal.data.fee))), React.createElement("div", {
    style: {
      background: "linear-gradient(135deg," + c.accent + "22," + c.purple + "22)",
      border: "2px solid " + c.accent,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "Total Amount"), React.createElement("div", {
    style: {
      color: c.accent,
      fontSize: 26,
      fontWeight: 800
    }
  }, curSym(modal.data.currency), modal.data.fee, ".00"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 3
    }
  }, modal.data.currency, " \xB7 via ", modal.data.gateway)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase"
    }
  }, "Status"), React.createElement(Badge, {
    text: modal.data.status,
    color: sc3(modal.data.status)
  })), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase"
    }
  }, "Last Paid"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11
    }
  }, modal.data.lastPaid)), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase"
    }
  }, "Months Paid"), React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 11,
      fontWeight: 700
    }
  }, modal.data.monthsPaid)), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase"
    }
  }, "Due"), React.createElement("div", {
    style: {
      color: modal.data.dueAmount > 0 ? c.danger : c.textMuted,
      fontSize: 11,
      fontWeight: 700
    }
  }, modal.data.dueAmount > 0 ? curSym(modal.data.currency) + modal.data.dueAmount : "None"))), React.createElement("div", {
    style: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 9,
      paddingTop: 10,
      borderTop: "1px solid " + c.border
    }
  }, "Thank you for choosing LLQA Academy \xB7 letslearnquran.net"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Close"), React.createElement(Btn, {
    icon: AlertTriangle,
    variant: "outline",
    onClick: () => {
      const studentName = s && s.name || "this student";
      alert("\u2713 Reminder sent to " + studentName + "\n\nDelivery: Email + SMS\nStatus: Queued for delivery");
    }
  }, "Send Reminder"), React.createElement(Btn, {
    icon: Download,
    onClick: () => {
      window.print && window.print();
    }
  }, "Download PDF")))), modal && modal.type === "recordPay" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
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
      width: 440
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, "Record Payment"), React.createElement("button", {
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
      background: c.successBg,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 12,
      color: c.success,
      fontSize: 11
    }
  }, "Student: ", modal.data.name, " \xB7 Monthly fee ", curSym(modal.data.currency), modal.data.fee), React.createElement(Inp, {
    label: "Amount Received *",
    value: form.amount || "",
    onChange: v => setForm({
      ...form,
      amount: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Payment Date",
    value: form.date || "",
    onChange: v => setForm({
      ...form,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Payment Gateway",
    value: form.gateway || "",
    onChange: v => setForm({
      ...form,
      gateway: v
    }),
    options: PAY_GATEWAYS
  }), React.createElement(Inp, {
    label: "Transaction ID",
    value: form.txnId || "",
    onChange: v => setForm({
      ...form,
      txnId: v
    }),
    placeholder: "Optional reference"
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 10
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    onClick: savePayment,
    icon: DollarSign
  }, "Record Payment")))), modal && modal.type === "addExpense" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
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
      width: 480
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, form.editingExpId ? "Edit Expense" : "Add Expense"), React.createElement("button", {
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
    label: "Date *",
    value: form.date || "",
    onChange: v => setForm({
      ...form,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Category *",
    value: form.category || "",
    onChange: v => setForm({
      ...form,
      category: v
    }),
    options: EXPENSE_CATS
  })), React.createElement(Inp, {
    label: "Description *",
    value: form.description || "",
    onChange: v => setForm({
      ...form,
      description: v
    }),
    placeholder: "e.g. March office rent"
  }), React.createElement(Inp, {
    label: "Vendor / Paid To",
    value: form.vendor || "",
    onChange: v => setForm({
      ...form,
      vendor: v
    }),
    placeholder: "Vendor name"
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Amount *",
    value: form.amount || "",
    onChange: v => setForm({
      ...form,
      amount: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Currency",
    value: form.currency || "",
    onChange: v => setForm({
      ...form,
      currency: v
    }),
    options: CURRENCIES
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Payment Method",
    value: form.paymentMethod || "",
    onChange: v => setForm({
      ...form,
      paymentMethod: v
    }),
    options: ["Bank Transfer", "Cash", "Credit Card", "JazzCash", "EasyPaisa", "Auto-pay"]
  }), React.createElement(Inp, {
    label: "Status",
    value: form.status || "",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: ["pending", "paid"]
  })), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 10
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    onClick: saveExpense,
    icon: Check
  }, "Save Expense")))));
};

