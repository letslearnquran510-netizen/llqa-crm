const fs = require('fs');
let code = fs.readFileSync('src/components/ParentMod.js', 'utf8');

// Replace all instances of #1e40af with #065f46
code = code.replace(/#1e40af/g, '#065f46');

fs.writeFileSync('src/components/ParentMod.js', code);
console.log('Replaced colors successfully');
