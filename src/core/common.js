const {
  useState,
  useMemo,
  useEffect
} = React;

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
  Area
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
  saskatchewan: "America/Regina"
};

const COUNTRY_STATES = {
  USA: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "Washington DC", "West Virginia", "Wisconsin", "Wyoming"],
  Canada: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"],
  UK: ["England", "Scotland", "Wales", "Northern Ireland", "London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Glasgow", "Edinburgh", "Bristol", "Sheffield", "Cardiff", "Belfast"],
  UAE: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
  Australia: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"],
  Other: []
};

const detectTZ = (stateOrLoc, timeStr) => {
  const s = String(stateOrLoc || "").toLowerCase().trim();
  for (const k in STATE_TZ) {
    if (s.includes(k)) return STATE_TZ[k];
  }
  const t = String(timeStr || "").toLowerCase();
  if (/\b(ca|cst|cdt)\b/.test(t) && !/usa/.test(t)) return "America/Toronto";
  if (/\busa\b|\b(am|pm)\b/.test(t)) return "America/New_York";
  return null;
};

const parseUSTime = timeStr => {
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
  if (per === "PM" && h !== 12) h += 12;else if (per === "AM" && h === 12) h = 0;
  return {
    hour: h,
    minute: mn
  };
};

const tzOffsetMinutes = (tz, refDate) => {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset"
    });
    const parts = fmt.formatToParts(refDate);
    const tzn = parts.find(p => p.type === "timeZoneName")?.value || "";
    const m = tzn.match(/GMT([+-]\d+)(?::(\d+))?/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + (m[1].startsWith("-") ? -1 : 1) * parseInt(m[2] || "0", 10);
  } catch (e) {
    return 0;
  }
};

const escHTML = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[c]);

const todayPK = d => {
  const t = d || new Date();
  try {
    return t.toLocaleDateString("en-CA", {
      timeZone: "Asia/Karachi"
    });
  } catch (e) {
    return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
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
    let wrapped = (totalMin % 1440 + 1440) % 1440;
    const ph = Math.floor(wrapped / 60),
      pm = wrapped % 60;
    const period = ph >= 12 ? "PM" : "AM";
    let dh = ph % 12;
    if (dh === 0) dh = 12;
    const dayLabel = dayShift === 1 ? " (+1d)" : dayShift === -1 ? " (prev)" : dayShift > 1 ? " (+" + dayShift + "d)" : "";
    return dh + ":" + String(pm).padStart(2, "0") + " " + period + dayLabel;
  } catch (e) {
    return null;
  }
};

const to12h = s => {
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

const makeIcon = kebabName => {
  const svgInner = window.__ICONS__[kebabName] || '<rect x="4" y="4" width="16" height="16"/>';
  return ({
    size = 16,
    color = "currentColor",
    style,
    ...props
  }) => React.createElement("svg", {
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
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: svgInner
    },
    ...props
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
  ready: false
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
    const unsub = fb.db.collection(collectionName).onSnapshot(snap => {
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      if (docs.length === 0 && fallbackData.length > 0) {
        fallbackData.forEach(item => {
          fb.db.collection(collectionName).doc(String(item.id)).set(item).catch(() => {});
        });
        setData(fallbackData);
        lsWrite(collectionName, fallbackData);
      } else {
        setData(docs);
        lsWrite(collectionName, docs);
      }
      setLoading(false);
    }, err => {
      console.error("Firestore error:", err);
      setError(err);
      setLoading(false);
    });
    return () => unsub();
  }, [collectionName]);
  const setRemote = useMemo(() => async newDataOrFn => {
    const newData = typeof newDataOrFn === "function" ? newDataOrFn(data) : newDataOrFn;
    setData(newData);
    lsWrite(collectionName, newData);
    if (!fb.ready) return;
    const batch = fb.db.batch();
    newData.forEach(item => {
      const ref = fb.db.collection(collectionName).doc(String(item.id));
      batch.set(ref, item, {
        merge: true
      });
    });
    const newIds = new Set(newData.map(i => String(i.id)));
    data.forEach(old => {
      if (!newIds.has(String(old.id))) {
        batch.delete(fb.db.collection(collectionName).doc(String(old.id)));
      }
    });
    await batch.commit().catch(e => console.error("Batch write:", e));
  }, [data, collectionName]);
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
    const unsub = fb.db.collection(coll).doc(docId).onSnapshot(snap => {
      if (snap.exists) {
        setData(snap.data());
        lsWrite(path, snap.data());
      } else if (Object.keys(fallbackData).length > 0) {
        fb.db.collection(coll).doc(docId).set(fallbackData).catch(() => {});
        setData(fallbackData);
        lsWrite(path, fallbackData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [path]);
  const setRemote = useMemo(() => async newDataOrFn => {
    const newData = typeof newDataOrFn === "function" ? newDataOrFn(data) : newDataOrFn;
    setData(newData);
    lsWrite(path, newData);
    if (!fb.ready) return;
    const [coll, docId] = path.split("/");
    await fb.db.collection(coll).doc(docId).set(newData, {
      merge: true
    }).catch(e => console.error(e));
  }, [data, path]);
  return [data, setRemote, loading];
};

const pushAuditLog = async entry => {
  if (!initFirebase()) {
    LOGIN_AUDIT.unshift({
      ...entry,
      id: Date.now()
    });
    return;
  }
  try {
    await fb.db.collection("loginAudit").add({
      ...entry,
      serverTime: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error("Audit log:", e);
  }
};

const useConnectionStatus = () => {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
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
    synced
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
  shadow3d: "var(--shadow3d)"
};

const CC = ["#4a7aff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#ec4899"];

const initTeachers = [{
  id: 1,
  sno: 1,
  name: "Hafiz Faizan Mughal",
  code: "0731",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-03-15",
  salary: 35000,
  phone: "+92 312 0731001",
  zoom: "https://zoom.us/j/8945120731",
  cnic: "37405-1234567-1",
  bank: "JazzCash",
  status: "active",
  students: 6,
  freeSlots: 10,
  totalSlots: 16,
  leaveBalance: 12,
  leaveTaken: 2,
  perfRating: 4.2,
  classCompletion: 96,
  studentSatisfaction: 92,
  attendanceRate: 98
}, {
  id: 2,
  sno: 2,
  name: "Hafiz Ali Saeed",
  code: "3186",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-06-20",
  salary: 32000,
  phone: "+92 333 3186002",
  zoom: "https://zoom.us/j/7712303186",
  cnic: "37405-2345678-2",
  bank: "EasyPaisa",
  status: "active",
  students: 5,
  freeSlots: 9,
  totalSlots: 16,
  leaveBalance: 10,
  leaveTaken: 4,
  perfRating: 3.8,
  classCompletion: 91,
  studentSatisfaction: 88,
  attendanceRate: 94
}, {
  id: 3,
  sno: 3,
  name: "Asim",
  code: "0341",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2022-11-01",
  salary: 38000,
  phone: "+92 300 0341003",
  zoom: "https://us05web.zoom.us/j/9023410034",
  cnic: "37405-3456789-3",
  bank: "HBL",
  status: "active",
  students: 7,
  freeSlots: 5,
  totalSlots: 16,
  leaveBalance: 8,
  leaveTaken: 6,
  perfRating: 4.0,
  classCompletion: 93,
  studentSatisfaction: 90,
  attendanceRate: 95
}, {
  id: 4,
  sno: 4,
  name: "Hafiz Amanullah",
  code: "0872",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-01-10",
  salary: 36000,
  phone: "+92 345 0872004",
  cnic: "37405-4567890-4",
  bank: "Meezan",
  status: "active",
  students: 8,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 11,
  leaveTaken: 3,
  perfRating: 4.5,
  classCompletion: 97,
  studentSatisfaction: 95,
  attendanceRate: 99
}, {
  id: 5,
  sno: 5,
  name: "Qari Faizan Khan",
  code: "6285",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2021-08-01",
  salary: 42000,
  phone: "+92 312 6285005",
  cnic: "37405-5678901-5",
  bank: "UBL",
  status: "active",
  students: 5,
  freeSlots: 6,
  totalSlots: 16,
  leaveBalance: 14,
  leaveTaken: 0,
  perfRating: 4.7,
  classCompletion: 99,
  studentSatisfaction: 97,
  attendanceRate: 100
}, {
  id: 6,
  sno: 6,
  name: "Farhan Awan",
  code: "0101",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2022-05-15",
  salary: 40000,
  phone: "+92 321 0101006",
  cnic: "37405-6789012-6",
  bank: "Meezan",
  status: "active",
  students: 9,
  freeSlots: 3,
  totalSlots: 16,
  leaveBalance: 9,
  leaveTaken: 5,
  perfRating: 4.1,
  classCompletion: 94,
  studentSatisfaction: 89,
  attendanceRate: 96
}, {
  id: 7,
  sno: 7,
  name: "Qari Haris Khan",
  code: "4459",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2022-12-01",
  salary: 37000,
  phone: "+92 333 4459007",
  cnic: "37405-7890123-7",
  bank: "HBL",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 10,
  leaveTaken: 4,
  perfRating: 4.3,
  classCompletion: 95,
  studentSatisfaction: 91,
  attendanceRate: 97
}, {
  id: 8,
  sno: 8,
  name: "Qari Hussnain",
  code: "0353",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2024-06-01",
  salary: 28000,
  phone: "+92 300 0353008",
  cnic: "37405-8901234-8",
  bank: "JazzCash",
  status: "active",
  students: 2,
  freeSlots: 14,
  totalSlots: 16,
  leaveBalance: 14,
  leaveTaken: 0,
  perfRating: 3.5,
  classCompletion: 85,
  studentSatisfaction: 82,
  attendanceRate: 92
}, {
  id: 9,
  sno: 9,
  name: "Qari Muhammad Nadeem",
  code: "7346",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2022-01-15",
  salary: 40000,
  phone: "+92 345 7346009",
  cnic: "37405-9012345-9",
  bank: "Meezan",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 7,
  leaveTaken: 7,
  perfRating: 4.4,
  classCompletion: 96,
  studentSatisfaction: 93,
  attendanceRate: 96
}, {
  id: 10,
  sno: 10,
  name: "Hafiz Osama",
  code: "5867",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-04-20",
  salary: 35000,
  phone: "+92 312 5867010",
  cnic: "37405-0123456-0",
  bank: "EasyPaisa",
  status: "active",
  students: 8,
  freeSlots: 4,
  totalSlots: 16,
  leaveBalance: 11,
  leaveTaken: 3,
  perfRating: 4.0,
  classCompletion: 92,
  studentSatisfaction: 88,
  attendanceRate: 95
}, {
  id: 11,
  sno: 11,
  name: "Saifullah",
  code: "1562",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2022-04-01",
  salary: 42000,
  phone: "+92 333 1562011",
  cnic: "37405-1234560-1",
  bank: "HBL",
  status: "active",
  students: 11,
  freeSlots: 1,
  totalSlots: 16,
  leaveBalance: 6,
  leaveTaken: 8,
  perfRating: 4.6,
  classCompletion: 98,
  studentSatisfaction: 94,
  attendanceRate: 97
}, {
  id: 12,
  sno: 12,
  name: "Hafiz Suleman",
  code: "7834",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-07-10",
  salary: 34000,
  phone: "+92 300 7834012",
  cnic: "37405-2345601-2",
  bank: "Meezan",
  status: "active",
  students: 7,
  freeSlots: 5,
  totalSlots: 16,
  leaveBalance: 12,
  leaveTaken: 2,
  perfRating: 3.9,
  classCompletion: 90,
  studentSatisfaction: 87,
  attendanceRate: 94
}, {
  id: 13,
  sno: 13,
  name: "Hafiz Tayyab",
  code: "0074",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2022-09-15",
  salary: 39000,
  phone: "+92 345 0074013",
  cnic: "37405-3456012-3",
  bank: "UBL",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 8,
  leaveTaken: 6,
  perfRating: 4.3,
  classCompletion: 95,
  studentSatisfaction: 92,
  attendanceRate: 96
}, {
  id: 14,
  sno: 14,
  name: "Hafiz Uzair",
  code: "3102",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-02-01",
  salary: 36000,
  phone: "+92 312 3102014",
  cnic: "37405-4560123-4",
  bank: "HBL",
  status: "active",
  students: 11,
  freeSlots: 1,
  totalSlots: 16,
  leaveBalance: 9,
  leaveTaken: 5,
  perfRating: 4.4,
  classCompletion: 96,
  studentSatisfaction: 93,
  attendanceRate: 97
}, {
  id: 15,
  sno: 15,
  name: "Hafiz Waqas Arshad",
  code: "2468",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2021-05-01",
  salary: 48000,
  phone: "+92 333 2468015",
  cnic: "37405-5601234-5",
  bank: "Meezan",
  status: "active",
  students: 14,
  freeSlots: 0,
  totalSlots: 16,
  leaveBalance: 5,
  leaveTaken: 9,
  perfRating: 4.8,
  classCompletion: 99,
  studentSatisfaction: 96,
  attendanceRate: 98
}, {
  id: 16,
  sno: 16,
  name: "Hafiz Abdullah ATD",
  code: "9482",
  gender: "Male",
  location: "WFH",
  teamLead: "Faizan Khan",
  joinDate: "2021-12-01",
  salary: 40000,
  phone: "+92 300 9482016",
  cnic: "37405-6012345-6",
  bank: "UBL",
  status: "active",
  students: 8,
  freeSlots: 4,
  totalSlots: 16,
  leaveBalance: 10,
  leaveTaken: 4,
  perfRating: 4.2,
  classCompletion: 94,
  studentSatisfaction: 90,
  attendanceRate: 96
}, {
  id: 17,
  sno: 17,
  name: "Hafiz Abu Bakar",
  code: "2377",
  gender: "Male",
  location: "WFH",
  teamLead: "Faizan Khan",
  joinDate: "2022-08-15",
  salary: 38000,
  phone: "+92 345 2377017",
  cnic: "37405-7123456-7",
  bank: "Meezan",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 8,
  leaveTaken: 6,
  perfRating: 4.1,
  classCompletion: 93,
  studentSatisfaction: 89,
  attendanceRate: 95
}, {
  id: 18,
  sno: 18,
  name: "Qari Awais",
  code: "6282",
  gender: "Male",
  location: "WFH",
  teamLead: "Qazi Junaid",
  joinDate: "2023-10-01",
  salary: 35000,
  phone: "+92 312 6282018",
  cnic: "37405-8234567-8",
  bank: "JazzCash",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 11,
  leaveTaken: 3,
  perfRating: 4.0,
  classCompletion: 92,
  studentSatisfaction: 88,
  attendanceRate: 95
}, {
  id: 19,
  sno: 19,
  name: "Qaria Arooj Zareen",
  code: "9160",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2022-03-15",
  salary: 38000,
  phone: "+92 333 9160019",
  cnic: "37405-9345678-9",
  bank: "EasyPaisa",
  status: "active",
  students: 12,
  freeSlots: 1,
  totalSlots: 16,
  leaveBalance: 7,
  leaveTaken: 7,
  perfRating: 4.6,
  classCompletion: 97,
  studentSatisfaction: 95,
  attendanceRate: 98
}, {
  id: 20,
  sno: 20,
  name: "Qaria Esha",
  code: "3325",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2024-02-01",
  salary: 28000,
  phone: "+92 300 3325020",
  cnic: "37405-0456789-0",
  bank: "HBL",
  status: "active",
  students: 3,
  freeSlots: 13,
  totalSlots: 16,
  leaveBalance: 14,
  leaveTaken: 0,
  perfRating: 3.6,
  classCompletion: 87,
  studentSatisfaction: 84,
  attendanceRate: 93
}, {
  id: 21,
  sno: 21,
  name: "Qaria Madiha",
  code: "0676",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2022-06-01",
  salary: 40000,
  phone: "+92 345 0676021",
  cnic: "37405-1567890-1",
  bank: "Meezan",
  status: "active",
  students: 11,
  freeSlots: 1,
  totalSlots: 16,
  leaveBalance: 6,
  leaveTaken: 8,
  perfRating: 4.3,
  classCompletion: 95,
  studentSatisfaction: 91,
  attendanceRate: 96
}, {
  id: 22,
  sno: 22,
  name: "Qaria Malaika",
  code: "-",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2026-04-01",
  salary: 25000,
  phone: "-",
  cnic: "Pending",
  bank: "Pending",
  status: "new",
  students: 0,
  freeSlots: 16,
  totalSlots: 16,
  leaveBalance: 14,
  leaveTaken: 0,
  perfRating: 0,
  classCompletion: 0,
  studentSatisfaction: 0,
  attendanceRate: 0
}, {
  id: 23,
  sno: 23,
  name: "Qaria Najma Noor",
  code: "1093",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2022-11-15",
  salary: 36000,
  phone: "+92 333 1093023",
  cnic: "37405-3789012-3",
  bank: "UBL",
  status: "active",
  students: 8,
  freeSlots: 4,
  totalSlots: 16,
  leaveBalance: 9,
  leaveTaken: 5,
  perfRating: 4.1,
  classCompletion: 93,
  studentSatisfaction: 89,
  attendanceRate: 95
}, {
  id: 24,
  sno: 24,
  name: "Qaria Nida Aman",
  code: "0564",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2022-12-01",
  salary: 37000,
  phone: "+92 300 0564024",
  cnic: "37405-4890123-4",
  bank: "HBL",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 8,
  leaveTaken: 6,
  perfRating: 4.2,
  classCompletion: 94,
  studentSatisfaction: 90,
  attendanceRate: 96
}, {
  id: 25,
  sno: 25,
  name: "Qaria Saba Noor",
  code: "1175",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2023-05-01",
  salary: 34000,
  phone: "+92 345 1175025",
  cnic: "37405-5901234-5",
  bank: "Meezan",
  status: "active",
  students: 9,
  freeSlots: 3,
  totalSlots: 16,
  leaveBalance: 10,
  leaveTaken: 4,
  perfRating: 4.0,
  classCompletion: 92,
  studentSatisfaction: 88,
  attendanceRate: 95
}, {
  id: 26,
  sno: 26,
  name: "Qaria Swera",
  code: "7322",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2023-08-15",
  salary: 34000,
  phone: "+92 312 7322026",
  cnic: "37405-6012345-6",
  bank: "EasyPaisa",
  status: "active",
  students: 9,
  freeSlots: 3,
  totalSlots: 16,
  leaveBalance: 11,
  leaveTaken: 3,
  perfRating: 4.1,
  classCompletion: 93,
  studentSatisfaction: 89,
  attendanceRate: 95
}, {
  id: 27,
  sno: 27,
  name: "Hafiza Atikah",
  code: "2491",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2022-11-01",
  salary: 36000,
  phone: "+92 333 2491027",
  cnic: "37405-7123456-7",
  bank: "UBL",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 8,
  leaveTaken: 6,
  perfRating: 4.2,
  classCompletion: 94,
  studentSatisfaction: 91,
  attendanceRate: 96
}, {
  id: 28,
  sno: 28,
  name: "Huma",
  code: "6934",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2023-03-01",
  salary: 34000,
  phone: "+92 300 6934028",
  cnic: "37405-8234567-8",
  bank: "HBL",
  status: "active",
  students: 9,
  freeSlots: 3,
  totalSlots: 16,
  leaveBalance: 10,
  leaveTaken: 4,
  perfRating: 3.9,
  classCompletion: 91,
  studentSatisfaction: 87,
  attendanceRate: 94
}, {
  id: 29,
  sno: 29,
  name: "Qaria Kanwal",
  code: "7111",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2022-07-15",
  salary: 38000,
  phone: "+92 345 7111029",
  cnic: "37405-9345678-9",
  bank: "Meezan",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 7,
  leaveTaken: 7,
  perfRating: 4.3,
  classCompletion: 95,
  studentSatisfaction: 92,
  attendanceRate: 97
}, {
  id: 30,
  sno: 30,
  name: "Hafiza Momina Akbar",
  code: "5719",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2023-01-01",
  salary: 35000,
  phone: "+92 312 5719030",
  cnic: "37405-0456789-0",
  bank: "EasyPaisa",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 9,
  leaveTaken: 5,
  perfRating: 3.7,
  classCompletion: 89,
  studentSatisfaction: 83,
  attendanceRate: 93
}, {
  id: 31,
  sno: 31,
  name: "Qaria Muqadas Asaar",
  code: "1332",
  gender: "Female",
  location: "WFH",
  teamLead: "Faizan Khan",
  joinDate: "2023-06-01",
  salary: 34000,
  phone: "+92 333 1332031",
  cnic: "37405-1567890-1",
  bank: "HBL",
  status: "active",
  students: 8,
  freeSlots: 4,
  totalSlots: 16,
  leaveBalance: 11,
  leaveTaken: 3,
  perfRating: 4.0,
  classCompletion: 92,
  studentSatisfaction: 88,
  attendanceRate: 95
}, {
  id: 32,
  sno: 32,
  name: "Qaria Nida Sarwar",
  code: "5891",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2022-09-01",
  salary: 40000,
  phone: "+92 300 5891032",
  cnic: "37405-2678901-2",
  bank: "Meezan",
  status: "active",
  students: 12,
  freeSlots: 0,
  totalSlots: 16,
  leaveBalance: 6,
  leaveTaken: 8,
  perfRating: 4.5,
  classCompletion: 97,
  studentSatisfaction: 94,
  attendanceRate: 97
}, {
  id: 33,
  sno: 33,
  name: "Hafiza Samya",
  code: "5561",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2023-04-01",
  salary: 35000,
  phone: "+92 345 5561033",
  cnic: "37405-3789012-3",
  bank: "UBL",
  status: "active",
  students: 10,
  freeSlots: 2,
  totalSlots: 16,
  leaveBalance: 10,
  leaveTaken: 4,
  perfRating: 4.1,
  classCompletion: 93,
  studentSatisfaction: 89,
  attendanceRate: 95
}, {
  id: 34,
  sno: 34,
  name: "Hafiza Saqeela Satti",
  code: "9610",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2022-02-01",
  salary: 42000,
  phone: "+92 312 9610034",
  cnic: "37405-4890123-4",
  bank: "HBL",
  status: "active",
  students: 13,
  freeSlots: 1,
  totalSlots: 16,
  leaveBalance: 5,
  leaveTaken: 9,
  perfRating: 4.4,
  classCompletion: 96,
  studentSatisfaction: 93,
  attendanceRate: 97
}, {
  id: 35,
  sno: 35,
  name: "Qaria Shaista",
  code: "5756",
  gender: "Female",
  location: "WFH",
  teamLead: "Sobia",
  joinDate: "2022-01-15",
  salary: 44000,
  phone: "+92 333 5756035",
  cnic: "37405-5901234-5",
  bank: "Meezan",
  status: "active",
  students: 13,
  freeSlots: 0,
  totalSlots: 16,
  leaveBalance: 4,
  leaveTaken: 10,
  perfRating: 4.7,
  classCompletion: 98,
  studentSatisfaction: 96,
  attendanceRate: 98
}, {
  id: 36,
  sno: 36,
  name: "Shayan",
  code: "0000",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2024-01-15",
  salary: 30000,
  phone: "-",
  cnic: "-",
  bank: "-",
  status: "resigned",
  students: 0,
  freeSlots: 0,
  totalSlots: 16,
  leaveBalance: 0,
  leaveTaken: 0,
  perfRating: 3.2,
  classCompletion: 78,
  studentSatisfaction: 72,
  attendanceRate: 85
}, {
  id: 37,
  sno: 37,
  name: "Abdul Sammad",
  code: "0000",
  gender: "Male",
  location: "IBA",
  teamLead: "Qazi Junaid",
  joinDate: "2023-08-01",
  salary: 32000,
  phone: "-",
  cnic: "-",
  bank: "-",
  status: "resigned",
  students: 0,
  freeSlots: 0,
  totalSlots: 16,
  leaveBalance: 0,
  leaveTaken: 0,
  perfRating: 3.5,
  classCompletion: 82,
  studentSatisfaction: 78,
  attendanceRate: 88
}, {
  id: 38,
  sno: 38,
  name: "Noor Fatima",
  code: "0000",
  gender: "Female",
  location: "IBA",
  teamLead: "Sobia",
  joinDate: "2023-11-01",
  salary: 30000,
  phone: "-",
  cnic: "-",
  bank: "-",
  status: "terminated",
  students: 0,
  freeSlots: 0,
  totalSlots: 16,
  leaveBalance: 0,
  leaveTaken: 0,
  perfRating: 2.5,
  classCompletion: 68,
  studentSatisfaction: 55,
  attendanceRate: 72
}];

const LEAVE_TYPES = ["Sick Leave", "Casual Leave", "Annual Leave", "Ramadan Leave", "Emergency Leave", "Maternity Leave"];

const revData = [{
  month: "Nov",
  income: 320000,
  expense: 210000
}, {
  month: "Dec",
  income: 340000,
  expense: 220000
}, {
  month: "Jan",
  income: 360000,
  expense: 230000
}, {
  month: "Feb",
  income: 335000,
  expense: 215000
}, {
  month: "Mar",
  income: 370000,
  expense: 240000
}, {
  month: "Apr",
  income: 350000,
  expense: 250000
}];

const courseDistro = [{
  name: "Quran",
  value: 75
}, {
  name: "EN-Quaida",
  value: 40
}, {
  name: "Tajweed",
  value: 25
}, {
  name: "Hifz",
  value: 20
}, {
  name: "Subjects",
  value: 15
}];

const enrollData = [{
  month: "Nov",
  count: 8
}, {
  month: "Dec",
  count: 12
}, {
  month: "Jan",
  count: 15
}, {
  month: "Feb",
  count: 9
}, {
  month: "Mar",
  count: 14
}, {
  month: "Apr",
  count: 7
}];

const computeFree = tx => {
  let tShift = tx.shift || "Night";
  let baseSched = null;
  for (const sh of ["Morning", "Evening", "Night", "Weekend"]) {
    const found = (TT_DATA[sh].teachers || []).find(x => x.name === tx.name || x.code === tx.code);
    if (found) {
      tShift = sh;
      baseSched = found.schedule || {};
      break;
    }
  }
  if (!TT_DATA[tShift]) return {
    free: 0,
    total: 0
  };
  const slots = TT_DATA[tShift].slots || [];
  const days = tShift === "Weekend" ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const overlay = tx._ttSchedule || null;
  let free = 0,
    total = 0;
  days.forEach(day => {
    slots.forEach(slot => {
      total++;
      const baseVal = baseSched ? (baseSched[day] || {})[slot] : undefined;
      const ovrVal = overlay ? (overlay[day] || {})[slot] : undefined;
      const effective = ovrVal !== undefined ? ovrVal : baseVal;
      if (!effective || effective === "F") free++;
    });
  });
  return {
    free: free,
    total: total
  };
};

const TT_DATA = {
  Morning: {
    slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"],
    teachers: [{
      sno: 1,
      name: "Abdullah",
      code: "9482",
      location: "WFH",
      lead: "Waqas",
      schedule: {
        Mon: {
          "08:00": "F",
          "08:30": "F",
          "09:00": "F",
          "09:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 2,
      name: "Hafiz Suleman",
      code: "7834",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "08:00": {
            s: "Nazeera",
            a: "15",
            c: "Quran/Revision",
            l: "Zainaba",
            t: "0800 PM USA",
            f: []
          },
          "08:30": {
            s: "Mobina",
            a: "12",
            c: "Quran/Revision",
            l: "Zainaba",
            t: "0830 PM USA",
            f: []
          },
          "09:00": {
            s: "Muntaha",
            a: "8",
            c: "Quran",
            l: "Zainaba",
            t: "0900 PM USA",
            f: []
          },
          "09:30": {
            s: "Mubashir",
            a: "12",
            c: "Quran Memo",
            l: "Seattle",
            t: "0930 PM USA",
            f: []
          },
          "10:00": {
            s: "Waseela",
            a: "8",
            c: "Quran-Taj",
            l: "Seattle",
            t: "1000 PM USA",
            f: []
          },
          "10:30": {
            s: "Mawadah",
            a: "14",
            c: "Quran Memo",
            l: "Seattle",
            t: "1030 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {
          "09:30": "F",
          "10:00": "F",
          "10:30": "F"
        }
      }
    }, {
      sno: 3,
      name: "Faiza",
      code: "0773",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "08:00": "F",
          "08:30": "F",
          "09:00": {
            s: "Aziza",
            a: "12",
            c: "EN-Quaida",
            l: "Oregon",
            t: "",
            f: []
          },
          "09:30": {
            s: "Rahma",
            a: "18",
            c: "EN-Quaida",
            l: "Oregon",
            t: "",
            f: []
          },
          "10:00": {
            s: "Muna",
            a: "24",
            c: "EN-Quaida",
            l: "Oregon",
            t: "",
            f: []
          },
          "15:30": {
            s: "Alisher",
            a: "5",
            c: "Qaida/Quran",
            l: "Shehriyar",
            t: "0800 AM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 4,
      name: "Qaria Muqadas Asaar",
      code: "1332",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "08:00": "F",
          "08:30": "F",
          "13:30": "F",
          "14:00": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 5,
      name: "Waqas Arshad",
      code: "2468",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "08:00": {
            s: "Omer",
            a: "13",
            c: "Quran Chapter-5",
            l: "California",
            t: "0800 PM USA",
            f: []
          },
          "08:30": {
            s: "Fatima",
            a: "13",
            c: "Quran Chapter-5",
            l: "California",
            t: "0830 PM USA",
            f: []
          },
          "09:00": "F",
          "09:30": "F",
          "10:00": "F",
          "10:30": {
            s: "Self",
            a: "35",
            c: "Eng-Madni Quaida",
            l: "Elhadj Diallo",
            t: "0130 AM USA",
            f: []
          },
          "11:00": "F",
          "11:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }]
  },
  Evening: {
    slots: ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"],
    teachers: [{
      sno: 1,
      name: "Abdullah",
      code: "9482",
      location: "WFH",
      lead: "Shakeel",
      schedule: {
        Mon: {
          "19:30": {
            s: "Abdulhakim",
            a: "50",
            c: "Saudi Quran",
            l: "Melika",
            t: "1030 AM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 2,
      name: "Abu Bakar",
      code: "2377",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "22:00": {
            s: "Self",
            a: "62",
            c: "Basics/ Quaida",
            l: "Mohamed Kallon",
            t: "0100 PM USA",
            f: []
          },
          "22:30": {
            s: "No Islamic Education",
            a: "",
            c: "EN-Quaida",
            l: "Loss Angelas",
            t: "1030 AM USA",
            f: []
          },
          "23:00": {
            s: "Self",
            a: "30",
            c: "Quran",
            l: "Jamal Ahmed",
            t: "0100 PM USA",
            f: []
          },
          "23:30": {
            s: "Alpha",
            a: "40",
            c: "Quran",
            l: "Mandingueka Mandingue",
            t: "0130 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {
          "22:30": "F"
        }
      }
    }, {
      sno: 3,
      name: "Hafiz Osama",
      code: "5867",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "16:00": "F",
          "16:30": "F",
          "17:00": "F",
          "17:30": "F",
          "18:00": "F",
          "18:30": "F",
          "19:00": {
            s: "Khalisbek",
            a: "15",
            c: "EN-Quaida",
            l: "Zafar Ahmedov",
            t: "",
            f: []
          },
          "19:30": {
            s: "Self",
            a: "30",
            c: "Basic Quaida",
            l: "Nighat Saqib",
            t: "1030 AM USA",
            f: []
          },
          "20:00": "F",
          "20:30": "F",
          "21:00": "F",
          "21:30": "F",
          "22:00": {
            s: "Daniyal",
            a: "7",
            c: "EN-Quaida",
            l: "Zohal Rahmatyar",
            t: "",
            f: []
          },
          "22:30": {
            s: "Fawahad",
            a: "18",
            c: "Quran",
            l: "Zohal Rahmatyar",
            t: "",
            f: []
          },
          "23:00": {
            s: "Farhad",
            a: "16",
            c: "Quran",
            l: "Zohal Rahmatyar",
            t: "",
            f: []
          },
          "23:30": {
            s: "Masi",
            a: "9",
            c: "Quran",
            l: "Zohal Rahmatyar",
            t: "",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 4,
      name: "Esha",
      code: "3325",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "16:00": {
            s: "Self",
            a: "21",
            c: "Quran Memo",
            l: "Mehrin Faija",
            t: "0700 AM USA",
            f: ["On Leave"]
          },
          "16:30": "F",
          "17:00": "F",
          "17:30": {
            s: "Ilham",
            a: "7",
            c: "Basics/Quaida",
            l: "Mona Hassan",
            t: "0630 AM USA",
            f: []
          },
          "18:00": {
            s: "Adam",
            a: "7",
            c: "Quran",
            l: "Mona Hassan",
            t: "0700 AM USA",
            f: []
          },
          "18:30": {
            s: "Yasina",
            a: "7",
            c: "EN-Quaida",
            l: "Zafar Ahmedov",
            t: "",
            f: []
          },
          "19:00": "F",
          "19:30": {
            s: "Self",
            a: "",
            c: "English Madni Qaida",
            l: "Akhiym ShiKeem Hillard",
            t: "1030 AM USA",
            f: []
          },
          "20:00": {
            s: "Sanela",
            a: "41",
            c: "Norani Qaida English",
            l: "Mirsad Sanela Marukic",
            t: "1100  AM USA",
            f: []
          },
          "20:30": "F",
          "21:00": "F",
          "21:30": "F",
          "22:00": "F",
          "22:30": {
            s: "Self",
            a: "24",
            c: "Quran",
            l: "Marlyatou Barry",
            t: "0130 PM USA",
            f: ["On Leave"]
          },
          "23:00": {
            s: "Self",
            a: "28",
            c: "EN-Quaida",
            l: "Ziham Ali",
            t: "0100 PM USA",
            f: []
          }
        },
        Tue: {
          "19:30": "F"
        },
        Wed: {
          "19:30": {
            s: "Self",
            a: "",
            c: "English Madni Qaida",
            l: "Akhiym ShiKeem Hillard",
            t: "1030 AM USA",
            f: []
          }
        },
        Thu: {},
        Fri: {
          "19:30": "F"
        }
      }
    }, {
      sno: 5,
      name: "Faiza",
      code: "0773",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "16:00": "F",
          "16:30": {
            s: "Babacarr",
            a: "12",
            c: "Quran",
            l: "Nyima Sanyang",
            t: "0630 AM USA",
            f: []
          },
          "17:00": {
            s: "Eshal",
            a: "8",
            c: "EN-Quaida",
            l: "",
            t: "1030 AM USA",
            f: []
          },
          "17:30": {
            s: "Azaan",
            a: "8",
            c: "EN-Quaida",
            l: "",
            t: "1000 AM USA",
            f: []
          },
          "19:00": {
            s: "Kakahramon",
            a: "6",
            c: "EN-Quaida",
            l: "will rejoin on 1st Feb",
            t: "1000 AM USA",
            f: []
          },
          "19:30": "F",
          "20:00": {
            s: "Shaheer",
            a: "10",
            c: "Qaida/Quran",
            l: "Shehryar",
            t: "0930 AM USA",
            f: []
          },
          "20:30": "F",
          "21:00": {
            s: "Anosh",
            a: "7",
            c: "Basics/Quaida",
            l: "Georgia",
            t: "1200 PM USA",
            f: []
          },
          "22:00": "F",
          "22:30": "F",
          "23:00": {
            s: "Arabi Binte Bhuiyan",
            a: "8",
            c: "Quran",
            l: "Venice",
            t: "",
            f: []
          },
          "23:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 6,
      name: "Qari Haris Khan",
      code: "4459",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "20:00": "F",
          "20:30": "F",
          "21:00": "F",
          "21:30": {
            s: "Yaqub",
            a: "19",
            c: "Quran Translation",
            l: "Toronto",
            t: "1230 PM CA",
            f: ["On Leave"]
          },
          "22:30": "F",
          "23:00": "F",
          "23:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {
          "21:30": "F",
          "22:00": "F"
        },
        Fri: {
          "21:30": "F",
          "22:00": "F"
        }
      }
    }, {
      sno: 7,
      name: "Qaria Muqadas Asaar",
      code: "1332",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "16:00": "F",
          "16:30": {
            s: "Self",
            a: "62",
            c: "Quran",
            l: "Anat Odunola Adele",
            t: "0630 AM USA",
            f: []
          },
          "18:00": {
            s: "M. Abdullah",
            a: "4",
            c: "",
            l: "New York",
            t: "0900 AM USA",
            f: []
          },
          "18:30": {
            s: "Sahar Faqirzada",
            a: "12",
            c: "EM-Quaida",
            l: "Sosan Faqirzada",
            t: "",
            f: []
          }
        },
        Tue: {
          "16:00": {
            s: "Mikael",
            a: "10",
            c: "Quran",
            l: "Ambreen Wardah",
            t: "0700 AM USA",
            f: []
          }
        },
        Wed: {},
        Thu: {},
        Fri: {
          "16:00": "F"
        }
      }
    }]
  },
  Night: {
    slots: ["00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30"],
    teachers: [{
      sno: 1,
      name: "Hafiz Abdullah Abbasi",
      code: "4947",
      location: "IBA",
      lead: "Qazi Junaid",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": {
            s: "Self",
            a: "40",
            c: "Quran Tajweed",
            l: "North Carolina",
            t: "0400 PM USA",
            f: []
          },
          "01:30": "F",
          "02:00": {
            s: "Fanan Chowdhury",
            a: "10",
            c: "Quran",
            l: "Florida",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Mohammed Misbahuddin",
            a: "7",
            c: "Quran",
            l: "MD Raziuddin",
            t: "0530 PM USA",
            f: []
          },
          "03:00": "F",
          "03:30": {
            s: "Musah",
            a: "6",
            c: "Quran",
            l: "King Mohamed",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Eltaf",
            a: "6",
            c: "EN-Quaida",
            l: "Texas",
            t: "0600 PM USAf",
            f: ["Zabar-Zair-Paish"]
          },
          "04:30": {
            s: "Maheen",
            a: "08",
            c: "Quran",
            l: "Zain Athar",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Zain",
            a: "11",
            c: "Quran",
            l: "Zain Athar",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Mussa Hassan",
            a: "8",
            c: "Quran with Tajweed",
            l: "Lilla M Roba",
            t: "0830 PM USA",
            f: []
          },
          "06:00": "F",
          "06:30": "F",
          "07:00": "F",
          "07:30": {
            s: "Burka",
            a: "28",
            c: "Quran",
            l: "Kamerya Abrahima",
            t: "0930 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {
          "02:00": "F"
        },
        Fri: {}
      }
    }, {
      sno: 2,
      name: "Hafiz Abdullah Waseem",
      code: "9918",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": {
            s: "Norid",
            a: "10",
            c: "EN-Quaida",
            l: "Jawid",
            t: "",
            f: []
          },
          "02:00": {
            s: "Jahid",
            a: "08",
            c: "Quran",
            l: "Jawid",
            t: "",
            f: []
          },
          "02:30": "F",
          "03:00": {
            s: "Self",
            a: "42",
            c: "EM-Quaida",
            l: "Ibrahim Jeje Olowu",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Moiz",
            a: "6",
            c: "Quran",
            l: "Hira Shah",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Badialo",
            a: "15",
            c: "Quran",
            l: "Philadelphia",
            t: "0700 PM USA",
            f: []
          },
          "04:30": "F",
          "05:00": {
            s: "Aicha",
            a: "6",
            c: "EN-Quaida",
            l: "Kadiatou Amadu Damaro",
            t: "0700 PM USA",
            f: []
          },
          "05:30": {
            s: "Shahzada",
            a: "10",
            c: "Quran",
            l: "California",
            t: "0530 PM USA",
            f: []
          },
          "06:00": {
            s: "Zahor",
            a: "16",
            c: "Quran",
            l: "Jawid",
            t: "",
            f: []
          },
          "06:30": "F",
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 3,
      name: "Hafiz Aftab",
      code: "6907",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "01:00": {
            s: "Kenane",
            a: "12",
            c: "Quran-Memo",
            l: "New York",
            t: "0400 PM USA",
            f: []
          },
          "01:30": {
            s: "Loay",
            a: "13",
            c: "Quran-Memo",
            l: "New York",
            t: "0430 PM USA",
            f: []
          },
          "02:00": "F",
          "02:30": {
            s: "Nubair",
            a: "6",
            c: "Quran",
            l: "Seema",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Muhammad Diao",
            a: "9",
            c: "Quran+Memorization Small Surahs+Isl",
            l: "Iowa",
            t: "0500 PM USA",
            f: []
          },
          "03:30": {
            s: "Diyan",
            a: "14",
            c: "Quran Tajweed",
            l: "Iman Mohammad",
            t: "0530 PM USA",
            f: []
          },
          "05:00": "F",
          "05:30": {
            s: "Hanzala",
            a: "19",
            c: "Quran",
            l: "New York",
            t: "0830 PM USA",
            f: []
          },
          "06:00": "F",
          "06:30": "F",
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {
          "02:00": {
            s: "Jihad",
            a: "12",
            c: "Basics",
            l: "Meccas Halal",
            t: "0500 PM USA",
            f: []
          }
        },
        Wed: {},
        Thu: {
          "02:00": {
            s: "Jihad",
            a: "12",
            c: "Basics",
            l: "Meccas Halal",
            t: "0500 PM USA",
            f: []
          }
        },
        Fri: {}
      }
    }, {
      sno: 4,
      name: "Hafiz Amanullah",
      code: "0872",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": {
            s: "Rayyan",
            a: "7",
            c: "Quran",
            l: "Cena Mohammed",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Ibrahim",
            a: "16",
            c: "Quran",
            l: "Philadelphia",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Mariam",
            a: "10",
            c: "Quran",
            l: "Philadelphia",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Tofik",
            a: "8",
            c: "EN-Quaida",
            l: "Sitra Yusuf",
            t: "0600 PM USA",
            f: []
          },
          "04:30": "F",
          "05:00": "F",
          "05:30": "F",
          "06:00": "F",
          "06:30": {
            s: "Bareen",
            a: "7",
            c: "English Noorani Quaida",
            l: "Manizha Akbarzada",
            t: "0630 PM USA",
            f: []
          },
          "07:00": {
            s: "Rafi",
            a: "10",
            c: "English Noorani Quaida",
            l: "Manizha Akbarzada",
            t: "0700 PM USA",
            f: []
          },
          "07:30": {
            s: "Sama",
            a: "14",
            c: "Quran",
            l: "Manizha Akbarzada",
            t: "0730 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 5,
      name: "Qari Faizan Khan",
      code: "6285",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": "F",
          "03:00": "F",
          "03:30": "F",
          "04:00": "F",
          "04:30": "F",
          "05:00": "F",
          "05:30": {
            s: "Tawfiq",
            a: "13",
            c: "Quran",
            l: "New York",
            t: "0830 PM USA",
            f: ["Ramadan Leave"]
          },
          "06:00": "F",
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {
          "02:30": {
            s: "Muhammad",
            a: "",
            c: "Quran",
            l: "Bineta Laye",
            t: "0430-0500 PM USA",
            f: ["Don't Change"]
          },
          "03:00": {
            s: "Ali",
            a: "",
            c: "Quran",
            l: "Bineta Laye",
            t: "0500-0530 PM USA",
            f: ["Don't Change"]
          },
          "04:30": {
            s: "Makha Kebe",
            a: "8",
            c: "Quran",
            l: "New York",
            t: "0730 PM USA",
            f: []
          },
          "06:00": {
            s: "01 Hour Class",
            a: "",
            c: "Quran",
            l: "Rokaya Khatun",
            t: "0500 PM USA",
            f: []
          },
          "06:30": {
            s: "01 Hour Class",
            a: "",
            c: "Quran",
            l: "Rokaya Khatun",
            t: "0530 PM USA",
            f: []
          },
          "07:00": {
            s: "Asad",
            a: "16",
            c: "Quran",
            l: "Shaawa",
            t: "0700 PM USA",
            f: []
          }
        }
      }
    }, {
      sno: 6,
      name: "Farhan Awan",
      code: "0101",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Ali",
            a: "8",
            c: "EN Quaida",
            l: "Pennsylvania",
            t: "0330 PM USA",
            f: []
          },
          "01:00": {
            s: "Atal",
            a: "7",
            c: "EN-Quaida",
            l: "Virginia",
            t: "0400 PM USA",
            f: []
          },
          "01:30": "F",
          "02:00": "F",
          "02:30": "F",
          "03:00": {
            s: "Aleja",
            a: "10",
            c: "Quran",
            l: "Abdyl Aziz Jonuzi",
            t: "0500PM USA",
            f: []
          },
          "03:30": {
            s: "Adea",
            a: "12",
            c: "Quran",
            l: "Abdyl Aziz Jonuzi",
            t: "0530 PM USA",
            f: []
          },
          "04:00": {
            s: "Ammar",
            a: "11",
            c: "Saudi Quran",
            l: "Hikmet Bekri",
            t: "0400 PM USA",
            f: []
          },
          "04:30": {
            s: "Nadeem",
            a: "10",
            c: "Online Quran Memo",
            l: "Hikmet Bekri",
            t: "0430 PM USA",
            f: []
          },
          "05:30": {
            s: "Muhamad St Fleur",
            a: "14",
            c: "EN-Quaida",
            l: "Abu Muhammad Al Haiti",
            t: "0830 PM USA",
            f: []
          },
          "06:00": "F",
          "06:30": "F",
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 8,
      name: "Qari Haris Khan",
      code: "4459",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Ezmam",
            a: "4",
            c: "Eng Madni-Quaida",
            l: "New York",
            t: "0500 PM USA",
            f: []
          },
          "02:30": "F",
          "03:00": {
            s: "Ayat",
            a: "15",
            c: "Quran",
            l: "New York",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Amira",
            a: "8",
            c: "Quran",
            l: "New York",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Eyanat Rahman",
            a: "",
            c: "Quran",
            l: "Michigan",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Subhan Sawiz",
            a: "11",
            c: "Quran",
            l: "Toronto",
            t: "0730 PM CA",
            f: []
          },
          "05:00": {
            s: "Saihaan Sawiz",
            a: "6",
            c: "EN-Quaida",
            l: "Toronto",
            t: "0800 PM CA",
            f: []
          },
          "05:30": "F",
          "06:00": {
            s: "Yahya",
            a: "9",
            c: "Quran",
            l: "Alberta",
            t: "0700 PM USA",
            f: []
          },
          "06:30": {
            s: "Siraj",
            a: "8",
            c: "Quran",
            l: "Alberta",
            t: "0730 PM USA",
            f: []
          },
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 9,
      name: "Qari Hussnain",
      code: "0353",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": "F",
          "03:00": "F",
          "03:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 10,
      name: "Qari Muhammad Nadeem",
      code: "7346",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Lamin",
            a: "16",
            c: "Quran-Tajweed",
            l: "Ohio",
            t: "0330 PM USA",
            f: []
          },
          "01:00": {
            s: "Nurshod",
            a: "7",
            c: "Eng/Noorani Quaida",
            l: "New York",
            t: "0400 PM USA",
            f: []
          },
          "01:30": "F",
          "02:00": {
            s: "Marwa",
            a: "9",
            c: "Quran",
            l: "Wajiha",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Najma",
            a: "7",
            c: "Quran",
            l: "Wajiha",
            t: "0530 PM USA",
            f: []
          },
          "03:00": "F",
          "03:30": {
            s: "Danyal",
            a: "6",
            c: "Quran",
            l: "Saria Choudri",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Arwin",
            a: "10",
            c: "Quran",
            l: "Virginia",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Aminata",
            a: "5",
            c: "EN-Quaida",
            l: "Washington DC",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Fanta",
            a: "14",
            c: "Quran",
            l: "Washington DC",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Abdul Aziz",
            a: "11",
            c: "Quran Memo",
            l: "Salokhiddin Fakhriev Abdu",
            t: "0530 PM USA",
            f: []
          },
          "06:00": {
            s: "Mohammad",
            a: "15",
            c: "Quran Memo",
            l: "Salokhiddin Fakhriev Abdu",
            t: "0600 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 11,
      name: "Hafiz Osama",
      code: "5867",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Ibrahim Dioubate",
            a: "8",
            c: "EM-Quaida",
            l: "Fatoumata Conde",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Elhadg Dioubate",
            a: "12",
            c: "EM-Quaida",
            l: "Fatoumata Conde",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Abdul Hameed",
            a: "6",
            c: "Quran",
            l: "North Corolina",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Nadia",
            a: "11",
            c: "Quran",
            l: "North Corolina",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Dalib",
            a: "11",
            c: "Quran",
            l: "Ohio",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Saad Rahman",
            a: "12",
            c: "Online Quran",
            l: "New Jersey",
            t: "0730 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {
          "03:30": "F"
        }
      }
    }, {
      sno: 12,
      name: "Saifullah",
      code: "1562",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Ibrahim",
            a: "8",
            c: "EN Quaida",
            l: "Pennsylvania",
            t: "0330 PM USA",
            f: []
          },
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Haris",
            a: "7",
            c: "Quran-Taj",
            l: "Texas",
            t: "0400 PM USA",
            f: []
          },
          "02:30": {
            s: "Habib",
            a: "13",
            c: "Quran-Memorization",
            l: "Juzz Amma",
            t: "0430 PM USA",
            f: []
          },
          "03:00": {
            s: "Iman",
            a: "6",
            c: "Quran",
            l: "Nizam ud din",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Ilma Areej",
            a: "4",
            c: "EN-Quaida",
            l: "Nizam ud din",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Shahyan",
            a: "11",
            c: "Quran",
            l: "Ghazal Zeeshan",
            t: "0600 PM USA",
            f: []
          },
          "05:00": {
            s: "Abu Bakar",
            a: "9",
            c: "Quran",
            l: "Aminata Cisse",
            t: "0800 PM USA",
            f: ["On Leave"]
          },
          "05:30": {
            s: "Yahya",
            a: "7",
            c: "Quran",
            l: "Aminata Cisse",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Jalil",
            a: "18",
            c: "Quran",
            l: "Jawid",
            t: "",
            f: []
          },
          "06:30": {
            s: "Jamil",
            a: "18",
            c: "Quran",
            l: "Jawid",
            t: "",
            f: []
          },
          "07:00": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 13,
      name: "Hafiz Suleman",
      code: "7834",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": {
            s: "Amir",
            a: "8",
            c: "Quran Tajweed",
            l: "Polina Jibril",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Mohammad Nohun",
            a: "9",
            c: "Quran",
            l: "Mohammad Kadir",
            t: "0500 PM USA",
            f: []
          },
          "03:30": {
            s: "Imran",
            a: "5",
            c: "EN-Quaida",
            l: "New York",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Samir",
            a: "11",
            c: "Quran Memorization",
            l: "Sofiya",
            t: "0700 PM USA",
            f: []
          },
          "05:00": "F",
          "05:30": "F",
          "06:00": "F",
          "06:30": "F",
          "07:00": "F",
          "07:30": {
            s: "Jacob Olol",
            a: "8",
            c: "Quran",
            l: "Oregon",
            t: "0730 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 14,
      name: "Hafiz Tayyab",
      code: "0074",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Adama",
            a: "9",
            c: "EN Quaida",
            l: "Pennsylvania",
            t: "0330 PM USA",
            f: []
          },
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Elhaji",
            a: "12",
            c: "Quran+memorization of Ayat Ul Kursi",
            l: "New Jersey",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Zainab",
            a: "9",
            c: "Quran",
            l: "Musa Jallow",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Ibrahim",
            a: "10",
            c: "Quran",
            l: "New York",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Safoura",
            a: "11",
            c: "En-Quaida",
            l: "Leila Yayehabi",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Self",
            a: "32",
            c: "En-Quaida",
            l: "Leila Yayehabi",
            t: "0700 PM USA",
            f: []
          },
          "04:30": "F",
          "05:00": {
            s: "Abu Bakar",
            a: "8",
            c: "English Madni Quaida",
            l: "Soumahoro Oumar",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Karamoko 7",
            a: "",
            c: "Quran",
            l: "New York",
            t: "0830 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 15,
      name: "Hafiz Uzair",
      code: "3102",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "01:00": "F",
          "01:30": {
            s: "Sultana",
            a: "4",
            c: "EN-Quaida",
            l: "Virginia",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Hawa",
            a: "6",
            c: "EN-Quaida",
            l: "Virginia",
            t: "0500 PM USA",
            f: []
          },
          "02:30": "F",
          "03:00": "F",
          "03:30": {
            s: "AbuBakrine",
            a: "8",
            c: "EN-Quaida",
            l: "Texas-Dallas",
            t: "0530 PM USA",
            f: []
          },
          "04:00": {
            s: "Aminata",
            a: "7",
            c: "EN-Quaida",
            l: "Kadiatou Amadu Damaro",
            t: "0600 PM USA",
            f: []
          },
          "04:30": {
            s: "Djiba",
            a: "5",
            c: "EN-Quaida",
            l: "Kadiatou Amadu Damaro",
            t: "0630 PM USA",
            f: []
          },
          "05:00": {
            s: "Self",
            a: "16",
            c: "Quran",
            l: "Zarin Raisa",
            t: "0700 PM USA",
            f: []
          },
          "05:30": {
            s: "Qasim Sohail",
            a: "8",
            c: "EN-Quaida",
            l: "Maimoona Abdullah",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Ousman",
            a: "10",
            c: "Eng/Noorani Quaida",
            l: "Colorado",
            t: "0700 PM USA",
            f: []
          },
          "06:30": {
            s: "Amina",
            a: "7",
            c: "Eng/Noorani Quaida",
            l: "Colorado",
            t: "0730 PM USA",
            f: []
          },
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {
          "05:00": "F"
        },
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 16,
      name: "Hafiz Waqas Arshad",
      code: "2468",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": {
            s: "Self",
            a: "45",
            c: "Surah Memorization",
            l: "Kadiatou Amadu Damaro",
            t: "0200 PM USA",
            f: []
          },
          "01:00": {
            s: "Aisha Qayyum",
            a: "7",
            c: "E-Quaida",
            l: "Ahmad Qayyum",
            t: "0400 PM USA",
            f: []
          },
          "01:30": {
            s: "Ibrahim",
            a: "4",
            c: "EN-Quaida",
            l: "Sireh Bah",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "AbuBaker",
            a: "10",
            c: "Quran Memorization",
            l: "Sireh Bah",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Muhammad",
            a: "6",
            c: "Quran",
            l: "Sireh Bah",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Hasher",
            a: "4",
            c: "Quran-Tajweed",
            l: "Mohammad Imran Khan",
            t: "0600 PM USA",
            f: []
          },
          "03:30": "F",
          "04:00": "F",
          "04:30": {
            s: "Mustafa",
            a: "6",
            c: "Basics/Quaida",
            l: "Sayed Arif Habibi",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Elham",
            a: "13",
            c: "Basics/Quaida",
            l: "Sayed Arif Habibi",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Lewi",
            a: "9",
            c: "Quran",
            l: "Bastan Gul",
            t: "0830 PM USA",
            f: ["Don't Change"]
          },
          "06:00": {
            s: "Bamo",
            a: "10",
            c: "Quran",
            l: "Bastan Gul",
            t: "0900 PM USA",
            f: ["Don't Change"]
          },
          "06:30": {
            s: "Abu Bakar",
            a: "9",
            c: "Quran",
            l: "Seattle",
            t: "0630-0700 PM USA",
            f: []
          },
          "07:00": {
            s: "Mohammad",
            a: "11",
            c: "Quran",
            l: "Seattle",
            t: "0700-0730 PM USA",
            f: []
          },
          "07:30": {
            s: "Self",
            a: "30",
            c: "Quran",
            l: "MD Ayyan",
            t: "",
            f: ["Ramadan Leave"]
          }
        },
        Tue: {
          "04:30": "F"
        },
        Wed: {
          "04:30": {
            s: "Mustafa",
            a: "6",
            c: "Basics/Quaida",
            l: "Sayed Habibi",
            t: "0730 PM USA",
            f: []
          }
        },
        Thu: {
          "04:30": "F"
        },
        Fri: {
          "04:30": {
            s: "Mustafa",
            a: "6",
            c: "Basics/Quaida",
            l: "Sayed Habibi",
            t: "0730 PM USA",
            f: []
          },
          "07:30": "F"
        }
      }
    }, {
      sno: 17,
      name: "Hafiz Abdullah ATD",
      code: "9482",
      location: "WFH",
      lead: "Faizan Khan (Homebased Male Faculty)",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Self",
            a: "57",
            c: "Quran-Taj",
            l: "Virginia",
            t: "0330 PM USA",
            f: []
          },
          "01:00": {
            s: "Nujoom",
            a: "12",
            c: "EMadni-Quaida",
            l: "New Jersey.",
            t: "0400 PM USA",
            f: []
          },
          "01:30": {
            s: "Eshan",
            a: "10",
            c: "Quran",
            l: "Mohammed Rahman",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Tanisha",
            a: "12",
            c: "Quran",
            l: "Mohammed Rahman",
            t: "0500 PM USA",
            f: []
          },
          "02:30": "F",
          "03:00": {
            s: "Hamza",
            a: "12",
            c: "Quran",
            l: "Melika",
            t: "0600 PM USA",
            f: []
          },
          "03:30": "F",
          "06:00": "F",
          "06:30": {
            s: "Self",
            a: "52",
            c: "",
            l: "Georgia",
            t: "0930 PM USA",
            f: []
          },
          "07:00": {
            s: "Self",
            a: "",
            c: "Quran",
            l: "Ibrahim Ghaleb",
            t: "0900 PM USA",
            f: []
          },
          "07:30": "F"
        },
        Tue: {},
        Wed: {
          "06:00": {
            s: "Miftaah",
            a: "60",
            c: "Quran",
            l: "Georgia",
            t: "0900 PM USA",
            f: []
          }
        },
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 18,
      name: "Hafiz Abu Bakar",
      code: "2377",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": {
            s: "Rahmet",
            a: "15",
            c: "Quran Memorization",
            l: "Texas",
            t: "0200 PM USA",
            f: []
          },
          "00:30": "F",
          "01:00": "F",
          "01:30": {
            s: "Dewa",
            a: "6",
            c: "Quran Memorization",
            l: "Mahmood Ebadi",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Haroon",
            a: "7",
            c: "Quran",
            l: "Sultani",
            t: "0400 PM USA",
            f: []
          },
          "02:30": {
            s: "Ahmed Mujtaba",
            a: "8",
            c: "Quran",
            l: "Asma Mujtaba",
            t: "0430 PM USA",
            f: []
          },
          "03:00": {
            s: "Ismail",
            a: "6",
            c: "Quran",
            l: "Freddie Cisse",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Ismail",
            a: "10",
            c: "Quran",
            l: "Sultan Sheikh",
            t: "0330 PM USA",
            f: []
          },
          "04:00": {
            s: "Ibrahim",
            a: "21",
            c: "Quran",
            l: "Musah Quaye",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Self",
            a: "",
            c: "Quran",
            l: "Musah Quaye",
            t: "0730 PM USA",
            f: []
          },
          "05:00": "F",
          "05:30": {
            s: "Ghazali",
            a: "13",
            c: "EN-Quaida",
            l: "Oregon",
            t: "0530 PM USA",
            f: []
          }
        },
        Tue: {
          "02:30": "F"
        },
        Wed: {
          "02:30": {
            s: "Ahmed Mujtaba",
            a: "8",
            c: "Quran",
            l: "Asma Mujtaba",
            t: "0430 PM USA",
            f: []
          }
        },
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 19,
      name: "Qari Awais",
      code: "6282",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Anayat",
            a: "7",
            c: "Eng/Noorani Quaida",
            l: "Jamil Robert",
            t: "",
            f: []
          },
          "01:00": "F",
          "01:30": {
            s: "Mariam",
            a: "6",
            c: "English Madni Quaida",
            l: "Oumar Sow",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Lamine",
            a: "11",
            c: "English Madni Quaida",
            l: "Fanta Sylla",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Ayesha",
            a: "7",
            c: "EN-Quaida",
            l: "Pennsylvania",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Wajiha Raiqa",
            a: "9",
            c: "EN-Quaida",
            l: "Sultana Yasmin",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Islam",
            a: "15",
            c: "Quran",
            l: "Abire Selawi",
            t: "0630 PM USA",
            f: []
          },
          "04:00": "F",
          "04:30": {
            s: "Self",
            a: "55",
            c: "EN-Quaida",
            l: "Jihada Wynnette Allen",
            t: "0730 PM USA",
            f: ["Ramadan Leave"]
          },
          "05:00": {
            s: "Self",
            a: "23",
            c: "Quran 1st Juz",
            l: "Pennsylvania",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Mustapha",
            a: "12",
            c: "Quran",
            l: "Roya",
            t: "",
            f: []
          },
          "06:00": "F",
          "06:30": "F",
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 1,
      name: "Qaria Arooj Zareen",
      code: "9160",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Sana Nasiri",
            a: "6",
            c: "EN-Quaida",
            l: "New York",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Amina Diop",
            a: "3",
            c: "English Noorani Quaida",
            l: "Thierno Diop",
            t: "0430 PM USA",
            f: ["Don't Change"]
          },
          "03:00": {
            s: "Khadidja Diop",
            a: "4",
            c: "Saudi Quran/EN-Quiada",
            l: "Monday-Tuesday(EN-Quiad)",
            t: "0500 PM USA",
            f: ["Don't Change"]
          },
          "03:30": {
            s: "Safeera",
            a: "8",
            c: "Quran",
            l: "Toranto",
            t: "0630 PM CA",
            f: []
          },
          "04:00": {
            s: "Mira",
            a: "8",
            c: "EN-Quaida",
            l: "Polina Jibril",
            t: "0700 PM USA",
            f: ["Female Only"]
          },
          "04:30": {
            s: "Self",
            a: "33",
            c: "EN-Quaida",
            l: "Muna Mahamud",
            t: "0630 PM USA",
            f: []
          },
          "05:00": {
            s: "Zohal",
            a: "6",
            c: "Eng/Noorani Quaida",
            l: "Virginia",
            t: "0800 PM USA",
            f: ["Zabar-Zair-Paish"]
          },
          "05:30": {
            s: "Nafisa Tasmim",
            a: "7",
            c: "Quran",
            l: "Mahboob Alam",
            t: "",
            f: []
          },
          "06:00": {
            s: "Nanjiba",
            a: "16",
            c: "Quran",
            l: "Syeda Salma Sultana",
            t: "0900 PM USA",
            f: []
          },
          "06:30": {
            s: "Self",
            a: "38",
            c: "Quran",
            l: "Virginia",
            t: "0930 PM USA",
            f: []
          },
          "07:00": "F",
          "07:30": {
            s: "Self",
            a: "50",
            c: "Quran",
            l: "Aqqlima Omari",
            t: "0930 PM USA",
            f: []
          }
        },
        Tue: {
          "04:30": "F"
        },
        Wed: {
          "04:30": {
            s: "Self",
            a: "33",
            c: "EN-Quaida",
            l: "Muna Mahamud",
            t: "0630 PM USA",
            f: []
          }
        },
        Thu: {},
        Fri: {
          "04:30": "F"
        }
      }
    }, {
      sno: 2,
      name: "Qaria Esha",
      code: "3325",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "04:00": {
            s: "Wajiha",
            a: "5",
            c: "",
            l: "New York",
            t: "0700 PM USA",
            f: []
          },
          "06:30": {
            s: "Touvey Olol",
            a: "10",
            c: "Quran",
            l: "Oregon",
            t: "0630 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 4,
      name: "Qaria Madiha",
      code: "0676",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": {
            s: "Zainab",
            a: "18",
            c: "Quran",
            l: "Shaawa",
            t: "0100 PM USA",
            f: []
          },
          "01:30": {
            s: "Ibnou",
            a: "8",
            c: "EN-Quaida",
            l: "Salmane Diop",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Maliha",
            a: "8",
            c: "Quran",
            l: "Golam K Chowdhury",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Maliha",
            a: "8",
            c: "Quran",
            l: "Golam K Chowdhury",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Manha",
            a: "6",
            c: "Quran",
            l: "Golam K Chowdhury",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Manha",
            a: "6",
            c: "Quran",
            l: "Golam K Chowdhury",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Aminata",
            a: "11",
            c: "Quran",
            l: "Soumahoro Oumar",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Nyima",
            a: "5",
            c: "EN-Quaida",
            l: "Chicago",
            t: "0630 PM USA",
            f: []
          },
          "05:00": {
            s: "Zoya Hassan",
            a: "5",
            c: "Basics/Quaida",
            l: "New Jersey",
            t: "0800 PM USA",
            f: ["15-min Class"]
          },
          "05:30": "F",
          "06:00": "F",
          "06:30": {
            s: "Eifa",
            a: "15",
            c: "Quran",
            l: "Kona Ershad",
            t: "",
            f: []
          },
          "07:00": {
            s: "Eisha",
            a: "13",
            c: "Quran",
            l: "Kona Ershad",
            t: "0900 PM USA",
            f: []
          },
          "07:30": "F"
        },
        Tue: {
          "05:00": "F"
        },
        Wed: {
          "05:00": {
            s: "Zoya Hassan",
            a: "5",
            c: "Basics/Quaida",
            l: "New Jersey",
            t: "0800 PM USA",
            f: ["15-min Class"]
          }
        },
        Thu: {
          "01:00": "F",
          "05:00": "F"
        },
        Fri: {
          "05:00": {
            s: "Zoya Hassan",
            a: "5",
            c: "Basics/Quaida",
            l: "New Jersey",
            t: "0800 PM USA",
            f: ["15-min Class"]
          }
        }
      }
    }, {
      sno: 5,
      name: "Qaria Malaika",
      code: "",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": "F",
          "03:00": "F",
          "03:30": "F",
          "04:00": "F",
          "04:30": "F",
          "05:00": "F",
          "05:30": "F",
          "06:00": "F",
          "06:30": "F",
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 6,
      name: "Qaria Najma Noor",
      code: "1093",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": {
            s: "Sonia Qayyum",
            a: "35",
            c: "Quran Tajweed",
            l: "Ahmad Qayyum",
            t: "0400 PM USA",
            f: []
          },
          "01:30": "F",
          "02:00": {
            s: "Mona",
            a: "9",
            c: "Quaida",
            l: "Maryam Saadati",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Marwa",
            a: "11",
            c: "Quaida",
            l: "Maryam Saadati",
            t: "0530 PM USA",
            f: []
          },
          "03:00": "F",
          "03:30": "F",
          "04:00": {
            s: "Kelaanee",
            a: "8",
            c: "English Noorani Quaida",
            l: "Kamerya Abrahima",
            t: "0600PM USA",
            f: []
          },
          "04:30": {
            s: "Asif Alam",
            a: "12",
            c: "and Short Surah Memorization",
            l: "Khurshida Begum",
            t: "0730 PM USA",
            f: []
          },
          "05:00": "F",
          "05:30": "F",
          "06:00": "F",
          "06:30": {
            s: "Eeba",
            a: "5",
            c: "English Noorani Quaida",
            l: "Kona Ershad",
            t: "0830 PM USA",
            f: []
          },
          "07:00": {
            s: "Self",
            a: "54",
            c: "EN-Quaida",
            l: "Sabrina WM",
            t: "1000 PM USA",
            f: []
          },
          "07:30": "F"
        },
        Tue: {
          "05:00": {
            s: "Ayesha",
            a: "8",
            c: "English Noorani Quaida",
            l: "Ambreen Wardah",
            t: "0800 PM USA",
            f: ["Female Only"]
          }
        },
        Wed: {},
        Thu: {},
        Fri: {
          "05:00": "F"
        }
      }
    }, {
      sno: 7,
      name: "Qaria Nida Aman/ Malaika",
      code: "0564",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": {
            s: "Aida Haroun",
            a: "6",
            c: "EN-Quaida",
            l: "Fatna Khamis",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Kadijah Jalloh",
            a: "15",
            c: "Quran",
            l: "Pennsylvania",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Amina",
            a: "5",
            c: "Eng Madni Quaida",
            l: "Maryland",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Baboucarr",
            a: "4",
            c: "English Norani Qaida",
            l: "Aji Najib",
            t: "0600PM USA",
            f: []
          },
          "03:30": {
            s: "Unknown",
            a: "",
            c: "EN-Quaida",
            l: "(Mansour-7",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Nesri",
            a: "6",
            c: "Quran Tajveed",
            l: "California",
            t: "",
            f: []
          },
          "04:30": {
            s: "Manigna",
            a: "5",
            c: "EN-Quaida",
            l: "Fatima Bah",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Mariatou",
            a: "8",
            c: "",
            l: "Colorado",
            t: "0600 PM USA",
            f: []
          },
          "06:00": "F",
          "06:30": {
            s: "Iman",
            a: "10",
            c: "Quran",
            l: "Texas",
            t: "0830 PM USA",
            f: []
          },
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {
          "05:00": {
            s: "Mariatou",
            a: "8",
            c: "",
            l: "Colorado",
            t: "0600 PM USA",
            f: []
          },
          "05:30": "F"
        }
      }
    }, {
      sno: 8,
      name: "Qaria Saba Noor/ Shagufta Nasir",
      code: "1175",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Javida",
            a: "13",
            c: "Quran",
            l: "Jawid",
            t: "",
            f: []
          },
          "02:30": {
            s: "Fabiha",
            a: "5",
            c: "EN-Quaida",
            l: "Mohammad Burhan uddin",
            t: "0530 PM CA",
            f: ["Camera Class"]
          },
          "03:00": {
            s: "Elina",
            a: "7",
            c: "Quran",
            l: "Mohammad Burhan uddin",
            t: "0600 PM CA",
            f: ["Camera Class"]
          },
          "03:30": "F",
          "04:00": "F",
          "04:30": {
            s: "Reyan",
            a: "14",
            c: "Quran Tajweed",
            l: "Sitra Yusuf",
            t: "0630 PM USA",
            f: []
          },
          "05:00": {
            s: "Oryam",
            a: "12",
            c: "Quran Tajweed",
            l: "Sitra Yusuf",
            t: "0700 PM USA",
            f: []
          },
          "05:30": {
            s: "Fatana",
            a: "13",
            c: "Quran",
            l: "California",
            t: "0530 PM USA",
            f: []
          },
          "06:00": {
            s: "Nabil Moustapha",
            a: "5",
            c: "Quran",
            l: "Salha Rosine",
            t: "0600 PM USA",
            f: []
          },
          "06:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 9,
      name: "Qaria Swera/ Swera",
      code: "7322",
      location: "IBA",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": {
            s: "Mujeeb",
            a: "12",
            c: "Quran",
            l: "Virginia",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Mariam Konate",
            a: "6",
            c: "EN-Quaida",
            l: "New York",
            t: "0600 PM USA",
            f: []
          },
          "03:30": "F",
          "04:00": {
            s: "Mahmuda Akhter",
            a: "40",
            c: "Eng Madni-Quaida",
            l: "Jasmin Akhter",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Self",
            a: "30",
            c: "Quran",
            l: "Shama Mustak",
            t: "0430 PM USA",
            f: []
          },
          "05:00": {
            s: "Maya",
            a: "13",
            c: "Quran+memorization of Ayat Ul Kursi",
            l: "Salmane Diop",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Aisha",
            a: "8",
            c: "EM-Quaida",
            l: "California",
            t: "0530 PM USA",
            f: []
          },
          "06:00": {
            s: "Salima Sally",
            a: "15",
            c: "Quran",
            l: "Mustapha Konteh",
            t: "0700 PM USA",
            f: []
          },
          "06:30": "F"
        },
        Tue: {},
        Wed: {
          "04:00": "F"
        },
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 10,
      name: "Alima & Hafiza Atikah",
      code: "2491",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": {
            s: "Fatimah Jalloh",
            a: "9",
            c: "Quran",
            l: "Pennsylvania",
            t: "0430 PM USA",
            f: []
          },
          "02:00": "F",
          "02:30": {
            s: "Fatoumata",
            a: "9",
            c: "Quran",
            l: "King Mohamed",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Masaran Kamarah",
            a: "11",
            c: "Quran",
            l: "Mariam Kromah",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Haby",
            a: "8",
            c: "EN-Quaida",
            l: "Philadelphia",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Hamallah",
            a: "5",
            c: "Eng/Noorani Quaida",
            l: "Philadelphia",
            t: "0700 PM USA",
            f: []
          },
          "04:30": "F",
          "05:00": {
            s: "Parizoda",
            a: "8",
            c: "En-Quaida",
            l: "Uktam Rakhmonov",
            t: "0300 PM USA",
            f: []
          },
          "05:30": {
            s: "Shirin",
            a: "10",
            c: "En-Quaida",
            l: "Uktam Rakhmonov",
            t: "0330 PM USA",
            f: []
          },
          "06:00": {
            s: "Shahrizoda",
            a: "14",
            c: "Basics",
            l: "Uktam Rakhmonov",
            t: "0400 PM USA",
            f: []
          },
          "06:30": {
            s: "Jasmina",
            a: "15",
            c: "Quran",
            l: "Uktam Rakhmonov",
            t: "0430 PM USA",
            f: []
          },
          "07:00": {
            s: "Self",
            a: "19",
            c: "Quran Memorization",
            l: "New York",
            t: "1000 PM USA",
            f: []
          },
          "07:30": "F"
        },
        Tue: {},
        Wed: {
          "07:30": {
            s: "Self",
            a: "30",
            c: "Basics",
            l: "Toronto",
            t: "1030 PM CA",
            f: []
          }
        },
        Thu: {
          "07:30": "F"
        },
        Fri: {}
      }
    }, {
      sno: 11,
      name: "Huma",
      code: "6934",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": {
            s: "Mahaja Kamarah",
            a: "6",
            c: "Urdu Madni Quaida",
            l: "Mariam Kromah",
            t: "0500 PM USA",
            f: []
          },
          "02:30": "F",
          "03:00": {
            s: "Self",
            a: "38",
            c: "EN-Quaida",
            l: "Novida",
            t: "0600 PM USA",
            f: []
          },
          "03:30": "F",
          "04:00": {
            s: "Mohammad",
            a: "8",
            c: "EN-Quaida",
            l: "Novida",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Sorayya",
            a: "6",
            c: "EN-Quaida",
            l: "New York",
            t: "",
            f: ["On Leave"]
          },
          "05:00": {
            s: "Toheed Ahmed",
            a: "15",
            c: "Quran",
            l: "Homaira Rasooli",
            t: "0500 PM USA",
            f: []
          },
          "05:30": {
            s: "Maryam Jallow",
            a: "14",
            c: "EN-Quaida",
            l: "Musa Jallow",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Unknown",
            a: "",
            c: "Eng Madni Quaida",
            l: "Minnesota",
            t: "0800 PM USA",
            f: []
          },
          "06:30": {
            s: "Rifaan",
            a: "10",
            c: "Quran",
            l: "Navas Mohamed",
            t: "0830 PM USA",
            f: []
          },
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 12,
      name: "Qaria Kanwal",
      code: "7111",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": "F",
          "02:00": "F",
          "02:30": {
            s: "Matenneh Kamarah",
            a: "6",
            c: "Urdu Madni Quaida",
            l: "Mariam Kromah",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Tonieh",
            a: "10",
            c: "Quran",
            l: "",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Maryam",
            a: "18",
            c: "Quran Surah Al-Balad",
            l: "Fatoumata Conde",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Ruqia",
            a: "8",
            c: "EN-Quaida",
            l: "Texas",
            t: "0600 PM USA",
            f: ["ADHD", "Zabar-Zair-Paish"]
          },
          "04:30": {
            s: "Khadija",
            a: "13",
            c: "EN-Quaida",
            l: "Texas",
            t: "0630 PM USA",
            f: ["Zabar-Zair-Paish"]
          },
          "05:00": {
            s: "Fatumata Jaiteh",
            a: "10",
            c: "Quran",
            l: "Omer Jaiteh",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Aminatah Jaiteh",
            a: "8",
            c: "Quran",
            l: "Omer Jaiteh",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Mame Diarra Mbaye",
            a: "12",
            c: "EN-Quaida",
            l: "Elhadji Mbaye",
            t: "0900 PM USA",
            f: []
          },
          "06:30": {
            s: "Arhaan",
            a: "8",
            c: "Basics/Quaida",
            l: "Shama Mustak",
            t: "0630 PM USA",
            f: []
          },
          "07:00": "F",
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 13,
      name: "Hafiza Momina Akbar",
      code: "5719",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": {
            s: "Unknown",
            a: "",
            c: "Quran",
            l: "Bilkis Islam",
            t: "0330 PM USA",
            f: []
          },
          "01:00": "F",
          "01:30": {
            s: "Ramzia",
            a: "9",
            c: "",
            l: "NewYork",
            t: "0430 PM USA",
            f: ["Female Only"]
          },
          "02:00": "F",
          "02:30": {
            s: "Fatoumata Dioubate",
            a: "12",
            c: "EM-Quaida",
            l: "Fatoumata Conde",
            t: "0530 PM USA",
            f: []
          },
          "03:00": {
            s: "Mukhammad",
            a: "6",
            c: "English Madni Quaida",
            l: "New York",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Humaira Imran",
            a: "8",
            c: "EN-Quaida",
            l: "Mohammad Imran Khan",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Sadya",
            a: "10",
            c: "EN-Quaida",
            l: "Virginia",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Haram",
            a: "6",
            c: "Quran",
            l: "Ghazal Zeeshan",
            t: "0630 PM USA",
            f: []
          },
          "05:00": {
            s: "Israe",
            a: "15",
            c: "English Norani Quaida",
            l: "Abire Selawi",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Isra Mustafa",
            a: "14",
            c: "EN-Quaida",
            l: "Abu Muhammad Al Haiti",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Self",
            a: "35",
            c: "Eng Madni-Quaida",
            l: "Lafiah Freeman",
            t: "0900 PM USA",
            f: []
          },
          "06:30": {
            s: "Self",
            a: "29",
            c: "Quran Memorization",
            l: "Maryam Aleemi",
            t: "0630 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {
          "06:30": "F"
        },
        Fri: {}
      }
    }, {
      sno: 14,
      name: "Qaria Muqadas Asaar",
      code: "1332",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "04:00": {
            s: "Muqadasah",
            a: "12",
            c: "Quran Tajweed",
            l: "Dilaram Raufi",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Bahishtah",
            a: "9",
            c: "Quran Tajweed",
            l: "Dilaram Raufi",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Alta",
            a: "13",
            c: "Basic/Quaida",
            l: "New York",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Simra",
            a: "11",
            c: "Quran",
            l: "Mashitha Ifthikar",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Muna",
            a: "7",
            c: "EN-Quaida",
            l: "Oregon",
            t: "0600 PM USA",
            f: []
          },
          "06:30": {
            s: "Self",
            a: "25",
            c: "Quran",
            l: "New York",
            t: "0930 PM USA",
            f: []
          },
          "07:00": {
            s: "Muzhda",
            a: "20",
            c: "Quran-Memorization",
            l: "Texas",
            t: "0900 PM USA",
            f: []
          },
          "07:30": {
            s: "Muzhgan",
            a: "18",
            c: "Quran-Memorization",
            l: "Texas",
            t: "0930 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 15,
      name: "Qaria Nida Sarwar",
      code: "5891",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": {
            s: "Fatima Toure",
            a: "4",
            c: "Basics/Quaida",
            l: "Mariam Toure",
            t: "0400 PM USA",
            f: []
          },
          "01:30": {
            s: "Jeebril",
            a: "6",
            c: "English Madni Quaida",
            l: "Pennsylvania",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Safa Mujtaba",
            a: "5",
            c: "Eng Madni Quaida",
            l: "Asma Mujtaba",
            t: "0400 PM USA",
            f: []
          },
          "02:30": {
            s: "Ramatee Sero",
            a: "13",
            c: "Quran",
            l: "Kamerya Abrahima",
            t: "0430 PM USA",
            f: []
          },
          "03:00": {
            s: "SubhanAllah",
            a: "5",
            c: "EN-Quaida",
            l: "Virginia",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Toheed",
            a: "3",
            c: "EN-Quaida",
            l: "Virginia",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Unknown",
            a: "",
            c: "English Noorani Quaida",
            l: "Lawouratou",
            t: "0600 PM USA",
            f: []
          },
          "04:30": {
            s: "Fatoumata Cheick Keita",
            a: "4",
            c: "Eng/ Noorani Quaida",
            l: "Pennsylvania",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Ramadan",
            a: "14",
            c: "Quran",
            l: "Minnesota",
            t: "0700 PM USA",
            f: []
          },
          "05:30": {
            s: "Bontu",
            a: "9",
            c: "Quran",
            l: "Minnesota",
            t: "0730PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 16,
      name: "Hafiza Samya",
      code: "5561",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": {
            s: "Zahra",
            a: "4",
            c: "EN-Quaida",
            l: "New Jersey",
            t: "0300 PM USA",
            f: []
          },
          "00:30": "F",
          "01:00": {
            s: "Fariba Tasnia",
            a: "8",
            c: "Quran",
            l: "Sumi Tasnia",
            t: "0400 PM USA",
            f: []
          },
          "01:30": {
            s: "Zainab",
            a: "18",
            c: "Quran",
            l: "Shaawa",
            t: "0100 PM USA",
            f: []
          },
          "02:00": {
            s: "Ibrahim",
            a: "6",
            c: "Quran",
            l: "Musa Jallow",
            t: "0500 PM USA",
            f: []
          },
          "02:30": "F",
          "03:00": "F",
          "03:30": "F",
          "04:00": {
            s: "Surraya",
            a: "8",
            c: "Quran",
            l: "Virginia",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Yahya",
            a: "4",
            c: "En-Quaida",
            l: "California",
            t: "",
            f: []
          },
          "05:00": {
            s: "Diya",
            a: "12",
            c: "Quran Tajweed",
            l: "Iman Mohammad",
            t: "0700 PM USA",
            f: []
          },
          "05:30": {
            s: "Dina",
            a: "09",
            c: "Quran Tajweed",
            l: "Iman Mohammad",
            t: "0730 PM USA",
            f: []
          }
        },
        Tue: {
          "03:30": {
            s: "Nabiha",
            a: "11",
            c: "Quran",
            l: "Seema",
            t: "0630 PM USA",
            f: []
          }
        },
        Wed: {},
        Thu: {
          "01:30": "F"
        },
        Fri: {
          "03:30": "F"
        }
      }
    }, {
      sno: 17,
      name: "Hafiza Saqeela Satti",
      code: "9610",
      location: "WFM",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": "F",
          "01:30": {
            s: "Faiza",
            a: "8",
            c: "English Noorani Quaida",
            l: "Ohio",
            t: "0430 PM USA",
            f: []
          },
          "02:00": {
            s: "Hanifa",
            a: "8",
            c: "English Noorani Quaida",
            l: "Ohio",
            t: "0500 PM USA",
            f: []
          },
          "02:30": {
            s: "Saidul Hussain",
            a: "13",
            c: "Quran",
            l: "Khurshida Begum",
            t: "0530 PM USA",
            f: ["Ramadan Leave"]
          },
          "03:00": {
            s: "Amara Kamarah",
            a: "9",
            c: "Quran",
            l: "Mariam Kromah",
            t: "0600 PM USA",
            f: []
          },
          "03:30": {
            s: "Safiatou",
            a: "7",
            c: "EN-Quaida",
            l: "Aisha Jalloh",
            t: "0630 PM USA",
            f: []
          },
          "04:00": {
            s: "Assata Kamarah",
            a: "12",
            c: "Quran",
            l: "Mariam Kromah",
            t: "0700 PM USA",
            f: []
          },
          "04:30": {
            s: "Makaisa Kamarah",
            a: "14",
            c: "Quran",
            l: "Mariam Kromah",
            t: "0730 PM USA",
            f: []
          },
          "05:00": {
            s: "Abdul Rahaman Haidara",
            a: "6",
            c: "Eng/ Noorani Quaida",
            l: "Pennsylvania",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Self",
            a: "40",
            c: "Basics/Quaida",
            l: "New York",
            t: "0830 PM USA",
            f: []
          },
          "06:00": {
            s: "Self",
            a: "40",
            c: "",
            l: "New York",
            t: "0900 PM USA",
            f: ["On Leave"]
          },
          "06:30": {
            s: "Surayya",
            a: "7",
            c: "Quran",
            l: "Mohamed Isaaq",
            t: "0630 PM USA",
            f: []
          },
          "07:00": {
            s: "Elyas",
            a: "8",
            c: "Quran+ Memorization",
            l: "Mohamed Isaaq",
            t: "0700 PM USA",
            f: []
          },
          "07:30": "F"
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {}
      }
    }, {
      sno: 18,
      name: "Qaria Shaista",
      code: "5756",
      location: "WFH",
      lead: "",
      schedule: {
        Mon: {
          "00:00": "F",
          "00:30": "F",
          "01:00": {
            s: "Samia",
            a: "18",
            c: "Quran Translation",
            l: "Toronto",
            t: "0400 PM CA",
            f: []
          },
          "01:30": {
            s: "Self",
            a: "36",
            c: "Quran Tajweed",
            l: "Polina Jibril",
            t: "0430 PM USA",
            f: ["Don't Change"]
          },
          "02:00": {
            s: "Amina",
            a: "21",
            c: "Quran withTajweed",
            l: "Dunia Isse",
            t: "0200 PM USA",
            f: []
          },
          "03:00": {
            s: "Raihan",
            a: "8",
            c: "Quran with Tajweed",
            l: "Texas",
            t: "0500 PM USA",
            f: ["Female Only"]
          },
          "03:30": {
            s: "Doyna",
            a: "10",
            c: "Quran with Tajweed",
            l: "Texas",
            t: "0530 PM USA",
            f: ["Female Only"]
          },
          "04:00": {
            s: "Lima",
            a: "5",
            c: "English Noorani Quaida",
            l: "Texas",
            t: "0600 PM USA",
            f: ["Female Only"]
          },
          "04:30": {
            s: "Mina",
            a: "14",
            c: "Quran with Tajweed and Ahadees",
            l: "Texas",
            t: "0630 PM USA",
            f: ["Female Only"]
          },
          "05:00": {
            s: "Hawa Hassan",
            a: "4",
            c: "Quran",
            l: "Lilla M Roba",
            t: "0800 PM USA",
            f: []
          },
          "05:30": {
            s: "Mabruka",
            a: "9",
            c: "Quran",
            l: "Alberta CA",
            t: "0630 PM CST",
            f: []
          },
          "06:00": {
            s: "Jamila",
            a: "11",
            c: "EN-Quaida",
            l: "Oregon",
            t: "0600 PM USA",
            f: []
          },
          "06:30": {
            s: "Self",
            a: "30",
            c: "Quran",
            l: "Bilkis Islam",
            t: "0930 PM USA",
            f: ["Female Only"]
          },
          "07:00": {
            s: "Self",
            a: "32",
            c: "Quran",
            l: "Aminata Kouyate",
            t: "1000 PM USA",
            f: []
          },
          "07:30": {
            s: "Sadia",
            a: "41",
            c: "Quran with Tajweed",
            l: "Will join on 13th April",
            t: "0200 PM USA",
            f: []
          }
        },
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {
          "06:30": "F"
        }
      }
    }]
  },
  Weekend: {
    slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    teachers: [{
      sno: 1,
      name: "Hafiz Abdullah",
      code: "9482",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "10:00": {
            s: "Muhammad",
            a: "10",
            c: "Quran",
            l: "Salmane Diop",
            t: "1000 PM USA",
            f: []
          },
          "11:00": "F",
          "12:00": {
            s: "Self",
            a: "35",
            c: "Quran Translation",
            l: "Toronto",
            t: "1100 AM CA",
            f: []
          }
        },
        Sun: {
          "10:00": {
            s: "Muhammad",
            a: "10",
            c: "Quran",
            l: "Salmane Diop",
            t: "1000 PM USA",
            f: []
          },
          "11:00": "F"
        }
      }
    }, {
      sno: 2,
      name: "Qari Awais",
      code: "6282",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": {
            s: "Ibrahim",
            a: "12",
            c: "Quran",
            l: "Musah Quaye",
            t: "0900 PM USA",
            f: []
          },
          "10:00": {
            s: "Faisal",
            a: "8",
            c: "Quran",
            l: "Roya",
            t: "1000 PM USA",
            f: ["Weekend"]
          }
        },
        Sun: {
          "09:00": "F",
          "10:00": {
            s: "Faisal",
            a: "8",
            c: "Quran",
            l: "Roya",
            t: "1000 PM USA",
            f: ["Weekend"]
          }
        }
      }
    }, {
      sno: 3,
      name: "Hafiz Faizan Mughal",
      code: "0731",
      location: "IBA",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "11:00": {
            s: "Faisal",
            a: "8",
            c: "Quran",
            l: "Roya",
            t: "1100 AM USA",
            f: ["Weekend Class"]
          },
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "11:00": {
            s: "Faisal",
            a: "8",
            c: "Quran",
            l: "Roya",
            t: "1100 AM USA",
            f: ["Weekend Class"]
          }
        }
      }
    }, {
      sno: 4,
      name: "Huma",
      code: "9234",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 5,
      name: "Hafiza Momina Akbar",
      code: "5719",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 6,
      name: "Qaria Nida Sarwar",
      code: "5891",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 7,
      name: "Hafiz Waqas Arshad",
      code: "2468",
      location: "IBA",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 8,
      name: "Hafiz Osama",
      code: "5867",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 9,
      name: "Qaria Faiza",
      code: "0773",
      location: "WFH",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 10,
      name: "Qari Faizan Khan",
      code: "6285",
      location: "IBA",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 11,
      name: "Hafiz Tayyab",
      code: "0074",
      location: "IBA",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }, {
      sno: 12,
      name: "Qari Saifullah",
      code: "1562",
      location: "IBA",
      lead: "Weekend Manager",
      schedule: {
        Sat: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        },
        Sun: {
          "09:00": "F",
          "10:00": "F",
          "11:00": "F",
          "12:00": "F",
          "13:00": "F",
          "14:00": "F"
        }
      }
    }]
  }
};

const BEHAV_OPTS = ["Excellent", "Good", "Needs Improvement", "Disruptive", "Restless/Distracted"];

const PERF_OPTS = ["Outstanding", "Very Good", "Satisfactory", "Below Average", "Struggling"];

const HW_OPTS = ["Completed", "Partially Done", "Not Done", "Not Assigned"];

const RECIT_OPTS = ["Fluent & Clear", "Good with Minor Errors", "Needs Practice", "Struggling", "N/A"];

const TAJ_OPTS = ["Excellent Tajweed", "Good - Few Mistakes", "Learning Rules", "Not Applying", "N/A"];

const ATT_OPTS = ["Present", "Absent", "Late", "Excused"];

const SLEAVE = ["Ramadan Leave", "Vacation", "Sick", "Family Emergency", "Schedule Change", "Financial Hold", "Other"];

const initStudents = [{
  id: 1,
  name: "Fanan Chowdhury",
  age: 10,
  parent: "Evan Chowdhury C/O Rehana Munni",
  course: "Quran",
  teacher: "Hafiz Abdullah Abbasi",
  code: "4947",
  country: "USA",
  state: "Florida",
  time: "0500 PM",
  dor: "2024-06-04",
  fee: "paid",
  status: "active",
  juz: 3,
  surah: "Al-Imran",
  page: 52,
  qaida: 0,
  lastLesson: "Surah Al-Imran ayah 45-52",
  lastDate: "2026-04-16",
  attendance: 95,
  totalClasses: 180,
  attended: 171,
  notes: "",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Good - Few Mistakes"
}, {
  id: 2,
  name: "Mohammed Misbahuddin",
  age: 7,
  parent: "MD Raziuddin",
  course: "Quran",
  teacher: "Hafiz Abdullah Abbasi",
  code: "4947",
  country: "USA",
  state: "Georgia",
  time: "0530 PM",
  dor: "2024-11-22",
  fee: "paid",
  status: "active",
  juz: 1,
  surah: "Al-Baqarah",
  page: 12,
  qaida: 0,
  lastLesson: "Surah Al-Baqarah ayah 30-35",
  lastDate: "2026-04-16",
  attendance: 92,
  totalClasses: 120,
  attended: 110,
  notes: "",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "Needs Practice",
  lT: "Learning Rules"
}, {
  id: 3,
  name: "Musah",
  age: 6,
  parent: "King Mohamed",
  course: "Quran",
  teacher: "Hafiz Abdullah Abbasi",
  code: "4947",
  country: "USA",
  state: "Pennsylvania",
  time: "0630 PM",
  dor: "2023-09-04",
  fee: "paid",
  status: "active",
  juz: 2,
  surah: "Al-Baqarah",
  page: 35,
  qaida: 0,
  lastLesson: "Surah Al-Baqarah ayah 240-245",
  lastDate: "2026-04-16",
  attendance: 88,
  totalClasses: 220,
  attended: 194,
  notes: "",
  lB: "Needs Improvement",
  lP: "Below Average",
  lH: "Partially Done",
  lR: "Needs Practice",
  lT: "Not Applying"
}, {
  id: 4,
  name: "Eltaf",
  age: 6,
  parent: "Zamir F/O Khadija",
  course: "EN-Quaida",
  teacher: "Hafiz Abdullah Abbasi",
  code: "4947",
  country: "USA",
  state: "Texas",
  time: "0600 PM",
  dor: "2025-09-11",
  fee: "paid",
  status: "active",
  juz: 0,
  surah: "",
  page: 0,
  qaida: 18,
  lastLesson: "Qaida Page 18 - Zabar Zair Paish",
  lastDate: "2026-04-16",
  attendance: 90,
  totalClasses: 85,
  attended: 77,
  notes: "ADHD · Zabar Zair Paish",
  lB: "Restless/Distracted",
  lP: "Below Average",
  lH: "Not Done",
  lR: "N/A",
  lT: "N/A"
}, {
  id: 5,
  name: "Kenane",
  age: 12,
  parent: "Kevin",
  course: "Quran-Memo",
  teacher: "Hafiz Aftab",
  code: "6907",
  country: "USA",
  state: "New York",
  time: "0400 PM",
  dor: "2025-07-17",
  fee: "paid",
  status: "active",
  juz: 5,
  surah: "An-Nisa",
  page: 92,
  qaida: 0,
  lastLesson: "Memorization Juz 5 ayah 24-28",
  lastDate: "2026-04-16",
  attendance: 96,
  totalClasses: 60,
  attended: 58,
  notes: "",
  lB: "Excellent",
  lP: "Outstanding",
  lH: "Completed",
  lR: "Fluent & Clear",
  lT: "Excellent Tajweed"
}, {
  id: 6,
  name: "Loay",
  age: 13,
  parent: "Kevin",
  course: "Quran-Memo",
  teacher: "Hafiz Aftab",
  code: "6907",
  country: "USA",
  state: "New York",
  time: "0430 PM",
  dor: "2024-04-18",
  fee: "paid",
  status: "active",
  juz: 7,
  surah: "Al-An'am",
  page: 130,
  qaida: 0,
  lastLesson: "Memorization Juz 7 revision",
  lastDate: "2026-04-16",
  attendance: 94,
  totalClasses: 150,
  attended: 141,
  notes: "",
  lB: "Good",
  lP: "Very Good",
  lH: "Completed",
  lR: "Fluent & Clear",
  lT: "Good - Few Mistakes"
}, {
  id: 7,
  name: "Nubair",
  age: 6,
  parent: "Seema",
  course: "Quran",
  teacher: "Hafiz Aftab",
  code: "6907",
  country: "USA",
  state: "New York",
  time: "0530 PM",
  dor: "2023-08-01",
  fee: "overdue",
  status: "active",
  juz: 2,
  surah: "Al-Baqarah",
  page: 28,
  qaida: 0,
  lastLesson: "Surah Al-Baqarah ayah 200-210",
  lastDate: "2026-04-15",
  attendance: 85,
  totalClasses: 250,
  attended: 213,
  notes: "Fee overdue since March",
  lB: "Needs Improvement",
  lP: "Below Average",
  lH: "Not Done",
  lR: "Needs Practice",
  lT: "Not Applying"
}, {
  id: 8,
  name: "Muhammad Diao",
  age: 9,
  parent: "Ibrahima Diallo C/O Mahamadou Moussa",
  course: "Quran+Memo+Islamic Ed",
  teacher: "Hafiz Aftab",
  code: "6907",
  country: "USA",
  state: "Iowa",
  time: "0500 PM",
  dor: "2025-07-25",
  fee: "paid",
  status: "active",
  juz: 1,
  surah: "Al-Fatihah",
  page: 5,
  qaida: 0,
  lastLesson: "Small Surahs - Surah Al-Fil",
  lastDate: "2026-04-16",
  attendance: 91,
  totalClasses: 55,
  attended: 50,
  notes: "",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Learning Rules"
}, {
  id: 9,
  name: "Hanzala",
  age: 19,
  parent: "Tanjia Sarker C/O Haseeb Mia",
  course: "Quran",
  teacher: "Hafiz Aftab",
  code: "6907",
  country: "USA",
  state: "New York",
  time: "0830 PM",
  dor: "2025-01-17",
  fee: "overdue",
  status: "active",
  juz: 10,
  surah: "Al-Anfal",
  page: 178,
  qaida: 0,
  lastLesson: "Surah Al-Anfal ayah 55-60",
  lastDate: "2026-04-14",
  attendance: 78,
  totalClasses: 100,
  attended: 78,
  notes: "Irregular attendance",
  lB: "Good",
  lP: "Below Average",
  lH: "Not Done",
  lR: "Needs Practice",
  lT: "Learning Rules"
}, {
  id: 10,
  name: "Rayyan",
  age: 7,
  parent: "Cena Mohammed",
  course: "Quran",
  teacher: "Hafiz Amanullah",
  code: "0872",
  country: "UK",
  state: "Manchester",
  time: "0530 PM",
  dor: "2023-07-04",
  fee: "paid",
  status: "active",
  juz: 3,
  surah: "Al-Imran",
  page: 55,
  qaida: 0,
  lastLesson: "Surah Al-Imran ayah 60-68",
  lastDate: "2026-04-16",
  attendance: 93,
  totalClasses: 240,
  attended: 223,
  notes: "",
  lB: "Excellent",
  lP: "Very Good",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Good - Few Mistakes"
}, {
  id: 11,
  name: "Ibrahim",
  age: 16,
  parent: "Salimata C/O Aissata",
  course: "Quran",
  teacher: "Hafiz Amanullah",
  code: "0872",
  country: "USA",
  state: "Philadelphia",
  time: "0600 PM",
  dor: "2025-04-09",
  fee: "paid",
  status: "active",
  juz: 4,
  surah: "An-Nisa",
  page: 78,
  qaida: 0,
  lastLesson: "Surah An-Nisa ayah 1-8",
  lastDate: "2026-04-16",
  attendance: 97,
  totalClasses: 80,
  attended: 78,
  notes: "",
  lB: "Excellent",
  lP: "Outstanding",
  lH: "Completed",
  lR: "Fluent & Clear",
  lT: "Good - Few Mistakes"
}, {
  id: 12,
  name: "Tawfiq",
  age: 13,
  parent: "Sophia W/O Abdul Mustafa",
  course: "Quran",
  teacher: "Qari Faizan Khan",
  code: "6285",
  country: "USA",
  state: "New York",
  time: "0830 PM",
  dor: "2024-04-01",
  fee: "paid",
  status: "leave",
  juz: 6,
  surah: "Al-Ma'idah",
  page: 110,
  qaida: 0,
  lastLesson: "Last class before Ramadan",
  lastDate: "2026-02-28",
  attendance: 88,
  totalClasses: 140,
  attended: 123,
  notes: "Ramadan Leave",
  lvType: "Ramadan Leave",
  lvFrom: "2026-02-28",
  lvTo: "2026-04-01",
  lvReason: "Ramadan schedule",
  fu1: "WhatsApp sent 27-Mar",
  fu2: "Will resume after Eid",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Learning Rules"
}, {
  id: 13,
  name: "Muhammad",
  age: 11,
  parent: "Bineta Laye",
  course: "Quran",
  teacher: "Qari Faizan Khan",
  code: "6285",
  country: "USA",
  state: "Tennessee",
  time: "0430 PM",
  dor: "2021-08-24",
  fee: "paid",
  status: "active",
  juz: 12,
  surah: "Hud",
  page: 220,
  qaida: 0,
  lastLesson: "Surah Hud ayah 80-88",
  lastDate: "2026-04-16",
  attendance: 98,
  totalClasses: 400,
  attended: 392,
  notes: "Don't Change Teacher",
  lB: "Excellent",
  lP: "Outstanding",
  lH: "Completed",
  lR: "Fluent & Clear",
  lT: "Excellent Tajweed"
}, {
  id: 14,
  name: "Ali",
  age: 15,
  parent: "Bineta Laye",
  course: "Quran",
  teacher: "Qari Faizan Khan",
  code: "6285",
  country: "USA",
  state: "Tennessee",
  time: "0500 PM",
  dor: "2021-08-24",
  fee: "paid",
  status: "active",
  juz: 15,
  surah: "Al-Isra",
  page: 284,
  qaida: 0,
  lastLesson: "Surah Al-Isra ayah 45-55",
  lastDate: "2026-04-16",
  attendance: 97,
  totalClasses: 400,
  attended: 388,
  notes: "Don't Change Teacher",
  lB: "Excellent",
  lP: "Outstanding",
  lH: "Completed",
  lR: "Fluent & Clear",
  lT: "Excellent Tajweed"
}, {
  id: 15,
  name: "Aleja",
  age: 10,
  parent: "Abdyl Aziz Jonuzi",
  course: "Quran",
  teacher: "Farhan Awan",
  code: "0101",
  country: "USA",
  state: "Missouri",
  time: "0500 PM",
  dor: "2023-03-24",
  fee: "paid",
  status: "active",
  juz: 4,
  surah: "An-Nisa",
  page: 82,
  qaida: 0,
  lastLesson: "Surah An-Nisa ayah 20-28",
  lastDate: "2026-04-16",
  attendance: 91,
  totalClasses: 260,
  attended: 237,
  notes: "",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Partially Done",
  lR: "Good with Minor Errors",
  lT: "Learning Rules"
}, {
  id: 16,
  name: "Ammar",
  age: 11,
  parent: "Hikmet Bekri",
  course: "Saudi Quran",
  teacher: "Farhan Awan",
  code: "0101",
  country: "USA",
  state: "California",
  time: "0400 PM",
  dor: "2022-03-15",
  fee: "paid",
  status: "active",
  juz: 8,
  surah: "Al-A'raf",
  page: 155,
  qaida: 0,
  lastLesson: "Surah Al-A'raf ayah 150-157",
  lastDate: "2026-04-16",
  attendance: 94,
  totalClasses: 340,
  attended: 320,
  notes: "",
  lB: "Good",
  lP: "Very Good",
  lH: "Completed",
  lR: "Fluent & Clear",
  lT: "Good - Few Mistakes"
}, {
  id: 17,
  name: "Lewi",
  age: 9,
  parent: "Bastan Gul",
  course: "Quran",
  teacher: "Hafiz Waqas Arshad",
  code: "2468",
  country: "USA",
  state: "Virginia",
  time: "0830 PM",
  dor: "2022-09-15",
  fee: "paid",
  status: "active",
  juz: 6,
  surah: "Al-Ma'idah",
  page: 115,
  qaida: 0,
  lastLesson: "Surah Al-Ma'idah ayah 100-108",
  lastDate: "2026-04-16",
  attendance: 96,
  totalClasses: 300,
  attended: 288,
  notes: "Don't Change Teacher",
  lB: "Good",
  lP: "Very Good",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Good - Few Mistakes"
}, {
  id: 18,
  name: "Sana Nasiri",
  age: 6,
  parent: "Aziz C/O Ahmad Qayyum",
  course: "EN-Quaida",
  teacher: "Qaria Arooj Zareen",
  code: "9160",
  country: "USA",
  state: "New York",
  time: "0500 PM",
  dor: "2025-11-07",
  fee: "paid",
  status: "active",
  juz: 0,
  surah: "",
  page: 0,
  qaida: 12,
  lastLesson: "Qaida Page 12 - Compound Letters",
  lastDate: "2026-04-16",
  attendance: 89,
  totalClasses: 40,
  attended: 36,
  notes: "",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "N/A",
  lT: "N/A"
}, {
  id: 19,
  name: "Amina Diop",
  age: 3,
  parent: "Thierno Diop",
  course: "EN-Quaida",
  teacher: "Qaria Arooj Zareen",
  code: "9160",
  country: "USA",
  state: "Texas",
  time: "0430 PM",
  dor: "2025-05-27",
  fee: "paid",
  status: "active",
  juz: 0,
  surah: "",
  page: 0,
  qaida: 6,
  lastLesson: "Qaida Page 6 - Single Letters",
  lastDate: "2026-04-16",
  attendance: 82,
  totalClasses: 70,
  attended: 57,
  notes: "Don't Change · Age 3",
  lB: "Restless/Distracted",
  lP: "Below Average",
  lH: "Not Assigned",
  lR: "N/A",
  lT: "N/A"
}, {
  id: 20,
  name: "Zohal",
  age: 6,
  parent: "Abdul Hadi C/O Mahmood",
  course: "Eng/Noorani Quaida",
  teacher: "Qaria Arooj Zareen",
  code: "9160",
  country: "USA",
  state: "Virginia",
  time: "0800 PM",
  dor: "2025-05-27",
  fee: "paid",
  status: "active",
  juz: 0,
  surah: "",
  page: 0,
  qaida: 15,
  lastLesson: "Qaida Page 15 - Zabar Zair Paish",
  lastDate: "2026-04-16",
  attendance: 90,
  totalClasses: 70,
  attended: 63,
  notes: "Zabar Zeer Paish",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "N/A",
  lT: "N/A"
}, {
  id: 21,
  name: "Raihan",
  age: 8,
  parent: "Barak Ibrahimi",
  course: "Quran with Tajweed",
  teacher: "Qaria Shaista",
  code: "5756",
  country: "USA",
  state: "Texas",
  time: "0500 PM",
  dor: "2022-06-17",
  fee: "paid",
  status: "active",
  juz: 5,
  surah: "An-Nisa",
  page: 95,
  qaida: 0,
  lastLesson: "Tajweed - Idgham practice",
  lastDate: "2026-04-16",
  attendance: 95,
  totalClasses: 320,
  attended: 304,
  notes: "Only Female Teacher",
  lB: "Excellent",
  lP: "Very Good",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Good - Few Mistakes"
}, {
  id: 22,
  name: "Ruqia",
  age: 8,
  parent: "Zamir F/O Khadija",
  course: "EN-Quaida",
  teacher: "Qaria Kanwal",
  code: "7111",
  country: "USA",
  state: "Texas",
  time: "0600 PM",
  dor: "2025-09-11",
  fee: "paid",
  status: "active",
  juz: 0,
  surah: "",
  page: 0,
  qaida: 10,
  lastLesson: "Qaida Page 10 - Zabar Zair Paish",
  lastDate: "2026-04-16",
  attendance: 87,
  totalClasses: 90,
  attended: 78,
  notes: "ADHD · Zabar Zair Paish",
  lB: "Restless/Distracted",
  lP: "Below Average",
  lH: "Partially Done",
  lR: "N/A",
  lT: "N/A"
}, {
  id: 23,
  name: "Fabiha",
  age: 5,
  parent: "Mohammad Burhan uddin",
  course: "EN-Quaida",
  teacher: "Qaria Saba Noor",
  code: "1175",
  country: "Canada",
  state: "Ontario",
  time: "0530 PM CA",
  dor: "2022-02-08",
  fee: "paid",
  status: "active",
  juz: 0,
  surah: "",
  page: 0,
  qaida: 28,
  lastLesson: "Qaida Complete - Starting Quran",
  lastDate: "2026-04-16",
  attendance: 93,
  totalClasses: 350,
  attended: 326,
  notes: "Camera Class",
  lB: "Good",
  lP: "Very Good",
  lH: "Completed",
  lR: "N/A",
  lT: "N/A"
}, {
  id: 24,
  name: "Montasir",
  age: 0,
  parent: "Mohammad Sarkar",
  course: "Quran-Taj",
  teacher: "Faizan Mughal",
  code: "0731",
  country: "USA",
  state: "New York",
  time: "",
  dor: "2024-01-01",
  fee: "n/a",
  status: "quit",
  juz: 8,
  surah: "",
  page: 0,
  qaida: 0,
  lastLesson: "Course completed",
  lastDate: "2026-01-01",
  attendance: 0,
  totalClasses: 0,
  attended: 0,
  notes: "Course completed",
  qDate: "2026-01-01",
  qReason: "Course completed",
  lB: "",
  lP: "",
  lH: "",
  lR: "",
  lT: ""
}, {
  id: 25,
  name: "Self (MD Ayyan)",
  age: 30,
  parent: "MD Ayyan",
  course: "Quran",
  teacher: "Hafiz Waqas Arshad",
  code: "2468",
  country: "USA",
  state: "New York",
  time: "1030 PM",
  dor: "2024-10-22",
  fee: "paid",
  status: "leave",
  juz: 4,
  surah: "An-Nisa",
  page: 75,
  qaida: 0,
  lastLesson: "On Ramadan Leave",
  lastDate: "2026-02-18",
  attendance: 85,
  totalClasses: 100,
  attended: 85,
  notes: "Ramadan Leave",
  lvType: "Ramadan Leave",
  lvFrom: "2026-02-18",
  lvTo: "2026-03-31",
  lvReason: "Ramadan schedule",
  fu1: "WhatsApp - Not answered",
  fu2: "Will let us know schedule",
  lB: "Good",
  lP: "Satisfactory",
  lH: "Completed",
  lR: "Good with Minor Errors",
  lT: "Learning Rules"
}];

const SHIFT_REASONS = ["Teacher Resigned", "Teacher Terminated", "Teacher on Leave", "Teacher Sick Leave", "Ramadan Time Change", "Time Change Request", "Parent Request", "Student Request", "Performance Issue", "Teacher Female Only", "Camera Class Required", "Age Mismatch", "ADHD Special Needs", "Schedule Conflict", "Other"];

const FEEDBACK_OPTS = ["Pending", "Satisfied", "Not Satisfied", "On Hold", "Needs Follow-up", "Resolved"];

const SPS_OPTS = ["Pending", "Conveyed", "Not Required"];

const initShifts = [{
  id: 1,
  sno: 229,
  date: "2026-04-09",
  lead: "Hira Shah",
  student: "Moiz",
  fromT: "Shayan",
  fromTime: "0330AM",
  fromLead: "Qazi Junaid",
  toT: "Abdullah Waseem",
  toTime: "0330AM",
  toLead: "Qazi Junaid",
  reason: "Shayan Resigned",
  sps: "yes",
  feedback: ""
}, {
  id: 2,
  sno: 228,
  date: "2026-04-09",
  lead: "Mohammad Kadir",
  student: "Nouhan",
  fromT: "Shayan",
  fromTime: "0300AM",
  fromLead: "Qazi Junaid",
  toT: "Suleman",
  toTime: "0300AM",
  toLead: "Qazi Junaid",
  reason: "Shayan Resigned",
  sps: "yes",
  feedback: ""
}, {
  id: 3,
  sno: 227,
  date: "2026-04-09",
  lead: "Seema ",
  student: "Nubair",
  fromT: "Shayan",
  fromTime: "0230AM",
  fromLead: "Qazi Junaid",
  toT: "Afatb",
  toTime: "0230AM",
  toLead: "Qazi Junaid",
  reason: "Shayan Resigned",
  sps: "yes",
  feedback: ""
}, {
  id: 4,
  sno: 226,
  date: "2026-03-28",
  lead: "Ghazal Zeeshan",
  student: "Shayan",
  fromT: "Farhan AWAN",
  fromTime: "0600AM",
  fromLead: "Qazi Junaid",
  toT: "Saifullah",
  toTime: "0400AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 5,
  sno: 225,
  date: "2026-03-10",
  lead: "Ghazal Zeeshan",
  student: "Shayn",
  fromT: "Uzair",
  fromTime: "0600AM",
  fromLead: "Qazi Junaid",
  toT: "Frahan Awan",
  toTime: "0600AM",
  toLead: "Qazi Junaid",
  reason: "Someone often join during Shayan Class",
  sps: "yes",
  feedback: ""
}, {
  id: 6,
  sno: 224,
  date: "2026-03-10",
  lead: "Abu C/O Mustapha Konte",
  student: "Amina",
  fromT: "Farhan",
  fromTime: "0630AM",
  fromLead: "Qazi Junaid",
  toT: "Uzair",
  toTime: "0630AM",
  toLead: "Qazi Junaid",
  reason: "",
  sps: "yes",
  feedback: ""
}, {
  id: 7,
  sno: 223,
  date: "2026-03-10",
  lead: "Abu C/O Mustapha Konte",
  student: "Usman",
  fromT: "Farhan",
  fromTime: "0600AM",
  fromLead: "Qazi Junaid",
  toT: "Uzair",
  toTime: "0600AM",
  toLead: "Qazi Junaid",
  reason: "Ghazal Zeeshan (Shayn) is shifted to Farhan",
  sps: "yes",
  feedback: ""
}, {
  id: 8,
  sno: 220,
  date: "2026-02-25",
  lead: "Maryam Aleemi",
  student: "Self",
  fromT: "Momina",
  fromTime: "0530 AM",
  fromLead: "Faizan Khan",
  toT: "Muqadas Asaar",
  toTime: "0700 AM",
  toLead: "Faizan Khan",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 9,
  sno: 218,
  date: "2026-02-18",
  lead: "Mojibor Rahman C/O Biswas",
  student: "Sadia-41",
  fromT: "Shaista",
  fromTime: "0830 AM",
  fromLead: "Faizan Khan",
  toT: "Shaista",
  toTime: "1200 AM",
  toLead: "Faizan Khan",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 10,
  sno: 219,
  date: "2026-02-18",
  lead: "Yalda W/O Najeebullah",
  student: "Muzhda, Muzhghan",
  fromT: "Muqaddus",
  fromTime: "0800 AM",
  fromLead: "Faizan Khan",
  toT: "Muqaddus",
  toTime: "0830 AM",
  toLead: "Faizan Khan",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 11,
  sno: 217,
  date: "2026-02-18",
  lead: "Mohammadullah Majbor",
  student: "Navida, Aryana, Azeem Weqas",
  fromT: "Saba Noor",
  fromTime: "0300 AM",
  fromLead: "Faizan",
  toT: "Saba Noor",
  toTime: "0100 AM",
  toLead: "Fazan",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 12,
  sno: 222,
  date: "2026-02-06",
  lead: "Salma Nori",
  student: "Fatima",
  fromT: "Hafsa",
  fromTime: "",
  fromLead: "Esha",
  toT: "Ayesha",
  toTime: "",
  toLead: "Esha",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 13,
  sno: 221,
  date: "2026-02-05",
  lead: "Salma Nori",
  student: "Omer",
  fromT: "Hafsa",
  fromTime: "",
  fromLead: "Esha",
  toT: "Ayesha",
  toTime: "",
  toLead: "Esha",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 14,
  sno: 216,
  date: "2026-01-31",
  lead: "Salmane Diop",
  student: "Muhammad",
  fromT: "Haris",
  fromTime: "1000PM",
  fromLead: "Shakeel",
  toT: "Waqas",
  toTime: "1000PM",
  toLead: "Weekend Manager",
  reason: "Parent Request to take class on weekend",
  sps: "yes",
  feedback: ""
}, {
  id: 15,
  sno: 215,
  date: "2026-01-17",
  lead: "Mohamed Isaaq",
  student: "Elyas",
  fromT: "Faizan Mughal",
  fromTime: "0800 AM",
  fromLead: "Junaid ",
  toT: "Amanullah",
  toTime: "0700 AM",
  toLead: "Junaid",
  reason: "Making a slot for New Referral",
  sps: "yes",
  feedback: ""
}, {
  id: 16,
  sno: 214,
  date: "2026-01-17",
  lead: "Mohamed Isaaq",
  student: "Surraya",
  fromT: "Esha",
  fromTime: "0730 AM",
  fromLead: "Faizan",
  toT: "Amanullah",
  toTime: "0630 AM",
  toLead: "Junaid",
  reason: "Making a slot for New Referral",
  sps: "yes",
  feedback: ""
}, {
  id: 17,
  sno: 213,
  date: "2026-01-17",
  lead: "Anat Odunola Adele ",
  student: "Self",
  fromT: "Esha",
  fromTime: "0130 AM",
  fromLead: "Faizan",
  toT: "Muqaddus",
  toTime: "0530 PM",
  toLead: "Shakeel",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 18,
  sno: 212,
  date: "2026-01-08",
  lead: "Evan Chowdhary C/O Rehana Munni",
  student: "Fanan",
  fromT: "Abdullah Atd",
  fromTime: "0400AM",
  fromLead: "Qazi Junaid",
  toT: "Asim",
  toTime: "0400AM",
  toLead: "Qazi Junaid",
  reason: "Making a slot for New Referral",
  sps: "yes",
  feedback: ""
}, {
  id: 19,
  sno: 211,
  date: "2026-01-07",
  lead: "Tahara C/O Aoua Keita",
  student: "Self",
  fromT: "Abu Bakar",
  fromTime: "1200 AM",
  fromLead: "Shakil",
  toT: "Awais",
  toTime: "0500 AM",
  toLead: "Junaid",
  reason: "Teacher change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 20,
  sno: 210,
  date: "2025-12-30",
  lead: "Manizha Akbarzada",
  student: "Bareen, Rafi, Sama",
  fromT: "Atika",
  fromTime: "0730 AM",
  fromLead: "Faizan Khan",
  toT: "Saifullah",
  toTime: "0730 AM",
  toLead: "Faizan Khan",
  reason: "Teacher change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 21,
  sno: 209,
  date: "2025-12-21",
  lead: "Tahara C/O Aoua Keita",
  student: "Self",
  fromT: "Awais",
  fromTime: "0500AM",
  fromLead: "Qazi Junaid",
  toT: "Abu Bakar",
  toTime: "1200AM",
  toLead: "Shakeel",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 22,
  sno: 208,
  date: "2025-12-11",
  lead: "Fatna Khamis",
  student: "Aida",
  fromT: "Arooj",
  fromTime: "0230 AM",
  fromLead: "Faizan Khan",
  toT: "Ezba rasheed",
  toTime: "0230 AM",
  toLead: "Faizan Khan",
  reason: "Parents request to change the teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 23,
  sno: 207,
  date: "2025-12-10",
  lead: "Mada C/O Nyima Sanyang",
  student: "Nyima",
  fromT: "Arooj",
  fromTime: "0630 AM",
  fromLead: "Faizan Khan",
  toT: "Madiha",
  toTime: "0530 AM",
  toLead: "Faizan Khan",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 24,
  sno: 206,
  date: "2025-12-10",
  lead: "Mahmood Suleimany",
  student: "Shamim & Bashita",
  fromT: "Madiha",
  fromTime: "0630 AM",
  fromLead: "Faizan Khan",
  toT: "Arooj",
  toTime: "0600 AM",
  toLead: "Faizan Khan",
  reason: "Parents request to change the teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 25,
  sno: 204,
  date: "2025-12-04",
  lead: "Jawid",
  student: "Norid",
  fromT: "Samya",
  fromTime: "0600AM",
  fromLead: "Faizan Khan",
  toT: "Tayyab",
  toTime: "0600AM",
  toLead: "Qazi Junaid",
  reason: "Parents request to change the teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 26,
  sno: 203,
  date: "2025-12-04",
  lead: "Jawid",
  student: "Jahid",
  fromT: "Samya",
  fromTime: "0530AM",
  fromLead: "Faizan Khan",
  toT: "Tayyab",
  toTime: "0530AM",
  toLead: "Qazi Junaid",
  reason: "Parents request to change the teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 27,
  sno: 205,
  date: "2025-12-04",
  lead: "Jawid",
  student: "Javida",
  fromT: "Samya",
  fromTime: "0630AM",
  fromLead: "faizan Khan",
  toT: "Saba Noor",
  toTime: "0630AM",
  toLead: "Qazi Junaid",
  reason: "Parents request to change the teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 28,
  sno: 202,
  date: "2025-12-02",
  lead: "Shouruq Hamdan",
  student: "Omayma",
  fromT: "Waqas",
  fromTime: "0230AM",
  fromLead: "Qazi Junaid",
  toT: "Shayan",
  toTime: "0230AM",
  toLead: "Qazi Junaid",
  reason: "Sireh Bah another kid schedule with Waqas",
  sps: "yes",
  feedback: ""
}, {
  id: 29,
  sno: 201,
  date: "2025-11-26",
  lead: "Roya",
  student: "Faisal ",
  fromT: "Faizan Mughal",
  fromTime: "0700AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Mughal",
  toTime: "0600AM",
  toLead: "Qazi Junaid",
  reason: "Shifted on weekends",
  sps: "yes",
  feedback: ""
}, {
  id: 30,
  sno: 200,
  date: "2025-11-20",
  lead: "Jawid",
  student: "Zahoor",
  fromT: "Waqas",
  fromTime: "0800 PM",
  fromLead: "Qazi Junaid",
  toT: "Saifullah",
  toTime: "0800 AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 31,
  sno: 299,
  date: "2025-11-14",
  lead: "Jawid",
  student: "Jalil",
  fromT: "Uzair",
  fromTime: "0100AM",
  fromLead: "Qazi Junaid",
  toT: "Saifullah",
  toTime: "0100AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 32,
  sno: 398,
  date: "2025-11-14",
  lead: "Jawid",
  student: "Zahoor",
  fromT: "Uzair",
  fromTime: "0800AM",
  fromLead: "Qazi Junaid",
  toT: "Waqas",
  toTime: "0800PM",
  toLead: "Shakeel",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 33,
  sno: 397,
  date: "2025-11-14",
  lead: "Jawid",
  student: "Jamil",
  fromT: "Uzair",
  fromTime: "0100AM",
  fromLead: "Qazi Junaid",
  toT: "Waqas",
  toTime: "0730PM",
  toLead: "Shakeel",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 34,
  sno: 396,
  date: "2025-11-05",
  lead: "Seema ",
  student: "Nubair",
  fromT: "Awais",
  fromTime: "0400AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Mughal",
  toTime: "0330AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 35,
  sno: 395,
  date: "2025-11-01",
  lead: "Saheena Patel",
  student: "Rayan",
  fromT: "Awais",
  fromTime: "0400AM",
  fromLead: "Qazi Junaid",
  toT: "Aftab",
  toTime: "0400AM",
  toLead: "Qazi Junaid",
  reason: "Parents request to change teacher. Reluctant to complain about teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 36,
  sno: 392,
  date: "2025-10-22",
  lead: "Zainaba",
  student: "Nazeera",
  fromT: "Asim",
  fromTime: "0630AM",
  fromLead: "Qazi Junaid",
  toT: "Aftab",
  toTime: "0800AM",
  toLead: "Waqas",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 37,
  sno: 393,
  date: "2025-10-22",
  lead: "Zainaba",
  student: "Mubeena",
  fromT: "Asim",
  fromTime: "0700AM",
  fromLead: "Qazi Junaid",
  toT: "Aftab",
  toTime: "0830AM",
  toLead: "Waqas",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 38,
  sno: 394,
  date: "2025-10-22",
  lead: "Zainaba",
  student: "Muntaha",
  fromT: "Asim",
  fromTime: "0730AM",
  fromLead: "Qazi Junaid",
  toT: "Aftab",
  toTime: "0900AM",
  toLead: "Waqas",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 39,
  sno: 391,
  date: "2025-10-14",
  lead: "Nurat Medinat C/O Anat Odunola",
  student: "Miftaah",
  fromT: "Faizan Qamar",
  fromTime: "0600AM",
  fromLead: "Qazi Junaid",
  toT: "Danyal",
  toTime: "0600AM",
  toLead: "Qazi Junaid",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 40,
  sno: 390,
  date: "2025-10-14",
  lead: "Dilaram Raufi",
  student: "Bahishta",
  fromT: "Faizan Qamar",
  fromTime: "0500AM",
  fromLead: "Qazi Junaid",
  toT: "Muqadas Asaar",
  toTime: "0500AM",
  toLead: "Faizan Khan",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 41,
  sno: 389,
  date: "2025-10-14",
  lead: "Dilaram Raufi",
  student: "Muqadash",
  fromT: "Faizan Qamar",
  fromTime: "0430AM",
  fromLead: "Qazi Junaid",
  toT: "Muqadas Asaar",
  toTime: "0430AM",
  toLead: "Faizan Khan",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 42,
  sno: 388,
  date: "2025-10-14",
  lead: "Aicha Badialo Sow",
  student: "Asatou",
  fromT: "Faizan Qamar",
  fromTime: "1230AM",
  fromLead: "Qazi Junaid",
  toT: "Nadeem",
  toTime: "1230AM",
  toLead: "Qazi Junaid",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 43,
  sno: 387,
  date: "2025-10-14",
  lead: "Faisal Olol C/O Mohammed Isaaq",
  student: "Jacob",
  fromT: "Faizan Qamar",
  fromTime: "0330AM",
  fromLead: "Qazi Junaid",
  toT: "Nadeem",
  toTime: "0330AM",
  toLead: "Qazi Junaid",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 44,
  sno: 386,
  date: "2025-10-14",
  lead: "Evan Chowdhary C/O Rehana Munni",
  student: "Fanan",
  fromT: "Faizan Qamar",
  fromTime: "0300AM",
  fromLead: "Qazi Junaid",
  toT: "Abdullah Atd",
  toTime: "0300AM",
  toLead: "Qazi Junaid",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 45,
  sno: 385,
  date: "2025-10-14",
  lead: "Aisha M/O Ibrahim",
  student: "Ibrahim",
  fromT: "Faizan Qamar",
  fromTime: "0130AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Mughal",
  toTime: "0130AM",
  toLead: "Qazi Junaid",
  reason: "Faizan Qamar Resigined",
  sps: "yes",
  feedback: ""
}, {
  id: 46,
  sno: 384,
  date: "2025-10-14",
  lead: "Oladokun Aiyepola",
  student: "Abu Bakar",
  fromT: "Waqas",
  fromTime: "0500 PM",
  fromLead: "Waqas",
  toT: "Aftab",
  toTime: "0330 AM",
  toLead: "Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 47,
  sno: 383,
  date: "2025-10-08",
  lead: "Sophia W/O Abdul Mutafa",
  student: "Tawfiq",
  fromT: "Aftab",
  fromTime: "0330AM",
  fromLead: "Qazi Junaid",
  toT: "Danyal",
  toTime: "0430AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 48,
  sno: 381,
  date: "2025-10-08",
  lead: "Mehrin Farija",
  student: "Self",
  fromT: "Faizan Qamar",
  fromTime: "0530AM",
  fromLead: "Qazi Junaid",
  toT: "Esha",
  toTime: "0400PM",
  toLead: "Shakeel",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 49,
  sno: 379,
  date: "2025-10-04",
  lead: "Amina Dakebo C/O Kamerya Abrahima",
  student: "Dureeti",
  fromT: "Muqadus",
  fromTime: "0600 AM",
  fromLead: "Hifza",
  toT: "Momina",
  toTime: "0600 AM",
  toLead: "Hifza",
  reason: "No Complainst",
  sps: "yes",
  feedback: ""
}, {
  id: 50,
  sno: 380,
  date: "2025-10-04",
  lead: "Zaharai",
  student: "Ayesha & Hayat",
  fromT: "Momina",
  fromTime: "0600-0700 ",
  fromLead: "Hifza",
  toT: "Atika",
  toTime: "0700-0800 ",
  toLead: "Hifza",
  reason: "No Complainst",
  sps: "yes",
  feedback: ""
}, {
  id: 51,
  sno: 378,
  date: "2025-10-04",
  lead: "Mohammad Sarkar C/O Haseeb Mia",
  student: "Tanjia",
  fromT: "Samya",
  fromTime: "0400 AM",
  fromLead: "Hifza",
  toT: "Muqadus",
  toTime: "0630 AM",
  toLead: "Hifza",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 52,
  sno: 382,
  date: "2025-10-02",
  lead: "Safia C/O Aisha Jalloh",
  student: "Khadija",
  fromT: "Awais",
  fromTime: "0200AM",
  fromLead: "Qazi Junaid",
  toT: "Ezba rasheed",
  toTime: "0200AM",
  toLead: "Faizan Khan",
  reason: "",
  sps: "yes",
  feedback: ""
}, {
  id: 53,
  sno: 377,
  date: "2025-10-01",
  lead: "Maryam Aleemi",
  student: "Self",
  fromT: "Huma",
  fromTime: "0430 AM",
  fromLead: "Sobia",
  toT: "Momina",
  toTime: "0430 AM",
  toLead: "Sobia",
  reason: "Parent Complaint about Teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 54,
  sno: 376,
  date: "2025-10-01",
  lead: "Lawartou",
  student: "Anisa",
  fromT: "Moomina",
  fromTime: "0430 AM",
  fromLead: "Sobia",
  toT: "Huma",
  toTime: "0430 AM",
  toLead: "Sobia",
  reason: "No Complainst",
  sps: "yes",
  feedback: ""
}, {
  id: 55,
  sno: 375,
  date: "2025-09-26",
  lead: "Hikmet Bekri",
  student: "Nadeem",
  fromT: "Tayyab",
  fromTime: "0500AM",
  fromLead: "Qazi Junaid",
  toT: "Shayan",
  toTime: "0530AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 56,
  sno: 373,
  date: "2025-09-18",
  lead: "Anat S/O Shugri Abdulle",
  student: "Isma",
  fromT: "Gohar Shah",
  fromTime: "0230AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Qamar",
  toTime: "0230AM",
  toLead: "Qazi Junaid",
  reason: "Parent Complaint about Teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 57,
  sno: 372,
  date: "2025-09-18",
  lead: "Anat S/O Shugri Abdulle",
  student: "Ibrahim Ahmed",
  fromT: "Gohar Shah",
  fromTime: "0200AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Qamar",
  toTime: "0200AM",
  toLead: "Qazi Junaid",
  reason: "Parent Complaint about Teacher",
  sps: "yes",
  feedback: ""
}, {
  id: 58,
  sno: 374,
  date: "2025-09-15",
  lead: "Zarin Raisa",
  student: "Self",
  fromT: "Faizan Qamar",
  fromTime: "0700AM",
  fromLead: "Qazi Junaid",
  toT: "Uzair",
  toTime: "0500AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 59,
  sno: 371,
  date: "2025-09-10",
  lead: "Roya",
  student: "Faisal ",
  fromT: "Nadeem",
  fromTime: "0530AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Mughal",
  toTime: "0630AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}, {
  id: 60,
  sno: 370,
  date: "2025-09-10",
  lead: "Roya",
  student: "Mustapha",
  fromT: "Nadeem",
  fromTime: "0430AM",
  fromLead: "Qazi Junaid",
  toT: "Faizan Mughal",
  toTime: "0530AM",
  toLead: "Qazi Junaid",
  reason: "Time Change Request",
  sps: "yes",
  feedback: ""
}];

const SUBJ_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30"];

const SUBJ_TEACHERS_DATA = [{
  id: 1,
  sno: 1,
  name: "Ms. Ayesha",
  code: "5746",
  subjects: ["Biology", "Chemistry", "Physics", "English", "Math"],
  grades: "I-X",
  location: "WFH",
  joinDate: "2023-08-15",
  rating: 4.5,
  phone: "+92 312 5746001",
  status: "active",
  mon: {
    42: {
      s: "Muhammad",
      a: 8,
      p: "Ibrahim Ghaleb",
      sub: "Math",
      gr: "V",
      st: "Minnesota",
      t: "0500 PM",
      dor: "1-Dec-21"
    },
    48: {
      s: "Qasim Sohail",
      a: 8,
      p: "Maimoona Abdullah",
      sub: "English",
      gr: "II",
      st: "Virginia",
      t: "0900 PM",
      dor: "23-Apr-25"
    },
    44: {
      s: "Hamza",
      a: 10,
      p: "Ahmed Khan",
      sub: "Math",
      gr: "IV",
      st: "Texas",
      t: "0600 PM",
      dor: "15-Jan-25"
    }
  },
  tue: {},
  wed: {},
  thu: {
    48: {
      s: "Qasim Sohail",
      a: 8,
      p: "Maimoona Abdullah",
      sub: "Math",
      gr: "II",
      st: "Virginia",
      t: "0900 PM",
      dor: "25-Nov-25"
    }
  },
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 2,
  sno: 2,
  name: "Ms. Aiza",
  code: "5746",
  subjects: ["Biology", "Chemistry", "English", "Math"],
  grades: "VI-X",
  location: "WFH",
  joinDate: "2024-03-01",
  rating: 4.2,
  phone: "+92 333 5746002",
  status: "active",
  mon: {
    32: {
      s: "Muhammad Omar",
      a: 15,
      p: "Ibado C/O Ibrahim Ghaleb",
      sub: "English Reading Comp",
      gr: "X",
      st: "Minnesota",
      t: "1200 PM",
      dor: "16-May-25"
    }
  },
  tue: {},
  wed: {},
  thu: {},
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 3,
  sno: 3,
  name: "Ms. Bushra",
  code: "6927",
  subjects: ["English", "Science"],
  grades: "I-VIII",
  location: "WFH",
  joinDate: "2022-09-01",
  rating: 4.7,
  phone: "+92 345 6927003",
  status: "active",
  mon: {
    30: {
      s: "Muhammad Omar",
      a: 15,
      p: "Ibado C/O Ibrahim Ghaleb",
      sub: "Math",
      gr: "X",
      st: "Minnesota",
      t: "1100 AM",
      dor: "16-May-25"
    },
    32: {
      s: "Aisha",
      a: 10,
      p: "Razia",
      sub: "English",
      gr: "V",
      st: "Texas",
      t: "1200 PM",
      dor: "10-Mar-24"
    },
    36: {
      s: "Ahmed",
      a: 7,
      p: "Bilal",
      sub: "Science",
      gr: "II",
      st: "New York",
      t: "0200 PM",
      dor: "5-Oct-24"
    }
  },
  tue: {
    30: {
      s: "Muhammad Omar",
      a: 15,
      p: "Ibado C/O Ibrahim Ghaleb",
      sub: "Math",
      gr: "X",
      st: "Minnesota",
      t: "1100 AM",
      dor: "16-May-25"
    },
    36: {
      s: "Ahmed",
      a: 7,
      p: "Bilal",
      sub: "Science",
      gr: "II",
      st: "New York",
      t: "0200 PM",
      dor: "5-Oct-24"
    }
  },
  wed: {
    32: {
      s: "Aisha",
      a: 10,
      p: "Razia",
      sub: "English",
      gr: "V",
      st: "Texas",
      t: "1200 PM",
      dor: "10-Mar-24"
    }
  },
  thu: {
    30: {
      s: "Muhammad Omar",
      a: 15,
      p: "Ibado C/O Ibrahim Ghaleb",
      sub: "Math",
      gr: "X",
      st: "Minnesota",
      t: "1100 AM",
      dor: "16-May-25"
    }
  },
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 4,
  sno: 4,
  name: "Ms. Fauzia",
  code: "2849",
  subjects: ["Chemistry", "English", "Math"],
  grades: "VI-X",
  location: "WFH",
  joinDate: "2023-02-01",
  rating: 4.3,
  phone: "+92 300 2849004",
  status: "active",
  mon: {
    34: {
      s: "Ibrahim",
      a: 14,
      p: "Bilal Khan",
      sub: "Chemistry",
      gr: "IX",
      st: "New Jersey",
      t: "0100 PM",
      dor: "1-Aug-24"
    },
    38: {
      s: "Yusuf",
      a: 12,
      p: "Hamid",
      sub: "Math",
      gr: "VII",
      st: "California",
      t: "0300 PM",
      dor: "22-Feb-24"
    },
    40: {
      s: "Zain",
      a: 13,
      p: "Nasir",
      sub: "English",
      gr: "VIII",
      st: "Virginia",
      t: "0400 PM",
      dor: "18-Jul-24"
    },
    42: {
      s: "Fatima",
      a: 15,
      p: "Saleem",
      sub: "Chemistry",
      gr: "X",
      st: "Texas",
      t: "0500 PM",
      dor: "3-Mar-24"
    },
    46: {
      s: "Ayesha",
      a: 11,
      p: "Farooq",
      sub: "Math",
      gr: "VI",
      st: "Florida",
      t: "0700 PM",
      dor: "12-Dec-24"
    }
  },
  tue: {
    34: {
      s: "Ibrahim",
      a: 14,
      p: "Bilal Khan",
      sub: "Chemistry",
      gr: "IX",
      st: "New Jersey",
      t: "0100 PM",
      dor: "1-Aug-24"
    }
  },
  wed: {},
  thu: {
    38: {
      s: "Yusuf",
      a: 12,
      p: "Hamid",
      sub: "Math",
      gr: "VII",
      st: "California",
      t: "0300 PM",
      dor: "22-Feb-24"
    }
  },
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 5,
  sno: 5,
  name: "Ms. Filza Tariq",
  code: "5789",
  subjects: ["Biology", "Chemistry", "Physics", "English", "Math", "Coding"],
  grades: "VI-X",
  location: "WFH",
  joinDate: "2023-06-15",
  rating: 4.6,
  phone: "+92 312 5789005",
  status: "active",
  mon: {
    38: {
      s: "Omar",
      a: 13,
      p: "Yasir",
      sub: "Coding",
      gr: "VIII",
      st: "Texas",
      t: "0300 PM",
      dor: "10-Sep-24"
    },
    42: {
      s: "Layla",
      a: 15,
      p: "Kareem",
      sub: "Biology",
      gr: "X",
      st: "Ohio",
      t: "0500 PM",
      dor: "5-Apr-24"
    },
    46: {
      s: "Hassan",
      a: 14,
      p: "Rashid",
      sub: "Physics",
      gr: "IX",
      st: "Illinois",
      t: "0700 PM",
      dor: "20-Jan-25"
    }
  },
  tue: {
    38: {
      s: "Omar",
      a: 13,
      p: "Yasir",
      sub: "Coding",
      gr: "VIII",
      st: "Texas",
      t: "0300 PM",
      dor: "10-Sep-24"
    }
  },
  wed: {},
  thu: {},
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 6,
  sno: 6,
  name: "Ms. Gulshan",
  code: "1729",
  subjects: ["English", "Math"],
  grades: "I-VIII",
  location: "WFH",
  joinDate: "2024-01-10",
  rating: 4.1,
  phone: "+92 333 1729006",
  status: "active",
  mon: {
    34: {
      s: "Maryam",
      a: 9,
      p: "Ahmed",
      sub: "English",
      gr: "IV",
      st: "Pennsylvania",
      t: "0100 PM",
      dor: "15-May-24"
    },
    36: {
      s: "Bilal",
      a: 8,
      p: "Saeed",
      sub: "Math",
      gr: "III",
      st: "Georgia",
      t: "0200 PM",
      dor: "20-Jun-24"
    },
    40: {
      s: "Nida",
      a: 10,
      p: "Rafiq",
      sub: "English",
      gr: "V",
      st: "Maryland",
      t: "0400 PM",
      dor: "8-Aug-24"
    },
    42: {
      s: "Usman",
      a: 11,
      p: "Tariq",
      sub: "Math",
      gr: "VI",
      st: "Virginia",
      t: "0500 PM",
      dor: "12-Sep-24"
    },
    44: {
      s: "Sara",
      a: 7,
      p: "Javed",
      sub: "English",
      gr: "II",
      st: "New York",
      t: "0600 PM",
      dor: "1-Nov-24"
    },
    46: {
      s: "Ali",
      a: 12,
      p: "Akram",
      sub: "Math",
      gr: "VII",
      st: "Texas",
      t: "0700 PM",
      dor: "25-Feb-25"
    }
  },
  tue: {
    34: {
      s: "Maryam",
      a: 9,
      p: "Ahmed",
      sub: "English",
      gr: "IV",
      st: "Pennsylvania",
      t: "0100 PM",
      dor: "15-May-24"
    }
  },
  wed: {},
  thu: {},
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 7,
  sno: 7,
  name: "Ms. Hafsa Abbas",
  code: "2164",
  subjects: ["Biology", "Chemistry", "Physics", "English", "Math"],
  grades: "I-VIII",
  location: "WFH",
  joinDate: "2025-04-10",
  rating: 3.9,
  phone: "+92 345 2164007",
  status: "active",
  mon: {
    32: {
      s: "Talha",
      a: 10,
      p: "Rizwan",
      sub: "Math",
      gr: "V",
      st: "Missouri",
      t: "1200 PM",
      dor: "12-Apr-25"
    }
  },
  tue: {},
  wed: {},
  thu: {},
  fri: {},
  sat: {},
  sun: {}
}, {
  id: 8,
  sno: 8,
  name: "Ms. Sundas",
  code: "0435",
  subjects: ["English", "Math"],
  grades: "I-VIII",
  location: "IBA",
  joinDate: "2023-10-01",
  rating: 4.4,
  phone: "+92 300 0435008",
  status: "active",
  mon: {
    40: {
      s: "Hamza",
      a: 9,
      p: "Khalid",
      sub: "English",
      gr: "IV",
      st: "California",
      t: "0400 PM",
      dor: "22-Nov-24"
    },
    42: {
      s: "Amina",
      a: 8,
      p: "Nadeem",
      sub: "Math",
      gr: "III",
      st: "Texas",
      t: "0500 PM",
      dor: "1-Dec-24"
    },
    44: {
      s: "Rayan",
      a: 11,
      p: "Imran",
      sub: "English",
      gr: "VI",
      st: "Florida",
      t: "0600 PM",
      dor: "15-Jan-25"
    },
    46: {
      s: "Kiran",
      a: 10,
      p: "Shahid",
      sub: "Math",
      gr: "V",
      st: "Virginia",
      t: "0700 PM",
      dor: "10-Feb-25"
    },
    48: {
      s: "Nashit",
      a: 7,
      p: "Waqar",
      sub: "English",
      gr: "II",
      st: "New York",
      t: "0900 PM",
      dor: "5-Mar-25"
    },
    50: {
      s: "Zara",
      a: 12,
      p: "Qasim",
      sub: "Math",
      gr: "VII",
      st: "Pennsylvania",
      t: "1100 PM",
      dor: "18-Mar-25"
    }
  },
  tue: {
    40: {
      s: "Hamza",
      a: 9,
      p: "Khalid",
      sub: "English",
      gr: "IV",
      st: "California",
      t: "0400 PM",
      dor: "22-Nov-24"
    }
  },
  wed: {},
  thu: {},
  fri: {},
  sat: {},
  sun: {}
}];

const ALL_SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "Math", "Science", "Coding"];

const ALL_GRADES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const ATT_STATUS = ["Present", "Late", "Absent", "On Leave", "Half Day", "Holiday"];

const FINE_RULES = {
  late10: 100,
  late30: 250,
  late60: 500,
  absent: 1500,
  halfDay: 750,
  earlyLeave: 200,
  missedClass: 500
};

const SHIFTS_ATT = ["Morning", "Evening", "Night", "Subject"];

const genAttData = () => {
  const teachers = [{
    id: 1,
    name: "Hafiz Faizan Mughal",
    code: "0731",
    shift: "Night",
    salary: 35000
  }, {
    id: 2,
    name: "Hafiz Ali Saeed",
    code: "3186",
    shift: "Night",
    salary: 32000
  }, {
    id: 3,
    name: "Asim",
    code: "0341",
    shift: "Night",
    salary: 38000
  }, {
    id: 4,
    name: "Hafiz Amanullah",
    code: "0872",
    shift: "Night",
    salary: 36000
  }, {
    id: 5,
    name: "Qari Faizan Khan",
    code: "6285",
    shift: "Night",
    salary: 42000
  }, {
    id: 6,
    name: "Farhan Awan",
    code: "0101",
    shift: "Night",
    salary: 40000
  }, {
    id: 7,
    name: "Qari Haris Khan",
    code: "4459",
    shift: "Evening",
    salary: 37000
  }, {
    id: 8,
    name: "Qari Hussnain",
    code: "0353",
    shift: "Night",
    salary: 28000
  }, {
    id: 9,
    name: "Qari Muhammad Nadeem",
    code: "7346",
    shift: "Night",
    salary: 40000
  }, {
    id: 10,
    name: "Hafiz Osama",
    code: "5867",
    shift: "Evening",
    salary: 35000
  }, {
    id: 11,
    name: "Saifullah",
    code: "1562",
    shift: "Night",
    salary: 42000
  }, {
    id: 12,
    name: "Hafiz Suleman",
    code: "7834",
    shift: "Morning",
    salary: 34000
  }, {
    id: 13,
    name: "Hafiz Tayyab",
    code: "0074",
    shift: "Night",
    salary: 39000
  }, {
    id: 14,
    name: "Hafiz Uzair",
    code: "3102",
    shift: "Night",
    salary: 36000
  }, {
    id: 15,
    name: "Hafiz Waqas Arshad",
    code: "2468",
    shift: "Morning",
    salary: 48000
  }, {
    id: 16,
    name: "Hafiz Abdullah ATD",
    code: "9482",
    shift: "Morning",
    salary: 40000
  }, {
    id: 17,
    name: "Hafiz Abu Bakar",
    code: "2377",
    shift: "Evening",
    salary: 38000
  }, {
    id: 18,
    name: "Qari Awais",
    code: "6282",
    shift: "Night",
    salary: 35000
  }, {
    id: 19,
    name: "Qaria Arooj Zareen",
    code: "9160",
    shift: "Night",
    salary: 38000
  }, {
    id: 20,
    name: "Qaria Esha",
    code: "3325",
    shift: "Evening",
    salary: 28000
  }, {
    id: 21,
    name: "Qaria Madiha",
    code: "0676",
    shift: "Night",
    salary: 40000
  }, {
    id: 22,
    name: "Qaria Najma Noor",
    code: "1093",
    shift: "Night",
    salary: 36000
  }, {
    id: 23,
    name: "Qaria Nida Aman",
    code: "0564",
    shift: "Night",
    salary: 37000
  }, {
    id: 24,
    name: "Qaria Saba Noor",
    code: "1175",
    shift: "Night",
    salary: 34000
  }, {
    id: 25,
    name: "Qaria Swera",
    code: "7322",
    shift: "Night",
    salary: 34000
  }, {
    id: 26,
    name: "Hafiza Atikah",
    code: "2491",
    shift: "Night",
    salary: 36000
  }, {
    id: 27,
    name: "Huma",
    code: "6934",
    shift: "Night",
    salary: 34000
  }, {
    id: 28,
    name: "Qaria Kanwal",
    code: "7111",
    shift: "Night",
    salary: 38000
  }, {
    id: 29,
    name: "Hafiza Momina Akbar",
    code: "5719",
    shift: "Night",
    salary: 35000
  }, {
    id: 30,
    name: "Qaria Nida Sarwar",
    code: "5891",
    shift: "Night",
    salary: 40000
  }, {
    id: 31,
    name: "Hafiza Samya",
    code: "5561",
    shift: "Night",
    salary: 35000
  }, {
    id: 32,
    name: "Hafiza Saqeela Satti",
    code: "9610",
    shift: "Night",
    salary: 42000
  }, {
    id: 33,
    name: "Qaria Shaista",
    code: "5756",
    shift: "Night",
    salary: 44000
  }, {
    id: 34,
    name: "Ms. Ayesha",
    code: "5746",
    shift: "Subject",
    salary: 38000
  }, {
    id: 35,
    name: "Ms. Bushra",
    code: "6927",
    shift: "Subject",
    salary: 36000
  }, {
    id: 36,
    name: "Ms. Fauzia",
    code: "2849",
    shift: "Subject",
    salary: 38000
  }, {
    id: 37,
    name: "Ms. Filza Tariq",
    code: "5789",
    shift: "Subject",
    salary: 40000
  }, {
    id: 38,
    name: "Ms. Sundas",
    code: "0435",
    shift: "Subject",
    salary: 34000
  }];
  return teachers;
};

const initAttTeachers = genAttData();

const genHistory = teachers => {
  const today = new Date();
  const hist = {};
  teachers.forEach(t => {
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
        ip = "182.178." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255);
      const r = Math.random();
      if (r < 0.04) {
        status = "Absent";
        fine = FINE_RULES.absent;
        checkIn = "—";
        checkOut = "—";
      } else if (r < 0.1) {
        status = "Late";
        lateMin = Math.floor(Math.random() * 45) + 5;
        fine = lateMin > 30 ? FINE_RULES.late30 : lateMin > 10 ? FINE_RULES.late10 : 0;
        const sm = t.shift === "Morning" ? 8 : t.shift === "Evening" ? 16 : t.shift === "Night" ? 0 : 10;
        checkIn = String(sm).padStart(2, "0") + ":" + String(lateMin).padStart(2, "0");
        checkOut = String((sm + 8) % 24).padStart(2, "0") + ":00";
      } else if (r < 0.13) {
        status = "On Leave";
        checkIn = "—";
        checkOut = "—";
      } else if (r < 0.14) {
        status = "Half Day";
        fine = FINE_RULES.halfDay;
        const sm = t.shift === "Morning" ? 8 : t.shift === "Evening" ? 16 : t.shift === "Night" ? 0 : 10;
        checkIn = String(sm).padStart(2, "0") + ":05";
        checkOut = String((sm + 4) % 24).padStart(2, "0") + ":00";
      } else {
        const sm = t.shift === "Morning" ? 8 : t.shift === "Evening" ? 16 : t.shift === "Night" ? 0 : 10;
        const startMin = Math.floor(Math.random() * 5);
        checkIn = String(sm).padStart(2, "0") + ":" + String(startMin).padStart(2, "0");
        checkOut = String((sm + 8) % 24).padStart(2, "0") + ":" + String(Math.floor(Math.random() * 15)).padStart(2, "0");
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
        approved: true
      });
    }
  });
  return hist;
};

const initAttHist = genHistory(initAttTeachers);

const PAY_METHODS = ["JazzCash", "EasyPaisa", "HBL Bank", "Meezan Bank", "UBL Bank", "Cash"];

const BONUS_TYPES = ["Performance", "Tenure", "Attendance", "Eid", "Festival", "Overtime", "Special"];

const DEDUCTION_TYPES = ["Attendance Fines", "Advance Salary", "Loan Installment", "Tax", "Insurance", "Other"];

const initPayrollTeachers = [{
  id: 1,
  name: "Hafiz Faizan Mughal",
  code: "0731",
  salary: 35000,
  bank: "JazzCash - 03120731001",
  joinDate: "2023-03-15",
  students: 6,
  rating: 4.2,
  shift: "Night"
}, {
  id: 2,
  name: "Hafiz Ali Saeed",
  code: "3186",
  salary: 32000,
  bank: "EasyPaisa - 03333186002",
  joinDate: "2023-06-20",
  students: 5,
  rating: 3.8,
  shift: "Night"
}, {
  id: 3,
  name: "Asim",
  code: "0341",
  salary: 38000,
  bank: "HBL - 1234567890",
  joinDate: "2022-11-01",
  students: 7,
  rating: 4.0,
  shift: "Night"
}, {
  id: 4,
  name: "Hafiz Amanullah",
  code: "0872",
  salary: 36000,
  bank: "Meezan - 0087200004",
  joinDate: "2023-01-10",
  students: 8,
  rating: 4.5,
  shift: "Night"
}, {
  id: 5,
  name: "Qari Faizan Khan",
  code: "6285",
  salary: 42000,
  bank: "UBL - 6285005678",
  joinDate: "2021-08-01",
  students: 5,
  rating: 4.7,
  shift: "Night"
}, {
  id: 6,
  name: "Farhan Awan",
  code: "0101",
  salary: 40000,
  bank: "Meezan - 0101006789",
  joinDate: "2022-05-15",
  students: 9,
  rating: 4.1,
  shift: "Night"
}, {
  id: 7,
  name: "Qari Haris Khan",
  code: "4459",
  salary: 37000,
  bank: "HBL - 4459007890",
  joinDate: "2022-12-01",
  students: 10,
  rating: 4.3,
  shift: "Evening"
}, {
  id: 8,
  name: "Qari Hussnain",
  code: "0353",
  salary: 28000,
  bank: "JazzCash - 03000353008",
  joinDate: "2024-06-01",
  students: 2,
  rating: 3.5,
  shift: "Night"
}, {
  id: 9,
  name: "Qari Muhammad Nadeem",
  code: "7346",
  salary: 40000,
  bank: "Meezan - 7346009012",
  joinDate: "2022-01-15",
  students: 10,
  rating: 4.4,
  shift: "Night"
}, {
  id: 10,
  name: "Hafiz Osama",
  code: "5867",
  salary: 35000,
  bank: "EasyPaisa - 03125867010",
  joinDate: "2023-04-20",
  students: 8,
  rating: 4.0,
  shift: "Evening"
}, {
  id: 11,
  name: "Saifullah",
  code: "1562",
  salary: 42000,
  bank: "HBL - 1562011234",
  joinDate: "2022-04-01",
  students: 11,
  rating: 4.6,
  shift: "Night"
}, {
  id: 12,
  name: "Hafiz Suleman",
  code: "7834",
  salary: 34000,
  bank: "Meezan - 7834012345",
  joinDate: "2023-07-10",
  students: 7,
  rating: 3.9,
  shift: "Morning"
}, {
  id: 13,
  name: "Hafiz Tayyab",
  code: "0074",
  salary: 39000,
  bank: "UBL - 0074013456",
  joinDate: "2022-09-15",
  students: 10,
  rating: 4.3,
  shift: "Night"
}, {
  id: 14,
  name: "Hafiz Uzair",
  code: "3102",
  salary: 36000,
  bank: "HBL - 3102014560",
  joinDate: "2023-02-01",
  students: 11,
  rating: 4.4,
  shift: "Night"
}, {
  id: 15,
  name: "Hafiz Waqas Arshad",
  code: "2468",
  salary: 48000,
  bank: "Meezan - 2468015601",
  joinDate: "2021-05-01",
  students: 14,
  rating: 4.8,
  shift: "Morning"
}, {
  id: 16,
  name: "Hafiz Abdullah ATD",
  code: "9482",
  salary: 40000,
  bank: "UBL - 9482016012",
  joinDate: "2021-12-01",
  students: 8,
  rating: 4.2,
  shift: "Morning"
}, {
  id: 17,
  name: "Hafiz Abu Bakar",
  code: "2377",
  salary: 38000,
  bank: "Meezan - 2377017123",
  joinDate: "2022-08-15",
  students: 10,
  rating: 4.1,
  shift: "Evening"
}, {
  id: 18,
  name: "Qari Awais",
  code: "6282",
  salary: 35000,
  bank: "JazzCash - 03126282018",
  joinDate: "2023-10-01",
  students: 10,
  rating: 4.0,
  shift: "Night"
}, {
  id: 19,
  name: "Qaria Arooj Zareen",
  code: "9160",
  salary: 38000,
  bank: "EasyPaisa - 03339160019",
  joinDate: "2022-03-15",
  students: 12,
  rating: 4.6,
  shift: "Night"
}, {
  id: 20,
  name: "Qaria Esha",
  code: "3325",
  salary: 28000,
  bank: "HBL - 3325020456",
  joinDate: "2024-02-01",
  students: 3,
  rating: 3.6,
  shift: "Evening"
}, {
  id: 21,
  name: "Qaria Madiha",
  code: "0676",
  salary: 40000,
  bank: "Meezan - 0676021567",
  joinDate: "2022-06-01",
  students: 11,
  rating: 4.3,
  shift: "Night"
}, {
  id: 22,
  name: "Qaria Najma Noor",
  code: "1093",
  salary: 36000,
  bank: "UBL - 1093023789",
  joinDate: "2022-11-15",
  students: 8,
  rating: 4.1,
  shift: "Night"
}, {
  id: 23,
  name: "Qaria Nida Aman",
  code: "0564",
  salary: 37000,
  bank: "HBL - 0564024890",
  joinDate: "2022-12-01",
  students: 10,
  rating: 4.2,
  shift: "Night"
}, {
  id: 24,
  name: "Qaria Saba Noor",
  code: "1175",
  salary: 34000,
  bank: "Meezan - 1175025901",
  joinDate: "2023-05-01",
  students: 9,
  rating: 4.0,
  shift: "Night"
}, {
  id: 25,
  name: "Qaria Swera",
  code: "7322",
  salary: 34000,
  bank: "EasyPaisa - 03127322026",
  joinDate: "2023-08-15",
  students: 9,
  rating: 4.1,
  shift: "Night"
}, {
  id: 26,
  name: "Hafiza Atikah",
  code: "2491",
  salary: 36000,
  bank: "UBL - 2491027123",
  joinDate: "2022-11-01",
  students: 10,
  rating: 4.2,
  shift: "Night"
}, {
  id: 27,
  name: "Huma",
  code: "6934",
  salary: 34000,
  bank: "HBL - 6934028234",
  joinDate: "2023-03-01",
  students: 9,
  rating: 3.9,
  shift: "Night"
}, {
  id: 28,
  name: "Qaria Kanwal",
  code: "7111",
  salary: 38000,
  bank: "Meezan - 7111029345",
  joinDate: "2022-07-15",
  students: 10,
  rating: 4.3,
  shift: "Night"
}, {
  id: 29,
  name: "Hafiza Momina Akbar",
  code: "5719",
  salary: 35000,
  bank: "EasyPaisa - 03125719030",
  joinDate: "2023-01-01",
  students: 10,
  rating: 3.7,
  shift: "Night"
}, {
  id: 30,
  name: "Qaria Nida Sarwar",
  code: "5891",
  salary: 40000,
  bank: "Meezan - 5891032678",
  joinDate: "2022-09-01",
  students: 12,
  rating: 4.5,
  shift: "Night"
}, {
  id: 31,
  name: "Hafiza Samya",
  code: "5561",
  salary: 35000,
  bank: "UBL - 5561033789",
  joinDate: "2023-04-01",
  students: 10,
  rating: 4.1,
  shift: "Night"
}, {
  id: 32,
  name: "Hafiza Saqeela Satti",
  code: "9610",
  salary: 42000,
  bank: "HBL - 9610034890",
  joinDate: "2022-02-01",
  students: 13,
  rating: 4.4,
  shift: "Night"
}, {
  id: 33,
  name: "Qaria Shaista",
  code: "5756",
  salary: 44000,
  bank: "Meezan - 5756035901",
  joinDate: "2022-01-15",
  students: 13,
  rating: 4.7,
  shift: "Night"
}, {
  id: 34,
  name: "Ms. Ayesha",
  code: "5746",
  salary: 38000,
  bank: "JazzCash - 03125746001",
  joinDate: "2023-08-15",
  students: 3,
  rating: 4.5,
  shift: "Subject"
}, {
  id: 35,
  name: "Ms. Bushra",
  code: "6927",
  salary: 36000,
  bank: "Meezan - 6927003123",
  joinDate: "2022-09-01",
  students: 7,
  rating: 4.7,
  shift: "Subject"
}, {
  id: 36,
  name: "Ms. Fauzia",
  code: "2849",
  salary: 38000,
  bank: "HBL - 2849004234",
  joinDate: "2023-02-01",
  students: 5,
  rating: 4.3,
  shift: "Subject"
}, {
  id: 37,
  name: "Ms. Filza Tariq",
  code: "5789",
  salary: 40000,
  bank: "UBL - 5789005345",
  joinDate: "2023-06-15",
  students: 3,
  rating: 4.6,
  shift: "Subject"
}, {
  id: 38,
  name: "Ms. Sundas",
  code: "0435",
  salary: 34000,
  bank: "EasyPaisa - 03000435008",
  joinDate: "2023-10-01",
  students: 6,
  rating: 4.4,
  shift: "Subject"
}];

const tenureYears = joinDate => {
  const y = Math.floor((new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 365));
  return y;
};

const calcBonuses = t => {
  const tenure = tenureYears(t.joinDate);
  const tenureBonus = tenure >= 3 ? 3000 : tenure >= 2 ? 2000 : tenure >= 1 ? 1000 : 0;
  const perfBonus = t.rating >= 4.5 ? 3000 : t.rating >= 4.2 ? 2000 : t.rating >= 4.0 ? 1000 : 0;
  const studBonus = t.students >= 12 ? 2000 : t.students >= 8 ? 1000 : 0;
  return {
    tenure: tenureBonus,
    performance: perfBonus,
    students: studBonus,
    total: tenureBonus + perfBonus + studBonus
  };
};

const genPayHistory = () => {
  const hist = {};
  initPayrollTeachers.forEach(t => {
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
      const status = m === 0 ? Math.random() < 0.6 ? "pending" : "approved" : "paid";
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
        paidDate: m === 0 ? null : todayPK(new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.floor(Math.random() * 5) + 1)),
        paymentMethod: m === 0 ? null : t.bank.split(" - ")[0],
        approvedBy: m === 0 ? null : "Super Admin",
        attPct: 85 + Math.floor(Math.random() * 15)
      });
    }
  });
  return hist;
};

const initPayHistory = genPayHistory();

const FEE_PLANS = {
  Quran: 45,
  "EN-Quaida": 30,
  "Quran with Tajweed": 50,
  "Quran-Memo": 70,
  "Saudi Quran": 55,
  "Quran+Memo+Islamic Ed": 80,
  "Eng/Noorani Quaida": 35,
  "Quran-Taj": 50,
  Subject: 50
};

const PAY_GATEWAYS = ["PayPal", "Wise", "Zelle", "Bank Transfer", "Western Union", "Cash"];

const EXPENSE_CATS = ["Teacher Salaries", "Rent & Utilities", "Internet & Phone", "Marketing", "Software", "Admin Staff", "Equipment", "Gateway Fees", "Travel", "Miscellaneous"];

const INCOME_CATS = ["Monthly Fees", "Registration", "Certificate", "Donation", "Other"];

const CURRENCIES = ["USD", "CAD", "GBP", "PKR"];

const EXCHANGE_RATE = {
  USD: 280,
  CAD: 205,
  GBP: 355,
  PKR: 1
};

const initFeeStudents = [{
  id: 1,
  name: "Fanan Chowdhury",
  course: "Quran",
  parent: "Evan Chowdhury",
  country: "USA",
  state: "Florida",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-05",
  monthsPaid: 8,
  totalPaid: 360,
  dueAmount: 0,
  gateway: "PayPal"
}, {
  id: 2,
  name: "Mohammed Misbahuddin",
  course: "Quran",
  parent: "MD Raziuddin",
  country: "USA",
  state: "Georgia",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-03",
  monthsPaid: 6,
  totalPaid: 270,
  dueAmount: 0,
  gateway: "Zelle"
}, {
  id: 3,
  name: "Musah",
  course: "Quran",
  parent: "King Mohamed",
  country: "USA",
  state: "Pennsylvania",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-10",
  monthsPaid: 10,
  totalPaid: 450,
  dueAmount: 0,
  gateway: "Wise"
}, {
  id: 4,
  name: "Eltaf",
  course: "EN-Quaida",
  parent: "Zamir",
  country: "USA",
  state: "Texas",
  fee: 30,
  currency: "USD",
  status: "overdue",
  lastPaid: "2026-02-15",
  monthsPaid: 5,
  totalPaid: 150,
  dueAmount: 90,
  gateway: "PayPal"
}, {
  id: 5,
  name: "Kenane",
  course: "Quran-Memo",
  parent: "Kevin",
  country: "USA",
  state: "New York",
  fee: 70,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-01",
  monthsPaid: 9,
  totalPaid: 630,
  dueAmount: 0,
  gateway: "Zelle"
}, {
  id: 6,
  name: "Loay",
  course: "Quran-Memo",
  parent: "Kevin",
  country: "USA",
  state: "New York",
  fee: 70,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-01",
  monthsPaid: 9,
  totalPaid: 630,
  dueAmount: 0,
  gateway: "Zelle"
}, {
  id: 7,
  name: "Nubair",
  course: "Quran",
  parent: "Seema",
  country: "USA",
  state: "New York",
  fee: 45,
  currency: "USD",
  status: "overdue",
  lastPaid: "2026-01-20",
  monthsPaid: 4,
  totalPaid: 180,
  dueAmount: 135,
  gateway: "PayPal"
}, {
  id: 8,
  name: "Muhammad Diao",
  course: "Quran+Memo+Islamic Ed",
  parent: "Ibrahima Diallo",
  country: "USA",
  state: "Iowa",
  fee: 80,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-08",
  monthsPaid: 7,
  totalPaid: 560,
  dueAmount: 0,
  gateway: "Wise"
}, {
  id: 9,
  name: "Hanzala",
  course: "Quran",
  parent: "Tanjia Sarker",
  country: "USA",
  state: "New York",
  fee: 45,
  currency: "USD",
  status: "partial",
  lastPaid: "2026-03-10",
  monthsPaid: 6,
  totalPaid: 225,
  dueAmount: 45,
  gateway: "Zelle"
}, {
  id: 10,
  name: "Rayyan",
  course: "Quran",
  parent: "Cena Mohammed",
  country: "UK",
  state: "Manchester",
  fee: 38,
  currency: "GBP",
  status: "paid",
  lastPaid: "2026-04-02",
  monthsPaid: 8,
  totalPaid: 304,
  dueAmount: 0,
  gateway: "Bank Transfer"
}, {
  id: 11,
  name: "Ibrahim",
  course: "Quran",
  parent: "Salimata",
  country: "USA",
  state: "Philadelphia",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-05",
  monthsPaid: 12,
  totalPaid: 540,
  dueAmount: 0,
  gateway: "PayPal"
}, {
  id: 12,
  name: "Tawfiq",
  course: "Quran",
  parent: "Sophia",
  country: "USA",
  state: "New York",
  fee: 45,
  currency: "USD",
  status: "overdue",
  lastPaid: "2026-01-15",
  monthsPaid: 5,
  totalPaid: 225,
  dueAmount: 135,
  gateway: "Zelle"
}, {
  id: 13,
  name: "Muhammad",
  course: "Quran",
  parent: "Bineta Laye",
  country: "USA",
  state: "Tennessee",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-04",
  monthsPaid: 14,
  totalPaid: 630,
  dueAmount: 0,
  gateway: "Wise"
}, {
  id: 14,
  name: "Ali",
  course: "Quran",
  parent: "Bineta Laye",
  country: "USA",
  state: "Tennessee",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-04",
  monthsPaid: 14,
  totalPaid: 630,
  dueAmount: 0,
  gateway: "Wise"
}, {
  id: 15,
  name: "Aleja",
  course: "Quran",
  parent: "Abdyl Aziz",
  country: "USA",
  state: "Missouri",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-06",
  monthsPaid: 10,
  totalPaid: 450,
  dueAmount: 0,
  gateway: "PayPal"
}, {
  id: 16,
  name: "Ammar",
  course: "Saudi Quran",
  parent: "Hikmet Bekri",
  country: "USA",
  state: "California",
  fee: 55,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-02",
  monthsPaid: 11,
  totalPaid: 605,
  dueAmount: 0,
  gateway: "Zelle"
}, {
  id: 17,
  name: "Lewi",
  course: "Quran",
  parent: "Bastan Gul",
  country: "USA",
  state: "Virginia",
  fee: 45,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-08",
  monthsPaid: 13,
  totalPaid: 585,
  dueAmount: 0,
  gateway: "Wise"
}, {
  id: 18,
  name: "Sana Nasiri",
  course: "EN-Quaida",
  parent: "Aziz",
  country: "USA",
  state: "New York",
  fee: 30,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-07",
  monthsPaid: 5,
  totalPaid: 150,
  dueAmount: 0,
  gateway: "PayPal"
}, {
  id: 19,
  name: "Amina Diop",
  course: "EN-Quaida",
  parent: "Thierno Diop",
  country: "USA",
  state: "Texas",
  fee: 30,
  currency: "USD",
  status: "overdue",
  lastPaid: "2025-12-15",
  monthsPaid: 3,
  totalPaid: 90,
  dueAmount: 120,
  gateway: "PayPal"
}, {
  id: 20,
  name: "Zohal",
  course: "Eng/Noorani Quaida",
  parent: "Abdul Hadi",
  country: "USA",
  state: "Virginia",
  fee: 35,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-05",
  monthsPaid: 11,
  totalPaid: 385,
  dueAmount: 0,
  gateway: "Zelle"
}, {
  id: 21,
  name: "Raihan",
  course: "Quran with Tajweed",
  parent: "Barak Ibrahimi",
  country: "USA",
  state: "Texas",
  fee: 50,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-03",
  monthsPaid: 12,
  totalPaid: 600,
  dueAmount: 0,
  gateway: "PayPal"
}, {
  id: 22,
  name: "Ruqia",
  course: "EN-Quaida",
  parent: "Zamir",
  country: "USA",
  state: "Texas",
  fee: 30,
  currency: "USD",
  status: "overdue",
  lastPaid: "2026-02-12",
  monthsPaid: 5,
  totalPaid: 150,
  dueAmount: 60,
  gateway: "PayPal"
}, {
  id: 23,
  name: "Fabiha",
  course: "EN-Quaida",
  parent: "Mohammad Burhan",
  country: "Canada",
  state: "Ontario",
  fee: 40,
  currency: "CAD",
  status: "paid",
  lastPaid: "2026-04-01",
  monthsPaid: 12,
  totalPaid: 480,
  dueAmount: 0,
  gateway: "Bank Transfer"
}, {
  id: 24,
  name: "Hamza",
  course: "Subject",
  parent: "Khalid",
  country: "USA",
  state: "California",
  fee: 50,
  currency: "USD",
  status: "paid",
  lastPaid: "2026-04-05",
  monthsPaid: 6,
  totalPaid: 300,
  dueAmount: 0,
  gateway: "Wise"
}, {
  id: 25,
  name: "Amina Khan",
  course: "Subject",
  parent: "Nadeem",
  country: "USA",
  state: "Texas",
  fee: 50,
  currency: "USD",
  status: "partial",
  lastPaid: "2026-03-15",
  monthsPaid: 7,
  totalPaid: 275,
  dueAmount: 25,
  gateway: "Zelle"
}];

const initExpenses = [{
  id: 1,
  date: "2026-04-15",
  category: "Teacher Salaries",
  description: "March 2026 payroll",
  amount: 1320000,
  currency: "PKR",
  vendor: "LLQA Payroll",
  paymentMethod: "Bank Transfer",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 2,
  date: "2026-04-10",
  category: "Rent & Utilities",
  description: "IBA Office Rent - April",
  amount: 65000,
  currency: "PKR",
  vendor: "IBA Property",
  paymentMethod: "Bank Transfer",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 3,
  date: "2026-04-08",
  category: "Internet & Phone",
  description: "Zong Corporate + PTCL Fiber",
  amount: 12500,
  currency: "PKR",
  vendor: "Zong & PTCL",
  paymentMethod: "Auto-pay",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 4,
  date: "2026-04-05",
  category: "Marketing",
  description: "Facebook Ads campaign",
  amount: 150,
  currency: "USD",
  vendor: "Meta",
  paymentMethod: "Credit Card",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 5,
  date: "2026-04-03",
  category: "Software",
  description: "Zoom Pro + Google Workspace",
  amount: 85,
  currency: "USD",
  vendor: "Zoom & Google",
  paymentMethod: "Credit Card",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 6,
  date: "2026-04-02",
  category: "Admin Staff",
  description: "Team Leads salaries",
  amount: 180000,
  currency: "PKR",
  vendor: "Admin Payroll",
  paymentMethod: "Bank Transfer",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 7,
  date: "2026-04-20",
  category: "Equipment",
  description: "3 new headphones",
  amount: 18000,
  currency: "PKR",
  vendor: "Daraz",
  paymentMethod: "COD",
  status: "pending",
  approvedBy: "Pending"
}, {
  id: 8,
  date: "2026-04-18",
  category: "Gateway Fees",
  description: "PayPal/Wise transaction fees",
  amount: 320,
  currency: "USD",
  vendor: "Multiple",
  paymentMethod: "Auto",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 9,
  date: "2026-03-15",
  category: "Teacher Salaries",
  description: "February 2026 payroll",
  amount: 1310000,
  currency: "PKR",
  vendor: "LLQA Payroll",
  paymentMethod: "Bank Transfer",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 10,
  date: "2026-03-10",
  category: "Rent & Utilities",
  description: "IBA Office Rent - March",
  amount: 65000,
  currency: "PKR",
  vendor: "IBA Property",
  paymentMethod: "Bank Transfer",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 11,
  date: "2026-03-05",
  category: "Marketing",
  description: "Google Ads + Meta",
  amount: 280,
  currency: "USD",
  vendor: "Google & Meta",
  paymentMethod: "Credit Card",
  status: "paid",
  approvedBy: "Super Admin"
}, {
  id: 12,
  date: "2026-04-22",
  category: "Miscellaneous",
  description: "Office supplies",
  amount: 4500,
  currency: "PKR",
  vendor: "Local",
  paymentMethod: "Cash",
  status: "pending",
  approvedBy: "Pending"
}];

const SETTINGS_SECTIONS = [{
  id: "profile",
  label: "Academy Profile",
  icon: BookOpen,
  color: "accent"
}, {
  id: "users",
  label: "Users & Team",
  icon: Users,
  color: "success"
}, {
  id: "roles",
  label: "Roles & Permissions",
  icon: Shield,
  color: "warn"
}, {
  id: "notifications",
  label: "Notifications",
  icon: AlertTriangle,
  color: "cyan"
}, {
  id: "payments",
  label: "Payment Gateways",
  icon: CreditCard,
  color: "purple"
}, {
  id: "pricing",
  label: "Fees & Pricing",
  icon: DollarSign,
  color: "accent"
}, {
  id: "hr",
  label: "HR & Attendance",
  icon: Clock,
  color: "warn"
}, {
  id: "security",
  label: "Security",
  icon: Shield,
  color: "danger"
}, {
  id: "appearance",
  label: "Appearance",
  icon: LayoutDashboard,
  color: "purple"
}, {
  id: "integrations",
  label: "Integrations",
  icon: Globe,
  color: "cyan"
}, {
  id: "backup",
  label: "Backup & Data",
  icon: Download,
  color: "success"
}, {
  id: "system",
  label: "System Prefs",
  icon: Settings,
  color: "accent"
}, {
  id: "advanced",
  label: "Advanced / API",
  icon: Package,
  color: "danger"
}];

const NAV = [{
  id: "dashboard",
  label: "Dashboard",
  icon: LayoutDashboard
}, {
  id: "teachers",
  label: "Teachers",
  icon: Users,
  parent: "hr"
}, {
  id: "operations",
  label: "Operations",
  icon: Briefcase,
  isGroup: true
}, {
  id: "timetable",
  label: "Timetable",
  icon: Calendar,
  parent: "operations"
}, {
  id: "students",
  label: "Students",
  icon: GraduationCap,
  parent: "operations"
}, {
  id: "shifting",
  label: "Class Shifting",
  icon: ArrowRightLeft,
  parent: "operations"
}, {
  id: "subjects",
  label: "Subjects",
  icon: BookOpen,
  parent: "operations"
}, {
  id: "attendance",
  label: "Attendance",
  icon: Check,
  parent: "hr"
}, {
  id: "finance",
  label: "Finance",
  icon: DollarSign,
  isGroup: true
}, {
  id: "payroll",
  label: "Payroll",
  icon: CreditCard,
  parent: "finance"
}, {
  id: "ar",
  label: "Accounts Receivable",
  icon: TrendingUp,
  parent: "finance"
}, {
  id: "ap",
  label: "Accounts Payable",
  icon: Receipt,
  parent: "finance"
}, {
  id: "parent",
  label: "Parents Portal",
  icon: Users
}, {
  id: "hr",
  label: "HR",
  icon: UserCheck,
  isGroup: true
}, {
  id: "training",
  label: "Training & Dev",
  icon: Award
}, {
  id: "qc",
  label: "Quality Control",
  icon: Shield
}, {
  id: "sales",
  label: "Sales",
  icon: Target
}, {
  id: "procurement",
  label: "Procurement",
  icon: Package
}, {
  id: "reports",
  label: "Monthly Reports",
  icon: BarChart3
}, {
  id: "settings",
  label: "Settings",
  icon: Settings
}];

const PERMISSION_TO_MODULE = {
  "View Dashboard": ["dashboard"],
  "Manage Teachers": ["teachers"],
  "Manage Students": ["students"],
  "Manage Timetable": ["timetable", "subjects"],
  "Approve Leaves": ["teachers", "attendance"],
  "View Payroll": ["payroll"],
  "Edit Settings": ["settings"],
  "Export Data": []
};

const buildAccessFromPermissions = permissions => {
  const modules = new Set();
  Object.entries(permissions || {}).forEach(([perm, enabled]) => {
    if (enabled && PERMISSION_TO_MODULE[perm]) {
      PERMISSION_TO_MODULE[perm].forEach(m => modules.add(m));
    }
  });
  return Array.from(modules);
};

const DEFAULT_ACCESS = {
  teamlead: ["dashboard", "teachers", "operations", "timetable", "students", "shifting", "attendance"],
  teacher: ["operations", "timetable", "attendance", "students"]
};

const ALLOWED_NETWORKS = ["Let's Learn Quran 5G", "Let's Learn Quran 2G", "LLQA-Office", "IBA-WiFi", "LLQA-Guest"];

const NETWORK_OPTIONS = [{
  ssid: "Let's Learn Quran 5G",
  signal: "Excellent",
  speed: "450 Mbps",
  secure: true,
  allowed: true
}, {
  ssid: "Let's Learn Quran 2G",
  signal: "Good",
  speed: "120 Mbps",
  secure: true,
  allowed: true
}, {
  ssid: "LLQA-Office",
  signal: "Good",
  speed: "200 Mbps",
  secure: true,
  allowed: true
}, {
  ssid: "IBA-WiFi",
  signal: "Fair",
  speed: "80 Mbps",
  secure: true,
  allowed: true
}, {
  ssid: "Home WiFi (PTCL)",
  signal: "Excellent",
  speed: "100 Mbps",
  secure: true,
  allowed: false,
  homeNet: true
}, {
  ssid: "Mobile Data (4G)",
  signal: "Good",
  speed: "35 Mbps",
  secure: false,
  allowed: false,
  homeNet: true
}, {
  ssid: "Public Coffee Shop",
  signal: "Fair",
  speed: "15 Mbps",
  secure: false,
  allowed: false,
  homeNet: false
}];

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

const genMAC = () => Array.from({
  length: 6
}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join(":").toUpperCase();

const genFingerprint = () => "FP-" + Math.random().toString(36).substring(2, 10).toUpperCase();

const genGeo = location => {
  const base = {
    lat: 33.6007,
    lng: 73.0679,
    address: "IBA Building, Rawalpindi, Pakistan"
  };
  if (location === "IBA") return {
    ...base,
    accuracy: "5m"
  };
  const variations = [{
    lat: 33.7294,
    lng: 73.0931,
    address: "F-7 Sector, Islamabad"
  }, {
    lat: 33.5651,
    lng: 73.0169,
    address: "Saddar, Rawalpindi"
  }, {
    lat: 33.6844,
    lng: 73.0479,
    address: "G-9 Markaz, Islamabad"
  }, {
    lat: 33.6117,
    lng: 73.0633,
    address: "Westridge, Rawalpindi"
  }, {
    lat: 33.6939,
    lng: 73.0651,
    address: "F-8, Islamabad"
  }];
  const v = variations[Math.floor(Math.random() * variations.length)];
  return {
    ...v,
    accuracy: "12m"
  };
};

const captureSilentPhoto = name => {
  const initials = name.split(" ").map(s => s.charAt(0)).join("").substring(0, 2).toUpperCase();
  const colors = ["#4a7aff", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#ec4899"];
  const col = colors[name.length % colors.length];
  return {
    captured: true,
    initials,
    color: col,
    timestamp: new Date().toISOString()
  };
};

const LOGIN_AUDIT = [{
  id: 1,
  user: "Hafiz Suleman (7834)",
  role: "teacher",
  time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  network: "Let's Learn Quran 5G",
  method: "Fingerprint",
  ip: "192.168.1.45",
  mac: "A4:5E:60:1B:2C:9D",
  device: "Mobile",
  browser: "Chrome",
  status: "success",
  autoAttendance: true,
  location: "IBA",
  geo: {
    lat: 33.6007,
    lng: 73.0679,
    address: "IBA Building, Rawalpindi"
  },
  photo: {
    initials: "HS",
    color: "#4a7aff"
  },
  fingerprint: "FP-A8X3M9K2",
  trusted: true
}, {
  id: 2,
  user: "Hafiz Abdullah ATD (9482)",
  role: "teacher",
  time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  network: "Home WiFi (PTCL)",
  method: "WFH-OTP+GPS",
  ip: "39.45.122.18",
  mac: "B2:1F:8C:A3:4E:5F",
  device: "Desktop",
  browser: "Chrome",
  status: "success",
  autoAttendance: true,
  location: "WFH",
  geo: {
    lat: 33.7294,
    lng: 73.0931,
    address: "F-7 Sector, Islamabad"
  },
  photo: {
    initials: "HA",
    color: "#10b981"
  },
  fingerprint: "FP-K9P2L4N7",
  trusted: true
}, {
  id: 3,
  user: "Qazi Junaid",
  role: "teamlead",
  time: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  network: "Let's Learn Quran 5G",
  method: "Windows Hello",
  ip: "192.168.1.12",
  mac: "D4:7E:91:C5:3B:8A",
  device: "Desktop",
  browser: "Edge",
  status: "success",
  autoAttendance: false,
  location: "IBA",
  geo: {
    lat: 33.6007,
    lng: 73.0679,
    address: "IBA Building, Rawalpindi"
  },
  photo: {
    initials: "QJ",
    color: "#8b5cf6"
  },
  fingerprint: "FP-Z3W5Q8R6",
  trusted: true
}, {
  id: 4,
  user: "Qaria Esha (3325)",
  role: "teacher",
  time: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  network: "Public Coffee Shop",
  method: "-",
  ip: "39.78.245.110",
  mac: "-",
  device: "Mobile",
  browser: "Safari",
  status: "blocked",
  autoAttendance: false,
  location: "WFH",
  geo: null,
  photo: null,
  fingerprint: "FP-NEW9X2L1",
  trusted: false,
  reason: "Untrusted network + new device"
}];

const DEFAULT_TEAM_LEADS = [{
  id: 1,
  name: "Qazi Junaid",
  email: "qazi@llqa.net",
  phone: "+92 312 0000001",
  group: "Male IBA",
  createdAt: "2023-01-15"
}, {
  id: 2,
  name: "Sobia",
  email: "sobia@llqa.net",
  phone: "+92 333 0000002",
  group: "Female",
  createdAt: "2023-01-15"
}, {
  id: 3,
  name: "Faizan Khan",
  email: "faizan@llqa.net",
  phone: "+92 345 0000003",
  group: "WFH Subjects",
  createdAt: "2023-01-15"
}, {
  id: 4,
  name: "Shakeel",
  email: "accounts@llqa.net",
  phone: "+92 300 0000004",
  group: "Accounts",
  createdAt: "2023-01-15"
}];

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
  fontSize: "Medium"
};




const SearchableSelect = ({ options, value, onChange, style, placeholder = "Select..." }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = React.useRef();
  
  React.useEffect(() => {
    const clickOutside = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);
  
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const selectedOpt = options.find(o => String(o.value) === String(value));
  
  return React.createElement("div", { ref, style: { position: "relative", ...style } }, 
    React.createElement("div", {
      onClick: () => { setOpen(!open); setQ(''); },
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
        alignItems: "center"
      }
    }, selectedOpt ? selectedOpt.label : placeholder, React.createElement(ChevronDown, { size: 14 })),
    open && React.createElement("div", {
      style: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: c.bgCard,
        border: "1px solid " + c.border,
        borderRadius: 7,
        marginTop: 4,
        zIndex: 99999,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        maxHeight: 350,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column"
      }
    }, 
      React.createElement("input", {
        autoFocus: true,
        value: q,
        onChange: e => setQ(e.target.value),
        placeholder: "Search...",
        style: {
          padding: "10px 12px",
          border: "none",
          borderBottom: "1px solid " + c.border,
          background: c.bgInput,
          color: c.text,
          outline: "none",
          position: "sticky",
          top: 0
        },
        onClick: e => e.stopPropagation()
      }),
      filtered.length === 0 ? React.createElement("div", { style: { padding: 12, color: c.textMuted, fontSize: 12, textAlign: "center" } }, "No results") :
      filtered.map(o => React.createElement("div", {
        key: o.value,
        onClick: () => { onChange(o.value); setOpen(false); },
        style: {
          padding: "10px 12px",
          cursor: "pointer",
          fontSize: 12,
          color: String(o.value) === String(value) ? c.accent : c.text,
          background: String(o.value) === String(value) ? c.bgInput : "transparent",
          borderBottom: "1px solid " + c.border + "22"
        },
        onMouseEnter: e => { if(String(o.value) !== String(value)) e.currentTarget.style.background = c.bgInput; },
        onMouseLeave: e => { if(String(o.value) !== String(value)) e.currentTarget.style.background = "transparent"; }
      }, o.label))
    )
  );
};

