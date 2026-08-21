const SC = ({
  icon: I,
  label,
  value,
  sub,
  color = c.accent
}) => React.createElement("div", {
  style: {
    background: c.bgCard,
    backdropFilter: "blur(16px)",
    boxShadow: c.shadow3d,
    border: "1px solid " + c.border,
    borderRadius: 12,
    padding: "14px 16px",
    flex: 1,
    minWidth: 150
  }
}, React.createElement("div", {
  style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  }
}, React.createElement("div", null, React.createElement("p", {
  style: {
    color: c.textSec,
    fontSize: 10,
    margin: 0,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  }
}, label), React.createElement("h3", {
  style: {
    color: c.text,
    fontSize: 24,
    margin: "4px 0 0",
    fontWeight: 700
  }
}, value), sub && React.createElement("p", {
  style: {
    color: c.textSec,
    fontSize: 10,
    margin: "3px 0 0"
  }
}, sub)), React.createElement("div", {
  style: {
    background: color + "15",
    padding: 7,
    borderRadius: 8
  }
}, React.createElement(I, {
  size: 16,
  color: color
}))));

