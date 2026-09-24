const fs = require('fs');
let code = fs.readFileSync('src/components/StudentFormModal.js', 'utf8');

const targetRegex = /const usaTimes = \[\];[\s\S]*?usaTimes\.push\(\{ value: compact, label: compact \}\);\s*\}\s*\}/;

const replacementStr = `const getDynamicUsaTimes = (selectedDay) => {
              const times = [];
              for (let h = 0; h < 24; h++) {
                for (let m of [0, 30]) {
                  const period = h >= 12 ? "PM" : "AM";
                  let dh = h % 12; if (dh === 0) dh = 12;
                  const compact = String(dh).padStart(2, "0") + String(m).padStart(2, "0") + " " + period;
                  
                  let label = compact;
                  if (selectedDay) {
                    const pak = getPakSlot(selectedDay, compact);
                    if (pak) {
                      const pkh = parseInt(pak.pakSlot.split(":")[0], 10);
                      const pkm = pak.pakSlot.split(":")[1];
                      const pkPer = pkh >= 12 ? "PM" : "AM";
                      let pkDh = pkh % 12; if (pkDh === 0) pkDh = 12;
                      const displayPak = String(pkDh).padStart(2, "0") + ":" + pkm + " " + pkPer;
                      
                      let dayStr = "";
                      if (pak.pakDay !== selectedDay) dayStr = pak.pakDay + " ";
                      
                      label = compact + " (" + dayStr + displayPak + " PKT)";
                    }
                  }
                  times.push({ value: compact, label });
                }
              }
              return times;
            };`;

code = code.replace(targetRegex, replacementStr);

const slotRegex = /options:\s*\[\s*\{\s*value:\s*"",\s*label:\s*"-- Select Time --"\s*\},\s*\.\.\.usaTimes,?\s*\]/;
if (slotRegex.test(code)) {
  code = code.replace(slotRegex, 'options: [{value: "", label: "-- Select Time --"}, ...getDynamicUsaTimes(slot.day)]');
  fs.writeFileSync('src/components/StudentFormModal.js', code);
  console.log("Replaced both generator and usage!");
} else {
  console.log("Usage regex failed!");
}
