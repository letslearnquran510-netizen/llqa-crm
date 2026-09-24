const fs = require('fs');
let code = fs.readFileSync('src/components/TeachMod.js', 'utf8');

const regex = /label: "Location \*",\s*value: form\.location \|\| "",\s*onChange: \(v\) =>\s*setForm\(\{\s*\.\.\.form,\s*location: v,\s*\}\),\s*options: \["IBA", "WFH"\],\s*\}\),/;

const replacementStr = `label: "Location *",
              value: form.location || "",
              onChange: (v) =>
                setForm({
                  ...form,
                  location: v,
                }),
              options: ["IBA", "WFH"],
            }),
            React.createElement(Inp, {
              label: "Teaches Subjects? (e.g. Math, English)",
              value: form.subjects ? (Array.isArray(form.subjects) ? form.subjects.join(", ") : form.subjects) : "",
              onChange: (v) =>
                setForm({
                  ...form,
                  subjects: v ? v.split(",").map(s => s.trim()) : [],
                }),
              placeholder: "Leave blank for Quran-only",
            }),`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/TeachMod.js', code);
  console.log("Added Teaches Subjects!");
} else {
  console.log("Regex not found!");
}
