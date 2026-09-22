const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceMod.js', 'utf8');

code = code.replace(/\(485000 \+ /g, '(0 + ');

fs.writeFileSync('src/components/FinanceMod.js', code);
console.log('FinanceMod calculation fixed');
