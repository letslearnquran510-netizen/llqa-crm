const fs = require('fs');
let code = fs.readFileSync('src/components/App.js', 'utf8');

const regex = /case "subjects":\s*return React\.createElement\(SubjectsMod, null\);/;
const replacementStr = `case "subjects":
        return React.createElement(SubjectsMod, { teachers, setTeachers });`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/App.js', code);
  console.log("Wired SubjectsMod in App.js!");
} else {
  console.log("Regex not found in App.js");
}
