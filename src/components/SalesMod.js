const SalesMod = ({
  students,
  setStudents,
  salesMasterData,
  upsertSalesMaster,
  teachers,
  setTeachers,
  salesReferrals,
  setSalesReferrals,
}) => {
  const [tab, setTab] = useState("master");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fTeacher, setFTeacher] = useState("all");
  const [modal, setModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pf, setPf] = useState({});
  const [refForm, setRefForm] = useState({});
  const master = salesMasterData || [];
  const current = students || [];
  const refs = salesReferrals || [];
  const masterActive = master.filter(
    (m) => m.status === "active" && m._inSystem !== false,
  );
  const masterLeave = master.filter((m) => m.status === "leave");
  const masterQuit = master.filter((m) => m.status === "quit");
  const masterRemoved = master.filter((m) => m._inSystem === false);
  const teacherOpts = [
    "all",
    ...Array.from(new Set(master.map((m) => m.teacher).filter(Boolean))).sort(),
  ];
  const matchSearch = (o, ql) =>
    [o.name, o.code, o.parent, o.course, o.teacher, o.country, o.state].some(
      (v) =>
        String(v || "")
          .toLowerCase()
          .includes(ql),
    );
  const filteredMaster = useMemo(() => {
    let d = master;
    if (fStatus !== "all")
      d =
        fStatus === "removed"
          ? d.filter((m) => m._inSystem === false)
          : d.filter((m) => m.status === fStatus);
    if (fTeacher !== "all") d = d.filter((m) => m.teacher === fTeacher);
    if (search) {
      const ql = search.toLowerCase();
      d = d.filter((m) => matchSearch(m, ql));
    }
    return d;
  }, [master, fStatus, fTeacher, search]);
  const filteredCurrent = useMemo(() => {
    let d = current;
    if (fStatus !== "all") d = d.filter((s) => s.status === fStatus);
    if (fTeacher !== "all") d = d.filter((s) => s.teacher === fTeacher);
    if (search) {
      const ql = search.toLowerCase();
      d = d.filter((s) => matchSearch(s, ql));
    }
    return d;
  }, [current, fStatus, fTeacher, search]);
  const oView = (rec) =>
    setModal({
      type: "view",
      data: rec,
    });
  const oEdit = (rec) => {
    setEditForm({
      ...rec,
    });
    setModal({
      type: "edit",
      data: rec,
    });
  };
  const saveEdit = () => {
    const id = editForm.id;
    const before =
      current.find((s) => String(s.id) === String(id)) ||
      (modal && modal.data) ||
      {};
    const cells = LLQABooking.studentCells(teachers || [], before);
    const moved =
      String(editForm.teacher || "") !== String(before.teacher || "") ||
      String(editForm.time || "") !== String(before.time || "");
    if (
      cells.length &&
      moved &&
      !confirm(
        "You changed the teacher or class time for " +
          (editForm.name || before.name) +
          ".\n\nThis updates the student record only. The Timetable still has these classes:\n" +
          LLQABooking.cellsText(cells) +
          "\n\nUse Class Shifting to move the actual classes.\n\nSave the record change anyway?",
      )
    )
      return;
    let freeSlots = false;
    if (editForm.status === "quit" && before.status !== "quit" && cells.length) {
      freeSlots = confirm(
        (editForm.name || before.name) +
          " is now marked Quit.\n\nFree their " +
          cells.length +
          " timetable slot(s) so new students can book them?\n\n" +
          LLQABooking.cellsText(cells) +
          "\n\nOK = free the slots  ·  Cancel = keep them booked",
      );
    }
    upsertSalesMaster([
      {
        ...editForm,
      },
    ]);
    if (current.find((s) => String(s.id) === String(id))) {
      setStudents(
        students.map((s) => {
          if (String(s.id) !== String(id)) return s;
          const merged = {
            ...s,
            ...editForm,
          };
          delete merged._inSystem;
          delete merged._removedDate;
          return merged;
        }),
      );
    }
    if (cells.length && setTeachers && teachers) {
      if (freeSlots) setTeachers(LLQABooking.release(teachers, cells));
      else if (
        ["name", "parent", "age", "course", "country", "state", "phone"].some(
          (k) =>
            String(editForm[k] == null ? "" : editForm[k]) !==
            String(before[k] == null ? "" : before[k]),
        )
      )
        setTeachers(
          LLQABooking.updateCells(teachers, cells, { ...before, ...editForm }),
        );
    }
    setModal(null);
  };
  const oDelete = (rec) =>
    setModal({
      type: "delete",
      data: rec,
    });
  const doDelete = () => {
    const id = modal.data.id;
    const stu = current.find((s) => String(s.id) === String(id)) || modal.data;
    const cells = LLQABooking.studentCells(teachers || [], stu);
    if (cells.length && setTeachers && teachers)
      setTeachers(LLQABooking.release(teachers, cells));
    setStudents(students.filter((s) => String(s.id) !== String(id)));
    setModal(null);
  };
  const oAdd = () => {
    setPf({
      name: "",
      age: "",
      gender: "",
      parent: "",
      country: "USA",
      state: "",
      course: "Quran",
      teacher: "",
      fee: "paid",
      time: "",
      dor: todayPK(),
      phone: "",
      email: "",
      hoursPerWeek: "",
      classType: "Regular",
      fee_amount: "",
      currency: "USD",
      notes: "",
      family: "",
    });
    setModal({
      type: "addNew",
    });
  };
  // v64: turn a referral into a student in one step (form pre-filled).
  const oEnrollRef = (r) => {
    setPf({
      name: r.studentName || "",
      age: "",
      gender: "",
      parent: "",
      country: r.country || "USA",
      state: r.state || "",
      course: r.course || "Quran",
      teacher: "",
      fee: "paid",
      time: "",
      dor: todayPK(),
      phone: r.contact || "",
      email: "",
      hoursPerWeek: "",
      classType: "Regular",
      fee_amount: "",
      currency: "USD",
      notes: r.notes || "",
      family: "",
      referredBy: r.referredBy || "",
      _refId: r.id,
    });
    setModal({
      type: "addNew",
    });
  };
  const saveNewSales = () => {
    if (!pf.name || !pf.parent || !pf.course) {
      alert(
        "Please fill in Student Name, Parent / Guardian, and Course \u2014 all three are required.",
      );
      return;
    }
    let courseVal = pf.course;
    if (pf.course === "Other (Custom)") {
      if (!pf.customCourse || !pf.customCourse.trim()) {
        alert("Please enter a custom course name in the text field.");
        return;
      }
      courseVal = pf.customCourse.trim();
    }
    const nLower = pf.name.trim().toLowerCase();
    const parentLower = (pf.parent || "").trim().toLowerCase();
    const exact = current.find(
      (s) =>
        (s.name || "").trim().toLowerCase() === nLower &&
        (s.parent || "").trim().toLowerCase() === parentLower,
    );
    const nameOnly = current.find(
      (s) => (s.name || "").trim().toLowerCase() === nLower,
    );
    if (exact) {
      alert(
        '\u26A0 This student already exists.\n\n"' +
          pf.name +
          '" with parent/lead "' +
          pf.parent +
          '" is already in the system.\n\nIf this is a different person, please update the parent/lead name to distinguish them.',
      );
      return;
    }
    if (nameOnly) {
      if (
        !confirm(
          '\u26A0 A student with the name "' +
            pf.name +
            '" already exists (parent: ' +
            nameOnly.parent +
            ", teacher: " +
            nameOnly.teacher +
            ").\n\nClick OK to save anyway (different person with same name), or Cancel to go back.",
        )
      )
        return;
    }
    const newId = Math.max(0, ...current.map((s) => parseInt(s.id) || 0)) + 1;
    const newStudent = {
      id: newId,
      name: pf.name,
      code: pf.code || "",
      age: parseInt(pf.age) || 0,
      gender: pf.gender || "",
      parent: pf.parent,
      family: pf.family || "",
      country: pf.country || "USA",
      state: pf.state || "",
      course: courseVal,
      teacher: pf.teacher || "Unassigned",
      fee: pf.fee || "trial",
      time: pf.time || "",
      dor: pf.dor || todayPK(),
      phone: pf.phone || "",
      email: pf.email || "",
      hoursPerWeek: pf.hoursPerWeek || "",
      classType: pf.classType || "Regular",
      fee_amount: pf.fee_amount || "",
      currency: pf.currency || "USD",
      status: "active",
      page: 0,
      qaida: 0,
      attended: 0,
      totalClasses: 0,
      attendance: 100,
      lastLesson: "",
      lastDate: "",
      lB: "Good",
      lP: "Satisfactory",
      lH: "Not Assigned",
      lR: "N/A",
      lT: "N/A",
      notes: pf.notes || "",
      referredBy: pf.referredBy || "",
      trial: "trial",
      trialStart: pf.dor || todayPK(),
    };
    // v64: every slot is checked and booked through LLQABooking —
    // all-or-nothing, on the student's day, never on top of another student.
    const isQuranCourse = pf.course !== "Subject";
    const rowsAll = Array.isArray(pf.schedule) ? pf.schedule : [];
    const pl = LLQABooking.plan({
      rows: rowsAll,
      country: pf.country,
      state: pf.state,
      teachers: teachers || [],
      isQuran: isQuranCourse,
      master: isQuranCourse ? (rowsAll[0] && rowsAll[0].teacher) || "" : "",
    });
    if (pl.problems.length) {
      alert(
        "Student NOT saved — please fix the class schedule first:\n\n• " +
          pl.problems.join("\n• "),
      );
      return;
    }
    const subLabel =
      pf.course === "Subject"
        ? Array.isArray(pf.specificSubject) && pf.specificSubject.length > 0
          ? pf.specificSubject.join(", ")
          : "Subject"
        : "";
    const stu = {
      ...newStudent,
      // never reuse the id of a removed student (Sales Master Data) or of a
      // booking still in the Timetable
      id: LLQABooking.nextStudentId([current, master], teachers),
      teacher: pl.items.length ? pl.items[0].teacher : newStudent.teacher,
      time: pl.items.length
        ? pl.items.map((it) => it.day + "|" + it.time).join(", ")
        : newStudent.time,
      hoursPerWeek: pl.items.length
        ? String(pl.items.length * 0.5)
        : newStudent.hoursPerWeek,
      schedule: pl.items.map((it) => ({
        day: it.day,
        time: it.time,
        teacher: it.teacher,
        pktDay: it.pktDay,
        pktSlot: it.slot,
      })),
      tz: pl.tz || "",
      parentId: newStudent.parentId || LLQABooking.newParentId(current),
    };
    let nextTeachers = null;
    if (pl.items.length) {
      if (!setTeachers || !teachers) {
        alert("Student NOT saved — the Timetable is still loading. Please try again in a moment.");
        return;
      }
      const res = LLQABooking.book(teachers, pl.items, { ...stu, sub: subLabel });
      if (!res.ok) {
        alert(
          "Student NOT saved — the Timetable changed while the form was open:\n\n• " +
            res.problems.join("\n• "),
        );
        return;
      }
      nextTeachers = res.teachers;
    }
    setStudents([...current, stu]);
    if (nextTeachers) setTeachers(nextTeachers);
    if (pf._refId && setSalesReferrals) {
      setSalesReferrals(
        refs.map((r) =>
          r.id === pf._refId
            ? { ...r, status: "Enrolled", studentId: stu.id, enrolledDate: todayPK() }
            : r,
        ),
      );
    }
    setModal(null);
    alert(LLQABooking.bookingSummary(stu.name, pl.items, stu.parentId));
  };
  const REF_STATUSES = [
    "New",
    "Contacted",
    "Trial Scheduled",
    "Enrolled",
    "Declined",
  ];
  const refStatusColor = (st) =>
    ({
      New: "accent",
      Contacted: "cyan",
      "Trial Scheduled": "warn",
      Enrolled: "success",
      Declined: "danger",
    })[st] || "accent";
  const oAddRef = () => {
    setRefForm({
      studentName: "",
      referredBy: "",
      relationship: "",
      contact: "",
      country: "USA",
      state: "",
      course: "Quran",
      date: todayPK(),
      status: "New",
      reward: "",
      notes: "",
    });
    setModal({
      type: "refAdd",
    });
  };
  const oEditRef = (r) => {
    setRefForm({
      ...r,
    });
    setModal({
      type: "refEdit",
      data: r,
    });
  };
  const saveRef = () => {
    if (!refForm.studentName || !refForm.studentName.trim()) {
      alert("Please enter the referred student's name.");
      return;
    }
    if (modal.type === "refEdit") {
      setSalesReferrals(
        refs.map((r) =>
          r.id === refForm.id
            ? {
                ...refForm,
              }
            : r,
        ),
      );
    } else {
      setSalesReferrals([
        ...refs,
        {
          ...refForm,
          id: Date.now(),
        },
      ]);
    }
    setModal(null);
  };
  const oDeleteRef = (r) =>
    setModal({
      type: "refDelete",
      data: r,
    });
  const doDeleteRef = () => {
    setSalesReferrals(refs.filter((r) => r.id !== modal.data.id));
    setModal(null);
  };
  const thisMonth = todayPK().slice(0, 7);
  const refsFiltered = useMemo(() => {
    let d = refs;
    if (fStatus !== "all") d = d.filter((r) => r.status === fStatus);
    if (search) {
      const ql = search.toLowerCase();
      d = d.filter((r) =>
        [
          r.studentName,
          r.referredBy,
          r.relationship,
          r.contact,
          r.course,
          r.country,
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(ql),
        ),
      );
    }
    return d;
  }, [refs, fStatus, search]);
  const statusColor = (st) =>
    ({
      active: "success",
      leave: "warn",
      quit: "danger",
      new: "cyan",
    })[st] || "accent";
  const exportCSV = (rows, kind) => {
    let cols, mapper;
    if (kind === "references") {
      cols = [
        "New Student",
        "Referred By",
        "Relationship",
        "Contact",
        "Country",
        "Course",
        "Date",
        "Status",
        "Reward",
        "Notes",
      ];
      mapper = (r) => [
        r.studentName,
        r.referredBy,
        r.relationship,
        r.contact,
        r.country,
        r.course,
        r.date,
        r.status,
        r.reward,
        r.notes,
      ];
    } else if (kind === "master") {
      cols = [
        "Name",
        "Code",
        "Parent",
        "Course",
        "Teacher",
        "Country",
        "State",
        "Enrolled",
        "Status",
        "In System",
      ];
      mapper = (r) => [
        r.name,
        r.code,
        r.parent,
        r.course,
        r.teacher,
        r.country,
        r.state,
        r.dor,
        r.status,
        r._inSystem === false ? "Removed" : "Yes",
      ];
    } else {
      cols = [
        "Name",
        "Code",
        "Parent",
        "Course",
        "Teacher",
        "Country",
        "State",
        "Time",
        "Fee",
        "Status",
      ];
      mapper = (r) => [
        r.name,
        r.code,
        r.parent,
        r.course,
        r.teacher,
        r.country,
        r.state,
        r.time,
        r.fee,
        r.status,
      ];
    }
    const safe = (v) =>
      '"' +
      String(v == null ? "" : v)
        .split('"')
        .join('""') +
      '"';
    let csv = cols.join(",") + "\n";
    rows.forEach((r) => {
      csv += mapper(r).map(safe).join(",") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      (kind === "references"
        ? "Sales-References-"
        : kind === "master"
          ? "Sales-Master-Data-"
          : "Current-Students-") +
      todayPK() +
      ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const thStyle = {
    padding: "9px 10px",
    textAlign: "left",
    color: c.textSec,
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    borderBottom: "1px solid " + c.border,
    background: c.bgDeep,
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "8px 10px",
  };
  const renderStudentTable = (rows, isMstr) =>
    React.createElement(
      "div",
      {
        style: {
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid " + c.border,
        },
      },
      React.createElement(
        "table",
        {
          style: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11,
          },
        },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            [
              "#",
              "Name",
              "Code",
              "Parent",
              "Course",
              "Teacher",
              "Country",
              isMstr ? "Enrolled" : "Time",
              isMstr ? "System" : "Fee",
              "Status",
              "",
            ].map((h) =>
              React.createElement(
                "th",
                {
                  key: h,
                  style: thStyle,
                },
                h,
              ),
            ),
          ),
        ),
        React.createElement(
          "tbody",
          null,
          rows.length === 0
            ? React.createElement(
                "tr",
                null,
                React.createElement(
                  "td",
                  {
                    colSpan: 11,
                    style: {
                      padding: 30,
                      textAlign: "center",
                      color: c.textMuted,
                      fontSize: 12,
                    },
                  },
                  "No records match your search/filter.",
                ),
              )
            : rows.map((r, i) => {
                const removed = r._inSystem === false;
                return React.createElement(
                  "tr",
                  {
                    key: r.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: removed
                        ? c.dangerBg + "44"
                        : i % 2
                          ? c.bgDeep + "88"
                          : "transparent",
                      opacity: removed ? 0.85 : 1,
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textMuted,
                      },
                    },
                    i + 1,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        fontWeight: 600,
                        color: c.text,
                      },
                    },
                    r.name,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        fontFamily: "monospace",
                        color: c.text,
                      },
                    },
                    r.code,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textSec,
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                    },
                    r.parent,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.cyan,
                      },
                    },
                    r.course,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textSec,
                      },
                    },
                    r.teacher,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: tdStyle,
                    },
                    React.createElement(Badge, {
                      text: r.country || "\u2014",
                      color: "purple",
                    }),
                  ),
                  isMstr
                    ? React.createElement(
                        "td",
                        {
                          style: {
                            ...tdStyle,
                            color: c.textSec,
                          },
                        },
                        r.dor || "\u2014",
                      )
                    : React.createElement(
                        "td",
                        {
                          style: {
                            ...tdStyle,
                            color: c.textSec,
                          },
                        },
                        r.time || "\u2014",
                      ),
                  isMstr
                    ? React.createElement(
                        "td",
                        {
                          style: tdStyle,
                        },
                        removed
                          ? React.createElement(
                              "span",
                              {
                                style: {
                                  color: c.danger,
                                  fontSize: 10,
                                  fontWeight: 600,
                                },
                              },
                              "\u2716 Removed",
                            )
                          : React.createElement(
                              "span",
                              {
                                style: {
                                  color: c.success,
                                  fontSize: 10,
                                  fontWeight: 600,
                                },
                              },
                              "\u2713 In system",
                            ),
                      )
                    : React.createElement(
                        "td",
                        {
                          style: tdStyle,
                        },
                        React.createElement(Badge, {
                          text: r.fee || "\u2014",
                          color:
                            r.fee === "paid"
                              ? "success"
                              : r.fee === "overdue"
                                ? "danger"
                                : "accent",
                        }),
                      ),
                  React.createElement(
                    "td",
                    {
                      style: tdStyle,
                    },
                    React.createElement(Badge, {
                      text: r.status || "\u2014",
                      color: statusColor(r.status),
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        whiteSpace: "nowrap",
                      },
                    },
                    React.createElement(
                      "button",
                      {
                        onClick: () => oView(r),
                        title: "View details",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.accent,
                        },
                      },
                      React.createElement(Eye, {
                        size: 14,
                      }),
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => oEdit(r),
                        title: "Edit",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.warn,
                        },
                      },
                      React.createElement(Edit2, {
                        size: 14,
                      }),
                    ),
                    !isMstr &&
                      React.createElement(
                        "button",
                        {
                          onClick: () => oDelete(r),
                          title:
                            "Delete from live roster (stays in Master archive)",
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 3,
                            color: c.danger,
                          },
                        },
                        React.createElement(Trash2, {
                          size: 14,
                        }),
                      ),
                  ),
                );
              }),
        ),
      ),
    );
  const renderRefTable = () =>
    React.createElement(
      "div",
      {
        style: {
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid " + c.border,
        },
      },
      React.createElement(
        "table",
        {
          style: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11,
          },
        },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            [
              "#",
              "New Student",
              "Referred By",
              "Relationship",
              "Contact",
              "Course",
              "Date",
              "Status",
              "",
            ].map((h) =>
              React.createElement(
                "th",
                {
                  key: h,
                  style: thStyle,
                },
                h,
              ),
            ),
          ),
        ),
        React.createElement(
          "tbody",
          null,
          refsFiltered.length === 0
            ? React.createElement(
                "tr",
                null,
                React.createElement(
                  "td",
                  {
                    colSpan: 9,
                    style: {
                      padding: 30,
                      textAlign: "center",
                      color: c.textMuted,
                      fontSize: 12,
                    },
                  },
                  "No referrals yet. Click \u201CAdd Reference\u201D to log a student who came through a referral.",
                ),
              )
            : refsFiltered.map((r, i) =>
                React.createElement(
                  "tr",
                  {
                    key: r.id,
                    style: {
                      borderBottom: "1px solid " + c.border,
                      background: i % 2 ? c.bgDeep + "88" : "transparent",
                    },
                  },
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textMuted,
                      },
                    },
                    i + 1,
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        fontWeight: 600,
                        color: c.text,
                      },
                    },
                    r.studentName,
                    r._auto &&
                      React.createElement(
                        "span",
                        {
                          style: {
                            marginLeft: 6,
                            fontSize: 8,
                            fontWeight: 700,
                            color: c.purple,
                            background: c.purpleBg,
                            padding: "1px 5px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          },
                        },
                        "auto",
                      ),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textSec,
                      },
                    },
                    r.referredBy || "\u2014",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textSec,
                      },
                    },
                    r.relationship || "\u2014",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textSec,
                        fontFamily: "monospace",
                      },
                    },
                    r.contact || "\u2014",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.cyan,
                      },
                    },
                    r.course || "\u2014",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        color: c.textSec,
                      },
                    },
                    r.date || "\u2014",
                  ),
                  React.createElement(
                    "td",
                    {
                      style: tdStyle,
                    },
                    React.createElement(Badge, {
                      text: r.status || "New",
                      color: refStatusColor(r.status),
                    }),
                  ),
                  React.createElement(
                    "td",
                    {
                      style: {
                        ...tdStyle,
                        whiteSpace: "nowrap",
                      },
                    },
                    !r.studentId &&
                      r.status !== "Enrolled" &&
                      React.createElement(
                        "button",
                        {
                          onClick: () => oEnrollRef(r),
                          title: "Enroll as a student (Add Student opens pre-filled)",
                          style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 3,
                            color: c.success,
                          },
                        },
                        React.createElement(UserPlus, {
                          size: 14,
                        }),
                      ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => oEditRef(r),
                        title: "Edit",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.warn,
                        },
                      },
                      React.createElement(Edit2, {
                        size: 14,
                      }),
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => oDeleteRef(r),
                        title: "Delete referral",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 3,
                          color: c.danger,
                        },
                      },
                      React.createElement(Trash2, {
                        size: 14,
                      }),
                    ),
                  ),
                ),
              ),
        ),
      ),
    );
  // v64: Booking Health — compares every student's saved class times with the
  // Timetable and repairs the safe problems in one click.
  const renderHealth = () => {
    const B = LLQABooking;
    const H = B.healthFor(teachers, students, salesMasterData);
    const ql = (search || "").toLowerCase();
    const match = (x) =>
      !ql ||
      [x.stu && x.stu.name, x.stu && x.stu.parent, x.teacher, x.problem, x.label].some(
        (v) => String(v || "").toLowerCase().includes(ql),
      );
    const action = H.issues.filter(
      (x) => x.kind !== "info" && x.kind !== "extra" && x.kind !== "clock" && match(x),
    );
    const info = H.issues.filter((x) => (x.kind === "info" || x.kind === "extra") && match(x));
    const clock = H.issues.filter((x) => x.kind === "clock" && match(x));
    const fixable = action.filter((x) => x.fix);
    const n = (k) => H.issues.filter((x) => x.kind === k).length;
    const runFixes = (list) => {
      if (!list.length || !setTeachers || !teachers) return;
      if (
        !confirm(
          "Apply " + list.length + " fix" + (list.length === 1 ? "" : "es") + " to the Timetable?\n\n" +
            list.slice(0, 12).map((x) => "• " + ((x.stu && x.stu.name) || "?") + " — " + x.problem).join("\n") +
            (list.length > 12 ? "\n… and " + (list.length - 12) + " more" : ""),
        )
      )
        return;
      const res = B.applyFixes(teachers, list.map((x) => x.fix));
      setTeachers(res.teachers);
      alert(
        "✓ " + res.done + " fix" + (res.done === 1 ? "" : "es") + " applied to the Timetable." +
          (res.skipped.length ? "\n\nSkipped (the Timetable changed meanwhile):\n• " + res.skipped.join("\n• ") : ""),
      );
    };
    const KIND = {
      missing: ["Not booked", c.warn],
      wrongday: ["Wrong day", c.danger],
      clash: ["Clash", c.danger],
      quit: ["Quit — still booked", c.purple],
      removed: ["Removed — still booked", c.purple],
    };
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        {
          style: {
            padding: "10px 12px",
            background: c.accentBg,
            border: "1px solid " + c.accent + "33",
            borderRadius: 8,
            color: c.textSec,
            fontSize: 11,
            lineHeight: 1.6,
            marginBottom: 12,
          },
        },
        "Checks every student's saved class days and times against the Timetable: classes never booked, classes on the wrong day, clashes with another student, and slots still held by students who quit or were removed. Safe fixes only book free slots or free slots that belong to that same student — nothing else is touched.",
      ),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
        React.createElement(SC, { icon: Users, label: "Students checked", value: H.checked, color: c.accent }),
        React.createElement(SC, { icon: Check, label: "All correct", value: H.okCount, color: c.success }),
        React.createElement(SC, { icon: Calendar, label: "Not booked", value: n("missing"), color: c.warn }),
        React.createElement(SC, { icon: AlertTriangle, label: "Wrong day / clash", value: n("wrongday") + n("clash"), color: c.danger }),
        React.createElement(SC, { icon: UserX, label: "Left but holding slots", value: n("quit") + n("removed"), color: c.purple }),
      ),
      action.length === 0
        ? React.createElement(
            "div",
            {
              style: {
                padding: 22,
                textAlign: "center",
                color: c.success,
                background: c.successBg,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              },
            },
            H.checked
              ? "✓ Every checked student's classes match the Timetable."
              : "No students with saved class times to check yet.",
          )
        : React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 } },
              React.createElement(
                "div",
                { style: { color: c.textSec, fontSize: 12 } },
                action.length + " problem" + (action.length === 1 ? "" : "s") + " found · " + fixable.length + " can be fixed automatically",
              ),
              fixable.length > 0 &&
                React.createElement(
                  Btn,
                  { icon: Check, onClick: () => runFixes(fixable) },
                  "Fix " + fixable.length + " safe issue" + (fixable.length === 1 ? "" : "s"),
                ),
            ),
            React.createElement(
              "div",
              { style: { overflowX: "auto", border: "1px solid " + c.border, borderRadius: 10, marginBottom: 12 } },
              React.createElement(
                "table",
                { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 } },
                React.createElement(
                  "thead",
                  null,
                  React.createElement(
                    "tr",
                    null,
                    ["Student", "Teacher", "Class", "Problem", ""].map((h, i) =>
                      React.createElement("th", { key: i, style: thStyle }, h),
                    ),
                  ),
                ),
                React.createElement(
                  "tbody",
                  null,
                  action.map((x, i) => {
                    const k = KIND[x.kind] || [x.kind, c.textSec];
                    return React.createElement(
                      "tr",
                      { key: i, style: { borderBottom: "1px solid " + c.border } },
                      React.createElement(
                        "td",
                        { style: { ...tdStyle, color: c.text, fontWeight: 600 } },
                        (x.stu && x.stu.name) || "?",
                        React.createElement(
                          "div",
                          { style: { color: c.textMuted, fontSize: 10, fontWeight: 400 } },
                          (x.stu && x.stu.parent) || "",
                        ),
                      ),
                      React.createElement("td", { style: { ...tdStyle, color: c.textSec } }, x.teacher || "—"),
                      React.createElement("td", { style: { ...tdStyle, color: c.textSec, fontSize: 11 } }, x.label || ""),
                      React.createElement(
                        "td",
                        { style: tdStyle },
                        React.createElement("span", { style: { color: k[1], fontWeight: 700, fontSize: 11 } }, k[0]),
                        React.createElement(
                          "div",
                          { style: { color: c.textSec, fontSize: 11 } },
                          x.problem + (x.note ? " — " + x.note : ""),
                        ),
                      ),
                      React.createElement(
                        "td",
                        { style: { ...tdStyle, whiteSpace: "nowrap" } },
                        x.fix
                          ? React.createElement(
                              Btn,
                              { variant: "outline", onClick: () => runFixes([x]) },
                              x.fix.type === "free" ? "Free slots" : x.fix.type === "move" ? "Move" : "Book",
                            )
                          : React.createElement("span", { style: { color: c.textMuted, fontSize: 11 } }, "Fix in Timetable"),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ),
      clock.length > 0 &&
        React.createElement(
          "details",
          {
            style: {
              color: c.textSec,
              fontSize: 11,
              marginBottom: 12,
              padding: "8px 12px",
              background: c.accentBg,
              border: "1px solid " + c.accent + "33",
              borderRadius: 8,
            },
          },
          React.createElement(
            "summary",
            { style: { cursor: "pointer", color: c.accent, fontWeight: 600, lineHeight: 1.5 } },
            "🕐 " + clock.length + " class" + (clock.length === 1 ? " is" : "es are") +
              " still on the Pakistan time from before the student's clock change, so the family's local time has moved. Tell these families, or move the classes in Class Shifting.",
          ),
          clock.map((x, i) =>
            React.createElement(
              "div",
              { key: i, style: { padding: "4px 0", borderBottom: "1px solid " + c.border } },
              ((x.stu && x.stu.name) || "?") + " (" + (x.teacher || "?") + ") — " + x.label + " — " + x.problem,
            ),
          ),
        ),
      info.length > 0 &&
        React.createElement(
          "details",
          { style: { color: c.textSec, fontSize: 11, marginBottom: 12 } },
          React.createElement(
            "summary",
            { style: { cursor: "pointer", marginBottom: 6 } },
            info.length + " note" + (info.length === 1 ? "" : "s") + " that can't be checked automatically (older records, extra classes added in the Timetable)",
          ),
          info.map((x, i) =>
            React.createElement(
              "div",
              { key: i, style: { padding: "4px 0", borderBottom: "1px solid " + c.border } },
              ((x.stu && x.stu.name) || "?") + " — " + (x.label ? x.label + " — " : "") + x.problem,
            ),
          ),
        ),
    );
  };
  const isMaster = tab === "master";
  const isRefs = tab === "references";
  const isHealth = tab === "health";
  const studentRows = isMaster ? filteredMaster : filteredCurrent;
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
          flexWrap: "wrap",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            width: 48,
            height: 48,
            borderRadius: 12,
            background: c.purple + "22",
            border: "1px solid " + c.purple + "55",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        React.createElement(Target, {
          size: 24,
          color: c.purple,
        }),
      ),
      React.createElement(
        "div",
        {
          style: {
            flex: 1,
            minWidth: 200,
          },
        },
        React.createElement(
          "h1",
          {
            style: {
              color: c.text,
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
            },
          },
          "Sales",
        ),
        React.createElement(
          "div",
          {
            style: {
              color: c.textSec,
              fontSize: 11,
              marginTop: 4,
            },
          },
          "Permanent student master archive \xB7 live roster \xB7 referrals",
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          },
        },
        isRefs
          ? React.createElement(
              Btn,
              {
                icon: Plus,
                onClick: oAddRef,
              },
              "Add Reference",
            )
          : React.createElement(
              Btn,
              {
                icon: UserPlus,
                onClick: oAdd,
              },
              "Add Student",
            ),
        React.createElement(
          Btn,
          {
            variant: "outline",
            icon: Download,
            onClick: () =>
              exportCSV(
                isRefs ? refsFiltered : studentRows,
                isRefs ? "references" : isMaster ? "master" : "current",
              ),
          },
          "Export",
        ),
      ),
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 2,
          background: c.bgDeep,
          borderRadius: 8,
          padding: 3,
          marginBottom: 14,
          width: "fit-content",
          flexWrap: "wrap",
        },
      },
      [
        ["master", "Sales Master Data"],
        ["current", "Current Students List"],
        ["references", "References"],
        ["health", "Booking Health"],
      ].map(([k, l]) =>
        React.createElement(
          "button",
          {
            key: k,
            onClick: () => {
              setTab(k);
              setFStatus("all");
            },
            style: {
              padding: "8px 18px",
              borderRadius: 6,
              border:
                tab === k ? "1px solid transparent" : "1px solid " + c.border,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              background: tab === k ? c.accent : "transparent",
              color: tab === k ? c.accentText : c.textSec,
            },
          },
          l,
        ),
      ),
    ),
    isMaster &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
          },
        },
        React.createElement(SC, {
          icon: Users,
          label: "Total Ever Enrolled",
          value: master.length,
          color: c.accent,
        }),
        React.createElement(SC, {
          icon: Check,
          label: "Active Now",
          value: masterActive.length,
          color: c.success,
        }),
        React.createElement(SC, {
          icon: Coffee,
          label: "On Leave",
          value: masterLeave.length,
          color: c.warn,
        }),
        React.createElement(SC, {
          icon: UserX,
          label: "Quit",
          value: masterQuit.length,
          color: c.danger,
        }),
        React.createElement(SC, {
          icon: Trash2,
          label: "Removed from System",
          value: masterRemoved.length,
          color: masterRemoved.length > 0 ? c.purple : c.textMuted,
        }),
      ),
    tab === "current" &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
          },
        },
        React.createElement(SC, {
          icon: Users,
          label: "Current Total",
          value: current.length,
          color: c.accent,
        }),
        React.createElement(SC, {
          icon: Check,
          label: "Active",
          value: current.filter((s) => s.status === "active").length,
          color: c.success,
        }),
        React.createElement(SC, {
          icon: Coffee,
          label: "On Leave",
          value: current.filter((s) => s.status === "leave").length,
          color: c.warn,
        }),
        React.createElement(SC, {
          icon: UserX,
          label: "Quit",
          value: current.filter((s) => s.status === "quit").length,
          color: c.danger,
        }),
      ),
    isRefs &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
          },
        },
        React.createElement(SC, {
          icon: Users,
          label: "Total Referrals",
          value: refs.length,
          color: c.accent,
        }),
        React.createElement(SC, {
          icon: Clock,
          label: "New / Pending",
          value: refs.filter(
            (r) => r.status === "New" || r.status === "Contacted",
          ).length,
          color: c.warn,
        }),
        React.createElement(SC, {
          icon: Check,
          label: "Enrolled",
          value: refs.filter((r) => r.status === "Enrolled").length,
          color: c.success,
        }),
        React.createElement(SC, {
          icon: TrendingUp,
          label: "This Month",
          value: refs.filter(
            (r) => String(r.date || "").slice(0, 7) === thisMonth,
          ).length,
          color: c.cyan,
        }),
      ),
    isMaster &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: c.accentBg,
            border: "1px solid " + c.accent + "33",
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 11,
            color: c.textSec,
          },
        },
        React.createElement(Shield, {
          size: 14,
          color: c.accent,
        }),
        React.createElement(
          "span",
          null,
          React.createElement(
            "strong",
            {
              style: {
                color: c.accent,
              },
            },
            "Permanent archive: ",
          ),
          "every student from day one is kept here forever. Records stay even after a student is deleted elsewhere \u2014 deletion is disabled on this tab by design. Edits and status changes from Operations sync automatically.",
        ),
      ),
    isRefs &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: c.purpleBg,
            border: "1px solid " + c.purple + "33",
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 11,
            color: c.textSec,
          },
        },
        React.createElement(UserPlus, {
          size: 14,
          color: c.purple,
        }),
        React.createElement(
          "span",
          null,
          React.createElement(
            "strong",
            {
              style: {
                color: c.purple,
              },
            },
            "Referrals: ",
          ),
          "log every new student who comes through a referral \u2014 who referred them, the relationship, and how the lead is progressing. Move status to ",
          React.createElement(
            "strong",
            {
              style: {
                color: c.success,
              },
            },
            "Enrolled",
          ),
          " once they join, then add them as a full student from the other tabs.",
        ),
      ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            position: "relative",
            flex: 1,
            minWidth: 200,
          },
        },
        React.createElement(Search, {
          size: 14,
          style: {
            position: "absolute",
            left: 10,
            top: 9,
            color: c.textMuted,
          },
        }),
        React.createElement("input", {
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: isRefs
            ? "Search referred student, referrer, contact, course..."
            : "Search name, code, parent, course, teacher, country...",
          style: {
            width: "100%",
            padding: "8px 12px 8px 30px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 7,
            color: c.text,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          },
        }),
      ),
      React.createElement(
        NativeSelectWrapper,
        {
          value: fStatus,
          onChange: (e) => setFStatus(e.target.value),
          style: {
            padding: "8px 10px",
            background: c.bgInput,
            border: "1px solid " + c.border,
            borderRadius: 7,
            color: c.text,
            fontSize: 11,
          },
        },
        isRefs
          ? [
              React.createElement(
                "option",
                {
                  key: "all",
                  value: "all",
                },
                "All Statuses",
              ),
              ...REF_STATUSES.map((st) =>
                React.createElement(
                  "option",
                  {
                    key: st,
                    value: st,
                  },
                  st,
                ),
              ),
            ]
          : [
              React.createElement(
                "option",
                {
                  key: "all",
                  value: "all",
                },
                "All Statuses",
              ),
              React.createElement(
                "option",
                {
                  key: "active",
                  value: "active",
                },
                "Active",
              ),
              React.createElement(
                "option",
                {
                  key: "leave",
                  value: "leave",
                },
                "On Leave",
              ),
              React.createElement(
                "option",
                {
                  key: "quit",
                  value: "quit",
                },
                "Quit",
              ),
              isMaster &&
                React.createElement(
                  "option",
                  {
                    key: "removed",
                    value: "removed",
                  },
                  "Removed from System",
                ),
            ],
      ),
      !isRefs &&
        React.createElement(
          NativeSelectWrapper,
          {
            value: fTeacher,
            onChange: (e) => setFTeacher(e.target.value),
            style: {
              padding: "8px 10px",
              background: c.bgInput,
              border: "1px solid " + c.border,
              borderRadius: 7,
              color: c.text,
              fontSize: 11,
              maxWidth: 200,
            },
          },
          teacherOpts.map((t) =>
            React.createElement(
              "option",
              {
                key: t,
                value: t,
              },
              t === "all" ? "All Teachers" : t,
            ),
          ),
        ),
    ),
    isHealth
      ? renderHealth()
      : isRefs
        ? renderRefTable()
        : renderStudentTable(studentRows, isMaster),
    modal &&
      modal.type === "addNew" &&
      React.createElement(StudentFormModal, {
        pf,
        setPf,
        sts: current,
        appTeachers: teachers,
        onSave: saveNewSales,
        onClose: () => setModal(null),
      }),
    modal &&
      modal.type === "view" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1e3,
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
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 560,
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
                marginBottom: 16,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg," + c.purple + "," + c.cyan + ")",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fff",
                  },
                },
                (modal.data.name || "?")[0],
              ),
              React.createElement(
                "div",
                null,
                React.createElement(
                  "h3",
                  {
                    style: {
                      color: c.text,
                      fontSize: 16,
                      margin: 0,
                    },
                  },
                  modal.data.name,
                ),
                React.createElement(
                  "p",
                  {
                    style: {
                      color: c.textSec,
                      fontSize: 11,
                      margin: "2px 0 0",
                    },
                  },
                  "Code: ",
                  modal.data.code,
                  " \xB7 ",
                  modal.data.country || "\u2014",
                  modal.data._inSystem === false
                    ? " \xB7 Removed from system"
                    : "",
                ),
              ),
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
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
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                marginBottom: 16,
              },
            },
            [
              ["Parent", modal.data.parent],
              ["Course", modal.data.course],
              ["Teacher", modal.data.teacher],
              ["Country", modal.data.country],
              ["State", modal.data.state],
              ["Class Time", modal.data.time],
              ["Enrolled", modal.data.dor],
              ["Fee", modal.data.fee],
              ["Status", modal.data.status],
              ["Age", modal.data.age],
              ["Phone", modal.data.phone],
              [
                "Attendance",
                modal.data.attendance != null
                  ? modal.data.attendance + "%"
                  : "\u2014",
              ],
            ].map(([l, v]) =>
              React.createElement(
                "div",
                {
                  key: l,
                  style: {
                    background: c.bgDeep,
                    borderRadius: 8,
                    padding: "10px 12px",
                  },
                },
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
                  l,
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      color: c.text,
                      fontSize: 12,
                      fontWeight: 500,
                    },
                  },
                  v == null || v === "" ? "\u2014" : String(v),
                ),
              ),
            ),
          ),
          modal.data.lastLesson &&
            React.createElement(
              "div",
              {
                style: {
                  background: c.bgDeep,
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 16,
                },
              },
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
                "Last Lesson (" + (modal.data.lastDate || "\u2014") + ")",
              ),
              React.createElement(
                "div",
                {
                  style: {
                    color: c.text,
                    fontSize: 12,
                  },
                },
                modal.data.lastLesson,
              ),
            ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Close",
            ),
            React.createElement(
              Btn,
              {
                icon: Edit2,
                onClick: () => oEdit(modal.data),
              },
              "Edit",
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "edit" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1e3,
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
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 540,
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
                marginBottom: 16,
              },
            },
            React.createElement(
              "h3",
              {
                style: {
                  color: c.text,
                  fontSize: 16,
                  margin: 0,
                },
              },
              "Edit Student Record",
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
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
          modal.data._inSystem === false &&
            React.createElement(
              "div",
              {
                style: {
                  padding: "8px 12px",
                  background: c.warnBg,
                  border: "1px solid " + c.warn + "44",
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: 11,
                  color: c.warn,
                },
              },
              "This student was removed from the live system. Editing here updates the permanent archive only.",
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
              label: "Name",
              value: editForm.name || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  name: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Code",
              value: editForm.code || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  code: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Parent / Guardian",
              value: editForm.parent || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  parent: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Course",
              value: editForm.course || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  course: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Teacher",
              value: editForm.teacher || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  teacher: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Status",
              value: editForm.status || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  status: v,
                }),
              options: ["active", "leave", "quit", "new"],
            }),
            React.createElement(Inp, {
              label: "Country",
              value: editForm.country || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  country: v,
                }),
            }),
            React.createElement(Inp, {
              label: "State / Province",
              value: editForm.state || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  state: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Class Time",
              value: editForm.time || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  time: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Fee Status",
              value: editForm.fee || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  fee: v,
                }),
              options: ["paid", "overdue", "n/a"],
            }),
            React.createElement(Inp, {
              label: "Age",
              value: editForm.age || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  age: v,
                }),
              type: "number",
            }),
            React.createElement(Inp, {
              label: "Enrolled Date",
              value: editForm.dor || "",
              onChange: (v) =>
                setEditForm({
                  ...editForm,
                  dor: v,
                }),
              type: "date",
            }),
          ),
          React.createElement(Inp, {
            label: "Notes",
            value: editForm.notes || "",
            onChange: (v) =>
              setEditForm({
                ...editForm,
                notes: v,
              }),
            placeholder: "Optional notes",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 14,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                onClick: saveEdit,
              },
              "Save Changes",
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "delete" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1e3,
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
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 420,
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 48,
                height: 48,
                borderRadius: 12,
                background: c.dangerBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              },
            },
            React.createElement(Trash2, {
              size: 22,
              color: c.danger,
            }),
          ),
          React.createElement(
            "h3",
            {
              style: {
                color: c.text,
                fontSize: 16,
                margin: "0 0 6px",
              },
            },
            "Remove from live roster?",
          ),
          React.createElement(
            "p",
            {
              style: {
                color: c.textSec,
                fontSize: 12,
                margin: "0 0 8px",
                lineHeight: 1.5,
              },
            },
            "Delete ",
            React.createElement(
              "strong",
              {
                style: {
                  color: c.text,
                },
              },
              modal.data.name,
            ),
            " from the current students list?",
          ),
          (() => {
            const dc = LLQABooking.studentCells(
              teachers || [],
              current.find((s) => String(s.id) === String(modal.data.id)) || modal.data,
            );
            return dc.length
              ? React.createElement(
                  "div",
                  {
                    style: {
                      padding: "8px 12px",
                      background: c.successBg,
                      border: "1px solid " + c.success + "44",
                      borderRadius: 8,
                      marginBottom: 10,
                      textAlign: "left",
                      color: c.success,
                      fontSize: 11,
                      lineHeight: 1.5,
                    },
                  },
                  "\u2713 " + dc.length + " timetable slot" + (dc.length === 1 ? "" : "s") + " will be freed automatically:",
                  React.createElement(
                    "div",
                    { style: { whiteSpace: "pre-line", color: c.textSec, marginTop: 4 } },
                    LLQABooking.cellsText(dc),
                  ),
                )
              : null;
          })(),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                background: c.accentBg,
                border: "1px solid " + c.accent + "33",
                borderRadius: 8,
                marginBottom: 16,
                textAlign: "left",
              },
            },
            React.createElement(Shield, {
              size: 14,
              color: c.accent,
              style: {
                flexShrink: 0,
                marginTop: 1,
              },
            }),
            React.createElement(
              "span",
              {
                style: {
                  color: c.textSec,
                  fontSize: 10,
                  lineHeight: 1.5,
                },
              },
              "This record is preserved permanently in ",
              React.createElement(
                "strong",
                {
                  style: {
                    color: c.accent,
                  },
                },
                "Sales Master Data",
              ),
              " and will be marked \u201CRemoved from system.\u201D Nothing is lost.",
            ),
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                gap: 10,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                variant: "danger",
                icon: Trash2,
                onClick: doDelete,
              },
              "Remove",
            ),
          ),
        ),
      ),
    modal &&
      (modal.type === "refAdd" || modal.type === "refEdit") &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1e3,
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
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 540,
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
                marginBottom: 16,
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                },
              },
              React.createElement(UserPlus, {
                size: 18,
                color: c.purple,
              }),
              React.createElement(
                "h3",
                {
                  style: {
                    color: c.text,
                    fontSize: 16,
                    margin: 0,
                  },
                },
                modal.type === "refEdit" ? "Edit Referral" : "Add Referral",
              ),
            ),
            React.createElement(
              "button",
              {
                onClick: () => setModal(null),
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
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 14px",
              },
            },
            React.createElement(Inp, {
              label: "New Student Name *",
              value: refForm.studentName || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  studentName: v,
                }),
              placeholder: "Who is being referred",
            }),
            React.createElement(Inp, {
              label: "Referred By",
              value: refForm.referredBy || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  referredBy: v,
                }),
              placeholder: "Existing parent / student",
            }),
            React.createElement(Inp, {
              label: "Relationship",
              value: refForm.relationship || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  relationship: v,
                }),
              placeholder: "Sibling, friend, cousin...",
            }),
            React.createElement(Inp, {
              label: "Contact (Phone / Email)",
              value: refForm.contact || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  contact: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Country",
              value: refForm.country || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  country: v,
                }),
            }),
            React.createElement(Inp, {
              label: "State / Region",
              value: refForm.state || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  state: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Course Interested",
              value: refForm.course || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  course: v,
                }),
            }),
            React.createElement(Inp, {
              label: "Referral Date",
              value: refForm.date || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  date: v,
                }),
              type: "date",
            }),
            React.createElement(Inp, {
              label: "Status",
              value: refForm.status || "New",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  status: v,
                }),
              options: REF_STATUSES,
            }),
            React.createElement(Inp, {
              label: "Referral Reward",
              value: refForm.reward || "",
              onChange: (v) =>
                setRefForm({
                  ...refForm,
                  reward: v,
                }),
              placeholder: "Discount, gift, etc.",
            }),
          ),
          React.createElement(Inp, {
            label: "Notes",
            value: refForm.notes || "",
            onChange: (v) =>
              setRefForm({
                ...refForm,
                notes: v,
              }),
            placeholder: "Optional notes about this referral",
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 14,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                icon: Check,
                onClick: saveRef,
              },
              modal.type === "refEdit" ? "Save Changes" : "Add Referral",
            ),
          ),
        ),
      ),
    modal &&
      modal.type === "refDelete" &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1e3,
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
              background: c.bgCard,
              backdropFilter: "blur(16px)",
              boxShadow: c.shadow3d,
              border: "1px solid " + c.border,
              borderRadius: 14,
              padding: 24,
              width: 400,
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: 48,
                height: 48,
                borderRadius: 12,
                background: c.dangerBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              },
            },
            React.createElement(Trash2, {
              size: 22,
              color: c.danger,
            }),
          ),
          React.createElement(
            "h3",
            {
              style: {
                color: c.text,
                fontSize: 16,
                margin: "0 0 6px",
              },
            },
            "Delete this referral?",
          ),
          React.createElement(
            "p",
            {
              style: {
                color: c.textSec,
                fontSize: 12,
                margin: "0 0 16px",
                lineHeight: 1.5,
              },
            },
            "Remove the referral entry for ",
            React.createElement(
              "strong",
              {
                style: {
                  color: c.text,
                },
              },
              modal.data.studentName,
            ),
            "? This cannot be undone.",
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                gap: 10,
              },
            },
            React.createElement(
              Btn,
              {
                variant: "outline",
                onClick: () => setModal(null),
              },
              "Cancel",
            ),
            React.createElement(
              Btn,
              {
                variant: "danger",
                icon: Trash2,
                onClick: doDeleteRef,
              },
              "Delete",
            ),
          ),
        ),
      ),
  );
};
