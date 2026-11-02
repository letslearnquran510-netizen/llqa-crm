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
  LLQAUI.toasts = [...LLQAUI.toasts.filter((x) => !(t.key && x.key === t.key)), { ...t, id }].slice(-5);
  llqaUIChanged();
  // short confirmations close by themselves; questions wait for the admin
  if (t.ttl) setTimeout(() => llqaDismiss(id), t.ttl);
  return id;
};
const llqaDismiss = (id) => {
  LLQAUI.toasts = LLQAUI.toasts.filter((x) => x.id !== id);
  llqaUIChanged();
};

/* ---------- dates (Pakistan calendar) ---------- */
const llqaDays = (a, b) => {
  const pa = Date.parse(String(a || "").slice(0, 10) + "T00:00:00Z");
  const pb = Date.parse(String(b || "").slice(0, 10) + "T00:00:00Z");
  return isNaN(pa) || isNaN(pb) ? null : Math.round((pb - pa) / 86400000);
};
const llqaAddDays = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const llqaWeekday = (d) => LLQABooking.DAYS[(new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7];
const llqaDateLabel = (d) => {
  try {
    return new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
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
  !!s && (s.fee === "paid" || (arPayments || []).some((p) => p && String(p.studentId) === String(s.id)));
const llqaTrialInfo = (s, opt) => {
  const o = opt || {};
  const today = o.today || todayPK();
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
  ["custom", "Custom message", "Assalamu Alaikum {parent},\n\n"],
  // to teachers (not shown in the family message list)
  ["teacherMoves", "Teachers — moved classes",
    "Assalamu Alaikum {name}, the clocks changed for some families, so these classes move to keep the families' usual time:\n{moves}\n\nYour Timetable already shows the new times. JazakAllah Khair!", "staff"],
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
  const v = {
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
  (log || []).forEach((m) => {
    if (!m || String(m.studentId) !== String(studentId)) return;
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
const llqaClassesOn = (date, teachers, students, dailyProgress) => {
  const B = LLQABooking;
  const wd = llqaWeekday(date);
  const ref = new Date(date + "T07:00:00Z"); // noon in Pakistan
  const byId = new Map((students || []).map((s) => [String(s.id), s]));
  const out = [];
  B.eachBooked(teachers || [], (c) => {
    const cell = c.cell;
    const tz = B.timezoneFor(cell.country, cell.state);
    const pd = B.pktDayOf(c.day, c.slot, tz, ref);
    if (pd.pktDay !== wd) return;
    const stu =
      cell.sid != null && cell.sid !== ""
        ? byId.get(String(cell.sid))
        : (students || []).find((s) => B.sameStudent(cell, s));
    const entry = stu
      ? (dailyProgress || []).find((p) => p && String(p.studentId) === String(stu.id) && p.date === date)
      : null;
    const onLeave =
      !!stu && stu.status === "leave" && (!stu.lvFrom || stu.lvFrom <= date) && (!stu.lvTo || stu.lvTo >= date);
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
    });
  });
  out.sort((a, b) => a.min - b.min || String(a.teacher).localeCompare(String(b.teacher)));
  return out;
};
// What to show for one class on that date.
const llqaClassState = (it, date, nowMin) => {
  const today = todayPK();
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
const llqaClockReport = (students, teachers, now) => {
  const B = LLQABooking;
  const n = now || new Date();
  const ix = B.indexCells(teachers || []);
  const out = [];
  (students || []).forEach((s) => {
    if (!s || s.status === "quit") return;
    const tz = s.tz || B.timezoneFor(s.country, s.state);
    if (!tz || !Array.isArray(s.schedule) || !s.schedule.length) return;
    const cells = B.cellsFromIndex(ix, s);
    if (!cells.length) return;
    const next = llqaNextChange(tz, n);
    const rows = [];
    s.schedule.forEach((r, ri) => {
      if (!r || !r.day || !r.time || !r.pktSlot) return;
      const cell = cells.find((c) => c.day === r.day && c.slot === r.pktSlot && (!r.teacher || c.teacher === r.teacher));
      if (!cell) return;
      const nowPk = B.toPkt(r.day, r.time, tz, n);
      if (!nowPk) return;
      const t = (teachers || []).find((x) => x.id === cell.teacherId);
      if (nowPk.slot !== r.pktSlot) {
        const fam = B.pktDayOf(r.day, r.pktSlot, tz, n).famTime;
        const info = B.slotInfo(t, nowPk.rowDay, nowPk.slot, s);
        rows.push({ ri, row: r, cell, kind: "moved", needSlot: nowPk.slot, needPk: nowPk, famNow: fam, free: info.state === "free", why: B.reasonText(info) });
      } else if (next) {
        const after = B.toPkt(r.day, r.time, tz, new Date(next.date.getTime() + 2 * 3600000));
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
const LLQAMessageModal = ({ studentId, student, template, extra, onClose }) => {
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
  const meta = { studentId: s.id != null ? s.id : null, name: s.name || "", template: tpl, ...(extra && extra.waitId ? { waitId: extra.waitId } : {}) };
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
        if (llqaWhatsApp(digits, text, meta)) onClose();
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
      llqaMini("💬 Open WhatsApp & next", () => {
        if (llqaWhatsApp(digits, text, { studentId: s.id != null ? s.id : null, name: s.name || "", template: it.template })) setOpened(opened + 1);
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
    onClose();
    llqaToast({ kind: "info", ttl: 6000, text: "✓ " + s.name + " is now a paid student." });
  };
  const info = llqaTrialInfo(s);
  return llqaShell(
    "✓ Enroll " + (s.name || "") + " as paid",
    "Trial: " + info.done + " of " + info.target + " classes" + (info.start ? " · started " + info.start : ""),
    React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px" } },
      React.createElement(Inp, { label: "Fee amount", type: "number", value: f.fee_amount, onChange: (v) => setF({ ...f, fee_amount: v }) }),
      React.createElement(Inp, { label: "Currency", value: f.currency, onChange: (v) => setF({ ...f, currency: v }), options: ["USD", "CAD", "GBP", "EUR", "AED", "PKR"] }),
      React.createElement(Inp, { label: "Class type", value: f.classType, onChange: (v) => setF({ ...f, classType: v }), options: ["Regular", "Premium", "Saudi", "Group"] }),
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
const LLQAToasts = () =>
  React.createElement(
    "div",
    { style: { position: "fixed", right: 16, bottom: 16, zIndex: 1250, display: "flex", flexDirection: "column", gap: 8, width: 360, maxWidth: "calc(100vw - 32px)" } },
    LLQAUI.toasts.map((t) =>
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
            ? llqaMini("💬 Send welcome", () => {
                llqaDismiss(t.id);
                llqaOpen("message", { studentId: t.studentId, student: t.student, template: "welcome" });
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
          llqaMini("✕", () => llqaDismiss(t.id), { key: "x", title: "Dismiss" }),
        ),
      ),
    ),
  );

/* ---------- automatic clock-change fixing (runs while the CRM is open) ---------- */
const llqaClockTick = (state) => {
  try {
    llqaClockAutoRun();
    if (!state.soon) {
      const soon = llqaClockSoon();
      if (soon) {
        state.soon = true;
        llqaToast(soon);
      }
    }
  } catch (e) {}
};
/* ---------- host: renders whichever pop-up is open ---------- */
const LLQAHost = () => {
  const [, bump] = useState(0);
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    LLQAUI.subs.add(f);
    return () => LLQAUI.subs.delete(f);
  }, []);
  useEffect(() => {
    // first check once the cloud data has settled, then every 5 minutes
    const state = { soon: false };
    const first = setTimeout(() => llqaClockTick(state), 15000);
    const again = setInterval(() => llqaClockTick(state), 5 * 60 * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(again);
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
  );
};

/* ============================================================
   v65 — Part 3: screens. Sales: Trial Pipeline, Contacts &
   Messages, Waitlist, Clock Changes. Timetable: Today's Classes.
   Dashboard: today & follow-ups.
   ============================================================ */
const LLQA_SALES_TABS = { pipeline: 1, contacts: 1, waitlist: 1, clock: 1 };
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
      llqaH("⚙ Message templates & links", "Placeholders: {parent} {student} {teacher} {schedule} {zone} {nextClass} {portalLink} {portalId} {academy} {trialDone} {trialTarget} {fee} {date}"),
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
  const manage = llqaCanManage();
  const nowMin = llqaNowPkMin();
  const all = llqaClassesOn(date, props.teachers || ctx.teachers, ctx.students, ctx.dailyProgress).map((it) => ({
    ...it,
    st: llqaClassState(it, date, nowMin),
    trial: it.stu ? llqaTrialInfo(it.stu, { today: date, arPayments: ctx.arPayments }) : null,
  }));
  const teachersList = [...new Set(all.map((it) => it.teacher))].sort();
  const byT = all.filter((it) => tf === "all" || it.teacher === tf);
  const FILTERS = [
    ["all", "All", () => true],
    ["missing", "⚠ Not logged", (it) => it.st.k === "missing"],
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
  const dayBtn = (label, d) => llqaMini(label, () => setDate(d), { key: label, tone: date === d ? "accent" : undefined, solid: date === d });
  const th = (t) => React.createElement("th", { key: t, style: { textAlign: "left", padding: "8px 10px", color: c.textSec, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid " + c.border } }, t);
  const td = (kids, k, st) => React.createElement("td", { key: k, style: { padding: "8px 10px", borderBottom: "1px solid " + c.border + "66", fontSize: 12, color: c.text, verticalAlign: "middle", ...(st || {}) } }, kids);
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
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 } },
      llqaStat("Classes", byT.length, tf === "all" ? "all teachers" : tf),
      llqaStat("Logged", byT.filter((it) => ["logged", "absent", "excused"].includes(it.st.k)).length, "attendance saved", byT.some((it) => ["logged", "absent", "excused"].includes(it.st.k)) ? c.success : c.text),
      llqaStat("Not logged", byT.filter((it) => it.st.k === "missing").length, "time passed, nothing saved", byT.some((it) => it.st.k === "missing") ? c.danger : c.text),
      llqaStat("Upcoming", byT.filter((it) => it.st.k === "upcoming" || it.st.k === "now").length, date === today ? "later today" : ""),
      llqaStat("Trial classes", byT.filter((it) => it.trial && it.trial.active).length, "red in the Timetable", byT.some((it) => it.trial && it.trial.active) ? c.danger : c.text),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" } },
      llqaChips(FILTERS.map(([k, l, t]) => [k, l, byT.filter(t).length]), f, setF),
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
      manage && upcomingStu.length
        ? llqaMini("💬 Remind " + upcomingStu.length + " famil" + (upcomingStu.length === 1 ? "y" : "ies"), () =>
            llqaOpen("queue", { title: "Class reminders", items: upcomingStu.map((s) => ({ studentId: s.id, template: "classReminder" })) }),
          { big: true, tone: "success" })
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
                  const canLog = !!s && date <= today;
                  const tplK = it.st.k === "missing" || it.st.k === "absent" ? "missedClass" : "classReminder";
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
                    td(it.teacher, "te"),
                    td(React.createElement("span", { style: { color: it.st.col, fontWeight: 700, fontSize: 11 } }, it.st.text), "st", { whiteSpace: "nowrap" }),
                    td(
                      React.createElement(
                        "div",
                        { style: { display: "flex", gap: 5, justifyContent: "flex-end" } },
                        canLog
                          ? llqaMini(it.entry ? "✍ Edit log" : "✍ Log", () =>
                              llqaOpen("log", { studentId: s.id, studentName: it.cell.s, teacherName: it.teacher, cell: it.cell, day: it.rowDay, slot: it.slot, date }),
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
  const cls = llqaClassesOn(today, ctx.teachers, ctx.students, ctx.dailyProgress).map((it) => llqaClassState(it, today, nowMin).k);
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
  );
};
