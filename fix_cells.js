const fs = require('fs');
let code = fs.readFileSync('src/components/TimetableMod.js', 'utf8');

code = code.replace(/const cell = currentTeacher\.schedule\[day\]\?\.\[slot\];/g, 'const cell = currentTeacher.schedule[day]?.[slot] || "F";');
code = code.replace(/const cell = t\.schedule\[selectedDay\]\?\.\[slot\];/g, 'const cell = t.schedule[selectedDay]?.[slot] || "F";');
code = code.replace(/const cell = teachers\[qbTeacher\]\?\.schedule\[qbDay\]\?\.\[slot\];/g, 'const cell = teachers[qbTeacher]?.schedule[qbDay]?.[slot] || "F";');

fs.writeFileSync('src/components/TimetableMod.js', code);
console.log("Defaulted cells to F!");
