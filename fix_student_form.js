const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const sIdx = code.indexOf('label: "Course *",');
const eIdx = code.indexOf('label: "Date of Registration",');

if (sIdx === -1 || eIdx === -1) {
  console.error("Could not find boundaries");
  process.exit(1);
}

// Find the start of the React.createElement("div" block wrapping Course
const divStart = code.lastIndexOf('React.createElement(', sIdx) - 6;

// Find the end div
const divEnd = code.lastIndexOf('React.createElement(', eIdx) - 6;

const replacement = `
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
              marginTop: 16
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
                  customCourse: v === "Other (Custom)" ? pf.customCourse || "" : "",
                  schedule: [], // reset schedule when course changes to avoid mismatched teacher rules
                  teacher: "",
                  time: ""
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
              })
          ),
          
          (() => {
            const tz = pf.state ? detectTZ(pf.state, "") : null;
            if (!tz) {
              return React.createElement(
                "div",
                { style: { marginTop: 12, padding: "12px", background: c.warnBg, borderRadius: 8, color: c.warn, fontSize: 12 } },
                "\u2139 Please select a State / Province above first. We need your timezone to calculate correct teacher availability."
              );
            }

            const slots = pf.schedule || [{ id: Date.now(), day: "Mon", time: "", teacher: "" }];
            const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const isQuran = pf.course !== "Subject";

            // Helper to compute PKT slot
            const getPakSlot = (usaDay, usaTime) => {
              if (!usaTime) return null;
              const parsed = parseUSTime(usaTime);
              if (!parsed) return null;
              const diffMin = tzOffsetMinutes("Asia/Karachi", new Date()) - tzOffsetMinutes(tz, new Date());
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
                pakSlot: String(pakH).padStart(2, "0") + ":" + String(pakM).padStart(2, "0")
              };
            };

            const isTeacherFree = (t, pakDay, pakSlot) => {
              let tShift = t.shift || "Night";
              let baseSched = null;
              for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
                const found = (TT_DATA[sh].teachers || []).find((x) => x.name === t.name || x.code === t.code);
                if (found) { tShift = sh; baseSched = found.schedule || {}; break; }
              }
              const baseVal = baseSched ? (baseSched[pakDay] || {})[pakSlot] : undefined;
              const overlay = t._ttSchedule || null;
              const ovrVal = overlay ? (overlay[pakDay] || {})[pakSlot] : undefined;
              const effective = ovrVal !== undefined ? ovrVal : baseVal;
              return !effective || effective === "F";
            };

            const getAvailableTeachersForSlots = (slotsToCheck) => {
              return (appTeachers || [])
                .filter(t => t.status !== "resigned" && t.status !== "quit" && t.status !== "terminated")
                .filter(t => {
                  return slotsToCheck.every(slot => {
                    const pak = getPakSlot(slot.day, slot.time);
                    if (!pak) return true; // If no time selected yet, don't filter out
                    return isTeacherFree(t, pak.pakDay, pak.pakSlot);
                  });
                })
                .map(t => ({ value: t.name, label: t.name }));
            };

            const usaTimes = [];
            for (let h = 0; h < 24; h++) {
              for (let m of [0, 30]) {
                const period = h >= 12 ? "PM" : "AM";
                let dh = h % 12; if (dh === 0) dh = 12;
                const compact = String(dh).padStart(2, "0") + String(m).padStart(2, "0") + " " + period;
                usaTimes.push({ value: compact, label: compact });
              }
            }

            const updatePfSchedule = (newSlots) => {
              const legacyT = newSlots[0]?.teacher || "Unassigned";
              const legacyTm = (newSlots[0]?.day && newSlots[0]?.time) ? newSlots[0].day + "|" + newSlots[0].time : "";
              setPf({ ...pf, schedule: newSlots, teacher: legacyT, time: legacyTm });
            };

            const addSlot = () => updatePfSchedule([...slots, { id: Date.now(), day: "Mon", time: "", teacher: isQuran ? slots[0]?.teacher : "" }]);
            const removeSlot = (idx) => updatePfSchedule(slots.filter((_, i) => i !== idx));

            // If Quran, we compute a Master Teacher List
            const masterTeachers = isQuran ? getAvailableTeachersForSlots(slots) : [];

            return React.createElement(
              "div",
              { style: { marginTop: 16 } },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
                React.createElement("h4", { style: { color: c.text, margin: 0, fontSize: 13, fontWeight: 600 } }, "\uD83D\uDCC5 Smart Schedule Builder"),
                React.createElement("button", { onClick: addSlot, style: { background: c.accentBg, color: c.accent, border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: "bold" } }, "+ Add Slot")
              ),
              
              isQuran && React.createElement(
                "div",
                { style: { marginBottom: 14, padding: "10px", background: c.bgHover, borderRadius: 8, border: "1px solid " + c.border } },
                React.createElement("label", { style: { display: "block", color: c.textSec, fontSize: 10, marginBottom: 4, fontWeight: 600, textTransform: "uppercase" } }, "Master Assigned Teacher (Quran Rule)"),
                React.createElement(NativeSelectWrapper, {
                  value: slots[0]?.teacher || "",
                  onChange: (e) => {
                    const newSlots = slots.map(s => ({ ...s, teacher: e.target.value }));
                    updatePfSchedule(newSlots);
                  }
                }, React.createElement("option", { value: "" }, "-- Select Master Teacher --"), masterTeachers.map(t => React.createElement("option", { key: t.value, value: t.value }, t.label)))
              ),

              slots.map((slot, idx) => {
                const slotTeachers = isQuran ? [] : getAvailableTeachersForSlots([slot]);
                return React.createElement(
                  "div",
                  { key: slot.id, style: { display: "grid", gridTemplateColumns: isQuran ? "1fr 2fr auto" : "1fr 2fr 2fr auto", gap: 10, marginBottom: 10, alignItems: "end" } },
                  React.createElement(Inp, {
                    label: "Day",
                    value: slot.day,
                    onChange: (v) => { const n = [...slots]; n[idx].day = v; updatePfSchedule(n); },
                    options: DAYS
                  }),
                  React.createElement(Inp, {
                    label: "Time (USA)",
                    value: slot.time,
                    onChange: (v) => { const n = [...slots]; n[idx].time = v; updatePfSchedule(n); },
                    options: [{value: "", label: "-- Select Time --"}, ...usaTimes]
                  }),
                  !isQuran && React.createElement(Inp, {
                    label: "Teacher",
                    value: slot.teacher,
                    onChange: (v) => { const n = [...slots]; n[idx].teacher = v; updatePfSchedule(n); },
                    options: [{value: "", label: "-- Select Teacher --"}, ...slotTeachers]
                  }),
                  slots.length > 1 && React.createElement("button", {
                    onClick: () => removeSlot(idx),
                    style: { padding: "8px", background: c.dangerBg, color: c.danger, border: "none", borderRadius: 6, cursor: "pointer", height: 34, marginBottom: 12 }
                  }, "X")
                );
              })
            );
          })()
        ),
// --- SMART SCHEDULE BUILDER END ---
`;

code = code.substring(0, divStart) + replacement + code.substring(divEnd);
fs.writeFileSync('src/components/StudentFormModal.js', code);
console.log('Successfully injected SmartScheduleBuilder into StudentFormModal.js');
