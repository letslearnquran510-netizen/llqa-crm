const StudentFormModal = ({
  pf,
  setPf,
  sts,
  appTeachers,
  onSave,
  onClose
}) => React.createElement("div", {
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
    border: "1px solid " + c.success + "66",
    borderRadius: 14,
    padding: 24,
    width: 520,
    maxHeight: "90vh",
    overflowY: "auto"
  }
}, React.createElement("div", {
  style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1px solid " + c.border
  }
}, React.createElement("div", {
  style: {
    display: "flex",
    alignItems: "center",
    gap: 8
  }
}, React.createElement(UserPlus, {
  size: 18,
  color: c.success
}), React.createElement("h3", {
  style: {
    color: c.text,
    fontSize: 16,
    margin: 0,
    fontWeight: 700
  }
}, pf.editingId ? "Edit Student" : "Add New Student")), React.createElement("button", {
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
    background: c.successBg,
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 12,
    color: c.success,
    fontSize: 10
  }
}, "Fill student details \xB7 All fields with * are required"), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "0 14px"
  }
}, React.createElement(Inp, {
  label: "Student Name *",
  value: pf.name || "",
  onChange: v => setPf({
    ...pf,
    name: v
  }),
  placeholder: "e.g. Ahmed Khan"
}), React.createElement(Inp, {
  label: "Age",
  value: pf.age || "",
  onChange: v => setPf({
    ...pf,
    age: v
  }),
  type: "number",
  placeholder: "8"
})), React.createElement(Inp, {
  label: "Parent / Guardian Name *",
  value: pf.parent || "",
  onChange: v => setPf({
    ...pf,
    parent: v
  }),
  placeholder: "Father or Mother's name"
}), (() => {
  if (pf.editingId || !pf.name || !pf.name.trim()) return null;
  const nLower = pf.name.trim().toLowerCase();
  const parentLower = (pf.parent || "").trim().toLowerCase();
  const exact = sts.find(s => (s.name || "").trim().toLowerCase() === nLower && (s.parent || "").trim().toLowerCase() === parentLower && parentLower);
  const nameOnly = sts.find(s => (s.name || "").trim().toLowerCase() === nLower);
  if (exact) {
    return React.createElement("div", {
      style: {
        marginTop: -8,
        marginBottom: 10,
        padding: "6px 10px",
        background: c.dangerBg || "rgba(239,68,68,0.12)",
        border: "1px solid " + (c.danger || "#ef4444") + "55",
        borderRadius: 6,
        color: c.danger || "#ef4444",
        fontSize: 10,
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement(AlertTriangle, {
      size: 12
    }), "\u2716 Student exists with same Name + Parent (teacher: " + (exact.teacher || "—") + ")");
  }
  if (nameOnly) {
    return React.createElement("div", {
      style: {
        marginTop: -8,
        marginBottom: 10,
        padding: "6px 10px",
        background: c.warnBg || "rgba(245,158,11,0.12)",
        border: "1px solid " + (c.warn || "#f59e0b") + "55",
        borderRadius: 6,
        color: c.warn || "#f59e0b",
        fontSize: 10,
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement(AlertTriangle, {
      size: 12
    }), "Name exists (parent: " + nameOnly.parent + "). Different person? Use distinct parent name.");
  }
  return null;
})(), React.createElement("div", {
  style: {
    marginBottom: 12
  }
}, React.createElement("label", {
  style: {
    display: "block",
    color: c.textSec,
    fontSize: 10,
    marginBottom: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
}, "Family Group (optional — for siblings)"), React.createElement("input", {
  list: "familyOptions",
  value: pf.family || "",
  onChange: e => {
    const v = e.target.value;
    const existingSibling = sts.find(s => (s.family || "").toLowerCase() === v.toLowerCase() && v.trim() !== "");
    if (existingSibling && !pf.parent) {
      setPf({
        ...pf,
        family: v,
        parent: existingSibling.parent,
        country: existingSibling.country,
        state: existingSibling.state,
        phone: existingSibling.phone,
        email: existingSibling.email,
        teacher: existingSibling.teacher
      });
    } else {
      setPf({
        ...pf,
        family: v
      });
    }
  },
  placeholder: "e.g. Chowdhury Family, Khan Brothers — type new or pick existing",
  style: {
    width: "100%",
    padding: "8px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box"
  }
}), React.createElement("datalist", {
  id: "familyOptions"
}, [...new Set(sts.map(s => s.family).filter(Boolean))].sort().map(fn => React.createElement("option", {
  key: fn,
  value: fn
}))), pf.family && sts.filter(s => (s.family || "").toLowerCase() === pf.family.toLowerCase()).length > 0 && React.createElement("div", {
  style: {
    fontSize: 10,
    color: c.success,
    marginTop: 4
  }
}, "✓ Will be linked to " + sts.filter(s => (s.family || "").toLowerCase() === pf.family.toLowerCase()).length + " existing sibling(s) in this family")), React.createElement("div", {
  style: {
    marginBottom: 12
  }
}, React.createElement("label", {
  style: {
    display: "block",
    color: c.textSec,
    fontSize: 10,
    marginBottom: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
}, "Reference / Referred By (optional)"), React.createElement("input", {
  value: pf.referredBy || "",
  onChange: e => setPf({
    ...pf,
    referredBy: e.target.value
  }),
  placeholder: "Who referred this student? — auto-logs to Sales → References",
  style: {
    width: "100%",
    padding: "8px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box"
  }
}), pf.referredBy && pf.referredBy.trim() && React.createElement("div", {
  style: {
    fontSize: 10,
    color: c.purple,
    marginTop: 4
  }
}, "✓ Will appear in Sales → References as an enrolled referral")), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 14px"
  }
}, React.createElement(Inp, {
  label: "Country",
  value: pf.country || "",
  onChange: v => setPf({
    ...pf,
    country: v
  }),
  options: ["USA", "Canada", "UK", "UAE", "Australia", "Other"]
}), pf.country === "Other" ? React.createElement(Inp, {
  label: "State / Region",
  value: pf.state || "",
  onChange: v => setPf({
    ...pf,
    state: v
  }),
  placeholder: "Enter state / region"
}) : React.createElement(Inp, {
  label: "State / Province",
  value: pf.state || "",
  onChange: v => setPf({
    ...pf,
    state: v
  }),
  options: ["", ...(COUNTRY_STATES[pf.country || "USA"] || [])]
})), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 14px"
  }
}, React.createElement(Inp, {
  label: "Course *",
  value: pf.course || "",
  onChange: v => setPf({
    ...pf,
    course: v,
    customCourse: v === "Other (Custom)" ? pf.customCourse || "" : ""
  }),
  options: ["Quran", "EN-Quaida", "Quran with Tajweed", "Quran-Memo", "Saudi Quran", "Quran+Memo+Islamic Ed", "Eng/Noorani Quaida", "Subject", "Other (Custom)"]
}), React.createElement("div", {
  style: {
    marginBottom: 12
  }
}, React.createElement("label", {
  style: {
    display: "block",
    color: c.textSec,
    fontSize: 10,
    marginBottom: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
}, "Assigned Teacher"), React.createElement("select", {
  value: pf.teacher || "",
  onChange: e => setPf({
    ...pf,
    teacher: e.target.value
  }),
  style: {
    width: "100%",
    padding: "8px 10px",
    background: c.bgInput,
    border: "1px solid " + c.border,
    borderRadius: 6,
    color: c.text,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box"
  }
}, React.createElement("option", {
  value: ""
}, "-- Select Teacher --"), React.createElement("option", {
  value: "Unassigned"
}, "Unassigned"), (() => {
  const computeFree = t => {
    let tShift = t.shift || "Night";
    let baseSched = null;
    for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
      const found = (TT_DATA[sh].teachers || []).find(x => x.name === t.name || x.code === t.code);
      if (found) {
        tShift = sh;
        baseSched = found.schedule || {};
        break;
      }
    }
    if (!TT_DATA[tShift]) return 0;
    const slots = TT_DATA[tShift].slots || [];
    const days = tShift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const overlay = t._ttSchedule || null;
    let free = 0;
    days.forEach(day => {
      slots.forEach(slot => {
        const baseVal = baseSched ? (baseSched[day] || {})[slot] : undefined;
        const ovrVal = overlay ? (overlay[day] || {})[slot] : undefined;
        const effective = ovrVal !== undefined ? ovrVal : baseVal;
        if (!effective || effective === "F") free++;
      });
    });
    return free;
  };
  return (appTeachers || []).filter(t => t.status !== "resigned" && t.status !== "quit" && t.status !== "terminated").map(t => ({
    t: t,
    fs: computeFree(t)
  })).sort((a, b) => b.fs - a.fs).map(o => React.createElement("option", {
    key: o.t.id,
    value: o.t.name
  }, o.t.name + " \u2014 " + o.fs + " free slots" + (o.t.location ? " (" + o.t.location + ")" : "")));
})()))), pf.course === "Other (Custom)" && React.createElement(Inp, {
  label: "Custom Course Name *",
  value: pf.customCourse || "",
  onChange: v => setPf({
    ...pf,
    customCourse: v
  }),
  placeholder: "e.g. Hifz Revision, Tafseer Class, Arabic Grammar"
}), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "0 14px"
  }
}, (() => {
  if (!pf.teacher || pf.teacher === "Unassigned") {
    return React.createElement(Inp, {
      label: "Class Time (USA)",
      value: pf.time || "",
      onChange: v => setPf({
        ...pf,
        time: v
      }),
      placeholder: "0700 PM (select teacher first for smart picker)"
    });
  }
  const tz = pf.state ? detectTZ(pf.state, "") : null;
  if (!tz) {
    return React.createElement("div", {
      style: {
        marginBottom: 12
      }
    }, React.createElement("label", {
      style: {
        display: "block",
        color: c.textSec,
        fontSize: 10,
        marginBottom: 4,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5
      }
    }, "Class Time (USA)"), React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: c.accentBg,
        border: "1px solid " + c.accent + "55",
        borderRadius: 6,
        color: c.accent,
        fontSize: 11
      }
    }, "\u2139 Please fill Country and State first so we can show class times in the student's timezone."));
  }
  let tShift = "Night";
  let tSchedule = null;
  for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
    const found = (TT_DATA[sh].teachers || []).find(x => x.name === pf.teacher);
    if (found) {
      tShift = sh;
      tSchedule = found.schedule || {};
      break;
    }
  }
  const appT = (appTeachers || []).find(x => x.name === pf.teacher);
  if (appT) {
    if (appT.shift) tShift = appT.shift;
    if (!tSchedule) tSchedule = {};
  }
  const overlay = appT && appT._ttSchedule ? appT._ttSchedule : null;
  const shiftSlots = TT_DATA[tShift].slots;
  const daysForShift = tShift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const refDate = new Date();
  const diffMin = tzOffsetMinutes("Asia/Karachi", refDate) - tzOffsetMinutes(tz, refDate);
  const allFreeOpts = [];
  daysForShift.forEach(day => {
    shiftSlots.forEach(pktSlot => {
      const base = (tSchedule[day] || {})[pktSlot];
      const ovr = overlay ? (overlay[day] || {})[pktSlot] : undefined;
      const effective = ovr !== undefined ? ovr : base;
      const isFree = !effective || effective === "F";
      if (!isFree) return;
      const [ph, pm] = pktSlot.split(":").map(Number);
      const totalMin = ph * 60 + pm - diffMin;
      const wrapped = (totalMin % 1440 + 1440) % 1440;
      const uH = Math.floor(wrapped / 60);
      const uM = wrapped % 60;
      const period = uH >= 12 ? "PM" : "AM";
      let dh = uH % 12;
      if (dh === 0) dh = 12;
      const usaCompact = String(dh).padStart(2, "0") + String(uM).padStart(2, "0") + " " + period;
      const usaDisplay = String(dh).padStart(2, "0") + ":" + String(uM).padStart(2, "0") + " " + period;
      allFreeOpts.push({
        value: day + "|" + usaCompact,
        label: day + " \u00B7 " + to12h(pktSlot) + " PKT \u00B7 " + usaDisplay + " USA",
        day: day,
        pktSlot: pktSlot
      });
    });
  });
  if (allFreeOpts.length === 0) {
    return React.createElement("div", {
      style: {
        marginBottom: 12
      }
    }, React.createElement("label", {
      style: {
        display: "block",
        color: c.textSec,
        fontSize: 10,
        marginBottom: 4,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5
      }
    }, "Class Time (USA)"), React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: c.warnBg,
        border: "1px solid " + c.warn + "55",
        borderRadius: 6,
        color: c.warn,
        fontSize: 11
      }
    }, "\u26A0 " + pf.teacher + " has no free slots this week. Pick another teacher or free up slots in Timetable."));
  }
  return React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("label", {
    style: {
      display: "block",
      color: c.textSec,
      fontSize: 10,
      marginBottom: 4,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Class Time (USA) \u2014 " + allFreeOpts.length + " free slot" + (allFreeOpts.length === 1 ? "" : "s") + " this week"), React.createElement("select", {
    value: pf.time || "",
    onChange: e => setPf({
      ...pf,
      time: e.target.value
    }),
    style: {
      width: "100%",
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  }, React.createElement("option", {
    value: ""
  }, "-- Select Free Slot --"), allFreeOpts.map(o => React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))));
})(), React.createElement(Inp, {
  label: "Date of Registration",
  value: pf.dor || "",
  onChange: v => setPf({
    ...pf,
    dor: v
  }),
  type: "date"
}), React.createElement(Inp, {
  label: "Fee Status",
  value: pf.fee || "",
  onChange: v => setPf({
    ...pf,
    fee: v
  }),
  options: ["paid", "overdue", "partial", "trial"]
})), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 14px"
  }
}, React.createElement(Inp, {
  label: "Gender",
  value: pf.gender || "",
  onChange: v => setPf({
    ...pf,
    gender: v
  }),
  options: ["", "Male", "Female"]
}), React.createElement(Inp, {
  label: "Class Type",
  value: pf.classType || "Regular",
  onChange: v => setPf({
    ...pf,
    classType: v
  }),
  options: ["Regular", "Trial", "Premium", "Saudi", "Group"]
})), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 14px"
  }
}, React.createElement(Inp, {
  label: "Phone / WhatsApp",
  value: pf.phone || "",
  onChange: v => setPf({
    ...pf,
    phone: v
  }),
  placeholder: "+1 ..."
}), React.createElement(Inp, {
  label: "Email",
  value: pf.email || "",
  onChange: v => setPf({
    ...pf,
    email: v
  }),
  type: "email",
  placeholder: "parent@email.com"
})), React.createElement("div", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "0 14px"
  }
}, React.createElement(Inp, {
  label: "Hours per Week",
  value: pf.hoursPerWeek || "",
  onChange: v => setPf({
    ...pf,
    hoursPerWeek: v
  }),
  placeholder: "e.g. 5"
}), React.createElement(Inp, {
  label: "Fee Amount",
  value: pf.fee_amount || "",
  onChange: v => setPf({
    ...pf,
    fee_amount: v
  }),
  type: "number",
  placeholder: "45"
}), React.createElement(Inp, {
  label: "Currency",
  value: pf.currency || "USD",
  onChange: v => setPf({
    ...pf,
    currency: v
  }),
  options: ["USD", "CAD", "GBP", "EUR", "AED", "PKR"]
})), React.createElement(Inp, {
  label: "Notes / Special Requirements",
  value: pf.notes || "",
  onChange: v => setPf({
    ...pf,
    notes: v
  }),
  placeholder: "e.g. Needs female teacher, Weekend only, Has dyslexia"
}), React.createElement("div", {
  style: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid " + c.border
  }
}, React.createElement(Btn, {
  variant: "outline",
  onClick: onClose
}, "Cancel"), React.createElement(Btn, {
  onClick: onSave,
  icon: UserPlus
}, "Add Student"))));

