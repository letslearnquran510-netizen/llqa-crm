const fs = require('fs');
let code = fs.readFileSync('src/components/SalesMod.js', 'utf8');

code = code.replace(
  'time: pf.time || "",\r\n',
  'time: pf.time || "",\r\n      schedule: pf.schedule || [],\r\n'
);

fs.writeFileSync('src/components/SalesMod.js', code);
console.log('Added schedule to newStudent');
