const PBar = ({
  value,
  max = 100,
  color = c.accent
}) => React.createElement("div", {
  style: {
    width: "100%",
    height: 6,
    background: c.border,
    borderRadius: 3,
    overflow: "hidden"
  }
}, React.createElement("div", {
  style: {
    width: Math.min(value / max * 100, 100) + "%",
    height: "100%",
    background: color,
    borderRadius: 3
  }
}));

