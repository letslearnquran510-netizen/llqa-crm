/* ============================================================
   v65 — automation: trial pipeline, messages and contacts,
   today's classes, reschedule, waitlist, clock changes.
   Part 1: shared state and logic (no screens).
   ============================================================ */

/* ---------- app context (set by App on every render) ---------- */
const LLQAApp = { ctx: {}, tab: {}, tabSubs: {} };
LLQAApp.set = (ctx) => {
  LLQAApp.ctx = ctx || {};
};
// Props given to a component win; anything missing comes from the app.
const llqaCtx = (p) => {
  const o = { ...LLQAApp.ctx };
  Object.keys(p || {}).forEach((k) => {
    if (p[k] !== undefined) o[k] = p[k];
  });
  return o;
};
// Admin side (not a teacher or parent login).
const llqaCanManage = () => {
  const u = LLQAApp.ctx.user;
  return !u || (u.role !== "teacher" && u.role !== "parent");
};

/* ---------- open a page on a given tab ---------- */
const llqaGo = (page, tab) => {
  if (tab) {
    const sub = LLQAApp.tabSubs[page];
    if (sub) sub(tab);
    else LLQAApp.tab[page] = tab;
  }
  if (LLQAApp.ctx.setPage) LLQAApp.ctx.setPage(page);
};
const llqaTakeTab = (page, dflt) => {
  const t = LLQAApp.tab[page];
  if (t) {
    delete LLQAApp.tab[page];
    return t;
  }
  return dflt;
};
// A mounted page listens for tab requests while it is open.
const llqaOnTab = (page, fn) => {
  LLQAApp.tabSubs[page] = fn;
  return () => {
    if (LLQAApp.tabSubs[page] === fn) delete LLQAApp.tabSubs[page];
  };
};

/* ---------- pop-ups and notices (shown by LLQAHost) ---------- */
const LLQAUI = { modal: null, toasts: [], subs: new Set() };
const llqaUIChanged = () =>
  LLQAUI.subs.forEach((f) => {
    try {
      f();
    } catch (e) {}
  });
const llqaOpen = (kind, data) => {
  LLQAUI.modal = { kind, data: data || {}, key: Date.now() + Math.random() };
  llqaUIChanged();
};
const llqaClose = () => {
  LLQAUI.modal = null;
  llqaUIChanged();
};
const llqaToast = (t) => {
  const id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  LLQAUI.toasts = [...LLQAUI.toasts.filter((x) => !(t.key && x.key === t.key)), { ...t, id, at: Date.now() }].slice(-8);
  llqaUIChanged();
  // short confirmations close by themselves; questions wait for the admin
  if (t.ttl) setTimeout(() => llqaDismiss(id), t.ttl);
  return id;
};
const llqaDismiss = (id) => {
  LLQAUI.toasts = LLQAUI.toasts.filter((x) => x.id !== id);
  if (!LLQAUI.toasts.length) LLQAUI.open = false;
  llqaUIChanged();
};

/* ---------- dates (Pakistan calendar) ---------- */
// (v66: each date string is read once — these run thousands of times)
const llqaDayNumMemo = new Map();
const llqaDayNum = (d) => {
  const k = String(d || "").slice(0, 10);
  let v = llqaDayNumMemo.get(k);
  if (v === undefined) {
    v = Date.parse(k + "T00:00:00Z");
    if (llqaDayNumMemo.size > 20000) llqaDayNumMemo.clear();
    llqaDayNumMemo.set(k, v);
  }
  return v;
};
const llqaDays = (a, b) => {
  const pa = llqaDayNum(a);
  const pb = llqaDayNum(b);
  return isNaN(pa) || isNaN(pb) ? null : Math.round((pb - pa) / 86400000);
};
const llqaAddDays = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const llqaWeekday = (d) => LLQABooking.DAYS[(new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7];
const llqaDateLabelMemo = new Map();
const llqaDateLabel = (d) => {
  const hit = llqaDateLabelMemo.get(d);
  if (hit !== undefined) return hit;
  let v;
  try {
    v = new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  } catch (e) {
    v = d;
  }
  if (llqaDateLabelMemo.size > 5000) llqaDateLabelMemo.clear();
  llqaDateLabelMemo.set(d, v);
  return v;
};
// "17 Mar 2024" (with the year — for dates that may be in another year)
const llqaDateYear = (d) => {
  try {
    return new Date(String(d).slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  } catch (e) {
    return d;
  }
};
const llqaNowPkMin = () => {
  try {
    const s = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Karachi", hour12: false, hour: "2-digit", minute: "2-digit" });
    const [h, m] = s.split(":").map(Number);
    return (h % 24) * 60 + m;
  } catch (e) {
    const d = new Date();
    return ((d.getUTCHours() + 5) % 24) * 60 + d.getUTCMinutes();
  }
};
const llqaSlotMin = (slot) => {
  const [h, m] = String(slot || "").split(":").map(Number);
  return isNaN(h) ? 0 : h * 60 + (m || 0);
};
const llqaAgo = (iso) => {
  if (!iso) return "";
  const ms = Date.now() - Date.parse(iso);
  if (isNaN(ms)) return "";
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + " min ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : d + " days ago";
};
// The family's clock right now: "Tue 4:12 PM".
const llqaLocalNow = (tz) => {
  if (!tz) return "";
  try {
    return new Date().toLocaleString("en-US", { timeZone: tz, weekday: "short", hour: "numeric", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

/* ---------- trials ---------- */
const llqaTrialTarget = (s) => Math.max(1, Math.min(20, parseInt(s && s.trialTarget, 10) || 3));
const llqaIsPaid = (s, arPayments) =>
  !!s && (s.fee === "paid" || llqaPayIndex(arPayments).has(String(s.id))); // v66: indexed (was a scan per student)
const llqaTrialInfo = (s, opt) => {
  const o = opt || {};
  const today = o.today || llqaToday();
  const inTrial = llqaInTrial(s);
  const target = llqaTrialTarget(s);
  const done = Math.max(0, parseInt(s && s.attended, 10) || 0);
  const paid = llqaIsPaid(s, o.arPayments || LLQAApp.ctx.arPayments);
  const start = (s && (s.trialStart || s.dor)) || "";
  const days = start ? llqaDays(start, today) : null;
  const sinceLast = s && s.lastDate ? llqaDays(s.lastDate, today) : null;
  const active = !!s && inTrial && !paid && s.status !== "quit";
  const stage = !active ? "none" : done >= target ? "complete" : done === 0 ? "new" : "active";
  // no class for a week, or still short of the target 10+ days in
  const stalled =
    active && done < target && ((sinceLast != null && sinceLast > 7) || (days != null && days > 10));
  return { inTrial, target, done, paid, start, days, sinceLast, active, stage, stalled };
};
// Timetable / Subjects colour for a booked cell (one rule for both screens).
const llqaTrialStage = (cell, students, arPayments) => {
  if (!cell || !cell.s) return null;
  const list = students || LLQAApp.ctx.students || [];
  const st =
    cell.sid != null && cell.sid !== ""
      ? list.find((x) => String(x.id) === String(cell.sid))
      : list.find((x) => x.name === cell.s && llqaInTrial(x));
  if (!st || !llqaInTrial(st)) return null;
  if (llqaIsPaid(st, arPayments || LLQAApp.ctx.arPayments)) return null;
  const done = parseInt(st.attended, 10) || 0;
  const target = llqaTrialTarget(st);
  return done >= target
    ? { bg: "color-mix(in srgb, var(--warn) 35%, transparent)", bd: c.warn, label: "Trial done " + done + "/" + target, stage: "complete" }
    : { bg: "color-mix(in srgb, var(--danger) 35%, transparent)", bd: c.danger, label: "Trial " + done + "/" + target, stage: "trial" };
};
// After a class is counted: the moment a trial reaches its target, offer the
// fee message (once).
const llqaAfterCount = (before, cnt) => {
  if (!before || !cnt || !llqaInTrial(before) || !llqaCanManage()) return;
  if (llqaIsPaid(before)) return;
  const target = llqaTrialTarget(before);
  const was = parseInt(before.attended, 10) || 0;
  if (was < target && cnt.attended >= target)
    llqaToast({
      kind: "trialComplete",
      key: "trial-" + before.id,
      studentId: before.id,
      text: "🎉 " + (before.name || "Student") + " completed " + target + " trial classes — send the fee message?",
    });
};

/* ---------- phone numbers ---------- */
const LLQA_CC = {
  usa: "1", us: "1", "united states": "1", america: "1", canada: "1",
  uk: "44", "united kingdom": "44", england: "44", scotland: "44", wales: "44", "northern ireland": "44",
  pakistan: "92", uae: "971", "united arab emirates": "971", "saudi arabia": "966", saudi: "966", ksa: "966",
  qatar: "974", kuwait: "965", oman: "968", bahrain: "973", australia: "61", "new zealand": "64", ireland: "353",
  germany: "49", france: "33", netherlands: "31", belgium: "32", norway: "47", sweden: "46", denmark: "45",
  italy: "39", spain: "34", turkey: "90", malaysia: "60", singapore: "65", "south africa": "27", india: "91",
  bangladesh: "880", egypt: "20",
};
// International digits (no +) for WhatsApp / calls, or "" if it can't be
// worked out safely. Local numbers get the country code of the student.
const llqaPhone = (phone, country) => {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  let d = raw.replace(/\D/g, "");
  const ok = (x) => (x.length >= 8 && x.length <= 15 ? x : "");
  if (raw.startsWith("+")) return ok(d);
  if (raw.startsWith("00")) return ok(d.slice(2));
  const cc = LLQA_CC[String(country || "").trim().toLowerCase()] || "";
  if (cc === "1") {
    if (d.length === 10) return "1" + d;
    if (d.length === 11 && d.startsWith("1")) return d;
    return "";
  }
  if (cc) {
    if (d.startsWith(cc) && !d.startsWith("0") && d.length >= cc.length + 8) return ok(d);
    d = d.replace(/^0+/, "");
    return d.length >= 7 ? ok(cc + d) : "";
  }
  return d.length >= 10 ? ok(d) : "";
};

/* ---------- message templates ---------- */
const LLQA_TEMPLATES = [
  ["welcome", "Welcome + class times",
    "Assalamu Alaikum {parent},\n\nWelcome to {academy}! 🌙 {student}'s classes are booked ({zone} time):\n{schedule}\nTeacher: {teacher}\n\nParent Portal: {portalLink}\nParent ID: {portalId}\n(Attendance, progress and teacher notes are there.)\n\nJazakAllah Khair!"],
  ["portalIntro", "Parent Portal intro (existing families)",
    "Assalamu Alaikum {parent},\n\n{student}'s attendance, daily progress and teacher notes are now in our Parent Portal:\n{portalLink}\nParent ID: {portalId}\n\nYou can also ask for leave or a different class time there. Classes ({zone} time):\n{schedule}\n\nJazakAllah Khair!"],
  ["classReminder", "Class reminder",
    "Assalamu Alaikum {parent}, a reminder that {student}'s class with {teacher} is {nextClass} ({zone} time). JazakAllah Khair!"],
  ["newTimes", "New class times",
    "Assalamu Alaikum {parent}, {student}'s class times have changed ({zone} time):\n{schedule}\nTeacher: {teacher}\n\nJazakAllah Khair!"],
  ["trialFollowUp", "Trial check-in",
    "Assalamu Alaikum {parent}, how are {student}'s trial classes going? {trialDone} of {trialTarget} done so far. Is the class time still good for you?"],
  ["trialComplete", "Trial complete — fee",
    "Assalamu Alaikum {parent},\n\nAlhamdulillah, {student} has completed the {trialTarget} trial classes with {teacher}. 🎉\n\nTo continue the classes, the fee is {fee}. Please let us know when you'd like to start and how you prefer to pay.\n\nJazakAllah Khair!"],
  ["feeDue", "Fee reminder",
    "Assalamu Alaikum {parent}, a gentle reminder that {student}'s fee ({fee}) is due. Please let us know once it's sent. JazakAllah Khair!"],
  ["missedClass", "Missed class",
    "Assalamu Alaikum {parent}, {student} missed the class on {date}. Is everything okay? We can arrange a make-up class."],
  ["clockChange", "Clock change",
    "Assalamu Alaikum {parent}, clocks change on {changeDate}. From then, {student}'s class will be at {newTime} your time (same teacher). Please tell us if that doesn't suit you."],
  ["clockChanged", "After a clock change",
    "Assalamu Alaikum {parent}, after the clock change {student}'s class is now at {newTime} your time (same teacher). If you'd prefer to keep the old time, reply and we'll move it."],
  ["slotFree", "Waitlist — time free",
    "Assalamu Alaikum {parent}, good news: the class time you asked for is now available — {wantTime} ({zone} time). Reply to confirm and we'll book it for {student}."],
  ["clockKept", "Clock change — time kept",
    "Assalamu Alaikum {parent}, the clocks have changed — {student}'s class stays at your usual time ({zone} time):\n{schedule}\nJazakAllah Khair!"],
  // v66
  ["firstClass", "After the first class",
    "Assalamu Alaikum {parent}, {student} had the first class with {teacher}. How did it go? Is the class time working well for you? JazakAllah Khair!"],
  ["monthlyReport", "Monthly progress report",
    "Assalamu Alaikum {parent},\n\nHere is {student}'s update for the last 30 days:\n• Classes: {classes} (attended {present}, {pct})\n• Current lesson: {lesson}\n• Teacher: {teacher}\n\nDaily progress and teacher notes are in the Parent Portal: {portalLink} (Parent ID {portalId}).\nJazakAllah Khair!"],
  ["checkIn", "Check-in (missed classes)",
    "Assalamu Alaikum {parent}, we noticed {student} has missed some classes recently. Is everything okay? If the class time or teacher doesn't suit you, we can change it. JazakAllah Khair!"],
  ["holidayNotice", "Holiday notice",
    "Assalamu Alaikum {parent}, the academy is closed for {holiday} ({holidayDates}) — no classes on these days. Classes continue on {resume} at the usual time. JazakAllah Khair!"],
  ["ramadanNotice", "Ramadan message",
    "Assalamu Alaikum {parent}, Ramadan Mubarak! 🌙 {student}'s classes continue during Ramadan ({holidayDates}) at the usual time. JazakAllah Khair!"],
  ["coverFamily", "Teacher on leave — cover",
    "Assalamu Alaikum {parent}, {teacherName} is on leave on {date}, so {cover} will teach {student}'s class at the usual time ({time}). JazakAllah Khair!", "ctx"],
  ["classOff", "Class cancelled — teacher on leave",
    "Assalamu Alaikum {parent}, {student}'s class on {date} ({time}) can't take place because the teacher is on leave. We'll arrange a make-up class — please tell us a time that suits you. JazakAllah Khair!", "ctx"],
  ["feeReceipt", "Payment received",
    "Assalamu Alaikum {parent}, JazakAllah Khair — we have received {amount} for {student}'s fee ({month}).", "ctx"],
  ["approvalAsk", "Ask the parent to approve",
    "Assalamu Alaikum {parent},\n\n{proposal}\n\nPlease approve or decline here: {approvalLink}\n(or simply reply to this message). JazakAllah Khair!", "ctx"],
  ["requestReply", "Reply to a request",
    "Assalamu Alaikum {parent}, about your request ({request}): {decision}. JazakAllah Khair!", "ctx"],
  ["custom", "Custom message", "Assalamu Alaikum {parent},\n\n"],
  // to teachers (not shown in the family message list)
  ["teacherMoves", "Teachers — moved classes",
    "Assalamu Alaikum {name}, the clocks changed for some families, so these classes move to keep the families' usual time:\n{moves}\n\nYour Timetable already shows the new times. JazakAllah Khair!", "staff"],
  ["coverTeacher", "Teachers — cover classes",
    "Assalamu Alaikum {name}, please take these classes (Pakistan time) while their teacher is on leave:\n{moves}\n\nThey are in your Today's Classes. JazakAllah Khair!", "staff"],
  ["holidayTeachers", "Teachers — holiday",
    "Assalamu Alaikum {name}, a reminder that the academy is closed for {holiday} ({holidayDates}) — no classes on these days. JazakAllah Khair!", "staff"],
];
const llqaTplName = (k) => (LLQA_TEMPLATES.find((x) => x[0] === k) || [k, k])[1];
const llqaTplText = (k, messaging) => {
  const own = messaging && messaging.templates && messaging.templates[k];
  if (own && String(own).trim()) return String(own);
  return (LLQA_TEMPLATES.find((x) => x[0] === k) || LLQA_TEMPLATES[LLQA_TEMPLATES.length - 1])[2];
};
const llqaPortalLink = (messaging) => {
  if (messaging && messaging.portalLink) return messaging.portalLink;
  try {
    return window.location.origin + window.location.pathname;
  } catch (e) {
    return "";
  }
};
// "today at 05:00 PM" / "tomorrow at …" / "on Wed at …" on the family's clock.
const llqaNextClass = (s, now) => {
  const B = LLQABooking;
  const tz = (s && (s.tz || B.timezoneFor(s.country, s.state))) || "";
  const rows = s ? B.scheduleOf(s).filter((r) => r.day && r.time) : [];
  if (!tz || !rows.length) return "";
  let wd = "";
  let mins = 0;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(now || new Date());
    const g = (t) => (parts.find((p) => p.type === t) || {}).value || "";
    wd = g("weekday");
    mins = (parseInt(g("hour"), 10) % 24) * 60 + parseInt(g("minute"), 10);
  } catch (e) {
    return "";
  }
  const di = B.DAYS.indexOf(wd);
  if (di < 0) return "";
  let best = null;
  rows.forEach((r) => {
    const p = parseUSTime(r.time);
    if (!p) return;
    const m = p.hour * 60 + p.minute;
    let k = (B.DAYS.indexOf(r.day) - di + 7) % 7;
    if (k === 0 && m < mins) k = 7;
    const score = k * 1440 + m;
    if (!best || score < best.score) best = { score, k, r };
  });
  if (!best) return "";
  const t = B.timeLabel(best.r.time);
  return best.k === 0 ? "today at " + t : best.k === 1 ? "tomorrow at " + t : "on " + best.r.day + " at " + t;
};
// Fill a template for a student (or a waitlist family) — extra overrides.
const llqaFill = (text, s, extra, messaging) => {
  const B = LLQABooking;
  const st = s || {};
  const tz = st.tz || B.timezoneFor(st.country, st.state) || "";
  const rows = B.scheduleOf(st).filter((r) => r.day && r.time);
  const info = llqaTrialInfo(st);
  const fee = st.fee_amount
    ? st.fee_amount + " " + (st.currency || "USD") + " per month"
    : "the monthly fee";
  // v66: last 30 days and the next holiday, for the report / holiday messages
  const today = todayPK();
  const ms = st.id != null ? llqaMonthStats(st, LLQAApp.ctx.dailyProgress, today) : { classes: 0, present: 0, pct: null };
  const hol = llqaNextHoliday(today);
  const v = {
    classes: String(ms.classes),
    present: String(ms.present),
    pct: ms.pct == null ? "—" : ms.pct + "%",
    lesson: st.lastLesson || "—",
    page: st.page ? String(st.page) : "—",
    holiday: hol ? hol.name || "the holiday" : "the holiday",
    holidayDates: hol ? llqaRangeLabel(hol.from, hol.to) : "",
    resume: hol ? llqaDateLabel(llqaAddDays(hol.to || hol.from, 1)) : "",
    parent: st.parent || "",
    student: st.name || "",
    teacher: st.teacher && st.teacher !== "Unassigned" ? st.teacher : "your teacher",
    schedule: rows.length ? rows.map((r) => "• " + r.day + " " + B.timeLabel(r.time)).join("\n") : "• (time to be confirmed)",
    zone: llqaZoneLabel(tz) || "your",
    portalId: st.parentId || "—",
    portalLink: llqaPortalLink(messaging),
    academy: (messaging && messaging.academy) || "Let's Learn Quran Academy",
    nextClass: llqaNextClass(st) || "at the usual time",
    trialDone: String(info.done),
    trialTarget: String(info.target),
    fee,
    date: llqaDateLabel(todayPK()),
    ...(extra || {}),
  };
  return String(text || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));
};
const llqaLastMsg = (log, studentId, template) => {
  let best = null;
  // v66: the log is grouped by student once (it grows every day)
  (llqaLogIndex(log).byStu.get(String(studentId)) || []).forEach((m) => {
    if (template && m.template !== template) return;
    if (!best || String(m.at) > String(best.at)) best = m;
  });
  return best;
};
// Best message to send now.
const llqaSuggest = (s, log) => {
  const info = llqaTrialInfo(s);
  if (info.stage === "complete") return "trialComplete";
  if (s.fee === "overdue" || s.fee === "partial") return "feeDue";
  if (!llqaLastMsg(log, s.id, "welcome")) return "welcome";
  if (info.active) return "trialFollowUp";
  return "custom";
};
const llqaLogMsg = (entry) => {
  const set = LLQAApp.ctx.setMessageLog;
  if (typeof set !== "function") return;
  const u = LLQAApp.ctx.user || {};
  const e = {
    id: "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    at: new Date().toISOString(),
    by: u.name || u.role || "",
    ...entry,
  };
  if (e.text) e.text = String(e.text).slice(0, 600);
  set((prev) => [...(prev || []), e]);
};
const llqaWhatsApp = (digits, text, meta) => {
  if (!digits) return false;
  try {
    window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent(text || ""), "_blank", "noopener");
  } catch (e) {}
  llqaLogMsg({ channel: "whatsapp", phone: digits, text, ...(meta || {}) });
  return true;
};
// Call through the academy dialer when its link is set in the templates
// settings ({phone} is replaced), otherwise the computer's phone app.
const llqaCall = (digits, meta) => {
  if (!digits) return false;
  const dialer = String((LLQAApp.ctx.messaging && LLQAApp.ctx.messaging.dialer) || "").trim();
  try {
    if (dialer && dialer.includes("{phone}")) window.open(dialer.split("{phone}").join(encodeURIComponent("+" + digits)), "_blank", "noopener");
    else window.location.href = "tel:+" + digits;
  } catch (e) {}
  llqaLogMsg({ channel: dialer ? "dialer" : "call", phone: digits, ...(meta || {}) });
  return true;
};

/* ---------- today's classes ---------- */
// Every class on a Pakistan date: night slots belong to the next Pakistan
// morning, because Timetable rows follow the family's day.
// v66: the Pakistan weekday and family time of a Timetable slot, given the
// zone difference (Pakistan minus family, in minutes) — same as
// LLQABooking.pktDayOf, but the difference is worked out once per date.
const llqaPktDay = (rowDay, slot, diff) => {
  const B = LLQABooking;
  const [h, m] = String(slot || "").split(":").map(Number);
  if (isNaN(h)) return { pktDay: rowDay, shift: 0, famTime: "" };
  const famMin = h * 60 + (m || 0) - diff;
  const shift = famMin < 0 ? 1 : famMin >= 1440 ? -1 : 0;
  const fam = ((famMin % 1440) + 1440) % 1440;
  return {
    pktDay: B.DAYS[(((B.DAYS.indexOf(rowDay) + shift) % 7) + 7) % 7],
    shift,
    famTime: B.fmt12(String(Math.floor(fam / 60)).padStart(2, "0") + ":" + String(fam % 60).padStart(2, "0")),
  };
};
// v66: worked out once per data change (screens ask for the same day many times)
const llqaClassesOn = (date, teachers, students, dailyProgress) => {
  const ctx = LLQAApp.ctx;
  const n = (a) => (Array.isArray(a) ? a.length : -1);
  return llqaCachedFor(
    teachers,
    "cls:" + date,
    [students, dailyProgress, ctx.leaves, ctx.covers, ctx.calendar, n(teachers), n(students), n(dailyProgress), n(ctx.leaves), n(ctx.covers)],
    () => llqaClassesOnRaw(date, teachers, students, dailyProgress),
  );
};
const llqaClassesOnRaw = (date, teachers, students, dailyProgress) => {
  const B = LLQABooking;
  const wd = llqaWeekday(date);
  const ref = new Date(date + "T07:00:00Z"); // noon in Pakistan
  const byId = new Map((students || []).map((s) => [String(s.id), s]));
  const tById = new Map((teachers || []).map((t) => [String(t.id), t]));
  const dpx = llqaDpIndex(dailyProgress);
  const pkOff = B.offsetAt("Asia/Karachi", ref);
  const diffs = new Map();
  const holiday = llqaHolidayOn(date, "holiday");
  const out = [];
  B.eachBooked(teachers || [], (c) => {
    const cell = c.cell;
    const tz = B.timezoneFor(cell.country, cell.state);
    let pd = { pktDay: c.day, shift: 0, famTime: "" };
    if (tz) {
      if (!diffs.has(tz)) diffs.set(tz, pkOff - B.offsetAt(tz, ref));
      pd = llqaPktDay(c.day, c.slot, diffs.get(tz));
    }
    if (pd.pktDay !== wd) return;
    const stu =
      cell.sid != null && cell.sid !== ""
        ? byId.get(String(cell.sid))
        : (students || []).find((s) => B.sameStudent(cell, s));
    const entry = stu ? dpx.byKey.get(String(stu.id) + "|" + date) || null : null;
    // (v66: a scheduled leave counts on its dates before it starts)
    const onLeave =
      !!stu &&
      (stu.status === "leave"
        ? (!stu.lvFrom || stu.lvFrom <= date) && (!stu.lvTo || stu.lvTo >= date)
        : !!stu.lvPlanned && !!stu.lvFrom && stu.lvFrom <= date && (!stu.lvTo || stu.lvTo >= date));
    // v66: teacher on leave, a substitute (or class off) for this date, holidays.
    // A cover made for a leave that was later cancelled doesn't count; nor
    // does a substitute who is on leave that day too.
    const t = tById.get(String(c.teacherId)) || { id: c.teacherId, name: c.teacher };
    const tLeave = llqaLeaveOn(t, date);
    const rec = llqaCoverOn(date, c.teacherId, c.day, c.slot);
    const stale = !!rec && rec.leaveId != null && rec.leaveId !== "" && !(tLeave && String(tLeave.id) === String(rec.leaveId));
    const cover = stale ? null : rec;
    const hasSub = !!(cover && cover.coverId != null && cover.coverId !== "");
    const subAway = hasSub && !!llqaLeaveOn(tById.get(String(cover.coverId)) || { id: cover.coverId, name: cover.cover }, date);
    out.push({
      key: c.teacherId + "|" + c.day + "|" + c.slot,
      teacherId: c.teacherId,
      teacher: c.teacher,
      rowDay: c.day,
      slot: c.slot,
      min: llqaSlotMin(c.slot),
      cell,
      tz,
      famTime: pd.famTime,
      stu: stu || null,
      entry: entry || null,
      onLeave,
      quit: !!stu && stu.status === "quit",
      tLeave,
      cover,
      covered: hasSub && !subAway,
      subAway,
      off: !!(cover && cover.cancelled),
      kept: !!(cover && cover.keep),
      holiday,
      by: hasSub && !subAway ? cover.cover : c.teacher,
    });
  });
  out.sort((a, b) => a.min - b.min || String(a.teacher).localeCompare(String(b.teacher)));
  return out;
};
// What to show for one class on that date.
const llqaClassState = (it, date, nowMin) => {
  const today = llqaToday();
  if (it.entry) {
    const a = String(it.entry.attended || "").toLowerCase();
    return a === "absent"
      ? { k: "absent", text: "✗ Absent", col: c.danger }
      : a === "excused"
        ? { k: "excused", text: "Excused", col: c.textSec }
        : { k: "logged", text: "✓ " + (a === "late" ? "Late" : "Present"), col: c.success };
  }
  if (it.onLeave) return { k: "leave", text: "On leave", col: c.textSec };
  if (it.quit) return { k: "quit", text: "Quit — slot still booked", col: c.warn };
  // v66: holidays, class off, teacher on leave without a substitute
  if (it.holiday) return { k: "holiday", text: "🗓 " + (it.holiday.name || "Holiday"), col: c.textSec };
  if (it.off) return { k: "off", text: "Class off — teacher on leave", col: c.textSec };
  if (it.tLeave && !it.covered && !it.kept)
    return date < today
      ? { k: "noteacher", text: "Teacher was on leave", col: c.warn }
      : { k: "cover", text: it.subAway ? "⚠ Substitute on leave too" : "⚠ Needs cover", col: c.danger };
  if (date < today) return { k: "missing", text: "⚠ Not logged", col: c.danger };
  if (date > today) return { k: "upcoming", text: "Upcoming", col: c.textSec };
  const n = nowMin == null ? llqaNowPkMin() : nowMin;
  if (n < it.min - 10) {
    const d = it.min - n;
    return { k: "upcoming", text: "In " + (d >= 60 ? Math.floor(d / 60) + "h " : "") + (d % 60) + "m", col: c.accent };
  }
  if (n <= it.min + 40) return { k: "now", text: "● Now", col: c.success };
  return { k: "missing", text: "⚠ Not logged", col: c.danger };
};

/* ---------- waitlist ---------- */
const llqaDeptOk = (course, subjects) => (t) =>
  course !== "Subject"
    ? !t.department || t.department === "Quran" || t.department === "Both"
    : (t.department === "Subject" || t.department === "Both") &&
      (!(subjects || []).length || (subjects || []).some((s) => (t.subjects || []).includes(s)));
// Is the wanted time free now? (preferred teacher first, then anyone suitable)
const llqaWaitMatch = (w, teachers) => {
  const B = LLQABooking;
  const tz = w.tz || B.timezoneFor(w.country, w.state);
  const pk = tz ? B.toPkt(w.wantDay, w.wantTime, tz) : null;
  if (!pk) return { pk: null, tz, free: [], preferred: false };
  const subs = Array.isArray(w.specificSubject) ? w.specificSubject : [];
  const ok = llqaDeptOk(w.course, subs);
  const own = w.studentId != null && w.studentId !== "" ? { id: w.studentId, name: w.name, parent: w.parent } : null;
  const free = (teachers || [])
    .filter((t) => B.isActive(t) && ok(t) && B.slotInfo(t, pk.rowDay, pk.slot, own).state === "free")
    .map((t) => t.name);
  return { pk, tz, free, preferred: !!w.teacher && free.includes(w.teacher) };
};
const llqaWaitingFree = (waitlist, teachers) =>
  (waitlist || []).filter((w) => w && w.status === "waiting" && llqaWaitMatch(w, teachers).free.length > 0);
// After slots are freed: tell the admin about families who can now be booked.
const llqaWaitCheck = (beforeTeachers, afterTeachers) => {
  const list = LLQAApp.ctx.waitlist || [];
  if (!list.length) return [];
  const was = new Set(llqaWaitingFree(list, beforeTeachers).map((w) => w.id));
  const now = llqaWaitingFree(list, afterTeachers).filter((w) => !was.has(w.id));
  if (now.length)
    llqaToast({
      kind: "waitlist",
      key: "wait-" + now.map((w) => w.id).join(","),
      text:
        "⏳ A freed time suits " + now.length + " waiting famil" + (now.length === 1 ? "y" : "ies") + ": " +
        now.map((w) => w.name + " (" + w.wantDay + " " + LLQABooking.timeLabel(w.wantTime) + ")").join(", "),
    });
  return now;
};
// Add the form's family to the waitlist for one wanted time.
const llqaAddWaitlist = (pf, row, own) => {
  const set = LLQAApp.ctx.setWaitlist;
  if (typeof set !== "function") return "The waitlist isn't available here.";
  if (!String(pf.name || "").trim() || !String(pf.parent || "").trim())
    return "Enter the student's and parent's names first, then add them to the waitlist.";
  const B = LLQABooking;
  const tz = B.timezoneFor(pf.country, pf.state);
  const dup = (LLQAApp.ctx.waitlist || []).some(
    (w) =>
      w.status === "waiting" &&
      String(w.name).trim().toLowerCase() === String(pf.name).trim().toLowerCase() &&
      w.wantDay === row.day &&
      w.wantTime === row.time,
  );
  if (dup) return "⏳ " + pf.name + " is already on the waitlist for " + row.day + " " + B.timeLabel(row.time) + ".";
  const u = LLQAApp.ctx.user || {};
  set((prev) => [
    ...(prev || []),
    {
      id: "w_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      status: "waiting",
      name: String(pf.name).trim(),
      parent: String(pf.parent).trim(),
      phone: pf.phone || "",
      email: pf.email || "",
      country: pf.country || "USA",
      state: pf.state || "",
      tz: tz || "",
      age: pf.age || "",
      gender: pf.gender || "",
      course: pf.course || "Quran",
      specificSubject: pf.course === "Subject" && Array.isArray(pf.specificSubject) ? pf.specificSubject : [],
      wantDay: row.day,
      wantTime: row.time,
      teacher: row.teacher || "",
      studentId: own && own.id != null ? own.id : pf.editingId != null ? pf.editingId : null,
      notes: pf.notes || "",
      createdAt: new Date().toISOString(),
      createdBy: u.name || u.role || "",
    },
  ]);
  return "⏳ Added to the waitlist: " + row.day + " " + B.timeLabel(row.time) +
    ". It shows in Sales → Waitlist, and you'll be told the moment a teacher is free then.";
};
const llqaWaitDone = (id, studentId) => {
  const set = LLQAApp.ctx.setWaitlist;
  if (!id || typeof set !== "function") return;
  set((prev) =>
    (prev || []).map((w) =>
      w.id === id ? { ...w, status: "booked", studentId: studentId != null ? studentId : w.studentId, bookedAt: new Date().toISOString() } : w,
    ),
  );
};

/* ---------- clock changes ---------- */
// Next change within ~8 months, and the latest one in the last 30 days.
const llqaNextChange = (tz, from) => {
  const B = LLQABooking;
  let start = from || new Date();
  for (let i = 0; i < 4; i++) {
    const cc = B.clockChange(tz, start);
    if (cc) return cc;
    start = new Date(start.getTime() + 60 * 86400000);
  }
  return null;
};
const llqaRecentChange = (tz, now) => {
  const n = now || new Date();
  const cc = LLQABooking.clockChange(tz, new Date(n.getTime() - 30 * 86400000));
  return cc && cc.date.getTime() <= n.getTime() ? cc : null;
};
// Every booked class whose family time and Pakistan slot no longer match
// ("moved": a change already happened) or will stop matching at the next
// change ("upcoming"). Uses each student's saved class rows.
// v66: reused for 5 minutes while the students and Timetable are unchanged
const llqaClockReport = (students, teachers, now) =>
  now
    ? llqaClockReportRaw(students, teachers, now)
    : llqaCachedFor(
        teachers,
        "clock",
        [students, Array.isArray(students) ? students.length : -1, Array.isArray(teachers) ? teachers.length : -1, Math.floor(Date.now() / 300000)],
        () => llqaClockReportRaw(students, teachers),
      );
const llqaClockReportRaw = (students, teachers, now) => {
  const B = LLQABooking;
  const n = now || new Date();
  const ix = B.indexCells(teachers || []);
  const out = [];
  // v66: the next clock change and each family time's Pakistan slot are the
  // same for every student in a time zone — worked out once per zone / time
  const nextByTz = new Map();
  const pkMemo = new Map();
  const toPk = (day, time, tz, d) => {
    const k = day + "|" + time + "|" + tz + "|" + d.getTime();
    if (!pkMemo.has(k)) pkMemo.set(k, B.toPkt(day, time, tz, d));
    const v = pkMemo.get(k);
    return v ? { ...v } : v;
  };
  (students || []).forEach((s) => {
    if (!s || s.status === "quit") return;
    const tz = s.tz || B.timezoneFor(s.country, s.state);
    if (!tz || !Array.isArray(s.schedule) || !s.schedule.length) return;
    const cells = B.cellsFromIndex(ix, s);
    if (!cells.length) return;
    if (!nextByTz.has(tz)) nextByTz.set(tz, llqaNextChange(tz, n));
    const next = nextByTz.get(tz);
    const rows = [];
    s.schedule.forEach((r, ri) => {
      if (!r || !r.day || !r.time || !r.pktSlot) return;
      const cell = cells.find((c) => c.day === r.day && c.slot === r.pktSlot && (!r.teacher || c.teacher === r.teacher));
      if (!cell) return;
      const nowPk = toPk(r.day, r.time, tz, n);
      if (!nowPk) return;
      const t = (teachers || []).find((x) => x.id === cell.teacherId);
      if (nowPk.slot !== r.pktSlot) {
        const fam = B.pktDayOf(r.day, r.pktSlot, tz, n).famTime;
        const info = B.slotInfo(t, nowPk.rowDay, nowPk.slot, s);
        rows.push({ ri, row: r, cell, kind: "moved", needSlot: nowPk.slot, needPk: nowPk, famNow: fam, free: info.state === "free", why: B.reasonText(info) });
      } else if (next) {
        const after = toPk(r.day, r.time, tz, new Date(next.date.getTime() + 2 * 3600000));
        if (after && after.slot !== r.pktSlot) {
          const fam = B.pktDayOf(r.day, r.pktSlot, tz, new Date(next.date.getTime() + 2 * 3600000)).famTime;
          const info = B.slotInfo(t, after.rowDay, after.slot, s);
          rows.push({ ri, row: r, cell, kind: "upcoming", date: next.date, needSlot: after.slot, needPk: after, famAfter: fam, free: info.state === "free", why: B.reasonText(info) });
        }
      }
    });
    if (rows.length) out.push({ s, tz, zone: llqaZoneLabel(tz), next, rows });
  });
  return out;
};

/* ---------- clock changes: fix everything in one step (v65.1) ---------- */
// Moves every class whose family time drifted (a change already happened)
// to the Pakistan slot that keeps the family's usual time. All students move
// together, so chains work (A moves into B's old slot while B moves on). A
// student moves only if all their drifted classes can; the rest are left for
// a decision (the new slot is taken, outside the shift, or wanted twice).
const llqaClockFix = (entries, teachers) => {
  const B = LLQABooking;
  let cand = (entries || [])
    .map((e) => ({ e, rows: (e.rows || []).filter((x) => x.kind === "moved") }))
    .filter((x) => x.rows.length);
  const skipped = [];
  let freed = teachers || [];
  for (let round = 0; round < 200; round++) {
    freed = B.release(teachers || [], cand.flatMap((x) => x.rows.map((r) => r.cell)));
    const want = new Map();
    const bad = new Map();
    cand.forEach((x, i) => {
      x.rows.forEach((r) => {
        const t = freed.find((tt) => tt.id === r.cell.teacherId);
        const info = B.slotInfo(t, r.needPk.rowDay, r.needPk.slot);
        const k = r.cell.teacherId + "|" + r.needPk.rowDay + "|" + r.needPk.slot;
        if (info.state !== "free") {
          if (!bad.has(i)) bad.set(i, B.fmt12(r.needSlot) + " PKT is " + B.reasonText(info));
        } else if (want.has(k) && want.get(k) !== i) {
          const why = "two classes need " + B.fmt12(r.needSlot) + " PKT with " + r.cell.teacher;
          bad.set(i, why);
          bad.set(want.get(k), why);
        } else want.set(k, i);
      });
    });
    if (!bad.size) break;
    cand.forEach((x, i) => {
      if (bad.has(i)) skipped.push({ s: x.e.s, why: bad.get(i) });
    });
    cand = cand.filter((_, i) => !bad.has(i));
  }
  const rowsAll = cand.flatMap((x) => x.rows);
  const next = !rowsAll.length
    ? teachers || []
    : freed.map((t) => {
        const mine = rowsAll.filter((r) => r.cell.teacherId === t.id);
        if (!mine.length) return t;
        const sch = JSON.parse(JSON.stringify(t._ttSchedule || {}));
        mine.forEach((r) => {
          if (!sch[r.needPk.rowDay]) sch[r.needPk.rowDay] = {};
          sch[r.needPk.rowDay][r.needPk.slot] = { ...r.cell.cell }; // same class, new Pakistan slot
        });
        return { ...t, _ttSchedule: sch };
      });
  const moved = cand.map((x) => ({
    s: x.e.s,
    zone: x.e.zone,
    rows: x.rows.map((r) => ({
      ri: r.ri,
      day: r.row.day,
      time: r.row.time,
      teacherId: r.cell.teacherId,
      teacher: r.cell.teacher,
      from: r.row.pktSlot,
      fromDay: r.row.pktDay || "",
      to: r.needPk.slot,
      toDay: r.needPk.pktDay,
    })),
  }));
  return { teachers: next, moved, skipped };
};
const llqaRunSig = (run) =>
  run ? JSON.stringify([(run.moved || []).map((m) => m.sid), (run.skipped || []).map((k) => k.sid + ":" + k.why)]) : "";
// Applies the fix and keeps a record of it (settings/automation.lastRun).
const llqaClockApply = (entries, opt) => {
  const ctx = LLQAApp.ctx;
  const o = opt || {};
  const before = ctx.teachers || [];
  const res = llqaClockFix(entries, before);
  if (res.moved.length) {
    ctx.setTeachers(res.teachers);
    const byId = new Map(res.moved.map((m) => [String(m.s.id), m]));
    const fixSched = (x) => {
      const m = byId.get(String(x.id));
      if (!m || !Array.isArray(x.schedule)) return x;
      return {
        ...x,
        schedule: x.schedule.map((r, i) => {
          const mv = m.rows.find((y) => y.ri === i);
          return mv ? { ...r, pktSlot: mv.to, pktDay: mv.toDay } : r;
        }),
      };
    };
    ctx.setStudents((prev) => (prev || []).map(fixSched));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster(res.moved.map((m) => fixSched(m.s)));
    llqaWaitCheck(before, res.teachers);
  }
  const u = ctx.user || {};
  const run = {
    at: new Date().toISOString(),
    by: u.name || u.role || "",
    auto: !!o.auto,
    moved: res.moved.map((m) => ({ sid: m.s.id, name: m.s.name || "", zone: m.zone || "", rows: m.rows })),
    skipped: res.skipped.map((k) => ({ sid: k.s.id, name: k.s.name || "", why: k.why })),
  };
  const last = ctx.automation && ctx.automation.lastRun;
  // nothing new (same students still waiting for a decision): don't re-save
  if (!run.moved.length && llqaRunSig(run) === llqaRunSig(last && { moved: [], skipped: last.skipped })) return { ...run, same: true };
  if ((run.moved.length || run.skipped.length) && typeof ctx.setAutomation === "function")
    ctx.setAutomation({ ...(ctx.automation || {}), lastRun: run });
  return run;
};
const llqaRunText = (run) => {
  if (!run) return "";
  const n = (run.moved || []).reduce((a, m) => a + m.rows.length, 0);
  const zones = [...new Set((run.moved || []).map((m) => m.zone).filter(Boolean))].join(", ");
  return (
    (n ? "Moved " + n + " class" + (n === 1 ? "" : "es") + " for " + run.moved.length + " student" + (run.moved.length === 1 ? "" : "s") + (zones ? " (" + zones + ")" : "") + " so families keep their usual time." : "No class could move by itself.") +
    ((run.skipped || []).length ? " " + run.skipped.length + " need a decision (the new time is taken)." : "")
  );
};
// One WhatsApp per teacher listing their moved classes (old → new PKT).
const llqaTeacherMoveItems = (run) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const byT = new Map();
  (run && run.moved ? run.moved : []).forEach((m) =>
    m.rows.forEach((r) => {
      const k = String(r.teacherId);
      if (!byT.has(k)) byT.set(k, []);
      byT.get(k).push("• " + m.name + " (" + r.day + " " + B.timeLabel(r.time) + " family time): " + (r.fromDay ? r.fromDay + " " : "") + B.fmt12(r.from) + " → " + (r.toDay ? r.toDay + " " : "") + B.fmt12(r.to) + " PKT");
    }),
  );
  return [...byT.entries()].map(([tid, lines]) => {
    const t = (ctx.teachers || []).find((x) => String(x.id) === tid) || {};
    return {
      student: { name: t.name || "Teacher", parent: t.name || "", phone: t.phone || "", country: "Pakistan" },
      template: "teacherMoves",
      extra: { name: t.name || "", moves: lines.join("\n") },
    };
  });
};
const llqaFamilyKeptItems = (run) => (run && run.moved ? run.moved : []).map((m) => ({ studentId: m.sid, template: "clockKept" }));
// Automatic fixing (on unless turned off): only for the admin side, only on
// cloud data fully loaded with nothing waiting to send, and only when there
// is something new to do.
const llqaClockAutoRun = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage()) return null;
  if ((ctx.automation || {}).clockAuto === false) return null;
  try {
    if (typeof LLQACloud !== "undefined" && LLQACloud.ready && (!LLQACloud.ready("students") || !LLQACloud.ready("teachers") || !LLQACloud.ready("doc:settings/automation"))) return null;
    const st = typeof LLQASync !== "undefined" && LLQASync.get ? LLQASync.get() : null;
    if (st && st.mode === "cloud" && (st.pending || st.sending)) return null;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
  } catch (e) {
    return null;
  }
  const rep = llqaClockReport(ctx.students, ctx.teachers).filter((r) => r.rows.some((x) => x.kind === "moved"));
  if (!rep.length) return null;
  const run = llqaClockApply(rep, { auto: true });
  if (run && !run.same && (run.moved.length || run.skipped.length))
    llqaToast({ kind: "clockFixed", key: "clockFixed", run, text: "🕐 Clocks changed. " + llqaRunText(run) });
  return run;
};
// A week before a change: remind the admin once per session.
const llqaClockSoon = (now) => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage()) return null;
  const n = now || new Date();
  const soon = llqaClockReport(ctx.students, ctx.teachers, n).filter(
    (r) => r.next && r.rows.some((x) => x.kind === "upcoming") && r.next.date.getTime() - n.getTime() < 7 * 86400000,
  );
  if (!soon.length) return null;
  const first = soon.map((r) => r.next.date).sort((a, b) => a - b)[0];
  const zones = [...new Set(soon.map((r) => r.zone))].join(", ");
  const auto = (ctx.automation || {}).clockAuto !== false;
  return {
    kind: "clockSoon",
    key: "clockSoon",
    text:
      "🕐 Clocks change on " + first.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " (" + zones + "): " +
      soon.length + " student" + (soon.length === 1 ? "" : "s") + " affected. " +
      (auto ? "Automatic fixing is on — their classes move after the change so families keep their time." : "Automatic fixing is off — fix them in Sales → Clock Changes after the change."),
  };
};

/* ============================================================
   v65 — Part 2: pop-ups (message, send queue, reschedule, convert,
   quit, log class), notices, and the Add Student enrollment choice.
   ============================================================ */
const llqaPill = (text, col, bg, key) =>
  React.createElement(
    "span",
    {
      key,
      style: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        color: col || c.textSec,
        background: bg || c.bgDeep,
        border: "1px solid " + (col || c.border) + "33",
        whiteSpace: "nowrap",
      },
    },
    text,
  );
const llqaMini = (label, onClick, opt) => {
  const o = opt || {};
  const col = o.tone === "danger" ? c.danger : o.tone === "success" ? c.success : o.tone === "warn" ? c.warn : o.tone === "accent" ? c.accent : c.textSec;
  return React.createElement(
    "button",
    {
      key: o.key || label,
      type: "button",
      title: o.title || "",
      disabled: !!o.disabled,
      onClick: (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!o.disabled) onClick();
      },
      style: {
        padding: o.big ? "8px 14px" : "5px 9px",
        borderRadius: 7,
        border: "1px solid " + (o.solid ? "transparent" : col + "55"),
        background: o.solid ? col : "transparent",
        color: o.solid ? "#fff" : col,
        fontSize: o.big ? 12 : 11,
        fontWeight: 700,
        cursor: o.disabled ? "not-allowed" : "pointer",
        opacity: o.disabled ? 0.45 : 1,
        whiteSpace: "nowrap",
      },
    },
    label,
  );
};
const llqaShell = (title, sub, body, footer, opt) => {
  const o = opt || {};
  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: o.z || 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(4px)",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(" + c.bgCard + ", " + c.bgCard + "), " + c.bg,
          border: "1px solid " + c.border,
          borderRadius: 14,
          padding: 22,
          width: o.width || 540,
          maxWidth: "94vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: c.shadow3d,
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 } },
        React.createElement(
          "div",
          null,
          React.createElement("h3", { style: { color: c.text, fontSize: 16, margin: 0 } }, title),
          sub ? React.createElement("div", { style: { color: c.textSec, fontSize: 11, marginTop: 3 } }, sub) : null,
        ),
        o.onClose
          ? React.createElement(
              "button",
              { type: "button", onClick: o.onClose, title: "Close", style: { background: "none", border: "none", color: c.textSec, cursor: "pointer", fontSize: 18, lineHeight: 1 } },
              "✕",
            )
          : null,
      ),
      body,
      footer
        ? React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14, flexWrap: "wrap" } }, footer)
        : null,
    ),
  );
};
const llqaTextStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "var(--input-bg, " + c.bgDeep + ")",
  border: "1px solid " + c.border,
  borderRadius: 8,
  color: c.text,
  fontSize: 12,
  lineHeight: 1.5,
  fontFamily: "inherit",
  resize: "vertical",
};
const llqaFindStudent = (id) =>
  id == null
    ? null
    : (LLQAApp.ctx.students || []).find((x) => String(x.id) === String(id)) ||
      (LLQAApp.ctx.salesMasterData || []).find((x) => String(x.id) === String(id)) ||
      null;

/* ---------- one message ---------- */
const LLQAMessageModal = ({ studentId, student, template, extra, msgKey, onSent, onClose }) => {
  const ctx = LLQAApp.ctx;
  const s = student || llqaFindStudent(studentId) || {};
  const first = template || llqaSuggest(s, ctx.messageLog);
  const [tpl, setTpl] = useState(first);
  const [text, setText] = useState(() => llqaFill(llqaTplText(first, ctx.messaging), s, extra, ctx.messaging));
  const [phone, setPhone] = useState(s.phone || "");
  const [note, setNote] = useState("");
  const digits = llqaPhone(phone, s.country);
  const pick = (k) => {
    setTpl(k);
    setText(llqaFill(llqaTplText(k, ctx.messaging), s, extra, ctx.messaging));
  };
  // v66: an Autopilot message carries its key, so it isn't suggested again
  const meta = {
    studentId: s.id != null ? s.id : null,
    name: s.name || "",
    template: tpl,
    ...(extra && extra.waitId ? { waitId: extra.waitId } : {}),
    ...(msgKey && tpl === first ? { key: msgKey } : {}),
  };
  const last = s.id != null ? llqaLastMsg(ctx.messageLog, s.id) : null;
  const copy = () => {
    try {
      navigator.clipboard.writeText(text);
      setNote("✓ Message copied");
    } catch (e) {
      setNote("Copy not available — select the text and copy it.");
    }
  };
  return llqaShell(
    "💬 Message — " + (s.parent || s.name || "family"),
    (s.name ? "Student: " + s.name + " · " : "") + (last ? "Last message: " + llqaTplName(last.template) + " " + llqaAgo(last.at) : "No message sent from the CRM yet"),
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } },
        LLQA_TEMPLATES.filter((x) => !x[3] || x[0] === tpl).map(([k, name]) =>
          llqaMini(name, () => pick(k), { key: k, tone: tpl === k ? "accent" : undefined, solid: tpl === k }),
        ),
      ),
      React.createElement(Inp, {
        label: "WhatsApp / phone number",
        value: phone,
        onChange: setPhone,
        placeholder: "e.g. +1 555 010 1234",
      }),
      React.createElement(
        "div",
        { style: { fontSize: 11, marginTop: -6, marginBottom: 10, color: digits ? c.success : c.danger } },
        digits
          ? "✓ Will message +" + digits
          : phone
            ? "⚠ Can't tell the country code — type the number with + and the country code."
            : "⚠ No number saved for this family.",
      ),
      React.createElement("textarea", {
        value: text,
        onChange: (e) => setText(e.target.value),
        rows: 9,
        style: llqaTextStyle,
      }),
      note ? React.createElement("div", { style: { color: c.success, fontSize: 11, marginTop: 6 } }, note) : null,
      React.createElement(
        "div",
        { style: { color: c.textMuted, fontSize: 10, marginTop: 6 } },
        "WhatsApp opens with this message ready — you press Send there. Each message is recorded in Sales → Contacts.",
      ),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("📋 Copy", copy, { key: "cp", big: true }),
      llqaMini("📞 Call", () => llqaCall(digits, meta), { key: "call", big: true, disabled: !digits }),
      llqaMini("💬 Open WhatsApp", () => {
        if (llqaWhatsApp(digits, text, meta)) {
          if (onSent) onSent(text);
          onClose();
        }
      }, { key: "wa", big: true, solid: true, tone: "success", disabled: !digits || !text.trim() }),
    ],
    { onClose, width: 600 },
  );
};

/* ---------- many messages, one click each ---------- */
const LLQASendQueue = ({ items, title, onClose }) => {
  const ctx = LLQAApp.ctx;
  const list = items || [];
  const [i, setI] = useState(0);
  const [opened, setOpened] = useState(0);
  const [edit, setEdit] = useState({});
  const it = list[i];
  if (!it)
    return llqaShell(
      "✓ Done",
      title || "",
      React.createElement("div", { style: { color: c.text, fontSize: 13 } }, opened + " of " + list.length + " WhatsApp message" + (list.length === 1 ? "" : "s") + " opened."),
      [llqaMini("Close", onClose, { key: "c", big: true, solid: true, tone: "accent" })],
      { onClose },
    );
  const s = it.student || llqaFindStudent(it.studentId) || {};
  const text = edit[i] != null ? edit[i] : llqaFill(llqaTplText(it.template, ctx.messaging), s, it.extra, ctx.messaging);
  const digits = llqaPhone(s.phone, s.country);
  const next = () => setI(i + 1);
  return llqaShell(
    "💬 " + (title || "Send messages") + " — " + (i + 1) + " of " + list.length,
    [s.parent, s.name && s.name !== s.parent ? s.name : "", llqaTplName(it.template)].filter(Boolean).join(" · "),
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { fontSize: 11, marginBottom: 8, color: digits ? c.success : c.danger } },
        digits ? "To +" + digits : "⚠ No usable number for this family — skip, or fix the number in their record.",
      ),
      React.createElement("textarea", {
        value: text,
        onChange: (e) => setEdit({ ...edit, [i]: e.target.value }),
        rows: 8,
        style: llqaTextStyle,
      }),
    ),
    [
      llqaMini("Stop", onClose, { key: "x", big: true }),
      llqaMini("Skip →", next, { key: "s", big: true }),
      // v66: Autopilot items can be marked done when sent another way
      it.key
        ? llqaMini("✓ Already sent", () => {
            llqaPilotDone({ ...it, student: s });
            next();
          }, { key: "d", big: true, title: "Sent another way — don't suggest it again" })
        : null,
      llqaMini("💬 Open WhatsApp & next", () => {
        if (llqaWhatsApp(digits, text, { studentId: s.id != null ? s.id : null, name: s.name || "", template: it.template, ...(it.key ? { key: it.key } : {}) })) setOpened(opened + 1);
        next();
      }, { key: "go", big: true, solid: true, tone: "success", disabled: !digits }),
    ],
    { onClose, width: 600 },
  );
};

/* ---------- reschedule: move classes in one step ---------- */
const LLQARescheduleModal = ({ studentId, want, onDone, onClose }) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const s = llqaFindStudent(studentId);
  const [pf, setPf] = useState(() => {
    const st = s || {};
    const rows = B.scheduleOf(st)
      .filter((r) => r.day && r.time)
      .map((r, k) => ({ id: k + 1, day: r.day, time: r.time, teacher: r.teacher && r.teacher !== "Unassigned" ? r.teacher : "" }));
    return {
      name: st.name, parent: st.parent, phone: st.phone, email: st.email, age: st.age, gender: st.gender,
      country: st.country, state: st.state, course: st.course,
      specificSubject: Array.isArray(st.specificSubject) ? st.specificSubject : [],
      notes: st.notes,
      schedule: rows.length ? rows : [{ id: 1, day: "Mon", time: "", teacher: "" }],
    };
  });
  if (!s)
    return llqaShell("Student not found", "", React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "This student is no longer in the list."), [llqaMini("Close", onClose, { big: true })], { onClose });
  const save = () => {
    const teachers = ctx.teachers || [];
    const isQ = pf.course !== "Subject";
    const rows = Array.isArray(pf.schedule) ? pf.schedule : [];
    const pl = B.plan({ rows, country: pf.country, state: pf.state, teachers, isQuran: isQ, master: isQ ? (rows[0] && rows[0].teacher) || "" : "", own: s });
    if (pl.problems.length) {
      alert("Not saved — please fix the classes first:\n\n• " + pl.problems.join("\n• "));
      return;
    }
    if (!pl.items.length && !confirm("No class time is chosen. Remove all of " + s.name + "'s classes from the Timetable?")) return;
    const oldCells = B.studentCells(teachers, s);
    const res = B.rebook(teachers, oldCells, pl.items, { ...s, sub: isQ ? "" : llqaSubjects(s) || "Subject" });
    if (!res.ok) {
      alert("Not saved — the Timetable changed while this was open:\n\n• " + res.problems.join("\n• "));
      return;
    }
    const fields = {
      schedule: pl.items.map((it) => ({ day: it.day, time: it.time, teacher: it.teacher, pktDay: it.pktDay, pktSlot: it.slot })),
      time: pl.items.map((it) => it.day + "|" + it.time).join(", "),
      teacher: pl.items.length ? pl.items[0].teacher : s.teacher,
      hoursPerWeek: pl.items.length ? String(pl.items.length * 0.5) : "",
      tz: pl.tz || s.tz || "",
    };
    ctx.setTeachers(res.teachers);
    ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
    llqaWaitCheck(teachers, res.teachers);
    if (onDone) onDone({ ...s, ...fields });
    onClose();
    llqaToast({
      kind: "moved",
      key: "moved-" + s.id,
      student: { ...s, ...fields },
      studentId: s.id,
      text:
        "✓ " + s.name + "'s classes updated: " +
        (res.added.length ? res.added.length + " booked" : "none booked") +
        (res.freed.length ? ", " + res.freed.length + " freed" : "") + ". Tell the family the new times?",
    });
  };
  const cur = llqaClasses(s);
  return llqaShell(
    "📅 Change classes — " + s.name,
    "The student's current classes count as free here, so you can keep or move any of them. Saving frees the old slots and books the new ones in one step.",
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { background: c.bgDeep, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: c.textSec } },
        React.createElement("b", { style: { color: c.text } }, "Now: "),
        cur.length ? cur.map((r) => r.day + " " + r.local + (r.pkt ? " → " + r.pkt : "") + " · " + r.teacher).join("  |  ") : "no classes booked",
        want ? React.createElement("div", { style: { marginTop: 4, color: c.accent } }, "Family asked for: " + want.day + " " + B.timeLabel(want.time)) : null,
      ),
      React.createElement(LLQAScheduleBuilder, { pf, setPf, appTeachers: ctx.teachers || [], own: s }),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("✓ Save new classes", save, { key: "ok", big: true, solid: true, tone: "accent" }),
    ],
    { onClose, width: 720 },
  );
};

/* ---------- trial → paid ---------- */
const LLQAConvertModal = ({ studentId, onClose }) => {
  const ctx = LLQAApp.ctx;
  const s = llqaFindStudent(studentId) || {};
  const [f, setF] = useState({
    fee_amount: s.fee_amount || "",
    currency: s.currency || "USD",
    classType: !s.classType || s.classType === "Trial" ? "Regular" : s.classType,
    received: false,
    gateway: "Bank Transfer",
  });
  const save = () => {
    const fields = {
      fee: "paid",
      trial: "",
      classType: f.classType,
      fee_amount: f.fee_amount,
      currency: f.currency,
      convertedAt: s.convertedAt || todayPK(),
      trialOutcome: "converted",
    };
    ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
    // v66: the first month's payment goes into the fee cycle straight away
    const paidNow = f.received && Number(f.fee_amount) > 0
      ? llqaRecordPayment({ ...s, ...fields }, { amount: f.fee_amount, currency: f.currency, gateway: f.gateway, month: fields.convertedAt.slice(0, 7) })
      : null;
    onClose();
    llqaToast({ kind: "info", ttl: 6000, text: "✓ " + s.name + " is now a paid student." + (paidNow ? " First month's fee recorded (" + paidNow.amount + " " + paidNow.currency + ")." : "") });
  };
  const info = llqaTrialInfo(s);
  return llqaShell(
    "✓ Enroll " + (s.name || "") + " as paid",
    "Trial: " + info.done + " of " + info.target + " classes" + (info.start ? " · started " + info.start : ""),
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "Fee amount", type: "number", value: f.fee_amount, onChange: (v) => setF({ ...f, fee_amount: v }) }),
        React.createElement(Inp, { label: "Currency", value: f.currency, onChange: (v) => setF({ ...f, currency: v }), options: ["USD", "CAD", "GBP", "EUR", "AED", "PKR"] }),
        React.createElement(Inp, { label: "Class type", value: f.classType, onChange: (v) => setF({ ...f, classType: v }), options: ["Regular", "Premium", "Saudi", "Group"] }),
      ),
      React.createElement(
        "label",
        { style: { display: "flex", gap: 8, alignItems: "center", color: c.text, fontSize: 12, cursor: "pointer", marginTop: 2 } },
        React.createElement("input", { type: "checkbox", checked: f.received, onChange: (e) => setF({ ...f, received: e.target.checked }) }),
        "First month's fee received now (records the payment in the fee cycle)",
      ),
      f.received
        ? React.createElement("div", { style: { maxWidth: 240, marginTop: 8 } },
            React.createElement(Inp, { label: "Paid by", value: f.gateway, onChange: (v) => setF({ ...f, gateway: v }), options: LLQA_GATEWAYS }))
        : React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 6 } }, "The monthly fee will be due on day " + llqaBillDay({ ...s, convertedAt: s.convertedAt || todayPK() }) + " of each month (change it in Sales → Fee Cycle)."),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("✓ Enroll as paid", save, { key: "ok", big: true, solid: true, tone: "success" }),
    ],
    { onClose, width: 520 },
  );
};

/* ---------- quit (frees the Timetable slots) ---------- */
const LLQA_QUIT_REASONS = ["No response", "Fee / price", "Class timing", "Not interested", "Moved to another academy", "Other"];
const LLQAQuitModal = ({ studentId, onClose }) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const s = llqaFindStudent(studentId) || {};
  const cells = B.studentCells(ctx.teachers || [], s);
  const [f, setF] = useState({ reason: "No response", note: "", free: cells.length > 0 });
  const save = () => {
    const why = f.reason + (f.note.trim() ? " — " + f.note.trim() : "");
    const fields = {
      status: "quit",
      qDate: todayPK(),
      qReason: why,
      trialOutcome: llqaInTrial(s) ? "quit" : s.trialOutcome || "",
      notes: s.notes ? s.notes + " | Quit: " + why : "Quit: " + why,
    };
    ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
    if (f.free && cells.length) {
      const next = B.release(ctx.teachers || [], cells);
      ctx.setTeachers(next);
      llqaWaitCheck(ctx.teachers || [], next);
    }
    onClose();
    llqaToast({ kind: "info", ttl: 6000, text: "Marked " + s.name + " as quit" + (f.free && cells.length ? " · " + cells.length + " slot(s) freed" : "") + "." });
  };
  return llqaShell(
    "✕ Mark " + (s.name || "") + " as quit",
    cells.length ? "Booked: " + B.cellsText(cells).split("\n").join(" · ") : "No Timetable classes booked.",
    React.createElement(
      "div",
      null,
      React.createElement(Inp, { label: "Reason", value: f.reason, onChange: (v) => setF({ ...f, reason: v }), options: LLQA_QUIT_REASONS }),
      React.createElement(Inp, { label: "Note (optional)", value: f.note, onChange: (v) => setF({ ...f, note: v }) }),
      cells.length
        ? React.createElement(
            "label",
            { style: { display: "flex", gap: 8, alignItems: "center", color: c.text, fontSize: 12, cursor: "pointer" } },
            React.createElement("input", { type: "checkbox", checked: f.free, onChange: (e) => setF({ ...f, free: e.target.checked }) }),
            "Free the " + cells.length + " Timetable slot(s) so other students can book them",
          )
        : null,
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("Mark as quit", save, { key: "ok", big: true, solid: true, tone: "danger" }),
    ],
    { onClose, width: 520 },
  );
};

/* ---------- log a class (from Today's classes) ---------- */
const LLQALogHost = ({ info, onClose }) => {
  const ctx = LLQAApp.ctx;
  const s = llqaFindStudent(info.studentId);
  const [form, setForm] = useState({
    attended: "present",
    lesson: (s && s.lastLesson) || "",
    pages: "",
    behavior: (s && s.lB) || "Good",
    performance: (s && s.lP) || "Satisfactory",
    homework: (s && s.lH) || "Not Assigned",
    recitation: (s && s.lR) || "N/A",
    tajweed: (s && s.lT) || "N/A",
    notes: "",
  });
  return React.createElement(LLQALogClassModal, {
    info,
    form,
    setForm,
    students: ctx.students,
    dailyProgress: ctx.dailyProgress,
    onClose,
    onSave: () => {
      const err = llqaLogClass({
        students: ctx.students,
        setStudents: ctx.setStudents,
        dailyProgress: ctx.dailyProgress,
        setDailyProgress: ctx.setDailyProgress,
        studentId: info.studentId,
        teacherName: info.teacherName,
        form,
        date: info.date,
      });
      if (err) {
        alert(err);
        return;
      }
      onClose();
    },
  });
};

/* ---------- notices (bottom-right) ---------- */
// v66: a new notice shows for 12 seconds, then folds into the "🔔 N notices"
// button (so notices never sit on top of the page's buttons); nothing is lost.
const LLQA_FRESH_MS = 12000;
const LLQAToasts = () => {
  const now = Date.now();
  const all = LLQAUI.toasts;
  const fresh = all.filter((t) => now - (t.at || 0) < LLQA_FRESH_MS);
  const list = LLQAUI.open ? all : fresh.slice(-2);
  const rest = all.length - list.length;
  useEffect(() => {
    const waits = fresh.map((t) => LLQA_FRESH_MS - (now - (t.at || 0))).filter((ms) => ms > 0);
    if (!waits.length) return undefined;
    const tm = setTimeout(llqaUIChanged, Math.min(...waits) + 60);
    return () => clearTimeout(tm);
  });
  return React.createElement(
    "div",
    { style: { position: "fixed", right: 16, bottom: 16, zIndex: 1250, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, width: 360, maxWidth: "calc(100vw - 32px)", pointerEvents: "none" } },
    list.map((t) =>
      React.createElement(
        "div",
        {
          key: t.id,
          style: {
            background: "linear-gradient(" + c.bgCard + ", " + c.bgCard + "), " + c.bg,
            border: "1px solid " + c.accent + "55",
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: c.shadow3d,
            width: "100%",
            boxSizing: "border-box",
            pointerEvents: "auto",
          },
        },
        React.createElement("div", { style: { fontSize: 12, color: c.text, lineHeight: 1.45, marginBottom: 8 } }, t.text),
        React.createElement(
          "div",
          { style: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" } },
          t.kind === "trialComplete"
            ? [
                llqaMini("💬 Fee message", () => {
                  llqaDismiss(t.id);
                  llqaOpen("message", { studentId: t.studentId, template: "trialComplete" });
                }, { key: "m", tone: "success" }),
                llqaMini("Trial Pipeline", () => {
                  llqaDismiss(t.id);
                  llqaGo("sales", "pipeline");
                }, { key: "p", tone: "accent" }),
              ]
            : null,
          t.kind === "welcome"
            ? llqaMini(t.template === "portalIntro" ? "💬 Send portal intro" : "💬 Send welcome", () => {
                llqaDismiss(t.id);
                llqaOpen("message", {
                  studentId: t.studentId,
                  student: t.student,
                  template: t.template || "welcome",
                  msgKey: (t.template === "portalIntro" ? "intro:" : "welcome:") + t.studentId,
                });
              }, { key: "w", tone: "success" })
            : null,
          t.kind === "moved"
            ? llqaMini("💬 Tell the family", () => {
                llqaDismiss(t.id);
                llqaOpen("message", { studentId: t.studentId, student: t.student, template: "newTimes" });
              }, { key: "mv", tone: "success" })
            : null,
          t.kind === "clockFixed"
            ? [
                (t.run && t.run.moved && t.run.moved.length)
                  ? llqaMini("💬 Tell teachers", () => {
                      llqaDismiss(t.id);
                      llqaOpen("queue", { title: "Moved classes — teachers", items: llqaTeacherMoveItems(t.run) });
                    }, { key: "tt", tone: "success" })
                  : null,
                llqaMini("Review", () => {
                  llqaDismiss(t.id);
                  llqaGo("sales", "clock");
                }, { key: "rv", tone: "accent" }),
              ]
            : null,
          t.kind === "clockSoon"
            ? llqaMini("Clock Changes", () => {
                llqaDismiss(t.id);
                llqaGo("sales", "clock");
              }, { key: "cs", tone: "accent" })
            : null,
          t.kind === "waitlist"
            ? llqaMini("Open Waitlist", () => {
                llqaDismiss(t.id);
                llqaGo("sales", "waitlist");
              }, { key: "wl", tone: "accent" })
            : null,
          // v66
          t.kind === "covers"
            ? [
                llqaMini("💬 Tell substitutes", () => {
                  llqaDismiss(t.id);
                  llqaOpen("queue", { title: "Cover classes — substitutes", items: llqaCoverTeacherItems(t.covers) });
                }, { key: "ts", tone: "success" }),
                llqaMini("💬 Tell families", () => {
                  llqaDismiss(t.id);
                  llqaOpen("queue", { title: "Teacher on leave — families", items: llqaCoverFamilyItems(t.covers) });
                }, { key: "tf", tone: "success" }),
                llqaMini("Review", () => {
                  llqaDismiss(t.id);
                  llqaGo("timetable", "leavecover");
                }, { key: "rv", tone: "accent" }),
              ]
            : null,
          t.kind === "leaveAsk"
            ? [
                llqaMini("✓ Approve", () => {
                  llqaDismiss(t.id);
                  llqaApproveTeacherLeave(t.leaveId);
                }, { key: "ap", tone: "success" }),
                llqaMini("Leave Mgmt", () => {
                  llqaDismiss(t.id);
                  llqaGo("teachers", "leave");
                }, { key: "lm", tone: "accent" }),
              ]
            : null,
          t.kind === "leaveCover"
            ? llqaMini("Leave Cover", () => {
                llqaDismiss(t.id);
                llqaGo("timetable", "leavecover");
              }, { key: "lc", tone: "accent" })
            : null,
          t.kind === "fees"
            ? llqaMini("Fee Cycle", () => {
                llqaDismiss(t.id);
                llqaGo("sales", "fees");
              }, { key: "fc", tone: "accent" })
            : null,
          t.kind === "request" || t.kind === "decision"
            ? llqaMini("Open Requests", () => {
                llqaDismiss(t.id);
                llqaGo("sales", "requests");
              }, { key: "rq", tone: "accent" })
            : null,
          t.kind === "pilot"
            ? llqaMini("Open Autopilot", () => {
                llqaDismiss(t.id);
                llqaGo("sales", "autopilot");
              }, { key: "ap", tone: "accent" })
            : null,
          t.kind === "leaveEnded"
            ? [
                llqaMini("✓ Back to active", () => {
                  llqaDismiss(t.id);
                  llqaResumeStudents(t.ids);
                }, { key: "ra", tone: "success" }),
                llqaMini("Students", () => {
                  llqaDismiss(t.id);
                  llqaGo("students");
                }, { key: "st", tone: "accent" }),
              ]
            : null,
          llqaMini("✕", () => llqaDismiss(t.id), { key: "x", title: "Dismiss" }),
        ),
      ),
    ),
    rest > 0 || (LLQAUI.open && all.length)
      ? React.createElement(
          "button",
          {
            key: "bell",
            type: "button",
            onClick: () => {
              LLQAUI.open = !LLQAUI.open;
              llqaUIChanged();
            },
            style: {
              pointerEvents: "auto",
              padding: "7px 12px",
              borderRadius: 18,
              border: "1px solid " + c.accent + "88",
              background: c.bgCard,
              color: c.accent,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: c.shadow3d,
            },
          },
          LLQAUI.open ? "Hide notices" : "🔔 " + rest + " notice" + (rest === 1 ? "" : "s"),
        )
      : null,
  );
};

/* ---------- automatic work while the CRM is open (admin side) ---------- */
// Each job waits while earlier changes are still being saved, so when one job
// saves something the others run on the next check (a few seconds later).
// Returns true when a quick re-check is worth it.
const llqaClockTick = (state) => {
  let again = false;
  const job = (fn) => {
    try {
      if (fn()) again = true;
    } catch (e) {}
  };
  job(() => {
    const run = llqaClockAutoRun();
    return run && !run.same && ((run.moved || []).length || (run.skipped || []).length);
  });
  try {
    if (!state.soon) {
      const soon = llqaClockSoon();
      if (soon) {
        state.soon = true;
        llqaToast(soon);
      }
    }
  } catch (e) {}
  // v66: read-only notices first (leave ended, today's follow-ups), then the
  // jobs that save: teacher leave → cover, fee cycle → Fee Status
  try {
    if (!state.ended) {
      const ended = llqaLeaveEnded();
      if (ended.length) {
        state.ended = true;
        llqaToast({
          kind: "leaveEnded",
          key: "leaveEnded",
          ids: ended.map((s) => s.id),
          text: "🏖 Leave has ended for " + ended.length + " student" + (ended.length === 1 ? "" : "s") + ": " + ended.slice(0, 4).map((s) => s.name + " (to " + llqaDateLabel(s.lvTo) + ")").join(", ") + (ended.length > 4 ? "…" : "") + ". Back to active?",
        });
      }
    }
    if (!state.pilot && llqaCanManage() && LLQAApp.ctx.user && llqaReadyFor(["students", "messageLog", "dailyProgress"])) {
      state.pilot = true;
      const due = llqaAutopilot();
      if (due.length)
        llqaToast({ kind: "pilot", key: "pilot", text: "🤖 " + due.length + " follow-up message" + (due.length === 1 ? " is" : "s are") + " due today (" + [...new Set(due.map((x) => llqaTplName(x.template)))].slice(0, 3).join(", ") + ")." });
    }
  } catch (e) {}
  job(llqaLeaveStartRun);
  job(llqaCoverRunAuto);
  job(llqaFeeRunAuto);
  try {
    const st = typeof LLQASync !== "undefined" && LLQASync.get ? LLQASync.get() : null;
    if (st && st.mode === "cloud" && (st.pending || st.sending)) again = true;
  } catch (e) {}
  return again;
};
// A teacher asked for leave: how many classes it touches, approve in one click.
const llqaLeaveAskToast = (l) => {
  const ctx = LLQAApp.ctx;
  const t = (ctx.teachers || []).find((x) => String(x.id) === String(l.teacherId)) || { id: l.teacherId, name: l.teacherName };
  const load = llqaTeacherClasses(t, l.from, l.to);
  return {
    kind: "leaveAsk",
    key: "lv-" + l.id,
    leaveId: l.id,
    text: "🏖 " + (l.teacherName || "A teacher") + " asked for " + (l.type || "leave") + " " + llqaRangeLabel(l.from, l.to) + (l.halfDay ? " (half day)" : "") + (l.reason ? " — " + l.reason : "") + " · " + load.text + " affected.",
  };
};
// Students whose leave end date has passed but who are still on leave.
const llqaLeaveEnded = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage() || !llqaReadyFor(["students"])) return [];
  const today = todayPK();
  return (ctx.students || []).filter((s) => s && s.status === "leave" && s.lvTo && s.lvTo < today);
};
// Back to active (as the Students page's Resume does).
const llqaResumeStudents = (ids) => {
  const ctx = LLQAApp.ctx;
  const set = new Set((ids || []).map(String));
  if (!set.size) return;
  const fields = { status: "active", lvType: "", lvFrom: "", lvTo: "" };
  ctx.setStudents((prev) => (prev || []).map((x) => (set.has(String(x.id)) && x.status === "leave" ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function")
    ctx.upsertSalesMaster((ctx.students || []).filter((x) => set.has(String(x.id))).map((x) => ({ ...x, ...fields })));
  llqaToast({ kind: "info", ttl: 6000, text: "✓ " + set.size + " student" + (set.size === 1 ? " is" : "s are") + " active again." });
};
// New parent requests, and parents' answers to approval requests, show up
// as notices for the admin while the CRM is open.
const llqaRequestEvents = (list, leaves) => {
  const out = [];
  (list || []).forEach((r) => {
    if (!r || !r.id) return;
    if (r.createdBy === "parent") out.push({ id: r.id + ":new", r, kind: "request" });
    if (r.type === "proposal" && r.decidedBy === "parent" && r.status !== "pending") out.push({ id: r.id + ":" + r.status, r, kind: "decision" });
  });
  // teachers asking for leave from their login
  (leaves || []).forEach((l) => {
    if (l && l.requestedBy === "teacher" && String(l.status || "pending") === "pending") out.push({ id: "lv:" + l.id, l, kind: "leaveAsk" });
  });
  return out;
};
/* ---------- host: renders whichever pop-up is open ---------- */
const LLQAHost = () => {
  const [, bump] = useState(0);
  const seen = React.useRef(null);
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    LLQAUI.subs.add(f);
    return () => LLQAUI.subs.delete(f);
  }, []);
  // v66: watch parent requests (runs after every App update)
  useEffect(() => {
    const ctx = LLQAApp.ctx;
    if (!ctx.user || !llqaCanManage()) {
      seen.current = null;
      return;
    }
    try {
      if (typeof LLQACloud !== "undefined" && LLQACloud.ready && (!LLQACloud.ready("parentRequests") || !LLQACloud.ready("leaves"))) return;
    } catch (e) {
      return;
    }
    const ev = llqaRequestEvents(ctx.parentRequests, ctx.leaves);
    if (!seen.current) {
      seen.current = new Set(ev.map((e) => e.id));
      const waiting = llqaPendingRequests(ctx.parentRequests).length;
      if (waiting)
        llqaToast({ kind: "request", key: "req-waiting", text: "📨 " + waiting + " parent request" + (waiting === 1 ? " is" : "s are") + " waiting for an answer." });
      ev.filter((e) => e.kind === "leaveAsk").forEach((e) => llqaToast(llqaLeaveAskToast(e.l)));
      return;
    }
    ev.forEach((e) => {
      if (seen.current.has(e.id)) return;
      seen.current.add(e.id);
      if (e.kind === "leaveAsk") {
        llqaToast(llqaLeaveAskToast(e.l));
        return;
      }
      const r = e.r;
      llqaToast(
        e.kind === "request"
          ? { kind: "request", key: "req-" + r.id, text: "📨 " + (r.parent || "A parent") + " (" + (r.student || "student") + "): " + (LLQA_REQ_KINDS[r.type] || "Request") + " — " + llqaReqText(r) }
          : { kind: "decision", key: "dec-" + r.id, text: (r.status === "approved" ? "✅ " : "✕ ") + (r.parent || "The parent") + " " + (r.status === "approved" ? "approved" : "declined") + ": " + llqaReqText(r) + (r.reply ? " — “" + r.reply + "”" : "") },
      );
    });
  });
  useEffect(() => {
    // first check once the cloud data has settled, then every 5 minutes;
    // after a job saved something, the others get a quick re-check (v66)
    const state = { soon: false };
    let quick = null;
    let quickN = 0;
    const tick = () => {
      if (quick) clearTimeout(quick);
      quick = null;
      if (llqaClockTick(state) && quickN < 6) {
        quickN++;
        quick = setTimeout(tick, 8000);
      } else quickN = 0;
    };
    const first = setTimeout(tick, 15000);
    const again = setInterval(() => {
      quickN = 0;
      tick();
    }, 5 * 60 * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(again);
      if (quick) clearTimeout(quick);
    };
  }, []);
  const m = LLQAUI.modal;
  const k = m && m.kind;
  const d = (m && m.data) || {};
  return React.createElement(
    "div",
    null,
    k === "message" ? React.createElement(LLQAMessageModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "queue" ? React.createElement(LLQASendQueue, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "reschedule" ? React.createElement(LLQARescheduleModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "convert" ? React.createElement(LLQAConvertModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "quit" ? React.createElement(LLQAQuitModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "log" ? React.createElement(LLQALogHost, { key: m.key, info: d, onClose: llqaClose }) : null,
    // v66
    k === "payment" ? React.createElement(LLQAPaymentModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "logRequest" ? React.createElement(LLQALogRequestModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "ask" ? React.createElement(LLQAAskModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "billing" ? React.createElement(LLQABillingModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    k === "teacherLeave" ? React.createElement(LLQATeacherLeaveModal, { key: m.key, ...d, onClose: llqaClose }) : null,
    LLQAUI.toasts.length ? React.createElement(LLQAToasts, null) : null,
  );
};

/* ---------- Add Student: trial or direct (paid) enrollment ---------- */
const LLQAEnrollToggle = ({ pf, setPf }) => {
  const trial = pf.fee === "trial";
  const paid = pf.fee === "paid";
  const opt = (on, title, sub, onClick, key) =>
    React.createElement(
      "button",
      {
        key,
        type: "button",
        onClick,
        style: {
          flex: 1,
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid " + (on ? c.accent : c.border),
          background: on ? c.accentBg : "transparent",
          color: on ? c.accent : c.textSec,
          cursor: "pointer",
          textAlign: "left",
        },
      },
      React.createElement("div", { style: { fontSize: 12, fontWeight: 700 } }, title),
      React.createElement("div", { style: { fontSize: 10, marginTop: 2, opacity: 0.85 } }, sub),
    );
  return React.createElement(
    "div",
    { style: { marginBottom: 12 } },
    React.createElement(
      "div",
      { style: { color: c.textSec, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 } },
      "Enrollment",
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8 } },
      opt(trial, "🧪 Trial classes", "Fee Status 'trial' · Timetable shows red until paid", () => setPf({ ...pf, fee: "trial", trialTarget: pf.trialTarget || 3 }), "t"),
      opt(paid, "✅ Direct enrollment", "Fee Status 'paid' · no trial", () => setPf({ ...pf, fee: "paid" }), "p"),
    ),
    trial
      ? React.createElement(
          "div",
          { style: { marginTop: 8, maxWidth: 220 } },
          React.createElement(Inp, {
            label: "Trial classes before the fee",
            type: "number",
            value: String(pf.trialTarget || 3),
            onChange: (v) => setPf({ ...pf, trialTarget: Math.max(1, Math.min(20, parseInt(v, 10) || 3)) }),
          }),
        )
      : null,
    !trial && !paid
      ? React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 6 } }, "Fee Status is '" + (pf.fee || "—") + "' (set below).")
      : null,
    // v66: a registration date in the past = a family from before the CRM
    !pf.editingId && pf.dor && (llqaDays(pf.dor, todayPK()) || 0) > 14
      ? React.createElement(
          "div",
          { style: { marginTop: 8, padding: "7px 10px", borderRadius: 8, background: c.bgDeep, color: c.textSec, fontSize: 11, lineHeight: 1.45 } },
          "📅 Registered " + llqaDateYear(pf.dor) + " — saved as an existing student: they get the Parent Portal intro (not a welcome or first-class message), and the fee cycle starts from their next due day; earlier months count as settled.",
        )
      : null,
  );
};

/* ============================================================
   v65 — Part 3: screens. Sales: Trial Pipeline, Contacts &
   Messages, Waitlist, Clock Changes. Timetable: Today's Classes.
   Dashboard: today & follow-ups.
   ============================================================ */
const LLQA_SALES_TABS = { pipeline: 1, contacts: 1, waitlist: 1, clock: 1, autopilot: 1, fees: 1, requests: 1 };
const llqaCard = (kids, opt) =>
  React.createElement(
    "div",
    {
      key: opt && opt.key,
      style: {
        background: c.bgCard,
        border: "1px solid " + ((opt && opt.border) || c.border),
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: (opt && opt.mb) != null ? opt.mb : 10,
        ...((opt && opt.style) || {}),
      },
    },
    kids,
  );
const llqaH = (text, sub) =>
  React.createElement(
    "div",
    { style: { margin: "4px 0 10px" } },
    React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, text),
    sub ? React.createElement("div", { style: { color: c.textSec, fontSize: 11, marginTop: 2 } }, sub) : null,
  );
const llqaSearch = (value, onChange, placeholder) =>
  React.createElement("input", {
    value,
    onChange: (e) => onChange(e.target.value),
    placeholder: placeholder || "Search…",
    style: {
      flex: 1,
      minWidth: 200,
      padding: "8px 12px",
      background: c.bgDeep,
      border: "1px solid " + c.border,
      borderRadius: 8,
      color: c.text,
      fontSize: 12,
    },
  });
const llqaChips = (items, value, onPick) =>
  React.createElement(
    "div",
    { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
    items.map(([k, label, n]) =>
      React.createElement(
        "button",
        {
          key: k,
          type: "button",
          onClick: () => onPick(k),
          style: {
            padding: "6px 11px",
            borderRadius: 14,
            border: "1px solid " + (value === k ? c.accent : c.border),
            background: value === k ? c.accentBg : "transparent",
            color: value === k ? c.accent : c.textSec,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          },
        },
        label + (n != null ? " (" + n + ")" : ""),
      ),
    ),
  );
const llqaStat = (label, value, sub, col, key) =>
  React.createElement(
    "div",
    { key: key || label, style: { flex: "1 1 140px", background: c.bgCard, border: "1px solid " + c.border, borderRadius: 10, padding: "10px 12px" } },
    React.createElement("div", { style: { color: c.textSec, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 } }, label),
    React.createElement("div", { style: { color: col || c.text, fontSize: 20, fontWeight: 800, marginTop: 2 } }, value),
    sub ? React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 2 } }, sub) : null,
  );
// How many things need action on a Sales tab (shown on the tab).
const llqaTabBadge = (k) => {
  const ctx = LLQAApp.ctx;
  try {
    if (k === "pipeline")
      return (ctx.students || []).filter((s) => s.status !== "quit" && llqaTrialInfo(s).stage === "complete").length;
    if (k === "waitlist") return llqaWaitingFree(ctx.waitlist, ctx.teachers).length;
    if (k === "clock") return llqaClockReport(ctx.students, ctx.teachers).filter((r) => r.rows.some((x) => x.kind === "moved")).length;
    // v66
    if (k === "autopilot") return llqaAutopilot().length;
    if (k === "fees")
      return llqaCached("feeBadge", [ctx.students, ctx.arPayments, todayPK(), llqaLen(ctx.students), llqaLen(ctx.arPayments)], () =>
        (ctx.students || []).filter((s) => (llqaFeeCycle(s, ctx.arPayments) || {}).status === "overdue").length,
      );
    if (k === "requests") return llqaPendingRequests(ctx.parentRequests).length;
  } catch (e) {}
  return 0;
};
const LLQASalesTab = (props) =>
  props.tab === "pipeline"
    ? React.createElement(LLQAPipelineTab, props)
    : props.tab === "contacts"
      ? React.createElement(LLQAContactsTab, props)
      : props.tab === "waitlist"
        ? React.createElement(LLQAWaitlistTab, props)
        : props.tab === "clock"
          ? React.createElement(LLQAClockTab, props)
          : props.tab === "autopilot"
            ? React.createElement(LLQAAutopilotTab, props)
            : props.tab === "fees"
              ? React.createElement(LLQAFeeCycleTab, props)
              : props.tab === "requests"
                ? React.createElement(LLQARequestsTab, props)
                : null;

/* ---------- Trial Pipeline ---------- */
const LLQATrialCard = ({ x, ctx }) => {
  const s = x.s;
  const info = x.info;
  const B = LLQABooking;
  const pct = Math.min(100, Math.round((info.done / info.target) * 100));
  const last = llqaLastMsg(ctx.messageLog, s.id);
  const next = llqaNextClass(s);
  const digits = llqaPhone(s.phone, s.country);
  const sug = info.stage === "complete" ? "trialComplete" : !llqaLastMsg(ctx.messageLog, s.id, "welcome") ? "welcome" : "trialFollowUp";
  return llqaCard(
    [
      React.createElement(
        "div",
        { key: "h", style: { display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" } },
        React.createElement(
          "div",
          { style: { minWidth: 0 } },
          React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 700 } }, s.name),
          React.createElement(
            "div",
            { style: { color: c.textSec, fontSize: 11, marginTop: 1 } },
            (s.parent || "—") + " · " + (s.course || "") + (llqaSubjects(s) ? " · " + llqaSubjects(s) : ""),
          ),
        ),
        llqaPill(info.done + "/" + info.target, info.stage === "complete" ? c.warn : c.danger, null, "p"),
      ),
      React.createElement(
        "div",
        { key: "bar", style: { height: 5, background: c.bgDeep, borderRadius: 3, margin: "8px 0 6px", overflow: "hidden" } },
        React.createElement("div", { style: { width: pct + "%", height: "100%", background: info.stage === "complete" ? c.warn : c.accent } }),
      ),
      React.createElement(
        "div",
        { key: "m", style: { color: c.textMuted, fontSize: 10, lineHeight: 1.6 } },
        (info.days != null ? "Started " + (info.days === 0 ? "today" : info.days + " day" + (info.days === 1 ? "" : "s") + " ago") : "No start date") +
          (s.lastDate ? " · last class " + (info.sinceLast === 0 ? "today" : info.sinceLast + "d ago") : info.done ? "" : " · no class yet") +
          (next ? " · next " + next : "") +
          " · " + (s.teacher || "no teacher"),
        React.createElement("br", null),
        last ? "💬 " + llqaTplName(last.template) + " " + llqaAgo(last.at) : "💬 No message yet",
      ),
      React.createElement(
        "div",
        { key: "a", style: { display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 } },
        llqaMini("💬", () => llqaOpen("message", { studentId: s.id, template: sug }), { key: "msg", tone: "success", title: "Message: " + llqaTplName(sug), disabled: !digits }),
        llqaMini("📞", () => llqaCall(digits, { studentId: s.id, name: s.name }), { key: "call", title: "Call", disabled: !digits }),
        llqaMini("✓ Paid", () => llqaOpen("convert", { studentId: s.id }), { key: "cv", tone: "success", title: "Enroll as paid" }),
        llqaMini("+1 class", () => {
          const n = llqaTrialTarget(s) + 1;
          ctx.setStudents((prev) => (prev || []).map((y) => (String(y.id) === String(s.id) ? { ...y, trialTarget: n } : y)));
          if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, trialTarget: n }]);
        }, { key: "ext", title: "Extend the trial by one class" }),
        llqaMini("📅", () => llqaOpen("reschedule", { studentId: s.id }), { key: "rs", title: "Change classes" }),
        llqaMini("✕ Quit", () => llqaOpen("quit", { studentId: s.id }), { key: "q", tone: "danger" }),
      ),
    ],
    { key: s.id, border: info.stage === "complete" ? c.warn + "88" : info.stalled ? c.danger + "66" : c.border, mb: 8 },
  );
};
const LLQAPipelineTab = (props) => {
  const ctx = llqaCtx(props);
  const [q, setQ] = useState("");
  const today = todayPK();
  const everyone = ctx.students || [];
  const trials = everyone
    .filter((s) => s && s.status !== "quit")
    .map((s) => ({ s, info: llqaTrialInfo(s, { today, arPayments: ctx.arPayments }) }))
    .filter((x) => x.info.active);
  const ql = q.trim().toLowerCase();
  const shown = trials.filter((x) => !ql || [x.s.name, x.s.parent, x.s.phone, x.s.teacher, x.s.course].some((v) => String(v || "").toLowerCase().includes(ql)));
  const cols = [
    ["new", "🆕 Not started", "No class attended yet", (x) => x.info.stage === "new" && !x.info.stalled],
    ["active", "📚 In trial", "Attending trial classes", (x) => x.info.stage === "active" && !x.info.stalled],
    ["complete", "💰 Trial done — collect fee", "Send the fee message, then mark as paid", (x) => x.info.stage === "complete"],
    ["stalled", "⚠ Needs follow-up", "No class for 7+ days, or 10+ days and not finished", (x) => x.info.stalled && x.info.stage !== "complete"],
  ];
  const inWin = (d, n) => {
    const k = d ? llqaDays(d, today) : null;
    return k != null && k >= 0 && k <= n;
  };
  const conv90 = everyone.filter((s) => s.trialStart && inWin(s.convertedAt, 90));
  const quit90 = everyone.filter((s) => s.trialStart && s.trialOutcome === "quit" && inWin(s.qDate, 90));
  const conv30 = everyone.filter((s) => s.trialStart && inWin(s.convertedAt, 30));
  const rate = conv90.length + quit90.length ? Math.round((conv90.length / (conv90.length + quit90.length)) * 100) + "%" : "—";
  const avg = conv90.length
    ? Math.round(conv90.reduce((a, s) => a + Math.max(0, llqaDays(s.trialStart, s.convertedAt) || 0), 0) / conv90.length) + " days"
    : "—";
  const complete = trials.filter((x) => x.info.stage === "complete");
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Active trials", trials.length, "on trial now", trials.length ? c.accent : c.text),
      llqaStat("Collect fee", complete.length, "trial classes done", complete.length ? c.warn : c.text),
      llqaStat("Need follow-up", trials.filter((x) => x.info.stalled).length, "quiet or slow", trials.some((x) => x.info.stalled) ? c.danger : c.text),
      llqaStat("Converted (30 days)", conv30.length, "trial → paid", conv30.length ? c.success : c.text),
      llqaStat("Conversion rate", rate, "last 90 days: paid ÷ (paid + quit)"),
      llqaStat("Days to convert", avg, "average, last 90 days"),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" } },
      llqaSearch(q, setQ, "Search trial students…"),
      complete.length
        ? llqaMini("💬 Fee message to all " + complete.length, () =>
            llqaOpen("queue", { title: "Trial done — fee", items: complete.map((x) => ({ studentId: x.s.id, template: "trialComplete" })) }),
          { tone: "success", big: true })
        : null,
    ),
    trials.length === 0
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No students on trial. New students added from Sales start as trials (Fee Status 'trial')."))
      : React.createElement(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "start" } },
          cols.map(([k, title, sub, test]) => {
            const list = shown.filter(test);
            return React.createElement(
              "div",
              { key: k, style: { background: c.bgDeep, borderRadius: 12, padding: 10, minHeight: 80 } },
              React.createElement(
                "div",
                { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 } },
                React.createElement("div", { style: { color: c.text, fontSize: 12, fontWeight: 700 } }, title),
                React.createElement("div", { style: { color: c.textSec, fontSize: 11, fontWeight: 700 } }, list.length),
              ),
              React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginBottom: 8 } }, sub),
              list.length
                ? list.map((x) => React.createElement(LLQATrialCard, { key: x.s.id, x, ctx }))
                : React.createElement("div", { style: { color: c.textMuted, fontSize: 11, padding: "8px 2px" } }, "—"),
            );
          }),
        ),
  );
};

/* ---------- Contacts & Messages ---------- */
const LLQATemplateEditor = ({ onClose }) => {
  const ctx = LLQAApp.ctx;
  const m = ctx.messaging || {};
  const [d, setD] = useState(() => {
    const t = {};
    LLQA_TEMPLATES.forEach(([k]) => {
      t[k] = llqaTplText(k, m);
    });
    return { academy: m.academy || "", portalLink: m.portalLink || "", dialer: m.dialer || "", templates: t };
  });
  const save = () => {
    const own = {};
    LLQA_TEMPLATES.forEach(([k, , def]) => {
      const v = String(d.templates[k] || "");
      if (v.trim() && v !== def) own[k] = v;
    });
    if (typeof ctx.setMessaging === "function")
      ctx.setMessaging({ ...m, academy: d.academy.trim(), portalLink: d.portalLink.trim(), dialer: d.dialer.trim(), templates: own });
    onClose();
    llqaToast({ kind: "info", ttl: 5000, text: "✓ Message templates saved." });
  };
  return llqaCard(
    [
      llqaH("⚙ Message templates & links", "Placeholders: {parent} {student} {teacher} {schedule} {zone} {nextClass} {portalLink} {portalId} {academy} {trialDone} {trialTarget} {fee} {date} {classes} {present} {pct} {lesson} {holiday} {holidayDates} {resume} — cover, receipt and approval messages also fill {cover} {time} {amount} {month} {proposal} {approvalLink} {request} {decision}"),
      React.createElement(
        "div",
        { key: "f", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 12px" } },
        React.createElement(Inp, { label: "Academy name", value: d.academy, placeholder: "Let's Learn Quran Academy", onChange: (v) => setD({ ...d, academy: v }) }),
        React.createElement(Inp, { label: "Parent Portal link", value: d.portalLink, placeholder: llqaPortalLink({}), onChange: (v) => setD({ ...d, portalLink: v }) }),
        React.createElement(Inp, { label: "Dialer call link (optional)", value: d.dialer, placeholder: "https://your-dialer/call?to={phone}", onChange: (v) => setD({ ...d, dialer: v }) }),
      ),
      React.createElement(
        "div",
        { key: "dh", style: { color: c.textMuted, fontSize: 10, marginTop: -6, marginBottom: 10 } },
        "Dialer link: when set, 📞 opens your academy dialer with the number in place of {phone}. Empty = the computer's phone app.",
      ),
      LLQA_TEMPLATES.map(([k, name, def]) =>
        React.createElement(
          "div",
          { key: k, style: { marginBottom: 10 } },
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
            React.createElement("div", { style: { color: c.text, fontSize: 12, fontWeight: 700 } }, name),
            d.templates[k] !== def ? llqaMini("Reset", () => setD({ ...d, templates: { ...d.templates, [k]: def } }), { key: "r" }) : null,
          ),
          React.createElement("textarea", {
            value: d.templates[k],
            onChange: (e) => setD({ ...d, templates: { ...d.templates, [k]: e.target.value } }),
            rows: 4,
            style: llqaTextStyle,
          }),
        ),
      ),
      React.createElement(
        "div",
        { key: "b", style: { display: "flex", justifyContent: "flex-end", gap: 8 } },
        llqaMini("Cancel", onClose, { big: true, key: "c" }),
        llqaMini("✓ Save templates", save, { big: true, solid: true, tone: "accent", key: "s" }),
      ),
    ],
    { border: c.accent + "55" },
  );
};
const LLQAContactsTab = (props) => {
  const ctx = llqaCtx(props);
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [tpl, setTpl] = useState(false);
  const today = todayPK();
  const B = LLQABooking;
  const todayIds = new Set(
    llqaClassesOn(today, ctx.teachers, ctx.students, ctx.dailyProgress)
      .filter((it) => it.stu)
      .map((it) => String(it.stu.id)),
  );
  const rows = (ctx.students || [])
    .filter((s) => s && s.status !== "quit")
    .map((s) => {
      const info = llqaTrialInfo(s, { today, arPayments: ctx.arPayments });
      const tz = s.tz || B.timezoneFor(s.country, s.state);
      return {
        s,
        info,
        tz,
        digits: llqaPhone(s.phone, s.country),
        last: llqaLastMsg(ctx.messageLog, s.id),
        welcomed: !!llqaLastMsg(ctx.messageLog, s.id, "welcome"),
        feeDue: s.fee === "overdue" || s.fee === "partial",
        today: todayIds.has(String(s.id)),
        sug: llqaSuggest(s, ctx.messageLog),
      };
    });
  const FILTERS = [
    ["all", "All", () => true],
    ["new", "Welcome not sent", (r) => !r.welcomed],
    ["trial", "On trial", (r) => r.info.active],
    ["complete", "Trial done — fee", (r) => r.info.stage === "complete"],
    ["fee", "Fee overdue / partial", (r) => r.feeDue],
    ["today", "Class today", (r) => r.today],
    ["nonumber", "No usable number", (r) => !r.digits],
  ];
  const test = (FILTERS.find((x) => x[0] === f) || FILTERS[0])[2];
  const ql = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) => test(r) && (!ql || [r.s.name, r.s.parent, r.s.phone, r.s.code, r.s.teacher, r.s.country, r.s.state].some((v) => String(v || "").toLowerCase().includes(ql))),
  );
  const tplFor = (r) => (f === "today" ? "classReminder" : f === "new" ? "welcome" : r.sug);
  const sendable = shown.filter((r) => r.digits);
  const recent = [...(ctx.messageLog || [])].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 12);
  const th = (t) => React.createElement("th", { key: t, style: { textAlign: "left", padding: "8px 10px", color: c.textSec, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid " + c.border } }, t);
  const td = (kids, k, st) => React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + c.border + "66", fontSize: 12, color: c.text, verticalAlign: "top", ...(st || {}) } }, kids);
  return React.createElement(
    "div",
    null,
    tpl ? React.createElement(LLQATemplateEditor, { onClose: () => setTpl(false) }) : null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" } },
      llqaSearch(q, setQ, "Search name, parent, phone, code, teacher…"),
      sendable.length
        ? llqaMini("💬 Message these " + sendable.length, () =>
            llqaOpen("queue", {
              title: (FILTERS.find((x) => x[0] === f) || FILTERS[0])[1],
              items: sendable.map((r) => ({ studentId: r.s.id, template: tplFor(r) })),
            }),
          { big: true, tone: "success" })
        : null,
      !tpl && llqaCanManage() ? llqaMini("⚙ Templates & dialer", () => setTpl(true), { big: true }) : null,
    ),
    React.createElement("div", { style: { marginBottom: 12 } }, llqaChips(FILTERS.map(([k, l, t]) => [k, l, rows.filter(t).length]), f, setF)),
    llqaCard(
      shown.length === 0
        ? React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Nobody here.")
        : React.createElement(
            "div",
            { style: { overflowX: "auto" } },
            React.createElement(
              "table",
              { style: { width: "100%", borderCollapse: "collapse" } },
              React.createElement("thead", null, React.createElement("tr", null, ["Student", "Parent & number", "Family's time now", "Status", "Last message", ""].map(th))),
              React.createElement(
                "tbody",
                null,
                shown.map((r) => {
                  const s = r.s;
                  const pills = [];
                  if (r.info.active) pills.push(llqaPill(r.info.stage === "complete" ? "Trial done " + r.info.done + "/" + r.info.target : "Trial " + r.info.done + "/" + r.info.target, r.info.stage === "complete" ? c.warn : c.danger, null, "t"));
                  if (r.info.stalled) pills.push(llqaPill("Follow up", c.danger, null, "st"));
                  if (r.feeDue) pills.push(llqaPill("Fee " + s.fee, c.warn, null, "f"));
                  if (r.today) pills.push(llqaPill("Class today", c.accent, null, "td"));
                  if (!r.welcomed) pills.push(llqaPill("No welcome", c.textSec, null, "w"));
                  return React.createElement(
                    "tr",
                    { key: s.id },
                    td([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, s.name), React.createElement("div", { key: "c", style: { color: c.textMuted, fontSize: 10 } }, [s.code, s.course, s.teacher].filter(Boolean).join(" · "))], "a"),
                    td([
                      React.createElement("div", { key: "p" }, s.parent || "—"),
                      React.createElement("div", { key: "ph", style: { fontSize: 10, color: r.digits ? c.textSec : c.danger } }, r.digits ? "+" + r.digits : s.phone ? "⚠ " + s.phone + " (add country code)" : "⚠ no number"),
                    ], "b"),
                    td([React.createElement("div", { key: "t" }, llqaLocalNow(r.tz) || "—"), React.createElement("div", { key: "z", style: { color: c.textMuted, fontSize: 10 } }, llqaZoneLabel(r.tz))], "c"),
                    td(React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, pills.length ? pills : llqaPill("Active", c.success)), "d"),
                    td(r.last ? [React.createElement("div", { key: "l" }, llqaTplName(r.last.template) + (r.last.channel !== "whatsapp" ? " (" + r.last.channel + ")" : "")), React.createElement("div", { key: "a", style: { color: c.textMuted, fontSize: 10 } }, llqaAgo(r.last.at))] : React.createElement("span", { style: { color: c.textMuted } }, "—"), "e"),
                    td(
                      React.createElement(
                        "div",
                        { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                        llqaMini("💬 " + llqaTplName(tplFor(r)), () => llqaOpen("message", { studentId: s.id, template: tplFor(r) }), { key: "m", tone: "success", disabled: !r.digits }),
                        llqaMini("📞", () => llqaCall(r.digits, { studentId: s.id, name: s.name }), { key: "c", disabled: !r.digits, title: "Call" }),
                      ),
                      "f",
                      { whiteSpace: "nowrap" },
                    ),
                  );
                }),
              ),
            ),
          ),
    ),
    recent.length
      ? llqaCard([
          llqaH("Recent messages & calls", "Recorded from this CRM (" + (ctx.messageLog || []).length + " in total)"),
          ...recent.map((m) =>
            React.createElement(
              "div",
              { key: m.id, style: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, padding: "5px 0", borderBottom: "1px solid " + c.border + "55", color: c.textSec } },
              React.createElement("span", null, (m.channel === "whatsapp" ? "💬 " : "📞 ") + (m.name || "—") + (m.template ? " · " + llqaTplName(m.template) : "")),
              React.createElement("span", null, llqaAgo(m.at) + (m.by ? " · " + m.by : "")),
            ),
          ),
        ])
      : null,
  );
};

/* ---------- Waitlist ---------- */
const LLQAWaitlistTab = (props) => {
  const ctx = llqaCtx(props);
  const B = LLQABooking;
  const [hist, setHist] = useState(false);
  const [add, setAdd] = useState(null);
  const list = (ctx.waitlist || []).filter(Boolean);
  const waiting = list.filter((w) => w.status === "waiting").sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const rows = waiting.map((w) => ({ w, m: llqaWaitMatch(w, ctx.teachers) }));
  const setW = (id, patch) => ctx.setWaitlist((prev) => (prev || []).map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const book = (w, m) => {
    if (w.studentId != null && w.studentId !== "" && llqaFindStudent(w.studentId)) {
      llqaOpen("reschedule", { studentId: w.studentId, want: { day: w.wantDay, time: w.wantTime } });
      return;
    }
    if (typeof props.openAdd !== "function") return;
    const teacher = m.preferred ? w.teacher : m.free[0] || "";
    props.openAdd({
      name: w.name, parent: w.parent, phone: w.phone || "", email: w.email || "", age: w.age || "", gender: w.gender || "",
      family: "", country: w.country || "USA", state: w.state || "", course: w.course || "Quran",
      specificSubject: Array.isArray(w.specificSubject) ? w.specificSubject : [],
      teacher: "", fee: "trial", trialTarget: 3, time: "", dor: todayPK(), hoursPerWeek: "", classType: "Regular",
      fee_amount: "", currency: "USD", notes: w.notes || "",
      schedule: [{ id: 1, day: w.wantDay, time: w.wantTime, teacher }],
      _waitId: w.id,
    });
  };
  const saveAdd = () => {
    const r = { day: add.wantDay, time: add.wantTime, teacher: "" };
    const msg = llqaAddWaitlist({ ...add }, r, null);
    alert(msg);
    if (/^⏳ Added/.test(msg)) setAdd(null);
  };
  const states = (typeof COUNTRY_STATES !== "undefined" && add && COUNTRY_STATES[add.country]) || [];
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Waiting", waiting.length, "families"),
      llqaStat("Free now", rows.filter((r) => r.m.free.length).length, "can be booked today", rows.some((r) => r.m.free.length) ? c.success : c.text),
      llqaStat("Booked from waitlist", list.filter((w) => w.status === "booked").length, "all time", list.some((w) => w.status === "booked") ? c.accent : c.text),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" } },
      !add
        ? llqaMini("＋ Add a family", () => setAdd({ name: "", parent: "", phone: "", country: "USA", state: "", course: "Quran", wantDay: "Mon", wantTime: "0500 PM", notes: "" }), { big: true, tone: "accent" })
        : null,
      llqaMini(hist ? "Hide history" : "Show history", () => setHist(!hist), { big: true }),
    ),
    add
      ? llqaCard([
          llqaH("Add a family to the waitlist", "Or use ⏳ in the Add Student form when a time is full."),
          React.createElement(
            "div",
            { key: "g", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0 10px" } },
            React.createElement(Inp, { label: "Student name *", value: add.name, onChange: (v) => setAdd({ ...add, name: v }) }),
            React.createElement(Inp, { label: "Parent name *", value: add.parent, onChange: (v) => setAdd({ ...add, parent: v }) }),
            React.createElement(Inp, { label: "Phone / WhatsApp", value: add.phone, onChange: (v) => setAdd({ ...add, phone: v }) }),
            React.createElement(Inp, { label: "Country", value: add.country, onChange: (v) => setAdd({ ...add, country: v, state: "" }), options: typeof COUNTRY_STATES !== "undefined" ? Object.keys(COUNTRY_STATES) : ["USA"] }),
            states.length
              ? React.createElement(Inp, { label: "State / Province", value: add.state, onChange: (v) => setAdd({ ...add, state: v }), options: ["", ...states] })
              : React.createElement(Inp, { label: "State / City", value: add.state, onChange: (v) => setAdd({ ...add, state: v }) }),
            React.createElement(Inp, { label: "Course", value: add.course, onChange: (v) => setAdd({ ...add, course: v }), options: ["Quran", "Noorani Qaida", "Quran-Memo", "Saudi Quran", "Subject"] }),
            React.createElement(Inp, { label: "Wanted day", value: add.wantDay, onChange: (v) => setAdd({ ...add, wantDay: v }), options: B.DAYS }),
            React.createElement(Inp, { label: "Wanted time (family's clock)", value: add.wantTime, onChange: (v) => setAdd({ ...add, wantTime: v }), options: B.TIMES.map((t) => ({ value: t, label: B.timeLabel(t) })) }),
          ),
          React.createElement(Inp, { key: "n", label: "Notes", value: add.notes, onChange: (v) => setAdd({ ...add, notes: v }) }),
          React.createElement(
            "div",
            { key: "b", style: { display: "flex", justifyContent: "flex-end", gap: 8 } },
            llqaMini("Cancel", () => setAdd(null), { big: true, key: "c" }),
            llqaMini("⏳ Add to waitlist", saveAdd, { big: true, solid: true, tone: "accent", key: "s" }),
          ),
        ])
      : null,
    rows.length === 0
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No families waiting. When a wanted time is full in the Add Student form, use ⏳ Waitlist — they'll show here and you'll be told when the time frees up."))
      : rows.map(({ w, m }) => {
          const free = m.free.length > 0;
          const alt = !free && m.tz
            ? B.nearestFree({ day: w.wantDay, time: w.wantTime, tz: m.tz, teachers: ctx.teachers, filter: llqaDeptOk(w.course, w.specificSubject), take: 3 })
            : [];
          const digits = llqaPhone(w.phone, w.country);
          const asStudent = { ...w, id: w.studentId, tz: m.tz };
          return llqaCard(
            [
              React.createElement(
                "div",
                { key: "h", style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" } },
                React.createElement(
                  "div",
                  null,
                  React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 700 } }, w.name + (w.studentId != null && w.studentId !== "" ? " (current student)" : "")),
                  React.createElement(
                    "div",
                    { style: { color: c.textSec, fontSize: 11 } },
                    (w.parent || "") + (digits ? " · +" + digits : w.phone ? " · " + w.phone : "") + " · " + (w.course || "") + (Array.isArray(w.specificSubject) && w.specificSubject.length ? " · " + w.specificSubject.join(", ") : ""),
                  ),
                  React.createElement(
                    "div",
                    { style: { color: c.text, fontSize: 12, marginTop: 4 } },
                    "Wants " + w.wantDay + " " + B.timeLabel(w.wantTime) + " (" + (llqaZoneLabel(m.tz) || "?") + ")" + (m.pk ? " → " + B.pktLabel(m.pk) : "") + (w.teacher ? " · prefers " + w.teacher : ""),
                  ),
                  React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 2 } }, "Added " + llqaAgo(w.createdAt) + (w.notes ? " · " + w.notes : "")),
                ),
                React.createElement(
                  "div",
                  { style: { textAlign: "right" } },
                  free
                    ? llqaPill("✅ Free now with " + m.free.slice(0, 3).join(", ") + (m.free.length > 3 ? " +" + (m.free.length - 3) : ""), c.success, c.successBg)
                    : llqaPill("Still full", c.textSec),
                  !free && alt.length
                    ? React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 4 } }, "Closest free: " + alt.map((a) => (a.day !== w.wantDay ? a.day + " " : "") + B.timeLabel(a.time) + " · " + a.teacher).join(" | "))
                    : null,
                ),
              ),
              React.createElement(
                "div",
                { key: "a", style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 } },
                llqaMini(free ? "✓ Book now" : "Book anyway…", () => book(w, m), { key: "b", tone: free ? "success" : undefined, solid: free }),
                llqaMini("💬 Tell the family", () => llqaOpen("message", { student: asStudent, template: free ? "slotFree" : "custom", extra: { wantTime: w.wantDay + " " + B.timeLabel(w.wantTime), waitId: w.id } }), { key: "m", disabled: !digits }),
                llqaMini("✕ Remove", () => {
                  if (confirm("Remove " + w.name + " from the waitlist?")) setW(w.id, { status: "cancelled", closedAt: new Date().toISOString() });
                }, { key: "r", tone: "danger" }),
              ),
            ],
            { key: w.id, border: free ? c.success + "88" : c.border },
          );
        }),
    hist
      ? llqaCard([
          llqaH("History"),
          ...list
            .filter((w) => w.status !== "waiting")
            .map((w) =>
              React.createElement(
                "div",
                { key: w.id, style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: c.textSec, padding: "4px 0", borderBottom: "1px solid " + c.border + "55" } },
                React.createElement("span", null, w.name + " · " + w.wantDay + " " + B.timeLabel(w.wantTime)),
                React.createElement("span", null, (w.status === "booked" ? "✓ booked " + llqaAgo(w.bookedAt) : "removed " + llqaAgo(w.closedAt))),
              ),
            ),
        ])
      : null,
  );
};

/* ---------- Clock Changes ---------- */
const llqaChangeLabel = (cc, tz) => {
  if (!cc) return "";
  try {
    return cc.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: tz });
  } catch (e) {
    return cc.date.toDateString();
  }
};
// Keep the Pakistan time: the family's class time changes instead.
const llqaClockKeep = (entry) => {
  const ctx = LLQAApp.ctx;
  const s = entry.s;
  const moving = entry.rows.filter((x) => x.kind === "moved");
  if (!moving.length) return;
  const toTm = (fam) => String(fam || "").replace(":", "");
  const sched = s.schedule.map((r, i) => {
    const mv = moving.find((x) => x.ri === i);
    return mv && mv.famNow ? { ...r, time: toTm(mv.famNow) } : r;
  });
  const time = sched.filter((r) => r.day && r.time).map((r) => r.day + "|" + r.time).join(", ");
  ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, schedule: sched, time } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, schedule: sched, time }]);
  // the Timetable cells show the family's time too
  const suffix = (t) => (/ USA$/.test(t) ? " USA" : / CA$/.test(t) ? " CA" : "");
  ctx.setTeachers((prev) =>
    (prev || []).map((t) => {
      const mine = moving.filter((x) => x.cell.teacherId === t.id);
      if (!mine.length || !t._ttSchedule) return t;
      const sch = JSON.parse(JSON.stringify(t._ttSchedule));
      mine.forEach((x) => {
        const cl = sch[x.cell.day] && sch[x.cell.day][x.cell.slot];
        if (cl && typeof cl === "object") cl.t = toTm(x.famNow) + suffix(String(cl.t || ""));
      });
      return { ...t, _ttSchedule: sch };
    }),
  );
};
const LLQAClockTab = (props) => {
  const ctx = llqaCtx(props);
  const B = LLQABooking;
  const [msg, setMsg] = useState("");
  const report = llqaClockReport(ctx.students, ctx.teachers);
  const moved = report.filter((r) => r.rows.some((x) => x.kind === "moved"));
  const upcoming = report.filter((r) => r.rows.some((x) => x.kind === "upcoming"));
  const automation = ctx.automation || {};
  const auto = automation.clockAuto !== false;
  const last = automation.lastRun || null;
  const manage = llqaCanManage();
  const setAuto = (on) => {
    if (typeof ctx.setAutomation === "function") ctx.setAutomation({ ...automation, clockAuto: on });
  };
  // one click: every family keeps its usual time (all students together)
  const fix = (list) => {
    const run = llqaClockApply(list, { auto: false });
    setMsg(
      run.moved.length
        ? "✓ " + llqaRunText(run)
        : "Nothing could move: " + run.skipped.map((k) => k.name + " — " + k.why).join(" | "),
    );
  };
  const zones = {};
  (ctx.students || []).forEach((s) => {
    if (!s || s.status === "quit") return;
    const tz = s.tz || B.timezoneFor(s.country, s.state);
    if (tz) zones[tz] = (zones[tz] || 0) + 1;
  });
  const zoneCards = Object.keys(zones)
    .sort()
    .map((tz) => {
      const cc = llqaNextChange(tz);
      const recent = llqaRecentChange(tz);
      const shift = cc ? (cc.after - cc.before) / 60 : 0;
      return React.createElement(
        "div",
        { key: tz, style: { flex: "1 1 200px", background: c.bgCard, border: "1px solid " + c.border, borderRadius: 10, padding: "10px 12px" } },
        React.createElement("div", { style: { color: c.text, fontSize: 12, fontWeight: 700 } }, llqaZoneLabel(tz) + " · " + zones[tz] + " famil" + (zones[tz] === 1 ? "y" : "ies")),
        React.createElement(
          "div",
          { style: { color: c.textSec, fontSize: 11, marginTop: 3 } },
          cc ? "Next change: " + llqaChangeLabel(cc, tz) + " (clocks " + (shift > 0 ? "forward" : "back") + " " + Math.abs(shift) + "h)" : "No clock change in the next 8 months",
        ),
        recent ? React.createElement("div", { style: { color: c.warn, fontSize: 10, marginTop: 2 } }, "Changed on " + llqaChangeLabel(recent, tz)) : null,
      );
    });
  const rowText = (x) =>
    x.kind === "moved"
      ? x.row.day + " " + B.timeLabel(x.row.time) + " (family) was booked at " + B.fmt12(x.row.pktSlot) + " PKT, which is now " + x.famNow + " for them. Keeping " + B.timeLabel(x.row.time) + " needs " + B.fmt12(x.needSlot) + " PKT — " + (x.free ? "✓ free with " + x.cell.teacher : "✗ " + x.why)
      : x.row.day + " " + B.timeLabel(x.row.time) + " (family) at " + B.fmt12(x.row.pktSlot) + " PKT becomes " + x.famAfter + " for them. Keeping " + B.timeLabel(x.row.time) + " will need " + B.fmt12(x.needSlot) + " PKT — " + (x.free ? "✓ free now" : "✗ " + x.why);
  const movedClasses = moved.reduce((a, e) => a + e.rows.filter((x) => x.kind === "moved").length, 0);
  const section = (title, sub, list, kind) =>
    llqaCard([
      llqaH(title, sub),
      ...list.map((e) => {
        const mine = e.rows.filter((x) => x.kind === kind);
        const first = mine[0];
        const extra =
          kind === "moved" ? { newTime: first.famNow } : { changeDate: llqaChangeLabel(e.next, e.tz), newTime: first.famAfter };
        return React.createElement(
          "div",
          { key: e.s.id, style: { padding: "10px 0", borderTop: "1px solid " + c.border + "66" } },
          React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 700 } }, e.s.name + " · " + e.zone + (kind === "upcoming" ? " · " + llqaChangeLabel(e.next, e.tz) : "")),
          ...mine.map((x, k) => React.createElement("div", { key: k, style: { color: x.free ? c.textSec : c.warn, fontSize: 11, marginTop: 3 } }, "• " + rowText(x))),
          React.createElement(
            "div",
            { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 } },
            kind === "moved" && manage
              ? [
                  llqaMini("Keep family time — move class", () => fix([e]), { key: "mv", tone: "success" }),
                  llqaMini("Keep Pakistan time", () => {
                    llqaClockKeep(e);
                    setMsg("✓ " + e.s.name + "'s family time updated to " + first.famNow + ".");
                  }, { key: "kp" }),
                  llqaMini("📅 Other time / teacher", () => llqaOpen("reschedule", { studentId: e.s.id }), { key: "rs" }),
                ]
              : null,
            manage
              ? llqaMini("💬 Tell the family", () => llqaOpen("message", { studentId: e.s.id, template: kind === "moved" ? "clockChanged" : "clockChange", extra }), { key: "m", disabled: !llqaPhone(e.s.phone, e.s.country) })
              : null,
          ),
        );
      }),
    ]);
  const lastWhen = last
    ? (() => {
        try {
          return new Date(last.at).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " PKT";
        } catch (e) {
          return last.at;
        }
      })()
    : "";
  const teacherItems = last ? llqaTeacherMoveItems(last) : [];
  return React.createElement(
    "div",
    null,
    llqaCard(
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" } },
        React.createElement(
          "div",
          { style: { flex: "1 1 400px" } },
          React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, "🤖 Automatic fixing — " + (auto ? "ON" : "OFF")),
          React.createElement(
            "div",
            { style: { color: c.textSec, fontSize: 11, marginTop: 3, lineHeight: 1.5 } },
            auto
              ? "After every clock change (USA, Canada, UK, Europe, Australia…), each family's classes move by themselves so the family keeps its usual time — only when the same teacher is free at the new Pakistan time. It runs the first time an admin opens the CRM after the change, then shows what moved, with a button to message the teachers. A week before a change you get a reminder."
              : "Classes are not moved by themselves. After a clock change, use “Fix all now” below — or turn this on.",
          ),
        ),
        manage ? llqaMini(auto ? "Turn off" : "Turn on", () => setAuto(!auto), { big: true, tone: "success", solid: !auto }) : null,
      ),
      { border: auto ? c.success + "66" : c.border },
    ),
    React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } }, zoneCards.length ? zoneCards : llqaStat("Families", 0, "no students with a time zone yet")),
    msg ? llqaCard(React.createElement("div", { style: { color: /^✓/.test(msg) ? c.success : c.warn, fontSize: 12 } }, msg)) : null,
    last
      ? llqaCard([
          llqaH("Last fix: " + lastWhen + (last.auto ? " · automatic" : last.by ? " · by " + last.by : ""), llqaRunText(last)),
          ...(last.skipped || []).map((k, i) =>
            React.createElement("div", { key: "sk" + i, style: { color: c.warn, fontSize: 11, marginBottom: 3 } }, "• " + k.name + " — " + k.why),
          ),
          React.createElement(
            "div",
            { key: "b", style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 } },
            manage && teacherItems.length
              ? llqaMini("💬 Tell teachers (" + teacherItems.length + ")", () => llqaOpen("queue", { title: "Moved classes — teachers", items: teacherItems }), { key: "t", tone: "success", big: true })
              : null,
            manage && (last.moved || []).length
              ? llqaMini("💬 Confirm to families (" + last.moved.length + ") — optional", () => llqaOpen("queue", { title: "Time kept — families", items: llqaFamilyKeptItems(last) }), { key: "f", big: true })
              : null,
          ),
        ])
      : null,
    moved.length
      ? React.createElement(
          "div",
          null,
          manage
            ? React.createElement(
                "div",
                { style: { marginBottom: 8 } },
                llqaMini("✓ Fix all now — keep every family's usual time (" + movedClasses + " class" + (movedClasses === 1 ? "" : "es") + ")", () => fix(moved), { big: true, solid: true, tone: "success" }),
              )
            : null,
          section("⚠ Clocks already changed — " + moved.length + " student(s)", "Pakistan has no clock change, so these classes stayed on their Pakistan slot and the family's time moved. “Fix all now” moves them all at once (chains included); anything whose new slot is taken is listed for a decision.", moved, "moved"),
        )
      : null,
    upcoming.length
      ? section("🕐 Coming up — " + upcoming.length + " student(s)", auto ? "Automatic fixing is on: these move by themselves after the change. You can tell the families now." : "After the change these move to the list above, where one click fixes them all.", upcoming, "upcoming")
      : null,
    !moved.length && !upcoming.length
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "✓ Every booked class matches the family's time, and no change in the next 8 months affects them."))
      : null,
  );
};

/* ---------- Timetable: Today's Classes ---------- */
const LLQATodayClasses = (props) => {
  const ctx = llqaCtx(props);
  const B = LLQABooking;
  const today = todayPK();
  const [date, setDate] = useState(today);
  const [f, setF] = useState("all");
  const [tf, setTf] = useState("all");
  const [pick, setPick] = useState(null);
  const manage = llqaCanManage();
  const u = LLQAApp.ctx.user || {};
  const isT = u.role === "teacher";
  const nowMin = llqaNowPkMin();
  // v66: a teacher also sees the classes they cover for someone on leave
  const raw = llqaClassesOn(date, isT ? LLQAApp.ctx.teachers || [] : props.teachers || ctx.teachers, isT ? LLQAApp.ctx.students || [] : ctx.students, ctx.dailyProgress);
  const mine = (it) => String(it.teacherId) === String(u.teacherId) || (it.covered && String(it.cover.coverId) === String(u.teacherId));
  const all = (isT ? raw.filter(mine) : raw).map((it) => ({
    ...it,
    st: llqaClassState(it, date, nowMin),
    trial: it.stu ? llqaTrialInfo(it.stu, { today: date, arPayments: ctx.arPayments }) : null,
  }));
  const teachersList = [...new Set(all.flatMap((it) => (it.covered ? [it.teacher, it.by] : [it.teacher])))].sort();
  const byT = all.filter((it) => tf === "all" || it.teacher === tf || it.by === tf);
  const FILTERS = [
    ["all", "All", () => true],
    ["missing", "⚠ Not logged", (it) => it.st.k === "missing"],
    ["cover", "🔁 Needs cover", (it) => it.st.k === "cover"],
    ["upcoming", "Upcoming", (it) => it.st.k === "upcoming" || it.st.k === "now"],
    ["done", "Logged", (it) => it.st.k === "logged" || it.st.k === "absent" || it.st.k === "excused"],
    ["trial", "Trials", (it) => it.trial && it.trial.active],
  ];
  const shown = byT.filter((FILTERS.find((x) => x[0] === f) || FILTERS[0])[2]);
  const upcomingStu = [];
  byT.forEach((it) => {
    if ((it.st.k === "upcoming" || it.st.k === "now") && it.stu && llqaPhone(it.stu.phone, it.stu.country) && !upcomingStu.some((x) => x.id === it.stu.id))
      upcomingStu.push(it.stu);
  });
  const needCover = byT.filter((it) => it.st.k === "cover");
  const dayCovers = (ctx.covers || []).filter((x) => x && x.date === date && (x.cancelled || x.coverId != null));
  const hol = llqaHolidayOn(date);
  const coverAll = () => {
    const res = llqaPlanCovers([date], false);
    if (res.recs.length) llqaSaveCovers(res.recs);
    llqaToast(
      res.recs.length
        ? { kind: "covers", key: "covers", covers: res.recs, text: "🔁 " + res.recs.length + " class" + (res.recs.length === 1 ? "" : "es") + " given to substitutes" + (res.missing.length ? " · " + res.missing.length + " have no free teacher (mark them off or pick another time)" : "") + "." }
        : { kind: "info", ttl: 7000, text: "No free teacher for " + res.missing.length + " class" + (res.missing.length === 1 ? "" : "es") + " at those times." },
    );
  };
  const dayBtn = (label, d) => llqaMini(label, () => setDate(d), { key: label, tone: date === d ? "accent" : undefined, solid: date === d });
  const th = (t) => React.createElement("th", { key: t, style: { textAlign: "left", padding: "8px 10px", color: c.textSec, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid " + c.border } }, t);
  const td = (kids, k, st) => React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + c.border + "66", fontSize: 12, color: c.text, verticalAlign: "middle", ...(st || {}) } }, kids);
  const coverSelect = (it) => {
    const opts = llqaCoverOptions(it, date, raw);
    return React.createElement(
      "select",
      {
        key: "cs",
        value: "",
        onClick: (e) => e.stopPropagation(),
        onChange: (e) => {
          const t = opts.find((o) => String(o.t.id) === e.target.value);
          if (t) {
            llqaAssignCover(it, date, t.t, false);
            setPick(null);
          }
        },
        style: { padding: "4px 6px", background: c.bgDeep, border: "1px solid " + (opts.length ? c.accent : c.danger) + "88", borderRadius: 6, color: c.text, fontSize: 11, maxWidth: 210 },
      },
      React.createElement("option", { value: "" }, opts.length ? "🔁 Choose substitute (" + opts.length + " free)…" : "No teacher free then"),
      opts.map((o) =>
        React.createElement("option", { key: o.t.id, value: String(o.t.id) }, (o.pref ? "★ " : "") + o.t.name + " · " + (o.t.gender || "—") + " · " + o.load.booked + " classes/wk"),
      ),
    );
  };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaMini("◀", () => setDate(llqaAddDays(date, -1)), { key: "p", title: "Previous day" }),
      dayBtn("Yesterday", llqaAddDays(today, -1)),
      dayBtn("Today", today),
      dayBtn("Tomorrow", llqaAddDays(today, 1)),
      llqaMini("▶", () => setDate(llqaAddDays(date, 1)), { key: "n", title: "Next day" }),
      React.createElement("input", {
        type: "date",
        value: date,
        onChange: (e) => e.target.value && setDate(e.target.value),
        style: { padding: "5px 8px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 7, color: c.text, fontSize: 11 },
      }),
      React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 700, marginLeft: 6 } }, llqaDateLabel(date) + " · Pakistan time"),
      // v66: a teacher asks for leave here; the admin approves with one click
      isT ? llqaMini("🏖 Request leave", () => llqaOpen("teacherLeave", {}), { key: "rl", big: true, tone: "accent" }) : null,
    ),
    isT ? llqaMyLeaves(u) : null,
    hol
      ? llqaCard(
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" } },
            React.createElement(
              "div",
              { style: { color: c.text, fontSize: 13 } },
              React.createElement("b", null, ((hol.kind || "holiday") === "ramadan" ? "🌙 " : "🗓 ") + (hol.name || "Holiday")),
              " · " + llqaRangeLabel(hol.from, hol.to) + " · " + ((hol.kind || "holiday") === "holiday" ? "academy closed — no classes" : "classes run as usual") + (hol.note ? " · " + hol.note : ""),
            ),
            manage ? llqaMini("🗓 Holidays", () => llqaGo("timetable", "holidays"), { key: "h", tone: "accent" }) : null,
          ),
          { border: ((hol.kind || "holiday") === "holiday" ? c.warn : c.accent) + "88" },
        )
      : null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 } },
      llqaStat("Classes", byT.length, tf === "all" ? (isT ? "yours" : "all teachers") : tf),
      llqaStat("Logged", byT.filter((it) => ["logged", "absent", "excused"].includes(it.st.k)).length, "attendance saved", byT.some((it) => ["logged", "absent", "excused"].includes(it.st.k)) ? c.success : c.text),
      llqaStat("Not logged", byT.filter((it) => it.st.k === "missing").length, "time passed, nothing saved", byT.some((it) => it.st.k === "missing") ? c.danger : c.text),
      llqaStat("Upcoming", byT.filter((it) => it.st.k === "upcoming" || it.st.k === "now").length, date === today ? "later today" : ""),
      needCover.length || byT.some((it) => it.covered)
        ? llqaStat("Teacher on leave", needCover.length ? needCover.length + " need cover" : "all covered", byT.filter((it) => it.covered).length + " covered · " + byT.filter((it) => it.off).length + " off", needCover.length ? c.danger : c.success, "lv")
        : llqaStat("Trial classes", byT.filter((it) => it.trial && it.trial.active).length, "red in the Timetable", byT.some((it) => it.trial && it.trial.active) ? c.danger : c.text),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" } },
      llqaChips(FILTERS.filter((x) => x[0] !== "cover" || needCover.length).map(([k, l, t]) => [k, l, byT.filter(t).length]), f, setF),
      teachersList.length > 1
        ? React.createElement(
            "select",
            {
              value: tf,
              onChange: (e) => setTf(e.target.value),
              style: { padding: "6px 8px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 7, color: c.text, fontSize: 11 },
            },
            React.createElement("option", { value: "all" }, "All teachers"),
            teachersList.map((t) => React.createElement("option", { key: t, value: t }, t)),
          )
        : null,
      manage && needCover.length && date >= today
        ? llqaMini("🔁 Cover all " + needCover.length, coverAll, { big: true, tone: "danger", solid: true, key: "ca", title: "Give each class to the best free teacher" })
        : null,
      manage && dayCovers.length
        ? llqaMini("💬 Tell substitutes", () => llqaOpen("queue", { title: "Cover classes — substitutes", items: llqaCoverTeacherItems(dayCovers) }), { big: true, tone: "success", key: "ts" })
        : null,
      manage && dayCovers.some((x) => x.sid != null)
        ? llqaMini("💬 Tell families", () => llqaOpen("queue", { title: "Teacher on leave — families", items: llqaCoverFamilyItems(dayCovers) }), { big: true, tone: "success", key: "tf" })
        : null,
      manage && upcomingStu.length
        ? llqaMini("💬 Remind " + upcomingStu.length + " famil" + (upcomingStu.length === 1 ? "y" : "ies"), () =>
            llqaOpen("queue", { title: "Class reminders", items: upcomingStu.map((s) => ({ studentId: s.id, template: "classReminder" })) }),
          { big: true, tone: "success", key: "rm" })
        : null,
    ),
    llqaCard(
      shown.length === 0
        ? React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, all.length ? "No classes match this filter." : "No classes booked on " + llqaDateLabel(date) + ".")
        : React.createElement(
            "div",
            { style: { overflowX: "auto" } },
            React.createElement(
              "table",
              { style: { width: "100%", borderCollapse: "collapse" } },
              React.createElement("thead", null, React.createElement("tr", null, ["Pakistan", "Family's time", "Student", "Teacher", "Status", ""].map(th))),
              React.createElement(
                "tbody",
                null,
                shown.map((it) => {
                  const s = it.stu;
                  const digits = s ? llqaPhone(s.phone, s.country) : "";
                  const sub = it.cell.c + (it.cell.sub ? " · " + it.cell.sub : "");
                  const canLog = !!s && date <= today && it.st.k !== "holiday" && it.st.k !== "off";
                  const tplK = it.st.k === "missing" || it.st.k === "absent" ? "missedClass" : "classReminder";
                  const future = date >= today;
                  const showPick = manage && future && !it.entry && (it.st.k === "cover" || pick === it.key);
                  return React.createElement(
                    "tr",
                    { key: it.key },
                    td(React.createElement("b", null, B.fmt12(it.slot)), "t", { whiteSpace: "nowrap" }),
                    td([
                      React.createElement("div", { key: "f" }, it.famTime ? it.rowDay + " " + it.famTime : "—"),
                      React.createElement("div", { key: "z", style: { color: c.textMuted, fontSize: 10 } }, llqaZoneLabel(it.tz)),
                    ], "f", { whiteSpace: "nowrap" }),
                    td([
                      React.createElement("div", { key: "n", style: { fontWeight: 700 } }, it.cell.s + (s ? "" : " ⚠")),
                      React.createElement(
                        "div",
                        { key: "c", style: { color: c.textMuted, fontSize: 10, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" } },
                        sub,
                        it.trial && it.trial.active
                          ? llqaPill(it.trial.stage === "complete" ? "Trial done" : "Trial " + it.trial.done + "/" + it.trial.target, it.trial.stage === "complete" ? c.warn : c.danger, null, "tr")
                          : null,
                        s ? null : llqaPill("not linked to a student", c.warn, null, "nl"),
                      ),
                    ], "s"),
                    td([
                      React.createElement("div", { key: "b", style: { fontWeight: it.covered ? 700 : 400, color: it.covered ? c.accent : c.text } }, it.by),
                      it.covered ? React.createElement("div", { key: "f", style: { color: c.textMuted, fontSize: 10 } }, "🔁 covering for " + it.teacher) : null,
                      it.tLeave && !it.covered ? React.createElement("div", { key: "l" }, llqaPill((it.kept ? "takes it · " : "on leave · ") + (it.tLeave.status || "pending") + (it.tLeave.halfDay ? " · half day" : ""), it.kept ? c.success : it.tLeave.status === "approved" ? c.warn : c.textSec, null, "lv")) : null,
                    ], "te"),
                    td(React.createElement("span", { style: { color: it.st.col, fontWeight: 700, fontSize: 11 } }, it.st.text), "st", { whiteSpace: "nowrap" }),
                    td(
                      React.createElement(
                        "div",
                        { style: { display: "flex", gap: 5, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" } },
                        showPick ? coverSelect(it) : null,
                        manage && future && !it.entry && it.st.k === "cover" ? llqaMini("✓ Teacher takes it", () => llqaKeepTeacher(it, date), { key: "kp", title: "The usual teacher takes this class (e.g. half-day leave)" }) : null,
                        manage && future && !it.entry && it.st.k === "cover" ? llqaMini("Class off", () => llqaClassOff(it, date), { key: "off", title: "No class that day (tell the family)" }) : null,
                        manage && future && !it.entry && (it.covered || it.off || it.kept) ? llqaMini("↺", () => llqaUncover(it, date), { key: "un", title: it.covered ? "Remove the substitute" : it.kept ? "Teacher can't take it after all — needs cover" : "Class back on — needs a teacher" }) : null,
                        manage && future && !it.entry && !it.tLeave && !it.covered && !it.off && it.st.k !== "holiday" && pick !== it.key
                          ? llqaMini("🔁", () => setPick(it.key), { key: "pk", title: "Teacher can't take this class — choose a substitute" })
                          : null,
                        canLog && it.st.k !== "cover"
                          ? llqaMini(it.entry ? "✍ Edit log" : "✍ Log", () =>
                              llqaOpen("log", { studentId: s.id, studentName: it.cell.s, teacherName: it.by, cell: it.cell, day: it.rowDay, slot: it.slot, date }),
                            { key: "l", tone: it.st.k === "missing" ? "danger" : "accent", solid: it.st.k === "missing" })
                          : null,
                        manage && s ? llqaMini("💬", () => llqaOpen("message", { studentId: s.id, template: tplK, extra: { date: llqaDateLabel(date) } }), { key: "m", disabled: !digits, title: llqaTplName(tplK) }) : null,
                        manage && s ? llqaMini("📞", () => llqaCall(digits, { studentId: s.id, name: s.name }), { key: "c", disabled: !digits, title: "Call" }) : null,
                      ),
                      "a",
                      { whiteSpace: "nowrap" },
                    ),
                  );
                }),
              ),
            ),
          ),
    ),
  );
};

/* ---------- Dashboard: today & follow-ups ---------- */
const LLQADashCards = (props) => {
  const ctx = llqaCtx(props);
  if (!llqaCanManage()) return null;
  const today = todayPK();
  const nowMin = llqaNowPkMin();
  const clsAll = llqaClassesOn(today, ctx.teachers, ctx.students, ctx.dailyProgress);
  const cls = clsAll.map((it) => llqaClassState(it, today, nowMin).k);
  const logged = cls.filter((k) => k === "logged" || k === "absent" || k === "excused").length;
  const missing = cls.filter((k) => k === "missing").length;
  const live = (ctx.students || []).filter((s) => s && s.status !== "quit");
  const infos = live.map((s) => llqaTrialInfo(s, { today, arPayments: ctx.arPayments }));
  const active = infos.filter((i) => i.active).length;
  const complete = infos.filter((i) => i.stage === "complete").length;
  const stalled = infos.filter((i) => i.stalled && i.stage !== "complete").length;
  const feeDue = live.filter((s) => s.fee === "overdue" || s.fee === "partial").length;
  const waiting = (ctx.waitlist || []).filter((w) => w && w.status === "waiting");
  const freeNow = llqaWaitingFree(waiting, ctx.teachers).length;
  const clock = llqaClockReport(ctx.students, ctx.teachers);
  const movedN = clock.filter((r) => r.rows.some((x) => x.kind === "moved")).length;
  const up = clock.filter((r) => r.rows.some((x) => x.kind === "upcoming"));
  const firstUp = up.length ? up.map((r) => r.next).filter(Boolean).sort((a, b) => a.date - b.date)[0] : null;
  // v66
  const pilot = llqaAutopilot({ today });
  const risky = llqaRiskList(live, ctx.dailyProgress, today);
  const highRisk = risky.filter((x) => x.r.level === "high").length;
  const cycles = live.map((s) => llqaFeeCycle(s, ctx.arPayments, today)).filter(Boolean);
  const feeOver = cycles.filter((x) => x.status === "overdue").length;
  const feeDueNow = cycles.filter((x) => x.status === "due" || x.status === "partial").length;
  const tomorrow = llqaAddDays(today, 1);
  const needCover = [today, tomorrow].reduce(
    (a, d) => a + (d === today ? clsAll : llqaClassesOn(d, ctx.teachers, ctx.students, ctx.dailyProgress)).filter((it) => it.tLeave && !it.covered && !it.off && !it.onLeave && !it.quit && !it.holiday && !it.entry).length,
    0,
  );
  const reqWaiting = llqaPendingRequests(ctx.parentRequests).length;
  const askWaiting = (ctx.parentRequests || []).filter((r) => r && r.type === "proposal" && r.status === "pending").length;
  const holNow = llqaHolidayOn(today) || llqaHolidayOn(tomorrow);
  const holNext = llqaCalendar().filter((d) => (d.to || d.from) >= today).sort((a, b) => String(a.from).localeCompare(String(b.from)))[0];
  const card = (key, icon, title, value, sub, alert, go) =>
    React.createElement(
      "div",
      {
        key,
        onClick: go,
        style: {
          cursor: "pointer",
          background: c.bgCard,
          border: "1px solid " + (alert ? alert + "88" : c.border),
          borderRadius: 10,
          padding: "10px 12px",
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        React.createElement("div", { style: { color: c.textSec, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 } }, icon + " " + title),
        React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "→"),
      ),
      React.createElement("div", { style: { color: alert || c.text, fontSize: 22, fontWeight: 800, marginTop: 2 } }, value),
      React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 2 } }, sub),
    );
  return React.createElement(
    "div",
    { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 } },
    card("today", "📋", "Today's classes", cls.length, logged + " logged · " + missing + " not logged", missing ? c.danger : null, () => llqaGo("timetable", "today")),
    card("trials", "🧪", "Trials", active, complete + " fee due · " + stalled + " need follow-up", complete ? c.warn : stalled ? c.danger : null, () => llqaGo("sales", "pipeline")),
    card("follow", "💬", "Follow-ups", complete + feeDue + stalled, complete + " trial fee · " + feeDue + " fee due · " + stalled + " quiet", complete + feeDue ? c.warn : null, () => llqaGo("sales", "contacts")),
    card("wait", "⏳", "Waitlist", waiting.length, freeNow ? freeNow + " can be booked now" : "none free yet", freeNow ? c.success : null, () => llqaGo("sales", "waitlist")),
    card(
      "clock",
      "🕐",
      "Clock changes",
      movedN + up.length,
      (movedN ? movedN + " to fix now" : firstUp ? up.length + " before " + firstUp.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "nothing coming up") +
        ((ctx.automation || {}).clockAuto !== false ? " · auto ✓" : " · auto off"),
      movedN ? c.danger : null,
      () => llqaGo("sales", "clock"),
    ),
    // v66
    card("pilot", "🤖", "Autopilot", pilot.length, pilot.length ? "follow-up messages due today" : "nothing due — all sent", pilot.length ? c.accent : null, () => llqaGo("sales", "autopilot")),
    card("risk", "⚠", "At-risk students", highRisk, risky.length - highRisk + " more to watch", highRisk ? c.danger : null, () => llqaGo("sales", "autopilot")),
    card("fees", "💰", "Fee cycle", feeOver, feeOver + " overdue · " + feeDueNow + " due now" + ((ctx.automation || {}).feeAuto !== false ? " · auto ✓" : " · auto off"), feeOver ? c.danger : feeDueNow ? c.warn : null, () => llqaGo("sales", "fees")),
    card("cover", "🔁", "Leave cover", needCover, needCover ? "classes need a substitute (today/tomorrow)" : "no teacher away without cover", needCover ? c.danger : null, () => llqaGo("timetable", "leavecover")),
    card("req", "📨", "Parent requests", reqWaiting, askWaiting + " approval" + (askWaiting === 1 ? "" : "s") + " waiting for parents", reqWaiting ? c.warn : null, () => llqaGo("sales", "requests")),
    card(
      "hol",
      holNow && (holNow.kind || "holiday") === "ramadan" ? "🌙" : "🗓",
      "Holidays",
      holNow ? holNow.name || "Holiday" : holNext ? llqaDateLabel(holNext.from) : "—",
      holNow ? (llqaHolidayOn(today) ? "today" : "tomorrow") + " · " + ((holNow.kind || "holiday") === "holiday" ? "no classes" : "classes run") : holNext ? holNext.name || "next holiday" : "none planned — add Eid / Ramadan dates",
      holNow && (holNow.kind || "holiday") === "holiday" ? c.warn : null,
      () => llqaGo("timetable", "holidays"),
    ),
  );
};

/* ============================================================
   v66 — Part 4: holidays & Ramadan, teacher leave → cover,
   at-risk radar, follow-up autopilot, monthly fee cycle, teacher
   scorecards, parent requests & approvals. Logic only.
   ============================================================ */

/* ---------- fast lookups (rebuilt only when that list changes) ---------- */
const llqaMemo = (fn) => {
  const cache = new WeakMap();
  return (list) => {
    if (!Array.isArray(list)) return fn([]);
    let v = cache.get(list);
    // (also rebuilt if the same list grew or shrank in place)
    if (!v || v.n !== list.length) {
      v = { n: list.length, v: fn(list) };
      cache.set(list, v);
    }
    return v.v;
  };
};
// A result reused while every dependency is the very same value (lists are
// replaced, never changed in place, when data changes); kept per owner object.
const llqaCacheRoot = {};
const llqaCacheOwners = new WeakMap();
const llqaCachedFor = (owner, key, deps, fn) => {
  let m;
  if (owner && typeof owner === "object") {
    m = llqaCacheOwners.get(owner);
    if (!m) {
      m = new Map();
      llqaCacheOwners.set(owner, m);
    }
  } else {
    m = llqaCacheRoot.m || (llqaCacheRoot.m = new Map());
  }
  const hit = m.get(key);
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.v;
  const v = fn();
  m.delete(key);
  m.set(key, { deps, v });
  if (m.size > 80) m.delete(m.keys().next().value);
  return v;
};
const llqaCached = (key, deps, fn) => llqaCachedFor(null, key, deps, fn);
const llqaLen = (a) => (Array.isArray(a) ? a.length : -1);
// Today's Pakistan date, worked out at most every 15 seconds (it is asked
// for once per student and per class on busy screens).
const llqaTodayMemo = { at: 0, v: "" };
const llqaToday = () => {
  const n = Date.now();
  if (!llqaTodayMemo.v || Math.abs(n - llqaTodayMemo.at) > 15000) {
    llqaTodayMemo.v = todayPK();
    llqaTodayMemo.at = n;
  }
  return llqaTodayMemo.v;
};
// Daily progress per student (newest first) and per "student|date".
const llqaDpIndex = llqaMemo((dp) => {
  const byStu = new Map();
  const byKey = new Map();
  dp.forEach((p) => {
    if (!p || p.studentId == null) return;
    const k = String(p.studentId);
    if (!byStu.has(k)) byStu.set(k, []);
    byStu.get(k).push(p);
    const kk = k + "|" + p.date;
    if (!byKey.has(kk)) byKey.set(kk, p);
  });
  byStu.forEach((a) => a.sort((x, y) => String(y.date).localeCompare(String(x.date))));
  return { byStu, byKey };
});
const llqaDpOf = (dp, sid) => llqaDpIndex(dp).byStu.get(String(sid)) || [];
// Message log per student, and every message key already used.
const llqaLogIndex = llqaMemo((log) => {
  const byStu = new Map();
  const keys = new Set();
  log.forEach((m) => {
    if (!m) return;
    if (m.key) keys.add(m.key);
    if (m.studentId == null) return;
    const k = String(m.studentId);
    if (!byStu.has(k)) byStu.set(k, []);
    byStu.get(k).push(m);
  });
  return { byStu, keys };
});
// Payments per student.
const llqaPayIndex = llqaMemo((pays) => {
  const m = new Map();
  pays.forEach((p) => {
    if (!p || p.studentId == null) return;
    const k = String(p.studentId);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(p);
  });
  return m;
});
const llqaLoadCache = new WeakMap();
const llqaLoadOf = (t) => {
  let v = llqaLoadCache.get(t);
  if (!v) {
    v = LLQABooking.countLoad(t);
    llqaLoadCache.set(t, v);
  }
  return v;
};
// Cloud lists loaded in this session, nothing waiting to send, online.
const llqaReadyFor = (names) => {
  try {
    if (typeof LLQACloud !== "undefined" && LLQACloud.ready && names.some((n) => !LLQACloud.ready(n))) return false;
    const st = typeof LLQASync !== "undefined" && LLQASync.get ? LLQASync.get() : null;
    if (st && st.mode === "cloud" && (st.pending || st.sending)) return false;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  } catch (e) {
    return false;
  }
  return true;
};
const llqaRangeLabel = (from, to) =>
  !from ? "" : !to || to === from ? llqaDateLabel(from) : llqaDateLabel(from) + " – " + llqaDateLabel(to);
const llqaMonthAdd = (ym, n) => {
  const [y, m] = String(ym).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1, 12)).toISOString().slice(0, 7);
};
const llqaMonthLabel = (ym) => {
  try {
    return new Date(ym + "-15T12:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  } catch (e) {
    return ym;
  }
};
// The Pakistan date of a saved time (times are saved in UTC).
const llqaAtDayMemo = new Map();
const llqaAtDay = (iso) => {
  if (!iso) return "";
  let v = llqaAtDayMemo.get(iso);
  if (v === undefined) {
    const d = new Date(iso);
    v = isNaN(d.getTime()) ? String(iso).slice(0, 10) : todayPK(d);
    if (llqaAtDayMemo.size > 20000) llqaAtDayMemo.clear();
    llqaAtDayMemo.set(iso, v);
  }
  return v;
};
const llqaUid = (p) => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// Timetable cells store the family time as "0500 PM USA"; show "05:00 PM USA".
const llqaCellTime = (t) =>
  String(t == null ? "" : t).replace(/\b(\d{1,2})(\d{2})(\s*[AP]M)\b/i, (m, h, mm, ap) => String(h).padStart(2, "0") + ":" + mm + ap.toUpperCase());

/* ---------- holidays & Ramadan (settings/calendar) ---------- */
const LLQA_DAY_KINDS = [
  ["holiday", "Holiday — no classes"],
  ["ramadan", "Ramadan — classes run"],
  ["notice", "Notice only — classes run"],
];
const llqaCalendar = () => {
  const cal = LLQAApp.ctx.calendar || {};
  return (Array.isArray(cal.days) ? cal.days : []).filter((d) => d && d.from);
};
// kind "holiday" = no classes; "ramadan" / "notice" = classes run as usual
const llqaHolidayOn = (date, kind) =>
  llqaCalendar().find((d) => d.from <= date && (d.to || d.from) >= date && (!kind || (d.kind || "holiday") === kind)) || null;
const llqaNextHoliday = (today) =>
  llqaCalendar()
    .filter((d) => (d.kind || "holiday") === "holiday" && (d.to || d.from) >= today)
    .sort((a, b) => String(a.from).localeCompare(String(b.from)))[0] || null;
// How many closed (holiday) days fall between two dates, overlaps counted once.
const llqaClosedDays = (from, to) => {
  const parts = llqaCalendar()
    .filter((d) => (d.kind || "holiday") === "holiday")
    .map((d) => [d.from > from ? d.from : from, (d.to || d.from) < to ? d.to || d.from : to])
    .filter(([a, b]) => a <= b)
    .sort((x, y) => String(x[0]).localeCompare(String(y[0])));
  let n = 0;
  let end = "";
  parts.forEach(([a, b]) => {
    const start = end && a <= end ? llqaAddDays(end, 1) : a;
    if (start <= b) n += (llqaDays(start, b) || 0) + 1;
    if (!end || b > end) end = b;
  });
  return n;
};
const llqaDatesIn = (from, to, max) => {
  const out = [];
  for (let d = from; d <= (to || from) && out.length < (max || 62); d = llqaAddDays(d, 1)) out.push(d);
  return out;
};

/* ---------- teacher leave → cover ---------- */
// A teacher's leave on a date (pending or approved; never rejected).
const llqaLeaveOn = (teacher, date) => {
  if (!teacher) return null;
  return (
    (LLQAApp.ctx.leaves || []).find(
      (l) =>
        l &&
        l.from &&
        ((l.teacherId != null && l.teacherId !== "" && String(l.teacherId) === String(teacher.id)) || (!!l.teacherName && l.teacherName === teacher.name)) &&
        l.from <= date &&
        (l.to || l.from) >= date &&
        String(l.status || "pending") !== "rejected",
    ) || null
  );
};
const llqaCoverKey = (date, teacherId, rowDay, slot) => "c_" + date + "_" + teacherId + "_" + rowDay + "_" + String(slot).replace(":", "");
const llqaCoverIndex = llqaMemo((covers) => new Map(covers.filter((x) => x && x.id).map((x) => [x.id, x])));
const llqaCoverOn = (date, teacherId, rowDay, slot) =>
  llqaCoverIndex(LLQAApp.ctx.covers).get(llqaCoverKey(date, teacherId, rowDay, slot)) || null;
// Teachers who can take one class on one date: free then in their Timetable
// (inside their shift), not teaching or covering another class at that time,
// not on leave, and suitable for the course. The substitute named on the leave
// form comes first, then the usual teacher's gender, then the lighter week.
const llqaCoverOptions = (it, date, dayItems) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const all = ctx.teachers || [];
  const orig = all.find((t) => String(t.id) === String(it.teacherId)) || { id: it.teacherId, name: it.teacher };
  const subs = String(it.cell.sub || "").split(",").map((x) => x.trim()).filter(Boolean);
  const ok = llqaDeptOk(it.cell.c === "Subject" ? "Subject" : "Quran", subs);
  const items = dayItems || llqaClassesOn(date, all, ctx.students, ctx.dailyProgress);
  const busy = new Set();
  items.forEach((x) => {
    if (x.slot !== it.slot || x.key === it.key) return;
    if (x.covered) busy.add(String(x.cover.coverId));
    else if (!x.off && !x.holiday) busy.add(String(x.teacherId));
  });
  const leave = it.tLeave || llqaLeaveOn(orig, date);
  const want = leave && leave.substitute ? String(leave.substitute).trim().toLowerCase() : "";
  return all
    .filter((t) => t && String(t.id) !== String(it.teacherId) && B.isActive(t) && ok(t) && !busy.has(String(t.id)) && !llqaLeaveOn(t, date))
    .filter((t) => B.slotInfo(t, it.rowDay, it.slot).state === "free")
    .map((t) => ({
      t,
      load: llqaLoadOf(t),
      pref: !!want && (String(t.name || "").trim().toLowerCase() === want || String(t.code || "").trim().toLowerCase() === want),
      same: !!orig.gender && t.gender === orig.gender,
    }))
    .sort((a, b) => b.pref - a.pref || b.same - a.same || a.load.booked - b.load.booked || String(a.t.name).localeCompare(String(b.t.name)));
};
const llqaCoverRecord = (it, date, patch) => {
  const u = LLQAApp.ctx.user || {};
  return {
    id: llqaCoverKey(date, it.teacherId, it.rowDay, it.slot),
    date,
    rowDay: it.rowDay,
    slot: it.slot,
    famTime: it.famTime || "",
    tz: it.tz || "",
    teacherId: it.teacherId,
    teacher: it.teacher,
    coverId: null,
    cover: "",
    cancelled: false,
    sid: it.cell && it.cell.sid != null && it.cell.sid !== "" ? it.cell.sid : it.stu ? it.stu.id : null,
    leaveId: it.tLeave && it.tLeave.id != null ? it.tLeave.id : null, // ignored if that leave is cancelled
    keep: false,
    student: (it.cell && it.cell.s) || "",
    course: (it.cell && it.cell.c) || "",
    by: u.name || u.role || "",
    at: new Date().toISOString(),
    auto: false,
    ...(patch || {}),
  };
};
// Saves cover decisions (a substitute, class off, or "needs cover" again).
const llqaSaveCovers = (recs) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setCovers !== "function" || !recs.length) return false;
  const ids = new Set(recs.map((r) => r.id));
  ctx.setCovers((prev) => [...(prev || []).filter((x) => !ids.has(x.id)), ...recs]);
  return true;
};
const llqaAssignCover = (it, date, t, auto) =>
  llqaSaveCovers([llqaCoverRecord(it, date, { coverId: t.id, cover: t.name, auto: !!auto })]) ? t.name : null;
const llqaClassOff = (it, date) => llqaSaveCovers([llqaCoverRecord(it, date, { cancelled: true })]);
// The usual teacher takes this class after all (e.g. a half-day leave).
const llqaKeepTeacher = (it, date) => llqaSaveCovers([llqaCoverRecord(it, date, { keep: true })]);
// "Needs cover" again — kept as a record so automatic cover leaves it to you.
const llqaUncover = (it, date) => llqaSaveCovers([llqaCoverRecord(it, date, { manual: true })]);
// Every class on these dates whose teacher is on leave and that has no
// decision yet gets the best free teacher (one class per teacher per time).
const llqaPlanCovers = (dates, onlyApproved) => {
  const ctx = LLQAApp.ctx;
  const recs = [];
  const missing = [];
  (dates || []).forEach((date) => {
    if (llqaHolidayOn(date, "holiday")) return;
    const items = llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress);
    items.forEach((it) => {
      if (!it.tLeave || it.covered || it.off || it.kept || it.onLeave || it.quit || it.entry) return;
      // automatic cover never changes a decision already made (unless its
      // substitute is now on leave too); "Cover all" covers every open class
      if (onlyApproved && it.cover && !it.subAway) return;
      if (onlyApproved && (String(it.tLeave.status) !== "approved" || it.tLeave.halfDay)) return;
      const taken = new Set(recs.filter((r) => r.date === date && r.slot === it.slot).map((r) => String(r.coverId)));
      const opt = llqaCoverOptions(it, date, items).find((o) => !taken.has(String(o.t.id)));
      if (opt) recs.push(llqaCoverRecord(it, date, { coverId: opt.t.id, cover: opt.t.name, auto: !!onlyApproved }));
      else missing.push({ date, it });
    });
  });
  return { recs, missing };
};
const llqaCoverDates = (n) => {
  const t = todayPK();
  return llqaDatesIn(t, llqaAddDays(t, (n || 2) - 1));
};
// Automatic cover (on unless turned off): approved leave, today and tomorrow.
const llqaCoverRunAuto = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage()) return null;
  if ((ctx.automation || {}).coverAuto === false) return null;
  if (!llqaReadyFor(["teachers", "students", "leaves", "covers", "doc:settings/automation", "doc:settings/calendar"])) return null;
  const res = llqaPlanCovers(llqaCoverDates(2), true);
  if (!res.recs.length) return null;
  llqaSaveCovers(res.recs);
  llqaToast({
    kind: "covers",
    key: "covers",
    covers: res.recs,
    text:
      "🔁 Teacher on leave: " + res.recs.length + " class" + (res.recs.length === 1 ? "" : "es") + " given to a substitute automatically" +
      (res.missing.length ? " · " + res.missing.length + " still need a teacher" : "") + ". Tell the substitutes and families?",
  });
  return res;
};
// WhatsApp per substitute listing the classes they take.
const llqaCoverTeacherItems = (covers) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const by = new Map();
  (covers || []).filter((x) => x && x.coverId != null && x.coverId !== "").forEach((x) => {
    const k = String(x.coverId);
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(x);
  });
  return [...by.entries()].map(([tid, list]) => {
    const t = (ctx.teachers || []).find((y) => String(y.id) === tid) || { name: list[0].cover };
    const lines = list
      .sort((a, b) => String(a.date + a.slot).localeCompare(String(b.date + b.slot)))
      .map((x) => "• " + llqaDateLabel(x.date) + " " + B.fmt12(x.slot) + " PKT — " + x.student + (x.course ? " (" + x.course + ")" : "") + ", for " + x.teacher);
    return {
      student: { name: t.name || "Teacher", parent: t.name || "", phone: t.phone || "", country: "Pakistan" },
      template: "coverTeacher",
      extra: { name: t.name || "", moves: lines.join("\n") },
    };
  });
};
const llqaCoverFamilyItems = (covers) =>
  (covers || [])
    .filter((x) => x && x.sid != null && (x.cancelled || (x.coverId != null && x.coverId !== "")))
    .map((x) => ({
      studentId: x.sid,
      template: x.cancelled ? "classOff" : "coverFamily",
      key: (x.cancelled ? "off:" : "cov:") + x.id,
      extra: {
        date: llqaDateLabel(x.date),
        cover: x.cover || "",
        teacherName: x.teacher || "",
        time: [x.famTime ? x.rowDay + " " + x.famTime : "", x.tz ? llqaZoneLabel(x.tz) + " time" : ""].filter(Boolean).join(" "),
      },
    }));
// A teacher's classes in a date range: their own, and the ones they cover
// for someone else (those need a new substitute if this teacher is away).
const llqaTeacherClasses = (t, from, to) => {
  const ctx = LLQAApp.ctx;
  let own = 0;
  let covering = 0;
  llqaDatesIn(from, to || from, 62).forEach((d) => {
    if (llqaHolidayOn(d, "holiday")) return;
    own += llqaClassesOn(d, [t], ctx.students, ctx.dailyProgress).filter((it) => !it.onLeave && !it.quit).length;
    covering += (ctx.covers || []).filter((x) => x && x.date === d && !x.cancelled && x.coverId != null && String(x.coverId) === String(t.id)).length;
  });
  return { own, covering, text: own + " class" + (own === 1 ? "" : "es") + (covering ? " + " + covering + " they cover for others" : "") };
};
// After a leave is approved: what it means for the Timetable.
const llqaLeaveApproved = (leave) => {
  if (!leave || !leave.from) return;
  const ctx = LLQAApp.ctx;
  const t = (ctx.teachers || []).find((x) => String(x.id) === String(leave.teacherId) || x.name === leave.teacherName);
  if (!t) return;
  const load = llqaTeacherClasses(t, leave.from, leave.to);
  const n = load.own + load.covering;
  llqaToast({
    kind: "leaveCover",
    key: "leave-" + leave.id,
    text:
      "✓ Leave approved for " + t.name + " (" + llqaRangeLabel(leave.from, leave.to) + "): " + load.text + " in that time." +
      (!n
        ? ""
        : leave.halfDay
          ? " Half-day leave: for each class choose a substitute or “Teacher takes it” in Leave Cover."
          : (ctx.automation || {}).coverAuto !== false
            ? " Today's and tomorrow's get a substitute automatically; plan the rest in Leave Cover."
            : " Choose substitutes in Leave Cover."),
  });
  if (n && !leave.halfDay) setTimeout(() => llqaCoverRunAuto(), 2500);
};

/* ---------- monthly fee cycle ---------- */
const LLQA_FEE_GRACE = 5;
// A payment counts for the month it was recorded for (Fee Cycle saves it),
// otherwise for the month it was paid in.
const llqaPayMonth = (p) => String((p && (p.month || p.paidDate)) || "").slice(0, 7);
// A family that was with the academy before being added to the CRM: the
// registration date is more than 2 weeks before the day they were added
// (or marked so). No welcome / first-class messages, and fees start from the
// next due day after they were added — earlier months were settled outside.
const llqaExisting = (s) =>
  !!s &&
  (s.existing === true ||
    (s.existing !== false && !!s.addedAt && !!s.dor && (llqaDays(String(s.dor).slice(0, 10), String(s.addedAt).slice(0, 10)) || 0) > 14));
// Due day of the month: set by hand, else the day they started paying.
const llqaBillDay = (s) =>
  Math.min(28, Math.max(1, parseInt(s && s.billDay, 10) || parseInt(String((s && (s.billStart || s.convertedAt || s.dor)) || "").slice(8, 10), 10) || 1));
// First day of billing (never during the trial).
const llqaFeeStart = (s) => {
  if (!s) return "";
  const own = String(s.billStart || s.convertedAt || "").slice(0, 10);
  if (own) return own;
  const dor = String(s.dor || "").slice(0, 10);
  if (!llqaExisting(s)) return dor;
  const added = String(s.addedAt).slice(0, 10);
  const dd = String(llqaBillDay(s)).padStart(2, "0");
  const here = added.slice(0, 7) + "-" + dd;
  return here > added ? here : llqaMonthAdd(added.slice(0, 7), 1) + "-" + dd;
};
// One paying student's fee, month by month (newest first, up to 12 months):
// each month is due on the bill day; unpaid 5 days after = overdue; earlier
// unpaid months stay owed.
const llqaFeeCycle = (s, pays, today) => {
  const amt = Number(s && s.fee_amount) || 0;
  if (!s || amt <= 0 || llqaInTrial(s) || s.status === "quit" || s.fee === "n/a") return null;
  const t = today || llqaToday();
  const start = llqaFeeStart(s) || t;
  const startM = start.slice(0, 7);
  const day = llqaBillDay(s);
  const cur = s.currency || "USD";
  const mine = llqaPayIndex(pays).get(String(s.id)) || [];
  const dueOf = (ym) => {
    const d = ym + "-" + String(day).padStart(2, "0");
    return ym === startM && d < start ? start : d;
  };
  // the newest bill that is out (a bill is out a week before its due date)
  let curM = t.slice(0, 7);
  if (llqaAddDays(dueOf(curM), -7) > t) curM = llqaMonthAdd(curM, -1);
  if (curM < startM)
    return { amt, cur, day, start, status: "upcoming", months: [], owed: [], current: null, due: dueOf(startM), left: 0 };
  const months = [];
  for (let ym = curM, k = 0; ym >= startM && k < 12; ym = llqaMonthAdd(ym, -1), k++) {
    const due = dueOf(ym);
    const over = llqaAddDays(due, LLQA_FEE_GRACE);
    const ps = mine.filter((p) => llqaPayMonth(p) === ym);
    const other = ps.some((p) => p.currency && p.currency !== cur); // another currency: can't compare, counts as paid
    const paid = Math.round(ps.filter((p) => !p.currency || p.currency === cur).reduce((a, p) => a + (Number(p.amount) || 0), 0) * 100) / 100;
    // the fee for that month: what it was when its payment was recorded (a later
    // fee change doesn't reopen a month already paid), else today's fee
    const fee = ps.reduce((m, p) => (Number(p.feeAmount) > 0 ? Math.max(m, Number(p.feeAmount)) : m), 0) || amt;
    const full = other || paid >= fee - 0.005;
    const state = full ? "paid" : t >= over ? "overdue" : paid > 0 ? "partial" : t < due ? "upcoming" : "due";
    months.push({ ym, due, over, paid, fee, left: full ? 0 : Math.round((fee - paid) * 100) / 100, state, pays: ps });
  }
  const current = months[0];
  const owed = months.filter((m) => m.state === "overdue");
  return {
    amt, cur, day, start, months, current, owed,
    status: owed.length ? "overdue" : current.state,
    due: current.due,
    left: Math.round(months.reduce((a, m) => a + m.left, 0) * 100) / 100,
  };
};
// The month a new payment should go to: the oldest one not fully paid.
const llqaFeeNextMonth = (cy) => {
  if (!cy || !cy.months.length) return (cy && cy.start ? cy.start : todayPK()).slice(0, 7);
  const open = cy.months.filter((m) => m.left > 0);
  return open.length ? open[open.length - 1].ym : llqaMonthAdd(cy.current.ym, 1);
};
// Fee Status that matches the cycle (paid = in good standing).
const llqaFeeTarget = (cy) => (!cy ? null : cy.status === "overdue" ? "overdue" : cy.status === "partial" ? "partial" : "paid");
const LLQA_FEE_AUTO_SET = ["paid", "overdue", "partial"];
// Automatic Fee Status (on unless turned off). A status someone changed by hand
// after the automation set it is left alone for the rest of that month.
const llqaFeeRunAuto = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage()) return null;
  if ((ctx.automation || {}).feeAuto === false) return null;
  if (!llqaReadyFor(["students", "arPayments", "doc:settings/automation"])) return null;
  const today = todayPK();
  const changes = [];
  (ctx.students || []).forEach((s) => {
    if (!s || !LLQA_FEE_AUTO_SET.includes(s.fee)) return;
    const cy = llqaFeeCycle(s, ctx.arPayments, today);
    const want = llqaFeeTarget(cy);
    if (!want || want === s.fee) return;
    const m = cy && cy.current ? cy.current.ym : today.slice(0, 7);
    const lock = s.feeAuto;
    if (lock && lock.v !== s.fee && lock.m === m) return;
    changes.push({ s, to: want, m });
  });
  if (!changes.length) return null;
  const at = new Date().toISOString();
  const byId = new Map(changes.map((x) => [String(x.s.id), x]));
  const upd = (x) => {
    const ch = byId.get(String(x.id));
    return ch ? { ...x, fee: ch.to, feeAuto: { v: ch.to, m: ch.m, at } } : x;
  };
  ctx.setStudents((prev) => (prev || []).map(upd));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster(changes.map((x) => upd(x.s)));
  const n = (k) => changes.filter((x) => x.to === k).length;
  llqaToast({
    kind: "fees",
    key: "fees",
    text:
      "💰 Fee Status updated from the fee cycle: " +
      [n("overdue") && n("overdue") + " overdue", n("partial") && n("partial") + " partly paid", n("paid") && n("paid") + " back to paid"].filter(Boolean).join(", ") +
      " (" + changes.slice(0, 4).map((x) => x.s.name).join(", ") + (changes.length > 4 ? "…" : "") + ").",
  });
  return changes;
};
const llqaRecordPayment = (s, f) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setArPayments !== "function" || !s) return null;
  const rec = {
    id: Date.now(),
    studentId: s.id,
    studentName: s.name || "",
    parent: s.parent || "",
    course: s.course || "",
    amount: Math.round((Number(f.amount) || 0) * 100) / 100,
    currency: f.currency || s.currency || "USD",
    paidDate: f.paidDate || todayPK(),
    month: f.month || String(f.paidDate || todayPK()).slice(0, 7),
    gateway: f.gateway || "Bank Transfer",
    receipt: f.receipt || "",
    type: "regular",
    notes: f.notes || "",
    source: "fee-cycle",
    feeAmount: Number(s.fee_amount) || 0, // the monthly fee when this was paid
  };
  ctx.setArPayments((prev) => [...(prev || []), rec]);
  // Fee Status follows straight away (the automatic check would do it later)
  const after = llqaFeeCycle(s, [...(ctx.arPayments || []), rec]);
  const want = llqaFeeTarget(after);
  if (want && want !== s.fee && LLQA_FEE_AUTO_SET.includes(s.fee) && (ctx.automation || {}).feeAuto !== false) {
    const fields = { fee: want, feeAuto: { v: want, m: after && after.current ? after.current.ym : rec.month, at: new Date().toISOString() } };
    ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  }
  return rec;
};

/* ---------- at-risk radar ---------- */
const llqaRisk = (s, dp, today) => {
  if (!s || s.status === "quit" || s.status === "leave") return null;
  const t = today || llqaToday();
  const mine = llqaDpOf(dp, s.id).filter((p) => p.date <= t);
  const reasons = [];
  let score = 0;
  const last4 = mine.slice(0, 4);
  const abs = last4.filter((p) => /^absent/i.test(String(p.attended || ""))).length;
  if (abs >= 2) {
    score += 40;
    reasons.push(abs + " absent in the last " + last4.length + " classes");
  }
  const booked = LLQABooking.scheduleOf(s).length > 0;
  const lastDay = mine[0] ? mine[0].date : s.lastDate || "";
  if (booked && lastDay) {
    let gap = llqaDays(lastDay, t) || 0;
    // closed days (holidays) in between don't count as silence
    if (gap >= 10) gap -= llqaClosedDays(llqaAddDays(lastDay, 1), t);
    if (gap >= 10) {
      score += 35;
      reasons.push("no class logged for " + gap + " days");
    }
  }
  const total = parseInt(s.totalClasses, 10) || 0;
  const att = parseInt(s.attendance, 10);
  if (total >= 5 && !isNaN(att) && att < 70) {
    score += 25;
    reasons.push("attendance " + att + "%");
  }
  const info = llqaTrialInfo(s, { today: t });
  if (info.stalled) {
    score += 30;
    reasons.push("trial not moving (" + info.done + "/" + info.target + ")");
  }
  if (s.fee === "overdue") {
    score += 20;
    reasons.push("fee overdue");
  }
  if (!score) return null;
  const level = score >= 50 ? "high" : score >= 25 ? "medium" : "low";
  const action =
    abs >= 2 || reasons.some((r) => /no class/.test(r))
      ? "Message the family; offer another time or teacher"
      : info.stalled
        ? "Follow up on the trial"
        : s.fee === "overdue"
          ? "Send a fee reminder"
          : "Check in with the family";
  return { score, level, reasons, action, abs, lastDay };
};
const llqaRiskList = (students, dp, today) => {
  const ctx = LLQAApp.ctx;
  const t = today || todayPK();
  return llqaCachedFor(students, "risk", [dp, t, ctx.calendar, ctx.arPayments, llqaLen(students), llqaLen(dp), llqaLen(ctx.arPayments)], () =>
    (students || [])
      .map((s) => ({ s, r: llqaRisk(s, dp, t) }))
      .filter((x) => x.r)
      .sort((a, b) => b.r.score - a.r.score || String(a.s.name).localeCompare(String(b.s.name))),
  );
};

/* ---------- follow-up autopilot: every message due today ---------- */
const llqaMonthStats = (s, dp, today) => {
  const since = llqaAddDays(today, -30);
  const mine = llqaDpOf(dp, s.id).filter((p) => p.date > since && p.date <= today);
  const present = mine.filter((p) => /^(present|late)/i.test(String(p.attended || ""))).length;
  return { classes: mine.length, present, pct: mine.length ? Math.round((present / mine.length) * 100) : null };
};
// Each item has a key; once a message with that key is in the log (sent or
// marked done) it never comes back. One message per family at a time, most
// urgent first.
const llqaAutopilot = (opt) => {
  const o = opt || {};
  const c0 = { ...LLQAApp.ctx, ...o };
  const t = o.today || todayPK();
  if (Object.keys(o).some((k) => k !== "today")) return llqaAutopilotRaw(o);
  return llqaCached(
    "pilot",
    [c0.students, c0.dailyProgress, c0.messageLog, c0.arPayments, c0.covers, c0.calendar, t, llqaLen(c0.students), llqaLen(c0.dailyProgress), llqaLen(c0.messageLog), llqaLen(c0.arPayments), llqaLen(c0.covers)],
    () => llqaAutopilotRaw(o),
  );
};
const llqaAutopilotRaw = (opt) => {
  const ctx = { ...LLQAApp.ctx, ...(opt || {}) };
  const today = ctx.today || todayPK();
  const logx = llqaLogIndex(ctx.messageLog);
  const dp = ctx.dailyProgress || [];
  const out = [];
  const add = (s, template, key, reason, extra, prio) => {
    if (!logx.keys.has(key)) out.push({ studentId: s.id, student: s, template, key, reason, extra: extra || null, prio: prio == null ? 5 : prio });
  };
  const last = (sid, tpl) => llqaLastMsg(ctx.messageLog, sid, tpl);
  const byId = new Map((ctx.students || []).map((s) => [String(s.id), s]));
  // substitute / class off: today and tomorrow
  (ctx.covers || []).forEach((x) => {
    if (!x || x.sid == null || x.date < today || x.date > llqaAddDays(today, 1)) return;
    const s = byId.get(String(x.sid));
    if (!s || s.status === "quit") return;
    const it = llqaCoverFamilyItems([x])[0];
    if (it) add(s, it.template, it.key, (x.cancelled ? "Class off " : x.cover + " teaches ") + llqaDateLabel(x.date) + " (" + x.teacher + " on leave)", it.extra, 0);
  });
  const soon = llqaCalendar().filter((d) => d.from > today && d.from <= llqaAddDays(today, 3) && (d.kind || "holiday") !== "notice");
  (ctx.students || []).forEach((s) => {
    if (!s || s.status === "quit") return;
    const away = s.status === "leave";
    const info = llqaTrialInfo(s, { today, arPayments: ctx.arPayments });
    const booked = LLQABooking.scheduleOf(s).length > 0;
    const mine = llqaDpOf(dp, s.id);
    const old = llqaExisting(s);
    // welcome only for a new family (added in the last 2 weeks, at most one class so far);
    // a family that was with the academy before the CRM gets the Parent Portal intro instead
    const isNew = !old && ((s.dor && llqaDays(s.dor, today) != null && llqaDays(s.dor, today) <= 14) || (parseInt(s.attended, 10) || 0) <= 1);
    if (!away && isNew && !last(s.id, "welcome")) add(s, "welcome", "welcome:" + s.id, "New family — class times and Parent ID", null, 1);
    if (!away && old && !last(s.id, "portalIntro") && !last(s.id, "welcome"))
      add(s, "portalIntro", "intro:" + s.id, "Family from before the CRM — Parent Portal and Parent ID", null, 4);
    const first = mine.length ? mine[mine.length - 1] : null;
    if (!away && !old && first && first.date <= today && llqaDays(first.date, today) <= 7 && !last(s.id, "firstClass"))
      add(s, "firstClass", "first:" + s.id, "First class on " + llqaDateLabel(first.date) + " — ask how it went", null, 3);
    if (info.stage === "complete") {
      add(s, "trialComplete", "trialdone:" + s.id, "Trial classes done (" + info.done + "/" + info.target + ") — fee message", null, 1);
      const sent = last(s.id, "trialComplete");
      if (sent && llqaDays(llqaAtDay(sent.at), today) >= 2)
        add(s, "feeDue", "trialfee2:" + s.id, "Fee message sent " + llqaAgo(sent.at) + ", not enrolled yet", null, 2);
    }
    if (!away)
      mine
        .filter((p) => /^absent/i.test(String(p.attended || "")) && p.date <= today && llqaDays(p.date, today) <= 2)
        .forEach((p) => add(s, "missedClass", "miss:" + s.id + ":" + p.date, "Absent on " + llqaDateLabel(p.date), { date: llqaDateLabel(p.date) }, 2));
    const cy = llqaFeeCycle(s, ctx.arPayments, today);
    if (cy && cy.current) {
      const feeTxt = (x) => x + " " + cy.cur;
      if (cy.owed.length) {
        const oldest = cy.owed[cy.owed.length - 1];
        const week = Math.max(0, Math.floor((llqaDays(oldest.over, today) || 0) / 7));
        const owed = Math.round(cy.owed.reduce((a, m) => a + m.left, 0) * 100) / 100;
        add(s, "feeDue", "fee:" + s.id + ":" + oldest.ym + ":over" + week, "Fee overdue since " + llqaDateLabel(oldest.over) + " (" + feeTxt(owed) + ")",
          { fee: feeTxt(owed) + " (" + cy.owed.map((m) => llqaMonthLabel(m.ym)).reverse().join(", ") + ")" }, 1);
      } else if (cy.current.state === "due" || cy.current.state === "partial") {
        add(s, "feeDue", "fee:" + s.id + ":" + cy.current.ym + ":due", "Fee due " + llqaDateLabel(cy.current.due) + " (" + feeTxt(cy.current.left) + ")",
          { fee: feeTxt(cy.current.left) + " for " + llqaMonthLabel(cy.current.ym) }, 2);
      }
    }
    if (booked && !away)
      soon.forEach((d) =>
        add(s, (d.kind || "holiday") === "ramadan" ? "ramadanNotice" : "holidayNotice", "hol:" + d.id + ":" + s.id,
          (d.name || "Holiday") + " from " + llqaDateLabel(d.from),
          { holiday: d.name || "the holiday", holidayDates: llqaRangeLabel(d.from, d.to), resume: llqaDateLabel(llqaAddDays(d.to || d.from, 1)) }, 2),
      );
    const enrolled = s.convertedAt || (!llqaInTrial(s) && s.fee !== "trial" ? s.dor : "");
    const lastRep = last(s.id, "monthlyReport");
    if (!away && !llqaInTrial(s) && enrolled && llqaDays(enrolled, today) >= 30 && (!lastRep || llqaDays(llqaAtDay(lastRep.at), today) >= 30)) {
      const st = llqaMonthStats(s, dp, today);
      if (st.classes > 0)
        add(s, "monthlyReport", "report:" + s.id + ":" + today.slice(0, 7), "Monthly report (" + st.classes + " classes, " + (st.pct == null ? "—" : st.pct + "% attended") + ")", null, 4);
    }
    const risk = llqaRisk(s, dp, today);
    const lastCheck = last(s.id, "checkIn");
    if (risk && risk.level === "high" && (!lastCheck || llqaDays(llqaAtDay(lastCheck.at), today) >= 7))
      add(s, "checkIn", "risk:" + s.id + ":" + today, "At risk: " + risk.reasons.join(", "), null, 1);
  });
  out.sort((a, b) => a.prio - b.prio || String(a.student.name).localeCompare(String(b.student.name)));
  // one message per family a day: brothers and sisters share a number
  const seen = new Set();
  return out.filter((x) => {
    const k = llqaPhone(x.student.phone, x.student.country) || "s" + x.studentId;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
// Marks an item handled without sending from here (sent another way).
const llqaPilotDone = (it, how) =>
  llqaLogMsg({ channel: how || "manual", studentId: it.studentId, name: (it.student && it.student.name) || "", template: it.template, key: it.key, text: "" });

/* ---------- teacher scorecards ---------- */
const llqaMonthDates = (month, today) =>
  llqaDatesIn(month + "-01", month < today.slice(0, 7) ? llqaAddDays(llqaMonthAdd(month, 1) + "-01", -1) : today, 31);
const llqaScorecards = (month, opt) => {
  const o = opt || {};
  const c0 = { ...LLQAApp.ctx, ...o };
  const t = o.today || todayPK();
  if (Object.keys(o).some((k) => k !== "today")) return llqaScorecardsRaw(month, o);
  return llqaCached(
    "score:" + month,
    [c0.teachers, c0.students, c0.dailyProgress, c0.leaves, c0.covers, c0.calendar, t, Math.floor(llqaNowPkMin() / 10), llqaLen(c0.students), llqaLen(c0.dailyProgress), llqaLen(c0.covers)],
    () => llqaScorecardsRaw(month, o),
  );
};
const llqaScorecardsRaw = (month, opt) => {
  const ctx = { ...LLQAApp.ctx, ...(opt || {}) };
  const today = ctx.today || todayPK();
  const rows = new Map();
  const row = (name) => {
    if (!rows.has(name))
      rows.set(name, { name, scheduled: 0, logged: 0, onTime: 0, present: 0, absent: 0, covered: 0, trials: 0, converted: 0, lostTrials: 0, lost: 0, students: 0, leaveDays: 0 });
    return rows.get(name);
  };
  const tByName = new Map();
  (ctx.teachers || []).filter((t) => LLQABooking.isActive(t)).forEach((t) => {
    row(t.name);
    tByName.set(t.name, t);
  });
  const leaveDays = new Set();
  const nowMin = ctx.nowMin != null ? ctx.nowMin : llqaNowPkMin();
  if (month <= today.slice(0, 7))
    llqaMonthDates(month, today).forEach((date) => {
      if (llqaHolidayOn(date, "holiday")) return;
      llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress).forEach((it) => {
        if (it.onLeave || it.quit || it.off) return;
        // today: only classes that should be over (40 minutes after the start)
        if (date === today && !it.entry && it.min + 40 > nowMin) return;
        if (it.tLeave && !it.covered) {
          leaveDays.add(it.teacher + "|" + date);
          return;
        }
        const r = row(it.by);
        r.scheduled++;
        if (it.covered) r.covered++;
        if (it.entry) {
          r.logged++;
          const at = llqaAtDay(it.entry.createdAt || it.entry.updatedAt || it.entry.timestamp || "");
          const late = at ? llqaDays(date, at) : null;
          // saved the same day or the next (night classes); older records have no time
          if (late == null || late <= 1) r.onTime++;
          if (/^(present|late)/i.test(String(it.entry.attended || ""))) r.present++;
          else if (/^absent/i.test(String(it.entry.attended || ""))) r.absent++;
        }
      });
    });
  leaveDays.forEach((k) => {
    const name = k.slice(0, k.lastIndexOf("|"));
    if (rows.has(name)) rows.get(name).leaveDays++;
  });
  (ctx.students || []).forEach((s) => {
    if (!s || !s.teacher || !rows.has(s.teacher)) return;
    const r = rows.get(s.teacher);
    if (s.status !== "quit") r.students++;
    if (String(s.convertedAt || "").slice(0, 7) === month && s.trialOutcome === "converted") {
      r.trials++;
      r.converted++;
    } else if (s.status === "quit" && String(s.qDate || "").slice(0, 7) === month && s.trialOutcome === "quit") {
      r.trials++;
      r.lostTrials++;
    }
    if (s.status === "quit" && String(s.qDate || "").slice(0, 7) === month) r.lost++;
  });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  return [...rows.values()]
    .map((r) => {
      const loggedPct = pct(r.logged, r.scheduled);
      const onTimePct = pct(r.onTime, r.logged);
      const attPct = pct(r.present, r.present + r.absent);
      const convPct = pct(r.converted, r.trials);
      const parts = [[loggedPct, 40], [onTimePct, 20], [attPct, 20], [convPct, 20]].filter((p) => p[0] != null);
      const w = parts.reduce((a, p) => a + p[1], 0);
      const score = w && r.scheduled ? Math.round(parts.reduce((a, p) => a + p[0] * p[1], 0) / w) : null;
      const t = tByName.get(r.name) || {};
      return { ...r, teamLead: t.teamLead || "", code: t.code || "", loggedPct, onTimePct, attPct, convPct, score };
    })
    .sort((a, b) => (b.score == null ? -1 : b.score) - (a.score == null ? -1 : a.score) || b.scheduled - a.scheduled || String(a.name).localeCompare(String(b.name)));
};

/* ---------- parent requests & approvals ---------- */
const LLQA_REQ_KINDS = { leave: "Leave", time: "Change class time", message: "Message", proposal: "Approval asked" };
const LLQA_REQ_SOURCES = { portal: "Parent Portal", whatsapp: "WhatsApp", call: "Phone call", dialer: "Dialer", academy: "Academy" };
const llqaApprovalLink = (s, reqId) => {
  const base = llqaPortalLink(LLQAApp.ctx.messaging);
  if (!s || !s.parentId) return base;
  return base + (base.includes("?") ? "&" : "?") + "parent=" + encodeURIComponent(s.parentId) + (reqId ? "&req=" + encodeURIComponent(reqId) : "");
};
// An approval link opens the Parent Portal for that family (…?parent=P-XXXX).
const llqaLinkParent = () => {
  try {
    return String(new URLSearchParams(window.location.search).get("parent") || "").trim().toUpperCase();
  } catch (e) {
    return "";
  }
};
const llqaLinkRequest = () => {
  try {
    return String(new URLSearchParams(window.location.search).get("req") || "");
  } catch (e) {
    return "";
  }
};
const llqaReqText = (r) => {
  const B = LLQABooking;
  if (!r) return "";
  if (r.type === "leave") return "Leave " + llqaRangeLabel(r.from, r.to) + (r.text ? " — " + r.text : "");
  if (r.type === "time") return "Class time → " + [r.wantDay, r.wantTime ? B.timeLabel(r.wantTime) : ""].filter(Boolean).join(" ") + (r.text ? " — " + r.text : "");
  return r.text || "";
};
const llqaAddRequest = (s, data) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setParentRequests !== "function" || !s) return null;
  const u = ctx.user || {};
  const rec = {
    id: llqaUid("r"),
    studentId: s.id,
    student: s.name || "",
    parentId: s.parentId || "",
    parent: s.parent || "",
    status: "pending",
    source: u.role === "parent" ? "portal" : "academy",
    createdAt: new Date().toISOString(),
    createdBy: u.role === "parent" ? "parent" : u.name || u.role || "",
    ...data,
  };
  ctx.setParentRequests((prev) => [...(prev || []), rec]);
  return rec;
};
const llqaDecide = (id, patch) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setParentRequests !== "function") return;
  const u = ctx.user || {};
  ctx.setParentRequests((prev) =>
    (prev || []).map((r) =>
      r.id === id ? { ...r, ...patch, decidedAt: new Date().toISOString(), decidedBy: u.role === "parent" ? "parent" : u.name || u.role || "" } : r,
    ),
  );
};
// Approving a leave request puts the student on leave for those dates (the
// same fields the Students page uses).
const llqaApproveLeave = (r, reply) => {
  const ctx = LLQAApp.ctx;
  const s = llqaFindStudent(r.studentId);
  if (!s) return false;
  // a leave that starts later is scheduled: the student stays active until the first day
  const later = r.from > todayPK();
  const fields = { lvType: "Parent request", lvFrom: r.from, lvTo: r.to || r.from, lvReason: r.text || "Parent request", lvPlanned: later, ...(later ? {} : { status: "leave" }) };
  ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  llqaDecide(r.id, { status: "approved", reply: reply || "" });
  return true;
};
// Scheduled leave starts on its first day (admin side, once the students have loaded).
const llqaLeaveStartRun = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage() || !llqaReadyFor(["students"])) return null;
  const today = todayPK();
  const due = (ctx.students || []).filter((s) => s && s.lvPlanned && s.lvFrom && s.lvFrom <= today && s.status !== "quit");
  if (!due.length) return null;
  const upd = (x) => {
    if (!x || !x.lvPlanned || !x.lvFrom || x.lvFrom > today || x.status === "quit") return x;
    // already over (nobody opened the CRM during it): just clear the plan
    return x.lvTo && x.lvTo < today ? { ...x, lvPlanned: false } : { ...x, status: "leave", lvPlanned: false };
  };
  ctx.setStudents((prev) => (prev || []).map(upd));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster(due.map(upd));
  const started = due.filter((x) => !(x.lvTo && x.lvTo < today));
  if (started.length)
    llqaToast({ kind: "info", ttl: 12000, text: "🏖 Leave starts today for " + started.map((x) => x.name + " (to " + llqaDateLabel(x.lvTo || x.lvFrom) + ")").join(", ") + "." });
  return due;
};
// Requests that need the academy (proposals wait for the parent instead).
const llqaPendingRequests = (list) => (list || []).filter((r) => r && r.status === "pending" && r.type !== "proposal");

/* ============================================================
   v66 — Part 5: screens. Timetable: Leave Cover, Holidays,
   Scorecards. Sales: Autopilot (+ at-risk radar), Fee Cycle,
   Requests. Parent Portal: Requests & approvals.
   ============================================================ */
const LLQA_GATEWAYS = ["Bank Transfer", "Credit/Debit Card", "PayPal", "Stripe", "Wise", "Zelle", "Cash", "Western Union", "Other"];
const llqaTh = (t) =>
  React.createElement("th", { key: t, style: { textAlign: "left", padding: "8px 10px", color: c.textSec, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid " + c.border, whiteSpace: "nowrap" } }, t);
const llqaTd = (kids, k, st) =>
  React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + c.border + "66", fontSize: 12, color: c.text, verticalAlign: "middle", ...(st || {}) } }, kids);
const llqaTable = (heads, rows) =>
  React.createElement(
    "div",
    { style: { overflowX: "auto" } },
    React.createElement(
      "table",
      { style: { width: "100%", borderCollapse: "collapse" } },
      React.createElement("thead", null, React.createElement("tr", null, heads.map(llqaTh))),
      React.createElement("tbody", null, rows),
    ),
  );
const llqaSmall = (text, col, key) => React.createElement("div", { key, style: { color: col || c.textMuted, fontSize: 10, marginTop: 2 } }, text);
const llqaSelectStyle = { padding: "5px 8px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 7, color: c.text, fontSize: 11 };
const llqaSel = (value, onChange, options, opt) =>
  React.createElement(
    "select",
    { key: (opt && opt.key) || "sel", value, onChange: (e) => onChange(e.target.value), onClick: (e) => e.stopPropagation(), title: (opt && opt.title) || "", style: { ...llqaSelectStyle, ...((opt && opt.style) || {}) } },
    options.map((o) => (Array.isArray(o) ? React.createElement("option", { key: o[0], value: o[0] }, o[1]) : React.createElement("option", { key: o, value: o }, o))),
  );
// On/off card for one automation (saved in settings/automation; on by default).
const llqaAutoSwitch = (key, title, onText, offText) => {
  const ctx = LLQAApp.ctx;
  const on = (ctx.automation || {})[key] !== false;
  const manage = llqaCanManage();
  return llqaCard(
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" } },
      React.createElement(
        "div",
        { style: { flex: "1 1 400px" } },
        React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, "🤖 " + title + " — " + (on ? "ON" : "OFF")),
        React.createElement("div", { style: { color: c.textSec, fontSize: 11, marginTop: 3, lineHeight: 1.5 } }, on ? onText : offText),
      ),
      manage
        ? llqaMini(on ? "Turn off" : "Turn on", () => {
            if (typeof ctx.setAutomation === "function") ctx.setAutomation({ ...(ctx.automation || {}), [key]: !on });
          }, { big: true, tone: "success", solid: !on, key: "sw" })
        : null,
    ),
    { border: on ? c.success + "66" : c.border, key: "sw-" + key },
  );
};
const llqaWho = (s) => [s.parent, s.name && s.name !== s.parent ? s.name : ""].filter(Boolean).join(" · ");

/* ---------- record a fee payment ---------- */
const LLQAPaymentModal = ({ studentId, month, onClose }) => {
  const ctx = LLQAApp.ctx;
  const s = llqaFindStudent(studentId) || {};
  const cy = llqaFeeCycle(s, ctx.arPayments);
  const first = month || llqaFeeNextMonth(cy);
  const info = cy ? cy.months.find((m) => m.ym === first) : null;
  const amt = cy ? cy.amt : Number(s.fee_amount) || 0;
  const [f, setF] = useState({
    amount: String(info ? info.left || amt : amt || ""),
    currency: s.currency || "USD",
    month: first,
    paidDate: todayPK(),
    gateway: "Bank Transfer",
    receipt: "",
    notes: "",
    tell: true,
  });
  const opts = [];
  const seen = new Set();
  const addM = (ym) => {
    if (!ym || seen.has(ym)) return;
    seen.add(ym);
    const m = cy ? cy.months.find((x) => x.ym === ym) : null;
    opts.push({ value: ym, label: llqaMonthLabel(ym) + (m ? (m.left > 0 ? " — " + m.left + " " + (cy.cur || "") + " left" : " — paid") : "") });
  };
  (cy ? cy.months.slice().reverse() : []).forEach((m) => addM(m.ym));
  addM(first);
  const base = cy && cy.current ? cy.current.ym : todayPK().slice(0, 7);
  addM(llqaMonthAdd(base, 1));
  addM(llqaMonthAdd(base, 2));
  const digits = llqaPhone(s.phone, s.country);
  const save = () => {
    if (!(Number(f.amount) > 0)) {
      alert("Enter the amount received.");
      return;
    }
    const rec = llqaRecordPayment(s, f);
    if (!rec) {
      alert("Payments can't be saved from here.");
      return;
    }
    onClose();
    if (f.tell && digits)
      llqaOpen("message", { studentId: s.id, template: "feeReceipt", extra: { amount: rec.amount + " " + rec.currency, month: llqaMonthLabel(rec.month) } });
    else llqaToast({ kind: "info", ttl: 6000, text: "✓ Payment recorded: " + rec.amount + " " + rec.currency + " for " + llqaMonthLabel(rec.month) + " (" + s.name + ")." });
  };
  return llqaShell(
    "💰 Record payment — " + (s.name || ""),
    (s.parent ? s.parent + " · " : "") + (cy ? "Fee " + cy.amt + " " + cy.cur + " a month, due on day " + cy.day + (cy.left ? " · " + cy.left + " " + cy.cur + " owed now" : " · nothing owed") : "No monthly fee set for this student"),
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0 10px" } },
        React.createElement(Inp, { label: "Amount received", type: "number", value: f.amount, onChange: (v) => setF({ ...f, amount: v }) }),
        React.createElement(Inp, { label: "Currency", value: f.currency, onChange: (v) => setF({ ...f, currency: v }), options: ["USD", "CAD", "GBP", "EUR", "AED", "PKR"] }),
        React.createElement(Inp, { label: "For month", value: f.month, onChange: (v) => setF({ ...f, month: v }), options: opts }),
        React.createElement(Inp, { label: "Date received", type: "date", value: f.paidDate, onChange: (v) => setF({ ...f, paidDate: v }) }),
        React.createElement(Inp, { label: "Paid by", value: f.gateway, onChange: (v) => setF({ ...f, gateway: v }), options: LLQA_GATEWAYS }),
        React.createElement(Inp, { label: "Receipt / reference (optional)", value: f.receipt, onChange: (v) => setF({ ...f, receipt: v }) }),
      ),
      React.createElement(Inp, { label: "Note (optional)", value: f.notes, onChange: (v) => setF({ ...f, notes: v }) }),
      React.createElement(
        "label",
        { style: { display: "flex", gap: 8, alignItems: "center", color: digits ? c.text : c.textMuted, fontSize: 12, cursor: "pointer" } },
        React.createElement("input", { type: "checkbox", checked: f.tell && !!digits, disabled: !digits, onChange: (e) => setF({ ...f, tell: e.target.checked }) }),
        digits ? "Then send a thank-you / receipt on WhatsApp" : "No usable WhatsApp number for this family",
      ),
      React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 8 } }, "Saved in Accounts Receivable too. The Fee Status follows the fee cycle by itself."),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("✓ Save payment", save, { key: "ok", big: true, solid: true, tone: "success" }),
    ],
    { onClose, width: 640 },
  );
};

/* ---------- log a request that came by WhatsApp / a call ---------- */
const llqaStudentOptions = () =>
  (LLQAApp.ctx.students || [])
    .filter((s) => s && s.status !== "quit")
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((s) => ({ value: String(s.id), label: s.name + (s.parent ? " — " + s.parent : "") + (s.code ? " (" + s.code + ")" : "") }));
const LLQALogRequestModal = ({ studentId, source, onClose }) => {
  const B = LLQABooking;
  const [f, setF] = useState({
    sid: studentId != null ? String(studentId) : "",
    source: source || "whatsapp",
    type: "leave",
    from: todayPK(),
    to: todayPK(),
    wantDay: "Mon",
    wantTime: "0500 PM",
    text: "",
  });
  const s = llqaFindStudent(f.sid);
  const save = () => {
    if (!s) {
      alert("Choose the student.");
      return;
    }
    if (f.type === "leave" && (!f.from || (f.to && f.to < f.from))) {
      alert("Check the leave dates.");
      return;
    }
    if (f.type === "message" && !f.text.trim()) {
      alert("Write what the parent asked.");
      return;
    }
    const data = { type: f.type, source: f.source, text: f.text.trim() };
    if (f.type === "leave") Object.assign(data, { from: f.from, to: f.to || f.from });
    if (f.type === "time") Object.assign(data, { wantDay: f.wantDay, wantTime: f.wantTime });
    const rec = llqaAddRequest(s, data);
    onClose();
    if (rec) llqaToast({ kind: "info", ttl: 6000, text: "✓ Request logged for " + s.name + " (" + LLQA_REQ_SOURCES[f.source] + "). It's in Sales → Requests." });
  };
  return llqaShell(
    "📨 Log a parent request",
    "For requests that came by WhatsApp, a phone call or the dialer — so everything is answered in one place.",
    React.createElement(
      "div",
      null,
      React.createElement(Inp, { label: "Student", value: f.sid, onChange: (v) => setF({ ...f, sid: v }), options: llqaStudentOptions() }),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "Came by", value: f.source, onChange: (v) => setF({ ...f, source: v }), options: [{ value: "whatsapp", label: "WhatsApp" }, { value: "call", label: "Phone call" }, { value: "dialer", label: "Dialer" }] }),
        React.createElement(Inp, { label: "Request", value: f.type, onChange: (v) => setF({ ...f, type: v }), options: [{ value: "leave", label: "Leave" }, { value: "time", label: "Change class time" }, { value: "message", label: "Other / message" }] }),
      ),
      f.type === "leave"
        ? React.createElement(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" } },
            React.createElement(Inp, { label: "From", type: "date", value: f.from, onChange: (v) => setF({ ...f, from: v, to: f.to && f.to < v ? v : f.to }) }),
            React.createElement(Inp, { label: "To", type: "date", value: f.to, onChange: (v) => setF({ ...f, to: v }) }),
          )
        : null,
      f.type === "time"
        ? React.createElement(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" } },
            React.createElement(Inp, { label: "Day wanted (family's day)", value: f.wantDay, onChange: (v) => setF({ ...f, wantDay: v }), options: B.DAYS }),
            React.createElement(Inp, { label: "Time wanted (family's time)", value: f.wantTime, onChange: (v) => setF({ ...f, wantTime: v }), options: B.TIMES.map((t) => ({ value: t, label: B.timeLabel(t) })) }),
          )
        : null,
      React.createElement("textarea", { value: f.text, onChange: (e) => setF({ ...f, text: e.target.value }), rows: 3, placeholder: f.type === "leave" ? "Reason (optional)" : "What the parent said", style: llqaTextStyle }),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("✓ Log request", save, { key: "ok", big: true, solid: true, tone: "accent" }),
    ],
    { onClose, width: 560 },
  );
};

/* ---------- ask a parent to approve something (WhatsApp link) ---------- */
const LLQA_ASK_IDEAS = [
  ["time", "New class time", "We'd like to move {student}'s class to a new time: ___ (your time). Is that okay for you?"],
  ["teacher", "Change of teacher", "We'd like {student} to continue with a new teacher, ___, at the same time. Is that okay for you?"],
  ["makeup", "Make-up class", "We can arrange a make-up class for {student} on ___ at ___ (your time). Is that okay for you?"],
  ["fee", "Fee change", "From next month, {student}'s fee will be ___ per month. Do you agree?"],
];
const LLQAAskModal = ({ studentId, text, onClose }) => {
  const [sid, setSid] = useState(studentId != null ? String(studentId) : "");
  const [t, setT] = useState(text || "");
  const s = llqaFindStudent(sid);
  const send = () => {
    if (!s) {
      alert("Choose the student.");
      return;
    }
    if (!t.trim() || /___/.test(t)) {
      alert("Fill in the blanks (___) in the message first.");
      return;
    }
    const rec = llqaAddRequest(s, { type: "proposal", text: t.trim(), source: "academy" });
    if (!rec) return;
    onClose();
    llqaOpen("message", {
      studentId: s.id,
      template: "approvalAsk",
      msgKey: "ask:" + rec.id,
      extra: { proposal: t.trim(), approvalLink: llqaApprovalLink(s, rec.id) },
    });
  };
  return llqaShell(
    "✉ Ask a parent to approve",
    "The parent gets a WhatsApp with a link. It opens their Parent Portal, where they tap Approve or Decline — you see the answer here at once. If they just reply on WhatsApp, mark it yourself.",
    React.createElement(
      "div",
      null,
      React.createElement(Inp, { label: "Student", value: sid, onChange: setSid, options: llqaStudentOptions() }),
      s && !s.parentId
        ? React.createElement("div", { style: { color: c.warn, fontSize: 11, marginTop: -6, marginBottom: 8 } }, "⚠ This family has no Parent ID yet, so the link can't open their portal — they can still reply on WhatsApp.")
        : null,
      React.createElement(
        "div",
        { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 } },
        LLQA_ASK_IDEAS.map(([k, label, tx]) => llqaMini(label, () => setT(tx.split("{student}").join(s ? s.name : "your child")), { key: k })),
      ),
      React.createElement("textarea", { value: t, onChange: (e) => setT(e.target.value), rows: 4, placeholder: "What should the parent approve?", style: llqaTextStyle }),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("💬 Create & open WhatsApp", send, { key: "ok", big: true, solid: true, tone: "success" }),
    ],
    { onClose, width: 600 },
  );
};

/* ---------- Timetable: Leave Cover ---------- */
const LLQALeaveCoverTab = (props) => {
  const ctx = llqaCtx(props);
  const today = todayPK();
  const [days, setDays] = useState(14);
  const manage = llqaCanManage();
  const end = llqaAddDays(today, days - 1);
  const tById = new Map((ctx.teachers || []).map((t) => [String(t.id), t]));
  const leaves = (ctx.leaves || [])
    .filter((l) => l && l.from && (l.to || l.from) >= today && l.from <= end && String(l.status || "pending") !== "rejected")
    .sort((a, b) => String(a.from).localeCompare(String(b.from)));
  const cache = new Map();
  const itemsOn = (d) => {
    if (!cache.has(d)) cache.set(d, llqaClassesOn(d, ctx.teachers, ctx.students, ctx.dailyProgress));
    return cache.get(d);
  };
  const isT = (l, it) => (l.teacherId != null && l.teacherId !== "" ? String(it.teacherId) === String(l.teacherId) : it.teacher === l.teacherName);
  const blocks = leaves.map((l) => {
    const t = tById.get(String(l.teacherId)) || (ctx.teachers || []).find((x) => x.name === l.teacherName) || { name: l.teacherName };
    const dates = llqaDatesIn(l.from < today ? today : l.from, (l.to || l.from) > end ? end : l.to || l.from);
    const rows = [];
    dates.forEach((d) => {
      if (llqaHolidayOn(d, "holiday")) return;
      itemsOn(d)
        .filter((it) => isT(l, it) && !it.onLeave && !it.quit)
        .forEach((it) => rows.push({ d, it, st: llqaClassState(it, d) }));
    });
    return { l, t, rows };
  });
  const allRows = blocks.flatMap((b) => b.rows);
  const need = allRows.filter((r) => r.st.k === "cover");
  const covered = allRows.filter((r) => r.it.covered);
  const off = allRows.filter((r) => r.it.off);
  const coverDates = [...new Set(need.map((r) => r.d))];
  const doCover = (dates) => {
    const res = llqaPlanCovers(dates, false);
    if (res.recs.length) llqaSaveCovers(res.recs);
    llqaToast(
      res.recs.length
        ? { kind: "covers", key: "covers", covers: res.recs, text: "🔁 " + res.recs.length + " class" + (res.recs.length === 1 ? "" : "es") + " given to substitutes" + (res.missing.length ? " · " + res.missing.length + " have no free teacher then" : "") + "." }
        : { kind: "info", ttl: 7000, text: "No free teacher for those classes — mark them off, or move them with 📅 Change classes." },
    );
  };
  const decided = (rows) => rows.map((r) => r.it.cover).filter((x) => x && (x.cancelled || (x.coverId != null && x.coverId !== "")));
  const coverSelect = (r) => {
    const opts = llqaCoverOptions(r.it, r.d, itemsOn(r.d));
    return React.createElement(
      "select",
      {
        key: "cs",
        value: "",
        onChange: (e) => {
          const o = opts.find((x) => String(x.t.id) === e.target.value);
          if (o) llqaAssignCover(r.it, r.d, o.t, false);
        },
        style: { ...llqaSelectStyle, border: "1px solid " + (opts.length ? c.accent : c.danger) + "88", maxWidth: 230 },
      },
      React.createElement("option", { value: "" }, r.it.covered ? "Change substitute…" : opts.length ? "🔁 Choose substitute (" + opts.length + " free)…" : "No teacher free then"),
      opts.map((o) => React.createElement("option", { key: o.t.id, value: String(o.t.id) }, (o.pref ? "★ " : "") + o.t.name + " · " + (o.t.gender || "—") + " · " + o.load.booked + " classes/wk")),
    );
  };
  return React.createElement(
    "div",
    null,
    llqaAutoSwitch(
      "coverAuto",
      "Automatic cover",
      "When a teacher's leave is approved, each of their classes today and tomorrow is given to the best free teacher (free at that time in their Timetable, same course, the substitute named on the leave form first, then the same gender, then the lighter week). You get a notice with buttons to message the substitutes and the families. Anything you decide yourself is never changed.",
      "Nothing is assigned by itself — choose substitutes below or use “Cover all”.",
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Teachers on leave", new Set(blocks.map((b) => b.t.name)).size, "in the next " + days + " days"),
      llqaStat("Need a substitute", need.length, "classes", need.length ? c.danger : c.text),
      llqaStat("Covered", covered.length, "classes", covered.length ? c.success : c.text),
      llqaStat("Class off", off.length, "families told separately"),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" } },
      llqaChips([[7, "Next 7 days"], [14, "14 days"], [30, "30 days"]].map(([k, l]) => [k, l]), days, setDays),
      manage && need.length ? llqaMini("🔁 Cover all " + need.length, () => doCover(coverDates), { big: true, solid: true, tone: "danger", key: "ca" }) : null,
      manage ? llqaMini("＋ Add leave (HR → Teachers)", () => llqaGo("teachers", "leave"), { big: true, key: "add" }) : null,
    ),
    blocks.length === 0
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "✓ No teacher leave in the next " + days + " days. Leaves added in HR → Teachers → Leave show here with every class they affect."))
      : null,
    ...blocks.map((b) => {
      const l = b.l;
      const bNeed = b.rows.filter((r) => r.st.k === "cover");
      const dec = decided(b.rows);
      return llqaCard(
        [
          React.createElement(
            "div",
            { key: "h", style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 8 } },
            React.createElement(
              "div",
              null,
              React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, b.t.name + " · " + (l.type || "Leave") + (l.halfDay ? " (half day)" : "")),
              llqaSmall(llqaRangeLabel(l.from, l.to) + " · " + b.rows.length + " class" + (b.rows.length === 1 ? "" : "es") + " in this window" + (l.substitute ? " · substitute on the form: " + l.substitute : "") + (l.reason ? " · " + l.reason : ""), c.textSec, "s"),
            ),
            React.createElement(
              "div",
              { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
              llqaPill(l.status || "pending", l.status === "approved" ? c.success : c.warn, null, "st"),
              manage && bNeed.length ? llqaMini("🔁 Cover all " + bNeed.length, () => doCover([...new Set(bNeed.map((r) => r.d))]), { key: "c", tone: "danger" }) : null,
              manage && dec.some((x) => x.coverId != null) ? llqaMini("💬 Tell substitutes", () => llqaOpen("queue", { title: "Cover classes — substitutes", items: llqaCoverTeacherItems(dec) }), { key: "ts", tone: "success" }) : null,
              manage && dec.some((x) => x.sid != null) ? llqaMini("💬 Tell families", () => llqaOpen("queue", { title: b.t.name + " on leave — families", items: llqaCoverFamilyItems(dec) }), { key: "tf", tone: "success" }) : null,
            ),
          ),
          l.status !== "approved"
            ? React.createElement("div", { key: "p", style: { color: c.warn, fontSize: 11, marginBottom: 6 } }, "Pending approval — automatic cover starts once it's approved in HR → Teachers → Leave.")
            : l.halfDay
              ? React.createElement("div", { key: "h", style: { color: c.warn, fontSize: 11, marginBottom: 6 } }, "Half-day leave — not covered automatically: for each class choose a substitute, or “Teacher takes it”.")
              : null,
          b.rows.length
            ? React.createElement(
                "div",
                { key: "t" },
                llqaTable(
                  ["Date", "Pakistan", "Family's time", "Student", "Status", "Substitute"],
                  b.rows.map((r) => {
                    const it = r.it;
                    return React.createElement(
                      "tr",
                      { key: r.d + it.key },
                      llqaTd(llqaDateLabel(r.d), "d", { whiteSpace: "nowrap" }),
                      llqaTd(React.createElement("b", null, LLQABooking.fmt12(it.slot)), "p", { whiteSpace: "nowrap" }),
                      llqaTd([React.createElement("div", { key: "f" }, it.famTime ? it.rowDay + " " + it.famTime : "—"), llqaSmall(llqaZoneLabel(it.tz), null, "z")], "f", { whiteSpace: "nowrap" }),
                      llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, it.cell.s), llqaSmall(it.cell.c + (it.cell.sub ? " · " + it.cell.sub : ""), null, "c")], "s"),
                      llqaTd(
                        React.createElement(
                          "span",
                          { style: { color: it.covered || it.kept ? c.success : r.st.col, fontWeight: 700, fontSize: 11 } },
                          it.covered ? "✓ " + it.by + (it.cover.auto ? " (auto)" : "") : it.kept ? "✓ " + it.teacher + " takes it" : r.st.text,
                        ),
                        "st",
                        { whiteSpace: "nowrap" },
                      ),
                      llqaTd(
                        manage && !it.entry && r.d >= today
                          ? React.createElement(
                              "div",
                              { style: { display: "flex", gap: 5, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" } },
                              it.off || it.kept ? null : coverSelect(r),
                              !it.off && !it.covered && !it.kept ? llqaMini("✓ Teacher takes it", () => llqaKeepTeacher(it, r.d), { key: "k", title: "The usual teacher takes this class (e.g. half-day leave)" }) : null,
                              !it.off && !it.covered && !it.kept ? llqaMini("Class off", () => llqaClassOff(it, r.d), { key: "o" }) : null,
                              it.covered || it.off || it.kept ? llqaMini("↺", () => llqaUncover(it, r.d), { key: "u", title: it.covered ? "Remove the substitute" : it.kept ? "Needs cover after all" : "Class back on — needs a teacher" }) : null,
                            )
                          : it.entry
                            ? llqaSmall("logged", c.success)
                            : null,
                        "a",
                      ),
                    );
                  }),
                ),
              )
            : React.createElement("div", { key: "e", style: { color: c.textSec, fontSize: 12 } }, "No classes booked for " + b.t.name + " on these days."),
        ],
        { key: String(l.id), border: bNeed.length ? c.danger + "66" : c.border },
      );
    }),
  );
};

/* ---------- Timetable: Holidays & Ramadan ---------- */
const LLQA_HOLIDAY_NAMES = ["Eid ul Fitr", "Eid ul Adha", "Ramadan", "14 August", "Academy holiday"];
const LLQAHolidaysTab = (props) => {
  const ctx = llqaCtx(props);
  const today = todayPK();
  const manage = llqaCanManage();
  const blank = { name: "", from: today, to: today, kind: "holiday", note: "" };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const [past, setPast] = useState(false);
  const list = llqaCalendar().slice().sort((a, b) => String(a.from).localeCompare(String(b.from)));
  const upcoming = list.filter((d) => (d.to || d.from) >= today);
  const done = list.filter((d) => (d.to || d.from) < today).reverse();
  const save = () => {
    if (!String(f.name).trim()) {
      setMsg("Give it a name (e.g. Eid ul Fitr).");
      return;
    }
    if (!f.from || (f.to && f.to < f.from)) {
      setMsg("Check the dates — the last day can't be before the first.");
      return;
    }
    if (typeof ctx.setCalendar !== "function") {
      setMsg("The calendar can't be saved here.");
      return;
    }
    const u = ctx.user || {};
    const rec = { id: llqaUid("h"), name: String(f.name).trim(), from: f.from, to: f.to || f.from, kind: f.kind, note: String(f.note || "").trim(), at: new Date().toISOString(), by: u.name || u.role || "" };
    ctx.setCalendar((prev) => ({ ...(prev || {}), days: [...((prev && prev.days) || []), rec] }));
    setF({ ...blank });
    setMsg("✓ Added " + rec.name + " (" + llqaRangeLabel(rec.from, rec.to) + ")." + (rec.kind === "holiday" ? " Today's Classes, the at-risk radar and the scorecards skip these days, and families get a notice 3 days before in Autopilot." : ""));
  };
  const del = (d) => {
    if (!confirm("Delete " + (d.name || "this entry") + " (" + llqaRangeLabel(d.from, d.to) + ")?")) return;
    ctx.setCalendar((prev) => ({ ...(prev || {}), days: ((prev && prev.days) || []).filter((x) => x.id !== d.id) }));
  };
  const affected = (d) => {
    const fams = new Map();
    const tchs = new Map();
    let n = 0;
    llqaDatesIn(d.from, d.to || d.from, 40).forEach((date) =>
      llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress).forEach((it) => {
        if (it.onLeave || it.quit) return;
        n++;
        if (it.stu) fams.set(String(it.stu.id), it.stu);
        const t = (ctx.teachers || []).find((x) => String(x.id) === String(it.teacherId));
        if (t) tchs.set(String(t.id), t);
      }),
    );
    return { n, fams: [...fams.values()], tchs: [...tchs.values()] };
  };
  const extra = (d) => ({ holiday: d.name || "the holiday", holidayDates: llqaRangeLabel(d.from, d.to), resume: llqaDateLabel(llqaAddDays(d.to || d.from, 1)) });
  const row = (d, old) => {
    const a = old ? null : affected(d);
    const kind = d.kind || "holiday";
    const tpl = kind === "ramadan" ? "ramadanNotice" : "holidayNotice";
    return React.createElement(
      "div",
      { key: d.id, style: { padding: "10px 0", borderTop: "1px solid " + c.border + "66", opacity: old ? 0.6 : 1 } },
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" } },
        React.createElement(
          "div",
          null,
          React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 700 } }, (kind === "ramadan" ? "🌙 " : kind === "notice" ? "📣 " : "🗓 ") + (d.name || "Holiday") + " · " + llqaRangeLabel(d.from, d.to)),
          llqaSmall(
            (LLQA_DAY_KINDS.find((k) => k[0] === kind) || LLQA_DAY_KINDS[0])[1] + (a ? " · " + a.n + " class" + (a.n === 1 ? "" : "es") + " booked in these days · " + a.fams.length + " famil" + (a.fams.length === 1 ? "y" : "ies") : "") + (d.note ? " · " + d.note : ""),
            c.textSec,
            "s",
          ),
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          manage && a && a.fams.length && kind !== "notice"
            ? llqaMini("💬 Tell families (" + a.fams.length + ")", () => llqaOpen("queue", { title: d.name || "Holiday", items: a.fams.map((s) => ({ studentId: s.id, template: tpl, key: "hol:" + d.id + ":" + s.id, extra: extra(d) })) }), { key: "f", tone: "success" })
            : null,
          manage && a && a.tchs.length && kind === "holiday"
            ? llqaMini("💬 Tell teachers (" + a.tchs.length + ")", () =>
                llqaOpen("queue", {
                  title: (d.name || "Holiday") + " — teachers",
                  items: a.tchs.map((t) => ({ student: { name: t.name, parent: t.name, phone: t.phone || "", country: "Pakistan" }, template: "holidayTeachers", extra: { name: t.name, ...extra(d) } })),
                }), { key: "t", tone: "success" })
            : null,
          manage ? llqaMini("✕", () => del(d), { key: "x", tone: "danger", title: "Delete" }) : null,
        ),
      ),
    );
  };
  return React.createElement(
    "div",
    null,
    manage
      ? llqaCard([
          llqaH("🗓 Add a holiday, Ramadan or notice", "Holiday = academy closed (no classes). Ramadan / notice = classes run; families get a message. Eid dates depend on the moon — add or change them once announced."),
          React.createElement(
            "div",
            { key: "q", style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 } },
            LLQA_HOLIDAY_NAMES.map((n) => llqaMini(n, () => setF({ ...f, name: n, kind: n === "Ramadan" ? "ramadan" : f.kind === "ramadan" ? "holiday" : f.kind }), { key: n, tone: f.name === n ? "accent" : undefined })),
          ),
          React.createElement(
            "div",
            { key: "f", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0 10px" } },
            React.createElement(Inp, { label: "Name", value: f.name, onChange: (v) => setF({ ...f, name: v }), placeholder: "e.g. Eid ul Fitr" }),
            React.createElement(Inp, { label: "First day", type: "date", value: f.from, onChange: (v) => setF({ ...f, from: v, to: !f.to || f.to < v ? v : f.to }) }),
            React.createElement(Inp, { label: "Last day", type: "date", value: f.to, onChange: (v) => setF({ ...f, to: v }) }),
            React.createElement(Inp, { label: "Type", value: f.kind, onChange: (v) => setF({ ...f, kind: v }), options: LLQA_DAY_KINDS.map(([k, l]) => ({ value: k, label: l })) }),
          ),
          React.createElement(Inp, { key: "n", label: "Note for the team (optional)", value: f.note, onChange: (v) => setF({ ...f, note: v }) }),
          React.createElement(
            "div",
            { key: "b", style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } },
            llqaMini("＋ Add to calendar", save, { big: true, solid: true, tone: "accent", key: "s" }),
            msg ? React.createElement("span", { key: "m", style: { color: /^✓/.test(msg) ? c.success : c.warn, fontSize: 11 } }, msg) : null,
          ),
        ])
      : null,
    llqaCard([
      llqaH("Coming up", upcoming.length ? upcoming.length + " entr" + (upcoming.length === 1 ? "y" : "ies") : "Nothing planned yet"),
      ...upcoming.map((d) => row(d, false)),
    ]),
    done.length
      ? llqaCard([
          React.createElement(
            "div",
            { key: "h", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", { style: { color: c.textSec, fontSize: 12, fontWeight: 700 } }, "Past (" + done.length + ")"),
            llqaMini(past ? "Hide" : "Show", () => setPast(!past), { key: "t" }),
          ),
          ...(past ? done.map((d) => row(d, true)) : []),
        ])
      : null,
  );
};

/* ---------- Timetable: teacher scorecards ---------- */
const LLQAScorecardsTab = (props) => {
  const ctx = llqaCtx(props);
  const today = todayPK();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [lead, setLead] = useState("all");
  const months = [0, 1, 2, 3, 4, 5].map((k) => llqaMonthAdd(today.slice(0, 7), -k));
  const all = llqaScorecards(month, { today });
  const leads = [...new Set(all.map((r) => r.teamLead).filter(Boolean))].sort();
  const rows = all.filter((r) => lead === "all" || r.teamLead === lead);
  const tot = rows.reduce((a, r) => ({ sch: a.sch + r.scheduled, log: a.log + r.logged, conv: a.conv + r.converted, tri: a.tri + r.trials, lost: a.lost + r.lost }), { sch: 0, log: 0, conv: 0, tri: 0, lost: 0 });
  const pc = (v) => (v == null ? "—" : v + "%");
  const col = (v) => (v == null ? c.textMuted : v >= 90 ? c.success : v >= 70 ? c.warn : c.danger);
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaSel(month, setMonth, months.map((m) => [m, llqaMonthLabel(m) + (m === today.slice(0, 7) ? " (so far)" : "")]), { key: "m" }),
      leads.length ? llqaSel(lead, setLead, [["all", "All team leads"], ...leads.map((x) => [x, "Team: " + x])], { key: "l" }) : null,
      React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "Score = classes logged 40% · logged on time 20% · student attendance 20% · trials won 20% (parts with no data are left out)."),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Classes", tot.sch, "scheduled up to today (no holidays, no leave)"),
      llqaStat("Logged", pc(tot.sch ? Math.round((tot.log / tot.sch) * 100) : null), tot.log + " of " + tot.sch, col(tot.sch ? Math.round((tot.log / tot.sch) * 100) : null)),
      llqaStat("Trials won", tot.conv + " / " + tot.tri, "this month"),
      llqaStat("Students lost", tot.lost, "quit this month", tot.lost ? c.danger : c.text),
    ),
    llqaCard(
      rows.length
        ? llqaTable(
            ["#", "Teacher", "Score", "Classes", "Logged", "On time", "Attendance", "Trials won", "Lost", "Students", "Covers", "Leave days"],
            rows.map((r, i) =>
              React.createElement(
                "tr",
                { key: r.name },
                llqaTd(r.score == null ? "—" : i + 1, "i"),
                llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, r.name), llqaSmall([r.code, r.teamLead && "Team " + r.teamLead].filter(Boolean).join(" · "), null, "c")], "n"),
                llqaTd(React.createElement("span", { style: { fontSize: 16, fontWeight: 800, color: col(r.score) } }, r.score == null ? "—" : r.score), "s"),
                llqaTd(r.scheduled, "sc"),
                llqaTd(React.createElement("span", { style: { color: col(r.loggedPct), fontWeight: 700 } }, pc(r.loggedPct) + (r.scheduled ? " (" + r.logged + ")" : "")), "lg"),
                llqaTd(React.createElement("span", { style: { color: col(r.onTimePct) } }, pc(r.onTimePct)), "ot"),
                llqaTd(React.createElement("span", { style: { color: col(r.attPct) } }, pc(r.attPct)), "at"),
                llqaTd(r.trials ? r.converted + " / " + r.trials : "—", "tr"),
                llqaTd(React.createElement("span", { style: { color: r.lost ? c.danger : c.text } }, r.lost), "lo"),
                llqaTd(r.students, "st"),
                llqaTd(r.covered || "—", "cv"),
                llqaTd(r.leaveDays || "—", "lv"),
              ),
            ),
          )
        : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No active teachers."),
    ),
    React.createElement("div", { style: { color: c.textMuted, fontSize: 10 } }, "Classes come from the Timetable for each day (a cover counts for the teacher who took it). Logged = attendance saved for that class; on time = saved the same day or the next. Attendance = present or late out of logged classes. Trials won = trials enrolled as paid this month; lost = students who quit this month."),
  );
};

/* ---------- Sales: Autopilot + at-risk radar ---------- */
const LLQAAutopilotTab = (props) => {
  const ctx = llqaCtx(props);
  const today = todayPK();
  const risky = llqaRiskList((ctx.students || []).filter((s) => s && s.status !== "quit"), ctx.dailyProgress, today);
  const [lv, setLv] = useState(() => (risky.some((x) => x.r.level === "high") ? "high" : "all"));
  const [kind, setKind] = useState("all");
  const items = llqaAutopilot({ today });
  const kinds = [...new Set(items.map((x) => x.template))];
  const shown = items.filter((x) => kind === "all" || x.template === kind);
  const sendable = shown.filter((x) => llqaPhone(x.student.phone, x.student.country));
  const sentToday = (ctx.messageLog || []).filter((m) => m && m.key && llqaAtDay(m.at) === today).length;
  const riskShown = risky.filter((x) => lv === "all" || x.r.level === lv);
  const lvCol = { high: c.danger, medium: c.warn, low: c.textSec };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Due today", items.length, "one message per family", items.length ? c.accent : c.text),
      llqaStat("Handled today", sentToday, "sent or marked done"),
      llqaStat("At risk", risky.filter((x) => x.r.level === "high").length, risky.length + " to watch in total", risky.some((x) => x.r.level === "high") ? c.danger : c.text),
    ),
    llqaCard([
      llqaH("🤖 Today's follow-ups", "Worked out from trials, classes, absences, the fee cycle, holidays and leave cover. A message never comes back once it's sent or marked done."),
      React.createElement(
        "div",
        { key: "b", style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
        llqaChips([["all", "All", items.length], ...kinds.map((k) => [k, llqaTplName(k), items.filter((x) => x.template === k).length])], kind, setKind),
        sendable.length
          ? llqaMini("💬 Send " + sendable.length + " — one click each", () =>
              llqaOpen("queue", { title: "Autopilot", items: sendable.map((x) => ({ studentId: x.studentId, student: x.student, template: x.template, key: x.key, extra: x.extra })) }),
            { big: true, solid: true, tone: "success", key: "all" })
          : null,
      ),
      shown.length === 0
        ? React.createElement("div", { key: "e", style: { color: c.success, fontSize: 12 } }, "✓ Nothing due — every follow-up for today is done.")
        : React.createElement(
            "div",
            { key: "t" },
            llqaTable(
              ["Family", "Message", "Why", ""],
              shown.map((x) => {
                const s = x.student;
                const digits = llqaPhone(s.phone, s.country);
                return React.createElement(
                  "tr",
                  { key: x.key },
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, s.name), llqaSmall((s.parent || "—") + (digits ? " · +" + digits : " · ⚠ no usable number"), digits ? null : c.danger, "p")], "a"),
                  llqaTd(llqaPill(llqaTplName(x.template), x.prio <= 1 ? c.danger : x.prio <= 2 ? c.warn : c.accent), "b"),
                  llqaTd(x.reason, "c", { color: c.textSec, fontSize: 11 }),
                  llqaTd(
                    React.createElement(
                      "div",
                      { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                      llqaMini("💬 Send", () => llqaOpen("message", { studentId: s.id, student: s, template: x.template, extra: x.extra, msgKey: x.key }), { key: "s", tone: "success", disabled: !digits }),
                      llqaMini("📞", () => llqaCall(digits, { studentId: s.id, name: s.name, template: x.template, key: x.key }), { key: "c", disabled: !digits, title: "Call (counts as done)" }),
                      llqaMini("✓ Done", () => llqaPilotDone(x), { key: "d", title: "Handled another way — don't suggest it again" }),
                    ),
                    "d",
                    { whiteSpace: "nowrap" },
                  ),
                );
              }),
            ),
          ),
    ]),
    llqaCard([
      llqaH("⚠ At-risk radar", "Students who may leave: absences, no class logged for 10+ days (holidays don't count), attendance under 70%, a trial that isn't moving, or fee overdue."),
      React.createElement(
        "div",
        { key: "c", style: { marginBottom: 10 } },
        llqaChips([["high", "High", risky.filter((x) => x.r.level === "high").length], ["medium", "Medium", risky.filter((x) => x.r.level === "medium").length], ["low", "Low", risky.filter((x) => x.r.level === "low").length], ["all", "All", risky.length]], lv, setLv),
      ),
      riskShown.length === 0
        ? React.createElement("div", { key: "e", style: { color: c.success, fontSize: 12 } }, "✓ No students at this level.")
        : React.createElement(
            "div",
            { key: "t" },
            llqaTable(
              ["Student", "Risk", "Why", "Last class", "Suggested", ""],
              riskShown.map(({ s, r }) => {
                const digits = llqaPhone(s.phone, s.country);
                return React.createElement(
                  "tr",
                  { key: s.id },
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, s.name), llqaSmall([s.parent, s.teacher].filter(Boolean).join(" · "), null, "p")], "a"),
                  llqaTd(llqaPill(r.level + " · " + r.score, lvCol[r.level]), "b"),
                  llqaTd(r.reasons.join(" · "), "c", { color: c.textSec, fontSize: 11 }),
                  llqaTd(r.lastDay ? llqaDateLabel(r.lastDay) : "—", "d", { whiteSpace: "nowrap" }),
                  llqaTd(r.action, "e", { color: c.textSec, fontSize: 11 }),
                  llqaTd(
                    React.createElement(
                      "div",
                      { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                      llqaMini("💬", () => llqaOpen("message", { studentId: s.id, template: r.reasons.some((x) => /fee/.test(x)) && r.reasons.length === 1 ? "feeDue" : "checkIn" }), { key: "m", tone: "success", disabled: !digits, title: "Message" }),
                      llqaMini("📞", () => llqaCall(digits, { studentId: s.id, name: s.name }), { key: "c", disabled: !digits, title: "Call" }),
                      llqaMini("📅", () => llqaOpen("reschedule", { studentId: s.id }), { key: "r", title: "Change classes" }),
                    ),
                    "f",
                    { whiteSpace: "nowrap" },
                  ),
                );
              }),
            ),
          ),
    ]),
  );
};

/* ---------- Sales: Fee Cycle ---------- */
const LLQA_FEE_STATES = {
  overdue: ["Overdue", "danger"],
  due: ["Due", "warn"],
  partial: ["Part paid", "warn"],
  upcoming: ["Upcoming", "textSec"],
  paid: ["Paid", "success"],
};
const LLQAFeeCycleTab = (props) => {
  const ctx = llqaCtx(props);
  const today = todayPK();
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const live = (ctx.students || []).filter((s) => s && s.status !== "quit");
  const rows = live.map((s) => ({ s, cy: llqaFeeCycle(s, ctx.arPayments, today) })).filter((x) => x.cy);
  const noFee = live.filter((s) => !llqaInTrial(s) && !(Number(s.fee_amount) > 0) && s.fee !== "n/a").length;
  const sum = (list, pick) => {
    const by = {};
    list.forEach((x) => {
      const v = pick(x);
      if (v > 0) by[x.cy.cur] = Math.round(((by[x.cy.cur] || 0) + v) * 100) / 100;
    });
    const ks = Object.keys(by);
    return ks.length ? ks.map((k) => by[k] + " " + k).join(" · ") : "0";
  };
  const month = today.slice(0, 7);
  const collected = sum(rows, (x) => x.cy.months.filter((m) => m.ym === month).reduce((a, m) => a + m.paid, 0));
  const ql = q.trim().toLowerCase();
  const FILT = [
    ["all", "All", () => true],
    ["overdue", "Overdue", (x) => x.cy.status === "overdue"],
    ["due", "Due now", (x) => x.cy.status === "due"],
    ["partial", "Part paid", (x) => x.cy.status === "partial"],
    ["upcoming", "Upcoming", (x) => x.cy.status === "upcoming"],
    ["paid", "Paid", (x) => x.cy.status === "paid"],
  ];
  const test = (FILT.find((x) => x[0] === f) || FILT[0])[2];
  const order = { overdue: 0, due: 1, partial: 2, upcoming: 3, paid: 4 };
  const shown = rows
    .filter((x) => test(x) && (!ql || [x.s.name, x.s.parent, x.s.code, x.s.phone].some((v) => String(v || "").toLowerCase().includes(ql))))
    .sort((a, b) => order[a.cy.status] - order[b.cy.status] || String(a.cy.due).localeCompare(String(b.cy.due)));
  const remind = shown.filter((x) => (x.cy.status === "overdue" || x.cy.status === "due" || x.cy.status === "partial") && llqaPhone(x.s.phone, x.s.country));
  const setDay = (s, v) => {
    const d = Math.min(28, Math.max(1, parseInt(v, 10) || 1));
    const fields = { billDay: d };
    ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  };
  const feeTxt = (x) => {
    const cy = x.cy;
    if (cy.owed.length) return { fee: cy.owed.reduce((a, m) => a + m.left, 0) + " " + cy.cur + " (" + cy.owed.map((m) => llqaMonthLabel(m.ym)).reverse().join(", ") + ")" };
    if (cy.current) return { fee: cy.current.left + " " + cy.cur + " for " + llqaMonthLabel(cy.current.ym) + " (due " + llqaDateLabel(cy.current.due) + ")" };
    return null;
  };
  const stPill = (st) => {
    const d = LLQA_FEE_STATES[st] || [st, "textSec"];
    return llqaPill(d[0], c[d[1]]);
  };
  return React.createElement(
    "div",
    null,
    llqaAutoSwitch(
      "feeAuto",
      "Automatic Fee Status",
      "Each paying student's fee is due every month on their due day (the day they enrolled, up to the 28th). Unpaid " + LLQA_FEE_GRACE + " days after the due day, the Fee Status becomes “overdue”; a part payment makes it “partial”; once the month is paid it goes back to “paid”. Payments recorded here or in Accounts Receivable count. If you change a Fee Status by hand, it's left alone for that month.",
      "Fee Status is not changed by itself. The cycle below still shows who owes what, and Autopilot still suggests reminders.",
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Overdue", rows.filter((x) => x.cy.status === "overdue").length, sum(rows.filter((x) => x.cy.status === "overdue"), (x) => x.cy.owed.reduce((a, m) => a + m.left, 0)), rows.some((x) => x.cy.status === "overdue") ? c.danger : c.text),
      llqaStat("Due now", rows.filter((x) => x.cy.status === "due" || x.cy.status === "partial").length, "within the " + LLQA_FEE_GRACE + " grace days", rows.some((x) => x.cy.status === "due") ? c.warn : c.text),
      llqaStat("Collected — " + llqaMonthLabel(month), collected, "for this month's fees", c.success),
      llqaStat("Paying students", rows.length, noFee ? noFee + " without a fee amount" : "all have a fee amount", noFee ? c.warn : c.text),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaSearch(q, setQ, "Search name, parent, code, phone…"),
      remind.length
        ? llqaMini("💬 Remind " + remind.length, () =>
            llqaOpen("queue", {
              title: "Fee reminders",
              items: remind.map((x) => ({
                studentId: x.s.id,
                student: x.s,
                template: "feeDue",
                extra: feeTxt(x),
                key: x.cy.owed.length
                  ? "fee:" + x.s.id + ":" + x.cy.owed[x.cy.owed.length - 1].ym + ":over" + Math.max(0, Math.floor((llqaDays(x.cy.owed[x.cy.owed.length - 1].over, today) || 0) / 7))
                  : "fee:" + x.s.id + ":" + x.cy.current.ym + ":due",
              })),
            }),
          { big: true, tone: "success", key: "r" })
        : null,
    ),
    React.createElement("div", { style: { marginBottom: 10 } }, llqaChips(FILT.map(([k, l, t]) => [k, l, rows.filter(t).length]), f, setF)),
    llqaCard(
      shown.length === 0
        ? React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, rows.length ? "Nobody here." : "No paying students with a fee amount yet. Trials join the cycle when they're enrolled as paid.")
        : llqaTable(
            ["Student", "Fee", "Due day", "Latest bill", "Owed", "Status", ""],
            shown.map((x) => {
              const s = x.s;
              const cy = x.cy;
              const digits = llqaPhone(s.phone, s.country);
              const cur = cy.current;
              return React.createElement(
                "tr",
                { key: s.id },
                llqaTd([
                  React.createElement("div", { key: "n", style: { fontWeight: 700 } }, s.name),
                  llqaSmall([s.parent, s.code].filter(Boolean).join(" · ") + " · billed from " + llqaDateLabel(cy.start) + (llqaExisting(s) ? " (joined before the CRM)" : ""), null, "p"),
                  llqaCanManage() ? React.createElement("div", { key: "b", style: { marginTop: 3 } }, llqaMini("⚙ Billing", () => llqaOpen("billing", { studentId: s.id }), { key: "bs", title: "Due day and the first billed day" })) : null,
                ], "a"),
                llqaTd(cy.amt + " " + cy.cur, "b", { whiteSpace: "nowrap" }),
                llqaTd(
                  llqaCanManage()
                    ? llqaSel(String(cy.day), (v) => setDay(s, v), Array.from({ length: 28 }, (_, i) => [String(i + 1), "Day " + (i + 1)]), { key: "dd", title: "Fee due on this day each month" })
                    : "Day " + cy.day,
                  "c",
                ),
                llqaTd(
                  cur
                    ? [React.createElement("div", { key: "m" }, llqaMonthLabel(cur.ym) + " · due " + llqaDateLabel(cur.due)), llqaSmall(cur.paid ? "paid " + cur.paid + " " + cy.cur : "nothing paid yet", cur.paid ? c.success : null, "p")]
                    : "starts " + llqaDateLabel(cy.due),
                  "d",
                ),
                llqaTd(
                  cy.left
                    ? [React.createElement("div", { key: "l", style: { fontWeight: 700, color: cy.owed.length ? c.danger : c.text } }, cy.left + " " + cy.cur), cy.owed.length ? llqaSmall("overdue: " + cy.owed.map((m) => llqaMonthLabel(m.ym)).reverse().join(", "), c.danger, "o") : null]
                    : React.createElement("span", { style: { color: c.success } }, "—"),
                  "e",
                ),
                llqaTd([stPill(cy.status), s.fee !== llqaFeeTarget(cy) && LLQA_FEE_AUTO_SET.includes(s.fee) ? llqaSmall("Fee Status now: " + s.fee, c.warn, "fs") : null], "f"),
                llqaTd(
                  React.createElement(
                    "div",
                    { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                    llqaMini("💰 Record", () => llqaOpen("payment", { studentId: s.id }), { key: "p", tone: "success" }),
                    cy.left ? llqaMini("💬", () => llqaOpen("message", { studentId: s.id, template: "feeDue", extra: feeTxt(x) }), { key: "m", disabled: !digits, title: "Fee reminder" }) : null,
                    llqaMini("📞", () => llqaCall(digits, { studentId: s.id, name: s.name }), { key: "c", disabled: !digits, title: "Call" }),
                  ),
                  "g",
                  { whiteSpace: "nowrap" },
                ),
              );
            }),
          ),
    ),
  );
};

/* ---------- Sales: parent requests & approvals ---------- */
const LLQARequestsTab = (props) => {
  const ctx = llqaCtx(props);
  const [f, setF] = useState("open");
  const [reply, setReply] = useState({});
  const list = (ctx.parentRequests || []).filter(Boolean).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const FILT = [
    ["open", "Waiting for you", (r) => r.status === "pending" && r.type !== "proposal"],
    ["asked", "Waiting for parents", (r) => r.status === "pending" && r.type === "proposal"],
    ["answered", "Answered by parents", (r) => r.type === "proposal" && r.status !== "pending"],
    ["done", "Done", (r) => r.status !== "pending" && r.type !== "proposal"],
    ["all", "All", () => true],
  ];
  const shown = list.filter((FILT.find((x) => x[0] === f) || FILT[0])[2]);
  const answer = (r, decision) => {
    const s = llqaFindStudent(r.studentId);
    if (!s) return;
    llqaOpen("message", { studentId: s.id, template: "requestReply", extra: { request: (LLQA_REQ_KINDS[r.type] || "request").toLowerCase() + (r.type === "leave" ? " " + llqaRangeLabel(r.from, r.to) : ""), decision } });
  };
  const decide = (r, status, how) => {
    const note = String(reply[r.id] || "").trim();
    if (r.type === "leave" && status === "approved") {
      if (!llqaApproveLeave(r, note)) {
        alert("This student is no longer in the list.");
        return;
      }
    } else llqaDecide(r.id, { status, reply: note });
    if (how !== false)
      answer(r, (status === "approved" ? (r.type === "leave" ? "approved — no classes " + llqaRangeLabel(r.from, r.to) + ", and they continue as usual after that" : "done") : "we're sorry, we can't arrange this") + (note ? ". " + note : ""));
  };
  const card = (r) => {
    const s = llqaFindStudent(r.studentId);
    const digits = s ? llqaPhone(s.phone, s.country) : "";
    const open = r.status === "pending";
    const col = r.status === "approved" ? c.success : r.status === "declined" ? c.danger : r.type === "proposal" ? c.accent : c.warn;
    return llqaCard(
      [
        React.createElement(
          "div",
          { key: "h", style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" } },
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } },
              llqaPill(LLQA_REQ_KINDS[r.type] || r.type, col, null, "k"),
              React.createElement("b", { key: "n", style: { color: c.text, fontSize: 13 } }, r.student + (r.parent ? " — " + r.parent : "")),
              llqaPill(LLQA_REQ_SOURCES[r.source] || r.source || "—", c.textSec, null, "s"),
            ),
            React.createElement("div", { style: { color: c.text, fontSize: 12, marginTop: 6, whiteSpace: "pre-wrap" } }, llqaReqText(r)),
            llqaSmall(
              (r.type === "proposal" ? "Asked " : "Received ") + llqaAgo(r.createdAt) + (r.createdBy && r.createdBy !== "parent" ? " · by " + r.createdBy : "") +
                (!open ? " · " + r.status + (r.decidedBy ? " by " + (r.decidedBy === "parent" ? "the parent" : r.decidedBy) : "") + " " + llqaAgo(r.decidedAt) : "") +
                (r.reply ? " · “" + r.reply + "”" : ""),
              null,
              "m",
            ),
          ),
          React.createElement("div", { style: { color: col, fontSize: 11, fontWeight: 700 } }, open ? (r.type === "proposal" ? "Waiting for the parent" : "Waiting for you") : r.status === "approved" ? "✓ Approved" : r.status === "declined" ? "✕ Declined" : "✓ Done"),
        ),
        open && r.type !== "proposal"
          ? React.createElement("input", {
              key: "r",
              value: reply[r.id] || "",
              onChange: (e) => setReply({ ...reply, [r.id]: e.target.value }),
              placeholder: "Note for the parent (optional) — shown in their portal",
              style: { ...llqaSelectStyle, width: "100%", boxSizing: "border-box", marginTop: 8, padding: "7px 10px" },
            })
          : null,
        React.createElement(
          "div",
          { key: "b", style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 } },
          open && r.type === "leave" ? llqaMini("✓ Approve leave", () => decide(r, "approved"), { key: "a", tone: "success", solid: true }) : null,
          open && r.type === "time" && s
            ? llqaMini("📅 Change classes", () =>
                llqaOpen("reschedule", {
                  studentId: s.id,
                  want: r.wantDay && r.wantTime ? { day: r.wantDay, time: r.wantTime } : null,
                  onDone: () => llqaDecide(r.id, { status: "approved", reply: String(reply[r.id] || "").trim() }),
                }),
              { key: "t", tone: "success", solid: true })
            : null,
          open && (r.type === "message" || r.type === "time") ? llqaMini("✓ Done", () => decide(r, "approved", false), { key: "d", tone: "success" }) : null,
          open && r.type !== "proposal" ? llqaMini("✕ Decline", () => decide(r, "declined"), { key: "x", tone: "danger" }) : null,
          open && r.type === "proposal" && s
            ? llqaMini("🔗 Send the link again", () =>
                llqaOpen("message", { studentId: s.id, template: "approvalAsk", extra: { proposal: r.text, approvalLink: llqaApprovalLink(s, r.id) } }), { key: "l" })
            : null,
          open && r.type === "proposal" ? llqaMini("✓ Parent agreed (replied)", () => llqaDecide(r.id, { status: "approved", reply: "agreed on WhatsApp / call" }), { key: "pa", tone: "success" }) : null,
          open && r.type === "proposal" ? llqaMini("✕ Parent said no", () => llqaDecide(r.id, { status: "declined", reply: "declined on WhatsApp / call" }), { key: "pd", tone: "danger" }) : null,
          s ? llqaMini("💬", () => llqaOpen("message", { studentId: s.id, template: "custom" }), { key: "m", disabled: !digits, title: "Message" }) : null,
          s ? llqaMini("📞", () => llqaCall(digits, { studentId: s.id, name: s.name }), { key: "c", disabled: !digits, title: "Call" }) : null,
          !s ? llqaSmall("Student no longer in the list", c.warn, "ns") : null,
        ),
      ],
      { key: r.id, border: open ? col + "66" : c.border },
    );
  };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaMini("＋ Log a request (WhatsApp / call)", () => llqaOpen("logRequest", {}), { big: true, tone: "accent", key: "l" }),
      llqaMini("✉ Ask a parent to approve", () => llqaOpen("ask", {}), { big: true, tone: "success", key: "a" }),
      React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "Parents can also send requests themselves in the Parent Portal → Requests."),
    ),
    React.createElement("div", { style: { marginBottom: 10 } }, llqaChips(FILT.map(([k, l, t]) => [k, l, list.filter(t).length]), f, setF)),
    shown.length === 0 ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Nothing here.")) : null,
    ...shown.map(card),
  );
};

/* ---------- Parent Portal: requests & approvals ---------- */
const LLQAParentRequests = ({ stu, user }) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const isParent = user && user.role === "parent";
  const kids = isParent ? (ctx.students || []).filter((s) => s && s.parentId && String(s.parentId).toUpperCase() === String(user.parentId || "").toUpperCase() && s.status !== "quit") : stu ? [stu] : [];
  const [sid, setSid] = useState(stu ? String(stu.id) : kids[0] ? String(kids[0].id) : "");
  const [type, setType] = useState("leave");
  const [f, setF] = useState({ from: todayPK(), to: todayPK(), wantDay: "Mon", wantTime: "0500 PM", text: "" });
  const [note, setNote] = useState({});
  const [msg, setMsg] = useState("");
  const s = kids.find((k) => String(k.id) === sid) || stu;
  const ids = new Set(kids.map((k) => String(k.id)));
  if (stu) ids.add(String(stu.id));
  const mine = (ctx.parentRequests || []).filter((r) => r && ids.has(String(r.studentId))).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const asks = mine.filter((r) => r.type === "proposal" && r.status === "pending");
  const linkReq = llqaLinkRequest();
  const send = () => {
    if (!s) return;
    if (type === "leave" && (!f.from || (f.to && f.to < f.from))) {
      setMsg("Please check the dates.");
      return;
    }
    if (type === "message" && !f.text.trim()) {
      setMsg("Please write your message.");
      return;
    }
    const data = { type, text: f.text.trim(), source: isParent ? "portal" : "academy" };
    if (type === "leave") Object.assign(data, { from: f.from, to: f.to || f.from });
    if (type === "time") Object.assign(data, { wantDay: f.wantDay, wantTime: f.wantTime });
    const rec = llqaAddRequest(s, data);
    if (rec) {
      setF({ ...f, text: "" });
      setMsg("✓ Sent to the academy. You'll see the answer here.");
    } else setMsg("Couldn't send — please try again or message the academy on WhatsApp.");
  };
  const box = (kids2, opt) => llqaCard(kids2, opt);
  const status = (r) =>
    r.status === "pending" ? ["Waiting", c.warn] : r.status === "approved" ? [r.type === "proposal" ? "You approved" : "Approved", c.success] : r.status === "declined" ? [r.type === "proposal" ? "You declined" : "Declined", c.danger] : [r.status, c.textSec];
  return React.createElement(
    "div",
    null,
    asks.length
      ? box(
          [
            llqaH("✋ Needs your approval", "The academy asked you about the following. Tap Approve or Decline."),
            ...asks.map((r) =>
              React.createElement(
                "div",
                { key: r.id, style: { padding: "10px 12px", border: "1px solid " + (r.id === linkReq ? c.accent : c.border), borderRadius: 10, marginBottom: 8, background: r.id === linkReq ? c.accentBg : "transparent" } },
                React.createElement("div", { style: { color: c.textSec, fontSize: 11, marginBottom: 4 } }, r.student + " · " + llqaAgo(r.createdAt)),
                React.createElement("div", { style: { color: c.text, fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 8 } }, r.text),
                React.createElement("input", {
                  value: note[r.id] || "",
                  onChange: (e) => setNote({ ...note, [r.id]: e.target.value }),
                  placeholder: "Add a note (optional)",
                  style: { ...llqaSelectStyle, width: "100%", boxSizing: "border-box", marginBottom: 8, padding: "7px 10px" },
                }),
                React.createElement(
                  "div",
                  { style: { display: "flex", gap: 8 } },
                  llqaMini("✓ Approve", () => llqaDecide(r.id, { status: "approved", reply: String(note[r.id] || "").trim() }), { key: "a", big: true, solid: true, tone: "success" }),
                  llqaMini("✕ Decline", () => llqaDecide(r.id, { status: "declined", reply: String(note[r.id] || "").trim() }), { key: "d", big: true, tone: "danger" }),
                ),
              ),
            ),
          ],
          { border: c.accent + "88", key: "asks" },
        )
      : null,
    box(
      [
        llqaH("📨 Send a request to the academy", "Leave, a different class time, or anything else."),
        kids.length > 1
          ? React.createElement("div", { key: "k", style: { maxWidth: 320 } }, React.createElement(Inp, { label: "For", value: sid, onChange: setSid, options: kids.map((k) => ({ value: String(k.id), label: k.name })) }))
          : null,
        React.createElement(
          "div",
          { key: "t", style: { marginBottom: 10 } },
          llqaChips([["leave", "🏖 Leave"], ["time", "🕐 Change class time"], ["message", "✉ Other"]], type, (k) => {
            setType(k);
            setMsg("");
          }),
        ),
        type === "leave"
          ? React.createElement(
              "div",
              { key: "l", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0 10px" } },
              React.createElement(Inp, { label: "From", type: "date", value: f.from, onChange: (v) => setF({ ...f, from: v, to: f.to && f.to < v ? v : f.to }) }),
              React.createElement(Inp, { label: "To", type: "date", value: f.to, onChange: (v) => setF({ ...f, to: v }) }),
            )
          : null,
        type === "time"
          ? React.createElement(
              "div",
              { key: "w", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0 10px" } },
              React.createElement(Inp, { label: "Day (your day)", value: f.wantDay, onChange: (v) => setF({ ...f, wantDay: v }), options: B.DAYS }),
              React.createElement(Inp, { label: "Time (your time)", value: f.wantTime, onChange: (v) => setF({ ...f, wantTime: v }), options: B.TIMES.map((t) => ({ value: t, label: B.timeLabel(t) })) }),
            )
          : null,
        React.createElement("textarea", {
          key: "x",
          value: f.text,
          onChange: (e) => setF({ ...f, text: e.target.value }),
          rows: 3,
          placeholder: type === "leave" ? "Reason (optional)" : type === "time" ? "Anything else we should know (optional)" : "Your message",
          style: llqaTextStyle,
        }),
        React.createElement(
          "div",
          { key: "b", style: { display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" } },
          llqaMini("Send request", send, { big: true, solid: true, tone: "accent", key: "s" }),
          msg ? React.createElement("span", { key: "m", style: { color: /^✓/.test(msg) ? c.success : c.warn, fontSize: 12 } }, msg) : null,
        ),
      ],
      { key: "new" },
    ),
    box(
      [
        llqaH("Your requests", mine.length ? "" : "Nothing yet."),
        ...mine
          .filter((r) => r.type !== "proposal" || r.status !== "pending")
          .map((r) => {
            const [label, col] = status(r);
            return React.createElement(
              "div",
              { key: r.id, style: { display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: "1px solid " + c.border + "55" } },
              React.createElement(
                "div",
                null,
                React.createElement("div", { style: { color: c.text, fontSize: 12 } }, r.type === "proposal" ? "Academy asked: " + r.text : r.type === "message" ? "Message: " + r.text : llqaReqText(r)),
                React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: 2 } }, r.student + " · " + llqaAgo(r.createdAt) + (r.reply ? " · “" + r.reply + "”" : "")),
              ),
              React.createElement("div", { style: { color: col, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" } }, label),
            );
          }),
      ],
      { key: "hist" },
    ),
  );
};

// Approval requests from the academy waiting for this family.
const llqaParentAskCount = (stu, user) => {
  const ctx = LLQAApp.ctx;
  const pid = user && user.role === "parent" ? String(user.parentId || "").toUpperCase() : "";
  const ids = new Set(
    (ctx.students || []).filter((s) => s && (pid ? String(s.parentId || "").toUpperCase() === pid : stu && String(s.id) === String(stu.id))).map((s) => String(s.id)),
  );
  if (stu) ids.add(String(stu.id));
  return (ctx.parentRequests || []).filter((r) => r && r.type === "proposal" && r.status === "pending" && ids.has(String(r.studentId))).length;
};
const llqaParentAskBanner = (stu, user, tab, open) => {
  const n = llqaParentAskCount(stu, user);
  if (!n || tab === "requests") return null;
  return React.createElement(
    "div",
    {
      key: "llqa-ask",
      onClick: open,
      style: { cursor: "pointer", background: c.accentBg, border: "1px solid " + c.accent, borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: c.text, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
    },
    React.createElement("span", null, "✋ The academy is asking for your approval (" + n + "). "),
    React.createElement("b", { style: { color: c.accent } }, "Open →"),
  );
};

/* ---------- billing settings for one student ---------- */
const LLQABillingModal = ({ studentId, onClose }) => {
  const ctx = LLQAApp.ctx;
  const s = llqaFindStudent(studentId) || {};
  const [f, setF] = useState({ day: String(llqaBillDay(s)), start: llqaFeeStart(s) || todayPK() });
  const preview = llqaFeeCycle({ ...s, billDay: parseInt(f.day, 10), billStart: f.start }, ctx.arPayments);
  const save = () => {
    if (!f.start) {
      alert("Choose the first billed day.");
      return;
    }
    const fields = { billDay: Math.min(28, Math.max(1, parseInt(f.day, 10) || 1)), billStart: f.start };
    ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
    onClose();
    llqaToast({ kind: "info", ttl: 6000, text: "✓ Billing for " + s.name + ": due on day " + fields.billDay + " each month, from " + llqaDateLabel(fields.billStart) + "." });
  };
  return llqaShell(
    "⚙ Billing — " + (s.name || ""),
    (s.fee_amount ? s.fee_amount + " " + (s.currency || "USD") + " a month · " : "") + (llqaExisting(s) ? "Joined before the CRM (registered " + llqaDateYear(s.dor) + ")" : "Registered " + llqaDateYear(s.dor)),
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "Due day each month", value: f.day, onChange: (v) => setF({ ...f, day: v }), options: Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: "Day " + (i + 1) })) }),
        React.createElement(Inp, { label: "First billed day", type: "date", value: f.start, onChange: (v) => setF({ ...f, start: v }) }),
      ),
      React.createElement(
        "div",
        { style: { color: c.textSec, fontSize: 11, lineHeight: 1.5 } },
        "Months before the first billed day are never asked for. ",
        preview
          ? "With this: " + (preview.current ? "latest bill " + llqaMonthLabel(preview.current.ym) + " (due " + llqaDateLabel(preview.current.due) + ") — " + (LLQA_FEE_STATES[preview.status] || [preview.status])[0].toLowerCase() + (preview.left ? ", " + preview.left + " " + preview.cur + " owed" : "") : "first bill on " + llqaDateLabel(preview.due)) + "."
          : "This student has no monthly fee set, or is in trial.",
      ),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("✓ Save", save, { key: "ok", big: true, solid: true, tone: "accent" }),
    ],
    { onClose, width: 520 },
  );
};

/* ---------- teachers ask for leave (Today's Classes, teacher login) ---------- */
const llqaMyLeaves = (u) => {
  const today = todayPK();
  const mine = (LLQAApp.ctx.leaves || [])
    .filter((l) => l && String(l.teacherId) === String(u.teacherId) && (l.to || l.from) >= llqaAddDays(today, -7))
    .sort((a, b) => String(a.from).localeCompare(String(b.from)));
  if (!mine.length) return null;
  return llqaCard(
    [
      React.createElement("div", { key: "h", style: { color: c.textSec, fontSize: 11, fontWeight: 700, marginBottom: 4 } }, "Your leave"),
      ...mine.map((l) =>
        React.createElement(
          "div",
          { key: String(l.id), style: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: c.text, padding: "3px 0" } },
          React.createElement("span", null, (l.type || "Leave") + " · " + llqaRangeLabel(l.from, l.to) + (l.halfDay ? " (half day)" : "")),
          llqaPill(l.status || "pending", l.status === "approved" ? c.success : l.status === "rejected" ? c.danger : c.warn, null, "s"),
        ),
      ),
    ],
    { key: "myleave" },
  );
};
const LLQATeacherLeaveModal = ({ onClose }) => {
  const ctx = LLQAApp.ctx;
  const u = ctx.user || {};
  const types = typeof LEAVE_TYPES !== "undefined" ? LEAVE_TYPES : ["Sick Leave", "Casual Leave", "Annual Leave", "Emergency Leave"];
  const [f, setF] = useState({ type: types[0], from: todayPK(), to: todayPK(), halfDay: false, reason: "", contact: "" });
  const t = (ctx.teachers || []).find((x) => String(x.id) === String(u.teacherId)) || { id: u.teacherId, name: u.name };
  let n = 0;
  if (f.from && (!f.to || f.to >= f.from))
    llqaDatesIn(f.from, f.to || f.from, 31).forEach((d) => {
      if (!llqaHolidayOn(d, "holiday")) n += llqaClassesOn(d, [t], ctx.students, ctx.dailyProgress).filter((it) => !it.onLeave && !it.quit).length;
    });
  const send = () => {
    if (!f.from || (f.to && f.to < f.from)) {
      alert("Please check the dates.");
      return;
    }
    if (typeof ctx.setLeaves !== "function") {
      alert("Leave can't be requested from here.");
      return;
    }
    const days = f.halfDay ? 0.5 : (llqaDays(f.from, f.to || f.from) || 0) + 1;
    const rec = {
      id: Date.now(),
      teacherId: t.id,
      teacherName: t.name || u.name || "",
      type: f.type,
      from: f.from,
      to: f.to || f.from,
      days,
      reason: f.reason.trim(),
      status: "pending",
      halfDay: !!f.halfDay,
      contact: f.contact.trim(),
      substitute: "",
      docUrl: "",
      requestedBy: "teacher",
      requestedAt: new Date().toISOString(),
    };
    ctx.setLeaves((prev) => [...(prev || []), rec]);
    onClose();
    llqaToast({ kind: "info", ttl: 7000, text: "✓ Leave request sent (" + llqaRangeLabel(rec.from, rec.to) + "). You'll see it approved here; your classes will be given to a substitute." });
  };
  return llqaShell(
    "🏖 Request leave",
    (t.name || "") + " · the admin is told at once and approves with one click",
    React.createElement(
      "div",
      null,
      React.createElement(Inp, { label: "Type", value: f.type, onChange: (v) => setF({ ...f, type: v }), options: types }),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "From", type: "date", value: f.from, onChange: (v) => setF({ ...f, from: v, to: !f.to || f.to < v ? v : f.to }) }),
        React.createElement(Inp, { label: "To", type: "date", value: f.to, onChange: (v) => setF({ ...f, to: v }) }),
      ),
      React.createElement(
        "label",
        { style: { display: "flex", gap: 8, alignItems: "center", color: c.text, fontSize: 12, cursor: "pointer", marginBottom: 10 } },
        React.createElement("input", { type: "checkbox", checked: f.halfDay, onChange: (e) => setF({ ...f, halfDay: e.target.checked }) }),
        "Half day only",
      ),
      React.createElement(Inp, { label: "Reason", value: f.reason, onChange: (v) => setF({ ...f, reason: v }) }),
      React.createElement(Inp, { label: "Contact while away (optional)", value: f.contact, onChange: (v) => setF({ ...f, contact: v }) }),
      React.createElement("div", { style: { color: c.textSec, fontSize: 11 } }, n + " of your class" + (n === 1 ? "" : "es") + " fall in these days."),
    ),
    [
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("Send request", send, { key: "ok", big: true, solid: true, tone: "accent" }),
    ],
    { onClose, width: 480 },
  );
};
// One-click approve from the admin's notice (as the Leave Mgmt ✓ does).
const llqaApproveTeacherLeave = (id) => {
  const ctx = LLQAApp.ctx;
  const l = (ctx.leaves || []).find((x) => String(x.id) === String(id));
  if (!l || typeof ctx.setLeaves !== "function") return false;
  ctx.setLeaves((prev) => (prev || []).map((x) => (String(x.id) === String(id) ? { ...x, status: "approved" } : x)));
  llqaLeaveApproved({ ...l, status: "approved" });
  return true;
};
