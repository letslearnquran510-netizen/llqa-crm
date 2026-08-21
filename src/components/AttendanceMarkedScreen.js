const AttendanceMarkedScreen = ({
  user,
  network,
  method,
  photo,
  geo,
  fingerprint,
  trusted,
  onContinue
}) => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c <= 1 ? (clearInterval(t), onContinue(), 0) : c - 1), 800);
    return () => clearInterval(t);
  }, []);
  const now = new Date();
  return React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: c.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'Segoe UI',sans-serif"
    }
  }, React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 480,
      background: c.bgCard,
      border: "2px solid " + c.success,
      borderRadius: 14,
      padding: 24
    }
  }, React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      width: 80,
      height: 80,
      borderRadius: 20,
      background: c.successBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 14px"
    }
  }, React.createElement(Check, {
    size: 48,
    color: c.success
  })), React.createElement("h2", {
    style: {
      color: c.success,
      fontSize: 20,
      margin: "0 0 4px",
      fontWeight: 800
    }
  }, "Attendance Marked!"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: 0
    }
  }, "Step 4 of 4 \xB7 Identity verified \xB7 Audit trail saved")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      background: c.bgDeep,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 10,
      background: photo?.color || c.accent,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      position: "relative",
      overflow: "hidden"
    }
  }, React.createElement("span", {
    style: {
      color: c.accentText,
      fontSize: 24,
      fontWeight: 800
    }
  }, photo?.initials || user.name.charAt(0)), React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(0,0,0,0.6)",
      color: "#fff",
      fontSize: 8,
      padding: "2px",
      textAlign: "center",
      fontWeight: 600
    }
  }, "\uD83D\uDCF7 LIVE")), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 700
    }
  }, "Photo Captured Silently"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginTop: 2
    }
  }, "Saved to audit log \xB7 ", now.toLocaleTimeString()), React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2
    }
  }, "Front camera \xB7 Encrypted \xB7 Admin-only access")), trusted ? React.createElement(Badge, {
    text: "\u2713 Trusted",
    color: "success"
  }) : React.createElement(Badge, {
    text: "\u26A0 New Device",
    color: "warn"
  })), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 14
    }
  }, [["👤 Name", user.name], ["🎯 Role", user.display], ["✅ Status", "Present (Auto-marked)"], ["🕐 Check-in", now.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric"
  })], ["📡 Network", network?.ssid + (network?.viaOTP ? " (OTP verified)" : "")], ["📍 Location", geo?.address || "Not available"], ["🌐 GPS", geo ? geo.lat.toFixed(4) + "° N, " + geo.lng.toFixed(4) + "° E ±" + geo.accuracy : "—"], ["💻 Device", detectDevice() + " · " + getBrowser()], ["🔒 IP Address", genIP()], ["🔐 Verification", method?.label || "Biometric"], ["🆔 Device ID", fingerprint]].map(([k, v]) => React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      fontSize: 10
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec
    }
  }, k), React.createElement("span", {
    style: {
      color: c.text,
      fontWeight: 600,
      fontFamily: k.includes("GPS") || k.includes("IP") || k.includes("Device ID") || k.includes("Check-in") ? "monospace" : "inherit",
      fontSize: 10,
      textAlign: "right",
      maxWidth: "60%",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, v)))), React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("p", {
    style: {
      color: c.textMuted,
      fontSize: 10,
      margin: "0 0 10px"
    }
  }, "Entering portal in ", count, "s..."), React.createElement("button", {
    onClick: onContinue,
    style: {
      background: c.accent,
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      padding: "10px 24px",
      color: c.accentText,
      fontSize: 12,
      fontWeight: 600
    }
  }, "Continue Now \u2192"))));
};

