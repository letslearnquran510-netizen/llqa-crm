const TrainingMod = ({
  teachers,
  trainingPrograms,
  setTrainingPrograms
}) => {
  const [tab, setTab] = useState("programs");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [attInput, setAttInput] = useState("");
  const CATS = ["Onboarding", "Tajweed & Recitation", "Teaching Pedagogy", "Technology/Tools", "Compliance & Policy", "Soft Skills", "Curriculum", "Other"];
  const PSTATUS = ["Scheduled", "In Progress", "Completed", "Cancelled"];
  const ASTATUS = ["Enrolled", "Completed", "Failed", "Absent"];
  const tList = (teachers || []).filter(t => t.status !== "resigned" && t.status !== "terminated");
  const progs = trainingPrograms || [];
  const num = n => Number(n || 0);
  const today = todayPK();
  const thisMonth = today.slice(0, 7);
  const allAtt = progs.flatMap(p => (p.attendees || []).map(a => ({
    ...a,
    program: p.topic,
    programId: p.id,
    date: p.date,
    trainer: p.trainer,
    category: p.category,
    duration: num(p.duration)
  })));
  const certified = allAtt.filter(a => a.status === "Completed");
  const completedProgs = progs.filter(p => p.status === "Completed");
  const hoursDelivered = completedProgs.reduce((a, p) => a + num(p.duration), 0);
  const totalEnroll = allAtt.length;
  const complRate = totalEnroll > 0 ? Math.round(certified.length / totalEnroll * 100) : 0;
  const oAdd = () => {
    setForm({
      topic: "",
      category: "Onboarding",
      trainer: "",
      date: todayPK(),
      duration: "",
      status: "Scheduled",
      materials: "",
      notes: "",
      attendees: []
    });
    setAttInput("");
    setModal({
      type: "add"
    });
  };
  const oEdit = p => {
    setForm({
      ...p,
      attendees: (p.attendees || []).map(a => ({
        ...a
      }))
    });
    setAttInput("");
    setModal({
      type: "edit",
      data: p
    });
  };
  const save = () => {
    if (!form.topic || !form.topic.trim()) {
      alert("Please enter a training topic.");
      return;
    }
    const rec = {
      ...form,
      duration: num(form.duration)
    };
    if (modal.type === "edit") setTrainingPrograms(progs.map(p => p.id === form.id ? rec : p));else setTrainingPrograms([...progs, {
      ...rec,
      id: Date.now()
    }]);
    setModal(null);
  };
  const oDel = p => setModal({
    type: "del",
    data: p
  });
  const doDel = () => {
    setTrainingPrograms(progs.filter(p => p.id !== modal.data.id));
    setModal(null);
  };
  const addAtt = () => {
    const nm = attInput.trim();
    if (!nm) return;
    const t = tList.find(x => x.name === nm);
    setForm({
      ...form,
      attendees: [...(form.attendees || []), {
        name: nm,
        teacherId: t ? t.id : null,
        status: "Enrolled",
        score: ""
      }]
    });
    setAttInput("");
  };
  const updAtt = (i, k, v) => {
    const arr = [...(form.attendees || [])];
    arr[i] = {
      ...arr[i],
      [k]: v
    };
    setForm({
      ...form,
      attendees: arr
    });
  };
  const rmAtt = i => setForm({
    ...form,
    attendees: (form.attendees || []).filter((x, j) => j !== i)
  });
  const matchS = vals => {
    if (!search) return true;
    const q = search.toLowerCase();
    return vals.some(x => String(x || "").toLowerCase().includes(q));
  };
  const pStColor = {
    Scheduled: "accent",
    "In Progress": "warn",
    Completed: "success",
    Cancelled: "danger"
  };
  const aStColor = {
    Enrolled: "accent",
    Completed: "success",
    Failed: "danger",
    Absent: "warn"
  };
  const thS = {
    padding: "9px 10px",
    textAlign: "left",
    color: c.textSec,
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    borderBottom: "1px solid " + c.border,
    background: c.bgDeep,
    whiteSpace: "nowrap"
  };
  const tdS = {
    padding: "8px 10px",
    color: c.textSec
  };
  const Table = (rows, cols, empty) => React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: 10,
      border: "1px solid " + c.border
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 11
    }
  }, React.createElement("thead", null, React.createElement("tr", null, cols.map((col, ci) => React.createElement("th", {
    key: ci,
    style: thS
  }, col.h)))), React.createElement("tbody", null, rows.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: cols.length,
    style: {
      padding: 32,
      textAlign: "center",
      color: c.textMuted,
      fontSize: 12
    }
  }, empty)) : rows.map((r, ri) => React.createElement("tr", {
    key: ri,
    style: {
      borderBottom: "1px solid " + c.border,
      background: ri % 2 ? c.bgDeep + "88" : "transparent"
    }
  }, cols.map((col, ci) => React.createElement("td", {
    key: ci,
    style: {
      ...tdS,
      ...(col.tdStyle || {})
    }
  }, col.render(r))))))));
  const mLabel = m => {
    const d = new Date(m + "-01T00:00:00");
    return isNaN(d) ? m : d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  };
  const tabs = [["programs", "Programs"], ["certified", "Certified Graduates"], ["calendar", "Calendar"], ["matrix", "Skills Matrix"], ["analytics", "Analytics"]];
  const exportCSV = () => {
    const safe = v => '"' + String(v == null ? "" : v).split('"').join('""') + '"';
    let cols, rows, name;
    if (tab === "certified") {
      cols = ["Name", "Program", "Category", "Completion Date", "Score", "Trainer"];
      rows = certified.filter(a2 => matchS([a2.name, a2.program, a2.trainer])).map(a2 => [a2.name, a2.program, a2.category, a2.date, a2.score, a2.trainer]);
      name = "Certified-Graduates";
    } else if (tab === "matrix") {
      cols = ["Person", "Programs Enrolled", "Completed", "Training Hours", "Last Training"];
      const g = matrixData();
      rows = g.map(x => [x.name, x.enrolled, x.completed, x.hours, x.last]);
      name = "Skills-Matrix";
    } else {
      cols = ["Topic", "Category", "Trainer", "Date", "Duration (h)", "Attendees", "Completed", "Status", "Materials", "Notes"];
      rows = progs.filter(p => matchS([p.topic, p.trainer, p.category])).map(p => [p.topic, p.category, p.trainer, p.date, num(p.duration), (p.attendees || []).length, (p.attendees || []).filter(a2 => a2.status === "Completed").length, p.status, p.materials, p.notes]);
      name = "Training-Programs";
    }
    let csv = cols.join(",") + "\n";
    rows.forEach(r => {
      csv += r.map(safe).join(",") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const matrixData = () => {
    const g = {};
    allAtt.forEach(a => {
      const k = a.name || "\u2014";
      if (!g[k]) g[k] = {
        name: k,
        enrolled: 0,
        completed: 0,
        hours: 0,
        last: ""
      };
      g[k].enrolled++;
      if (a.status === "Completed") {
        g[k].completed++;
        g[k].hours += num(a.duration);
        if (a.date > g[k].last) g[k].last = a.date;
      }
    });
    return Object.values(g).sort((a, b) => b.completed - a.completed);
  };
  let content;
  if (tab === "programs") {
    let rows = progs;
    if (fStatus !== "all") rows = rows.filter(p => p.status === fStatus);
    rows = rows.filter(p => matchS([p.topic, p.trainer, p.category])).sort((a, b) => String(a.date) < String(b.date) ? 1 : -1);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: BookOpen,
      label: "Total Programs",
      value: progs.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Calendar,
      label: "Scheduled",
      value: progs.filter(p => p.status === "Scheduled").length,
      color: c.cyan
    }), React.createElement(SC, {
      icon: CheckCircle,
      label: "Completed",
      value: completedProgs.length,
      color: c.success
    }), React.createElement(SC, {
      icon: Clock,
      label: "Hours Delivered",
      value: hoursDelivered,
      color: c.purple
    })), Table(rows, [{
      h: "Topic",
      render: p => React.createElement("div", null, React.createElement("div", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, p.topic || "\u2014"), React.createElement("div", {
        style: {
          fontSize: 10,
          color: c.textMuted
        }
      }, p.category || ""))
    }, {
      h: "Trainer",
      render: p => p.trainer || "\u2014"
    }, {
      h: "Date",
      render: p => p.date || "\u2014"
    }, {
      h: "Hrs",
      render: p => num(p.duration) || "\u2014"
    }, {
      h: "Attendees",
      render: p => {
        const at = p.attendees || [];
        const done = at.filter(a => a.status === "Completed").length;
        return React.createElement("span", null, React.createElement("span", {
          style: {
            color: c.text,
            fontWeight: 600
          }
        }, at.length), at.length > 0 && React.createElement("span", {
          style: {
            fontSize: 10,
            color: c.success,
            marginLeft: 5
          }
        }, done + " done"));
      }
    }, {
      h: "Status",
      render: p => React.createElement(Badge, {
        text: p.status || "Scheduled",
        color: pStColor[p.status]
      })
    }, {
      h: "",
      tdStyle: {
        whiteSpace: "nowrap"
      },
      render: p => React.createElement("span", null, p.materials && React.createElement("a", {
        href: p.materials,
        target: "_blank",
        rel: "noopener noreferrer",
        title: "Materials",
        style: {
          color: c.cyan,
          padding: 3,
          display: "inline-block"
        }
      }, React.createElement(BookOpen, {
        size: 14
      })), React.createElement("button", {
        onClick: () => oEdit(p),
        title: "Edit / manage attendees",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.warn
        }
      }, React.createElement(Edit2, {
        size: 14
      })), React.createElement("button", {
        onClick: () => oDel(p),
        title: "Delete",
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: c.danger
        }
      }, React.createElement(Trash2, {
        size: 14
      })))
    }], "No training programs yet. Click \u201CNew Program\u201D to schedule one and enroll teachers."));
  } else if (tab === "certified") {
    const rows = certified.filter(a => matchS([a.name, a.program, a.trainer])).sort((a, b) => String(a.date) < String(b.date) ? 1 : -1);
    const scores = certified.map(a => num(a.score)).filter(s => s > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Award,
      label: "Certifications",
      value: certified.length,
      color: c.success
    }), React.createElement(SC, {
      icon: Users,
      label: "People Certified",
      value: new Set(certified.map(a => a.name)).size,
      color: c.accent
    }), React.createElement(SC, {
      icon: Calendar,
      label: "This Month",
      value: certified.filter(a => String(a.date || "").slice(0, 7) === thisMonth).length,
      color: c.cyan
    }), React.createElement(SC, {
      icon: Star,
      label: "Avg Score",
      value: avgScore ? avgScore + "%" : "\u2014",
      color: c.purple
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: c.successBg,
        border: "1px solid " + c.success + "33",
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        color: c.textSec
      }
    }, React.createElement(Award, {
      size: 14,
      color: c.success
    }), React.createElement("span", null, "Auto-generated from every attendee marked ", React.createElement("strong", {
      style: {
        color: c.success
      }
    }, "Completed"), " in a program \u2014 mark completion inside a program and it appears here instantly.")), Table(rows, [{
      h: "Name",
      render: a => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, a.name)
    }, {
      h: "Program",
      render: a => React.createElement("span", {
        style: {
          color: c.cyan
        }
      }, a.program)
    }, {
      h: "Category",
      render: a => React.createElement(Badge, {
        text: a.category || "\u2014",
        color: "purple"
      })
    }, {
      h: "Completed",
      render: a => a.date || "\u2014"
    }, {
      h: "Score",
      render: a => num(a.score) > 0 ? React.createElement("span", {
        style: {
          fontWeight: 600,
          color: num(a.score) >= 70 ? c.success : c.warn
        }
      }, a.score + "%") : "\u2014"
    }, {
      h: "Trainer",
      render: a => a.trainer || "\u2014"
    }], "No certified graduates yet \u2014 mark attendees as Completed in a program."));
  } else if (tab === "calendar") {
    const upcoming = progs.filter(p => p.status === "Scheduled" || p.status === "In Progress").filter(p => matchS([p.topic, p.trainer])).sort((a, b) => String(a.date) < String(b.date) ? -1 : 1);
    const week = upcoming.filter(p => {
      if (!p.date) return false;
      const d = Math.round((new Date(p.date + "T00:00:00") - new Date(today + "T00:00:00")) / 864e5);
      return d >= 0 && d <= 7;
    });
    const next = upcoming.find(p => p.date >= today);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Calendar,
      label: "Upcoming Programs",
      value: upcoming.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Clock,
      label: "Within 7 Days",
      value: week.length,
      color: c.warn
    }), React.createElement(SC, {
      icon: BookOpen,
      label: "Next Session",
      value: next ? next.date : "\u2014",
      sub: next ? next.topic : "",
      color: c.cyan
    })), Table(upcoming, [{
      h: "Date",
      render: p => {
        const d = p.date ? Math.round((new Date(p.date + "T00:00:00") - new Date(today + "T00:00:00")) / 864e5) : null;
        return React.createElement("div", null, React.createElement("div", {
          style: {
            fontWeight: 600,
            color: c.text
          }
        }, p.date || "\u2014"), d !== null && React.createElement("div", {
          style: {
            fontSize: 10,
            color: d <= 7 ? c.warn : c.textMuted
          }
        }, d === 0 ? "today" : d < 0 ? Math.abs(d) + "d ago" : "in " + d + "d"));
      }
    }, {
      h: "Topic",
      render: p => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, p.topic)
    }, {
      h: "Category",
      render: p => React.createElement(Badge, {
        text: p.category || "\u2014",
        color: "purple"
      })
    }, {
      h: "Trainer",
      render: p => p.trainer || "\u2014"
    }, {
      h: "Duration",
      render: p => num(p.duration) ? num(p.duration) + " h" : "\u2014"
    }, {
      h: "Enrolled",
      render: p => (p.attendees || []).length
    }, {
      h: "Status",
      render: p => React.createElement(Badge, {
        text: p.status,
        color: pStColor[p.status]
      })
    }], "No upcoming programs scheduled."));
  } else if (tab === "matrix") {
    const data = matrixData().filter(x => matchS([x.name]));
    const trainedNames = new Set(allAtt.map(a => a.name));
    const untrained = tList.filter(t => !trainedNames.has(t.name)).length;
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: Users,
      label: "People Trained",
      value: data.length,
      color: c.accent
    }), React.createElement(SC, {
      icon: Target,
      label: "Untrained Teachers",
      value: untrained,
      color: untrained ? c.warn : c.success
    }), React.createElement(SC, {
      icon: BookOpen,
      label: "Total Enrollments",
      value: totalEnroll,
      color: c.cyan
    }), React.createElement(SC, {
      icon: Clock,
      label: "Hours Delivered",
      value: hoursDelivered,
      color: c.purple
    })), React.createElement("div", {
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
        color: c.textSec
      }
    }, React.createElement(Target, {
      size: 14,
      color: c.accent
    }), React.createElement("span", null, "Per-person training coverage \u2014 who has completed what. Use it to spot ", React.createElement("strong", {
      style: {
        color: c.warn
      }
    }, untrained + " teacher(s) with no training yet"), ".")), Table(data, [{
      h: "Person",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, x.name)
    }, {
      h: "Enrolled",
      render: x => x.enrolled
    }, {
      h: "Completed",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.success
        }
      }, x.completed)
    }, {
      h: "Training Hours",
      render: x => React.createElement("span", {
        style: {
          color: c.purple
        }
      }, x.hours + " h")
    }, {
      h: "Coverage",
      render: x => React.createElement("div", {
        style: {
          width: 110,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (x.enrolled ? Math.round(x.completed / x.enrolled * 100) : 0) + "%",
          height: "100%",
          background: c.success
        }
      }))
    }, {
      h: "Last Training",
      render: x => x.last || "\u2014"
    }], "No training records yet."));
  } else {
    const byStatus = PSTATUS.map(s => ({
      s,
      n: progs.filter(p => p.status === s).length
    }));
    const catG = {};
    progs.forEach(p => {
      const k = p.category || "Other";
      catG[k] = (catG[k] || 0) + 1;
    });
    const cats = Object.keys(catG).map(k => ({
      cat: k,
      n: catG[k]
    })).sort((a, b) => b.n - a.n);
    const trG = {};
    completedProgs.forEach(p => {
      const k = p.trainer || "\u2014";
      if (!trG[k]) trG[k] = {
        trainer: k,
        n: 0,
        h: 0
      };
      trG[k].n++;
      trG[k].h += num(p.duration);
    });
    const trainers = Object.values(trG).sort((a, b) => b.h - a.h);
    content = React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14
      }
    }, React.createElement(SC, {
      icon: TrendingUp,
      label: "Completion Rate",
      value: complRate + "%",
      color: complRate >= 70 ? c.success : complRate >= 40 ? c.warn : c.danger
    }), React.createElement(SC, {
      icon: Clock,
      label: "Training Hours",
      value: hoursDelivered,
      color: c.accent
    }), React.createElement(SC, {
      icon: Award,
      label: "Top Trainer",
      value: trainers.length ? trainers[0].trainer : "\u2014",
      sub: trainers.length ? trainers[0].h + " h" : "",
      color: c.purple
    }), React.createElement(SC, {
      icon: BarChart3,
      label: "Top Category",
      value: cats.length ? cats[0].cat : "\u2014",
      color: c.cyan
    })), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14
      }
    }, React.createElement("div", null, React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 8px"
      }
    }, "Programs by Status"), Table(byStatus, [{
      h: "Status",
      render: x => React.createElement(Badge, {
        text: x.s,
        color: pStColor[x.s]
      })
    }, {
      h: "Count",
      render: x => x.n
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 90,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (progs.length ? Math.round(x.n / progs.length * 100) : 0) + "%",
          height: "100%",
          background: c.accent
        }
      }))
    }], "\u2014")), React.createElement("div", null, React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "0 0 8px"
      }
    }, "By Category"), Table(cats, [{
      h: "Category",
      render: x => React.createElement("span", {
        style: {
          color: c.text
        }
      }, x.cat)
    }, {
      h: "Programs",
      render: x => x.n
    }, {
      h: "Share",
      render: x => React.createElement("div", {
        style: {
          width: 90,
          height: 6,
          background: c.bgDeep,
          borderRadius: 3,
          overflow: "hidden"
        }
      }, React.createElement("div", {
        style: {
          width: (progs.length ? Math.round(x.n / progs.length * 100) : 0) + "%",
          height: "100%",
          background: c.cyan
        }
      }))
    }], "\u2014"))), React.createElement("h3", {
      style: {
        color: c.text,
        fontSize: 13,
        margin: "16px 0 8px"
      }
    }, "Trainer Leaderboard (completed programs)"), Table(trainers, [{
      h: "Trainer",
      render: x => React.createElement("span", {
        style: {
          fontWeight: 600,
          color: c.text
        }
      }, x.trainer)
    }, {
      h: "Programs",
      render: x => x.n
    }, {
      h: "Hours Delivered",
      render: x => React.createElement("span", {
        style: {
          color: c.purple
        }
      }, x.h + " h")
    }], "No completed programs yet."));
  }
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: c.purple + "22",
      border: "1px solid " + c.purple + "55",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(Award, {
    size: 24,
    color: c.purple
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 200
    }
  }, React.createElement("h1", {
    style: {
      color: c.text,
      margin: 0,
      fontSize: 22,
      fontWeight: 700
    }
  }, "Training & Development"), React.createElement("div", {
    style: {
      color: c.textSec,
      fontSize: 11,
      marginTop: 4
    }
  }, "Programs, certifications, skills matrix & analytics \u2014 fully automated")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(Btn, {
    icon: Plus,
    onClick: oAdd
  }, "New Program"), React.createElement(Btn, {
    variant: "outline",
    icon: Download,
    onClick: exportCSV
  }, "Export"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: c.bgDeep,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
      flexWrap: "wrap"
    }
  }, tabs.map(([k, l]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      padding: "8px 14px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 600,
      background: tab === k ? c.accent : "transparent",
      color: tab === k ? c.accentText : c.textSec
    }
  }, l))), (tab === "programs" || tab === "certified" || tab === "calendar" || tab === "matrix") && React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 200
    }
  }, React.createElement(Search, {
    size: 14,
    style: {
      position: "absolute",
      left: 10,
      top: 9,
      color: c.textMuted
    }
  }), React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search topic, person, trainer, category...",
    style: {
      width: "100%",
      padding: "8px 12px 8px 30px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 12,
      outline: "none",
      boxSizing: "border-box"
    }
  })), tab === "programs" && React.createElement("select", {
    value: fStatus,
    onChange: e => setFStatus(e.target.value),
    style: {
      padding: "8px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 7,
      color: c.text,
      fontSize: 11
    }
  }, [React.createElement("option", {
    key: "all",
    value: "all"
  }, "All Statuses"), ...PSTATUS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))])), content, modal && (modal.type === "add" || modal.type === "edit") && React.createElement("div", {
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
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 600,
      maxHeight: "90vh",
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement(Award, {
    size: 18,
    color: c.purple
  }), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: 0
    }
  }, modal.type === "edit" ? "Edit Program & Attendees" : "New Training Program")), React.createElement("button", {
    onClick: () => setModal(null),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.textSec
    }
  }, React.createElement(X, {
    size: 18
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 14px"
    }
  }, React.createElement(Inp, {
    label: "Topic *",
    value: form.topic || "",
    onChange: v => setForm({
      ...form,
      topic: v
    }),
    placeholder: "e.g. Advanced Tajweed Workshop"
  }), React.createElement(Inp, {
    label: "Category",
    value: form.category || "",
    onChange: v => setForm({
      ...form,
      category: v
    }),
    options: CATS
  }), React.createElement(Inp, {
    label: "Trainer",
    value: form.trainer || "",
    onChange: v => setForm({
      ...form,
      trainer: v
    }),
    placeholder: "Trainer name"
  }), React.createElement(Inp, {
    label: "Status",
    value: form.status || "Scheduled",
    onChange: v => setForm({
      ...form,
      status: v
    }),
    options: PSTATUS
  }), React.createElement(Inp, {
    label: "Date",
    value: form.date || "",
    onChange: v => setForm({
      ...form,
      date: v
    }),
    type: "date"
  }), React.createElement(Inp, {
    label: "Duration (hours)",
    value: form.duration || "",
    onChange: v => setForm({
      ...form,
      duration: v
    }),
    type: "number",
    placeholder: "e.g. 2"
  }), React.createElement(Inp, {
    label: "Materials (link)",
    value: form.materials || "",
    onChange: v => setForm({
      ...form,
      materials: v
    }),
    placeholder: "https://..."
  })), React.createElement(Inp, {
    label: "Notes",
    value: form.notes || "",
    onChange: v => setForm({
      ...form,
      notes: v
    }),
    placeholder: "Agenda / objectives"
  }), React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "12px",
      background: c.bgDeep,
      borderRadius: 10,
      border: "1px solid " + c.border
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: c.text,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "Attendees & Completion (" + (form.attendees || []).length + ")"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 10
    }
  }, React.createElement("input", {
    list: "ttTeachers",
    value: attInput,
    onChange: e => setAttInput(e.target.value),
    placeholder: "Type or pick a teacher / candidate name",
    style: {
      flex: 1,
      padding: "7px 10px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 12,
      outline: "none"
    }
  }), React.createElement("datalist", {
    id: "ttTeachers"
  }, tList.map(t => React.createElement("option", {
    key: t.id,
    value: t.name
  }))), React.createElement(Btn, {
    icon: Plus,
    onClick: addAtt
  }, "Add")), (form.attendees || []).length === 0 ? React.createElement("div", {
    style: {
      fontSize: 11,
      color: c.textMuted,
      padding: "6px 0"
    }
  }, "No attendees yet. Add teachers or candidates, then set each one's completion status and score.") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, (form.attendees || []).map((a, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 12,
      color: c.text,
      fontWeight: 500,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, a.name), React.createElement("select", {
    value: a.status,
    onChange: e => updAtt(i, "status", e.target.value),
    style: {
      padding: "5px 7px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 11
    }
  }, ASTATUS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))), React.createElement("input", {
    value: a.score || "",
    onChange: e => updAtt(i, "score", e.target.value),
    type: "number",
    placeholder: "%",
    title: "Score",
    style: {
      width: 56,
      padding: "5px 7px",
      background: c.bgInput,
      border: "1px solid " + c.border,
      borderRadius: 6,
      color: c.text,
      fontSize: 11
    }
  }), React.createElement("button", {
    onClick: () => rmAtt(i),
    title: "Remove",
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: c.danger,
      padding: 3
    }
  }, React.createElement(X, {
    size: 14
  })))))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 16
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    icon: Check,
    onClick: save
  }, modal.type === "edit" ? "Save Program" : "Create Program")))), modal && modal.type === "del" && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)"
    }
  }, React.createElement("div", {
    style: {
      background: c.bgCard,
      backdropFilter: "blur(16px)",
      boxShadow: c.shadow3d,
      border: "1px solid " + c.border,
      borderRadius: 14,
      padding: 24,
      width: 400,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: c.dangerBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 12px"
    }
  }, React.createElement(Trash2, {
    size: 22,
    color: c.danger
  })), React.createElement("h3", {
    style: {
      color: c.text,
      fontSize: 16,
      margin: "0 0 6px"
    }
  }, "Delete this program?"), React.createElement("p", {
    style: {
      color: c.textSec,
      fontSize: 12,
      margin: "0 0 16px",
      lineHeight: 1.5
    }
  }, "Remove ", React.createElement("strong", {
    style: {
      color: c.text
    }
  }, modal.data.topic), " and its ", (modal.data.attendees || []).length, " attendee record(s)? This cannot be undone."), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 10
    }
  }, React.createElement(Btn, {
    variant: "outline",
    onClick: () => setModal(null)
  }, "Cancel"), React.createElement(Btn, {
    variant: "danger",
    icon: Trash2,
    onClick: doDel
  }, "Delete")))));
};

