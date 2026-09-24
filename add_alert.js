const fs = require('fs');
let code = fs.readFileSync('src/components/SalesMod.js', 'utf8');

const regex = /for\s*\(const\s*slot\s*of\s*pf\.schedule\)\s*\{\s*if\s*\(\s*!slot\.teacher\s*\|\|\s*slot\.teacher\s*===\s*"Unassigned"\s*\|\|\s*!slot\.time\s*\|\|\s*!slot\.day\s*\)\s*continue;/;

const replacementStr = `let skippedSlots = [];
          for (const slot of pf.schedule) {
            if (
              !slot.teacher ||
              slot.teacher === "Unassigned" ||
              !slot.time ||
              !slot.day
            ) {
              skippedSlots.push(slot.day + " " + (slot.time || "No Time"));
              continue;
            }`;

if (regex.test(code)) {
  code = code.replace(regex, replacementStr);
  
  // Now add the alert at the end of the block
  const endRegex = /setTeachers\(updatedTeachers\);\s*\}\s*catch\s*\(\s*e\s*\)\s*\{/;
  const endReplacement = `setTeachers(updatedTeachers);
          if (skippedSlots.length > 0) {
            alert(
              "Student saved successfully!\\n\\nHowever, the following slots were NOT booked in the Timetable because no 
Teacher was selected (or the Teacher was hidden because the time falls outside their Shift):\\n\\n" +
              skippedSlots.join("\\n") +
              "\\n\\nPlease ensure you select a Teacher that is available during the converted PKT times."
            );
          }
        } catch (e) {`;
        
  if (endRegex.test(code)) {
    code = code.replace(endRegex, endReplacement);
    fs.writeFileSync('src/components/SalesMod.js', code);
    console.log("Added skipped slots alert!");
  } else {
    console.log("Could not find end regex");
  }
} else {
  console.log("Could not find loop regex");
}
