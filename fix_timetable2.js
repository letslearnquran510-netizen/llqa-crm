const fs = require('fs');
let code = fs.readFileSync('src/components/TimetableMod.js', 'utf8');
code = code.replace(/\(\(t\.shift \|\| ""\)\.includes\(\) \|\|/g, '((t.shift || "").includes(shift) ||');
fs.writeFileSync('src/components/TimetableMod.js', code);
