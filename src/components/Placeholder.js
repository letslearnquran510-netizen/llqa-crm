const Placeholder = ({
  title,
  icon: I
}) => React.createElement("div", {
  style: {
    textAlign: "center",
    padding: 60
  }
}, React.createElement("div", {
  style: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: c.accentBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px"
  }
}, React.createElement(I, {
  size: 28,
  color: c.accent
})), React.createElement("h2", {
  style: {
    color: c.text,
    fontSize: 20,
    margin: "0 0 6px"
  }
}, title), React.createElement("p", {
  style: {
    color: c.textSec,
    fontSize: 13
  }
}, "Coming next \u2014 will be built step by step"));

