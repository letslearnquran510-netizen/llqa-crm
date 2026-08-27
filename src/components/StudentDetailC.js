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
                  "linear-gradient(135deg," + c.success + "," + c.cyan + ")",
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
                    React.createElement("span", null, s.time || "N/A"),
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
                : s.time || "N/A";
            })(),
            Clock,
          ],
          ["Fee", s.fee, CreditCard],
          ["Attendance", s.attendance + "%", Check],
          ["Classes", String(s.totalClasses), BookOpen],
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
                    fontSize: 8,
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
      React.createElement(
        "h4",
        {
          style: {
            color: c.text,
            fontSize: 12,
            margin: "0 0 8px",
            fontWeight: 600,
          },
        },
        "Course Progress",
      ),
      React.createElement(
        "div",
        {
          style: {
            background: c.bgDeep,
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 12,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
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
            s.course.includes("Quaida") ? "Qaida" : "Quran",
          ),
          React.createElement(
            "span",
            {
              style: {
                color: c.accent,
                fontWeight: 700,
              },
            },
            pp(s),
            "%",
          ),
        ),
        React.createElement(PBar, {
          value: pp(s),
          color: pp(s) >= 80 ? c.success : pp(s) >= 40 ? c.accent : c.warn,
        }),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              marginTop: 5,
              fontSize: 10,
            },
          },
          s.course.includes("Quaida")
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  "span",
                  {
                    style: {
                      color: c.textSec,
                    },
                  },
                  "Page ",
                  s.qaida,
                  "/30",
                ),
                React.createElement(
                  "span",
                  {
                    style: {
                      color: c.purple,
                    },
                  },
                  "Qaida",
                ),
              )
            : React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  "span",
                  {
                    style: {
                      color: c.textSec,
                    },
                  },
                  "Pg ",
                  s.page,
                  "/604 \xB7 Juz ",
                  s.juz,
                ),
                React.createElement(
                  "span",
                  {
                    style: {
                      color: c.accent,
                    },
                  },
                  s.surah || "—",
                ),
              ),
        ),
      ),
      React.createElement(
        "h4",
        {
          style: {
            color: c.text,
            fontSize: 12,
            margin: "0 0 8px",
            fontWeight: 600,
          },
        },
        "Last Session",
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 12,
          },
        },
        [
          ["Behavior", s.lB, bc(s.lB)],
          [
            "Performance",
            s.lP,
            s.lP === "Outstanding" || s.lP === "Very Good"
              ? c.success
              : s.lP === "Below Average" || s.lP === "Struggling"
                ? c.danger
                : c.textSec,
          ],
          [
            "Homework",
            s.lH,
            s.lH === "Completed"
              ? c.success
              : s.lH === "Not Done"
                ? c.danger
                : c.warn,
          ],
          [
            "Recitation",
            s.lR,
            s.lR === "Fluent & Clear" ? c.success : c.textSec,
          ],
          [
            "Tajweed",
            s.lT,
            s.lT === "Excellent Tajweed" ? c.success : c.textSec,
          ],
        ].map(([l, v, col]) =>
          v && v !== "N/A" && v !== ""
            ? React.createElement(
                "div",
                {
                  key: l,
                  style: {
                    background: c.bgDeep,
                    borderRadius: 6,
                    padding: "6px 10px",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 8,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    },
                  },
                  l,
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: col,
                      fontSize: 11,
                      fontWeight: 600,
                    },
                  },
                  v,
                ),
              )
            : null,
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
          s.lastDate,
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
          s.lastLesson,
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
