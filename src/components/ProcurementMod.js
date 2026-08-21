const ProcurementMod = ({
  procInventory,
  setProcInventory,
  procPurchases,
  setProcPurchases
}) => {
  const [tab, setTab] = useState("inventory");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const ICATS = ["Stationery", "Books", "IT Equipment", "Furniture", "Software License", "Office Supplies", "Teaching Material", "Other"];
  const UNITS = ["pcs", "box", "pack", "ream", "license", "set", "kg"];
  const PSTATUS = ["Ordered", "Shipped", "Received", "Cancelled"];
  const CURRENCIES = ["PKR", "USD", "GBP", "EUR", "AED"];
  const AUTHFOR = ["Anyone", "Teachers", "Team Leads", "Managers", "Admin Only"];
  const CUSTODY = ["In Store", "Issued", "Returned", "Under Repair", "Lost"];
  const RROLES = ["", "Teacher", "Team Lead", "Manager", "Admin", "Other"];
  const CONDITION = ["New", "Good", "Fair", "Damaged"];
  const custColor = {
    "In Store": "success",
    Issued: "accent",
    Returned: "cyan",
    "Under Repair": "warn",
    Lost: "danger"
  };
  const inv = procInventory || [];
  const pos = procPurchases || [];
  const num = n => Number(n || 0);
  const fmt = n => num(n).toLocaleString(void 0, {
    maximumFractionDigits: 2
  });
  const today = todayPK();
  const stockState = it => num(it.onHand) <= 0 ? "Out" : num(it.onHand) <= num(it.reorderPoint) ? "Low" : "OK";
  const stColor = {
    Out: "danger",
    Low: "warn",
    OK: "success"
  };
  const poColor = {
    Ordered: "accent",
    Shipped: "warn",
    Received: "success",
    Cancelled: "danger"
  };
  const oAddItem = () => {
    setForm({
      name: "",
      sku: "",
      category: "Office Supplies",
      onHand: "",
      unit: "pcs",
      reorderPoint: "",
      unitValue: "",
      location: "",
      authorizedFor: "Anyone",
      custodyStatus: "In Store",
      issuedTo: "",
      receiverRole: "",
      issuedBy: "",
      issueDate: "",
      returnDate: "",
      condition: "New",
      notes: ""
    });
    setModal({
      type: "item"
    });
  };
  const oEditItem = it => {
    setForm({
      ...it
    });
    setModal({
      type: "itemEdit",
      data: it
    });
  };
  const saveItem = () => {
    if (!form.name || !form.name.trim()) {
      alert("Please enter an item name.");
      return;
    }
    const rec = {
      ...form,
      onHand: num(form.onHand),
      reorderPoint: num(form.reorderPoint),
      unitValue: num(form.unitValue),
      updated: today
    };
    if (modal.type === "itemEdit") setProcInventory(inv.map(x => x.id === form.id ? rec : x));else setProcInventory([...inv, {
      ...rec,
      id: Date.now()
    }]);
    setModal(null);
  };
  const oAddPO = () => {
    setForm({
      poNum: "PO-" + String(pos.length + 1).padStart(4, "0"),
      date: todayPK(),
      vendor: "",
      item: "",
      qty: "",
      unitCost: "",
      currency: "PKR",
      status: "Ordered",
      receivedDate: "",
      notes: ""
    });
    setModal({
      type: "po"
    });
  };
  const oEditPO = p => {
    setForm({
      ...p
    });
    setModal({
      type: "poEdit",
      data: p
    });
  };
  const savePO = () => {
    if (!form.vendor || !form.vendor.trim()) {
      alert("Please enter a vendor.");
      return;
    }
    if (!form.item || !form.item.trim()) {
      alert("Please enter an item.");
      return;
    }
    const rec = {
      ...form,
      qty: num(form.qty),
      unitCost: num(form.unitCost)
    };
    if (modal.type === "poEdit") setProcPurchases(pos.map(x => x.id === form.id ? rec : x));else setProcPurchases([...pos, {
      ...rec,
      id: Date.now()
    }]);
    setModal(null);
  };
  const oDel = (kind, r) => setModal({
    type: "del",
    kind,
    data: r
  });
  const doDel = () => {
    if (modal.kind === "item") setProcInventory(inv.filter(x => x.id !== modal.data.id));else setProcPurchases(pos.filter(x => x.id !== modal.data.id));
    setModal(null);
  };
  const lowStock = inv.filter(it => stockState(it) !== "OK");
  const invValue = inv.reduce((a, it) => a + num(it.onHand) * num(it.unitValue), 0);
  const poTotal = p => num(p.qty) * num(p.unitCost);
  const poSpend = pos.filter(p => p.status !== "Cancelled").reduce((a, p) => a + poTotal(p), 0);
  const matchS = vals => {
    if (!search) return true;
    const q = search.toLowerCase();
    return vals.some(x => String(x || "").toLowerCase().includes(q));
  };
  const thS = {
    padding: "9px 10px",
    textAlign: "left",
    color: c.textSec,
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    borderBottom: "1px solid " + c.border,
    background: c.bgDeep,
    whiteSpace: "nowrap"
  };
  const tdS = {
    padding: "8px 10px",
    color: c.textSec
  };
  const Table = (rows, cols, empty) => React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: 10,
      border: "1px solid " + c.border
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 11
    }
  }, React.createElement("thead", null, React.createElement("tr", null, cols.map((col, ci) => React.createElement("th", {
    key: ci,
    style: thS
  }, col.h)))), React.createElement("tbody", null, rows.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: cols.length,
    style: {
      padding: 32,
      textAlign: "center",
      color: c.textMuted,
      fontSize: 12
    }
  }, empty)) : rows.map((r, ri) => React.createElement("tr", {
    key: ri,
    style: {
      borderBottom: "1px solid " + c.border,
      background: ri % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, cols.map((col, ci) => React.createElement("td", {
    key: ci,
    style: {
      ...tdS,
      ...(col.tdStyle || {})
    }
  }, col.render(r))))))));
  const money = (n, cur) => React.createElement("span", {
    style: {
      fontWeight: 600,
      color: c.text
    }
  }, fmt(n), " ", React.createElement("span", {
    style: {
      fontSize: 9,
      color: c.textMuted
    }
  }, cur || "PKR"));
  const tabs = [["inventory", "Inventory"], ["purchases", "Purchase Orders"], ["lowstock", "Low Stock"], ["issued", "Issued Items"], ["suppliers", "Suppliers"], ["analytics", "Analytics"]];
  const addBtn = tab === "purchases" ? React.createElement(Btn, {
    icon: Plus,
    onClick: oAddPO
  }, "New PO") : tab === "inventory" || tab === "lowstock" ? React.createElement(Btn, {
    icon: Plus,
    onClick: oAddItem
  }, "Add Item") : null;
  const exportCSV = () => {
    const safe = v => '"' + String(v == null ? "" : v).split('"').join('""') + '"';
    let cols, rows, name;
    if (tab === "purchases") {
      cols = ["PO #", "Date", "Vendor", "Item", "Qty", "Unit Cost", "Total", "Currency", "Status", "Received"];
      rows = pos.filter(p => matchS([p.poNum, p.vendor, p.item])).map(p => [p.poNum, p.date, p.vendor, p.item, num(p.qty), num(p.unitCost), poTotal(p), p.currency, p.status, p.receivedDate]);
      name = "Purchase-Orders";
    } else if (tab === "suppliers") {
      cols = ["Vendor", "Orders", "Total Spend"];
      const g = {};
      pos.forEach(p => {
        const k = p.vendor || "\u2014";
        if (!g[k]) g[k] = {
          n: 0,
          t: 0
        };
        g[k].n++;
        if (p.status !== "Cancelled") g[k].t += poTotal(p);
      });
      rows = Object.keys(g).map(k => [k, g[k].n, g[k].t]);
      name = "Suppliers";
    } else {
      cols = ["Item", "SKU", "Category", "On Hand", "Unit", "Reorder Point", "Unit Value", "Stock Value", "Location", "Status"];
      rows = inv.filter(it => matchS([it.name, it.sku, it.category])).map(it => [it.name, it.sku, it.category, num(it.onHand), it.unit, num(it.reorderPoint), num(it.unitValue), num(it.onHand) * num(it.unitValue), it.location, stockState(it)]);
      name = "Inventory";
    }
    let csv = cols.join(",") + "\n";
    rows.forEach(r => {
      csv += r.map(safe).join(",") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const invCols = [{
    h: "Item",
    render: it => React.createElement("div", null, React.createElement("div", {
      style: {
        fontWeight: 600,
        color: c.text
      }
    }, it.name || "\u2014"), it.sku && React.createElement("div", {
      style: {
        fontSize: 10,
        color: c.textMuted,
        fontFamily: "monospace"
      }
    }, it.sku))
  }, {
    h: "Category",
    render: it => React.createElement(Badge, {
      text: it.category || "Other",
      color: "purple"
    })
  }, {
    h: "On Hand",
    render: it => React.createElement("span", {
      style: {
        fontWeight: 600,
        color: stockState(it) === "OK" ? c.text : c.warn
      }
    }, num(it.onHand), " ", React.createElement("span", {
      style: {
        fontSize: 9,
        color: c.textMuted
      }
    }, it.unit || ""))
  }, {
    h: "Reorder At",
    render: it => num(it.reorderPoint) || "\u2014"
  }, {
    h: "Value",
    render: it => money(num(it.onHand) * num(it.unitValue), "")
  }, {
    h: "Location",
    render: it => it.location || "\u2014"
  }, {
    h: "Custody",
    render: it => React.createElement("div", null, React.createElement(Badge, {
      text: it.custodyStatus || "In Store",
      color: custColor[it.custodyStatus] || "success"
    }), it.issuedTo && React.createElement("div", {
      style: {
        fontSize: 9,
        color: c.textMuted,
        marginTop: 2
      }
    }, "\u2192 " + it.issuedTo + (it.receiverRole ? " (" + it.receiverRole + ")" : "")))
  }, {
    h: "Status",
    render: it => React.createElement(Badge, {
      text: stockState(it),
      color: stColor[stockState(it)]
    })
  }, {
    h: "",
    tdStyle: {
      whiteSpace: "nowrap"
    },
    render: it => React.createElement("span", null, React.createElement("button", {
      onClick: () => oEditItem(it),
      title: "Edit",
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 3,
        color: c.warn
      }
    }, React.createElement(Edit2, {
      size: 14
    })), React.createElement("button", {
      onClick: () => oDel("item", it),
      title: "Delete",
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 3,
        color: c.danger
      }
    }, React.createElement(Trash2, {
      size: 14
    })))
  }];
  let content;
  if (tab === "inventory") {
    const rows = inv.filter(it => matchS([it.name, it.sku, it.category]));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Package,
      label: "Total Items",
      value: inv.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Inventory Value",
      value: fmt(invValue),
      color: c.success
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Low / Out of Stock",
      value: lowStock.length,
      color: lowStock.length ? c.danger : c.textMuted
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Categories",
      value: new Set(inv.map(x => x.category)).size,
      color: c.cyan
    })), Table(rows, invCols, "No inventory items yet. Click \u201CAdd Item\u201D to stock the catalog."));
  } else if (tab === "purchases") {
    const rows = pos.filter(p => matchS([p.poNum, p.vendor, p.item])).sort((a, b) => String(a.date) < String(b.date) ? 1 : -1);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Receipt,
      label: "Purchase Orders",
      value: pos.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Spend",
      value: fmt(poSpend),
      color: c.warn
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Received",
      value: pos.filter(p => p.status === "Received").length,
      color: c.success
    }), React.createElement(SC, {
      icon: Clock,
      label: "Pending",
      value: pos.filter(p => p.status === "Ordered" || p.status === "Shipped").length,
      color: c.cyan
    })), Table(rows, [{
      h: "PO #",
      render: p => React.createElement("span", {
        style: {
          fontFamily: "monospace",
          fontWeight: 600,
          color: c.text
        }
      }, p.poNum || "\u2014")
    }, {
      h: "Date",
      render: p => p.date || "\u2014"
    }, {
      h: "Vendor",
      render: p => React.createElement("span", {
        style: {
          color: c.text
        }
      }, p.vendor || "\u2014")
    }, {
      h: "Item",
      render: p => p.item || "\u2014"
    }, {
      h: "Qty",
      render: p => num(p.qty)
    }, {
      h: "Total",
      render: p => money(poTotal(p), p.currency)
    }, {
      h: "Status",
      render: p => React.createElement(Badge, {
        text: p.status || "Ordered",
        color: poColor[p.status]
      })
    }, {
      h: "",
      tdStyle: {
        whiteSpace: "nowrap"
      },
      render: p => React.createElement("span", null, React.createElement("button", {
        onClick: () => oEditPO(p),
        title: "Edit",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.warn
        }
      }, React.createElement(Edit2, {
        size: 14
      })), React.createElement("button", {
        onClick: () => oDel("po", p),
        title: "Delete",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.danger
        }
      }, React.createElement(Trash2, {
        size: 14
      })))
    }], "No purchase orders yet. Click \u201CNew PO\u201D to raise one."));
  } else if (tab === "lowstock") {
    const rows = lowStock.filter(it => matchS([it.name, it.sku, it.category])).sort((a, b) => num(a.onHand) - num(b.onHand));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: AlertTriangle,
      label: "Need Reorder",
      value: lowStock.length,
      color: c.danger
    }), React.createElement(SC, {
      icon: XCircle,
      label: "Out of Stock",
      value: inv.filter(it => stockState(it) === "Out").length,
      color: c.danger
    }), React.createElement(SC, {
      icon: Package,
      label: "Total Items",
      value: inv.length,
      color: c.accent
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: c.dangerBg,
        border: "1px solid " + c.danger + "33",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        color: c.textSec
      }
    }, React.createElement(AlertTriangle, {
      size: 14,
      color: c.danger
    }), React.createElement("span", null, "Items at or below their reorder point \u2014 raise purchase orders to restock before they run out.")), Table(rows, invCols, "All items are above their reorder point \u2014 nothing to restock. \u{1F389}"));
  } else if (tab === "suppliers") {
    const g = {};
    pos.forEach(p => {
      const k = p.vendor || "\u2014";
      if (!g[k]) g[k] = {
        vendor: k,
        n: 0,
        spend: 0,
        received: 0
      };
      g[k].n++;
      if (p.status !== "Cancelled") g[k].spend += poTotal(p);
      if (p.status === "Received") g[k].received++;
    });
    const rows = Object.values(g).filter(v => matchS([v.vendor])).sort((a, b) => b.spend - a.spend);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Users,
      label: "Suppliers",
      value: rows.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: DollarSign,
      label: "Total Spend",
      value: fmt(poSpend),
      color: c.warn
    }), React.createElement(SC, {
      icon: Receipt,
      label: "Total POs",
      value: pos.length,
      color: c.cyan
    })), Table(rows, [{
      h: "Supplier",
      render: v => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, v.vendor)
    }, {
      h: "Orders",
      render: v => v.n
    }, {
      h: "Received",
      render: v => React.createElement("span", {
        style: {
          color: c.success
        }
      }, v.received)
    }, {
      h: "Total Spend",
      render: v => money(v.spend, "")
    }], "No suppliers yet \u2014 raise a purchase order to populate this."));
  } else if (tab === "issued") {
    const issued = inv.filter(it => it.custodyStatus && it.custodyStatus !== "In Store" || it.issuedTo);
    const rows = issued.filter(it => matchS([it.name, it.sku, it.issuedTo, it.receiverRole, it.issuedBy]));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: UserCheck,
      label: "Currently Issued",
      value: inv.filter(it => it.custodyStatus === "Issued").length,
      color: c.accent
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Returned",
      value: inv.filter(it => it.custodyStatus === "Returned").length,
      color: c.success
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Repair / Lost",
      value: inv.filter(it => it.custodyStatus === "Under Repair" || it.custodyStatus === "Lost").length,
      color: c.danger
    }), React.createElement(SC, {
      icon: Package,
      label: "Tracked Assets",
      value: issued.length,
      color: c.cyan
    })), Table(rows, [{
      h: "Item",
      render: it => React.createElement("div", null, React.createElement("div", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, it.name || "\u2014"), it.sku && React.createElement("div", {
        style: {
          fontSize: 10,
          color: c.textMuted,
          fontFamily: "monospace"
        }
      }, it.sku))
    }, {
      h: "Issued To",
      render: it => React.createElement("span", {
        style: {
          color: c.text,
          fontWeight: 600
        }
      }, it.issuedTo || "\u2014")
    }, {
      h: "Role",
      render: it => it.receiverRole ? React.createElement(Badge, {
        text: it.receiverRole,
        color: "purple"
      }) : "\u2014"
    }, {
      h: "Authorized",
      render: it => React.createElement(Badge, {
        text: it.authorizedFor || "Anyone",
        color: "accent"
      })
    }, {
      h: "Issued By",
      render: it => it.issuedBy || "\u2014"
    }, {
      h: "Issue Date",
      render: it => it.issueDate || "\u2014"
    }, {
      h: "Return Date",
      render: it => it.returnDate || "\u2014"
    }, {
      h: "Condition",
      render: it => React.createElement(Badge, {
        text: it.condition || "New",
        color: it.condition === "Damaged" ? "danger" : it.condition === "Fair" ? "warn" : "success"
      })
    }, {
      h: "Status",
      render: it => React.createElement(Badge, {
        text: it.custodyStatus || "In Store",
        color: custColor[it.custodyStatus] || "success"
      })
    }, {
      h: "",
      tdStyle: {
        whiteSpace: "nowrap"
      },
      render: it => React.createElement("button", {
        onClick: () => oEditItem(it),
        title: "Edit / update custody",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.warn
        }
      }, React.createElement(Edit2, {
        size: 14
      }))
    }], "Nothing issued yet. Open an item, set Custody Status to \u201CIssued\u201D and add a receiver."));
  } else {
    const catG = {};
    inv.forEach(it => {
      const k = it.category || "Other";
      if (!catG[k]) catG[k] = {
        cat: k,
        n: 0,
        val: 0
      };
      catG[k].n++;
      catG[k].val += num(it.onHand) * num(it.unitValue);
    });
    const cats = Object.values(catG).sort((a, b) => b.val - a.val);
    const stG = PSTATUS.map(s => ({
      s,
      n: pos.filter(p => p.status === s).length
    }));
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: DollarSign,
      label: "Inventory Value",
      value: fmt(invValue),
      color: c.success
    }), React.createElement(SC, {
      icon: TrendingUp,
      label: "Procurement Spend",
      value: fmt(poSpend),
      color: c.warn
    }), React.createElement(SC, {
      icon: Package,
      label: "SKUs Tracked",
      value: inv.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: AlertTriangle,
      label: "Reorder Alerts",
      value: lowStock.length,
      color: lowStock.length ? c.danger : c.textMuted
    })), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14
      }
    }, React.createElement("div", null, React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 8px"
      }
    }, "Inventory Value by Category"), Table(cats, [{
      h: "Category",
      render: x => React.createElement(Badge, {
        text: x.cat,
        color: "purple"
      })
    }, {
      h: "Items",
      render: x => x.n
    }, {
      h: "Value",
      render: x => money(x.val, "")
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 80,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (invValue ? Math.round(x.val / invValue * 100) : 0) + "%",
          height: "100%",
          background: c.success
        }
      }))
    }], "\u2014")), React.createElement("div", null, React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 8px"
      }
    }, "Purchase Orders by Status"), Table(stG, [{
      h: "Status",
      render: x => React.createElement(Badge, {
        text: x.s,
        color: poColor[x.s]
      })
    }, {
      h: "Count",
      render: x => x.n
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 80,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (pos.length ? Math.round(x.n / pos.length * 100) : 0) + "%",
          height: "100%",
          background: c.cyan
        }
      }))
    }], "\u2014"))));
  }
  const itemModal = modal && (modal.type === "item" || modal.type === "itemEdit");
  const poModal = modal && (modal.type === "po" || modal.type === "poEdit");
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: c.cyan + "22",
      border: "1px solid " + c.cyan + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(Package, {
    size: 24,
    color: c.cyan
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 200
    }
  }, React.createElement("h1", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 22,
      fontWeight: 700
    }
  }, "Procurement"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Inventory, purchase orders, reorder alerts & suppliers")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, addBtn, React.createElement(Btn, {
    variant: "outline",
    icon: Download,
    onClick: exportCSV
  }, "Export"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
      flexWrap: "wrap"
    }
  }, tabs.map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      padding: "8px 14px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 600,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), tab !== "analytics" && React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 14,
      maxWidth: 420
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
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search item, SKU, vendor, category...",
    style: {
      width: "100%",
      padding: "8px 12px 8px 30px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  })), content, itemModal && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)",
      padding: 20,
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 540,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement(Package, {
    size: 18,
    color: c.cyan
  }), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, modal.type === "itemEdit" ? "Edit Item" : "Add Inventory Item")), React.createElement("button", {
    onClick: () => setModal(null),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Item Name *",
    value: form.name || "",
    onChange: v => setForm({
      ...form,
      name: v
    }),
    placeholder: "e.g. A4 Paper"
  }), React.createElement(Inp, {
    label: "SKU / Code",
    value: form.sku || "",
    onChange: v => setForm({
      ...form,
      sku: v
    })
  }), React.createElement(Inp, {
    label: "Category",
    value: form.category || "",
    onChange: v => setForm({
      ...form,
      category: v
    }),
    options: ICATS
  }), React.createElement(Inp, {
    label: "Unit",
    value: form.unit || "pcs",
    onChange: v => setForm({
      ...form,
      unit: v
    }),
    options: UNITS
  }), React.createElement(Inp, {
    label: "On Hand",
    value: form.onHand || "",
    onChange: v => setForm({
      ...form,
      onHand: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Reorder Point",
    value: form.reorderPoint || "",
    onChange: v => setForm({
      ...form,
      reorderPoint: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Unit Value",
    value: form.unitValue || "",
    onChange: v => setForm({
      ...form,
      unitValue: v
    }),
    type: "number",
    placeholder: "Cost per unit"
  }), React.createElement(Inp, {
    label: "Location",
    value: form.location || "",
    onChange: v => setForm({
      ...form,
      location: v
    }),
    placeholder: "Store / shelf"
  })), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "12px 0 8px"
    }
  }, React.createElement(UserCheck, {
    size: 14,
    color: c.cyan
  }), React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Issuance & Custody")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Authorized For",
    value: form.authorizedFor || "Anyone",
    onChange: v => setForm({
      ...form,
      authorizedFor: v
    }),
    options: AUTHFOR
  }), React.createElement(Inp, {
    label: "Custody Status",
    value: form.custodyStatus || "In Store",
    onChange: v => setForm({
      ...form,
      custodyStatus: v
    }),
    options: CUSTODY
  }), React.createElement(Inp, {
    label: "Issued To (Receiver)",
    value: form.issuedTo || "",
    onChange: v => setForm({
      ...form,
      issuedTo: v
    }),
    placeholder: "Teacher / staff name"
  }), React.createElement(Inp, {
    label: "Receiver Role",
    value: form.receiverRole || "",
    onChange: v => setForm({
      ...form,
      receiverRole: v
    }),
    options: RROLES
  }), React.createElement(Inp, {
    label: "Issued By",
    value: form.issuedBy || "",
    onChange: v => setForm({
      ...form,
      issuedBy: v
    }),
    placeholder: "Store keeper / admin"
  }), React.createElement(Inp, {
    label: "Condition",
    value: form.condition || "New",
    onChange: v => setForm({
      ...form,
      condition: v
    }),
    options: CONDITION
  }), React.createElement(Inp, {
    label: "Issue Date",
    value: form.issueDate || "",
    onChange: v => setForm({
      ...form,
      issueDate: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Return Date",
    value: form.returnDate || "",
    onChange: v => setForm({
      ...form,
      returnDate: v
    }),
    type: "date"
  })), React.createElement(Inp, {
    label: "Notes",
    value: form.notes || "",
    onChange: v => setForm({
      ...form,
      notes: v
    }),
    placeholder: "Optional notes"
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: saveItem
  }, modal.type === "itemEdit" ? "Save Item" : "Add Item")))), poModal && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)",
      padding: 20,
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 540,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement(Receipt, {
    size: 18,
    color: c.cyan
  }), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, modal.type === "poEdit" ? "Edit Purchase Order" : "New Purchase Order")), React.createElement("button", {
    onClick: () => setModal(null),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "PO #",
    value: form.poNum || "",
    onChange: v => setForm({
      ...form,
      poNum: v
    })
  }), React.createElement(Inp, {
    label: "Date",
    value: form.date || "",
    onChange: v => setForm({
      ...form,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Vendor *",
    value: form.vendor || "",
    onChange: v => setForm({
      ...form,
      vendor: v
    })
  }), React.createElement(Inp, {
    label: "Item *",
    value: form.item || "",
    onChange: v => setForm({
      ...form,
      item: v
    })
  }), React.createElement(Inp, {
    label: "Quantity",
    value: form.qty || "",
    onChange: v => setForm({
      ...form,
      qty: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Unit Cost",
    value: form.unitCost || "",
    onChange: v => setForm({
      ...form,
      unitCost: v
    }),
    type: "number"
  }), React.createElement(Inp, {
    label: "Currency",
    value: form.currency || "PKR",
    onChange: v => setForm({
      ...form,
      currency: v
    }),
    options: CURRENCIES
  }), React.createElement(Inp, {
    label: "Status",
    value: form.status || "Ordered",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: PSTATUS
  }), React.createElement(Inp, {
    label: "Received Date",
    value: form.receivedDate || "",
    onChange: v => setForm({
      ...form,
      receivedDate: v
    }),
    type: "date"
  })), React.createElement("div", {
    style: {
      padding: "8px 12px",
      background: c.accentBg,
      borderRadius: 8,
      margin: "4px 0 8px",
      fontSize: 12,
      color: c.textSec
    }
  }, "Order total: ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, fmt(poTotal(form)), " ", form.currency || "PKR")), React.createElement(Inp, {
    label: "Notes",
    value: form.notes || "",
    onChange: v => setForm({
      ...form,
      notes: v
    }),
    placeholder: "Optional notes"
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: savePO
  }, modal.type === "poEdit" ? "Save PO" : "Create PO")))), modal && modal.type === "del" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 400,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: c.dangerBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 12px"
    }
  }, React.createElement(Trash2, {
    size: 22,
    color: c.danger
  })), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: "0 0 6px"
    }
  }, "Delete this " + (modal.kind === "item" ? "item" : "purchase order") + "?"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 16px",
      lineHeight: 1.5
    }
  }, "Remove ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.kind === "item" ? modal.data.name : modal.data.poNum), "? This cannot be undone."), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 10
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    variant: "danger",
    icon: Trash2,
    onClick: doDel
  }, "Delete")))));
};

