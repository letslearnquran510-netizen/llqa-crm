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

const tzOffsetMinutes = (tz, d) => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      })
        .formatToParts(d || new Date())
        .find((p) => p.type === "timeZoneName");
      if (!parts) return 0;
      let val = parts.value.replace("GMT", "").trim();
      if (!val) return 0;
      const sign = val.startsWith("-") ? -1 : 1;
      val = val.replace(/[+-]/, "");
      const [hh, mm] = val.split(":");
      return sign * (parseInt(hh, 10) * 60 + parseInt(mm || 0, 10));
    } catch (e) {
      return 0;
    }
};

const STATE_TZ = { alaska: "America/Anchorage", ny: "America/New_York" }; // mock
const detectTZ = (stateOrLoc, timeStr) => {
    const s = String(stateOrLoc || "")
      .toLowerCase()
      .trim();
    for (const k in STATE_TZ) {
      if (s.includes(k)) return STATE_TZ[k];
    }
    const t = String(timeStr || "").toLowerCase();
    if (/\b(ca|cst|cdt)\b/.test(t) && !/usa/.test(t)) return "America/Toronto";
    if (/\busa\b|\b(am|pm)\b/.test(t)) return "America/New_York";
    return null;
};

const getPakSlot = (usaDay, slotTime, state) => {
    const parsed = parseUSTime(slotTime);
    const tz = detectTZ(state, slotTime);
    if (!parsed || !tz) return null;
    
    const diffMin = tzOffsetMinutes("Asia/Karachi", new Date()) - tzOffsetMinutes(tz, new Date());
    let totalMin = parsed.hour * 60 + parsed.minute + diffMin;
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let dayIdx = DAYS.indexOf(usaDay);
    
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
    return { pakDay, slotStr };
}

console.log("Monday 0300 PM in Alaska:", getPakSlot("Mon", "0300 PM", "Alaska"));
console.log("Thursday 0200 PM in Alaska:", getPakSlot("Thu", "0200 PM", "Alaska"));
