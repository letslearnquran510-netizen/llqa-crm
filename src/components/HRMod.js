const HRMod = ({
  user,
  teachers = [],
  hrInterviews = [],
  setHrInterviews,
  hrHiring = [],
  setHrHiring,
}) => {
  const [tab, setTab] = React.useState("interviews");
  const [search, setSearch] = React.useState("");
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({});

  const saveInterview = (e) => {
    e.preventDefault();
    if (!form.name) return alert("Candidate Name is required");
    const rec = {
      id: form.id || Date.now() + Math.floor(Math.random() * 1000),
      name: form.name,
      roleApplied: form.roleApplied || "Quran Teacher",
      date: form.date || todayPK(),
      interviewer: form.interviewer || "",
      score: form.score || "5",
      decision: form.decision || "Pending",
      notes: form.notes || "",
    };
    if (form.id) {
      setHrInterviews(
        (hrInterviews || []).map((i) => (i.id === form.id ? rec : i)),
      );
    } else {
      setHrInterviews([...(hrInterviews || []), rec]);
    }
    setModal(null);
    setForm({});
  };

  const saveHiring = (e) => {
    e.preventDefault();
    if (!form.name) return alert("Candidate Name is required");
    const rec = {
      id: form.id || Date.now() + Math.floor(Math.random() * 1000),
      name: form.name,
      position: form.position || "Quran Teacher",
      offerDate: form.offerDate || todayPK(),
      joiningDate: form.joiningDate || "",
      cnic: form.cnic || "",
      bankDetails: form.bankDetails || "",
      docsSubmitted: form.docsSubmitted || false,
      stage: form.stage || "Offer Sent",
    };
    if (form.id) {
      setHrHiring((hrHiring || []).map((h) => (h.id === form.id ? rec : h)));
    } else {
      setHrHiring([...(hrHiring || []), rec]);
    }
    setModal(null);
    setForm({});
  };

  const deleteInterview = (id) => {
    if (confirm("Are you sure you want to delete this interview record?")) {
      setHrInterviews((hrInterviews || []).filter((i) => i.id !== id));
    }
  };

  const deleteHiring = (id) => {
    if (confirm("Are you sure you want to delete this new hire record?")) {
      setHrHiring((hrHiring || []).filter((h) => h.id !== id));
    }
  };

  const getDecisionColor = (d) => {
    switch (d) {
      case "Hired":
        return c.success;
      case "Rejected":
        return c.danger;
      case "Shortlisted":
        return c.accent;
      default:
        return c.warn;
    }
  };

  const renderInterviews = () => {
    const data = (hrInterviews || []).filter((i) =>
      (i.name || "").toLowerCase().includes(search.toLowerCase()),
    );
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 8,
              padding: "0 10px",
              width: 250,
            },
          },
          React.createElement(Search, { size: 16, color: c.textMuted }),
          React.createElement("input", {
            placeholder: "Search interviews...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            style: {
              border: "none",
              background: "transparent",
              outline: "none",
              color: c.text,
              padding: "10px",
              width: "100%",
              fontSize: 13,
            },
          }),
        ),
        React.createElement(
          "button",
          {
            onClick: () => {
              setForm({});
              setModal("interview");
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: c.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            },
          },
          React.createElement(Plus, { size: 16 }),
          "Add Candidate",
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            overflowX: "auto",
            border: "1px solid " + c.border,
            borderRadius: 10,
          },
        },
        React.createElement(
          "table",
          {
            style: {
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            },
          },
          React.createElement(
            "thead",
            { style: { background: c.bgDeep } },
            React.createElement(
              "tr",
              null,
              [
                "Candidate Name",
                "Role",
                "Interview Date",
                "Interviewer",
                "Score",
                "Decision",
                "Actions",
              ].map((h) =>
                React.createElement(
                  "th",
                  {
                    key: h,
                    style: {
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: c.textSec,
                      textTransform: "uppercase",
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
            data.length === 0
              ? React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "td",
                    {
                      colSpan: 7,
                      style: {
                        padding: 30,
                        textAlign: "center",
                        color: c.textMuted,
                        fontSize: 13,
                      },
                    },
                    "No interviews found",
                  ),
                )
              : data.map((i) =>
                  React.createElement(
                    "tr",
                    {
                      key: i.id,
                      style: { borderTop: "1px solid " + c.border },
                    },
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          fontWeight: 500,
                        },
                      },
                      i.name,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      i.roleApplied,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      i.date,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      i.interviewer,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      i.score + "/10",
                    ),
                    React.createElement(
                      "td",
                      { style: { padding: "12px 16px" } },
                      React.createElement(
                        "span",
                        {
                          style: {
                            padding: "4px 8px",
                            background: getDecisionColor(i.decision) + "22",
                            color: getDecisionColor(i.decision),
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                          },
                        },
                        i.decision,
                      ),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          display: "flex",
                          gap: 10,
                        },
                      },
                      React.createElement(
                        "button",
                        {
                          onClick: () => {
                            setForm(i);
                            setModal("interview");
                          },
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: c.primary,
                          },
                        },
                        React.createElement(Edit2, { size: 16 }),
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => deleteInterview(i.id),
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: c.danger,
                          },
                        },
                        React.createElement(Trash2, { size: 16 }),
                      ),
                    ),
                  ),
                ),
          ),
        ),
      ),
    );
  };

  const renderHiring = () => {
    const data = (hrHiring || []).filter((h) =>
      (h.name || "").toLowerCase().includes(search.toLowerCase()),
    );
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 8,
              padding: "0 10px",
              width: 250,
            },
          },
          React.createElement(Search, { size: 16, color: c.textMuted }),
          React.createElement("input", {
            placeholder: "Search new hires...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            style: {
              border: "none",
              background: "transparent",
              outline: "none",
              color: c.text,
              padding: "10px",
              width: "100%",
              fontSize: 13,
            },
          }),
        ),
        React.createElement(
          "button",
          {
            onClick: () => {
              setForm({});
              setModal("hiring");
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: c.success,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            },
          },
          React.createElement(Plus, { size: 16 }),
          "Add New Hire",
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            overflowX: "auto",
            border: "1px solid " + c.border,
            borderRadius: 10,
          },
        },
        React.createElement(
          "table",
          {
            style: {
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            },
          },
          React.createElement(
            "thead",
            { style: { background: c.bgDeep } },
            React.createElement(
              "tr",
              null,
              [
                "Candidate Name",
                "Position",
                "Offer Date",
                "Joining Date",
                "Docs",
                "Stage",
                "Actions",
              ].map((h) =>
                React.createElement(
                  "th",
                  {
                    key: h,
                    style: {
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: c.textSec,
                      textTransform: "uppercase",
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
            data.length === 0
              ? React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "td",
                    {
                      colSpan: 7,
                      style: {
                        padding: 30,
                        textAlign: "center",
                        color: c.textMuted,
                        fontSize: 13,
                      },
                    },
                    "No new hires found",
                  ),
                )
              : data.map((h) =>
                  React.createElement(
                    "tr",
                    {
                      key: h.id,
                      style: { borderTop: "1px solid " + c.border },
                    },
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          fontWeight: 500,
                        },
                      },
                      h.name,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      h.position,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      h.offerDate,
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          fontSize: 13,
                          color: c.textSec,
                        },
                      },
                      h.joiningDate || "-",
                    ),
                    React.createElement(
                      "td",
                      { style: { padding: "12px 16px", fontSize: 13 } },
                      React.createElement(
                        "div",
                        { style: { display: "flex", gap: 5 } },
                        React.createElement("span", {
                          title: "Documents Submitted",
                          style: {
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: h.docsSubmitted ? c.success : c.danger,
                          },
                        }),
                        React.createElement("span", {
                          title: "Bank Details Provided",
                          style: {
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: h.bankDetails ? c.success : c.danger,
                          },
                        }),
                      ),
                    ),
                    React.createElement(
                      "td",
                      { style: { padding: "12px 16px" } },
                      React.createElement(
                        "span",
                        {
                          style: {
                            padding: "4px 8px",
                            background: c.accent + "22",
                            color: c.accent,
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                          },
                        },
                        h.stage,
                      ),
                    ),
                    React.createElement(
                      "td",
                      {
                        style: {
                          padding: "12px 16px",
                          display: "flex",
                          gap: 10,
                        },
                      },
                      React.createElement(
                        "button",
                        {
                          onClick: () => {
                            setForm(h);
                            setModal("hiring");
                          },
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: c.primary,
                          },
                        },
                        React.createElement(Edit2, { size: 16 }),
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => deleteHiring(h.id),
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: c.danger,
                          },
                        },
                        React.createElement(Trash2, { size: 16 }),
                      ),
                    ),
                  ),
                ),
          ),
        ),
      ),
    );
  };

  const renderModal = () => {
    if (!modal) return null;
    const isInterview = modal === "interview";

    return React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        },
      },
      React.createElement(
        "div",
        {
          style: {
            background: c.bg,
            width: 450,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid " + c.border,
              background: c.bgDeep,
            },
          },
          React.createElement(
            "h3",
            { style: { margin: 0, fontSize: 15, fontWeight: 600 } },
            form.id
              ? isInterview
                ? "Edit Interview"
                : "Edit Hire"
              : isInterview
                ? "Add New Candidate"
                : "Add New Hire",
          ),
          React.createElement(
            "button",
            {
              onClick: () => setModal(null),
              style: {
                background: "none",
                border: "none",
                cursor: "pointer",
                color: c.textMuted,
              },
            },
            React.createElement(X, { size: 20 }),
          ),
        ),
        React.createElement(
          "form",
          {
            onSubmit: isInterview ? saveInterview : saveHiring,
            style: { padding: 20 },
          },
          React.createElement(
            "div",
            { style: { marginBottom: 15 } },
            React.createElement(
              "label",
              {
                style: {
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.textSec,
                  marginBottom: 5,
                },
              },
              "Candidate Name",
            ),
            React.createElement("input", {
              type: "text",
              required: true,
              value: form.name || "",
              onChange: (e) => setForm({ ...form, name: e.target.value }),
              style: {
                width: "100%",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid " + c.border,
                background: c.bgInput,
                color: c.text,
                fontSize: 13,
              },
            }),
          ),

          isInterview &&
            React.createElement(
              React.Fragment,
              null,
              React.createElement(
                "div",
                { style: { display: "flex", gap: 10, marginBottom: 15 } },
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Role Applied",
                  ),
                  React.createElement("input", {
                    type: "text",
                    value: form.roleApplied || "Quran Teacher",
                    onChange: (e) =>
                      setForm({ ...form, roleApplied: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Interview Date",
                  ),
                  React.createElement("input", {
                    type: "date",
                    value: form.date || todayPK(),
                    onChange: (e) => setForm({ ...form, date: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
              ),
              React.createElement(
                "div",
                { style: { display: "flex", gap: 10, marginBottom: 15 } },
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Interviewer",
                  ),
                  React.createElement("input", {
                    type: "text",
                    value: form.interviewer || "",
                    onChange: (e) =>
                      setForm({ ...form, interviewer: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Score (1-10)",
                  ),
                  React.createElement("input", {
                    type: "number",
                    min: 1,
                    max: 10,
                    value: form.score || "5",
                    onChange: (e) =>
                      setForm({ ...form, score: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
              ),
              React.createElement(
                "div",
                { style: { marginBottom: 15 } },
                React.createElement(
                  "label",
                  {
                    style: {
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: c.textSec,
                      marginBottom: 5,
                    },
                  },
                  "Decision",
                ),
                React.createElement(
                  "select",
                  {
                    value: form.decision || "Pending",
                    onChange: (e) =>
                      setForm({ ...form, decision: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  },
                  [
                    "Pending",
                    "Shortlisted",
                    "Interviewing",
                    "Hired",
                    "Rejected",
                  ].map((o) =>
                    React.createElement("option", { key: o, value: o }, o),
                  ),
                ),
              ),
              React.createElement(
                "div",
                { style: { marginBottom: 15 } },
                React.createElement(
                  "label",
                  {
                    style: {
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: c.textSec,
                      marginBottom: 5,
                    },
                  },
                  "Notes",
                ),
                React.createElement("textarea", {
                  rows: 3,
                  value: form.notes || "",
                  onChange: (e) => setForm({ ...form, notes: e.target.value }),
                  style: {
                    width: "100%",
                    padding: "10px",
                    borderRadius: 6,
                    border: "1px solid " + c.border,
                    background: c.bgInput,
                    color: c.text,
                    fontSize: 13,
                    resize: "none",
                  },
                }),
              ),
            ),

          !isInterview &&
            React.createElement(
              React.Fragment,
              null,
              React.createElement(
                "div",
                { style: { display: "flex", gap: 10, marginBottom: 15 } },
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Position",
                  ),
                  React.createElement("input", {
                    type: "text",
                    value: form.position || "Quran Teacher",
                    onChange: (e) =>
                      setForm({ ...form, position: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Stage",
                  ),
                  React.createElement(
                    "select",
                    {
                      value: form.stage || "Offer Sent",
                      onChange: (e) =>
                        setForm({ ...form, stage: e.target.value }),
                      style: {
                        width: "100%",
                        padding: "10px",
                        borderRadius: 6,
                        border: "1px solid " + c.border,
                        background: c.bgInput,
                        color: c.text,
                        fontSize: 13,
                      },
                    },
                    [
                      "Offer Sent",
                      "Docs Pending",
                      "Training",
                      "Active",
                      "Declined",
                    ].map((o) =>
                      React.createElement("option", { key: o, value: o }, o),
                    ),
                  ),
                ),
              ),
              React.createElement(
                "div",
                { style: { display: "flex", gap: 10, marginBottom: 15 } },
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Offer Date",
                  ),
                  React.createElement("input", {
                    type: "date",
                    value: form.offerDate || todayPK(),
                    onChange: (e) =>
                      setForm({ ...form, offerDate: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Joining Date",
                  ),
                  React.createElement("input", {
                    type: "date",
                    value: form.joiningDate || "",
                    onChange: (e) =>
                      setForm({ ...form, joiningDate: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
              ),
              React.createElement(
                "div",
                { style: { display: "flex", gap: 10, marginBottom: 15 } },
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "CNIC",
                  ),
                  React.createElement("input", {
                    type: "text",
                    value: form.cnic || "",
                    onChange: (e) => setForm({ ...form, cnic: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
                React.createElement(
                  "div",
                  { style: { flex: 1 } },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.textSec,
                        marginBottom: 5,
                      },
                    },
                    "Bank Details",
                  ),
                  React.createElement("input", {
                    type: "text",
                    placeholder: "Bank Name / Account",
                    value: form.bankDetails || "",
                    onChange: (e) =>
                      setForm({ ...form, bankDetails: e.target.value }),
                    style: {
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid " + c.border,
                      background: c.bgInput,
                      color: c.text,
                      fontSize: 13,
                    },
                  }),
                ),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 20,
                    marginBottom: 15,
                    padding: "10px 0",
                  },
                },
                React.createElement(
                  "label",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: c.text,
                    },
                  },
                  React.createElement("input", {
                    type: "checkbox",
                    checked: form.docsSubmitted || false,
                    onChange: (e) =>
                      setForm({ ...form, docsSubmitted: e.target.checked }),
                  }),
                  "Documents Submitted",
                ),
                React.createElement(
                  "label",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: c.text,
                    },
                  },
                  React.createElement("input", {
                    type: "checkbox",
                    checked: form.bankDetails ? true : false,
                    disabled: true,
                  }),
                  "Bank Added",
                ),
              ),
            ),

          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              },
            },
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => setModal(null),
                style: {
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "1px solid " + c.border,
                  background: c.bgDeep,
                  color: c.text,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Cancel",
            ),
            React.createElement(
              "button",
              {
                type: "submit",
                style: {
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: c.primary,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
              "Save Record",
            ),
          ),
        ),
      ),
    );
  };

  return React.createElement(
    "div",
    { style: { padding: 30, maxWidth: 1200, margin: "0 auto" } },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 30,
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement(
          "div",
          {
            style: {
              width: 40,
              height: 40,
              borderRadius: 10,
              background: c.accent + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.accent,
            },
          },
          React.createElement(UserCheck, { size: 20 }),
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "h1",
            {
              style: {
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: c.text,
              },
            },
            "Human Resources",
          ),
          React.createElement(
            "div",
            { style: { fontSize: 13, color: c.textSec, marginTop: 4 } },
            "Manage candidates, onboarding, and staff performance.",
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 10,
          marginBottom: 20,
          borderBottom: "1px solid " + c.border,
          paddingBottom: 10,
        },
      },
      [
        { id: "interviews", label: "Interviews" },
        { id: "hiring", label: "New Hiring" },
      ].map((t) =>
        React.createElement(
          "button",
          {
            key: t.id,
            onClick: () => setTab(t.id),
            style: {
              padding: "8px 16px",
              background: tab === t.id ? c.primary : "transparent",
              color: tab === t.id ? "#fff" : c.textSec,
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            },
          },
          t.label,
        ),
      ),
    ),

    React.createElement(
      "div",
      {
        style: {
          background: c.bg,
          border: "1px solid " + c.border,
          borderRadius: 12,
          padding: 20,
        },
      },
      tab === "interviews" && renderInterviews(),
      tab === "hiring" && renderHiring(),
    ),

    renderModal(),
  );
};
