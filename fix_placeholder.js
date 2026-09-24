const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /label: "Hours per Week",\s*value: pf\.hoursPerWeek \|\| "",[\s\S]*?placeholder: "e\.g\. 5",/;

const replacementStr = `label: "Hours per Week",
            value: pf.hoursPerWeek || "",
            onChange: (v) =>
              setPf({
                ...pf,
                hoursPerWeek: v,
              }),
            placeholder: "Auto (0.5 hr/slot)",`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Updated placeholder!");
} else {
  console.log("Placeholder regex failed!");
}
