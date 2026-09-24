const StudentFormModal = ({ pf, setPf, sts, appTeachers, onSave, onClose }) =>
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
        padding: 20,
        overflowY: "auto",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          background: c.bgCard,
          border: "1px solid " + c.success + "66",
          borderRadius: 14,
          padding: 24,
          width: 520,
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
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: "1px solid " + c.border,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
            },
          },
          React.createElement(UserPlus, {
            size: 18,
            color: c.success,
          }),
          React.createElement(
            "h3",
            {
              style: {
                color: c.text,
                fontSize: 16,
                margin: 0,
                fontWeight: 700,
              },
            },
            pf.editingId ? "Edit Student" : "Add New Student",
          ),
        ),
        React.createElement(
          "button",
          {
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
            background: c.successBg,
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
            color: c.success,
            fontSize: 10,
          },
        },
        "Fill student details \xB7 All fields with * are required",
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Student Name *",
          value: pf.name || "",
          onChange: (v) =>
            setPf({
              ...pf,
              name: v,
            }),
          placeholder: "e.g. Ahmed Khan",
        }),
        React.createElement(Inp, {
          label: "Age",
          value: pf.age || "",
          onChange: (v) =>
            setPf({
              ...pf,
              age: v,
            }),
          type: "number",
          placeholder: "8",
        }),
      ),
      React.createElement(Inp, {
        label: "Parent / Guardian Name *",
        value: pf.parent || "",
        onChange: (v) =>
          setPf({
            ...pf,
            parent: v,
          }),
        placeholder: "Father or Mother's name",
      }),
      (() => {
        if (pf.editingId || !pf.name || !pf.name.trim()) return null;
        const nLower = pf.name.trim().toLowerCase();
        const parentLower = (pf.parent || "").trim().toLowerCase();
        const exact = sts.find(
          (s) =>
            (s.name || "").trim().toLowerCase() === nLower &&
            (s.parent || "").trim().toLowerCase() === parentLower &&
            parentLower,
        );
        const nameOnly = sts.find(
          (s) => (s.name || "").trim().toLowerCase() === nLower,
        );
        if (exact) {
          return React.createElement(
            "div",
            {
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
                gap: 6,
              },
            },
            React.createElement(AlertTriangle, {
              size: 12,
            }),
            "\u2716 Student exists with same Name + Parent (teacher: " +
              (exact.teacher || "—") +
              ")",
          );
        }
        if (nameOnly) {
          return React.createElement(
            "div",
            {
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
                gap: 6,
              },
            },
            React.createElement(AlertTriangle, {
              size: 12,
            }),
            "Name exists (parent: " +
              nameOnly.parent +
              "). Different person? Use distinct parent name.",
          );
        }
        return null;
      })(),
      React.createElement(
        "div",
        {
          style: {
            marginBottom: 12,
          },
        },
        React.createElement(
          "label",
          {
            style: {
              display: "block",
              color: c.textSec,
              fontSize: 10,
              marginBottom: 4,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
          },
          "Family Group (optional — for siblings)",
        ),
        React.createElement("input", {
          list: "familyOptions",
          value: pf.family || "",
          onChange: (e) => {
            const v = e.target.value;
            const existingSibling = sts.find(
              (s) =>
                (s.family || "").toLowerCase() === v.toLowerCase() &&
                v.trim() !== "",
            );
            if (existingSibling && !pf.parent) {
              setPf({
                ...pf,
                family: v,
                parent: existingSibling.parent,
                country: existingSibling.country,
                state: existingSibling.state,
                phone: existingSibling.phone,
                email: existingSibling.email,
                teacher: existingSibling.teacher,
              });
            } else {
              setPf({
                ...pf,
                family: v,
              });
            }
          },
          placeholder:
            "e.g. Chowdhury Family, Khan Brothers — type new or pick existing",
          style: {
            width: "100%",
            padding: "8px 10px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 6,
            color: c.text,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          },
        }),
        React.createElement(
          "datalist",
          {
            id: "familyOptions",
          },
          [...new Set(sts.map((s) => s.family).filter(Boolean))]
            .sort()
            .map((fn) =>
              React.createElement("option", {
                key: fn,
                value: fn,
              }),
            ),
        ),
        pf.family &&
          sts.filter(
            (s) => (s.family || "").toLowerCase() === pf.family.toLowerCase(),
          ).length > 0 &&
          React.createElement(
            "div",
            {
              style: {
                fontSize: 10,
                color: c.success,
                marginTop: 4,
              },
            },
            "✓ Will be linked to " +
              sts.filter(
                (s) =>
                  (s.family || "").toLowerCase() === pf.family.toLowerCase(),
              ).length +
              " existing sibling(s) in this family",
          ),
      ),
      React.createElement(
        "div",
        {
          style: {
            marginBottom: 12,
          },
        },
        React.createElement(
          "label",
          {
            style: {
              display: "block",
              color: c.textSec,
              fontSize: 10,
              marginBottom: 4,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
          },
          "Reference / Referred By (optional)",
        ),
        React.createElement("input", {
          value: pf.referredBy || "",
          onChange: (e) =>
            setPf({
              ...pf,
              referredBy: e.target.value,
            }),
          placeholder:
            "Who referred this student? — auto-logs to Sales → References",
          style: {
            width: "100%",
            padding: "8px 10px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 6,
            color: c.text,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          },
        }),
        pf.referredBy &&
          pf.referredBy.trim() &&
          React.createElement(
            "div",
            {
              style: {
                fontSize: 10,
                color: c.purple,
                marginTop: 4,
              },
            },
            "✓ Will appear in Sales → References as an enrolled referral",
          ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Country",
          value: pf.country || "",
          onChange: (v) =>
            setPf({
              ...pf,
              country: v,
            }),
          options: ["USA", "Canada", "UK", "UAE", "Australia", "Other"],
        }),
        pf.country === "Other"
          ? React.createElement(Inp, {
              label: "State / Region",
              value: pf.state || "",
              onChange: (v) =>
                setPf({
                  ...pf,
                  state: v,
                }),
              placeholder: "Enter state / region",
            })
          : React.createElement(Inp, {
              label: "State / Province",
              value: pf.state || "",
              onChange: (v) =>
                setPf({
                  ...pf,
                  state: v,
                }),
              options: ["", ...(COUNTRY_STATES[pf.country || "USA"] || [])],
            }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },

        // --- SMART SCHEDULE BUILDER START ---
        React.createElement(
          "div",
          {
            style: {
              background: c.bgDeep,
              border: "1px solid " + c.border,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              marginTop: 16,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(Inp, {
              label: "Course *",
              value: pf.course || "",
              onChange: (v) =>
                setPf({
                  ...pf,
                  course: v,
                  customCourse:
                    v === "Other (Custom)" ? pf.customCourse || "" : "",
                  schedule: [], // reset schedule when course changes to avoid mismatched teacher rules
                  teacher: "",
                  time: "",
                }),
              options: [
                "Quran",
                "EN-Quaida",
                "Quran with Tajweed",
                "Quran-Memo",
                "Saudi Quran",
                "Quran+Memo+Islamic Ed",
                "Eng/Noorani Quaida",
                "Subject",
                "Other (Custom)",
              ],
            }),
            pf.course === "Other (Custom)" &&
              React.createElement(Inp, {
                label: "Custom Course Name *",
                value: pf.customCourse || "",
                onChange: (v) =>
                  setPf({
                    ...pf,
                    customCourse: v,
                  }),
                placeholder: "e.g. Hifz Revision, Tafseer Class",
              }),
          ),

          (() => {
            const tz = pf.state ? detectTZ(pf.state, "") : null;
            if (!tz) {
              return React.createElement(
                "div",
                {
                  style: {
                    marginTop: 12,
                    padding: "12px",
                    background: c.warnBg,
                    borderRadius: 8,
                    color: c.warn,
                    fontSize: 12,
                  },
                },
                "ℹ Please select a State / Province above first. We need your timezone to calculate correct teacher availability.",
              );
            }

            const slots = pf.schedule || [
              { id: Date.now(), day: "Mon", time: "", teacher: "" },
            ];
            const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const isQuran = pf.course !== "Subject";

            // Helper to compute PKT slot
            const getPakSlot = (usaDay, usaTime) => {
              if (!usaTime) return null;
              const parsed = parseUSTime(usaTime);
              if (!parsed) return null;
              const diffMin =
                tzOffsetMinutes("Asia/Karachi", new Date()) -
                tzOffsetMinutes(tz, new Date());
              let totalMin = parsed.hour * 60 + parsed.minute + diffMin;
              let dayIdx = DAYS.indexOf(usaDay);
              if (totalMin >= 1440) {
                dayIdx = (dayIdx + 1) % 7;
                totalMin -= 1440;
              } else if (totalMin < 0) {
                dayIdx = (dayIdx - 1 + 7) % 7;
                totalMin += 1440;
              }
              const pakH = Math.floor(totalMin / 60);
              const pakM = Math.floor((totalMin % 60) / 30) * 30;
              return {
                pakDay: DAYS[dayIdx],
                pakSlot:
                  String(pakH).padStart(2, "0") +
                  ":" +
                  String(pakM).padStart(2, "0"),
              };
            };

            const isTeacherFree = (t, pakDay, pakSlot) => {
              let tShift = t.shift || "Night";
              let baseSched = null;
              for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
                const found = (TT_DATA[sh].teachers || []).find(
                  (x) => x.name === t.name || x.code === t.code,
                );
                if (found) {
                  tShift = sh;
                  baseSched = found.schedule || {};
                  break;
                }
              }
              const baseVal = baseSched
                ? (baseSched[pakDay] || {})[pakSlot]
                : undefined;
              const overlay = t._ttSchedule || null;
              const ovrVal = overlay
                ? (overlay[pakDay] || {})[pakSlot]
                : undefined;
              const effective = ovrVal !== undefined ? ovrVal : baseVal;
              return !effective || effective === "F";
            };

            const getAvailableTeachersForSlots = (slotsToCheck) => {
              return (appTeachers || [])
                .filter(
                  (t) =>
                    t.status !== "resigned" &&
                    t.status !== "quit" &&
                    t.status !== "terminated",
                )
                .filter((t) => {
                  return slotsToCheck.every((slot) => {
                    const pak = getPakSlot(slot.day, slot.time);
                    if (!pak) return true; // If no time selected yet, don't filter out
                    return isTeacherFree(t, pak.pakDay, pak.pakSlot);
                  });
                })
                .map((t) => ({ value: t.name, label: t.name }));
            };

            const usaTimes = [];
            for (let h = 0; h < 24; h++) {
              for (let m of [0, 30]) {
                const period = h >= 12 ? "PM" : "AM";
                let dh = h % 12;
                if (dh === 0) dh = 12;
                const compact =
                  String(dh).padStart(2, "0") +
                  String(m).padStart(2, "0") +
                  " " +
                  period;
                usaTimes.push({ value: compact, label: compact });
              }
            }

            const updatePfSchedule = (newSlots) => {
              const legacyT = newSlots[0]?.teacher || "Unassigned";
              const legacyTm =
                newSlots[0]?.day && newSlots[0]?.time
                  ? newSlots[0].day + "|" + newSlots[0].time
                  : "";
              setPf({
                ...pf,
                schedule: newSlots,
                teacher: legacyT,
                time: legacyTm,
              });
            };

            const addSlot = () =>
              updatePfSchedule([
                ...slots,
                {
                  id: Date.now(),
                  day: "Mon",
                  time: "",
                  teacher: isQuran ? slots[0]?.teacher : "",
                },
              ]);
            const removeSlot = (idx) =>
              updatePfSchedule(slots.filter((_, i) => i !== idx));

            // If Quran, we compute a Master Teacher List
            const masterTeachers = isQuran
              ? getAvailableTeachersForSlots(slots)
              : [];

            return React.createElement(
              "div",
              { style: { marginTop: 16 } },
              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  },
                },
                React.createElement(
                  "h4",
                  {
                    style: {
                      color: c.text,
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                    },
                  },
                  "📅 Smart Schedule Builder",
                ),
                React.createElement(
                  "button",
                  {
                    onClick: addSlot,
                    style: {
                      background: c.accentBg,
                      color: c.accent,
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: "bold",
                    },
                  },
                  "+ Add Slot",
                ),
              ),

              isQuran &&
                React.createElement(
                  "div",
                  {
                    style: {
                      marginBottom: 14,
                      padding: "10px",
                      background: c.bgHover,
                      borderRadius: 8,
                      border: "1px solid " + c.border,
                    },
                  },
                  React.createElement(
                    "label",
                    {
                      style: {
                        display: "block",
                        color: c.textSec,
                        fontSize: 10,
                        marginBottom: 4,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      },
                    },
                    "Master Assigned Teacher (Quran Rule)",
                  ),
                  React.createElement(
                    NativeSelectWrapper,
                    {
                      value: slots[0]?.teacher || "",
                      onChange: (e) => {
                        const newSlots = slots.map((s) => ({
                          ...s,
                          teacher: e.target.value,
                        }));
                        updatePfSchedule(newSlots);
                      },
                    },
                    React.createElement(
                      "option",
                      { value: "" },
                      "-- Select Master Teacher --",
                    ),
                    masterTeachers.map((t) =>
                      React.createElement(
                        "option",
                        { key: t.value, value: t.value },
                        t.label,
                      ),
                    ),
                  ),
                ),

              slots.map((slot, idx) => {
                const slotTeachers = isQuran
                  ? []
                  : getAvailableTeachersForSlots([slot]);
                return React.createElement(
                  "div",
                  {
                    key: slot.id,
                    style: {
                      display: "grid",
                      gridTemplateColumns: isQuran
                        ? "1fr 2fr auto"
                        : "1fr 2fr 2fr auto",
                      gap: 10,
                      marginBottom: 10,
                      alignItems: "end",
                    },
                  },
                  React.createElement(Inp, {
                    label: "Day",
                    value: slot.day,
                    onChange: (v) => {
                      const n = [...slots];
                      n[idx].day = v;
                      updatePfSchedule(n);
                    },
                    options: DAYS,
                  }),
                  React.createElement(Inp, {
                    label: "Time (USA)",
                    value: slot.time,
                    onChange: (v) => {
                      const n = [...slots];
                      n[idx].time = v;
                      updatePfSchedule(n);
                    },
                    options: [
                      { value: "", label: "-- Select Time --" },
                      ...usaTimes,
                    ],
                  }),
                  !isQuran &&
                    React.createElement(Inp, {
                      label: "Teacher",
                      value: slot.teacher,
                      onChange: (v) => {
                        const n = [...slots];
                        n[idx].teacher = v;
                        updatePfSchedule(n);
                      },
                      options: [
                        { value: "", label: "-- Select Teacher --" },
                        ...slotTeachers,
                      ],
                    }),
                  slots.length > 1 &&
                    React.createElement(
                      "button",
                      {
                        onClick: () => removeSlot(idx),
                        style: {
                          padding: "8px",
                          background: c.dangerBg,
                          color: c.danger,
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          height: 34,
                          marginBottom: 12,
                        },
                      },
                      "X",
                    ),
                );
              }),
            );
          })(),
        ),
        // --- SMART SCHEDULE BUILDER END ---
        React.createElement(Inp, {
          label: "Date of Registration",
          value: pf.dor || "",
          onChange: (v) =>
            setPf({
              ...pf,
              dor: v,
            }),
          type: "date",
        }),
        React.createElement(Inp, {
          label: "Fee Status",
          value: pf.fee || "",
          onChange: (v) =>
            setPf({
              ...pf,
              fee: v,
            }),
          options: ["paid", "overdue", "partial", "trial"],
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Gender",
          value: pf.gender || "",
          onChange: (v) =>
            setPf({
              ...pf,
              gender: v,
            }),
          options: ["", "Male", "Female"],
        }),
        React.createElement(Inp, {
          label: "Class Type",
          value: pf.classType || "Regular",
          onChange: (v) =>
            setPf({
              ...pf,
              classType: v,
            }),
          options: ["Regular", "Trial", "Premium", "Saudi", "Group"],
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Phone / WhatsApp",
          value: pf.phone || "",
          onChange: (v) =>
            setPf({
              ...pf,
              phone: v,
            }),
          placeholder: "+1 ...",
        }),
        React.createElement(Inp, {
          label: "Email",
          value: pf.email || "",
          onChange: (v) =>
            setPf({
              ...pf,
              email: v,
            }),
          type: "email",
          placeholder: "parent@email.com",
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Hours per Week",
          value: pf.hoursPerWeek || "",
          onChange: (v) =>
            setPf({
              ...pf,
              hoursPerWeek: v,
            }),
          placeholder: "e.g. 5",
        }),
        React.createElement(Inp, {
          label: "Fee Amount",
          value: pf.fee_amount || "",
          onChange: (v) =>
            setPf({
              ...pf,
              fee_amount: v,
            }),
          type: "number",
          placeholder: "45",
        }),
        React.createElement(Inp, {
          label: "Currency",
          value: pf.currency || "USD",
          onChange: (v) =>
            setPf({
              ...pf,
              currency: v,
            }),
          options: ["USD", "CAD", "GBP", "EUR", "AED", "PKR"],
        }),
      ),
      React.createElement(Inp, {
        label: "Notes / Special Requirements",
        value: pf.notes || "",
        onChange: (v) =>
          setPf({
            ...pf,
            notes: v,
          }),
        placeholder: "e.g. Needs female teacher, Weekend only, Has dyslexia",
      }),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid " + c.border,
          },
        },
        React.createElement(
          Btn,
          {
            variant: "outline",
            onClick: onClose,
          },
          "Cancel",
        ),
        React.createElement(
          Btn,
          {
            onClick: onSave,
            icon: UserPlus,
          },
          "Add Student",
        ),
      ),
    ),
  );
