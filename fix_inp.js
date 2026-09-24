const fs = require('fs');
let code = fs.readFileSync('src/components/Inp.js', 'utf8');

// Replace the native select in Inp.js
code = code.replace(/React\.createElement\("select"[\s\S]*?\)\)/, `React.createElement(CustomSelect, {
  value: value,
  onChange: onChange,
  options: options,
  placeholder: "Select..."
})`);

fs.writeFileSync('src/components/Inp.js', code);
console.log('Inp.js updated to use CustomSelect');
