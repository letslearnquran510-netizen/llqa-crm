const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceMod.js', 'utf8');

// Replace hardcoded budgets
const targetBudget = '[["Teacher Salaries", 1320000, 1300000], ["Rent & Utilities", 65000, 65000], ["Marketing", 80000, 42000], ["Software", 30000, 23800], ["Admin Staff", 180000, 180000], ["Equipment", 50000, 18000]]';
const newBudget = '[["Teacher Salaries", 0, 0], ["Rent & Utilities", 0, 0], ["Marketing", 0, 0], ["Software", 0, 0], ["Admin Staff", 0, 0], ["Equipment", 0, 0]]';
code = code.replace(targetBudget, newBudget);

// Fix the NaN issue that will happen when we do `a / b * 100` if `b` is 0
code = code.replace(/const pct = Math\.round\(a \/ b \* 100\);/g, 'const pct = b === 0 ? 0 : Math.round(a / b * 100);');

// Replace hardcoded opening balance
code = code.replace(/"Opening Balance \(April\)"/g, '"Opening Balance"');
code = code.replace(/"Rs 485,000"/g, '"Rs 0"');

fs.writeFileSync('src/components/FinanceMod.js', code);
console.log('FinanceMod data wiped');
