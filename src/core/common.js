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
  for (const k in STATE_TZ) {
    if (s.includes(k)) return STATE_TZ[k];
  }
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

const useFirestoreCollection = (collectionName, fallbackData = []) => {
  const [data, setData] = useState(() => lsRead(collectionName, fallbackData));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!initFirebase()) {
      setLoading(false);
      return;
    }
    const unsub = fb.db.collection(collectionName).onSnapshot(
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        if (docs.length === 0 && fallbackData.length > 0) {
          fallbackData.forEach((item) => {
            fb.db
              .collection(collectionName)
              .doc(String(item.id))
              .set(item)
              .catch(() => {});
          });
          setData(fallbackData);
          lsWrite(collectionName, fallbackData);
        } else {
          setData(docs);
          lsWrite(collectionName, docs);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [collectionName]);
  const setRemote = useMemo(
    () => async (newDataOrFn) => {
      const newData =
        typeof newDataOrFn === "function" ? newDataOrFn(data) : newDataOrFn;
      setData(newData);
      lsWrite(collectionName, newData);
      if (!fb.ready) return;
      const batch = fb.db.batch();
      newData.forEach((item) => {
        const ref = fb.db.collection(collectionName).doc(String(item.id));
        batch.set(ref, item, {
          merge: true,
        });
      });
      const newIds = new Set(newData.map((i) => String(i.id)));
      data.forEach((old) => {
        if (!newIds.has(String(old.id))) {
          batch.delete(fb.db.collection(collectionName).doc(String(old.id)));
        }
      });
      await batch.commit().catch((e) => console.error("Batch write:", e));
    },
    [data, collectionName],
  );
  return [data, setRemote, loading, error];
};

const LS_KEY = "llqa_crm_v1::";

const lsRead = (k, fb) => {
  try {
    const r = localStorage.getItem(LS_KEY + k);
    return r ? JSON.parse(r) : fb;
  } catch (e) {
    return fb;
  }
};

const lsWrite = (k, v) => {
  try {
    localStorage.setItem(LS_KEY + k, JSON.stringify(v));
  } catch (e) {
    console.warn("localStorage write failed for " + k + ":", e.message);
  }
};

const useFirestoreDoc = (path, fallbackData = {}) => {
  const [data, setData] = useState(() => lsRead(path, fallbackData));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!initFirebase()) {
      setLoading(false);
      return;
    }
    const [coll, docId] = path.split("/");
    const unsub = fb.db
      .collection(coll)
      .doc(docId)
      .onSnapshot((snap) => {
        if (snap.exists) {
          setData(snap.data());
          lsWrite(path, snap.data());
        } else if (Object.keys(fallbackData).length > 0) {
          fb.db
            .collection(coll)
            .doc(docId)
            .set(fallbackData)
            .catch(() => {});
          setData(fallbackData);
          lsWrite(path, fallbackData);
        }
        setLoading(false);
      });
    return () => unsub();
  }, [path]);
  const setRemote = useMemo(
    () => async (newDataOrFn) => {
      const newData =
        typeof newDataOrFn === "function" ? newDataOrFn(data) : newDataOrFn;
      setData(newData);
      lsWrite(path, newData);
      if (!fb.ready) return;
      const [coll, docId] = path.split("/");
      await fb.db
        .collection(coll)
        .doc(docId)
        .set(newData, {
          merge: true,
        })
        .catch((e) => console.error(e));
    },
    [data, path],
  );
  return [data, setRemote, loading];
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
  const [synced, setSynced] = useState(true);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return {
    online,
    fbReady: fb.ready,
    synced,
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
