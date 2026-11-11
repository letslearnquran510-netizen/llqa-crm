const StudentDetailC = ({ s, onClose, onP, pp, bc, teacherFeedback }) =>
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
                  "linear-gradient(135deg," + c.successFill + "," + c.cyanFill + ")",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: c.cyanText,
              },
            },
            s.name[0],
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
              s.name,
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
              s.course,
              " \xB7 ",
              s.teacher,
            ),
          ),
        ),
        React.createElement(
          "button",
          {
            onClick: onClose, // v70: a dead duplicate onClick (undefined "t") removed
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
            gap: 8,
            marginBottom: 14,
          },
        },
        [
          ["Age", s.age || "N/A", Users],
          ["Parent", s.parent, Shield],
          ["Location", s.country + " · " + s.state, Globe],
          ["DOR", s.dor, Calendar],
          [
            "USA Time",
            (() => {
              const _pk = toPakTime(s.time, s.state);
              return _pk
                ? React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      },
                    },
                    React.createElement("span", null, llqaTimeText(s.time) || "N/A"),
                    React.createElement(
                      "span",
                      {
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          color: c.warn,
                          fontSize: 10,
                          fontWeight: 600,
                        },
                      },
                      React.createElement(
                        "span",
                        {
                          style: {
                            fontSize: 11,
                          },
                        },
                        "🇵🇰",
                      ),
                      "PK ",
                      _pk,
                    ),
                  )
                : llqaTimeText(s.time) || "N/A";
            })(),
            Clock,
          ],
          ["Fee", s.fee, CreditCard],
          ["Attendance", llqaPctText(llqaStuStats(s).last30.pct) + " (30 days)", Check], // v73: from the class records
          ["Classes", llqaStuStats(s).last30.classes + " in 30 days", BookOpen], // v73
          ["Status", s.status, UserCheck],
        ].map(([l, v, Ic]) =>
          React.createElement(
            "div",
            {
              key: l,
              style: {
                background: c.bgDeep,
                borderRadius: 8,
                padding: "8px 10px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  marginBottom: 3,
                },
              },
              React.createElement(Ic, {
                size: 10,
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
                  fontSize: 11,
                  margin: 0,
                  fontWeight: 500,
                  wordBreak: "break-word",
                },
              },
              String(v),
            ),
          ),
        ),
      ),
      React.createElement(LLQAStudentAllDetails, { s: s }),
      // v73: progress in the student's own book, the last 30 days, the last session and the recent classes — from the records
      React.createElement(LLQAStuProgress, { s: s, bc: bc }),
      React.createElement(
        "div",
        {
          style: {
            background: c.bgDeep,
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              color: c.textSec,
              fontSize: 9,
              textTransform: "uppercase",
              marginBottom: 3,
            },
          },
          "Last Lesson \u2014 ",
          s.lastDate || "\u2014",
        ),
        React.createElement(
          "div",
          {
            style: {
              color: c.text,
              fontSize: 12,
              fontWeight: 500,
            },
          },
          s.lastLesson || "No class logged yet",
        ),
        React.createElement(
          "h4",
          {
            style: {
              color: c.text,
              fontSize: 12,
              margin: "12px 0 8px",
              fontWeight: 600,
            },
          },
          "Teacher Feedback",
        ),
        (teacherFeedback || []).filter((f) => f.studentId === s.id).length === 0
          ? React.createElement(
              "p",
              {
                style: {
                  color: c.textMuted,
                  fontSize: 11,
                },
              },
              "No feedback provided yet.",
            )
          : React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 12,
                },
              },
              (teacherFeedback || [])
                .filter((f) => f.studentId === s.id)
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
                        f.author,
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
      s.notes &&
        React.createElement(
          "div",
          {
            style: {
              background:
                s.notes.includes("Don't") || s.notes.includes("ADHD")
                  ? c.dangerBg
                  : c.warnBg,
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 12,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                color: c.textSec,
                fontSize: 9,
                textTransform: "uppercase",
                marginBottom: 3,
              },
            },
            "Notes",
          ),
          React.createElement(
            "div",
            {
              style: {
                color: c.text,
                fontSize: 11,
              },
            },
            s.notes,
          ),
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
            variant: "outline",
            onClick: onClose,
          },
          "Close",
        ),
        React.createElement(
          Btn,
          {
            onClick: onP,
            icon: Edit2,
          },
          "Log Progress",
        ),
      ),
    ),
  );
