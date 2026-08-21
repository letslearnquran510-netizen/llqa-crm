const Btn = ({
  children,
  onClick,
  variant = "primary",
  icon: I,
  disabled
}) => {
  const s = variant === "primary" ? {
    background: c.accent,
    color: c.accentText,
    border: "1px solid " + c.accentBorder,
    boxShadow: c.glowPrimary
  } : variant === "danger" ? {
    background: c.danger,
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)"
  } : {
    background: "rgba(255,255,255,0.02)",
    color: c.accent,
    border: "1px solid " + c.accent,
    backdropFilter: "blur(8px)"
  };
  return React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      ...s,
      padding: "8px 16px",
      borderRadius: 7,
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: 12,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      opacity: disabled ? 0.5 : 1
    }
  }, I && React.createElement(I, {
    size: 13
  }), children);
};

