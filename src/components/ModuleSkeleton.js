const ModuleSkeleton = ({
  title,
  role,
  subSheets,
  icon: I,
  color
}) => {
  const [tab, setTab] = useState(subSheets[0].id);
  const active = subSheets.find(s => s.id === tab) || subSheets[0];
  const co = color || c.accent;
  const sc = active.status === "exists" ? c.success : active.status === "partial" ? c.warn : c.accent;
  const sl = active.status === "exists" ? "Fully Implemented" : active.status === "partial" ? "Partially Built" : "To Build";
  return React.createElement("div", {
    style: {
      padding: 24
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: co + "22",
      border: "1px solid " + co + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(I, {
    size: 24,
    color: co
  })), React.createElement("div", null, React.createElement("h1", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 22,
      fontWeight: 700
    }
  }, title), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4,
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement("span", null, "Access: "), React.createElement("span", {
    style: {
      color: c.textSec,
      fontWeight: 600,
      padding: "2px 8px",
      background: c.bgDeep,
      borderRadius: 4,
      border: "1px solid " + c.border,
      fontSize: 10
    }
  }, role)))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 16,
      flexWrap: "wrap",
      borderBottom: "1px solid " + c.border,
      paddingBottom: 10
    }
  }, subSheets.map(s => React.createElement("button", {
    key: s.id,
    onClick: () => setTab(s.id),
    style: {
      padding: "7px 14px",
      borderRadius: 6,
      border: tab === s.id ? "1px solid transparent" : "1px solid " + c.border,
      cursor: "pointer",
      fontSize: 11,
      fontWeight: tab === s.id ? 600 : 500,
      background: tab === s.id ? c.accent : "transparent",
      color: tab === s.id ? c.accentText : c.textSec
    }
  }, s.label))), React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 12,
      padding: 28
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 220
    }
  }, React.createElement("h2", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 17,
      fontWeight: 600
    }
  }, active.label), active.desc && React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 12,
      marginTop: 6,
      lineHeight: 1.5,
      maxWidth: 560
    }
  }, active.desc)), React.createElement("span", {
    style: {
      padding: "4px 10px",
      background: sc + "22",
      color: sc,
      borderRadius: 5,
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      border: "1px solid " + sc + "55",
      whiteSpace: "nowrap"
    }
  }, sl)), active.existingAt && React.createElement("div", {
    style: {
      padding: "10px 14px",
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 8,
      marginBottom: 18,
      fontSize: 11,
      color: c.textSec
    }
  }, React.createElement("span", {
    style: {
      color: c.success,
      fontWeight: 700
    }
  }, "\u2713 Currently working in: "), React.createElement("span", {
    style: {
      color: c.text,
      fontWeight: 600
    }
  }, active.existingAt), React.createElement("div", {
    style: {
      marginTop: 4,
      color: c.textMuted,
      fontSize: 10
    }
  }, "Will be unified into this module in the next phase.")), active.fields && active.fields.length > 0 && React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 10
    }
  }, "Field Structure"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, active.fields.map(f => React.createElement("span", {
    key: f,
    style: {
      padding: "5px 11px",
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.textSec,
      fontSize: 10,
      fontFamily: "monospace",
      fontWeight: 500
    }
  }, f))))));
};

