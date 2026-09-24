const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const sIdx = code.indexOf('        React.createElement(\r\n          "div",\r\n          {\r\n            style: {\r\n              display: "grid",\r\n              gridTemplateColumns: "1fr 1fr",\r\n              gap: "0 14px",\r\n            },\r\n          },\r\n  \r\n          // --- SMART SCHEDULE BUILDER START ---');

if (sIdx === -1) {
  // try different whitespace
  const sIdx2 = code.indexOf('gridTemplateColumns: "1fr 1fr"');
  console.log("Could not find exact string. Here are occurrences of 1fr 1fr:");
  
  let i = -1;
  while ((i = code.indexOf('1fr 1fr', i + 1)) !== -1) {
     console.log(code.substring(i - 100, i + 100));
  }
} else {
  console.log("Found at", sIdx);
}
