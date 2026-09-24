const fs = require('fs');
let code = fs.readFileSync('src/components/SubjectsMod.js', 'utf8');

code = code.replace(/const daysMap = \{ Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "Sat", Sun: "sun" \};/, 'const daysMap = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };');

fs.writeFileSync('src/components/SubjectsMod.js', code);
console.log("Fixed Sat typo");
