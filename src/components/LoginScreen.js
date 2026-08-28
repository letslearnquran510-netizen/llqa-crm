const LoginScreen = ({
  onLogin,
  teachers,
  appSettings,
  customRoles,
  students,
}) => {
  const [parentIdInput, setParentIdInput] = useState("");
  const customRolesList = customRoles || [];
  const [customRoleName, setCustomRoleName] = useState(
    customRolesList[0] ? customRolesList[0].name : "",
  );
  const [customUserName, setCustomUserName] = useState("");
  const [step, setStep] = useState("role");
  const [pwd, setPwd] = useState("");
  const [tlName, setTlName] = useState("Qazi Junaid");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || 1);
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [network, setNetwork] = useState(null);
  const [bioMethod, setBioMethod] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [geo, setGeo] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const teamLeads = ["Qazi Junaid", "Sobia", "Faizan Khan", "Shakeel"];
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
  const tryLogin = (role) => {
    setError("");
    if (role === "superadmin") {
      if (pwd !== "admin123" && pwd !== "") {
        setError("Incorrect password (try 'admin123' or leave blank for demo)");
        return;
      }
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
      onLogin(buildUser("superadmin"));
    } else {
      const u = buildUser(role);
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
        fontFamily: "'Segoe UI',sans-serif",
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
                "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
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
                border: "1px solid " + c.success + "44",
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
              desc: "Login with your unique Parent ID provided by the academy",
              icon: Users,
              col: c.cyan,
            },
            ...customRolesList.map((cr) => {
              const permList = Object.entries(cr.permissions || {})
                .filter(([k, v]) => v)
                .map(([k, v]) => k);
              const permSummary =
                permList.length === 0
                  ? "No permissions granted"
                  : permList.length <= 2
                    ? permList.join(", ")
                    : permList.length + " permissions";
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
                  e.currentTarget.style.background = r.col + "11";
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
                    background: r.col + "22",
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
              border: "1px solid " + c.purple + "66",
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
            'Demo: leave password blank or use "admin123"',
          ),
          React.createElement(Inp, {
            label: "Password",
            type: "password",
            value: pwd,
            onChange: setPwd,
            placeholder: "Enter password",
          }),
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
              onClick: () => tryLogin("superadmin"),
              icon: Shield,
            },
            "Sign In as Super Admin",
          ),
        ),
      step === "teamlead" &&
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              border: "1px solid " + c.accent + "66",
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
          React.createElement(Inp, {
            label: "Select Team Lead",
            value: tlName,
            onChange: setTlName,
            options: teamLeads,
          }),
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
          const t = teachers.find((x) => x.id === Number(teacherId));
          return React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                border: "1px solid " + c.success + "66",
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
                "select",
                {
                  value: teacherId,
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
                      (t.location === "WFH" ? c.warn : c.success) +
                      "44",
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
              border: "1px solid " + c.cyan + "66",
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
              if (e.key === "Enter") {
                const u = buildUser("parent");
                if (u) {
                  pushAuditLog({
                    user: u.name,
                    role: "parent",
                    action: "login",
                    status: "success",
                  });
                  onLogin(u);
                } else {
                  setError(
                    "Parent ID not found. Please verify with the academy.",
                  );
                }
              }
            },
          }),
          React.createElement(
            "button",
            {
              onClick: () => {
                const pid = parentIdInput.trim().toUpperCase();
                if (!pid) {
                  setError("Please enter your Parent ID.");
                  return;
                }
                const u = buildUser("parent");
                if (u) {
                  pushAuditLog({
                    user: u.name,
                    role: "parent",
                    action: "login",
                    status: "success",
                  });
                  onLogin(u);
                } else {
                  setError(
                    "Parent ID not found. Please verify with the academy.",
                  );
                }
              },
              style: {
                width: "100%",
                padding: "12px",
                background: c.cyan,
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              },
            },
            "Enter Parent Portal",
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
                  border: "1px solid " + c.danger + "66",
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
          const permList = Object.entries(roleRec.permissions || {})
            .filter(([k, v]) => v)
            .map(([k, v]) => k);
          return React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                border: "1px solid " + c.warn + "66",
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
            React.createElement(
              "div",
              {
                style: {
                  color: c.textSec,
                  fontSize: 10,
                  marginBottom: 6,
                  fontWeight: 600,
                },
              },
              "This role has access to:",
            ),
            permList.length > 0
              ? React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginBottom: 14,
                    },
                  },
                  permList.map((p) =>
                    React.createElement(
                      "span",
                      {
                        key: p,
                        style: {
                          fontSize: 9,
                          padding: "3px 8px",
                          borderRadius: 10,
                          background: c.warn + "22",
                          color: c.warn,
                          fontWeight: 600,
                          border: "1px solid " + c.warn + "44",
                        },
                      },
                      p,
                    ),
                  ),
                )
              : React.createElement(
                  "div",
                  {
                    style: {
                      color: c.danger,
                      fontSize: 10,
                      marginBottom: 14,
                      padding: "8px 10px",
                      background: c.dangerBg,
                      borderRadius: 6,
                    },
                  },
                  "\u26A0 No permissions granted to this role. Contact Super Admin.",
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
              "Your Name",
            ),
            React.createElement("input", {
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
                onClick: () => {
                  if (!customUserName.trim()) {
                    setError("Please enter your name to continue.");
                    return;
                  }
                  const u = buildUser("custom:" + customRoleName);
                  if (u) {
                    pushAuditLog({
                      user: customUserName.trim(),
                      role: customRoleName,
                      action: "login",
                      status: "success",
                    });
                    onLogin(u);
                  } else {
                    setError("Could not create user session.");
                  }
                },
                style: {
                  width: "100%",
                  padding: "12px",
                  background: permList.length === 0 ? c.bgDeep : c.warn,
                  border: "none",
                  borderRadius: 8,
                  color: permList.length === 0 ? c.textMuted : "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: permList.length === 0 ? "not-allowed" : "pointer",
                  opacity: permList.length === 0 ? 0.5 : 1,
                },
              },
              "Enter Portal",
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
