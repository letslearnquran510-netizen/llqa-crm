const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /const legacyTm =\s*newSlots\[0\]\?\.day && newSlots\[0\]\?\.time\s*\?\s*newSlots\[0\]\.day \+ "\|" \+ newSlots\[0\]\.time\s*:\s*"";/;

const replacementStr = `const legacyTm = newSlots
              .filter((s) => s.day && s.time)
              .map((s) => s.day + "|" + s.time)
              .join(", ");`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Updated legacyTm to join all slots!");
} else {
  console.log("Regex not found");
}
