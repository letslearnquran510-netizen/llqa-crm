const LoginScreen = ({
  onLogin,
  teachers: llqaTeachers0,
  appSettings: llqaSet0,
  customRoles: llqaRoles0,
  students,
}) => {
  // v81: before a sign-in the CRM's lists can't be read: the names come from the sign-in directory
  const [dir, setDir] = useState(null);
  const [v81, setV81] = useState({ secret: "", secret2: "", email: "", busy: false, owner: null, who: "owner", pick: "", tlKey: "", stKey: "", change: null });
  const v81Set = (p) => setV81((o) => ({ ...o, ...p }));
  useEffect(() => {
    LLQAAuth.start();
    llqaDirLoad().then((d) => {
      setDir(d || {});
      const tl = ((d && d.teamLeads) || []).map((x) => x.name);
      if (tl.length) setTlName((cur) => (tl.includes(cur) ? cur : tl[0])); // the first team lead with a sign-in
    });
  }, []);
  const appSettings = llqaLoginBrand(llqaSet0, dir);
  const teachers = llqaDirTeachers(dir);
  const customRoles = llqaDirRoles(dir);
  const [parentIdInput, setParentIdInput] = useState(() => llqaLinkParent()); // v66: from an approval link
  const customRolesList = customRoles || [];
  const [customRoleName, setCustomRoleName] = useState(
    customRolesList[0] ? customRolesList[0].name : "",
  );
  const [customUserName, setCustomUserName] = useState("");
  const [step, setStep] = useState(() => (llqaLinkParent() ? "parent" : "role"));
  const [pwd, setPwd] = useState("");
  const [tlName, setTlName] = useState("Qazi Junaid");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  // v81.2: the chosen person's sign-in name is looked up ahead, so Sign In waits only for the password check
  React.useEffect(() => {
    const role = { superadmin: "superadmin", teamlead: "teamlead", teacher: "teacher", parent: "parent" }[step];
    if (!role || (role === "superadmin" && v81.owner !== true)) return;
    const t = setTimeout(() => {
      try {
        llqaLoginSoon(llqaLoginKeyFor(role, { v81, dir, tlName, teacherId, parentIdInput, customRoleName }));
      } catch (e) {}
    }, 300);
    return () => clearTimeout(t);
  }, [step, v81.owner, v81.who, dir, tlName, teacherId, parentIdInput]);
  const [pendingUser, setPendingUser] = useState(null);
  const [network, setNetwork] = useState(null);
  const [bioMethod, setBioMethod] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [geo, setGeo] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const teamLeads = ((dir && dir.teamLeads) || []).map((x) => x.name); // v81: team leads with a sign-in
  const isWFH =
    pendingUser?.role === "teacher" && pendingUser?.location === "WFH";
  const buildUser = (role) => {
    if (role === "superadmin")
      return {
        role: "superadmin",
        name: "Mohsin",
        display: "Super Admin",
        location: "IBA",
      };
    if (role === "teamlead")
      return {
        role: "teamlead",
        name: tlName,
        display: "Team Lead — " + tlName,
        location: "IBA",
      };
    if (role === "teacher") {
      const t = teachers.find((x) => x.id === Number(teacherId));
      return t
        ? {
            role: "teacher",
            id: t.id,
            name: t.name,
            display: "Teacher — " + t.name,
            teacherId: t.id,
            teacherCode: t.code,
            location: t.location,
          }
        : null;
    }
    if (role === "parent") {
      const pid = String(parentIdInput || "")
        .trim()
        .toUpperCase();
      if (!pid) return null;
      const stu = (students || []).find(
        (s) => String(s.parentId || "").toUpperCase() === pid,
      );
      if (!stu) return null;
      return {
        role: "parent",
        name: stu.parent || "Parent",
        display: "Parent of " + stu.name,
        parentId: pid,
        studentId: stu.id,
        studentName: stu.name,
        location: "USA",
      };
    }
    if (typeof role === "string" && role.indexOf("custom:") === 0) {
      const roleName = role.substring(7);
      const roleRec = customRolesList.find((r) => r.name === roleName);
      if (!roleRec) return null;
      const userName = (customUserName && customUserName.trim()) || roleName;
      return {
        role: role,
        name: userName,
        display: roleName + " — " + userName,
        location: "IBA",
        customPermissions: roleRec.permissions || {},
        customRoleName: roleName,
      };
    }
    return null;
  };
  // v66: approval links sign the parent in once their record has loaded
  useEffect(() => {
    const pid = llqaLinkParent();
    if (firebaseConfig) return; // v81: the link fills in the Parent ID; the family's PIN is still needed
    if (!pid || LLQAApp.linkTried) return;
    if (!(students || []).some((s) => String(s.parentId || "").toUpperCase() === pid)) return;
    LLQAApp.linkTried = true;
    const u = buildUser("parent");
    if (!u) return;
    pushAuditLog({ user: u.name, role: "parent", action: "login (approval link)", status: "success" });
    onLogin(u);
  }, [students]);
  // v81: the sign-in with the person's own password or PIN; then the steps that followed before
  const v81Login = async (role) => {
    if (v81.busy) return;
    setError("");
    const p = llqaLoginPlan(role, { v81, dir, tlName, teacherId, parentIdInput, customRoleName, pwd });
    if (p.error) return setError(p.error);
    v81Set({ busy: true });
    const r = await llqaSignIn(p.key, p.secret, p.what);
    if (!r.ok) {
      v81Set({ busy: false });
      return setError(r.error === "none" ? p.none : r.error);
    }
    const u = await llqaUserFromAcct(r.acct);
    v81Set({ busy: false, secret: "" });
    if (!u) return setError("This sign-in isn't linked to anyone in the CRM yet — ask the office.");
    if (r.acct.mustChange) return v81Set({ change: { role, u, old: p.secret } });
    v81Go(role, u);
  };
  const v81Go = (role, u) => {
    if (role === "superadmin" || role === "teamlead" || role === "teacher") return tryLogin(role, u);
    pushAuditLog({ user: u.name, role: u.role === "parent" ? "parent" : u.customRoleName || u.role, action: "login", status: "success" });
    onLogin(u);
  };
  const v81SetUp = async () => {
    if (v81.busy) return;
    setError("");
    const bad = llqaPassProblem(v81.secret, false);
    if (bad) return setError(bad);
    if (v81.secret !== v81.secret2) return setError("The two passwords are not the same.");
    v81Set({ busy: true });
    const r = await llqaOwnerSetup(v81.secret, v81.email);
    v81Set({ busy: false, secret: "", secret2: "" });
    if (!r.ok) return setError(r.error);
    v81Go("superadmin", await llqaUserFromAcct(r.acct));
  };
  const v81Change = async () => {
    if (v81.busy) return;
    setError("");
    const ch = v81.change;
    const bad = llqaPassProblem(v81.secret, false);
    if (bad) return setError(bad);
    if (v81.secret !== v81.secret2) return setError("The two passwords are not the same.");
    v81Set({ busy: true });
    const r = await llqaChangeOwnSecret(ch.old, v81.secret);
    v81Set({ busy: false, secret: "", secret2: "" });
    if (!r.ok) return setError(r.error);
    v81Set({ change: null });
    v81Go(ch.role, ch.u);
  };
  useEffect(() => {
    // v81: the 24/7 runner stays signed in: it goes straight back in after a reload
    if (!llqaRunnerTab) return;
    const go = () => {
      const a = llqaAcct();
      if (!a || a.role !== "superadmin" || LLQAApp.runnerIn) return;
      LLQAApp.runnerIn = true;
      llqaUserFromAcct(a).then((u) => u && onLogin(u));
    };
    go();
    return LLQAAuth.sub(go);
  }, []);
  const tryLogin = (role, u0) => {
    setError("");
    if (role === "superadmin") {
      if (!u0) return v81Login("superadmin"); // v81: the password is checked by the sign-in
      pushAuditLog({
        user: "Mohsin",
        role: "superadmin",
        time: new Date().toISOString(),
        network: "Direct",
        method: "Password",
        ip: genIP(),
        mac: genMAC(),
        device: detectDevice(),
        browser: getBrowser(),
        status: "success",
        autoAttendance: false,
        location: "IBA",
        geo: null,
        photo: null,
        fingerprint: genFingerprint(),
        trusted: true,
      });
      LOGIN_AUDIT.unshift({
        id: Date.now(),
        user: "Mohsin",
        role: "superadmin",
        time: new Date().toISOString(),
        network: "Direct",
        method: "Password",
        ip: genIP(),
        mac: genMAC(),
        device: detectDevice(),
        browser: getBrowser(),
        status: "success",
        autoAttendance: false,
        location: "IBA",
        geo: null,
        photo: null,
        fingerprint: genFingerprint(),
        trusted: true,
      });
      if (window.addAuditEntry)
        window.addAuditEntry({
          user: "Mohsin",
          role: "superadmin",
          time: new Date().toISOString(),
          network: "Direct",
          method: "Password",
          ip: genIP(),
          device: detectDevice(),
          browser: getBrowser(),
          status: "success",
          location: "IBA",
        });
      onLogin(u0);
    } else {
      if (!u0) return v81Login(role); // v81
      const u = u0;
      if (!u) {
        setError("Select a profile");
        return;
      }
      setPendingUser(u);
      setStep("network");
    }
  };
  const onNetworkConnected = (n) => {
    setNetwork(n);
    setStep("biometric");
  };
  const onBioVerified = (m) => {
    setBioMethod(m);
    const p = captureSilentPhoto(pendingUser.name);
    const g = genGeo(pendingUser.location);
    const fp = genFingerprint();
    setPhoto(p);
    setGeo(g);
    setFingerprint(fp);
    setStep("attendance");
  };
  const onComplete = () => {
    const trusted = Math.random() > 0.15;
    LOGIN_AUDIT.unshift({
      id: Date.now(),
      user:
        pendingUser.role === "teacher"
          ? pendingUser.name + " (" + pendingUser.teacherCode + ")"
          : pendingUser.name,
      role: pendingUser.role,
      time: new Date().toISOString(),
      network: network?.ssid + (network?.viaOTP ? " (OTP)" : ""),
      method: bioMethod?.label,
      ip: genIP(),
      mac: genMAC(),
      device: detectDevice(),
      browser: getBrowser(),
      status: "success",
      autoAttendance: pendingUser.role === "teacher",
      location: pendingUser.location,
      geo: geo,
      photo: photo,
      fingerprint: fingerprint,
      trusted: trusted,
    });
    pushAuditLog({
      user:
        pendingUser.role === "teacher"
          ? pendingUser.name + " (" + pendingUser.teacherCode + ")"
          : pendingUser.name,
      role: pendingUser.role,
      time: new Date().toISOString(),
      network: network?.ssid + (network?.viaOTP ? " (OTP)" : ""),
      method: bioMethod?.label,
      ip: genIP(),
      mac: genMAC(),
      device: detectDevice(),
      browser: getBrowser(),
      status: "success",
      autoAttendance: pendingUser.role === "teacher",
      location: pendingUser.location,
      geo: geo,
      photo: photo,
      fingerprint: fingerprint,
      trusted: trusted,
    });
    onLogin({
      ...pendingUser,
      network: network?.ssid,
      verified: true,
      checkInTime: new Date().toISOString(),
    });
  };
  const restart = () => {
    // v81: going back after a sign-in signs out first (the page starts again)
    if (LLQAAuth.get().status === "in") return llqaSignOutAll();
    setStep("role");
    setPendingUser(null);
    setNetwork(null);
    setBioMethod(null);
    setPhoto(null);
    setGeo(null);
    setFingerprint(null);
    setError("");
    setPwd("");
  };
  if (v81.change)
    return React.createElement(LLQANewPassScreen, { v81, v81Set, error, onSave: v81Change, onBack: () => llqaSignOutAll() });
  if (step === "network")
    return React.createElement(NetworkScanScreen, {
      onConnected: onNetworkConnected,
      onCancel: restart,
      isWFH: isWFH,
      userRole: pendingUser?.role,
    });
  if (step === "biometric")
    return React.createElement(BiometricScreen, {
      user: pendingUser,
      network: network,
      onVerified: onBioVerified,
      onCancel: restart,
    });
  if (step === "attendance")
    return React.createElement(AttendanceMarkedScreen, {
      user: pendingUser,
      network: network,
      method: bioMethod,
      photo: photo,
      geo: geo,
      fingerprint: fingerprint,
      trusted: Math.random() > 0.15,
      onContinue: onComplete,
    });
  return React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        background: c.bg,
        fontFamily: "var(--font)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      },
    },
    React.createElement(
      "style",
      null,
      "@keyframes spin{to{transform:rotate(360deg)}}",
    ),
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          maxWidth: 480,
        },
      },
      React.createElement(
        "div",
        {
          style: {
            textAlign: "center",
            marginBottom: 30,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              width: 64,
              height: 64,
              borderRadius: 16,
              background:
                "linear-gradient(135deg," + c.accentFill + "," + c.purpleFill + ")", // v68
              boxShadow: "0 10px 30px -10px " + llqaAlpha(c.accentFill, "b3"),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            },
          },
          appSettings && appSettings.logoDataUrl
            ? React.createElement(
                "div",
                {
                  style: {
                    width: "100%",
                    height: "100%",
                    borderRadius: 11,
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
                size: 32,
                color: "#fff",
              }),
        ),
        React.createElement(
          "h1",
          {
            style: {
              color: c.text,
              fontSize: 24,
              margin: "0 0 4px",
              fontWeight: 800,
            },
          },
          "Let's Learn Quran Academy",
        ),
        React.createElement(
          "p",
          {
            style: {
              color: c.textSec,
              fontSize: 12,
              margin: 0,
            },
          },
          "Secure CRM Portal \xB7 Multi-factor authentication",
        ),
      ),
      step === "role" &&
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
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.successBg,
                border: "1px solid " + llqaAlpha(c.success, "44"),
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              },
            },
            React.createElement(Shield, {
              size: 14,
              color: c.success,
            }),
            React.createElement(
              "span",
              {
                style: {
                  color: c.success,
                  fontSize: 10,
                  fontWeight: 600,
                },
              },
              "Protected by Network Gate + Biometric Verification + Audit Log",
            ),
          ),
          React.createElement(
            "h3",
            {
              style: {
                color: c.text,
                fontSize: 14,
                margin: "0 0 14px",
                fontWeight: 600,
              },
            },
            "Select Your Role",
          ),
          [
            {
              id: "superadmin",
              title: "Super Admin",
              desc: "Full access · Single password · No restrictions",
              icon: Shield,
              col: c.purple,
            },
            {
              id: "teamlead",
              title: "Team Lead Portal",
              desc: "Network + Biometric required · Auto-attendance",
              icon: Users,
              col: c.accent,
            },
            {
              id: "teacher",
              title: "Teacher Portal",
              desc: "Network + Biometric required · Auto-attendance",
              icon: GraduationCap,
              col: c.success,
            },
            {
              id: "parent",
              title: "Parent Portal",
              desc: "Log in with the Parent ID provided by the academy",
              icon: Users,
              col: c.cyan,
            },
            ...customRolesList.map((cr) => {
              const permSummary = cr.people ? cr.people.length + " sign-in" + (cr.people.length === 1 ? "" : "s") + " · password" : "Sign in with your password"; // v81
              return {
                id: "custom:" + cr.name,
                title: cr.name + " (Custom)",
                desc: permSummary,
                icon: Users,
                col: c.warn,
                _isCustom: true,
              };
            }),
          ].map((r) =>
            React.createElement(
              "button",
              {
                key: r.id,
                onClick: () => {
                  if (r._isCustom) {
                    setCustomRoleName(r.id.substring(7));
                    setStep("custom-prompt");
                  } else {
                    setStep(r.id);
                  }
                },
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "14px 16px",
                  background: c.bgDeep,
                  border: "1px solid " + c.border,
                  borderRadius: 10,
                  cursor: "pointer",
                  marginBottom: 8,
                  textAlign: "left",
                  transition: "all .2s",
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.borderColor = r.col;
                  e.currentTarget.style.background = llqaAlpha(r.col, "11");
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.borderColor = c.border;
                  e.currentTarget.style.background = c.bgDeep;
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: llqaAlpha(r.col, "22"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  },
                },
                React.createElement(r.icon, {
                  size: 20,
                  color: r.col,
                }),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    flex: 1,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.text,
                      fontSize: 13,
                      fontWeight: 600,
                    },
                  },
                  r.title,
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 10,
                      marginTop: 2,
                    },
                  },
                  r.desc,
                ),
              ),
              React.createElement(ChevronRight, {
                size: 16,
                color: c.textMuted,
              }),
            ),
          ),
        ),
      step === "superadmin" &&
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              border: "1px solid " + llqaAlpha(c.purple, "66"),
              borderRadius: 14,
              padding: 24,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              },
            },
            React.createElement(
              "button",
              {
                onClick: restart,
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(ChevronLeft, {
                size: 18,
              }),
            ),
            React.createElement(Shield, {
              size: 18,
              color: c.purple,
            }),
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 15,
                  margin: 0,
                  fontWeight: 700,
                },
              },
              "Super Admin Login",
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.purpleBg,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                color: c.purple,
                fontSize: 10,
              },
            },
            llqaOwnerHint(v81),
          ),
          React.createElement(LLQAOwnerFields, { v81, v81Set, dir, pwd, setPwd, onEnter: () => (v81.owner === false ? v81SetUp() : tryLogin("superadmin")) }),
          error &&
            React.createElement(
              "div",
              {
                style: {
                  color: c.danger,
                  fontSize: 11,
                  marginBottom: 10,
                },
              },
              error,
            ),
          React.createElement(
            Btn,
            {
              onClick: () => (v81.owner === false ? v81SetUp() : tryLogin("superadmin")),
              icon: Shield,
            },
            v81.busy ? "Signing in…" : v81.owner === false ? "Set the password and sign in" : "Sign In as Super Admin",
          ),
          React.createElement(LLQAOwnerForgot, { v81, setError }),
        ),
      step === "teamlead" &&
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              border: "1px solid " + llqaAlpha(c.accent, "66"),
              borderRadius: 14,
              padding: 24,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              },
            },
            React.createElement(
              "button",
              {
                onClick: restart,
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(ChevronLeft, {
                size: 18,
              }),
            ),
            React.createElement(Users, {
              size: 18,
              color: c.accent,
            }),
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 15,
                  margin: 0,
                  fontWeight: 700,
                },
              },
              "Team Lead Portal",
            ),
          ),
          teamLeads.length
            ? React.createElement(Inp, {
                label: "Select Team Lead",
                value: tlName,
                onChange: setTlName,
                options: teamLeads,
              })
            : llqaNoSignIns("team lead"),
          React.createElement(LLQASecretField, { label: "Password", value: v81.secret, onChange: (v) => v81Set({ secret: v }), onEnter: () => tryLogin("teamlead") }),
          error && React.createElement("div", { style: { color: c.danger, fontSize: 11, marginBottom: 10 } }, error),
          React.createElement(
            "div",
            {
              style: {
                background: c.accentBg,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                color: c.accent,
                fontSize: 10,
              },
            },
            "Next: Network check \u2192 Biometric \u2192 Auto-attendance",
          ),
          React.createElement(
            Btn,
            {
              onClick: () => tryLogin("teamlead"),
              icon: Users,
            },
            "Continue \xB7 Verify Identity",
          ),
        ),
      step === "teacher" &&
        (() => {
          const t = teachers.find((x) => String(x.id) === String(teacherId));
          return React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                border: "1px solid " + llqaAlpha(c.success, "66"),
                borderRadius: 14,
                padding: 24,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                },
              },
              React.createElement(
                "button",
                {
                  onClick: restart,
                  style: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.textSec,
                  },
                },
                React.createElement(ChevronLeft, {
                  size: 18,
                }),
              ),
              React.createElement(GraduationCap, {
                size: 18,
                color: c.success,
              }),
              React.createElement(
                "h3",
                {
                  style: {
                    color: c.text,
                    fontSize: 15,
                    margin: 0,
                    fontWeight: 700,
                  },
                },
                "Teacher Portal",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  marginBottom: 10,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    marginBottom: 4,
                    fontWeight: 500,
                  },
                },
                "Select Your Profile",
              ),
              React.createElement(
                LLQASelect, // v70: the CRM's own list
                {
                  value: teacherId,
                  title: "Your name", // v81
                  placeholder: teachers.length ? "Choose your name" : "No teacher sign-ins yet",
                  onChange: (e) => setTeacherId(e.target.value),
                  style: {
                    width: "100%",
                    padding: "9px 12px",
                    background: c.bgInput,
                    border: "1px solid " + c.border,
                    borderRadius: 7,
                    color: c.text,
                    fontSize: 12,
                    outline: "none",
                    boxSizing: "border-box",
                  },
                },
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
                    ") \u2014 ",
                    t.location,
                  ),
                ),
              ),
            ),
            t &&
              React.createElement(
                "div",
                {
                  style: {
                    background: t.location === "WFH" ? c.warnBg : c.successBg,
                    border:
                      "1px solid " +
                      llqaAlpha((t.location === "WFH" ? c.warn : c.success), "44"),
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 12,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    },
                  },
                  React.createElement(Badge, {
                    text:
                      t.location === "WFH"
                        ? "🏠 Work From Home"
                        : "🏢 On-site (IBA)",
                    color: t.location === "WFH" ? "warn" : "success",
                  }),
                  React.createElement(
                    "span",
                    {
                      style: {
                        color: c.text,
                        fontSize: 11,
                        fontWeight: 600,
                      },
                    },
                    t.name,
                  ),
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 10,
                      lineHeight: 1.5,
                    },
                  },
                  t.location === "WFH"
                    ? "Security: Academy WiFi OR Home WiFi/Mobile Data with OTP verification + GPS lock + photo capture"
                    : "Security: Strict — Must be on academy WiFi (LLQA 5G/2G/IBA) + biometric + photo capture",
                ),
              ),
            React.createElement(
              "div",
              {
                style: {
                  background: c.successBg,
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 12,
                  color: c.success,
                  fontSize: 10,
                },
              },
              "4 steps: Network \u2192 Biometric (silent photo) \u2192 Audit \u2192 Auto-attendance",
            ),
            React.createElement(LLQASecretField, { label: "PIN", pin: true, value: v81.secret, onChange: (v) => v81Set({ secret: v }), onEnter: () => tryLogin("teacher") }),
            error &&
              React.createElement(
                "div",
                {
                  style: {
                    color: c.danger,
                    fontSize: 11,
                    marginBottom: 10,
                  },
                },
                error,
              ),
            React.createElement(
              Btn,
              {
                onClick: () => tryLogin("teacher"),
                icon: GraduationCap,
              },
              "Continue \xB7 Verify Identity",
            ),
          );
        })(),
      step === "parent" &&
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              border: "1px solid " + llqaAlpha(c.cyan, "66"),
              borderRadius: 14,
              padding: 24,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              },
            },
            React.createElement(
              "button",
              {
                onClick: restart,
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(ChevronLeft, {
                size: 18,
              }),
            ),
            React.createElement(Users, {
              size: 18,
              color: c.cyan,
            }),
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 14,
                  margin: 0,
                  fontWeight: 600,
                },
              },
              "Parent Portal Login",
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgDeep,
                border: "1px solid " + c.border,
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 14,
                color: c.textSec,
                fontSize: 11,
                lineHeight: 1.5,
              },
            },
            "Enter the unique Parent ID provided by the academy. You will see your child\u0027s progress, attendance, invoices, and can send notes to teachers.",
          ),
          React.createElement(
            "label",
            {
              style: {
                display: "block",
                color: c.textSec,
                fontSize: 10,
                marginBottom: 6,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              },
            },
            "Parent ID",
          ),
          React.createElement("input", {
            value: parentIdInput,
            onChange: (e) => setParentIdInput(e.target.value.toUpperCase()),
            placeholder: "e.g. P-A3F8K",
            style: {
              width: "100%",
              padding: "12px 14px",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 6,
              color: c.text,
              fontSize: 14,
              fontFamily: "monospace",
              letterSpacing: 1,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 14,
              textTransform: "uppercase",
            },
            onKeyDown: (e) => {
              if (e.key === "Enter") v81Login("parent"); // v81
            },
          }),
          React.createElement(LLQASecretField, { label: "PIN", pin: true, value: v81.secret, onChange: (v) => v81Set({ secret: v }), onEnter: () => v81Login("parent") }),
          React.createElement(
            "button",
            {
              onClick: () => v81Login("parent"), // v81: Parent ID and PIN
              style: {
                width: "100%",
                padding: "12px",
                background: c.cyanFill,
                border: "none",
                borderRadius: 8,
                color: c.cyanText,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              },
            },
            v81.busy ? "Signing in…" : "Enter Parent Portal",
          ),
          error
            ? React.createElement(
                "div",
                {
                  style: {
                    color: c.danger,
                    fontSize: 11,
                    marginTop: 10,
                    textAlign: "center",
                  },
                },
                error,
              )
            : null,
        ),
      step === "custom-prompt" &&
        (() => {
          const roleRec = customRolesList.find(
            (r) => r.name === customRoleName,
          );
          if (!roleRec) {
            return React.createElement(
              "div",
              {
                style: {
                  background: c.bgCard,
                  border: "1px solid " + llqaAlpha(c.danger, "66"),
                  borderRadius: 14,
                  padding: 24,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    color: c.danger,
                    fontSize: 13,
                  },
                },
                "Role not found.",
              ),
              React.createElement(
                "button",
                {
                  onClick: () => setStep("role"),
                  style: {
                    marginTop: 10,
                    background: c.bgDeep,
                    border: "1px solid " + c.border,
                    borderRadius: 6,
                    padding: "6px 12px",
                    color: c.text,
                    fontSize: 11,
                    cursor: "pointer",
                  },
                },
                "Back",
              ),
            );
          }
          const permList = ["sign-in"]; // v81: what the role opens shows after the sign-in
          return React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                border: "1px solid " + llqaAlpha(c.warn, "66"),
                borderRadius: 14,
                padding: 24,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                },
              },
              React.createElement(
                "button",
                {
                  onClick: restart,
                  style: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.textSec,
                  },
                },
                React.createElement(ChevronLeft, {
                  size: 18,
                }),
              ),
              React.createElement(Users, {
                size: 18,
                color: c.warn,
              }),
              React.createElement(
                "h3",
                {
                  style: {
                    color: c.text,
                    fontSize: 14,
                    margin: 0,
                    fontWeight: 600,
                  },
                },
                customRoleName + " (Custom Role)",
              ),
            ),
            roleRec.desc
              ? React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 11,
                      marginBottom: 12,
                      padding: "8px 10px",
                      background: c.bgDeep,
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                    },
                  },
                  roleRec.desc,
                )
              : null,
            React.createElement(LLQAStaffPick, { role: roleRec, value: v81.stKey, onChange: (k) => v81Set({ stKey: k }) }),
            React.createElement(LLQASecretField, { label: "Password", value: v81.secret, onChange: (v) => v81Set({ secret: v }), onEnter: () => v81Login("custom") }),
            false &&             React.createElement(
              "label",
              {
                style: {
                  display: "block",
                  color: c.textSec,
                  fontSize: 10,
                  marginBottom: 6,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              },
              "Your Name",
            ),
            false && React.createElement("input", {
              value: customUserName,
              onChange: (e) => setCustomUserName(e.target.value),
              placeholder: "e.g. Ahmed Khan",
              style: {
                width: "100%",
                padding: "10px 12px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 6,
                color: c.text,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 14,
              },
            }),
            React.createElement(
              "button",
              {
                disabled: permList.length === 0,
                onClick: () => v81Login("custom"), // v81
                style: {
                  width: "100%",
                  padding: "12px",
                  background: permList.length === 0 ? c.bgDeep : c.warnFill,
                  border: "none",
                  borderRadius: 8,
                  color: permList.length === 0 ? c.textMuted : c.warnText,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: permList.length === 0 ? "not-allowed" : "pointer",
                  opacity: permList.length === 0 ? 0.5 : 1,
                },
              },
              v81.busy ? "Signing in…" : "Enter Portal",
            ),
            error
              ? React.createElement(
                  "div",
                  {
                    style: {
                      color: c.danger,
                      fontSize: 11,
                      marginTop: 10,
                      textAlign: "center",
                    },
                  },
                  error,
                )
              : null,
          );
        })(),
      React.createElement(
        "p",
        {
          style: {
            textAlign: "center",
            color: c.textMuted,
            fontSize: 9,
            marginTop: 20,
          },
        },
        "\xA9 2026 LLQA Academy \xB7 Secure CRM v2 \xB7 Network-bound \xB7 Biometric-protected",
      ),
    ),
  );
};
