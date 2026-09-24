const fs = require('fs');
let code = fs.readFileSync('src/core/common.js', 'utf8');

code = code.replace(
  'maxHeight: 250,\r\n            overflowY: "auto",\r\n            display: "flex",\r\n            flexDirection: "column",\r\n            padding: "4px 0",',
  'maxHeight: 250,\r\n            overflowY: "auto",\r\n            overflowX: "hidden",\r\n            display: "flex",\r\n            flexDirection: "column",\r\n            padding: "4px 0",\r\n            minWidth: "max-content",'
);

fs.writeFileSync('src/core/common.js', code);
console.log("Updated CustomSelect styling!");
