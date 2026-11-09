// v69: a tinted icon tile and a fine divider — calm, consistent section headers
const SettingCard = ({ title, children, icon: I, color = c.accent }) =>
  React.createElement(
    "div",
    {
      style: {
        background: c.bgCard,
        backdropFilter: "blur(16px)",
        boxShadow: c.shadow3d,
        border: "1px solid " + c.border,
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 14,
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
          paddingBottom: 12,
          borderBottom: "1px solid " + c.border,
        },
      },
      I &&
        React.createElement(
          "span",
          { style: { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: llqaAlpha(color, "22"), boxShadow: "inset 0 0 0 1px " + llqaAlpha(color, "33"), flexShrink: 0 } },
          React.createElement(I, { size: 15, color: color }),
        ),
      React.createElement("h4", { style: { color: c.text, margin: 0, fontSize: 13.5, fontWeight: 700, letterSpacing: -0.1 } }, title),
    ),
    children,
  );
