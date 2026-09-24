const fs = require('fs');
let code = fs.readFileSync('src/components/SubjectsMod.js', 'utf8');

const regex = /const SubjectsMod = \(\) => \{\s*const \[teachers, setTeachers\] = useState\(SUBJ_TEACHERS_DATA\);/;
const replacementStr = `const SubjectsMod = ({ teachers: appTeachers, setTeachers: setAppTeachers }) => {
  // Filter appTeachers for Subjects module and ensure they have a subjects array
  const teachers = (appTeachers || []).map((t, i) => ({
    ...t,
    sno: i + 1,
    subjects: t.subjects || ALL_SUBJECTS,
  }));
  
  const setTeachers = (newTeachers) => {
    if (!setAppTeachers) return;
    // newTeachers contains the updated array of Subject teachers.
    // We need to merge them back into appTeachers based on ID.
    setAppTeachers(appTeachers.map(at => {
      const updated = newTeachers.find(nt => nt.id === at.id);
      return updated ? updated : at;
    }));
  };`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/SubjectsMod.js', code);
  console.log("Updated SubjectsMod props and data mapping!");
} else {
  console.log("Regex not found in SubjectsMod.js");
}
