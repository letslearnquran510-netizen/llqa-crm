// v64.2: the badge shows what is really happening with the cloud — not just
// that Firebase loaded. It turns red when saves are not reaching the cloud.
const llqaSyncView = (st, online) => {
  const denied = Object.keys(st.denied || {});
  const errs = Object.keys(st.errors || {});
  const waiting = st.pending || 0;
  const waitText = waiting
    ? " Waiting on this computer: " + waiting + " change" + (waiting === 1 ? "" : "s") + "."
    : "";
  if (!online)
    return {
      key: "offline",
      col: c.danger,
      label: "Offline",
      title: "No internet connection",
      text: "Changes are kept on this computer and sent automatically when the internet is back." + waitText,
    };
  if (st.mode === "local")
    return {
      key: "local",
      col: c.warn,
      label: "Local Mode",
      title: "Firebase not configured",
      text: "Data stays on this computer only.",
    };
  if (denied.length) {
    const why =
      st.auth === "failed"
        ? /admin-restricted|operation-not-allowed|ADMIN_ONLY/i.test(st.authError || "")
          ? "Anonymous sign-in is turned off in Firebase (Authentication → Sign-in method → Anonymous)."
          : "The app could not sign in to Firebase (" + st.authError + ")."
        : "The Firebase rules refused access.";
    return {
      key: "denied",
      col: c.danger,
      label: "Not saving to cloud",
      title: "Saves are NOT reaching the cloud",
      text:
        why +
        " Changes stay on this computer and other computers can't see them. They are sent automatically once this is fixed." +
        waitText,
    };
  }
  if (st.writeError)
    return {
      key: "writefail",
      col: c.danger,
      label: "Save failed — retrying",
      title: "The last save did not reach the cloud",
      text: "Reason: " + st.writeError + ". Kept on this computer and sent again every minute." + waitText,
    };
  if (st.sending > 0 || waiting > 0)
    return {
      key: "saving",
      col: c.warn,
      label: "Saving…",
      title: "Sending changes to the cloud",
      text: "Changes are on their way to the cloud." + waitText,
    };
  if (errs.length)
    return {
      key: "error",
      col: c.danger,
      label: "Sync problem",
      title: "Some lists are not updating",
      text: errs.map((k) => k + ": " + st.errors[k]).join(" · ") + ". Retrying automatically.",
    };
  if (!Object.keys(st.live || {}).length)
    return {
      key: "connecting",
      col: c.warn,
      label: "Connecting…",
      title: "Connecting to the cloud",
      text: "Loading the latest data…",
    };
  return {
    key: "live",
    col: c.success,
    label: "Live · Cloud",
    title: "Real-time sync active",
    text: "Every save reaches all logged-in computers within seconds.",
  };
};

const llqaSmallBtn = (label, onClick, col, title) =>
  React.createElement(
    "button",
    {
      type: "button",
      onClick,
      title: title || label,
      style: {
        padding: "4px 9px",
        borderRadius: 6,
        border: "1px solid " + (col || c.border),
        background: "transparent",
        color: col || c.textSec,
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer",
        marginRight: 6,
        marginTop: 6,
      },
    },
    label,
  );

const LLQA_LIST_NAMES = {
  students: "Students", teachers: "Teachers", salesMasterData: "Sales Master Data", salesReferrals: "Referrals",
  dailyProgress: "Daily progress", parentNotes: "Parent notes", teacherFeedback: "Teacher feedback", leaves: "Leaves",
  teamLeads: "Team leads", autoAttendance: "Auto attendance", arPayments: "Invoices & payments", apLiabilities: "Payables",
  qcViolations: "QC violations", trainingPrograms: "Training", procInventory: "Inventory", procPurchases: "Purchases",
  hrInterviews: "HR interviews", hrHiring: "HR hiring", shifts: "Shifts", customRoles: "Custom roles", loginAudit: "Login log",
  "data/attendanceHistory": "Attendance history", "settings/portalAccess": "Portal access settings", "settings/preferences": "App settings",
};
const llqaListName = (k) => LLQA_LIST_NAMES[k] || k;

// Admin only: records a computer saved while the cloud refused them, grouped
// by computer. Nothing goes into the real lists until the admin restores it.
const llqaRescueTools = (items, setItems) => {
  const list = (items || []).filter((x) => x && x.coll);
  const latest = (arr) => {
    const m = new Map();
    arr.forEach((x) => {
      const k = x.kind + "|" + String(x.recordId || x.id);
      const cur = m.get(k);
      if (!cur || (x.savedAt || 0) > (cur.savedAt || 0)) m.set(k, x);
    });
    return Array.from(m.values());
  };
  const nameOf = (x) => {
    const d = x.data || {};
    return String(d.name || d.studentName || d.title || d.student || d.teacher || "#" + (x.recordId || "?"));
  };
  const drop = (arr) => {
    if (!arr.length) return;
    const ids = new Set(arr.map((x) => String(x.id)));
    setItems((prev) => prev.filter((x) => !ids.has(String(x.id))));
  };
  // Same person or record, even if the copy in the cloud was made separately
  // (e.g. Master Data the app built from the May students).
  const nm = (v) => String(v == null ? "" : v).trim().toLowerCase();
  const NATURAL = {
    students: (r) => nm(r.name) + "|" + nm(r.parent),
    salesMasterData: (r) => nm(r.name) + "|" + nm(r.parent),
    teachers: (r) => nm(r.name),
  };
  // Puts one computer's records for one list back; returns what happened.
  // A "new" record whose number is already used by a DIFFERENT record is
  // left in the rescue area (reported), never written over it.
  const restoreList = (coll, arr, kinds) => {
    const res = { added: 0, replaced: 0, skipped: [], done: [] };
    const pick = arr.filter((x) => kinds.includes(x.kind));
    if (!pick.length) return res;
    if (pick.every((x) => x.kind === "doc")) {
      const x = pick.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
      LLQACloud.doc(coll, {}).set(x.data);
      res.replaced = 1;
      res.done = pick;
      return res;
    }
    const store = LLQACloud.collection(coll, []);
    store.start();
    const cur = new Map((store.data || []).map((r) => [String(r && r.id), r]));
    const add = [];
    const repl = new Map();
    latest(pick).forEach((x) => {
      const k = String(x.recordId);
      const same = pick.filter((y) => y.kind === x.kind && String(y.recordId) === k);
      const ex = cur.get(k);
      if (x.kind === "changed" || !ex) {
        if (ex) repl.set(k, x.data);
        else add.push(x.data);
        res.done.push(...same);
      } else if (llqaStable(ex) === llqaStable(x.data)) res.done.push(...same);
      else if (NATURAL[coll] && NATURAL[coll](ex) === NATURAL[coll](x.data)) {
        repl.set(k, x.data); // same person — this computer's fuller copy wins
        res.done.push(...same);
      } else res.skipped.push(llqaListName(coll) + ": " + nameOf(x) + " (#" + k + ")");
    });
    // Referrals the app added by itself for a student are dropped when this
    // computer's own referral for that student comes back (no duplicates).
    const back = add.concat(Array.from(repl.values()));
    const sids = new Set(back.map((r) => String(r && r.studentId)).filter((v) => v && v !== "undefined" && v !== "null"));
    const backIds = new Set(back.map((r) => String(r && r.id)));
    const autoDup = (r) =>
      coll === "salesReferrals" && r && r._auto && sids.has(String(r.studentId)) && !backIds.has(String(r.id));
    if (add.length || repl.size)
      store.set((prev) => [...prev.filter((r) => !autoDup(r)).map((r) => repl.get(String(r && r.id)) || r), ...add]);
    res.added = add.length;
    res.replaced = repl.size;
    return res;
  };
  // Order matters: Master Data and Referrals before Students, so the app's
  // automatic Students → Master Data / Referrals updates find them in place.
  const ORDER = ["salesMasterData", "salesReferrals"];
  const sortLists = (names) =>
    names.slice().sort((a, b) => {
      const ra = ORDER.indexOf(a) >= 0 ? ORDER.indexOf(a) : a === "students" ? 99 : 50;
      const rb = ORDER.indexOf(b) >= 0 ? ORDER.indexOf(b) : b === "students" ? 99 : 50;
      return ra - rb || a.localeCompare(b);
    });
  const report = (title, results) => {
    const added = results.reduce((n, r) => n + r.added, 0);
    const replaced = results.reduce((n, r) => n + r.replaced, 0);
    const skipped = [].concat(...results.map((r) => r.skipped));
    alert(
      "✓ " + title + "\n\nAdded: " + added + " · Updated: " + replaced +
        (skipped.length
          ? "\n\nKept aside (the same number is already used by a different record — download to compare):\n• " +
            skipped.slice(0, 15).join("\n• ") + (skipped.length > 15 ? "\n… and " + (skipped.length - 15) + " more" : "")
          : ""),
    );
  };
  const download = (label, arr) => {
    try {
      const blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "llqa-rescued-" + String(label).replace(/[^A-Za-z0-9]+/g, "-") + "-" + todayPK() + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Download failed: " + e.message);
    }
  };
  return { list, latest, nameOf, drop, restoreList, sortLists, report, download };
};

const LLQARescuePanel = () => {
  const [items, setItems] = useFirestoreCollection("_rescue", []);
  const T = llqaRescueTools(items, setItems);
  const me = LLQACloud.deviceId();
  const box = (kids) =>
    React.createElement(
      "div",
      {
        style: {
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid " + c.border,
          fontSize: 11,
          color: c.textSec,
          lineHeight: 1.5,
        },
      },
      kids,
    );
  if (!T.list.length)
    return box("🛟 Rescued data: none. No computer has records that were missing from the cloud.");
  const byDev = {};
  T.list.forEach((x) => {
    const d = x.device || "?";
    const g = (byDev[d] = byDev[d] || {});
    (g[x.coll] = g[x.coll] || []).push(x);
  });
  const devs = Object.keys(byDev).sort((a, b) => (a === me ? -1 : b === me ? 1 : a.localeCompare(b)));
  const restoreAll = (dev) => {
    const lists = T.sortLists(Object.keys(byDev[dev]));
    const n = lists.reduce((k, l) => k + byDev[dev][l].length, 0);
    if (
      !confirm(
        "Restore everything saved on " + (dev === me ? "THIS computer" : "computer " + dev) + " (" + n + " records in " +
          lists.length + " lists) into the cloud?\n\nNew records are added. Changed records replace the cloud's older version. " +
          "Records whose number is already used by a different record are kept aside and listed.",
      )
    )
      return;
    const results = lists.map((l) => T.restoreList(l, byDev[dev][l], ["new", "changed", "doc"]));
    T.drop([].concat(...results.map((r) => r.done)));
    T.report("Restored from " + (dev === me ? "this computer" : dev), results);
  };
  const one = (dev, l, kinds, label) => {
    const r = T.restoreList(l, byDev[dev][l], kinds);
    T.drop(r.done);
    T.report(label + " — " + llqaListName(l), [r]);
  };
  const discard = (label, arr) => {
    if (!confirm("Delete " + arr.length + " rescued record(s) (" + llqaListName(label) + ")?\n\nDownload them first if you are not sure.")) return;
    T.drop(arr);
  };
  return box([
    React.createElement(
      "div",
      { key: "h", style: { color: c.text, fontWeight: 700, marginBottom: 4 } },
      "🛟 Rescued data — " + T.list.length + " record" + (T.list.length === 1 ? "" : "s") + " from " + devs.length + " computer" + (devs.length === 1 ? "" : "s"),
    ),
    React.createElement(
      "div",
      { key: "i", style: { marginBottom: 6 } },
      "Saved on a computer while the cloud refused them. Nothing here is in your real lists until you restore it. Restore the computer you used most first.",
    ),
    ...devs.map((dev) => {
      const lists = T.sortLists(Object.keys(byDev[dev]));
      const all = [].concat(...lists.map((l) => byDev[dev][l]));
      return React.createElement(
        "div",
        { key: dev, style: { padding: "8px 0 4px", borderTop: "1px solid " + c.border } },
        React.createElement(
          "div",
          { style: { color: c.text, fontWeight: 700 } },
          (dev === me ? "💻 This computer" : "🖥 " + dev) + " — " + all.length + " records",
        ),
        React.createElement(
          "div",
          null,
          llqaSmallBtn("Restore everything", () => restoreAll(dev), c.success),
          llqaSmallBtn("Download", () => T.download(dev, all)),
          llqaSmallBtn("Discard", () => discard(dev, all), c.danger),
        ),
        ...lists.map((l) => {
          const arr = byDev[dev][l];
          const isDoc = arr.every((x) => x.kind === "doc");
          const nNew = T.latest(arr.filter((x) => x.kind === "new")).length;
          const nCh = T.latest(arr.filter((x) => x.kind === "changed")).length;
          const shown = T.latest(arr).slice(0, 5);
          const preview = isDoc
            ? "settings · saved " + new Date(Math.max(...arr.map((x) => x.savedAt || 0))).toLocaleString()
            : shown.map((x) => T.nameOf(x) + " (" + x.kind + ")").join(", ") + (T.latest(arr).length > shown.length ? ", …" : "");
          return React.createElement(
            "div",
            { key: l, style: { padding: "6px 0 2px 10px", borderLeft: "2px solid " + c.border, marginTop: 6 } },
            React.createElement(
              "div",
              { style: { color: c.text, fontWeight: 600 } },
              llqaListName(l) + (isDoc ? "" : " — " + (nNew ? nNew + " new" : "") + (nNew && nCh ? " · " : "") + (nCh ? nCh + " changed" : "")),
            ),
            React.createElement("div", { style: { color: c.textMuted, fontSize: 10 } }, preview),
            React.createElement(
              "div",
              null,
              isDoc && llqaSmallBtn("Use this version", () => one(dev, l, ["doc"], "Settings restored"), c.accent),
              !isDoc && nNew > 0 && llqaSmallBtn("Add " + nNew + " new", () => one(dev, l, ["new"], "Added"), c.success),
              !isDoc && nCh > 0 && llqaSmallBtn("Replace " + nCh + " changed", () => one(dev, l, ["changed"], "Updated"), c.warn),
              llqaSmallBtn("Discard", () => discard(l, arr), c.danger),
            ),
          );
        }),
      );
    }),
  ]);
};

// Admin only: a reminder while rescued records are waiting.
const LLQARescueNotice = ({ onOpen }) => {
  const [items] = useFirestoreCollection("_rescue", []);
  const n = (items || []).filter((x) => x && x.coll).length;
  if (!n) return null;
  const pcs = new Set((items || []).map((x) => x.device)).size;
  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 998,
        maxWidth: 320,
        background: "linear-gradient(" + c.bgCard + ", " + c.bgCard + "), " + c.bg,
        border: "1px solid " + c.accent,
        borderLeft: "4px solid " + c.accent,
        borderRadius: 10,
        boxShadow: "0 12px 32px rgba(0,0,0,.35)",
        padding: "10px 12px",
        textAlign: "left",
      },
    },
    React.createElement(
      "div",
      { style: { color: c.accent, fontWeight: 700, fontSize: 12 } },
      "🛟 " + n + " record" + (n === 1 ? "" : "s") + " from " + pcs + " computer" + (pcs === 1 ? "" : "s") + " waiting",
    ),
    React.createElement(
      "div",
      { style: { color: c.textSec, fontSize: 11, lineHeight: 1.5, marginTop: 4 } },
      "Saved while the cloud refused them. They are safe, but not in your lists until you restore them.",
    ),
    llqaSmallBtn("Review & restore", onOpen, c.accent),
  );
};

const ConnectionBadge = (props) => {
  const user = props && props.user;
  const { online, sync } = useConnectionStatus();
  const [pulse, setPulse] = useState(false);
  const [open, setOpen] = useState(false);
  const [hideUntil, setHideUntil] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(t);
  }, []);
  const v = llqaSyncView(sync, online);
  const isAdmin = !!user && user.role === "superadmin";
  const bad = v.key === "denied" || v.key === "writefail";
  const notLive = Object.keys(sync.denied || {}).concat(Object.keys(sync.errors || {}));
  const pill = React.createElement(
    "div",
    {
      title: v.title + " — " + v.text,
      onClick: () => setOpen(!open),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        background: v.col + "22",
        border: "1px solid " + v.col + "44",
        borderRadius: 14,
        fontSize: 9,
        color: v.col,
        fontWeight: 600,
        cursor: "pointer",
        userSelect: "none",
      },
    },
    React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: v.col,
        opacity: pulse ? 1 : 0.4,
        transition: "opacity 0.5s",
      },
    }),
    v.label,
  );
  const panel =
    open &&
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 360,
          maxWidth: "92vw",
          maxHeight: "70vh",
          overflowY: "auto",
          // solid base under the (semi-transparent) card colour, so nothing shows through
          background: "linear-gradient(" + c.bgCard + ", " + c.bgCard + "), " + c.bg,
          border: "1px solid " + c.border,
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,.35)",
          padding: 14,
          zIndex: 1000,
          textAlign: "left",
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
        React.createElement("div", { style: { color: v.col, fontWeight: 700, fontSize: 13 } }, v.title),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setOpen(false),
            style: { background: "none", border: "none", color: c.textMuted, cursor: "pointer", fontSize: 14 },
          },
          "✕",
        ),
      ),
      React.createElement("div", { style: { color: c.textSec, fontSize: 11, lineHeight: 1.5 } }, v.text),
      notLive.length > 0 &&
        React.createElement(
          "div",
          { style: { color: c.textMuted, fontSize: 10, marginTop: 6 } },
          "Not updating: " + notLive.join(", "),
        ),
      React.createElement(
        "div",
        { style: { marginTop: 4 } },
        llqaSmallBtn("Retry now", () => LLQACloud.retryNow(), c.accent),
      ),
      React.createElement(
        "div",
        { style: { color: c.textMuted, fontSize: 9, marginTop: 8 } },
        "This computer: " + LLQACloud.deviceId(),
      ),
      isAdmin && React.createElement(LLQARescuePanel, null),
    );
  const alertBox =
    bad &&
    Date.now() > hideUntil &&
    React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 999,
          maxWidth: 340,
          // solid base under the (semi-transparent) card colour, so nothing shows through
          background: "linear-gradient(" + c.bgCard + ", " + c.bgCard + "), " + c.bg,
          border: "1px solid " + c.danger,
          borderLeft: "4px solid " + c.danger,
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,.35)",
          padding: "10px 12px",
          textAlign: "left",
        },
      },
      React.createElement("div", { style: { color: c.danger, fontWeight: 700, fontSize: 12 } }, "⚠ " + v.title),
      React.createElement(
        "div",
        { style: { color: c.textSec, fontSize: 11, lineHeight: 1.5, marginTop: 4 } },
        v.text,
      ),
      React.createElement(
        "div",
        null,
        llqaSmallBtn("Details", () => setOpen(true), c.accent),
        llqaSmallBtn("Hide 10 min", () => setHideUntil(Date.now() + 10 * 60 * 1000)),
      ),
    );
  return React.createElement(
    "div",
    { style: { position: "relative", display: "inline-block" } },
    pill,
    panel,
    alertBox,
    isAdmin && !open && React.createElement(LLQARescueNotice, { onOpen: () => setOpen(true) }),
  );
};
