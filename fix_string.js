const fs = require('fs');
let code = fs.readFileSync('src/components/SalesMod.js', 'utf8');

const regex = /"Student saved successfully!\\n\\nHowever, the following slots were NOT booked in the Timetable because no \nTeacher was selected \(or the Teacher was hidden because the time falls outside their Shift\):\\n\\n"/;

if (regex.test(code)) {
  code = code.replace(regex, '"Student saved successfully!\\n\\nHowever, the following slots were NOT booked in the Timetable because no Teacher was selected (or the Teacher was hidden because the time falls outside their Shift):\\n\\n"');
  fs.writeFileSync('src/components/SalesMod.js', code);
  console.log("Fixed string!");
} else {
  console.log("Regex not found");
}
