const fs = require('fs');
let code = fs.readFileSync('src/components/SalesMod.js', 'utf8');

const regex = /const targetTeacher = updatedTeachers\.find\(\s*\(t\) => t\.name === slot\.teacher,?\s*\);\s*if \(!targetTeacher\) continue;/;

const replacementStr = `const targetTeacher = updatedTeachers.find((t) => t.name === slot.teacher);
            if (!targetTeacher) {
              skippedSlots.push(slot.day + " " + (slot.time || "") + " (Teacher not found)");
              continue;
            }`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/SalesMod.js', code);
  console.log("Updated targetTeacher continue!");
} else {
  console.log("Could not find targetTeacher continue");
}
