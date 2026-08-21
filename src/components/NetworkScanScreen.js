const NetworkScanScreen = ({
  onConnected,
  onCancel,
  isWFH,
  userRole
}) => {
  const [phase, setPhase] = useState("scanning");
  const [networks, setNetworks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const generatedOtp = "284619";
  useEffect(() => {
    const t = setTimeout(() => {
      setNetworks(NETWORK_OPTIONS);
      setPhase("choose");
    }, 1400);
    return () => clearTimeout(t);
  }, []);
  const tryConnect = n => {
    setSelected(n);
    if (n.allowed) {
      setPhase("connecting");
      setTimeout(() => onConnected({
        ...n,
        viaOTP: false
      }), 1000);
      return;
    }
    if (isWFH && n.homeNet) {
      setPhase("otp");
      setOtpSent(false);
      setTimeout(() => setOtpSent(true), 800);
      return;
    }
    setPhase("denied");
  };
  const verifyOtp = () => {
    setOtpError("");
    if (otp === generatedOtp || otp === "000000") {
      setPhase("connecting");
      setTimeout(() => onConnected({
        ...selected,
        viaOTP: true
      }), 800);
    } else {
      setOtpError("Invalid OTP. Check your registered phone for the 6-digit code.");
    }
  };
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
      maxWidth: 460
    }
  }, React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 24
    }
  }, React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 16,
      background: phase === "denied" ? c.dangerBg : c.accentBg,
      border: "2px solid " + (phase === "denied" ? c.danger : c.accent),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 14px",
      position: "relative"
    }
  }, React.createElement(Globe, {
    size: 30,
    color: phase === "denied" ? c.danger : c.accent
  }), phase === "scanning" && React.createElement("div", {
    style: {
      position: "absolute",
      inset: -4,
      border: "2px solid " + c.accent,
      borderRadius: 18,
      borderTopColor: "transparent",
      animation: "spin 1s linear infinite"
    }
  })), React.createElement("h2", {
    style: {
      color: c.text,
      fontSize: 18,
      margin: "0 0 4px",
      fontWeight: 700
    }
  }, "Network Security Check"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: 0
    }
  }, "Step 1 of 4 \xB7 ", isWFH ? "WFH user — academy WiFi or verified home network" : "On-site user — academy WiFi only")), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 20
    }
  }, phase === "scanning" && React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "30px 0"
    }
  }, React.createElement("div", {
    style: {
      display: "inline-block",
      width: 36,
      height: 36,
      border: "3px solid " + c.border,
      borderTopColor: c.accent,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }
  }), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      marginTop: 14
    }
  }, "Scanning available networks...")), (phase === "choose" || phase === "connecting") && React.createElement(React.Fragment, null, isWFH && React.createElement("div", {
    style: {
      background: c.cyan + "22",
      border: "1px solid " + c.cyan + "66",
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 12,
      color: c.cyan,
      fontSize: 10,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(Globe, {
    size: 14
  }), "WFH user detected \u2014 home network allowed with OTP verification"), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    }
  }, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: 0,
      fontWeight: 600
    }
  }, "Available Networks (", networks.length, ")"), React.createElement("button", {
    onClick: () => {
      setPhase("scanning");
      setTimeout(() => setPhase("choose"), 1000);
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.accent,
      fontSize: 11
    }
  }, "\u21BB Rescan")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      maxHeight: 340,
      overflowY: "auto"
    }
  }, networks.map(n => {
    const accessible = n.allowed || isWFH && n.homeNet;
    return React.createElement("button", {
      key: n.ssid,
      onClick: () => tryConnect(n),
      disabled: phase === "connecting",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: selected?.ssid === n.ssid ? c.accentBg : c.bgDeep,
        border: "1px solid " + (selected?.ssid === n.ssid ? c.accent : accessible ? c.border : c.danger + "33"),
        borderRadius: 8,
        cursor: phase === "connecting" ? "wait" : "pointer",
        textAlign: "left"
      }
    }, React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 7,
        background: n.allowed ? c.successBg : n.homeNet ? c.warnBg : c.dangerBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, React.createElement(Globe, {
      size: 15,
      color: n.allowed ? c.success : n.homeNet ? c.warn : c.danger
    })), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
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
    }, n.ssid), n.allowed && React.createElement(Badge, {
      text: "\u2713 Academy",
      color: "success"
    }), !n.allowed && n.homeNet && isWFH && React.createElement(Badge, {
      text: "OTP Required",
      color: "warn"
    }), !n.allowed && !(isWFH && n.homeNet) && React.createElement(Badge, {
      text: "Blocked",
      color: "danger"
    })), React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 9,
        marginTop: 2
      }
    }, n.signal, " signal \xB7 ", n.speed, " \xB7 ", n.secure ? "🔒 WPA2" : "⚠ Open")), selected?.ssid === n.ssid && phase === "connecting" && React.createElement("div", {
      style: {
        width: 14,
        height: 14,
        border: "2px solid " + c.accent,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite"
      }
    }));
  })), phase === "connecting" && React.createElement("div", {
    style: {
      marginTop: 12,
      textAlign: "center",
      color: c.accent,
      fontSize: 11
    }
  }, "Authenticating with ", selected?.ssid, "...")), phase === "otp" && React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10
    }
  }, React.createElement("button", {
    onClick: () => {
      setPhase("choose");
      setOtp("");
      setOtpError("");
    },
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(ChevronLeft, {
    size: 16
  })), React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: 0,
      fontWeight: 600
    }
  }, "WFH Network Verification")), React.createElement("div", {
    style: {
      background: c.warnBg,
      border: "1px solid " + c.warn + "44",
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      color: c.warn,
      fontSize: 11,
      fontWeight: 600,
      marginBottom: 3
    }
  }, "\uD83D\uDCF1 OTP sent to your registered phone"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "Network: ", selected?.ssid, " \xB7 Demo OTP: ", React.createElement("strong", {
    style: {
      color: c.text,
      fontFamily: "monospace"
    }
  }, generatedOtp))), React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      marginBottom: 4,
      fontWeight: 500
    }
  }, "Enter 6-digit OTP"), React.createElement("input", {
    type: "text",
    value: otp,
    onChange: e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)),
    maxLength: 6,
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022",
    autoFocus: true,
    style: {
      width: "100%",
      padding: "12px 16px",
      background: c.bgDeep,
      border: "2px solid " + c.border,
      borderRadius: 8,
      color: c.text,
      fontSize: 18,
      outline: "none",
      boxSizing: "border-box",
      letterSpacing: 8,
      textAlign: "center",
      fontFamily: "monospace"
    }
  })), otpError && React.createElement("div", {
    style: {
      color: c.danger,
      fontSize: 11,
      marginBottom: 10
    }
  }, otpError), React.createElement(Btn, {
    onClick: verifyOtp,
    icon: Shield
  }, "Verify OTP & Continue"), React.createElement("p", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 10,
      textAlign: "center"
    }
  }, "Didn't receive? ", React.createElement("span", {
    style: {
      color: c.accent,
      cursor: "pointer"
    }
  }, "Resend OTP"), " \xB7 Code expires in 5 min")), phase === "denied" && React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "10px 0"
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
  }, React.createElement(X, {
    size: 24,
    color: c.danger
  })), React.createElement("h4", {
    style: {
      color: c.danger,
      fontSize: 14,
      margin: "0 0 6px",
      fontWeight: 700
    }
  }, "Access Denied"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 14px",
      lineHeight: 1.5
    }
  }, '"', React.createElement("strong", {
    style: {
      color: c.text
    }
  }, selected?.ssid), '" is not authorized.', React.createElement("br", null), isWFH ? "This network type is not allowed for WFH login." : "On-site teachers must be on academy WiFi.", React.createElement("br", null), React.createElement("strong", {
    style: {
      color: c.danger
    }
  }, "This blocked attempt has been logged.")), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 14,
      textAlign: "left"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 6,
      fontWeight: 600
    }
  }, "Allowed Networks"), ALLOWED_NETWORKS.map(s => React.createElement("div", {
    key: s,
    style: {
      color: c.success,
      fontSize: 10,
      padding: "2px 0"
    }
  }, "\u2713 ", s)), isWFH && React.createElement("div", {
    style: {
      color: c.warn,
      fontSize: 10,
      padding: "2px 0",
      marginTop: 4,
      borderTop: "1px solid " + c.border,
      paddingTop: 6
    }
  }, "\u26A1 Home WiFi or Mobile Data (with OTP verification)")), React.createElement(Btn, {
    variant: "outline",
    onClick: () => setPhase("choose")
  }, "Try Another Network"))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement("button", {
    onClick: onCancel,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textMuted,
      fontSize: 11
    }
  }, "\u2190 Back to role selection"))));
};

