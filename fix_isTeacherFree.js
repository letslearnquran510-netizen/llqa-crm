const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /const isTeacherFree = \(t, pakDay, pakSlot\) => \{[\s\S]*?return !effective \|\| effective === "F";\s*\};/;
const replacementStr = `const isTeacherFree = (t, pakDay, pakSlot) => {
              let tShift = t.shift || "Night";
              let baseSched = null;
              for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
                const found = (TT_DATA[sh].teachers || []).find((x) => x.name === t.name || x.code === t.code);
                if (found) { tShift = sh; baseSched = found.schedule || {}; break; }
              }
              const shiftSlots = TT_DATA[tShift] ? TT_DATA[tShift].slots : [];
              if (!shiftSlots.includes(pakSlot)) return false;
              
              const baseVal = baseSched ? (baseSched[pakDay] || {})[pakSlot] : undefined;
              const overlay = t._ttSchedule || null;
              const ovrVal = overlay ? (overlay[pakDay] || {})[pakSlot] : undefined;
              const effective = ovrVal !== undefined ? ovrVal : baseVal;
              return !effective || effective === "F";
            };`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Replaced isTeacherFree in StudentFormModal.js");
} else {
  console.log("Regex failed.");
}
