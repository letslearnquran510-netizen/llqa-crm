const CustomSelect = ({
  options,
  value,
  onChange,
  style,
  placeholder = "Select..."
}) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const clickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const normalizedOptions = options.map(o => {
    return typeof o === "object" ? o : { label: String(o), value: String(o) };
  });
  
  const selectedOpt = normalizedOptions.find(o => String(o.value) === String(value));

  return React.createElement("div", {
    ref,
    style: {
      position: "relative",
      width: "100%",
      ...style
    }
  }, React.createElement("div", {
    onClick: () => setOpen(!open),
    style: {
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + (open ? c.accent : c.border),
      borderRadius: 6,
      color: value ? c.text : c.textSec,
      fontSize: 12,
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 34,
      boxSizing: "border-box"
    }
  }, selectedOpt ? selectedOpt.label : placeholder, React.createElement(ChevronDown, {
    size: 14,
    color: c.textSec
  })), open && React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      background: c.bgCard,
      backdropFilter: "blur(12px)",
      border: "1px solid " + c.border,
      borderRadius: 6,
      marginTop: 4,
      zIndex: 999999,
      boxShadow: c.shadow3d,
      maxHeight: 250,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      padding: "4px 0"
    }
  }, React.createElement("div", {
    onClick: () => {
      onChange("");
      setOpen(false);
    },
    style: {
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: 12,
      color: !value ? c.accent : c.textSec,
      background: !value ? c.bgHover : "transparent",
      display: "flex",
      alignItems: "center"
    },
    onMouseEnter: e => {
      if (value) e.currentTarget.style.background = c.bgHover;
    },
    onMouseLeave: e => {
      if (value) e.currentTarget.style.background = "transparent";
    }
  }, placeholder), normalizedOptions.map(o => React.createElement("div", {
    key: o.value,
    onClick: () => {
      onChange(o.value);
      setOpen(false);
    },
    style: {
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: 12,
      color: String(o.value) === String(value) ? c.accent : c.text,
      background: String(o.value) === String(value) ? c.bgHover : "transparent",
      display: "flex",
      alignItems: "center"
    },
    onMouseEnter: e => {
      if (String(o.value) !== String(value)) e.currentTarget.style.background = c.bgHover;
    },
    onMouseLeave: e => {
      if (String(o.value) !== String(value)) e.currentTarget.style.background = "transparent";
    }
  }, o.label))));
};
