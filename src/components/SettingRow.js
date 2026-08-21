const SettingRow = ({
  label,
  desc,
  children
}) => React.createElement("div", {
  style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid " + c.border
  }
}, React.createElement("div", {
  style: {
    flex: 1,
    marginRight: 14
  }
}, React.createElement("div", {
  style: {
    color: c.text,
    fontSize: 12,
    fontWeight: 600
  }
}, label), desc && React.createElement("div", {
  style: {
    color: c.textSec,
    fontSize: 10,
    marginTop: 2
  }
}, desc)), React.createElement("div", {
  style: {
    flexShrink: 0
  }
}, children));

