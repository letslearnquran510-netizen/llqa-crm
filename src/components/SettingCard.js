const SettingCard = ({
  title,
  children,
  icon: I,
  color = c.accent
}) => React.createElement("div", {
  style: {
    background: c.bgCard,
    backdropFilter: "blur(16px)",
    boxShadow: c.shadow3d,
    border: "1px solid " + c.border,
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 12
  }
}, React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "2px solid " + color + "44"
  }
}, I && React.createElement(I, {
  size: 16,
  color: color
}), React.createElement("h4", {
  style: {
    color: c.text,
    margin: 0,
    fontSize: 13,
    fontWeight: 700
  }
}, title)), children);

