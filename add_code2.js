const fs = require('fs');
let code = fs.readFileSync('src/components/SalesMod.js', 'utf8');

const regex = /name: pf\.name,/;
const replacementStr = `name: pf.name,\n        code: pf.code || "",`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/SalesMod.js', code);
  console.log("Added pf.code to newStudent!");
} else {
  console.log("Regex not found");
}
