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

  const SectionTitle = ({ title, icon: Icon, color }) =>
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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${color}22, ${color}11)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${color}44`,
            boxShadow: `0 2px 8px ${color}33`,
          },
        },
        React.createElement(Icon, { size: 16, color: color }),
      ),
      React.createElement(
        "h4",
        {
          style: {
            margin: 0,
            color: c.text,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1,
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
          marginBottom: 12,
          alignItems: "center",
        },
      },
      React.createElement(
        "span",
        { style: { color: c.textSec, fontSize: 12, fontWeight: 500 } },
        label,
      ),
      React.createElement(
        "span",
        {
          style: {
            color: color,
            fontSize: 13,
            fontWeight: isBold || highlight ? 700 : 600,
            background: highlight ? `${color}11` : "transparent",
            padding: highlight ? "4px 10px" : 0,
            borderRadius: highlight ? 6 : 0,
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
        background: "rgba(0,0,0,.75)",
        backdropFilter: "blur(12px)",
        padding: 20,
        overflowY: "auto",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          background: c.bgCard,
          borderRadius: 24,
          width: 580,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow:
            "0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            background: `linear-gradient(145deg, ${c.bgDeep}, ${c.bgCard})`,
            padding: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid " + c.border,
            position: "relative",
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", gap: 18, alignItems: "center" } },
          React.createElement(
            "div",
            {
              style: {
                background: `linear-gradient(135deg, ${c.accent}, ${c.purple})`,
                width: 56,
                height: 56,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 12px 24px ${c.accent}55, inset 0 2px 4px rgba(255,255,255,0.4)`,
              },
            },
            React.createElement(BookOpen, { size: 26, color: "#fff" }),
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              {
                style: {
                  color: c.text,
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
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
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                },
              },
              "Official Payslip",
            ),
          ),
        ),
        React.createElement(
          "div",
          { style: { textAlign: "right" } },
          React.createElement(
            "button",
            {
              onClick: onClose,
              style: {
                background: c.bgDeep,
                border: "1px solid " + c.border,
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                color: c.textSec,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "auto",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              },
            },
            React.createElement(X, { size: 16 }),
          ),
          React.createElement(
            "div",
            {
              style: {
                color: c.textSec,
                fontSize: 13,
                fontWeight: 600,
                marginTop: 16,
              },
            },
            monthName,
          ),
        ),
      ),
      React.createElement(
        "div",
        { style: { padding: "32px", flex: 1 } },
        React.createElement(
          "div",
          {
            style: {
              background: `linear-gradient(to right, ${c.bgDeep}, transparent)`,
              borderRadius: 16,
              padding: "24px",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 24,
              border: "1px solid " + c.border,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.02)",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${c.border}, ${c.bgCard})`,
                border: "2px solid " + c.border,
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.text,
                fontSize: 24,
                fontWeight: 800,
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
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
                gap: "16px",
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
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  },
                },
                "Employee Name",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 16, fontWeight: 800 } },
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
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  },
                },
                "Payment Method",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 14, fontWeight: 600 } },
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
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  },
                },
                "Code & Shift",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 14, fontWeight: 600 } },
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
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  },
                },
                "Joined Date",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontSize: 14, fontWeight: 600 } },
                t.joinDate || "N/A",
              ),
            ),
          ),
        ),

        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 24,
              marginBottom: 32,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                border: "1px solid " + c.border,
                borderRadius: 16,
                padding: "24px",
                background: `linear-gradient(to bottom right, ${c.successBg}15, transparent)`,
              },
            },
            React.createElement(SectionTitle, {
              title: "Earnings",
              icon: DollarSign,
              color: c.success,
            }),
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
                  borderTop: "1px dashed " + c.border,
                  marginTop: 16,
                  paddingTop: 16,
                },
              },
              React.createElement(Row, {
                label: "TOTAL GROSS EARNINGS",
                value: "Rs " + t.pay.gross.toLocaleString(),
                color: c.success,
                isBold: true,
                highlight: true,
              }),
            ),
          ),

          React.createElement(
            "div",
            {
              style: {
                border: "1px solid " + c.border,
                borderRadius: 16,
                padding: "24px",
                background: `linear-gradient(to bottom right, ${c.dangerBg}15, transparent)`,
              },
            },
            React.createElement(SectionTitle, {
              title: "Deductions",
              icon: Receipt,
              color: c.danger,
            }),
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
                    fontSize: 12,
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "10px 0",
                  },
                },
                "No deductions this month.",
              ),
            React.createElement(
              "div",
              {
                style: {
                  borderTop: "1px dashed " + c.border,
                  marginTop: 16,
                  paddingTop: 16,
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

        React.createElement(
          "div",
          {
            style: {
              background: `linear-gradient(135deg, ${c.accent}, ${c.purple})`,
              borderRadius: 20,
              padding: "32px",
              marginBottom: 32,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: `0 16px 32px ${c.accent}45, inset 0 2px 4px rgba(255,255,255,0.2)`,
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
                top: -20,
                right: -20,
                opacity: 0.1,
              },
            },
            React.createElement(Award, { size: 140, color: "#fff" }),
          ),
          React.createElement(
            "div",
            { style: { position: "relative", zIndex: 1 } },
            React.createElement(
              "div",
              {
                style: {
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  opacity: 0.9,
                  marginBottom: 8,
                  fontWeight: 700,
                },
              },
              "Net Salary Payable",
            ),
            React.createElement(
              "div",
              {
                style: {
                  fontSize: 42,
                  fontWeight: 900,
                  textShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  letterSpacing: -1,
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
                backdropFilter: "blur(12px)",
                padding: "12px 24px",
                borderRadius: 32,
                border: "1px solid rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                position: "relative",
                zIndex: 1,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
            },
            React.createElement(t.pay.status === "paid" ? CheckCircle : Clock, {
              size: 18,
              color: "#fff",
            }),
            React.createElement(
              "span",
              {
                style: {
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
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
              paddingTop: 24,
              borderTop: "1px solid " + c.border,
              color: c.textSec,
              fontSize: 11,
            },
          },
          React.createElement(
            "div",
            { style: { display: "flex", gap: 32 } },
            React.createElement(
              "div",
              null,
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  },
                },
                "Approved By",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontWeight: 700, fontSize: 12 } },
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
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  },
                },
                "Paid Date",
              ),
              React.createElement(
                "div",
                { style: { color: c.text, fontWeight: 700, fontSize: 12 } },
                t.pay.paidDate || "—",
              ),
            ),
          ),
          React.createElement(
            "div",
            { style: { textAlign: "right" } },
            React.createElement(
              "div",
              { style: { marginBottom: 6, fontWeight: 600, color: c.text } },
              "LLQA Academy",
            ),
            React.createElement(
              "div",
              { style: { fontSize: 10, opacity: 0.8 } },
              "Computer-generated \u2022 No signature required",
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
            padding: "20px 32px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 14,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          },
        },
        React.createElement(
          Btn,
          { variant: "outline", onClick: onClose },
          "Close",
        ),
        React.createElement(
          Btn,
          { icon: Download, onClick: () => window.print && window.print() },
          "Download PDF",
        ),
      ),
    ),
  );
};
