const fs = require('fs');

const file = 'src/core/common.js';
let code = fs.readFileSync(file, 'utf8');

// We will use a powerful regex replacement to clear the `teachers` array in each shift of `TT_DATA`.
// Or we can just fully replace the `TT_DATA` block.
const replacement = `const TT_DATA = {
  Morning: {
    slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"],
    teachers: []
  },
  Evening: {
    slots: ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"],
    teachers: []
  },
  Night: {
    slots: ["00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30"],
    teachers: []
  },
  Weekend: {
    slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    teachers: []
  }
};`;

code = code.replace(/const TT_DATA = \{[\s\S]*?\n\};\n/m, replacement + "\n");
fs.writeFileSync(file, code);
console.log('TT_DATA cleared');
