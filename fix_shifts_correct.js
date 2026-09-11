const fs = require('fs');

function replaceFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  let original = code;

  // Replace t.shift === <something>
  code = code.replace(/t\.shift === ([a-zA-Z0-9_"]+)/g, '(t.shift || "").includes($1)');
  
  // Replace r.shift === <something> (in SmartFinder.js)
  code = code.replace(/r\.shift === ([a-zA-Z0-9_"]+)/g, '(r.shift || "").includes($1)');

  if (code !== original) {
    fs.writeFileSync(path, code);
    console.log('Updated ' + path);
  }
}

['src/components/AttendanceMod.js', 'src/components/PayrollMod.js', 'src/components/SmartFinder.js', 'src/components/TimetableMod.js'].forEach(replaceFile);
