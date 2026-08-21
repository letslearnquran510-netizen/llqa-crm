const Badge = ({
  text,
  color = "accent"
}) => {
  const m = {
    accent: [c.accent, c.accentText],
    success: [c.success, "#fff"],
    warn: [c.warn, c.warnText],
    danger: [c.danger, "#fff"],
    purple: [c.purple, c.purpleText],
    cyan: [c.cyan, c.cyanText]
  };
  const [bg, fg] = m[color] || m.accent;
  return React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      background: bg,
      color: fg,
      whiteSpace: "nowrap"
    }
  }, text);
};

