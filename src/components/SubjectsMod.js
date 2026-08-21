const SubjectsMod = () => {
  const [teachers, setTeachers] = useState(SUBJ_TEACHERS_DATA);
  const [tab, setTab] = useState("directory");
  const [teacherIdx, setTeacherIdx] = useState(0);
  const [selDay, setSelDay] = useState("mon");
  const [search, setSearch] = useState("");
  const [fSubj, setFSubj] = useState("all");
  const [fGrade, setFGrade] = useState("all");
  const [fLoc, setFLoc] = useState("all");
  const [onlyFree, setOnlyFree] = useState(false);
  const [cellModal, setCellModal] = useState(null);
  const [modal, setModal] = useState(null);
  const [f, setF] = useState({});
  const [cmp1, setCmp1] = useState(0);
  const [cmp2, setCmp2] = useState(1);
  const [subjShift, setSubjShift] = useState("weekday");
  const days = subjShift === "weekend" ? [["sat", "Sat"], ["sun", "Sun"]] : [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"]];
  const filtered = useMemo(() => {
    let d = teachers;
    if (search) d = d.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.code.includes(search) || t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase())));
    if (fSubj !== "all") d = d.filter(t => t.subjects.includes(fSubj));
    if (fGrade !== "all") {
      d = d.filter(t => {
        const [gFrom, gTo] = t.grades.split("-");
        return ALL_GRADES.indexOf(fGrade) >= ALL_GRADES.indexOf(gFrom) && ALL_GRADES.indexOf(fGrade) <= ALL_GRADES.indexOf(gTo);
      });
    }
    if (fLoc !== "all") d = d.filter(t => t.location === fLoc);
    return d;
  }, [teachers, search, fSubj, fGrade, fLoc]);
  const stats = useMemo(() => {
    let totalB = 0,
      totalF = 0,
      subjCount = {},
      gradeCount = {},
      stateCount = {};
    teachers.forEach(t => {
      ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].forEach(d => {
        for (let i = 4; i < 52; i++) {
          const cell = t[d] ? t[d][i] : null;
          if (cell && typeof cell === "object") {
            totalB++;
            subjCount[cell.sub] = (subjCount[cell.sub] || 0) + 1;
            gradeCount[cell.gr] = (gradeCount[cell.gr] || 0) + 1;
            stateCount[cell.st] = (stateCount[cell.st] || 0) + 1;
          }
        }
      });
    });
    const totalPossible = teachers.length * 7 * 48;
    totalF = totalPossible - totalB;
    return {
      booked: totalB,
      free: totalF,
      util: Math.round(totalB / (totalPossible || 1) * 100),
      subjCount: Object.entries(subjCount).sort((a, b) => b[1] - a[1]),
      gradeCount: Object.entries(gradeCount).sort((a, b) => ALL_GRADES.indexOf(a[0]) - ALL_GRADES.indexOf(b[0])),
      stateCount: Object.entries(stateCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
    };
  }, [teachers]);
  const teacherLoad = t => {
    let b = 0;
    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].forEach(d => {
      for (let i = 4; i < 52; i++) if (t[d] && t[d][i] && typeof t[d][i] === "object") b++;
    });
    return {
      booked: b,
      free: 336 - b,
      util: Math.round(b / 336 * 100)
    };
  };
  const freeSlotsForSubject = (subj, day = "mon") => {
    const result = [];
    teachers.forEach(t => {
      if (subj === "all" || t.subjects.includes(subj)) {
        for (let i = 4; i < 52; i++) if (!t[day][i]) result.push({
          teacher: t.name,
          code: t.code,
          time: SUBJ_SLOTS[i - 4],
          slotIdx: i
        });
      }
    });
    return result.slice(0, 30);
  };
  const curT = teachers[teacherIdx];
  const [clipboard, setClipboard] = useState(null);
  const copyCell = cell => {
    setClipboard({
      ...cell
    });
    setCellModal(null);
  };
  const cancelClipboard = () => setClipboard(null);
  const pasteCell = (teacher, day, slotIdx) => {
    if (!clipboard) return;
    setTeachers(teachers.map(t => t.id === teacher.id ? {
      ...t,
      [day]: {
        ...t[day],
        [slotIdx]: {
          ...clipboard
        }
      }
    } : t));
  };
  const markFree = (teacher, day, slotIdx) => {
    setTeachers(teachers.map(t => t.id === teacher.id ? {
      ...t,
      [day]: Object.fromEntries(Object.entries(t[day] || {}).filter(([k]) => k !== String(slotIdx)))
    } : t));
    setCellModal(null);
  };
  const editBooking = () => {
    const {
      teacher,
      day,
      slotIdx,
      cell
    } = cellModal;
    setF({
      teacherId: teacher.id,
      day,
      slotIdx,
      editing: true,
      s: cell.s || "",
      a: cell.a || "",
      p: cell.p || "",
      sub: cell.sub || "",
      gr: cell.gr || "",
      st: cell.st || "",
      t: cell.t || "",
      country: cell.country || "USA",
      gender: cell.gender || "Any",
      phone: cell.phone || "",
      family: cell.family || "",
      dor: cell.dor || todayPK()
    });
    setCellModal(null);
    setModal({
      type: "assign"
    });
  };
  const openCell = (teacher, day, slotIdx, cell) => setCellModal({
    teacher,
    day,
    slotIdx,
    cell
  });
  const openAssign = (teacher, day, slotIdx) => {
    setF({
      teacherId: teacher.id,
      day,
      slotIdx,
      s: "",
      a: "",
      p: "",
      sub: "",
      gr: "",
      st: "",
      t: "",
      dor: todayPK()
    });
    setModal({
      type: "assign"
    });
  };
  const saveAssign = () => {
    if (!f.s || !f.sub) return;
    setTeachers(teachers.map(t => t.id === f.teacherId ? {
      ...t,
      [f.day]: {
        ...t[f.day],
        [f.slotIdx]: {
          s: f.s,
          a: parseInt(f.a) || 0,
          p: f.p || "",
          sub: f.sub,
          gr: f.gr || "",
          st: f.st || "",
          t: f.t || "",
          country: f.country || "USA",
          gender: f.gender || "Any",
          phone: f.phone || "",
          family: f.family || "",
          dor: f.dor || ""
        }
      }
    } : t));
    setModal(null);
    setCellModal(null);
  };
  const removeCell = () => {
    const {
      teacher,
      day,
      slotIdx
    } = cellModal;
    setTeachers(teachers.map(t => t.id === teacher.id ? {
      ...t,
      [day]: Object.fromEntries(Object.entries(t[day]).filter(([k]) => k !== String(slotIdx)))
    } : t));
    setCellModal(null);
  };
  const rColor = sub => sub === "Math" ? c.accent : sub === "English" ? c.purple : sub === "Biology" ? c.success : sub === "Chemistry" ? c.warn : sub === "Physics" ? c.cyan : sub === "Coding" ? c.danger : c.textSec;
  return React.createElement("div", null, clipboard && React.createElement("div", {
    style: {
      background: c.warnBg,
      border: "2px dashed " + c.warn,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flex: "1 1 auto",
      minWidth: 200
    }
  }, React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\uD83D\uDCCB"), React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.warn,
      fontSize: 12,
      fontWeight: 700
    }
  }, "Class copied: ", clipboard.s || "Booking"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, "Click any free cell to paste here. You can also drag from a booked cell to copy."))), React.createElement("button", {
    onClick: cancelClipboard,
    style: {
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 6,
      padding: "6px 12px",
      color: c.text,
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "Cancel paste")), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
      flexWrap: "wrap",
      gap: 8
    }
  }, React.createElement("p", {
    style: {
      margin: 0,
      color: c.textSec,
      fontSize: 12
    }
  }, teachers.length, " subject teachers \xB7 ", stats.booked, " booked classes \xB7 ", stats.free, " free slots \xB7 ", subjShift === "weekend" ? "Sat-Sun schedule" : "Mon-Fri schedule"), React.createElement(Btn, {
    icon: Plus,
    onClick: () => openAssign(teachers[0], "mon", 4)
  }, "Assign Class")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(SC, {
    icon: Users,
    label: (subjShift === "weekend" ? "Weekend" : "Weekday") + " Teachers",
    value: teachers.length,
    sub: "7 WFH \xB7 1 IBA",
    color: c.accent
  }), React.createElement(SC, {
    icon: BookOpen,
    label: "Booked Classes",
    value: stats.booked,
    color: c.success
  }), React.createElement(SC, {
    icon: Clock,
    label: "Free Slots",
    value: stats.free,
    sub: "Available",
    color: c.warn
  }), React.createElement(SC, {
    icon: TrendingUp,
    label: "Utilization",
    value: stats.util + "%",
    color: c.purple
  }), React.createElement(SC, {
    icon: GraduationCap,
    label: "Subjects",
    value: ALL_SUBJECTS.length,
    sub: "Grades I-X",
    color: c.cyan
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 12,
      width: "fit-content"
    }
  }, [["weekday", "Weekday (Mon-Fri)"], ["weekend", "Weekend (Sat-Sun)"]].map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setSubjShift(k),
    style: {
      padding: "8px 18px",
      borderRadius: 6,
      border: subjShift === k ? "1px solid transparent" : "1px solid " + c.border,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 500,
      background: subjShift === k ? c.accent : "transparent",
      color: subjShift === k ? c.accentText : c.textSec,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, l, React.createElement("span", {
    style: {
      fontSize: 9,
      opacity: 0.7
    }
  }, k === "weekday" ? "08:00-07:30" : "09:00-16:30")))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 14,
      width: "fit-content",
      flexWrap: "wrap"
    }
  }, [["directory", "Directory"], ["individual", "Individual"], ["overview", "Overview"], ["finder", "Free Slot Finder"], ["compare", "Compare"], ["analytics", "Analytics"]].map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      padding: "7px 14px",
      borderRadius: 6,
      border: tab === k ? "1px solid transparent" : "1px solid " + c.border,
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 500,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), tab === "directory" && React.createElement(React.Fragment, null, React.createElement("div", {
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
    placeholder: "Search name, code, subject...",
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
    value: fSubj,
    onChange: e => setFSubj(e.target.value),
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
  }, "All Subjects"), ALL_SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))), React.createElement("select", {
    value: fGrade,
    onChange: e => setFGrade(e.target.value),
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
  }, "All Grades"), ALL_GRADES.map(g => React.createElement("option", {
    key: g,
    value: g
  }, "Grade ", g))), React.createElement("select", {
    value: fLoc,
    onChange: e => setFLoc(e.target.value),
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
  }, "All Locations"), React.createElement("option", {
    value: "WFH"
  }, "WFH"), React.createElement("option", {
    value: "IBA"
  }, "IBA"))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
      gap: 10
    }
  }, filtered.map(t => {
    const l = teacherLoad(t);
    return React.createElement("div", {
      key: t.id,
      style: {
        background: c.bgCard,
        backdropFilter: "blur(16px)",
        boxShadow: c.shadow3d,
        border: "1px solid " + c.border,
        borderRadius: 10,
        padding: 14
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center"
      }
    }, React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 8,
        background: "linear-gradient(135deg," + c.purple + "," + c.cyan + ")",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: c.purpleText
      }
    }, t.name.replace("Ms. ", "")[0]), React.createElement("div", null, React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 12,
        fontWeight: 700
      }
    }, t.name), React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 10
      }
    }, "Code ", t.code, " \xB7 ", t.location))), React.createElement("div", {
      style: {
        textAlign: "right"
      }
    }, React.createElement("div", {
      style: {
        color: c.warn,
        fontSize: 12,
        fontWeight: 700
      }
    }, t.rating, "\u2605"), React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9
      }
    }, "Rating"))), React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        marginBottom: 8
      }
    }, t.subjects.map(s => React.createElement("span", {
      key: s,
      style: {
        fontSize: 8,
        padding: "2px 6px",
        borderRadius: 3,
        background: rColor(s) + "20",
        color: rColor(s),
        fontWeight: 600
      }
    }, s))), React.createElement("div", {
      style: {
        fontSize: 10,
        color: c.textSec,
        marginBottom: 6
      }
    }, "Grades: ", React.createElement("span", {
      style: {
        color: c.accent,
        fontWeight: 600
      }
    }, t.grades)), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8
      }
    }, React.createElement(PBar, {
      value: l.util,
      color: l.util >= 90 ? c.danger : l.util >= 70 ? c.warn : l.util >= 30 ? c.accent : c.success
    }), React.createElement("span", {
      style: {
        fontSize: 10,
        color: c.textSec,
        whiteSpace: "nowrap"
      }
    }, l.booked, "/", l.booked + l.free, " (", l.util, "%)")), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, React.createElement("button", {
      onClick: () => {
        setTeacherIdx(teachers.findIndex(x => x.id === t.id));
        setTab("individual");
      },
      style: {
        flex: 1,
        background: c.accent,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 5,
        cursor: "pointer",
        padding: "5px 8px",
        color: c.accentText,
        fontSize: 10,
        fontWeight: 600
      }
    }, "View Schedule"), React.createElement("button", {
      onClick: () => {
        if (t.phone) window.location.href = "tel:" + t.phone.replace(/[^0-9+]/g, "");else alert("Phone number not available for this teacher.");
      },
      style: {
        background: c.bgDeep,
        border: "1px solid " + c.border,
        borderRadius: 5,
        cursor: "pointer",
        padding: "5px 8px",
        color: c.textSec,
        fontSize: 10
      }
    }, "Phone")));
  }))), tab === "individual" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 12,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("button", {
    onClick: () => setTeacherIdx(Math.max(0, teacherIdx - 1)),
    disabled: teacherIdx === 0,
    style: {
      background: "none",
      border: "1px solid " + c.border,
      borderRadius: 6,
      cursor: teacherIdx === 0 ? "not-allowed" : "pointer",
      padding: "7px 10px",
      color: teacherIdx === 0 ? c.textMuted : c.accent,
      opacity: teacherIdx === 0 ? 0.4 : 1
    }
  }, React.createElement(ChevronLeft, {
    size: 14
  })), React.createElement("select", {
    value: teacherIdx,
    onChange: e => setTeacherIdx(parseInt(e.target.value)),
    style: {
      padding: "8px 12px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12,
      minWidth: 300,
      flex: 1
    }
  }, teachers.map((t, i) => React.createElement("option", {
    key: i,
    value: i
  }, "#", t.sno, " ", t.name, " (", t.code, ") - ", t.subjects.join(", ")))), React.createElement("button", {
    onClick: () => setTeacherIdx(Math.min(teachers.length - 1, teacherIdx + 1)),
    disabled: teacherIdx >= teachers.length - 1,
    style: {
      background: "none",
      border: "1px solid " + c.border,
      borderRadius: 6,
      cursor: teacherIdx >= teachers.length - 1 ? "not-allowed" : "pointer",
      padding: "7px 10px",
      color: teacherIdx >= teachers.length - 1 ? c.textMuted : c.accent,
      opacity: teacherIdx >= teachers.length - 1 ? 0.4 : 1
    }
  }, React.createElement(ChevronRight, {
    size: 14
  })), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, teacherIdx + 1, "/", teachers.length)), curT && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 15,
      fontWeight: 700
    }
  }, curT.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 3
    }
  }, "Code ", curT.code, " \xB7 ", curT.location, " \xB7 Grades ", curT.grades), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginTop: 6
    }
  }, curT.subjects.map(s => React.createElement("span", {
    key: s,
    style: {
      fontSize: 9,
      padding: "2px 7px",
      borderRadius: 3,
      background: rColor(s) + "20",
      color: rColor(s),
      fontWeight: 600
    }
  }, s)))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 16,
      fontWeight: 700
    }
  }, teacherLoad(curT).booked), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9
    }
  }, "Booked")), React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.warn,
      fontSize: 16,
      fontWeight: 700
    }
  }, teacherLoad(curT).free), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9
    }
  }, "Free")), React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.purple,
      fontSize: 16,
      fontWeight: 700
    }
  }, teacherLoad(curT).util, "%"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9
    }
  }, "Util"))))), React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "1px solid " + c.border,
      borderRadius: 8
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 9,
      minWidth: 1400
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      padding: "6px 4px",
      background: c.bgDeep,
      borderBottom: "1px solid " + c.border,
      color: c.textSec,
      fontSize: 9,
      textAlign: "center",
      minWidth: 40,
      position: "sticky",
      left: 0,
      zIndex: 2
    }
  }, "Day"), SUBJ_SLOTS.map((slot, i) => React.createElement("th", {
    key: i,
    style: {
      padding: "10px 4px",
      background: i >= 24 ? c.purpleBg : c.cyanBg,
      borderBottom: "2px solid " + (i >= 24 ? c.purple : c.cyan),
      color: c.text,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.2,
      minWidth: 70
    }
  }, to12h(slot))))), React.createElement("tbody", null, days.map(([dkey, dlabel]) => React.createElement("tr", {
    key: dkey
  }, React.createElement("td", {
    style: {
      padding: "4px",
      background: c.bgDeep,
      borderRight: "1px solid " + c.border,
      color: c.text,
      fontSize: 10,
      fontWeight: 600,
      textAlign: "center",
      position: "sticky",
      left: 0,
      zIndex: 1
    }
  }, dlabel), SUBJ_SLOTS.map((_, i) => {
    const slotIdx = i + 4;
    const cell = (curT[dkey] || {})[slotIdx];
    const isBooked = cell && typeof cell === "object";
    const hasClipboard = !!clipboard;
    return React.createElement("td", {
      key: i,
      draggable: isBooked,
      onDragStart: isBooked ? e => {
        e.dataTransfer.setData("text/plain", "cell");
        setClipboard({
          ...cell
        });
      } : undefined,
      onDragOver: hasClipboard && !isBooked ? e => e.preventDefault() : undefined,
      onDrop: hasClipboard && !isBooked ? e => {
        e.preventDefault();
        pasteCell(curT, dkey, slotIdx);
        setClipboard(null);
      } : undefined,
      onClick: () => {
        if (hasClipboard && !isBooked) {
          pasteCell(curT, dkey, slotIdx);
          setClipboard(null);
          return;
        }
        if (isBooked) {
          openCell(curT, dkey, slotIdx, cell);
        } else {
          openAssign(curT, dkey, slotIdx);
        }
      },
      style: {
        padding: "4px",
        border: "1px solid " + (hasClipboard && !isBooked ? c.warn : c.border),
        background: isBooked ? rColor(cell.sub) + "15" : hasClipboard && !isBooked ? c.warnBg : c.bgCard,
        cursor: "pointer",
        verticalAlign: "top",
        minWidth: 110,
        maxWidth: 130
      }
    }, isBooked ? React.createElement("div", null, cell.p ? React.createElement("div", {
      style: {
        color: c.purple,
        fontSize: 10,
        fontWeight: 600,
        marginBottom: 2,
        display: "flex",
        alignItems: "center",
        gap: 4
      }
    }, (() => {
      const sc = {
        Florida: "#3b82f6",
        Texas: "#ef4444",
        California: "#10b981",
        "New York": "#f59e0b",
        Pennsylvania: "#8b5cf6",
        Virginia: "#06b6d4",
        Georgia: "#ec4899",
        Toronto: "#10b981",
        Alberta: "#f97316"
      };
      const _cs = cell.st || cell.state || "";
      const k = Object.keys(sc).find(x => String(_cs).includes(x));
      return k ? React.createElement("span", {
        style: {
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: sc[k],
          flexShrink: 0,
          boxShadow: "0 0 4px " + sc[k]
        }
      }) : null;
    })(), cell.p) : null, cell.family ? React.createElement("div", {
      style: {
        display: "inline-block",
        fontSize: 8,
        padding: "1px 6px",
        borderRadius: 8,
        background: c.cyan + "22",
        color: c.cyan,
        marginBottom: 3,
        fontWeight: 600,
        border: "1px solid " + c.cyan + "44"
      }
    }, "\uD83D\uDC65 " + cell.family) : null, React.createElement("div", {
      style: {
        color: c.text,
        fontWeight: 700,
        fontSize: 12,
        marginBottom: 2,
        lineHeight: 1.25
      }
    }, cell.s, cell.a ? " (" + cell.a + ")" : ""), React.createElement("div", {
      style: {
        color: rColor(cell.sub),
        fontSize: 10,
        marginBottom: 1,
        fontWeight: 600
      }
    }, cell.sub, cell.gr ? " G." + cell.gr : ""), cell.st ? React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9,
        marginBottom: 1
      }
    }, cell.st.substring(0, 16)) : null, cell.t ? React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 10,
        fontWeight: 500
      }
    }, cell.t) : null) : React.createElement("div", {
      style: {
        textAlign: "center",
        color: hasClipboard ? c.warn : c.success,
        fontSize: 10,
        fontWeight: 700,
        padding: "10px 0",
        letterSpacing: 0.3
      }
    }, hasClipboard ? "\u2193 Paste here" : "FREE", React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 9,
        fontWeight: 400,
        marginTop: 2
      }
    }, hasClipboard ? "" : "Click to book")));
  })))))), React.createElement("div", {
    style: {
      marginTop: 8,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      fontSize: 9
    }
  }, ALL_SUBJECTS.map(s => React.createElement("div", {
    key: s,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 2,
      background: rColor(s) + "33",
      border: "1px solid " + rColor(s)
    }
  }), React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, s)))))), tab === "overview" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 10,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Day:"), days.map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setSelDay(k),
    style: {
      padding: "5px 12px",
      borderRadius: 5,
      border: "none",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 600,
      background: selDay === k ? c.accent : c.bgDeep,
      color: selDay === k ? c.accentText : c.textSec
    }
  }, l)), React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginLeft: 10,
      cursor: "pointer"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: onlyFree,
    onChange: e => setOnlyFree(e.target.checked)
  }), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "Show only free slots"))), React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "1px solid " + c.border,
      borderRadius: 8
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 9,
      minWidth: 1400
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      padding: "6px 4px",
      background: c.bgDeep,
      borderBottom: "1px solid " + c.border,
      color: c.textSec,
      fontSize: 9,
      textAlign: "left",
      minWidth: 140,
      position: "sticky",
      left: 0,
      zIndex: 2
    }
  }, "Teacher"), SUBJ_SLOTS.map((slot, i) => React.createElement("th", {
    key: i,
    style: {
      padding: "8px 3px",
      background: i >= 24 ? c.purpleBg : c.cyanBg,
      borderBottom: "2px solid " + (i >= 24 ? c.purple : c.cyan),
      color: c.text,
      fontSize: 10,
      fontWeight: 700,
      minWidth: 60
    }
  }, to12h(slot))))), React.createElement("tbody", null, teachers.map(t => React.createElement("tr", {
    key: t.id
  }, React.createElement("td", {
    style: {
      padding: "4px 6px",
      background: c.bgDeep,
      borderRight: "1px solid " + c.border,
      color: c.text,
      fontSize: 10,
      fontWeight: 600,
      position: "sticky",
      left: 0,
      zIndex: 1
    }
  }, React.createElement("div", null, t.name.replace("Ms. ", "")), React.createElement("div", {
    style: {
      fontSize: 8,
      color: c.textSec
    }
  }, t.subjects.slice(0, 2).join(", "), t.subjects.length > 2 ? "+" : "")), SUBJ_SLOTS.map((_, i) => {
    const slotIdx = i + 4;
    const cell = t[selDay][slotIdx];
    const isBooked = cell && typeof cell === "object";
    if (onlyFree && isBooked) return React.createElement("td", {
      key: i,
      style: {
        padding: "3px",
        border: "1px solid " + c.border,
        background: c.bgDeep,
        minWidth: 60
      }
    });
    return React.createElement("td", {
      key: i,
      onClick: () => isBooked ? openCell(t, selDay, slotIdx, cell) : openAssign(t, selDay, slotIdx),
      style: {
        padding: "3px",
        border: "1px solid " + c.border,
        background: isBooked ? rColor(cell.sub) + "15" : c.bgCard,
        cursor: "pointer",
        verticalAlign: "top",
        minWidth: 60,
        maxWidth: 60
      }
    }, isBooked ? React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 7,
        color: rColor(cell.sub),
        fontWeight: 700
      }
    }, cell.s.substring(0, 8)), React.createElement("div", {
      style: {
        fontSize: 6,
        color: c.text
      }
    }, cell.sub.substring(0, 6), " G.", cell.gr)) : React.createElement("div", {
      style: {
        textAlign: "center",
        color: c.success,
        fontSize: 7,
        fontWeight: 600
      }
    }, "F"));
  }))))))), tab === "finder" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Find Free Slots"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    style: {
      flex: "1 1 200px"
    }
  }, React.createElement("label", {
    style: {
      display: "block",
      color: c.textSec,
      fontSize: 10,
      marginBottom: 4,
      fontWeight: 600,
      textTransform: "uppercase"
    }
  }, "Subject Needed"), React.createElement("select", {
    value: fSubj,
    onChange: e => setFSubj(e.target.value),
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      boxSizing: "border-box"
    }
  }, React.createElement("option", {
    value: "all"
  }, "Any Subject"), ALL_SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", {
    style: {
      flex: "1 1 150px"
    }
  }, React.createElement("label", {
    style: {
      display: "block",
      color: c.textSec,
      fontSize: 10,
      marginBottom: 4,
      fontWeight: 600,
      textTransform: "uppercase"
    }
  }, "Day"), React.createElement("select", {
    value: selDay,
    onChange: e => setSelDay(e.target.value),
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      boxSizing: "border-box"
    }
  }, days.map(([k, l]) => React.createElement("option", {
    key: k,
    value: k
  }, l))))), React.createElement("div", {
    style: {
      color: c.accent,
      fontSize: 11,
      marginTop: 10
    }
  }, "Found ", freeSlotsForSubject(fSubj, selDay).length, "+ available slots")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
      gap: 8
    }
  }, freeSlotsForSubject(fSubj, selDay).map((fs, i) => React.createElement("div", {
    key: i,
    style: {
      background: c.bgCard,
      border: "1px solid " + c.success + "44",
      borderRadius: 8,
      padding: "10px 12px"
    }
  }, React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 13,
      fontWeight: 700
    }
  }, fs.time), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      marginTop: 4,
      fontWeight: 600
    }
  }, fs.teacher), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "Code ", fs.code), React.createElement("button", {
    onClick: () => openAssign(teachers.find(t => t.code === fs.code), selDay, fs.slotIdx),
    style: {
      width: "100%",
      marginTop: 6,
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 8px",
      color: c.success,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Book Slot"))))), tab === "compare" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 14
    }
  }, [[cmp1, setCmp1, "Teacher A"], [cmp2, setCmp2, "Teacher B"]].map(([ci, setCi, l], idx) => {
    const t = teachers[ci];
    const ld = teacherLoad(t);
    return React.createElement("div", {
      key: idx,
      style: {
        background: c.bgCard,
        backdropFilter: "blur(16px)",
        boxShadow: c.shadow3d,
        border: "1px solid " + c.border,
        borderRadius: 10,
        padding: 14
      }
    }, React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 10,
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 6
      }
    }, l), React.createElement("select", {
      value: ci,
      onChange: e => setCi(parseInt(e.target.value)),
      style: {
        width: "100%",
        padding: "8px 10px",
        background: c.bgInput,
        border: "1px solid " + c.border,
        borderRadius: 6,
        color: c.text,
        fontSize: 12,
        marginBottom: 10,
        boxSizing: "border-box"
      }
    }, teachers.map((tt, i) => React.createElement("option", {
      key: i,
      value: i
    }, tt.name))), React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 6
      }
    }, t.name), React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        marginBottom: 8
      }
    }, t.subjects.map(s => React.createElement("span", {
      key: s,
      style: {
        fontSize: 8,
        padding: "2px 6px",
        borderRadius: 3,
        background: rColor(s) + "20",
        color: rColor(s),
        fontWeight: 600
      }
    }, s))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6
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
        fontSize: 9
      }
    }, "Grades"), React.createElement("div", {
      style: {
        color: c.accent,
        fontSize: 12,
        fontWeight: 700
      }
    }, t.grades)), React.createElement("div", {
      style: {
        background: c.bgDeep,
        borderRadius: 6,
        padding: "6px 10px"
      }
    }, React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9
      }
    }, "Location"), React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 12,
        fontWeight: 700
      }
    }, t.location)), React.createElement("div", {
      style: {
        background: c.bgDeep,
        borderRadius: 6,
        padding: "6px 10px"
      }
    }, React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9
      }
    }, "Rating"), React.createElement("div", {
      style: {
        color: c.warn,
        fontSize: 12,
        fontWeight: 700
      }
    }, t.rating, "\u2605")), React.createElement("div", {
      style: {
        background: c.bgDeep,
        borderRadius: 6,
        padding: "6px 10px"
      }
    }, React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9
      }
    }, "Utilization"), React.createElement("div", {
      style: {
        color: ld.util >= 70 ? c.danger : c.success,
        fontSize: 12,
        fontWeight: 700
      }
    }, ld.util, "%")), React.createElement("div", {
      style: {
        background: c.bgDeep,
        borderRadius: 6,
        padding: "6px 10px"
      }
    }, React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9
      }
    }, "Booked"), React.createElement("div", {
      style: {
        color: c.success,
        fontSize: 12,
        fontWeight: 700
      }
    }, ld.booked)), React.createElement("div", {
      style: {
        background: c.bgDeep,
        borderRadius: 6,
        padding: "6px 10px"
      }
    }, React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9
      }
    }, "Free"), React.createElement("div", {
      style: {
        color: c.warn,
        fontSize: 12,
        fontWeight: 700
      }
    }, ld.free))));
  })), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Head-to-head Comparison"), [["Subjects Taught", teachers[cmp1].subjects.length, teachers[cmp2].subjects.length, c.accent], ["Utilization %", teacherLoad(teachers[cmp1]).util, teacherLoad(teachers[cmp2]).util, c.purple], ["Booked Classes", teacherLoad(teachers[cmp1]).booked, teacherLoad(teachers[cmp2]).booked, c.success], ["Free Slots", teacherLoad(teachers[cmp1]).free, teacherLoad(teachers[cmp2]).free, c.warn], ["Rating × 10", teachers[cmp1].rating * 10, teachers[cmp2].rating * 10, c.cyan]].map(([metric, v1, v2, col]) => React.createElement("div", {
    key: metric,
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      color: c.textSec,
      fontSize: 10,
      marginBottom: 3
    }
  }, React.createElement("span", null, v1), React.createElement("span", {
    style: {
      color: c.text,
      fontWeight: 600
    }
  }, metric), React.createElement("span", null, v2)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      flex: v1,
      height: 6,
      background: col,
      borderRadius: "3px 0 0 3px",
      minWidth: 2
    }
  }), React.createElement("div", {
    style: {
      flex: v2,
      height: 6,
      background: col + "66",
      borderRadius: "0 3px 3px 0",
      minWidth: 2
    }
  })))))), tab === "analytics" && React.createElement(React.Fragment, null, React.createElement("div", {
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
  }, "Classes per Subject"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, React.createElement(BarChart, {
    data: stats.subjCount.map(([k, v]) => ({
      name: k,
      count: v
    }))
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    dataKey: "name",
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
    radius: [4, 4, 0, 0]
  }, stats.subjCount.map(([k], i) => React.createElement(Cell, {
    key: i,
    fill: rColor(k)
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
  }, "Distribution by Grade"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, React.createElement(BarChart, {
    data: stats.gradeCount.map(([k, v]) => ({
      name: "Grade " + k,
      count: v
    }))
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    dataKey: "name",
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
    fill: c.purple,
    radius: [4, 4, 0, 0]
  }))))), React.createElement("div", {
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
  }, "Teacher Utilization"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, teachers.map(t => {
    const l = teacherLoad(t);
    return React.createElement("div", {
      key: t.id,
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
        color: c.text,
        fontSize: 11,
        flex: 1,
        minWidth: 100
      }
    }, t.name.replace("Ms. ", "")), React.createElement(PBar, {
      value: l.util,
      color: l.util >= 90 ? c.danger : l.util >= 70 ? c.warn : l.util >= 30 ? c.accent : c.success
    }), React.createElement("span", {
      style: {
        color: c.textSec,
        fontSize: 10,
        minWidth: 50,
        textAlign: "right"
      }
    }, l.booked, "/", l.booked + l.free), React.createElement("span", {
      style: {
        color: c.accent,
        fontSize: 10,
        fontWeight: 700,
        minWidth: 35,
        textAlign: "right"
      }
    }, l.util, "%"));
  }))), React.createElement("div", {
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
  }, "Top States"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, stats.stateCount.map(([st, cnt], i) => React.createElement("div", {
    key: st,
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
  }, "#", i + 1), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 11,
      flex: 1
    }
  }, st), React.createElement("span", {
    style: {
      color: c.accent,
      fontSize: 11,
      fontWeight: 700
    }
  }, cnt))))))), cellModal && React.createElement("div", {
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
      width: 500
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
  }, "Class Details"), React.createElement("button", {
    onClick: () => setCellModal(null),
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
      background: rColor(cellModal.cell.sub) + "15",
      borderRadius: 8,
      padding: "10px 12px",
      marginBottom: 12,
      border: "1px solid " + rColor(cellModal.cell.sub) + "44"
    }
  }, React.createElement("div", {
    style: {
      color: rColor(cellModal.cell.sub),
      fontSize: 18,
      fontWeight: 700
    }
  }, cellModal.cell.s, " (", cellModal.cell.a, "y)"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      marginTop: 3
    }
  }, cellModal.cell.sub, " \xB7 Grade ", cellModal.cell.gr)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 10
    }
  }, [["Teacher", cellModal.teacher.name], ["Code", cellModal.teacher.code], ["Day/Time", cellModal.day.toUpperCase() + " " + SUBJ_SLOTS[cellModal.slotIdx - 4] + " PKT"], ["USA Time", cellModal.cell.t || "—"], ["Pakistan Time", (() => {
    const _pk = toPakTime(cellModal.cell.t, cellModal.cell.st);
    return _pk ? React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: c.warn,
        fontWeight: 700
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, "🇵🇰"), _pk) : "—";
  })()], ["Parent/Lead", cellModal.cell.p], ["State", cellModal.cell.st], ["DOR", cellModal.cell.dor || "—"], ["Grade", cellModal.cell.gr]].map(([l, v]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "7px 10px"
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
      color: c.text,
      fontSize: 11,
      fontWeight: 500
    }
  }, v || "—")))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(Btn, {
    variant: "outline",
    icon: Package,
    onClick: () => copyCell(cellModal.cell)
  }, "Copy"), React.createElement(Btn, {
    variant: "outline",
    icon: CheckCircle,
    onClick: () => markFree(cellModal.teacher, cellModal.day, cellModal.slotIdx)
  }, "Mark as Free"), React.createElement(Btn, {
    variant: "outline",
    onClick: () => setCellModal(null)
  }, "Close"), React.createElement(Btn, {
    icon: Edit2,
    onClick: editBooking
  }, "Edit Booking")))), modal && modal.type === "assign" && React.createElement("div", {
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
      width: 520,
      maxHeight: "90vh",
      overflowY: "auto"
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
  }, f.editing ? "Edit Subject Class" : "Assign Subject Class"), React.createElement("button", {
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
      background: c.accentBg,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 12,
      color: c.accent,
      fontSize: 11
    }
  }, "Teacher: ", teachers.find(t => t.id === f.teacherId)?.name, " \xB7 ", f.day?.toUpperCase(), " ", SUBJ_SLOTS[f.slotIdx - 4], " PKT"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Student Name *",
    value: f.s || "",
    onChange: v => setF({
      ...f,
      s: v
    }),
    placeholder: "Student name"
  }), React.createElement(Inp, {
    label: "Age",
    value: f.a || "",
    onChange: v => setF({
      ...f,
      a: v
    }),
    type: "number",
    placeholder: "Age"
  })), React.createElement(Inp, {
    label: "Parent / Guardian",
    value: f.p || "",
    onChange: v => setF({
      ...f,
      p: v
    }),
    placeholder: "e.g. Ibrahim Ghaleb C/O..."
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Subject *",
    value: f.sub || "",
    onChange: v => setF({
      ...f,
      sub: v
    }),
    options: ALL_SUBJECTS
  }), React.createElement(Inp, {
    label: "Grade *",
    value: f.gr || "",
    onChange: v => setF({
      ...f,
      gr: v
    }),
    options: ALL_GRADES
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "State / Country",
    value: f.st || "",
    onChange: v => setF({
      ...f,
      st: v
    }),
    placeholder: "e.g. Texas"
  }), React.createElement(Inp, {
    label: "USA Time (Pakistan time auto-shown)",
    value: f.t || "",
    onChange: v => setF({
      ...f,
      t: v
    }),
    placeholder: "e.g. 0500 PM"
  })), React.createElement(Inp, {
    label: "Date of Registration",
    value: f.dor || "",
    onChange: v => setF({
      ...f,
      dor: v
    }),
    type: "date"
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
    onClick: saveAssign,
    icon: Check
  }, "Assign Class")))));
};

