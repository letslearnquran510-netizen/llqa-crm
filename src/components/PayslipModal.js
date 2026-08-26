const PayslipModal = ({ t, onClose, selectedMonth }) => {
  if (!t.pay) return null;

  const initials = t.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const monthName = new Date(selectedMonth + "-01").toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );
  const bankMethod =
    t.pay.paymentMethod ||
    (t.bank ? String(t.bank).split(" - ")[0] : "Unspecified");

  const Icon3D = ({ icon: Icon, color, bgGradient, size = 20 }) =>
    React.createElement(
      "div",
      {
        style: {
          width: size * 2.2,
          height: size * 2.2,
          borderRadius: "50%",
          background:
            bgGradient || `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `1px solid ${color}44`,
          boxShadow: `0 8px 16px ${color}33, inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)`,
          borderRadius: "50%",
        },
      }),
      React.createElement(Icon, {
        size: size,
        color: color,
        style: { filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` },
      }),
    );

  const SectionTitle = ({ title, icon: Icon, color }) =>
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        },
      },
      React.createElement(Icon3D, { icon: Icon, color: color, size: 16 }),
      React.createElement(
        "h4",
        {
          style: {
            margin: 0,
            color: c.text,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          },
        },
        title,
      ),
    );

  const Row = ({
    label,
    value,
    color = c.text,
    highlight = false,
    isBold = false,
  }) =>
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
          alignItems: "center",
        },
      },
      React.createElement(
        "span",
        { style: { color: c.textSec, fontSize: 13, fontWeight: 500 } },
        label,
      ),
      React.createElement(
        "span",
        {
          style: {
            color: color,
            fontSize: 14,
            fontWeight: isBold || highlight ? 700 : 600,
            background: highlight ? `${color}15` : "transparent",
            padding: highlight ? "6px 12px" : 0,
            borderRadius: highlight ? 8 : 0,
            border: highlight ? `1px solid ${color}33` : "none",
          },
        },
        value,
      ),
    );

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.8)",
        backdropFilter: "blur(16px)",
        padding: "20px",
        overflowY: "auto",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          background: c.bgCard,
          borderRadius: 28,
          width: 760,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow:
            "0 40px 80px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            background: `linear-gradient(135deg, ${c.bgDeep}, ${c.bgCard})`,
            padding: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid " + c.border,
            position: "relative",
            overflow: "hidden",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: -40,
              right: -40,
              opacity: 0.03,
              transform: "rotate(-15deg)",
            },
          },
          React.createElement(BookOpen, { size: 300, color: c.text }),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 24,
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            },
          },
          React.createElement(Icon3D, {
            icon: BookOpen,
            color: "#fff",
            bgGradient: `linear-gradient(135deg, ${c.accent}, ${c.purple})`,
            size: 28,
          }),
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              {
                style: {
                  color: c.text,
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: -1,
                  marginBottom: 4,
                },
              },
              "LLQA Academy",
            ),
            React.createElement(
              "div",
              {
                style: {
                  color: c.accent,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  display: "inline-block",
                  background: `${c.accent}22`,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid ${c.accent}44`,
                },
              },
              "Official Payslip",
            ),
          ),
        ),
        React.createElement(
          "div",
          { style: { textAlign: "right", position: "relative", zIndex: 1 } },
          React.createElement(
            "button",
            {
              onClick: onClose,
              style: {
                background: c.bgDeep,
                border: "1px solid " + c.border,
                borderRadius: "50%",
                width: 40,
                height: 40,
                cursor: "pointer",
                color: c.textSec,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "0.2s",
              },
            },
            React.createElement(X, { size: 20 }),
          ),
          React.createElement(
            "div",
            {
              style: {
                color: c.textSec,
                fontSize: 14,
                fontWeight: 700,
                marginTop: 24,
              },
            },
            monthName,
          ),
        ),
      ),

      React.createElement(
        "div",
        { style: { padding: "40px", flex: 1, position: "relative" } },

        React.createElement(
          "div",
          {
            style: {
              background: `linear-gradient(90deg, ${c.bgDeep}, transparent)`,
              borderRadius: 20,
              padding: "28px",
              marginBottom: 36,
              display: "flex",
              alignItems: "center",
              gap: 32,
              border: "1px solid " + c.border,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.03)",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${c.border}, ${c.bgCard})`,
                border: "2px solid " + c.border,
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.text,
                fontSize: 28,
                fontWeight: 900,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              },
            },
            initials,
          ),
          React.createElement(
            "div",
            {
              style: {
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "20px",
              },
            },
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 700,
                  },
                },
                "Employee Name",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 18, fontWeight: 800 } },
                t.name,
              ),
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 700,
                  },
                },
                "Payment Method",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 15, fontWeight: 700 } },
                bankMethod,
              ),
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 700,
                  },
                },
                "Code & Shift",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 15, fontWeight: 700 } },
                `${t.code} • ${t.shift}`,
              ),
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    color: c.textSec,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 700,
                  },
                },
                "Joined Date",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 15, fontWeight: 700 } },
                t.joinDate || "N/A",
              ),
            ),
          ),
        ),

        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              marginBottom: 40,
            },
          },

          React.createElement(
            "div",
            null,
            React.createElement(SectionTitle, {
              title: "Earnings",
              icon: DollarSign,
              color: c.success,
            }),
            React.createElement(
              "div",
              { style: { padding: "0 8px" } },
              React.createElement(Row, {
                label: "Basic Salary",
                value: "Rs " + t.pay.baseSalary.toLocaleString(),
              }),
              t.pay.bonusBreakdown &&
                React.createElement(
                  React.Fragment,
                  null,
                  t.pay.bonusBreakdown.tenure > 0 &&
                    React.createElement(Row, {
                      label: "Tenure Bonus",
                      value:
                        "+Rs " + t.pay.bonusBreakdown.tenure.toLocaleString(),
                      color: c.success,
                    }),
                  t.pay.bonusBreakdown.performance > 0 &&
                    React.createElement(Row, {
                      label: "Performance Bonus",
                      value:
                        "+Rs " +
                        t.pay.bonusBreakdown.performance.toLocaleString(),
                      color: c.success,
                    }),
                  t.pay.bonusBreakdown.students > 0 &&
                    React.createElement(Row, {
                      label: "Student Count Bonus",
                      value:
                        "+Rs " + t.pay.bonusBreakdown.students.toLocaleString(),
                      color: c.success,
                    }),
                ),
              React.createElement(
                "div",
                {
                  style: {
                    borderTop: "2px dotted " + c.border,
                    marginTop: 20,
                    paddingTop: 20,
                  },
                },
                React.createElement(Row, {
                  label: "GROSS EARNINGS",
                  value: "Rs " + t.pay.gross.toLocaleString(),
                  color: c.success,
                  isBold: true,
                  highlight: true,
                }),
              ),
            ),
          ),

          React.createElement(
            "div",
            null,
            React.createElement(SectionTitle, {
              title: "Deductions",
              icon: Receipt,
              color: c.danger,
            }),
            React.createElement(
              "div",
              { style: { padding: "0 8px" } },
              t.pay.fine > 0 &&
                React.createElement(Row, {
                  label: "Attendance / QC Fines",
                  value: "-Rs " + t.pay.fine.toLocaleString(),
                  color: c.danger,
                }),
              t.pay.advance > 0 &&
                React.createElement(Row, {
                  label: "Advance Deductions",
                  value: "-Rs " + t.pay.advance.toLocaleString(),
                  color: c.danger,
                }),
              t.pay.tax > 0 &&
                React.createElement(Row, {
                  label: "Income Tax",
                  value: "-Rs " + t.pay.tax.toLocaleString(),
                  color: c.danger,
                }),
              t.pay.deductions === 0 &&
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.textMuted,
                      fontSize: 13,
                      fontStyle: "italic",
                      padding: "10px 0",
                    },
                  },
                  "No deductions this month.",
                ),
              React.createElement(
                "div",
                {
                  style: {
                    borderTop: "2px dotted " + c.border,
                    marginTop: 20,
                    paddingTop: 20,
                  },
                },
                React.createElement(Row, {
                  label: "TOTAL DEDUCTIONS",
                  value: "-Rs " + t.pay.deductions.toLocaleString(),
                  color: c.danger,
                  isBold: true,
                  highlight: true,
                }),
              ),
            ),
          ),
        ),

        React.createElement(
          "div",
          {
            style: {
              background: `linear-gradient(135deg, ${c.accent}, ${c.purple})`,
              borderRadius: 24,
              padding: "40px",
              marginBottom: 40,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: `0 20px 40px ${c.accent}55, inset 0 2px 4px rgba(255,255,255,0.3)`,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                position: "absolute",
                top: -30,
                right: -20,
                opacity: 0.15,
                transform: "rotate(10deg)",
              },
            },
            React.createElement(Award, { size: 180, color: "#fff" }),
          ),
          React.createElement(
            "div",
            { style: { position: "relative", zIndex: 1 } },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 2.5,
                  opacity: 0.9,
                  marginBottom: 12,
                  fontWeight: 800,
                },
              },
              "Net Salary Payable",
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: 52,
                  fontWeight: 900,
                  textShadow: "0 8px 16px rgba(0,0,0,0.4)",
                  letterSpacing: -1.5,
                  lineHeight: 1,
                },
              },
              "Rs ",
              t.pay.net.toLocaleString(),
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(20px)",
                padding: "16px 28px",
                borderRadius: 40,
                border: "1px solid rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                position: "relative",
                zIndex: 1,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              },
            },
            React.createElement(t.pay.status === "paid" ? CheckCircle : Clock, {
              size: 24,
              color: "#fff",
            }),
            React.createElement(
              "span",
              {
                style: {
                  fontSize: 16,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                },
              },
              t.pay.status,
            ),
          ),
        ),

        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 32,
              borderTop: "1px solid " + c.border,
              color: c.textSec,
              fontSize: 12,
            },
          },
          React.createElement(
            "div",
            { style: { display: "flex", gap: 40 } },
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 600,
                  },
                },
                "Approved By",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontWeight: 800, fontSize: 14 } },
                t.pay.approvedBy || "Pending",
              ),
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 600,
                  },
                },
                "Paid Date",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontWeight: 800, fontSize: 14 } },
                t.pay.paidDate || "—",
              ),
            ),
          ),
          React.createElement(
            "div",
            { style: { textAlign: "right" } },
            React.createElement(
              "div",
              {
                style: {
                  marginBottom: 8,
                  fontWeight: 800,
                  color: c.text,
                  fontSize: 13,
                  letterSpacing: 0.5,
                },
              },
              "LLQA Academy",
            ),
            React.createElement(
              "div",
              { style: { fontSize: 11, opacity: 0.7, fontStyle: "italic" } },
              "Computer-generated payslip \u2022 No signature required",
            ),
          ),
        ),
      ),

      React.createElement(
        "div",
        {
          style: {
            background: `linear-gradient(to top, ${c.bgDeep}, ${c.bgCard})`,
            borderTop: "1px solid " + c.border,
            padding: "24px 40px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 16,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          },
        },
        React.createElement(
          Btn,
          { variant: "outline", onClick: onClose },
          "Close Window",
        ),
        React.createElement(
          Btn,
          { icon: Download, onClick: () => window.print && window.print() },
          "Download Official PDF",
        ),
      ),
    ),
  );
};
