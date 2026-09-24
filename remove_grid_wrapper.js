const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

// The start wrapper regex
const startRegex = /React\.createElement\(\s*"div",\s*\{\s*style:\s*\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr",\s*gap:\s*"0 14px",\s*\},\s*\},\s*\/\/\s*---\s*SMART SCHEDULE BUILDER START\s*---/;

if (startRegex.test(code)) {
  code = code.replace(startRegex, '// --- SMART SCHEDULE BUILDER START ---');
  console.log("Start wrapper removed.");
}

const endRegex = /\),\s*\/\/\s*---\s*SMART SCHEDULE BUILDER END\s*---/;
if (endRegex.test(code)) {
  code = code.replace(endRegex, '// --- SMART SCHEDULE BUILDER END ---');
  console.log("End wrapper removed.");
}

fs.writeFileSync('src/components/StudentFormModal.js', code);
