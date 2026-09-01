const fs = require('fs');
let code = fs.readFileSync('src/components/TimetableMod.js', 'utf8');

// Fix the props
code = code.replace(/  arPayments,\n  teacherFeedback,\n  setTeacherFeedback/g, '  arPayments');

// Fix the .some() call
code = code.replace(/const _paid = _st\.fee === "paid" \|\| \(arPayments,\n  teacherFeedback,\n  setTeacherFeedback \|\| \[\]\)\.some\(p => String\(p\.studentId\) === String\(_st\.id\)\);/g, 'const _paid = _st.fee === "paid" || (arPayments || []).some(p => String(p.studentId) === String(_st.id));');

fs.writeFileSync('src/components/TimetableMod.js', code);
console.log('Fixed TimetableMod');
