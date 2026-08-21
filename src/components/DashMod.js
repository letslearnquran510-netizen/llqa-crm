const DashMod = ({
  teachers,
  setPage,
  students
}) => {
  const at = teachers.filter(t => t.status === "active" || t.status === "new");
  const studentList = students || [];
  const activeStudents = studentList.filter(s => s.status === "active").length;
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      flexWrap: "wrap",
      gap: 8
    }
  }, React.createElement("div", null, React.createElement("p", {
    style: {
      margin: 0,
      color: c.text,
      fontSize: 16,
      fontWeight: 700
    }
  }, "Welcome back, Mohsin \uD83D\uDC4B"), React.createElement("p", {
    style: {
      margin: "2px 0 0",
      color: c.textSec,
      fontSize: 11
    }
  }, new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }), " \xB7 Here's what's happening at LLQA today")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setPage && setPage("attendance"),
    style: {
      padding: "8px 14px",
      background: c.accentBg,
      border: "1px solid " + c.accent + "44",
      borderRadius: 7,
      cursor: "pointer",
      color: c.accent,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Mark Attendance"), React.createElement("button", {
    onClick: () => setPage && setPage("students"),
    style: {
      padding: "8px 14px",
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 7,
      cursor: "pointer",
      color: c.success,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Log Progress"), React.createElement("button", {
    onClick: () => setPage && setPage("finance"),
    style: {
      padding: "8px 14px",
      background: c.purpleBg,
      border: "1px solid " + c.purple + "44",
      borderRadius: 7,
      cursor: "pointer",
      color: c.purple,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Record Payment"))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
      gap: 10,
      marginBottom: 16
    }
  }, [{
    label: "Quran Teachers",
    value: at.length,
    sub: at.filter(t => t.gender === "Male").length + "M · " + at.filter(t => t.gender === "Female").length + "F",
    icon: Users,
    col: c.accent,
    page: "teachers"
  }, {
    label: "Subject Teachers",
    value: 8,
    sub: "Math, Eng, Sci, Coding",
    icon: GraduationCap,
    col: c.purple,
    page: "subjects"
  }, {
    label: "Active Students",
    value: activeStudents,
    sub: "USA · CA · UK",
    icon: BookOpen,
    col: c.success,
    page: "students"
  }, {
    label: "Free Slots",
    value: at.reduce((s, t) => s + computeFree(t).free, 0),
    sub: "Ready for booking",
    icon: Clock,
    col: c.warn,
    page: "timetable"
  }, {
    label: "Monthly Revenue",
    value: "$" + studentList.reduce((sum, s) => {
      const a = parseFloat(s.fee_amount) || 0;
      return sum + a;
    }, 0).toLocaleString(),
    sub: "Sum of student fees",
    icon: DollarSign,
    col: c.success,
    page: "finance"
  }, {
    label: "Payroll Due",
    value: "Rs 1.4M",
    sub: "Apr 2026",
    icon: CreditCard,
    col: c.cyan,
    page: "payroll"
  }, {
    label: "Present Today",
    value: "32/38",
    sub: "6 not marked",
    icon: Check,
    col: c.success,
    page: "attendance"
  }, {
    label: "Fee Overdue",
    value: "3",
    sub: "Follow-up needed",
    icon: AlertTriangle,
    col: c.danger,
    page: "finance"
  }].map((s, i) => React.createElement("div", {
    key: i,
    onClick: () => setPage && setPage(s.page),
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: "14px 16px",
      cursor: "pointer",
      transition: "border-color .2s"
    },
    onMouseEnter: e => e.currentTarget.style.borderColor = s.col,
    onMouseLeave: e => e.currentTarget.style.borderColor = c.border
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6
    }
  }, React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      background: s.col + "22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(s.icon, {
    size: 16,
    color: s.col
  }))), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 20,
      fontWeight: 800
    }
  }, s.value), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, s.label), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 3
    }
  }, s.sub)))), React.createElement("div", {
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
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Revenue vs Expenses"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200
  }, React.createElement(AreaChart, {
    data: revData
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
    tickFormatter: v => v / 1000 + "K"
  }), React.createElement(Tooltip, {
    contentStyle: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 8,
      fontSize: 11,
      color: c.text
    }
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "income",
    stroke: c.accent,
    fill: c.accentBg,
    strokeWidth: 2
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "expense",
    stroke: c.danger,
    fill: c.dangerBg,
    strokeWidth: 2
  })))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Course Distribution"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200
  }, React.createElement(PieChart, null, React.createElement(Pie, {
    data: courseDistro,
    cx: "50%",
    cy: "50%",
    outerRadius: 70,
    innerRadius: 38,
    dataKey: "value",
    label: ({
      name,
      percent
    }) => name + " " + (percent * 100).toFixed(0) + "%",
    fontSize: 9
  }, courseDistro.map((_, i) => React.createElement(Cell, {
    key: i,
    fill: CC[i]
  }))))))), React.createElement("div", {
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
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Teacher Breakdown"), [["Male IBA", at.filter(t => t.gender === "Male" && t.location === "IBA").length, c.accent], ["Male WFH", at.filter(t => t.gender === "Male" && t.location === "WFH").length, c.cyan], ["Female IBA", at.filter(t => t.gender === "Female" && t.location === "IBA").length, c.purple], ["Female WFH", at.filter(t => t.gender === "Female" && t.location === "WFH").length, c.success]].map(([l, v, col]) => React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 10px",
      background: c.bgDeep,
      borderRadius: 6,
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 12
    }
  }, l), React.createElement("span", {
    style: {
      color: col,
      fontSize: 16,
      fontWeight: 700
    }
  }, v)))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Enrollments"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 160
  }, React.createElement(BarChart, {
    data: enrollData
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
    }
  }), React.createElement(Bar, {
    dataKey: "count",
    fill: c.success,
    radius: [4, 4, 0, 0]
  }))))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginTop: 14
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Clock, {
    size: 14,
    color: c.accent
  }), " Recent Activity"), [{
    t: "Fanan's lesson logged by Hafiz Abdullah",
    d: "Surah Al-Imran ayah 45-52",
    time: "2 min ago",
    col: c.success,
    ic: Check
  }, {
    t: "Payment received — Kenane & Loay",
    d: "$140 via Zelle from Kevin",
    time: "15 min ago",
    col: c.success,
    ic: DollarSign
  }, {
    t: "Class Shift: Shayan → Abdullah Waseem",
    d: "Reason: Shayan resigned · 3 students moved",
    time: "1 hour ago",
    col: c.warn,
    ic: ArrowRightLeft
  }, {
    t: "New enrollment: Sana Nasiri",
    d: "EN-Quaida with Qaria Arooj · USA/NY",
    time: "3 hours ago",
    col: c.accent,
    ic: UserPlus
  }, {
    t: "Attendance regularized — Qari Haris",
    d: "Admin changed Late to Present",
    time: "5 hours ago",
    col: c.purple,
    ic: Edit2
  }, {
    t: "Fee reminder sent to Hanzala",
    d: "Overdue since March · $135 due",
    time: "yesterday",
    col: c.danger,
    ic: AlertTriangle
  }].map((a, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      padding: "8px 0",
      borderBottom: i < 5 ? "1px solid " + c.border : "none"
    }
  }, React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: a.col + "22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, React.createElement(a.ic, {
    size: 13,
    color: a.col
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, a.t), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, a.d), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2
    }
  }, a.time))))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(AlertTriangle, {
    size: 14,
    color: c.warn
  }), " Action Items"), [{
    t: "3 students fee overdue",
    d: "Eltaf ($90), Nubair ($135), Hanzala ($135)",
    col: c.danger,
    page: "finance",
    pri: "High"
  }, {
    t: "6 teachers not marked attendance",
    d: "Today's shift — please mark before 9 PM PKT",
    col: c.warn,
    page: "attendance",
    pri: "Urgent"
  }, {
    t: "5 SPS reports pending",
    d: "Class shifts need student progress sheets",
    col: c.warn,
    page: "shifting",
    pri: "Medium"
  }, {
    t: "Payroll approval needed",
    d: "32 teacher payments pending — Rs 1.4M total",
    col: c.accent,
    page: "payroll",
    pri: "High"
  }, {
    t: "3 leave requests to review",
    d: "Teachers requesting leave this week",
    col: c.purple,
    page: "teachers",
    pri: "Medium"
  }].map((a, i) => React.createElement("div", {
    key: i,
    onClick: () => setPage && setPage(a.page),
    style: {
      display: "flex",
      gap: 10,
      padding: "8px 0",
      borderBottom: i < 4 ? "1px solid " + c.border : "none",
      cursor: "pointer"
    }
  }, React.createElement("div", {
    style: {
      width: 4,
      borderRadius: 2,
      background: a.col
    }
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, a.t), React.createElement("span", {
    style: {
      fontSize: 8,
      padding: "1px 6px",
      borderRadius: 3,
      background: a.col + "22",
      color: a.col,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, a.pri)), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, a.d)))))));
};

