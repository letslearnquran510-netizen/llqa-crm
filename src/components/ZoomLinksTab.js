const ZoomLinksTab = ({
  teachers,
  onQuickEdit
}) => {
  const [q, setQ] = useState("");
  const [filt, setFilt] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const list = (teachers || []).filter(t => t.status === "active" || t.status === "new");
  const withLink = list.filter(t => t.zoom && String(t.zoom).trim());
  const missing = list.filter(t => !t.zoom || !String(t.zoom).trim());
  let shown = filt === "has" ? withLink : filt === "missing" ? missing : list;
  if (q) {
    const ql = q.toLowerCase();
    shown = shown.filter(t => [t.name, t.code, t.zoom].some(v => String(v || "").toLowerCase().includes(ql)));
  }
  const copyLink = t => {
    try {
      navigator.clipboard.writeText(t.zoom);
      setCopiedId(t.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {}
  };
  const inputStyle = {
    width: "100%",
    padding: "8px 12px 8px 30px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 7,
    color: c.text,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box"
  };
  const selStyle = {
    padding: "8px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 7,
    color: c.text,
    fontSize: 11
  };
  const actBtn = (bg, bd, col) => ({
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 11px",
    background: bg,
    border: "1px solid " + bd,
    borderRadius: 6,
    cursor: "pointer",
    color: col,
    fontSize: 10,
    fontWeight: 600,
    transition: "all 0.12s ease"
  });
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, [["Total Teachers", list.length, c.accent, Users], ["With Zoom Link", withLink.length, c.success, Video], ["Missing Link", missing.length, missing.length > 0 ? c.warn : c.textMuted, AlertTriangle]].map(a => React.createElement(SC, {
    key: a[0],
    icon: a[3],
    label: a[0],
    value: a[1],
    color: a[2]
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 200
    }
  }, React.createElement(Search, {
    size: 14,
    style: {
      position: "absolute",
      left: 10,
      top: 9,
      color: c.textMuted
    }
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search teacher, code, link...",
    style: inputStyle
  })), React.createElement("select", {
    value: filt,
    onChange: e => setFilt(e.target.value),
    style: selStyle
  }, React.createElement("option", {
    value: "all"
  }, "All Teachers"), React.createElement("option", {
    value: "has"
  }, "Has Link"), React.createElement("option", {
    value: "missing"
  }, "Missing Link"))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))",
      gap: 12
    }
  }, shown.map(t => {
    const has = t.zoom && String(t.zoom).trim();
    const isCopied = copiedId === t.id;
    return React.createElement("div", {
      key: t.id,
      style: {
        background: c.bgCard,
        backdropFilter: "blur(16px)",
        boxShadow: c.shadow3d,
        border: "1px solid " + (has ? c.border : c.warn + "44"),
        borderRadius: 12,
        padding: 16
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 9,
        background: "linear-gradient(135deg," + (t.gender === "Male" ? c.accent : c.purple) + "," + c.cyan + ")",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 700,
        color: c.accentText,
        flexShrink: 0
      }
    }, t.name[0]), React.createElement("div", null, React.createElement("div", {
      style: {
        color: c.text,
        fontSize: 13,
        fontWeight: 600
      }
    }, t.name), React.createElement("div", {
      style: {
        color: c.textSec,
        fontSize: 10,
        fontFamily: "monospace"
      }
    }, "Code: " + t.code))), React.createElement(Badge, {
      text: has ? "Active" : "No Link",
      color: has ? "success" : "warn"
    })), has ? React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: c.bgDeep,
        border: "1px solid " + c.border,
        borderRadius: 8,
        padding: "9px 12px",
        marginBottom: 10
      }
    }, React.createElement(Video, {
      size: 14,
      color: c.accent
    }), React.createElement("span", {
      style: {
        color: c.textSec,
        fontSize: 11,
        fontFamily: "monospace",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flex: 1
      }
    }, t.zoom)) : React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: c.warnBg,
        border: "1px dashed " + c.warn + "55",
        borderRadius: 8,
        padding: "9px 12px",
        marginBottom: 10
      }
    }, React.createElement(AlertTriangle, {
      size: 14,
      color: c.warn
    }), React.createElement("span", {
      style: {
        color: c.warn,
        fontSize: 11
      }
    }, "No zoom link set yet")), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, has && React.createElement("button", {
      onClick: () => copyLink(t),
      style: actBtn(isCopied ? c.successBg : c.bgDeep, isCopied ? c.success + "55" : c.border, isCopied ? c.success : c.textSec)
    }, React.createElement(isCopied ? Check : Copy, {
      size: 12
    }), isCopied ? "Copied!" : "Copy"), has && React.createElement("button", {
      onClick: () => window.open(t.zoom, "_blank", "noopener"),
      style: actBtn(c.accentBg, c.accent + "55", c.accent)
    }, React.createElement(ExternalLink, {
      size: 12
    }), "Join"), React.createElement("button", {
      onClick: () => onQuickEdit(t),
      style: Object.assign(actBtn(c.bgDeep, c.border, c.textSec), has ? {} : {
        marginLeft: "auto"
      })
    }, React.createElement(Edit2, {
      size: 12
    }), has ? "Edit" : "Set Link")));
  })), shown.length === 0 && React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 40,
      color: c.textMuted,
      fontSize: 12
    }
  }, "No teachers match your search/filter."));
};

