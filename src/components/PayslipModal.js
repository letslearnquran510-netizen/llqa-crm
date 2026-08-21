const PayslipModal = ({
  t,
  onClose,
  selectedMonth
}) => {
  if (!t.pay) return null;
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
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
      width: 560,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingBottom: 14,
      borderBottom: "2px solid " + c.accent
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    }
  }, React.createElement(BookOpen, {
    size: 20,
    color: c.accent
  }), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 18,
      fontWeight: 700
    }
  }, "LLQA Academy")), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Salary Payslip \u2014 ", new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  }))), React.createElement("button", {
    onClick: () => {
      if (t.phone) window.location.href = "tel:" + t.phone.replace(/[^0-9+]/g, "");else alert("Phone number not available for this teacher.");
    },
    onClick: onClose,
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
      background: c.bgDeep,
      borderRadius: 8,
      padding: 14,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, "Employee"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 14,
      fontWeight: 700
    }
  }, t.name), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Code: ", t.code, " \xB7 ", t.shift, " Shift")), React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, "Payment To"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, t.bank), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10
    }
  }, "Joined: ", t.joinDate)))), React.createElement("h4", {
    style: {
      color: c.success,
      fontSize: 13,
      margin: "0 0 8px",
      fontWeight: 600
    }
  }, "EARNINGS"), React.createElement("div", {
    style: {
      background: c.successBg,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Basic Salary"), React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 600
    }
  }, "Rs ", t.pay.baseSalary.toLocaleString())), t.pay.bonusBreakdown && React.createElement(React.Fragment, null, t.pay.bonusBreakdown.tenure > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Tenure Bonus"), React.createElement("span", {
    style: {
      color: c.purple,
      fontSize: 11
    }
  }, "+Rs ", t.pay.bonusBreakdown.tenure.toLocaleString())), t.pay.bonusBreakdown.performance > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Performance Bonus"), React.createElement("span", {
    style: {
      color: c.purple,
      fontSize: 11
    }
  }, "+Rs ", t.pay.bonusBreakdown.performance.toLocaleString())), t.pay.bonusBreakdown.students > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Student Count Bonus"), React.createElement("span", {
    style: {
      color: c.purple,
      fontSize: 11
    }
  }, "+Rs ", t.pay.bonusBreakdown.students.toLocaleString()))), React.createElement("div", {
    style: {
      borderTop: "1px solid " + c.success + "44",
      marginTop: 8,
      paddingTop: 8,
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 700
    }
  }, "Gross Salary"), React.createElement("span", {
    style: {
      color: c.success,
      fontSize: 14,
      fontWeight: 700
    }
  }, "Rs ", t.pay.gross.toLocaleString()))), React.createElement("h4", {
    style: {
      color: c.danger,
      fontSize: 13,
      margin: "0 0 8px",
      fontWeight: 600
    }
  }, "DEDUCTIONS"), React.createElement("div", {
    style: {
      background: c.dangerBg,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 12
    }
  }, t.pay.fine > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Attendance Fines"), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 11
    }
  }, "-Rs ", t.pay.fine.toLocaleString())), t.pay.advance > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Advance Deduction"), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 11
    }
  }, "-Rs ", t.pay.advance.toLocaleString())), t.pay.tax > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      color: c.textSec,
      fontSize: 11
    }
  }, "Income Tax"), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 11
    }
  }, "-Rs ", t.pay.tax.toLocaleString())), t.pay.deductions === 0 && React.createElement("div", {
    style: {
      color: c.textMuted,
      fontSize: 11,
      textAlign: "center",
      padding: 5
    }
  }, "No deductions"), React.createElement("div", {
    style: {
      borderTop: "1px solid " + c.danger + "44",
      marginTop: 8,
      paddingTop: 8,
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    style: {
      color: c.text,
      fontSize: 12,
      fontWeight: 700
    }
  }, "Total Deductions"), React.createElement("span", {
    style: {
      color: c.danger,
      fontSize: 14,
      fontWeight: 700
    }
  }, "-Rs ", t.pay.deductions.toLocaleString()))), React.createElement("div", {
    style: {
      background: "linear-gradient(135deg," + c.accent + "22," + c.purple + "22)",
      border: "2px solid " + c.accent,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "Net Salary Payable"), React.createElement("div", {
    style: {
      color: c.accent,
      fontSize: 28,
      fontWeight: 800
    }
  }, "Rs ", t.pay.net.toLocaleString())), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, "Status"), React.createElement(Badge, {
    text: t.pay.status,
    color: t.pay.status === "paid" ? "success" : t.pay.status === "approved" ? "accent" : "warn"
  })), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, "Paid Date"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, t.pay.paidDate || "—")), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, "Method"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, t.pay.paymentMethod || t.bank.split(" - ")[0])), React.createElement("div", {
    style: {
      background: c.bgDeep,
      borderRadius: 6,
      padding: "6px 10px"
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2
    }
  }, "Approved By"), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 11,
      fontWeight: 600
    }
  }, t.pay.approvedBy || "Pending"))), React.createElement("div", {
    style: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 9,
      paddingTop: 10,
      borderTop: "1px solid " + c.border
    }
  }, "LLQA Academy \xB7 Computer-generated payslip \xB7 No signature required"), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 12
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: onClose
  }, "Close"), React.createElement(Btn, {
    icon: Download,
    onClick: () => {
      window.print && window.print();
    }
  }, "Download PDF"))));
};

