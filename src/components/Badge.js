const Badge = ({ text, color = "accent" }) => {
  // v68: soft tag — tinted background, text in its own (readable) colour, fine ring; both themes
  const m = {
    accent: [c.accent, c.accentBg],
    success: [c.success, c.successBg],
    warn: [c.warn, c.warnBg],
    danger: [c.danger, c.dangerBg],
    purple: [c.purple, c.purpleBg],
    cyan: [c.cyan, c.cyanBg],
  };
  const [fg, bg] = m[color] || m.accent;
  return React.createElement(
    "span",
    {
      style: {
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.2,
        background: bg,
        color: fg,
        boxShadow: "inset 0 0 0 1px " + llqaAlpha(fg, "45"),
        whiteSpace: "nowrap",
      },
    },
    text,
  );
};
