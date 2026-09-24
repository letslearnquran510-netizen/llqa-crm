const fs = require('fs');
let code = fs.readFileSync('src/components/TimetableMod.js', 'utf8');

const regex = /!\s*cell\s*&&\s*day\s*!==\s*"Mon"\s*&&\s*React\.createElement\([\s\S]*?"Same as Mon"\)[\s\S]*?"Click to edit",\s*\),/;

if (regex.test(code)) {
  console.log("Matched the Same as Mon block!");
} else {
  console.log("Not matched.");
}
