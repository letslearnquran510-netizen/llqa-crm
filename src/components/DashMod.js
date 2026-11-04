const DashMod = ({ teachers, setPage, students }) => {
  const at = teachers.filter(
    (t) => t.status === "active" || t.status === "new",
  );
  const studentList = students || [];
  const activeStudents = studentList.filter(
    (s) => s.status === "active",
  ).length;
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
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        },
      },
      React.createElement(
        "div",
        null,
        React.createElement(
          "p",
          {
            style: {
              margin: 0,
              color: c.text,
              fontSize: 16,
              fontWeight: 700,
            },
          },
          "Welcome back, " + llqaFirstName() + " \uD83D\uDC4B", // v68: the person signed in
        ),
        React.createElement(
          "p",
          {
            style: {
              margin: "2px 0 0",
              color: c.textSec,
              fontSize: 11,
            },
          },
          new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          " \xB7 Here's what's happening at LLQA today",
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          },
        },
        llqaCanOpen("attendance") && // v68: only for people who can open mark attendance
        React.createElement(
          "button",
          {
            onClick: () => setPage && setPage("attendance"),
            style: {
              padding: "8px 14px",
              background: c.accentBg,
              border: "1px solid " + llqaAlpha(c.accent, "44"),
              borderRadius: 7,
              cursor: "pointer",
              color: c.accent,
              fontSize: 11,
              fontWeight: 600,
            },
          },
          "Mark Attendance",
        ),
        llqaCanOpen("students") && // v68: only for people who can open log progress
        React.createElement(
          "button",
          {
            onClick: () => setPage && setPage("students"),
            style: {
              padding: "8px 14px",
              background: c.successBg,
              border: "1px solid " + llqaAlpha(c.success, "44"),
              borderRadius: 7,
              cursor: "pointer",
              color: c.success,
              fontSize: 11,
              fontWeight: 600,
            },
          },
          "Log Progress",
        ),
        llqaCanOpen("finance") && // v68: only for people who can open record payment
        React.createElement(
          "button",
          {
            onClick: () => setPage && setPage("finance"),
            style: {
              padding: "8px 14px",
              background: c.purpleBg,
              border: "1px solid " + llqaAlpha(c.purple, "44"),
              borderRadius: 7,
              cursor: "pointer",
              color: c.purple,
              fontSize: 11,
              fontWeight: 600,
            },
          },
          "Record Payment",
        ),
      ),
    ),
    React.createElement(LLQADashCards, null), // v65
    React.createElement(LLQADashCards3, null), // v67
    // v68: figures, charts, needs-attention and activity — all from the CRM's own records
    // (was sample values: "Rs 0", "0/0", a fixed activity list and charts with no data)
    React.createElement(LLQADashBody, null),
  );
};
