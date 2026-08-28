const AttendanceMod = ({
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
  const [tab, setTab] = useState("live");
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
  const todayRecords = useMemo(() => {
    const r = {};
    teachers.forEach((t) => {
      const rec = history[t.id]?.find((h) => h.date === today);
      r[t.id] = rec || {
        status: "Not Marked",
        checkIn: "—",
        checkOut: "—",
        lateMin: 0,
        fine: 0,
      };
    });
    return r;
  }, [teachers, history]);
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
        netPay: t.salary - totalFine,
      };
    });
    return sum;
  }, [teachers, history, selectedMonth]);
  const filteredTeachers = useMemo(() => {
    let d = teachers;
    if (fShift !== "all") d = d.filter((t) => t.shift === fShift);
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
  const markAttendance = (teacherId, status) => {
    const t = teachers.find((x) => x.id === teacherId);
    const sm =
      t.shift === "Morning"
        ? 8
        : t.shift === "Evening"
          ? 16
          : t.shift === "Night"
            ? 0
            : 10;
    const now = new Date();
    const checkIn =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const lateMin =
      status === "Late"
        ? Math.max(0, now.getHours() * 60 + now.getMinutes() - sm * 60)
        : 0;
    const fine =
      status === "Late"
        ? lateMin > 30
          ? FINE_RULES.late30
          : lateMin > 10
            ? FINE_RULES.late10
            : 0
        : status === "Absent"
          ? FINE_RULES.absent
          : status === "Half Day"
            ? FINE_RULES.halfDay
            : 0;
    setHistory({
      ...history,
      [teacherId]: history[teacherId]
        ?.filter((h) => h.date !== today)
        .concat([
          {
            date: today,
            status,
            checkIn:
              status === "Absent" || status === "On Leave" ? "—" : checkIn,
            checkOut: "—",
            lateMin,
            fine,
            device: "Admin Panel",
            ip: "182.178.0.1",
            approved: true,
          },
        ]) || [
        {
          date: today,
          status,
          checkIn,
          checkOut: "—",
          lateMin,
          fine,
          device: "Admin Panel",
          ip: "182.178.0.1",
          approved: true,
        },
      ],
    });
  };
  const checkOut = (teacherId) => {
    const now = new Date();
    const co =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    setHistory({
      ...history,
      [teacherId]: history[teacherId].map((h) =>
        h.date === today
          ? {
              ...h,
              checkOut: co,
            }
          : h,
      ),
    });
  };
  const openCalendar = (teacherId) => {
    setSelectedTeacher(teacherId);
    setTab("calendar");
  };
  const openRegularize = (teacherId, date) => {
    setRegForm({
      teacherId,
      date,
      reason: "",
      newStatus: "",
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
            const headers = [
              "Date",
              "Teacher",
              "Code",
              "Status",
              "Time In",
              "Network",
              "Location",
              "Verified By",
            ];
            const rows = (attendanceData || []).map((a) => [
              a.date || "",
              a.teacher || "",
              a.code || "",
              a.status || "",
              a.timeIn || "",
              a.network || "",
              a.location || "",
              a.verifiedBy || "",
            ]);
            if (rows.length === 0) {
              alert("No attendance data to export.");
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
              background: tab === k ? c.accent : "transparent",
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
                border: "1px solid " + c.success + "44",
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
                        "\u26A0 Late " + a.lateMin + " min",
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
            "select",
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
          React.createElement(
            "button",
            {
              onClick: () => {
                if (
                  confirm(
                    "Mark ALL teachers as Present for today? This will overwrite any existing attendance entries.",
                  )
                ) {
                  const now = new Date();
                  const checkIn =
                    now.getHours().toString().padStart(2, "0") +
                    ":" +
                    now.getMinutes().toString().padStart(2, "0");
                  const newHist = { ...history };
                  teachers.forEach((t) => {
                    newHist[t.id] = (newHist[t.id] || [])
                      .filter((h) => h.date !== today)
                      .concat([
                        {
                          date: today,
                          status: "Present",
                          checkIn: checkIn,
                          checkOut: "?",
                          lateMin: 0,
                          fine: 0,
                          approved: true,
                        },
                      ]);
                  });
                  setHistory(newHist);
                }
              },
              style: {
                padding: "8px 12px",
                background: c.successBg,
                border: "1px solid " + c.success + "44",
                borderRadius: 7,
                cursor: "pointer",
                color: c.success,
                fontSize: 11,
                fontWeight: 600,
              },
            },
            "Mark All Present",
          ),
          React.createElement(
            "button",
            {
              onClick: () => {
                if (
                  confirm(
                    "Auto-fill missing checkouts for today? Teachers who closed their browser will be checked out at their last active (Heartbeat) time. Others will be assigned an automatic checkout time (8 hours after check-in).",
                  )
                ) {
                  const today = todayPK();
                  const newHist = { ...history };
                  let count = 0;
                  teachers.forEach((t) => {
                    const todayRecs = newHist[t.id] || [];
                    const recIdx = todayRecs.findIndex((h) => h.date === today);
                    if (
                      recIdx > -1 &&
                      todayRecs[recIdx].status === "Present" &&
                      (todayRecs[recIdx].checkOut === "?" ||
                        todayRecs[recIdx].checkOut === "-" ||
                        !todayRecs[recIdx].checkOut)
                    ) {
                      let endStr = "";
                      if (todayRecs[recIdx].lastActive) {
                        endStr = todayRecs[recIdx].lastActive;
                      } else {
                        let startH = 8,
                          startM = 0;
                        if (
                          todayRecs[recIdx].checkIn &&
                          todayRecs[recIdx].checkIn !== "?" &&
                          todayRecs[recIdx].checkIn !== "-"
                        ) {
                          const parts = todayRecs[recIdx].checkIn.split(":");
                          startH = parseInt(parts[0], 10) || 8;
                          startM = parseInt(parts[1], 10) || 0;
                        }
                        let endH = startH + 8;
                        if (endH >= 24) endH -= 24;
                        endStr =
                          String(endH).padStart(2, "0") +
                          ":" +
                          String(startM).padStart(2, "0");
                      }
                      todayRecs[recIdx] = {
                        ...todayRecs[recIdx],
                        checkOut: endStr,
                      };
                      newHist[t.id] = [...todayRecs];
                      count++;
                    }
                  });
                  if (count > 0) {
                    setHistory(newHist);
                    alert(count + " missing checkouts were auto-filled!");
                  } else {
                    alert("No missing checkouts found for today.");
                  }
                }
              },
              style: {
                padding: "8px 12px",
                background: c.accentBg,
                border: "1px solid " + c.accent + "44",
                borderRadius: 7,
                cursor: "pointer",
                color: c.accentText,
                fontSize: 11,
                fontWeight: 600,
                marginLeft: 10,
              },
            },
            "Auto-Fill Checkouts",
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
              filteredTeachers.map((t, i) => {
                const rec = todayRecords[t.id];
                return React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? c.bgDeep + "88" : "transparent",
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
                      color:
                        t.shift === "Morning"
                          ? "warn"
                          : t.shift === "Evening"
                            ? "cyan"
                            : t.shift === "Night"
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
                    rec.checkIn || "—",
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
                    rec.checkOut || "—",
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
                          fontSize: 8,
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
                    React.createElement(
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
                            border: "1px solid " + c.success + "44",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.success,
                            fontSize: 8,
                            fontWeight: 700,
                          },
                        },
                        "P",
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => markAttendance(t.id, "Late"),
                          title: "Late",
                          style: {
                            background: c.warnBg,
                            border: "1px solid " + c.warn + "44",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.warn,
                            fontSize: 8,
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
                            border: "1px solid " + c.danger + "44",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.danger,
                            fontSize: 8,
                            fontWeight: 700,
                          },
                        },
                        "A",
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => markAttendance(t.id, "On Leave"),
                          title: "Leave",
                          style: {
                            background: c.accentBg,
                            border: "1px solid " + c.accent + "44",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.accent,
                            fontSize: 8,
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
                            border: "1px solid " + c.purple + "44",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "3px 6px",
                            color: c.purple,
                            fontSize: 8,
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
                                fontSize: 8,
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
            "select",
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
                      background: col + "33",
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
                              fontSize: 8,
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
                                  ? statusColor(status) + "22"
                                  : "transparent",
                                color: rec ? statusColor(status) : c.textMuted,
                                fontSize: 8,
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
                        " Shift \xB7 Rs ",
                        t.salary.toLocaleString(),
                        "/mo",
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
                          border: "1px solid " + statusColor(rec.status) + "55",
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
                            fontSize: 8,
                          },
                        },
                        new Date(rec.date).getDate(),
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
                              fontSize: 7,
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
              teachers.map((t, i) => {
                const s = monthlySummary[t.id];
                return React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? c.bgDeep + "88" : "transparent",
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
                      color:
                        t.shift === "Morning"
                          ? "warn"
                          : t.shift === "Evening"
                            ? "cyan"
                            : t.shift === "Night"
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
              ["Late 10-29 min", "Rs " + FINE_RULES.late10, c.warn],
              ["Late 30-59 min", "Rs " + FINE_RULES.late30, c.warn],
              ["Late 60+ min", "Rs " + FINE_RULES.late60, c.danger],
              ["Absent (1 day)", "Rs " + FINE_RULES.absent, c.danger],
              ["Half Day", "Rs " + FINE_RULES.halfDay, c.purple],
              ["Early Leave", "Rs " + FINE_RULES.earlyLeave, c.warn],
              ["Missed Class", "Rs " + FINE_RULES.missedClass, c.danger],
            ].map(([l, v, col]) =>
              React.createElement(
                "div",
                {
                  key: l,
                  style: {
                    background: c.bgDeep,
                    border: "1px solid " + col + "44",
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
                        background: i % 2 ? c.bgDeep + "88" : "transparent",
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
                        color:
                          t.shift === "Morning"
                            ? "warn"
                            : t.shift === "Evening"
                              ? "cyan"
                              : t.shift === "Night"
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
                      "Rs ",
                      t.salary.toLocaleString(),
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
      ),
    tab === "patterns" &&
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
                border: "1px solid " + c.danger + "44",
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
              teachers
                .filter(
                  (t) =>
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
              border: "1px solid " + c.warn + "44",
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
            teachers
              .filter((t) => monthlySummary[t.id].attPct < 85)
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
                  const ts = teachers.filter((t) => t.shift === s);
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
                        background: i % 2 ? c.bgDeep + "88" : "transparent",
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
                  const fine =
                    regForm.newStatus === "Absent"
                      ? FINE_RULES.absent
                      : regForm.newStatus === "Half Day"
                        ? FINE_RULES.halfDay
                        : 0;
                  setHistory({
                    ...history,
                    [regForm.teacherId]: history[regForm.teacherId].map((h) =>
                      h.date === regForm.date
                        ? {
                            ...h,
                            status: regForm.newStatus,
                            fine,
                            regularized: true,
                            regReason: regForm.reason,
                          }
                        : h,
                    ),
                  });
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
