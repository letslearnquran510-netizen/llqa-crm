const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('select option {')) {
  code = code.replace(
    'input,select,textarea{font-family:inherit}',
    'input,select,textarea{font-family:inherit}\n    select option { background-color: var(--bgInput); color: var(--text); }'
  );
  fs.writeFileSync('index.html', code);
  console.log('index.html updated with select option styles');
} else {
  console.log('index.html already has select option styles');
}
