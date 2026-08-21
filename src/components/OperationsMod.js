const OperationsMod = ({
  setPage,
  teachers,
  students,
  shifts
}) => {
  const act = (teachers || []).filter(t => t.status === "active" || t.status === "new").length;
  const slots = (teachers || []).reduce((s, t) => s + (t.totalSlots || 0), 0);
  const actSt = (students || []).filter(s => s.status === "active").length;
  const ctry = new Set((students || []).map(s => s.country).filter(Boolean)).size;
  const shList = shifts || [];
  const pendSh = shList.length;
  const subjCount = typeof ALL_SUBJECTS !== "undefined" ? ALL_SUBJECTS.length : 7;
  const cards = [{
    id: "timetable",
    label: "Timetable",
    icon: Calendar,
    color: c.accent,
    stat: act + " teachers",
    sub: slots + " total slots scheduled",
    desc: "Per-teacher weekly schedules across Morning, Evening, Night and Weekend shifts."
  }, {
    id: "students",
    label: "Students",
    icon: GraduationCap,
    color: c.success,
    stat: actSt + " active",
    sub: ctry + " countries served",
    desc: "Full student roster with progress logs, attendance, leave and quit tracking."
  }, {
    id: "shifting",
    label: "Class Shifting",
    icon: ArrowRightLeft,
    color: c.warn,
    stat: pendSh + " requests",
    sub: "Student-to-teacher reassignment workflow",
    desc: "Reassignment requests with reason, SPS handover status and feedback tracking."
  }, {
    id: "subjects",
    label: "Subjects",
    icon: BookOpen,
    color: c.purple,
    stat: subjCount + " subjects",
    sub: "Biology, Chemistry, Physics, English, Math, Science, Coding",
    desc: "Non-Quran academic subject teaching with grade-level (I-X) tracking."
  }];
  return React.createElement("div", {
    style: {
      padding: 24
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 24
    }
  }, React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 14,
      background: c.cyan + "22",
      border: "1px solid " + c.cyan + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(Briefcase, {
    size: 28,
    color: c.cyan
  })), React.createElement("div", null, React.createElement("h1", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 24,
      fontWeight: 700
    }
  }, "Operations"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 12,
      marginTop: 6,
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("span", null, "Access: "), React.createElement("span", {
    style: {
      color: c.textSec,
      fontWeight: 600,
      padding: "2px 8px",
      background: c.bgDeep,
      borderRadius: 4,
      border: "1px solid " + c.border,
      fontSize: 10
    }
  }, "Team Leads"), React.createElement("span", {
    style: {
      color: c.textMuted
    }
  }, "\u00B7"), React.createElement("span", {
    style: {
      color: c.cyan,
      fontWeight: 600
    }
  }, "4 modules grouped")))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
      gap: 14
    }
  }, cards.map(card => React.createElement("button", {
    key: card.id,
    onClick: () => setPage(card.id),
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = card.color + "88";
      e.currentTarget.style.transform = "translateY(-2px)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = c.border;
      e.currentTarget.style.transform = "translateY(0)";
    },
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 22,
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.18s ease",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 11,
      background: card.color + "22",
      border: "1px solid " + card.color + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(card.icon, {
    size: 22,
    color: card.color
  })), React.createElement("div", {
    style: {
      color: c.text,
      fontSize: 15,
      fontWeight: 700
    }
  }, card.label)), React.createElement(ChevronRight, {
    size: 18,
    color: c.textMuted
  })), React.createElement("div", null, React.createElement("div", {
    style: {
      color: card.color,
      fontSize: 26,
      fontWeight: 700,
      lineHeight: 1
    }
  }, card.stat), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, card.sub)), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      lineHeight: 1.5,
      borderTop: "1px solid " + c.border,
      paddingTop: 10
    }
  }, card.desc)))), React.createElement("div", {
    style: {
      marginTop: 24,
      padding: 16,
      background: c.bgDeep,
      border: "1px dashed " + c.border,
      borderRadius: 10
    }
  }, React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 8
    }
  }, "Coming as tabs inside child modules"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, ["\u2713 Zoom Links \u2192 done (in Teachers)", "\u2713 Student Monthly Attendance Grid \u2192 done (in Students)"].map(item => React.createElement("span", {
    key: item,
    style: {
      padding: "4px 10px",
      background: c.bgCard,
      border: "1px solid " + c.border,
      borderRadius: 5,
      color: c.textSec,
      fontSize: 10
    }
  }, item)))));
};

