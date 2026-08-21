const HRMod = () => React.createElement(ModuleSkeleton, {
  title: "HR",
  role: "Manager HR",
  icon: UserCheck,
  color: c.accent,
  subSheets: [{
    id: "interview",
    label: "Interview Sheet",
    status: "new",
    desc: "Track interview pipeline for new teacher candidates from screening to decision.",
    fields: ["Candidate Name", "Role Applied", "Interview Date", "Interviewer", "Score (1-10)", "Decision", "Reason", "Next Step", "Notes"]
  }, {
    id: "hiring",
    label: "New Hiring Sheet",
    status: "new",
    desc: "Onboarding pipeline from offer letter to first class day.",
    fields: ["Candidate", "Position", "Offer Sent Date", "Offer Status", "Joining Date", "CNIC", "Bank Details", "Documents Submitted", "Onboarding Stage"]
  }, {
    id: "staff-attendance",
    label: "Staff Attendance Sheet",
    status: "exists",
    desc: "Monthly staff attendance summary with present, late, absent, leave counts.",
    fields: ["Teacher", "Code", "Shift", "Days", "Present", "Late", "Absent", "Leave", "Half Day", "Attendance %", "Late Minutes", "Fines", "Net Pay"],
    existingAt: "Attendance module \u2192 HR tab"
  }, {
    id: "tardy",
    label: "Staff Tardy Sheet",
    status: "partial",
    desc: "Per-incident tardy register: which day, which teacher, how late, fine applied.",
    fields: ["Date", "Teacher", "Shift Start", "Check-in Time", "Late Minutes", "Fine Rs", "Reason", "Approval Status"],
    existingAt: "Attendance module \u2192 Fines tab (rules) + auto-attendance log"
  }]
});

