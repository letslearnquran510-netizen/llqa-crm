const fs = require('fs');
let code = fs.readFileSync('src/components/ParentMod.js', 'utf8');

// Replace dark green with a professional dark gold
code = code.replace(/#065f46/g, '#926f18');

fs.writeFileSync('src/components/ParentMod.js', code);
console.log('Replaced colors to dark gold successfully');
