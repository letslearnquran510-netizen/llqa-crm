const parseUSTime = (timeStr) => {
    if (!timeStr) return null;
    let s = String(timeStr).trim();
    s = s.replace(/USAf|USA|CST|EST|PST|MST|CDT|EDT|PDT|MDT|\bCA\b/gi, "").trim();
    const rangeM = s.match(/^(\d{3,4})\s*-\s*\d{3,4}\s*(AM|PM)$/i);
    if (rangeM) s = rangeM[1] + " " + rangeM[2];
    const m = s.match(/^(\d{1,2}):?\s*(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10),
      mn = parseInt(m[2], 10);
    const per = m[3].toUpperCase();
    if (per === "PM" && h !== 12) h += 12;
    if (per === "AM" && h === 12) h = 0;
    return { hour: h, minute: mn };
};

console.log(parseUSTime("1230 AM"));
console.log(parseUSTime("0130 AM"));
