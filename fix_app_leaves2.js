const fs = require('fs');
let code = fs.readFileSync('src/components/App.js', 'utf8');

const startStr = 'const [leaves, setLeaves] = useFirestoreCollection("leaves", [';
const endStr = ']);';

const startIndex = code.indexOf(startStr);
if (startIndex !== -1) {
  const endIndex = code.indexOf(endStr, startIndex);
  if (endIndex !== -1) {
    code = code.substring(0, startIndex) + 'const [leaves, setLeaves] = useFirestoreCollection("leaves", []);' + code.substring(endIndex + endStr.length);
    fs.writeFileSync('src/components/App.js', code);
    console.log('App.js leaves wiped perfectly');
  }
}
