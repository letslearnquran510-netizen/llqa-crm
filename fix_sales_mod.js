const fs = require('fs');
let code = fs.readFileSync('src/components/SalesMod.js', 'utf8');

const targetBlockStart = '    if (\r\n      pf.teacher &&\r\n      pf.teacher !== "Unassigned" &&\r\n      pf.time &&\r\n      setTeachers &&\r\n      teachers\r\n    ) {';
const targetBlockEnd = '      } catch (e) {\r\n        console.error("Auto-booking failed:", e);\r\n      }\r\n    }';

const sIdx = code.indexOf(targetBlockStart);
const eIdx = code.indexOf(targetBlockEnd);

if (sIdx !== -1 && eIdx !== -1) {
  const replacement = `
    if (pf.schedule && pf.schedule.length > 0 && setTeachers && teachers) {
      try {
        let updatedTeachers = [...teachers];
        const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        
        for (const slot of pf.schedule) {
          if (!slot.teacher || slot.teacher === "Unassigned" || !slot.time || !slot.day) continue;
          
          const targetTeacher = updatedTeachers.find(t => t.name === slot.teacher);
          if (!targetTeacher) continue;
          
          const parsed = parseUSTime(slot.time);
          const tz = detectTZ(pf.state || "", slot.time);
          if (!parsed || !tz) continue;
          
          const diffMin = tzOffsetMinutes("Asia/Karachi", new Date()) - tzOffsetMinutes(tz, new Date());
          let totalMin = parsed.hour * 60 + parsed.minute + diffMin;
          let dayIdx = DAYS.indexOf(slot.day);
          
          if (totalMin >= 1440) {
            dayIdx = (dayIdx + 1) % 7;
            totalMin -= 1440;
          } else if (totalMin < 0) {
            dayIdx = (dayIdx - 1 + 7) % 7;
            totalMin += 1440;
          }
          
          const pakH = Math.floor(totalMin / 60);
          const pakM = Math.floor((totalMin % 60) / 30) * 30;
          const slotStr = String(pakH).padStart(2, "0") + ":" + String(pakM).padStart(2, "0");
          const pakDay = DAYS[dayIdx];
          
          const newBooking = {
            s: pf.name,
            a: String(parseInt(pf.age) || ""),
            c: courseVal,
            l: pf.parent || "",
            t: slot.time + " USA",
            country: pf.country || "USA",
            state: pf.state || "",
            gender: pf.gender || "Any",
            phone: pf.phone || "",
            family: pf.family || "",
            f: []
          };
          
          updatedTeachers = updatedTeachers.map(t => {
            if (t.id !== targetTeacher.id) return t;
            const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
            if (!sch[pakDay]) sch[pakDay] = {};
            sch[pakDay][slotStr] = newBooking;
            return { ...t, _ttSchedule: sch };
          });
        }
        
        setTeachers(updatedTeachers);
      } catch(e) {
        console.error("Auto-booking failed:", e);
      }
    }
  `;
  
  code = code.substring(0, sIdx) + replacement + code.substring(eIdx + targetBlockEnd.length);
  fs.writeFileSync('src/components/SalesMod.js', code);
  console.log("Replaced perfectly!");
} else {
  console.log("Could not find start or end index.");
}
