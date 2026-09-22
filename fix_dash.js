const fs = require('fs');
let code = fs.readFileSync('src/components/DashMod.js', 'utf8');

// Replace "Rs 1.4M"
code = code.replace(/"Rs 1\.4M"/g, '"Rs 0"');
code = code.replace(/"Apr 2026"/g, '""');

// Replace "32/38" and "6 not marked"
code = code.replace(/"32\/38"/g, '"0/0"');
code = code.replace(/"6 not marked"/g, '"0 not marked"');

// Replace "3" and "Follow-up needed" (Fee Overdue)
// The value for Fee Overdue was just "3".
code = code.replace(/value: "3",/g, 'value: "0",');
code = code.replace(/"Follow-up needed"/g, '"No follow-up needed"');

// Replace the Action Items array with []
const actionsStr = `[{
    t: "3 students fee overdue",
    d: "Eltaf ($90), Nubair ($135), Hanzala ($135)",
    col: c.danger,
    page: "finance",
    pri: "High"
  }, {
    t: "6 teachers not marked attendance",
    d: "Today's shift ?" please mark before 9 PM PKT",
    col: c.warn,
    page: "attendance",
    pri: "Urgent"
  }, {
    t: "5 SPS reports pending",
    d: "Class shifts need student progress sheets",
    col: c.warn,
    page: "shifting",
    pri: "Medium"
  }, {
    t: "Payroll approval needed",
    d: "32 teacher payments pending ?" Rs 1.4M total",
    col: c.accent,
    page: "payroll",
    pri: "High"
  }, {
    t: "3 leave requests to review",
    d: "Teachers requesting leave this week",
    col: c.purple,
    page: "teachers",
    pri: "Medium"
  }]`;
  
// Use regex to replace the action items array
// We'll replace `\[\{\s*t: "3 students fee overdue"[\s\S]*?pri: "Medium"\s*\}\]` with `[]`
code = code.replace(/\[\{\s*t: "3 students fee overdue"[\s\S]*?pri: "Medium"\s*\}\]/, '[]');

fs.writeFileSync('src/components/DashMod.js', code);
console.log('DashMod data wiped');
