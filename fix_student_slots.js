const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const regex = /React\.createElement\("select", \{\s*value: pf\.time \|\| "",\s*onChange: e => setPf\(\{\s*\.\.\.pf,\s*time: e\.target\.value\s*\}\),\s*style: \{[\s\S]*?\}\s*\}, React\.createElement\("option", \{\s*value: ""\s*\}, "-- Select Free Slot --"\), allFreeOpts\.map\(o => React\.createElement\("option", \{\s*key: o\.value,\s*value: o\.value\s*\}, o\.label\)\)\)/;

const replacement = `React.createElement(CustomSelect, {
    value: pf.time || "",
    onChange: v => setPf({ ...pf, time: v }),
    options: allFreeOpts,
    placeholder: "-- Select Free Slot --"
  })`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log('Replaced free slots in StudentFormModal.js');
} else {
  console.log('Regex did not match free slots in StudentFormModal.js');
}
