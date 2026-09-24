const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /placeholder: "e\.g\. S-1001",\s*\}\),\s*type: "number",\s*placeholder: "8",\s*\}\),/;

if (regex.test(code)) {
  // It means the original Age had `type: "number"` and `placeholder: "8"` at the end, and I split it!
  // I need to properly reconstruct the Age and Code blocks.
  code = code.replace(regex, 'placeholder: "e.g. S-1001",\n          }),');
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Fixed syntax!");
} else {
  // Let me just look at the exact text around there
  console.log("Regex not found. Dumping context...");
  const idx = code.indexOf('placeholder: "e.g. S-1001"');
  if (idx !== -1) {
    console.log(code.substring(idx - 100, idx + 100));
  }
}
