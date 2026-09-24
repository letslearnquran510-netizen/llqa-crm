const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /const legacyTm = newSlots[\s\S]*?\.join\(\", \"\);/;

const replacementStr = `const legacyTm = newSlots
              .filter((s) => s.day && s.time)
              .map((s) => s.day + "|" + s.time)
              .join(", ");
              
            const validSlots = newSlots.filter(s => s.day && s.time).length;
            const autoHours = validSlots > 0 ? String(validSlots * 0.5) : "";`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  
  // Now add hoursPerWeek: autoHours to setPf
  const setPfRegex = /schedule: newSlots,\s*teacher: legacyT,\s*time: legacyTm,/;
  if (setPfRegex.test(code)) {
    code = code.replace(setPfRegex, "schedule: newSlots,\n                teacher: legacyT,\n                time: legacyTm,\n                hoursPerWeek: autoHours,");
    fs.writeFileSync('src/components/StudentFormModal.js', code);
    console.log("Auto-calculated hours added!");
  } else {
    console.log("setPf regex failed!");
  }
} else {
  console.log("legacyTm regex failed!");
}
