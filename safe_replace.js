const fs = require('fs');
let code = fs.readFileSync('src/components/SubjectsMod.js', 'utf8');

const regex = /const SubjectsMod = \(\) => \{\s*const \[teachers, setTeachers\] = useState\(SUBJ_TEACHERS_DATA\);/;

const replacementStr = `const SubjectsMod = ({ teachers: appTeachers, setTeachers: setAppTeachers }) => {
  const teachers = (appTeachers || []).map((t, i) => {
    const mapped = {
      ...t,
      sno: i + 1,
      subjects: t.subjects || ALL_SUBJECTS,
    };
    if (t._ttSchedule) {
      const daysMap = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };
      for (const capDay in daysMap) {
        if (t._ttSchedule[capDay]) {
          const lowerDay = daysMap[capDay];
          mapped[lowerDay] = {};
          for (const timeStr in t._ttSchedule[capDay]) {
            const timeVal = t._ttSchedule[capDay][timeStr];
            if (timeVal && timeVal !== "F") {
              const idx = SUBJ_SLOTS.indexOf(timeStr);
              if (idx !== -1) {
                mapped[lowerDay][idx + 4] = timeVal;
              }
            }
          }
        }
      }
    }
    return mapped;
  });

  const setTeachers = (newTeachers) => {
    if (!setAppTeachers) return;
    setAppTeachers(appTeachers.map(at => {
      const updated = newTeachers.find(nt => nt.id === at.id);
      if (!updated) return at;
      
      const newTt = at._ttSchedule ? JSON.parse(JSON.stringify(at._ttSchedule)) : {};
      const daysMap = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "sat", sun: "sun" };
      
      for (const lowerDay in daysMap) {
        const capDay = daysMap[lowerDay];
        if (!newTt[capDay]) newTt[capDay] = {};
        
        SUBJ_SLOTS.forEach(slot => {
          if (newTt[capDay][slot] && typeof newTt[capDay][slot] === "object") {
             newTt[capDay][slot] = "F"; 
          }
        });
        
        if (updated[lowerDay]) {
          for (const slotIdx in updated[lowerDay]) {
             const cell = updated[lowerDay][slotIdx];
             const timeStr = SUBJ_SLOTS[parseInt(slotIdx) - 4];
             if (timeStr) {
               newTt[capDay][timeStr] = cell;
             }
          }
        }
      }
      return { ...updated, _ttSchedule: newTt };
    }));
  };`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  fs.writeFileSync('src/components/SubjectsMod.js', code);
  console.log("Safe replacement successful!");
} else {
  console.log("Regex not found!");
}
