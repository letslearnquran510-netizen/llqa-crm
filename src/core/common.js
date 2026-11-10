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
const llqaToPKR = (amount, cur, rates, received) => {
  const a = Number(amount) || 0;
  const cu = llqaCurOf(cur);
  if (cu === "PKR") return { pkr: a, how: "pkr", cur: cu };
  const got = Number(received);
  if (got > 0) return { pkr: got, how: "received", cur: cu };
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
    const x = llqaToPKR(a, cu, rates, p.received);
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
  (pays || []).map((p) => ({ ...p, amount: llqaToPKR(p.amount, p.currency || "USD", rates, p.pkrReceived).pkr, currency: "PKR" }));
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
  return { m: r.rateMin, a: r.rateAmt, g: r.grace, ab: r.absent, hd: r.halfDay, mc: r.missedClass, aw: r.away };
};
const llqaRecRules = (rec, settings) => {
  const f = rec && rec.fineSet;
  if (!f || typeof f !== "object") return settings;
  return { ...(settings || {}), fineLateMinutes: f.m, fineLateAmount: f.a, fineGraceMin: f.g, absentFine: f.ab, halfDayFine: f.hd, missedClassFine: f.mc, fineAway: f.aw !== false };
};
// one day's fine, worked out from the record — nothing here is guessed
const llqaDayFine = (rec, settings) => {
  const r = llqaFineRules(llqaRecRules(rec, settings));
  const reasons = (rec && rec.reasons) || {};
  const waived = (k) => !!(reasons[k] && reasons[k].decision === "waive");
  const st = String((rec && rec.status) || "");
  const out = { late: null, early: null, away: null, day: null, total: 0, rule: llqaRuleText(r), off: rec && rec.offDay ? String(rec.offDay) : "" };
  if (out.off) return out; // a day off (not a working day / holiday): never fined
  if (st === "Absent") out.day = { kind: "Absent", amount: waived("day") ? 0 : r.absent, full: r.absent, waived: waived("day") };
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
    row("Absent (a day)", "", llqaNumInput(r.absent, (v) => update("absentFine", v), "Absent fine", 90), "abs"),
    row("Half Day", "", llqaNumInput(r.halfDay, (v) => update("halfDayFine", v), "Half day fine", 90), "half"),
    row("Missed Class", "", llqaNumInput(r.missedClass, (v) => update("missedClassFine", v), "Missed class fine", 90), "miss"),
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
  return bits.join(" · ");
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
      if (!(d.day || d.late || d.early || d.away || h.unknownOut || Number(h.fine) > 0 || (h.fineOverride != null && h.fineOverride !== ""))) return;
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
  "Mark Late / Early Reasons": ["attendance"], // v72: mark a reason once, with Deduct or Don't deduct
  "Edit Fines": ["attendance"], // v72: change any fine or reason afterwards (always kept in the fine's history)
  "Set Office Times & Fines": ["attendance"], // v72: office times, the per-minute rate and the other fines
  "Mark Attendance": ["attendance"], // v72: mark days by hand, check out, correct a day (a teacher never marks their own)
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
  const n = s.attended || 0;
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
    ["Attendance", s.attendance != null && s.attendance !== "" ? s.attendance + "%" : ""],
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
const llqaLogClass = ({ students, setStudents, dailyProgress, setDailyProgress, studentId, teacherName, form, date }) => {
  const stu = (students || []).find((x) => String(x.id) === String(studentId));
  if (!stu) return "This booking is not linked to a student record, so the class can't be logged.";
  if (!form || !String(form.lesson || "").trim()) return "Please write today's lesson.";
  // v65: a past day can be logged from Today's Classes (never a future one)
  const dt = date && date <= todayPK() ? date : todayPK();
  const att = String(form.attended || "Present");
  const cnt = llqaCountClass(stu, dailyProgress, dt, att);
  if (typeof llqaAfterCount === "function" && llqaCanManage()) llqaAfterCount(stu, cnt);
  const earlier = cnt.earlier;
  const pageN = parseInt(form.pages, 10);
  const note = String(form.notes || "").trim();
  setStudents(
    (students || []).map((x) => {
      if (String(x.id) !== String(stu.id)) return x;
      // an older day (logged late) updates the counts, not the latest lesson
      const latest = !x.lastDate || dt >= x.lastDate;
      return {
        ...x,
        lastLesson: latest ? form.lesson : x.lastLesson,
        lastDate: latest ? dt : x.lastDate,
        page: latest && pageN > 0 ? pageN : x.page,
        qaida: latest && x.qaida > 0 && pageN > 0 ? pageN : x.qaida,
        attended: cnt.attended,
        totalClasses: cnt.totalClasses,
        attendance: cnt.attendance,
        lB: latest ? form.behavior || x.lB : x.lB,
        lP: latest ? form.performance || x.lP : x.lP,
        lH: latest ? form.homework || x.lH : x.lH,
        lR: latest ? form.recitation || x.lR : x.lR,
        lT: latest ? form.tajweed || x.lT : x.lT,
        // class notes are added to the student's notes, as Log Progress does
        // (not again when the same note is saved twice on one day)
        notes:
          note && !(earlier && String(earlier.notes || "").trim() === note)
            ? x.notes
              ? x.notes + " | " + note
              : note
            : x.notes,
      };
    }),
  );
  if (typeof setDailyProgress === "function")
    setDailyProgress((prev) => {
      const list = prev || [];
      const idx = list.findIndex((p) => String(p.studentId) === String(stu.id) && p.date === dt);
      const entry = {
        id: idx >= 0 ? list[idx].id : "dp_" + dt + "_" + stu.id + "_" + Date.now(),
        studentId: stu.id,
        date: dt,
        attended: att.toLowerCase(),
        lesson: form.lesson || "",
        pages: form.pages || "",
        behavior: form.behavior || "",
        performance: form.performance || "",
        homework: form.homework || "",
        recitation: form.recitation || "",
        tajweed: form.tajweed || "",
        notes: form.notes || "",
        teacherName: teacherName || stu.teacher || "",
        source: "timetable",
        createdAt: idx >= 0 ? list[idx].createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...next[idx], ...entry };
        return next;
      }
      return [...list, entry];
    });
  return "";
};

const LLQALogClassModal = ({ info, form, setForm, students, dailyProgress, onClose, onSave }) => {
  const stu = (students || []).find((x) => String(x.id) === String(info.studentId));
  const set = (k, v) => setForm({ ...form, [k]: v });
  const cap = (v) => String(v || "").replace(/^./, (m) => m.toUpperCase());
  const earlier =
    stu && (dailyProgress || []).find((p) => String(p.studentId) === String(stu.id) && p.date === (info.date || todayPK()));
  const n = (stu && stu.attended) || 0;
  // Which class: the family's day + time as booked, and the Pakistan slot.
  // (Timetable rows follow the family's day; a night slot is the next
  // morning in Pakistan, so no Pakistan weekday is claimed here.)
  const cl = info.cell || {};
  const famTime = String(cl.t || "").replace(/\s+(USA|CA)$/i, "").trim();
  const famDay = cl.day || info.day || "";
  const which = [
    famDay ? famDay + (famTime ? " " + LLQABooking.timeLabel(famTime) + " family time" : " class") : "",
    info.slot ? LLQABooking.fmt12(info.slot) + " PKT slot" : "",
  ]
    .filter(Boolean)
    .join(" → ");
  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1100,
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
          width: 480,
          maxWidth: "94vw",
          maxHeight: "90vh",
          overflowY: "auto",
        },
      },
      React.createElement(
        "h3",
        { style: { color: c.text, fontSize: 16, margin: "0 0 4px" } },
        llqaLabel("✍ Log today's class — " + (info.studentName || "?")),
      ),
      React.createElement(
        "div",
        { style: { color: c.textSec, fontSize: 11, marginBottom: 12 } },
        [info.teacherName || "", which, "logged for " + (info.date || todayPK())].filter(Boolean).join(" · "),
      ),
      !stu &&
        React.createElement(
          "div",
          {
            style: {
              padding: "8px 10px",
              background: c.warnBg,
              color: c.warn,
              borderRadius: 8,
              fontSize: 11,
              marginBottom: 12,
            },
          },
          "This booking is not linked to a student record, so the class can't be logged. Add the student in Sales or Students first.",
        ),
      stu &&
        llqaInTrial(stu) &&
        React.createElement(
          "div",
          {
            style: {
              padding: "8px 10px",
              background: c.accentBg,
              color: c.accent,
              borderRadius: 8,
              fontSize: 11,
              marginBottom: 12,
            },
          },
          "Trial student · " + n + " of " + llqaTrialTarget(stu) + " classes attended so far" + (n >= llqaTrialTarget(stu) ? " — trial done, fee due" : ""),
        ),
      earlier &&
        React.createElement(
          "div",
          { style: { color: c.textMuted, fontSize: 11, marginBottom: 10 } },
          "Already logged today — saving updates that entry (the class is not counted twice).",
        ),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" } },
        React.createElement(Inp, { label: "Attendance", value: cap(form.attended || "Present"), onChange: (v) => set("attended", v), options: ATT_OPTS }),
        React.createElement(Inp, { label: "Page reached", value: form.pages || "", onChange: (v) => set("pages", v), placeholder: "e.g. 24" }),
      ),
      React.createElement(Inp, { label: "Today's lesson *", value: form.lesson || "", onChange: (v) => set("lesson", v), placeholder: "What was taught today" }),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px" } },
        React.createElement(Inp, { label: "Behavior", value: form.behavior || "", onChange: (v) => set("behavior", v), options: BEHAV_OPTS }),
        React.createElement(Inp, { label: "Performance", value: form.performance || "", onChange: (v) => set("performance", v), options: PERF_OPTS }),
        React.createElement(Inp, { label: "Homework", value: form.homework || "", onChange: (v) => set("homework", v), options: HW_OPTS }),
      ),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" } },
        React.createElement(Inp, { label: "Recitation", value: form.recitation || "", onChange: (v) => set("recitation", v), options: RECIT_OPTS }),
        React.createElement(Inp, { label: "Tajweed", value: form.tajweed || "", onChange: (v) => set("tajweed", v), options: TAJ_OPTS }),
      ),
      React.createElement(Inp, { label: "Notes", value: form.notes || "", onChange: (v) => set("notes", v), placeholder: "Optional" }),
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 } },
        React.createElement(Btn, { variant: "outline", onClick: onClose }, "Cancel"),
        stu && React.createElement(Btn, { icon: CheckCircle, onClick: onSave }, "Save class"),
      ),
    ),
  );
};
