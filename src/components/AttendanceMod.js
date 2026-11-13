const AttendanceMod = ({
  appSettings, // v72: office times and fines
  setAppSettings,
  setTeachers,
  user,
  autoAttendance,
  setAutoAttendance,
  teachers = [],
  history = {},
  setHistory,
}) => {
  const [, setTick] = useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const [tab, setTab] = useState(() => llqaTakeTab("attendance", "live")); // v76: a notice opens the fines
  const [search, setSearch] = useState("");
  const [fShift, setFShift] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayPK());
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );
  const [modal, setModal] = useState(null);
  const [regForm, setRegForm] = useState({});
  const today = todayPK();
  // v72: the settings the fines use, who is acting, each teacher's office day (a night shift's starts before midnight)
  const fineSet = () => (LLQAApp.ctx && LLQAApp.ctx.appSettings) || appSettings;
  const who = (user && (user.name || (user.role === "superadmin" ? "Super Admin" : user.role))) || "Admin";
  const dayOf = (t) => {
    const od = t ? llqaOfficeDay(llqaOffice(t, fineSet()), llqaNowMs()) : null;
    return od ? od.date : today;
  };
  // older months come from the cloud when they are looked at; whether each teacher's CRM is open now is followed
  // while this screen is open
  React.useEffect(() => {
    const need = LLQAApp.ctx && LLQAApp.ctx.attNeed;
    if (typeof need === "function") {
      need(String(selectedMonth || "").slice(0, 7));
      need(String(selectedDate || "").slice(0, 7));
    }
  }, [selectedMonth, selectedDate]);
  React.useEffect(() => {
    const days = () => {
      const ms = llqaNowMs();
      return [llqaPkDate(ms - 864e5), llqaPkDate(ms), llqaPkDate(ms + 864e5)];
    };
    LLQAPresence.watch(days());
    const id = setInterval(() => LLQAPresence.watch(days()), 600000);
    return () => {
      clearInterval(id);
      LLQAPresence.watch([]);
    };
  }, []);
  const todayRecords = useMemo(() => {
    const r = {};
    teachers.forEach((t) => {
      const rec = history[t.id]?.find((h) => h.date === dayOf(t)); // v72: the teacher's office day
      r[t.id] = rec || {
        status: "Not Marked",
        checkIn: "—",
        checkOut: "—",
        lateMin: 0,
        fine: 0,
      };
    });
    return r;
  }, [teachers, history, Math.floor(Date.now() / 600000)]); // v72: office days move on with the clock
  const liveStats = useMemo(() => {
    const stats = {
      total: teachers.length,
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      halfDay: 0,
      notMarked: 0,
      totalFine: 0,
    };
    teachers.forEach((t) => {
      const rec = todayRecords[t.id];
      if (rec.status === "Present") stats.present++;
      else if (rec.status === "Late") stats.late++;
      else if (rec.status === "Absent") stats.absent++;
      else if (rec.status === "On Leave") stats.leave++;
      else if (rec.status === "Half Day") stats.halfDay++;
      else stats.notMarked++;
      stats.totalFine += rec.fine || 0;
    });
    return stats;
  }, [teachers, todayRecords]);
  const monthlySummary = useMemo(() => {
    const sum = {};
    const pms = llqaHrPayMap(selectedMonth); // v78: Payroll's net pay
    teachers.forEach((t) => {
      const recs = (history[t.id] || []).filter((h) =>
        h.date.startsWith(selectedMonth),
      );
      const present = recs.filter((r) => r.status === "Present").length;
      const late = recs.filter((r) => r.status === "Late").length;
      const absent = recs.filter((r) => r.status === "Absent").length;
      const leave = recs.filter((r) => r.status === "On Leave").length;
      const halfDay = recs.filter((r) => r.status === "Half Day").length;
      const totalFine = recs.reduce((s, r) => s + (r.fine || 0), 0);
      const totalLateMin = recs.reduce((s, r) => s + (r.lateMin || 0), 0);
      const totalDays = recs.length;
      const workedDays = present + late;
      const attPct =
        totalDays > 0 ? Math.round((workedDays / totalDays) * 100) : 0;
      sum[t.id] = {
        present,
        late,
        absent,
        leave,
        halfDay,
        totalFine,
        totalLateMin,
        totalDays,
        workedDays,
        attPct,
        netPay: pms.has(String(t.id)) ? pms.get(String(t.id)) : (Number(t.salary) || 0) - totalFine, // v78: as Payroll works it out
      };
    });
    return sum;
  }, [teachers, history, selectedMonth]);
  const filteredTeachers = useMemo(() => {
    let d = teachers;
    if (fShift !== "all") d = d.filter((t) => (t.shift || "").includes(fShift));
    if (search)
      d = d.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.includes(search),
      );
    return d;
  }, [teachers, search, fShift]);
  const chronicLate = useMemo(() => {
    return teachers
      .map((t) => {
        const recs = (history[t.id] || []).slice(-14);
        const lateCount = recs.filter((r) => r.status === "Late").length;
        const avgLateMin =
          recs.filter((r) => r.lateMin > 0).reduce((s, r) => s + r.lateMin, 0) /
          (lateCount || 1);
        return {
          ...t,
          lateCount,
          avgLateMin: Math.round(avgLateMin),
        };
      })
      .filter((t) => t.lateCount >= 3)
      .sort((a, b) => b.lateCount - a.lateCount);
  }, [teachers, history]);
  // v72: marking by hand — Pakistan time (it used this computer's own clock), the teacher's office day, the time
  // they signed in (asked for Late; a portal sign-in time is kept), every late minute at the academy's rate, and the
  // fine kept with its times, rule and who marked it. A day the teacher is signed in on stays followed by the CRM.
  const markAttendance = (teacherId, status, hm) => {
    const t = teachers.find((x) => x.id === teacherId);
    if (!t) return;
    const set = fineSet();
    const off = llqaOffice(t, set);
    const day = dayOf(t);
    if (!llqaCanMarkDay(user, t, (history[teacherId] || []).find((x) => x.date === day))) {
      llqaToast({ text: "Only an admin can change a day that is already marked or signed in." });
      return;
    }
    setHistory((prev) => {
      const list = (prev || {})[teacherId] || [];
      const h = list.find((x) => x.date === day);
      const o = { start: (h && h.officeStart) || off.start, end: (h && h.officeEnd) || off.end };
      const gone = status === "Absent" || status === "On Leave";
      const keepIn = h && llqaHm2m(h.checkIn) != null ? h.checkIn : "";
      const inHm = gone ? "—" : hm || keepIn || "—";
      const lateMin = status === "Late" ? llqaLateMin(o, inHm) : 0;
      const working = status === "Present" || status === "Late";
      const wd = llqaWorkDay(t, day, set);
      const rec = llqaWithFine(
        {
          ...(h || {}),
          date: day,
          status,
          checkIn: inHm,
          checkOut: h && !gone && (llqaIsOpen(h) || llqaHm2m(h.checkOut) != null) ? h.checkOut : "—",
          lateMin,
          earlyMin: working && h ? Number(h.earlyMin) || 0 : 0,
          awayMin: working && h ? Number(h.awayMin) || 0 : 0,
          officeStart: o.start,
          officeEnd: o.end,
          offDay: wd.ok ? "" : wd.why,
          ...(status === "Absent" || status === "On Leave" ? { paid: status === "On Leave", dayPay: llqaDayPay(t, day) } : {}), // v76
          auto: false,
          pending: false,
          fineOverride: null,
          device: (h && h.device) || "Admin Panel",
          markedBy: who,
          approved: true,
        },
        set,
        who,
        "marked " + status + " by " + who + (lateMin ? " (signed in " + llqaHm12(inHm) + ", " + lateMin + " min after " + llqaHm12(o.start) + ")" : ""),
      );
      return { ...(prev || {}), [teacherId]: list.filter((x) => x.date !== day).concat([rec]) };
    });
  };
  // checked out by an admin now: leaving before the exit is fined by the minute
  const checkOut = (teacherId) => {
    const t = teachers.find((x) => x.id === teacherId);
    if (!t || !llqaCanMarkAll(user)) return;
    const set = fineSet();
    const day = dayOf(t);
    const nowMs = llqaNowMs();
    setHistory((prev) => {
      const list = (prev || {})[teacherId] || [];
      return {
        ...(prev || {}),
        [teacherId]: list.map((h) => {
          if (h.date !== day) return h;
          const closed = llqaCloseDay(h, t, set, LLQAPresence.spans(day, teacherId, llqaFineRules(set).silenceMin), nowMs, "admin");
          return llqaWithFine(closed, set, who, "checked out by " + who + (closed.earlyMin ? " — " + closed.earlyMin + " min before " + llqaHm12(closed.officeEnd) : ""));
        }),
      };
    });
  };
  const openCalendar = (teacherId) => {
    setSelectedTeacher(teacherId);
    setTab("calendar");
  };
  const openRegularize = (teacherId, date) => {
    // v72: correcting a day is for an admin (or a role given "Mark Attendance")
    if (!llqaCanMarkAll(user)) {
      llqaToast({ text: "Only an admin can correct a day." });
      return;
    }
    setRegForm({
      teacherId,
      date,
      reason: "",
      newStatus: "",
      inTime: (() => {
        // v72: a correction to Late asks when they signed in (starts from the time on the day)
        const h = (history[teacherId] || []).find((x) => x.date === date);
        return h && llqaHm2m(h.checkIn) != null ? h.checkIn : "";
      })(),
    });
    setModal({
      type: "regularize",
    });
  };
  const statusColor = (s) =>
    s === "Present"
      ? c.success
      : s === "Late"
        ? c.warn
        : s === "Absent"
          ? c.danger
          : s === "On Leave"
            ? c.accent
            : s === "Half Day"
              ? c.purple
              : c.textMuted;
  const statusBg = (s) =>
    s === "Present"
      ? c.successBg
      : s === "Late"
        ? c.warnBg
        : s === "Absent"
          ? c.dangerBg
          : s === "On Leave"
            ? c.accentBg
            : s === "Half Day"
              ? c.purpleBg
              : c.bgDeep;
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        },
      },
      React.createElement(
        "div",
        null,
        React.createElement(
          "p",
          {
            style: {
              margin: 0,
              color: c.text,
              fontSize: 14,
              fontWeight: 600,
            },
          },
          new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        ),
        React.createElement(
          "p",
          {
            style: {
              margin: "2px 0 0",
              color: c.textSec,
              fontSize: 11,
            },
          },
          "Live attendance tracking \xB7 ",
          liveStats.notMarked,
          " not marked yet \xB7 Total fines today: Rs ",
          liveStats.totalFine.toLocaleString(),
        ),
      ),
      React.createElement(
        Btn,
        {
          icon: Download,
          variant: "outline",
          onClick: () => {
            // v70: the page's own records (the old code read "attendanceData", which never existed, so the button crashed)
            const headers = ["Date", "Teacher", "Code", "Shift", "Location", "Status", "Time In", "Time Out", "Late (min)", "Fine (Rs)", "Note"];
            const clean = (v) => (v == null || v === "\u2014" || v === "?" || v === "-" ? "" : v);
            const rows = teachers
              .flatMap((t) => (history[t.id] || []).map((h) => ({ t, h })))
              .sort((x, y) => String(x.h.date || "").localeCompare(String(y.h.date || "")) || String(x.t.name || "").localeCompare(String(y.t.name || "")))
              .map(({ t, h }) => [
                h.date || "",
                t.name || "",
                t.code || "",
                t.shift || "",
                clean(t.location),
                h.status || "",
                clean(h.checkIn),
                clean(h.checkOut),
                h.lateMin || 0,
                h.fine || 0,
                h.regularized ? "Corrected: " + (h.regReason || "") : "",
              ]);
            if (rows.length === 0) {
              llqaToast({ kind: "info", ttl: 5000, text: "No attendance to export for this month." }); // v78
              return;
            }
            const csv = [headers, ...rows]
              .map((r) =>
                r
                  .map((v) => {
                    const s = String(v ?? "");
                    return s.includes(",") ||
                      s.includes('"') ||
                      s.includes("\n")
                      ? '"' + s.replace(/"/g, '""') + '"'
                      : s;
                  })
                  .join(","),
              )
              .join("\n");
            const blob = new Blob(["\uFEFF" + csv], {
              type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "LLQA-Attendance-" + todayPK() + ".csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          },
        },
        "Export Report",
      ),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        },
      },
      React.createElement(SC, {
        icon: UserCheck,
        label: "Present Today",
        value: liveStats.present,
        sub: "of " + liveStats.total,
        color: c.success,
      }),
      React.createElement(SC, {
        icon: Clock,
        label: "Late",
        value: liveStats.late,
        color: c.warn,
      }),
      React.createElement(SC, {
        icon: UserX,
        label: "Absent",
        value: liveStats.absent,
        color: c.danger,
      }),
      React.createElement(SC, {
        icon: Coffee,
        label: "On Leave",
        value: liveStats.leave,
        color: c.accent,
      }),
      React.createElement(SC, {
        icon: AlertTriangle,
        label: "Not Marked",
        value: liveStats.notMarked,
        color: c.purple,
      }),
      React.createElement(SC, {
        icon: CreditCard,
        label: "Fines Today",
        value: "Rs " + liveStats.totalFine.toLocaleString(),
        color: c.danger,
      }),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 2,
          background: c.bgDeep,
          borderRadius: 8,
          padding: 3,
          marginBottom: 14,
          flexWrap: "wrap",
        },
      },
      [
        ["live", "Live Marking"],
        ["calendar", "Calendar View"],
        ["hr", "HR Records"],
        ["fines", "Fines & Deductions"],
        ["patterns", "Patterns & Alerts"],
        ["reports", "Reports"],
        ["audit", "Audit Log"],
      ].map(([k, l]) =>
        React.createElement(
          "button",
          {
            key: k,
            onClick: () => setTab(k),
            style: {
              padding: "7px 14px",
              borderRadius: 6,
              border:
                tab === k ? "1px solid transparent" : "1px solid " + c.border,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              background: tab === k ? c.accentFill : "transparent",
              color: tab === k ? c.accentText : c.textSec,
            },
          },
          l,
        ),
      ),
    ),
    tab === "live" &&
      React.createElement(
        React.Fragment,
        null,
        (() => {
          const today = todayPK();
          const todays = (autoAttendance || []).filter((a) => a.date === today);
          if (todays.length === 0) return null;
          return React.createElement(
            "div",
            {
              style: {
                background: c.successBg,
                border: "1px solid " + llqaAlpha(c.success, "44"),
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                },
              },
              React.createElement(Check, {
                size: 18,
                color: c.success,
              }),
              React.createElement(
                "div",
                {
                  style: {
                    fontWeight: 700,
                    fontSize: 13,
                    color: c.success,
                  },
                },
                "Auto-Attendance Today (",
                todays.length,
                " logged in)",
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 11,
                    color: c.textSec,
                    marginLeft: "auto",
                  },
                },
                todays.filter((a) => a.status === "Late").length +
                  " late \xB7 " +
                  todays.filter((a) => a.status === "Present").length +
                  " on time",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 200,
                  overflowY: "auto",
                },
              },
              todays.map((a) =>
                React.createElement(
                  "div",
                  {
                    key: a.id,
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      background: c.bgCard,
                      borderRadius: 6,
                      fontSize: 11,
                      flexWrap: "wrap",
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        flex: 1,
                        minWidth: 140,
                        fontWeight: 600,
                        color: c.text,
                      },
                    },
                    a.userName,
                    a.role === "teamlead"
                      ? React.createElement(
                          "span",
                          {
                            style: {
                              marginLeft: 6,
                              fontSize: 9,
                              padding: "1px 5px",
                              background: c.purpleBg || c.accentBg,
                              color: c.purple || c.accent,
                              borderRadius: 3,
                              fontWeight: 600,
                            },
                          },
                          "TL",
                        )
                      : null,
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.textSec,
                        minWidth: 70,
                        fontFamily: "monospace",
                      },
                    },
                    "In: " + a.timeIn,
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.textSec,
                        minWidth: 80,
                        fontFamily: "monospace",
                      },
                    },
                    "Start: " + a.shiftStart,
                  ),
                  a.shiftName
                    ? React.createElement(
                        "div",
                        {
                          style: {
                            color: c.accent,
                            fontSize: 10,
                            minWidth: 60,
                            fontWeight: 600,
                          },
                        },
                        a.shiftName,
                      )
                    : null,
                  a.status === "Late"
                    ? React.createElement(
                        "div",
                        {
                          style: {
                            color: c.warn,
                            fontWeight: 700,
                            minWidth: 100,
                            textAlign: "right",
                            background: c.warnBg,
                            padding: "3px 8px",
                            borderRadius: 4,
                          },
                        },
                        llqaLabel("\u26A0 Late " + a.lateMin + " min"),
                      )
                    : React.createElement(
                        "div",
                        {
                          style: {
                            color: c.success,
                            fontWeight: 700,
                            minWidth: 90,
                            textAlign: "right",
                          },
                        },
                        "\u2713 On Time",
                      ),
                ),
              ),
            ),
          );
        })(),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                position: "relative",
                flex: 1,
                minWidth: 200,
              },
            },
            React.createElement(Search, {
              size: 14,
              style: {
                position: "absolute",
                left: 10,
                top: 9,
                color: c.textMuted,
              },
            }),
            React.createElement("input", {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search teacher...",
              style: {
                width: "100%",
                padding: "8px 12px 8px 30px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
              },
            }),
          ),
          React.createElement(
            LLQASelect, // v70: the CRM's own list
            {
              value: fShift,
              onChange: (e) => setFShift(e.target.value),
              style: {
                padding: "8px 10px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 11,
              },
            },
            React.createElement(
              "option",
              {
                value: "all",
              },
              "All Shifts",
            ),
            SHIFTS_ATT.map((s) =>
              React.createElement(
                "option",
                {
                  key: s,
                  value: s,
                },
                s,
              ),
            ),
          ),
          llqaCanMarkAll(user) && // v72: marking by hand is for an admin (or a role given "Mark Attendance")
          React.createElement(
            "button",
            {
              onClick: () => {
                // v72: only teachers with nothing marked yet today; nobody's day is overwritten
                const set = fineSet();
                const todo = teachers.filter((t) => !(history[t.id] || []).some((h) => h.date === dayOf(t)));
                if (!todo.length) {
                  llqaToast({ text: "Every teacher already has attendance for today — nothing changed." });
                  return;
                }
                llqaConfirm("Mark " + todo.length + " teacher" + (todo.length === 1 ? "" : "s") + " with nothing marked yet today as Present (on time)? Teachers already marked or signed in keep what they have.", () => { // v78: the CRM's own window
                setHistory((prev) => {
                  const next = { ...(prev || {}) };
                  todo.forEach((t) => {
                    const day = dayOf(t);
                    if ((next[t.id] || []).some((h) => h.date === day)) return;
                    const off = llqaOffice(t, set);
                    const wd = llqaWorkDay(t, day, set);
                    next[t.id] = (next[t.id] || []).concat([
                      llqaWithFine({ date: day, status: "Present", checkIn: "—", checkOut: "—", lateMin: 0, earlyMin: 0, officeStart: off.start, officeEnd: off.end, offDay: wd.ok ? "" : wd.why, device: "Admin Panel", markedBy: who, approved: true }, set, who, "marked Present by " + who),
                    ]);
                  });
                  return next;
                });
                llqaToast({ text: todo.length + " teacher" + (todo.length === 1 ? "" : "s") + " marked Present." });
                }, { yes: "Mark present", title: "Mark everyone present" });
              },
              title: "Mark everyone with nothing marked yet today as Present", // v72
              style: {
                padding: "8px 12px",
                background: c.successBg,
                border: "1px solid " + llqaAlpha(c.success, "44"),
                borderRadius: 7,
                cursor: "pointer",
                color: c.success,
                fontSize: 11,
                fontWeight: 600,
              },
            },
            "Mark All Present",
          ),
          llqaCanMarkAll(user) && // v72
          React.createElement(
            "button",
            {
              onClick: () => {
                // v72: days whose exit time has passed are closed now, from when each teacher's CRM was last open
                // (the CRM also does this by itself every 5 minutes on an admin's screen)
                llqaCloseFinished(teachers, fineSet(), who, true)
                  .then((n) => llqaToast({ text: n ? n + " day" + (n === 1 ? "" : "s") + " closed from when each teacher's CRM was last open." : "No open day whose exit time has passed." }))
                  .catch(() => llqaToast({ text: "Could not close the days — try again in a minute." }));
              },
              title: "Close the days whose exit time has passed, from when each teacher's CRM was last open", // v72
              style: {
                padding: "8px 12px",
                background: c.accentBg,
                border: "1px solid " + llqaAlpha(c.accent, "44"),
                borderRadius: 7,
                cursor: "pointer",
                color: c.accent, // v68: was white on a pale tint
                fontSize: 11,
                fontWeight: 600,
                marginLeft: 10,
              },
            },
            "Close finished days", // v72: it guessed 8 hours after sign-in
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Code",
                  "Shift",
                  "Status",
                  "Check-in",
                  "Check-out",
                  "Late",
                  "Fine",
                  "Device/IP",
                  "Quick Mark",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
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
                        whiteSpace: "nowrap",
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              !filteredTeachers.length && llqaEmptyRow(teachers.length ? "No teacher matches this search or shift" : "No teachers to mark", teachers.length ? "Clear the search or pick another shift." : "Teachers added in HR \u2192 Teachers show here every day for attendance."), // v70
              filteredTeachers.map((t, i) => {
                const rec = todayRecords[t.id];
                return React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        fontWeight: 600,
                      },
                    },
                    t.name,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.text,
                        fontWeight: 600,
                        fontFamily: "monospace",
                        fontSize: 10,
                      },
                    },
                    t.code,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.shift,
                      color: (t.shift || "").includes("Morning")
                        ? "warn"
                        : (t.shift || "").includes("Evening")
                          ? "cyan"
                          : (t.shift || "").includes("Night")
                            ? "purple"
                            : "accent",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    React.createElement(Badge, {
                      text: rec.status,
                      color:
                        rec.status === "Present"
                          ? "success"
                          : rec.status === "Late"
                            ? "warn"
                            : rec.status === "Absent"
                              ? "danger"
                              : rec.status === "On Leave"
                                ? "accent"
                                : rec.status === "Half Day"
                                  ? "purple"
                                  : "warn",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.success,
                        fontFamily: "monospace",
                        fontSize: 10,
                      },
                    },
                    llqaHm2m(rec.checkIn) != null ? llqaHm12(rec.checkIn) : rec.checkIn || "—", // v72
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                        color: c.textSec,
                        fontFamily: "monospace",
                        fontSize: 10,
                      },
                    },
                    // v72: an open day shows whether the teacher's CRM is open right now, or when it was last open
                    llqaIsOpen(rec)
                      ? (() => {
                          const s = llqaSeen(t.id, rec.date, fineSet(), llqaNowMs());
                          return s ? (s.here ? "here now" : "last open " + llqaHm12(s.at)) : "signed in";
                        })()
                      : llqaHm2m(rec.checkOut) != null
                        ? llqaHm12(rec.checkOut)
                        : rec.checkOut || "—",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    rec.lateMin > 0
                      ? React.createElement(
                          "span",
                          {
                            style: {
                              color: c.warn,
                              fontWeight: 600,
                              fontSize: 10,
                            },
                          },
                          rec.lateMin,
                          "m",
                        )
                      : React.createElement(
                          "span",
                          {
                            style: {
                              color: c.textMuted,
                              fontSize: 10,
                            },
                          },
                          "\u2014",
                        ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    rec.fine > 0
                      ? React.createElement(
                          "span",
                          {
                            style: {
                              color: c.danger,
                              fontWeight: 700,
                              fontSize: 10,
                            },
                          },
                          "Rs ",
                          rec.fine,
                        )
                      : React.createElement(
                          "span",
                          {
                            style: {
                              color: c.textMuted,
                              fontSize: 10,
                            },
                          },
                          "\u2014",
                        ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 9,
                          color: c.textSec,
                        },
                      },
                      rec.device || "—",
                    ),
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 9,
                          color: c.textMuted,
                          fontFamily: "monospace",
                        },
                      },
                      rec.ip || "—",
                    ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px",
                      },
                    },
                    rec && rec.date && !llqaCanMarkDay(user, t, rec) && llqaCanMarkLeave(user, t, rec) // v76: a team lead or manager marks leave on a day without a sign-in
                      ? llqaMini("Leave / absent", () => llqaOpen("leaveday", { tid: t.id, date: rec.date }), { key: "lv", title: "Paid leave, unpaid leave or absent" })
                      : !llqaCanMarkDay(user, t, rec && rec.date ? rec : null) // v72: who may mark this day
                      ? React.createElement(
                          "span",
                          { style: { color: c.textMuted, fontSize: 10 }, title: rec && rec.date ? "A day already marked or signed in is changed by an admin" : "Marked by an admin, or this teacher's team lead" },
                          rec && rec.date ? "admin only" : "—",
                        )
                      : React.createElement(
                      "div",
                      {
                        style: {
                          display: "flex",
                          gap: 3,
                        },
                      },
                      React.createElement(
                        "button",
                        {
                          onClick: () => markAttendance(t.id, "Present"),
                          title: "Present",
                          style: {
                            background: c.successBg,
                            border: "1px solid " + llqaAlpha(c.success, "44"),
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.success,
                            fontSize: 9,
                            fontWeight: 700,
                          },
                        },
                        "P",
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => setModal({ type: "late", teacherId: t.id }), // v72: asks when they signed in
                          title: "Late",
                          style: {
                            background: c.warnBg,
                            border: "1px solid " + llqaAlpha(c.warn, "44"),
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.warn,
                            fontSize: 9,
                            fontWeight: 700,
                          },
                        },
                        "L",
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => markAttendance(t.id, "Absent"),
                          title: "Absent",
                          style: {
                            background: c.dangerBg,
                            border: "1px solid " + llqaAlpha(c.danger, "44"),
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.danger,
                            fontSize: 9,
                            fontWeight: 700,
                          },
                        },
                        "A",
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => llqaOpen("leaveday", { tid: t.id, date: dayOf(t) }), // v76: paid or unpaid leave
                          title: "Leave",
                          style: {
                            background: c.accentBg,
                            border: "1px solid " + llqaAlpha(c.accent, "44"),
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.accent,
                            fontSize: 9,
                            fontWeight: 700,
                          },
                        },
                        "Lv",
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => markAttendance(t.id, "Half Day"),
                          title: "Half Day",
                          style: {
                            background: c.purpleBg,
                            border: "1px solid " + llqaAlpha(c.purple, "44"),
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.purple,
                            fontSize: 9,
                            fontWeight: 700,
                          },
                        },
                        "H",
                      ),
                      rec.status === "Present" || rec.status === "Late"
                        ? React.createElement(
                            "button",
                            {
                              onClick: () => checkOut(t.id),
                              title: "Checkout",
                              style: {
                                background: c.bgDeep,
                                border: "1px solid " + c.border,
                                borderRadius: 4,
                                cursor: "pointer",
                                padding: "3px 6px",
                                color: c.text,
                                fontSize: 9,
                                fontWeight: 700,
                              },
                            },
                            "Out",
                          )
                        : null,
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    tab === "calendar" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              marginBottom: 12,
              alignItems: "center",
              flexWrap: "wrap",
            },
          },
          React.createElement(
            LLQASelect, // v70: the CRM's own list
            {
              value: selectedTeacher,
              onChange: (e) => setSelectedTeacher(parseInt(e.target.value)),
              style: {
                padding: "8px 12px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 12,
                minWidth: 280,
              },
            },
            React.createElement(
              "option",
              {
                value: 0,
              },
              "All Teachers (Matrix View)",
            ),
            teachers.map((t) =>
              React.createElement(
                "option",
                {
                  key: t.id,
                  value: t.id,
                },
                t.name,
                " (",
                t.code,
                ")",
              ),
            ),
          ),
          React.createElement("input", {
            type: "month",
            value: selectedMonth,
            onChange: (e) => setSelectedMonth(e.target.value),
            style: {
              padding: "8px 12px",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 7,
              color: c.text,
              fontSize: 12,
            },
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                gap: 10,
                marginLeft: "auto",
                flexWrap: "wrap",
                fontSize: 10,
              },
            },
            [
              ["P", "Present", c.success],
              ["L", "Late", c.warn],
              ["A", "Absent", c.danger],
              ["Lv", "Leave", c.accent],
              ["H", "Half", c.purple],
            ].map(([k, l, col]) =>
              React.createElement(
                "div",
                {
                  key: k,
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  },
                },
                React.createElement(
                  "span",
                  {
                    style: {
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      background: llqaAlpha(col, "1f"), // v70: lighter tint so the 9px letter reads (was "33")
                      color: col,
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  },
                  k,
                ),
                React.createElement(
                  "span",
                  {
                    style: {
                      color: c.textSec,
                    },
                  },
                  l,
                ),
              ),
            ),
          ),
        ),
        selectedTeacher === 0
          ? React.createElement(
              "div",
              {
                style: {
                  overflowX: "auto",
                  borderRadius: 10,
                  border: "1px solid " + c.border,
                },
              },
              React.createElement(
                "table",
                {
                  style: {
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 9,
                    minWidth: 1000,
                  },
                },
                React.createElement(
                  "thead",
                  null,
                  React.createElement(
                    "tr",
                    null,
                    React.createElement(
                      "th",
                      {
                        style: {
                          padding: "6px 8px",
                          background: c.bgDeep,
                          borderBottom: "1px solid " + c.border,
                          color: c.textSec,
                          fontSize: 9,
                          textAlign: "left",
                          minWidth: 160,
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                        },
                      },
                      "Teacher",
                    ),
                    (() => {
                      const [y, mo] = selectedMonth.split("-").map(Number);
                      const daysInMonth = new Date(y, mo, 0).getDate();
                      return Array.from(
                        {
                          length: daysInMonth,
                        },
                        (_, i) => i + 1,
                      ).map((d) =>
                        React.createElement(
                          "th",
                          {
                            key: d,
                            style: {
                              padding: "4px 2px",
                              background: c.bgDeep,
                              borderBottom: "1px solid " + c.border,
                              color: c.textMuted,
                              fontSize: 9,
                              fontWeight: 600,
                              minWidth: 24,
                            },
                          },
                          d,
                        ),
                      );
                    })(),
                  ),
                ),
                React.createElement(
                  "tbody",
                  null,
                  llqaEmptyRow("No teachers yet", "Teachers added in HR \u2192 Teachers show here with a day-by-day calendar."), // v70: shows only when the table is empty
                  teachers.map((t) =>
                    React.createElement(
                      "tr",
                      {
                        key: t.id,
                      },
                      React.createElement(
                        "td",
                        {
                          style: {
                            padding: "4px 8px",
                            background: c.bgDeep,
                            borderRight: "1px solid " + c.border,
                            color: c.text,
                            fontSize: 10,
                            fontWeight: 500,
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                          },
                        },
                        t.name,
                      ),
                      (() => {
                        const [y, mo] = selectedMonth.split("-").map(Number);
                        const daysInMonth = new Date(y, mo, 0).getDate();
                        const tHist = history[t.id] || [];
                        return Array.from(
                          {
                            length: daysInMonth,
                          },
                          (_, i) => i + 1,
                        ).map((d) => {
                          const dateStr =
                            selectedMonth + "-" + String(d).padStart(2, "0");
                          const rec = tHist.find((h) => h.date === dateStr);
                          const status = rec ? rec.status : "";
                          const letter =
                            status === "Present"
                              ? "P"
                              : status === "Late"
                                ? "L"
                                : status === "Absent"
                                  ? "A"
                                  : status === "On Leave"
                                    ? "Lv"
                                    : status === "Half Day"
                                      ? "H"
                                      : "—";
                          return React.createElement(
                            "td",
                            {
                              key: d,
                              title:
                                dateStr +
                                (rec
                                  ? " " +
                                    status +
                                    (rec.lateMin
                                      ? " (" + rec.lateMin + "m)"
                                      : "")
                                  : " (no record)"),
                              style: {
                                padding: "3px",
                                textAlign: "center",
                                background: rec
                                  ? llqaAlpha(statusColor(status), "22")
                                  : "transparent",
                                color: rec ? statusColor(status) : c.textMuted,
                                fontSize: 9,
                                fontWeight: 700,
                                cursor: "pointer",
                                border: "1px solid " + c.border,
                              },
                              onClick: () => openRegularize(t.id, dateStr),
                            },
                            letter,
                          );
                        });
                      })(),
                    ),
                  ),
                ),
              ),
            )
          : (() => {
              const t = teachers.find(
                (x) => x.id === parseInt(selectedTeacher),
              );
              const sum = monthlySummary[t.id];
              const recs = (history[t.id] || []).filter((h) =>
                h.date.startsWith(selectedMonth),
              );
              return React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  {
                    style: {
                      background: c.bgCard,
                      backdropFilter: "blur(16px)",
                      boxShadow: c.shadow3d,
                      border: "1px solid " + c.border,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 12,
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                      },
                    },
                    React.createElement(
                      "div",
                      null,
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.text,
                            fontSize: 15,
                            fontWeight: 700,
                          },
                        },
                        t.name,
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.textSec,
                            fontSize: 11,
                          },
                        },
                        "Code ",
                        t.code,
                        " \xB7 ",
                        t.shift,
                        " Shift \xB7 ",
                        llqaPayShort(t) + (llqaIsPerClass(t) ? "" : "/mo"), // v78: or a rate per class
                      ),
                    ),
                    React.createElement(
                      "div",
                      {
                        style: {
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                        },
                      },
                      React.createElement(
                        "div",
                        {
                          style: {
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.success,
                              fontSize: 16,
                              fontWeight: 700,
                            },
                          },
                          sum.attPct,
                          "%",
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 9,
                            },
                          },
                          "Attendance",
                        ),
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.success,
                              fontSize: 16,
                              fontWeight: 700,
                            },
                          },
                          sum.present,
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 9,
                            },
                          },
                          "Present",
                        ),
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.warn,
                              fontSize: 16,
                              fontWeight: 700,
                            },
                          },
                          sum.late,
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 9,
                            },
                          },
                          "Late",
                        ),
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.danger,
                              fontSize: 16,
                              fontWeight: 700,
                            },
                          },
                          sum.absent,
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 9,
                            },
                          },
                          "Absent",
                        ),
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.danger,
                              fontSize: 16,
                              fontWeight: 700,
                            },
                          },
                          "Rs ",
                          sum.totalFine,
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 9,
                            },
                          },
                          "Fines",
                        ),
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.purple,
                              fontSize: 16,
                              fontWeight: 700,
                            },
                          },
                          "Rs ",
                          sum.netPay.toLocaleString(),
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 9,
                            },
                          },
                          "Net Pay",
                        ),
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill,minmax(45px,1fr))",
                      gap: 4,
                    },
                  },
                  recs.map((rec, i) =>
                    React.createElement(
                      "div",
                      {
                        key: i,
                        onClick: () => openRegularize(t.id, rec.date),
                        title: rec.date + " - " + rec.status,
                        style: {
                          background: statusBg(rec.status),
                          border: "1px solid " + llqaAlpha(statusColor(rec.status), "55"),
                          borderRadius: 5,
                          padding: "6px 4px",
                          textAlign: "center",
                          cursor: "pointer",
                        },
                      },
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.textMuted,
                            fontSize: 9,
                          },
                        },
                        llqaLocalDay(rec.date).getDate(), // v70
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: statusColor(rec.status),
                            fontSize: 10,
                            fontWeight: 700,
                          },
                        },
                        rec.status === "Present"
                          ? "P"
                          : rec.status === "Late"
                            ? "L"
                            : rec.status === "Absent"
                              ? "A"
                              : rec.status === "On Leave"
                                ? "Lv"
                                : rec.status === "Half Day"
                                  ? "H"
                                  : "—",
                      ),
                      rec.lateMin > 0 &&
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.warn,
                              fontSize: 9,
                            },
                          },
                          rec.lateMin,
                          "m",
                        ),
                    ),
                  ),
                ),
              );
            })(),
      ),
    tab === "hr" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              marginBottom: 10,
              color: c.textSec,
              fontSize: 11,
            },
          },
          "Employee-wise attendance summary for ",
          selectedMonth,
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Code",
                  "Shift",
                  "Days",
                  "Present",
                  "Late",
                  "Absent",
                  "Leave",
                  "Half",
                  "Att %",
                  "Late Min",
                  "Fines",
                  "Net Pay",
                  "",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 6px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 9,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                        whiteSpace: "nowrap",
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              llqaEmptyRow("No teachers yet", "Each teacher\u2019s month (present, late, absent) shows here."), // v70: shows only when the table is empty
              teachers.map((t, i) => {
                const s = monthlySummary[t.id];
                return React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        fontWeight: 600,
                        fontSize: 10,
                      },
                    },
                    t.name,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.text,
                        fontWeight: 600,
                        fontFamily: "monospace",
                        fontSize: 10,
                      },
                    },
                    t.code,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.shift,
                      color: (t.shift || "").includes("Morning")
                        ? "warn"
                        : (t.shift || "").includes("Evening")
                          ? "cyan"
                          : (t.shift || "").includes("Night")
                            ? "purple"
                            : "accent",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.textSec,
                      },
                    },
                    s.totalDays,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.success,
                        fontWeight: 600,
                      },
                    },
                    s.present,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.warn,
                        fontWeight: 600,
                      },
                    },
                    s.late,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.danger,
                        fontWeight: 600,
                      },
                    },
                    s.absent,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.accent,
                        fontWeight: 600,
                      },
                    },
                    s.leave,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.purple,
                        fontWeight: 600,
                      },
                    },
                    s.halfDay,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        },
                      },
                      React.createElement(PBar, {
                        value: s.attPct,
                        color:
                          s.attPct >= 95
                            ? c.success
                            : s.attPct >= 85
                              ? c.warn
                              : c.danger,
                      }),
                      React.createElement(
                        "span",
                        {
                          style: {
                            fontSize: 9,
                            color:
                              s.attPct >= 95
                                ? c.success
                                : s.attPct >= 85
                                  ? c.warn
                                  : c.danger,
                            fontWeight: 700,
                            minWidth: 26,
                          },
                        },
                        s.attPct,
                        "%",
                      ),
                    ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.warn,
                        fontSize: 10,
                      },
                    },
                    s.totalLateMin,
                    "m",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.danger,
                        fontWeight: 700,
                        fontSize: 10,
                      },
                    },
                    "Rs ",
                    s.totalFine,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                        color: c.success,
                        fontWeight: 700,
                        fontSize: 10,
                      },
                    },
                    "Rs ",
                    s.netPay.toLocaleString(),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "7px 6px",
                      },
                    },
                    React.createElement(
                      "button",
                      {
                        onClick: () => {
                          setSelectedTeacher(t.id);
                          setTab("calendar");
                        },
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.accent,
                        },
                      },
                      React.createElement(Eye, {
                        size: 13,
                      }),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    tab === "fines" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 10,
              padding: 16,
              marginBottom: 14,
            },
          },
          React.createElement(
            "h4",
            {
              style: {
                color: c.text,
                margin: "0 0 10px",
                fontSize: 13,
                fontWeight: 600,
              },
            },
            "Fine Rules (PKR)",
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: 8,
              },
            },
            [
              // v72: the rules really used (Settings → HR & Attendance → Office times & fines)
              ...(() => {
                const r = llqaFineRules(fineSet());
                const pm = "Rs " + (Math.round(r.perMin * 100) / 100).toLocaleString("en-US") + " a minute";
                return [
                  ["Late (every minute)", pm, c.warn],
                  ["Early leaving (every minute)", pm, c.warn],
                  ["Time away (every minute)", r.away ? pm : "recorded, not fined", c.warn],
                  ["Free minutes", r.grace ? r.grace + " min" : "none", c.cyan],
                  ["Absent (1 day)", "Rs " + r.absent.toLocaleString("en-US"), c.danger],
                  ["Half Day", "Rs " + r.halfDay.toLocaleString("en-US"), c.purple],
                  ["Missed Class", "Rs " + r.missedClass.toLocaleString("en-US"), c.danger],
                ];
              })(),
            ].map(([l, v, col]) =>
              React.createElement(
                "div",
                {
                  key: l,
                  style: {
                    background: c.bgDeep,
                    border: "1px solid " + llqaAlpha(col, "44"),
                    borderRadius: 6,
                    padding: "8px 10px",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 9,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    },
                  },
                  l,
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: col,
                      fontSize: 14,
                      fontWeight: 700,
                    },
                  },
                  v,
                ),
              ),
            ),
          ),
        ),
        React.createElement(
          "h4",
          {
            style: {
              color: c.text,
              fontSize: 13,
              margin: "0 0 10px",
              fontWeight: 600,
            },
          },
          "Top Fine Incurred (This Month)",
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Shift",
                  "Days Late",
                  "Total Late Min",
                  "Absent",
                  "Half Day",
                  "Total Fine",
                  "Salary",
                  "Net Pay",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
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
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              llqaEmptyRow("No fines this month", "Late arrivals and absences that carry a fine or a deduction show here."), // v70: shows only when the table is empty
              teachers
                .map((t) => ({
                  t,
                  s: monthlySummary[t.id],
                }))
                .filter((x) => x.s.totalFine > 0)
                .sort((a, b) => b.s.totalFine - a.s.totalFine)
                .map(({ t, s }, i) =>
                  React.createElement(
                    "tr",
                    {
                      key: t.id,
                      style: {
                        borderBottom: "1px solid " + c.border,
                        background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                      },
                    },
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          fontWeight: 600,
                        },
                      },
                      t.name,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                        },
                      },
                      React.createElement(Badge, {
                        text: t.shift,
                        color: (t.shift || "").includes("Morning")
                          ? "warn"
                          : (t.shift || "").includes("Evening")
                            ? "cyan"
                            : (t.shift || "").includes("Night")
                              ? "purple"
                              : "accent",
                      }),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.warn,
                          fontWeight: 600,
                        },
                      },
                      s.late,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.warn,
                        },
                      },
                      s.totalLateMin,
                      "m",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.danger,
                          fontWeight: 600,
                        },
                      },
                      s.absent,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.purple,
                          fontWeight: 600,
                        },
                      },
                      s.halfDay,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.danger,
                          fontWeight: 700,
                        },
                      },
                      "Rs ",
                      s.totalFine.toLocaleString(),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.textSec,
                        },
                      },
                      llqaPayShort(t), // v78: a salary, or a rate per class
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px",
                          color: c.success,
                          fontWeight: 700,
                        },
                      },
                      "Rs ",
                      s.netPay.toLocaleString(),
                    ),
                  ),
                ),
            ),
          ),
        ),
        React.createElement(LLQAFineRecords, { teachers, history, setHistory, user, settings: fineSet(), month: selectedMonth }), // v72: every fine, how, why and who
        llqaCanSetOffice(user) && typeof setAppSettings === "function" && // v72: whoever may set them can do it here too
          React.createElement(
            "div",
            { style: { marginTop: 14 } },
            React.createElement(LLQAOfficeCard, {
              settings: fineSet() || DEFAULT_SETTINGS,
              update: (k, v) => setAppSettings({ ...(fineSet() || DEFAULT_SETTINGS), [k]: v }),
              teachers,
              setTeachers,
            }),
          ),
      ),
    tab === "patterns" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(LLQAWarnCard, { teachers }), // v78: lateness warnings
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                border: "1px solid " + llqaAlpha(c.danger, "44"),
                borderRadius: 10,
                padding: 14,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.danger,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                },
              },
              React.createElement(AlertTriangle, {
                size: 14,
              }),
              " Chronic Latecomers (3+ in 14 days)",
            ),
            chronicLate.length === 0
              ? React.createElement(
                  "p",
                  {
                    style: {
                      color: c.textMuted,
                      fontSize: 11,
                    },
                  },
                  "No chronic latecomers",
                )
              : React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    },
                  },
                  chronicLate.slice(0, 10).map((t) =>
                    React.createElement(
                      "div",
                      {
                        key: t.id,
                        style: {
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: c.bgDeep,
                          borderRadius: 6,
                          padding: "8px 10px",
                        },
                      },
                      React.createElement(
                        "div",
                        null,
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.text,
                              fontSize: 11,
                              fontWeight: 600,
                            },
                          },
                          t.name,
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              color: c.textMuted,
                              fontSize: 9,
                            },
                          },
                          t.shift,
                          " \xB7 Avg ",
                          t.avgLateMin,
                          "min late",
                        ),
                      ),
                      React.createElement(Badge, {
                        text: t.lateCount + " times late",
                        color: "danger",
                      }),
                    ),
                  ),
                ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 10,
                padding: 14,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Perfect Attendance (0 absences)",
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                },
              },
              llqaEmptyNote("Teachers with no absence or late day this month show here once their days are marked."), // v70
              teachers
                .filter(
                  (t) =>
                    monthlySummary[t.id].totalDays > 0 && // v70: no days marked is not perfect attendance
                    monthlySummary[t.id].absent === 0 &&
                    monthlySummary[t.id].late === 0,
                )
                .slice(0, 10)
                .map((t) =>
                  React.createElement(
                    "div",
                    {
                      key: t.id,
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: c.successBg,
                        borderRadius: 6,
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(
                      "div",
                      null,
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.text,
                            fontSize: 11,
                            fontWeight: 600,
                          },
                        },
                        t.name,
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.textMuted,
                            fontSize: 9,
                          },
                        },
                        t.shift,
                      ),
                    ),
                    React.createElement(Badge, {
                      text: "\u2B50 100%",
                      color: "success",
                    }),
                  ),
                ),
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              border: "1px solid " + llqaAlpha(c.warn, "44"),
              borderRadius: 10,
              padding: 14,
            },
          },
          React.createElement(
            "h4",
            {
              style: {
                color: c.warn,
                margin: "0 0 10px",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              },
            },
            React.createElement(AlertTriangle, {
              size: 14,
            }),
            " Action Required",
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 6,
              },
            },
            llqaEmptyNote("Nobody is below 85% attendance this month (only marked days count)."), // v70
            teachers
              .filter((t) => monthlySummary[t.id].totalDays > 0 && monthlySummary[t.id].attPct < 85) // v70: no days marked is not 0%
              .slice(0, 5)
              .map((t) =>
                React.createElement(
                  "div",
                  {
                    key: t.id,
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: c.bgDeep,
                      borderRadius: 6,
                      padding: "8px 10px",
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      },
                    },
                    React.createElement(UserX, {
                      size: 14,
                      color: c.danger,
                    }),
                    React.createElement(
                      "div",
                      null,
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.text,
                            fontSize: 11,
                            fontWeight: 600,
                          },
                        },
                        t.name,
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.textMuted,
                            fontSize: 9,
                          },
                        },
                        "Attendance below 85% \u2014 HR review needed",
                      ),
                    ),
                  ),
                  React.createElement(Badge, {
                    text: monthlySummary[t.id].attPct + "%",
                    color: "danger",
                  }),
                ),
              ),
            chronicLate.slice(0, 3).map((t) =>
              React.createElement(
                "div",
                {
                  key: "l" + t.id,
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: c.bgDeep,
                    borderRadius: 6,
                    padding: "8px 10px",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    },
                  },
                  React.createElement(Clock, {
                    size: 14,
                    color: c.warn,
                  }),
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "div",
                      {
                        style: {
                          color: c.text,
                          fontSize: 11,
                          fontWeight: 600,
                        },
                      },
                      t.name,
                    ),
                    React.createElement(
                      "div",
                      {
                        style: {
                          color: c.textMuted,
                          fontSize: 9,
                        },
                      },
                      "Chronic lateness \u2014 warning letter recommended",
                    ),
                  ),
                ),
                React.createElement(Badge, {
                  text: t.lateCount + "x late",
                  color: "warn",
                }),
              ),
            ),
          ),
        ),
      ),
    tab === "reports" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Attendance Trend (Last 30 Days)",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 220,
              },
              React.createElement(
                AreaChart,
                {
                  data: Array.from(
                    {
                      length: 30,
                    },
                    (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (29 - i));
                      const ds = todayPK(d);
                      let p = 0,
                        l = 0,
                        a = 0;
                      teachers.forEach((t) => {
                        const r = (history[t.id] || []).find(
                          (h) => h.date === ds,
                        );
                        if (r) {
                          if (r.status === "Present") p++;
                          else if (r.status === "Late") l++;
                          else if (r.status === "Absent") a++;
                        }
                      });
                      return {
                        day: d.getDate(),
                        present: p,
                        late: l,
                        absent: a,
                      };
                    },
                  ),
                },
                React.createElement(CartesianGrid, {
                  strokeDasharray: "3 3",
                  stroke: c.border,
                }),
                React.createElement(XAxis, {
                  dataKey: "day",
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(YAxis, {
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(Tooltip, {
                  contentStyle: {
                    background: c.bgCard,
                    backdropFilter: "blur(16px)",
                    boxShadow: c.shadow3d,
                    border: "1px solid " + c.border,
                    borderRadius: 8,
                    fontSize: 11,
                    color: c.text,
                  },
                }),
                React.createElement(Area, {
                  type: "monotone",
                  dataKey: "present",
                  stackId: "1",
                  stroke: c.success,
                  fill: c.successBg,
                  strokeWidth: 2,
                }),
                React.createElement(Area, {
                  type: "monotone",
                  dataKey: "late",
                  stackId: "1",
                  stroke: c.warn,
                  fill: c.warnBg,
                  strokeWidth: 2,
                }),
                React.createElement(Area, {
                  type: "monotone",
                  dataKey: "absent",
                  stackId: "1",
                  stroke: c.danger,
                  fill: c.dangerBg,
                  strokeWidth: 2,
                }),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Status Distribution (This Month)",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 220,
              },
              React.createElement(
                PieChart,
                null,
                React.createElement(
                  Pie,
                  {
                    data: [
                      {
                        name: "Present",
                        value: teachers.reduce(
                          (s, t) => s + monthlySummary[t.id].present,
                          0,
                        ),
                        fill: c.success,
                      },
                      {
                        name: "Late",
                        value: teachers.reduce(
                          (s, t) => s + monthlySummary[t.id].late,
                          0,
                        ),
                        fill: c.warn,
                      },
                      {
                        name: "Absent",
                        value: teachers.reduce(
                          (s, t) => s + monthlySummary[t.id].absent,
                          0,
                        ),
                        fill: c.danger,
                      },
                      {
                        name: "Leave",
                        value: teachers.reduce(
                          (s, t) => s + monthlySummary[t.id].leave,
                          0,
                        ),
                        fill: c.accent,
                      },
                      {
                        name: "Half Day",
                        value: teachers.reduce(
                          (s, t) => s + monthlySummary[t.id].halfDay,
                          0,
                        ),
                        fill: c.purple,
                      },
                    ],
                    cx: "50%",
                    cy: "50%",
                    outerRadius: 75,
                    innerRadius: 40,
                    dataKey: "value",
                    label: ({ name, percent }) =>
                      name + " " + (percent * 100).toFixed(0) + "%",
                    fontSize: 10,
                  },
                  [c.success, c.warn, c.danger, c.accent, c.purple].map(
                    (col, i) =>
                      React.createElement(Cell, {
                        key: i,
                        fill: col,
                      }),
                  ),
                ),
              ),
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 12,
              padding: 16,
            },
          },
          React.createElement(
            "h4",
            {
              style: {
                color: c.text,
                margin: "0 0 10px",
                fontSize: 13,
                fontWeight: 600,
              },
            },
            "Shift-wise Comparison",
          ),
          React.createElement(
            ResponsiveContainer,
            {
              width: "100%",
              height: 220,
            },
            React.createElement(
              BarChart,
              {
                data: SHIFTS_ATT.map((s) => {
                  const ts = teachers.filter((t) =>
                    (t.shift || "").includes(s),
                  );
                  const tot = ts.reduce(
                    (acc, t) => {
                      acc.p += monthlySummary[t.id].present;
                      acc.l += monthlySummary[t.id].late;
                      acc.a += monthlySummary[t.id].absent;
                      return acc;
                    },
                    {
                      p: 0,
                      l: 0,
                      a: 0,
                    },
                  );
                  return {
                    shift: s,
                    Present: tot.p,
                    Late: tot.l,
                    Absent: tot.a,
                  };
                }),
              },
              React.createElement(CartesianGrid, {
                strokeDasharray: "3 3",
                stroke: c.border,
              }),
              React.createElement(XAxis, {
                dataKey: "shift",
                stroke: c.textMuted,
                fontSize: 10,
              }),
              React.createElement(YAxis, {
                stroke: c.textMuted,
                fontSize: 10,
              }),
              React.createElement(Tooltip, {
                contentStyle: {
                  background: c.bgCard,
                  backdropFilter: "blur(16px)",
                  boxShadow: c.shadow3d,
                  border: "1px solid " + c.border,
                  borderRadius: 8,
                  fontSize: 11,
                  color: c.text,
                },
              }),
              React.createElement(Bar, {
                dataKey: "Present",
                stackId: "a",
                fill: c.success,
              }),
              React.createElement(Bar, {
                dataKey: "Late",
                stackId: "a",
                fill: c.warn,
              }),
              React.createElement(Bar, {
                dataKey: "Absent",
                stackId: "a",
                fill: c.danger,
              }),
            ),
          ),
        ),
      ),
    tab === "audit" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
            },
          },
          React.createElement(
            "h4",
            {
              style: {
                color: c.text,
                margin: "0 0 8px",
                fontSize: 13,
                fontWeight: 600,
              },
            },
            "Recent Activity Log",
          ),
          React.createElement(
            "p",
            {
              style: {
                color: c.textSec,
                fontSize: 11,
                margin: 0,
              },
            },
            "Full audit trail of all attendance marks with device, IP, and timestamp for security",
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 10,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Date",
                  "Teacher",
                  "Status",
                  "Check-in",
                  "Check-out",
                  "Late",
                  "Fine",
                  "Device",
                  "IP Address",
                  "Approved",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
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
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              llqaEmptyRow("No attendance records yet", "Every check-in, check-out and change shows here, newest first."), // v70: shows only when the table is empty
              teachers
                .flatMap((t) =>
                  (history[t.id] || []).slice(-7).map((r) => ({
                    ...r,
                    teacherName: t.name,
                    teacherId: t.id,
                  })),
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 50)
                .map((r, i) =>
                  React.createElement(
                    "tr",
                    {
                      key: i,
                      style: {
                        borderBottom: "1px solid " + c.border,
                        background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent",
                      },
                    },
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.accent,
                          fontSize: 9,
                          fontFamily: "monospace",
                        },
                      },
                      r.date,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          fontWeight: 600,
                          fontSize: 10,
                        },
                      },
                      r.teacherName,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                        },
                      },
                      React.createElement(Badge, {
                        text: r.status,
                        color:
                          r.status === "Present"
                            ? "success"
                            : r.status === "Late"
                              ? "warn"
                              : r.status === "Absent"
                                ? "danger"
                                : r.status === "On Leave"
                                  ? "accent"
                                  : "purple",
                      }),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.success,
                          fontFamily: "monospace",
                          fontSize: 9,
                        },
                      },
                      r.checkIn || "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.textSec,
                          fontFamily: "monospace",
                          fontSize: 9,
                        },
                      },
                      r.checkOut || "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.warn,
                          fontSize: 9,
                        },
                      },
                      r.lateMin ? r.lateMin + "m" : "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.danger,
                          fontWeight: 600,
                          fontSize: 9,
                        },
                      },
                      r.fine ? "Rs " + r.fine : "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.textSec,
                          fontSize: 9,
                        },
                      },
                      r.device || "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                          color: c.textMuted,
                          fontFamily: "monospace",
                          fontSize: 9,
                        },
                      },
                      r.ip || "—",
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "7px 8px",
                        },
                      },
                      r.approved
                        ? React.createElement(Badge, {
                            text: "\u2713",
                            color: "success",
                          })
                        : React.createElement(Badge, {
                            text: "Pending",
                            color: "warn",
                          }),
                    ),
                  ),
                ),
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "late" && // v72
      React.createElement(LLQALateWindow, {
        teacher: teachers.find((t) => t.id === modal.teacherId),
        rec: (history[modal.teacherId] || []).find((h) => h.date === dayOf(teachers.find((t) => t.id === modal.teacherId))),
        settings: fineSet(),
        onClose: () => setModal(null),
        onSave: (time, lm) => {
          markAttendance(modal.teacherId, lm > 0 ? "Late" : "Present", time);
          setModal(null);
        },
      }),
    modal &&
      modal.type === "regularize" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
            backdropFilter: "blur(4px)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 460,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              },
            },
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 16,
                  margin: 0,
                },
              },
              "Regularize Attendance",
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(X, {
                size: 18,
              }),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.warnBg,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                color: c.warn,
                fontSize: 11,
              },
            },
            "Correct attendance for ",
            regForm.date,
            " \u2014 ",
            teachers.find((t) => t.id === regForm.teacherId)?.name,
          ),
          React.createElement(Inp, {
            label: "New Status *",
            value: regForm.newStatus || "",
            onChange: (v) =>
              setRegForm({
                ...regForm,
                newStatus: v,
              }),
            options: ATT_STATUS,
          }),
          regForm.newStatus === "Late" && // v72: late by the minute from this time
            React.createElement(Inp, {
              label: "Signed in at (Pakistan time)",
              type: "time",
              value: regForm.inTime || "",
              onChange: (v) => setRegForm({ ...regForm, inTime: v }),
            }),
          React.createElement(Inp, {
            label: "Reason for Change *",
            value: regForm.reason || "",
            onChange: (v) =>
              setRegForm({
                ...regForm,
                reason: v,
              }),
            placeholder: "e.g. System error, teacher confirmed presence...",
          }),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgDeep,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 10,
                fontSize: 10,
                color: c.textSec,
              },
            },
            "This change will be logged in the audit trail with admin credentials.",
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                onClick: () => {
                  if (!regForm.newStatus || !regForm.reason) return;
                  // v72: the fine is worked out again from the corrected day (Present / On Leave / Absent clear the
                  // minutes; Late counts from the time given); the correction and its reason are kept in its history
                  const set = fineSet();
                  const st = regForm.newStatus;
                  const t = teachers.find((x) => x.id === regForm.teacherId);
                  setHistory((prev) => ({
                    ...(prev || {}),
                    [regForm.teacherId]: ((prev || {})[regForm.teacherId] || []).map((h) => {
                      if (h.date !== regForm.date) return h;
                      const off = llqaOffice(t, set);
                      const o = { start: h.officeStart || off.start, end: h.officeEnd || off.end };
                      const inHm = st === "Late" && llqaHm2m(regForm.inTime) != null ? regForm.inTime : h.checkIn;
                      const clear = st === "Present" || st === "On Leave" || st === "Absent";
                      return llqaWithFine(
                        {
                          ...h,
                          status: st,
                          checkIn: st === "Absent" || st === "On Leave" ? "—" : inHm,
                          lateMin: st === "Late" ? llqaLateMin(o, inHm) : 0,
                          earlyMin: clear ? 0 : Number(h.earlyMin) || 0,
                          awayMin: clear ? 0 : Number(h.awayMin) || 0,
                          officeStart: o.start,
                          officeEnd: o.end,
                          fineOverride: null,
                          regularized: true,
                          regReason: regForm.reason,
                        },
                        set,
                        who,
                        "corrected to " + st + " by " + who + ": " + regForm.reason,
                      );
                    }),
                  }));
                  setModal(null);
                },
                icon: Check,
              },
              "Save Regularization",
            ),
          ),
        ),
      ),
  );
};
