const PortalAccessControl = ({
  access,
  setAccess
}) => {
  const toggle = (role, tabId) => {
    const current = access[role] || [];
    const next = current.includes(tabId) ? current.filter(x => x !== tabId) : [...current, tabId];
    setAccess({
      ...access,
      [role]: next
    });
  };
  return React.createElement("div", {
    style: {
      background: c.bgCard,
      border: "1px solid " + c.purple + "66",
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      paddingBottom: 10,
      borderBottom: "2px solid " + c.purple + "44"
    }
  }, React.createElement(Shield, {
    size: 16,
    color: c.purple
  }), React.createElement("h4", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 13,
      fontWeight: 700
    }
  }, "Portal Access Control (Super Admin Only)")), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 11,
      margin: "0 0 14px"
    }
  }, "Choose which tabs are visible to Team Leads and Teachers when they log in. Settings tab is always Super Admin only. Enabling a parent module (e.g. Operations) automatically grants all its sub-tabs; enabling only a sub-tab shows just that tab on its own."), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 11
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      padding: "9px 10px",
      textAlign: "left",
      color: c.textSec,
      fontWeight: 600,
      fontSize: 10,
      borderBottom: "1px solid " + c.border,
      background: c.bgDeep
    }
  }, "Tab / Module"), React.createElement("th", {
    style: {
      padding: "9px 10px",
      textAlign: "center",
      color: c.accent,
      fontWeight: 600,
      fontSize: 10,
      borderBottom: "1px solid " + c.border,
      background: c.bgDeep
    }
  }, "Team Lead"), React.createElement("th", {
    style: {
      padding: "9px 10px",
      textAlign: "center",
      color: c.success,
      fontWeight: 600,
      fontSize: 10,
      borderBottom: "1px solid " + c.border,
      background: c.bgDeep
    }
  }, "Teacher"))), React.createElement("tbody", null, NAV.filter(n => n.id !== "settings").map((n, i) => React.createElement("tr", {
    key: n.id,
    style: {
      borderBottom: "1px solid " + c.border,
      background: i % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, React.createElement("td", {
    style: {
      padding: "10px",
      color: c.text,
      fontWeight: 600
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(n.icon, {
    size: 13,
    color: c.accent
  }), n.label)), React.createElement("td", {
    style: {
      padding: "10px",
      textAlign: "center"
    }
  }, React.createElement(Toggle, {
    value: (access.teamlead || []).includes(n.id),
    onChange: () => toggle("teamlead", n.id)
  })), React.createElement("td", {
    style: {
      padding: "10px",
      textAlign: "center"
    }
  }, React.createElement(Toggle, {
    value: (access.teacher || []).includes(n.id),
    onChange: () => toggle("teacher", n.id)
  }))))))), React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setAccess({
      ...access,
      teamlead: DEFAULT_ACCESS.teamlead,
      teacher: DEFAULT_ACCESS.teacher
    }),
    style: {
      padding: "7px 14px",
      background: c.warnBg,
      border: "1px solid " + c.warn + "44",
      borderRadius: 6,
      cursor: "pointer",
      color: c.warn,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Reset to Defaults"), React.createElement("button", {
    onClick: () => setAccess({
      ...access,
      teamlead: NAV.filter(n => n.id !== "settings").map(n => n.id),
      teacher: NAV.filter(n => n.id !== "settings").map(n => n.id)
    }),
    style: {
      padding: "7px 14px",
      background: c.successBg,
      border: "1px solid " + c.success + "44",
      borderRadius: 6,
      cursor: "pointer",
      color: c.success,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Allow All (Except Settings)"), React.createElement("button", {
    onClick: () => setAccess({
      ...access,
      teamlead: [],
      teacher: []
    }),
    style: {
      padding: "7px 14px",
      background: c.dangerBg,
      border: "1px solid " + c.danger + "44",
      borderRadius: 6,
      cursor: "pointer",
      color: c.danger,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Block All")));
};

