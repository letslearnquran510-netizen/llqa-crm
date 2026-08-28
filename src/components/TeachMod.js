const TeachMod = ({
  teacherFeedback,
  teachers,
  setTeachers,
  leaves,
  setLeaves,
  teamLeads,
}) => {
  const [tab, setTab] = useState("All");
  const [st, setSt] = useState("list");
  const [search, setSearch] = useState("");
  const [fs, setFs] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const cats = {
    All: teachers,
    "Male IBA": teachers.filter(
      (t) => t.gender === "Male" && t.location === "IBA",
    ),
    "Male WFH": teachers.filter(
      (t) => t.gender === "Male" && t.location === "WFH",
    ),
    "Female IBA": teachers.filter(
      (t) => t.gender === "Female" && t.location === "IBA",
    ),
    "Female WFH": teachers.filter(
      (t) => t.gender === "Female" && t.location === "WFH",
    ),
    Resigned: teachers.filter(
      (t) => t.status === "resigned" || t.status === "terminated",
    ),
  };
  const at = teachers.filter(
    (t) => t.status === "active" || t.status === "new",
  );
  const fd = useMemo(() => {
    let d = cats[tab] || teachers;
    if (fs !== "all") d = d.filter((t) => t.status === fs);
    if (search)
      d = d.filter((t) =>
        Object.values(t).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase()),
        ),
      );
    return d;
  }, [tab, search, fs, teachers]);
  const pd = useMemo(
    () =>
      at
        .filter((t) => t.perfRating > 0)
        .sort((a, b) => b.perfRating - a.perfRating)
        .slice(0, 10)
        .map((t) => ({
          name: t.name.split(" ").pop(),
          rating: t.perfRating,
          completion: t.classCompletion,
        })),
    [teachers],
  );
  const oA = () => {
    setForm({
      name: "",
      code: "",
      gender: "Male",
      location: "IBA",
      shift: "Night",
      teamLead: "Qazi Junaid",
      joinDate: "",
      dob: "",
      salary: "",
      phone: "",
      emergencyContact: "",
      email: "",
      cnic: "",
      address: "",
      bank: "",
      accountNo: "",
      qualification: "",
      specialization: "",
      languages: "Urdu, English",
      notes: "",
      status: "active",
    });
    setModal({
      type: "add",
    });
  };
  const oE = (t) => {
    setForm({
      ...t,
      salary: String(t.salary),
    });
    setModal({
      type: "edit",
      data: t,
    });
  };
  const oV = (t) =>
    setModal({
      type: "view",
      data: t,
    });
  const oZ = (t) => {
    setForm({
      zoom: t.zoom || "",
    });
    setModal({
      type: "zoomEdit",
      data: t,
    });
  };
  const sZ = () => {
    setTeachers(
      teachers.map((x) =>
        x.id === modal.data.id
          ? {
              ...x,
              zoom: (form.zoom || "").trim(),
            }
          : x,
      ),
    );
    setModal(null);
  };
  const oD = (t) =>
    setModal({
      type: "delete",
      data: t,
    });
  const oL = (t) => {
    setForm({
      teacherId: t.id,
      teacherName: t.name,
      type: "",
      from: "",
      to: "",
      days: "",
      reason: "",
      status: "pending",
      halfDay: false,
      contact: "",
      substitute: "",
      docUrl: "",
    });
    setModal({
      type: "leave",
      data: t,
    });
  };
  const sv = () => {
    const required = [
      ["name", "Name"],
      ["code", "Code"],
      ["gender", "Gender"],
      ["location", "Location"],
      ["teamLead", "Team Lead"],
      ["status", "Status"],
      ["shift", "Shift"],
      ["joinDate", "Join Date"],
      ["salary", "Salary"],
      ["phone", "Phone"],
      ["emergencyContact", "Emergency Contact"],
    ];
    const missing = required.filter(([k]) => {
      const v = form[k];
      return v === undefined || v === null || String(v).trim() === "";
    });
    if (missing.length > 0) {
      alert(
        "\u26A0 Please fill all required fields:\n\n\u2022 " +
          missing.map((m) => m[1]).join("\n\u2022 "),
      );
      return;
    }
    if (modal.type === "add") {
      const nLower = form.name.trim().toLowerCase();
      const codeStr = String(form.code).trim();
      const codeDup = teachers.find((t) => String(t.code).trim() === codeStr);
      const nameDup = teachers.find(
        (t) => (t.name || "").trim().toLowerCase() === nLower,
      );
      if (codeDup) {
        alert(
          '⚠ Code already exists.\n\nThe code "' +
            codeStr +
            '" is already assigned to:\n• ' +
            codeDup.name +
            "\n\nPlease choose a different code.",
        );
        return;
      }
      if (nameDup) {
        if (
          !confirm(
            '⚠ A teacher with the name "' +
              form.name +
              '" already exists (code: ' +
              nameDup.code +
              ").\n\nClick OK to save anyway (different person with same name), or Cancel to go back.",
          )
        )
          return;
      }
    }
    const t = {
      ...form,
      salary: Number(form.salary) || 0,
      students: form.students || 0,
      freeSlots: form.freeSlots || 16,
      totalSlots: 16,
      leaveBalance: form.leaveBalance || 14,
      leaveTaken: form.leaveTaken || 0,
      perfRating: form.perfRating || 0,
      classCompletion: form.classCompletion || 0,
      studentSatisfaction: form.studentSatisfaction || 0,
      attendanceRate: form.attendanceRate || 0,
    };
    if (modal.type === "add") {
      t.id = Date.now();
      t.sno = teachers.length + 1;
      setTeachers([...teachers, t]);
    } else
      setTeachers(
        teachers.map((x) =>
          x.id === modal.data.id
            ? {
                ...x,
                ...t,
              }
            : x,
        ),
      );
    setModal(null);
  };
  const dl = () => {
    setTeachers(teachers.filter((t) => t.id !== modal.data.id));
    setModal(null);
  };
  const sL = () => {
    if (!form.type || !form.from || !form.to) return;
    setLeaves([
      ...leaves,
      {
        id: Date.now(),
        ...form,
        days: Number(form.days) || 1,
        status: "pending",
      },
    ]);
    setModal(null);
  };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        },
      },
      React.createElement(
        "p",
        {
          style: {
            margin: 0,
            color: c.textSec,
            fontSize: 12,
          },
        },
        at.length,
        " active | ",
        teachers.filter(
          (t) => t.status === "resigned" || t.status === "terminated",
        ).length,
        " departed",
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 8,
          },
        },
        React.createElement(
          Btn,
          {
            icon: Plus,
            onClick: oA,
          },
          "Add Teacher",
        ),
        React.createElement(
          Btn,
          {
            icon: Download,
            variant: "outline",
            onClick: () => {
              const list = cats[tab] || teachers;
              const headers = [
                "S/No",
                "Name",
                "Code",
                "Gender",
                "Location",
                "Team Lead",
                "Status",
                "Students",
                "Free Slots",
                "Total Slots",
                "Rating",
                "Salary",
                "Phone",
                "CNIC",
                "Bank",
                "Join Date",
              ];
              const rows = list.map((t) => [
                t.sno || "",
                t.name || "",
                t.code || "",
                t.gender || "",
                t.location || "",
                t.teamLead || "",
                t.status || "",
                t.students || 0,
                (() => {
                  const cf = computeFree(t);
                  return cf.free;
                })(),
                (() => {
                  const cf = computeFree(t);
                  return cf.total;
                })(),
                t.perfRating || "",
                t.salary || "",
                t.phone || "",
                t.cnic || "",
                t.bank || "",
                t.joinDate || "",
              ]);
              const csv = [headers, ...rows]
                .map((r) =>
                  r
                    .map((v) => {
                      const s = String(v);
                      return s.includes(",") ||
                        s.includes('"') ||
                        s.includes("\n")
                        ? '"' + s.replace(/"/g, '""') + '"'
                        : s;
                    })
                    .join(","),
                )
                .join("\n");
              const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download =
                "LLQA-Teachers-" +
                tab.replace(/\s+/g, "_") +
                "-" +
                todayPK() +
                ".csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            },
          },
          "Export",
        ),
      ),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        },
      },
      React.createElement(SC, {
        icon: Users,
        label: "Active",
        value: at.length,
        color: c.accent,
      }),
      React.createElement(SC, {
        icon: Home,
        label: "IBA",
        value: at.filter((t) => t.location === "IBA").length,
        color: c.cyan,
      }),
      React.createElement(SC, {
        icon: Wifi,
        label: "WFH",
        value: at.filter((t) => t.location === "WFH").length,
        color: c.purple,
      }),
      React.createElement(SC, {
        icon: Star,
        label: "Avg Rating",
        value: (
          at
            .filter((t) => t.perfRating > 0)
            .reduce((s, t) => s + t.perfRating, 0) /
          (at.filter((t) => t.perfRating > 0).length || 1)
        ).toFixed(1),
        color: c.warn,
      }),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 2,
          background: c.bgDeep,
          borderRadius: 8,
          padding: 3,
          marginBottom: 14,
          width: "fit-content",
        },
      },
      [
        ["list", "Teacher List"],
        ["leave", "Leave Mgmt"],
        ["perf", "Performance"],
        ["zoom", "Zoom Links"],
      ].map(([k, l]) =>
        React.createElement(
          "button",
          {
            key: k,
            onClick: () => setSt(k),
            style: {
              padding: "7px 16px",
              borderRadius: 6,
              border:
                st === k ? "1px solid transparent" : "1px solid " + c.border,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              background: st === k ? c.accent : "transparent",
              color: st === k ? c.accentText : c.textSec,
            },
          },
          l,
        ),
      ),
    ),
    st === "zoom" &&
      React.createElement(ZoomLinksTab, {
        teachers: teachers,
        onQuickEdit: oZ,
      }),
    st === "list" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 2,
              background: c.bgDeep,
              borderRadius: 8,
              padding: 3,
              marginBottom: 12,
              flexWrap: "wrap",
            },
          },
          Object.keys(cats).map((k) =>
            React.createElement(
              "button",
              {
                key: k,
                onClick: () => setTab(k),
                style: {
                  padding: "6px 12px",
                  borderRadius: 6,
                  border:
                    tab === k
                      ? "1px solid " + c.accent + "55"
                      : "1px solid " + c.border,
                  cursor: "pointer",
                  fontSize: 11,
                  background: tab === k ? c.accent : "transparent",
                  color: tab === k ? c.accentText : c.textSec,
                },
              },
              k,
              " (",
              cats[k].length,
              ")",
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              marginBottom: 12,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                position: "relative",
                flex: 1,
              },
            },
            React.createElement(Search, {
              size: 14,
              style: {
                position: "absolute",
                left: 10,
                top: 9,
                color: c.textMuted,
              },
            }),
            React.createElement("input", {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search...",
              style: {
                width: "100%",
                padding: "8px 12px 8px 30px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
              },
            }),
          ),
          React.createElement(
            "select",
            {
              value: fs,
              onChange: (e) => setFs(e.target.value),
              style: {
                padding: "8px 12px",
                background: c.bgInput,
                border: "1px solid " + c.border,
                borderRadius: 7,
                color: c.text,
                fontSize: 12,
              },
            },
            React.createElement(
              "option",
              {
                value: "all",
              },
              "All",
            ),
            React.createElement(
              "option",
              {
                value: "active",
              },
              "Active",
            ),
            React.createElement(
              "option",
              {
                value: "new",
              },
              "New",
            ),
            React.createElement(
              "option",
              {
                value: "resigned",
              },
              "Resigned",
            ),
            React.createElement(
              "option",
              {
                value: "terminated",
              },
              "Terminated",
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "#",
                  "Name",
                  "Code",
                  "Gender",
                  "Loc",
                  "Lead",
                  "Students",
                  "Slots",
                  "Rating",
                  "Status",
                  "",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 10px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                        whiteSpace: "nowrap",
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              fd.map((t, i) =>
                React.createElement(
                  "tr",
                  {
                    key: t.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? c.bgDeep + "88" : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.textMuted,
                      },
                    },
                    t.sno,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        fontWeight: 600,
                      },
                    },
                    t.name,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.text,
                        fontWeight: 600,
                        fontFamily: "monospace",
                      },
                    },
                    t.code,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.gender,
                      color: t.gender === "Male" ? "accent" : "purple",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.location,
                      color: t.location === "IBA" ? "cyan" : "purple",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.textSec,
                      },
                    },
                    t.teamLead,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.success,
                        fontWeight: 700,
                      },
                    },
                    t.students,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        },
                      },
                      (() => {
                        const cf = computeFree(t);
                        return React.createElement(
                          React.Fragment,
                          null,
                          React.createElement(PBar, {
                            value: cf.total - cf.free,
                            max: cf.total || 1,
                            color:
                              cf.free === 0
                                ? c.danger
                                : cf.free <= 2
                                  ? c.warn
                                  : c.success,
                          }),
                          React.createElement(
                            "span",
                            {
                              style: {
                                fontSize: 9,
                                color: c.textSec,
                              },
                            },
                            cf.free,
                            "F",
                          ),
                        );
                      })(),
                    ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    t.perfRating > 0
                      ? React.createElement(
                          "span",
                          {
                            style: {
                              color:
                                t.perfRating >= 4.5
                                  ? c.success
                                  : t.perfRating >= 3.5
                                    ? c.warn
                                    : c.danger,
                              fontWeight: 600,
                            },
                          },
                          t.perfRating.toFixed(1),
                          "\u2605",
                        )
                      : "—",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(Badge, {
                      text: t.status,
                      color:
                        t.status === "active"
                          ? "success"
                          : t.status === "new"
                            ? "cyan"
                            : t.status === "resigned"
                              ? "warn"
                              : "danger",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        whiteSpace: "nowrap",
                      },
                    },
                    React.createElement(
                      "button",
                      {
                        onClick: () => oV(t),
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.accent,
                        },
                      },
                      React.createElement(Eye, {
                        size: 13,
                      }),
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => oE(t),
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.warn,
                        },
                      },
                      React.createElement(Edit2, {
                        size: 13,
                      }),
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => oL(t),
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.purple,
                        },
                      },
                      React.createElement(Calendar, {
                        size: 13,
                      }),
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => oD(t),
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.danger,
                        },
                      },
                      React.createElement(Trash2, {
                        size: 13,
                      }),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    st === "leave" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 14,
            },
          },
          React.createElement(SC, {
            icon: Calendar,
            label: "Total",
            value: leaves.length,
            color: c.accent,
          }),
          React.createElement(SC, {
            icon: CheckCircle,
            label: "Approved",
            value: leaves.filter((l) => l.status === "approved").length,
            color: c.success,
          }),
          React.createElement(SC, {
            icon: Clock,
            label: "Pending",
            value: leaves.filter((l) => l.status === "pending").length,
            color: c.warn,
          }),
          React.createElement(SC, {
            icon: XCircle,
            label: "Rejected",
            value: leaves.filter((l) => l.status === "rejected").length,
            color: c.danger,
          }),
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Type",
                  "From",
                  "To",
                  "Days",
                  "Reason",
                  "Status",
                  "",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 10px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              leaves.map((l, i) =>
                React.createElement(
                  "tr",
                  {
                    key: l.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? c.bgDeep + "88" : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        fontWeight: 600,
                      },
                    },
                    l.teacherName,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(Badge, {
                      text: l.type,
                      color: l.type.includes("Sick")
                        ? "danger"
                        : l.type.includes("Ramadan")
                          ? "purple"
                          : "accent",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.textSec,
                      },
                    },
                    l.from,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.textSec,
                      },
                    },
                    l.to,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.warn,
                        fontWeight: 600,
                      },
                    },
                    l.days,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                        color: c.textSec,
                        maxWidth: 150,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    },
                    l.reason,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    React.createElement(Badge, {
                      text: l.status,
                      color:
                        l.status === "approved"
                          ? "success"
                          : l.status === "pending"
                            ? "warn"
                            : "danger",
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        padding: "8px 10px",
                      },
                    },
                    l.status === "pending" &&
                      React.createElement(
                        React.Fragment,
                        null,
                        React.createElement(
                          "button",
                          {
                            onClick: () =>
                              setLeaves(
                                leaves.map((x) =>
                                  x.id === l.id
                                    ? {
                                        ...x,
                                        status: "approved",
                                      }
                                    : x,
                                ),
                              ),
                            style: {
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 3,
                              color: c.success,
                            },
                          },
                          React.createElement(CheckCircle, {
                            size: 13,
                          }),
                        ),
                        React.createElement(
                          "button",
                          {
                            onClick: () =>
                              setLeaves(
                                leaves.map((x) =>
                                  x.id === l.id
                                    ? {
                                        ...x,
                                        status: "rejected",
                                      }
                                    : x,
                                ),
                              ),
                            style: {
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 3,
                              color: c.danger,
                            },
                          },
                          React.createElement(XCircle, {
                            size: 13,
                          }),
                        ),
                      ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    st === "perf" &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 14,
            },
          },
          React.createElement(SC, {
            icon: Star,
            label: "Top",
            value:
              at
                .filter((t) => t.perfRating > 0)
                .sort((a, b) => b.perfRating - a.perfRating)[0]
                ?.name.split(" ")
                .slice(-2)
                .join(" ") || "-",
            color: c.success,
          }),
          React.createElement(SC, {
            icon: TrendingUp,
            label: "Avg Completion",
            value:
              Math.round(
                at
                  .filter((t) => t.classCompletion > 0)
                  .reduce((s, t) => s + t.classCompletion, 0) /
                  (at.filter((t) => t.classCompletion > 0).length || 1),
              ) + "%",
            color: c.accent,
          }),
          React.createElement(SC, {
            icon: UserCheck,
            label: "Avg Satisfaction",
            value:
              Math.round(
                at
                  .filter((t) => t.studentSatisfaction > 0)
                  .reduce((s, t) => s + t.studentSatisfaction, 0) /
                  (at.filter((t) => t.studentSatisfaction > 0).length || 1),
              ) + "%",
            color: c.purple,
          }),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 12,
                },
              },
              "Top 10 Rating",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 220,
              },
              React.createElement(
                BarChart,
                {
                  data: pd,
                  layout: "vertical",
                },
                React.createElement(CartesianGrid, {
                  strokeDasharray: "3 3",
                  stroke: c.border,
                }),
                React.createElement(XAxis, {
                  type: "number",
                  domain: [0, 5],
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(YAxis, {
                  type: "category",
                  dataKey: "name",
                  stroke: c.textMuted,
                  fontSize: 10,
                  width: 72,
                }),
                React.createElement(Tooltip, {
                  contentStyle: {
                    background: c.bgCard,
                    backdropFilter: "blur(16px)",
                    boxShadow: c.shadow3d,
                    border: "1px solid " + c.border,
                    borderRadius: 8,
                    fontSize: 11,
                    color: c.text,
                  },
                }),
                React.createElement(Bar, {
                  dataKey: "rating",
                  fill: c.accent,
                  radius: [0, 4, 4, 0],
                }),
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                backdropFilter: "blur(16px)",
                boxShadow: c.shadow3d,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 16,
              },
            },
            React.createElement(
              "h4",
              {
                style: {
                  color: c.text,
                  margin: "0 0 10px",
                  fontSize: 12,
                },
              },
              "Completion %",
            ),
            React.createElement(
              ResponsiveContainer,
              {
                width: "100%",
                height: 220,
              },
              React.createElement(
                BarChart,
                {
                  data: pd,
                  layout: "vertical",
                },
                React.createElement(CartesianGrid, {
                  strokeDasharray: "3 3",
                  stroke: c.border,
                }),
                React.createElement(XAxis, {
                  type: "number",
                  domain: [60, 100],
                  stroke: c.textMuted,
                  fontSize: 10,
                }),
                React.createElement(YAxis, {
                  type: "category",
                  dataKey: "name",
                  stroke: c.textMuted,
                  fontSize: 10,
                  width: 72,
                }),
                React.createElement(Tooltip, {
                  contentStyle: {
                    background: c.bgCard,
                    backdropFilter: "blur(16px)",
                    boxShadow: c.shadow3d,
                    border: "1px solid " + c.border,
                    borderRadius: 8,
                    fontSize: 11,
                    color: c.text,
                  },
                }),
                React.createElement(Bar, {
                  dataKey: "completion",
                  fill: c.success,
                  radius: [0, 4, 4, 0],
                }),
              ),
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid " + c.border,
            },
          },
          React.createElement(
            "table",
            {
              style: {
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              },
            },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                [
                  "Teacher",
                  "Students",
                  "Rating",
                  "Completion",
                  "Satisfaction",
                  "Attendance",
                ].map((h) =>
                  React.createElement(
                    "th",
                    {
                      key: h,
                      style: {
                        padding: "9px 10px",
                        textAlign: "left",
                        color: c.textSec,
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        borderBottom: "1px solid " + c.border,
                        background: c.bgDeep,
                      },
                    },
                    h,
                  ),
                ),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              at
                .filter((t) => t.perfRating > 0)
                .sort((a, b) => b.perfRating - a.perfRating)
                .map((t, i) =>
                  React.createElement(
                    "tr",
                    {
                      key: t.id,
                      style: {
                        borderBottom: "1px solid " + c.border,
                        background: i % 2 ? c.bgDeep + "88" : "transparent",
                      },
                    },
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px 10px",
                          fontWeight: 600,
                        },
                      },
                      t.name,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px 10px",
                          color: c.success,
                          fontWeight: 700,
                        },
                      },
                      t.students,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px 10px",
                        },
                      },
                      React.createElement(
                        "span",
                        {
                          style: {
                            color:
                              t.perfRating >= 4.5
                                ? c.success
                                : t.perfRating >= 3.5
                                  ? c.warn
                                  : c.danger,
                            fontWeight: 700,
                          },
                        },
                        t.perfRating.toFixed(1),
                        "\u2605",
                      ),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px 10px",
                        },
                      },
                      React.createElement(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          },
                        },
                        React.createElement(PBar, {
                          value: t.classCompletion,
                          color: t.classCompletion >= 95 ? c.success : c.warn,
                        }),
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: 10,
                              color: c.textSec,
                            },
                          },
                          t.classCompletion,
                          "%",
                        ),
                      ),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px 10px",
                        },
                      },
                      React.createElement(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          },
                        },
                        React.createElement(PBar, {
                          value: t.studentSatisfaction,
                          color:
                            t.studentSatisfaction >= 90 ? c.success : c.warn,
                        }),
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: 10,
                              color: c.textSec,
                            },
                          },
                          t.studentSatisfaction,
                          "%",
                        ),
                      ),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "8px 10px",
                        },
                      },
                      React.createElement(
                        "span",
                        {
                          style: {
                            color: t.attendanceRate >= 96 ? c.success : c.warn,
                            fontWeight: 600,
                          },
                        },
                        t.attendanceRate,
                        "%",
                      ),
                    ),
                  ),
                ),
            ),
          ),
        ),
      ),
    React.createElement(
      "div",
      {
        style: {
          marginTop: 20,
          background: c.bgCard,
          backdropFilter: "blur(16px)",
          boxShadow: c.shadow3d,
          border: "1px solid " + c.border,
          borderRadius: 12,
          padding: 16,
        },
      },
      React.createElement(
        "h4",
        {
          style: {
            color: c.text,
            margin: "0 0 14px",
            fontSize: 14,
            fontWeight: 600,
          },
        },
        "\uD83D\uDDE3\uFE0F Recent Parent Feedbacks",
      ),
      (teacherFeedback || []).length === 0
        ? React.createElement(
            "div",
            {
              style: {
                color: c.textMuted,
                fontSize: 11,
                textAlign: "center",
                padding: 20,
              },
            },
            "No feedbacks yet.",
          )
        : React.createElement(
            "div",
            {
              style: { display: "flex", flexDirection: "column", gap: 10 },
            },
            (teacherFeedback || []).slice(0, 15).map((f) =>
              React.createElement(
                "div",
                {
                  key: f.id,
                  style: {
                    background: c.bgDeep,
                    borderRadius: 8,
                    borderLeft: "3px solid " + c.success,
                    padding: 14,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    },
                  },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "span",
                      {
                        style: { fontWeight: 600, color: c.text, fontSize: 12 },
                      },
                      f.teacherName || "Unknown Teacher",
                    ),
                    React.createElement(
                      "span",
                      {
                        style: {
                          color: c.textMuted,
                          fontSize: 10,
                          marginLeft: 8,
                        },
                      },
                      "by ",
                      f.author,
                    ),
                  ),
                  React.createElement(
                    "span",
                    {
                      style: { color: c.textSec, fontSize: 10 },
                    },
                    new Date(f.createdAt).toLocaleDateString(),
                  ),
                ),
                React.createElement(
                  "div",
                  {
                    style: { color: c.text, fontSize: 12, fontWeight: 500 },
                  },
                  f.text,
                ),
              ),
            ),
          ),
    ),
    modal &&
      (modal.type === "add" || modal.type === "edit") &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
            backdropFilter: "blur(4px)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 520,
              maxHeight: "90vh",
              overflowY: "auto",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              },
            },
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 16,
                  margin: 0,
                },
              },
              modal.type === "add" ? "Add Teacher" : "Edit Teacher",
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(X, {
                size: 18,
              }),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(
              "div",
              null,
              React.createElement(Inp, {
                label: "Name *",
                value: form.name || "",
                onChange: (v) =>
                  setForm({
                    ...form,
                    name: v,
                  }),
              }),
              (() => {
                if (modal.type !== "add" || !form.name || !form.name.trim())
                  return null;
                const nLower = form.name.trim().toLowerCase();
                const dup = teachers.find(
                  (t) => (t.name || "").trim().toLowerCase() === nLower,
                );
                if (!dup) return null;
                return React.createElement(
                  "div",
                  {
                    style: {
                      marginTop: -8,
                      marginBottom: 10,
                      padding: "6px 10px",
                      background: c.warnBg || "rgba(245,158,11,0.12)",
                      border: "1px solid " + (c.warn || "#f59e0b") + "55",
                      borderRadius: 6,
                      color: c.warn || "#f59e0b",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    },
                  },
                  React.createElement(AlertTriangle, {
                    size: 12,
                  }),
                  "Name already exists (code: " +
                    dup.code +
                    ", " +
                    (dup.status || "active") +
                    ")",
                );
              })(),
            ),
            React.createElement(
              "div",
              null,
              React.createElement(Inp, {
                label: "Code *",
                value: form.code || "",
                onChange: (v) =>
                  setForm({
                    ...form,
                    code: v,
                  }),
              }),
              (() => {
                if (
                  modal.type !== "add" ||
                  !form.code ||
                  !String(form.code).trim()
                )
                  return null;
                const codeStr = String(form.code).trim();
                const dup = teachers.find(
                  (t) => String(t.code).trim() === codeStr,
                );
                if (!dup) return null;
                return React.createElement(
                  "div",
                  {
                    style: {
                      marginTop: -8,
                      marginBottom: 10,
                      padding: "6px 10px",
                      background: c.dangerBg || "rgba(239,68,68,0.12)",
                      border: "1px solid " + (c.danger || "#ef4444") + "55",
                      borderRadius: 6,
                      color: c.danger || "#ef4444",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    },
                  },
                  React.createElement(AlertTriangle, {
                    size: 12,
                  }),
                  "\u2716 Code already used by ",
                  dup.name,
                );
              })(),
            ),
            React.createElement(Inp, {
              label: "Gender *",
              value: form.gender || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  gender: v,
                }),
              options: ["Male", "Female"],
            }),
            React.createElement(Inp, {
              label: "Location *",
              value: form.location || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  location: v,
                }),
              options: ["IBA", "WFH"],
            }),
            React.createElement(Inp, {
              label: "Team Lead (add new in Settings) *",
              value: form.teamLead || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  teamLead: v,
                }),
              options: ["ALL", ...(teamLeads || []).map((tl) => tl.name)],
            }),
            React.createElement(Inp, {
              label: "Status *",
              value: form.status || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  status: v,
                }),
              options: ["active", "new", "resigned", "terminated"],
            }),
            React.createElement(Inp, {
              label: "Join Date *",
              value: form.joinDate || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  joinDate: v,
                }),
              type: "date",
            }),
            React.createElement(Inp, {
              label: "Salary *",
              value: form.salary || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  salary: v,
                }),
              type: "number",
            }),
            React.createElement(Inp, {
              label: "Phone *",
              value: form.phone || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  phone: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Emergency Contact *",
              value: form.emergencyContact || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  emergencyContact: v,
                }),
              placeholder: "+92 ...",
            }),
            React.createElement(Inp, {
              label: "Email",
              value: form.email || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  email: v,
                }),
              type: "email",
              placeholder: "name@llqa.net",
            }),
            React.createElement(Inp, {
              label: "Date of Birth",
              value: form.dob || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  dob: v,
                }),
              type: "date",
            }),
            React.createElement(Inp, {
              label: "CNIC",
              value: form.cnic || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  cnic: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Shift *",
              value: form.shift || "Night",
              onChange: (v) =>
                setForm({
                  ...form,
                  shift: v,
                }),
              options: ["Morning", "Evening", "Night", "Weekend"],
            }),
            React.createElement(Inp, {
              label: "Qualification",
              value: form.qualification || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  qualification: v,
                }),
              placeholder: "e.g. Hafiz-e-Quran, MA Islamic Studies",
            }),
            React.createElement(Inp, {
              label: "Specialization",
              value: form.specialization || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  specialization: v,
                }),
              placeholder: "e.g. Tajweed, Memorization",
            }),
          ),
          React.createElement(Inp, {
            label: "Languages Spoken",
            value: form.languages || "",
            onChange: (v) =>
              setForm({
                ...form,
                languages: v,
              }),
            placeholder: "Urdu, English, Arabic",
          }),
          React.createElement(Inp, {
            label: "Address",
            value: form.address || "",
            onChange: (v) =>
              setForm({
                ...form,
                address: v,
              }),
            placeholder: "Full address",
          }),
          React.createElement(Inp, {
            label: "Zoom Meeting Link (for taking classes)",
            value: form.zoom || "",
            onChange: (v) =>
              setForm({
                ...form,
                zoom: v,
              }),
            type: "url",
            placeholder: "https://zoom.us/j/...",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(Inp, {
              label: "Bank",
              value: form.bank || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  bank: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Account Number / IBAN",
              value: form.accountNo || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  accountNo: v,
                }),
            }),
          ),
          React.createElement(Inp, {
            label: "Internal Notes",
            value: form.notes || "",
            onChange: (v) =>
              setForm({
                ...form,
                notes: v,
              }),
            placeholder: "Optional notes about this teacher",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 14,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                onClick: sv,
              },
              modal.type === "add" ? "Add" : "Save",
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "view" &&
      React.createElement(ViewDetail, {
        t: modal.data,
        tLeaves: leaves.filter((l) => l.teacherId === modal.data.id),
        teacherFeedback: teacherFeedback,
        onClose: () => setModal(null),
        onEdit: () => {
          const d = modal.data;
          setModal(null);
          oE(d);
        },
        onLeave: () => {
          const d = modal.data;
          setModal(null);
          oL(d);
        },
      }),
    modal &&
      modal.type === "zoomEdit" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 440,
              maxWidth: "92vw",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: c.accentBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
              },
              React.createElement(Video, {
                size: 20,
                color: c.accent,
              }),
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "h3",
                {
                  style: {
                    color: c.text,
                    fontSize: 15,
                    margin: 0,
                    fontWeight: 600,
                  },
                },
                "Zoom Meeting Link",
              ),
              React.createElement(
                "p",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 11,
                    margin: "2px 0 0",
                  },
                },
                modal.data.name + " \u00B7 Code " + modal.data.code,
              ),
            ),
          ),
          React.createElement(Inp, {
            label: "Zoom Link (teacher takes classes from this URL)",
            value: form.zoom || "",
            onChange: (v) =>
              setForm({
                ...form,
                zoom: v,
              }),
            type: "url",
            placeholder: "https://zoom.us/j/...",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 8,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                onClick: sZ,
              },
              "Save Link",
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "delete" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 380,
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 48,
                height: 48,
                borderRadius: 12,
                background: c.dangerBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              },
            },
            React.createElement(Trash2, {
              size: 22,
              color: c.danger,
            }),
          ),
          React.createElement(
            "h3",
            {
              style: {
                color: c.text,
                fontSize: 16,
                margin: "0 0 6px",
              },
            },
            "Delete?",
          ),
          React.createElement(
            "p",
            {
              style: {
                color: c.textSec,
                fontSize: 12,
                margin: "0 0 16px",
              },
            },
            "Remove ",
            React.createElement(
              "strong",
              {
                style: {
                  color: c.text,
                },
              },
              modal.data.name,
            ),
            "?",
            modal.data.students > 0 &&
              React.createElement(
                "span",
                {
                  style: {
                    color: c.danger,
                  },
                },
                " ",
                modal.data.students,
                " students need reassignment.",
              ),
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                gap: 10,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                variant: "danger",
                icon: Trash2,
                onClick: dl,
              },
              "Delete",
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "leave" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 420,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              },
            },
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 16,
                  margin: 0,
                },
              },
              "Leave - ",
              form.teacherName,
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
                style: {
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSec,
                },
              },
              React.createElement(X, {
                size: 18,
              }),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgDeep,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
              },
            },
            React.createElement(
              "span",
              {
                style: {
                  color: c.textSec,
                  fontSize: 11,
                },
              },
              "Balance",
            ),
            React.createElement(
              "span",
              {
                style: {
                  color: c.success,
                  fontWeight: 700,
                },
              },
              modal.data.leaveBalance,
              " days",
            ),
          ),
          React.createElement(Inp, {
            label: "Type *",
            value: form.type || "",
            onChange: (v) =>
              setForm({
                ...form,
                type: v,
              }),
            options: LEAVE_TYPES,
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(Inp, {
              label: "From *",
              value: form.from || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  from: v,
                }),
              type: "date",
            }),
            React.createElement(Inp, {
              label: "To *",
              value: form.to || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  to: v,
                }),
              type: "date",
            }),
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(Inp, {
              label: "Days",
              value: form.days || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  days: v,
                }),
              type: "number",
            }),
            React.createElement(Inp, {
              label: "Status",
              value: form.status || "pending",
              onChange: (v) =>
                setForm({
                  ...form,
                  status: v,
                }),
              options: ["pending", "approved", "rejected"],
            }),
          ),
          React.createElement(Inp, {
            label: "Reason *",
            value: form.reason || "",
            onChange: (v) =>
              setForm({
                ...form,
                reason: v,
              }),
            placeholder: "Brief reason for leave",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(Inp, {
              label: "Contact During Leave",
              value: form.contact || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  contact: v,
                }),
              placeholder: "+92 ...",
            }),
            React.createElement(Inp, {
              label: "Substitute Teacher",
              value: form.substitute || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  substitute: v,
                }),
              placeholder: "Optional",
            }),
          ),
          React.createElement(Inp, {
            label: "Supporting Document URL (optional)",
            value: form.docUrl || "",
            onChange: (v) =>
              setForm({
                ...form,
                docUrl: v,
              }),
            placeholder: "Drive/Dropbox link to medical certificate or proof",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 10,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                onClick: sL,
                icon: Calendar,
              },
              "Submit",
            ),
          ),
        ),
      ),
  );
};
