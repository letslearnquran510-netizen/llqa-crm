const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /display: "grid",\s*gridTemplateColumns: "2fr 1fr",/;

if (regex.test(code)) {
  code = code.replace(regex, 'display: "grid",\n              gridTemplateColumns: "2fr 1fr 1fr",');
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Fixed grid!");
} else {
  console.log("Regex not found");
}
