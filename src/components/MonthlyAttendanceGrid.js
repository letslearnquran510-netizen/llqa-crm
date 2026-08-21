const MonthlyAttendanceGrid = ({
  students,
  setStudents
}) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [search, setSearch] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({
    length: daysInMonth
  }, (_, i) => i + 1);
  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });
  const monthKey = d => year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const todayCheck = new Date();
  const todayDay = todayCheck.getFullYear() === year && todayCheck.getMonth() === month ? todayCheck.getDate() : -1;
  const activeStudents = (students || []).filter(s => s.status === "active");
  const teacherOpts = ["all", ...Array.from(new Set(activeStudents.map(s => s.teacher).filter(Boolean))).sort()];
  let filtered = activeStudents;
  if (filterTeacher !== "all") filtered = filtered.filter(s => s.teacher === filterTeacher);
  if (search) {
    const ql = search.toLowerCase();
    filtered = filtered.filter(s => [s.name, s.code, s.parent].some(v => String(v || "").toLowerCase().includes(ql)));
  }
  const statusColor = st => st === "present" ? c.success : st === "absent" ? c.danger : st === "late" ? c.warn : st === "leave" ? c.accent : null;
  const statusLetter = st => st === "present" ? "P" : st === "absent" ? "A" : st === "late" ? "L" : st === "leave" ? "V" : "";
  const cycleNext = cur => {
    const order = [null, "present", "absent", "late", "leave"];
    return order[(order.indexOf(cur) + 1) % order.length];
  };
  const isWeekend = d => {
    const dt = new Date(year, month, d).getDay();
    return dt === 0 || dt === 6;
  };
  const dayLetter = d => ["S", "M", "T", "W", "T", "F", "S"][new Date(year, month, d).getDay()];
  const onCellClick = (student, d) => {
    const dk = monthKey(d);
    const cur = (student.attendanceLog || {})[dk];
    const next = cycleNext(cur);
    const newLog = {
      ...(student.attendanceLog || {})
    };
    if (next === null) delete newLog[dk];else newLog[dk] = next;
    setStudents(students.map(s => s.id === student.id ? {
      ...s,
      attendanceLog: newLog
    } : s));
  };
  const markColumnPresent = d => {
    const dk = monthKey(d);
    const fids = new Set(filtered.map(f => f.id));
    setStudents(students.map(s => {
      if (!fids.has(s.id)) return s;
      return {
        ...s,
        attendanceLog: {
          ...(s.attendanceLog || {}),
          [dk]: "present"
        }
      };
    }));
  };
  const rowSummary = student => {
    const log = student.attendanceLog || {};
    const prefix = year + "-" + String(month + 1).padStart(2, "0");
    let p = 0,
      a = 0,
      l = 0,
      v = 0;
    Object.keys(log).forEach(k => {
      if (k.indexOf(prefix) === 0) {
        if (log[k] === "present") p++;else if (log[k] === "absent") a++;else if (log[k] === "late") l++;else if (log[k] === "leave") v++;
      }
    });
    const total = p + a + l + v;
    const pct = total > 0 ? Math.round((p + l * 0.5) / total * 100) : 0;
    return {
      p,
      a,
      l,
      v,
      total,
      pct
    };
  };
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  };
  const exportCSV = () => {
    let csvText = "Student,Code,Teacher," + days.join(",") + ",Present,Absent,Late,Leave,Att%\n";
    filtered.forEach(s => {
      const cells = days.map(d => statusLetter((s.attendanceLog || {})[monthKey(d)]));
      const sum = rowSummary(s);
      const safe = v => '"' + String(v || "").split('"').join('""') + '"';
      csvText += [safe(s.name), s.code, safe(s.teacher), ...cells, sum.p, sum.a, sum.l, sum.v, sum.pct + "%"].join(",") + "\n";
    });
    const blob = new Blob([csvText], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monthly-attendance-" + year + "-" + String(month + 1).padStart(2, "0") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const todayPresent = activeStudents.filter(s => (s.attendanceLog || {})[monthKey(todayDay)] === "present").length;
  const todayAbsent = activeStudents.filter(s => (s.attendanceLog || {})[monthKey(todayDay)] === "absent").length;
  const todayLate = activeStudents.filter(s => (s.attendanceLog || {})[monthKey(todayDay)] === "late").length;
  const navBtnStyle = {
    padding: "6px 12px",
    background: c.bgDeep,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 5
  };
  const monthBoxStyle = {
    padding: "6px 14px",
    background: c.bgDeep,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 12,
    fontWeight: 700,
    minWidth: 130,
    textAlign: "center"
  };
  const inputStyle = {
    width: "100%",
    padding: "7px 10px 7px 30px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 11,
    outline: "none",
    boxSizing: "border-box"
  };
  const selStyle = {
    padding: "7px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 11,
    cursor: "pointer"
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("button", {
    onClick: prevMonth,
    style: navBtnStyle,
    title: "Previous month"
  }, React.createElement(ChevronLeft, {
    size: 14
  })), React.createElement("div", {
    style: monthBoxStyle
  }, monthName), React.createElement("button", {
    onClick: nextMonth,
    style: navBtnStyle,
    title: "Next month"
  }, React.createElement(ChevronRight, {
    size: 14
  })), React.createElement("button", {
    onClick: goToday,
    style: {
      ...navBtnStyle,
      marginLeft: 6
    }
  }, React.createElement(Calendar, {
    size: 12
  }), "Today")), React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 200,
      maxWidth: 280
    }
  }, React.createElement(Search, {
    size: 13,
    style: {
      position: "absolute",
      left: 9,
      top: 9,
      color: c.textMuted
    }
  }), React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search student / code / parent...",
    style: inputStyle
  })), React.createElement("select", {
    value: filterTeacher,
    onChange: e => setFilterTeacher(e.target.value),
    style: selStyle
  }, teacherOpts.map(t => React.createElement("option", {
    key: t,
    value: t
  }, t === "all" ? "All Teachers" : t))), React.createElement("button", {
    onClick: exportCSV,
    style: navBtnStyle,
    title: "Export to CSV"
  }, React.createElement(Download, {
    size: 12
  }), "Export CSV")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 12
    }
  }, [["Students Visible", filtered.length, c.accent, Users], ["Today \u00B7 Present", todayDay > 0 ? todayPresent : "\u2014", c.success, Check], ["Today \u00B7 Absent", todayDay > 0 ? todayAbsent : "\u2014", c.danger, UserX], ["Today \u00B7 Late", todayDay > 0 ? todayLate : "\u2014", c.warn, Clock]].map(a => React.createElement(SC, {
    key: a[0],
    icon: a[3],
    label: a[0],
    value: a[1],
    color: a[2]
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      padding: "10px 14px",
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 11,
      color: c.textSec,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 700,
      color: c.text
    }
  }, "Legend:"), [["present", "Present", c.success], ["absent", "Absent", c.danger], ["late", "Late", c.warn], ["leave", "Leave", c.accent]].map(a => React.createElement("span", {
    key: a[0],
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 4,
      background: a[2],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 10,
      fontWeight: 700
    }
  }, a[1][0]), a[1])), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 10,
      color: c.textMuted,
      fontStyle: "italic"
    }
  }, "Click cell to cycle \u2192 Click day# in header to mark all visible students present")), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      overflow: "hidden"
    }
  }, filtered.length === 0 ? React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 50,
      color: c.textMuted,
      fontSize: 12
    }
  }, "No active students match your search/filter.") : React.createElement("div", {
    style: {
      overflowX: "auto",
      maxHeight: "65vh",
      overflowY: "auto"
    }
  }, React.createElement("table", {
    style: {
      borderCollapse: "separate",
      borderSpacing: 0,
      fontSize: 11,
      minWidth: "100%"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      position: "sticky",
      top: 0,
      left: 0,
      zIndex: 3,
      background: c.bgDeep,
      color: c.textSec,
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      padding: "10px 12px",
      textAlign: "left",
      borderBottom: "1px solid " + c.border,
      borderRight: "1px solid " + c.border,
      minWidth: 200,
      boxShadow: "2px 0 4px rgba(0,0,0,0.15)"
    }
  }, "Student"), days.map(d => {
    const isToday = d === todayDay;
    const weekend = isWeekend(d);
    return React.createElement("th", {
      key: d,
      onClick: () => markColumnPresent(d),
      title: "Click to mark all visible students PRESENT on day " + d,
      style: {
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: isToday ? c.accentBg : weekend ? c.bgDeep + "ee" : c.bgDeep,
        color: isToday ? c.accent : c.textSec,
        fontSize: 10,
        fontWeight: 700,
        padding: "6px 0 4px",
        textAlign: "center",
        borderBottom: "1px solid " + (isToday ? c.accent + "66" : c.border),
        borderLeft: weekend ? "1px solid " + c.border : "none",
        minWidth: 30,
        width: 30,
        cursor: "pointer",
        userSelect: "none"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: isToday ? c.accent : c.text
      }
    }, d), React.createElement("div", {
      style: {
        fontSize: 8,
        fontWeight: 500,
        color: isToday ? c.accent : c.textMuted,
        marginTop: 1
      }
    }, dayLetter(d)));
  }), [["P", c.success], ["A", c.danger], ["L", c.warn], ["V", c.accent], ["%", c.text]].map(h => React.createElement("th", {
    key: h[0],
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: c.bgDeep,
      color: h[1],
      fontSize: 10,
      fontWeight: 700,
      padding: "10px 8px",
      textAlign: "center",
      borderBottom: "1px solid " + c.border,
      borderLeft: "1px solid " + c.border,
      minWidth: 38
    }
  }, h[0])))), React.createElement("tbody", null, filtered.map((s, ri) => {
    const sum = rowSummary(s);
    return React.createElement("tr", {
      key: s.id
    }, React.createElement("td", {
      style: {
        position: "sticky",
        left: 0,
        zIndex: 1,
        background: ri % 2 ? c.bgCard : c.bgDeep + "55",
        padding: "8px 12px",
        borderBottom: "1px solid " + c.border,
        borderRight: "1px solid " + c.border,
        minWidth: 200,
        boxShadow: "2px 0 4px rgba(0,0,0,0.15)"
      }
    }, React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 12,
        fontWeight: 600
      }
    }, s.name), React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 9,
        fontFamily: "monospace",
        marginTop: 2
      }
    }, s.code + " \u00B7 " + (s.teacher || "no teacher"))), days.map(d => {
      const st = (s.attendanceLog || {})[monthKey(d)];
      const col = statusColor(st);
      const isToday = d === todayDay;
      const weekend = isWeekend(d);
      return React.createElement("td", {
        key: d,
        onClick: () => onCellClick(s, d),
        style: {
          padding: 0,
          textAlign: "center",
          borderBottom: "1px solid " + c.border,
          borderLeft: weekend ? "1px solid " + c.border : "none",
          background: weekend && !col ? c.bgDeep + "44" : "transparent",
          cursor: "pointer",
          position: "relative"
        }
      }, React.createElement("div", {
        style: {
          width: "100%",
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: col || "transparent",
          color: col ? "#fff" : c.textMuted,
          fontWeight: 700,
          fontSize: 11,
          transition: "background 0.1s ease",
          border: isToday ? "1px solid " + c.accent : "none",
          boxSizing: "border-box"
        }
      }, statusLetter(st)));
    }), [[sum.p, c.success], [sum.a, c.danger], [sum.l, c.warn], [sum.v, c.accent]].map((cell, ci) => React.createElement("td", {
      key: ci,
      style: {
        padding: "8px 6px",
        textAlign: "center",
        borderBottom: "1px solid " + c.border,
        borderLeft: "1px solid " + c.border,
        color: cell[0] > 0 ? cell[1] : c.textMuted,
        fontWeight: 600,
        fontSize: 11,
        background: ri % 2 ? "transparent" : c.bgDeep + "33"
      }
    }, cell[0])), React.createElement("td", {
      style: {
        padding: "8px 6px",
        textAlign: "center",
        borderBottom: "1px solid " + c.border,
        borderLeft: "1px solid " + c.border,
        color: sum.total === 0 ? c.textMuted : sum.pct >= 90 ? c.success : sum.pct >= 75 ? c.warn : c.danger,
        fontWeight: 700,
        fontSize: 11,
        background: ri % 2 ? "transparent" : c.bgDeep + "33"
      }
    }, sum.total === 0 ? "\u2014" : sum.pct + "%"));
  }))))));
};

