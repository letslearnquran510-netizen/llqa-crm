const fs = require('fs');
let code = fs.readFileSync('src/components/SubjectsMod.js', 'utf8');

code = code.replace(/Sat: "Sat"/g, 'Sat: "sat"');
code = code.replace(/sat: "Sat"/g, 'sat: "Mon"'.replace("Mon", "Sat")); // just to be safe, but actually it's:
code = code.replace(/sat: "Sat"/g, 'sat: "Sat"'); // Wait, the second map is { mon: "Mon", ..., sat: "Sat", sun: "Sun" } which is perfectly correct!
// Actually, let me just replace carefully.
