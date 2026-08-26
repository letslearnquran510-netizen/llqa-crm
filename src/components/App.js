function App() {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useFirestoreDoc("settings/preferences", DEFAULT_SETTINGS);
  const [theme, setThemeLocal] = useState(appSettings && appSettings.theme || "dark");
  const setTheme = v => {
    const newV = typeof v === "function" ? v(theme) : v;
    setThemeLocal(newV);
    setAppSettings({
      ...(appSettings || DEFAULT_SETTINGS),
      theme: newV
    });
  };
  React.useEffect(() => {
    if (appSettings && appSettings.theme && appSettings.theme !== theme) setThemeLocal(appSettings.theme);
  }, [appSettings && appSettings.theme]);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  React.useEffect(() => {
    const ac = appSettings && appSettings.accentColor || "#4a7aff";
    const hex = ac.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const accentText = lum > 0.65 ? "#0b0d0e" : "#ffffff";
    const accentBorder = lum > 0.85 ? "#9ca3af" : ac;
    const accentSafe = lum > 0.92 ? "#e5e7eb" : ac;
    document.documentElement.style.setProperty("--accent", accentSafe);
    document.documentElement.style.setProperty("--accentRaw", ac);
    document.documentElement.style.setProperty("--accentBg", ac + "22");
    document.documentElement.style.setProperty("--accentText", accentText);
    document.documentElement.style.setProperty("--accentBorder", accentBorder);
  }, [appSettings && appSettings.accentColor]);
  React.useEffect(() => {
    const tm = appSettings && appSettings.toneMode || "full";
    const root = document.documentElement;
    const themeNow = root.getAttribute("data-theme") || "dark";
    const isLight = themeNow === "light";
    const neutral = isLight ? "#64748b" : "#94a3b8";
    const neutralBg = isLight ? "#64748b22" : "#94a3b822";
    const origs = {
      purple: isLight ? "#7c3aed" : "#a78bfa",
      purpleBg: isLight ? "#7c3aed22" : "#a78bfa22",
      cyan: isLight ? "#0891b2" : "#22d3ee",
      cyanBg: isLight ? "#0891b222" : "#22d3ee22",
      warn: isLight ? "#d97706" : "#fbbf24",
      warnBg: isLight ? "#d9770622" : "#fbbf2422"
    };
    const accentTextNow = getComputedStyle(root).getPropertyValue("--accentText").trim() || "#ffffff";
    if (tm === "minimal") {
      root.style.setProperty("--purple", neutral);
      root.style.setProperty("--purpleBg", neutralBg);
      root.style.setProperty("--cyan", neutral);
      root.style.setProperty("--cyanBg", neutralBg);
      root.style.setProperty("--warn", neutral);
      root.style.setProperty("--warnBg", neutralBg);
      root.style.setProperty("--purpleText", "#ffffff");
      root.style.setProperty("--cyanText", "#ffffff");
      root.style.setProperty("--warnText", "#ffffff");
    } else if (tm === "compact") {
      const acSafe = getComputedStyle(root).getPropertyValue("--accent").trim() || "#4a7aff";
      const acBorder = getComputedStyle(root).getPropertyValue("--accentBorder").trim() || acSafe;
      root.style.setProperty("--purple", acBorder);
      root.style.setProperty("--purpleBg", acSafe + "22");
      root.style.setProperty("--cyan", acBorder);
      root.style.setProperty("--cyanBg", acSafe + "22");
      root.style.setProperty("--warn", origs.warn);
      root.style.setProperty("--warnBg", origs.warnBg);
      root.style.setProperty("--purpleText", accentTextNow);
      root.style.setProperty("--cyanText", accentTextNow);
      root.style.setProperty("--warnText", "#ffffff");
    } else {
      root.style.setProperty("--purple", origs.purple);
      root.style.setProperty("--purpleBg", origs.purpleBg);
      root.style.setProperty("--cyan", origs.cyan);
      root.style.setProperty("--cyanBg", origs.cyanBg);
      root.style.setProperty("--warn", origs.warn);
      root.style.setProperty("--warnBg", origs.warnBg);
      root.style.setProperty("--purpleText", "#ffffff");
      root.style.setProperty("--cyanText", "#ffffff");
      root.style.setProperty("--warnText", "#ffffff");
    }
  }, [appSettings && appSettings.toneMode, appSettings && appSettings.theme, appSettings && appSettings.accentColor]);
  React.useEffect(() => {
    const d = appSettings && appSettings.density || "Normal";
    const fs = appSettings && appSettings.fontSize || "Medium";
    const fMap = {
      Small: "13px",
      Medium: "14px",
      Large: "16px"
    };
    const dMap = {
      Compact: "0.92",
      Normal: "1",
      Comfortable: "1.10"
    };
    document.body.style.fontSize = fMap[fs] || "14px";
    document.body.style.zoom = dMap[d] || "1";
  }, [appSettings && appSettings.density, appSettings && appSettings.fontSize]);
  const [page, setPage] = useState("dashboard");
  const [open, setOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [teachers, setTeachers] = useFirestoreCollection("teachers", initTeachers);
  const [students, setStudents] = useFirestoreCollection("students", initStudents);
  const [shifts, setShifts] = useFirestoreCollection("shifts", initShifts);
  const [customRoles, setCustomRoles] = useFirestoreCollection("customRoles", []);
  const [dailyProgress, setDailyProgress] = useFirestoreCollection("dailyProgress", []);
  const [parentNotes, setParentNotes] = useFirestoreCollection("parentNotes", []);
  const [access, setAccess] = useFirestoreDoc("settings/portalAccess", DEFAULT_ACCESS);
  const [leaves, setLeaves] = useFirestoreCollection("leaves", [{
    id: 1,
    teacherId: 5,
    teacherName: "Qari Faizan Khan",
    type: "Ramadan Leave",
    from: "2026-03-01",
    to: "2026-03-30",
    days: 30,
    status: "approved",
    reason: "Ramadan"
  }, {
    id: 2,
    teacherId: 16,
    teacherName: "Hafiz Abdullah ATD",
    type: "Sick Leave",
    from: "2026-04-10",
    to: "2026-04-12",
    days: 3,
    status: "approved",
    reason: "Fever"
  }, {
    id: 3,
    teacherId: 34,
    teacherName: "Hafiza Saqeela Satti",
    type: "Casual Leave",
    from: "2026-04-14",
    to: "2026-04-14",
    days: 1,
    status: "pending",
    reason: "Personal"
  }, {
    id: 4,
    teacherId: 30,
    teacherName: "Hafiza Momina Akbar",
    type: "Annual Leave",
    from: "2026-05-01",
    to: "2026-05-07",
    days: 7,
    status: "pending",
    reason: "Family visit"
  }]);
  const [teamLeads, setTeamLeads] = useFirestoreCollection("teamLeads", DEFAULT_TEAM_LEADS);
  const [autoAttendance, setAutoAttendance] = useFirestoreCollection("autoAttendance", []);
  const [salesMasterData, setSalesMasterData] = useFirestoreCollection("salesMasterData", []);
  const [salesReferrals, setSalesReferrals] = useFirestoreCollection("salesReferrals", []);
  const [arPayments, setArPayments] = useFirestoreCollection("arPayments", []);
  const [apLiabilities, setApLiabilities] = useFirestoreCollection("apLiabilities", []);
  const [qcViolations, setQcViolations] = useFirestoreCollection("qcViolations", []);
  const [trainingPrograms, setTrainingPrograms] = useFirestoreCollection("trainingPrograms", []);
  const [procInventory, setProcInventory] = useFirestoreCollection("procInventory", []);
  const [procPurchases, setProcPurchases] = useFirestoreCollection("procPurchases", []);
  const upsertSalesMaster = records => {
    if (!records || records.length === 0) return;
    setSalesMasterData(prev => {
      const byId = {};
      (prev || []).forEach(r => {
        byId[String(r.id)] = r;
      });
      records.forEach(r => {
        byId[String(r.id)] = {
          ...(byId[String(r.id)] || {}),
          ...r
        };
      });
      return Object.values(byId);
    });
  };
  const expandAccess = ids => {
    const s = new Set(ids || []);
    (ids || []).forEach(id => {
      const nd = NAV.find(n => n.id === id);
      if (nd && nd.isGroup) NAV.forEach(x => {
        if (x.parent === id) s.add(x.id);
      });
    });
    return Array.from(s);
  };
  const visibleNav = user ? user.role === "superadmin" ? NAV : user.role === "parent" ? NAV.filter(n => n.id === "parent") : user.role && user.role.startsWith("custom:") ? NAV.filter(n => expandAccess(buildAccessFromPermissions(user.customPermissions)).includes(n.id)) : NAV.filter(n => expandAccess(access[user.role] || []).includes(n.id)) : [];
  useEffect(() => {
    const p = NAV.find(n => n.id === page);
    if (p && p.parent) {
      setExpandedGroups(prev => prev[p.parent] ? prev : {
        ...prev,
        [p.parent]: true
      });
    }
  }, [page]);
  useEffect(() => {
    if (!students) return;
    const CORE = ["name", "age", "parent", "course", "teacher", "code", "country", "state", "time", "dor", "fee", "status", "juz", "surah", "page", "qaida", "lastLesson", "lastDate", "attendance", "totalClasses", "attended", "notes"];
    const norm = o => JSON.stringify(CORE.map(k => o[k] == null ? null : o[k]));
    const masterById = {};
    (salesMasterData || []).forEach(m => {
      masterById[String(m.id)] = m;
    });
    const sIds = new Set(students.map(s => String(s.id)));
    const toWrite = [];
    students.forEach(s => {
      const ex = masterById[String(s.id)];
      if (!ex) {
        toWrite.push({
          ...s,
          _inSystem: true
        });
      } else if (norm(ex) !== norm(s) || ex._inSystem === false) {
        toWrite.push({
          ...s,
          _inSystem: true
        });
      }
    });
    (salesMasterData || []).forEach(m => {
      if (!sIds.has(String(m.id)) && m._inSystem !== false) {
        toWrite.push({
          ...m,
          _inSystem: false,
          _removedDate: todayPK()
        });
      }
    });
    if (toWrite.length === 0) return;
    upsertSalesMaster(toWrite);
  }, [students, salesMasterData]);
  useEffect(() => {
    if (!students || !students.length) return;
    const wr = students.filter(s => s.referredBy && String(s.referredBy).trim());
    if (!wr.length) return;
    const ex = new Set((salesReferrals || []).map(r => String(r.studentId)));
    const add = wr.filter(s => !ex.has(String(s.id)));
    if (!add.length) return;
    setSalesReferrals([...(salesReferrals || []), ...add.map((s, i) => ({
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
      _auto: true
    }))]);
  }, [students, salesReferrals]);
  useEffect(() => {
    if (user && visibleNav.length > 0 && !visibleNav.find(n => n.id === page)) {
      setPage(visibleNav[0].id);
    }
  }, [user, access, page]);
  if (!user) return React.createElement(LoginScreen, {
    students: students || [],
    customRoles: customRoles || [],
    onLogin: u => {
      setUser(u);
      const customAcc = u.role && u.role.startsWith && u.role.startsWith("custom:") ? buildAccessFromPermissions(u.customPermissions) : null;
      setPage(u.role === "teacher" ? "timetable" : u.role === "parent" ? "parent" : customAcc && customAcc.length > 0 ? customAcc[0] : "dashboard");
      if (u.role === "teacher" || u.role === "teamlead") {
        const today = todayPK();
        const exists = (autoAttendance || []).find(a => a.userId === u.id && a.date === today);
        if (!exists) {
          const onLeave = (leaves || []).find(lv => lv.teacherId === u.id && lv.status === "approved" && lv.from <= today && lv.to >= today);
          if (!onLeave) {
            const now = new Date();
            const pkNow = new Date(now.toLocaleString("en-US", {
              timeZone: "Asia/Karachi"
            }));
            const hh = pkNow.getHours();
            const mm = pkNow.getMinutes();
            const timeIn = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
            const t = teachers.find(tt => tt.id === u.id);
            let shiftStartH = 0,
              shiftStartM = 0,
              shiftName = "";
            try {
              const shifts = Object.keys(TT_DATA || {});
              for (const sn of shifts) {
                const sd = TT_DATA[sn];
                if (sd && sd.teachers && sd.teachers.find(tt => tt.name === u.name || tt.code === (t && t.code))) {
                  shiftName = sn;
                  const firstSlot = sd.slots && sd.slots[0];
                  if (firstSlot) {
                    const parts = firstSlot.split(":");
                    shiftStartH = parseInt(parts[0], 10) || 0;
                    shiftStartM = parseInt(parts[1], 10) || 0;
                  }
                  break;
                }
              }
            } catch (_) {}
            if (!shiftName) {
              if (t && t.location === "IBA") {
                shiftStartH = 0;
              } else if (t && t.location === "WFH") {
                shiftStartH = 16;
              }
            }
            const lateThr = appSettings && appSettings.lateThreshold || 10;
            const startMin = shiftStartH * 60 + shiftStartM;
            const nowMin = hh * 60 + mm;
            const diff = nowMin - startMin;
            let status = "Present";
            let lateMin = 0;
            if (diff > lateThr) {
              status = "Late";
              lateMin = diff;
            }
            const rec = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              userId: u.id,
              userName: u.name,
              role: u.role,
              date: today,
              timeIn: timeIn,
              status: status,
              lateMin: lateMin,
              shiftStart: String(shiftStartH).padStart(2, "0") + ":" + String(shiftStartM).padStart(2, "0"),
              shiftName: shiftName || "Default",
              location: t && t.location || "-",
              method: "auto-login"
            };
            setAutoAttendance([...(autoAttendance || []), rec]);
          }
        }
      }
    },
    teachers: teachers,
    appSettings: appSettings
  });
  const logout = () => {
    setUser(null);
    setPage("dashboard");
  };
  const _isT = user && user.role === "teacher";
  const _mb = (f, u) => {
    const m = new Map((f || []).map(r => [r.id, r]));
    (u || []).forEach(x => m.set(x.id, x));
    return Array.from(m.values());
  };
  const scTeachers = _isT ? teachers.filter(t => t.id === user.teacherId) : teachers;
  const scSetTeachers = _isT ? a => setTeachers(_mb(teachers, typeof a === "function" ? a(scTeachers) : a)) : setTeachers;
  const scStudents = _isT ? students.filter(s => String(s.teacher || "").trim() === String(user.name || "").trim()) : students;
  const scSetStudents = _isT ? a => setStudents(_mb(students, typeof a === "function" ? a(scStudents) : a)) : setStudents;
  const render = () => {
    switch (page) {
      case "dashboard":
        return React.createElement(DashMod, {
          teachers: teachers,
          setPage: setPage,
          students: students
        });
      case "teachers":
        return React.createElement(TeachMod, {
          teachers: teachers,
          setTeachers: setTeachers,
          leaves: leaves,
          setLeaves: setLeaves,
          teamLeads: teamLeads
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
          arPayments: arPayments
        });
      case "students":
        return React.createElement(StudentsMod, {
          user: user,
          teachers: scTeachers,
          setTeachers: scSetTeachers,
          students: scStudents,
          setStudents: scSetStudents,
          dailyProgress: dailyProgress,
          setDailyProgress: setDailyProgress
        });
      case "shifting":
        return React.createElement(ShiftingMod, {
          teachers: teachers,
          setTeachers: setTeachers,
          students: students,
          setStudents: setStudents,
          teamLeads: teamLeads,
          shifts: shifts,
          setShifts: setShifts
        });
      case "subjects":
        return React.createElement(SubjectsMod, null);
      case "attendance":
        return React.createElement(AttendanceMod, {
          user: user,
          autoAttendance: autoAttendance,
          setAutoAttendance: setAutoAttendance
        });
      case "payroll":
        return React.createElement(PayrollMod, { appSettings: appSettings,
          user: user,
          teachers: teachers,
          qcViolations: qcViolations
        });
      case "finance":
        return React.createElement(FinanceMod, null);
      case "parent":
        return React.createElement(ParentMod, { arPayments: arPayments,
          user: user,
          students: students,
          setStudents: setStudents,
          teachers: teachers,
          dailyProgress: dailyProgress,
          setDailyProgress: setDailyProgress,
          parentNotes: parentNotes,
          setParentNotes: setParentNotes
        });
      case "hr":
        return React.createElement(HRMod, null);
      case "training":
        return React.createElement(TrainingMod, {
          teachers: teachers,
          trainingPrograms: trainingPrograms,
          setTrainingPrograms: setTrainingPrograms
        });
      case "operations":
        return React.createElement(OperationsMod, {
          setPage: setPage,
          teachers: teachers,
          students: students,
          shifts: shifts
        });
      case "qc":
        return React.createElement(QCMod, {
          teachers: teachers,
          qcViolations: qcViolations,
          setQcViolations: setQcViolations
        });
      case "ar":
        return React.createElement(AccountsRMod, {
          students: students,
          arPayments: arPayments,
          setArPayments: setArPayments
        });
      case "ap":
        return React.createElement(AccountsPMod, {
          apLiabilities: apLiabilities,
          setApLiabilities: setApLiabilities
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
          setSalesReferrals: setSalesReferrals
        });
      case "procurement":
        return React.createElement(ProcurementMod, {
          procInventory: procInventory,
          setProcInventory: setProcInventory,
          procPurchases: procPurchases,
          setProcPurchases: setProcPurchases
        });
      case "reports":
        return React.createElement(ReportsMod, {
          students: students,
          teachers: teachers,
          arPayments: arPayments,
          apLiabilities: apLiabilities,
          salesReferrals: salesReferrals,
          leaves: leaves,
          qcViolations: qcViolations,
          trainingPrograms: trainingPrograms
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
          setCustomRoles: setCustomRoles
        });
      default:
        return React.createElement(Placeholder, {
          title: NAV.find(n => n.id === page)?.label || "Module",
          icon: NAV.find(n => n.id === page)?.icon || Settings
        });
    }
  };
  const roleBadgeColor = user.role === "superadmin" ? "purple" : user.role === "teamlead" ? "accent" : user.role && user.role.indexOf("custom:") === 0 ? "warn" : "success";
  const userInitial = user.name.charAt(0).toUpperCase();
  return React.createElement("div", {
    style: {
      display: "flex",
      minHeight: "100vh",
      background: c.bg,
      fontFamily: "'Segoe UI',sans-serif",
      color: c.text
    }
  }, React.createElement("div", {
    style: {
      width: open ? 210 : 54,
      minHeight: "100vh",
      background: c.bgDeep,
      borderRight: "1px solid " + c.border,
      display: "flex",
      flexDirection: "column",
      transition: "width .2s",
      overflow: "hidden",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      padding: open ? "14px 14px 10px" : "14px 8px 10px",
      borderBottom: "1px solid " + c.border,
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, appSettings && appSettings.logoDataUrl ? React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      borderRadius: 6,
      background: appSettings.logoBg || "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, React.createElement("img", {
    src: appSettings.logoDataUrl,
    alt: "Logo",
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      width: appSettings.logoFit === "stretch" ? "100%" : "auto",
      height: appSettings.logoFit === "stretch" ? "100%" : "auto",
      objectFit: appSettings.logoFit === "cover" ? "cover" : appSettings.logoFit === "stretch" ? "fill" : "contain"
    }
  })) : React.createElement(BookOpen, {
    size: 14,
    color: "#fff"
  })), open && React.createElement("div", null, React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 12,
      fontWeight: 700,
      color: c.text
    }
  }, "LLQA CRM"), React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 9,
      color: c.textSec
    }
  }, user.role === "superadmin" ? "Admin Portal" : user.role === "teamlead" ? "Team Lead Portal" : user.role === "parent" ? "Parent Portal" : user.role && user.role.indexOf("custom:") === 0 ? (user.customRoleName || "Custom Role") + " Portal" : "Teacher Portal"))), React.createElement("nav", {
    style: {
      flex: 1,
      padding: "8px 5px",
      overflowY: "auto"
    }
  }, visibleNav.length === 0 && open && React.createElement("div", {
    style: {
      padding: "20px 12px",
      textAlign: "center",
      color: c.textMuted,
      fontSize: 11
    }
  }, "No tabs allowed.", React.createElement("br", null), "Contact Super Admin."), visibleNav.filter(n => !n.parent || !visibleNav.some(p => p.id === n.parent)).map(n => {
    if (n.isGroup && visibleNav.some(x => x.parent === n.id)) {
      const kids = visibleNav.filter(x => x.parent === n.id);
      const exp = expandedGroups[n.id];
      const childActive = kids.some(x => x.id === page);
      const selfActive = page === n.id;
      return React.createElement(React.Fragment, {
        key: n.id
      }, React.createElement("button", {
        onClick: () => {
          if (open) {
            setPage(n.id);
            setExpandedGroups({
              ...expandedGroups,
              [n.id]: true
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
          background: selfActive ? c.accent : childActive ? c.accent + "1f" : "transparent",
          color: selfActive ? c.accentText : childActive ? c.accent : c.textSec,
          fontSize: 11,
          fontWeight: selfActive || childActive ? 600 : 400,
          textAlign: "left",
          justifyContent: open ? "flex-start" : "center"
        }
      }, React.createElement(n.icon, {
        size: 15
      }), open && React.createElement("span", {
        style: {
          flex: 1
        }
      }, n.label), open && React.createElement("span", {
        onClick: e => {
          e.stopPropagation();
          setExpandedGroups({
            ...expandedGroups,
            [n.id]: !exp
          });
        },
        style: {
          display: "flex",
          alignItems: "center",
          padding: 2,
          borderRadius: 3,
          transform: exp ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.18s ease",
          color: selfActive ? c.accentText : c.textSec
        }
      }, React.createElement(ChevronDown, {
        size: 12
      }))), open && exp && kids.map(ch => React.createElement("button", {
        key: ch.id,
        onClick: () => setPage(ch.id),
        onMouseEnter: e => {
          if (page !== ch.id) {
            e.currentTarget.style.background = c.bgDeep;
          }
        },
        onMouseLeave: e => {
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
          background: page === ch.id ? c.accent : "transparent",
          color: page === ch.id ? c.accentText : c.text,
          fontSize: 11,
          fontWeight: page === ch.id ? 600 : 500,
          textAlign: "left",
          position: "relative",
          transition: "background 0.15s ease, color 0.15s ease"
        }
      }, React.createElement("span", {
        style: {
          position: "absolute",
          left: 19,
          top: 4,
          bottom: 4,
          width: 2,
          background: page === ch.id ? c.accentText + "99" : c.accent + "88",
          borderRadius: 1
        }
      }), React.createElement(ch.icon, {
        size: 14
      }), ch.label)));
    }
    return React.createElement("button", {
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
        background: page === n.id ? c.accent : "transparent",
        color: page === n.id ? c.accentText : c.textSec,
        fontSize: 11,
        fontWeight: page === n.id ? 600 : 400,
        textAlign: "left",
        justifyContent: open ? "flex-start" : "center"
      }
    }, React.createElement(n.icon, {
      size: 15
    }), open && n.label);
  })), React.createElement("div", {
    style: {
      padding: "8px 5px",
      borderTop: "1px solid " + c.border
    }
  }, React.createElement("button", {
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
      marginBottom: 2
    },
    title: "Switch Role / Logout"
  }, React.createElement(X, {
    size: 13
  }), open && "Switch Role"), React.createElement("button", {
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
      justifyContent: open ? "flex-start" : "center"
    }
  }, open ? React.createElement(ChevronLeft, {
    size: 13
  }) : React.createElement(ChevronRight, {
    size: 13
  }), open && "Collapse"))), React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, React.createElement("header", {
    style: {
      height: 48,
      padding: "0 18px",
      borderBottom: "1px solid " + c.border,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: c.bgDeep,
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec,
      display: "flex"
    }
  }, React.createElement(Menu, {
    size: 17
  })), React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 600,
      color: c.text
    }
  }, NAV.find(n => n.id === page)?.label || "Portal")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement(ConnectionBadge, null), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10,
      display: user.role === "teacher" ? "block" : "none"
    }
  }, user.teacherCode), React.createElement(Badge, {
    text: user.display,
    color: roleBadgeColor
  }), React.createElement("button", {
    onClick: logout,
    title: "Switch Role",
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 6,
      cursor: "pointer",
      padding: "4px 10px",
      color: c.danger,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Logout"), React.createElement("div", {
    onClick: () => setTheme(t => t === "dark" ? "light" : "dark"),
    title: "Switch Theme",
    style: {
      width: 48,
      height: 24,
      background: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
      border: "1px solid " + c.border,
      borderRadius: 12,
      cursor: "pointer",
      position: "relative",
      transition: "background 0.3s",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      background: theme === "dark" ? "#18181b" : "#ffffff",
      borderRadius: 10,
      position: "absolute",
      top: 1,
      left: theme === "dark" ? 1 : 25,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11
    }
  }, theme === "dark" ? "🌙" : "☀️")), React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 7,
      background: "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      color: c.accentText
    }
  }, userInitial))), React.createElement("main", {
    style: {
      flex: 1,
      padding: 18,
      overflowY: "auto"
    }
  }, React.createElement(ErrorBoundary, { key: page }, render()))));
}

