/* Smart Schedule Builder (v64) — every choice is checked live against the
   Timetable through LLQABooking, so a taken or duplicate slot can't be picked. */
const LLQAScheduleBuilder = ({ pf, setPf, appTeachers }) => {
  const B = LLQABooking;
  const [notice, setNotice] = useState("");
  const tz = B.timezoneFor(pf.country, pf.state);
  const box = (bg, col, kids) =>
    React.createElement(
      "div",
      {
        style: {
          marginTop: 10,
          padding: "10px 12px",
          background: bg,
          border: "1px solid " + col + "44",
          borderRadius: 8,
          color: col,
          fontSize: 12,
          lineHeight: 1.5,
        },
      },
      kids,
    );
  if (!tz) {
    return box(
      c.warnBg,
      c.warn,
      pf.country === "Other"
        ? "ℹ Type a State / Region we recognise (for example Texas, Ontario, London, Dubai) so class times can be converted to Pakistan time."
        : "ℹ Select the State / Province above first — the student's timezone is needed to show correct Pakistan times and free teachers.",
    );
  }
  const isQuran = pf.course !== "Subject";
  const teachers = appTeachers || [];
  const rows =
    Array.isArray(pf.schedule) && pf.schedule.length
      ? pf.schedule
      : [{ id: 1, day: "Mon", time: "", teacher: "" }];
  const master = isQuran ? (rows[0] && rows[0].teacher) || "" : "";
  const subs = Array.isArray(pf.specificSubject) ? pf.specificSubject : [];
  const deptOk = (t) =>
    isQuran
      ? !t.department || t.department === "Quran" || t.department === "Both"
      : (t.department === "Subject" || t.department === "Both") &&
        (!subs.length || subs.some((s) => (t.subjects || []).includes(s)));
  const findT = (name) => teachers.find((t) => t.name === name);
  const conv = (r) => (r && r.day && r.time ? B.toPkt(r.day, r.time, tz) : null);
  const isFreeFor = (name, r) => {
    const pk = conv(r);
    return !pk || B.slotInfo(findT(name), pk.rowDay, pk.slot).state === "free";
  };

  // Every change goes through commit(): it keeps the old fields the rest of
  // the CRM reads (teacher, time, hoursPerWeek) and drops a teacher who is no
  // longer free, with a visible notice instead of a silent double booking.
  const commit = (newRows, msg) => {
    let out = newRows.map((r) => ({ ...r }));
    let note = msg || "";
    if (isQuran) {
      const m = (out[0] && out[0].teacher) || "";
      const bad = m ? out.filter((r) => !isFreeFor(m, r)) : [];
      if (bad.length) {
        note =
          m +
          " is not free at " +
          bad.map((r) => r.day + " " + B.timeLabel(r.time)).join(", ") +
          " — teacher cleared. Choose from the list (only free teachers are shown).";
        out = out.map((r) => ({ ...r, teacher: "" }));
      } else out = out.map((r) => ({ ...r, teacher: m }));
    } else {
      out = out.map((r) => {
        if (!r.teacher || isFreeFor(r.teacher, r)) return r;
        note =
          r.teacher +
          " is not free at " +
          r.day +
          " " +
          B.timeLabel(r.time) +
          " — teacher cleared for that row.";
        return { ...r, teacher: "" };
      });
    }
    const valid = out.filter((r) => r.day && r.time);
    setNotice(note);
    setPf({
      ...pf,
      schedule: out,
      teacher: (out[0] && out[0].teacher) || "Unassigned",
      time: valid.map((r) => r.day + "|" + r.time).join(", "),
      hoursPerWeek: valid.length ? String(valid.length * 0.5) : "",
    });
  };
  // A change that makes a row repeat another row's day + time (for example
  // switching row 2's day to Mon while it holds 1:00 PM) clears that row's
  // time at once, so the form can never hold the same class twice.
  const setRow = (i, patch) => {
    const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
    const r = next[i];
    const dup =
      r && r.day && r.time
        ? next.findIndex((x, j) => j !== i && x.day === r.day && x.time === r.time)
        : -1;
    if (dup >= 0) {
      next[i] = { ...r, time: "" };
      commit(
        next,
        "⛔ " + r.day + " " + B.timeLabel(r.time) + " is already in row " + (dup + 1) +
          " — time cleared for row " + (i + 1) + ". Pick another time.",
      );
      return;
    }
    commit(next);
  };
  const removeRow = (i) => commit(rows.filter((_, j) => j !== i));
  const addRow = () => {
    const last = rows[rows.length - 1] || {};
    const time = last.time || "";
    let day = null;
    if (last.day) {
      for (let k = 1; k <= 7; k++) {
        const d = B.DAYS[(B.DAYS.indexOf(last.day) + k) % 7];
        const dup = rows.some((r) => r.day === d && r.time === time);
        const ok = !master || !time || isFreeFor(master, { day: d, time });
        if (!dup && ok) {
          day = d;
          break;
        }
      }
    }
    if (day) {
      commit([...rows, { id: Date.now(), day, time, teacher: isQuran ? master : "" }]);
      return;
    }
    // No other free day at this time: add the row without a time, never a copy.
    const next = last.day ? B.DAYS[(B.DAYS.indexOf(last.day) + 1) % 7] : "Mon";
    commit(
      [...rows, { id: Date.now(), day: next, time: "", teacher: isQuran ? master : "" }],
      time
        ? "No other day is free at " + B.timeLabel(time) + (master ? " for " + master : "") +
            " — choose a day and time for the new row."
        : "",
    );
  };
  const PATTERNS = [
    ["Mon–Fri", ["Mon", "Tue", "Wed", "Thu", "Fri"]],
    ["Mon · Wed · Fri", ["Mon", "Wed", "Fri"]],
    ["Tue · Thu", ["Tue", "Thu"]],
    ["Sat · Sun", ["Sat", "Sun"]],
  ];
  const applyPattern = (days) => {
    const time = (rows.find((r) => r.time) || {}).time || "";
    commit(
      days.map((d, i) => ({
        id: Date.now() + i,
        day: d,
        time,
        teacher: isQuran ? master : "",
      })),
    );
  };

  const freeCount = (day, tm) => {
    const pk = B.toPkt(day, tm, tz);
    return pk
      ? teachers.filter(
          (t) => deptOk(t) && B.slotInfo(t, pk.rowDay, pk.slot).state === "free",
        ).length
      : 0;
  };
  const timeOptions = (r, i) => [
    { value: "", label: "-- Select Time --" },
    ...B.TIMES.map((tm) => {
      const pk = B.toPkt(r.day, tm, tz);
      const label = B.timeLabel(tm) + "  →  " + B.pktLabel(pk);
      const dup = rows.findIndex((x, j) => j !== i && x.day === r.day && x.time === tm);
      if (dup >= 0)
        return { value: tm, label: label + "  ·  already in row " + (dup + 1), disabled: true };
      const tName = isQuran ? master : r.teacher;
      if (tName) {
        const info = B.slotInfo(findT(tName), pk.rowDay, pk.slot);
        if (info.state !== "free")
          return {
            value: tm,
            label:
              label +
              "  ·  " +
              (info.state === "booked"
                ? "busy (" + info.who + ")"
                : info.state === "offshift"
                  ? "off shift"
                  : "unavailable"),
            disabled: true,
          };
        return { value: tm, label: label + "  ·  free" };
      }
      const n = freeCount(r.day, tm);
      return {
        value: tm,
        label: label + "  ·  " + (n ? n + " teacher" + (n === 1 ? "" : "s") + " free" : "no teacher free"),
      };
    }),
  ];
  const rowStatus = (r, i) => {
    if (!r.time) return { col: c.textMuted, text: "Pick a time" };
    const pk = conv(r);
    if (!pk) return { col: c.danger, text: "Time not understood" };
    const where =
      "→ " + B.pktLabel(pk) + (pk.pktDay !== r.day ? " · " + pk.pktDay + " in Pakistan" : "");
    const dup = rows.findIndex((x, j) => j < i && x.day === r.day && x.time === r.time);
    if (dup >= 0) return { col: c.danger, text: where + " · ⛔ same as row " + (dup + 1) };
    const tName = isQuran ? master : r.teacher;
    if (!tName) return { col: c.warn, text: where + " · pick a teacher" };
    const info = B.slotInfo(findT(tName), pk.rowDay, pk.slot);
    return info.state === "free"
      ? { col: c.success, text: where + " · ✓ free with " + tName }
      : { col: c.danger, text: where + " · ⛔ " + B.reasonText(info) };
  };

  const items = rows.map(conv).filter(Boolean);
  const ranked = isQuran ? B.rankTeachers(teachers, items, { filter: deptOk }) : [];
  const noShift = teachers.filter(
    (t) =>
      t.status !== "resigned" &&
      t.status !== "quit" &&
      t.status !== "terminated" &&
      deptOk(t) &&
      B.shiftsOf(t).length === 0,
  );
  const autoAssign = () => {
    if (isQuran) {
      if (!ranked.length) {
        setNotice("No teacher is free for every chosen slot — change a day or time.");
        return;
      }
      commit(rows.map((r) => ({ ...r, teacher: ranked[0].t.name })), "✨ Best match: " + ranked[0].t.name + " (lightest timetable that is free for every slot).");
      return;
    }
    commit(
      rows.map((r) => {
        const pk = conv(r);
        const best = pk ? B.rankTeachers(teachers, [pk], { filter: deptOk })[0] : null;
        return best ? { ...r, teacher: best.t.name } : r;
      }),
      "✨ Best free teacher picked for each slot.",
    );
  };
  const pl = B.plan({ rows, country: pf.country, state: pf.state, teachers, isQuran, master });
  const valid = rows.filter((r) => r.day && r.time);
  const cc = valid.length ? B.clockChange(tz) : null;
  let dstText = "";
  if (cc) {
    const r0 = valid[0];
    const now = B.toPkt(r0.day, r0.time, tz);
    const later = B.toPkt(r0.day, r0.time, tz, new Date(cc.date.getTime() + 3600000));
    if (now && later && now.slot !== later.slot) {
      let when = "";
      try {
        when = cc.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz });
      } catch (e) {
        when = cc.date.toDateString();
      }
      dstText =
        "🕐 The student's clocks change on " + when + ". This booking uses today's Pakistan time: " +
        r0.day + " " + B.timeLabel(r0.time) + " = " + B.pktLabel(now) + ". From " + when + ", " +
        B.timeLabel(r0.time) + " for the student = " + B.pktLabel(later) +
        (valid.length > 1 ? " (all " + valid.length + " classes shift the same way)" : "") +
        ". Classes are not moved automatically. If the family keeps the same time, move them in Class Shifting after the change.";
    }
  }
  const chip = (label, onClick, active) =>
    React.createElement(
      "button",
      {
        key: label,
        type: "button",
        onClick,
        style: {
          padding: "5px 10px",
          borderRadius: 14,
          border: "1px solid " + (active ? c.accent : c.border),
          background: active ? c.accentBg : "transparent",
          color: active ? c.accent : c.textSec,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
        },
      },
      label,
    );
  const patternActive = (days) =>
    valid.length === days.length && days.every((d) => valid.some((r) => r.day === d));

  return React.createElement(
    "div",
    { style: { marginTop: 16 } },
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 } },
      React.createElement("h4", { style: { color: c.text, margin: 0, fontSize: 14, fontWeight: 700 } }, "📅 Smart Schedule Builder"),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
        chip("✨ Auto-assign best teacher", autoAssign, false),
        chip("+ Add Slot", addRow, false),
      ),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 10 } },
      React.createElement("span", { style: { color: c.textMuted, fontSize: 11 } }, "Quick days:"),
      PATTERNS.map(([label, days]) => chip(label, () => applyPattern(days), patternActive(days))),
    ),
    rows.map((r, i) => {
      const st = rowStatus(r, i);
      const pk = conv(r);
      const rowTeachers =
        !isQuran && pk
          ? B.rankTeachers(teachers, [pk], { filter: deptOk }).map((x, k) => ({
              value: x.t.name,
              label: (k === 0 ? "★ " : "") + x.t.name + " — " + x.load.booked + " booked",
            }))
          : [];
      if (!isQuran && r.teacher && !rowTeachers.some((o) => o.value === r.teacher))
        rowTeachers.unshift({ value: r.teacher, label: r.teacher + " (not free)", disabled: true });
      return React.createElement(
        "div",
        { key: r.id || i, style: { background: c.bgCard, border: "1px solid " + c.border, borderRadius: 8, padding: "10px 10px 6px", marginBottom: 8 } },
        React.createElement(
          "div",
          { style: { display: "grid", gridTemplateColumns: isQuran ? "110px 1fr auto" : "110px 1fr 1fr auto", gap: 8, alignItems: "end" } },
          React.createElement(Inp, { label: "Day", value: r.day, onChange: (v) => setRow(i, { day: v }), options: B.DAYS }),
          React.createElement(Inp, { label: "Time (student's local time)", value: r.time, onChange: (v) => setRow(i, { time: v }), options: timeOptions(r, i) }),
          !isQuran &&
            React.createElement(Inp, {
              label: "Teacher",
              value: r.teacher || "",
              onChange: (v) => setRow(i, { teacher: v }),
              options: [{ value: "", label: pk ? "-- Select Teacher --" : "-- Pick a time first --" }, ...rowTeachers],
            }),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => removeRow(i),
              disabled: rows.length <= 1,
              title: rows.length <= 1 ? "At least one row" : "Remove this slot",
              style: { marginBottom: 12, height: 34, padding: "0 10px", borderRadius: 6, border: "1px solid " + c.border, background: "transparent", color: rows.length <= 1 ? c.textMuted : c.danger, cursor: rows.length <= 1 ? "not-allowed" : "pointer", fontWeight: 700 },
            },
            "✕",
          ),
        ),
        React.createElement("div", { style: { color: st.col, fontSize: 11, marginTop: -4, marginBottom: 2 } }, st.text),
      );
    }),
    isQuran &&
      React.createElement(Inp, {
        label: "Master Assigned Teacher (Quran rule — one teacher for every slot)",
        value: master,
        onChange: (v) => commit(rows.map((r) => ({ ...r, teacher: v }))),
        options: [
          { value: "", label: ranked.length ? "-- Select Master Teacher (" + ranked.length + " free for every slot) --" : "-- No teacher is free for every slot --" },
          ...ranked.map((x, k) => ({
            value: x.t.name,
            label: (k === 0 ? "★ " : "") + x.t.name + " — " + x.load.booked + " booked · " + x.load.free + " free" + (x.t.location ? " (" + x.t.location + ")" : ""),
          })),
        ],
      }),
    isQuran && noShift.length > 0 &&
      React.createElement("div", { style: { color: c.textMuted, fontSize: 10, marginTop: -6, marginBottom: 8 } },
        noShift.length + " teacher(s) hidden because their shift is not set to Morning, Evening, Night or Weekend: " + noShift.map((t) => t.name).join(", ")),
    notice ? box(c.warnBg, c.warn, notice) : null,
    valid.length === 0
      ? box(c.bgDeep, c.textSec, "No class time yet — you can still save the student and book later.")
      : pl.problems.length
        ? box(c.dangerBg, c.danger, [
            React.createElement("div", { key: "h", style: { fontWeight: 700, marginBottom: 4 } }, "⛔ Fix before saving:"),
            ...pl.problems.map((p, k) => React.createElement("div", { key: k }, "• " + p)),
          ])
        : box(c.successBg, c.success,
            "✓ Ready: " + valid.length + " class" + (valid.length === 1 ? "" : "es") + " a week · " +
              valid.length * 0.5 + " hrs/week" + (isQuran && master ? " with " + master : "") + " — all slots free."),
    dstText ? box(c.accentBg, c.accent, dstText) : null,
  );
};

const StudentFormModal = ({ pf, setPf, sts, appTeachers, onSave, onClose }) =>
  React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(4px)",
        padding: 20,
        overflowY: "auto",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          background: c.bgCard,
          border: "1px solid " + c.success + "66",
          borderRadius: 14,
          padding: 24,
          width: 520,
          maxHeight: "90vh",
          overflowY: "auto",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: "1px solid " + c.border,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
            },
          },
          React.createElement(UserPlus, {
            size: 18,
            color: c.success,
          }),
          React.createElement(
            "h3",
            {
              style: {
                color: c.text,
                fontSize: 16,
                margin: 0,
                fontWeight: 700,
              },
            },
            pf.editingId ? "Edit Student" : "Add New Student",
          ),
        ),
        React.createElement(
          "button",
          {
            onClick: onClose,
            style: {
              background: "none",
              border: "none",
              cursor: "pointer",
              color: c.textSec,
            },
          },
          React.createElement(X, {
            size: 18,
          }),
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            background: c.successBg,
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
            color: c.success,
            fontSize: 10,
          },
        },
        "Fill student details \xB7 All fields with * are required",
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Student Name *",
          value: pf.name || "",
          onChange: (v) =>
            setPf({
              ...pf,
              name: v,
            }),
          placeholder: "e.g. Ahmed Khan",
        }),
        React.createElement(Inp, {
          label: "Age",
          value: pf.age || "",
          onChange: (v) =>
            setPf({
              ...pf,
              age: v,
            }),
          type: "number",
          placeholder: "e.g. 10",
        }),
        React.createElement(Inp, {
          label: "Code",
          value: pf.code || "",
          onChange: (v) =>
            setPf({
              ...pf,
              code: v,
            }),
          placeholder: "e.g. S-1001",
        }),
      ),
      React.createElement(Inp, {
        label: "Parent / Guardian Name *",
        value: pf.parent || "",
        onChange: (v) =>
          setPf({
            ...pf,
            parent: v,
          }),
        placeholder: "Father or Mother's name",
      }),
      (() => {
        if (pf.editingId || !pf.name || !pf.name.trim()) return null;
        const nLower = pf.name.trim().toLowerCase();
        const parentLower = (pf.parent || "").trim().toLowerCase();
        const exact = sts.find(
          (s) =>
            (s.name || "").trim().toLowerCase() === nLower &&
            (s.parent || "").trim().toLowerCase() === parentLower &&
            parentLower,
        );
        const nameOnly = sts.find(
          (s) => (s.name || "").trim().toLowerCase() === nLower,
        );
        if (exact) {
          return React.createElement(
            "div",
            {
              style: {
                marginTop: -8,
                marginBottom: 10,
                padding: "6px 10px",
                background: c.dangerBg || "rgba(239,68,68,0.12)",
                border: "1px solid " + (c.danger || "#ef4444") + "55",
                borderRadius: 6,
                color: c.danger || "#ef4444",
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              },
            },
            React.createElement(AlertTriangle, {
              size: 12,
            }),
            "\u2716 Student exists with same Name + Parent (teacher: " +
              (exact.teacher || "—") +
              ")",
          );
        }
        if (nameOnly) {
          return React.createElement(
            "div",
            {
              style: {
                marginTop: -8,
                marginBottom: 10,
                padding: "6px 10px",
                background: c.warnBg || "rgba(245,158,11,0.12)",
                border: "1px solid " + (c.warn || "#f59e0b") + "55",
                borderRadius: 6,
                color: c.warn || "#f59e0b",
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              },
            },
            React.createElement(AlertTriangle, {
              size: 12,
            }),
            "Name exists (parent: " +
              nameOnly.parent +
              "). Different person? Use distinct parent name.",
          );
        }
        return null;
      })(),
      React.createElement(
        "div",
        {
          style: {
            marginBottom: 12,
          },
        },
        React.createElement(
          "label",
          {
            style: {
              display: "block",
              color: c.textSec,
              fontSize: 10,
              marginBottom: 4,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
          },
          "Family Group (optional — for siblings)",
        ),
        React.createElement("input", {
          list: "familyOptions",
          value: pf.family || "",
          onChange: (e) => {
            const v = e.target.value;
            const existingSibling = sts.find(
              (s) =>
                (s.family || "").toLowerCase() === v.toLowerCase() &&
                v.trim() !== "",
            );
            if (existingSibling && !pf.parent) {
              setPf({
                ...pf,
                family: v,
                parent: existingSibling.parent,
                country: existingSibling.country,
                state: existingSibling.state,
                phone: existingSibling.phone,
                email: existingSibling.email,
                teacher: existingSibling.teacher,
              });
            } else {
              setPf({
                ...pf,
                family: v,
              });
            }
          },
          placeholder:
            "e.g. Chowdhury Family, Khan Brothers — type new or pick existing",
          style: {
            width: "100%",
            padding: "8px 10px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 6,
            color: c.text,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          },
        }),
        React.createElement(
          "datalist",
          {
            id: "familyOptions",
          },
          [...new Set(sts.map((s) => s.family).filter(Boolean))]
            .sort()
            .map((fn) =>
              React.createElement("option", {
                key: fn,
                value: fn,
              }),
            ),
        ),
        pf.family &&
          sts.filter(
            (s) => (s.family || "").toLowerCase() === pf.family.toLowerCase(),
          ).length > 0 &&
          React.createElement(
            "div",
            {
              style: {
                fontSize: 10,
                color: c.success,
                marginTop: 4,
              },
            },
            "✓ Will be linked to " +
              sts.filter(
                (s) =>
                  (s.family || "").toLowerCase() === pf.family.toLowerCase(),
              ).length +
              " existing sibling(s) in this family",
          ),
      ),
      React.createElement(
        "div",
        {
          style: {
            marginBottom: 12,
          },
        },
        React.createElement(
          "label",
          {
            style: {
              display: "block",
              color: c.textSec,
              fontSize: 10,
              marginBottom: 4,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
          },
          "Reference / Referred By (optional)",
        ),
        React.createElement("input", {
          value: pf.referredBy || "",
          onChange: (e) =>
            setPf({
              ...pf,
              referredBy: e.target.value,
            }),
          placeholder:
            "Who referred this student? — auto-logs to Sales → References",
          style: {
            width: "100%",
            padding: "8px 10px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 6,
            color: c.text,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          },
        }),
        pf.referredBy &&
          pf.referredBy.trim() &&
          React.createElement(
            "div",
            {
              style: {
                fontSize: 10,
                color: c.purple,
                marginTop: 4,
              },
            },
            "✓ Will appear in Sales → References as an enrolled referral",
          ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Country",
          value: pf.country || "",
          onChange: (v) =>
            setPf({
              ...pf,
              country: v,
            }),
          options: ["USA", "Canada", "UK", "UAE", "Australia", "Other"],
        }),
        pf.country === "Other"
          ? React.createElement(Inp, {
              label: "State / Region",
              value: pf.state || "",
              onChange: (v) =>
                setPf({
                  ...pf,
                  state: v,
                }),
              placeholder: "Enter state / region",
            })
          : React.createElement(Inp, {
              label: "State / Province",
              value: pf.state || "",
              onChange: (v) =>
                setPf({
                  ...pf,
                  state: v,
                }),
              options: ["", ...(COUNTRY_STATES[pf.country || "USA"] || [])],
            }),
      ),
      // --- SMART SCHEDULE BUILDER START ---
      React.createElement(
        "div",
        {
          style: {
            background: c.bgDeep,
            border: "1px solid " + c.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            marginTop: 16,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns:
                pf.course === "Other (Custom)" ? "1fr 1fr" : "1fr",
              gap: "0 14px",
            },
          },
          React.createElement(Inp, {
            label: "Course *",
            value: pf.course || "",
            onChange: (v) =>
              setPf({
                ...pf,
                course: v,
                customCourse:
                  v === "Other (Custom)" ? pf.customCourse || "" : "",
                schedule: [], // reset schedule when course changes to avoid mismatched teacher rules
                teacher: "",
                time: "",
                specificSubject: v === "Subject" ? [] : [],
              }),
            options: [
              "Quran",
              "EN-Quaida",
              "Quran with Tajweed",
              "Quran-Memo",
              "Saudi Quran",
              "Quran+Memo+Islamic Ed",
              "Eng/Noorani Quaida",
              "Subject",
              "Other (Custom)",
            ],
          }),
          pf.course === "Subject" &&
            React.createElement(CustomMultiSelect, {
              label: "Specific Subjects *",
              value: pf.specificSubject || [],
              onChange: (v) =>
                setPf({
                  ...pf,
                  specificSubject: v,
                }),
              options:
                typeof ALL_SUBJECTS !== "undefined"
                  ? ALL_SUBJECTS
                  : ["Math", "English", "Science"],
              placeholder: "Select subjects...",
            }),
          pf.course === "Other (Custom)" &&
            React.createElement(Inp, {
              label: "Custom Course Name *",
              value: pf.customCourse || "",
              onChange: (v) =>
                setPf({
                  ...pf,
                  customCourse: v,
                }),
              placeholder: "e.g. Hifz Revision, Tafseer Class",
            }),
        ),

        React.createElement(LLQAScheduleBuilder, {
          pf: pf,
          setPf: setPf,
          appTeachers: appTeachers,
        }),
        // --- SMART SCHEDULE BUILDER END ---
        React.createElement(Inp, {
          label: "Date of Registration",
          value: pf.dor || "",
          onChange: (v) =>
            setPf({
              ...pf,
              dor: v,
            }),
          type: "date",
        }),
        React.createElement(Inp, {
          label: "Fee Status",
          value: pf.fee || "",
          onChange: (v) =>
            setPf({
              ...pf,
              fee: v,
            }),
          options: ["paid", "overdue", "partial", "trial"],
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Gender",
          value: pf.gender || "",
          onChange: (v) =>
            setPf({
              ...pf,
              gender: v,
            }),
          options: ["", "Male", "Female"],
        }),
        React.createElement(Inp, {
          label: "Class Type",
          value: pf.classType || "Regular",
          onChange: (v) =>
            setPf({
              ...pf,
              classType: v,
            }),
          options: ["Regular", "Trial", "Premium", "Saudi", "Group"],
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Phone / WhatsApp",
          value: pf.phone || "",
          onChange: (v) =>
            setPf({
              ...pf,
              phone: v,
            }),
          placeholder: "+1 ...",
        }),
        React.createElement(Inp, {
          label: "Email",
          value: pf.email || "",
          onChange: (v) =>
            setPf({
              ...pf,
              email: v,
            }),
          type: "email",
          placeholder: "parent@email.com",
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0 14px",
          },
        },
        React.createElement(Inp, {
          label: "Hours per Week",
          value: pf.hoursPerWeek || "",
          onChange: (v) =>
            setPf({
              ...pf,
              hoursPerWeek: v,
            }),
          placeholder: "Auto (0.5 hr/slot)",
        }),
        React.createElement(Inp, {
          label: "Fee Amount",
          value: pf.fee_amount || "",
          onChange: (v) =>
            setPf({
              ...pf,
              fee_amount: v,
            }),
          type: "number",
          placeholder: "45",
        }),
        React.createElement(Inp, {
          label: "Currency",
          value: pf.currency || "USD",
          onChange: (v) =>
            setPf({
              ...pf,
              currency: v,
            }),
          options: ["USD", "CAD", "GBP", "EUR", "AED", "PKR"],
        }),
      ),
      React.createElement(Inp, {
        label: "Notes / Special Requirements",
        value: pf.notes || "",
        onChange: (v) =>
          setPf({
            ...pf,
            notes: v,
          }),
        placeholder: "e.g. Needs female teacher, Weekend only, Has dyslexia",
      }),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid " + c.border,
          },
        },
        React.createElement(
          Btn,
          {
            variant: "outline",
            onClick: onClose,
          },
          "Cancel",
        ),
        React.createElement(
          Btn,
          {
            onClick: onSave,
            icon: UserPlus,
          },
          "Add Student",
        ),
      ),
    ),
  );
