const fs = require('fs');
let code = fs.readFileSync('src/core/common.js', 'utf8');

code = code.replace(
  'alignItems: "center",\r\n            },\r\n            onMouseEnter: (e) => {',
  'alignItems: "center",\r\n              whiteSpace: "nowrap"\r\n            },\r\n            onMouseEnter: (e) => {'
);
code = code.replace(
  'display: "flex",\r\n              alignItems: "center",\r\n            },\r\n            onMouseEnter: (e) => {',
  'display: "flex",\r\n              alignItems: "center",\r\n              whiteSpace: "nowrap"\r\n            },\r\n            onMouseEnter: (e) => {'
);

fs.writeFileSync('src/core/common.js', code);
console.log("Updated CustomSelect options whitespace!");
