const BiometricScreen = ({
  user,
  network,
  onVerified,
  onCancel
}) => {
  const [device] = useState(detectDevice());
  const [method, setMethod] = useState(null);
  const [phase, setPhase] = useState("choose");
  const [pin, setPin] = useState("");
  const [pattern, setPattern] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const methods = device === "Mobile" ? [{
    id: "fingerprint",
    label: "Fingerprint",
    icon: Shield,
    col: c.accent,
    desc: "Touch the sensor"
  }, {
    id: "face",
    label: "Face ID",
    icon: Eye,
    col: c.purple,
    desc: "Look at camera"
  }, {
    id: "pattern",
    label: "Pattern Lock",
    icon: LayoutDashboard,
    col: c.cyan,
    desc: "Draw your pattern"
  }, {
    id: "pin",
    label: "PIN Code",
    icon: Settings,
    col: c.warn,
    desc: "6-digit PIN"
  }] : [{
    id: "windowshello",
    label: "Windows Hello",
    icon: Shield,
    col: c.accent,
    desc: "System verification"
  }, {
    id: "pin",
    label: "Device PIN",
    icon: Settings,
    col: c.purple,
    desc: "Enter your PIN"
  }, {
    id: "password",
    label: "Password",
    icon: Settings,
    col: c.warn,
    desc: "System password"
  }];
  const startScan = m => {
    setMethod(m);
    setPhase("scanning");
    if (m.id === "fingerprint" || m.id === "face" || m.id === "windowshello") {
      setTimeout(() => {
        setPhase("success");
        setTimeout(() => onVerified(m), 900);
      }, 2200);
    }
  };
  const submitPin = () => {
    if (pin.length < 4) return;
    setPhase("scanning");
    setTimeout(() => {
      if (pin === "0000") {
        setPhase("failed");
        setAttempts(attempts + 1);
        setPin("");
        return;
      }
      setPhase("success");
      setTimeout(() => onVerified(method), 800);
    }, 800);
  };
  const togglePattern = n => {
    if (pattern.includes(n)) return;
    const next = [...pattern, n];
    setPattern(next);
    if (next.length >= 4) {
      setTimeout(() => {
        setPhase("scanning");
        setTimeout(() => {
          setPhase("success");
          setTimeout(() => onVerified(method), 800);
        }, 900);
      }, 200);
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
      marginBottom: 20
    }
  }, React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 16,
      background: phase === "success" ? c.successBg : phase === "failed" ? c.dangerBg : c.purpleBg,
      border: "2px solid " + (phase === "success" ? c.success : phase === "failed" ? c.danger : c.purple),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 14px"
    }
  }, phase === "success" ? React.createElement(Check, {
    size: 30,
    color: c.success
  }) : phase === "failed" ? React.createElement(X, {
    size: 30,
    color: c.danger
  }) : React.createElement(Shield, {
    size: 30,
    color: c.purple
  })), React.createElement("h2", {
    style: {
      color: c.text,
      fontSize: 18,
      margin: "0 0 4px",
      fontWeight: 700
    }
  }, phase === "success" ? "Verified ✓" : "Biometric Verification"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: 0
    }
  }, "Step 2 of 3 \xB7 ", device, " \xB7 Network: ", network?.ssid)), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 20
    }
  }, React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      background: "linear-gradient(135deg," + c.accent + "," + c.purple + ")",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      color: c.accentText
    }
  }, user.name.charAt(0).toUpperCase()), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, user.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, user.display))), phase === "choose" && React.createElement(React.Fragment, null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Choose Verification Method"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: device === "Mobile" ? "1fr 1fr" : "1fr",
      gap: 8
    }
  }, methods.map(m => React.createElement("button", {
    key: m.id,
    onClick: () => m.id === "pin" || m.id === "password" || m.id === "pattern" ? (setMethod(m), setPhase("input")) : startScan(m),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 9,
      cursor: "pointer",
      textAlign: "left"
    },
    onMouseEnter: e => e.currentTarget.style.borderColor = m.col,
    onMouseLeave: e => e.currentTarget.style.borderColor = c.border
  }, React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: m.col + "22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, React.createElement(m.icon, {
    size: 17,
    color: m.col
  })), React.createElement("div", {
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
  }, m.label), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      marginTop: 1
    }
  }, m.desc)))))), phase === "scanning" && method && React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "24px 0"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      width: 120,
      height: 120,
      margin: "0 auto 16px"
    }
  }, React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      border: "3px solid " + method.col + "33",
      borderRadius: "50%"
    }
  }), React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      border: "3px solid " + method.col,
      borderTopColor: "transparent",
      borderRadius: "50%",
      animation: "spin 1.2s linear infinite"
    }
  }), React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(method.icon, {
    size: 42,
    color: method.col
  }))), React.createElement("p", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 4px",
      fontWeight: 600
    }
  }, method.id === "fingerprint" ? "Place your finger on the sensor" : method.id === "face" ? "Look at the camera" : method.id === "windowshello" ? "Verifying with Windows Hello" : method.id === "pattern" ? "Verifying pattern" : method.id === "pin" || method.id === "password" ? "Verifying..." : ""), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 10,
      margin: "0 0 10px"
    }
  }, "Please hold still \xB7 Encrypted secure channel"), React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 20,
      fontSize: 9,
      color: c.textMuted
    }
  }, React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: c.danger,
      animation: "spin 1s linear infinite"
    }
  }), "\uD83D\uDCF7 Silent photo capture in progress")), phase === "input" && method && method.id === "pin" && React.createElement("div", null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Enter your ", method.label), React.createElement("input", {
    type: "password",
    value: pin,
    onChange: e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6)),
    maxLength: 6,
    placeholder: "Enter PIN",
    autoFocus: true,
    style: {
      width: "100%",
      padding: "14px 16px",
      background: c.bgDeep,
      border: "2px solid " + c.border,
      borderRadius: 10,
      color: c.text,
      fontSize: 18,
      outline: "none",
      boxSizing: "border-box",
      letterSpacing: 8,
      textAlign: "center",
      fontFamily: "monospace"
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 6,
      marginTop: 10
    }
  }, [1, 2, 3, 4, 5, 6].map(i => React.createElement("div", {
    key: i,
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: pin.length >= i ? c.accent : c.border
    }
  }))), attempts > 0 && React.createElement("div", {
    style: {
      color: c.danger,
      fontSize: 11,
      marginTop: 10,
      textAlign: "center"
    }
  }, "Incorrect PIN. ", 3 - attempts, " attempts remaining."), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setPhase("choose")
  }, "Back"), React.createElement(Btn, {
    onClick: submitPin,
    icon: Check
  }, "Verify")), React.createElement("p", {
    style: {
      color: c.textMuted,
      fontSize: 9,
      marginTop: 10,
      textAlign: "center"
    }
  }, 'Demo: any 4-6 digit PIN works \xB7 Try "0000" for failure')), phase === "input" && method && method.id === "password" && React.createElement("div", null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600
    }
  }, "Enter your device password"), React.createElement("input", {
    type: "password",
    value: pin,
    onChange: e => setPin(e.target.value),
    placeholder: "System password",
    autoFocus: true,
    style: {
      width: "100%",
      padding: "12px 14px",
      background: c.bgDeep,
      border: "2px solid " + c.border,
      borderRadius: 8,
      color: c.text,
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box"
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setPhase("choose")
  }, "Back"), React.createElement(Btn, {
    onClick: submitPin,
    icon: Check
  }, "Verify"))), phase === "input" && method && method.id === "pattern" && React.createElement("div", null, React.createElement("h4", {
    style: {
      color: c.text,
      fontSize: 13,
      margin: "0 0 10px",
      fontWeight: 600,
      textAlign: "center"
    }
  }, "Draw your pattern"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 14,
      maxWidth: 240,
      margin: "14px auto",
      padding: 14,
      background: c.bgDeep,
      borderRadius: 12
    }
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => React.createElement("button", {
    key: n,
    onClick: () => togglePattern(n),
    style: {
      aspectRatio: "1",
      borderRadius: "50%",
      border: "3px solid " + (pattern.includes(n) ? c.accent : c.border),
      background: pattern.includes(n) ? c.accentBg : "transparent",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 700,
      color: pattern.includes(n) ? c.accent : c.textMuted
    }
  }, pattern.includes(n) ? pattern.indexOf(n) + 1 : ""))), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textAlign: "center",
      margin: "0 0 10px"
    }
  }, "Tap dots in sequence (min 4 dots) \xB7 ", pattern.length, " selected"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => {
      setPattern([]);
      setPhase("choose");
    }
  }, "Back"), React.createElement(Btn, {
    variant: "outline",
    onClick: () => setPattern([])
  }, "Reset"))), phase === "success" && React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "20px 0"
    }
  }, React.createElement("div", {
    style: {
      color: c.success,
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 6
    }
  }, "Identity Verified Successfully"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Marking your attendance & opening portal...")), phase === "failed" && React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "10px 0"
    }
  }, React.createElement("div", {
    style: {
      color: c.danger,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6
    }
  }, "Verification Failed"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginBottom: 14
    }
  }, "Attempts: ", attempts, "/3 \xB7 Try again or use a different method"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "center"
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setPhase("choose")
  }, "Choose Another"), React.createElement(Btn, {
    onClick: () => setPhase("input")
  }, "Retry")))), React.createElement("div", {
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
  }, "\u2190 Cancel & restart"))));
};

