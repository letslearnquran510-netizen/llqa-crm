const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /React\.createElement\(Inp, \{\s*label: "Age",[\s\S]*?\}\),/;

const replacementStr = `React.createElement(Inp, {
            label: "Age",
            value: pf.age || "",
            onChange: (v) =>
              setPf({
                ...pf,
                age: v,
              }),
            type: "number",
            placeholder: "e.g. 10",
          }),
          React.createElement(Inp, {
            label: "Code",
            value: pf.code || "",
            onChange: (v) =>
              setPf({
                ...pf,
                code: v,
              }),
            placeholder: "e.g. S-1001",
          }),`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Added code input!");
} else {
  console.log("Regex not found for Age");
}
