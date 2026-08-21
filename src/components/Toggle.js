const Toggle = ({
  value,
  onChange,
  size = "md"
}) => {
  const w = size === "sm" ? 32 : 40,
    h = size === "sm" ? 18 : 22;
  return React.createElement("button", {
    onClick: () => onChange(!value),
    style: {
      width: w,
      height: h,
      borderRadius: h / 2,
      border: "none",
      background: value ? c.success : c.border,
      cursor: "pointer",
      position: "relative",
      transition: "background .2s"
    }
  }, React.createElement("div", {
    style: {
      width: h - 4,
      height: h - 4,
      borderRadius: "50%",
      background: "#fff",
      position: "absolute",
      top: 2,
      left: value ? w - h + 2 : 2,
      transition: "left .2s",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)"
    }
  }));
};

