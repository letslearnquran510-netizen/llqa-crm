class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        "div",
        {
          style: {
            padding: 40,
            color: "#ef4444",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 12,
            margin: 20,
            fontFamily: "monospace",
          },
        },
        React.createElement("h3", { style: { marginTop: 0 } }, "Module Error"),
        React.createElement("p", null, "This tab crashed, but the rest of the CRM is still running."),
        React.createElement("p", { style: { fontSize: 11, opacity: 0.8 } }, String(this.state.error)),
        React.createElement(
          "button",
          {
            onClick: () => this.setState({ hasError: false, error: null }),
            style: {
              marginTop: 15,
              padding: "8px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            },
          },
          "Try Again"
        )
      );
    }
    return this.props.children;
  }
}
