function App() {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useFirestoreDoc(
    "settings/preferences",
    DEFAULT_SETTINGS,
  );
  const [theme, setThemeLocal] = useState(
    (appSettings && appSettings.theme) || "dark",
  );
  const setTheme = (v) => {
    const newV = typeof v === "function" ? v(theme) : v;
    setThemeLocal(newV);
    setAppSettings({
      ...(appSettings || DEFAULT_SETTINGS),
      theme: newV,
    });
  };
  React.useEffect(() => {
    if (appSettings && appSettings.theme && appSettings.theme !== theme)
      setThemeLocal(appSettings.theme);
  }, [appSettings && appSettings.theme]);
  // v68: one theme engine. The theme in use ("Auto" follows the computer, live), the accent and
  // the tone mode are applied together, so Light never keeps Dark's colours (old timing bug).
  const [sysDark, setSysDark] = useState(() => llqaSysDark());
  React.useEffect(() => llqaWatchSys(setSysDark), []);
  const themeUsed = theme === "auto" ? (sysDark ? "dark" : "light") : theme === "light" ? "light" : "dark";
  // v69: + background tone (Neutral / Midnight / Warm) and an always-dark sidebar option
  const llqaAcc = appSettings && appSettings.accentColor, llqaTone = appSettings && appSettings.toneMode;
  const llqaBack = llqaBackdrop(appSettings && appSettings.backdrop);
  const themeVars = React.useMemo(() => llqaThemeVars(themeUsed, llqaAcc, llqaTone, llqaBack), [themeUsed, llqaAcc, llqaTone, llqaBack]);
  React.useLayoutEffect(() => llqaPaintTheme(themeUsed, themeVars, llqaBack), [themeUsed, themeVars, llqaBack]);
  const llqaSideDark = (appSettings && appSettings.sidebarStyle) === "dark" && themeUsed === "light";
  const llqaSideVars = React.useMemo(() => (llqaSideDark ? llqaThemeVars("dark", llqaAcc, llqaTone, llqaBack, false) : null), [llqaSideDark, llqaAcc, llqaTone, llqaBack]);
  React.useEffect(() => {
    const d = (appSettings && appSettings.density) || "Normal";
    const fs = (appSettings && appSettings.fontSize) || "Medium";
    const fMap = {
      Small: "13px",
      Medium: "14px",
      Large: "16px",
    };
    const dMap = {
      Compact: "0.92",
      Normal: "1",
      Comfortable: "1.10",
    };
    document.body.style.fontSize = fMap[fs] || "14px";
    document.body.style.zoom = dMap[d] || "1";
    document.documentElement.style.setProperty("--llqaZoom", dMap[d] || "1"); // v70: full-height layout at every Density
  }, [appSettings && appSettings.density, appSettings && appSettings.fontSize]);
  const [page, setPage] = useState("dashboard");
  const [open, setOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [teachers, setTeachersRaw] = useFirestoreCollection(
    "teachers",
    initTeachers,
  );
  // v75: a salary change is kept on the teacher (from its day), and the leaving date when one resigns or is terminated
  const setTeachers = React.useCallback((v) => setTeachersRaw((prev) => llqaTeachersChanged(prev, typeof v === "function" ? v(prev) : v)), [setTeachersRaw]);
  const [students, setStudentsRaw] = useFirestoreCollection(
    "students",
    initStudents,
  );
  // v73.1: a leave that is over is kept on the student (lvHist), so its days stay leave days
  const setStudents = React.useCallback((v) => setStudentsRaw((prev) => llqaStuChanged(prev, typeof v === "function" ? v(prev) : v)), [setStudentsRaw]); // v74: + the classes before a change, shift records
  const [shifts, setShifts] = useFirestoreCollection("shifts", initShifts);
  const [customRoles, setCustomRoles] = useFirestoreCollection(
    "customRoles",
    [],
  );
  // v73: classes are kept by month in parts (classes/…, see useLLQAClasses, set up below); this list from before is only read
  const [dailyProgressLegacy, setDailyProgressLegacy] = useFirestoreCollection(
    "dailyProgress",
    [],
  );
  const [parentNotes, setParentNotes] = useFirestoreCollection(
    "parentNotes",
    [],
  );
  const [teacherFeedback, setTeacherFeedback] = useFirestoreCollection(
    "teacherFeedback",
    [],
  );
  const [access, setAccess] = useFirestoreDoc(
    "settings/portalAccess",
    DEFAULT_ACCESS,
  );
  // v72: attendance by month in 16 parts (attendance/…, see useLLQAAttendance); the single document used before
  // is only read, for the days the months don't have
  const [attendanceLegacy] = useFirestoreDoc("data/attendanceHistory", initAttHist);
  const [attendanceHistory, setAttendanceHistory, attNeed] = useLLQAAttendance(user, attendanceLegacy);
  // v71: payroll approvals, payments, advances and bonuses are kept in the cloud (they were lost on every reload)
  const [payrollHistory, setPayrollHistory] = useFirestoreDoc("data/payrollHistory", {});
  // v77: removed payments and bills (kept with the reason), vendor details
  const [finance, setFinance] = useFirestoreDoc("data/finance", {});
  const [leaves, setLeaves] = useFirestoreCollection("leaves", []);
  const [teamLeads, setTeamLeads] = useFirestoreCollection(
    "teamLeads",
    DEFAULT_TEAM_LEADS,
  );
  const [autoAttendance, setAutoAttendance] = useFirestoreCollection(
    "autoAttendance",
    [],
  );
  const [salesMasterData, setSalesMasterData] = useFirestoreCollection(
    "salesMasterData",
    [],
  );
  const [salesReferrals, setSalesReferrals] = useFirestoreCollection(
    "salesReferrals",
    [],
  );
  const [arPayments, setArPayments] = useFirestoreCollection("arPayments", []);
  const [apLiabilities, setApLiabilities] = useFirestoreCollection(
    "apLiabilities",
    [],
  );
  const [qcViolations, setQcViolations] = useFirestoreCollection(
    "qcViolations",
    [],
  );
  const [trainingPrograms, setTrainingPrograms] = useFirestoreCollection(
    "trainingPrograms",
    [],
  );
  const [procInventory, setProcInventory] = useFirestoreCollection(
    "procInventory",
    [],
  );
  const [procPurchases, setProcPurchases] = useFirestoreCollection(
    "procPurchases",
    [],
  );
  const [hrInterviews, setHrInterviews] = useFirestoreCollection(
    "hrInterviews",
    [],
  );
  const [hrHiring, setHrHiring] = useFirestoreCollection("hrHiring", []);
  // v65: automation data
  const [waitlist, setWaitlist] = useFirestoreCollection("waitlist", []);
  const [messageLog, setMessageLog] = useFirestoreCollection("messageLog", []);
  const [messaging, setMessaging] = useFirestoreDoc("settings/messaging", {});
  const [automation, setAutomation] = useFirestoreDoc("settings/automation", {});
  // v66: leave cover, parent requests, holidays calendar
  const [covers, setCovers] = useFirestoreCollection("covers", []);
  const [parentRequests, setParentRequests] = useFirestoreCollection("parentRequests", []);
  const [calendar, setCalendar] = useFirestoreDoc("settings/calendar", {});
  // v67.3: the 24/7 runner (server) — its heartbeat
  const [runnerInfo, setRunnerInfo] = useFirestoreDoc("settings/runner", {});
  // v67: make-up classes, leads, referral rewards
  const [makeups, setMakeups] = useFirestoreCollection("makeups", []);
  // v73: the class records this person needs (staff: all; a teacher: their students'; a parent: their child's)
  const [dailyProgress, setDailyProgress, clsNeed] = useLLQAClasses(user, dailyProgressLegacy, setDailyProgressLegacy, teachers, students, covers, makeups);
  const [leads, setLeads] = useFirestoreCollection("leads", []);
  const [rewards, setRewards] = useFirestoreCollection("rewards", []);
  const upsertSalesMaster = (records) => {
    if (!records || records.length === 0) return;
    setSalesMasterData((prev) => {
      const byId = {};
      (prev || []).forEach((r) => {
        byId[String(r.id)] = r;
      });
      records.forEach((r) => {
        byId[String(r.id)] = {
          ...(byId[String(r.id)] || {}),
          ...r,
        };
      });
      return Object.values(byId);
    });
  };
  const expandAccess = (ids) => {
    const s = new Set(ids || []);
    (ids || []).forEach((id) => {
      const nd = NAV.find((n) => n.id === id);
      if (nd && nd.isGroup)
        NAV.forEach((x) => {
          if (x.parent === id) s.add(x.id);
        });
    });
    return Array.from(s);
  };
  const visibleNav = user
    ? user.role === "superadmin"
      ? NAV
      : user.role === "parent"
        ? NAV.filter((n) => n.id === "parent")
        : user.role && user.role.startsWith("custom:")
          ? NAV.filter((n) =>
              expandAccess(
                buildAccessFromPermissions(user.customPermissions),
              ).includes(n.id),
            )
          : NAV.filter((n) =>
              expandAccess(access[user.role] || []).includes(n.id),
            )
    : [];
  useEffect(() => {
    const p = NAV.find((n) => n.id === page);
    if (p && p.parent) {
      setExpandedGroups((prev) =>
        prev[p.parent]
          ? prev
          : {
              ...prev,
              [p.parent]: true,
            },
      );
    }
  }, [page]);
  useEffect(() => {
    if (!students) return;
    // v64.3: only when Students AND Master Data have both arrived from the cloud
    if (!LLQACloud.ready("students") || !LLQACloud.ready("salesMasterData")) return;
    const CORE = [
      "name",
      "age",
      "parent",
      "course",
      "teacher",
      "code",
      "country",
      "state",
      "time",
      "dor",
      "fee",
      "status",
      "juz",
      "surah",
      "page",
      "qaida",
      "lastLesson",
      "lastDate",
      "attendance",
      "totalClasses",
      "attended",
      "notes",
    ];
    const norm = (o) =>
      JSON.stringify(CORE.map((k) => (o[k] == null ? null : o[k])));
    const masterById = {};
    (salesMasterData || []).forEach((m) => {
      masterById[String(m.id)] = m;
    });
    const sIds = new Set(students.map((s) => String(s.id)));
    const toWrite = [];
    students.forEach((s) => {
      const ex = masterById[String(s.id)];
      if (!ex) {
        toWrite.push({
          ...s,
          _inSystem: true,
        });
      } else if (norm(ex) !== norm(s) || ex._inSystem === false) {
        toWrite.push({
          ...s,
          _inSystem: true,
        });
      }
    });
    (salesMasterData || []).forEach((m) => {
      if (!sIds.has(String(m.id)) && m._inSystem !== false) {
        toWrite.push({
          ...m,
          _inSystem: false,
          _removedDate: todayPK(),
        });
      }
    });
    if (toWrite.length === 0) return;
    upsertSalesMaster(toWrite);
  }, [students, salesMasterData]);
  useEffect(() => {
    if (!students || !students.length) return;
    // v64.3: only when Students AND Referrals have both arrived from the cloud
    if (!LLQACloud.ready("students") || !LLQACloud.ready("salesReferrals")) return;
    const wr = students.filter(
      (s) => s.referredBy && String(s.referredBy).trim(),
    );
    if (!wr.length) return;
    const ex = new Set((salesReferrals || []).map((r) => String(r.studentId)));
    const add = wr.filter((s) => !ex.has(String(s.id)));
    if (!add.length) return;
    setSalesReferrals([
      ...(salesReferrals || []),
      ...add.map((s, i) => ({
        id: Date.now() + i,
        studentId: s.id,
        studentName: s.name,
        referredBy: s.referredBy,
        relationship: s.refRelationship || "",
        contact: s.phone || "",
        country: s.country || "",
        course: s.course || "",
        date: s.dor || todayPK(),
        status: "Enrolled",
        reward: "",
        notes: "Auto-added from student registration",
        _auto: true,
      })),
    ]);
  }, [students, salesReferrals]);
  useEffect(() => {
    if (
      user &&
      visibleNav.length > 0 &&
      !visibleNav.find((n) => n.id === page)
    ) {
      setPage(visibleNav[0].id);
    }
  }, [user, access, page]);
  React.useEffect(() => {
    // v72: attendance and fines go by the web server's time, not this computer's clock (checked now and every 10 min)
    llqaSyncClock();
    const id = setInterval(llqaSyncClock, 600000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    // v72: a teacher's CRM notes "open now" every 2 minutes (and when the tab is hidden or closed) in
    // presence/<office day> — small, apart from attendance, so it no longer rewrites everyone's attendance for every
    // open screen. Signed out earlier (in another tab, or before coming back) and still working before the exit: the
    // day opens again.
    if (!user || user.role !== "teacher") return;
    const uid = String(user.id != null ? user.id : user.teacherId);
    llqaPresencePrune();
    const beat = () => {
      try {
        const set = (LLQAApp.ctx && LLQAApp.ctx.appSettings) || appSettings;
        const t = ((LLQAApp.ctx && LLQAApp.ctx.teachers) || teachers || []).find((x) => String(x.id) === uid);
        const nowMs = llqaNowMs();
        const od = llqaOfficeDay(llqaOffice(t, set), nowMs);
        if (!od) return;
        llqaPresenceBeat(uid, od.date, nowMs, llqaFineRules(set).silenceMin);
        if (nowMs >= od.endMs || !llqaAttReady()) return;
        const h = (llqaAttView()[uid] || []).find((x) => x.date === od.date);
        if (!h || h.signOut !== "manual" || llqaIsOpen(h)) return;
        llqaAttWrite((prev) => {
          const list = prev[uid] || [];
          const i = list.findIndex((x) => x.date === od.date);
          if (i < 0 || list[i].signOut !== "manual" || llqaIsOpen(list[i])) return prev;
          return { ...prev, [uid]: list.map((x, j) => (j === i ? llqaWithFine(llqaReopenDay(x), set, "CRM", "back at " + llqaHm12(llqaPkHm(nowMs)) + " (signed out at " + llqaHm12(x.checkOut) + ")") : x)) };
        });
      } catch (e) {}
    };
    const intervalId = setInterval(beat, 120000);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") beat();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    beat();
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  React.useEffect(() => {
    // v72: a few minutes after the exit time the CRM signs the teacher out by itself and closes the day from what it
    // saw (leaving earlier — the CRM closed before the exit — is fined by the minute). To keep working the teacher
    // signs in again; the day stays closed.
    if (!user || user.role !== "teacher") return;
    const uid = String(user.id != null ? user.id : user.teacherId);
    let busy = false;
    const tick = async () => {
      if (busy || !llqaAttReady()) return;
      const set = (LLQAApp.ctx && LLQAApp.ctx.appSettings) || appSettings;
      const recs = llqaAttView()[uid] || [];
      const r = recs[llqaOpenRecIdx(recs, llqaPkDate(llqaNowMs()))];
      if (!r || !r.officeStart || !r.officeEnd) return;
      const rules = llqaFineRules(set);
      const endMs = llqaPkMs(r.date, r.officeStart) + llqaShiftLen({ start: r.officeStart, end: r.officeEnd }) * 60000;
      if (llqaNowMs() < endMs + rules.autoOutMin * 60000) return;
      busy = true;
      try {
        await LLQAPresence.fetchDay(r.date);
      } catch (e) {}
      const t = ((LLQAApp.ctx && LLQAApp.ctx.teachers) || teachers || []).find((x) => String(x.id) === uid);
      llqaAttWrite((prev) => {
        const list = prev[uid] || [];
        const i = list.findIndex((h) => h.date === r.date);
        if (i < 0 || !llqaIsOpen(list[i])) return prev;
        const closed = llqaCloseDay(list[i], t, set, LLQAPresence.spans(r.date, uid, rules.silenceMin), llqaNowMs(), "auto");
        const why = closed.unknownOut ? "signed out by the CRM — no record of when they left" : closed.earlyMin ? "CRM last open " + llqaHm12(closed.checkOut) + ", " + closed.earlyMin + " min before " + llqaHm12(closed.officeEnd) : "signed out by the CRM after the exit time";
        return { ...prev, [uid]: list.map((h, j) => (j === i ? llqaWithFine(closed, set, "CRM", why) : h)) };
      });
      try {
        llqaToast({ text: "Your office time ended at " + llqaHm12(r.officeEnd) + " — you were signed out. Sign in again to keep working.", ttl: 15000 });
      } catch (e) {}
      logout("auto");
    };
    const id = setInterval(tick, 30000);
    tick();
    return () => clearInterval(id);
  }, [user]);

  React.useEffect(() => {
    // v72: the admin's screen closes days whose exit time has passed (+ the "gone" minutes), from when each teacher's
    // CRM was last open: leaving early and time away are fined by the minute; with no sign of them at all, nothing
    // is fined. Days from before v72 close the old way, without a fine. A tab with an older version does nothing.
    if (!user || user.role !== "superadmin") return;
    const runDaemon = () => {
      if (typeof LLQAUI !== "undefined" && LLQAUI.stale) return;
      const set = (LLQAApp.ctx && LLQAApp.ctx.appSettings) || appSettings;
      const list = [...((LLQAApp.ctx && LLQAApp.ctx.teachers) || teachers || [])];
      llqaCloseFinished(list, set, "CRM", false).catch(() => {});
    };
    const initialTimeout = setTimeout(runDaemon, 10000);
    const intervalId = setInterval(runDaemon, 300000); // every 5 minutes (it was every 30)
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [user]);

  if (!user)
    return React.createElement(LoginScreen, {
      students: students || [],
      customRoles: customRoles || [],
      onLogin: (u) => {
        setUser(u);
        const customAcc =
          u.role && u.role.startsWith && u.role.startsWith("custom:")
            ? buildAccessFromPermissions(u.customPermissions)
            : null;
        setPage(
          u.role === "teacher"
            ? "timetable"
            : u.role === "parent"
              ? "parent"
              : customAcc && customAcc.length > 0
                ? customAcc[0]
                : "dashboard",
        );
        if (u.role === "teacher" || u.role === "teamlead") {
          // v72: a teacher's office day (their own hours, else their shift's) is worked out on the real clock;
          // signing in after the start is late by every minute, fined at the academy's rate (it was always Rs 0
          // here). A day off is never fined; outside office hours no attendance is made. The day is written once the
          // teacher's attendance has come from the cloud (never on top of an old copy). A team lead's sign-in is
          // logged (it was saved for no one: team leads had no id), without fines.
          const isT = u.role === "teacher";
          const lead = isT ? null : (teamLeads || []).find((x) => x.name === u.name);
          const uid = isT ? String(u.id != null ? u.id : u.teacherId) : "tl:" + (lead ? lead.id : u.name);
          const t = isT ? (teachers || []).find((x) => String(x.id) === uid) : lead;
          const set = appSettings;
          const nowMs = llqaNowMs();
          const off = llqaOffice(t, set);
          const od = isT ? llqaOfficeDay(off, nowMs) : { date: llqaPkDate(nowMs), after: 0, len: 0, endMs: nowMs };
          const onLeave =
            od &&
            (leaves || []).find(
              (lv) => isT && String(lv.teacherId) === uid && lv.status === "approved" && lv.from <= od.date && lv.to >= od.date,
            );
          if (od && !onLeave) {
            const timeIn = llqaPkHm(nowMs);
            const rules = llqaFineRules(set);
            const wd = isT ? llqaWorkDay(t, od.date, set) : { ok: true };
            const lateMin = isT && wd.ok && od.after > 0 ? Math.min(od.after, od.len) : 0;
            const status = lateMin > rules.grace ? "Late" : "Present";
            const missed = isT && wd.ok && rules.autoAbsent && od.date >= LLQA_ABS_FROM && od.after >= od.len; // v76: signed in after the exit time — absent (unpaid)
            if (!(autoAttendance || []).some((a) => String(a.userId) === uid && a.date === od.date))
              setAutoAttendance([
                ...(autoAttendance || []),
                {
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  userId: uid,
                  userName: u.name,
                  role: u.role,
                  date: od.date,
                  timeIn: timeIn,
                  status: status,
                  lateMin: lateMin,
                  shiftStart: isT ? off.start : "—",
                  shiftName: isT ? (off.own ? "Own hours" : off.shift) : "",
                  location: (t && t.location) || "-",
                  method: "auto-login",
                },
              ]);
            if (isT)
              llqaWhenAttReady([llqaAttPath(od.date.slice(0, 7), llqaAttPart(uid))], () =>
                llqaAttWrite((prev) => {
                  const list = prev[uid] || [];
                  const i = list.findIndex((h) => h.date === od.date);
                  if (i < 0)
                    return {
                      ...prev,
                      [uid]: list.concat([
                        llqaWithFine(
                          missed
                            ? { date: od.date, status: "Absent", paid: false, auto: true, autoAt: new Date(nowMs).toISOString(), checkIn: "—", checkOut: "—", lateIn: timeIn, lateMin: 0, earlyMin: 0, awayMin: 0, officeStart: off.start, officeEnd: off.end, offDay: "", dayPay: llqaDayPay(t, od.date), device: "Teacher Portal", via: "portal", approved: true }
                            : { date: od.date, status, checkIn: timeIn, checkOut: "?", lateMin, earlyMin: 0, officeStart: off.start, officeEnd: off.end, offDay: wd.ok ? "" : wd.why, device: "Teacher Portal", via: "portal", approved: true },
                          set,
                          "CRM",
                          missed ? "signed in " + llqaHm12(timeIn) + ", after the exit time " + llqaHm12(off.end) + " — absent (unpaid)" : !wd.ok ? "signed in on a day off (" + wd.why + ")" : lateMin ? "signed in " + llqaHm12(timeIn) + ", " + lateMin + " min after " + llqaHm12(off.start) : "signed in on time",
                        ),
                      ]),
                    };
                  const h = list[i];
                  // signed out before the exit and back again: the day opens again
                  if (h.signOut === "manual" && !llqaIsOpen(h) && llqaNowMs() < od.endMs)
                    return { ...prev, [uid]: list.map((x, j) => (j === i ? llqaWithFine(llqaReopenDay(x), set, "CRM", "signed in again at " + llqaHm12(timeIn)) : x)) };
                  // marked by hand earlier today: from now the CRM follows them too (the hand-marked times stay)
                  if (h.device === "Admin Panel" && (h.status === "Present" || h.status === "Late") && !h.via && !llqaIsOpen(h) && llqaHm2m(h.checkOut) == null && llqaNowMs() < od.endMs)
                    return { ...prev, [uid]: list.map((x, j) => (j === i ? { ...x, checkIn: llqaHm2m(x.checkIn) != null ? x.checkIn : timeIn, checkOut: "?", via: "portal", portalIn: timeIn } : x)) };
                  return prev;
                }),
              );
          }
        }
      },
      teachers: teachers,
      appSettings: appSettings,
    });

  const logout = function () {
    // v72: a teacher's open day gets the sign-out time — before the exit that is leaving early, fined by the minute
    // unless a reason says Don't deduct. logout("auto") is the CRM signing them out after the exit (already closed).
    if (user && user.role === "teacher" && arguments[0] !== "auto") {
      const uid = String(user.id != null ? user.id : user.teacherId);
      const set = (LLQAApp.ctx && LLQAApp.ctx.appSettings) || appSettings;
      const t = (teachers || []).find((x) => String(x.id) === uid);
      const nowMs = llqaNowMs();
      llqaAttWrite((prev) => {
        const list = prev[uid] || [];
        const i = llqaOpenRecIdx(list, llqaPkDate(nowMs));
        if (i < 0) return prev;
        let rec;
        if (!list[i].officeStart) rec = { ...list[i], checkOut: llqaPkHm(nowMs), signOut: "manual" }; // a day from before v72
        else {
          const closed = llqaCloseDay(list[i], t, set, LLQAPresence.spans(list[i].date, uid, llqaFineRules(set).silenceMin), nowMs, "manual");
          rec = llqaWithFine(closed, set, user.name || "teacher", closed.earlyMin ? "signed out " + llqaHm12(closed.checkOut) + ", " + closed.earlyMin + " min before " + llqaHm12(closed.officeEnd) : "signed out");
        }
        return { ...prev, [uid]: list.map((h, j) => (j === i ? rec : h)) };
      });
    }
    setUser(null);
    setPage("dashboard");
  };
  const _isT = user && user.role === "teacher";
  const _mb = (f, u) => {
    const m = new Map((f || []).map((r) => [r.id, r]));
    (u || []).forEach((x) => m.set(x.id, x));
    return Array.from(m.values());
  };
  const scTeachers = _isT
    ? teachers.filter((t) => t.id === user.teacherId)
    : teachers;
  const scSetTeachers = _isT
    ? (a) =>
        setTeachers(_mb(teachers, typeof a === "function" ? a(scTeachers) : a))
    : setTeachers;
  const scStudents = _isT
    ? students.filter(
        (s) =>
          String(s.teacher || "").trim() === String(user.name || "").trim(),
      )
    : students;
  const scSetStudents = _isT
    ? (a) =>
        setStudents(_mb(students, typeof a === "function" ? a(scStudents) : a))
    : setStudents;
  // v65: what the automation screens and pop-ups read
  LLQAApp.set({ teacherFeedback, hrHiring, setHrHiring, /* v78: parents' feedback (the score), new hires */ apLiabilities, setApLiabilities, finance, setFinance, /* v77: bills, the finance document */ user, setPage, teachers, setTeachers, students, setStudents, salesMasterData, upsertSalesMaster, dailyProgress, setDailyProgress, arPayments, waitlist, setWaitlist, messageLog, setMessageLog, messaging, setMessaging, automation, setAutomation, leaves, setLeaves, covers, setCovers, parentRequests, setParentRequests, calendar, setCalendar, setArPayments, teamLeads, makeups, setMakeups, leads, setLeads, rewards, setRewards, salesReferrals, setSalesReferrals, pages: visibleNav.map((n) => n.id), runnerInfo, setRunnerInfo, attendanceHistory, appSettings, attNeed, clsNeed, shifts, setShifts, payrollHistory, setPayrollHistory, qcViolations, setAppSettings }); // v75: payroll (month close, reminders, My pay) // v74: shifts (handover, feedback) // v73: clsNeed (older months of class records) // v72: attNeed (older months on request) // v71: appSettings (exchange rates for the Autopilot) // v68: Dashboard "Teachers in today"
  const render = () => {
    switch (page) {
      case "dashboard":
        return React.createElement(DashMod, {
          teachers: teachers,
          setPage: setPage,
          students: students,
        });
      case "teachers":
        return React.createElement(TeachMod, {
          teachers: teachers,
          setTeachers: setTeachers,
          leaves: leaves,
          setLeaves: setLeaves,
          teacherFeedback: teacherFeedback,
          teamLeads: teamLeads,
        });
      case "timetable":
        return React.createElement(TimetableMod, {
          user: user,
          teachers: scTeachers,
          setTeachers: scSetTeachers,
          students: scStudents,
          setStudents: scSetStudents,
          dailyProgress: dailyProgress,
          setDailyProgress: setDailyProgress,
          arPayments: arPayments,
          teacherFeedback: teacherFeedback,
          setTeacherFeedback: setTeacherFeedback,
        });
      case "students":
        return React.createElement(StudentsMod, {
          teacherFeedback: teacherFeedback,
          user: user,
          teachers: scTeachers,
          setTeachers: scSetTeachers,
          students: scStudents,
          setStudents: scSetStudents,
          dailyProgress: dailyProgress,
          setDailyProgress: setDailyProgress,
        });
      case "shifting":
        return React.createElement(ShiftingMod, {
          teachers: teachers,
          setTeachers: setTeachers,
          students: students,
          setStudents: setStudents,
          teamLeads: teamLeads,
          shifts: shifts,
          setShifts: setShifts,
        });
      case "subjects":
        return React.createElement(SubjectsMod, { teachers, setTeachers });
      case "attendance":
        return React.createElement(AttendanceMod, {
          appSettings: appSettings, // v72: office times and fines
          setAppSettings: setAppSettings,
          setTeachers: setTeachers,
          user: user,
          autoAttendance: autoAttendance,
          setAutoAttendance: setAutoAttendance,
          teachers: teachers,
          history: attendanceHistory,
          setHistory: setAttendanceHistory,
        });
      case "payroll":
        return React.createElement(PayrollMod, {
          appSettings: appSettings,
          payHistory: payrollHistory, // v71
          attendanceHistory: attendanceHistory, // v72: attendance fines are deducted
          setPayHistory: setPayrollHistory, // v71
          user: user,
          teachers: teachers,
          qcViolations: qcViolations,
        });
      case "finance":
        return React.createElement(FinanceMod, null);
      case "parent":
        return React.createElement(ParentMod, {
          arPayments: arPayments,
          teacherFeedback: teacherFeedback,
          setTeacherFeedback: setTeacherFeedback,
          user: user,
          students: students,
          setStudents: setStudents,
          teachers: teachers,
          dailyProgress: dailyProgress,
          setDailyProgress: setDailyProgress,
          parentNotes: parentNotes,
          setParentNotes: setParentNotes,
          appSettings: appSettings,
        });
      case "hr":
        return React.createElement(HRMod, {
          user: user,
          teachers: teachers,
          hrInterviews: hrInterviews,
          setHrInterviews: setHrInterviews,
          hrHiring: hrHiring,
          setHrHiring: setHrHiring,
        });
      case "training":
        return React.createElement(TrainingMod, {
          teachers: teachers,
          trainingPrograms: trainingPrograms,
          setTrainingPrograms: setTrainingPrograms,
        });
      case "operations":
        return React.createElement(OperationsMod, {
          setPage: setPage,
          teachers: teachers,
          students: students,
          shifts: shifts,
        });
      case "qc":
        return React.createElement(QCMod, {
          teachers: teachers,
          qcViolations: qcViolations,
          setQcViolations: setQcViolations,
        });
      case "ar":
        return React.createElement(AccountsRMod, {
          appSettings: appSettings, // v71: exchange rates
          students: students,
          arPayments: arPayments,
          teacherFeedback: teacherFeedback,
          setTeacherFeedback: setTeacherFeedback,
          setArPayments: setArPayments,
        });
      case "ap":
        return React.createElement(AccountsPMod, {
          appSettings: appSettings, // v71: exchange rates
          apLiabilities: apLiabilities,
          setApLiabilities: setApLiabilities,
        });
      case "sales":
        return React.createElement(SalesMod, {
          students: students,
          setStudents: setStudents,
          salesMasterData: salesMasterData,
          upsertSalesMaster: upsertSalesMaster,
          teachers: teachers,
          setTeachers: setTeachers,
          salesReferrals: salesReferrals,
          setSalesReferrals: setSalesReferrals,
        });
      case "procurement":
        return React.createElement(ProcurementMod, {
          procInventory: procInventory,
          setProcInventory: setProcInventory,
          procPurchases: procPurchases,
          setProcPurchases: setProcPurchases,
        });
      case "reports":
        return React.createElement(ReportsMod, {
          appSettings: appSettings, // v71: exchange rates
          students: students,
          teachers: teachers,
          arPayments: arPayments,
          teacherFeedback: teacherFeedback,
          setTeacherFeedback: setTeacherFeedback,
          apLiabilities: apLiabilities,
          salesReferrals: salesReferrals,
          leaves: leaves,
          qcViolations: qcViolations,
          trainingPrograms: trainingPrograms,
        });
      case "settings":
        return React.createElement(SettingsMod, {
          access: access,
          setAccess: setAccess,
          teamLeads: teamLeads,
          setTeamLeads: setTeamLeads,
          appSettings: appSettings,
          setAppSettings: setAppSettings,
          theme: theme,
          setTheme: setTheme,
          teachers: teachers,
          setTeachers: setTeachers,
          shifts: shifts,
          setShifts: setShifts,
          customRoles: customRoles,
          setCustomRoles: setCustomRoles,
        });
      default:
        return React.createElement(Placeholder, {
          title: NAV.find((n) => n.id === page)?.label || "Module",
          icon: NAV.find((n) => n.id === page)?.icon || Settings,
        });
    }
  };
  const roleBadgeColor =
    user.role === "superadmin"
      ? "purple"
      : user.role === "teamlead"
        ? "accent"
        : user.role && user.role.indexOf("custom:") === 0
          ? "warn"
          : "success";
  const userInitial = user.name.charAt(0).toUpperCase();
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        minHeight: "calc(100vh / var(--llqaZoom, 1))", // v70: fills the window at every Density
        background: "transparent", // v69: the page background (with its soft glow) shows through
        fontFamily: "var(--font)",
        color: c.text,
      },
    },
    React.createElement(
      "div",
      {
        // v69: "Always dark" sidebar — its own theme scope, colours tuned for dark
        ...(llqaSideDark ? { "data-theme": "dark", "data-backdrop": llqaBack } : {}),
        style: {
          ...(llqaSideDark ? llqaVarStyle(llqaSideVars) : {}),
          width: open ? 210 : 54,
          // v70: always the full window height, and it stays in view while the page scrolls
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "calc(100vh / var(--llqaZoom, 1))",
          background: llqaSideDark ? "linear-gradient(" + c.bgDeep + ", " + c.bgDeep + "), " + c.bg : c.bgDeep,
          borderRight: "1px solid " + c.border,
          display: "flex",
          flexDirection: "column",
          transition: "width .2s",
          overflowX: "hidden",
          overflowY: "auto",
          flexShrink: 0,
        },
      },
      React.createElement(
        "div",
        {
          style: {
            padding: open ? "14px 14px 10px" : "14px 8px 10px",
            borderBottom: "1px solid " + c.border,
            display: "flex",
            alignItems: "center",
            gap: 9,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              width: 30,
              height: 30,
              borderRadius: 8,
              background:
                "linear-gradient(135deg," + c.accentFill + "," + c.purpleFill + ")", // v68
              boxShadow: "0 4px 14px -4px " + llqaAlpha(c.accentFill, "99"),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            },
          },
          appSettings && appSettings.logoDataUrl
            ? React.createElement(
                "div",
                {
                  style: {
                    width: "100%",
                    height: "100%",
                    borderRadius: 6,
                    background: appSettings.logoBg || "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  },
                },
                React.createElement("img", {
                  src: appSettings.logoDataUrl,
                  alt: "Logo",
                  style: {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: appSettings.logoFit === "stretch" ? "100%" : "auto",
                    height: appSettings.logoFit === "stretch" ? "100%" : "auto",
                    objectFit:
                      appSettings.logoFit === "cover"
                        ? "cover"
                        : appSettings.logoFit === "stretch"
                          ? "fill"
                          : "contain",
                  },
                }),
              )
            : React.createElement(BookOpen, {
                size: 14,
                color: "#fff",
              }),
        ),
        open &&
          React.createElement(
            "div",
            null,
            React.createElement(
              "h3",
              {
                style: {
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.text,
                },
              },
              "LLQA CRM",
            ),
            React.createElement(
              "p",
              {
                style: {
                  margin: 0,
                  fontSize: 9,
                  color: c.textSec,
                },
              },
              user.role === "superadmin"
                ? "Admin Portal"
                : user.role === "teamlead"
                  ? "Team Lead Portal"
                  : user.role === "parent"
                    ? "Parent Portal"
                    : user.role && user.role.indexOf("custom:") === 0
                      ? (user.customRoleName || "Custom Role") + " Portal"
                      : "Teacher Portal",
            ),
          ),
      ),
      React.createElement(
        "nav",
        {
          style: {
            flex: 1,
            padding: "8px 5px",
            overflowY: "auto",
          },
        },
        visibleNav.length === 0 &&
          open &&
          React.createElement(
            "div",
            {
              style: {
                padding: "20px 12px",
                textAlign: "center",
                color: c.textMuted,
                fontSize: 11,
              },
            },
            "No tabs allowed.",
            React.createElement("br", null),
            "Contact Super Admin.",
          ),
        visibleNav
          .filter(
            (n) => !n.parent || !visibleNav.some((p) => p.id === n.parent),
          )
          .map((n) => {
            if (n.isGroup && visibleNav.some((x) => x.parent === n.id)) {
              const kids = visibleNav.filter((x) => x.parent === n.id);
              const exp = expandedGroups[n.id];
              const childActive = kids.some((x) => x.id === page);
              const selfActive = page === n.id;
              return React.createElement(
                React.Fragment,
                {
                  key: n.id,
                },
                React.createElement(
                  "button",
                  {
                    onClick: () => {
                      if (open) {
                        setPage(n.id);
                        setExpandedGroups({
                          ...expandedGroups,
                          [n.id]: true,
                        });
                      } else {
                        setPage(n.id);
                      }
                    },
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      padding: open ? "7px 11px" : "7px 9px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginBottom: 1,
                      background: selfActive
                        ? c.accentFill
                        : childActive
                          ? llqaAlpha(c.accent, "1f")
                          : "transparent",
                      color: selfActive
                        ? c.accentText
                        : childActive
                          ? c.accent
                          : c.textSec,
                      fontSize: 11,
                      fontWeight: selfActive || childActive ? 600 : 400,
                      textAlign: "left",
                      justifyContent: open ? "flex-start" : "center",
                    },
                  },
                  React.createElement(n.icon, {
                    size: 15,
                  }),
                  open &&
                    React.createElement(
                      "span",
                      {
                        style: {
                          flex: 1,
                        },
                      },
                      n.label,
                    ),
                  open &&
                    React.createElement(
                      "span",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          setExpandedGroups({
                            ...expandedGroups,
                            [n.id]: !exp,
                          });
                        },
                        style: {
                          display: "flex",
                          alignItems: "center",
                          padding: 2,
                          borderRadius: 3,
                          transform: exp ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 0.18s ease",
                          color: selfActive ? c.accentText : c.textSec,
                        },
                      },
                      React.createElement(ChevronDown, {
                        size: 12,
                      }),
                    ),
                ),
                open &&
                  exp &&
                  kids.map((ch) =>
                    React.createElement(
                      "button",
                      {
                        key: ch.id,
                        onClick: () => setPage(ch.id),
                        onMouseEnter: (e) => {
                          if (page !== ch.id) {
                            e.currentTarget.style.background = c.bgDeep;
                          }
                        },
                        onMouseLeave: (e) => {
                          if (page !== ch.id) {
                            e.currentTarget.style.background = "transparent";
                          }
                        },
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          width: "100%",
                          padding: "7px 11px 7px 32px",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          marginBottom: 1,
                          background: page === ch.id ? c.gradientPrimary : "transparent", // v68
                          boxShadow: page === ch.id ? c.glowPrimary : "none",
                          color: page === ch.id ? c.accentText : c.text,
                          fontSize: 11,
                          fontWeight: page === ch.id ? 600 : 500,
                          textAlign: "left",
                          position: "relative",
                          transition: "background 0.15s ease, color 0.15s ease",
                        },
                      },
                      React.createElement("span", {
                        style: {
                          position: "absolute",
                          left: 19,
                          top: 4,
                          bottom: 4,
                          width: 2,
                          background:
                            page === ch.id
                              ? llqaAlpha(c.accentText, "99")
                              : llqaAlpha(c.accent, "88"),
                          borderRadius: 1,
                        },
                      }),
                      React.createElement(ch.icon, {
                        size: 14,
                      }),
                      ch.label,
                    ),
                  ),
              );
            }
            return React.createElement(
              "button",
              {
                key: n.id,
                onClick: () => setPage(n.id),
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  padding: open ? "7px 11px" : "7px 9px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  marginBottom: 1,
                  background: page === n.id ? c.gradientPrimary : "transparent", // v68
                  boxShadow: page === n.id ? c.glowPrimary : "none",
                  color: page === n.id ? c.accentText : c.textSec,
                  fontSize: 11,
                  fontWeight: page === n.id ? 600 : 400,
                  textAlign: "left",
                  justifyContent: open ? "flex-start" : "center",
                },
              },
              React.createElement(n.icon, {
                size: 15,
              }),
              open && n.label,
            );
          }),
      ),
      React.createElement(
        "div",
        {
          style: {
            padding: "8px 5px",
            borderTop: "1px solid " + c.border,
          },
        },
        React.createElement(
          "button",
          {
            onClick: logout,
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "7px 11px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              background: "transparent",
              color: c.danger,
              fontSize: 10,
              justifyContent: open ? "flex-start" : "center",
              marginBottom: 2,
            },
            title: "Switch Role / Logout",
          },
          React.createElement(X, {
            size: 13,
          }),
          open && "Switch Role",
        ),
        React.createElement(
          "button",
          {
            onClick: () => setOpen(!open),
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "7px 11px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              background: "transparent",
              color: c.textSec,
              fontSize: 10,
              justifyContent: open ? "flex-start" : "center",
            },
          },
          open
            ? React.createElement(ChevronLeft, {
                size: 13,
              })
            : React.createElement(ChevronRight, {
                size: 13,
              }),
          open && "Collapse",
        ),
      ),
    ),
    React.createElement(
      "div",
      {
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        },
      },
      React.createElement(
        "header",
        {
          style: {
            height: 48,
            padding: "0 18px",
            borderBottom: "1px solid " + c.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: c.bgDeep,
            flexShrink: 0,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
            },
          },
          React.createElement(
            "button",
            {
              onClick: () => setOpen(!open),
              style: {
                background: "none",
                border: "none",
                cursor: "pointer",
                color: c.textSec,
                display: "flex",
              },
            },
            React.createElement(Menu, {
              size: 17,
            }),
          ),
          React.createElement(
            "h3",
            {
              style: {
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: c.text,
              },
            },
            NAV.find((n) => n.id === page)?.label || "Portal",
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
            },
          },
          React.createElement(ConnectionBadge, { user: user }),
          React.createElement(
            "span",
            {
              style: {
                color: c.textSec,
                fontSize: 10,
                display: user.role === "teacher" ? "block" : "none",
              },
            },
            user.teacherCode,
          ),
          React.createElement(Badge, {
            text: user.display,
            color: roleBadgeColor,
          }),
          React.createElement(
            "button",
            {
              onClick: logout,
              title: "Switch Role",
              style: {
                background: c.dangerBg,
                border: "1px solid " + llqaAlpha(c.danger, "44"),
                borderRadius: 6,
                cursor: "pointer",
                padding: "4px 10px",
                color: c.danger,
                fontSize: 10,
                fontWeight: 600,
              },
            },
            "Logout",
          ),
          React.createElement(
            "div",
            {
              onClick: () => setTheme(themeUsed === "dark" ? "light" : "dark"), // v68
              title: "Switch Theme",
              style: {
                width: 48,
                height: 24,
                background:
                  themeUsed === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.08)",
                border: "1px solid " + c.border,
                borderRadius: 12,
                cursor: "pointer",
                position: "relative",
                transition: "background 0.3s",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                flexShrink: 0,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  width: 20,
                  height: 20,
                  background: themeUsed === "dark" ? "#18181b" : "#ffffff",
                  borderRadius: 10,
                  position: "absolute",
                  top: 1,
                  left: themeUsed === "dark" ? 1 : 25,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                },
              },
              // v69: line icons (were emoji)
              React.createElement(llqaIcon(themeUsed === "dark" ? "moon" : "sun"), { size: 12, color: themeUsed === "dark" ? "#c7d2fe" : "#d97706", strokeWidth: 2.25, "aria-hidden": true }),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                width: 28,
                height: 28,
                borderRadius: 7,
                background:
                  "linear-gradient(135deg," + c.accentFill + "," + c.purpleFill + ")",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: c.accentText,
              },
            },
            userInitial,
          ),
        ),
      ),
      React.createElement(
        "main",
        {
          style: {
            flex: 1,
            padding: 18,
            overflowY: "auto",
          },
        },
        React.createElement(ErrorBoundary, { key: page }, render()),
        React.createElement(LLQAHost, null),
      ),
    ),
  );
}
