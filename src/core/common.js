const { useState, useMemo, useEffect } = React;

const {
  BarChart: RcBarChart,
  Bar,
  PieChart: RcPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart: RcAreaChart,
  Area,
} = Recharts;
// v70: a chart with nothing to draw says so, instead of an empty grid or a blank circle.
// BarChart / AreaChart / PieChart below wrap Recharts' own; every chart in the CRM goes through them.
const llqaChartState = (data, skip) => {
  if (!Array.isArray(data) || !data.length) return "empty";
  // labels (text, or the x-axis key even when it is a number such as a day of the month) are not values;
  // when every value in every row is 0 there is nothing to draw either
  const sk = skip || [];
  return data.every((row) => !row || Object.entries(row).every(([k, v]) => sk.includes(k) || typeof v !== "number" || v === 0)) ? "zero" : "ok";
};
const llqaSafeChart = (Comp, pie) => {
  const W = (props) => {
    const kids = [].concat(props.children == null ? [] : props.children).flat(Infinity);
    const data = pie ? [].concat(...kids.filter((ch) => ch && ch.props && Array.isArray(ch.props.data)).map((ch) => ch.props.data)) : props.data;
    const xKeys = kids.filter((ch) => ch && ch.type === XAxis && ch.props && typeof ch.props.dataKey === "string").map((ch) => ch.props.dataKey);
    const st = llqaChartState(data, xKeys);
    if (st === "ok") return React.createElement(Comp, props);
    return React.createElement(
      "div",
      {
        role: "note",
        style: { width: props.width || "100%", height: props.height || 200, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: c.textSec, fontSize: 12, padding: "0 16px", boxSizing: "border-box", border: "1px dashed " + c.border, borderRadius: 10 },
      },
      st === "zero" ? "No data to show yet — every value is 0." : "No data to show yet.",
    );
  };
  W.displayName = "LLQASafe" + (Comp.displayName || "Chart");
  return W;
};
const BarChart = llqaSafeChart(RcBarChart);
const AreaChart = llqaSafeChart(RcAreaChart);
const PieChart = llqaSafeChart(RcPieChart, true);


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

// v66.2: places that stopped changing clocks after some browsers' time zone data
// was made (tz 2026b–e): from these moments they keep summer time all year.
const LLQA_TZ_FIXED = {
  "America/Vancouver": { from: Date.UTC(2026, 10, 1, 9, 0, 0), off: -420 }, // British Columbia: UTC−7
  "America/Edmonton": { from: Date.UTC(2026, 10, 1, 8, 0, 0), off: -360 }, // Alberta, Northwest Territories: UTC−6
  "America/Winnipeg": { from: Date.UTC(2026, 10, 1, 7, 0, 0), off: -300 }, // Manitoba: UTC−5
};
const llqaTzFixed = (tz, t) => {
  const r = LLQA_TZ_FIXED[tz];
  return r && t >= r.from ? r.off : null;
};
const tzOffsetMinutes = (tz, refDate) => {
  const _fx = llqaTzFixed(tz, refDate ? new Date(refDate).getTime() : Date.now()); // v66.2
  if (_fx !== null) return _fx;
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
      } else if ((!first || doneMap()[id]) && (hasData(s.data) || pend)) {
        // v67: this computer has seen the document in the cloud before, so its
        // copy is only a cache — the document was deleted elsewhere on purpose.
        // It is not brought back; only this computer's unsent changes are sent.
        const back = applyFields(fallback || {}, pend);
        if (first) markChecked(id);
        show(back);
        if (pend) sendFields(Object.keys(pend).map((k) => ({ id: k, doc: pend[k] })));
        return;
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
  // v72: plain reads, merges and listening for small documents written often (when each teacher's CRM was open):
  // a note that does not arrive is simply sent again with the next one, so none of it waits on this computer
  const rawRef = (path) => {
    const i = String(path).indexOf("/");
    return fb.db.collection(path.slice(0, i)).doc(path.slice(i + 1));
  };
  const rawMerge = async (path, data) => {
    if (!initFirebase()) return false;
    try {
      await fbSignIn();
      await epochReady();
      if (llqaFrozen) return false;
      await rawRef(path).set(data, { merge: true });
      return true;
    } catch (e) {
      return false;
    }
  };
  const rawGet = async (path) => {
    if (!initFirebase()) return null;
    try {
      await fbSignIn();
      await epochReady();
      const s = await rawRef(path).get();
      return s.exists ? s.data() || {} : {};
    } catch (e) {
      return null;
    }
  };
  const rawListen = (path, cb) => {
    let off = null, dead = false;
    if (!initFirebase()) return () => {};
    (async () => {
      try {
        await fbSignIn();
        await epochReady();
        if (dead) return;
        off = rawRef(path).onSnapshot((s) => cb(s.exists ? s.data() || {} : {}), () => {});
      } catch (e) {}
    })();
    return () => {
      dead = true;
      if (off) off();
    };
  };
  return { collection, doc, deviceId, retryNow, ready, epochReady, stores: () => stores, rawMerge, rawGet, rawListen };
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
  booked: "var(--booked)", // v70: booked / paid data (never a status colour)
  bookedBg: "var(--bookedBg)",
  seriesBFill: "var(--seriesBFill)", // v70: a second chart colour, never the accent
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
  // v68: solid "button" colours and the text that is readable on them
  accentFill: "var(--accentFill)",
  accentRing: "var(--accentRing)",
  successFill: "var(--successFill)",
  successText: "var(--successText)",
  warnFill: "var(--warnFill)",
  dangerFill: "var(--dangerFill)",
  dangerText: "var(--dangerText)",
  purpleFill: "var(--purpleFill)",
  cyanFill: "var(--cyanFill)",
  gradientPrimary: "var(--gradientPrimary)",
  glowPrimary: "var(--glowPrimary)",
  shadow3d: "var(--shadow3d)",
};

/* ---------- v68: theme engine ----------
   Every colour the CRM shows is checked for readability (WCAG AA, 4.5:1) in the theme in use.
   Status colours are fixed per theme; the accent picked in Settings is tuned here at runtime:
   darker for text in Light, lighter in Dark, and a button colour whose text stays readable. */
const llqaColor = (() => {
  const hex = (h) => {
    h = String(h || "").trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const delin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, a, bot) => top.map((v, i) => v * a + bot[i] * (1 - a));
  // OKLCH keeps the hue while the lightness moves
  const toLch = (c) => {
    const [r, g, b] = c.map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.sqrt(A * A + B * B), Math.atan2(B, A)];
  };
  const fromLch = (L, C, H) => {
    for (let k = 0; k < 60; k++) {
      const A = C * Math.cos(H), B = C * Math.sin(H);
      const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
      const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
      const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
      const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
      if (k === 59 || rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return rgb.map((v) => delin(Math.max(0, Math.min(1, v))));
      C *= 0.94; // out of range: less saturated, same hue
    }
  };
  // move the lightness (dir +1 lighter, -1 darker) only as far as needed for ok() to pass
  const fit = (c, dir, ok) => {
    if (ok(c)) return c;
    const [L0, C, H] = toLch(c);
    let lo = 0, hi = 1, best = null;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      const cand = fromLch(dir > 0 ? L0 + (1 - L0) * mid : L0 * (1 - mid), C, H);
      if (ok(cand)) { best = cand; hi = mid; } else lo = mid;
    }
    return best || (dir > 0 ? [255, 255, 255] : [0, 0, 0]);
  };
  const shift = (c, dL) => { const [L, C, H] = toLch(c); return fromLch(Math.max(0, Math.min(1, L + dL)), C, H); };
  const rgba = (c, a) => "rgba(" + c.map(Math.round).join(", ") + ", " + a + ")";
  return { hex, toHex, contrast, over, fit, shift, rgba, toLch };
})();

// colour + transparency that also works when the colour is a CSS variable
// (joining "44" straight onto c.accent gave "var(--accent)44", which browsers ignore)
function llqaAlpha(col, a) {
  const s = String(col == null ? "" : col).trim();
  if (!s) return "transparent";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return (s.length === 4 ? "#" + s.slice(1).split("").map((x) => x + x).join("") : s) + a;
  const p = Math.round((parseInt(a, 16) / 255) * 1000) / 10;
  return "color-mix(in srgb, " + s + " " + p + "%, transparent)";
}

const LLQA_THEME = {
  // what text sits on, per theme and background (must match index.html): page, cards, raised panels, hover rows
  surfaces: {
    dark: ["#09090b", "#121215", "#1d1d1f", "#1e1e21", "#15171e"],
    light: ["#f3f5f9", "#fefeff", "#eff3f7", "#f5f6f8"],
    "dark/neutral": ["#09090b", "#121215", "#1d1d1f", "#1e1e21", "#15171e"],
    "dark/midnight": ["#070b14", "#0d1320", "#17202f", "#181e2a"],
    "dark/warm": ["#0c0a09", "#161312", "#201d1c", "#201e1c"],
    "light/neutral": ["#f3f5f9", "#fefeff", "#eff3f7", "#f5f6f8"],
    "light/midnight": ["#eaeff7", "#fefeff", "#e4e9f1", "#f6f6f7"],
    "light/warm": ["#f5f2ec", "#fffefe", "#efebe3", "#f6f6f7"],
  },
  card: { dark: "#121215", light: "#fefeff", "dark/neutral": "#121215", "dark/midnight": "#0d1320", "dark/warm": "#161312", "light/neutral": "#fefeff", "light/midnight": "#fefeff", "light/warm": "#fffefe" },
  // text colours (readable on every surface of every background, and on their own tint)
  ink: {
    dark: { success: "#34d399", warn: "#fbbf24", danger: "#fd7676", purple: "#ac90ff", cyan: "#22d3ee", neutral: "#94a3b8" },
    light: { success: "#026e4b", warn: "#885501", danger: "#b80f1f", purple: "#6a35cf", cyan: "#0e697b", neutral: "#536278" },
  },
  // solid fills and the text that goes on them
  // v69: the bluish Midnight and stone Warm light backgrounds are a little darker than Neutral, so their status
  // colours are a touch deeper — worked out with the same rule (readable on every surface, on their own tag tint
  // and with the corner glow behind them). Backgrounds not listed use the colours above.
  inkBd: {
    "light/midnight": { success: "#0e6244", warn: "#794c0b", danger: "#a80a1a", purple: "#662fca", cyan: "#085e6f", neutral: "#49576d" },
    "light/warm": { success: "#006444", warn: "#7c4d00", danger: "#aa0f1d", purple: "#6731cc", cyan: "#0b6070", neutral: "#4a596f" },
  },
  fill: {
    success: ["#04835a", "#ffffff"],
    warn: ["#f59e0b", "#0b0d14"],
    danger: ["#da2c32", "#ffffff"],
    purple: ["#8352ec", "#ffffff"],
    cyan: ["#127d92", "#ffffff"],
    neutral: ["#63738a", "#ffffff"],
  },
};
const LLQA_BACKDROPS = ["neutral", "midnight", "warm"];
const llqaBackdrop = (b) => (LLQA_BACKDROPS.includes(b) ? b : "neutral");

// the accent family for one theme: text colour, button colour, the text on buttons, tints
function llqaAccentSet(accent, mode, backdrop) {
  const K = llqaColor;
  const dark = mode !== "light";
  const key = (dark ? "dark" : "light") + "/" + llqaBackdrop(backdrop);
  const W = [255, 255, 255], INK = [11, 13, 20];
  const raw = K.hex(accent) || K.hex("#4a7aff");
  let fill = raw, onFill = "#ffffff";
  if (K.contrast(W, raw) < 4.6) {
    if (K.contrast(INK, raw) >= 7) onFill = "#0b0d14"; // light colours (yellow, lime, cyan): dark text
    else fill = K.fit(raw, -1, (x) => K.contrast(W, x) >= 4.8); // mid colours: a little deeper, white text
  }
  const surf = LLQA_THEME.surfaces[key].map(K.hex);
  const card = K.hex(LLQA_THEME.card[key]);
  // v69: also with the page's corner glow (the accent itself) behind the text at its strongest on screen, and on
  // the accent's own highlight (selected menu item, chosen card) laid over every surface — not just over the card
  const glow = dark ? 0.085 : 0.052, tintA = dark ? 0.16 : 0.1;
  const ok = (x) =>
    surf.every((s) => {
      const g = K.over(x, glow, s);
      return K.contrast(x, s) >= 4.6 && K.contrast(x, g) >= 4.6 && K.contrast(x, K.over(x, tintA, g)) >= 4.6;
    }) && K.contrast(x, K.over(x, dark ? 0.25 : 0.2, card)) >= 4.6;
  const ink = K.fit(raw, dark ? 1 : -1, ok);
  // gradient for main buttons: a touch lighter at the top, text still readable everywhere
  const okText = (x) => K.contrast(onFill === "#ffffff" ? W : INK, x) >= 4.6;
  let top = K.shift(fill, 0.05);
  if (!okText(top)) top = K.fit(top, -1, okText);
  const bottom = onFill === "#ffffff" ? K.shift(fill, -0.035) : fill;
  // a button that would melt into the page gets a visible edge
  const edge = K.contrast(fill, card) < 1.7 ? ink : fill;
  return {
    accent: K.toHex(ink),
    accentRaw: K.toHex(raw),
    accentFill: K.toHex(fill),
    accentText: onFill,
    accentBorder: K.toHex(edge),
    accentBg: K.rgba(ink, dark ? 0.16 : 0.1),
    accentRing: K.rgba(ink, dark ? 0.4 : 0.32),
    gradientPrimary: "linear-gradient(180deg, " + K.toHex(top) + " 0%, " + K.toHex(bottom) + " 100%)",
    glowPrimary: "inset 0 1px 0 rgba(255,255,255," + (onFill === "#ffffff" ? 0.22 : 0.45) + "), 0 6px 18px -8px " + K.rgba(fill, dark ? 0.75 : 0.55),
    glowA: K.rgba(ink, dark ? 0.13 : 0.08),
  };
}

// every colour token for the theme in use; tone mode decides what purple / cyan / amber become.
// Pure apart from remembering the theme in use (keep === false: not even that — e.g. the sidebar's own colours).
function llqaThemeVars(mode, accent, tone, backdrop, keep) {
  const K = llqaColor;
  const dark = mode !== "light";
  const T = LLQA_THEME;
  const a = llqaAccentSet(accent, mode, backdrop);
  const tint = dark ? 0.16 : 0.1;
  const inks = T.inkBd[(dark ? "dark" : "light") + "/" + llqaBackdrop(backdrop)] || T.ink[dark ? "dark" : "light"];
  const fam = (name) => {
    const ink = inks[name];
    return { ink, bg: K.rgba(K.hex(ink), tint), fill: T.fill[name][0], text: T.fill[name][1] };
  };
  const acc = { ink: a.accent, bg: a.accentBg, fill: a.accentFill, text: a.accentText };
  const tm = tone || "full";
  const pick = { success: fam("success"), danger: fam("danger"), warn: fam("warn"), purple: fam("purple"), cyan: fam("cyan") };
  if (tm === "compact") { pick.purple = acc; pick.cyan = acc; }
  if (tm === "minimal") { pick.purple = fam("neutral"); pick.cyan = fam("neutral"); pick.warn = fam("neutral"); }
  const vars = { ...a };
  Object.entries(pick).forEach(([k, v]) => {
    vars[k] = v.ink;
    vars[k + "Bg"] = v.bg;
    vars[k + "Fill"] = v.fill;
    vars[k + "Text"] = v.text;
  });
  vars.glowB = K.rgba(K.hex(pick.purple.ink), dark ? 0.09 : 0.06);
  // v70: booked (paid) classes and other everyday data shown next to the status colours use the accent — unless
  // the accent looks like a status colour (a red, amber or green accent would read as "trial", "awaiting" or
  // "free"); then a calm blue that can't be mistaken for any of them
  const bk = llqaBookedInk(a.accentRaw, mode, backdrop);
  vars.booked = bk;
  vars.bookedBg = K.rgba(K.hex(bk), tint);
  // a second chart colour that never equals the accent (Balanced turns purple into the accent): purple, or a calm slate
  vars.seriesBFill = tm === "compact" ? T.fill.neutral[0] : vars.purpleFill;
  if (keep !== false) LLQA_THEME.used = { mode: dark ? "dark" : "light", accent: a.accentRaw, tone: tm, backdrop: llqaBackdrop(backdrop), vars };
  return vars;
}
// is this accent too close to a status colour to mark ordinary booked / paid data?
function llqaAccentClash(accent) {
  const K = llqaColor;
  const raw = K.hex(accent);
  if (!raw) return false;
  const [, C, H] = K.toLch(raw);
  if (C < 0.07) return false; // greys and near-black are never confused with a status colour
  const deg = (h) => ((h * 180) / Math.PI + 360) % 360;
  const near = (x) => { const [, cx, hx] = K.toLch(K.hex(x)); if (cx < 0.07) return false; const d = Math.abs(deg(H) - deg(hx)) % 360; return Math.min(d, 360 - d) < 34; };
  return ["#da2c32", "#f59e0b", "#04835a"].some(near); // danger, warn, success
}
function llqaBookedInk(accent, mode, backdrop) {
  const a = llqaAccentSet(accent, mode, backdrop);
  return llqaAccentClash(a.accentRaw) ? llqaAccentSet("#4a7aff", mode, backdrop).accent : a.accent;
}
function llqaPaintTheme(mode, vars, backdrop) {
  const root = document.documentElement;
  const dark = mode !== "light";
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.setAttribute("data-backdrop", llqaBackdrop(backdrop));
  root.style.colorScheme = dark ? "dark" : "light";
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty("--" + k, v));
}
function llqaApplyTheme(mode, accent, tone, backdrop) {
  const vars = llqaThemeVars(mode, accent, tone, backdrop);
  llqaPaintTheme(mode, vars, backdrop);
  return vars;
}
// the same colours as inline CSS variables, for a part of the page with its own theme (the dark sidebar)
const llqaVarStyle = (vars) => Object.fromEntries(Object.entries(vars || {}).map(([k, v]) => ["--" + k, v]));
// text for a cell filled with `pct`% of a theme colour: white or near-black, whichever reads better
function llqaTextOn(tone, pct) {
  const K = llqaColor;
  const u = LLQA_THEME.used || {};
  const mode = u.mode === "light" ? "light" : "dark";
  const key = mode + "/" + llqaBackdrop(u.backdrop);
  const ink = K.hex((u.vars && u.vars[tone]) || LLQA_THEME.ink[mode][tone] || "#888888") || [136, 136, 136];
  const mixed = K.over(ink, Math.max(0, Math.min(1, (pct || 0) / 100)), K.hex(LLQA_THEME.card[key]));
  return K.contrast([255, 255, 255], mixed) >= K.contrast([11, 13, 20], mixed) ? "#ffffff" : "#0b0d14";
}

// v69: the accent colours offered in Settings — a curated, named set (any other colour still works)
const LLQA_ACCENTS = [
  ["#4a7aff", "LLQA Blue"], ["#2563eb", "Royal Blue"], ["#1e3a8a", "Navy"], ["#4f46e5", "Indigo"],
  ["#7c3aed", "Violet"], ["#86198f", "Plum"], ["#db2777", "Rose"], ["#be123c", "Crimson"],
  ["#881337", "Burgundy"], ["#c2410c", "Terracotta"], ["#d97706", "Amber"], ["#b7791f", "Gold"],
  ["#166534", "Forest"], ["#059669", "Emerald"], ["#0f766e", "Teal"], ["#0e7490", "Ocean"],
  ["#475569", "Slate"], ["#1f2937", "Charcoal"],
];
const llqaAccentName = (hex) => {
  const h = String(hex || "").toLowerCase();
  const f = LLQA_ACCENTS.find(([x]) => x === h);
  return f ? f[1] : "Custom";
};

/* ---------- v69: icons instead of emoji in the app's own navigation and notices ---------- */
const LLQA_ICON = {};
const llqaIcon = (name) => LLQA_ICON[name] || (LLQA_ICON[name] = makeIcon(name));
const LLQA_EMOJI_ICON = {
  "📋": "clipboard-list", "🔁": "repeat", "🗓": "calendar-days", "📅": "calendar", "🏆": "trophy", "🧩": "puzzle",
  "🧑‍🏫": "presentation", "🌡": "gauge", "🤖": "bot", "🧪": "flask-conical", "💬": "message-square", "⏳": "hourglass",
  "💰": "wallet", "📨": "inbox", "🕐": "clock", "🎯": "target", "📈": "trending-up", "↩": "undo-2", "🔔": "bell",
  "🌙": "moon", "🏖": "tree-palm", "🎉": "party-popper", "🎁": "gift", "✍": "pen-line", "✉": "mail", "💳": "credit-card",
  "🎓": "graduation-cap", "⚠": "alert-triangle", "✅": "check-circle", "❌": "x-circle", "📞": "phone", "📚": "book-open",
  "🕊": "check-circle", "✨": "sparkles", "💵": "banknote", "🙌": "sparkles", "📌": "target", "🚀": "sparkles",
  // v69: the rest of the app's buttons, headings, tags and status lines
  "ℹ": "info", "👥": "users", "⚙": "settings", "📷": "camera", "💻": "laptop", "🛟": "life-buoy", "📡": "wifi", "📍": "map-pin",
  "🌐": "globe", "🔒": "lock", "🔐": "shield-check", "🆔": "id-card", "⏸": "pause", "✋": "hand", "⚡": "zap", "📖": "book-open",
  "🔥": "flame", "⛔": "ban", "☀": "sun", "👤": "user-round", "⭐": "star", "🖥": "monitor", "🆕": "circle-plus", "📣": "megaphone",
  "🔗": "link", "⬆": "circle-arrow-up", "⏭": "skip-forward", "🏠": "house", "🏢": "building-2", "📱": "smartphone", "⏰": "alarm-clock",
  "👁": "eye", "👨‍👧": "users", "🕒": "clock", "🖨": "printer", "🗣": "messages-square", "🔍": "search", "◀": "chevron-left", "▶": "chevron-right",
};
const LLQA_EMOJI_LEAD = /^((?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*))\s*/u;
// "🤖 Autopilot · 3" → "Autopilot · 3"
const llqaStripEmoji = (s) => String(s == null ? "" : s).replace(LLQA_EMOJI_LEAD, "");
// "🤖 Autopilot" → [bot icon, "Autopilot"]; text without a leading emoji is returned as it was
// opt: size (px, or "1.1em" to follow the text), color, gap, keep (an emoji with no icon stays as it was)
const llqaIconize = (s, opt) => {
  if (typeof s !== "string") return s;
  const o = opt || {};
  const m = LLQA_EMOJI_LEAD.exec(s);
  if (!m) return s;
  const name = o.icon || LLQA_EMOJI_ICON[m[1].replace(/\uFE0F/g, "")] || o.fallback || null;
  const rest = s.slice(m[0].length);
  if (!name) return o.keep ? s : rest;
  const em = typeof o.size === "string";
  // keep the space after the icon when there was one (e.g. "🗓 " followed by a name)
  const gap = !rest && m[0].length === m[1].length ? 0 : o.gap != null ? o.gap : em ? "0.4em" : 6;
  return [
    React.createElement(llqaIcon(name), { key: "ico", size: o.size || 13, color: o.color, "aria-hidden": true, "data-icon": name, style: { marginRight: gap, verticalAlign: em ? "-0.15em" : "-2px", flexShrink: 0 } }),
    rest,
  ];
};
// the same, sized to the text around it (used for labels across the app)
const LLQA_EM = { size: "1.1em", keep: true };
const llqaLabel = (s) => llqaIconize(s, LLQA_EM);
// tab bars: each view has its own icon (the label keeps its words and counts)
const LLQA_TAB_ICONS = {
  individual: "user-round", overview: "layout-grid", finder: "search", analytics: "bar-chart-3", today: "clipboard-list",
  leavecover: "repeat", holidays: "calendar-days", scorecards: "trophy", makeup: "puzzle", teacherday: "presentation", capacity: "gauge",
  master: "layers", current: "users", autopilot: "bot", pipeline: "flask-conical", contacts: "message-square", waitlist: "hourglass",
  fees: "wallet", requests: "inbox", references: "user-plus", health: "activity", clock: "clock", leads: "target", revenue: "trending-up", winback: "undo-2",
};
const llqaTabContent = (k, label) => {
  const name = LLQA_TAB_ICONS[k];
  const text = llqaStripEmoji(label);
  if (!name) return text;
  return [React.createElement(llqaIcon(name), { key: "ico", size: 13, style: { marginRight: 6, verticalAlign: "-2px" } }), text];
};

// "Auto (System)" follows the computer's own light / dark setting, live
function llqaSysDark() {
  try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return true; }
}
function llqaWatchSys(cb) {
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = (e) => cb(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else mq.removeListener(on); };
  } catch (e) { return () => {}; }
}

/* ---------- v69: Settings > Appearance ----------
   Mode, accent (a curated, named palette + any custom colour), background, sidebar,
   color intensity and a live preview. Every combination is tuned to stay readable. */
const LLQA_MODE_THUMBS = {
  dark: { bg: "#09090b", side: "#111113", card: "#1c1c1f", line: "#2a2a2e", text: "#e4e4e7" },
  light: { bg: "#f3f5f9", side: "#e8edf4", card: "#ffffff", line: "#dfe5ee", text: "#334155" },
};
const LLQA_BACKDROP_INFO = {
  neutral: { label: "Neutral", hint: "Clean grey surfaces", dark: ["#09090b", "#1c1c1f"], light: ["#f3f5f9", "#ffffff"] },
  midnight: { label: "Midnight", hint: "Deep navy, calm and focused", dark: ["#070b14", "#141c2c"], light: ["#eaeff7", "#ffffff"] },
  warm: { label: "Warm", hint: "Soft stone, easy on the eyes", dark: ["#0c0a09", "#1f1b19"], light: ["#f5f2ec", "#ffffff"] },
};
const LLQA_INTENSITY = [
  ["full", "Vibrant", "A distinct color for each kind of information"],
  ["compact", "Balanced", "Your accent for highlights; status colors kept"],
  ["minimal", "Minimal", "Calm greys; only status colors stand out"],
];

// a selectable option: a clear frame, a check when chosen, keyboard friendly
const llqaChoice = (key, on, onPick, kids, extra) =>
  React.createElement(
    "button",
    {
      key,
      type: "button",
      onClick: onPick,
      "aria-pressed": on,
      style: {
        position: "relative",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: 12,
        padding: "10px 12px",
        background: on ? c.accentBg : c.bgCard,
        border: "1px solid " + (on ? c.accent : c.border),
        boxShadow: on ? "0 0 0 3px " + c.accentRing : "none",
        color: c.text,
        fontFamily: "inherit",
        ...(extra || {}),
      },
    },
    on
      ? React.createElement(
          "span",
          { style: { position: "absolute", bottom: 9, right: 9, width: 18, height: 18, borderRadius: 9, background: c.accentFill, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px " + c.bgCard } },
          React.createElement(Check, { size: 11, color: c.accentText, strokeWidth: 3 }),
        )
      : null,
    kids,
  );

// a small picture of the CRM in that mode (sidebar, header, cards, a button in your accent)
const llqaModeThumb = (m) => {
  const t = LLQA_MODE_THUMBS[m];
  const box = (x, y, w, h, bg, r) => React.createElement("div", { key: x + "-" + y + "-" + w, style: { position: "absolute", left: x, top: y, width: w, height: h, background: bg, borderRadius: r || 3 } });
  return React.createElement(
    "div",
    { style: { position: "relative", width: "100%", height: 64, background: t.bg, borderRadius: 8, overflow: "hidden", border: "1px solid " + t.line } },
    box(0, 0, 26, 64, t.side, 0),
    box(6, 8, 14, 4, c.accentFill, 2),
    box(6, 17, 12, 3, t.line, 2),
    box(6, 24, 12, 3, t.line, 2),
    box(34, 8, 60, 5, t.text, 2),
    box(34, 20, 40, 18, t.card, 5),
    box(80, 20, 40, 18, t.card, 5),
    box(34, 44, 86, 12, t.card, 4),
    box(106, 6, 20, 8, c.accentFill, 3),
  );
};

const LLQAAppearance = ({ settings, update, setTheme }) => {
  const s = settings || {};
  const theme = s.theme || "dark";
  const used = (LLQA_THEME.used && LLQA_THEME.used.mode) || (theme === "light" ? "light" : "dark");
  const accent = String(s.accentColor || "#4a7aff").toLowerCase();
  const tone = s.toneMode || "full";
  const backdrop = llqaBackdrop(s.backdrop);
  const side = s.sidebarStyle === "dark" ? "dark" : "match";
  const label = (t) => React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: c.text, marginTop: 8 } }, t);
  // readable on a chosen (tinted) card too; keeps clear of the check mark in the corner
  const hint = (t) => React.createElement("div", { style: { fontSize: 10.5, color: c.textSec, marginTop: 2, lineHeight: 1.4, paddingRight: 22 } }, t);
  const row = (key, title, desc, control) =>
    React.createElement(
      "div",
      { key, style: { display: "grid", gridTemplateColumns: "minmax(170px, 230px) minmax(0, 1fr)", gap: 18, padding: "16px 0", borderBottom: "1px solid " + c.border, alignItems: "start" } },
      React.createElement(
        "div",
        null,
        React.createElement("div", { style: { color: c.text, fontSize: 12.5, fontWeight: 700 } }, title),
        React.createElement("div", { style: { color: c.textSec, fontSize: 10.5, marginTop: 4, lineHeight: 1.45 } }, desc),
      ),
      React.createElement("div", { style: { minWidth: 0 } }, control),
    );
  const grid = (min, kids) => React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(" + min + "px, 1fr))", gap: 10 } }, kids);
  const pickTheme = (k) => {
    update("theme", k);
    if (setTheme && k !== "auto") setTheme(k);
  };
  return React.createElement(
    SettingCard,
    { title: "Theme & Colors", icon: llqaIcon("palette") },
    row(
      "mode",
      "Mode",
      "Light, Dark, or follow your computer's setting.",
      grid(
        150,
        [["light", "Light", llqaIcon("sun")], ["dark", "Dark", llqaIcon("moon")], ["auto", "System", llqaIcon("monitor")]].map(([k, l, I]) =>
          llqaChoice(
            k,
            theme === k,
            () => pickTheme(k),
            [
              k === "auto"
                ? React.createElement(
                    "div",
                    { key: "t", style: { display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 8, overflow: "hidden" } },
                    React.createElement("div", { key: "l", style: { overflow: "hidden" } }, llqaModeThumb("light")),
                    React.createElement("div", { key: "d", style: { overflow: "hidden" } }, llqaModeThumb("dark")),
                  )
                : React.createElement("div", { key: "t" }, llqaModeThumb(k)),
              React.createElement(
                "div",
                { key: "n", style: { display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, fontWeight: 700, color: c.text } },
                React.createElement(I, { size: 13, color: c.textSec }),
                k === "auto" ? "System · " + (llqaSysDark() ? "Dark now" : "Light now") : l,
              ),
            ],
          ),
        ),
      ),
    ),
    row(
      "accent",
      "Accent color",
      "Buttons, links, the open page and highlights. Each color is fine-tuned automatically so text stays readable.",
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 34px))", gap: 10, maxWidth: 9 * 34 + 8 * 10 } },
          LLQA_ACCENTS.map(([h, n]) => {
            const on = accent === h;
            const onTxt = llqaColor.contrast([255, 255, 255], llqaColor.hex(h)) >= 3 ? "#ffffff" : "#0b0d14";
            return React.createElement(
              "button",
              {
                key: h,
                type: "button",
                title: n + " · " + h,
                "aria-label": n,
                "aria-pressed": on,
                onClick: () => update("accentColor", h),
                style: {
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  cursor: "pointer",
                  background: "linear-gradient(145deg, " + llqaColor.toHex(llqaColor.shift(llqaColor.hex(h), 0.06)) + ", " + h + ")",
                  border: "2px solid " + (on ? c.bg : "transparent"),
                  boxShadow: on ? "0 0 0 2px " + h + ", 0 6px 14px -6px " + h : "inset 0 0 0 1px rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                },
              },
              on ? React.createElement(Check, { size: 15, color: onTxt, strokeWidth: 3 }) : null,
            );
          }),
        ),
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" } },
          React.createElement("span", { style: { width: 14, height: 14, borderRadius: 7, background: accent, boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.35)" } }),
          React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: c.text } }, llqaAccentName(accent)),
          React.createElement("span", { style: { fontSize: 11, color: c.textMuted, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" } }, accent),
          React.createElement("span", { style: { flex: 1 } }),
          React.createElement(
            "label",
            {
              title: "Choose any color",
              style: { position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid " + c.border, cursor: "pointer", fontSize: 11, fontWeight: 600, color: c.textSec, background: c.bgCard },
            },
            React.createElement("span", { style: { width: 14, height: 14, borderRadius: 7, background: "conic-gradient(from 180deg,#ef4444,#f59e0b,#10b981,#06b6d4,#3b82f6,#8b5cf6,#ec4899,#ef4444)" } }),
            "Custom",
            React.createElement("input", {
              type: "color",
              value: /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#4a7aff",
              onChange: (e) => update("accentColor", String(e.target.value).toLowerCase()),
              style: { position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" },
            }),
          ),
          React.createElement("input", {
            type: "text",
            key: "hex-" + accent,
            defaultValue: accent,
            "aria-label": "Hex color",
            maxLength: 7,
            onChange: (e) => {
              const v = String(e.target.value).trim();
              if (/^#[0-9a-fA-F]{6}$/.test(v)) update("accentColor", v.toLowerCase());
            },
            style: { width: 88, padding: "6px 8px", borderRadius: 8, background: c.bgInput, color: c.text, fontSize: 11.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", textAlign: "center" },
          }),
        ),
      ),
    ),
    row(
      "backdrop",
      "Background",
      "The tone of the page and panels behind your work.",
      grid(
        150,
        LLQA_BACKDROPS.map((k) => {
          const b = LLQA_BACKDROP_INFO[k];
          const [bg, card] = b[used];
          return llqaChoice(k, backdrop === k, () => update("backdrop", k), [
            React.createElement(
              "div",
              { key: "sw", style: { height: 40, borderRadius: 8, background: bg, border: "1px solid " + c.border, position: "relative", overflow: "hidden" } },
              React.createElement("div", { style: { position: "absolute", left: 10, right: 34, top: 9, bottom: 9, borderRadius: 5, background: card } }),
              React.createElement("div", { style: { position: "absolute", right: 10, top: 14, width: 16, height: 12, borderRadius: 3, background: c.accentFill } }),
            ),
            React.createElement("div", { key: "l" }, label(b.label)),
            React.createElement("div", { key: "h" }, hint(b.hint)),
          ]);
        }),
      ),
    ),
    row(
      "sidebar",
      "Sidebar",
      "Keep the menu in the same mode as the page, or always dark for a strong frame in Light mode.",
      grid(150, [
        llqaChoice("match", side === "match", () => update("sidebarStyle", "match"), [
          React.createElement("div", { key: "l" }, label("Match theme")),
          React.createElement("div", { key: "h" }, hint("Same colors as the page")),
        ]),
        llqaChoice("dark", side === "dark", () => update("sidebarStyle", "dark"), [
          React.createElement("div", { key: "l" }, label("Always dark")),
          React.createElement("div", { key: "h" }, hint("A dark menu, also in Light mode")),
        ]),
      ]),
    ),
    row(
      "tone",
      "Color intensity",
      "How much color the CRM uses. Status colors (paid, due, overdue) always stay.",
      grid(
        150,
        LLQA_INTENSITY.map(([k, l, d]) =>
          llqaChoice(k, tone === k, () => update("toneMode", k), [
            React.createElement(
              "div",
              { key: "dots", style: { display: "flex", gap: 4 } },
              (k === "full" ? [c.accent, c.purple, c.cyan, c.warn, c.success] : k === "compact" ? [c.accent, c.accent, c.warn, c.success] : [c.textMuted, c.textMuted, c.success, c.danger]).map((col, i) =>
                React.createElement("span", { key: i, style: { width: 10, height: 10, borderRadius: 5, background: col } }),
              ),
            ),
            React.createElement("div", { key: "l" }, label(l)),
            React.createElement("div", { key: "h" }, hint(d)),
          ]),
        ),
      ),
    ),
    React.createElement(
      "div",
      { key: "pv", style: { paddingTop: 16 } },
      React.createElement("div", { style: { color: c.text, fontSize: 12.5, fontWeight: 700, marginBottom: 4 } }, "Preview"),
      React.createElement("div", { style: { color: c.textSec, fontSize: 10.5, marginBottom: 12 } }, "Your choices on real parts of the CRM. Changes are saved and applied immediately."),
      React.createElement(LLQAThemePreview, null),
    ),
  );
};

// a miniature dashboard drawn with the live colors
const LLQAThemePreview = () => {
  const tile = (key, label, value, sub, tone, I) =>
    React.createElement(
      "div",
      { key, style: { flex: "1 1 150px", minWidth: 0, background: c.bgCard, border: "1px solid " + c.border, borderRadius: 10, padding: "10px 12px", position: "relative", overflow: "hidden" } },
      React.createElement("div", { style: { position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "linear-gradient(90deg, " + tone + ", " + llqaAlpha(tone, "00") + " 85%)" } }),
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement("span", { style: { width: 24, height: 24, borderRadius: 7, background: llqaAlpha(tone, "22"), display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(I, { size: 13, color: tone })),
        React.createElement("span", { style: { fontSize: 10.5, color: c.textSec, fontWeight: 600 } }, label),
      ),
      React.createElement("div", { style: { fontSize: 19, fontWeight: 800, color: c.text, marginTop: 6 } }, value),
      React.createElement("div", { style: { fontSize: 10, color: c.textMuted, marginTop: 2 } }, sub),
    );
  const bars = [38, 52, 46, 61, 57, 72];
  return React.createElement(
    "div",
    { style: { borderRadius: 14, border: "1px solid " + c.border, background: c.bgDeep, padding: 14 } },
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" } },
      React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: c.text, flex: 1 } }, "Students"),
      React.createElement(
        "span",
        { style: { background: c.accentBg, color: c.accent, border: "1px solid " + llqaAlpha(c.accent, "55"), borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 600 } },
        "Export",
      ),
      React.createElement(
        "span",
        { style: { background: c.gradientPrimary, color: c.accentText, border: "1px solid " + c.accentBorder, boxShadow: c.glowPrimary, borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 700 } },
        "Add student",
      ),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      tile("a", "Active students", "128", "USA 84 · UK 26 · Canada 18", c.accent, Users),
      tile("b", "Fees received", "4,250 USD", "+ 640 GBP · 37 payments", c.success, DollarSign),
      tile("c", "Fee overdue", "3", "1 final notice", c.danger, AlertTriangle),
    ),
    React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: 10 } },
      React.createElement(
        "div",
        { style: { background: c.bgCard, border: "1px solid " + c.border, borderRadius: 10, padding: "10px 12px" } },
        [
          ["Aisha Khan", "Quran", "paid", "success"],
          ["Omar Siddiqui", "Tajweed", "due soon", "warn"],
          ["Zainab Ali", "Quran", "trial", "purple"],
        ].map(([n, course, st, tn], i) =>
          React.createElement(
            "div",
            { key: n, style: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < 2 ? "1px solid " + c.border : "none" } },
            React.createElement("span", { style: { width: 24, height: 24, borderRadius: 12, background: c.accentFill, color: c.accentText, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" } }, n[0]),
            React.createElement("span", { style: { flex: 1, fontSize: 11.5, fontWeight: 600, color: c.text } }, n),
            React.createElement(Badge, { text: course, color: "accent" }),
            React.createElement(Badge, { text: st, color: tn }),
          ),
        ),
      ),
      React.createElement(
        "div",
        { style: { background: c.bgCard, border: "1px solid " + c.border, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column" } },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 8 } }, "Fees received"),
        React.createElement(
          "div",
          { style: { flex: 1, display: "flex", alignItems: "flex-end", gap: 6, minHeight: 64, borderBottom: "1px solid " + c.border } },
          bars.map((v, i) => React.createElement("div", { key: i, style: { flex: 1, height: v + "%", borderRadius: "4px 4px 0 0", background: i === bars.length - 1 ? c.accent : llqaAlpha(c.accent, "73") } })),
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: 6, marginTop: 4 } },
          ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((m, i) => React.createElement("span", { key: m, style: { flex: 1, textAlign: "center", fontSize: 9.5, color: i === 5 ? c.textSec : c.textMuted, fontWeight: i === 5 ? 700 : 500 } }, m)),
        ),
      ),
    ),
  );
};

/* ---------- v70: a calendar day is the same day on every computer ---------- */
// new Date("2026-11-01") is midnight in London, which is still 31 October on a computer in the Americas
// ("Payroll — October 2026" under a November month picker, a parent's date of birth one day early).
// A day written as "YYYY-MM-DD" is read as that day where the computer is; anything else is read as before.
const llqaLocalDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s == null ? "" : s).trim());
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
};

// a short "nothing here" line for a list of cards; like llqaEmptyRow it hides itself once the list has an item (theme.css)
const llqaEmptyNote = (text) =>
  React.createElement("div", { key: "empty-note", className: "llqa-empty-note", style: { color: c.textSec, fontSize: 12, padding: "6px 2px", lineHeight: 1.5 } }, text);

/* ---------- v70: a teacher's students, counted from the timetable ---------- */
// The stored "students" number was never filled in (no field sets it), so the Teachers list showed nothing or 0
// and removing a teacher never warned about their students. Different students booked in the teacher's week:
// the built-in schedule (as computeFree finds it) with the teacher's saved changes on top.
const llqaTeacherStudents = (tx) => {
  if (!tx) return 0;
  let base = {};
  for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
    const found = ((TT_DATA[sh] || {}).teachers || []).find((x) => x.name === tx.name || x.code === tx.code);
    if (found) { base = found.schedule || {}; break; }
  }
  const ov = tx._ttSchedule || {};
  const seen = new Set();
  new Set([...Object.keys(base), ...Object.keys(ov)]).forEach((d) => {
    const b = base[d] || {}, o = ov[d] || {};
    new Set([...Object.keys(b), ...Object.keys(o)]).forEach((s) => {
      const v = o[s] !== undefined ? o[s] : b[s];
      if (!v || typeof v !== "object") return;
      const k = v.sid != null && v.sid !== "" ? "id:" + v.sid : "n:" + String(v.s || "").trim().toLowerCase();
      if (k !== "n:") seen.add(k);
    });
  });
  return seen.size;
};

/* ---------- v70: empty places say what to do next (one look, no guessing) ---------- */
// a card for a place with nothing in it yet: icon, one clear line, a short how-to, and the button that fixes it
const llqaEmptyState = (o) =>
  React.createElement(
    "div",
    {
      key: o.key || "empty",
      role: "status",
      style: { background: c.bgCard, border: "1px dashed " + c.border, borderRadius: 12, padding: o.compact ? "20px 16px" : "36px 20px", textAlign: "center", ...(o.style || {}) },
    },
    React.createElement(
      "div",
      { style: { width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px", background: c.accentBg, color: c.accent, display: "flex", alignItems: "center", justifyContent: "center" } },
      React.createElement(llqaIcon(o.icon || "inbox"), { size: 20, "aria-hidden": true }),
    ),
    React.createElement("div", { style: { color: c.text, fontSize: 14, fontWeight: 700, lineHeight: 1.35 } }, o.title),
    o.text
      ? React.createElement("div", { style: { color: c.textSec, fontSize: 12, marginTop: 5, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.55 } }, o.text)
      : null,
    o.action
      ? React.createElement(
          "button",
          {
            type: "button",
            onClick: o.action[1],
            style: { marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: c.accentFill, color: c.accentText, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
          },
          o.action[2] ? React.createElement(llqaIcon(o.action[2]), { size: 14, "aria-hidden": true }) : null,
          o.action[0],
        )
      : null,
  );
// a shift with no teachers yet (Timetable, Book Slot, Overview, Analytics, Capacity)
const llqaNoTeachers = (shift, small) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const own = u.role === "teacher";
  if (own) {
    // a teacher looking at a shift they don't teach in is told where their classes are (not "not set up")
    const nm = String(u.name || "").trim().toLowerCase();
    const me = (ctx.teachers || []).find((t) => t && ((u.teacherId != null && String(t.id) === String(u.teacherId)) || (nm && String(t.name || "").trim().toLowerCase() === nm)));
    const mine = me && me.shift && me.shift !== shift && typeof TT_DATA === "object" && TT_DATA[me.shift] ? me.shift : "";
    return llqaEmptyState({
      key: "noteach",
      icon: "calendar",
      compact: !!small,
      title: mine ? "You have no classes in the " + shift + " shift" : "Your timetable is not set up yet",
      text: mine ? "Your classes are in the " + mine + " shift — choose “" + mine + "” above." : "Ask the admin to add you to a shift. Your classes will show here.",
    });
  }
  const canAdd = !small && typeof llqaCanOpen === "function" && llqaCanOpen("teachers");
  return llqaEmptyState({
    key: "noteach",
    icon: "users",
    compact: !!small,
    title: "No teachers in the " + shift + " shift yet",
    text: "Add a teacher in HR → Teachers and choose the " + shift + " shift. Their weekly timetable shows here, ready to book.",
    action: canAdd ? ["Add a teacher", () => llqaGo("teachers"), "user-plus"] : null,
  });
};
// an empty table says so: one row across every column (the number of columns is read from the table itself).
// It can sit in a table that has rows too: it only shows while it is the table's only row (theme.css).
const llqaEmptyRow = (title, text) =>
  React.createElement(
    "tr",
    { key: "empty-row", className: "llqa-empty-row" },
    React.createElement(
      "td",
      {
        colSpan: 1,
        ref: (el) => {
          if (!el) return;
          const t = el.closest("table");
          const n = t ? t.querySelectorAll("thead tr:first-child > *").length : 0;
          if (n > 1 && el.colSpan !== n) el.colSpan = n;
        },
        style: { padding: "34px 16px", textAlign: "center", borderBottom: "none", background: "transparent" },
      },
      React.createElement("div", { style: { color: c.text, fontSize: 13, fontWeight: 600 } }, title),
      text ? React.createElement("div", { style: { color: c.textSec, fontSize: 12, marginTop: 4, lineHeight: 1.5 } }, text) : null,
    ),
  );

/* ============================================================
   v71: money in several currencies, added up in PKR
   Fees arrive in USD, GBP, CAD …; salaries and expenses are in PKR. A total in PKR counts a foreign
   amount only through:
     1. the PKR that actually reached the academy for that payment (entered with the payment), or
     2. the academy's own rate for that currency (Settings → Payment Gateways → Exchange rates: 1 USD = 280 PKR).
   With neither, the amount is NOT added to the PKR total; the total says what is missing instead of
   quietly adding dollars to rupees (which gave "Margin −111258%").
   One set of rates for the whole CRM: appSettings.fxRates = { USD: 280, GBP: 355, …, updated, by }.
   ============================================================ */
const LLQA_FX_CURRENCIES = ["USD", "GBP", "CAD", "AUD", "EUR", "AED", "SAR"];
const llqaCurOf = (cur, fallback) => {
  const s = String(cur == null ? "" : cur).trim().toUpperCase();
  if (!s) return fallback || "PKR";
  return s === "RS" || s === "RS." || s === "RUPEES" ? "PKR" : s;
};
// the academy's rates, only the ones that are set (a number above 0)
const llqaRates = (settings) => {
  const r = (settings && settings.fxRates) || {};
  const out = {};
  Object.keys(r).forEach((k) => {
    const v = Number(r[k]);
    if (/^[A-Z]{3}$/.test(k) && k !== "PKR" && v > 0) out[k] = v;
  });
  return out;
};
// one amount → PKR. how: "pkr" (already rupees), "received" (the PKR that reached you), "rate" (your rate), "missing" (no rate)
const llqaToPKR = (amount, cur, rates, received, dayRate) => {
  const a = Number(amount) || 0;
  const cu = llqaCurOf(cur);
  if (cu === "PKR") return { pkr: a, how: "pkr", cur: cu };
  const got = Number(received);
  if (got > 0) return { pkr: got, how: "received", cur: cu };
  // v77: a payment saved with the rate of its day keeps it (later rate changes don't change the past)
  const own = Number(dayRate);
  if (own > 0) return { pkr: a * own, how: "rate", rate: own, cur: cu };
  const r = Number((rates || {})[cu]);
  return r > 0 ? { pkr: a * r, how: "rate", rate: r, cur: cu } : { pkr: 0, how: "missing", cur: cu };
};
// a list → one PKR total, plus the totals per currency and what could not be converted
//   pick(item) → { amount, currency, received }
const llqaSumPKR = (items, rates, pick) => {
  const out = { pkr: 0, byCur: {}, missing: {}, received: 0, rated: 0, n: 0 };
  (items || []).forEach((it) => {
    const p = pick(it) || {};
    const a = Number(p.amount) || 0;
    if (!a) return;
    const cu = llqaCurOf(p.currency, p.fallback);
    out.byCur[cu] = (out.byCur[cu] || 0) + a;
    out.n++;
    const x = llqaToPKR(a, cu, rates, p.received, p.rate); // v77: the rate of the day
    if (x.how === "missing") out.missing[cu] = (out.missing[cu] || 0) + a;
    else {
      out.pkr += x.pkr;
      if (x.how === "received") out.received++;
      if (x.how === "rate") out.rated++;
    }
  });
  return out;
};
const llqaList = (xs) => (xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
const llqaAmt = (n, cur) => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const s = v.toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2 });
  return llqaCurOf(cur) === "PKR" ? "Rs " + s : llqaCurOf(cur) + " " + s;
};
const llqaPKR = (n) => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-US");
// "USD 3,200 · GBP 450" (largest first)
const llqaByCurText = (byCur) =>
  Object.entries(byCur || {})
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => llqaAmt(v, k))
    .join(" · ");
const llqaMissingText = (sum) => {
  const m = Object.entries((sum && sum.missing) || {}).filter(([, v]) => v);
  return m.length ? m.map(([k, v]) => llqaAmt(v, k)).join(" · ") + " not counted (no " + m.map(([k]) => k).join(" / ") + " rate)" : "";
};
// the line under a PKR total: what it is made of, and what is missing
const llqaSumSub = (sum) => {
  if (!sum) return "";
  const foreign = Object.keys(sum.byCur || {}).filter((k) => k !== "PKR");
  const miss = llqaMissingText(sum);
  if (miss) return miss;
  if (!foreign.length) return "";
  return llqaByCurText(sum.byCur) + (sum.received ? " · " + sum.received + " at the PKR received" : "") + " · in PKR at your rates";
};
// open Settings at a section (Settings reads this once when it opens)
const llqaOpenSettings = (section) => {
  try {
    window.__llqaSettingsSection = section || "payments";
    window.__llqaFocusFx = true; // the rates card scrolls itself into view
    const app = typeof LLQAApp !== "undefined" ? LLQAApp.ctx : null; // LLQAAuto.js; loaded before any click
    if (app && typeof app.setPage === "function") app.setPage("settings");
  } catch (e) {}
};
// the note shown above money totals when some amounts could not be converted (or no rates are set yet)
const llqaRatesNote = (sums, rates, key) => {
  const miss = {};
  (sums || []).forEach((s) => Object.entries((s && s.missing) || {}).forEach(([k, v]) => (miss[k] = (miss[k] || 0) + v)));
  const cur = Object.keys(miss).filter((k) => miss[k]);
  if (!cur.length) return null;
  // only someone who can open Settings gets the button; anyone else is told who can fix it
  const canSet = typeof LLQAApp !== "undefined" && LLQAApp.ctx && (LLQAApp.ctx.pages || []).includes("settings");
  return React.createElement(
    "div",
    {
      key: key || "fx-note",
      role: "status",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 12px",
        marginBottom: 12,
        borderRadius: 8,
        background: c.warnBg,
        border: "1px solid " + c.warn,
        color: c.text,
        fontSize: 12,
        lineHeight: 1.45,
      },
    },
    React.createElement(
      "span",
      { style: { flex: "1 1 260px" } },
      // the currencies only: the same money can sit in several totals on a page, so their amounts are not added up
      // here — each total lists what it leaves out
      React.createElement("b", null, llqaList(cur) + (cur.length > 1 ? " have" : " has") + " no exchange rate yet, "),
      "so " + (cur.length > 1 ? "those amounts are" : "that amount is") + " left out of the PKR totals (each total shows what it leaves out). " + (canSet ? "Set a rate in Settings → Payment Gateways → Exchange rates (for example 1 " + cur[0] + " = … PKR), or enter the PKR received with each payment." : "An admin can set a rate in Settings → Payment Gateways → Exchange rates; or enter the PKR received with each payment."),
    ),
    canSet && React.createElement(
      "button",
      {
        type: "button",
        onClick: () => llqaOpenSettings("payments"),
        style: {
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid " + c.warn,
          background: c.bgCard,
          color: c.text,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        },
      },
      "Set rates",
    ),
  );
};
// copies with every amount in PKR — for totals only (each payment at the PKR received, else your rate, else 0)
const llqaPaysInPKR = (pays, rates) =>
  (pays || []).map((p) => ({ ...p, amount: llqaToPKR(p.amount, p.currency || "USD", rates, p.pkrReceived, p.pkrRate).pkr, currency: "PKR" })); // v77: the rate of the day
const llqaLiasInPKR = (lias, rates) =>
  (lias || []).map((l) => {
    const f = (n) => llqaToPKR(n, l.currency || "PKR", rates).pkr;
    return { ...l, amount: f(l.amount), paidAmount: f(l.paidAmount), currency: "PKR" };
  });
// the Autopilot's "≈ … USD" total uses the same rates (USD per unit, worked out from the PKR rates)
const llqaUsdRates = (settings) => {
  const pk = llqaRates(settings);
  if (!(pk.USD > 0)) return null;
  const out = { PKR: 1 / pk.USD };
  Object.keys(pk).forEach((k) => {
    if (k !== "USD") out[k] = pk[k] / pk.USD;
  });
  return out;
};
// Settings → Payment Gateways → Exchange rates (one set for the whole CRM; saved as you type, like every setting)
const LLQAFxCard = ({ settings, update }) => {
  const fx = (settings && settings.fxRates) || {};
  const who = (typeof LLQAApp !== "undefined" && LLQAApp.ctx && LLQAApp.ctx.user && (LLQAApp.ctx.user.name || LLQAApp.ctx.user.role)) || "";
  const set = (k, v) => {
    const n = v === "" ? "" : Number(v);
    update("fxRates", { ...fx, [k]: n === "" || !(n >= 0) ? "" : n, updated: todayPK(), by: who });
  };
  const nSet = LLQA_FX_CURRENCIES.filter((k) => Number(fx[k]) > 0).length;
  const box = React.useRef(null);
  React.useEffect(() => {
    // opened from a "Set rates" button: bring the card into view (it sits below the payment methods)
    if (typeof window !== "undefined" && window.__llqaFocusFx) {
      window.__llqaFocusFx = false;
      const el = box.current;
      if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 60);
    }
  }, []);
  return React.createElement(
    "div",
    { ref: box, id: "llqa-fx-rates", style: { scrollMarginTop: 16 } },
    React.createElement(
    SettingCard,
    { title: "Exchange rates", icon: DollarSign, color: c.cyan },
    React.createElement(
      "p",
      { style: { color: c.textSec, fontSize: 12, lineHeight: 1.5, margin: "0 0 6px" } },
      "Fees come in USD, GBP, CAD …; salaries and expenses are in PKR. Monthly Reports and Accounts add everything up in PKR with these rates. When you record a payment you can also enter the PKR that actually reached you — that amount is used instead of the rate. A currency without a rate is shown separately, never added.",
    ),
    LLQA_FX_CURRENCIES.map((k) =>
      React.createElement(
        SettingRow,
        { key: k, label: "1 " + k + " =" },
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 6 } },
          React.createElement("input", {
            type: "number",
            min: 0,
            step: "0.01",
            inputMode: "decimal",
            value: fx[k] == null ? "" : fx[k],
            placeholder: "not set",
            "aria-label": "PKR for 1 " + k,
            onChange: (e) => set(k, e.target.value),
            style: {
              width: 110,
              padding: "6px 10px",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 5,
              color: c.text,
              fontSize: 12,
              textAlign: "right",
            },
          }),
          React.createElement("span", { style: { color: c.textSec, fontSize: 12, minWidth: 28 } }, "PKR"),
        ),
      ),
    ),
    React.createElement(
      "div",
      { style: { color: c.textMuted, fontSize: 11, marginTop: 10 } },
      nSet
        ? nSet + " of " + LLQA_FX_CURRENCIES.length + " rates set" + (fx.updated ? " · last changed " + fx.updated + (fx.by ? " by " + fx.by : "") : "")
        : "No rates set yet — totals in PKR leave out foreign amounts until a rate is set.",
    ),
    ),
  );
};

/* ============================================================
   v72: office times and fines that really decide what is deducted
   - Office start / exit time per shift (Settings → HR & Attendance); a teacher can have their own.
   - Late, early leaving and time away cost a set rate per minute ("10 minutes = Rs 100" → Rs 10 a minute); every
     minute counts, no limit. Absent, half day and missed class keep fixed amounts. All of it from Settings.
   - Which office day a sign-in belongs to is worked out on the real clock (a night shift that starts at 12:00 AM,
     an evening that ends after midnight); outside office hours (4 h before the start … 4 h after the exit) a
     sign-in makes no attendance. Days off (Settings → Working on Saturday / Sunday, holidays) are never fined.
   - When a teacher left is taken from what the CRM saw: their sign-out, or the last time their CRM was open
     (it notes that every 2 minutes, per computer). With no sign of them at all, nothing is fined automatically.
   - Every day's fine is worked out from the record (times, minutes, rule) and kept with it, with the reason marked by a
     lead / manager (once, with Deduct or Don't deduct) and every admin edit (who, when, from → to, why).
   ============================================================ */
/* the time attendance and fines use is the web server's, not this computer's clock (a clock set back by hand must not
   hide late minutes). Every answer from the server carries its time (the "Date" header): the CRM checks it when it
   opens and every 10 minutes, and goes by it. A second or two is the network, not the clock. */
const LLQAClock = { offset: 0, at: 0 };
const llqaNowMs = () => Date.now() + LLQAClock.offset;
const llqaSyncClock = () => {
  try {
    if (typeof location === "undefined" || typeof fetch !== "function" || /^(localhost|127\.0\.0\.1|)$/.test(location.hostname || "")) return Promise.resolve(false);
    const t0 = Date.now();
    return fetch(location.pathname + "?clk=" + t0, { method: "HEAD", cache: "no-store" })
      .then((r) => {
        const t1 = Date.now();
        const d = Date.parse((r && r.headers && r.headers.get && r.headers.get("date")) || "");
        if (!(d > 0) || t1 - t0 > 10000) return false;
        const off = d + 500 - (t0 + t1) / 2;
        LLQAClock.offset = Math.abs(off) < 2000 ? 0 : Math.round(off);
        LLQAClock.at = t1;
        return true;
      })
      .catch(() => false);
  } catch (e) {
    return Promise.resolve(false);
  }
};
const LLQA_OFFICE_SHIFTS = ["Morning", "Evening", "Night", "Weekend", "Subject"];
const LLQA_OFFICE_DEFAULT = {
  // from the timetable's own slots (first slot → end of the last 30-minute slot); Subject as the old code had it (10:00)
  Morning: { start: "08:00", end: "16:00" },
  Evening: { start: "16:00", end: "00:00" },
  Night: { start: "00:00", end: "08:00" },
  Weekend: { start: "09:00", end: "17:00" },
  Subject: { start: "10:00", end: "18:00" },
};
const LLQA_WIN = 240; // minutes before the start / after the exit that still belong to that office day
const llqaHm2m = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s == null ? "" : s).trim());
  return m ? (+m[1] % 24) * 60 + Math.min(59, +m[2]) : null;
};
const llqaM2hm = (n) => {
  const v = ((Math.round(n) % 1440) + 1440) % 1440;
  return String(Math.floor(v / 60)).padStart(2, "0") + ":" + String(v % 60).padStart(2, "0");
};
// "17:05" → "5:05 PM" (how the office reads times)
const llqaHm12 = (s) => {
  const v = llqaHm2m(s);
  if (v == null) return String(s || "—");
  const h = Math.floor(v / 60), m = v % 60;
  return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");
};
const llqaShiftOf = (t) => {
  const s = String((t && t.shift) || "");
  return LLQA_OFFICE_SHIFTS.find((k) => s.includes(k)) || "Morning";
};
// the rules, from Settings (an admin changes them in Settings → HR & Attendance → Office times & fines)
const llqaFineRules = (settings) => {
  const s = settings || {};
  const num = (v, d) => (v === "" || v == null || !(Number(v) >= 0) ? d : Number(v));
  const rm = Math.max(1, num(s.fineLateMinutes, 10));
  const ra = num(s.fineLateAmount, 100);
  return {
    rateMin: rm,
    rateAmt: ra,
    perMin: ra / rm,
    grace: Math.max(0, Math.floor(num(s.fineGraceMin, 0))),
    absent: num(s.absentFine, 1500),
    halfDay: num(s.halfDayFine, 750),
    absMode: s.absentMode === "salary" ? "salary" : "fixed", // v76: the absent amount — fixed, or one day's salary
    autoAbsent: s.autoAbsent !== false, // v76: absent (unpaid) at closing time with no sign-in
    paidLimit: Math.max(0, Math.floor(num(s.paidLeaveLimit, 0))), // v76: paid leave days a month (0 = no limit)
    missedClass: num(s.missedClassFine, 500),
    autoOutMin: Math.max(0, Math.floor(num(s.autoSignOutMin, 5))),
    silenceMin: Math.max(5, Math.floor(num(s.earlySilenceMin, 15))),
    away: s.fineAway !== false, // time away in the middle of the day (CRM closed that long) is fined too
    teamLeadReasons: s.fineTeamLeadReasons !== false,
    times: { ...LLQA_OFFICE_DEFAULT, ...(s.officeTimes || {}) },
  };
};
const llqaRuleText = (r) =>
  r.rateMin + " min = Rs " + Math.round(r.rateAmt).toLocaleString("en-US") + " (Rs " + (Math.round(r.perMin * 100) / 100).toLocaleString("en-US") + " a minute)" + (r.grace ? ", first " + r.grace + " min free" : "");
// a teacher's office hours: their own, else their shift's (times left empty, or a start equal to the exit, are not
// office hours: the shift's — or the timetable's — are used instead of fining a whole day)
const llqaOkHours = (a, b) => llqaHm2m(a) != null && llqaHm2m(b) != null && llqaHm2m(a) !== llqaHm2m(b);
const llqaOffice = (t, settings) => {
  const r = llqaFineRules(settings);
  const sh = llqaShiftOf(t);
  const set = r.times[sh];
  const def = set && llqaOkHours(set.start, set.end) ? set : LLQA_OFFICE_DEFAULT[sh];
  const own = !!t && llqaOkHours(t.officeStart, t.officeEnd);
  const start = own ? t.officeStart : def.start, end = own ? t.officeEnd : def.end;
  return { start, end, shift: sh, own };
};
// the length of an office day (an exit at or before the start is the next day: 16:00 → 00:00 is 8 hours)
const llqaShiftLen = (o) => {
  const a = llqaHm2m(o.start), b = llqaHm2m(o.end);
  if (a == null || b == null) return 480;
  return b > a ? b - a : b + 1440 - a;
};
// minutes after the start on a 24-hour clock (0 … 1439)
const llqaAfterStart = (o, hm) => {
  const a = llqaHm2m(o.start), b = llqaHm2m(hm);
  if (a == null || b == null) return null;
  return (((b - a) % 1440) + 1440) % 1440;
};
// late, for a time typed by hand: minutes after the start, at most the whole office day (a time more than 4 hours
// after the exit is a time before the next start: not late)
const llqaLateMin = (o, hm) => {
  const d = llqaAfterStart(o, hm);
  if (d == null) return 0;
  const len = llqaShiftLen(o);
  return d <= len + LLQA_WIN ? Math.min(d, len) : 0;
};
// early: minutes before the exit time (0 when the teacher left at or after it)
const llqaEarlyMin = (o, out) => {
  const d = llqaAfterStart(o, out);
  if (d == null) return 0;
  const len = llqaShiftLen(o);
  return d < len ? len - d : 0;
};
// a moment in Pakistan time (UTC+5, no clock change) and back
const llqaPkMs = (date, hm) => Date.parse(String(date).slice(0, 10) + "T" + llqaM2hm(llqaHm2m(hm) || 0) + ":00+05:00");
const llqaPkHm = (ms) => {
  const d = new Date(ms + 5 * 3600000);
  return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0");
};
const llqaPkDate = (ms) => new Date(ms + 5 * 3600000).toISOString().slice(0, 10);
// the office day a moment belongs to: from 4 hours before its start to 4 hours after its exit (an evening that ends
// after midnight belongs to the day it started; 11:55 PM before a 12:00 AM start belongs to the next day). Outside
// that: null (signing in then makes no attendance). after = minutes after the start (negative = before it).
const llqaOfficeDay = (o, ms) => {
  const a = llqaHm2m(o && o.start);
  if (a == null || !(ms > 0)) return null;
  const len = llqaShiftLen(o);
  const n = llqaHm2m(llqaPkHm(ms));
  const d = (((n - a) % 1440) + 1440) % 1440;
  const m0 = Math.floor(ms / 60000) * 60000;
  let startMs = null, after = 0;
  if (d <= len + LLQA_WIN) {
    startMs = m0 - d * 60000;
    after = d;
  } else if (1440 - d <= LLQA_WIN) {
    startMs = m0 + (1440 - d) * 60000;
    after = d - 1440;
  } else return null;
  return { date: llqaPkDate(startMs), startMs, endMs: startMs + len * 60000, after, len };
};
// a working day for this teacher? (Settings → Working on Saturday / Sunday; holidays in the calendar; the Weekend
// shift works Saturday and Sunday)
const llqaWorkDay = (t, date, settings) => {
  const s = settings || {};
  try {
    const hol = typeof llqaHolidayOn === "function" ? llqaHolidayOn(date, "holiday") : null;
    if (hol) return { ok: false, why: "holiday" + (hol.name || hol.title ? " (" + (hol.name || hol.title) + ")" : "") };
  } catch (e) {}
  const wd = new Date(String(date).slice(0, 10) + "T12:00:00Z").getUTCDay();
  const name = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][wd] || "";
  if (llqaShiftOf(t) === "Weekend") return wd === 0 || wd === 6 ? { ok: true } : { ok: false, why: name + " (Weekend shift)" };
  if (wd === 6 && s.workingSat === false) return { ok: false, why: "Saturday is not a working day" };
  if (wd === 0 && s.workingSun === false) return { ok: false, why: "Sunday is not a working day" };
  return { ok: true };
};
/* ---------- when the CRM was open: per office day, per computer, as spans on a two-day clock ----------
   minute 1440 = 12:00 AM of the office day (so the evening before is 1200…1439, after midnight 2880+):
   "1435-1530,1545-1678". A new span starts after a gap of the "gone" minutes (Settings, 15 by default). */
const llqaDayMin = (date, ms) => Math.floor((ms - llqaPkMs(date, "00:00")) / 60000) + 1440;
const llqaDayMs = (date, m) => llqaPkMs(date, "00:00") + (m - 1440) * 60000;
const llqaSpans = (s) =>
  String(s || "")
    .split(",")
    .map((p) => {
      const m = /^\s*(\d+)-(\d+)\s*$/.exec(p);
      return m && +m[2] >= +m[1] ? [+m[1], +m[2]] : null;
    })
    .filter(Boolean);
const llqaSpanStr = (arr) => arr.map((x) => x[0] + "-" + x[1]).join(",");
const llqaSpanAdd = (s, m, gap) => {
  const arr = llqaSpans(s);
  const last = arr[arr.length - 1];
  if (last && m <= last[1]) return llqaSpanStr(arr); // nothing new
  if (last && m - last[1] < gap) last[1] = m;
  else arr.push([m, m]);
  return llqaSpanStr(arr.slice(-40));
};
// every computer together: spans that overlap or are closer than `gap` join
const llqaSpanUnion = (strs, gap) => {
  const all = []
    .concat(...(strs || []).map(llqaSpans))
    .sort((a, b) => a[0] - b[0]);
  const out = [];
  all.forEach(([a, b]) => {
    const l = out[out.length - 1];
    if (l && a - l[1] < gap) l[1] = Math.max(l[1], b);
    else out.push([a, b]);
  });
  return out;
};
const llqaIsOpen = (r) => !!r && ["Present", "Late", "Half Day"].includes(r.status) && (r.checkOut === "?" || r.checkOut === "-" || r.checkOut == null || r.checkOut === "");
// a teacher's day that is still open (signed in, not out): the newest within yesterday … tomorrow
const llqaOpenRecIdx = (recs, todayStr) => {
  let best = -1;
  (recs || []).forEach((r, i) => {
    if (!llqaIsOpen(r)) return;
    const diff = Math.abs((Date.parse(r.date + "T00:00:00Z") - Date.parse(todayStr + "T00:00:00Z")) / 864e5);
    if (diff <= 1 && (best < 0 || String(r.date) > String(recs[best].date))) best = i;
  });
  return best;
};
// a day closed. how: "manual" (the teacher signed out) / "admin" (an admin checked them out) → they left now;
// "auto" (signed out by the CRM after the exit) / "silence" (their CRM stayed closed) → they left at the end of the
// last span that began before the exit. Leaving within 3 minutes of the exit that way counts as a complete day
// (the CRM notes itself every 2 minutes). Gaps of the "gone" minutes or more inside office hours are time away.
const llqaCloseDay = (rec, t, settings, spans, nowMs, how) => {
  const rules = llqaFineRules(settings);
  const off = llqaOffice(t, settings);
  const o = { start: rec.officeStart || off.start, end: rec.officeEnd || off.end };
  const len = llqaShiftLen(o);
  const startM = 1440 + (llqaHm2m(o.start) || 0);
  const endM = startM + len;
  let inM = llqaHm2m(rec.checkIn);
  if (inM != null) {
    inM += 1440;
    if (inM > endM + LLQA_WIN) inM -= 1440;
    if (inM < startM - LLQA_WIN) inM += 1440;
  }
  const sp = (spans || []).filter((x) => Array.isArray(x) && x[1] >= x[0]);
  const byHand = how === "manual" || how === "admin";
  let left = null;
  if (byHand) left = llqaDayMin(rec.date, nowMs);
  else {
    sp.forEach(([a, b]) => {
      if (a < endM && (left == null || b > left)) left = b;
    });
    if (left == null && inM != null && sp.length) left = inM;
  }
  if (left == null) {
    // nothing seen of them at all: no automatic fine — an admin can set the time by hand
    return { ...rec, officeStart: o.start, officeEnd: o.end, checkOut: "—", earlyMin: 0, awayMin: 0, away: "", signOut: how, unknownOut: true };
  }
  const complete = byHand ? left >= endM : left >= endM - 3;
  const earlyMin = complete ? 0 : Math.max(0, endM - left);
  // time away: gaps between the spans, inside office hours and before they left
  const lo = Math.max(startM, inM == null ? startM : inM), hi = Math.min(endM, left);
  let awayMin = 0;
  const away = [];
  for (let i = 1; i < sp.length; i++) {
    const g0 = Math.max(sp[i - 1][1], lo), g1 = Math.min(sp[i][0], hi);
    if (sp[i][0] - sp[i - 1][1] >= rules.silenceMin && g1 > g0) {
      awayMin += g1 - g0;
      if (away.length < 6) away.push(llqaPkHm(llqaDayMs(rec.date, g0)) + "-" + llqaPkHm(llqaDayMs(rec.date, g1)));
    }
  }
  const outMs = llqaDayMs(rec.date, byHand ? left : complete ? endM : left);
  return {
    ...rec,
    officeStart: o.start,
    officeEnd: o.end,
    checkOut: llqaPkHm(outMs),
    earlyMin,
    awayMin,
    away: away.join(","),
    lastSeen: sp.length ? llqaPkHm(llqaDayMs(rec.date, sp[sp.length - 1][1])) : rec.lastSeen || "",
    signOut: how,
    unknownOut: false,
  };
};
// signed out (or checked out) before the exit and back again: the day is open again; time away is worked out when
// it closes
const llqaReopenDay = (rec) => ({ ...rec, checkOut: "?", earlyMin: 0, awayMin: 0, away: "", signOut: "", unknownOut: false, reopened: (Number(rec.reopened) || 0) + 1 });
// the rule a day is fined by is the one in force when the day began (kept with it as fineSet): changing the rate
// later changes the days that begin after it, never days already worked out
const llqaFineSnap = (settings) => {
  const r = llqaFineRules(settings);
  return { m: r.rateMin, a: r.rateAmt, g: r.grace, ab: r.absent, hd: r.halfDay, mc: r.missedClass, aw: r.away, abm: r.absMode };
};
const llqaRecRules = (rec, settings) => {
  const f = rec && rec.fineSet;
  if (!f || typeof f !== "object") return settings;
  return { ...(settings || {}), fineLateMinutes: f.m, fineLateAmount: f.a, fineGraceMin: f.g, absentFine: f.ab, halfDayFine: f.hd, missedClassFine: f.mc, fineAway: f.aw !== false, absentMode: f.abm || "fixed" };
};
// one day's fine, worked out from the record — nothing here is guessed
const llqaDayFine = (rec, settings) => {
  const r = llqaFineRules(llqaRecRules(rec, settings));
  const reasons = (rec && rec.reasons) || {};
  const waived = (k) => !!(reasons[k] && reasons[k].decision === "waive");
  const st = String((rec && rec.status) || "");
  const out = { late: null, early: null, away: null, day: null, total: 0, rule: llqaRuleText(r), off: rec && rec.offDay ? String(rec.offDay) : "" };
  if (out.off) return out; // a day off (not a working day / holiday): never fined
  if (st === "Absent") {
    // v76: the absent amount, or one day's salary; the CRM's own mark says why
    const full = llqaAbsAmt(rec, r, false);
    out.day = { kind: rec.auto ? "Absent (no sign-in by " + llqaHm12(rec.officeEnd) + ")" : "Absent", amount: waived("day") ? 0 : full, full, waived: waived("day") };
  } else if (st === "On Leave" && rec.paid === false) {
    // v76: unpaid leave costs what an absence costs (a half day, half)
    const full = llqaAbsAmt(rec, r, !!rec.halfDay);
    out.day = { kind: "Unpaid leave" + (rec.halfDay ? " (half day)" : ""), amount: waived("day") ? 0 : full, full, waived: waived("day") };
  }
  else if (st === "Half Day") out.day = { kind: "Half Day", amount: waived("day") ? 0 : r.halfDay, full: r.halfDay, waived: waived("day") };
  else if (st === "Missed Class") out.day = { kind: "Missed Class", amount: waived("day") ? 0 : r.missedClass, full: r.missedClass, waived: waived("day") };
  // minutes count on a working day only (a half day's fine already covers the hours not worked)
  if (st === "Present" || st === "Late") {
    const lm = Math.max(0, (Number(rec.lateMin) || 0) - r.grace);
    if (lm > 0) {
      const full = Math.round(lm * r.perMin);
      out.late = { min: Number(rec.lateMin) || 0, counted: lm, amount: waived("late") ? 0 : full, full, waived: waived("late") };
    }
    const em = Math.max(0, Number(rec.earlyMin) || 0);
    if (em > 0) {
      const full = Math.round(em * r.perMin);
      out.early = { min: em, amount: waived("early") ? 0 : full, full, waived: waived("early") };
    }
    const am = Math.max(0, Number(rec.awayMin) || 0);
    if (am > 0) {
      const full = r.away ? Math.round(am * r.perMin) : 0;
      out.away = { min: am, amount: waived("away") ? 0 : full, full, waived: waived("away"), counted: r.away };
    }
  }
  out.total = (out.day ? out.day.amount : 0) + (out.late ? out.late.amount : 0) + (out.early ? out.early.amount : 0) + (out.away ? out.away.amount : 0);
  return out;
};
// the record with its fine worked out; an admin's own amount (override) wins. Every change of amount is logged.
const llqaWithFine = (rec, settings, by, why) => {
  if (!rec) return rec;
  const base = rec.fineSet && typeof rec.fineSet === "object" ? rec : { ...rec, fineSet: llqaFineSnap(settings) };
  const calc = llqaDayFine(base, settings);
  const amount = rec.fineOverride != null && rec.fineOverride !== "" ? Math.max(0, Number(rec.fineOverride) || 0) : calc.total;
  const next = { ...base, fine: amount, fineRule: calc.rule, fineParts: { late: calc.late ? calc.late.amount : 0, early: calc.early ? calc.early.amount : 0, away: calc.away ? calc.away.amount : 0, day: calc.day ? calc.day.amount : 0 } };
  if (Number(rec.fine || 0) !== amount) {
    next.fineLog = [...(rec.fineLog || []), { at: new Date(llqaNowMs()).toISOString(), by: by || "CRM", from: Number(rec.fine || 0), to: amount, why: why || "worked out from the times" }].slice(-12);
  }
  return next;
};
// now in Pakistan ("HH:MM" and the date)
const llqaNowPK = () => {
  const ms = llqaNowMs();
  return { hm: llqaPkHm(ms), date: llqaPkDate(ms), iso: new Date(ms).toISOString(), ms };
};
// "2026-11-10T12:07:00Z" → "10 Nov, 5:07 PM" (Pakistan time)
const llqaPkWhen = (iso) => {
  const ms = Date.parse(iso);
  if (!(ms > 0)) return String(iso || "");
  const d = llqaPkDate(ms);
  return Number(d.slice(8, 10)) + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(d.slice(5, 7)) - 1] + ", " + llqaHm12(llqaPkHm(ms));
};
/* ---------- who may do what ---------- */
const llqaUserCan = (user, perm) => {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return !!(user.customPermissions && user.customPermissions[perm]);
};
// mark a reason (once) and choose Deduct / Don't deduct: admin; a team lead for their own teachers (if allowed);
// a role given "Mark Late / Early Reasons"
const llqaCanMarkReason = (user, teacher, settings) => {
  if (!user) return false;
  if (user.role === "superadmin" || llqaUserCan(user, "Mark Late / Early Reasons")) return true;
  if (user.role === "teamlead" && llqaFineRules(settings).teamLeadReasons) {
    const lead = String((teacher && (teacher.teamLead || teacher.lead)) || "").trim().toLowerCase();
    return !!lead && lead === String(user.name || "").trim().toLowerCase();
  }
  return false;
};
// change a reason once marked, or any fine: admin, or a role given "Edit Fines"
const llqaCanEditFines = (user) => llqaUserCan(user, "Edit Fines");
// marking a day by hand (P / L / A / leave / half day, check-out, corrections): an admin, or a role given "Mark
// Attendance". A team lead marks their own teachers' days that have nothing yet; a day already marked or signed in
// is changed by an admin only (like a reason, it is not changed twice). A teacher never marks their own day.
const llqaCanMarkAll = (user) => llqaUserCan(user, "Mark Attendance");
const llqaCanMarkDay = (user, teacher, rec) => {
  if (llqaCanMarkAll(user)) return true;
  if (!user || user.role !== "teamlead" || rec) return false;
  const lead = String((teacher && (teacher.teamLead || teacher.lead)) || "").trim().toLowerCase();
  return !!lead && lead === String(user.name || "").trim().toLowerCase();
};
const llqaCanSetOffice = (user) => llqaUserCan(user, "Set Office Times & Fines");

/* ============================================================
   v72: attendance kept by month, in 16 parts
   One cloud document holds at most 1 MB. All attendance in one document (as before) fills it in about two months
   with ~90 people signing in daily — after that nothing more could be saved — and every "still here" note rewrote
   it for every open screen. Now:
   - attendance/2026-11_07 … one document per month per part (a teacher always falls in the same part). A teacher's
     browser loads only its own part; everyone else loads all parts of this month and last, and older months when a
     screen asks for them.
   - data/attendanceHistory (the single document before v72) is still read, for the days the months don't have.
   - presence/2026-11-10 holds when each teacher's CRM was open that office day (noted every 2 minutes, read by the
     admin's screens) — small, and kept out of the attendance documents.
   A change is sent day by day: only the days that changed are written, on top of the newest copy in the cloud, so
   two people changing different days of the same teacher never undo each other.
   ============================================================ */
const LLQA_ATT_PARTS = 16;
const llqaAttPart = (uid) => {
  let h = 5381;
  const s = String(uid);
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h % LLQA_ATT_PARTS;
};
const llqaAttPath = (ym, part) => "attendance/" + ym + "_" + String(part).padStart(2, "0");
const llqaPrevYm = (ym) => {
  const y = Number(String(ym).slice(0, 4)), m = Number(String(ym).slice(5, 7));
  return m <= 1 ? y - 1 + "-12" : y + "-" + String(m - 1).padStart(2, "0");
};
// last month, this month — and on a month's last day the next one too (a night shift that starts at 12:00 AM on
// the 1st is signed in to before midnight)
const llqaAttBaseMonths = () => {
  const now = llqaNowMs();
  const ym = llqaPkDate(now).slice(0, 7), next = llqaPkDate(now + 864e5).slice(0, 7);
  return next === ym ? [llqaPrevYm(ym), ym] : [llqaPrevYm(ym), ym, next];
};
const llqaAttBadKey = (k) => k === "undefined" || k === "null" || k === "";
// one view of everything loaded: {teacherId: [day records, oldest first]}; the month parts win over the old document
const llqaAttMerge = (parts, legacy) => {
  const by = {};
  const put = (uid, r, keep) => {
    if (llqaAttBadKey(uid) || !r || typeof r !== "object" || !r.date) return;
    const m = by[uid] || (by[uid] = {});
    if (keep && m[r.date]) return;
    m[r.date] = r;
  };
  (parts || []).forEach((d) =>
    Object.keys(d || {}).forEach((uid) => {
      if (Array.isArray(d[uid])) d[uid].forEach((r) => put(uid, r, false));
    }),
  );
  Object.keys(legacy || {}).forEach((uid) => {
    if (Array.isArray(legacy[uid])) legacy[uid].forEach((r) => put(uid, r, true));
  });
  const out = {};
  Object.keys(by).forEach((uid) => {
    out[uid] = Object.keys(by[uid])
      .sort()
      .map((d) => by[uid][d]);
  });
  return out;
};
// what changed between two views, day by day, grouped by the document each day lives in:
// {path: {teacherId: {put: {date: record}, del: [dates]}}}
const llqaAttDiff = (base, next) => {
  const out = {};
  const uids = new Set([...Object.keys(base || {}), ...Object.keys(next || {})]);
  uids.forEach((uid) => {
    if (llqaAttBadKey(uid)) return;
    const b = {}, n = {};
    (Array.isArray((base || {})[uid]) ? base[uid] : []).forEach((r) => r && r.date && (b[r.date] = r));
    (Array.isArray((next || {})[uid]) ? next[uid] : []).forEach((r) => r && r.date && (n[r.date] = r));
    const slot = (date) => {
      const p = llqaAttPath(String(date).slice(0, 7), llqaAttPart(uid));
      const at = (out[p] = out[p] || {});
      return (at[uid] = at[uid] || { put: {}, del: [] });
    };
    Object.keys(n).forEach((d) => {
      if (!b[d] || llqaStable(b[d]) !== llqaStable(n[d])) slot(d).put[d] = n[d];
    });
    Object.keys(b).forEach((d) => {
      if (!n[d]) slot(d).del.push(d);
    });
  });
  return out;
};
// one document with the changes made (other days and other people exactly as they are now in the cloud)
const llqaAttApply = (data, changes) => {
  const next = { ...(data || {}) };
  Object.keys(changes || {}).forEach((uid) => {
    const ch = changes[uid];
    const m = {};
    (Array.isArray(next[uid]) ? next[uid] : []).forEach((r) => r && r.date && (m[r.date] = r));
    (ch.del || []).forEach((d) => delete m[d]);
    Object.keys(ch.put || {}).forEach((d) => (m[d] = ch.put[d]));
    const arr = Object.keys(m)
      .sort()
      .map((d) => m[d]);
    if (arr.length) next[uid] = arr;
    else delete next[uid];
  });
  return next;
};
const LLQAAtt = { paths: [], legacy: {}, need: null };
const llqaAttView = () => llqaAttMerge(LLQAAtt.paths.map((p) => LLQACloud.doc(p, {}).data), LLQAAtt.legacy);
const llqaAttReady = (paths) => (paths || LLQAAtt.paths).every((p) => LLQACloud.ready("doc:" + p));
// a document's changes are written once its newest copy has come from the cloud (never on top of an old copy)
const llqaAttSend = (path, changes, tries) => {
  const st = LLQACloud.doc(path, {});
  st.start();
  if (!LLQACloud.ready("doc:" + path)) {
    if ((tries || 0) < 300) setTimeout(() => llqaAttSend(path, changes, (tries || 0) + 1), 1000);
    else console.error("Attendance not saved (" + path + "): the cloud did not answer in 5 minutes", changes);
    return;
  }
  st.set((d) => llqaAttApply(d, changes));
};
// the setter every screen uses: a new view, or a function of the newest view
const llqaAttWrite = (v) => {
  const base = llqaAttView();
  const next = typeof v === "function" ? v(base) : v;
  if (!next || typeof next !== "object" || Array.isArray(next) || next === base) return;
  const diff = llqaAttDiff(base, next);
  Object.keys(diff).forEach((p) => {
    const ym = p.slice(11, 18);
    if (typeof LLQAAtt.need === "function") LLQAAtt.need(ym);
    llqaAttSend(p, diff[p], 0);
  });
};
// run fn once these documents are part of what the screens see and their newest copy has come from the cloud
const llqaWhenAttReady = (paths, fn, tries) => {
  paths.forEach((p) => {
    if (typeof LLQAAtt.need === "function") LLQAAtt.need(p.slice(11, 18));
    LLQACloud.doc(p, {}).start();
  });
  if (paths.every((p) => LLQAAtt.paths.includes(p) && LLQACloud.ready("doc:" + p))) return fn();
  if ((tries || 0) < 300) setTimeout(() => llqaWhenAttReady(paths, fn, (tries || 0) + 1), 1000);
  else console.error("Attendance not saved: the cloud did not answer in 5 minutes", paths);
};
// days still open whose exit time (+ the "gone" minutes; at once when an admin asks) has passed are closed from when
// the teacher's CRM was last open. Days from before v72 (no office time kept) close the old way — at the last
// "still here" time — without a fine.
const llqaCloseFinished = async (teachersList, settings, by, atOnce) => {
  if (!llqaAttReady()) return 0;
  const rules = llqaFineRules(settings);
  const nowMs = llqaNowMs();
  const wait = atOnce ? 0 : Math.max(rules.silenceMin, rules.autoOutMin + 5) * 60000;
  const view = llqaAttView();
  const todo = [];
  Object.keys(view).forEach((uid) =>
    (view[uid] || []).forEach((r) => {
      if (!llqaIsOpen(r)) return;
      if (!r.officeStart || !r.officeEnd) {
        if (String(r.date) < llqaPkDate(nowMs)) todo.push({ uid, date: r.date, old: true });
        return;
      }
      const endMs = llqaPkMs(r.date, r.officeStart) + llqaShiftLen({ start: r.officeStart, end: r.officeEnd }) * 60000;
      if (nowMs >= endMs + wait) todo.push({ uid, date: r.date });
    }),
  );
  if (!todo.length) return 0;
  const days = [...new Set(todo.filter((x) => !x.old).map((x) => x.date))];
  await Promise.all(days.map((d) => LLQAPresence.fetchDay(d)));
  let n = 0;
  llqaAttWrite((prev) => {
    const next = { ...prev };
    todo.forEach(({ uid, date, old }) => {
      const list = next[uid] || [];
      const i = list.findIndex((h) => h.date === date);
      if (i < 0 || !llqaIsOpen(list[i])) return;
      let rec;
      if (old) rec = { ...list[i], checkOut: llqaHm2m(list[i].lastActive) != null ? list[i].lastActive : "—", signOut: "silence" };
      else {
        const t = (teachersList || []).find((x) => String(x.id) === String(uid));
        const closed = llqaCloseDay(list[i], t, settings, LLQAPresence.spans(date, uid, rules.silenceMin), llqaNowMs(), "silence");
        const why = closed.unknownOut
          ? "day closed — no record of when they left (not fined)"
          : closed.earlyMin
            ? "CRM last open " + llqaHm12(closed.checkOut) + ", " + closed.earlyMin + " min before " + llqaHm12(closed.officeEnd)
            : closed.awayMin
              ? "day complete, " + closed.awayMin + " min away"
              : "day complete";
        rec = llqaWithFine(closed, settings, by || "CRM", why);
      }
      next[uid] = list.map((h, j) => (j === i ? rec : h));
      n++;
    });
    return next;
  });
  return n;
};
// App: the attendance a signed-in person needs. A teacher: their own part; a parent: none; staff: every part.
const useLLQAAttendance = (user, legacy) => {
  const [months, setMonths] = React.useState(llqaAttBaseMonths);
  const [ver, setVer] = React.useState(0);
  const own = user && user.role === "teacher" && (user.id != null || user.teacherId != null) ? user.id != null ? user.id : user.teacherId : null;
  const scope = !user || user.role === "parent" ? "none" : own != null ? "own:" + own : "all"; // a parent loads none
  const paths = React.useMemo(() => {
    if (scope === "none") return [];
    const out = [];
    months.forEach((ym) => {
      if (own != null) out.push(llqaAttPath(ym, llqaAttPart(own)));
      else for (let p = 0; p < LLQA_ATT_PARTS; p++) out.push(llqaAttPath(ym, p));
    });
    return out;
  }, [months.join(","), scope]);
  LLQAAtt.paths = paths;
  LLQAAtt.legacy = legacy || {};
  const key = paths.join("|");
  React.useEffect(() => {
    const offs = paths.map((p) => {
      const st = LLQACloud.doc(p, {});
      const off = st.subscribe(() => setVer((n) => n + 1));
      st.start();
      return off;
    });
    setVer((n) => n + 1);
    return () => offs.forEach((f) => f());
  }, [key]);
  const need = React.useCallback((ym) => {
    if (!/^\d{4}-\d{2}$/.test(String(ym || ""))) return;
    setMonths((m) => (m.includes(ym) ? m : [...m, ym].sort()));
  }, []);
  LLQAAtt.need = need;
  // a new month begins while the CRM is open
  React.useEffect(() => {
    const id = setInterval(() => {
      const b = llqaAttBaseMonths();
      setMonths((m) => (b.every((x) => m.includes(x)) ? m : [...new Set([...m, ...b])].sort()));
    }, 300000);
    return () => clearInterval(id);
  }, []);
  const view = React.useMemo(() => llqaAttMerge(paths.map((p) => LLQACloud.doc(p, {}).data), legacy || {}), [ver, legacy, key]);
  return [view, llqaAttWrite, need];
};

/* ---------- when each teacher's CRM was open (presence/<office day>) ---------- */
const llqaOwnSpans = (uid, date) => {
  try {
    return localStorage.getItem("llqa.pres." + uid + "." + date) || "";
  } catch (e) {
    return "";
  }
};
// the teacher's own computer notes "open now" (kept on the computer too, so a reload goes on from it)
const llqaPresenceBeat = (uid, date, ms, gap) => {
  const cur = llqaOwnSpans(uid, date);
  const next = llqaSpanAdd(cur, llqaDayMin(date, ms), gap);
  if (next === cur) return next;
  try {
    localStorage.setItem("llqa.pres." + uid + "." + date, next);
  } catch (e) {}
  LLQACloud.rawMerge("presence/" + date, { [String(uid)]: { [LLQACloud.deviceId()]: next } });
  return next;
};
// old notes on this computer (more than 3 days) are dropped
const llqaPresencePrune = () => {
  try {
    const old = llqaPkDate(llqaNowMs() - 3 * 864e5);
    const drop = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = /^llqa\.pres\..+\.(\d{4}-\d{2}-\d{2})$/.exec(k || "");
      if (m && m[1] < old) drop.push(k);
    }
    drop.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
};
const LLQAPresence = (() => {
  const data = {}; // office day → {teacherId: {computer: spans}}
  const live = {}; // office day → stop listening
  const subs = new Set();
  const emit = () =>
    subs.forEach((f) => {
      try {
        f();
      } catch (e) {}
    });
  // listen to these office days (the admin's screens: yesterday, today, tomorrow)
  const watch = (dates) => {
    Object.keys(live).forEach((d) => {
      if (!dates.includes(d)) {
        live[d]();
        delete live[d];
      }
    });
    dates.forEach((d) => {
      if (live[d]) return;
      live[d] = LLQACloud.rawListen("presence/" + d, (v) => {
        data[d] = v || {};
        emit();
      });
    });
  };
  // one day, read once (an older day being closed)
  const fetchDay = async (d) => {
    if (live[d] && data[d]) return data[d];
    try {
      const v = await LLQACloud.rawGet("presence/" + d);
      if (v) data[d] = v;
    } catch (e) {}
    return data[d] || null;
  };
  // a teacher's spans for an office day: every computer together, with this computer's own
  const spans = (d, uid, gap) => {
    const per = (data[d] || {})[String(uid)] || {};
    const strs = Object.keys(per)
      .map((k) => per[k])
      .filter((x) => typeof x === "string");
    const mine = llqaOwnSpans(uid, d);
    if (mine) strs.push(mine);
    return llqaSpanUnion(strs, gap);
  };
  const known = (d) => !!data[d];
  return {
    watch,
    fetchDay,
    spans,
    known,
    peek: (d) => data[d] || null,
    subscribe: (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
})();
// a teacher right now: "here" (their CRM seen in the last few minutes), else when it was last seen today
const llqaSeen = (uid, date, settings, nowMs) => {
  const sp = LLQAPresence.spans(date, uid, llqaFineRules(settings).silenceMin);
  if (!sp.length) return null;
  const lastMs = llqaDayMs(date, sp[sp.length - 1][1]);
  return { here: (nowMs || llqaNowMs()) - lastMs < 5 * 60000, at: llqaPkHm(lastMs), spans: sp };
};

/* ---------- v72: Settings → HR & Attendance → Office times & fines ---------- */
const llqaTimeInput = (value, onChange, label, key) =>
  React.createElement("input", {
    key,
    type: "time",
    value: value || "",
    "aria-label": label,
    onChange: (e) => onChange(e.target.value),
    style: { padding: "5px 8px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 5, color: c.text, fontSize: 12 },
  });
const llqaNumInput = (value, onChange, label, width, key) =>
  React.createElement("input", {
    key,
    type: "number",
    min: 0,
    value: value == null ? "" : value,
    "aria-label": label,
    onChange: (e) => onChange(e.target.value),
    style: { width: width || 80, padding: "6px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 5, color: c.text, fontSize: 12, textAlign: "right" },
  });
const LLQAOfficeCard = ({ settings, update, teachers, setTeachers }) => {
  const r = llqaFineRules(settings);
  const times = (settings && settings.officeTimes) || {};
  const pick = ""; // the list always shows its prompt: picking adds at once
  const setTime = (sh, k, v) => update("officeTimes", { ...times, [sh]: { ...LLQA_OFFICE_DEFAULT[sh], ...(times[sh] || {}), [k]: v } });
  const own = (teachers || []).filter((t) => llqaOkHours(t.officeStart, t.officeEnd));
  const noShift = (teachers || []).filter((t) => !own.includes(t) && !LLQA_OFFICE_SHIFTS.some((k) => String(t.shift || "").includes(k)));
  const setOwn = (id, k, v) => typeof setTeachers === "function" && setTeachers((teachers || []).map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const addOwn = (id) => {
    const t = (teachers || []).find((x) => String(x.id) === String(id));
    if (!t || typeof setTeachers !== "function") return;
    const o = llqaOffice(t, settings);
    setTeachers((teachers || []).map((x) => (x.id === t.id ? { ...x, officeStart: o.start, officeEnd: o.end } : x)));
  };
  const row = (label, desc, el, key) => React.createElement(SettingRow, { key, label, desc }, el);
  const hint = { color: c.textSec, fontSize: 12, lineHeight: 1.5, margin: "0 0 6px" };
  const head = (t) => React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: c.text, margin: "14px 0 2px" } }, t);
  return React.createElement(
    SettingCard,
    { title: "Office times & fines", icon: Clock, color: c.danger },
    React.createElement(
      "p",
      { style: hint },
      "A teacher who signs in after their start time, leaves before their exit time, or is away in between is fined for every minute at your rate. The CRM notes every 2 minutes that a teacher's CRM is open, and signs them out by itself a few minutes after their exit time. When they left comes from their sign-out, or from the last time their CRM was open. Every fine keeps its times, minutes and rule, and a lead or manager can mark a reason with Deduct or Don't deduct. Days off (Working on Saturday / Sunday in Settings → HR & Attendance, and holidays in the calendar) are never fined.",
    ),
    head("Office times (Pakistan time)"),
    LLQA_OFFICE_SHIFTS.map((sh) =>
      row(
        sh,
        sh === "Evening" || sh === "Night" ? "an exit at or before the start is the next day" : sh === "Weekend" ? "Saturday and Sunday" : "",
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
          llqaTimeInput(r.times[sh].start, (v) => setTime(sh, "start", v), sh + " start", "s"),
          React.createElement("span", { key: "to", style: { color: c.textSec, fontSize: 12 } }, "to"),
          llqaTimeInput(r.times[sh].end, (v) => setTime(sh, "end", v), sh + " exit", "e"),
        ),
        "t-" + sh,
      ),
    ),
    noShift.length > 0 &&
      React.createElement(
        "p",
        { style: { ...hint, color: c.warn, margin: "6px 0 0" } },
        noShift.length + " teacher" + (noShift.length === 1 ? " has" : "s have") + " no shift, so Morning times are used: " + noShift.slice(0, 5).map((t) => t.name).join(", ") + (noShift.length > 5 ? " …" : "") + ". Set their shift in Teachers, or give them their own hours below.",
      ),
    head("Teachers with their own hours"),
    own.length
      ? own.map((t) =>
          row(
            t.name,
            t.shift || "",
            React.createElement(
              "div",
              { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
              llqaTimeInput(t.officeStart, (v) => setOwn(t.id, "officeStart", v), t.name + " start", "s"),
              React.createElement("span", { key: "to", style: { color: c.textSec, fontSize: 12 } }, "to"),
              llqaTimeInput(t.officeEnd, (v) => setOwn(t.id, "officeEnd", v), t.name + " exit", "e"),
              React.createElement(
                "button",
                {
                  key: "x",
                  type: "button",
                  onClick: () => typeof setTeachers === "function" && setTeachers((teachers || []).map((x) => (x.id === t.id ? { ...x, officeStart: "", officeEnd: "" } : x))),
                  style: { padding: "4px 10px", borderRadius: 6, border: "1px solid " + c.border, background: c.bgCard, color: c.textSec, fontSize: 11, cursor: "pointer" },
                },
                "Use shift times",
              ),
            ),
            "o-" + t.id,
          ),
        )
      : React.createElement("p", { style: { ...hint, margin: "4px 0 8px" } }, "Everyone uses their shift's times."),
    (teachers || []).length > own.length &&
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 8, margin: "4px 0 6px", flexWrap: "wrap" } },
        React.createElement(
          "div",
          { style: { minWidth: 220, flex: "0 1 280px" } },
          React.createElement(LLQASelect, {
            value: pick,
            onChange: (e) => addOwn(e.target.value), // picking a teacher gives them their own hours at once (their shift's to start)
            placeholder: "Give a teacher their own hours…",
            title: "Give a teacher their own hours",
            children: [React.createElement("option", { key: "", value: "" }, "Give a teacher their own hours…")].concat(
              (teachers || []).filter((t) => !own.includes(t)).map((t) => React.createElement("option", { key: t.id, value: String(t.id) }, t.name + " (" + llqaShiftOf(t) + ")")),
            ),
          }),
        ),
        React.createElement("span", { style: { color: c.textSec, fontSize: 11 } }, "then change their times above"),
      ),
    head("Fines (PKR)"),
    row(
      "Late, early or away: every minute",
      "Rs " + (Math.round(r.perMin * 100) / 100).toLocaleString("en-US") + " a minute",
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 6 } },
        llqaNumInput(settings.fineLateMinutes == null ? 10 : settings.fineLateMinutes, (v) => update("fineLateMinutes", v), "Minutes in the rate", 70, "m"),
        React.createElement("span", { key: "a", style: { color: c.textSec, fontSize: 12 } }, "min = Rs"),
        llqaNumInput(settings.fineLateAmount == null ? 100 : settings.fineLateAmount, (v) => update("fineLateAmount", v), "Rupees in the rate", 90, "r"),
      ),
      "rate",
    ),
    row("Free minutes before a late fine starts", "0 = every minute counts", llqaNumInput(r.grace, (v) => update("fineGraceMin", v), "Free minutes", 70), "grace"),
    row(
      "Absent or unpaid leave (a day)",
      r.absMode === "salary" ? "one day's salary: the teacher's salary ÷ the days in that month" : "the same amount for everyone",
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
        React.createElement(
          LLQASelect,
          { key: "m", value: r.absMode, title: "Absent amount", onChange: (e) => update("absentMode", e.target.value), style: { padding: "5px 8px", fontSize: 12 } },
          React.createElement("option", { value: "fixed" }, "Fixed amount"),
          React.createElement("option", { value: "salary" }, "One day's salary"),
        ),
        r.absMode === "salary" ? null : llqaNumInput(r.absent, (v) => update("absentFine", v), "Absent fine", 90, "a"),
      ),
      "abs",
    ), // v76: a fixed amount, or one day's salary
    row("Half Day", "", llqaNumInput(r.halfDay, (v) => update("halfDayFine", v), "Half day fine", 90), "half"),
    row("Missed Class", "", llqaNumInput(r.missedClass, (v) => update("missedClassFine", v), "Missed class fine", 90), "miss"),
    head("Absent and leave"), // v76
    row(
      "Mark absent when there's no sign-in by closing time",
      r.autoAbsent
        ? "on: at each teacher's exit time on a working day, unless leave is marked — unpaid until their team lead, a manager or an admin marks paid leave"
        : "off: the CRM marks nobody absent",
      React.createElement(Toggle, { value: r.autoAbsent, onChange: () => update("autoAbsent", r.autoAbsent ? false : todayPK()) }), // turned on: from today (never the days before)
      "auto",
    ),
    row(
      "Paid leave days a month",
      r.paidLimit ? "over " + r.paidLimit + ", only an admin gives more paid leave" : "no limit — every day marked paid is paid",
      React.createElement(
        LLQASelect,
        { value: String(r.paidLimit), title: "Paid leave days a month", onChange: (e) => update("paidLeaveLimit", Number(e.target.value) || 0), style: { padding: "5px 8px", fontSize: 12 } },
        [React.createElement("option", { key: "0", value: "0" }, "No limit")].concat([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((n) => React.createElement("option", { key: n, value: String(n) }, String(n)))),
      ),
      "plim",
    ),
    settings.workingSat !== false || settings.workingSun !== false
      ? React.createElement(
          "p",
          { style: { ...hint, color: c.warn, margin: "6px 0 0" } },
          (settings.workingSat !== false && settings.workingSun !== false ? "Saturday and Sunday are" : settings.workingSat !== false ? "Saturday is" : "Sunday is") +
            " a working day (Settings → HR & Attendance → Working Days & Hours): the CRM marks absences on " + (settings.workingSat !== false && settings.workingSun !== false ? "them" : "it") + " too. Turn it off there if it is a day off.",
        )
      : null,
    head("Extra classes (PKR a class)"), // v76
    React.createElement(
      "p",
      { style: hint },
      "A class marked Extra in the Timetable (Saturday and Sunday boxes start as Extra), a make-up marked Extra, or a class taken on a holiday — paid once the teacher logs it (present or late).",
    ),
    row("Extra class", "a Quran class", llqaNumInput(settings.extraClassRate == null ? 0 : settings.extraClassRate, (v) => update("extraClassRate", v), "Extra class pay", 90), "xr"),
    row("Subject extra class", "a Subject class", llqaNumInput(settings.subjectExtraRate == null ? 0 : settings.subjectExtraRate, (v) => update("subjectExtraRate", v), "Subject extra class pay", 90), "xs"),
    head("Signing out, leaving and time away"),
    row("Sign a teacher out after their exit time", "minutes after the exit time", llqaNumInput(r.autoOutMin, (v) => update("autoSignOutMin", v), "Minutes after exit", 70), "out"),
    row("A teacher is gone when their CRM is closed for", "minutes (at least 5)", llqaNumInput(r.silenceMin, (v) => update("earlySilenceMin", v), "Minutes closed", 70), "sil"),
    row(
      "Fine time away in the middle of the day",
      r.away ? "on: CRM closed that long during office hours is fined by the minute" : "off: time away is only recorded",
      React.createElement(Toggle, { value: r.away, onChange: () => update("fineAway", !r.away) }),
      "away",
    ),
    row(
      "Team leads mark reasons for their own teachers",
      "with Deduct or Don't deduct; only an admin can change it afterwards",
      React.createElement(Toggle, { value: r.teamLeadReasons, onChange: () => update("fineTeamLeadReasons", !r.teamLeadReasons) }),
      "tl",
    ),
  );
};

/* ---------- v72: Attendance → mark late: when did they sign in? ---------- */
const LLQALateWindow = ({ teacher, rec, settings, onSave, onClose }) => {
  const off = llqaOffice(teacher, settings);
  const o = { start: (rec && rec.officeStart) || off.start, end: (rec && rec.officeEnd) || off.end };
  const had = rec && llqaHm2m(rec.checkIn) != null ? rec.checkIn : "";
  const [time, setTime] = React.useState(had || llqaNowPK().hm);
  const lm = llqaLateMin(o, time);
  const r = llqaFineRules(llqaRecRules(rec, settings)); // the day's own rate (kept with it)
  const counted = Math.max(0, lm - r.grace);
  const amount = Math.round(counted * r.perMin);
  return React.createElement(
    "div",
    { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }, onClick: onClose },
    React.createElement(
      "div",
      { role: "dialog", "aria-modal": true, "aria-label": "Mark late", onClick: (e) => e.stopPropagation(), style: { background: c.bgCard, border: "1px solid " + c.border, borderRadius: 14, padding: 20, width: "min(420px, 100%)", boxShadow: c.shadow3d } },
      React.createElement("h3", { style: { margin: "0 0 4px", fontSize: 15, color: c.text } }, "Mark late — " + ((teacher && teacher.name) || "")),
      React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12, color: c.textSec } }, "Office time " + llqaHm12(o.start) + " – " + llqaHm12(o.end) + (had ? " · signed in through the portal at " + llqaHm12(had) : "")),
      React.createElement(
        "label",
        { style: { display: "block", color: c.textSec, fontSize: 10, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 } },
        "Signed in at (Pakistan time)",
      ),
      React.createElement("input", {
        type: "time",
        value: time,
        "aria-label": "Signed in at",
        onChange: (e) => setTime(e.target.value),
        style: { width: "100%", padding: "8px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 13, boxSizing: "border-box", marginBottom: 10 },
      }),
      React.createElement(
        "div",
        { style: { fontSize: 13, fontWeight: 600, color: lm > 0 ? c.warn : c.success, marginBottom: 14 } },
        lm > 0 ? lm + " min late" + (counted !== lm ? " (" + counted + " counted)" : "") + " = Rs " + amount.toLocaleString("en-US") : "On time — this is saved as Present",
      ),
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "flex-end", gap: 8 } },
        React.createElement(Btn, { variant: "secondary", onClick: onClose }, "Cancel"),
        React.createElement(Btn, { disabled: llqaHm2m(time) == null, onClick: () => onSave(time, lm) }, lm > 0 ? "Save late" : "Save as Present"),
      ),
    ),
  );
};

/* ---------- v72: Attendance → Fines & Deductions → every fine, its times, reason and edits ---------- */
const LLQA_FINE_KIND = { late: "Late", early: "Early", away: "Away", day: "Day" };
const llqaFineWhy = (rec, settings) => {
  const d = llqaDayFine(rec, settings);
  if (d.off) return "Day off (" + d.off + ") — not fined";
  const bits = [];
  const rs = (n) => "Rs " + Number(n || 0).toLocaleString("en-US");
  if (d.day) bits.push(d.day.kind + " " + rs(d.day.full) + (d.day.waived ? " (not deducted)" : ""));
  if (d.late) bits.push(d.late.min + " min late" + (d.late.counted !== d.late.min ? " (" + d.late.counted + " counted)" : "") + " = " + rs(d.late.full) + (d.late.waived ? " (not deducted)" : ""));
  if (d.early) bits.push(d.early.min + " min early = " + rs(d.early.full) + (d.early.waived ? " (not deducted)" : ""));
  if (d.away) bits.push(d.away.min + " min away" + (rec.away ? " (" + String(rec.away).split(",").map((x) => x.split("-").map(llqaHm12).join("–")).join(", ") + ")" : "") + (d.away.counted ? " = " + rs(d.away.full) + (d.away.waived ? " (not deducted)" : "") : " — recorded, not fined"));
  if (rec && rec.unknownOut) bits.push("no record of when they left — not fined");
  // a day keeps the rate it began with: say so when it is not today's rate
  const then = llqaFineRules(llqaRecRules(rec, settings)), now = llqaFineRules(settings);
  if (rec && rec.fineSet && bits.length && (then.perMin !== now.perMin || then.grace !== now.grace)) bits.push("rate that day: " + llqaRuleText(then));
  return bits.length ? bits.join(" · ") : rec && rec.status === "On Leave" ? llqaLeaveDayText(rec) + " — nothing cut" : ""; // v76: paid leave says so
};
const LLQAFineRecords = ({ teachers, history, setHistory, user, settings, month }) => {
  const [win, setWin] = React.useState(null); // { kind: "reason"|"edit"|"log", tid, date }
  const [form, setForm] = React.useState({});
  const T = teachers || [];
  const rows = [];
  T.forEach((t) =>
    ((history || {})[t.id] || []).forEach((h) => {
      if (!h || String(h.date || "").slice(0, 7) !== month) return;
      const d = llqaDayFine(h, settings);
      if (!(d.day || d.late || d.early || d.away || h.unknownOut || Number(h.fine) > 0 || (h.fineOverride != null && h.fineOverride !== "") || llqaIsLeaveDay(h))) return; // v76: leave days too (paid ones cost nothing)
      rows.push({ t, h, d });
    }),
  );
  rows.sort((a, b) => String(b.h.date).localeCompare(String(a.h.date)) || String(a.t.name).localeCompare(String(b.t.name)));
  const canEdit = llqaCanEditFines(user);
  const who = (user && (user.name || (user.role === "superadmin" ? "Super Admin" : user.role))) || "Admin";
  const save = (tid, date, fn, why) => {
    if (typeof setHistory !== "function") return;
    setHistory((prev) => {
      const all = { ...(prev || {}) };
      all[tid] = (all[tid] || []).map((h) => (h.date === date ? llqaWithFine(fn(h), settings, who, why) : h));
      return all;
    });
  };
  const cur = win && rows.find((x) => String(x.t.id) === String(win.tid) && x.h.date === win.date);
  const kindsOf = (d) => [d.late && ["late", "Late " + d.late.min + " min"], d.early && ["early", "Left " + d.early.min + " min early"], d.away && d.away.counted && ["away", "Away " + d.away.min + " min"], d.day && ["day", d.day.kind]].filter(Boolean);
  const th = { padding: "8px 10px", textAlign: "left", color: c.textSec, fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid " + c.border, background: c.bgDeep, whiteSpace: "nowrap" };
  const td = { padding: "8px 10px", color: c.text, fontSize: 11, borderBottom: "1px solid " + c.border, verticalAlign: "top" };
  const mini = (label, onClick, key, tone) =>
    React.createElement(
      "button",
      { key, type: "button", onClick, style: { padding: "3px 9px", borderRadius: 6, border: "1px solid " + (tone || c.border), background: c.bgCard, color: tone || c.text, fontSize: 11, cursor: "pointer", marginRight: 4, marginBottom: 2 } },
      label,
    );
  const reasonText = (h) =>
    Object.entries(h.reasons || {})
      .map(([k, r]) => (LLQA_FINE_KIND[k] || k) + ": " + r.text + " — " + (r.decision === "waive" ? "don't deduct" : "deduct") + " (" + r.by + (r.changedBy ? "; changed by " + r.changedBy : "") + ")")
      .join(" · ");
  const outText = (h) => {
    if (llqaIsOpen(h)) return "still signed in";
    if (llqaHm2m(h.checkOut) == null) return "—";
    return llqaHm12(h.checkOut) + (h.signOut === "auto" ? " (signed out by the CRM)" : h.signOut === "silence" ? " (CRM last open)" : h.signOut === "admin" ? " (by an admin)" : "");
  };
  const worked = cur ? llqaDayFine({ ...cur.h, fineOverride: null }, settings).total : 0;
  return React.createElement(
    "div",
    { style: { marginTop: 14 } },
    React.createElement("h4", { style: { color: c.text, margin: "0 0 4px", fontSize: 13, fontWeight: 600 } }, "Every fine this month, and how it was worked out"),
    React.createElement("p", { style: { color: c.textSec, fontSize: 11, margin: "0 0 8px" } }, "Rule: " + llqaRuleText(llqaFineRules(settings)) + ". A reason is marked once (with Deduct or Don't deduct); after that only an admin can change it."),
    llqaCanMarkLeaveAny(user) ? React.createElement("div", { style: { margin: "0 0 8px" } }, React.createElement(Btn, { variant: "outline", onClick: () => llqaOpen("leaveday", {}) }, "+ Leave or absence")) : null, // v76: any day, before or after
    React.createElement(
      "div",
      { style: { overflowX: "auto", border: "1px solid " + c.border, borderRadius: 10 } },
      React.createElement(
        "table",
        { style: { width: "100%", borderCollapse: "collapse" } },
        React.createElement("thead", null, React.createElement("tr", null, ["Date", "Teacher", "Office time", "Signed in / out", "How it was worked out", "Fine", "Reason", ""].map((h, i) => React.createElement("th", { key: i, style: th }, h)))),
        React.createElement(
          "tbody",
          null,
          rows.length
            ? rows.map(({ t, h, d }) => {
                const o = { start: h.officeStart || llqaOffice(t, settings).start, end: h.officeEnd || llqaOffice(t, settings).end };
                const may = llqaCanMarkReason(user, t, settings);
                const open = kindsOf(d).filter(([k]) => !(h.reasons || {})[k]);
                return React.createElement(
                  "tr",
                  { key: t.id + h.date },
                  React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, h.date),
                  React.createElement("td", { style: td }, t.name),
                  React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, llqaHm12(o.start) + " – " + llqaHm12(o.end)),
                  React.createElement("td", { style: { ...td, whiteSpace: "nowrap" } }, (llqaHm2m(h.checkIn) != null ? llqaHm12(h.checkIn) : "—") + " / " + outText(h)),
                  React.createElement("td", { style: td }, llqaFineWhy(h, settings) || "—", h.fineOverride != null && h.fineOverride !== "" ? React.createElement("div", { style: { color: c.warn, fontSize: 10, marginTop: 2 } }, "Admin set Rs " + Number(h.fineOverride).toLocaleString("en-US")) : null),
                  React.createElement("td", { style: { ...td, fontWeight: 700, whiteSpace: "nowrap" } }, "Rs " + Number(h.fine || 0).toLocaleString("en-US")),
                  React.createElement("td", { style: { ...td, color: c.textSec, minWidth: 160 } }, reasonText(h) || "—"),
                  React.createElement(
                    "td",
                    { style: { ...td, whiteSpace: "nowrap" } },
                    llqaIsLeaveDay(h) && llqaCanMarkLeave(user, t, h) ? mini("Leave", () => llqaOpen("leaveday", { tid: t.id, date: h.date }), "lv") : null, // v76: paid / unpaid leave or absent
                    may && open.length ? mini("Reason", () => { setForm({ kind: open[0][0], text: "", decision: "deduct" }); setWin({ kind: "reason", tid: t.id, date: h.date }); }, "r") : null,
                    canEdit ? mini("Edit", () => { setForm({ amount: h.fineOverride != null && h.fineOverride !== "" ? String(h.fineOverride) : "", why: "", kinds: Object.fromEntries(Object.entries(h.reasons || {}).map(([k, r]) => [k, r.decision])) }); setWin({ kind: "edit", tid: t.id, date: h.date }); }, "e") : null,
                    (h.fineLog || []).length ? mini("History", () => setWin({ kind: "log", tid: t.id, date: h.date }), "l") : null,
                  ),
                );
              })
            : llqaEmptyRow("No fines this month", "A late sign-in, early leaving, time away, an absence or a half day shows here with its times and rule."),
        ),
      ),
    ),
    cur &&
      React.createElement(
        "div",
        { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }, onClick: () => setWin(null) },
        React.createElement(
          "div",
          { role: "dialog", "aria-modal": true, onClick: (e) => e.stopPropagation(), style: { background: c.bgCard, border: "1px solid " + c.border, borderRadius: 14, padding: 20, width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto", boxShadow: c.shadow3d } },
          React.createElement("h3", { style: { margin: "0 0 4px", fontSize: 15, color: c.text } }, win.kind === "reason" ? "Mark a reason" : win.kind === "edit" ? "Edit this fine" : "What changed"),
          React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12, color: c.textSec } }, cur.t.name + " · " + cur.h.date + " · " + (llqaFineWhy(cur.h, settings) || "no fine")),
          win.kind === "reason" &&
            React.createElement(
              React.Fragment,
              null,
              React.createElement(Inp, { label: "For", value: form.kind, onChange: (v) => setForm({ ...form, kind: v }), options: kindsOf(cur.d).filter(([k]) => !(cur.h.reasons || {})[k]).map(([k, l]) => ({ value: k, label: l })) }),
              React.createElement(Inp, { label: "Reason", value: form.text || "", onChange: (v) => setForm({ ...form, text: v }), placeholder: "e.g. called at 4:50 — power cut at home" }),
              React.createElement(Inp, { label: "Fine", value: form.decision, onChange: (v) => setForm({ ...form, decision: v }), options: [{ value: "deduct", label: "Deduct fine" }, { value: "waive", label: "Don't deduct" }] }),
              React.createElement("p", { style: { fontSize: 11, color: c.textSec, margin: "4px 0 12px" } }, "This is saved once. After that only an admin can change it."),
            ),
          win.kind === "edit" &&
            React.createElement(
              React.Fragment,
              null,
              Object.keys(cur.h.reasons || {}).map((k) =>
                React.createElement(Inp, { key: k, label: (LLQA_FINE_KIND[k] || k) + " — " + cur.h.reasons[k].text, value: (form.kinds || {})[k] || cur.h.reasons[k].decision, onChange: (v) => setForm({ ...form, kinds: { ...(form.kinds || {}), [k]: v } }), options: [{ value: "deduct", label: "Deduct fine" }, { value: "waive", label: "Don't deduct" }] }),
              ),
              React.createElement(Inp, { label: "Your own amount for this day (Rs) — leave empty to use the worked-out Rs " + worked.toLocaleString("en-US"), value: form.amount == null ? "" : form.amount, onChange: (v) => setForm({ ...form, amount: v }), type: "number", placeholder: String(worked) }),
              React.createElement(Inp, { label: "Why (kept with the change)", value: form.why || "", onChange: (v) => setForm({ ...form, why: v }), placeholder: "e.g. teacher's PC failed — checked with the lead" }),
            ),
          win.kind === "log" &&
            React.createElement(
              "div",
              { style: { fontSize: 12, color: c.text, marginBottom: 12 } },
              (cur.h.fineLog || [])
                .slice()
                .reverse()
                .map((l, i) => React.createElement("div", { key: i, style: { padding: "6px 0", borderBottom: "1px solid " + c.border } }, llqaPkWhen(l.at) + " · " + l.by + " · Rs " + Number(l.from).toLocaleString("en-US") + " → Rs " + Number(l.to).toLocaleString("en-US") + " · " + l.why)),
            ),
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "flex-end", gap: 8 } },
            React.createElement(Btn, { variant: "secondary", onClick: () => setWin(null) }, win.kind === "log" ? "Close" : "Cancel"),
            win.kind === "reason" &&
              React.createElement(
                Btn,
                {
                  disabled: !String(form.text || "").trim() || !form.kind,
                  onClick: () => {
                    const k = form.kind, text = String(form.text || "").trim();
                    if (!k || !text || ((cur.h.reasons || {})[k] && !canEdit)) return;
                    save(cur.t.id, cur.h.date, (h) => ({ ...h, reasons: { ...(h.reasons || {}), [k]: { text, decision: form.decision === "waive" ? "waive" : "deduct", by: who, role: (user && user.role) || "", at: new Date(llqaNowMs()).toISOString() } } }), "reason by " + who + ": " + text + (form.decision === "waive" ? " — don't deduct" : " — deduct"));
                    setWin(null);
                  },
                },
                "Save reason",
              ),
            win.kind === "edit" &&
              React.createElement(
                Btn,
                {
                  disabled: !String(form.why || "").trim(),
                  onClick: () => {
                    const why = String(form.why || "").trim();
                    if (!why) return;
                    save(
                      cur.t.id,
                      cur.h.date,
                      (h) => {
                        const reasons = { ...(h.reasons || {}) };
                        Object.entries(form.kinds || {}).forEach(([k, v]) => {
                          if (reasons[k] && reasons[k].decision !== v) reasons[k] = { ...reasons[k], decision: v, changedBy: who, changedAt: new Date(llqaNowMs()).toISOString() };
                        });
                        const raw = String(form.amount == null ? "" : form.amount).trim();
                        const amt = Math.max(0, Math.round(Number(raw) || 0));
                        const workedNow = llqaDayFine({ ...h, reasons, fineOverride: null }, settings).total;
                        return { ...h, reasons, fineOverride: raw === "" || amt === workedNow ? null : amt };
                      },
                      "edited by " + who + ": " + why,
                    );
                    setWin(null);
                  },
                },
                "Save change",
              ),
          ),
        ),
      ),
  );
};

/* ============================================================
   v73: class records — one record per class, kept by month in 64 parts
   Before v73 every logged class was its own document in "dailyProgress", one per student per day: a student with
   two classes on a day had one record (the second class overwrote the first), every computer — teachers' and
   parents' too — loaded every record ever made (about 13,000 more every month), and the counts on the student
   ("attended 12 of 14") were running totals that a second computer or a correction could put out of step.
   Now:
   - classes/2026-11_07 … one document per month per part; a student always falls in the same part, so all of a
     student's classes of a month are together whoever taught them. Each class is one field of that document
     (key: student, day, Pakistan time), written on its own — two people logging different classes never touch
     each other's.
   - Staff load this month and last (older months when a screen asks). A teacher loads only the parts of their own
     students and of the classes they cover; a parent only their child's. One listener per month, not per part.
   - The counts, the attendance %, the progress and the Monthly Sheet are worked out from the records.
   - The old "dailyProgress" list is still read, for days that have no record of their own.
   ============================================================ */
const LLQA_CLS_PARTS = 64;
const LLQA_CLS_COLL = "classes";
// FNV-1a with a final mix: student ids (13-digit times) spread over all 64 parts (the attendance hash uses only 32 of 64)
const llqaClsPart = (sid) => {
  let h = 0x811c9dc5;
  const s = String(sid);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) % LLQA_CLS_PARTS;
};
const llqaClsDocId = (ym, part) => ym + "_" + String(part).padStart(2, "0");
const llqaClsSan = (v) => String(v == null ? "" : v).replace(/[^A-Za-z0-9]/g, "-");
// one class: the student, the Pakistan day and the Pakistan start time ("x": a class not booked in the Timetable)
const llqaClsKey = (sid, date, slot) =>
  "c" + llqaClsSan(sid) + "_" + String(date || "").replace(/-/g, "") + "_" + (slot ? llqaClsSan(String(slot).replace(/:/g, "")) : "x");
const llqaIsClsKey = (k) => /^c[A-Za-z0-9-]*_\d{8}_[A-Za-z0-9-]+$/.test(String(k || ""));
const llqaClsPack = (r) => {
  const o = {};
  Object.keys(r || {}).forEach((k) => {
    if (k === "id" || k === "key") return;
    const v = r[k];
    if (v === undefined || v === null || v === "" || typeof v === "function") return;
    o[k] = v;
  });
  return JSON.stringify(o);
};
const llqaClsUnpack = (key, json) => {
  try {
    const o = JSON.parse(json);
    if (!o || typeof o !== "object" || o.studentId == null || !o.date) return null;
    return { ...o, id: key, key, slot: o.slot || "", attended: String(o.attended || "").toLowerCase() };
  } catch (e) {
    return null;
  }
};
// this month and last (by the Pakistan calendar)
const llqaClsBaseMonths = () => {
  const ym = llqaPkDate(llqaNowMs()).slice(0, 7);
  return [llqaPrevYm(ym), ym];
};

const LLQACls = (() => {
  const docs = new Map(); // document id → { raw: {key: text}, recs: Map(key → record) }
  const queries = new Map(); // query key → { ym, ids, server, tries, timer, unsub, got: Set(document ids) }
  const subs = new Set();
  const sending = new Set();
  const pendIds = new Set(); // documents with changes this computer has not had confirmed yet
  const pendCache = new Map(); // key → { json, rec }
  let ver = 0;
  let months = [];
  let parts = []; // null: every part
  let beat = null;
  let scoped = false;
  let localData = null; // without a cloud (demo): {document id: {key: text}} kept on this computer
  const LOCAL_KEY = "llqa_cls_local_v1";
  const PEND = (id) => "cls:" + id;
  const emit = () => {
    ver++;
    subs.forEach((f) => {
      try {
        f();
      } catch (e) {}
    });
  };
  const isLocal = () => !initFirebase();
  const loadLocal = () => {
    if (localData) return localData;
    try {
      localData = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") || {};
    } catch (e) {
      localData = {};
    }
    return localData;
  };
  const saveLocal = () => {
    if (llqaFrozen) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(localData || {}));
    } catch (e) {
      console.warn("Class records not kept on this computer:", e.message);
    }
  };
  // unsent changes from an earlier visit (they are sent again)
  let pendLoaded = false;
  const loadPendIds = () => {
    if (pendLoaded) return;
    pendLoaded = true;
    try {
      const all = JSON.parse(localStorage.getItem("llqa_crm_pending_v1") || "{}") || {};
      Object.keys(all).forEach((n) => {
        if (n.indexOf("cls:") === 0 && LLQAPending.get(n)) pendIds.add(n.slice(4));
      });
    } catch (e) {}
  };
  const parseDoc = (old, data) => {
    const raw = {};
    const recs = new Map();
    Object.keys(data || {}).forEach((k) => {
      const json = data[k];
      if (k[0] !== "c" || typeof json !== "string") return;
      raw[k] = json;
      const r = old && old.raw[k] === json ? old.recs.get(k) : llqaClsUnpack(k, json);
      if (r) recs.set(k, r);
    });
    return { raw, recs };
  };
  const inScope = (id) => {
    const ym = id.slice(0, 7);
    if (!months.includes(ym)) return false;
    return parts === null || parts.includes(Number(id.slice(8)));
  };
  const setLive = (ok, err) =>
    LLQASync.set((st) => {
      const errors = { ...st.errors };
      if (ok) delete errors[LLQA_CLS_COLL];
      else errors[LLQA_CLS_COLL] = err;
      return ok ? { errors, live: { ...st.live, [LLQA_CLS_COLL]: true } } : { errors };
    });
  const onSnap = (q, snap) => {
    if (q.dead) return;
    const fromCache = !!(snap.metadata && snap.metadata.fromCache);
    if (fromCache && !q.server) return; // never show an offline cache as the cloud's answer
    if (!fromCache) q.server = true;
    q.tries = 0;
    const seen = new Set();
    (snap.docs || []).forEach((d) => {
      seen.add(d.id);
      docs.set(d.id, parseDoc(docs.get(d.id), d.data() || {}));
    });
    // a document that is no longer in the answer was deleted in the cloud
    q.got.forEach((id) => {
      if (seen.has(id)) return;
      let other = false;
      queries.forEach((o) => {
        if (o !== q && o.got.has(id)) other = true;
      });
      if (!other) docs.delete(id);
    });
    q.got = seen;
    setLive(true);
    emit();
  };
  const onErr = (q, err) => {
    if (q.dead) return;
    console.error("Firestore error (" + LLQA_CLS_COLL + " " + q.ym + "):", err);
    const code = (err && err.code) || "";
    if (code === "permission-denied") LLQASync.set((st) => ({ denied: { ...st.denied, [LLQA_CLS_COLL]: true } }));
    else setLive(false, code || String((err && err.message) || err));
    emit();
    // 15 s, 30 s, 1 min, 2 min, 4 min, then every 5 min (a refused try can count as a read)
    const wait = Math.min(300000, 15000 * Math.pow(2, q.tries++));
    q.timer = setTimeout(() => listen(q), wait);
  };
  const listen = async (q) => {
    q.timer = null;
    if (q.dead) return;
    await fbSignIn();
    await LLQACloud.epochReady();
    if (q.dead) return;
    try {
      const ref = fb.db.collection(LLQA_CLS_COLL);
      const query = q.ids ? ref.where(firebase.firestore.FieldPath.documentId(), "in", q.ids) : ref.where("ym", "==", q.ym);
      q.unsub = query.onSnapshot(
        (snap) => onSnap(q, snap),
        (err) => onErr(q, err),
      );
    } catch (e) {
      onErr(q, e);
    }
  };
  const stop = (q) => {
    q.dead = true;
    if (q.timer) clearTimeout(q.timer);
    try {
      if (q.unsub) q.unsub();
    } catch (e) {}
  };
  // which months and parts this computer listens to (parts null: all of them)
  const setScope = (ms, ps) => {
    scoped = true;
    months = [...new Set(ms || [])].sort();
    parts = ps === null ? null : [...new Set((ps || []).map(Number))].sort((a, b) => a - b);
    if (isLocal()) {
      emit();
      return;
    }
    loadPendIds();
    const want = new Map();
    months.forEach((ym) => {
      if (parts === null) want.set(ym + "|*", { ym, ids: null });
      else
        for (let i = 0; i < parts.length; i += 30) {
          const ids = parts.slice(i, i + 30).map((p) => llqaClsDocId(ym, p));
          want.set(ym + "|" + ids.join(","), { ym, ids });
        }
    });
    queries.forEach((q, k) => {
      if (!want.has(k)) {
        stop(q);
        queries.delete(k);
      }
    });
    // records of months or students no longer asked for are let go of
    Array.from(docs.keys()).forEach((id) => {
      if (!inScope(id)) docs.delete(id);
    });
    want.forEach((spec, k) => {
      if (queries.has(k)) return;
      const q = { ...spec, key: k, server: false, tries: 0, timer: null, unsub: null, got: new Set(), dead: false };
      queries.set(k, q);
      listen(q);
    });
    startBeat();
    pendIds.forEach((id) => send(id));
    emit();
  };
  // every query has had the cloud's answer (or there is no cloud)
  const ready = (ym) => {
    if (isLocal()) return true;
    if (!scoped) return false; // the App has not said yet what this computer needs
    let ok = true;
    queries.forEach((q) => {
      if ((!ym || q.ym === ym) && !q.server) ok = false;
    });
    if (ym && !months.includes(ym)) return false;
    return ok;
  };
  const send = async (id) => {
    const pend = LLQAPending.get(PEND(id));
    if (!pend) {
      pendIds.delete(id);
      return;
    }
    if (sending.has(id) || isLocal()) return;
    sending.add(id);
    const ops = Object.keys(pend).map((k) => ({ id: k, doc: pend[k] }));
    let ok = false;
    LLQASync.set((st) => ({ sending: st.sending + 1 }));
    try {
      await fbSignIn();
      await LLQACloud.epochReady();
      if (llqaFrozen) return;
      const patch = { ym: id.slice(0, 7), part: Number(id.slice(8)) };
      ops.forEach((o) => {
        patch[o.id] = o.doc === null ? firebase.firestore.FieldValue.delete() : o.doc;
      });
      await fb.db.collection(LLQA_CLS_COLL).doc(id).set(patch, { merge: true });
      LLQAPending.done(PEND(id), ops);
      LLQASync.set({ writeError: "" });
      ok = true;
    } catch (e) {
      console.error("Cloud save failed (" + LLQA_CLS_COLL + "/" + id + "):", e);
      LLQASync.set({ writeError: (e && (e.code || e.message)) || "save failed" });
    } finally {
      sending.delete(id);
      LLQASync.set((st) => ({ sending: Math.max(0, st.sending - 1) }));
      const left = LLQAPending.get(PEND(id));
      if (!left) pendIds.delete(id);
      emit();
      // a change made while this one was on its way goes at once; after a failure, with the next round
      if (ok && left) setTimeout(() => send(id), 0);
    }
  };
  const startBeat = () => {
    if (beat) return;
    beat = setInterval(() => pendIds.forEach((id) => send(id)), 60000);
    try {
      window.addEventListener("online", () => setTimeout(() => pendIds.forEach((id) => send(id)), 1500));
    } catch (e) {}
  };
  const where = (rec) => {
    const date = String(rec.date || "");
    const ym = date.slice(0, 7);
    return { id: llqaClsDocId(ym, llqaClsPart(rec.studentId)), key: llqaClsKey(rec.studentId, date, rec.slot) };
  };
  const put = (rec, del) => {
    if (!rec || rec.studentId == null || !/^\d{4}-\d{2}-\d{2}$/.test(String(rec.date || ""))) return "";
    const w = where(rec);
    // a class saved for a month or a student this computer does not load yet: load it too (else the class would
    // vanish from the screen once the cloud has it)
    const ym = String(rec.date).slice(0, 7), part = llqaClsPart(rec.studentId);
    if (scoped && !months.includes(ym) && typeof api.need === "function") api.need(ym);
    if (scoped && parts !== null && !parts.includes(part) && typeof api.needPart === "function") api.needPart(part);
    const json = del ? null : llqaClsPack({ ...rec, slot: rec.slot || "" });
    if (isLocal()) {
      const all = loadLocal();
      const d = (all[w.id] = all[w.id] || {});
      if (del) delete d[w.key];
      else d[w.key] = json;
      if (!Object.keys(d).length) delete all[w.id];
      saveLocal();
      emit();
      return w.key;
    }
    if (llqaFrozen) return "";
    LLQAPending.add(PEND(w.id), [{ id: w.key, doc: json }]);
    pendIds.add(w.id);
    emit();
    send(w.id);
    return w.key;
  };
  // everything this computer has: the cloud's records, its own unsent changes on top, the records from before v73
  // for days with no record of their own
  let memo = { ver: -1, legacy: null, arr: [] };
  const unpackPend = (k, json) => {
    const hit = pendCache.get(k);
    if (hit && hit.json === json) return hit.rec;
    const rec = llqaClsUnpack(k, json);
    if (pendCache.size > 5000) pendCache.clear();
    pendCache.set(k, { json, rec });
    return rec;
  };
  const view = (legacy) => {
    const lg = Array.isArray(legacy) ? legacy : [];
    if (memo.ver === ver && memo.legacy === lg) return memo.arr;
    const m = new Map();
    if (isLocal()) {
      const all = loadLocal();
      Object.keys(all).forEach((id) =>
        Object.keys(all[id] || {}).forEach((k) => {
          const r = unpackPend(k, all[id][k]);
          if (r) m.set(k, r);
        }),
      );
    } else {
      docs.forEach((d) => d.recs.forEach((r, k) => m.set(k, r)));
      pendIds.forEach((id) => {
        const p = LLQAPending.get(PEND(id));
        if (!p) return;
        Object.keys(p).forEach((k) => {
          if (p[k] === null) m.delete(k);
          else {
            const r = unpackPend(k, p[k]);
            if (r) m.set(k, r);
          }
        });
      });
    }
    const keys = Array.from(m.keys()).sort();
    const out = keys.map((k) => m.get(k));
    const has = new Set(out.map((r) => String(r.studentId) + "|" + r.date));
    lg.forEach((p) => {
      if (p && p.studentId != null && p.date && !has.has(String(p.studentId) + "|" + p.date)) out.push(p);
    });
    memo = { ver, legacy: lg, arr: out };
    return out;
  };
  const api = {
    setScope,
    ready,
    view,
    save: (rec) => put(rec, false),
    remove: (rec) => put(rec, true),
    subscribe: (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    months: () => months.slice(),
    parts: () => (parts === null ? null : parts.slice()),
    queryCount: () => queries.size,
    docIds: () => Array.from(docs.keys()).sort(),
    version: () => ver,
    need: null,
    needPart: null,
    legacy: [],
    setLegacy: null,
  };
  return api;
})();
const llqaClsReady = (ym) => LLQACls.ready(ym);
// these records are this computer's own list of classes and the cloud has not answered yet (counts would be too low)
const llqaClsLoading = (dp) => !LLQACls.ready() && Array.isArray(dp) && dp === LLQACls.view(LLQACls.legacy);
// the first day whose records this computer has (the earlier months are loaded only when asked for); "" = all of them
const llqaClsFrom = () => {
  if (!initFirebase()) return "";
  const ms = LLQACls.months();
  return ms.length ? ms[0] + "-01" : "";
};
// the setter screens used before v73 (a new list, or a function of it): the classes that changed are written one by one
const llqaClsSetList = (v) => {
  const base = LLQACls.view(LLQACls.legacy);
  const next = typeof v === "function" ? v(base) : v;
  if (!Array.isArray(next) || next === base) return;
  const before = new Map(base.map((r) => [String(r && r.id), r]));
  const seen = new Set();
  next.forEach((r) => {
    if (!r || r.studentId == null || !r.date) return;
    const id = String(r.id);
    seen.add(id);
    const b = before.get(id);
    if (b === r || (b && llqaStable(b) === llqaStable(r))) return;
    LLQACls.save(r);
  });
  before.forEach((r, id) => {
    if (seen.has(id) || !r) return;
    if (llqaIsClsKey(id)) LLQACls.remove(r);
    else if (typeof LLQACls.setLegacy === "function") LLQACls.setLegacy((prev) => (prev || []).filter((p) => String(p && p.id) !== id)); // a record from before v73
  });
};
// the students whose classes a teacher's computer needs: their own students, the students in their Timetable rows,
// the classes they cover and their make-up classes
const llqaClsTeacherSids = (user, teachers, students, covers, makeups) => {
  const me = String(user.teacherId != null ? user.teacherId : user.id);
  const name = String(user.name || "").trim();
  const sids = new Set();
  (students || []).forEach((s) => {
    if (s && String(s.teacher || "").trim() === name) sids.add(String(s.id));
  });
  const mine = (teachers || []).filter((t) => t && String(t.id) === me);
  LLQABooking.eachBooked(mine, (c) => {
    const cell = c.cell || {};
    if (cell.sid != null && cell.sid !== "") sids.add(String(cell.sid));
    else {
      const s = (students || []).find((x) => LLQABooking.sameStudent(cell, x));
      if (s) sids.add(String(s.id));
    }
  });
  (covers || []).forEach((x) => {
    if (x && String(x.coverId) === me && x.sid != null && x.sid !== "") sids.add(String(x.sid));
  });
  (makeups || []).forEach((m) => {
    if (m && String(m.teacherId) === me && m.sid != null && m.sid !== "") sids.add(String(m.sid));
  });
  return sids;
};
// the parts this person's computer loads: null = all (staff); a teacher their students'; a parent their children's
const llqaClsScopeParts = (user, teachers, students, covers, makeups) => {
  if (!user) return [];
  const toParts = (sids) => [...new Set(Array.from(sids).map(llqaClsPart))].sort((a, b) => a - b);
  if (user.role === "parent") {
    const pid = String(user.parentId || "").toUpperCase();
    const sids = new Set();
    if (user.studentId != null) sids.add(String(user.studentId));
    (students || []).forEach((s) => {
      if (s && pid && String(s.parentId || "").toUpperCase() === pid) sids.add(String(s.id));
    });
    return toParts(sids);
  }
  if (user.role === "teacher") {
    const ps = toParts(llqaClsTeacherSids(user, teachers, students, covers, makeups));
    return ps.length > 30 ? null : ps; // most of the academy: one listener for all of it
  }
  return null;
};
// App: the class records a signed-in person needs → [records, setter, ask for a month]
const useLLQAClasses = (user, legacy, setLegacy, teachers, students, covers, makeups) => {
  const [months, setMonths] = React.useState(llqaClsBaseMonths);
  const [extra, setExtra] = React.useState([]); // parts a save on this computer asked for (a class outside the usual ones)
  const [, setVer] = React.useState(0);
  const base = llqaClsScopeParts(user, teachers, students, covers, makeups);
  const parts = base === null ? null : base.length || user ? [...new Set([...base, ...extra])].sort((a, b) => a - b) : [];
  const partsKey = parts === null ? "*" : parts.join(",");
  const who = user ? user.role + ":" + (user.teacherId != null ? user.teacherId : user.parentId || user.name || "") : "";
  React.useEffect(() => setExtra([]), [who]); // a new person signs in: only their own parts
  LLQACls.legacy = Array.isArray(legacy) ? legacy : [];
  LLQACls.setLegacy = setLegacy;
  React.useEffect(() => LLQACls.subscribe(() => setVer((n) => n + 1)), []);
  React.useEffect(() => {
    LLQACls.setScope(months, parts);
  }, [months.join(","), partsKey]);
  const need = React.useCallback((ym) => {
    if (!/^\d{4}-\d{2}$/.test(String(ym || ""))) return;
    setMonths((m) => (m.includes(ym) ? m : [...m, ym].sort()));
  }, []);
  LLQACls.need = need;
  LLQACls.needPart = React.useCallback((p) => setExtra((x) => (x.includes(p) ? x : [...x, p])), []);
  // a new month begins while the CRM is open
  React.useEffect(() => {
    const id = setInterval(() => {
      const b = llqaClsBaseMonths();
      setMonths((m) => (b.every((x) => m.includes(x)) ? m : [...new Set([...m, ...b])].sort()));
    }, 300000);
    return () => clearInterval(id);
  }, []);
  return [LLQACls.view(LLQACls.legacy), llqaClsSetList, need];
};

/* ---------- v73: books, pages, counts — worked out from the class records ---------- */
// Qaida courses ("EN-Quaida", "Eng/Noorani Quaida", "Noorani Qaida" …) count Qaida pages; a Subject course has no
// page; every other course counts Quran pages (604, Madani print). Before v73 only "Quaida" was found, so a
// "Noorani Qaida" student was measured against the 604 Quran pages.
const llqaIsQaida = (course) => /qu?a{1,2}ida/i.test(String(course || ""));
const llqaBookOf = (s) => {
  const course = String((s && s.course) || "").trim();
  if (/^subject$/i.test(course)) return "none";
  return llqaIsQaida(course) ? "qaida" : "quran";
};
const LLQA_BOOK_PAGES = { quran: 604, qaida: 30 };
const LLQA_BOOK_MAX = { quran: 604, qaida: 100 };
// juz of a Madani-print page: juz 1 is pages 1–21, then 20 pages each (juz 30 from page 582)
const llqaJuzOf = (page) => {
  const p = parseInt(page, 10);
  if (!(p > 0)) return null;
  return p <= 21 ? 1 : Math.min(30, Math.floor((p - 2) / 20) + 1);
};
const llqaIsAtt = (a) => /^(present|late)$/i.test(String(a || ""));
const llqaAttCount = (list) => {
  let present = 0, late = 0, absent = 0, excused = 0;
  (list || []).forEach((p) => {
    const a = String((p && p.attended) || "").toLowerCase();
    if (a === "present") present++;
    else if (a === "late") late++;
    else if (a === "absent") absent++;
    else if (a === "excused") excused++;
  });
  const counted = present + late + absent; // an excused class is not held against the student
  return { classes: (list || []).length, present, late, absent, excused, attended: present + late, pct: counted ? Math.round(((present + late) / counted) * 100) : null };
};
// the page reached: the newest class with a page, else what the student record says (null: not known yet)
const llqaReach = (s, recs) => {
  const book = llqaBookOf(s);
  if (!s || book === "none") return null;
  let page = null, date = "";
  for (const r of recs || []) {
    const p = parseInt(r && r.pages, 10);
    if (p > 0 && (!r.book || r.book === book)) {
      page = p;
      date = r.date;
      break;
    }
  }
  if (page == null) {
    // (before v73 a Qaida page was kept in "page": "qaida" stayed 0)
    const p = parseInt(book === "qaida" ? s.qaida || s.page : s.page, 10);
    if (p > 0) page = p;
  }
  if (page == null) return null;
  const total = LLQA_BOOK_PAGES[book];
  const exact = Math.min(100, (page / total) * 100);
  // "0.5%" for page 3 of 604 (a whole number said 0%)
  return { book, page, total, pct: Math.round(exact), pctText: (exact < 10 ? Math.round(exact * 10) / 10 : Math.round(exact)) + "%", juz: book === "quran" ? llqaJuzOf(page) : null, date };
};
// the day a student's classes are expected from: registered and in the CRM (a family from before the CRM is added today)
const llqaStuFrom = (s) => {
  const a = String((s && s.dor) || ""), b = String((s && s.addedAt) || "").slice(0, 10);
  const ok = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x);
  return ok(a) && ok(b) ? (a > b ? a : b) : ok(a) ? a : ok(b) ? b : "";
};
const llqaProgressPct = (s) => {
  const r = llqaReach(s, llqaDpOf(LLQAApp.ctx.dailyProgress, s && s.id));
  return r ? r.pct : null;
};
const llqaReachText = (r) =>
  !r ? "—" : r.book === "qaida" ? "Qaida page " + r.page + " of " + r.total : "Page " + r.page + " of " + r.total + " · Juz " + r.juz;
// one student: the last 30 days, everything loaded, the newest class and lesson, the page reached
const llqaStuStats = (s, opt) => {
  const o = opt || {};
  const today = o.today || llqaToday();
  const mine = llqaDpOf(o.dp || LLQAApp.ctx.dailyProgress, s && s.id).filter((p) => p.date <= today);
  const since = llqaAddDays(today, -29);
  return {
    last30: llqaAttCount(mine.filter((p) => p.date >= since)),
    all: llqaAttCount(mine),
    last: mine[0] || null,
    lastFull: mine.find((p) => String(p.lesson || "").trim()) || null,
    reach: llqaReach(s, mine),
    recs: mine,
  };
};
// trial classes attended: classes marked Present / Late since the trial began. Until the class records have come from
// the cloud, the count kept on the student.
const llqaTrialDone = (s, dp) => {
  if (!s) return 0;
  const list = dp || LLQAApp.ctx.dailyProgress;
  const start = String(s.trialStart || s.dor || "");
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(start);
  const n = llqaDpOf(list, s.id).filter((p) => llqaIsAtt(p.attended) && (!ok || p.date >= start)).length;
  return llqaClsLoading(list) ? Math.max(n, parseInt(s.attended, 10) || 0) : n;
};
// the family's own day for a class on a Pakistan date (a US evening class is the next morning in Pakistan)
const llqaFamDate = (date, rowDay) => {
  if (!rowDay || !date || llqaWeekday(date) === rowDay) return date;
  const a = llqaAddDays(date, -1), b = llqaAddDays(date, 1);
  return llqaWeekday(a) === rowDay ? a : llqaWeekday(b) === rowDay ? b : date;
};
// all classes of one day as one mark (the calendar): attended if any class was, else excused, else absent
const llqaDayMark = (recs) => {
  const a = (recs || []).map((p) => String((p && p.attended) || "").toLowerCase());
  if (!a.length) return "";
  if (a.includes("present")) return "present";
  if (a.includes("late")) return "late";
  if (a.includes("excused")) return "excused";
  return a.includes("absent") ? "absent" : a[0];
};
// the record of one class (exact: student, day, time)
const llqaClsFind = (dp, sid, date, slot) => llqaDpIndex(dp).bySlot.get(String(sid) + "|" + date + "|" + String(slot || "")) || null;
// what a Timetable class shows: its own record, else a record of that day from before v73 (one per student per day,
// no time — it stands for the day's classes). An extra class logged since has no time either, but is not one of them.
const llqaClsEntry = (dpx, sid, date, slot) => {
  const k = String(sid) + "|" + date + "|";
  const own = dpx.bySlot.get(k + String(slot || ""));
  if (own) return own;
  const day = dpx.bySlot.get(k);
  return day && !llqaIsClsKey(day.id) ? day : null;
};
// the average of the students' last 30 days (those with a class logged in that time)
const llqaAvgAtt = (list) => {
  const ps = (list || []).map((s) => llqaStuStats(s).last30.pct).filter((p) => p != null);
  return ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) + "%" : "—";
};
// all classes of one day as one record (the parent's calendar and streak)
const llqaDayRec = (list, d) => {
  const recs = (list || []).filter((p) => p && p.date === d);
  return recs.length ? { ...recs[0], attended: llqaDayMark(recs), classes: recs.length } : undefined;
};
// a student's classes on a Pakistan date (their Timetable classes and make-ups)
const llqaStuClassesOn = (sid, date) => {
  const ctx = LLQAApp.ctx || {};
  return llqaClassesOn(date, ctx.teachers || [], ctx.students || [], ctx.dailyProgress).filter((it) => it.stu && String(it.stu.id) === String(sid));
};
// the latest day (today or before) a Timetable class took place
// (the Timetable's own teacher rows carry the app id as _appId / _overlayAppId; the name is used when there is none)
const llqaLastClassDate = (teacherId, rowDay, slot, from, teacherName) => {
  const ctx = LLQAApp.ctx || {};
  const t0 = from || todayPK();
  const byId = teacherId != null && teacherId !== "";
  for (let i = 0; i < 8; i++) {
    const d = llqaAddDays(t0, -i);
    const hit = llqaClassesOn(d, ctx.teachers || [], ctx.students || [], ctx.dailyProgress).some(
      (it) => !it.makeup && (byId ? String(it.teacherId) === String(teacherId) : !!teacherName && it.teacher === teacherName) && it.rowDay === rowDay && String(it.slot) === String(slot),
    );
    if (hit) return d;
  }
  return t0;
};
// the student's own fields that follow their classes: the newest lesson, behaviour and page, and the counts — worked out
// again from the records when every class of theirs is loaded, else moved by exactly what this change did (a student from
// before the months loaded keeps a true total). Only what changed is returned.
const llqaStuFields = (stu, list, prevList, removedDate) => {
  const mine = llqaDpOf(list, stu.id);
  const out = {};
  const set = (k, v) => {
    if (v !== undefined && stu[k] !== v) out[k] = v;
  };
  // the newest class wins — but a newer last lesson kept on the student (from before the CRM, or a month not loaded)
  // is not replaced by an older one; when the newest class is removed, the one before it takes its place
  const stored = String(stu.lastDate || "");
  const may = (d) => !stored || String(d) >= stored || (!!removedDate && removedDate >= stored);
  if (mine[0] && may(mine[0].date)) set("lastDate", mine[0].date);
  const full = mine.find((p) => String(p.lesson || "").trim());
  if (full && may(full.date)) {
    set("lastLesson", String(full.lesson).trim());
    [["lB", "behavior"], ["lP", "performance"], ["lH", "homework"], ["lR", "recitation"], ["lT", "tajweed"]].forEach(([f, k]) => {
      if (full[k]) set(f, full[k]);
    });
  }
  const book = llqaBookOf(stu);
  const pg = mine.find((p) => parseInt(p.pages, 10) > 0 && (!p.book || p.book === book));
  if (pg && book !== "none" && may(pg.date)) set(book === "qaida" ? "qaida" : "page", parseInt(pg.pages, 10));
  // the student's real beginning (a family from before the CRM was registered long before it was added)
  const start = [stu.dor, stu.addedAt, stu.trialStart].map((x) => String(x || "").slice(0, 10)).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort()[0] || "";
  const from = llqaClsFrom();
  if (!from || (/^\d{4}-\d{2}-\d{2}$/.test(start) && start >= from)) {
    const n = llqaAttCount(mine);
    set("attended", n.attended);
    set("totalClasses", n.classes);
    if (n.pct != null) set("attendance", n.pct);
  } else if (prevList) {
    const a = llqaAttCount(llqaDpOf(prevList, stu.id)), b = llqaAttCount(mine);
    if (a.attended !== b.attended || a.classes !== b.classes) {
      const att = Math.max(0, (parseInt(stu.attended, 10) || 0) + b.attended - a.attended);
      const tot = Math.max(att, (parseInt(stu.totalClasses, 10) || 0) + b.classes - a.classes);
      set("attended", att);
      set("totalClasses", tot);
      if (tot) set("attendance", Math.round((att / tot) * 100));
    }
  }
  return out;
};
const LLQA_ATT_KINDS = ["present", "late", "absent", "excused"];
// v73: saves one class — a full log (lesson, page, behaviour …) or only the mark (Present / Late / Absent / Excused).
// The same class saved again updates its record (never counted twice); a second class on the same day is its own
// record. Returns "" or why it was not saved.
const llqaClassSave = (o) => {
  const ctx = LLQAApp.ctx || {};
  const students = o.students || ctx.students || [];
  const stu = students.find((x) => x && String(x.id) === String(o.studentId));
  if (!stu) return "This class is not linked to a student record, so it can't be logged. Add the student in Sales or Students first.";
  const today = todayPK();
  const date = String(o.date || today).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Pick the day of the class.";
  if (date > today) return "A class can't be logged before its day.";
  const f = o.form || {};
  const att = String(f.attended || o.attended || "present").toLowerCase();
  if (!LLQA_ATT_KINDS.includes(att)) return "Choose Present, Late, Absent or Excused.";
  const full = !o.markOnly;
  const lesson = String(f.lesson || "").trim();
  if (full && (att === "present" || att === "late") && !lesson) return "Please write the lesson taught.";
  const book = llqaBookOf(stu);
  let pages = "";
  const pRaw = String(f.pages == null ? "" : f.pages).trim();
  if (full && pRaw && book !== "none") {
    const max = LLQA_BOOK_MAX[book];
    const p = /^\d+$/.test(pRaw) ? parseInt(pRaw, 10) : NaN;
    if (!(p >= 1 && p <= max)) return "The page reached must be a number from 1 to " + max + ".";
    pages = String(p);
  }
  const setDp = o.setDailyProgress || ctx.setDailyProgress;
  if (typeof setDp !== "function") return "The class could not be saved — the page is still loading. Please try again.";
  const slot = String(o.slot || "");
  const dp = o.dp || ctx.dailyProgress || [];
  const key = llqaClsKey(stu.id, date, slot);
  const sameDay = llqaDpOf(dp, stu.id).filter((p) => p.date === date);
  const old = sameDay.find((p) => String(p.id) === key) || null;
  // a record of that day from before v73 (no time): a mark keeps what it says
  const legacyDay = !old && o.markOnly ? sameDay.find((p) => !llqaIsClsKey(p.id)) || null : null;
  const nowIso = new Date(llqaNowMs()).toISOString();
  const by = o.by || (ctx.user && ctx.user.name) || "";
  const rowDay = o.rowDay || (old && old.rowDay) || "";
  const rec = {
    ...(old || legacyDay || {}),
    id: key,
    key,
    studentId: stu.id,
    date,
    slot,
    teacherId: o.teacherId != null && o.teacherId !== "" ? o.teacherId : (old && old.teacherId) || "",
    teacherName: o.teacherName || (old && old.teacherName) || stu.teacher || "",
    rowDay,
    famDate: llqaFamDate(date, rowDay),
    attended: att,
    source: o.source || (old && old.source) || "log",
    createdAt: (old && old.createdAt) || nowIso,
    createdBy: (old && old.createdBy) || by,
    updatedAt: nowIso,
    by,
  };
  if (o.makeupId) rec.makeupId = o.makeupId;
  if (full)
    Object.assign(rec, {
      lesson,
      pages,
      book: pages ? book : "",
      behavior: f.behavior || "",
      performance: f.performance || "",
      homework: f.homework || "",
      recitation: f.recitation || "",
      tajweed: f.tajweed || "",
      notes: String(f.notes || "").trim(),
    });
  const next = dp.filter((p) => String(p.id) !== key).concat([rec]);
  setDp((prev) => (prev || []).filter((p) => String(p.id) !== key).concat([rec]));
  const fields = llqaStuFields(stu, next, dp);
  // the class note goes on the student's notes too, as before (not again when the same note is saved twice)
  const note = full ? rec.notes : "";
  if (note && !(old && String(old.notes || "").trim() === note)) fields.notes = stu.notes ? stu.notes + " | " + note : note;
  const setS = o.setStudents || ctx.setStudents;
  if (Object.keys(fields).length && typeof setS === "function")
    setS((prev) => (prev || []).map((x) => (String(x.id) === String(stu.id) ? { ...x, ...fields } : x)));
  // the moment a trial reaches its classes: offer the fee message (once)
  if (llqaInTrial(stu) && typeof llqaAfterCount === "function")
    llqaAfterCount({ ...stu, attended: llqaTrialDone(stu, dp) }, { attended: llqaTrialDone(stu, next) });
  return "";
};
// a quick mark for a class of the day's list (Present / Late / Absent / Excused), keeping a lesson already logged
const llqaClassMark = (it, att, date) =>
  !it || !it.stu
    ? "This class is not linked to a student record."
    : llqaClassSave({
        studentId: it.stu.id,
        date,
        slot: it.slot,
        rowDay: it.rowDay,
        teacherId: it.covered && it.cover ? it.cover.coverId : it.teacherId,
        teacherName: it.by || it.teacher,
        attended: att,
        markOnly: true,
        source: "mark",
        makeupId: it.makeup ? it.makeup.id : undefined,
      });
// the office removes a class logged by mistake (the student's fields follow what is left)
const llqaClassRemove = (rec) => {
  const ctx = LLQAApp.ctx || {};
  if (!rec) return "";
  if (!llqaCanManage()) return "Only the office can remove a logged class.";
  if (typeof ctx.setDailyProgress !== "function") return "The page is still loading. Please try again.";
  ctx.setDailyProgress((prev) => (prev || []).filter((p) => String(p.id) !== String(rec.id)));
  const stu = (ctx.students || []).find((x) => String(x.id) === String(rec.studentId));
  if (stu && typeof ctx.setStudents === "function") {
    const fields = llqaStuFields(stu, (ctx.dailyProgress || []).filter((p) => String(p.id) !== String(rec.id)), ctx.dailyProgress || [], rec.date);
    if (Object.keys(fields).length) ctx.setStudents((prev) => (prev || []).map((x) => (String(x.id) === String(stu.id) ? { ...x, ...fields } : x)));
  }
  return "";
};

/* ---------- v73: screens for the class records ---------- */
const LLQA_MARKS = [
  ["present", "P", "Present"],
  ["late", "L", "Late"],
  ["absent", "A", "Absent"],
  ["excused", "E", "Excused"],
];
const llqaMarkCol = (a) =>
  a === "present" ? c.success : a === "late" ? c.warn : a === "absent" ? c.danger : a === "excused" ? c.purple : a === "leave" ? c.accent : c.textSec;
const llqaMarkWord = (a) => ({ present: "Present", late: "Late", absent: "Absent", excused: "Excused" })[String(a || "").toLowerCase()] || "";
const llqaPctText = (p) => (p == null ? "—" : p + "%");
const llqaSlotText = (slot) => (slot ? LLQABooking.fmt12(slot) : "extra class");
// the teacher a class belongs to when it is logged (the substitute when one took it)
const llqaClsWho = (it) =>
  it ? { teacherId: it.covered && it.cover ? it.cover.coverId : it.teacherId, teacherName: it.by || it.teacher || "" } : { teacherId: "", teacherName: "" };
// is this class one of the signed-in teacher's own (their row, or one they cover)?
const llqaMyClass = (it, u) => {
  if (!u || u.role !== "teacher") return true;
  const me = String(u.teacherId != null ? u.teacherId : u.id);
  return String(it.teacherId) === me || (it.covered && it.cover && String(it.cover.coverId) === me);
};
const llqaMarkErr = (e) => {
  if (e) llqaToast({ kind: "info", ttl: 7000, text: e });
};
// four small buttons (P / L / A / E) for one class; the mark it has is filled in
const llqaMarkBtns = (it, date, cur, keyp) =>
  React.createElement(
    "div",
    { key: keyp, style: { display: "inline-flex", gap: 3 } },
    LLQA_MARKS.map(([k, l, w]) =>
      React.createElement(
        "button",
        {
          key: k,
          type: "button",
          title: w + (it && it.slot ? " — " + LLQABooking.fmt12(it.slot) + " class" : ""),
          "aria-label": w,
          "aria-pressed": cur === k,
          onClick: (e) => {
            e.stopPropagation();
            llqaMarkErr(llqaClassMark(it, k, date));
          },
          style: {
            minWidth: 24,
            padding: "3px 6px",
            borderRadius: 5,
            border: "1px solid " + llqaAlpha(llqaMarkCol(k), cur === k ? "ff" : "55"),
            background: cur === k ? llqaAlpha(llqaMarkCol(k), "2e") : "transparent",
            color: llqaMarkCol(k),
            fontSize: 10,
            fontWeight: 800,
            cursor: "pointer",
          },
        },
        l,
      ),
    ),
  );

/* ----- the window to log a class (Timetable, Today's classes, Students, Monthly Sheet) ----- */
const llqaDateInput = (value, onChange, max) =>
  React.createElement("input", {
    type: "date",
    value,
    max,
    onChange: (e) => e.target.value && onChange(e.target.value),
    style: { width: "100%", boxSizing: "border-box", padding: "8px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 12 },
  });
const llqaFieldLabel = (t) =>
  React.createElement("label", { style: { display: "block", color: c.textSec, fontSize: 10, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 } }, t);
const LLQALogClassModal = ({ info, onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const today = todayPK();
  const stu = (ctx.students || []).find((x) => String(x.id) === String(info.studentId)) || null;
  const fixed = info.slot != null && info.slot !== ""; // opened for one booked class
  const [date, setDate] = React.useState(info.date && String(info.date) <= today ? String(info.date) : today);
  const [pick, setPick] = React.useState("");
  const [err, setErr] = React.useState("");
  const dp = ctx.dailyProgress || [];
  const opts = stu && !fixed ? llqaStuClassesOn(stu.id, date) : [];
  let it = null;
  if (!fixed && opts.length && pick !== "x")
    it = opts.find((x) => String(x.slot) === pick) || opts.find((x) => !llqaClsFind(dp, stu.id, date, x.slot)) || opts[0];
  const slot = fixed ? String(info.slot) : it ? String(it.slot) : "";
  const who = fixed
    ? { teacherId: info.teacherId != null ? info.teacherId : "", teacherName: info.teacherName || "" }
    : it
      ? llqaClsWho(it)
      : u.role === "teacher"
        ? { teacherId: u.teacherId != null ? u.teacherId : u.id, teacherName: u.name || "" }
        : { teacherId: "", teacherName: (stu && stu.teacher) || "" };
  const rowDay = fixed ? info.day || info.rowDay || "" : it ? it.rowDay : "";
  const makeupId = fixed ? info.makeupId : it && it.makeup ? it.makeup.id : undefined;
  const old = stu ? llqaClsFind(dp, stu.id, date, slot) : null;
  const book = llqaBookOf(stu);
  const logged = !!(stu && stu.lastDate); // the student's own last values only once a class was logged
  const init = () =>
    old
      ? {
          attended: llqaMarkWord(old.attended) || "Present",
          lesson: old.lesson || "",
          pages: old.pages || "",
          behavior: old.behavior || "",
          performance: old.performance || "",
          homework: old.homework || "",
          recitation: old.recitation || "",
          tajweed: old.tajweed || "",
          notes: old.notes || "",
        }
      : {
          attended: "Present",
          lesson: "",
          pages: "",
          behavior: (logged && stu.lB) || "Good",
          performance: (logged && stu.lP) || "Satisfactory",
          homework: (logged && stu.lH) || "Not Assigned",
          recitation: (logged && stu.lR) || "N/A",
          tajweed: (logged && stu.lT) || "N/A",
          notes: "",
        };
  // (the form starts again when the day or the class changes — and when the class's saved record arrives from the cloud
  // after the window opened, so a save never overwrites it with empty fields)
  const fkNow = date + "|" + slot + "|" + (old ? "saved" : "new");
  // this computer's own records still loading for that month: wait (whether it was logged is not known yet)
  const ownList = dp === LLQACls.view(LLQACls.legacy);
  const loading = ownList && !llqaClsReady(date.slice(0, 7));
  React.useEffect(() => {
    if (typeof ctx.clsNeed === "function") ctx.clsNeed(date.slice(0, 7));
  }, [date]);
  const [form, setForm] = React.useState(init);
  const [fk, setFk] = React.useState(fkNow);
  if (fk !== fkNow) {
    setFk(fkNow);
    setForm(init());
  }
  const set = (k, v) => {
    setErr("");
    setForm((f) => ({ ...f, [k]: v }));
  };
  const attended = String(form.attended || "Present").toLowerCase();
  const needLesson = attended === "present" || attended === "late";
  const st = stu ? llqaStuStats(stu) : null;
  const reach = st ? st.reach : null;
  const trialN = stu ? llqaTrialDone(stu) : 0;
  const cl = info.cell || {};
  const famTime = String(cl.t || "").replace(/\s+(USA|CA)$/i, "").trim();
  const famDay = cl.day || info.day || "";
  const which = fixed
    ? [famDay ? famDay + (famTime ? " " + LLQABooking.timeLabel(famTime) + " family time" : " class") : "", LLQABooking.fmt12(slot) + " PKT slot"].filter(Boolean).join(" → ")
    : "";
  const save = () => {
    if (!stu) return;
    const e = llqaClassSave({ studentId: stu.id, date, slot, rowDay, teacherId: who.teacherId, teacherName: who.teacherName, makeupId, form, source: info.source || (fixed ? "timetable" : "students") });
    if (e) {
      setErr(e);
      return;
    }
    onClose();
  };
  const remove = () => {
    if (!old || !confirm("Remove this logged class (" + llqaDateLabel(date) + ", " + llqaSlotText(slot) + ")?")) return;
    const e = llqaClassRemove(old);
    if (e) setErr(e);
    else onClose();
  };
  const note = (text, col, bg, key) =>
    React.createElement("div", { key, style: { padding: "8px 10px", background: bg || c.bgDeep, color: col || c.textSec, borderRadius: 8, fontSize: 11, marginBottom: 10, lineHeight: 1.45 } }, text);
  const sub = [who.teacherName || info.teacherName || "", which, (fixed ? "logged for " : "") + llqaDateLabel(date) + " (Pakistan)"].filter(Boolean).join(" · ");
  const body = React.createElement(
    "div",
    null,
    !stu && note("This booking is not linked to a student record, so the class can't be logged. Add the student in Sales or Students first.", c.warn, c.warnBg, "nl"),
    stu && llqaInTrial(stu) && note("Trial student · " + trialN + " of " + llqaTrialTarget(stu) + " classes attended so far" + (trialN >= llqaTrialTarget(stu) ? " — trial done, fee due" : ""), c.accent, c.accentBg, "tr"),
    stu && reach && note((reach.book === "qaida" ? "Qaida: page " + reach.page + " of " + reach.total : "Quran: page " + reach.page + " of " + reach.total + " · Juz " + reach.juz) + " (" + reach.pctText + ")", c.textSec, null, "lv"),
    stu && !old && st && st.lastFull && note("Last lesson (" + llqaDateLabel(st.lastFull.date) + "): " + st.lastFull.lesson, c.textSec, null, "ll"),
    old && note("Already logged by " + (old.by || old.teacherName || "someone") + " — saving updates this class (it is not counted twice).", c.textMuted, null, "al"),
    loading && note("Loading this month's classes…", c.textMuted, null, "ld"),
    stu && !fixed &&
      React.createElement(
        "div",
        { key: "dc", style: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "0 12px", marginBottom: 12 } },
        React.createElement("div", null, llqaFieldLabel("Day (Pakistan)"), llqaDateInput(date, (v) => { setErr(""); setDate(v <= today ? v : today); }, today)),
        React.createElement(
          "div",
          null,
          llqaFieldLabel("Class"),
          opts.length
            ? React.createElement(
                LLQASelect,
                {
                  value: it ? String(it.slot) : "x",
                  onChange: (e) => setPick(e.target.value),
                  style: { width: "100%", padding: "8px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 12 },
                },
                opts.map((x) => {
                  const k = llqaClassState(x, date, llqaNowPkMin()).k;
                  const why = { leave: "student on leave", holiday: "holiday", off: "class off", cover: "needs a substitute", noteacher: "teacher was on leave" }[k];
                  return React.createElement(
                    "option",
                    { key: x.key, value: String(x.slot) },
                    LLQABooking.fmt12(x.slot) + " · " + (x.by || x.teacher) + (llqaClsFind(dp, stu.id, date, x.slot) ? " · logged" : why ? " · " + why : ""),
                  );
                }),
                React.createElement("option", { key: "x", value: "x" }, "An extra class (not in the Timetable)"),
              )
            : React.createElement("div", { style: { color: c.textSec, fontSize: 11, padding: "8px 0" } }, "No class booked that day — it is saved as an extra class."),
        ),
      ),
    stu &&
      React.createElement(
        "div",
        { key: "ap", style: { display: "grid", gridTemplateColumns: book === "none" ? "1fr" : "1fr 1fr", gap: "0 12px" } },
        React.createElement(Inp, { label: "Attendance", value: form.attended || "Present", onChange: (v) => set("attended", v), options: ATT_OPTS }),
        book !== "none" &&
          React.createElement(Inp, {
            label: book === "qaida" ? "Qaida page reached" : "Quran page reached",
            value: form.pages || "",
            onChange: (v) => set("pages", v),
            placeholder: reach ? "last: " + reach.page : book === "qaida" ? "1–30" : "1–604",
          }),
      ),
    stu && React.createElement(Inp, { key: "le", label: needLesson ? "Lesson taught *" : "Lesson taught", value: form.lesson || "", onChange: (v) => set("lesson", v), placeholder: needLesson ? "What was taught in this class" : "Not needed for an absent student" }),
    stu &&
      React.createElement(
        "div",
        { key: "bp", style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "Behavior", value: form.behavior || "", onChange: (v) => set("behavior", v), options: BEHAV_OPTS }),
        React.createElement(Inp, { label: "Performance", value: form.performance || "", onChange: (v) => set("performance", v), options: PERF_OPTS }),
        React.createElement(Inp, { label: "Homework", value: form.homework || "", onChange: (v) => set("homework", v), options: HW_OPTS }),
      ),
    stu &&
      React.createElement(
        "div",
        { key: "rt", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" } },
        React.createElement(Inp, { label: "Recitation", value: form.recitation || "", onChange: (v) => set("recitation", v), options: RECIT_OPTS }),
        React.createElement(Inp, { label: "Tajweed", value: form.tajweed || "", onChange: (v) => set("tajweed", v), options: TAJ_OPTS }),
      ),
    stu && React.createElement(Inp, { key: "no", label: "Notes", value: form.notes || "", onChange: (v) => set("notes", v), placeholder: "Optional" }),
    err && React.createElement("div", { key: "er", role: "alert", style: { color: c.danger, fontSize: 12, fontWeight: 600, marginTop: 2 } }, err),
  );
  return llqaShell(
    "✍ Log class — " + ((stu && stu.name) || info.studentName || "?"),
    sub,
    body,
    [
      old && llqaCanManage() ? llqaMini("Remove this log", remove, { key: "rm", big: true, tone: "danger" }) : null,
      llqaMini("Cancel", onClose, { key: "x", big: true }),
      stu ? llqaMini(old ? "Save changes" : "Save class", save, { key: "ok", big: true, solid: true, tone: "accent", icon: "check-circle", disabled: loading, title: loading ? "Loading this month's classes…" : "" }) : null,
    ],
    { onClose, width: 520 },
  );
};

/* ----- the student's progress (student details) ----- */
const LLQAStuProgress = ({ s, bc }) => {
  const st = llqaStuStats(s);
  const r = st.reach;
  const book = llqaBookOf(s);
  const box = (kids, key, extra) => React.createElement("div", { key, style: { background: c.bgDeep, borderRadius: 8, padding: "10px 12px", marginBottom: 12, ...(extra || {}) } }, kids);
  const h = (t, key) => React.createElement("h4", { key, style: { color: c.text, fontSize: 12, margin: "0 0 8px", fontWeight: 600 } }, t);
  const lf = st.lastFull;
  const tiles = lf
    ? [
        ["Behavior", lf.behavior, bc ? bc(lf.behavior) : c.text],
        ["Performance", lf.performance, lf.performance === "Outstanding" || lf.performance === "Very Good" ? c.success : lf.performance === "Below Average" || lf.performance === "Struggling" ? c.danger : c.textSec],
        ["Homework", lf.homework, lf.homework === "Completed" ? c.success : lf.homework === "Not Done" ? c.danger : c.warn],
        ["Recitation", lf.recitation, lf.recitation === "Fluent & Clear" ? c.success : c.textSec],
        ["Tajweed", lf.tajweed, lf.tajweed === "Excellent Tajweed" ? c.success : c.textSec],
      ].filter(([, v]) => v && v !== "N/A")
    : [];
  return React.createElement(
    React.Fragment,
    null,
    h("Course Progress", "h1"),
    box(
      book === "none"
        ? React.createElement("div", { style: { color: c.textSec, fontSize: 11 } }, "A Subject course — progress is in the lessons below (no book pages).")
        : [
            React.createElement(
              "div",
              { key: "t", style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
              React.createElement("span", { style: { color: c.textSec, fontSize: 11 } }, book === "qaida" ? "Qaida" : "Quran"),
              React.createElement("span", { style: { color: c.accent, fontWeight: 700 } }, r ? r.pctText : "—"),
            ),
            React.createElement(PBar, { key: "b", value: r ? r.pct : 0, color: r && r.pct >= 80 ? c.success : r && r.pct >= 40 ? c.accent : c.warn }),
            React.createElement(
              "div",
              { key: "d", style: { display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10 } },
              React.createElement("span", { style: { color: c.textSec } }, r ? llqaReachText(r) : "No page logged yet"),
              React.createElement("span", { style: { color: book === "qaida" ? c.purple : c.accent } }, r && r.date ? "as of " + llqaDateLabel(r.date) : s.surah || ""),
            ),
          ],
      "pr",
    ),
    h("Attendance — last 30 days", "h2"),
    box(
      React.createElement(
        "div",
        { style: { display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: c.textSec } },
        React.createElement("span", { key: "p" }, React.createElement("b", { style: { color: c.text } }, llqaPctText(st.last30.pct)), " attended"),
        React.createElement("span", { key: "c" }, st.last30.classes + " class" + (st.last30.classes === 1 ? "" : "es") + " logged"),
        React.createElement("span", { key: "a", style: { color: st.last30.absent ? c.danger : c.textSec } }, st.last30.absent + " absent"),
        React.createElement("span", { key: "l" }, st.last30.late + " late"),
        st.last30.excused ? React.createElement("span", { key: "e" }, st.last30.excused + " excused") : null,
      ),
      "at",
    ),
    h("Last Session", "h3"),
    tiles.length
      ? React.createElement(
          "div",
          { key: "ls", style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 } },
          tiles.map(([l, v, col]) =>
            React.createElement(
              "div",
              { key: l, style: { background: c.bgDeep, borderRadius: 6, padding: "6px 10px" } },
              React.createElement("div", { style: { color: c.textSec, fontSize: 9, textTransform: "uppercase", marginBottom: 2 } }, l),
              React.createElement("div", { style: { color: col, fontSize: 11, fontWeight: 600 } }, v),
            ),
          ),
        )
      : box(React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "No class logged yet."), "nl"),
    h("Recent classes", "h4"),
    box(
      st.recs.length
        ? st.recs.slice(0, 8).map((p, i) =>
            React.createElement(
              "div",
              { key: p.id || i, style: { display: "flex", gap: 8, alignItems: "baseline", padding: "5px 0", borderTop: i ? "1px solid " + llqaAlpha(c.border, "66") : "none", fontSize: 11 } },
              React.createElement("span", { style: { color: c.text, fontWeight: 600, minWidth: 92 } }, llqaDateLabel(p.date)),
              React.createElement("span", { style: { color: c.textSec, minWidth: 68 } }, llqaSlotText(p.slot)),
              React.createElement("span", { style: { color: llqaMarkCol(p.attended), fontWeight: 700, minWidth: 56 } }, llqaMarkWord(p.attended) || "—"),
              React.createElement("span", { style: { color: c.textSec, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: p.lesson || "" }, [p.lesson, p.pages ? "page " + p.pages : "", p.teacherName].filter(Boolean).join(" · ")),
            ),
          )
        : React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "No class logged yet."),
      "rc",
      { padding: "6px 12px" },
    ),
  );
};

/* ----- Students → Attendance: 30-day spread and the quick marks of today's classes ----- */
const llqaAttBuckets = (students) => {
  const b = [
    { r: "95-100%", n: 0 },
    { r: "90-94%", n: 0 },
    { r: "85-89%", n: 0 },
    { r: "80-84%", n: 0 },
    { r: "<80%", n: 0 },
  ];
  let none = 0;
  (students || []).forEach((s) => {
    const p = llqaStuStats(s).last30.pct;
    if (p == null) none++;
    else b[p >= 95 ? 0 : p >= 90 ? 1 : p >= 85 ? 2 : p >= 80 ? 3 : 4].n++;
  });
  return { data: b, none };
};
const LLQAQuickMark = ({ students }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const today = todayPK();
  const nowMin = llqaNowPkMin();
  const dp = ctx.dailyProgress || [];
  const day = llqaClassesOn(today, ctx.teachers || [], ctx.students || [], dp).filter((it) => it.stu && llqaMyClass(it, u));
  const byStu = new Map();
  day.forEach((it) => {
    const k = String(it.stu.id);
    if (!byStu.has(k)) byStu.set(k, []);
    byStu.get(k).push(it);
  });
  const rows = (students || []).map((s) => ({ s, st: llqaStuStats(s), cls: byStu.get(String(s.id)) || [] }));
  rows.sort(
    (a, b) =>
      (b.cls.length ? 1 : 0) - (a.cls.length ? 1 : 0) ||
      (a.cls.length && b.cls.length ? a.cls[0].min - b.cls[0].min : 0) ||
      (a.st.last30.pct == null ? 101 : a.st.last30.pct) - (b.st.last30.pct == null ? 101 : b.st.last30.pct) ||
      String(a.s.name).localeCompare(String(b.s.name)),
  );
  const td = (kids, key, st) => React.createElement("td", { key, style: { padding: "7px 8px", verticalAlign: "middle", ...(st || {}) } }, kids);
  const ready = llqaClsReady();
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", margin: "0 0 10px" } },
      React.createElement("h4", { style: { color: c.text, fontSize: 13, margin: 0, fontWeight: 600 } }, "Quick Mark — Today (" + llqaDateLabel(today) + ", Pakistan)"),
      React.createElement(
        "div",
        { style: { color: c.textMuted, fontSize: 11 } },
        (ready ? "" : "Loading the class records… · ") + "Each class of today is marked on its own · P Present · L Late · A Absent · E Excused · counts are the last 30 days",
      ),
    ),
    React.createElement(
      "div",
      { style: { overflowX: "auto", borderRadius: 10, border: "1px solid " + c.border } },
      React.createElement(
        "table",
        { style: { width: "100%", borderCollapse: "collapse", fontSize: 11 } },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            ["Student", "Teacher", "Classes", "Attended", "Missed", "Rate", "Today's classes"].map((h) =>
              React.createElement(
                "th",
                { key: h, style: { padding: "9px 8px", textAlign: "left", color: c.textSec, fontWeight: 600, fontSize: 9, textTransform: "uppercase", borderBottom: "1px solid " + c.border, background: c.bgDeep, whiteSpace: "nowrap" } },
                h,
              ),
            ),
          ),
        ),
        React.createElement(
          "tbody",
          null,
          llqaEmptyRow("No active students yet", "Each active student’s classes attended and missed show here."),
          rows.map(({ s, st, cls }, i) =>
            React.createElement(
              "tr",
              { key: s.id, style: { borderBottom: "1px solid " + c.border, background: i % 2 ? llqaAlpha(c.bgDeep, "88") : "transparent" } },
              td(React.createElement("span", { style: { fontWeight: 600 } }, s.name), "n"),
              td(String(s.teacher || "—").split(" ").slice(-2).join(" "), "t", { color: c.textSec, fontSize: 10 }),
              td(st.last30.classes, "c", { color: c.textSec }),
              td(st.last30.attended, "a", { color: c.success, fontWeight: 600 }),
              td(st.last30.absent, "m", { color: st.last30.absent ? c.danger : c.textSec }),
              td(
                React.createElement(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: 4, minWidth: 80 } },
                  React.createElement(PBar, { value: st.last30.pct || 0, color: st.last30.pct == null ? c.border : st.last30.pct >= 95 ? c.success : st.last30.pct >= 85 ? c.warn : c.danger }),
                  React.createElement("span", { style: { fontSize: 10, fontWeight: 600, color: st.last30.pct == null ? c.textMuted : st.last30.pct >= 95 ? c.success : st.last30.pct >= 85 ? c.warn : c.danger } }, llqaPctText(st.last30.pct)),
                ),
                "r",
              ),
              td(
                cls.length
                  ? React.createElement(
                      "div",
                      { style: { display: "flex", flexDirection: "column", gap: 4 } },
                      cls.map((it) => {
                        const rec = llqaClsFind(dp, s.id, today, it.slot);
                        const state = llqaClassState({ ...it, entry: rec }, today, nowMin);
                        const blocked = ["leave", "holiday", "off", "quit", "noteacher", "cover"].includes(state.k);
                        return React.createElement(
                          "div",
                          { key: it.key, style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
                          React.createElement("span", { style: { color: c.textSec, fontSize: 10, minWidth: 54 } }, LLQABooking.fmt12(it.slot)),
                          blocked ? React.createElement("span", { style: { color: state.col, fontSize: 10, fontWeight: 600 } }, state.text) : llqaMarkBtns(it, today, rec ? rec.attended : "", "b"),
                        );
                      }),
                    )
                  : React.createElement("span", { style: { color: c.textMuted, fontSize: 10 } }, "No class today"),
                "d",
              ),
            ),
          ),
        ),
      ),
    ),
  );
};

/* ----- Students → Daily Progress: today's classes and each student's latest lesson ----- */
const LLQADailyProgress = ({ students, bc, onLog }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const today = todayPK();
  const nowMin = llqaNowPkMin();
  const dp = ctx.dailyProgress || [];
  const day = llqaClassesOn(today, ctx.teachers || [], ctx.students || [], dp).filter((it) => it.stu && llqaMyClass(it, u));
  const byStu = new Map();
  day.forEach((it) => {
    const k = String(it.stu.id);
    if (!byStu.has(k)) byStu.set(k, []);
    byStu.get(k).push({ ...it, st: llqaClassState(it, today, nowMin) });
  });
  const rank = (cls) =>
    !cls.length ? 4 : cls.some((x) => x.st.k === "missing") ? 0 : cls.some((x) => x.st.k === "now" || x.st.k === "upcoming") ? 1 : cls.some((x) => ["logged", "absent", "excused"].includes(x.st.k)) ? 2 : 3;
  const cards = (students || []).map((s) => {
    const cls = byStu.get(String(s.id)) || [];
    return { s, cls, st: llqaStuStats(s), r: rank(cls) };
  });
  cards.sort((a, b) => a.r - b.r || (a.cls[0] ? a.cls[0].min : 9999) - (b.cls[0] ? b.cls[0].min : 9999) || String(a.s.name).localeCompare(String(b.s.name)));
  const all = Array.from(byStu.values()).flat().filter((x) => (students || []).some((s) => String(s.id) === String(x.stu.id)));
  const n = (f) => all.filter(f).length;
  const tag = (text, col, key) => React.createElement("span", { key, style: { fontSize: 9, padding: "1px 5px", borderRadius: 3, background: llqaAlpha(col, "20"), color: col } }, text);
  return React.createElement(
    React.Fragment,
    null,
    React.createElement("h4", { style: { color: c.text, margin: "0 0 10px", fontSize: 13, fontWeight: 600 } }, "Today — " + llqaDateLabel(today) + " (Pakistan)" + (llqaClsReady() ? "" : " · loading the class records…")),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      llqaStat("Classes today", all.length, u.role === "teacher" ? "yours" : "these students"),
      llqaStat("Logged", n((x) => ["logged", "absent", "excused"].includes(x.st.k)), "saved", n((x) => ["logged", "absent", "excused"].includes(x.st.k)) ? c.success : c.text),
      llqaStat("Not logged", n((x) => x.st.k === "missing"), "class time passed", n((x) => x.st.k === "missing") ? c.danger : c.text),
      llqaStat("Upcoming", n((x) => x.st.k === "upcoming" || x.st.k === "now"), "later today"),
    ),
    React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 10 } },
      cards.length === 0 && React.createElement("div", { style: { color: c.textMuted, fontSize: 12 } }, "No active students yet."),
      cards.map(({ s, cls, st, r }) => {
        const lf = st.lastFull;
        const reach = st.reach;
        return React.createElement(
          "div",
          {
            key: s.id,
            style: {
              background: c.bgCard,
              boxShadow: c.shadow3d,
              borderRadius: 8,
              padding: "10px 12px",
              border: "1px solid " + (r === 0 ? llqaAlpha(c.danger, "66") : r === 2 ? llqaAlpha(c.success, "66") : c.border),
            },
          },
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 6 } },
            React.createElement(
              "div",
              { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 } },
              React.createElement("div", { style: { width: 28, height: 28, flexShrink: 0, borderRadius: 6, background: c.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.accent } }, String(s.name || "?")[0]),
              React.createElement(
                "div",
                { style: { minWidth: 0 } },
                React.createElement("div", { style: { color: c.text, fontSize: 11, fontWeight: 600 } }, s.name + (s.age ? " (" + s.age + ")" : "")),
                React.createElement("div", { style: { color: c.textSec, fontSize: 9 } }, (s.teacher || "—") + " \xB7 " + (s.course || "—")),
              ),
            ),
            llqaMini("✍ Log", () => onLog(s), { key: "lg", tone: r === 0 ? "danger" : "success", solid: r === 0, title: "Log a class" }),
          ),
          cls.length
            ? React.createElement(
                "div",
                { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 } },
                cls.map((x) => llqaPill(LLQABooking.fmt12(x.slot) + " · " + x.st.text, x.st.col, null, x.key)),
              )
            : null,
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
            React.createElement(
              "div",
              { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { color: lf ? c.text : c.textMuted, fontSize: 10, fontWeight: 500 } }, lf ? lf.lesson : "No class logged yet"),
              lf
                ? React.createElement(
                    "div",
                    { style: { display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" } },
                    tag(llqaDateLabel(lf.date), c.textSec, "d"),
                    lf.behavior ? tag(lf.behavior, bc ? bc(lf.behavior) : c.accent, "b") : null,
                    lf.performance && lf.performance !== "Satisfactory" ? tag(lf.performance, c.purple, "p") : null,
                    lf.homework && lf.homework !== "Not Assigned" ? tag("HW: " + lf.homework, lf.homework === "Completed" ? c.success : c.danger, "h") : null,
                  )
                : null,
            ),
            React.createElement(
              "div",
              { style: { textAlign: "right", marginLeft: 10 } },
              React.createElement("div", { style: { color: reach && reach.book === "qaida" ? c.purple : c.accent, fontSize: 14, fontWeight: 700 } }, reach ? (reach.book === "qaida" ? "P." : "Pg ") + reach.page : "—"),
              React.createElement("div", { style: { color: c.textSec, fontSize: 9 } }, reach ? (reach.book === "qaida" ? "of 30 · Qaida" : "Juz " + reach.juz) : llqaBookOf(s) === "none" ? "Subject" : "no page yet"),
            ),
          ),
        );
      }),
    ),
  );
};

/* ----- Students → Monthly Sheet: filled in from the class records ----- */
// one student on one day: the marks of their classes, else what the day was (leave, holiday, class off, not logged …)
const llqaSheetCell = (s, date, items, recs, today, nowMin) => {
  const marks = (recs || []).map((p) => String(p.attended || "").toLowerCase()).filter(Boolean);
  const open = (items || []).filter((it) => !llqaClsEntry(llqaDpIndex(recs || []), s.id, date, it.slot));
  const states = open.map((it) => llqaClassState({ ...it, entry: null }, date, nowMin).k);
  const missing = states.filter((k) => k === "missing").length;
  if (marks.length) return { marks, missing, states };
  if (!states.length) return { marks: [], missing: 0, states: [], none: true };
  const k = states.includes("missing") ? "missing" : states[0];
  return { marks: [], missing, states, k };
};
const LLQA_SHEET_SIGN = {
  leave: ["V", "On leave"],
  holiday: ["H", "Holiday"],
  off: ["–", "Class off"],
  noteacher: ["–", "Teacher was on leave"],
  cover: ["·", "Needs a substitute"],
  missing: ["!", "Not logged yet"],
  upcoming: ["·", "Upcoming"],
  now: ["·", "Class now"],
  quit: ["", "Quit"],
};
const LLQAMonthSheet = ({ students }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const today = todayPK();
  const nowMin = llqaNowPkMin();
  const [ym, setYm] = React.useState(today.slice(0, 7));
  const [search, setSearch] = React.useState("");
  const [tf, setTf] = React.useState("all");
  const [win, setWin] = React.useState(null); // {sid, date}
  React.useEffect(() => {
    if (typeof ctx.clsNeed === "function") ctx.clsNeed(ym);
  }, [ym]);
  const dp = ctx.dailyProgress || [];
  const dpx = llqaDpIndex(dp);
  const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
  const nDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dates = Array.from({ length: nDays }, (_, i) => ym + "-" + String(i + 1).padStart(2, "0"));
  const monthName = new Date(Date.UTC(y, m - 1, 15)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const mine = (students || []).map((s) => String(s.id));
  const inMonth = new Set(dp.filter((p) => String(p.date).slice(0, 7) === ym).map((p) => String(p.studentId)));
  let list = (students || []).filter((s) => s.status === "active" || s.status === "leave" || inMonth.has(String(s.id)));
  const teacherOpts = ["all", ...Array.from(new Set(list.map((s) => s.teacher).filter(Boolean))).sort()];
  if (tf !== "all") list = list.filter((s) => s.teacher === tf);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((s) => [s.name, s.code, s.parent].some((v) => String(v || "").toLowerCase().includes(q)));
  }
  list = list.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  // each day's classes of these students (today's Timetable; days to come are not filled)
  const ids = new Set(mine);
  const dayItems = new Map();
  dates.forEach((d) => {
    if (d > today) return;
    const per = new Map();
    llqaClassesOn(d, ctx.teachers || [], ctx.students || [], dp).forEach((it) => {
      if (!it.stu || !ids.has(String(it.stu.id)) || !llqaMyClass(it, u)) return;
      const k = String(it.stu.id);
      if (!per.has(k)) per.set(k, []);
      per.get(k).push(it);
    });
    dayItems.set(d, per);
  });
  const monthRecs = new Map(); // "student|day" → that day's records
  dp.forEach((p) => {
    if (!p || p.studentId == null || String(p.date).slice(0, 7) !== ym) return;
    const k = String(p.studentId) + "|" + p.date;
    if (!monthRecs.has(k)) monthRecs.set(k, []);
    monthRecs.get(k).push(p);
  });
  const recsOf = (sid, d) => monthRecs.get(String(sid) + "|" + d) || [];
  const cellOf = (s, d) => {
    if (d > today) return { future: true, marks: [], missing: 0 };
    const recs = recsOf(s.id, d);
    const from = llqaStuFrom(s); // before the student was registered and in the CRM no class is expected
    const c0 = llqaSheetCell(s, d, from && d < from ? [] : (dayItems.get(d) || new Map()).get(String(s.id)) || [], recs, today, nowMin);
    if (!recs.length && c0.none) {
      const old = (s.attendanceLog || {})[d]; // the sheet before v73
      if (old) return { ...c0, legacy: old };
    }
    return c0;
  };
  const grid = new Map(list.map((s) => [String(s.id), dates.map((d) => cellOf(s, d))]));
  const cellAt = (s, i) => grid.get(String(s.id))[i];
  const sumOf = (s) => {
    const t = { present: 0, late: 0, absent: 0, excused: 0, leave: 0, missing: 0 };
    dates.forEach((d, i) => {
      const x = cellAt(s, i);
      x.marks.forEach((a) => (t[a] = (t[a] || 0) + 1));
      if (x.legacy && t[x.legacy] != null) t[x.legacy]++;
      t.missing += x.missing || 0;
      if (!x.marks.length && x.k === "leave") t.leave++;
    });
    const counted = t.present + t.late + t.absent;
    return { ...t, pct: counted ? Math.round(((t.present + t.late) / counted) * 100) : null };
  };
  const sums = new Map(list.map((s) => [String(s.id), sumOf(s)]));
  const todayIn = today.slice(0, 7) === ym;
  const todayMarks = todayIn ? list.flatMap((s) => recsOf(s.id, today).map((p) => String(p.attended))) : [];
  const shift = (n) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 15));
    setYm(d.toISOString().slice(0, 7));
  };
  const markAll = (d) => {
    if (d > today) return;
    const todo = [];
    list.forEach((s) => {
      const from = llqaStuFrom(s);
      if (from && d < from) return; // before the student joined
      ((dayItems.get(d) || new Map()).get(String(s.id)) || []).forEach((it) => {
        if (llqaClsEntry(dpx, s.id, d, it.slot)) return;
        const k = llqaClassState({ ...it, entry: null }, d, nowMin).k;
        if (["leave", "holiday", "off", "quit", "noteacher", "cover"].includes(k)) return;
        todo.push(it);
      });
    });
    if (!todo.length) {
      llqaToast({ kind: "info", ttl: 6000, text: "Nothing to mark on " + llqaDateLabel(d) + " — every class of the students shown is marked (or off)." });
      return;
    }
    if (!confirm("Mark " + todo.length + " class" + (todo.length === 1 ? "" : "es") + " on " + llqaDateLabel(d) + " as Present?\n\nOnly classes with no mark yet; marks already given stay as they are.")) return;
    let bad = 0;
    todo.forEach((it) => {
      if (llqaClassMark(it, "present", d)) bad++;
    });
    llqaToast({ kind: "info", ttl: 6000, text: "Marked " + (todo.length - bad) + " class" + (todo.length - bad === 1 ? "" : "es") + " Present on " + llqaDateLabel(d) + (bad ? " · " + bad + " could not be marked" : "") + "." });
  };
  const csv = () => {
    const q = (v) => '"' + String(v == null ? "" : v).split('"').join('""') + '"';
    let out = "Student,Code,Teacher," + dates.map((d) => d.slice(8)).join(",") + ",Present,Late,Absent,Excused,Leave,Not logged,Att%\n";
    list.forEach((s) => {
      const t = sums.get(String(s.id));
      const cells = dates.map((d, i) => {
        const x = cellAt(s, i);
        if (x.marks.length) return x.marks.map((a) => (LLQA_MARKS.find((mk) => mk[0] === a) || ["", "?"])[1]).join("");
        if (x.legacy) return (LLQA_MARKS.find((mk) => mk[0] === x.legacy) || ["", x.legacy === "leave" ? "V" : "?"])[1];
        return x.k ? (LLQA_SHEET_SIGN[x.k] || [""])[0] : "";
      });
      out += [q(s.name), q(s.code), q(s.teacher), ...cells, t.present, t.late, t.absent, t.excused, t.leave, t.missing, t.pct == null ? "" : t.pct + "%"].join(",") + "\n";
    });
    const blob = new Blob([out], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monthly-attendance-" + ym + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const nav = { padding: "6px 12px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 6, color: c.text, cursor: "pointer", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 };
  // cells that stay in place while the rest scrolls are painted solid (the theme's card colour can be see-through)
  const solidCard = "linear-gradient(" + c.bgCard + ", " + c.bgCard + "), " + c.bg;
  const solidDeep = "linear-gradient(" + c.bgDeep + ", " + c.bgDeep + "), " + c.bg;
  const sticky = { position: "sticky", left: 0, zIndex: 1, background: solidCard, borderRight: "1px solid " + c.border };
  // P L A E ! (26 px each) and % (46 px), kept at the right edge
  const SUMW = [26, 26, 26, 26, 26, 46];
  const sumCol = (i) => ({ position: "sticky", right: SUMW.slice(i + 1).reduce((a, b) => a + b, 0), width: SUMW[i], minWidth: SUMW[i], maxWidth: SUMW[i], boxSizing: "border-box", borderLeft: i === 0 ? "1px solid " + c.border : "none" });
  const cellBox = (x) => {
    if (x.future) return { t: "", col: c.textMuted, title: "" };
    if (x.marks.length) {
      const t = x.marks.length > 2 ? x.marks.length + "✓" : x.marks.map((a) => (LLQA_MARKS.find((mk) => mk[0] === a) || ["", "?"])[1]).join("");
      const a0 = x.marks.includes("absent") && !x.marks.some(llqaIsAtt) ? "absent" : x.marks[0];
      return { t: t + (x.missing ? "!" : ""), col: llqaMarkCol(a0), fill: true, title: x.marks.map(llqaMarkWord).join(", ") + (x.missing ? " · a class not logged yet" : "") };
    }
    if (x.legacy) return { t: (LLQA_MARKS.find((mk) => mk[0] === x.legacy) || ["", x.legacy === "leave" ? "V" : "?"])[1], col: llqaMarkCol(x.legacy), fill: true, title: (llqaMarkWord(x.legacy) || "Leave") + " (from the sheet before the class records)" };
    if (x.k) {
      const sg = LLQA_SHEET_SIGN[x.k] || ["", ""];
      return { t: sg[0], col: x.k === "missing" ? c.danger : x.k === "leave" ? c.accent : c.textMuted, outline: x.k === "missing", title: sg[1] };
    }
    return { t: "", col: c.textMuted, title: "No class" };
  };
  const ready = llqaClsReady(ym);
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 } },
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 6 } },
        React.createElement("button", { type: "button", onClick: () => shift(-1), style: nav, title: "Previous month", "aria-label": "Previous month" }, React.createElement(ChevronLeft, { size: 14 })),
        React.createElement("div", { style: { padding: "6px 14px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 12, fontWeight: 700, minWidth: 130, textAlign: "center" } }, monthName),
        React.createElement("button", { type: "button", onClick: () => shift(1), style: nav, title: "Next month", "aria-label": "Next month" }, React.createElement(ChevronRight, { size: 14 })),
        React.createElement("button", { type: "button", onClick: () => setYm(today.slice(0, 7)), style: { ...nav, marginLeft: 6 } }, React.createElement(Calendar, { size: 12 }), "This month"),
      ),
      React.createElement(
        "div",
        { style: { position: "relative", flex: 1, minWidth: 200, maxWidth: 280 } },
        React.createElement(Search, { size: 13, style: { position: "absolute", left: 9, top: 9, color: c.textMuted } }),
        React.createElement("input", {
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "Search student / code / parent...",
          style: { width: "100%", padding: "7px 10px 7px 30px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 11, outline: "none", boxSizing: "border-box" },
        }),
      ),
      teacherOpts.length > 2
        ? React.createElement(
            LLQASelect,
            { value: tf, onChange: (e) => setTf(e.target.value), style: { padding: "7px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 11 } },
            teacherOpts.map((t) => React.createElement("option", { key: t, value: t }, t === "all" ? "All Teachers" : t)),
          )
        : null,
      React.createElement("button", { type: "button", onClick: csv, style: nav, title: "Export to CSV" }, React.createElement(Download, { size: 12 }), "Export CSV"),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
      React.createElement(SC, { icon: Users, label: "Students Visible", value: list.length, color: c.accent }),
      React.createElement(SC, { icon: Check, label: "Today · Present", value: todayIn ? todayMarks.filter((a) => a === "present").length : "—", color: c.success }),
      React.createElement(SC, { icon: UserX, label: "Today · Absent", value: todayIn ? todayMarks.filter((a) => a === "absent").length : "—", color: c.danger }),
      React.createElement(SC, { icon: Clock, label: "Today · Late", value: todayIn ? todayMarks.filter((a) => a === "late").length : "—", color: c.warn }),
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 12, flexWrap: "wrap", padding: "10px 14px", background: c.bgDeep, border: "1px solid " + c.border, borderRadius: 8, marginBottom: 12, fontSize: 11, color: c.textSec, alignItems: "center" } },
      React.createElement("span", { style: { fontWeight: 700, color: c.text } }, "Legend:"),
      [...LLQA_MARKS.map(([k, l, w]) => [l, w, llqaMarkCol(k), true]), ["V", "On leave", c.accent], ["H", "Holiday", c.textMuted], ["–", "Class off", c.textMuted], ["!", "Not logged yet", c.danger]].map(([l, w, col, fill]) =>
        React.createElement(
          "span",
          { key: w, style: { display: "flex", alignItems: "center", gap: 5 } },
          React.createElement("span", { style: { width: 18, height: 18, borderRadius: 4, background: fill ? llqaAlpha(col, "2e") : "transparent", border: "1px solid " + llqaAlpha(col, "77"), display: "flex", alignItems: "center", justifyContent: "center", color: col, fontSize: 10, fontWeight: 800 } }, l),
          w,
        ),
      ),
      React.createElement(
        "span",
        { style: { marginLeft: "auto", fontSize: 10, color: c.textMuted, fontStyle: "italic" } },
        (ready ? "" : "Loading the class records… · ") + "Filled in from the logged classes · click a day to mark a class · click a date to mark that day's unmarked classes Present",
      ),
    ),
    React.createElement(
      "div",
      { style: { background: c.bgCard, boxShadow: c.shadow3d, border: "1px solid " + c.border, borderRadius: 12, overflow: "hidden" } },
      list.length === 0
        ? React.createElement("div", { style: { textAlign: "center", padding: 50, color: c.textMuted, fontSize: 12 } }, "No students match your search/filter.")
        : React.createElement(
            "div",
            { style: { overflowX: "auto", maxHeight: "65vh", overflowY: "auto" } },
            React.createElement(
              "table",
              { style: { borderCollapse: "separate", borderSpacing: 0, fontSize: 11, minWidth: "100%" } },
              React.createElement(
                "thead",
                null,
                React.createElement(
                  "tr",
                  null,
                  React.createElement("th", { style: { ...sticky, top: 0, zIndex: 4, background: solidDeep, color: c.textSec, fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "10px 12px", textAlign: "left", borderBottom: "1px solid " + c.border, minWidth: 180 } }, "Student"),
                  dates.map((d) => {
                    const future = d > today;
                    const wd = llqaWeekday(d);
                    return React.createElement(
                      "th",
                      {
                        key: d,
                        onClick: future ? undefined : () => markAll(d),
                        title: future ? "" : "Mark the unmarked classes of " + llqaDateLabel(d) + " Present",
                        style: {
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          background: d === today ? "linear-gradient(" + c.accentBg + ", " + c.accentBg + "), " + solidDeep : solidDeep,
                          color: d === today ? c.accent : c.textSec,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "6px 2px",
                          textAlign: "center",
                          borderBottom: "1px solid " + c.border,
                          cursor: future ? "default" : "pointer",
                          minWidth: 30,
                        },
                      },
                      React.createElement("div", null, Number(d.slice(8))),
                      React.createElement("div", { style: { fontSize: 9, fontWeight: 500, color: c.textMuted } }, wd.slice(0, 2)),
                    );
                  }),
                  // the totals stay in view at the right while the days scroll
                  ["P", "L", "A", "E", "!", "%"].map((h, i) =>
                    React.createElement("th", { key: "s" + h, style: { ...sumCol(i), top: 0, zIndex: 3, background: solidDeep, color: c.textSec, fontSize: 10, fontWeight: 700, padding: "6px 0", textAlign: "center", borderBottom: "1px solid " + c.border } }, h),
                  ),
                ),
              ),
              React.createElement(
                "tbody",
                null,
                list.map((s) => {
                  const t = sums.get(String(s.id));
                  return React.createElement(
                    "tr",
                    { key: s.id },
                    React.createElement(
                      "td",
                      { style: { ...sticky, padding: "6px 12px", borderBottom: "1px solid " + llqaAlpha(c.border, "88") } },
                      React.createElement("div", { style: { color: c.text, fontWeight: 600 } }, s.name),
                      React.createElement("div", { style: { color: c.textMuted, fontSize: 9 } }, (s.teacher || "—") + (s.status === "leave" ? " · on leave" : s.status === "quit" ? " · quit" : "")),
                    ),
                    dates.map((d, i) => {
                      const x = cellAt(s, i);
                      const b = cellBox(x);
                      return React.createElement(
                        "td",
                        { key: d, style: { padding: 2, textAlign: "center", borderBottom: "1px solid " + llqaAlpha(c.border, "88"), background: d === today ? llqaAlpha(c.accent, "0d") : "transparent" } },
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            disabled: !!x.future,
                            title: llqaDateLabel(d) + (b.title ? " — " + b.title : ""),
                            "aria-label": s.name + ", " + llqaDateLabel(d) + (b.title ? ": " + b.title : ""),
                            onClick: () => setWin({ sid: s.id, date: d }),
                            style: {
                              width: 26,
                              height: 22,
                              borderRadius: 4,
                              border: "1px solid " + (b.fill || b.outline ? llqaAlpha(b.col, "88") : "transparent"),
                              background: b.fill ? llqaAlpha(b.col, "2e") : "transparent",
                              color: b.col,
                              fontSize: b.t.length > 2 ? 9 : 10,
                              fontWeight: 800,
                              cursor: x.future ? "default" : "pointer",
                              padding: 0,
                            },
                          },
                          b.t,
                        ),
                      );
                    }),
                    [t.present, t.late, t.absent, t.excused, t.missing].map((v, i) =>
                      React.createElement("td", { key: "n" + i, style: { ...sumCol(i), zIndex: 1, background: solidCard, textAlign: "center", padding: "6px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "88"), color: i === 4 && v ? c.danger : [c.success, c.warn, c.danger, c.purple, c.textMuted][i], fontWeight: 700 } }, v),
                    ),
                    React.createElement("td", { style: { ...sumCol(5), zIndex: 1, background: solidCard, textAlign: "center", padding: "6px 0", borderBottom: "1px solid " + llqaAlpha(c.border, "88"), color: t.pct == null ? c.textMuted : t.pct >= 90 ? c.success : t.pct >= 75 ? c.warn : c.danger, fontWeight: 700 } }, llqaPctText(t.pct)),
                  );
                }),
              ),
            ),
          ),
    ),
    win &&
      React.createElement(LLQASheetDayWin, {
        info: win,
        // (no class is offered before the student joined)
        items: (() => { const s = (students || []).find((x) => String(x.id) === String(win.sid)); const from = llqaStuFrom(s); return from && win.date < from ? [] : (dayItems.get(win.date) || new Map()).get(String(win.sid)) || []; })(),
        onClose: () => setWin(null),
      }),
  );
};
// one student's day on the sheet: each class with its four marks, its full log, or an extra class
const LLQASheetDayWin = ({ info, items, onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const dp = ctx.dailyProgress || [];
  const s = (ctx.students || []).find((x) => String(x.id) === String(info.sid));
  if (!s) return null;
  const d = info.date;
  const nowMin = llqaNowPkMin();
  const recs = llqaDpOf(dp, s.id).filter((p) => p.date === d);
  const slots = new Set(items.map((it) => String(it.slot)));
  const extra = recs.filter((p) => !slots.has(String(p.slot || "")) || !p.slot);
  const row = (kids, key) => React.createElement("div", { key, style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 0", borderTop: "1px solid " + llqaAlpha(c.border, "88") } }, kids);
  const logBtn = (it, p) =>
    llqaMini(p ? "✍ Edit log" : "✍ Full log", () => {
      onClose();
      llqaOpen("log", it ? { studentId: s.id, studentName: s.name, date: d, slot: it.slot, day: it.rowDay, teacherId: llqaClsWho(it).teacherId, teacherName: llqaClsWho(it).teacherName, cell: it.cell, makeupId: it.makeup ? it.makeup.id : undefined } : { studentId: s.id, studentName: s.name, date: d, slot: p && p.slot ? p.slot : undefined, teacherId: p ? p.teacherId : undefined, teacherName: p ? p.teacherName : undefined, day: p ? p.rowDay : undefined });
    }, { key: "lg" });
  return llqaShell(
    "📅 " + s.name + " — " + llqaDateLabel(d),
    "Pakistan date · " + (items.length ? items.length + " class" + (items.length === 1 ? "" : "es") + " booked" : "no class booked"),
    React.createElement(
      "div",
      null,
      items.map((it) => {
        const p = llqaClsEntry(llqaDpIndex(dp), s.id, d, it.slot);
        const stt = llqaClassState({ ...it, entry: p }, d, nowMin);
        const blocked = !p && ["leave", "holiday", "off", "quit", "noteacher", "cover"].includes(stt.k);
        return row(
          [
            React.createElement("b", { key: "t", style: { color: c.text, fontSize: 12, minWidth: 64 } }, LLQABooking.fmt12(it.slot)),
            React.createElement("span", { key: "w", style: { color: c.textSec, fontSize: 11, flex: 1, minWidth: 120 } }, (it.by || it.teacher) + (it.makeup ? " · make-up" : "") + " · " + stt.text),
            blocked ? null : llqaMarkBtns(it, d, p ? p.attended : "", "mb"),
            blocked ? null : logBtn(it, p),
          ],
          it.key,
        );
      }),
      extra.map((p) =>
        row(
          [
            React.createElement("b", { key: "t", style: { color: c.text, fontSize: 12, minWidth: 64 } }, llqaSlotText(p.slot)),
            React.createElement("span", { key: "w", style: { color: llqaMarkCol(p.attended), fontSize: 11, fontWeight: 700, flex: 1 } }, (llqaMarkWord(p.attended) || "—") + (p.teacherName ? " · " + p.teacherName : "") + (p.lesson ? " · " + p.lesson : "")),
            logBtn(null, p),
          ],
          "x" + p.id,
        ),
      ),
      !items.length && !extra.length && React.createElement("div", { key: "n", style: { color: c.textSec, fontSize: 12, padding: "6px 0" } }, "No class was booked for " + s.name + " that day."),
    ),
    [
      llqaMini("Log an extra class", () => {
        onClose();
        llqaOpen("log", { studentId: s.id, studentName: s.name, date: d });
      }, { key: "ex", big: true, icon: "circle-plus" }),
      llqaMini("Close", onClose, { key: "x", big: true, solid: true, tone: "accent" }),
    ],
    { onClose, width: 560 },
  );
};

/* ============================================================
   v73.1: Students — a leave ends by itself; leave days stay leave days; classes not logged are chased
   ============================================================ */
// A student's leave as the record has it: { from, to, type, planned } (null = none). A fee hold has no end date.
const llqaLvSpan = (s) =>
  !s
    ? null
    : s.status === "leave"
      ? { from: s.lvFrom || "", to: s.lvTo || "", type: s.lvType || "", planned: false }
      : s.lvPlanned && s.lvFrom
        ? { from: s.lvFrom, to: s.lvTo || "", type: s.lvType || "", planned: true }
        : null;
// The days of a leave that is over when the record changes from p to n: { from, to, type } or null.
// (The same leave with other dates is a correction, not an end. A student back today was away until yesterday.)
const llqaLvClosed = (p, n, today) => {
  const a = llqaLvSpan(p);
  if (!a || !a.from) return null;
  const b = llqaLvSpan(n);
  if (b && (b.from === a.from || b.type === a.type)) return null;
  const y = llqaAddDays(today, -1);
  const to = a.to && a.to < y ? a.to : y;
  if (a.from > to) return null; // it never began
  return { from: a.from, to, type: a.type };
};
// Every change to the students list keeps the leaves that are over (lvHist), so the Monthly Sheet, Today's classes
// and the make-ups still see those days as leave after the student is back (before, they turned into "not logged").
const llqaLvHistApply = (prev, next) => {
  if (!Array.isArray(prev) || !Array.isArray(next) || prev === next) return next;
  const byId = new Map(prev.map((p) => [String(p && p.id), p]));
  const today = todayPK();
  let changed = false;
  const out = next.map((n) => {
    if (!n) return n;
    const p = byId.get(String(n.id));
    if (!p || p === n) return n;
    const h = llqaLvClosed(p, n, today);
    if (!h) return n;
    const base = Array.isArray(n.lvHist) ? n.lvHist : Array.isArray(p.lvHist) ? p.lvHist : [];
    if (base.some((x) => x && x.from === h.from && x.to === h.to)) return n;
    changed = true;
    return { ...n, lvHist: [...base, h].slice(-24) };
  });
  return changed ? out : next;
};
const llqaLvHistOn = (s, date) => !!s && Array.isArray(s.lvHist) && s.lvHist.some((h) => h && h.from && h.from <= date && (h.to || h.from) >= date);
// Away on that date: the leave on the record (a planned one counts on its dates), or one that is over.
const llqaStuAwayOn = (stu, date) =>
  !!stu &&
  ((stu.status === "leave"
    ? (!stu.lvFrom || stu.lvFrom <= date) && (!stu.lvTo || stu.lvTo >= date)
    : !!stu.lvPlanned && !!stu.lvFrom && stu.lvFrom <= date && (!stu.lvTo || stu.lvTo >= date)) ||
    llqaLvHistOn(stu, date));

// A leave is over the day after its last day: the student is active again by itself (a fee hold waits for the payment).
const llqaLeaveEndDue = (list, today) =>
  (list || []).filter((s) => s && s.status === "leave" && !s.feeHold && s.lvType !== "Fee hold" && s.lvTo && s.lvTo < today);
const llqaLeaveEndRun = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaCanManage() || !llqaReadyFor(["students"]) || typeof ctx.setStudents !== "function") return null;
  const today = todayPK();
  const due = llqaLeaveEndDue(ctx.students, today);
  if (!due.length) return null;
  const ids = new Set(due.map((s) => String(s.id)));
  const fields = { status: "active", lvType: "", lvFrom: "", lvTo: "", lvReason: "", lvPlanned: false, lvBackAt: today };
  ctx.setStudents((prev) => (prev || []).map((x) => (x && ids.has(String(x.id)) && llqaLeaveEndDue([x], today).length ? { ...x, ...fields } : x)));
  if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster(due.map((x) => ({ ...x, ...fields })));
  return due;
};
// back from leave in the last 2 days (for the office's notice)
const llqaBackFromLeave = (today) => {
  const t = today || todayPK();
  const y = llqaAddDays(t, -1);
  return (LLQAApp.ctx.students || []).filter((s) => s && s.status === "active" && s.lvBackAt && s.lvBackAt >= y && s.lvBackAt <= t);
};

/* ---------- classes with nothing logged ---------- */
const LLQA_UNLOG_DAYS = 7;
const LLQA_UNLOG_NEEDS = ["teachers", "students", "leaves", "covers", "makeups", "dailyProgress", "doc:settings/calendar"];
// who answers for a class: the substitute when one teaches it
const llqaClassOwner = (it) => {
  const w = llqaClsWho(it);
  return String(w.teacherId == null ? "" : w.teacherId);
};
const llqaOwnerName = (it) => llqaClsWho(it).teacherName || "";
// the classes a signed-in person looks after: a teacher their own (and the ones they cover), a team lead their
// team's, the office all; parents none
const llqaUnlogScope = (u, teachers) => {
  if (!u || u.role === "parent") return null;
  if (u.role === "teacher") {
    const me = String(u.teacherId != null ? u.teacherId : u.id);
    return (it) => llqaClassOwner(it) === me;
  }
  if (u.role === "teamlead") {
    const nm = String(u.name || "").trim().toLowerCase();
    const team = new Set((teachers || []).filter((t) => t && nm && String(t.teamLead || t.lead || "").trim().toLowerCase() === nm).map((t) => String(t.id)));
    if (u.teacherId != null && u.teacherId !== "") team.add(String(u.teacherId));
    return (it) => team.has(llqaClassOwner(it));
  }
  return llqaCanOpen("students") || llqaCanOpen("timetable") ? () => true : null;
};
// the lists the check needs, loaded from the cloud (changes still being sent don't matter here)
const llqaUnlogReady = () => {
  try {
    if (typeof LLQACloud !== "undefined" && LLQACloud.ready && LLQA_UNLOG_NEEDS.some((n) => !LLQACloud.ready(n))) return false;
    return typeof llqaClsReady !== "function" || llqaClsReady();
  } catch (e) {
    return false;
  }
};
// Classes of the last 7 days, and today's from 40 minutes after they began, with nothing logged → [{ date, it, key }],
// newest day first. Not: before the student joined, leave, holidays, classes off, a teacher on leave with no one
// teaching. A class logged that day at a time not in today's Timetable (moved since) stands for one of that day's
// classes, so a moved class is not asked for twice.
const llqaUnlogged = (u, opt) => {
  const ctx = LLQAApp.ctx || {};
  const o = opt || {};
  const today = o.today || todayPK();
  const nowMin = o.nowMin == null ? llqaNowPkMin() : o.nowMin;
  const mine = llqaUnlogScope(u, ctx.teachers);
  if (!mine) return [];
  const dp = ctx.dailyProgress || [];
  const dpx = llqaDpIndex(dp);
  const out = [];
  llqaDatesIn(llqaAddDays(today, -LLQA_UNLOG_DAYS), today).forEach((date) => {
    const per = new Map();
    llqaClassesOn(date, ctx.teachers || [], ctx.students || [], dp).forEach((it) => {
      if (!it || !it.stu) return;
      const k = String(it.stu.id);
      if (!per.has(k)) per.set(k, []);
      per.get(k).push(it);
    });
    per.forEach((items, sid) => {
      const from = llqaStuFrom(items[0].stu);
      if (from && date < from) return;
      const left = items.filter((it) => llqaClassState(it, date, nowMin).k === "missing");
      if (!left.length) return;
      const slots = new Set(items.map((it) => String(it.slot)));
      (dpx.byStu.get(sid) || [])
        .filter((p) => p && p.date === date && llqaIsClsKey(p.id) && p.slot && !slots.has(String(p.slot)))
        .forEach((p) => {
          if (!left.length) return;
          const pm = llqaSlotMin(p.slot);
          let bi = 0;
          left.forEach((it, i) => {
            if (Math.abs(it.min - pm) < Math.abs(left[bi].min - pm)) bi = i;
          });
          left.splice(bi, 1);
        });
      left.forEach((it) => {
        if (mine(it)) out.push({ date, it, key: date + "|" + it.key });
      });
    });
  });
  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.it.min - b.it.min);
};
// by teacher: [{ name, id, items }], most first
const llqaUnlogByTeacher = (list) => {
  const m = new Map();
  (list || []).forEach((x) => {
    const id = llqaClassOwner(x.it);
    const k = id || llqaOwnerName(x.it);
    if (!m.has(k)) m.set(k, { id, name: llqaOwnerName(x.it) || "—", items: [] });
    m.get(k).items.push(x);
  });
  return [...m.values()].sort((a, b) => b.items.length - a.items.length || String(a.name).localeCompare(String(b.name)));
};
const llqaUnlogWhen = (x) => llqaDateLabel(x.date) + " " + llqaSlotText(x.it.slot);
const llqaUnloggedToast = (list, u) => {
  const isT = u && u.role === "teacher";
  const n = list.length;
  const cls = n + " class" + (n === 1 ? "" : "es");
  const text = isT
    ? "📝 " + cls + " not logged yet: " + list.slice(0, 3).map((x) => x.it.stu.name + " (" + llqaUnlogWhen(x) + ")").join(", ") + (n > 3 ? " and " + (n - 3) + " more" : "") + ". Attendance, progress and the parents' portal wait for them."
    : (() => {
        const g = llqaUnlogByTeacher(list);
        return "📝 " + cls + " of the last " + LLQA_UNLOG_DAYS + " days not logged — " + g.slice(0, 4).map((t) => t.name + " " + t.items.length).join(", ") + (g.length > 4 ? " and " + (g.length - 4) + " more teachers" : "") + ".";
      })();
  return { kind: "unlogged", key: "unlogged", text, actions: [{ label: isT ? "Log them" : "See the list", run: () => llqaOpen("unlogged", {}) }] };
};
// the reminder to a teacher, on WhatsApp (their own number; nothing is sent by itself)
const llqaUnlogWaText = (t, items) =>
  "Assalamu alaikum " + String(t.name || "").replace(/^ZZ TEST /, "") + ", " + (items.length === 1 ? "this class is" : "these " + items.length + " classes are") + " not logged in the CRM yet:\n" +
  items.slice(0, 20).map((x) => "• " + llqaUnlogWhen(x) + " — " + x.it.stu.name).join("\n") + (items.length > 20 ? "\n… and " + (items.length - 20) + " more" : "") +
  "\nPlease log them today (attendance and lesson). JazakAllah khair.";
const llqaUnlogWa = (g) => {
  const t = (LLQAApp.ctx.teachers || []).find((x) => x && String(x.id) === String(g.id));
  const digits = t && t.phone ? llqaPhone(t.phone, "Pakistan") : "";
  if (!digits) return llqaToast({ kind: "info", ttl: 7000, text: "No phone number for " + g.name + " — add it in Teachers." });
  try {
    window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent(llqaUnlogWaText(t, g.items)), "_blank", "noopener");
  } catch (e) {}
};
// The list: one tap to mark (P / L / A / E), or the full log; by teacher for team leads and the office.
const LLQAUnloggedWin = ({ onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const isT = u.role === "teacher";
  const [tf, setTf] = React.useState("all");
  const ready = llqaUnlogReady();
  const all = ready ? llqaUnlogged(u) : [];
  const groups = llqaUnlogByTeacher(all);
  const shown = tf === "all" ? groups : groups.filter((g) => g.name === tf);
  const MAX = 150;
  let rowsLeft = MAX;
  const row = (x) => {
    const it = x.it;
    const w = llqaClsWho(it);
    return React.createElement(
      "div",
      { key: x.key, style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "7px 0", borderTop: "1px solid " + llqaAlpha(c.border, "88") } },
      React.createElement("b", { style: { color: c.text, fontSize: 12, minWidth: 128 } }, llqaUnlogWhen(x)),
      React.createElement("span", { style: { color: c.textSec, fontSize: 12, flex: 1, minWidth: 120 } }, it.stu.name + (it.makeup ? " · make-up" : "")),
      llqaMarkBtns(it, x.date, "", "mb"),
      llqaMini("✍ Log", () => {
        llqaOpen("log", { studentId: it.stu.id, studentName: it.stu.name, date: x.date, slot: it.slot, day: it.rowDay, teacherId: w.teacherId, teacherName: w.teacherName, cell: it.cell, makeupId: it.makeup ? it.makeup.id : undefined, back: "unlogged" });
      }, { key: "lg" }),
    );
  };
  return llqaShell(
    "📝 Classes not logged",
    !ready ? "Loading the classes…" : all.length ? "Last " + LLQA_UNLOG_DAYS + " days and today · " + all.length + " class" + (all.length === 1 ? "" : "es") + (isT ? "" : " · " + groups.length + " teacher" + (groups.length === 1 ? "" : "s")) : "Last " + LLQA_UNLOG_DAYS + " days and today",
    React.createElement(
      "div",
      null,
      !isT && groups.length > 1
        ? React.createElement(
            LLQASelect,
            { value: tf, "aria-label": "Teacher", title: "Teacher", onChange: (e) => setTf(e.target.value), style: { padding: "7px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 11, marginBottom: 8 } },
            [React.createElement("option", { key: "all", value: "all" }, "All teachers (" + all.length + ")"), ...groups.map((g) => React.createElement("option", { key: g.name, value: g.name }, g.name + " (" + g.items.length + ")"))],
          )
        : null,
      ready && !all.length ? React.createElement("div", { style: { color: c.success, fontSize: 13, padding: "10px 0", fontWeight: 700 } }, "✓ Every class is logged.") : null,
      shown.map((g) =>
        React.createElement(
          "div",
          { key: "g" + g.name, style: { marginBottom: 10 } },
          isT
            ? null
            : React.createElement(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", padding: "6px 0" } },
                React.createElement("b", { style: { color: c.text, fontSize: 13 } }, g.name + " · " + g.items.length + " not logged"),
                llqaMini("WhatsApp reminder", () => llqaUnlogWa(g), { key: "wa", tone: "success" }),
              ),
          g.items.filter(() => rowsLeft-- > 0).map(row),
        ),
      ),
      all.length > MAX ? React.createElement("div", { style: { color: c.textSec, fontSize: 11, paddingTop: 6 } }, "The first " + MAX + " are shown; the rest come up as these are logged.") : null,
    ),
    [llqaMini("Close", onClose, { key: "x", big: true, solid: true, tone: "accent" })],
    { onClose, width: 640 },
  );
};
// Today's classes: the classes of earlier days still to log
const llqaUnlogBanner = (u) => {
  if (!u || u.role === "parent" || !llqaUnlogReady()) return null;
  const today = todayPK();
  const n = llqaUnlogged(u).filter((x) => x.date < today).length;
  if (!n) return null;
  return llqaCard(
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" } },
      React.createElement("div", { style: { color: c.text, fontSize: 13 } }, React.createElement("b", null, "📝 " + n + " class" + (n === 1 ? "" : "es") + " of earlier days not logged"), " · the last " + LLQA_UNLOG_DAYS + " days"),
      llqaMini(u.role === "teacher" ? "Log them" : "See the list", () => llqaOpen("unlogged", {}), { key: "ul", tone: "accent" }),
    ),
    { key: "unlog", border: llqaAlpha(c.danger, "88") },
  );
};

/* ============================================================
   v74: Class Shifting — every move recorded by itself, past days as they were booked, moves through the booking
   engine, handover (SPS) and feedback followed up; Subjects — office hours, ranked free slots, linked students
   ============================================================ */
// the reason (and SPS / feedback) chosen in Class Shifting for the next move of a student (kept 30 minutes)
const LLQAShiftNext = (() => {
  const m = new Map();
  return {
    set: (sid, v) => m.set(String(sid), { ...(v || {}), until: Date.now() + 30 * 60000 }),
    take: (sid) => {
      const k = String(sid);
      const v = m.get(k);
      if (!v) return null;
      m.delete(k);
      return v.until >= Date.now() ? v : null;
    },
    peek: (sid) => m.get(String(sid)) || null,
  };
})();
const llqaRowsSafe = (s) => {
  try {
    return s ? llqaRowsOf(s) : [];
  } catch (e) {
    return [];
  }
};
const llqaRowFam = (r) => String(r.teacher || "") + "|" + r.day + "|" + String(r.time || "");
const llqaRowPk = (r) => llqaRowFam(r) + "|" + String(r.pktSlot || "");
// a class of the student's list as a Timetable cell: { teacher, teacherId, day (the Timetable row), slot (Pakistan) }
const llqaRowCell = (s, r, teachers) => {
  let slot = r.pktSlot || "";
  if (!slot) {
    try {
      const B = LLQABooking;
      const tz = B.timezoneFor(s.country, s.state) || s.tz || "";
      const o = tz ? B.pktOptions(r.day, r.time, tz) : [];
      slot = o && o[0] ? o[0].slot : "";
    } catch (e) {}
  }
  if (!slot || !r.day) return null;
  const t = (teachers || []).find((x) => x && x.name === r.teacher);
  return { teacher: r.teacher || "", teacherId: t ? String(t.id) : "", day: r.day, slot };
};
// the classes before a change, kept until yesterday (a first booking keeps nothing; the day's first change counts)
const llqaClsHistOne = (p, n, until, teachers) => {
  const a = llqaRowsSafe(p);
  if (!a.length) return null;
  const k = (rows) => rows.map(llqaRowPk).sort().join(",");
  if (k(a) === k(llqaRowsSafe(n))) return null;
  return { until, cells: a.map((r) => llqaRowCell(p, r, teachers)).filter(Boolean) };
};
// a move: classes gone and classes added (only added or only removed is not a shift)
const llqaShiftFrom = (p, n) => {
  const a = llqaRowsSafe(p), b = llqaRowsSafe(n);
  if (!a.length || !b.length) return null;
  const ka = new Set(a.map(llqaRowFam)), kb = new Set(b.map(llqaRowFam));
  const gone = a.filter((r) => !kb.has(llqaRowFam(r))), added = b.filter((r) => !ka.has(llqaRowFam(r)));
  if (!gone.length || !added.length) return null;
  const tA = [...new Set(gone.map((r) => r.teacher || ""))], tB = [...new Set(added.map((r) => r.teacher || ""))];
  const teacherCh = tA.length !== tB.length || tA.some((x) => !tB.includes(x));
  const dt = (rows) => rows.map((r) => r.day + "|" + r.time).sort().join(",");
  const timeCh = dt(gone) !== dt(added);
  return { gone, added, tA, tB, reason: teacherCh && timeCh ? "Teacher and time change" : teacherCh ? "Teacher change" : "Time change" };
};
const llqaShiftSeen = new Map();
const llqaShiftRec = (n, d, next, u, k) => {
  const ctx = LLQAApp.ctx || {};
  const T = (nm) => (ctx.teachers || []).find((t) => t && t.name === nm) || {};
  const lbl = (rows) => rows.map((r) => r.day + "|" + r.time).join(", ");
  const nx = next || {};
  return {
    id: Date.now() * 10 + k,
    date: nx.date && nx.date <= todayPK() ? nx.date : todayPK(),
    studentId: n.id,
    student: n.name || "",
    lead: n.parent || "",
    fromT: d.tA.join(", "),
    fromTime: lbl(d.gone),
    fromLead: T(d.tA[0]).teamLead || "",
    toT: d.tB.join(", "),
    toTime: lbl(d.added),
    toLead: T(d.tB[0]).teamLead || "",
    reason: nx.reason || d.reason,
    notes: nx.notes || "",
    sps: nx.sps === "Conveyed" ? "yes" : nx.sps === "Not Required" ? "na" : "no",
    feedback: nx.feedback && nx.feedback !== "" ? nx.feedback : "Pending",
    auto: true,
    by: (u && u.name) || "",
    at: new Date().toISOString(),
    from: d.gone.map((r) => ({ day: r.day, time: r.time, teacher: r.teacher || "" })),
    to: d.added.map((r) => ({ day: r.day, time: r.time, teacher: r.teacher || "" })),
    bulkId: nx.bulkId || "",
  };
};
// Every change to the students list: leaves that are over (v73.1), the classes before a change (clsHist), and a shift
// record for every move of a student's classes — from any screen (Change classes, the Timetable, Class Shifting, …).
const llqaStuChanged = (prev, next) => {
  const out = llqaLvHistApply(prev, next);
  if (!Array.isArray(prev) || !Array.isArray(out) || prev === out) return out;
  const byId = new Map(prev.map((p) => [String(p && p.id), p]));
  const ctx = LLQAApp.ctx || {};
  const until = llqaAddDays(todayPK(), -1);
  const moves = [];
  let changed = false;
  const res = out.map((n) => {
    if (!n) return n;
    const p = byId.get(String(n.id));
    if (!p || p === n) return n;
    let x = n;
    try {
      const h = llqaClsHistOne(p, n, until, ctx.teachers);
      if (h) {
        const base = Array.isArray(n.clsHist) ? n.clsHist : Array.isArray(p.clsHist) ? p.clsHist : [];
        if (!base.some((e) => e && e.until === until)) {
          x = { ...n, clsHist: [...base.filter((e) => e && e.until >= llqaAddDays(until, -120)).slice(-11), h] };
          changed = true;
        }
      }
      const d = llqaShiftFrom(p, n);
      if (d) moves.push({ n: x, d });
    } catch (e) {}
    return x;
  });
  if (moves.length && ctx.user && typeof ctx.setShifts === "function") {
    const now = Date.now();
    llqaShiftSeen.forEach((t, k) => {
      if (now - t > 10000) llqaShiftSeen.delete(k);
    });
    const recs = [];
    moves.forEach(({ n, d }, k) => {
      const sig = n.id + "|" + d.gone.map(llqaRowFam).join(",") + ">" + d.added.map(llqaRowFam).join(",");
      if (llqaShiftSeen.has(sig)) return;
      llqaShiftSeen.set(sig, now);
      recs.push(llqaShiftRec(n, d, LLQAShiftNext.take(n.id), ctx.user, k));
    });
    if (recs.length) ctx.setShifts((pv) => {
      const list = pv || [];
      return [...recs.map((r, i) => ({ ...r, sno: list.length + recs.length - i })), ...list];
    });
  }
  return changed ? res : out;
};
// On a past day, a student whose classes changed since has the classes booked then: Map sid → { stu, cells }
const llqaClsHistFor = (date, students, teachers) => {
  const out = new Map();
  let byKey = null;
  (students || []).forEach((s) => {
    const hs = s && Array.isArray(s.clsHist) ? s.clsHist : null;
    if (!hs || !hs.length) return;
    const h = hs.find((x) => x && x.until >= date);
    if (!h) return;
    const B = LLQABooking;
    if (!byKey) {
      byKey = new Map();
      llqaBookedList(teachers).forEach((c) => byKey.set(c.teacherId + "|" + c.day + "|" + c.slot, c));
    }
    const tz = B.timezoneFor(s.country, s.state) || s.tz || "";
    out.set(String(s.id), {
      stu: s,
      cells: (h.cells || []).map((x) => {
        const t = x.teacherId ? null : (teachers || []).find((y) => y && y.name === x.teacher);
        const tid = x.teacherId || (t ? String(t.id) : "");
        const cur = byKey.get(tid + "|" + x.day + "|" + x.slot);
        const same = !!cur && !!cur.cell && (String(cur.cell.sid) === String(s.id) || B.sameStudent(cur.cell, s));
        return { teacherId: tid, teacher: x.teacher, day: x.day, slot: x.slot, cell: same ? cur.cell : { s: s.name, sid: s.id, country: s.country, state: s.state, c: s.course || "" }, tz: same ? cur.tz : tz };
      }),
    });
  });
  return out;
};

/* ---------- moves through the booking engine ---------- */
const llqaFieldsOf = (items, s, tz) => ({
  schedule: items.map((it) => ({ day: it.day, time: it.time, teacher: it.teacher, pktDay: it.pktDay, pktSlot: it.slot })),
  time: items.map((it) => it.day + "|" + it.time).join(", "),
  teacher: items.length ? items[0].teacher : s.teacher,
  hoursPerWeek: items.length ? String(items.length * 0.5) : "",
  tz: tz || s.tz || "",
});
// a student's classes with one teacher go to another at the family's same times → { teachers, fields } or { error }
const llqaMoveTeacher = (s, fromName, to, teachers) => {
  const B = LLQABooking;
  const rows = llqaRowsSafe(s);
  if (!rows.some((r) => r.teacher === fromName)) return { error: "no classes with " + fromName };
  const isQ = s.course !== "Subject";
  const want = rows.map((r) => ({ day: r.day, time: r.time, teacher: r.teacher === fromName ? to.name : r.teacher }));
  const pl = B.plan({ rows: want, country: s.country, state: s.state, teachers, isQuran: isQ, master: isQ ? to.name : "", own: s });
  if (pl.problems.length) return { error: pl.problems.join("; ") };
  const res = B.rebook(teachers, B.studentCells(teachers, s), pl.items, { ...s, sub: isQ ? "" : llqaSubjects(s) || "Subject" });
  if (!res.ok) return { error: res.problems.join("; ") };
  return { teachers: res.teachers, fields: llqaFieldsOf(pl.items, s, pl.tz) };
};
// Bulk: every student of a teacher (a teacher leaving) — each through the booking engine, recorded with the reason.
const llqaBulkMove = (fromName, toName, opt) => {
  const ctx = LLQAApp.ctx;
  const B = LLQABooking;
  const o = opt || {};
  const from = (ctx.teachers || []).find((t) => t && t.name === fromName);
  const to = (ctx.teachers || []).find((t) => t && t.name === toName);
  if (!from || !to) {
    alert("Pick both teachers.");
    return false;
  }
  const kids = new Map();
  const loose = [];
  B.eachBooked([from], (c) => {
    const s = llqaCellStudent(c.cell);
    if (s) kids.set(String(s.id), s);
    else loose.push(c);
  });
  if (!kids.size) {
    alert(fromName + " has no student classes to move." + (loose.length ? "\n\n" + loose.length + " booking(s) are names only (not a student in Students) — move them by hand." : ""));
    return false;
  }
  if (
    !confirm(
      "Move the classes of " + kids.size + " student" + (kids.size === 1 ? "" : "s") + " from " + fromName + " to " + toName + ", at the families' same times?\n\n" +
        "• Each student's classes are booked with " + toName + " by the Timetable rules (time zones, nothing double-booked).\n" +
        "• A class " + toName + " can't take is listed — that student stays with " + fromName + " until moved with Change classes.\n" +
        "• Every move is recorded in Class Shifting with the reason; " + toName + " gets each student's handover.",
    )
  )
    return false;
  const before = ctx.teachers || [];
  let teachers = before;
  const fields = new Map();
  const moved = [], failed = [];
  kids.forEach((s) => {
    const r = llqaMoveTeacher(s, fromName, to, teachers);
    if (r.error) failed.push({ s, why: r.error });
    else {
      teachers = r.teachers;
      fields.set(String(s.id), r.fields);
      moved.push(s);
    }
  });
  if (moved.length) {
    const bulkId = "bulk-" + Date.now();
    moved.forEach((s) => LLQAShiftNext.set(s.id, { reason: o.reason, sps: o.sps, feedback: o.feedback, date: o.date, bulkId }));
    const old = new Map(before.map((t) => [String(t.id), t]));
    const ch = new Map(teachers.filter((t) => t && old.get(String(t.id)) !== t).map((t) => [String(t.id), t]));
    ctx.setTeachers((prev) => (prev || []).map((t) => (t && ch.has(String(t.id)) ? ch.get(String(t.id)) : t)));
    ctx.setStudents((prev) => (prev || []).map((x) => (x && fields.has(String(x.id)) ? { ...x, ...fields.get(String(x.id)) } : x)));
    if (typeof ctx.upsertSalesMaster === "function") ctx.upsertSalesMaster(moved.map((s) => ({ ...s, ...fields.get(String(s.id)) })));
    if (typeof llqaWaitCheck === "function") llqaWaitCheck(before, teachers);
  }
  alert(
    (moved.length ? "✓ " + moved.length + " student" + (moved.length === 1 ? "" : "s") + " moved to " + toName + ": " + moved.map((s) => s.name).join(", ") + "." : "No student could be moved.") +
      (failed.length ? "\n\n⚠ Still with " + fromName + " (" + failed.length + "):\n" + failed.map((x) => "• " + x.s.name + " — " + x.why).join("\n") + "\n\nMove them with Change classes (another teacher or time)." : "") +
      (loose.length ? "\n\n" + loose.length + " booking(s) are names only — move them by hand." : ""),
  );
  return true;
};
// Class Shifting → New shift: the student and the reason, then Change classes (the booking engine) does the move
const LLQAShiftNewWin = ({ onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const all = (ctx.students || []).filter((s) => s && s.status !== "quit" && llqaRowsSafe(s).length).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const [q, setQ] = React.useState("");
  const [sid, setSid] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const shown = (q ? all.filter((x) => String(x.name).toLowerCase().includes(q.toLowerCase())) : all).slice(0, 80);
  const s = sid ? all.find((x) => String(x.id) === sid) : null;
  const box = { padding: "7px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 12, width: "100%", boxSizing: "border-box" };
  const lab = (t) => React.createElement("div", { style: { color: c.textSec, fontSize: 11, fontWeight: 600, margin: "10px 0 4px" } }, t);
  const go = () => {
    if (!s || !reason) return;
    LLQAShiftNext.set(s.id, { reason, notes });
    llqaOpen("reschedule", { studentId: s.id });
  };
  return llqaShell(
    "⇄ New shift",
    "Pick the student and the reason. The next window moves their classes (teacher, day or time) by the Timetable rules — nothing is double-booked — and the move is recorded here by itself.",
    React.createElement(
      "div",
      null,
      lab("Student"),
      React.createElement("input", { value: q, "aria-label": "Search students", placeholder: "Search by name…", onChange: (e) => setQ(e.target.value), style: { ...box, marginBottom: 6 } }),
      React.createElement(
        LLQASelect,
        { value: sid, "aria-label": "Student", title: "Student", onChange: (e) => setSid(e.target.value), style: box },
        [React.createElement("option", { key: "", value: "" }, shown.length ? "Choose a student (" + shown.length + ")" : "No student with classes"), ...shown.map((x) => React.createElement("option", { key: x.id, value: String(x.id) }, x.name + " — " + (x.teacher || "")))],
      ),
      s
        ? React.createElement(
            "div",
            { style: { background: c.bgDeep, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: c.textSec, marginTop: 8 } },
            React.createElement("b", { style: { color: c.text } }, "Now: "),
            llqaClasses(s).map((x) => x.day + " " + x.local + " (" + x.pkt + ") with " + x.teacher).join(" · ") || "—",
          )
        : null,
      lab("Reason"),
      React.createElement(
        LLQASelect,
        { value: reason, "aria-label": "Reason", title: "Reason", onChange: (e) => setReason(e.target.value), style: box },
        [React.createElement("option", { key: "", value: "" }, "Choose the reason"), ...SHIFT_REASONS.map((r) => React.createElement("option", { key: r, value: r }, r))],
      ),
      lab("Note (optional)"),
      React.createElement("input", { value: notes, "aria-label": "Note", placeholder: "e.g. the family asked for a female teacher", onChange: (e) => setNotes(e.target.value), style: box }),
    ),
    [llqaMini("Cancel", onClose, { key: "x", big: true }), llqaMini("Next: the new teacher / time →", go, { key: "go", big: true, solid: true, tone: "accent", disabled: !s || !reason })],
    { onClose, width: 560 },
  );
};

/* ---------- the handover (SPS) and the family's feedback ---------- */
const llqaTeacherNameOf = (u) => {
  const ctx = LLQAApp.ctx || {};
  const id = String(u.teacherId != null ? u.teacherId : u.id);
  const t = (ctx.teachers || []).find((x) => x && String(x.id) === id);
  return t ? t.name : "";
};
// moves of the last 30 days whose handover hasn't been passed on: a teacher's own (they are the new teacher); the office's all
const llqaHandovers = (u) => {
  const ctx = LLQAApp.ctx || {};
  if (!u || u.role === "parent") return [];
  const isT = u.role === "teacher";
  const me = isT ? llqaTeacherNameOf(u) : "";
  if (isT && !me) return [];
  if (!isT && !(llqaCanOpen("students") || llqaCanOpen("shifting"))) return [];
  const since = llqaAddDays(todayPK(), -30);
  return (ctx.shifts || [])
    .filter((r) => r && r.studentId != null && r.sps !== "yes" && r.sps !== "na" && String(r.date || "") >= since && (!isT || String(r.toT || "").split(", ").includes(me)))
    .map((r) => ({ r, stu: llqaFindStudent(r.studentId) }))
    .filter((x) => x.stu && x.stu.status !== "quit")
    .sort((a, b) => String(b.r.date).localeCompare(String(a.r.date)));
};
// what the new teacher needs: the classes, the page reached, the last lesson, attendance, notes
const llqaHandoverText = (r, s) => {
  const st = llqaStuStats(s);
  const L = [];
  L.push(s.name + (s.age ? " (" + s.age + ")" : "") + " — " + (s.course || "Quran") + (r.fromT ? ", until now with " + r.fromT : ""));
  const cls = llqaClasses(s).map((x) => x.day + " " + x.pkt).join(", ");
  if (cls) L.push("Classes (Pakistan time): " + cls);
  if (st.reach) L.push("Reached: " + llqaReachText(st.reach));
  const lf = st.lastFull;
  if (lf) L.push("Last lesson (" + llqaDateLabel(lf.date) + "): " + String(lf.lesson).trim() + (lf.homework ? " · Homework: " + lf.homework : "") + (lf.behavior ? " · Behaviour: " + lf.behavior : ""));
  L.push("Attendance (30 days): " + llqaPctText(st.last30.pct) + (st.last30.absent ? " · " + st.last30.absent + " absent" : ""));
  if (r.reason) L.push("Why the move: " + r.reason + (r.notes ? " — " + r.notes : ""));
  if (s.notes) L.push("Notes: " + String(s.notes).slice(0, 300));
  return L.join("\n");
};
const llqaSpsSet = (id, val, how) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  if (typeof ctx.setShifts === "function")
    ctx.setShifts((prev) => (prev || []).map((r) => (r && String(r.id) === String(id) ? { ...r, sps: val, spsAt: new Date().toISOString(), spsBy: u.name || "", spsHow: how || "" } : r)));
};
const llqaHandoverWa = (x) => {
  const ctx = LLQAApp.ctx || {};
  const nm = String(x.r.toT || "").split(", ")[0];
  const t = (ctx.teachers || []).find((y) => y && y.name === nm);
  const digits = t && t.phone ? llqaPhone(t.phone, "Pakistan") : "";
  if (!digits) return llqaToast({ kind: "info", ttl: 7000, text: "No phone number for " + nm + " — add it in Teachers." });
  try {
    window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent("Assalamu alaikum " + nm + ", " + x.stu.name + " is now in your classes.\n\n" + llqaHandoverText(x.r, x.stu) + "\n\nJazakAllah khair."), "_blank", "noopener");
  } catch (e) {}
  llqaSpsSet(x.r.id, "yes", "WhatsApp");
};
const llqaHandoverToast = (hs, u) => {
  const isT = u && u.role === "teacher";
  const n = hs.length;
  return {
    kind: "handover",
    key: "handover",
    text: isT
      ? "📋 " + (n === 1 ? "A student is" : n + " students are") + " new in your classes: " + hs.slice(0, 3).map((x) => x.stu.name + " (from " + (x.r.fromT || "—") + ")").join(", ") + (n > 3 ? " and " + (n - 3) + " more" : "") + ". Read the handover before the class."
      : "📋 " + n + " handover" + (n === 1 ? "" : "s") + " (SPS) not passed on to the new teacher yet — " + hs.slice(0, 3).map((x) => x.stu.name + " → " + x.r.toT).join(", ") + (n > 3 ? " …" : "") + ".",
    actions: [{ label: isT ? "Read" : "See the list", run: () => llqaOpen("handover", {}) }],
  };
};
const LLQAHandoverWin = ({ onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const isT = u.role === "teacher";
  const hs = llqaHandovers(u);
  return llqaShell(
    "📋 Handover (SPS)",
    isT ? "Students who moved to your classes: what they have learnt so far. “Got it” tells the office." : "Moves whose handover isn't passed on to the new teacher yet (the last 30 days). The new teacher also sees it when they sign in.",
    React.createElement(
      "div",
      null,
      !hs.length ? React.createElement("div", { style: { color: c.success, fontSize: 13, padding: "10px 0", fontWeight: 700 } }, "✓ Every handover is passed on.") : null,
      hs.slice(0, 40).map((x) =>
        React.createElement(
          "div",
          { key: x.r.id, style: { borderTop: "1px solid " + llqaAlpha(c.border, "88"), padding: "10px 0" } },
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            React.createElement("b", { style: { color: c.text, fontSize: 13 } }, x.stu.name + " · " + (x.r.fromT || "—") + " → " + (x.r.toT || "—") + " · " + llqaDateLabel(x.r.date)),
            React.createElement(
              "div",
              { style: { display: "flex", gap: 6 } },
              isT
                ? llqaMini("✓ Got it", () => llqaSpsSet(x.r.id, "yes", "read"), { key: "ok", tone: "success" })
                : [
                    llqaMini("WhatsApp to " + String(x.r.toT || "").split(", ")[0], () => llqaHandoverWa(x), { key: "wa", tone: "success" }),
                    llqaMini("✓ Passed on", () => llqaSpsSet(x.r.id, "yes", "office"), { key: "ok" }),
                    llqaMini("Not needed", () => llqaSpsSet(x.r.id, "na", "office"), { key: "na" }),
                  ],
            ),
          ),
          React.createElement("div", { style: { whiteSpace: "pre-wrap", color: c.textSec, fontSize: 12, marginTop: 6, lineHeight: 1.5 } }, llqaHandoverText(x.r, x.stu)),
        ),
      ),
    ),
    [llqaMini("Close", onClose, { key: "x", big: true, solid: true, tone: "accent" })],
    { onClose, width: 640 },
  );
};
// a week after a move, the family is asked how the classes with the new teacher are going (7 – 21 days after)
const llqaShiftFb = (s, today) => {
  const list = ((LLQAApp.ctx && LLQAApp.ctx.shifts) || []).filter((r) => r && String(r.studentId) === String(s.id) && (!r.feedback || r.feedback === "Pending") && r.toT);
  if (!list.length) return null;
  const r = list.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const d = llqaDays(r.date, today);
  return d >= 7 && d <= 21 ? r : null;
};

/* ---------- Subjects: office hours, ranked free slots, linked students ---------- */
const LLQA_SUBJ_DAYS = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
const llqaSubjSet = () => (LLQAApp.ctx && LLQAApp.ctx.appSettings) || {};
// the teacher's working days (Weekend shift: Saturday and Sunday; Settings decide Saturday / Sunday for the others)
const llqaSubjDays = (t) => {
  const s = llqaSubjSet();
  return Object.keys(LLQA_SUBJ_DAYS).filter((d) => {
    const wd = LLQA_SUBJ_DAYS[d];
    if (llqaShiftOf(t) === "Weekend") return wd === 0 || wd === 6;
    if (wd === 6) return s.workingSat !== false;
    if (wd === 0) return s.workingSun !== false;
    return true;
  });
};
const llqaSubjInHours = (t) => {
  const o = llqaOffice(t, llqaSubjSet());
  const len = llqaShiftLen(o);
  return (hm) => {
    const d = llqaAfterStart(o, hm);
    return d != null && d < len;
  };
};
// a week of the teacher: half-hours in office hours on working days, booked, free, used %
const llqaSubjCap = (t) => {
  const days = llqaSubjDays(t);
  const ok = llqaSubjInHours(t);
  const hours = SUBJ_SLOTS.filter(ok).length;
  const avail = days.length * hours;
  let booked = 0, inside = 0;
  Object.keys(LLQA_SUBJ_DAYS).forEach((d) => {
    for (let i = 4; i < 52; i++) {
      const cell = t[d] ? t[d][i] : null;
      if (cell && typeof cell === "object") {
        booked++;
        if (days.includes(d) && ok(SUBJ_SLOTS[i - 4])) inside++;
      }
    }
  });
  return { avail, booked, free: Math.max(0, avail - inside), util: avail ? Math.round((booked / avail) * 100) : 0, days, hours };
};
// the family's time for a Pakistan half-hour on that weekday (New York and London)
const llqaSubjFam = (day, hm) => {
  const B = LLQABooking;
  const wd = LLQA_SUBJ_DAYS[day];
  let d = todayPK();
  for (let k = 0; k < 7 && new Date(d + "T12:00:00Z").getUTCDay() !== wd; k++) d = llqaAddDays(d, 1);
  const ref = new Date(d + "T07:00:00Z");
  const pk = B.offsetAt("Asia/Karachi", ref);
  const m = llqaHm2m(hm);
  return [["America/New_York", "New York"], ["Europe/London", "London"]]
    .map(([tz, nm]) => {
      const v = m - (pk - B.offsetAt(tz, ref));
      const mm = ((v % 1440) + 1440) % 1440;
      return B.fmt12(llqaM2hm(mm)) + (v < 0 ? " (day before)" : v >= 1440 ? " (next day)" : "") + " " + nm;
    })
    .join(" · ");
};
// free half-hours in office hours on a working day, the least busy teachers first, then by the time of day
const llqaSubjFree = (teachers, subj, day) => {
  const B = LLQABooking;
  const today = todayPK();
  const out = [];
  (teachers || []).forEach((t) => {
    if (!(subj === "all" || (t.subjects || []).includes(subj))) return;
    const cap = llqaSubjCap(t);
    if (!cap.days.includes(day)) return;
    const o = llqaOffice(t, llqaSubjSet());
    const ok = llqaSubjInHours(t);
    let lv = null;
    try {
      lv = typeof llqaLeaveOn === "function" ? llqaLeaveOn(t, today) : null;
    } catch (e) {}
    for (let i = 4; i < 52; i++) {
      const hm = SUBJ_SLOTS[i - 4];
      if (!ok(hm) || (t[day] && t[day][i])) continue;
      out.push({ teacher: t.name, code: t.code, time: B.fmt12(hm) + " PKT", slotIdx: i, util: cap.util, ord: llqaAfterStart(o, hm), fam: llqaSubjFam(day, hm), note: cap.util + "% used" + (lv ? " · on leave now" : "") });
    }
  });
  return out.sort((a, b) => a.util - b.util || String(a.teacher).localeCompare(String(b.teacher)) || a.ord - b.ord).slice(0, 60);
};
// Subjects → book a slot for a student of Students (course Subject): booked by the Timetable rules, so the class is
// the student's (attendance, logs, fees, the parent portal)
const llqaSubjBook = (f) => {
  const ctx = LLQAApp.ctx;
  const s = llqaFindStudent(f.sid);
  if (!s) return "That student is no longer in the list.";
  const at = (ctx.teachers || []).find((t) => t && String(t.id) === String(f.teacherId));
  if (!at) return "This teacher isn't saved in the CRM.";
  const rowDay = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }[f.day];
  const slot = SUBJ_SLOTS[f.slotIdx - 4];
  const p = llqaPlanClassAt(ctx.teachers || [], s, llqaRowsSafe(s), at, rowDay, slot);
  if (p.error) return p.error;
  const fields = llqaClassFields(p.rows);
  llqaSaveClasses(s, fields, p.teachers.filter((t) => String(t.id) === String(at.id)),
    "✓ " + s.name + " now has " + rowDay + " " + LLQABooking.timeLabel(p.it.time) + " (" + (llqaSubjects(s) || "Subject") + ") with " + at.name + " — " + llqaWeekText(fields.schedule.length) + ". Tell the family?");
  return "";
};
const llqaSubjLink = (f, setF) => {
  const list = ((LLQAApp.ctx && LLQAApp.ctx.students) || []).filter((s) => s && s.course === "Subject" && s.status !== "quit").sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return React.createElement(
    "div",
    { style: { marginBottom: 10 } },
    React.createElement("div", { style: { color: c.textSec, fontSize: 11, fontWeight: 600, marginBottom: 4 } }, "Student from Students (recommended)"),
    React.createElement(
      LLQASelect,
      {
        value: f.sid ? String(f.sid) : "",
        "aria-label": "Student from Students",
        title: "Student from Students",
        onChange: (e) => {
          const s = list.find((x) => String(x.id) === e.target.value);
          setF(s ? { ...f, sid: s.id, s: s.name, a: s.age || "", p: s.parent || "", st: s.state || "", country: s.country || "USA", gender: s.gender || "Any", phone: s.phone || "", family: s.family || "", sub: f.sub || llqaSubjects(s) || "" } : { ...f, sid: "" });
        },
        style: { padding: "7px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 12, width: "100%" },
      },
      [React.createElement("option", { key: "", value: "" }, "Name only — not linked (no attendance, logs or fees)"), ...list.map((s) => React.createElement("option", { key: s.id, value: String(s.id) }, s.name + (llqaSubjects(s) ? " — " + llqaSubjects(s) : "")))],
    ),
    f.sid ? React.createElement("div", { style: { color: c.success, fontSize: 11, marginTop: 4 } }, "✓ Booked as " + f.s + "'s class: attendance, class logs, fees and the parent portal follow.") : null,
  );
};

/* ---------- v75: Payroll that runs itself ---------- */
// The first month the CRM runs payroll by itself (the months before were paid outside it: no reminders for them)
const LLQA_PAY_FROM = "2026-11";
const LLQA_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const llqaYmName = (ym) => (LLQA_MONTHS[Number(String(ym).slice(5, 7)) - 1] || "") + " " + String(ym).slice(0, 4);
const llqaDayMon = (d) => Number(String(d).slice(8, 10)) + " " + (LLQA_MONTHS[Number(String(d).slice(5, 7)) - 1] || "").slice(0, 3);
const llqaYmDays = (ym) => new Date(Date.UTC(Number(String(ym).slice(0, 4)), Number(String(ym).slice(5, 7)), 0)).getUTCDate();
const llqaIsDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));
const llqaDayGap = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const llqaRs = (n) => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-US");
const llqaPayActor = () => {
  const u = (LLQAApp.ctx && LLQAApp.ctx.user) || {};
  return u.name || u.username || (u.role === "superadmin" ? "Super Admin" : u.role) || "Admin";
};
// the salary day of the month (Payroll → Pay day; the 5th when not set) and the day month ym's salaries are due
const llqaPayDayOf = (set) => {
  const n = Math.round(Number((set || {}).payDay));
  return n >= 1 && n <= 28 ? n : 5;
};
const llqaPayDue = (ym, set) => llqaMonthAdd(ym, 1) + "-" + String(llqaPayDayOf(set)).padStart(2, "0");
const llqaTeacherGone = (t) => !!t && (t.status === "resigned" || t.status === "terminated");

// Every salary change is kept on the teacher (salHist: from, amount, prev, reason, by, at). A day's salary is the
// last change in force that day; before the first change, the salary it replaced.
const llqaSalHist = (t) =>
  (Array.isArray(t && t.salHist) ? t.salHist : [])
    .filter((h) => h && llqaIsDay(h.from) && Number(h.amount) > 0)
    .slice()
    .sort((a, b) => (a.from !== b.from ? (a.from < b.from ? -1 : 1) : String(a.at || "") < String(b.at || "") ? -1 : 1));
const llqaSalaryOn = (t, day) => {
  const h = llqaSalHist(t);
  if (!h.length) return Number(t && t.salary) || 0;
  let s = Number(h[0].prev) > 0 ? Number(h[0].prev) : Number(h[0].amount);
  for (const x of h) if (x.from <= day) s = Number(x.amount);
  return s;
};
// the days of month ym a teacher was with the academy: from the join date to the leaving date (kept by itself when
// the status becomes resigned or terminated). Left with no date kept: not in the months the CRM pays (set the date
// in Teachers if they worked part of one).
const llqaPaySpan = (t, ym, today) => {
  if (!t) return null;
  const D = llqaYmDays(ym), first = ym + "-01", last = ym + "-" + String(D).padStart(2, "0");
  const from = llqaIsDay(t.joinDate) && t.joinDate > first ? t.joinDate : first;
  let to = last;
  if (llqaTeacherGone(t)) {
    if (llqaIsDay(t.leftOn)) {
      if (t.leftOn < to) to = t.leftOn;
    } else if (ym >= LLQA_PAY_FROM || ym >= String(today || todayPK()).slice(0, 7)) return null; // left before the CRM kept the date
  }
  if (from > to) return null;
  const days = Number(to.slice(8, 10)) - Number(from.slice(8, 10)) + 1;
  return { from, to, days, D, full: days === D };
};
// the salary for those days: each day at the salary in force that day (a full month at one salary is the salary)
const llqaPayBase = (t, span) => {
  if (!span) return 0;
  if (!llqaSalHist(t).some((x) => x.from > span.from && x.from <= span.to)) return Math.round((llqaSalaryOn(t, span.from) * span.days) / span.D);
  let sum = 0;
  for (let d = Number(span.from.slice(8, 10)); d <= Number(span.to.slice(8, 10)); d++) sum += llqaSalaryOn(t, span.from.slice(0, 8) + String(d).padStart(2, "0"));
  return Math.round(sum / span.D);
};
// how many students each teacher has booked in the Timetable now (each student once)
const llqaPayCountMemo = new WeakMap();
const llqaPayCounts = (teachers) => {
  const list = teachers || [];
  let m = llqaPayCountMemo.get(list);
  if (!m) {
    const sets = new Map();
    try {
      LLQABooking.eachBooked(list, (c) => {
        const k = String(c.teacherId);
        if (!sets.has(k)) sets.set(k, new Set());
        const v = c.cell || {};
        sets.get(k).add(v.sid != null && v.sid !== "" ? "i" + v.sid : "n" + String(v.s || "").trim().toLowerCase() + "|" + String(v.l || "").trim().toLowerCase());
      });
    } catch (e) {}
    m = new Map();
    sets.forEach((s, k) => m.set(k, s.size));
    llqaPayCountMemo.set(list, m);
  }
  return m;
};
// the bonuses (the amounts as before): tenure on the month's last day with the academy, HR's performance rating,
// the students booked; for part of a month, that part of each
const llqaPayBonus = (t, ym, span, count) => {
  const end = span ? span.to : ym + "-" + String(llqaYmDays(ym)).padStart(2, "0");
  const yrs = llqaIsDay(t.joinDate) ? Math.floor((Date.parse(end) - Date.parse(t.joinDate)) / (365 * 864e5)) : 0;
  const r = Number(t.perfRating) > 0 ? Number(t.perfRating) : Number(t.rating) || 0;
  const n = Number(count) || 0;
  const f = span ? span.days / span.D : 1;
  const tenure = Math.round((yrs >= 3 ? 3000 : yrs >= 2 ? 2000 : yrs >= 1 ? 1000 : 0) * f);
  const performance = Math.round((r >= 4.5 ? 3000 : r >= 4.2 ? 2000 : r >= 4.0 ? 1000 : 0) * f);
  const students = Math.round((n >= 12 ? 2000 : n >= 8 ? 1000 : 0) * f);
  return { tenure, performance, students, total: tenure + performance + students, count: n, rating: r, years: Math.max(0, yrs) };
};
const llqaPayBonusNow = (t, ym) => llqaPayBonus(t, ym, llqaPaySpan(t, ym, todayPK()), llqaPayCounts((LLQAApp.ctx && LLQAApp.ctx.teachers) || []).get(String(t.id)));
// the month's fines: Quality Control (not waived or resolved; by teacher id, else by name) + attendance (v72)
const llqaPayFines = (t, ym, qc, att) => {
  const qcFine = (qc || [])
    .filter((v) => v && String(v.date || "").startsWith(ym) && v.status !== "Waived" && v.status !== "Resolved" && (v.teacherId != null && v.teacherId !== "" ? String(v.teacherId) === String(t.id) : v.teacher === t.name))
    .reduce((s, v) => s + (Number(v.fine) || 0), 0);
  const days = ((att || {})[t.id] || []).filter((h) => h && String(h.date || "").startsWith(ym) && Number(h.fine) > 0);
  const attFine = days.reduce((s, h) => s + (Number(h.fine) || 0), 0);
  return { qcFine, attFine, attDays: days.length, fine: qcFine + attFine };
};

// Advances and loans (payrollHistory._loans): taken from the pay month by month, in installments, from the first
// month; a month already approved or paid keeps what it took; the last month a teacher works takes what is left.
const llqaLoans = (hist) => (Array.isArray(hist && hist._loans) ? hist._loans.filter((L) => L && L.id && Number(L.amount) > 0 && /^\d{4}-\d{2}$/.test(String(L.start || ""))) : []);
const llqaLoanPer = (L) => Math.ceil(Number(L.amount) / Math.max(1, Math.round(Number(L.installments) || 1)));
const llqaLoanPlan = (hist, t, upto, today) => {
  const out = {};
  const recs = (hist && hist[t.id]) || [];
  llqaLoans(hist)
    .filter((L) => String(L.teacherId) === String(t.id))
    .forEach((L) => {
      let left = Number(L.amount);
      const per = llqaLoanPer(L);
      for (let ym = L.start, i = 0; ym <= upto && left > 0 && i < 240; ym = llqaMonthAdd(ym, 1), i++) {
        const r = recs.find((x) => x && x.month === ym);
        let take;
        if (r && (r.status === "approved" || r.status === "paid")) take = Number((r.inst || {})[L.id]) || 0;
        else {
          const span = llqaPaySpan(t, ym, today);
          if (!span) {
            if (llqaTeacherGone(t) && ym > String(t.leftOn || "")) break;
            continue;
          }
          take = llqaTeacherGone(t) && llqaIsDay(t.leftOn) && t.leftOn.slice(0, 7) === ym ? left : Math.min(per, left);
        }
        if (take > 0) {
          (out[ym] = out[ym] || {})[L.id] = take;
          left -= take;
        }
      }
    });
  return out;
};
const llqaLoanState = (hist, L, teachers, today) => {
  const t = (teachers || []).find((x) => x && String(x.id) === String(L.teacherId)) || { id: L.teacherId, name: L.teacher || "—" };
  const recs = (hist && hist[L.teacherId]) || [];
  let paid = 0, held = 0;
  recs.forEach((r) => {
    const v = Number(((r && r.inst) || {})[L.id]) || 0;
    if (r && r.status === "paid") paid += v;
    else if (r && r.status === "approved") held += v;
  });
  const plan = llqaLoanPlan(hist, t, llqaMonthAdd(String(today).slice(0, 7), 36), today);
  const next = Object.keys(plan).filter((ym) => plan[ym][L.id] && !recs.some((r) => r && r.month === ym && (r.status === "approved" || r.status === "paid"))).sort()[0] || "";
  return { t, paid, held, left: Math.max(0, Number(L.amount) - paid), next, nextAmt: next ? plan[next][L.id] : 0, done: paid >= Number(L.amount) };
};

// A teacher's pay for month ym: worked out from the rules while the month is pending; an approved or paid month keeps
// its numbers (an approved one says when the fines have changed since). null: not with the academy that month.
const llqaPayRec = (t, ym, o) => {
  const today = o.today || todayPK();
  const saved = ((o.hist || {})[t.id] || []).find((r) => r && r.month === ym);
  const fines = llqaPayFines(t, ym, o.qc, o.att);
  if (saved && saved.status && saved.status !== "pending") {
    if (saved.status !== "approved") return saved;
    const out = Number(saved.fine || 0) !== fines.fine ? { ...saved, fineNow: fines.fine } : saved;
    const xn = llqaExtraFor(t, ym, o); // v76: extra classes changed since approval
    return xn && Number(saved.extraPay || 0) !== xn.total ? { ...out, extraNow: xn.total } : out;
  }
  const span = llqaPaySpan(t, ym, today);
  if (!span && !saved) return null;
  const legacy = saved && saved.calc !== 75;
  const inst = llqaLoanPlan(o.hist, t, ym, today)[ym] || {};
  const advance = Object.keys(inst).reduce((s, k) => s + inst[k], 0) + (legacy ? Number(saved.advance) || 0 : 0);
  const baseSalary = legacy ? Number(saved.baseSalary) || 0 : llqaPayBase(t, span);
  const b = legacy ? saved.bonusBreakdown || { total: Number(saved.bonuses) || 0 } : saved && saved.bonusBreakdown ? saved.bonusBreakdown : llqaPayBonus(t, ym, span, (o.counts || new Map()).get(String(t.id)));
  const bonuses = Number(b.total) || 0;
  const tax = saved ? Number(saved.tax) || 0 : 0;
  const xp = llqaExtraFor(t, ym, o); // v76: the extra classes taken
  const gross = baseSalary + bonuses + (xp ? xp.total : 0);
  const deductions = fines.fine + advance + tax;
  return {
    ...(saved || {}),
    id: t.id + "_" + ym,
    month: ym,
    calc: legacy ? saved.calc : 75,
    baseSalary,
    salary: span ? llqaSalaryOn(t, span.to) : Number(t.salary) || 0,
    days: span ? span.days : 0,
    monthDays: llqaYmDays(ym),
    from: span ? span.from : "",
    to: span ? span.to : "",
    bonusBreakdown: b,
    bonuses,
    extraClasses: xp,
    extraPay: xp ? xp.total : 0,
    gross,
    qcFine: fines.qcFine,
    attFine: fines.attFine,
    attDays: fines.attDays,
    fine: fines.fine,
    inst,
    advance,
    tax,
    deductions,
    net: gross - deductions,
    status: "pending",
  };
};
// where month ym stands, and what needs a look before it is paid (rows: [{ t, r }])
const llqaPayStateOf = (ym, rows, set) => {
  const pick = (f) => rows.filter(f);
  return {
    ym,
    rows,
    toApprove: pick((x) => x.r.status === "pending"),
    toPay: pick((x) => x.r.status === "approved"),
    paid: pick((x) => x.r.status === "paid"),
    noSalary: pick((x) => x.r.status === "pending" && !(Number(x.r.baseSalary) > 0)),
    noBank: pick((x) => x.r.status !== "paid" && !String(x.t.bank || "").trim() && !String(x.t.accountNo || "").trim()),
    negative: pick((x) => x.r.status !== "paid" && Number(x.r.net) < 0),
    changed: pick((x) => x.r.status === "approved" && x.r.fineNow != null),
    xchanged: pick((x) => x.r.status === "approved" && x.r.extraNow != null), // v76
    due: llqaPayDue(ym, set),
  };
};
const llqaPayMonthState = (ym, ctx) => {
  const x = ctx || LLQAApp.ctx || {};
  const o = { hist: x.payrollHistory || {}, qc: x.qcViolations, att: x.attendanceHistory, counts: llqaPayCounts(x.teachers), today: todayPK(), xi: ym >= LLQA_PAY_FROM ? llqaExtraIndex(ym, x) : null, set: x.appSettings }; // v76: extra classes
  const rows = (x.teachers || []).map((t) => ({ t, r: t ? llqaPayRec(t, ym, o) : null })).filter((y) => y.r);
  return llqaPayStateOf(ym, rows, x.appSettings);
};
// the month Payroll opens on: one asked for (a reminder), else last month while its salaries aren't all paid
const LLQAPay = { want: "" };
const llqaPayStartYm = () => {
  const w = LLQAPay.want;
  LLQAPay.want = "";
  if (/^\d{4}-\d{2}$/.test(w)) return w;
  const cur = todayPK().slice(0, 7), prev = llqaPrevYm(cur);
  try {
    if (prev >= LLQA_PAY_FROM) {
      const s = llqaPayMonthState(prev);
      if (s.toApprove.length || s.toPay.length) return prev;
    }
  } catch (e) {}
  return cur;
};
const llqaPayOpen = (ym) => {
  LLQAPay.want = ym;
  const ctx = LLQAApp.ctx || {};
  if (typeof ctx.setPage === "function") ctx.setPage("payroll");
};

// Teachers: a salary changed anywhere is kept (Teachers form: from the 1st of this month, after any change already
// in force); the leaving date is kept when the status becomes resigned or terminated, and cleared when they are back
const llqaTeachersChanged = (prev, next) => {
  if (!Array.isArray(prev) || !Array.isArray(next) || prev === next) return next;
  const old = new Map(prev.filter(Boolean).map((t) => [String(t.id), t]));
  const today = todayPK();
  let changed = false;
  const out = next.map((t) => {
    const p = t && old.get(String(t.id));
    if (!p) {
      // v76: the day a teacher came into the CRM (a teacher brought in later, with an old join date, isn't marked absent
      // for the days before)
      if (t && t.id != null && !llqaIsDay(t.addedAt)) {
        changed = true;
        return { ...t, addedAt: today };
      }
      return t;
    }
    let x = t;
    const ph = Array.isArray(p.salHist) ? p.salHist : [], nh = Array.isArray(x.salHist) ? x.salHist : [];
    const lost = ph.filter((h) => h && !nh.some((k) => k && k.at === h.at && k.from === h.from));
    if (lost.length) x = { ...x, salHist: [...nh, ...lost] };
    const ns = Number(x.salary) || 0, os = Number(p.salary) || 0;
    if (ns !== os && os > 0 && ns > 0 && !(llqaSalHist(x).length && llqaSalaryOn(x, today) === ns)) {
      const last = llqaSalHist(x).filter((h) => h.from <= today).map((h) => h.from).pop() || "";
      const from = last > today.slice(0, 7) + "-01" ? last : today.slice(0, 7) + "-01";
      x = { ...x, salHist: [...(Array.isArray(x.salHist) ? x.salHist : []), { from, amount: ns, prev: os, reason: "Changed in Teachers", by: llqaPayActor(), at: new Date().toISOString() }] };
    }
    if (llqaTeacherGone(x) && !llqaTeacherGone(p) && !llqaIsDay(x.leftOn)) x = { ...x, leftOn: today };
    else if (!llqaTeacherGone(x) && x.leftOn) x = { ...x, leftOn: "" };
    if (x !== t) changed = true;
    return x;
  });
  return changed ? out : next;
};
// Payroll → Revise salary: from a date (now or later), with the reason; the salary on the record follows on that day
const llqaSalaryRevise = (t, f) => {
  const amount = Math.round(Number(f.newSalary));
  if (!(amount > 0)) return "Enter the new salary.";
  if (!llqaIsDay(f.effective)) return "Choose the day it starts from.";
  if (!String(f.reason || "").trim()) return "Write the reason.";
  const ctx = LLQAApp.ctx || {};
  if (typeof ctx.setTeachers !== "function") return "Not ready yet — try again in a moment.";
  const today = todayPK();
  const entry = { from: f.effective, amount, prev: llqaSalaryOn(t, llqaAddDays(f.effective, -1)), reason: String(f.reason).trim(), by: llqaPayActor(), at: new Date().toISOString() };
  if (amount === llqaSalaryOn(t, f.effective)) return "That is already the salary from that day.";
  ctx.setTeachers((prev) =>
    (prev || []).map((x) => {
      if (!x || String(x.id) !== String(t.id)) return x;
      const y = { ...x, salHist: [...(Array.isArray(x.salHist) ? x.salHist : []), entry] };
      const now = llqaSalaryOn(y, today);
      return now !== (Number(x.salary) || 0) ? { ...y, salary: now } : y;
    }),
  );
  return "";
};
// the clock: a salary change whose day has come is put on the teacher (Teachers, the Dashboard and new months use it)
const llqaSalaryDueRun = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || !llqaReadyFor(["teachers"]) || typeof ctx.setTeachers !== "function") return null;
  const today = todayPK();
  const due = (ctx.teachers || []).filter((t) => t && llqaSalHist(t).length && llqaSalaryOn(t, today) !== (Number(t.salary) || 0));
  if (!due.length) return null;
  const ids = new Set(due.map((t) => String(t.id)));
  ctx.setTeachers((prev) => (prev || []).map((x) => (x && ids.has(String(x.id)) && llqaSalaryOn(x, today) !== (Number(x.salary) || 0) ? { ...x, salary: llqaSalaryOn(x, today) } : x)));
  return due;
};
// the clock, from the 1st: last month's pay is written for each teacher with a salary (pending) — the bonuses as
// they stood are kept; the fines and advance installments keep following until the month is approved
const llqaPayCloseRun = () => {
  const ctx = LLQAApp.ctx;
  if (!ctx.user || typeof ctx.setPayrollHistory !== "function") return null;
  const ym = llqaPrevYm(todayPK().slice(0, 7));
  if (ym < LLQA_PAY_FROM || !llqaReadyFor(["teachers", "qcViolations", "doc:data/payrollHistory"])) return null;
  const ps = (LLQAAtt.paths || []).filter((p) => p.slice(11, 18) === ym);
  if (!ps.length || !llqaAttReady(ps)) return null;
  const hist = ctx.payrollHistory || {};
  const add = llqaPayMonthState(ym, ctx).rows.filter((x) => !((hist[x.t.id] || []).some((r) => r && r.month === ym)) && Number(x.r.baseSalary) > 0);
  if (!add.length) return null;
  const at = new Date().toISOString();
  ctx.setPayrollHistory((prev) => {
    const next = { ...(prev || {}) };
    add.forEach((x) => {
      const arr = Array.isArray(next[x.t.id]) ? next[x.t.id] : [];
      if (arr.some((r) => r && r.month === ym)) return;
      const { fineNow, extraNow, ...rec } = x.r;
      next[x.t.id] = [...arr, { ...rec, closedAt: at, closedBy: "auto" }];
    });
    return next;
  });
  return add;
};
// the office's reminder (once a day): the months from LLQA_PAY_FROM with salaries to approve or pay
const llqaPayChase = (today) => {
  const out = [];
  for (let ym = llqaPrevYm(String(today || todayPK()).slice(0, 7)), i = 0; ym >= LLQA_PAY_FROM && i < 3; ym = llqaPrevYm(ym), i++) {
    const s = llqaPayMonthState(ym);
    if (s.toApprove.length || s.toPay.length) out.push(s);
  }
  return out.reverse();
};
const llqaPayWhen = (due, today) => {
  const g = llqaDayGap(today, due);
  return g > 1 ? "in " + g + " days" : g === 1 ? "tomorrow" : g === 0 ? "today" : -g + " day" + (g === -1 ? "" : "s") + " late";
};
const llqaPayToast = (list, today) => {
  const s = list[0];
  const extra = [s.noSalary.length && s.noSalary.length + " without a salary", s.noBank.length && s.noBank.length + " without a bank account", s.negative.length && s.negative.length + " with pay below zero", s.changed.length && s.changed.length + " with fines changed since approval"].filter(Boolean);
  return {
    kind: "payroll",
    key: "payroll",
    text: "💰 " + llqaYmName(s.ym) + " salaries — " + [s.toApprove.length && s.toApprove.length + " to approve", s.toPay.length && s.toPay.length + " to pay"].filter(Boolean).join(", ") + ". Pay day " + llqaDayMon(s.due) + " (" + llqaPayWhen(s.due, today) + ")." + (extra.length ? " Check: " + extra.join(", ") + "." : "") + (list.length > 1 ? " Also " + list.slice(1).map((x) => llqaYmName(x.ym)).join(", ") + "." : ""),
    actions: [{ label: "Open Payroll", run: () => llqaPayOpen(s.ym) }],
  };
};
// a teacher's own months (approved or paid), newest first; a salary paid in the last 10 days is news
const llqaTeacherIdOf = (u) => String(u && (u.teacherId != null ? u.teacherId : u.id));
const llqaMyPay = (u) => {
  const ctx = LLQAApp.ctx || {};
  return (((ctx.payrollHistory || {})[llqaTeacherIdOf(u)]) || []).filter((r) => r && (r.status === "paid" || r.status === "approved")).sort((a, b) => (a.month < b.month ? 1 : -1));
};
const llqaMyPayFresh = (u, today) => llqaMyPay(u).filter((r) => r.status === "paid" && llqaIsDay(r.paidDate) && llqaDayGap(r.paidDate, today) <= 10 && llqaDayGap(r.paidDate, today) >= 0);
const llqaMyPayToast = (fresh) => ({
  kind: "mypay",
  key: "mypay",
  text: "💰 Your " + fresh.map((r) => llqaYmName(r.month) + " salary is paid: " + llqaRs(r.net) + " (" + llqaDayMon(r.paidDate) + ")").join("; ") + ".",
  actions: [{ label: "See the payslip", run: () => llqaOpen("mypay", { month: fresh[0].month }) }],
});
const LLQAMyPayWin = ({ data, onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  const [open, setOpen] = React.useState((data && data.month) || "");
  const mine = llqaMyPay(u);
  const t = (ctx.teachers || []).find((x) => x && String(x.id) === llqaTeacherIdOf(u)) || { id: llqaTeacherIdOf(u), name: u.name || "Teacher", code: "" };
  const rec = open ? mine.find((r) => r.month === open) : null;
  if (rec) return React.createElement(PayslipModal, { t: { ...t, pay: rec }, onClose: () => setOpen(""), selectedMonth: rec.month, appSettings: ctx.appSettings || {} });
  return llqaShell(
    "💰 My pay",
    "Your salary by month: what was added and taken off. A month shows here once the office has approved it.",
    React.createElement(
      "div",
      null,
      !mine.length ? React.createElement("div", { style: { color: c.textSec, fontSize: 13, padding: "10px 0" } }, "No month approved yet.") : null,
      mine.slice(0, 24).map((r) =>
        React.createElement(
          "div",
          { key: r.month, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, borderTop: "1px solid " + llqaAlpha(c.border, "88"), padding: "9px 0", flexWrap: "wrap" } },
          React.createElement("b", { style: { color: c.text, fontSize: 13 } }, llqaYmName(r.month) + " · " + llqaRs(r.net)),
          React.createElement("span", { style: { color: r.status === "paid" ? c.success : c.warn, fontSize: 12, fontWeight: 700 } }, r.status === "paid" ? "Paid " + (llqaIsDay(r.paidDate) ? llqaDayMon(r.paidDate) : "") : "Approved — to be paid"),
          llqaMini("Payslip", () => setOpen(r.month), { key: "p" }),
        ),
      ),
    ),
    [llqaMini("Close", onClose, { key: "x", big: true, solid: true, tone: "accent" })],
    { onClose, width: 560 },
  );
};

// Payroll → this month: where it stands, what to check, the pay day
const LLQAPayChecks = ({ ym, recs, appSettings }) => {
  const ctx = LLQAApp.ctx || {};
  const rows = (recs || []).filter((t) => t && t.pay).map((t) => ({ t, r: t.pay }));
  const s = llqaPayStateOf(ym, rows, appSettings);
  const noDate = (recs || []).filter((t) => t && !t.pay && llqaTeacherGone(t) && !llqaIsDay(t.leftOn));
  const noRate = rows.filter((x) => x.r.status !== "paid" && x.r.extraClasses && ((x.r.extraClasses.n && !x.r.extraClasses.rate) || (x.r.extraClasses.ns && !x.r.extraClasses.rateS))); // v76
  const wkx = rows.filter((x) => x.r.status !== "paid" && llqaShiftOf(x.t) === "Weekend" && x.r.extraClasses && x.r.extraClasses.n + x.r.extraClasses.ns > 0); // v76: their classes are all at the weekend
  const today = todayPK();
  const names = (l) => l.slice(0, 3).map((x) => x.t.name).join(", ") + (l.length > 3 ? " and " + (l.length - 3) + " more" : "");
  const chip = (key, txt, col) => React.createElement("span", { key, style: { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: llqaAlpha(col, "22"), color: col } }, txt);
  const issues = [
    s.noSalary.length ? chip("ns", "No salary: " + names(s.noSalary), c.danger) : null,
    s.negative.length ? chip("ng", "Pay below zero: " + names(s.negative), c.danger) : null,
    s.changed.length ? chip("ch", "Fines changed since approval: " + names(s.changed), c.warn) : null,
    s.noBank.length ? chip("nb", "No bank account: " + names(s.noBank), c.warn) : null,
    noDate.length ? chip("nd", "Left, no leaving date (set it in Teachers if they worked this month): " + noDate.slice(0, 3).map((t) => t.name).join(", ") + (noDate.length > 3 ? " and " + (noDate.length - 3) + " more" : ""), c.warn) : null,
    s.xchanged.length ? chip("xc", "Extra classes changed since approval: " + names(s.xchanged), c.warn) : null, // v76
    noRate.length ? chip("xr", "Extra classes with no rate (Settings → HR & Attendance): " + names(noRate), c.warn) : null,
    wkx.length ? chip("xw", "Weekend shift — their Saturday and Sunday classes count as extra unless the boxes are marked Regular: " + names(wkx), c.warn) : null,
  ].filter(Boolean);
  const canSet = (ctx.user || {}).role === "superadmin" && typeof ctx.setAppSettings === "function";
  const g = llqaDayGap(today, s.due);
  return React.createElement(
    "div",
    { "data-llqa": "pay-checks", style: { background: c.bgCard, border: "1px solid " + llqaAlpha(c.border, "aa"), borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 } },
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" } },
      React.createElement(
        "div",
        { style: { fontSize: 13, color: c.text, fontWeight: 700 } },
        llqaYmName(ym) + " · pay day " + llqaDayMon(s.due),
        React.createElement("span", { style: { fontWeight: 600, color: s.toApprove.length + s.toPay.length && g < 0 ? c.danger : c.textSec } }, " (" + llqaPayWhen(s.due, today) + ")"),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
        chip("a", s.toApprove.length + " to approve", s.toApprove.length ? c.warn : c.textSec),
        chip("p", s.toPay.length + " to pay", s.toPay.length ? c.accent : c.textSec),
        chip("d", s.paid.length + " paid", c.success),
        canSet ? React.createElement("span", { key: "pd", style: { fontSize: 11, color: c.textSec, marginLeft: 4 } }, "Pay day ") : null,
        canSet
          ? React.createElement(
              LLQASelect,
              { key: "pds", value: String(llqaPayDayOf(appSettings)), title: "Pay day", onChange: (e) => ctx.setAppSettings((p) => ({ ...(p || {}), payDay: Number(e.target.value) })), style: { padding: "3px 6px", fontSize: 11 } },
              Array.from({ length: 28 }, (_, i) => React.createElement("option", { key: i + 1, value: String(i + 1) }, String(i + 1))),
            )
          : null,
      ),
    ),
    issues.length
      ? React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, issues)
      : React.createElement("div", { style: { fontSize: 12, color: c.success, fontWeight: 600 } }, "✓ Nothing to check: every teacher has a salary and a bank account, and no pay is below zero."),
  );
};
// under a teacher's name in the month table: part of a month, an installment, a change since approval
const llqaPayRowNote = (t) => {
  const p = t && t.pay;
  if (!p) return null;
  const out = [];
  if (p.days && p.monthDays && p.days < p.monthDays) out.push([p.days + " of " + p.monthDays + " days" + (p.from && p.from.slice(8) !== "01" ? " · joined " + llqaDayMon(p.from) : "") + (p.to && Number(p.to.slice(8)) < p.monthDays ? " · left " + llqaDayMon(p.to) : ""), c.warn]);
  const n = Object.keys(p.inst || {}).length;
  if (n && p.status === "pending") out.push(["Advance installment " + llqaRs(p.advance), c.accent]);
  if (p.fineNow != null) out.push(["Fines now " + llqaRs(p.fineNow) + " (approved with " + llqaRs(p.fine) + ")", c.warn]);
  const xt = p.status !== "paid" ? llqaExtraText(p.extraClasses) : ""; // v76: extra classes taken
  if (xt) out.push([xt, p.extraClasses && p.extraClasses.total ? c.success : c.warn]);
  if (p.extraNow != null) out.push(["Extra classes now " + llqaRs(p.extraNow) + " (approved with " + llqaRs(p.extraPay || 0) + ")", c.warn]);
  if (Number(p.net) < 0 && p.status !== "paid") out.push(["Pay below zero — check the advance", c.danger]);
  if (!out.length) return null;
  return React.createElement("div", { style: { fontSize: 10, fontWeight: 600, marginTop: 2, display: "flex", flexDirection: "column", gap: 1 } }, out.map(([txt, col], i) => React.createElement("span", { key: i, style: { color: col } }, txt)));
};
// Payroll → Advances & Loans: each advance with what is paid back, what is left, the next installment
const LLQAPayLoans = ({ teachers, payHistory, setPayHistory, onNew }) => {
  const today = todayPK();
  const loans = llqaLoans(payHistory).slice().sort((a, b) => (String(a.given || "") < String(b.given || "") ? 1 : -1));
  const rows = loans.map((L) => ({ L, s: llqaLoanState(payHistory, L, teachers, today) }));
  const open = rows.filter((x) => !x.s.done);
  const remove = (L) => {
    if (!confirm("Remove the advance of " + llqaRs(L.amount) + " to " + (L.teacher || "this teacher") + "? Nothing has been taken back from a paid month yet.")) return;
    setPayHistory((prev) => ({ ...(prev || {}), _loans: (Array.isArray((prev || {})._loans) ? prev._loans : []).filter((x) => !x || x.id !== L.id) }));
  };
  const th = (t) => React.createElement("th", { key: t, style: { textAlign: "left", padding: "6px 8px", fontSize: 10, color: c.textSec, fontWeight: 700, whiteSpace: "nowrap" } }, t);
  const td = (k, v, st) => React.createElement("td", { key: k, style: { padding: "7px 8px", fontSize: 12, color: c.text, ...(st || {}) } }, v);
  return React.createElement(
    "div",
    { style: { background: c.bgCard, border: "1px solid " + llqaAlpha(c.border, "aa"), borderRadius: 10, padding: 14 } },
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 } },
      React.createElement(
        "div",
        null,
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: c.text } }, "Advances & Loans"),
        React.createElement("div", { style: { fontSize: 11, color: c.textSec } }, "Each advance is taken back from the pay by itself, in its installments, from its first month. " + open.length + " still being paid back: " + llqaRs(open.reduce((s, x) => s + x.s.left, 0)) + " left."),
      ),
      llqaMini("+ New advance", () => onNew(null), { key: "n", solid: true, tone: "accent", disabled: !(teachers || []).length }),
    ),
    !rows.length
      ? React.createElement("div", { style: { fontSize: 12, color: c.textSec, padding: "12px 0" } }, "No advances or loans yet. Give one here or with + on a teacher's row; it is taken back from their pay by itself.")
      : React.createElement(
          "div",
          { style: { overflowX: "auto" } },
          React.createElement(
            "table",
            { style: { width: "100%", borderCollapse: "collapse" } },
            React.createElement("thead", null, React.createElement("tr", null, ["Teacher", "Given", "Amount", "Installments", "Paid back", "Left", "Next", "Reason", ""].map(th))),
            React.createElement(
              "tbody",
              null,
              rows.map(({ L, s }) =>
                React.createElement(
                  "tr",
                  { key: L.id, style: { borderTop: "1px solid " + llqaAlpha(c.border, "66") } },
                  td("t", s.t.name || L.teacher || "—", { fontWeight: 600 }),
                  td("g", llqaIsDay(L.given) ? llqaDayMon(L.given) + " " + L.given.slice(0, 4) : "—"),
                  td("a", llqaRs(L.amount)),
                  td("i", (Number(L.installments) || 1) + " × " + llqaRs(llqaLoanPer(L)) + " from " + llqaYmName(L.start)),
                  td("p", llqaRs(s.paid) + (s.held ? " (+" + llqaRs(s.held) + " approved)" : "")),
                  td("l", s.done ? "✓ Paid back" : llqaRs(s.left), { color: s.done ? c.success : c.warn, fontWeight: 700 }),
                  td("n", s.done || !s.next ? "—" : llqaYmName(s.next) + ": " + llqaRs(s.nextAmt)),
                  td("r", (L.reason || "—") + (L.by ? " · by " + L.by : ""), { color: c.textSec, fontSize: 11 }),
                  td("x", !s.paid && !s.held ? llqaMini("Remove", () => remove(L), { key: "rm", tone: "danger" }) : null),
                ),
              ),
            ),
          ),
        ),
  );
};
// a new advance: the teacher, the amount, the installments, the first month it is taken from, the reason
const LLQAPayAdvanceWin = ({ teachers, t, onSave, onClose }) => {
  const list = (teachers || []).filter((x) => x && !llqaTeacherGone(x));
  const [tid, setTid] = React.useState(t ? String(t.id) : "");
  const [amount, setAmount] = React.useState("");
  const [n, setN] = React.useState("1");
  const [start, setStart] = React.useState(todayPK().slice(0, 7));
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState("");
  const box = { padding: "7px 10px", background: c.bgInput, border: "1px solid " + c.border, borderRadius: 6, color: c.text, fontSize: 12, width: "100%", boxSizing: "border-box" };
  const lab = (x) => React.createElement("div", { style: { color: c.textSec, fontSize: 11, fontWeight: 600, margin: "10px 0 4px" } }, x);
  const cur = todayPK().slice(0, 7);
  const months = [0, 1, 2, 3].map((i) => llqaMonthAdd(cur, i));
  const amt = Math.round(Number(amount));
  const per = amt > 0 ? Math.ceil(amt / Math.max(1, Number(n) || 1)) : 0;
  const save = () => {
    const who = list.find((x) => String(x.id) === tid);
    if (!who) return setErr("Choose the teacher.");
    if (!(amt > 0)) return setErr("Enter the amount.");
    if (!String(reason).trim()) return setErr("Write the reason.");
    onSave({ id: "ln" + Date.now().toString(36), teacherId: who.id, teacher: who.name, amount: amt, installments: Math.max(1, Number(n) || 1), start, given: todayPK(), reason: String(reason).trim(), by: llqaPayActor(), at: new Date().toISOString() });
  };
  return llqaShell(
    "Give a salary advance",
    "It is taken back from the teacher's pay by itself: the installments from the month you choose. If they leave, the rest is taken from their last pay.",
    React.createElement(
      "div",
      null,
      lab("Teacher"),
      React.createElement(LLQASelect, { value: tid, title: "Teacher", onChange: (e) => setTid(e.target.value), style: box }, [React.createElement("option", { key: "", value: "" }, "Choose the teacher"), ...list.map((x) => React.createElement("option", { key: x.id, value: String(x.id) }, x.name + (x.code ? " (" + x.code + ")" : "")))]),
      lab("Amount (Rs)"),
      React.createElement("input", { type: "number", min: 0, value: amount, "aria-label": "Advance amount", placeholder: "e.g. 10000", onChange: (e) => setAmount(e.target.value), style: box }),
      lab("Paid back in"),
      React.createElement(LLQASelect, { value: n, title: "Installments", onChange: (e) => setN(e.target.value), style: box }, [1, 2, 3, 4, 5, 6, 8, 10, 12].map((k) => React.createElement("option", { key: k, value: String(k) }, k === 1 ? "1 month (all at once)" : k + " monthly installments"))),
      lab("Taken from the pay of"),
      React.createElement(LLQASelect, { value: start, title: "First month", onChange: (e) => setStart(e.target.value), style: box }, months.map((m) => React.createElement("option", { key: m, value: m }, llqaYmName(m) + (m === cur ? " (this month)" : "")))),
      lab("Reason"),
      React.createElement("input", { value: reason, "aria-label": "Reason", placeholder: "e.g. medical, family need", onChange: (e) => setReason(e.target.value), style: box }),
      per ? React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: c.textSec } }, Number(n) > 1 ? n + " × " + llqaRs(per) + " (the last one what is left), from " + llqaYmName(start) + "." : llqaRs(amt) + " from the " + llqaYmName(start) + " pay.") : null,
      err ? React.createElement("div", { style: { marginTop: 8, fontSize: 12, color: c.danger, fontWeight: 700 } }, err) : null,
    ),
    [llqaMini("Cancel", onClose, { key: "c", big: true }), llqaMini("Give the advance", save, { key: "s", big: true, solid: true, tone: "accent" })],
    { onClose, width: 520 },
  );
};
/* ============================================================
   v76: absences and leave decided by what is marked; extra classes from the Timetable; holidays editable
   - At a teacher's closing time (their exit time + the sign-out minutes) on a working day with no sign-in and
     nothing marked, the CRM marks them Absent (unpaid). A leave request that covers the day makes it leave instead:
     approved → paid or unpaid as approved; still waiting → unpaid until someone marks it paid. Signing in after the
     exit time is the same: the office day was missed.
   - A team lead (their own teachers), a manager (Approve Leaves) or an admin (Mark Attendance) marks a day without a
     sign-in as Paid leave / Unpaid leave / Absent, before or after, until that month's pay is approved. Paid leave
     costs nothing; unpaid leave and absence cost the absent amount (Settings: a fixed amount, or one day's salary).
     Settings can limit paid leave a month: over it only an admin gives more.
   - A class is extra when its Timetable box is marked Extra (Saturday and Sunday boxes start as Extra), it falls on
     a holiday, or a make-up is marked Extra. It is paid once the teacher logs it (present or late) at the Extra class
     or Subject extra class rate (Settings). A class moved to another box starts with that box's default.
   ============================================================ */
const LLQA_ABS_FROM = "2026-11-14"; // the CRM marks absences for office days from here (none before v76)

/* ---------- absent and leave ---------- */
// one day's salary (the absent amount when Settings say "One day's salary"): the salary that day ÷ the days of its month
const llqaDayPay = (t, date) => {
  const s = Number(llqaSalaryOn(t, date)) || 0;
  return s > 0 ? Math.round(s / llqaYmDays(String(date).slice(0, 7))) : 0;
};
// what one absence / unpaid leave day costs (the day keeps its dayPay and the rule it began with)
const llqaAbsAmt = (rec, r, half) => {
  const dp = Number(rec && rec.dayPay) || 0;
  if (r.absMode === "salary" && dp > 0) return half ? Math.round(dp / 2) : dp;
  return half ? r.halfDay : r.absent;
};
// a day without a sign-in: leave (paid / unpaid) or absent
const llqaIsLeaveDay = (h) => !!h && (h.status === "On Leave" || (h.status === "Absent" && llqaHm2m(h.checkIn) == null));
const llqaLeaveDayText = (h) => {
  if (!h) return "";
  if (h.status === "On Leave") return (h.paid === false ? "Unpaid leave" : "Paid leave") + (h.halfDay ? " (half day)" : "") + (h.pending ? " · request waiting for approval" : "");
  if (h.status === "Absent") return "Absent" + (h.auto ? " — no sign-in by " + llqaHm12(h.officeEnd) : "") + " (unpaid)";
  return String(h.status || "");
};
// a team lead's own teacher (the teacher's Team Lead is them)
const llqaIsLeadOf = (user, t) => {
  if (!user || user.role !== "teamlead" || !t) return false;
  const lead = String(t.teamLead || t.lead || "").trim().toLowerCase();
  return !!lead && lead === String(user.name || "").trim().toLowerCase();
};
// mark a day without a sign-in as paid leave, unpaid leave or absent: an admin (Mark Attendance), a manager
// (Approve Leaves), or the teacher's team lead. A day they signed in is corrected by an admin in Attendance.
const llqaCanMarkLeave = (user, t, rec) => {
  if (!user || !t) return false;
  if (rec && !llqaIsLeaveDay(rec)) return false;
  return llqaCanMarkAll(user) || llqaUserCan(user, "Approve Leaves") || llqaIsLeadOf(user, t);
};
const llqaCanMarkLeaveAny = (user) => !!user && (llqaCanMarkAll(user) || llqaUserCan(user, "Approve Leaves") || user.role === "teamlead");
// a month whose pay is approved or paid keeps its days
const llqaPayLock = (tid, date) => {
  const r = ((((LLQAApp.ctx || {}).payrollHistory || {})[tid]) || []).find((x) => x && x.month === String(date).slice(0, 7));
  return r && (r.status === "approved" || r.status === "paid") ? r.status : "";
};
const llqaPayLockText = (st, date) => {
  const m = llqaYmName(String(date).slice(0, 7));
  return st === "paid" ? m + " is already paid — this day can't change now." : m + "'s pay is approved — put it back to pending in Payroll first.";
};
// paid leave days in a month: days marked paid leave (a half day is ½) and approved paid leave not marked yet
const llqaPaidUsed = (t, ym, skip) => {
  const ctx = LLQAApp.ctx || {};
  const set = ctx.appSettings || {};
  const not = new Set(skip || []);
  const recs = (llqaAttView()[String(t.id)] || []).filter((h) => h && String(h.date || "").startsWith(ym) && !not.has(h.date));
  const have = new Set(recs.map((h) => h.date));
  let n = recs.filter((h) => h.status === "On Leave" && h.paid !== false).reduce((s, h) => s + (h.halfDay ? 0.5 : 1), 0);
  (ctx.leaves || []).forEach((l) => {
    if (!l || l.status !== "approved" || l.pay === "unpaid" || String(l.teacherId) !== String(t.id) || !llqaIsDay(l.from)) return;
    llqaDatesIn(l.from, l.to || l.from, 62).forEach((d) => {
      if (d.startsWith(ym) && !have.has(d) && !not.has(d) && llqaWorkDay(t, d, set).ok) n += l.halfDay ? 0.5 : 1;
    });
  });
  return n;
};
// paid leave over the monthly limit (Settings): {} when within it; { block } for all but an admin; { warn } for an admin
const llqaPaidCheck = (user, t, dates, half) => {
  const lim = llqaFineRules((LLQAApp.ctx || {}).appSettings).paidLimit;
  if (!lim || !t) return {};
  const byYm = {};
  (dates || []).forEach((d) => {
    const ym = String(d).slice(0, 7);
    byYm[ym] = (byYm[ym] || 0) + (half ? 0.5 : 1);
  });
  for (const ym of Object.keys(byYm)) {
    const used = llqaPaidUsed(t, ym, dates);
    if (used + byYm[ym] > lim) {
      const txt = (t.name || "This teacher") + " already has " + used + " paid leave day" + (used === 1 ? "" : "s") + " in " + llqaYmName(ym) + " (limit " + lim + " a month)";
      return llqaCanMarkAll(user) ? { warn: txt + ". Give paid leave anyway?" } : { block: txt + ". Only an admin can give more paid leave — mark it unpaid, or ask an admin." };
    }
  }
  return {};
};
// a teacher's day (no sign-in) as paid leave, unpaid leave or absent. "" when saved, "cancel", or why not.
const llqaSetLeaveDay = (t, date, kind, note, force) => {
  const ctx = LLQAApp.ctx || {};
  const user = ctx.user;
  const set = ctx.appSettings || {};
  if (!t || !llqaIsDay(date)) return "Choose the teacher and the day.";
  if (!llqaAttReady()) return "Attendance is still loading — try again in a moment.";
  const uid = String(t.id);
  const h = (llqaAttView()[uid] || []).find((x) => x && x.date === date) || null;
  if (h && !llqaIsLeaveDay(h)) return "They signed in that day — an admin corrects it in Attendance.";
  if (!llqaCanMarkLeave(user, t, h)) return "Only their team lead, a manager or an admin marks this.";
  const lock = llqaPayLock(uid, date);
  if (lock) return llqaPayLockText(lock, date);
  if (kind === "paid" && !force) {
    const ck = llqaPaidCheck(user, t, [date], !!(h && h.halfDay));
    if (ck.block) return ck.block;
    if (ck.warn && !confirm(ck.warn)) return "cancel";
  }
  const who = llqaPayActor();
  const off = llqaOffice(t, set);
  const wd = llqaWorkDay(t, date, set);
  const label = kind === "paid" ? "paid leave" : kind === "unpaid" ? "unpaid leave" : "absent";
  const why = String(note || "").trim();
  llqaAttWrite((prev) => {
    const list = prev[uid] || [];
    const cur = list.find((x) => x && x.date === date);
    if (cur && !llqaIsLeaveDay(cur)) return prev;
    const reasons = { ...((cur && cur.reasons) || {}) };
    delete reasons.day;
    const rec = llqaWithFine(
      {
        ...(cur || {}),
        date,
        status: kind === "absent" ? "Absent" : "On Leave",
        paid: kind === "paid",
        pending: false,
        auto: false,
        halfDay: kind === "absent" ? false : !!(cur && cur.halfDay),
        checkIn: "—",
        checkOut: "—",
        lateMin: 0,
        earlyMin: 0,
        awayMin: 0,
        officeStart: (cur && cur.officeStart) || off.start,
        officeEnd: (cur && cur.officeEnd) || off.end,
        offDay: wd.ok ? "" : wd.why,
        dayPay: llqaDayPay(t, date),
        reasons,
        fineOverride: null,
        device: (cur && cur.device) || "Admin Panel",
        markedBy: who,
        leaveBy: who,
        leaveAt: new Date(llqaNowMs()).toISOString(),
        leaveNote: why,
        approved: true,
      },
      set,
      who,
      "marked " + label + " by " + who + (why ? ": " + why : ""),
    );
    return { ...prev, [uid]: list.filter((x) => !x || x.date !== date).concat([rec]) };
  });
  return "";
};
// the first office day the CRM may mark for a teacher: v76's start, the attendance it has (last month on), their join
// date and the day after they were added to the CRM — or, with neither, their first day in attendance (a teacher
// brought in later isn't marked for the days before, nor for the day they were added: they may have had no sign-in yet)
const llqaAbsFirst = (t, recs, today, set) => {
  const base = [LLQA_ABS_FROM, llqaIsDay(set.autoAbsent) ? set.autoAbsent : "", llqaPrevYm(today.slice(0, 7)) + "-01"]; // turned on again: from that day
  const own = [t.joinDate, llqaIsDay(t.addedAt) ? llqaAddDays(t.addedAt, 1) : ""].filter(llqaIsDay);
  if (own.length) return base.concat(own).sort().pop();
  const seen = (recs || []).map((h) => h && h.date).filter(llqaIsDay).sort()[0];
  return seen ? base.concat([seen]).sort().pop() : "";
};
// office days whose closing time has passed with nothing in attendance: [{ t, date, o, lv }]
const llqaAbsentDue = (nowMs) => {
  const ctx = LLQAApp.ctx || {};
  const set = ctx.appSettings || {};
  const rules = llqaFineRules(set);
  if (!rules.autoAbsent) return [];
  const view = llqaAttView();
  const today = llqaPkDate(nowMs);
  const out = [];
  (ctx.teachers || []).forEach((t) => {
    if (!t || t.id == null) return;
    const gone = llqaTeacherGone(t) || t.status === "quit"; // "quit": an older way of saying they left (Timetable)
    if (gone && !llqaIsDay(t.leftOn)) return;
    const recs = view[String(t.id)] || [];
    const first = llqaAbsFirst(t, recs, today, set);
    if (!first) return;
    const o = llqaOffice(t, set);
    const len = llqaShiftLen(o);
    const have = new Set(recs.map((h) => h && h.date));
    for (let d = first, i = 0; d <= today && i < 70; d = llqaAddDays(d, 1), i++) {
      if (gone && d > t.leftOn) break;
      if (have.has(d)) continue;
      if (nowMs < llqaPkMs(d, o.start) + len * 60000 + rules.autoOutMin * 60000) continue;
      if (!llqaWorkDay(t, d, set).ok || llqaPayLock(t.id, d)) continue;
      out.push({ t, date: d, o, lv: llqaLeaveOn(t, d) });
    }
  });
  return out;
};
// the clock's job (an admin's screen: the Super Admin, or a role given "Mark Attendance")
const llqaAbsentRun = () => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user;
  if (!u || u.role === "teacher" || u.role === "parent" || !(u.role === "superadmin" || llqaCanMarkAll(u))) return false;
  // the settings (working days, hours, the switch) and the holidays too: never on a first copy that isn't the cloud's
  if (!llqaReadyFor(["teachers", "leaves", "doc:data/payrollHistory", "doc:settings/preferences", "doc:settings/calendar"]) || !llqaAttReady()) return false;
  const nowMs = llqaNowMs();
  const due = llqaAbsentDue(nowMs);
  if (!due.length) return false;
  const set = ctx.appSettings || {};
  const at = new Date(nowMs).toISOString();
  llqaAttWrite((prev) => {
    const next = { ...prev };
    due.forEach(({ t, date, o, lv }) => {
      const uid = String(t.id);
      const list = next[uid] || [];
      if (list.some((h) => h && h.date === date)) return;
      const ok = !!lv && lv.status === "approved";
      const base = { date, checkIn: "—", checkOut: "—", lateMin: 0, earlyMin: 0, awayMin: 0, officeStart: o.start, officeEnd: o.end, offDay: "", dayPay: llqaDayPay(t, date), device: "CRM", auto: true, autoAt: at, approved: true };
      const rec = lv
        ? { ...base, status: "On Leave", paid: ok ? lv.pay !== "unpaid" : false, pending: !ok, halfDay: !!lv.halfDay, leaveId: lv.id, leaveType: lv.type || "" }
        : { ...base, status: "Absent", paid: false };
      const why = lv
        ? ok
          ? (lv.pay === "unpaid" ? "unpaid" : "paid") + " leave (" + (lv.type || "leave") + ", approved)"
          : "leave request waiting for approval — unpaid until marked paid"
        : "no sign-in by " + llqaHm12(o.end) + " — absent (unpaid)";
      next[uid] = list.concat([llqaWithFine(rec, set, "CRM", why)]);
    });
    return next;
  });
  const abs = due.filter((x) => !x.lv);
  if (abs.length) llqaToast(llqaAbsentToast(abs));
  return true;
};
const llqaAbsentNames = (list) => list.slice(0, 4).map((x) => x.t.name + " (" + llqaDayMon(x.date) + ")").join(", ") + (list.length > 4 ? " and " + (list.length - 4) + " more" : "");
const llqaAbsentToast = (abs) => ({
  kind: "absent",
  key: "absent",
  text: "🚫 Marked absent — no sign-in by closing time: " + llqaAbsentNames(abs) + ". Unpaid unless their team lead, a manager or an admin marks paid leave.",
  actions: [{ label: "Attendance", run: () => llqaGo("attendance", "fines") }],
});
// a team lead's own teachers marked absent by the CRM, today or yesterday
const llqaLeadAbsents = (u, today) => {
  const ctx = LLQAApp.ctx || {};
  const view = llqaAttView();
  const y = llqaAddDays(today, -1);
  const out = [];
  (ctx.teachers || []).forEach((t) => {
    if (!llqaIsLeadOf(u, t)) return;
    (view[String(t.id)] || []).forEach((h) => {
      if (h && h.auto && h.status === "Absent" && (h.date === today || h.date === y)) out.push({ t, date: h.date });
    });
  });
  return out;
};
const llqaLeadAbsentToast = (list) => ({
  kind: "absent",
  key: "absent-lead",
  text: "🚫 Your team — marked absent, no sign-in by closing time: " + llqaAbsentNames(list) + ". Unpaid; if they told you, mark it paid leave.",
  actions: [{ label: "Attendance", run: () => llqaGo("attendance", "fines") }],
});
// a teacher's own unpaid days this week (absent, or unpaid leave)
const llqaMyAbsents = (u, today) => {
  const uid = String(llqaTeacherIdOf(u));
  const from = llqaAddDays(today, -6);
  return (llqaAttView()[uid] || []).filter((h) => h && h.date >= from && h.date <= today && ((h.status === "Absent" && h.auto) || (h.status === "On Leave" && h.paid === false))).sort((a, b) => String(a.date).localeCompare(String(b.date)));
};
const llqaMyAbsentToast = (list) => {
  const sum = list.reduce((s, h) => s + (Number(h.fine) || 0), 0);
  const one = list.length === 1 ? list[0] : null;
  return {
    kind: "absent",
    key: "absent-mine",
    text: one
      ? "📅 " + llqaDayMon(one.date) + ": " + llqaLeaveDayText(one) + " — " + llqaRs(one.fine) + " off your pay. If you told your team lead, ask them to mark it paid leave."
      : "📅 " + list.length + " unpaid days this week (" + list.map((h) => llqaDayMon(h.date)).join(", ") + ") — " + llqaRs(sum) + " off your pay. If you told your team lead, ask them to mark paid leave.",
  };
};
// a leave request approved as paid or unpaid, or rejected; the days already marked follow it. "" when done.
const llqaLeaveDecide = (id, status, pay) => {
  const ctx = LLQAApp.ctx || {};
  const l = (ctx.leaves || []).find((x) => x && String(x.id) === String(id));
  if (!l || typeof ctx.setLeaves !== "function") return "That request isn't there any more.";
  const t = (ctx.teachers || []).find((x) => String(x.id) === String(l.teacherId)) || { id: l.teacherId, name: l.teacherName || "The teacher" };
  if (status === "approved" && pay !== "unpaid") {
    const set = ctx.appSettings || {};
    const days = llqaIsDay(l.from) ? llqaDatesIn(l.from, l.to || l.from, 62).filter((d) => llqaWorkDay(t, d, set).ok) : [];
    const ck = llqaPaidCheck(ctx.user, t, days, !!l.halfDay);
    if (ck.block) return ck.block;
    if (ck.warn && !confirm(ck.warn)) return "cancel";
  }
  const who = llqaPayActor();
  const at = new Date().toISOString();
  const next = status === "approved" ? { ...l, status, pay: pay === "unpaid" ? "unpaid" : "paid", payBy: who, payAt: at } : { ...l, status, decidedBy: who, decidedAt: at };
  ctx.setLeaves((prev) => (prev || []).map((x) => (x && String(x.id) === String(id) ? next : x)));
  if (status === "approved" && typeof llqaLeaveApproved === "function") llqaLeaveApproved(next);
  llqaLeaveSync(next, t);
  return "";
};
const llqaLeaveAct = (id, status, pay) => {
  const e = llqaLeaveDecide(id, status, pay);
  if (e && e !== "cancel") alert(e);
};
// the days of a leave already in attendance (marked by the CRM at closing time, or as this leave) follow its
// decision; a month whose pay is approved keeps its days
const llqaLeaveSync = (l, t) => {
  if (!l || !t || !llqaIsDay(l.from) || !llqaAttReady()) return;
  const set = (LLQAApp.ctx || {}).appSettings || {};
  const uid = String(t.id);
  const days = new Set(llqaDatesIn(l.from, l.to || l.from, 62));
  const who = llqaPayActor();
  llqaAttWrite((prev) => {
    const list = prev[uid] || [];
    let changed = false;
    const out = list.map((h) => {
      if (!h || !days.has(h.date) || !llqaIsLeaveDay(h) || llqaPayLock(uid, h.date)) return h;
      if (!(String(h.leaveId || "") === String(l.id) || (h.auto && !h.leaveId))) return h;
      if (l.status === "rejected") {
        changed = true;
        return llqaWithFine({ ...h, status: "Absent", paid: false, pending: false, halfDay: false, leaveId: "", leaveType: "" }, set, who, "leave request rejected by " + who + " — absent (unpaid)");
      }
      if (l.status === "approved") {
        changed = true;
        return llqaWithFine({ ...h, status: "On Leave", paid: l.pay !== "unpaid", pending: false, halfDay: !!l.halfDay, leaveId: l.id, leaveType: l.type || "" }, set, who, (l.pay === "unpaid" ? "unpaid" : "paid") + " leave approved by " + who);
      }
      return h;
    });
    return changed ? { ...prev, [uid]: out } : prev;
  });
};
// Attendance → a day as paid leave, unpaid leave or absent (any day from last month to a month ahead)
const LLQALeaveDayWin = ({ data, onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user;
  const today = todayPK();
  const d0 = data || {};
  const mine = (ctx.teachers || []).filter((t) => t && !llqaTeacherGone(t) && llqaCanMarkLeave(u, t, null));
  const [tid, setTid] = React.useState(d0.tid != null ? String(d0.tid) : "");
  const [date, setDate] = React.useState(d0.date || today);
  const t = (ctx.teachers || []).find((x) => String(x.id) === String(tid)) || null;
  const h = t ? (llqaAttView()[String(t.id)] || []).find((x) => x && x.date === date) || null : null;
  const [kind, setKind] = React.useState(d0.kind || (h && h.status === "On Leave" && h.paid !== false ? "unpaid" : "paid"));
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState("");
  const min = llqaPrevYm(today.slice(0, 7)) + "-01";
  const max = llqaAddDays(today, 31);
  const r = llqaFineRules(ctx.appSettings);
  const amt = t ? llqaAbsAmt({ dayPay: llqaDayPay(t, date) }, r, !!(h && h.halfDay)) : 0;
  const save = () => {
    if (!t) return setErr("Choose the teacher.");
    if (!llqaIsDay(date) || date < min || date > max) return setErr("Choose a day from " + llqaDayMon(min) + " to " + llqaDayMon(max) + ".");
    const e = llqaSetLeaveDay(t, date, kind, note);
    if (e === "cancel") return;
    if (e) return setErr(e);
    llqaToast({ kind: "info", ttl: 6000, text: "✓ " + t.name + " · " + llqaDayMon(date) + ": " + (kind === "paid" ? "paid leave" : kind === "unpaid" ? "unpaid leave" : "absent") + "." });
    onClose();
  };
  const sel = (title, value, onChange, opts) =>
    React.createElement(
      "div",
      { style: { marginBottom: 10 } },
      React.createElement("div", { style: { fontSize: 12, color: c.textSec, marginBottom: 4 } }, title),
      React.createElement(LLQASelect, { value, title, onChange: (e) => onChange(e.target.value), style: { width: "100%" } }, opts.map(([v, l]) => React.createElement("option", { key: v, value: v }, l))),
    );
  return llqaShell(
    "Leave or absence",
    "Paid leave costs nothing. Unpaid leave and absence cost the absent amount" + (t ? " (" + llqaRs(amt) + " for " + t.name + ")" : "") + ".",
    React.createElement(
      "div",
      null,
      d0.tid != null ? null : sel("Teacher", tid, setTid, [["", "Choose the teacher…"]].concat(mine.map((x) => [String(x.id), x.name]))),
      React.createElement(Inp, { label: "Day", type: "date", value: date, onChange: (v) => setDate(v) }),
      t ? React.createElement("div", { style: { fontSize: 12, color: c.textSec, margin: "-4px 0 10px" } }, h ? "Now: " + (llqaIsLeaveDay(h) ? llqaLeaveDayText(h) : "signed in (" + (h.status || "") + ")") + (Number(h.fine) > 0 ? " · " + llqaRs(h.fine) : "") : "Nothing marked for this day yet.") : null,
      t && llqaIsDay(date) && !llqaWorkDay(t, date, ctx.appSettings || {}).ok ? React.createElement("div", { style: { fontSize: 12, color: c.warn, margin: "-6px 0 10px" } }, "A day off for " + t.name + " (" + llqaWorkDay(t, date, ctx.appSettings || {}).why + ") — nothing is cut that day.") : null,
      sel("Mark as", kind, setKind, [
        ["paid", "Paid leave — nothing cut"],
        ["unpaid", "Unpaid leave — the absent amount is cut"],
        ["absent", "Absent — the absent amount is cut"],
      ]),
      React.createElement(Inp, { label: "Note (optional)", value: note, onChange: (v) => setNote(v), placeholder: "e.g. told the team lead in the morning" }),
      err ? React.createElement("div", { style: { color: c.danger, fontSize: 12, marginTop: 4 } }, err) : null,
    ),
    [llqaMini("Cancel", onClose, { key: "x", big: true }), llqaMini("Save", save, { key: "ok", big: true, solid: true, tone: "accent" })],
    { onClose, width: 480 },
  );
};

/* ---------- extra classes ---------- */
const llqaCanMarkExtra = (user) => llqaUserCan(user || (LLQAApp.ctx || {}).user, "Mark Extra Classes");
const llqaIsWeekendRow = (day) => day === "Sat" || day === "Sun";
const llqaExtraRates = (s) => ({ rate: Math.max(0, Number((s || {}).extraClassRate) || 0), rateS: Math.max(0, Number((s || {}).subjectExtraRate) || 0) });
// a box's marks: [{ tid, day, from, on, by, at }] — each for the teacher and day it was set on (a moved class
// starts with its new box's default)
const llqaCellMarks = (cell, tid, day) =>
  (Array.isArray(cell && cell.x) ? cell.x : [])
    .filter((m) => m && String(m.tid) === String(tid) && m.day === day && llqaIsDay(m.from))
    .sort((a, b) => String(a.from).localeCompare(String(b.from)) || String(a.at || "").localeCompare(String(b.at || "")));
const llqaCellExtraOn = (cell, tid, day, date) => {
  const ms = llqaCellMarks(cell, tid, day).filter((m) => m.from <= date);
  return ms.length ? { on: !!ms[ms.length - 1].on, set: ms[ms.length - 1] } : { on: llqaIsWeekendRow(day), set: null };
};
// a make-up: its own mark, else extra on a Saturday or Sunday
const llqaMakeupIsExtra = (m) => !!m && (m.extra === true || (m.extra !== false && llqaIsDay(m.date) && llqaIsWeekendRow(llqaWeekday(m.date))));
const llqaMakeupExtraBtn = (m) => {
  if (!m || !llqaCanMarkExtra()) return null;
  const on = llqaMakeupIsExtra(m);
  return llqaMini(on ? "Extra ✓" : "Mark as Extra", () => llqaSetMakeup(m.id, { extra: !on, extraBy: llqaPayActor(), extraAt: new Date().toISOString() }), {
    key: "xe",
    tone: on ? "accent" : undefined,
    title: on ? "Counts as an extra class — tap to make it regular" : "Make it an extra class (paid at the extra class rate once logged)",
  });
};
// is a class extra for the teacher who took it? A holiday: always. A make-up: as above. A class taken for a teacher
// on leave: regular, unless it is a weekend class.
const llqaClsExtra = (it, date) => {
  if (!it) return false;
  if (it.holiday) return true;
  if (it.makeup) return llqaMakeupIsExtra(it.makeup);
  if (it.covered) return llqaIsWeekendRow(it.rowDay);
  return llqaCellExtraOn(it.cell, it.teacherId, it.rowDay, date).on;
};
const llqaClsSubject = (it) => /^subject$/i.test(String((it && it.stu && it.stu.course) || (it && it.cell && it.cell.c) || "").trim());
// taken: the teacher logged it, the student present or late
const llqaClsHeld = (it) => {
  const a = String((it && it.entry && it.entry.attended) || "").toLowerCase();
  return !!(it && it.entry) && (a === "present" || a === "late");
};
// every extra class taken in month ym (up to today), by teacher id: { n, ns, list }
const LLQAXi = new Map();
const llqaExtraIndex = (ym, x) => {
  const ctx = x || LLQAApp.ctx || {};
  const today = todayPK();
  const deps = [ctx.teachers, ctx.students, ctx.dailyProgress, ctx.makeups, ctx.covers, ctx.leaves, ctx.calendar, today];
  const hit = LLQAXi.get(ym);
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.v;
  const out = new Map();
  const last = ym + "-" + String(llqaYmDays(ym)).padStart(2, "0");
  const end = last < today ? last : today;
  for (let d = ym + "-01", i = 0; d <= end && i < 31; d = llqaAddDays(d, 1), i++) {
    let items = [];
    try {
      items = llqaClassesOn(d, ctx.teachers || [], ctx.students || [], ctx.dailyProgress || []);
    } catch (e) {
      items = [];
    }
    items.forEach((it) => {
      if (!llqaClsHeld(it) || !llqaClsExtra(it, d)) return;
      const who = String(llqaClsWho(it).teacherId);
      const sub = llqaClsSubject(it);
      const o = out.get(who) || { n: 0, ns: 0, list: [] };
      if (sub) o.ns++;
      else o.n++;
      if (o.list.length < 300) o.list.push({ date: d, slot: it.slot, student: (it.cell && it.cell.s) || "", sub, why: it.holiday ? "holiday" : it.makeup ? "make-up" : it.covered ? "weekend cover" : llqaIsWeekendRow(it.rowDay) ? "weekend" : "marked extra" });
      out.set(who, o);
    });
  }
  if (LLQAXi.size > 24) LLQAXi.clear();
  LLQAXi.set(ym, { deps, v: out });
  return out;
};
const llqaExtraPay = (t, ym, xi, set) => {
  const r = llqaExtraRates(set);
  const o = (xi && xi.get(String(t.id))) || { n: 0, ns: 0, list: [] };
  const amount = o.n * r.rate;
  const amountS = o.ns * r.rateS;
  return { n: o.n, ns: o.ns, rate: r.rate, rateS: r.rateS, amount, amountS, total: amount + amountS };
};
// extra classes count in the pay from November 2026
const llqaExtraFor = (t, ym, o) => (ym >= LLQA_PAY_FROM ? llqaExtraPay(t, ym, (o && o.xi) || llqaExtraIndex(ym), (o && o.set) || (LLQAApp.ctx || {}).appSettings) : null);
const llqaExtraText = (x) => {
  if (!x || !(x.n + x.ns)) return "";
  const parts = [x.n ? x.n + (x.rate ? " × " + llqaRs(x.rate) : "") : "", x.ns ? x.ns + " subject" + (x.rateS ? " × " + llqaRs(x.rateS) : "") : ""].filter(Boolean);
  return "Extra classes: " + parts.join(" + ") + (x.total ? " = " + llqaRs(x.total) : " (no rate set in Settings)");
};
// write a box's Extra / Regular mark from a day (the box comes into the teacher's own Timetable copy if needed)
const llqaSetCellMark = (tid, day, slot, on, from) => {
  const ctx = LLQAApp.ctx || {};
  const u = ctx.user || {};
  if (!llqaCanMarkExtra(u)) return 'Only an admin, or a role given "Mark Extra Classes", marks extra classes.';
  if (typeof ctx.setTeachers !== "function") return "The Timetable can't be saved here.";
  if (!llqaIsDay(from)) return "Choose the day it starts.";
  const t0 = (ctx.teachers || []).find((x) => x && String(x.id) === String(tid));
  const cur0 = t0 ? LLQABooking.rawCell(t0, day, slot) : null;
  if (!cur0 || typeof cur0 !== "object" || !cur0.s) return "That class isn't in the Timetable any more.";
  const by = u.name || (u.role === "superadmin" ? "Super Admin" : u.role) || "";
  const at = new Date().toISOString();
  ctx.setTeachers((prev) =>
    (prev || []).map((t) => {
      if (!t || String(t.id) !== String(tid)) return t;
      const cur = LLQABooking.rawCell(t, day, slot);
      if (!cur || typeof cur !== "object" || !cur.s) return t;
      const sch = t._ttSchedule ? JSON.parse(JSON.stringify(t._ttSchedule)) : {};
      if (!sch[day]) sch[day] = {};
      const marks = (Array.isArray(cur.x) ? cur.x : []).filter((m) => !(m && String(m.tid) === String(t.id) && m.day === day && m.from === from));
      sch[day][slot] = { ...cur, x: marks.concat([{ tid: t.id, day, from, on: !!on, by, at }]).slice(-20) };
      return { ...t, _ttSchedule: sch };
    }),
  );
  return "";
};
// the app's id of a Timetable / Subjects teacher (the screens keep their own copies)
const llqaAppTid = (t) => {
  if (!t) return null;
  const id = t._appId != null ? t._appId : t._overlayAppId != null ? t._overlayAppId : t.id;
  return id != null && ((LLQAApp.ctx || {}).teachers || []).some((x) => x && String(x.id) === String(id)) ? id : null;
};
const llqaSubjDayKey = (d) => ({ mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" })[String(d || "").toLowerCase()] || d;
// the box window: what this class counts as, with "Mark as Extra" / "Mark as Regular" next to Mark as Free
const LLQAExtraBtn = ({ t, day, slot, cell, onDone }) => {
  const tid = llqaAppTid(t);
  if (tid == null || !cell || typeof cell !== "object" || !cell.s || !day || !slot) return null;
  const st = llqaCellExtraOn(cell, tid, day, todayPK());
  const why = st.set ? "marked by " + (st.set.by || "someone") + " from " + llqaDayMon(st.set.from) : llqaIsWeekendRow(day) ? "Saturday / Sunday" : "";
  return React.createElement(
    "span",
    { "data-llqa": "extra-mark", style: { display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: st.on ? c.accent : c.textSec } }, (st.on ? "Extra class" : "Regular class") + (why ? " (" + why + ")" : "")),
    llqaCanMarkExtra()
      ? React.createElement(
          Btn,
          {
            variant: "outline",
            onClick: () => {
              if (onDone) onDone();
              llqaOpen("extramark", { tid, day, slot, on: !st.on, student: cell.s });
            },
          },
          st.on ? "Mark as Regular" : "Mark as Extra",
        )
      : null,
  );
};
// the Timetable box: a small EXTRA tag on a class that counts as extra today
const llqaCellBadge = (t, day, cell) => {
  if (!cell || typeof cell !== "object" || !cell.s) return null;
  const tid = llqaAppTid(t);
  if (tid == null || !llqaCellExtraOn(cell, tid, day, todayPK()).on) return null;
  return React.createElement("div", { style: { display: "inline-block", fontSize: 9, fontWeight: 800, letterSpacing: 0.4, color: c.accent, border: "1px solid " + llqaAlpha(c.accent, "66"), borderRadius: 4, padding: "0 4px", marginBottom: 2 } }, "EXTRA");
};
const LLQAExtraMarkWin = ({ data, onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const today = todayPK();
  const first = today.slice(0, 7) + "-01";
  const d = data || {};
  const [from, setFrom] = React.useState(today);
  const [err, setErr] = React.useState("");
  const t = (ctx.teachers || []).find((x) => x && String(x.id) === String(d.tid)) || { name: "" };
  const r = llqaExtraRates(ctx.appSettings);
  const where = (d.student || "This class") + " with " + (t.name || "the teacher") + " · " + d.day + " " + LLQABooking.fmt12(d.slot) + " (Pakistan time)";
  const save = () => {
    const e = llqaSetCellMark(d.tid, d.day, d.slot, !!d.on, from);
    if (e) return setErr(e);
    llqaToast({ kind: "info", ttl: 7000, text: "✓ " + (d.student || "The class") + " with " + (t.name || "the teacher") + " counts as " + (d.on ? "an extra class" : "a regular class") + " from " + llqaDayMon(from) + "." });
    onClose();
  };
  return llqaShell(
    d.on ? "Mark as Extra" : "Mark as Regular",
    where,
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { fontSize: 12, color: c.text, lineHeight: 1.5, marginBottom: 10 } },
        d.on
          ? "From that day each class taught is paid at the extra class rate (" + (r.rate ? llqaRs(r.rate) : "not set yet") + "; a Subject class " + (r.rateS ? llqaRs(r.rateS) : "not set yet") + "), once the teacher logs it in Today's Classes."
          : "From that day this class is part of the salary — not paid as extra.",
      ),
      React.createElement("div", { style: { fontSize: 12, color: c.textSec, marginBottom: 4 } }, "From"),
      React.createElement(
        LLQASelect,
        { value: from, title: "From", onChange: (e) => setFrom(e.target.value), style: { width: "100%" } },
        [React.createElement("option", { key: "t", value: today }, "Today (" + llqaDayMon(today) + ")")].concat(first < today ? [React.createElement("option", { key: "f", value: first }, llqaDayMon(first) + " — the start of this month")] : []),
      ),
      err ? React.createElement("div", { style: { color: c.danger, fontSize: 12, marginTop: 8 } }, err) : null,
    ),
    [llqaMini("Cancel", onClose, { key: "x", big: true }), llqaMini("Save", save, { key: "ok", big: true, solid: true, tone: "accent" })],
    { onClose, width: 460 },
  );
};

/* ---------- holidays: every entry can be changed or deleted ---------- */
const LLQAHolidayList = () => {
  const ctx = LLQAApp.ctx || {};
  const today = todayPK();
  const [old, setOld] = React.useState(false);
  const all = llqaCalendar().slice().sort((a, b) => String(a.from).localeCompare(String(b.from)));
  const list = old ? all : all.filter((d) => (d.to || d.from) >= today);
  const manage = llqaCanManage() && typeof ctx.setCalendar === "function";
  const kindText = (d) => (LLQA_DAY_KINDS.find((k) => k[0] === (d.kind || "holiday")) || LLQA_DAY_KINDS[0])[1];
  const del = (d) => {
    if (!confirm("Delete " + (d.name || "this entry") + " (" + llqaRangeLabel(d.from, d.to) + ")?")) return;
    ctx.setCalendar((prev) => ({ ...(prev || {}), days: ((prev && prev.days) || []).filter((x) => x.id !== d.id) }));
  };
  return React.createElement(
    "div",
    { "data-llqa": "holiday-list" },
    list.length
      ? list.map((d, i) =>
          React.createElement(
            "div",
            { key: d.id || i, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid " + c.border } },
            React.createElement(
              "div",
              null,
              React.createElement("div", { style: { color: c.text, fontSize: 12, fontWeight: 600 } }, d.name || "Holiday"),
              React.createElement("div", { style: { color: c.textSec, fontSize: 10 } }, llqaRangeLabel(d.from, d.to) + " · " + kindText(d)),
            ),
            manage && d.id
              ? React.createElement(
                  "div",
                  { style: { display: "flex", gap: 4 } },
                  llqaMini("Edit", () => llqaOpen("holiday", { id: d.id }), { key: "e" }),
                  llqaMini("Delete", () => del(d), { key: "x", tone: "danger" }),
                )
              : null,
          ),
        )
      : React.createElement("div", { style: { color: c.textSec, fontSize: 11, padding: "6px 0" } }, old ? "No holidays in the calendar yet." : "No holidays coming up."),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" } },
      manage ? llqaMini("+ Add Holiday", () => llqaOpen("holiday", {}), { key: "a", tone: "accent" }) : null,
      all.length > list.length || old ? llqaMini(old ? "Coming up only" : "Show past ones too", () => setOld(!old), { key: "o" }) : null,
    ),
  );
};
const LLQAHolidayWin = ({ data, onClose }) => {
  const ctx = LLQAApp.ctx || {};
  const today = todayPK();
  const cur = data && data.id ? llqaCalendar().find((d) => d.id === data.id) || null : null;
  const [f, setF] = React.useState(() => (cur ? { name: cur.name || "", from: cur.from, to: cur.to || cur.from, kind: cur.kind || "holiday", note: cur.note || "" } : { name: "", from: today, to: today, kind: "holiday", note: "" }));
  const [err, setErr] = React.useState("");
  const save = () => {
    if (!String(f.name || "").trim()) return setErr("Give it a name (e.g. Eid ul Fitr).");
    if (!llqaIsDay(f.from) || (f.to && (!llqaIsDay(f.to) || f.to < f.from))) return setErr("Check the dates — the last day can't be before the first.");
    if (typeof ctx.setCalendar !== "function" || !llqaCanManage()) return setErr("The calendar can't be changed here.");
    const u = ctx.user || {};
    const by = u.name || u.role || "";
    const at = new Date().toISOString();
    const rec = { name: String(f.name).trim(), from: f.from, to: f.to || f.from, kind: f.kind || "holiday", note: String(f.note || "").trim() };
    ctx.setCalendar((prev) => {
      const days = (prev && prev.days) || [];
      return { ...(prev || {}), days: cur ? days.map((x) => (x.id === cur.id ? { ...x, ...rec, changedBy: by, changedAt: at } : x)) : days.concat([{ id: llqaUid("h"), ...rec, at, by }]) };
    });
    llqaToast({ kind: "info", ttl: 6000, text: "✓ " + (cur ? "Changed " : "Added ") + rec.name + " (" + llqaRangeLabel(rec.from, rec.to) + ")." });
    onClose();
  };
  return llqaShell(
    cur ? "Edit " + (cur.name || "holiday") : "Add a holiday",
    "Holiday = academy closed: no classes, nobody is marked absent, and a class taken counts as extra. Ramadan / notice = classes run.",
    React.createElement(
      "div",
      null,
      React.createElement(Inp, { label: "Name", value: f.name, onChange: (v) => setF({ ...f, name: v }), placeholder: "e.g. Eid ul Fitr" }),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "First day", type: "date", value: f.from, onChange: (v) => setF({ ...f, from: v, to: !f.to || f.to < v ? v : f.to }) }),
        React.createElement(Inp, { label: "Last day", type: "date", value: f.to, onChange: (v) => setF({ ...f, to: v }) }),
      ),
      React.createElement(Inp, { label: "Type", value: f.kind, onChange: (v) => setF({ ...f, kind: v }), options: LLQA_DAY_KINDS.map(([k, l]) => ({ value: k, label: l })) }),
      React.createElement(Inp, { label: "Note for the team (optional)", value: f.note, onChange: (v) => setF({ ...f, note: v }) }),
      err ? React.createElement("div", { style: { color: c.danger, fontSize: 12, marginTop: 4 } }, err) : null,
    ),
    [llqaMini("Cancel", onClose, { key: "x", big: true }), llqaMini(cur ? "Save changes" : "Add to calendar", save, { key: "ok", big: true, solid: true, tone: "accent" })],
    { onClose, width: 480 },
  );
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
    id: "finance", // v77: fees owed, bills, receipts, cash in hand, budgets
    label: "Finance",
    icon: Receipt,
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
  "Mark Late / Early Reasons": ["attendance"], // v72: mark a reason once, with Deduct or Don't deduct
  "Edit Fines": ["attendance"], // v72: change any fine or reason afterwards (always kept in the fine's history)
  "Set Office Times & Fines": ["attendance"], // v72: office times, the per-minute rate and the other fines
  "Mark Attendance": ["attendance"], // v72: mark days by hand, check out, correct a day (a teacher never marks their own)
  "Mark Extra Classes": ["timetable", "subjects"], // v76: a Timetable class as Extra or Regular
  "Manage Finance": ["finance", "ar", "ap"], // v77: the Finance page, Accounts Receivable and Payable (payments, bills)
  "Fee Recovery": ["ar"], // v77: a family's pay-by date, stop / resume fee reminders, write fees off, put back a removed payment
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

/* ---------- v70: pop-out lists float above everything ---------- */
// A dropdown list used to be drawn inside its own card, so the next card (or the edge of a pop-up window)
// covered or cut it — in Settings → System Prefs only "Select..." showed. Lists now open in a top layer of
// their own, right next to their field: below it, or above it when there is more room there; never taller or
// wider than the window; and they follow the field when the page scrolls. Keyboard: ↑ ↓ Home End to move,
// Enter / Space to pick, Esc to close; screen readers hear a combobox and its options.
const llqaFloatRoot = () => {
  let el = document.getElementById("llqa-float-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "llqa-float-root";
    document.body.appendChild(el);
  }
  return el;
};
// screen pixels per CSS pixel inside the top layer (the Density setting zooms the whole page)
const llqaFloatScale = () => {
  const root = llqaFloatRoot();
  const p = document.createElement("div");
  p.style.cssText = "position:fixed;left:0;top:0;width:100px;height:1px;visibility:hidden;pointer-events:none";
  root.appendChild(p);
  const w = p.getBoundingClientRect().width;
  root.removeChild(p);
  return w > 0 ? w / 100 : 1;
};
let llqaFloatSeq = 0;
const LLQAFloat = ({ anchor, open, onClose, maxHeight = 260, panelRef, style, children, ...rest }) => {
  const own = React.useRef(null);
  const ref = panelRef || own;
  const [pos, setPos] = useState(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    const place = () => {
      const a = anchor && anchor.current;
      const p = ref.current;
      if (!a || !p) return;
      const r = a.getBoundingClientRect();
      // the field left the screen (page scrolled, tab changed): close, like a native list
      if (!r.width || r.bottom < 0 || r.top > window.innerHeight) {
        if (closeRef.current) closeRef.current();
        return;
      }
      const k = llqaFloatScale();
      const vw = window.innerWidth / k, vh = window.innerHeight / k;
      const L = r.left / k, T = r.top / k, B = r.bottom / k, W = r.width / k;
      const gap = 4, edge = 8;
      const need = Math.min(maxHeight, p.scrollHeight);
      const below = vh - B - gap - edge, above = T - gap - edge;
      const up = below < need && above > below;
      const h = Math.max(48, Math.min(maxHeight, up ? above : below));
      const maxW = vw - 2 * edge;
      const w = Math.min(Math.max(p.offsetWidth, W), maxW);
      const left = Math.max(edge, Math.min(L, vw - edge - w));
      const n = { left, minWidth: Math.min(W, maxW), maxWidth: Math.min(380, maxW), maxHeight: h, up };
      if (up) n.bottom = vh - T + gap;
      else n.top = B + gap;
      setPos((o) => (o && JSON.stringify(o) === JSON.stringify(n) ? o : n));
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);
  if (!open) return null;
  const at = pos
    ? { left: pos.left, top: pos.up ? "auto" : pos.top, bottom: pos.up ? pos.bottom : "auto", minWidth: pos.minWidth, maxWidth: pos.maxWidth, maxHeight: pos.maxHeight, visibility: "visible" }
    : { left: 0, top: 0, visibility: "hidden" };
  return ReactDOM.createPortal(
    React.createElement(
      "div",
      {
        ref,
        ...rest,
        "data-llqa-float": pos && pos.up ? "up" : "down",
        style: {
          position: "fixed",
          zIndex: 2147483000,
          boxSizing: "border-box",
          overflowY: "auto",
          overscrollBehavior: "contain",
          width: "max-content",
          background: "linear-gradient(" + c.bgDeep + ", " + c.bgDeep + "), " + c.bg,
          border: "1px solid " + c.border,
          borderRadius: 8,
          boxShadow: "0 12px 32px -8px rgba(15, 23, 42, 0.28), 0 2px 6px rgba(15, 23, 42, 0.08)",
          padding: "4px 0",
          ...style,
          ...at,
        },
      },
      children,
    ),
    llqaFloatRoot(),
  );
};
// closes a pop-out on a click outside it (its field and its list count as inside) or on Esc
const llqaUseDismiss = (open, setOpen, refs) => {
  React.useEffect(() => {
    if (!open) return undefined;
    const down = (e) => {
      if (refs.some((r) => r.current && r.current.contains(e.target))) return;
      setOpen(false);
    };
    const key = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation(); // Esc closes the list, not the pop-up window behind it
      setOpen(false);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key, true);
    };
  }, [open]);
};
// keeps option i of a list in view while moving with the keyboard
const llqaKeepInView = (panel, i) => {
  const p = panel.current;
  if (!p) return;
  const el = p.querySelector('[data-i="' + i + '"]');
  if (!el) return;
  if (el.offsetTop < p.scrollTop) p.scrollTop = el.offsetTop;
  else if (el.offsetTop + el.offsetHeight > p.scrollTop + p.clientHeight) p.scrollTop = el.offsetTop + el.offsetHeight - p.clientHeight;
};
// one row of a list: the option under the mouse / keyboard is shaded, the chosen one is in the accent with a tick
const llqaOptionRow = (o, i, { listId, active, chosen, muted, onPick, onHover, multi }) =>
  React.createElement(
    "div",
    {
      key: (o.clear ? "__clear" : String(o.value)) + "|" + i,
      id: listId + "-" + i,
      "data-i": i,
      role: "option",
      "aria-selected": !!chosen,
      "aria-disabled": o.disabled ? true : undefined,
      onMouseDown: (e) => e.preventDefault(), // keep the focus on the field
      onClick: () => onPick(o),
      onMouseEnter: () => onHover(i),
      style: {
        padding: "8px 12px",
        cursor: o.disabled ? "not-allowed" : "pointer",
        opacity: o.disabled ? 0.45 : 1,
        fontSize: 12,
        lineHeight: 1.35,
        color: chosen ? c.accent : muted ? c.textSec : c.text,
        fontWeight: chosen ? 600 : 400,
        background: active ? c.bgHover : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        whiteSpace: "nowrap",
      },
    },
    React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, o.label),
    chosen || multi ? React.createElement(Check, { size: 14, color: chosen ? c.accent : "transparent", "aria-hidden": true, style: { flexShrink: 0 } }) : null,
  );

const SearchableSelect = ({ options, value, onChange, style, placeholder = "Select..." }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const ref = React.useRef(null);
  const panel = React.useRef(null);
  const listId = React.useRef("llqa-list-" + ++llqaFloatSeq).current;
  llqaUseDismiss(open, setOpen, [ref, panel]);
  const all = options || [];
  const filtered = all.filter((o) => String(o.label).toLowerCase().includes(q.toLowerCase()));
  const selectedOpt = all.find((o) => String(o.value) === String(value));
  const show = () => {
    setQ("");
    const i = all.findIndex((o) => String(o.value) === String(value));
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };
  const pick = (o) => {
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };
  React.useEffect(() => {
    if (open) llqaKeepInView(panel, active);
  }, [open, active, q]);
  const keys = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(filtered[active]); }
    else if (e.key === "Tab") setOpen(false);
  };
  return React.createElement(
    "div",
    { ref, onClick: (e) => e.stopPropagation(), style: { position: "relative", ...style } },
    React.createElement(
      "div",
      {
        role: "combobox",
        tabIndex: 0,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-controls": open ? listId : undefined,
        onClick: () => (open ? setOpen(false) : show()),
        onKeyDown: (e) => {
          if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            show();
          }
        },
        style: {
          padding: "8px 12px",
          background: c.bgInput,
          border: "1px solid " + (open ? c.accent : c.border),
          boxShadow: open ? "0 0 0 3px " + c.accentRing : "none",
          borderRadius: 7,
          color: selectedOpt ? c.text : c.textSec,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minHeight: 34,
          boxSizing: "border-box",
          outline: "none",
        },
      },
      React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, selectedOpt ? selectedOpt.label : placeholder),
      React.createElement(ChevronDown, { size: 14, color: c.textSec, style: { flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" } }),
    ),
    React.createElement(
      LLQAFloat,
      { anchor: ref, open, onClose: () => setOpen(false), panelRef: panel, maxHeight: 350, id: listId, role: "listbox", style: { padding: 0 }, onClick: (e) => e.stopPropagation() },
      React.createElement("input", {
        autoFocus: true,
        value: q,
        onChange: (e) => {
          setQ(e.target.value);
          setActive(0);
        },
        onKeyDown: keys,
        placeholder: "Search...",
        "aria-label": "Search the list",
        style: {
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          border: "none",
          borderBottom: "1px solid " + c.border,
          background: c.bgInput,
          color: c.text,
          fontSize: 12,
          outline: "none",
          position: "sticky",
          top: 0,
          zIndex: 1,
        },
      }),
      filtered.length === 0
        ? React.createElement("div", { style: { padding: 12, color: c.textSec, fontSize: 12, textAlign: "center" } }, "No match for “" + q + "”")
        : filtered.map((o, i) =>
            llqaOptionRow(o, i, { listId, active: i === active, chosen: String(o.value) === String(value), onPick: pick, onHover: setActive }),
          ),
    ),
  );
};

const CustomSelect = ({ options, value, onChange, style, placeholder = "Select...", clearable = true, title }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = React.useRef(null);
  const field = React.useRef(null);
  const panel = React.useRef(null);
  const listId = React.useRef("llqa-list-" + ++llqaFloatSeq).current;
  llqaUseDismiss(open, setOpen, [ref, panel]);
  const normalizedOptions = (options || []).map((o) => (typeof o === "object" ? o : { label: String(o), value: String(o) }));
  const selectedOpt = normalizedOptions.find((o) => String(o.value) === String(value));
  // the list: the placeholder first (it clears the choice, as before) — unless the field has its own options only
  const items = (clearable ? [{ label: placeholder, value: "", clear: true }] : []).concat(normalizedOptions);
  const chosenAt = Math.max(0, items.findIndex((o) => !o.clear && String(o.value) === String(value)));
  const show = () => {
    setActive(chosenAt >= 0 ? chosenAt : 0);
    setOpen(true);
  };
  const pick = (o) => {
    if (!o || o.disabled) return;
    onChange(o.clear ? "" : o.value);
    setOpen(false);
    if (field.current) field.current.focus();
  };
  const move = (d) =>
    setActive((a) => {
      let i = a;
      for (let n = 0; n < items.length; n++) {
        i = (i + d + items.length) % items.length;
        if (!items[i].disabled) break;
      }
      return i;
    });
  React.useEffect(() => {
    if (open) llqaKeepInView(panel, active);
  }, [open, active]);
  const keys = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(items.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(items[active]); }
    else if (e.key === "Tab") setOpen(false);
  };
  // v68: layout props size the box, look props style the control (was: a box inside a box)
  const _lay = {}, _look = {};
  Object.keys(style || {}).forEach((k) => {
    (/^(width|minWidth|maxWidth|flex|flexBasis|flexGrow|flexShrink|margin|marginTop|marginBottom|marginLeft|marginRight|gridColumn|alignSelf|justifySelf)$/.test(k) ? _lay : _look)[k] = style[k];
  });
  delete _look.padding; // one control height everywhere
  return React.createElement(
    "div",
    {
      ref,
      title: title || undefined,
      onClick: (e) => e.stopPropagation(), // a list inside a clickable card or row opens the list, not the card
      style: { position: "relative", width: "auto", minWidth: 140, ..._lay },
    },
    React.createElement(
      "div",
      {
        ref: field,
        role: "combobox",
        tabIndex: 0,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-controls": open ? listId : undefined,
        "aria-activedescendant": open ? listId + "-" + active : undefined,
        onClick: () => (open ? setOpen(false) : show()),
        onKeyDown: keys,
        style: {
          padding: "8px 10px",
          background: c.bgInput,
          borderRadius: 6,
          fontSize: 12,
          ..._look,
          border: "1px solid " + (open ? c.accent : "var(--inputBorder)"),
          boxShadow: open ? "0 0 0 3px " + c.accentRing : "var(--inputShadow)",
          color: value ? _look.color || c.text : c.textSec,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minHeight: 34,
          boxSizing: "border-box",
          outline: "none",
        },
      },
      React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, selectedOpt ? selectedOpt.label : placeholder),
      React.createElement(ChevronDown, { size: 14, color: c.textSec, style: { flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" } }),
    ),
    React.createElement(
      LLQAFloat,
      { anchor: ref, open, onClose: () => setOpen(false), panelRef: panel, maxHeight: 280, id: listId, role: "listbox", onClick: (e) => e.stopPropagation() },
      items.map((o, i) =>
        llqaOptionRow(o, i, { listId, active: i === active, chosen: !o.clear && String(o.value) === String(value), muted: o.clear, onPick: pick, onHover: setActive }),
      ),
    ),
  );
};

// A list written like a browser <select> (with <option> children), drawn as the CRM's own list.
// v70: exactly the options it was given (no extra "Select..." row that blanked a setting or a filter),
// disabled options stay disabled, and asString gives the value back as text, like a <select> does.
const NativeSelectWrapper = ({ children, onChange, asString, ...props }) => {
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
            value: child.props.value !== undefined ? child.props.value : typeof label === "string" ? label : "", // v68
            label: label || child.props.value || "",
            disabled: !!child.props.disabled,
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  const handleChange = (val) => {
    if (onChange) onChange({ target: { value: asString ? String(val == null ? "" : val) : val } }); // like a <select> change event
  };
  return React.createElement(CustomSelect, { ...props, clearable: false, options: finalOptions, onChange: handleChange });
};
// v70: every browser <select> in the CRM now uses this (one look, one behaviour, never cut off)
const LLQASelect = (props) => React.createElement(NativeSelectWrapper, { ...props, asString: true });

// v70: the multi-choice list opens in the same top layer as every other list (it was cut by its pop-up window)
const CustomMultiSelect = ({ options, value, onChange, label, placeholder = "Select..." }) => {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const ref = React.useRef(null);
  const field = React.useRef(null);
  const panel = React.useRef(null);
  const listId = React.useRef("llqa-list-" + ++llqaFloatSeq).current;
  llqaUseDismiss(open, setOpen, [ref, panel]);
  const selectedVals = Array.isArray(value) ? value : [];
  const list = (options || []).map((o) => (typeof o === "object" ? o : { label: String(o), value: o }));
  const toggleVal = (v) => {
    if (selectedVals.includes(v)) onChange(selectedVals.filter((x) => x !== v));
    else onChange([...selectedVals, v]);
  };
  React.useEffect(() => {
    if (open) llqaKeepInView(panel, active);
  }, [open, active]);
  const keys = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setActive(0);
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(list.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (list[active]) toggleVal(list[active].value); }
    else if (e.key === "Tab") setOpen(false);
  };
  return React.createElement(
    "div",
    { style: { marginBottom: 12, position: "relative" }, ref },
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
        ref: field,
        role: "combobox",
        tabIndex: 0,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-controls": open ? listId : undefined,
        "aria-label": typeof label === "string" ? label : undefined,
        onClick: () => {
          if (!open) setActive(0);
          setOpen(!open);
        },
        onKeyDown: keys,
        style: {
          padding: "8px 10px",
          background: c.bgInput,
          border: "1px solid " + (open ? c.accent : c.border),
          boxShadow: open ? "0 0 0 3px " + c.accentRing : "none",
          borderRadius: 6,
          color: selectedVals.length > 0 ? c.text : c.textSec,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minHeight: 34,
          boxSizing: "border-box",
          outline: "none",
        },
      },
      React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, selectedVals.length > 0 ? selectedVals.join(", ") : placeholder),
      React.createElement(ChevronDown, { size: 14, color: c.textSec, style: { flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" } }),
    ),
    React.createElement(
      LLQAFloat,
      { anchor: field, open, onClose: () => setOpen(false), panelRef: panel, maxHeight: 240, id: listId, role: "listbox", "aria-multiselectable": true },
      list.map((o, i) =>
        llqaOptionRow(o, i, { listId, active: i === active, chosen: selectedVals.includes(o.value), multi: true, onPick: (x) => toggleVal(x.value), onHover: setActive }),
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
  // v67.2: the same place is asked for thousands of times a screen — remembered
  const tzMemo = new Map();
  const timezoneFor = (country, state) => {
    const k = String(country == null ? "" : country) + "|" + String(state == null ? "" : state);
    let v = tzMemo.get(k);
    if (v === undefined) {
      if (tzMemo.size > 5000) tzMemo.clear();
      v = timezoneForRaw(country, state);
      tzMemo.set(k, v);
    }
    return v;
  };
  const timezoneForRaw = (country, state) => {
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
    // v66.2: places that stopped changing clocks after older browsers' data was made
    const fx = typeof llqaTzFixed === "function" ? llqaTzFixed(tz, t) : null;
    if (fx !== null) return fx;
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
  const fmt12Memo = new Map();
  const fmt12 = (slot) => {
    const k = String(slot);
    let v = fmt12Memo.get(k);
    if (v === undefined) {
      if (fmt12Memo.size > 5000) fmt12Memo.clear();
      v = fmt12Raw(slot);
      fmt12Memo.set(k, v);
    }
    return v;
  };
  const fmt12Raw = (slot) => {
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
  // own (optional): the student being rescheduled — their own classes count
  // as free so they can keep or move them.
  const slotInfo = (t, day, slot, own) => {
    if (!t) return { state: "noteacher" };
    if (!isActive(t)) return { state: "inactive" };
    if (!inShift(t, day, slot)) return { state: "offshift" };
    const v = rawCell(t, day, slot);
    if (v === undefined || v === null || v === "" || v === "F")
      return { state: "free" };
    if (typeof v === "object" && v.s)
      return own && sameStudent(v, own)
        ? { state: "free", own: true, cell: v }
        : { state: "booked", who: v.s, cell: v };
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
          (it) => slotInfo(t, it.rowDay, it.slot, o.own).state === "free",
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
  const plan = ({ rows, country, state, teachers, isQuran, master, own }) => {
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
      const info = slotInfo(t, pk.rowDay, pk.slot, own);
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
          gender: stu.gender || c.cell.gender || "Any",
          family: stu.family !== undefined ? stu.family : c.cell.family || "",
          sub:
            stu.course === "Subject"
              ? Array.isArray(stu.specificSubject) && stu.specificSubject.length
                ? stu.specificSubject.join(", ")
                : c.cell.sub || "Subject"
              : "",
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

  /* ---------- v65: reschedule, nearest free time, Pakistan day ---------- */
  // Move a student's classes in one step: free the old cells, book the new
  // ones. All-or-nothing; a class that stays on the same cell keeps its flags.
  const rebook = (teachers, oldCells, items, stu) => {
    const freed = release(teachers, oldCells);
    const res = book(freed, items, stu);
    if (!res.ok) return { ok: false, problems: res.problems, teachers };
    const kept = {};
    (oldCells || []).forEach((c) => {
      kept[c.teacherId + "|" + c.day + "|" + c.slot] = c.cell;
    });
    const next = res.teachers.map((t) => {
      const mine = (items || []).filter((it) => it.teacherId === t.id && kept[t.id + "|" + it.rowDay + "|" + it.slot]);
      if (!mine.length) return t;
      const sch = copy(t._ttSchedule);
      mine.forEach((it) => {
        const old = kept[t.id + "|" + it.rowDay + "|" + it.slot];
        sch[it.rowDay][it.slot] = { ...old, ...sch[it.rowDay][it.slot], f: Array.isArray(old.f) ? old.f : [] };
      });
      return { ...t, _ttSchedule: sch };
    });
    const key = (x) => x.teacherId + "|" + (x.rowDay || x.day) + "|" + x.slot;
    const newKeys = new Set((items || []).map(key));
    const oldKeys = new Set((oldCells || []).map(key));
    return {
      ok: true,
      problems: [],
      teachers: next,
      freed: (oldCells || []).filter((c) => !newKeys.has(key(c))),
      added: (items || []).filter((it) => !oldKeys.has(key(it))),
    };
  };
  // Closest free class times to a wanted day + time (the family's clock):
  // same day first (±30 min steps), then the same time on other days.
  // filter(t) limits teachers; fixed = one teacher only; avoid = [{day,time}].
  const nearestFree = ({ day, time, tz, teachers, filter, own, fixed, take, avoid, maxMinutes }) => {
    const out = [];
    const p = parseUSTime(time);
    if (!tz || !p || DAYS.indexOf(day) < 0) return out;
    const max = maxMinutes || 180;
    const n = take || 6;
    const base = p.hour * 60 + p.minute;
    const tmOf = (min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      let dh = h % 12;
      if (dh === 0) dh = 12;
      return pad(dh) + pad(m) + " " + (h >= 12 ? "PM" : "AM");
    };
    const cands = [];
    for (let d = 30; d <= max; d += 30)
      [base + d, base - d].forEach((min) => {
        if (min >= 0 && min < 1440) cands.push({ day, time: tmOf(min), delta: min - base });
      });
    for (let k = 1; k < 7; k++) cands.push({ day: DAYS[(DAYS.indexOf(day) + k) % 7], time: tmOf(base), delta: 0, other: true });
    const pool = (teachers || []).filter((t) => isActive(t) && (!filter || filter(t)) && (!fixed || t.name === fixed));
    for (const cd of cands) {
      if (out.length >= n) break;
      if ((avoid || []).some((a) => a && a.day === cd.day && a.time === cd.time)) continue;
      const pk = toPkt(cd.day, cd.time, tz);
      if (!pk) continue;
      const free = pool
        .filter((t) => slotInfo(t, pk.rowDay, pk.slot, own).state === "free")
        .map((t) => ({ t, load: countLoad(t) }))
        .sort((a, b) => a.load.booked - b.load.booked || String(a.t.name).localeCompare(String(b.t.name)));
      if (free.length) out.push({ ...cd, pk, teacher: free[0].t.name, teachers: free.map((x) => x.t.name) });
    }
    return out;
  };
  // The Pakistan weekday a booked class happens on, and the family's clock
  // time for it on a given date. Timetable rows follow the family's day, so
  // a night slot is the next morning in Pakistan.
  const pktDayOf = (rowDay, slot, tz, ref) => {
    const [h, m] = String(slot || "").split(":").map(Number);
    if (isNaN(h)) return { pktDay: rowDay, shift: 0, famTime: "" };
    if (!tz) return { pktDay: rowDay, shift: 0, famTime: "" };
    const r = ref || new Date();
    const diff = offsetAt("Asia/Karachi", r) - offsetAt(tz, r);
    const famMin = h * 60 + (m || 0) - diff;
    const shift = famMin < 0 ? 1 : famMin >= 1440 ? -1 : 0;
    const fam = ((famMin % 1440) + 1440) % 1440;
    return {
      pktDay: DAYS[(((DAYS.indexOf(rowDay) + shift) % 7) + 7) % 7],
      shift,
      famTime: fmt12(pad(Math.floor(fam / 60)) + ":" + pad(fam % 60)),
    };
  };
  return {
    DAYS, TIMES, timezoneFor, toPkt, pktOptions, pktLabel, fmt12, timeLabel, clockChange,
    shiftsOf, slotInfo, reasonText, countLoad, rankTeachers,
    sameStudent, studentCells, cellsText, plan, book, release, updateCells,
    nextStudentId, newParentId, scheduleOf, health, healthFor, applyFixes, bookingSummary,
    offsetAt, indexCells, cellsFromIndex,
    rebook, nearestFree, pktDayOf, isActive, eachBooked, rawCell,
  };
})();


/* ============================================================
   v64.5 — every saved student field on the view screens, one
   trial rule for the whole CRM, and "Log Today's Class" from
   the Timetable.
   ============================================================ */
// On trial: Fee Status "trial" or Class Type "Trial" (until paid).
const llqaInTrial = (s) => !!s && (s.fee === "trial" || s.classType === "Trial");
const llqaSubjects = (s) =>
  Array.isArray(s && s.specificSubject)
    ? s.specificSubject.filter(Boolean).join(", ")
    : String((s && s.specificSubject) || "");
const llqaZoneLabel = (tz) => (tz ? String(tz).split("/").pop().replace(/_/g, " ") : "");
// "Mon|0500 PM, Wed|0500 PM" → "Mon 05:00 PM, Wed 05:00 PM" (display only)
const llqaTimeText = (t) =>
  String(t || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const i = x.indexOf("|");
      const d = i >= 0 ? x.slice(0, i).trim() : "";
      const tm = i >= 0 ? x.slice(i + 1).trim() : x;
      return (d ? d + " " : "") + LLQABooking.timeLabel(tm);
    })
    .join(", ");

// Every class of a student: the student's day + local time → the booked
// Pakistan slot + teacher.
const llqaClasses = (s) => {
  if (!s) return [];
  const B = LLQABooking;
  const tz = s.tz || B.timezoneFor(s.country, s.state);
  const saved = Array.isArray(s.schedule) ? s.schedule : [];
  return B.scheduleOf(s).map((r) => {
    const hit = saved.find((x) => x && x.day === r.day && x.time === r.time);
    let pkt = "";
    if (hit && hit.pktSlot)
      pkt = B.fmt12(hit.pktSlot) + " PKT" + (hit.pktDay && hit.pktDay !== r.day ? " (" + hit.pktDay + ")" : "");
    else if (r.day && tz) {
      const pk = B.toPkt(r.day, r.time, tz);
      if (pk) pkt = B.fmt12(pk.slot) + " PKT" + (pk.pktDay !== r.day ? " (" + pk.pktDay + ")" : "");
    }
    return { day: r.day || "", local: B.timeLabel(r.time), pkt, teacher: r.teacher || s.teacher || "" };
  });
};

// [label, value] for every field the Add Student form saves (the name is the
// screen's title; withCode adds the Code where the title doesn't show it).
const llqaStudentRows = (s, withCode) => {
  if (!s) return [];
  const tz = s.tz || LLQABooking.timezoneFor(s.country, s.state);
  const fee = s.fee ? s.fee + (s.fee_amount ? " · " + s.fee_amount + " " + (s.currency || "") : "") : "";
  const n = llqaTrialDone(s); // v73: from the class records
  const trial = llqaInTrial(s)
    ? "Since " + (s.trialStart || s.dor || "?") + " · " + n + " of " + llqaTrialTarget(s) + " classes attended"
    : "";
  return [
    ...(withCode ? [["Code", s.code]] : []),
    ["Parent", s.parent],
    ["Family", s.family],
    ["Phone / WhatsApp", s.phone],
    ["Email", s.email],
    ["Age", s.age && s.age !== "0" ? s.age : ""],
    ["Gender", s.gender],
    ["Country", s.country],
    ["State / City", s.state],
    ["Time zone", llqaZoneLabel(tz)],
    ["Course", s.course],
    ["Subjects", llqaSubjects(s)],
    ["Class type", s.classType],
    ["Teacher", s.teacher],
    ["Hours / week", s.hoursPerWeek],
    ["Fee", fee],
    ["Trial", trial],
    ["Registered", s.dor],
    ["Referred by", s.referredBy],
    ["Parent Portal ID", s.parentId],
    ["Status", s.status],
    ["Attendance (30 days)", llqaPctText(llqaStuStats(s).last30.pct)], // v73: from the class records
  ].map(([l, v]) => [l, v === undefined || v === null || v === "" ? "—" : String(v)]);
};

const LLQAClassList = ({ s }) => {
  const rows = llqaClasses(s);
  return React.createElement(
    "div",
    { style: { marginBottom: 14 } },
    React.createElement(
      "div",
      {
        style: {
          color: c.textSec,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        },
      },
      "Classes (" + rows.length + ")",
    ),
    rows.length === 0
      ? React.createElement("div", { style: { color: c.textMuted, fontSize: 11 } }, "No class time saved yet.")
      : rows.map((r, i) =>
          React.createElement(
            "div",
            {
              key: i,
              style: {
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "6px 10px",
                background: c.bgDeep,
                borderRadius: 6,
                marginBottom: 4,
                fontSize: 12,
                color: c.text,
              },
            },
            React.createElement(
              "span",
              null,
              (r.day ? r.day + " · " : "") + r.local + (r.pkt ? "  →  " + r.pkt : ""),
            ),
            React.createElement("span", { style: { color: c.textSec } }, r.teacher || "—"),
          ),
        ),
  );
};

// Notes / Special Requirements, full width (Sales view).
const LLQANotes = ({ s }) =>
  s && String(s.notes || "").trim()
    ? React.createElement(
        "div",
        { style: { background: c.bgDeep, borderRadius: 8, padding: "10px 12px", marginBottom: 16 } },
        React.createElement(
          "div",
          {
            style: {
              color: c.textSec,
              fontSize: 9,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 3,
            },
          },
          "Notes / Special Requirements",
        ),
        React.createElement(
          "div",
          { style: { color: c.text, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" } },
          String(s.notes),
        ),
      )
    : null;

// Full details block for the Students view (its title shows the name and
// its Notes box the notes; the Code is shown here).
const LLQAStudentAllDetails = ({ s }) =>
  React.createElement(
    "div",
    { style: { marginBottom: 14 } },
    React.createElement(
      "h4",
      { style: { color: c.text, fontSize: 12, margin: "0 0 8px", fontWeight: 600 } },
      "All details",
    ),
    React.createElement(
      "div",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 } },
      llqaStudentRows(s, true).map(([l, v]) =>
        React.createElement(
          "div",
          { key: l, style: { background: c.bgDeep, borderRadius: 6, padding: "6px 8px" } },
          React.createElement(
            "div",
            { style: { color: c.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 } },
            l,
          ),
          React.createElement(
            "div",
            { style: { color: c.text, fontSize: 12, fontWeight: 600, wordBreak: "break-word" } },
            v,
          ),
        ),
      ),
    ),
    React.createElement(LLQAClassList, { s }),
  );

// One class per student per day — the same rule as the daily progress
// record. Logging a day again (from the Timetable, Log Progress or the
// quick Present/Absent buttons) corrects the counters instead of counting
// the class twice. The trial rule (3 classes) depends on this count.
const llqaCountClass = (s, dailyProgress, date, att) => {
  const earlier =
    (dailyProgress || []).find((p) => String(p.studentId) === String(s.id) && p.date === date) || null;
  const isP = /^(present|late)$/i.test(String(att || ""));
  const prevP = !!earlier && /^(present|late)$/i.test(String(earlier.attended || ""));
  const attended = Math.max(0, (parseInt(s.attended, 10) || 0) + (isP ? 1 : 0) - (prevP ? 1 : 0));
  const totalClasses = (parseInt(s.totalClasses, 10) || 0) + (earlier ? 0 : 1);
  return {
    earlier,
    attended,
    totalClasses,
    attendance: totalClasses ? Math.round((attended / totalClasses) * 100) : s.attendance,
  };
};

// Logs one class from the Timetable: the same progress record and student
// fields as the Students module's Log Progress.
const llqaLogClass = ({ students, setStudents, dailyProgress, setDailyProgress, studentId, teacherName, teacherId, form, date, slot, rowDay }) =>
  llqaClassSave({
    students,
    setStudents,
    dp: dailyProgress,
    setDailyProgress,
    studentId,
    teacherName,
    teacherId,
    slot,
    rowDay,
    date: date && date <= todayPK() ? date : todayPK(), // a past day can be logged (never a future one)
    form: form || {},
    source: "timetable",
  });

