const { useState, useMemo, useEffect } = React;

const {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} = Recharts;

const STATE_TZ = {
  florida: "America/New_York",
  georgia: "America/New_York",
  pennsylvania: "America/New_York",
  "new york": "America/New_York",
  virginia: "America/New_York",
  ohio: "America/New_York",
  "north carolina": "America/New_York",
  "south carolina": "America/New_York",
  "new jersey": "America/New_York",
  massachusetts: "America/New_York",
  maryland: "America/New_York",
  michigan: "America/New_York",
  connecticut: "America/New_York",
  maine: "America/New_York",
  vermont: "America/New_York",
  "new hampshire": "America/New_York",
  "rhode island": "America/New_York",
  delaware: "America/New_York",
  "west virginia": "America/New_York",
  kentucky: "America/New_York",
  indiana: "America/New_York",
  tennessee: "America/New_York",
  "washington dc": "America/New_York",
  texas: "America/Chicago",
  minnesota: "America/Chicago",
  iowa: "America/Chicago",
  illinois: "America/Chicago",
  wisconsin: "America/Chicago",
  missouri: "America/Chicago",
  arkansas: "America/Chicago",
  louisiana: "America/Chicago",
  mississippi: "America/Chicago",
  alabama: "America/Chicago",
  oklahoma: "America/Chicago",
  kansas: "America/Chicago",
  nebraska: "America/Chicago",
  "south dakota": "America/Chicago",
  "north dakota": "America/Chicago",
  colorado: "America/Denver",
  wyoming: "America/Denver",
  montana: "America/Denver",
  "new mexico": "America/Denver",
  utah: "America/Denver",
  idaho: "America/Denver",
  arizona: "America/Phoenix",
  california: "America/Los_Angeles",
  oregon: "America/Los_Angeles",
  washington: "America/Los_Angeles",
  seattle: "America/Los_Angeles",
  nevada: "America/Los_Angeles",
  alaska: "America/Anchorage",
  hawaii: "Pacific/Honolulu",
  toronto: "America/Toronto",
  ontario: "America/Toronto",
  montreal: "America/Toronto",
  quebec: "America/Toronto",
  alberta: "America/Edmonton",
  calgary: "America/Edmonton",
  vancouver: "America/Vancouver",
  "british columbia": "America/Vancouver",
  manitoba: "America/Winnipeg",
  saskatchewan: "America/Regina",
  // v64: places the Add Student form offers but had no timezone
  "district of columbia": "America/New_York",
  "new brunswick": "America/Moncton",
  "nova scotia": "America/Halifax",
  "prince edward island": "America/Halifax",
  newfoundland: "America/St_Johns",
  yukon: "America/Whitehorse",
  "northwest territories": "America/Edmonton",
  nunavut: "America/Iqaluit",
  england: "Europe/London",
  scotland: "Europe/London",
  wales: "Europe/London",
  "northern ireland": "Europe/London",
  "united kingdom": "Europe/London",
  london: "Europe/London",
  manchester: "Europe/London",
  birmingham: "Europe/London",
  liverpool: "Europe/London",
  leeds: "Europe/London",
  glasgow: "Europe/London",
  edinburgh: "Europe/London",
  bristol: "Europe/London",
  sheffield: "Europe/London",
  cardiff: "Europe/London",
  belfast: "Europe/London",
  "abu dhabi": "Asia/Dubai",
  dubai: "Asia/Dubai",
  sharjah: "Asia/Dubai",
  ajman: "Asia/Dubai",
  "umm al quwain": "Asia/Dubai",
  "ras al khaimah": "Asia/Dubai",
  fujairah: "Asia/Dubai",
  "new south wales": "Australia/Sydney",
  queensland: "Australia/Brisbane",
  "western australia": "Australia/Perth",
  "south australia": "Australia/Adelaide",
  tasmania: "Australia/Hobart",
  "australian capital territory": "Australia/Sydney",
  "northern territory": "Australia/Darwin",
};

const COUNTRY_STATES = {
  USA: [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "Washington DC",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  UK: [
    "England",
    "Scotland",
    "Wales",
    "Northern Ireland",
    "London",
    "Manchester",
    "Birmingham",
    "Liverpool",
    "Leeds",
    "Glasgow",
    "Edinburgh",
    "Bristol",
    "Sheffield",
    "Cardiff",
    "Belfast",
  ],
  UAE: [
    "Abu Dhabi",
    "Dubai",
    "Sharjah",
    "Ajman",
    "Umm Al Quwain",
    "Ras Al Khaimah",
    "Fujairah",
  ],
  Australia: [
    "New South Wales",
    "Victoria",
    "Queensland",
    "Western Australia",
    "South Australia",
    "Tasmania",
    "Australian Capital Territory",
    "Northern Territory",
  ],
  Other: [],
};

const detectTZ = (stateOrLoc, timeStr) => {
  const s = String(stateOrLoc || "")
    .toLowerCase()
    .trim();
  // v64: longest match wins, so "New South Wales" is not read as "Wales"
  let best = null;
  for (const k in STATE_TZ) {
    if (s.includes(k) && (!best || k.length > best.length)) best = k;
  }
  if (best) return STATE_TZ[best];
  const t = String(timeStr || "").toLowerCase();
  if (/\b(ca|cst|cdt)\b/.test(t) && !/usa/.test(t)) return "America/Toronto";
  if (/\busa\b|\b(am|pm)\b/.test(t)) return "America/New_York";
  return null;
};

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
  if (h < 1 || h > 12 || mn < 0 || mn > 59) return null;
  if (per === "PM" && h !== 12) h += 12;
  else if (per === "AM" && h === 12) h = 0;
  return {
    hour: h,
    minute: mn,
  };
};

const tzOffsetMinutes = (tz, refDate) => {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = fmt.formatToParts(refDate);
    const tzn = parts.find((p) => p.type === "timeZoneName")?.value || "";
    const m = tzn.match(/GMT([+-]\d+)(?::(\d+))?/);
    if (!m) return 0;
    return (
      parseInt(m[1], 10) * 60 +
      (m[1].startsWith("-") ? -1 : 1) * parseInt(m[2] || "0", 10)
    );
  } catch (e) {
    return 0;
  }
};

const escHTML = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const todayPK = (d) => {
  const t = d || new Date();
  try {
    return t.toLocaleDateString("en-CA", {
      timeZone: "Asia/Karachi",
    });
  } catch (e) {
    return (
      t.getFullYear() +
      "-" +
      String(t.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(t.getDate()).padStart(2, "0")
    );
  }
};

const toPakTime = (timeStr, stateOrLoc) => {
  const parsed = parseUSTime(timeStr);
  if (!parsed) return null;
  const tz = detectTZ(stateOrLoc, timeStr);
  if (!tz) return null;
  try {
    const refDate = new Date();
    const usOffset = tzOffsetMinutes(tz, refDate);
    const pkOffset = tzOffsetMinutes("Asia/Karachi", refDate);
    const diffMin = pkOffset - usOffset;
    const totalMin = parsed.hour * 60 + parsed.minute + diffMin;
    const dayShift = Math.floor(totalMin / 1440);
    let wrapped = ((totalMin % 1440) + 1440) % 1440;
    const ph = Math.floor(wrapped / 60),
      pm = wrapped % 60;
    const period = ph >= 12 ? "PM" : "AM";
    let dh = ph % 12;
    if (dh === 0) dh = 12;
    const dayLabel =
      dayShift === 1
        ? " (+1d)"
        : dayShift === -1
          ? " (prev)"
          : dayShift > 1
            ? " (+" + dayShift + "d)"
            : "";
    return dh + ":" + String(pm).padStart(2, "0") + " " + period + dayLabel;
  } catch (e) {
    return null;
  }
};

const to12h = (s) => {
  if (!s || typeof s !== "string") return s;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return s;
  let h = parseInt(m[1], 10);
  const mn = m[2];
  const period = h >= 12 ? "PM" : "AM";
  let dh = h % 12;
  if (dh === 0) dh = 12;
  return dh + ":" + mn + " " + period;
};

const makeIcon = (kebabName) => {
  const svgInner =
    window.__ICONS__[kebabName] || '<rect x="4" y="4" width="16" height="16"/>';
  return ({ size = 16, color = "currentColor", style, ...props }) =>
    React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      },
      dangerouslySetInnerHTML: {
        __html: svgInner,
      },
      ...props,
    });
};

const Users = makeIcon("users");

const BookOpen = makeIcon("book-open");

const DollarSign = makeIcon("dollar-sign");

const AlertTriangle = makeIcon("alert-triangle");

const Clock = makeIcon("clock");

const Calendar = makeIcon("calendar");

const Settings = makeIcon("settings");

const LayoutDashboard = makeIcon("layout-dashboard");

const Search = makeIcon("search");

const Plus = makeIcon("plus");

const X = makeIcon("x");

const Edit2 = makeIcon("edit-2");

const Trash2 = makeIcon("trash-2");

const Eye = makeIcon("eye");

const Check = makeIcon("check");

const Menu = makeIcon("menu");

const ChevronLeft = makeIcon("chevron-left");

const ChevronRight = makeIcon("chevron-right");

const ChevronDown = makeIcon("chevron-down");

const Video = makeIcon("video");

const Copy = makeIcon("copy");

const ExternalLink = makeIcon("external-link");

const Phone = makeIcon("phone");

const Award = makeIcon("award");

const UserPlus = makeIcon("user-plus");

const CreditCard = makeIcon("credit-card");

const TrendingUp = makeIcon("trending-up");

const Package = makeIcon("package");

const GraduationCap = makeIcon("graduation-cap");

const Briefcase = makeIcon("briefcase");

const Globe = makeIcon("globe");

const MapPin = makeIcon("map-pin");

const ArrowRightLeft = makeIcon("arrow-right-left");

const Star = makeIcon("star");

const Home = makeIcon("home");

const Wifi = makeIcon("wifi");

const Filter = makeIcon("filter");

const Download = makeIcon("download");

const Hash = makeIcon("hash");

const Shield = makeIcon("shield");

const UserCheck = makeIcon("user-check");

const UserX = makeIcon("user-x");

const Coffee = makeIcon("coffee");

const XCircle = makeIcon("x-circle");

const CheckCircle = makeIcon("check-circle");

const Receipt = makeIcon("receipt");

const Target = makeIcon("target");

const BarChart3 = makeIcon("bar-chart-3");

const firebaseConfig = window.__FIREBASE_CONFIG__ || null;

let fb = {
  app: null,
  db: null,
  auth: null,
  storage: null,
  ready: false,
};

const initFirebase = () => {
  if (!firebaseConfig || fb.ready) return fb.ready;
  try {
    fb.app = firebase.initializeApp(firebaseConfig);
    fb.db = firebase.firestore();
    try {
      // v64.2: a field left undefined no longer makes a whole save fail, and
      // networks that block streaming fall back to long-polling by themselves.
      fb.db.settings({
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true,
        merge: true,
      });
    } catch (e) {}
    fb.auth = firebase.auth();
    if (firebase.storage) fb.storage = firebase.storage();
    fb.ready = true;
    console.log("🔥 Firebase connected:", firebaseConfig.projectId);
    return true;
  } catch (e) {
    console.error("Firebase init error:", e);
    return false;
  }
};

const LS_KEY = "llqa_crm_v1::";
// Set when this computer wipes its copy after a full reset: from then until
// the page reloads, nothing is written to this computer or sent to the cloud.
let llqaFrozen = false;

const lsRead = (k, fb) => {
  try {
    const r = localStorage.getItem(LS_KEY + k);
    return r ? JSON.parse(r) : fb;
  } catch (e) {
    return fb;
  }
};

// True only when this computer really has its own saved copy (not built-in defaults).
const lsHas = (k) => {
  try {
    return localStorage.getItem(LS_KEY + k) !== null;
  } catch (e) {
    return false;
  }
};

const lsWrite = (k, v) => {
  if (llqaFrozen) return;
  try {
    localStorage.setItem(LS_KEY + k, JSON.stringify(v));
  } catch (e) {
    console.warn("localStorage write failed for " + k + ":", e.message);
  }
};

/* ============================================================
   LLQA CLOUD SYNC (v64.2)
   • The app signs in to Firebase (anonymous sign-in) before it reads
     or saves; the Firestore rules allow signed-in app users only.
   • One live listener per list: a save on any computer appears on
     every other logged-in computer within seconds. A listener that
     is refused or cut off connects again by itself.
   • A save sends ONLY the records that changed, in batches below
     Firebase's 500-writes limit. Until the cloud confirms it, the
     change is kept on this computer ("pending") and sent again
     automatically — also after a reload or a lost connection.
   • An offline or empty cache never replaces this computer's data.
   • Records that exist only on this computer from before v64.2
     (when saving to the cloud was failing) are copied once to the
     separate "_rescue" collection for the admin to review — nothing
     is merged into the real lists automatically.
   • LLQASync holds the honest status shown by the badge.
   ============================================================ */
const LLQASync = (() => {
  let st = {
    mode: "starting", // starting | local | cloud
    auth: "pending", // pending | ok | failed
    authError: "",
    denied: {}, // list -> true while the cloud refuses to read it
    errors: {}, // list -> other read error
    live: {}, // list -> true once the cloud has answered
    pending: 0, // changes waiting on this computer
    sending: 0, // saves on their way to the cloud
    writeError: "",
    rescued: 0,
  };
  const subs = new Set();
  return {
    get: () => st,
    set: (patch) => {
      const p = typeof patch === "function" ? patch(st) : patch;
      st = { ...st, ...p };
      subs.forEach((f) => {
        try {
          f(st);
        } catch (e) {}
      });
    },
    sub: (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
})();

let fbAuthTry = null;
let fbAuthAt = 0;
const fbSignIn = () => {
  if (!initFirebase() || !fb.auth) return Promise.resolve(false);
  if (fbAuthTry && (LLQASync.get().auth !== "failed" || Date.now() - fbAuthAt < 15000))
    return fbAuthTry;
  fbAuthAt = Date.now();
  fbAuthTry = new Promise((resolve) => {
    let settled = false;
    let off = null;
    const done = (ok, err) => {
      if (settled) return;
      settled = true;
      try {
        if (off) off();
      } catch (e) {}
      LLQASync.set(
        ok
          ? { auth: "ok", authError: "" }
          : { auth: "failed", authError: (err && (err.code || err.message)) || "sign-in failed" },
      );
      resolve(ok);
    };
    try {
      off = fb.auth.onAuthStateChanged((u) => {
        if (u) done(true);
      });
      fb.auth
        .signInAnonymously()
        .then(() => done(true))
        .catch((e) => done(false, e));
      setTimeout(() => done(!!fb.auth.currentUser, { code: "auth/timeout" }), 20000);
    } catch (e) {
      done(false, e);
    }
  });
  return fbAuthTry;
};

// Same text for the same content, whatever order the fields are in.
const llqaStable = (v) => {
  if (v === null || typeof v !== "object") return v === undefined ? "null" : JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(llqaStable).join(",") + "]";
  return (
    "{" +
    Object.keys(v)
      .filter((k) => v[k] !== undefined && typeof v[k] !== "function")
      .sort()
      .map((k) => JSON.stringify(k) + ":" + llqaStable(v[k]))
      .join(",") +
    "}"
  );
};

// Changes this computer made that the cloud has not confirmed yet.
const LLQAPending = (() => {
  const KEY = "llqa_crm_pending_v1";
  let all = null;
  const load = () => {
    if (all) return all;
    try {
      all = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      all = {};
    }
    return all;
  };
  const count = () =>
    Object.keys(load()).reduce((n, k) => n + Object.keys(all[k] || {}).length, 0);
  const save = () => {
    if (llqaFrozen) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("Could not keep unsent changes on this computer:", e.message);
    }
    LLQASync.set({ pending: count() });
  };
  return {
    forget: () => {
      all = {};
    },
    get: (name) => {
      const m = load()[name];
      return m && Object.keys(m).length ? m : null;
    },
    count,
    add: (name, ops) => {
      const a = load();
      const m = (a[name] = a[name] || {});
      ops.forEach((o) => {
        m[o.id] = o.doc;
      });
      save();
    },
    clear: (name) => {
      const a = load();
      if (!a[name]) return;
      delete a[name];
      save();
    },
    done: (name, ops) => {
      const a = load();
      const m = a[name];
      if (!m) return;
      ops.forEach((o) => {
        if (
          Object.prototype.hasOwnProperty.call(m, o.id) &&
          llqaStable(m[o.id]) === llqaStable(o.doc)
        )
          delete m[o.id];
      });
      if (!Object.keys(m).length) delete a[name];
      save();
    },
  };
})();

const LLQACloud = (() => {
  const stores = {};
  const DONE_KEY = "llqa_crm_rescue_done_v1";
  let device = null;
  const deviceId = () => {
    if (device) return device;
    try {
      device = localStorage.getItem("llqa_device_id");
      if (!device) {
        device =
          "PC-" +
          Date.now().toString(36).toUpperCase() +
          "-" +
          Math.random().toString(36).slice(2, 6).toUpperCase();
        localStorage.setItem("llqa_device_id", device);
      }
    } catch (e) {
      device = "PC-UNKNOWN";
    }
    return device;
  };
  const key = (r) => String(r && r.id);
  const byId = (list) => {
    const m = new Map();
    (list || []).forEach((r) => {
      if (r && typeof r === "object") m.set(key(r), r);
    });
    return m;
  };
  // The cloud's records with this computer's unsent changes on top.
  const overlay = (docs, pend) => {
    if (!pend) return docs;
    const m = byId(docs);
    Object.keys(pend).forEach((id) => {
      if (pend[id] === null) m.delete(id);
      else m.set(id, pend[id]);
    });
    const out = [];
    const seen = new Set();
    (docs || []).forEach((d) => {
      const k = key(d);
      if (m.has(k) && !seen.has(k)) {
        out.push(m.get(k));
        seen.add(k);
      }
    });
    m.forEach((v, k) => {
      if (!seen.has(k)) out.push(v);
    });
    return out;
  };
  // A fingerprint of every record, taken when the data arrives. Changes are
  // found by comparing with these fingerprints — not with the live objects —
  // so an edit made directly on a record (before saving) is never missed.
  const sigOf = (list) => {
    const m = new Map();
    (list || []).forEach((r) => {
      if (r && typeof r === "object") m.set(key(r), llqaStable(r));
    });
    return m;
  };
  // Only what really changed: new or edited records, and removed ones.
  const diffOps = (prevSig, next) => {
    const ops = [];
    const seen = new Set();
    (next || []).forEach((r) => {
      if (!r || typeof r !== "object") return;
      const k = key(r);
      if (seen.has(k)) return;
      seen.add(k);
      if (prevSig.get(k) !== llqaStable(r)) ops.push({ id: k, doc: r });
    });
    prevSig.forEach((v, k) => {
      if (!seen.has(k)) ops.push({ id: k, doc: null });
    });
    return ops;
  };
  // Settings documents: only the fields that changed are sent, so two
  // computers saving different fields (e.g. two teachers' attendance) never
  // overwrite each other.
  const DEL = { __llqaDelete: true };
  const isDel = (v) => !!(v && typeof v === "object" && v.__llqaDelete === true);
  const fieldSig = (obj) => {
    const m = new Map();
    if (obj && typeof obj === "object")
      Object.keys(obj).forEach((k) => {
        if (obj[k] !== undefined) m.set(k, llqaStable(obj[k]));
      });
    return m;
  };
  const fieldOps = (prevSig, next) => {
    const ops = [];
    const b = next && typeof next === "object" ? next : {};
    Object.keys(b).forEach((k) => {
      if (b[k] !== undefined && prevSig.get(k) !== llqaStable(b[k])) ops.push({ id: k, doc: b[k] });
    });
    prevSig.forEach((v, k) => {
      if (!(k in b) || b[k] === undefined) ops.push({ id: k, doc: DEL });
    });
    return ops;
  };
  const applyFields = (base, pend) => {
    const out = { ...(base && typeof base === "object" ? base : {}) };
    if (pend)
      Object.keys(pend).forEach((k) => {
        if (isDel(pend[k])) delete out[k];
        else out[k] = pend[k];
      });
    return out;
  };
  // Lists the automatic background updates may rely on: loaded from the
  // cloud in this session (or the app runs without a cloud at all).
  const ready = (name) => {
    if (!firebaseConfig || LLQASync.get().mode === "local") return true;
    const s = stores[name];
    return !!(s && s.server);
  };
  const doneMap = () => {
    try {
      return JSON.parse(localStorage.getItem(DONE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  };
  const markChecked = (name) => {
    if (llqaFrozen) return;
    try {
      const d = doneMap();
      d[name] = Date.now();
      localStorage.setItem(DONE_KEY, JSON.stringify(d));
    } catch (e) {}
  };
  const agent = () =>
    String((typeof navigator !== "undefined" && navigator.userAgent) || "").slice(0, 160);
  // When the cloud first worked again (written once by the first computer).
  // The rescue check only runs in the 14 days after it: a computer that
  // first opens much later just has an old copy, not unsent work.
  const RESCUE_DAYS = 14;
  let restoredP = null;
  const restoredAt = () => {
    if (restoredP) return restoredP;
    restoredP = (async () => {
      try {
        await fbSignIn();
        const ref = fb.db.collection("_meta").doc("sync");
        const snap = await ref.get();
        const v = snap && snap.exists && snap.data() && snap.data().restoredAt;
        if (v) return Number(v);
        const now = Date.now();
        await ref.set({ restoredAt: now }, { merge: true });
        return now;
      } catch (e) {
        restoredP = null;
        return Date.now();
      }
    })();
    return restoredP;
  };
  const rescueWindowOpen = () =>
    restoredAt().then((at) => Date.now() - at <= RESCUE_DAYS * 86400000);

  // ---------- full reset ("start from zero") ----------
  // _meta/sync.epoch changes when all CRM data is reset. A computer whose
  // copy is from before the reset wipes it (lists, waiting changes, rescue
  // state) and reloads — nothing old is shown, rescued or sent again.
  // Nothing is read or sent until this check has passed.
  const EPOCH_KEY = "llqa_crm_epoch_v1";
  const hadLocalAtStart = (() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.indexOf(LS_KEY) === 0 || k === "llqa_crm_pending_v1")) return true;
      }
    } catch (e) {}
    return false;
  })();
  let epochOk = false;
  let epochWaiters = [];
  let epochWatching = false;
  const wipeLocal = () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.indexOf(LS_KEY) === 0 || k === "llqa_crm_pending_v1" || k === "llqa_crm_rescue_done_v1")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  };
  const passEpoch = () => {
    if (epochOk) return;
    epochOk = true;
    const w = epochWaiters;
    epochWaiters = [];
    w.forEach((r) => r(true));
  };
  const watchEpoch = async () => {
    if (epochWatching) return;
    epochWatching = true;
    await fbSignIn();
    const onSnap = (snap) => {
      if (snap.metadata && snap.metadata.fromCache) return;
      markLive("reset-check");
      const cloud = (snap.exists && snap.data() && snap.data().epoch) || "";
      let mine = null;
      try {
        mine = localStorage.getItem(EPOCH_KEY);
      } catch (e) {}
      if (cloud && mine !== cloud) {
        if (mine === null && !hadLocalAtStart) {
          try {
            localStorage.setItem(EPOCH_KEY, cloud); // a new computer: nothing old here
          } catch (e) {}
        } else {
          llqaFrozen = true;
          LLQAPending.forget();
          wipeLocal();
          try {
            localStorage.setItem(EPOCH_KEY, cloud);
          } catch (e) {}
          console.warn("All CRM data was reset — this computer's old copy was cleared.");
          try {
            location.reload();
          } catch (e) {}
          return; // never pass: nothing old may be sent before the reload
        }
      }
      passEpoch();
    };
    const listenEpoch = async () => {
      await fbSignIn();
      try {
        fb.db
          .collection("_meta")
          .doc("sync")
          .onSnapshot(onSnap, (err) => {
            markError("reset-check", err);
            setTimeout(listenEpoch, 30000);
          });
      } catch (e) {
        setTimeout(listenEpoch, 30000);
      }
    };
    listenEpoch();
  };
  const epochReady = () => {
    if (epochOk) return Promise.resolve(true);
    if (!initFirebase()) {
      passEpoch();
      return Promise.resolve(true);
    }
    watchEpoch();
    return new Promise((r) => epochWaiters.push(r));
  };

  // Send writes in batches of 400 (Firebase allows at most 500 per batch).
  const send = async (coll, ops, track) => {
    if (!ops.length) return true;
    if (!initFirebase()) return false;
    await fbSignIn();
    await epochReady();
    if (llqaFrozen) return false;
    LLQASync.set((s) => ({ sending: s.sending + 1 }));
    try {
      for (let i = 0; i < ops.length; i += 400) {
        const part = ops.slice(i, i + 400);
        const b = fb.db.batch();
        part.forEach((o) => {
          const ref = fb.db.collection(coll).doc(o.id);
          if (o.doc === null) b.delete(ref);
          else b.set(ref, o.doc, { merge: true });
        });
        await b.commit();
        if (track) LLQAPending.done(track, part);
      }
      LLQASync.set({ writeError: "" });
      return true;
    } catch (e) {
      console.error("Cloud save failed (" + coll + "):", e);
      LLQASync.set({ writeError: (e && (e.code || e.message)) || "save failed" });
      return false;
    } finally {
      LLQASync.set((s) => ({ sending: Math.max(0, s.sending - 1) }));
    }
  };
  const rescueSend = (name, found, kindOf) => {
    const now = Date.now();
    const dev = deviceId();
    return send(
      "_rescue",
      found.map((f) => ({
        id: (dev + "__" + name + "__" + (f.r && f.r.id != null ? key(f.r) : "doc"))
          .replace(/\//g, "_")
          .slice(0, 600),
        doc: {
          device: dev,
          coll: name,
          recordId: f.r && f.r.id != null ? key(f.r) : "",
          kind: kindOf || f.kind,
          data: f.r,
          savedAt: now,
          agent: agent(),
        },
      })),
      null,
    ).then((ok) => {
      if (ok) LLQASync.set((s) => ({ rescued: s.rescued + found.length }));
      return ok;
    });
  };
  const markLive = (name) =>
    LLQASync.set((st) => {
      const denied = { ...st.denied };
      delete denied[name];
      const errors = { ...st.errors };
      delete errors[name];
      return { mode: "cloud", denied, errors, live: { ...st.live, [name]: true } };
    });
  const markError = (name, err) => {
    const code = (err && err.code) || "";
    LLQASync.set((st) =>
      code === "permission-denied"
        ? { denied: { ...st.denied, [name]: true } }
        : { errors: { ...st.errors, [name]: code || String((err && err.message) || err) } },
    );
  };

  // A live list (Firestore collection) shared by every screen.
  const collection = (name, fallback) => {
    if (stores[name]) return stores[name];
    const s = {
      name,
      data: overlay(lsRead(name, fallback || []), LLQAPending.get(name)),
      loading: true,
      error: null,
      subs: new Set(),
      started: false,
      server: false,
      tries: 0,
      busy: 0,
      timer: null,
    };
    stores[name] = s;
    s.sig = sigOf(s.data);
    // this computer's own copy before the cloud answers (none on a new computer)
    const local0 = lsHas(name) ? s.data : [];
    const emit = () =>
      s.subs.forEach((f) => {
        try {
          f();
        } catch (e) {}
      });
    const show = (list) => {
      s.data = list;
      s.sig = sigOf(list);
      lsWrite(name, list);
      emit();
    };
    const sendTracked = async (ops) => {
      s.busy++;
      try {
        return await send(name, ops, name);
      } finally {
        s.busy--;
      }
    };
    s.replay = async () => {
      const pend = LLQAPending.get(name);
      if (!pend || s.busy) return;
      await sendTracked(Object.keys(pend).map((id) => ({ id, doc: pend[id] })));
    };
    const rescueOnce = (docs) => {
      if (doneMap()[name]) return;
      // what is waiting right now is sent anyway — note it before it goes
      const pendAtStart = { ...(LLQAPending.get(name) || {}) };
      rescueWindowOpen().then((open) => {
        if (open) rescueCheck(docs, pendAtStart);
        else markChecked(name);
      });
    };
    const rescueCheck = (docs, pend) => {
      const cloud = byId(docs);
      const found = [];
      (local0 || []).forEach((r) => {
        if (!r || typeof r !== "object") return;
        const k = key(r);
        if (Object.prototype.hasOwnProperty.call(pend, k)) return; // sent anyway
        const cr = cloud.get(k);
        if (!cr) found.push({ kind: "new", r });
        else if (llqaStable(cr) !== llqaStable(r)) found.push({ kind: "changed", r });
      });
      if (!found.length) return markChecked(name);
      rescueSend(name, found).then((ok) => {
        if (ok) markChecked(name);
      });
    };
    const onSnap = (snap) => {
      const fromCache = !!(snap.metadata && snap.metadata.fromCache);
      if (fromCache && !s.server) return; // never let an offline cache replace this computer's data
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const first = !s.server;
      if (!fromCache) s.server = true;
      s.tries = 0;
      s.loading = false;
      s.error = null;
      markLive(name);
      if (first) {
        if (docs.length === 0 && (fallback || []).length > 0 && !LLQAPending.get(name)) {
          send(name, fallback.map((r) => ({ id: key(r), doc: r })), null);
          show(fallback);
          return;
        }
        rescueOnce(docs);
      }
      show(overlay(docs, LLQAPending.get(name)));
      if (LLQAPending.get(name)) s.replay();
    };
    const listen = async () => {
      s.timer = null;
      await fbSignIn();
      await epochReady();
      try {
        s.unsub = fb.db.collection(name).onSnapshot(onSnap, onErr);
      } catch (e) {
        onErr(e);
      }
    };
    const onErr = (err) => {
      console.error("Firestore error (" + name + "):", err);
      s.loading = false;
      s.error = err;
      markError(name, err);
      emit();
      // 15 s, 30 s, 1 min, 2 min, 4 min, then every 5 min (a refused try can count as a read)
      const wait = Math.min(300000, 15000 * Math.pow(2, s.tries++));
      s.timer = setTimeout(listen, wait);
    };
    s.reconnect = () => {
      if (!s.timer) return;
      clearTimeout(s.timer);
      s.tries = 0;
      listen();
    };
    s.start = () => {
      if (s.started) return;
      s.started = true;
      if (!initFirebase()) {
        s.loading = false;
        LLQASync.set({ mode: "local" });
        emit();
        return;
      }
      heartbeat();
      listen();
    };
    s.set = async (v) => {
      if (llqaFrozen) return;
      const prevSig = s.sig;
      const next = typeof v === "function" ? v(s.data) : v;
      if (!Array.isArray(next)) {
        console.error("Save ignored for " + name + ": not a list", next);
        return;
      }
      show(next);
      if (!initFirebase()) return;
      const ops = diffOps(prevSig, next);
      if (!ops.length) return;
      LLQAPending.add(name, ops);
      await sendTracked(ops);
    };
    s.subscribe = (f) => {
      s.subs.add(f);
      return () => s.subs.delete(f);
    };
    return s;
  };

  // A single live document (settings, attendance history). Saves send only
  // the fields that changed; the waiting fields are kept per field.
  const doc = (path, fallback) => {
    const id = "doc:" + path;
    const pid = "docp:" + path;
    if (stores[id]) return stores[id];
    // v64.2 kept the whole document as "waiting"; the rescue check below
    // covers those edits, so the old entry is cleared instead of re-sent.
    if (LLQAPending.get(id)) LLQAPending.clear(id);
    const [coll, docId] = path.split("/");
    const base0 = lsRead(path, fallback || {});
    const own0 = lsHas(path) ? base0 : null; // built-in defaults are not "this computer's data"
    const s = {
      path,
      data: applyFields(base0, LLQAPending.get(pid)),
      loading: true,
      subs: new Set(),
      started: false,
      server: false,
      tries: 0,
      busy: 0,
      timer: null,
    };
    s.sig = fieldSig(s.data);
    stores[id] = s;
    const emit = () =>
      s.subs.forEach((f) => {
        try {
          f();
        } catch (e) {}
      });
    const show = (v) => {
      s.data = v;
      s.sig = fieldSig(v);
      lsWrite(path, v);
      emit();
    };
    const sendFields = async (ops) => {
      if (!ops.length) return true;
      if (!initFirebase()) return false;
      await fbSignIn();
      await epochReady();
      if (llqaFrozen) return false;
      s.busy++;
      LLQASync.set((st) => ({ sending: st.sending + 1 }));
      try {
        const patch = {};
        ops.forEach((o) => {
          patch[o.id] = isDel(o.doc) ? firebase.firestore.FieldValue.delete() : o.doc;
        });
        await fb.db.collection(coll).doc(docId).set(patch, { merge: true });
        LLQAPending.done(pid, ops);
        LLQASync.set({ writeError: "" });
        return true;
      } catch (e) {
        console.error("Cloud save failed (" + path + "):", e);
        LLQASync.set({ writeError: (e && (e.code || e.message)) || "save failed" });
        return false;
      } finally {
        s.busy--;
        LLQASync.set((st) => ({ sending: Math.max(0, st.sending - 1) }));
      }
    };
    s.replay = async () => {
      const pend = LLQAPending.get(pid);
      if (!pend || s.busy) return;
      await sendFields(Object.keys(pend).map((k) => ({ id: k, doc: pend[k] })));
    };
    const hasData = (v) => v && typeof v === "object" && Object.keys(v).length > 0;
    const without = (o, pend) => {
      const out = { ...(o || {}) };
      Object.keys(pend || {}).forEach((k) => delete out[k]);
      return out;
    };
    const onSnap = (snap) => {
      const fromCache = !!(snap.metadata && snap.metadata.fromCache);
      if (fromCache && !s.server) return;
      const first = !s.server;
      if (!fromCache) s.server = true;
      s.tries = 0;
      s.loading = false;
      markLive(id);
      const pend = LLQAPending.get(pid);
      if (snap.exists) {
        const v = snap.data() || {};
        if (first && !doneMap()[id]) {
          const mine = without(own0, pend);
          if (own0 && hasData(mine) && llqaStable(mine) !== llqaStable(without(v, pend)))
            rescueWindowOpen().then((open) => {
              if (!open) return markChecked(id);
              rescueSend(path, [{ r: base0 }], "doc").then((ok) => {
                if (ok) markChecked(id);
              });
            });
          else markChecked(id);
        }
        show(applyFields(v, pend));
      } else if (hasData(fallback) || hasData(base0) || pend) {
        // Nothing in the cloud yet: start it from this computer's copy.
        const seed = applyFields(hasData(base0) ? base0 : fallback, pend);
        if (first) markChecked(id);
        const ops = fieldOps(new Map(), seed);
        LLQAPending.add(pid, ops);
        show(seed);
        sendFields(ops);
        return;
      } else {
        emit();
      }
      if (pend) s.replay();
    };
    const listen = async () => {
      s.timer = null;
      await fbSignIn();
      await epochReady();
      try {
        s.unsub = fb.db.collection(coll).doc(docId).onSnapshot(onSnap, onErr);
      } catch (e) {
        onErr(e);
      }
    };
    const onErr = (err) => {
      console.error("Firestore error (" + path + "):", err);
      s.loading = false;
      markError(id, err);
      emit();
      // 15 s, 30 s, 1 min, 2 min, 4 min, then every 5 min (a refused try can count as a read)
      const wait = Math.min(300000, 15000 * Math.pow(2, s.tries++));
      s.timer = setTimeout(listen, wait);
    };
    s.reconnect = () => {
      if (!s.timer) return;
      clearTimeout(s.timer);
      s.tries = 0;
      listen();
    };
    s.start = () => {
      if (s.started) return;
      s.started = true;
      if (!initFirebase()) {
        s.loading = false;
        LLQASync.set({ mode: "local" });
        emit();
        return;
      }
      heartbeat();
      listen();
    };
    s.set = async (v) => {
      if (llqaFrozen) return;
      const prevSig = s.sig;
      const next = typeof v === "function" ? v(s.data) : v;
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        console.error("Save ignored for " + path + ": not a document", next);
        return;
      }
      const ops = fieldOps(prevSig, next);
      show(next);
      if (!ops.length || !initFirebase()) return;
      LLQAPending.add(pid, ops);
      await sendFields(ops);
    };
    s.subscribe = (f) => {
      s.subs.add(f);
      return () => s.subs.delete(f);
    };
    return s;
  };

  // Every minute (and when the internet comes back) send what is waiting.
  let beat = null;
  const replayAll = () =>
    Object.keys(stores).forEach((k) => {
      const s = stores[k];
      if (s.server && s.replay) s.replay();
    });
  const heartbeat = () => {
    if (beat) return;
    beat = setInterval(replayAll, 60000);
    try {
      window.addEventListener("online", () => {
        setTimeout(() => {
          retryNow();
        }, 1500);
      });
    } catch (e) {}
  };
  const retryNow = () => {
    Object.keys(stores).forEach((k) => {
      if (stores[k].reconnect) stores[k].reconnect();
    });
    replayAll();
  };
  return { collection, doc, deviceId, retryNow, ready, epochReady, stores: () => stores };
})();

const useFirestoreCollection = (collectionName, fallbackData = []) => {
  const store = LLQACloud.collection(collectionName, fallbackData);
  const [, bump] = useState(0);
  useEffect(() => {
    const off = store.subscribe(() => bump((n) => n + 1));
    store.start();
    return off;
  }, [collectionName]);
  return [store.data, store.set, store.loading, store.error];
};

const useFirestoreDoc = (path, fallbackData = {}) => {
  const store = LLQACloud.doc(path, fallbackData);
  const [, bump] = useState(0);
  useEffect(() => {
    const off = store.subscribe(() => bump((n) => n + 1));
    store.start();
    return off;
  }, [path]);
  return [store.data, store.set, store.loading];
};

const pushAuditLog = async (entry) => {
  if (!initFirebase()) {
    LOGIN_AUDIT.unshift({
      ...entry,
      id: Date.now(),
    });
    return;
  }
  try {
    await fbSignIn();
    await LLQACloud.epochReady();
    await fb.db.collection("loginAudit").add({
      ...entry,
      serverTime: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Audit log:", e);
  }
};

const useConnectionStatus = () => {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [sync, setSync] = useState(LLQASync.get());
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const off = LLQASync.sub((s) => setSync(s));
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      off();
    };
  }, []);
  return {
    online,
    fbReady: fb.ready,
    synced: !sync.pending && !sync.sending,
    sync,
  };
};


const c = {
  bg: "var(--bg)",
  bgCard: "var(--bgCard)",
  bgDeep: "var(--bgDeep)",
  bgHover: "var(--bgHover)",
  bgInput: "var(--bgInput)",
  border: "var(--border)",
  borderLight: "var(--borderLight)",
  text: "var(--text)",
  textSec: "var(--textSec)",
  textMuted: "var(--textMuted)",
  accent: "var(--accent)",
  accentBg: "var(--accentBg)",
  accentText: "var(--accentText)",
  accentBorder: "var(--accentBorder)",
  purpleText: "var(--purpleText)",
  cyanText: "var(--cyanText)",
  warnText: "var(--warnText)",
  success: "var(--success)",
  successBg: "var(--successBg)",
  warn: "var(--warn)",
  warnBg: "var(--warnBg)",
  danger: "var(--danger)",
  dangerBg: "var(--dangerBg)",
  purple: "var(--purple)",
  purpleBg: "var(--purpleBg)",
  purpleText: "var(--purpleText)",
  cyan: "var(--cyan)",
  cyanBg: "var(--cyanBg)",
  cyanText: "var(--cyanText)",
  warnText: "var(--warnText)",
  gradientPrimary: "var(--gradientPrimary)",
  glowPrimary: "var(--glowPrimary)",
  shadow3d: "var(--shadow3d)",
};

const CC = [
  "#4a7aff",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const initTeachers = [];

const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Annual Leave",
  "Ramadan Leave",
  "Emergency Leave",
  "Maternity Leave",
];

const revData = [];

const courseDistro = [];

const enrollData = [];

const computeFree = (tx) => {
  let tShift = tx.shift || "Night";
  let baseSched = null;
  for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
    const found = (TT_DATA[sh].teachers || []).find(
      (x) => x.name === tx.name || x.code === tx.code,
    );
    if (found) {
      tShift = sh;
      baseSched = found.schedule || {};
      break;
    }
  }
  if (!TT_DATA[tShift])
    return {
      free: 0,
      total: 0,
    };
  const slots = TT_DATA[tShift].slots || [];
  const days =
    tShift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const overlay = tx._ttSchedule || null;
  let free = 0,
    total = 0;
  days.forEach((day) => {
    slots.forEach((slot) => {
      total++;
      const baseVal = baseSched ? (baseSched[day] || {})[slot] : undefined;
      const ovrVal = overlay ? (overlay[day] || {})[slot] : undefined;
      const effective = ovrVal !== undefined ? ovrVal : baseVal;
      if (!effective || effective === "F") free++;
    });
  });
  return {
    free: free,
    total: total,
  };
};

const TT_DATA = {
  Morning: {
    slots: [
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
    ],
    teachers: [],
  },
  Evening: {
    slots: [
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
      "22:00",
      "22:30",
      "23:00",
      "23:30",
    ],
    teachers: [],
  },
  Night: {
    slots: [
      "00:00",
      "00:30",
      "01:00",
      "01:30",
      "02:00",
      "02:30",
      "03:00",
      "03:30",
      "04:00",
      "04:30",
      "05:00",
      "05:30",
      "06:00",
      "06:30",
      "07:00",
      "07:30",
    ],
    teachers: [],
  },
  Weekend: {
    slots: [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
    ],
    teachers: [],
  },
};

const BEHAV_OPTS = [
  "Excellent",
  "Good",
  "Needs Improvement",
  "Disruptive",
  "Restless/Distracted",
];

const PERF_OPTS = [
  "Outstanding",
  "Very Good",
  "Satisfactory",
  "Below Average",
  "Struggling",
];

const HW_OPTS = ["Completed", "Partially Done", "Not Done", "Not Assigned"];

const RECIT_OPTS = [
  "Fluent & Clear",
  "Good with Minor Errors",
  "Needs Practice",
  "Struggling",
  "N/A",
];

const TAJ_OPTS = [
  "Excellent Tajweed",
  "Good - Few Mistakes",
  "Learning Rules",
  "Not Applying",
  "N/A",
];

const ATT_OPTS = ["Present", "Absent", "Late", "Excused"];

const SLEAVE = [
  "Ramadan Leave",
  "Vacation",
  "Sick",
  "Family Emergency",
  "Schedule Change",
  "Financial Hold",
  "Other",
];

const initStudents = [];

const SHIFT_REASONS = [
  "Teacher Resigned",
  "Teacher Terminated",
  "Teacher on Leave",
  "Teacher Sick Leave",
  "Ramadan Time Change",
  "Time Change Request",
  "Parent Request",
  "Student Request",
  "Performance Issue",
  "Teacher Female Only",
  "Camera Class Required",
  "Age Mismatch",
  "ADHD Special Needs",
  "Schedule Conflict",
  "Other",
];

const FEEDBACK_OPTS = [
  "Pending",
  "Satisfied",
  "Not Satisfied",
  "On Hold",
  "Needs Follow-up",
  "Resolved",
];

const SPS_OPTS = ["Pending", "Conveyed", "Not Required"];

const initShifts = [];

const SUBJ_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
];

const SUBJ_TEACHERS_DATA = [];

const ALL_SUBJECTS = [
  "Biology",
  "Chemistry",
  "Physics",
  "English",
  "Math",
  "Science",
  "Coding",
];

const ALL_GRADES = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
];

const ATT_STATUS = [
  "Present",
  "Late",
  "Absent",
  "On Leave",
  "Half Day",
  "Holiday",
];

const FINE_RULES = {
  late10: 100,
  late30: 250,
  late60: 500,
  absent: 1500,
  halfDay: 750,
  earlyLeave: 200,
  missedClass: 500,
};

const SHIFTS_ATT = ["Morning", "Evening", "Night", "Subject"];

const genAttData = () => {
  const teachers = [
    {
      id: 1,
      name: "Hafiz Faizan Mughal",
      code: "0731",
      shift: "Night",
      salary: 35000,
    },
    {
      id: 2,
      name: "Hafiz Ali Saeed",
      code: "3186",
      shift: "Night",
      salary: 32000,
    },
    {
      id: 3,
      name: "Asim",
      code: "0341",
      shift: "Night",
      salary: 38000,
    },
    {
      id: 4,
      name: "Hafiz Amanullah",
      code: "0872",
      shift: "Night",
      salary: 36000,
    },
    {
      id: 5,
      name: "Qari Faizan Khan",
      code: "6285",
      shift: "Night",
      salary: 42000,
    },
    {
      id: 6,
      name: "Farhan Awan",
      code: "0101",
      shift: "Night",
      salary: 40000,
    },
    {
      id: 7,
      name: "Qari Haris Khan",
      code: "4459",
      shift: "Evening",
      salary: 37000,
    },
    {
      id: 8,
      name: "Qari Hussnain",
      code: "0353",
      shift: "Night",
      salary: 28000,
    },
    {
      id: 9,
      name: "Qari Muhammad Nadeem",
      code: "7346",
      shift: "Night",
      salary: 40000,
    },
    {
      id: 10,
      name: "Hafiz Osama",
      code: "5867",
      shift: "Evening",
      salary: 35000,
    },
    {
      id: 11,
      name: "Saifullah",
      code: "1562",
      shift: "Night",
      salary: 42000,
    },
    {
      id: 12,
      name: "Hafiz Suleman",
      code: "7834",
      shift: "Morning",
      salary: 34000,
    },
    {
      id: 13,
      name: "Hafiz Tayyab",
      code: "0074",
      shift: "Night",
      salary: 39000,
    },
    {
      id: 14,
      name: "Hafiz Uzair",
      code: "3102",
      shift: "Night",
      salary: 36000,
    },
    {
      id: 15,
      name: "Hafiz Waqas Arshad",
      code: "2468",
      shift: "Morning",
      salary: 48000,
    },
    {
      id: 16,
      name: "Hafiz Abdullah ATD",
      code: "9482",
      shift: "Morning",
      salary: 40000,
    },
    {
      id: 17,
      name: "Hafiz Abu Bakar",
      code: "2377",
      shift: "Evening",
      salary: 38000,
    },
    {
      id: 18,
      name: "Qari Awais",
      code: "6282",
      shift: "Night",
      salary: 35000,
    },
    {
      id: 19,
      name: "Qaria Arooj Zareen",
      code: "9160",
      shift: "Night",
      salary: 38000,
    },
    {
      id: 20,
      name: "Qaria Esha",
      code: "3325",
      shift: "Evening",
      salary: 28000,
    },
    {
      id: 21,
      name: "Qaria Madiha",
      code: "0676",
      shift: "Night",
      salary: 40000,
    },
    {
      id: 22,
      name: "Qaria Najma Noor",
      code: "1093",
      shift: "Night",
      salary: 36000,
    },
    {
      id: 23,
      name: "Qaria Nida Aman",
      code: "0564",
      shift: "Night",
      salary: 37000,
    },
    {
      id: 24,
      name: "Qaria Saba Noor",
      code: "1175",
      shift: "Night",
      salary: 34000,
    },
    {
      id: 25,
      name: "Qaria Swera",
      code: "7322",
      shift: "Night",
      salary: 34000,
    },
    {
      id: 26,
      name: "Hafiza Atikah",
      code: "2491",
      shift: "Night",
      salary: 36000,
    },
    {
      id: 27,
      name: "Huma",
      code: "6934",
      shift: "Night",
      salary: 34000,
    },
    {
      id: 28,
      name: "Qaria Kanwal",
      code: "7111",
      shift: "Night",
      salary: 38000,
    },
    {
      id: 29,
      name: "Hafiza Momina Akbar",
      code: "5719",
      shift: "Night",
      salary: 35000,
    },
    {
      id: 30,
      name: "Qaria Nida Sarwar",
      code: "5891",
      shift: "Night",
      salary: 40000,
    },
    {
      id: 31,
      name: "Hafiza Samya",
      code: "5561",
      shift: "Night",
      salary: 35000,
    },
    {
      id: 32,
      name: "Hafiza Saqeela Satti",
      code: "9610",
      shift: "Night",
      salary: 42000,
    },
    {
      id: 33,
      name: "Qaria Shaista",
      code: "5756",
      shift: "Night",
      salary: 44000,
    },
    {
      id: 34,
      name: "Ms. Ayesha",
      code: "5746",
      shift: "Subject",
      salary: 38000,
    },
    {
      id: 35,
      name: "Ms. Bushra",
      code: "6927",
      shift: "Subject",
      salary: 36000,
    },
    {
      id: 36,
      name: "Ms. Fauzia",
      code: "2849",
      shift: "Subject",
      salary: 38000,
    },
    {
      id: 37,
      name: "Ms. Filza Tariq",
      code: "5789",
      shift: "Subject",
      salary: 40000,
    },
    {
      id: 38,
      name: "Ms. Sundas",
      code: "0435",
      shift: "Subject",
      salary: 34000,
    },
  ];
  return teachers;
};

const initAttTeachers = [];

const genHistory = (teachers) => {
  const today = new Date();
  const hist = {};
  teachers.forEach((t) => {
    hist[t.id] = [];
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const day = date.getDay();
      const dateStr = todayPK(date);
      let status = "Present",
        checkIn = "",
        checkOut = "",
        lateMin = 0,
        fine = 0,
        device = "Web",
        ip =
          "182.178." +
          Math.floor(Math.random() * 255) +
          "." +
          Math.floor(Math.random() * 255);
      const r = Math.random();
      if (r < 0.04) {
        status = "Absent";
        fine = FINE_RULES.absent;
        checkIn = "—";
        checkOut = "—";
      } else if (r < 0.1) {
        status = "Late";
        lateMin = Math.floor(Math.random() * 45) + 5;
        fine =
          lateMin > 30
            ? FINE_RULES.late30
            : lateMin > 10
              ? FINE_RULES.late10
              : 0;
        const sm =
          t.shift === "Morning"
            ? 8
            : t.shift === "Evening"
              ? 16
              : t.shift === "Night"
                ? 0
                : 10;
        checkIn =
          String(sm).padStart(2, "0") + ":" + String(lateMin).padStart(2, "0");
        checkOut = String((sm + 8) % 24).padStart(2, "0") + ":00";
      } else if (r < 0.13) {
        status = "On Leave";
        checkIn = "—";
        checkOut = "—";
      } else if (r < 0.14) {
        status = "Half Day";
        fine = FINE_RULES.halfDay;
        const sm =
          t.shift === "Morning"
            ? 8
            : t.shift === "Evening"
              ? 16
              : t.shift === "Night"
                ? 0
                : 10;
        checkIn = String(sm).padStart(2, "0") + ":05";
        checkOut = String((sm + 4) % 24).padStart(2, "0") + ":00";
      } else {
        const sm =
          t.shift === "Morning"
            ? 8
            : t.shift === "Evening"
              ? 16
              : t.shift === "Night"
                ? 0
                : 10;
        const startMin = Math.floor(Math.random() * 5);
        checkIn =
          String(sm).padStart(2, "0") + ":" + String(startMin).padStart(2, "0");
        checkOut =
          String((sm + 8) % 24).padStart(2, "0") +
          ":" +
          String(Math.floor(Math.random() * 15)).padStart(2, "0");
      }
      hist[t.id].push({
        date: dateStr,
        status,
        checkIn,
        checkOut,
        lateMin,
        fine,
        device,
        ip,
        approved: true,
      });
    }
  });
  return hist;
};

const initAttHist = {};

const PAY_METHODS = [
  "JazzCash",
  "EasyPaisa",
  "HBL Bank",
  "Meezan Bank",
  "UBL Bank",
  "Cash",
];

const BONUS_TYPES = [
  "Performance",
  "Tenure",
  "Attendance",
  "Eid",
  "Festival",
  "Overtime",
  "Special",
];

const DEDUCTION_TYPES = [
  "Attendance Fines",
  "Advance Salary",
  "Loan Installment",
  "Tax",
  "Insurance",
  "Other",
];

const initPayrollTeachers = [];

const tenureYears = (joinDate) => {
  const y = Math.floor(
    (new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 365),
  );
  return y;
};

const calcBonuses = (t) => {
  const tenure = tenureYears(t.joinDate);
  const tenureBonus =
    tenure >= 3 ? 3000 : tenure >= 2 ? 2000 : tenure >= 1 ? 1000 : 0;
  const perfBonus =
    t.rating >= 4.5
      ? 3000
      : t.rating >= 4.2
        ? 2000
        : t.rating >= 4.0
          ? 1000
          : 0;
  const studBonus = t.students >= 12 ? 2000 : t.students >= 8 ? 1000 : 0;
  return {
    tenure: tenureBonus,
    performance: perfBonus,
    students: studBonus,
    total: tenureBonus + perfBonus + studBonus,
  };
};

const genPayHistory = () => {
  const hist = {};
  initPayrollTeachers.forEach((t) => {
    hist[t.id] = [];
    const b = calcBonuses(t);
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const month = d.toISOString().substring(0, 7);
      const fine = Math.floor(Math.random() * 4) * 500;
      const advance = m === 0 && Math.random() < 0.2 ? 5000 : 0;
      const tax = t.salary > 40000 ? Math.floor(t.salary * 0.05) : 0;
      const gross = t.salary + b.total;
      const deductions = fine + advance + tax;
      const net = gross - deductions;
      const status =
        m === 0 ? (Math.random() < 0.6 ? "pending" : "approved") : "paid";
      hist[t.id].push({
        month,
        baseSalary: t.salary,
        bonuses: b.total,
        bonusBreakdown: b,
        fine,
        advance,
        tax,
        deductions,
        gross,
        net,
        status,
        paidDate:
          m === 0
            ? null
            : todayPK(
                new Date(
                  d.getFullYear(),
                  d.getMonth(),
                  d.getDate() + Math.floor(Math.random() * 5) + 1,
                ),
              ),
        paymentMethod: m === 0 ? null : t.bank.split(" - ")[0],
        approvedBy: m === 0 ? null : "Super Admin",
        attPct: 85 + Math.floor(Math.random() * 15),
      });
    }
  });
  return hist;
};

const initPayHistory = [];

const FEE_PLANS = {
  Quran: 45,
  "EN-Quaida": 30,
  "Quran with Tajweed": 50,
  "Quran-Memo": 70,
  "Saudi Quran": 55,
  "Quran+Memo+Islamic Ed": 80,
  "Eng/Noorani Quaida": 35,
  "Quran-Taj": 50,
  Subject: 50,
};

const PAY_GATEWAYS = [
  "PayPal",
  "Wise",
  "Zelle",
  "Bank Transfer",
  "Western Union",
  "Cash",
];

const EXPENSE_CATS = [
  "Teacher Salaries",
  "Rent & Utilities",
  "Internet & Phone",
  "Marketing",
  "Software",
  "Admin Staff",
  "Equipment",
  "Gateway Fees",
  "Travel",
  "Miscellaneous",
];

const INCOME_CATS = [
  "Monthly Fees",
  "Registration",
  "Certificate",
  "Donation",
  "Other",
];

const CURRENCIES = ["USD", "CAD", "GBP", "PKR"];

const EXCHANGE_RATE = {
  USD: 280,
  CAD: 205,
  GBP: 355,
  PKR: 1,
};

const initFeeStudents = [];

const initExpenses = [];

const SETTINGS_SECTIONS = [
  {
    id: "profile",
    label: "Academy Profile",
    icon: BookOpen,
    color: "accent",
  },
  {
    id: "users",
    label: "Users & Team",
    icon: Users,
    color: "success",
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    icon: Shield,
    color: "warn",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: AlertTriangle,
    color: "cyan",
  },
  {
    id: "payments",
    label: "Payment Gateways",
    icon: CreditCard,
    color: "purple",
  },
  {
    id: "pricing",
    label: "Fees & Pricing",
    icon: DollarSign,
    color: "accent",
  },
  {
    id: "hr",
    label: "HR & Attendance",
    icon: Clock,
    color: "warn",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    color: "danger",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: LayoutDashboard,
    color: "purple",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Globe,
    color: "cyan",
  },
  {
    id: "backup",
    label: "Backup & Data",
    icon: Download,
    color: "success",
  },
  {
    id: "system",
    label: "System Prefs",
    icon: Settings,
    color: "accent",
  },
  {
    id: "advanced",
    label: "Advanced / API",
    icon: Package,
    color: "danger",
  },
];

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "teachers",
    label: "Teachers",
    icon: Users,
    parent: "hr",
  },
  {
    id: "operations",
    label: "Operations",
    icon: Briefcase,
    isGroup: true,
  },
  {
    id: "timetable",
    label: "Timetable",
    icon: Calendar,
    parent: "operations",
  },
  {
    id: "students",
    label: "Students",
    icon: GraduationCap,
    parent: "operations",
  },
  {
    id: "shifting",
    label: "Class Shifting",
    icon: ArrowRightLeft,
    parent: "operations",
  },
  {
    id: "subjects",
    label: "Subjects",
    icon: BookOpen,
    parent: "operations",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: Check,
    parent: "hr",
  },
  {
    id: "finance",
    label: "Finance",
    icon: DollarSign,
    isGroup: true,
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: CreditCard,
    parent: "finance",
  },
  {
    id: "ar",
    label: "Accounts Receivable",
    icon: TrendingUp,
    parent: "finance",
  },
  {
    id: "ap",
    label: "Accounts Payable",
    icon: Receipt,
    parent: "finance",
  },
  {
    id: "parent",
    label: "Parents Portal",
    icon: Users,
  },
  {
    id: "hr",
    label: "HR",
    icon: UserCheck,
    isGroup: true,
  },
  {
    id: "training",
    label: "Training & Dev",
    icon: Award,
  },
  {
    id: "qc",
    label: "Quality Control",
    icon: Shield,
  },
  {
    id: "sales",
    label: "Sales",
    icon: Target,
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: Package,
  },
  {
    id: "reports",
    label: "Monthly Reports",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

const PERMISSION_TO_MODULE = {
  "View Dashboard": ["dashboard"],
  "Manage Teachers": ["teachers"],
  "Manage Students": ["students"],
  "Manage Timetable": ["timetable", "subjects"],
  "Approve Leaves": ["teachers", "attendance"],
  "View Payroll": ["payroll"],
  "Edit Settings": ["settings"],
  "Export Data": [],
};

const buildAccessFromPermissions = (permissions) => {
  const modules = new Set();
  Object.entries(permissions || {}).forEach(([perm, enabled]) => {
    if (enabled && PERMISSION_TO_MODULE[perm]) {
      PERMISSION_TO_MODULE[perm].forEach((m) => modules.add(m));
    }
  });
  return Array.from(modules);
};

const DEFAULT_ACCESS = {
  teamlead: [
    "dashboard",
    "teachers",
    "operations",
    "timetable",
    "students",
    "shifting",
    "attendance",
  ],
  teacher: ["operations", "timetable", "attendance", "students"],
};

const ALLOWED_NETWORKS = [
  "Let's Learn Quran 5G",
  "Let's Learn Quran 2G",
  "LLQA-Office",
  "IBA-WiFi",
  "LLQA-Guest",
];

const NETWORK_OPTIONS = [
  {
    ssid: "Let's Learn Quran 5G",
    signal: "Excellent",
    speed: "450 Mbps",
    secure: true,
    allowed: true,
  },
  {
    ssid: "Let's Learn Quran 2G",
    signal: "Good",
    speed: "120 Mbps",
    secure: true,
    allowed: true,
  },
  {
    ssid: "LLQA-Office",
    signal: "Good",
    speed: "200 Mbps",
    secure: true,
    allowed: true,
  },
  {
    ssid: "IBA-WiFi",
    signal: "Fair",
    speed: "80 Mbps",
    secure: true,
    allowed: true,
  },
  {
    ssid: "Home WiFi (PTCL)",
    signal: "Excellent",
    speed: "100 Mbps",
    secure: true,
    allowed: false,
    homeNet: true,
  },
  {
    ssid: "Mobile Data (4G)",
    signal: "Good",
    speed: "35 Mbps",
    secure: false,
    allowed: false,
    homeNet: true,
  },
  {
    ssid: "Public Coffee Shop",
    signal: "Fair",
    speed: "15 Mbps",
    secure: false,
    allowed: false,
    homeNet: false,
  },
];

const detectDevice = () => {
  if (typeof navigator === "undefined") return "Desktop";
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return "Mobile";
  return "Desktop";
};

const getBrowser = () => {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Browser";
};

const genIP = () => "192.168.1." + Math.floor(Math.random() * 254 + 1);

const genMAC = () =>
  Array.from(
    {
      length: 6,
    },
    () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0"),
  )
    .join(":")
    .toUpperCase();

const genFingerprint = () =>
  "FP-" + Math.random().toString(36).substring(2, 10).toUpperCase();

const genGeo = (location) => {
  const base = {
    lat: 33.6007,
    lng: 73.0679,
    address: "IBA Building, Rawalpindi, Pakistan",
  };
  if (location === "IBA")
    return {
      ...base,
      accuracy: "5m",
    };
  const variations = [
    {
      lat: 33.7294,
      lng: 73.0931,
      address: "F-7 Sector, Islamabad",
    },
    {
      lat: 33.5651,
      lng: 73.0169,
      address: "Saddar, Rawalpindi",
    },
    {
      lat: 33.6844,
      lng: 73.0479,
      address: "G-9 Markaz, Islamabad",
    },
    {
      lat: 33.6117,
      lng: 73.0633,
      address: "Westridge, Rawalpindi",
    },
    {
      lat: 33.6939,
      lng: 73.0651,
      address: "F-8, Islamabad",
    },
  ];
  const v = variations[Math.floor(Math.random() * variations.length)];
  return {
    ...v,
    accuracy: "12m",
  };
};

const captureSilentPhoto = (name) => {
  const initials = name
    .split(" ")
    .map((s) => s.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const colors = [
    "#4a7aff",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#06b6d4",
    "#ec4899",
  ];
  const col = colors[name.length % colors.length];
  return {
    captured: true,
    initials,
    color: col,
    timestamp: new Date().toISOString(),
  };
};

const LOGIN_AUDIT = [];

const DEFAULT_TEAM_LEADS = [];

const DEFAULT_SETTINGS = {
  academyName: "Let's Learn Quran Academy",
  tagline: "Learn Quran Online with Qualified Teachers",
  website: "https://letslearnquran.net",
  email: "admin@letslearnquran.net",
  phone: "+92 312 6285005",
  whatsapp: "+92 300 0000000",
  address: "IBA Building, Rawalpindi, Pakistan",
  timezone: "Asia/Karachi (PKT)",
  regNumber: "LLQA-2021-3847",
  ntnNumber: "7823456-9",
  facebook: "facebook.com/llqa",
  instagram: "instagram.com/llqa",
  youtube: "youtube.com/@llqa",
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  whatsappEnabled: true,
  notifyFeeOverdue: true,
  notifyAttendance: true,
  notifyNewEnroll: true,
  notifyTeacherLate: true,
  notifyDailyReport: true,
  twoFAEnabled: true,
  sessionTimeout: 30,
  passwordMinLength: 8,
  passwordRequireSpecial: true,
  ipWhitelist: false,
  auditLog: true,
  dataEncryption: true,
  gdprCompliant: true,
  theme: "dark",
  accentColor: "#4a7aff",
  toneMode: "full",
  gracePeriod: 5,
  lateFeeAmount: 5,
  autoSuspendMonths: 2,
  academicYearStart: "2025-09-01",
  academicYearEnd: "2026-06-30",
  classDuration: 30,
  maxStudentsPerTeacher: 16,
  language: "English",
  dateFormat: "DD/MM/YYYY",
  currency: "USD",
  weekStart: "Monday",
  zoomConnected: true,
  googleConnected: true,
  whatsappConnected: false,
  smtpConnected: true,
  googleAnalytics: true,
  autoBackup: true,
  backupFreq: "Daily",
  retentionDays: 90,
  aiEnabled: true,
  aiReminders: true,
  aiInsights: true,
  automationRules: true,
  developerMode: false,
  lateThreshold: 10,
  lateFine10: 100,
  lateFine30: 250,
  absentFine: 1500,
  halfDayFine: 750,
  annualLeave: 14,
  sickLeave: 10,
  workingSat: true,
  workingSun: true,
  familyDiscount2: true,
  familyDiscount3: true,
  annualDiscount: true,
  referralBonus: true,
  scholarshipFund: true,
  ramadanAdjust: true,
  autoSecurityAudit: true,
  showTooltips: true,
  trialClass: true,
  cameraOnPolicy: false,
  apiAccess: true,
  density: "Normal",
  fontSize: "Medium",
};

const SearchableSelect = ({
  options,
  value,
  onChange,
  style,
  placeholder = "Select...",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = React.useRef();

  React.useEffect(() => {
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(q.toLowerCase()),
  );
  const selectedOpt = options.find((o) => String(o.value) === String(value));

  return React.createElement(
    "div",
    { ref, style: { position: "relative", ...style } },
    React.createElement(
      "div",
      {
        onClick: () => {
          setOpen(!open);
          setQ("");
        },
        style: {
          padding: "8px 12px",
          background: c.bgInput,
          border: "1px solid " + c.border,
          borderRadius: 7,
          color: c.text,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
      },
      selectedOpt ? selectedOpt.label : placeholder,
      React.createElement(ChevronDown, { size: 14 }),
    ),
    open &&
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: c.bg,
            border: "1px solid " + c.border,
            borderRadius: 7,
            marginTop: 4,
            zIndex: 99999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            maxHeight: 350,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          },
        },
        React.createElement("input", {
          autoFocus: true,
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "Search...",
          style: {
            padding: "10px 12px",
            border: "none",
            borderBottom: "1px solid " + c.border,
            background: c.bgInput,
            color: c.text,
            outline: "none",
            position: "sticky",
            top: 0,
          },
          onClick: (e) => e.stopPropagation(),
        }),
        filtered.length === 0
          ? React.createElement(
              "div",
              {
                style: {
                  padding: 12,
                  color: c.textMuted,
                  fontSize: 12,
                  textAlign: "center",
                },
              },
              "No results",
            )
          : filtered.map((o) =>
              React.createElement(
                "div",
                {
                  key: o.value,
                  onClick: () => {
                    onChange(o.value);
                    setOpen(false);
                  },
                  style: {
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    color:
                      String(o.value) === String(value) ? c.accent : c.text,
                    background:
                      String(o.value) === String(value)
                        ? c.bgInput
                        : "transparent",
                    borderBottom: "1px solid " + c.border + "22",
                  },
                  onMouseEnter: (e) => {
                    if (String(o.value) !== String(value))
                      e.currentTarget.style.background = c.bgInput;
                  },
                  onMouseLeave: (e) => {
                    if (String(o.value) !== String(value))
                      e.currentTarget.style.background = "transparent";
                  },
                },
                o.label,
              ),
            ),
      ),
  );
};

const CustomSelect = ({
  options,
  value,
  onChange,
  style,
  placeholder = "Select...",
}) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const normalizedOptions = (options || []).map((o) => {
    return typeof o === "object" ? o : { label: String(o), value: String(o) };
  });

  const selectedOpt = normalizedOptions.find(
    (o) => String(o.value) === String(value),
  );

  return React.createElement(
    "div",
    {
      ref,
      style: {
        position: "relative",
        width: "100%",
        ...style,
      },
    },
    React.createElement(
      "div",
      {
        onClick: () => setOpen(!open),
        style: {
          padding: "8px 10px",
          background: c.bgInput,
          border: "1px solid " + (open ? c.accent : c.border),
          borderRadius: 6,
          color: value ? c.text : c.textSec,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 34,
          boxSizing: "border-box",
        },
      },
      selectedOpt ? selectedOpt.label : placeholder,
      React.createElement(ChevronDown, {
        size: 14,
        color: c.textSec,
      }),
    ),
    open &&
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: c.bgDeep,
            backdropFilter: "blur(16px)",
            border: "1px solid " + c.border,
            borderRadius: 6,
            marginTop: 4,
            zIndex: 999999,
            boxShadow: c.shadow3d,
            maxHeight: 250,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "4px 0",
          },
        },
        React.createElement(
          "div",
          {
            onClick: () => {
              onChange("");
              setOpen(false);
            },
            style: {
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 12,
              color: !value ? c.accent : c.textSec,
              background: !value ? c.bgHover : "transparent",
              display: "flex",
              alignItems: "center",
            },
            onMouseEnter: (e) => {
              if (value) e.currentTarget.style.background = c.bgHover;
            },
            onMouseLeave: (e) => {
              if (value) e.currentTarget.style.background = "transparent";
            },
          },
          placeholder,
        ),
        normalizedOptions.map((o) =>
          React.createElement(
            "div",
            {
              key: o.value,
              onClick: () => {
                if (o.disabled) return;
                onChange(o.value);
                setOpen(false);
              },
              style: {
                padding: "8px 12px",
                cursor: o.disabled ? "not-allowed" : "pointer",
                opacity: o.disabled ? 0.45 : 1,
                fontSize: 12,
                color: String(o.value) === String(value) ? c.accent : c.text,
                background:
                  String(o.value) === String(value) ? c.bgHover : "transparent",
                display: "flex",
                alignItems: "center",
              },
              onMouseEnter: (e) => {
                if (!o.disabled && String(o.value) !== String(value))
                  e.currentTarget.style.background = c.bgHover;
              },
              onMouseLeave: (e) => {
                if (String(o.value) !== String(value))
                  e.currentTarget.style.background = "transparent";
              },
            },
            o.label,
          ),
        ),
      ),
  );
};

const NativeSelectWrapper = ({ children, onChange, ...props }) => {
  let finalOptions = [];
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    const flatChildren = childArray.flat(Infinity).filter(Boolean);
    finalOptions = flatChildren
      .map((child) => {
        if (child && child.props) {
          let label = child.props.children;
          if (Array.isArray(label)) label = label.join("");
          return {
            value: child.props.value !== undefined ? child.props.value : "",
            label: label || child.props.value || "",
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  const handleChange = (val) => {
    if (onChange) {
      // Simulate native event
      onChange({ target: { value: val } });
    }
  };

  return React.createElement(CustomSelect, {
    ...props,
    options: finalOptions,
    onChange: handleChange,
  });
};

const CustomMultiSelect = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  const selectedVals = Array.isArray(value) ? value : [];

  React.useEffect(() => {
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const toggleVal = (v) => {
    if (selectedVals.includes(v)) onChange(selectedVals.filter((x) => x !== v));
    else onChange([...selectedVals, v]);
  };

  return React.createElement(
    "div",
    {
      style: { marginBottom: 12, position: "relative" },
      ref: ref,
    },
    label &&
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
        label,
      ),
    React.createElement(
      "div",
      {
        onClick: () => setOpen(!open),
        style: {
          padding: "8px 10px",
          background: c.bgInput,
          border: "1px solid " + (open ? c.accent : c.border),
          borderRadius: 6,
          color: selectedVals.length > 0 ? c.text : c.textSec,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 34,
          boxSizing: "border-box",
        },
      },
      selectedVals.length > 0 ? selectedVals.join(", ") : placeholder,
      React.createElement(ChevronDown, { size: 14, color: c.textSec }),
    ),
    open &&
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: c.bgDeep,
            backdropFilter: "blur(16px)",
            border: "1px solid " + c.border,
            borderRadius: 6,
            marginTop: 4,
            zIndex: 999999,
            boxShadow: c.shadow3d,
            maxHeight: 200,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "4px 0",
          },
        },
        options.map((opt) =>
          React.createElement(
            "div",
            {
              key: opt,
              onClick: () => toggleVal(opt),
              style: {
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 12,
                color: selectedVals.includes(opt) ? c.accent : c.textSec,
                background: selectedVals.includes(opt)
                  ? c.bgHover
                  : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              },
            },
            opt,
            selectedVals.includes(opt) &&
              React.createElement(Check, { size: 14, color: c.accent }),
          ),
        ),
      ),
  );
};


/* ============================================================
   LLQA BOOKING ENGINE (v64) — one set of rules for every
   Add Student booking: Sales tab, Students tab, Booking Health.
   • Timetable rows are the STUDENT'S day. A Florida student at
     Mon 5:00 PM sits in the Mon row at 02:00 PKT (the Timetable
     shows it as "PK 2:00 AM (+1d)").
   • Empty cells and "F" are free, "N" is No Class, a cell with a
     student is booked — the same way the Timetable grid shows them.
   • A booking only happens if EVERY slot is free at save time
     (all-or-nothing), so two students can never share a slot.
   ============================================================ */
const LLQABooking = (() => {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const SHIFTS = ["Morning", "Evening", "Night", "Weekend"];
  const pad = (n) => String(n).padStart(2, "0");
  const norm = (v) => String(v == null ? "" : v).trim().toLowerCase();
  const rowDaysOf = (sh) =>
    sh === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const copy = (o) => JSON.parse(JSON.stringify(o || {}));

  /* ---------- timezones ---------- */
  const COUNTRY_TZ = {
    uk: "Europe/London",
    "united kingdom": "Europe/London",
    uae: "Asia/Dubai",
    "united arab emirates": "Asia/Dubai",
  };
  const REGION_TZ = {
    canada: {
      "new brunswick": "America/Moncton",
      "nova scotia": "America/Halifax",
      "prince edward island": "America/Halifax",
      "newfoundland and labrador": "America/St_Johns",
      yukon: "America/Whitehorse",
      "northwest territories": "America/Edmonton",
      nunavut: "America/Iqaluit",
    },
    australia: {
      "new south wales": "Australia/Sydney",
      victoria: "Australia/Melbourne",
      queensland: "Australia/Brisbane",
      "western australia": "Australia/Perth",
      "south australia": "Australia/Adelaide",
      tasmania: "Australia/Hobart",
      "australian capital territory": "Australia/Sydney",
      "northern territory": "Australia/Darwin",
    },
  };
  const timezoneFor = (country, state) => {
    const c = norm(country);
    const s = norm(state);
    if (COUNTRY_TZ[c]) return COUNTRY_TZ[c];
    const region = REGION_TZ[c];
    if (region && s && region[s]) return region[s];
    if (!s) return null;
    return detectTZ(state, "") || null;
  };

  /* ---------- time conversion (student time -> PKT slot) ---------- */
  // Same answer as tzOffsetMinutes(), but the formatter is built once per
  // timezone and each minute is remembered (checking hundreds of students
  // would otherwise build thousands of formatters).
  const fmtCache = {};
  const offCache = new Map();
  const offsetAt = (tz, d) => {
    const t = d ? d.getTime() : Date.now();
    const key = tz + "|" + Math.floor(t / 60000);
    const hit = offCache.get(key);
    if (hit !== undefined) return hit;
    let v = 0;
    try {
      const f =
        fmtCache[tz] ||
        (fmtCache[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }));
      const part = f.formatToParts(new Date(t)).find((p) => p.type === "timeZoneName");
      const m = ((part && part.value) || "").match(/GMT([+-]\d+)(?::(\d+))?/);
      v = m ? parseInt(m[1], 10) * 60 + (m[1].startsWith("-") ? -1 : 1) * parseInt(m[2] || "0", 10) : 0;
    } catch (e) {
      v = 0;
    }
    if (offCache.size > 20000) offCache.clear();
    offCache.set(key, v);
    return v;
  };
  const toPkt = (day, time, tz, refDate) => {
    if (!day || !time || !tz || DAYS.indexOf(day) < 0) return null;
    const p = parseUSTime(time);
    if (!p) return null;
    const ref = refDate || new Date();
    const diff = offsetAt("Asia/Karachi", ref) - offsetAt(tz, ref);
    const total = p.hour * 60 + p.minute + diff;
    const dayShift = Math.floor(total / 1440);
    const w = ((total % 1440) + 1440) % 1440;
    const slot =
      pad(Math.floor(w / 60)) + ":" + pad(Math.floor((w % 60) / 30) * 30);
    const pktDay = DAYS[(((DAYS.indexOf(day) + dayShift) % 7) + 7) % 7];
    return { rowDay: day, slot, pktDay, dayShift };
  };
  const fmt12 = (slot) => {
    const [h, m] = String(slot).split(":").map(Number);
    const per = h >= 12 ? "PM" : "AM";
    let dh = h % 12;
    if (dh === 0) dh = 12;
    return pad(dh) + ":" + pad(m) + " " + per;
  };
  const pktLabel = (pk) =>
    pk
      ? fmt12(pk.slot) +
        " PKT" +
        (pk.dayShift === 1 ? " (+1d)" : pk.dayShift === -1 ? " (-1d)" : "")
      : "";
  const TIMES = (() => {
    const out = [];
    for (let h = 0; h < 24; h++)
      for (const m of [0, 30]) {
        const per = h >= 12 ? "PM" : "AM";
        let dh = h % 12;
        if (dh === 0) dh = 12;
        out.push(pad(dh) + pad(m) + " " + per);
      }
    return out;
  })();
  const timeLabel = (t) => {
    const p = parseUSTime(t);
    return p ? fmt12(pad(p.hour) + ":" + pad(p.minute)) : String(t || "");
  };
  // Next clock change (DST) for a timezone within the next 60 days, to the
  // minute (a day-by-day scan alone can report the following day).
  const clockChange = (tz, from) => {
    if (!tz) return null;
    const start = from || new Date();
    const base = offsetAt(tz, start);
    for (let d = 1; d <= 60; d++) {
      const t = new Date(start.getTime() + d * 86400000);
      const off = offsetAt(tz, t);
      if (off !== base) {
        let lo = t.getTime() - 86400000;
        let hi = t.getTime();
        while (hi - lo > 60000) {
          const mid = Math.floor((lo + hi) / 2);
          if (offsetAt(tz, new Date(mid)) === base) lo = mid;
          else hi = mid;
        }
        // clocks change on a whole minute: the only one inside (lo, hi]
        const m = Math.floor(hi / 60000) * 60000;
        return { date: new Date(m > lo ? m : hi), before: base, after: off };
      }
    }
    return null;
  };
  // Every Pakistan slot a class can sit on: today's conversion first, then the
  // one from the other side of the student's clock change. Pakistan has no
  // DST, so a class booked before a change stays on its old slot until moved.
  const pktOptions = (day, time, tz, now) => {
    const ref = now || new Date();
    const y = ref.getUTCFullYear();
    const out = [];
    [ref, new Date(Date.UTC(y, 0, 15, 12)), new Date(Date.UTC(y, 6, 15, 12))].forEach((d) => {
      const pk = toPkt(day, time, tz, d);
      if (pk && !out.some((o) => o.slot === pk.slot)) out.push(pk);
    });
    return out;
  };
  const slotMinutes = (pk) => {
    const [h, m] = String(pk.slot).split(":").map(Number);
    return pk.dayShift * 1440 + h * 60 + m;
  };

  /* ---------- teachers and cells ---------- */
  const shiftsOf = (t) =>
    String((t && t.shift) || "Night")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && TT_DATA[s] && Array.isArray(TT_DATA[s].slots));
  const baseOf = (t) => {
    if (!t) return null;
    for (const sh of SHIFTS) {
      const list = (TT_DATA[sh] && TT_DATA[sh].teachers) || [];
      const f = list.find(
        (x) => (t.code && x.code === t.code) || (t.name && x.name === t.name),
      );
      if (f) return f.schedule || {};
    }
    return null;
  };
  const rawCell = (t, day, slot) => {
    const ov = t && t._ttSchedule;
    if (ov && ov[day] && ov[day][slot] !== undefined) return ov[day][slot];
    const base = baseOf(t);
    return base && base[day] ? base[day][slot] : undefined;
  };
  const isActive = (t) =>
    !!t &&
    t.status !== "resigned" &&
    t.status !== "quit" &&
    t.status !== "terminated";
  const inShift = (t, day, slot) =>
    shiftsOf(t).some(
      (sh) => rowDaysOf(sh).includes(day) && TT_DATA[sh].slots.includes(slot),
    );
  const slotInfo = (t, day, slot) => {
    if (!t) return { state: "noteacher" };
    if (!isActive(t)) return { state: "inactive" };
    if (!inShift(t, day, slot)) return { state: "offshift" };
    const v = rawCell(t, day, slot);
    if (v === undefined || v === null || v === "" || v === "F")
      return { state: "free" };
    if (typeof v === "object" && v.s) return { state: "booked", who: v.s, cell: v };
    if (v === "N") return { state: "noclass" };
    return { state: "blocked" };
  };
  const reasonText = (info) =>
    ({
      booked: "already booked (" + (info && info.who) + ")",
      offshift: "outside this teacher's shift",
      noclass: "marked No Class in the Timetable",
      blocked: "not available in the Timetable",
      inactive: "teacher is not active",
      noteacher: "teacher not found",
    })[info && info.state] || "not available";
  const countLoad = (t) => {
    let booked = 0;
    let free = 0;
    shiftsOf(t).forEach((sh) =>
      rowDaysOf(sh).forEach((d) =>
        TT_DATA[sh].slots.forEach((s) => {
          const st = slotInfo(t, d, s).state;
          if (st === "booked") booked++;
          else if (st === "free") free++;
        }),
      ),
    );
    return { booked, free };
  };
  const rankTeachers = (teachers, items, opts) => {
    const o = opts || {};
    return (teachers || [])
      .filter((t) => isActive(t) && shiftsOf(t).length > 0)
      .filter((t) => !o.filter || o.filter(t))
      .filter((t) =>
        (items || []).every(
          (it) => slotInfo(t, it.rowDay, it.slot).state === "free",
        ),
      )
      .map((t) => ({ t, load: countLoad(t) }))
      .sort(
        (a, b) =>
          a.load.booked - b.load.booked ||
          b.load.free - a.load.free ||
          String(a.t.name).localeCompare(String(b.t.name)),
      );
  };

  /* ---------- students ---------- */
  // Strict match: student id first, else same name AND same parent.
  const sameStudent = (cell, stu) => {
    if (!cell || typeof cell !== "object" || !cell.s || !stu) return false;
    if (cell.sid != null && cell.sid !== "" && stu.id != null)
      return String(cell.sid) === String(stu.id);
    if (norm(cell.s) !== norm(stu.name)) return false;
    const cl = norm(cell.l);
    const pl = norm(stu.parent);
    return !cl || cl === pl;
  };
  // Every booked cell in the Timetable, in teacher → day → slot order.
  const eachBooked = (teachers, fn) => {
    (teachers || []).forEach((t) => {
      if (!t) return;
      const ov = t._ttSchedule || {};
      const base = baseOf(t) || {};
      const days = new Set([...Object.keys(ov), ...Object.keys(base)]);
      days.forEach((d) => {
        const slots = new Set([
          ...Object.keys(ov[d] || {}),
          ...Object.keys(base[d] || {}),
        ]);
        slots.forEach((s) => {
          const v = rawCell(t, d, s);
          if (v && typeof v === "object" && v.s)
            fn({ teacherId: t.id, teacher: t.name, day: d, slot: s, cell: v });
        });
      });
    });
  };
  const studentCells = (teachers, stu) => {
    const out = [];
    if (!stu) return out;
    eachBooked(teachers, (c) => {
      if (sameStudent(c.cell, stu)) out.push(c);
    });
    return out;
  };
  // Same result as studentCells, but indexed once for checking many students.
  const indexCells = (teachers) => {
    const list = [];
    const bySid = new Map();
    const byName = new Map();
    const add = (m, k, c) => {
      const a = m.get(k);
      if (a) a.push(c);
      else m.set(k, [c]);
    };
    eachBooked(teachers, (c) => {
      c.n = list.length;
      list.push(c);
      if (c.cell.sid != null && c.cell.sid !== "") add(bySid, String(c.cell.sid), c);
      add(byName, norm(c.cell.s), c);
    });
    return { list, bySid, byName };
  };
  const cellsFromIndex = (ix, stu) => {
    if (!stu) return [];
    const pool =
      stu.id == null
        ? ix.list
        : [...(ix.bySid.get(String(stu.id)) || []), ...(ix.byName.get(norm(stu.name)) || [])];
    const seen = new Set();
    return pool
      .filter((c) => {
        if (seen.has(c.n) || !sameStudent(c.cell, stu)) return false;
        seen.add(c.n);
        return true;
      })
      .sort((a, b) => a.n - b.n)
      .map(({ n, ...c }) => c);
  };
  const cellsText = (cells) =>
    (cells || [])
      .map((c) => c.day + " " + fmt12(c.slot) + " PKT (" + c.teacher + ")")
      .join("\n");
  const timeSuffix = (country) => {
    const c = norm(country);
    return !c || c === "usa" ? " USA" : c === "canada" ? " CA" : "";
  };
  const makeCell = (stu, it) => ({
    s: stu.name || "",
    a: String(parseInt(stu.age) || ""),
    c: stu.course || "",
    sub: stu.sub || "",
    l: stu.parent || "",
    t: it.time + timeSuffix(stu.country),
    country: stu.country || "USA",
    state: stu.state || "",
    gender: stu.gender || "Any",
    phone: stu.phone || "",
    family: stu.family || "",
    f: [],
    sid: stu.id,
    day: it.day,
  });
  const seedSchedule = (t) => {
    if (baseOf(t)) return {};
    const sch = {};
    shiftsOf(t).forEach((sh) =>
      rowDaysOf(sh).forEach((d) => {
        sch[d] = sch[d] || {};
        TT_DATA[sh].slots.forEach((s) => {
          if (sch[d][s] === undefined) sch[d][s] = "F";
        });
      }),
    );
    return sch;
  };

  /* ---------- plan: check a form schedule before saving ---------- */
  const plan = ({ rows, country, state, teachers, isQuran, master }) => {
    const tz = timezoneFor(country, state);
    const timed = (rows || []).filter((r) => r && r.day && r.time);
    const problems = [];
    const items = [];
    if (timed.length && !tz)
      problems.push(
        'No timezone for "' + (state || country || "?") + '" — pick the State / Province again.',
      );
    const seen = {};
    const cellsUsed = {};
    timed.forEach((r, i) => {
      const label = r.day + " " + timeLabel(r.time);
      const key = r.day + "|" + r.time;
      if (seen[key]) {
        problems.push(label + " is picked twice (rows " + seen[key] + " and " + (i + 1) + ").");
        return;
      }
      seen[key] = i + 1;
      if (!tz) return;
      const pk = toPkt(r.day, r.time, tz);
      if (!pk) {
        problems.push(label + ": time not understood.");
        return;
      }
      const tName = isQuran ? master : r.teacher;
      if (!tName || tName === "Unassigned") {
        problems.push(label + ": pick a teacher, or clear the time to save without a class.");
        return;
      }
      const t = (teachers || []).find((x) => x.name === tName);
      const info = slotInfo(t, pk.rowDay, pk.slot);
      if (info.state !== "free") {
        problems.push(label + " (" + pktLabel(pk) + ") with " + tName + ": " + reasonText(info) + ".");
        return;
      }
      const ck = t.id + "|" + pk.rowDay + "|" + pk.slot;
      if (cellsUsed[ck]) {
        problems.push(label + " lands on the same timetable slot as row " + cellsUsed[ck] + ".");
        return;
      }
      cellsUsed[ck] = i + 1;
      items.push({
        teacherId: t.id,
        teacher: t.name,
        day: r.day,
        time: r.time,
        rowDay: pk.rowDay,
        slot: pk.slot,
        pktDay: pk.pktDay,
        dayShift: pk.dayShift,
      });
    });
    return { tz, items, problems, timedCount: timed.length };
  };

  /* ---------- book / release / update ---------- */
  const book = (teachers, items, stu) => {
    const problems = [];
    const taken = {};
    (items || []).forEach((it) => {
      const t = (teachers || []).find((x) => x.id === it.teacherId);
      const k = it.teacherId + "|" + it.rowDay + "|" + it.slot;
      if (taken[k]) problems.push(it.day + " " + timeLabel(it.time) + " is in the list twice.");
      taken[k] = true;
      const info = slotInfo(t, it.rowDay, it.slot);
      if (info.state !== "free")
        problems.push(it.day + " " + timeLabel(it.time) + " with " + it.teacher + ": " + reasonText(info) + ".");
    });
    if (problems.length) return { ok: false, problems, teachers };
    const next = (teachers || []).map((t) => {
      const mine = items.filter((it) => it.teacherId === t.id);
      if (!mine.length) return t;
      const sch = t._ttSchedule ? copy(t._ttSchedule) : seedSchedule(t);
      mine.forEach((it) => {
        if (!sch[it.rowDay]) sch[it.rowDay] = {};
        sch[it.rowDay][it.slot] = makeCell(stu, it);
      });
      return { ...t, _ttSchedule: sch };
    });
    return { ok: true, teachers: next, problems: [] };
  };
  const release = (teachers, cells) => {
    const byT = {};
    (cells || []).forEach((c) => {
      (byT[c.teacherId] = byT[c.teacherId] || []).push(c);
    });
    return (teachers || []).map((t) => {
      const mine = byT[t.id];
      if (!mine) return t;
      const sch = t._ttSchedule ? copy(t._ttSchedule) : {};
      mine.forEach((c) => {
        if (!sch[c.day]) sch[c.day] = {};
        sch[c.day][c.slot] = "F";
      });
      return { ...t, _ttSchedule: sch };
    });
  };
  // Keep timetable cells in step when a student's details change.
  const updateCells = (teachers, cells, stu) => {
    const byT = {};
    (cells || []).forEach((c) => {
      (byT[c.teacherId] = byT[c.teacherId] || []).push(c);
    });
    return (teachers || []).map((t) => {
      const mine = byT[t.id];
      if (!mine) return t;
      const sch = t._ttSchedule ? copy(t._ttSchedule) : {};
      mine.forEach((c) => {
        if (!sch[c.day]) sch[c.day] = {};
        sch[c.day][c.slot] = {
          ...c.cell,
          s: stu.name || c.cell.s,
          a: String(parseInt(stu.age) || c.cell.a || ""),
          c: stu.course || c.cell.c,
          l: stu.parent || c.cell.l,
          country: stu.country || c.cell.country,
          state: stu.state || c.cell.state,
          phone: stu.phone || c.cell.phone || "",
          sid: stu.id,
        };
      });
      return { ...t, _ttSchedule: sch };
    });
  };
  // A student id never used before: not by a current student, not by a
  // removed one kept in Sales Master Data, not by a booking still in the
  // Timetable. Reusing a removed student's id merges the new student into the
  // old record (and its invoices, progress and parent notes).
  const nextStudentId = (lists, teachers) => {
    let max = 0;
    const see = (v) => {
      const n = parseInt(v, 10);
      if (n > max) max = n;
    };
    (lists || []).forEach((list) =>
      (Array.isArray(list) ? list : []).forEach((s) => s && see(s.id)),
    );
    (teachers || []).forEach((t) => {
      const sch = t && t._ttSchedule;
      if (!sch || typeof sch !== "object") return;
      Object.keys(sch).forEach((d) => {
        const row = sch[d];
        if (!row || typeof row !== "object") return;
        Object.keys(row).forEach((k) => {
          const v = row[k];
          if (v && typeof v === "object" && v.sid != null) see(v.sid);
        });
      });
    });
    return max + 1;
  };
  const newParentId = (students) => {
    const used = new Set(
      (students || [])
        .map((s) => String((s && s.parentId) || "").toUpperCase())
        .filter(Boolean),
    );
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let n = 0; n < 2000; n++) {
      let id = "P-";
      for (let i = 0; i < 5; i++) id += A[Math.floor(Math.random() * A.length)];
      if (!used.has(id)) return id;
    }
    return "P-" + Date.now().toString(36).toUpperCase().slice(-6);
  };

  /* ---------- booking health check ---------- */
  const scheduleOf = (stu) => {
    if (Array.isArray(stu.schedule) && stu.schedule.length)
      return stu.schedule
        .filter((r) => r && r.day && r.time)
        .map((r) => ({ day: r.day, time: r.time, teacher: r.teacher || stu.teacher }));
    return String(stu.time || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf("|");
        return i > 0
          ? { day: p.slice(0, i).trim(), time: p.slice(i + 1).trim(), teacher: stu.teacher }
          : { day: "", time: p, teacher: stu.teacher };
      });
  };
  const health = (teachers, students, removed, now) => {
    const issues = [];
    let checked = 0;
    let okCount = 0;
    const ix = indexCells(teachers);
    (students || []).forEach((stu) => {
      if (!stu) return;
      const cells = cellsFromIndex(ix, stu);
      if (stu.status === "quit") {
        if (cells.length)
          issues.push({
            kind: "quit", stu, teacher: cells[0].teacher,
            label: cells.length + " slot(s): " + cells.map((c) => c.day + " " + fmt12(c.slot)).join(", "),
            problem: "Quit, but still holds timetable slots",
            fix: { type: "free", cells, stu },
          });
        return;
      }
      const sched = scheduleOf(stu);
      if (!sched.length || !stu.teacher || stu.teacher === "Unassigned") return;
      checked++;
      const tz = timezoneFor(stu.country, stu.state);
      const used = new Set();
      const missing = [];
      let studentOk = true;
      sched.forEach((r) => {
        const base = { stu, teacher: r.teacher, label: (r.day || "?") + " " + timeLabel(r.time) };
        if (!r.day) {
          issues.push({ ...base, kind: "info", problem: "Saved time has no class day — can't check" });
          studentOk = false;
          return;
        }
        const opts = tz ? pktOptions(r.day, r.time, tz, now) : [];
        const pk = opts[0] || null;
        if (!pk) {
          issues.push({ ...base, kind: "info", problem: tz ? "Class time not understood" : 'No timezone for "' + (stu.state || stu.country || "?") + '"' });
          studentOk = false;
          return;
        }
        const t = (teachers || []).find((x) => x.name === r.teacher);
        if (!t) {
          issues.push({ ...base, kind: "info", problem: 'Teacher "' + r.teacher + '" not found' });
          studentOk = false;
          return;
        }
        base.label += " → " + r.day + " " + pktLabel(pk);
        let hit = null;
        let hitAt = 0;
        opts.some((o, k) => {
          hit = cells.find((c) => !used.has(c) && c.teacherId === t.id && c.day === o.rowDay && c.slot === o.slot);
          hitAt = k;
          return !!hit;
        });
        if (hit) {
          used.add(hit);
          if (hitAt > 0) {
            // Booked on the slot from before the student's clock change: still
            // a real booking, but the family's local time has moved.
            const shift = slotMinutes(opts[hitAt]) - slotMinutes(pk);
            const p = parseUSTime(r.time);
            const lm = p.hour * 60 + p.minute + shift;
            const dd = Math.floor(lm / 1440);
            const w = ((lm % 1440) + 1440) % 1440;
            const localDay = DAYS[(((DAYS.indexOf(r.day) + dd) % 7) + 7) % 7];
            const mins = Math.abs(shift);
            const amount = mins % 60 === 0 ? mins / 60 + " hour" + (mins === 60 ? "" : "s") : mins + " min";
            issues.push({
              kind: "clock", stu, teacher: t.name,
              label: r.day + " " + timeLabel(r.time) + " → booked " + r.day + " " + pktLabel(opts[hitAt]),
              problem:
                "Clocks changed: this slot is now " + localDay + " " + fmt12(pad(Math.floor(w / 60)) + ":" + pad(w % 60)) +
                " for the family (" + amount + (shift < 0 ? " earlier" : " later") +
                "). Keeping " + timeLabel(r.time) + " needs " + pktLabel(pk) + ".",
            });
          }
          return;
        }
        const old = opts.find((o) => {
          const v = rawCell(t, o.rowDay, o.slot);
          return v && typeof v === "object" && norm(v.s) === norm(stu.name);
        });
        if (old) return; // older entry, same name
        missing.push({ base, r, pk, opts, t });
      });
      const extras = cells.filter((c) => !used.has(c));
      missing.forEach(({ base, r, pk, opts, t }) => {
        studentOk = false;
        // Nearest day first; on each day try today's slot, then the slot from
        // before the clock change (an old wrong-day booking keeps its slot).
        const order = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6];
        let from = null;
        let target = pk;
        for (const k of order) {
          for (const o of opts) {
            const d = DAYS[(((DAYS.indexOf(o.rowDay) + k) % 7) + 7) % 7];
            from = extras.find((c) => !used.has(c) && c.teacherId === t.id && c.slot === o.slot && c.day === d);
            if (from) {
              target = o;
              break;
            }
          }
          if (from) break;
        }
        const info = slotInfo(t, target.rowDay, target.slot);
        const it = { teacherId: t.id, teacher: t.name, day: r.day, time: r.time, rowDay: target.rowDay, slot: target.slot };
        if (from) {
          used.add(from);
          issues.push({
            ...base, kind: "wrongday",
            problem: "Booked on " + from.day + " instead of " + target.rowDay,
            fix: info.state === "free" ? { type: "move", from, it, stu } : null,
            note: info.state === "free" ? "" : target.rowDay + " " + fmt12(target.slot) + " is " + reasonText(info),
          });
        } else if (info.state === "free") {
          issues.push({ ...base, kind: "missing", problem: "Not booked in the Timetable", fix: { type: "book", it, stu } });
        } else {
          issues.push({ ...base, kind: "clash", problem: "Slot " + reasonText(info) });
        }
      });
      extras
        .filter((c) => !used.has(c))
        .forEach((c) => {
          issues.push({
            kind: "extra", stu, teacher: c.teacher,
            label: c.day + " " + fmt12(c.slot) + " PKT",
            problem: "In the Timetable but not in the student's saved schedule",
          });
        });
      if (studentOk) okCount++;
    });
    (removed || []).forEach((m) => {
      if (!m) return;
      const cells = cellsFromIndex(ix, m);
      if (cells.length)
        issues.push({
          kind: "removed", stu: m, teacher: cells[0].teacher,
          label: cells.length + " slot(s): " + cells.map((c) => c.day + " " + fmt12(c.slot)).join(", "),
          problem: "Removed from the system, but still holds timetable slots",
          fix: { type: "free", cells, stu: m },
        });
    });
    return { checked, okCount, issues };
  };
  // Booking Health for the Sales tab: re-checked only when the Timetable,
  // the students or the master data change (or the minute rolls over), so
  // typing in the search box doesn't repeat the whole check.
  let lastHealth = null;
  const healthFor = (teachers, students, master) => {
    const minute = Math.floor(Date.now() / 60000);
    const h = lastHealth;
    if (h && h.t === teachers && h.s === students && h.m === master && h.min === minute) return h.res;
    const res = health(
      teachers || [],
      students || [],
      (master || []).filter((m) => m && m._inSystem === false),
    );
    lastHealth = { t: teachers, s: students, m: master, min: minute, res };
    return res;
  };
  const applyFixes = (teachers, fixes) => {
    let ts = teachers || [];
    let done = 0;
    const skipped = [];
    (fixes || []).forEach((f) => {
      const name = (f.stu && f.stu.name) || "?";
      if (f.type === "book") {
        const res = book(ts, [f.it], f.stu);
        if (res.ok) {
          ts = res.teachers;
          done++;
        } else skipped.push(name + ": " + res.problems.join("; "));
      } else if (f.type === "move") {
        const t = ts.find((x) => x.id === f.from.teacherId);
        if (!sameStudent(rawCell(t, f.from.day, f.from.slot), f.stu)) {
          skipped.push(name + ": class already moved");
          return;
        }
        const freed = release(ts, [f.from]);
        const res = book(freed, [f.it], f.stu);
        if (res.ok) {
          ts = res.teachers;
          done++;
        } else skipped.push(name + ": " + res.problems.join("; "));
      } else if (f.type === "free") {
        const still = f.cells.filter((c) => {
          const t = ts.find((x) => x.id === c.teacherId);
          return sameStudent(rawCell(t, c.day, c.slot), f.stu);
        });
        if (still.length) {
          ts = release(ts, still);
          done++;
        }
      }
    });
    return { teachers: ts, done, skipped };
  };

  // Message shown after a successful save.
  const bookingSummary = (name, items, parentId) => {
    const lines = (items || []).map(
      (it) =>
        "• " + it.day + " " + timeLabel(it.time) + " → " +
        pktLabel({ slot: it.slot, dayShift: it.dayShift }) + " with " + it.teacher,
    );
    return (
      "✓ " + name + " saved." +
      (lines.length
        ? "\n\nBooked " + lines.length + " class" + (lines.length === 1 ? "" : "es") + " in the Timetable:\n" + lines.join("\n")
        : "\n\nNo class time chosen yet — nothing booked in the Timetable.") +
      (parentId ? "\n\nParent Portal ID: " + parentId + " (share it with the parent)" : "")
    );
  };

  return {
    DAYS, TIMES, timezoneFor, toPkt, pktOptions, pktLabel, fmt12, timeLabel, clockChange,
    shiftsOf, slotInfo, reasonText, countLoad, rankTeachers,
    sameStudent, studentCells, cellsText, plan, book, release, updateCells,
    nextStudentId, newParentId, scheduleOf, health, healthFor, applyFixes, bookingSummary,
    offsetAt, indexCells, cellsFromIndex,
  };
})();
