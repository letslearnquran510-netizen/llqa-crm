const ParentMod = ({
  user,
  arPayments,
  students,
  setStudents,
  teachers,
  dailyProgress,
  setDailyProgress,
  parentNotes,
  setParentNotes,
}) => {
  const isParent = user && user.role === "parent";
  const allStudents = students || [];
  const myStudent = isParent
    ? allStudents.find((s) => s.parentId === user.parentId)
    : null;
  const [selectedStuId, setSelectedStuId] = useState(
    allStudents[0] ? allStudents[0].id : null,
  );
  const stu = isParent
    ? myStudent
    : allStudents.find((s) => s.id === selectedStuId);
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  if (!stu) {
    return React.createElement(
      "div",
      {
        style: {
          padding: 30,
          textAlign: "center",
          color: c.textSec,
        },
      },
      isParent
        ? "No student linked to this parent ID. Contact administration."
        : "No students available.",
    );
  }
  const myProgress = (dailyProgress || [])
    .filter((p) => p.studentId === stu.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const myNotes = (parentNotes || [])
    .filter((n) => n.studentId === stu.id)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const today = todayPK();
  const monthAgo = todayPK(new Date(Date.now() - 30 * 86400000));
  const last30 = myProgress.filter(
    (p) => p.date >= monthAgo && p.date <= today,
  );
  const presentDays = last30.filter(
    (p) => p.attended === "present" || p.attended === "late",
  ).length;
  const lateDays = last30.filter((p) => p.attended === "late").length;
  const absentDays = last30.filter((p) => p.attended === "absent").length;
  const attendancePct =
    last30.length > 0 ? Math.round((presentDays / last30.length) * 100) : null;
  const teacherRec = (teachers || []).find((t) => t.name === stu.teacher);
  const addNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      id: Date.now(),
      studentId: stu.id,
      author: isParent ? user.name || "Parent" : "Admin",
      authorRole: isParent ? "parent" : "admin",
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };
    setParentNotes([newNote, ...(parentNotes || [])]);
    setNoteText("");
  };
  const deleteNote = (id) => {
    if (!confirm("Delete this note?")) return;
    setParentNotes((parentNotes || []).filter((n) => n.id !== id));
  };
  const generateParentId = () => {
    const existing = new Set(
      allStudents.map((s) => s.parentId).filter(Boolean),
    );
    let id;
    do {
      id = "P-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (existing.has(id));
    setStudents(
      allStudents.map((s) =>
        s.id === stu.id
          ? {
              ...s,
              parentId: id,
            }
          : s,
      ),
    );
    alert(
      "Parent ID generated:\n\n" +
        id +
        "\n\nShare this with the parent. They use this ID to log in.",
    );
  };
  const printInvoice = (inv) => {
    const w = window.open("", "invoice", "width=800,height=900");
    if (!w) return;
    w.document.write(
      "<!DOCTYPE html><html><head><title>Invoice " +
        escHTML(inv.id) +
        "</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#222;}h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;}th{background:#f3f4f6;}.total{font-size:18px;font-weight:bold;color:#1e40af;text-align:right;padding:15px 0;border-top:2px solid #1e40af;margin-top:20px;}.meta{color:#666;margin:5px 0;font-size:12px;}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;}.brand{font-size:20px;font-weight:bold;color:#1e40af;}.muted{color:#888;font-size:11px;margin-top:30px;text-align:center;}</style></head><body>",
    );
    w.document.write(
      '<div class="header"><div><div class="brand">LLQA Academy</div><div class="meta">Let\u0027s Learn Quran</div><div class="meta">Rawalpindi, Pakistan</div><div class="meta">letslearnquran.net</div></div><div style="text-align:right;"><h1 style="margin:0;border:none;padding:0;">INVOICE</h1><div class="meta">Invoice #: INV-' +
        escHTML(inv.id) +
        '</div><div class="meta">Date: ' +
        escHTML(inv.date) +
        '</div><div class="meta">Status: <strong style="color:' +
        (inv.status === "paid"
          ? "#10b981"
          : inv.status === "overdue"
            ? "#ef4444"
            : "#f59e0b") +
        '">' +
        escHTML(inv.status.toUpperCase()) +
        "</strong></div></div></div>",
    );
    w.document.write(
      '<div style="background:#f9fafb;padding:15px;border-radius:8px;margin-bottom:20px;"><strong>Bill To:</strong><br>' +
        escHTML(stu.parent || "-") +
        '<br><span class="meta">Student: ' +
        escHTML(stu.name) +
        " (Age " +
        escHTML(stu.age || "-") +
        ')</span><br><span class="meta">Course: ' +
        escHTML(stu.course || "-") +
        '</span><br><span class="meta">Country: ' +
        escHTML(stu.country || "-") +
        " \u00B7 " +
        escHTML(stu.state || "") +
        "</span></div>",
    );
    w.document.write(
      "<table><thead><tr><th>Description</th><th>Period</th><th>Hours/Week</th><th>Amount</th></tr></thead><tbody>",
    );
    w.document.write(
      "<tr><td>" +
        escHTML(stu.course || "Quran Class") +
        " - " +
        escHTML(stu.teacher || "Unassigned") +
        "</td><td>" +
        escHTML(inv.period) +
        "</td><td>" +
        escHTML(stu.hoursPerWeek || "-") +
        "</td><td>" +
        escHTML(stu.currency || "USD") +
        " " +
        escHTML(
          stu.fee_amount && parseFloat(stu.fee_amount) > 0
            ? parseFloat(stu.fee_amount).toLocaleString()
            : "Not set",
        ) +
        "</td></tr>",
    );
    w.document.write("</tbody></table>");
    w.document.write(
      '<div class="total">Total Due: ' +
        escHTML(stu.currency || "USD") +
        " " +
        escHTML(
          stu.fee_amount && parseFloat(stu.fee_amount) > 0
            ? parseFloat(stu.fee_amount).toLocaleString()
            : "Not set",
        ) +
        "</div>",
    );
    w.document.write(
      '<div class="muted">Thank you for choosing LLQA Academy. For queries: support@letslearnquran.net</div>',
    );
    w.document.write(
      "<script>window.onload=function(){window.print();};</" + "script>",
    );
    w.document.write("</body></html>");
    w.document.close();
  };
  const invoiceHistory = (() => {
    const dor = stu.dor ? new Date(stu.dor) : new Date();
    const now = new Date();
    const months = [];
    const cursor = new Date(dor.getFullYear(), dor.getMonth(), 1);
    const pays = arPayments || [];
    const studentPays = pays.filter(
      (p) => String(p.studentId) === String(stu.id),
    );
    while (cursor <= now) {
      const ym =
        cursor.getFullYear() +
        "-" +
        String(cursor.getMonth() + 1).padStart(2, "0");
      const isCurrent =
        cursor.getFullYear() === now.getFullYear() &&
        cursor.getMonth() === now.getMonth();
      const monthsAgo =
        (now.getFullYear() - cursor.getFullYear()) * 12 +
        (now.getMonth() - cursor.getMonth());
      const paymentRecord = studentPays.find(
        (p) => p.paidDate && p.paidDate.startsWith(ym),
      );
      const hasPaid = !!paymentRecord;
      let status = hasPaid ? "paid" : monthsAgo > 0 ? "overdue" : "pending";

      let amt = null;
      let curr = stu.currency || "USD";
      if (paymentRecord && parseFloat(paymentRecord.amount) > 0) {
        amt = parseFloat(paymentRecord.amount);
        curr = paymentRecord.currency || curr;
      } else if (stu.fee_amount && parseFloat(stu.fee_amount) > 0) {
        amt = parseFloat(stu.fee_amount);
      }

      months.push({
        id: ym,
        date: todayPK(cursor),
        period: cursor.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
        status: status,
        amount: amt,
        currency: curr,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months.reverse();
  })();
  const SC = ({ label, value, color, sub }) =>
    React.createElement(
      "div",
      {
        style: {
          background: c.bgCard,
          border: "1px solid " + c.border,
          borderRadius: 10,
          padding: 14,
          minWidth: 140,
          flex: "1 1 140px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            color: c.textSec,
            fontSize: 9,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 6,
          },
        },
        label,
      ),
      React.createElement(
        "div",
        {
          style: {
            color: color || c.text,
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.1,
          },
        },
        value,
      ),
      sub
        ? React.createElement(
            "div",
            {
              style: {
                color: c.textMuted,
                fontSize: 10,
                marginTop: 4,
              },
            },
            sub,
          )
        : null,
    );
  return React.createElement(
    "div",
    null,
    dayDetail &&
      (function () {
        const r = dayDetail.rec;
        if (!r) return null;
        const color =
          r.attended === "present"
            ? c.success
            : r.attended === "late"
              ? c.warn
              : c.danger;
        const statusLabel =
          r.attended === "present"
            ? "Present"
            : r.attended === "late"
              ? "Late"
              : "Absent";
        const _dp = (r.date || "").split("-").map(Number);
        const dObj =
          _dp.length === 3
            ? new Date(_dp[0], _dp[1] - 1, _dp[2])
            : new Date(r.date);
        const fullDate = dObj.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const hasDetails =
          r.lesson ||
          r.pages ||
          r.behavior ||
          r.performance ||
          r.homework ||
          r.recitation ||
          r.tajweed ||
          r.notes;
        const loggedAt = r.createdAt
          ? new Date(r.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
          : null;
        const close = () => setDayDetail(null);
        return React.createElement(
          "div",
          {
            onClick: close,
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              animation: "fadeIn 0.2s ease-out",
            },
          },
          React.createElement(
            "div",
            {
              onClick: (e) => e.stopPropagation(),
              style: {
                background: c.bgCard,
                border: "1px solid " + color + "44",
                borderRadius: 16,
                padding: 0,
                maxWidth: 520,
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px " + color + "22",
                position: "relative",
              },
            },
            React.createElement("div", {
              style: {
                height: 5,
                background:
                  "linear-gradient(90deg, " + color + ", " + color + "88)",
                borderRadius: "16px 16px 0 0",
              },
            }),
            React.createElement(
              "button",
              {
                onClick: close,
                style: {
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: c.bgDeep,
                  border: "1px solid " + c.border,
                  color: c.text,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  padding: 0,
                },
              },
              "\u00D7",
            ),
            React.createElement(
              "div",
              {
                style: {
                  padding: "22px 26px",
                },
              },
              (function () {
                const sInitials = (stu.name || "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                let sHash = 0;
                for (let i = 0; i < (stu.name || "").length; i++)
                  sHash = (sHash << 5) - sHash + (stu.name || "").charCodeAt(i);
                const sH1 = Math.abs(sHash) % 360;
                const sH2 = (sH1 + 50) % 360;
                const sAvatarBg =
                  "linear-gradient(135deg,hsl(" +
                  sH1 +
                  ",65%,55%),hsl(" +
                  sH2 +
                  ",70%,45%))";
                return React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      paddingBottom: 14,
                      marginBottom: 16,
                      borderBottom: "1px solid " + c.border,
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        background: sAvatarBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                        flexShrink: 0,
                        boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                      },
                    },
                    sInitials,
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 36,
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        style: {
                          color: c.text,
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1.2,
                          marginBottom: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      },
                      stu.name || "-",
                    ),
                    React.createElement(
                      "div",
                      {
                        style: {
                          color: c.textMuted,
                          fontSize: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        },
                      },
                      stu.parent
                        ? React.createElement(
                            "span",
                            null,
                            "Parent: ",
                            React.createElement(
                              "strong",
                              {
                                style: {
                                  color: c.textSec,
                                  fontWeight: 600,
                                },
                              },
                              stu.parent,
                            ),
                          )
                        : null,
                      stu.age
                        ? React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textMuted,
                              },
                            },
                            "\u2022 Age " + stu.age,
                          )
                        : null,
                      stu.course
                        ? React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textMuted,
                              },
                            },
                            "\u2022 " + stu.course,
                          )
                        : null,
                    ),
                  ),
                );
              })(),
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 18,
                    paddingRight: 40,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      background: color + "22",
                      border: "2px solid " + color + "66",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: color,
                      fontSize: 24,
                      fontWeight: 800,
                      flexShrink: 0,
                    },
                  },
                  r.attended === "present"
                    ? "\u2713"
                    : r.attended === "late"
                      ? "\u23F0"
                      : "\u2715",
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      flex: 1,
                      minWidth: 0,
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: color,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        marginBottom: 4,
                      },
                    },
                    statusLabel,
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.text,
                        fontSize: 17,
                        fontWeight: 700,
                        lineHeight: 1.3,
                      },
                    },
                    fullDate,
                  ),
                  dayDetail.isToday
                    ? React.createElement(
                        "div",
                        {
                          style: {
                            color: c.cyan,
                            fontSize: 10,
                            fontWeight: 600,
                            marginTop: 4,
                          },
                        },
                        "\u2022 Today",
                      )
                    : null,
                ),
              ),
              React.createElement("div", {
                style: {
                  height: 1,
                  background: c.border,
                  marginBottom: 18,
                },
              }),
              hasDetails
                ? React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      },
                    },
                    r.lesson
                      ? React.createElement(
                          "div",
                          {
                            style: {
                              background: c.bgDeep,
                              border: "1px solid " + c.border,
                              borderRadius: 10,
                              padding: 14,
                            },
                          },
                          React.createElement(
                            "div",
                            {
                              style: {
                                color: c.textMuted,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.6,
                                marginBottom: 6,
                              },
                            },
                            "Lesson",
                          ),
                          React.createElement(
                            "div",
                            {
                              style: {
                                color: c.text,
                                fontSize: 14,
                                fontWeight: 600,
                                lineHeight: 1.4,
                              },
                            },
                            r.lesson,
                          ),
                          r.pages
                            ? React.createElement(
                                "div",
                                {
                                  style: {
                                    color: c.textSec,
                                    fontSize: 11,
                                    marginTop: 6,
                                  },
                                },
                                "Pages: " + r.pages,
                              )
                            : null,
                        )
                      : null,
                    r.behavior ||
                      r.performance ||
                      r.homework ||
                      r.recitation ||
                      r.tajweed
                      ? React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "div",
                            {
                              style: {
                                color: c.textMuted,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.6,
                                marginBottom: 10,
                              },
                            },
                            "Performance",
                          ),
                          React.createElement(
                            "div",
                            {
                              style: {
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(120px,1fr))",
                                gap: 8,
                              },
                            },
                            [
                              ["Behavior", r.behavior, c.accent],
                              ["Performance", r.performance, c.purple],
                              ["Homework", r.homework, c.cyan],
                              ["Recitation", r.recitation, c.success],
                              ["Tajweed", r.tajweed, c.warn],
                            ]
                              .filter(([l, v]) => v)
                              .map(([l, v, col]) =>
                                React.createElement(
                                  "div",
                                  {
                                    key: l,
                                    style: {
                                      background: c.bgDeep,
                                      border: "1px solid " + c.border,
                                      borderLeft: "3px solid " + col,
                                      borderRadius: 8,
                                      padding: "10px 12px",
                                    },
                                  },
                                  React.createElement(
                                    "div",
                                    {
                                      style: {
                                        color: c.textMuted,
                                        fontSize: 9,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        marginBottom: 3,
                                      },
                                    },
                                    l,
                                  ),
                                  React.createElement(
                                    "div",
                                    {
                                      style: {
                                        color: c.text,
                                        fontSize: 12,
                                        fontWeight: 600,
                                      },
                                    },
                                    v,
                                  ),
                                ),
                              ),
                          ),
                        )
                      : null,
                    r.notes
                      ? React.createElement(
                          "div",
                          {
                            style: {
                              background: c.warnBg || c.warn + "10",
                              border: "1px solid " + c.warn + "33",
                              borderLeft: "3px solid " + c.warn,
                              borderRadius: 8,
                              padding: "10px 12px",
                            },
                          },
                          React.createElement(
                            "div",
                            {
                              style: {
                                color: c.warn,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginBottom: 5,
                              },
                            },
                            "\u270E Teacher Notes",
                          ),
                          React.createElement(
                            "div",
                            {
                              style: {
                                color: c.text,
                                fontSize: 11,
                                lineHeight: 1.5,
                                whiteSpace: "pre-wrap",
                              },
                            },
                            r.notes,
                          ),
                        )
                      : null,
                  )
                : React.createElement(
                    "div",
                    {
                      style: {
                        textAlign: "center",
                        padding: "24px 16px",
                        color: c.textMuted,
                        fontSize: 11,
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 26,
                          marginBottom: 8,
                        },
                      },
                      "\u2139\uFE0F",
                    ),
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 12,
                          color: c.textSec,
                          marginBottom: 4,
                          fontWeight: 600,
                        },
                      },
                      "Quick attendance only",
                    ),
                    React.createElement(
                      "div",
                      null,
                      "Status was recorded but no class details were logged.",
                      React.createElement("br"),
                      "Full lesson details appear when the teacher logs progress via the Log Class form.",
                    ),
                  ),
              r.teacherName || loggedAt
                ? React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 18,
                        paddingTop: 14,
                        borderTop: "1px solid " + c.border,
                        fontSize: 10,
                        color: c.textMuted,
                        flexWrap: "wrap",
                        gap: 8,
                      },
                    },
                    r.teacherName
                      ? React.createElement(
                          "div",
                          null,
                          "Teacher: ",
                          React.createElement(
                            "strong",
                            {
                              style: {
                                color: c.textSec,
                              },
                            },
                            r.teacherName,
                          ),
                        )
                      : React.createElement("div", null),
                    loggedAt
                      ? React.createElement("div", null, "Recorded ", loggedAt)
                      : null,
                  )
                : null,
            ),
          ),
        );
      })(),
    !isParent &&
      React.createElement(
        "div",
        {
          style: {
            background: c.accentBg,
            border: "1px solid " + c.accent + "44",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          },
        },
        React.createElement(
          "span",
          {
            style: {
              color: c.accent,
              fontSize: 11,
              fontWeight: 600,
            },
          },
          "\uD83D\uDC41 Admin View \u2014 Viewing as Parent of:",
        ),
        React.createElement(
          "select",
          {
            value: selectedStuId || "",
            onChange: (e) => setSelectedStuId(Number(e.target.value)),
            style: {
              padding: "6px 10px",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 6,
              color: c.text,
              fontSize: 11,
              outline: "none",
            },
          },
          allStudents.map((s) =>
            React.createElement(
              "option",
              {
                key: s.id,
                value: s.id,
              },
              s.name +
                " (parent: " +
                (s.parent || "-") +
                ")" +
                (s.parentId ? " \u2022 ID: " + s.parentId : " \u2022 No ID"),
            ),
          ),
        ),
      ),
    (function () {
      const initials = (stu.name || "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
      let hash = 0;
      for (let i = 0; i < (stu.name || "").length; i++)
        hash = (hash << 5) - hash + (stu.name || "").charCodeAt(i);
      const hue1 = Math.abs(hash) % 360;
      const hue2 = (hue1 + 50) % 360;
      const avatarBg =
        "linear-gradient(135deg,hsl(" +
        hue1 +
        ",65%,55%),hsl(" +
        hue2 +
        ",70%,45%))";
      const joinedDate = stu.dor
        ? new Date(stu.dor).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "-";
      const dobDate = stu.dob
        ? new Date(stu.dob).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null;
      const location =
        [stu.state, stu.country].filter(Boolean).join(", ") || "-";
      const hasProgress = stu.juz || stu.surah || stu.page || stu.qaida;
      return React.createElement(
        "div",
        {
          style: {
            background: c.bgCard,
            border: "1px solid " + c.border,
            borderRadius: 14,
            padding: 0,
            marginBottom: 14,
            overflow: "hidden",
          },
        },
        React.createElement("div", {
          style: {
            height: 4,
            background: avatarBg,
          },
        }),
        React.createElement(
          "div",
          {
            style: {
              padding: "20px 22px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 14,
                flex: 1,
                minWidth: 0,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: avatarBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                },
              },
              initials,
            ),
            React.createElement(
              "div",
              {
                style: {
                  minWidth: 0,
                  flex: 1,
                },
              },
              React.createElement(
                "h2",
                {
                  style: {
                    color: c.text,
                    fontSize: 22,
                    margin: "0 0 4px",
                    fontWeight: 700,
                    lineHeight: 1.1,
                  },
                },
                stu.name || "-",
              ),
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  },
                },
                stu.code
                  ? React.createElement(
                      "div",
                      {
                        style: {
                          color: c.textSec,
                          fontSize: 11,
                          fontFamily: "monospace",
                          fontWeight: 600,
                          padding: "2px 8px",
                          background: c.bgDeep,
                          borderRadius: 5,
                          border: "1px solid " + c.border,
                          letterSpacing: 0.3,
                        },
                      },
                      "Code: " + stu.code,
                    )
                  : null,
                stu.code && stu.status
                  ? React.createElement(
                      "span",
                      {
                        style: {
                          color: c.textMuted,
                        },
                      },
                      "\u2022",
                    )
                  : null,
                stu.status
                  ? React.createElement(
                      "div",
                      {
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 9px",
                          borderRadius: 10,
                          background:
                            stu.status === "active"
                              ? c.success + "20"
                              : c.textMuted + "20",
                          color:
                            stu.status === "active" ? c.success : c.textMuted,
                          border:
                            "1px solid " +
                            (stu.status === "active"
                              ? c.success + "44"
                              : c.textMuted + "44"),
                          textTransform: "capitalize",
                        },
                      },
                      React.createElement("span", {
                        style: {
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background:
                            stu.status === "active" ? c.success : c.textMuted,
                        },
                      }),
                      stu.status,
                    )
                  : null,
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                textAlign: "right",
                flexShrink: 0,
              },
            },
            stu.parentId
              ? React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.textSec,
                        fontSize: 9,
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        fontWeight: 700,
                      },
                    },
                    "Parent Login ID",
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.accent,
                        fontSize: 15,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        padding: "6px 12px",
                        background: c.accent + "15",
                        borderRadius: 8,
                        border: "1px solid " + c.accent + "44",
                        letterSpacing: 0.5,
                      },
                    },
                    stu.parentId,
                  ),
                )
              : !isParent
                ? React.createElement(
                    "button",
                    {
                      onClick: generateParentId,
                      style: {
                        padding: "9px 14px",
                        background: c.warn,
                        border: "none",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      },
                    },
                    "\u2728 Generate Parent ID",
                  )
                : null,
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              padding: "0 22px 16px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                gap: 1,
                background: c.border,
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid " + c.border,
              },
            },
            [
              [
                "Age",
                stu.age ? stu.age + (stu.age === 1 ? " yr" : " yrs") : "-",
              ],
              stu.gender ? ["Gender", stu.gender] : null,
              ["Course", stu.course || "-"],
              ["Location", location],
              ["Joined", joinedDate],
              dobDate ? ["Date of Birth", dobDate] : null,
              stu.time ? ["Class Time", stu.time] : null,
              stu.classType ? ["Class Type", stu.classType] : null,
              stu.hoursPerWeek
                ? ["Hours/Week", stu.hoursPerWeek + " hrs"]
                : null,
            ]
              .filter(Boolean)
              .map(([l, v]) =>
                React.createElement(
                  "div",
                  {
                    key: l,
                    style: {
                      background: c.bgCard,
                      padding: "11px 13px",
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.textSec,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.7,
                        marginBottom: 5,
                      },
                    },
                    l,
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.text,
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.3,
                      },
                    },
                    v,
                  ),
                ),
              ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              padding: "0 22px 16px",
              display: "grid",
              gridTemplateColumns: teacherRec ? "1fr 1fr" : "1fr",
              gap: 12,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: c.bgDeep,
                border: "1px solid " + c.border,
                borderLeft: "3px solid " + c.cyan,
                borderRadius: 10,
                padding: "12px 14px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    color: c.cyan,
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  },
                },
                "\uD83D\uDC68\u200D\uD83D\uDC67 Parent / Guardian",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  color: c.text,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: stu.phone || stu.email ? 4 : 0,
                },
              },
              stu.parent || "-",
            ),
            stu.phone || stu.email
              ? React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      gap: 10,
                      fontSize: 10,
                      color: c.textSec,
                      flexWrap: "wrap",
                    },
                  },
                  stu.phone
                    ? React.createElement(
                        "span",
                        null,
                        "\uD83D\uDCDE ",
                        stu.phone,
                      )
                    : null,
                  stu.email
                    ? React.createElement("span", null, "\u2709 ", stu.email)
                    : null,
                )
              : null,
          ),
          teacherRec
            ? React.createElement(
                "div",
                {
                  style: {
                    background: c.bgDeep,
                    border: "1px solid " + c.border,
                    borderLeft: "3px solid " + c.purple,
                    borderRadius: 10,
                    padding: "12px 14px",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.purple,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                      },
                    },
                    "\uD83C\uDF93 Teacher",
                  ),
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.text,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: stu.time ? 4 : 0,
                    },
                  },
                  stu.teacher || "-",
                ),
                stu.time
                  ? React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: 10,
                          color: c.textSec,
                        },
                      },
                      "\uD83D\uDD52 Class at ",
                      stu.time,
                    )
                  : null,
              )
            : null,
        ),
        hasProgress
          ? React.createElement(
              "div",
              {
                style: {
                  padding: "0 22px 18px",
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    background:
                      "linear-gradient(135deg, " +
                      c.accent +
                      "10, " +
                      c.purple +
                      "10)",
                    border: "1px solid " + c.accent + "33",
                    borderRadius: 10,
                    padding: "12px 14px",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.accent,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                      },
                    },
                    "\uD83D\uDCD6 Current Progress",
                  ),
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                      alignItems: "center",
                    },
                  },
                  stu.juz
                    ? React.createElement(
                        "div",
                        null,
                        React.createElement(
                          "span",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              marginRight: 2,
                            },
                          },
                          "Juz ",
                        ),
                        React.createElement(
                          "strong",
                          {
                            style: {
                              color: c.text,
                              fontSize: 12,
                            },
                          },
                          stu.juz,
                        ),
                      )
                    : null,
                  stu.surah
                    ? React.createElement(
                        "div",
                        null,
                        React.createElement(
                          "span",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              marginRight: 2,
                            },
                          },
                          "Surah ",
                        ),
                        React.createElement(
                          "strong",
                          {
                            style: {
                              color: c.text,
                              fontSize: 12,
                            },
                          },
                          stu.surah,
                        ),
                      )
                    : null,
                  stu.page
                    ? React.createElement(
                        "div",
                        null,
                        React.createElement(
                          "span",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              marginRight: 2,
                            },
                          },
                          "Page ",
                        ),
                        React.createElement(
                          "strong",
                          {
                            style: {
                              color: c.text,
                              fontSize: 12,
                            },
                          },
                          stu.page,
                        ),
                      )
                    : null,
                  stu.qaida
                    ? React.createElement(
                        "div",
                        null,
                        React.createElement(
                          "span",
                          {
                            style: {
                              color: c.textSec,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              marginRight: 2,
                            },
                          },
                          "Qaida ",
                        ),
                        React.createElement(
                          "strong",
                          {
                            style: {
                              color: c.text,
                              fontSize: 12,
                            },
                          },
                          stu.qaida,
                        ),
                      )
                    : null,
                ),
                stu.lastLesson
                  ? React.createElement(
                      "div",
                      {
                        style: {
                          color: c.textSec,
                          fontSize: 11,
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid " + c.border,
                        },
                      },
                      React.createElement(
                        "span",
                        {
                          style: {
                            color: c.textSec,
                            fontWeight: 600,
                          },
                        },
                        "Last lesson: ",
                      ),
                      stu.lastLesson,
                      stu.lastDate
                        ? React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textSec,
                                marginLeft: 6,
                                fontWeight: 500,
                              },
                            },
                            " \u2022 " +
                              new Date(stu.lastDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              ),
                          )
                        : null,
                    )
                  : null,
              ),
            )
          : null,
      );
    })(),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap",
        },
      },
      [
        ["overview", "Overview"],
        ["progress", "Daily Progress"],
        ["attendance", "Attendance"],
        ["invoices", "Invoices"],
        ["notes", "Notes (" + myNotes.length + ")"],
      ].map(([k, l]) =>
        React.createElement(
          "button",
          {
            key: k,
            onClick: () => setTab(k),
            style: {
              padding: "8px 16px",
              borderRadius: 6,
              border:
                tab === k ? "1px solid transparent" : "1px solid " + c.border,
              background: tab === k ? c.accent : "transparent",
              color: tab === k ? "#fff" : c.textSec,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            },
          },
          l,
        ),
      ),
    ),
    tab === "overview" &&
      React.createElement(
        "div",
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
            label: "Attendance (30d)",
            value: attendancePct !== null ? attendancePct + "%" : "\u2014",
            color:
              attendancePct === null
                ? c.textMuted
                : attendancePct >= 85
                  ? c.success
                  : attendancePct >= 70
                    ? c.warn
                    : c.danger,
            sub: last30.length + " classes logged",
          }),
          React.createElement(SC, {
            label: "Present Days",
            value: presentDays,
            color: c.success,
            sub: "Last 30 days",
          }),
          React.createElement(SC, {
            label: "Late",
            value: lateDays,
            color: c.warn,
            sub: "Last 30 days",
          }),
          React.createElement(SC, {
            label: "Absent",
            value: absentDays,
            color: c.danger,
            sub: "Last 30 days",
          }),
          React.createElement(SC, {
            label: "Total Classes",
            value: myProgress.length,
            color: c.accent,
            sub: "All-time logged",
          }),
          React.createElement(SC, {
            label: "Fee Status",
            value: (stu.fee || "-").toUpperCase(),
            color:
              stu.fee === "paid"
                ? c.success
                : stu.fee === "overdue"
                  ? c.danger
                  : c.warn,
            sub:
              (stu.currency || "USD") +
              " " +
              (stu.fee_amount && parseFloat(stu.fee_amount) > 0
                ? parseFloat(stu.fee_amount).toLocaleString()
                : "not set") +
              "/month",
          }),
        ),
        myProgress[0]
          ? React.createElement(
              "div",
              {
                style: {
                  background: c.bgCard,
                  border: "1px solid " + c.border,
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 14,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  },
                },
                "Most Recent Class \u2014 " + myProgress[0].date,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                    gap: 10,
                  },
                },
                ["Lesson", "Pages", "Behavior", "Performance", "Homework"].map(
                  (lbl) => {
                    const key = {
                      Lesson: "lesson",
                      Pages: "pages",
                      Behavior: "behavior",
                      Performance: "performance",
                      Homework: "homework",
                    }[lbl];
                    return React.createElement(
                      "div",
                      {
                        key: lbl,
                        style: {
                          background: c.bgDeep,
                          borderRadius: 6,
                          padding: "8px 10px",
                        },
                      },
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.textSec,
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.6,
                            marginBottom: 4,
                          },
                        },
                        lbl,
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: c.text,
                            fontSize: 11,
                            fontWeight: 600,
                          },
                        },
                        myProgress[0][key] || "\u2014",
                      ),
                    );
                  },
                ),
              ),
            )
          : React.createElement(
              "div",
              {
                style: {
                  background: c.bgDeep,
                  border: "1px dashed " + c.border,
                  borderRadius: 10,
                  padding: 24,
                  textAlign: "center",
                  color: c.textMuted,
                  fontSize: 11,
                  marginBottom: 14,
                },
              },
              "📖 No class progress yet. Daily lesson summaries from your child's teacher will appear here in real-time once recorded.",
            ),
      ),
    tab === "progress" &&
      React.createElement(
        "div",
        null,
        myProgress.length === 0
          ? React.createElement(
              "div",
              {
                style: {
                  background: c.bgDeep,
                  border: "1px dashed " + c.border,
                  borderRadius: 10,
                  padding: 30,
                  textAlign: "center",
                  color: c.textMuted,
                },
              },
              "📚 Your child's teacher has not logged any classes yet. Once they record a class, lesson details (Surah, page, performance) will appear here automatically and refresh in real-time.",
            )
          : React.createElement(
              "div",
              null,
              myProgress.map((p) =>
                React.createElement(
                  "div",
                  {
                    key: p.id,
                    style: {
                      background: c.bgCard,
                      border: "1px solid " + c.border,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
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
                        "strong",
                        {
                          style: {
                            color: c.text,
                            fontSize: 12,
                          },
                        },
                        p.date,
                      ),
                      React.createElement(
                        "span",
                        {
                          style: {
                            marginLeft: 10,
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 10,
                            background:
                              (p.attended === "present"
                                ? c.success
                                : p.attended === "late"
                                  ? c.warn
                                  : c.danger) + "22",
                            color:
                              p.attended === "present"
                                ? c.success
                                : p.attended === "late"
                                  ? c.warn
                                  : c.danger,
                            fontWeight: 600,
                            textTransform: "uppercase",
                          },
                        },
                        p.attended || "-",
                      ),
                    ),
                    React.createElement(
                      "div",
                      {
                        style: {
                          color: c.textMuted,
                          fontSize: 10,
                        },
                      },
                      "By " + (p.teacherName || "-"),
                    ),
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(120px,1fr))",
                        gap: 8,
                        fontSize: 11,
                      },
                    },
                    p.lesson
                      ? React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textSec,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginRight: 4,
                              },
                            },
                            "Lesson ",
                          ),
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.text,
                              },
                            },
                            p.lesson,
                          ),
                        )
                      : null,
                    p.pages
                      ? React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textSec,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginRight: 4,
                              },
                            },
                            "Pages ",
                          ),
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.text,
                              },
                            },
                            p.pages,
                          ),
                        )
                      : null,
                    p.behavior
                      ? React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textSec,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginRight: 4,
                              },
                            },
                            "Behavior ",
                          ),
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.text,
                              },
                            },
                            p.behavior,
                          ),
                        )
                      : null,
                    p.performance
                      ? React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textSec,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginRight: 4,
                              },
                            },
                            "Performance ",
                          ),
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.text,
                              },
                            },
                            p.performance,
                          ),
                        )
                      : null,
                    p.homework
                      ? React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.textSec,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginRight: 4,
                              },
                            },
                            "Homework ",
                          ),
                          React.createElement(
                            "span",
                            {
                              style: {
                                color: c.text,
                              },
                            },
                            p.homework,
                          ),
                        )
                      : null,
                  ),
                  p.notes
                    ? React.createElement(
                        "div",
                        {
                          style: {
                            marginTop: 8,
                            padding: "6px 10px",
                            background: c.bgDeep,
                            borderRadius: 6,
                            color: c.textSec,
                            fontSize: 11,
                            fontStyle: "italic",
                          },
                        },
                        "\u201C" + p.notes + "\u201D",
                      )
                    : null,
                ),
              ),
            ),
      ),
    tab === "attendance" &&
      (function () {
        const _tNow = new Date();
        const tStr =
          _tNow.getFullYear() +
          "-" +
          String(_tNow.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(_tNow.getDate()).padStart(2, "0");
        const present = myProgress.filter(
          (p) => p.attended === "present",
        ).length;
        const late = myProgress.filter((p) => p.attended === "late").length;
        const absent = myProgress.filter((p) => p.attended === "absent").length;
        const totalLogged = present + late + absent;
        const rate =
          totalLogged > 0
            ? Math.round(((present + late) / totalLogged) * 100)
            : 0;
        const rateColor =
          rate >= 90
            ? c.success
            : rate >= 75
              ? c.warn
              : totalLogged > 0
                ? c.danger
                : c.textMuted;
        let streak = 0;
        for (let i = 0; i < 180; i++) {
          const _d = new Date(Date.now() - i * 86400000);
          const d =
            _d.getFullYear() +
            "-" +
            String(_d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(_d.getDate()).padStart(2, "0");
          const r = myProgress.find((p) => p.date === d);
          if (r) {
            if (r.attended === "present" || r.attended === "late") streak++;
            else break;
          } else if (streak === 0 && i < 2) continue;
          else break;
        }
        const todayObj = new Date();
        const year = todayObj.getFullYear();
        const month = todayObj.getMonth();
        const monthLabel = todayObj.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });
        const firstDow = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDow; i++)
          cells.push({
            empty: true,
          });
        for (let d = 1; d <= daysInMonth; d++) {
          const dStr =
            year +
            "-" +
            String(month + 1).padStart(2, "0") +
            "-" +
            String(d).padStart(2, "0");
          const rec = myProgress.find((p) => p.date === dStr);
          const cellDate = new Date(year, month, d);
          cells.push({
            d: d,
            dStr: dStr,
            rec: rec,
            isToday: dStr === tStr,
            isFuture: cellDate > todayObj,
            dow: cellDate.getDay(),
          });
        }
        while (cells.length % 7 !== 0)
          cells.push({
            empty: true,
          });
        const recent = myProgress.slice(0, 8);
        return React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: 12,
                marginBottom: 16,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  background: c.bgCard,
                  border: "1px solid " + rateColor + "66",
                  borderRadius: 12,
                  padding: 18,
                  position: "relative",
                  overflow: "hidden",
                  gridColumn: "span 1",
                },
              },
              React.createElement("div", {
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: rateColor,
                },
              }),
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    marginBottom: 8,
                  },
                },
                "Attendance",
              ),
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: 36,
                      fontWeight: 800,
                      color: rateColor,
                      lineHeight: 1,
                    },
                  },
                  rate,
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: 18,
                      fontWeight: 600,
                      color: rateColor,
                    },
                  },
                  "%",
                ),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 11,
                    color: c.textMuted,
                    marginTop: 6,
                  },
                },
                totalLogged === 0
                  ? "No classes yet"
                  : totalLogged + " classes total",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  background: c.bgCard,
                  border: "1px solid " + c.border,
                  borderRadius: 12,
                  padding: 18,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  },
                },
                React.createElement("div", {
                  style: {
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c.success,
                  },
                }),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    },
                  },
                  "Present",
                ),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 30,
                    fontWeight: 800,
                    color: c.success,
                    lineHeight: 1,
                  },
                },
                present,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 11,
                    color: c.textMuted,
                    marginTop: 6,
                  },
                },
                "days attended",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  background: c.bgCard,
                  border: "1px solid " + c.border,
                  borderRadius: 12,
                  padding: 18,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  },
                },
                React.createElement("div", {
                  style: {
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c.warn,
                  },
                }),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    },
                  },
                  "Late",
                ),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 30,
                    fontWeight: 800,
                    color: c.warn,
                    lineHeight: 1,
                  },
                },
                late,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 11,
                    color: c.textMuted,
                    marginTop: 6,
                  },
                },
                "days late",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  background: c.bgCard,
                  border: "1px solid " + c.border,
                  borderRadius: 12,
                  padding: 18,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  },
                },
                React.createElement("div", {
                  style: {
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c.danger,
                  },
                }),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    },
                  },
                  "Absent",
                ),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 30,
                    fontWeight: 800,
                    color: c.danger,
                    lineHeight: 1,
                  },
                },
                absent,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 11,
                    color: c.textMuted,
                    marginTop: 6,
                  },
                },
                "days missed",
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  background: streak > 0 ? c.cyan + "10" : c.bgCard,
                  border:
                    "1px solid " + (streak > 0 ? c.cyan + "55" : c.border),
                  borderRadius: 12,
                  padding: 18,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: 14,
                    },
                  },
                  streak > 0 ? "\u{1F525}" : "\u{1F4C5}",
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    },
                  },
                  "Streak",
                ),
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 30,
                    fontWeight: 800,
                    color: streak > 0 ? c.cyan : c.textMuted,
                    lineHeight: 1,
                  },
                },
                streak,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 11,
                    color: c.textMuted,
                    marginTop: 6,
                  },
                },
                streak === 1 ? "day in a row" : "days in a row",
              ),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: c.bgCard,
                border: "1px solid " + c.border,
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                  flexWrap: "wrap",
                  gap: 12,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    color: c.text,
                    fontSize: 17,
                    fontWeight: 700,
                  },
                },
                monthLabel,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 14,
                    fontSize: 11,
                    color: c.textSec,
                    flexWrap: "wrap",
                  },
                },
                [
                  ["Present", c.success],
                  ["Late", c.warn],
                  ["Absent", c.danger],
                ].map(([l, b]) =>
                  React.createElement(
                    "div",
                    {
                      key: l,
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      },
                    },
                    React.createElement("div", {
                      style: {
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: b,
                      },
                    }),
                    React.createElement("span", null, l),
                  ),
                ),
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: 8,
                  marginBottom: 10,
                },
              },
              ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd, i) =>
                React.createElement(
                  "div",
                  {
                    key: wd,
                    style: {
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: i === 0 || i === 6 ? c.textMuted : c.textSec,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      padding: "4px 0",
                    },
                  },
                  wd,
                ),
              ),
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: 8,
                },
              },
              cells.map((cell, i) => {
                if (cell.empty)
                  return React.createElement("div", {
                    key: "e" + i,
                    style: {
                      aspectRatio: "1",
                    },
                  });
                const color = cell.rec
                  ? cell.rec.attended === "present"
                    ? c.success
                    : cell.rec.attended === "late"
                      ? c.warn
                      : cell.rec.attended === "absent"
                        ? c.danger
                        : null
                  : null;
                const isWeekend = cell.dow === 0 || cell.dow === 6;
                const bg = cell.rec
                  ? color + "18"
                  : cell.isFuture
                    ? "transparent"
                    : isWeekend
                      ? c.bgDeep + "55"
                      : c.bgDeep + "33";
                const border = cell.isToday
                  ? "2px solid " + c.cyan
                  : cell.rec
                    ? "1px solid " + color + "66"
                    : "1px solid " + c.border;
                const title =
                  cell.dStr +
                  (cell.rec
                    ? " - " +
                      cell.rec.attended.toUpperCase() +
                      (cell.rec.lesson ? " - " + cell.rec.lesson : "")
                    : cell.isFuture
                      ? " - upcoming"
                      : " - no class");
                return React.createElement(
                  "div",
                  {
                    key: "d" + cell.d,
                    title: title,
                    onClick: cell.rec ? () => setDayDetail(cell) : undefined,
                    style: {
                      aspectRatio: "1",
                      background: bg,
                      border: border,
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: 4,
                      cursor: cell.rec ? "pointer" : "default",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      boxShadow: cell.isToday
                        ? "0 0 0 3px " + c.cyan + "22"
                        : "none",
                      opacity: cell.isFuture ? 0.4 : 1,
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: cell.isToday
                          ? c.cyan
                          : cell.rec
                            ? c.text
                            : cell.isFuture
                              ? c.textMuted
                              : c.textSec,
                        fontSize: 15,
                        fontWeight: cell.isToday ? 700 : 600,
                        lineHeight: 1,
                      },
                    },
                    cell.d,
                  ),
                  color
                    ? React.createElement("div", {
                        style: {
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: color,
                          boxShadow: "0 0 4px " + color + "88",
                        },
                      })
                    : null,
                );
              }),
            ),
          ),
          recent.length > 0
            ? React.createElement(
                "div",
                {
                  style: {
                    background: c.bgCard,
                    border: "1px solid " + c.border,
                    borderRadius: 12,
                    padding: 20,
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.text,
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 14,
                    },
                  },
                  "Recent Classes",
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    },
                  },
                  recent.map((r, ri) => {
                    const color =
                      r.attended === "present"
                        ? c.success
                        : r.attended === "late"
                          ? c.warn
                          : c.danger;
                    const label =
                      r.attended === "present"
                        ? "Present"
                        : r.attended === "late"
                          ? "Late"
                          : "Absent";
                    const _rp = (r.date || "").split("-").map(Number);
                    const dateObj =
                      _rp.length === 3
                        ? new Date(_rp[0], _rp[1] - 1, _rp[2])
                        : new Date(r.date);
                    const dateLabel = dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const isToday = r.date === tStr;
                    return React.createElement(
                      "div",
                      {
                        key: r.id || ri,
                        onClick: () => {
                          const _ep = (r.date || "").split("-").map(Number);
                          const _ed =
                            _ep.length === 3
                              ? _ep[2]
                              : new Date(r.date).getDate();
                          setDayDetail({
                            rec: r,
                            dStr: r.date,
                            d: _ed,
                            isToday: r.date === tStr,
                          });
                        },
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          background: c.bgDeep,
                          border: "1px solid " + c.border,
                          borderLeft: "3px solid " + color,
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        },
                      },
                      React.createElement(
                        "div",
                        {
                          style: {
                            minWidth: 60,
                            textAlign: "center",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              fontSize: 18,
                              fontWeight: 700,
                              color: c.text,
                              lineHeight: 1,
                            },
                          },
                          dateObj.getDate(),
                        ),
                        React.createElement(
                          "div",
                          {
                            style: {
                              fontSize: 9,
                              color: c.textMuted,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              marginTop: 2,
                            },
                          },
                          dateObj.toLocaleDateString("en-US", {
                            month: "short",
                            weekday: "short",
                          }),
                        ),
                      ),
                      React.createElement(
                        "div",
                        {
                          style: {
                            flex: 1,
                            minWidth: 0,
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom:
                                r.lesson || r.pages || r.behavior ? 4 : 0,
                              flexWrap: "wrap",
                            },
                          },
                          React.createElement(
                            "div",
                            {
                              style: {
                                color: color,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 10px",
                                background: color + "20",
                                borderRadius: 5,
                                border: "1px solid " + color + "44",
                              },
                            },
                            label,
                          ),
                          isToday
                            ? React.createElement(
                                "div",
                                {
                                  style: {
                                    color: c.cyan,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "3px 8px",
                                    background: c.cyan + "15",
                                    borderRadius: 5,
                                  },
                                },
                                "Today",
                              )
                            : null,
                        ),
                        r.lesson
                          ? React.createElement(
                              "div",
                              {
                                style: {
                                  color: c.text,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  marginBottom:
                                    r.pages || r.behavior || r.performance
                                      ? 3
                                      : 0,
                                },
                              },
                              r.lesson,
                            )
                          : null,
                        r.pages || r.behavior || r.performance
                          ? React.createElement(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  gap: 12,
                                  fontSize: 10,
                                  color: c.textMuted,
                                  flexWrap: "wrap",
                                },
                              },
                              r.pages
                                ? React.createElement(
                                    "span",
                                    null,
                                    "Pages: ",
                                    React.createElement(
                                      "strong",
                                      {
                                        style: {
                                          color: c.textSec,
                                        },
                                      },
                                      r.pages,
                                    ),
                                  )
                                : null,
                              r.behavior
                                ? React.createElement(
                                    "span",
                                    null,
                                    "Behavior: ",
                                    React.createElement(
                                      "strong",
                                      {
                                        style: {
                                          color: c.textSec,
                                        },
                                      },
                                      r.behavior,
                                    ),
                                  )
                                : null,
                              r.performance
                                ? React.createElement(
                                    "span",
                                    null,
                                    "Performance: ",
                                    React.createElement(
                                      "strong",
                                      {
                                        style: {
                                          color: c.textSec,
                                        },
                                      },
                                      r.performance,
                                    ),
                                  )
                                : null,
                            )
                          : null,
                      ),
                    );
                  }),
                ),
              )
            : React.createElement(
                "div",
                {
                  style: {
                    background: c.bgCard,
                    border: "1px dashed " + c.border,
                    borderRadius: 12,
                    padding: 32,
                    textAlign: "center",
                  },
                },
                React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: 28,
                      marginBottom: 8,
                    },
                  },
                  "\u{1F4DA}",
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.text,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                    },
                  },
                  "No classes recorded yet",
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textMuted,
                      fontSize: 11,
                    },
                  },
                  "Your child's attendance will appear here once the teacher logs a class.",
                ),
              ),
        );
      })(),
    tab === "invoices" &&
      React.createElement(
        "div",
        null,
        React.createElement(
          "table",
          {
            style: {
              width: "100%",
              borderCollapse: "collapse",
              background: c.bgCard,
              borderRadius: 10,
              overflow: "hidden",
            },
          },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              {
                style: {
                  background: c.bgDeep,
                  color: c.textSec,
                  fontSize: 10,
                },
              },
              ["Invoice", "Period", "Status", "Amount", "Action"].map((h) =>
                React.createElement(
                  "th",
                  {
                    key: h,
                    style: {
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      borderBottom: "1px solid " + c.border,
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
            invoiceHistory.map((inv) =>
              React.createElement(
                "tr",
                {
                  key: inv.id,
                  style: {
                    borderBottom: "1px solid " + c.border,
                  },
                },
                React.createElement(
                  "td",
                  {
                    style: {
                      padding: "10px 12px",
                      color: c.accent,
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 600,
                    },
                  },
                  "INV-" + inv.id,
                ),
                React.createElement(
                  "td",
                  {
                    style: {
                      padding: "10px 12px",
                      color: c.text,
                      fontSize: 11,
                    },
                  },
                  inv.period,
                ),
                React.createElement(
                  "td",
                  {
                    style: {
                      padding: "10px 12px",
                    },
                  },
                  React.createElement(
                    "span",
                    {
                      style: {
                        fontSize: 9,
                        padding: "3px 8px",
                        borderRadius: 10,
                        background:
                          (inv.status === "paid"
                            ? c.success
                            : inv.status === "overdue"
                              ? c.danger
                              : c.warn) + "22",
                        color:
                          inv.status === "paid"
                            ? c.success
                            : inv.status === "overdue"
                              ? c.danger
                              : c.warn,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      },
                    },
                    inv.status,
                  ),
                ),
                React.createElement(
                  "td",
                  {
                    style: {
                      padding: "10px 12px",
                      color: c.text,
                      fontSize: 11,
                      fontWeight: 600,
                    },
                  },
                  inv.currency +
                    " " +
                    (inv.amount === null
                      ? "Not set"
                      : inv.amount.toLocaleString()),
                ),
                React.createElement(
                  "td",
                  {
                    style: {
                      padding: "10px 12px",
                    },
                  },
                  React.createElement(
                    "button",
                    {
                      onClick: () => printInvoice(inv),
                      style: {
                        padding: "4px 10px",
                        background: c.accent + "22",
                        border: "1px solid " + c.accent + "44",
                        borderRadius: 5,
                        color: c.accent,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                      },
                    },
                    "\uD83D\uDDA8 Print",
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    tab === "notes" &&
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          {
            style: {
              background: c.bgCard,
              border: "1px solid " + c.border,
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                color: c.textSec,
                fontSize: 10,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              },
            },
            isParent
              ? "Share a note with the academy"
              : "Add note for the parent",
          ),
          React.createElement("textarea", {
            value: noteText,
            onChange: (e) => setNoteText(e.target.value),
            placeholder: isParent
              ? "Share an observation, question, or concern with your child\u0027s teacher..."
              : "Note from admin/teacher to parent...",
            rows: 3,
            style: {
              width: "100%",
              padding: "10px 12px",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 6,
              color: c.text,
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              resize: "vertical",
            },
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              },
            },
            React.createElement(
              "button",
              {
                onClick: addNote,
                disabled: !noteText.trim(),
                style: {
                  padding: "7px 14px",
                  background: noteText.trim() ? c.accent : c.bgDeep,
                  border: "none",
                  borderRadius: 6,
                  color: noteText.trim() ? "#fff" : c.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: noteText.trim() ? "pointer" : "not-allowed",
                },
              },
              "Send Note",
            ),
          ),
        ),
        myNotes.length === 0
          ? React.createElement(
              "div",
              {
                style: {
                  background: c.bgDeep,
                  border: "1px dashed " + c.border,
                  borderRadius: 10,
                  padding: 24,
                  textAlign: "center",
                  color: c.textMuted,
                  fontSize: 11,
                },
              },
              "💬 No notes yet. Share an observation, question, or concern about your child\u0027s progress and the academy will see it instantly.",
            )
          : React.createElement(
              "div",
              null,
              myNotes.map((n) =>
                React.createElement(
                  "div",
                  {
                    key: n.id,
                    style: {
                      background: c.bgCard,
                      border: "1px solid " + c.border,
                      borderLeft:
                        "3px solid " +
                        (n.authorRole === "parent" ? c.cyan : c.purple),
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
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
                        "strong",
                        {
                          style: {
                            color:
                              n.authorRole === "parent" ? c.cyan : c.purple,
                            fontSize: 11,
                          },
                        },
                        n.author,
                      ),
                      React.createElement(
                        "span",
                        {
                          style: {
                            color: c.textMuted,
                            fontSize: 9,
                            marginLeft: 8,
                          },
                        },
                        new Date(n.createdAt).toLocaleString(),
                      ),
                    ),
                    (isParent && n.authorRole === "parent") || !isParent
                      ? React.createElement(
                          "button",
                          {
                            onClick: () => deleteNote(n.id),
                            style: {
                              background: "none",
                              border: "none",
                              color: c.danger,
                              fontSize: 10,
                              cursor: "pointer",
                              padding: "2px 6px",
                            },
                          },
                          "Delete",
                        )
                      : null,
                  ),
                  React.createElement(
                    "div",
                    {
                      style: {
                        color: c.text,
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      },
                    },
                    n.text,
                  ),
                ),
              ),
            ),
      ),
  );
};
