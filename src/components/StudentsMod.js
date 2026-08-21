const StudentsMod = ({
  user,
  teachers: appTeachers,
  setTeachers: setAppTeachers,
  students: propStudents,
  setStudents: propSetStudents,
  dailyProgress,
  setDailyProgress
}) => {
  const sts = propStudents || [];
  const setSts = propSetStudents || (() => {});
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [fSt, setFSt] = useState("all");
  const [fFee, setFFee] = useState("all");
  const [fFam, setFFam] = useState("all");
  const [modal, setModal] = useState(null);
  const [pf, setPf] = useState({});
  const canAdd = !user || user.role === "superadmin" || user.role === "teamlead" || user.role && user.role.indexOf("custom:") === 0 && user.customPermissions && user.customPermissions["Manage Students"];
  const act = sts.filter(s => s.status === "active");
  const onLv = sts.filter(s => s.status === "leave");
  const qt = sts.filter(s => s.status === "quit");
  const od = sts.filter(s => s.fee === "overdue");
  const fd = useMemo(() => {
    let d = sts;
    if (fSt !== "all") d = d.filter(s => s.status === fSt);
    if (fFee !== "all") d = d.filter(s => s.fee === fFee);
    if (fFam !== "all") d = d.filter(s => (s.family || "") === fFam);
    if (search) d = d.filter(s => [s.name, s.parent, s.teacher, s.state, s.course, s.family].some(v => (v || "").toLowerCase().includes(search.toLowerCase())));
    return d;
  }, [sts, search, fSt, fFee, fFam]);
  const sg = useMemo(() => {
    const g = {};
    act.forEach(s => {
      g[s.state] = (g[s.state] || 0) + 1;
    });
    return Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [sts]);
  const oV = s => setModal({
    type: "view",
    data: s
  });
  const oP = s => {
    setPf({
      id: s.id,
      lesson: "",
      page: "",
      notes: "",
      date: todayPK(),
      att: "Present",
      beh: s.lB || "Good",
      perf: s.lP || "Satisfactory",
      hw: s.lH || "Not Assigned",
      rec: s.lR || "N/A",
      taj: s.lT || "N/A"
    });
    setModal({
      type: "progress",
      data: s
    });
  };
  const oL = s => {
    setPf({
      id: s.id,
      lvType: "",
      lvFrom: "",
      lvTo: "",
      lvReason: ""
    });
    setModal({
      type: "applyLv",
      data: s
    });
  };
  const oQ = s => {
    setPf({
      id: s.id,
      qDate: todayPK(),
      qReason: "",
      notes: ""
    });
    setModal({
      type: "markQt",
      data: s
    });
  };
  const saveP = () => {
    if (!pf.lesson) return;
    const isP = pf.att === "Present" || pf.att === "Late";
    const sid = modal.data.id;
    const _spNow = new Date();
    const dt = pf.date || _spNow.getFullYear() + "-" + String(_spNow.getMonth() + 1).padStart(2, "0") + "-" + String(_spNow.getDate()).padStart(2, "0");
    setSts(sts.map(s => s.id === sid ? {
      ...s,
      lastLesson: pf.lesson,
      lastDate: dt,
      page: pf.page ? parseInt(pf.page) : s.page,
      qaida: s.qaida > 0 && pf.page ? parseInt(pf.page) : s.qaida,
      attended: isP ? s.attended + 1 : s.attended,
      totalClasses: s.totalClasses + 1,
      attendance: Math.round((isP ? s.attended + 1 : s.attended) / (s.totalClasses + 1) * 100),
      lB: pf.beh,
      lP: pf.perf,
      lH: pf.hw,
      lR: pf.rec,
      lT: pf.taj,
      notes: pf.notes ? s.notes ? s.notes + " | " + pf.notes : pf.notes : s.notes
    } : s));
    if (typeof setDailyProgress === "function") {
      setDailyProgress(prev => {
        const list = prev || [];
        const idx = list.findIndex(p => p.studentId === sid && p.date === dt);
        const entry = {
          id: idx >= 0 ? list[idx].id : "dp_" + dt + "_" + sid + "_" + Date.now(),
          studentId: sid,
          date: dt,
          attended: (pf.att || "Present").toLowerCase(),
          lesson: pf.lesson || "",
          pages: pf.page || "",
          behavior: pf.beh || "",
          performance: pf.perf || "",
          homework: pf.hw || "",
          recitation: pf.rec || "",
          tajweed: pf.taj || "",
          notes: pf.notes || "",
          teacherName: modal.data.teacher || "",
          source: "logprogress",
          createdAt: new Date().toISOString()
        };
        if (idx >= 0) {
          const next = [...list];
          next[idx] = {
            ...next[idx],
            ...entry
          };
          return next;
        }
        return [...list, entry];
      });
    }
    setModal(null);
  };
  const saveLv = () => {
    if (!pf.lvType || !pf.lvFrom) return;
    setSts(sts.map(s => s.id === modal.data.id ? {
      ...s,
      status: "leave",
      lvType: pf.lvType,
      lvFrom: pf.lvFrom,
      lvTo: pf.lvTo,
      lvReason: pf.lvReason,
      fu1: "",
      fu2: "",
      notes: (s.notes ? s.notes + " | " : "") + pf.lvType
    } : s));
    setModal(null);
  };
  const saveQt = () => {
    if (!pf.qReason) return;
    setSts(sts.map(s => s.id === modal.data.id ? {
      ...s,
      status: "quit",
      qDate: pf.qDate,
      qReason: pf.qReason,
      notes: "Quit: " + pf.qReason
    } : s));
    setModal(null);
  };
  const resume = id => setSts(sts.map(s => s.id === id ? {
    ...s,
    status: "active",
    lvType: "",
    lvFrom: "",
    lvTo: ""
  } : s));
  const mAtt = (id, st) => {
    console.log("%c[mAtt] CALLED", "color:#0af;font-weight:bold", "id=", id, "(type:" + typeof id + ")", "status=", st);
    const isP = st === "Present" || st === "Late";
    const _now = new Date();
    const today = _now.getFullYear() + "-" + String(_now.getMonth() + 1).padStart(2, "0") + "-" + String(_now.getDate()).padStart(2, "0");
    setSts(sts.map(s => s.id === id ? {
      ...s,
      totalClasses: s.totalClasses + 1,
      attended: isP ? s.attended + 1 : s.attended,
      attendance: Math.round((isP ? s.attended + 1 : s.attended) / (s.totalClasses + 1) * 100),
      lastDate: today
    } : s));
    console.log("[mAtt] student counter updated");
    if (typeof setDailyProgress !== "function") {
      console.error("%c[mAtt] FATAL: setDailyProgress is not a function!", "color:red;font-weight:bold", "typeof=", typeof setDailyProgress, "value=", setDailyProgress);
      return;
    }
    console.log("[mAtt] setDailyProgress is callable, current dailyProgress count:", (dailyProgress || []).length);
    try {
      setDailyProgress(prev => {
        const list = prev || [];
        const idx = list.findIndex(p => p.studentId === id && p.date === today);
        const entry = {
          id: idx >= 0 ? list[idx].id : "dp_" + today + "_" + id + "_" + Date.now(),
          studentId: id,
          date: today,
          attended: st.toLowerCase(),
          source: "quickmark",
          createdAt: new Date().toISOString()
        };
        console.log("%c[mAtt] WRITING ENTRY", "color:#0f0;font-weight:bold", entry, "upsert?", idx >= 0);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = {
            ...next[idx],
            ...entry
          };
          return next;
        }
        return [...list, entry];
      });
      console.log("%c[mAtt] setDailyProgress invoked successfully", "color:#0f0");
    } catch (e) {
      console.error("%c[mAtt] WRITE FAILED:", "color:red;font-weight:bold", e);
    }
  };
  const oAdd = () => {
    setPf({
      name: "",
      age: "",
      gender: "",
      parent: "",
      country: "USA",
      state: "",
      course: "Quran",
      teacher: "",
      fee: "paid",
      time: "",
      dor: todayPK(),
      phone: "",
      email: "",
      hoursPerWeek: "",
      classType: "Regular",
      fee_amount: "",
      currency: "USD",
      notes: "",
      family: ""
    });
    setModal({
      type: "addNew"
    });
  };
  const oAddSibling = existing => {
    setPf({
      name: "",
      age: "",
      gender: "",
      parent: existing.parent || "",
      country: existing.country || "USA",
      state: existing.state || "",
      course: "Quran",
      teacher: existing.teacher || "",
      fee: "paid",
      time: "",
      dor: todayPK(),
      phone: existing.phone || "",
      email: existing.email || "",
      hoursPerWeek: "",
      classType: "Regular",
      fee_amount: "",
      currency: existing.currency || "USD",
      notes: "",
      family: existing.family || existing.parent + " Family",
      _siblingOf: existing.id
    });
    setModal({
      type: "addNew"
    });
  };
  const saveNew = () => {
    if (!pf.name || !pf.parent || !pf.course) return;
    if (pf.course === "Other (Custom)") {
      if (!pf.customCourse || !pf.customCourse.trim()) {
        alert("Please enter a custom course name in the text field.");
        return;
      }
      pf.course = pf.customCourse.trim();
    }
    if (!pf.editingId) {
      const nLower = pf.name.trim().toLowerCase();
      const parentLower = (pf.parent || "").trim().toLowerCase();
      const exact = sts.find(s => (s.name || "").trim().toLowerCase() === nLower && (s.parent || "").trim().toLowerCase() === parentLower);
      const nameOnly = sts.find(s => (s.name || "").trim().toLowerCase() === nLower);
      if (exact) {
        alert('⚠ This student already exists.\n\n"' + pf.name + '" with parent/lead "' + pf.parent + '" is already in the system.\n\nIf this is a different person, please update the parent/lead name to distinguish them.');
        return;
      }
      if (nameOnly) {
        if (!confirm('⚠ A student with the name "' + pf.name + '" already exists (parent: ' + nameOnly.parent + ", teacher: " + nameOnly.teacher + ").\n\nClick OK to save anyway (different person with same name), or Cancel to go back.")) return;
      }
    }
    if (pf.editingId) {
      const oldStu = sts.find(s => s.id === pf.editingId);
      const oldName = oldStu && oldStu.name || "";
      const oldParent = oldStu && oldStu.parent || "";
      setSts(sts.map(s => s.id === pf.editingId ? {
        ...s,
        name: pf.name,
        age: parseInt(pf.age) || 0,
        gender: pf.gender || s.gender,
        parent: pf.parent,
        family: pf.family !== undefined ? pf.family : s.family || "",
        country: pf.country || "USA",
        state: pf.state || "",
        course: pf.course,
        teacher: pf.teacher || "Unassigned",
        fee: pf.fee || s.fee || "trial",
        time: pf.time || "",
        dor: pf.dor,
        phone: pf.phone || s.phone,
        email: pf.email || s.email,
        hoursPerWeek: pf.hoursPerWeek || s.hoursPerWeek,
        classType: pf.classType || s.classType,
        fee_amount: pf.fee_amount || s.fee_amount,
        currency: pf.currency || s.currency,
        notes: pf.notes || s.notes
      } : s));
      if (setAppTeachers && appTeachers && oldName) {
        const nLower = oldName.trim().toLowerCase();
        const pLower = oldParent.trim().toLowerCase();
        const matchesOld = cell => {
          if (!cell || typeof cell !== "object") return false;
          const cs = (cell.s || "").trim().toLowerCase();
          const cl = (cell.l || "").trim().toLowerCase();
          if (cs !== nLower) return false;
          if (pLower && cl && cl !== pLower) return false;
          return true;
        };
        const updatedFields = {
          s: pf.name,
          a: String(parseInt(pf.age) || ""),
          c: pf.course,
          l: pf.parent || "",
          country: pf.country || "USA",
          state: pf.state || "",
          gender: pf.gender || "Any",
          phone: pf.phone || "",
          family: pf.family || ""
        };
        setAppTeachers(appTeachers.map(t => {
          let baseHits = {};
          for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
            const baseT = (TT_DATA[sh].teachers || []).find(x => x.name === t.name || x.code === t.code);
            if (baseT && baseT.schedule) {
              Object.keys(baseT.schedule).forEach(day => {
                Object.keys(baseT.schedule[day] || {}).forEach(slot => {
                  const cell = baseT.schedule[day][slot];
                  if (matchesOld(cell)) {
                    if (!baseHits[day]) baseHits[day] = {};
                    baseHits[day][slot] = {
                      ...cell,
                      ...updatedFields
                    };
                  }
                });
              });
              break;
            }
          }
          const existing = t._ttSchedule || {};
          let changed = Object.keys(baseHits).length > 0;
          const newSched = JSON.parse(JSON.stringify(existing));
          Object.keys(baseHits).forEach(day => {
            if (!newSched[day]) newSched[day] = {};
            Object.keys(baseHits[day]).forEach(slot => {
              newSched[day][slot] = baseHits[day][slot];
            });
          });
          Object.keys(newSched).forEach(day => {
            Object.keys(newSched[day] || {}).forEach(slot => {
              const cell = newSched[day][slot];
              if (matchesOld(cell)) {
                newSched[day][slot] = {
                  ...cell,
                  ...updatedFields
                };
                changed = true;
              }
            });
          });
          return changed ? {
            ...t,
            _ttSchedule: newSched
          } : t;
        }));
      }
      setModal(null);
      return;
    }
    const newId = Math.max(0, ...sts.map(s => s.id)) + 1;
    setSts([...sts, {
      id: newId,
      name: pf.name,
      age: parseInt(pf.age) || 0,
      gender: pf.gender || "",
      parent: pf.parent,
      family: pf.family || "",
      country: pf.country || "USA",
      state: pf.state || "",
      course: pf.course,
      teacher: pf.teacher || "Unassigned",
      fee: pf.fee || "trial",
      time: pf.time || "",
      dor: pf.dor,
      phone: pf.phone || "",
      email: pf.email || "",
      hoursPerWeek: pf.hoursPerWeek || "",
      classType: pf.classType || "Regular",
      fee_amount: pf.fee_amount || "",
      currency: pf.currency || "USD",
      status: "active",
      page: 0,
      qaida: 0,
      attended: 0,
      totalClasses: 0,
      attendance: 100,
      lastLesson: "",
      lastDate: "",
      lB: "Good",
      lP: "Satisfactory",
      lH: "Not Assigned",
      lR: "N/A",
      lT: "N/A",
      notes: pf.notes || "",
      referredBy: pf.referredBy || ""
    }]);
    if (pf.teacher && pf.teacher !== "Unassigned" && pf.time && setAppTeachers && appTeachers) {
      try {
        const targetTeacher = appTeachers.find(t => t.name === pf.teacher);
        if (targetTeacher) {
          let bookDay = "Mon";
          let usaTime = pf.time;
          if (pf.time.indexOf("|") >= 0) {
            const parts = pf.time.split("|");
            bookDay = parts[0];
            usaTime = parts[1];
          }
          const parsed = parseUSTime(usaTime);
          const tz = detectTZ(pf.state || "", usaTime);
          if (parsed && tz) {
            const refDate = new Date();
            const diffMin = tzOffsetMinutes("Asia/Karachi", refDate) - tzOffsetMinutes(tz, refDate);
            const totalMin = parsed.hour * 60 + parsed.minute + diffMin;
            const wrapped = (totalMin % 1440 + 1440) % 1440;
            const pakH = Math.floor(wrapped / 60);
            const pakM = Math.floor(wrapped % 60 / 30) * 30;
            const slotStr = String(pakH).padStart(2, "0") + ":" + String(pakM).padStart(2, "0");
            const newBooking = {
              s: pf.name,
              a: String(parseInt(pf.age) || ""),
              c: pf.course,
              l: pf.parent || "",
              t: usaTime + " USA",
              country: pf.country || "USA",
              state: pf.state || "",
              gender: pf.gender || "Any",
              phone: pf.phone || "",
              family: pf.family || "",
              f: []
            };
            setAppTeachers(appTeachers.map(t => {
              if (t.id !== targetTeacher.id) return t;
              const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
              if (!sch[bookDay]) sch[bookDay] = {};
              sch[bookDay][slotStr] = newBooking;
              return {
                ...t,
                _ttSchedule: sch
              };
            }));
            pf.time = usaTime + " USA · " + bookDay;
          }
        }
      } catch (e) {
        console.error("Auto-booking failed:", e);
      }
    }
    setModal(null);
  };
  const delStudent = id => {
    if (confirm("Delete this student?")) setSts(sts.filter(s => s.id !== id));
  };
  const oES = s => {
    setPf({
      editingId: s.id,
      name: s.name || "",
      age: s.age || "",
      gender: s.gender || "",
      parent: s.parent || "",
      family: s.family || "",
      country: s.country || "USA",
      state: s.state || "",
      course: s.course || "Quran",
      teacher: s.teacher || "",
      fee: s.fee || "paid",
      time: s.time || "",
      dor: s.dor || todayPK(),
      phone: s.phone || "",
      email: s.email || "",
      hoursPerWeek: s.hoursPerWeek || "",
      classType: s.classType || "Regular",
      fee_amount: s.fee_amount || "",
      currency: s.currency || "USD",
      notes: s.notes || ""
    });
    setModal({
      type: "addNew"
    });
  };
  const fc = f => f === "paid" ? "success" : f === "overdue" ? "danger" : f === "partial" ? "warn" : "accent";
  const sc2 = s => s === "active" ? "success" : s === "leave" ? "warn" : s === "quit" ? "danger" : "accent";
  const pp = s => s.course.includes("Quaida") ? Math.round(s.qaida / 30 * 100) : Math.round(s.page / 604 * 100);
  const bc = b => b === "Excellent" ? c.success : b === "Good" ? c.accent : b === "Needs Improvement" ? c.warn : b === "Restless/Distracted" || b === "Disruptive" ? c.danger : c.textSec;
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
  }, act.length, " active \xB7 ", onLv.length, " on leave \xB7 ", qt.length, " quit \xB7 ", od.length, " fee overdue"), canAdd && React.createElement(Btn, {
    icon: Plus,
    onClick: oAdd
  }, "Add Student")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(SC, {
    icon: GraduationCap,
    label: "Active",
    value: act.length,
    color: c.success
  }), React.createElement(SC, {
    icon: Globe,
    label: "Countries",
    value: [...new Set(sts.map(s => s.country))].length,
    sub: "USA, CA, UK",
    color: c.accent
  }), React.createElement(SC, {
    icon: AlertTriangle,
    label: "Fee Overdue",
    value: od.length,
    color: c.danger
  }), React.createElement(SC, {
    icon: Coffee,
    label: "On Leave",
    value: onLv.length,
    color: c.warn
  }), React.createElement(SC, {
    icon: TrendingUp,
    label: "Avg Attend",
    value: Math.round(act.reduce((a, s) => a + s.attendance, 0) / (act.length || 1)) + "%",
    color: c.purple
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 14,
      width: "fit-content"
    }
  }, [["list", "Student List"], ["progress", "Daily Progress"], ["attendance", "Attendance"], ["monthlySheet", "Monthly Sheet"], ["leaves", "Leaves & Quits"]].map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      padding: "7px 16px",
      borderRadius: 6,
      border: tab === k ? "1px solid transparent" : "1px solid " + c.border,
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 500,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), tab === "list" && React.createElement(React.Fragment, null, React.createElement("div", {
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
    placeholder: "Search student, parent, teacher, state...",
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
    value: fSt,
    onChange: e => setFSt(e.target.value),
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
    value: "active"
  }, "Active"), React.createElement("option", {
    value: "leave"
  }, "On Leave"), React.createElement("option", {
    value: "quit"
  }, "Quit")), React.createElement("select", {
    value: fFee,
    onChange: e => setFFee(e.target.value),
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
  }, "All Fees"), React.createElement("option", {
    value: "paid"
  }, "Paid"), React.createElement("option", {
    value: "overdue"
  }, "Overdue")), React.createElement("select", {
    value: fFam,
    onChange: e => setFFam(e.target.value),
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
  }, "All Families"), [...new Set(sts.map(s => s.family).filter(Boolean))].sort().map(fn => React.createElement("option", {
    key: fn,
    value: fn
  }, fn)))), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Student", "Age", "Course", "Teacher", "State", "Progress", "Behavior", "Fee", "Status", ""].map(h => React.createElement("th", {
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
  }, h)))), React.createElement("tbody", null, fd.map((s, i) => React.createElement("tr", {
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
  }, s.name), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec
    }
  }, s.age || "—"), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: (s.course || "—").length > 14 ? (s.course || "—").substring(0, 12) + ".." : s.course || "—",
    color: (s.course || "").includes("Quaida") ? "purple" : (s.course || "").includes("Memo") ? "cyan" : "accent"
  })), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, (s.teacher || "—").split(" ").slice(-2).join(" ")), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.state), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement(PBar, {
    value: pp(s),
    color: pp(s) >= 80 ? c.success : pp(s) >= 40 ? c.accent : c.warn
  }), React.createElement("span", {
    style: {
      fontSize: 9,
      color: c.textSec
    }
  }, pp(s), "%"))), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, s.lB ? React.createElement("span", {
    style: {
      fontSize: 9,
      color: bc(s.lB),
      fontWeight: 600
    }
  }, s.lB) : "—"), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: s.fee,
    color: fc(s.fee)
  })), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: s.status,
    color: sc2(s.status)
  })), React.createElement("td", {
    style: {
      padding: "8px",
      whiteSpace: "nowrap"
    }
  }, React.createElement("button", {
    onClick: () => oV(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.accent
    },
    title: "View Details"
  }, React.createElement(Eye, {
    size: 13
  })), React.createElement("button", {
    onClick: () => oES(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.purple
    },
    title: "Edit Student"
  }, React.createElement(UserCheck, {
    size: 13
  })), React.createElement("button", {
    onClick: () => oAddSibling(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.cyan
    },
    title: "Add Sibling (same family info)"
  }, React.createElement(UserPlus, {
    size: 13
  })), React.createElement("button", {
    onClick: () => oP(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.success
    },
    title: "Log Progress"
  }, React.createElement(Edit2, {
    size: 13
  })), s.status === "active" && React.createElement("button", {
    onClick: () => oL(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.warn
    },
    title: "Apply Leave"
  }, React.createElement(Coffee, {
    size: 13
  }))))))))), tab === "progress" && React.createElement(React.Fragment, null, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Today \u2014 ", new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
      gap: 10
    }
  }, act.sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate)).map(s => React.createElement("div", {
    key: s.id,
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      borderRadius: 8,
      padding: "10px 12px",
      border: "1px solid " + (s.lastDate === todayPK() ? c.success + "66" : c.border)
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: c.accentBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      color: c.accent
    }
  }, s.name[0]), React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, s.name, " (", s.age, ")"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9
    }
  }, s.teacher, " \xB7 ", s.course))), React.createElement("button", {
    onClick: () => oP(s),
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 8px",
      color: c.success,
      fontSize: 9,
      fontWeight: 600
    }
  }, "Log")), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 10,
      fontWeight: 500
    }
  }, s.lastLesson), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginTop: 4,
      flexWrap: "wrap"
    }
  }, s.lB && React.createElement("span", {
    style: {
      fontSize: 8,
      padding: "1px 5px",
      borderRadius: 3,
      background: bc(s.lB) + "20",
      color: bc(s.lB)
    }
  }, s.lB), s.lP && s.lP !== "Satisfactory" && React.createElement("span", {
    style: {
      fontSize: 8,
      padding: "1px 5px",
      borderRadius: 3,
      background: c.purpleBg,
      color: c.purple
    }
  }, s.lP), s.lH && s.lH !== "Not Assigned" && React.createElement("span", {
    style: {
      fontSize: 8,
      padding: "1px 5px",
      borderRadius: 3,
      background: s.lH === "Completed" ? c.successBg : c.dangerBg,
      color: s.lH === "Completed" ? c.success : c.danger
    }
  }, "HW: ", s.lH))), React.createElement("div", {
    style: {
      textAlign: "right",
      marginLeft: 10
    }
  }, s.course.includes("Quaida") ? React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.purple,
      fontSize: 14,
      fontWeight: 700
    }
  }, "P.", s.qaida), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 8
    }
  }, "of 30")) : React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.accent,
      fontSize: 14,
      fontWeight: 700
    }
  }, "J.", s.juz), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 8
    }
  }, "Pg ", s.page, "/604")))))))), tab === "attendance" && React.createElement(React.Fragment, null, React.createElement("div", {
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
      padding: 18
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Attendance Distribution"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200
  }, React.createElement(BarChart, {
    data: [{
      r: "95-100%",
      n: act.filter(s => s.attendance >= 95).length
    }, {
      r: "90-94%",
      n: act.filter(s => s.attendance >= 90 && s.attendance < 95).length
    }, {
      r: "85-89%",
      n: act.filter(s => s.attendance >= 85 && s.attendance < 90).length
    }, {
      r: "80-84%",
      n: act.filter(s => s.attendance >= 80 && s.attendance < 85).length
    }, {
      r: "<80%",
      n: act.filter(s => s.attendance < 80).length
    }]
  }, React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: c.border
  }), React.createElement(XAxis, {
    dataKey: "r",
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
    dataKey: "n",
    radius: [4, 4, 0, 0]
  }, [c.success, c.accent, c.warn, c.warn, c.danger].map((col, i) => React.createElement(Cell, {
    key: i,
    fill: col
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
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Students by State"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, sg.map(([st, cnt]) => React.createElement("div", {
    key: st,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, st), React.createElement("span", {
    style: {
      color: c.accent,
      fontWeight: 700
    }
  }, cnt)))))), React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Quick Mark \u2014 Today"), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Student", "Teacher", "Total", "Attended", "Missed", "Rate", "Mark Today"].map(h => React.createElement("th", {
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
  }, h)))), React.createElement("tbody", null, act.sort((a, b) => a.attendance - b.attendance).map((s, i) => React.createElement("tr", {
    key: s.id,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "7px 8px",
      fontWeight: 600
    }
  }, s.name), React.createElement("td", {
    style: {
      padding: "7px 8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.teacher.split(" ").slice(-2).join(" ")), React.createElement("td", {
    style: {
      padding: "7px 8px",
      color: c.textSec
    }
  }, s.totalClasses), React.createElement("td", {
    style: {
      padding: "7px 8px",
      color: c.success,
      fontWeight: 600
    }
  }, s.attended), React.createElement("td", {
    style: {
      padding: "7px 8px",
      color: s.totalClasses - s.attended > 20 ? c.danger : c.warn
    }
  }, s.totalClasses - s.attended), React.createElement("td", {
    style: {
      padding: "7px 8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement(PBar, {
    value: s.attendance,
    color: s.attendance >= 95 ? c.success : s.attendance >= 85 ? c.warn : c.danger
  }), React.createElement("span", {
    style: {
      fontSize: 9,
      color: s.attendance >= 90 ? c.success : c.danger,
      fontWeight: 600
    }
  }, s.attendance, "%"))), React.createElement("td", {
    style: {
      padding: "7px 8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, React.createElement("button", {
    onClick: () => mAtt(s.id, "Present"),
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 4,
      cursor: "pointer",
      padding: "3px 6px",
      color: c.success,
      fontSize: 8,
      fontWeight: 600
    }
  }, "Present"), React.createElement("button", {
    onClick: () => mAtt(s.id, "Absent"),
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 4,
      cursor: "pointer",
      padding: "3px 6px",
      color: c.danger,
      fontSize: 8,
      fontWeight: 600
    }
  }, "Absent"), React.createElement("button", {
    onClick: () => mAtt(s.id, "Late"),
    style: {
      background: c.warnBg,
      border: "1px solid " + c.warn + "44",
      borderRadius: 4,
      cursor: "pointer",
      padding: "3px 6px",
      color: c.warn,
      fontSize: 8,
      fontWeight: 600
    }
  }, "Late"))))))))), tab === "monthlySheet" && React.createElement(MonthlyAttendanceGrid, {
    students: sts,
    setStudents: setSts
  }), tab === "leaves" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(SC, {
    icon: Coffee,
    label: "On Leave",
    value: onLv.length,
    color: c.warn
  }), React.createElement(SC, {
    icon: UserX,
    label: "Quit",
    value: qt.length,
    color: c.danger
  }), React.createElement(SC, {
    icon: Users,
    label: "Active",
    value: act.length,
    color: c.success
  })), onLv.length > 0 && React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "On Leave (", onLv.length, ")"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
      gap: 10
    }
  }, onLv.map(s => React.createElement("div", {
    key: s.id,
    style: {
      background: c.bgCard,
      border: "1px solid " + c.warn + "44",
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontWeight: 600,
      fontSize: 12
    }
  }, s.name, " (", s.age, ")"), React.createElement(Badge, {
    text: s.lvType || "On Leave",
    color: "warn"
  })), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginBottom: 3
    }
  }, "Teacher: ", s.teacher, " \xB7 ", s.course), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginBottom: 3
    }
  }, "From: ", React.createElement("span", {
    style: {
      color: c.warn
    }
  }, s.lvFrom || "—"), " \u2192 To: ", React.createElement("span", {
    style: {
      color: c.warn
    }
  }, s.lvTo || "TBD")), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginBottom: 3
    }
  }, "Reason: ", s.lvReason || s.notes || "Not specified"), s.fu1 && React.createElement("div", {
    style: {
      fontSize: 9,
      color: c.cyan,
      marginBottom: 2
    }
  }, "Follow-up 1: ", s.fu1), s.fu2 && React.createElement("div", {
    style: {
      fontSize: 9,
      color: c.cyan,
      marginBottom: 4
    }
  }, "Follow-up 2: ", s.fu2), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 4
    }
  }, React.createElement("button", {
    onClick: () => resume(s.id),
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 10px",
      color: c.success,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Resume"), React.createElement("button", {
    onClick: () => oQ(s),
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 10px",
      color: c.danger,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Mark Quit")))))), qt.length > 0 && React.createElement("div", null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Quit (", qt.length, ")"), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Student", "Parent", "Course", "Teacher", "Date", "Reason", ""].map(h => React.createElement("th", {
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
  }, h)))), React.createElement("tbody", null, qt.map((s, i) => React.createElement("tr", {
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
    text: s.course,
    color: "accent"
  })), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.teacher), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.danger
    }
  }, s.qDate || s.lastDate), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec
    }
  }, s.qReason || s.notes), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement("button", {
    onClick: () => resume(s.id),
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
  }, "Re-enroll"))))))))), modal && modal.type === "view" && React.createElement(StudentDetailC, {
    s: modal.data,
    onClose: () => setModal(null),
    onP: () => {
      const s = modal.data;
      setModal(null);
      oP(s);
    },
    pp: pp,
    bc: bc
  }), modal && modal.type === "progress" && React.createElement("div", {
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
  }, "Log Progress \u2014 ", modal.data.name), React.createElement("button", {
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
      background: c.bgDeep,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 10,
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Level"), React.createElement("span", {
    style: {
      color: c.accent,
      fontWeight: 600,
      fontSize: 12
    }
  }, modal.data.course.includes("Quaida") ? "Qaida P." + modal.data.qaida + "/30" : "Juz " + modal.data.juz + " · Pg " + modal.data.page + "/604")), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 12,
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Last"), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 11
    }
  }, modal.data.lastLesson)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Date",
    value: pf.date || "",
    onChange: v => setPf({
      ...pf,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Attendance",
    value: pf.att || "",
    onChange: v => setPf({
      ...pf,
      att: v
    }),
    options: ATT_OPTS
  })), React.createElement(Inp, {
    label: "Today's Lesson *",
    value: pf.lesson || "",
    onChange: v => setPf({
      ...pf,
      lesson: v
    }),
    placeholder: modal.data.course.includes("Quaida") ? "e.g. Qaida Page 19 - Joined Letters" : "e.g. Surah Al-Baqarah ayah 255-260"
  }), React.createElement(Inp, {
    label: modal.data.course.includes("Quaida") ? "Qaida Page" : "Quran Page",
    value: pf.page || "",
    onChange: v => setPf({
      ...pf,
      page: v
    }),
    type: "number",
    placeholder: String((modal.data.qaida || modal.data.page || 0) + 1)
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Behavior",
    value: pf.beh || "",
    onChange: v => setPf({
      ...pf,
      beh: v
    }),
    options: BEHAV_OPTS
  }), React.createElement(Inp, {
    label: "Performance",
    value: pf.perf || "",
    onChange: v => setPf({
      ...pf,
      perf: v
    }),
    options: PERF_OPTS
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Homework",
    value: pf.hw || "",
    onChange: v => setPf({
      ...pf,
      hw: v
    }),
    options: HW_OPTS
  }), React.createElement(Inp, {
    label: "Recitation",
    value: pf.rec || "",
    onChange: v => setPf({
      ...pf,
      rec: v
    }),
    options: RECIT_OPTS
  })), React.createElement(Inp, {
    label: "Tajweed",
    value: pf.taj || "",
    onChange: v => setPf({
      ...pf,
      taj: v
    }),
    options: TAJ_OPTS
  }), React.createElement(Inp, {
    label: "Notes",
    value: pf.notes || "",
    onChange: v => setPf({
      ...pf,
      notes: v
    }),
    placeholder: "Teacher comments, homework assigned..."
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
    onClick: saveP,
    icon: Check
  }, "Save Progress")))), modal && modal.type === "applyLv" && React.createElement("div", {
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
  }, "Apply Leave \u2014 ", modal.data.name), React.createElement("button", {
    onClick: () => setModal(null),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement(Inp, {
    label: "Leave Type *",
    value: pf.lvType || "",
    onChange: v => setPf({
      ...pf,
      lvType: v
    }),
    options: SLEAVE
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "From *",
    value: pf.lvFrom || "",
    onChange: v => setPf({
      ...pf,
      lvFrom: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Return",
    value: pf.lvTo || "",
    onChange: v => setPf({
      ...pf,
      lvTo: v
    }),
    type: "date"
  })), React.createElement(Inp, {
    label: "Reason",
    value: pf.lvReason || "",
    onChange: v => setPf({
      ...pf,
      lvReason: v
    }),
    placeholder: "Reason for leave..."
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
    onClick: saveLv,
    icon: Coffee
  }, "Apply Leave")))), modal && modal.type === "markQt" && React.createElement("div", {
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
      width: 420
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
  }, "Mark Quit \u2014 ", modal.data.name), React.createElement("button", {
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
      background: c.dangerBg,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 12,
      color: c.danger,
      fontSize: 11
    }
  }, "Student will be moved to Quit. Can be re-enrolled later."), React.createElement(Inp, {
    label: "Quit Date",
    value: pf.qDate || "",
    onChange: v => setPf({
      ...pf,
      qDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Reason *",
    value: pf.qReason || "",
    onChange: v => setPf({
      ...pf,
      qReason: v
    }),
    options: ["Course completed", "Not satisfied", "In-person switch", "Financial", "Schedule conflict", "No response", "Other"]
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
    variant: "danger",
    onClick: saveQt,
    icon: UserX
  }, "Confirm Quit")))), modal && modal.type === "addNew" && React.createElement(StudentFormModal, {
    pf: pf,
    setPf: setPf,
    sts: sts,
    appTeachers: appTeachers,
    onSave: saveNew,
    onClose: () => setModal(null)
  }));
};

