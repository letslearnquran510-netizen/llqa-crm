const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Add --optionBg to :root
code = code.replace(
  '--bgInput: rgba(255, 255, 255, 0.5);',
  '--bgInput: rgba(255, 255, 255, 0.5);\n      --optionBg: #ffffff;'
);

// 2. Add --optionBg to [data-theme='dark']
code = code.replace(
  '--bgInput: rgba(0, 0, 0, 0.3);',
  '--bgInput: rgba(0, 0, 0, 0.3);\n      --optionBg: #18181b;'
);

// 3. Update select option CSS
code = code.replace(
  'select option { background-color: var(--bgInput); color: var(--text); }',
  'select option { background-color: var(--optionBg); color: var(--text); }'
);

fs.writeFileSync('index.html', code);
console.log('index.html option bg fixed');
