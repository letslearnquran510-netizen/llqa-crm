const Btn = ({ children, onClick, variant = "primary", icon: I, disabled }) => {
  // v68: main = accent gradient with a soft glow; danger = readable red; others = tinted accent
  const s =
    variant === "primary"
      ? {
          background: c.gradientPrimary,
          color: c.accentText,
          border: "1px solid " + c.accentBorder,
          boxShadow: c.glowPrimary,
        }
      : variant === "danger"
        ? {
            background: c.dangerFill,
            color: c.dangerText,
            border: "1px solid " + c.dangerFill,
            boxShadow: "0 6px 16px -8px " + llqaAlpha(c.dangerFill, "aa"),
          }
        : {
            background: c.accentBg,
            color: c.accent,
            border: "1px solid " + llqaAlpha(c.accent, "55"),
            backdropFilter: "blur(8px)",
          };
  return React.createElement(
    "button",
    {
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
        opacity: disabled ? 0.5 : 1,
      },
    },
    I &&
      React.createElement(I, {
        size: 13,
      }),
    // v69: "💬 Message" → message icon + "Message" (same on every computer, in the button's colour)
    !I && typeof children === "string" ? llqaIconize(children, { size: 13, keep: true, gap: 0 }) : children,
  );
};
