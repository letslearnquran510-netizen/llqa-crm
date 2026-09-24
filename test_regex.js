const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /React\.createElement\(\s*"div",\s*\{\s*style:\s*\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr",\s*gap:\s*"0 14px",\s*\},\s*\},\s*\/\/\s*---\s*SMART SCHEDULE BUILDER START\s*---[\s\S]*?\/\/\s*---\s*SMART SCHEDULE BUILDER END\s*---\s*\),?/m;

if (regex.test(code)) {
  console.log("Matched!");
} else {
  console.log("Not matched!");
}
