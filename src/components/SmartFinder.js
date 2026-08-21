const SmartFinder = () => {
  const [fm, setFm] = React.useState("freeslots");
  const [fDay, setFDay] = React.useState("All");
  const [fFrom, setFFrom] = React.useState("Any");
  const [fTo, setFTo] = React.useState("Any");
  const [fLoc, setFLoc] = React.useState("All");
  const [fTeach, setFTeach] = React.useState("");
  const [fSearch, setFSearch] = React.useState("");
  const allSlots = React.useMemo(() => {
    const s = new Set();
    ["Morning", "Evening", "Night", "Weekend"].forEach(sh => TT_DATA[sh].slots.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, []);
  const results = React.useMemo(() => {
    const rows = [];
    ["Morning", "Evening", "Night", "Weekend"].forEach(sh => {
      const sd = TT_DATA[sh];
      const ds = sh === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
      sd.teachers.forEach(t => {
        if (fTeach && !t.name.toLowerCase().includes(fTeach.toLowerCase())) return;
        if (fLoc !== "All" && t.location !== fLoc) return;
        ds.forEach(d => {
          if (fDay !== "All" && d !== fDay) return;
          const sched = t.schedule[d] || {};
          sd.slots.forEach(sl => {
            if (fFrom !== "Any" && sl < fFrom) return;
            if (fTo !== "Any" && sl > fTo) return;
            const cell = sched[sl];
            if (fm === "freeslots") {
              if (cell === "F") rows.push({
                shift: sh,
                teacher: t.name,
                code: t.code,
                loc: t.location,
                lead: t.lead || "-",
                day: d,
                slot: sl
              });
            } else if (fm === "findstudent") {
              if (cell && typeof cell === "object" && cell.s && (fSearch === "" || cell.s.toLowerCase().includes(fSearch.toLowerCase()))) rows.push({
                shift: sh,
                teacher: t.name,
                code: t.code,
                loc: t.location,
                lead: t.lead || "-",
                day: d,
                slot: sl,
                student: cell.s,
                age: cell.a,
                course: cell.c,
                parent: cell.l,
                usaTime: cell.t,
                flags: cell.f
              });
            } else if (fm === "findcourse") {
              if (cell && typeof cell === "object" && cell.c && (fSearch === "" || cell.c.toLowerCase().includes(fSearch.toLowerCase()))) rows.push({
                shift: sh,
                teacher: t.name,
                code: t.code,
                loc: t.location,
                lead: t.lead || "-",
                day: d,
                slot: sl,
                student: cell.s,
                age: cell.a,
                course: cell.c,
                parent: cell.l,
                usaTime: cell.t,
                flags: cell.f
              });
            } else if (fm === "findparent") {
              if (cell && typeof cell === "object" && cell.l && (fSearch === "" || cell.l.toLowerCase().includes(fSearch.toLowerCase()))) rows.push({
                shift: sh,
                teacher: t.name,
                code: t.code,
                loc: t.location,
                lead: t.lead || "-",
                day: d,
                slot: sl,
                student: cell.s,
                age: cell.a,
                course: cell.c,
                parent: cell.l,
                usaTime: cell.t,
                flags: cell.f
              });
            } else if (fm === "teacherclasses") {
              if (cell && typeof cell === "object" && cell.s) rows.push({
                shift: sh,
                teacher: t.name,
                code: t.code,
                loc: t.location,
                lead: t.lead || "-",
                day: d,
                slot: sl,
                student: cell.s,
                age: cell.a,
                course: cell.c,
                parent: cell.l,
                usaTime: cell.t,
                flags: cell.f
              });
            }
          });
        });
      });
    });
    return rows;
  }, [fm, fDay, fFrom, fTo, fLoc, fTeach, fSearch]);
  const uT = new Set(results.map(r => r.teacher)).size;
  const uS = fm !== "freeslots" ? new Set(results.map(r => r.student).filter(Boolean)).size : 0;
  const showSrch = fm === "findstudent" || fm === "findcourse" || fm === "findparent";
  const modes = [{
    k: "freeslots",
    l: "Free Slots",
    col: c.success,
    ic: Clock
  }, {
    k: "findstudent",
    l: "Find Student",
    col: c.accent,
    ic: Users
  }, {
    k: "findcourse",
    l: "Find Course",
    col: c.purple,
    ic: BookOpen
  }, {
    k: "findparent",
    l: "Find Parent",
    col: c.warn,
    ic: Home
  }, {
    k: "teacherclasses",
    l: "Teacher Classes",
    col: c.cyan,
    ic: Award
  }];
  const selSt = {
    width: "100%",
    padding: "8px 10px",
    background: c.bgDeep,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 11,
    cursor: "pointer",
    outline: "none"
  };
  const lblSt = {
    color: c.textSec,
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    marginBottom: 4
  };
  const hdr = fm === "freeslots" ? ["Shift", "Teacher", "Code", "Location", "Lead", "Day", "Time (PKT)"] : ["Shift", "Teacher", "Code", "Student", "Age", "Course", "Parent", "Day", "Time (PKT)", "USA Time"];
  return React.createElement("div", null, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(Search, {
    size: 16,
    color: c.accent
  }), "Smart Timetable Finder"), React.createElement("span", {
    style: {
      fontSize: 11,
      padding: "4px 14px",
      borderRadius: 10,
      background: c.accent + "22",
      color: c.accent,
      fontWeight: 700
    }
  }, results.length + " results")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginBottom: 16,
      borderBottom: "1px solid " + c.border,
      paddingBottom: 10,
      flexWrap: "wrap"
    }
  }, modes.map(m => React.createElement("button", {
    key: m.k,
    onClick: () => {
      setFm(m.k);
      setFSearch("");
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 14px",
      borderRadius: 8,
      border: fm === m.k ? "1px solid " + m.col : "1px solid transparent",
      background: fm === m.k ? m.col + "22" : "transparent",
      color: fm === m.k ? m.col : c.textSec,
      cursor: "pointer",
      fontSize: 11,
      fontWeight: fm === m.k ? 700 : 500,
      transition: "all .2s"
    }
  }, fm === m.k ? React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: m.col
    }
  }) : React.createElement(m.ic, {
    size: 12
  }), m.l))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: showSrch ? "1fr 1fr 1fr 1fr 1fr 1.5fr" : "1fr 1fr 1fr 1fr 1fr",
      gap: 10,
      marginBottom: 14
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: lblSt
  }, "Day"), React.createElement("select", {
    value: fDay,
    onChange: e => setFDay(e.target.value),
    style: selSt
  }, ["All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => React.createElement("option", {
    key: d,
    value: d
  }, d)))), React.createElement("div", null, React.createElement("div", {
    style: lblSt
  }, "From Time"), React.createElement("select", {
    value: fFrom,
    onChange: e => setFFrom(e.target.value),
    style: selSt
  }, React.createElement("option", {
    value: "Any"
  }, "Any"), allSlots.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("div", {
    style: lblSt
  }, "To Time"), React.createElement("select", {
    value: fTo,
    onChange: e => setFTo(e.target.value),
    style: selSt
  }, React.createElement("option", {
    value: "Any"
  }, "Any"), allSlots.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("div", {
    style: lblSt
  }, "Location"), React.createElement("select", {
    value: fLoc,
    onChange: e => setFLoc(e.target.value),
    style: selSt
  }, ["All", "IBA", "WFH"].map(l => React.createElement("option", {
    key: l,
    value: l
  }, l)))), React.createElement("div", null, React.createElement("div", {
    style: lblSt
  }, "Teacher Name"), React.createElement("input", {
    value: fTeach,
    onChange: e => setFTeach(e.target.value),
    placeholder: "Filter teacher...",
    style: Object.assign({}, selSt, {
      cursor: "text"
    })
  })), showSrch ? React.createElement("div", null, React.createElement("div", {
    style: lblSt
  }, fm === "findstudent" ? "Search Student" : fm === "findcourse" ? "Search Course" : "Search Parent"), React.createElement("input", {
    value: fSearch,
    onChange: e => setFSearch(e.target.value),
    placeholder: "Type to search...",
    style: Object.assign({}, selSt, {
      borderColor: c.accent + "55",
      cursor: "text"
    })
  })) : null), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      padding: "5px 14px",
      borderRadius: 8,
      background: c.successBg,
      color: c.success,
      fontSize: 11,
      fontWeight: 600
    }
  }, fm === "freeslots" ? "\u2713 " + results.length + " free slots found" : "\u2713 " + results.length + " results found"), React.createElement("span", {
    style: {
      padding: "5px 14px",
      borderRadius: 8,
      background: c.accentBg,
      color: c.accent,
      fontSize: 11,
      fontWeight: 600
    }
  }, uT + " teacher" + (uT !== 1 ? "s" : "") + " " + (fm === "freeslots" ? "available" : "matched")), fm !== "freeslots" && uS > 0 ? React.createElement("span", {
    style: {
      padding: "5px 14px",
      borderRadius: 8,
      background: c.purpleBg,
      color: c.purple,
      fontSize: 11,
      fontWeight: 600
    }
  }, uS + " unique student" + (uS !== 1 ? "s" : "")) : null)), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18,
      marginTop: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 13,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Filter, {
    size: 13,
    color: c.accent
  }), fm === "freeslots" ? "Free Slots Results" : fm === "findstudent" ? "Student Search Results" : fm === "findcourse" ? "Course Search Results" : fm === "findparent" ? "Parent Search Results" : "Teacher Classes Results"), React.createElement("span", {
    style: {
      fontSize: 10,
      color: c.textMuted
    }
  }, "Showing " + Math.min(results.length, 500) + " of " + results.length)), React.createElement("div", {
    style: {
      maxHeight: 500,
      overflowY: "auto",
      borderRadius: 8,
      border: "1px solid " + c.border
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 10
    }
  }, React.createElement("thead", null, React.createElement("tr", null, hdr.map(h => React.createElement("th", {
    key: h,
    style: {
      padding: "8px 8px",
      textAlign: "left",
      color: c.textSec,
      fontWeight: 600,
      fontSize: 9,
      textTransform: "uppercase",
      borderBottom: "1px solid " + c.border,
      background: c.bgCard,
      position: "sticky",
      top: 0,
      zIndex: 1
    }
  }, h)))), React.createElement("tbody", null, results.slice(0, 500).map((r, i) => {
    const shCol = r.shift === "Morning" ? c.warn : r.shift === "Evening" ? c.purple : r.shift === "Night" ? c.accent : c.cyan;
    return React.createElement("tr", {
      key: i,
      style: {
        borderBottom: "1px solid " + c.border,
        background: i % 2 ? c.bgDeep + "88" : "transparent"
      }
    }, React.createElement("td", {
      style: {
        padding: "6px 8px"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 9,
        padding: "2px 6px",
        borderRadius: 3,
        background: shCol + "22",
        color: shCol,
        fontWeight: 600
      }
    }, r.shift)), React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.text,
        fontWeight: 500
      }
    }, r.teacher), React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.text,
        fontWeight: 600,
        fontFamily: "monospace",
        fontSize: 10
      }
    }, r.code), fm === "freeslots" ? React.createElement("td", {
      style: {
        padding: "6px 8px"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 9,
        padding: "1px 5px",
        borderRadius: 3,
        background: r.loc === "IBA" ? c.cyanBg : c.purpleBg,
        color: r.loc === "IBA" ? c.cyan : c.purple
      }
    }, r.loc)) : React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.text,
        fontWeight: 600
      }
    }, r.student), fm === "freeslots" ? React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.textSec
      }
    }, r.lead) : React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.textMuted
      }
    }, r.age || "-"), fm !== "freeslots" ? React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.cyan
      }
    }, r.course) : null, fm !== "freeslots" ? React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.purple
      }
    }, r.parent) : null, React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.success,
        fontWeight: 600
      }
    }, r.day), React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.text
      }
    }, r.slot), fm !== "freeslots" ? React.createElement("td", {
      style: {
        padding: "6px 8px",
        color: c.warn,
        fontSize: 9
      }
    }, r.usaTime || "-") : null);
  }))))));
};

