const fs = require('fs');

const file = 'src/core/common.js';
let code = fs.readFileSync(file, 'utf8');

const regexes = [
  /const initTeachers = \[\{[\s\S]*?\}\];/m,
  /const revData = \[\{[\s\S]*?\}\];/m,
  /const courseDistro = \[\{[\s\S]*?\}\];/m,
  /const enrollData = \[\{[\s\S]*?\}\];/m,
  /const initStudents = \[\{[\s\S]*?\}\];/m,
  /const initShifts = \[\{[\s\S]*?\}\];/m,
  /const initPayrollTeachers = \[\{[\s\S]*?\}\];/m,
  /const initFeeStudents = \[\{[\s\S]*?\}\];/m,
  /const initExpenses = \[\{[\s\S]*?\}\];/m,
  /const SUBJ_TEACHERS_DATA = \[\{[\s\S]*?\}\];/m,
  /const DEFAULT_TEAM_LEADS = \[\{[\s\S]*?\}\];/m,
  /const LOGIN_AUDIT = \[\{[\s\S]*?\}\];/m,
];

let newCode = code;

regexes.forEach(regex => {
  const match = newCode.match(regex);
  if (match) {
    const varName = match[0].split(' ')[1]; // initTeachers
    newCode = newCode.replace(regex, `const ${varName} = [];`);
  }
});

// For generated data
newCode = newCode.replace(/const initAttTeachers = genAttData\(\);/g, 'const initAttTeachers = [];');
newCode = newCode.replace(/const initAttHist = genHistory\(initAttTeachers\);/g, 'const initAttHist = {};');
newCode = newCode.replace(/const initPayHistory = genPayHistory\(\);/g, 'const initPayHistory = [];');

fs.writeFileSync(file, newCode);
console.log('Dummy data cleared in common.js');
