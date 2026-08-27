const ViewDetail = ({
  t,
  tLeaves,
  teacherFeedback,
  onClose,
  onEdit,
  onLeave,
}) =>
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
          width: 600,
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
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 12,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 44,
                height: 44,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg," +
                  (t.gender === "Male" ? c.accent : c.purple) +
                  "," +
                  c.cyan +
                  ")",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: c.accentText,
              },
            },
            t.name[0],
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 16,
                  margin: 0,
                },
              },
              t.name,
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
              "Code: ",
              t.code,
              " | ",
              t.location,
              " | ",
              t.gender,
            ),
          ),
        ),
        React.createElement(
          "button",
          {
            onClick: () => {
              if (t.phone)
                window.location.href = "tel:" + t.phone.replace(/[^0-9+]/g, "");
              else alert("Phone number not available for this teacher.");
            },
            onClick: onClose,
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
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 16,
          },
        },
        [
          ["Team Lead", t.teamLead, Shield],
          ["Join Date", t.joinDate, Calendar],
          ["Status", t.status, UserCheck],
          ["Salary", "Rs " + String(t.salary || 0), CreditCard],
          ["Phone", t.phone, Phone],
          ["CNIC", t.cnic, Hash],
          ["Bank", t.bank, CreditCard],
          ["Students", String(t.students), Users],
          [
            "Free Slots",
            (() => {
              const cf = computeFree(t);
              return cf.free + "/" + cf.total;
            })(),
            Clock,
          ],
          [
            "Zoom Link",
            t.zoom && t.zoom.trim() ? "\u2713 Linked" : "Not set",
            Video,
          ],
        ].map(([l, v, Ic]) =>
          React.createElement(
            "div",
            {
              key: l,
              style: {
                background: c.bgDeep,
                borderRadius: 8,
                padding: "10px 12px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 4,
                },
              },
              React.createElement(Ic, {
                size: 11,
                color: c.textMuted,
              }),
              React.createElement(
                "span",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 9,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  },
                },
                l,
              ),
            ),
            React.createElement(
              "p",
              {
                style: {
                  color: c.text,
                  fontSize: 12,
                  margin: 0,
                  fontWeight: 500,
                },
              },
              String(v),
            ),
          ),
        ),
      ),
      React.createElement(
        "h4",
        {
          style: {
            color: c.text,
            fontSize: 13,
            margin: "0 0 10px",
            fontWeight: 600,
          },
        },
        "Performance",
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          },
        },
        [
          [
            "Rating",
            (t.perfRating || 0).toFixed(1) + "★",
            t.perfRating >= 4.5
              ? c.success
              : t.perfRating >= 3.5
                ? c.warn
                : c.danger,
          ],
          [
            "Completion",
            t.classCompletion + "%",
            t.classCompletion >= 95 ? c.success : c.warn,
          ],
          [
            "Satisfaction",
            t.studentSatisfaction + "%",
            t.studentSatisfaction >= 90 ? c.success : c.warn,
          ],
          [
            "Attendance",
            t.attendanceRate + "%",
            t.attendanceRate >= 96 ? c.success : c.warn,
          ],
        ].map(([l, v, col]) =>
          React.createElement(
            "div",
            {
              key: l,
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: c.bgDeep,
                borderRadius: 6,
                padding: "8px 12px",
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
              l,
            ),
            React.createElement(
              "span",
              {
                style: {
                  color: col,
                  fontWeight: 700,
                  fontSize: 14,
                },
              },
              v,
            ),
          ),
        ),
      ),
      React.createElement(
        "h4",
        {
          style: {
            color: c.text,
            fontSize: 13,
            margin: "0 0 10px",
            fontWeight: 600,
          },
        },
        "Leave History (",
        tLeaves.length,
        ")",
      ),
      tLeaves.length === 0
        ? React.createElement(
            "p",
            {
              style: {
                color: c.textMuted,
                fontSize: 11,
              },
            },
            "No leave records",
          )
        : React.createElement(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 6,
              },
            },
            tLeaves.map((l) =>
              React.createElement(
                "div",
                {
                  key: l.id,
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: c.bgDeep,
                    borderRadius: 6,
                    padding: "8px 12px",
                  },
                },
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "span",
                    {
                      style: {
                        color: c.text,
                        fontSize: 11,
                        fontWeight: 500,
                      },
                    },
                    l.type,
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
                    l.from,
                    " to ",
                    l.to,
                    " (",
                    l.days,
                    "d)",
                  ),
                ),
                React.createElement(
                  Badge,
                  {
                    text: l.status,
                    color:
                      l.status === "approved"
                        ? "success"
                        : l.status === "pending"
                          ? "warn"
                          : "danger",
                  },
                  React.createElement(
                    "h4",
                    {
                      style: {
                        color: c.text,
                        fontSize: 13,
                        margin: "16px 0 10px",
                        fontWeight: 600,
                      },
                    },
                    "Feedback Provided (",
                    (teacherFeedback || []).filter((f) => f.author === t.name)
                      .length,
                    ")",
                  ),
                  (teacherFeedback || []).filter((f) => f.author === t.name)
                    .length === 0
                    ? React.createElement(
                        "p",
                        {
                          style: {
                            color: c.textMuted,
                            fontSize: 11,
                          },
                        },
                        "No feedback provided by this teacher.",
                      )
                    : React.createElement(
                        "div",
                        {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          },
                        },
                        (teacherFeedback || [])
                          .filter((f) => f.author === t.name)
                          .map((f) =>
                            React.createElement(
                              "div",
                              {
                                key: f.id,
                                style: {
                                  background: c.bgDeep,
                                  borderRadius: 6,
                                  padding: "8px 12px",
                                  borderLeft: "3px solid " + c.success,
                                },
                              },
                              React.createElement(
                                "div",
                                {
                                  style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 4,
                                  },
                                },
                                React.createElement(
                                  "span",
                                  {
                                    style: {
                                      color: c.text,
                                      fontSize: 11,
                                      fontWeight: 600,
                                    },
                                  },
                                  "Student ID: " + f.studentId,
                                ),
                                React.createElement(
                                  "span",
                                  {
                                    style: {
                                      color: c.textMuted,
                                      fontSize: 9,
                                    },
                                  },
                                  new Date(f.createdAt).toLocaleDateString(),
                                ),
                              ),
                              React.createElement(
                                "div",
                                {
                                  style: {
                                    color: c.textSec,
                                    fontSize: 11,
                                    whiteSpace: "pre-wrap",
                                  },
                                },
                                f.text,
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
            display: "flex",
            gap: 8,
            marginTop: 16,
          },
        },
        React.createElement(
          Btn,
          {
            variant: "outline",
            onClick: onEdit,
          },
          "Edit",
        ),
        React.createElement(
          Btn,
          {
            variant: "outline",
            onClick: onLeave,
            icon: Calendar,
          },
          "Leave",
        ),
      ),
    ),
  );
