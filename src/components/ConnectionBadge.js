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

// Admin only: records that other computers saved while the cloud refused
// them. Nothing goes into the real lists until the admin chooses to.
const LLQARescuePanel = () => {
  const [items, setItems] = useFirestoreCollection("_rescue", []);
  const list = (items || []).filter((x) => x && x.coll);
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
  if (!list.length)
    return box("🛟 Rescued data: none. No computer has records that were missing from the cloud.");
  const groups = {};
  list.forEach((x) => {
    (groups[x.coll] = groups[x.coll] || []).push(x);
  });
  const latest = (arr) => {
    const m = new Map();
    arr.forEach((x) => {
      const k = String(x.recordId || x.id);
      const cur = m.get(k);
      if (!cur || (x.savedAt || 0) > (cur.savedAt || 0)) m.set(k, x);
    });
    return Array.from(m.values());
  };
  const drop = (arr) => {
    const ids = new Set(arr.map((x) => String(x.id)));
    setItems((prev) => prev.filter((x) => !ids.has(String(x.id))));
  };
  const download = (name, arr) => {
    try {
      const blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "llqa-rescued-" + String(name).replace(/[^A-Za-z0-9]+/g, "-") + "-" + todayPK() + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Download failed: " + e.message);
    }
  };
  const addNew = (name, arr) => {
    const news = arr.filter((x) => x.kind === "new");
    const store = LLQACloud.collection(name, []);
    store.start();
    const have = new Set((store.data || []).map((r) => String(r && r.id)));
    const add = latest(news).filter((x) => !have.has(String(x.recordId)));
    if (!add.length) {
      alert("Nothing to add — these records are already in " + name + ".");
      drop(news);
      return;
    }
    if (!confirm("Add " + add.length + " record(s) saved on other computers to " + name + "?")) return;
    store.set((prev) => [...prev, ...add.map((x) => x.data)]);
    drop(news);
  };
  const replaceChanged = (name, arr) => {
    const changed = arr.filter((x) => x.kind === "changed");
    const ch = latest(changed);
    if (
      !confirm(
        "Replace " + ch.length + " record(s) in " + name + " with the version saved on that computer?\n\n" +
          "Only do this if that computer has the newest data — the version in the cloud now will be overwritten.",
      )
    )
      return;
    const store = LLQACloud.collection(name, []);
    store.start();
    const repl = new Map(ch.map((x) => [String(x.recordId), x.data]));
    store.set((prev) => prev.map((r) => repl.get(String(r && r.id)) || r));
    drop(changed);
  };
  const useDoc = (path, arr) => {
    const x = latest(arr).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
    if (!x) return;
    if (!confirm("Replace " + path + " with the version saved on computer " + x.device + "?")) return;
    LLQACloud.doc(path, {}).set(x.data);
    drop(arr);
  };
  const discard = (name, arr) => {
    if (
      !confirm(
        "Delete the " + arr.length + " rescued record(s) for " + name + "?\n\nDownload them first if you are not sure.",
      )
    )
      return;
    drop(arr);
  };
  return box([
    React.createElement(
      "div",
      { key: "h", style: { color: c.text, fontWeight: 700, marginBottom: 4 } },
      "🛟 Rescued data (" + list.length + ")",
    ),
    React.createElement(
      "div",
      { key: "i", style: { marginBottom: 6 } },
      "Records that a computer saved while the cloud refused them. Nothing below is in your real lists until you choose.",
    ),
    ...Object.keys(groups)
      .sort()
      .map((name) => {
        const arr = groups[name];
        const nNew = latest(arr.filter((x) => x.kind === "new")).length;
        const nCh = latest(arr.filter((x) => x.kind === "changed")).length;
        const isDoc = arr.every((x) => x.kind === "doc");
        const pcs = new Set(arr.map((x) => x.device)).size;
        const nameOf = (x) => {
          const d = x.data || {};
          return String(d.name || d.studentName || d.title || d.student || d.teacher || "#" + (x.recordId || "?"));
        };
        const shown = latest(arr).slice(0, 6);
        const preview = isDoc
          ? "saved " + new Date(Math.max(...arr.map((x) => x.savedAt || 0))).toLocaleString()
          : shown.map((x) => nameOf(x) + " (" + x.kind + ")").join(", ") +
            (latest(arr).length > shown.length ? ", …" : "");
        return React.createElement(
          "div",
          { key: name, style: { padding: "8px 0", borderBottom: "1px solid " + c.border } },
          React.createElement("div", { style: { color: c.text, fontWeight: 600 } }, name),
          React.createElement(
            "div",
            null,
            (isDoc ? "settings saved on " : (nNew ? nNew + " new · " : "") + (nCh ? nCh + " changed · " : "") + "from ") +
              pcs + " computer" + (pcs === 1 ? "" : "s"),
          ),
          React.createElement("div", { style: { color: c.textMuted, fontSize: 10 } }, preview),
          React.createElement(
            "div",
            null,
            isDoc && llqaSmallBtn("Use this version", () => useDoc(name, arr), c.accent),
            !isDoc && nNew > 0 && llqaSmallBtn("Add " + nNew + " new", () => addNew(name, arr), c.success),
            !isDoc &&
              nCh > 0 &&
              llqaSmallBtn("Replace " + nCh + " changed", () => replaceChanged(name, arr), c.warn),
            llqaSmallBtn("Download", () => download(name, arr)),
            llqaSmallBtn("Discard", () => discard(name, arr), c.danger),
          ),
        );
      }),
  ]);
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
  );
};
