const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const sIdx = code.indexOf('label: "Course *",');
const eIdx = code.indexOf('label: "Date of Registration",');

console.log("Start:", sIdx, "End:", eIdx);
