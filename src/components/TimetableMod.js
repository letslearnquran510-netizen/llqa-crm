const TimetableMod = ({
  user,
  teachers: appTeachers,
  setTeachers: setAppTeachers,
  students,
  setStudents,
  dailyProgress,
  setDailyProgress,
  arPayments
}) => {
  const ttStage = cell => {
    if (!cell || !cell.s) return null;
    const _st = (students || []).find(x => x.name === cell.s && (x.trial || x.fee === "trial"));
    if (!_st) return null;
    const _pr = Object.values(_st.attendanceLog || {}).filter(v => v === "present" || v === "late").length;
    const _paid = _st.fee === "paid" || (arPayments || []).some(p => String(p.studentId) === String(_st.id));
    if (_paid) return null;
    if (_pr >= 3) return {
      bg: c.warnBg,
      bd: c.warn
    };
    return {
      bg: c.dangerBg,
      bd: c.danger
    };
  };
  const [logProgressModal, setLogProgressModal] = useState(null);
  const [progressForm, setProgressForm] = useState({
    attended: "present",
    lesson: "",
    pages: "",
    behavior: "Good",
    performance: "Satisfactory",
    homework: "Completed",
    notes: ""
  });
  const [shift, setShift] = useState("Night");
  const [mode, setMode] = useState("individual");
  const [teacherIdx, setTeacherIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [cellModal, setCellModal] = useState(null);
  const [bookModal, setBookModal] = useState(null);
  const [bookForm, setBookForm] = useState({
    s: "",
    a: "",
    c: "Quran",
    l: "",
    t: "",
    notes: "",
    country: "USA",
    state: "",
    gender: "Any"
  });
  const [, forceRender] = useState(0);
  const [quickBook, setQuickBook] = useState(null);
  const persistTeacherSchedule = t => {
    if (!setAppTeachers || !appTeachers) return;
    if (t._isNew && t._appId) {
      setAppTeachers(appTeachers.map(at => at.id === t._appId ? {
        ...at,
        _ttSchedule: t.schedule
      } : at));
      return;
    }
    if (t._overlayAppId) {
      setAppTeachers(appTeachers.map(at => at.id === t._overlayAppId ? {
        ...at,
        _ttSchedule: t.schedule
      } : at));
      return;
    }
    const newId = Math.max(0, ...appTeachers.map(at => at.id || 0)) + 1;
    setAppTeachers([...appTeachers, {
      id: newId,
      name: t.name,
      code: t.code,
      location: t.location || "IBA",
      teamLead: t.lead || "",
      status: "active",
      shift: shift,
      _ttSchedule: t.schedule
    }]);
  };
  const [qbTeacher, setQbTeacher] = useState(0);
  const [qbDay, setQbDay] = useState("Mon");
  const [cellFilter, setCellFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const exportTimetable = () => {
    const rows = [["Teacher", "Code", "Location", "S/No", "Lead", "Day", "Time Slot (PKT)", "Student", "Age", "Course", "Parent/Lead", "USA Time", "Flags"]];
    const shiftD = TT_DATA[shift];
    shiftD.teachers.forEach(t => {
      const daysToExport = shift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
      daysToExport.forEach(day => {
        const sched = t.schedule[day] || {};
        shiftD.slots.forEach(slot => {
          const cell = sched[slot];
          if (cell && cell.s) {
            rows.push([t.name, t.code, t.location || "", t.sno || "", t.lead || "", day, slot, cell.s, cell.a || "", cell.c || "", cell.l || "", cell.t || "", (cell.f || []).join("; ")]);
          } else if (cell === "F") {
            rows.push([t.name, t.code, t.location || "", t.sno || "", t.lead || "", day, slot, "FREE", "", "", "", "", ""]);
          }
        });
      });
    });
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LLQA_Timetable_" + shift + "_" + todayPK() + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const openQuickBook = () => {
    setQbTeacher(0);
    setQbDay("Mon");
    setBookForm({
      s: "",
      a: "",
      c: "Quran",
      l: "",
      t: "",
      notes: ""
    });
    setQuickBook({
      step: 1
    });
  };
  const saveBooking = () => {
    if (!bookForm.s) return;
    const bT = bookModal.teacher;
    const bD = bookModal.day;
    const bS = bookModal.slot;
    const conflicts = [];
    teachers.forEach(otherT => {
      if (otherT.code === bT.code) return;
      const otherCell = otherT.schedule && otherT.schedule[bD] && otherT.schedule[bD][bS];
      if (otherCell && typeof otherCell === "object" && otherCell.s && otherCell.s.toLowerCase() === bookForm.s.toLowerCase()) {
        conflicts.push(otherT.name);
      }
    });
    if (conflicts.length > 0) {
      if (!confirm('\u26A0 CONFLICT DETECTED!\n\nStudent "' + bookForm.s + '" is already booked at this same time (' + bD + " " + bS + ") with:\n\n• " + conflicts.join("\n• ") + "\n\nThis would create a double-booking. Continue anyway?")) return;
    }
    if (!bT.schedule[bD]) bT.schedule[bD] = {};
    bT.schedule[bD][bS] = {
      s: bookForm.s,
      a: bookForm.a || "",
      c: bookForm.c || "Quran",
      l: bookForm.l || "",
      t: bookForm.t || "",
      country: bookForm.country || "USA",
      state: bookForm.state || "",
      gender: bookForm.gender || "Any",
      phone: bookForm.phone || "",
      family: bookForm.family || "",
      f: bookForm.notes ? bookForm.notes.split(",").map(x => x.trim()).filter(Boolean) : []
    };
    persistTeacherSchedule(bT);
    setBookModal(null);
    forceRender(n => n + 1);
  };
  const removeBooking = () => {
    if (!bookModal) return;
    const bT = bookModal.teacher;
    const bD = bookModal.day;
    const bS = bookModal.slot;
    const oldCell = bT.schedule[bD] && bT.schedule[bD][bS];
    if (bT.schedule[bD]) {
      bT.schedule[bD][bS] = "F";
    }
    if (oldCell && typeof oldCell === "object" && oldCell.s && setStudents && students) {
      const sNameLc = String(oldCell.s).trim().toLowerCase();
      const sParentLc = String(oldCell.l || "").trim().toLowerCase();
      setStudents(students.map(s => {
        const nm = String(s.name || "").trim().toLowerCase();
        const pa = String(s.parent || "").trim().toLowerCase();
        if (nm === sNameLc && (!sParentLc || pa === sParentLc) && s.teacher === bT.name) {
          return {
            ...s,
            teacher: "Unassigned"
          };
        }
        return s;
      }));
    }
    persistTeacherSchedule(bT);
    setBookModal(null);
    forceRender(n => n + 1);
  };
  const [clipboard, setClipboard] = useState(null);
  const copyCell = cell => {
    setClipboard({
      ...cell
    });
    setCellModal(null);
  };
  const pasteCell = (targetTeacher, targetDay, targetSlot, existingCell) => {
    if (!clipboard) return;
    const doIt = () => {
      if (!targetTeacher.schedule[targetDay]) targetTeacher.schedule[targetDay] = {};
      targetTeacher.schedule[targetDay][targetSlot] = clipboard._free ? "F" : {
        ...clipboard
      };
      persistTeacherSchedule(targetTeacher);
      forceRender(n => n + 1);
    };
    if (existingCell && typeof existingCell === "object" && existingCell.s && existingCell.s !== clipboard.s) {
      if (confirm('This slot already has "' + existingCell.s + '" booked.\n\nReplace it with "' + clipboard.s + '"?')) doIt();
    } else doIt();
  };
  const cancelClipboard = () => setClipboard(null);
  const copyMonToWeekdays = targetTeacher => {
    const monSched = targetTeacher.schedule && targetTeacher.schedule.Mon;
    if (!monSched) {
      alert("Monday has no schedule to copy.");
      return;
    }
    if (!confirm("Copy Monday\u2019s entire schedule to Tue, Wed, Thu, and Fri for " + targetTeacher.name + "?\n\nExisting bookings on those days will be replaced.")) return;
    ["Tue", "Wed", "Thu", "Fri"].forEach(d => {
      targetTeacher.schedule[d] = {
        ...monSched
      };
    });
    persistTeacherSchedule(targetTeacher);
    forceRender(n => n + 1);
    alert("Monday\u2019s schedule copied to Tue-Fri for " + targetTeacher.name);
  };
  const printSchedule = targetTeacher => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const days = shift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const slts = shiftData.slots;
    const tName = escHTML(targetTeacher.name);
    let html = "<html><head><title>" + tName + " Schedule</title><style>body{font-family:sans-serif;padding:20px}h1{margin-bottom:6px}.sub{color:#666;margin-bottom:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px 8px;font-size:11px;text-align:left;vertical-align:top}th{background:#eee}.free{color:#0a0}.booked{background:#f0f4ff}@media print{body{padding:0}}</style></head><body>";
    html += "<h1>" + tName + "</h1><div class=sub>Code: " + escHTML(targetTeacher.code) + " \u00B7 " + escHTML(targetTeacher.location || "") + " \u00B7 " + escHTML(shift) + " Shift \u00B7 Lead: " + escHTML(targetTeacher.lead || "-") + "</div>";
    html += "<table><thead><tr><th>Day</th>";
    slts.forEach(s => {
      html += "<th>" + escHTML(to12h(s)) + "</th>";
    });
    html += "</tr></thead><tbody>";
    days.forEach(d => {
      html += "<tr><th>" + escHTML(d) + "</th>";
      slts.forEach(s => {
        const cell = targetTeacher.schedule && targetTeacher.schedule[d] && targetTeacher.schedule[d][s];
        if (cell && typeof cell === "object" && cell.s) {
          html += "<td class=booked><b>" + escHTML(cell.s) + "</b>" + (cell.a ? " (" + escHTML(cell.a) + ")" : "") + "<br><small>" + escHTML(cell.c || "") + "</small><br><small>" + escHTML(cell.t || "") + "</small></td>";
        } else if (cell === "F") {
          html += "<td class=free>FREE</td>";
        } else {
          html += "<td>—</td>";
        }
      });
      html += "</tr>";
    });
    html += '</tbody></table><div style="margin-top:14px;font-size:10px;color:#999">Generated ' + new Date().toLocaleString() + " \u00B7 LLQA CRM</div>";
    html += "<script>window.onload=function(){window.print();}<\/script></body></html>";
    w.document.write(html);
    w.document.close();
  };
  const markCellAsFree = (targetTeacher, targetDay, targetSlot) => {
    if (!targetTeacher.schedule[targetDay]) targetTeacher.schedule[targetDay] = {};
    const oldCell = targetTeacher.schedule[targetDay][targetSlot];
    targetTeacher.schedule[targetDay][targetSlot] = "F";
    if (oldCell && typeof oldCell === "object" && oldCell.s && setStudents && students) {
      const sNameLc = String(oldCell.s).trim().toLowerCase();
      const sParentLc = String(oldCell.l || "").trim().toLowerCase();
      setStudents(students.map(s => {
        const nm = String(s.name || "").trim().toLowerCase();
        const pa = String(s.parent || "").trim().toLowerCase();
        if (nm === sNameLc && (!sParentLc || pa === sParentLc) && s.teacher === targetTeacher.name) {
          return {
            ...s,
            teacher: "Unassigned"
          };
        }
        return s;
      }));
    }
    persistTeacherSchedule(targetTeacher);
    forceRender(n => n + 1);
  };
  const days = shift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const shiftData = TT_DATA[shift];
  const slots = shiftData.slots;
  const baseTeachers = shiftData.teachers;
  const existingCodes = new Set(baseTeachers.map(t => t.code));
  const daysAll = shift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const emptySchedule = () => {
    const sch = {};
    daysAll.forEach(d => {
      sch[d] = {};
      slots.forEach(s => {
        sch[d][s] = "F";
      });
    });
    return sch;
  };
  const extras = (appTeachers || []).filter(t => !existingCodes.has(t.code) && (t.shift === shift || !t.shift && shift === "Night")).map(t => ({
    sno: baseTeachers.length + 1,
    name: t.name,
    code: t.code || "",
    location: t.location || "IBA",
    lead: t.teamLead || t.lead || "",
    schedule: t._ttSchedule || emptySchedule(),
    _isNew: true,
    _appId: t.id
  }));
  const overlayMap = {};
  (appTeachers || []).forEach(at => {
    if (at._ttSchedule && at.code) overlayMap[at.code] = at;
  });
  const mergedBase = baseTeachers.map(bt => {
    const ov = overlayMap[bt.code];
    if (!ov) return bt;
    const newSched = JSON.parse(JSON.stringify(bt.schedule || {}));
    Object.keys(ov._ttSchedule).forEach(d => {
      if (!newSched[d]) newSched[d] = {};
      Object.keys(ov._ttSchedule[d]).forEach(s => {
        newSched[d][s] = ov._ttSchedule[d][s];
      });
    });
    return {
      ...bt,
      schedule: newSched,
      _overlayAppId: ov.id
    };
  });
  const _mN = String(user && user.name || "").trim().toLowerCase();
  const _mC = String(appTeachers && appTeachers[0] && appTeachers[0].code || "").trim();
  const teachers = user && user.role === "teacher" && _mN ? [...mergedBase, ...extras].filter(t => String(t.name || "").trim().toLowerCase() === _mN || t.code && _mC && String(t.code).trim() === _mC) : [...mergedBase, ...extras];
  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.code.includes(search));
  const currentTeacher = teachers[teacherIdx] || teachers[0] || {
    name: appTeachers && appTeachers[0] && appTeachers[0].name || "\u2014",
    code: appTeachers && appTeachers[0] && appTeachers[0].code || "",
    schedule: {},
    lead: "",
    location: "IBA",
    sno: 1
  };
  const shiftStats = useMemo(() => {
    let booked = 0,
      free = 0,
      noClass = 0;
    const perTeacher = teachers.map(t => {
      let tb = 0,
        tf = 0;
      days.forEach(d => {
        const sched = t.schedule[d] || {};
        slots.forEach(s => {
          const cell = sched[s];
          if (cell === "F") {
            free++;
            tf++;
          } else if (cell === "N") {
            noClass++;
          } else if (cell && cell.s) {
            booked++;
            tb++;
          }
        });
      });
      return {
        name: t.name,
        code: t.code,
        booked: tb,
        free: tf,
        utilization: tb + tf > 0 ? Math.round(tb / (tb + tf) * 100) : 0
      };
    });
    return {
      booked,
      free,
      noClass,
      perTeacher
    };
  }, [shift, teachers, slots]);
  const busiest = [...shiftStats.perTeacher].sort((a, b) => b.booked - a.booked).slice(0, 5);
  const mostAvailable = [...shiftStats.perTeacher].filter(t => t.free > 0).sort((a, b) => b.free - a.free).slice(0, 5);
  const getCellColor = cell => {
    if (!cell) return "transparent";
    if (cell === "F") return c.successBg;
    if (cell === "N") return c.bgDeep;
    if (cell && cell.s) {
      var _ts = ttStage(cell);
      if (_ts) return _ts.bg;
      if (cell.f && cell.f.length > 0) return c.warnBg;
      return c.accentBg;
    }
    return "transparent";
  };
  const getCellBorder = cell => {
    if (!cell) return `1px solid ${c.border}`;
    if (cell === "F") return `1px solid ${c.success}44`;
    if (cell === "N") return `1px dashed ${c.textMuted}`;
    if (cell && cell.s) {
      if (cell.f && cell.f.length > 0) return `1px solid ${c.warn}`;
      return `1px solid ${c.accent}44`;
    }
    return `1px solid ${c.border}`;
  };
  return React.createElement("div", null, React.createElement("div", {
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
  }, teachers.length, " teachers | ", slots.length, " slots/day | Mon-Fri schedule"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    icon: Download,
    onClick: exportTimetable
  }, "Export"), React.createElement(Btn, {
    icon: Plus,
    onClick: openQuickBook
  }, "Book Slot"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 12,
      width: "fit-content"
    }
  }, ["Morning", "Evening", "Night", "Weekend"].map(sh => {
    const st = TT_DATA[sh];
    return React.createElement("button", {
      key: sh,
      onClick: () => {
        setShift(sh);
        setTeacherIdx(0);
      },
      style: {
        padding: "8px 18px",
        borderRadius: 6,
        border: shift === sh ? "1px solid transparent" : "1px solid " + c.border,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 500,
        background: shift === sh ? c.accent : "transparent",
        color: shift === sh ? c.accentText : c.textSec,
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, sh, " (", st.teachers.length, ")", React.createElement("span", {
      style: {
        fontSize: 9,
        opacity: 0.7
      }
    }, st.slots[0], "-", st.slots[st.slots.length - 1]));
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(SC, {
    icon: Users,
    label: shift + " Teachers",
    value: teachers.length,
    color: c.accent
  }), React.createElement(SC, {
    icon: BookOpen,
    label: "Booked Slots",
    value: shiftStats.booked,
    sub: "Active classes",
    color: c.success
  }), React.createElement(SC, {
    icon: Clock,
    label: "Free Slots",
    value: shiftStats.free,
    sub: "Available for enrollment",
    color: c.warn
  }), React.createElement(SC, {
    icon: TrendingUp,
    label: "Utilization",
    value: Math.round(shiftStats.booked / (shiftStats.booked + shiftStats.free || 1) * 100) + "%",
    color: shiftStats.booked / (shiftStats.booked + shiftStats.free || 1) >= 0.85 ? c.danger : c.purple
  }), React.createElement(SC, {
    icon: GraduationCap,
    label: "Unique Students",
    value: shiftStats.booked,
    sub: "Across " + teachers.length + " teachers",
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
  }, [["individual", "Individual Teacher"], ["overview", "All Teachers Overview"], ["smartfinder", "Smart Finder"], ["analytics", "Analytics"]].filter(tb => !(user && user.role === "teacher") || tb[0] === "individual").map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setMode(k),
    style: {
      padding: "7px 16px",
      borderRadius: 6,
      border: mode === k ? "1px solid transparent" : "1px solid " + c.border,
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 500,
      background: mode === k ? c.accent : "transparent",
      color: mode === k ? c.accentText : c.textSec
    }
  }, l))), mode === "individual" && React.createElement("div", null, clipboard && React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 2000,
      maxWidth: "94%",
      background: c.bgCard,
      backdropFilter: "blur(10px)",
      border: "2px dashed " + c.warn,
      borderRadius: 10,
      padding: "10px 16px",
      boxShadow: "0 10px 34px rgba(0,0,0,.55)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      animation: "pulse 2s ease-in-out infinite"
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
  }, "Click any cell to paste here. Drag any cell (booked or free) to copy."))), React.createElement("button", {
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
      minWidth: 280,
      flex: 1
    }
  }, filteredTeachers.map((t, i) => {
    const realIdx = teachers.findIndex(x => x.code === t.code && x.name === t.name);
    return React.createElement("option", {
      key: realIdx,
      value: realIdx
    }, "#", t.sno, " ", t.name, " (", t.code, ") - ", t.location);
  })), React.createElement("button", {
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
  }, teacherIdx + 1, "/", teachers.length), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      marginLeft: "auto",
      flexWrap: "wrap"
    }
  }, React.createElement("input", {
    value: studentSearch,
    onChange: e => setStudentSearch(e.target.value),
    placeholder: "\u{1F50D} Find student...",
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 11,
      outline: "none",
      width: 160
    }
  }), ["all", "booked", "free"].map(f => React.createElement("button", {
    key: f,
    onClick: () => setCellFilter(f),
    style: {
      padding: "5px 10px",
      background: cellFilter === f ? c.accentBg : c.bgDeep,
      border: "1px solid " + (cellFilter === f ? c.accent : c.border),
      borderRadius: 5,
      cursor: "pointer",
      color: cellFilter === f ? c.accent : c.textSec,
      fontSize: 10,
      fontWeight: 600,
      textTransform: "capitalize"
    }
  }, f)))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "center",
      margin: "10px 0 2px",
      padding: "7px 12px",
      background: c.bgDeep,
      borderRadius: 8,
      fontSize: 10,
      color: c.textSec
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: c.textSec
    }
  }, "Trial pipeline:"), [["Trial \u00B7 new (<3 classes)", c.danger], ["Trial passed \u00B7 awaiting payment", c.warn], ["Active \u00B7 paid", c.accent]].map((p, pi) => React.createElement("span", {
    key: pi,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: p[1],
      display: "inline-block"
    }
  }), p[0]))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 12,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 8,
      background: "linear-gradient(135deg," + c.accent + "," + c.cyan + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      fontWeight: 700,
      color: c.accentText
    }
  }, currentTeacher.name[0]), React.createElement("div", null, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 14,
      margin: 0,
      fontWeight: 600
    }
  }, currentTeacher.name), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "2px 0 0"
    }
  }, "Code: ", currentTeacher.code, " | S/No: ", currentTeacher.sno, " | Lead: ", currentTeacher.lead || "—"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(Badge, {
    text: currentTeacher.location || "IBA",
    color: "cyan"
  }), React.createElement(Badge, {
    text: shift + " Shift",
    color: "purple"
  }), React.createElement(Badge, {
    text: shiftStats.perTeacher[teacherIdx]?.booked + " booked",
    color: "success"
  }), React.createElement(Badge, {
    text: shiftStats.perTeacher[teacherIdx]?.free + " free",
    color: "warn"
  }), shift !== "Weekend" ? React.createElement("button", {
    onClick: () => copyMonToWeekdays(currentTeacher),
    title: "Copy Monday\u2019s schedule to Tue-Fri",
    style: {
      padding: "5px 11px",
      background: c.cyanBg,
      border: "1px solid " + c.cyan + "66",
      borderRadius: 5,
      color: c.cyan,
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 600
    }
  }, "\u29C9 Copy Mon \u2192 Wkdays") : null, React.createElement("button", {
    onClick: () => printSchedule(currentTeacher),
    title: "Print this teacher\u2019s schedule",
    style: {
      padding: "5px 11px",
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.textSec,
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 600
    }
  }, "\u2399 Print"))), React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: 10,
      border: "1px solid " + c.border
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 10
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      padding: "10px 8px",
      background: c.bgDeep,
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      borderBottom: "1px solid " + c.border,
      position: "sticky",
      left: 0,
      zIndex: 2,
      minWidth: 50
    }
  }, "Day"), slots.map(s => React.createElement("th", {
    key: s,
    style: {
      padding: "12px 6px",
      background: c.cyanBg,
      color: c.text,
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: 0.3,
      borderBottom: "2px solid " + c.cyan,
      whiteSpace: "nowrap",
      minWidth: 140
    }
  }, to12h(s))))), React.createElement("tbody", null, days.map(day => React.createElement("tr", {
    key: day,
    style: {
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("td", {
    style: {
      padding: "12px 14px",
      fontWeight: 800,
      fontSize: 13,
      color: c.text,
      background: c.accentBg,
      position: "sticky",
      left: 0,
      zIndex: 1,
      textAlign: "center",
      letterSpacing: 0.8,
      borderRight: "3px solid " + c.accent,
      minWidth: 60,
      textTransform: "uppercase"
    }
  }, day), slots.map(slot => {
    const cell = currentTeacher.schedule[day]?.[slot];
    return React.createElement("td", {
      key: slot,
      style: {
        padding: 4,
        verticalAlign: "top",
        minWidth: 140,
        border: "1px solid " + c.border + "44"
      }
    }, React.createElement("div", {
      draggable: !!(cell && cell.s) || cell === "F",
      onDragStart: cell && cell.s || cell === "F" ? e => {
        setClipboard(cell && cell.s ? {
          ...cell
        } : {
          _free: true,
          s: "FREE slot"
        });
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy";
      } : undefined,
      onDragOver: clipboard ? e => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      } : undefined,
      onDrop: clipboard ? e => {
        e.preventDefault();
        pasteCell(currentTeacher, day, slot, cell);
      } : undefined,
      onClick: () => {
        if (clipboard) {
          pasteCell(currentTeacher, day, slot, cell);
          return;
        }
        if (cell && cell.s) {
          setCellModal({
            teacher: currentTeacher,
            day,
            slot,
            cell
          });
        } else if (cell === "F" || !cell) {
          setBookForm({
            s: "",
            a: "",
            c: "Quran",
            l: "",
            t: "",
            notes: ""
          });
          setBookModal({
            teacher: currentTeacher,
            day,
            slot
          });
        }
      },
      style: {
        background: getCellColor(cell),
        border: (() => {
          const m = studentSearch && cell && cell.s && String(cell.s).toLowerCase().includes(studentSearch.toLowerCase());
          return m ? "2px solid " + c.warn : getCellBorder(cell);
        })(),
        borderRadius: 5,
        padding: "7px 8px",
        fontSize: 11,
        lineHeight: 1.4,
        minHeight: 78,
        cursor: cell && cell.s || cell === "F" || !cell ? "pointer" : "default",
        transition: "all .15s",
        opacity: cellFilter === "booked" && !(cell && cell.s) || cellFilter === "free" && cell && cell.s ? 0.25 : 1,
        boxShadow: studentSearch && cell && cell.s && String(cell.s).toLowerCase().includes(studentSearch.toLowerCase()) ? "0 0 8px " + c.warn + "99" : "none"
      }
    }, cell === "F" && React.createElement("div", {
      style: {
        color: c.success,
        textAlign: "center",
        padding: "10px 0",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.3
      }
    }, React.createElement("div", null, "FREE"), React.createElement("div", {
      style: {
        fontSize: 9,
        color: c.success,
        opacity: 0.7,
        marginTop: 3,
        fontWeight: 500
      }
    }, "Click to book")), cell === "N" && React.createElement("div", {
      style: {
        color: c.textMuted,
        textAlign: "center",
        padding: "12px 0",
        fontSize: 11,
        fontWeight: 500
      }
    }, "No Class"), !cell && day === "Mon" && React.createElement("div", {
      style: {
        color: c.textMuted,
        textAlign: "center",
        padding: "10px 0",
        fontSize: 14,
        fontWeight: 600
      }
    }, React.createElement("div", null, "\u2014"), React.createElement("div", {
      style: {
        fontSize: 9,
        opacity: 0.8,
        marginTop: 3,
        color: c.accent,
        fontWeight: 500
      }
    }, "Click to book")), !cell && day !== "Mon" && React.createElement("div", {
      style: {
        color: c.textMuted,
        textAlign: "center",
        padding: "8px 0",
        fontSize: 10,
        opacity: 0.85
      }
    }, React.createElement("div", null, "Same as Mon"), React.createElement("div", {
      style: {
        fontSize: 9,
        opacity: 0.85,
        marginTop: 3,
        color: c.accent,
        fontWeight: 500
      }
    }, "Click to edit")), cell && cell.s && React.createElement("div", null, cell.s !== "Self" && cell.l ? React.createElement("div", {
      style: {
        color: c.purple,
        fontWeight: 700,
        fontSize: 12,
        marginBottom: 2,
        lineHeight: 1.25,
        display: "flex",
        alignItems: "center",
        gap: 5
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
      const _cs = cell.state || cell.l || "";
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
    })(), cell.l) : null, cell.family ? React.createElement("div", {
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
        fontSize: 13,
        marginBottom: 3,
        lineHeight: 1.25
      }
    }, cell.s, cell.a ? " (" + cell.a + ")" : ""), React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 11,
        marginBottom: 2,
        fontWeight: 500
      }
    }, cell.c), cell.s === "Self" && cell.l ? React.createElement("div", {
      style: {
        color: c.accent,
        fontSize: 11,
        fontWeight: 500,
        marginBottom: 1
      }
    }, cell.l) : null, React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 11,
        fontWeight: 500
      }
    }, cell.t), cell.f && cell.f.length > 0 && React.createElement("div", {
      style: {
        marginTop: 3,
        display: "flex",
        gap: 2,
        flexWrap: "wrap"
      }
    }, cell.f.map((flag, fi) => {
      const fc = flag.includes("Don't") || flag.includes("ADHD") ? [c.dangerBg, c.danger] : flag.includes("Female") ? [c.purpleBg, c.purple] : flag.includes("Ramadan") || flag.includes("Leave") ? [c.warnBg, c.warn] : flag.includes("Camera") || flag.includes("15-min") ? [c.cyanBg, c.cyan] : [c.warnBg, c.warn];
      return React.createElement("span", {
        key: fi,
        style: {
          fontSize: 9,
          padding: "2px 6px",
          borderRadius: 4,
          background: fc[0],
          color: fc[1],
          fontWeight: 600
        }
      }, flag);
    })))));
  })))))), React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      fontSize: 10
    }
  }, [["Booked", c.accentBg, c.accent], ["Free", c.successBg, c.success], ["Special Note", c.warnBg, c.warn], ["No Class", c.bgDeep, c.textMuted], ["Same as Mon", "transparent", c.textMuted]].map(([l, bg, col]) => React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 3,
      background: bg,
      border: "1px solid " + col + "44"
    }
  }), React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, l))), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginLeft: 10,
      padding: "2px 8px",
      background: c.bgDeep,
      borderRadius: 4
    }
  }, "Tip: Tue-Fri slots without changes inherit Monday schedule"))), mode === "overview" && React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 12,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 12
    }
  }, "Day:"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 6,
      padding: 2
    }
  }, days.map(d => React.createElement("button", {
    key: d,
    onClick: () => setSelectedDay(d),
    style: {
      padding: "6px 14px",
      borderRadius: 4,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 500,
      background: selectedDay === d ? c.accent : "transparent",
      color: selectedDay === d ? c.accentText : c.textSec
    }
  }, d))), React.createElement("div", {
    style: {
      flex: 1,
      position: "relative",
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
    placeholder: "Filter teachers...",
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
  }))), React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: 10,
      border: "1px solid " + c.border
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 10
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      padding: "10px 8px",
      background: c.bgDeep,
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      borderBottom: "1px solid " + c.border,
      position: "sticky",
      left: 0,
      zIndex: 2,
      minWidth: 170
    }
  }, "Teacher"), slots.map(s => React.createElement("th", {
    key: s,
    style: {
      padding: "10px 4px",
      background: c.bgDeep,
      color: c.text,
      fontWeight: 600,
      fontSize: 9,
      borderBottom: "1px solid " + c.border,
      whiteSpace: "nowrap",
      minWidth: 70
    }
  }, s)))), React.createElement("tbody", null, filteredTeachers.map((t, i) => React.createElement("tr", {
    key: t.code + t.name,
    style: {
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("td", {
    style: {
      padding: "6px 8px",
      background: c.bgDeep,
      position: "sticky",
      left: 0,
      zIndex: 1
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 600,
      color: c.text,
      fontSize: 10
    }
  }, t.name), React.createElement("div", {
    style: {
      fontSize: 9,
      color: c.textSec
    }
  }, t.code, " | ", t.location)), slots.map(slot => {
    const cell = t.schedule[selectedDay]?.[slot];
    const isBooked = cell && cell.s;
    const isFree = cell === "F";
    const hasFlag = isBooked && cell.f && cell.f.length > 0;
    return React.createElement("td", {
      key: slot,
      style: {
        padding: 3,
        verticalAlign: "middle",
        minWidth: 70,
        border: "1px solid " + c.border + "44"
      }
    }, React.createElement("div", {
      onClick: () => {
        if (isBooked) {
          setCellModal({
            teacher: t,
            day: selectedDay,
            slot,
            cell
          });
        } else if (isFree || !cell) {
          setBookForm({
            s: "",
            a: "",
            c: "Quran",
            l: "",
            t: "",
            notes: ""
          });
          setBookModal({
            teacher: t,
            day: selectedDay,
            slot
          });
        }
      },
      title: isBooked ? cell.s + " (" + cell.a + ") - " + cell.c : isFree ? "Click to book this slot" : "",
      style: {
        background: hasFlag ? c.warnBg : isBooked ? (ttStage(cell) || {}).bg || c.accentBg : isFree ? c.successBg : "transparent",
        border: hasFlag ? "1px solid " + c.warn : isBooked ? "1px solid " + ((ttStage(cell) || {}).bd || c.accent + "66") : isFree ? "1px solid " + c.success + "44" : "1px solid " + c.border,
        borderRadius: 4,
        padding: "4px 4px",
        fontSize: 8,
        minHeight: 28,
        cursor: isBooked || isFree || !cell ? "pointer" : "default",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }
    }, isBooked && cell.s !== "Self" && cell.l ? React.createElement("div", {
      style: {
        color: c.purple,
        fontWeight: 600,
        fontSize: 7,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, cell.l) : null, isBooked && React.createElement("div", {
      style: {
        color: c.text,
        fontWeight: 600,
        fontSize: 8,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, cell.s), isBooked && React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 7
      }
    }, cell.a ? "(" + cell.a + ")" : ""), isFree && React.createElement("div", {
      style: {
        color: c.success,
        fontSize: 9,
        fontWeight: 600
      }
    }, "FREE"), !cell && selectedDay === "Mon" && React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 8
      }
    }, "\u2014"), !cell && selectedDay !== "Mon" && React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 7,
        opacity: 0.7
      }
    }, "= Mon")));
  }))))))), mode === "analytics" && React.createElement("div", {
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
      padding: 18,
      gridColumn: "span 2"
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Utilization by Teacher (", shift, " Shift)"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, React.createElement(BarChart, {
    data: shiftStats.perTeacher.slice(0, 20).sort((a, b) => b.utilization - a.utilization),
    layout: "vertical"
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    type: "number",
    domain: [0, 100],
    stroke: c.textMuted,
    fontSize: 10,
    tickFormatter: v => v + "%"
  }), React.createElement(YAxis, {
    type: "category",
    dataKey: "name",
    stroke: c.textMuted,
    fontSize: 9,
    width: 110
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
    formatter: v => v + "%"
  }), React.createElement(Bar, {
    dataKey: "utilization",
    radius: [0, 4, 4, 0]
  }, shiftStats.perTeacher.slice(0, 20).sort((a, b) => b.utilization - a.utilization).map((entry, i) => React.createElement(Cell, {
    key: i,
    fill: entry.utilization >= 90 ? c.danger : entry.utilization >= 70 ? c.warn : entry.utilization >= 40 ? c.accent : c.success
  })))))), React.createElement("div", {
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
  }, "Busiest Teachers (", shift, ")"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, busiest.map((t, i) => React.createElement("div", {
    key: t.code + i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 12px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
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
      fontSize: 12,
      fontWeight: 500
    }
  }, t.name)), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(PBar, {
    value: t.booked,
    max: 80,
    color: c.accent
  }), React.createElement("span", {
    style: {
      color: c.accent,
      fontSize: 11,
      fontWeight: 700,
      minWidth: 25,
      textAlign: "right"
    }
  }, t.booked)))))), React.createElement("div", {
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
  }, "Most Available (", shift, ")"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, mostAvailable.map((t, i) => React.createElement("div", {
    key: t.code + i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 12px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
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
      fontSize: 12,
      fontWeight: 500
    }
  }, t.name)), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(PBar, {
    value: t.free,
    max: 80,
    color: c.success
  }), React.createElement("span", {
    style: {
      color: c.success,
      fontSize: 11,
      fontWeight: 700,
      minWidth: 25,
      textAlign: "right"
    }
  }, t.free)))))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 18,
      gridColumn: "span 2"
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 12px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Slot Utilization by Teacher"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
      gap: 10
    }
  }, shiftStats.perTeacher.map((t, i) => React.createElement("div", {
    key: t.code + i,
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 12px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 500,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, t.name), React.createElement("span", {
    style: {
      color: t.utilization >= 90 ? c.danger : t.utilization >= 70 ? c.warn : c.success,
      fontSize: 11,
      fontWeight: 700
    }
  }, t.utilization, "%")), React.createElement(PBar, {
    value: t.utilization,
    color: t.utilization >= 90 ? c.danger : t.utilization >= 70 ? c.warn : c.success
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 3,
      fontSize: 9,
      color: c.textSec
    }
  }, React.createElement("span", null, "Booked: ", t.booked), React.createElement("span", null, "Free: ", t.free))))))), mode === "smartfinder" && React.createElement(SmartFinder, null), quickBook && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1002,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.4)",
      backdropFilter: "blur(8px)",
      backdropFilter: "blur(6px)"
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
      marginBottom: 14
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, quickBook.step === 1 ? "Book Slot — Select Slot" : "Book Slot — Student Details"), React.createElement("button", {
    onClick: () => setQuickBook(null),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), quickBook.step === 1 && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: c.accentBg,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 14,
      border: "1px solid " + c.accent + "44",
      color: c.accent,
      fontSize: 11
    }
  }, "Select a teacher, day, and free time slot to book a new class in the ", shift, " shift."), React.createElement("div", {
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
      textTransform: "uppercase"
    }
  }, "Teacher"), React.createElement("select", {
    value: qbTeacher,
    onChange: e => setQbTeacher(parseInt(e.target.value)),
    style: {
      width: "100%",
      padding: "10px 12px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12,
      boxSizing: "border-box"
    }
  }, teachers.map((t, i) => React.createElement("option", {
    key: i,
    value: i
  }, "#", t.sno, " ", t.name, " (", t.code, ") — ", t.location || "IBA")))), React.createElement("div", {
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
      textTransform: "uppercase"
    }
  }, "Day"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => React.createElement("button", {
    key: d,
    onClick: () => setQbDay(d),
    style: {
      padding: "8px 16px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 500,
      background: qbDay === d ? c.accent : c.bgDeep,
      color: qbDay === d ? c.accentText : c.textSec
    }
  }, d)))), React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("label", {
    style: {
      display: "block",
      color: c.textSec,
      fontSize: 10,
      marginBottom: 6,
      fontWeight: 600,
      textTransform: "uppercase"
    }
  }, "Available Slots (", qbDay, ")"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))",
      gap: 6,
      maxHeight: 200,
      overflowY: "auto",
      padding: 4
    }
  }, slots.map(slot => {
    const cell = teachers[qbTeacher]?.schedule[qbDay]?.[slot];
    const isFree = cell === "F";
    const isEmpty = !cell && qbDay === (shift === "Weekend" ? "Sat" : "Mon");
    const isBooked = cell && cell.s;
    return React.createElement("button", {
      key: slot,
      disabled: isBooked,
      onClick: () => {
        if (isFree || isEmpty) {
          setBookForm({
            s: "",
            a: "",
            c: "Quran",
            l: "",
            t: "",
            notes: ""
          });
          setBookModal({
            teacher: teachers[qbTeacher],
            day: qbDay,
            slot: slot
          });
          setQuickBook(null);
        }
      },
      style: {
        padding: "8px 6px",
        borderRadius: 6,
        border: isFree ? "2px solid " + c.success : isEmpty ? "2px dashed " + c.textMuted : isBooked ? "1px solid " + c.border : "1px solid " + c.border,
        cursor: isBooked ? "not-allowed" : "pointer",
        background: isFree ? c.successBg : isEmpty ? "transparent" : isBooked ? c.accentBg : c.bgDeep,
        opacity: isBooked ? 0.5 : 1,
        textAlign: "center"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: isFree ? c.success : isEmpty ? c.textMuted : isBooked ? c.text : c.textSec
      }
    }, slot), React.createElement("div", {
      style: {
        fontSize: 8,
        color: isFree ? c.success : isBooked ? c.accent : c.textMuted,
        marginTop: 2
      }
    }, isFree ? "FREE" : isEmpty ? "Empty" : isBooked ? cell.s.length > 8 ? cell.s.substring(0, 8) + "…" : cell.s : "—"));
  }))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 10
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setQuickBook(null)
  }, "Cancel"))))), bookModal && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.4)",
      backdropFilter: "blur(8px)",
      backdropFilter: "blur(6px)"
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
  }, bookModal.editing ? "Edit Booking" : "Book Class Slot"), React.createElement("button", {
    onClick: () => setBookModal(null),
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
      background: bookModal.editing ? c.purpleBg : c.successBg,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 14,
      border: "1px solid " + (bookModal.editing ? c.purple : c.success) + "44"
    }
  }, React.createElement("div", {
    style: {
      color: bookModal.editing ? c.purple : c.success,
      fontSize: 13,
      fontWeight: 700
    }
  }, bookModal.editing ? "BOOKED CLASS · EDITING" : "FREE SLOT · NEW BOOKING"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      marginTop: 3
    }
  }, "Teacher: ", bookModal.teacher.name, " (", bookModal.teacher.code, ")"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 2
    }
  }, bookModal.day, " · ", bookModal.slot, " PKT · ", shift, " Shift")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Student Name *",
    value: bookForm.s || "",
    onChange: v => setBookForm({
      ...bookForm,
      s: v
    }),
    placeholder: "Enter student name"
  }), React.createElement(Inp, {
    label: "Age",
    value: bookForm.a || "",
    onChange: v => setBookForm({
      ...bookForm,
      a: v
    }),
    type: "number",
    placeholder: "Age"
  })), React.createElement(Inp, {
    label: "Parent / Lead",
    value: bookForm.l || "",
    onChange: v => setBookForm({
      ...bookForm,
      l: v
    }),
    placeholder: "e.g. Ibrahim Ghaleb C/O..."
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Course *",
    value: bookForm.c || "",
    onChange: v => setBookForm({
      ...bookForm,
      c: v
    }),
    placeholder: "e.g. Quran, EN-Quaida"
  }), React.createElement(Inp, {
    label: "USA Time (Pakistan time auto-shown)",
    value: bookForm.t || "",
    onChange: v => setBookForm({
      ...bookForm,
      t: v
    }),
    placeholder: "e.g. 0500 PM USA"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.5fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Country",
    value: bookForm.country || "USA",
    onChange: v => setBookForm({
      ...bookForm,
      country: v,
      state: ""
    }),
    options: ["USA", "Canada", "UK", "UAE", "Australia", "Other"]
  }), bookForm.country === "Other" ? React.createElement(Inp, {
    label: "State / Region",
    value: bookForm.state || "",
    onChange: v => setBookForm({
      ...bookForm,
      state: v
    }),
    placeholder: "Enter state / region"
  }) : React.createElement(Inp, {
    label: "State / Province (auto-detects USA timezone)",
    value: bookForm.state || "",
    onChange: v => setBookForm({
      ...bookForm,
      state: v
    }),
    options: ["", ...(COUNTRY_STATES[bookForm.country || "USA"] || [])]
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Student Gender",
    value: bookForm.gender || "Any",
    onChange: v => setBookForm({
      ...bookForm,
      gender: v
    }),
    options: ["Any", "Male", "Female"]
  }), React.createElement(Inp, {
    label: "Phone / WhatsApp (optional)",
    value: bookForm.phone || "",
    onChange: v => setBookForm({
      ...bookForm,
      phone: v
    }),
    placeholder: "+1 ..."
  })), React.createElement(Inp, {
    label: "Special Notes / Flags (comma separated)",
    value: bookForm.notes || "",
    onChange: v => setBookForm({
      ...bookForm,
      notes: v
    }),
    placeholder: "e.g. ADHD, Female Only Teacher, Don't Change Teacher"
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, React.createElement(Btn, {
    variant: "outline",
    icon: CheckCircle,
    onClick: () => {
      if (bookModal) {
        markCellAsFree(bookModal.teacher, bookModal.day, bookModal.slot);
        setBookModal(null);
      }
    }
  }, "Mark as Free"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setBookModal(null)
  }, "Cancel"), React.createElement(Btn, {
    onClick: saveBooking,
    icon: Check
  }, bookModal.editing ? "Update Booking" : "Book Class"))))), cellModal && React.createElement("div", {
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
      background: c.bgDeep,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase"
    }
  }, "Teacher"), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, cellModal.teacher.name)), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase"
    }
  }, "Day / Time (PKT)"), React.createElement("span", {
    style: {
      color: c.accent,
      fontSize: 12,
      fontWeight: 600
    }
  }, cellModal.day, " \xB7 ", cellModal.slot)), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase"
    }
  }, "USA Time"), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, cellModal.cell.t, (() => {
    const _state = cellModal.cell.state || (cellModal.cell.s === "Self" ? cellModal.cell.l : (initStudents.find(x => x.name && cellModal.cell.s && x.name.toLowerCase() === String(cellModal.cell.s).toLowerCase()) || {}).state || cellModal.cell.l);
    const _pk = toPakTime(cellModal.cell.t, _state);
    return _pk ? React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.warnBg || "rgba(245,158,11,0.12)",
        color: c.warn,
        padding: "3px 9px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.2,
        border: "1px solid " + (c.warn + "33")
      }
    }, "\uD83C\uDDF5\uD83C\uDDF0", React.createElement("span", {
      style: {
        opacity: 0.75,
        fontWeight: 500,
        fontSize: 9
      }
    }, "PK"), _pk) : null;
  })()))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 12
    }
  }, [cellModal.cell.s !== "Self" ? ["Parent / Lead", cellModal.cell.l] : null, ["Student", cellModal.cell.s + (cellModal.cell.a ? " (" + cellModal.cell.a + "y)" : "")], ["Course", cellModal.cell.c], cellModal.cell.family ? ["Family Group", cellModal.cell.family] : null, cellModal.cell.s === "Self" ? ["Parent / Lead", cellModal.cell.l] : null, ["USA Time", cellModal.cell.t || "Not set"], ["Pakistan Time", (() => {
    const _state = cellModal.cell.state || (cellModal.cell.s === "Self" ? cellModal.cell.l : (initStudents.find(x => x.name && cellModal.cell.s && x.name.toLowerCase() === String(cellModal.cell.s).toLowerCase()) || {}).state || cellModal.cell.l);
    const _pk = toPakTime(cellModal.cell.t, _state);
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
    }, "\uD83C\uDDF5\uD83C\uDDF0"), _pk) : "\u2014";
  })()], ["Shift", shift], ["Code", cellModal.teacher.code], cellModal.cell.country ? ["Country", cellModal.cell.country] : null, cellModal.cell.state ? ["State / Province", cellModal.cell.state] : null, cellModal.cell.gender && cellModal.cell.gender !== "Any" ? ["Gender Pref", cellModal.cell.gender] : null, cellModal.cell.phone ? ["Phone", cellModal.cell.phone] : null].filter(Boolean).map(([l, v]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, l), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 500
    }
  }, v || "—")))), cellModal.cell.f && cellModal.cell.f.length > 0 && React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 5
    }
  }, "Special Notes"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, cellModal.cell.f.map((fl, i) => React.createElement(Badge, {
    key: i,
    text: fl,
    color: fl.includes("Don't") || fl.includes("ADHD") ? "danger" : fl.includes("Female") ? "purple" : fl.includes("Ramadan") || fl.includes("Leave") ? "warn" : fl.includes("Camera") || fl.includes("15-min") ? "cyan" : "accent"
  })))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
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
    onClick: () => {
      const stu = (students || []).find(s => (s.name || "").toLowerCase().trim() === (cellModal.cell.s || "").toLowerCase().trim());
      setProgressForm({
        attended: "present",
        lesson: stu && stu.lastLesson || "",
        pages: "",
        behavior: "Good",
        performance: "Satisfactory",
        homework: "Completed",
        notes: ""
      });
      setLogProgressModal({
        cell: cellModal.cell,
        teacherName: cellModal.teacher.name,
        studentId: stu ? stu.id : null,
        studentName: cellModal.cell.s || "",
        day: cellModal.day,
        slot: cellModal.slot
      });
      setCellModal(null);
    },
    style: {
      padding: "8px 14px",
      background: c.cyan,
      border: "none",
      borderRadius: 6,
      color: "#fff",
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\u270D Log Today\u0027s Class"), React.createElement(Btn, {
    variant: "danger",
    icon: X,
    onClick: () => {
      if (confirm("Remove this booking and mark slot as Free?")) {
        markCellAsFree(cellModal.teacher, cellModal.day, cellModal.slot);
        setCellModal(null);
      }
    }
  }, "Mark as Free")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setCellModal(null)
  }, "Close"), React.createElement(Btn, {
    icon: Edit2,
    onClick: () => {
      setBookForm({
        s: cellModal.cell.s || "",
        a: cellModal.cell.a || "",
        c: cellModal.cell.c || "Quran",
        l: cellModal.cell.l || "",
        t: cellModal.cell.t || "",
        country: cellModal.cell.country || "USA",
        state: cellModal.cell.state || "",
        gender: cellModal.cell.gender || "Any",
        phone: cellModal.cell.phone || "",
        notes: (cellModal.cell.f || []).join(", ")
      });
      setBookModal({
        teacher: cellModal.teacher,
        day: cellModal.day,
        slot: cellModal.slot,
        editing: true
      });
      setCellModal(null);
    }
  }, "Edit Booking"))))));
};

