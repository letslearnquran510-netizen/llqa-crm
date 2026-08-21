const SettingsMod = ({
  access,
  setAccess,
  teamLeads,
  setTeamLeads,
  appSettings,
  setAppSettings,
  theme,
  setTheme,
  teachers,
  setTeachers,
  shifts,
  setShifts,
  customRoles,
  setCustomRoles
}) => {
  const rolesList = customRoles || [];
  const [section, setSection] = useState("profile");
  const [liveAudit] = useFirestoreCollection("loginAudit", LOGIN_AUDIT);
  const auditLog = liveAudit && liveAudit.length > 0 ? [...liveAudit].sort((a, b) => new Date(b.time) - new Date(a.time)) : LOGIN_AUDIT;
  const settings = appSettings || DEFAULT_SETTINGS;
  const setSettings = v => setAppSettings(typeof v === "function" ? v(settings) : v);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const update = (key, val) => setSettings({
    ...settings,
    [key]: val
  });
  const initialSettingsRef = React.useRef(null);
  React.useEffect(() => {
    if (!initialSettingsRef.current && appSettings) initialSettingsRef.current = JSON.parse(JSON.stringify(appSettings));
  }, [appSettings]);
  const [savedFlash, setSavedFlash] = useState(false);
  const notice = msg => {
    try {
      alert(msg);
    } catch (e) {}
  };
  const exportToCsv = (filename, headers, rows) => {
    const csv = [headers, ...rows].map(r => r.map(v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const downloadJson = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const [revealedKeys, setRevealedKeys] = useState({});
  const toggleReveal = k => setRevealedKeys({
    ...revealedKeys,
    [k]: !revealedKeys[k]
  });
  const [users, setUsers] = useState([{
    id: 1,
    name: "Mohsin (Super Admin)",
    email: "admin@letslearnquran.net",
    role: "Super Admin",
    status: "active",
    lastLogin: "2 min ago",
    avatar: "M"
  }, {
    id: 2,
    name: "Qazi Junaid",
    email: "qazi@llqa.net",
    role: "Manager",
    status: "active",
    lastLogin: "1 hour ago",
    avatar: "Q"
  }, {
    id: 3,
    name: "Sobia",
    email: "sobia@llqa.net",
    role: "Team Lead",
    status: "active",
    lastLogin: "30 min ago",
    avatar: "S"
  }, {
    id: 4,
    name: "Faizan Khan",
    email: "faizan@llqa.net",
    role: "Team Lead",
    status: "active",
    lastLogin: "5 hours ago",
    avatar: "F"
  }, {
    id: 5,
    name: "Shakeel (Accountant)",
    email: "accounts@llqa.net",
    role: "Accountant",
    status: "active",
    lastLogin: "yesterday",
    avatar: "S"
  }, {
    id: 6,
    name: "Zainab",
    email: "zainab@llqa.net",
    role: "Admin",
    status: "invited",
    lastLogin: "Pending",
    avatar: "Z"
  }]);
  const sessions = [{
    device: "Chrome on Windows 11",
    ip: "182.178.45.120",
    location: "Rawalpindi, PK",
    time: "Now (current)",
    current: true
  }, {
    device: "Safari on iPhone 15",
    ip: "182.178.45.120",
    location: "Rawalpindi, PK",
    time: "3 hours ago",
    current: false
  }, {
    device: "Edge on Windows",
    ip: "154.208.90.45",
    location: "Karachi, PK",
    time: "Yesterday",
    current: false
  }];
  const rolePerms = [{
    module: "Dashboard",
    roles: {
      "Super Admin": "Full",
      Admin: "Full",
      Manager: "View",
      "Team Lead": "View",
      Teacher: "None",
      Accountant: "View"
    }
  }, {
    module: "Teachers",
    roles: {
      "Super Admin": "Full",
      Admin: "Full",
      Manager: "Edit",
      "Team Lead": "View",
      Teacher: "None",
      Accountant: "View"
    }
  }, {
    module: "Students",
    roles: {
      "Super Admin": "Full",
      Admin: "Full",
      Manager: "Edit",
      "Team Lead": "Edit",
      Teacher: "View",
      Accountant: "View"
    }
  }, {
    module: "Timetable",
    roles: {
      "Super Admin": "Full",
      Admin: "Full",
      Manager: "Edit",
      "Team Lead": "Edit",
      Teacher: "View",
      Accountant: "None"
    }
  }, {
    module: "Attendance",
    roles: {
      "Super Admin": "Full",
      Admin: "Full",
      Manager: "Edit",
      "Team Lead": "Edit",
      Teacher: "Own",
      Accountant: "View"
    }
  }, {
    module: "Payroll",
    roles: {
      "Super Admin": "Full",
      Admin: "View",
      Manager: "None",
      "Team Lead": "None",
      Teacher: "Own",
      Accountant: "Full"
    }
  }, {
    module: "Finance",
    roles: {
      "Super Admin": "Full",
      Admin: "View",
      Manager: "None",
      "Team Lead": "None",
      Teacher: "None",
      Accountant: "Full"
    }
  }, {
    module: "Settings",
    roles: {
      "Super Admin": "Full",
      Admin: "Edit",
      Manager: "None",
      "Team Lead": "None",
      Teacher: "None",
      Accountant: "None"
    }
  }];
  const permColor = p => p === "Full" ? c.success : p === "Edit" ? c.accent : p === "View" ? c.warn : p === "Own" ? c.purple : c.textMuted;
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      minHeight: "calc(100vh - 200px)"
    }
  }, React.createElement("div", {
    style: {
      width: 220,
      flexShrink: 0,
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 10,
      padding: 8,
      height: "fit-content",
      position: "sticky",
      top: 14
    }
  }, SETTINGS_SECTIONS.map(s => React.createElement("button", {
    key: s.id,
    onClick: () => setSection(s.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "9px 11px",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      marginBottom: 2,
      background: section === s.id ? c.accentBg : "transparent",
      color: section === s.id ? c.accent : c.textSec,
      fontSize: 11,
      fontWeight: section === s.id ? 600 : 400,
      textAlign: "left"
    }
  }, React.createElement(s.icon, {
    size: 13
  }), s.label))), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, section === "profile" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Academy Information",
    icon: BookOpen
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginBottom: 16,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 12,
      background: "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 24,
      fontWeight: 700,
      color: c.accentText,
      flexShrink: 0
    }
  }, settings.logoDataUrl ? React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      borderRadius: 11,
      background: settings.logoBg || "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, React.createElement("img", {
    src: settings.logoDataUrl,
    alt: "Logo",
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      width: settings.logoFit === "stretch" ? "100%" : "auto",
      height: settings.logoFit === "stretch" ? "100%" : "auto",
      objectFit: settings.logoFit === "cover" ? "cover" : settings.logoFit === "stretch" ? "fill" : "contain"
    }
  })) : React.createElement(BookOpen, {
    size: 28,
    color: "#fff"
  })), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 15,
      fontWeight: 700
    }
  }, settings.academyName), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, settings.tagline)), React.createElement(Btn, {
    variant: "outline",
    icon: Edit2,
    onClick: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/svg+xml,image/webp";
      input.onchange = e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (f.size > 500 * 1024) {
          notice("Logo file too large. Please use an image under 500 KB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
          setForm({
            tempLogoUrl: ev.target.result,
            tempLogoFile: f.name,
            logoFit: settings.logoFit || "contain",
            logoBg: settings.logoBg || "#4a7aff"
          });
          setModal({
            type: "adjustLogo"
          });
        };
        reader.readAsDataURL(f);
      };
      input.click();
    }
  }, "Change Logo"), settings.logoDataUrl ? React.createElement(Btn, {
    variant: "outline",
    icon: X,
    onClick: () => {
      if (confirm("Remove custom logo and restore default?")) {
        const {
          logoDataUrl,
          logoFileName,
          ...rest
        } = settings;
        setSettings(rest);
      }
    }
  }, "Remove") : null), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 16px"
    }
  }, React.createElement(Inp, {
    label: "Academy Name",
    value: settings.academyName,
    onChange: v => update("academyName", v)
  }), React.createElement(Inp, {
    label: "Tagline / Slogan",
    value: settings.tagline,
    onChange: v => update("tagline", v)
  }), React.createElement(Inp, {
    label: "Website",
    value: settings.website,
    onChange: v => update("website", v)
  }), React.createElement(Inp, {
    label: "Email",
    value: settings.email,
    onChange: v => update("email", v)
  }), React.createElement(Inp, {
    label: "Phone",
    value: settings.phone,
    onChange: v => update("phone", v)
  }), React.createElement(Inp, {
    label: "WhatsApp",
    value: settings.whatsapp,
    onChange: v => update("whatsapp", v)
  })), React.createElement(Inp, {
    label: "Address",
    value: settings.address,
    onChange: v => update("address", v)
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "0 16px"
    }
  }, React.createElement(Inp, {
    label: "Timezone",
    value: settings.timezone,
    onChange: v => update("timezone", v),
    options: ["Asia/Karachi (PKT)", "Asia/Dubai (GST)", "America/New_York (EST)", "Europe/London (GMT)"]
  }), React.createElement(Inp, {
    label: "Registration No.",
    value: settings.regNumber,
    onChange: v => update("regNumber", v)
  }), React.createElement(Inp, {
    label: "NTN Number",
    value: settings.ntnNumber,
    onChange: v => update("ntnNumber", v)
  }))), React.createElement(SettingCard, {
    title: "Social Media & Online Presence",
    icon: Globe,
    color: c.cyan
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "0 16px"
    }
  }, React.createElement(Inp, {
    label: "Facebook",
    value: settings.facebook,
    onChange: v => update("facebook", v)
  }), React.createElement(Inp, {
    label: "Instagram",
    value: settings.instagram,
    onChange: v => update("instagram", v)
  }), React.createElement(Inp, {
    label: "YouTube",
    value: settings.youtube,
    onChange: v => update("youtube", v)
  }))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => {
      const fields = ["academyName", "tagline", "website", "email", "phone", "whatsapp", "address", "timezone", "regNumber", "ntnNumber", "facebook", "instagram", "youtube", "logoDataUrl", "logoFileName", "logoFit", "logoBg"];
      const snapshot = initialSettingsRef.current;
      if (!snapshot) {
        alert("Nothing to reset (no changes detected since this page loaded).");
        return;
      }
      let hasChanges = false;
      fields.forEach(k => {
        if (JSON.stringify(settings[k]) !== JSON.stringify(snapshot[k])) hasChanges = true;
      });
      if (!hasChanges) {
        alert("No changes to undo — the profile is already in its last saved state.");
        return;
      }
      if (confirm("Discard all profile changes and restore to last saved state?\n\nThis will undo any edits you made since opening this page.")) {
        const restored = {
          ...settings
        };
        fields.forEach(k => {
          restored[k] = snapshot[k];
        });
        setSettings(restored);
        setSavedFlash("reset");
        setTimeout(() => setSavedFlash(false), 2200);
      }
    }
  }, "Reset"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      initialSettingsRef.current = JSON.parse(JSON.stringify(settings));
      setSavedFlash("save");
      setTimeout(() => setSavedFlash(false), 2200);
    }
  }, "Save Changes")), savedFlash ? React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 14px",
      background: savedFlash === "save" ? c.successBg : c.warnBg,
      border: "1px solid " + (savedFlash === "save" ? c.success : c.warn) + "66",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      gap: 10,
      animation: "fadeIn .3s"
    }
  }, React.createElement(savedFlash === "save" ? Check : RotateCw, {
    size: 16,
    color: savedFlash === "save" ? c.success : c.warn
  }), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 12,
      color: savedFlash === "save" ? c.success : c.warn
    }
  }, savedFlash === "save" ? "\u2713 Profile saved successfully" : "\u21BB Profile reset to last saved state"), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginTop: 2
    }
  }, savedFlash === "save" ? "All changes have been committed. Auto-save also keeps changes safe as you type." : "All your edits since opening this page have been undone."))) : null), section === "users" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Team Members",
    icon: Users,
    color: c.success
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, users.filter(u => u.status === "active").length, " active \xB7 ", users.filter(u => u.status === "invited").length, " pending invites"), React.createElement(Btn, {
    icon: UserPlus,
    onClick: () => setModal({
      type: "inviteUser"
    })
  }, "Invite User")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, users.map(u => React.createElement("div", {
    key: u.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 14px"
    }
  }, React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: c.accentText,
      fontWeight: 700
    }
  }, u.avatar), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, u.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, u.email)), React.createElement(Badge, {
    text: u.role,
    color: u.role.includes("Super") ? "danger" : u.role === "Admin" ? "purple" : u.role === "Manager" ? "accent" : u.role === "Accountant" ? "warn" : "cyan"
  }), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      minWidth: 80,
      textAlign: "right"
    }
  }, u.lastLogin), React.createElement(Badge, {
    text: u.status,
    color: u.status === "active" ? "success" : "warn"
  }), React.createElement("button", {
    onClick: () => {
      setForm({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status
      });
      setModal({
        type: "editUser"
      });
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec,
      padding: 6,
      borderRadius: 4
    },
    title: "Edit user"
  }, React.createElement(Edit2, {
    size: 14
  })))))), React.createElement(SettingCard, {
    title: "Team Leads",
    icon: Users,
    color: c.accent
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      flexWrap: "wrap",
      gap: 8
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600,
      marginBottom: 2
    }
  }, (teamLeads || []).length + " team leads configured"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "Used in Add Teacher, Class Shifting, and filtering throughout the CRM")), React.createElement(Btn, {
    icon: UserPlus,
    onClick: () => {
      setForm({
        name: "",
        email: "",
        phone: "",
        group: "Male IBA"
      });
      setModal({
        type: "addTeamLead"
      });
    }
  }, "Add Team Lead")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, (teamLeads || []).map(tl => React.createElement("div", {
    key: tl.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 14px"
    }
  }, React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: c.accentText,
      fontWeight: 700,
      fontSize: 14
    }
  }, tl.name.charAt(0)), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, tl.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", null, tl.group || "—"), tl.email ? React.createElement("span", null, "· " + tl.email) : null, tl.phone ? React.createElement("span", null, "· " + tl.phone) : null)), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textAlign: "right",
      marginRight: 8
    }
  }, window._teachersForLeadCount ? window._teachersForLeadCount(tl.name) : ""), React.createElement("button", {
    onClick: () => {
      setForm({
        id: tl.id,
        name: tl.name,
        email: tl.email || "",
        phone: tl.phone || "",
        group: tl.group || "Male IBA"
      });
      setModal({
        type: "editTeamLead"
      });
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.accent,
      padding: 6,
      borderRadius: 4
    },
    title: "Edit"
  }, React.createElement(Edit2, {
    size: 14
  })), React.createElement("button", {
    onClick: () => {
      setModal({
        type: "deleteTeamLead",
        data: tl
      });
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.danger,
      padding: 6,
      borderRadius: 4
    },
    title: "Remove"
  }, React.createElement(Trash2, {
    size: 14
  }))))), React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "10px 12px",
      background: c.accentBg,
      borderRadius: 6,
      color: c.accent,
      fontSize: 10,
      lineHeight: 1.5
    }
  }, 'ℹ Tip: When you remove a team lead, any teachers currently assigned to them will be moved to the "ALL" group automatically. To prevent this, reassign teachers manually first via the Teachers module.')), React.createElement(SettingCard, {
    title: "Active Sessions",
    icon: Shield,
    color: c.warn
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 12px"
    }
  }, "Devices currently logged into your account"), sessions.map((s, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 6,
      border: s.current ? "1px solid " + c.success + "44" : "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, s.device), s.current && React.createElement(Badge, {
    text: "Current",
    color: "success"
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, s.location, " \xB7 ", s.ip, " \xB7 ", s.time)), !s.current && React.createElement("button", {
    onClick: () => {
      if (confirm("Revoke this session? The device will be signed out immediately.")) notice("Session revoked: " + s.device + " (" + s.location + ")");
    },
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
  }, "Revoke"))), React.createElement("button", {
    onClick: () => {
      const others = sessions.filter(s => !s.current).length;
      if (others === 0) {
        notice("No other devices to sign out.");
        return;
      }
      if (confirm("Sign out " + others + " other device(s)?")) notice(others + " device(s) signed out successfully.");
    },
    style: {
      marginTop: 10,
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 6,
      cursor: "pointer",
      padding: "8px 14px",
      color: c.danger,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Sign out all other devices"))), section === "roles" && React.createElement(React.Fragment, null, React.createElement(PortalAccessControl, {
    access: access,
    setAccess: setAccess
  }), React.createElement(SettingCard, {
    title: "Role-Based Access Matrix",
    icon: Shield,
    color: c.warn
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 12px"
    }
  }, "Define what each role can access. Full = all actions, Edit = view+modify, View = read-only, Own = only own records, None = no access"), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 11
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      padding: "8px 10px",
      textAlign: "left",
      color: c.textSec,
      fontWeight: 600,
      fontSize: 10,
      borderBottom: "1px solid " + c.border,
      background: c.bgDeep,
      position: "sticky",
      left: 0
    }
  }, "Module"), ["Super Admin", "Admin", "Manager", "Team Lead", "Teacher", "Accountant"].map(r => React.createElement("th", {
    key: r,
    style: {
      padding: "8px 10px",
      textAlign: "center",
      color: c.textSec,
      fontWeight: 600,
      fontSize: 9,
      borderBottom: "1px solid " + c.border,
      background: c.bgDeep
    }
  }, r)))), React.createElement("tbody", null, rolePerms.map((p, i) => React.createElement("tr", {
    key: p.module,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "8px 10px",
      fontWeight: 600,
      background: c.bgDeep,
      position: "sticky",
      left: 0
    }
  }, p.module), Object.entries(p.roles).map(([r, v]) => React.createElement("td", {
    key: r,
    style: {
      padding: "8px 10px",
      textAlign: "center"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 4,
      background: permColor(v) + "22",
      color: permColor(v),
      fontWeight: 600
    }
  }, v))))))))), React.createElement(SettingCard, {
    title: "Custom Roles",
    icon: Users,
    color: c.accent
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Create custom roles with specific permissions"), React.createElement(Btn, {
    icon: Plus,
    variant: "outline",
    onClick: () => {
      setForm({
        roleName: "",
        roleDesc: "",
        permissions: {}
      });
      setModal({
        type: "createRole"
      });
    }
  }, "Create Role")), rolesList.length > 0 ? React.createElement("div", {
    style: {
      marginTop: 14,
      borderTop: "1px solid " + c.border,
      paddingTop: 14
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginBottom: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, rolesList.length + " Custom Role" + (rolesList.length === 1 ? "" : "s")), rolesList.map(role => {
    const permList = Object.entries(role.permissions || {}).filter(([k, v]) => v).map(([k, v]) => k);
    return React.createElement("div", {
      key: role.id,
      style: {
        background: c.bgDeep,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        border: "1px solid " + c.border
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 6
      }
    }, React.createElement("div", {
      style: {
        flex: 1
      }
    }, React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 2
      }
    }, role.name), role.desc ? React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 10,
        marginBottom: 4
      }
    }, role.desc) : null, React.createElement("div", {
      style: {
        color: c.textMuted,
        fontSize: 9
      }
    }, "Created: " + (role.createdAt || "-") + (role.updatedAt && role.updatedAt !== role.createdAt ? " \u00B7 Updated: " + role.updatedAt : ""))), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, React.createElement("button", {
      onClick: () => {
        setForm({
          _editingId: role.id,
          roleName: role.name,
          roleDesc: role.desc || "",
          permissions: role.permissions || {}
        });
        setModal({
          type: "createRole"
        });
      },
      style: {
        background: c.bgInput,
        border: "1px solid " + c.border,
        borderRadius: 5,
        padding: "4px 8px",
        color: c.accent,
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "Edit"), React.createElement("button", {
      onClick: () => {
        if (confirm('Delete role "' + role.name + '"?\n\nUsers currently assigned to this role will need to be reassigned manually.')) {
          if (setCustomRoles) setCustomRoles(rolesList.filter(r => r.id !== role.id));
        }
      },
      style: {
        background: c.bgInput,
        border: "1px solid " + c.danger + "55",
        borderRadius: 5,
        padding: "4px 8px",
        color: c.danger,
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "Delete"))), permList.length > 0 ? React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 4
      }
    }, permList.map(p => React.createElement("span", {
      key: p,
      style: {
        fontSize: 9,
        padding: "2px 8px",
        borderRadius: 10,
        background: c.accent + "22",
        color: c.accent,
        fontWeight: 600,
        border: "1px solid " + c.accent + "44"
      }
    }, p))) : React.createElement("div", {
      style: {
        fontSize: 10,
        color: c.warn,
        marginTop: 4
      }
    }, "\u26A0 No permissions granted"));
  })) : null)), section === "notifications" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Notification Channels",
    icon: AlertTriangle,
    color: c.cyan
  }, React.createElement(SettingRow, {
    label: "Email Notifications",
    desc: "Send important alerts via email"
  }, React.createElement(Toggle, {
    value: settings.emailEnabled,
    onChange: v => update("emailEnabled", v)
  })), React.createElement(SettingRow, {
    label: "SMS Notifications",
    desc: "Text message alerts (requires Twilio)"
  }, React.createElement(Toggle, {
    value: settings.smsEnabled,
    onChange: v => update("smsEnabled", v)
  })), React.createElement(SettingRow, {
    label: "Push Notifications",
    desc: "Browser push notifications"
  }, React.createElement(Toggle, {
    value: settings.pushEnabled,
    onChange: v => update("pushEnabled", v)
  })), React.createElement(SettingRow, {
    label: "WhatsApp Business",
    desc: "Send via WhatsApp Business API"
  }, React.createElement(Toggle, {
    value: settings.whatsappEnabled,
    onChange: v => update("whatsappEnabled", v)
  }))), React.createElement(SettingCard, {
    title: "Notification Triggers",
    icon: Check,
    color: c.success
  }, React.createElement(SettingRow, {
    label: "Fee Overdue Alert",
    desc: "Notify when student fee is 5+ days overdue"
  }, React.createElement(Toggle, {
    value: settings.notifyFeeOverdue,
    onChange: v => update("notifyFeeOverdue", v)
  })), React.createElement(SettingRow, {
    label: "Attendance Alert",
    desc: "Notify if teacher doesn't check in by shift start"
  }, React.createElement(Toggle, {
    value: settings.notifyAttendance,
    onChange: v => update("notifyAttendance", v)
  })), React.createElement(SettingRow, {
    label: "New Enrollment",
    desc: "Notify admin on new student registration"
  }, React.createElement(Toggle, {
    value: settings.notifyNewEnroll,
    onChange: v => update("notifyNewEnroll", v)
  })), React.createElement(SettingRow, {
    label: "Teacher Late Arrival",
    desc: "Alert team lead when teacher is late"
  }, React.createElement(Toggle, {
    value: settings.notifyTeacherLate,
    onChange: v => update("notifyTeacherLate", v)
  })), React.createElement(SettingRow, {
    label: "Daily Report Email",
    desc: "Send end-of-day summary to admin"
  }, React.createElement(Toggle, {
    value: settings.notifyDailyReport,
    onChange: v => update("notifyDailyReport", v)
  }))), React.createElement(SettingCard, {
    title: "Email Templates",
    icon: BookOpen
  }, [["Welcome Email", "Sent to new students on enrollment", "Active"], ["Fee Reminder", "Sent 3 days before due date", "Active"], ["Fee Overdue", "Sent when payment is late", "Active"], ["Payment Receipt", "Sent after successful payment", "Active"], ["Class Cancellation", "Sent when class is cancelled", "Active"], ["Teacher Shift Notice", "Sent when student is reassigned", "Draft"]].map(([name, desc, st]) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, desc)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement(Badge, {
    text: st,
    color: st === "Active" ? "success" : "warn"
  }), React.createElement("button", {
    onClick: () => {
      setForm({
        templateName: t.name,
        templateSubject: t.subject || "",
        templateBody: t.body || ""
      });
      setModal({
        type: "editTemplate"
      });
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.accent,
      fontSize: 11,
      padding: "3px 8px",
      borderRadius: 4
    }
  }, "Edit")))))), section === "payments" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "International Payment Gateways",
    icon: CreditCard,
    color: c.purple
  }, [["PayPal", "Most popular for US/CA/UK parents", "Connected", c.success, "pp@letslearnquran.net"], ["Stripe", "Credit card payments", "Not Connected", c.danger, ""], ["Zelle", "US bank-to-bank", "Connected", c.success, "+1 XXX XXX 1234"], ["Wise (TransferWise)", "Low fees international", "Connected", c.success, "mohsin@llqa.net"], ["Western Union", "Cash pickup transfers", "Connected", c.success, "MTCN tracking"]].map(([name, desc, st, col, info]) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, desc), info && React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      fontFamily: "monospace",
      marginTop: 2
    }
  }, info)), React.createElement(Badge, {
    text: st,
    color: st === "Connected" ? "success" : "danger"
  }), React.createElement("button", {
    onClick: () => {
      setForm({
        gateway: n,
        apiKey: "",
        secretKey: "",
        mode: "test"
      });
      setModal({
        type: st === "Connected" ? "configureGateway" : "connectGateway",
        data: {
          name: n,
          status: st
        }
      });
    },
    style: {
      marginLeft: 10,
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 10px",
      color: c.accent,
      fontSize: 10,
      fontWeight: 600
    }
  }, st === "Connected" ? "Configure" : "Connect")))), React.createElement(SettingCard, {
    title: "Local Payment Methods (Pakistan)",
    icon: Phone,
    color: c.success
  }, [["JazzCash", "Mobile wallet", "Connected", "03120731001"], ["EasyPaisa", "Mobile wallet", "Connected", "03333186002"], ["HBL Bank", "Bank transfer", "Connected", "Account 1234567890"], ["Meezan Bank", "Islamic banking", "Connected", "Account 0087200004"], ["UBL Bank", "Bank transfer", "Connected", "Account 6285005678"]].map(([name, desc, st, info]) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, desc), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      fontFamily: "monospace",
      marginTop: 2
    }
  }, info)), React.createElement(Badge, {
    text: st,
    color: "success"
  }), React.createElement("button", {
    onClick: () => {
      setForm({
        methodName: n,
        accountNumber: "",
        accountTitle: ""
      });
      setModal({
        type: "editLocalPayment",
        data: {
          name: n
        }
      });
    },
    style: {
      marginLeft: 10,
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 10px",
      color: c.accent,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Edit")))), React.createElement(SettingCard, {
    title: "Exchange Rates",
    icon: TrendingUp,
    color: c.warn
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 10px"
    }
  }, "Auto-updated daily. Override manually if needed."), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10
    }
  }, [["USD to PKR", 280, c.accent], ["CAD to PKR", 205, c.cyan], ["GBP to PKR", 355, c.purple]].map(([l, v, col]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 14px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, l), React.createElement("div", {
    style: {
      color: col,
      fontSize: 18,
      fontWeight: 700
    }
  }, "Rs ", v), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2
    }
  }, "Updated today")))))), section === "pricing" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Course Pricing Tiers",
    icon: DollarSign
  }, [["Noorani Qaida / English Qaida", 30, "USD", "Per month"], ["Quran Reading (Nazra)", 45, "USD", "Per month"], ["Quran with Tajweed", 50, "USD", "Per month"], ["Hifz / Memorization", 70, "USD", "Per month"], ["Quran + Memo + Islamic Ed", 80, "USD", "Per month (Combo)"], ["Subject Classes (Math/Eng/Sci)", 50, "USD", "Per month"], ["Saudi Quran (Special)", 55, "USD", "Per month"]].map(([name, price, cur, freq], i) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, freq)), React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 16,
      fontWeight: 700,
      marginRight: 14
    }
  }, "$", price), React.createElement("button", {
    onClick: () => {
      setForm({
        courseName: p.name,
        price: p.price,
        frequency: p.frequency || "Monthly"
      });
      setModal({
        type: "editPrice",
        data: p
      });
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.accent,
      padding: 6,
      borderRadius: 4
    },
    title: "Edit price"
  }, React.createElement(Edit2, {
    size: 14
  }))))), React.createElement(SettingCard, {
    title: "Discounts & Family Plans",
    icon: Award,
    color: c.purple
  }, React.createElement(SettingRow, {
    label: "Family Discount (2 siblings)",
    desc: "Automatic 10% off when 2+ students from same family"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement(Toggle, {
    value: settings.familyDiscount2 !== undefined ? settings.familyDiscount2 : true,
    onChange: v => update("familyDiscount2", v)
  }), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600,
      minWidth: 28,
      textAlign: "right"
    }
  }, "10%"))), React.createElement(SettingRow, {
    label: "Family Discount (3+ siblings)",
    desc: "Larger discount for bigger families"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement(Toggle, {
    value: settings.familyDiscount3 !== undefined ? settings.familyDiscount3 : true,
    onChange: v => update("familyDiscount3", v)
  }), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600,
      minWidth: 28,
      textAlign: "right"
    }
  }, "15%"))), React.createElement(SettingRow, {
    label: "Annual Payment Discount",
    desc: "Pay 12 months upfront, save 1 month"
  }, React.createElement(Toggle, {
    value: settings.annualDiscount !== undefined ? settings.annualDiscount : true,
    onChange: v => update("annualDiscount", v)
  })), React.createElement(SettingRow, {
    label: "Referral Bonus",
    desc: "Credit 1 month free for each successful referral"
  }, React.createElement(Toggle, {
    value: settings.referralBonus !== undefined ? settings.referralBonus : true,
    onChange: v => update("referralBonus", v)
  })), React.createElement(SettingRow, {
    label: "Scholarship Fund",
    desc: "Subsidized fees for financially disadvantaged"
  }, React.createElement(Toggle, {
    value: settings.scholarshipFund !== undefined ? settings.scholarshipFund : true,
    onChange: v => update("scholarshipFund", v)
  }))), React.createElement(SettingCard, {
    title: "Late Fee Policy",
    icon: AlertTriangle,
    color: c.danger
  }, React.createElement(SettingRow, {
    label: "Grace Period (days)",
    desc: "Days before late fee applies"
  }, React.createElement("input", {
    type: "number",
    value: settings.gracePeriod !== undefined ? settings.gracePeriod : 5,
    onChange: e => update("gracePeriod", parseInt(e.target.value) || 0),
    style: {
      width: 70,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Late Fee Amount",
    desc: "Additional charge per week late"
  }, React.createElement("input", {
    type: "number",
    value: settings.lateFeeAmount !== undefined ? settings.lateFeeAmount : 5,
    onChange: e => update("lateFeeAmount", parseInt(e.target.value) || 0),
    style: {
      width: 70,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Auto-suspend after",
    desc: "Months unpaid before class suspension"
  }, React.createElement("input", {
    type: "number",
    value: settings.autoSuspendMonths !== undefined ? settings.autoSuspendMonths : 2,
    onChange: e => update("autoSuspendMonths", parseInt(e.target.value) || 0),
    style: {
      width: 70,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })))), section === "hr" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Working Days & Hours",
    icon: Clock,
    color: c.warn
  }, React.createElement(SettingRow, {
    label: "Working on Saturday"
  }, React.createElement(Toggle, {
    value: settings.workingSat,
    onChange: v => update("workingSat", v)
  })), React.createElement(SettingRow, {
    label: "Working on Sunday"
  }, React.createElement(Toggle, {
    value: settings.workingSun,
    onChange: v => update("workingSun", v)
  })), React.createElement(SettingRow, {
    label: "Late Threshold",
    desc: "Minutes after shift start before marked late"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    type: "number",
    value: settings.lateThreshold,
    onChange: e => update("lateThreshold", e.target.value),
    style: {
      width: 60,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  }), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "min")))), React.createElement(SettingCard, {
    title: "Fine Structure (PKR)",
    icon: DollarSign,
    color: c.danger
  }, React.createElement(SettingRow, {
    label: "Late 10-29 minutes"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, "Rs"), React.createElement("input", {
    type: "number",
    value: settings.lateFine10,
    onChange: e => update("lateFine10", e.target.value),
    style: {
      width: 80,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  }))), React.createElement(SettingRow, {
    label: "Late 30+ minutes"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, "Rs"), React.createElement("input", {
    type: "number",
    value: settings.lateFine30,
    onChange: e => update("lateFine30", e.target.value),
    style: {
      width: 80,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  }))), React.createElement(SettingRow, {
    label: "Absent (1 day salary)"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, "Rs"), React.createElement("input", {
    type: "number",
    value: settings.absentFine,
    onChange: e => update("absentFine", e.target.value),
    style: {
      width: 80,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  }))), React.createElement(SettingRow, {
    label: "Half Day"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, "Rs"), React.createElement("input", {
    type: "number",
    value: settings.halfDayFine,
    onChange: e => update("halfDayFine", e.target.value),
    style: {
      width: 80,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })))), React.createElement(SettingCard, {
    title: "Leave Allocation (Per Year)",
    icon: Coffee,
    color: c.accent
  }, React.createElement(SettingRow, {
    label: "Annual Leave",
    desc: "Paid annual leave days"
  }, React.createElement("input", {
    type: "number",
    value: settings.annualLeave,
    onChange: e => update("annualLeave", e.target.value),
    style: {
      width: 60,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Sick Leave",
    desc: "Paid sick leave days"
  }, React.createElement("input", {
    type: "number",
    value: settings.sickLeave,
    onChange: e => update("sickLeave", e.target.value),
    style: {
      width: 60,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Ramadan Adjustment",
    desc: "Reduced hours during Ramadan"
  }, React.createElement(Toggle, {
    value: settings.ramadanAdjust !== undefined ? settings.ramadanAdjust : true,
    onChange: v => update("ramadanAdjust", v)
  })))), section === "security" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Login Audit Log",
    icon: Shield,
    color: c.danger
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      flexWrap: "wrap",
      gap: 8
    }
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: 0
    }
  }, "Every login captured with photo, GPS, network, device fingerprint \xB7 ", auditLog.length, " entries (live)"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, React.createElement("button", {
    onClick: () => {
      setModal({
        type: "auditFilter"
      });
      setForm({
        fromDate: "",
        toDate: "",
        status: "all"
      });
    },
    style: {
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 5,
      cursor: "pointer",
      padding: "5px 10px",
      color: c.textSec,
      fontSize: 10
    }
  }, "Filter"), React.createElement("button", {
    onClick: () => {
      const headers = ["Time", "User", "Role", "Action", "IP", "Location", "Device", "Status"];
      const rows = auditLog.map(a => [a.time || "", a.user || "", a.role || "", a.action || "", a.ip || "", a.location || "", a.device || "", a.status || ""]);
      exportToCsv("LLQA-Audit-Log-" + todayPK() + ".csv", headers, rows);
    },
    style: {
      background: c.accentBg,
      border: "1px solid " + c.accent + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "5px 10px",
      color: c.accent,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Export CSV"))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight: 500,
      overflowY: "auto"
    }
  }, auditLog.slice(0, 15).map(l => React.createElement("div", {
    key: l._id || l.id || l.user + l.time,
    style: {
      display: "flex",
      gap: 12,
      background: c.bgDeep,
      border: "1px solid " + (l.status === "success" ? c.border : c.danger + "44"),
      borderRadius: 10,
      padding: 12,
      alignItems: "flex-start"
    }
  }, l.photo ? React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 10,
      background: l.photo.color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      position: "relative"
    }
  }, React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 18,
      fontWeight: 800
    }
  }, l.photo.initials), React.createElement("div", {
    style: {
      position: "absolute",
      bottom: -2,
      right: -2,
      background: c.success,
      borderRadius: "50%",
      width: 14,
      height: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid " + c.bgDeep,
      fontSize: 8,
      color: "#fff"
    }
  }, "\uD83D\uDCF7")) : React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 10,
      background: c.danger + "22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, React.createElement(X, {
    size: 20,
    color: c.danger
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, l.user), React.createElement(Badge, {
    text: l.role,
    color: l.role === "superadmin" ? "purple" : l.role === "teamlead" ? "accent" : "success"
  }), l.location && React.createElement(Badge, {
    text: l.location,
    color: l.location === "WFH" ? "warn" : "cyan"
  }), l.trusted ? React.createElement(Badge, {
    text: "\u2713 Trusted",
    color: "success"
  }) : React.createElement(Badge, {
    text: "\u26A0 New",
    color: "warn"
  }), l.status === "blocked" && React.createElement(Badge, {
    text: "BLOCKED",
    color: "danger"
  })), React.createElement("span", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      fontFamily: "monospace"
    }
  }, new Date(l.time).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: "4px 12px",
      fontSize: 10,
      color: c.textSec
    }
  }, React.createElement("div", null, "\uD83D\uDCE1 ", React.createElement("span", {
    style: {
      color: c.text
    }
  }, l.network)), React.createElement("div", null, "\uD83D\uDD10 ", React.createElement("span", {
    style: {
      color: c.text
    }
  }, l.method)), React.createElement("div", null, "\uD83D\uDCBB ", React.createElement("span", {
    style: {
      color: c.text
    }
  }, l.device, " \xB7 ", l.browser)), React.createElement("div", null, "\uD83C\uDF10 ", React.createElement("span", {
    style: {
      color: c.text,
      fontFamily: "monospace"
    }
  }, l.ip)), l.geo && React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, "\uD83D\uDCCD ", React.createElement("span", {
    style: {
      color: c.text
    }
  }, l.geo.address), " ", React.createElement("span", {
    style: {
      color: c.textMuted,
      fontFamily: "monospace"
    }
  }, "(", l.geo.lat?.toFixed(4), "\xB0N, ", l.geo.lng?.toFixed(4), "\xB0E)")), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, "\uD83C\uDD94 ", React.createElement("span", {
    style: {
      color: c.textMuted,
      fontFamily: "monospace"
    }
  }, l.fingerprint), " \xB7 MAC: ", React.createElement("span", {
    style: {
      color: c.textMuted,
      fontFamily: "monospace"
    }
  }, l.mac)), l.autoAttendance && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      color: c.success,
      fontWeight: 600
    }
  }, "\u2713 Auto-attendance marked Present"), l.reason && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      color: c.danger
    }
  }, "\u26A0 ", l.reason))))))), React.createElement(SettingCard, {
    title: "Trusted Devices",
    icon: Shield,
    color: c.cyan
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 10px"
    }
  }, "Manage registered devices \xB7 ", auditLog.filter(l => l.trusted).length, " trusted \xB7 ", auditLog.filter(l => l.trusted === false).length, " flagged for review"), [["Hafiz Suleman's Phone", "Mobile · Chrome", "FP-A8X3M9K2", "trusted"], ["Hafiz Abdullah ATD's Laptop", "Desktop · Chrome", "FP-K9P2L4N7", "trusted"], ["Qazi Junaid's Office PC", "Desktop · Edge", "FP-Z3W5Q8R6", "trusted"], ["Unknown device · Esha", "Mobile · Safari", "FP-NEW9X2L1", "flagged"]].map(([n, d, fp, st]) => React.createElement("div", {
    key: fp,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, n), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9
    }
  }, d, " \xB7 ", React.createElement("span", {
    style: {
      fontFamily: "monospace"
    }
  }, fp))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, React.createElement(Badge, {
    text: st === "trusted" ? "✓ Trusted" : "⚠ Review",
    color: st === "trusted" ? "success" : "warn"
  }), React.createElement("button", {
    onClick: () => {
      if (confirm("Revoke trust for this device? The user will need to re-verify on next login.")) notice("Device trust revoked.");
    },
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 4,
      cursor: "pointer",
      padding: "3px 8px",
      color: c.danger,
      fontSize: 9,
      fontWeight: 600
    }
  }, "Revoke"))))), React.createElement(SettingCard, {
    title: "Authentication",
    icon: Shield,
    color: c.danger
  }, React.createElement(SettingRow, {
    label: "Two-Factor Authentication (2FA)",
    desc: "Require verification code on login"
  }, React.createElement(Toggle, {
    value: settings.twoFAEnabled,
    onChange: v => update("twoFAEnabled", v)
  })), React.createElement(SettingRow, {
    label: "Session Timeout",
    desc: "Auto-logout after inactivity (minutes)"
  }, React.createElement("input", {
    type: "number",
    value: settings.sessionTimeout,
    onChange: e => update("sessionTimeout", e.target.value),
    style: {
      width: 70,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Minimum Password Length"
  }, React.createElement("input", {
    type: "number",
    value: settings.passwordMinLength,
    onChange: e => update("passwordMinLength", e.target.value),
    style: {
      width: 60,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Require Special Characters",
    desc: "Password must contain symbols"
  }, React.createElement(Toggle, {
    value: settings.passwordRequireSpecial,
    onChange: v => update("passwordRequireSpecial", v)
  })), React.createElement(SettingRow, {
    label: "IP Whitelist",
    desc: "Only allow logins from specific IPs"
  }, React.createElement(Toggle, {
    value: settings.ipWhitelist,
    onChange: v => update("ipWhitelist", v)
  }))), React.createElement(SettingCard, {
    title: "Data Protection",
    icon: Shield,
    color: c.success
  }, React.createElement(SettingRow, {
    label: "Activity Audit Log",
    desc: "Track all admin actions"
  }, React.createElement(Toggle, {
    value: settings.auditLog,
    onChange: v => update("auditLog", v)
  })), React.createElement(SettingRow, {
    label: "Data Encryption",
    desc: "AES-256 encryption at rest"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement(Badge, {
    text: "Enabled",
    color: "success"
  }), React.createElement(Toggle, {
    value: settings.dataEncryption,
    onChange: v => update("dataEncryption", v)
  }))), React.createElement(SettingRow, {
    label: "GDPR Compliance",
    desc: "Cookie consent, data deletion requests"
  }, React.createElement(Toggle, {
    value: settings.gdprCompliant,
    onChange: v => update("gdprCompliant", v)
  })), React.createElement(SettingRow, {
    label: "Auto Security Audit",
    desc: "Weekly vulnerability scan"
  }, React.createElement(Toggle, {
    value: settings.autoSecurityAudit !== undefined ? settings.autoSecurityAudit : true,
    onChange: v => update("autoSecurityAudit", v)
  }))), React.createElement(SettingCard, {
    title: "Security Score",
    icon: TrendingUp,
    color: c.accent
  }, React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "14px 0"
    }
  }, React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 42,
      fontWeight: 800
    }
  }, "94/100"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Excellent \u2014 your system is well protected"), React.createElement("div", {
    style: {
      marginTop: 12,
      height: 8,
      background: c.border,
      borderRadius: 4,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: "94%",
      height: "100%",
      background: "linear-gradient(90deg," + c.success + "," + c.accent + ")"
    }
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 8
    }
  }, [["2FA Enabled", "✓", c.success], ["Strong Passwords", "✓", c.success], ["SSL/HTTPS", "✓", c.success], ["Backup Active", "✓", c.success], ["IP Whitelist", "○", c.warn], ["WAF Protection", "○", c.warn]].map(([l, v, col]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "8px 10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, l), React.createElement("span", {
    style: {
      color: col,
      fontSize: 16,
      fontWeight: 700
    }
  }, v)))))), section === "appearance" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Theme Preferences",
    icon: LayoutDashboard,
    color: c.purple
  }, React.createElement(SettingRow, {
    label: "Color Theme",
    desc: "Choose your preferred interface theme"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, [["dark", "Dark", "#0c1322"], ["light", "Light", "#f8fafc"], ["auto", "Auto (System)", "linear-gradient(135deg,#0c1322,#f8fafc)"]].map(([k, l, bg]) => React.createElement("button", {
    key: k,
    onClick: () => {
      update("theme", k);
      if (setTheme && k !== "auto") setTheme(k);
    },
    style: {
      background: settings.theme === k ? c.accentBg : c.bgDeep,
      border: "2px solid " + (settings.theme === k ? c.accent : c.border),
      borderRadius: 8,
      cursor: "pointer",
      padding: "8px 14px",
      color: settings.theme === k ? c.accent : c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, l)))), React.createElement(SettingRow, {
    label: "Accent Color",
    desc: "Primary color across the interface · Pick from presets or use the color wheel for any custom color"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "flex-end",
      maxWidth: 340
    }
  }, ["#4a7aff", "#3b82f6", "#06b6d4", "#0ea5e9", "#10b981", "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444", "#e11d48", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6"].map(col => React.createElement("button", {
    key: col,
    onClick: () => update("accentColor", col),
    title: col,
    style: {
      width: 24,
      height: 24,
      borderRadius: 5,
      background: col,
      border: settings.accentColor === col ? "2px solid #fff" : "2px solid transparent",
      cursor: "pointer",
      boxShadow: settings.accentColor === col ? "0 0 0 2px " + col : "none",
      padding: 0,
      flexShrink: 0
    }
  })), React.createElement("label", {
    title: "Pick any custom color",
    style: {
      position: "relative",
      width: 24,
      height: 24,
      borderRadius: 5,
      cursor: "pointer",
      border: "2px dashed " + c.textSec,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "conic-gradient(from 180deg,#ef4444,#f59e0b,#10b981,#06b6d4,#3b82f6,#8b5cf6,#ec4899,#ef4444)",
      overflow: "hidden",
      flexShrink: 0
    }
  }, React.createElement("input", {
    type: "color",
    value: settings.accentColor || "#4a7aff",
    onChange: e => update("accentColor", e.target.value),
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "pointer",
      border: "none"
    }
  })), React.createElement("input", {
    type: "text",
    value: settings.accentColor || "#4a7aff",
    onChange: e => {
      const v = e.target.value;
      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update("accentColor", v);
    },
    maxLength: 7,
    style: {
      width: 80,
      padding: "4px 6px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 4,
      color: c.text,
      fontSize: 11,
      fontFamily: "monospace",
      textAlign: "center"
    }
  }))), React.createElement(SettingRow, {
    label: "Color Tone Mode",
    desc: "How richly the CRM uses color · Full uses all 6 tones, Compact unifies decorative tones into your accent, Minimal reduces decorative tones to neutral gray (success/danger always preserved)"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, [["full", "Full Color", "All 6 tones · vibrant"], ["compact", "Compact", "Accent + semantic only"], ["minimal", "Minimal", "Neutral + semantic only"]].map(([k, l, d]) => React.createElement("button", {
    key: k,
    onClick: () => update("toneMode", k),
    title: d,
    style: {
      background: (settings.toneMode || "full") === k ? c.accent : c.bgDeep,
      border: "2px solid " + ((settings.toneMode || "full") === k ? c.accent : c.border),
      borderRadius: 8,
      cursor: "pointer",
      padding: "8px 14px",
      color: (settings.toneMode || "full") === k ? c.accentText : c.text,
      fontSize: 11,
      fontWeight: 600,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      minWidth: 120
    }
  }, React.createElement("span", null, l), React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 400,
      opacity: 0.75
    }
  }, d)))))), React.createElement(SettingCard, {
    title: "Localization",
    icon: Globe,
    color: c.cyan
  }, React.createElement(SettingRow, {
    label: "Language",
    desc: "Interface language"
  }, React.createElement("select", {
    value: settings.language,
    onChange: e => update("language", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "English"), React.createElement("option", null, "\u0627\u0631\u062F\u0648 (Urdu)"), React.createElement("option", null, "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arabic)"))), React.createElement(SettingRow, {
    label: "Date Format"
  }, React.createElement("select", {
    value: settings.dateFormat,
    onChange: e => update("dateFormat", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "DD/MM/YYYY"), React.createElement("option", null, "MM/DD/YYYY"), React.createElement("option", null, "YYYY-MM-DD"))), React.createElement(SettingRow, {
    label: "Default Currency"
  }, React.createElement("select", {
    value: settings.currency,
    onChange: e => update("currency", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "USD"), React.createElement("option", null, "PKR"), React.createElement("option", null, "CAD"), React.createElement("option", null, "GBP"))), React.createElement(SettingRow, {
    label: "Week Starts On"
  }, React.createElement("select", {
    value: settings.weekStart,
    onChange: e => update("weekStart", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "Monday"), React.createElement("option", null, "Sunday"), React.createElement("option", null, "Saturday")))), React.createElement(SettingCard, {
    title: "Display Density",
    icon: Settings
  }, React.createElement(SettingRow, {
    label: "Interface Density"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, ["Compact", "Normal", "Comfortable"].map(d => React.createElement("button", {
    key: d,
    onClick: () => update("density", d),
    style: {
      background: (settings.density || "Normal") === d ? c.accentBg : c.bgDeep,
      border: "1px solid " + ((settings.density || "Normal") === d ? c.accent : c.border),
      borderRadius: 5,
      cursor: "pointer",
      padding: "5px 12px",
      color: (settings.density || "Normal") === d ? c.accent : c.textSec,
      fontSize: 11,
      fontWeight: 600
    }
  }, d)))), React.createElement(SettingRow, {
    label: "Font Size"
  }, React.createElement("select", {
    value: settings.fontSize || "Medium",
    onChange: e => update("fontSize", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "Small"), React.createElement("option", null, "Medium (Default)"), React.createElement("option", null, "Large"))), React.createElement(SettingRow, {
    label: "Show Tooltips",
    desc: "Display helpful hints on hover"
  }, React.createElement(Toggle, {
    value: settings.showTooltips !== undefined ? settings.showTooltips : true,
    onChange: v => update("showTooltips", v)
  })))), section === "integrations" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Connected Services",
    icon: Globe,
    color: c.cyan
  }, [["Zoom", "Video class meetings", "zoomConnected", c.accent, "Auto-generate meeting links for each class"], ["Google Calendar", "Sync timetable with calendars", "googleConnected", c.success, "Two-way sync with teacher calendars"], ["WhatsApp Business", "Automated parent messaging", "whatsappConnected", c.success, "Send lesson reports, fee reminders"], ["SMTP Email", "Gmail/Outlook email sending", "smtpConnected", c.warn, "Configured: admin@letslearnquran.net"], ["Google Analytics", "Website traffic insights", "googleAnalytics", c.purple, "Track enrollment funnel"]].map(([name, desc, key, col, info]) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 3
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 13,
      fontWeight: 600
    }
  }, name), settings[key] && React.createElement(Badge, {
    text: "Connected",
    color: "success"
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, desc), settings[key] && React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      marginTop: 3
    }
  }, info)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, settings[key] && React.createElement("button", {
    onClick: () => {
      setForm({
        serviceName: name,
        clientId: "",
        clientSecret: ""
      });
      setModal({
        type: "configureIntegration",
        data: {
          name: name
        }
      });
    },
    style: {
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 5,
      cursor: "pointer",
      padding: "5px 12px",
      color: c.accent,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Configure"), React.createElement(Toggle, {
    value: settings[key],
    onChange: v => update(key, v)
  }))))), React.createElement(SettingCard, {
    title: "API Credentials",
    icon: Package,
    color: c.warn
  }, [["Zoom API Key", "SDK Credentials", "zoom_sdk_xxxxx"], ["WhatsApp Business", "Phone Number ID", "+92_xxxxxxxxxx"], ["Google Workspace", "Service Account", "svc@llqa-prod.iam"], ["Stripe Secret", "Payment API", "sk_live_xxxxx"], ["Twilio", "SMS Account SID", "AC_xxxxxxxxxx"]].map(([name, label, key]) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, label), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      fontFamily: "monospace",
      marginTop: 2
    }
  }, key)), React.createElement("button", {
    onClick: () => toggleReveal("integrationsApi"),
    style: {
      background: revealedKeys.integrationsApi ? c.warnBg : c.bgDeep,
      border: "1px solid " + (revealedKeys.integrationsApi ? c.warn : c.border),
      borderRadius: 5,
      cursor: "pointer",
      padding: "4px 10px",
      color: revealedKeys.integrationsApi ? c.warn : c.textSec,
      fontSize: 10
    }
  }, revealedKeys.integrationsApi ? "Hide" : "Reveal"))))), section === "backup" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Automatic Backup",
    icon: Download,
    color: c.success
  }, React.createElement(SettingRow, {
    label: "Auto Backup",
    desc: "Automatically backup all data"
  }, React.createElement(Toggle, {
    value: settings.autoBackup,
    onChange: v => update("autoBackup", v)
  })), React.createElement(SettingRow, {
    label: "Backup Frequency"
  }, React.createElement("select", {
    value: settings.backupFreq,
    onChange: e => update("backupFreq", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "Hourly"), React.createElement("option", null, "Daily"), React.createElement("option", null, "Weekly"))), React.createElement(SettingRow, {
    label: "Data Retention (days)",
    desc: "How long to keep backups"
  }, React.createElement("input", {
    type: "number",
    value: settings.retentionDays,
    onChange: e => update("retentionDays", e.target.value),
    style: {
      width: 70,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Last Backup",
    desc: "Daily backup \xB7 12:00 AM PKT"
  }, React.createElement("span", {
    style: {
      color: c.success,
      fontSize: 11,
      fontWeight: 600
    }
  }, "2 hours ago \xB7 127 MB"))), React.createElement(SettingCard, {
    title: "Manual Backup & Restore",
    icon: Package
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 12
    }
  }, React.createElement("button", {
    onClick: () => {
      const data = {
        timestamp: new Date().toISOString(),
        settings: settings,
        teamLeads: teamLeads || [],
        access: access || {},
        users: users
      };
      downloadJson("LLQA-Backup-" + todayPK() + ".json", data);
      notice("Backup created and downloaded.");
    },
    style: {
      background: c.accentBg,
      border: "1px solid " + c.accent + "44",
      borderRadius: 8,
      cursor: "pointer",
      padding: "14px 16px",
      color: c.accent,
      fontSize: 12,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(Download, {
    size: 16
  }), "Create Backup Now"), React.createElement("button", {
    onClick: () => {
      if (!confirm("Restoring will overwrite your current settings. Continue?")) return;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.settings) setSettings(data.settings);
            if (data.teamLeads && setTeamLeads) setTeamLeads(data.teamLeads);
            if (data.access && setAccess) setAccess(data.access);
            notice("Backup restored from " + f.name);
          } catch (err) {
            notice("Failed to restore: invalid backup file.");
          }
        };
        reader.readAsText(f);
      };
      input.click();
    },
    style: {
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 8,
      cursor: "pointer",
      padding: "14px 16px",
      color: c.text,
      fontSize: 12,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(Package, {
    size: 16
  }), "Restore from Backup")), React.createElement("h5", {
    style: {
      color: c.text,
      fontSize: 12,
      margin: "10px 0 6px"
    }
  }, "Recent Backups"), [["2026-04-23 12:00", "127 MB", "Auto"], ["2026-04-22 12:00", "126 MB", "Auto"], ["2026-04-21 15:30", "126 MB", "Manual"], ["2026-04-21 12:00", "125 MB", "Auto"]].map(([dt, sz, tp]) => React.createElement("div", {
    key: dt,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid " + c.border,
      fontSize: 11
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontFamily: "monospace"
    }
  }, dt), React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, sz), React.createElement(Badge, {
    text: tp,
    color: tp === "Auto" ? "accent" : "purple"
  }), React.createElement("button", {
    onClick: () => {
      if (confirm("Restore from this backup? Current settings will be overwritten.")) notice("Restore initiated. Settings will be applied shortly.");
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.accent,
      fontSize: 11,
      padding: "3px 8px",
      borderRadius: 4,
      fontWeight: 600
    }
  }, "Restore")))), React.createElement(SettingCard, {
    title: "Import / Export",
    icon: Globe
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json,text/csv,.csv";
      input.onchange = e => {
        const f = e.target.files && e.target.files[0];
        if (f) notice("File selected: " + f.name + "\nImport will be processed.");
      };
      input.click();
    },
    style: {
      background: c.bgDeep,
      border: "1px dashed " + c.accent,
      borderRadius: 8,
      cursor: "pointer",
      padding: "18px 16px",
      color: c.text,
      textAlign: "center"
    }
  }, React.createElement(Download, {
    size: 20,
    color: c.accent
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      marginTop: 6
    }
  }, "Import Data"), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginTop: 2
    }
  }, "CSV, Excel, JSON")), React.createElement("button", {
    onClick: () => {
      const data = {
        timestamp: new Date().toISOString(),
        settings: settings,
        teamLeads: teamLeads || [],
        access: access || {},
        users: users
      };
      downloadJson("LLQA-Full-Export-" + todayPK() + ".json", data);
      notice("Full data export downloaded.");
    },
    style: {
      background: c.bgDeep,
      border: "1px dashed " + c.success,
      borderRadius: 8,
      cursor: "pointer",
      padding: "18px 16px",
      color: c.text,
      textAlign: "center"
    }
  }, React.createElement(Download, {
    size: 20,
    color: c.success
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      marginTop: 6
    }
  }, "Export All Data"), React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.textSec,
      marginTop: 2
    }
  }, "Full database backup"))))), section === "system" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "Academic Year",
    icon: Calendar
  }, React.createElement(SettingRow, {
    label: "Academic Year Start"
  }, React.createElement("input", {
    type: "date",
    value: settings.academicYearStart || "2025-09-01",
    onChange: e => update("academicYearStart", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  })), React.createElement(SettingRow, {
    label: "Academic Year End"
  }, React.createElement("input", {
    type: "date",
    value: settings.academicYearEnd || "2026-06-30",
    onChange: e => update("academicYearEnd", e.target.value),
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  })), React.createElement(SettingRow, {
    label: "Financial Year Start"
  }, React.createElement("select", {
    style: {
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12
    }
  }, React.createElement("option", null, "July (Pakistan)"), React.createElement("option", null, "April"), React.createElement("option", null, "January")))), React.createElement(SettingCard, {
    title: "Holidays & Closures",
    icon: Coffee,
    color: c.warn
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 10px"
    }
  }, "Configured holidays when classes are cancelled and teachers don't incur fines"), [["Eid ul-Fitr", "2026-03-31", "Islamic"], ["Eid ul-Adha", "2026-06-07", "Islamic"], ["Pakistan Day", "2026-03-23", "National"], ["Independence Day", "2026-08-14", "National"], ["Ramadan Start", "2026-02-18", "Islamic"]].map(([name, date, type]) => React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, date)), React.createElement(Badge, {
    text: type,
    color: type === "Islamic" ? "purple" : "cyan"
  }))), React.createElement("button", {
    onClick: () => {
      setForm({
        holidayName: "",
        holidayDate: "",
        holidayType: "Public"
      });
      setModal({
        type: "addHoliday"
      });
    },
    style: {
      marginTop: 10,
      background: c.accentBg,
      border: "1px solid " + c.accent + "44",
      borderRadius: 6,
      cursor: "pointer",
      padding: "6px 12px",
      color: c.accent,
      fontSize: 11,
      fontWeight: 600
    }
  }, "+ Add Holiday")), React.createElement(SettingCard, {
    title: "Operational Settings",
    icon: Settings
  }, React.createElement(SettingRow, {
    label: "Class Duration (default)",
    desc: "Standard class length"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    type: "number",
    value: settings.classDuration !== undefined ? settings.classDuration : 30,
    onChange: e => update("classDuration", parseInt(e.target.value) || 0),
    style: {
      width: 60,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  }), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "min"))), React.createElement(SettingRow, {
    label: "Max Students per Teacher"
  }, React.createElement("input", {
    type: "number",
    value: settings.maxStudentsPerTeacher !== undefined ? settings.maxStudentsPerTeacher : 16,
    onChange: e => update("maxStudentsPerTeacher", parseInt(e.target.value) || 0),
    style: {
      width: 70,
      padding: "6px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.text,
      fontSize: 12,
      textAlign: "center"
    }
  })), React.createElement(SettingRow, {
    label: "Trial Class Enabled",
    desc: "Offer free trial to new students"
  }, React.createElement(Toggle, {
    value: settings.trialClass !== undefined ? settings.trialClass : true,
    onChange: v => update("trialClass", v)
  })), React.createElement(SettingRow, {
    label: "Camera-on Policy",
    desc: "Require students to have cameras on"
  }, React.createElement(Toggle, {
    value: settings.cameraOnPolicy !== undefined ? settings.cameraOnPolicy : false,
    onChange: v => update("cameraOnPolicy", v)
  })))), section === "advanced" && React.createElement(React.Fragment, null, React.createElement(SettingCard, {
    title: "AI & Automation",
    icon: Package,
    color: c.purple
  }, React.createElement(SettingRow, {
    label: "AI Features",
    desc: "Enable smart insights and recommendations"
  }, React.createElement(Toggle, {
    value: settings.aiEnabled,
    onChange: v => update("aiEnabled", v)
  })), React.createElement(SettingRow, {
    label: "Smart Auto-Reminders",
    desc: "AI schedules optimal reminder timing"
  }, React.createElement(Toggle, {
    value: settings.aiReminders,
    onChange: v => update("aiReminders", v)
  })), React.createElement(SettingRow, {
    label: "Predictive Insights",
    desc: "Forecast churn, revenue trends, teacher performance"
  }, React.createElement(Toggle, {
    value: settings.aiInsights,
    onChange: v => update("aiInsights", v)
  })), React.createElement(SettingRow, {
    label: "Automation Rules Engine",
    desc: "Create if-this-then-that workflows"
  }, React.createElement(Toggle, {
    value: settings.automationRules,
    onChange: v => update("automationRules", v)
  }))), React.createElement(SettingCard, {
    title: "Automation Rules",
    icon: Settings
  }, React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 10px"
    }
  }, "Smart workflows that trigger automatically based on conditions"), [["When fee is 5 days overdue", "Send reminder email + WhatsApp", "Active"], ["When teacher marks absent", "Notify team lead + reassign students", "Active"], ["When student attendance < 75%", "Email parent + flag in report", "Active"], ["When new student enrolls", "Send welcome email + assign teacher", "Active"], ["When class cancelled", "Notify all affected parents", "Paused"]].map(([when, then, st]) => React.createElement("div", {
    key: when,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.accent,
      fontSize: 11,
      fontWeight: 600
    }
  }, "IF: ", when), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      marginTop: 2
    }
  }, "THEN: ", then)), React.createElement(Badge, {
    text: st,
    color: st === "Active" ? "success" : "warn"
  }), React.createElement("button", {
    onClick: () => {
      setForm({
        automationName: r.name,
        trigger: r.trigger || "",
        action: r.action || ""
      });
      setModal({
        type: "editAutomation",
        data: r
      });
    },
    style: {
      marginLeft: 8,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec,
      padding: 4,
      borderRadius: 4
    },
    title: "Edit automation"
  }, React.createElement(Edit2, {
    size: 13
  })))), React.createElement("button", {
    onClick: () => {
      setForm({
        automationName: "",
        trigger: "",
        action: ""
      });
      setModal({
        type: "newAutomation"
      });
    },
    style: {
      marginTop: 10,
      background: c.accentBg,
      border: "1px solid " + c.accent + "44",
      borderRadius: 6,
      cursor: "pointer",
      padding: "6px 12px",
      color: c.accent,
      fontSize: 11,
      fontWeight: 600
    }
  }, "+ New Automation")), React.createElement(SettingCard, {
    title: "API & Webhooks",
    icon: Globe,
    color: c.danger
  }, React.createElement(SettingRow, {
    label: "API Access",
    desc: "Enable REST API for integrations"
  }, React.createElement(Toggle, {
    value: settings.apiAccess !== undefined ? settings.apiAccess : true,
    onChange: v => update("apiAccess", v)
  })), React.createElement(SettingRow, {
    label: "Developer Mode",
    desc: "Show API logs and debug info"
  }, React.createElement(Toggle, {
    value: settings.developerMode,
    onChange: v => update("developerMode", v)
  })), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 12px",
      marginTop: 10
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Your API Key"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement("code", {
    style: {
      color: c.accent,
      fontSize: 11,
      fontFamily: "monospace",
      flex: 1,
      padding: "6px 10px",
      background: c.bg,
      borderRadius: 4
    }
  }, "llqa_live_sk_a8f29x********k72ph"), React.createElement("button", {
    onClick: () => toggleReveal("advancedApi"),
    style: {
      background: revealedKeys.advancedApi ? c.warnBg : c.accentBg,
      border: "1px solid " + (revealedKeys.advancedApi ? c.warn : c.accent) + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "6px 12px",
      color: revealedKeys.advancedApi ? c.warn : c.accent,
      fontSize: 10,
      fontWeight: 600
    }
  }, revealedKeys.advancedApi ? "Hide" : "Reveal"), React.createElement("button", {
    onClick: () => {
      if (confirm("Regenerate API key? The current key will stop working immediately.")) notice("New API key generated. Update your integrations with the new key.");
    },
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "6px 12px",
      color: c.danger,
      fontSize: 10,
      fontWeight: 600
    }
  }, "Regenerate"))), React.createElement("h5", {
    style: {
      color: c.text,
      fontSize: 12,
      margin: "14px 0 6px"
    }
  }, "Webhook Endpoints"), [["Student enrolled", "https://llqa.net/hooks/enroll", "Active"], ["Payment received", "https://llqa.net/hooks/payment", "Active"], ["Teacher attendance", "https://llqa.net/hooks/attendance", "Active"]].map(([e, url, st]) => React.createElement("div", {
    key: e,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, e), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      fontFamily: "monospace"
    }
  }, url)), React.createElement(Badge, {
    text: st,
    color: "success"
  })))), React.createElement(SettingCard, {
    title: "System Health",
    icon: TrendingUp,
    color: c.success
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 10
    }
  }, [["Database", "Healthy", "99.9%", c.success], ["API Latency", "Fast", "45ms avg", c.success], ["Storage", "Good", "64% used", c.warn], ["Uptime", "99.98%", "Last 30d", c.success]].map(([l, st, val, col]) => React.createElement("div", {
    key: l,
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 12px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, l), React.createElement("div", {
    style: {
      color: col,
      fontSize: 13,
      fontWeight: 700
    }
  }, st), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      marginTop: 2
    }
  }, val))))), React.createElement(SettingCard, {
    title: "Danger Zone",
    icon: AlertTriangle,
    color: c.danger
  }, React.createElement(SettingRow, {
    label: "Reset All Settings",
    desc: "Restore all settings to factory defaults"
  }, React.createElement("button", {
    onClick: () => {
      const t = prompt("⚠️ This will reset ALL settings to factory defaults.\n\nType RESET to confirm:");
      if (t === "RESET") {
        setSettings(DEFAULT_SETTINGS);
        notice("All settings reset to defaults.");
      }
    },
    style: {
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "6px 14px",
      color: c.danger,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Reset")), React.createElement(SettingRow, {
    label: "Clear Cache",
    desc: "Clear all cached data"
  }, React.createElement("button", {
    onClick: () => {
      const t = prompt("⚠️ This will clear all cached data (audit logs, sessions, temp files).\n\nType CLEAR to confirm:");
      if (t === "CLEAR") notice("All cached data cleared.");
    },
    style: {
      background: c.warnBg,
      border: "1px solid " + c.warn + "44",
      borderRadius: 5,
      cursor: "pointer",
      padding: "6px 14px",
      color: c.warn,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Clear"))))), modal && modal.type === "inviteUser" && React.createElement("div", {
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
  }, "Invite Team Member"), React.createElement("button", {
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
    label: "Full Name *",
    value: form.name || "",
    onChange: v => setForm({
      ...form,
      name: v
    }),
    placeholder: "e.g. Ahmed Khan"
  }), React.createElement(Inp, {
    label: "Email *",
    value: form.email || "",
    onChange: v => setForm({
      ...form,
      email: v
    }),
    placeholder: "user@letslearnquran.net"
  }), React.createElement(Inp, {
    label: "Role *",
    value: form.role || "",
    onChange: v => setForm({
      ...form,
      role: v
    }),
    options: ["Admin", "Manager", "Team Lead", "Teacher", "Accountant"]
  }), React.createElement("div", {
    style: {
      background: c.accentBg,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 10,
      color: c.accent,
      fontSize: 10
    }
  }, "Invitation email will be sent with temporary password"), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    onClick: () => {
      if (!form.name || !form.email || !form.role) {
        alert("Name, Email, and Role are required.");
        return;
      }
      const newId = Math.max(0, ...users.map(u => u.id)) + 1;
      const initial = String(form.name).trim().charAt(0).toUpperCase() || "?";
      const newUser = {
        id: newId,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: "invited",
        lastLogin: "Pending",
        avatar: initial
      };
      setUsers([...users, newUser]);
      if (form.role === "Team Lead") {
        const tlId = Math.max(0, ...(teamLeads || []).map(t => t.id)) + 1;
        setTeamLeads([...(teamLeads || []), {
          id: tlId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: "",
          group: "Other",
          createdAt: todayPK()
        }]);
      }
      setForm({});
      setModal(null);
    },
    icon: UserPlus
  }, "Send Invite")))), modal && modal.type === "addTeamLead" && React.createElement("div", {
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
      width: 460,
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
  }, "Add Team Lead"), React.createElement("button", {
    onClick: () => {
      setForm({});
      setModal(null);
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement(Inp, {
    label: "Name *",
    value: form.name || "",
    onChange: v => setForm({
      ...form,
      name: v
    }),
    placeholder: "e.g. Ahmed Khan"
  }), React.createElement(Inp, {
    label: "Email",
    value: form.email || "",
    onChange: v => setForm({
      ...form,
      email: v
    }),
    placeholder: "name@llqa.net"
  }), React.createElement(Inp, {
    label: "Phone",
    value: form.phone || "",
    onChange: v => setForm({
      ...form,
      phone: v
    }),
    placeholder: "+92 312 0000000"
  }), React.createElement(Inp, {
    label: "Group / Oversees",
    value: form.group || "Male IBA",
    onChange: v => setForm({
      ...form,
      group: v
    }),
    options: ["Male IBA", "Male WFH", "Female IBA", "Female WFH", "WFH Subjects", "Accounts", "Other"]
  }), React.createElement("div", {
    style: {
      background: c.accentBg,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 10,
      color: c.accent,
      fontSize: 10
    }
  }, "ℹ This team lead will appear in all dropdowns immediately — Add Teacher, Class Shifting, Smart Finder filters."), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => {
      setForm({});
      setModal(null);
    }
  }, "Cancel"), React.createElement(Btn, {
    onClick: () => {
      if (!form.name || !String(form.name).trim()) {
        alert("Name is required.");
        return;
      }
      const trimmed = String(form.name).trim();
      const exists = (teamLeads || []).some(t => t.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        alert("A team lead with this name already exists.");
        return;
      }
      const newId = Math.max(0, ...(teamLeads || []).map(t => t.id)) + 1;
      setTeamLeads([...(teamLeads || []), {
        id: newId,
        name: trimmed,
        email: form.email || "",
        phone: form.phone || "",
        group: form.group || "Other",
        createdAt: todayPK()
      }]);
      setForm({});
      setModal(null);
    },
    icon: UserPlus
  }, "Add Team Lead")))), modal && modal.type === "editTeamLead" && React.createElement("div", {
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
      width: 460,
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
  }, "Edit Team Lead"), React.createElement("button", {
    onClick: () => {
      setForm({});
      setModal(null);
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement(Inp, {
    label: "Name *",
    value: form.name || "",
    onChange: v => setForm({
      ...form,
      name: v
    })
  }), React.createElement(Inp, {
    label: "Email",
    value: form.email || "",
    onChange: v => setForm({
      ...form,
      email: v
    })
  }), React.createElement(Inp, {
    label: "Phone",
    value: form.phone || "",
    onChange: v => setForm({
      ...form,
      phone: v
    })
  }), React.createElement(Inp, {
    label: "Group / Oversees",
    value: form.group || "",
    onChange: v => setForm({
      ...form,
      group: v
    }),
    options: ["Male IBA", "Male WFH", "Female IBA", "Female WFH", "WFH Subjects", "Accounts", "Other"]
  }), React.createElement("div", {
    style: {
      background: c.warnBg,
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 10,
      color: c.warn,
      fontSize: 10,
      lineHeight: 1.5
    }
  }, "⚠ Renaming this team lead will NOT auto-update teachers already assigned. To rename safely, add the new name first, reassign teachers, then remove the old."), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => {
      setForm({});
      setModal(null);
    }
  }, "Cancel"), React.createElement(Btn, {
    onClick: () => {
      if (!form.name || !String(form.name).trim()) {
        alert("Name is required.");
        return;
      }
      (() => {
        const oldTL = (teamLeads || []).find(t => t.id === form.id);
        const newName = String(form.name).trim();
        const oldName = oldTL ? oldTL.name : "";
        setTeamLeads((teamLeads || []).map(t => t.id === form.id ? {
          ...t,
          name: newName,
          email: form.email || "",
          phone: form.phone || "",
          group: form.group || "Other"
        } : t));
        if (oldName && oldName !== newName) {
          if (setTeachers && teachers) {
            setTeachers(teachers.map(t => t.teamLead === oldName ? {
              ...t,
              teamLead: newName
            } : t));
          }
          if (setShifts && shifts) {
            setShifts(shifts.map(s => ({
              ...s,
              fromLead: s.fromLead === oldName ? newName : s.fromLead,
              toLead: s.toLead === oldName ? newName : s.toLead
            })));
          }
        }
      })();
      setForm({});
      setModal(null);
    },
    icon: Check
  }, "Save Changes")))), modal && modal.type === "deleteTeamLead" && React.createElement("div", {
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
      alignItems: "center",
      gap: 10,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: c.dangerBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(AlertTriangle, {
    size: 20,
    color: c.danger
  })), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Remove Team Lead?")), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 14px",
      lineHeight: 1.5
    }
  }, "You are about to remove ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, (modal.data || {}).name || ""), " from the team leads list. This will:"), React.createElement("ul", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 14px",
      paddingLeft: 18,
      lineHeight: 1.7
    }
  }, React.createElement("li", null, "Remove them from all Team Lead dropdowns immediately"), React.createElement("li", null, "Existing teachers assigned to them will keep their assignment label, but you should reassign them manually")), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    variant: "danger",
    onClick: () => {
      const tl = modal.data;
      (() => {
        const removedName = tl.name;
        setTeamLeads((teamLeads || []).filter(t => t.id !== tl.id));
        if (removedName) {
          if (setTeachers && teachers) {
            setTeachers(teachers.map(t => t.teamLead === removedName ? {
              ...t,
              teamLead: ""
            } : t));
          }
          if (setShifts && shifts) {
            setShifts(shifts.map(s => ({
              ...s,
              fromLead: s.fromLead === removedName ? "" : s.fromLead,
              toLead: s.toLead === removedName ? "" : s.toLead
            })));
          }
        }
      })();
      setModal(null);
    },
    icon: Trash2
  }, "Yes, Remove")))), modal && modal.type === "editUser" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 440,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Edit User"), React.createElement("button", {
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
    label: "Name",
    value: form.name || "",
    onChange: v => setForm({
      ...form,
      name: v
    })
  }), React.createElement(Inp, {
    label: "Email",
    value: form.email || "",
    onChange: v => setForm({
      ...form,
      email: v
    }),
    type: "email"
  }), React.createElement(Inp, {
    label: "Role",
    value: form.role || "",
    onChange: v => setForm({
      ...form,
      role: v
    }),
    options: ["Super Admin", "Manager", "Team Lead", "Teacher", "Accountant", "Viewer"]
  }), React.createElement(Inp, {
    label: "Status",
    value: form.status || "active",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: ["active", "inactive", "suspended"]
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      setUsers(users.map(u => u.id === form.id ? {
        ...u,
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status
      } : u));
      setModal(null);
      notice("User updated.");
    }
  }, "Save")))), modal && modal.type === "createRole" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 480,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Create Custom Role"), React.createElement("button", {
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
    label: "Role Name *",
    value: form.roleName || "",
    onChange: v => setForm({
      ...form,
      roleName: v
    }),
    placeholder: "e.g. Senior Manager"
  }), React.createElement(Inp, {
    label: "Description",
    value: form.roleDesc || "",
    onChange: v => setForm({
      ...form,
      roleDesc: v
    }),
    placeholder: "Brief description of this role"
  }), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginBottom: 8,
      marginTop: 6
    }
  }, "Permissions (toggle access)"), ["View Dashboard", "Manage Teachers", "Manage Students", "Manage Timetable", "Approve Leaves", "View Payroll", "Edit Settings", "Export Data"].map(perm => React.createElement("div", {
    key: perm,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 8px",
      background: c.bgDeep,
      borderRadius: 5,
      marginBottom: 5
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: !!(form.permissions && form.permissions[perm]),
    onChange: e => setForm({
      ...form,
      permissions: {
        ...(form.permissions || {}),
        [perm]: e.target.checked
      }
    })
  }), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 11
    }
  }, perm))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      if (!form.roleName || !String(form.roleName).trim()) {
        notice("Role name is required.");
        return;
      }
      const trimmedName = String(form.roleName).trim();
      const editingId = form._editingId;
      if (editingId) {
        if (setCustomRoles) setCustomRoles(rolesList.map(r => r.id === editingId ? {
          ...r,
          name: trimmedName,
          desc: form.roleDesc || "",
          permissions: form.permissions || {},
          updatedAt: todayPK()
        } : r));
        notice('Role "' + trimmedName + '" updated.');
      } else {
        const exists = rolesList.find(r => (r.name || "").trim().toLowerCase() === trimmedName.toLowerCase());
        if (exists) {
          notice('A role named "' + trimmedName + '" already exists. Pick a different name.');
          return;
        }
        const newId = Math.max(0, ...rolesList.map(r => r.id || 0)) + 1;
        const permCount = Object.values(form.permissions || {}).filter(Boolean).length;
        if (setCustomRoles) setCustomRoles([...rolesList, {
          id: newId,
          name: trimmedName,
          desc: form.roleDesc || "",
          permissions: form.permissions || {},
          createdAt: todayPK(),
          updatedAt: todayPK()
        }]);
        notice('Role "' + trimmedName + '" created with ' + permCount + " permission" + (permCount === 1 ? "" : "s") + ".");
      }
      setForm({});
      setModal(null);
    }
  }, form._editingId ? "Save Changes" : "Create Role")))), modal && modal.type === "editTemplate" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 560,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Edit Email Template - " + (form.templateName || "")), React.createElement("button", {
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
    label: "Subject Line",
    value: form.templateSubject || "",
    onChange: v => setForm({
      ...form,
      templateSubject: v
    }),
    placeholder: "e.g. Welcome to LLQA"
  }), React.createElement("div", {
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
  }, "Body"), React.createElement("textarea", {
    value: form.templateBody || "",
    onChange: e => setForm({
      ...form,
      templateBody: e.target.value
    }),
    rows: 8,
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      fontFamily: "inherit",
      resize: "vertical",
      boxSizing: "border-box"
    }
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginBottom: 8
    }
  }, "Available variables: {{name}}, {{email}}, {{course}}, {{teacher}}, {{date}}, {{amount}}"), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      notice('Template "' + form.templateName + '" saved.');
      setModal(null);
    }
  }, "Save Template")))), modal && modal.type === "editPrice" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 420
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Edit Course Price"), React.createElement("button", {
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
    label: "Course Name",
    value: form.courseName || "",
    onChange: v => setForm({
      ...form,
      courseName: v
    })
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Price (USD)",
    value: form.price || "",
    onChange: v => setForm({
      ...form,
      price: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Frequency",
    value: form.frequency || "Monthly",
    onChange: v => setForm({
      ...form,
      frequency: v
    }),
    options: ["Monthly", "Quarterly", "Half-yearly", "Yearly", "Per Class"]
  })), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      notice('Price for "' + form.courseName + '" updated to $' + form.price + " " + form.frequency + ".");
      setModal(null);
    }
  }, "Save")))), modal && modal.type === "editLocalPayment" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 420
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Edit " + (form.methodName || "Payment Method")), React.createElement("button", {
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
    label: "Account Title",
    value: form.accountTitle || "",
    onChange: v => setForm({
      ...form,
      accountTitle: v
    }),
    placeholder: "e.g. Mohsin Sajjad"
  }), React.createElement(Inp, {
    label: "Account / Mobile Number",
    value: form.accountNumber || "",
    onChange: v => setForm({
      ...form,
      accountNumber: v
    }),
    placeholder: "e.g. 03124567890"
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      notice(form.methodName + " account updated.");
      setModal(null);
    }
  }, "Save")))), modal && modal.type === "auditFilter" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 420
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Filter Audit Log"), React.createElement("button", {
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
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "From Date",
    value: form.fromDate || "",
    onChange: v => setForm({
      ...form,
      fromDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "To Date",
    value: form.toDate || "",
    onChange: v => setForm({
      ...form,
      toDate: v
    }),
    type: "date"
  })), React.createElement(Inp, {
    label: "Status",
    value: form.status || "all",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: ["all", "success", "failed", "blocked"]
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      notice("Filter applied: " + (form.fromDate || "any") + " to " + (form.toDate || "any") + ", status=" + form.status);
      setModal(null);
    }
  }, "Apply Filter")))), modal && modal.type === "configureIntegration" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 440
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Configure " + (modal.data && modal.data.name || form.serviceName || "Integration")), React.createElement("button", {
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
    label: "Client ID / API Key",
    value: form.clientId || "",
    onChange: v => setForm({
      ...form,
      clientId: v
    }),
    placeholder: "Paste your client ID here"
  }), React.createElement(Inp, {
    label: "Client Secret",
    value: form.clientSecret || "",
    onChange: v => setForm({
      ...form,
      clientSecret: v
    }),
    type: "password",
    placeholder: "Paste your secret here"
  }), React.createElement("div", {
    style: {
      background: c.bgDeep,
      padding: 10,
      borderRadius: 6,
      fontSize: 10,
      color: c.textSec,
      marginBottom: 6
    }
  }, "\u2139\uFE0F Get these from your " + (modal.data && modal.data.name || "") + " account settings."), React.createElement("div", {
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
    icon: Check,
    onClick: () => {
      notice((modal.data && modal.data.name || "Integration") + " configured.");
      setModal(null);
    }
  }, "Save")))), modal && modal.type === "addHoliday" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 420
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, "Add Holiday"), React.createElement("button", {
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
    label: "Holiday Name *",
    value: form.holidayName || "",
    onChange: v => setForm({
      ...form,
      holidayName: v
    }),
    placeholder: "e.g. Eid-ul-Fitr"
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Date *",
    value: form.holidayDate || "",
    onChange: v => setForm({
      ...form,
      holidayDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Type",
    value: form.holidayType || "Public",
    onChange: v => setForm({
      ...form,
      holidayType: v
    }),
    options: ["Public", "Religious", "Academy", "Optional"]
  })), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      if (!form.holidayName || !form.holidayDate) {
        notice("Name and date are required.");
        return;
      }
      notice('Holiday "' + form.holidayName + '" added on ' + form.holidayDate + ".");
      setModal(null);
    }
  }, "Add")))), modal && (modal.type === "editAutomation" || modal.type === "newAutomation") && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 480,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, modal.type === "newAutomation" ? "New Automation Rule" : "Edit Automation"), React.createElement("button", {
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
    label: "Automation Name *",
    value: form.automationName || "",
    onChange: v => setForm({
      ...form,
      automationName: v
    }),
    placeholder: "e.g. Auto-send fee reminder"
  }), React.createElement(Inp, {
    label: "Trigger",
    value: form.trigger || "",
    onChange: v => setForm({
      ...form,
      trigger: v
    }),
    options: ["Fee overdue", "Student enrolled", "Class missed", "Leave approved", "Daily at 8 AM", "Monthly summary", "Salary day"]
  }), React.createElement(Inp, {
    label: "Action",
    value: form.action || "",
    onChange: v => setForm({
      ...form,
      action: v
    }),
    options: ["Send email", "Send SMS", "Send WhatsApp", "Create task", "Notify admin", "Export report"]
  }), React.createElement("div", {
    style: {
      background: c.bgDeep,
      padding: 10,
      borderRadius: 6,
      fontSize: 10,
      color: c.textSec,
      marginBottom: 6
    }
  }, "\u26A1 Rule will run automatically when the trigger condition is met."), React.createElement("div", {
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
    icon: Check,
    onClick: () => {
      if (!form.automationName) {
        notice("Automation name is required.");
        return;
      }
      notice('Automation "' + form.automationName + '" saved. Trigger: ' + form.trigger + ", Action: " + form.action);
      setModal(null);
    }
  }, "Save")))), modal && (modal.type === "configureGateway" || modal.type === "connectGateway") && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.55)",
      backdropFilter: "blur(6px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 22,
      width: 440
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 15,
      margin: 0
    }
  }, (modal.type === "connectGateway" ? "Connect " : "Configure ") + (form.gateway || "Payment Gateway")), React.createElement("button", {
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
    label: "API Key",
    value: form.apiKey || "",
    onChange: v => setForm({
      ...form,
      apiKey: v
    }),
    placeholder: "pk_live_..."
  }), React.createElement(Inp, {
    label: "Secret Key",
    value: form.secretKey || "",
    onChange: v => setForm({
      ...form,
      secretKey: v
    }),
    type: "password",
    placeholder: "sk_live_..."
  }), React.createElement(Inp, {
    label: "Mode",
    value: form.mode || "test",
    onChange: v => setForm({
      ...form,
      mode: v
    }),
    options: ["test", "live"]
  }), React.createElement("div", {
    style: {
      background: form.mode === "live" ? c.warnBg : c.bgDeep,
      padding: 10,
      borderRadius: 6,
      fontSize: 10,
      color: form.mode === "live" ? c.warn : c.textSec,
      marginBottom: 6
    }
  }, form.mode === "live" ? "\u26A0 LIVE mode - real money will be processed" : "\u2139\uFE0F TEST mode - no real charges"), React.createElement("div", {
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
    icon: Check,
    onClick: () => {
      notice(form.gateway + " " + (modal.type === "connectGateway" ? "connected" : "updated") + " in " + form.mode + " mode.");
      setModal(null);
    }
  }, modal.type === "connectGateway" ? "Connect" : "Save")))), modal && modal.type === "adjustLogo" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: "rgba(0,0,0,0.7)"
    },
    onClick: e => {
      if (e.target === e.currentTarget) setModal(null);
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 22,
      maxWidth: 640,
      width: "100%",
      maxHeight: "92vh",
      overflowY: "auto"
    }
  }, React.createElement("h3", {
    style: {
      margin: "0 0 6px",
      color: c.text,
      fontSize: 18,
      fontWeight: 700
    }
  }, "Adjust Logo"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginBottom: 16
    }
  }, form.tempLogoFile || "New logo", " — choose how it should display"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8,
      marginBottom: 14
    }
  }, ["contain", "cover", "stretch"].map(fit => React.createElement("button", {
    key: fit,
    onClick: () => setForm({
      ...form,
      logoFit: fit
    }),
    style: {
      padding: "10px 8px",
      background: form.logoFit === fit ? c.accentBg : c.bgDeep,
      border: "2px solid " + (form.logoFit === fit ? c.accent : c.border),
      borderRadius: 8,
      cursor: "pointer",
      color: form.logoFit === fit ? c.accent : c.textSec,
      fontSize: 11,
      fontWeight: 700,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      textTransform: "capitalize",
      marginBottom: 3
    }
  }, fit), React.createElement("div", {
    style: {
      fontSize: 9,
      opacity: 0.7,
      fontWeight: 500
    }
  }, fit === "contain" ? "Full image, padded" : fit === "cover" ? "Fills, may crop" : "Fills, may distort")))), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8
    }
  }, "Background Color"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 18,
      flexWrap: "wrap"
    }
  }, [["#4a7aff", "Blue"], ["#10b981", "Green"], ["#8b5cf6", "Purple"], ["#ef4444", "Red"], ["#f59e0b", "Amber"], ["#06b6d4", "Cyan"], ["#ec4899", "Pink"], ["#f97316", "Orange"], ["#ffffff", "White"], ["#000000", "Black"], ["transparent", "None"]].map(([col, nm]) => React.createElement("button", {
    key: col,
    onClick: () => setForm({
      ...form,
      logoBg: col
    }),
    title: nm,
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      cursor: "pointer",
      background: col === "transparent" ? "repeating-linear-gradient(45deg," + c.bgDeep + "," + c.bgDeep + " 4px," + c.border + " 4px," + c.border + " 8px)" : col,
      border: "2px solid " + (form.logoBg === col ? c.accent : c.border)
    }
  })), React.createElement("label", {
    key: "customLogoBg",
    title: "Pick any custom background color",
    style: {
      position: "relative",
      width: 36,
      height: 36,
      borderRadius: 8,
      cursor: "pointer",
      border: "2px dashed " + c.textSec,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "conic-gradient(from 180deg,#ef4444,#f59e0b,#10b981,#06b6d4,#3b82f6,#8b5cf6,#ec4899,#ef4444)",
      overflow: "hidden",
      flexShrink: 0
    }
  }, React.createElement("input", {
    type: "color",
    value: form.logoBg && form.logoBg.startsWith("#") ? form.logoBg : "#4a7aff",
    onChange: e => setForm({
      ...form,
      logoBg: e.target.value
    }),
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "pointer",
      border: "none"
    }
  }))), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8
    }
  }, "Live Preview"), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 10,
      padding: 16,
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: form.logoBg || "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      margin: "0 auto"
    }
  }, React.createElement("img", {
    src: form.tempLogoUrl,
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      width: form.logoFit === "stretch" ? "100%" : "auto",
      height: form.logoFit === "stretch" ? "100%" : "auto",
      objectFit: form.logoFit === "cover" ? "cover" : form.logoFit === "stretch" ? "fill" : "contain"
    }
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      marginTop: 5
    }
  }, "Sidebar")), React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 12,
      background: form.logoBg || "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      margin: "0 auto"
    }
  }, React.createElement("img", {
    src: form.tempLogoUrl,
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      width: form.logoFit === "stretch" ? "100%" : "auto",
      height: form.logoFit === "stretch" ? "100%" : "auto",
      objectFit: form.logoFit === "cover" ? "cover" : form.logoFit === "stretch" ? "fill" : "contain"
    }
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      marginTop: 5
    }
  }, "Profile")), React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 96,
      height: 96,
      borderRadius: 14,
      background: form.logoBg || "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      margin: "0 auto"
    }
  }, React.createElement("img", {
    src: form.tempLogoUrl,
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      width: form.logoFit === "stretch" ? "100%" : "auto",
      height: form.logoFit === "stretch" ? "100%" : "auto",
      objectFit: form.logoFit === "cover" ? "cover" : form.logoFit === "stretch" ? "fill" : "contain"
    }
  })), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      marginTop: 5
    }
  }, "Login Screen")))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: () => {
      setSettings({
        ...settings,
        logoDataUrl: form.tempLogoUrl,
        logoFileName: form.tempLogoFile,
        logoFit: form.logoFit || "contain",
        logoBg: form.logoBg || "#4a7aff"
      });
      setModal(null);
    }
  }, "Apply Logo")))));
};

