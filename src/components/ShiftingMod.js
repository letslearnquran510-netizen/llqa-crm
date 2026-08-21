const ShiftingMod = ({
  teachers,
  setTeachers,
  students,
  setStudents,
  teamLeads,
  shifts: propShifts,
  setShifts: propSetShifts
}) => {
  const shifts = propShifts || [];
  const setShifts = propSetShifts || (() => {});
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [fReason, setFReason] = useState("all");
  const [fSps, setFSps] = useState("all");
  const [fDate, setFDate] = useState("all");
  const [modal, setModal] = useState(null);
  const [f, setF] = useState({});
  const today = new Date();
  const filtered = useMemo(() => {
    let d = shifts;
    if (search) d = d.filter(s => [s.student, s.lead, s.fromT, s.toT, s.reason].some(v => String(v).toLowerCase().includes(search.toLowerCase())));
    if (fReason !== "all") d = d.filter(s => s.reason.toLowerCase().includes(fReason.toLowerCase()));
    if (fSps !== "all") d = d.filter(s => fSps === "yes" ? s.sps === "yes" : s.sps !== "yes");
    if (fDate === "week") d = d.filter(s => (today - new Date(s.date)) / (1000 * 60 * 60 * 24) <= 7);
    if (fDate === "month") d = d.filter(s => (today - new Date(s.date)) / (1000 * 60 * 60 * 24) <= 30);
    if (fDate === "year") d = d.filter(s => (today - new Date(s.date)) / (1000 * 60 * 60 * 24) <= 365);
    return d.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [shifts, search, fReason, fSps, fDate]);
  const stats = useMemo(() => {
    const last30 = shifts.filter(s => (today - new Date(s.date)) / (1000 * 60 * 60 * 24) <= 30);
    const last7 = shifts.filter(s => (today - new Date(s.date)) / (1000 * 60 * 60 * 24) <= 7);
    const pendingSps = shifts.filter(s => s.sps !== "yes").length;
    const pendingFb = shifts.filter(s => !s.feedback).length;
    return {
      total: shifts.length,
      last30: last30.length,
      last7: last7.length,
      pendingSps,
      pendingFb
    };
  }, [shifts]);
  const rc = useMemo(() => {
    const g = {};
    shifts.forEach(s => {
      const k = s.reason.includes("Resign") ? "Resignation" : s.reason.includes("Terminated") || s.reason.includes("Fired") ? "Terminated" : s.reason.includes("Leave") || s.reason.includes("sick") ? "Leave/Sick" : s.reason.includes("Ramadan") ? "Ramadan" : s.reason.includes("Time") ? "Time Change" : s.reason.includes("Parent") || s.reason.includes("Request") ? "Parent Req" : "Other";
      g[k] = (g[k] || 0) + 1;
    });
    return Object.entries(g).sort((a, b) => b[1] - a[1]);
  }, [shifts]);
  const tT = useMemo(() => {
    const out = {},
      inn = {};
    shifts.forEach(s => {
      out[s.fromT] = (out[s.fromT] || 0) + 1;
      inn[s.toT] = (inn[s.toT] || 0) + 1;
    });
    return {
      top_out: Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 8),
      top_in: Object.entries(inn).sort((a, b) => b[1] - a[1]).slice(0, 8)
    };
  }, [shifts]);
  const monthly = useMemo(() => {
    const g = {};
    shifts.forEach(s => {
      const m = s.date.substring(0, 7);
      g[m] = (g[m] || 0) + 1;
    });
    return Object.entries(g).sort().slice(-12).map(([m, n]) => ({
      month: m.substring(5),
      count: n
    }));
  }, [shifts]);
  const oNew = () => {
    setF({
      date: todayPK(),
      lead: "",
      student: "",
      fromT: "",
      fromTime: "",
      fromLead: "",
      toT: "",
      toTime: "",
      toLead: "",
      reason: "",
      sps: "Pending",
      feedback: "Pending"
    });
    setModal({
      type: "new"
    });
  };
  const oEdit = s => {
    setF({
      ...s
    });
    setModal({
      type: "edit",
      data: s
    });
  };
  const oView = s => setModal({
    type: "view",
    data: s
  });
  const oDel = s => setModal({
    type: "delete",
    data: s
  });
  const oBulk = () => {
    setF({
      fromT: "",
      reason: "",
      date: todayPK()
    });
    setModal({
      type: "bulk"
    });
  };
  const save = () => {
    if (!f.student || !f.fromT || !f.toT) return;
    if (modal.type === "new") {
      setShifts([{
        ...f,
        id: Date.now(),
        sno: shifts.length + 1,
        sps: f.sps === "Conveyed" ? "yes" : "no"
      }, ...shifts]);
      if (setTeachers && teachers && f.fromTime && f.toTime) {
        const fromT = teachers.find(t => t.name === f.fromT);
        const toT = teachers.find(t => t.name === f.toT);
        if (fromT && toT) {
          const shiftDate = f.date ? new Date(f.date) : new Date();
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const defaultDay = dayNames[shiftDate.getDay()];
          const stuRec = (students || []).find(s => (s.name || "").trim().toLowerCase() === String(f.student || "").trim().toLowerCase());
          const stuState = stuRec && stuRec.state || "";
          const usaToPktSlot = usaStr => {
            const parsed = parseUSTime(usaStr);
            const tz = detectTZ(stuState, "") || "America/New_York";
            if (!parsed || !tz) return null;
            const refDate = new Date();
            const diffMin = tzOffsetMinutes("Asia/Karachi", refDate) - tzOffsetMinutes(tz, refDate);
            const totalMin = parsed.hour * 60 + parsed.minute + diffMin;
            const wrapped = (totalMin % 1440 + 1440) % 1440;
            const pakH = Math.floor(wrapped / 60);
            const pakM = Math.floor(wrapped % 60 / 30) * 30;
            return String(pakH).padStart(2, "0") + ":" + String(pakM).padStart(2, "0");
          };
          const norm = tm => {
            if (!tm) return "";
            const s = String(tm).trim();
            if (/^\d{2}:\d{2}$/.test(s)) return s;
            const pkt = usaToPktSlot(s);
            if (pkt) return pkt;
            const m = s.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
            if (!m) return s;
            let h = parseInt(m[1], 10);
            const mn = m[2] || "00";
            const ap = (m[3] || "").toUpperCase();
            if (ap === "PM" && h < 12) h += 12;
            if (ap === "AM" && h === 12) h = 0;
            return String(h).padStart(2, "0") + ":" + mn;
          };
          const parsePair = tm => {
            if (!tm) return {
              day: defaultDay,
              slot: ""
            };
            const s = String(tm).trim();
            if (s.indexOf("|") >= 0) {
              const p = s.split("|");
              return {
                day: p[0] || defaultDay,
                slot: norm(p[1] || "")
              };
            }
            return {
              day: defaultDay,
              slot: norm(s)
            };
          };
          const fromPair = parsePair(f.fromTime);
          const toPair = parsePair(f.toTime);
          const fromDay = fromPair.day;
          const fromSlot = fromPair.slot;
          const toDay = toPair.day;
          const toSlot = toPair.slot;
          let existingCell = null;
          {
            const sch = fromT._ttSchedule || {};
            const cellOv = (sch[fromDay] || {})[fromSlot];
            if (cellOv && typeof cellOv === "object") existingCell = cellOv;else {
              for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
                const baseT = (TT_DATA[sh].teachers || []).find(x => x.name === fromT.name || x.code === fromT.code);
                if (baseT && baseT.schedule) {
                  const c2 = (baseT.schedule[fromDay] || {})[fromSlot];
                  if (c2 && typeof c2 === "object") {
                    existingCell = c2;
                    break;
                  }
                }
              }
            }
          }
          const carried = existingCell ? {
            a: existingCell.a || "",
            c: existingCell.c || "Quran",
            country: existingCell.country || "USA",
            state: existingCell.state || "",
            gender: existingCell.gender || "Any",
            phone: existingCell.phone || "",
            family: existingCell.family || "",
            t: existingCell.t || "",
            f: existingCell.f || []
          } : {
            a: stuRec ? String(stuRec.age || "") : "",
            c: stuRec && stuRec.course || "Quran",
            country: stuRec && stuRec.country || "USA",
            state: stuState,
            gender: stuRec && stuRec.gender || "Any",
            phone: stuRec && stuRec.phone || "",
            family: stuRec && stuRec.family || "",
            t: "",
            f: []
          };
          const newBooking = {
            s: f.student,
            a: carried.a,
            c: carried.c,
            l: f.toLead || f.lead || stuRec && stuRec.parent || "",
            t: carried.t,
            country: carried.country,
            state: carried.state,
            gender: carried.gender,
            phone: carried.phone,
            family: carried.family,
            f: carried.f
          };
          setTeachers(teachers.map(t => {
            if (t.id === fromT.id) {
              const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
              if (!sch[fromDay]) sch[fromDay] = {};
              sch[fromDay][fromSlot] = "F";
              return {
                ...t,
                _ttSchedule: sch
              };
            }
            if (t.id === toT.id) {
              const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
              if (!sch[toDay]) sch[toDay] = {};
              sch[toDay][toSlot] = newBooking;
              return {
                ...t,
                _ttSchedule: sch
              };
            }
            return t;
          }));
          if (stuRec && setStudents) {
            const pktToUSA = (pktSlot, state) => {
              const m = String(pktSlot || "").match(/^(\d{2}):(\d{2})$/);
              if (!m) return "";
              const pH = parseInt(m[1], 10),
                pM = parseInt(m[2], 10);
              const tz = detectTZ(state || "", "") || "America/New_York";
              const refDate = new Date();
              const diffMin = tzOffsetMinutes("Asia/Karachi", refDate) - tzOffsetMinutes(tz, refDate);
              const totalMin = pH * 60 + pM - diffMin;
              const wrapped = (totalMin % 1440 + 1440) % 1440;
              const uH = Math.floor(wrapped / 60),
                uM = wrapped % 60;
              const period = uH >= 12 ? "PM" : "AM";
              let dh = uH % 12;
              if (dh === 0) dh = 12;
              return String(dh).padStart(2, "0") + String(uM).padStart(2, "0") + " " + period;
            };
            const newUsaTime = pktToUSA(toSlot, stuState);
            const newTimeField = newUsaTime ? toDay + "|" + newUsaTime : toDay + "|" + toSlot;
            setStudents(students.map(s => s.id === stuRec.id ? {
              ...s,
              teacher: f.toT,
              time: newTimeField
            } : s));
          }
        }
      }
    } else {
      const old = modal.data;
      const bookingChanged = old && (old.fromT !== f.fromT || old.toT !== f.toT || old.fromTime !== f.fromTime || old.toTime !== f.toTime || old.student !== f.student);
      if (bookingChanged && old.fromT && old.toT && old.fromTime && old.toTime && setTeachers && teachers) {
        const oldFromT = (teachers || []).find(t => t.name === old.fromT);
        const oldToT = (teachers || []).find(t => t.name === old.toT);
        const stuRec = (students || []).find(s => (s.name || "").trim().toLowerCase() === String(old.student || "").trim().toLowerCase());
        const stuState = stuRec && stuRec.state || "";
        const shiftDate = old.date ? new Date(old.date) : new Date();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const defaultDay = dayNames[shiftDate.getDay()];
        const usaToPktSlot = usaStr => {
          const parsed = parseUSTime(usaStr);
          const tz = detectTZ(stuState, "") || "America/New_York";
          if (!parsed || !tz) return null;
          const refDate = new Date();
          const diffMin = tzOffsetMinutes("Asia/Karachi", refDate) - tzOffsetMinutes(tz, refDate);
          const totalMin = parsed.hour * 60 + parsed.minute + diffMin;
          const wrapped = (totalMin % 1440 + 1440) % 1440;
          const pakH = Math.floor(wrapped / 60);
          const pakM = Math.floor(wrapped % 60 / 30) * 30;
          return String(pakH).padStart(2, "0") + ":" + String(pakM).padStart(2, "0");
        };
        const norm = tm => {
          if (!tm) return "";
          const s = String(tm).trim();
          if (/^\d{2}:\d{2}$/.test(s)) return s;
          const pkt = usaToPktSlot(s);
          if (pkt) return pkt;
          const m = s.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
          if (!m) return s;
          let h = parseInt(m[1], 10);
          const mn = m[2] || "00";
          const ap = (m[3] || "").toUpperCase();
          if (ap === "PM" && h < 12) h += 12;
          if (ap === "AM" && h === 12) h = 0;
          return String(h).padStart(2, "0") + ":" + mn;
        };
        const parsePair = tm => {
          if (!tm) return {
            day: defaultDay,
            slot: ""
          };
          const s = String(tm).trim();
          if (s.indexOf("|") >= 0) {
            const p = s.split("|");
            return {
              day: p[0] || defaultDay,
              slot: norm(p[1] || "")
            };
          }
          return {
            day: defaultDay,
            slot: norm(s)
          };
        };
        const oldFromPair = parsePair(old.fromTime);
        const oldToPair = parsePair(old.toTime);
        const newFromT = (teachers || []).find(t => t.name === f.fromT);
        const newToT = (teachers || []).find(t => t.name === f.toT);
        if (!newFromT || !newToT) {
          alert("Cannot save edit: From/To teacher invalid.");
          return;
        }
        const newStuRec = (students || []).find(s => (s.name || "").trim().toLowerCase() === String(f.student || "").trim().toLowerCase());
        const newStuState = newStuRec && newStuRec.state || "";
        const newShiftDate = f.date ? new Date(f.date) : new Date();
        const newDefaultDay = dayNames[newShiftDate.getDay()];
        const newParsePair = tm => {
          if (!tm) return {
            day: newDefaultDay,
            slot: ""
          };
          const s = String(tm).trim();
          if (s.indexOf("|") >= 0) {
            const p = s.split("|");
            return {
              day: p[0] || newDefaultDay,
              slot: norm(p[1] || "")
            };
          }
          return {
            day: newDefaultDay,
            slot: norm(s)
          };
        };
        const newFromPair = newParsePair(f.fromTime);
        const newToPair = newParsePair(f.toTime);
        let movedCell = null;
        if (oldToT) {
          const sch = oldToT._ttSchedule || {};
          const cellOv = (sch[oldToPair.day] || {})[oldToPair.slot];
          if (cellOv && typeof cellOv === "object") movedCell = cellOv;
        }
        const restoreCell = movedCell ? {
          ...movedCell
        } : null;
        const newBooking = movedCell ? {
          ...movedCell,
          s: f.student,
          l: f.toLead || movedCell.l || ""
        } : {
          s: f.student,
          a: newStuRec ? String(newStuRec.age || "") : "",
          c: newStuRec && newStuRec.course || "Quran",
          l: f.toLead || newStuRec && newStuRec.parent || "",
          t: "",
          country: newStuRec && newStuRec.country || "USA",
          state: newStuState,
          gender: newStuRec && newStuRec.gender || "Any",
          phone: newStuRec && newStuRec.phone || "",
          family: newStuRec && newStuRec.family || "",
          f: []
        };
        setTeachers(teachers.map(t => {
          let result = t;
          if (oldToT && t.id === oldToT.id) {
            const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
            if (!sch[oldToPair.day]) sch[oldToPair.day] = {};
            sch[oldToPair.day][oldToPair.slot] = "F";
            result = {
              ...result,
              _ttSchedule: sch
            };
          }
          if (oldFromT && t.id === oldFromT.id && restoreCell) {
            const sch = result._ttSchedule ? JSON.parse(JSON.stringify(result._ttSchedule)) : {};
            if (!sch[oldFromPair.day]) sch[oldFromPair.day] = {};
            sch[oldFromPair.day][oldFromPair.slot] = restoreCell;
            result = {
              ...result,
              _ttSchedule: sch
            };
          }
          if (t.id === newFromT.id) {
            const sch = result._ttSchedule ? JSON.parse(JSON.stringify(result._ttSchedule)) : {};
            if (!sch[newFromPair.day]) sch[newFromPair.day] = {};
            sch[newFromPair.day][newFromPair.slot] = "F";
            result = {
              ...result,
              _ttSchedule: sch
            };
          }
          if (t.id === newToT.id) {
            const sch = result._ttSchedule ? JSON.parse(JSON.stringify(result._ttSchedule)) : {};
            if (!sch[newToPair.day]) sch[newToPair.day] = {};
            sch[newToPair.day][newToPair.slot] = newBooking;
            result = {
              ...result,
              _ttSchedule: sch
            };
          }
          return result;
        }));
        if (newStuRec && setStudents) {
          setStudents(students.map(s => s.id === newStuRec.id ? {
            ...s,
            teacher: f.toT
          } : s));
        }
      }
      setShifts(shifts.map(s => s.id === modal.data.id ? {
        ...s,
        ...f,
        sps: f.sps === "Conveyed" ? "yes" : "no"
      } : s));
    }
    setModal(null);
  };
  const del = () => {
    const rec = modal.data;
    if (rec && rec.fromT && rec.toT && rec.fromTime && rec.toTime) {
      const fromT = (teachers || []).find(t => t.name === rec.fromT);
      const toT = (teachers || []).find(t => t.name === rec.toT);
      if (fromT && toT) {
        const stuRec = (students || []).find(s => (s.name || "").trim().toLowerCase() === String(rec.student || "").trim().toLowerCase());
        const stuState = stuRec && stuRec.state || "";
        const shiftDate = rec.date ? new Date(rec.date) : new Date();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const defaultDay = dayNames[shiftDate.getDay()];
        const usaToPktSlot = usaStr => {
          const parsed = parseUSTime(usaStr);
          const tz = detectTZ(stuState, "") || "America/New_York";
          if (!parsed || !tz) return null;
          const refDate = new Date();
          const diffMin = tzOffsetMinutes("Asia/Karachi", refDate) - tzOffsetMinutes(tz, refDate);
          const totalMin = parsed.hour * 60 + parsed.minute + diffMin;
          const wrapped = (totalMin % 1440 + 1440) % 1440;
          const pakH = Math.floor(wrapped / 60);
          const pakM = Math.floor(wrapped % 60 / 30) * 30;
          return String(pakH).padStart(2, "0") + ":" + String(pakM).padStart(2, "0");
        };
        const norm = tm => {
          if (!tm) return "";
          const s = String(tm).trim();
          if (/^\d{2}:\d{2}$/.test(s)) return s;
          const pkt = usaToPktSlot(s);
          if (pkt) return pkt;
          const m = s.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
          if (!m) return s;
          let h = parseInt(m[1], 10);
          const mn = m[2] || "00";
          const ap = (m[3] || "").toUpperCase();
          if (ap === "PM" && h < 12) h += 12;
          if (ap === "AM" && h === 12) h = 0;
          return String(h).padStart(2, "0") + ":" + mn;
        };
        const parsePair = tm => {
          if (!tm) return {
            day: defaultDay,
            slot: ""
          };
          const s = String(tm).trim();
          if (s.indexOf("|") >= 0) {
            const p = s.split("|");
            return {
              day: p[0] || defaultDay,
              slot: norm(p[1] || "")
            };
          }
          return {
            day: defaultDay,
            slot: norm(s)
          };
        };
        const fromPair = parsePair(rec.fromTime);
        const toPair = parsePair(rec.toTime);
        if (!confirm("Delete this shift record AND reverse the booking move?\n\nThis will:\n\u2022 Free " + rec.toT + "\u0027s " + toPair.day + " " + toPair.slot + " slot\n\u2022 Restore " + rec.student + " to " + rec.fromT + "\u0027s " + fromPair.day + " " + fromPair.slot + " slot")) return;
        let movedCell = null;
        {
          const sch = toT._ttSchedule || {};
          const cellOv = (sch[toPair.day] || {})[toPair.slot];
          if (cellOv && typeof cellOv === "object") movedCell = cellOv;
        }
        const restoreCell = movedCell ? {
          ...movedCell,
          l: rec.fromLead || stuRec && stuRec.parent || movedCell.l || ""
        } : {
          s: rec.student,
          a: stuRec ? String(stuRec.age || "") : "",
          c: stuRec && stuRec.course || "Quran",
          l: rec.fromLead || stuRec && stuRec.parent || "",
          t: "",
          country: stuRec && stuRec.country || "USA",
          state: stuState,
          gender: stuRec && stuRec.gender || "Any",
          phone: stuRec && stuRec.phone || "",
          family: stuRec && stuRec.family || "",
          f: []
        };
        setTeachers(teachers.map(t => {
          if (t.id === toT.id) {
            const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
            if (!sch[toPair.day]) sch[toPair.day] = {};
            sch[toPair.day][toPair.slot] = "F";
            return {
              ...t,
              _ttSchedule: sch
            };
          }
          if (t.id === fromT.id) {
            const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
            if (!sch[fromPair.day]) sch[fromPair.day] = {};
            sch[fromPair.day][fromPair.slot] = restoreCell;
            return {
              ...t,
              _ttSchedule: sch
            };
          }
          return t;
        }));
        if (stuRec && setStudents) {
          setStudents(students.map(s => s.id === stuRec.id ? {
            ...s,
            teacher: rec.fromT
          } : s));
        }
      }
    }
    setShifts(shifts.filter(s => s.id !== modal.data.id));
    setModal(null);
  };
  const markSps = id => setShifts(shifts.map(s => s.id === id ? {
    ...s,
    sps: "yes"
  } : s));
  const markFb = (id, fb) => setShifts(shifts.map(s => s.id === id ? {
    ...s,
    feedback: fb
  } : s));
  const rColor = r => r.includes("Resign") || r.includes("Terminated") || r.includes("Fired") ? "danger" : r.includes("Ramadan") ? "purple" : r.includes("Leave") || r.includes("sick") ? "warn" : r.includes("Parent") || r.includes("Request") ? "accent" : "cyan";
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
  }, stats.total, " total shifts \xB7 ", stats.last30, " last month \xB7 ", stats.pendingSps, " SPS pending"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement(Btn, {
    icon: Plus,
    onClick: oNew
  }, "New Shift"), React.createElement(Btn, {
    variant: "outline",
    icon: ArrowRightLeft,
    onClick: oBulk
  }, "Bulk Shift"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(SC, {
    icon: ArrowRightLeft,
    label: "Total Shifts",
    value: stats.total,
    color: c.accent
  }), React.createElement(SC, {
    icon: TrendingUp,
    label: "Last 30 Days",
    value: stats.last30,
    color: c.success
  }), React.createElement(SC, {
    icon: Clock,
    label: "Last 7 Days",
    value: stats.last7,
    color: c.cyan
  }), React.createElement(SC, {
    icon: AlertTriangle,
    label: "SPS Pending",
    value: stats.pendingSps,
    color: c.warn
  }), React.createElement(SC, {
    icon: Coffee,
    label: "Feedback Pending",
    value: stats.pendingFb,
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
  }, [["list", "Shift Registry"], ["analytics", "Analytics"], ["pending", "SPS & Feedback"], ["timeline", "Timeline"]].map(([k, l]) => React.createElement("button", {
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
    placeholder: "Search student, teacher, lead, reason...",
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
    value: fDate,
    onChange: e => setFDate(e.target.value),
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
  }, "All Dates"), React.createElement("option", {
    value: "week"
  }, "Last 7 days"), React.createElement("option", {
    value: "month"
  }, "Last 30 days"), React.createElement("option", {
    value: "year"
  }, "Last year")), React.createElement("select", {
    value: fReason,
    onChange: e => setFReason(e.target.value),
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
  }, "All Reasons"), React.createElement("option", {
    value: "Resign"
  }, "Resignations"), React.createElement("option", {
    value: "Ramadan"
  }, "Ramadan"), React.createElement("option", {
    value: "Time"
  }, "Time Change"), React.createElement("option", {
    value: "Parent"
  }, "Parent Request"), React.createElement("option", {
    value: "Leave"
  }, "Leave/Sick")), React.createElement("select", {
    value: fSps,
    onChange: e => setFSps(e.target.value),
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
  }, "All SPS"), React.createElement("option", {
    value: "yes"
  }, "Conveyed"), React.createElement("option", {
    value: "no"
  }, "Pending"))), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Date", "Student", "Lead", "Transfer", "Reason", "SPS", "Feedback", ""].map(h => React.createElement("th", {
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
  }, h)))), React.createElement("tbody", null, filtered.map((s, i) => React.createElement("tr", {
    key: s.id,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "8px",
      color: c.accent,
      fontSize: 10,
      whiteSpace: "nowrap"
    }
  }, s.date), React.createElement("td", {
    style: {
      padding: "8px",
      fontWeight: 600
    }
  }, s.student, React.createElement("div", {
    style: {
      fontSize: 9,
      color: c.textSec
    }
  }, s.lead)), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.textSec,
      fontSize: 10
    }
  }, s.fromLead, " \u2192 ", s.toLead), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10
    }
  }, React.createElement("span", {
    style: {
      color: c.danger,
      fontWeight: 600
    }
  }, s.fromT), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, s.fromTime), React.createElement(ArrowRightLeft, {
    size: 10,
    color: c.accent
  }), React.createElement("span", {
    style: {
      color: c.success,
      fontWeight: 600
    }
  }, s.toT), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, s.toTime))), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement(Badge, {
    text: s.reason.length > 20 ? s.reason.substring(0, 18) + ".." : s.reason,
    color: rColor(s.reason)
  })), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, s.sps === "yes" ? React.createElement(Badge, {
    text: "Conveyed",
    color: "success"
  }) : React.createElement("button", {
    onClick: () => markSps(s.id),
    style: {
      background: c.warnBg,
      border: "1px solid " + c.warn + "44",
      borderRadius: 4,
      cursor: "pointer",
      padding: "3px 6px",
      color: c.warn,
      fontSize: 9,
      fontWeight: 600
    }
  }, "Mark Done")), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, s.feedback ? React.createElement(Badge, {
    text: s.feedback.length > 15 ? s.feedback.substring(0, 13) + ".." : s.feedback,
    color: s.feedback.includes("Satisfied") && !s.feedback.includes("Not") ? "success" : s.feedback.includes("Not") ? "danger" : "warn"
  }) : React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, "\u2014")), React.createElement("td", {
    style: {
      padding: "8px",
      whiteSpace: "nowrap"
    }
  }, React.createElement("button", {
    onClick: () => oView(s),
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
    onClick: () => oEdit(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.warn
    }
  }, React.createElement(Edit2, {
    size: 13
  })), React.createElement("button", {
    onClick: () => oDel(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 3,
      color: c.danger
    }
  }, React.createElement(Trash2, {
    size: 13
  })))))))), React.createElement("p", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      marginTop: 6
    }
  }, "Showing ", filtered.length, " of ", shifts.length, " shifts")), tab === "analytics" && React.createElement(React.Fragment, null, React.createElement("div", {
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
  }, "Monthly Shift Volume (Last 12 months)"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, React.createElement(AreaChart, {
    data: monthly
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
  }), React.createElement(Area, {
    type: "monotone",
    dataKey: "count",
    stroke: c.accent,
    fill: c.accentBg,
    strokeWidth: 2
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
  }, "Reason Breakdown"), React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 220
  }, React.createElement(PieChart, null, React.createElement(Pie, {
    data: rc.map(([k, v]) => ({
      name: k,
      value: v
    })),
    cx: "50%",
    cy: "50%",
    outerRadius: 70,
    innerRadius: 38,
    dataKey: "value",
    label: ({
      name,
      percent
    }) => name + " " + (percent * 100).toFixed(0) + "%",
    fontSize: 8
  }, rc.map((_, i) => React.createElement(Cell, {
    key: i,
    fill: CC[i % CC.length]
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
      padding: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      margin: "0 0 10px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "Top Losing Teachers (Students Transferred Away)"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, tT.top_out.map(([name, cnt], i) => React.createElement("div", {
    key: i,
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
  }, name), React.createElement(PBar, {
    value: cnt,
    max: tT.top_out[0][1],
    color: c.danger
  }), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 11,
      fontWeight: 700,
      minWidth: 20,
      textAlign: "right"
    }
  }, cnt))))), React.createElement("div", {
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
  }, "Top Receiving Teachers (Students Transferred To)"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, tT.top_in.map(([name, cnt], i) => React.createElement("div", {
    key: i,
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
  }, name), React.createElement(PBar, {
    value: cnt,
    max: tT.top_in[0][1],
    color: c.success
  }), React.createElement("span", {
    style: {
      color: c.success,
      fontSize: 11,
      fontWeight: 700,
      minWidth: 20,
      textAlign: "right"
    }
  }, cnt))))))), tab === "pending" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "SPS Pending (", shifts.filter(s => s.sps !== "yes").length, ")"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
      gap: 10
    }
  }, shifts.filter(s => s.sps !== "yes").slice(0, 12).map(s => React.createElement("div", {
    key: s.id,
    style: {
      background: c.bgCard,
      border: "1px solid " + c.warn + "44",
      borderRadius: 8,
      padding: "10px 12px"
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
      fontWeight: 600,
      fontSize: 12
    }
  }, s.student), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 10
    }
  }, s.date)), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginBottom: 4
    }
  }, "Lead: ", s.lead), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.danger
    }
  }, s.fromT), " \u2192 ", React.createElement("span", {
    style: {
      color: c.success
    }
  }, s.toT)), React.createElement("button", {
    onClick: () => markSps(s.id),
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 10px",
      color: c.success,
      fontSize: 10,
      fontWeight: 600,
      width: "100%"
    }
  }, "Mark SPS Conveyed"))))), React.createElement("div", null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Awaiting Feedback (", shifts.filter(s => !s.feedback || s.feedback === "Pending").length, ")"), React.createElement("div", {
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
  }, React.createElement("thead", null, React.createElement("tr", null, ["Date", "Student", "From", "To", "Quick Action"].map(h => React.createElement("th", {
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
  }, h)))), React.createElement("tbody", null, shifts.filter(s => !s.feedback || s.feedback === "Pending").slice(0, 15).map((s, i) => React.createElement("tr", {
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
  }, s.date), React.createElement("td", {
    style: {
      padding: "8px",
      fontWeight: 600
    }
  }, s.student), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.danger,
      fontSize: 10
    }
  }, s.fromT), React.createElement("td", {
    style: {
      padding: "8px",
      color: c.success,
      fontSize: 10
    }
  }, s.toT), React.createElement("td", {
    style: {
      padding: "8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, React.createElement("button", {
    onClick: () => markFb(s.id, "Satisfied"),
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
  }, "Satisfied"), React.createElement("button", {
    onClick: () => markFb(s.id, "Not Satisfied"),
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
  }, "Not Satisfied"), React.createElement("button", {
    onClick: () => markFb(s.id, "On Hold"),
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
  }, "On Hold")))))))))), tab === "timeline" && React.createElement(React.Fragment, null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Recent Shift Timeline"), React.createElement("div", {
    style: {
      position: "relative",
      paddingLeft: 22
    }
  }, React.createElement("div", {
    style: {
      position: "absolute",
      left: 7,
      top: 5,
      bottom: 5,
      width: 2,
      background: c.border
    }
  }), shifts.slice(0, 25).map((s, i) => React.createElement("div", {
    key: s.id,
    style: {
      position: "relative",
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      position: "absolute",
      left: -21,
      top: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      background: rColor(s.reason) === "danger" ? c.danger : rColor(s.reason) === "warn" ? c.warn : c.accent,
      border: "3px solid " + c.bg
    }
  }), React.createElement("div", {
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
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontWeight: 600,
      fontSize: 12
    }
  }, s.student), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 10
    }
  }, s.date)), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 3,
      fontSize: 11
    }
  }, React.createElement("span", {
    style: {
      color: c.danger,
      fontWeight: 600
    }
  }, s.fromT), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, "(", s.fromTime, ")"), React.createElement(ArrowRightLeft, {
    size: 12,
    color: c.accent
  }), React.createElement("span", {
    style: {
      color: c.success,
      fontWeight: 600
    }
  }, s.toT), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9
    }
  }, "(", s.toTime, ")")), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec
    }
  }, "Parent: ", s.lead, " \xB7 ", s.fromLead, " \u2192 ", s.toLead), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 5,
      flexWrap: "wrap"
    }
  }, React.createElement(Badge, {
    text: s.reason.length > 25 ? s.reason.substring(0, 23) + ".." : s.reason,
    color: rColor(s.reason)
  }), s.sps === "yes" && React.createElement(Badge, {
    text: "SPS \u2713",
    color: "success"
  }), s.feedback && React.createElement(Badge, {
    text: s.feedback,
    color: s.feedback.includes("Satisfied") && !s.feedback.includes("Not") ? "success" : s.feedback.includes("Not") ? "danger" : "warn"
  }))))))), modal && (modal.type === "new" || modal.type === "edit") && React.createElement("div", {
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
  }, modal.type === "new" ? "New Class Shift" : "Edit Shift"), React.createElement("button", {
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
  }, "Record a class transfer from one teacher to another. Both teachers and time slots required."), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Shifting Date *",
    value: f.date || "",
    onChange: v => setF({
      ...f,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Parent / Lead",
    value: f.lead || "",
    onChange: v => setF({
      ...f,
      lead: v
    }),
    placeholder: "Parent/guardian name"
  })), React.createElement("div", {
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
  }, "Student Name * \u2014 " + (students || []).filter(s => s.status !== "quit").length + " available"), React.createElement("input", {
    list: "stuShiftOptions",
    value: f.student || "",
    onChange: e => {
      const v = e.target.value;
      const matched = (students || []).find(s => (s.name || "").toLowerCase() === v.toLowerCase());
      if (matched) {
        setF({
          ...f,
          student: v,
          lead: matched.parent || f.lead || "",
          fromT: matched.teacher || f.fromT || "",
          fromTime: matched.time || f.fromTime || "",
          fromLead: (() => {
            const tt = (teachers || []).find(t => t.name === matched.teacher);
            return tt ? tt.teamLead || f.fromLead || "" : f.fromLead || "";
          })()
        });
      } else {
        setF({
          ...f,
          student: v
        });
      }
    },
    placeholder: "Type or pick student",
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  }), React.createElement("datalist", {
    id: "stuShiftOptions"
  }, (students || []).filter(s => s.status !== "quit").map(s => React.createElement("option", {
    key: s.id,
    value: s.name,
    label: s.name + (s.parent ? " (parent: " + s.parent + ")" : "") + " \u2014 " + (s.teacher || "unassigned") + (s.time ? " \u00B7 " + s.time : "")
  })))), React.createElement("div", {
    style: {
      background: c.dangerBg,
      borderRadius: 8,
      padding: "6px 10px",
      marginBottom: 8,
      color: c.danger,
      fontSize: 10,
      fontWeight: 600
    }
  }, "FROM (Current Teacher)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement("div", {
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
  }, "Current Teacher *"), React.createElement("select", {
    value: f.fromT || "",
    onChange: e => {
      const v = e.target.value;
      const tt = (teachers || []).find(t => t.name === v);
      setF({
        ...f,
        fromT: v,
        fromLead: tt ? tt.teamLead || f.fromLead || "" : f.fromLead || ""
      });
    },
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  }, React.createElement("option", {
    value: ""
  }, "-- Select Current Teacher --"), (teachers || []).filter(t => t.status !== "resigned" && t.status !== "quit" && t.status !== "terminated").map(t => {
    const cf = computeFree(t);
    const booked = cf.total - cf.free;
    return React.createElement("option", {
      key: t.id,
      value: t.name
    }, t.name + " \u2014 " + booked + " booked" + (t.location ? " (" + t.location + ")" : ""));
  }))), React.createElement(Inp, {
    label: "Current Time",
    value: f.fromTime || "",
    onChange: v => setF({
      ...f,
      fromTime: v
    }),
    placeholder: "e.g. 0400 PM"
  }), React.createElement(Inp, {
    label: "Current Lead",
    value: f.fromLead || "",
    onChange: v => setF({
      ...f,
      fromLead: v
    }),
    options: ["ALL", ...(teamLeads || []).map(tl => tl.name)]
  })), React.createElement("div", {
    style: {
      background: c.successBg,
      borderRadius: 8,
      padding: "6px 10px",
      marginBottom: 8,
      color: c.success,
      fontSize: 10,
      fontWeight: 600
    }
  }, "TO (New Teacher)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement("div", {
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
  }, "New Teacher *"), React.createElement("select", {
    value: f.toT || "",
    onChange: e => {
      const v = e.target.value;
      const tt = (teachers || []).find(t => t.name === v);
      setF({
        ...f,
        toT: v,
        toLead: tt ? tt.teamLead || f.toLead || "" : f.toLead || ""
      });
    },
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  }, React.createElement("option", {
    value: ""
  }, "-- Select New Teacher --"), (teachers || []).filter(t => t.status !== "resigned" && t.status !== "quit" && t.status !== "terminated").slice().sort((a, b) => computeFree(b).free - computeFree(a).free).map(t => {
    const cf = computeFree(t);
    return React.createElement("option", {
      key: t.id,
      value: t.name
    }, t.name + " \u2014 " + cf.free + " free slots" + (t.location ? " (" + t.location + ")" : ""));
  }))), (() => {
    if (!f.toT) return React.createElement(Inp, {
      label: "New Time",
      value: f.toTime || "",
      onChange: v => setF({
        ...f,
        toTime: v
      }),
      placeholder: "Pick New Teacher first"
    });
    const toTeacher = (teachers || []).find(t => t.name === f.toT);
    if (!toTeacher) return React.createElement(Inp, {
      label: "New Time",
      value: f.toTime || "",
      onChange: v => setF({
        ...f,
        toTime: v
      }),
      placeholder: "e.g. 0430 PM"
    });
    let tShift = toTeacher.shift || "Night";
    let baseSched = null;
    for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
      const found = (TT_DATA[sh].teachers || []).find(x => x.name === toTeacher.name || x.code === toTeacher.code);
      if (found) {
        tShift = sh;
        baseSched = found.schedule || {};
        break;
      }
    }
    const shiftSlots = (TT_DATA[tShift] || {}).slots || [];
    const daysForShift = tShift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const overlay = toTeacher._ttSchedule || null;
    const allFreeOpts = [];
    daysForShift.forEach(day => {
      shiftSlots.forEach(pktSlot => {
        const baseVal = baseSched ? (baseSched[day] || {})[pktSlot] : undefined;
        const ovrVal = overlay ? (overlay[day] || {})[pktSlot] : undefined;
        const effective = ovrVal !== undefined ? ovrVal : baseVal;
        if (!effective || effective === "F") {
          allFreeOpts.push({
            value: day + "|" + pktSlot,
            label: day + " \u00B7 " + to12h(pktSlot) + " PKT"
          });
        }
      });
    });
    if (allFreeOpts.length === 0) {
      return React.createElement("div", {
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
      }, "New Time"), React.createElement("div", {
        style: {
          padding: "10px 12px",
          background: c.warnBg,
          border: "1px solid " + c.warn + "55",
          borderRadius: 6,
          color: c.warn,
          fontSize: 11
        }
      }, "\u26A0 " + f.toT + " has no free slots. Pick a different New Teacher."));
    }
    return React.createElement("div", {
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
    }, "New Time \u2014 " + allFreeOpts.length + " free slot" + (allFreeOpts.length === 1 ? "" : "s")), React.createElement("select", {
      value: f.toTime || "",
      onChange: e => setF({
        ...f,
        toTime: e.target.value
      }),
      style: {
        width: "100%",
        padding: "8px 10px",
        background: c.bgInput,
        border: "1px solid " + c.border,
        borderRadius: 6,
        color: c.text,
        fontSize: 12,
        outline: "none",
        boxSizing: "border-box"
      }
    }, React.createElement("option", {
      value: ""
    }, "-- Select Free Slot --"), allFreeOpts.map(o => React.createElement("option", {
      key: o.value,
      value: o.value
    }, o.label))));
  })(), React.createElement(Inp, {
    label: "New Lead",
    value: f.toLead || "",
    onChange: v => setF({
      ...f,
      toLead: v
    }),
    options: ["ALL", ...(teamLeads || []).map(tl => tl.name)]
  })), React.createElement(Inp, {
    label: "Reason *",
    value: f.reason || "",
    onChange: v => setF({
      ...f,
      reason: v
    }),
    options: SHIFT_REASONS
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "SPS Status",
    value: f.sps === "yes" ? "Conveyed" : f.sps || "",
    onChange: v => setF({
      ...f,
      sps: v
    }),
    options: SPS_OPTS
  }), React.createElement(Inp, {
    label: "Feedback",
    value: f.feedback || "",
    onChange: v => setF({
      ...f,
      feedback: v
    }),
    options: FEEDBACK_OPTS
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
    onClick: save,
    icon: Check
  }, modal.type === "new" ? "Create Shift" : "Save Changes")))), modal && modal.type === "view" && React.createElement("div", {
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
      width: 540
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
  }, "Shift Details"), React.createElement("button", {
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
      padding: 14,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase"
    }
  }, "Student"), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 600
    }
  }, modal.data.student)), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase"
    }
  }, "Parent / Lead"), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12
    }
  }, modal.data.lead)), React.createElement("div", {
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
  }, "Date"), React.createElement("span", {
    style: {
      color: c.accent,
      fontSize: 12,
      fontWeight: 600
    }
  }, modal.data.date))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      gap: 10,
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 8,
      padding: "10px 12px",
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "From"), React.createElement("div", {
    style: {
      color: c.danger,
      fontSize: 14,
      fontWeight: 700
    }
  }, modal.data.fromT), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, modal.data.fromTime), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2
    }
  }, "Lead: ", modal.data.fromLead)), React.createElement(ArrowRightLeft, {
    size: 24,
    color: c.accent
  }), React.createElement("div", {
    style: {
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 8,
      padding: "10px 12px",
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "To"), React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 14,
      fontWeight: 700
    }
  }, modal.data.toT), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, modal.data.toTime), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2
    }
  }, "Lead: ", modal.data.toLead))), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 12px",
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Reason"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12
    }
  }, modal.data.reason || "Not specified")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 12
    }
  }, React.createElement("div", {
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
  }, "SPS"), React.createElement(Badge, {
    text: modal.data.sps === "yes" ? "Conveyed" : "Pending",
    color: modal.data.sps === "yes" ? "success" : "warn"
  })), React.createElement("div", {
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
  }, "Feedback"), modal.data.feedback ? React.createElement(Badge, {
    text: modal.data.feedback,
    color: modal.data.feedback.includes("Satisfied") && !modal.data.feedback.includes("Not") ? "success" : modal.data.feedback.includes("Not") ? "danger" : "warn"
  }) : React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 10
    }
  }, "None"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Close"), React.createElement(Btn, {
    onClick: () => {
      const d = modal.data;
      setModal(null);
      oEdit(d);
    },
    icon: Edit2
  }, "Edit")))), modal && modal.type === "delete" && React.createElement("div", {
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
  }, "Delete Shift Record?"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 16px"
    }
  }, "Remove shift record for ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.data.student), "? This is a historical record and cannot be recovered."), React.createElement("div", {
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
    onClick: del
  }, "Delete")))), modal && modal.type === "bulk" && (() => {
    const fromBookings = (() => {
      if (!f.bulkFromT) return [];
      const t = (teachers || []).find(x => x.name === f.bulkFromT);
      if (!t) return [];
      let tShift = t.shift || "Night";
      let baseSched = null;
      for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
        const found = (TT_DATA[sh].teachers || []).find(x => x.name === t.name || x.code === t.code);
        if (found) {
          tShift = sh;
          baseSched = found.schedule || {};
          break;
        }
      }
      const slots = (TT_DATA[tShift] || {}).slots || [];
      const days = tShift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
      const overlay = t._ttSchedule || null;
      const out = [];
      days.forEach(day => {
        slots.forEach(slot => {
          const baseVal = baseSched ? (baseSched[day] || {})[slot] : undefined;
          const ovrVal = overlay ? (overlay[day] || {})[slot] : undefined;
          const effective = ovrVal !== undefined ? ovrVal : baseVal;
          if (effective && typeof effective === "object" && effective.s) {
            out.push({
              day: day,
              slot: slot,
              cell: effective
            });
          }
        });
      });
      return out;
    })();
    const checkConflict = (toTeacher, day, slot) => {
      if (!toTeacher) return false;
      let tShift = toTeacher.shift || "Night";
      let baseSched = null;
      for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
        const found = (TT_DATA[sh].teachers || []).find(x => x.name === toTeacher.name || x.code === toTeacher.code);
        if (found) {
          tShift = sh;
          baseSched = found.schedule || {};
          break;
        }
      }
      const overlay = toTeacher._ttSchedule || null;
      const baseVal = baseSched ? (baseSched[day] || {})[slot] : undefined;
      const ovrVal = overlay ? (overlay[day] || {})[slot] : undefined;
      const effective = ovrVal !== undefined ? ovrVal : baseVal;
      return effective && typeof effective === "object" && effective.s;
    };
    const doBulkShift = () => {
      if (!f.bulkFromT || !f.bulkToT || !f.reason) {
        alert("Please fill From Teacher, To Teacher, and Reason.");
        return;
      }
      if (f.bulkFromT === f.bulkToT) {
        alert("From Teacher and To Teacher must be different.");
        return;
      }
      const fromT = (teachers || []).find(t => t.name === f.bulkFromT);
      const toT = (teachers || []).find(t => t.name === f.bulkToT);
      if (!fromT || !toT) return;
      if (fromBookings.length === 0) {
        alert(f.bulkFromT + " has no bookings to transfer.");
        return;
      }
      const transfers = [];
      const conflicts = [];
      fromBookings.forEach(b => {
        if (checkConflict(toT, b.day, b.slot)) {
          conflicts.push(b);
        } else {
          transfers.push(b);
        }
      });
      if (transfers.length === 0) {
        alert("\u2716 Cannot transfer any classes.\n\nAll " + fromBookings.length + " slots conflict with " + f.bulkToT + "\u0027s existing schedule.\n\nPick a different To Teacher.");
        return;
      }
      const confirmMsg = "Transfer " + transfers.length + " class" + (transfers.length === 1 ? "" : "es") + " from " + f.bulkFromT + " to " + f.bulkToT + "?" + (conflicts.length > 0 ? "\n\n\u26A0 " + conflicts.length + " will be SKIPPED due to slot conflicts." : "") + "\n\nThis will:\n\u2022 Free " + transfers.length + " slot" + (transfers.length === 1 ? "" : "s") + " on " + f.bulkFromT + "\n\u2022 Book " + transfers.length + " slot" + (transfers.length === 1 ? "" : "s") + " on " + f.bulkToT + "\n\u2022 Update " + transfers.length + " student record" + (transfers.length === 1 ? "" : "s") + "\n\u2022 Add " + transfers.length + " registry entr" + (transfers.length === 1 ? "y" : "ies");
      if (!confirm(confirmMsg)) return;
      const bulkId = "bulk-" + Date.now();
      const newRegistryEntries = transfers.map((b, i) => ({
        id: Date.now() + i,
        bulkId: bulkId,
        sno: shifts.length + i + 1,
        date: f.date || todayPK(),
        student: b.cell.s,
        lead: b.cell.l || "",
        fromT: f.bulkFromT,
        fromTime: b.day + "|" + b.slot,
        fromLead: fromT.teamLead || "",
        toT: f.bulkToT,
        toTime: b.day + "|" + b.slot,
        toLead: toT.teamLead || "",
        reason: f.reason,
        sps: f.sps === "Conveyed" ? "yes" : "no",
        feedback: f.feedback || "Pending"
      }));
      setShifts([...newRegistryEntries, ...shifts]);
      setTeachers(teachers.map(t => {
        if (t.id === fromT.id) {
          const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
          transfers.forEach(b => {
            if (!sch[b.day]) sch[b.day] = {};
            sch[b.day][b.slot] = "F";
          });
          return {
            ...t,
            _ttSchedule: sch
          };
        }
        if (t.id === toT.id) {
          const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
          transfers.forEach(b => {
            if (!sch[b.day]) sch[b.day] = {};
            sch[b.day][b.slot] = {
              ...b.cell
            };
          });
          return {
            ...t,
            _ttSchedule: sch
          };
        }
        return t;
      }));
      if (setStudents) {
        const transferredNames = new Set(transfers.map(b => (b.cell.s || "").trim().toLowerCase()));
        setStudents(students.map(s => {
          const sLower = (s.name || "").trim().toLowerCase();
          return transferredNames.has(sLower) ? {
            ...s,
            teacher: f.bulkToT
          } : s;
        }));
      }
      setModal(null);
      setTimeout(() => {
        let msg = "\u2705 Bulk shift completed.\n\n" + transfers.length + " class" + (transfers.length === 1 ? "" : "es") + " transferred from " + f.bulkFromT + " to " + f.bulkToT + ".";
        if (conflicts.length > 0) {
          msg += "\n\n\u26A0 " + conflicts.length + " SKIPPED due to conflicts:\n";
          conflicts.forEach(b => {
            msg += "\n\u2022 " + b.day + " " + b.slot + " \u2014 " + b.cell.s;
          });
          msg += "\n\nThese students remain with " + f.bulkFromT + ". Use New Shift to move them individually.";
        }
        alert(msg);
      }, 100);
    };
    return React.createElement("div", {
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
        width: 640,
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
    }, "Bulk Shift \u2014 Transfer Entire Class Load"), React.createElement("button", {
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
        background: c.warnBg,
        borderRadius: 8,
        padding: "8px 12px",
        marginBottom: 12,
        color: c.warn,
        fontSize: 11,
        lineHeight: 1.5
      }
    }, "Use when a teacher resigns or leaves. ALL their booked classes will transfer to the new teacher in one operation. Slot conflicts will be skipped and reported."), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0 14px",
        marginBottom: 12
      }
    }, React.createElement("div", null, React.createElement("label", {
      style: {
        display: "block",
        color: c.textSec,
        fontSize: 10,
        marginBottom: 4,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5
      }
    }, "From Teacher (being replaced) *"), React.createElement("select", {
      value: f.bulkFromT || "",
      onChange: e => setF({
        ...f,
        bulkFromT: e.target.value
      }),
      style: {
        width: "100%",
        padding: "8px 10px",
        background: c.bgInput,
        border: "1px solid " + c.border,
        borderRadius: 6,
        color: c.text,
        fontSize: 12,
        outline: "none",
        boxSizing: "border-box"
      }
    }, React.createElement("option", {
      value: ""
    }, "-- Select From Teacher --"), (teachers || []).filter(t => t.status !== "resigned" && t.status !== "quit" && t.status !== "terminated").map(t => {
      const cf = computeFree(t);
      const booked = cf.total - cf.free;
      if (booked === 0) return null;
      return React.createElement("option", {
        key: t.id,
        value: t.name
      }, t.name + " \u2014 " + booked + " booked" + (t.location ? " (" + t.location + ")" : ""));
    }).filter(Boolean))), React.createElement("div", null, React.createElement("label", {
      style: {
        display: "block",
        color: c.textSec,
        fontSize: 10,
        marginBottom: 4,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5
      }
    }, "To Teacher (replacement) *"), React.createElement("select", {
      value: f.bulkToT || "",
      onChange: e => setF({
        ...f,
        bulkToT: e.target.value
      }),
      style: {
        width: "100%",
        padding: "8px 10px",
        background: c.bgInput,
        border: "1px solid " + c.border,
        borderRadius: 6,
        color: c.text,
        fontSize: 12,
        outline: "none",
        boxSizing: "border-box"
      }
    }, React.createElement("option", {
      value: ""
    }, "-- Select To Teacher --"), (teachers || []).filter(t => t.status !== "resigned" && t.status !== "quit" && t.status !== "terminated" && t.name !== f.bulkFromT).slice().sort((a, b) => computeFree(b).free - computeFree(a).free).map(t => {
      const cf = computeFree(t);
      return React.createElement("option", {
        key: t.id,
        value: t.name
      }, t.name + " \u2014 " + cf.free + " free slots" + (t.location ? " (" + t.location + ")" : ""));
    })))), f.bulkFromT && React.createElement("div", {
      style: {
        background: c.bgDeep,
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        maxHeight: 200,
        overflowY: "auto"
      }
    }, React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 11,
        fontWeight: 700,
        marginBottom: 6
      }
    }, "Classes to transfer (" + fromBookings.length + ")", fromBookings.length === 0 ? React.createElement("span", {
      style: {
        color: c.textSec,
        fontWeight: 400,
        marginLeft: 6
      }
    }, "\u2014 no booked classes") : null), fromBookings.length > 0 && React.createElement("table", {
      style: {
        width: "100%",
        fontSize: 10,
        borderCollapse: "collapse"
      }
    }, React.createElement("thead", null, React.createElement("tr", {
      style: {
        color: c.textSec,
        borderBottom: "1px solid " + c.border
      }
    }, ["DAY", "PKT SLOT", "STUDENT", "COURSE", "STATUS"].map(h => React.createElement("th", {
      key: h,
      style: {
        padding: "4px 6px",
        textAlign: "left",
        fontWeight: 600
      }
    }, h)))), React.createElement("tbody", null, fromBookings.map((b, i) => {
      const toTe = (teachers || []).find(x => x.name === f.bulkToT);
      const conflict = toTe ? checkConflict(toTe, b.day, b.slot) : false;
      return React.createElement("tr", {
        key: i,
        style: {
          color: c.text,
          borderBottom: "1px solid " + c.border + "55"
        }
      }, React.createElement("td", {
        style: {
          padding: "4px 6px"
        }
      }, b.day), React.createElement("td", {
        style: {
          padding: "4px 6px"
        }
      }, to12h(b.slot)), React.createElement("td", {
        style: {
          padding: "4px 6px",
          fontWeight: 600
        }
      }, b.cell.s, b.cell.a ? " (" + b.cell.a + ")" : ""), React.createElement("td", {
        style: {
          padding: "4px 6px",
          color: c.textSec
        }
      }, b.cell.c || "\u2014"), React.createElement("td", {
        style: {
          padding: "4px 6px"
        }
      }, conflict ? React.createElement("span", {
        style: {
          color: c.danger,
          fontWeight: 700
        }
      }, "\u26A0 SKIP") : React.createElement("span", {
        style: {
          color: c.success,
          fontWeight: 600
        }
      }, "\u2713 OK")));
    })))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr",
        gap: "0 14px"
      }
    }, React.createElement(Inp, {
      label: "Reason *",
      value: f.reason || "",
      onChange: v => setF({
        ...f,
        reason: v
      }),
      options: ["Teacher Resigned", "Teacher Terminated", "Teacher on Leave", "Teacher Sick Leave", "Other"]
    }), React.createElement(Inp, {
      label: "SPS Status",
      value: f.sps || "Pending",
      onChange: v => setF({
        ...f,
        sps: v
      }),
      options: ["Pending", "Conveyed"]
    }), React.createElement(Inp, {
      label: "Feedback",
      value: f.feedback || "Pending",
      onChange: v => setF({
        ...f,
        feedback: v
      }),
      options: ["Pending", "Positive", "Negative", "Neutral"]
    })), React.createElement(Inp, {
      label: "Effective Date",
      value: f.date || "",
      onChange: v => setF({
        ...f,
        date: v
      }),
      type: "date"
    }), React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 12
      }
    }, React.createElement(Btn, {
      variant: "outline",
      onClick: () => setModal(null)
    }, "Cancel"), React.createElement(Btn, {
      onClick: doBulkShift,
      icon: ArrowRightLeft,
      disabled: !f.bulkFromT || !f.bulkToT || fromBookings.length === 0
    }, "Transfer " + (fromBookings.length || "0") + " Class" + (fromBookings.length === 1 ? "" : "es")))));
  })());
};

