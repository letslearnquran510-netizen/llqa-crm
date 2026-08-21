const Inp = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  options
}) => React.createElement("div", {
  style: {
    marginBottom: 12
  }
}, React.createElement("label", {
  style: {
    display: "block",
    color: c.textSec,
    fontSize: 10,
    marginBottom: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
}, label), options ? React.createElement("select", {
  value: value,
  onChange: e => onChange(e.target.value),
  style: {
    width: "100%",
    padding: "8px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box"
  }
}, React.createElement("option", {
  value: ""
}, "Select..."), options.map(o => {
  const v = typeof o === "object" ? o.value : o;
  const l = typeof o === "object" ? o.label : o;
  return React.createElement("option", {
    key: v,
    value: v
  }, l);
})) : React.createElement("input", {
  type: type,
  value: value,
  onChange: e => onChange(e.target.value),
  placeholder: placeholder,
  style: {
    width: "100%",
    padding: "8px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box"
  }
}));

