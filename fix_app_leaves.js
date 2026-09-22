const fs = require('fs');
let code = fs.readFileSync('src/components/App.js', 'utf8');

code = code.replace(/const \[leaves, setLeaves\] = useFirestoreCollection\("leaves", \[\s*\{[\s\S]*?\}\s*\]\);/, 'const [leaves, setLeaves] = useFirestoreCollection("leaves", []);');

fs.writeFileSync('src/components/App.js', code);
console.log('App.js dummy data wiped');
