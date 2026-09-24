const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /gridTemplateColumns:\s*"1fr 1fr",\s*gap:\s*"0 14px",\s*\},\s*\},\s*React\.createElement\(Inp,\s*\{\s*label:\s*"Course \*",/;

if (regex.test(code)) {
  code = code.replace(regex, 'gridTemplateColumns: pf.course === "Other (Custom)" ? "1fr 1fr" : "1fr", gap: "0 14px" } }, React.createElement(Inp, { label: "Course *",');
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Made Course grid dynamic!");
} else {
  console.log("Could not match Course grid regex.");
}
