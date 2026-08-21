const ConnectionBadge = () => {
  const {
    online,
    fbReady
  } = useConnectionStatus();
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);
  const status = !online ? "offline" : fbReady ? "live" : "local";
  const cfg = {
    live: {
      col: c.success,
      label: "Live · Cloud",
      desc: "Real-time sync active"
    },
    local: {
      col: c.warn,
      label: "Local Mode",
      desc: "Firebase not configured"
    },
    offline: {
      col: c.danger,
      label: "Offline",
      desc: "No internet connection"
    }
  }[status];
  return React.createElement("div", {
    title: cfg.desc,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      background: cfg.col + "22",
      border: "1px solid " + cfg.col + "44",
      borderRadius: 14,
      fontSize: 9,
      color: cfg.col,
      fontWeight: 600
    }
  }, React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: cfg.col,
      opacity: pulse ? 1 : 0.4,
      transition: "opacity 0.5s"
    }
  }), cfg.label);
};

