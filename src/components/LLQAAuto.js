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
// v67.2: can this user open that page (it is in their menu)? Notices, cards
// and automatic work for a page they can't open are left out (a Team Lead has
// no Sales: no fee or follow-up notices, no Sales cards on the Dashboard).
const llqaCanOpen = (page) => {
  const ctx = LLQAApp.ctx;
  const u = ctx.user;
  if (!u) return false;
  if (u.role === "superadmin") return true;
  if (!Array.isArray(ctx.pages)) return llqaCanManage(); // not known yet
  return ctx.pages.includes(page);
};

/* ---------- the 24/7 runner (v67.3) ---------- */
// The server keeps one Super Admin tab open around the clock
// (index.html?runner=1). It does the saving work — automatic cover, Fee
// Status, clock changes, leave starts — every 2 minutes and writes a
// heartbeat. While it is alive, people's own tabs leave that work to it and
// show what it did once, with the usual buttons (tell substitutes / families).
const LLQA_RUNNER = (() => {
  try {
    return /(^|&)runner=1(&|$)/.test(String(window.location.search || "").replace(/^\?/, ""));
  } catch (e) {
    return false;
  }
})();
const LLQA_RUNNER_NAME = "24/7 runner";
const LLQA_RUNNER_STALE_MS = 5 * 60 * 1000;
const llqaRunnerAge = () => {
  const at = Date.parse(((LLQAApp.ctx && LLQAApp.ctx.runnerInfo) || {}).at || "");
  return isNaN(at) ? null : Math.max(0, Date.now() - at);
};
const llqaRunnerAlive = () => {
  const a = llqaRunnerAge();
  return a != null && a < LLQA_RUNNER_STALE_MS;
};
// The name saved on automatic records: the runner, or the person signed in.
const llqaByName = () => {
  if (LLQA_RUNNER) return LLQA_RUNNER_NAME;
  const u = (LLQAApp.ctx && LLQAApp.ctx.user) || {};
  return u.name || u.role || "";
};
const llqaRunnerBeat = () => {
  const ctx = LLQAApp.ctx;
  if (!LLQA_RUNNER || !ctx.user || typeof ctx.setRunnerInfo !== "function") return;
  let st = {};
  try {
    st = (typeof LLQASync !== "undefined" && LLQASync.get && LLQASync.get()) || {};
  } catch (e) {}
  ctx.setRunnerInfo({ ...(ctx.runnerInfo || {}), at: new Date().toISOString(), version: window.__LLQA_VERSION__ || "", mode: st.mode || "", waiting: st.pending || 0, saveError: st.writeError || "" });
};
const LLQA_RUNNER_SEEN = "llqa_runner_seen_v1";
const llqaRunnerSeen = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LLQA_RUNNER_SEEN) || "[]"));
  } catch (e) {
    return new Set();
  }
};
const llqaRunnerMark = (keys) => {
  try {
    localStorage.setItem(LLQA_RUNNER_SEEN, JSON.stringify([...llqaRunnerSeen(), ...keys].slice(-400)));
  } catch (e) {}
};
// In a person's tab: what the runner did in the last day and a half that needs
// someone to tell people — shown once in each browser.
const llqaRunnerNews = () => {
  const ctx = LLQAApp.ctx;
  if (LLQA_RUNNER || !ctx.user || !llqaCanManage()) return;
  const seen = llqaRunnerSeen();
  const since = Date.now() - 36 * 3600 * 1000;
  if (llqaCanOpen("timetable")) {
    const covers = (ctx.covers || []).filter((x) => x && x.auto && x.by === LLQA_RUNNER_NAME && Date.parse(x.at || "") > since && !seen.has("cv:" + x.id + ":" + x.at));
    if (covers.length) {
      llqaRunnerMark(covers.map((x) => "cv:" + x.id + ":" + x.at));
      llqaToast({ kind: "covers", key: "covers", covers, text: "🔁 Teacher on leave: the 24/7 runner gave " + covers.length + " class" + (covers.length === 1 ? "" : "es") + " to a substitute. Tell the substitutes and families?" });
    }
  }
  const run = ctx.automation && ctx.automation.lastRun;
  if (run && run.by === LLQA_RUNNER_NAME && run.at && Date.parse(run.at) > since && !seen.has("ck:" + run.at) && llqaCanOpen("sales")) {
    llqaRunnerMark(["ck:" + run.at]);
    llqaToast({ kind: "clockFixed", key: "clockFixed", run, text: "🕐 Clocks changed — the 24/7 runner moved the classes. " + llqaRunText(run) });
  }
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
  const next = [...LLQAUI.toasts.filter((x) => !(t.key && x.key === t.key)), { ...t, id, at: Date.now() }];
  // the newest 8; a sticky one (new version out) is never pushed out
  const sticky = next.filter((x) => x.sticky);
  LLQAUI.toasts = [...sticky, ...next.filter((x) => !x.sticky).slice(-Math.max(1, 8 - sticky.length))];
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
// v67.2: remembered (asked tens of thousands of times after each data change)
const llqaAddDaysMemo = new Map();
const llqaAddDays = (d, n) => {
  const k = d + "|" + n;
  let v = llqaAddDaysMemo.get(k);
  if (v === undefined) {
    if (llqaAddDaysMemo.size > 50000) llqaAddDaysMemo.clear();
    v = new Date(Date.parse(d + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
    llqaAddDaysMemo.set(k, v);
  }
  return v;
};
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
// v66.2: from the CRM's own offset (it knows the 2026 Canada rules a browser may not).
const llqaLocalNow = (tz) => {
  if (!tz) return "";
  try {
    const off = LLQABooking.offsetAt(tz, new Date());
    return new Date(Date.now() + off * 60000).toLocaleString("en-US", { timeZone: "UTC", weekday: "short", hour: "numeric", minute: "2-digit" });
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
    ? { bg: "color-mix(in srgb, var(--warn) 12%, transparent)", bd: c.warn, label: "Trial done " + done + "/" + target, stage: "complete" } // v68: pale fill + solid border
    : { bg: "color-mix(in srgb, var(--danger) 12%, transparent)", bd: c.danger, label: "Trial " + done + "/" + target, stage: "trial" };
};
// After a class is counted: the moment a trial reaches its target, offer the
// fee message (once).
const llqaAfterCount = (before, cnt) => {
  if (!before || !cnt || !llqaInTrial(before) || !llqaCanManage() || !llqaCanOpen("sales")) return;
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
  // v66.2: +1 (USA / Canada) numbers are always 11 digits — a typo'd one would
  // open WhatsApp on a number that doesn't exist
  const ok = (x) => (x.startsWith("1") ? (x.length === 11 ? x : "") : x.length >= 8 && x.length <= 15 ? x : "");
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
    // v66.2: the family's clock from the CRM's own offset (2026 Canada rules included)
    const at = now || new Date();
    const loc = new Date(at.getTime() + B.offsetAt(tz, at) * 60000);
    wd = B.DAYS[(loc.getUTCDay() + 6) % 7];
    mins = loc.getUTCHours() * 60 + loc.getUTCMinutes();
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
const llqaPktDayMemo = new Map();
const llqaPktDay = (rowDay, slot, diff) => {
  const k = rowDay + "|" + slot + "|" + diff;
  let v = llqaPktDayMemo.get(k);
  if (v === undefined) {
    if (llqaPktDayMemo.size > 20000) llqaPktDayMemo.clear();
    v = llqaPktDayRaw(rowDay, slot, diff);
    llqaPktDayMemo.set(k, v);
  }
  return v;
};
const llqaPktDayRaw = (rowDay, slot, diff) => {
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
// v67.2: every booked cell of the Timetable (with its family time zone), once
// per version of the teacher list — each day's class list reuses it
const llqaBookedMemo = new WeakMap();
const llqaBookedList = (teachers) => {
  const list = teachers || [];
  let v = llqaBookedMemo.get(list);
  if (!v) {
    v = [];
    LLQABooking.eachBooked(list, (c) => v.push({ ...c, tz: LLQABooking.timezoneFor(c.cell.country, c.cell.state) }));
    llqaBookedMemo.set(list, v);
  }
  return v;
};
// v66: worked out once per data change (screens ask for the same day many times)
const llqaClassesOn = (date, teachers, students, dailyProgress) => {
  const ctx = LLQAApp.ctx;
  const n = (a) => (Array.isArray(a) ? a.length : -1);
  return llqaCachedFor(
    teachers,
    "cls:" + date,
    [students, dailyProgress, ctx.leaves, ctx.covers, ctx.calendar, ctx.makeups, n(teachers), n(students), n(dailyProgress), n(ctx.leaves), n(ctx.covers), n(ctx.makeups)],
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
  llqaBookedList(teachers).forEach((c) => {
    const cell = c.cell;
    const tz = c.tz;
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
  // v67: make-up classes booked for this date
  if (typeof llqaMakeupItems === "function") llqaMakeupItems(date, tById, byId, dpx, holiday).forEach((x) => out.push(x));
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
  const run = {
    at: new Date().toISOString(),
    by: llqaByName(), // v67.3
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
        border: "1px solid " + llqaAlpha((col || c.border), "33"),
        whiteSpace: "nowrap",
      },
    },
    llqaIconize(text, { size: 11, keep: true, gap: 4 }), // v69: line icon, not emoji
  );
const llqaMini = (label, onClick, opt) => {
  const o = opt || {};
  const col = o.tone === "danger" ? c.danger : o.tone === "success" ? c.success : o.tone === "warn" ? c.warn : o.tone === "accent" ? c.accent : c.textSec;
  // v68: a solid button uses the button version of its colour and the text that reads on it
  const fill = o.tone === "danger" ? c.dangerFill : o.tone === "success" ? c.successFill : o.tone === "warn" ? c.warnFill : o.tone === "accent" ? c.gradientPrimary : c.textSec;
  const onFill = o.tone === "danger" ? c.dangerText : o.tone === "success" ? c.successText : o.tone === "warn" ? c.warnText : o.tone === "accent" ? c.accentText : c.bg;
  // v69: a leading emoji becomes a line icon drawn in the button's own colour (same on every computer)
  const isz = o.big ? 13 : 12;
  const kids = o.icon
    ? [React.createElement(llqaIcon(o.icon), { key: "ico", size: isz, "aria-hidden": true, "data-icon": o.icon, style: { marginRight: label ? 5 : 0, verticalAlign: "-2px" } }), label]
    : llqaIconize(label, { size: isz, keep: true, gap: 5 });
  const iconOnly = Array.isArray(kids) && !kids[1];
  return React.createElement(
    "button",
    {
      key: o.key || label,
      type: "button",
      title: o.title || "",
      "aria-label": iconOnly ? o.title || undefined : undefined,
      disabled: !!o.disabled,
      onClick: (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!o.disabled) onClick();
      },
      style: {
        padding: o.big ? "8px 14px" : "5px 9px",
        borderRadius: 7,
        border: "1px solid " + (o.solid ? "transparent" : llqaAlpha(col, "55")),
        background: o.solid ? fill : "transparent",
        color: o.solid ? onFill : col,
        boxShadow: o.solid && !o.disabled ? "0 4px 12px -6px " + llqaAlpha(o.tone === "accent" ? c.accentFill : fill, "99") : "none",
        fontSize: o.big ? 12 : 11,
        fontWeight: 700,
        cursor: o.disabled ? "not-allowed" : "pointer",
        opacity: o.disabled ? 0.45 : 1,
        whiteSpace: "nowrap",
      },
    },
    kids,
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
          React.createElement("h3", { style: { color: c.text, fontSize: 16, margin: 0 } }, llqaIconize(title, { size: 17, color: c.accent, keep: true, gap: 8 })),
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
            ? llqaLabel("⚠ Can't tell the country code — type the number with + and the country code.")
            : llqaLabel("⚠ No number saved for this family."),
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
        digits ? "To +" + digits : llqaLabel("⚠ No usable number for this family — skip, or fix the number in their record."),
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
// v69: the icon for a notice, from the emoji its text starts with (bell when there is none)
const llqaNoticeIcon = (text) => {
  const m = LLQA_EMOJI_LEAD.exec(String(text || ""));
  return (m && LLQA_EMOJI_ICON[m[1].replace(/\uFE0F/g, "")]) || "bell";
};
const LLQAToasts = () => {
  const now = Date.now();
  const all = LLQAUI.toasts;
  // v67: a sticky notice (a new version is out) stays on screen until acted on
  const fresh = all.filter((t) => t.sticky || now - (t.at || 0) < LLQA_FRESH_MS);
  const list = LLQAUI.open ? all : [...fresh.filter((t) => t.sticky), ...fresh.filter((t) => !t.sticky).slice(-2)];
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
            border: "1px solid " + c.border, // v69: calm frame, strong shadow
            borderRadius: 12,
            padding: "12px 12px 10px",
            boxShadow: "var(--liftShadow), " + c.shadow3d,
            width: "100%",
            boxSizing: "border-box",
            pointerEvents: "auto",
          },
        },
        // v69: an icon tile for the kind of notice, then the words (no leading emoji)
        React.createElement(
          "div",
          { style: { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 } },
          React.createElement(
            "span",
            { style: { width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: c.accentBg, boxShadow: "inset 0 0 0 1px " + llqaAlpha(c.accent, "33") } },
            React.createElement(llqaIcon(llqaNoticeIcon(t.text)), { size: 14, color: c.accent }),
          ),
          React.createElement("div", { style: { fontSize: 12, color: c.text, lineHeight: 1.45, flex: 1, minWidth: 0, paddingTop: 3 } }, llqaStripEmoji(t.text)),
        ),
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
          // v67: any notice can carry its own buttons
          Array.isArray(t.actions)
            ? t.actions.map((a, i) =>
                llqaMini(a.label, () => {
                  llqaDismiss(t.id);
                  a.run();
                }, { key: "ac" + i, tone: a.tone || "accent" }),
              )
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
              border: "1px solid " + llqaAlpha(c.accent, "88"),
              background: c.bgCard,
              color: c.accent,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: c.shadow3d,
            },
          },
          LLQAUI.open
            ? "Hide notices"
            : [React.createElement(llqaIcon("bell"), { key: "b", size: 13, color: c.accent, style: { marginRight: 6, verticalAlign: "-2px" } }), rest + " notice" + (rest === 1 ? "" : "s")], // v69
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
  if (LLQAUI.stale) return false; // v67: a newer version is published — this tab leaves the work to it
  const job = (fn) => {
    try {
      if (fn()) again = true;
    } catch (e) {}
  };
  // v67.2: each job only for people who can open its page
  const sales = llqaCanOpen("sales");
  // v67.3: while the 24/7 runner is alive it does the saving work; this tab
  // shows what it did (once) and the read-only notices
  const runnerUp = !LLQA_RUNNER && llqaRunnerAlive();
  if (sales && !runnerUp)
    job(() => {
      const run = llqaClockAutoRun();
      return run && !run.same && ((run.moved || []).length || (run.skipped || []).length);
    });
  try {
    if (!state.soon && sales) {
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
    if (!state.ended && llqaCanOpen("students")) {
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
    if (!state.pilot && sales && llqaCanManage() && LLQAApp.ctx.user && llqaReadyFor(["students", "messageLog", "dailyProgress"])) {
      state.pilot = true;
      const due = llqaAutopilot();
      if (due.length)
        llqaToast({ kind: "pilot", key: "pilot", text: "🤖 " + due.length + " follow-up message" + (due.length === 1 ? " is" : "s are") + " due today (" + [...new Set(due.map((x) => llqaTplName(x.template)))].slice(0, 3).join(", ") + ")." });
    }
  } catch (e) {}
  if (!runnerUp) {
    if (llqaCanOpen("students")) job(llqaLeaveStartRun);
    if (llqaCanOpen("timetable")) job(llqaCoverRunAuto);
    if (sales) job(llqaFeeRunAuto);
  } else
    try {
      llqaRunnerNews();
    } catch (e) {}
  if (LLQA_RUNNER)
    try {
      llqaRunnerBeat();
    } catch (e) {}
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
  // v67.2: who is signed in — a new person starts with no notices or pop-ups
  // from the one before (shared office computers)
  // (kept outside the component: it is not on screen while nobody is signed in)
  const u0 = LLQAApp.ctx.user;
  const userKey = u0 ? u0.role + ":" + (u0.name || "") + ":" + (u0.teacherId || "") : "";
  if (LLQAUI.who !== userKey) {
    if (LLQAUI.who !== undefined) {
      seen.current = null;
      LLQAUI.toasts = [];
      LLQAUI.open = false;
      LLQAUI.modal = null;
    }
    LLQAUI.who = userKey;
  }
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    LLQAUI.subs.add(f);
    return () => LLQAUI.subs.delete(f);
  }, []);
  // v67.3: a notice when an inquiry arrives from the website (through the runner)
  const leadSeen = React.useRef(null);
  useEffect(() => {
    const ctx = LLQAApp.ctx;
    if (LLQA_RUNNER || !ctx.user || !llqaCanOpen("sales") || typeof llqaLeads !== "function") {
      leadSeen.current = null;
      return;
    }
    try {
      if (typeof LLQACloud !== "undefined" && LLQACloud.ready && !LLQACloud.ready("leads")) return;
    } catch (e) {
      return;
    }
    const web = llqaLeads().filter((l) => l && l.createdBy && l.createdBy === l.source);
    if (!leadSeen.current) {
      leadSeen.current = new Set(web.map((l) => l.id));
      return;
    }
    web.forEach((l) => {
      if (leadSeen.current.has(l.id)) return;
      leadSeen.current.add(l.id);
      llqaToast({
        kind: "info",
        key: "lead-" + l.id,
        text: "🎯 New inquiry (" + (l.source || "Website") + "): " + [l.parent, l.name].filter(Boolean).join(" · ") + (l.phone ? " · " + l.phone : "") + " — follow up today.",
        actions: [{ label: "Open Leads", run: () => llqaGo("sales", "leads"), tone: "success" }],
      });
    });
  });
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
    // v67.2: parent requests live in Sales, teacher leave asks in Teachers
    const ev = llqaRequestEvents(ctx.parentRequests, ctx.leaves).filter((e) => (e.kind === "leaveAsk" ? llqaCanOpen("teachers") || llqaCanOpen("timetable") : llqaCanOpen("sales")));
    if (!seen.current) {
      seen.current = new Set(ev.map((e) => e.id));
      const waiting = llqaCanOpen("sales") ? llqaPendingRequests(ctx.parentRequests).length : 0;
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
    const vc = setTimeout(llqaVersionCheck, 60000); // v67
    const again = setInterval(() => {
      quickN = 0;
      llqaVersionCheck();
      tick();
    }, LLQA_RUNNER ? 2 * 60 * 1000 : 5 * 60 * 1000); // v67.3: the runner checks every 2 minutes
    return () => {
      clearTimeout(first);
      clearTimeout(vc);
      clearInterval(again);
      if (quick) clearTimeout(quick);
    };
  }, [userKey]); // v67.2: restarts (fresh) when someone else signs in
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
    // v67
    k && typeof LLQA_MODALS3 !== "undefined" && LLQA_MODALS3[k] ? React.createElement(LLQA_MODALS3[k], { key: m.key, ...d, onClose: llqaClose }) : null,
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
      React.createElement("div", { style: { fontSize: 12, fontWeight: 700 } }, llqaIconize(title, { size: 13, keep: true })),
      React.createElement("div", { style: { fontSize: 10, marginTop: 2, color: on ? c.accent : c.textMuted } }, sub), // v68: readable (was faded)
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
          llqaLabel("📅 Registered " + llqaDateYear(pf.dor) + " — saved as an existing student: they get the Parent Portal intro (not a welcome or first-class message), and the fee cycle starts from their next due day; earlier months count as settled."),
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
    React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, llqaIconize(text, { size: 15, color: c.accent, keep: true, gap: 7 })),
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
        llqaIconize(label + (n != null ? " (" + n + ")" : ""), { size: 12, keep: true, gap: 5 }), // v69: line icon, not emoji
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
      return llqaCached("feeBadge", [ctx.students, ctx.arPayments, ctx.rewards, todayPK(), llqaLen(ctx.students), llqaLen(ctx.arPayments)], () =>
        (ctx.students || []).filter((s) => (llqaFeeCycle(s, ctx.arPayments) || {}).status === "overdue").length,
      );
    if (k === "requests") return llqaPendingRequests(ctx.parentRequests).length;
    // v67
    if (k === "leads") return llqaLeadStats().due;
    if (k === "winback") return llqaReferralRewards().filter((x) => x.state === "earned").length;
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
                : React.createElement(LLQASalesTab3, props); // v67

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
        // v69: a trial that starts later reads "Starts tomorrow" / "Starts in 3 days" (was "Started -1 days ago")
        (info.days == null ? "No start date" : info.days < 0 ? "Starts " + (info.days === -1 ? "tomorrow" : "in " + -info.days + " days") : "Started " + (info.days === 0 ? "today" : info.days + " day" + (info.days === 1 ? "" : "s") + " ago")) +
          (s.lastDate ? " · last class " + (info.sinceLast === 0 ? "today" : info.sinceLast + "d ago") : info.done ? "" : " · no class yet") +
          (next ? " · next " + next : "") +
          " · " + (s.teacher || "no teacher"),
        React.createElement("br", null),
        last ? llqaLabel("💬 " + llqaTplName(last.template) + " " + llqaAgo(last.at)) : llqaLabel("💬 No message yet"),
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
    { key: s.id, border: info.stage === "complete" ? llqaAlpha(c.warn, "88") : info.stalled ? llqaAlpha(c.danger, "66") : c.border, mb: 8 },
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
                React.createElement("div", { style: { color: c.text, fontSize: 12, fontWeight: 700 } }, llqaIconize(title, { size: 13, keep: true, gap: 6 })), // v69: line icon
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
    { border: llqaAlpha(c.accent, "55") },
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
  const td = (kids, k, st) => React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + llqaAlpha(c.border, "66"), fontSize: 12, color: c.text, verticalAlign: "top", ...(st || {}) } }, kids);
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
                      React.createElement("div", { key: "ph", style: { fontSize: 10, color: r.digits ? c.textSec : c.danger } }, r.digits ? "+" + r.digits : s.phone ? llqaLabel("⚠ " + s.phone + " (add country code)") : llqaLabel("⚠ no number")),
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
              { key: m.id, style: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, padding: "5px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "55"), color: c.textSec } },
              React.createElement("span", null, llqaLabel((m.channel === "whatsapp" ? "💬 " : "📞 ") + (m.name || "—") + (m.template ? " · " + llqaTplName(m.template) : ""))),
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
          llqaH("Add a family to the waitlist", "Or use “Waitlist” in the Add Student form when a time is full."),
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
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No families waiting. When a wanted time is full in the Add Student form, use “Waitlist” there — they'll show here and you'll be told when the time frees up."))
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
            { key: w.id, border: free ? llqaAlpha(c.success, "88") : c.border },
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
                { key: w.id, style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: c.textSec, padding: "4px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "55") } },
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
          { key: e.s.id, style: { padding: "10px 0", borderTop: "1px solid " + llqaAlpha(c.border, "66") } },
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
          React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, llqaLabel("🤖 Automatic fixing — " + (auto ? "ON" : "OFF"))),
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
      { border: auto ? llqaAlpha(c.success, "66") : c.border },
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
  const td = (kids, k, st) => React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + llqaAlpha(c.border, "66"), fontSize: 12, color: c.text, verticalAlign: "middle", ...(st || {}) } }, kids);
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
        style: { padding: "4px 6px", background: c.bgDeep, border: "1px solid " + llqaAlpha((opts.length ? c.accent : c.danger), "88"), borderRadius: 6, color: c.text, fontSize: 11, maxWidth: 210 },
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
              React.createElement("b", null, llqaLabel(((hol.kind || "holiday") === "ramadan" ? "🌙 " : "🗓 ") + (hol.name || "Holiday"))),
              " · " + llqaRangeLabel(hol.from, hol.to) + " · " + ((hol.kind || "holiday") === "holiday" ? "academy closed — no classes" : "classes run as usual") + (hol.note ? " · " + hol.note : ""),
            ),
            manage ? llqaMini("🗓 Holidays", () => llqaGo("timetable", "holidays"), { key: "h", tone: "accent" }) : null,
          ),
          { border: llqaAlpha(((hol.kind || "holiday") === "holiday" ? c.warn : c.accent), "88") },
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
                        it.makeup ? llqaPill("🧩 Make-up" + (it.makeup.missedDate ? " for " + llqaDateLabel(it.makeup.missedDate) : ""), c.accent, null, "mk") : null,
                      ),
                    ], "s"),
                    td([
                      React.createElement("div", { key: "b", style: { fontWeight: it.covered ? 700 : 400, color: it.covered ? c.accent : c.text } }, it.by),
                      it.covered ? React.createElement("div", { key: "f", style: { color: c.textMuted, fontSize: 10 } }, llqaLabel("🔁 covering for " + it.teacher)) : null,
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
// v68: one card style for every Dashboard card. A card that needs you gets a soft
// tint, a coloured edge and its number in that colour (all readable in both themes).
const llqaDashCard = (key, icon, title, value, sub, alert, go) =>
  React.createElement(
    "div",
    {
      key,
      onClick: go,
      role: "button",
      tabIndex: 0,
      className: "hover-lift",
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (go) go();
        }
      },
      style: {
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        background: alert ? "linear-gradient(180deg, " + llqaAlpha(alert, "1a") + ", " + llqaAlpha(alert, "00") + " 70%), " + c.bgCard : c.bgCard,
        border: "1px solid " + (alert ? llqaAlpha(alert, "59") : c.border),
        boxShadow: c.shadow3d,
        borderRadius: 12,
        padding: "11px 13px 12px",
      },
    },
    alert ? React.createElement("div", { style: { position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: "0 3px 3px 0", background: alert } }) : null,
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 } },
      // v69: a line icon (in the card's colour when it needs you) instead of the emoji
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 6, color: c.textSec, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 0 } },
        React.createElement(llqaIcon(LLQA_EMOJI_ICON[String(icon).replace(/\uFE0F/g, "")] || "layout-grid"), { size: 13, color: alert || c.textSec, style: { flexShrink: 0 } }),
        title,
      ),
      React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "→"),
    ),
    React.createElement("div", { style: { color: alert || c.text, fontSize: 22, fontWeight: 800, marginTop: 3, letterSpacing: -0.2 } }, value),
    React.createElement("div", { style: { color: c.textSec, fontSize: 10.5, marginTop: 2, lineHeight: 1.4 } }, sub), // v69: readable on a coloured card
  );
const LLQADashCards = (props) => {
  const ctx = llqaCtx(props);
  if (!llqaCanManage()) return null;
  // v67.2: only cards for pages this person can open
  const sales = llqaCanOpen("sales");
  const tt = llqaCanOpen("timetable");
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
  const card = llqaDashCard; // v68: one card style for the whole Dashboard
  return React.createElement(
    "div",
    { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 } }, // v68: 5 per row on a laptop
    tt && card("today", "📋", "Today's classes", cls.length, logged + " logged · " + missing + " not logged", missing ? c.danger : null, () => llqaGo("timetable", "today")),
    sales && card("trials", "🧪", "Trials", active, complete + " fee due · " + stalled + " need follow-up", complete ? c.warn : stalled ? c.danger : null, () => llqaGo("sales", "pipeline")),
    sales && card("follow", "💬", "Follow-ups", complete + feeDue + stalled, complete + " trial fee · " + feeDue + " fee due · " + stalled + " quiet", complete + feeDue ? c.warn : null, () => llqaGo("sales", "contacts")),
    sales && card("wait", "⏳", "Waitlist", waiting.length, freeNow ? freeNow + " can be booked now" : "none free yet", freeNow ? c.success : null, () => llqaGo("sales", "waitlist")),
    sales &&
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
    sales && card("pilot", "🤖", "Autopilot", pilot.length, pilot.length ? "follow-up messages due today" : "nothing due — all sent", pilot.length ? c.accent : null, () => llqaGo("sales", "autopilot")),
    sales && card("risk", "⚠", "At-risk students", highRisk, risky.length - highRisk + " more to watch", highRisk ? c.danger : null, () => llqaGo("sales", "autopilot")),
    sales && card("fees", "💰", "Fee cycle", feeOver, feeOver + " overdue · " + feeDueNow + " due now" + ((ctx.automation || {}).feeAuto !== false ? " · auto ✓" : " · auto off"), feeOver ? c.danger : feeDueNow ? c.warn : null, () => llqaGo("sales", "fees")),
    tt && card("cover", "🔁", "Leave cover", needCover, needCover ? "classes need a substitute (today/tomorrow)" : "no teacher away without cover", needCover ? c.danger : null, () => llqaGo("timetable", "leavecover")),
    sales && card("req", "📨", "Parent requests", reqWaiting, askWaiting + " proposal" + (askWaiting === 1 ? "" : "s") + " awaiting parent approval", reqWaiting ? c.warn : null, () => llqaGo("sales", "requests")),
    tt &&
    card(
      "hol",
      holNow && (holNow.kind || "holiday") === "ramadan" ? "🌙" : "🗓",
      "Holidays",
      holNow ? holNow.name || "Holiday" : holNext ? llqaDateLabel(holNext.from) : "—",
      holNow ? (llqaHolidayOn(today) ? "today" : "tomorrow") + " · " + ((holNow.kind || "holiday") === "holiday" ? "no classes" : "classes run") : holNext ? holNext.name || "next holiday" : "none planned — add Eid / Ramadan dates",
      holNow && (holNow.kind || "holiday") === "holiday" ? c.warn : null,
      () => llqaGo("timetable", "holidays"),
    ),
    ...llqaDashCards3Items(), // v68: the v67 cards sit in the same grid, same style
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
const llqaMonthAddMemo = new Map();
const llqaMonthAdd = (ym, n) => {
  const k = ym + "|" + n;
  let v = llqaMonthAddMemo.get(k);
  if (v === undefined) {
    if (llqaMonthAddMemo.size > 20000) llqaMonthAddMemo.clear();
    v = llqaMonthAddRaw(ym, n);
    llqaMonthAddMemo.set(k, v);
  }
  return v;
};
const llqaMonthAddRaw = (ym, n) => {
  const [y, m] = String(ym).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1, 12)).toISOString().slice(0, 7);
};
const llqaMonthLabelMemo = new Map();
const llqaMonthLabel = (ym) => {
  let v = llqaMonthLabelMemo.get(ym);
  if (v === undefined) {
    if (llqaMonthLabelMemo.size > 5000) llqaMonthLabelMemo.clear();
    v = llqaMonthLabelRaw(ym);
    llqaMonthLabelMemo.set(ym, v);
  }
  return v;
};
const llqaMonthLabelRaw = (ym) => {
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
    by: typeof llqaByName === "function" ? llqaByName() : u.name || u.role || "", // v67.3
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
  // the bills so far (the newest 12), oldest first
  const bills = [];
  for (let ym = curM, k = 0; ym >= startM && k < 12; ym = llqaMonthAdd(ym, -1), k++)
    bills.unshift({ ym, due: dueOf(ym), paid: 0, fee: 0, other: false, pays: [] });
  // v66.2: which bill a payment pays.
  // - Saved for a month (Fee Cycle, enrolling): that month.
  // - Otherwise (Accounts Receivable, imports): the oldest bill still open that
  //   was out when it was paid — a fee paid a few days late, in the next
  //   calendar month, still pays the month it was for, and arrears are paid
  //   oldest first. Paid before any open bill was out = paid in advance.
  // Anything above a bill's fee carries on to the next open bill.
  // The fee of a bill is what it was when its first payment was recorded (a
  // later fee change doesn't reopen a month already paid), else today's fee.
  // v67: referral rewards come off that month's bill
  const offs = typeof llqaRewardOff === "function" ? llqaRewardOff(s.id) : null;
  const offOf = (ym) => (offs && offs.get(ym)) || 0;
  const feeOf = (b) => Math.max(0, Math.round(((b.fee || amt) - offOf(b.ym)) * 100) / 100);
  const isFull = (b) => b.other || b.paid >= feeOf(b) - 0.005;
  const put = (b, p, v) => {
    if (!b.fee && Number(p.feeAmount) > 0) b.fee = Number(p.feeAmount);
    b.paid += v;
    if (!b.pays.includes(p)) b.pays.push(p);
  };
  const spend = (p, from) => {
    if (p.currency && p.currency !== cur) {
      // another currency: can't compare amounts, so it pays that one bill
      bills[from].other = true;
      if (!bills[from].pays.includes(p)) bills[from].pays.push(p);
      return;
    }
    let left = Number(p.amount) || 0;
    for (let i = from; i < bills.length && left > 0.005; i++) {
      const b = bills[i];
      if (isFull(b) && i !== from) continue;
      if (Number(p.feeAmount) > 0 && !b.fee) b.fee = Number(p.feeAmount);
      const take = i === bills.length - 1 ? left : Math.min(left, Math.max(0, feeOf(b) - b.paid));
      if (take <= 0.005) continue;
      put(b, p, take);
      left -= take;
    }
    if (left > 0.005) put(bills[bills.length - 1], p, left); // paid ahead of the bills so far
  };
  const byDate = mine
    .slice()
    .sort((a, b) => String(a.paidDate || "").localeCompare(String(b.paidDate || "")) || String(a.id).localeCompare(String(b.id)));
  const firstOut = llqaAddDays(bills[0].due, -7);
  byDate.forEach((p) => {
    if (!p.month) return;
    const i = bills.findIndex((b) => b.ym === String(p.month).slice(0, 7));
    if (i >= 0) spend(p, i);
  });
  byDate.forEach((p) => {
    if (p.month) return;
    const d = String(p.paidDate || "").slice(0, 10);
    // paid before the oldest bill shown was out, while older bills exist: it paid one of those
    if (bills[0].ym > startM && d && d < firstOut) return;
    const open = bills.map((b, i) => i).filter((i) => !isFull(bills[i]));
    if (!open.length) return spend(p, bills.length - 1);
    const out = open.filter((i) => !d || llqaAddDays(bills[i].due, -7) <= d);
    spend(p, out.length ? out[0] : open[0]);
  });
  const months = bills.reverse().map((b) => {
    const fee = feeOf(b);
    const over = llqaAddDays(b.due, LLQA_FEE_GRACE);
    const paid = Math.round(b.paid * 100) / 100;
    const full = b.other || paid >= fee - 0.005;
    const state = full ? "paid" : t >= over ? "overdue" : paid > 0 ? "partial" : t < b.due ? "upcoming" : "due";
    return { ym: b.ym, due: b.due, over, paid, fee, off: offOf(b.ym), left: full ? 0 : Math.round((fee - paid) * 100) / 100, state, pays: b.pays };
  });
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
    [c0.students, c0.dailyProgress, c0.messageLog, c0.arPayments, c0.covers, c0.calendar, c0.rewards, c0.automation, t, llqaLen(c0.students), llqaLen(c0.dailyProgress), llqaLen(c0.messageLog), llqaLen(c0.arPayments), llqaLen(c0.covers), llqaLen(c0.rewards)],
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
    // v67: step-by-step reminders — each stage once, by days since the oldest unpaid bill fell due
    const cy = llqaFeeCycle(s, ctx.arPayments, today);
    const fs = cy && cy.current ? llqaFeeStage(s, cy, today) : null;
    if (fs && !s.feeHold) {
      add(s, fs.tpl, fs.key,
        fs.name + " (" + (fs.days ? fs.days + " day" + (fs.days === 1 ? "" : "s") + " since " : "due ") + llqaDateLabel(fs.oldest.due) + "): " + fs.owed + " " + cy.cur,
        { fee: llqaFeeText(fs, cy), deadline: llqaDateLabel(llqaAddDays(today, 3)), stage: fs.n }, fs.n >= 2 ? 1 : 2);
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
  // v67: win-back for families who left, thank-yous for referral rewards
  if (typeof llqaPilotMore === "function") llqaPilotMore(ctx, today, add, last);
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

/* ---------- v66.2: the Timetable's grid tools keep each student's record right ---------- */
// The student a booked cell belongs to (by id when the booking has one, else name + parent).
const llqaCellStudent = (cell) => {
  if (!cell || typeof cell !== "object" || !cell.s) return null;
  return (LLQAApp.ctx.students || []).find((s) => s && s.status !== "quit" && LLQABooking.sameStudent(cell, s)) || null;
};
// A student's saved classes (only the ones with a day and a time).
const llqaRowsOf = (s) =>
  Array.isArray(s.schedule) && s.schedule.length
    ? s.schedule.filter((r) => r && r.day && r.time).map((r) => ({ ...r, teacher: r.teacher || s.teacher }))
    : LLQABooking.scheduleOf(s).filter((r) => r.day && r.time);
// The record fields that follow from a list of classes.
const llqaClassFields = (rows) => ({
  schedule: rows.map((r) => ({ day: r.day, time: r.time, teacher: r.teacher, pktDay: r.pktDay || "", pktSlot: r.pktSlot || "" })),
  time: rows.map((r) => r.day + "|" + r.time).join(", "),
  teacher: rows.length ? rows[0].teacher : "Unassigned",
  hoursPerWeek: rows.length ? String(rows.length * 0.5) : "",
});
// The record after one class (teacher + Timetable day + slot) is taken off:
// { fields, row }, or null when that cell isn't one of the student's saved
// classes. (A Timetable row is the family's day; before / after a clock
// change the same class can sit on either slot.)
const llqaWithoutClass = (s, teacherName, rowDay, slot) => {
  const B = LLQABooking;
  const tz = B.timezoneFor(s.country, s.state) || s.tz || "";
  if (!tz) return null;
  const rows = llqaRowsOf(s);
  const i = rows.findIndex((r) => r.teacher === teacherName && r.day === rowDay && B.pktOptions(r.day, r.time, tz).some((o) => o.slot === slot));
  if (i < 0) return null;
  return { fields: llqaClassFields(rows.filter((r, j) => j !== i)), row: rows[i] };
};
const llqaSaveClasses = (s, fields, teachers, text) => {
  const ctx = LLQAApp.ctx;
  if (teachers) {
    const byId = new Map(teachers.map((t) => [String(t.id), t]));
    ctx.setTeachers((prev) => (prev || []).map((t) => (t && byId.has(String(t.id)) ? byId.get(String(t.id)) : t)));
  }
  ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  if (text) llqaToast({ kind: "moved", key: "moved-" + s.id, student: { ...s, ...fields }, studentId: s.id, text });
};
const llqaWeekText = (n) => (n ? n + " class" + (n === 1 ? "" : "es") + " a week" : "no classes left");
// Mark as Free on a student's class: only that class leaves their record.
const llqaClassFreed = (cell, teacherName, rowDay, slot) => {
  const s = llqaCellStudent(cell);
  if (!s) return null;
  const w = llqaWithoutClass(s, teacherName, rowDay, slot);
  if (!w) return null;
  const n = w.fields.schedule.length;
  llqaSaveClasses(s, w.fields, null,
    "✓ " + s.name + "'s " + rowDay + " " + LLQABooking.timeLabel(w.row.time) + " class is removed — " + llqaWeekText(n) + (n ? " now" : "") + ". Tell the family?");
  return w.fields;
};
// Plan one more class for a student at a Timetable cell, on a teachers list.
// → { teachers, rows, it } or { error }
const llqaPlanClassAt = (teachers, s, rows, teacher, rowDay, slot) => {
  const B = LLQABooking;
  const tz = B.timezoneFor(s.country, s.state) || s.tz || "";
  if (!tz) return { error: "No time zone for " + s.name + " — set their State / Province first." };
  const fam = B.pktDayOf(rowDay, slot, tz).famTime;
  const time = String(fam || "").replace(":", "");
  if (!time) return { error: "Can't work out " + s.name + "'s time for that slot." };
  const isQ = s.course !== "Subject";
  const master = isQ && rows.length ? rows[0].teacher : "";
  if (isQ && master && master !== teacher.name)
    return {
      error:
        s.name + "'s Quran classes are with " + master + ". A Quran student keeps one teacher, so this class can't go to " + teacher.name +
        ".\n\nTo move all of their classes to " + teacher.name + ", use “Change classes”.",
    };
  if (rows.some((r) => r.day === rowDay && r.time === time)) return { error: s.name + " already has a class on " + rowDay + " at " + B.timeLabel(time) + "." };
  const pl = B.plan({ rows: [{ day: rowDay, time, teacher: teacher.name }], country: s.country, state: s.state, teachers, isQuran: isQ, master: isQ ? teacher.name : "", own: s });
  if (pl.problems.length) return { error: pl.problems.join("\n") };
  const it = pl.items[0];
  if (!it || String(it.teacherId) !== String(teacher.id) || it.rowDay !== rowDay || it.slot !== slot)
    return { error: "That cell doesn't match " + s.name + "'s time zone — use “Change classes”." };
  const res = B.book(teachers, [it], { ...s, sub: isQ ? "" : llqaSubjects(s) || "Subject" });
  if (!res.ok) return { error: res.problems.join("\n") };
  return { teachers: res.teachers, it, rows: [...rows, { day: it.day, time: it.time, teacher: it.teacher, pktDay: it.pktDay, pktSlot: it.slot }] };
};
// The CRM teacher record behind a Timetable teacher.
const llqaAppTeacher = (tt) => {
  const id = tt && (tt._appId != null ? tt._appId : tt._overlayAppId);
  return id == null ? null : (LLQAApp.ctx.teachers || []).find((t) => String(t.id) === String(id)) || null;
};
// Paste / drag a student's class onto a cell: book it for the student.
// Returns an error message, or "" when done.
const llqaPasteClass = (s, clip, tt, rowDay, slot, existing) => {
  if (existing && typeof existing === "object" && existing.s) {
    if (LLQABooking.sameStudent(existing, s)) return "";
    return "That slot already has " + existing.s + "'s class. Free it first (Mark as Free), or paste on a free slot.";
  }
  const at = llqaAppTeacher(tt);
  if (!at) return (tt && tt.name ? tt.name : "This teacher") + " isn't saved as a teacher in the CRM yet (HR → Teachers), so a student's class can't be booked here.";
  const p = llqaPlanClassAt(LLQAApp.ctx.teachers || [], s, llqaRowsOf(s), at, rowDay, slot);
  if (p.error) return p.error;
  let teachers = p.teachers;
  // keep the class's notes / flags
  if (Array.isArray(clip.f) && clip.f.length)
    teachers = teachers.map((t) => {
      if (String(t.id) !== String(at.id)) return t;
      const sch = { ...t._ttSchedule, [rowDay]: { ...(t._ttSchedule[rowDay] || {}) } };
      sch[rowDay][slot] = { ...sch[rowDay][slot], f: clip.f.slice() };
      return { ...t, _ttSchedule: sch };
    });
  const f = llqaClassFields(p.rows);
  llqaSaveClasses(s, f, teachers.filter((t) => String(t.id) === String(at.id)),
    "✓ " + s.name + " now also has " + rowDay + " " + LLQABooking.timeLabel(p.it.time) + " with " + at.name + " — " + llqaWeekText(f.schedule.length) + ". Tell the family?");
  return "";
};
// Copy Monday → Tue–Fri: only free slots are filled. A student's Monday class
// is booked for that student on the other days (their record follows); other
// Monday entries are copied as they are. Classes already booked stay.
// Returns false (cancelled) / null (not a CRM teacher) / a summary.
const llqaCopyMonday = (tt) => {
  const B = LLQABooking;
  const ctx = LLQAApp.ctx;
  const at = llqaAppTeacher(tt);
  if (!at) return null;
  const mon = (tt.schedule && tt.schedule.Mon) || {};
  const days = ["Tue", "Wed", "Thu", "Fri"];
  const isBooked = (v) => !!(v && typeof v === "object" && v.s);
  const isFree = (v) => v === undefined || v === null || v === "" || v === "F";
  const plan = [];
  let kept = 0;
  Object.keys(mon).forEach((slot) => {
    const v = mon[slot];
    if (isFree(v)) return;
    days.forEach((d) => {
      const cur = tt.schedule[d] ? tt.schedule[d][slot] : undefined;
      if (isBooked(cur)) {
        if (!(isBooked(v) && cur.s === v.s && String(cur.l || "") === String(v.l || ""))) kept++;
        return;
      }
      if (!isFree(cur) && !isBooked(v)) return; // same kind of mark already there
      if (!isFree(cur)) {
        kept++;
        return;
      }
      plan.push({ d, slot, v });
    });
  });
  const kids = new Map();
  plan.forEach((x) => {
    const s = isBooked(x.v) ? llqaCellStudent(x.v) : null;
    if (s) {
      if (!kids.has(String(s.id))) kids.set(String(s.id), { s, cells: [] });
      kids.get(String(s.id)).cells.push(x);
    }
  });
  const plain = plan.filter((x) => !(isBooked(x.v) && llqaCellStudent(x.v)));
  const nAdd = [...kids.values()].reduce((a, k) => a + k.cells.length, 0);
  if (!plan.length) {
    alert("Nothing to copy: every Tue–Fri slot that Monday uses is already the same or booked." + (kept ? "\n\n" + kept + " booked slot(s) were left as they are." : ""));
    return false;
  }
  if (
    !confirm(
      "Copy Monday to Tue–Fri for " + at.name + "?\n\n" +
        "• Only free slots are filled — classes already booked on Tue–Fri stay as they are" + (kept ? " (" + kept + " slot" + (kept === 1 ? "" : "s") + ")" : "") + ".\n" +
        (kids.size
          ? "• " + kids.size + " student" + (kids.size === 1 ? "" : "s") + " get" + (kids.size === 1 ? "s" : "") + " " + nAdd + " more class" + (nAdd === 1 ? "" : "es") + " (" +
            [...kids.values()].map((k) => k.s.name + " +" + k.cells.length).join(", ") + "); their class lists are updated.\n"
          : "") +
        (plain.length ? "• " + plain.length + " other entr" + (plain.length === 1 ? "y is" : "ies are") + " copied as they are.\n" : ""),
    )
  )
    return false;
  let teachers = ctx.teachers || [];
  const done = [];
  const skipped = [];
  kids.forEach(({ s, cells }) => {
    let rows = llqaRowsOf(s);
    let added = 0;
    cells.forEach((x) => {
      const p = llqaPlanClassAt(teachers, s, rows, at, x.d, x.slot);
      if (p.error) {
        skipped.push(s.name + " " + x.d + ": " + p.error.split("\n")[0]);
        return;
      }
      teachers = p.teachers;
      rows = p.rows;
      added++;
    });
    if (added) done.push({ s, fields: llqaClassFields(rows), added });
  });
  if (plain.length)
    teachers = teachers.map((t) => {
      if (String(t.id) !== String(at.id)) return t;
      const sch = JSON.parse(JSON.stringify(t._ttSchedule || tt.schedule || {}));
      plain.forEach((x) => {
        if (!sch[x.d]) sch[x.d] = {};
        if (!isFree(sch[x.d][x.slot])) return;
        const v = isBooked(x.v) ? { ...x.v } : x.v;
        if (isBooked(v)) {
          delete v.sid; // not a current student: a plain copy, not linked to anyone
          delete v.day;
        }
        sch[x.d][x.slot] = v;
      });
      return { ...t, _ttSchedule: sch };
    });
  const mine = teachers.filter((t) => String(t.id) === String(at.id));
  if (done.length) done.forEach((x, i) => llqaSaveClasses(x.s, x.fields, i === 0 ? mine : null, ""));
  else ctx.setTeachers((prev) => (prev || []).map((t) => (t && String(t.id) === String(at.id) ? mine[0] : t)));
  const nDone = done.reduce((a, x) => a + x.added, 0);
  llqaToast({
    kind: done.length === 1 ? "moved" : "info",
    key: "copymon-" + at.id,
    ttl: 15000,
    ...(done.length === 1 ? { student: { ...done[0].s, ...done[0].fields }, studentId: done[0].s.id } : {}),
    text:
      "✓ Monday copied to Tue–Fri for " + at.name + ": " +
      [nDone && nDone + " class" + (nDone === 1 ? "" : "es") + " booked for " + done.map((x) => x.s.name).join(", "), plain.length && plain.length + " other entr" + (plain.length === 1 ? "y" : "ies") + " copied", kept && kept + " booked slot" + (kept === 1 ? "" : "s") + " kept"]
        .filter(Boolean)
        .join(", ") + "." +
      (skipped.length ? " Not booked: " + skipped.join("; ") + "." : "") +
      (done.length > 1 ? " Tell the families their new times (Contacts & Messages)." : ""),
  });
  return { booked: nDone, students: done.length, plain: plain.length, kept, skipped };
};

/* ---------- v66.2: teachers added in the CRM count everywhere the Timetable does ---------- */
// One shift's teachers exactly as the Timetable grid lists them: the built-in
// list (with saved changes) and every teacher added in the CRM for that shift.
// (Export and Smart Finder read only the built-in list, which is empty.)
const llqaShiftTeachers = (sh) => {
  const sd = TT_DATA[sh];
  if (!sd) return [];
  const app = LLQAApp.ctx.teachers || [];
  const base = sd.teachers || [];
  const codes = new Set(base.map((t) => t.code));
  const days = sh === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const empty = () => {
    const o = {};
    days.forEach((d) => {
      o[d] = {};
      sd.slots.forEach((s) => {
        o[d][s] = "F";
      });
    });
    return o;
  };
  const over = {};
  app.forEach((at) => {
    if (at && at._ttSchedule && at.code) over[at.code] = at;
  });
  return [
    ...base.map((bt) => {
      const ov = over[bt.code];
      if (!ov) return bt;
      const sch = JSON.parse(JSON.stringify(bt.schedule || {}));
      Object.keys(ov._ttSchedule).forEach((d) => {
        sch[d] = { ...(sch[d] || {}), ...ov._ttSchedule[d] };
      });
      return { ...bt, schedule: sch };
    }),
    ...app
      .filter(
        (t) =>
          t && !codes.has(t.code) &&
          (!t.department || t.department === "Quran" || t.department === "Both") &&
          (String(t.shift || "").includes(sh) || (!t.shift && sh === "Night")),
      )
      .map((t, i) => ({ sno: base.length + i + 1, name: t.name, code: t.code || "", location: t.location || "IBA", lead: t.teamLead || t.lead || "", schedule: t._ttSchedule || empty() })),
  ];
};
// When a teacher's shift starts, "HH:MM" — from the shift saved on the teacher
// in the CRM (the first one when they work several); "" when unknown.
const llqaShiftStart = (t) => {
  const own = String((t && t.shift) || "")
    .split(",")
    .map((x) => x.trim())
    .find((x) => TT_DATA[x] && TT_DATA[x].slots && TT_DATA[x].slots[0]);
  return own ? TT_DATA[own].slots[0] : "";
};
// Minutes late against a shift start, across midnight (signing in at 23:50
// for a 00:00 shift is 10 minutes early, not 23 hours 50 late).
const llqaLateBy = (nowMin, startMin) => {
  const d = nowMin - startMin;
  return d > 720 ? d - 1440 : d < -720 ? d + 1440 : d;
};

/* ============================================================
   v66 — Part 5: screens. Timetable: Leave Cover, Holidays,
   Scorecards. Sales: Autopilot (+ at-risk radar), Fee Cycle,
   Requests. Parent Portal: Requests & approvals.
   ============================================================ */
const LLQA_GATEWAYS = ["Bank Transfer", "Credit/Debit Card", "PayPal", "Stripe", "Wise", "Zelle", "Cash", "Western Union", "Other"];
const llqaTh = (t) =>
  React.createElement("th", { key: t, style: { textAlign: "left", padding: "8px 10px", color: c.textSec, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid " + c.border, whiteSpace: "nowrap" } }, t);
const llqaTd = (kids, k, st) =>
  React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + llqaAlpha(c.border, "66"), fontSize: 12, color: c.text, verticalAlign: "middle", ...(st || {}) } }, kids);
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
const llqaSmall = (text, col, key) => React.createElement("div", { key, style: { color: col || c.textMuted, fontSize: 10, marginTop: 2 } }, llqaIconize(text, { size: 11, keep: true, gap: 4 }));
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
        React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700 } }, llqaLabel("🤖 " + title + " — " + (on ? "ON" : "OFF"))),
        React.createElement("div", { style: { color: c.textSec, fontSize: 11, marginTop: 3, lineHeight: 1.5 } }, on ? onText : offText),
      ),
      manage
        ? llqaMini(on ? "Turn off" : "Turn on", () => {
            if (typeof ctx.setAutomation === "function") ctx.setAutomation({ ...(ctx.automation || {}), [key]: !on });
          }, { big: true, tone: "success", solid: !on, key: "sw" })
        : null,
    ),
    { border: on ? llqaAlpha(c.success, "66") : c.border, key: "sw-" + key },
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
        ? React.createElement("div", { style: { color: c.warn, fontSize: 11, marginTop: -6, marginBottom: 8 } }, llqaLabel("⚠ This family has no Parent ID yet, so the link can't open their portal — they can still reply on WhatsApp."))
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
        : { kind: "info", ttl: 7000, text: "No free teacher for those classes — mark them off, or move them with “Change classes”." },
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
        style: { ...llqaSelectStyle, border: "1px solid " + llqaAlpha((opts.length ? c.accent : c.danger), "88"), maxWidth: 230 },
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
        { key: String(l.id), border: bNeed.length ? llqaAlpha(c.danger, "66") : c.border },
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
      { key: d.id, style: { padding: "10px 0", borderTop: "1px solid " + llqaAlpha(c.border, "66"), opacity: old ? 0.6 : 1 } },
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" } },
        React.createElement(
          "div",
          null,
          React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 700 } }, llqaLabel((kind === "ramadan" ? "🌙 " : kind === "notice" ? "📣 " : "🗓 ") + (d.name || "Holiday") + " · " + llqaRangeLabel(d.from, d.to))),
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
  // v67: Remind sends what is due now — not a stage already sent, not a family on fee hold
  const sentKeys = llqaLogIndex(ctx.messageLog).keys;
  const remind = shown.filter((x) => {
    if (!(x.cy.status === "overdue" || x.cy.status === "due" || x.cy.status === "partial") || !llqaPhone(x.s.phone, x.s.country) || x.s.feeHold) return false;
    const fs = typeof llqaFeeStage === "function" ? llqaFeeStage(x.s, x.cy, today) : null;
    return !fs || !sentKeys.has(fs.key);
  });
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
              // v67: each family gets the message of their stage (once per stage)
              items: remind.map((x) => {
                const fs = llqaFeeStage(x.s, x.cy, today);
                return fs
                  ? { studentId: x.s.id, student: x.s, template: fs.tpl, extra: { fee: llqaFeeText(fs, x.cy), deadline: llqaDateLabel(llqaAddDays(today, 3)) }, key: fs.key }
                  : { studentId: x.s.id, student: x.s, template: "feeDue", extra: feeTxt(x) };
              }),
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
              const fs = llqaFeeStage(s, cy, today); // v67
              const sentN = fs ? llqaFeeStageSent(s, fs.oldest.ym) : 0;
              // v67: referral rewards — on a bill, or waiting for the next one
              const offMap = typeof llqaRewardOff === "function" ? llqaRewardOff(s.id) : null;
              const oldestYm = cy.months.length ? cy.months[cy.months.length - 1].ym : "";
              const offs = offMap ? [...offMap.entries()].filter(([ym, v]) => v > 0 && ym >= oldestYm).sort((a, b) => a[0].localeCompare(b[0])).map(([ym, off]) => ({ ym, off })) : cy.months.filter((m) => m.off > 0);
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
                    ? [React.createElement("div", { key: "l", style: { fontWeight: 700, color: cy.owed.length ? c.danger : c.text } }, cy.left + " " + cy.cur), cy.owed.length ? llqaSmall("overdue: " + cy.owed.map((m) => llqaMonthLabel(m.ym)).reverse().join(", "), c.danger, "o") : null, offs.length ? llqaSmall("🎁 " + offs.map((m) => m.off + " off " + llqaMonthLabel(m.ym)).join(", "), c.success, "rw") : null]
                    : [React.createElement("span", { key: "d", style: { color: c.success } }, "—"), offs.length ? llqaSmall("🎁 " + offs.map((m) => m.off + " off " + llqaMonthLabel(m.ym)).join(", "), c.success, "rw") : null],
                  "e",
                ),
                llqaTd([
                  stPill(cy.status),
                  s.fee !== llqaFeeTarget(cy) && LLQA_FEE_AUTO_SET.includes(s.fee) ? llqaSmall("Fee Status now: " + s.fee, c.warn, "fs") : null,
                  // v67: reminder stage and what was sent
                  fs ? llqaSmall("Reminder " + fs.n + " of 4 · " + fs.name + (sentN ? " · #" + sentN + " sent" : " · not sent yet"), fs.n >= 3 ? c.danger : c.warn, "st") : null,
                  s.feeHold ? llqaSmall("⏸ classes paused (fee hold)", c.danger, "fh") : null,
                ], "f"),
                llqaTd(
                  React.createElement(
                    "div",
                    { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                    llqaMini("💰 Record", () => llqaOpen("payment", { studentId: s.id }), { key: "p", tone: "success" }),
                    cy.left
                      ? llqaMini("💬", () => llqaOpen("message", fs ? { studentId: s.id, template: fs.tpl, extra: { fee: llqaFeeText(fs, cy), deadline: llqaDateLabel(llqaAddDays(today, 3)) }, msgKey: fs.key } : { studentId: s.id, template: "feeDue", extra: feeTxt(x) }), { key: "m", disabled: !digits, title: fs ? "Reminder " + fs.n + ": " + fs.name : "Fee reminder" })
                      : null,
                    // v67: final stage — pause classes until paid; resume once paid
                    llqaCanManage() && fs && fs.n >= 4 && !s.feeHold
                      ? llqaMini("⏸ Pause", () => {
                          if (confirm("Pause " + s.name + "'s classes until the fee is paid? The student goes on leave (Fee hold); the class times stay booked.")) llqaFeeHold(s);
                        }, { key: "h", tone: "danger", title: "Final notice sent: pause classes until paid" })
                      : null,
                    llqaCanManage() && s.feeHold
                      ? llqaMini("Resume", () => llqaFeeResume(s), { icon: "play", key: "rs", tone: cy.status === "overdue" ? undefined : "success", title: cy.status === "overdue" ? "Still overdue — resume anyway" : "Paid — resume classes" })
                      : null,
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
      { key: r.id, border: open ? llqaAlpha(col, "66") : c.border },
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
          { border: llqaAlpha(c.accent, "88"), key: "asks" },
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
              { key: r.id, style: { display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: "1px solid " + llqaAlpha(c.border, "55") } },
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
    React.createElement("span", null, llqaLabel("✋ The academy is asking for your approval (" + n + "). ")),
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

/* ============================================================
   v67 — Part 6: logic. Timetable: make-up classes, teachers'
   daily schedules, smart teacher matching, capacity heatmap.
   Sales: leads & follow-ups, revenue & churn, step-by-step fee
   reminders, win-back and referral rewards. A tab running an
   older version stops its automatic work.
   ============================================================ */
// Settings (settings/automation) with their defaults.
const LLQA_V67_DEFAULTS = {
  makeupPolicy: { teacherLeave: true, excused: true, absent: false, holiday: false },
  makeupDays: 14,
  feeStages: [0, 5, 12, 20],
  winback: [14, 45, 90],
  winbackOffer: "",
  referralReward: 10,
  fx: {},
};
const llqaOpt = (k) => {
  const a = LLQAApp.ctx.automation || {};
  return a[k] != null ? a[k] : LLQA_V67_DEFAULTS[k];
};
const llqaSetOpt = (patch) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setAutomation !== "function") return false;
  ctx.setAutomation({ ...(ctx.automation || {}), ...patch });
  return true;
};
const llqaPad2 = (n) => String(n).padStart(2, "0");
const llqaHm = (min) => llqaPad2(Math.floor(min / 60)) + ":" + llqaPad2(min % 60);
// "0500 PM" (as saved in schedules) from minutes after midnight
const llqaUsTime = (min) => {
  const h = Math.floor(min / 60);
  let dh = h % 12;
  if (dh === 0) dh = 12;
  return llqaPad2(dh) + llqaPad2(min % 60) + " " + (h >= 12 ? "PM" : "AM");
};
const llqaZoneShort = (tz) => {
  const z = llqaZoneLabel(tz) || "";
  return z ? z + " time" : "family time";
};

/* ---------- message templates (v67) ---------- */
(() => {
  const fam = [
    ["makeupBooked", "Make-up class booked",
      "Assalamu Alaikum {parent}, {student}'s make-up class is booked for {makeupWhen} ({zone} time) with {teacher}. JazakAllah Khair!", "ctx"],
    ["feeOverdue", "Fee reminder — overdue",
      "Assalamu Alaikum {parent}, a reminder that {student}'s fee ({fee}) is now overdue. Please send it when you can and let us know. JazakAllah Khair!"],
    ["feeFirm", "Fee reminder — second notice",
      "Assalamu Alaikum {parent}, {student}'s fee ({fee}) is still unpaid. Please clear it this week so classes continue without a break. If anything is difficult, just reply and we'll work it out together. JazakAllah Khair!"],
    ["feeFinal", "Fee reminder — final notice",
      "Assalamu Alaikum {parent}, this is a final reminder: {student}'s fee ({fee}) is unpaid. If it isn't cleared by {deadline}, classes will be paused until it is. Please reply if you need help. JazakAllah Khair!"],
    ["winBack1", "Win-back — we miss you",
      "Assalamu Alaikum {parent}, we miss {student} at {academy}! If the timing or anything else didn't suit you, reply and we'll find a better fit. JazakAllah Khair!"],
    ["winBack2", "Win-back — offer",
      "Assalamu Alaikum {parent}, we'd love to have {student} back. {offer}Reply and we'll book a time that suits you. JazakAllah Khair!"],
    ["winBack3", "Win-back — last check-in",
      "Assalamu Alaikum {parent}, checking in one last time — {student} is always welcome back at {academy}. Reply anytime and we'll set it up. JazakAllah Khair!"],
    ["referralThanks", "Referral reward — thank you",
      "Assalamu Alaikum {parent}, JazakAllah Khair for referring {referred} to {academy}! As a thank-you, {reward} comes off {student}'s next fee.", "ctx"],
    ["leadWelcome", "New inquiry — welcome",
      "Assalamu Alaikum {parent}, thank you for your interest in {academy}! We offer a free trial with a qualified teacher at a time that suits you. Which days and times work best for {student}?", "ctx"],
    ["leadFollowUp", "Inquiry — follow-up",
      "Assalamu Alaikum {parent}, following up about {student}'s classes at {academy}. Shall we book the free trial? Just reply with a day and time that suit you.", "ctx"],
  ];
  const staff = [
    ["teacherDay", "Teachers — your classes",
      "Assalamu Alaikum {name}, your classes for {day} (Pakistan time):\n{classes}\n\nJazakAllah Khair!", "staff"],
    ["makeupTeacher", "Teachers — make-up class",
      "Assalamu Alaikum {name}, a make-up class is booked with you: {makeupPkt} (Pakistan time) — {student}. It is in your Today's Classes. JazakAllah Khair!", "staff"],
  ];
  const have = new Set(LLQA_TEMPLATES.map((x) => x[0]));
  const at = LLQA_TEMPLATES.findIndex((x) => x[0] === "custom");
  LLQA_TEMPLATES.splice(at < 0 ? LLQA_TEMPLATES.length : at, 0, ...fam.filter((x) => !have.has(x[0])));
  staff.filter((x) => !have.has(x[0])).forEach((x) => LLQA_TEMPLATES.push(x));
})();

/* ---------- make-up classes ---------- */
const LLQA_MAKEUP_WHY = { teacherLeave: "Teacher on leave", excused: "Excused absence", absent: "Absent", holiday: "Holiday", other: "Arranged" };
const llqaMakeups = () => (LLQAApp.ctx.makeups || []).filter((m) => m && m.id);
const llqaMakeupPolicy = () => ({ ...LLQA_V67_DEFAULTS.makeupPolicy, ...((LLQAApp.ctx.automation || {}).makeupPolicy || {}) });
// Why a class is owed as a make-up (null = not owed).
const llqaMissedWhy = (it, pol) => {
  if (!it || !it.stu || it.quit || it.onLeave || it.makeup) return null;
  if (it.holiday) return pol.holiday ? "holiday" : null;
  if (it.off || (it.tLeave && !it.covered && !it.kept && !it.entry)) return pol.teacherLeave ? "teacherLeave" : null;
  const a = String((it.entry && it.entry.attended) || "").toLowerCase();
  if (a === "excused") return pol.excused ? "excused" : null;
  if (a === "absent") return pol.absent ? "absent" : null;
  return null;
};
// Classes owed as make-ups: the last 2 weeks (and classes already set "off"
// for the next 2 days), minus those booked, done or waived.
const llqaMakeupOwed = (today) => {
  const ctx = LLQAApp.ctx;
  const t = today || todayPK();
  return llqaCached(
    "owed:" + t,
    [ctx.teachers, ctx.students, ctx.dailyProgress, ctx.covers, ctx.leaves, ctx.calendar, ctx.makeups, ctx.automation, llqaLen(ctx.dailyProgress), llqaLen(ctx.covers), llqaLen(ctx.makeups)],
    () => {
      const pol = llqaMakeupPolicy();
      const back = Math.max(1, Math.min(60, Number(llqaOpt("makeupDays")) || 14));
      const taken = new Set(llqaMakeups().map((m) => m.missedKey).filter(Boolean));
      const out = [];
      llqaDatesIn(llqaAddDays(t, -back), llqaAddDays(t, 2)).forEach((date) => {
        const ahead = date >= t;
        llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress).forEach((it) => {
          if (ahead && !it.off) return; // later classes: only those already set "class off"
          const why = llqaMissedWhy(it, pol);
          if (!why) return;
          const key = date + "|" + it.key;
          if (taken.has(key)) return;
          out.push({ key, date, it, why, stu: it.stu });
        });
      });
      return out.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.it.min - b.it.min);
    },
  );
};
// Teachers busy at each slot of a Pakistan date: their own classes (unless
// covered by someone else, off, a holiday, or the student is away), the
// classes they cover, and make-ups.
const llqaBusyIndex = (date) => {
  const ctx = LLQAApp.ctx;
  return llqaCached(
    "busy:" + date,
    [ctx.teachers, ctx.students, ctx.dailyProgress, ctx.covers, ctx.makeups, ctx.leaves, ctx.calendar, llqaLen(ctx.makeups), llqaLen(ctx.covers)],
    () => {
      const busy = new Set();
      llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress).forEach((x) => {
        if (x.holiday || x.off || x.onLeave || x.quit) return;
        if (x.covered) busy.add(String(x.cover.coverId) + "|" + x.slot);
        else busy.add(String(x.teacherId) + "|" + x.slot);
      });
      return busy;
    },
  );
};
// The family's date, Timetable row (their weekday) and clock for a Pakistan date + slot.
const llqaFamAt = (date, slot, tz) => {
  const B = LLQABooking;
  const ref = new Date(date + "T07:00:00Z");
  const diff = B.offsetAt("Asia/Karachi", ref) - B.offsetAt(tz, ref);
  const famMin0 = llqaSlotMin(slot) - diff;
  const back = famMin0 < 0 ? -1 : famMin0 >= 1440 ? 1 : 0;
  const famMin = ((famMin0 % 1440) + 1440) % 1440;
  const famDate = llqaAddDays(date, back);
  return { famDate, rowDay: llqaWeekday(famDate), famMin, famTime: B.fmt12(llqaHm(famMin)), time: llqaUsTime(famMin) };
};
// Times for a make-up: the next week, inside the teacher's own Timetable
// (shift days and slots), when they are free, not on leave, not a holiday,
// on a day the student has no class, between 8 AM and 9:30 PM for the family,
// closest to the usual class time; the usual teacher first.
const llqaMakeupOptions = (stu, opt) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const o = opt || {};
  const today = o.today || todayPK();
  const tz = (stu && (stu.tz || B.timezoneFor(stu.country, stu.state))) || "";
  if (!stu) return { error: "Student not found.", list: [] };
  if (!tz) return { error: "No time zone for " + stu.name + " — set their State / Province first.", list: [] };
  const rows = llqaRowsOf(stu);
  const usual = rows.map((r) => parseUSTime(r.time)).filter(Boolean).map((p) => p.hour * 60 + p.minute);
  const own = (rows[0] && rows[0].teacher) || (stu.teacher && stu.teacher !== "Unassigned" ? stu.teacher : "");
  const ok = llqaDeptOk(stu.course === "Subject" ? "Subject" : "Quran", Array.isArray(stu.specificSubject) ? stu.specificSubject : []);
  const pool = (ctx.teachers || []).filter((t) => t && B.isActive(t) && ok(t) && (o.anyTeacher || !own || t.name === own));
  const nowMin = o.nowMin != null ? o.nowMin : llqaNowPkMin();
  const all = [];
  for (let k = 0; k <= (o.days || 7); k++) {
    const date = llqaAddDays(today, k);
    if (llqaHolidayOn(date, "holiday")) continue;
    const day = llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress);
    // one class a day for a student (one class log a day)
    if (day.some((x) => x.stu && String(x.stu.id) === String(stu.id) && !x.off && !x.holiday)) continue;
    const busy = llqaBusyIndex(date);
    pool.forEach((t) => {
      if (llqaLeaveOn(t, date)) return;
      const seen = new Set();
      B.shiftsOf(t).forEach((sh) =>
        TT_DATA[sh].slots.forEach((slot) => {
          if (seen.has(slot)) return;
          seen.add(slot);
          if (k === 0 && llqaSlotMin(slot) <= nowMin + 60) return; // today: at least an hour ahead
          if (busy.has(String(t.id) + "|" + slot)) return;
          const f = llqaFamAt(date, slot, tz);
          if (f.famMin < 480 || f.famMin > 1290) return;
          const cell = B.rawCell(t, f.rowDay, slot);
          if (cell === undefined || (typeof cell === "string" && cell !== "F")) return; // not a working slot
          const dist = usual.length ? Math.min(...usual.map((u) => Math.abs(u - f.famMin))) : 0;
          all.push({ date, slot, t, f, dist, own: !!own && t.name === own, tz });
        }),
      );
    });
  }
  all.sort((a, b) => b.own - a.own || a.dist - b.dist || String(a.date).localeCompare(String(b.date)) || a.slot.localeCompare(b.slot));
  // the best time on each day first, then the rest — a choice of days, not a wall of times
  const pick = [];
  const days = new Set();
  all.forEach((x) => {
    if (pick.length < 6 && !days.has(x.date)) {
      days.add(x.date);
      pick.push(x);
    }
  });
  all.forEach((x) => {
    if (pick.length < (o.max || 10) && !pick.includes(x)) pick.push(x);
  });
  return { list: pick.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.slot.localeCompare(b.slot)), own, tz };
};
const llqaMakeupWhen = (m) => (m ? llqaDateLabel(m.famDate || m.date) + " at " + (m.famTime || "") : "");
const llqaMakeupPkt = (m) => (m ? llqaDateLabel(m.date) + " " + LLQABooking.fmt12(m.slot) : "");
// Book a make-up (checked again first: the Timetable may have changed).
const llqaBookMakeup = (stu, x, missed, note) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setMakeups !== "function") return { error: "Make-ups can't be saved here." };
  if (!stu || !x) return { error: "Pick a time first." };
  if (llqaBusyIndex(x.date).has(String(x.t.id) + "|" + x.slot)) return { error: x.t.name + " is no longer free then — pick another time." };
  if (llqaLeaveOn(x.t, x.date)) return { error: x.t.name + " is on leave that day." };
  const u = ctx.user || {};
  const rec = {
    id: llqaUid("mk"),
    sid: stu.id,
    student: stu.name || "",
    parent: stu.parent || "",
    course: stu.course || "",
    country: stu.country || "",
    state: stu.state || "",
    teacherId: x.t.id,
    teacher: x.t.name,
    date: x.date,
    slot: x.slot,
    rowDay: x.f.rowDay,
    famDate: x.f.famDate,
    famTime: x.f.famTime,
    time: x.f.time,
    tz: x.tz || stu.tz || "",
    status: "booked",
    reason: missed ? missed.why : "other",
    missedDate: missed ? missed.date : "",
    missedKey: missed ? missed.key : "",
    note: note || "",
    by: u.name || u.role || "",
    at: new Date().toISOString(),
  };
  ctx.setMakeups((prev) => [...(prev || []), rec]);
  return { rec };
};
const llqaSetMakeup = (id, patch) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setMakeups !== "function") return false;
  ctx.setMakeups((prev) => (prev || []).map((m) => (m && m.id === id ? { ...m, ...patch } : m)));
  return true;
};
// Not owed after all (e.g. the family didn't want one): never suggested again.
const llqaWaiveMissed = (missed, why) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setMakeups !== "function" || !missed) return false;
  const u = ctx.user || {};
  const s = missed.stu || {};
  ctx.setMakeups((prev) => [
    ...(prev || []),
    { id: llqaUid("mk"), sid: s.id, student: s.name || "", status: "waived", reason: missed.why, missedDate: missed.date, missedKey: missed.key, note: why || "", by: u.name || u.role || "", at: new Date().toISOString() },
  ]);
  return true;
};
// booked → done (class logged) / not logged (date passed) / upcoming
const llqaMakeupState = (m, today) => {
  if (!m) return "";
  if (m.status !== "booked") return m.status;
  const t = today || todayPK();
  const logged = llqaDpIndex(LLQAApp.ctx.dailyProgress).byKey.get(String(m.sid) + "|" + m.date);
  if (logged) return String(logged.attended || "").toLowerCase() === "absent" ? "absent" : "done";
  return m.date < t ? "missing" : m.date === t ? "today" : "upcoming";
};
// Make-up classes as entries of a day's class list (same shape as Timetable classes).
const llqaMakeupItems = (date, tById, byId, dpx, holiday) =>
  ((LLQAApp.ctx && LLQAApp.ctx.makeups) || [])
    .filter((m) => m && m.status === "booked" && m.date === date)
    .map((m) => {
      const stu = byId.get(String(m.sid)) || null;
      const t = tById.get(String(m.teacherId)) || { id: m.teacherId, name: m.teacher };
      const tLeave = llqaLeaveOn(t, date);
      const rec = llqaCoverOn(date, m.teacherId, m.rowDay, m.slot);
      const stale = !!rec && rec.leaveId != null && rec.leaveId !== "" && !(tLeave && String(tLeave.id) === String(rec.leaveId));
      const cover = stale ? null : rec;
      const hasSub = !!(cover && cover.coverId != null && cover.coverId !== "");
      const subAway = hasSub && !!llqaLeaveOn(tById.get(String(cover.coverId)) || { id: cover.coverId, name: cover.cover }, date);
      const country = (stu && stu.country) || m.country || "";
      const onLeave =
        !!stu &&
        (stu.status === "leave"
          ? (!stu.lvFrom || stu.lvFrom <= date) && (!stu.lvTo || stu.lvTo >= date)
          : !!stu.lvPlanned && !!stu.lvFrom && stu.lvFrom <= date && (!stu.lvTo || stu.lvTo >= date));
      return {
        key: "mk|" + m.id,
        teacherId: m.teacherId,
        teacher: m.teacher,
        rowDay: m.rowDay,
        slot: m.slot,
        min: llqaSlotMin(m.slot),
        cell: {
          s: m.student || (stu && stu.name) || "",
          a: stu ? String(parseInt(stu.age, 10) || "") : "",
          c: m.course || (stu && stu.course) || "",
          sub: "",
          l: m.parent || (stu && stu.parent) || "",
          t: (m.time || "") + (country === "USA" ? " USA" : country === "Canada" ? " CA" : ""),
          country,
          state: (stu && stu.state) || m.state || "",
          phone: (stu && stu.phone) || "",
          f: [],
          sid: m.sid,
          day: m.rowDay,
        },
        tz: m.tz || "",
        famTime: m.famTime || "",
        stu,
        entry: stu ? dpx.byKey.get(String(stu.id) + "|" + date) || null : null,
        onLeave,
        quit: !!stu && stu.status === "quit",
        tLeave,
        cover,
        covered: hasSub && !subAway,
        subAway,
        off: !!(cover && cover.cancelled),
        kept: !!(cover && cover.keep),
        holiday,
        by: hasSub && !subAway ? cover.cover : m.teacher,
        makeup: m,
      };
    });

/* ---------- teachers' daily schedule ---------- */
// Each teacher's classes on a Pakistan date: their own, the ones they cover,
// make-ups. Not: holidays, classes off, students away, classes someone else
// covers. Classes still needing a teacher are listed apart.
const llqaTeacherDay = (date) => {
  const ctx = LLQAApp.ctx;
  const items = llqaClassesOn(date, ctx.teachers, ctx.students, ctx.dailyProgress);
  const tById = new Map((ctx.teachers || []).map((t) => [String(t.id), t]));
  const holiday = llqaHolidayOn(date, "holiday");
  const by = new Map();
  const needs = [];
  const add = (t, row) => {
    const k = String(t.id);
    if (!by.has(k)) by.set(k, { t, rows: [] });
    by.get(k).rows.push(row);
  };
  if (!holiday)
    items.forEach((it) => {
      if (it.quit || it.onLeave || it.off) return;
      const base = {
        date,
        min: it.min,
        slot: it.slot,
        student: it.cell.s,
        course: (it.cell.c || "") + (it.cell.sub ? " · " + it.cell.sub : ""),
        fam: it.famTime ? it.famTime + " " + llqaZoneShort(it.tz) : "",
        it,
      };
      if (it.covered) {
        const sub = tById.get(String(it.cover.coverId)) || { id: it.cover.coverId, name: it.cover.cover };
        add(sub, { ...base, kind: "cover", note: "cover for " + it.teacher });
        return;
      }
      if (it.tLeave && !it.kept) {
        needs.push(base);
        return;
      }
      const t = tById.get(String(it.teacherId)) || { id: it.teacherId, name: it.teacher };
      add(t, { ...base, kind: it.makeup ? "makeup" : "own", note: it.makeup ? "make-up" : "" });
    });
  const list = [...by.values()]
    .map((x) => ({ ...x, date, rows: x.rows.sort((a, b) => a.min - b.min) }))
    .sort((a, b) => a.rows[0].min - b.rows[0].min || String(a.t.name).localeCompare(String(b.t.name)));
  return { date, holiday, list, needs };
};
// Each teacher's next classes: from now for 24 hours. In the afternoon a Night
// teacher gets tonight's classes (tomorrow's Pakistan date), not last night's.
const llqaTeacherNext = (nowMin) => {
  const today = todayPK();
  const now = nowMin != null ? nowMin : llqaNowPkMin();
  const tomorrow = llqaAddDays(today, 1);
  const a = llqaTeacherDay(today);
  const b = llqaTeacherDay(tomorrow);
  const by = new Map();
  const put = (day, keep) =>
    day.list.forEach((x) => {
      const rows = x.rows.filter((r) => keep(r.min));
      if (!rows.length) return;
      const k = String(x.t.id);
      if (!by.has(k)) by.set(k, { t: x.t, rows: [] });
      by.get(k).rows.push(...rows);
    });
  put(a, (m) => m >= now);
  put(b, (m) => m < now);
  const at = (r) => r.date + " " + llqaHm(r.min);
  const list = [...by.values()]
    .map((x) => ({ ...x, date: x.rows[0].date }))
    .sort((p, q) => at(p.rows[0]).localeCompare(at(q.rows[0])) || String(p.t.name).localeCompare(String(q.t.name)));
  const needs = [...a.needs.filter((r) => r.min >= now), ...b.needs.filter((r) => r.min < now)];
  return { date: today, next: true, from: now, holiday: a.holiday && b.holiday ? a.holiday : null, list, needs };
};
const llqaRowDates = (rows) => [...new Set((rows || []).map((r) => r.date).filter(Boolean))];
// One line per class; classes on two Pakistan dates (the next 24 hours) carry their date.
const llqaDayLines = (rows) => {
  const multi = llqaRowDates(rows).length > 1;
  return rows
    .map((r) => "• " + (multi ? llqaDateLabel(r.date) + " " : "") + LLQABooking.fmt12(r.slot) + " — " + r.student + (r.course ? " (" + r.course + ")" : "") + (r.fam ? " · " + r.fam : "") + (r.note ? " — " + r.note : ""))
    .join("\n");
};
// "Tue 3 Nov" — for night classes (before 8 AM) also the night it is;
// "Tue 3 Nov – Wed 4 Nov" when the classes are on two dates.
const llqaDayTitle = (date, rows) => {
  const ds = llqaRowDates(rows);
  if (ds.length > 1) return llqaDateLabel(ds[0]) + " – " + llqaDateLabel(ds[ds.length - 1]);
  const d = ds[0] || date;
  return rows && rows.length && rows[0].min < 480
    ? llqaDateLabel(d) + " (the night of " + llqaDateLabel(llqaAddDays(d, -1)).split(" ")[0] + "→" + llqaDateLabel(d).split(" ")[0] + ")"
    : llqaDateLabel(d);
};
const llqaDayKey = (t, date) => "tday:" + t.id + ":" + date;
// The WhatsApp queue for a day (a date, or llqaTeacherNext()): one message a
// teacher, never twice (key = teacher + Pakistan date of their first class).
const llqaTeacherDayItems = (dateOrDay, only) => {
  const logx = llqaLogIndex(LLQAApp.ctx.messageLog);
  const day = dateOrDay && typeof dateOrDay === "object" ? dateOrDay : llqaTeacherDay(dateOrDay);
  return day.list
    .filter((x) => (!only || only.includes(String(x.t.id))) && !logx.keys.has(llqaDayKey(x.t, x.date)))
    .map((x) => llqaTeacherDayItem(x));
};
const llqaTeacherDayItem = (x, again) => ({
  student: { name: x.t.name || "Teacher", parent: x.t.name || "", phone: x.t.phone || "", country: "Pakistan" },
  template: "teacherDay",
  key: again ? undefined : llqaDayKey(x.t, x.date),
  extra: { name: x.t.name || "", day: llqaDayTitle(x.date, x.rows), classes: llqaDayLines(x.rows) },
});

/* ---------- smart teacher matching ---------- */
// Asked-for teacher gender: the form's choice, else the notes / flags
// ("female teacher", "female only").
const llqaWantGender = (p) => {
  if (!p) return "";
  if (p.teacherGender === "Female" || p.teacherGender === "Male") return p.teacherGender;
  const txt = [p.notes, ...(Array.isArray(p.f) ? p.f : [])].filter(Boolean).join(" ").toLowerCase();
  if (/female\s*(teacher|only|ustadha)|lady teacher|\bustadha\b/.test(txt)) return "Female";
  if (/(^|[^e])male\s*(teacher|only)/.test(txt)) return "Male";
  return "";
};
// Brothers and sisters: same Parent ID, WhatsApp number or family group.
const llqaFamilyOf = (p, students) => {
  if (!p) return [];
  const me = String(p.editingId != null ? p.editingId : p.id != null ? p.id : "");
  const digits = llqaPhone(p.phone, p.country);
  return (students || []).filter(
    (s) =>
      s && s.status !== "quit" && String(s.id) !== me &&
      ((p.parentId && s.parentId === p.parentId) || (digits && llqaPhone(s.phone, s.country) === digits) || (p.family && s.family && s.family === p.family)),
  );
};
// 0–100 with the reasons: asked gender, teaches a brother / sister, already
// their teacher, last month's scorecard, a lighter timetable, leave coming up.
const llqaMatchScore = (t, p, o) => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const reasons = [];
  let score = 50;
  const want = llqaWantGender(p);
  if (want) {
    if (t.gender === want) {
      score += 20;
      reasons.push(want.toLowerCase() + " teacher, as asked");
    } else {
      score -= 40;
      reasons.push("not the " + want.toLowerCase() + " teacher asked for");
    }
  }
  const sib = ((o && o.family) || []).find((s) => s.teacher === t.name);
  if (sib) {
    score += 15;
    reasons.push("teaches " + sib.name);
  }
  if (o && o.current && o.current === t.name) {
    score += 10;
    reasons.push("already the teacher");
  }
  // last month's scorecard counts, but no more than a lighter week does
  const sc = o && o.scores ? o.scores.get(t.name) : null;
  if (sc != null) {
    score += Math.max(-10, Math.min(10, Math.round((sc - 70) / 3)));
    reasons.push("scorecard " + sc);
  }
  const load = llqaLoadOf(t).booked;
  score += Math.max(-10, Math.round(10 - load / 4));
  reasons.push(load + " class" + (load === 1 ? "" : "es") + " a week");
  const soon = llqaAddDays(today, 14);
  const lv = (ctx.leaves || []).find(
    (l) =>
      l && l.from && String(l.status || "pending") !== "rejected" &&
      ((l.teacherId != null && String(l.teacherId) === String(t.id)) || l.teacherName === t.name) &&
      (l.to || l.from) >= today && l.from <= soon,
  );
  if (lv) {
    score -= 10;
    reasons.push("on leave " + llqaRangeLabel(lv.from, lv.to || lv.from));
  }
  return { score: Math.max(0, Math.min(100, score)), reasons };
};
// Teachers free for every slot, best match first (lighter week breaks ties).
const llqaRankSmart = (teachers, items, opts, p) => {
  const B = LLQABooking;
  const ctx = LLQAApp.ctx;
  const ranked = B.rankTeachers(teachers, items, opts);
  if (!ranked.length) return ranked;
  let scores = new Map();
  try {
    const month = llqaMonthAdd(todayPK().slice(0, 7), -1);
    // a few classes say little: only teachers with 4+ classes last month
    scores = new Map(llqaScorecards(month).filter((r) => r.score != null && r.scheduled >= 4).map((r) => [r.name, r.score]));
  } catch (e) {}
  const family = llqaFamilyOf(p || {}, ctx.students);
  const cur = p && p.editingId != null ? llqaFindStudent(p.editingId) : opts && opts.own ? opts.own : null;
  const current = cur && cur.teacher && cur.teacher !== "Unassigned" ? cur.teacher : "";
  return ranked
    .map((x) => ({ ...x, ...llqaMatchScore(x.t, p || {}, { scores, family, current }) }))
    .sort((a, b) => b.score - a.score || a.load.booked - b.load.booked || String(a.t.name).localeCompare(String(b.t.name)));
};

/* ---------- capacity heatmap ---------- */
const LLQA_ZONES = [
  ["America/New_York", "New York"],
  ["America/Chicago", "Chicago"],
  ["America/Los_Angeles", "Los Angeles"],
  ["America/Toronto", "Toronto"],
  ["Europe/London", "London"],
  ["Australia/Sydney", "Sydney"],
  ["Asia/Dubai", "Dubai"],
];
// For one shift: free teachers and bookings at every day and slot, and the
// waitlist families who want that time.
const llqaCapacity = (sh) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  return llqaCached("cap:" + sh, [ctx.teachers, ctx.waitlist, llqaLen(ctx.teachers), llqaLen(ctx.waitlist)], () => {
    const sd = TT_DATA[sh];
    if (!sd) return null;
    const days = sh === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const byCode = new Map((ctx.teachers || []).map((t) => [t.code, t]));
    const list = llqaShiftTeachers(sh).filter((t) => {
      const a = byCode.get(t.code);
      return !a || B.isActive(a);
    });
    const cells = {};
    let free = 0;
    let booked = 0;
    days.forEach((d) =>
      sd.slots.forEach((s) => {
        const c0 = { free: [], booked: 0 };
        list.forEach((t) => {
          const v = (t.schedule[d] || {})[s];
          if (v === undefined || v === "F") c0.free.push(t.name);
          else if (v && typeof v === "object" && v.s) c0.booked++;
        });
        free += c0.free.length;
        booked += c0.booked;
        cells[d + "|" + s] = c0;
      }),
    );
    const demand = {};
    (ctx.waitlist || []).forEach((w) => {
      if (!w || w.status !== "waiting") return;
      const m = llqaWaitMatch(w, ctx.teachers);
      if (!m.pk || !days.includes(m.pk.rowDay) || !sd.slots.includes(m.pk.slot)) return;
      const k = m.pk.rowDay + "|" + m.pk.slot;
      demand[k] = (demand[k] || 0) + 1;
    });
    return { sh, days, slots: sd.slots, cells, demand, teachers: list.length, free, booked };
  });
};
// Family-friendly times with the most free teachers, for one family time zone.
const llqaBestTimes = (cap, tz, n) => {
  if (!cap) return [];
  const B = LLQABooking;
  const ref = new Date();
  const diff = B.offsetAt("Asia/Karachi", ref) - B.offsetAt(tz, ref);
  const out = [];
  cap.days.forEach((d) =>
    cap.slots.forEach((s) => {
      const c0 = cap.cells[d + "|" + s];
      if (!c0 || !c0.free.length) return;
      const fam = (((llqaSlotMin(s) - diff) % 1440) + 1440) % 1440;
      const weekend = d === "Sat" || d === "Sun";
      if (weekend ? fam < 540 || fam > 1200 : fam < 900 || fam > 1260) return; // 9 AM–8 PM weekends, 3–9 PM weekdays
      out.push({ day: d, slot: s, fam, famTime: B.fmt12(llqaHm(fam)), free: c0.free.length });
    }),
  );
  return out.sort((a, b) => b.free - a.free || a.fam - b.fam).slice(0, n || 6);
};

/* ---------- leads & follow-ups ---------- */
const LLQA_LEAD_SOURCES = ["Website", "WhatsApp", "Facebook", "Instagram", "Google", "Referral", "Phone call", "Walk-in", "Other"];
const LLQA_LEAD_STAGES = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["trial", "Trial booked"],
  ["won", "Enrolled"],
  ["lost", "Lost"],
];
const LLQA_LEAD_LOST = ["No reply", "Price / fee", "Timing", "Chose another academy", "Not ready yet", "Other"];
const llqaLeads = () => (LLQAApp.ctx.leads || []).filter((l) => l && l.id);
// The status follows the student once the trial is booked.
const llqaLeadStatus = (l) => {
  if (!l) return "new";
  if (l.status === "lost") return "lost";
  if (l.studentId != null && l.studentId !== "") {
    const s = llqaFindStudent(l.studentId);
    if (s) {
      if (s.status === "quit") return "lost";
      if (!llqaInTrial(s) && (s.fee === "paid" || s.fee === "overdue" || s.fee === "partial" || s.convertedAt)) return "won";
      return "trial";
    }
    if (l.status === "won" || l.status === "trial") return l.status;
  }
  return l.status === "contacted" ? "contacted" : "new";
};
const llqaLeadDue = (l, today) => {
  const st = llqaLeadStatus(l);
  return (st === "new" || st === "contacted") && (!l.next || l.next <= (today || todayPK()));
};
const llqaLeadAsStudent = (l) => ({
  id: "lead:" + l.id,
  name: l.name || "your child",
  parent: l.parent || "",
  phone: l.phone || "",
  country: l.country || "",
  state: l.state || "",
  course: l.course || "Quran",
});
const llqaSaveLead = (lead) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setLeads !== "function" || !lead) return null;
  const u = ctx.user || {};
  const rec = lead.id ? { ...lead } : { ...lead, id: llqaUid("ld"), createdAt: new Date().toISOString(), createdBy: lead.createdBy || (typeof llqaByName === "function" ? llqaByName() : u.name || u.role || ""), status: lead.status || "new", log: lead.log || [] };
  ctx.setLeads((prev) => [...(prev || []).filter((x) => x.id !== rec.id), rec]);
  return rec;
};
const llqaLeadNote = (l, text, next, outcome) => {
  if (!l) return null;
  const u = LLQAApp.ctx.user || {};
  const entry = { at: new Date().toISOString(), by: u.name || u.role || "", text: [outcome, text].filter(Boolean).join(" — ") };
  return llqaSaveLead({ ...l, status: l.status === "new" || !l.status ? "contacted" : l.status, next: next || l.next || "", log: [...(Array.isArray(l.log) ? l.log : []), entry], lastAt: entry.at });
};
// v67.3: an inquiry from the website (posted to the 24/7 runner) becomes a lead,
// due today. The same WhatsApp number already open as a lead gets a note
// instead of a second lead; a number that is already a family is marked.
const llqaLeadIntake = (x) => {
  const ctx = LLQAApp.ctx;
  if (!x || typeof ctx.setLeads !== "function") return { error: "not ready" };
  try {
    if (typeof LLQACloud !== "undefined" && LLQACloud.ready && (!LLQACloud.ready("leads") || !LLQACloud.ready("students"))) return { error: "not ready" };
  } catch (e) {}
  const today = todayPK();
  const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n || 120);
  const lead = {
    name: clean(x.name),
    parent: clean(x.parent),
    phone: clean(x.phone, 40),
    email: clean(x.email, 120),
    country: clean(x.country, 40) || "USA",
    state: clean(x.state, 60),
    course: /subject/i.test(String(x.course || "")) ? "Subject" : "Quran",
    source: clean(x.source, 30) || "Website",
    referredBy: clean(x.referredBy),
    wantDay: LLQABooking.DAYS.includes(String(x.wantDay || "")) ? String(x.wantDay) : "",
    wantTime: /^\d{4} (AM|PM)$/.test(String(x.wantTime || "")) ? String(x.wantTime) : "",
    notes: clean(x.message || x.notes, 1000),
    next: today,
  };
  if (!lead.phone || (!lead.name && !lead.parent)) return { error: "name and phone needed" };
  const digits = llqaPhone(lead.phone, lead.country);
  const open = digits ? llqaLeads().find((l) => /^(new|contacted)$/.test(llqaLeadStatus(l)) && llqaPhone(l.phone, l.country) === digits) : null;
  if (open) {
    const saved = llqaLeadNote(open, "New inquiry again (" + lead.source + ")" + (lead.notes ? ": " + lead.notes : ""), today, "");
    return { ok: true, id: saved ? saved.id : open.id, duplicate: true };
  }
  const fam = digits ? (ctx.students || []).find((s) => s && llqaPhone(s.phone, s.country) === digits) : null;
  const rec = llqaSaveLead({ ...lead, status: "new", createdBy: lead.source, notes: (fam ? "Already a family: " + fam.name + (fam.status === "quit" ? " (left)" : "") + ". " : "") + lead.notes });
  return rec ? { ok: true, id: rec.id, duplicate: false, family: fam ? fam.name : "" } : { error: "not saved" };
};
const llqaLeadLost = (l, reason) => llqaSaveLead({ ...l, status: "lost", lostReason: reason || "Other", lostAt: todayPK() });
// Add Student filled in from a lead (the form books the trial).
const llqaLeadForm = (l) => {
  const rows = l.wantDay && l.wantTime ? [{ id: 1, day: l.wantDay, time: l.wantTime, teacher: "" }] : [{ id: 1, day: "Mon", time: "", teacher: "" }];
  return {
    name: l.name || "",
    age: l.age || "",
    gender: l.gender || "",
    parent: l.parent || "",
    country: l.country || "USA",
    state: l.state || "",
    course: l.course || "Quran",
    specificSubject: [],
    teacher: "",
    fee: "trial",
    time: "",
    dor: todayPK(),
    phone: l.phone || "",
    email: l.email || "",
    hoursPerWeek: "",
    classType: "Trial",
    fee_amount: "",
    currency: "USD",
    notes: l.notes || "",
    family: "",
    referredBy: l.source === "Referral" ? l.referredBy || "" : "",
    schedule: rows,
    _leadId: l.id,
  };
};
// Called after Add Student saved a student made from a lead.
const llqaLeadBooked = (leadId, stu) => {
  const l = llqaLeads().find((x) => x.id === leadId);
  if (!l || !stu) return null;
  return llqaSaveLead({ ...l, status: "trial", studentId: stu.id, bookedAt: todayPK() });
};
const llqaLeadStats = (today) => {
  const t = today || todayPK();
  const all = llqaLeads();
  const st = all.map((l) => llqaLeadStatus(l));
  const since = (d, n) => !!d && String(d).slice(0, 10) >= llqaAddDays(t, -n);
  const won90 = all.filter((l, i) => st[i] === "won" && since(l.bookedAt || l.createdAt, 90)).length;
  const lost90 = all.filter((l, i) => st[i] === "lost" && since(l.lostAt || l.createdAt, 90)).length;
  return {
    open: st.filter((x) => x === "new" || x === "contacted").length,
    due: all.filter((l) => llqaLeadDue(l, t)).length,
    week: all.filter((l) => since(l.createdAt, 7)).length,
    trial: st.filter((x) => x === "trial").length,
    rate: won90 + lost90 ? Math.round((won90 / (won90 + lost90)) * 100) : null,
  };
};

/* ---------- revenue & churn ---------- */
const llqaPaidOn = (s) => (s && s.convertedAt ? String(s.convertedAt).slice(0, 10) : s && !llqaInTrial(s) && s.fee !== "trial" ? String(s.billStart || s.dor || "").slice(0, 10) : "");
// Every month (last n): fees billed and collected per currency, new students,
// quits, churn, trial results; this month's expected fees and what is owed.
const llqaRevenue = (n) => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  return llqaCached("rev:" + (n || 6), [ctx.students, ctx.arPayments, ctx.rewards, today, llqaLen(ctx.students), llqaLen(ctx.arPayments)], () => {
    const cur = today.slice(0, 7);
    const yms = [];
    for (let i = (n || 6) - 1; i >= 0; i--) yms.push(llqaMonthAdd(cur, -i));
    const M = new Map(yms.map((ym) => [ym, { ym, billed: {}, collected: {}, newPaid: 0, quits: 0, quitPaid: 0, reasons: {}, trialsWon: 0, trialsLost: 0, startActive: 0 }]));
    const addTo = (o, k, v) => {
      o[k] = Math.round(((o[k] || 0) + v) * 100) / 100;
    };
    const students = ctx.students || [];
    const pays = ctx.arPayments || [];
    const owed = {};
    const expected = {};
    let paying = 0;
    let trials = 0;
    students.forEach((s) => {
      if (!s) return;
      const curcy = s.currency || "USD";
      const quit = s.status === "quit";
      const qd = quit ? String(s.qDate || "").slice(0, 10) : "";
      // bills: a student who left is billed up to the day they left
      const cy = llqaFeeCycle(quit ? { ...s, status: "active" } : s, pays, quit && qd ? (qd < today ? qd : today) : today);
      if (cy) {
        cy.months.forEach((m) => {
          const row = M.get(m.ym);
          if (row) addTo(row.billed, cy.cur, m.fee);
        });
        if (!quit && cy.left > 0) addTo(owed, cy.cur, cy.left);
      }
      if (!quit && llqaInTrial(s)) trials++;
      if (!quit && !llqaInTrial(s) && Number(s.fee_amount) > 0 && s.fee !== "n/a") {
        paying++;
        addTo(expected, curcy, Number(s.fee_amount));
      }
      const start = llqaPaidOn(s);
      if (start && !llqaExisting(s)) {
        const row = M.get(start.slice(0, 7));
        if (row) row.newPaid++;
      }
      if (quit && qd) {
        const row = M.get(qd.slice(0, 7));
        if (row) {
          row.quits++;
          if (start && start < qd) row.quitPaid++;
          const r = s.qReason || "Not given";
          row.reasons[r] = (row.reasons[r] || 0) + 1;
          if (s.trialOutcome === "quit") row.trialsLost++;
        }
      }
      if (s.convertedAt && s.trialOutcome === "converted") {
        const row = M.get(String(s.convertedAt).slice(0, 7));
        if (row) row.trialsWon++;
      }
      // paying at the start of each month (for churn)
      yms.forEach((ym) => {
        const first = ym + "-01";
        if (start && start < first && (!qd || qd >= first)) M.get(ym).startActive++;
      });
    });
    pays.forEach((p) => {
      if (!p || p.type === "reward") return;
      const row = M.get(String(p.paidDate || "").slice(0, 7));
      if (row) addTo(row.collected, p.currency || "USD", Number(p.amount) || 0);
    });
    const months = yms.map((ym) => {
      const r = M.get(ym);
      return { ...r, churn: r.startActive ? Math.round((r.quitPaid / r.startActive) * 1000) / 10 : null, conv: r.trialsWon + r.trialsLost ? Math.round((r.trialsWon / (r.trialsWon + r.trialsLost)) * 100) : null };
    });
    return { months, owed, expected, paying, trials, cur };
  });
};
// One total in USD when a rate is set for every currency (rates are the admin's).
const llqaToUsd = (byCur, fx) => {
  const rates = { USD: 1, ...(fx || llqaOpt("fx") || {}) };
  let sum = 0;
  for (const [k, v] of Object.entries(byCur || {})) {
    const r = Number(rates[k]);
    if (!(r > 0)) return null;
    sum += v * r;
  }
  return Math.round(sum);
};
const llqaMoney = (byCur) =>
  Object.entries(byCur || {})
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + k)
    .join(" · ") || "0";

/* ---------- step-by-step fee reminders ---------- */
const LLQA_FEE_TPL = ["feeDue", "feeOverdue", "feeFirm", "feeFinal"];
const LLQA_FEE_STAGE_NAME = ["Due", "Overdue", "Second notice", "Final notice"];
const llqaFeeStages = () => {
  const s = llqaOpt("feeStages");
  const v = Array.isArray(s) && s.length === 4 ? s.map((x) => Math.max(0, parseInt(x, 10) || 0)) : LLQA_V67_DEFAULTS.feeStages;
  return v.map((x, i) => (i && x <= v[i - 1] ? v[i - 1] + 1 : x));
};
// Where a family is: days since the oldest unpaid bill fell due → stage 1–4.
const llqaFeeStage = (s, cy, today) => {
  const t = today || todayPK();
  if (!s || !cy || !cy.months || !cy.months.length) return null;
  const open = cy.months.filter((m) => m.left > 0 && m.due <= t);
  if (!open.length) return null;
  const oldest = open[open.length - 1];
  const days = llqaDays(oldest.due, t) || 0;
  let n = 0;
  llqaFeeStages().forEach((d, i) => {
    if (days >= d) n = i + 1;
  });
  if (!n) return null;
  const owed = Math.round(open.reduce((a, m) => a + m.left, 0) * 100) / 100;
  return { n, tpl: LLQA_FEE_TPL[n - 1], name: LLQA_FEE_STAGE_NAME[n - 1], days, oldest, owed, open, key: "fee:" + s.id + ":" + oldest.ym + ":s" + n };
};
// "95 USD (Sep 2026, Oct 2026)" / "45 USD for Nov 2026"
const llqaFeeText = (fs, cy) =>
  fs.owed + " " + cy.cur + (fs.open.length > 1 ? " (" + fs.open.map((m) => llqaMonthLabel(m.ym)).reverse().join(", ") + ")" : " for " + llqaMonthLabel(fs.oldest.ym));
// The last stage already sent for that bill (0 = none).
const llqaFeeStageSent = (s, ym) => {
  const keys = llqaLogIndex(LLQAApp.ctx.messageLog).keys;
  for (let n = 4; n >= 1; n--) if (keys.has("fee:" + s.id + ":" + ym + ":s" + n)) return n;
  return 0;
};
// Final stage: pause classes until the fee is paid (slots stay booked).
// The family's own leave (current or planned) is kept and comes back on resume.
const LLQA_LV_KEEP = ["status", "lvType", "lvFrom", "lvTo", "lvReason", "lvPlanned"];
const llqaFeeHold = (s) => {
  const ctx = LLQAApp.ctx;
  if (!s || typeof ctx.setStudents !== "function") return false;
  const prev = {};
  LLQA_LV_KEEP.forEach((k) => {
    prev[k] = s[k] == null ? "" : s[k];
  });
  const fields = { status: "leave", lvType: "Fee hold", lvFrom: todayPK(), lvTo: "", lvReason: "Fee unpaid", feeHold: true, lvPlanned: false, feeHoldPrev: s.feeHold ? s.feeHoldPrev || null : prev };
  ctx.setStudents((list) => (list || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  return true;
};
const llqaFeeResume = (s) => {
  const ctx = LLQAApp.ctx;
  if (!s || typeof ctx.setStudents !== "function") return false;
  const today = todayPK();
  const p = s.feeHoldPrev && typeof s.feeHoldPrev === "object" ? s.feeHoldPrev : null;
  const none = { status: "active", lvType: "", lvFrom: "", lvTo: "", lvReason: "", lvPlanned: false };
  const back =
    p && p.status === "leave" && (!p.lvTo || p.lvTo >= today)
      ? { status: "leave", lvType: p.lvType || "", lvFrom: p.lvFrom || "", lvTo: p.lvTo || "", lvReason: p.lvReason || "", lvPlanned: false }
      : p && p.lvPlanned && p.lvFrom && (p.lvTo || p.lvFrom) >= today
        ? { status: "active", lvType: p.lvType || "", lvFrom: p.lvFrom, lvTo: p.lvTo || "", lvReason: p.lvReason || "", lvPlanned: true }
        : none;
  const fields = { ...back, feeHold: false, feeHoldPrev: null };
  ctx.setStudents((list) => (list || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  return true;
};

/* ---------- win-back ---------- */
const llqaWinbackDays = () => {
  const s = llqaOpt("winback");
  const v = Array.isArray(s) && s.length === 3 ? s.map((x) => Math.max(1, parseInt(x, 10) || 1)) : LLQA_V67_DEFAULTS.winback;
  return v.map((x, i) => (i && x <= v[i - 1] ? v[i - 1] + 1 : x));
};
// Which win-back message is due for a family who left (null = none).
const llqaWinbackDue = (s, today) => {
  if (!s || s.status !== "quit" || !s.qDate || s.noWinback) return null;
  const days = llqaDays(String(s.qDate).slice(0, 10), today || todayPK());
  if (days == null || days < 0) return null;
  const st = llqaWinbackDays();
  if (days > st[2] + 30) return null; // stop a month after the last one
  let n = 0;
  st.forEach((d, i) => {
    if (days >= d) n = i + 1;
  });
  if (!n) return null;
  return { n, tpl: "winBack" + n, key: "winback:" + s.id + ":" + n, days };
};
const llqaWinbackOffer = () => {
  const o = String(llqaOpt("winbackOffer") || "").trim();
  return o ? o.replace(/\s*$/, "") + " " : "";
};
// A family coming back: active again, billed from today (not for the months away).
const llqaWinbackReturn = (s) => {
  const ctx = LLQAApp.ctx;
  if (!s || typeof ctx.setStudents !== "function") return false;
  const today = todayPK();
  const fields = { status: "active", returnedAt: today, wonBack: true, billStart: today, qDate: "", qReason: s.qReason ? "(returned) " + s.qReason : "" };
  ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, ...fields }]);
  return true;
};
const llqaNoWinback = (s, on) => {
  const ctx = LLQAApp.ctx;
  if (!s || typeof ctx.setStudents !== "function") return false;
  ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(s.id) ? { ...x, noWinback: !!on } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster([{ ...s, noWinback: !!on }]);
  return true;
};

/* ---------- referral rewards ---------- */
// Discounts applied to a student's bills: month → amount.
const llqaRewardIndex = llqaMemo((rewards) => {
  const m = new Map();
  rewards.forEach((r) => {
    if (!r || r.status !== "applied" || r.referrerId == null || !r.month) return;
    const k = String(r.referrerId);
    if (!m.has(k)) m.set(k, new Map());
    const mm = m.get(k);
    mm.set(r.month, Math.round(((mm.get(r.month) || 0) + (Number(r.amount) || 0)) * 100) / 100);
  });
  return m;
});
const llqaRewardOff = (sid) => llqaRewardIndex(LLQAApp.ctx.rewards || []).get(String(sid)) || null;
// The family who referred: the linked student, else a student or parent whose
// full name is "Referred by" or appears in it — one family only (a suggestion
// to confirm before the reward is given).
const llqaGuessReferrer = (r) => {
  const ctx = LLQAApp.ctx;
  if (!r) return null;
  if (r.referrerId != null && r.referrerId !== "") return llqaFindStudent(r.referrerId);
  const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
  const by = norm(r.referredBy);
  if (!by) return null;
  const pool = (ctx.students || []).filter((s) => s && s.status !== "quit" && String(s.id) !== String(r.studentId));
  const exact = pool.filter((s) => norm(s.name) === by || norm(s.parent) === by);
  // "Mrs. Khan (Aisha)", "Aisha Khan's mother": a full name (2+ words) inside the text
  const inText = (n) => n.split(" ").length >= 2 && (" " + by + " ").includes(" " + n + " ");
  const hits = exact.length ? exact : pool.filter((s) => inText(norm(s.name)) || inText(norm(s.parent)));
  // one family only (brothers and sisters share the reward); paying student first
  const fams = new Set(hits.map((s) => String(s.parentId || llqaPhone(s.phone, s.country) || s.id)));
  if (fams.size !== 1) return null;
  return hits.find((s) => !llqaInTrial(s) && Number(s.fee_amount) > 0) || hits[0];
};
// Every referral that became a student, with where its reward stands.
const llqaReferralRewards = () => {
  const ctx = LLQAApp.ctx;
  const rewards = (ctx.rewards || []).filter((x) => x && x.referralId);
  const payIx = llqaPayIndex(ctx.arPayments);
  return (ctx.salesReferrals || [])
    .filter((r) => r && r.studentId != null && r.studentId !== "")
    .map((r) => {
      const referred = llqaFindStudent(r.studentId);
      const referrer = llqaGuessReferrer(r);
      const paying = !!referred && !llqaInTrial(referred) && (payIx.get(String(referred.id)) || []).length > 0;
      const rec = rewards.find((x) => x.referralId === r.id) || null;
      return { r, referred, referrer, linked: r.referrerId != null && r.referrerId !== "", paying, rec, state: rec ? rec.status : paying ? (referrer ? "earned" : "noReferrer") : "waiting" };
    });
};
// Apply a reward: it comes off the referrer's next bill that isn't paid.
const llqaApplyReward = (x, amount) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setRewards !== "function" || !x || !x.referrer) return null;
  const s = x.referrer;
  const cy = llqaFeeCycle(s, ctx.arPayments);
  const month = cy ? llqaFeeNextMonth(cy) : todayPK().slice(0, 7);
  const u = ctx.user || {};
  const rec = {
    id: llqaUid("rw"),
    referralId: x.r.id,
    referrerId: s.id,
    referrer: s.name || "",
    referredId: x.referred ? x.referred.id : x.r.studentId,
    referred: x.referred ? x.referred.name : x.r.studentName || "",
    amount: Math.round((Number(amount != null ? amount : llqaOpt("referralReward")) || 0) * 100) / 100,
    currency: s.currency || "USD",
    month,
    status: "applied",
    at: new Date().toISOString(),
    by: u.name || u.role || "",
  };
  if (!(rec.amount > 0)) return null;
  ctx.setRewards((prev) => [...(prev || []), rec]);
  if (!x.linked && typeof ctx.setSalesReferrals === "function")
    ctx.setSalesReferrals((prev) => (prev || []).map((r) => (r.id === x.r.id ? { ...r, referrerId: s.id } : r)));
  return rec;
};
const llqaLinkReferrer = (ref, stuId) => {
  const ctx = LLQAApp.ctx;
  if (typeof ctx.setSalesReferrals !== "function" || !ref) return false;
  ctx.setSalesReferrals((prev) => (prev || []).map((r) => (r.id === ref.id ? { ...r, referrerId: stuId } : r)));
  return true;
};

/* ---------- Autopilot additions (v67) ---------- */
// Family messages added to the day's follow-ups: fee reminder stages,
// win-back, referral thank-yous.
const llqaPilotMore = (ctx, today, add, last) => {
  (ctx.students || []).forEach((s) => {
    if (!s) return;
    const wb = llqaWinbackDue(s, today);
    if (wb) add(s, wb.tpl, wb.key, "Left " + llqaDateLabel(String(s.qDate).slice(0, 10)) + (s.qReason ? " (" + s.qReason + ")" : "") + " — win-back " + wb.n + " of 3", { offer: llqaWinbackOffer() }, 3);
  });
  (ctx.rewards || []).forEach((r) => {
    if (!r || r.status !== "applied" || r.referrerId == null) return;
    const s = llqaFindStudent(r.referrerId);
    if (!s || s.status === "quit") return;
    add(s, "referralThanks", "refthanks:" + r.id, "Referral reward: " + r.amount + " " + r.currency + " off " + llqaMonthLabel(r.month) + " for referring " + r.referred, { referred: r.referred || "", reward: r.amount + " " + r.currency }, 3);
  });
};

/* ---------- an older version stops its automatic work ---------- */
// Every 5 minutes: is a newer CRM published? Then this tab offers a reload and
// stops its automatic work, so two versions never fight over the same records.
const llqaVersionCheck = () => {
  try {
    const mine = window.__LLQA_VERSION__ || "";
    if (!mine || LLQAUI.stale) return;
    fetch(window.location.pathname + "?vc=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : ""))
      .then((html) => {
        const m = /__LLQA_VERSION__\s*=\s*"([^"]+)"/.exec(html || "");
        if (!m || m[1] === mine) return;
        LLQAUI.stale = m[1];
        // v67.3: the 24/7 runner has nobody to click — it reloads by itself
        if (typeof LLQA_RUNNER !== "undefined" && LLQA_RUNNER) setTimeout(() => window.location.reload(), 5000);
        llqaToast({
          kind: "update",
          key: "update",
          sticky: true,
          text: "⬆ A new version of the CRM is ready (" + m[1] + "). Reload to use it — this tab has stopped its automatic work until then.",
          actions: [{ label: "⟳ Reload now", run: () => window.location.reload(), tone: "success" }],
        });
        llqaUIChanged();
      })
      .catch(() => {});
  } catch (e) {}
};

/* ============================================================
   v67 — Part 7: screens. Timetable: Make-ups, Teacher Day,
   Capacity. Sales: Leads, Revenue & churn, Win-back &
   referrals. Pop-ups: make-up finder, lead form, lead note.
   ============================================================ */
const llqaCheck = (on, label, onClick, key, disabled) =>
  React.createElement(
    "label",
    { key: key || label, style: { display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, color: c.text, cursor: disabled ? "default" : "pointer", marginRight: 14 } },
    React.createElement("input", { type: "checkbox", checked: !!on, disabled: !!disabled, onChange: onClick }),
    label,
  );
const llqaInput = (value, onChange, opt) =>
  React.createElement("input", {
    key: (opt && opt.key) || "in",
    type: (opt && opt.type) || "text",
    value: value == null ? "" : value,
    placeholder: (opt && opt.placeholder) || "",
    onChange: (e) => onChange(e.target.value),
    style: { padding: "6px 8px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 7, color: c.text, fontSize: 12, width: (opt && opt.width) || 90, ...((opt && opt.style) || {}) },
  });
const llqaRow = (kids, key) => React.createElement("div", { key, style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } }, kids);

/* ---------- Timetable: Make-ups ---------- */
const LLQA_MK_STATE = {
  upcoming: ["Upcoming", "accent"],
  today: ["Today", "success"],
  done: ["✓ Done", "success"],
  absent: ["✗ Absent", "danger"],
  missing: ["⚠ Not logged", "danger"],
  cancelled: ["Cancelled", "textSec"],
  waived: ["Not needed", "textSec"],
};
const llqaTellMakeup = (m) => {
  const s = llqaFindStudent(m.sid);
  llqaOpen("message", { studentId: m.sid, student: s || undefined, template: "makeupBooked", extra: { makeupWhen: llqaMakeupWhen(m), teacher: m.teacher }, msgKey: "mk:" + m.id });
};
const llqaTellMakeupTeacher = (m) => {
  const t = (LLQAApp.ctx.teachers || []).find((x) => String(x.id) === String(m.teacherId)) || { name: m.teacher };
  llqaOpen("queue", {
    title: "Make-up — teacher",
    items: [{ student: { name: t.name, parent: t.name, phone: t.phone || "", country: "Pakistan" }, template: "makeupTeacher", key: "mkt:" + m.id, extra: { name: t.name, makeupPkt: llqaMakeupPkt(m), student: m.student } }],
  });
};
const LLQAMakeupTab = () => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const manage = llqaCanManage();
  const [f, setF] = useState("owed");
  const [q, setQ] = useState("");
  const owed = llqaMakeupOwed(today);
  const all = llqaMakeups().filter((m) => m.status === "booked" || m.status === "cancelled");
  const booked = all.filter((m) => m.status === "booked").sort((a, b) => String(a.date + a.slot).localeCompare(String(b.date + b.slot)));
  const ahead = booked.filter((m) => m.date >= today);
  const past = booked.filter((m) => m.date < today).reverse();
  const pol = llqaMakeupPolicy();
  const ql = q.trim().toLowerCase();
  const hit = (txt) => !ql || String(txt || "").toLowerCase().includes(ql);
  const month = today.slice(0, 7);
  const doneMonth = past.filter((m) => m.date.slice(0, 7) === month && llqaMakeupState(m, today) === "done").length;
  const notLogged = past.filter((m) => llqaMakeupState(m, today) === "missing").length;
  const togg = (k) => manage && llqaSetOpt({ makeupPolicy: { ...pol, [k]: !pol[k] } });
  const owedRows = owed.filter((x) => hit(x.stu && x.stu.name) || hit(x.it.teacher));
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Owed", owed.length, "missed classes to make up", owed.length ? c.warn : c.text),
      llqaStat("Booked ahead", ahead.length, ahead.filter((m) => m.date === today).length + " today"),
      llqaStat("Done — " + llqaMonthLabel(month), doneMonth, "make-ups taught and logged", c.success),
      llqaStat("Not logged", notLogged, "past make-ups without a class log", notLogged ? c.danger : c.text),
    ),
    llqaCard([
      llqaH("🧩 When is a make-up owed?", "Missed classes from the last " + (Number(llqaOpt("makeupDays")) || 14) + " days show up here by themselves. A make-up is a one-time class on a set date: it appears in Today's Classes and the teacher's day, and it is never booked over another class."),
      React.createElement(
        "div",
        { key: "p" },
        llqaCheck(pol.teacherLeave, "Teacher on leave / class off", () => togg("teacherLeave"), "tl", !manage),
        llqaCheck(pol.excused, "Excused absence", () => togg("excused"), "ex", !manage),
        llqaCheck(pol.absent, "Absent (not excused)", () => togg("absent"), "ab", !manage),
        llqaCheck(pol.holiday, "Holidays", () => togg("holiday"), "ho", !manage),
      ),
    ]),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaChips([["owed", "Owed", owed.length], ["ahead", "Booked", ahead.length], ["past", "Past", past.length + all.filter((m) => m.status === "cancelled").length]], f, setF),
      llqaSearch(q, setQ, "Search student or teacher…"),
      manage ? llqaMini("＋ Arrange a make-up", () => llqaOpen("makeup", {}), { big: true, tone: "accent", key: "add" }) : null,
    ),
    f === "owed"
      ? llqaCard(
          owedRows.length === 0
            ? React.createElement("div", { style: { color: c.success, fontSize: 12 } }, "✓ No make-ups owed.")
            : llqaTable(
                ["Student", "Missed class", "Why", ""],
                owedRows.map((x) =>
                  React.createElement(
                    "tr",
                    { key: x.key },
                    llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, x.stu.name), llqaSmall(x.stu.parent || "", null, "p")], "a"),
                    llqaTd([React.createElement("div", { key: "d" }, llqaDateLabel(x.date) + " · " + LLQABooking.fmt12(x.it.slot) + " PKT"), llqaSmall((x.it.famTime ? x.it.rowDay + " " + x.it.famTime + " family time · " : "") + x.it.teacher, null, "t")], "b"),
                    llqaTd(llqaPill(LLQA_MAKEUP_WHY[x.why] || x.why, x.why === "teacherLeave" ? c.warn : c.accent), "c"),
                    llqaTd(
                      manage
                        ? React.createElement(
                            "div",
                            { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                            llqaMini("🧩 Find a time", () => llqaOpen("makeup", { studentId: x.stu.id, missed: x }), { key: "f", tone: "success" }),
                            llqaMini("Not needed", () => llqaWaiveMissed(x, "Not needed"), { key: "w", title: "Never suggest a make-up for this class" }),
                          )
                        : null,
                      "d",
                      { whiteSpace: "nowrap" },
                    ),
                  ),
                ),
              ),
        )
      : llqaCard(
          (() => {
            const list = (f === "ahead" ? ahead : [...past, ...all.filter((m) => m.status === "cancelled")]).filter((m) => hit(m.student) || hit(m.teacher));
            if (!list.length) return React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, f === "ahead" ? "No make-ups booked ahead." : "No past make-ups.");
            return llqaTable(
              ["Student", "When (family)", "Pakistan time · teacher", "For", "", ""],
              list.map((m) => {
                const st = llqaMakeupState(m, today);
                const d = LLQA_MK_STATE[st] || [st, "textSec"];
                return React.createElement(
                  "tr",
                  { key: m.id },
                  llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, m.student), llqaSmall(m.parent || "", null, "p")], "a"),
                  llqaTd(llqaMakeupWhen(m) + " " + llqaZoneShort(m.tz), "b"),
                  llqaTd([React.createElement("div", { key: "p" }, llqaMakeupPkt(m)), llqaSmall(m.teacher, null, "t")], "c"),
                  llqaTd([llqaPill(LLQA_MAKEUP_WHY[m.reason] || "Arranged", c.textSec, null, "w"), m.missedDate ? llqaSmall("missed " + llqaDateLabel(m.missedDate), null, "md") : null], "d"),
                  llqaTd(llqaPill(d[0], c[d[1]]), "e"),
                  llqaTd(
                    m.status === "booked" && manage
                      ? React.createElement(
                          "div",
                          { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                          llqaMini("💬 Family", () => llqaTellMakeup(m), { key: "fm" }),
                          llqaMini("💬 Teacher", () => llqaTellMakeupTeacher(m), { key: "tm" }),
                          m.date >= today
                            ? llqaMini("✕ Cancel", () => {
                                if (confirm("Cancel " + m.student + "'s make-up on " + llqaMakeupWhen(m) + "? The missed class shows as owed again.")) llqaSetMakeup(m.id, { status: "cancelled", cancelledAt: new Date().toISOString(), missedKey: "" });
                              }, { key: "x" })
                            : null,
                        )
                      : null,
                    "f",
                    { whiteSpace: "nowrap" },
                  ),
                );
              }),
            );
          })(),
        ),
  );
};
// Pop-up: pick a time for a make-up (for a missed class, or arranged by hand).
const LLQAMakeupModal = ({ studentId, missed, onClose }) => {
  const ctx = LLQAApp.ctx;
  const [sid, setSid] = useState(studentId != null ? String(studentId) : "");
  const [anyT, setAnyT] = useState(false);
  const [sel, setSel] = useState(-1);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const s = sid ? llqaFindStudent(sid) : null;
  const res = s ? llqaMakeupOptions(s, { anyTeacher: anyT }) : { list: [] };
  const opts = (ctx.students || []).filter((x) => x && x.status !== "quit" && llqaRowsOf(x).length).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const book = () => {
    const x = res.list[sel];
    if (!x) {
      setErr("Pick a time first.");
      return;
    }
    const r = llqaBookMakeup(s, x, missed || null, note);
    if (r.error) {
      setErr(r.error);
      return;
    }
    onClose();
    const m = r.rec;
    llqaToast({
      kind: "makeup",
      key: "mk-" + m.id,
      text: "🧩 Make-up booked: " + m.student + " — " + llqaMakeupWhen(m) + " " + llqaZoneShort(m.tz) + " with " + m.teacher + " (" + llqaMakeupPkt(m) + " PKT).",
      actions: [
        { label: "💬 Tell the family", run: () => llqaTellMakeup(m), tone: "success" },
        { label: "💬 Tell " + m.teacher, run: () => llqaTellMakeupTeacher(m) },
      ],
    });
  };
  return llqaShell(
    "🧩 Make-up class" + (s ? " — " + s.name : ""),
    missed ? "For the class missed on " + llqaDateLabel(missed.date) + " (" + (LLQA_MAKEUP_WHY[missed.why] || missed.why) + ")." : "A one-time class on a date you choose.",
    React.createElement(
      "div",
      null,
      studentId == null
        ? React.createElement(Inp, { label: "Student", value: sid, onChange: (v) => { setSid(v); setSel(-1); setErr(""); }, options: opts.map((x) => ({ value: String(x.id), label: x.name + (x.teacher ? " — " + x.teacher : "") })) })
        : null,
      s
        ? React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 } },
              React.createElement("div", { style: { color: c.textSec, fontSize: 11 } }, "Usual: " + (llqaRowsOf(s).map((r) => r.day + " " + LLQABooking.timeLabel(r.time)).join(", ") || "—") + " · " + (res.own || "no teacher yet")),
              llqaCheck(anyT, "Any free teacher (not only " + (res.own || "the usual one") + ")", () => { setAnyT(!anyT); setSel(-1); }, "any"),
            ),
            res.error
              ? React.createElement("div", { style: { color: c.danger, fontSize: 12 } }, res.error)
              : res.list.length === 0
                ? React.createElement("div", { style: { color: c.warn, fontSize: 12 } }, "No free time in the next week" + (anyT ? "." : " with " + (res.own || "the usual teacher") + " — tick “Any free teacher”."))
                : React.createElement(
                    "div",
                    { style: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" } },
                    res.list.map((x, i) =>
                      React.createElement(
                        "button",
                        {
                          key: x.date + x.slot + x.t.id,
                          type: "button",
                          onClick: () => {
                            setSel(i);
                            setErr("");
                          },
                          style: { textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "1px solid " + (sel === i ? c.accent : c.border), background: sel === i ? c.accentBg : c.bgDeep, color: c.text, cursor: "pointer", fontSize: 12 },
                        },
                        React.createElement("b", null, llqaDateLabel(x.f.famDate) + " · " + x.f.famTime),
                        " " + llqaZoneShort(x.tz) + " — " + llqaDateLabel(x.date) + " " + LLQABooking.fmt12(x.slot) + " PKT · " + x.t.name + (x.own ? " (usual teacher)" : ""),
                      ),
                    ),
                  ),
            React.createElement("div", { style: { marginTop: 10 } }, React.createElement(Inp, { label: "Note (optional)", value: note, onChange: setNote })),
          )
        : React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "Choose the student."),
      err ? React.createElement("div", { style: { color: c.danger, fontSize: 12, marginTop: 8 } }, err) : null,
    ),
    [llqaMini("Cancel", onClose, { key: "x", big: true }), llqaMini("✓ Book make-up", book, { key: "ok", big: true, solid: true, tone: "success", disabled: !s || sel < 0 })],
    { onClose, width: 640 },
  );
};

/* ---------- Timetable: each teacher's day ---------- */
const LLQATeacherDayTab = () => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const manage = llqaCanManage();
  // "next" = the next 24 hours (today's remaining classes and tonight's)
  const [date, setDate] = useState("next");
  const [open, setOpen] = useState({});
  const next = date === "next";
  const day = next ? llqaTeacherNext() : llqaTeacherDay(date);
  const logx = llqaLogIndex(ctx.messageLog);
  const unsent = day.list.filter((x) => !logx.keys.has(llqaDayKey(x.t, x.date)));
  const sendable = unsent.filter((x) => llqaPhone(x.t.phone, "Pakistan"));
  const classes = day.list.reduce((a, x) => a + x.rows.length, 0);
  const title = next ? "Next 24 hours — from " + LLQABooking.fmt12(llqaHm(day.from)) + " today (Pakistan time)" : llqaDateLabel(date) + " · Pakistan time";
  const when = (r) => (next && r.date !== today ? llqaDateLabel(r.date) + " " : "") + LLQABooking.fmt12(r.slot);
  const base = next ? today : date;
  const printAll = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]);
    w.document.write(
      "<html><head><title>Teachers — " + esc(title) + "</title><style>body{font-family:sans-serif;font-size:12px}h2{margin:16px 0 4px}td{padding:3px 8px;border-bottom:1px solid #ddd}</style></head><body><h1>Classes — " + esc(title) + "</h1>" +
        day.list.map((x) => "<h2>" + esc(x.t.name) + "</h2><table>" + x.rows.map((r) => "<tr><td>" + esc(when(r)) + "</td><td>" + esc(r.student) + "</td><td>" + esc(r.course) + "</td><td>" + esc(r.fam) + "</td><td>" + esc(r.note) + "</td></tr>").join("") + "</table>").join("") +
        "</body></html>",
    );
    w.document.close();
    w.focus();
    w.print();
  };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaMini("⏭ Next 24 h", () => setDate("next"), { key: "nx", tone: next ? "accent" : undefined, solid: next, title: "Today's remaining classes and tonight's" }),
      llqaMini("◀", () => setDate(llqaAddDays(base, -1)), { key: "p", title: "Previous day" }),
      llqaMini("Today", () => setDate(today), { key: "t", tone: date === today ? "accent" : undefined, solid: date === today }),
      llqaMini("Tomorrow", () => setDate(llqaAddDays(today, 1)), { key: "tm", tone: date === llqaAddDays(today, 1) ? "accent" : undefined, solid: date === llqaAddDays(today, 1) }),
      llqaMini("▶", () => setDate(llqaAddDays(base, 1)), { key: "n", title: "Next day" }),
      React.createElement("div", { key: "d", style: { color: c.text, fontSize: 13, fontWeight: 700, marginLeft: 6 } }, title),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Teachers working", day.list.length, classes + " classes"),
      llqaStat("Schedules not sent", unsent.length, unsent.length - sendable.length ? unsent.length - sendable.length + " without a usable number" : "by WhatsApp, one click each", unsent.length ? c.warn : c.success),
      llqaStat("Covers", day.list.reduce((a, x) => a + x.rows.filter((r) => r.kind === "cover").length, 0), "classes taken for a teacher on leave"),
      llqaStat("Need a teacher", day.needs.length, "teacher on leave, no cover yet", day.needs.length ? c.danger : c.text),
    ),
    day.holiday
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, llqaLabel("🗓 " + (day.holiday.name || "Holiday") + " — the academy is closed, no classes.")))
      : null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 } },
      manage && sendable.length ? llqaMini("💬 Send " + sendable.length + " schedule" + (sendable.length === 1 ? "" : "s") + " — one click each", () => llqaOpen("queue", { title: "Teachers' schedules — " + (next ? "next 24 hours" : llqaDateLabel(date)), items: llqaTeacherDayItems(day) }), { big: true, solid: true, tone: "success", key: "s" }) : null,
      day.list.length ? llqaMini("⎙ Print all", printAll, { big: true, key: "pr" }) : null,
      day.needs.length ? llqaMini("🔁 Leave Cover", () => llqaGo("timetable", "leavecover"), { big: true, key: "lc", tone: "warn" }) : null,
    ),
    day.needs.length
      ? llqaCard([
          llqaH("⚠ Still need a teacher", "These classes are not in anyone's day yet."),
          React.createElement("div", { key: "l", style: { fontSize: 12, color: c.danger, whiteSpace: "pre-wrap" } }, day.needs.map((r) => "• " + when(r) + " — " + r.student + " (" + r.it.teacher + " on leave)").join("\n")),
        ])
      : null,
    day.list.length === 0 && !day.holiday
      ? llqaCard(React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, "No classes on this day."))
      : day.list.map((x) => {
          const sent = logx.keys.has(llqaDayKey(x.t, x.date));
          const isOpen = open[x.t.id] != null ? open[x.t.id] : day.list.length <= 6;
          return llqaCard(
            [
              React.createElement(
                "div",
                { key: "h", style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", cursor: "pointer" }, onClick: () => setOpen({ ...open, [x.t.id]: !isOpen }) },
                React.createElement(
                  "div",
                  null,
                  React.createElement("span", { style: { fontWeight: 800, color: c.text, fontSize: 13 } }, (isOpen ? "▾ " : "▸ ") + x.t.name),
                  React.createElement("span", { style: { color: c.textSec, fontSize: 11, marginLeft: 8 } }, x.rows.length + " class" + (x.rows.length === 1 ? "" : "es") + " · " + when(x.rows[0]) + "–" + when(x.rows[x.rows.length - 1])),
                ),
                React.createElement(
                  "div",
                  { style: { display: "flex", gap: 5 }, onClick: (e) => e.stopPropagation() },
                  sent ? llqaPill("✓ sent", c.success, null, "ok") : null,
                  manage
                    ? llqaMini(sent ? "💬 Send again" : "💬 Send", () =>
                        llqaOpen("queue", {
                          title: "Schedule — " + x.t.name,
                          items: [llqaTeacherDayItem(x, sent)],
                        }),
                      { key: "s", tone: "success", disabled: !llqaPhone(x.t.phone, "Pakistan") })
                    : null,
                ),
              ),
              isOpen
                ? React.createElement(
                    "div",
                    { key: "t", style: { marginTop: 8 } },
                    llqaTable(
                      ["Pakistan time", "Student", "Family time", ""],
                      x.rows.map((r, i) =>
                        React.createElement(
                          "tr",
                          { key: i },
                          llqaTd(when(r), "a", { whiteSpace: "nowrap", fontWeight: 700 }),
                          llqaTd([React.createElement("div", { key: "n" }, r.student), llqaSmall(r.course, null, "c")], "b"),
                          llqaTd(r.fam || "—", "c"),
                          llqaTd(r.kind === "cover" ? llqaPill("🔁 " + r.note, c.accent) : r.kind === "makeup" ? llqaPill("🧩 make-up", c.accent) : null, "d"),
                        ),
                      ),
                    ),
                  )
                : null,
            ],
            { key: x.t.id },
          );
        }),
  );
};

/* ---------- Timetable: capacity heatmap ---------- */
const LLQACapacityTab = (props) => {
  const B = LLQABooking;
  const [sh, setSh] = useState((props && props.shift) || "Night");
  const [cell, setCell] = useState(null);
  const cap = llqaCapacity(sh);
  if (!cap) return null;
  const max = Math.max(1, ...Object.values(cap.cells).map((x) => x.free.length));
  const tone = (n) => (n === 0 ? "danger" : n <= Math.max(1, Math.round(max * 0.25)) ? "warn" : "success");
  const col = (n) => c[tone(n)];
  const total = cap.free + cap.booked;
  const pick = cell ? cap.cells[cell] : null;
  const [pd, ps] = cell ? cell.split("|") : [];
  const rowsByHour = cap.slots.map((s) => {
    const n = cap.days.reduce((a, d) => a + cap.cells[d + "|" + s].free.length, 0);
    return { s, n };
  });
  const busiest = rowsByHour.slice().sort((a, b) => a.n - b.n || a.s.localeCompare(b.s)).slice(0, 3);
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaChips(Object.keys(TT_DATA).map((k) => [k, k]), sh, (k) => {
        setSh(k);
        setCell(null);
      }),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Teachers", cap.teachers, sh + " shift"),
      llqaStat("Booked", total ? Math.round((cap.booked / total) * 100) + "%" : "—", cap.booked + " of " + total + " teacher-slots a week"),
      llqaStat("Free teacher-slots", cap.free, "a week, to sell", cap.free ? c.success : c.danger),
      llqaStat("Waiting families", Object.values(cap.demand).reduce((a, n) => a + n, 0), "want a time in this shift", Object.keys(cap.demand).length ? c.warn : c.text),
    ),
    llqaCard([
      llqaH("🌡 Free teachers at each time", "Number = teachers free then (Pakistan time, every week). Red = full · amber = nearly full · green = room. The hourglass shows families on the waitlist for that time. Click a time to see who is free."),
      React.createElement(
        "div",
        { key: "g", style: { overflowX: "auto" } },
        React.createElement(
          "table",
          { style: { borderCollapse: "separate", borderSpacing: 3, fontSize: 11 } },
          React.createElement(
            "thead",
            null,
            React.createElement("tr", null, React.createElement("th", { style: { color: c.textSec, fontWeight: 600, padding: 4 } }, ""), cap.slots.map((s) => React.createElement("th", { key: s, style: { color: c.textSec, fontWeight: 600, padding: "4px 2px", whiteSpace: "nowrap", fontSize: 10 } }, B.fmt12(s).replace(":00", "").replace(" ", "")))),
          ),
          React.createElement(
            "tbody",
            null,
            cap.days.map((d) =>
              React.createElement(
                "tr",
                { key: d },
                React.createElement("td", { style: { color: c.text, fontWeight: 700, padding: "4px 6px" } }, d),
                cap.slots.map((s) => {
                  const k = d + "|" + s;
                  const x = cap.cells[k];
                  const dem = cap.demand[k] || 0;
                  const n = x.free.length;
                  return React.createElement(
                    "td",
                    {
                      key: s,
                      title: d + " " + B.fmt12(s) + " PKT — " + n + " free" + (dem ? " · " + dem + " waiting" : ""),
                      onClick: () => setCell(cell === k ? null : k),
                      style: {
                        minWidth: 34,
                        height: 30,
                        textAlign: "center",
                        cursor: "pointer",
                        borderRadius: 5,
                        color: llqaTextOn(tone(n), n === 0 ? 70 : Math.round(30 + (60 * n) / max)), // v68: readable on every shade
                        fontWeight: 800,
                        background: "color-mix(in srgb, " + col(n) + " " + (n === 0 ? 70 : Math.round(30 + (60 * n) / max)) + "%, transparent)",
                        outline: cell === k ? "2px solid " + c.text : dem ? "2px solid " + c.warn : "none",
                      },
                    },
                    n,
                    dem ? React.createElement("div", { style: { fontSize: 9, fontWeight: 700 } }, llqaLabel("⏳" + dem)) : null,
                  );
                }),
              ),
            ),
          ),
        ),
      ),
      pick
        ? React.createElement(
            "div",
            { key: "c", style: { marginTop: 10, fontSize: 12, color: c.text } },
            React.createElement("b", null, pd + " " + B.fmt12(ps) + " PKT: "),
            pick.free.length ? pick.free.join(", ") + " free" : "everyone is booked",
            React.createElement(
              "div",
              { style: { color: c.textSec, fontSize: 11, marginTop: 4 } },
              "Family time: " + LLQA_ZONES.map(([tz, n]) => n + " " + B.fmt12(llqaHm(((llqaSlotMin(ps) - (B.offsetAt("Asia/Karachi", new Date()) - B.offsetAt(tz, new Date()))) % 1440 + 1440) % 1440))).join(" · "),
            ),
          )
        : null,
      React.createElement("div", { key: "b", style: { color: c.textSec, fontSize: 11, marginTop: 8 } }, "Fullest hours: " + busiest.map((x) => B.fmt12(x.s) + " (" + x.n + " free)").join(", ")),
    ]),
    llqaCard([
      llqaH("🎯 Best times to offer new families", "Family-friendly hours (3–9 PM on weekdays, 9 AM–8 PM at weekends, their own clock) with the most free teachers in this shift."),
      React.createElement(
        "div",
        { key: "z", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 8 } },
        LLQA_ZONES.map(([tz, n]) => {
          const best = llqaBestTimes(cap, tz, 5);
          return React.createElement(
            "div",
            { key: tz, style: { background: c.bgDeep, borderRadius: 8, padding: "8px 10px" } },
            React.createElement("div", { style: { fontWeight: 700, color: c.text, fontSize: 12 } }, n),
            best.length
              ? best.map((x, i) => React.createElement("div", { key: i, style: { fontSize: 11, color: c.textSec } }, x.day + " " + x.famTime + " — " + x.free + " free"))
              : React.createElement("div", { style: { fontSize: 11, color: c.textMuted } }, "No family-friendly time in this shift"),
          );
        }),
      ),
    ]),
  );
};

/* ---------- Sales: leads ---------- */
const LLQA_LEAD_COL = { new: "accent", contacted: "warn", trial: "purple", won: "success", lost: "textSec" };
const LLQALeadsTab = (props) => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const manage = llqaCanManage();
  const [f, setF] = useState("due");
  const [q, setQ] = useState("");
  const leads = llqaLeads();
  const st = new Map(leads.map((l) => [l.id, llqaLeadStatus(l)]));
  const stats = llqaLeadStats(today);
  const ql = q.trim().toLowerCase();
  const FILT = [
    ["due", "Follow up today", (l) => llqaLeadDue(l, today)],
    ["new", "New", (l) => st.get(l.id) === "new"],
    ["contacted", "Contacted", (l) => st.get(l.id) === "contacted"],
    ["trial", "Trial booked", (l) => st.get(l.id) === "trial"],
    ["won", "Enrolled", (l) => st.get(l.id) === "won"],
    ["lost", "Lost", (l) => st.get(l.id) === "lost"],
    ["all", "All", () => true],
  ];
  const test = (FILT.find((x) => x[0] === f) || FILT[0])[2];
  const shown = leads
    .filter((l) => test(l) && (!ql || [l.name, l.parent, l.phone, l.email, l.source, l.country, l.state].some((v) => String(v || "").toLowerCase().includes(ql))))
    .sort((a, b) => String(a.next || "9999").localeCompare(String(b.next || "9999")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const due = leads.filter((l) => llqaLeadDue(l, today));
  const dueSend = due.filter((l) => llqaPhone(l.phone, l.country));
  const book = (l) => {
    if (typeof props.openAdd === "function") props.openAdd(llqaLeadForm(l));
  };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Follow up today", stats.due, "new or contacted, follow-up date reached", stats.due ? c.warn : c.success),
      llqaStat("Open leads", stats.open, stats.week + " new this week"),
      llqaStat("Trial booked", stats.trial, "waiting to enrol"),
      llqaStat("Conversion", stats.rate == null ? "—" : stats.rate + "%", "enrolled ÷ (enrolled + lost), 90 days", c.success),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } },
      llqaSearch(q, setQ, "Search name, parent, phone, source…"),
      manage ? llqaMini("＋ New lead", () => llqaOpen("lead", {}), { big: true, solid: true, tone: "accent", key: "n" }) : null,
      manage && dueSend.length
        ? llqaMini("💬 Follow up " + dueSend.length + " — one click each", () =>
            llqaOpen("queue", {
              title: "Leads — follow-ups",
              items: dueSend.map((l) => ({ student: llqaLeadAsStudent(l), template: st.get(l.id) === "new" ? "leadWelcome" : "leadFollowUp", key: "lead:" + l.id + ":" + today })),
            }),
          { big: true, tone: "success", key: "q" })
        : null,
    ),
    React.createElement("div", { style: { marginBottom: 10 } }, llqaChips(FILT.map(([k, l, t]) => [k, l, leads.filter(t).length]), f, setF)),
    llqaCard(
      shown.length === 0
        ? React.createElement("div", { style: { color: c.textSec, fontSize: 12 } }, leads.length ? "Nobody here." : "No leads yet. Add every inquiry here (website, WhatsApp, calls): the CRM reminds you to follow up until it becomes a trial — or you mark it lost.")
        : llqaTable(
            ["Lead", "Source", "Status", "Next follow-up", "Last note", ""],
            shown.map((l) => {
              const s0 = st.get(l.id);
              const digits = llqaPhone(l.phone, l.country);
              const last = (Array.isArray(l.log) ? l.log : [])[(l.log || []).length - 1];
              const late = llqaLeadDue(l, today) && l.next && l.next < today;
              return React.createElement(
                "tr",
                { key: l.id },
                llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, (l.name || "—") + (l.parent ? " · " + l.parent : "")), llqaSmall((digits ? "+" + digits : l.phone || "no phone") + " · " + [l.state, l.country].filter(Boolean).join(", ") + " · " + (l.course || "Quran") + " · added " + llqaDateLabel(String(l.createdAt || "").slice(0, 10)), digits ? null : c.warn, "p")], "a"),
                llqaTd(l.source || "—", "b"),
                llqaTd([llqaPill((LLQA_LEAD_STAGES.find((x) => x[0] === s0) || [s0, s0])[1], c[LLQA_LEAD_COL[s0]] || c.textSec, null, "s"), s0 === "lost" && l.lostReason ? llqaSmall(l.lostReason, null, "r") : null], "c"),
                llqaTd(s0 === "new" || s0 === "contacted" ? React.createElement("span", { style: { color: late ? c.danger : llqaLeadDue(l, today) ? c.warn : c.text, fontWeight: late ? 700 : 400 } }, l.next ? llqaDateLabel(l.next) + (late ? " · late" : "") : "today") : "—", "d", { whiteSpace: "nowrap" }),
                llqaTd(last ? [React.createElement("div", { key: "t", style: { fontSize: 11 } }, last.text || "—"), llqaSmall(llqaAgo(last.at) + (last.by ? " · " + last.by : ""), null, "w")] : React.createElement("span", { style: { color: c.textMuted, fontSize: 11 } }, "—"), "e", { maxWidth: 260 }),
                llqaTd(
                  manage
                    ? React.createElement(
                        "div",
                        { style: { display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" } },
                        llqaMini("💬", () => llqaOpen("message", { student: llqaLeadAsStudent(l), template: s0 === "new" ? "leadWelcome" : "leadFollowUp", msgKey: "lead:" + l.id + ":" + today }), { key: "m", disabled: !digits, title: "WhatsApp" }),
                        llqaMini("📞", () => llqaCall(digits, { name: l.name || "", template: "call", key: "leadcall:" + l.id + ":" + today }), { key: "c", disabled: !digits, title: "Call" }),
                        s0 === "new" || s0 === "contacted" ? llqaMini("✍ Note", () => llqaOpen("leadNote", { leadId: l.id }), { key: "n", tone: "accent" }) : null,
                        s0 === "new" || s0 === "contacted" ? llqaMini("➜ Book trial", () => book(l), { key: "b", tone: "success", title: "Add Student opens filled in" }) : null,
                        s0 === "trial" && l.studentId != null ? llqaMini("Trial Pipeline", () => llqaGo("sales", "pipeline"), { key: "tp" }) : null,
                        llqaMini("Edit", () => llqaOpen("lead", { leadId: l.id }), { key: "e" }),
                      )
                    : null,
                  "f",
                  { whiteSpace: "nowrap" },
                ),
              );
            }),
          ),
    ),
  );
};
const LLQALeadModal = ({ leadId, onClose }) => {
  const old = leadId ? llqaLeads().find((l) => l.id === leadId) : null;
  const today = todayPK();
  const [f, setF] = useState(() => ({ name: "", parent: "", phone: "", email: "", country: "USA", state: "", course: "Quran", source: "WhatsApp", referredBy: "", wantDay: "", wantTime: "", next: today, notes: "", ...(old || {}) }));
  const [err, setErr] = useState("");
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const states = (typeof COUNTRY_STATES !== "undefined" && COUNTRY_STATES[f.country]) || [];
  const save = () => {
    if (!String(f.parent || "").trim() && !String(f.name || "").trim()) {
      setErr("Enter the parent's or the student's name.");
      return;
    }
    if (!String(f.phone || "").trim()) {
      setErr("Enter a phone / WhatsApp number — follow-ups need it.");
      return;
    }
    const rec = llqaSaveLead({ ...f, status: old ? old.status : "new" });
    if (!rec) {
      setErr("Leads can't be saved here.");
      return;
    }
    onClose();
    if (!old) llqaToast({ kind: "info", ttl: 8000, text: "✓ Lead saved: " + (rec.parent || rec.name) + ". Follow-up " + (rec.next && rec.next > today ? llqaDateLabel(rec.next) : "today") + ".", actions: llqaPhone(rec.phone, rec.country) ? [{ label: "💬 Welcome message", run: () => llqaOpen("message", { student: llqaLeadAsStudent(rec), template: "leadWelcome", msgKey: "lead:" + rec.id + ":" + today }), tone: "success" }] : [] });
  };
  return llqaShell(
    old ? "Edit lead" : "🎯 New lead",
    "An inquiry before the trial. When the trial is booked (➜ Book trial), it follows the student by itself.",
    React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 10px" } },
      React.createElement(Inp, { label: "Student name", value: f.name, onChange: set("name") }),
      React.createElement(Inp, { label: "Parent / guardian", value: f.parent, onChange: set("parent") }),
      React.createElement(Inp, { label: "Phone / WhatsApp *", value: f.phone, onChange: set("phone"), placeholder: "+1 555 010 1234" }),
      React.createElement(Inp, { label: "Email", value: f.email, onChange: set("email") }),
      React.createElement(Inp, { label: "Country", value: f.country, onChange: (v) => setF({ ...f, country: v, state: "" }), options: ["USA", "Canada", "UK", "UAE", "Australia", "Other"] }),
      states.length ? React.createElement(Inp, { label: "State / Province", value: f.state, onChange: set("state"), options: states }) : React.createElement(Inp, { label: "State / Region", value: f.state, onChange: set("state") }),
      React.createElement(Inp, { label: "Course", value: f.course, onChange: set("course"), options: ["Quran", "Subject"] }),
      React.createElement(Inp, { label: "Source", value: f.source, onChange: set("source"), options: LLQA_LEAD_SOURCES }),
      f.source === "Referral" ? React.createElement(Inp, { label: "Referred by", value: f.referredBy, onChange: set("referredBy") }) : null,
      React.createElement(Inp, { label: "Wanted day", value: f.wantDay, onChange: set("wantDay"), options: ["", ...LLQABooking.DAYS] }),
      React.createElement(Inp, { label: "Wanted time (their clock)", value: f.wantTime, onChange: set("wantTime"), options: ["", ...LLQABooking.TIMES].map((t) => ({ value: t, label: t ? LLQABooking.timeLabel(t) : "—" })) }),
      React.createElement(Inp, { label: "Next follow-up", type: "date", value: f.next, onChange: set("next") }),
      React.createElement("div", { style: { gridColumn: "1 / -1" } }, React.createElement(Inp, { label: "Notes", value: f.notes, onChange: set("notes") })),
      err ? React.createElement("div", { style: { gridColumn: "1 / -1", color: c.danger, fontSize: 12 } }, err) : null,
    ),
    [
      old && llqaLeadStatus(old) !== "lost"
        ? llqaMini("Mark lost…", () => {
            const r = prompt("Why was it lost? (" + LLQA_LEAD_LOST.join(" / ") + ")", LLQA_LEAD_LOST[0]);
            if (r == null) return;
            llqaLeadLost(old, r.trim() || "Other");
            onClose();
          }, { key: "l", big: true })
        : null,
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      llqaMini("✓ Save lead", save, { key: "ok", big: true, solid: true, tone: "success" }),
    ],
    { onClose, width: 680 },
  );
};
const LLQALeadNoteModal = ({ leadId, onClose }) => {
  const l = llqaLeads().find((x) => x.id === leadId);
  const today = todayPK();
  const [out, setOut] = useState("No answer");
  const [text, setText] = useState("");
  const [next, setNext] = useState(llqaAddDays(today, 1));
  if (!l) return llqaShell("Lead not found", "", null, [llqaMini("Close", onClose, { key: "c", big: true })], { onClose });
  const save = () => {
    const saved = llqaLeadNote(l, text, out === "Not interested" ? "" : next, out);
    if (saved && out === "Not interested") llqaLeadLost(saved, text.trim() || "Not interested");
    onClose();
  };
  return llqaShell(
    "✍ Follow-up — " + (l.parent || l.name),
    (Array.isArray(l.log) && l.log.length ? l.log.length + " earlier note" + (l.log.length === 1 ? "" : "s") + " · last " + llqaAgo(l.log[l.log.length - 1].at) : "First contact") + (l.phone ? " · " + l.phone : ""),
    React.createElement(
      "div",
      null,
      React.createElement("div", { style: { marginBottom: 8 } }, llqaChips(["No answer", "Interested", "Call back later", "Not interested"].map((x) => [x, x]), out, setOut)),
      React.createElement("textarea", { value: text, onChange: (e) => setText(e.target.value), rows: 3, placeholder: "What was said (optional)", style: llqaTextStyle }),
      out !== "Not interested"
        ? React.createElement(
            "div",
            { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 8 } },
            React.createElement("span", { style: { color: c.textSec, fontSize: 11 } }, "Next follow-up:"),
            [1, 2, 7].map((n) => llqaMini("+" + n + " day" + (n === 1 ? "" : "s"), () => setNext(llqaAddDays(today, n)), { key: "d" + n, tone: next === llqaAddDays(today, n) ? "accent" : undefined, solid: next === llqaAddDays(today, n) })),
            llqaInput(next, setNext, { type: "date", width: 150, key: "dt" }),
          )
        : React.createElement("div", { style: { color: c.textSec, fontSize: 11, marginTop: 8 } }, "Saving marks the lead lost."),
      Array.isArray(l.log) && l.log.length
        ? React.createElement("div", { style: { marginTop: 10, maxHeight: 140, overflowY: "auto", fontSize: 11, color: c.textSec } }, l.log.slice().reverse().map((e, i) => React.createElement("div", { key: i }, llqaDateLabel(String(e.at).slice(0, 10)) + " — " + e.text)))
        : null,
    ),
    [llqaMini("Cancel", onClose, { key: "x", big: true }), llqaMini("✓ Save", save, { key: "ok", big: true, solid: true, tone: "success" })],
    { onClose, width: 560 },
  );
};

/* ---------- Sales: revenue & churn ---------- */
const llqaBars = (data, w, h) => {
  // data: [{ label, a, b }] — two bars per month (billed, collected)
  const max = Math.max(1, ...data.flatMap((d) => [d.a || 0, d.b || 0]));
  const bw = Math.max(8, Math.floor(w / data.length / 3));
  return React.createElement(
    "svg",
    { width: "100%", viewBox: "0 0 " + w + " " + (h + 20), style: { maxWidth: w, display: "block" } },
    data.map((d, i) => {
      const x = i * (w / data.length) + 6;
      const ha = Math.round(((d.a || 0) / max) * h);
      const hb = Math.round(((d.b || 0) / max) * h);
      return React.createElement(
        "g",
        { key: i },
        React.createElement("rect", { x, y: h - ha, width: bw, height: ha, rx: 2, fill: "var(--accent)", opacity: 0.55 }),
        React.createElement("rect", { x: x + bw + 2, y: h - hb, width: bw, height: hb, rx: 2, fill: "var(--success)" }),
        React.createElement("text", { x: x + bw, y: h + 14, textAnchor: "middle", fontSize: 10, fill: "var(--textSec)" }, d.label),
      );
    }),
  );
};
const LLQARevenueTab = () => {
  const ctx = LLQAApp.ctx;
  const manage = llqaCanManage();
  const rev = llqaRevenue(6);
  const fx = llqaOpt("fx") || {};
  const [edit, setEdit] = useState(false);
  const [rates, setRates] = useState(() => ({ ...fx }));
  const cur = rev.months[rev.months.length - 1];
  const curs = [...new Set(rev.months.flatMap((m) => [...Object.keys(m.billed), ...Object.keys(m.collected)]).concat(Object.keys(rev.expected)))].filter((k) => k !== "USD").sort();
  const usd = (o) => llqaToUsd(o, fx);
  const one = (o) => (usd(o) != null && Object.keys(o).length > 1 ? "≈ " + usd(o).toLocaleString("en-US") + " USD" : llqaMoney(o));
  const quitReasons = {};
  rev.months.forEach((m) => Object.entries(m.reasons).forEach(([r, n]) => (quitReasons[r] = (quitReasons[r] || 0) + n)));
  // by teacher: active paying students and monthly fees
  const byT = new Map();
  (ctx.students || []).forEach((s) => {
    if (!s || s.status === "quit" || llqaInTrial(s) || !(Number(s.fee_amount) > 0)) return;
    const t = s.teacher && s.teacher !== "Unassigned" ? s.teacher : "Unassigned";
    if (!byT.has(t)) byT.set(t, { n: 0, fees: {} });
    const r = byT.get(t);
    r.n++;
    r.fees[s.currency || "USD"] = Math.round(((r.fees[s.currency || "USD"] || 0) + Number(s.fee_amount)) * 100) / 100;
  });
  const chart = usd ? rev.months.map((m) => ({ label: llqaMonthLabel(m.ym).split(" ")[0].slice(0, 3), a: usd(m.billed), b: usd(m.collected) })) : null;
  const chartOk = chart && chart.every((d) => d.a != null && d.b != null);
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Expected a month", one(rev.expected), rev.paying + " paying students"),
      llqaStat("Collected — " + llqaMonthLabel(cur.ym), one(cur.collected), "billed " + one(cur.billed), c.success),
      llqaStat("Owed now", one(rev.owed), "due and overdue, every month", Object.keys(rev.owed).length ? c.warn : c.text),
      llqaStat("Churn — " + llqaMonthLabel(cur.ym), cur.churn == null ? "—" : cur.churn + "%", cur.quitPaid + " paying student" + (cur.quitPaid === 1 ? "" : "s") + " left of " + cur.startActive, cur.churn ? c.danger : c.text),
      llqaStat("Trials", rev.trials, cur.conv == null ? "none finished this month" : cur.conv + "% enrolled this month"),
    ),
    llqaCard([
      llqaH("📈 Billed and collected, month by month", "Billed = fee bills due that month (the fee cycle). Collected = payments received that month (Fee Cycle and Accounts Receivable). " + (curs.length ? "Other currencies count in USD with your rates." : "")),
      chartOk
        ? React.createElement("div", { key: "ch" }, llqaBars(chart, 560, 120), React.createElement("div", { style: { fontSize: 10, color: c.textSec, marginTop: 2 } }, "■ billed (blue) · ■ collected (green), in USD"))
        : React.createElement("div", { key: "nc", style: { fontSize: 11, color: c.warn } }, "Set a rate to USD for " + curs.filter((k) => !(Number(fx[k]) > 0)).join(", ") + " to see one chart (amounts per currency are below)."),
      React.createElement(
        "div",
        { key: "t", style: { marginTop: 10 } },
        llqaTable(
          ["Month", "Billed", "Collected", "New paying", "Left", "Churn", "Trials enrolled"],
          rev.months
            .slice()
            .reverse()
            .map((m) =>
              React.createElement(
                "tr",
                { key: m.ym },
                llqaTd(llqaMonthLabel(m.ym), "a", { fontWeight: 700 }),
                llqaTd(llqaMoney(m.billed), "b"),
                llqaTd(llqaMoney(m.collected), "c", { color: c.success }),
                llqaTd(String(m.newPaid), "d"),
                llqaTd(String(m.quits), "e", { color: m.quits ? c.danger : c.text }),
                llqaTd(m.churn == null ? "—" : m.churn + "%", "f"),
                llqaTd(m.conv == null ? "—" : m.conv + "% (" + m.trialsWon + " of " + (m.trialsWon + m.trialsLost) + ")", "g"),
              ),
            ),
        ),
      ),
      manage
        ? React.createElement(
            "div",
            { key: "fx", style: { marginTop: 10, fontSize: 11, color: c.textSec } },
            edit
              ? llqaRow([
                  "1 unit = ? USD:",
                  ...["CAD", "GBP", "AUD", "AED", "EUR", "PKR"].map((k) => React.createElement("span", { key: k }, k + " ", llqaInput(rates[k] || "", (v) => setRates({ ...rates, [k]: v }), { key: k, width: 70 }))),
                  llqaMini("✓ Save rates", () => {
                    const clean = {};
                    Object.entries(rates).forEach(([k, v]) => {
                      if (Number(v) > 0) clean[k] = Number(v);
                    });
                    llqaSetOpt({ fx: clean });
                    setEdit(false);
                  }, { key: "s", tone: "success" }),
                ], "r")
              : llqaRow([
                  "Rates to USD: " + (Object.keys(fx).length ? Object.entries(fx).map(([k, v]) => k + " " + v).join(" · ") : "not set"),
                  llqaMini("Edit rates", () => setEdit(true), { key: "e" }),
                ], "r"),
          )
        : null,
    ]),
    React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 } },
      llqaCard([
        llqaH("Why families left (6 months)", ""),
        Object.keys(quitReasons).length
          ? React.createElement("div", { key: "r", style: { fontSize: 12 } }, Object.entries(quitReasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => React.createElement("div", { key: r, style: { display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid " + c.border } }, React.createElement("span", null, r), React.createElement("b", null, n))))
          : React.createElement("div", { key: "n", style: { fontSize: 12, color: c.success } }, "✓ Nobody left."),
      ], { key: "q" }),
      llqaCard([
        llqaH("Paying students by teacher", ""),
        byT.size
          ? llqaTable(["Teacher", "Students", "Fees a month"], [...byT.entries()].sort((a, b) => b[1].n - a[1].n).map(([t, r]) => React.createElement("tr", { key: t }, llqaTd(t, "a"), llqaTd(String(r.n), "b"), llqaTd(llqaMoney(r.fees), "c"))))
          : React.createElement("div", { key: "n", style: { fontSize: 12, color: c.textSec } }, "No paying students yet."),
      ], { key: "t" }),
    ),
  );
};

/* ---------- Sales: win-back & referral rewards ---------- */
const LLQAWinbackTab = () => {
  const ctx = LLQAApp.ctx;
  const today = todayPK();
  const manage = llqaCanManage();
  const [days, setDays] = useState(() => llqaWinbackDays().map(String));
  const [offer, setOffer] = useState(() => String(llqaOpt("winbackOffer") || ""));
  const [amt, setAmt] = useState(() => String(llqaOpt("referralReward")));
  const logx = llqaLogIndex(ctx.messageLog);
  const left = (ctx.students || [])
    .filter((s) => s && s.status === "quit" && s.qDate && (llqaDays(String(s.qDate).slice(0, 10), today) || 0) <= 180)
    .sort((a, b) => String(b.qDate).localeCompare(String(a.qDate)));
  const back = (ctx.students || []).filter((s) => s && s.wonBack && s.status !== "quit");
  const refs = llqaReferralRewards();
  const earned = refs.filter((x) => x.state === "earned");
  const saveSet = () => {
    llqaSetOpt({ winback: days.map((x) => parseInt(x, 10) || 1), winbackOffer: offer, referralReward: Number(amt) || 0 });
    llqaToast({ kind: "info", ttl: 5000, text: "✓ Win-back and referral settings saved." });
  };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Left (6 months)", left.length, left.filter((s) => !s.noWinback).length + " to win back"),
      llqaStat("Came back", back.length, "families won back", back.length ? c.success : c.text),
      llqaStat("Referral rewards to give", earned.length, "referred families now paying", earned.length ? c.warn : c.text),
      llqaStat("Rewards given", (ctx.rewards || []).filter((r) => r && r.status === "applied").length, "off a referrer's fee"),
    ),
    manage
      ? llqaCard([
          llqaH("⚙ Settings", "Win-back messages go out by themselves through Autopilot, " + days.join(", ") + " days after a family leaves (not if marked “don't contact”). A referral reward comes off the referring family's next unpaid bill."),
          llqaRow(
            [
              "Win-back after (days):",
              ...days.map((d, i) => llqaInput(d, (v) => setDays(days.map((x, j) => (j === i ? v : x))), { key: "d" + i, width: 55, type: "number" })),
              "Offer in the 2nd message:",
              llqaInput(offer, setOffer, { key: "o", width: 260, placeholder: "e.g. The first week back is free." }),
              "Referral reward:",
              llqaInput(amt, setAmt, { key: "a", width: 70, type: "number" }),
              "(in the referrer's currency)",
              llqaMini("✓ Save", saveSet, { key: "s", tone: "success", solid: true }),
            ],
            "s",
          ),
        ])
      : null,
    llqaCard([
      llqaH("↩ Families who left", "Win-back messages are suggested in Autopilot when due. “Re-enroll” makes the student active again (billed from today) and opens “Change classes” to book times."),
      left.length === 0
        ? React.createElement("div", { key: "e", style: { color: c.success, fontSize: 12 } }, "✓ Nobody left in the last 6 months.")
        : llqaTable(
            ["Student", "Left", "Why", "Win-back sent", ""],
            left.map((s) => {
              const wb = llqaWinbackDue(s, today);
              const sent = [1, 2, 3].filter((n) => logx.keys.has("winback:" + s.id + ":" + n));
              const digits = llqaPhone(s.phone, s.country);
              return React.createElement(
                "tr",
                { key: s.id },
                llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, s.name), llqaSmall(s.parent || "", null, "p")], "a"),
                llqaTd(llqaDateLabel(String(s.qDate).slice(0, 10)) + " · " + llqaDays(String(s.qDate).slice(0, 10), today) + "d ago", "b", { whiteSpace: "nowrap" }),
                llqaTd(s.qReason || "—", "c"),
                llqaTd(s.noWinback ? llqaPill("don't contact", c.textSec) : [sent.length ? sent.map((n) => "#" + n).join(" ") + " sent" : "none yet", wb && !sent.includes(wb.n) ? llqaSmall("#" + wb.n + " due now", c.warn, "d") : null], "d"),
                llqaTd(
                  manage
                    ? React.createElement(
                        "div",
                        { style: { display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" } },
                        llqaMini("💬", () => llqaOpen("message", { studentId: s.id, student: s, template: wb ? wb.tpl : "winBack1", extra: { offer: llqaWinbackOffer() }, msgKey: wb ? wb.key : undefined }), { key: "m", disabled: !digits || s.noWinback, title: "Win-back message" }),
                        llqaMini("↩ Re-enroll", () => {
                          if (!confirm("Make " + s.name + " active again? Fees start from today; then choose class times.")) return;
                          llqaWinbackReturn(s);
                          setTimeout(() => llqaOpen("reschedule", { studentId: s.id }), 300);
                        }, { key: "r", tone: "success" }),
                        llqaMini(s.noWinback ? "Contact again" : "Don't contact", () => llqaNoWinback(s, !s.noWinback), { key: "x" }),
                      )
                    : null,
                  "e",
                  { whiteSpace: "nowrap" },
                ),
              );
            }),
          ),
    ]),
    llqaCard([
      llqaH("🎁 Referral rewards", "A reward is earned when a referred family becomes a paying student (enrolled and paid). The referrer is the student linked on the referral, or a student / parent whose name matches “Referred by” — confirm it before giving the reward."),
      refs.length === 0
        ? React.createElement("div", { key: "e", style: { color: c.textSec, fontSize: 12 } }, "No referrals have become students yet (References → enroll a referral).")
        : llqaTable(
            ["Referred", "Referred by", "Reward", ""],
            refs.map((x) => {
              const opts = (ctx.students || []).filter((s) => s && s.status !== "quit" && String(s.id) !== String(x.r.studentId)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
              return React.createElement(
                "tr",
                { key: x.r.id },
                llqaTd([React.createElement("div", { key: "n", style: { fontWeight: 700 } }, x.referred ? x.referred.name : x.r.studentName || "—"), llqaSmall(x.paying ? "paying" : x.referred && llqaInTrial(x.referred) ? "on trial" : "not paying yet", x.paying ? c.success : null, "p")], "a"),
                llqaTd([
                  React.createElement("div", { key: "t" }, x.r.referredBy || "—"),
                  manage && x.state !== "applied"
                    ? llqaSel(x.r.referrerId != null ? String(x.r.referrerId) : x.referrer ? String(x.referrer.id) : "", (v) => llqaLinkReferrer(x.r, v ? parseInt(v, 10) || v : ""), [["", "— link the referring student —"], ...opts.map((s) => [String(s.id), s.name + (s.parent ? " (" + s.parent + ")" : "")])], { key: "ln", style: { marginTop: 4, maxWidth: 240 } })
                    : x.referrer
                      ? llqaSmall(x.referrer.name, null, "rn")
                      : null,
                  !x.linked && x.referrer && x.state !== "applied" ? llqaSmall("matched by name — check it", c.warn, "g") : null,
                ], "b"),
                llqaTd(x.rec ? [llqaPill("✓ " + x.rec.amount + " " + x.rec.currency + " off " + llqaMonthLabel(x.rec.month), c.success, null, "a")] : x.state === "earned" ? llqaPill("earned", c.warn) : x.state === "noReferrer" ? llqaPill("link the referrer", c.warn) : llqaPill("when they pay", c.textSec), "c"),
                llqaTd(
                  manage && x.state === "earned"
                    ? llqaMini("🎁 Give " + (Number(llqaOpt("referralReward")) || 0) + " " + ((x.referrer && x.referrer.currency) || "USD") + " off", () => {
                        const rec = llqaApplyReward(x);
                        if (rec) llqaToast({ kind: "info", ttl: 10000, text: "🎁 " + rec.amount + " " + rec.currency + " off " + llqaMonthLabel(rec.month) + " for " + rec.referrer + ". Autopilot will suggest the thank-you message." });
                      }, { key: "g", tone: "success" })
                    : null,
                  "d",
                  { whiteSpace: "nowrap" },
                ),
              );
            }),
          ),
    ]),
  );
};

/* ---------- Sales tab dispatch, pop-ups, dashboard (v67) ---------- */
Object.assign(LLQA_SALES_TABS, { leads: 1, revenue: 1, winback: 1 });
const LLQASalesTab3 = (props) =>
  props.tab === "leads" ? React.createElement(LLQALeadsTab, props) : props.tab === "revenue" ? React.createElement(LLQARevenueTab, props) : props.tab === "winback" ? React.createElement(LLQAWinbackTab, props) : null;
const LLQA_MODALS3 = { makeup: LLQAMakeupModal, lead: LLQALeadModal, leadNote: LLQALeadNoteModal };
// More cards on the Dashboard: make-ups owed, schedules to send, leads due.
const LLQADashCards3 = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage()) return null;
  // v67.3: the 24/7 runner's status
  const age = llqaRunnerAge();
  const rInfo = ctx.runnerInfo || {};
  const runnerLine =
    age == null
      ? null
      : React.createElement(
          "div",
          { key: "rn", style: { flexBasis: "100%", fontSize: 11, color: llqaRunnerAlive() ? c.success : c.danger } },
          llqaRunnerAlive()
            ? llqaLabel("🤖 24/7 runner online — last check " + llqaAgo(rInfo.at) + (rInfo.saveError ? " · ⚠ save problem: " + rInfo.saveError : "") + " · your tab leaves the automatic work to it")
            : llqaLabel("⚠ 24/7 runner offline since " + llqaAgo(rInfo.at) + " — this tab does the automatic work while it is down"),
        );
  // v68: the cards themselves go into the main card grid (llqaDashCards3Items); this keeps the runner line
  return runnerLine ? React.createElement("div", { style: { marginBottom: 14 } }, runnerLine) : null;
};
// v68: Leads, Make-ups and Teachers' day — same card style, same grid as the other Dashboard cards
const llqaDashCards3Items = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage()) return [];
  const today = todayPK();
  const owed = llqaMakeupOwed(today).length;
  const logx = llqaLogIndex(ctx.messageLog);
  const tday = llqaTeacherNext().list.filter((x) => !logx.keys.has(llqaDayKey(x.t, x.date))).length;
  const ls = llqaLeadStats(today);
  return [
    llqaCanOpen("sales") && llqaDashCard("leads", "🎯", "Leads", ls.due, ls.due ? "follow-ups due today" : ls.open + " open leads", ls.due ? c.warn : null, () => llqaGo("sales", "leads")),
    llqaCanOpen("timetable") && llqaDashCard("makeups", "🧩", "Make-ups", owed, owed ? "missed classes to make up" : "nothing owed", owed ? c.warn : null, () => llqaGo("timetable", "makeup")),
    llqaCanOpen("timetable") && llqaDashCard("tday", "🧑‍🏫", "Teachers' day", tday, tday ? "schedules not sent — next 24 hours" : "all sent (or no classes)", tday ? c.accent : null, () => llqaGo("timetable", "teacherday")),
  ].filter(Boolean);
};

/* ---------- v68: Dashboard — every number comes from the CRM's own records ----------
   Replaces the old sample figures ("Rs 0", "0/0", a fixed activity list) and the
   charts that were never connected. Each part shows only for people who can open
   the page it comes from. */
// v69: "Good morning" / "Good afternoon" / "Good evening" by the computer's own clock
const llqaGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const llqaFirstName = () => {
  const u = (LLQAApp.ctx && LLQAApp.ctx.user) || {};
  return String(u.name || "").trim().split(/\s+/)[0] || "there";
};
const llqaShortMonth = (ym) => {
  const [y, m] = String(ym).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 15)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
};
const llqaNum = (v) => (Number(v) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const llqaDayLabel = (d, today) => {
  if (!d) return "";
  if (d === today) return "today";
  if (d === llqaAddDays(today, -1)) return "yesterday";
  return llqaDateLabel(d);
};
// when something happened: "12 min ago" for times, "today" / "3 Nov" for dates
const llqaWhen = (ev, today) => (ev.iso ? llqaAgo(ev.iso) : llqaDayLabel(ev.date, today));

// a figure with its label, an icon in the figure's colour and one line of detail
const llqaStatTile = (t) =>
  React.createElement(
    "div",
    {
      key: t.key,
      role: t.go ? "button" : undefined,
      tabIndex: t.go ? 0 : undefined,
      className: t.go ? "hover-lift" : undefined,
      title: t.title || undefined,
      onClick: t.go,
      onKeyDown: (e) => { if (t.go && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); t.go(); } },
      style: { cursor: t.go ? "pointer" : "default", position: "relative", overflow: "hidden", minWidth: 0, background: c.bgCard, backdropFilter: "blur(16px)", boxShadow: c.shadow3d, border: "1px solid " + c.border, borderRadius: 12, padding: "14px 16px 13px" },
    },
    React.createElement("div", { style: { position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "linear-gradient(90deg, " + t.tone + ", " + llqaAlpha(t.tone, "00") + " 85%)" } }),
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 } },
      React.createElement(
        "div",
        { style: { width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: llqaAlpha(t.tone, "22"), boxShadow: "inset 0 0 0 1px " + llqaAlpha(t.tone, "38") } },
        React.createElement(t.icon, { size: 16, color: t.tone }),
      ),
      React.createElement("div", { style: { color: c.textSec, fontSize: 11, fontWeight: 600, lineHeight: 1.3 } }, t.label),
    ),
    React.createElement("div", { style: { color: c.text, fontSize: t.small ? 18 : 24, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, t.value),
    React.createElement("div", { style: { color: c.textMuted, fontSize: 10.5, marginTop: 4, lineHeight: 1.4 } }, t.sub),
  );

const llqaPanel = (key, title, sub, body, right) =>
  React.createElement(
    "div",
    { key, style: { minWidth: 0, background: c.bgCard, backdropFilter: "blur(16px)", boxShadow: c.shadow3d, border: "1px solid " + c.border, borderRadius: 14, padding: "16px 18px" } },
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 } },
      React.createElement(
        "div",
        { style: { minWidth: 0 } },
        React.createElement("div", { style: { color: c.text, fontSize: 13.5, fontWeight: 700 } }, title),
        sub ? React.createElement("div", { style: { color: c.textMuted, fontSize: 10.5, marginTop: 3, lineHeight: 1.4 } }, sub) : null,
      ),
      right || null,
    ),
    body,
  );

const llqaEmpty = (icon, text) =>
  React.createElement(
    "div",
    { style: { padding: "22px 14px", textAlign: "center", color: c.textMuted, fontSize: 11.5, lineHeight: 1.5, border: "1px dashed " + c.border, borderRadius: 10, background: c.bgDeep } },
    React.createElement(
      "div",
      { style: { width: 38, height: 38, borderRadius: 19, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", background: c.bgHover, boxShadow: "inset 0 0 0 1px " + c.border } },
      React.createElement(llqaIcon(LLQA_EMOJI_ICON[String(icon).replace(/\uFE0F/g, "")] || "layout-grid"), { size: 18, color: c.textSec }), // v69: line icon
    ),
    text,
  );

const llqaLegend = (items) =>
  React.createElement(
    "div",
    { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" } },
    items.map(([label, col]) =>
      React.createElement(
        "span",
        { key: label, style: { display: "inline-flex", alignItems: "center", gap: 6, color: c.textSec, fontSize: 10.5, fontWeight: 600 } },
        React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: col, flexShrink: 0 } }),
        label,
      ),
    ),
  );

// columns over the months: one colour, the newest month in full, value on its cap, rest in the tooltip
const llqaColumns = (o) => {
  const max = Math.max(1, ...o.data.map((d) => d.value || 0));
  const H = o.height || 110;
  const n = o.data.length;
  return React.createElement(
    "div",
    { role: "img", "aria-label": o.aria || "" },
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "flex-end", gap: 6, height: H + 20, borderBottom: "1px solid " + c.border } },
      o.data.map((d, i) => {
        const last = i === n - 1;
        const h = d.value ? Math.max(3, Math.round((d.value / max) * H)) : 0;
        return React.createElement(
          "div",
          { key: d.key, title: d.title, style: { flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" } },
          (last || d.value === max) && d.value ? React.createElement("div", { style: { color: c.text, fontSize: 10.5, fontWeight: 700, marginBottom: 4, whiteSpace: "nowrap" } }, o.fmt ? o.fmt(d.value) : d.value) : null,
          React.createElement("div", { style: { width: "70%", maxWidth: 24, height: h, borderRadius: "4px 4px 0 0", background: last ? o.tone : llqaAlpha(o.tone, "73") } }),
        );
      }),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 6, paddingTop: 6 } },
      o.data.map((d, i) =>
        React.createElement("div", { key: d.key, style: { flex: 1, minWidth: 0, textAlign: "center", fontSize: 10, color: i === n - 1 ? c.textSec : c.textMuted, fontWeight: i === n - 1 ? 700 : 500 } }, d.label),
      ),
    ),
  );
};

// joined (up) and left (down) per month around one line
const llqaUpDown = (rows, upCol, downCol) => {
  const max = Math.max(1, ...rows.flatMap((r) => [r.up, r.down]));
  const H = 56;
  const n = rows.length;
  const half = (r, i, up) => {
    const v = up ? r.up : r.down;
    const h = v ? Math.max(3, Math.round((v / max) * H)) : 0;
    const last = i === n - 1;
    return React.createElement(
      "div",
      { key: r.key, title: r.title, style: { flex: 1, minWidth: 0, height: H + 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: up ? "flex-end" : "flex-start" } },
      up && (last || v === max) && v ? React.createElement("div", { style: { color: c.text, fontSize: 10.5, fontWeight: 700, marginBottom: 3 } }, "+" + v) : null,
      React.createElement("div", { style: { width: "70%", maxWidth: 24, height: h, borderRadius: up ? "4px 4px 0 0" : "0 0 4px 4px", background: up ? (last ? upCol : llqaAlpha(upCol, "73")) : last ? downCol : llqaAlpha(downCol, "73") } }),
      !up && (last || v === max) && v ? React.createElement("div", { style: { color: c.text, fontSize: 10.5, fontWeight: 700, marginTop: 3 } }, "−" + v) : null,
    );
  };
  return React.createElement(
    "div",
    { role: "img", "aria-label": rows.map((r) => r.title).join("; ") },
    React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "flex-end" } }, rows.map((r, i) => half(r, i, true))),
    React.createElement("div", { style: { height: 1, background: c.border } }),
    React.createElement("div", { style: { display: "flex", gap: 6 } }, rows.map((r, i) => half(r, i, false))),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 6, paddingTop: 2 } },
      rows.map((r, i) => React.createElement("div", { key: r.key, style: { flex: 1, textAlign: "center", fontSize: 10, color: i === n - 1 ? c.textSec : c.textMuted, fontWeight: i === n - 1 ? 700 : 500 } }, r.label)),
    ),
  );
};

// parts of one whole, largest first: one colour, a thin bar each
const llqaRanked = (rows, tone, total) =>
  React.createElement(
    "div",
    null,
    rows.map((r) =>
      React.createElement(
        "div",
        { key: r.label, title: r.label + ": " + r.value + (total ? " (" + Math.round((r.value / total) * 100) + "%)" : ""), style: { marginBottom: 11 } },
        React.createElement(
          "div",
          { style: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, marginBottom: 5 } },
          React.createElement("span", { style: { color: c.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, r.label),
          React.createElement(
            "span",
            { style: { color: c.textSec, fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } },
            r.value,
            total ? React.createElement("span", { style: { color: c.textMuted, fontWeight: 500 } }, "  ·  " + Math.round((r.value / total) * 100) + "%") : null,
          ),
        ),
        React.createElement(
          "div",
          { style: { height: 8, borderRadius: 4, background: llqaAlpha(tone, "1f"), overflow: "hidden" } },
          React.createElement("div", { style: { width: Math.max(2, (r.value / Math.max(1, rows[0].value)) * 100) + "%", height: "100%", borderRadius: 4, background: tone } }),
        ),
      ),
    ),
  );

// a list row: icon in its colour, what happened, detail, when / link
const llqaFeedRow = (key, icon, tone, title, detail, right, go, last) =>
  React.createElement(
    "div",
    {
      key,
      onClick: go,
      role: go ? "button" : undefined,
      tabIndex: go ? 0 : undefined,
      onKeyDown: (e) => { if (go && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(); } },
      style: { display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: last ? "none" : "1px solid " + c.border, cursor: go ? "pointer" : "default" },
    },
    React.createElement(
      "div",
      { style: { width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: llqaAlpha(tone, "22"), boxShadow: "inset 0 0 0 1px " + llqaAlpha(tone, "33") } },
      React.createElement(llqaIcon(LLQA_EMOJI_ICON[String(icon).replace(/\uFE0F/g, "")] || "bell"), { size: 15, color: tone }), // v69: line icon
    ),
    React.createElement(
      "div",
      { style: { flex: 1, minWidth: 0 } },
      React.createElement("div", { style: { color: c.text, fontSize: 11.5, fontWeight: 600, lineHeight: 1.35 } }, title),
      detail ? React.createElement("div", { style: { color: c.textSec, fontSize: 10.5, marginTop: 2, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, detail) : null,
    ),
    right ? React.createElement("div", { style: { color: go ? c.accent : c.textMuted, fontSize: 10.5, fontWeight: go ? 700 : 500, whiteSpace: "nowrap", flexShrink: 0, paddingTop: 1 } }, right) : null,
  );

const LLQADashBody = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user) return null;
  const go = (page, tab) => () => llqaGo(page, tab);
  const can = llqaCanOpen;
  const today = todayPK();
  const students = (ctx.students || []).filter(Boolean);
  const teachers = (ctx.teachers || []).filter(Boolean);
  const activeT = teachers.filter((t) => t.status === "active" || t.status === "new");
  const activeS = students.filter((s) => s.status === "active");
  const live = students.filter((s) => s.status !== "quit");
  const onLeave = students.filter((s) => s.status === "leave").length;
  const money = can("ar") || can("sales") || can("finance");

  /* ---- figures ---- */
  const tiles = [];
  if (can("students")) {
    const byC = {};
    activeS.forEach((s) => { const k = s.country || "Other"; byC[k] = (byC[k] || 0) + 1; });
    const top = Object.entries(byC).sort((a, b) => b[1] - a[1]);
    tiles.push({
      key: "stu", icon: BookOpen, tone: c.success, label: "Active students", value: activeS.length,
      sub: activeS.length ? top.slice(0, 3).map(([k, v]) => k + " " + v).join(" · ") + (top.length > 3 ? " · +" + (top.length - 3) + " more" : "") + (onLeave ? " · " + onLeave + " on leave" : "") : "no active students yet",
      go: go("students"),
    });
  }
  if (can("teachers")) {
    const m = activeT.filter((t) => t.gender === "Male").length;
    const ib = activeT.filter((t) => t.location === "IBA").length;
    tiles.push({ key: "tch", icon: Users, tone: c.accent, label: "Teachers", value: activeT.length, sub: activeT.length ? m + " male · " + (activeT.length - m) + " female · " + ib + " at IBA" : "no active teachers yet", go: go("teachers") });
  }
  if (can("timetable")) {
    let free = 0, total = 0;
    activeT.forEach((t) => { const r = computeFree(t); free += r.free; total += r.total; });
    tiles.push({ key: "free", icon: Clock, tone: c.warn, label: "Free slots", value: free.toLocaleString("en-US"), sub: total ? Math.round(((total - free) / total) * 100) + "% of " + total.toLocaleString("en-US") + " weekly slots booked" : "no timetable yet", go: go("timetable") });
  }
  let rev = null;
  if (money) {
    rev = llqaRevenue(6);
    const now = rev.months[rev.months.length - 1];
    const parts = Object.entries(now.collected).filter(([, v]) => v).sort((a, b) => b[1] - a[1]);
    const nPays = (ctx.arPayments || []).filter((p) => p && p.type !== "reward" && String(p.paidDate || "").slice(0, 7) === rev.cur).length;
    tiles.push({
      key: "fees", icon: DollarSign, tone: c.success, small: parts.length > 0,
      label: "Fees received · " + llqaShortMonth(rev.cur),
      value: parts.length ? llqaNum(parts[0][1]) + " " + parts[0][0] : "—",
      sub: parts.length ? (parts.length > 1 ? "+ " + parts.slice(1).map(([k, v]) => llqaNum(v) + " " + k).join(" · ") + " · " : "") + nPays + " payment" + (nPays === 1 ? "" : "s") : "nothing recorded this month yet",
      go: go(can("ar") ? "ar" : "sales", can("ar") ? undefined : "fees"),
    });
  }
  if (can("payroll")) {
    const sal = activeT.reduce((a, t) => a + (Number(t.salary) || 0), 0);
    const withSal = activeT.filter((t) => Number(t.salary) > 0).length;
    tiles.push({ key: "pay", icon: CreditCard, tone: c.cyan, label: "Monthly salaries", small: sal >= 1e6, value: sal ? "Rs " + sal.toLocaleString("en-US") : "—", sub: sal ? withSal + " teacher" + (withSal === 1 ? "" : "s") + " · before bonuses & fines" : "no salaries entered yet", go: go("payroll") });
  }
  if (can("attendance")) {
    const hist = ctx.attendanceHistory || {};
    let present = 0, late = 0, away = 0, marked = 0;
    activeT.forEach((t) => {
      const r = (Array.isArray(hist[t.id]) ? hist[t.id] : []).find((h) => h && h.date === today);
      if (!r) return;
      marked++;
      if (r.status === "Present" || r.status === "Half Day") present++;
      else if (r.status === "Late") late++;
      else if (r.status === "On Leave" || r.status === "Absent") away++;
    });
    tiles.push({
      key: "att", icon: Check, tone: c.purple, label: "Teachers in today", value: present + late + " / " + activeT.length,
      sub: activeT.length ? (activeT.length - marked) + " not marked" + (late ? " · " + late + " late" : "") + (away ? " · " + away + " away" : "") : "no teachers yet",
      go: go("attendance"),
    });
  }

  /* ---- fees over 6 months: one chart per currency (amounts in different currencies never share an axis) ---- */
  let feesPanel = null;
  if (money && rev) {
    const curs = {};
    rev.months.forEach((m) => Object.entries(m.collected).forEach(([k, v]) => { if (v) curs[k] = (curs[k] || 0) + v; }));
    const order = Object.entries(curs).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const shown = order.slice(0, 3);
    const rest = order.slice(3);
    const body = !order.length
      ? llqaEmpty("💳", "No fee payments recorded in the last 6 months. Payments you record in Accounts Receivable or the Fee Cycle show here, month by month.")
      : React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(" + shown.length + ", minmax(0, 1fr))", gap: 18 } },
            shown.map((k) =>
              React.createElement(
                "div",
                { key: k, style: { minWidth: 0 } },
                React.createElement(
                  "div",
                  { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, gap: 6 } },
                  React.createElement("span", { style: { color: c.text, fontSize: 12, fontWeight: 800 } }, k),
                  React.createElement("span", { style: { color: c.textMuted, fontSize: 10 } }, llqaNum(curs[k]) + " in 6 months"),
                ),
                llqaColumns({
                  height: 92,
                  tone: c.accent,
                  fmt: (v) => llqaNum(v),
                  aria: "Fees received in " + k + " per month",
                  data: rev.months.map((m) => ({ key: m.ym, label: llqaShortMonth(m.ym), value: m.collected[k] || 0, title: llqaShortMonth(m.ym) + " " + m.ym.slice(0, 4) + ": " + llqaNum(m.collected[k] || 0) + " " + k })),
                }),
              ),
            ),
          ),
          rest.length ? React.createElement("div", { style: { color: c.textMuted, fontSize: 10.5, marginTop: 10 } }, "Also received: " + rest.map((k) => llqaNum(curs[k]) + " " + k).join(" · ")) : null,
        );
    const exp = Object.keys(rev.expected || {}).length ? llqaMoney(rev.expected) : "none yet";
    feesPanel = llqaPanel("fees", "Fees received", "Last 6 months, by the month paid · monthly fees of paying students: " + exp, body);
  }

  /* ---- students by course (active) ---- */
  let coursePanel = null;
  if (can("students")) {
    const by = {};
    activeS.forEach((s) => {
      const subj = Array.isArray(s.specificSubject) ? s.specificSubject.filter(Boolean).join(", ") : String(s.specificSubject || "").trim();
      const k = (s.course || "Other") + (s.course === "Subject" && subj ? " · " + subj : "");
      by[k] = (by[k] || 0) + 1;
    });
    const rows = Object.entries(by).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const top = rows.slice(0, 6);
    if (rows.length > 6) top.push({ label: "Other (" + (rows.length - 6) + ")", value: rows.slice(6).reduce((a, r) => a + r.value, 0) });
    coursePanel = llqaPanel("course", "Students by course", activeS.length + " active students", rows.length ? llqaRanked(top, c.success, activeS.length) : llqaEmpty("📚", "No active students yet."));
  }

  /* ---- joined and left, 6 months ---- */
  let flowPanel = null;
  if (can("students") || can("sales")) {
    const r6 = rev || llqaRevenue(6);
    const rows = r6.months.map((m) => ({ key: m.ym, label: llqaShortMonth(m.ym), up: m.newPaid, down: m.quits, title: llqaShortMonth(m.ym) + ": " + m.newPaid + " joined (paying) · " + m.quits + " left" }));
    const joined = rows.reduce((a, r) => a + r.up, 0), left = rows.reduce((a, r) => a + r.down, 0);
    flowPanel = llqaPanel(
      "flow",
      "Students joined and left",
      "Last 6 months · joined = started paying · " + (joined - left >= 0 ? "+" : "−") + Math.abs(joined - left) + " overall",
      joined + left ? llqaUpDown(rows, c.accent, c.danger) : llqaEmpty("📈", "No students joined or left in the last 6 months."),
      llqaLegend([["Joined", c.accent], ["Left", c.danger]]),
    );
  }

  /* ---- the teaching team ---- */
  let teamPanel = null;
  if (can("teachers")) {
    const parts = [
      ["Male · IBA", activeT.filter((t) => t.gender === "Male" && t.location === "IBA").length, c.accentFill],
      ["Male · WFH", activeT.filter((t) => t.gender === "Male" && t.location === "WFH").length, llqaAlpha(c.accentFill, "8c")],
      ["Female · IBA", activeT.filter((t) => t.gender === "Female" && t.location === "IBA").length, c.purpleFill],
      ["Female · WFH", activeT.filter((t) => t.gender === "Female" && t.location === "WFH").length, llqaAlpha(c.purpleFill, "8c")],
    ];
    const other = activeT.length - parts.reduce((a, p) => a + p[1], 0);
    if (other > 0) parts.push(["Other", other, c.textMuted]);
    const n = activeT.length;
    teamPanel = llqaPanel(
      "team",
      "Teaching team",
      n + " active teacher" + (n === 1 ? "" : "s"),
      n
        ? React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { role: "img", "aria-label": parts.map((p) => p[0] + " " + p[1]).join(", "), style: { display: "flex", gap: 2, height: 12, marginBottom: 14 } },
              parts.filter((p) => p[1] > 0).map((p) => React.createElement("div", { key: p[0], title: p[0] + ": " + p[1], style: { flex: p[1], background: p[2], borderRadius: 6 } })),
            ),
            parts.map((p, i) =>
              React.createElement(
                "div",
                { key: p[0], style: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < parts.length - 1 ? "1px solid " + c.border : "none" } },
                React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: p[2], flexShrink: 0 } }),
                React.createElement("span", { style: { flex: 1, color: c.text, fontSize: 11.5, fontWeight: 600 } }, p[0]),
                React.createElement("span", { style: { color: c.textSec, fontSize: 11.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, p[1]),
                React.createElement("span", { style: { color: c.textMuted, fontSize: 10.5, width: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" } }, Math.round((p[1] / n) * 100) + "%"),
              ),
            ),
          )
        : llqaEmpty("🧑‍🏫", "No active teachers yet."),
    );
  }

  /* ---- needs attention: the actual families, teachers and requests ---- */
  const todo = [];
  if (can("sales")) {
    live.forEach((s) => {
      const cy = llqaFeeCycle(s, ctx.arPayments, today);
      if (cy && cy.status === "overdue") {
        const amt = Math.round(cy.owed.reduce((a, m) => a + m.left, 0) * 100) / 100;
        todo.push({ k: "fee" + s.id, rank: 0, icon: "💰", tone: c.danger, title: (s.name || "Student") + " — fee overdue", detail: llqaNum(amt) + " " + cy.cur + " · " + cy.owed.length + " month" + (cy.owed.length === 1 ? "" : "s") + (s.parent ? " · " + s.parent : ""), go: go("sales", "fees") });
      }
    });
  }
  if (can("teachers"))
    (ctx.leaves || []).filter((l) => l && l.status === "pending").forEach((l) =>
      todo.push({ k: "lv" + l.id, rank: 1, icon: "🏖", tone: c.warn, title: (l.teacherName || "A teacher") + " asked for " + (l.type || "leave"), detail: (l.from === l.to || !l.to ? llqaDateLabel(l.from) : llqaDateLabel(l.from) + " – " + llqaDateLabel(l.to)) + (l.reason ? " · " + l.reason : ""), go: go("teachers", "leave") }),
    );
  if (can("sales")) {
    llqaPendingRequests(ctx.parentRequests).forEach((r) =>
      todo.push({ k: "rq" + r.id, rank: 2, icon: "📨", tone: c.warn, title: (r.parent || "A parent") + " — " + (r.type === "leave" ? "leave request" : r.type === "time" ? "class time change" : "request"), detail: (r.student || "") + (r.text ? " · " + r.text : ""), go: go("sales", "requests") }),
    );
    live.forEach((s) => {
      const i = llqaTrialInfo(s, { today, arPayments: ctx.arPayments });
      if (i.active && i.stage === "complete") todo.push({ k: "tr" + s.id, rank: 3, icon: "🧪", tone: c.accent, title: (s.name || "Student") + " finished the trial", detail: i.done + "/" + i.target + " classes · send the fee message", go: go("sales", "pipeline") });
    });
    (ctx.leads || []).filter((l) => l && (l.status === "new" || l.status === "contacted") && l.next && l.next <= today).forEach((l) =>
      todo.push({ k: "ld" + l.id, rank: 4, icon: "🎯", tone: c.accent, title: (l.name || l.parent || "Lead") + " — follow-up due", detail: (l.source ? l.source + " · " : "") + (l.course || "") + (l.next < today ? " · since " + llqaDateLabel(l.next) : ""), go: go("sales", "leads") }),
    );
  }
  todo.sort((a, b) => a.rank - b.rank);
  const todoShown = todo.slice(0, 6);
  const todoPanel = llqaPanel(
    "todo",
    "Needs attention",
    todo.length ? todo.length + " item" + (todo.length === 1 ? "" : "s") + " · most urgent first" : "nothing waiting",
    todo.length
      ? React.createElement(
          "div",
          null,
          todoShown.map((t, i) => llqaFeedRow(t.k, t.icon, t.tone, t.title, t.detail, "Open →", t.go, i === todoShown.length - 1)),
          todo.length > todoShown.length ? React.createElement("div", { style: { color: c.textMuted, fontSize: 10.5, paddingTop: 8 } }, "+ " + (todo.length - todoShown.length) + " more in the cards above") : null,
        )
      : llqaEmpty("✅", "Nothing needs you right now."),
  );

  /* ---- recent activity: what really happened, newest first ---- */
  const ev = [];
  if (money)
    (ctx.arPayments || []).forEach((p) => {
      if (!p || p.type === "reward" || !p.paidDate) return;
      ev.push({ k: "p" + p.id, date: String(p.paidDate).slice(0, 10), iso: p.at || p.createdAt || null, icon: "💰", tone: c.success, title: "Payment received", detail: (p.studentName || p.parent || "") + " · " + llqaNum(p.amount) + " " + (p.currency || "USD") + (p.gateway ? " · " + p.gateway : "") });
    });
  if (can("sales"))
    (ctx.messageLog || []).forEach((m) => {
      if (!m || !m.at) return;
      ev.push({ k: "m" + m.id, date: String(m.at).slice(0, 10), iso: m.at, icon: m.channel === "email" ? "✉️" : "💬", tone: c.cyan, title: "Message sent — " + llqaTplName(m.template || "custom"), detail: (m.name || "") + (m.by ? " · by " + m.by : "") });
    });
  if (can("students"))
    students.forEach((s) => {
      const d = String(s.addedAt || "").slice(0, 10);
      if (!d) return;
      ev.push({ k: "s" + s.id, date: d, iso: String(s.addedAt).length > 10 ? s.addedAt : null, icon: "🎓", tone: c.purple, title: "New student added", detail: (s.name || "") + " · " + (s.course || "") + (llqaInTrial(s) ? " · trial" : "") });
    });
  if (can("teachers"))
    (ctx.leaves || []).forEach((l) => {
      const at = l && (l.createdAt || (Number(l.id) > 1e12 ? new Date(Number(l.id)).toISOString() : null));
      if (!at) return;
      ev.push({ k: "l" + l.id, date: String(at).slice(0, 10), iso: at, icon: "🏖", tone: c.warn, title: "Leave request — " + (l.teacherName || ""), detail: (l.type || "Leave") + " · " + llqaDateLabel(l.from) + (l.to && l.to !== l.from ? " – " + llqaDateLabel(l.to) : "") + " · " + (l.status || "") });
    });
  if (can("sales")) {
    (ctx.parentRequests || []).forEach((r) => {
      if (!r || !r.createdAt || r.type === "proposal") return;
      ev.push({ k: "r" + r.id, date: String(r.createdAt).slice(0, 10), iso: r.createdAt, icon: "📨", tone: c.warn, title: "Parent request — " + (r.parent || ""), detail: (r.student || "") + " · " + (r.type || "") + " · " + (r.status || "") });
    });
    (ctx.leads || []).forEach((l) => {
      if (!l || !l.createdAt) return;
      ev.push({ k: "d" + l.id, date: String(l.createdAt).slice(0, 10), iso: l.createdAt, icon: "🎯", tone: c.accent, title: "New lead — " + (l.name || l.parent || ""), detail: (l.source || "") + (l.course ? " · " + l.course : "") + (l.country ? " · " + l.country : "") });
    });
  }
  const stamp = (e) => (e.iso ? Date.parse(e.iso) : Date.parse(e.date + "T23:59:59Z")) || 0;
  ev.sort((a, b) => stamp(b) - stamp(a));
  const evShown = ev.slice(0, 7);
  const actPanel = llqaPanel(
    "act",
    "Recent activity",
    ev.length ? "Payments, messages, new students, leave and requests" : "",
    evShown.length
      ? React.createElement("div", null, evShown.map((e, i) => llqaFeedRow(e.k, e.icon, e.tone, e.title, e.detail, llqaWhen(e, today), null, i === evShown.length - 1)))
      : llqaEmpty("🕊", "No activity recorded yet."),
  );

  const grid = (cols, kids, key) => {
    const list = kids.filter(Boolean);
    if (!list.length) return null;
    return React.createElement("div", { key, className: "llqa-dash-grid", style: { display: "grid", gridTemplateColumns: list.length === 1 ? "1fr" : cols, gap: 14, marginBottom: 14 } }, list);
  };
  return React.createElement(
    "div",
    null,
    tiles.length
      ? React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 16 } }, tiles.map(llqaStatTile))
      : null,
    grid("minmax(0, 2fr) minmax(0, 1fr)", [feesPanel, coursePanel], "g1"),
    grid("minmax(0, 1.4fr) minmax(0, 1fr)", [flowPanel, teamPanel], "g2"),
    grid("minmax(0, 1fr) minmax(0, 1fr)", [todoPanel, actPanel], "g3"),
  );
};

// the most common countries in a list of students: "USA, UK, Canada +2"
const llqaTopCountries = (list, n) => {
  const k = n || 3;
  const by = {};
  (list || []).forEach((s) => { if (s && s.country) by[s.country] = (by[s.country] || 0) + 1; });
  const top = Object.entries(by).sort((a, b) => b[1] - a[1]);
  return top.slice(0, k).map(([name]) => name).join(", ") + (top.length > k ? " +" + (top.length - k) : "") || "—";
};
